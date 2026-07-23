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
  "barbarian": "warrior",

  // Priests
  "cleric": "priest",
  "druid": "priest",
  "priest": "priest",

  // Rogues
  "thief": "rogue",
  "bard": "rogue",
  "rogue": "rogue",

  // Wizards -- including every specialist school (PHB Table 22). Specialists
  // use the mage progression, so they are all "wizard" for saves, proficiency
  // slots, and the non-proficiency attack penalty.
  "mage": "wizard",
  "wizard": "wizard",
  "specialist": "wizard",
  "abjurer": "wizard",
  "conjurer": "wizard",
  "diviner": "wizard",
  "enchanter": "wizard",
  "illusionist": "wizard",
  "invoker": "wizard",
  "necromancer": "wizard",
  "transmuter": "wizard",
};

// Resolve a class name to its group. Tries an exact match first, then falls
// back to substring matching so homebrew and compound names ("gnome
// illusionist", "Fighter ") still resolve instead of silently returning null.
// Longest keys are tested first so "demipaladin" cannot be eaten by "paladin".
function getClassCategory(clazz) {
  const c = (clazz || "").trim().toLowerCase();
  if (!c) return null;
  if (CLASS_CATEGORIES[c]) return CLASS_CATEGORIES[c];
  const key = Object.keys(CLASS_CATEGORIES)
    .sort((a, b) => b.length - a.length)
    .find(k => c.includes(k));
  return key ? CLASS_CATEGORIES[key] : null;
}

// === Hit Dice (AD&D 2e, PHB Chapter 3) ===
// die  : sides of the Hit Die rolled at each level
// cap  : last level at which a full Hit Die is rolled
// flat : hit points gained per level after the cap -- no Hit Die is rolled and
//        the Constitution hit point bonus no longer applies.
// Sources: Table 14 (warrior), Table 20 (wizard), Table 23 (priest),
//          Table 25 (rogue).
const HIT_DICE = {
  warrior: { die: 10, cap: 9,  flat: 3 },
  wizard:  { die: 4,  cap: 10, flat: 1 },
  priest:  { die: 8,  cap: 9,  flat: 2 },
  rogue:   { die: 6,  cap: 10, flat: 2 }
};

// === Minimum Hit Die roll at high Constitution ===
// PHB Table 3, footnotes ** / *** / ****:
//   CON 20      -- all 1s rolled for Hit Dice are considered 2s
//   CON 21-22   -- all 1s and 2s are considered 3s
//   CON 23-25   -- all 1s, 2s and 3s are considered 4s
// NOTE these footnotes carry NO warrior restriction. Only the single "*",
// which marks the parenthetical hit point bonus, is warriors-only.
// Uses CURRENT Constitution, not the starting score: Table 3's text says to
// always use the character's current Constitution for hit point bonuses and
// penalties. (con_initial exists solely to count revivals -- PHB p.21.)
const CON_MIN_HD_ROLL = {
  20: 2,
  21: 3, 22: 3,
  23: 4, 24: 4, 25: 4
};

// Lowest result any single Hit Die can yield. Returns 0 when no floor applies.
function getMinHitDieRoll(con) {
  const c = parseInt(con, 10);
  if (isNaN(c)) return 0;
  return CON_MIN_HD_ROLL[c] || 0;
}

// Apply the floor to one die result. The floor is PER DIE, so a multi-class
// character rolling one die per class gets it on each roll separately.
// It does NOT apply to the flat hit points gained after a class's Hit Dice cap
// (warrior/priest 10th+, wizard/rogue 11th+) because no die is rolled there.
// A floor at or above the die size makes every roll that value -- a d4 wielded
// at CON 23 always yields 4. That is the rule as written, not a bug.
function applyHitDieFloor(roll, con) {
  const r = parseInt(roll, 10);
  if (isNaN(r)) return roll;
  return Math.max(r, getMinHitDieRoll(con));
}

// Hit Dice earned for one class across an inclusive level range.
// Returns { die, dice, flat } or null. fromLevel lets a dual-class character
// count only the levels above his original class's maximum.
function hitDiceParts(clazz, fromLevel, toLevel) {
  const cat = getClassCategory(clazz);
  if (!cat) return null;
  const hd = HIT_DICE[cat];
  if (!hd) return null;

  fromLevel = parseInt(fromLevel, 10);
  toLevel   = parseInt(toLevel, 10);
  if (isNaN(fromLevel) || fromLevel < 1) fromLevel = 1;
  if (isNaN(toLevel) || toLevel < fromLevel) return null;

  return {
    die:  hd.die,
    dice: Math.max(0, Math.min(toLevel, hd.cap) - fromLevel + 1),
    flat: Math.max(0, toLevel - Math.max(hd.cap, fromLevel - 1)) * hd.flat
  };
}

function formatHitDiceParts(p) {
  if (!p) return "";
  let s = "";
  if (p.dice > 0) s = p.dice + "d" + p.die;
  if (p.flat > 0) s += (s ? "+" : "") + p.flat;
  return s;
}

// "5d10" for a 5th-level fighter, "9d10+9" for a 12th-level fighter.
function formatHitDice(clazz, level) {
  return formatHitDiceParts(hitDiceParts(clazz, 1, level));
}

// Hit Dice for a whole character, handling all three character types.
// Returns "" when the class cannot be resolved -- callers should fall back to
// the manual override field.
function getHitDice(root) {
  const charType = (val(root, "char_type") || "single").toLowerCase();

  if (charType === "multi") {
    // PHB Ch.3: roll each class's Hit Die, total the results, then divide by
    // the number of classes (round down, never below 1 hp per level).
    const parts = [1, 2, 3]
      .map(n => ({
        clazz: val(root, "mc_class" + n) || "",
        level: parseInt(val(root, "mc_level" + n) || 0, 10)
      }))
      .filter(p => p.clazz && p.level > 0)
      .map(p => formatHitDice(p.clazz, p.level))
      .filter(Boolean);
    if (!parts.length) return "";
    return parts.join(" / ") + (parts.length > 1 ? " (averaged)" : "");
  }

  if (charType === "dual") {
    // The character keeps his original Hit Dice but earns no new ones until
    // his new class exceeds his original class's level; from that point each
    // further level rolls the new class's die.
    const oc = val(root, "dc_original_class") || "";
    const ol = parseInt(val(root, "dc_original_level") || 0, 10);
    const nc = val(root, "dc_new_class") || "";
    const nl = parseInt(val(root, "dc_new_level") || 0, 10);

    const frozen = formatHitDice(oc, ol);
    if (nl > ol) {
      const gained = formatHitDiceParts(hitDiceParts(nc, ol + 1, nl));
      if (frozen && gained) return frozen + " + " + gained;
      if (gained) return gained;
    }
    return frozen;
  }

  return formatHitDice(val(root, "clazz") || "", parseInt(val(root, "level") || 0, 10));
}

// === Proficiency Slots (AD&D 2E, PHB Table 34) ===
// wpInitial / nwpInitial : slots at 1st level
// wpLevels  / nwpLevels  : gain 1 additional slot every N levels.
//   Gains use floor(level / N) with NO offset -- a warrior gains weapon slots
//   at levels 3, 6, 9, ... (not 4, 7, 10).
// nonProfPenalty : attack roll penalty for using a weapon you are NOT
//   proficient with (PHB Table 34 "Penalty" column).
const PROFICIENCY_SLOTS = {
  warrior: { wpInitial: 4, wpLevels: 3, nwpInitial: 3, nwpLevels: 3, nonProfPenalty: -2 },
  wizard:  { wpInitial: 1, wpLevels: 6, nwpInitial: 4, nwpLevels: 3, nonProfPenalty: -5 },
  priest:  { wpInitial: 2, wpLevels: 4, nwpInitial: 4, nwpLevels: 3, nonProfPenalty: -3 },
  rogue:   { wpInitial: 2, wpLevels: 4, nwpInitial: 3, nwpLevels: 4, nonProfPenalty: -3 }
};

