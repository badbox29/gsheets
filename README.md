# AD&D 2E Character Sheet Tool

A browser-based Advanced Dungeons & Dragons 2nd Edition character sheet designed for fast use, clean organization, and zero dependencies.

## Live Demo

👉 https://badbox29.github.io/gsheets/

## Overview

This tool provides a lightweight, interactive character sheet for AD&D 2E that runs entirely in the browser. It is built as a single-page application with local storage support, allowing you to manage characters without requiring a backend or account.

The focus is on usability, speed, and staying true to the structure of 2nd Edition character data.

Where'd it get the name?  "gsheets" is a shortening of "Ghome's sheets", because the character I was playing in the campaign that was active at the time I set out to create this thing was a Gnome... Super-creative, am I right?

## Features

* Multi-character support via tabbed interface
* Automatic local save (no manual saving required)
* Unsaved change indicator during edits
* Clean, printable layout
* Import / export character data
* JSON-based storage for portability
* Fast load times (single HTML file app)
* Optional cloud sync via Cloudflare KV storage

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
* Optional cloud sync is available via Cloudflare KV (see below)

---

## Cloud Sync via Cloudflare KV

The tool supports optional cloud sync using a Cloudflare Worker and KV storage. This allows you to access your characters from multiple browsers or devices without manually exporting and importing JSON files. Cloud sync is entirely opt-in and requires a free Cloudflare account.

### How It Works

Each user is assigned a unique sync token automatically when they first open the tool. This token is their identity in the KV store — all character data is stored under that token's namespace. The token travels with JSON exports so it can be easily transferred to a new browser.

Cloud sync is disabled by default. Once enabled, changes are pushed to KV automatically within approximately 65 seconds of your last edit (60 second autosave + 5 second debounce). Additionally, any pending changes are flushed immediately if you close or navigate away from the tab.

On page load, the tool will automatically pull any characters from KV that are not already in your local storage.

### Setting Up the Worker

Cloud sync requires deploying the included `gsheets-worker.js` to your own Cloudflare account. This keeps your data private — it lives in your own KV namespace, not a shared server.

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create** → choose a Hello World Worker
3. Give it a name (e.g. `gsheets-worker`) and deploy it
4. Replace the default worker code with the contents of `gsheets-worker.js` and redeploy
5. Go to **Workers & Pages** → **KV** → **Create a namespace** (e.g. `gsheets-kv`)
6. Return to your worker → **Bindings** tab → **Add binding** → **KV Namespace**
7. Set the variable name to exactly `KV` and select your new namespace
8. Save — your worker URL will be something like `https://gsheets-worker.your-subdomain.workers.dev`

To verify the worker is running correctly, visit `https://your-worker-url/ping` in a browser. You should see:
```json
{ "ok": true, "service": "gsheets-worker", "message": "Gsheets KV sync worker is reachable." }
```

### Enabling Sync in the Tool

1. Click the **⚙ Settings** button in the sidebar
2. Paste your worker URL into the **Worker URL** field and click **Save** — the tool will verify the worker is reachable
3. Check **Enable automatic KV sync**
4. Click **⬆ Push to KV** to do your first manual push (type `PUSH` to confirm)

Your characters are now in the cloud.

### Setting Up a Second Browser or Device

Follow these steps **in order** to avoid overwriting your data:

1. Open the tool in the new browser
2. Go to **⚙ Settings**
3. Enter your worker URL and click **Save**
4. Click **Enter Token** and paste the sync token from your primary browser
   * To find your token on the primary browser: open **⚙ Settings** and click **Copy** next to the token field
5. Check **Enable automatic KV sync**
6. Click **⬇ Pull from KV** to download your characters
7. Use **Open…** to load any pulled characters into the sheet

> ⚠ Always **Pull before Push** on a new browser. Pushing first will overwrite your KV data with the new browser's empty state.

### Sync Token

* Your sync token is auto-generated and stored in your browser's local storage
* It is also embedded in any JSON export so it travels with your character files
* When importing a JSON file that contains a token, the tool will adopt that token if you don't already have one — making it easy to restore your identity from a backup
* Use **Reset** in Settings to generate a new token if needed — note this permanently disconnects the browser from its current KV data (your local characters are unaffected)

### When Sync Fires

| Event | Behavior |
|---|---|
| Page load | Pulls from KV if sync is enabled (adds characters not already local) |
| Autosave (every ~60s after an edit) | Triggers a debounced push ~5 seconds later |
| Tab closed or navigated away | Immediately flushes any pending push |
| Manual Push to KV | Pushes all named characters immediately (requires typing PUSH to confirm) |
| Manual Pull from KV | Pulls all characters from KV, merging with local storage |

### Best Practices

* **Name your characters before syncing.** Unnamed or blank characters are intentionally excluded from KV pushes to keep the store clean.
* **Use Push/Pull manually when switching devices mid-session.** Push on the device you are leaving, then Pull on the device you are switching to. The auto-sync timing means there can be a short window where the latest changes haven't reached KV yet.
* **Avoid editing the same character on two browsers simultaneously.** The tool uses a last-write-wins strategy — whichever browser autosaves and pushes last will be the version stored in KV. Your local copy on either browser is always safe, but one browser's KV snapshot may fall behind.
* **Use JSON export as a backup.** Cloud sync is a convenience feature, not a replacement for periodic JSON exports. Your sync token is included in exports so you can restore your KV identity from a backup file if needed.

### Limitations

* Requires a free Cloudflare account and a deployed worker
* KV data expires after 90 days of inactivity (reset on every successful push)
* Maximum payload size is 4 MB per user (sufficient for many characters)
* Microsoft Edge users may need to add the site as a tracking prevention exception if localStorage or fetch calls are being blocked

---

## Design Goals

* Stay faithful to AD&D 2E structure
* Keep everything fast and responsive
* Avoid unnecessary complexity
* Ensure full offline capability

## About This Project

This tool was created with the assistance of AI (primarily Claude).
I am not a programmer by trade—this project was built as a practical solution for my own AD&D 2E campaign needs.

## Contributing

This project is currently maintained as a personal tool, but suggestions and improvements are welcome.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
