---
title: TI Cartotheque
description: A map library for Twilight Imperium
banner: /portfolio/ti-cartotheque/banner.png
showcase: /portfolio/ti-cartotheque/showcase.png
---

## Summary

TI Cartotheque is a site for catologuing prebuilt maps for Twilight Imperium IV. Using a prebuilt map instead of building the map immediately prior to the game is very common amongst competitive players, because preset maps tend to be more evenly balanced (or unevenly balanced, if that's your thing). I created this site as a central repository for community-created maps.

## Features

- View a large collection of community created maps
  - Map collection can be searched by name, or filtered by tags
  - Maps can be submitted to the collection via an embedded Google Form
  - Maps' authors can submit a brief description of their map to explain their design goals
  - A second tab allows viewing "Milty Pools", which is a popular competitive drafting variant
- Get statistical breakdowns of maps
  - Individual systems can be selected to view resource/influence values
  - Multiple systems can be selected at once for a histogram of resource/influence values
- Export maps
  - Maps can be saved as an image
  - Maps can be copied as a layout string compatible with the TI4 mod for Tabletop Simulator

## Development

The database for this project is actually just a publicly available Google Sheet, accessed via the JSON export link. The sheet is automatically populated by the embedded Google Form, so the data on the site always stays up to date without a need for me to host a backend or database anywhere. This isn't particularly stable or scalable, but for a project of this miniscule scope, it works just fine. To make sure I don't have any profane map entries getting onto the site I added an extra column to the spreadsheet that is _not_ populated by the form, and I don't display any maps that don't have that manual validation column set.

This site was my first venture into scaffolding a React project from the ground up. Because of this, I wasn't clear on exactly how to deploy it. Initially, I had a free tier Heroku dyno serving the site, but eventually I figured out that I didn't need anything more than a GitHub Pages site, since it's 100% client-side. I just wrote a GitHub Action to build the production bundle and publish the artifacts.

This project does not have much need for future extensions, because the TI community has for the most part found other solutions for map sharing. The best and most popular maps are now built directly into the Tabletop Simulator and Tabletop Playground mods, and Milty Pools can be generated at will using other community-made tools.