// Returns { wp, nwp, category, nonProfPenalty } for a single class at a level,
// or null if the class is unrecognized.
function getProficiencySlots(clazz, level) {
  const category = CLASS_CATEGORIES[(clazz || "").trim().toLowerCase()];
  if (!category) return null;

  const t = PROFICIENCY_SLOTS[category];
  if (!t) return null;

  level = parseInt(level, 10);
  if (isNaN(level) || level < 1) level = 1;

  return {
    category:       category,
    wp:             t.wpInitial  + Math.floor(level / t.wpLevels),
    nwp:            t.nwpInitial + Math.floor(level / t.nwpLevels),
    nonProfPenalty: t.nonProfPenalty
  };
}

// Full proficiency slot budget for a character, accounting for character type,
// Intelligence bonus slots, and manual adjustments.
//
// Returns:
//   {
//     wpBase, nwpBase   -- from class/level (PHB Table 34)
//     intBonus          -- bonus NWP slots from Intelligence (general purpose)
//     wpAdj, nwpAdj     -- manual adjustments (kits, DM rulings, etc.)
//     wpTotal, nwpTotal -- the numbers the player actually spends
//     sources           -- human-readable breakdown for the tooltip
//     valid             -- false if the class couldn't be resolved
//   }
function getCharacterProficiencySlots(root) {
  const charType = (val(root, "char_type") || "single").toLowerCase();

  let wpBase = 0;
  let nwpBase = 0;
  let valid = false;
  const sources = [];

  if (charType === "multi") {
    // Multi-class: take the BEST value from each class group -- slots are not
    // summed. WP and NWP are maximized independently.
    const classes = [
      { c: val(root, "mc_class1") || "", l: parseInt(val(root, "mc_level1") || 0, 10) },
      { c: val(root, "mc_class2") || "", l: parseInt(val(root, "mc_level2") || 0, 10) },
      { c: val(root, "mc_class3") || "", l: parseInt(val(root, "mc_level3") || 0, 10) }
    ];

    classes.forEach(entry => {
      if (!entry.c || !entry.l) return;
      const s = getProficiencySlots(entry.c, entry.l);
      if (!s) return;
      valid = true;
      if (s.wp  > wpBase)  wpBase  = s.wp;
      if (s.nwp > nwpBase) nwpBase = s.nwp;
      sources.push(`${entry.c} ${entry.l}: ${s.wp} WP / ${s.nwp} NWP`);
    });

    if (valid) sources.push("Multi-class: best of each, not summed");

  } else if (charType === "dual") {
    // Dual-class: the character progresses in the NEW class. While dormant
    // (new level <= original level) only the new class's abilities are
    // available; once active, use whichever class grants more slots.
    const origClass = val(root, "dc_original_class") || "";
    const origLevel = parseInt(val(root, "dc_original_level") || 0, 10);
    const newClass  = val(root, "dc_new_class") || "";
    const newLevel  = parseInt(val(root, "dc_new_level") || 0, 10);

    const dormant = newLevel <= origLevel;

    const sNew = newClass && newLevel ? getProficiencySlots(newClass, newLevel) : null;
    if (sNew) {
      valid = true;
      wpBase = sNew.wp;
      nwpBase = sNew.nwp;
      sources.push(`${newClass} ${newLevel}: ${sNew.wp} WP / ${sNew.nwp} NWP`);
    }

    if (!dormant) {
      const sOld = origClass && origLevel ? getProficiencySlots(origClass, origLevel) : null;
      if (sOld) {
        valid = true;
        if (sOld.wp  > wpBase)  wpBase  = sOld.wp;
        if (sOld.nwp > nwpBase) nwpBase = sOld.nwp;
        sources.push(`${origClass} ${origLevel}: ${sOld.wp} WP / ${sOld.nwp} NWP`);
      }
    } else if (origClass) {
      sources.push(`${origClass} ${origLevel}: DORMANT (not counted)`);
    }

  } else {
    // Single class
    const clazz = val(root, "clazz") || "";
    const level = parseInt(val(root, "level") || 1, 10);
    const s = getProficiencySlots(clazz, level);
    if (s) {
      valid = true;
      wpBase = s.wp;
      nwpBase = s.nwp;
      sources.push(`${clazz} ${level}: ${s.wp} WP / ${s.nwp} NWP`);
    }
  }

  // Intelligence bonus NWP slots -- general purpose, spendable on any
  // nonweapon proficiency (including languages). PHB Ch.5: "the character's
  // Intelligence score can modify the number of slots he has, granting him
  // more proficiencies (see Table 4)."
  const int = parseInt(val(root, "int") || 0, 10);
  const intBonus = (typeof INT_BONUS_PROFS !== "undefined" && INT_BONUS_PROFS[int]) || 0;
  if (intBonus > 0) sources.push(`Intelligence ${int}: +${intBonus} NWP`);

  // Manual adjustments -- absorb kit bonuses, DM rulings, anything non-standard.
  const wpAdj  = parseInt(val(root, "prof_wp_adj")  || 0, 10) || 0;
  const nwpAdj = parseInt(val(root, "prof_nwp_adj") || 0, 10) || 0;
  if (wpAdj)  sources.push(`Manual adjustment: ${wpAdj > 0 ? "+" : ""}${wpAdj} WP`);
  if (nwpAdj) sources.push(`Manual adjustment: ${nwpAdj > 0 ? "+" : ""}${nwpAdj} NWP`);

  return {
    valid:    valid,
    wpBase:   wpBase,
    nwpBase:  nwpBase,
    intBonus: intBonus,
    wpAdj:    wpAdj,
    nwpAdj:   nwpAdj,
    wpTotal:  Math.max(0, wpBase  + wpAdj),
    nwpTotal: Math.max(0, nwpBase + intBonus + nwpAdj),
    sources:  sources
  };
}

// === Nonweapon Proficiency Group Crossovers (PHB Table 38) ===
// A proficiency taken from a group NOT listed for the character's class costs
// ONE ADDITIONAL slot beyond the number listed in Table 37.
const NWP_GROUP_CROSSOVERS = {
  "fighter":     ["warrior", "general"],
  "warrior":     ["warrior", "general"],
  "barbarian":   ["warrior", "general"],
  "paladin":     ["warrior", "priest", "general"],
  "demipaladin": ["warrior", "priest", "general"],
  "hb_dpaladin": ["warrior", "priest", "general"],
  "ranger":      ["warrior", "wizard", "general"],
  "cleric":      ["priest", "general"],
  "priest":      ["priest", "general"],
  "druid":       ["priest", "warrior", "general"],
  "mage":        ["wizard", "general"],
  "wizard":      ["wizard", "general"],
  "specialist":  ["wizard", "general"],
  "abjurer":     ["wizard", "general"],
  "conjurer":    ["wizard", "general"],
  "diviner":     ["wizard", "general"],
  "enchanter":   ["wizard", "general"],
  "illusionist": ["wizard", "general"],
  "invoker":     ["wizard", "general"],
  "necromancer": ["wizard", "general"],
  "transmuter":  ["wizard", "general"],
  "thief":       ["rogue", "general"],
  "rogue":       ["rogue", "general"],
  "bard":        ["rogue", "warrior", "wizard", "general"]
};

