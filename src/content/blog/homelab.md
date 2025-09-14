---
title: How I Built a Homelab That Manages Itself
description: From manual port juggling to automated domain creation with Docker events and Python
pubDate: 9/14/2025
heroImage: /blog/homelab.png
---

When I moved into a new house, I found myself staring at an old Dell OptiPlex that wasn't being used for anything. I had picked it up from my university's computer recycling center ages ago, and though I used it quite a bit back then it's been sitting in a corner for several years now collecting dust. I decided that it was the perfect system to use as my first home server! My initial goal was simple: set up AdGuard Home to block ads across my entire network. What I didn't expect was how quickly that single service would spiral into a full-blown homelab obsession.

## Starting Simple: AdGuard and Media Management

Getting AdGuard Home running was straightforward enough. I chose Docker from the start because I was already comfortable with it, and I really didn't want to pollute my base Debian installation with packages from failed experiments. I just set up a docker-compose file, followed the config instructions on the AdGuard website, and that was that.

Once AdGuard was humming along, I got excited about setting up a media management stack - several related services that work together to automatically organize and serve my media library. I knew from the start that this was going to involve some trial and error, and SSHing into the machine every time I wanted to tweak something sounded tedious. That's when I discovered Portainer - a web interface for managing Docker containers that would let me spin up new services by editing the compose file via a web interface, and restart them at the click of a button. Using Portainer, it's much easier for me to manage different application stacks all in the same place, rather than having compose files spread across my filesystem.

## Enter Nginx Proxy Manager

Initially, I had each service exposed on a different port on the host machine. One service on 8989, another on 7878, my media server on 8096 - you get the idea. I was mostly able to remember them all, but I wanted proper domain names instead of memorizing port numbers. After some research, I settled on Nginx Proxy Manager (NPM) for the same reason I chose Portainer - I wanted a web interface instead of editing nginx config files and restarting containers every time I made a change.

I added Nginx Proxy Manager as a container to my homelab's core docker-compose file, configured AdGuard Home do redirect all traffic for `*.home` to my server, and set up my domains via the web interface. Now any device that's configured to use my server as its DNS will be able to resolve my custom domains to the appropraite services! (Unfortunately I still haven't managed to get my router to use AdGuard as its DNS correctly, so for now I do still have to manually set DNS on each device.)

## The Port Collision Problem

As I added more services, I started worrying about port conflicts. It became tedious having to come up with a new unused port number every time I created a new container. That's when I learned about Docker's automatic port assignment: just specify the container port and let Docker pick a random host port. Of course, some ports can't be randomized - AdGuard Home needs port 53 for DNS, and NPM needs ports 80 and 443 for HTTP/HTTPS traffic. But for everything else, letting Docker handle port assignment eliminates conflicts entirely.

This solved the collision problem but created a new one: I had no idea which port Docker had assigned to what service until after the container started and I could check. That wouldn't be the end of the world, except that every time the container restarted it would get another new port and I'd have to update the NPM hosts again. Somehow this felt _worse_ than manually picking a port for each service.

## NPM Automation

My first solution was a Python script that polled the Portainer API every 5 minutes to check for changes and update NPM accordingly. It looked at all of the containers being managed by Portainer, and checked for two magic labels: `npm.enable`, and `npm.port`. If the first is set to `true`, it checks what host port is mapped to the port indicated by `npm.port` and uses the NPM API to create a host at `[serviceName].home` that points to the server at the given port. I had initially used `.local`, but later relized that mDNS uses that namespace, and I didn't want to conflict with any other devices on my network.

The polling approach worked, but the 5-minute delay was not ideal. Every time I restarted a container, it would get assigned a new random port, and I would either have to wait 5 minutes for it to get picked up or manually restart my configurator container, which defeated the entire purpose of having it be automated. I decided I needed real-time updates instead of polling.

I knew some kind of real-time API had to exist because Portainer was clearly getting live updates somehow. That's when I discovered Docker's events API. Containers emit events when they start, stop, or change, and you can listen to that stream in real-time instead of polling. I updated my script to use the Docker SDK to listen to events instead of polling, and it greatly improved my experience.

## Exposing Services to the Internet

Eventually I wanted to share some of my services with friends. I updated my host automation to also configure optional extra domains so that incoming traffic to my network would get routed to the appropriate services. This made it really easy to share services with my friends. All I had to do was add a label to the service, configure my domain to point to my public IP, and that's it!

Recently I have been experimenting with Cloudflare Tunnels to expose services without opening ports on my router. This works great for HTTP services, but for arbitrary TCP traffic I still need to use port forwarding.

## Lessons Learned

The key takeaway from this project was that the best automation is the kind you forget exists. The automation has held up remarkably well as I have scaled from a handful of services to dozens. The only time I need to think about networking anymore is when I'm adding the initial labels to a new container. Everything else just works.

The Dell OptiPlex is still working without issue. I have upgraded it here and there - more memory, an old video card for hardware transcoding - but it's been rock solid. It's always nice to repurpose old hardware to do something new and genuinely useful.
