# AD&D 2E Character Sheet Tool

A browser-based Advanced Dungeons & Dragons 2nd Edition character sheet designed for fast use, clean organization, and zero dependencies.

## Live Demo

👉 https://badbox29.github.io/gsheets/

## Overview

This tool provides a lightweight, interactive character sheet for AD&D 2E that runs entirely in the browser. It is built as a single-page application with local storage support, allowing you to manage characters without requiring a backend or account.

The focus is on usability, speed, and staying true to the structure of 2nd Edition character data.

## Features

* Multi-character support via tabbed interface
* Automatic local save (no manual saving required)
* Unsaved change indicator during edits
* Clean, printable layout
* Import / export character data
* JSON-based storage for portability
* Fast load times (single HTML file app)
* No external dependencies or frameworks

## How to Use

1. Open the demo link or host the files locally.
2. Create or edit a character directly in the interface.
3. Changes are saved automatically in your browser.
4. Use export to back up or transfer characters.
5. Use import to restore saved characters.

## Hosting Locally

You can run this tool locally with no setup:

* Download or clone the repository
* Open `index.html` in your browser

Alternatively, host it on any static web server (GitHub Pages, IIS, Apache, etc.).

## Data Storage

* Characters are stored in your browser using local storage
* Exporting creates a portable backup file
* Clearing browser data will remove saved characters

## Design Goals

* Stay faithful to AD&D 2E structure
* Keep everything fast and responsive
* Avoid unnecessary complexity
* Ensure full offline capability

## Limitations

* No server-side sync (local-only storage)
* No built-in rules enforcement (manual entry expected)
* Depends on browser local storage persistence

## Roadmap / Ideas

* Additional automation (calculations, derived stats)
* Optional validation helpers
* UI polish and layout refinement
* Expanded import/export options

## About This Project

This tool was created with the assistance of AI (primarily Claude).
I am not a programmer by trade—this project was built as a practical solution for my own AD&D 2E campaign needs.

## Contributing

This project is currently maintained as a personal tool, but suggestions and improvements are welcome.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---
