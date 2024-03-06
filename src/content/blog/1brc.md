---
title: How Fast Can I Read One Billion Rows?
description: Completing the 1BRC Challenge with Rust
pubDate: 2/29/2024
heroImage: /blog/1brc.png
---

On January 1 2024, Gunnar Morling issued the One Billion Rows Challenge: how quickly can you read one billion rows from a text file and do some simple processing on them? The challenge was intended to be completed in Java, but I decied to take it as an opportunity to get some experience with paralellism in Rust.

I began by implementing the most naive approach I could think of: read the rows one by one in a single thread, and sum things up as I went along. This would be an easy enough way to ensure I've got the basics down before I start trying to be clever.

I read the file line-by-line, parsing the station name and temperature reading from each line. Then I used the station's name to index into a Hashmap, and updated (or created, if one did not yet exist) a struct containing the information about that station, along with a method methods for updating the struct with a new reading.

```rust
struct StationInfo {
    min: f64,
    max: f64,
    sum: f64,
    count: i64,
}
impl StationInfo {
    fn update(&mut self, val: f64) {/*...*/}
}
```

At the end of the file, all I had to do was divide each station's `sum` field by its `count` field to find the average. On my machine, this took 1:44 to complete, averaging 104 nanoseconds per row. Not too bad, but we should be able to do better. It should be noted that I am measuring my program's performance with `hyperfine`, a command-line utility that runs the program several times and calculates its average speed. It also allows for a number of warmup runs to populate the disk cache, which I will be making use of here.

My next step was to try to utilize all 24 cores of my processor to parse the data faster. To do this, I created a number of `WorkerThread` structs, that each held a queue of data as well as a pointer to its `JoinHandle`. Then in the main thread, I read the file line-by-line, and passed each line into one of the threads' queues. Once each thread was done working, I could easily combine all of the data on the main thread by merging the corresponding station entries.

```rust
struct StationInfo { /*...*/ }
impl StationInfo {
    fn update(&mut self, val: f64) {/*...*/}
    fn merge(&mut self, other: &Self) {/*...*/}
}
struct WorkerThread {
    handle: JoinHandle<HashMap<String, StationInfo>>
    queue: Arc<Mutex<Vec<String>>>
}

let merged_results: HashMap<String, StationInfo> = HashMap::new();
for worker in workers {
    let result = worker.handle.join().unwrap();
    for (station, info) in result {
        merged_results.entry(station)
            .and_modify(|v| v.merge(&info))
            .or_insert(info);
    }
}
```

Unfortunately, the results here were far from ideal, jumping up to 3:22 to handle all of the data -- twice what it took to use just one thread! This is probably because of the way I implemented the queues for each thread. Each thread had an `Arc<Mutex<Vec<String>>>` to store incoming data, which meant no processing could be done until that thread acquired a lock on the `Mutex`, and no processing could be done while the main thread was holding the lock. Watching the process through `htop` I saw that the worker threads spent the majority of the program's runtime sleeping, which means the main thread was frequently reacquiring the lock to write new data before the worker thread could wake up and acquire it to process the data. To combat this, I added a `Condvar` to the `WorkerThread` struct that I used to notify the thread when an arbitrary amount of data was added to the queue. The worker threads wake up, acquire the lock immediately, and then process the information in their queue.

I played with `mpsc::channel` for a bit, thinking that I could improve performance by abandoning my own poorly written channels in favor of the implementations from the standard library, but to my surprise this actually performed significantly worse. I'm not entirely sure why, but it may have been similar to the issue that led me to implement the `Condvar` lock in the first place -- perhaps the main thread was holding a lock on the channel, preventing the worker thread from ever reading data out of it. My attempt to use channels slowed the program down so much that it wasn't able to complete the task even after an hour an a half of waiting. I decided to kill it and move on.

