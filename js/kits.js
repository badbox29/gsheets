// === Character Kits (AD&D 2E) ===
//
// Kit data structure:
// - name:         Kit name
// - class:        Base class required
// - source:       Provenance of this entry -- see PROVENANCE below
// - abilities:    Special kit abilities, painted into the Kit Abilities list
// - proficiencies: Weapon / nonweapon proficiency rules -- see PROFICIENCIES below
// - reaction:     Encounter-reaction adjustments -- see reaction below
// - requirements: Ability score / alignment / other requirements
// - benefits:     Mechanical bonuses (prose)
// - hindrances:   Restrictions and penalties (prose)
//
// ---------------------------------------------------------------------------
// PROVENANCE -- read this before trusting any number in this file.
// ---------------------------------------------------------------------------
//
// source.status is one of three values:
//
//   "verified"    Transcribed from a source that was in hand. source.work and
//                 source.pages name it. Trust these entries.
//
//   "unverified"  The kit NAME matches a published list, but the mechanics are
//                 unsourced paraphrase that has never been checked against the
//                 book. Several such entries carry demonstrably non-2e
//                 terminology (spell save DCs, Improved Initiative, Weapon
//                 Focus, Evasion, metamagic -- all 3rd Edition concepts), so
//                 the paraphrase as a whole cannot be trusted. source.work
//                 names the book a reviewer should open; source.pages stays
//                 null until someone actually reads it.
//
//   "house"       No published source. Deliberate house material.
//
// As each handbook is reviewed, re-transcribe its kits, fill in source.pages,
// and move status to "verified". Do not add structured mechanical fields to an
// unverified entry -- structuring paraphrase promotes invention into something
// the calculation engine will one day read as fact.
//
// ---------------------------------------------------------------------------
// ALIGNMENT REQUIREMENTS -- resolve to a SET, never to prose
// ---------------------------------------------------------------------------
//
// There are only nine alignments, so an approved list is always short enough to
// write down -- and writing it down removes the parser entirely:
//
//   alignment:        ["ng", "cg"]
//   alignmentPrinted: "any good alignment, but not lawful"
//
// `alignment` is the authoritative SET, resolved from the book's prose at the
// time the kit is audited. `alignmentPrinted` is the book's own wording, shown
// in the warning banner so the player sees the source rather than a recital of
// the resolved list.
//
// Do the reading once, here, where a person is holding the book. Do NOT store a
// phrase for the code to re-interpret at runtime: matchesAlignmentRequirement's
// string path matches on the FIRST axis keyword it finds and silently drops the
// rest, so "Any good, non-lawful" enforced only the non-lawful half and passed
// chaotic evil. The string path still exists for the unverified entries below;
// it is legacy, not a second option.
//
// An EMPTY array means UNKNOWN, not "nothing is permitted".
//
// Each entry states ITS OWN page's requirement, not the intersection with its
// class. The Warden's set is every non-chaotic alignment because that is all his
// page restricts; the ranger CLASS check narrows it to good separately. The
// Feralan's set is good-and-non-lawful because his page states BOTH. Reading one
// entry should tell you what that kit's book says, with no second file needed.
//
// ---------------------------------------------------------------------------
// PHBR11 TABLE 54 -- demi-ranger stealth, and a probable printing error
// ---------------------------------------------------------------------------
//
// Table 54 gives demi-ranger race adjustments to hide in shadows / move
// silently. Dwarf (-- / --) and Gnome (+5% / +5%) match THIEF_RACIAL_ADJUSTMENTS
// in tables.js exactly. The halfling row does NOT:
//
//   CRH Table 54:      Halfling  hide +10%  move +15%
//   PHB Table 27:      Halfling  hide +15%  move +10%
//
// TRANSPOSED. The app follows the PHB, which is the correct default -- a
// supplement's typo should not silently rewrite a core table. Recorded here
// rather than in a kit entry because it is a RACE row, not a kit row, and no
// kit owns it.
//
// Table 54 also gives demi-rangers a slower spell progression -- no spells
// until 10th level, capped at 2nd level. NOT MODELLED.
//
// ---------------------------------------------------------------------------
// demiRanger -- PHBR11 Table 53, dwarf / gnome / halfling rangers
// ---------------------------------------------------------------------------
//
//   demiRanger: { race: "dwarf", maxLevel: 15 }
//
// AN OPTIONAL PERMISSION, deliberately kept out of `race`. PHB Ch.2 allows
// rangers only to humans, elves and half-elves, and `race` holds that answer;
// this field holds what PHBR11 offers a table that wants to try demi-rangers.
// Merging them would make the data claim the PHB permits a dwarf ranger.
//
// THE BOOK PRESENTS THIS AS AN EXPERIMENT, not a rule it asserts -- "According
// to the Player's Handbook, only humans, elves, and half-elves can be rangers.
// But..." -- and the accompanying New Kits for Demi-Rangers section only
// SUGGESTS kits (Dwarven Spelunker, Gnomish Terraformer, Halfling Agronomist)
// without statting any. Those are deliberately NOT transcribed. Every kit named
// in Table 53 is an existing kit already in this file; the table adds a race
// and a suggested level cap, nothing more.
//
// WHAT IT IS FOR: the "Apply PHBR11 optional rules" toggle reads this field to
// scope its suppression. With that toggle on, validateRaceClass stays quiet for
// exactly these nine race-and-kit pairs and still warns for everything else. It
// SUPPRESSES A WARNING; it enforces nothing.
//
// Nine kits carry the field; the other six do not, and their absence means "not
// on Table 53", not "not yet transcribed". maxLevel is recorded because the
// book prints it, but the app models NO level limits for any race or class.
//
// Stalker and Mountain Man have their own text restricting race to human. That
// text is left as printed and is NOT treated as a contradiction: the kit says
// what it says, and a table running the optional demi-ranger rules may agree
// otherwise, which is what the toggle is for.
//
// ---------------------------------------------------------------------------
// thiefSkillMods -- ranger kit stealth adjustments (PHBR11 Table 12, p.11)
// ---------------------------------------------------------------------------
//
//   thiefSkillMods: { hideInShadows: 10, moveSilently: 10 }
//
// PERCENTAGE POINTS, added to the figures getRangerStealth() computes from PHB
// Table 18. 0 means the book prints "--" (no adjustment). NULL means the kit
// has no such ability at all -- only the Sea Ranger, who has neither, and whose
// entry carries a `note` saying so. A null must NOT be treated as zero.
//
// Ranger-only for now. If another class's handbook turns out to adjust thief
// skills per kit, widen the shape rather than adding a second field.
//
// ---------------------------------------------------------------------------
// TERRAIN AND RACE -- same treatment as alignment
// ---------------------------------------------------------------------------
//
// Both are closed domains, so both resolve to a SET at audit time with the
// book's own wording kept alongside:
//
//   terrain: ["forest", "jungle"]        terrainPrinted: "Required: Forest or Jungle"
//   race:    ["human", "half-elf"]       racePrinted:    "Cannot be a full elf"
//
// ABSENT MEANS ANY. A kit with no `terrain` key may take any primary terrain;
// a kit with no `race` key is open to any race the CLASS allows. Absence never
// means "not yet transcribed" -- source.status is the only field permitted to
// say that.
//
// TERRAIN VOCABULARY (10), taken from the CRH's own usage:
//   arctic, aquatic, desert, forest, hill, jungle, mountain, plains, swamp, urban
// `urban` is a Stalker special case; the CRH does not otherwise treat it as a
// primary terrain. If a consumer is ever built, this list should move to
// tables.js so druid terrain can share it rather than defining a second one.
//
// RACE VOCABULARY: the keys already used by RACE_ABILITY_REQUIREMENTS in
// tables.js -- human, dwarf, elf, gnome, half-elf, halfling. NOTE that
// `halfelf` is an alias there; use the hyphenated form here.
//
// WHY SETS, again: the Mountain Man was stored as the string "Not a full elf".
// That is a negation in prose over a closed domain -- structurally the same
// thing as "Any good, non-lawful", and the same silent-half-enforcement bug
// waiting for whoever writes the race check. It is now ["human", "half-elf"],
// which is what the CRH's Demi-Rangers section (p.79) leaves once full elves
// are removed from the three races that may be rangers at all.
//
// ---------------------------------------------------------------------------
// PROFICIENCIES -- the four-way split
// ---------------------------------------------------------------------------
//
//   proficiencies: {
//     weapon:    { bonus, bonusChoice, required, recommended, allowed,
//                  allowedGroups, barred, barredGroups, allowedPrinted, note },
//     nonweapon: { bonus, bonusChoice, required, recommended, allowed,
//                  barred, allowedPrinted, note }
//   }
//
// Top level, a sibling of abilities and requirements -- NOT inside requirements,
// even though three of the fields gate. The relationships all come out of one
// printed paragraph, and splitting them by whether they gate would make the
// transcriber decide twice about a single sentence.
//
//   bonus        Granted FREE at 1st level. Costs no slot.
//   bonusChoice  A free grant the player CHOOSES from. Array of groups; pick one
//                from each. "Bonus: Hunting or Fishing" is one free proficiency,
//                not two, so it cannot be a flat bonus array.
//   required     The kit forces one of the character's own slots onto it.
//   recommended  Flavour. No mechanical force whatsoever.
//   allowed      Whitelist -- everything outside it is flagged.
//   barred       Blacklist.
//
// ONLY ONE OF THESE HAS A PHB ANALOGUE. The PHB has exactly one relationship --
// a slot was spent or it wasn't -- with Table 37 crossover as a PRICE, not a
// different kind of relationship. It never grants a proficiency free, never
// mandates one, never suggests one, and has no concept of a forbidden one.
// bonus and required are ARITHMETIC WITH OPPOSITE EFFECTS on the slot budget.
//
// RULES:
//
// 1. OMIT any key the book does not restrict. NEVER write []. This is
//    deliberately DIFFERENT from the alignment convention above, where empty
//    means unknown: source.status already carries "not yet transcribed", so an
//    empty array here has no job -- and [] is truthy and sails through if (!x).
//    The Warden has no proficiencies key at all, because his page restricts
//    nothing. That is the rule working, not an omission.
//
// 2. allowed and barred are MUTUALLY EXCLUSIVE -- transcribe the shape the book
//    printed, and never derive one from the other. Deriving barred from allowed
//    enumerates today's core_wp.json into a kit's rules; add a weapon next year
//    and the derived list is silently wrong.
//    ONE EXCEPTION, and it is a real one: the Seeker carries BOTH, because his
//    page prints two different SCOPES -- an allow-list governing his single
//    1st-level slot, and a permanent absolute prohibition on swords. When a book
//    does that, record both and say so in note.
//
// 3. WEAPON AND NONWEAPON ARE SEPARATE BLOCKS. Different slot pools, different
//    name lists, restricted independently by the books.
//
// 4. NAMES ARE CANONICAL, resolving against core_nwp.json's Proficiency Name and
//    core_wp.json's Weapon Name. The book's own wording goes in allowedPrinted
//    and note, never in an array. The books and these files disagree constantly:
//    "Modern Languages" is Languages, Modern; "short sword" is Sword, Short;
//    "staff" is Quarterstaff; "Cobbler" is Cobbling; "Tailor" is
//    Seamstress/Tailor; "kopesh" is Sword, Khopesh; "Weaponsmithing (Crude)" is
//    Weaponsmithing, Crude. NOTE THAT core_wp.json HAS NO SINGLE CONVENTION --
//    Short Bow and Hand Axe are natural order while every sword is inverted --
//    so every name must be checked rather than derived from a rule.
//
// 5. A NAME-RESOLUTION VALIDATOR IS THE POINT of storing names. Normalise case
//    and whitespace ONLY, never word order, never fuzzy. A word-order mismatch
//    is a transcription error and must FAIL rather than be silently repaired.
//
// PRECEDENT: languages already carry isGranted -- free, badged GRANTED, excluded
// from slots-spent but still counted against the Intelligence cap. That is
// exactly bonus semantics. NWP entries have NO equivalent flag, and that is the
// one genuinely new piece of plumbing a consumer will need.
//
// WHAT THESE FIELDS CANNOT SAY -- and deliberately do not try to.
//
// Eight ranger kits restrict SLOT COUNT or SLOT ORDER rather than WHICH
// proficiency, and none of it is expressible here. Every case is recorded in the
// relevant note, in the book's words, prefixed SLOT RULE / SLOT COUNT /
// SLOT PATTERN / COST REDUCTION so it can be grepped when a consumer exists:
//
//   Seeker         one weapon proficiency at 1st level
//   Justifier      one nonweapon slot at 1st level; a mandatory specialization
//   Giant Killer   one nonweapon proficiency at 1st level; 1st and every ODD
//                  weapon slot must be a missile weapon
//   Explorer       twice the normal languages from Intelligence
//   Falconer       two of the INITIAL weapon slots from a list; rest free
//   Forest Runner  an EXTRA weapon slot, then three of the first six from a list
//   Pathfinder     one initial slot from machete / hand axe / any sword
//   Seeker, Forest Runner   a proficiency at reduced slot cost
//
// NOT BUILT ON PURPOSE. Nothing in the app computes a slot budget from a kit, so
// there is nothing to feed; the shapes are three different problems (a count cap,
// an ordinal pattern, a partial fill); and designing all of them off fifteen
// ranger kits before seeing how PHBR1's fourteen phrase the same ideas is the
// design-up-front error this file already has a scar from. Add them when a
// consumer exists AND a second book has shown the shape.
//
// The obvious next field is requiredChoice -- the paid mirror of bonusChoice,
// which the Pathfinder needs. It is left out only because one kit is not enough
// evidence to name a field after.
//
// KNOWN DUPLICATION, ACCEPTED: the ability cards repeat these names in prose.
// The card is what the PLAYER READS; the field is what the APP COMPUTES FROM.
// Two places to drift. The eventual fix is to generate the card from the field.
//
// ---------------------------------------------------------------------------
// reaction -- encounter-reaction adjustments granted by a kit
// ---------------------------------------------------------------------------
//
//   reaction: [
//     { modifier: -3,
//       applies:  "NPCs from male-dominated societies",
//       printed:  "The Amazon suffers a -3 reaction roll adjustment from..." }
//   ]
//
// AN ARRAY, because a kit routinely grants more than one and they point in
// opposite directions -- the Barbarian has +3 and -3, the Cavalier has +3, -3
// and a third permanent -3 that only applies once he has abandoned his Kit.
// `applies` is the condition in the transcriber's words, short enough to render
// on a card; `printed` is the book's own sentence.
//
// APPLIED BACKWARDS. PHBR1 p.14, "An Important Note", governs every kit in the
// book and is the reason this field cannot be a plain number added to a roll:
//
//   "When you roll the 2d10 for encounter reactions, DON'T add the bonus (+) or
//    subtract the penalty (-) from the die roll. Do it the other way around. If
//    the character has a Charisma of 16, and thus gets a +5 reaction adjustment,
//    you SUBTRACT that number from the 2d10 die roll. (Otherwise the NPCs would
//    be reacting even more badly because the character was charismatic!)"
//
// So a POSITIVE modifier here is stored as the book prints it, and a consumer
// must SUBTRACT it from the 2d10 result. Storing the negated value instead would
// make the data disagree with the page, and every future transcriber would have
// to remember to flip it.
//
// The Barbarian and the Berserker make the direction unmistakable: the Barbarian
// gets his +3 only on rolls of 8 or LESS (pushing an already-good reaction
// better) and an extra -3 on rolls of 14 or MORE (pushing a bad one worse).
//
// NOT MODELLED, and recorded in `applies` rather than structured: the Noble
// Warrior's +3 erodes at -1 per incident when he cannot afford to live well, and
// collapses to -6 outright if he earns a bad reputation. Conditional, mutating
// reaction values are a consumer problem, not a data-shape problem.
//
// ---------------------------------------------------------------------------
// PHBR1 CHAPTER 2 -- rules that apply to all fourteen fighter kits
// ---------------------------------------------------------------------------
//
// ONE KIT ONLY, CHOSEN AT CREATION. "You can only take one Warrior Kit for your
// character," and only when the character is first created -- with one exception:
// if a player and DM both want to integrate these rules into an existing
// campaign, they may agree what Kit each existing PC most closely resembles.
//
// ABANDONING A KIT (p.37). PHBR1's rule is STRICTER than the CRH's and the
// difference matters: "The character may not take another Warrior Kit to replace
// the one he's abandoned. Once he gives up his Warrior Kit, he's an ordinary
// Fighter, Paladin, or Ranger for the rest of his playing life." Bonus
// proficiencies are handled the same way as the CRH -- not lost, but they must
// be paid for out of the next free slots available.
//
// MULTI-CLASS (p.36): only SINGLE-CLASS warriors can take a Warrior Kit. With DM
// permission a multi-class warrior may use his proficiency choices to SIMULATE
// one, and be considered "one of their own" in the campaign, without the Kit.
//
// DUAL-CLASS (p.37): a character who starts as a warrior keeps the benefits and
// hindrances of his Kit after changing class, and may NOT choose a new one. A
// character who starts in another class and later switches to a warrior class may
// choose a Kit then, though the DM may require campaign events first.
//
// MODIFYING KITS (p.37): the DM "can, and should" modify these to fit his own
// setting. The book's own worked example swaps the Amazon's required Riding and
// Animal Training for Seamanship and Navigation because that DM's Amazons are
// sailors. This is why kit requirements WARN and never gate -- see
// gsheets_project_notes.md, "Lock when the MODEL says so; warn when a BOOK says so".
//
// WHAT IS DELIBERATELY NOT STRUCTURED HERE. Five axes recur across these kits
// that no field in this file can express. Every one is recorded in a note with a
// grep-able prefix so a future consumer can find them all at once:
//
//   SPECIALIZATION   Amazons may specialize ONLY in Spear or Long Bow; Gladiators
//                    and Myrmidons get a FREE Specialization from a fixed pool;
//                    Samurai must specialize in Katana and Daikyu; Swashbucklers
//                    must specialize in all four of their weapons before their
//                    slots free up.
//   EQUIPMENT        Restrictions on what may be BOUGHT at creation, which is a
//                    different axis from what may be learned -- and which often
//                    EXPIRES. The Beast-Rider is limited to Hide/Leather/Padded
//                    at creation and may upgrade later; the Savage gets no gold
//                    at all; the Noble Warrior has a minimum rather than a maximum.
//   RACIAL VARIANT   Dwarf, gnome and halfling Amazons have DIFFERENT required
//                    weapons and DIFFERENT bonus nonweapon proficiencies from the
//                    human Amazon. p.13 says the same of the Noble Dwarf-Warrior.
//   CROSSOVER COST   The books tag recommended entries by group with per-entry
//                    cost multipliers -- "(Priest, double slots unless Paladin)".
//                    Several kits list the SAME proficiency twice under two
//                    groups at two different costs; that is transcribed as printed.
//   SLOT COUNT /     Samurai get two free weapon slots with five of six already
//   SLOT PATTERN     spent; Swashbucklers get two free slots and must then devote
//                    half of all subsequent slots to four named weapons.
//
// Not built because no consumer computes a slot budget or an equipment budget
// from a kit, and because a second book has not yet shown these shapes. Add them
// when both are true.
//
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THREE THINGS ARE CALLED "WEAPON GROUP". DO NOT MERGE THEM.
// ---------------------------------------------------------------------------
//
//   Group / WEAPON_GROUP_ORDER   core_wp.json, tables.js.  21 values.
//       "What shelf is this weapon on?" Drives browse and filter, AND is the
//       fallback for the related-weapons half-penalty when the PHB omits a
//       weapon.  UNSOURCED -- a house taxonomy with no book behind it.
//
//   PHB_RELATED_WEAPONS          tables.js.  10 sets.
//       "Does my proficiency partly cover this?"  NARROWER than Group: the sword
//       set is only scimitar / bastard / long / broad.  PHB Ch.5, verbatim.
//
//   Tight Groups / Broad Groups  PHBR1 pp.58-60.  NOT YET BUILT.
//       "What can one slot buy?"  A Tight Group costs TWO slots and grants
//       proficiency in every weapon in it.
//
// allowedGroups and barredGroups point at THE FIRST of these, because it is the
// only taxonomy that partitions the whole list -- every weapon has a Group,
// where PHB_RELATED_WEAPONS covers about forty and leaves the rest unassigned. A
// kit restriction has to answer "may I take this?" for every row in the browser,
// including weapons from books not yet audited.
//
// The cost, recorded honestly: a printed kit restriction is resolving through
// house data. Mitigated by keeping the check ADVISORY and by storing
// allowedPrinted beside it.
//
// TWO CONTAINMENTS:
//   - PHBR1's tight/broad system changes slot ARITHMETIC and is a separate
//     build. Register it as TIGHT_GROUPS / BROAD_GROUPS so nobody later reads
//     allowedGroups as a purchasable unit.
//   - allowedGroups MUST NEVER REACH areWeaponsRelated. A kit restriction
//     governs what you may LEARN; the related rule governs how well you SWING.
//     Leaking one into the other silently widens a PHB rule.
//
// WHY GROUPS ARE STORED AND NOT RESOLVED TO NAMES. Alignment, terrain and race
// resolve to sets at audit time because those domains are CLOSED -- nine, ten
// and six values, fixed forever. The weapon list is NOT closed: 95 today, more
// with every book. "axe (any)" resolved to four names in 2026 silently excludes
// an axe printed in a book audited in 2027.
//   RESOLVE AT AUDIT TIME WHEN THE DOMAIN IS CLOSED.
//   STORE THE RULE WHEN THE DOMAIN IS OPEN.
//
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ADVISORY, NEVER BLOCKING -- do not "fix" this into a gate
// ---------------------------------------------------------------------------
//
// Every requirement in this file reports; none prevents. Nothing here clears a
// kit, blocks a selection, or strips an ability, and nothing ever should.
//
// This is a play requirement, not a style preference. Artifacts change
// alignment. A DM may impose a change -- of alignment, gender, or anything else
// -- as a consequence of what happened at the table, or may simply rule that a
// character keeps his kit through a change that the book would not normally
// allow. A character who has been playing for two years must not lose his kit
// because a validator disagreed with his DM. Warn, explain, and get out of the
// way.
//
// ---------------------------------------------------------------------------
// ABANDONING KITS (CRH p.77) -- applies to every ranger kit below
// ---------------------------------------------------------------------------
//
// Once a kit is chosen it cannot be EXCHANGED for a different one, but unless
// otherwise specified it can be abandoned entirely, the character continuing as
// a standard ranger. On abandonment: all of the kit's bonuses and benefits are
// lost and all penalties and hindrances are ignored; the character may use any
// weapons and armor normally available to a ranger; new weapon proficiency
// slots may be spent freely; the kit's nonweapon proficiency requirements and
// recommendations no longer apply; and bonus proficiencies AREN'T forfeited --
// they are set aside (written down but not used) until the character acquires
// new nonweapon proficiency slots, which must be spent paying for the former
// bonus proficiencies, in an order the player chooses, before any new
// nonweapon proficiencies can be taken.
//
// EXCEPTION: a transformed Greenwood Ranger cannot abandon his kit.
// NOT ENFORCED BY THE SHEET.
//
// PHBR1 p.37 states a STRICTER rule for its own fourteen fighter kits: an
// abandoned kit may never be replaced with another. See the PHBR1 CHAPTER 2
// section below. The two books differ; each governs its own kits.
//
// ---------------------------------------------------------------------------
// AMBIGUITY BLOCKS
// ---------------------------------------------------------------------------
//
// An ability may carry an optional `ambiguity` object where the printed source
// is wrong, unclear or self-contradictory and a call has been made:
//
//   printed    what the source actually says, verbatim in substance
//   ruling     what this sheet treats it as
//   rulingBy   "as-printed" when ruling matches printed and no call was needed,
//              "dm" when the table has ruled otherwise
//   basis      why, in enough detail that the call can be re-examined later
//
// The ability's `notes` states the RULING, because that is what the player
// plays; `printed` exists so the call is always traceable back to the page.
// Use this instead of burying the problem in prose -- an ambiguity recorded in
// a structured field can be surfaced, re-reviewed or reversed. Plain typos with
// no mechanical consequence are simply corrected and mentioned in source.note.
//
// NOTHING IN THE APP READS source.status OR ambiguity TODAY. An unverified kit's ability
// cards look exactly as authoritative as a verified one's. Surfacing the status
// in the UI is a separate, tracked task.
//
// ---------------------------------------------------------------------------
// CONSUMERS -- what will break if the shape here changes.
// ---------------------------------------------------------------------------
//
//   populateKitDropdown   calc.js    Object.values() over a class block, so any
//                                    key added inside one becomes a phantom kit
//                                    in the dropdown. Do NOT add _meta keys.
//   renderKitAbilities    calc.js    Paints abilities[] as auto-generated cards
//   validateKitAlignment  tables.js  Reads requirements.alignment only
//   collectSheet          app.js
//   print header          print.js
//
// The kit is stored on the sheet as name.toLowerCase().replace(/\s+/g,''), not
// as the object key here. Keep the two aligned.

