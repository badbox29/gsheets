# AD&D 2E Character Sheet Tool

A browser-based Advanced Dungeons & Dragons 2nd Edition character sheet designed for fast use, clean organization, and no build step.

**Version 11.6.0**

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
* Character portraits that keep the uploaded image — the crop frames the thumbnail, and hovering the portrait opens the full artwork in a framed window
* Treasure valued in gold from the Player's Handbook exchange rates, with weight and worth totalled separately for coin and valuables
* Henchmen, followers and hirelings tracked as the separate things the book makes them, with the lifetime limit Charisma places on henchmen
* A vision and light reference giving the book's sighting distances by weather and target size, and the radius and burning time of every light source
* Dice rollers for every racial ability that is rolled — dwarven and gnomish stonework detection, elven and half-elven door finding, halfling grade sense, sleep and charm resistance
* A cover and concealment reference for missile fire, covering both the attack penalty and the saving throw bonus
* A climbing panel giving your chance of success and your rate of climb for any surface and condition, with the armor, race and encumbrance penalties itemized
* An overland travel and endurance panel covering marching, force marching and its cumulative attack penalty, diving depth, and surfacing rate
* Movement worked out in the units the book actually uses — feet per round underground, yards per round outdoors — with swimming, walking the bottom, and how long you can hold your breath
* Ten colour themes, each with its own light and dark mode, chosen from a swatch grid and remembered per browser
* Card status colours fixed across every theme and checked against red-green and red-blind colour vision, so the legend means the same thing whichever theme you use
* Optional-rules framework with live toggles for Player's Handbook options and house-rule overrides
* Supplement support, one row per book and one checkbox per rule group, applying what a Complete Handbook states and staying quiet about the experiments it merely offers — switching a group off suspends what it granted rather than deleting it, and switching it back on restores it untouched
* The complete ranger kit list from the Complete Ranger's Handbook, transcribed from the book, with the two crypt kits from DRAGON #234
* Ranger tracking, stealth and animal empathy worked out from your level, race, kit and armor, with every term shown
* The Complete Fighter's Handbook in full, split into seven rule groups you can switch on one at a time rather than all together
* Fighting styles bought with proficiency slots, including the Single-Weapon armor class bonus and its conditions
* Tight and broad weapon groups — two slots buys every axe in the game, three buys every blade — with specialization still taken one weapon at a time, offered directly in the browser on anything a group already covers
* Weapon quality from poor to exceptional, kept separate from enchantment so a fine blade never counts as a magical one
* Weapons that break in use: stone and bone shatter on every hit, lances break on a heavy hit or a shield parry, with the rollers in Tools and a reminder on the weapon card
* Kit weapon restrictions marked in the browser, telling you which kit forbids a weapon and whether it does so only while the character is being built
* Armor fitting — whether a breastplate looted from a dwarf will fit an elf, with the chance, which way it will fail, and the full table alongside
* High-quality racial armor: elven steel at half weight, gnomish leather that takes no thieving penalty, human plate that guards against breath weapons
* Piecemeal armor worn as separate pieces, with armor class summed from what covers you, piece weights worked out from the suit, and the thieving penalty taken from the most restrictive piece
* A melee maneuvers reference covering all eleven maneuvers, the five body locations, and your numbed and useless thresholds — filtered to what each weapon you carry can actually do, because a lasso never parries and a bow does only four of them
* Organizations: record the guilds, orders, colleges, companies and temples a character belongs to, each on its own tab, with standing that runs from apprentice to hunted
* The Complete Thief's Handbook in full, split into six rule groups — armor and thief skills, armor and acrobatics, kit skill adjustments, off-kit proficiency costs, equipment, and Chapter 7's advanced rules
* All eighteen thief kits from the book, with their skill adjustments, point budgets and proficiency requirements
* Thief skills recalculated for every armor type the book covers, from hide through full plate, with the Dexterity bonus forfeited above simple leather and the exact amount lost named on screen
* A thief equipment panel: tick what he is carrying and see the adjusted skills beside his own, with the modifiers that depend on the surface he is climbing changing as you change it
* Silenced elfin chain, quieter than ordinary elven mail and worse at picking pockets, with its own column in the thieving table
* Sixty-one items of thief equipment priced with the legality the book gives them — legal, shady, or available only through a guild
* Special function arrows that carry a rope to a wall, with the grappling table and the trade-off between the two ways of rigging the line
* Acrobatics worked out in full: jumping and pole vaulting from your own height and pole, tumbling's armor class bonus and its conditions, tightrope walking, and how far you can fall before it hurts
* Armor's effect on every acrobatic feat, including the vault a man in plate mail simply cannot make
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

### Trying it with a character already loaded

An empty sheet does not show much. The `demo_sheets/` folder in this repository
holds finished characters covering all three ways the tool handles class —
single-class, multi-class and dual-class — with spellbooks, proficiencies,
equipment and followers already filled in.

