---
title: Pixcel Worksheets
description: Self-grading assments for elementary school classrooms
banner: /portfolio/pixcel/pixcel-flower.png
showcase: /portfolio/pixcel/showcase.png
---

## Summary

Pixcel Worksheets is a very simple app that creates self-grading worksheets for use in elementary school classrooms with computer access. Users provide the app with a list of questions and answers, and provide it with an image (preferrably a small pixel art image). The app then saves a Google Sheets document to their drive, ready to be shared with students. When the cell next to the question is filled with the correct answer, condtional formatting rules will highlight the answer green, and fill in a random subset of the square cells to the right with color. Once all questions have been answered correctly, the colored cells will reveal an image!

## Features

- Uses Google OAuth with PKCE to operate entirely client-side
- Uses the Canvas API to resize the uploaded image and pull pixel color data
- Uses the Google Sheets API to create a spreadsheet with appropriate conditional formatting rules to progressively reveal the image
- Optional MD5 hashing of checked answers to prevent tech-savvy students from peeking at the conditional formatting rules to find answers

## Development

The first version of Pixcel used Flask to create a simple Python backend. Users would upload their images and a list of questions and answers, and the API would send back an excel document containing the worksheet, created with `xlsxwriter`. I quickly added on the ability to create and upload Google Sheets documents automatically with Google's python client.

When Herkou shut down their free tier, I decided to rewrite the app to work entirely in-browser and host it on GitHub Pages instead. I had to learn how to use OAuth with PKCE to safely get access to a user's Google account, and  rewrite all of my image processing code from Python's `PIL` library to the web Canvas API.

Adding MD5 hashing was a challenge, as I couldn't easily create a spreadsheet formula that calculated the hash, so I instead used an API call to a service that provides hashes via HTTP. I made a second hidden worksheet that calculates a hash for each inputted answer, and modified the conditional formatting rules to check against that hash instead of the raw input.

For future extension, I would like to find a way to implement fuzzy matching and perhaps implement the hashing function in the sheet instead of via API call. Unfortunately I'm not sure how possible (or practical) these extensions are, due ot the limitation of running within Google Sheets.