const KITS = {
  // ========== FIGHTER KITS ==========
  fighter: {
    // ===== PHBR1, Chapter 2. All fourteen kits, transcribed August 2026. =====
    amazon: {
      name: "Amazon",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "14-16",
        note:   "No ability-score requirements. The book is emphatic that the kit is NOT a gate on female warriors: \"you don't HAVE to be an Amazon to be a female warrior... the DM should try to accommodate the player whenever possible, and shouldn't have to resort to making the character an Amazon in order to allow her to be a warrior.\" Recorded because it settles a long-standing open question in this file's own terms."
      },
      requirements: {
        race: ["human", "elf", "half-elf", "dwarf", "gnome", "halfling"],
        gender: ["female"],
        racePrinted:
          "Amazons from folklore and myth were humans; elvish, half-elvish, dwarvish, gnomish and halfling clans are all explicitly allowed",
        genderPrinted:
          "Amazons are women warriors"
      },
      reaction: [
        { modifier: -3,
          applies: "NPCs from male-dominated societies",
          printed: "The Amazon suffers a -3 reaction roll adjustment from NPCs who are from male-dominated societies. This reaction adjustment goes away for characters who come to respect her, such as (presumably) her PC allies." }
      ],
      proficiencies: {
        weapon: {
          required: ["Spear", "Long Bow"],
          recommended: ["Battle Axe", "Hand Axe", "Sword, Long", "Sword, Short", "Sword, Broad"],
          allowedPrinted:
            "Required: Spear, Long Bow. Recommended: Various axes, swords.",
          note:
            "SPECIALIZATION: Amazon fighters can Specialize ONLY in Spear or Long Bow. RACIAL VARIANT: dwarf Amazons require Battle Axe and War Hammer instead, and ride swine; gnome Amazons require Throwing Axe and Short Sword; halfling Amazons require Javelin and Sling. The book prints \"various axes, swords\" without naming them -- the recommended list here is the resolvable reading and is NOT a verbatim transcription. THROWING AXE HAS NO RECORD in core_wp.json, so the gnome variant cannot be fully resolved."
        },
        nonweapon: {
          bonus: ["Riding, Land-Based", "Animal Training"],
          recommended: [
            "Animal Handling", "Animal Lore", "Armorer", "Bowyer/Fletcher", "Hunting", "Running",
            "Survival", "Tracking"
          ],
          note:
            "CROSSOVER COST: the book tags Animal Lore, Armorer, Bowyer/Fletcher, Hunting, Running, Survival and Tracking as Warrior-group entries and Animal Handling as General. RACIAL VARIANT: gnome Amazons take Tracking and Survival as their BONUS proficiencies; halfling Amazons take Endurance and Set Snares; dwarf Amazons keep Riding but substitute swine as the mount."
        }
      },
      abilities: [
        { name: "First Blow Against an Unwary Male",
          notes: "In any fight where the Amazon confronts a male who is not familiar with her personally or with female warriors in general, she gets +3 to hit and +3 damage on her FIRST BLOW ONLY, because her opponent's guard is down. This does NOT work on player-characters unless the player is role-playing honestly enough to declare that he, too, would underestimate her. An NPC wary enough not to underestimate her may, with a successful Intelligence check, see the attack coming and deny her the bonus. A seasoned veteran -- any Warrior of 5th level or higher, or any other character of 8th level or higher -- will realise she is moving like a trained warrior and keep his guard up in spite of his prejudice. If she hits an NPC with this attack he will never again be prey to it; if an NPC even SEES an Amazon hit someone with it, he will never fall for it himself. But if she misses that first strike, the target will continue to underestimate her and she can use those bonuses again on her next strike." },
        { name: "Equipment Restricted at Creation",
          notes: "EQUIPMENT: when first created she must buy her weapons and armor from among these choices only. Weapons -- Battle Axe, Bow (any), Club, Dagger/Dirk, Hand or Throwing Axe, Javelin, Knife, Lance, Spear, Sword (any). Armor -- Shield, Leather, Padded, Studded Leather, Brigandine, Scale Mail, Hide, Banded Mail, Bronze Plate Mail. Once she has adventured elsewhere in the world she may purchase weapons and armor from those regions." },
        { name: "Secondary Skill: Groom",
          notes: "SECONDARY SKILLS: Groom is required. Left as prose -- the app assumes the optional proficiency system is in play." }
      ],
      wealth:
        "Ordinary 5d4x10 gp starting money."
    },
    barbarian: {
      name: "Barbarian",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "16-17",
        note:   "Transcribed from the book."
      },
      requirements: {
        str: 15,
        strPrinted:
          "must have a Strength ability score of 15 or more"
      },
      reaction: [
        { modifier: 3,
          applies: "encounter rolls of 8 or less, from sheer strength, intensity and animal magnetism",
          printed: "Barbarians are impressive because of sheer strength, intensity, and animal magnetism; this gives them a +3 reaction adjustment bonus in certain situations. Whenever the barbarian character achieves a reaction roll of 8 or less (including Charisma and racial bonuses), you SUBTRACT the modifier." },
        { modifier: -3,
          applies: "encounter rolls of 14 or more -- the barbarian is scary and the other person overreacts",
          printed: "Whenever the barbarian character achieves a reaction roll of 14 or more, he takes an additional -3 modifier. If the reaction is negative at all, it will be even more negative than it otherwise would have been." }
      ],
      proficiencies: {
        weapon: {
          required: ["Battle Axe", "Sword, Bastard"],
          recommended: ["Sling", "War Hammer", "Sword, Long", "Sword, Short", "Sword, Broad"],
          allowedGroups: ["Bow"],
          allowedPrinted:
            "Required: Battle Axe, Bastard Sword. These are the classical fiction-barbarian weapons; the DM may decide to substitute others more appropriate to his own world. Recommended: Bow (any), Sling, Sword (any), War Hammer.",
          note:
            "SPECIALIZATION: Barbarian fighters may specialize in any weapon, but are not likely to encounter unusual weapons (lances, quarterstaves, flails, peculiar polearms) until they reach the outer world. \"Bow (any)\" and \"Sword (any)\" are group phrasings; the swords resolvable from core_wp.json are listed and the bows are carried in allowedGroups."
        },
        nonweapon: {
          bonus: ["Endurance"],
          recommended: [
            "Animal Handling", "Animal Training", "Direction Sense", "Fire-Building",
            "Riding, Land-Based", "Weather Sense", "Blind-Fighting", "Hunting", "Mountaineering",
            "Running", "Set Snares", "Survival", "Tracking", "Herbalism", "Jumping"
          ],
          note:
            "CROSSOVER COST, printed per group: General -- Animal Handling, Animal Training, Direction Sense, Fire-Building, Riding (Land-Based), Weather Sense. Warrior -- Blind-Fighting, Hunting, Mountaineering, Running, Set Snares, Survival, Tracking. Priest (costs TWICE the listed slots if Fighter or Ranger, or just the listed number if Paladin) -- Herbalism. Rogue (costs DOUBLE slots) -- Jumping. The DM is within his rights to insist the character also take a proficiency in the tribal specialty (Fishing, Agriculture, whatever)."
        }
      },
      abilities: [
        { name: "Equipment Restricted at Creation",
          notes: "EQUIPMENT: when he spends his starting gold he may not buy armor heavier than splint mail, banded mail, or bronze plate mail, and must limit himself to weapons the DM says are appropriate for his tribe -- the usual group includes battle axe, bows (any), club, dagger or dirk, footman's flail, footman's mace, or pick, hand or throwing axe, sling, spear, or sword (any). Outside his tribe, once he has adventured in the outer world, he can use any type of armor without penalty." },
        { name: "Secondary Skill: Tribal",
          notes: "SECONDARY SKILLS: the DM decides based on the character's background. Most barbarian tribes have a required skill -- a tribe that makes its living by fishing would have Fisher as its required secondary skill." }
      ],
      wealth:
        "5d4x10 gp, but he must spend it all before starting play except three gp or less. He can have some pocket change when he reaches civilization, but must be close to penniless.",
      races:
        "Demihuman Barbarians follow the same rules. Dwarves are perhaps the most admirably suited. The DM decides whether elves, half-elves and gnomes are brooding and menacing enough, and the question is harder still with halflings.",
      finalNote:
        "FINAL NOTE: most classic fantasy-fiction barbarians are male, but this Warrior Kit can certainly be taken by female characters, with all the Kit's requirements, benefits, and hindrances in effect."
    },
    beastrider: {
      name: "Beast-Rider",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "18-19",
        note:   "Transcribed from the book."
      },
      requirements: {
        cha: 13,
        chaPrinted:
          "must have a Charisma of at least 13"
      },
      reaction: [
        { modifier: 5,
          applies: "the one type of animal he is attuned to",
          printed: "The Beast-Rider gets a +5 positive reaction adjustment whenever dealing with these animals. On a die-roll result of 9 or less on the \"Hostile\" column of the Encounter Reactions Chart he can even persuade attacking animals of this sort to leave him and his allies alone." },
        { modifier: -3,
          applies: "NPCs from any culture but his own",
          printed: "The Beast-Rider is out of place in most societies. He takes a -3 negative reaction adjustment when meeting NPCs from any culture but his own. The player-characters do not have to be hostile to the Beast-Rider if they do not wish, however." }
      ],
      proficiencies: {
        weapon: {
          recommended: [
            "Composite Short Bow", "Short Bow", "Flail, Horseman's", "Mace, Horseman's",
            "Pick, Horseman's", "Spear", "Sword, Bastard", "Sword, Long"
          ],
          allowedGroups: ["Lance"],
          allowedPrinted:
            "Required: None. Recommended: all the weapons commonly associated with mounted warriors -- Bow (composite short, and short), Horseman's flail, Horseman's mace, Horseman's pick, Lance (any, according to the size of the animal), Spear, Bastard Sword, Long Sword.",
          note:
            "Lance is recommended \"any, according to the size of the animal\" and is carried in allowedGroups rather than resolved to one of the four Lance records."
        },
        nonweapon: {
          bonus: ["Animal Training", "Riding, Land-Based"],
          recommended: [
            "Animal Handling", "Direction Sense", "Fire-Building", "Healing", "Animal Lore",
            "Hunting", "Mountaineering", "Set Snares", "Survival", "Tracking"
          ],
          note:
            "The character MUST DECLARE which one sort of animal both bonus proficiencies pertain to. CROSSOVER COST: General -- Animal Handling, Direction Sense, Fire-building. Priest -- Healing (specifically veterinary). Warrior -- Animal Lore, Hunting, Mountaineering, Set Snares, Survival, Tracking. The book means the PHB Healing proficiency applied to animals, NOT the separate Veterinary Healing proficiency PHBR11 introduced two years later."
        }
      },
      abilities: [
        { name: "Bonded Mount",
          notes: "Begins play with one animal as his personal friend and mount. The animal is devoted to him and will risk or even sacrifice its own life to save the character; the character is expected to behave the same way toward his mount. The animal must be of a species normally strong enough to carry him, and the DM decides what sort of animal it is -- he is encouraged to disallow anything that would give the Beast-Rider a great advantage in the campaign, such as a pegasus or griffon. The book lists appropriate mounts: bat (huge/mobat, gnomes and halflings only), bear, boar, buffalo, camel, dolphin, dragon (very high-powered heroic campaigns only), elephant, griffon, hippogriff, horse, hyaenodon, lizard (fire, giant or minotaur), giant lobster, pegasus, manta ray, giant sea-horse, smilodon, wild tiger, unicorn (traditionally only virgin lawful-good females may ride), dire wolf. Weight-bearing abilities are taken from the animal on PHB p.78 that most resembles it in size and mass." },
        { name: "Telepathic Rapport",
          notes: "When in contact or visual line of sight with his animal he can tell what the beast is feeling, even thinking if it has some intelligence; he and the animal can communicate with one another without appearing to. When out of sight of one another, each will know the other's emotional state and whether or not the other is hurt; each will know the direction to travel to find his friend, and the approximate distance." },
        { name: "If the Animal Dies",
          notes: "The Beast-Rider immediately takes 2d6 points of damage and must make a saving throw vs. spells. If he fails, he behaves as if he were a magic-user hit with feeblemind for the next 2d6 hours. He may choose another animal of the same type, but the DM must make the search part of the campaign story -- only the healthiest, strongest, greatest example will satisfy him, and there must be some sort of bonding ritual between beast and man before the character can have his new animal." },
        { name: "Equipment Restricted at Creation",
          notes: "EQUIPMENT: when first created he may only have Hide, Leather, or Padded armor, plus shield and helm. Later in the campaign he may switch to more advanced armor as long as his mount can carry him and the armor both. When first created he may have only weapons from the recommended list above; the DM may change or add to this list to reflect specific cultural details of the Beast-Rider's tribe." },
        { name: "Secondary Skill: Groom",
          notes: "SECONDARY SKILLS: Groom (Animal Handling) is required." }
      ],
      wealth:
        "Ordinary 5d4x10 gp, but like the Barbarian he must spend it all before starting play except 3 gp or less.",
      races:
        "Especially appropriate for demihuman characters -- dwarves on boars, elves on dire wolves, sea-elves on giant sea-horses.",
      finalNote:
        "ABANDONMENT: if he does not role-play his attachment to his animal, the DM should decide that the character has abandoned this Warrior Kit."
    },
    berserker: {
      name: "Berserker",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "19-22",
        note:   "Transcribed from the book."
      },
      requirements: {
        str: 15,
        strPrinted:
          "must have a Strength ability score of 15 or more"
      },
      reaction: [
        { modifier: 3,
          applies: "NPCs belonging to any tribe that also has Berserkers",
          printed: "Berserkers receive a +3 reaction adjustment bonus from NPCs belonging to any tribe that also has Berserkers -- they recognize the Berserker instinctively and respect him, even if he is an enemy." },
        { modifier: -3,
          applies: "all other NPCs",
          printed: "The Berserker character receives a -3 reaction from all NPCs except characters from tribes which have berserkers in them. Demihuman Berserkers would not advertise the fact that they were such; the DM can help preserve the secret by not publicizing the fact that all NPCs are taking a -3 reaction roll concerning the Berserker characters." }
      ],
      proficiencies: {
        weapon: {
          barredGroups: ["Bow", "Crossbow", "Dart", "Sling", "Blowgun"],
          allowedPrinted:
            "No specific weapon proficiencies are required of the Berserker -- but he may not start out play having a proficiency in a ranged weapon (no thrown axes or knives, no bows or crossbows, etc.). The Berserker lives to destroy things in hand-to-hand combat, so he cannot start play with any sort of ranged weapon proficiency. He can learn others during the course of the campaign, if he and his DM wish to allow it -- but it's a little out of character for the Berserker.",
          note:
            "BARRED AT CREATION ONLY, and the bar is wider than the groups shown: it covers any THROWN melee weapon too, which no group in WEAPON_GROUP_ORDER can express. The restriction lifts later in the campaign with DM permission, which no field here models."
        },
        nonweapon: {
          bonus: ["Endurance"],
          recommended: [
            "Animal Handling", "Animal Training", "Direction Sense", "Fire-Building",
            "Riding, Land-Based", "Weather Sense", "Blind-Fighting", "Hunting", "Mountaineering",
            "Running", "Set Snares", "Survival", "Tracking", "Herbalism", "Jumping"
          ],
          note:
            "CROSSOVER COST, printed per group exactly as the Barbarian's: General -- Animal Handling, Animal Training, Direction Sense, Fire-Building, Riding (Land-Based), Weather Sense. Warrior -- Blind-Fighting, Hunting, Mountaineering, Running, Set Snares, Survival, Tracking. Priest (twice the listed slots if Fighter or Ranger) -- Herbalism. Rogue (double slots) -- Jumping. As with the Barbarian, the DM may insist on a tribal-specialty proficiency."
        }
      },
      abilities: [
        { name: "Going Berserk",
          notes: "At any time the Berserker may choose to Go Berserk. This is NOT instantaneous -- he must spend a full turn (ten combat rounds) psyching himself up, during which he is growling, moaning and uttering imprecations, so it is impossible to be quiet while trying to Go Berserk. He may be fighting during that time, meaning he can start to Go Berserk on the round the fight begins, fight for ten full rounds, and then be Berserk on the eleventh round. If no enemy is in sight yet he can hold the Berserk until combat is engaged, but if no combat takes place within five more full turns he automatically reverts to normal and suffers the ordinary consequences for coming out of a Berserk. He can only come out of his Berserk once the last enemy is down -- he must literally be down on the ground, even if still alive and surrendering; the Berserker will stay berserk and continue fighting so long as there are enemies still on their feet." },
        { name: "Berserk: Combat Bonuses",
          notes: "While Berserk the character gets +1 to attack, +3 to damage, and +5 hp." },
        { name: "Berserk: Spell Immunities",
          notes: "While Berserk he is immune, with no saving throw necessary, to the wizard spells charm person, friends, hypnotism, sleep, irritation, ray of enfeeblement, scare, geas, and the clerical spells command, charm person or mammal, enthrall, cloak of bravery, and symbol." },
        { name: "Berserk: Saving Throw Bonuses",
          notes: "+4 to save against the wizard spells blindness, Tasha's uncontrollable hideous laughter, hold person, charm monster, and confusion, and the clerical spells hold person and hold animal." },
        { name: "Berserk: Emotion and Fear",
          notes: "The emotion spell has no effect unless the caster chose the fear result. If fear was chosen, the Berserker gets a normal saving throw; if he makes it he continues on as before, but if he fails he is prematurely snapped out of his Berserk with all the normal effects of coming out of one (though he does not suffer any other fear effect). The fear spell has exactly the same effect. If he fails a saving throw against charm monster, he simply counts the caster as one of his allies; he does not come out of the Berserk or obey the caster's commands." },
        { name: "Berserk: Finger of Death",
          notes: "Being Berserk offers no real protection from finger of death, except that the spell effects do not take place until the character has come out of his Berserk. If he saves, he does not suffer the 2d8+1 damage until immediately after he snaps out. If he fails to save, he does not die until he snaps out." },
        { name: "Berserk: Unarmed Combat",
          notes: "Immune to KO results from the Punching and Wrestling rules, and takes only half damage from bare-handed attacks under those rules." },
        { name: "Berserk: Restrictions",
          notes: "He cannot take cover against missile fire. He can use no ranged weapons and kills only in hand-to-hand or melee-weapon combat. He must fight each opponent until that opponent is down, then move to the nearest enemy -- he cannot choose to attack the enemy leader if that leader is behind seven ranks of spearmen -- and must keep fighting until all enemies are down. He is temporarily unaffected by the clerical spells bless, cure light wounds, aid, cure serious wounds, cure critical wounds, heal, regenerate and wither; he gains their benefits only AFTER he has come out and suffered any and all damages which occurred then. The taunt spell is automatically successful and will cause him to abandon his current enemy and rush to attack the taunter." },
        { name: "Berserk: Attacking a Friend",
          notes: "If another character tries something the Berserker can interpret as attack -- for instance, hitting him to move him out of the way of an incoming attack -- he must roll 1d20 vs. his Intelligence. If he succeeds he is dimly aware that his friend is not attacking him. If he fails he now thinks his friend is an enemy, and continues to think so until the fight is done and he is no longer Berserk." },
        { name: "Coming Out of the Berserk",
          notes: "He loses the 5 hp he gained when he became Berserk, which could drop him to or below 0 hp and kill him. He collapses in exhaustion exactly as if hit by a ray of enfeeblement, with no saving throw possible, for one round for every round he was Berserk. He suffers the effects of any spells which waited until he returned to normal before affecting him, such as finger of death. And only THEN can healing magics affect him." },
        { name: "The DM Tracks Hit Points Secretly",
          notes: "When the Berserker goes Berserk the DM should immediately say \"Tell me how many hit points you currently have.\" From that point until the fight is done and he has returned to normal, the DM keeps track. The player is not told how many hp he has left, nor how much damage he is taking with each attack -- the character feels no pain, so he cannot keep track of how close he is to death. The DM simply says something like \"The orc-captain hits you with his axe, a mighty blow which you barely feel...\" It is therefore very possible for a Berserker to be nickled and dimed to death and not know it until he drops dead. The DM can also, if he so chooses, roll all Saving Throws for the Berserker without telling the player whether they were failures or successes." },
        { name: "Equipment Restricted at Creation",
          notes: "EQUIPMENT: as with the Barbarian, he may not use his starting gold to buy armor heavier than splint mail, banded mail, or bronze plate mail; once he has adventured in the outer world he can use any type of armor without penalty. When he spends his starting gold he must limit himself to weapons known to his tribe, and may not choose missile weapons. Good choices include battle axe, club, dagger or dirk, footman's flail, mace, or pick, hand axe, spear, or sword (any)." },
        { name: "Secondary Skill: Tribal",
          notes: "SECONDARY SKILLS: as with the Barbarian, the DM decides what is most appropriate for that specific barbarian/berserker tribe." }
      ],
      wealth:
        "Ordinary 5d4x10 gp, but like the Barbarian he must spend it all before starting play except three gp or less.",
      races:
        "The DM's choice as to whether his demihuman characters can have Berserkers among them. Entirely appropriate for dwarves, not inappropriate for elves, gnomes and half-elves. Halfling Berserkers are not very likely.",
      finalNote:
        "THE BERSERKER PALADIN: the book notes it is a strange combination some DMs will not allow, but that a paladin deeply involved with an animal totem might even be REQUIRED to be a Berserker, since the DM may reason that it is the supernatural touch of the totem animal spirit that gives the paladin his other powers."
    },
    cavalier: {
      name: "Cavalier",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "22-24",
        note:   "Transcribed from the book."
      },
      requirements: {
        str: 15,
        dex: 15,
        con: 15,
        int: 10,
        wis: 10,
        alignment: ["lg", "ng", "cg"],
        race: ["human", "elf", "half-elf"],
        alignmentPrinted:
          "must be of any good alignment (chaotic good, neutral good, lawful good)",
        racePrinted:
          "Only humans, elves, and half-elves may be Cavaliers",
        classesPrinted:
          "Fighters and Paladins may be Cavaliers; Rangers may not."
      },
      reaction: [
        { modifier: 3,
          applies: "anyone of his own culture, except criminals and characters of evil alignment",
          printed: "The Cavalier receives a +3 reaction from anyone of his own culture (except criminals and characters of evil alignment, from whom he receives a -3)." },
        { modifier: -3,
          applies: "criminals and characters of evil alignment",
          printed: "...except criminals and characters of evil alignment, from whom he receives a -3." },
        { modifier: -3,
          applies: "all members of his own culture, PERMANENTLY, if he breaks his vow a third time without repenting",
          printed: "If the Cavalier breaks his vow a third time without repenting and undertaking that task, he has abandoned his Cavalier Warrior Kit. He permanently loses all the special benefits of the Kit. He receives a permanent -3 reaction adjustment from all members of his own culture, even those who do not know of his past." }
      ],
      proficiencies: {
        weapon: {
          required: ["Sword, Long"],
          recommended: [
            "Sword, Bastard", "Sword, Broad", "Sword, Short", "Sword, Two-Handed", "Scimitar",
            "Flail, Horseman's", "Mace, Horseman's", "Pick, Horseman's", "Dagger", "Spear",
            "Javelin"
          ],
          allowedGroups: ["Lance"],
          allowedPrinted:
            "Required: Lance (any; player choice) and Sword (any; player choice). Recommended: All other Lances, all other Swords, all Horsemen's weapons, Dagger, Spear, Javelin.",
          note:
            "Both required entries are player CHOICES from a category, which no field here models -- Lance is carried in allowedGroups and Sword, Long is recorded as the required sword only because a choice must resolve to something; the player may pick any sword. This is the case requiredChoice would solve."
        },
        nonweapon: {
          bonus: ["Riding, Land-Based", "Etiquette"],
          recommended: [
            "Animal Handling", "Animal Training", "Dancing", "Heraldry", "Musical Instrument",
            "Reading/Writing", "Blind-Fighting", "Endurance"
          ],
          note:
            "Riding is specified as Land-based, horse. CROSSOVER COST: Priest, double slots unless Paladin -- Musical Instrument, Reading/Writing. Warrior -- Blind-Fighting, Endurance."
        }
      },
      abilities: [
        { name: "Lance Bonus",
          notes: "At 1st level he gets +1 to hit with any lance for which he has proficiency, when using the lance from horseback. This goes up +1 every six experience levels: +2 at 7th, +3 at 13th, and so on." },
        { name: "Sword Bonus",
          notes: "At 3rd level he gets +1 to hit with any one type of sword he has proficiency with; most common are broad sword, long sword, bastard sword, and scimitar. This goes up +1 every six experience levels: +2 at 9th, +3 at 15th, and so on." },
        { name: "Horseman's Weapon Bonus",
          notes: "At 5th level he gets +1 to hit with either horseman's mace, horseman's flail, or horseman's pick (his choice from among those he has proficiency with). This goes up +1 every six experience levels: +2 at 11th, +3 at 17th, and so on." },
        { name: "Bonuses Do Not Add to Damage",
          notes: "These pluses to hit do NOT add to damage, and do not allow the Cavalier to hit a monster that can only be hit by magical weapons." },
        { name: "Immune to Fear; Radiates Courage",
          notes: "Completely immune to the fear spell. Because he is so brave, he inspires others to courage, and so while he is fighting he actually radiates an emotion spell in a 10' radius. This emotion spell radiates COURAGE (see the writeup for the 4th-level wizard spell emotion), but only to the extent that it negates fear; it does not bestow the berserk fury that the actual wizard spell provides." },
        { name: "+4 to Save vs. Mind-Affecting Magic",
          notes: "+4 to save vs. all magic which would affect his mind, such as the wizard spells charm person, friends, hypnotism, sleep, irritation, ray of enfeeblement, scare and geas, and the clerical spells command, charm person or mammal, enthrall, cloak of bravery and symbol." },
        { name: "Free Warhorse",
          notes: "Starts play with a horse which he does not have to pay for. This will be either a Heavy Warhorse, Medium Warhorse, or Light Warhorse; the player may choose what sort it is, subject to the DM's approval. If this horse dies the Cavalier has to acquire himself another through the usual campaign means, but will not be content with any horse which is not a Warhorse of Charger quality." },
        { name: "Right to Demand Shelter",
          notes: "When he travels he can demand shelter from anyone in his own nation who is of status lower than nobility. Most people of his own status or higher will be happy to offer him shelter when he is travelling." },
        { name: "Must Close to Melee",
          notes: "Cannot attack an opponent at range if he can instead charge ahead and attack him in melee or jousting combat. He cannot snipe on enemies with a bow or crossbow, cannot use a polearm from behind a shield wall, and has to be on the front line meeting his foes face-to-face. He could conceivably shoot an opponent with an arrow to stop that opponent from killing an innocent person -- that does not constitute a violation of his code -- but he could not shoot the enemy to protect a friend if his friend is fighting that enemy honorably, even if his friend is losing." },
        { name: "Must Attack the Most Powerful Enemy",
          notes: "In any combat he must attack the enemy who is the biggest and most powerful-looking. If he is held up by lesser troops he must dispatch them as quickly as possible and then get to his real opponent." },
        { name: "Must Buy the Best Armor He Can Afford",
          notes: "Must always have the highest-quality armor he can afford. As he goes through his early experience levels, if he has the money, he will constantly be selling his old armor and buying the next most protective set. His goal is a suit of full plate armor; the next step down is field plate, then plate mail, then bronze plate mail, then banded or splint, then chain, then scale or brigandine, then ring or studded. Magic bonuses do not mean as much to him as the type of armor: he prefers ordinary field plate to a set of banded mail +5. The DM must rigorously enforce this limitation if the player is inclined to ignore it." },
        { name: "The Code of Chivalry",
          notes: "He must cheerfully perform any noble service or quest asked of him; he must defend, to the death, any person or item placed in his charge; he must show courage and enterprise when obeying his rulers; he must show respect for all peers and equals; he must honor all those above his station (his social class); he must demand respect and obedience from those below his station; he must scorn those who are lowly and ignoble (he will not help the ill-mannered, the coarse, the crude; he will not use equipment which is badly-made or inferior; he will fight on foot before riding a nag; etc.); he must perform military service to his lord whenever asked; he must show courtesy to all ladies (if the Cavalier is male); he must regard war as the flowering of chivalry, and a noble enterprise; he must regard battle as the test of manhood, and combat as glory; he must achieve personal glory in battle; he must slay all those who oppose his cause; and he must choose death before dishonor." },
        { name: "Breaking the Code",
          notes: "The first time he breaks his vows the DM will warn the player that the Cavalier feels bad about violating his code. The second time, he loses ALL his special benefits until such time as he repents and undertakes a dangerous task to redeem himself; when performing this task he must behave according to his code and his hindrances. Only when the task is successfully accomplished does he regain his benefits. The third time, without repenting and undertaking that task, he has ABANDONED the Kit -- he permanently loses all the special benefits, no longer has to obey his knightly code, takes a permanent -3 reaction adjustment from all members of his own culture, and his horse, even if it is not the one he began play with, leaves him: it either rides off into the sunset without him, or attacks him again, even if he kills it trying to do so." },
        { name: "Secondary Skill: Groom",
          notes: "SECONDARY SKILLS: Groom is required." },
        { name: "Must Belong to the Noble Class",
          notes: "The character must belong to the noble social class in the campaign. It is up to the DM to determine whether this is possible. If his campaign uses a random die-roll to determine who is nobility and who is not, the character must first successfully roll to be noble in order to be a Cavalier. If it is more of a role-playing exercise, then any character who takes the Cavalier Warrior Kit will be presumed to be of the nobility. This does not mean that he has a lot of money." }
      ],
      wealth:
        "Standard 5d4x10 gp starting gold."
    },
    gladiator: {
      name: "Gladiator",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "24-25",
        note:   "No ability-score requirements. The book explicitly leaves female gladiators to the DM and says he might as well allow it."
      },
      proficiencies: {
        weapon: {
          required: ["Sword, Short", "Trident", "Net"],
          allowedPrinted:
            "Required: short sword (gladius), trident, net. Gladiators should learn an even mix of normal and unusual weapons; the DM is within his rights to insist that the Gladiator learn one strange weapon proficiency (such as whip) for every \"normal\" proficiency (like sword, spear, axe, etc.).",
          note:
            "SPECIALIZATION: Gladiators get a FREE Weapon Specialization which costs none of their beginning weapon proficiencies -- they still get all four of those AND this Specialization free. It must be chosen from: bow (choice), cestus, dagger, drusus, lasso, net, scimitar, short sword, spear, trident, and whip. Cestus, drusus, lasso and net are flagged in the book as new weapons found in the Equipment chapter."
        },
        nonweapon: {
          bonus: ["Charioteering", "Tumbling"],
          recommended: [
            "Animal Handling", "Animal Training", "Etiquette", "Riding, Land-Based", "Armorer",
            "Blind-Fighting", "Endurance", "Gaming", "Weaponsmithing", "Healing"
          ],
          note:
            "CROSSOVER COST: the bonuses are cross-group -- Charioteering is Warrior, Tumbling is Rogue, taken for the combat showmanship that characterises arena fighting. Recommended: General -- Animal Handling, Animal Training, Etiquette, Riding (Land-Based). Warrior -- Armorer, Blind-Fighting, Endurance, Gaming, Weaponsmithing. Priest (double slots unless Paladin) -- Healing."
        }
      },
      abilities: [
        { name: "Free Weapon Specialization",
          notes: "Because of their intensive training, Gladiators get a FREE Weapon Specialization. This does not cost any of their beginning weapon proficiencies -- they still get all four of those, AND get this Specialization free. It must be chosen from: bow (choice), cestus, dagger, drusus, lasso, net, scimitar, short sword, spear, trident, and whip." },
        { name: "Recognised Everywhere",
          notes: "Gladiators tend to be recognized -- as Gladiators, at least, if not by their own names -- wherever they go. This makes it more difficult for them to do things in secret; some troublesome NPC is always remembering \"the tall, fair-haired gladiator\" who was at the scene of the action, which makes it very easy for the authorities to follow the heroes' trail. This is something the DM will have to enforce scrupulously if the Gladiator is to have hindrances offsetting his benefits." },
        { name: "Promoters and Managers",
          notes: "Strictly a role-playing consideration. Promoters and managers are always interfering in the Gladiator's life: trying to hire him to participate in certain-death events, to fight people the Gladiator does not want to fight, to force him to participate in events taking place at the exact time he needs to be somewhere else. They will go to any length to get their way; they may blackmail the character, kidnap his followers, use the time-honored bait of a gorgeous romantic interest (whom the Gladiator does not immediately realise is an employee of the promoter), and so forth. The DM should make it clear that these promoters are mostly of the sleazy variety who will cheat, rob and betray him at the drop of a hat." },
        { name: "Equipment: Gladiator Armor Only",
          notes: "EQUIPMENT: may buy any sort of nonmagical weapon or combination of weapons before beginning play. However, he must choose his armor from the listing of Gladiator Armor in the Equipment chapter, under \"New Armors.\"" },
        { name: "Secondary Skill: The Pre-Arena Trade",
          notes: "SECONDARY SKILLS: received through whatever means is usual for the campaign -- by choice or random die-roll. This skill probably represents the trade he learned before becoming a Gladiator." }
      ],
      wealth:
        "Standard 5d4x10 gp to spend, and may spend it any way he chooses subject to the equipment restrictions above, or have it all unspent at the beginning of play.",
      races:
        "ANY demihuman warrior can be a Gladiator. Operators of the arenas try to acquire as many different, unusual fighters as they can, by hiring or enslaving them, and demihumans (when they can be acquired) are major attractions.",
      finalNote:
        "DMs take note: a Gladiator character is not likely to be a Ranger. You can permit it if you wish, but Rangers are very wilderness-oriented and Gladiators are very urban."
    },
    myrmidon: {
      name: "Myrmidon",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "25-26",
        note:   "Transcribed from the book."
      },
      requirements: {
        str: 12,
        con: 12,
        strPrinted:
          "must have scores of at least 12 in Strength and Constitution"
      },
      proficiencies: {
        weapon: {
          allowedPrinted:
            "The Myrmidon may spend his Weapon Proficiency slots any way he chooses.",
          note:
            "SPECIALIZATION: he gets a FREE Weapon Specialization, which must be chosen from Battle axe, Bow (composite long bow, composite short bow, or long bow), Crossbow (heavy crossbow or light crossbow), Lance (choice), Polearm (choice), Spear, Sword (choice)."
        },
        nonweapon: {
          bonus: ["Ancient History", "Fire-Building"],
          recommended: [
            "Animal Handling", "Cooking", "Heraldry", "Riding, Land-Based", "Seamanship",
            "Swimming", "Weather Sense", "Reading/Writing", "Disguise", "Armorer",
            "Blind-Fighting", "Bowyer/Fletcher", "Charioteering", "Endurance", "Navigation",
            "Set Snares", "Survival", "Tracking", "Weaponsmithing"
          ],
          note:
            "Ancient History is specifically MILITARY History. CROSSOVER COST: General -- Animal Handling, Cooking, Heraldry, Riding (Land-based), Seamanship, Swimming, Weather Sense. Priest, double slots unless Paladin -- Reading/Writing. Rogue, double slots -- Disguise. Warrior -- Armorer, Blind-Fighting, Bowyer/Fletcher, Charioteering, Endurance, Navigation, Set Snares, Survival, Tracking, Weaponsmithing. Wizard, double slots unless Ranger -- Reading/Writing. Reading/Writing is listed TWICE, under two different groups with different costs; the book prints it that way and it is transcribed as printed."
        }
      },
      abilities: [
        { name: "Free Weapon Specialization",
          notes: "Gets a free Weapon Specialization, which must be chosen from the following group: Battle axe, Bow (composite long bow, composite short bow, or long bow), Crossbow (heavy crossbow or light crossbow), Lance (choice), Polearm (choice), Spear, Sword (choice)." },
        { name: "Powerful Patron",
          notes: "Usually in the employ of some powerful patron. The DM decides what immediate benefits this grants him; they vary with the type of employer. Working for a wealthy nobleman, he will not have to spend any money for room and board and will enjoy an upper-class existence. Part of a standing army, he may be immune to prosecution by the civilian authorities, though he can certainly face court martial for misdeeds." },
        { name: "Standing Army or Mercenary",
          notes: "When first created the player must decide whether his character is part of a standing army or a mercenary unit, and whether he is of non-commissioned rank (recruit, private, sergeant) or an officer's rank (such as captain) -- up to the DM, who will make his choice based on what works best in his campaign's current storyline. His employment can change over the course of the campaign." },
        { name: "Instantly Recognisable",
          notes: "Instantly recognizable by his military demeanor, erect posture, disciplined mannerisms, etc. Because he is distinctive he is easily remembered and described by witnesses to his adventures; this makes it easier for the enemy to identify him and follow his trail if he is trying to escape or travel through dangerous territory." },
        { name: "Beholden to His Employer",
          notes: "His employer makes many demands. If he is a bodyguard he must accompany his employer just about everywhere, regardless of any personal goals or interests. If he is a common soldier he is subject to the orders of his officers. If he is a military officer he is subject to the orders of his superiors or the local ruler, and bears the added stress of having to look out for his men whenever they are engaged in military action." },
        { name: "Equipment: Specific Military Force",
          notes: "EQUIPMENT: may spend his starting gold on whatever sort of arms, armor and equipment he chooses. If, when he is first created, it is agreed that he will be part of a specific military force with specific equipment requirements, he is required to buy that equipment, but the DM must give him extra gold in the amount of half that cost." },
        { name: "Secondary Skill: From a Fixed List",
          notes: "SECONDARY SKILLS: the Myrmidon may choose his Secondary Skill, but must choose it from Armorer, Bowyer/Fletcher, Forester, Groom, Hunter, Leatherworker, Navigator, Sailor, Scribe, Teamster/Freighter, Weaponsmith." }
      ],
      wealth:
        "Standard 5d4x10 gp starting gold.",
      races:
        "Any demihuman race can have Myrmidons. Mercenary demihumans travel mostly in human-occupied lands, while Myrmidon demihumans in standing armies usually stick to their own race's territories."
    },
    noblewarrior: {
      name: "Noble Warrior",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "26-29",
        note:   "Transcribed from the book."
      },
      requirements: {
        str: 13,
        con: 13,
        strPrinted:
          "must have Strength and Constitution scores of 13 or better -- it is what comes of being forced to train in heavy plate armor for so many years"
      },
      reaction: [
        { modifier: 3,
          applies: "anyone of his own culture",
          printed: "The Noble Warrior receives a +3 reaction from anyone of his own culture." },
        { modifier: -1,
          applies: "cumulative erosion of his +3 when he cannot afford to live well",
          printed: "If the Noble Warrior is unable to spend this extra money because of lack of funds, and he can settle for lesser goods, his bonus to Reaction rolls will be reduced, at -1 per such incident, until it reaches +0, to reflect the fact that people are seeing that he is settling for shabbier goods and otherwise not living up to their expectations of how a noble warrior should live." },
        { modifier: -6,
          applies: "everybody who knows of the reputation, if he gets a bad reputation deservedly or undeservedly",
          printed: "If a Noble Warrior gets a bad reputation, deservedly or undeservedly, his +3 reaction becomes a -6 reaction from everybody who knows of the reputation." }
      ],
      proficiencies: {
        weapon: {
          required: ["Sword, Long"],
          recommended: ["Sword, Bastard", "Flail, Horseman's", "Mace, Horseman's"],
          allowedGroups: ["Lance"],
          allowedPrinted:
            "Unless the campaign deals with a culture unlike medieval Europe, all Noble Warriors must take the following proficiencies: long sword or bastard sword (player choice), lance (player choice of type, usually jousting lance), and horseman's flail or horseman's mace (player choice). The last proficiency may be used for a weapon of the warrior's choice or to specialize in one of the required choices.",
          note:
            "ALL THREE required entries are player CHOICES from a pair or a category, which no field here models -- Sword, Long is recorded as the required sword only because a choice must resolve to something. RACIAL VARIANT: p.13 states the Noble Dwarf-Warrior is required to be proficient with axe and hammer rather than sword and lance, and is not required to be a rider. This is the case requiredChoice would solve."
        },
        nonweapon: {
          bonus: ["Etiquette", "Heraldry", "Riding, Land-Based"],
          recommended: [
            "Animal Training", "Dancing", "Blind-Fighting", "Gaming", "Hunting", "Tracking",
            "Local History", "Musical Instrument", "Reading/Writing"
          ],
          note:
            "CROSSOVER COST: General -- Etiquette, Heraldry, Riding (Land-Based) as bonuses; Animal Training, Dancing recommended. Warrior -- Blind-Fighting, Gaming, Hunting, Tracking. Priest, cost double slots unless Paladin -- Local History, Musical Instrument, Reading/Writing."
        }
      },
      abilities: [
        { name: "Right to Demand Shelter",
          notes: "When travelling he can demand shelter from anyone in his own nation who is of lower social status than his. Most people of his own status or higher will offer him shelter when he is travelling -- up to two persons times the Noble Warrior's experience level. If the Noble Warrior is fifth level, the patron will offer shelter for the Noble Warrior and up to nine of his companions." },
        { name: "Low Justice",
          notes: "In his own land, the Noble Warrior can administer low justice upon commoners -- acting as judge, jury and executioner for minor crimes he comes across. The definition of \"minor crimes\" is up to the DM, but in general should include things like assault, petty theft, etc." },
        { name: "Oath of Loyalty",
          notes: "In order to become a Noble Warrior he has sworn an oath of loyalty to some greater noble. If he is a squire to a knight, he has an oath to his knight. If he is a knight himself, he is sworn an oath to his king or some other noble -- or perhaps to both. He will be expected to live up to that oath from time to time: accompany his lord into combat, provide troops to his lord, even beggar his own household in order to support his lord's needs." },
        { name: "Must Live Well: +10% on Everything",
          notes: "Expected to live well. After he is created, he must add +10% to the base cost of goods, equipment, and services he is buying -- FOR EACH EXPERIENCE LEVEL HE HAS -- to reflect his noble tastes and requirements. This extra cost is NOT just a tip; the character is buying higher-quality goods. To retain his bonus, when he is once again in the money, he must do whatever it takes to upgrade his situation -- buy new clothes, go on a buying spree -- at the DM's discretion, and his +3 reaction will return." },
        { name: "Expected to Extend Shelter",
          notes: "Just as other nobles are expected to extend shelter to the Noble Warrior, he is expected to offer other nobles shelter when they are travelling through his territory -- or when they meet on the road while he is encamped and they are not. Whenever a Noble Warrior character is getting too cocky, the DM can have him visited by a nice, large crowd of nobles to whom he is expected to offer shelter and food, and who proceed to eat him out of house and home." },
        { name: "Equipment: Minimum Standards",
          notes: "EQUIPMENT: may spend his gold pretty much as he chooses, but there are certain minimum standards he cannot violate. He cannot buy armor less protective than brigandine or scale mail. Before starting play he MUST buy a suit of armor, a shield, at least one weapon larger than a dagger, a horse (at least a riding horse), riding saddle, bit and bridle, horseshoes and shoeing, halter and saddle blanket." },
        { name: "Secondary Skill: Groom",
          notes: "SECONDARY SKILLS: all Noble Warrior characters must take the Groom skill. Squires are expected to care for their knights' horses, and should not forget this skill when they themselves become knights." }
      ],
      wealth:
        "Begins play with more gold than other Warrior Kits: 225 gp PLUS the standard 5d4x10 gp. But he is required to spend a large portion of that on the specific items described above.",
      races:
        "Appropriate for any sort of demihuman race to have a class of Noble Warriors."
    },
    peasanthero: {
      name: "Peasant Hero",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "29-30",
        note:   "No ability-score requirements."
      },
      reaction: [
        { modifier: -2,
          applies: "all the peasants in the land, if he turns away his home community's petitioners",
          printed: "If he turns them away, he loses their respect and earns a -2 reaction from all of the peasants in the land until he is once again in his home community's good graces." }
      ],
      proficiencies: {
        weapon: {
          recommended: [
            "Sword, Short", "Spear", "Short Bow", "Long Bow", "Flail, Footman's",
            "Mace, Footman's", "Pick, Footman's"
          ],
          allowedPrinted:
            "The player may choose his character's weapon proficiencies, but may not choose any that the DM feels would be unusual for his campaign-world's peasants. Short sword, spear, bow, footman's weapons and the like are all very appropriate; horseman's weapons, exotic polearms, lances, long swords, tridents and the like are not. This is only a restriction WHEN THE CHARACTER IS FIRST CREATED; afterwards, of course, he can learn any weapon he receives training with.",
          note:
            "AT CREATION ONLY, and the restriction lifts entirely once play begins -- so this is recorded as recommended rather than allowed. The book names the barred side too (horseman's weapons, exotic polearms, lances, long swords, tridents) but as examples of a DM judgement, not a closed list."
        },
        nonweapon: {
          bonusChoice: [["Agriculture", "Fishing"], ["Weather Sense", "Animal Lore"]],
          note:
            "Both bonuses are PLAYER CHOICES between two named proficiencies. Recommended: any of the General proficiencies -- the book names no specific list."
        }
      },
      abilities: [
        { name: "Shelter and Aid in His Home Community",
          notes: "No matter what he has done or what anyone thinks of him, the Peasant Hero always has shelter and often has other help when he is in his own community. Unless it is known that he has hurt people from his own community, he will always find people to put him up, hide him and companions from the law, supply them with food and drink and what little weaponry can be scraped together (usually daggers), and even provide them with helpers -- earnest 0-level youths who want to grow up to be like their hero." },
        { name: "Petitioners",
          notes: "Since the Peasant Hero is looked upon as a patron and hero by the people from his home, they will frequently come to him for help. Whenever the village is losing people to nocturnal predators, whenever a village overlord turns out to be a dangerous tyrant, whenever a local citizen is jailed and tried for something he did not do, the citizens turn to the Peasant Hero for help." },
        { name: "Equipment: Nearly Penniless at Start",
          notes: "EQUIPMENT: may spend his starting gold any way he sees fit, but may have no more than 3 gp left when he begins play." },
        { name: "Secondary Skill: Player Choice",
          notes: "SECONDARY SKILLS: the player may choose his character's secondary skill." }
      ],
      wealth:
        "Standard 5d4x10 gp starting money.",
      races:
        "A distinctly human sort of character; also appropriate to halflings, and to half-elves living among humans. But no other demihumans should have Peasant Hero characters unless the DM decides that their cultures are very much like rural human society."
    },
    pirateoutlaw: {
      name: "Pirate/Outlaw",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "30-31",
        note:   "No ability-score requirements. One kit with TWO orientations -- Pirate (high seas) and Outlaw (wilderness) -- which differ in required weapon proficiencies, bonus proficiencies and secondary skills. Both are transcribed here; the Pirate's values are the structured ones and the Outlaw's are recorded in the notes, because a single entry cannot hold two sets."
      },
      proficiencies: {
        weapon: {
          required: ["Cutlass", "Belaying Pin"],
          recommended: ["Long Bow", "Sword, Long", "Quarterstaff"],
          allowedPrinted:
            "If the character is a Pirate, he must take the following proficiencies: Cutlass, and Belaying Pin or Gaff/Hook (player choice). If the character is an Outlaw, he can take any weapon proficiencies he chooses -- but the DM, if he's created this campaign so that the outlaws have a special motif weapon (such as Robin Hood's Merry Men and their longbows), may insist that all Outlaw characters take a specific weapon proficiency. Recommended to classic Merry Man-type outlaws: longbow, long sword and quarterstaff.",
          note:
            "The second Pirate requirement is a CHOICE between Belaying Pin and Gaff/Hook; Belaying Pin is recorded because a choice must resolve to something. Cutlass, Belaying Pin and Gaff/Hook are all flagged in the book as new weapons found in the Equipment chapter -- these are three of the eight PHBR1 weapons already reprinted in CRH Table 58. The Outlaw has NO required weapon proficiencies."
        },
        nonweapon: {
          bonus: ["Rope Use", "Seamanship"],
          recommended: [
            "Swimming", "Weather Sense", "Navigation", "Engineering", "Reading/Writing",
            "Appraising", "Set Snares"
          ],
          note:
            "THESE ARE THE PIRATE'S. The OUTLAW's bonuses are Direction Sense and Fire-Building, and his recommended list is: General -- Riding (Land-Based). Warrior -- Animal Lore, Bowyer/Fletcher, Endurance, Hunting, Running, Set Snares, Survival, Tracking. Priest, double slots unless Paladin -- Healing, Herbalism, Local History. Rogue, double slots -- Disguise. CROSSOVER COST on the Pirate's own list: General -- Swimming, Weather Sense. Warrior -- Navigation. Priest, double slots unless Paladin -- Engineering (for shipbuilding), Reading/Writing (for mapmaking). Rogue, double slots -- Appraising, Set Snares (in association with Rope Use skill), Tightrope Walking, Tumbling. Wizard, double slots unless Ranger -- Engineering (for shipbuilding), Reading/Writing (for mapmaking). SPECIAL NOTE: the DM may be a fan of the very acrobatic pirate or outlaw movies of the past and prefer that Tumbling be one of the Bonus Proficiencies instead of one of the ones listed."
        }
      },
      abilities: [
        { name: "No Intrinsic Special Benefits",
          notes: "Pirates and Outlaws do not have any intrinsic special benefits, although the DM can bestow some campaign-based benefits on them if he chooses. In a powerful pirate city the PCs can trade their ill-gotten gains, a place where the law dares not enter; in a \"Merry Men\" type outlaw campaign, the heroes have the dubious benefit of knowing that they are on the right side if they can just oust the current rulers." },
        { name: "The Law Is Always After Them",
          notes: "The major problem with being an outlaw or pirate is that the law is always after the characters. Though the authorities do not have to put in an appearance in every single play-session, they are always out there, plotting against the heroes. Many of them are quite clever; they probably have more money, ships and men than the heroes, and they will continue to plague the heroes until the campaign is done." },
        { name: "Equipment: Metal Armor Is Impractical",
          notes: "EQUIPMENT: Pirates and Outlaws come from widely diverse backgrounds, so there is no real restriction on what they can buy with their starting money. However, it would be foolish for either type of character to buy metal armor of any kind (banded, brigandine, bronze plate, chain, field plate, full plate, plate mail, and ring mail). Pirates wearing such armor in naval combat will inevitably fall overboard and sink -- they cannot swim with such stuff on; if they are lucky enough to get it off so they can swim, they have lost the armor. Outlaws living out in the wild have their belongings exposed to the elements, and metal armor quickly corrodes; if a Pirate or Outlaw buys metal armor and keeps it stowed away for special occasions that is fine, but if they wear it all the time the DM should continually take it away from them through accidents, rust and corrosion." },
        { name: "Secondary Skill: Rolled or Chosen",
          notes: "SECONDARY SKILLS: if the character is a Pirate, roll d100 -- on 01-70 his Secondary Skill is Sailor; on 71-80 it is Shipwright; on 81-00 it is Navigator. If he is an Outlaw, the character may choose between Bowyer/Fletcher, Forester, Hunter, and Trapper/Furrier." },
        { name: "Going Straight; Privateers",
          notes: "In a Pirate campaign it could be that the player-characters will eventually come to terms with the authorities and \"go straight.\" This does not mean they have to abandon the Pirate Warrior Kit -- they could instead become Privateers, who are basically pirates sailing under the papers of (permission of) their ruler, and preying on the nation's enemies. At that point they can still behave just as they did previously, and the other nation's authorities become their specific enemy." }
      ],
      wealth:
        "Standard 5d4x10 gp for starting gold.",
      races:
        "Unless your campaign is very human-oriented, Outlaws and Pirates will take just about anyone they can get, so it is perfectly appropriate for there to be Outlaws and Pirates of the demihuman races."
    },
    samurai: {
      name: "Samurai",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "31-32",
        note:   "Transcribed from the book."
      },
      requirements: {
        str: 13,
        con: 13,
        int: 14,
        wis: 13,
        alignment: ["lg", "ln", "le"],
        race: ["human"],
        alignmentPrinted:
          "may be of lawful alignment only, but still may be good, evil, or neutral",
        racePrinted:
          "The historical precedent for the samurai is strictly human; it is up to the individual DM if he wants to have an oriental-based demihuman culture with a samurai warrior class -- elves and half-elves are perhaps most visually appropriate, but a DM could allow it to any demihuman race in his campaign."
      },
      proficiencies: {
        weapon: {
          required: ["Katana"],
          allowedPrinted:
            "The samurai and ronin start play with two free extra weapon proficiency slots. But of his six initial weapon proficiencies, five are chosen for him. The samurai and ronin must specialize in katana (samurai sword, two proficiency slots) and daikyu (samurai great bow, three proficiency slots). The samurai or ronin may spend his last proficiency slot as he chooses -- but only from among the samurai weapons listed in the Equipment chapter of this book. After the character is in play in another culture, he may become proficient in weapons of that culture.",
          note:
            "SLOT COUNT AND SLOT PATTERN, neither modelled: two FREE extra weapon slots, then five of the six initial slots are pre-spent -- Katana specialization costs two and Daikyu specialization costs three -- leaving exactly one free, which must come from the Equipment chapter's samurai weapons. SPECIALIZATION: both are mandatory specializations, not mere proficiencies. DAIKYU HAS NO RECORD in core_wp.json and so cannot be listed in `required`, even though PHBR1 p.119 prints it (100 gp, 3 lb, size L, speed 7) along with its own Daikyu arrow (3 sp per 6, 1 lb, size M, type P, 1d8/1d6). It is the second missing-weapon finding of this chapter, after Throwing Axe. Katana exists but its values differ from p.119; see the PHBR notes."
        },
        nonweapon: {
          bonus: ["Etiquette", "Riding, Land-Based"],
          required: ["Reading/Writing"],
          recommended: ["Artistic Ability", "Blind-Fighting", "Running"],
          note:
            "The book's phrasing on Reading/Writing is unusual and is transcribed as printed: \"Required (samurai/ronin must purchase these, but gets no extra slots to pay for them): (Priest and Wizard, costs double slots unless Paladin or Ranger) Reading/Writing.\" CROSSOVER COST: General -- Artistic Ability/Calligraphy, Artistic Ability/Painting. Warrior -- Blind-Fighting, Running. The book prints Artistic Ability twice with two different specializations; it is recorded once here and the specializations are named in this note."
        }
      },
      abilities: [
        { name: "Kiai: Temporary Strength 18/00",
          notes: "The samurai and ronin are able to focus their vital energies to increase their Strength score temporarily. Once per day per experience level he can increase his Strength to 18/00 for one full round, and it must be preceded by a loud kiai shout, making it impossible for him to summon this strength silently or stealthily. For that one round, all his hit probability, damage adjustment, weight allowance, maximum press, open doors and bend bars/lift gates rolls and functions are calculated as if his Strength were 18/00." },
        { name: "Absolute Devotion to His Lord",
          notes: "The samurai is supposed to be absolutely devoted to his lord. He is expected to obey instantly every one of his lord's orders, up to and including killing himself or those he loves. If he refuses to obey an order, he is dishonored and is expected to kill himself; if he does not, he becomes ronin. The DM should make sure the samurai is acutely aware of this by having his lord occasionally issue orders which are difficult for him to keep. This does not always have to be \"Kill all of your allies,\" but the lord can issue orders which interfere with the samurai's personal goals and remind him that he is subservient to his lord." },
        { name: "Ronin: Half Experience",
          notes: "The ronin has all of the abilities of the samurai but operates under slightly different rules. A samurai can become a ronin at any time in a campaign; likewise, by swearing allegiance to a lord who will have him, a ronin can become a samurai again. A samurai can fall from his noble position within a greater lord's household -- the house may have perished in a war or other calamity, or the lord has rejected him, or ordered him to commit suicide and the samurai has refused, or the samurai has left his lord for some other point of honor. The ronin earns experience points at HALF the normal rate; when the DM awards experience, the ronin receives only half what he would if he were still a samurai. This hindrance goes away once he again swears allegiance to a lord and becomes a samurai -- at which point he is subject to the hindrances of the samurai again." },
        { name: "The Code of Honor",
          notes: "A code demanding: absolute obedience to his lord; readiness to die for honor or for his lord at any time; eagerness to avenge any dishonor to his lord, his family, or himself; willingness to repay all debts honorably; and unwillingness to demonstrate the most dishonorable trait of cowardice." },
        { name: "Equipment: Samurai Gear Only; Free Katana",
          notes: "EQUIPMENT: the samurai and ronin must buy all their starting equipment from the samurai weapons, armor and equipment listed in the Equipment chapter. They may have no more than 10 gp left when they have purchased their equipment. Samurai and ronin do NOT have to buy their katana; that is free to the character." },
        { name: "Secondary Skill: Scribe",
          notes: "SECONDARY SKILLS: a samurai or ronin must have the Scribe secondary skill." }
      ],
      wealth:
        "Normal 5d4x10 gp beginning money.",
      finalNote:
        "Players and DMs wishing to have more game-oriented information on the samurai should read Oriental Adventures. The samurai presented here is a simplified version of the OA samurai. Ask your DM before creating a samurai or ronin whether such things exist on his world and whether you may play one."
    },
    savage: {
      name: "Savage",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "32-34",
        note:   "Transcribed from the book."
      },
      requirements: {
        str: 11,
        con: 15,
        strPrinted:
          "must have a minimum Strength score of 11 and a minimum Constitution score of 15"
      },
      proficiencies: {
        weapon: {
          recommended: [
            "Blowgun", "Long Bow", "Short Bow", "Club", "Dagger", "Javelin", "Knife", "Sling",
            "Spear"
          ],
          allowedPrinted:
            "The DM should define a set of weapons which the PC can choose his beginning weapon proficiencies from. A typical set, for classic \"noble savages\": blowgun, long bow, short bow, club, dagger, javelin, knife, sling, spear. The character must make his first-level weapon proficiency selections from these choices. Once he begins play and begins adventuring in the outer world, he may learn any other weapon, of course... but it is better role-playing if he prefers to stick to the weapons of his tribe.",
          note:
            "AT CREATION ONLY, and the set is explicitly the DM's to define -- the list here is the book's example, not a rule, which is why it is recommended rather than allowed."
        },
        nonweapon: {
          bonus: ["Direction Sense", "Weather Sense", "Endurance", "Survival"],
          recommended: [
            "Animal Handling", "Animal Training", "Fire-Building", "Fishing", "Riding, Land-Based",
            "Rope Use", "Swimming", "Animal Lore", "Bowyer/Fletcher", "Hunting", "Mountaineering",
            "Running", "Set Snares", "Tracking", "Healing", "Herbalism", "Local History",
            "Religion", "Jumping", "Tightrope Walking", "Tumbling"
          ],
          note:
            "The Savage receives MORE bonus nonweapon proficiencies than any other type of warrior. CROSSOVER COST: General -- Direction Sense, Weather Sense (bonuses); Animal Handling, Animal Training, Fire-Building, Fishing, Riding (Land-based), Rope Use, Swimming. Warrior -- Endurance, Survival (bonuses); Animal Lore, Bowyer/Fletcher, Hunting, Mountaineering, Running, Set Snares, Tracking. Priest, double slots unless Paladin -- Healing, Herbalism, Local History, Religion. Rogue, double slots -- Jumping, Tightrope Walking, Tumbling. Wizard, double slots unless Ranger -- Herbalism, Religion. Herbalism and Religion are each listed twice under two groups with different costs; transcribed as printed."
        }
      },
      abilities: [
        { name: "Spell-Like Ability, Once Per Day Per Level",
          notes: "Has a special ability resembling a spell, which he may use once per day per experience level (a 5th-level savage could use his ability five times per day). The ability must be chosen from the list below, must be chosen when the character is first created, and may never be changed. It is NOT truly magic -- Detect Magic will not detect it -- and does not require verbal, somatic, or material components even if such are required from the normal spell. The DM can disallow any of the four, or introduce new ones, though he cannot add anything that resembles a magical spell above 1st level." },
        { name: "Ability 1: Alarm",
          notes: "Alarm (Wizard 1st Level). Only usable by the Savage when he is resting or sleeping in a quiet place. It does not sound an alarm like the spell; it merely alerts him to intrusion (if he is already awake) or awakens him (if he is asleep). It is not cast upon a particular place; it alerts him to activity within 10 feet of the place where he lies, as if he were at the center of the 20-foot cube of effect of the actual spell." },
        { name: "Ability 2: Detect Magic",
          notes: "Detect Magic (Wizard 1st Level). Reflects the fact that the Savage is in tune with nature and can feel when there is something unnatural (i.e., magical) in the air. Unless the Savage is also a Ranger, he CANNOT determine the type of magic present (alteration, conjuration, etc.)." },
        { name: "Ability 3: Animal Friendship",
          notes: "Animal Friendship (Priest 1st Level). Can only make friends of an animal which is not angry or threatened. It can be used to make an angry or threatened animal calm; to make friends with an angry or threatened animal, therefore, the Savage must be able to use the ability TWICE that day -- he must be of 2nd level or higher and must have two uses left. To use the ability he must confront the animal face to face, at no further away than the limits of the animal's attack range. As with the spell, he must actually have no ulterior motives, for such will be detected by the animal, and the ability will fail." },
        { name: "Ability 4: Detect Evil",
          notes: "Detect Evil (Priest 1st Level). Like the Detect Magic ability above, this Detect Evil cannot detect evil in a PC -- only in a monster, place, or magical item." },
        { name: "Uncomfortable in Civilized Clothing",
          notes: "When wearing any sort of clothing more cumbersome and concealing than his normal tribal dress, he suffers a -1 to all attack, damage and nonweapon proficiency rolls: he is uncomfortable, and it is affecting his actions and reactions." },
        { name: "Uncomfortable in Armor",
          notes: "He can wear any type of armor, but is so uncomfortable in it that he suffers a -3 to all attack, damage, and nonweapon proficiency rolls while wearing any sort of armor at all. If a player blatantly decides not to role-play his character's dislike of armor and simply wears armor continually, accepting that negative modifier, the DM should gradually increase the modifier: -3 in one play-session, -4 in the next, -5 in the next, and so on... with no limit. If the player asks why this is happening, the DM need merely reply that the character is growing more and more uncomfortable in his unnatural trappings and finding it harder and harder to concentrate on the job at hand." },
        { name: "Equipment: No Gold at All",
          notes: "EQUIPMENT: the Savage gets NO gold (0 gp) with which to purchase his weapons and equipment. Instead, he may take up to four of the weapons listed under \"New Savage Weapons\" in the Equipment chapter. He may assemble an equipment list of up to ten additional items, subject to the DM's approval, which he will have accumulated during his years with the tribe; they must be items which members of a savage tribe could have made -- pouches, clothing, food, rope, fishing gear, sheathes for weapons, and so forth; no mirrors, lanterns, iron cooking pots and the like. With the DM's permission, if the tribe is a river-tribe or a riding tribe, he may have either a riding horse (with saddle-blanket, halter, bit and bridle) or a small canoe." },
        { name: "Secondary Skill: Outdoor Trade",
          notes: "SECONDARY SKILLS: the Savage should have Fisher, Forester, Hunter, or Trapper/Furrier as his Secondary Skill (player choice)." }
      ],
      wealth:
        "Starts out with NO gold. He gets his starting weapons as described above under Equipment. After the campaign starts, the character will inevitably come across the concepts of money; it is up to the player how he reacts to them.",
      races:
        "Most role-playing campaigns tend to think of the demihumans as being more civilized and cultured than humans, but it is perfectly all right to have Savage dwarves, elves, gnomes, half-elves, and even halflings in your campaign if the DM wishes them to be there."
    },
    swashbuckler: {
      name: "Swashbuckler",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "34-35",
        note:   "Transcribed from the book."
      },
      requirements: {
        dex: 13,
        int: 13,
        intPrinted:
          "must have an Intelligence and Dexterity of 13 or better"
      },
      reaction: [
        { modifier: 2,
          applies: "NPC members of the opposite sex",
          printed: "The Swashbuckler is such a romantic figure that he always receives a +2 adjustment on his reaction roll from NPC members of the opposite sex." }
      ],
      proficiencies: {
        weapon: {
          required: ["Stiletto", "Main-Gauche", "Rapier", "Sabre"],
          allowedPrinted:
            "The Swashbuckler receives two extra weapon proficiency slots which must be devoted to weapon proficiency with one of the following weapons: stiletto, main-gauche, rapier, and sabre. Throughout his career, he must devote half of his weapon proficiency slots to those four weapons. Once he has achieved specialization in all four of those weapons, he may freely choose where the rest of his weapon proficiency slots go.",
          note:
            "SLOT COUNT AND SLOT PATTERN, neither modelled: TWO free extra slots, then HALF of every subsequent slot must go to these four weapons until all four are specialized. The four are not required individually -- the two free slots go to one or more OF them -- so `required` here is the closed pool, not four mandatory picks. All four are flagged in the book as new weapons found in the Equipment chapter, and all four are among the eight PHBR1 weapons already reprinted in CRH Table 58."
        },
        nonweapon: {
          bonus: ["Etiquette", "Tumbling"],
          recommended: [
            "Artistic Ability", "Dancing", "Heraldry", "Languages, Modern", "Riding, Land-Based",
            "Seamanship", "Blind-Fighting", "Gaming", "Musical Instrument", "Reading/Writing",
            "Appraising", "Disguise", "Forgery", "Juggling", "Tightrope Walking"
          ],
          note:
            "CROSSOVER COST: General -- Etiquette (bonus); Artistic Ability, Dancing, Heraldry, Languages (Modern), Riding (Land-Based), Seamanship. Rogue -- Tumbling (bonus); Appraising, Disguise, Forgery, Juggling, Musical Instrument, Tightrope Walking. Warrior -- Blind-Fighting, Gaming. Priest, double slots unless Paladin -- Musical Instrument, Reading/Writing. Wizard, double slots unless Ranger -- Reading/Writing. Musical Instrument and Reading/Writing are each listed twice under different groups; transcribed as printed."
        }
      },
      abilities: [
        { name: "Nonweapon Proficiencies at Single Cost",
          notes: "When using up his Nonweapon Proficiency slots, he does not have to devote double the normal number of slots when choosing Rogue proficiencies." },
        { name: "-2 AC in Light or No Armor",
          notes: "When he is wearing light or no armor -- no armor, leather armor, or padded armor -- he receives a -2 bonus to his AC. An AC of 7 would become a 5. He is so nimble that he is very hard to hit." },
        { name: "Rivals Seek Him Out",
          notes: "Trouble seeks out the Swashbuckler. This is something the DM will have to play very carefully if the Swashbuckler is to be as hindered as all the other Warrior Kits. When there is another Swashbuckler around, intent on proving that he is the best swordsman in the world, it is the PC Swashbuckler he settles upon and challenges. When a certain young lady is being pursued by the king's guards, who are intent on stopping her from revealing secrets in her possession, it is the Swashbuckler she stumbles across when fleeing. When a prince is too drunk to attend his own coronation, miraculously he looks just like the Swashbuckler. Life conspires to make things difficult for the Swashbuckler, and the DM should always throw just a little more good-natured bad luck at that Warrior Kit than at any other." },
        { name: "Equipment: Must Buy His Specialty Weapon",
          notes: "EQUIPMENT: the Swashbuckler MUST buy the weapon in which he has specialized, but except for that limitation may spend his gold precisely as he pleases." },
        { name: "Secondary Skill: Player Choice",
          notes: "SECONDARY SKILLS: the Swashbuckler can choose his own Secondary Skill. Good choices include Navigator (if he is in with a band of pirates, especially), Gambler, Jeweler, Scribe, and Weaponsmith." }
      ],
      wealth:
        "Standard 5d4x10 gp starting money allotment.",
      races:
        "Any demihuman who would look elegant in foppish dress, wielding a narrow blade, will work fine as a Swashbuckler -- especially elves, half-elves and halflings. Dwarves and gnomes are not entirely inappropriate, but are likely to have to defend themselves from plenty of jokes at the expense of their curious looks."
    },
    wildernesswarrior: {
      name: "Wilderness Warrior",
      class: "fighter",
      source: {
        status: "verified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  "35-36",
        note:   "Transcribed from the book."
      },
      requirements: {
        con: 13,
        conPrinted:
          "must have a Constitution score of at least 13"
      },
      proficiencies: {
        weapon: {
          allowedPrinted:
            "The Wilderness Warrior may spend his Weapon Proficiencies any way he pleases. The DM may insist that he spend one or two on weapons appropriate to his culture: a desert nomad should have Scimitar and Short Composite Bow, while an arctic warrior should have Harpoon and Spear, for instance.",
          note:
            "No structured restriction -- the culture-appropriate weapons are a DM judgement and vary per character. Scimitar, Composite Short Bow, Harpoon and Spear are the book's worked examples, not a list."
        },
        nonweapon: {
          bonus: ["Survival", "Endurance"],
          recommended: [
            "Animal Handling", "Animal Training", "Dancing", "Fire-Building", "Fishing",
            "Riding, Land-Based", "Swimming", "Mountaineering", "Tracking"
          ],
          note:
            "Survival is specifically IN HIS NATIVE ENVIRONMENT. The recommended list is explicitly open-ended -- \"any relating to the land of his birth\" -- and the entries here are the book's examples. Dancing is specified as HIS CULTURAL DANCES. CROSSOVER COST: Warrior -- Mountaineering, Tracking."
        }
      },
      abilities: [
        { name: "+5 to Survival in His Native Environment",
          notes: "Gets a special bonus of +5 to his Survival proficiency roll. This only applies to the Survival proficiency pertaining to environments like that of his origin; if he later takes a second Survival proficiency for another type of territory, the bonus does not count toward it." },
        { name: "Unfamiliar With Civilization",
          notes: "In his early years he is occasionally hindered by his unfamiliarity with the player-characters' society, but this is a role-playing consideration: the DM must occasionally enforce it until he believes the character is sufficiently familiar with the usual culture." },
        { name: "Equipment: Culture-Appropriate Only",
          notes: "EQUIPMENT: may only spend his starting gold on items appropriate to his culture. The desert nomad could not buy any armor at all with his starting gold, while the arctic warrior could only have leather or hide armor. If the DM determines that his is a trading culture, he could have access to goods from all over the world. He does NOT have to spend all his starting gold before entering play, and once he begins play there are no restrictions on what sorts of equipment he may buy." },
        { name: "Secondary Skill: Outdoor Trade",
          notes: "SECONDARY SKILLS: may choose his skill from Fisher, Forester, Hunter, Sailor, Trapper/Furrier." },
        { name: "Unusual Beliefs and Customs",
          notes: "The player decides, with DM permission, what sort of tribe and environment the Wilderness Warrior comes from. Then, working with the DM, he must determine what sort of unusual beliefs and customs the character and his tribe possess. He may later abandon a few of these beliefs in the outer world, but should not abandon most of them; they are part of what makes him unique in the campaign. Examples the book gives: a desert nomad may be merely offended at the theft of his property but outraged by (and demand the death penalty for) theft of his water; he may believe that women should stay in camp and leave fighting to the men, an opinion he will find himself quickly disabused from when in the outer world; he may feel the need to prostrate himself whenever he passes the church or temple of the deity he worships." }
      ],
      wealth:
        "The usual 5d4x10 gp in starting gold.",
      races:
        "A very appropriate Warrior Kit for demihuman warriors, and the DM may wish to create some unusual demihuman tribes to showcase it -- Dwarven Wilderness Warriors from the mountains, Elf and Gnome Wilderness Warriors from the tropical rain forest. But what about Desert Dwarves? Arctic Elves? Swamp Gnomes? Mountain Halflings?"
    },
    // ===== House material. Not in PHBR1's kit list. =====
    archer: {
      name: "Archer",
      class: "fighter",
      source: {
        status: "house",
        work:   null,
        pages:  null,
        note:   "NO PUBLISHED SOURCE. The August 2026 PHBR1 survey read the book's full kit list -- Amazon, Barbarian, Beast-Rider, Berserker, Cavalier, Gladiator, Myrmidon, Noble Warrior, Peasant Hero, Pirate/Outlaw, Samurai, Savage, Swashbuckler, Wilderness Warrior -- and Archer is not in it. Retained as deliberate house material at Chris's direction; the mechanics below remain unsourced paraphrase and are NOT a transcription of anything."
      },
      abilities: [
        { name: "Point Blank Range", notes: "+2 to hit at point blank range (6 ft or less)" },
        { name: "Precise Shot", notes: "Shoot into melee without penalty to allies" }
      ],
      requirements: { str: 12, dex: 15, alignment: "Any" },
      benefits: "Specialization in bow costs 1 slot instead of 2. Starts with +1 to hit with bows.",
      hindrances: "Must specialize in a bow. -1 to hit with all melee weapons."
    },
    pitfighter: {
      name: "Pit Fighter",
      class: "fighter",
      source: {
        status: "house",
        work:   null,
        pages:  null,
        note:   "NO PUBLISHED SOURCE. The August 2026 PHBR1 survey read the book's full kit list -- Amazon, Barbarian, Beast-Rider, Berserker, Cavalier, Gladiator, Myrmidon, Noble Warrior, Peasant Hero, Pirate/Outlaw, Samurai, Savage, Swashbuckler, Wilderness Warrior -- and Pit Fighter is not in it. Retained as deliberate house material at Chris's direction; the mechanics below remain unsourced paraphrase and are NOT a transcription of anything."
      },
      abilities: [
        { name: "Unarmed Combat", notes: "Improved unarmed fighting capability" },
        { name: "Resilient", notes: "+1 hit point per level" }
      ],
      requirements: { str: 15, con: 15, alignment: "Any" },
      benefits: "Improved AC when unarmored. Double normal unarmed damage.",
      hindrances: "Cannot use shields. Distrusted in civilized society (-2 reaction)."
    },
  },

  // ========== RANGER KITS ==========
  ranger: {
    beastmaster: {
      name: "Beastmaster",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "47-49",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 5, moveSilently: 0 },
      proficiencies: {
        weapon: {
          allowed: [
            "Club", "Dagger", "Dart", "Javelin", "Knife", "Quarterstaff", "Sling", "Spear",
          ],
          allowedGroups: ["Axe"],
          allowedPrinted: "Initially limited to weapons he can make himself: axe (any), club, dagger, dart, javelin, knife, quarterstaff, sling, spear"
        },
        nonweapon: {
          recommended: [
            "Agriculture", "Bowyer/Fletcher", "Endurance", "Hunting", "Leatherworking",
            "Running", "Swimming", "Weather Sense", "Weaponsmithing, Crude",
          ],
          barred: ["Armorer", "Etiquette", "Heraldry", "Navigation", "Weaponsmithing"],
          note: "The book prints no bonus proficiency (\"Bonus: none, but see Special Benefits\"). Weaponsmithing, Crude is printed separately as \"Optional\" rather than recommended -- it is PERMITTED even though plain Weaponsmithing is barred, and is described in the Mountain Man kit."
        }
      },
      abilities: [
        { name: "Stealth", notes: "+5% chance to hide in natural surroundings." },
        { name: "Animal Henchmen", notes: "Receives no special followers at high level, but may acquire normal or giant animals as henchmen at ANY level. Number depends on Charisma. Slain or driven-off animals may be replaced without penalty, though it may take time." },
        { name: "Animal Telepathy", notes: "Telepathic communication with any normal or giant animal within 30 ft, if he does nothing else that round. The animal must have a minimum Intelligence of 1. He can convey a desire for friendship -- if the offer is sincere, the creature is calmed and will not attack or flee unless attacked. He can recruit a befriended animal as a henchman if not at his limit and the creature fails a saving throw vs. rods; that save is penalized by -1 for every three levels of experience the Beastmaster has earned." },
        { name: "Animal Bonding", notes: "A mental bond with any animal recruited as a henchman. No distance limit, but does not cross planar boundaries. He can communicate directly with the animal to explain tricks or tasks; the animal can communicate its own needs. He can see through the eyes of one bonded creature per round. He has the animal lore proficiency with respect to the bonded animal, and while mentally linked, success is automatic. Every time he gains a level, all current animal henchmen gain an additional hit point." },
        { name: "Animal Horde (9th level)", notes: "May summon a horde of wild animals from a land he controls. Takes one week to gather. 100 Hit Dice of animals per level of the Beastmaster; for every 10 animals there is a pack leader with one additional Hit Die and maximum hit points. The horde stays together one week per level. There is no record of a Beastmaster summoning more than one horde in a year." },
        { name: "Optional Rule: Split Experience", notes: "The Beastmaster may give up to half of his earned experience to any or all animal henchmen that played a role in the adventure. Such henchmen advance on the Fighter Experience Table, receiving +1 to attack rolls and +3 hit points for every level gained. OPTIONAL -- off unless the DM adopts it." },
        { name: "Weapon Proficiencies: Self-Made Only", notes: "Initially limited to weapons he can make himself: axe (any), club, dagger, dart, javelin, knife, quarterstaff, sling, spear." },
        { name: "Nonweapon Proficiencies", notes: "Bonus: none, but see Special Benefits. Recommended: Agriculture, Bowyer/Fletcher, Endurance, Hunting, Leatherworking, Running, Swimming, Weather Sense. Optional: Weaponsmithing (Crude), described in the Mountain Man kit. BARRED: Armorer, Etiquette, Heraldry, Navigation, Weaponsmithing." },
        { name: "Empathic Shock", notes: "-2 penalty to all rolls in the next round when one of his henchmen is wounded. If a mentally linked henchman is killed, -2 to all rolls for the next 24 hours." },
        { name: "Outcast", notes: "-1 reaction penalty from common NPCs and -2 when dealing with a civilized aristocracy. His maximum effective Charisma when dealing with his own race is 15." },
        { name: "Limited Funds", notes: "Starts with 1d4 x 10 gp." },
        { name: "No Fortress", notes: "Will never build a fortress. At 9th level he may establish himself as the protector of an area of land equivalent to a barony." }
      ],
      requirements: {
        // Standard -- the book sets no kit-specific ability minimum
        terrain: ["arctic","desert","forest","hill","jungle","mountain","plains","swamp"],
        terrainPrinted: "Any outdoor land"
      },
      benefits: "Primary terrain: any outdoor land. Secondary skills: Hunter, Fisher. Stealth +5% to hide in natural surroundings. Animal henchmen at any level, with animal telepathy and animal bonding. Animal horde at 9th level. Armor/equipment: starts only with leather armor and weapons he has made himself. Species enemy: standard. Followers: none, but see the animal henchmen benefit.",
      hindrances: "Empathic shock when a henchman is wounded or killed. Unruly allies -- his animal henchmen are free to come, go, or act as they will; arbitrarily restricting their freedom or habitually ignoring their needs results in resentment, sulkiness, and possible abandonment. Outcast reaction penalties. Starts with only 1d4 x 10 gp. Will never build a fortress. Weapon proficiencies initially limited to weapons he can make himself. Five barred nonweapon proficiencies."
    },
    explorer: {
      name: "Explorer",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "49-50",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0 },
      proficiencies: {
        weapon: {
          allowed: [
            "Short Bow", "Light Crossbow", "Dagger", "Dart", "Knife", "Sling",
            "Sword, Short",
          ],
          allowedPrinted: "Confined to short bow, light crossbow, dagger, dart, knife, sling, short sword"
        },
        nonweapon: {
          required: ["Cartography", "Reading/Writing"],
          recommended: [
            "Ancient History", "Bowyer/Fletcher", "Camouflage", "Direction Sense",
            "Distance Sense", "Endurance", "Fire-Building", "Fishing", "Foraging",
            "Herbalism", "Hunting", "Languages, Ancient", "Languages, Modern",
            "Mountaineering", "Navigation", "Rope Use", "Signaling", "Swimming",
            "Trail Marking", "Weather Sense",
          ],
          note: "The book prints the two language entries as \"Languages (Ancient and Modern)\". SLOT RULE NOT MODELLED: an Explorer may learn twice the number of languages his Intelligence allows, each still costing a slot."
        }
      },
      abilities: [
        { name: "Languages", notes: "Can learn twice the normal number of languages allowed by his Intelligence score (PHB Table 4). An Explorer with Intelligence 12 can learn six languages instead of the usual three. All languages still cost a proficiency slot each." },
        { name: "Find the Path", notes: "Can sense the correct direction that will eventually lead to a desired geographical locale. Must be in an outdoor setting, and must have some clue, map, information, or body of research about the locale. Usable once per week, providing a day's worth of guidance." },
        { name: "Culture Sense", notes: "Once per week, may attempt to acquire general knowledge of the laws and customs of a tribe, village, or settlement by touching a member of it. The villager must have the knowledge sought and must not be an infant or mentally deficient; cooperation is not required. The villager saves vs. spells -- if the save succeeds the Explorer learns nothing; if it fails he acquires an instant understanding of local laws and customs. Successful use also gives him a +1 reaction adjustment when encountering any other member of that tribe, village, or settlement." },
        { name: "Special Bonus: Survival in All Terrains", notes: "Receives the benefits of the Survival proficiency in ALL terrain types. Assigning additional slots to this proficiency does not enhance its use in any way." },
        { name: "Required Proficiencies", notes: "Cartography and Reading/Writing are required nonweapon proficiencies. Recommended: Ancient History, Bowyer/Fletcher, Camouflage, Direction Sense, Distance Sense, Endurance, Fire-building, Fishing, Foraging, Herbalism, Hunting, Languages (Ancient and Modern), Mountaineering, Navigation, Rope Use, Signaling, Swimming, Trail Marking, Weather Sense." },
        { name: "Weapon Proficiencies: Light Weapons Only", notes: "Confined to short bow, light crossbow, dagger, dart, knife, sling, short sword." },
        { name: "Limited Animal Empathy", notes: "Because he spends little time in one place, he does not develop animal empathy to the degree of other rangers. When dealing with wild or attack-trained animals, the animal's saving throw vs. rods has a +2 bonus. He must also make a successful Wisdom check when trying to calm or befriend domestic animals." },
        { name: "Few Followers", notes: "No more than two followers at the same time. A new follower will not arrive until one of his current followers is dismissed, lost, or killed. His career limit is the normal 2d6." },
        { name: "No Fortifications", notes: "Will never build a castle or any other fortification." }
      ],
      requirements: {
        int: 12,
        terrainPrinted: "Any (no specialization; used for followers and species enemy only)",
        demiRanger: { race: "halfling", maxLevel: 9 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain: any (no specialization; used for followers and species enemy only). Secondary skills: Fisher, Forester, Hunter, Navigator, Trader/Barterer, Trapper/Furrier. Learns twice the normal number of languages. Find the path once per week. Culture sense once per week, with a +1 reaction adjustment among that people. Survival proficiency benefits in all terrain types. Armor/equipment: no special requirements, but he rarely wears armor heavier than leather and most Explorers find shields awkward and confining.",
      hindrances: "Limited animal empathy -- +2 to the animal's save when dealing with wild or attack-trained animals, and a Wisdom check needed to calm or befriend domestic animals. No more than two followers at a time. Will never build a castle or other fortification. Weapon proficiencies confined to seven light weapons. Cartography and Reading/Writing are required proficiency spends."
    },
    falconer: {
      name: "Falconer",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "51-52",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0 },
      proficiencies: {
        weapon: {
          allowedPrinted: "Must take two of his initial weapon proficiency slots in any of: bow (any), crossbow (light), dagger, knife, sling, spear",
          note: "SLOT RULE, NOT AN ALLOW-LIST -- only TWO initial slots are constrained; remaining and all subsequent slots are free, so nothing here restricts the weapon list as a whole. Left unstructured deliberately; see the header on partial-fill rules."
        },
        nonweapon: {
          bonus: ["Falconry"],
          recommended: [
            "Alertness", "Bowyer/Fletcher", "Endurance", "Hunting", "Leatherworking",
            "Veterinary Healing",
          ],
          note: "The ability card prose says \"Veterinary Medicine\"; the proficiency is named Veterinary Healing in core_nwp.json and in every other kit here."
        }
      },
      abilities: [
        { name: "Enhanced Training", notes: "If a normal falcon has failed to learn a trick or task and become untrainable, the Falconer can try again after gaining a level." },
        { name: "Attuned Follower", notes: "May bond with a falcon follower. Attuning takes six weeks of at least an hour each day; he may forego his own training during this period. At the end he makes a Wisdom check -- on a failure the falcon continues as a normal follower and no second attempt may be made on that bird. On a success the falcon is attuned: it can learn a task or trick each time the FALCONER gains a level, training time is half that given in the falconry proficiency, it can learn tricks up to one per level of the falconer, and it never becomes untrainable. It also gains a one-time hit point bonus equal to twice the Falconer's level at the time of attuning; that bonus does not change as the Falconer advances." },
        { name: "Fearless Falcon", notes: "An attuned falcon never needs to make a morale check when fighting on behalf of, or under the direction of, its Falconer." },
        { name: "Falcon Species Enemy", notes: "An attuned falcon has its OWN species enemy, determined by rolling on Tables 20-27 in Chapter 2 or by the DM choosing. The falcon and ranger may share the same species enemy. The falcon has all of the species enemy bonuses and penalties." },
        { name: "Falcon Attack Bonus", notes: "An attuned falcon receives +2 to all attack rolls, except when fighting its own species enemy, when it receives +4." },
        { name: "Speak With Falcon (10th level)", notes: "Can speak with an attuned falcon follower, similar to the 2nd level priest spell speak with animals, except it requires no components or casting time and may be used at will." },
        { name: "Mental Communication (15th level)", notes: "The Falconer and his attuned falcon can send and receive thoughts at will, up to 100 yards per level of the Falconer. Walls and other physical boundaries have no effect." },
        { name: "Required Weapon Proficiencies", notes: "Must take two of his INITIAL weapon proficiency slots in any of: bow (any), crossbow (light), dagger, knife, sling, spear. Remaining and all subsequent slots are free." },
        { name: "Bonus Proficiency: Falconry", notes: "Recommended: Alertness, Bowyer/Fletcher, Endurance, Hunting, Leatherworking, Veterinary Medicine." },
        { name: "Followers: 3d6, Falcons First", notes: "Unlike other rangers, receives an allotment of 3d6 followers determined at 1st level, and immediately receives a falcon follower which counts against that allotment. Until 10th level he can have only ONE follower and it must be a falcon; a lost falcon is replaced per Chapter 3 and the new falcon counts against the allotment. At 10th level and beyond he becomes eligible for non-falcon followers and may have more than one falcon." },
        { name: "Grief of the Lost Falcon", notes: "If an attuned falcon dies or is lost for any reason, the Falconer succumbs to grief and despair for 1-4 weeks. During this mourning he makes all attack rolls and ability checks at -2, no new followers can be acquired, and he cannot use the animal empathy ability." }
      ],
      requirements: {
        // Standard -- the book sets no kit-specific ability minimum
        terrain: ["desert","forest","hill","mountain","plains"],
        terrainPrinted: "Required: a terrain where falcons are commonly found"
      },
      benefits: "Primary terrain REQUIRED: must be one where falcons are commonly found -- Desert, Forest, Hill, Mountain, or Plains. Secondary skills: Bowyer/Fletcher, Forester, Groom, Hunter, Leather worker, Trader. Bonus proficiency: Falconry. 3d6 followers determined at 1st level, beginning with a falcon. Enhanced training, an attuned falcon with its own species enemy and attack bonuses, speak with falcon at 10th, mental communication at 15th. Armor/equipment: no special requirements, though each falcon he trains requires a set of falconry training equipment.",
      hindrances: "Must take two initial weapon proficiency slots from a fixed list. Until 10th level he may have only one follower and it must be a falcon. If an attuned falcon dies or is lost he mourns for 1-4 weeks at -2 to all attack rolls and ability checks, acquires no new followers, and cannot use animal empathy."
    },
    feralan: {
      name: "Feralan",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "52-55",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 10, moveSilently: 10 },
      proficiencies: {
        weapon: {
          required: ["Club", "Knife"],
          allowed: ["Blowgun", "Dagger", "Short Bow", "Dart", "Hand Axe", "Sling", "Spear"],
          allowedPrinted: "Club and knife are required. Remaining slots must be spent on primitive weapons: blowgun (rare), dagger, short bow, dart, hand axe, sling, spear",
          note: "The book notes the blowgun is rare."
        },
        nonweapon: {
          bonus: ["Trail Signs"],
          bonusChoice: [["Hunting", "Fishing"]],
          allowed: [
            "Alertness", "Animal Handling", "Animal Lore", "Blind-Fighting",
            "Direction Sense", "Endurance", "Fire-Building", "Fishing", "Foraging",
            "Hunting", "Rope Use", "Running", "Set Snares", "Survival", "Swimming",
            "Veterinary Healing", "Weather Sense",
          ],
          allowedPrinted: "His remaining initial proficiencies must be chosen from this list",
          note: "The allow-list governs INITIAL proficiencies only."
        }
      },
      abilities: [
        { name: "Familial Species", notes: "At the beginning of his career the player chooses a familial species representing the type of animal that raised him. A Feralan has only a SINGLE familial species, which never changes. It must share his primary terrain and is subject to DM approval. Suitable animals include wild dogs, bears (any), wolves, great cats (any), and primates (any). It cannot be human, demihuman, humanoid, or of magical or supernatural origin." },
        { name: "Stealth", notes: "+10% chance to hide in natural surroundings and +10% chance to move silently." },
        { name: "Feral Rage", notes: "During melee, the initial wounding of an opponent may impel the Feralan into a frenzy of blood lust. He can make ONE attempt to become enraged at any particular opponent. After the first round in which he inflicts damage on an opponent, he has the option of making a saving throw vs. death magic. If it succeeds he goes into a feral rage for the next 2d6 rounds: +2 to all attack and damage rolls, and his base Armor Class improves by 2 (an unarmored Feralan's AC is temporarily raised to 8). However, all attacks must be made against the designated opponent, and he must attack every round he is able -- he cannot voluntarily break off an attack or choose to attack a different opponent. He must continue until the rage wears off or the opponent dies or escapes. If the rage wears off he may continue attacking normally or take any other action, but cannot attempt to become enraged again against the same opponent. If the opponent dies the rage automatically ends. If the opponent flees he pursues for the duration of the rage." },
        { name: "Climbing", notes: "Base climbing success rate of 60%. This allows tree climbing at his normal movement rate, or cliff climbing if his primary terrain is Arctic, Desert, or Mountain. Much more limited than the thief ability to climb walls. The climbing modifiers in PHB Chapter 14 apply in all situations other than those given." },
        { name: "Speak with Animals", notes: "At will with animals from his familial species. Similar to the 2nd level priest spell, but requires no components or casting time." },
        { name: "Familial Rapport", notes: "Familial followers will generally do what they are asked, assuming they are physically capable, when the Feralan speaks to them in their own language. Mistreated familial followers may still abandon him." },
        { name: "Animal Training", notes: "May train non-familial followers, using the guidelines in Chapter 3." },
        { name: "Call of the Wild", notes: "When in his primary terrain, may attempt to summon familial species animals by howling at the top of his lungs for 1-6 rounds. The DM secretly rolls percentile dice; if the result is less than or equal to the Feralan's Wisdom score plus his level, 1-4 familial animals show up within the next hour. (A 5th level Feralan with Wisdom 15 has a base chance of 20%.) They act as followers for the next 1-4 hours and may be commanded with speak with animals, then disappear into the wilderness. Once per day." },
        { name: "Required Weapon Proficiencies", notes: "Club and knife are REQUIRED. Remaining slots must be spent on primitive weapons: blowgun (rare), dagger, short bow, dart, hand axe, sling, spear." },
        { name: "Bonus Proficiencies", notes: "Bonus: Hunting or Fishing, and Trail Signs. His remaining initial proficiencies must be chosen from: Alertness, Animal Handling, Animal Lore, Blind-fighting, Direction Sense, Endurance, Fire-building, Fishing, Foraging, Hunting, Rope Use, Running, Set Snares, Survival, Swimming, Veterinary Healing, Weather Sense." },
        { name: "No Armor, No Shield", notes: "Adorns himself in crude smocks or loincloths of furs and hides. Wears no armor and carries no shield. His main weapons are ones he makes himself from bones, branches, rocks and other natural materials; if he loses or breaks one he can replace it in a few hours given suitable materials. He can use weapons other than those he makes, but prefers not to." },
        { name: "Followers from 5th Level", notes: "Unlike other rangers, does not begin to receive followers until 5th level. At least half (rounded up) will be of his familial species. He will receive at most ONE human, demihuman, or humanoid follower, and only at 10th level or higher." },
        { name: "Limited Magic", notes: "Can only learn and cast spells from the ANIMAL sphere, and cannot cast spells higher than 2nd level. Table 45 gives his spell progression: no spells to 7th level; 8-9 casting level 1 (one 1st); 10-11 casting level 2 (two 1st); 12-13 casting level 3 (two 1st, one 2nd); 14-15 casting level 4 (two 1st, two 2nd); 16+ casting level 5 (three 1st, two 2nd). May use any magical item normally allowed a ranger." },
        { name: "Limited Money", notes: "Little interest in money or gems, which are as worthless to him as rocks. Keeps only enough to cover training costs, equipment replacement and basic living expenses, usually letting the party divide the remainder of his share. He still receives all experience points due him for finding treasure, and fellow party members receive NO experience point benefit for the Feralan's share." },
        { name: "Reaction Penalty", notes: "-3 reaction penalty when encountering human, demihuman, or humanoid NPCs, INCLUDING other Feralans. He will seldom if ever develop a close relationship with a politically powerful human, demihuman, or humanoid NPC." },
        { name: "No Fortifications", notes: "Will not build a castle or any other type of fortification at any point in his career." }
      ],
      requirements: {
        con: 15, str: 14,
        alignment: ["ng", "cg"],
        alignmentPrinted: "any good alignment, but not lawful",
        terrain: ["arctic","forest","hill","jungle","mountain","plains","swamp"],
        terrainPrinted: "Usually Forest or Jungle; Arctic, Hill, Mountain, Plains and Swamp are possible but less common",
        demiRanger: { race: "halfling", maxLevel: 9 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain: usually Forest or Jungle; Arctic, Hill, Mountain, Plains and Swamp are possible but less common. Secondary skills: Fisher, Forester, Hunter, Trapper/Furrier -- wilderness applications only. Stealth +10% to hide in natural surroundings and +10% to move silently. Feral rage. 60% base climbing. Speak with animals at will with his familial species. Familial rapport, animal training, and call of the wild once per day.",
      hindrances: "Cannot be of lawful alignment. Limited magic -- animal sphere only, nothing above 2nd level, on the Table 45 progression. Wears no armor and carries no shield. Club and knife are required weapon proficiencies and the rest must be primitive weapons. No followers until 5th level, at most one non-animal follower and only at 10th or higher. -3 reaction penalty with humans, demihumans and humanoids including other Feralans. Little interest in money. Will never build a fortification."
    },
    forestrunner: {
      name: "Forest Runner",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "55-56",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 5, moveSilently: 5 },
      proficiencies: {
        weapon: {
          allowedPrinted: "A bonus weapon slot must be filled with one of long bow, quarterstaff, long sword or dagger; three of his first six slots must then take the remaining weapons on that list",
          note: "SLOT RULE, NOT AN ALLOW-LIST -- once the requirement is met, subsequent slots may be filled with any weapon. Also grants an EXTRA weapon slot, which no field here models."
        },
        nonweapon: {
          required: ["Bowyer/Fletcher"],
          recommended: [
            "Alertness", "Blacksmithing", "Camouflage", "Disguise", "Endurance",
            "Leatherworking", "Persuasion", "Riding, Land-Based", "Rope Use",
            "Weaponsmithing",
          ],
          note: "COST REDUCTION NOT MODELLED: Disguise costs him one slot rather than its listed cost."
        }
      },
      abilities: [
        { name: "Stealth", notes: "+5% chance to hide in natural surroundings and +5% chance to move silently." },
        { name: "Inspire", notes: "Once per day, prior to making an attack, may spend 2-5 (1d4+1) rounds boosting the morale of his companions with flattering words and expressions of confidence. He can influence a number of companions equal to his level. If he makes a successful Charisma check, the companions enjoy a +2 bonus to their morale for the next 3-12 (3d4) rounds, and each also receives a +1 bonus to his first attack roll. The inspiring speech does not affect animals, other Forest Runners, or himself. He cannot attempt to inspire companions in the midst of battle or while they are occupied in any other activity." },
        { name: "Disguise", notes: "May take the Disguise proficiency for ONE proficiency slot." },
        { name: "Reaction Bonus", notes: "In his homeland, or any region where his reputation precedes him, he can count on food and shelter at no charge for himself and his companions from supportive commoners. He also receives a +1 reaction modifier from peasants of good or neutral alignment of all cultures." },
        { name: "Bonus Weapon Proficiency Slot", notes: "Receives a BONUS weapon proficiency slot above and beyond those he is normally allowed. The bonus slot must be filled with one of: long bow, quarterstaff, long sword, or dagger. He must then fill three of his first six slots with the remaining weapons on that list. Once that requirement is met, subsequent slots may be filled with any weapons of his choice." },
        { name: "Required Proficiency: Bowyer/Fletcher", notes: "Recommended: Alertness, Blacksmithing, Camouflage, Disguise, Endurance, Leatherworking, Persuasion, Riding (Land-based), Rope Use, Weaponsmithing." },
        { name: "Species Enemy Tied to the Regime", notes: "His species enemy should have some association with the corrupt regime he opposes -- the king's pet (a wolf or tiger), an evil race the monarchy has aligned itself with (goblins or ogres), a symbol of the government (a snake or hydra), or a creature the opposed officials have used in war (a dragon or a giant)." },
        { name: "Personal Nemesis (4th level)", notes: "Any time after reaching 4th level, the Forest Runner acquires a personal nemesis: an NPC of near equal level whose campaign goal is to capture or kill him." },
        { name: "Hunted", notes: "Runs a constant risk of arrest by the authorities of his homeland, as well as from other regimes which have extradition agreements with his homeland. Law-enforcement authorities may plague a Forest Runner through his entire career. He will rarely develop a close relationship with any NPC with political power." }
      ],
      requirements: {
        cha: 12,
        terrainPrinted: "Usually Forest, Hill, Plains, Mountain or Jungle, but no terrain type is excluded provided it holds a reasonably sized and sufficiently corrupt settlement",
        demiRanger: { race: "gnome", maxLevel: 11 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain: most hail from civilized regions in Forest, Hill, Plains, Mountain or Jungle, but no terrain type is excluded provided it contains a reasonably sized and sufficiently corrupt settlement. A Forest Runner from a primary terrain other than Forest modifies the name accordingly -- Mountain Runner, Swamp Runner and so on. Secondary skills: Bowyer/Fletcher, Forester, Farmer, Hunter, Leather worker, Teamster, Weaponsmith. Stealth +5%/+5%. Inspire once per day. Disguise for a single slot. Reaction bonus and free food and shelter in his homeland. A bonus weapon proficiency slot. Armor/equipment: standard.",
      hindrances: "Acquires a personal nemesis at 4th level. Constant risk of arrest at home and in regimes with extradition agreements; law-enforcement may plague him for his entire career. Rarely develops a close relationship with any politically powerful NPC. The bonus weapon slot and three of his first six slots are locked to a fixed list. Bowyer/Fletcher is a required proficiency spend."
    },
    giantkiller: {
      name: "Giant Killer",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "56-59",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0 },
      proficiencies: {
        weapon: {
          allowedGroups: ["Bow", "Crossbow", "Sling"],
          allowedPrinted: "The first weapon slot, and every odd slot thereafter, must be a missile weapon: bow (any), crossbow (any), sling, staff sling, or any melee weapon that can be hurled",
          note: "SLOT PATTERN, NOT AN ALLOW-LIST -- even-numbered slots may take any weapon, so allowedGroups describes only what an ODD slot may hold and must not be read as a restriction on the whole list. \"Any melee weapon that can be hurled\" is an open tail with no field."
        },
        nonweapon: {
          allowed: [
            "Bowyer/Fletcher", "Cobbling", "Cooking", "Hunting", "Pottery",
            "Riding, Land-Based", "Running", "Seamstress/Tailor", "Swimming", "Weaving",
          ],
          allowedPrinted: "Allowed only one nonweapon proficiency at first level, selected from: Bowyer/Fletcher, Cobbler, Cooking, Hunting, Pottery, Riding (Land-based), Running, Tailor, Swimming, Weaving",
          note: "SLOT COUNT NOT MODELLED: only ONE nonweapon proficiency at 1st level. The book's \"Cobbler\" and \"Tailor\" are named Cobbling and Seamstress/Tailor in core_nwp.json."
        }
      },
      abilities: [
        { name: "Bonus Damage vs. Giants", notes: "Inflicts bonus damage against giants of +1 point of damage for every level of the Giant Killer. A 7th level Giant Killer who hits with a spear deals 1-8 from the spear plus 7." },
        { name: "Giants Suffer -4 to Hit Him", notes: "Giants have a base -4 to hit when attacking Giant Killers. A giant with THAC0 10 needs a 14 to hit a Giant Killer with AC 0." },
        { name: "Dodge Giant Attacks", notes: "If a giant with initiative attacks and hits, the Giant Killer may give up his action to dodge; if he saves vs. death magic the giant's attack misses. If the Giant Killer has initiative, he can dodge instead of attacking for the round." },
        { name: "Infuriate", notes: "Can goad a giant into making careless and ill-conceived attacks. He spends two rounds darting between the giant's legs, waving his hands and hollering insults; he cannot attack or take other actions while doing so, and if interrupted he must start over. During this time the giant can attack him, but because of his erratic movement the giant's attacks are made at an additional -2 penalty. At the end of the period the giant saves vs. spells -- if the throw fails, the giant becomes enraged for the next 2-12 (2d6) rounds, directing all of its attacks against the Giant Killer at an additional -4 penalty. The Giant Killer may attack normally while the giant is infuriated." },
        { name: "Optional Rule: Follower Infuriation", notes: "A Giant Killer may enhance his chances of infuriating a giant using an animal follower, which must be a bird or other flying creature of small size (S), trained per the Training Followers rules in Chapter 3. The trick counts against the follower's normal limit of tricks and tasks, and only a Giant Killer can train a follower to infuriate. While the Giant Killer is executing his routine the follower may also infuriate by swooping around the giant's head and screeching; the giant's saving throw is reduced by -2. This is NOT cumulative with additional followers. An infuriated giant might direct attacks at the infuriating follower; if it does, the follower dodges successfully unless the attack roll is a 19 or 20. A follower cannot attempt to infuriate alone. OPTIONAL -- off unless the DM adopts it." },
        { name: "Giant Lore", notes: "On discovering a footprint, lair, campsite, or any other physical evidence of a giant, a successful Wisdom roll enables him to learn general information about it -- type, approximate size, and companions. He may also learn how recently the giant was in the area and in what direction it traveled. The DM decides the quality and amount of information." },
        { name: "Required Weapon Proficiencies: Missiles", notes: "Because he faces tall adversaries he must become proficient with missiles and hurled weapons. The FIRST weapon slot, and every ODD slot thereafter (third, fifth, and so on), must be a missile weapon: bow (any), crossbow (any), sling, staff sling, or any melee weapon that can be hurled. Even-numbered slots may be filled with any weapons of his choice." },
        { name: "One Nonweapon Proficiency at 1st Level", notes: "Giant Killers pursue their interest in giants so single-mindedly that they have little time left to master other skills. He is allowed only ONE nonweapon proficiency at first level, selected from: Bowyer/Fletcher, Cobbler, Cooking, Hunting, Pottery, Riding (Land-based), Running, Tailor, Swimming, Weaving." },
        { name: "No Species Enemy", notes: "Takes no species enemy; his bonuses against giants replace it." },
        { name: "Tracking Limitation", notes: "Unlike other rangers, his tracking ability is limited to tracking GIANTS. A Giant Killer who selects a general Tracking proficiency can track other creatures as a non-ranger character." },
        { name: "Singled Out for Harassment", notes: "Because Giant Killers seldom make an effort to conceal their identities they are often singled out. Insecure villagers may challenge them to duels to impress their friends, and bullies may ambush them to demonstrate their toughness. To avenge the death of a companion, some giants may target a Giant Killer for assassination, and giant tribes occasionally offer bounties for proof of his death." }
      ],
      requirements: {
        str: 15,
        dex: 15,
        terrainPrinted: "Any, so long as some type of giant calls it home"
      },
      benefits: "Primary terrain: any, so long as some type of giant calls it home. For this kit, giants include true giants -- cloud, fire, frost, hill, stone and storm -- and giant-kin such as cyclops, ettins, firbolg, fomorians, verbeeg and voadkyn; the DM may augment the list. Secondary skills: Bowyer/Fletcher, Forester, Groom, Hunter, Tailor, Weaponsmith. Bonus damage of +1 per level against giants, giants at -4 to hit him, the ability to dodge giant attacks, infuriate, and giant lore. Armor/equipment: no special requirements. Followers: normal.",
      hindrances: "Takes no species enemy. Tracking is limited to giants only. Only ONE nonweapon proficiency at 1st level, from a fixed list of ten. The first and every odd weapon proficiency slot must be a missile or hurled weapon. Frequently singled out for duels, ambushes, assassination, and bounties."
    },
    greenwoodranger: {
      name: "Greenwood Ranger",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "59-63",
        note:   "Transcribed from the book. Long entry with a staged transformation; the latency rules on p.59-60 are as important as the benefits."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: -5 },
      proficiencies: {
        weapon: {
          allowed: [
            "Dagger", "Knife", "Quarterstaff", "Sling", "Spear", "Sword, Long",
            "Sword, Short",
          ],
          allowedGroups: ["Axe", "Bow", "Crossbow"],
          allowedPrinted: "Limited to axe (any), bow (any), crossbow (any), dagger, knife, quarterstaff, sling, spear, long sword, short sword"
        },
        nonweapon: {
          bonus: ["Herbalism"],
          required: ["Agriculture"],
          recommended: [
            "Carpentry", "Endurance", "Foraging", "Swimming", "Trail Marking",
            "Weather Sense",
          ],
          barred: [
            "Armorer", "Blacksmithing", "Fire-Building", "Engineering", "Leatherworking",
            "Mining", "Mountaineering", "Navigation", "Riding, Land-Based",
            "Riding, Airborne", "Seamanship", "Spelunking", "Stonemasonry",
            "Weaponsmithing",
          ],
          note: "The book prints the two riding entries as \"Riding (Land-based and Airborne)\". Restrictions apply from 1st level, during latency, even though the kit's special abilities do not arrive until 4th."
        }
      },
      abilities: [
        { name: "Becoming a Greenwood Ranger", notes: "Must commit at 1st level, but the special abilities are not acquired until 4th level. From 1st through 3rd he is a LATENT Greenwood Ranger, operating as a standard ranger while following the secondary skill, weapon and nonweapon proficiency restrictions below and receiving the bonus proficiencies. He may wear any armor allowed a normal ranger and does NOT have the kit's special benefits or hindrances yet. During latency he must spend a minimum of three hours per week in silent prayer; the gods tolerate an occasional lapse, but a ranger who intentionally neglects his prayers on a regular basis is informed in a dream that he is no longer eligible, must abandon the kit, and may NOT take another. At 4th level the gods give him a simple task involving the protection or support of plant life; failing to complete it within a month means an additional 1-4 months of praying before a new task is granted. He then lies in an isolated area of forest or jungle covered in leaves and branches and sleeps for a full day -- if disturbed before 24 hours elapse the transformation is interrupted and he may try again another time." },
        { name: "Cannot Abandon the Kit", notes: "Once transformed, a Greenwood Ranger CANNOT abandon this kit, although actions that would normally cost a ranger his class result in the loss of spell use and other penalties determined by the DM." },
        { name: "Bark Skin as Armor", notes: "Cannot wear armor. His bark-like skin provides comparable protection: at 4th level his Armor Class is 5, and for every level thereafter it increases by 1 -- an 8th level Greenwood Ranger has AC 1. At 15th level he reaches his maximum AC of -6." },
        { name: "Plant Spell Resistance", notes: "+2 bonus when saving against hold plant, charm plant, and similar plant-related spells. Otherwise he makes saving throws, attack rolls and ability checks as a normal human ranger." },
        { name: "Speak with Plants", notes: "At will. Similar to the 4th level priest spell, except that it requires neither components nor casting time." },
        { name: "Photosynthesis", notes: "Has no need to drink or eat, receiving nourishment directly from the sun. So long as he is exposed to sunlight at least an hour per day he stays healthy; he suffers 1-2 points of damage every other day he goes without exposure. Overcast days are sufficient. He satisfies thirst by dipping his feet in any pool or puddle of fresh water for 10 minutes every other day -- exposure to light rain or soaking his feet in a bucket also suffices. If he goes without water for 48 hours he begins to suffer damage at 1-2 points per day." },
        { name: "Buoyancy", notes: "Requires oxygen and is subject to drowning and suffocation, but his woody skin makes him naturally buoyant and he cannot drown unless physically held underwater." },
        { name: "Rooting (8th level)", notes: "Can accelerate healing once per week by burying his feet in earth (not sand or snow; the soil must be capable of supporting plant life) up to his ankles. He must stand stationary and silent for 1-4 hours taking no other actions. If interrupted the rooting fails and he may try again the following week. If uninterrupted, tiny roots sprout from his feet and bury themselves in the ground, absorbing healing nutrients; at the end he recovers 3-12 (3d4) points of damage." },
        { name: "Limbing (10th level)", notes: "Can grow an extra limb from the centre of his chest which functions as a normal arm. He may attempt this once a month by lying on the ground covered with leaves, branches and earth; for the next 24 hours he is in suspended animation similar to a temporal stasis spell. If disturbed the enchantment is broken and limbing will not occur; he may try again the following month. With the third limb: he can wield three weapons at once, with the third weapon at -2 (his Dexterity reaction adjustment modifies this penalty but cannot make it positive), and he gains only two ADDITIONAL attacks per round regardless of how many he is normally allowed -- so a Greenwood Ranger able to attack 3/2 with one weapon can attack 7/2 with three. He also gains +3 when punching, wrestling or overbearing; can swim at 150% of his normal swimming speed; gains a +20% modifier to all climbing attempts; and performs ordinary activities more efficiently. With the juggling proficiency he makes an attack roll vs. AC 2 instead of AC 0 to catch items, and with the weaving proficiency he can create three square yards of material per day instead of two. The new limb withers and falls off in 1-4 days, and he can never have more than one extra limb at a time." },
        { name: "Bonus and Barred Proficiencies", notes: "Bonus: Herbalism. Required: Agriculture. Recommended: Carpentry, Endurance, Foraging, Swimming, Trail Marking, Weather Sense. BARRED: Armorer, Blacksmithing, Fire-building, Engineering, Leatherworking, Mining, Mountaineering, Navigation, Riding (Land-based and Airborne), Seamanship, Spelunking, Stonemasonry, Weaponsmithing." },
        { name: "Weapon Proficiencies: Limited List", notes: "Limited to axe (any), bow (any), crossbow (any), dagger, knife, quarterstaff, sling, spear, long sword, short sword." },
        { name: "Stiff Limbs", notes: "-5% penalty when trying to move silently. He gets NO Dexterity bonus to his Armor Class." },
        { name: "Vulnerability to Fire", notes: "An opponent attempting any normal or magical fire-based attack against him qualifies for a +4 bonus to his attack roll and a +1 per die bonus to his damage roll. The Greenwood Ranger suffers a -4 penalty to all saving throws involving fire-based attacks, and any fire-based attacks that hit inflict +1 hit point per die of damage." },
        { name: "Vulnerability to Extreme Climates", notes: "After any full day spent in a climate where the temperature is below freezing, or averages 100 degrees or more, he must make a Constitution check. Failure results in the loss of 1-4 hit points." },
        { name: "Limited Magic", notes: "Can only learn and cast spells from the PLANT sphere. He uses the ranger's normal spell progression given in Table 5 of Chapter 1." },
        { name: "Reaction Penalty", notes: "-3 reaction adjustment penalty when encountering any NPCs, with the exception of learned nobles, sages, and other high level characters of good or neutral alignment, who are not intimidated by his appearance." },
        { name: "Treant Follower", notes: "Will have at least one treant follower at some point in his career." }
      ],
      requirements: {
        race: ["human"],
        racePrinted: "Must be human",
        terrain: ["forest","jungle"],
        terrainPrinted: "Required: Forest or Jungle"
      },
      benefits: "Primary terrain REQUIRED: Forest or Jungle. Secondary skills: Bowyer/Fletcher, Farmer, Forester, Woodworker/Carpenter. Bonus proficiency: Herbalism. Bark-like skin giving AC 5 at 4th level and improving by 1 per level to a maximum of -6 at 15th. +2 to save against plant-related spells. Speak with plants at will. Photosynthesis, buoyancy, rooting at 8th level, limbing at 10th. Will have at least one treant follower at some point in his career.",
      hindrances: "Must be human. Special abilities do not arrive until 4th level, and the 1st-3rd level latency requires three hours of prayer a week. Once transformed the kit CANNOT be abandoned. Cannot wear armor and gets no Dexterity bonus to AC. -5% to move silently. Severe vulnerability to fire and to extreme climates. Limited magic -- plant sphere only. -3 reaction penalty with almost all NPCs. Thirteen barred nonweapon proficiencies, a required Agriculture spend, and a limited weapon list."
    },
    guardian: {
      name: "Guardian",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "62-64",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0 },
      proficiencies: {
        nonweapon: {
          bonusChoice: [["Hunting", "Fishing"]],
          recommended: [
            "Agriculture", "Bowyer/Fletcher", "Fire-Building", "Fishing", "Foraging",
            "Herbalism", "Hunting", "Riding, Land-Based", "Rope Use", "Set Snares",
            "Swimming", "Veterinary Healing", "Weather Sense",
          ]
        }
      },
      abilities: [
        { name: "Domain", notes: "Every Guardian has a specific region he protects. The DM establishes the boundaries at the beginning of his career. There are no fixed rules, but in general a 1st level Guardian's domain should not exceed a few square miles; it expands by several square miles each time he gains a level. By 5th level it might encompass a region about 20-25 miles across, and by 15th level or higher it might comprise an area the size of a small country. It should correspond to his primary terrain and is typically in an uncivilized part of the world. Two or more Guardians may share an especially large domain, but such cases are rare." },
        { name: "Bonus Sphere: Protection", notes: "Minor access to the Protection sphere." },
        { name: "Bonus Spells Within His Domain", notes: "Can cast certain spells within the boundaries of his domain: detect evil three times per day, and bless and commune with nature once per week each." },
        { name: "Revive Plants", notes: "Can revitalize any type of natural plant life suffering from drought, disease, insect infestation, or other forms of non-magical trauma. Dead plants cannot be affected, nor can he invigorate plants beyond their normal limits -- he cannot cause an apple tree to blossom in the winter. The process requires 8 hours and affects a square area whose sides are 10 yards times his level; a 5th level Guardian can revive all plant life within a 50 yd. x 50 yd. square. Usable once per month." },
        { name: "Bonus Proficiency: Hunting or Fishing", notes: "Recommended: Agriculture, Bowyer/Fletcher, Fire-building, Fishing, Foraging, Herbalism, Hunting, Riding (Land-based), Rope Use, Set Snares, Swimming, Veterinary Healing, Weather Sense." },
        { name: "Tied to His Domain", notes: "If he leaves his domain for any length of time he must make arrangements for someone else to assume his duties -- hiring a caretaker, or assigning temporary custody to a human or demihuman follower. There are no fixed penalties for failing to do so. However, should he abandon his responsibilities for more than a few days, the gods may deny him the use of the special benefits associated with this kit. If he is absent for longer periods -- say, a few weeks -- the gods may also deny him the use of ALL spells. He recovers the use of his special benefits and spells as soon as he returns to his domain." },
        { name: "At Least One Humanoid Follower", notes: "Acquires at least one human or demihuman follower at some point in his career. There are no other restrictions or recommendations." }
      ],
      requirements: {
        // Standard -- the book sets no kit-specific ability minimum
        terrain: ["forest","hill","jungle","mountain","plains"],
        terrainPrinted: "Forest, Hill, Jungle, Mountain, or Plains",
        demiRanger: { race: "dwarf", maxLevel: 15 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain: Forest, Hill, Jungle, Mountain, or Plains. Secondary skills: Bowyer/Fletcher, Farmer, Fisher, Hunter, Trapper/Furrier, Woodworker/Carpenter. Minor access to the Protection sphere. Within his domain he can cast detect evil three times per day and bless and commune with nature once per week each. Revive plants once per month. Armor/equipment: standard. Species enemy: any. Followers: at least one human or demihuman at some point.",
      hindrances: "Bound to a domain he must arrange cover for whenever he leaves. Abandoning his responsibilities for more than a few days may cost him the kit's special benefits; longer absences may cost him ALL spells until he returns."
    },
    justifier: {
      name: "Justifier",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "63-66",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 5, moveSilently: 5 },
      proficiencies: {
        weapon: {
          allowedPrinted: "Must use some of his initial proficiency slots to take one weapon specialization; the weapon of specialization is taken from his list of recommended weapons",
          note: "SLOT RULE, NOT AN ALLOW-LIST -- a mandatory specialization, which no field here models. The book does not print the list of recommended weapons it refers to."
        },
        nonweapon: {
          recommended: [
            "Alertness", "Blind-Fighting", "Bowyer/Fletcher", "Camouflage", "Endurance",
            "Falconry", "Hunting", "Mountaineering", "Navigation", "Riding, Land-Based",
            "Rope Use", "Running", "Set Snares", "Swimming", "Weaponsmithing",
          ],
          note: "BONUS NOT EXPRESSIBLE AS A NAME: he receives Survival in one extra terrain of his choice, which is a second instance of a proficiency he already has, not a new one. SLOT COUNT NOT MODELLED: only ONE nonweapon slot at 1st level, in addition to that bonus."
        }
      },
      abilities: [
        { name: "Weapon Specialization", notes: "Because of his extensive combat training, the Justifier MUST use some of his initial proficiency slots to take one weapon specialization (PHB Chapter 5). The weapon of specialization is taken from his list of recommended weapons." },
        { name: "Stealth", notes: "+5% bonus to his chance of hiding in natural surroundings and to his chance of moving silently." },
        { name: "Tactical Advantage", notes: "Allows the Justifier and his companions to gain a combat advantage by studying the enemy and exploiting its weaknesses. He must spend at least a full, uninterrupted turn secretly observing an enemy or group of enemies prior to an attack. At the end he makes a Wisdom check; if successful he has correctly assessed the enemy's weaknesses and is able to maximize the timing of an attack -- the Justifier and his party AUTOMATICALLY surprise the enemy and gain the initiative for the first round. He can attempt to gain a tactical advantage only once in a particular encounter." },
        { name: "Unarmed Combat Expertise", notes: "When fighting with his bare hands he inflicts 1-4 points of damage on a successful attack roll. If he throws an unmodified 20 on his attack roll, the victim suffers 1-4 points of damage AND must make a saving throw vs. paralyzation; if the throw fails the victim is stunned for 1-6 rounds." },
        { name: "Coordinated Attack", notes: "Can use this ability in conjunction with a trained animal follower to inflict maximum damage on an opponent. The animal follower must be trained to attack on command (Training Followers, Chapter 3). Both make a single attack on the same enemy in the same round, even if one or both are normally allowed multiple attacks; the animal uses its most damaging attack. If either roll misses, that attacker automatically loses initiative in the next round. If both rolls hit, EACH attack causes twice the normal amount of damage. Involves only one follower, and may be attempted at any time during a combat but only once against any particular opponent during an encounter." },
        { name: "Bonus Proficiency: Survival in an Extra Terrain", notes: "In addition to having Survival in his primary terrain, the Justifier receives the proficiency in an extra terrain of his choice. Recommended: Alertness, Blind-fighting, Bowyer/Fletcher, Camouflage, Endurance, Falconry, Hunting, Mountaineering, Navigation, Riding (Land-based), Rope Use, Running, Set Snares, Swimming, Weaponsmithing." },
        { name: "Reduced Species Enemy Penalty", notes: "A Justifier is more respected by his enemies than other rangers. He suffers only a -2 penalty on encounter reactions with his species enemy, and NO penalty if there is a formal truce." },
        { name: "Armor Does Not Impair Stealth", notes: "Though most Justifiers prefer light armor such as leather, he can wear any type of armor and still hide in shadows and move silently. Refer to Table 13: Optional Armor Adjustments in Chapter 1 for adjustments to success chances." },
        { name: "Limited Proficiencies", notes: "His mastery of weapons and combat comes at the expense of learning other skills. He receives only ONE nonweapon proficiency slot at 1st level, in addition to his Survival bonus. He acquires additional proficiency slots at the normal rate." },
        { name: "Limited Spell Use", notes: "Does not acquire spells until 10th level. Table 46: no spells to 9th level; 10th casting level 1 (one 1st); 11th casting level 2 (two 1st); 12th casting level 3 (two 1st, one 2nd); 13th casting level 4 (two 1st, two 2nd); 14th casting level 5 (two 1st, two 2nd, one 3rd); 15th casting level 6 (two 1st, two 2nd, two 3rd); 16th and above casting level 7 (three 1st, two 2nd, two 3rd)." }
      ],
      requirements: {
        str: 14, dex: 14, race: "Human",
        alignment: ["lg"],
        alignmentPrinted: "lawful good",
        race: ["human"],
        racePrinted: "Must be human",
        terrainPrinted: "Any"
      },
      benefits: "Primary terrain: any. Secondary skills: Armorer, Bowyer/Fletcher, Forester, Hunter, Trapper/Furrier, Weaponsmith. One weapon specialization taken from his recommended weapons. Stealth +5%/+5%. Tactical advantage -- automatic surprise and initiative on a successful Wisdom check after a full turn of observation. Unarmed combat expertise. Coordinated attack with a trained animal follower. Survival in an extra terrain of his choice. Only -2 encounter reaction penalty with his species enemy, and none under a formal truce. Can wear any armor and still hide in shadows and move silently.",
      hindrances: "Must be human and of lawful good alignment. Limited proficiencies -- only ONE nonweapon proficiency slot at 1st level in addition to the Survival bonus, thereafter at the normal rate. Limited spell use -- no spells until 10th level, on the Table 46 progression. Must spend initial proficiency slots on a weapon specialization."
    },
    mountainman: {
      name: "Mountain Man",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "65-68",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: -5, moveSilently: -5 },
      proficiencies: {
        weapon: {
          allowed: [
            "Club", "Dagger", "Dart", "Javelin", "Knife", "Quarterstaff", "Spear",
            "Staff Sling", "War Hammer",
          ],
          allowedGroups: ["Axe", "Bow", "Crossbow"],
          allowedPrinted: "Must choose his initial weapon proficiencies from: axe (any), bow (any), crossbow (any), club, dagger, dart, javelin, knife, quarterstaff, spear, staff sling, warhammer",
          note: "Governs INITIAL weapon proficiencies."
        },
        nonweapon: {
          bonus: ["Mountaineering", "Weaponsmithing, Crude"],
          required: ["Hunting"],
          recommended: [
            "Alertness", "Endurance", "Fire-Building", "Foraging", "Mining", "Running",
            "Set Snares", "Signaling", "Trail Marking", "Trail Signs", "Weather Sense",
          ],
          barred: [
            "Agriculture", "Armorer", "Blacksmithing", "Boating", "Bowyer/Fletcher",
            "Charioteering", "Engineering", "Etiquette", "Falconry", "Heraldry",
            "Navigation", "Reading/Writing", "Seamanship", "Spellcraft",
          ],
          note: "Bowyer/Fletcher is barred because its function is included in the Weaponsmithing, Crude bonus, not because the skill is forbidden -- the book says so explicitly."
        }
      },
      abilities: [
        { name: "Will to Live", notes: "Where others would submit to death, the Mountain Man clings to life ferociously. If missing a saving throw vs. death magic would be fatal, he receives a +2 saving throw bonus. If a damage roll would reduce him to zero hit points or less, he makes a Constitution check; if it succeeds he is reduced to 1 hit point instead. He cannot use this ability if he has only 1 hit point remaining. If an encounter results in his death he may not die immediately -- he makes a system shock roll and fights on for another 1-4 rounds, or until he suffers damage below -10 hit points equal to his level, whichever occurs first, then drops dead." },
        { name: "Brew Healing Elixir (7th level)", notes: "Gains the ability to brew a special healing elixir. He must spend 1-4 hours gathering the necessary fresh herbs and mosses, usually available in any forest, jungle or mountain region as determined by the DM. It takes an hour to brew and remains potent for 24 hours. The elixir acts as one dose of a potion of healing. He may brew one per day." },
        { name: "Bonus Proficiency: Crude Weaponsmithing", notes: "Receives Weaponsmithing (Crude) as a bonus proficiency. He is restricted to making the weapons listed in Table 47 and can only make weapons in which he is proficient. He uses stones, wood and other naturally available materials, so these weapons are made at no cost. This proficiency CANNOT be improved -- assigning additional slots to Crude Weaponsmithing has no effect. Table 47 construction times: Arrows 7/day; Axe, Battle 4 days; Axe, Hand 1 day; Axe, Throwing 6 days; Bow, Long 15 days (plus 1 year to season the wood); Bow, Short 12 days; Dagger 2 days; Dart 3/day; Javelin 1 day; Knife 2 days; Quarterstaff 1 day; Spear 2 days; Staff Sling 3 days; Warhammer 5 days." },
        { name: "Optional Rule: Crude Weapons Shatter", notes: "If a weapon made of stone or bone scores a hit, roll 1d6. A stone weapon shatters on a roll of 1; a bone weapon shatters on a roll of 1 or 2, as per The Complete Fighter's Handbook. OPTIONAL -- off unless the DM adopts it." },
        { name: "Bonus and Barred Proficiencies", notes: "Bonus: Mountaineering. Required: Hunting. Recommended: Alertness, Endurance, Fire-building, Foraging, Mining, Running, Set Snares, Signaling, Trail Marking, Trail Signs, Weather Sense. BARRED: Agriculture, Armorer, Blacksmithing, Boating, Bowyer/Fletcher (included in the special Weaponsmithing bonus), Charioteering, Engineering, Etiquette, Falconry, Heraldry, Navigation, Reading/Writing, Seamanship, Spellcraft." },
        { name: "Weapon Proficiencies: Limited List", notes: "Must choose his initial weapon proficiencies from: axe (any), bow (any), crossbow (any), club, dagger, dart, javelin, knife, quarterstaff, spear, staff sling, warhammer." },
        { name: "Handmade Leather and Fur (AC 8)", notes: "Begins his career with any two weapons in which he has a weapon proficiency, at no charge, handmade. He normally does not wear armor, instead wearing a handmade suit of leather and fur which gives him Armor Class 8. Though not strictly forbidden from wearing metal armor, he is so uncomfortable doing so that he suffers a -2 penalty to all attack rolls." },
        { name: "Limited Stealth", notes: "-5% chance to hide in natural surroundings and -5% chance of moving silently." },
        { name: "Limited Magic", notes: "Memorizes fewer spells than other rangers and does not acquire them until 10th level. Table 48: no spells to 9th level; 10-11 casting level 1 (one 1st); 12-13 casting level 2 (two 1st); 14-15 casting level 3 (two 1st, one 2nd); 16+ casting level 4 (two 1st, two 2nd)." },
        { name: "Limited Money", notes: "Other than his weapons and clothing, may own only a single item worth 15 gp or more. The total value of all his other possessions, including money and treasure and excluding training costs, cannot exceed 100 gp. Excess treasure and possessions are given away as he sees fit. He still receives all experience points due him for finding treasure, and fellow party members receive NO experience point benefit from a Mountain Man's gifts." },
        { name: "Reaction Penalty", notes: "-1 reaction adjustment from all NPCs. He suffers a -2 reaction penalty when encountering nobles, aristocrats, and other cultural elite, who find him particularly unpleasant." },
        { name: "Followers: 20% Chance", notes: "Only a 20% chance of attracting human, demihuman, or humanoid followers. Treat a roll of 81-00 as a bear, type determined by the DM -- usually black, brown, or cave. Any followers rolled as full elves will be dwarves instead, except for full elf mages, who will instead be gnome illusionists." },
        { name: "No Fortifications", notes: "Has no interest in fortifications and will never build one." }
      ],
      requirements: {
        str: 14,
        con: 15,
        race: ["human","half-elf"],
        racePrinted: "Cannot be a full elf",
        terrain: ["mountain"],
        terrainPrinted: "Required: Mountains",
        demiRanger: { race: "dwarf", maxLevel: 15 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain REQUIRED: Mountains. Secondary skills: Bowyer/Fletcher, Fisher, Forester, Hunter, Miner, Trapper/Furrier. Bonus proficiencies: Mountaineering and Weaponsmithing (Crude), the latter letting him make the weapons in Table 47 at no cost. Will to live. Brew healing elixir once per day from 7th level. Begins with two handmade weapons free and a handmade leather-and-fur suit worth AC 8.",
      hindrances: "Cannot be a full elf. Limited stealth, -5% to hide in natural surroundings and to move silently. Limited magic -- fewer spells, none until 10th level. Limited money -- one item over 15 gp, 100 gp total in other possessions. -1 reaction from all NPCs and -2 from nobles and the cultural elite. Only a 20% chance of humanoid followers. Never builds a fortification. Fourteen barred nonweapon proficiencies, a required Hunting spend, and a limited weapon list. -2 to all attack rolls if he wears metal armor."
    },
    pathfinder: {
      name: "Pathfinder",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "67-70",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0 },
      proficiencies: {
        weapon: {
          allowedPrinted: "Must fill an initial weapon slot with the machete, hand axe, or sword -- weapons useful for cutting away brush and clearing paths",
          note: "SLOT RULE, NOT AN ALLOW-LIST -- one initial slot is constrained and subsequent slots may be filled with any weapon. This is a required CHOICE from Machete / Hand Axe / any sword; there is no field for that yet, so it is left as printed."
        },
        nonweapon: {
          bonus: ["Direction Sense", "Distance Sense", "Trail Marking", "Alertness"],
          recommended: [
            "Camouflage", "Endurance", "Fire-Building", "Foraging", "Mountaineering",
            "Navigation", "Signaling", "Trail Signs", "Weather Sense",
          ]
        }
      },
      abilities: [
        { name: "Trail Sense", notes: "His chance of getting lost in any outdoor land setting is reduced by 10%. Further, his base chance of getting lost in his primary terrain -- the Surroundings column of Table 81 in the DUNGEON MASTER Guide -- will not exceed 20%. This is NOT cumulative with other benefits, such as the one for the direction sense proficiency. Applies only when the Pathfinder leads the party and at least 20 feet separates him from the rest of it." },
        { name: "Overland Guiding", notes: "Able to find the optimum trail through rough terrain, increasing the party's movement rate when traversing long distances. Use Table 49 in place of Table 74 in Chapter 14 of the DUNGEON MASTER Guide. Movement costs per mile: Barren/wasteland 1; Clear farmland 1/2; Desert, rocky 1; Desert, sand 2; Forest, light 1; Forest, medium 2; Forest, heavy 3; Glacier 1; Hills, rolling 1; Hills, steep (foothills) 3; Jungle, medium 4; Jungle, heavy 6; Marsh/swamp 6; Moor 3; Mountains, low 3; Mountains, medium 4; Mountains, high 6; Plains/grassland/heath 1; Scrub/brushland 1; Tundra 2. Applies only when the Pathfinder leads the party and at least 20 feet separates him from the rest of it." },
        { name: "Marksmanship", notes: "+1 bonus to attacks made with a favorite missile weapon. It must be one in which he has proficiency and which he has selected as a weapon of choice." },
        { name: "Recognize Trail Hazard", notes: "By observing subtle changes in the terrain he can recognize natural hazards, enabling him and his companions to avoid them -- typical hazards include quicksand, sinkholes, slippery slopes and thin ice. He has NO special ability to recognize man-made hazards such as pit traps or dangerous bridges, nor any special talent for anticipating encounters with hostile natives or animals. His chance is 10% per experience level to a maximum of 90% at ninth level. If the DM determines he is approaching an area containing a natural hazard, he secretly rolls percentile dice; if the roll is equal to or less than the chance, the Pathfinder recognizes a potential hazard." },
        { name: "Required Weapon Proficiency: Trail-Cutting", notes: "Must fill an initial weapon slot with the machete (Chapter 7), hand axe, or sword -- weapons useful for cutting away brush and clearing paths. Subsequent slots may be filled with any weapons of his choice." },
        { name: "Bonus Proficiencies", notes: "Bonus: Direction Sense, Distance Sense, Trail Marking, Alertness. Recommended: Camouflage, Endurance, Fire-building, Foraging, Mountaineering, Navigation, Signaling, Trail Signs, Weather Sense." },
        { name: "Exposed at the Front", notes: "By moving ahead of the party the Pathfinder places himself in a position of risk. Separated from his companions he is more likely to be the victim of enemy attacks, runs a greater risk of drawing fire from snipers, and is more susceptible to ambushes from hostile creatures. If he fails to recognize a hazard, he will probably be the first to become a victim of it." },
        { name: "Followers: Fast Movers", notes: "All species are eligible, though he is likely to attract followers with higher movement rates (12+), as he tends to have little patience with creatures that cannot keep up with him." }
      ],
      requirements: {
        // Same as a standard ranger -- no kit-specific ability minimum
        terrain: ["forest","hill","jungle","mountain","plains"],
        terrainPrinted: "Forest, Hill, Jungle, Mountain, or Plains",
        demiRanger: { race: "gnome", maxLevel: 11 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain: Forest, Hill, Jungle, Mountain, or Plains. Secondary skills: Farmer, Forester, Groom, Hunter, Navigator, Trapper/Furrier. Four bonus proficiencies -- Direction Sense, Distance Sense, Trail Marking and Alertness. Trail sense and overland guiding when he leads the party. Marksmanship +1 with a favorite missile weapon. Recognize trail hazard at 10% per level to a maximum of 90%. Armor/equipment: favors light armor such as leather or padded and seldom carries a shield, but has no particular requirements.",
      hindrances: "Trail sense and overland guiding apply ONLY when he leads the party and at least 20 feet separates him from it -- the proximity of others distracts him. Moving ahead exposes him to ambush, snipers, and any hazard he fails to spot. Must fill an initial weapon slot with a machete, hand axe, or sword."
    },
    searanger: {
      name: "Sea Ranger",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "69-72",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: {
        hideInShadows: null,
        moveSilently:  null,
        note: "N/A -- a Sea Ranger has NEITHER hide in shadows nor move silently, replacing them with Sea Legs and Aquatic Combat"
      },
      proficiencies: {
        nonweapon: {
          bonus: ["Swimming"],
          bonusChoice: [["Boating", "Seamanship"]],
          recommended: [
            "Cartography", "Direction Sense", "Distance Sense", "Endurance", "Fishing",
            "Navigation", "Riding, Sea-based", "Rope Use",
          ],
          barred: [
            "Agriculture", "Blacksmithing", "Charioteering", "Falconry", "Mining",
            "Mountaineering", "Riding, Land-Based", "Spelunking", "Stonemasonry",
          ]
        }
      },
      abilities: [
        { name: "Sea Tracking", notes: "Because of his knowledge of prevailing winds, currents and other general aquatic conditions, he can effectively track waterborne craft and aquatic creatures. This is not so much a reading of physical signs as an instinctive deduction of the probable course and destination of the quarry. For purposes of general play he uses the normal Tracking proficiency check rules." },
        { name: "Land Scent", notes: "When at sea, can smell the presence of land -- including islands -- within 50 miles. Further, if he has ever been to that land before, he has a 10% chance per level of identifying it precisely." },
        { name: "Sea Legs", notes: "A fine sense of balance which comes into play when he must fight on a narrow beam, such as a yardarm or boarding plank, or on a pitching deck. Not only is he sure-footed under such conditions, avoiding any attack penalties for them, but any saving throws or Dexterity checks made to maintain his balance are made at a +2 bonus." },
        { name: "Aquatic Combat", notes: "Suffers NO penalties to his attack rolls when in water. Otherwise he follows the standard rules for underwater combat given in Chapter 9 of the DUNGEON MASTER Guide." },
        { name: "Parliament of Fishes (12th level)", notes: "Once per week he may attempt to call a parliament of fishes. He locates a pond, lake or any other body of water containing aquatic life, and sometime between sunset and dawn kneels beside it and concentrates for a full turn; an attack or any other interruption breaks his concentration and he cannot attempt it again until the following week. Otherwise, at the end of 10 rounds, 10-100 (10d10) fish or other aquatic creatures surface and stare expectantly. He must then toss an offering into the water -- food, a coin, or any other object of his choice. The DM rolls 1d10 and consults Table 50, adjusting the result: +1 if the offer was reasonably generous, +2 if exceptionally valuable, -1 if meagre such as a copper piece or a chunk of bread, and -2 if essentially worthless such as a bone or a chunk of rock. The result cannot be decreased below 1 or raised above 10. Table 50: on 1-2 the fish immediately submerge and the offer is rejected, and from dawn to sunrise the following day the ranger suffers a -1 penalty to all attack rolls and ability checks; on 3-7 the fish swim listlessly in circles for a few moments then submerge, the offer is neither rejected nor accepted, and the ranger is unaffected; on 8-10 the fish dive and splash excitedly then submerge, the offer is accepted, and the parliament grants the ranger a boon within their power. Typical services include the location or recovery of small items, the provision of edible water plants, information about local monsters or conditions, and perhaps transport across a small body of water if the parliament members are large enough. Once a month this can be the equivalent of a commune with nature spell." },
        { name: "Bonus and Barred Proficiencies", notes: "Bonus: Boating or Seamanship, and Swimming. Recommended: Cartography, Direction Sense, Distance Sense, Endurance, Fishing, Navigation, Riding (Sea-based), Rope Use. BARRED: Agriculture, Blacksmithing, Charioteering, Falconry, Mining, Mountaineering, Riding (Land-based), Spelunking, Stonemasonry." },
        { name: "NO Move Silently or Hide in Shadows", notes: "A Sea Ranger has NEITHER of these ranger abilities, replacing them with Sea Legs and Aquatic Combat. NOT ENFORCED BY THE SHEET -- the fields stay live; leave them blank." },
        { name: "Tracking Limitation", notes: "His chance of tracking in non-Aquatic terrain is HALVED." },
        { name: "Armor AC 8 or Less", notes: "Because heavy armor interferes with swimming and makes moving around a ship uncomfortable, most Sea Rangers wear armor with an Armor Class of 8 or less." },
        { name: "Aquatic Followers", notes: "The primary terrain of all animal followers must be Aquatic. Any full elf follower is 80% likely to be an aquatic elf." }
      ],
      requirements: {
        int: 12,
        terrain: ["aquatic"],
        terrainPrinted: "Required: Aquatic -- oceans, lakes, ponds and rivers, plus coastlines, beaches and small islands",
        demiRanger: { race: "halfling", maxLevel: 9 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain REQUIRED: Aquatic, which for this kit includes oceans, lakes, ponds and rivers as well as coastlines, beaches and small islands. Secondary skills: Fisher, Navigator, Sailor, Shipwright, Trader/Barterer, Weaver. Bonus proficiencies: Boating or Seamanship, and Swimming. Sea tracking, land scent within 50 miles, sea legs, aquatic combat with no attack penalties in water, and parliament of fishes at 12th level. Species enemy: any aquatic creature is eligible.",
      hindrances: "Has NEITHER move silently nor hide in shadows, replacing them with sea legs and aquatic combat. Tracking in non-Aquatic terrain is halved. Most wear armor of AC 8 or less because heavy armor interferes with swimming and shipboard movement. All animal followers must have Aquatic as their primary terrain. Nine barred nonweapon proficiencies."
    },
    seeker: {
      name: "Seeker",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "71-74",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0 },
      proficiencies: {
        weapon: {
          allowed: [
            "Club", "Light Crossbow", "Dagger", "Dart", "Knife", "Quarterstaff", "Sickle",
            "Sling",
          ],
          barredGroups: ["Sword"],
          allowedPrinted: "Receives only a single weapon proficiency at first level, which must be spent on one of: club, light crossbow, dagger, dart, knife, quarterstaff, sickle, or sling. He can never use a sword of any type.",
          note: "THE ONE PLACE allowed AND barred COEXIST, because the book prints two different SCOPES: the allow-list governs his single 1st-level slot, while the sword prohibition is permanent and absolute. SLOT COUNT NOT MODELLED: one weapon proficiency at 1st level. The DM may impose further restrictions from the Seeker's religion."
        },
        nonweapon: {
          bonus: ["Religion"],
          recommended: [
            "Agriculture", "Ancient History", "Artistic Ability", "Astrology", "Carpentry",
            "Cobbling", "Etiquette", "Languages, Ancient", "Pottery", "Reading/Writing",
            "Spellcraft", "Veterinary Healing", "Weaving",
          ],
          note: "COST REDUCTION NOT MODELLED: a Seeker takes PRIEST-group proficiencies at their listed cost rather than the doubled crossover cost."
        }
      },
      abilities: [
        { name: "Increased Access to Spells", notes: "Unlike other rangers, the Seeker acquires spells when he reaches 6th level, and can also cast 4th level spells. Table 51: no spells to 5th level; 6th casting level 1 (1/-/-/-); 7th casting level 2 (2/-/-/-); 8th casting level 3 (2/1/-/-); 9th casting level 4 (2/2/-/-); 10th casting level 5 (2/2/1/-); 11th casting level 6 (3/2/1/-); 12th casting level 7 (3/2/2/-); 13th casting level 8 (3/3/2/1); 14th casting level 9 (3/3/3/1); 15th casting level 10 (4/4/3/1); 16th and above casting level 11 (4/4/3/2)." },
        { name: "Extra Sphere", notes: "Has access to spells from an EXTRA sphere in addition to those of plant and animal. On reaching 6th level he chooses an extra sphere from divination, healing, protection, or weather. This extra sphere remains the same for the rest of his career." },
        { name: "Magical Staff Use", notes: "Can use any magical staff that can be used by a druid." },
        { name: "Bonus Proficiency: Religion", notes: "Recommended: Agriculture, Ancient History, Artistic Ability, Astrology, Carpentry, Cobbling, Etiquette, Languages (Ancient), Pottery, Reading/Writing, Spellcraft, Veterinary Healing, Weaving. The Seeker can take CLERICAL proficiencies at the listed, non-doubled costs." },
        { name: "One Weapon Proficiency, No Swords Ever", notes: "Receives only a SINGLE weapon proficiency at first level, which must be spent on one of: club, light crossbow, dagger, dart, knife, quarterstaff, sickle, or sling. He can NEVER use a sword of any type." },
        { name: "Species Enemy Must Be Evil", notes: "The species enemy must be evil. Alternately a specific evilly-aligned religious group or cult may be taken, in which case members and minions of the group are considered the species enemy. Other common species enemies include ghouls and other undead, evil dragons, death dogs, and evil humanoids." },
        { name: "Meditation", notes: "Must spend a full hour each day in silent meditation. This must always occur at the same time of day, such as the first hour of dawn or at high noon; once decided it can NEVER be changed. If he neglects to meditate, or is interrupted more than once for more than a total of two rounds, he suffers a -1 penalty to all ability checks and attack rolls the following day." },
        { name: "Sacred Animal", notes: "Every Seeker has a sacred animal that symbolizes his ideals, determined at the same time as his species enemy. The player selects it from Table 52 subject to the DM's approval, or may choose one not listed so long as it differs from the species enemy. He retains the same sacred animal throughout his career and CANNOT acquire a follower of the same species. Table 52 by primary terrain: Aquatic -- dolphin, whale, or giant turtle; Arctic -- polar bear, snow leopard, or seal; Desert -- camel, owl, or hawk; Forest -- bear (brown or black), wolf, or small mammal (raccoon, fox, squirrel, or rabbit); Hills -- bear (black or brown), elk, or wolf; Jungle -- elephant, lion, or chimpanzee; Mountains -- wild eagle, giant eagle, or bear (black or brown); Plains -- falcon, horse, or raven; Swamp -- owl, raven, or small mammal (fox, otter, or mouse)." },
        { name: "Vows to the Sacred Animal", notes: "He is forbidden from intentionally or unintentionally inflicting harm on his sacred animal, or standing by while others do so; he is required to care for injured or ailing sacred animals; he must liberate captive sacred animals held against their will -- this excludes followers of other rangers and domesticated animals serving as pets or mounts, but it DOES include farm animals being raised for consumption; and he must protect his sacred animal from hunters, trappers and predators. If he violates any of these requirements, as determined by the DM, he is consumed with guilt and remorse and cannot cast spells of any kind for the next week. If his action or inaction directly results in the death of a sacred animal, he is unable to cast spells for a full month. If he benefits from an atonement spell cast by a sympathetic priest, the one week suspension is reduced to four days and the month suspension to two weeks." },
        { name: "Possible Religious Restrictions", notes: "In most cases no special equipment restrictions beyond those normally associated with rangers. However, Seekers worshipping particular gods or adhering to strict religious doctrines may have additional restrictions as determined by the DM -- certain Seekers may be forbidden from using any bladed weapon or wearing any type of armor. Such restrictions should be made clear at the outset of the Seeker's career." }
      ],
      requirements: {
        wis: 15,
        terrainPrinted: "Any"
      },
      benefits: "Primary terrain: any. Secondary skills: Farmer, Forester, Groom, Mason, Scribe, Tailor/Weaver, Woodworker/Carpenter. Bonus proficiency: Religion, and clerical proficiencies at non-doubled cost. Acquires spells at 6th level rather than 8th, can cast up to 4th level spells, and gains an extra sphere from divination, healing, protection or weather. Can use any magical staff usable by a druid.",
      hindrances: "A particular religion may impose additional requirements as determined by the DM. Only a SINGLE weapon proficiency at first level, from a list of eight, and he can never use a sword of any type. Species enemy must be evil. Must meditate a full hour at the same time each day, or take -1 to all ability checks and attack rolls the following day. Bound by four vows to a sacred animal, with spell loss for a week -- or a month if one dies -- for violating them, and he can never take a follower of that species."
    },
    stalker: {
      name: "Stalker",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "73-76",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 10, moveSilently: 10 },
      proficiencies: {
        weapon: {
          allowed: [
            "Blowgun", "Dagger", "Dart", "Knife", "Sword, Short", "Quarterstaff", "Sling",
          ],
          allowedPrinted: "Becomes proficient only with weapons he can easily conceal: blowgun, dagger, dart, knife, short sword, staff, and sling",
          note: "The book's \"staff\" is the Quarterstaff. The book also offers garrote, rapier (carried as a walking stick) and stiletto as DM options; Rapier and Stiletto exist in core_wp.json but are NOT added to the allow-list because the book prints them as optional, and there is no garrote record at all."
        },
        nonweapon: {
          bonus: ["Alertness", "Camouflage"],
          recommended: [
            "Blind-Fighting", "Etiquette", "Languages, Modern", "Persuasion", "Signaling",
            "Trail Marking", "Trail Signs",
          ],
          note: "The book prints \"Modern Languages\"; the proficiency is named Languages, Modern in core_nwp.json."
        }
      },
      abilities: [
        { name: "Urban Tracking", notes: "Normal ranger tracking abilities in outdoor land settings. In addition, he has FULL (not half) tracking capabilities in urban settings." },
        { name: "Stealth Abilities", notes: "+10% bonus to his base chance to hide in shadows / hide in natural surroundings and a +10% bonus to his chances to move silently. He has the FULL (not half) chance for success when attempting to hide in shadows or move silently in urban settings, or in non-natural constructions such as crypts or dungeons." },
        { name: "Stealth in Armor", notes: "Can hide in shadows and move silently while wearing armor of AC 6 or less. See Table 13: Optional Armor in Chapter 1." },
        { name: "Silent Approach", notes: "When he successfully uses his move silently ability to sneak up on an opponent to surprise him, the opponent suffers a -3 penalty to his surprise roll. The Stalker must be 90 feet or more from party members without similar silent movement abilities." },
        { name: "Interrogation", notes: "When interrogating an NPC for any reason, he can acquire special knowledge about the NPC in ONE, but not both, of the following ways. First, by making a successful Intelligence check using half his Intelligence score rounded up, he can determine the general alignment of the NPC -- the good-evil component only. Second, he can ascertain the NPC's honesty: the DM secretly makes an Intelligence check for him; if it fails, the DM tells him nothing and he must make up his own mind about the NPC's reliability. If it succeeds and the NPC is honest, the DM tells him the NPC is telling the truth to the best of his knowledge -- this in no way compels the NPC to reveal anything, and the NPC may still pass along unreliable information he believes to be true. If it succeeds and the NPC is dishonest, the DM tells him the NPC may be lying, and it is up to the Stalker to separate truth from lies." },
        { name: "Photographic Memory (10th level)", notes: "Acquires a limited photographic memory, enabling him to recall details about anything he has seen or heard SINCE achieving 10th level -- a fragment of a conversation, a mental image of a place he has visited, or words on a printed page. To use it the DM secretly makes an Intelligence check for him at a -2 penalty. If the roll fails, the memory is too vague to be of use. If it succeeds, the DM tells him what he wishes to remember. If the roll is a natural 20, the DM gives him intentionally MISLEADING information -- a room, for instance, is incorrectly recalled as having a locked window or mysterious claw marks on the walls. Because of the mental stress involved, this ability can be used only once per day." },
        { name: "Free Terrain Suit", notes: "At the beginning of his career he receives a free terrain suit (Chapter 7) corresponding to his primary terrain -- night black for Urban." },
        { name: "Weapon Proficiencies: Concealable Only", notes: "Becomes proficient only with weapons he can easily conceal: blowgun, dagger, dart, knife, short sword, staff, and sling. Optional: garrote, rapier (walking stick), stiletto." },
        { name: "Bonus Proficiencies", notes: "Bonus: Alertness and Camouflage. Recommended: Blind-fighting, Etiquette, Modern Languages, Persuasion, Signaling, Trail Marking, Trail Signs." },
        { name: "One Follower at a Time", notes: "Receives a career total of 2d6 followers like other rangers, but only ONE follower at a time. A new follower will not appear until his current follower dies or is dismissed. He will not acquire a new follower even if he releases his current one or arranges for its care elsewhere -- he must sever all ties with the old follower before another will arrive. He never accepts human or demihuman followers, nor followers whose intelligence compares favourably with that of humans, such as pixies or aarakocra, as he fears such beings are undependable and may cause unnecessary distractions. All animal followers must be less than four feet tall, size S or T." },
        { name: "Hated by Both Sides", notes: "Neither lawbreakers nor outlaws appreciate snoops, and typically the harshest possible penalties are reserved for captured Stalkers. Should a band of orcs or goblins realize a Stalker is in their midst, they are likely to chase him down and beat him mercilessly. A Stalker caught lurking in a private residence will probably be prosecuted to the fullest extent of the law. An otherwise friendly NPC may be less likely to cooperate with the party if he recognizes one of its members as a Stalker." }
      ],
      requirements: {
        int: 14,
        race: ["human"],
        racePrinted: "Must be human",
        terrain: ["arctic","aquatic","desert","forest","hill","jungle","mountain","plains","swamp","urban"],
        terrainPrinted: "Any; in addition, a Stalker's primary terrain can be URBAN",
        demiRanger: { race: "gnome", maxLevel: 11 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain: any; in addition, a Stalker's primary terrain can be URBAN. Secondary skills: any. Bonus proficiencies: Alertness and Camouflage. Full tracking in urban settings. +10% to hide in shadows and to move silently, with full chance in urban settings and in non-natural constructions such as crypts and dungeons. Can hide and move silently in armor of AC 6 or less. Opponents he sneaks up on take -3 on their surprise roll. Interrogation. Photographic memory at 10th level. A free terrain suit at the start of his career.",
      hindrances: "Must be human. Weapon proficiencies limited to easily concealed weapons. Only ONE follower at a time out of a 2d6 career total, never human or demihuman, never a creature of near-human intelligence, and all animal followers must be under four feet tall. Hated by lawbreakers and law-enforcers alike, with the harshest penalties reserved for captured Stalkers."
    },
    warden: {
      name: "Warden",
      class: "ranger",
      source: {
        status: "verified",
        work:   "PHBR11 The Complete Ranger's Handbook",
        pages:  "75-78",
        note:   "Transcribed from the book."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0 },
      abilities: [
        { name: "Stipend", notes: "A Warden in good standing with his overlord receives a monthly stipend commensurate with his responsibilities and experience. Warden salaries average 30-50 gp per month, plus a monthly bonus of 10 gp times the Warden's level." },
        { name: "Expenses", notes: "When undertaking an expedition on behalf of his overlord he may receive a small stipend to cover his expenses, typically ranging from 100-500 gp depending on the length of the expedition, his level, and the generosity of the overlord. He may spend these funds ONLY on goods and services directly relating to the success of the expedition. In lieu of money he may receive the loan of a mount, weapons, or equipment necessary for the undertaking." },
        { name: "Annual Boon", notes: "Once per year he can ask the overlord for a boon. It is traditional that this be granted insofar as the resources of the overlord and the judgement of the DM allow, although exceptionally greedy or ill-considered requests will reflect badly on the Warden." },
        { name: "Reaction Bonus", notes: "When representing his overlord he receives a +2 bonus to his reaction checks with all good and neutral characters of high social status -- including aristocrats, government officials, and affluent citizens -- regardless of their culture or whether he has met them before." },
        { name: "Accountability", notes: "Held fully accountable for any actions that may reflect badly on his overlord. Should he break the law, insult a noble, or otherwise behave improperly, his overlord will demand an explanation; an unsatisfactory one results in a reprimand at best and termination at worst. A terminated Warden is FORCED to abandon this kit, suffering all of the penalties described in the Abandoning Kits section." },
        { name: "Accounting for Expenses", notes: "If he receives expenses he must make a full accounting of his expenditures and return any excess funds at the conclusion of the expedition. Should a discrepancy be discovered he may be fined or imprisoned. If he has been given special equipment instead of or in addition to expenses, all items must be returned in good condition -- otherwise money may be deducted from his stipend to replace them, or the overlord may confiscate an equivalent amount of his goods." },
        { name: "Overlord Demands", notes: "Always subject to orders from his overlord. Some are critical, others trivial, but all must be followed for him to remain in good standing; failure may result in penalties ranging from fines to termination of employment. Sample demands: taking along a young relative of the overlord who wants to see the world, and accepting responsibility for that relative's safety and behavior; making contact with a long-lost friend of the overlord while in a distant land and extending an invitation to visit; displaying a banner bearing the overlord's insignia at all times and wherever he goes; and turning over some or all of the treasure he collects on an adventure in times of austerity." }
      ],
      requirements: {
        cha: 12,
        alignment: ["lg", "ln", "le", "ng", "tn", "ne"],
        alignmentPrinted: "any non-chaotic alignment",
        terrainPrinted: "Any, though Forest and Plains are the most common; it should correspond to the area the Warden is first assigned to supervise",
        demiRanger: { race: "dwarf", maxLevel: 15 },
        demiRangerNote: "PHBR11 Table 53 (p.79). The book offers demi-rangers as an OPTIONAL experiment, not a rule it asserts. Read by the 'Apply PHBR11 optional rules' toggle, which uses this field to SUPPRESS the race/class warning for exactly these pairs -- it enforces nothing. maxLevel is reference only; the app models no level limits."
      },
      benefits: "Primary terrain: any, though Forest and Plains are the most common; it should correspond to the area the Warden is first assigned to supervise. Secondary skills: Armorer, Bowyer/Fletcher, Farmer, Forester, Groom, Weaponsmith, Woodworker/Carver. A monthly stipend of 30-50 gp plus 10 gp times his level. Expenses of 100-500 gp on his overlord's business. An annual boon. +2 reaction with good and neutral characters of high social status when representing his overlord. Armor/equipment: no special requirements, and depending on his overlord's generosity he may have access to the finest equipment money can buy.",
      hindrances: "Cannot be of chaotic alignment. Held fully accountable for anything that reflects badly on his overlord -- an unsatisfactory explanation means reprimand or termination, and a terminated Warden is FORCED to abandon the kit and take the abandonment penalties. Must fully account for expenses and return excess funds or face fines or imprisonment. Always subject to his overlord's orders, critical or trivial, on pain of fines or dismissal. Will not undertake any adventure without direct orders from, or the express permission of, his overlord."
    },
    cryptranger: {
      name: "Crypt Ranger",
      class: "ranger",
      source: {
        status: "verified",
        work:   "DRAGON #234",
        pages:  "24-26",
        note:   "Ross Allen Clifton, \"Two ghastly new Ranger kits\", October 1996. " +
                "Written to REPLACE the Crypt Ranger sketched in the CRH, which the author " +
                "considered wrong; the CRH version is not a source for this entry. " +
                "The recommended proficiency list prints \"blind-fighting endurance\", a " +
                "dropped comma between two real proficiencies; corrected to " +
                "\"blind-fighting, endurance\". " +
                "Proficiency lines below are prose awaiting the structured kit-proficiency " +
                "schema -- see project notes, 'Structured kit proficiency data'."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0,
        note: "DRAGON #234 states no stealth adjustment. Not in PHBR11 Table 12, which predates these kits." },
      proficiencies: {
        weapon: {
          allowedPrinted: "One weapon proficiency must be taken in a bludgeoning weapon. No other weapon restrictions; he may choose from any weapon the ranger class can use.",
          note: "NOT STRUCTURED: \"bludgeoning\" is not a value in WEAPON_GROUP_ORDER, which splits those weapons across Club, Flail, Hammer and Mace. Resolving it would mean inventing a group the taxonomy does not have."
        },
        nonweapon: {
          bonus: ["Ancient History"],
          recommended: [
            "Alertness", "Blind-Fighting", "Endurance", "Hunting", "Persuasion",
            "Reading/Writing",
          ]
        }
      },
      abilities: [
        { name: "Protection from Evil", notes: "A special form of the 1st-level wizard spell. Undead opponents take -2 on any attack rolls against him, and he gains +1 to all saving throws." },
        { name: "Immunity to Fear and Scare Effects", notes: "Immune to fear and scare effects generated by creatures of the same level/hit dice or lower." },
        { name: "Detect Undead", notes: "As the 1st-level wizard spell, base 50 ft radius, increasing 5 ft per level. One round of concentration to activate; lasts one round; three attempts per day. Gives direction and distance to the undead, but not the exact type." },
        { name: "Bonus Proficiency: Ancient History", notes: "Free nonweapon proficiency. Recommended (not free): Alertness, blind-fighting, endurance, hunting, persuasion, reading/writing. AWAITING STRUCTURED SCHEMA -- not granted automatically." },
        { name: "Required Weapon Proficiency: Bludgeoning", notes: "One weapon proficiency must be taken in a bludgeoning weapon. No other weapon restrictions; he may choose from any weapon the ranger class can use. AWAITING STRUCTURED SCHEMA -- not enforced." },
        { name: "Species Enemy: Undead", notes: "Species enemy must be an undead type -- ghouls, skeletons and zombies typically, but liches, vampires or ghosts in some cases. A related opponent such as lycanthropes may also be chosen; many reserve a special hatred for necromancers." },
        { name: "Primary Terrain: Any Land", notes: "May pick any land as primary terrain. Arctic tundra and similar types are less likely to harbour undead but are not forbidden." },
        { name: "Followers", notes: "As per normal rangers." }
      ],
      requirements: {
        int: 14,
        terrain: ["arctic","desert","forest","hill","jungle","mountain","plains","swamp"],
        terrainPrinted: "Any land. Arctic tundra and similar types are less likely to harbour undead but are not forbidden"
      },
      benefits: "Protection from evil (undead attackers at -2 to hit him; +1 to all his saving throws). Immune to fear and scare effects from creatures of his own level/HD or lower. Detect undead three times per day. Bonus nonweapon proficiency: Ancient history. Secondary skills: forester, scribe, trader/barterer, weaponsmith. Prefers light armor but may use any armor or equipment the situation requires.",
      hindrances: "-3 to reaction rolls from 0-level NPCs who know of his profession -- the sight of a known Crypt Ranger makes people wonder what foul creature has brought him to their community. Must take one weapon proficiency in a bludgeoning weapon. Species enemy must be an undead type. Exposed by profession to aging, level drain and the risk of becoming undead, and to harassment from the necromancers, liches and vampire lords he makes enemies of."
    },
    cryptdefender: {
      name: "Crypt Defender",
      class: "ranger",
      source: {
        status: "verified",
        work:   "DRAGON #234",
        pages:  "26-27",
        note:   "Ross Allen Clifton, \"Two ghastly new Ranger kits\", October 1996. " +
                "FOUR PRINTING ERRORS IN THE SOURCE, all resolved here rather than left open: " +
                "(1) the Speak with dead paragraph sits under Crypt Defender but reads " +
                "\"a Crypt Ranger can attempt to...\" -- a typo; the Crypt Ranger has no " +
                "locale, so it can only mean the Defender. Recorded as the Defender's. " +
                "(2) The Followers paragraph says the follower leaves \"with the Crypt Ranger " +
                "as an apprentice\" -- the same typo, resolved the same way. " +
                "(3) Alertness and area knowledge is printed as \"+2 on reaction rolls\". " +
                "Ruled a printing slip for SURPRISE; see the ambiguity block on that ability, " +
                "which records both readings. " +
                "(4) The recommended proficiency lists print \"blind-fighting endurance\" -- " +
                "a dropped comma between two real proficiencies. Corrected to " +
                "\"blind-fighting, endurance\" in both kits. " +
                "Proficiency lines below are prose awaiting the structured kit-proficiency " +
                "schema -- see project notes, 'Structured kit proficiency data'."
      },
      thiefSkillMods: { hideInShadows: 0, moveSilently: 0,
        note: "DRAGON #234 states no stealth adjustment. Not in PHBR11 Table 12, which predates these kits." },
      proficiencies: {
        weapon: {
          allowedPrinted: "One weapon proficiency slot must go to a weapon linked to his site -- a kopesh for a pyramid defender, a quarterstaff or mace for the catacombs of an abbey. He may use only weapons of a size appropriate to his locale.",
          note: "NOT STRUCTURED: the linked weapon is chosen per character with the DM, and the size cap is a locale judgement, not a list. The article's \"kopesh\" is Sword, Khopesh in core_wp.json."
        },
        nonweapon: {
          bonus: ["Local History"],
          recommended: [
            "Ancient History", "Blind-Fighting", "Endurance", "Etiquette", "Hunting",
            "Persuasion", "Reading/Writing",
          ]
        }
      },
      abilities: [
        { name: "Reaction Bonus", notes: "+2 to NPC encounter reaction rolls with anyone who knows he is a Crypt Defender. NOT scoped to his site -- the station is respected wherever he goes. Defenders of the dead are honoured by periodic visits from priests and noblemen, and a reasonable request is usually granted. The roll itself is the DM's." },
        { name: "Alertness and Area Knowledge", notes: "+2 to his own surprise roll while within the site he defends. He knows the place so well that anything out of the ordinary puts him on his guard -- air currents, smells and sounds in catacombs, for instance -- and he shifts into a defensive mode immediately. Does NOT stack with the Reaction Bonus above; the two are different subsystems with different scopes. See ambiguity below: the article prints this as a reaction bonus.",
          ambiguity: {
            printed:  "+2 on reaction rolls",
            ruling:   "+2 to his own surprise roll, while within the site he defends",
            rulingBy: "dm",
            basis:    "The paragraph describes perception rather than attitude -- air " +
                      "currents, smells, sounds, what is normal and what is amiss, and " +
                      "shifting into a defensive mode -- and the benefit is titled " +
                      "Alertness. Read as printed it would be a second, unscoped reaction " +
                      "bonus sitting directly beneath the first. The two benefits are not " +
                      "redundant under either reading, since the Reaction Bonus is scoped " +
                      "to people who know his station and this one is scoped to his site, " +
                      "but surprise is the better fit for what the text describes."
          } },
        { name: "Speak with Dead", notes: "Once per week at his locale, similar to the 3rd-level priest spell. One complex, two moderate, or three simple questions. Answers are truthful but may be very ambiguous. Time since death is irrelevant, as the ability is tied to the site rather than the soul." },
        { name: "NO Species Enemy", notes: "A Crypt Defender does NOT choose a species enemy as other rangers do, and does not gain the species-enemy attack bonus or suffer its reaction penalty. NOT ENFORCED BY THE SHEET -- the species enemy field stays live; leave it blank." },
        { name: "Bonus Proficiency: Local History", notes: "Free nonweapon proficiency. Recommended (not free): Ancient history, blind-fighting, endurance, etiquette, hunting, persuasion, reading/writing. AWAITING STRUCTURED SCHEMA -- not granted automatically." },
        { name: "Required Weapon Proficiency: Site-Linked", notes: "One weapon proficiency slot must go to a weapon linked to his site -- a kopesh for a pyramid defender, a quarterstaff or mace for the catacombs of an abbey. AWAITING STRUCTURED SCHEMA -- not enforced." },
        { name: "Weapon Size Capped by Locale", notes: "He may use only weapons of a size appropriate to his locale. A pyramid defender could not use a large (L) weapon such as a pole arm in narrow confines; a battlefield defender is unrestricted and would likely favour missile weapons. AWAITING STRUCTURED SCHEMA -- not enforced." },
        { name: "Special Terrain: A Single Locale", notes: "Must choose a single locale rather than a terrain type -- normally a large tomb complex, a battlefield with mass graves, or a large cemetery or catacombs. The only exception is a defender in the service of a ruler, who is assigned to different locales as needed." },
        { name: "One Follower Only", notes: "Receives only one follower, at the appropriate level. That follower becomes the next defender of the site when he retires or moves on; if the site is not permanent, the follower leaves with him as an apprentice." }
      ],
      requirements: {
        terrainPrinted: "NOT a terrain type -- a single named locale, normally a large tomb complex, a battlefield with mass graves, or a large cemetery or catacombs"
      },
      benefits: "+2 to reaction rolls from those who know his station, and a further +2 on reaction rolls from alertness and area knowledge (see the source note on that second bonus). Speak with dead at his locale once per week. Bonus nonweapon proficiency: Local history. Secondary skills: farmer, fisher, limner/painter, mason, trapper/furrier. No restriction on the amount of equipment he may possess, though most adopt their brethren's spartan ways; for armor he adopts the ceremonial armor of the site he protects.",
      hindrances: "Takes NO species enemy, and gains neither the attack bonus nor the reaction penalty that go with one. Receives only one follower. Bound to a single locale and rarely travels or adventures. Weapon choice is capped by the size his locale allows, and one weapon proficiency slot must go to a site-linked weapon. Must train himself under the DMG self-training rules except in the rarest of cases. Requirements are those of the ranger class, with no kit-specific ability minimum."
    }
  },

  // ========== PALADIN KITS ==========
  paladin: {
    cavalier: {
      name: "Cavalier",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Mounted Excellence", notes: "Superior mounted combat abilities" },
        { name: "Chivalric Code", notes: "Follows strict code of chivalry" }
      ],
      requirements: { str: 15, dex: 12, cha: 15, alignment: "Lawful good" },
      benefits: "+3 to hit when mounted. Free lance specialization. +2 to saves when mounted.",
      hindrances: "Must own and maintain warhorse. Must accept challenges to honor. Tithe 50%."
    },
    divinate: {
      name: "Divinate",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Divine Insight", notes: "Can cast augury 1/day" },
        { name: "Aura Reading", notes: "Detect evil extended to 90 ft" }
      ],
      requirements: { wis: 16, cha: 15, alignment: "Lawful good" },
      benefits: "Bonus priest spells at lower level. Turn undead as cleric of same level.",
      hindrances: "Must spend time in prayer (2 hours daily). Cannot use edged weapons."
    },
    errant: {
      name: "Errant",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Wandering Knight", notes: "Enhanced survival and tracking" },
        { name: "Champion of the Helpless", notes: "+2 to hit when defending innocents" }
      ],
      requirements: { str: 14, cha: 15, alignment: "Lawful good" },
      benefits: "Free survival proficiency. +2 to reaction with common folk.",
      hindrances: "Cannot own property or settle down. Must help those in need."
    },
    ghosthunter: {
      name: "Ghosthunter",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Spirit Sense", notes: "Detect undead at 60 ft" },
        { name: "Turn Undead Enhancement", notes: "Turn undead as cleric 2 levels higher" }
      ],
      requirements: { wis: 15, cha: 15, alignment: "Lawful good" },
      benefits: "+2 to hit vs undead. Immune to energy drain. See invisible undead.",
      hindrances: "Must hunt undead. Disturbing aura makes people uncomfortable (-1 reaction)."
    },
    inquisitor: {
      name: "Inquisitor",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Detect Lie", notes: "Can detect lies 3/day" },
        { name: "Interrogation", notes: "+4 to gather information" }
      ],
      requirements: { int: 13, wis: 15, cha: 15, alignment: "Lawful good" },
      benefits: "Bonus to detect evil (works on neutrals too). Zone of truth 1/week.",
      hindrances: "Must root out corruption zealously. Reduced lay on hands ability (-50%)."
    },
    medician: {
      name: "Medician",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Enhanced Healing", notes: "Lay on hands heals 3 HP per level" },
        { name: "Cure Disease", notes: "Can cure disease at 1st level (3/week)" }
      ],
      requirements: { wis: 15, cha: 15, alignment: "Lawful good" },
      benefits: "Free healing proficiency. Can heal others more than self.",
      hindrances: "Must aid sick and injured. Cannot refuse healing requests. Reduced combat bonuses."
    },
    militarist: {
      name: "Militarist",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Military Training", notes: "Trained in army tactics and leadership" },
        { name: "Inspiring Commander", notes: "Grant +1 to morale to troops within 30 ft" }
      ],
      requirements: { str: 15, int: 12, cha: 15, alignment: "Lawful good" },
      benefits: "Free military tactics proficiency. Double normal followers at 9th level.",
      hindrances: "Must serve military organization. Must follow chain of command."
    },
    equerry: {
      name: "Equerry",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Noble's Champion", notes: "Serve a noble house" },
        { name: "Herald", notes: "Can deliver messages with diplomatic immunity" }
      ],
      requirements: { int: 12, cha: 16, alignment: "Lawful good" },
      benefits: "+3 reaction in noble circles. Free etiquette proficiency.",
      hindrances: "Must serve a specific noble. Cannot adventure freely without permission."
    },
    votary: {
      name: "Votary",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Religious Devotion", notes: "Enhanced connection to deity" },
        { name: "Extra Spell", notes: "One bonus 1st level spell per day" }
      ],
      requirements: { wis: 16, cha: 15, alignment: "Lawful good" },
      benefits: "Turn undead as cleric of same level. +2 to saves vs priest spells.",
      hindrances: "Must perform daily services (3 hours). Limited equipment (no magic items except 5)."
    },
    wyrmslayer: {
      name: "Wyrmslayer",
      class: "paladin",
      source: {
        status: "unverified",
        work:   "PHBR12 The Complete Paladin's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Dragon Slayer", notes: "+4 to hit dragons" },
        { name: "Dragon Fear Immunity", notes: "Immune to dragon fear auras" }
      ],
      requirements: { str: 16, cha: 15, alignment: "Lawful good" },
      benefits: "+4 to saves vs dragon breath. Can track dragons. Detect dragons 120 ft.",
      hindrances: "Must hunt evil dragons. Dragons always hostile. -2 reaction with non-dragon creatures."
    }
  },

  // ========== CLERIC KITS ==========
  cleric: {
    priestofmythos: {
      name: "Priest of Specific Mythos",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Deity-Specific Powers", notes: "Granted powers based on chosen deity" },
        { name: "Sacred Weapon", notes: "Proficiency with deity's favored weapon" }
      ],
      requirements: { wis: 14, alignment: "Deity-dependent" },
      benefits: "Access to additional spheres. Deity-specific granted power.",
      hindrances: "Must follow deity's ethos. Restricted spheres. May have weapon/armor restrictions."
    },
    fightingcleric: {
      name: "Fighting Cleric",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Warrior Priest", notes: "Combat-focused divine servant" },
        { name: "Weapon Mastery", notes: "Extra weapon proficiency slot at 1st level" }
      ],
      requirements: { str: 14, wis: 14, alignment: "Any" },
      benefits: "THAC0 improves as fighter. Can specialize in one weapon.",
      hindrances: "Reduced spell progression (one less spell per level). Cannot turn undead."
    },
    monk: {
      name: "Monk",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Martial Arts", notes: "Improved unarmed combat" },
        { name: "Stunning Fist", notes: "Can stun opponents with unarmed attacks" },
        { name: "Unarmored Defense", notes: "AC bonus when unarmored" }
      ],
      requirements: { str: 13, dex: 15, wis: 15, alignment: "Lawful" },
      benefits: "Improved AC (starts at 10, improves with level). Improved movement rate. Evasion.",
      hindrances: "Cannot wear armor. Cannot use shields. Limited weapons (staff, club, crossbow). Must follow strict discipline."
    },
    pacifist: {
      name: "Pacifist Priest",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Aura of Peace", notes: "Enemies must save or be unable to attack" },
        { name: "Enhanced Healing", notes: "Cure spells heal +2 HP per die" }
      ],
      requirements: { wis: 16, cha: 14, alignment: "Any good" },
      benefits: "+2 to all healing spells. Turn undead as 2 levels higher.",
      hindrances: "Cannot attack or cause harm. Cannot use edged weapons. Must flee from combat."
    },
    scholar: {
      name: "Scholar Priest",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Lore Keeper", notes: "+4 to knowledge checks" },
        { name: "Research", notes: "Can research new spells and religious knowledge" }
      ],
      requirements: { int: 14, wis: 14, alignment: "Any" },
      benefits: "Read/write all languages. Free research proficiencies. Extra proficiency slots.",
      hindrances: "Poor combat abilities (-2 to hit). Must spend time studying. Physically weak."
    },
    crusader: {
      name: "Crusader",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Holy Warrior", notes: "Combines faith and martial prowess" },
        { name: "Smite Evil", notes: "Once per day, +4 to hit and damage vs evil" }
      ],
      requirements: { str: 14, wis: 14, alignment: "Any good" },
      benefits: "THAC0 improves as fighter. Can wear all armor. Rally allies (+1 morale).",
      hindrances: "Must crusade against evil. Reduced spell access (one less spell). Tithe 30%."
    },
    undeadslayer: {
      name: "Undead Slayer",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Turn Undead Enhancement", notes: "Turn undead as 3 levels higher" },
        { name: "Detect Undead", notes: "Detect undead at 60 ft radius" }
      ],
      requirements: { wis: 15, alignment: "Any good" },
      benefits: "+2 to hit vs undead. Immune to energy drain. Destroy undead on turning.",
      hindrances: "Must hunt and destroy undead. Disturbing presence (-1 reaction with living)."
    },
    missionary: {
      name: "Missionary",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Convert Followers", notes: "+4 to convince others to join faith" },
        { name: "Inspire Faith", notes: "Grant temporary morale/save bonuses to converts" }
      ],
      requirements: { wis: 14, cha: 15, alignment: "Any" },
      benefits: "+3 reaction with potential converts. Learn languages easily. Extra followers.",
      hindrances: "Must spread faith actively. Cannot refuse aid to converts. Give away 50% of treasure."
    },
    prophet: {
      name: "Prophet",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Divine Visions", notes: "Receive visions from deity" },
        { name: "Prophecy", notes: "Can cast augury 3/day" }
      ],
      requirements: { wis: 17, cha: 14, alignment: "Any" },
      benefits: "Access to divination sphere. +2 to saves vs illusion/enchantment.",
      hindrances: "Visions can be disturbing. Must share prophecies. Seen as touched/mad (-2 reaction)."
    },
    healer: {
      name: "Healer",
      class: "cleric",
      source: {
        status: "unverified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Healing Touch", notes: "All healing spells heal maximum HP" },
        { name: "Lay on Hands", notes: "Heal 2 HP per level, once per day" }
      ],
      requirements: { wis: 16, cha: 14, alignment: "Any good" },
      benefits: "Free healing proficiency. Immunity to disease. Cure disease at 1st level.",
      hindrances: "Cannot cause harm (no damage spells). Must help all injured. Limited spell access."
    }
  },

  // ========== DRUID KITS ==========
  druid: {
    avenger: {
      name: "Avenger",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Nature's Wrath", notes: "Can cast offensive spells neutrals cannot" },
        { name: "Trackless Step", notes: "Leave no trail in natural terrain" }
      ],
      requirements: { wis: 15, alignment: "Neutral" },
      benefits: "Access to combat spells. +2 to tracking despoilers of nature.",
      hindrances: "Must hunt those who harm nature. -2 reaction with civilized folk."
    },
    beastfriend: {
      name: "Beastfriend",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Animal Companion", notes: "Permanent animal companion at 1st level" },
        { name: "Speak with Animals", notes: "At will" }
      ],
      requirements: { wis: 14, cha: 14, alignment: "Neutral" },
      benefits: "+4 to animal friendship. Animals never attack unless threatened. Extra animal followers.",
      hindrances: "Limited shapechange (only into companion's form). Must protect animals."
    },
    shapeshifter: {
      name: "Shapeshifter",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Enhanced Shapechange", notes: "Shapechange at 5th level (2 levels early)" },
        { name: "Additional Forms", notes: "Can learn additional animal forms" }
      ],
      requirements: { wis: 15, con: 14, alignment: "Neutral" },
      benefits: "Extra shapechange uses per day. Can remain in form longer.",
      hindrances: "Risk of losing humanity. Reduced spellcasting (-1 spell per level)."
    },
    lostdruid: {
      name: "Lost Druid",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Survivor", notes: "+4 to wilderness survival" },
        { name: "Primal Instinct", notes: "Enhanced senses and awareness" }
      ],
      requirements: { wis: 14, alignment: "Neutral" },
      benefits: "Never get lost. +2 to surprise rolls. Improved tracking.",
      hindrances: "Distrusts civilization. Difficulty with social interaction (-2 reaction)."
    },
    hivemaster: {
      name: "Hivemaster",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Insect Control", notes: "Command insects within 60 ft" },
        { name: "Swarm Form", notes: "Shapechange into insect swarm" }
      ],
      requirements: { wis: 14, con: 13, alignment: "Neutral" },
      benefits: "Immunity to insect-based attacks. Insect plague improved. Speak with insects.",
      hindrances: "Unsettling presence with insects (-2 reaction). Limited normal shapechange."
    },
    guardian: {
      name: "Guardian",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Grove Defender", notes: "Enhanced abilities in home grove" },
        { name: "Territorial Awareness", notes: "Sense disturbances in protected area" }
      ],
      requirements: {
        wis: 15,
        alignment: "Neutral",
        terrain: ["forest","hill","jungle","mountain","plains"],
        terrainPrinted: "Forest, Hill, Jungle, Mountain, or Plains"
      },
      benefits: "+2 to all rolls in home territory. Allies get +1 to saves. Plant growth improved.",
      hindrances: "Must remain in territory. Weakened when far from grove (-2 to all rolls)."
    },
    outlaw: {
      name: "Outlaw",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Forest Guerrilla", notes: "Ambush and stealth in wilderness" },
        { name: "Robin Hood Tactics", notes: "+2 to hit with missile weapons in forests" }
      ],
      requirements: { dex: 13, wis: 14, alignment: "Neutral" },
      benefits: "Hide in shadows and move silently in wilderness. +2 to surprise.",
      hindrances: "Wanted by authorities. Cannot own property. Must share wealth with poor."
    },
    villagedruid: {
      name: "Village Druid",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Community Leader", notes: "+3 reaction with rural folk" },
        { name: "Blessing", notes: "Can bless crops and animals" }
      ],
      requirements: { wis: 14, cha: 13, alignment: "Neutral" },
      benefits: "Free agriculture/brewing proficiencies. Enhanced healing in home village.",
      hindrances: "Must serve community. Cannot adventure freely. Reduced combat abilities."
    },
    wanderer: {
      name: "Wanderer",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Nomadic", notes: "Enhanced abilities while traveling" },
        { name: "Weather Sense", notes: "Predict weather 24 hours ahead" }
      ],
      requirements: { wis: 14, alignment: "Neutral" },
      benefits: "Never surprised outdoors. +2 to navigation. Party travels 20% faster.",
      hindrances: "Cannot settle in one place. Must keep moving. No stronghold at high level."
    },
    desertdruid: {
      name: "Desert Druid",
      class: "druid",
      source: {
        status: "unverified",
        work:   "PHBR13 The Complete Druid's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Desert Adaptation", notes: "Immune to heat exhaustion" },
        { name: "Water Finding", notes: "Locate water sources automatically" }
      ],
      requirements: { con: 14, wis: 14, alignment: "Neutral" },
      benefits: "+4 to survival in deserts. Require half normal water. Resist fire.",
      hindrances: "Reduced abilities in non-desert terrain. Uncomfortable in cold/wet climates."
    }
  },

  // ========== MAGE KITS ==========
  mage: {
    wildmage: {
      name: "Wild Mage",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Wild Surge", notes: "Spells can trigger wild magic surges" },
        { name: "Chaos Magic", notes: "Can manipulate probability" }
      ],
      requirements: { int: 15, alignment: "Chaotic" },
      benefits: "+1 to spell level for wild surge. Can cast Nahal's Reckless Dweomer.",
      hindrances: "5% chance of wild surge on every spell. Unpredictable results."
    },
    academician: {
      name: "Academician",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Scholar", notes: "+3 to knowledge checks" },
        { name: "Research", notes: "Can research spells at half cost/time" }
      ],
      requirements: { int: 16, alignment: "Any" },
      benefits: "Start with extra spells in spellbook. +1 proficiency slot. Free reading/writing.",
      hindrances: "Must study constantly. Poor combat skills (-2 to hit). Weak physically."
    },
    militantwizard: {
      name: "Militant Wizard",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Battle Mage", notes: "Trained in combat magic" },
        { name: "Weapon Training", notes: "Can use one additional weapon type" }
      ],
      requirements: { int: 14, con: 13, alignment: "Any" },
      benefits: "Can wear light armor. Extra weapon proficiency. THAC0 improves faster.",
      hindrances: "Reduced spell progression (-1 spell per level). Must serve military."
    },
    mystic: {
      name: "Mystic",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Inner Power", notes: "Enhanced meditation and mental discipline" },
        { name: "Mental Fortress", notes: "+2 to saves vs mental attacks" }
      ],
      requirements: { int: 14, wis: 15, alignment: "Any lawful" },
      benefits: "Bonus to concentration checks. Can enter trance for enhanced recovery.",
      hindrances: "Must meditate 2 hours daily. Limited material spell components."
    },
    witch: {
      name: "Witch",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Familiar Bond", notes: "Enhanced familiar abilities" },
        { name: "Hex", notes: "Can curse enemies (minor penalties)" }
      ],
      requirements: { int: 14, cha: 13, alignment: "Any" },
      benefits: "Familiar gains extra abilities. Brewing and herbalism bonuses. Charm spells enhanced.",
      hindrances: "Must have familiar. Society fears witches (-2 reaction). Limited spell selection."
    },
    anagakok: {
      name: "Anagakok",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Spirit Magic", notes: "Can communicate with spirits" },
        { name: "Shamanic Trance", notes: "Enter trance for visions" }
      ],
      requirements: { int: 14, wis: 14, alignment: "Any" },
      benefits: "Spirit allies. Enhanced divination. Cold resistance.",
      hindrances: "Limited spell selection (spirit/nature themed). Must perform rituals. Cultural restrictions."
    },
    spellfilcher: {
      name: "Spellfilcher",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Steal Spell", notes: "Can temporarily steal prepared spells from other casters" },
        { name: "Magic Analysis", notes: "+4 to identify magical effects" }
      ],
      requirements: { int: 15, dex: 13, alignment: "Any non-lawful" },
      benefits: "Can learn spells by observing them cast. Extra spell slots for stolen spells.",
      hindrances: "Cannot research own spells. Distrusted by other mages. Unstable stolen magic."
    },
    dimensionaltraveler: {
      name: "Dimensional Traveler",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Planar Attunement", notes: "Enhanced abilities on other planes" },
        { name: "Dimensional Step", notes: "Short-range teleport 1/day" }
      ],
      requirements: { int: 16, alignment: "Any" },
      benefits: "Teleportation spells improved. Can sense planar boundaries. Extra-planar knowledge.",
      hindrances: "Unstable on Prime Material (-1 to saves). Must travel frequently."
    },
    geometer: {
      name: "Geometer",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Spell Geometry", notes: "Enhanced area of effect control" },
        { name: "Precision Casting", notes: "Can sculpt spells to avoid allies" }
      ],
      requirements: { int: 16, alignment: "Any lawful" },
      benefits: "Area spells can exclude targets. +1 to spell save DCs. Improved metamagic.",
      hindrances: "Rigid casting requirements. Cannot improvise. Longer casting times."
    },
    wujen: {
      name: "Wu Jen",
      class: "mage",
      source: {
        status: "unverified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Elemental Mastery", notes: "Choose one element for specialization" },
        { name: "Taboo", notes: "Follow strict personal taboos for power" }
      ],
      requirements: { int: 15, wis: 14, alignment: "Any" },
      benefits: "+1 to spell level for chosen element. Elemental resistance. Enhanced elemental spells.",
      hindrances: "Must follow personal taboos. Limited spell selection. Cultural isolation."
    }
  },

  // ========== THIEF KITS ==========
  thief: {
    assassin: {
      name: "Assassin",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Assassination", notes: "Increased backstab damage multiplier" },
        { name: "Poison Use", notes: "Can use poisons without restriction" }
      ],
      requirements: { str: 12, dex: 12, int: 11, alignment: "Any evil" },
      benefits: "Backstab x3 at 1st level (improves faster). Poison expertise. +2 to disguise.",
      hindrances: "Evil alignment required. Hunted by law. Must accept assassination contracts."
    },
    bountyhunter: {
      name: "Bounty Hunter",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Track Quarry", notes: "Can track humanoids" },
        { name: "Capture Alive", notes: "+4 to subdue opponents" }
      ],
      requirements: { dex: 13, wis: 12, alignment: "Any" },
      benefits: "Tracking ability. Improved rope use. +2 to find/follow prey. Contacts in many cities.",
      hindrances: "Must take bounty contracts. Enemies among criminals. Complex legal issues."
    },
    acrobat: {
      name: "Acrobat",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Tumbling", notes: "+3 to jumping, tumbling, and acrobatic feats" },
        { name: "Defensive Roll", notes: "Can reduce falling damage" }
      ],
      requirements: { str: 12, dex: 16, alignment: "Any" },
      benefits: "Improved climb walls. No damage from falls under 30 ft. +2 AC when dodging.",
      hindrances: "Reduced pick pockets and open locks (-10%). Must practice daily."
    },
    spy: {
      name: "Spy",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Deep Cover", notes: "+4 to disguise and acting" },
        { name: "Information Network", notes: "Contacts in many locations" }
      ],
      requirements: { int: 13, cha: 12, alignment: "Any" },
      benefits: "Improved read languages. Forgery. +2 to gather information. Multiple identities.",
      hindrances: "Serve organization/nation. Dangerous work. If exposed, become hunted."
    },
    burglar: {
      name: "Burglar",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Security Expert", notes: "+10% to open locks and find traps" },
        { name: "Case the Joint", notes: "Can assess building security" }
      ],
      requirements: { dex: 14, int: 12, alignment: "Any non-lawful" },
      benefits: "+10% open locks, find/remove traps. Improved climb walls. Assess loot value.",
      hindrances: "Reduced backstab (-10%). Must specialize in theft. Thieves' guild obligations."
    },
    fence: {
      name: "Fence",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Appraisal", notes: "Accurately value any item" },
        { name: "Black Market Contacts", notes: "Can buy/sell illegal goods" }
      ],
      requirements: { int: 13, cha: 13, alignment: "Any non-lawful" },
      benefits: "+4 to appraise items. Contacts in criminal underworld. +20% to sell stolen goods.",
      hindrances: "Reduced thieving skills (-10% to most). Must maintain shop. Guild obligations."
    },
    cutpurse: {
      name: "Cutpurse",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Master Pickpocket", notes: "+15% to pick pockets" },
        { name: "Blend In Crowd", notes: "+10% to hide in shadows in urban areas" }
      ],
      requirements: { dex: 16, alignment: "Any non-lawful" },
      benefits: "+15% pick pockets. Can steal during conversation. Crowd tactics.",
      hindrances: "Reduced other skills (-5%). Must work crowds. Guild obligations."
    },
    smuggler: {
      name: "Smuggler",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Secret Routes", notes: "Know hidden paths and smuggling routes" },
        { name: "Contraband Expert", notes: "Hide items from detection" }
      ],
      requirements: { int: 12, wis: 11, alignment: "Any" },
      benefits: "Contacts in ports. +4 to navigation. +4 to hide/detect contraband.",
      hindrances: "Hunted by authorities. Must make smuggling runs. Dangerous enemies."
    },
    buccaneer: {
      name: "Buccaneer",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Sea Legs", notes: "No penalties on ships" },
        { name: "Boarding Action", notes: "+2 to hit during ship combat" }
      ],
      requirements: { str: 13, dex: 13, alignment: "Any non-lawful" },
      benefits: "Sailing expertise. Swimming. +2 to hit with cutlass. Fearsome reputation.",
      hindrances: "Must be on/near water. Hunted by navies. Must crew ship."
    },
    adventurer: {
      name: "Adventurer",
      class: "thief",
      source: {
        status: "unverified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Jack of All Trades", notes: "Versatile skill selection" },
        { name: "Lucky", notes: "Once per day, reroll any failed check" }
      ],
      requirements: { dex: 13, alignment: "Any" },
      benefits: "Balanced thieving skills. Bonus proficiency slots. Good reaction (+1).",
      hindrances: "No skill bonuses. No specialization. Must seek adventure."
    }
  },

  // ========== BARD KITS ==========
  bard: {
    blade: {
      name: "Blade",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Offensive Spin", notes: "+2 to hit, +2 damage for 1 round" },
        { name: "Defensive Spin", notes: "-2 AC, immune to backstab for 1 round" }
      ],
      requirements: { str: 13, dex: 15, alignment: "Any" },
      benefits: "Weapon specialization. Combat-focused. Can use offensive/defensive spins.",
      hindrances: "Reduced pick pockets (-20%). Fewer spells (-1 per level). Must perform."
    },
    jester: {
      name: "Jester",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Jest", notes: "Confuse enemies with antics" },
        { name: "Taunt", notes: "Enrage opponents to attack jester" }
      ],
      requirements: { int: 13, cha: 15, alignment: "Any non-lawful" },
      benefits: "Improved reaction from crowds. Can use humor to defuse situations. Charm spells enhanced.",
      hindrances: "Not taken seriously (-2 reaction with authorities). Must entertain. Unpredictable."
    },
    gallant: {
      name: "Gallant",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Heroic Inspiration", notes: "+1 to ally attack rolls within 30 ft" },
        { name: "Courtly Grace", notes: "+3 to etiquette and courtly knowledge" }
      ],
      requirements: { str: 13, cha: 15, alignment: "Any good" },
      benefits: "+2 reaction in noble circles. Free etiquette proficiency. Charm person enhanced.",
      hindrances: "Code of honor. Must aid those in distress. Reduced thieving skills (-10%)."
    },
    jongleur: {
      name: "Jongleur",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Juggling", notes: "+4 to juggling and sleight of hand" },
        { name: "Street Performance", notes: "Enhanced busking ability" }
      ],
      requirements: { dex: 15, cha: 13, alignment: "Any" },
      benefits: "+10% pick pockets. Enhanced performances. +2 to earn money performing.",
      hindrances: "Lower class reputation. -2 reaction with nobles. Must perform regularly."
    },
    loremaster: {
      name: "Loremaster",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Extensive Knowledge", notes: "+5 to all knowledge checks" },
        { name: "Research", notes: "Can research lore in half the time" }
      ],
      requirements: { int: 15, alignment: "Any" },
      benefits: "Start with extra lore. +2 proficiency slots. Free reading/writing all languages.",
      hindrances: "Reduced performance ability. Poor combat skills. Must study constantly."
    },
    meistersinger: {
      name: "Meistersinger",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Perfect Pitch", notes: "Enhanced bardic music effects" },
        { name: "Master Musician", notes: "+3 to music proficiency" }
      ],
      requirements: { dex: 13, cha: 15, alignment: "Any" },
      benefits: "Bardic music affects +2 HD of creatures. Extended duration. Counter song improved.",
      hindrances: "Must maintain instrument. Guild obligations. Reduced thief skills (-10%)."
    },
    minstrel: {
      name: "Minstrel",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Tale Teller", notes: "Stories grant temporary bonuses to listeners" },
        { name: "Wanderer", notes: "Always welcome at inns and taverns" }
      ],
      requirements: { cha: 15, alignment: "Any" },
      benefits: "+3 reaction with common folk. Free room and board. Gather rumors easily.",
      hindrances: "Must travel constantly. Cannot settle down. Must share news/tales."
    },
    riddlemaster: {
      name: "Riddlemaster",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Riddles", notes: "Can confuse enemies with riddles" },
        { name: "Puzzle Solving", notes: "+4 to solve riddles and puzzles" }
      ],
      requirements: { int: 15, cha: 13, alignment: "Any" },
      benefits: "Confusion spells enhanced. +2 to saves vs illusion. Detect lies improved.",
      hindrances: "Speaks in riddles (annoys people). Must answer riddles. Compulsive puzzler."
    },
    skald: {
      name: "Skald",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Battle Song", notes: "Grant allies +1 to hit and morale in combat" },
        { name: "Warrior Poet", notes: "Enhanced combat abilities" }
      ],
      requirements: { str: 13, con: 13, cha: 14, alignment: "Any non-lawful" },
      benefits: "THAC0 as fighter. Battle songs more effective. +2 to intimidate.",
      hindrances: "Reduced spellcasting. Must recount glorious deeds. Seek glory in battle."
    },
    herald: {
      name: "Herald",
      class: "bard",
      source: {
        status: "unverified",
        work:   "PHBR7 The Complete Bard's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Diplomatic Immunity", notes: "Protected while delivering messages" },
        { name: "Heraldry", notes: "Know all noble houses and their symbols" }
      ],
      requirements: { int: 13, cha: 15, alignment: "Any lawful" },
      benefits: "+4 reaction with nobility. Free etiquette. Protected by law when serving as herald.",
      hindrances: "Must serve a lord or organization. Bound by diplomatic protocol. Cannot refuse messages."
    }
  }
};

// Helper function to get available kits for a class
function getKitsForClass(className) {
  if (!className) return [];
  const lowerClass = className.toLowerCase();
  
  // Check for direct match
  if (KITS[lowerClass]) {
    return Object.values(KITS[lowerClass]);
  }
  
  // Check for partial matches
  for (let classKey in KITS) {
    if (lowerClass.includes(classKey)) {
      return Object.values(KITS[classKey]);
    }
  }
  
  return [];
}

// Helper function to get a specific kit
function getKit(className, kitName) {
  const kits = getKitsForClass(className);
  return kits.find(k => k.name.toLowerCase() === kitName.toLowerCase());
}