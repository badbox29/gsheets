// === Magical Defense Adjustment ===
const WIS_MDA = {
  1:-6, 2:-4, 3:-3, 4:-2, 5:-1, 6:-1,
  7:-1, 8:0, 9:0, 10:0, 11:0, 12:0,
  13:0, 14:0, 15:1, 16:2, 17:3, 18:4,
  19:4, 20:4, 21:4, 22:4, 23:4, 24:4, 25:4
};

// === Spell failure priests only ===
const WIS_FAILURE = {
  1:"80%", 2:"60%", 3:"50%", 4:"45%", 5:"40%", 6:"35%",
  7:"30%", 8:"25%", 9:"20%", 10:"15%", 11:"10%", 12:"5%"
};

// === Immunities ===
const WIS_IMMUNITIES = {
  19:"cause fear, charm person, command, friends, hypnotism", 
  20:"cause fear, charm person, command, friends, hypnotism, forget, hold person, ray of enfeeblement, scare",
  21:"cause fear, charm person, command, friends, hypnotism, forget, hold person, ray of enfeeblement, scare, fear",
  22:"cause fear, charm person, command, friends, hypnotism, forget, hold person, ray of enfeeblement, scare, fear, charm monster, confusion, emotion, fumble, suggestion",
  23:"cause fear, charm person, command, friends, hypnotism, forget, hold person, ray of enfeeblement, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster, magic jar, quest",
  24:"cause fear, charm person, command, friends, hypnotism, forget, hold person, ray of enfeeblement, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster, magic jar, quest, geas, mass suggestion, rod of rulership",
  25:"cause fear, charm person, command, friends, hypnotism, forget, hold person, ray of enfeeblement, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster, magic jar, quest, geas, mass suggestion, rod of rulership, antipathy/sympathy, death spell, mass charm"
};
	
// Wisdom spell failure (for priests only)
const WIS_SPELL_FAILURE = {
  1: "80%",
  2: "80%",
  3: "50%",
  4: "30%",
  5: "30%",
  6: "20%",
  7: "20%",
  8: "20%"
  // 9+ = none
};

// Charisma Table
const CHA_TABLE = {
  1:  { reaction: -7, henchmen: 0, loyalty: -8 },
  2:  { reaction: -6, henchmen: 1, loyalty: -7 },
  3:  { reaction: -5, henchmen: 1, loyalty: -6 },
  4:  { reaction: -4, henchmen: 1, loyalty: -5 },
  5:  { reaction: -3, henchmen: 2, loyalty: -4 },
  6:  { reaction: -2, henchmen: 2, loyalty: -3 },
  7:  { reaction: -1, henchmen: 3, loyalty: -2 },
  8:  { reaction: 0, henchmen: 3, loyalty: -1 },
  9:  { reaction: 0,  henchmen: 4, loyalty: 0 },
  10: { reaction: 0,  henchmen: 4, loyalty: 0 },
  11: { reaction: 0,  henchmen: 4, loyalty: 0 },
  12: { reaction: 0,  henchmen: 5, loyalty: 0 },
  13: { reaction: +1, henchmen: 5, loyalty: 0 },
  14: { reaction: +2, henchmen: 6, loyalty: 1 },
  15: { reaction: +3, henchmen: 7, loyalty: 3 },
  16: { reaction: +5, henchmen: 8, loyalty: 4 },
  17: { reaction: +6, henchmen: 10, loyalty: 6 },
  18: { reaction: +7, henchmen: 15, loyalty: 8 },
  19: { reaction: +8, henchmen: 20, loyalty: 10 },
  20: { reaction: +9, henchmen: 25, loyalty: 12 },
  21: { reaction: +10, henchmen: 30, loyalty: 14 },
  22: { reaction: +11, henchmen: 35, loyalty: 16 },
  23: { reaction: +12, henchmen: 40, loyalty: 18 },
  24: { reaction: +13, henchmen: 45, loyalty: 20 },
  25: { reaction: +14, henchmen: 50, loyalty: 20 }
};

	
const RACE_SAVE_BONUSES = {
  dwarf: {
    0: ({con}) => {  // Paralyzation/Poison/Death
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    },
    1: ({con}) => {  // Rod/Staff/Wand
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    },
    4: ({con}) => {  // Spell
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    }
  },
  halfling: {
    0: ({con}) => {  // Paralyzation/Poison/Death
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    },
    1: ({con}) => {  // Rod/Staff/Wand
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    },
    4: ({con}) => {  // Spell
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    }
  },
  gnome: {
    0: ({con}) => {  // Paralyzation/Poison/Death
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    },
    1: ({con}) => {  // Rod/Staff/Wand
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    },
    4: ({con}) => {  // Spell
      if (con >= 19) return -3;
      if (con >= 17) return -2;
      if (con >= 14) return -1;
      return 0;
    }
  }
};

// === Combat & Exploration Bonuses ===
// Quick reference for abilities players might forget in combat/exploration
// Excludes: save bonuses (calculated elsewhere), detection abilities (separate section)

const RACIAL_COMBAT_BONUSES = {
  dwarf: {
    combat: [
      { name: "Attack Bonus", notes: "+1 to hit orcs, half-orcs, goblins, hobgoblins" }
    ],
    defensive: [
      { name: "AC Bonus vs Giants", notes: "Giants, ogres, trolls, ogre magi, titans get -4 to hit you" }
    ],
    special: []
  },
  gnome: {
    combat: [
      { name: "Attack Bonus", notes: "+1 to hit kobolds and goblins" }
    ],
    defensive: [
      { name: "AC Bonus vs Giants", notes: "Gnolls, bugbears, ogres, trolls, ogre magi, giants, titans get -4 to hit you" }
    ],
    special: []
  },
  halfling: {
    combat: [
      { name: "Ranged Attack Bonus", notes: "+1 to hit with slings and thrown weapons" }
    ],
    defensive: [
      { name: "AC Bonus vs Large", notes: "Creatures larger than man-sized get -4 to hit you" }
    ],
    special: []
  },
  elf: {
    combat: [
      { name: "Weapon Bonus", notes: "+1 to hit with longsword, shortsword, longbow, shortbow" }
    ],
    defensive: [],
    special: [
      { name: "Sleep/Charm Resistance", notes: "90% resistant to sleep and charm spells" }
    ]
  },
  "half-elf": {
    combat: [],
    defensive: [],
    special: [
      { name: "Sleep/Charm Resistance", notes: "30% resistant to sleep and charm spells" }
    ]
  },
  halfelf: {
    combat: [],
    defensive: [],
    special: [
      { name: "Sleep/Charm Resistance", notes: "30% resistant to sleep and charm spells" }
    ]
  },
  human: {
    combat: [],
    defensive: [],
    special: []
  },
  "half-orc": {
    combat: [],
    defensive: [],
    special: []
  },
  halforc: {
    combat: [],
    defensive: [],
    special: []
  }
};

