// === Character Kits (AD&D 2E) ===
//
// Kit data structure:
// - name:         Kit name
// - class:        Base class required
// - source:       Provenance of this entry -- see PROVENANCE below
// - abilities:    Special kit abilities, painted into the Kit Abilities list
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
    berserker: {
      name: "Berserker",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Berserker Rage", notes: "Enter berserk state in combat: +2 to hit, +2 damage, -2 AC. Cannot retreat or use complex tactics while berserking." },
        { name: "Fearless", notes: "Immune to fear effects" }
      ],
      requirements: { str: 15, con: 15, alignment: "Any non-lawful" },
      benefits: "+2 to saves vs poison and paralyzation while berserking",
      hindrances: "Cannot use missile weapons. -3 reaction penalty with non-berserkers."
    },
    swashbuckler: {
      name: "Swashbuckler",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Lightly Armored Fighter", notes: "AC bonus improves with level when wearing light/no armor" },
        { name: "Improved Initiative", notes: "+2 bonus to initiative" }
      ],
      requirements: { str: 12, dex: 15, alignment: "Any" },
      benefits: "+1 to AC at 1st level, improves every 5 levels (max +4 at 17th). +1 to saves vs breath weapons",
      hindrances: "Cannot wear armor heavier than leather. Cannot use shields larger than buckler."
    },
    archer: {
      name: "Archer",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Point Blank Range", notes: "+2 to hit at point blank range (6 ft or less)" },
        { name: "Precise Shot", notes: "Shoot into melee without penalty to allies" }
      ],
      requirements: { str: 12, dex: 15, alignment: "Any" },
      benefits: "Specialization in bow costs 1 slot instead of 2. Starts with +1 to hit with bows.",
      hindrances: "Must specialize in a bow. -1 to hit with all melee weapons."
    },
    cavalier: {
      name: "Cavalier",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Horsemanship", notes: "Expert rider, +3 to all riding checks" },
        { name: "Mounted Combat", notes: "+1 to hit and damage when mounted" },
        { name: "Code of Honor", notes: "Must follow strict code of conduct" }
      ],
      requirements: { str: 15, dex: 12, alignment: "Lawful Good" },
      benefits: "Free weapon specialization in lance. Bonus followers at 9th level.",
      hindrances: "Must own and maintain horse and expensive equipment. Must tithe 33% of income."
    },
    myrmidon: {
      name: "Myrmidon",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Weapon Focus", notes: "Choose one weapon type - exceptional mastery" },
        { name: "Signature Move", notes: "Develop unique combat technique with chosen weapon" }
      ],
      requirements: { str: 13, alignment: "Any" },
      benefits: "Additional +1 to hit and damage with chosen weapon beyond specialization",
      hindrances: "Must specialize in chosen weapon at 1st level. -1 to hit with all other weapons."
    },
    savage: {
      name: "Savage",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Wilderness Warrior", notes: "Survival skills in wilderness, tracking ability" },
        { name: "Intimidating Presence", notes: "+2 to intimidation in combat" }
      ],
      requirements: { str: 13, con: 13, alignment: "Any non-lawful" },
      benefits: "Bonus to surprise opponents. Enhanced unarmed combat damage.",
      hindrances: "Cannot use complex mechanical devices. -2 reaction in civilized areas."
    },
    gladiator: {
      name: "Gladiator",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Arena Combat", notes: "Trained in showmanship and crowd-pleasing combat" },
        { name: "Dirty Tricks", notes: "Can attempt dirty fighting maneuvers" }
      ],
      requirements: { str: 13, con: 13, alignment: "Any" },
      benefits: "+1 to hit when fighting single opponent. Bonus to wrestling/grappling.",
      hindrances: "Must seek glory and recognition. -1 to teamwork situations."
    },
    pitfighter: {
      name: "Pit Fighter",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Unarmed Combat", notes: "Improved unarmed fighting capability" },
        { name: "Resilient", notes: "+1 hit point per level" }
      ],
      requirements: { str: 15, con: 15, alignment: "Any" },
      benefits: "Improved AC when unarmored. Double normal unarmed damage.",
      hindrances: "Cannot use shields. Distrusted in civilized society (-2 reaction)."
    },
    peasanthero: {
      name: "Peasant Hero",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Man of the People", notes: "+4 reaction bonus with common folk" },
        { name: "Improvised Weapons", notes: "No penalty when using improvised weapons" }
      ],
      requirements: { str: 13, alignment: "Any good" },
      benefits: "Can inspire common people to follow. Free weapon proficiency in improvised weapons.",
      hindrances: "Cannot use expensive equipment. Must help common folk in need."
    },
    amazon: {
      name: "Amazon",
      class: "fighter",
      source: {
        status: "unverified",
        work:   "PHBR1 The Complete Fighter's Handbook",
        pages:  null,
        note:   "Kit name matches the published list. Mechanics below are unsourced paraphrase and have not been checked against the book. Re-transcribe before relying on any number here."
      },
      abilities: [
        { name: "Warrior Society", notes: "Trained in all-female warrior culture" },
        { name: "Mounted Archery", notes: "Can use bow while mounted without penalty" }
      ],
      requirements: { str: 13, dex: 13, alignment: "Any", gender: "Female" },
      benefits: "+1 to saves vs charm/fear. Free weapon proficiency in javelin and short bow.",
      hindrances: "Cultural restrictions. May face prejudice in male-dominated societies."
    }
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
      requirements: { /* Standard -- the book sets no kit-specific minimum */ },
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
      requirements: { int: 12 },
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
      requirements: { /* Standard -- the book sets no kit-specific minimum */ },
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
        alignmentPrinted: "any good alignment, but not lawful"
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
      requirements: { cha: 12 },
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
      requirements: { str: 15, dex: 15 },
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
      requirements: { race: "Human" },
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
      abilities: [
        { name: "Domain", notes: "Every Guardian has a specific region he protects. The DM establishes the boundaries at the beginning of his career. There are no fixed rules, but in general a 1st level Guardian's domain should not exceed a few square miles; it expands by several square miles each time he gains a level. By 5th level it might encompass a region about 20-25 miles across, and by 15th level or higher it might comprise an area the size of a small country. It should correspond to his primary terrain and is typically in an uncivilized part of the world. Two or more Guardians may share an especially large domain, but such cases are rare." },
        { name: "Bonus Sphere: Protection", notes: "Minor access to the Protection sphere." },
        { name: "Bonus Spells Within His Domain", notes: "Can cast certain spells within the boundaries of his domain: detect evil three times per day, and bless and commune with nature once per week each." },
        { name: "Revive Plants", notes: "Can revitalize any type of natural plant life suffering from drought, disease, insect infestation, or other forms of non-magical trauma. Dead plants cannot be affected, nor can he invigorate plants beyond their normal limits -- he cannot cause an apple tree to blossom in the winter. The process requires 8 hours and affects a square area whose sides are 10 yards times his level; a 5th level Guardian can revive all plant life within a 50 yd. x 50 yd. square. Usable once per month." },
        { name: "Bonus Proficiency: Hunting or Fishing", notes: "Recommended: Agriculture, Bowyer/Fletcher, Fire-building, Fishing, Foraging, Herbalism, Hunting, Riding (Land-based), Rope Use, Set Snares, Swimming, Veterinary Healing, Weather Sense." },
        { name: "Tied to His Domain", notes: "If he leaves his domain for any length of time he must make arrangements for someone else to assume his duties -- hiring a caretaker, or assigning temporary custody to a human or demihuman follower. There are no fixed penalties for failing to do so. However, should he abandon his responsibilities for more than a few days, the gods may deny him the use of the special benefits associated with this kit. If he is absent for longer periods -- say, a few weeks -- the gods may also deny him the use of ALL spells. He recovers the use of his special benefits and spells as soon as he returns to his domain." },
        { name: "At Least One Humanoid Follower", notes: "Acquires at least one human or demihuman follower at some point in his career. There are no other restrictions or recommendations." }
      ],
      requirements: { /* Standard -- the book sets no kit-specific minimum */ },
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
        alignmentPrinted: "lawful good"
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
      requirements: { str: 14, con: 15, race: "Not a full elf" },
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
      requirements: { /* Same as standard ranger -- the book sets no kit-specific minimum */ },
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
      requirements: { int: 12 },
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
      requirements: { wis: 15 },
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
      requirements: { int: 14, race: "Human" },
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
        alignmentPrinted: "any non-chaotic alignment"
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
      requirements: { int: 14 },
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
      requirements: {},
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
      requirements: { wis: 15, alignment: "Neutral" },
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