// === Nonweapon Proficiency Groups (PHB Table 37) ===
// Table 37 lists most proficiencies under SEVERAL groups. core_nwp.json only
// carries one `Category` each, which mispriced ~16 proficiencies against the
// Table 38 crossover rule (a cleric was being surcharged for Herbalism, a mage
// for Riding). This table is the authority; the JSON's Category is now only a
// fallback for custom/homebrew proficiencies not listed here.
// Keys are lowercased proficiency names.
const NWP_TABLE37_GROUPS = {
  // --- General ---
  "agriculture":        ["general"],
  "animal handling":    ["general"],
  "animal training":    ["general"],
  "artistic ability":   ["general"],
  "blacksmithing":      ["general"],
  "brewing":            ["general"],
  "carpentry":          ["general"],
  "cobbling":           ["general"],
  "cooking":            ["general"],
  "dancing":            ["general"],
  "direction sense":    ["general"],
  "etiquette":          ["general"],
  "fire-building":      ["general"],
  "fishing":            ["general"],
  "heraldry":           ["general"],
  "languages, modern":  ["general"],
  "leatherworking":     ["general"],
  "mining":             ["general"],
  "pottery":            ["general"],
  "riding, airborne":   ["general"],
  "riding, land-based": ["general"],
  "rope use":           ["general"],
  "seamanship":         ["general"],
  "seamstress/tailor":  ["general"],
  "singing":            ["general"],
  "stonemasonry":       ["general"],
  "swimming":           ["general"],
  "weather sense":      ["general"],
  "weaving":            ["general"],

  // --- Multi-group ---
  "ancient history":    ["priest", "wizard", "rogue"],
  "astrology":          ["priest", "wizard"],
  "engineering":        ["priest", "wizard"],
  "herbalism":          ["priest", "wizard"],
  "languages, ancient": ["priest", "wizard"],
  "reading/writing":    ["priest", "wizard"],
  "religion":           ["priest", "wizard"],
  "spellcraft":         ["priest", "wizard"],
  "navigation":         ["priest", "wizard", "warrior"],
  "local history":      ["priest", "rogue"],
  "musical instrument": ["priest", "rogue"],
  "gem cutting":        ["wizard", "rogue"],
  "blind-fighting":     ["warrior", "rogue"],
  "gaming":             ["warrior", "rogue"],
  "set snares":         ["warrior", "rogue"],

  // --- Priest only ---
  "healing":            ["priest"],

  // --- Rogue only ---
  "appraising":         ["rogue"],
  "disguise":           ["rogue"],
  "forgery":            ["rogue"],
  "juggling":           ["rogue"],
  "jumping":            ["rogue"],
  "reading lips":       ["rogue"],
  "tightrope walking":  ["rogue"],
  "tumbling":           ["rogue"],
  "ventriloquism":      ["rogue"],

  // --- Warrior only ---
  "animal lore":        ["warrior"],
  "armorer":            ["warrior"],
  "bowyer/fletcher":    ["warrior"],
  "charioteering":      ["warrior"],
  "endurance":          ["warrior"],
  "hunting":            ["warrior"],
  "mountaineering":     ["warrior"],
  "running":            ["warrior"],
  "survival":           ["warrior"],
  "tracking":           ["warrior"],
  "weaponsmithing":     ["warrior"]
};

// Every Table 37 group a proficiency belongs to. Falls back to the entry's own
// Category for custom proficiencies the table doesn't know about.
function getNWPGroups(nwp) {
  const name = (nwp.name || nwp['Proficiency Name'] || "").trim().toLowerCase();
  const known = NWP_TABLE37_GROUPS[name];
  if (known) return known;

  const cat = (nwp.category || nwp.Category || "").trim().toLowerCase();
  return cat ? [cat] : [];
}

// Returns the set of NWP groups this character may take at no surcharge.
// Multi/dual-class characters get the UNION of their classes' groups.
function getAllowedNWPGroups(root) {
  const charType = (val(root, "char_type") || "single").toLowerCase();
  const classes = [];

  if (charType === "multi") {
    ["mc_class1", "mc_class2", "mc_class3"].forEach(f => {
      const c = val(root, f);
      if (c) classes.push(c);
    });
  } else if (charType === "dual") {
    const orig = val(root, "dc_original_class");
    const nu   = val(root, "dc_new_class");
    const origLevel = parseInt(val(root, "dc_original_level") || 0, 10);
    const newLevel  = parseInt(val(root, "dc_new_level") || 0, 10);
    if (nu) classes.push(nu);
    // Original class groups only available once the dual-class is active.
    if (orig && newLevel > origLevel) classes.push(orig);
  } else {
    const c = val(root, "clazz");
    if (c) classes.push(c);
  }

  const allowed = new Set();
  classes.forEach(c => {
    const groups = NWP_GROUP_CROSSOVERS[(c || "").trim().toLowerCase()];
    if (groups) groups.forEach(g => allowed.add(g));
  });

  return allowed;
}

// Slot cost of a single nonweapon proficiency, including the Table 38 crossover
// surcharge. `nwp` is an entry from root._nwps.
function getNWPSlotCost(nwp, allowedGroups) {
  const base = parseInt(nwp.slots || nwp.Slots, 10) || 1;

  const groups = getNWPGroups(nwp);

  // Unknown proficiency -- assume in-group, don't penalize.
  if (!groups.length) return base;

  // No recognized class -- don't penalize.
  if (!allowedGroups || allowedGroups.size === 0) return base;

  // PHB Table 38: a proficiency from ANY group the character has access to
  // costs its listed price. Only if it is outside ALL of them does it cost +1.
  const inGroup = groups.some(g => allowedGroups.has(g));
  return inGroup ? base : base + 1;
}

// === Weapon Specialization (PHB, Chapter 5) ===
// "Weapon specialization is an optional rule that enables a fighter (only) to
//  choose a single weapon and specialize in its use... Multi-class characters
//  cannot use weapon specialization; it is available only to single-class
//  fighters."
// So: NOT rangers, NOT paladins, NOT multi-class, NOT dual-class.
function canSpecialize(root) {
  const charType = (val(root, "char_type") || "single").toLowerCase();
  if (charType !== "single") return false;
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  return clazz === "fighter";
}

// ADDITIONAL slots (beyond the base proficiency) required to specialize.
// PHB: melee weapons and crossbows cost 2 slots total (1 prof + 1 spec).
//      Any bow other than a crossbow costs 3 slots total (1 prof + 2 spec).
// `group` is the weapon's Group field from core_wp.json.
function getSpecializationCost(group) {
  const g = (group || "").trim().toLowerCase();
  if (g === "bow") return 2;   // longbow, shortbow, composite -- NOT crossbow
  return 1;                    // melee weapons and crossbows
}

// === Racial Languages (AD&D 2E, PHB Chapter 2 racial descriptions) ===
// `native`  : the character's native tongue. FREE -- costs no proficiency slot
//             and does NOT count against the Intelligence language cap.
//             PHB: "The character never needs to spend any proficiency slots
//             to speak his native language."
// `choices` : the initial languages that race may choose from. Every racial
//             entry hedges with "and any others your DM allows", so treat this
//             as a SOFT hint (sort-to-top / filter), never a hard restriction.
//
// Names must match languages.json EXACTLY -- note Dwarvish / Elvish / Orcish.
const RACE_LANGUAGES = {
  "dwarf": {
    native: "Dwarvish",
    choices: ["Common", "Dwarvish", "Gnome", "Goblin", "Kobold", "Orcish"]
  },
  "elf": {
    native: "Elvish",
    choices: ["Common", "Elvish", "Gnome", "Halfling", "Goblin", "Hobgoblin", "Orcish", "Gnoll"]
  },
  "gnome": {
    native: "Gnome",
    choices: ["Common", "Dwarvish", "Gnome", "Halfling", "Goblin", "Kobold", "Burrowing Mammal Speech"]
  },
  "halfling": {
    native: "Halfling",
    choices: ["Common", "Halfling", "Dwarvish", "Elvish", "Gnome", "Goblin", "Orcish"]
  },
  // PHB: "Half-elves do not have a language of their own." The only race with
  // no native tongue. Default them to Common so they aren't left mute, but the
  // player can re-tag whichever language is really theirs.
  "half-elf": {
    native: "Common",
    choices: ["Common", "Elvish", "Gnome", "Halfling", "Goblin", "Hobgoblin", "Orcish", "Gnoll"]
  },
  // PHB: human PCs "start the game knowing only their regional language."
  // That is campaign-specific, so default to Common and let the player use
  // "Set as Native" to nominate their actual regional tongue.
  "human": {
    native: "Common",
    choices: []
  }
};

// Look up a race's language entry. Tolerates "Half-Elf", "half elf", etc.
function getRacialLanguages(race) {
  let r = (race || "").trim().toLowerCase().replace(/\s+/g, "-");
  if (r === "halfelf") r = "half-elf";
  return RACE_LANGUAGES[r] || null;
}