const CLASS_COMBAT_BONUSES = {
  fighter: {
    combat: [],
    defensive: [],
    special: []
  },
  paladin: {
    combat: [],
    defensive: [],
    special: [
      { name: "Detect Evil", notes: "60 ft range, at will", level: 1 },
      { name: "Lay on Hands", notes: "2 HP per level, once per day", level: 1, calculated: true },
      { name: "Immunity to Disease", notes: "Immune to all diseases", level: 1 },
      { name: "Turn Undead", notes: "As cleric of 2 levels lower", level: 3 }
    ]
  },
  ranger: {
    combat: [
      { name: "Species Enemy", notes: "+4 to hit against chosen creature type", level: 1 }
    ],
    defensive: [],
    special: [
      { name: "Tracking", notes: "Track creatures in wilderness", level: 1 },
      { name: "Two-Weapon Fighting", notes: "Reduced penalties fighting with two weapons", level: 1 }
    ]
  },
  cleric: {
    combat: [],
    defensive: [],
    special: [
      { name: "Turn Undead", notes: "Can turn or destroy undead creatures", level: 1 }
    ]
  },
  druid: {
    combat: [],
    defensive: [],
    special: [
      { name: "Identify Plants/Animals", notes: "Automatically identify plants, animals, pure water", level: 3 },
      { name: "Woodland Charm Immunity", notes: "Immune to charm spells from woodland creatures", level: 7 }
    ]
  },
  mage: {
    combat: [],
    defensive: [],
    special: []
  },
  illusionist: {
    combat: [],
    defensive: [],
    special: []
  },
  thief: {
    combat: [
      { name: "Backstab ×2", notes: "Double damage from behind (levels 1-4)", level: 1, maxLevel: 4 },
      { name: "Backstab ×3", notes: "Triple damage from behind (levels 5-8)", level: 5, maxLevel: 8 },
      { name: "Backstab ×4", notes: "Quadruple damage from behind (levels 9-12)", level: 9, maxLevel: 12 },
      { name: "Backstab ×5", notes: "×5 damage from behind (levels 13+)", level: 13 }
    ],
    defensive: [],
    special: []
  },
  bard: {
    combat: [],
    defensive: [],
    special: [
      { name: "Counter Song", notes: "Negate sound-based attacks in 30 ft radius", level: 2 }
    ]
  }
};

const KIT_COMBAT_BONUSES = {
  // Fighter Kits
  berserker: {
    combat: [
      { name: "Berserker Rage", notes: "+2 to hit, +2 damage, -2 AC while berserking. Cannot retreat or use complex tactics." }
    ],
    defensive: [],
    special: [
      { name: "Fearless", notes: "Immune to fear effects" }
    ]
  },
  swashbuckler: {
    combat: [
      { name: "Improved Initiative", notes: "+2 bonus to initiative" }
    ],
    defensive: [
      { name: "AC Bonus", notes: "+1 to AC at 1st level, improves every 5 levels (max +4 at 17th) when wearing light/no armor" }
    ],
    special: []
  },
  archer: {
    combat: [
      { name: "Point Blank Range", notes: "+2 to hit at point blank range (6 ft or less) with bows" },
      { name: "Precise Shot", notes: "Shoot into melee without penalty to allies" },
      { name: "Bow Specialist", notes: "+1 to hit with bows (beyond normal bonuses)" }
    ],
    defensive: [],
    special: []
  },
  cavalier: {
    combat: [
      { name: "Mounted Combat", notes: "+1 to hit and damage when mounted" },
      { name: "Horsemanship", notes: "+3 to all riding checks" }
    ],
    defensive: [],
    special: []
  },
  myrmidon: {
    combat: [
      { name: "Weapon Focus", notes: "+1 to hit and damage with chosen weapon (beyond specialization)" }
    ],
    defensive: [],
    special: []
  },
  savage: {
    combat: [],
    defensive: [],
    special: [
      { name: "Wilderness Warrior", notes: "Survival skills and tracking ability in wilderness" },
      { name: "Intimidating Presence", notes: "+2 to intimidation in combat" }
    ]
  },
  gladiator: {
    combat: [
      { name: "Arena Combat", notes: "+1 to hit when fighting single opponent" }
    ],
    defensive: [],
    special: [
      { name: "Dirty Tricks", notes: "Can attempt dirty fighting maneuvers" }
    ]
  },
  pitfighter: {
    combat: [],
    defensive: [],
    special: [
      { name: "Unarmed Combat", notes: "Improved unarmed fighting capability" },
      { name: "Resilient", notes: "+1 hit point per level" }
    ]
  },
  
  // Paladin Kits
  "cavalier-paladin": {
    combat: [
      { name: "Mounted Excellence", notes: "+3 to hit when mounted" }
    ],
    defensive: [],
    special: []
  },
  divinate: {
    combat: [],
    defensive: [],
    special: [
      { name: "Divine Insight", notes: "Can cast augury 1/day" },
      { name: "Aura Reading", notes: "Detect evil extended to 90 ft" }
    ]
  },
  errant: {
    combat: [
      { name: "Champion of the Helpless", notes: "+2 to hit when defending innocents" }
    ],
    defensive: [],
    special: []
  },
  ghosthunter: {
    combat: [
      { name: "Undead Hunter", notes: "+2 to hit vs undead" },
      { name: "Turn Undead Enhancement", notes: "Turn undead as cleric 2 levels higher", replacesClassAbility: "Turn Undead" }
    ],
    defensive: [],
    special: [
      { name: "Spirit Sense", notes: "Detect undead at 60 ft" },
      { name: "Immunity to Energy Drain", notes: "Immune to energy drain" },
      { name: "See Invisible Undead", notes: "Can see invisible undead" }
    ]
  },
  inquisitor: {
    combat: [],
    defensive: [],
    special: [
      { name: "Detect Lie", notes: "Can detect lies 3/day" },
      { name: "Interrogation", notes: "+4 to gather information" }
    ]
  },
  medician: {
    combat: [],
    defensive: [],
    special: [
      { name: "Enhanced Healing", notes: "Lay on hands heals 3 HP per level (instead of 2)", replacesClassAbility: "Lay on Hands" }
    ]
  },
  militarist: {
    combat: [],
    defensive: [],
    special: [
      { name: "Inspiring Commander", notes: "Grant +1 to morale to troops within 30 ft" }
    ]
  },
  wyrmslayer: {
    combat: [
      { name: "Dragon Slayer", notes: "+4 to hit dragons" }
    ],
    defensive: [],
    special: [
      { name: "Dragon Fear Immunity", notes: "Immune to dragon fear auras" },
      { name: "Detect Dragons", notes: "Detect dragons within 120 ft" }
    ]
  }
};

const KIT_SAVE_BONUSES = {
  swashbuckler: {
    3: () => -1 // +1 bonus vs Breath Weapon (lower save = better)
  },
  berserker: {
    0: () => -2 // +2 bonus vs poison/paralyzation while berserking (lower save = better)
  },
  amazon: {
    4: () => -1 // +1 bonus vs charm/fear spells (lower save = better)
  }
};

// Ability-based bonuses
// NOTE: Constitution bonuses are handled in RACE_SAVE_BONUSES (dwarves, gnomes, halflings)
// NOTE: Wisdom bonuses are handled by WIS_MDA + renderWisdomSaveAdjustments() in calc.js
// No other ability scores provide direct saving throw bonuses in AD&D 2e
const ABILITY_SAVE_BONUSES = {};

// Centralized mapping of all supported classes
const CLASS_CATEGORIES = {
  // Warriors
  "fighter": "warrior",
  "ranger": "warrior",
  "paladin": "warrior",
  "demipaladin": "warrior",
  "hb_dpaladin": "warrior",
  "warrior": "warrior",

  // Priests
  "cleric": "priest",
  "druid": "priest",
  "priest": "priest",

  // Rogues
  "thief": "rogue",
  "bard": "rogue",
  "rogue": "rogue",

  // Wizards
  "mage": "wizard",
  "wizard": "wizard",
  "illusionist": "wizard",
  "specialist": "wizard",
};

