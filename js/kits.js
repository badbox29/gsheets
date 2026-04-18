// === Character Kits (AD&D 2E) ===
// Kits from Complete [Class] Handbooks

// Kit data structure:
// - name: Kit name
// - class: Base class required
// - abilities: Special kit abilities
// - requirements: Ability score/alignment/etc requirements
// - benefits: Mechanical bonuses
// - hindrances: Restrictions/penalties

const KITS = {
  // ========== FIGHTER KITS ==========
  fighter: {
    berserker: {
      name: "Berserker",
      class: "fighter",
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
      abilities: [
        { name: "Animal Empathy", notes: "Can calm and befriend animals automatically" },
        { name: "Animal Companions", notes: "Can have multiple animal companions (2d4)" }
      ],
      requirements: { wis: 14, cha: 14, alignment: "Any good" },
      benefits: "+4 to animal handling checks. Animals never attack unless threatened.",
      hindrances: "Cannot have human henchmen. Must protect animals in need."
    },
    stalker: {
      name: "Stalker",
      class: "ranger",
      abilities: [
        { name: "Silent Movement", notes: "+10% to move silently and hide in shadows" },
        { name: "Ambush", notes: "Improved backstab ability (like thief)" }
      ],
      requirements: { dex: 15, alignment: "Any" },
      benefits: "Backstab at x2 damage. Improved tracking in all terrain.",
      hindrances: "No animal followers. -2 to reaction with good NPCs due to reputation."
    },
    explorer: {
      name: "Explorer",
      class: "ranger",
      abilities: [
        { name: "Pathfinding", notes: "Never gets lost in wilderness" },
        { name: "Terrain Master", notes: "Treats all terrain as favored terrain" }
      ],
      requirements: { int: 13, wis: 13, alignment: "Any" },
      benefits: "+2 to navigation checks. Can create maps. Party moves faster in wilderness.",
      hindrances: "Compulsion to explore unknown areas. Reduced combat bonuses."
    },
    feralan: {
      name: "Feralan",
      class: "ranger",
      abilities: [
        { name: "Raised by Animals", notes: "Think and act like animals, enhanced senses" },
        { name: "Natural Armor", notes: "AC bonus when wearing no armor" }
      ],
      requirements: { dex: 13, con: 14, alignment: "Any neutral" },
      benefits: "+2 AC bonus unarmored. Improved surprise rolls. Animal friendship.",
      hindrances: "Cannot use most equipment. Difficulty with human society and language."
    },
    greenwoodranger: {
      name: "Greenwood Ranger",
      class: "ranger",
      abilities: [
        { name: "Forest Guardian", notes: "Enhanced abilities in forests" },
        { name: "Tree Climbing", notes: "Climb trees as thief climbs walls" }
      ],
      requirements: { wis: 14, alignment: "Any good" },
      benefits: "Double tracking bonus in forests. +2 to saves vs plant-based attacks.",
      hindrances: "Must protect forests. Reduced abilities outside forested areas."
    },
    justifier: {
      name: "Justifier",
      class: "ranger",
      abilities: [
        { name: "Law Enforcement", notes: "Authority to enforce law in wilderness" },
        { name: "Detect Evil Intent", notes: "Sense criminal intent" }
      ],
      requirements: { wis: 14, alignment: "Lawful good" },
      benefits: "+2 to detect lies. Bonus when tracking criminals.",
      hindrances: "Must uphold law. Cannot keep treasure beyond necessities."
    },
    pathfinder: {
      name: "Pathfinder",
      class: "ranger",
      abilities: [
        { name: "Trailblazing", notes: "Create safe paths through dangerous terrain" },
        { name: "Guide", notes: "+2 to all party's wilderness survival checks" }
      ],
      requirements: { int: 13, alignment: "Any" },
      benefits: "Party never gets lost with pathfinder leading. +2 to tracking.",
      hindrances: "Must help lost travelers. Cannot refuse guide requests."
    },
    mountainman: {
      name: "Mountain Man",
      class: "ranger",
      abilities: [
        { name: "Mountain Terrain Master", notes: "Enhanced climbing and mountain survival" },
        { name: "Sure-Footed", notes: "Immune to altitude sickness, no falling damage from short falls" }
      ],
      requirements: { str: 13, con: 14, alignment: "Any" },
      benefits: "Climb as thief. +4 to survival in mountains. Cold resistance.",
      hindrances: "Reduced abilities in lowlands. Uncomfortable in cities."
    },
    searanger: {
      name: "Sea Ranger",
      class: "ranger",
      abilities: [
        { name: "Sailor", notes: "Expert at sailing and navigation at sea" },
        { name: "Underwater Combat", notes: "No penalties for underwater fighting" }
      ],
      requirements: { con: 13, alignment: "Any" },
      benefits: "Swim naturally. Track on water. +2 to weather prediction.",
      hindrances: "Must be near water regularly. Reduced tracking on land."
    },
    giantkiller: {
      name: "Giant Killer",
      class: "ranger",
      abilities: [
        { name: "Giant Slayer", notes: "+4 to hit giants (instead of +4 vs species enemy)" },
        { name: "Dodge Giants", notes: "-4 AC bonus vs giant attacks" }
      ],
      requirements: { str: 13, dex: 13, alignment: "Any good" },
      benefits: "Double damage bonus vs giants. Can use giant-sized weapons.",
      hindrances: "Species enemy must be giants. Giants always hostile."
    }
  },

  // ========== PALADIN KITS ==========
  paladin: {
    cavalier: {
      name: "Cavalier",
      class: "paladin",
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