// === Language slot cost (PHB) ===
// Speaking a language = 1 slot ("Languages, Modern", a General 1-slot NWP).
// Literacy = 1 further slot ("Reading/Writing"). Reading and writing are a
// SINGLE purchase -- one slot covers both, so ticking both costs no more.
// Native languages are free. "Granted" languages were given by the DM at
// character creation (RAW-permitted) -- they cost nothing but DO still count
// against the Intelligence cap.
function getLanguageSlotCost(lang) {
  if (!lang) return 0;
  if (lang.isNative)  return 0;
  if (lang.isGranted) return 0;

  let cost = 0;
  if (lang.canSpeak !== false) cost += 1;          // default: speaks it
  if (lang.canRead || lang.canWrite) cost += 1;    // one slot buys both
  return cost;
}

// Does this language count against the Intelligence language cap (Table 4)?
// Native does not -- Table 4 counts languages IN ADDITION to the native tongue.
// Everything else does, including DM-granted languages.
function countsAgainstLanguageCap(lang) {
  return !!lang && !lang.isNative;
}

// Total proficiency slots spent on languages across a character.
function getLanguageSlotsSpent(root) {
  const languages = root._languages || [];
  return languages.reduce((sum, l) => sum + getLanguageSlotCost(l), 0);
}

// HP bonus per level: [non-warrior, warrior]
const CON_HP_BONUS = {
  1:[-3,-3], 2:[-2,-2], 3:[-2,-2], 4:[-1,-1], 5:[-1,-1],
  6:[-1,-1],   7:[0,0],   8:[0,0],   9:[0,0],   10:[0,0],
  11:[0,0],  12:[0,0],  13:[0,0],  14:[0,0],  15:[1,1],
  16:[2,2],  17:[2,3],  18:[2,4],  19:[2,5],  20:[2,5],
  21:[2,6],  22:[2,6],  23:[2,6],  24:[2,7],  25:[2,7]
};

const CON_SYSTEM_SHOCK = {
  1:25, 2:30, 3:35, 4:40, 5:45, 6:50, 7:55, 8:60, 9:65, 10:70,
  11:75, 12:80, 13:85, 14:88, 15:90, 16:95, 17:97, 18:99,
  19:99, 20:99, 21:99, 22:99, 23:99, 24:99, 25:100
};

const CON_RESURRECTION = {
  1:30, 2:35, 3:40, 4:45, 5:50, 6:55, 7:60, 8:65, 9:70, 10:75,
  11:80, 12:85, 13:90, 14:92, 15:94, 16:96, 17:98, 18:100,
  19:100, 20:100, 21:100, 22:100, 23:100, 24:100, 25:100
};
	
const CON_POISON_ADJ = {
  1:-2, 2:-1, 3:-1, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0,
  11:0, 12:0, 13:0, 14:0, 15:0, 16:0, 17:0, 18:0,
  19:+1, 20:+1, 21:+2, 22:+2, 23:+3, 24:+3, 25:+4
};