// HP bonus per level: [non-warrior, warrior]
const CON_HP_BONUS = {
  1:[-3,-3], 2:[-2,-2], 3:[-2,-2], 4:[-1,-1], 5:[-1,-1],
  6:[-1,-1],   7:[0,0],   8:[0,0],   9:[0,0],   10:[0,0],
  11:[0,0],  12:[0,0],  13:[0,0],  14:[0,0],  15:[1,1],
  16:[2,2],  17:[2,3],  18:[2,4],  19:[2,5],  20:[2,5],
  21:[2,6],  22:[2,6],  23:[2,7],  24:[2,7],  25:[2,8]
};

const CON_SYSTEM_SHOCK = {
  1:25, 2:30, 3:35, 4:40, 5:45, 6:50, 7:55, 8:60, 9:65, 10:70,
  11:75, 12:80, 13:85, 14:88, 15:90, 16:95, 17:97, 18:99,
  19:99, 20:99, 21:99, 22:99, 23:99, 24:99, 25:99
};

const CON_RESURRECTION = {
  1:30, 2:35, 3:40, 4:45, 5:50, 6:55, 7:60, 8:65, 9:70, 10:75,
  11:80, 12:85, 13:90, 14:92, 15:94, 16:96, 17:98, 18:100,
  19:100, 20:100, 21:100, 22:100, 23:100, 24:100, 25:100
};
	
const CON_POISON_ADJ = {
  1:-2, 2:-1, 3:-1, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0,
  11:0, 12:0, 13:0, 14:0, 15:0, 16:0, 17:0, 18:0,
  19:+1, 20:+2, 21:+2, 22:+3, 23:+3, 24:+4, 25:+4
};

const CON_REGENERATION = {
  20: "1 HP/6 turns",
  21: "1 HP/5 turns",
  22: "1 HP/5 turns",
  23: "1 HP/4 turns",
  24: "1 HP/3 turns",
  25: "1 HP/2 turns"
};

// === Saving Throw Tables (AD&D 2e) ===
// Format: [Paralyzation/Poison/Death, Rod/Staff/Wand, Petrification/Polymorph, Breath Weapon, Spell]
const SAVES = {
  warrior: [
    { level: 0,  saves: [16,18,17,20,19] },
    { level: 1,  saves: [14,16,15,17,17] },
    { level: 2,  saves: [14,16,15,17,17] },
    { level: 3,  saves: [13,15,14,16,16] },
    { level: 4,  saves: [13,15,14,16,16] },
    { level: 5,  saves: [11,13,12,13,14] },
    { level: 6,  saves: [11,13,12,13,14] },
    { level: 7,  saves: [10,12,11,12,13] },
    { level: 8,  saves: [10,12,11,12,13] },
    { level: 9,  saves: [8,10,9,9,11] },
    { level: 10, saves: [8,10,9,9,11] },
    { level: 11, saves: [7,9,8,8,10] },
    { level: 12, saves: [7,9,8,8,10] },
    { level: 13, saves: [5,7,6,5,8] },
    { level: 14, saves: [5,7,6,5,8] },
    { level: 15, saves: [4,6,5,4,7] },
    { level: 16, saves: [4,6,5,4,7] },
    { level: 17, saves: [3,5,4,4,6] },
    { level: 18, saves: [3,5,4,4,6] },
    { level: 19, saves: [3,5,4,4,6] },
    { level: 20, saves: [3,5,4,4,6] },
    { level: 21, saves: [3,5,4,4,6] },
    { level: 22, saves: [3,5,4,4,6] },
    { level: 23, saves: [3,5,4,4,6] },
    { level: 24, saves: [3,5,4,4,6] },
    { level: 25, saves: [3,5,4,4,6] }
  ],
  priest: [
    { level: 1,  saves: [10,14,13,16,15] },
    { level: 2,  saves: [10,14,13,16,15] },
    { level: 3,  saves: [10,14,13,16,15] },
    { level: 4,  saves: [9,13,12,15,14] },
    { level: 5,  saves: [9,13,12,15,14] },
    { level: 6,  saves: [9,13,12,15,14] },
    { level: 7,  saves: [7,11,10,13,12] },
    { level: 8,  saves: [7,11,10,13,12] },
    { level: 9,  saves: [7,11,10,13,12] },
    { level: 10, saves: [6,10,9,12,11] },
    { level: 11, saves: [6,10,9,12,11] },
    { level: 12, saves: [6,10,9,12,11] },
    { level: 13, saves: [5,9,8,11,10] },
    { level: 14, saves: [5,9,8,11,10] },
    { level: 15, saves: [5,9,8,11,10] },
    { level: 16, saves: [4,8,7,10,9] },
    { level: 17, saves: [4,8,7,10,9] },
    { level: 18, saves: [4,8,7,10,9] },
    { level: 19, saves: [2,6,5,8,7] },
    { level: 20, saves: [2,6,5,8,7] },
    { level: 21, saves: [2,6,5,8,7] },
    { level: 22, saves: [2,6,5,8,7] },
    { level: 23, saves: [2,6,5,8,7] },
    { level: 24, saves: [2,6,5,8,7] },
    { level: 25, saves: [2,6,5,8,7] }
  ],
  rogue: [
    { level: 1,  saves: [13,14,12,16,15] },
    { level: 2,  saves: [13,14,12,16,15] },
    { level: 3,  saves: [13,14,12,16,15] },
    { level: 4,  saves: [13,14,12,16,15] },
    { level: 5,  saves: [12,12,11,15,13] },
    { level: 6,  saves: [12,12,11,15,13] },
    { level: 7,  saves: [12,12,11,15,13] },
    { level: 8,  saves: [12,12,11,15,13] },
    { level: 9,  saves: [11,10,10,14,11] },
    { level: 10, saves: [11,10,10,14,11] },
    { level: 11, saves: [11,10,10,14,11] },
    { level: 12, saves: [11,10,10,14,11] },
    { level: 13, saves: [10,8,9,13,9] },
    { level: 14, saves: [10,8,9,13,9] },
    { level: 15, saves: [10,8,9,13,9] },
    { level: 16, saves: [10,8,9,13,9] },
    { level: 17, saves: [9,6,8,12,7] },
    { level: 18, saves: [9,6,8,12,7] },
    { level: 19, saves: [9,6,8,12,7] },
    { level: 20, saves: [9,6,8,12,7] },
    { level: 21, saves: [8,4,7,11,5] },
    { level: 22, saves: [8,4,7,11,5] },
    { level: 23, saves: [8,4,7,11,5] },
    { level: 24, saves: [8,4,7,11,5] },
    { level: 25, saves: [8,4,7,11,5] }
  ],
  wizard: [
    { level: 1,  saves: [14,11,13,15,12] },
    { level: 2,  saves: [14,11,13,15,12] },
    { level: 3,  saves: [14,11,13,15,12] },
    { level: 4,  saves: [14,11,13,15,12] },
    { level: 5,  saves: [14,11,13,15,12] },
    { level: 6,  saves: [13,9,11,13,10] },
    { level: 7,  saves: [13,9,11,13,10] },
    { level: 8,  saves: [13,9,11,13,10] },
    { level: 9,  saves: [13,9,11,13,10] },
    { level: 10, saves: [13,9,11,13,10] },
    { level: 11, saves: [11,7,9,11,8] },
    { level: 12, saves: [11,7,9,11,8] },
    { level: 13, saves: [11,7,9,11,8] },
    { level: 14, saves: [11,7,9,11,8] },
    { level: 15, saves: [11,7,9,11,8] },
    { level: 16, saves: [10,5,7,9,6] },
    { level: 17, saves: [10,5,7,9,6] },
    { level: 18, saves: [10,5,7,9,6] },
    { level: 19, saves: [10,5,7,9,6] },
    { level: 20, saves: [10,5,7,9,6] },
    { level: 21, saves: [8,3,5,7,4] },
    { level: 22, saves: [8,3,5,7,4] },
    { level: 23, saves: [8,3,5,7,4] },
    { level: 24, saves: [8,3,5,7,4] },
    { level: 25, saves: [8,3,5,7,4] }
  ]
};