Download any of them and use **Import** to open it.

They arrive as ordinary characters, so anything you change is yours to keep and
deleting one works like deleting any other. One thing to watch: if you already
have a character saved under the same name, rename one of them first — import
will otherwise overwrite the character you already had.

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

### What it loads from elsewhere

There is no framework and no build step, but the page is not entirely self-contained. Two things are fetched from a CDN at runtime:

* **pdfMake**, which generates the printed character sheet. Without it the sheet works normally but printing will not run.
* **Almendra and Metamorphous** from Google Fonts, used for headings and group bands. Without them the page falls back to a generic serif and looks plainer.

Everything else — the rules data, the calculations, the stylesheet, the print fonts — is in this repository.

## Data Storage

* Characters are stored in your browser using IndexedDB
* Exporting creates a portable backup file
* Clearing browser data will remove saved characters
* Optional cloud sync is available via Cloudflare KV (see below)

Characters moved from local storage to IndexedDB in version 11.3.0, and existing
characters migrate themselves the first time you open the tool afterwards.

The reason is portraits. Local storage caps at about 5MB **per site**, and every
project hosted under the same GitHub Pages account shares that one allowance —
so a dozen characters with artwork could fill it, and once full, saving fails.
IndexedDB has no comparable limit, which is why portraits are kept at full
quality rather than being squeezed to fit.

---

## Optional Rules

Second Edition marks a good deal of its content as optional, and different tables play with different pieces of it. The **⚙ Settings** panel carries a list of toggles, split into three groups:

**Optional Rules** are things the Player's Handbook itself presents as additions to the base game — weapon specialization, weapon speed and spell casting time as initiative modifiers, encumbrance penalties, limits on what a lesser deity can grant its priests. These ship switched **off**, so ticking one is always a deliberate departure from the base rules.

**House Rules & Overrides** are checks the tool performs against rules the book states flatly — class ability minimums, legal class combinations, druid armor restrictions, non-proficiency attack penalties. These ship switched **on**, so unticking one is always the house rule. They exist so a DM who has already waived something doesn't have to look at a warning about it forever.

**Table Rulings** are questions the Player's Handbook simply doesn't answer — how much a coin weighs, whether an enchanted arrow's bonus adds to an enchanted bow's. Neither setting is more correct than the other here; the default is only the more common reading. These are the ones to settle with your DM.

**Supplement Rules** are the Complete Handbooks. One row per book rather than one per rule, because a table says "we use the Complete Ranger's Handbook", not "we use Table 11 but not Table 53". Each book expands into two toggles, and the split is the book's own:

* **Apply the core rules** — things the book states as its own, which change how numbers are worked out. The Complete Ranger's Handbook, for instance, replaces the Player's Handbook's flat rule that a ranger simply cannot hide in anything heavier than studded leather with a sliding scale that runs from a bonus in no armor down to almost nothing in full plate.
* **Apply the optional rules** — the experiments a book offers rather than asserts, usually in a sidebar or with an explicit "if your table wants to try this". These **suppress warnings** rather than enforcing anything. Ticking the ranger book's optional rules lets you build a dwarven Guardian or a half-elf ranger/druid without the sheet objecting on every render; it doesn't make the tool police the caps those rules suggest.

Both ship switched **off**, so unticked is always the Player's Handbook. Each toggle lists what it changes, and says plainly where a rule is shown for reference but not enforced. Content a supplement merely *adds* — a new kit, proficiency or weapon — has no toggle at all, since it takes nothing away from a table using only the core book.

For the first two groups the shipped state is the book as written. Toggles apply immediately to every open character with no reload.

---

## Cloud Sync via Cloudflare KV

The tool supports optional cloud sync using a Cloudflare Worker and KV storage. This allows you to access your characters from multiple browsers or devices without manually exporting and importing JSON files. Cloud sync is entirely opt-in and requires a free Cloudflare account.

### How It Works

