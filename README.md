# AD&D 2E Character Sheet Tool

A browser-based Advanced Dungeons & Dragons 2nd Edition character sheet designed for fast use, clean organization, and zero dependencies.

**Version 10.3.0**

## Live Demo

👉 https://badbox29.github.io/gsheets/

## Overview

This tool provides a lightweight, interactive character sheet for AD&D 2E that runs entirely in the browser. It is built as a single-page application with local storage support, allowing you to manage characters without requiring a backend or account.

The focus is on usability, speed, and staying true to the structure of 2nd Edition character data.

Where'd it get the name?  "gsheets" is a shortening of "Ghome's sheets", because the character I was playing in the campaign that was active at the time I set out to create this thing was a Gnome and I started actively using the tool to track that character during game... Super-creative, am I right?

## Features

* Multi-character support via tabbed interface
* Automatic local save (no manual saving required)
* Unsaved change indicator during edits
* Full multi-class and dual-class support
* Automatic calculation of saves, THAC0, attack matrices, spell slots, and proficiency budgets from the Player's Handbook tables
* Searchable browsers for spells, weapons, armor, equipment, ammunition, animals and transport, languages, and nonweapon proficiencies
* A goods and services price reference covering clothing, provisions, lodging, and hirelings
* Interactive panels for proficiencies whose rules need working out at the table
* Enchanted items marked on the card and carried through to armor class, attack rolls, weapon speed, and encumbrance
* Magic item records carrying type, charges, command word, and whether the item has been identified
* Treasure valued in gold from the Player's Handbook exchange rates, with weight and worth totalled separately for coin and valuables
* Henchmen, followers and hirelings tracked as the separate things the book makes them, with the lifetime limit Charisma places on henchmen
* A vision and light reference giving the book's sighting distances by weather and target size, and the radius and burning time of every light source
* Optional-rules framework with live toggles for Player's Handbook options and house-rule overrides
* Multi-page printable character sheet with configurable sections, blank write-in lines, and color schemes
* Import / export character data
* JSON-based storage for portability
* Fast load times (no framework, no build step)
* Optional cloud sync via Cloudflare KV storage

## How to Use

