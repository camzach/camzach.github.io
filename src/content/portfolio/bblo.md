---
title: BBLO
description: Site for managing a Blood Bowl league
banner: /portfolio/bblo/bored-goblin.png
showcase: /portfolio/bblo/showcase.png
---

## Summary

BBLO (Blood Bowl League Organizer) is a project I started work on in late 2022. My friends and I were running a Blood Bowl league, and using a Google Sheets spreadsheet to keep track of all of the league info. This quickly became tedious, and I decided that building a web app to manage the league for us would be a fun project to work on!

## Features

- Create and manage Blood Bowl teams
  - Interactive and intuitive team builder
  - Ability to share a team between multiple players
  - Tooltips on hover explain specific rules and FAQ for player skills
- Interactive game scoreboard for tracking games in progress
  - Automatically calculates Team Value imbalance and awards petty cash to compensate
  - In case of a game stoppage or technical issue, in-progress games can be saved and linked to
  - Player info for each team available for quick reference
  - Customizable touchdown songs for each team
- Automatic round robin schedule generation
  - League table automatically updated after each completed game
  - Tournament bracket seeded based on league performance

## Development

In my first iteration, I built the frontend in React and the backend in node.js using [apollo](https://www.apollographql.com/) and [graphql-codegen](https://the-guild.dev/graphql/codegen). This was fine for a while but it began to grow cumbersome, in part because I was still discovering the scope of the project, and in part because I was still learning how to build a project like this from the ground up.

Lucky for me, [NextJS 13](https://nextjs.org/blog/next-13) released between the end of our league's first season and the start of our second, and I was able to rewrite the _entire_ project using the new App Router in a fraction of the time it had taken so far.

I used [NextAuth](https://next-auth.js.org/) (now called [auth.js](https://authjs.dev/)) to allow my friends to create an account on the site and manage their own teams. Eventually I migrated to [Clerk](https://clerk.com) because of issues getting TypeScript to work the way I wanted it to with NextAuth.

The data for this project was initially hosted on [CockroachDB](https://www.cockroachlabs.com/), later migrated to [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) in an attempt to overcome serverless cold-start issues, and now resides on [Neon](https://neon.tech/) after I encountered some perplexing bugs with Vercel Postgres that I couldn't sort out.

After abandoning my GraphQL backend, I started using [Prisma](https://www.prisma.io/) in my server components to fetch data. I eventually became frustrated by the query latency I sometimes encountered and migrated to [drizzle](https://drizzle.team/) for more granular control over my queries without sacrificing the simplified mental modal of an ORM. Drizzle also allowed me to use the serverless driver for Neon, which helped application performance.

I'm not done improving this project yet. I still want to work on the mobile experience -- it's hard to fit as much information as I want on a small screen, and finding ways to compress or eliminate extra info has been an interesting challenge. I also want to add capability to track multiple seasons from the same league, and potentially multiple leagues each with their own seasons.