const SPELL_SLOTS_TABLES = {
  cleric: {
    1:[1,0,0,0,0,0,0,0,0],   2:[2,0,0,0,0,0,0,0,0],   3:[2,1,0,0,0,0,0,0,0],   4:[3,2,0,0,0,0,0,0,0],
    5:[3,3,1,0,0,0,0,0,0],   6:[3,3,2,0,0,0,0,0,0],   7:[3,3,2,1,0,0,0,0,0],   8:[3,3,3,2,0,0,0,0,0],
    9:[4,4,3,2,1,0,0,0,0],  10:[4,4,3,3,2,0,0,0,0],  11:[5,4,4,3,2,1,0,0,0],  12:[6,5,5,3,2,2,0,0,0],
    13:[6,6,6,4,2,2,1,0,0], 14:[6,6,6,5,3,2,2,0,0],  15:[7,7,7,6,4,3,2,1,0], 16:[7,7,7,7,5,3,2,2,0],
    17:[8,8,8,8,6,4,3,2,1], 18:[9,9,9,8,6,4,3,3,2],  19:[9,9,9,9,7,5,4,3,2], 20:[9,9,9,9,8,6,5,4,3]
  },
  druid: {
    1:[2,0,0,0,0,0,0,0,0],   2:[2,0,0,0,0,0,0,0,0],   3:[3,1,0,0,0,0,0,0,0],   4:[4,2,0,0,0,0,0,0,0],
    5:[4,3,1,0,0,0,0,0,0],   6:[4,3,2,0,0,0,0,0,0],   7:[4,4,2,1,0,0,0,0,0],   8:[4,4,3,2,0,0,0,0,0],
    9:[5,4,3,2,1,0,0,0,0],  10:[5,4,3,3,2,0,0,0,0],  11:[5,5,4,3,2,1,0,0,0],  12:[6,5,4,3,2,2,0,0,0],
    13:[6,5,4,4,3,2,1,0,0], 14:[6,6,5,5,3,2,2,0,0],  15:[7,7,6,5,4,3,2,1,0], 16:[7,7,6,6,5,3,2,2,0],
    17:[8,8,7,7,6,4,3,2,1], 18:[9,8,8,7,6,4,3,3,2],  19:[9,9,8,8,7,5,4,3,2], 20:[9,9,9,8,8,6,5,4,3]
  },
  mage: {
    1:[1,0,0,0,0,0,0,0,0],   2:[2,0,0,0,0,0,0,0,0],   3:[2,1,0,0,0,0,0,0,0],   4:[3,2,0,0,0,0,0,0,0],
    5:[4,2,1,0,0,0,0,0,0],   6:[4,2,2,0,0,0,0,0,0],   7:[4,3,2,1,0,0,0,0,0],   8:[4,3,3,2,0,0,0,0,0],
    9:[4,4,3,2,1,0,0,0,0],  10:[4,4,4,2,2,0,0,0,0],  11:[4,4,4,3,2,2,1,0,0],  12:[4,4,4,3,3,2,2,0,0],
    13:[4,4,4,3,3,3,2,1,0], 14:[4,4,4,3,3,3,2,2,0],  15:[4,4,4,3,3,3,3,2,1], 16:[4,4,4,3,3,3,3,2,2],
    17:[4,4,4,3,3,3,3,3,2], 18:[4,4,4,3,3,3,3,3,2],  19:[4,4,4,3,3,3,3,3,3], 20:[4,4,4,3,3,3,3,3,3]
  },
  bard: {
    1:[0,0,0,0,0,0,0,0,0],   2:[1,0,0,0,0,0,0,0,0],   3:[2,0,0,0,0,0,0,0,0],   4:[2,1,0,0,0,0,0,0,0],
    5:[3,1,0,0,0,0,0,0,0],   6:[3,2,0,0,0,0,0,0,0],   7:[3,2,1,0,0,0,0,0,0],   8:[3,3,1,0,0,0,0,0,0],
    9:[3,3,2,0,0,0,0,0,0],  10:[3,3,2,1,0,0,0,0,0],  11:[3,3,3,1,0,0,0,0,0],  12:[3,3,3,2,0,0,0,0,0],
    13:[3,3,3,2,1,0,0,0,0], 14:[3,3,3,3,1,0,0,0,0],  15:[3,3,3,3,2,0,0,0,0], 16:[4,3,3,3,2,1,0,0,0],
    17:[4,4,3,3,3,1,0,0,0], 18:[4,4,4,3,3,2,0,0,0],  19:[4,4,4,4,3,2,1,0,0], 20:[4,4,4,4,4,3,1,0,0]
  },
  paladin: {
    1:[0,0,0,0,0,0,0,0,0],   2:[0,0,0,0,0,0,0,0,0],   3:[0,0,0,0,0,0,0,0,0],   4:[0,0,0,0,0,0,0,0,0],
    5:[0,0,0,0,0,0,0,0,0],   6:[1,0,0,0,0,0,0,0,0],   7:[2,0,0,0,0,0,0,0,0],   8:[2,1,0,0,0,0,0,0,0],
    9:[2,2,0,0,0,0,0,0,0],  10:[2,2,1,0,0,0,0,0,0],  11:[2,2,1,1,0,0,0,0,0],  12:[2,2,2,1,0,0,0,0,0],
    13:[2,2,2,1,0,0,0,0,0], 14:[3,2,2,1,0,0,0,0,0],  15:[3,3,2,1,0,0,0,0,0], 16:[3,3,3,1,0,0,0,0,0],
    17:[3,3,3,2,0,0,0,0,0], 18:[3,3,3,2,0,0,0,0,0],  19:[3,3,3,3,0,0,0,0,0], 20:[3,3,3,3,0,0,0,0,0]
  },
  hb_dpaladin: {
    1:[2,2,0,0,0,0,0,0,0],   2:[2,2,1,0,0,0,0,0,0],   3:[2,2,1,1,0,0,0,0,0],   4:[2,2,2,1,0,0,0,0,0],
    5:[2,2,2,1,0,0,0,0,0],   6:[3,2,2,1,0,0,0,0,0],   7:[3,3,2,1,0,0,0,0,0],   8:[3,3,3,1,0,0,0,0,0],
    9:[3,3,3,2,0,0,0,0,0],  10:[3,3,3,2,0,0,0,0,0],  11:[3,3,3,3,0,0,0,0,0],  12:[3,3,3,3,0,0,0,0,0],
    13:[3,3,3,3,0,0,0,0,0], 14:[3,3,3,3,0,0,0,0,0], 15:[3,3,3,3,0,0,0,0,0], 16:[3,3,3,3,0,0,0,0,0],
    17:[3,3,3,3,0,0,0,0,0], 18:[3,3,3,3,0,0,0,0,0], 19:[3,3,3,3,0,0,0,0,0], 20:[3,3,3,3,0,0,0,0,0]
  },
  ranger: {
    1:[0,0,0,0,0,0,0,0,0],   2:[0,0,0,0,0,0,0,0,0],   3:[0,0,0,0,0,0,0,0,0],   4:[0,0,0,0,0,0,0,0,0],
    5:[1,0,0,0,0,0,0,0,0],   6:[2,0,0,0,0,0,0,0,0],   7:[2,1,0,0,0,0,0,0,0],   8:[2,2,0,0,0,0,0,0,0],
    9:[2,2,1,0,0,0,0,0,0],  10:[3,2,1,0,0,0,0,0,0],  11:[3,3,1,0,0,0,0,0,0],  12:[3,3,2,0,0,0,0,0,0],
    13:[3,3,2,1,0,0,0,0,0], 14:[3,3,3,1,0,0,0,0,0],  15:[3,3,3,2,0,0,0,0,0], 16:[3,3,3,2,0,0,0,0,0],
    17:[3,3,3,2,0,0,0,0,0], 18:[3,3,3,3,0,0,0,0,0],  19:[3,3,3,3,0,0,0,0,0], 20:[3,3,3,3,0,0,0,0,0]
  },
  // === Non-casters: always zero slots ===
  fighter: {}, thief: {}, barbarian: {}, monk: {}
};