All that time spent waiting for locks and shuffling data around queues is costing us a _lot_ of performance. To go even faster, we need a way to split the data across threads _without_ needing to acquire a lock on the data, and ideally _without_ having to copy the data into another data structure. Luckily there exists a tool that will help us accomplish this, though it requires us to be _unsafe_ (gasp!). Using the `memmap2` crate, I can map the entire file into memory, then slice that memory up and give each thread its own non-overlapping slice to work on. This is considered unsafe because the Rust compiler cannot guarantee that the contents in that region of memory won't change unexpectedly, as any other process is free to open that file and modify it while the Rust program is running. This isn't concerning to me, so I'll just not run any other programs that modify that file while my program is running. That should make it safe enough, barring any events like my hard drive suddenly becoming dislodged from its M.2 slot. At that point, the memory-safety of my Rust program is not my primary concern!

Once the file was split, it was as simple as having each thread split up its given slice on the newline boundaries, and read the data into a HashMap just as before. Without the overhead of waiting for locks and moving data through channels, each thread could operate continuously until the entire file was processed, limited only by the transfer speed of my storage device. The only thread that ever needs to be blocked is the main thread, which must wait for all of the worker threads to be done working before merging the results together.

```rust
let memmap = unsafe { Mmap::map(&file) }.unwrap();
let chunk_size = memmap.len() / n_threads;

let mut workers: Vec<JoinHandle</*...*/>> = Vec::new();
for n in 0..n_threads {
    let slice = &memmap[n * chunk_size..(n+1) * chunk_size];
    let handle = thread::spawn(|| {
        /* process the slice */
    });
    workers.push(handle);
}
for worker in workers {
    let result = worker.join().unwrap();
    /* handle merging of resutls */
}
```

This technique resulted in a _massive_ performance boost, processing all of the data in just 6.168 seconds! Without the need to synchronize resources between threads, we're free to work as fast as we possibly can. So just _how fast_ can we go? With every available thread on my processor already working continuously, the only place left for improvement is in the details of how the lines are processed.

Right now, I'm parsing the entire line as a string, splitting it on the ";" character, then parsing the second entry as a float. But since the first part is _always_ a 3 character station name, we can just grab the first 3 bytes of the slice and avoid the extra steps of parsing the slice to a `String` and calling `String::split`. Then we can skip the 4th byte which contains the ";" divider, convert the remainder to a `&str`, and parse it as a float to get the temperature reading. Using `&str` here instead of `String` has the added benefit of not needing to copy the memory, which is likely where most of the nearly 1.5 seconds of time saved comes from.

Another small gain comes from leaving behind the convenient `Entry` API from `HashMap`. For convenience, I using the `and_modify` and `or_insert` methods to update the `StationInfo` structs stored in the map. These let you declaritively describe how you want to change the map, but switching to an `if let` block gave a modest 0.5 second improvement.

We're still copying some data around though -- the map's type is `HashMap<String, StationInfo>`, which requires us to make a copy of the station's name. But we don't need a copy if we can just reference the existing slice of memory in the memory-mapped file! Changing the map's type to `HashMap<&str, StationInfo>` saves us another second by avoiding the need to copy strings around, and since `&str` implements `Hash`, this is perfectly acceptable!

The conversion from `&[u8]` to `&str` uses `str::from_utf8`, which first validates that the slice is a valid utf8 string. If we throw away this check (and use another unsafe block), we can call `str::from_utf8_uncheked` and save another half-second, bringing the time down to just under 3 seconds!

Along those same lines, parsing the temperature value with `str::parse` provides runtime checks that ensure the string is a valid `f64`. We already know it is, so we can write our own parsing function that takes advantage of that fact, bringing the time to 2.366s!

Finally, Rust's `std::collections::HashMap` uses SipHash as its default hash implementation, which provides a level of resiliency against certan types of DoS attacks by making it difficult to predict when two keys may collide. Sice we don't need this extra security, we can instead use the `FnvHashMap` from `fnv` to cut our time down to 1.511 seconds!

I've had a few ideas for how to reduce the time further, but my attempts have all been unsuccessful. Overall, I'm extremely pleased with what I've been able to accomplish, especially considering that the winning Java program ran in just over 1.5 seconds as well! I really enjoyed the process of identifying the hot paths of the code and finding ways to make them faster. If I think of another way to possibly improve these results, I'll be sure to update this post!