// PHB Table 3, Regeneration column. Verified against the book.
const CON_REGENERATION = {
  20: "1 HP/6 turns",
  21: "1 HP/5 turns",
  22: "1 HP/4 turns",
  23: "1 HP/3 turns",
  24: "1 HP/2 turns",
  25: "1 HP/1 turn"
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
  21:[3,3,3,2,1,0,0,0,0],  22:[3,3,3,3,2,0,0,0,0],  23:[4,3,3,3,2,1,0,0,0],  24:[4,3,3,3,3,2,0,0,0],
  25:[4,3,3,3,3,3,1,0,0]
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

// === Shared class-group predicates ===
// Note: these are substring matches against the character's class string, so
// "hb_dpaladin" matches "paladin", "fighter/thief" matches "fighter", etc.
const WARRIOR_CLASSES = ["fighter", "paladin", "ranger", "warrior", "barbarian"];
const PRIEST_CLASSES  = ["cleric", "druid"];

function isWarriorClass(clazz) {
  clazz = (clazz || "").toLowerCase();
  return WARRIOR_CLASSES.some(c => clazz.includes(c));
}

// isPriestClass is defined once, below (next to isWizardClass). It matches every
// class that CASTS priest spells -- cleric, druid, priest, shaman, paladin,
// dpaladin, ranger -- so it is deliberately broad. Narrow "cleric/druid only"
// checks (WIS bonus spells, spell failure) are inlined at their call sites,
// because paladins and rangers cast priest spells but get no WIS bonuses.

// === Shared Strength lookup ===
// Single source of truth for Strength data, including exceptional 18/xx.
// Returns [to-hit, damage, weight allowance, open doors, bend bars] or null.
// Exceptional strength applies to warriors only (PHB).
function getStrengthData(str, exceptionalStr, clazz) {
  str = parseInt(str, 10);
  if (isNaN(str) || !STR_TABLE[str]) return null;

  // Not an exceptional-strength case -- return the plain row.
  if (str !== 18 || !exceptionalStr || !isWarriorClass(clazz)) {
    return STR_TABLE[str];
  }

  const exc = parseInt(exceptionalStr, 10);
  if (isNaN(exc)) return STR_TABLE[18];

  if (exc >= 1  && exc <= 50)   return STR_18_EXCEPTIONAL[1];
  if (exc >= 51 && exc <= 75)   return STR_18_EXCEPTIONAL[51];
  if (exc >= 76 && exc <= 90)   return STR_18_EXCEPTIONAL[76];
  if (exc >= 91 && exc <= 99)   return STR_18_EXCEPTIONAL[91];
  if (exc === 0 || exc === 100) return STR_18_EXCEPTIONAL[100];  // "00" or "100"

  return STR_TABLE[18];
}

// === Encumbrance (AD&D 2E, PHB Table 47) ===
// Format: [unencumbered ceiling, light, moderate, heavy, severe]
// Each value is the MAXIMUM pounds for that category. The "severe" ceiling is
// also the character's Max Carried Weight -- beyond it, he cannot move at all.
// NOTE: Table 47's unencumbered ceiling is identical to Table 1's Weight
// Allowance for every row, so the two tables agree by construction.
const ENCUMBRANCE_TABLE = {
  2:  [1,   2,   3,   4,   6],
  3:  [5,   6,   7,   9,   10],
  4:  [10,  13,  16,  19,  25],
  5:  [10,  13,  16,  19,  25],
  6:  [20,  29,  38,  46,  55],
  7:  [20,  29,  38,  46,  55],
  8:  [35,  50,  65,  80,  90],
  9:  [35,  50,  65,  80,  90],
  10: [40,  58,  76,  96,  110],
  11: [40,  58,  76,  96,  110],
  12: [45,  69,  93,  117, 140],
  13: [45,  69,  93,  117, 140],
  14: [55,  85,  115, 145, 170],
  15: [55,  85,  115, 145, 170],
  16: [70,  100, 130, 160, 195],
  17: [85,  121, 157, 193, 220],
  18: [110, 149, 188, 227, 255],

  // STR 19-25 are NOT in PHB Table 47 (it stops at 18/00). The unencumbered
  // ceiling below is RAW -- it is Table 1's Weight Allowance. The four bands
  // above it are EXTRAPOLATED: from STR 18 onward, Table 47's spread between
  // the allowance and max carried weight is a constant 145 lbs, divided
  // 39/39/39/28. Flagged as non-RAW; adjust if your DM rules otherwise.
  19: [485,  524,  563,  602,  630],
  20: [535,  574,  613,  652,  680],
  21: [635,  674,  713,  752,  780],
  22: [785,  824,  863,  902,  930],
  23: [935,  974,  1013, 1052, 1080],
  24: [1235, 1274, 1313, 1352, 1380],
  25: [1535, 1574, 1613, 1652, 1680]
};

// Exceptional strength encumbrance for 18/xx (warriors only), PHB Table 47
const ENCUMBRANCE_18_EXCEPTIONAL = {
  1:   [135, 174, 213, 252, 280],  // 18/01-18/50
  51:  [160, 199, 238, 277, 305],  // 18/51-18/75
  76:  [185, 224, 263, 302, 330],  // 18/76-18/90
  91:  [235, 274, 313, 352, 380],  // 18/91-18/99
  100: [335, 374, 413, 452, 480]   // 18/00
};

// === Shared encumbrance lookup ===
// Mirrors getStrengthData() exactly, including the exceptional 18/xx buckets.
// Returns [unencumbered, light, moderate, heavy, severe] ceilings, or null.
// PHB Table 47 has no STR 1 row -- STR 1 clamps to the STR 2 row (both have a
// weight allowance of 1 lb in Table 1, so they agree).
function getEncumbranceData(str, exceptionalStr, clazz) {
  str = parseInt(str, 10);
  if (isNaN(str)) return null;
  if (str < 2) str = 2;
  if (str > 25) str = 25;

  if (str !== 18 || !exceptionalStr || !isWarriorClass(clazz)) {
    return ENCUMBRANCE_TABLE[str] || null;
  }

  const exc = parseInt(exceptionalStr, 10);
  if (isNaN(exc)) return ENCUMBRANCE_TABLE[18];

  if (exc >= 1  && exc <= 50)   return ENCUMBRANCE_18_EXCEPTIONAL[1];
  if (exc >= 51 && exc <= 75)   return ENCUMBRANCE_18_EXCEPTIONAL[51];
  if (exc >= 76 && exc <= 90)   return ENCUMBRANCE_18_EXCEPTIONAL[76];
  if (exc >= 91 && exc <= 99)   return ENCUMBRANCE_18_EXCEPTIONAL[91];
  if (exc === 0 || exc === 100) return ENCUMBRANCE_18_EXCEPTIONAL[100];

  return ENCUMBRANCE_TABLE[18];
}

// === Effects of Encumbrance (PHB) ===
// Basic/Tournament rule: movement multipliers as fractions.
// AC penalties are POSITIVE = worse armor class.
const ENCUMBRANCE_EFFECTS = {
  "Unencumbered": { moveMult: 1,     attack: 0,  ac: 0, desc: "No penalties." },
  "Light":        { moveMult: 2/3,   attack: 0,  ac: 0, desc: "Movement reduced by 1/3. No combat penalty." },
  "Moderate":     { moveMult: 1/2,   attack: -1, ac: 0, desc: "Movement halved. -1 attack." },
  "Heavy":        { moveMult: 1/3,   attack: -2, ac: 1, desc: "Movement reduced to 1/3. -2 attack, +1 AC (worse)." },
  "Severe":       { moveMult: null,  attack: -4, ac: 3, desc: "Movement reduced to 1. -4 attack, +3 AC (worse)." },
  "Overloaded":   { moveMult: 0,     attack: -4, ac: 3, desc: "Over max carried weight -- cannot move." }
};

// === Optional Rule toggle: encumbrance combat/movement effects ===
// The PHB labels encumbrance an OPTIONAL RULE, so ignoring it entirely is RAW.
// When false, encumbrance is purely INFORMATIONAL -- the category, weight
// breakdown, and max carried weight still display, but nothing is deducted from
// movement, AC, or attack rolls. Flip to true (or wire to a Settings checkbox)
// to apply the PHB penalties.
// Encumbrance penalties are now registered in OPTIONAL_RULES (see bottom of this
// file) and read live via isOptionalRule('encumbrancePenalties'), so a Settings
// change takes effect without a reload. The old ENCUMBRANCE_RULES_ENABLED const
// has been removed.

// === Dexterity Table (AD&D 2E) ===
// Format: [reaction adjustment, missile attack adjustment, defensive adjustment (AC)]
const DEX_TABLE = {
  1: [-6, -6, 5],
  2: [-4, -4, 5],
  3: [-3, -3, 4],
  4: [-2, -2, 3],
  5: [-1, -1, 2],
  6: [0, 0, 1],
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

// === Intelligence Table (AD&D 2E, PHB Table 4) ===
// Format: [# languages, chance to learn spell %, max spells per level, spell immunity, max spell level]
// NOTE: index 4 (max spell level) is appended at the END so existing
// destructuring of indices 0-3 keeps working. 0 = cannot cast wizard spells.
// Columns: [ additionalLanguages, chanceToLearnSpell%, maxSpellsPerLevel,
//            illusionNote, maxSpellLevel ]
// maxSpellLevel (index 4) is from PHB Table 4; 0 means "cannot cast wizard
// spells" (INT 1-8). Indices 0-3 are unchanged and used elsewhere.
const INT_TABLE = {
  1:  [0, 0, 0, "", 0],
  2:  [1, 0, 0, "", 0],
  3:  [1, 0, 0, "", 0],
  4:  [1, 0, 0, "", 0],
  5:  [1, 0, 0, "", 0],
  6:  [1, 0, 0, "", 0],
  7:  [1, 0, 0, "", 0],
  8:  [1, 0, 0, "", 0],
  9:  [2, 35, 6, "", 4],
  10: [2, 40, 7, "", 5],
  11: [2, 45, 7, "", 5],
  12: [3, 50, 7, "", 6],
  13: [3, 55, 9, "", 6],
  14: [4, 60, 9, "", 7],
  15: [4, 65, 11, "", 7],
  16: [5, 70, 11, "", 8],
  17: [6, 75, 14, "", 8],
  18: [7, 85, 18, "", 9],
  19: [8, 95, 22, "Illusion/Phantasm (≤1st level)", 9],
  20: [9, 96, 25, "Illusion/Phantasm (≤2nd level)", 9],
  21: [10, 97, 28, "Illusion/Phantasm (≤3rd level)", 9],
  22: [11, 98, 31, "Illusion/Phantasm (≤4th level)", 9],
  23: [12, 99, 34, "Illusion/Phantasm (≤5th level)", 9],
  24: [15, 100, 37, "Illusion/Phantasm (≤6th level)", 9],
  25: [20, 100, 40, "Illusion/Phantasm (≤7th level)", 9]
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
  // NOTE: the illusionist XP table has been REMOVED. It held the 1st Edition
  // progression (2250/4500/9000...), which is wrong for 2e -- specialist
  // wizards use the MAGE table for both XP and spell progression (PHB Ch.3).
  // getXPTable() routes all specialists to mage.
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

  // PHB Ch.3: specialist wizards use the MAGE experience table. XP_TABLES has
  // no abjurer/necromancer/etc. keys, so route them all to mage.
  if (typeof SPECIALIST_WIZARDS !== "undefined" &&
      Object.keys(SPECIALIST_WIZARDS).some(k => lower.includes(k))) {
    return XP_TABLES.mage;
  }

  // Generic class-group names and other aliases.
  if (lower.includes("wizard") || lower.includes("specialist")) return XP_TABLES.mage;
  if (lower.includes("barbarian") || lower.includes("warrior")) return XP_TABLES.fighter;
  if (lower.includes("priest")) return XP_TABLES.cleric;
  if (lower.includes("rogue")) return XP_TABLES.thief;

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

// === Weapon Strength Bonus (AD&D 2E, PHB Ch.6 "Bows" + Ch.9 "Ability Modifiers
//     in Missile Combat") ===
//
// PHB Ch.9: "Attack roll and damage modifiers for Strength are always used when
//   an attack is made with a hurled weapon."
// PHB Ch.9: "When using a bow, the attack roll and damage Strength modifiers
//   apply only if the character has a properly prepared bow."
// PHB Ch.9: "Characters never receive Strength bonuses when using crossbows or
//   similar mechanical devices."
// PHB Ch.6: an ordinary bow is ASSUMED matched to the character's pull, so the
//   normal Strength bonus applies. But bonuses for EXCEPTIONAL Strength (18/01+)
//   require a custom-crafted bow costing three to five times normal price.
//   Low-Strength PENALTIES always apply to bows regardless.
//
// Modes:
//   "exceptional" -- full Strength row, including 18/xx  (melee, hurled)
//   "standard"    -- Strength row capped at plain 18      (ordinary bows)
//   "none"        -- no Strength adjustment at all        (crossbows, slings)
//
// Slings: the PHB is SILENT. Defaulted to "none" per Chris's ruling; a DM can
// override per weapon via the row's dropdown.
const WEAPON_STR_BONUS_MODES = ["none", "standard", "exceptional"];

// Default mode for a weapon, from its core_wp.json Category and Type.
function getDefaultWeaponStrMode(category, wtype) {
  const cat = (category || "").trim().toLowerCase();
  const typ = (wtype    || "").trim().toLowerCase();

  // Anything hurled by arm gets the full Strength bonus, exceptional included.
  if (cat.includes("thrown")) return "exceptional";
  if (cat === "melee")        return "exceptional";

  if (cat === "ranged") {
    if (typ === "bow")      return "standard";   // needs a custom bow for 18/xx
    if (typ === "crossbow") return "none";       // mechanical
    if (typ === "firearm")  return "none";       // mechanical
    if (typ === "sling")    return "none";       // PHB silent -- house default
    if (typ === "blowgun")  return "none";
    return "none";                                // unknown ranged -- be safe
  }

  // Unknown/blank category (custom weapons, legacy rows) -- treat as melee,
  // which preserves the tool's previous behaviour.
  return "exceptional";
}

// Apply a weapon's Strength mode to a Strength data row from getStrengthData().
// Returns { toHit, damage }.
//
// NOTE on "standard": PHB Ch.6 says low-Strength PENALTIES always apply to bows,
// so we cap the BONUS at the plain-18 row but never clamp a penalty away.
function getWeaponStrAdjustments(strData, mode, str, exceptionalStr, clazz) {
  if (!strData || mode === "none") return { toHit: 0, damage: 0 };

  if (mode === "standard") {
    const plain = (typeof STR_TABLE !== "undefined" && STR_TABLE[parseInt(str, 10)]) || null;
    if (!plain) return { toHit: 0, damage: 0 };
    return { toHit: plain[0] || 0, damage: plain[1] || 0 };
  }

  // "exceptional" -- the full row, including any 18/xx bonus.
  return { toHit: strData[0] || 0, damage: strData[1] || 0 };
}

// Look up a weapon in core_wp.json by name, so legacy rows saved before the
// category field existed can be backfilled on load. Falls back to null.
function lookupWeaponData(name) {
  if (!name || typeof WEAPONS_DATA === "undefined" || !WEAPONS_DATA.length) return null;
  const n = name.trim().toLowerCase();
  return WEAPONS_DATA.find(w => (w["Weapon Name"] || "").trim().toLowerCase() === n) || null;
}

// === Class Display Names ===
//
// The class field is FREE TEXT, so it holds whatever the player typed --
// including internal flags like "hb_dpaladin" for homebrew classes. That is
// fine on screen (the player knows what they typed) but it looks wrong on a
// printed character sheet.
//
// Anything not in this map falls through to a generic prettifier, so a class
// that was never mapped still prints cleanly rather than raw.
const CLASS_DISPLAY_NAMES = {
  hb_dpaladin: "Demi-Paladin"
};

function getClassDisplayName(clazz) {
  if (!clazz) return "";
  const raw = String(clazz).trim();
  if (!raw) return "";

  // Exact match on the map first (case-insensitive).
  const key = Object.keys(CLASS_DISPLAY_NAMES)
    .find(k => k.toLowerCase() === raw.toLowerCase());
  if (key) return CLASS_DISPLAY_NAMES[key];

  // Generic fallback: strip an "hb_" homebrew prefix, turn underscores and
  // hyphens into spaces, and title-case each word. Slashes are preserved so
  // multi-class strings survive: "fighter/thief" -> "Fighter/Thief".
  return raw
    .replace(/^hb[_-]/i, "")
    .replace(/[_]+/g, " ")
    .split("/")
    .map(part =>
      part
        .trim()
        .split(/\s+/)
        .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w)
        .join(" ")
    )
    .join("/");
}

// === Related Weapons (AD&D 2E, PHB Ch.5 "Related Weapons Bonus") ===
//
// PHB: "When a character uses a weapon that is similar to a weapon he is
//   proficient with, his attack penalty is only one-half the normal amount
//   (rounded up). A warrior, for example, would have a -1 penalty with a
//   related weapon instead of -2. A wizard would have a -3 penalty instead
//   of -5."
//
// The list below is the PHB's own, transcribed verbatim, mapped to the
// canonical weapon names used in core_wp.json. Note it is NARROWER than the
// Group field: the PHB's sword set is only scimitar / bastard / long / broad --
// short sword, two-handed, katana and the rest are NOT related to them.
//
// The PHB hedges ("Some likely categories are..." / "Specific decisions about
// which weapons are related are left to the DM"), so each weapon row also
// carries a Proficiency override dropdown.
const PHB_RELATED_WEAPONS = [
  ["Hand Axe", "Battle Axe"],
  ["Short Bow", "Long Bow", "Composite Short Bow", "Composite Long Bow"],
  ["Heavy Crossbow", "Light Crossbow"],
  ["Dagger", "Knife"],
  ["Glaive", "Halberd", "Bardiche", "Voulge", "Guisarme", "Glaive-Guisarme", "Guisarme-Voulge"],
  ["Spear", "Trident", "Javelin"],
  // PHB lumps all of these into ONE related set, where core_wp.json splits them
  // across the Mace / Flail / Hammer / Club groups. The book wins.
  ["Mace, Footman's", "Mace, Horseman's", "Morning Star",
   "Flail, Footman's", "Flail, Horseman's", "Hammer", "War Hammer", "Club"],
  ["Fork, Military", "Ranseur", "Spetum", "Partisan"],
  ["Scimitar", "Sword, Bastard", "Sword, Long", "Sword, Broad"],
  ["Sling", "Staff Sling"]
];

// The PHB related set a weapon belongs to, or null if the book doesn't list it.
function getPHBRelatedSet(weaponName) {
  const n = (weaponName || "").trim().toLowerCase();
  if (!n) return null;
  return PHB_RELATED_WEAPONS.find(set =>
    set.some(w => w.toLowerCase() === n)
  ) || null;
}

// Are two weapons "related" for the half-penalty rule?
//   1. Both in the same PHB related set  -> yes (the book is authoritative)
//   2. NEITHER appears in any PHB set, but they share a core_wp.json Group
//      -> yes (sensible fallback for the ~39 exotic weapons the PHB omits:
//         katana/wakizashi, nunchaku/scourge, the exotic polearms, etc.)
//   3. Otherwise -> no
function areWeaponsRelated(nameA, groupA, nameB, groupB) {
  const setA = getPHBRelatedSet(nameA);
  const setB = getPHBRelatedSet(nameB);

  if (setA && setB) return setA === setB;
  if (setA || setB) return false;   // one is listed, the other isn't

  const gA = (groupA || "").trim().toLowerCase();
  const gB = (groupB || "").trim().toLowerCase();
  return !!gA && gA === gB;
}

// A character's proficiency status with a given weapon.
// Returns "proficient" | "related" | "none".
function getWeaponProficiencyStatus(weaponName, weaponGroup, weaponProfs) {
  const profs = weaponProfs || [];
  const n = (weaponName || "").trim().toLowerCase();
  if (!n) return "none";

  // Exact match -- fully proficient.
  if (profs.some(p => (p.name || "").trim().toLowerCase() === n)) return "proficient";

  // Related weapon -- half penalty.
  if (profs.some(p => areWeaponsRelated(weaponName, weaponGroup, p.name, p.group))) {
    return "related";
  }

  return "none";
}

// === Non-Proficiency Penalty (PHB Table 34, "Penalty" column) ===
// Warrior -2, Wizard -5, Priest -3, Rogue -3.
// Multi/dual-class characters use the BEST (least severe) penalty available --
// a fighter/mage swings a sword at -2, not -5.
function getNonProfPenalty(root) {
  const charType = (val(root, "char_type") || "single").toLowerCase();
  const classes = [];

  if (charType === "multi") {
    ["mc_class1", "mc_class2", "mc_class3"].forEach(f => {
      const c = val(root, f);
      if (c) classes.push(c);
    });
  } else if (charType === "dual") {
    const orig      = val(root, "dc_original_class");
    const nu        = val(root, "dc_new_class");
    const origLevel = parseInt(val(root, "dc_original_level") || 0, 10);
    const newLevel  = parseInt(val(root, "dc_new_level") || 0, 10);
    if (nu) classes.push(nu);
    if (orig && newLevel > origLevel) classes.push(orig);  // dormant class doesn't count
  } else {
    const c = val(root, "clazz");
    if (c) classes.push(c);
  }

  let best = null;
  classes.forEach(c => {
    const cat = CLASS_CATEGORIES[(c || "").trim().toLowerCase()];
    if (!cat || !PROFICIENCY_SLOTS[cat]) return;
    const p = PROFICIENCY_SLOTS[cat].nonProfPenalty;   // negative
    if (best === null || p > best) best = p;           // -2 is better than -5
  });

  return best === null ? 0 : best;
}

// The attack penalty this character suffers with a given weapon.
// status: "proficient" | "related" | "none"
// PHB: a related weapon costs HALF the normal penalty, ROUNDED UP
//   (warrior -1 instead of -2; wizard -3 instead of -5 -- both confirmed in text).
function getWeaponAttackPenalty(status, fullPenalty) {
  if (status === "proficient") return 0;
  if (!fullPenalty) return 0;

  if (status === "related") {
    return -Math.ceil(Math.abs(fullPenalty) / 2);
  }
  return fullPenalty;
}


// === Weapon Speed Factor & Initiative (AD&D 2E, PHB Table 56) ===
//
// Table 56 lists weapon speed factor as an initiative modifier. Initiative is
// LOW-ROLL-WINS, so speed factor is ADDED to the die roll -- a slower weapon
// makes you act later.
//
// PHB Ch.9 "Magical Weapon Speeds": "each bonus point conferred by a magical
//   weapon reduces the speed factor of that weapon by 1. (A sword +3 reduces
//   the weapon speed factor by 3.) When a weapon has two bonuses, the lesser
//   one is used. No weapon can have a speed factor of less than 0."
function getEffectiveWeaponSpeed(speed, magicBonus) {
  const base  = parseInt(speed, 10);
  if (isNaN(base)) return null;

  const magic = parseInt(magicBonus, 10) || 0;

  // Only a positive enchantment speeds a weapon up. A cursed -1 weapon is not
  // made slower by this rule; the PHB only speaks of bonuses.
  const reduction = magic > 0 ? magic : 0;

  return Math.max(0, base - reduction);
}

// === Optional Rules Registry ===
//
// AD&D 2e flags a great many rules as optional, and different tables use
// different subsets. Rather than scattering one-off constants through the code,
// every optional rule is registered here with its metadata and default.
//
// The forthcoming Settings > Optional Rules tab renders this registry directly:
// one checkbox per entry, writing to localStorage. Adding a new optional rule
// means adding an entry here and one `isOptionalRule(...)` guard at the call
// site -- no UI work.
//
// These are CAMPAIGN/table settings, not per-character, so they live in
// localStorage rather than the character record.
const OPTIONAL_RULES = {
  weaponSpeedInitiative: {
    label:   'Weapon speed factor modifies initiative',
    detail:  'PHB Table 56. Weapon speed is added to the initiative roll (low roll wins). ' +
             'Magical bonuses reduce speed factor by 1 per plus, minimum 0.',
    default: true      // Chris's table uses this
  },
  encumbrancePenalties: {
    label:   'Encumbrance affects movement and combat',
    detail:  'PHB "Effects of Encumbrance". Light x2/3 movement, Moderate x1/2 and -1 attack, ' +
             'Heavy x1/3 and -2 attack / +1 AC, Severe movement 1 and -4 attack / +3 AC. ' +
             'Encumbrance is itself an Optional Rule in the PHB, so ignoring it is RAW.',
    default: false     // Chris's table does not use encumbrance
  }
};

// ===== Campaign Settings =====
// A character's campaign setting. Currently this only affects which priest
// spheres are available (some settings add setting-specific spheres that are
// hidden by default), but it's a core character property and future rules
// (ability score ranges, allowed kits, equipment restrictions, psionics, etc.)
// may branch on it too.
//
//   enabled: false  -> recognized but greyed out; no mechanical effect yet.
//   settingSpheres  -> extra priest spheres this setting unlocks, matching the
//                      tokens stored in each spell's `spheresSetting` field.
const CAMPAIGN_SETTINGS = {
  'core':             { label: 'Core (default)',    enabled: true,  settingSpheres: [] },
  'dark-sun':         { label: 'Dark Sun',          enabled: true,
                        settingSpheres: ['Elemental Magma', 'Elemental Rain',
                                         'Elemental Silt', 'Elemental Sun'] },
  'spelljammer':      { label: 'Spelljammer',       enabled: true,
                        settingSpheres: ['Cosmos'] },
  'forgotten-realms': { label: 'Forgotten Realms',  enabled: true,  settingSpheres: [] },
  'greyhawk':         { label: 'Greyhawk',          enabled: false, settingSpheres: [] },
  'planescape':       { label: 'Planescape',        enabled: false, settingSpheres: [] },
  'ravenloft':        { label: 'Ravenloft',         enabled: false, settingSpheres: [] },
  'al-qadim':         { label: 'Al-Qadim',          enabled: false, settingSpheres: [] },
  'birthright':       { label: 'Birthright',        enabled: false, settingSpheres: [] }
};

// The extra spheres unlocked by a given campaign setting (empty for core and
// all greyed settings). Safe for any input, including undefined/unknown.
function getSettingSpheres(settingKey) {
  const s = CAMPAIGN_SETTINGS[settingKey];
  return (s && s.enabled && Array.isArray(s.settingSpheres)) ? s.settingSpheres : [];
}

const OPTIONAL_RULES_STORAGE_KEY = 'gsheets_optional_rules';

// Is an optional rule enabled? Reads the player's saved setting, falling back to
// the registry default. Safe to call before any settings UI exists.
function isOptionalRule(key) {
  const rule = OPTIONAL_RULES[key];
  if (!rule) return false;

  try {
    const saved = JSON.parse(localStorage.getItem(OPTIONAL_RULES_STORAGE_KEY) || '{}');
    if (Object.prototype.hasOwnProperty.call(saved, key)) return !!saved[key];
  } catch (e) {
    // Corrupt storage -- fall through to the default.
  }

  return !!rule.default;
}

// Enable/disable an optional rule. The Settings tab will call this.
function setOptionalRule(key, enabled) {
  if (!OPTIONAL_RULES[key]) return;
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(OPTIONAL_RULES_STORAGE_KEY) || '{}');
  } catch (e) { saved = {}; }
  saved[key] = !!enabled;
  localStorage.setItem(OPTIONAL_RULES_STORAGE_KEY, JSON.stringify(saved));
}