1. Open the demo link, or serve the files locally (see [Hosting Locally](#hosting-locally)).
2. Create or edit a character directly in the interface.
3. Changes are saved automatically in your browser.
4. Use export to back up or transfer characters.
5. Use import to restore saved characters.

## Hosting Locally

The tool must be served over `http://` — it will not work correctly if you simply double-click `index.html` and open it from your file system.

The reason: several data files (spells, weapons, armor, ammunition, equipment, goods and services, animals and transport, languages, and nonweapon proficiencies) are stored as JSON and loaded at runtime. Browsers block those requests when a page is opened directly from disk, so the sheet will load and calculate but every reference list will come up empty.

Any static web server works. The simplest option, if you have Python installed:

```
cd gsheets
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. If you use Node instead:

```
npx serve
```

You can also host the files on any static web server — GitHub Pages, IIS, Apache, nginx, or similar.

## Data Storage

* Characters are stored in your browser using local storage
* Exporting creates a portable backup file
* Clearing browser data will remove saved characters
* Optional cloud sync is available via Cloudflare KV (see below)

---

## Optional Rules

Second Edition marks a good deal of its content as optional, and different tables play with different pieces of it. The **⚙ Settings** panel carries a list of toggles, split into three groups:

**Optional Rules** are things the Player's Handbook itself presents as additions to the base game — weapon specialization, weapon speed and spell casting time as initiative modifiers, encumbrance penalties, limits on what a lesser deity can grant its priests. These ship switched **off**, so ticking one is always a deliberate departure from the base rules.

**House Rules & Overrides** are checks the tool performs against rules the book states flatly — class ability minimums, legal class combinations, druid armor restrictions, non-proficiency attack penalties. These ship switched **on**, so unticking one is always the house rule. They exist so a DM who has already waived something doesn't have to look at a warning about it forever.

**Table Rulings** are questions the Player's Handbook simply doesn't answer — how much a coin weighs, whether an enchanted arrow's bonus adds to an enchanted bow's. Neither setting is more correct than the other here; the default is only the more common reading. These are the ones to settle with your DM.

For the first two groups the shipped state is the book as written. Toggles apply immediately to every open character with no reload.

---

## Cloud Sync via Cloudflare KV

The tool supports optional cloud sync using a Cloudflare Worker and KV storage. This allows you to access your characters from multiple browsers or devices without manually exporting and importing JSON files. Cloud sync is entirely opt-in and requires a free Cloudflare account.

### How It Works

Each user is assigned a unique sync token automatically when they first open the tool. This token is their identity in the KV store — all character data is stored under that token's namespace. The token travels with JSON exports so it can be easily transferred to a new browser.

Cloud sync is disabled by default. Once enabled, changes are pushed to KV automatically within approximately 65 seconds of your last edit (60 second autosave + 5 second debounce). Additionally, any pending changes are flushed immediately if you close or navigate away from the tab.

On page load, the tool will automatically pull from KV, taking any character that is new to this browser or that has been edited more recently elsewhere.

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
| Page load | Pulls from KV if sync is enabled (takes anything new or more recently edited elsewhere) |
| Autosave (every ~60s after an edit) | Triggers a debounced push ~5 seconds later |
| Tab closed or navigated away | Immediately flushes any pending push |
| Manual Push to KV | Merge with what's in KV, or force an overwrite (requires typing PUSH to confirm) |
| Manual Pull from KV | Add only characters you don't have, or replace local copies outright |
| Character deleted | Records a deletion marker so the character doesn't reappear on other devices |

### Best Practices

* **Name your characters before syncing.** Unnamed or blank characters are intentionally excluded from KV pushes to keep the store clean.
* **Use Push/Pull manually when switching devices mid-session.** Push on the device you are leaving, then Pull on the device you are switching to. The auto-sync timing means there can be a short window where the latest changes haven't reached KV yet.
* **Avoid editing the same character on two browsers simultaneously.** Merging happens per character, not per field — if you edit hit points on one device and experience on another, the more recent save wins entirely rather than the two combining. Your local copy on either browser is always safe.
* **Close and reopen a character after pulling.** A pull updates storage, not a sheet you already have open — an open tab will still hold the older copy and will overwrite it on its next save.
* **Use JSON export as a backup.** Cloud sync is a convenience feature, not a replacement for periodic JSON exports. Your sync token is included in exports so you can restore your KV identity from a backup file if needed.

### Limitations

* Requires a free Cloudflare account and a deployed worker
* KV data expires after 90 days of inactivity (reset on every successful push)
* Deletion markers are kept for 90 days — a device offline longer than that can resurrect a deleted character
* Merging relies on device clocks being roughly in sync
* Maximum payload size is 4 MB per user (sufficient for many characters)
* Microsoft Edge users may need to add the site as a tracking prevention exception if localStorage or fetch calls are being blocked
* I am not a developer.

### Recent Updates

#### Unreleased

A systematic review of Player's Handbook Chapter 13, *Vision and Light*.

Three pages, two tables, and the first release in a while to find shipping data that flatly contradicts the book.

**Light sources**

* The equipment list's light sources carried figures the book does not support. A torch was listed at a 30-foot radius burning for an hour; the book gives **15 feet** and **30 minutes**. Every lantern's burning time was inflated threefold, and a candle's sixfold. All corrected.
* Radius and burning time are now read from the book's light source table and shown live in the equipment browser. They are no longer written down a second time in the equipment data, so the two can never drift apart again.
* Beacon and bullseye lanterns are described as cones rather than radii, with the width of the beam at its far end — the book footnotes this and the tool had never said it.
* The common lamp appears in the equipment list but in no light table in the book. It now says so plainly instead of showing figures from nowhere.
* **Existing characters keep the old text.** Item cards store their note at the moment you add them, and nothing rewrites them afterwards. Re-add a light source, or edit its note by hand, to pick up the corrections.

**Vision**

* Added a **Vision & Light** reference to the Tools tab, covering the book's sighting distances for eight weather and light conditions across the five ranges it distinguishes: seeing that something moved, spotting a figure that is standing still, making out what it is, identifying who it is, and seeing small actions clearly.
* The ranges adjust for the size of what you are looking at. A small target shifts every category down one; a large one doubles the first three and leaves the last two alone. Both are the book's own rules and both are easy to get wrong in your head.
* Included the caveats the book attaches and a bare table loses: terrain changes your chance of noticing a creature but not the distances themselves, and the whole table assumes an Earthlike world.
* Noted that infravision reaches 60 feet at most, and that the book offers two versions of it and leaves the choice to the DM — who owes his players an answer on which one he is using.

**Conditions**

* Added **Fighting via Mirror**. Fighting something you can see only by reflection costs −2 on attack rolls and forfeits your Dexterity bonus to armor class entirely. The same −2 applies to any action you direct by looking in a mirror, in or out of combat, and a mirror is useless without a light source. The small metal mirror in the equipment list now carries the rule too, having previously said only that it was useful against medusas.
* **The conditions list is now alphabetized.** Twenty-four entries in the order they happened to be written was hard to search.

#### v10.3.0

A systematic review of Player's Handbook Chapter 12, *NPCs*.

Three pages of prose with no tables in them at all, and it still produced a working feature where there had only been a decorative number.

**Henchmen**

* Charisma has always displayed a maximum number of henchmen. Nothing in the tool had ever counted them against it. It does now, and it counts the way the book says: the limit is a **lifetime** total, so retired, deceased and missing henchmen all still count against it. The chapter's own example is a character whose seven henchmen have all died and who will never attract another.
* Added a warning for any henchman who has reached your own level. The book has him leave forever at that point, on the reasoning that a student who has learned as much as his teacher is finished being a student.
* Both checks are advisory and can be switched off under House Rules & Overrides. Nothing is blocked and no henchman is ever removed for you.
* New henchmen now default to a half share of treasure, which the chapter describes as the usual arrangement. Existing records keep whatever they already had.
* Added a **Henchmen Notes** field. The printed sheet had been reserving a section for it since the day it was written, but there was nowhere in the tool to type one.

**Followers and hirelings**

* Followers and hirelings shared a single list and a single card, though the book treats them as different things. Each entry now carries a **Category**. A hireling serves a stated term or a named task and is loyal only as far as pay and good treatment carry him; a follower serves no term at all, requires a stronghold to attract, arrives once with no replacements for the fallen, and gains levels as an entire unit. Neither goes adventuring with the party.
* Existing entries are left uncategorized rather than assumed to be hirelings — the old card could honestly have held either, so the tool doesn't guess.
* Added a **Level** field. The book says followers can advance and that a whole unit advances together, and there had been nowhere to record it.
* **Duration** dims for a follower, since a follower serves no contract term — but it is only dimmed, never hidden and never cleared. A duration already recorded stays fully legible, because it still prints.
* The old "Type" field is now labelled **Occupation**, which is what it always held.

**Charisma**

* Fixed Charisma 1 showing nothing at all. The table covers it, the tool skipped it, and the boxes kept the previous character's numbers instead.
* Fixed the Charisma boxes holding stale values when the score was cleared or set out of range, rather than emptying.
* Max Henchmen on the Followers tab had been labelled "Max Followers". Charisma governs henchmen; followers come from your class level and your stronghold.

**Dice roller**

* The Reaction roll advertised result bands — "2-7 negative, 8-14 neutral, 15+ positive" — that appear in no Player's Handbook table. Removed. The roll now reports the raw dice, your Charisma adjustment and the adjusted figure, and says plainly that reading the result is the DM's call.
* Rolling a reaction with no Charisma recorded used to print nothing at all beneath the dice.

**Printing**

* The section is now headed **Followers & Hirelings** and shows each entry's category, occupation and level. Henchmen notes print for the first time.

#### v10.2.0

A systematic review of Player's Handbook Chapter 10, *Treasure*.

The chapter is three pages of prose and contains exactly one rule with a number in it, so this release is less about corrections than about building out the two parts of the sheet the chapter actually describes.

**Magic items**

* Magic items were a name and a description box and nothing else. They now carry a type, quantity, weight, charges, a command word, and whether the item has been identified.
* Added charge tracking for wands, staves, and rods — the only items the book calls expendable. The fields appear for those three types and stay out of the way otherwise.
* Magic items now count toward encumbrance. A staff or a rod previously weighed nothing, while every other kind of carried gear was counted.
* Magical weapons and armor are deliberately *not* magic item types. They belong on the Weapons and Armor tabs, where marking a piece enchanted actually feeds armor class, attack rolls, damage, and weapon speed — the same sword recorded on the magic items list would look right and calculate nothing. A note on the tab points you to the right place.
* The printed sheet gained real Type and Charges columns. It had been printing a column headed "Notes / Charges" against a sheet that had nowhere to record charges.
* Fixed magic items on a saved character not marking the sheet as unsaved when edited, so changes to them could be lost.

**Treasure**

* Added **Coin Value**, converting all five denominations to gold using the book's exchange rates. The existing figure was a count of coins, which treats a copper piece and a platinum piece as the same thing — both are now shown, since one drives weight and the other drives worth.
* Reworked **Other Valuables**: value per item is a number with its own currency selector rather than free text, and each entry can be tagged as a gem, jewelry, an art object, trade goods, alternate currency, and so on.
* Added **Valuables Weight** and **Valuables Value** totals, placed directly under the coin figures so a purse and a pack of gems can be compared at a glance.
* Existing free-text values are migrated automatically — "500 gp" and "1,000" are read into the new fields when the character loads, with nothing to retype.
* The printed sheet now shows each valuable's type and its value with the currency, and reports coin and valuables worth alongside the weight carried.

**Saving throws**

* Noted the book's rule that magical armor improves saving throws — a +1 suit improves a save against a dragon's breath by 1. It is shown as a note rather than added to the numbers, because it applies only against attacks the armor would physically stop, which is a call for your DM rather than something the sheet can make.

#### v10.1.0

A systematic review of Player's Handbook Chapter 7, *Magic*.

**Priest spheres**

* Implemented major and minor sphere access. Minor spheres are limited to spells of 3rd level and below — a rule the tool had never enforced, so any priest could take any spell in any sphere he had ticked.
* Each sphere is now set individually to major access, minor access, or none. The Player's Handbook publishes no per-deity sphere lists — it leaves them to the DM — so these are recorded from whatever your DM granted rather than looked up.
* The Sphere of All is always available and can't be switched off or capped, since no deity grants it and it holds spells well above 3rd level.
* Spheres the Player's Handbook doesn't define are tagged, so a table running strict 2E can see at a glance which rows come from the Tome of Magic. They aren't blocked.
* Added a control that sets all four elemental spheres at once, since the book has a single Elemental sphere and the spell data splits it into four.
* Existing characters keep every sphere they had, promoted to major access, so nobody loses a spell they'd been casting.

**Spellcasting**

* Added a **While Casting** armor class. The book takes away your Dexterity bonus during the round you cast a spell, and nothing on the sheet had ever reflected it.
* Added study and prayer time for memorized spells at ten minutes per spell level — shown both as the time to recover what you've cast and the time to memorize the whole list from scratch, after a full night's rest.
* Added a **Form** setting on memorized spells, so a priest can record that he prayed for *cause light wounds* rather than *cure light wounds*, and a wizard can memorize both versions of a reversible spell separately.
* Added a toggle for spell casting time as an initiative modifier. Only a bare number counts — a spell listed as "1 round" resolves at the end of the round rather than going off a point faster.
* Added a toggle for deity power level: demi-gods grant spells up to 5th level, lesser deities up to 6th, greater deities all of them. An unset patron is unrestricted.
* Spells that are out of reach now say which rule is stopping them — your level, your Intelligence, an opposition school, minor access to the sphere, or your patron — rather than simply refusing.

**Fixes found along the way**

* The spell detail panel didn't escape the text it displayed, so a stray angle bracket in a spell's entry could have swallowed the rest of the panel.
* Clarified the Wisdom saving throw bonus, which Chapters 1 and 7 scope differently. The sheet now states both readings instead of silently picking one.

#### v10.0

A systematic review of Player's Handbook Chapter 6, *Money and Equipment*, table by table.

**Armor class**

* Fixed armor not applying to Armor Class at all — a field rename had left the calculation reading the wrong value, so every equipped suit was contributing nothing.
* Fixed magical armor making you *worse*: enchantment bonuses were being added to Armor Class rather than subtracted, so a +2 suit of plate came out at AC 5 instead of AC 1.
* Fixed the choice of best armor comparing an unenchanted value against an enchanted one, which meant the answer depended on the order items happened to sit in the list.
* Added advisories for wearing more than one suit of body armor, and for wearing bracers together with armor — which don't stack, though rings of protection still stack with whichever wins.
* Added a **Supplemental Armor** slot for pieces worn *over* armor rather than instead of it, such as armored vambraces. These add to Armor Class the way shields and rings do, where bracers of defense replace it.
* Fixed armored vambraces granting AC −1 on their own — better than full plate and shield — because a bonus value was being read as though it were a base Armor Class.
* Fixed the armor browser guessing which slot an item occupies from its name, with only three cases, instead of reading the armor type the data already carried.
* Fixed Armor Class not updating live — equipping a piece, editing its Armor Class, or marking it enchanted left the Combat Quick Reference showing the old number until the character was saved and reloaded.
* The Combat Quick Reference now shows what's driving Armor Class — the base armor, each enchantment, and each supplemental piece — the same way it already breaks down every equipped weapon.

**Encumbrance**

* Added the five pounds the book charges for clothing.
* Implemented the rule that magical armor counts toward what you can carry but not toward encumbrance's effects on movement and combat.
* Added a toggle for coin weight, since the Player's Handbook never states one and tables differ between the 1st and 2nd Edition figures.

**Weapons and ammunition**

* Added the weapon type column — bludgeoning, piercing, slashing — for all 82 weapons.
* Added missile ranges and rate of fire from Table 45, with the −2 medium and −5 long range modifiers shown per weapon.
* Added five weapons the list was missing: harpoon, mancatcher, hook fauchard, medium lance, and the horseman's pick.
* Added an ammunition selector so a bow knows which arrows it's firing, with a table ruling for whether enchanted ammunition stacks with an enchanted launcher.
* Fixed weapon fields keeping stale values when the weapon type changed — a bow switched to a halberd kept the bow's range.

**Magic items**

* Added an explicit **Enchanted?** marker to weapon, armor, and ammunition cards, with the bonus fields grouped behind it and shown only when it applies.
* Enchantment now shows on the collapsed card, so a +2 sword reads as such without expanding it. Weapons whose effects differ from their plus — a +5 weapon granting only +1 to hit — say so.
* Unmarking an item stops its bonuses applying to armor class, attack rolls, damage, weapon speed, and encumbrance, without erasing the numbers.

**Equipment data**

* Corrected armor weights and costs against the book, including banded mail priced at less than half what it should be.
* Corrected container capacities against Table 50 and added nineteen items the equipment list was missing.
* Corrected the barding entries, which were priced from a different table and missing three types.
* Added a goods and services price list covering clothing, provisions, food and lodging, and hirelings.
* Added an animals and transport browser merging Table 44's prices with Table 49's carrying capacities, feeding both follower lists.

**Fixes found along the way**

* The Combat Quick Reference was never refreshed by a recalculation, so changing a level, an ability score, or an optional rule left it showing stale figures until an unrelated weapon edit corrected it.
* Several weapon card dropdowns never marked the sheet as unsaved, so a change to them could be lost.

#### v9.0

**Proficiencies**

* Proficiency cards now show the number you actually roll against — "Wis 14 -1 = roll 13 or less" — instead of the raw table entry, with any adjustments listed on hover.
* Implemented the rule that a natural 20 always fails a proficiency check, and flagged targets of 20 or more as automatic successes rather than printing a number the die can't reach.
* Added a field for spending extra proficiency slots to improve a proficiency, including the eight cases where the extra slot buys something other than a flat bonus.
* Added a **Proficiency Abilities** section with interactive panels for the proficiencies whose rules need working out at the table: tracking, healing, jumping, tightrope walking, disguise, forgery, set snares, hunting, and both kinds of riding.
* Implemented tracking properly — the -6 penalty for non-rangers, the ten cumulative terrain and weather modifiers, the resulting movement rate, and the point below which the trail is lost for good.
* Surfaced the situational cross-proficiency bonuses (astrology aiding navigation, animal lore aiding snares, healing paired with herbalism, and others) as notes rather than silently folding them into a number that only applies sometimes.
* Corrected the nonweapon proficiency data: a wrong slot cost, six wrong category labels, three proficiencies wrongly credited to supplements, and four duplicate entries — one of which was overcharging wizards a slot.
* Fixed the proficiency browser charging out-of-group surcharges for proficiencies that were in the character's group all along.
* Added a dice roller preset that checks a single d20 against every proficiency the character has.

**Combat and weapons**

* Implemented weapon specialization effects: the melee bonuses, the point-blank range category for bows and crossbows, and the specialist's improved rate of attack by level.
* Split the weapon card's magic bonus into separate hit and damage adjustments, and added per-weapon attacks per round, size, and range.
* Added color-coded status stripes to weapon rows showing at a glance whether a weapon is specialized, proficient, related, or unfamiliar.
* Added blind-fighting's combat modifiers to the character bonuses panel.

**Character rules**

* Corrected the experience tables — paladins were advancing on the ranger progression — and rebuilt all four priest and bard spell progression tables, which were shifted or invented at several levels.
* Corrected the list of legal multi-class combinations against the book's own table.
* Added Hit Dice display, along with tracking for starting Constitution and the number of times a character can still be raised from the dead.
* Implemented the minimum Hit Die rolls granted by very high Constitution.
* Implemented the Wisdom requirements for 6th and 7th level priest spells.
* Implemented thief skill adjustments for armor, the 95% skill ceiling, and the separate multi-class restriction on thieving in heavy armor.
* Added ranger hide and move silently, including the halved chance outside natural surroundings.
* Added Grand Druid and hierophant handling, including the spell allotment and bonus spell levels.
* Added warnings for ability scores below class minimums and for illegal class combinations.
* Added a spells-known counter enforcing the Intelligence limits on how many spells a wizard can record per level.

**Printing**

* Rebuilt the printed sheet as a full multi-page character record covering combat, proficiencies, languages, spells, equipment, followers, and journals.
* Added a print options panel to choose which sections appear, how many blank write-in lines each gets, and how many extra spellbook, memorization, and note pages to append.
* Added a "changes to enter" page for players who run from paper and sync back to the tool between sessions.
* Added six color schemes and a choice of title fonts.

**Interface**

* Reorganized companions and mounts around whether a creature is bonded rather than what kind of creature it is, so a ridden animal companion can be recorded properly.
* Replaced hover-only tooltips with click-to-open panels in the places that most needed them, so the explanations work on a phone.
* Roll history entries now expand to show how a result was calculated.

#### v8.0

* Completed specialist wizard spell handling: opposition-school spells are flagged as unlearnable in the spell browser, the ±15% chance-to-learn adjustment is shown per spell, and the specialist's saving-throw modifiers are noted in the combat reference.
* Added specialist bonus-slot and free-spell tracking: a per-level indicator shows where the specialist's extra memorization slot is being used, and a counter tracks the free school spell gained at each new spell level.
* Added filtering to the spell browser — narrow the list by school or sphere, with options that update as you refine your selection and a one-click reset.
* Improved handling of level-0 (cantrip and orison) spells and cleaned up inconsistent saving-throw labels in the spell data.

#### Earlier releases

* Corrected exceptional Strength handling so it applies across attack rolls, damage, and ability checks rather than only in the ability display.
* Resolved conflicting Wisdom tables and cleaned up spell bonus, spell failure, and magical defense adjustments.
* Rebuilt encumbrance on the real Player's Handbook weight tables and made its penalties an opt-in rule.
* Removed a Dexterity modifier from initiative that doesn't exist in second edition.
* Corrected Intelligence table data and enforced Intelligence-based caps on wizard spell selection.
* Added weapon and nonweapon proficiency slot counters with automatic class-based calculation and manual override.
* Implemented nonweapon proficiency group crossover surcharges and corrected widespread category errors in the proficiency data.
* Reworked language handling to properly separate native, granted, and purchased languages and to charge slots correctly.
* Added weapon categories and Strength-bonus rules so thrown, bow, and mechanical weapons behave correctly.
* Implemented the non-proficiency attack penalty, including reduced penalties for related weapons.
* Reworked the attack matrix to show actual to-hit numbers for melee and missile at a glance.
* Added weapon speed factor as an initiative modifier, including magical weapon adjustments.
* Optimizations around specialist mage classes, including spell progression, experience tables, and bonus school slots.
* Extended class recognition to cover previously unsupported classes across saves, proficiencies, and penalties.
* Rebuilt cloud sync to merge by timestamp, propagate deletions, and stop stale devices from overwriting newer data.
* Introduced an optional-rules framework with live toggles in settings.
* Replaced the color scheme with a new theme and laid the groundwork for user-selectable themes.

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
