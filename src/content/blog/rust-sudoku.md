---
title: Solving Sudoku Puzzles with Rust
description: Getting some hands-on experience with Rust by implementing an extensible sudoku solving engine
pubDate: 1/21/2024
heroImage: /blog/rust-sudoku.png
---
I've always enjoyed solving pen-and-paper logic puzzles. However, Sudoku didn't truly captivate me until I discovered the [Cracking the Cryptic YouTube channel](https://www.youtube.com/c/CrackingTheCryptic). The hosts, Mark and Simon, are incredibly skilled and their content introduced me to advanced techniques for tackling challenging Sudoku puzzles. This includes everything from relatively simple strategies like hidden pairs and box/line reduction to more complex ones like x-wings and swordfish. I also discovered the fascinating world of Sudoku _variants_, which introduce additional constraints, such as anti-knight Sudoku and killer Sudoku.

I've been interested in learning Rust for a while. While reading documentation and following YouTube guides are helpful, nothing beats hands-on experience. So, I decided to create a Sudoku solver that applies the techniques I've learned to solve puzzles as efficiently as possible before resorting to backtracking.

The first step was to decide how to represent the puzzle. I chose a 2D array of an enum type that I named `Cell`. The `Cell` enum is as follows:

```rs
enum Cell {
    Solved(usize),
    Unsolved([bool; 9]),
}
```

A `usize` represents the number in a solved cell, and an array of 9 boolean values represents an unsolved cell. For the unsolved case, a value of `true` in the `n`th position means that the cell _could possibly_ be an `n` in the solved puzzle. I used `usize` for the `Solved` type to easily index into another `Unsolved` cell.

After defining the `Cell` enum, I created a `Grid` type alias to represent a full puzzle and added methods in an `impl` block to manipulate the puzzle and check if it is solved. Each method returns a `bool` indicating whether any deductions were made. For convenience, I also added a `step` method, which runs each strategy one by one until one of them succeeds in making a deduction. If no deductions are made, then it returns `false`.

```rs
type Grid = [[Cell;9];9];
impl Grid {
  /// Check if the puzzle is solved
  fn solved(&self) -> bool {/*...*/}

  /* Puzzle-solving strategies */
  fn naked_singles(&mut self) -> bool {/*...*/}
  fn basic_elimination(&mut self) -> bool {/*...*/}
  fn hidden_singles(&mut self) -> bool {/*...*/}

  /// Try all strategies one-by-one
  fn step(&mut self) -> bool {/*...*/}
}
```

To process the puzzle to completion, I wrote the following loop, which prints the grid after each deduction. If my basic strategies aren't powerful enough to take another step, I print a failure message and abandon the process.

```rs
while !grid.solved() {
  if grid.step() {
    println!("{:?}", grid);
  } else {
    println!("No dedudctions could be made");
    break
  }
}
```

At this point, the program can solve most basic Sudoku puzzles. However, my aim is to solve _all_ Sudoku puzzles. Instead of adding more advanced strategies, I chose to add a backtracking solver to continue where the logical solver left off.

The backtracker searches for the cell with the fewest possible candidates and tries each possibility one by one. Here's the pseudocode representing the backtracking logic:

```pseudocode
Make a backup of the current grid
Find cell with fewest candidates
For each candidate:
    Overwrite current grid with backup grid
    Fill in the cell
    Attempt more logical deductions until none remain
    Check if puzzle is solved
        Solved: 
            return True
        Not solved:
            Try backtracking again from this position
                Backtracking success:
                    return True
                Backtracking failure:
                    continue to next candidate
No candidate provided a valid solution, so return False
```

After some struggle with the borrow checker, I managed to get the backtracker working! Now, the solver can solve any puzzle in the world. However, solving via backtracking isn't satisfying, so I continued adding more strategies to the logical solver.

I also wanted to tackle variant puzzles. To extend the solver to handle Sudoku variants, I abstracted the solver. Not every puzzle needs to consider anti-knight rules, so just adding an `anti_knight` strategy to the solver and calling it in the `step` method wouldn't suffice. I didn't feel that passing in a big list of strategies on every step was a good solution either.

I initially tried creating `trait`s to represent different variants. I moved my implementations for my basic strategies into a new trait and created a `ChessSudoku` trait for the new variant strategies.

```rs
trait BasicSudoku {
  fn naked_singles(&mut self) -> bool;
  /* ... and so on ... */
}
trait ChessSudoku {
  fn anti_knight(&mut self) -> bool;
  /* ... and so on ... */
}
```

However, I soon realized that I didn't know how to tell the `solve` method on the `Grid` that these new methods were available. I realized that the `Grid` doesn't need to understand how to solve itself. Instead, I created a `Solver` struct that can be configured with any number of strategies at runtime and apply the step and backtrack methods to any given grid.

```rs
type Strategy = fn(&mut Grid) -> bool;
pub struct Solver {
    strategies: Vec<Strategy>,
}
impl Solver {
  pub fn new() -> Self {/* ... */}
  pub fn add_strategy(&mut self, strategy: Strategy) {/* ... */}
  pub fn step(&self, grid: &mut Grid) -> bool {/* ... */}
  pub fn backtrack(&self, grid: &mut Grid) -> bool {/* ... */}
}
```

This abstraction gave me a lot of freedom. Now, instead of having a huge `impl` block for Grid, I could break out each variant into its own module, complete with their own unit tests. Then, to solve a puzzle with those variants, I just pass the strategies into the solver and let it go!

```rs
use crate::{
    basic_sudoku::{basic_elimination, /*...*/},
    chess_strategies::{anti_knight},
    solver::Solver,
};

let mut solver = Solver::new();
solver.add_strategy(basic_elimination);
solver.add_strategy(anti_knight);
/* etc... */

while !grid.solved() {
    if solver.step(&mut grid) {
        println!("{}", grid);
    } else {
        break
    }
}
```

An added bonus is that I can now add the strategies in whatever order I want. If for some reason I want to try chess strategies before I do any basic Sudoku strategies, I'm free to decide that at runtime!

To finish up the project (for now), I used the `log` crate to add some visibility into the solving process, and `clap` to create a pretty command line utility. Overall, I'm very happy with where the project has ended up. I got in a lot of (somewhat) practical experience working with the borrow checker, I learned how to read and understand Rust's _very_ helpful compiler diagnostics, and I became more confident overall in my ability to code in Rust.

If you're interested, you can check out the project [here](https://github.com/camzach/sudoku_rs)!