// === Specialist Wizards (AD&D 2E, PHB Ch.3, Table 22) ===
// Specialists use the MAGE spell progression and XP table -- there is no
// separate illusionist/necromancer slot table.
//
// PHB: "A specialist gains one additional spell per spell level, provided the
//   additional spell is taken in the specialist's school. Thus, a 1st-level
//   illusionist could have two spells -- one being an illusion spell he knows
//   and the other limited to spells of the illusion school."
//
// The bonus applies only at spell levels the wizard can already cast.
// races:      which races may take this specialty (PHB Table 22)
// minAbility: the additional ability requirement beyond the wizard's INT 9
// opposition: schools the specialist may NEVER learn from
//
// NOTE: opposition schools are not yet ENFORCED -- spells.json's School field
// is inconsistent and mostly unparseable, so the browser cannot reliably tell
// what school a spell belongs to. Data captured here for when it is cleaned up.
//
// "Greater Divination" = divination spells of 5th level or HIGHER. Lesser
// divination (4th and below) is available to ALL wizards, so the Conjurer and
// Diviner oppositions are level-dependent, not flat school bans.
const SPECIALIST_WIZARDS = {
  "abjurer": {
    school: "Abjuration",
    races: ["human"],
    minAbility: { stat: "wis", score: 15 },
    opposition: ["Alteration", "Illusion/Phantasm"]
  },
  "conjurer": {
    school: "Conjuration/Summoning",
    races: ["human", "half-elf"],
    minAbility: { stat: "con", score: 15 },
    opposition: ["Greater Divination", "Invocation/Evocation"]
  },
  "diviner": {
    school: "Greater Divination",
    races: ["human", "half-elf", "elf"],
    minAbility: { stat: "wis", score: 16 },
    opposition: ["Conjuration/Summoning"]
  },
  "enchanter": {
    school: "Enchantment/Charm",
    races: ["human", "half-elf", "elf"],
    minAbility: { stat: "cha", score: 16 },
    opposition: ["Invocation/Evocation", "Necromancy"]
  },
  "illusionist": {
    school: "Illusion/Phantasm",
    races: ["human", "gnome"],
    minAbility: { stat: "dex", score: 16 },
    opposition: ["Necromancy", "Invocation/Evocation", "Abjuration"]
  },
  "invoker": {
    school: "Invocation/Evocation",
    races: ["human"],
    minAbility: { stat: "con", score: 16 },
    opposition: ["Enchantment/Charm", "Conjuration/Summoning"]
  },
  "necromancer": {
    school: "Necromancy",
    races: ["human"],
    minAbility: { stat: "wis", score: 16 },
    opposition: ["Illusion/Phantasm", "Enchantment/Charm"]
  },
  "transmuter": {
    school: "Alteration",
    races: ["human", "half-elf"],
    minAbility: { stat: "dex", score: 15 },
    opposition: ["Abjuration", "Necromancy"]
  }
};