// === THAC0 Tables ===
const THAC0_TABLES = {
  warrior: [
    20,19,18,17,16,15,14,13,12,11,
    10,9,8,7,6,5,4,3,2,1
  ],
  priest: [
    20,20,20,18,18,18,16,16,16,14,
    14,14,12,12,12,10,10,10,8,8
  ],
  rogue: [
    20,20,19,19,18,18,17,17,16,16,
    15,15,14,14,13,13,12,12,11,11
  ],
  wizard: [
    20,20,20,19,19,19,18,18,18,17,
    17,17,16,16,16,15,15,15,14,14
  ]
};

// Aliases
SPELL_SLOTS_TABLES.priest      = SPELL_SLOTS_TABLES.cleric;
SPELL_SLOTS_TABLES.demipaladin = SPELL_SLOTS_TABLES.cleric;
SPELL_SLOTS_TABLES.illusionist = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.abjurer     = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.conjurer    = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.enchanter   = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.invoker     = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.necromancer = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.transmuter  = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.diviner     = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.wizard      = SPELL_SLOTS_TABLES.mage;
SPELL_SLOTS_TABLES.evoker      = SPELL_SLOTS_TABLES.mage;  // Evocation specialist
SPELL_SLOTS_TABLES.assassin    = SPELL_SLOTS_TABLES.thief; // No spells, but keeps it consistent
SPELL_SLOTS_TABLES.shaman      = SPELL_SLOTS_TABLES.cleric; // If using shamans
SPELL_SLOTS_TABLES.warrior     = {}; // No spells
SPELL_SLOTS_TABLES.rogue       = SPELL_SLOTS_TABLES.thief; // Actually gets spells if bard
SPELL_SLOTS_TABLES.barbarian   = {}; // No spells


const WIS_BONUS_SPELLS = {
   1:[0,0,0,0,0,0,0,0,0],   2:[0,0,0,0,0,0,0,0,0],   3:[0,0,0,0,0,0,0,0,0],   4:[0,0,0,0,0,0,0,0,0],
   5:[0,0,0,0,0,0,0,0,0],   6:[0,0,0,0,0,0,0,0,0],   7:[0,0,0,0,0,0,0,0,0],   8:[0,0,0,0,0,0,0,0,0],
   9:[0,0,0,0,0,0,0,0,0],  10:[0,0,0,0,0,0,0,0,0],  11:[0,0,0,0,0,0,0,0,0],  12:[0,0,0,0,0,0,0,0,0],
  13:[1,0,0,0,0,0,0,0,0],  14:[2,0,0,0,0,0,0,0,0],  15:[2,1,0,0,0,0,0,0,0],  16:[2,2,0,0,0,0,0,0,0],
  17:[2,2,1,0,0,0,0,0,0],  18:[2,2,1,1,0,0,0,0,0],  19:[3,2,2,1,0,0,0,0,0],  20:[3,3,2,2,0,0,0,0,0],
  21:[3,3,3,2,1,0,0,0,0],  22:[3,3,3,3,1,0,0,0,0],  23:[3,3,3,3,2,0,0,0,0],  24:[3,3,3,3,2,1,0,0,0],
  25:[3,3,3,3,3,1,0,0,0]
};
	
// === Wisdom save adjustments (AD&D 2E) ===
const WIS_SAVE_ADJ = {
  1: -6, 2: -4, 3: -3, 4: -2, 5: -1,
  6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0,
  15: +1, 16: +2, 17: +3, 18: +4, 19: +4, 20: +4, 21: +4, 22: +4, 23: +4, 24: +4, 25: +4
};

// === Strength Tables (AD&D 2E) ===
// Format: [to-hit, damage, weight allowance, open doors, bend bars %]
const STR_TABLE = {
  1: [-5, -4, 1, 1, 0],
  2: [-3, -2, 1, 1, 0],
  3: [-3, -1, 5, 2, 0],
  4: [-2, -1, 10, 3, 0],
  5: [-2, -1, 10, 3, 0],
  6: [-1, 0, 20, 4, 0],
  7: [-1, 0, 20, 4, 0],
  8: [0, 0, 35, 5, 1],
  9: [0, 0, 35, 5, 1],
  10: [0, 0, 40, 6, 2],
  11: [0, 0, 40, 6, 2],
  12: [0, 0, 45, 7, 4],
  13: [0, 0, 45, 7, 4],
  14: [0, 0, 55, 8, 7],
  15: [0, 0, 55, 8, 7],
  16: [0, 1, 70, 9, 10],
  17: [1, 1, 85, 10, 13],
  18: [1, 2, 110, 11, 16],
  19: [3, 7, 485, 16, 50],
  20: [3, 8, 535, 17, 60],
  21: [4, 9, 635, 17, 70],
  22: [4, 10, 785, 18, 80],
  23: [5, 11, 935, 18, 90],
  24: [6, 12, 1235, 19, 95],
  25: [7, 14, 1535, 19, 99]
};

// Exceptional strength for 18/xx (warriors only)
const STR_18_EXCEPTIONAL = {
  1: [1, 3, 135, 12, 20],    // 18/01-18/50
  51: [2, 3, 160, 13, 25],   // 18/51-18/75
  76: [2, 4, 185, 14, 30],   // 18/76-18/90
  91: [2, 5, 235, 15, 35],   // 18/91-18/99
  100: [3, 6, 335, 16, 40]   // 18/00
};

// === Dexterity Table (AD&D 2E) ===
// Format: [reaction adjustment, missile attack adjustment, defensive adjustment (AC)]
const DEX_TABLE = {
  1: [-6, -6, 5],
  2: [-4, -4, 4],
  3: [-3, -3, 3],
  4: [-2, -2, 2],
  5: [-1, -1, 1],
  6: [0, 0, 0],
  7: [0, 0, 0],
  8: [0, 0, 0],
  9: [0, 0, 0],
  10: [0, 0, 0],
  11: [0, 0, 0],
  12: [0, 0, 0],
  13: [0, 0, 0],
  14: [0, 0, 0],
  15: [0, 0, -1],
  16: [1, 1, -2],
  17: [2, 2, -3],
  18: [2, 2, -4],
  19: [3, 3, -4],
  20: [3, 3, -4],
  21: [4, 4, -5],
  22: [4, 4, -5],
  23: [4, 4, -5],
  24: [5, 5, -6],
  25: [5, 5, -6]
};

