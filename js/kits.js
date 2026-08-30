// === Character Kits (AD&D 2E) ===
//
// Kit data structure:
// - name:         Kit name
// - class:        Base class required
// - source:       Provenance of this entry -- see PROVENANCE below
// - abilities:    Special kit abilities, painted into the Kit Abilities list
// - reaction:     Encounter-reaction adjustments -- see reaction below
// - variants:     Per-race or per-orientation overrides -- see variants below
// - proficiencies: Weapon / nonweapon proficiency rules -- see PROFICIENCIES below
// - reaction:     Encounter-reaction adjustments -- see reaction below
// - variants:     Per-race or per-orientation overrides -- see variants below
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
//   thiefSkillMods: { hideInShadows: 10, moveSilently: 10 }          // ranger
//   thiefSkillMods: { pickPockets: 10, openLocks: -5, findTraps: -5,  // thief
//                     moveSilently: 0, hideInShadows: 5, detectNoise: 0,
//                     climbWalls: 0, readLanguages: -5 }
//
// PERCENTAGE POINTS. 0 means the book prints "--" (no adjustment). NULL means
// the kit has no such ability at all -- only the Sea Ranger, who has neither,
// and whose entry carries a `note` saying so. A null must NOT be treated as
// zero. ABSENT keys mean the book adjusts only the skills it lists: ranger kits
// carry two, thief kits all eight.
//
// WIDENED FOR PHBR2, August 2026, exactly as this comment previously instructed
// ("widen the shape rather than adding a second field"). Ranger values come from
// PHBR11 Table 12 p.11 and feed getRangerStealth(); THIEF values come from PHBR2
// TABLE 4 p.24 and are a PRE-DISCRETIONARY term.
//
// TABLE 5 (p.25) FIXES THE ORDER: base score -> racial adj -> Dexterity adj ->
// KIT ADJ -> total base skill, and discretionary points are spent on top of that
// total. Urlar's worked example ends with Read Languages at -5%, so THE
// PRE-DISCRETIONARY VALUE MUST NOT BE CLAMPED AT ZERO.
//
// FOOTNOTED ZEROS ARE NOT IN THIS FIELD. Table 4 prints a dash with a footnote
// for three conditional bonuses, all of which live in `abilities` instead:
// Assassin and Bounty Hunter get +5% on a PICK POCKETS roll when slipping a
// substance into food or drink and NOWHERE ELSE (note 3); the Bandit gets +5%
// MOVE SILENTLY in the wilderness (note 4). The Scout's +10% wilderness stealth
// and -5% city penalty are likewise situational and live in `abilities`.
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
//     weapon:    { bonus, bonusChoice, required, requiredChoice,
//                  requiredChoiceGroups, recommended, recommendedGroups,
//                  allowed, allowedGroups, barred, barredGroups,
//                  allowedScope, barredScope, allowedPrinted, note },
//     nonweapon: { bonus, bonusChoice, required, recommended, allowed,
//                  barred, allowedScope, barredScope, allowedPrinted, note }
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
// GROUP-VALUED SIBLINGS. A book constantly writes "bow (any)" or "axe (any)",
// which names a GROUP rather than a weapon. Each such phrase is carried in the
// group field matching the relationship the sentence expressed:
//
//   recommendedGroups  flavour, exactly like recommended
//   allowedGroups      widens the whitelist -- UNION with allowed, not a
//                      separate list
//   barredGroups       widens the blacklist
//
// Groups resolve against WEAPON_GROUP_ORDER (tables.js) and exist on the WEAPON
// block only; no book has yet restricted nonweapon proficiencies by category.
//
// DO NOT PUT A RECOMMENDATION IN allowedGroups. This was the original mistake
// and it was invisible, because the field name reads as permission whichever
// list the phrase came from. The Barbarian's "Bow (any)" and the Beast-Rider's
// "Lance (any)" are both from RECOMMENDED lists -- neither kit restricts weapons
// at all -- and filed as allowedGroups they made a resolver grey out every
// weapon but one group for two kits that may carry anything. Read which SENTENCE
// the phrase came out of, not which words it contains.
//
// SCOPE -- when a restriction stops applying.
//
//   allowedScope / barredScope: "creation"
//
// Books restrict at two different times and say so plainly: "INITIALLY limited
// to", "must choose his INITIAL weapon proficiencies", "may not START OUT PLAY
// having" are creation-time; "Confined to", "Limited to", "becomes proficient
// ONLY with", "can NEVER use" are for life. OMIT the key for the permanent case,
// per Rule 1 -- absence means permanent, which is the stricter reading and the
// commoner one.
//
// THE TWO SCOPES ARE SEPARATE FIELDS because one kit needs them to differ. The
// Seeker's allow-list governs only his single 1st-level slot while his sword
// prohibition is absolute, so a single scope on the block could not state him.
//
// A consumer that greys a weapon must check scope before it does. Greying a
// battle axe for a 7th-level Mountain Man is wrong: he was limited when he was
// built and is not limited now.
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
//    does that, record both, give each its own scope field, and say so in note.
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
//                  weapon slot must be a missile weapon. He carries NO weapon
//                  group field for exactly this reason -- see his note.
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
// requiredChoice / requiredChoiceGroups -- a required pick from a set
// ---------------------------------------------------------------------------
//
//   required:             ["Cutlass"],
//   requiredChoice:       [["Belaying Pin", "Gaff/Hook, Held"]],
//   requiredChoiceGroups: ["Lance", "Sword"]
//
// The PAID mirror of bonusChoice. `required` is "the kit forces a slot onto THIS
// proficiency"; requiredChoice is "the kit forces a slot onto ONE OF these".
// Array of groups, one pick from each, exactly like bonusChoice.
//
// requiredChoiceGroups is for when the book names a CATEGORY rather than a list
// -- "Lance (any; player choice)", "Sword (any; player choice)". Stored as the
// group for the same reason as allowedGroups: the weapon list is open, so
// resolving "any sword" to today's six sword records would silently exclude the
// seventh when a later book is audited.
//
// WHY THIS WAS BUILT. Four kits previously had a single name sitting in
// `required` where the book offers a choice, because a choice had to resolve to
// SOMETHING. That is worse than a blank: it invents a pick the book leaves to the
// player and states it as a mandate. The Cavalier claimed to require a LONG sword
// where the book says any; the Noble Warrior's three separate either-ors were
// flattened to one arbitrary name; the Pirate's coin-flip between belaying pin
// and gaff/hook was printed as a requirement; the Pathfinder's requirement was
// invisible to the app entirely.
//
//   RECORD A BLANK RATHER THAN AN INVENTED ANSWER. A missing field is honest and
//   a consumer can see it is missing. A plausible wrong value is neither.
//
// ---------------------------------------------------------------------------
// variants -- per-race or per-orientation overrides of the kit's own values
// ---------------------------------------------------------------------------
//
//   variants: {
//     axis:        "orientation",
//     axisPrinted: "...the book's own wording...",
//     default:     null,
//     options: [ { key, label, proficiencies?, note } ]
//   }
//
// Some kits are ONE kit in the book that BRANCHES. PHBR1's Pirate/Outlaw prints a
// single entry with one Description and one Role, then splits four mechanical
// fields and labels the sub-blocks "Pirate's" and "Outlaw's" outright. The Amazon
// does the same on race: dwarf, gnome and halfling Amazons have different
// required weapons and different bonus nonweapon proficiencies from the human.
//
// An option's `proficiencies` OVERRIDES the kit's own block for the sections it
// names; sections it omits are inherited. The Amazon's dwarf option replaces only
// the weapon block, so the human bonus nonweapon proficiencies still apply; her
// gnome option replaces both.
//
// `default` IS THE LOAD-BEARING FIELD. It distinguishes two genuinely different
// situations that would otherwise look identical:
//
//   default: "human"  -- the book gives one option as the working default and the
//                        rest as overrides. A player who ignores the axis still
//                        gets a correct character. (Amazon.)
//   default: null     -- neither option is the fallback and the choice is
//                        MANDATORY. A player who ignores the axis has an
//                        incoherent character. (Pirate/Outlaw.)
//
// NOTE WHAT WAS NOT DONE. Pirate/Outlaw was nearly split into two kits, which
// would have invented a fifteenth kit the book does not have, in order to work
// around a shape our schema could not hold. Splitting where the MECHANICS split
// rather than where the BOOK splits is backwards; the book is the authority on
// what a kit is. If a future entry genuinely is two kits, the book will print two
// headings.
//
// STILL PROSE, awaiting a second book: p.13 says the Noble Dwarf-Warrior is
// required to be proficient with axe and hammer rather than sword and lance and
// is not required to be a rider. That is a third variant axis on a third kit and
// will almost certainly want this same block.
//
// ---------------------------------------------------------------------------
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
            "SPECIALIZATION: Amazon fighters can Specialize ONLY in Spear or Long Bow. The book prints \"various axes, swords\" without naming them -- the recommended list here is the resolvable reading and is NOT a verbatim transcription. RACIAL VARIANTS are in the `variants` block above."
        },
        nonweapon: {
          bonus: ["Riding, Land-Based", "Animal Training"],
          recommended: [
            "Animal Handling", "Animal Lore", "Armorer", "Bowyer/Fletcher", "Hunting", "Running",
            "Survival", "Tracking"
          ],
          note:
            "CROSSOVER COST: the book tags Animal Lore, Armorer, Bowyer/Fletcher, Hunting, Running, Survival and Tracking as Warrior-group entries and Animal Handling as General. Racial variants are in the `variants` block above."
        }
      },
      variants: {
        axis: "race",
        axisPrinted:
          "The Amazons from folklore and myth were humans. It is not difficult to envision elvish or half-elvish clans of Amazons either; they would follow the rules above for human Amazons. It is a little harder to envision dwarvish, gnomish, or halfling Amazons. But if you do use such civilizations:",
        default: "human",
        options: [
          { key: "human", label: "Human, elf or half-elf",
            note: "Follows the kit's own values above with no changes." },
          { key: "dwarf", label: "Dwarf",
            proficiencies: {
              weapon: {
                required: ["Battle Axe", "War Hammer"],
                allowedPrinted:
                  "Dwarf Amazons will have Axe and Hammer as their required weapon proficiencies",
                note:
                  "The book names the categories, not specific weapons; Battle Axe and War Hammer are the resolvable reading."
              }
            },
            note: "Still Riders, but substitute SWINE for their mount of choice -- swine are very dangerous, and the prospect of a ferocious she-dwarf on the back of a biting boar is a daunting one. Bonus nonweapon proficiencies are unchanged." },
          { key: "gnome", label: "Gnome",
            proficiencies: {
              weapon: {
                required: ["Hand Axe", "Sword, Short"],
                allowedPrinted:
                  "Gnome Amazons will have Throwing Axe and Short Sword as their required weapon proficiencies",
                note:
                  "The book's \"Throwing Axe\" is the PHB's single line \"Axe, Hand or Throwing\", which is Hand Axe here."
              },
              nonweapon: {
                bonus: ["Tracking", "Survival"]
              }
            },
            note: "Replaces both the required weapons AND both bonus nonweapon proficiencies." },
          { key: "halfling", label: "Halfling",
            proficiencies: {
              weapon: {
                required: ["Javelin", "Sling"],
                allowedPrinted:
                  "Halfling Amazons will have Javelin and Sling as their required weapon proficiencies"
              },
              nonweapon: {
                bonus: ["Endurance", "Set Snares"]
              }
            },
            note: "Replaces both the required weapons AND both bonus nonweapon proficiencies. You will have to presume that these halflings are not as fond of ease and leisure as the more common sorts of halflings." }
        ]
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
          recommendedGroups: ["Bow"],
          allowedPrinted:
            "Required: Battle Axe, Bastard Sword. These are the classical fiction-barbarian weapons; the DM may decide to substitute others more appropriate to his own world. Recommended: Bow (any), Sling, Sword (any), War Hammer.",
          note:
            "SPECIALIZATION: Barbarian fighters may specialize in any weapon, but are not likely to encounter unusual weapons (lances, quarterstaves, flails, peculiar polearms) until they reach the outer world. \"Bow (any)\" and \"Sword (any)\" are group phrasings from the RECOMMENDED list; the swords resolvable from core_wp.json are listed and the bows are carried in recommendedGroups. THE BARBARIAN HAS NO WEAPON RESTRICTION AT ALL -- nothing here is an allow-list."
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
          recommendedGroups: ["Lance"],
          allowedPrinted:
            "Required: None. Recommended: all the weapons commonly associated with mounted warriors -- Bow (composite short, and short), Horseman's flail, Horseman's mace, Horseman's pick, Lance (any, according to the size of the animal), Spear, Bastard Sword, Long Sword.",
          note:
            "Lance is recommended \"any, according to the size of the animal\" and is carried in recommendedGroups rather than resolved to one of the four Lance records. THE BEAST-RIDER HAS NO WEAPON RESTRICTION AT ALL -- required is None and everything here is recommendation."
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
          barredScope: "creation",
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
          recommended: [
            "Sword, Bastard", "Sword, Broad", "Sword, Short", "Sword, Two-Handed", "Scimitar",
            "Flail, Horseman's", "Mace, Horseman's", "Pick, Horseman's", "Dagger", "Spear",
            "Javelin"
          ],
          requiredChoiceGroups: ["Lance", "Sword"],
          allowedPrinted:
            "Required: Lance (any; player choice) and Sword (any; player choice). Recommended: All other Lances, all other Swords, all Horsemen's weapons, Dagger, Spear, Javelin.",
          note:
            "Both required entries are player choices from a whole category -- \"Lance (any; player choice) and Sword (any; player choice)\" -- so they are carried as requiredChoiceGroups rather than resolved to specific weapons, which would invent a pick the book leaves open."
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
          requiredChoice: [["Sword, Long", "Sword, Bastard"], ["Flail, Horseman's", "Mace, Horseman's"]],
          requiredChoiceGroups: ["Lance"],
          allowedPrinted:
            "Unless the campaign deals with a culture unlike medieval Europe, all Noble Warriors must take the following proficiencies: long sword or bastard sword (player choice), lance (player choice of type, usually jousting lance), and horseman's flail or horseman's mace (player choice). The last proficiency may be used for a weapon of the warrior's choice or to specialize in one of the required choices.",
          note:
            "All three required entries are player choices -- long sword OR bastard sword, a lance of any type, and horseman's flail OR horseman's mace. The third may instead be spent on a weapon of the warrior's choice, or on specializing in one of the first two. RACIAL VARIANT, not yet structured: p.13 states the Noble Dwarf-Warrior is required to be proficient with axe and hammer rather than sword and lance, and is not required to be a rider. That is the same shape as the Amazon's variants and wants the same treatment when a second book confirms it."
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
        note:   "No ability-score requirements. ONE KIT WITH TWO ORIENTATIONS. The book prints a single Pirate/Outlaw entry with one Description and one Role, then BRANCHES four mechanical fields, labelling the sub-blocks \"Pirate's\" and \"Outlaw's\" outright. Carried in `variants` with no default, because neither orientation is the fallback -- a character with no orientation chosen is not a valid Pirate/Outlaw."
      },
      variants: {
        axis: "orientation",
        axisPrinted:
          "In a campaign, the pirate or outlaw can belong to one of two orientations. Either he is a \"good guy\" and it is the law and the rulers who are evil, or he is a \"bad guy\" and simply takes what he wants from those who have it.",
        default: null,
        options: [
          { key: "pirate", label: "Pirate",
            proficiencies: {
              weapon: {
                required: ["Cutlass"],
                requiredChoice: [["Belaying Pin", "Gaff/Hook, Held", "Gaff/Hook, Attached"]],
                allowedPrinted:
                  "If the character is a Pirate, he must take the following proficiencies: Cutlass, and Belaying Pin or Gaff/Hook (player choice).",
                note:
                  "Cutlass, Belaying Pin and Gaff/Hook are all flagged in the book as new weapons found in the Equipment chapter, and all three are among the eight PHBR1 weapons reprinted in CRH Table 58. Gaff/Hook has two records here, Attached and Held; the single proficiency covers both."
              },
              nonweapon: {
                bonus: ["Rope Use", "Seamanship"],
                recommended: [
                  "Swimming", "Weather Sense", "Navigation", "Engineering", "Reading/Writing",
                  "Appraising", "Set Snares", "Tightrope Walking", "Tumbling"
                ],
                note:
                  "CROSSOVER COST: General -- Swimming, Weather Sense. Warrior -- Navigation. Priest, double slots unless Paladin -- Engineering (for shipbuilding), Reading/Writing (for mapmaking). Rogue, double slots -- Appraising, Set Snares (in association with Rope Use skill), Tightrope Walking, Tumbling. Wizard, double slots unless Ranger -- Engineering (for shipbuilding), Reading/Writing (for mapmaking). Engineering and Reading/Writing are each listed twice under two groups at different costs; transcribed as printed. SPECIAL NOTE: the DM may be a fan of the very acrobatic pirate movies of the past and prefer that Tumbling be one of the Bonus Proficiencies instead of one of those listed."
              }
            },
            note: "SECONDARY SKILL: roll d100 -- 01-70 Sailor, 71-80 Shipwright, 81-00 Navigator. EQUIPMENT: it would be foolish to buy metal armor of any kind; a Pirate wearing it in naval combat will inevitably fall overboard and sink, and if he is lucky enough to get it off so he can swim, he has lost the armor." },
          { key: "outlaw", label: "Outlaw",
            proficiencies: {
              weapon: {
                recommended: ["Long Bow", "Sword, Long", "Quarterstaff"],
                allowedPrinted:
                  "If the character is an Outlaw, he can take any weapon proficiencies he chooses ... but the DM, if he has created this campaign so that the outlaws have a special motif weapon (such as Robin Hood's Merry Men and their longbows), may insist that all Outlaw characters take a specific weapon proficiency. Recommended to classic Merry Man-type outlaws: longbow, long sword and quarterstaff.",
                note:
                  "THE OUTLAW HAS NO REQUIRED WEAPON PROFICIENCIES. The motif weapon is a per-campaign DM decision, not a list."
              },
              nonweapon: {
                bonus: ["Direction Sense", "Fire-Building"],
                recommended: [
                  "Riding, Land-Based", "Animal Lore", "Bowyer/Fletcher", "Endurance", "Hunting",
                  "Running", "Set Snares", "Survival", "Tracking", "Healing", "Herbalism",
                  "Local History", "Disguise"
                ],
                note:
                  "CROSSOVER COST: General -- Riding (Land-Based). Warrior -- Animal Lore, Bowyer/Fletcher, Endurance, Hunting, Running, Set Snares, Survival, Tracking. Priest, double slots unless Paladin -- Healing, Herbalism, Local History. Rogue, double slots -- Disguise."
              }
            },
            note: "SECONDARY SKILL: the character may choose between Bowyer/Fletcher, Forester, Hunter, and Trapper/Furrier. EQUIPMENT: it would be foolish to buy metal armor of any kind; an Outlaw living out in the wild has his belongings exposed to the elements and metal armor quickly corrodes." }
        ]
      },
      abilities: [
        { name: "No Intrinsic Special Benefits",
          notes: "Pirates and Outlaws do not have any intrinsic special benefits, although the DM can bestow some campaign-based benefits on them if he chooses. In a powerful pirate city the PCs can trade their ill-gotten gains, a place where the law dares not enter; in a \"Merry Men\" type outlaw campaign, the heroes have the dubious benefit of knowing that they are on the right side if they can just oust the current rulers." },
        { name: "The Law Is Always After Them",
          notes: "The major problem with being an outlaw or pirate is that the law is always after the characters. Though the authorities do not have to put in an appearance in every single play-session, they are always out there, plotting against the heroes. Many of them are quite clever; they probably have more money, ships and men than the heroes, and they will continue to plague the heroes until the campaign is done." },
        { name: "Equipment: Metal Armor Is Impractical",
          notes: "EQUIPMENT: Pirates and Outlaws come from widely diverse backgrounds, so there is no real restriction on what they can buy with their starting money. However, it would be foolish for either type of character to buy metal armor of any kind (banded, brigandine, bronze plate, chain, field plate, full plate, plate mail, and ring mail). If a Pirate or Outlaw buys metal armor and keeps it stowed away for special occasions -- major land engagements, climactic battles -- that is fine, but if they wear it all the time the DM should continually take it away from them through accidents, rust and corrosion." },
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
          required: ["Katana", "Daikyu"],
          allowedPrinted:
            "The samurai and ronin start play with two free extra weapon proficiency slots. But of his six initial weapon proficiencies, five are chosen for him. The samurai and ronin must specialize in katana (samurai sword, two proficiency slots) and daikyu (samurai great bow, three proficiency slots). The samurai or ronin may spend his last proficiency slot as he chooses -- but only from among the samurai weapons listed in the Equipment chapter of this book. After the character is in play in another culture, he may become proficient in weapons of that culture.",
          note:
            "SLOT COUNT AND SLOT PATTERN, neither modelled: two FREE extra weapon slots, then five of the six initial slots are pre-spent -- Katana specialization costs two and Daikyu specialization costs three -- leaving exactly one free, which must come from the Equipment chapter's samurai weapons. SPECIALIZATION: both are mandatory specializations, not mere proficiencies. Daikyu was ADDED to core_wp.json during the Ch.5 pass; before that this requirement could not be expressed. Katana already existed but its values differ from PHBR1 p.95/119 and were NOT overwritten -- the book says its oriental weapons are a simplified conversion of Oriental Adventures, so ours are more likely OA's. See the PHBR notes."
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
        nonweapon: {
          required: ["Etiquette", "Tumbling"],
          recommended: ["Alertness", "Blind-fighting", "Disguise", "Fast-Talking", "Intimidation", "Jumping", "Navigation", "Riding, Land-Based", "Tightrope Walking", "Trailing"],
          note: "Navigation is printed \"(if seaborne; costs 2 slots)\" -- a per-kit, per-circumstance slot cost that no field models. Recorded here rather than lost."
        }
      },
      proficiencies: {
        weapon: {
          allowed: [
            "Club", "Dagger", "Dart", "Javelin", "Knife", "Quarterstaff", "Sling", "Spear",
          ],
          allowedGroups: ["Axe"],
          allowedScope: "creation",
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
          allowedScope: "creation",
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
          allowedPrinted: "The first weapon slot, and every odd slot thereafter, must be a missile weapon: bow (any), crossbow (any), sling, staff sling, or any melee weapon that can be hurled",
          note: "SLOT PATTERN, NOT AN ALLOW-LIST, AND DELIBERATELY CARRIES NO GROUP FIELD. Even-numbered slots may take any weapon, so no whitelist is true of this kit: an allowedGroups of bow/crossbow/sling would grey out every melee weapon for a character who may freely buy them. Recorded in prose until a consumer tracks slot PURCHASE ORDER, which nothing does. \"Any melee weapon that can be hurled\" is an open tail with no field either."
        },
        nonweapon: {
          allowed: [
            "Bowyer/Fletcher", "Cobbling", "Cooking", "Hunting", "Pottery",
            "Riding, Land-Based", "Running", "Seamstress/Tailor", "Swimming", "Weaving",
          ],
          allowedScope: "creation",
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
          allowedScope: "creation",
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
          requiredChoice: [["Machete", "Hand Axe"]],
          requiredChoiceGroups: ["Sword"],
          allowedPrinted: "Must fill an initial weapon slot with the machete, hand axe, or sword -- weapons useful for cutting away brush and clearing paths",
          note: "SLOT RULE: exactly ONE initial slot is constrained and every subsequent slot may be filled with any weapon, so this is a required CHOICE rather than an allow-list. \"Sword\" is left as a group because the book names the category, not a weapon."
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
          allowedScope: "creation",
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
    // ===================================================================
    // PHBR3 THE COMPLETE PRIEST'S HANDBOOK, Chapter 4 (pp.95-109).
    //
    // ALL TEN OF THIS BOOK'S KITS, transcribed from the book. The previous
    // contents of this block were ten UNVERIFIED entries of which only three
    // were PHBR3 kits at all; the audit is recorded in gsheets_phbr_notes.md.
    // Six were removed as not-kits -- "Priest of Specific Mythos" is the Ch.3
    // CLASS TYPE, "Crusader" is a Ch.5 PERSONALITY (p.110), "Healer" is a Ch.3
    // PRIESTHOOD, and "Fighting Cleric", "Undead Slayer" and "Missionary" appear
    // nowhere in the book as kits. `monk` was renamed `fightingmonk`.
    //
    // KITS ATTACH TO PRIESTS, NOT ONLY TO CLERICS. p.95: "most kits are allowed
    // to priests of most faiths." They live under `cleric` because that is where
    // the class keying puts them; a specialty priest is a cleric-chassis
    // character with a priesthood recorded under Specialty Priest.
    //
    // requirements.priesthood IS THE NEW GATING AXIS and it finally works: every
    // kit prints a BARRED line naming priesthoods, and sp_template_source now
    // carries a canonical label. `barredByCombat` and `barredByFaithType` gate on
    // sp_combat and sp_faith_type instead, for the kits that name a property
    // rather than a list.
    //
    // ONE KIT ONLY, EVER (p.109). A character may take one priest kit, may
    // abandon it, and may then NEVER take another. Multi- and dual-class priests
    // get one kit total, not one per class. Abandoning surrenders all benefits
    // and hindrances but KEEPS the bonus proficiencies -- they stop being
    // bonuses, and must be paid for out of the next slots earned.
    // ===================================================================

    amazonpriestess: {
      name: "Amazon Priestess",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "97-99",
        note:   "Transcribed from the book."
      },
      proficiencies: {
        weapon: {
          recommended: ["Spear", "Long Bow"],
          allowedPrinted: "Required: None. Recommended: Spear, long bow; if possible, various axes and swords",
          note: "An Amazon who cannot use spear and long bow will be looked down upon and will not command the respect of other priestesses -- Amazon warriors must know their use."
        },
        nonweapon: {
          required: ["Riding, Land-Based", "Animal Training"],
          recommended: ["Animal Handling", "Animal Lore", "Armorer", "Bowyer/Fletcher", "Hunting", "Running", "Survival", "Tracking"],
          note: "Riding (Land-Based) and Animal Training are BONUS proficiencies, granted free. Animal Handling is General; Animal Lore, Armorer, Bowyer/Fletcher, Hunting, Running, Survival and Tracking are Warrior-group."
        }
      },
      requirements: {
        gender: ["female"],
        priesthood: {
          barred: ["Disease", "Peace"],
          required: ["Community", "Competition", "Elemental Forces", "Good (Philosophy)", "Hunting", "Light", "Mischief, Trickery", "Moon", "Oracles, Prophecy", "Race (Human)", "Sky, Weather", "Sun", "War", "Wind", "Wisdom"],
          note: "The DM decides which gods act as patrons for the Amazon civilization; most Amazon priestesses will serve those specific gods. An Amazon will command LESS RESPECT unless she is a priestess of one of the required list -- since each attribute has its own role to play in any civilization, few gods are really inappropriate."
        }
      },
      abilities: [
        { name: "First Blow Bonus", notes: "+3 to hit and +3 damage on her FIRST BLOW ONLY, in a fight where a male opponent from a culture where women fighters tend to be rare confronts an Amazon for the first time. Reflects that her opponent's guard is down." },
        { name: "First Blow Bonus: Limits", notes: "Does NOT work on any Warrior of 5th level or higher, or a character of any other class at 8th or higher -- too seasoned to let his guard down. At the DM's discretion a wary NPC may make an Intelligence check to see the attack coming and deny the bonus. Does not work on any male fighter from a culture where women do regularly fight, who has had fighting-women comrades, who has faced fighting-women opponents, or who has seen the Amazon use the bonus on someone else. On player-characters it works only if the player is role-playing honestly enough to admit his character would underestimate her. Once she hits with the bonus, that target never falls for it again. Usable successfully once per victim, ever. If she MISSES she continues to receive it against that target until she hits him once." },
        { name: "Reaction Penalty", notes: "-3 reaction adjustment from NPCs from male-dominated societies. Player-characters do not have to demonstrate this hostility unless they want to for role-playing purposes, and even then it should fade as they come to respect her." },
        { name: "Starting Armor", notes: "When first created she must buy her armor from: shield, leather, padded, studded leather, brigandine, scale mail, hide, banded mail, bronze plate mail. Once she has adventured elsewhere in the world she may purchase other types according to her priest-class limitations." }
      ],
      reaction: [
        { value: -3, when: "From NPCs of male-dominated societies" }
      ],
      benefits: "First blow bonus of +3/+3 against a male opponent from a culture where women fighters are rare, once per victim ever. Bonus proficiencies: Riding (Land-Based) and Animal Training. Wealth: the ordinary 3d6x10 gp.",
      hindrances: "-3 reaction adjustment from male-dominated societies. Starting armor limited to a nine-item list until she has adventured abroad. May not serve the gods of Disease or Peace, and commands less respect outside the listed priesthoods. To abandon the kit she must renounce her Amazon citizenship, identifying herself more strongly with another culture.",
      notes: "Races: none excluded. Humans, elvish and half-elvish Amazons are most appropriate. Dwarves would substitute battle axe and warhammer for their weapons and swine for their preferred mounts; gnomes throwing axe and short sword, riding ponies, with Tracking and Survival as bonus proficiencies; halflings javelin and sling, with Endurance and Set Snares."
    },

    barbarianpriest: {
      name: "Barbarian/Berserker Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "99-100",
        note:   "Transcribed from the book."
      },
      proficiencies: {
        weapon: {
          recommended: ["Battle Axe", "Sword, Bastard", "Sling", "Warhammer"],
          allowedPrinted: "Required: None. Recommended: Battle axe, sword/bastard, bow (any), sling, warhammer",
          note: "The priesthood may limit the priest's choice of weapons and not allow him to learn all of these."
        },
        nonweapon: {
          required: ["Endurance"],
          recommended: ["Animal Handling", "Animal Training", "Direction Sense", "Fire-Building", "Riding, Land-Based", "Weather Sense", "Blind-fighting", "Hunting", "Mountaineering", "Running", "Set Snares", "Survival", "Tracking", "Herbalism", "Jumping"],
          note: "Endurance is a BONUS proficiency. Some recommended proficiencies are outside the priest's Nonweapon Proficiency Group Crossovers and cost DOUBLE the listed slots if taken. The DM may require this priest to take a proficiency in the tribal specialty -- Fishing, Agriculture, and so on."
        }
      },
      requirements: {
        priesthood: {
          barred: ["Arts", "Love", "Music, Dance"],
          recommended: ["Agriculture", "Animals", "Darkness, Night", "Earth", "Elemental Forces", "Fertility", "Hunting", "Lightning", "Metalwork", "Nature", "Sky, Weather", "Thunder", "Strength", "War"],
          note: "Barbarian tribes tend to have one or two patron gods, usually gods of natural forces or barbarian attributes. Gods of the 'softer' attributes would be represented but their priests would be much rarer -- no priesthood is BARRED among the barbarians, however scarce."
        }
      },
      abilities: [
        { name: "Imposing Presence", notes: "+1 reaction adjustment bonus when encountering NPCs, rising to +3 among members of his own culture. Barbarians are imposing and dangerous-looking, which tends to make others respect them or at least wish not to make enemies of them." },
        { name: "Faster Berserker Rage", notes: "If the priest's culture has Berserker warriors (see The Complete Fighter's Handbook) and he has the incite berserker rage granted power, berserkers of his culture in his presence go berserk in ONE round instead of the usual ten. The priest is not required to use his power for this to take place; it just happens." },
        { name: "Authority Penalty", notes: "-3 reaction adjustment when encountering NPCs in positions of power: rulers, government officials and the like. He does not respect the authorities and they have learned to be cautious of him -- this sort of priest keeps freeing his enslaved brethren, and even if he worships a god known to this culture, he does so in a way the locals consider wrong." },
        { name: "Starting Equipment", notes: "With his starting gold he cannot buy armor heavier than splint mail, banded mail or bronze plate mail. Once he has adventured in the outer world he can buy any type of armor his priestly requirements allow. With his starting gold he can buy only weapons appropriate to his tribe: battle axe, bows, club, dagger/dirk, footman's flail, mace, or pick, hand/throwing axe, sling, spear, and swords." }
      ],
      reaction: [
        { value: 1, when: "General NPCs" },
        { value: 3, when: "Members of his own culture" },
        { value: -3, when: "Rulers, government officials and others in positions of power" }
      ],
      benefits: "Imposing presence: +1 reaction generally, +3 among his own people. Berserkers of his culture rage in one round rather than ten in his presence. Bonus proficiency: Endurance. Wealth: the ordinary 3d6x10 gp.",
      hindrances: "-3 reaction from rulers and officials. Starting armor capped at splint, banded or bronze plate; starting weapons limited to a tribal list. Abandoning the kit means renouncing his allegiance to tribe or clan and accepting citizenship in some other culture, which requires performing his priestly duties in the fashion of the priests of THAT culture.",
      notes: "There are NO ability requirements to be a priest of a barbarian or berserker tribe. The warriors of the tribe must have Strength 15, and priests will be most impressive if they can approximate or match that score, but it is not a requirement of the kit. Races: no special restrictions; each DM decides whether his demihumans can live in what are considered barbarian cultures."
    },

    fightingmonk: {
      name: "Fighting-Monk",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "100-101",
        note:   "Transcribed from the book. RENAMED from `monk`, which held unverified paraphrase under a name the book does not use."
      },
      proficiencies: {
        weapon: {
          allowedPrinted: "Required: See Special Benefits. Otherwise the priest may take any weapon proficiencies his specific priest class allows; he may not take any the class does not allow.",
          note: "TWO FREE WEAPON PROFICIENCY SLOTS which MUST be used to take Specialization in one of the three styles of Unarmed Combat -- Punching, Wrestling or Martial Arts."
        },
        nonweapon: {
          required: ["Tumbling"],
          recommended: ["Riding, Land-Based", "Artistic Ability", "Dancing", "Reading/Writing", "Religion"],
          note: "Tumbling is a BONUS proficiency. NO PROFICIENCY HE TAKES COSTS DOUBLE: he has a Nonweapon Proficiency Group Crossover with ALL FIVE proficiency groups -- General, Priest, Rogue, Warrior and Wizard."
        }
      },
      requirements: {
        dex: 12,
        priesthood: {
          barredByCombat: ["poor"],
          note: "A priest of any priesthood which starts out with Poor Fighting Abilities is barred from this kit. Gated on sp_combat rather than on a name list, which is why barredByCombat exists."
        }
      },
      abilities: [
        { name: "Two Free Weapon Proficiency Slots", notes: "Receives two free weapon proficiency slots which he must use to take Specialization in one of the three styles of Unarmed Combat (Punching, Wrestling, or Martial Arts). THE ONLY PRIEST WHO CAN SPECIALIZE IN AN UNARMED COMBAT STYLE. He can specialize in any or all of the three styles, but may only specialize in one of them at first experience level." },
        { name: "All Five Group Crossovers", notes: "Has a Nonweapon Proficiency Group Crossover with all five Proficiency Groups (General, Priest, Rogue, Warrior, Wizard). No proficiency he takes will cost double the usual number of slots." },
        { name: "Unspent Slots Are Kept", notes: "He does not have to spend all his starting Weapon Proficiency slots at first level. He can save his unspent proficiencies, and they do not 'go away'. Later he can spend them at a rate of one proficiency per experience level to improve his martial arts or buy new martial arts." },
        { name: "No Armor", notes: "This priest cannot wear any sort of armor." },
        { name: "Sphere Sacrifice", notes: "If he is a priest-class with Medium Combat Abilities, he must 'give up' some of his Spheres of Influence. He may have no more than THREE Major Accesses (one of which must be All) and TWO Minor Accesses. The player may choose from the accesses he currently has which ones the character loses and which he keeps." },
        { name: "Poverty", notes: "May never own more things -- weapons, treasure, money, etc. -- than he can carry on his back." }
      ],
      benefits: "Two free weapon proficiency slots for unarmed combat specialization. The only priest who can specialize in an unarmed combat style. Nonweapon proficiency group crossover with all five groups. Unspent weapon proficiency slots are kept and may be spent at one per level. Bonus proficiency: Tumbling. Wealth: the ordinary 3d6x10 gp.",
      hindrances: "Cannot wear any armor. If his priest-class has Medium Combat Abilities he must give up spheres down to three major (one must be All) and two minor. May never own more than he can carry on his back. Barred from any priesthood with Poor Fighting Abilities.",
      notes: "ABANDONING THIS KIT TAKES THREE EXPERIENCE LEVELS. He must not use any of his unarmed combat techniques for three whole experience levels' worth of time; once he has reached that third level he has forgotten them, may wear armor appropriate to his priest-class, and may resume any spheres he renounced. If he forgets himself and uses unarmed combat techniques during the process he must start over. Races: no special limitations, though humans, elves and half-elves seem visually more suited to the kit."
    },

    noblemanpriest: {
      name: "Nobleman Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "101-103",
        note:   "Transcribed from the book."
      },
      proficiencies: {
        weapon: {
          recommended: ["Sword, Long", "Sword, Bastard", "Lance"],
          allowedPrinted: "Required: None. Recommended: Long sword, bastard sword, lance, flails (all), maces (all), if allowed by the priest's actual priest class"
        },
        nonweapon: {
          required: ["Etiquette", "Heraldry", "Riding, Land-Based"],
          recommended: ["Animal Training", "Dancing", "Gaming", "Hunting", "Local History", "Musical Instrument", "Reading/Writing"],
          note: "Etiquette, Heraldry and Riding (Land-Based) are BONUS proficiencies, all General group. Warrior-group recommendations cost DOUBLE SLOTS unless the priest class has a nonweapon proficiency group crossover including the Warrior group."
        }
      },
      requirements: {
        priesthood: { barred: [] }
      },
      abilities: [
        { name: "Noble Reaction Bonus", notes: "+3 reaction from any noble of his own culture, and +2 from nobles of other cultures. The DM can ignore this if there is a cultural hatred between those people and the priest's culture or the priest's god." },
        { name: "Right of Shelter", notes: "When travelling he can demand shelter from anyone in his own land. He can demand shelter for two people multiplied by his experience level -- at eighth level he can demand shelter for himself and a retinue of fifteen more people." },
        { name: "Sheltering Others", notes: "As he can demand shelter of others, other Nobleman Priests can demand shelter of him. This can be expensive if they decide to stay awhile, and is a good way for the DM to bleed extra money from the priest if he seems to have too much." },
        { name: "High Living", notes: "Expected to live well. If he has enough money to do so he may only buy high-quality goods, and so must spend at least TWO TIMES the minimum necessary money for anything he buys. If a basic long sword costs 15 gp he won't buy one worth less than 30 gp; the extra money goes into quality, engraving and so on. He cannot save money by having a friend or follower buy cheaper things for him." },
        { name: "Shabby Gear Penalty", notes: "If he is broke he can settle for lesser goods, but the other nobles of his culture will mock him if they see him with shabby accoutrements, and he does not get his reaction bonus until once again all his goods are high-quality. If his gear and possessions look sufficiently shabby, people may not believe him to be a nobleman at all, and may refuse him the shelter he could ordinarily demand." }
      ],
      reaction: [
        { value: 3, when: "Nobles of his own culture" },
        { value: 2, when: "Nobles of other cultures" }
      ],
      requirementsPrinted: "There are no special requirements to be a Nobleman Priest.",
      benefits: "Starts with more gold: 225 gp plus the standard 3d6x10 gp. +3 reaction from nobles of his own culture, +2 from other cultures' nobles. May demand shelter for two people per experience level. Bonus proficiencies: Etiquette, Heraldry, Riding (Land-Based).",
      hindrances: "Must spend at least twice the minimum on anything he buys. Other Nobleman Priests may demand shelter of him. Loses his reaction bonus while his gear is shabby, and may be refused shelter if it is shabby enough. Must buy a suit of armor no lesser than brigandine or scale mail if his class permits, at least one weapon larger than a dagger, and a horse with riding saddle, bit and bridle, horseshoes and shoeing, halter and saddle blanket, before starting play.",
      notes: "A nobleman can become a priest and NOT take this kit -- such a priest lives more frugally, does not have to have a disdain for lower social classes, and does not count him among their ranks. If a Nobleman Priest player-character decides his attitudes are wrong he may abandon the kit; he will be ostracized by most of the nobles who counted him a friend, loses all other benefits and hindrances of the kit, and if the priest abandons the kit that money doesn't magically 'go away' -- as part of his social ostracization the character should suffer some financial loss equal to at least 225 gp. Races: no special requirements; the DM may decide not all races have the same kind of social snobbery."
    },

    outlawpriest: {
      name: "Outlaw Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "103-104",
        note:   "Transcribed from the book. DISTINCT from the druid `outlaw` kit, which is PHBR13's."
      },
      proficiencies: {
        weapon: {
          recommended: ["Cutlass", "Belaying Pin", "Bill"],
          allowedPrinted: "Required: None. Recommended: If Pirate, cutlass*, belaying pin*, bill. If Outlaw, weapon choices appropriate for the outlaw band. (* introduced in The Complete Fighter's Handbook.)"
        },
        nonweapon: {
          required: ["Religion"],
          recommended: ["Rope Use", "Seamanship", "Swimming", "Weather Sense", "Navigation", "Engineering", "Reading/Writing", "Appraising", "Set Snares", "Tightrope Walking", "Tumbling", "Direction Sense", "Fire-Building", "Riding, Land-Based", "Animal Lore", "Bowyer/Fletcher", "Endurance", "Hunting", "Running", "Survival", "Tracking", "Healing", "Herbalism", "Local History", "Disguise"],
          note: "Religion is a BONUS proficiency. The book splits its recommendations into a Pirate list and an Outlaw list; both are merged here. Several are Warrior-, Rogue- or Wizard-group and cost DOUBLE SLOTS unless the priest class dictates otherwise. Engineering is recommended for shipbuilding, Reading/Writing for mapmaking."
        }
      },
      requirements: {
        priesthood: {
          barred: ["Community"],
          barredByFaithType: ["philosophy", "force"],
          note: "Priests of the god of Community may not take this kit. Priests of no Philosophy or Force may take it -- they can associate with pirate or outlaw bands, but there is no censure within their orders because of it, and therefore no disadvantage to belonging to such a band."
        }
      },
      abilities: [
        { name: "No Superiors", notes: "The main benefit of this kit: the priest does not have any superiors. He takes orders from no superior religious authority, unless the god himself chooses to issue some." },
        { name: "Opposed By His Order", notes: "Opposed by the normal priestly order serving his god. When they hear of his plans they try to thwart them -- break up religious meetings, disrupt building of his temple. This priest never gets to build a temple at cut-rate prices; he must always spend the whole amount to build his temple. If he ever abandons his kit, the regular priesthood may accept his temple as one belonging to the priesthood, but will never recompense him half the money it took to build it." },
        { name: "Wanted By The Authorities", notes: "In the pursuit of his duties he is opposed by other priests serving the same god. In addition, if he has identified himself with an outlaw or pirate band, he will be wanted by the authorities as a member of that band. If he is part of an outlaw or pirate band he is sought by the same authorities who seek that band, and will pay the same penalties under the law as they do if he is caught." },
        { name: "Equipment: No Metal Armor At Sea", notes: "No restrictions on equipment. Within the context of the campaign, if this is a pirate or outlaw band, it is a bad idea to wear metal armor (banded, brigandine, bronze plate, chain, field plate, full plate, plate mail, and ring mail). Metal armor drags pirates down to their deaths when they fall overboard, and it is noisy when worn by outlaws trying to ambush their prey. But this is just a factor the DM needs to remember, not a restriction on the kit." }
      ],
      benefits: "No superior religious authority; takes orders from no one but the god himself. Bonus proficiency: Religion. Wealth: the standard 3d6x10 gp for starting gold.",
      hindrances: "Opposed by the normal priestly order serving his god. Never gets cut-rate temple construction -- must always spend the full amount. If part of an outlaw or pirate band, sought by the same authorities and subject to the same penalties under the law.",
      notes: "To abandon the kit he leaves the outlaw band or opposes/disbands the new religious order, whichever is pertinent, AND must answer all the charges pressed against him by the authorities -- being tried and going to prison for a time, paying reparations, or accepting tasks of penance from his temple. If he does not, he will continue to be opposed by his temple and wanted by the authorities. Races: no special restrictions."
    },

    pacifistpriest: {
      name: "Pacifist Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "104-105",
        note:   "Transcribed from the book."
      },
      proficiencies: {
        weapon: {
          allowed: ["Bow", "Dart"],
          allowedPrinted: "May not know any Weapon Proficiency except bow and dart, and may only know them if his true priest-class allows them. May only use these weapons in competition.",
          note: "He still receives all his Weapon Proficiency slots. If he ever abandons this kit he may 'spend' them at a rate of two slots every experience level."
        },
        nonweapon: {
          required: ["Etiquette"],
          recommended: ["Modern Languages", "Ancient Languages", "Ancient History", "Singing", "Musical Instrument", "Reading/Writing"],
          note: "Etiquette is a BONUS proficiency."
        }
      },
      requirements: {
        priesthood: {
          barred: ["Disease", "Evil (Philosophy)", "Justice, Revenge", "War"],
          note: "Priests of these gods, forces and philosophies may not be Pacifist Priests."
        }
      },
      abilities: [
        { name: "Compelling Personality", notes: "+2 to his CHARISMA SCORE -- his Charisma cannot exceed 18 from this bonus. In addition to any reaction bonus that heightened Charisma gives him, he receives a +2 reaction from anyone who is not utterly opposed to his philosophy. Beings opposed to his philosophy include priests and devoted adherents of the gods, forces and philosophies mentioned under Barred, and certain warlike nonhuman races such as orcs, ogres and trolls." },
        { name: "May Never Wear Armor", notes: "This priest may never wear armor." },
        { name: "May Never Use Weapons Or Harmful Tactics", notes: "May never use weapons, spells or any other tactics to harm a human, demihuman, nonhuman or monster. If he ever violates this decree, his GOD will not punish him -- because the pacifist's oath is one he took for himself, not for his god -- but his OWN GUILT will deprive him of all magic spells for the span of one month. If the DM wishes, if the priest is a follower of the god of Peace, the god can instead punish him as a Betrayal of Goals from the Role-Playing chapter." },
        { name: "Equipment", notes: "May not buy any armor, and may not buy any weapon except dagger or knife (for eating only), and bow and dart if he has proficiency with them." }
      ],
      reaction: [
        { value: 2, when: "Anyone not utterly opposed to his philosophy" }
      ],
      benefits: "+2 to his Charisma score, capped at 18. +2 reaction from anyone not opposed to his philosophy. Takes orders from no superior religious authority. Bonus proficiency: Etiquette. Wealth: the standard 3d6x10 gp.",
      hindrances: "May never wear armor. May never use weapons, spells or other tactics to harm any living being -- violation costs him all spells for one month through guilt alone. Weapon proficiencies limited to bow and dart, usable only in competition. May not buy armor, or any weapon beyond a dagger or knife for eating.",
      notes: "THE BOOK WARNS ABOUT THIS KIT AT THE TABLE: the DM should allow this priest only when (1) he is an NPC, (2) he is part of a specific quest or mission and the party must guard him, or (3) all the PCs are pacifists. The player of a pacifist priest will feel left out in combat and will be compelled to chide the other PCs for their violence, which will get on their nerves -- so the DM should keep such quests short. Just because the priest demands peacefulness of all around him, his allies do not have to obey. There are no special rules for abandonment if the character eventually feels he needs to be wielding force to achieve his ends. Races: no special limitations."
    },

    peasantpriest: {
      name: "Peasant Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "105-106",
        note:   "Transcribed from the book."
      },
      proficiencies: {
        weapon: {
          allowedPrinted: "The player may choose his character's weapon proficiencies subject to the limitations of the priest's actual priest-class. The DM may insist that the character start out the campaign only with proficiencies appropriate to a peasant -- short sword, spear, bow, footman's weapons and the like; long swords (and bigger blades), horseman's weapons, exotic polearms, lances, tridents and the like are not. This should only be a restriction when the character is first created; afterwards he can learn any weapon his priest-class allows him.",
          allowedScope: "creation"
        },
        nonweapon: {
          required: ["Agriculture"],
          recommended: ["Fishing", "Weather Sense", "Animal Lore"],
          note: "BONUS PROFICIENCY IS A CHOICE: Agriculture OR Fishing, player's choice. Recommended is Weather Sense OR Animal Lore, player's choice, plus any of the General proficiencies. Agriculture is recorded as required because the field holds one value; the choice is printed here."
        }
      },
      requirements: {
        priesthood: {
          barred: ["Evil (Philosophy)", "Good (Philosophy)", "Prosperity"],
          note: "Priests of these gods, forces and philosophies may not take this kit."
        }
      },
      abilities: [
        { name: "Shelter Among His Own", notes: "Always has shelter when he is in his own community; his own people will shelter him even from the land's rightful authorities. Among peasants of other communities he cannot count on this benefit, but he receives a +2 reaction adjustment from all peasants." },
        { name: "Vow of Poverty", notes: "Restrictions on the way he spends his money. Other than weapons, with which he has no monetary limitation, he may own only one object worth as much as 15 gp, and other than that one object may own nothing worth more than 10 gp. He may never own more than 75 gp worth of (nonweapon) property at any one time. If he receives money or gifts which put him above that limit he must give away money and possessions until once again he is within the 75 gp limitation." },
        { name: "Party Friction", notes: "In the campaign he devotes himself to the needs of the common man. If part of an adventuring party he won't support any plans which endanger or exploit the peasants or serfs, and will try to recommend plans which advantage them. He'll insist that treasures be shared with the locals of the area where the treasure was found, and that the local peasant community receive two shares if the treasure is split into even shares. In a greedy or tight-fisted party this may result in the priest becoming disillusioned with the party." }
      ],
      reaction: [
        { value: 2, when: "All peasants" }
      ],
      benefits: "Always sheltered in his own community, even from the rightful authorities. +2 reaction from all peasants. Bonus proficiency: Agriculture or Fishing, player's choice. Wealth: the standard 3d6x10 gp, but no more than 75 gp of it may be spent on goods other than weapons.",
      hindrances: "Vow of poverty: may own only one object worth as much as 15 gp, nothing else worth more than 10 gp, and never more than 75 gp of nonweapon property at any one time. Excess money and possessions must be given away.",
      notes: "There are no ability-score requirements to be a Peasant Priest, and no special rules for abandonment of this kit. The Peasant Priest need not have been born a peasant -- he could have been born a nobleman and later abandoned that lifestyle and the privileges of his class. He is the antithesis of the Nobleman Priest. Races: no special limitation."
    },

    prophetpriest: {
      name: "Prophet Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "106-107",
        note:   "Transcribed from the book. Was `prophet` with unverified paraphrase; re-transcribed and re-keyed."
      },
      proficiencies: {
        weapon: {
          allowedPrinted: "Required: None. Recommended: Any that the priest's actual priest-class permits."
        },
        nonweapon: {
          required: ["Weather Sense"],
          recommended: [],
          note: "Weather Sense is a BONUS proficiency. The book prints \"Recommended: None special.\""
        }
      },
      requirements: {
        wis: 15,
        priesthood: {
          barred: ["Oracles, Prophecy"],
          barredByFaithType: ["philosophy", "force"],
          note: "Priests of the god of Prophecy may NOT take this kit -- all other priests may. Priests of philosophies or forces do not receive their prophecies from a god; their prophecies are more like psychic impressions. Since a prophet is rarer than a priest of prophecy, the DM has the right to approve or disapprove any character taking this kit."
        }
      },
      abilities: [
        { name: "Prophecy", notes: "Receives the Medium Granted Power Prophecy from the Designing Faiths chapter. MORE LIMITED than the Prophecy granted to priests of the god of Prophecy: with this power, priests may receive visions from the god at any time the DM decides, but may only deliberately sink into a trance in order to receive a vision ONCE PER DAY." },
        { name: "Reaction Penalty", notes: "-2 reaction adjustment. It is not normal for anyone but priests of the god of Prophecy to be prophets, so normal people are a little edgy around other prophets and react to them at -2. THIS ADJUSTMENT MAY NEVER RESULT IN A REACTION WORSE THAN CAUTIOUS." }
      ],
      reaction: [
        { value: -2, when: "Ordinary folk -- never worse than Cautious" }
      ],
      benefits: "The Prophecy granted power, limited to one deliberate trance per day. Bonus proficiency: Weather Sense. Wealth: the normal 3d6x10 gp.",
      hindrances: "-2 reaction adjustment from ordinary folk, though never worse than Cautious. THIS KIT MAY NOT BE ABANDONED: as long as he is a priest, he is a Prophet Priest.",
      notes: "A prophet is one who receives signs, dreams or clues about the future from his god. Priests of the god of prophecy are prophets, but they are not the ONLY prophets -- priests of other gods can receive and pass along prophecies. In the campaign the Prophet Priest is partly a tool for the DM, who can use the character to supply clues and even red herrings to the characters. His is often a thankless job, and he is often a bit alienated from the normal folk. Races: no special limitations."
    },

    savagepriest: {
      name: "Savage Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "107-108",
        note:   "Transcribed from the book."
      },
      proficiencies: {
        weapon: {
          allowed: ["Blowgun", "Long Bow", "Short Bow", "Club", "Dagger", "Javelin", "Knife", "Sling", "Spear"],
          allowedScope: "creation",
          allowedPrinted: "Limited to the weapons his actual priest-class permits him, and further limited (when he is first created) to blowgun, long bow, short bow, club, dagger, javelin, knife, sling, spear. After he has adventured in the outer world, the character may learn other proficiencies."
        },
        nonweapon: {
          required: ["Direction Sense"],
          recommended: ["Animal Handling", "Animal Training", "Fire-Building", "Fishing", "Riding, Land-Based", "Rope Use", "Swimming", "Animal Lore", "Bowyer/Fletcher", "Hunting", "Mountaineering", "Running", "Set Snares", "Tracking", "Healing", "Herbalism", "Local History", "Jumping", "Tightrope Walking", "Tumbling"],
          barred: ["Etiquette", "Heraldry"],
          note: "BONUS PROFICIENCIES ARE CHOICES: Direction Sense OR Weather Sense (player choice), and Endurance OR Survival (player choice). Warrior-, Rogue- and Wizard-group recommendations cost DOUBLE SLOTS unless the priest-class dictates otherwise. THE SAVAGE MAY NOT TAKE Etiquette or Heraldry when first created."
        }
      },
      requirements: {
        str: 11,
        con: 13,
        priesthood: {
          barred: ["Disease", "Divinity of Mankind (Philosophy)", "Evil (Philosophy)", "Good (Philosophy)"],
          recommended: ["Animals", "Earth", "Elemental Forces", "Fire", "Hunting", "Nature", "Sky, Weather", "Vegetation"],
          note: "Priests of the barred gods and philosophies may not take this kit; the recommended list is where the book says the kit is MOST appropriate."
        }
      },
      abilities: [
        { name: "Detect Magic", notes: "A special Detect Magic ability resembling the spell of the same name, usable ONCE PER DAY PER EXPERIENCE LEVEL -- a 5th-level savage could use it five times per day. The Savage Priest is in tune with nature and can feel when there is something magical in the vicinity. As with the first-level Priest spell, he has a 10% chance per experience level to determine the sphere of the magic." },
        { name: "Imposing and Strange", notes: "The Savage Priest is imposing and strange, and worships his gods 'all wrong' -- civilized folk and priests recognize that his rites are different, unlike theirs. He suffers a -2 reaction adjustment from all civilized folk (NPCs; PCs can decide for themselves how they react to him)." },
        { name: "Equipment", notes: "With his starting gold he may buy NO ARMOR OTHER THAN LEATHER ARMOR AND SHIELD, and may buy no weapon not listed under Weapon Proficiencies. He must spend all his gold when he is created, or lose any 'change' he has left over." }
      ],
      reaction: [
        { value: -2, when: "All civilized folk" }
      ],
      benefits: "Detect Magic once per day per experience level, with a 10% chance per level to determine the sphere. Bonus proficiencies: Direction Sense or Weather Sense, and Endurance or Survival, both player's choice. Wealth: 3d6x5 gp -- HALF the usual starting gold.",
      hindrances: "-2 reaction from all civilized folk. May buy no armor other than leather and shield at creation, and no weapon outside the permitted list. Must spend all starting gold or lose the remainder. May not take Etiquette or Heraldry when first created.",
      notes: "This is a shaman of a savage tribe, a member of a technologically and culturally primitive but nature-attuned community. He interprets the will of his god and acts as advisor or leader to the tribe. He might be an animal-totem shaman who assigns tribal warriors their animal totems, or the witch-doctor who insists on the deaths of adventurers from the outside world. THE DM SHOULD INSIST that the character role-play his tribal origins in the first four or five experience levels, until he is more used to the outside world -- baffled by 'high-technology' inventions (iron and steel weapons, boats made of more than a single log, hourglasses, anything more sophisticated than the tools of his tribe), by civilized morals and ethics, and especially by the strangeness and unfairness of the laws of civilized men. If you have The Complete Fighter's Handbook, use the Equipment rules for the Savage Warrior Kit instead. To abandon this kit the character renounces his membership in the tribe and accepts citizenship in some other culture -- which frequently happens with Savage Priests who join adventuring parties and see so much of the outside world that they no longer feel part of the tribe. Take a priestess of a nature-god and give her the Savage Priestess kit, and you end up with something very like a nymph. Races: no special limitations."
    },

    scholarpriest: {
      name: "Scholar Priest",
      class: "cleric",
      source: {
        status: "verified",
        work:   "PHBR3 The Complete Priest's Handbook",
        pages:  "108-109",
        note:   "Transcribed from the book. Was `scholar` with unverified paraphrase; re-transcribed and re-keyed."
      },
      proficiencies: {
        weapon: {
          allowedPrinted: "Required: None. Recommended: Any appropriate to the priest's actual priest-class. See Special Benefits -- he may convert weapon proficiency slots into nonweapon proficiency slots."
        },
        nonweapon: {
          required: ["Reading/Writing"],
          recommended: ["Artistic Ability", "Etiquette", "Heraldry", "Languages, Modern", "Ancient History", "Astrology", "Languages, Ancient", "Local History"],
          note: "Reading/Writing is a BONUS proficiency."
        }
      },
      requirements: {
        int: 13,
        priesthood: {
          barred: ["Competition", "Fertility", "Life-Death-Rebirth Cycle (Force)", "Strength", "War"],
          recommended: ["Arts", "Crafts", "Culture (Bringing Of)", "Divinity of Mankind (Philosophy)", "Literature, Poetry", "Music, Dance", "Wisdom"],
          note: "Priests of the barred gods, forces and philosophies may not take this kit; the recommended list is where the book says the kit is MOST appropriate."
        }
      },
      abilities: [
        { name: "Slot Conversion", notes: "MAY SPEND ANY OF HIS WEAPON PROFICIENCY SLOTS ON NONWEAPON PROFICIENCIES INSTEAD. He doesn't have to; he can adhere to the normal pattern of proficiency choice appropriate to his priest-class. But if he wishes he may turn Weapon Proficiency slots into Nonweapon slots and thereby become a very skilled character." },
        { name: "Scholarly Reaction Bonus", notes: "+3 reaction from other scholars, admirers of scholastic concerns, writers, journalists, and people who imagine that they are scholars. Because of this, when the party thinks it is in a situation when no one is willing to help, it may turn out that the mousy clerk, antagonistic king or homely witch they met is an admirer of or even correspondent with the Scholar Priest and will help them." },
        { name: "Egotistical Debates", notes: "Many scholars are egotistical, and debates between scholars can become very heated and personal. Whenever the DM rolls a reaction check from another scholar, he should first roll 1d6. ON A 1, the player-character scholar gets a -6 REACTION ADJUSTMENT INSTEAD OF A +3, because at some time in the past (or even the present) he argued or disagreed with this scholar's pet opinion and offended him completely." },
        { name: "Equipment: Writing Materials", notes: "Must always have writing material, quill and ink with him. If he ever loses them he must regain or replace them as soon as possible, and in the meantime will be recording his experiences in any fashion he can find. Other than that, this kit makes no demands on the way he spends his money." }
      ],
      reaction: [
        { value: 3, when: "Other scholars, admirers of scholastic concerns, writers and journalists" },
        { value: -6, when: "Another scholar, on a 1 in 6 -- an old argument, replacing the +3 entirely" }
      ],
      benefits: "May spend weapon proficiency slots on nonweapon proficiencies instead. +3 reaction from scholars and admirers of scholarship. Bonus proficiency: Reading/Writing. Wealth: the standard 3d6x10 gp.",
      hindrances: "On a 1 in 6, a scholar's reaction is -6 instead of +3 because of an old disagreement. Must always carry writing material, quill and ink, and must replace them as soon as possible if lost. THIS KIT CANNOT BE ABANDONED.",
      notes: "A researcher, most at home poring over books, scrolls, papyri, clay tablets and other old writings. He is not forbidden from fighting, but is more likely to try to straighten out a bad situation with reason, personal charisma, or even trickery than with a weapon. His life is dedicated to the assimilation of knowledge and, usually, the transmission of that knowledge to new generations. A scholar can break off correspondence with other scholars, can choose not to teach, can decide not to do any studying or writing for as long as he likes, but can always re-enter the academic world. Races: no special limitations."
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
  //
  // ALL TEN KITS TRANSCRIBED FROM PHBR4 CHAPTER 3, August 2026, page by page from
  // rasterised images. This block previously held ten UNVERIFIED entries whose
  // mechanics were unsourced paraphrase. Four of those names had no page anywhere
  // in the book and were DELETED on Chris's ruling -- Wild Mage (which is Tome of
  // Magic), Spellfilcher, Dimensional Traveler and Geometer. kits.js is
  // official-only; house kits, if ever supported, arrive as a custom JSON import.
  // Recorded so no later session re-adds them as a helpful gap-fill.
  //
  // BARRED SCHOOLS MEANS "SHOULD NOT SPECIALISE IN", NOT "MAY NOT LEARN FROM".
  // PHBR4 p.34 defines the entry once for every kit: "This entry explains which
  // schools are inappropriate for the kit. Though the DM is free to make
  // exceptions, it is usually not a good idea to assign a kit to a specialist
  // from a barred school." Assigning a kit TO A SPECIALIST is specialisation. The
  // Mystic's entry restates this in his own words and is NOT a narrower case; no
  // kit in this book bars a wizard from learning a spell. A `barredSchoolsScope`
  // field was proposed and then abandoned once the chapter's own definition was
  // read -- it would have had one value and no second case.
  //
  // WEALTH IS PROSE, matching the other 91 kits in this file, with an OPTIONAL
  // `wealthCalc` beside it only where the book gives a clean formula. The prose
  // is the record; the structure is the affordance. `wealthCalc` is omitted for
  // the normal (1d4+1) x 10 gp.
  //
  // REACTION MODIFIERS ARE STORED AS PRINTED and the consumer subtracts. PHBR4
  // p.35 states the convention outright, identically to PHBR1 p.14: "do not add
  // the bonus or subtract the penalty from the die roll... subtract that number
  // from the die roll -- do not add it."
  mage: {
    academician: {
      name: "Academician",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "35-36",
        note:   "A learned scholar whose love of knowledge is matched only by his preoccupation with research. NO SPECIAL RULES FOR ABANDONING this kit; the book says so explicitly."
      },
      requirements: {
        int: 13,
        wis: 11,
        intPrinted: "A character must have a minimum Intelligence of 13",
        wisPrinted: "and a minimum Wisdom of 11 to become an Academician."
      },
      preferredSchools: ["Alteration", "Illusion/Phantasm", "Invocation/Evocation"],
      preferredSchoolsPrinted: "The Academician is intrigued by all the schools of magic, but is especially drawn to schools with a wide range of spells, including alteration, illusion, and invocation/evocation.",
      barredSchools: [],
      barredSchoolsPrinted: "There are no barred schools for the Academician.",
      secondarySkills: {
        required: ["Scribe"],
        printed: "Required: Scribe."
      },
      proficiencies: {
        weapon: {
          required: ["Dagger", "Dart", "Knife", "Sling"],
          requiredCount: 1,
          allowedPrinted: "Required (the player may choose from the following): Dagger, Dart, Knife, or Sling.",
          note: "ONE of the four, not all four."
        },
        nonweapon: {
          bonus: ["Reading/Writing"],
          recommended: ["Artistic Ability", "Etiquette", "Heraldry", "Languages, Modern",
                        "Ancient History", "Astrology", "Herbalism", "Languages, Ancient",
                        "Spellcraft", "Local History"],
          note: "The book groups the recommendations: (General) Artistic Ability, Etiquette, Heraldry, Languages (Modern); (Wizard) Ancient History, Astrology, Herbalism, Languages (Ancient), Spellcraft; (Priest) Local History. Local History is a PRIEST-group crossover and costs the extra slot. Bonus proficiencies are exempt from crossover surcharge entirely (p.34)."
        }
      },
      abilities: [
        { name: "Scholarly Correspondence",
          notes: "Maintains an extensive correspondence with scholars throughout the world, and his reputation as a man of wisdom often precedes him." },
        { name: "Ability Check Bonuses",
          notes: "A bonus to all Intelligence Checks and Wisdom Checks. The DM has two options: a flat +1 to both, or Table 5 (p.35), which takes the Academician's age and race into account so the bonuses increase as he ages. ONCE A METHOD IS CHOSEN IT CANNOT BE CHANGED LATER." }
      ],
      reaction: [
        { modifier: 3,
          applies: "an NPC familiar with his reputation, one of his correspondents, a self-styled intellectual, or an author, researcher, teacher, journalist or fellow scholar",
          printed: "the Academician receives a +3 reaction bonus." }
      ],
      benefits: "Two benefits, both always in force. (1) A +3 reaction bonus from scholars, authors, researchers, teachers, journalists and self-styled intellectuals who know his reputation. (2) A bonus to all Intelligence and Wisdom Checks -- either a flat +1, or the age-and-race scale of Table 5 on p.35, at the DM's option; the choice is permanent.",
      hindrances: "Academicians lack the training and instinct to make good hand-to-hand fighters. WHEN ATTACKING WITH ANY TYPE OF MELEE WEAPON, THE ACADEMICIAN ALWAYS HAS A -1 PENALTY TO HIT ON HIS FIRST BLOW. Subsequent blows against the same opponent are made without this penalty, since he has had an opportunity to size him up and adjust his attacks; if he attacks a different opponent, his first blow against that new victim is also at -1. Academicians also tend to be know-it-alls and unhesitatingly offer their opinions even on matters they know little about.",
      wealth: "The Academician receives the normal (1d4+1) x 10 gp as starting money.",
      races: null,
      racesPrinted: "Races: No restrictions.",
      abandonable: true,
      abandonPrinted: "There are no special rules for abandoning this kit. An Academician who becomes disillusioned with the academic life or loses interest in intellectual pursuits can choose to neglect his studies or research, but he is free to resume them at any time."
    },

    amazonsorceress: {
      name: "Amazon Sorceress",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "36-38",
        note:   "Amazons belong to matriarchal societies that thrive in a world otherwise dominated by males. A PRINTED CONTRADICTION IS RECORDED, NOT RESOLVED: the Weapon Proficiency entry reads \"Required: None\", but the Races note on p.37 tells half-elves and gnomes to substitute weapons for \"the required Weapon Proficiency\". The races paragraph presumes a requirement the entry denies. Both are transcribed as printed."
      },
      requirements: {
        gender: ["female"],
        genderPrinted: "A character must be female to be an Amazon. There are no other requirements."
      },
      preferredSchools: ["Conjuration/Summoning", "Invocation/Evocation", "Divination"],
      preferredSchoolsPrinted: "Amazons with high Constitution tend to be drawn to the schools of conjuration/summoning and invocation/evocation; both are especially useful on the battlefield. Diviners are also common, as they make excellent administrative advisors and counselors.",
      barredSchools: ["Necromancy", "Illusion/Phantasm"],
      barredSchoolsPrinted: "Amazons shun the dark forces associated with the school of necromancy. Because of its perceived uselessness in combat, they also avoid the school of illusion.",
      secondarySkills: {
        required: ["Groom"],
        printed: "Required: Groom."
      },
      proficiencies: {
        weapon: {
          required: [],
          recommended: ["Spear", "Bow, Long"],
          allowedPrinted: "Required: None. Recommended: Spear or long bow. This is contrary to the weapons usually allowed wizards, but is typical for Amazon cultures.",
          note: "SEE THE SOURCE NOTE: the Races entry contradicts \"Required: None\". Half-elves substitute short bow or spear; gnomes substitute throwing axe or short sword."
        },
        nonweapon: {
          bonus: ["Riding, Land-Based", "Animal Training"],
          recommended: ["Animal Handling", "Animal Lore", "Armorer", "Bowyer/Fletcher",
                        "Hunting", "Running", "Survival", "Tracking"],
          note: "The book groups them: (General) Animal Handling; (Warrior) Animal Lore, Armorer, Bowyer/Fletcher, Hunting, Running, Survival, Tracking. The Warrior entries carry the normal crossover surcharge for a wizard -- this kit grants NO waiver, unlike the Anagakok and Militant Wizard."
        }
      },
      abilities: [
        { name: "Underestimated",
          notes: "Male opponents who have never encountered the formidable Amazon women tend to underestimate them. THE FIRST TIME such a male encounters an Amazon in combat, she receives +3 to hit and +3 to damage ON HER FIRST BLOW ONLY. The bonus applies whether the blow hits or misses, and can be used only once per victim." }
      ],
      reaction: [
        { modifier: -3,
          applies: "NPCs from male-dominated societies",
          printed: "The Amazon suffers a -3 reaction roll adjustment from NPCs from male-dominated societies. This reaction adjustment no longer applies once characters come to know and respect her." }
      ],
      equipment: {
        required: [],
        restriction: "When first created, she must buy her weapons from among the following choices only: bow (any type), dagger/dirk, javelin, knife, spear. Once she has adventured elsewhere in the world, she may purchase other types of weapons.",
        printed: "When an Amazon character is first created, she must buy her weapons from among the following choices only: bow (any type), dagger/dirk, javelin, knife, spear."
      },
      benefits: "+3 to hit and +3 damage on her first blow against a male opponent who has never encountered an Amazon in combat. THE DM SHOULD RULE ON WHETHER IT APPLIES: the book excludes opponents of 5th level or higher (too seasoned to be surprised), opponents from cultures where females are accepted as equals and female warriors are common, and opponents who have fought alongside or against fighting women before. Against player characters the DM might ask the player whether his character would underestimate a female opponent.",
      hindrances: "A -3 reaction adjustment from NPCs of male-dominated societies, which lapses once they come to know and respect her. Player characters need not respond with hostility unless they wish to for role-playing purposes.",
      wealth: "The Amazon Sorceress receives the normal (1d4+1) x 10 gp as starting money.",
      races: null,
      racesPrinted: "Most Amazons are human, but other races are acceptable with the adjustments that follow.",
      variants: {
        axis: "race",
        axisPrinted: "Most Amazons are human, but other races are acceptable, with the adjustments that follow.",
        default: "human",
        options: [
          { key: "human", label: "Human",
            note: "Follows the kit's own values above with no changes." },
          { key: "half-elf", label: "Half-elf",
            proficiencies: { weapon: { required: ["Bow, Short", "Spear"], requiredCount: 1,
              allowedPrinted: "Half-elves: Substitute either short bow or spear for the required Weapon Proficiency." } },
            note: "Substitutes the weapon proficiency only." },
          { key: "gnome", label: "Gnome",
            proficiencies: {
              weapon: { required: ["Axe, Throwing", "Sword, Short"], requiredCount: 1,
                allowedPrinted: "Gnomes: Substitute throwing axe or short sword for the required Weapon Proficiency, use ponies for mounts, and substitute Tracking and Survival for the bonus Nonweapon Proficiencies." },
              nonweapon: { bonus: ["Tracking", "Survival"] }
            },
            note: "Replaces the weapon proficiency AND both bonus nonweapon proficiencies. Uses PONIES for mounts." },
          { key: "elf", label: "Elf",
            proficiencies: { nonweapon: { bonus: ["Endurance", "Set Snares"] } },
            note: "Substitutes Endurance and Set Snares for the bonus Nonweapon Proficiencies." }
        ]
      },
      abandonable: true,
      abandonPrinted: "To abandon this kit, the character must renounce her Amazon citizenship, most likely because she has grown to identify more closely with a different culture."
    },

    anagakok: {
      name: "Anagakok",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "38-39",
        note:   "A wizard from a primitive society occupying one of the world's most extreme climates. Known by many names depending on his society of origin: Magian, Phylacterist, Veronican, Scarabor, Obeahist. TWO SUBTYPES, Frigid Climate and Torrid Climate, are the `variants` block. CANNOT BE ABANDONED."
      },
      requirements: {
        con: 13,
        conPrinted: "To be an Anagakok, a wizard must have a Constitution of at least 13. Female Anagakok are as common as males."
      },
      preferredSchools: ["Abjuration", "Alteration", "Enchantment/Charm",
                         "Invocation/Evocation", "Divination"],
      preferredSchoolsPrinted: "The preferred schools of the Anagakok are abjuration, alteration, enchantment/charm, invocation/evocation, and greater divination.",
      barredSchools: ["Illusion/Phantasm", "Necromancy"],
      barredSchoolsPrinted: "Anagakok are barred from the schools of illusion and necromancy because of their spells' relative uselessness for surviving in hostile environments.",
      secondarySkills: {
        required: ["Fisher", "Forester", "Hunter", "Navigator", "Trapper/Furrier"],
        requiredCount: 1,
        printed: "Required (choose one of the following, based on the Anagakok's background): Fisher, Forester, Hunter, Navigator, Trapper/Furrier."
      },
      proficiencies: {
        weapon: {
          required: ["Bow, Short", "Dagger", "Harpoon", "Javelin", "Knife", "Sling", "Trident"],
          requiredCount: 1,
          allowedPrinted: "Required (choose one of the following, based on the Anagakok's background): Bow (any), dagger, harpoon, javelin, knife, sling, trident.",
          note: "HARPOON AND TRIDENT ARE NOT ON THE WIZARD'S NORMAL LIST. PHBR4 p.72 names this kit as one of its two stated exceptions to the weapon restriction: \"The Anagakok kit, for instance, allows for tridents and harpoons... If the DM gives permission for players to pick one of these kits, he should also allow him to use the kit's weapons.\" \"Bow (any)\" is recorded as Bow, Short here; the DM may allow any bow type."
        },
        nonweapon: {
          bonus: ["Endurance", "Survival", "Weather Sense"],
          recommended: ["Direction Sense", "Fire-building", "Riding, Land-Based", "Rope Use",
                        "Swimming", "Astrology", "Animal Lore", "Hunting", "Mountaineering",
                        "Running", "Set Snares"],
          crossoverWaiver: {
            byName: { "Animal Lore": 1, "Hunting": 1, "Mountaineering": 1, "Running": 1, "Set Snares": 1 },
            printed: "(Warrior, all cost single slots) Animal Lore, Hunting, Mountaineering, Running, Set Snares"
          },
          note: "Grouped in the book as: (General) Direction Sense, Fire-building, Riding (Land-based), Rope Use, Swimming; (Wizard) Astrology; (Warrior, ALL COST SINGLE SLOTS) Animal Lore, Hunting, Mountaineering, Running, Set Snares. That last group is a CROSSOVER SURCHARGE WAIVER -- warrior proficiencies would normally cost a wizard an extra slot and here they do not."
        }
      },
      abilities: [
        { name: "Find Food",
          notes: "Can find food in even the most barren of environments. In a 24-hour period he can find enough food to feed himself AND A NUMBER OF PEOPLE EQUAL TO HIS LEVEL -- a 4th-level Anagakok feeds himself and four others every day." },
        { name: "Good Fortune",
          notes: "ONCE PER WEEK, casts a special good fortune spell on himself and a number of people equal to his level. It lasts a number of turns equal to his level. All opponents have a -1 penalty on their chance to hit when attacking those under its effect. THE ABILITY IS INNATE: he need not memorize good fortune, and it does not count against his daily spell limit. To cast it he concentrates for 1 round and points to the subjects; no verbal or material components." },
        { name: "Climate Immunity",
          notes: "Natural immunity to environmental extremes based on his background. A Frigid Climate Anagakok suffers no penalties, damage or other restrictions in environments of extreme COLD; a Torrid Climate Anagakok suffers none in extreme HEAT. THE IMMUNITY APPLIES TO NATURAL CONDITIONS ONLY -- a Frigid Climate Anagakok suffers normal damage from cone of cold and other cold-based spells, and a Torrid Climate Anagakok normal damage from fireball and other heat-based spells." }
      ],
      reaction: [
        { modifier: -2,
          applies: "all NPCs unfamiliar with the Anagakok's culture",
          printed: "Because of his appearance and strange manner, an Anagakok suffers a -2 reaction penalty from all NPCs unfamiliar with the Anagakok's culture." }
      ],
      equipment: {
        restriction: "Can buy weapons only from those listed in the Weapon Proficiency entry. He can buy only equipment that would normally be available in his home society; the DM has the right to veto any initial purchase. HE MUST SPEND ALL HIS INITIAL MONEY -- any not spent is lost.",
        printed: "A beginning Anagakok can buy weapons only from those listed in the Weapon Proficiency entry above. He can buy only equipment that would normally be available in his home society; the DM has the right to veto any initial purchase. An Anagakok must spend all his initial money. Any money not spent is lost."
      },
      benefits: "Finds food for himself and one person per level per day; a weekly innate good fortune spell giving opponents -1 to hit against himself and one person per level for level turns; and total immunity to the natural environmental extreme of his own climate.",
      hindrances: "Exposure to harsh climates gives the Anagakok an unusual appearance -- tough leathery skin for the Torrid Climate type, a head-to-toe covering of short coarse hair for the Frigid -- costing a -2 reaction from all NPCs unfamiliar with his culture. AND THE IMMUNITY CUTS BOTH WAYS: a Frigid Climate Anagakok suffers -1 to ALL attack rolls, damage rolls, Ability Checks and saving throws in environments above 100 degrees F, and a Torrid Climate Anagakok the same penalty below 0 degrees F.",
      wealth: "A beginning Anagakok receives only (1d4+1) x 8 gp as starting money.",
      wealthCalc: { multiplier: 8 },
      races: null,
      racesPrinted: "Races: No restrictions.",
      variants: {
        axis: "climate",
        axisPrinted: "Although an Anagakok can originate from any number of hostile environments, two are considered in this discussion.",
        default: "frigid",
        options: [
          { key: "frigid", label: "Frigid Climate",
            note: "From a climate where the temperature never rises above 0 degrees F. Immune to natural extreme COLD. Suffers -1 to all attack rolls, damage rolls, Ability Checks and saving throws above 100 degrees F. Appearance: a head-to-toe covering of short, coarse hair." },
          { key: "torrid", label: "Torrid Climate",
            note: "From a climate where the temperature never falls below 100 degrees F. Immune to natural extreme HEAT. Suffers -1 to all attack rolls, damage rolls, Ability Checks and saving throws below 0 degrees F. Appearance: tough, leathery skin." }
        ],
        note: "PLAYERS AND DMS ARE ENCOURAGED TO INVENT OTHERS. The book names an Anagakok living at the bottom of an active volcano, in the depths of the ocean, or on an island continually battered by hurricane winds, and says to use the two above as examples for developing appropriate bonuses and penalties."
      },
      abandonable: false,
      abandonPrinted: "Though an Anagakok can renounce his heritage and sever ties with his society, he cannot renounce this kit; the traits of an Anagakok are inborn and permanent."
    },

    militantwizard: {
      name: "Militant Wizard",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "39-40",
        note:   "Skilled in both magical and military arts. TWO MECHANICS HERE ARE UNIQUE IN THE BOOK: Table 6 REPLACES PHB Table 22's oppositional schools for this kit's specialists, and a Militant Wizard MAGE takes one of three DM-chosen limitations. Both are recorded below and neither is derivable."
      },
      requirements: {
        str: 13,
        strPrinted: "A character must have a Strength of at least 13 to be a Militant Wizard. Though male Militant Wizards will be more common, female Militant Wizards are allowable as well, unless the DM's world specifically forbids them."
      },
      preferredSchools: ["Abjuration", "Alteration", "Conjuration/Summoning",
                         "Invocation/Evocation", "Necromancy"],
      preferredSchoolsPrinted: "Militant Wizards prefer schools with an excess of offensive and defensive spells, such as abjuration, alteration, conjuration/summoning, invocation/evocation, and necromancy. Though greater divination has uses on the battlefield, particularly in the area of reconnaissance, Militant Wizards are discouraged, but not barred, from divination specialization.",
      barredSchools: ["Enchantment/Charm", "Illusion/Phantasm"],
      barredSchoolsPrinted: "Militant Wizards are barred from specializing in the schools of enchantment/charm and illusion, as their cultures tend to consider them relatively useless in combat.",
      oppositionOverride: {
        printed: "Table 6 lists the oppositional schools for Militant Wizards of each speciality; the Militant Wizard is forbidden to learn spells from these schools.",
        note: "REPLACES PHB Table 22 FOR THIS KIT. There is NO ILLUSIONIST ROW because illusion is a barred school -- but barred is advisory, so a Militant Wizard illusionist is buildable. Fall back to PHB Table 22 for him and let the kit-requirement advisory speak; do NOT invent a row.",
        abjurer:     ["Illusion/Phantasm", "Alteration", "Divination"],
        conjurer:    ["Alteration", "Divination", "Invocation/Evocation"],
        enchanter:   ["Invocation/Evocation", "Necromancy", "Divination"],
        diviner:     ["Conjuration/Summoning", "Abjuration"],
        invoker:     ["Illusion/Phantasm", "Enchantment/Charm", "Conjuration/Summoning"],
        necromancer: ["Enchantment/Charm", "Illusion/Phantasm", "Alteration"],
        transmuter:  ["Necromancy", "Abjuration", "Conjuration/Summoning"]
      },
      mageLimitations: {
        printed: "Militant Wizard mages are likewise limited. The DM may decide which of the following limitations affects Militant Wizard mages in his campaign (choose only one limitation).",
        note: "APPLIES TO NON-SPECIALIST MAGES ONLY. The DM chooses ONE; it is a stored setting, not derivable. Option 2 is the invasive one -- the four consequences the book names are exactly PHB Table 4's columns.",
        choose: 1,
        options: [
          { key: "noHighLevel", label: "No 8th- or 9th-level spells",
            printed: "The Militant Wizard mage is forbidden to learn 8th-level and 9th-level spells from any school." },
          { key: "intMinusTwo", label: "Learns as if Intelligence were two lower",
            printed: "The Militant Wizard mage learns spells as if his Intelligence were two points lower than he actually has, as indicated on Table 4, page 16 of the Player's Handbook. This limitation also affects the number of languages he can learn, the highest level of spells he can cast, the maximum number of spells per level he can know, and his spell immunity.",
            note: "The book's worked example: a Militant Wizard mage with Intelligence 15 can know only three languages, cast spells of no higher than 6th level, has a 55 percent chance to learn a new spell, and a maximum of nine spells per level. THE EXPERIENCE BONUS FOR A HIGH PRIME REQUISITE IS NOT MENTIONED and should not be reduced." },
          { key: "fiveSchools", label: "Five schools only",
            printed: "The Militant Wizard mage can learn spells from only five schools. To determine which schools are unavailable to him, roll 1d8 three times, where 1 = abjuration, 2 = conjuration/summoning, 3 = greater divination, 4 = enchantment/charm, 5 = illusion, 6 = invocation/evocation, 7 = necromancy, and 8 = alteration. If the same result occurs twice, roll again.",
            note: "THE THREE UNAVAILABLE SCHOOLS ARE ROLLED ONCE AND MUST BE STORED; they are not derivable." }
        ]
      },
      secondarySkills: {
        required: [],
        printed: "No particular Secondary Skill is recommended or required. He receives his Secondary Skill either by choosing or rolling randomly, whatever method is normal for the campaign."
      },
      proficiencies: {
        weapon: {
          required: ["Axe, Battle", "Bow, Short", "Crossbow, Light", "Dagger", "Javelin",
                     "Sling", "Spear", "Sword, Long", "Warhammer"],
          requiredCount: 1,
          allowedPrinted: "Required (choose one from the following): Battle axe, bow (any), crossbow (any), dagger, javelin, sling, spear, sword (any), warhammer. These are different from the weapons normally associated with wizards, but are common for Militant Wizards.",
          note: "FAR BEYOND THE WIZARD'S NORMAL LIST. \"Bow (any)\", \"crossbow (any)\" and \"sword (any)\" are open categories -- the specific entries here are one resolvable reading and the DM may allow any member of each category."
        },
        nonweapon: {
          bonus: ["Endurance"],
          recommended: ["Animal Handling", "Direction Sense", "Riding, Land-Based", "Swimming",
                        "Languages, Ancient", "Blind-fighting", "Tracking",
                        "Mountaineering", "Running", "Set Snares"],
          crossoverWaiver: {
            byName: { "Blind-fighting": 2, "Tracking": 2, "Mountaineering": 1, "Running": 1, "Set Snares": 1 },
            byGroup: ["Warrior"],
            printed: "Additionally, a Militant Wizard can acquire any of the Warrior's Nonweapon Proficiencies given on Table 37 on page 55 of the Player's Handbook at the listed number of slots; for instance, if a Militant Wizard wants the Animal Lore proficiency, it costs him only 1 slot instead of the normal 2 for a wizard."
          },
          note: "Grouped in the book as: (Warrior) Endurance as the BONUS; (General) Animal Handling, Direction Sense, Riding (Land-based), Swimming; (Wizard) Languages (Ancient); (Warrior; these take 2 slots only) Blind-fighting, Tracking; (Warrior; these take 1 slot only) Mountaineering, Running, Set Snares. THE CATEGORICAL WAIVER IS BROADER THAN THE NAMED ONES -- any Warrior proficiency at all costs him the listed slots, not the wizard surcharge."
        }
      },
      abilities: [
        { name: "Bonus Weapon Proficiency",
          notes: "A bonus Weapon Proficiency FREE OF CHARGE, in addition to his normal Weapon Proficiency. It does not use any of the wizard's proficiency slots, but he must choose it from the weapons listed in the Weapon Proficiency entry." },
        { name: "Warrior Proficiencies at Listed Cost",
          notes: "May acquire any of the Warrior's Nonweapon Proficiencies from PHB Table 37 at the listed number of slots rather than paying the wizard's crossover surcharge. Animal Lore costs him 1 slot instead of 2." }
      ],
      bonusWeaponProf: 1,
      benefits: "One free Weapon Proficiency outside his normal allotment, chosen from the kit's weapon list; and any Warrior nonweapon proficiency at the listed slot cost rather than the wizard crossover cost.",
      hindrances: "Because a Militant Wizard devotes so much time and energy to the mastery of military skills, he is limited in his access to spells from various schools. Specialists use Table 6 in place of PHB Table 22 and are forbidden to learn spells from those schools; mages take one of the three limitations above at the DM's choice.",
      wealth: "The Militant Wizard receives the standard (1d4+1) x 10 starting money.",
      races: null,
      racesPrinted: "Races: No restrictions.",
      equipment: {
        restriction: "May buy any equipment he chooses, keeping whatever money he might not use.",
        printed: "The Militant Wizard may buy any equipment he chooses, keeping whatever money he might not use."
      },
      abandonable: true,
      abandonPrinted: "Abandoning this kit is difficult. A Militant Wizard must abstain from using both of the weapons he has chosen for his Weapon Proficiencies for three full experience levels. Once he reaches the third experience level, he loses the use of his two Weapon Proficiencies. If he then renounces his citizenship from his home culture, he can successfully abandon this kit.",
      abandonNote: "THE CLOCK RESTARTS IF HE USES EITHER WEAPON. The book's worked example: a 5th-level Militant Wizard with short sword and long bow who abstains from both loses those proficiencies at 8th level, and may abandon the kit if he then renounces his citizenship. If he uses either weapon before 8th level he must begin again, abstaining for another three levels -- using the long bow at 7th means abstaining until 10th."
    },

    mystic: {
      name: "Mystic",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "40-42",
        note:   "Thoughtful, reserved and extremely introspective, devoted to self-enlightenment. HIS BARRED SCHOOLS ENTRY IS WHERE PHBR4 RESTATES ITS OWN DEFINITION: 'He is not prevented from learning spells from these schools -- he simply prefers to limit his association with them.' That is p.34's general rule in the kit's own words, not a narrower exception; see the block comment at the head of this section."
      },
      requirements: {
        wis: 13,
        wisPrinted: "To be a Mystic, a wizard must have a Wisdom score of at least 13."
      },
      preferredSchools: ["Illusion/Phantasm", "Divination", "Enchantment/Charm"],
      preferredSchoolsPrinted: "The Mystic prefers the schools of illusion, divination, and enchantment/charm.",
      barredSchools: ["Necromancy", "Invocation/Evocation", "Conjuration/Summoning"],
      barredSchoolsPrinted: "Because the Mystic is predisposed against magic that harms other living things, he is barred from specializing in the schools of necromancy, invocation/evocation, and conjuration/summoning. He is not prevented from learning spells from these schools -- he simply prefers to limit his association with them.",
      secondarySkills: {
        required: ["Farmer", "Forester", "Groom", "Mason", "Scribe", "Tailor/Weaver", "Woodworker"],
        requiredCount: 1,
        printed: "The Mystic must take one of the following as his Secondary Skill (player's choice, based on the Mystic's background): Farmer, Forester, Groom, Mason, Scribe, Tailor/Weaver, Woodworker."
      },
      proficiencies: {
        weapon: {
          required: ["Dagger", "Dart", "Sling"],
          requiredCount: 1,
          allowedPrinted: "Required (the player chooses one of the following): Dagger, dart, or sling."
        },
        nonweapon: {
          bonus: ["Astrology", "Religion"],
          recommended: ["Agriculture", "Artistic Ability", "Carpentry", "Etiquette",
                        "Languages, Modern", "Leatherworking", "Pottery", "Seamstress/Tailor",
                        "Stonemasonry", "Weaving", "Ancient History", "Herbalism",
                        "Languages, Ancient", "Reading/Writing", "Spellcraft"],
          note: "Grouped in the book as: (General) Agriculture, Artistic Ability, Carpentry, Etiquette, Languages (Modern), Leatherworking, Pottery, Seamstress/Tailor, Stonemasonry, Weaving; (Wizard) Ancient History, Herbalism, Languages (Ancient), Reading/Writing, Spellcraft. No crossover waiver."
        }
      },
      specialAbilityChoice: {
        printed: "The Mystic receives one of the following special abilities from the list below. The special ability is chosen when the character is first created and can never be changed.",
        choose: 1,
        permanent: true,
        options: [
          { key: "feignDeath", label: "Feign Death",
            notes: "ONCE PER WEEK, casts feign death as per the 3rd-level wizard spell; he can use this ability only on himself. He can feign death for up to 24 hours, awakening at any time. To use it he concentrates for 1 round; no components are necessary." },
          { key: "spiritForm", label: "Spirit Form",
            notes: "ONCE PER WEEK, transforms his consciousness into a ghostly spirit form, leaving his physical body behind. The spirit form has the appearance of a misty cloud in the shape of the caster. IT CANNOT ATTACK, SPEAK, OR CAST SPELLS, but it can fly at movement rate 24 (Maneuverability Class B) and can pass through the smallest opening or tiniest crack. It can travel an unlimited distance from his physical body so long as it remains in the same plane of existence. The spirit form is invulnerable to all attack forms, but dispel magic or a similar spell causes it to instantly return to its body. WHILE IN SPIRIT FORM THE MYSTIC'S PHYSICAL BODY REMAINS COMATOSE, is subject to all regular attacks and suffers damage normally. The spirit form can remain away from the body for up to 24 hours, but once it returns the Mystic revives and cannot use spirit form again for another week. To use it he concentrates for 1 round; no components." },
          { key: "levitateSelf", label: "Levitate Self",
            notes: "ONCE PER WEEK, a special levitate self ability for one hour. Once initiated he can levitate straight up at 10 yards per round. He can stop, hover, descend and ascend at will, THOUGH HORIZONTAL MOVEMENT IS NOT EMPOWERED by this ability -- he could push himself along a wall to move laterally. While levitating he can carry as much weight as he can normally. UNLIKE THE LEVITATION SPELL, using levitate self he suffers NO attack roll penalties when attempting to use missile weapons. He concentrates for 1 round; no components. As soon as a levitating Mystic touches the ground his use of the ability is over and he cannot use it again for another week." }
        ]
      },
      abilities: [
        { name: "One Special Ability, Chosen at Creation",
          notes: "Feign death, spirit form, or levitate self -- each once per week. THE CHOICE IS MADE WHEN THE CHARACTER IS FIRST CREATED AND CAN NEVER BE CHANGED. Full text in the `specialAbilityChoice` block." }
      ],
      equipment: {
        restriction: "May buy only the weapon associated with his Weapon Proficiency. As his adventuring career progresses, he can buy and use only daggers, darts, knives and slings. HE MUST SPEND ALL OF HIS STARTING MONEY; any leftover gold is lost.",
        printed: "The Mystic may buy only the weapon associated with his Weapon Proficiency. As his adventuring career progresses, he can buy (and use) only daggers, darts, knives, and slings. He must spend all of his starting money; any leftover gold is lost."
      },
      benefits: "One of feign death, spirit form or levitate self, once per week, chosen permanently at creation.",
      hindrances: "A Mystic must spend TWO CONSECUTIVE HOURS PER DAY MEDITATING, and those two hours must always occur at the same time of day. The player decides which hours, but once decided the time period can never change; typical times are the first two hours of dawn, the first two hours after sunset, or midnight to 2 a.m. IF HE NEGLECTS HIS MEDITATION, IS UNABLE TO PERFORM IT, OR IS INTERRUPTED MORE THAN ONCE (for more than a total of 1 minute), the following day he is able to cast only the number of spells allowed to a wizard ONE LEVEL LOWER than his actual level. The book's example: a 4th-level Mystic unable to meditate on Day 1 casts as a 3rd-level wizard on Day 2.",
      wealth: "The Mystic receives only (1d4+1) x 5 gp as starting money.",
      wealthCalc: { multiplier: 5 },
      races: null,
      racesPrinted: "Races: No limitations.",
      abandonable: true,
      abandonPrinted: "There are no special rules for abandonment of this kit. If the Mystic grows weary of the contemplative life or feels that he has reached a pinnacle of self-awareness, he can simply leave this kit behind."
    },

    patrician: {
      name: "Patrician",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "42-43",
        note:   "A wizard of noble birth, a member of his culture's aristocracy. A NOBLEWOMAN TAKING THIS KIT is called a Noblewoman or Aristocrat; the book names the alternative rather than gating the kit by gender, so no gender requirement is recorded."
      },
      requirements: {
        note: "There are no special requirements to be a Patrician. The majority are male, but noblewomen are also included in this category (although such a character would more correctly be called a Noblewoman or Aristocrat)."
      },
      preferredSchools: ["Conjuration/Summoning", "Alteration", "Invocation/Evocation"],
      preferredSchoolsPrinted: "The Patrician can specialize in any school, but prefers those that he perceives as most powerful, such as conjuration/summoning, alteration, and invocation/evocation.",
      barredSchools: ["Necromancy"],
      barredSchoolsPrinted: "The Patrician will not specialize in necromancy, a school he considers disgusting and repulsive.",
      secondarySkills: {
        required: ["Bowyer", "Gambler", "Groom", "Jeweler", "Limner/Painter", "Scribe"],
        requiredCount: 1,
        printed: "Required (the player must choose one of the following): Bowyer, Gambler, Groom, Jeweler, Limner/Painter, Scribe."
      },
      proficiencies: {
        weapon: {
          required: ["Dagger", "Knife"],
          requiredCount: 1,
          allowedPrinted: "Required (the player must choose one of the following): dagger, knife."
        },
        nonweapon: {
          bonus: ["Etiquette", "Heraldry", "Riding, Land-Based"],
          recommended: ["Dancing", "Languages, Modern", "Singing", "Ancient History",
                        "Languages, Ancient", "Reading/Writing", "Religion", "Appraising",
                        "Gaming", "Local History", "Musical Instrument"],
          note: "Grouped in the book as: BONUS (General) Etiquette, Heraldry, Riding (Land-based). Recommended: (General) Dancing, Languages (Modern), Riding (Land-based), Singing; (Wizard) Ancient History, Languages (Ancient), Reading/Writing, Religion; (Rogue, DOUBLE SLOTS) Ancient History, Appraising, Gaming, Local History, Musical Instrument; (Priest, DOUBLE SLOTS) Languages (Ancient). The double-slot tags are the NORMAL crossover surcharge, not a waiver -- this kit grants none. Note Ancient History and Languages (Ancient) appear under two groups each; take the cheaper."
        }
      },
      abilities: [
        { name: "Noble Reaction",
          notes: "A +3 reaction modifier from any noble of his own culture, and +2 from nobles of other cultures." },
        { name: "Demand Shelter",
          notes: "When traveling, can demand shelter from any fellow nobleman of his own culture. Shelter is offered FREE OF CHARGE and is made available for the Patrician AND UP TO TWO PERSONS PER EXPERIENCE LEVEL -- a 3rd-level Patrician can demand shelter for himself and six others. NOTE THIS CUTS BOTH WAYS: just as the Patrician can demand shelter from other noblemen, so can they demand shelter from him, which can get expensive if the NPC noblemen stay for any length of time." }
      ],
      reaction: [
        { modifier: 3, applies: "any noble of his own culture",
          printed: "he receives a +3 reaction modifier from any noble from his own culture" },
        { modifier: 2, applies: "nobles from other cultures",
          printed: "and a +2 reaction modifier from nobles from other cultures" }
      ],
      equipment: {
        required: ["Horse (at least a riding horse)", "Riding saddle", "Bit and bridle",
                   "Horseshoes and shoeing", "Halter", "Saddle blanket"],
        restriction: "A beginning Patrician must buy all of the required items. He can spend the rest of his money as he wishes.",
        printed: "A beginning Patrician must buy all of the following items: horse (must be at least a riding horse), riding saddle, bit and bridle, horseshoes and shoeing, halter, and saddle blanket. He can spend the rest of his money as he wishes."
      },
      purchaseMarkup: {
        min: 10, max: 100,
        printed: "When making purchases, the Patrician accepts nothing but the best, whether it be a meal, a room for the night, a weapon, or even a chest to carry his possessions. Any time he buys any item, the Patrician must pay 10 to 100 percent more than the listed price in the Player's Handbook. The DM will decide the price paid by the Patrician, which may vary from item to item, depending on the quality of merchandise in a particular locale. In all cases, the Patrician will settle for no less than the most expensive item available; he always pays at least 10 percent more than the listed price."
      },
      benefits: "More starting money than other wizards; +3 reaction from nobles of his own culture and +2 from nobles of others; and free shelter on demand from any fellow nobleman of his culture, for himself and two persons per experience level.",
      hindrances: "MUST PAY 10 TO 100 PERCENT ABOVE LISTED PRICE for every purchase, and always at least 10 percent more, because he accepts nothing but the best available. IF HE LACKS THE FUNDS for high-quality items he can settle for cheaper goods, BUT HE NO LONGER RECEIVES HIS REACTION BONUS in that particular encounter or community -- NPCs simply do not believe he is a noble. The book's example: a Patrician settling for a standard 5 sp meal at an inn is treated as an ordinary man by all the NPCs there, word spreads through the community that an amusing fellow is pretending to be a nobleman, and soon all the NPCs in the community react to him normally. If he settles for shabby accoutrements such as a normal sword or average saddle, all NPCs react to him normally until he replaces them with more expensive items. And other noblemen can demand shelter from HIM.",
      wealth: "The Patrician receives an extra 150 gp in addition to the standard (1d4+1) x 10 gp.",
      wealthCalc: { multiplier: 10, bonus: 150 },
      races: null,
      racesPrinted: "No restrictions. However, if a particular race doesn't recognize or allow socio-economic stratifications in the DM's campaign world, that race will not have Patricians.",
      abandonable: true,
      abandonPrinted: "To abandon this kit, the Patrician must renounce his birthright. He will forever after be ostracized by all the nobility from his homeland and may even be disowned and disinherited by his family."
    },

    peasantwizard: {
      name: "Peasant Wizard",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "43",
        note:   "A spell caster of modest means whose exceptional skills and matchless courage have made him a champion of the masses. The most frequently encountered of all the wizards. HIS POSSESSION CAP IS COMPUTABLE and is the only one of its kind in the book."
      },
      requirements: {
        note: "There are no additional ability requirements for the Peasant Wizard."
      },
      preferredSchools: [],
      preferredSchoolsPrinted: "There are no preferred schools for the Peasant Wizard, though illusionists, abjurers, and invokers are among the most frequently encountered.",
      barredSchools: [],
      barredSchoolsPrinted: "There are no barred schools for the Peasant Wizard; however, there are fewer necromancers and diviners than any other specialist.",
      secondarySkills: {
        required: [],
        printed: "The player may choose his Peasant Wizard's secondary skill. The DM might consider limiting this choice to skills that are useful to peasants such as swimming; it is unlikely (but not impossible) that a peasant wizard could learn heraldry or etiquette."
      },
      proficiencies: {
        weapon: {
          required: ["Bow, Short", "Dagger", "Knife", "Spear", "Dart", "Sling"],
          requiredCount: 1,
          allowedPrinted: "Required (player's choice): Bow (any), dagger, knife, spear, dart, sling.",
          note: "\"Bow (any)\" is an open category; Bow, Short is one resolvable reading."
        },
        nonweapon: {
          bonus: ["Agriculture", "Fishing"],
          bonusCount: 1,
          recommended: ["Animal Handling", "Blacksmithing", "Carpentry", "Cobbling", "Cooking",
                        "Direction Sense", "Fire-building", "Leatherworking", "Pottery",
                        "Riding, Land-Based", "Stonemasonry", "Weather Sense", "Weaving"],
          note: "THE BONUS IS ONE OF THE TWO, NOT BOTH: \"Bonus (one of the following, player's choice: Agriculture, Fishing)\". All recommendations are General group."
        }
      },
      abilities: [
        { name: "Food and Shelter at Home",
          notes: "When in his homeland, the Peasant Wizard will always be given food and shelter AT NO CHARGE from his fellow commoners. This courtesy extends to his companions, as long as he vouches for them. HE DOES NOT RECEIVE THIS BENEFIT IN LANDS OTHER THAN HIS OWN." },
        { name: "Peasant Reaction",
          notes: "Always receives a +2 reaction modifier from peasants in ANY culture." }
      ],
      reaction: [
        { modifier: 2, applies: "peasants in any culture",
          printed: "he always receives a +2 reaction modifier from peasants in any culture." }
      ],
      possessionCap: {
        singleItem: 15,
        otherItems: 10,
        total: 75,
        excludes: ["weapons"],
        includesMoney: true,
        printed: "Aside from weapons, a Peasant Wizard may own only one item worth as much as 15 gp. Aside from this item, all of his other items must be valued at 10 gp or less. The total value of all his possessions, including money but excluding weapons, can never exceed 75 gp. Any treasure or possessions in excess of this limit must be donated to some worthy cause."
      },
      equipment: {
        restriction: "The Peasant Wizard can spend his money on anything he likes, within the limitations described in the possession cap.",
        printed: "The Peasant Wizard can spend his money on anything he likes, within the limitations described in the Special Hindrances entry below."
      },
      benefits: "Free food and shelter from commoners in his homeland, extending to companions he vouches for; and +2 reaction from peasants in any culture.",
      hindrances: "A HARD CAP ON POSSESSIONS. Aside from weapons he may own only ONE item worth as much as 15 gp; every other item must be 10 gp or less; and the TOTAL value of all his possessions INCLUDING MONEY but EXCLUDING WEAPONS can never exceed 75 gp. Any treasure or possessions in excess must be donated to some worthy cause. He also sees the wealthy as a primary reason for the commoners' miseries, has little respect or patience for noblemen, is likely to avoid associating with Patricians, will not recruit peasants for combat support unless they fully understand the risks, makes sure his companions pay a common man a fair price for goods or services, and demands that local citizens receive their fair share when the party recovers a treasure they helped find or that was recovered on their land.",
      wealth: "The Peasant Wizard receives only (1d4+1) x 5 gp for starting money.",
      wealthCalc: { multiplier: 5 },
      races: null,
      racesPrinted: "Races: No restrictions.",
      abandonable: true,
      abandonPrinted: "No special rules exist for abandoning this kit."
    },

    savagewizard: {
      name: "Savage Wizard",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "43-45",
        note:   "The spell caster of a remote tribe, culturally and technologically primitive by the standards of the rest of the world. Known by a variety of names: Witch Doctor, Mundunugu, Wangateur, Isangoma. Table 7 (p.45) drives his omen ability."
      },
      requirements: {
        str: 11,
        con: 13,
        strPrinted: "To be a Savage Wizard, a character must have a minimum Strength score of 11",
        conPrinted: "and a minimum Constitution score of 13."
      },
      preferredSchools: ["Conjuration/Summoning", "Invocation/Evocation"],
      preferredSchoolsPrinted: "Because their Constitutions tend to be exceptionally high, Savage Wizards excel in the schools of conjuration/summoning and invocation/evocation.",
      barredSchools: ["Abjuration", "Enchantment/Charm"],
      barredSchoolsPrinted: "Savage Wizards lack the natural aptitude for mastering the schools of abjuration and enchantment/charm.",
      secondarySkills: {
        required: ["Fisher", "Forester", "Groom", "Hunter", "Trapper/Furrier"],
        requiredCount: 1,
        printed: "The Savage Wizard's Secondary Skill should be based on the primary occupation of his tribe; that is, if his tribe is mostly fishermen, his Secondary Skill should be Fishing. Other likely skills include Forester, Groom, Hunter, and Trapper/Furrier."
      },
      proficiencies: {
        weapon: {
          required: ["Spear", "Blowgun", "Dagger", "Knife", "Sling"],
          requiredCount: 1,
          allowedPrinted: "Required (one of the following, representing his tribe's weapon of choice): spear, blowgun, dagger, knife, or sling. Regardless of whether the Savage Wizard eventually becomes familiar with new weapons, he is likely to prefer his tribal weapon throughout his adventuring career."
        },
        nonweapon: {
          bonus: ["Direction Sense", "Weather Sense", "Endurance", "Survival"],
          bonusCount: 2,
          recommended: ["Animal Handling", "Animal Training", "Fire-Building", "Fishing",
                        "Riding, Land-Based", "Rope Use", "Swimming", "Animal Lore",
                        "Bowyer/Fletcher", "Hunting", "Mountaineering", "Running", "Set Snares",
                        "Tracking", "Healing", "Local History", "Jumping", "Tightrope Walking",
                        "Tumbling", "Herbalism", "Religion"],
          note: "THE BONUS IS TWO CHOICES, NOT FOUR PROFICIENCIES: \"(General) Direction Sense or Weather Sense (player's choice); (Warrior) Endurance or Survival\" -- one from each pair. Recommended groups: (General) Animal Handling, Animal Training, Fire-Building, Fishing, Riding (Land-based), Rope Use, Swimming; (Warrior, DOUBLE SLOTS) Animal Lore, Bowyer/Fletcher, Hunting, Mountaineering, Running, Set Snares, Tracking; (Priest, DOUBLE SLOTS) Healing, Local History; (Rogue, DOUBLE SLOTS) Jumping, Tightrope Walking, Tumbling; (Wizard) Herbalism, Religion. NO CROSSOVER WAIVER -- unlike the Anagakok, this kit pays the surcharge. A Savage Wizard CANNOT take Etiquette or Heraldry when first created."
        }
      },
      specialAbilityChoice: {
        printed: "The Savage Wizard receives one of the following special abilities from the list below. The special ability is chosen when the character is first created and can never be changed.",
        choose: 1,
        permanent: true,
        options: [
          { key: "talisman", label: "Protective Talisman",
            notes: "ONCE PER WEEK, manufactures a protective talisman -- a small pouch of herbs hung on a leather cord, worn around the subject's neck. It gives protection from evil to the wearer, identical to the effects of the 1st-level wizard spell. It offers continual protection for a full day, after which the herbs disintegrate. Dispel magic or a similar spell permanently cancels the magic of that particular talisman. REQUIRES NO LESS THAN ONE HOUR to manufacture." },
          { key: "replicant", label: "Replicant",
            notes: "ONCE PER WEEK, constructs a small replicant of any single victim of his choice. About 6 inches tall, made of clay, crudely resembling the victim's form; IT MUST CONTAIN A LOCK OF HAIR, A FINGERNAIL, OR OTHER SMALL PIECE OF ORGANIC MATERIAL FROM THE VICTIM. Requires one hour to manufacture. Whenever the Savage Wizard cuts a piece from the replicant, sticks a pin in it, or otherwise attacks it, the replicant suffers 1-4 hit points of damage AND THE VICTIM SUFFERS AN IDENTICAL AMOUNT regardless of the distance between them -- however, the victim must be on the same plane of existence as the replicant. EVERY type of damage inflicts 1-4; therefore the Savage Wizard must take care not to destroy the replicant, for burning, crushing or throwing it into a pool of quicksand still inflicts only 1-4. THE REPLICANT DISINTEGRATES when it has suffered 10 hit points or more of damage, when dispel magic or a similar spell is cast on it, or when a week passes since its creation." },
          { key: "omen", label: "Forecast Omens",
            notes: "ONCE PER WEEK, forecasts the general fortunes of some major undertaking by interpreting an omen from observing the natural conditions around him. To be receptive he must do nothing but concentrate for ONE UNINTERRUPTED TURN; if his concentration is broken he cannot attempt to interpret an omen for another week. After the turn of concentration he studies his surroundings -- a rippling pond, a gathering of clouds, a swarm of insects, or the veins in a leaf are all possible sources. A wizard usually consults an omen before starting a journey, engaging in a major battle, or embarking on some other significant task. IF THE DM HAS KNOWLEDGE ABOUT THE PROPOSED ACTION the omen should reveal the appropriate information; in situations where the DM has no information on which to base his judgement, roll 1d10 and consult TABLE 7 (p.45)." }
        ]
      },
      abilities: [
        { name: "One Special Ability, Chosen at Creation",
          notes: "Protective talisman, replicant, or omen forecasting -- each once per week. THE CHOICE IS MADE WHEN THE CHARACTER IS FIRST CREATED AND CAN NEVER BE CHANGED. Full text in the `specialAbilityChoice` block; the omen results are Table 7 on p.45." }
      ],
      reaction: [
        { modifier: -2, applies: "all NPCs not from his own tribe",
          printed: "he suffers a -2 reaction adjustment from all NPCs not from his own tribe (PCs can react as they wish, but they should quickly become accustomed to the Savage and accept him as an equal)." }
      ],
      equipment: {
        restriction: "The only weapon he can purchase initially is his tribal weapon (see Weapon Proficiency). HE MUST SPEND ALL OF HIS REMAINING GOLD BEFORE HE IS CREATED; he may not keep any unspent gold. He can purchase only equipment that would normally be available to his tribe.",
        printed: "The only weapon the Savage Wizard can purchase initially is his tribal weapon (see Weapon Proficiency). He must spend all of his remaining gold before he is created; he may not keep any unspent gold. He can purchase only equipment that would normally be available to his tribe; for instance, his tribe probably has herbs, nuts, fishing nets, and rafts available, but they are unlikely to have chains, lanterns, hourglasses, or magnifying glasses. The DM has the final word as to what equipment is available to any particular Savage Wizard."
      },
      benefits: "One of the protective talisman, the replicant, or omen forecasting, once per week, chosen permanently at creation.",
      hindrances: "The Savage Wizard's strange appearance and manners make strangers wary of him, costing a -2 reaction adjustment from all NPCs not from his own tribe. Player characters may react as they wish but should quickly come to accept him as an equal.",
      wealth: "The Savage Wizard begins with only (1d4+1) x 5 gp. As the campaign progresses he will have the opportunity to acquire more treasure, and it is up to the player whether he appreciates its value or rejects it as worthless -- a Savage might accept gold but have a superstitious belief that requires him to reject gems.",
      wealthCalc: { multiplier: 5 },
      races: null,
      racesPrinted: "Races: No restrictions.",
      abandonable: true,
      abandonPrinted: "To abandon this kit, a character must renounce his membership with his tribe and become a citizen of a different culture. Since tribal roots run deep, a dramatic change such as this should be slow in coming; a Savage Wizard must have advanced at least five levels since leaving his tribe and experiencing adventures in the outside world before cutting ties with his tribe."
    },

    witch: {
      name: "Witch",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "45-49",
        note:   "A wizard whose powerful magical abilities are EXTRAPLANAR IN ORIGIN, learned from entities and their minions rather than from academies or mentors. THE MOST MECHANICALLY DENSE KIT IN THE BOOK. Male Witches are possible and are commonly called Warlocks. Table 8 (pp.47-48) drives witch's curse -- NOTE THAT TABLE 8 SPANS TWO PAGES: results 1-6 are on p.47 and results 7-8 on p.48, in the facing column. CANNOT BE ABANDONED without cost."
      },
      requirements: {
        int: 13,
        wis: 13,
        con: 13,
        intPrinted: "Because her training is more demanding than that received by most other wizards, she must have a minimum Intelligence and Wisdom of 13.",
        wisPrinted: "Because her training is more demanding than that received by most other wizards, she must have a minimum Intelligence and Wisdom of 13.",
        conPrinted: "To resist the corruption inherent from contact with extraplanar entities, she must have a minimum Constitution of 13.",
        gender: ["female", "male"],
        genderPrinted: "The vast majority of Witches are female, but male Witches are also possible, commonly called Warlocks."
      },
      preferredSchools: ["Enchantment/Charm", "Conjuration/Summoning", "Necromancy"],
      preferredSchoolsPrinted: "The most appropriate school for Witches is enchantment/charm. Conjuration/summoning and necromancy are also good choices.",
      barredSchools: [],
      barredSchoolsPrinted: "There are no barred schools for Witches.",
      secondarySkills: {
        required: [],
        recommended: ["Scribe"],
        printed: "Required: None. Recommended: Scribe."
      },
      proficiencies: {
        weapon: {
          required: [],
          allowedPrinted: "The Witch is not allowed an initial Weapon Proficiency, nor can she ever acquire a Weapon Proficiency as she advances in level.",
          note: "UNIQUE IN THE BOOK: no initial weapon proficiency AND none ever. She may still buy and carry the weapons listed under equipment; she simply is never proficient."
        },
        nonweapon: {
          bonus: ["Herbalism", "Spellcraft"],
          recommended: ["Artistic Ability", "Brewing", "Cooking", "Languages, Modern",
                        "Weather Sense", "Ancient History", "Astrology", "Languages, Ancient",
                        "Reading/Writing", "Religion", "Healing"],
          note: "The book prints the bonus as \"Herbalism, Spellcasting\"; SPELLCASTING IS NOT A PROFICIENCY IN THE PHB and Spellcraft is the resolvable reading. Recommended groups: (General) Artistic Ability, Brewing, Cooking, Languages (Modern), Weather Sense; (Wizard) Ancient History, Astrology, Languages (Ancient), Reading/Writing, Religion; (Priest, DOUBLE SLOT) Healing."
        }
      },
      abilities: [
        { name: "Detect Magic and Read Magic (at creation)",
          notes: "When a Witch is initially created she AUTOMATICALLY GAINS the spells detect magic and read magic. These spells are IN ADDITION to any spells she normally receives." },
        { name: "Secure Familiar (3rd level)",
          notes: "ONCE PER WEEK. Identical to the 1st-level wizard spell find familiar, EXCEPT that a Witch does not need to burn 1,000 gp worth of incense in a brass brazier -- she merely concentrates for one turn. If a suitable familiar is within 1 MILE PER LEVEL of the Witch, it will arrive within 1d10 hours. A WITCH CAN HAVE ONLY ONE FAMILIAR AT A TIME." },
        { name: "Brew Calmative (5th level)",
          notes: "ONCE PER WEEK. Assuming access to the proper ingredients (usually available in any forest), brews one dose of an elixir with the effect of a sleep spell when a victim comes in contact with it. ONE DOSE IS SUFFICIENT TO COAT A SWORD OR ANY OTHER SINGLE WEAPON. NO EFFECT ON VICTIMS WITH MORE THAN 8 HD; victims can resist with a successful saving throw. Requires one hour to brew and LOSES ITS POTENCY AFTER 24 HOURS." },
        { name: "Brew Poison (7th level)",
          notes: "ONCE PER WEEK. With the proper ingredients, available in most forests, brews one dose of CLASS L CONTACT POISON (see p.73 of the DMG) sufficient to coat a single weapon. Requires one hour to brew and loses its potency in 24 hours." },
        { name: "Beguile (9th level)",
          notes: "ONCE PER WEEK. Beguiles any single person or monster, assuming the person is no higher than 8th level or the monster has no more than 8 HD. Identical to the 4th-level wizard spell charm monster and the 1st-level charm person, EXCEPT THAT THE VICTIM IS NOT ALLOWED A SAVING THROW. To cast it the Witch merely points at the victim and concentrates for 1 round; there are no verbal or material components." },
        { name: "Brew Flying Ointment (11th level)",
          notes: "ONCE PER WEEK. With the proper ingredients, available in any forest, brews one dose of an ointment which, rubbed on the skin, gives the recipient the ability to FLY as per the 3rd-level wizard spell. One dose is sufficient to affect one human-sized subject; the effects persist until the ointment loses its potency 24 hours after it is brewed. Requires one hour to brew." },
        { name: "Witch's Curse (13th level)",
          notes: "ONCE PER WEEK. Inflicts a witch's curse on any single person or creature. Exactly identical to the 4th-level wizard spell bestow curse EXCEPT THAT ITS EFFECT IS AUTOMATIC -- THE VICTIM IS NOT ALLOWED A SAVING THROW. The effect persists for 24 hours unless dispelled by a remove curse, wish, or similar spell. To cast it she points at the victim and concentrates for 1 round; no verbal or material components. Roll 1d8 and consult TABLE 8 (pp.47-48) for the effect." }
      ],
      reaction: [
        { modifier: -3,
          applies: "ordinary NPCs -- outsiders are generally terrified of Witches",
          printed: "Unless an NPC is exceptionally open-minded or has extremely high Intelligence or Wisdom (13 or more in either ability), the Witch receives a -3 reaction roll." },
        { modifier: -5,
          applies: "an uneducated NPC, one from an extremely superstitious or unsophisticated culture, or one with low Intelligence AND Wisdom (under 10 both)",
          printed: "If the NPC is uneducated, comes from an extremely superstitious or unsophisticated culture, or has low Intelligence and Wisdom (under 10 both), the Witch receives a -5 reaction roll." }
      ],
      equipment: {
        restriction: "When first created she must buy her weapons from among the following choices: dagger or dirk, knife, sling, staff sling. ADDITIONALLY SHE CAN CHOOSE UP TO 1,500 GP WORTH OF MAGICAL ITEMS from DMG Tables 89 (Potions and Oils), 91 (Rings), 92 (Rods), 93 (Staves), 94 (Wands), and 95-103 (Miscellaneous Magic), pages 135-139. THESE ITEMS ARE FREE -- she doesn't have to pay for them, BUT SHE CANNOT KEEP ANY OF THE LEFTOVER 1,500 GP.",
        printed: "When a Witch is first created, she must buy her weapons from among the following choices: Dagger or dirk, knife, sling, staff sling. Additionally, the Witch can choose up to 1,500 gp worth of magical items from Table 89 (Potions and Oils), Table 91 (Rings), Table 92 (Rods), Table 93 (Staves), Table 94 (Wands), and Tables 95-103 (Miscellaneous Magic) on pages 135-139 of the Dungeon Master's Guide. These items are free -- she doesn't have to pay for them (but she cannot keep any of the leftover 1,500 gp)."
      },
      periodicPenalty: {
        printed: "The Witch must periodically struggle with the extraplanar forces striving to direct her. The forces are so powerful that they cannot be dispelled; all the Witch can do is endure them. When undergoing these internal struggles, the Witch suffers penalties to her combat abilities and saving throws. The DM has three options for determining the frequency and intensity of these penalties, depending on the needs of his campaign and how much bookkeeping he is willing to undertake.",
        choose: 1,
        options: [
          { key: "fullMoon", label: "Full moon and the three nights either side",
            notes: "-2 penalty to her attack rolls and -2 penalty to her saving throws on ANY NIGHT WITH A FULL MOON AND THE THREE NIGHTS BEFORE AND AFTER; the penalties apply to a 12-hour period from about 6 p.m. to 6 a.m. On most worlds a full moon occurs about once per month. If the moon of the DM's world has a shorter or longer cycle, increase or decrease the number of nights the Witch is affected -- she should be affected about seven nights out of four weeks. IF THERE ARE SEVERAL MOONS, the Witch is affected by only one of them." },
          { key: "dailyChance", label: "25 percent chance per day",
            notes: "There is a 25 PERCENT CHANCE PER DAY that the Witch will be subjected to an internal struggle with extraplanar forces. The DM determines this at the beginning of the day; the Witch is aware of the result. Throughout that night (a 12-hour period lasting from about 6 p.m. to 6 a.m.) the Witch suffers a -2 penalty to her attack rolls and a -2 penalty to her saving throws." },
          { key: "everyNight", label: "Every night, lesser penalty",
            notes: "The Witch struggles with the extraplanar forces EVERY NIGHT. For a 12-hour period lasting from about 6 p.m. to 6 a.m. she suffers a -1 penalty to her attack throws; THERE IS NO PENALTY TO HER SAVING THROWS." }
        ]
      },
      benefits: "Detect magic and read magic free at creation, in addition to her normal spells; up to 1,500 gp of free magical items at creation; and a level-gated ladder of once-per-week abilities -- secure familiar at 3rd, brew calmative at 5th, brew poison at 7th, beguile at 9th, brew flying ointment at 11th and witch's curse at 13th. ALL ARE NATURALLY ACQUIRED and do not count against the number of spells she can know or use.",
      hindrances: "THREE STRUCTURAL PENALTIES, ALL PERMANENT. (1) Because of their non-conventional training, WITCHES DO NOT EARN BONUSES TO THEIR EXPERIENCE FOR HIGH ABILITY SCORES. (2) WITCHES CANNOT BE MULTI-CLASSED OR DUAL-CLASSED. (3) A -3 reaction from ordinary NPCs and -5 from the uneducated or superstitious. PLUS A MOB RISK: if a Witch lingers in a superstitious or culturally unsophisticated community for more than a day, she runs the risk of facing a mob of hostile citizens bent on running her out of town, imprisoning her, torturing her, or executing her. As a rule of thumb, assume a 20 PERCENT CHANCE OF A 4d6-MEMBER MOB FORMING in a hostile community if the Witch stays for a day; this chance increases by 20 percent for every additional day she remains, and the size of the mob increases by 2d6 members. PLUS the periodic extraplanar struggle -- see `periodicPenalty`.",
      wealth: "The Witch receives the standard (1d4+1) x 10 gp as starting money.",
      races: null,
      racesPrinted: "No racial restrictions.",
      abandonable: false,
      abandonPrinted: "The Witch kit cannot be abandoned. If a Witch manages to sever all ties with the entities responsible for her instruction (usually requiring the power of a wish or its equivalent), SHE LOSES TWO EXPERIENCE LEVELS. If she still wishes to pursue a magical career, she must relearn the experience levels that she lost.",
      finalNote: "The Witch is among the most complex of the kits, and many of the details are left up to the player's discretion -- the specific daily rituals for the Witch, the nature of her relationship with the entities who originally trained her, who and where they are, whether she can contact them for favors, and what exactly happens if the forces succeed in controlling the Witch. The DM is encouraged to experiment as long as he avoids the temptation to make her excessively powerful and keeps in mind the potential disruptions in his campaign."
    },

    wujen: {
      name: "Wu Jen",
      class: "mage",
      source: {
        status: "verified",
        work:   "PHBR4 The Complete Wizard's Handbook",
        pages:  "49-50",
        note:   "A wizard from cultures based on medieval oriental civilizations; a sorcerer of mysterious power and uncertain fealty. THIS KIT IS IN PHBR4 -- an earlier note in this file guessed Oriental Adventures and was WRONG. PHBR4 p.50 does point to Oriental Adventures for ADDITIONAL spells, weapons and proficiencies, noting the DM may need adjustments to convert them to 2nd Edition. THE ONLY KIT IN THE BOOK WITH AN ALIGNMENT RESTRICTION. Table 9 (p.48) lists his oriental weapon options. CANNOT BE ABANDONED."
      },
      requirements: {
        int: 13,
        intPrinted: "To be a Wu Jen, a wizard must have an Intelligence of at least 13.",
        alignment: ["ng", "n", "cg", "ne", "cn", "ce"],
        alignmentPrinted: "He cannot be of lawful alignment, but may still be good, evil, or neutral.",
        note: "ALIGNMENT IS RECORDED AS THE SIX NON-LAWFUL VALUES, per the closed-domain rule -- the book states the exclusion (not lawful) and the enumeration here is that exclusion resolved against the nine alignments."
      },
      preferredSchools: ["Conjuration/Summoning", "Alteration", "Invocation/Evocation"],
      preferredSchoolsPrinted: "Wu Jen prefer the schools of conjuration/summoning, alteration, and invocation/evocation.",
      barredSchools: [],
      barredSchoolsPrinted: "There are no barred schools for the Wu Jen.",
      secondarySkills: {
        required: ["Scribe"],
        printed: "Required: Scribe."
      },
      proficiencies: {
        weapon: {
          required: ["Blowgun", "Bow, Short", "Dagger", "Dart", "Sling"],
          requiredCount: 1,
          alternates: ["Bo Stick", "Boku-toh", "Jitte", "Shuriken"],
          allowedPrinted: "Required (choose one of the following): Blowgun, short bow, dagger, dart, sling. Alternately, the Wu Jen can choose from the selection of oriental weapons listed in Table 9.",
          note: "TABLE 9 (p.48) IS THE ALTERNATE LIST: bo stick, boku-toh, jitte, shuriken. All four are in core_wp.json; jitte and boku-toh were added from this book."
        },
        nonweapon: {
          bonus: ["Etiquette", "Artistic Ability"],
          recommended: ["Riding, Land-Based", "Cooking", "Dancing", "Singing", "Astrology",
                        "Herbalism", "Spellcraft", "Musical Instrument", "Blind-fighting",
                        "Gaming", "Juggling", "Tumbling"],
          note: "The Artistic Ability bonus is specified as Painting, Calligraphy, or Origami. Recommended groups: (General) Riding (Land-based), Cooking, Dancing, Singing; (Wizard) Astrology, Herbalism, Spellcraft; (Priest, DOUBLE SLOT) Musical Instrument; (Rogue, DOUBLE SLOT) Blind-fighting, Gaming, Juggling, Tumbling. No crossover waiver."
        }
      },
      abilities: [
        { name: "Weapon Bonus",
          notes: "The Wu Jen has an AUTOMATIC AND PERMANENT +1 BONUS TO HIT whenever using the weapon he has chosen for his Weapon Proficiency." },
        { name: "Maximum Effect Spell (4th level)",
          notes: "At 4th level he gains the power to summon massive magical energies that allow him to cast ANY ONE SPELL THAT IS THREE OR MORE LEVELS LOWER THAN HIS LEVEL AT MAXIMUM EFFECT. The spell automatically has maximum range, if desired, duration, and effect -- thus a 4th-level Wu Jen can cast a 1st-level spell at maximum effect. USABLE ONCE PER DAY." }
      ],
      taboos: {
        printed: "The Wu Jen operates under special taboos that do not affect other characters. Though the taboos may seem trivial or even ridiculous to other characters, the Wu Jen takes them quite seriously -- violating a taboo causes the Wu Jen to lose levels of ability, lose spells, become ill, or even die (the DM decides the exact penalty).",
        atFirstLevel: 1,
        everyNLevels: 5,
        note: "A 1st-level Wu Jen has ONE taboo and gains an additional taboo EVERY FIVE LEVELS THEREAFTER -- at 6th level, 11th level, 16th and so on. THE DM SELECTS THE TABOOS.",
        suggestions: [
          "Can't eat meat or animal products (including milk, eggs, and cheese).",
          "Can't sleep within 20 yards of a member of the opposite sex.",
          "Can't wear a certain color.",
          "Can't carry gold (or other precious metal) on his person.",
          "Can't bathe, or must bathe frequently.",
          "Can't cut his hair or fingernails.",
          "Can't intentionally take the life of an insect.",
          "Can't drink alcoholic beverages.",
          "Can't sit facing the north (or other direction).",
          "Can't speak after sunset (except to cast spells)."
        ]
      },
      equipment: {
        restriction: "The Wu Jen must buy ALL weapons from the choices listed in the Weapon Proficiency entry. HE MAY HAVE NO MORE THAN 10 GP REMAINING when he has finished purchasing his equipment.",
        printed: "The Wu Jen must buy all weapons from the choices listed in the Weapon Proficiency entry above. He may have no more than 10 gp remaining when he has finished purchasing his equipment."
      },
      benefits: "A permanent +1 to hit with his chosen weapon; and from 4th level, once per day, any spell three or more levels below his own cast at maximum range, duration and effect.",
      hindrances: "TABOOS. One at 1st level and another every five levels thereafter, selected by the DM. Violating one costs levels of ability, spells, illness, or death, at the DM's discretion.",
      wealth: "The Wu Jen starts with the normal (1d4+1) x 10 gp.",
      races: ["human", "elf", "half-elf"],
      racesPrinted: "Normally, a Wu Jen must be human. The DM may make exceptions in his campaign, with elves and half-elves being the most likely choices.",
      abandonable: false,
      abandonPrinted: "The Wu Jen kit cannot be abandoned."
    }
  },

  // ========== THIEF KITS ==========
  thief: {
    acrobat: {
      name: "Acrobat",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "24-26",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 5, openLocks: -5, findTraps: -5, moveSilently: 5, hideInShadows: 0, detectNoise: 0, climbWalls: 5, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          recommended: ["Alertness", "Disguise", "Fast-Talking", "Juggling", "Musical Instrument", "Riding, Land-Based", "Rope Use", "Ventriloquism"]
        }
      },
      abilities: [
        { name: "Acrobatic Skills", notes: "+1 bonus to any proficiency check for JUMPING, TUMBLING or TIGHTROPE WALKING. The bonus is +2 if the Acrobat wears NO ARMOR and, under the optional encumbrance rules, is UNENCUMBERED." },
        { name: "Acrobatic Proficiencies Are Innate", notes: "Jumping, tumbling and tightrope walking are so crucial to this kit that the Acrobat has them as special abilities EVEN IF THE DM DOES NOT USE THE NONWEAPON PROFICIENCY SYSTEM." },
        { name: "Weapon Proficiencies", notes: "Any weapon normally permitted to thieves, but Acrobats avoid heavy and cumbersome ones." },
        { name: "Nonweapon Proficiencies", notes: "Required: none. Recommended: Alertness, Disguise, Fast-Talking, Juggling, Musical Instrument, Riding, Rope Use, Ventriloquism." },
        { name: "Equipment: Light Only", notes: "Acrobats favor the least and lightest equipment possible. Under the optional encumbrance rules (PHB pp.76-79) they should not be permitted more than LIGHT ENCUMBRANCE." },
        { name: "Race: Dwarves Discouraged", notes: "Dwarves ought not to take this kit. HALFLINGS AND GNOMES MAY, but do NOT gain the jumping and tightrope walking bonuses. THEY DO RECEIVE THE TUMBLING BONUS." }
      ],
      requirements: { str: 12, dex: 14, alignment: "Any" },
      benefits: "Minimum Strength 12 and Dexterity 14. +1 to jumping, tumbling and tightrope walking checks, +2 when unarmored and unencumbered; those three proficiencies are innate to the kit. Climbing walls is the most applicable traditional thief skill, and moving silently improves rapidly.",
      hindrances: "Special Hindrances: None printed. Restricted in practice to light equipment. Dwarves discouraged; halflings and gnomes forgo the jumping and tightrope bonuses."
    },
    adventurer: {
      name: "Adventurer",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "26-27",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: 0, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 0, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          recommended: ["Alertness", "Boating", "Fast-Talking", "Information Gathering", "Looting"]
        }
      },
      abilities: [
        { name: "No Requirements", notes: "The Adventurer kit has NO REQUIREMENTS beyond those of the thief class itself." },
        { name: "Weapon Proficiencies", notes: "Any." },
        { name: "Nonweapon Proficiencies", notes: "Required: none. Recommended: player's choice; among those that may be selected are Alertness, Boating, Fast-talking, Information Gathering and Looting." },
        { name: "Even Skill Spread", notes: "Spreads skill improvements as evenly as possible, to deal with the many different challenges of adventuring. Any concentration is usually on opening locks or finding and removing traps, which are used most often." },
        { name: "Gadget-Oriented", notes: "Typically very gadget-oriented, delighting in new ways to bypass monsters and raid their lairs, with money from successful ventures to reinvest in equipment." }
      ],
      requirements: { alignment: "Any, though almost none that is chaotic evil survives long" },
      benefits: "The jack-of-all-trades, the prototypical dungeon-delving thief. No requirements, no special benefits, no special hindrances, any race. Preferred by many adventuring parties because he is much less likely than other thieves to betray or steal from his own companions.",
      hindrances: "Special Hindrances: None."
    },
    assassin: {
      name: "Assassin",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "26-28",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: 0, findTraps: 5, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 0, readLanguages: -5 },
      proficiencies: {
        nonweapon: {
          required: ["Trailing", "Disguise"],
          recommended: ["Alertness", "Begging", "Information Gathering", "Herbalism", "Riding, Land-Based", "Observation", "Tracking", "Voice Mimicry"]
        }
      },
      discretionaryPoints: 40,
      discretionaryPointsPerLevel: 20,
      abilities: [
        { name: "Poison Identification", notes: "Base chance is the Assassin's LEVEL x 5%. Intelligence 13-15 adds +5%, 16-17 adds +10%, 18 adds +15%. METHOD: by symptom no penalty (most certain, but needs a poisoned character to examine); by taste -5%; by odor -15%; by sight -20% (its advantage is risking no self-poisoning). SELF-POISONING: taste affects him 25% injected, 75% ingested, 100% contact; smell 10%, ingested or contact only. Effects on himself are always HALF STRENGTH. Herbalism adds +5%, healing +10%; THESE ARE NOT CUMULATIVE. An attempt takes one round. If one method fails another may be tried; if all four fail the poison stays a mystery to that Assassin until he gains a level. Identification confers knowledge of the antidote if one exists, though not its availability." },
        { name: "Slipping Substances", notes: "Adept at slipping poison, sedative and the like into a target's food or drink. Resolved by a PICK POCKETS roll at +5%. THIS BONUS DOES NOT APPLY TO PICKPOCKETING OR ANY OTHER USE of the ability (Table 4, note 3)." },
        { name: "Any Weapon", notes: "ALONE AMONG THIEF KITS, permitted the use of ANY weapon. Often selects one favored weapon -- a garrote, a serrated dagger, blowgun darts with exotic insect poison -- which may become known as a calling card." },
        { name: "Nonweapon Proficiencies", notes: "Required: Trailing, Disguise. Recommended: Alertness, Begging, Information Gathering, Herbalism, Land-Based Riding, Observation, Tracking, Voice Mimicry." },
        { name: "Poison Access", notes: "If the DM permits, poison is available and frequently used. It may be purchased -- expensive and usually illegal -- or manufactured or extracted by the Assassin himself, which can be dangerous." }
      ],
      requirements: { str: 12, dex: 12, int: 11, alignment: "Usually evil; a neutral but not good Assassin is conceivable" },
      benefits: "Minimum Strength 12, Dexterity 12 and Intelligence 11. Permitted ANY weapon, alone among thief kits. Poison identification by four methods, and +5% on a pick pockets roll when slipping substances into food or drink. Favors move silently, hide in shadows, detect noise and climb walls.",
      hindrances: "ADVANCES MORE SLOWLY IN THIEVES' SKILLS because of the time spent on weapons and poisons: only 40 DISCRETIONARY POINTS at 1st level and 20 PER LEVEL thereafter, against the normal 60 and 30. Generally feared and shunned -- a -4 REACTION PENALTY with non-evil NPCs aware of his profession. The DM may forbid elven, gnome and halfling Assassins, the profession being antithetical to their cultures."
    },
    bandit: {
      name: "Bandit",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "27-28",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: -5, openLocks: 0, findTraps: 10, moveSilently: 0, hideInShadows: 5, detectNoise: 0, climbWalls: -5, readLanguages: -5 },
      proficiencies: {
        nonweapon: {
          required: ["Survival"],
          recommended: ["Alertness", "Animal Handling", "Animal Training", "Animal Noise", "Fire-Building", "Intimidation", "Looting", "Riding, Land-Based", "Rope Use", "Set Snares", "Swimming"]
        }
      },
      abilities: [
        { name: "Ambush", notes: "Because of their adeptness at ambushing, Bandits gain +1 ON THEIR ATTEMPT TO SURPRISE IN A WILDERNESS SETTING." },
        { name: "Wilderness Stealth", notes: "In the wilderness the Bandit gets +5% to MOVE SILENTLY (Table 4, note 4). This is situational and is NOT part of the flat Table 4 adjustment." },
        { name: "Bludgeoning Weapons", notes: "Partial to heavy, brutal, bludgeoning weapons. MAY USE FLAIL, MACE, MORNING STAR AND WARHAMMER in addition to those normally permitted to thieves." },
        { name: "Third Weapon Slot", notes: "At least one initial weapon proficiency slot must be filled by a bludgeoning weapon, and Bandits MUST ALSO TAKE PROFICIENCY IN THE KNIFE -- for fighting, and as practical equipment for wilderness survival. Since this fills the two slots open to a thief, THE BANDIT IS GRANTED A THIRD INITIAL WEAPON PROFICIENCY SLOT, to fill with any weapon permitted to thieves." },
        { name: "Nonweapon Proficiencies", notes: "Required: Survival (choose appropriate terrain). Recommended: Alertness, Animal Handling/Training, Animal Noise, Firebuilding, Intimidation, Looting, Riding, Rope Use, Set Snares, Swimming." },
        { name: "Trained Animals", notes: "Bandits like to keep trained animals -- dogs, falcons, pigeons -- for hunting or message-carrying. Animal handling proficiency is needed to make effective use of such an animal." }
      ],
      requirements: { str: 10, con: 10, alignment: "Any" },
      benefits: "Minimum Strength 10 and Constitution 10. +1 to surprise in a wilderness setting, +5% move silently in the wilderness, four bludgeoning weapons beyond the thief list, and a third initial weapon proficiency slot. Favors climb walls, move silently, hide in shadows and find/remove traps.",
      hindrances: "Generally despised by other characters: normal people hate and fear highwaymen, and other thieves look on them with scorn as outcasts and crude robbers. Any Bandit recognized as such suffers a -2 REACTION PENALTY among non-Bandit NPCs."
    },
    beggar: {
      name: "Beggar",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "28-29",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 10, openLocks: -5, findTraps: -5, moveSilently: 0, hideInShadows: 5, detectNoise: 0, climbWalls: 0, readLanguages: -5 },
      proficiencies: {
        nonweapon: {
          required: ["Begging", "Disguise", "Information Gathering", "Observation"],
          recommended: ["Alertness", "Singing", "Trailing"],
          note: "Special Benefits calls the kit's proficiencies \"the large number of BONUS nonweapon proficiencies\" and says they should be granted EVEN IF THE CAMPAIGN DOES NOT USE THE PROFICIENCY RULES -- but the book never enumerates which ones are the bonus. The four above are printed under Required. They are encoded as `required` (forced, paid) rather than `bonus` (free) because that is what the Nonweapon Proficiencies line says; a DM reading the Special Benefits as granting them free is following the book just as closely. UNRESOLVED -- see the Fence, whose Required list IS explicitly its bonus list."
        }
      },
      abilities: [
        { name: "Bonus Nonweapon Proficiencies", notes: "The most valuable benefit of the kit is the LARGE NUMBER OF BONUS NONWEAPON PROFICIENCIES. THESE SHOULD BE GRANTED EVEN IF THE CAMPAIGN AT LARGE DOES NOT USE THE NONWEAPON PROFICIENCY RULES." },
        { name: "Weapon Proficiencies", notes: "Beggars begin with familiarity only in simple, inexpensive weapons. They select their TWO proficient weapons from: CLUB, DAGGER, DART, KNIFE, SLING or STAFF. The knife is a favorite, being inexpensive, easy to use and easy to conceal." },
        { name: "Nonweapon Proficiencies", notes: "Required: Begging, Disguise, Information Gathering, Observation. Recommended: Alertness, Singing, Trailing." },
        { name: "Skill Progression", notes: "Most proficient at picking pockets, to supplement begging income, and at moving silently, hiding in shadows and detecting noise, useful for gathering information and tailing people. Worst at opening locks and finding or removing traps, which require technical training not easily available." },
        { name: "Equipment", notes: "A wooden bowl or cup for alms. More sophisticated Beggars have false crutches, make-up and the like. Some keep children with them -- rented from the true parents, borrowed for a share of the day's income, or not their own at all -- to arouse still more sympathy." },
        { name: "Race", notes: "Beggars may be of any race. IN REGIONS WITH A LOT OF BIGOTRY, where demihumans have difficulty finding legitimate employment, Beggars are commonly demihuman. Most nonhuman Beggars were FORCED INTO THEIR POSITION by unfortunate circumstances -- they were not born into it." }
      ],
      requirements: { alignment: "Any" },
      benefits: "No requirements beyond the thief class. A large number of bonus nonweapon proficiencies, granted even in campaigns not using the proficiency rules. Best at picking pockets, moving silently, hiding in shadows and detecting noise.",
      hindrances: "Scorned by most of society. Even characters who share their wealth feel disgust or condescension. Other thieves recognize the talents and value of Beggars, so the penalty applies only outside that circle: -2 ON REACTION ROLLS WITH NPCs WHO AREN'T THIEVES. Impoverished background: BEGGARS START THE GAME WITH ONLY 3d4 GOLD PIECES. Few can afford armor, and would not wear it if they could, since it would suggest they are wealthier than they wish to appear. A Beggar who rises above his circumstances may equip himself as he sees fit, but will no longer be accepted by other Beggars; one who appears well-off could suffer penalties at the DM's discretion to begging, information gathering, and even trailing."
    },
    bountyhunter: {
      name: "Bounty Hunter",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "29-31",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: 0, findTraps: 5, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: -5, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          required: ["Tracking"],
          recommended: ["Alertness", "Animal Handling", "Animal Training", "Animal Noise", "Boating", "Direction Sense", "Fire-Building", "Information Gathering", "Herbalism", "Hunting", "Intimidation", "Observation", "Riding, Land-Based", "Set Snares", "Survival", "Trailing"]
        }
      },
      abilities: [
        { name: "Minimum 11 In Every Ability Except Charisma", notes: "The Bounty Hunter's vocation is rigorous and demanding at every level -- physical, psychological, even moral. He must have MINIMUM SCORES OF 11 IN EVERY ABILITY EXCEPT CHARISMA." },
        { name: "Nonlawful Alignment Required", notes: "A further requirement is that the Bounty Hunter be of NONLAWFUL alignment." },
        { name: "Slipping Substances", notes: "Like the Assassin, adept at slipping poison, sedative and the like into a target's food or drink, resolved by a PICK POCKETS roll at +5%. THIS BONUS DOES NOT APPLY TO PICKPOCKETING OR ANY OTHER USE of the ability (Table 4, note 3). Deadly poisons are more the province of the Assassin, but a carefully placed, powerful sedative may save a Bounty Hunter a great deal of trouble. TO HAVE ACCESS TO SEDATIVES OR UNDERSTAND THEIR USE, A BOUNTY HUNTER MUST HAVE HERBALISM PROFICIENCY." },
        { name: "Any Weapon, With A Cost", notes: "Permitted the use of ANY weapon. As part of his persona and fearsome public image he will often gain proficiency in a rare or bizarre weapon, such as the khopesh sword or man-catcher. NONTHIEF WEAPONS TAKE UP TWO OF HIS WEAPON PROFICIENCY SLOTS, BUT HE IS GRANTED A BONUS SLOT AT 1ST LEVEL -- so he begins with 3 slots. (Example: Borg Tartan fills two with the two-handed sword and takes the hand crossbow in the third.)" },
        { name: "Nonweapon Proficiencies", notes: "Required: Tracking. Recommended: Alertness, Animal Handling/Training, Animal Noise, Boating, Direction Sense, Firebuilding, Information Gathering, Herbalism, Hunting, Intimidation, Observation, Riding, Set Snares, Survival, Trailing." },
        { name: "Skill Progression", notes: "Makes frequent use of almost all thief skills, except perhaps pick pockets -- and note that pick pockets covers all sorts of delicate feats of manual dexterity, including slipping a mickey into a drink." }
      ],
      requirements: { str: 11, dex: 11, con: 11, int: 11, wis: 11, alignment: "Nonlawful" },
      benefits: "Minimum 11 in every ability except Charisma, and nonlawful alignment. Permitted any weapon, with nonthief weapons costing two slots and a bonus slot at 1st level. +5% on a pick pockets roll when slipping substances into food or drink.",
      hindrances: "Special Benefits: None. Special Hindrances: None. Members of any race could become Bounty Hunters; among the nonhumans, those of mixed blood such as half-elves favor it most, since they are often outsiders and loners not accepted by either side of their ancestry."
    },
    buccaneer: {
      name: "Buccaneer",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "31-33",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: -5, openLocks: 0, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 0, readLanguages: 5 },
      proficiencies: {
        nonweapon: {
          required: ["Navigation", "Seamanship", "Swimming"],
          recommended: ["Alertness", "Direction Sense", "Fishing", "Gaming", "Intimidation", "Looting", "Rope Use", "Tightrope Walking", "Weather Sense"]
        }
      },
      abilities: [
        { name: "Rope Climbing", notes: "Because of their familiarity with ropes, much used in the nautical arts, Buccaneers gain +5% ON CLIMBING ROLLS IF ROPES ARE INVOLVED -- +10% IF THEY ARE ROPES ON A SHIP. Note that the total chance of success with a thief skill, including all positive and negative modifiers, CANNOT EXCEED 95%." },
        { name: "Rope Combat", notes: "May fight from a rope, usually on a ship, so long as the feet and one hand can grasp it, and are much better at this than other characters. THEY GET +1 ON ATTACK AND SAVING THROW ROLLS IN ROPE COMBAT, AND +2 ON SUCH ROLLS IN SHIPBOARD ROPE COMBAT. These adjustments are ADDED TO ALL THE OTHER MODIFIERS, which are usually negative -- a climbing character would normally get -2 on attacks, so the Buccaneer's +2 bonus merely negates this." },
        { name: "Learning the Ropes (Optional Rules)", notes: "PHBR2 pp.31-32 carries a full rope-combat subsystem, flagged OPTIONAL in its own heading. A climbing character LOSES ALL ARMOR CLASS BONUSES FOR DEXTERITY AND SHIELD, and suffers -2 on attack, damage and saving throw rolls. A character attacking FROM ABOVE gains +2; one attacking FROM BELOW suffers -2. An off-balance defender is attacked at +2. A character struck by a weapon, or attempting to climb during combat, must make a climbing check or lose his balance; lost balance means the next round is spent falling or regaining balance, and no other action can be performed. NPC sailors have a base climbing percentage of 65% FOR THESE RULES ONLY. OPTIONAL DODGING: a Buccaneer may spend a round dodging, gaining +4 to armor class against attacks directed solely at him that round, provided he has initiative and forgoes all attacks; he may move at half normal rope-climbing speed, and on a successful climbing check adds his Dexterity bonus to AC for that round. RECORDED HERE RATHER THAN AS A SUPPLEMENT TOGGLE: it is situational combat reference with no character-sheet residue." },
        { name: "Weapon Proficiencies", notes: "The DM may wish to make classic Buccaneer weapons, such as the cutlass, available to thieves of this kit." },
        { name: "Nonweapon Proficiencies", notes: "Required: Navigation, Seamanship, Swimming. Recommended: Alertness, Direction Sense, Fishing, Gambling, Intimidation, Looting, Rope Use, Tightrope Walking, Weather Sense." },
        { name: "Armor Avoided", notes: "Buccaneers dress themselves as sailors and carry about the same equipment when at sea. LIKE SAILORS THEY WILL AVOID ARMOR -- it gets in the way of climbing around the rigging (DOUBLE PENALTIES ON CLIMBING ROLLS) and presents a problem for someone unfortunate enough to find himself overboard." }
      ],
      requirements: { con: 10, alignment: "Any" },
      benefits: "Minimum Constitution 10. +5% climbing when ropes are involved, +10% for ropes on a ship. +1 attack and saving throws in rope combat, +2 in shipboard rope combat. Makes much less use of the traditional thief skills than other kits; favors read languages for deciphering maps and codes.",
      hindrances: "As their expertise lies in rope-climbing, Buccaneers SUFFER A PENALTY OF -10% WHEN THEY ATTEMPT TO CLIMB WITHOUT ONE. Almost all Buccaneers are human, since few demihumans and humanoids are known as seafarers; the occasional half-elf might be found among a crew, or even more rarely a half-breed or full-blooded aquatic elf."
    },
    burglar: {
      name: "Burglar",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "33-35",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: -5, openLocks: 5, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 5, readLanguages: -5 },
      proficiencies: {
        nonweapon: {
          required: ["Alertness", "Looting"],
          recommended: ["Begging", "Information Gathering", "Jumping", "Observation", "Rope Use", "Tightrope Walking", "Tumbling"]
        }
      },
      abilities: [
        { name: "Cat Burglar Minimums", notes: "THE CAT BURGLAR requires a minimum Strength of 10 and Dexterity of 13. The book states this for the cat burglar specialization; other Burglar specialists such as the box-man and the jewel thief are described without stated minimums." },
        { name: "Specialization", notes: "Burglars often specialize further. A BOX-MAN is an expert at opening locks, especially safes and well-protected chests. A CAT BURGLAR or second-story specialist excels at climbing walls. Others specialize by target -- JEWEL THIEVES in particular are the elite among Burglars. A specialized thief is more marketable: by concentrating on one skill, a relatively low-level thief may compete with a thief many levels higher for jobs of a certain type." },
        { name: "Weapon Proficiencies", notes: "Better Burglars do not bring weapons with them on a job; carrying them only means more serious penalties if caught, either legal or more immediate. On some jobs, however -- stealing from dangerous criminals -- a Burglar is wise to have means of self-defense. Small, quiet, concealable weapons are naturally favored, though a Burglar may choose proficiency in ANY weapon among those normally permitted to thieves." },
        { name: "Nonweapon Proficiencies", notes: "Required: Alertness, Looting. Recommended: Begging, Information Gathering, Jumping, Observation, Rope Use, Tightrope Walking, Tumbling." },
        { name: "Skill Progression", notes: "The vital skills of a Burglar are open locks, find/remove traps, move silently, hide in shadows, detect noise and climb walls. He may concentrate particularly on one of these, but would probably then want to be as evenly excellent as possible in the others." },
        { name: "Equipment", notes: "Burglars love to use specialized hardware to increase their chances of success. See the equipment chapter for specialty items and their effects on thief skills." },
        { name: "Race", notes: "Members of any race may be Burglars, and IT IS A FAVORITE KIT. Nonhuman thieves often specialize in areas that offer excellent racial bonuses: dwarves may specialize in lockpicking and trap detection, elves in reconnaissance." }
      ],
      requirements: { str: 10, dex: 13, alignment: "Any", note: "Strength 10 and Dexterity 13 are stated for the CAT BURGLAR specifically. The book describes other Burglar specialists -- the box-man and the jewel thief -- without printing minimums for them." },
      benefits: "Cat Burglar requires minimum Strength 10 and Dexterity 13. Alertness and Looting are required proficiencies. Specialization by skill or by target is the way of the urban Burglar.",
      hindrances: "Special Benefits: None. Special Hindrances: None."
    },
    cutpurse: {
      name: "Cutpurse",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "34-36",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 10, openLocks: 0, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: -5, readLanguages: -5 },
      proficiencies: {
        nonweapon: {
          required: ["Observation", "Trailing"],
          recommended: ["Alertness", "Begging", "Information Gathering"],
          note: "The book prints Trailing under BOTH Required and Recommended. Listed once, as Required, which is the stronger statement."
        }
      },
      abilities: [
        { name: "Sizing Up A Target", notes: "The effective pickpocket chooses his target carefully. IN GAME TERMS THE CUTPURSE CAN GUESS THE CLASS AND LEVEL OF ANOTHER CHARACTER. On a successful OBSERVATION proficiency check he accurately determines the target's CHARACTER CLASS. ANOTHER CHECK may be made to determine the APPROXIMATE LEVEL; the DM should roll this check secretly, and if it fails, THE DIFFERENCE BETWEEN THE NUMBER ROLLED AND THE NUMBER NEEDED FOR SUCCESS IS HOW FAR OFF THE ESTIMATE IS." },
        { name: "Checking Out A Disguise", notes: "When a Cutpurse tries to size up a character who is IN DISGUISE, he suffers a PENALTY OF -5 ON HIS PROFICIENCY CHECK." },
        { name: "No Requirements", notes: "The Cutpurse has no requirements beyond those of the thief class." },
        { name: "Weapon Proficiencies", notes: "Small, concealable weapons are ideal for Cutpurses, though they are not formally restricted any more than thieves in general." },
        { name: "Nonweapon Proficiencies", notes: "Required: Observation, Trailing. Recommended: Alertness, Begging, Information Gathering, Trailing." },
        { name: "Skill Progression", notes: "Cutpurses naturally specialize in picking pockets. Beyond this they typically favor moving silently and hiding in shadows, as these may increase their pickpocketing talents." },
        { name: "Race", notes: "Cutpurses may come from any race. HALF-ELVES AND HALFLINGS PARTICULARLY FAVOR THIS KIT; so do elves, to a lesser extent." }
      ],
      requirements: { alignment: "Any" },
      benefits: "No requirements. May guess another character's class and level through Observation proficiency checks. Naturally specialized in picking pockets.",
      hindrances: "The main hindrance is that THIEVES OF OTHER KITS LOOK DOWN ON THEM, considering them small-time thieves just half a step above Beggars. This is something the DM should bring out in role-playing: CUTPURSE THIEVES WILL HAVE DIFFICULTY COMMANDING A LOT OF RESPECT IN THE UNDERWORLD. A -5 penalty applies to sizing up a character who is in disguise."
    },
    fence: {
      name: "Fence",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "36-37",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: 5, findTraps: 5, moveSilently: -5, hideInShadows: -5, detectNoise: 0, climbWalls: -5, readLanguages: 5 },
      proficiencies: {
        nonweapon: {
          bonus: ["Appraising", "Information Gathering"],
          recommended: ["Alertness", "Fast-Talking", "Forgery", "Gem Cutting", "Local History", "Observation"]
        }
      },
      abilities: [
        { name: "Underworld Standing", notes: "Because of his contacts, a Fence is probably the BEST PERSON FOR LOCATING AND HIRING THIEVES AND SMUGGLERS, especially in territory not claimed by a guild." },
        { name: "Reaction Bonus", notes: "Fences generally command a lot of respect from the underworld in their home territory. Unless a thief has a serious vendetta, he will probably court a Fence's favor for business reasons. FENCES RECEIVE A BONUS OF +3 ON REACTIONS WITH NPC THIEVES IF THEIR PROFESSION IS RECOGNIZED." },
        { name: "Bonus Proficiencies", notes: "The black market network transfers information as well as goods. Fences are probably the best-informed figures of the underworld, and for this reason THEY GAIN GATHER INTELLIGENCE AS A BONUS NONWEAPON PROFICIENCY. THEY ALSO RECEIVE APPRAISING AS A BONUS PROFICIENCY, since it is vital to their vocation." },
        { name: "Weapon Proficiencies", notes: "Any." },
        { name: "Nonweapon Proficiencies", notes: "Required: Appraising, Information Gathering. Recommended: Alertness, Fast-talking, Forgery, Gem Cutting, Local History, Observation." },
        { name: "Skill Progression", notes: "Less powerful Fences -- those lower in the network hierarchy, with fewer contacts -- may need to use thiefly skills. Picking pockets provides a little income when business is slow; opening locks and finding and removing traps are useful for inspecting merchandise. Read languages is sometimes useful in examining merchandise. More powerful Fences often neglect the stealth skills." },
        { name: "Equipment", notes: "Most Fences own equipment for examining merchandise, to determine whether goods are counterfeit or what their value might be -- a magnifying lens, for instance." }
      ],
      requirements: { int: 12, alignment: "Any" },
      benefits: "Minimum Intelligence 12. +3 on reactions with NPC thieves when his profession is recognized. Gains Information Gathering AND Appraising as bonus nonweapon proficiencies. Best placed of any kit to locate and hire thieves and smugglers.",
      hindrances: "Fences are relatively prominent in the underworld. Unlike freelance burglars and smugglers who can move from place to place, THE FENCE'S BLACK MARKET NETWORK REQUIRES A STABLE HOME LOCALE so that he can stay in touch with his contacts. The DM may wish to keep player characters from being active Fences because of this: the Fence's life is much more business than adventure. It also means LOCAL AUTHORITIES MAY BE AWARE OF A FENCE'S IDENTITY AND ACTIVITIES, and may periodically harass a minor Fence, demand bribes, or shake him up for information."
    },
    investigator: {
      name: "Investigator",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "37-38",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: -5, openLocks: 0, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 5, climbWalls: 0, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          required: ["Information Gathering", "Observation"],
          recommended: ["Alertness", "Appraising", "Disguise", "Fast-Talking", "Heraldry", "Intimidation", "Local History", "Languages, Modern", "Reading Lips", "Religion", "Trailing"]
        }
      },
      abilities: [
        { name: "Antithesis Of Criminals", notes: "Though Investigators are listed as thieves, they are usually in fact the antithesis of criminals -- enforcers of law and order, the people who know the skills of the thief intimately so that they can combat him." },
        { name: "Weapon Proficiencies", notes: "The normal range of weapons open to thieves. Investigators will normally carry two weapons, at least one of them concealed -- a knife, a dagger, or something similarly small, perhaps in a wrist sheath." },
        { name: "Nonweapon Proficiencies", notes: "Required: Information Gathering, Observation. Recommended: Alertness, Appraising, Disguise, Fast-Talking, Heraldry, Intimidation, Local History, Modern Languages, Reading Lips, Religion, Trailing." },
        { name: "Skill Progression", notes: "A balance of generalized skills serves Investigators well. Picking pockets is less important, although it may be useful for sleight-of-hand. Read languages is a must for deciphering clues; some criminals write important information in obscure languages or secret codes, and being able to decipher it may mean success or failure. Lockpicking, trap detection and disarmament are useful for penetrating and examining the hideouts and houses of suspects." },
        { name: "Equipment", notes: "A lot of the technological devices available to the modern Investigator -- fingerprinting techniques, searches of computer databases -- would not be available in a medieval fantasy setting. Still, it may be possible to duplicate some of the effects of such devices with magical items, or the DM can make liberal use of anachronism." },
        { name: "Race", notes: "Investigators may be of any race, though they probably should be of the dominant race in their area of operation. This means that most Investigators would be human. Operations that investigate guilds with many nonhuman members could make much use of nonhuman Investigators." }
      ],
      requirements: { alignment: "Any" },
      benefits: "No requirements. Information Gathering and Observation are required proficiencies. A balance of generalized thief skills, with read languages a must for deciphering clues.",
      hindrances: "Special Benefits: None. Special Hindrances: None."
    },
    scout: {
      name: "Scout",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "38-40",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: -5, openLocks: -5, findTraps: 0, moveSilently: 5, hideInShadows: 5, detectNoise: 0, climbWalls: 0, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          required: ["Direction Sense", "Tracking"],
          recommended: ["Alertness", "Animal Handling", "Animal Training", "Animal Lore", "Animal Noise", "Boating", "Fire-Building", "Fishing", "Heraldry", "Herbalism", "Hunting", "Mountaineering", "Observation", "Riding, Land-Based", "Rope Use", "Set Snares", "Survival", "Swimming", "Weather Sense"]
        }
      },
      abilities: [
        { name: "Wilderness Stealth", notes: "Due to their extensive wilderness experience and expertise, SCOUTS GAIN +10% ON TWO THIEF SKILLS WHEN IN THE WILDERNESS: SILENT MOVEMENT AND HIDING IN SHADOWS. This is situational and is NOT part of the flat Table 4 adjustment." },
        { name: "Wilderness Surprise", notes: "Scouts also have an INCREASED CHANCE (1 IN 6 BETTER) TO SURPRISE OPPONENTS IN THE WILDERNESS, because of their stealthiness and careful attunement with their environment." },
        { name: "Racial Wilderness Variants", notes: "The Scout kit is a good choice for demihuman rogues, since those races often already have an aptitude for wilderness adventuring. Demihuman Scouts may be given a particular orientation according to their race: ELVES, as natural forest dwellers, may have +15% WHEN HIDING IN SHADOWS AND MOVING SILENTLY IN FORESTED WILDERNESS, AND +5% IN OTHER WILDERNESS SETTINGS. FOR A DWARF, THE SPECIAL BONUS MAY APPLY TO HILLS OR MOUNTAINS, and so forth." },
        { name: "No Requirements", notes: "The Scout kit has no requirements beyond those of the thief class." },
        { name: "Weapon Proficiencies", notes: "Scouts have the normal range of weapon proficiencies permitted to thieves." },
        { name: "Nonweapon Proficiencies", notes: "Required: Direction Sense, Tracking. Recommended: Alertness, Animal Handling/Training, Animal Lore, Animal Noise, Boating, Fire-building, Fishing, Heraldry, Herbalism, Hunting, Mountaineering, Observation, Riding, Rope Use, Set Snares, Survival, Swimming, Weather Sense." },
        { name: "Skill Progression", notes: "Stealth skills are those favored most by the Scout, and members of this kit have highly trained senses -- so it makes sense for these skills to improve most rapidly: move silently, hide in shadows, and hear noise. Climb walls also may see considerable use, though not from climbing walls per se, but trees, cliffs and so forth." },
        { name: "Equipment", notes: "No self-respecting Scout will permit himself to go without a basic assortment of wilderness survival gear: adequate clothing, rations, fire-starting materials. Special gear to assist climbing, hiding and moving undetected is also favored, as well as devices for hindering or diverting pursuers." }
      ],
      requirements: { alignment: "Any" },
      benefits: "No requirements. +10% to move silently and hide in shadows IN THE WILDERNESS, and surprise opponents 1 in 6 better there. Elven Scouts may instead have +15% in forested wilderness and +5% in other wilderness; dwarven Scouts hills or mountains.",
      hindrances: "While Scouts are intimately familiar with the wilderness, THEY ARE NOT AS COMFORTABLE IN URBAN SETTINGS. IN THE CITY, CONSEQUENTLY, THE SCOUT SUFFERS A -5% PENALTY ON ALL THIEVES' SKILLS."
    },
    smuggler: {
      name: "Smuggler",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "39-42",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: -5, openLocks: -5, findTraps: 0, moveSilently: 5, hideInShadows: 5, detectNoise: 5, climbWalls: -5, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          recommended: ["Alertness", "Animal Handling", "Animal Training", "Animal Noise", "Appraising", "Boating", "Direction Sense", "Disguise", "Fast-Talking", "Forgery", "Information Gathering", "Navigation", "Observation", "Rope Use", "Seamanship", "Swimming"]
        }
      },
      abilities: [
        { name: "Exceptional Alertness", notes: "Smugglers must be exceptionally alert; THEY THEREFORE GET +1 BONUS TO THEIR SURPRISE ROLL." },
        { name: "No Requirements", notes: "The Smuggler kit has no requirements beyond those of the thief class." },
        { name: "Weapon Proficiencies", notes: "Smugglers have the normal range of weapons open to thieves, and are not required to take proficiencies with any in particular." },
        { name: "Nonweapon Proficiencies", notes: "Required: none. Recommended: Alertness, Animal Handling/Training, Animal Noise, Appraising, Boating, Direction Sense, Disguise, Fast-talking, Forgery, Information Gathering, Navigation, Observation, Rope Use, Seamanship, Swimming." },
        { name: "Skill Progression", notes: "Detecting noise is probably the most useful of the traditional thieves' skills for the Smuggler. After that, hiding in shadows and silent movement. Pickpocketing would be least utilized in smuggling." },
        { name: "Equipment", notes: "Two items are essential to the Smuggler's vocation: means of transportation, and means of protecting the contraband from discovery. Items from the Evasions section of the equipment chapter (p.90) are of great use -- marbles if the surface is right, or caltrops, can do much to hamper pursuers, and aniseed or dog pepper can throw dogs off the trail." },
        { name: "Race", notes: "While demihumans are not prohibited from being smugglers, there are few that have any reason to be. Any player who wishes to have a demihuman smuggler should be sure to detail his character background so as to justify the kit." }
      ],
      requirements: { alignment: "Any" },
      benefits: "No requirements. +1 bonus to the surprise roll. Detecting noise is the most useful traditional thief skill for this kit, followed by hiding in shadows and silent movement.",
      hindrances: "Special Hindrances: None."
    },
    spy: {
      name: "Spy",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "41-42",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: 0, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 0, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          required: ["Disguise", "Information Gathering", "Observation"],
          recommended: ["Alertness", "Begging", "Etiquette", "Forgery", "Heraldry", "Local History", "Reading/Writing", "Reading Lips", "Trailing"]
        }
      },
      abilities: [
        { name: "Minimum Intelligence", notes: "To take the Spy kit, a thief must have a MINIMUM INTELLIGENCE OF 11." },
        { name: "Nonthief Weapons For Disguise Only", notes: "The normal range of weapons open to thieves applies to Spies as well, and they are not required to take any in particular. A SPY CAN USE NONTHIEF WEAPONS FOR THE PURPOSE OF DISGUISES, BUT CANNOT TAKE PROFICIENCY IN THEM. Example: to help impersonate a castle guard, a Spy carries a halberd; he could use it in combat, but would suffer a nonproficiency penalty. To increase his chances of success he would probably switch to a familiar weapon -- even a dagger or knife -- unless circumstances prohibit it (people around him would be surprised to see him not using the halberd, and might thereby see through the disguise)." },
        { name: "Nonweapon Proficiencies", notes: "Required: Disguise, Information Gathering, Observation. Recommended: Alertness, Begging, Etiquette, Forgery, Heraldry, Local History, Reading/Writing, Reading Lips, Trailing." },
        { name: "Skill Progression", notes: "An effective Spy usually needs a fairly even distribution of thief skills, since his vocation can bring him into any number of diverse situations." },
        { name: "Equipment", notes: "Spies in the medieval setting do not have all the fancy gadgetry of their modern counterparts. They may equip themselves liberally with what is available, such as boots with hidden compartments in the soles, thieves' equipment, and so forth." },
        { name: "Race", notes: "Elves and half-elves, with their love for knowledge, are especially predisposed toward this kit. However, the problem that all demihuman Spies face is the difficulty of appearing disguised as a member of another race. They therefore risk having a rather limited range of professional assignments." },
        { name: "The Standard Penalty For Spying", notes: "The standard penalty for spying, if the crime is beyond the low levels of spreading rumors, eavesdropping, and scoping out potential burglary targets, IS DEATH, and Spies from one nation to another can hardly expect anything in the line of diplomatic immunity." }
      ],
      requirements: { int: 11, alignment: "Any" },
      benefits: "Minimum Intelligence 11. May carry nonthief weapons as part of a disguise, though he cannot gain proficiency in them. An even distribution of thief skills serves the Spy best.",
      hindrances: "Special Benefits: None. Special Hindrances: None. The standard penalty for spying beyond petty levels is death."
    },
    swashbuckler: {
      name: "Swashbuckler",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "42-43",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: 0, findTraps: -10, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 5, readLanguages: 5 },
      abilities: [
        { name: "Fighter THAC0 With Weapon Of Choice", notes: "The Swashbuckler receives an EXTRA WEAPON PROFICIENCY SLOT which MUST BE DEVOTED TO A WEAPON AMONG THE FOLLOWING: STILETTO, MAIN-GAUCHE, RAPIER OR SABRE. With this weapon of choice, THE THIEF IS ABLE TO FIGHT WITH THE THAC0 OF A FIGHTER OF HIS EXPERIENCE LEVEL. Throughout his career he MUST DEVOTE HALF OF HIS WEAPON PROFICIENCIES TO THESE WEAPONS, until he has mastered the use of (that is, gained proficiency in) every one." },
        { name: "Disarm Maneuver", notes: "Permitted a special combat maneuver when using his weapon of choice: DISARMAMENT. To disarm an opponent he must DECLARE HIS INTENTION TO DO SO BEFORE INITIATIVE IS ROLLED. He then suffers a +1 PENALTY TO HIS INITIATIVE ROLL, AND A -4 PENALTY ON HIS ATTACK ROLL. If the attack is successful, he will normally cause his enemy's weapon to go flying out of his hand: ROLL 2d6 FOR THE NUMBER OF FEET AWAY THE WEAPON LANDED, and another 1d6 for the direction relative to the disarmed character (1 straight ahead, 2 ahead right, 3 behind right, 4 straight behind, 5 behind left, 6 behind right). Besides weapons, DISARMAMENT CAN BE ATTEMPTED AGAINST MAGIC WANDS OR OTHER SUCH DEVICES HELD IN ONE HAND. ITEMS WORN, such as jewelry, OR HELD IN TWO HANDS, including two-handed weapons, MAY NOT BE AFFECTED." },
        { name: "Reaction Bonus", notes: "Being such a romantic figure, the Swashbuckler gains as an additional special benefit a +2 REACTION ADJUSTMENT WITH MEMBERS OF THE OPPOSITE SEX." },
        { name: "Cross-Class Kit", notes: "Both the warrior and thief classes have Swashbucklers -- see The Complete Fighter's Handbook for the warrior version. The differences serve, among other purposes, as an example of how the DM may modify appropriate kits from one class and apply them to another." },
        { name: "Nonweapon Proficiencies", notes: "Required: Etiquette, Tumbling. Recommended: Alertness, Blind-fighting, Disguise, Fast-talking, Intimidation, Jumping, Navigation (if seaborne; COSTS 2 SLOTS), Riding, Tightrope walking, Trailing." },
        { name: "Skill Progression", notes: "Swashbucklers tend to have fairly balanced thief skills. This includes pickpocketing, though that talent is more often utilized in the form of sleight of hand." }
      ],
      requirements: { str: 13, dex: 13, int: 13, cha: 13, alignment: "Any" },
      benefits: "Minimum 13 in Strength, Dexterity, Intelligence and Charisma. FIGHTS WITH THE THAC0 OF A FIGHTER OF HIS LEVEL when using his weapon of choice, plus an extra weapon proficiency slot devoted to it. A disarm maneuver, and +2 reaction adjustment with members of the opposite sex.",
      hindrances: "TROUBLE SEEKS OUT THE SWASHBUCKLER, and this is something the DM will have to play very carefully if the Swashbuckler is to be balanced with the other thief kits. When there is another Swashbuckler around -- thief or warrior -- intent on proving that he is the finest swordsman in the world, it is the PC Swashbuckler he seeks out and challenges, often in the middle of some illicit activity. When there is a lovely lady or handsome young man in distress, she or he will naturally cross the Swashbuckler's path and pull him into the tangle. Half of his weapon proficiencies are locked to the four weapons of choice until all are mastered."
    },
    swindler: {
      name: "Swindler",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "43-44",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: -5, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 0, readLanguages: 5 },
      proficiencies: {
        nonweapon: {
          required: ["Fast-Talking"],
          recommended: ["Alertness", "Appraising", "Artistic Ability", "Dancing", "Disguise", "Etiquette", "Forgery", "Fortune Telling", "Gaming", "Local History", "Observation", "Singing", "Ventriloquism"]
        }
      },
      abilities: [
        { name: "Minimum Charisma", notes: "A MINIMUM CHARISMA OF 12 is required of a thief to take this kit." },
        { name: "Master Of Deception", notes: "While burglars and pickpockets profit through stealth, and bandits and thugs garner their earnings through force, the Swindler relies on his wits. Other thieves take their booty; the Swindler cons his victim into giving it freely." },
        { name: "Weapon Proficiencies", notes: "The Swindler is permitted the normal range of weapons open to thieves." },
        { name: "Nonweapon Proficiencies", notes: "Required: Fast-talking. Recommended: Alertness, Appraising, Artistic Ability, Dancing, Disguise, Etiquette, Forgery, Fortune Telling, Gaming, Local History, Observation, Singing, Ventriloquism." },
        { name: "Skill Progression", notes: "The thieves' skills of a Swindler are usually used in preparation for a con. It is often handy for the Swindler to do some secret scouting -- to observe his victim's habits, for instance. For all of this, the stealth skills (move silently, etc.) are invaluable. Reading languages is also of more use to the Swindler than to thieves of many other kits." },
        { name: "Equipment", notes: "A Swindler may use special equipment as props for his scams -- tarot cards for a sham fortune teller; pen, ink and paper for forgery; and so forth -- but the specific needs vary among characters, according to their plans and objectives." },
        { name: "Race", notes: "HALF-ELVES MAKE PARTICULARLY GOOD SWINDLERS. Other demi-humans may be Swindlers as well, though they are not found as frequently." }
      ],
      requirements: { cha: 12, alignment: "Any" },
      benefits: "Minimum Charisma 12. Fast-talking is a required proficiency. Stealth skills are invaluable for scouting a mark, and reading languages is of more use to the Swindler than to most kits.",
      hindrances: "Special Benefits: None. Special Hindrances: None. Swindlers do not usually join thieves' guilds on a permanent basis, being wanderers by necessity; out of wise deference to the local boys, a Swindler operating in guild territory will make friendly overtures to it, and perhaps offer a share in his take."
    },
    thug: {
      name: "Thug",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "43-45",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: 0, openLocks: 0, findTraps: 0, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 0, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          required: ["Intimidation"],
          recommended: ["Alertness", "Endurance", "Looting", "Trailing"]
        }
      },
      discretionaryPoints: 40,
      discretionaryPointsPerLevel: 30,
      abilities: [
        { name: "Ability Requirements Include A CEILING", notes: "Because of the kit's emphasis on physique and physical prowess, a Thug must have MINIMUM ABILITY SCORES OF 12 IN STRENGTH AND CONSTITUTION. FURTHERMORE, HIS INTELLIGENCE MAY BE NO HIGHER THAN 12. THIS IS A MAXIMUM, NOT A MINIMUM -- the only ability CEILING in the thief kits, and it does not fit a minimums-only validator." },
        { name: "Combat Bonus", notes: "Because they are better trained in combat than other thieves, THUGS RECEIVE +1 ON THEIR TO HIT ROLLS." },
        { name: "Extra Weapon Proficiency", notes: "Thugs are permitted an EXTRA WEAPON PROFICIENCY SLOT AT FIRST LEVEL. They may choose nonthief weapons, but TO GAIN PROFICIENCY IN ONE REQUIRES AN EXTRA SLOT." },
        { name: "Nonweapon Proficiencies", notes: "Required: Intimidation. Recommended: player's choice; among those that may be selected are Alertness, Endurance, Looting and Trailing." },
        { name: "Skill Progression", notes: "There is no uniform preference among Thugs for the distribution of points among their thieves' skills. Note, however, that they start out with fewer points to distribute than other rogues." },
        { name: "Equipment", notes: "The Thug's equipment usually consists of the biggest, most intimidating weapon available. Otherwise it is a matter of common sense according to the job -- a kidnapper could make good use of a rope to bind his victim." },
        { name: "Race", notes: "HUMANOIDS AND HALF-HUMANOIDS are particularly fond of this kit, as it emphasizes force over stealth. One has more difficulty imagining demi-human Thugs; DWARVES might have the temperament, but the Thug personality doesn't suit their culture, and their small stature would make them look somewhat silly as guild enforcers -- which is not to say they would be ineffective." }
      ],
      requirements: { str: 12, con: 12, intMax: 12, alignment: "Any" },
      benefits: "Minimum Strength 12 and Constitution 12, and INTELLIGENCE NO HIGHER THAN 12. +1 on to-hit rolls, and an extra weapon proficiency slot at first level.",
      hindrances: "Thugs spend much of their early career learning about weapons and their use, and their INITIAL TRAINING IN THE TRADITIONAL THIEF SKILLS SUFFERS AS A CONSEQUENCE. To compensate for the extra weapon proficiency slot and combat bonus, a thief of the Thug kit HAS ONLY 40 POINTS TO DISTRIBUTE INITIALLY among his thief skills, although he can still put up to 30 of them in a single ability if he chooses. THE PER-LEVEL ALLOTMENT IS NOT REDUCED -- unlike the Assassin, the book states only the initial figure."
    },
    troubleshooter: {
      name: "Troubleshooter",
      class: "thief",
      source: {
        status: "verified",
        work:   "PHBR2 The Complete Thief's Handbook",
        pages:  "44-45",
        note:   "Transcribed from the book. Skill adjustments are Table 4 (p.24), cross-checked against Table 5."
      },
      thiefSkillMods: { pickPockets: -10, openLocks: 5, findTraps: 5, moveSilently: 0, hideInShadows: 0, detectNoise: 0, climbWalls: 0, readLanguages: 0 },
      proficiencies: {
        nonweapon: {
          required: ["Observation"],
          recommended: ["Alertness", "Fast-Talking", "Information Gathering", "Locksmithing", "Trailing"]
        }
      },
      abilities: [
        { name: "Security Consultant", notes: "Like the Investigator, often aligned against other thieves. He has all the skills of the thief, but puts them to a different use: he works chiefly as a security consultant, playing the part of the thief in order to test the worthiness of his clients' defenses." },
        { name: "Murphy's Law -- DELIBERATELY UNQUANTIFIED", notes: "Troubleshooters have an uncanny knack for troubleshooting: if there is a glitch somewhere in a security system, the Troubleshooter always seems to run into it. He is a living manifestation of Murphy's Law -- IF ANYTHING CAN GO WRONG, IT WILL. His job is to find everything that can go wrong, so it can be fixed. THE BOOK STATES OUTRIGHT THAT THIS IS DIFFICULT TO QUANTIFY AND DEFINE AS A GAME MECHANIC. Instead, the DM is encouraged to bring it in at his discretion during play, for maximum excitement and role-playing fun, filling the character's life with astronomically improbable events and bizarre coincidences. TWO QUESTIONS FOR THE DM before bringing it into play: would this further the plot of the adventure, and would it be fun? At least the second should be answered yes. THE RULE TO FOLLOW IN DECIDING THE SPECIFICS IS: EVERYTHING SHOULD BE BALANCED. FOR EVERY FREAKISH MISHAP THAT WORKS IN THE TROUBLESHOOTER'S FAVOR, THERE SHOULD BE A COMPLEMENTARY ONE THAT WORKS TO HIS DISADVANTAGE." },
        { name: "Weapon Proficiencies", notes: "Troubleshooters are permitted the normal weapons open to thieves." },
        { name: "Nonweapon Proficiencies", notes: "Required: Observation. Recommended: player's choice; among those that may be selected are Alertness, Fast-talking, Information Gathering, Locksmithing, and Trailing." },
        { name: "Skill Progression", notes: "Picking pockets and reading languages are not of much value to the Troubleshooter, but he will probably seek a fairly even distribution among the other thief skills." },
        { name: "Equipment", notes: "Any Troubleshooter worth his wages will augment his thiefly talents with the best available equipment; he wants to try his absolute best to break down his client's defense -- as does his client -- so he will use whatever devices will increase his chances. A wealthy client could even be persuaded to help the Troubleshooter acquire hard-to-find thief equipment." },
        { name: "Race", notes: "DWARVES, with their affinity for the mechanical and their lawful tendencies -- and their dour stoicism in the face of all misfortune, however ludicrous -- are the demi-humans most inclined to take this kit. SOME GNOMES also may be found as Troubleshooters; the special benefit/hindrance of this kit suits the pranksters well, but their employers would best be on guard for practical jokes perpetrated in the course of the assignment." }
      ],
      requirements: { alignment: "Any" },
      benefits: "No requirements. Observation is a required proficiency. As a security consultant he has a legitimate reason for his thieving skills and equipment. The Murphy's Law knack is a BENEFIT AND HINDRANCE AT ONCE, deliberately left unquantified by the book and adjudicated by the DM.",
      hindrances: "The same knack that finds every flaw also means things go wrong to the Troubleshooter's personal disadvantage. The book gives no mechanic; the DM is told to keep it balanced -- for every freakish mishap in his favor there should be a complementary one against him. Officials often keep a suspicious eye on well-known Troubleshooters, and more sophisticated governments may require that they have some sort of license."
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