// Check a character against Table 22. Returns an array of problem strings
// (empty if valid). Advisory only -- never blocks the player.
function validateSpecialist(root) {
  // Resolve the WIZARD component first so multi-class (gnome illusionist) and
  // dual-class specialists get validated too. Reading the top-level clazz field
  // alone meant those characters failed the key lookup and silently skipped every
  // check below -- including the multi-class check itself, which could never fire.
  const component = (typeof getWizardComponent === 'function') ? getWizardComponent(root) : null;
  const clazz = ((component && component.clazz) || val(root, "clazz") || "").trim().toLowerCase();
  const key = Object.keys(SPECIALIST_WIZARDS).find(k => clazz.includes(k));
  if (!key) return [];

  const spec = SPECIALIST_WIZARDS[key];
  const problems = [];

  const int = parseInt(val(root, "int") || 0, 10);
  if (int < 9) problems.push(`Intelligence ${int} — all wizards require 9+.`);

  const score = parseInt(val(root, spec.minAbility.stat) || 0, 10);
  if (score < spec.minAbility.score) {
    problems.push(
      `${spec.minAbility.stat.toUpperCase()} ${score} — a ${key} requires ${spec.minAbility.score}+.`
    );
  }

  // Race is a FREE-TEXT field, so compare on letters only and by substring:
  // "Half-Elf"/"halfelf" both match half-elf, and subrace spellings like
  // "Deep Gnome" or "Grey Elf" match gnome/elf instead of being flagged as
  // violations. Exact matching here produced false warnings.
  const rawRace = (val(root, "race") || "").trim();
  const race = rawRace.toLowerCase().replace(/[^a-z]/g, "");
  if (race && !spec.races.some(r => race.includes(r.replace(/[^a-z]/g, "")))) {
    problems.push(
      `${rawRace} — a ${key} must be ${spec.races.join(" or ")}.`
    );
  }

  // PHB: "multi-classed characters cannot become specialists, except for
  // gnomes, who ... [may become] illusionists."
  const charType = (val(root, "char_type") || "single").toLowerCase();
  if (charType === "multi" && !(key === "illusionist" && race.includes("gnome"))) {
    problems.push("Multi-class characters cannot be specialists (except gnome illusionists).");
  }

  return problems;
}