// === Intelligence Table (AD&D 2E) ===
// Format: [# languages, learn spell %, max spells/level, spell immunity]
const INT_TABLE = {
  1: [0, 0, 0, ""],
  2: [1, 0, 0, ""],
  3: [1, 0, 0, ""],
  4: [1, 0, 0, ""],
  5: [1, 0, 0, ""],
  6: [1, 0, 0, ""],
  7: [1, 0, 0, ""],
  8: [1, 0, 0, ""],
  9: [2, 35, 6, ""],
  10: [2, 40, 7, ""],
  11: [2, 45, 7, ""],
  12: [3, 50, 7, ""],
  13: [3, 55, 9, ""],
  14: [4, 60, 9, ""],
  15: [4, 65, 11, ""],
  16: [5, 70, 11, ""],
  17: [6, 75, 14, ""],
  18: [7, 85, 18, ""],
  19: [8, 95, 22, "Illusion/Phantasm (≤1st level)"],
  20: [9, 96, 25, "Illusion/Phantasm (≤2nd level)"],
  21: [10, 97, 28, "Illusion/Phantasm (≤3rd level)"],
  22: [11, 98, 31, "Illusion/Phantasm (≤4th level)"],
  23: [12, 99, 34, "Illusion/Phantasm (≤5th level)"],
  24: [15, 100, 37, "Illusion/Phantasm (≤6th level)"],
  25: [20, 100, 40, "Illusion/Phantasm (≤7th level)"]
};

// Bonus non-weapon proficiency slots by INT (if such is allowed by DM - uses # of languages a character can learn by score)
const INT_BONUS_PROFS = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2,
  10: 2, 11: 2, 12: 3, 13: 3, 14: 4, 15: 4, 16: 5, 17: 6, 18: 7,
  19: 8, 20: 9, 21: 10, 22: 11, 23: 12, 24: 15, 25: 20
};

// === Experience Progression Tables (AD&D 2E) ===
// XP required to reach each level (index 0 = level 1, index 1 = level 2, etc.)
const XP_TABLES = {
  fighter: [
    0, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
    750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000
  ],
  paladin: [
    0, 2250, 4500, 9000, 18000, 36000, 75000, 150000, 300000, 600000,
    900000, 1200000, 1500000, 1800000, 2100000, 2400000, 2700000, 3000000, 3300000, 3600000
  ],
  ranger: [
    0, 2250, 4500, 9000, 18000, 36000, 75000, 150000, 300000, 600000,
    900000, 1200000, 1500000, 1800000, 2100000, 2400000, 2700000, 3000000, 3300000, 3600000
  ],
  cleric: [
    0, 1500, 3000, 6000, 13000, 27500, 55000, 110000, 225000, 450000,
    675000, 900000, 1125000, 1350000, 1575000, 1800000, 2025000, 2250000, 2475000, 2700000
  ],
  druid: [
    0, 2000, 4000, 7500, 12500, 20000, 35000, 60000, 90000, 125000,
    200000, 300000, 750000, 1500000, 3000000, 3000000, 3000000, 3000000, 3000000, 3000000
  ],

  mage: [
    0, 2500, 5000, 10000, 22500, 40000, 60000, 90000, 135000, 250000,
    375000, 750000, 1125000, 1500000, 1875000, 2250000, 2625000, 3000000, 3375000, 3750000
  ],
  illusionist: [
    0, 2250, 4500, 9000, 18000, 35000, 60000, 95000, 145000, 220000,
    440000, 660000, 880000, 1100000, 1320000, 1540000, 1760000, 1980000, 2200000, 2420000
  ],
  thief: [
    0, 1250, 2500, 5000, 10000, 20000, 40000, 70000, 110000, 160000,
    220000, 440000, 660000, 880000, 1100000, 1320000, 1540000, 1760000, 1980000, 2200000
  ],
  bard: [
    0, 1250, 2500, 5000, 10000, 20000, 40000, 70000, 110000, 160000,
    220000, 440000, 660000, 880000, 1100000, 1320000, 1540000, 1760000, 1980000, 2200000
  ],
  demipaladin: [
    0, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
    750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000
  ],
  hb_dpaladin: [
    0, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
    750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000
  ]
};

// Aliases for variants
XP_TABLES.warrior = XP_TABLES.fighter;
XP_TABLES.priest = XP_TABLES.cleric;
XP_TABLES.wizard = XP_TABLES.mage;
XP_TABLES.rogue = XP_TABLES.thief;
XP_TABLES.specialist = XP_TABLES.mage;
XP_TABLES.barbarian = XP_TABLES.fighter;

// Helper function to detect multi-class (has "/" or "-" separator)
function isMultiClass(clazz) {
  return clazz && (clazz.includes('/') || clazz.includes('-'));
}

// Helper function to parse multi-class into array of classes
function parseMultiClass(clazz) {
  if (!clazz) return [];
  // Split on / or - and trim whitespace
  return clazz.split(/[\/\-]/).map(c => c.trim().toLowerCase());
}

// Helper function to get XP table for a class string
function getXPTable(clazz) {
  if (!clazz) return null;
  const lower = clazz.toLowerCase();
  
  // Check for direct match first
  if (XP_TABLES[lower]) return XP_TABLES[lower];
  
  // Check for partial matches (e.g., "fighter/mage" contains "fighter")
  for (let key in XP_TABLES) {
    if (lower.includes(key)) return XP_TABLES[key];
  }
  
  return null;
}

// === Racial Abilities (AD&D 2E) ===
// Common racial traits that can be auto-populated
const RACIAL_ABILITIES = {
  human: [
    { name: "No racial abilities", notes: "Humans have no special racial abilities but can dual-class" }
  ],
  elf: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Resistance to Sleep/Charm", notes: "90% resistant to sleep and charm spells" },
    { name: "Secret/Concealed Doors", notes: "1-in-6 chance to notice secret doors when passing within 10', 2-in-6 when searching" },
    { name: "Surprise Bonus", notes: "+1 to surprise rolls when not in metal armor" },
    { name: "Bow/Sword Bonus", notes: "+1 to hit with bows and swords" }
  ],
  "half-elf": [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Resistance to Sleep/Charm", notes: "30% resistant to sleep and charm spells" },
    { name: "Secret/Concealed Doors", notes: "1-in-6 chance to notice secret doors when passing within 10'" }
  ],
  halfelf: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Resistance to Sleep/Charm", notes: "30% resistant to sleep and charm spells" },
    { name: "Secret/Concealed Doors", notes: "1-in-6 chance to notice secret doors when passing within 10'" }
  ],
  dwarf: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Constitution Bonuses", notes: "Already applied to saving throws" },
    { name: "Detect Construction", notes: "1-in-3 to detect slopes, new construction, traps involving stonework within 10'" },
    { name: "Attack Bonus vs. Orcs/Goblins", notes: "+1 to hit orcs, half-orcs, goblins, hobgoblins" },
    { name: "AC Bonus vs. Giants", notes: "-4 AC bonus vs. giants, ogres, trolls, ogre magi, titans" }
  ],
  halfling: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Constitution Bonuses", notes: "Already applied to saving throws" },
    { name: "Attack Bonus vs. Large", notes: "+1 to hit with slings and thrown weapons" },
    { name: "AC Bonus vs. Large", notes: "-4 AC bonus vs. creatures larger than man-sized" },
    { name: "Hide in Shadows", notes: "Can hide in natural outdoor settings with 90% success in light cover, 2-in-3 otherwise" }
  ],
  gnome: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Constitution Bonuses", notes: "Already applied to saving throws" },
    { name: "Detect Construction", notes: "1-in-3 to detect slopes, unsafe walls, traps involving stonework within 10'" },
    { name: "Attack Bonus vs. Kobolds/Goblins", notes: "+1 to hit kobolds and goblins" },
    { name: "AC Bonus vs. Giants", notes: "-4 AC bonus vs. gnolls, bugbears, ogres, trolls, ogre magi, giants, titans" },
    { name: "Illusion Resistance", notes: "+1 bonus to saving throws vs. illusions (included in INT effects)" }
  ],
  "half-orc": [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Constitution Bonus", notes: "+1 to Constitution" },
    { name: "Charisma Penalty", notes: "-2 to Charisma" }
  ],
  halforc: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Constitution Bonus", notes: "+1 to Constitution" },
    { name: "Charisma Penalty", notes: "-2 to Charisma" }
  ]
};