Each user is assigned a unique sync token automatically when they first open the tool. This token is their identity in the KV store — all character data is stored under that token's namespace. The token stays in the browser and is never written into a character export; to use the same identity elsewhere, paste it in yourself under **Enter Token**.

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
* It stays in the browser. It is **not** written into character exports, so a character file you send to another player carries no credentials — only the character
* To use the same identity on another browser, paste the token in yourself (see [Setting Up a Second Browser or Device](#setting-up-a-second-browser-or-device))
* An imported character syncs under whatever token the receiving browser already has, like any other character on that browser
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
* **Use JSON export as a backup.** Cloud sync is a convenience feature, not a replacement for periodic JSON exports. Note that exports carry the character only — keep a copy of your sync token somewhere separate if you want to be able to restore your KV identity.

### Limitations

* Requires a free Cloudflare account and a deployed worker
* KV data expires after 90 days of inactivity (reset on every successful push)
* Deletion markers are kept for 90 days — a device offline longer than that can resurrect a deleted character
* Merging relies on device clocks being roughly in sync
* Maximum payload size is 4 MB per user (sufficient for many characters)
* Microsoft Edge users may need to add the site as a tracking prevention exception if localStorage or fetch calls are being blocked
* I am not a developer.

### Recent Updates

#### v11.6.0

**Organizations**

* A new section on the Details tab for everything a character belongs to that has
  rules, dues or expectations attached — a thieves' guild, a knightly order, a
  bardic college, a mercenary company, a temple. Each gets its own tab, added
  only when you need it, so a character who belongs to nothing sees nothing.
* Record the name, what kind of body it is, the character's rank, its
  guildhouse or territory, who leads it, what it charges in dues, what cut or
  tithe it takes, who he fences or brokers through, and what it expects of him.
  *The Complete Thief's Handbook* deliberately refuses to fix any of those
  numbers — dues "will be variable", fences pay "a fraction" of market price —
  which is exactly why they belong on the sheet: your DM settles them once and
  you need them thereafter.
* **Standing, not deletion.** A character can be Active, an Apprentice, an
  Associate, Infiltrating, in arrears on his dues, Lapsed, Resigned, Expelled —
  or he can have betrayed them, or be hunted by them. Leaving a guild is part of
  the story, so nothing is thrown away when it happens.
* Tabs sort themselves by how much the standing matters right now: current
  memberships first, then the ones that could get you killed, then the ones you
  walked away from. Colour follows the same status system the follower cards use,
  and never carries the meaning alone — order, a strikethrough and the tooltip
  all say the same thing.
* Prints with the character sheet, between Character Details and Background.

**The Complete Thief's Handbook — completed**

* Every chapter of the book has now been read page by page rather than surveyed,
  which turned up two chapters that had been missed entirely. The classic cons
  chapter contributes two rules a thief would otherwise never find: rigging a
  die throw takes a pick pockets roll at −40%, once per die, and switching the
  pea in a shell game takes one too.
* Corrections to the proficiency descriptions, including an astrologer's +1 to
  navigation when the stars are out, and an observant character's better chance
  of spotting a concealed door.

* Swashbucklers fight with a fighter's THAC0 using their chosen blade, and the
  Combat Quick Reference now says how much better that is at their level — three
  points at 6th, ten at 20th. Subtract it from that weapon's line on the attack
  matrix; everything already in that line still counts.

**Fixes**

* Supplement books on the Options tab now start collapsed every time you open
  the app, and stay where you put them while you work. Previously, ticking any
  rule sprang every active book back open.
* Proficiency descriptions checked against *The Complete Ranger's Handbook* as
  well, which prints many of the same ones. Every slot cost, ability and modifier
  agreed; Alertness gained the fuller description the later book supplies.

#### v11.5.0

**The Complete Thief's Handbook**

* Six rule groups under PHBR2, each switchable on its own. A table that wants
  the armor table need not also take kit skill adjustments, and a table that
  wants neither can still stock the equipment.
* **Armor and thief skills.** The Player's Handbook covers three kinds of armor;
  the book covers ten. A thief in chain mail read −30% to pick pockets when the
  book says −40%, and one in plate armor read −30% where the book says −95%.
  Two rules ride along with it: no skill ever falls below 1%, and **no Dexterity
  bonus applies to thief skills in anything heavier than simple leather**. That
  second one removes a bonus rather than adding a penalty, so it is invisible in
  the armor percentages — the panel now names the exact amount lost from each
  skill rather than leaving you to find it in a tooltip.
* **All eighteen thief kits**, with the skill adjustments the book marks
  optional, the discretionary point budgets that differ for the Assassin and the
  Thug, and the extra proficiency slot a kit charges for a proficiency it is not
  listed for.
* **Thief equipment.** Sixty-one items priced with the legality the book gives
  them — freely sold, shady, or guild-only — and marked where even a legal item
  is hard to come by. Clothing carries its weight without adding to what you
  are carrying, as the book intends.
* **A thief equipment panel** in Tools. Tick what he is using and the adjusted
  skills appear beside his own. The modifiers that depend on circumstance behave
  like it: clawed gloves are worth +10 on a rough wall, +5 on a smooth one and
  nothing at all on glass, and the panel says so when they are worth nothing.
  It reads the sheet and never writes to it, because what he is holding this
  round is not a fact about the character.
* **Silenced elfin chain** — every link wrapped in leather, ten better at moving
  silently and five worse at picking pockets than ordinary elven mail, and
  costing more than plate.
* **Special function arrows** that carry a rope to a wall or a branch, with the
  grappling table and the real choice behind them: tie the rope straight to the
  arrow and lose half your range, or thread a light string through and spend a
  round for every twenty feet of rope.

**Acrobatics**

* **Tumbling** now has a panel of its own: the +4 armor class bonus with the
  conditions attached to it, the +2 to hit unarmed, and the falling rule that
  turns a sixty-foot drop into a thirty-foot one. The armor class bonus is not
  added to your armor class, and deliberately — it costs you every attack that
  round, so it belongs where you claim it rather than sitting on the sheet
  claiming itself.
* **Pole vaulting** takes a pole length and works out how far you span, how high
  you clear, and the highest obstacle you can still land on your feet over. It
  will tell you if the pole is the wrong length for your height and compute the
  figures anyway.
* **Armor and acrobatics.** Every acrobatic feat is affected by what you are
  wearing — a running broad jump loses twenty feet in plate armor. A jump whose
  distance comes out below zero is not a jump of no distance: you trip and land
  flat on your face. Getting off the ground with a pole in anything bulkier than
  leather needs a check, and in plate mail there is no roll that succeeds.

**Data corrections**

* The Player's Handbook equipment tables were checked against the tool's own
  records for the first time. Sixteen prices and weights were wrong, two of them
  by a factor of a hundred — a whetstone cost 2 cp instead of 2 gp, a vial of
  ink 8 gp instead of 8 sp. Three records blended two different Player's
  Handbook entries into one and have been split; thirty-one items that were
  simply missing have been added.
* Every corrected record now says which book it came from, so the next pass can
  tell what has been checked from what has merely always been there.

#### v11.3.0

**The Complete Fighter’s Handbook, in full**

* Seven rule groups under PHBR1 rather than one switch. A table that wants
  weapon groups should not also get piecemeal armor, and the old single toggle
  gave it no choice. Anything already switched on stays on — the split reads
  your old setting and inherits from it — and the moment you touch an
  individual group it becomes yours to set.
* **Weapon groups.** Two proficiency slots buys every axe in the game, three
  buys every blade. A group can never be specialized in as a whole, so the
  browser offers specialization directly on any weapon a group already covers,
  at its normal cost. Ten weapons belong to no group and must each be bought
  alone — the arquebus, blowgun, bola, chain, gaff, lasso, net, quarterstaff,
  nunchaku and sai.
* **Weapon quality**, poor through exceptional, kept firmly apart from
  enchantment: a fine blade gets its +1 and still cannot wound something that
  only magic can hurt. Fine grants +1 to hit *or* +1 damage, never both, so it
  is offered as two choices rather than one.
* **Weapons that break.** Stone and bone shatter on a roll of one or two on
  every hit that lands; lances break on a hit doing more than twelve or one
  turned by a shield. The rollers are in Tools beside the dice, because that is
  where you are when it matters, and the weapon card carries the reminder.
* **Kit weapon restrictions** marked in the browser, naming the kit and saying
  whether it forbids the weapon outright or only while the character is being
  built — a Beastmaster who could not carry a long sword at first level can
  carry one at second.
* **Armor fitting.** Whether the breastplate you took from a dwarf will fit an
  elf: the chance, which way it will fail, and the whole table alongside with
  your row and column marked.
* **High-quality racial armor.** Elven steel at half the weight, gnomish leather
  that takes no thieving penalty at all, halfling leather that counts as no
  armor, human plate built thicker instead of lighter that guards its wearer
  against rods, staves, wands and breath weapons.
* **Piecemeal armor.** Wear a splint breastplate over chain sleeves and hide
  leggings; armor class is summed from what covers you, each piece’s weight is
  worked out from the suit it came from, and the thieving penalty comes from the
  most restrictive piece you have on. This adds to the normal system rather than
  replacing it — a matched suit gives the same armor class either way.
* **Melee maneuvers.** All eleven, with their modifiers, results and the full
  rules behind each; the five body locations and what a hit to each does; and
  your numbed and useless thresholds worked out from your hit points. The list
  is filtered to what the weapon in your hand can actually perform, which is the
  part no printed card can do: a lasso never parries, a nunchaku manages four of
  the eleven, and every missile weapon is limited to called shots, disarms, held
  attacks and simply shooting.

**Characters moved to IndexedDB**

* Local storage caps at roughly 5MB per site, and every project hosted under the
  same account shares that one allowance. A dozen characters with portraits
  filled it, and a full store makes saving fail quietly — the worst way for it
  to fail.
* Existing characters migrate themselves the first time you open the tool.
  The old copy is kept until the new store has been read back successfully, so
  the changeover survives being interrupted.
* Portraits stay at full quality as a result, rather than being compressed to
  fit a limit that no longer applies.

#### v11.2.7

**Supplement support, starting with the Complete Ranger's Handbook**

* Settings gains a **Supplement Rules** tab: one row per book, in publication
  order, each expanding into two toggles. A book with anything switched on stays
  expanded, because a supplement in force and out of sight is how a table loses
  track of which rules it is playing.
* The split between the two toggles is the book's own. A handbook states some
  rules and merely offers others, usually in a sidebar, and the two deserve
  different treatment — bundling an experiment into "apply this book" would make
  a DM's judgement call automatic.
* The optional toggle **suppresses warnings** and enforces nothing. It is scoped
  rather than blanket: turning on the ranger book's optional rules quietens a
  gnomish Stalker, which that book explicitly permits, and still objects to a
  gnomish Paladin, which nothing does.

**The ranger, from the Complete Ranger's Handbook**

* All fifteen ranger kits transcribed from the book, five of which the tool
  never had — Falconer, Forest Runner, Guardian, Seeker and Warden. Every one of
  the ten that already existed was wrong: the Beastmaster carried ability score
  minimums the book does not ask for, the Giant Killer's damage bonus was four
  times what it should be, and the Stalker had a thief's backstab, which rangers
  do not get.
* The Crypt Ranger and Crypt Defender from DRAGON #234, whose author wrote them
  to replace the version sketched in the handbook.
* **Kits now affect stealth.** A Stalker's chance to hide in shadows was ten
  points short, silently, because nothing read the kit adjustments — the
  Feralan, Forest Runner, Justifier and Stalker all gain, the Mountain Man and
  Greenwood Ranger lose, and a Sea Ranger has neither ability at all.
* **Tracking** can use the handbook's tables in place of the Player's Handbook's
  single list: eight kinds of ground rather than five, four degrees of light
  rather than one blanket penalty, and modifiers the core book has no equivalent
  for — your own experience, your primary terrain, an assisting tracker, an
  animal follower. Terrain and light become a single choice each; the rest still
  stack. The bonus for your own level is read off the sheet rather than typed.
* **Animal empathy** gets a panel of its own. The number is a penalty to the
  *animal's* saving throw rather than a bonus to yours, so the panel says whose
  roll it is — a bare "−5" on a ranger's sheet reads as bad news otherwise.
  Domestic animals get no save at all.
* Thirteen nonweapon proficiencies the ranger kits referred to but the tool did
  not have — camouflage, cartography, falconry, foraging, persuasion, signaling,
  spelunking, trail marking, trail signs, veterinary healing and the rest.
  Thirteen weapons, including the machete a Pathfinder is required to carry, and
  thirty-six pieces of equipment, from falconry gear to bundle tents to the
  waterproof tinderbox.

**A movement band the Player's Handbook got wrong**

* Table 40 lists one band as "7-14" and the next as "14 or greater". The tool
  had to guess, and guessed the wrong way. The Complete Ranger's Handbook prints
  the same table without the overlap, so a tracking score of exactly 14 now
  slows the party to half speed rather than three-quarters. This one applies
  whether or not you use the supplement — a later printing of the same table by
  the same publisher is a correction, not an alternative.

**Ammunition carries what the book says about it**

* Arrow types now keep their range and damage modifiers and their notes, shown
  on the card: an armor-piercing arrow tells you it ignores a point of armor,
  and a sheaf arrow tells you it flies shorter than a flight arrow. All of it
  was already in the tool's data and none of it reached the sheet.
* These are shown for you to apply, not applied for you. An arrow does not know
  which of your bows it is for, and a good many of the modifiers are conditional
  — a point against unarmored opponents, extra dice against undead — which is a
  judgement rather than a sum.

**Kits in alphabetical order**

* The kit dropdown showed kits in whatever order they sat in the file, which
  looked alphabetical only by accident and stopped looking that way as soon as a
  book's kits were added in the book's order.

#### v11.2.0

**The light/dark control is a lantern**

* One glyph with two states: unlit for dark mode, lit for light. A sun/moon
  pair was tried first and rejected — with two icons there is always the
  question of whether you are looking at the mode you are in or the mode you
  would get. A lamp is the state rather than a name for it.
* It takes its colour from the active theme, so it is gold in Slate & Brass,
  green in Arborea, crimson in Bloodstone. The control it replaced carried six
  hardcoded colours and looked identically purple in all ten themes — it was
  the only piece of the interface that ignored your theme entirely.
* A glow around the lit lamp was mocked up and dropped. It reads as a
  rendering fault in Steel, whose accent is deliberately colourless.
* It is now a real button. It can be reached by keyboard, it announces its
  state to a screen reader, and it sits in the header rather than floating on
  top of the page — which also removes the special case that stopped it
  colliding with the sheet on narrow screens.

**Portraits keep the original image**

* Character art is almost always taller than it is wide, and the sheet's
  portrait box is wider than it is tall. Cropping used to resolve that by
  throwing the rest of the picture away.
* Now the picture is what gets stored, and the crop is recorded as a rectangle
  against it. The crop frames the thumbnail; it no longer discards anything.
* Hover the portrait — or press and hold it on a phone — and a framed window
  opens showing the full artwork.
* **Adjust is no longer lossy.** It used to re-crop its own previous output, so
  every adjustment lost a little quality and could only ever zoom further in.
  It now re-frames the original, however many times you do it, and reopens on
  the framing you last chose.
* Printing is unchanged. The plate still uses the crop, not the full image, and
  it is rendered when you print rather than stored.
* Portraits saved before this release still work and still print. Their window
  shows the cropped image, because for those there is no original left to show.
  Re-cropping one records a proper rectangle from then on.

**Sync tokens no longer travel in character files**

* Exporting a character used to embed that browser's sync token in the file.
  Since characters get passed around a table, that meant handing someone a
  character also handed them access to your cloud storage. Exports now contain
  character data and nothing else.
* The matching import behaviour — "adopt the token from a file if you have
  none" — has been removed. It could never actually run: the token is created
  on demand the moment anything asks for it, so "you have none" was never true
  by the time the check happened. Setting up a second browser has always used
  the manual paste in Settings, and still does.
* Older exports that still contain a token are harmless. Nothing reads it, and
  saving the character rewrites the file without it.

**Demo characters**

* Three finished characters now live in `demo_sheets/`, so the tool can be
  tried with something in it rather than an empty sheet.

#### v11.1.0

Follows on from v11.0.0, which introduced themes and the card status colours.

**Ten themes instead of three**

* Slate & Brass, Emberforge, Will-o'-Wisp, Arborea, Zakhara, Midnight,
  Spelljammer, Faerzress, Bloodstone and Steel — the default first, then a
  spectrum, then Steel, which has no hue to place.
* Picked from a grid of swatches rather than a dropdown. Each swatch shows the
  page background, the card over it and both accent colours, drawn in whichever
  mode you are currently in.
* Every theme was checked so that its own colour cannot be confused with the
  colours that carry rules meaning — which weapons you may use, which spells are
  still castable — including under red-green and red-blind colour vision.
* A theme you have selected that later stops existing now falls back to the
  default instead of leaving the page unstyled. That matters if you edit the
  theme file yourself.

**Buttons say what kind of thing they are**

* Every control used to be the same gold slab. A *Delete*, a *Show/Hide*, and
  **the tab you were currently on** were indistinguishable — so "where you are"
  and "what you can do" looked identical.
* Now there are four kinds: one filled action per panel where a panel has an
  obvious single purpose; ordinary actions that are quiet until you hover them;
  disclosures and row actions quieter still; and destructive actions in the
  warning colour.
* **Destructive buttons are the only ones that fill solid on hover.** That is
  deliberate rather than decorative: in a red-accented theme, "red means danger"
  cannot be told apart from "red means theme", so *Delete* had to be marked by
  something other than its colour.
* The vertical tab you are on is no longer button-shaped at all.

**Themes now change shape, not just colour**

* Corner radius follows the theme. Steel and Bloodstone are near-square
  throughout; Arborea is softer. Previously this only worked on a handful of
  elements because most corners were fixed in place.
* Roughly a hundred hardcoded values were replaced, and a batch of colours that
  ignored the theme entirely were fixed with them — the Rest & Recovery panel was
  purple in every theme, and the auto-adjusted field highlight was an electric
  cyan that appeared nowhere else.

**Fixes**

* The Settings panel's scrollbar no longer sits on top of the buttons at the
  right-hand edge.

#### v11.0.0

Two pieces of work that are not about rules at all. The chapter audit finished at
v10.5.0; this release is about making what the audit produced legible.

**Every tab was reorganised into named groups**

* The sheet used two kinds of horizontal rule to separate things, and neither
  said what it was separating. Gold meant one thing on some tabs and something
  else on others; grey meant "this browser fills the list below" on three tabs
  and "these are unrelated" on another. Meanwhile the most common relationship —
  *these sections belong together* — was drawn as nothing at all, so on the Core
  tab six identically-styled headings had to be understood as one group by
  noticing where a line **wasn't**.
* All 34 rules are gone. Each group now carries a named band, so the sheet says
  "Ability Effects" and "Load & Movement" and "Armaments" out loud instead of
  leaving you to infer them. A group holding one section absorbs its title
  rather than repeating it.
* Browsers sit tight above the list they fill, at reduced weight, so the pairing
  is shown by proximity rather than by a second colour of line.
* Section headings moved off gold onto their own colour. Gold now means
  structure and nothing else.

**Treasure has its own tab**

* The coin and treasure ledger totals coins *and* valuables, but it used to sit
  above the valuables list — a summary printed before one of the things it
  summarises. On its own tab the ledger is at the top and the lists that feed it
  are below.
* Encumbrance and Movement moved to the top of the Equipment tab for the same
  reason: the derived readout first, the list that produces it underneath.

**A colour language for card status**

* Weapon and spell cards carry a coloured rail showing proficiency and spell
  state. Two of the four colours in the weapon legend were never status colours
  at all — they were *theme* colours, so the legend changed meaning when the
  theme did.
* Proficiency and spell state now own dedicated colours that are the same in
  every theme. Learn the legend once and it stays learned.
* The whole set was checked against simulated red-green and red-blind colour
  vision. *Related* and *cast* are now a hollow rail rather than a grey one —
  colour blindness pulls saturated colours toward grey, so a grey "inactive"
  was the one thing that could not be told apart from everything else.

**Themes**

* Slate & Brass, Bloodstone and Midnight, each with independent light and dark
  modes. Chosen in Settings, remembered per browser, not saved with a character
  or synced.
* Light mode is deliberately dimmer than before. Pure white behind every card is
  the brightest thing a monitor can emit, and body text still reads at about
  eight times the contrast it needs.

**Fixes**

* An item with a quantity of **0** was counted as **1** for weight and value.
  Setting a quantity from 1 to 0 changed nothing while 1 to 2 worked, which is
  how it went unnoticed. Affected carried equipment, magic items, and both the
  weight and gold value of valuables.
* Button text was hardcoded near-black, which is correct on a gold button and
  unreadable on a dark one — so every button, and the selected vertical tab,
  became illegible in light mode.
* A group with nothing in it now hides itself, so a fighter no longer sees an
  empty "Class Standing" heading.

#### v10.5.0

A systematic review of Player's Handbook Chapter 14, *Time and Movement* — which completes the pass. **All fourteen chapters of the Player's Handbook have now been audited against the book, table by table.**

Movement turned out to be one of the least trustworthy parts of the sheet. Three of its five figures were wrong, and one of them was a rule that does not exist.

**Movement was labelled in the wrong unit**

* Every movement figure read *feet per turn*. A turn is ten minutes. The book gives movement in tens of feet per **round**, which is roughly a minute — so the sheet was describing your speed as ten times slower than it is. Base movement, current movement and the Combat Quick Reference were all affected.
* Outdoors, the same rate is measured in tens of **yards** per round rather than feet. Both readings are now given.

**Swimming was wrong three separate ways**

* The rate was a third of your movement. The book gives **half**.
* *Any* armor at all stopped you swimming. The book stops only **metal** armor — leather, padded and hide have never prevented anyone swimming, and no longer do here.
* The result was shown in feet. The book gives yards.
* That stray one-third turns out to be the rate for **walking along the bottom**, which is what you do when you cannot swim at all. It has its own field now, where it belongs.
* Added the rule that gear heavy enough to cut your movement to a third or less pulls you under regardless of what you are wearing.
* Characters without the Swimming proficiency are flagged rather than quietly given a rate. The book divides everyone into trained and untrained swimmers, and an untrained swimmer manages a dog-paddle in calm water and makes no noticeable progress. Whether your character can swim at all is your DM's call, so the sheet shows the figure without asserting you are entitled to it.

**Climbing was a number from nowhere**

* The sheet showed a climbing rate of half your movement. **There is no such rule.** The book makes the rate depend on the surface and its condition — anywhere from a quarter of your movement to four times it — and doubles it for thieves. No single number could be right, so the field is gone.
* In its place, a **Climbing** panel on the Tools tab. Pick a surface and a condition and it gives both your percentage chance of success and your rate of climb in feet per round.
* **Non-thief climbing is modelled for the first time.** Every character can climb to some degree; the book grades climbers as thief, mountaineer or unskilled, and the Mountaineering proficiency has always improved the chance without the tool doing anything with it.
* The chance of success itemizes what is moving it — your armor, your race, your load, the state of the surface, whether you have a rope and something to brace against. A low number explains itself instead of just looking broken.
* Thieves are deliberately not penalized twice for race, which the book warns about explicitly: a thief's Climb Walls score already has the racial adjustment folded in.
* Surfaces an unskilled climber simply cannot attempt are called out, along with the equipment a mountaineer needs for them.
* The penalties for fighting or casting while on a wall are spelled out on the panel — you lose your Dexterity and shield bonuses to armor class, take −2 on your own attacks, damage and saves, and cannot use a two-handed weapon.

**Running is an optional rule, and it is not a flat multiplier**

* Running at triple speed was presented as a plain derived statistic. The book prints jogging and running in a box headed *(Optional Rule)*, and triple speed requires a successful Strength check — quadruple at −4, quintuple at −8.
* Jogging and running now appear only when that rule is switched on, with the Constitution checks, the duration limits and the rest each pace demands.

**New: Overland & Endurance**

* Added a panel for travel over distance: a normal day's march of ten hours at twice your movement rate in miles, and force marching at two and a half times.
* Force marching carries a Constitution check at the end of each day, worsening for every consecutive day, and a **cumulative −1 to all attack rolls per day** that half a day's rest clears. Eight days of it is a −8 and four days of rest.
* Added diving and surfacing, both twenty feet per round before your load is counted, with the depth a run and a drop add to a dive.

**Holding your breath**

* Added the figure to the movement section: a third of your Constitution in rounds, halved while exerting yourself, halved again without a good gulp of air — and never less than one round, whatever the circumstances.

#### v10.4.0

A systematic review of Player's Handbook Chapter 13, *Vision and Light*, a full re-audit of Chapter 2, *Player Character Races*, a reopening of Chapter 9 for cover and concealment, and two bugs that had been quietly damaging saved characters.

**Two bugs worth knowing about**

* **Racial abilities never updated.** Every character's racial abilities were frozen at the moment the character was created. No correction to the underlying rules could ever reach an existing character, so characters have been carrying entries that were renamed or removed from the game data long ago — including one that isn't a 2nd Edition ability at all. They now regenerate, and old entries are cleaned up automatically the first time a character is opened.
* **Kit abilities were duplicating on every load, and kits were being silently lost.** The Kit dropdown was being set before its options existed, which fails silently — so every character came up reading "Standard Class" no matter what kit they had. Re-selecting the kit then appended a second full set of abilities, and saving stored the duplicates. Both are fixed and existing duplicates clear themselves on the next load. **If a character's kit still shows blank, it was saved with an empty kit and needs picking once more by hand.**

**Vision and light**

* Added a **Vision & Light** reference to the Tools tab, covering the book's sighting distances for eight weather and light conditions across the five ranges it distinguishes: seeing that something moved, spotting a figure standing still, making out what it is, identifying who it is, and seeing small actions clearly.
* The ranges adjust for the size of what you are looking at. A small target shifts every category down one; a large one doubles the first three and leaves the last two alone.
* Included the caveats the book attaches and a bare table loses: terrain changes your chance of noticing a creature but not the distances themselves, and the whole table assumes an Earthlike world.

**Light sources**

* The equipment list's light sources carried figures the book does not support. A torch was listed at a 30-foot radius burning for an hour; the book gives **15 feet** and **30 minutes**. Every lantern's burning time was inflated threefold, and a candle's sixfold. All corrected.
* Radius and burning time are now read from the book's light source table and shown live in the equipment browser, rather than written down a second time in the equipment data where the two could drift apart.
* Beacon and bullseye lanterns are described as cones rather than radii, with the width of the beam at its far end.
* The common lamp appears in the equipment list but in no light table in the book. It now says so plainly instead of showing figures from nowhere.
* **Existing characters keep the old text.** Item cards store their note when you add them and nothing rewrites them afterwards. Re-add a light source to pick up the corrections.

**Racial abilities**

* Added **dice rollers for every racial ability that is rolled**, replacing a dwarves-only panel that could only roll a d6. Gnomes detect unsafe walls on a d10 and halflings note a grade on a d4, so neither race could previously be represented at all. Elves and half-elves gained their three door-finding chances and their resistance to sleep and charm; dwarves and gnomes gained their magic item malfunction check.
* Removed an ability dwarves do not have. The dwarven panel offered a check for determining direction underground, which belongs to gnomes. The panel also claimed these abilities require a "10-foot movement rate", which is not a rule — the book requires the dwarf to be *within 10 feet* of what he is checking — and said all of them do, when depth is explicitly exempt.
* Corrected the magic item rules for dwarves and gnomes, which are **different rules** and had been given the same wording. A dwarf checks a continually worn item only the first time it is used in an encounter; a gnome checks a continuous-use device every time it is activated.
* The bonus against giants is an attack penalty on the monsters, not a bonus to your armor class, and now says so — it would otherwise read as applying against everything.
* Corrected the elven and halfling surprise bonus, which required being 90 feet *ahead* of your party. The book says 90 feet or more *away*.
* The Character Bonuses panel now reads its wording from the same place the ability cards do. The two had already drifted apart and described the same rules differently.

**Conditions**

* Added **Fighting via Mirror**. Fighting something you can see only by reflection costs −2 on attack rolls and forfeits your Dexterity bonus to armor class entirely. The same −2 applies to any action you direct by looking in a mirror, and a mirror is useless without a light source.
* **The conditions list is now alphabetized.** Twenty-four entries in the order they happened to be written was hard to search.

**Cover and concealment**

* Added a **Cover & Concealment** reference for missile fire. Cover is hard — a wall, a door, a tree trunk — and concealment is soft, like bushes or smoke, which cannot stop an arrow but make you harder to place.
* These are penalties to the attacker's roll rather than improvements to your armor class, so two of the rolls are yours: your own attack against something in cover, and the bonus to your own saving throw against spells causing physical damage while you are behind something.
* **vs Missiles AC** has always shown the same number as your normal armor class, and that turns out to be correct rather than unfinished — nothing in the Player's Handbook makes the two differ. Its explanation now says so instead of implying a calculation was still owed.

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
* Keep the tool self-contained — no framework, no build step, no account

## About This Project

This tool was created with the assistance of AI (primarily Claude).
I am not a programmer by trade—this project was built as a practical solution for my own AD&D 2E campaign needs.

## Contributing

This project is currently maintained as a personal tool, but suggestions and improvements are welcome.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