/// Does a spell fall in this class's opposition schools? Specialists may browse
// opposition spells for reference but never learn them (PHB Table 22).
//
// "Greater Divination" in an opposition list is a LEVEL-DEPENDENT ban, not a
// flat one: only Divination spells of 5th level or higher are Greater
// Divination. Lesser divination (<=4th) is available to every wizard, so it is
// never opposed.
function getOppositionSchools(clazz) {
  const c = (clazz || "").trim().toLowerCase();
  if (!c) return [];
  const key = Object.keys(SPECIALIST_WIZARDS).find(k => c.includes(k));
  return key ? SPECIALIST_WIZARDS[key].opposition : [];
}

function isOppositionSpell(spell, clazz) {
  const opposition = getOppositionSchools(clazz);
  if (opposition.length === 0) return false;

  // The spell's school tokens. spell.school is the comma-joined string the
  // loader emits; fall back to a schools[] array if present.
  const schools = Array.isArray(spell.schools)
    ? spell.schools
    : String(spell.school || "").split(",").map(s => s.trim()).filter(Boolean);

  const level = (typeof spell.level === "number")
    ? spell.level
    : parseInt(spell.level, 10) || 0;

  return opposition.some(opp => {
    if (opp === "Greater Divination") {
      // only Divination spells of 5th level or higher
      return schools.includes("Divination") && level >= 5;
    }
    return schools.includes(opp);
  });
}

// True if `spell` belongs to the specialist's OWN school -- used for the +15%
// learn bonus. Mirrors isOppositionSpell's token matching, including the
// Greater Divination = Divination-of-5th-level-or-higher wrinkle, so a diviner's
// specialty correctly excludes the lesser divinations any wizard can learn.
function isSpecialtySpell(spell, clazz) {
  const school = getSpecialistSchool(clazz);
  if (!school) return false;

  const schools = Array.isArray(spell.schools)
    ? spell.schools
    : String(spell.school || "").split(",").map(s => s.trim()).filter(Boolean);

  const level = (typeof spell.level === "number")
    ? spell.level
    : parseInt(spell.level, 10) || 0;

  if (school === "Greater Divination") {
    return schools.includes("Divination") && level >= 5;
  }
  return schools.includes(school);
}

// Is this class a specialist wizard? Returns the school name, or null.
function getSpecialistSchool(clazz) {
  const c = (clazz || "").trim().toLowerCase();
  if (!c) return null;
  const key = Object.keys(SPECIALIST_WIZARDS).find(k => c.includes(k));
  return key ? SPECIALIST_WIZARDS[key].school : null;
}

// ===== Shared caster-type detection =====
// Single source of truth so specialist wizard names (necromancer, conjurer, ...)
// can never be silently omitted from one check but not another -- the bug that
// has bitten spell access, the browser, and slot calcs separately.
function isWizardClass(clazz) {
  const c = (clazz || "").trim().toLowerCase();
  if (!c) return false;
  return c.includes('mage') || c.includes('wizard') ||
         c.includes('illusionist') || c.includes('specialist') ||
         c.includes('bard') ||
         !!getSpecialistSchool(c);   // any of the 8 specialists
}

function isPriestClass(clazz) {
  const c = (clazz || "").trim().toLowerCase();
  if (!c) return false;
  return c.includes('cleric') || c.includes('druid') || c.includes('priest') ||
         c.includes('shaman') || c.includes('paladin') || c.includes('dpaladin') ||
         c.includes('ranger');
}

// Apply the specialist's bonus spell slot: +1 at every spell level he can
// already cast. Mutates nothing -- returns a new array.
// Returns { slots, school } so callers can build a tooltip.
function applySpecialistBonus(baseSlots, clazz) {
  const school = getSpecialistSchool(clazz);
  if (!school) return { slots: baseSlots.slice(), school: null };

  const slots = baseSlots.map(n => (n > 0 ? n + 1 : 0));
  return { slots, school };
}