// === Class Abilities by Level (AD&D 2E) ===
// Format: { level: [{ name, notes }] }
const CLASS_ABILITIES = {
  fighter: {
    1: [{ name: "Weapon Specialization", notes: "May specialize in weapons (if using optional rule)" }],
    9: [{ name: "Followers", notes: "Attracts 10-100 followers and may build a stronghold" }]
  },
  paladin: {
    1: [
      { name: "Detect Evil", notes: "60 ft range, at will" },
      { name: "Divine Protection", notes: "+2 bonus to all saving throws" },
      { name: "Immunity to Disease", notes: "Immune to all diseases" },
      { name: "Lay on Hands", notes: "2 HP per level, once per day" },
      { name: "Code of Conduct", notes: "Must be Lawful Good, tithe 10%, own max 10 magic items" }
    ],
    3: [{ name: "Turn Undead", notes: "As cleric of 2 levels lower" }],
    9: [
      { name: "Cast Priest Spells", notes: "Can cast priest spells from specific spheres" },
      { name: "Followers", notes: "Attracts followers and may build stronghold" }
    ]
  },
  ranger: {
    1: [
      { name: "Species Enemy", notes: "Choose one creature type, +4 to hit against them" },
      { name: "Tracking", notes: "Track creatures in wilderness" },
      { name: "Two-Weapon Fighting", notes: "Fight with weapon in each hand with reduced penalties" }
    ],
    8: [{ name: "Cast Priest Spells", notes: "Can cast druid/ranger spells" }],
    10: [{ name: "Followers", notes: "Attracts 2d6 followers" }]
  },
  cleric: {
    1: [
      { name: "Turn Undead", notes: "Can turn or destroy undead creatures" },
      { name: "Spell Casting", notes: "Can cast priest spells" }
    ],
    8: [{ name: "Followers", notes: "Attracts followers and may build stronghold" }]
  },
  druid: {
    1: [
      { name: "Druidic Language", notes: "Secret language of all druids" },
      { name: "Spell Casting", notes: "Can cast druid spells" }
    ],
    3: [{ name: "Identify Plants/Animals", notes: "Automatically identify plants, animals, pure water" }],
    7: [{ name: "Immunity", notes: "Immune to charm spells cast by woodland creatures" }],
    12: [{ name: "Challenge", notes: "Must challenge and defeat higher-level druids to advance" }]
  },
  mage: {
    1: [{ name: "Spell Casting", notes: "Can cast wizard spells from spellbook" }],
    10: [{ name: "Create Magic Items", notes: "Can create magical items and scrolls" }]
  },
  illusionist: {
    1: [{ name: "Spell Casting", notes: "Can cast illusionist spells from spellbook" }],
    10: [{ name: "Create Magic Items", notes: "Can create illusion-based magical items" }]
  },
  thief: {
    1: [
      { name: "Thief Skills", notes: "Special abilities: pick pockets, open locks, detect traps, etc." },
      { name: "Backstab", notes: "x2 damage from behind at 1st-4th level" }
    ],
    5: [{ name: "Backstab x3", notes: "x3 damage from behind at 5th-8th level" }],
    9: [{ name: "Backstab x4", notes: "x4 damage from behind at 9th-12th level" }],
    10: [{ name: "Read Scrolls", notes: "Can use magical and priest scrolls with 25% failure" }],
    13: [{ name: "Backstab x5", notes: "x5 damage from behind at 13th+ level" }]
  },
  bard: {
    1: [
      { name: "Climb Walls", notes: "Thief ability to climb" },
      { name: "Detect Noise", notes: "Thief ability to hear sounds" },
      { name: "Pick Pockets", notes: "Thief ability (reduced from thief)" },
      { name: "Read Languages", notes: "Thief ability (reduced from thief)" }
    ],
    2: [{ name: "Counter Song", notes: "Negate sound-based attacks in 30 ft radius" }],
    10: [{ name: "Read Scrolls", notes: "Can use magical scrolls" }]
  }
};

// Base percentages for Thieves - FIXED values (no automatic progression)
// Thieves only improve through discretionary points (30 at 1st, +20 per level)
// Format: [Pick Pockets, Open Locks, Find/Remove Traps, Move Silently, Hide in Shadows, Detect Noise, Climb Walls, Read Languages]
const THIEF_SKILLS_BASE = {
  1:  [15, 10, 5,  10, 5,  15, 60, 0],
  2:  [15, 10, 5,  10, 5,  15, 60, 0],
  3:  [15, 10, 5,  10, 5,  15, 60, 0],
  4:  [15, 10, 5,  10, 5,  15, 60, 0],
  5:  [15, 10, 5,  10, 5,  15, 60, 0],
  6:  [15, 10, 5,  10, 5,  15, 60, 0],
  7:  [15, 10, 5,  10, 5,  15, 60, 0],
  8:  [15, 10, 5,  10, 5,  15, 60, 0],
  9:  [15, 10, 5,  10, 5,  15, 60, 0],
  10: [15, 10, 5,  10, 5,  15, 60, 0],
  11: [15, 10, 5,  10, 5,  15, 60, 0],
  12: [15, 10, 5,  10, 5,  15, 60, 0],
  13: [15, 10, 5,  10, 5,  15, 60, 0],
  14: [15, 10, 5,  10, 5,  15, 60, 0],
  15: [15, 10, 5,  10, 5,  15, 60, 0],
  16: [15, 10, 5,  10, 5,  15, 60, 0],
  17: [15, 10, 5,  10, 5,  15, 60, 0],
  18: [15, 10, 5,  10, 5,  15, 60, 0],
  19: [15, 10, 5,  10, 5,  15, 60, 0],
  20: [15, 10, 5,  10, 5,  15, 60, 0]
};

// Bard thief skills (FIXED base values - no automatic progression)
// Bards only improve through discretionary points (20 at 1st, +15 per level)
// Format: [Pick Pockets, Open Locks, Find/Remove Traps, Move Silently, Hide in Shadows, Detect Noise, Climb Walls, Read Languages]
// Bards only get 4 skills: PP, DN, CW, RL (all others are 0)
const BARD_SKILLS_BASE = {
  // All levels use the same fixed base values from Table 33
  1:  [10, 0, 0, 0, 0, 20, 50, 5],
  2:  [10, 0, 0, 0, 0, 20, 50, 5],
  3:  [10, 0, 0, 0, 0, 20, 50, 5],
  4:  [10, 0, 0, 0, 0, 20, 50, 5],
  5:  [10, 0, 0, 0, 0, 20, 50, 5],
  6:  [10, 0, 0, 0, 0, 20, 50, 5],
  7:  [10, 0, 0, 0, 0, 20, 50, 5],
  8:  [10, 0, 0, 0, 0, 20, 50, 5],
  9:  [10, 0, 0, 0, 0, 20, 50, 5],
  10: [10, 0, 0, 0, 0, 20, 50, 5],
  11: [10, 0, 0, 0, 0, 20, 50, 5],
  12: [10, 0, 0, 0, 0, 20, 50, 5],
  13: [10, 0, 0, 0, 0, 20, 50, 5],
  14: [10, 0, 0, 0, 0, 20, 50, 5],
  15: [10, 0, 0, 0, 0, 20, 50, 5],
  16: [10, 0, 0, 0, 0, 20, 50, 5],
  17: [10, 0, 0, 0, 0, 20, 50, 5],
  18: [10, 0, 0, 0, 0, 20, 50, 5],
  19: [10, 0, 0, 0, 0, 20, 50, 5],
  20: [10, 0, 0, 0, 0, 20, 50, 5]
};

// Racial adjustments to thief skills
// Format: [Pick Pockets, Open Locks, Find/Remove Traps, Move Silently, Hide in Shadows, Detect Noise, Climb Walls, Read Languages]
const THIEF_RACIAL_ADJUSTMENTS = {
  dwarf: [0, 10, 15, 0, 0, 0, -10, -5],
  elf: [5, -5, 0, 5, 10, 5, 0, 0],
  gnome: [0, 5, 10, 5, 5, 10, -15, 0],
  halfelf: [10, 0, 0, 0, 5, 0, 0, 0],
  halfling: [5, 5, 5, 10, 15, 5, -15, -5],
  halforc: [0, 0, 0, 0, 0, 0, 0, 0],
  human: [0, 0, 0, 0, 0, 0, 0, 0]
};

// Dexterity adjustments to thief skills
// Format: [Pick Pockets, Open Locks, Find/Remove Traps, Move Silently, Hide in Shadows]
const THIEF_DEX_ADJUSTMENTS = {
  9: [-15, -10, -10, -20, -10],
  10: [-10, -5, -10, -15, -5],
  11: [-5, 0, -5, -10, 0],
  12: [0, 0, 0, -5, 0],
  13: [0, 0, 0, 0, 0],
  14: [0, 0, 0, 0, 0],
  15: [0, 0, 0, 0, 0],
  16: [0, 5, 0, 0, 0],
  17: [5, 10, 0, 5, 5],
  18: [10, 15, 5, 10, 10],
  19: [15, 20, 10, 15, 15]
};
// For DEX below 9, use DEX 9 penalties (Table 28 shows DEX 9 as the lowest)
for (let d = 1; d <= 8; d++) {
  THIEF_DEX_ADJUSTMENTS[d] = [-15, -10, -10, -20, -10];
}
// For DEX 20+, same as 19
for (let d = 20; d <= 25; d++) {
  THIEF_DEX_ADJUSTMENTS[d] = [15, 20, 10, 15, 15];
}

// Aliases
CLASS_ABILITIES.warrior = CLASS_ABILITIES.fighter;
CLASS_ABILITIES.priest = CLASS_ABILITIES.cleric;
CLASS_ABILITIES.wizard = CLASS_ABILITIES.mage;
CLASS_ABILITIES.rogue = CLASS_ABILITIES.thief;
CLASS_ABILITIES.specialist = CLASS_ABILITIES.mage;

// === Turn Undead Table (AD&D 2e) ===
// Format: T = automatic turn, D = automatic destruction, number = d20 roll needed, - = cannot turn
const TURN_UNDEAD_TABLE = {
  1: { skeleton: 10, zombie: 13, ghoul: 16, shadow: 19, wight: 20, ghast: '-', wraith: '-', mummy: '-', spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  2: { skeleton: 7, zombie: 10, ghoul: 13, shadow: 16, wight: 19, ghast: 20, wraith: '-', mummy: '-', spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  3: { skeleton: 4, zombie: 7, ghoul: 10, shadow: 13, wight: 16, ghast: 19, wraith: 20, mummy: '-', spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  4: { skeleton: 'T', zombie: 4, ghoul: 7, shadow: 10, wight: 13, ghast: 16, wraith: 19, mummy: 20, spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  5: { skeleton: 'T', zombie: 'T', ghoul: 4, shadow: 7, wight: 10, ghast: 13, wraith: 16, mummy: 19, spectre: 20, vampire: '-', ghost: '-', lich: '-', special: '-' },
  6: { skeleton: 'D', zombie: 'T', ghoul: 'T', shadow: 4, wight: 7, ghast: 10, wraith: 13, mummy: 16, spectre: 19, vampire: 20, ghost: '-', lich: '-', special: '-' },
  7: { skeleton: 'D', zombie: 'D', ghoul: 'T', shadow: 'T', wight: 4, ghast: 7, wraith: 10, mummy: 13, spectre: 16, vampire: 19, ghost: 20, lich: '-', special: '-' },
  8: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'T', wight: 'T', ghast: 4, wraith: 7, mummy: 10, spectre: 13, vampire: 16, ghost: 19, lich: 20, special: '-' },
  9: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'T', ghast: 'T', wraith: 4, mummy: 7, spectre: 10, vampire: 13, ghost: 16, lich: 19, special: 20 },
  10: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'T', wraith: 'T', mummy: 4, spectre: 7, vampire: 10, ghost: 13, lich: 16, special: 19 },
  11: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'T', mummy: 'T', spectre: 4, vampire: 7, ghost: 10, lich: 13, special: 16 },
  12: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'T', spectre: 'T', vampire: 4, ghost: 7, lich: 10, special: 13 },
  13: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'T', vampire: 'T', ghost: 4, lich: 7, special: 10 },
  14: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'D', vampire: 'T', ghost: 'T', lich: 4, special: 7 },
  15: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'D', vampire: 'D', ghost: 'T', lich: 'T', special: 4 },
  16: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'D', vampire: 'D', ghost: 'D', lich: 'T', special: 'T' },
  17: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'D', vampire: 'D', ghost: 'D', lich: 'D', special: 'T' },
  18: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'D', vampire: 'D', ghost: 'D', lich: 'D', special: 'D' },
  19: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'D', vampire: 'D', ghost: 'D', lich: 'D', special: 'D' },
  20: { skeleton: 'D', zombie: 'D', ghoul: 'D', shadow: 'D', wight: 'D', ghast: 'D', wraith: 'D', mummy: 'D', spectre: 'D', vampire: 'D', ghost: 'D', lich: 'D', special: 'D' }
};

const TURN_UNDEAD_TYPES = [
  { key: 'skeleton', name: 'Skeleton', hd: 1 },
  { key: 'zombie', name: 'Zombie', hd: 2 },
  { key: 'ghoul', name: 'Ghoul', hd: 2 },
  { key: 'shadow', name: 'Shadow', hd: 3 },
  { key: 'wight', name: 'Wight', hd: 4 },
  { key: 'ghast', name: 'Ghast', hd: 4 },
  { key: 'wraith', name: 'Wraith', hd: 5 },
  { key: 'mummy', name: 'Mummy', hd: 6 },
  { key: 'spectre', name: 'Spectre', hd: 7 },
  { key: 'vampire', name: 'Vampire', hd: 8 },
  { key: 'ghost', name: 'Ghost', hd: 10 },
  { key: 'lich', name: 'Lich', hd: 11 },
  { key: 'special', name: 'Special', hd: 12 }
];