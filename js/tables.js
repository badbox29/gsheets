// ===== escapeHtml — the ONLY HTML escape in this project =====.
// Lives in tables.js because it loads first, so calc.js, app.js and print.js can
// all reach it without any load-order risk.
//
// This replaces 17 local copies that had drifted into FIVE different behaviours:
// some escaped & < >, some added ", one escaped & " < and omitted > entirely,
// and about half had no null guard — so String(undefined) rendered the literal
// word "undefined" in some renderers and an empty string in others.
//
// Escapes all five characters, so it is correct in BOTH body text and attribute
// values. Several call sites interpolate into title="…", where the & < > variant
// was silently under-escaping.
//
// DO NOT add a local esc() helper. If this one is missing something, fix it here.
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

	
// === Constitution saving throw bonuses (PHB Table 9) ===
// Dwarves, gnomes and halflings are magic resistant: the book states the bonus
// as "+1 for every 3 1/2 points of Constitution score" and tabulates it in
// Table 9. Table 9 stops at 19 because that is the highest score a demihuman
// can reach at creation -- Table 7 caps Constitution at 18 and Table 8 grants
// at most a further +1 -- so no higher row is reachable.
//
// SIGN CONVENTION: saving throws are rolled against a target number and a lower
// target is better, so a BONUS is stored here as a NEGATIVE adjustment. Table
// 9's printed +4 is -4 in this table.
const CON_MAGIC_SAVE_BONUS = [
  { min: 18, bonus: -5 },
  { min: 14, bonus: -4 },
  { min: 11, bonus: -3 },
  { min: 7,  bonus: -2 },
  { min: 4,  bonus: -1 }
];

function getConMagicSaveBonus(con) {
  const score = parseInt(con, 10);
  if (!score) return 0;
  const row = CON_MAGIC_SAVE_BONUS.find(r => score >= r.min);
  return row ? row.bonus : 0;
}

// Which save categories each race applies that bonus to. Index order is
// 0 Paralyzation/Poison/Death, 1 Rod/Staff/Wand, 2 Petrification/Polymorph,
// 3 Breath Weapon, 4 Spell.
//
// All three races get it against "magical wands, staves, rods, and spells"
// (indices 1 and 4). Only dwarves and halflings extend it to poison -- the
// gnome entry in Chapter 2 says nothing about poison, so index 0 is
// deliberately absent from gnome below. That asymmetry is the book's, not a
// transcription slip.
//
// KNOWN CAVEAT: index 0 is the COMBINED Paralyzation/Poison/Death Magic
// category. The book grants the bonus against poison alone, but 2e gives no
// way to split the category, so a dwarf or halfling also receives it against
// paralyzation and death magic here. Flagged rather than silently dropped.
const RACE_SAVE_BONUSES = {
  // PHB Ch.2: "dwarves have exceptional resistance to toxic substances. All
  // dwarven characters make saving throws against poison with the same bonuses
  // that they get against magical attacks."
  dwarf: {
    0: ({con}) => getConMagicSaveBonus(con),   // poison (see caveat above)
    1: ({con}) => getConMagicSaveBonus(con),   // Rod/Staff/Wand
    4: ({con}) => getConMagicSaveBonus(con)    // Spell
  },
  // PHB Ch.2: "Halflings have a similar resistance to poisons of all sorts, so
  // they gain a Constitution bonus identical to that for saving throws vs.
  // magical attacks when they make saving throws vs. poison."
  halfling: {
    0: ({con}) => getConMagicSaveBonus(con),   // poison (see caveat above)
    1: ({con}) => getConMagicSaveBonus(con),   // Rod/Staff/Wand
    4: ({con}) => getConMagicSaveBonus(con)    // Spell
  },
  // PHB Ch.2: the gnome entry grants the bonus against "magical wands, staves,
  // rods, and spells" ONLY. No poison clause for gnomes.
  gnome: {
    1: ({con}) => getConMagicSaveBonus(con),   // Rod/Staff/Wand
    4: ({con}) => getConMagicSaveBonus(con)    // Spell
  }
};

// === Combat & Exploration Bonuses ===
// A CURATED VIEW of RACIAL_ABILITIES, not a second copy of it. Each string is
// the NAME of an entry in RACIAL_ABILITIES; the prose lives there and only
// there. This deliberately excludes save bonuses (calculated elsewhere) and the
// detection abilities (their own section), which is why it cannot simply render
// the whole racial list.
//
// It used to restate the prose, and the two copies HAD ALREADY DRIFTED: the
// surprise entry read "reduced to -2" here and "or -2" there, and the
// sleep/charm wording differed as well. Names are now the RACIAL_ABILITIES
// names, so panel labels match the ability cards on the Abilities tab.

const RACIAL_COMBAT_BONUSES = {
  dwarf:      { combat: ["Attack Bonus vs. Orcs/Goblins"],
                defensive: ["AC Bonus vs. Giants"],
                special: ["Magic Item Malfunction"] },
  gnome:      { combat: ["Attack Bonus vs. Kobolds/Goblins"],
                defensive: ["AC Bonus vs. Giants"],
                special: ["Magic Item Failure"] },
  // DELIBERATELY EMPTY defensive, for halfling and elf both. This slot once
  // held "creatures larger than man-sized get -4 to hit you". PHB Ch.2 grants
  // that -4 to DWARVES and GNOMES only.
  halfling:   { combat: ["Sling/Thrown Bonus"],
                defensive: [],
                special: ["Surprise Bonus"] },
  elf:        { combat: ["Bow/Sword Bonus"],
                defensive: [],
                special: ["Resistance to Sleep/Charm", "Surprise Bonus"] },
  "half-elf": { combat: [], defensive: [],
                special: ["Resistance to Sleep/Charm"] },
  human:      { combat: [], defensive: [], special: [] }
};

// Resolve one category to {name, notes} objects pulled live from
// RACIAL_ABILITIES. A name that does not resolve is DROPPED and warned about
// rather than rendered blank -- a silent gap in the panel is exactly the sort
// of thing that goes unnoticed for months.
function racialBonusEntries(race, category) {
  const refs = RACIAL_COMBAT_BONUSES[race];
  if (!refs || !Array.isArray(refs[category])) return [];
  const list = (typeof RACIAL_ABILITIES !== 'undefined' && RACIAL_ABILITIES[race]) || [];
  const out = [];
  refs[category].forEach(nm => {
    const hit = list.find(a => a.name === nm);
    if (hit) out.push({ name: hit.name, notes: hit.notes });
    else console.warn('racialBonusEntries: no RACIAL_ABILITIES entry named "' +
                      nm + '" for race "' + race + '"');
  });
  return out;
}
// Alias, not a copy -- duplicated blocks drifting apart is how the old
// multi-class table accumulated three combinations the PHB does not allow.
RACIAL_COMBAT_BONUSES.halfelf = RACIAL_COMBAT_BONUSES["half-elf"];

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
  "weaponsmithing":     ["warrior"],

  // --- PHBR11 The Complete Ranger's Handbook, pp.82-86 ---
  // Group assignments are the book's own "Crossover Groups:" line at the end of
  // each proficiency description, NOT an inference from Table 55 (which is just
  // the filtered list of what a ranger may buy).
  //
  // THE THREE MULTI-GROUP ENTRIES ARE WHY THIS BLOCK EXISTS. A JSON record
  // carries ONE Category, so camouflage, foraging and trail signs would fall
  // back to warrior-only and overcharge a rogue a slot for each. The single-
  // group entries would work via the fallback, but are listed anyway so this
  // table stays the one authority and a later Category edit cannot silently
  // change what a proficiency costs.
  //
  // The book prints camouflage's groups as "Fighter, Rogue"; fighter is the
  // warrior group.
  "camouflage":           ["warrior", "rogue"],
  "foraging":             ["warrior", "rogue"],
  "trail signs":          ["warrior", "rogue"],
  "cartography":          ["general"],
  "distance sense":       ["general"],
  "falconry":             ["general"],
  "persuasion":           ["general"],
  "riding, sea-based":    ["general"],
  "signaling":            ["general"],
  "spelunking":           ["warrior"],
  "trail marking":        ["warrior"],
  "veterinary healing":   ["priest"],
  "weaponsmithing, crude": ["warrior"]
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
// PHBR2 p.16: "if the kit is not listed as appropriate in the proficiency's
// description, then an additional proficiency slot beyond the number listed is
// required, JUST AS IF THE PROFICIENCY WERE RESTRICTED TO ANOTHER CLASS".
//
// "Just as if" is an EQUIVALENCE, not an addition, so this returns 0 or 1 and
// getNWPSlotCost takes the MAX of it and the class-group surcharge rather than
// the sum. A thief taking Survival off-kit pays 2+1, never 2+1+1.
//
// APPROPRIATE IF EITHER PRINTING SAYS SO. The book prints this relationship
// twice -- per proficiency in Ch.2, and per kit in each kit's Nonweapon
// Proficiencies line -- AND THE TWO PRINTINGS DISAGREE IN 11 PLACES. Eight
// favour the kit entry (the Scout is required to take Tracking, which Ch.2's
// Tracking entry does not list him for); three favour Ch.2 (it recommends Voice
// Mimicry for Spies, whose kit entry omits it). Run crosscheck.js to list them.
// Reading both and penalising neither means the book's own inconsistency never
// costs a player a slot. Chris's ruling, August 2026.
function getKitProficiencySurcharge(nwp, root) {
  if (!root || typeof isSupplementActive !== 'function' ||
      !isSupplementActive('phbr2', 'kitProficiencyCost')) return 0;

  const kitValue = (root.querySelector('[data-field="kit"]') || {}).value || '';
  if (!kitValue) return 0;                       // no kit, no kit rule
  const kitKey = kitValue.toLowerCase().replace(/\s+/g, '');

  const name = String(nwp.name || nwp['Proficiency Name'] || '').trim().toLowerCase();
  if (!name) return 0;

  // SCOPED BY THE DATA, not by a source check. Only the Ch.2 proficiencies carry
  // kit lists, so anything without them is outside this rule and is never
  // surcharged -- which is what "these new proficiencies" means in the book.
  const rec = (typeof NWP_DATA !== 'undefined' && Array.isArray(NWP_DATA))
    ? NWP_DATA.find(r => String(r['Proficiency Name']).trim().toLowerCase() === name) : null;
  const reqK = (rec && rec['Required Kits'])    || [];
  const recK = (rec && rec['Recommended Kits']) || [];
  const hasLists = (reqK.length || (recK && recK.length));
  if (!hasLists) return 0;

  if (recK === 'ALL' || (Array.isArray(recK) && recK.indexOf('ALL') !== -1)) return 0;
  if (reqK.indexOf(kitKey) !== -1) return 0;
  if (Array.isArray(recK) && recK.indexOf(kitKey) !== -1) return 0;

  // The other printing: the kit's own list.
  const prof = (typeof getKitProficiencies === 'function') ? getKitProficiencies(root) : null;
  const nw = (prof && prof.nonweapon) || {};
  const owned = [].concat(nw.required || [], nw.recommended || [], nw.bonus || [])
    .map(s => String(s).trim().toLowerCase());
  if (owned.indexOf(name) !== -1) return 0;

  return 1;
}

// Slot cost of a single nonweapon proficiency, including the Table 38 crossover
// surcharge. `nwp` is an entry from root._nwps. `root` is OPTIONAL -- without it
// the PHBR2 kit surcharge is simply not applied, so old call sites are safe.
function getNWPSlotCost(nwp, allowedGroups, root) {
  // A kit-GRANTED proficiency is free and cannot become unfree -- neither
  // surcharge below may apply to it. The Stalker's Alertness and Camouflage are
  // Rogue-group proficiencies granted to a Ranger; charging the out-of-group +1
  // on something the kit hands over would be worse than charging the base cost.
  if (nwp && nwp.isKitGranted) return 0;

  // `|| 1` cannot tell an ABSENT slots value from a deliberate ZERO, and 0 is
  // falsy. Same trap as the weapon proficiency counter and the row label.
  const parsed = parseInt(nwp.slots !== undefined && nwp.slots !== null && nwp.slots !== ''
    ? nwp.slots : nwp.Slots, 10);
  const base = isNaN(parsed) ? 1 : parsed;

  // COMPUTED FIRST, because the class-group tests below return early. The 16 new
  // PHBR2 proficiencies are absent from Table 37, so getNWPGroups returns []
  // and the old early return would have skipped the kit rule entirely -- for
  // exactly the proficiencies the kit rule exists to govern.
  const kitSur = getKitProficiencySurcharge(nwp, root);

  const groups = getNWPGroups(nwp);
  let classSur = 0;
  if (groups.length && allowedGroups && allowedGroups.size > 0) {
    // PHB Table 38: a proficiency from ANY group the character has access to
    // costs its listed price. Only if it is outside ALL of them does it cost +1.
    classSur = groups.some(g => allowedGroups.has(g)) ? 0 : 1;
  }

  // MAX, NOT SUM -- see getKitProficiencySurcharge.
  return base + Math.max(classSur, kitSur);
}

// === Tracking (PHB Chapter 5, Tables 39 and 40) ===
// Tracking is a 2-slot Warrior-group proficiency checked against Wisdom.
// THE GATE: "Characters who are not rangers roll a proficiency check with a -6
// penalty to their ability scores; rangers have no penalty." Nothing modelled
// this before, so every non-ranger tracker was rolling six points too easy.
const TRACKING_NON_RANGER_PENALTY = -6;

// Table 39, applied CUMULATIVELY -- the book's own example stacks terrain,
// group size, age of trail and weather in a single check.
// `per` and `countLabel` appear only on the repeating rows: the player enters a
// QUANTITY and the modifier applies once per `per` units, floored. So eleven
// creatures give +5, not +5.5, and eleven hours of rain give -55 because that
// row counts every single hour.
const TRACKING_MODIFIERS = [
  { key: "soft",        label: "Soft or muddy ground",              mod:  +4 },
  { key: "brush",       label: "Thick brush, vines, or reeds",      mod:  +3 },
  { key: "signs",       label: "Occasional signs of passage, dust", mod:  +2 },
  { key: "normal",      label: "Normal ground, wood floor",         mod:   0 },
  { key: "rocky",       label: "Rocky ground or shallow water",     mod: -10 },
  { key: "perTwo",      label: "Every two creatures in the group",  mod:  +1,
    repeating: true, per: 2,  countLabel: "Creatures in the group" },
  { key: "per12Hours",  label: "Every 12 hours since trail made",   mod:  -1,
    repeating: true, per: 12, countLabel: "Hours since the trail was made" },
  { key: "perHourRain", label: "Every hour of rain, snow, or sleet", mod: -5,
    repeating: true, per: 1,  countLabel: "Hours of rain, snow or sleet" },
  { key: "poorLight",   label: "Poor lighting (moon or starlight)", mod:  -6 },
  { key: "hidden",      label: "Tracked party tries to hide trail", mod:  -5 }
];

// === PHBR11 Tables 15, 16 and 17 (p.15) -- SUPPLEMENT, gated ===
// The book states these "may be used in place of Table 39 in Chapter 5 of the
// Player's Handbook", so this is a straight replacement for TRACKING_MODIFIERS
// above, not an addition to it.
//
// THE STRUCTURE IS THE POINT. The PHB gives one flat list; the CRH splits it
// into three and says explicitly which are exclusive -- terrain and
// illumination are "use only one", special modifiers are "use all applicable".
// The PHB's terrain rows were always implicitly exclusive (ground cannot be
// both soft and rocky) and the panel rendered them as checkboxes anyway. The
// CRH makes the rule explicit, so the panel renders these as radios.
const TRACKING_GROUPS_CRH = {
  terrain:      { label: 'Terrain \u2014 use only one',        exclusive: true  },
  illumination: { label: 'Illumination \u2014 use only one',   exclusive: true  },
  special:      { label: 'Special \u2014 use all applicable',  exclusive: false }
};

const TRACKING_MODIFIERS_CRH = [
  // Table 15: Terrain Tracking Modifiers
  { key: "crhSnow",    group: "terrain", mod:  +6, label: "Fresh snow (clearly outlined footprints)" },
  { key: "crhSoft",    group: "terrain", mod:  +4, label: "Soft or muddy ground, loose dirt floor (good impressions, but not as defined as fresh snow)" },
  { key: "crhBrush",   group: "terrain", mod:  +3, label: "Thick brush, dense jungle (broken branches, crushed weeds)" },
  { key: "crhForest",  group: "terrain", mod:  +2, label: "Forests, fields, dusty indoor area (occasional marks of passage)" },
  { key: "crhNormal",  group: "terrain", mod:   0, label: "Normal ground, wood floor, plains with sparse vegetation (infrequent marks)" },
  { key: "crhDesert",  group: "terrain", mod:  -2, label: "Desert, dry sand" },
  { key: "crhSwamp",   group: "terrain", mod:  -5, label: "Swamp (spongy surface, little mud for prints, much vegetation)" },
  { key: "crhRocky",   group: "terrain", mod: -10, label: "Rocky terrain, solid ice, stone floors, shallow water (all but the most minute signs prohibited)" },

  // Table 16: Illumination Modifiers
  { key: "crhLightGood", group: "illumination", mod:   0, label: "Good illumination, sunny day; continual light or equivalent indoors" },
  { key: "crhLightDim",  group: "illumination", mod:  -3, label: "Twilight, light fog, snow, single torch in dark interior of building" },
  { key: "crhLightMoon", group: "illumination", mod:  -6, label: "Night with full moon, day with moderate fog" },
  { key: "crhLightNone", group: "illumination", mod: -10, label: "Overcast night with no moon, dense fog, blizzard, blowing sand" },

  // Table 17: Special Tracking Modifiers
  { key: "crhPerTwo",     group: "special", mod: +1, repeating: true, per: 2,
    label: "Every two creatures in the group being tracked", countLabel: "Creatures in the group" },
  // The ranger's own level bonus is DERIVED, not entered -- the panel reads the
  // character's ranger level. Left in the list so the player can see the rule.
  { key: "crhLevelBonus", group: "special", mod: +1, autoLevel: true, per: 3,
    label: "Every three experience levels of the ranger (round down)" },
  { key: "crhHelpers",    group: "special", mod: +1, repeating: true, per: 1,
    label: "Each additional tracker assisting (use the score of the best tracker)",
    countLabel: "Assisting trackers",
    note: "Total assistance bonus is capped at the ranger's own level bonus, +1 per 3 levels." },
  { key: "crhAnimal",     group: "special", mod: +1,
    label: "Animal follower assists in tracking",
    note: "An animal follower does NOT count as an additional tracker for the row above." },
  { key: "crhOwnTerrain", group: "special", mod: +2,
    label: "Trail is in a specialized ranger's primary terrain" },
  { key: "crhPer12Hours", group: "special", mod: -1, repeating: true, per: 12,
    label: "Every 12 hours since the trail was made", countLabel: "Hours since the trail was made" },
  { key: "crhPerHourRain", group: "special", mod: -5, repeating: true, per: 1,
    label: "Every hour of rain, snow or sleet since the trail was made", countLabel: "Hours of rain, snow or sleet" },
  { key: "crhHidden",     group: "special", mod: -5,
    label: "Creature being tracked attempts to hide the trail (covering footprints, detouring into a stream, secret doors)" },
  { key: "crhHiddenSpec", group: "special", mod: -2,
    label: "A specialized ranger being tracked hides his trail in his own primary terrain" }
];

// Table 40. The chance is the ADJUSTED Wisdom score being rolled against, not
// a percentage -- a higher number means an easier check and faster pursuit.
// The slowdown applies to the whole party, not just the tracker.
//
// THE OVERLAP AT 14 IS SETTLED, August 2026. PHB Table 40 reads "7-14" and then
// "14 or greater" on consecutive rows -- an error in the book, not a
// transcription slip. This was originally resolved in favour of the top band as
// the player-favourable reading, and flagged as a coin flip.
//
// PHBR11 Table 18 (p.15) prints the same table unambiguously as 1-6 / 7-14 /
// 15+, giving 14 to the MIDDLE band. That is the same publisher restating the
// same rule four years later, so it is read as CLARIFYING the PHB's intent
// rather than as a supplement changing it -- which is why this correction is
// NOT gated behind the PHBR11 toggle and applies to every character. The middle
// band's max moved from 13 to 14 and the earlier guess was wrong.
const TRACKING_MOVEMENT = [
  { max:  6, fraction: 1 / 4, label: "1/4 normal" },
  { max: 14, fraction: 1 / 2, label: "1/2 normal" },
  { max: Infinity, fraction: 3 / 4, label: "3/4 normal" }
];

function getTrackingMovement(chance) {
  const c = parseInt(chance, 10);
  if (isNaN(c)) return null;
  return TRACKING_MOVEMENT.find(r => c <= r.max) || null;
}

// === Nonweapon proficiency checks (PHB Chapter 5) ===
// "Add the modifier listed in Table 37 to the appropriate ability score. Then
//  the player rolls 1d20. If the roll is equal to or less than the character's
//  adjusted ability score, the character accomplished what he was trying to do.
//  (A roll of 20 always fails.)"
// Nothing computed this before -- the card printed the raw "Wis / -1" string
// and left the arithmetic to the player.
const NWP_NATURAL_FAIL = 20;

const NWP_ABILITY_SHORT = {
  str: "Str", dex: "Dex", con: "Con", int: "Int", wis: "Wis", cha: "Cha"
};

const NWP_ABILITY_ALIASES = {
  str: "str", strength: "str",
  dex: "dex", dexterity: "dex",
  con: "con", constitution: "con",
  int: "int", intelligence: "int",
  wis: "wis", wisdom: "wis",
  cha: "cha", charisma: "cha"
};

// Table 37 states the check as a "Wis / -1" string. Two shapes need handling
// beyond the obvious: "NA / NA" (Blind-fighting and Mountaineering have no
// check at all) and "Str or Cha / 0" (non-PHB entries offering a choice).
function parseNWPCheck(checkStr) {
  const raw = (checkStr || "").trim();
  const none = { hasCheck: false, abilities: [], modifier: 0 };
  if (!raw) return none;

  const parts = raw.split("/");
  const abilityPart = (parts[0] || "").trim();
  if (/^na$/i.test(abilityPart)) return none;

  const abilities = abilityPart
    .split(/\s+or\s+/i)
    .map(t => NWP_ABILITY_ALIASES[t.trim().toLowerCase()])
    .filter(Boolean);
  if (!abilities.length) return none;

  const modifier = parseInt((parts[1] || "").trim(), 10);
  return { hasCheck: true, abilities, modifier: isNaN(modifier) ? 0 : modifier };
}

// UNCONDITIONAL adjustments only. The situational ones -- a specialist's +3 to
// Spellcraft for his own school, Astrology aiding Navigation under visible
// stars, Animal Lore aiding Set Snares for game -- are deliberately NOT folded
// in here. They depend on circumstance, and baking them into the printed target
// would overstate the character every time the circumstance does not apply.
// Those surface as notes instead.
function getNWPCheckAdjustments(root, profName) {
  const name = (profName || "").trim().toLowerCase();
  const out = [];

  // Ch.5 Tracking: "Characters who are not rangers roll a proficiency check
  // with a -6 penalty to their ability scores; rangers have no penalty."
  if (name === "tracking") {
    const isRanger = getAllClassComponents(root)
      .some(c => (c.clazz || "").trim().toLowerCase().includes("ranger"));
    if (!isRanger) {
      out.push({ label: "Not a ranger", mod: TRACKING_NON_RANGER_PENALTY });
    }
  }

  // Ch.5 Stonemasonry: dwarves gain +2. The ONLY racial bonus to a nonweapon
  // proficiency anywhere in the chapter.
  if (name === "stonemasonry") {
    const race = (val(root, "race") || "").replace(/[^a-z]/gi, "").toLowerCase();
    if (race.includes("dwar")) out.push({ label: "Dwarf", mod: 2 });
  }

  return out;
}

// The general rule is that each extra proficiency slot spent on a nonweapon
// proficiency buys +1 to its checks. These eight are the exceptions the PHB
// spells out in the proficiency descriptions -- their extra slots buy something
// the check target cannot express. The slots are still spent and still charged;
// they simply do not move the number, so the card shows this text instead.
const NWP_BONUS_SLOT_EFFECTS = {
  "mountaineering":     "+10% to climb chances per extra slot (Table 65 base 50%)",
  "tightrope walking":  "reduces the width penalties by 1 per extra slot",
  "musical instrument": "one additional instrument per extra slot",
  // "...train other types of creatures OR improve his skill with an already
  // chosen type" -- the player picks, so this one can go either way.
  "animal training":    "another creature type, or +1 with one already known",
  "riding, airborne":   "one additional mount type per extra slot",
  "survival":           "one additional terrain type per extra slot",
  "religion":           "a wider region, or no check needed for one faith"
};
// NOT an exception: Riding, Land-Based. The Airborne entry explicitly allows
// extra slots to buy other mount types; the Land-Based entry does NOT say so,
// and only states that the mount type is declared when the slot is filled. RAW
// it therefore falls under the general rule and each extra slot gives +1 to the
// check. A DM may well allow another mount type by analogy -- the book doesn't.

// === Situational proficiency notes (PHB Ch.5) ===
// Bonuses that depend on CIRCUMSTANCE, and are therefore deliberately NOT folded
// into getNWPCheckTarget -- baking them into the printed target would overstate
// the character every time the circumstance does not apply. They surface as a
// disclosure on the proficiency card instead, so the player can see them
// without a number silently moving.
//
// ONLY CROP-VERIFIED ENTRIES BELONG HERE. Astrology's +1 to Navigation,
// Artistic Ability's +1 to music and art appraisal, and the specialist's +3 to
// Spellcraft are all still OCR-only and are deliberately absent until checked
// against the printed page.
const NWP_SITUATIONAL_NOTES = {
  "animal lore": [
    "+2 to Set Snares when the snare is meant to catch game \u2014 no benefit against monsters or intelligent beings."
  ],
  "set snares": [
    "+2 with Animal Lore, when catching game only.",
    "A successful check does not mean anything is caught \u2014 only that the snare works if triggered. The DM decides whether it is.",
    "Man-traps are thieves only."
  ],
  "healing": [
    "With Herbalism, recovery under complete rest rises from 2 to 3 hit points per day.",
    "With Herbalism, +2 to checks for treating disease.",
    "Swallowed or touched poisons need both Healing and Herbalism \u2014 healing to diagnose, herbalism to prepare a purgative."
  ],
  "herbalism": [
    "With Healing, recovery under complete rest rises from 2 to 3 hit points per day.",
    "With Healing, +2 to checks for treating disease.",
    "Swallowed or touched poisons need both proficiencies together."
  ],
  "astrology": [
    "+1 to all Navigation checks, provided the stars can be seen.",
    "Forecasts reach only 30 days ahead and are vague at best \u2014 a successful check foresees a general event, not a guaranteed outcome.",
    "A failed check yields no information; a natural 20 makes the prediction wildly inaccurate."
  ],
  "navigation": [
    "+1 with Astrology, provided the stars can be seen."
  ],
  "artistic ability": [
    "+1 to any check requiring artistic skill \u2014 music or dance \u2014 and to appraising objects of art.",
    "The character\u2019s own art form is chosen when the proficiency is taken.",
    "On a natural 1 when creating a work, it is truly lasting; on a failure it is aesthetically unpleasing or just plain bad."
  ],
  "spellcraft": [
    "Wizard specialists gain +3 when identifying magic of their own school.",
    "The caster must be observed until the very instant of casting, so this gives no advantage against combat spells.",
    "A separate chance, at half the normal check, recognises magical or magically endowed constructs for what they are."
  ]
};

// === Proficiency Abilities registry (PHB Ch.5) ===
// Proficiencies whose rules need working out at the table rather than a single
// target number. Each entry gets a tab in the Proficiency Abilities section.
// Keys are lowercased proficiency names, matching NWP_TABLE37_GROUPS.
//
// ADDING ONE is an entry here plus a builder in calc.js -- no layout work.
// `kind` tells the builder what shape the panel is, since these are NOT
// parallel: a modifier stack takes inputs and produces a target, a calculator
// produces figures from level and ability, and a reference panel has no inputs
// at all. Do not expect a shared template.
const PROFICIENCY_ABILITIES = {
  "tracking":          { label: "Tracking",          kind: "modifiers" },
  "tightrope walking": { label: "Tightrope Walking", kind: "modifiers" },
  "disguise":          { label: "Disguise",          kind: "modifiers" },
  "forgery":           { label: "Forgery",           kind: "modifiers" },
  "set snares":        { label: "Set Snares",        kind: "modifiers" },
  "hunting":           { label: "Hunting",           kind: "modifiers" },
  "jumping":           { label: "Jumping",           kind: "calculator" },
  // PHB Ch.5. A calculator, not a reference: what it shows depends on the
  // character's ENCUMBRANCE (tumbling is unavailable above light) and on his
  // proficiency check target for the falling rule.
  "tumbling":          { label: "Tumbling",          kind: "calculator" },
  "healing":           { label: "Healing",           kind: "calculator" },
  "riding, land-based":{ label: "Riding (Land)",     kind: "reference" },
  "riding, airborne":  { label: "Riding (Air)",      kind: "reference" }
};

// Which registry entries this character actually has. Order follows the
// registry, not the character's proficiency list, so the tab strip does not
// reshuffle when a proficiency is added or deleted.
function getProficiencyAbilities(root) {
  const owned = (root && root._nwps) || [];
  const have = {};
  owned.forEach(n => {
    const k = String((n && n.name) || "").trim().toLowerCase();
    if (PROFICIENCY_ABILITIES[k]) have[k] = n;
  });
  return Object.keys(PROFICIENCY_ABILITIES)
    .filter(k => have[k])
    .map(k => Object.assign({ key: k, nwp: have[k] }, PROFICIENCY_ABILITIES[k]));
}

// Returns everything the UI needs to print "Wis 14 -1 = roll 13 or less".
// `nwp` accepts either a stored card object (name / abilityCheck / bonusSlots)
// or a raw core_nwp.json record.
function getNWPCheckTarget(root, nwp) {
  const name = (nwp && (nwp.name || nwp["Proficiency Name"])) || "";
  const checkStr = (nwp && (nwp.abilityCheck || nwp["Ability Check"])) || "";
  const parsed = parseNWPCheck(checkStr);

  if (!parsed.hasCheck) {
    return { hasCheck: false, name };
  }

  // "Str or Cha" -- use whichever score serves the character better.
  let ability = parsed.abilities[0];
  let score = 0;
  parsed.abilities.forEach(a => {
    const s = parseInt(val(root, a) || 0, 10) || 0;
    if (s > score) { score = s; ability = a; }
  });

  const adjustments = getNWPCheckAdjustments(root, name);

  // PHB: "For every additional proficiency slot a character spends on a
  // nonweapon proficiency, he gains a +1 bonus to those proficiency checks."
  // EXCEPT for the eight in NWP_BONUS_SLOT_EFFECTS, whose extra slots buy
  // something else entirely. For those the slots are still SPENT -- and still
  // charged against the budget by renderProficiencySlots -- but they must not
  // move the check target, so nothing is pushed here.
  const bonusSlots = Math.max(0, parseInt(nwp && nwp.bonusSlots, 10) || 0);
  const altEffect  = NWP_BONUS_SLOT_EFFECTS[(name || "").trim().toLowerCase()] || null;
  if (bonusSlots > 0 && !altEffect) {
    adjustments.push({
      label: bonusSlots + " extra slot" + (bonusSlots > 1 ? "s" : ""),
      mod: bonusSlots
    });
  }

  const adjTotal = adjustments.reduce((s, a) => s + a.mod, 0);
  const target = score + parsed.modifier + adjTotal;

  return {
    hasCheck: true,
    name,
    ability,
    abilityLabel: NWP_ABILITY_SHORT[ability] || ability.toUpperCase(),
    score,
    modifier: parsed.modifier,
    adjustments,
    target,
    bonusSlots,
    // Non-null when extra slots buy something other than +1 to the check.
    altEffect,
    naturalFail: NWP_NATURAL_FAIL,
    // A 20 always fails, so a target at or above 20 is not truly automatic.
    alwaysFailsOn20: target >= NWP_NATURAL_FAIL,
    // No roll can succeed. For Tracking the book says the trail is then
    // permanently lost TO THAT CHARACTER.
    impossible: target < 1
  };
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

// === Specialist attacks per round (PHB Table 35) ===
// Three level bands: 1-6, 7-12, 13+. Replaces Table 15's rate for the
// SPECIALIZED weapon only -- every other weapon still uses the Table 15 base.
// The book writes these as "3/2", "1/1", "4/1" etc; the "/1" forms are just
// whole numbers and are normalised here to match the Attacks/Rd dropdown.
// BOW SPECIALISTS GAIN NO EXTRA ATTACKS -- the PHB says so outright, and bows
// have no column in the table. They get point-blank range instead.
const WEAPON_SPECIALIST_ATTACKS = {
  melee:        ['3/2', '2',   '5/2'],
  lightXbow:    ['1',   '3/2', '2'  ],
  heavyXbow:    ['1/2', '1',   '3/2'],
  thrownDagger: ['3',   '4',   '5'  ],
  thrownDart:   ['4',   '5',   '6'  ],
  otherMissile: ['3/2', '2',   '5/2']
  // bow: intentionally absent
};

// Point-blank range, granted to BOW AND CROSSBOW specialists only (PHB Ch.5).
// +2 to hit, no extra damage. Strength applies for bows, magic for both.
const POINT_BLANK_RANGE = { bow: '6-30 ft', crossbow: '6-60 ft' };

// === Missile range modifiers (PHB Table 45) ===
// "The attack roll modifiers for range are -2 for medium range and -5 for long
// range." Short range carries no modifier.
//
// Each band INCLUDES every distance at or below its listed figure -- the book's
// own example is a heavy crossbow (80/160/240) fired at 136 yards, which is at
// MEDIUM range, not long. Table 45 ranges are in YARDS.
//
// THESE ARE NEVER APPLIED TO A NUMBER. The sheet cannot know how far away a
// target is, so the modifiers are displayed beside the weapon's own bands and
// the player applies whichever one the situation calls for. Do not "finish" this
// by folding a modifier into the printed to-hit figure -- that would silently
// assert a range.
const RANGE_MODIFIERS = { short: 0, medium: -2, long: -5 };

// "Arquebuses (if allowed) double all range modifiers." Keyed on the specific
// weapon type rather than the Firearm group, because the book states the
// doubling for the arquebus alone -- the blunderbuss in core_wp.json is not a
// PHB weapon and inherits nothing.
const ARQUEBUS_RANGE_MULTIPLIER = 2;

function getRangeModifiers(weaponTypeKey) {
  const dbl = (weaponTypeKey === 'firearm_arquebus') ? ARQUEBUS_RANGE_MULTIPLIER : 1;
  return {
    short:   RANGE_MODIFIERS.short  * dbl,
    medium:  RANGE_MODIFIERS.medium * dbl,
    long:    RANGE_MODIFIERS.long   * dbl,
    doubled: dbl !== 1
  };
}

// Which Table 35 column a weapon uses. Returns a key of
// WEAPON_SPECIALIST_ATTACKS, 'bow' (no extra attacks), or null.
// `wtype` is the weapon card's Type dropdown value -- the weapon's mechanical
// identity regardless of what the player has named it.
function getSpecialistWeaponColumn(wtype, category, group) {
  const t = (wtype || '').trim().toLowerCase();
  const c = (category || '').trim().toLowerCase();
  const g = (group || '').trim().toLowerCase();

  if (g === 'bow')      return 'bow';               // no extra attacks
  if (g === 'crossbow') {
    // Table 35 lists only Light and Heavy. Hand crossbow rides with light.
    return t.indexOf('heavy') !== -1 ? 'heavyXbow' : 'lightXbow';
  }

  // Thrown columns apply only when the weapon is actually being thrown.
  // "Melee/Thrown" weapons like the dagger use the MELEE column in melee.
  const thrown = c === 'thrown';
  if (thrown && g === 'dagger') return 'thrownDagger';
  if (thrown && g === 'dart')   return 'thrownDart';
  if (thrown || c === 'ranged') return 'otherMissile';

  return 'melee';
}

// Attacks per round for a SPECIALIZED weapon. Returns null when the character
// cannot specialize, the rule is off, or the weapon is a bow.
function getSpecialistAttackRate(fighterLevel, wtype, category, group) {
  const lvl = parseInt(fighterLevel, 10);
  if (!lvl || lvl < 1) return null;

  const col = getSpecialistWeaponColumn(wtype, category, group);
  const row = WEAPON_SPECIALIST_ATTACKS[col];
  if (!row) return null;                             // bow, or unknown column

  const band = lvl >= 13 ? 2 : (lvl >= 7 ? 1 : 0);
  return row[band];
}

// Combat bonuses from specialization. MELEE ONLY gets +1/+2; bow and crossbow
// specialists get point-blank range instead and no flat bonuses.
// PHB: "The attack bonuses are not magical and do not enable the character to
// affect a creature that can be injured only by magical weapons."
function getSpecialistCombatBonuses(wtype, category, group) {
  const col = getSpecialistWeaponColumn(wtype, category, group);
  if (col === 'melee') return { hit: 1, damage: 2, pointBlank: null };
  if (col === 'bow')       return { hit: 0, damage: 0, pointBlank: POINT_BLANK_RANGE.bow };
  if (col === 'lightXbow' || col === 'heavyXbow')
                           return { hit: 0, damage: 0, pointBlank: POINT_BLANK_RANGE.crossbow };
  return { hit: 0, damage: 0, pointBlank: null };    // thrown and other missiles
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
  1:-2, 2:-1, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0,
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
  // PHB Table 24, Priest Spell Progression. Clerics and druids share this table
  // exactly -- a druid's difference is which SPHERES he may draw from, not how
  // many slots he gets. Priests have SEVEN spell levels; positions 8 and 9 exist
  // only so these arrays line up with the wizard tables and are always 0.
  // Table 24 footnotes: the 6th-level column is usable only by priests with
  // WIS 17+, the 7th only with WIS 18+.
  cleric: {
    1:[1,0,0,0,0,0,0,0,0],   2:[2,0,0,0,0,0,0,0,0],   3:[2,1,0,0,0,0,0,0,0],   4:[3,2,0,0,0,0,0,0,0],
    5:[3,3,1,0,0,0,0,0,0],   6:[3,3,2,0,0,0,0,0,0],   7:[3,3,2,1,0,0,0,0,0],   8:[3,3,3,2,0,0,0,0,0],
    9:[4,4,3,2,1,0,0,0,0],  10:[4,4,3,3,2,0,0,0,0],  11:[5,4,4,3,2,1,0,0,0],  12:[6,5,5,3,2,2,0,0,0],
    13:[6,6,6,4,2,2,0,0,0], 14:[6,6,6,5,3,2,1,0,0],  15:[6,6,6,6,4,2,1,0,0], 16:[7,7,7,6,4,3,1,0,0],
    17:[7,7,7,7,5,3,2,0,0], 18:[8,8,8,8,6,4,2,0,0],  19:[9,9,8,8,6,4,2,0,0], 20:[9,9,9,8,7,5,2,0,0]
  },
  // Identical to cleric through 15th (PHB Table 24). Beyond 15th a druid never
  // gains new spells -- "ignore the Priest Spell Progression table from this
  // point on" -- so 16-20 are frozen at the 15th-level row. Hierophant levels
  // buy spell-LIKE powers instead. A 15th-level druid is by definition the
  // Grand Druid, whose six-of-each-level allotment is applied as an override.
  druid: {
    1:[1,0,0,0,0,0,0,0,0],   2:[2,0,0,0,0,0,0,0,0],   3:[2,1,0,0,0,0,0,0,0],   4:[3,2,0,0,0,0,0,0,0],
    5:[3,3,1,0,0,0,0,0,0],   6:[3,3,2,0,0,0,0,0,0],   7:[3,3,2,1,0,0,0,0,0],   8:[3,3,3,2,0,0,0,0,0],
    9:[4,4,3,2,1,0,0,0,0],  10:[4,4,3,3,2,0,0,0,0],  11:[5,4,4,3,2,1,0,0,0],  12:[6,5,5,3,2,2,0,0,0],
    13:[6,6,6,4,2,2,0,0,0], 14:[6,6,6,5,3,2,1,0,0],  15:[6,6,6,6,4,2,1,0,0],
    16:[6,6,6,6,4,2,1,0,0], 17:[6,6,6,6,4,2,1,0,0],  18:[6,6,6,6,4,2,1,0,0],
    19:[6,6,6,6,4,2,1,0,0], 20:[6,6,6,6,4,2,1,0,0]
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
    17:[4,4,3,3,3,1,0,0,0], 18:[4,4,4,3,3,2,0,0,0],  19:[4,4,4,4,3,2,0,0,0], 20:[4,4,4,4,4,3,0,0,0]
  },
  // PHB Table 17. Paladins cast NOTHING until 9th level and reach only FOUR
  // priest spell levels -- combat, divination, healing and protective spheres.
  // Paladins do NOT gain bonus spells for high Wisdom.
  paladin: {
    1:[0,0,0,0,0,0,0,0,0],   2:[0,0,0,0,0,0,0,0,0],   3:[0,0,0,0,0,0,0,0,0],   4:[0,0,0,0,0,0,0,0,0],
    5:[0,0,0,0,0,0,0,0,0],   6:[0,0,0,0,0,0,0,0,0],   7:[0,0,0,0,0,0,0,0,0],   8:[0,0,0,0,0,0,0,0,0],
    9:[1,0,0,0,0,0,0,0,0],  10:[2,0,0,0,0,0,0,0,0],  11:[2,1,0,0,0,0,0,0,0],  12:[2,2,0,0,0,0,0,0,0],
    13:[2,2,1,0,0,0,0,0,0], 14:[3,2,1,0,0,0,0,0,0],  15:[3,2,1,1,0,0,0,0,0], 16:[3,3,2,1,0,0,0,0,0],
    17:[3,3,3,1,0,0,0,0,0], 18:[3,3,3,1,0,0,0,0,0],  19:[3,3,3,2,0,0,0,0,0], 20:[3,3,3,3,0,0,0,0,0]
  },
  hb_dpaladin: {
    1:[2,2,0,0,0,0,0,0,0],   2:[2,2,1,0,0,0,0,0,0],   3:[2,2,1,1,0,0,0,0,0],   4:[2,2,2,1,0,0,0,0,0],
    5:[2,2,2,1,0,0,0,0,0],   6:[3,2,2,1,0,0,0,0,0],   7:[3,3,2,1,0,0,0,0,0],   8:[3,3,3,1,0,0,0,0,0],
    9:[3,3,3,2,0,0,0,0,0],  10:[3,3,3,2,0,0,0,0,0],  11:[3,3,3,3,0,0,0,0,0],  12:[3,3,3,3,0,0,0,0,0],
    13:[3,3,3,3,0,0,0,0,0], 14:[3,3,3,3,0,0,0,0,0], 15:[3,3,3,3,0,0,0,0,0], 16:[3,3,3,3,0,0,0,0,0],
    17:[3,3,3,3,0,0,0,0,0], 18:[3,3,3,3,0,0,0,0,0], 19:[3,3,3,3,0,0,0,0,0], 20:[3,3,3,3,0,0,0,0,0]
  },
  // PHB Table 18. Rangers cast NOTHING until 8th level and reach only THREE
  // priest spell levels -- plant and animal spheres only. Table 18 stops at
  // ranger 16 ("maximum attainable"), so 17-20 hold at the 16th-level row.
  // Rangers do NOT gain bonus spells for high Wisdom.
  ranger: {
    1:[0,0,0,0,0,0,0,0,0],   2:[0,0,0,0,0,0,0,0,0],   3:[0,0,0,0,0,0,0,0,0],   4:[0,0,0,0,0,0,0,0,0],
    5:[0,0,0,0,0,0,0,0,0],   6:[0,0,0,0,0,0,0,0,0],   7:[0,0,0,0,0,0,0,0,0],   8:[1,0,0,0,0,0,0,0,0],
    9:[2,0,0,0,0,0,0,0,0],  10:[2,1,0,0,0,0,0,0,0],  11:[2,2,0,0,0,0,0,0,0],  12:[2,2,1,0,0,0,0,0,0],
    13:[3,2,1,0,0,0,0,0,0], 14:[3,2,2,0,0,0,0,0,0],  15:[3,3,2,0,0,0,0,0,0], 16:[3,3,3,0,0,0,0,0,0],
    17:[3,3,3,0,0,0,0,0,0], 18:[3,3,3,0,0,0,0,0,0],  19:[3,3,3,0,0,0,0,0,0], 20:[3,3,3,0,0,0,0,0,0]
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

// === Priest 6th/7th-level Wisdom gate (PHB Table 24 footnotes) ===
//   *  6th-level priest spells are usable only by priests with WIS 17 or greater
//   ** 7th-level priest spells are usable only by priests with WIS 18 or greater
// This is a HARD GATE on access, and is a different rule from WIS_BONUS_SPELLS
// (Table 5), which grants EXTRA slots at low spell levels for high Wisdom.
// No interaction between the two: the lowest Wisdom that grants a bonus 6th-level
// spell is 23, and a bonus 7th-level spell is 25, so both already clear the gate.
// Paladins reach only 4 spell levels and rangers only 3, so this never bites them.
const PRIEST_SPELL_LEVEL_WIS_MIN = { 6: 17, 7: 18 };

// Returns a NEW array with any ungated spell levels zeroed. Never mutates input.
function applyPriestWisdomGate(slots, wis) {
  if (!Array.isArray(slots)) return slots;
  const w = parseInt(wis, 10);
  const out = slots.slice();
  Object.keys(PRIEST_SPELL_LEVEL_WIS_MIN).forEach(lvl => {
    const min = PRIEST_SPELL_LEVEL_WIS_MIN[lvl];
    if (isNaN(w) || w < min) out[parseInt(lvl, 10) - 1] = 0;
  });
  return out;
}

// Which spell levels the character WOULD have had but cannot use, and why.
// IMPORTANT: pass the RAW table values here, before applyPriestWisdomGate --
// after gating the counts are zero and there is nothing left to report on.
// Returns [] when nothing is gated.
function getPriestWisdomGateNotes(slots, wis) {
  const notes = [];
  if (!Array.isArray(slots)) return notes;
  const w = parseInt(wis, 10);
  Object.keys(PRIEST_SPELL_LEVEL_WIS_MIN).forEach(lvl => {
    const n = parseInt(lvl, 10);
    const min = PRIEST_SPELL_LEVEL_WIS_MIN[lvl];
    if ((slots[n - 1] || 0) > 0 && (isNaN(w) || w < min)) {
      notes.push({ level: n, min: min });
    }
  });
  return notes;
}


// ---------------------------------------------------------------------------
// GRAND DRUID, ARCHDRUID AND HIEROPHANT -- PHB Ch.3, "The Grand Druid and
// Hierophant Druids". Four separate rules live here.
//
// 1. ALLOTMENT. The Grand Druid "knows six spells of each level (instead of the
//    normal spell progression)". Priests have seven spell levels, so that is a
//    flat row of six. Stepping down relinquishes ONLY the bonus spell levels
//    and the experience points -- "he keeps the rest of his abilities" -- and
//    "beyond 15th level, a druid never gains any new spells", so this row holds
//    from 15th all the way through 20th. SPELL_SLOTS_TABLES.druid stays a
//    faithful Table 24 transcription; this is applied over the top of it.
//
// 2. BONUS SPELL LEVELS. A pool, not slots: "up to six additional spell levels,
//    either as a single spell or as several spells whose levels total to six".
//    Archdruids -- the three of the Grand Druid's nine attendants who roam as
//    his messengers and agents -- each receive four. Relinquished on stepping
//    down. A six-level pool cannot reach a 7th-level spell.
//
// 3. THE LEVEL CAP. The text gives the Grand Druid exactly one advancement,
//    "500,000 more experience points" to reach 16th, and then the only forward
//    path it offers is resignation. So he holds at 16th for as long as he keeps
//    the title. Level is a manual field, so this is ADVISORY -- a campaign
//    constraint, not arithmetic the tool owns.
//
// 4. HIEROPHANT XP. Table 23's druid column stacks TWO scales in one strip of
//    numbers. Rows 1-16 are cumulative from zero (16th reads 3,500,000, which
//    is the 3,000,000 for 15th plus the "only 500,000 more" the text specifies).
//    Rows 17-20 carry the asterisk and count from the post-reset baseline of
//    1 XP, so they are kept OUT of XP_TABLES.druid -- a non-monotonic array
//    there would make "XP to next level" produce nonsense.
// ---------------------------------------------------------------------------

const GRAND_DRUID_SLOTS     = [6,6,6,6,6,6,6,0,0];
const GRAND_DRUID_MIN_LEVEL = 15;
const GRAND_DRUID_MAX_LEVEL = 16;

// Single source of truth for the roles. bonusLevels feeds the pool control.
const DRUID_ROLES = {
  archdruid:  { label: 'Archdruid',                 bonusLevels: 4 },
  grand:      { label: 'Grand Druid',               bonusLevels: 6 },
  hierophant: { label: 'Hierophant (stepped down)', bonusLevels: 0 }
};

// Table 23, druid column, rows 17-20 -- the post-reset scale.
const HIEROPHANT_XP = { 17: 500000, 18: 1000000, 19: 1500000, 20: 2000000 };

function isDruidClass(clazz) {
  return (clazz || '').toLowerCase().includes('druid');
}

// The role actually in effect. A 15th-level druid IS the Grand Druid by
// definition -- "only one person in a world can ever hold this title at one
// time. Consequently, only one druid can be 15th level at any time" -- and only
// a hierophant reaches 17th. So the role is DERIVED when the stored field is
// blank rather than silently written into the character record. An explicitly
// stored role always wins.
function getDruidRole(clazz, level, storedRole) {
  if (!isDruidClass(clazz)) return '';
  const stored = (storedRole || '').toLowerCase();
  if (stored && DRUID_ROLES[stored]) return stored;
  const lvl = parseInt(level, 10);
  if (isNaN(lvl)) return '';
  if (lvl > GRAND_DRUID_MAX_LEVEL)  return 'hierophant';
  if (lvl >= GRAND_DRUID_MIN_LEVEL) return 'grand';
  return '';
}

// Six of each level, replacing Table 24 from 15th onward. Returns a NEW array
// and never mutates its input. Applies on LEVEL alone: every role that can be
// at 15th or above -- sitting Grand Druid or stepped-down hierophant -- keeps
// the allotment, because resignation surrenders the pool and the XP, not this.
function applyGrandDruidAllotment(slots, clazz, level) {
  if (!isDruidClass(clazz)) return slots;
  const lvl = parseInt(level, 10);
  if (isNaN(lvl) || lvl < GRAND_DRUID_MIN_LEVEL) return slots;
  return GRAND_DRUID_SLOTS.slice();
}

// How many bonus spell levels the role grants. 0 for everyone else.
function getDruidBonusPool(role) {
  const r = DRUID_ROLES[(role || '').toLowerCase()];
  return r ? r.bonusLevels : 0;
}

// Levels consumed by an allocation. alloc is indexed 0-8 and holds a COUNT of
// bonus spells taken at each spell level, so a 3rd-level spell costs 3.
function getDruidBonusSpent(alloc) {
  if (!Array.isArray(alloc)) return 0;
  return alloc.reduce((sum, n, i) => sum + ((parseInt(n, 10) || 0) * (i + 1)), 0);
}

// Fold an allocation into a slot row. Returns a NEW array. MUST run BEFORE
// applyPriestWisdomGate: Table 24's footnotes read "Usable only by priests with
// 17 [18] or greater Wisdom" -- a restriction on the PRIEST, not on the column
// -- so it survives the progression being replaced, and a pool level spent on a
// 6th-level spell by a WIS 16 druid is correctly zeroed out.
function applyDruidBonusSpells(slots, alloc) {
  if (!Array.isArray(slots) || !Array.isArray(alloc)) return slots;
  return slots.map((n, i) => (n || 0) + (parseInt(alloc[i], 10) || 0));
}

// The XP a hierophant needs for his NEXT level, on the post-reset scale.
// Returns null outside 17-20, including for a sitting Grand Druid at 16 -- he
// has no next level to buy, which is a different answer from "unknown".
function getHierophantNextXP(level) {
  const lvl = parseInt(level, 10);
  if (isNaN(lvl)) return null;
  return (typeof HIEROPHANT_XP[lvl + 1] === 'number') ? HIEROPHANT_XP[lvl + 1] : null;
}

// Campaign constraints and standing reminders. ADVISORY ONLY -- these are facts
// about the world the DM runs, not numbers the tool derives, so nothing here
// ever blocks. Returns [] when there is nothing to say.
function getDruidRoleNotes(clazz, level, role) {
  const notes = [];
  if (!isDruidClass(clazz)) return notes;
  const lvl = parseInt(level, 10);
  const r   = (role || '').toLowerCase();

  if (r === 'grand') {
    notes.push('Only one druid in the world may hold the title of Grand Druid, ' +
               'and only one druid may be 15th level at any time.');
    if (!isNaN(lvl) && lvl >= GRAND_DRUID_MAX_LEVEL) {
      notes.push('A Grand Druid advances no further while he holds the title. ' +
                 '17th level requires stepping down as a hierophant druid, which ' +
                 'surrenders the six bonus spell levels and all experience but 1.');
    }
  }
  if (r === 'archdruid') {
    notes.push('Three of the Grand Druid\'s nine attendants are archdruids, ' +
               'roaming as his messengers and agents. Each receives four ' +
               'additional spell levels.');
  }
  if (!isNaN(lvl) && lvl > GRAND_DRUID_MAX_LEVEL && r !== 'hierophant') {
    notes.push('Only a hierophant druid -- a former Grand Druid who has stepped ' +
               'down -- reaches 17th level or higher.');
  }
  return notes;
}


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

// PHB Ch.3, Paladin: "A paladin receives a +2 bonus to all saving throws."
// All five categories, no level requirement.
//
// SIGN: stored as -2, NOT +2. This codebase expresses save adjustments as a
// delta to the TARGET NUMBER, and saving throws are roll-high -- see
// CON_MAGIC_SAVE_BONUS, where a CON 18 dwarf's bonus is -5. A literal +2 here
// would make paladins save WORSE.
const PALADIN_SAVE_BONUS = -2;

// RULED (Chris, 2026-07): the homebrew demi-paladin variants DO get this, so
// the broad substring match below is DELIBERATE -- it catches "paladin",
// "demipaladin" and "hb_dpaladin" alike. This function briefly carried
// exclusions for the two homebrews; they came out once we established that
// the Abilities tab had been listing "Divine Protection: +2 bonus to all
// saving throws" for hb_dpaladin all along (CLASS_ABILITIES resolves by
// substring too), and that the player had been hand-entering -2 in the
// savemod boxes to reconcile the two. Granting it here restores the status
// quo and lets those manual entries be deleted -- it is not a buff.
//
// FUTURE HOOK -- FALLEN PALADIN, not yet modelled. PHB Ch.3 makes this
// losable, in three grades: an alignment change costs "all his special
// powers -- sometimes only temporarily and sometimes forever"; an evil act
// while enchanted or controlled suspends paladinhood until atonement; a
// knowing, willing evil act ends it "immediately and irrevocably ... He is
// ever after a fighter." A fallen paladin keeps NONE of this, and functions
// as a fighter of the same level without weapon specialization.
//
// Chris's own character is in the middle case right now -- fallen by
// alignment change, on a redemption arc -- but is deliberately being played
// with abilities ACTIVE, so nothing is gated. When status does get modelled,
// THIS FUNCTION is the single place to test the flag. Do not scatter that
// check across the save, turn-undead and ability-list call sites.
function hasPaladinSaveBonus(clazz) {
  const c = (clazz || "").trim().toLowerCase();
  if (!c) return false;
  return c.includes('paladin');
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

// === Clothing weight (PHB Ch.6, "Encumbrance (Optional Rule)") ===
// "Encumbrance is measured in pounds. To calculate encumbrance, simply total
// the pounds of gear carried by the creature or character. Add five pounds for
// clothing, if any is worn."
// Applied as a flat constant. Ordinary clothing is not itemised on the sheet,
// so this stands in for it. If a player HAS itemised a robe or cloak in the
// armor list, that piece's own weight is counted as well -- the PHB gives no
// guidance on the overlap, and 5 lbs is simply the book's shorthand for
// "dressed". Surfaced as its own line in the encumbrance tooltip so the weight
// is never unexplained.
const ENCUMBRANCE_CLOTHING_WEIGHT = 5;

// === Coin weight (NOT stated in PHB Chapter 6) ===
// Chapter 6 gives coin values (Table 42) but never a coin weight. Two figures
// are in common use at 2e tables:
//   50 coins = 1 lb -- the 2nd Edition figure, from the DMG's encumbrance rules.
//   10 coins = 1 lb -- the 1st Edition holdover, still widely used.
// Because the PHB is silent, neither can be called RAW from this chapter, which
// is why this is a toggle rather than a fixed constant. Do not "correct" one of
// these away on a future audit -- both are deliberate.
// Read live via getCoinsPerPound() so a Settings change applies without a reload.
const COINS_PER_POUND_2E = 50;
const COINS_PER_POUND_1E = 10;

function getCoinsPerPound() {
  return isOptionalRule('coinWeight2e') ? COINS_PER_POUND_2E : COINS_PER_POUND_1E;
}

// === Table 42: Standard Exchange Rates (PHB Chapter 6) ===
// Table 42 prints all twenty-five pairings, but it reduces without loss to one
// row: the worth of each coin in COPPER. Every other cell divides out of these
// five numbers, so this IS the table, not a summary of it.
// Transcribed from a photograph of Chris's printed page and checked in both
// directions, July 2026.
//
// Copper is the base because it is the only one that makes all five whole.
// Display is in GOLD, 2e's unit of account -- Table 44 prices the entire
// equipment list in gp.
//
// Distinct from COINS_PER_POUND above: that is weight and the PHB never states
// it, this is value and the PHB prints it. Do not conflate them -- 500 cp and
// 500 pp weigh the same and are a thousandfold apart in worth.
const COIN_VALUES_CP = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 500 };
const COINS_PER_GP   = COIN_VALUES_CP.gp;          // 100
const COIN_UNITS     = ['cp', 'sp', 'ep', 'gp', 'pp'];  // Table 42's own row order

// Worth of `count` coins of `unit`, in gp. Deliberately returns a float: one
// copper is 0.01 gp and rounding here would erase it.
function coinsToGp(count, unit) {
  const n = parseFloat(count);
  if (!isFinite(n)) return 0;
  const cp = COIN_VALUES_CP[String(unit || 'gp').toLowerCase()];
  return cp ? (n * cp) / COINS_PER_GP : 0;
}

// One formatter, so the coin total and the valuables total cannot drift into
// different rounding. Whole numbers print clean; two decimal places is exactly
// enough to hold copper.
function formatGp(gp) {
  const n = Number(gp) || 0;
  return (Math.round(n * 100) / 100)
    .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

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

// === Magic item types (PHB Chapter 10) ===
// Chapter 10 enumerates the categories of magical item a character can find:
// Magical Weapons, Magical Armor, Potions and Oils, Scrolls, Rings, Wands/
// Staves/Rods, Miscellaneous Magic, and Artifacts and Relics.
//
// Wands, staves and rods share one heading in the book but are described as
// three separate things -- wands are "commonly used by wizards", staves "can be
// used by either a wizard or a priest", rods are "the rarest of all" -- so they
// are kept as three keys rather than collapsed into one.
//
// `charges` marks the types the chapter states are expendable: "Wands, staves,
// and rods are not limitless in their power. Each use drains them slightly,
// using up a charge." Chapter 10 gives charges to NOTHING else, so nothing else
// carries the flag. If your table runs charged miscellaneous items (a chime of
// opening and similar), set `charges: true` on `misc` -- that one edit is the
// whole change, because the card reads this registry rather than a hardcoded
// list.
//
// Keys are what character records store and must never be renamed; relabel
// instead. The empty key is the unset state and is deliberately first.
const MAGIC_ITEM_TYPES = [
  { key: '',         label: '\u2014',           charges: false },
  // Weapons and armor are deliberately absent. Chapter 10 does list them as
  // categories of magical treasure, but where the BOOK files a thing and where
  // the SHEET should hold it are different questions. On the Weapons and Armor
  // tabs the Enchanted? tick and its bonus fields actually drive THAC0, attack
  // and damage adjustments, the weapon speed-factor rule, AC, and the Ch.6
  // magical-armor encumbrance exclusion. The same sword filed here would be
  // inert -- a line of text computing nothing. Do not "restore" these on a
  // later audit; their absence is the decision.
  { key: 'potion',   label: 'Potion / Oil',     charges: false },
  { key: 'scroll',   label: 'Scroll',           charges: false },
  { key: 'ring',     label: 'Ring',             charges: false },
  { key: 'wand',     label: 'Wand',             charges: true  },
  { key: 'staff',    label: 'Staff',            charges: true  },
  { key: 'rod',      label: 'Rod',              charges: true  },
  { key: 'misc',     label: 'Miscellaneous',    charges: false },
  { key: 'artifact', label: 'Artifact / Relic', charges: false }
];

function magicItemTypeHasCharges(key) {
  const t = MAGIC_ITEM_TYPES.find(x => x.key === (key || ''));
  return !!(t && t.charges);
}

function magicItemTypeLabel(key) {
  const t = MAGIC_ITEM_TYPES.find(x => x.key === (key || ''));
  return t ? t.label : '\u2014';
}

// === Valuable types (PHB Chapter 10) ===
// Chapter 10's own enumeration of what fills a horde besides coin: gems cut and
// uncut, jewelry, objects of artistic value, objects of valuable metal (which
// "must be melted down for their metal" when no buyer can be found), coinage no
// longer current that "can be sold only by their weight", and the unusual goods
// -- furs, exotic animals, spices, rare spell components, trade goods.
//
// METADATA ONLY. Nothing keys arithmetic off this; the valuables total sums
// every row whatever its type. It exists so a horde reads at a glance and so
// the printed sheet can say what a line is. `misc` is the catch-all.
const VALUABLE_TYPES = [
  { key: '',          label: '\u2014' },
  { key: 'gem',       label: 'Gem' },
  { key: 'jewelry',   label: 'Jewelry' },
  { key: 'art',       label: 'Art Object' },
  { key: 'metal',     label: 'Valuable Metal' },
  { key: 'currency',  label: 'Alt. Currency' },
  { key: 'trade',     label: 'Trade Goods' },
  { key: 'fur',       label: 'Furs' },
  { key: 'spice',     label: 'Spices' },
  { key: 'component', label: 'Spell Components' },
  { key: 'animal',    label: 'Exotic Animal' },
  { key: 'misc',      label: 'Miscellaneous' }
];

function valuableTypeLabel(key) {
  const t = VALUABLE_TYPES.find(x => x.key === (key || ''));
  return t ? t.label : '\u2014';
}

// === Legacy migration: the old free-text "Value (ea)" ===
// Value (ea) was a text box, so existing records hold "500 gp", "1,000",
// "~200 each", "12gp" and anything else a player typed. This pulls a number and
// a unit out of whatever is there. Called ONLY when the structured `value`
// field is absent, so it runs once per record and can never overwrite real
// data.
//   - commas are stripped first, or "1,000" would parse as 1
//   - the first number wins, so "~200 each" gives 200
//   - a cp/sp/ep/gp/pp token anywhere sets the unit; note there is no leading
//     word boundary, because "12gp" has none and is a normal thing to type
//   - no token means gp, 2e's unit of account
function parseLegacyValueEach(raw) {
  const s = String(raw == null ? '' : raw);
  const num  = s.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  const unit = s.toLowerCase().match(/(cp|sp|ep|gp|pp)\b/);
  return {
    value: num ? num[0] : '',
    unit:  unit ? unit[1] : 'gp'
  };
}

// === NPC categories (PHB Chapter 12) ===
// Chapter 12 names three groups of NPC -- hirelings, followers and henchmen --
// and separates them by the SHAPE OF THE AGREEMENT, not by occupation. Henchmen
// have their own list on the Followers tab, so only the two that share the
// Followers & Hirelings card are enumerated here.
//
//   HIRELING: "always employed for a stated term of service or for the
//   performance of a specific task." Bound by regular pay and good treatment
//   and nothing else -- the chapter says flatly that hirelings "do not serve a
//   PC out of any great loyalty" -- and freely replaceable.
//
//   FOLLOWER: no term of contract at all. A stronghold is required to attract
//   any. They "appear only once" and no replacements arrive to fill the ranks
//   of the fallen; all followers in a unit advance to the next level at the
//   same time; and they do not accompany the player characters on adventures.
//
// `term` is the one field a caller keys off: a Duration is meaningful for a
// hireling and meaningless for a follower.
//
// THE UNSET ENTRY IS DELIBERATE and is where every pre-existing record lands.
// The card is named "hireling" in the markup but "Followers & Hirelings" on
// screen, so an old row could honestly be either. Unset says so, rather than
// declaring a player's followers to be hirelings on his behalf.
const NPC_CATEGORIES = [
  { key: '',         label: '\u2014',   term: null  },
  { key: 'hireling', label: 'Hireling', term: true  },
  { key: 'follower', label: 'Follower', term: false }
];

function npcCategoryLabel(key) {
  const c = NPC_CATEGORIES.find(x => x.key === (key || ''));
  return c ? c.label : '\u2014';
}

function npcCategoryHasTerm(key) {
  const c = NPC_CATEGORIES.find(x => x.key === (key || ''));
  return !!(c && c.term);
}

// === Vision and Light (PHB Ch.13) ===
//
// TABLE 62 VERBATIM. ALL RANGES ARE IN YARDS -- the chapter states this
// outright, and every other distance in this codebase is in feet. Do not
// "correct" these to feet on a later pass.
//
// The five columns are not five degrees of one thing; each answers a
// different question, and the chapter defines them:
//   movement  Max distance a MOVING figure can be seen. A stationary figure
//             usually cannot be seen at all at this range, and even a moving
//             one reads only as "something is moving".
//   spotted   Max distance a moving OR STATIONARY figure can be seen. General
//             size and shape only.
//   type      General details -- species or race, weapons carried.
//   id        Exact, or reasonably exact, identification of the individual.
//   detail    Small actions seen clearly (the chapter's own example is
//             noticing a pick-pocketing attempt).
//
// Row order is the book's own, the same way COIN_UNITS keeps Table 42's.
const VISIBILITY_RANGES = [
  { condition: 'Clear sky',              movement: 1500, spotted: 1000, type: 500, id: 100, detail: 10 },
  { condition: 'Fog, dense or blizzard', movement:   10, spotted:   10, type:   5, id:   5, detail:  3 },
  { condition: 'Fog, light or snow',     movement:  500, spotted:  200, type: 100, id:  30, detail: 10 },
  { condition: 'Fog, moderate',          movement:  100, spotted:   50, type:  25, id:  15, detail: 10 },
  { condition: 'Mist or light rain',     movement: 1000, spotted:  500, type: 250, id:  30, detail: 10 },
  { condition: 'Night, full moon',       movement:  100, spotted:   50, type:  30, id:  10, detail:  5 },
  { condition: 'Night, no moon',         movement:   50, spotted:   20, type:  10, id:   5, detail:  3 },
  { condition: 'Twilight',               movement:  500, spotted:  300, type: 150, id:  30, detail: 10 }
];

const VISIBILITY_SIZES = [
  { key: 'S', label: 'Small (size S)' },
  { key: 'M', label: 'Man-sized (size M)' },
  { key: 'L', label: 'Large (size L or larger)' }
];

// Apply the size adjustment to one Table 62 row. Never mutates the row.
//
// SMALL IS A COLUMN SHIFT, NOT A HALVING. The chapter says "all categories are
// reduced to the next lower category (except the 'detail' range, which remains
// unchanged)", and then prints its own worked example: a small creature under
// clear conditions is movement 1,000, spotted 500, type 100, ID and detail 10.
// Shifting clear sky's own row one column left reproduces that exactly, and no
// halving does. If anyone ever "simplifies" this to a multiplier, that example
// is the test it will fail.
//
// LARGE DOUBLES THREE COLUMNS, NOT FIVE. The chapter names movement, spotting
// and type. ID and detail are not mentioned and are not touched. The line about
// exceptionally large creatures being visible even further carries no number,
// so nothing here models it.
function visibilityRowForSize(row, sizeKey) {
  const out = {
    condition: row.condition,
    movement:  row.movement,
    spotted:   row.spotted,
    type:      row.type,
    id:        row.id,
    detail:    row.detail
  };
  if (sizeKey === 'S') {
    out.movement = row.spotted;
    out.spotted  = row.type;
    out.type     = row.id;
    out.id       = row.detail;
    // detail deliberately unchanged
  } else if (sizeKey === 'L') {
    out.movement = row.movement * 2;
    out.spotted  = row.spotted  * 2;
    out.type     = row.type     * 2;
  }
  return out;
}

// TABLE 63 VERBATIM. Radii are in FEET here, unlike Table 62 above -- that
// switch is the book's, not a transcription error.
//
//   beamWidth  Present only for the two sources the table footnotes: their
//              light is "not cast in a radius, but rather in a cone-shaped
//              beam", and the value is the cone's width at its far end. A
//              renderer that prints these two as radii is printing a lie.
//   magical    Comes from a spell rather than from carried, burnable gear.
//   optional   Magical weapons shed light only "if your DM allows this
//              optional rule". PHB optional rules ship OFF in this project,
//              so nothing may display this row as active by default.
//   equipment  The name core_equipment.json uses for the same object, present
//              only where it differs. Table 63's wording is authoritative and
//              is never renamed to match the equipment file.
const LIGHT_SOURCES = [
  // burnNote: THE BOOK DISAGREES WITH ITSELF and the printed Table 63 value is
  // kept regardless. Ch.6's prose says the beacon "operates like the bullseye
  // lantern" and burns a flask every two hours; a flask is a pint, and the
  // bullseye is 2 hrs./pint here, so the prose is internally consistent and the
  // table's 30 is almost certainly a typo. It is NOT corrected: this block is a
  // verbatim transcription, and a number quietly changed here would make every
  // other number in it untrustworthy. Reported, never folded in -- the same
  // rule as the racial Surprise Bonus.
  { name: 'Beacon lantern',   radius: 240, burn: '30 hrs./pint',        beamWidth: 90, equipment: 'Lantern, Beacon',
    burnNote: 'PHB Ch.6 prose gives 2 hrs. per flask and calls it a larger bullseye lantern (2 hrs./pint). The book disagrees with itself \u2014 ask your DM.' },
  { name: 'Bonfire',          radius:  50, burn: '\u00BD hr./armload' },
  { name: 'Bullseye lantern', radius:  60, burn: '2 hrs./pint',         beamWidth: 20, equipment: 'Lantern, Bullseye' },
  { name: 'Campfire',         radius:  35, burn: '1 hr./armload' },
  { name: 'Candle',           radius:   5, burn: '10 min./inch' },
  { name: 'Continual light',  radius:  60, burn: 'Indefinite',          magical: true },
  { name: 'Hooded lantern',   radius:  30, burn: '2 hrs./pint',                        equipment: 'Lantern, Hooded' },
  { name: 'Light spell',      radius:  20, burn: 'Variable',            magical: true },
  { name: 'Torch',            radius:  15, burn: '30 min.' },
  { name: 'Weapon',           radius:   5, burn: 'As desired',          optional: true }
];

// Matches on either the Table 63 name or the equipment file's name for the same
// object. Returns null for anything the chapter does not list -- which is the
// CORRECT answer for Lamp, Common and Tinder Box, not a failure to be papered
// over. If a caller wants to show numbers for those, the numbers have to come
// from a source first.
function lightSourceByName(name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return null;
  return LIGHT_SOURCES.find(s =>
    s.name.toLowerCase() === n ||
    (s.equipment && s.equipment.toLowerCase() === n)
  ) || null;
}

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
  // PHB Table 4: "Max. # of Spells/Level" reads All from INT 19 up -- there is
  // no numeric ceiling. The 22/25/28/31/34/37/40 that used to sit here were
  // fabricated. Consumers must handle the string, not assume a number.
  19: [8, 95, "All", "Illusion/Phantasm (≤1st level)", 9],
  20: [9, 96, "All", "Illusion/Phantasm (≤2nd level)", 9],
  21: [10, 97, "All", "Illusion/Phantasm (≤3rd level)", 9],
  22: [11, 98, "All", "Illusion/Phantasm (≤4th level)", 9],
  23: [12, 99, "All", "Illusion/Phantasm (≤5th level)", 9],
  24: [15, 100, "All", "Illusion/Phantasm (≤6th level)", 9],
  25: [20, 100, "All", "Illusion/Phantasm (≤7th level)", 9]
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
  // PHB Table 14 heads its first column "Paladin/Fighter" -- paladins share the
  // fighter progression. The 2250/4500/9000 column is the RANGER's.
  paladin: [
    0, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
    750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000
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
    200000, 300000, 750000, 1500000, 3000000, 3500000, 3000000, 3000000, 3000000, 3000000
  ],
  mage: [
    0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
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

// === Prime Requisites (PHB Chapter 3) ===
// Photo-verified class by class against the Chapter 3 entries.
//
// Ability Requirements and Prime Requisites are DIFFERENT LISTS and the book
// keeps them apart deliberately: a paladin needs Con 9 and Wis 13, neither a
// prime requisite; a ranger needs Con 14 and it is not one either; and the
// illusionist's Dex 16 is a requirement despite matching the bonus threshold
// exactly. NEVER rebuild this from a class's requirement block.
const PRIME_REQUISITES = {
  fighter: ["str"],
  paladin: ["str", "cha"],
  ranger:  ["str", "dex", "wis"],
  mage:    ["int"],
  cleric:  ["wis"],
  druid:   ["wis", "cha"],
  thief:   ["dex"],
  bard:    ["dex", "cha"]
};

// Aliases, not copies -- same reason MULTICLASS_COMBOS.halfelf is an alias.
PRIME_REQUISITES.warrior     = PRIME_REQUISITES.fighter;
PRIME_REQUISITES.barbarian   = PRIME_REQUISITES.fighter;
PRIME_REQUISITES.wizard      = PRIME_REQUISITES.mage;
PRIME_REQUISITES.specialist  = PRIME_REQUISITES.mage;
PRIME_REQUISITES.priest      = PRIME_REQUISITES.cleric;
PRIME_REQUISITES.rogue       = PRIME_REQUISITES.thief;
PRIME_REQUISITES.hb_dpaladin = PRIME_REQUISITES.paladin;
PRIME_REQUISITES.demipaladin = PRIME_REQUISITES.paladin;

// Resolve ONE class name to its prime requisites. Composite strings such as
// "Fighter 5 / Mage 3" are NOT handled here -- the substring pass would match
// "fighter" and silently drop the mage half. Step 2's character-level resolver
// splits composites before calling this.
//
// Returns [] for anything unrecognised. Callers must treat empty as UNKNOWN,
// never as "no requirements": an empty array passed to .every() passes
// vacuously, which is exactly how the dual-class gate came to accept a
// necromancer with Intelligence 3.
function getClassPrimeRequisites(className) {
  const c = (className || "").trim().toLowerCase();
  if (!c) return [];
  if (PRIME_REQUISITES[c]) return PRIME_REQUISITES[c].slice();

  // Every specialist wizard takes the mage's Intelligence. Table 22's
  // "Minimum Ability" column is ability requirements, not prime requisites.
  if (typeof SPECIALIST_WIZARDS !== "undefined" &&
      Object.keys(SPECIALIST_WIZARDS).some(k => c.includes(k))) {
    return PRIME_REQUISITES.mage.slice();
  }

  for (const key in PRIME_REQUISITES) {
    if (c.includes(key)) return PRIME_REQUISITES[key].slice();
  }
  return [];
}

// === Racial Abilities (AD&D 2E) ===
// Common racial traits that can be auto-populated
const RACIAL_ABILITIES = {
  human: [
    { name: "Unlimited Advancement", notes: "May be of any character class -- warrior, wizard, priest or rogue -- and rise to any level in it. Humans have no other special racial ability, and are the only race that may dual-class" }
  ],
  elf: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Resistance to Sleep/Charm", notes: "90% resistance to sleep and all charm-related spells. This is in addition to any normal saving throw allowed" },
    // PHB Ch.2 gives THREE distinct chances, not one. A secret door is
    // "constructed so as to be hard to notice"; a concealed door is "hidden
    // from sight by screens, curtains, or the like". The passive chance
    // applies to CONCEALED doors only.
    { name: "Notice Concealed Doors", notes: "Merely passing within 10 feet of a concealed door: 1 in 6 (roll a 1 on 1d6), no searching required" },
    { name: "Search for Doors", notes: "When actively searching: 1 in 3 (roll 1-2 on 1d6) to find a secret door, 1 in 2 (roll 1-3 on 1d6) to discover a concealed portal" },
    { name: "Surprise Bonus", notes: "Opponents take -4 on their surprise rolls, reduced to -2 if you must open a door or screen to attack. Requires that you are not in metal armor AND are either alone, with a party of only elves and halflings likewise out of metal armor, or 90 feet or more away from your party" },
    { name: "Bow/Sword Bonus", notes: "+1 to hit with any bow other than a crossbow, and with short and long swords" }
  ],
  "half-elf": [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Resistance to Sleep/Charm", notes: "30% resistance to sleep and all charm-related spells. This is in addition to any normal saving throw allowed" },
    // Identical to the elf's, per PHB Ch.2: "Secret or concealed doors are
    // difficult to hide from half-elves, just as they are from elves."
    { name: "Notice Concealed Doors", notes: "Merely passing within 10 feet of a concealed door: 1 in 6 (roll a 1 on 1d6), no searching required" },
    { name: "Search for Doors", notes: "When actively searching: 1 in 3 (roll 1-2 on 1d6) to find a secret door, 1 in 2 (roll 1-3 on 1d6) to locate a concealed door" }
  ],
  dwarf: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Constitution Save Bonuses", notes: "+1 per 3 1/2 points of Constitution against wands, staves, rods and spells, and the same bonus against poison (PHB Table 9). Already applied to your saving throws" },
    // Four separate abilities with four DIFFERENT chances -- previously merged
    // into a single "1-in-3", which was wrong for three of them.
    { name: "Detect Stonework", notes: "Within 10 feet, and only when deliberately trying: grade or slope in passage 1-5 on 1d6; new tunnel or passage construction 1-5 on 1d6; sliding or shifting walls or rooms 1-4 on 1d6; stonework traps, pits and deadfalls 1-3 on 1d6" },
    { name: "Determine Depth", notes: "Approximate depth below the surface, 1-3 on 1d6. May be attempted at any time, not only within 10 feet" },
    { name: "Attack Bonus vs. Orcs/Goblins", notes: "+1 to hit orcs, half-orcs, goblins, hobgoblins" },
    { name: "AC Bonus vs. Giants", notes: "Giants, ogres, trolls, ogre magi and titans get -4 to hit you. An attack penalty on them, not a bonus to your AC -- it does not apply against anything else" },
    { name: "Nonmagical Nature", notes: "Dwarves never use magical (wizard) spells. Priest spells are allowed" },
    { name: "Magic Item Malfunction", notes: "20% chance of malfunction each time you use a magical item not suited to your class -- rods, staves, wands, rings, amulets, potions, horns, jewels and the like. Weapons, shields, armor, gauntlets and girdles are exempt, as are priest items used by a dwarven cleric. A device that operates CONTINUALLY is checked only the first time it is used in an encounter; pass, and it works until it is turned off -- a robe of blending is checked when donned and not again until it is removed and put back on. Affects only that use; a cursed item that malfunctions reveals itself" }
  ],
  halfling: [
    // NOT automatic. PHB Ch.2: 15% chance of normal infravision (pure Stout),
    // and failing that a 25% chance of limited infravision to 30 feet.
    { name: "Infravision (chance-based)", notes: "15% chance of normal infravision to 60 ft (pure Stout lineage). Failing that, a 25% chance of limited infravision to 30 ft (mixed Stout/Tallfellow or Stout/Hairfeet). Otherwise none" },
    { name: "Constitution Save Bonuses", notes: "+1 per 3 1/2 points of Constitution against wands, staves, rods and spells, and the same bonus against poison (PHB Table 9). Already applied to your saving throws" },
    { name: "Sling/Thrown Bonus", notes: "+1 to hit with slings and thrown weapons" },
    { name: "Surprise Bonus", notes: "Opponents take -4 on their surprise rolls, reduced to -2 if you must open a door or screen to attack. Requires that you are not in metal armor AND are either alone, with a party of only halflings and elves likewise out of metal armor, or 90 feet or more away from your party" },
    { name: "Stoutish Senses", notes: "Only for pure or partially Stout halflings, and only while concentrating to the exclusion of all else: note an up or down grade 75% of the time (roll 1-3 on 1d4); determine direction half the time (roll 1-3 on 1d6)" }
    // REMOVED: "AC Bonus vs. Large" -- PHB Ch.2 grants that -4 to dwarves and
    // gnomes only, never halflings. Also removed "Hide in Shadows", which is
    // not a halfling ability anywhere in the chapter.
  ],
  gnome: [
    { name: "Infravision", notes: "60 ft range" },
    { name: "Constitution Save Bonuses", notes: "+1 per 3 1/2 points of Constitution against wands, staves, rods and spells (PHB Table 9). Unlike dwarves and halflings, gnomes receive NO poison bonus. Already applied to your saving throws" },
    // Note the d10 on unsafe walls -- the gnome list is not the dwarf's.
    { name: "Detect Stonework", notes: "Within 10 feet, after stopping and concentrating for one round: grade or slope in passage 1-5 on 1d6; unsafe walls, ceiling and floors 1-7 on 1d10" },
    { name: "Determine Depth/Direction", notes: "Approximate depth underground 1-4 on 1d6; approximate direction underground 1-3 on 1d6. These two may be attempted at any time" },
    { name: "Attack Bonus vs. Kobolds/Goblins", notes: "+1 to hit kobolds and goblins" },
    { name: "AC Bonus vs. Giants", notes: "Gnolls, bugbears, ogres, trolls, ogre magi, giants and titans get -4 to hit you. An attack penalty on them, not a bonus to your AC -- it does not apply against anything else" },
    { name: "Magic Item Failure", notes: "20% chance of failure each time you attempt to use a magical item, and for a CONTINUOUS-USE device each time it is activated -- NOT once per encounter, which is the dwarf's rule and not the gnome's. Weapons, armor, shields, illusionist items, and (for gnome thieves) items that duplicate thieving abilities are exempt. A device that fails reveals a cursed item" }
    // REMOVED: "Illusion Resistance +1 vs. illusions" -- not a 2e PHB gnome
    // ability; it appears nowhere in Chapter 2.
  ]
};

// Alias, not a copy -- see the note on RACIAL_COMBAT_BONUSES.
RACIAL_ABILITIES.halfelf = RACIAL_ABILITIES["half-elf"];

// === RACIAL CHECKS (PHB Ch.2) ===
// Every racial ability that is ROLLED. Five races, four die sizes.
//
// THIS DATA USED TO LIVE IN HTML ATTRIBUTES -- six hardcoded cards in
// sheet_template.js carrying data-success="5", with a roller hardwired to
// Math.random() * 6. That is why one of the six went unnoticed for so long
// despite being a GNOME ability: anyone auditing racial rules reads
// RACIAL_ABILITIES, where the dwarf correctly has five. Game data lives here.
//
//   die        4, 6, 10 or 100. The old roller could only do 6, which is why
//              the gnome's 1d10 and the halfling's 1d4 could not be expressed.
//   threshold  Roll THIS OR LOWER to trigger the named outcome.
//   inverted   true = hitting the threshold is BAD (magic item malfunction).
//              Flips the wording only; the arithmetic is unchanged.
//   anyTime    true = exempt from the race's proximity/concentration condition.
const RACIAL_CHECKS = {
  dwarf: {
    label: 'Dwarven Abilities',
    condition: 'Within 10 feet, and only when deliberately trying \u2014 "the information does not simply spring to mind unbidden."',
    checks: [
      { name: 'Grade or slope in passage',          die: 6,   threshold: 5 },
      { name: 'New tunnel or passage construction', die: 6,   threshold: 5 },
      { name: 'Sliding or shifting walls or rooms', die: 6,   threshold: 4 },
      { name: 'Stonework traps, pits and deadfalls', die: 6,  threshold: 3 },
      { name: 'Approximate depth underground',      die: 6,   threshold: 3, anyTime: true },
      // NO direction check. That is the gnome's, and it was on this panel by
      // mistake until the Ch.13 session. Do not add it back.
      { name: 'Magic item malfunction',             die: 100, threshold: 20, inverted: true,
        note: 'Items not suited to your class. A CONTINUALLY operating item is checked only the first time it is used in an encounter.' }
    ]
  },
  gnome: {
    label: 'Gnomish Abilities',
    condition: 'Within 10 feet, after stopping and concentrating for one round.',
    checks: [
      { name: 'Grade or slope in passage',           die: 6,   threshold: 5 },
      // 1d10, not 1d6. The gnome list is not the dwarf's.
      { name: 'Unsafe walls, ceiling and floors',    die: 10,  threshold: 7 },
      { name: 'Approximate depth underground',       die: 6,   threshold: 4, anyTime: true },
      { name: 'Approximate direction underground',   die: 6,   threshold: 3, anyTime: true },
      { name: 'Magic item failure',                  die: 100, threshold: 20, inverted: true,
        note: 'Weapons, armor, shields, illusionist items and thief-duplicating items are exempt. A CONTINUOUS-USE device is checked each time it is activated -- not once per encounter, which is the dwarf\u2019s rule.' }
    ]
  },
  halfling: {
    label: 'Halfling Abilities',
    condition: 'Only while concentrating to the exclusion of all else, and ONLY for a pure or partially Stout halfling. The sheet does not record lineage \u2014 settle it with your DM.',
    checks: [
      { name: 'Note an up or down grade', die: 4, threshold: 3, note: '75% of the time.' },
      { name: 'Determine direction',      die: 6, threshold: 3, note: 'Half the time.' }
    ]
  },
  elf: {
    label: 'Elven Abilities',
    condition: 'A SECRET door is built to be hard to notice; a CONCEALED door is hidden behind a screen, a curtain or the like.',
    checks: [
      { name: 'Notice a concealed door in passing', die: 6,   threshold: 1, anyTime: true,
        note: 'Merely passing within 10 feet. No searching required.' },
      { name: 'Search: find a secret door',         die: 6,   threshold: 2, note: 'Actively searching.' },
      { name: 'Search: find a concealed door',      die: 6,   threshold: 3, note: 'Actively searching.' },
      { name: 'Resist sleep or charm',              die: 100, threshold: 90,
        note: '90% resistance, IN ADDITION to any normal saving throw allowed.' }
    ]
  },
  'half-elf': {
    label: 'Half-Elven Abilities',
    condition: 'Secret and concealed doors are as hard to hide from a half-elf as from an elf.',
    checks: [
      { name: 'Notice a concealed door in passing', die: 6,   threshold: 1, anyTime: true,
        note: 'Merely passing within 10 feet. No searching required.' },
      { name: 'Search: find a secret door',         die: 6,   threshold: 2, note: 'Actively searching.' },
      { name: 'Search: find a concealed door',      die: 6,   threshold: 3, note: 'Actively searching.' },
      { name: 'Resist sleep or charm',              die: 100, threshold: 30,
        note: '30% resistance, IN ADDITION to any normal saving throw allowed.' }
    ]
  }
};
RACIAL_CHECKS.halfelf = RACIAL_CHECKS['half-elf'];

// Humans have no entry and never will -- their only racial ability is unlimited
// advancement, which is not a roll.
function racialChecksFor(race) {
  const r = (race || '').toLowerCase();
  if (!r) return null;
  // Duergar were matched explicitly by the old dwarven gate. Preserved HERE
  // rather than added to getRaceKey, which drives Table 7 validation and class
  // legality and must not silently start judging a race it was never given.
  if (r.indexOf('duergar') !== -1) return RACIAL_CHECKS.dwarf;
  const key = (typeof getRaceKey === 'function') ? getRaceKey(race) : null;
  return (key && RACIAL_CHECKS[key]) || null;
}

// === Class Abilities by Level (AD&D 2E) ===
// Format: { level: [{ name, notes }] }
const CLASS_ABILITIES = {
  fighter: {
    1: [{ name: "Weapon Specialization", notes: "May specialize in weapons (if using optional rule)" }],
    9: [{ name: "Followers", notes: "Attracts 10-100 followers and may build a stronghold; they arrive once and are never replaced" }]
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
      { name: "Followers", notes: "Attracts followers and may build stronghold; they arrive once and are never replaced" }
    ]
  },
  ranger: {
    1: [
      { name: "Species Enemy", notes: "Choose one creature type, +4 to hit against them" },
      { name: "Tracking", notes: "Track creatures in wilderness" },
      { name: "Two-Weapon Fighting", notes: "Fight with weapon in each hand with reduced penalties" }
    ],
    8: [{ name: "Cast Priest Spells", notes: "Can cast druid/ranger spells" }],
    10: [{ name: "Followers", notes: "Attracts 2d6 followers; they arrive once and are never replaced" }]
  },
  cleric: {
    1: [
      { name: "Turn Undead", notes: "Can turn or destroy undead creatures" },
      { name: "Spell Casting", notes: "Can cast priest spells" }
    ],
    8: [{ name: "Followers", notes: "Attracts followers and may build stronghold; they arrive once and are never replaced" }]
  },
  druid: {
    1: [
      { name: "Druidic Language", notes: "Secret language of all druids" },
      { name: "Spell Casting", notes: "Can cast druid spells" }
    ],
    3: [{ name: "Identify Plants/Animals", notes: "Automatically identify plants, animals, pure water" }],
    7: [{ name: "Immunity", notes: "Immune to charm spells cast by woodland creatures" }],
    12: [{ name: "Challenge", notes: "Must challenge and defeat higher-level druids to advance" }],
    // Hierophant powers (PHB Ch.3). Level-keyed, so they apply to any druid who
    // reaches these levels -- but only a hierophant (a former Grand Druid who
    // stepped down) can advance past 16th, so 17th+ are hierophant-only in
    // practice. Beyond 15th a druid gains no new spells, acquiring these spell-
    // like powers instead.
    16: [
      { name: "Extra Longevity", notes: "Lifespan extends by 10 years per experience level" },
      { name: "Poison Immunity", notes: "Immune to all natural (ingested or insinuated) animal and vegetable poisons, including monster poisons; not mineral poisons or poison gas" },
      { name: "Vigorous Health", notes: "No longer subject to the ability score adjustments for aging" },
      { name: "Alter Appearance", notes: "Alter own appearance at will (1 round); height/weight +/-50%, apparent age childhood to extreme old age, any human or humanoid features. Not magical -- undetectable short of true seeing" }
    ],
    17: [
      { name: "Hibernation", notes: "Can biologically hibernate; body slows to appear dead, aging ceases. Wakes at a preordained time or on a significant environmental change" },
      { name: "Elemental Plane of Earth", notes: "Can enter, survive on, move about, and return from the Elemental Plane of Earth at will (transference takes 1 round)" }
    ],
    18: [{ name: "Elemental Plane of Fire", notes: "Can enter and survive in the Elemental Plane of Fire" }],
    19: [{ name: "Elemental Plane of Water", notes: "Can enter and survive in the Elemental Plane of Water" }],
    20: [{ name: "Elemental Plane of Air", notes: "Can enter and survive in the Elemental Plane of Air" }]
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

// === Armor adjustments to thief skills (PHB Table 29) ===
// Format: [Pick Pockets, Open Locks, Find/Remove Traps, Move Silently,
//          Hide in Shadows, Detect Noise, Climb Walls, Read Languages]
// Table 29 has only THREE columns. Plain leather armor is not one of them --
// it is the baseline the Table 26 base scores already assume, hence all zeros.
// "No Armor" also covers bracers of defense or a cloak worn without large or
// heavy protective clothing (PHB Ch.3, Thief).
const THIEF_ARMOR_ADJUSTMENTS = {
  none:    [  5,   0,   0,  10,   5,   0,  10, 0],
  leather: [  0,   0,   0,   0,   0,   0,   0, 0],
  elven:   [-20,  -5,  -5, -10, -10,  -5, -20, 0],
  padded:  [-30, -10, -10, -20, -20, -10, -30, 0]
};

// Table 29 footnote: "Bards (only) in non-elven chain mail suffer an additional
// -5% penalty." The asterisk sits on the ELVEN CHAIN column header, so ordinary
// chain mail is read as that column plus a further -5%. The extra penalty is
// applied only to skills the column already adjusts -- Read Languages is "--"
// in every column, so armor never touches it.
THIEF_ARMOR_ADJUSTMENTS.chain =
  THIEF_ARMOR_ADJUSTMENTS.elven.map(v => (v === 0 ? 0 : v - 5));

// === PHBR2 Table 38: Effects of Armor on Thief Skills (p.115) ===
// Same eight-skill order as THIEF_ARMOR_ADJUSTMENTS above.
//
// Table 38 EXTENDS Table 29 rather than replacing it: its first three columns
// are identical to the PHB's, value for value. What it adds is the six armour
// types the PHB leaves out. Read from two independent printings -- in place at
// p.115 and reprinted in Selected Tables at p.128 -- which agree throughout.
//
// THE NON-MONOTONIC ENTRIES ARE REAL, NOT TRANSCRIPTION SLIPS. Hide is worse
// than ring/chain at Pick Pockets (-60 vs -40), Open Locks and Find/Remove
// Traps (-50 vs -15); brigandine is worse than scale at Find/Remove Traps
// (-25 vs -20). Both printings agree. DO NOT "correct" them.
//
// 'leather' is not a Table 38 column. Table 37's General Notes make it the
// standard that adjusts nothing, exactly as Table 29 does.
const THIEF_ARMOR_ADJUSTMENTS_PHBR2 = {
  none:              [  5,   0,   0,  10,   5,   0,  10, 0],
  leather:           [  0,   0,   0,   0,   0,   0,   0, 0],
  elven:             [-20,  -5,  -5, -10, -10,  -5, -20, 0],
  studded_padded:    [-30, -10, -10, -20, -20, -10, -30, 0],
  hide:              [-60, -50, -50, -30, -20, -10, -60, 0],
  ring_chain:        [-40, -15, -15, -40, -30, -20, -40, 0],
  brigandine_splint: [-40, -15, -25, -40, -30, -25, -50, 0],
  scale_banded:      [-50, -20, -20, -60, -50, -30, -90, 0],
  plate_mail:        [-75, -40, -40, -80, -75, -50, -95, 0],
  plate_armor:       [-95, -80, -80, -95, -95, -70, -95, 0],
  // TABLE 28 (p.93), silenced elfin chain. THE DASHES IN THAT TABLE ARE ZEROES,
  // not omissions, and reading them so is what makes the prose beneath it true:
  // against the `elven` row above this is 10 BETTER at Move Silently and 5
  // BETTER at Detect Noise, paid for by 5 WORSE at Pick Pockets and Climb Walls.
  // The book's "bonuses ... above those which apply for normal elfin chain" are
  // therefore RELATIVE -- the table prints no positive number anywhere.
  silenced_elven:    [-25,  -5,  -5,   0, -10,   0, -25, 0]
};

// ARMOR_TYPES key -> Table 38 column. Footnote 2 files bronze plate under plate
// mail; footnote 3 puts field and full plate together as "plate armor".
// Bracers and cloaks need no entry: they are not body armour, so
// getThiefArmorCategory never resolves to them, and footnote 1 places a
// character wearing only those in the No Armor column -- where he already lands.
const PHBR2_THIEF_COLUMN = {
  none:        'none',              leather:      'leather',
  studded:     'studded_padded',    padded:       'studded_padded',
  hide:        'hide',              elven_chain:  'elven',
  silenced_elven: 'silenced_elven',
  ring:        'ring_chain',        chain:        'ring_chain',
  brigandine:  'brigandine_splint', splint:       'brigandine_splint',
  scale:       'scale_banded',      banded:       'scale_banded',
  plate:       'plate_mail',        bronze_plate: 'plate_mail',
  field_plate: 'plate_armor',       full_plate:   'plate_armor'
};

// PHBR2's floor, not the PHB's: "a character can always have a 1% chance of
// success, even when trying to pick pockets in full plate armor." Applies only
// when the band is active; under Table 29 the app clamps at 0.
const THIEF_SKILL_MIN_PHBR2 = 1;

// === PHBR2 Chapter 5: equipment effects on thief skills (pp.90-102) ===
// Read from 300dpi page images, August 2026.
//
// Skill keys are the SAME EIGHT getKitSkillMods uses, deliberately -- a second
// vocabulary for one set of skills is how the two drift apart. A missing key is
// zero.
//
// THESE ARE SITUATIONAL, which is why they get a panel and not a term in
// skillVal(). Armor and kit adjustments are true of a character all the time;
// a clawed glove is worth +10, +5 or nothing depending on what he is climbing,
// and a woodland suit is worth nothing indoors. The panel reads the sheet and
// never writes to it.
//
// `surfaceMods` is a CLIMB WALLS figure keyed by surface, per pp.95-96. `mods`
// is everything unconditional once the item is in use.
//
// NOT ENFORCED, and deliberately: p.90's +20 ceiling on stacked nonmagical
// bonuses, and its advice that similar-function items should not stack, are
// addressed to the DM in a section that opens by calling the item modifiers
// "suggestions only". Each item carries the full percentage the book prints for
// it. This is why the grappling iron reads +40 next to a +20 cap -- see
// gsheets_phbr_notes.md, PHBR2, contradiction twelve. Chris's ruling, Aug 2026.
const PHBR2_EQUIPMENT_SKILL_MODS = [
  { item: 'Arm Sling', page: 'p.91', when: 'Worn',
    mods: { pickPockets: -5 },
    note: 'Halves the chance of being discovered, but a natural 00 on d100 always means discovery.' },
  { item: 'Footpad\u2019s Boots', page: 'p.93', when: 'Worn',
    mods: { moveSilently: 5, climbWalls: -5 } },
  { item: 'Hollow Boots', page: 'p.100', when: 'Worn',
    mods: { moveSilently: -5 } },
  { item: 'Darksuit', page: 'p.94', when: 'Shadow, or dusk or early dawn light',
    mods: { hideInShadows: 5 } },
  { item: 'Charcoal', page: 'p.94', when: 'Face, neck and backs of hands blacked, in dim light',
    mods: { hideInShadows: 2 } },
  { item: 'Woodland Suit', page: 'p.94', when: 'Outdoors \u2014 woodland, field or garden',
    mods: { hideInShadows: 5 } },
  { item: 'Plant Dye', page: 'p.94', when: 'Face and hands dyed, outdoors',
    mods: { hideInShadows: 2 } },
  { item: 'Weaponblack', page: 'p.94', when: 'Weapon coated',
    mods: { hideInShadows: 5 },
    note: 'The book calls its OTHER rule superior: instead of this bonus, the thief needs no second hide roll when drawing a weapon, and takes no penalty for hiding with one already drawn.' },
  { item: 'Listening Cone', page: 'p.94', when: 'Held against the surface',
    mods: { detectNoise: 5 } },
  { item: 'Magnifying Glass', page: 'p.92', when: 'Some of the lock mechanism visible',
    mods: { openLocks: 5 } },
  { item: 'Oil and Funnel', page: 'pp.92-93', when: 'Lock oiled \u2014 silent picking check only',
    mods: { moveSilently: 10 },
    note: 'Also negates, in whole or in part, any penalty the DM applies for a rusted or dirty lock. Takes 1 round to apply and 1d6+4 rounds to work.' },
  { item: 'Clawed Gloves', page: 'pp.95-96', when: 'Climbing',
    surfaceMods: { verySmooth: 0, smoothCracked: 5, other: 10 },
    mods: { moveSilently: -5 },
    note: 'Sharkskin-coated gloves are treated as clawed gloves in all respects (p.98). The move silently penalty applies only while climbing.' },
  { item: 'Clawed Overshoes', page: 'pp.95-96', when: 'Climbing',
    surfaceMods: { verySmooth: 0, smoothCracked: 5, other: 10 },
    mods: { moveSilently: -10 } },
  { item: 'Climbing Dagger', page: 'p.95', when: 'Climbing \u2014 at the DM\u2019s option',
    mods: { climbWalls: 10 } },
  { item: 'Grappling Iron and Rope', page: 'p.95', when: 'Climbing the wall by the rope',
    mods: { climbWalls: 40 } }
];

// Surface labels for the panel's selector, in the order pp.95-96 present them.
// EVERY LABEL IS A NOUN PHRASE ending in "surface", because the panel drops them
// mid-sentence -- "No climbing bonus on a very smooth surface". An adjective
// alone reads as a fragment there, and a label that only works in a dropdown is
// a label that breaks the first time anything else uses it.
const PHBR2_CLIMB_SURFACES = [
  { key: 'other',         label: 'Rough or normal surface' },
  { key: 'smoothCracked', label: 'Smooth or cracked surface' },
  { key: 'verySmooth',    label: 'Very smooth surface' }
];

// === PHBR2 Chapter 7 reference (pp.111-114) ===
// Content only -- nothing here is rolled, computed or enforced. Read from
// 300dpi page images, August 2026.
// NOT INCLUDED YET: "Animal Assistants" (p.112, dogs/ferrets/monkeys), which the
// survey missed and the band text does not mention.
const PHBR2_ADVANCED_RULES = [
  { title: 'Mugging \u2014 the thief\u2019s KO', page: 'p.114', lines: [
    'Strike from behind with a BLUNT instrument.',
    'The target must already be eligible for a backstab (PHB p.40), and no more than twice the thief\u2019s height.',
    'The thief gains his +4 backstab bonus; the victim loses shield and Dexterity bonuses.',
    'Where helmets are detailed, the victim is AC 10 unless the head is protected.',
    'On a hit the victim saves versus petrification or falls unconscious for 2d8 rounds.',
    'Modify that save by the difference in level or Hit Dice between mugger and victim.'
  ]},
  { title: 'Lock and trap difficulty', page: 'p.111', lines: [
    '+15%  Typical latch \u2014 small house, inn guest room, storage closet.',
    '0  Merchant\u2019s house, weapons locker, wine cellar of a large inn.',
    '\u221215%  Cell or keep door, dungeon security checkpoint, gem cutter\u2019s or moneychanger\u2019s shop.',
    '\u221230%  Major vault, or the most intricately designed cell doors.',
    'The same principle applies to traps; the DM sets the figure.'
  ]},
  { title: 'Superior locks', page: 'p.111', lines: [
    'A locksmith makes a proficiency check per lock; 1 or less means superior craftsmanship.',
    'Subtract 1 from the roll for every locksmith slot BEYOND THE FIRST \u2014 three slots means superior on 1, 2 or 3.',
    'The lock\u2019s modifier is 1d10%. Re-roll anything lower than that smith\u2019s previous best.',
    'Once he is making 10% locks he rolls 2d10; at 20% he rolls 3d10 until he gets 20 or more, but is no longer guaranteed to beat his own record.'
  ]},
  { title: 'Silent lockpicking and trap removal', page: 'p.112', lines: [
    '\u221210% to the ability rating, but the work is silent on any roll except 01\u201310%.',
    'On 01\u201310% the lock or trap makes a sharp click or snap, audible to anyone within earshot.',
    'A thief who FAILS a silent attempt cannot then try the same lock normally.'
  ]},
  { title: 'Producing an antidote', page: 'p.113', lines: [
    'Herbalism proficiency. With materials already to hand, 1d6+4 minutes.',
    'Gathering them first takes at least half an hour, and is usually impossible in a dungeon.',
    'If the total time exceeds the poison\u2019s onset, the effort is wasted whatever the roll.',
    'Then a proficiency check, at \u221210 if the poison was never identified.',
    'Applied before onset, an antidote either negates the poison entirely (where a successful save would have) or reduces its effect to saving-throw level.',
    'Identifying a poison is an ASSASSIN KIT ability (pp.27\u201328), not a Chapter 7 rule.'
  ]}
];

// PHB Ch.3, Thief: "no skill can be raised above 95 percent, including all
// adjustments for Dexterity, race, and armor."
const THIEF_SKILL_MAX = 95;

// Resolve equipped armor to a Table 29 column.
// Returns { key, name, illegal } -- illegal flags armor the class may not wear
// (thieves are limited to leather, studded, padded or elven chain; bards to
// chain mail). Illegal armor falls back to the worst column and is reported,
// never blocked.
// Infer an ARMOR_TYPES key from a free-text armor name. Used ONLY as a
// migration fallback for records saved before the type dropdown existed --
// once armorTypeKey is set, the stored value always wins. Order matters:
// longer, more specific names are tested first so "elven chain mail" cannot be
// eaten by "chain" and "studded leather" cannot be eaten by "leather".
const ARMOR_NAME_INFERENCE = [
  // BEFORE 'elven chain', and both spellings: PHBR2 writes "elfin" throughout
  // while this file writes "elven", and a record named "Silenced Elven Chain"
  // must not be eaten by the plain entry below and lose its Table 28 column.
  ['silenced elfin', 'silenced_elven'],
  ['silenced elven', 'silenced_elven'],
  ['elven chain',    'elven_chain'],
  ['studded',        'studded'],
  ['bronze plate',   'bronze_plate'],
  ['field plate',    'field_plate'],
  ['full plate',     'full_plate'],
  ['plate mail',     'plate'],
  ['banded',         'banded'],
  ['splint',         'splint'],
  ['brigandine',     'brigandine'],
  ['scale',          'scale'],
  ['ring mail',      'ring'],
  ['chain',          'chain'],
  ['hide',           'hide'],
  ['padded',         'padded'],
  ['leather',        'leather']
];
function inferArmorTypeKey(name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return '';
  if (n === 'none') return 'none';
  const hit = ARMOR_NAME_INFERENCE.find(pair => n.includes(pair[0]));
  return hit ? hit[1] : '';
}

// Resolve the equipped body armor to a Table 29 column.
// THE ANCHOR RULE: read the stored armorTypeKey. The name is only consulted
// when that is blank, i.e. for records predating the dropdown -- which is why
// a homebrew "Shadowsilk Wrap" now works as long as its Type is set.
// Returns { key, typeKey, name, illegal }.
function getThiefArmorCategory(root) {
  const items = Array.from(root.querySelectorAll('.armor-list .item'));
  let worn = '', typeKey = '', hqRace = '';
 // MOST RESTRICTIVE PIECE WORN, not the heaviest. Chris's ruling, and the right
  // axis: Table 29 columns are ordered by PENALTY, and weight does not determine
  // the column. Padded armour is the lightest body armour in the game at 10 lb
  // and sits in the WORST column at -30% Pick Pockets, while leather at 15 lb
  // takes no penalty at all -- so "heaviest" would have picked leather over
  // padded and produced a BETTER result for the MORE restrictive armour.
  //
  // OUR INFERENCE, NOT THE BOOK'S. PHBR1 never says how piecemeal armour meets
  // Table 29. Recorded as ours so nobody later mistakes it for RAW.
  //
  // Unrelated and already handled elsewhere: PHB Ch.3's rule that a MULTI-CLASS
  // thief removes gauntlets to open locks and helmet to detect noise. That reads
  // the Gauntlets and Helmet slots, which are not piecemeal locations, so the two
  // systems do not collide.
    // 'chain' MUST appear here. It is the bard column (elven -5%, derived near the
  // top of this file). Omitting it made RANK.indexOf('chain') return -1, which
  // never beats the initial bestRank of -1 -- so a chain mail piece was silently
  // skipped. A character whose ONLY body armour was chain mail fell through with
  // typeKey blank and was reported as "No armor", collecting the No-Armor
  // BONUSES instead of a penalty.
  // Position is fixed by the numbers, not by preference: chain is -25% Pick
  // Pockets, between elven's -20% and padded's -30%.
  const RANK = ['none', 'leather', 'elven', 'chain', 'padded'];   // best to worst
  let bestRank = -1;
  items.forEach(item => {
    const cb = item.querySelector('.equipped');
    if (!cb || !cb.checked) return;
    // .armor-slot is the wear location; fall back to .armor-type for records
    // rendered by the pre-rewrite card, where that class held the slot.
    const slotEl = item.querySelector('.armor-slot') || item.querySelector('.armor-type');
    const slot = (slotEl || {}).value || 'Armor';

    // A PIECEMEAL PIECE COUNTS. Previously anything but "Armor" was skipped, so
    // a character in splint plates read as UNARMOURED and took no penalty at
    // all. Shields, helmets and the rest are still skipped: they are not body
    // armour and Table 29 does not describe them.
    const isPiece = (typeof PIECEMEAL_SLOTS !== 'undefined') &&
                    PIECEMEAL_SLOTS.some(s => s.label === slot);
    if (slot !== 'Armor' && !isPiece) return;

    const name = ((item.querySelector('.title') || {}).value || '').trim();
    const stored = item.querySelector('.armor-slot')
      ? ((item.querySelector('.armor-type') || {}).value || '')
      : '';
    if (!name && !stored) return;

    const thisKey = stored || inferArmorTypeKey(name);
    const thisHq  = (item.querySelector('.armor-hq-race') || {}).value || '';

    // Resolve THIS piece to its own Table 29 column, honouring the high-quality
    // racial rules per piece -- one gnomish sleeve must not erase the penalty
    // from a plate breastplate, and it cannot: 'none' loses to anything worse.
    let col = 'padded';
    const hqP = (thisHq && typeof getHighQualityArmor === 'function')
      ? getHighQualityArmor(thisHq, thisKey) : null;
    if (hqP && (hqP.thiefRule === 'noPenalty' || hqP.thiefRule === 'countsAsNone')) {
      col = 'none';
    } else {
      const td = (typeof ARMOR_TYPES !== 'undefined') ? ARMOR_TYPES[thisKey] : null;
      col = (td && td.thiefColumn) || 'padded';   // no column = outside Table 29 = worst
    }

    const rank = RANK.indexOf(col);
    if (rank > bestRank) {
      bestRank = rank;
      worn = name || ((typeof ARMOR_TYPES !== 'undefined' && ARMOR_TYPES[thisKey])
        ? ARMOR_TYPES[thisKey].label : '');
      typeKey = thisKey;
      hqRace = thisHq;
    }
  });

  // PHBR1 pp.110-111, the two racial rules that reach this table.
  //
  //   GNOME  "High-Quality gnome armor does not take any penalties on the
  //          Thieving Skill Armor Adjustment table ... thus a gnome thief or
  //          dual-class thief does not suffer a -30% when picking pockets, or
  //          -20% when moving silently, etc."
  //   HALFLING  "Their High-Quality leather armor counts as 'No Armor' on the
  //          Thieving Skill Armor Adjustment table."
  //
  // BOTH RESOLVE TO THE SAME COLUMN and are kept as two named rules anyway,
  // because they say different things and a later book may separate them: the
  // gnome takes no penalty from armour he IS wearing, the halfling's leather is
  // treated as though he were wearing none. Collapsing them to one flag would
  // lose that, and the note the card shows differs accordingly.
  //
  // Returned with the real typeKey intact, so the armour still reports as
  // studded or leather everywhere else -- only the ADJUSTMENT COLUMN changes.
  if (hqRace && typeof getHighQualityArmor === 'function') {
    const hq = getHighQualityArmor(hqRace, typeKey);
    if (hq && (hq.thiefRule === 'noPenalty' || hq.thiefRule === 'countsAsNone')) {
      return {
        key: 'none', typeKey: typeKey || 'none',
        name: worn || (hq.label + ' armor'),
        illegal: false, hqThiefRule: hq.thiefRule, hqLabel: hq.label
      };
    }
  }

  if (!typeKey) return { key: 'none', typeKey: 'none', name: worn || 'No armor', illegal: false };

  const data = (typeof ARMOR_TYPES !== 'undefined') ? ARMOR_TYPES[typeKey] : null;
  if (!data) return { key: 'none', typeKey: '', name: worn || 'No armor', illegal: false };

    // Table COVERAGE and CLASS LEGALITY are different questions. They coincide
  // under Table 29 and come apart twice: a BARD legally wears ring, hide,
  // brigandine or scale, none of which Table 29 covers; and PHBR2's Table 38
  // gives every type a column, so `!col` would be false everywhere and the
  // class warning would vanish the moment that band was ticked.
  // `every`, not the rail's `some`: a multi-classed fighter/thief may wear
  // plate -- he loses thief skills, which is a separate rule handled elsewhere.
  const col = data.thiefColumn;
  const comps = (typeof getAllClassComponents === 'function')
    ? (getAllClassComponents(root) || []) : [];
  const illegal = typeKey !== 'none' && comps.length > 0 && comps.every(cp => {
    const allowed = (typeof getArmorAllowedList === 'function')
      ? getArmorAllowedList(cp.clazz) : null;
    return allowed && allowed.indexOf(typeKey) === -1;
  });
  return { key: col || 'padded', typeKey: typeKey, name: worn || data.label, illegal: illegal };
}

// PHBR2 Table 4 (p.24): the character's kit adjustment for the eight thief
// skills, or null when the band is off, the character has no kit, or the kit
// carries no adjustments.
//
// The kit dropdown stores the kit NAME with spaces stripped and lowercased --
// "Bounty Hunter" becomes "bountyhunter" -- so the match is made the same way
// renderKitAbilities makes it, rather than against the kits.js object key.
// They agree today; matching the same way means they cannot drift apart.
function getKitSkillMods(root) {
  if (typeof isSupplementActive !== 'function' ||
      !isSupplementActive('phbr2', 'kitSkillAdjustments')) return null;
  if (typeof getKitsForClass !== 'function') return null;

  const kitValue = (root.querySelector('[data-field="kit"]') || {}).value || '';
  const clazz    = (root.querySelector('[data-field="clazz"]') || {}).value || '';
  if (!kitValue || !clazz) return null;

  const want = kitValue.toLowerCase().replace(/\s+/g, '');
  const kit  = getKitsForClass(clazz)
    .find(k => (k.name || '').toLowerCase().replace(/\s+/g, '') === want);
  if (!kit || !kit.thiefSkillMods) return null;

  // Eight skills, in the order renderThiefSkills uses. A MISSING KEY IS ZERO
  // here, unlike a null, which means the kit has no such ability at all -- the
  // ranger kits carry only two keys and must never be read as eight.
  const m = kit.thiefSkillMods;
  const K = ['pickPockets','openLocks','findTraps','moveSilently',
             'hideInShadows','detectNoise','climbWalls','readLanguages'];
  if (!K.some(k => typeof m[k] === 'number')) return null;
  return { name: kit.name, adj: K.map(k => (typeof m[k] === 'number' ? m[k] : 0)) };
}

// The adjustment row for a character. Bards take the extra -5% in ordinary
// chain mail; anyone else lands on the worst column instead of the
// bard-specific row.
function getThiefArmorAdjustments(root, isBard) {
  const cat = getThiefArmorCategory(root);

  // PHBR2 Table 38. NOT FOR BARDS: the Complete Bard's Handbook prints its own
  // armour table (PHBR7 p.11) with materially lighter penalties -- ring mail
  // -25/-10/-25 against Table 38's -40/-20/-40 -- so applying the thief table
  // to a bard would contradict his own book. Bards stay on Table 29 plus its
  // footnote until a PHBR7 band exists. PHBR7 independently prints -25/-10/-25
  // for chain, which is exactly what the footnote derivation above produces.
  //
  // Keyed off cat.key === 'none' FIRST, not off typeKey. The PHBR1
  // high-quality branch above returns key 'none' while keeping the real
  // typeKey, so mapping from typeKey would charge a gnome in gnomish studded
  // leather -30% and silently cancel a PHBR1 benefit.
  if (!isBard && typeof isSupplementActive === 'function' &&
      isSupplementActive('phbr2', 'armorThiefSkills') &&
      typeof PHBR2_THIEF_COLUMN !== 'undefined') {
    const col = (cat.key === 'none')
      ? 'none'
      : (PHBR2_THIEF_COLUMN[cat.typeKey] || 'studded_padded');
    return { adj: THIEF_ARMOR_ADJUSTMENTS_PHBR2[col] || THIEF_ARMOR_ADJUSTMENTS_PHBR2.leather,
             key: col, name: cat.name, illegal: cat.illegal,
             hqThiefRule: cat.hqThiefRule, hqLabel: cat.hqLabel, phbr2: true };
  }

  let key = cat.key;
  // COLUMN CHOICE ONLY. Legality is decided in getThiefArmorCategory from
  // CLASS_ARMOR_ALLOWED. Forcing it true here also flagged a multi-classed
  // fighter/thief, for whom chain mail is perfectly legal.
  if (key === 'chain' && !isBard) { key = 'padded'; }
  return { adj: THIEF_ARMOR_ADJUSTMENTS[key] || THIEF_ARMOR_ADJUSTMENTS.leather,
           key: key, name: cat.name, illegal: cat.illegal };
}

// === Armor construction types (PHB Ch.6 equipment list + Table 46) ===
// THE ANCHOR: this is the source of truth for how a piece of armor behaves.
// core_armor.json is only a convenience that prefills these when the player
// picks a known armor by name -- once a record exists, every rule reads the
// stored type, never the name. That is what lets "Gladiator Armor" or
// "Shadowsilk Wrap" resolve correctly: those are NAMES, this is the TYPE.
//
// ac / weight verified against the printed equipment list and Table 46.
// Movement is deliberately absent -- the PHB movement table has not been
// audited yet, and core_armor.json already carried three weight errors
// (studded leather 20 vs 25, great helm 15 vs 10, basinet 8 vs 5).
//
// thiefColumn maps to THIEF_ARMOR_ADJUSTMENTS. null means the armor is outside
// Table 29 entirely, so the worst column applies. 'leather' is the baseline the
// Table 26 base scores already assume, hence all zeros.
const ARMOR_TYPES = {
  none:         { label: 'None',              ac: 10, weight:  0, thiefColumn: 'none',    rangerStealth: true,  metal: false },
  padded:       { label: 'Padded',            ac:  8, weight: 10, thiefColumn: 'padded',  rangerStealth: true,  metal: false },
  leather:      { label: 'Leather',           ac:  8, weight: 15, thiefColumn: 'leather', rangerStealth: true,  metal: false },
  studded:      { label: 'Studded Leather',   ac:  7, weight: 25, thiefColumn: 'padded',  rangerStealth: true,  metal: true  },
  ring:         { label: 'Ring Mail',         ac:  7, weight: 30, thiefColumn: null,      rangerStealth: false, metal: true  },
  hide:         { label: 'Hide',              ac:  6, weight: 30, thiefColumn: null,      rangerStealth: false, metal: false },
  brigandine:   { label: 'Brigandine',        ac:  6, weight: 35, thiefColumn: null,      rangerStealth: false, metal: true  },
  scale:        { label: 'Scale Mail',        ac:  6, weight: 40, thiefColumn: null,      rangerStealth: false, metal: true  },
  chain:        { label: 'Chain Mail',        ac:  5, weight: 40, thiefColumn: 'chain',   rangerStealth: false, metal: true  },
  elven_chain:  { label: 'Elven Chain Mail',  ac:  5, weight: 15, thiefColumn: 'elven',   rangerStealth: true,  metal: true  },
  // PHBR2 p.93. thiefColumn stays 'elven' DELIBERATELY: Table 28 is PHBR2's, so
  // with the book switched off this must behave as ordinary elfin chain under
  // PHB Table 29. The difference lives in PHBR2_THIEF_COLUMN, which is only
  // consulted when the armorThiefSkills band is on.
  silenced_elven: { label: 'Silenced Elfin Chain', ac: 5, weight: 20, thiefColumn: 'elven', rangerStealth: true, metal: true },
  banded:       { label: 'Banded Mail',       ac:  4, weight: 35, thiefColumn: null,      rangerStealth: false, metal: true  },
  splint:       { label: 'Splint Mail',       ac:  4, weight: 40, thiefColumn: null,      rangerStealth: false, metal: true  },
  bronze_plate: { label: 'Bronze Plate Mail', ac:  4, weight: 45, thiefColumn: null,      rangerStealth: false, metal: true  },
  plate:        { label: 'Plate Mail',        ac:  3, weight: 50, thiefColumn: null,      rangerStealth: false, metal: true  },
  field_plate:  { label: 'Field Plate',       ac:  2, weight: 60, thiefColumn: null,      rangerStealth: false, metal: true  },
  full_plate:   { label: 'Full Plate',        ac:  1, weight: 70, thiefColumn: null,      rangerStealth: false, metal: true  }
};

// === Shields (PHB Ch.6) ===
// Size and material on one dropdown, but the KEY carries the facts -- nothing
// parses the label, so relabelling can never break a rule. The PHB does not
// distinguish wooden from metal shields anywhere except the druid restriction,
// and gives no price or weight difference, so material is a flag only.
// NOTE the PHB's size rule: "reference to the size of the shield is relative to
// the character. A human's small shield would have all the effects of a medium
// shield used by a gnome." Not modelled -- surfaced as a note if it matters.
const SHIELD_TYPES = {
  buckler_wood:  { label: 'Buckler, wooden', size: 'buckler', wooden: true,  weight:  3, defends: 'One attack per round, of your choice' },
  buckler_metal: { label: 'Buckler, metal',  size: 'buckler', wooden: false, weight:  3, defends: 'One attack per round, of your choice' },
  small_wood:    { label: 'Small, wooden',   size: 'small',   wooden: true,  weight:  5, defends: 'Two frontal attacks; the hand may carry items but not weapons' },
  small_metal:   { label: 'Small, metal',    size: 'small',   wooden: false, weight:  5, defends: 'Two frontal attacks; the hand may carry items but not weapons' },
  medium_wood:   { label: 'Medium, wooden',  size: 'medium',  wooden: true,  weight: 10, defends: 'Any frontal or flank attacks' },
  medium_metal:  { label: 'Medium, metal',   size: 'medium',  wooden: false, weight: 10, defends: 'Any frontal or flank attacks' },
  body_wood:     { label: 'Body, wooden',    size: 'body',    wooden: true,  weight: 15, defends: 'Front and front flank only; +1 melee, +2 vs missiles. Very heavy.' },
  body_metal:    { label: 'Body, metal',     size: 'body',    wooden: false, weight: 15, defends: 'Front and front flank only; +1 melee, +2 vs missiles. Very heavy.' }
};

// === Other worn items ===
// Only the SLOT matters for rules: PHB Ch.3 multi-class thief text says he
// "must remove his gauntlets to open locks and his helmet to detect noise."
// It does not qualify by material, so any gauntlets and any helmet count.
const WEARABLE_TYPES = {
  helmet_leather:  { label: 'Helmet, leather cap', slot: 'Helmet',    weight:  1, metal: false },
  helmet_coif:     { label: 'Helmet, padded coif', slot: 'Helmet',    weight:  1, metal: false },
  helmet_basinet:  { label: 'Helmet, basinet',     slot: 'Helmet',    weight:  5, metal: true  },
  helmet_metal:    { label: 'Helmet, metal helm',  slot: 'Helmet',    weight: 10, metal: true  },
  helmet_great:    { label: 'Helmet, great helm',  slot: 'Helmet',    weight: 10, metal: true  },
  gauntlets_leather:{ label:'Gauntlets, leather',  slot: 'Gauntlets', weight:  1, metal: false },
  gauntlets_metal: { label: 'Gauntlets, metal',    slot: 'Gauntlets', weight:  2, metal: true  },
  boots_soft:      { label: 'Boots, soft leather', slot: 'Boots',     weight:  3, metal: false },
  boots_hard:      { label: 'Boots, hard leather', slot: 'Boots',     weight:  4, metal: false },
  boots_metal:     { label: 'Boots, metal-shod',   slot: 'Boots',     weight:  5, metal: true  },
  cloak:           { label: 'Cloak',               slot: 'Cloak',     weight:  3, metal: false },
  bracers:         { label: 'Bracers',             slot: 'Bracers',   weight:  1, metal: false },
  belt:            { label: 'Belt',                slot: 'Belt',      weight:  1, metal: false }
};

// === Class armor restrictions (PHB Ch.3) ===
// null means no restriction. Keys are ARMOR_TYPES keys.
// Druid is RAW: "only 'natural' armors -- leather armor and wooden shields...
// All other armors are forbidden to him." The wider padded/leather/hide list is
// a HOUSE RULE behind the druidArmorRestriction override, which DEFAULTS ON
// (= the book's rule), per the "tool ships RAW" principle.
const CLASS_ARMOR_ALLOWED = {
  wizard:  [],                                                    // no armor at all
  thief:   ['none', 'leather', 'studded', 'padded', 'elven_chain', 'silenced_elven'],
  bard:    ['none', 'padded', 'leather', 'studded', 'ring', 'hide',
            'brigandine', 'scale', 'chain', 'elven_chain', 'silenced_elven'], // "up to and including chain mail"
  druid:   ['none', 'leather'],
  cleric:  null,
  warrior: null
};
const DRUID_ARMOR_HOUSE = ['none', 'padded', 'leather', 'hide'];

function getArmorTypeData(key) { return ARMOR_TYPES[key] || null; }
function getShieldTypeData(key) { return SHIELD_TYPES[key] || null; }

// Which armor types a given class may wear. Returns null for "no restriction".
// CLASS_ARMOR_ALLOWED is keyed by a mix of specific classes and groups, because
// the PHB states them that way -- druid and bard have their own lists while
// their GROUPS (priest, rogue) do not. So specific names are tested first.
function getArmorAllowedList(clazz) {
  const c = (clazz || '').trim().toLowerCase();
  if (!c) return null;

  if (c.includes('druid')) {
    // RAW is leather only. The wider padded/leather/hide list is a house rule
    // behind an override that DEFAULTS ON (= the book's rule).
    const strict = (typeof isOptionalRule !== 'function') || isOptionalRule('druidArmorRestriction');
    return strict ? CLASS_ARMOR_ALLOWED.druid : DRUID_ARMOR_HOUSE;
  }
  if (c.includes('bard'))   return CLASS_ARMOR_ALLOWED.bard;
  if (c.includes('thief') || c.includes('assassin')) return CLASS_ARMOR_ALLOWED.thief;

  const cat = (typeof getClassCategory === 'function') ? getClassCategory(clazz) : null;
  if (cat === 'wizard') return CLASS_ARMOR_ALLOWED.wizard;
  if (cat === 'rogue')  return CLASS_ARMOR_ALLOWED.thief;
  return null;                                  // cleric and warrior: anything
}

// Every class the character actually has, as {clazz, level} pairs.
function getAllClassComponents(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const out = [];
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = val(root, 'mc_class' + i) || '';
      if (c) out.push({ clazz: c, level: parseInt(val(root, 'mc_level' + i) || 0, 10) });
    }
  } else if (charType === 'dual') {
    const nc = val(root, 'dc_new_class') || '';
    const oc = val(root, 'dc_original_class') || '';
    if (nc) out.push({ clazz: nc, level: parseInt(val(root, 'dc_new_level') || 0, 10) });
    if (oc) out.push({ clazz: oc, level: parseInt(val(root, 'dc_original_level') || 0, 10) });
  } else {
    const c = val(root, 'clazz') || '';
    if (c) out.push({ clazz: c, level: parseInt(val(root, 'level') || 0, 10) });
  }
  return out;
}

// Advisory list of armor a class should not be wearing. NEVER blocks.
// Multi-class is reported per class rather than as a single verdict: a
// fighter/mage may legitimately wear plate as a fighter while being unable to
// cast in it, so naming the affected class is more useful than a flat "illegal".
function getArmorRestrictionProblems(root) {
  const problems = [];
  if (typeof ARMOR_TYPES === 'undefined') return problems;

  const comps = getAllClassComponents(root);
  if (!comps.length) return problems;

  Array.from(root.querySelectorAll('.armor-list .item')).forEach(item => {
    const cb = item.querySelector('.equipped');
    if (!cb || !cb.checked) return;

    const slotEl = item.querySelector('.armor-slot') || item.querySelector('.armor-type');
    const slot = (slotEl || {}).value || 'Armor';
    const typeKey = item.querySelector('.armor-slot')
      ? ((item.querySelector('.armor-type') || {}).value || '')
      : '';
    const name = ((item.querySelector('.title') || {}).value || '').trim();

    if (slot === 'Shield') {
      // The PHB distinguishes wooden from metal shields ONLY for druids.
      const sh = SHIELD_TYPES[typeKey];
      if (sh && !sh.wooden) {
        comps.forEach(cp => {
          if ((cp.clazz || '').toLowerCase().includes('druid')) {
            problems.push((name || sh.label) + ': druids may use only wooden shields.');
          }
        });
      }
      return;
    }
    if (slot !== 'Armor') return;               // helmets, boots and the rest carry no class rule

    const key = typeKey || (typeof inferArmorTypeKey === 'function' ? inferArmorTypeKey(name) : '');
    if (!key || key === 'none') return;
    const data = ARMOR_TYPES[key];
    if (!data) return;

    comps.forEach(cp => {
      const allowed = getArmorAllowedList(cp.clazz);
      if (!allowed) return;                     // unrestricted class
      if (allowed.indexOf(key) !== -1) return;  // permitted
      const who = comps.length > 1 ? ' as a ' + cp.clazz : '';
      problems.push((name || data.label) + ' (' + data.label + ') is not permitted' + who + '.');
    });
  });

  // ---- Checks that look at the equipped set as a WHOLE, not item by item ----
  // The loop above judges each piece against the character's class. These two
  // judge combinations, so they need a second pass over the equipped list.
  const worn = Array.from(root.querySelectorAll('.armor-list .item')).filter(item => {
    const cb = item.querySelector('.equipped');
    return cb && cb.checked;
  });

  const slotOf = item =>
    ((item.querySelector('.armor-slot') || item.querySelector('.armor-type') || {}).value || 'Armor');
  const nameOf = item =>
    (((item.querySelector('.title') || {}).value || '').trim());

  // 1. More than one suit of body armor.
  // The AC calculation takes the best and ignores the rest, so the NUMBER is
  // right -- but nothing was telling the player that plate over chain is not a
  // thing. Bracers are excluded here and handled below, since they occupy a
  // different slot and have their own rule.
  const bodyArmor = worn.filter(item => slotOf(item) === 'Armor');
  if (bodyArmor.length > 1) {
    const names = bodyArmor.map(i => nameOf(i) || 'unnamed').join(', ');
    problems.push('More than one suit of body armor is equipped (' + names +
      '). Only the best applies to Armor Class; a character wears one suit.');
  }

  // 2. Bracers worn together with body armor.
  // SOURCE: bracers of defense are a DMG magic item, not PHB Chapter 6 -- the
  // PHB armor table has no bracers at all. Wording CONFIRMED by Chris's DM:
  // "you can't wear armor and get an AC bonus from the Bracers AND armor, it is
  // one or the other. Other magic items like a Ring of Protection DO stack with
  // the Bracers of Defense."
  //
  // The CALCULATION already obeys this: renderArmorClass puts Armor and Bracers
  // in the same branch, so only the better of the two sets base AC, while rings
  // accumulate separately and therefore stack with whichever wins. This note
  // exists because that is invisible -- a player wearing plate over AC 4 bracers
  // should be told the bracers are contributing nothing, not left to wonder.
  //
  // Informational rather than a fault: wearing both is legal, it just does not
  // stack. It rides in the advisory banner because that is where armor notes
  // live, but nothing here is wrong with the character.
  const bracers = worn.filter(item => slotOf(item) === 'Bracers');
  if (bracers.length && bodyArmor.length) {
    const bn = bracers.map(i => nameOf(i) || 'Bracers').join(', ');
    problems.push(bn + ' with body armor: these do not stack, so only the better ' +
      'of the two applies to Armor Class. Rings of protection and similar items ' +
      'still stack with whichever one wins.');
  }

return problems;
}

// Per-item legality for the armor card rail. Three states, and the split is
// deliberate:
//
//   'restricted' -- the PHB forbids it outright. Same meaning, and the same
//                   --error, as "not proficient" on the weapon rail.
//   'advisory'   -- an ABILITY is suspended rather than a rule broken. A ranger
//                   in chain mail is doing nothing illegal; he simply cannot
//                   hide.
//   'allowed'    -- everything else.
//
// Judges ONE item at a time, unlike getArmorRestrictionProblems above, whose
// second pass looks at the equipped set as a whole. Whole-set problems have no
// single card to point at, so they stay in the banner where they already are.
//
// ADVISORY, NEVER BLOCKING, like every other class limit in this file: the rail
// reports, it does not prevent.
function getArmorLegality(item, root) {
  if (typeof ARMOR_TYPES === 'undefined') return 'allowed';
  // Judged whether worn or not. A stowed piece breaks no rule right now, but
  // the rail is answering "what would this do for me", and that is a question
  // worth answering BEFORE it goes on -- a wizard should see the plate is
  // useless to him while it is still in the cart. The chip says whether it is
  // in use; the rail says how well it suits the character. Two channels, two
  // questions, which is why neither has to borrow the other's answer.

  const slotEl = item.querySelector('.armor-slot') || item.querySelector('.armor-type');
  const slot   = (slotEl || {}).value || 'Armor';
  const typeKey = item.querySelector('.armor-slot')
    ? ((item.querySelector('.armor-type') || {}).value || '')
    : '';
  const name = ((item.querySelector('.title') || {}).value || '').trim();

  const comps = (typeof getAllClassComponents === 'function') ? getAllClassComponents(root) : [];
  if (!comps.length) return 'allowed';

  if (slot === 'Shield') {
    // The PHB distinguishes wooden from metal shields ONLY for druids.
    const sh = (typeof SHIELD_TYPES !== 'undefined') ? SHIELD_TYPES[typeKey] : null;
    if (sh && !sh.wooden &&
        comps.some(cp => (cp.clazz || '').toLowerCase().includes('druid'))) {
      return 'restricted';
    }
    return 'allowed';
  }
  if (slot !== 'Armor') return 'allowed';     // helmets, boots and the rest carry no class rule

  const key = typeKey || (typeof inferArmorTypeKey === 'function' ? inferArmorTypeKey(name) : '');
  if (!key || key === 'none') return 'allowed';

    // A class limit outranks a suspended ability -- but ONLY when EVERY class the
  // character has forbids the armour. `some` used to be enough, which made a
  // fighter/thief in plate 'restricted' though he breaks no rule: the fighter
  // permits plate and he merely loses six of his eight thief skills. That is
  // this rail's own definition of 'advisory', and it now matches
  // getThiefArmorCategory, which decides the same question with `every`.
  const barring = comps.filter(cp => {
    const allowed = getArmorAllowedList(cp.clazz);
    return allowed && allowed.indexOf(key) === -1;
  });
  if (barring.length && barring.length === comps.length) return 'restricted';

  // Ranger stealth. RANGER_STEALTH_MAX_ARMOR is reused rather than restated so
  // the rail and the stealth panel can never disagree about elven chain.
  const isRanger = comps.some(cp => (cp.clazz || '').toLowerCase().includes('ranger'));
  if (isRanger && typeof RANGER_STEALTH_MAX_ARMOR !== 'undefined' &&
      RANGER_STEALTH_MAX_ARMOR.indexOf(key) === -1) {
    return 'advisory';
  }

  // Barred by one class but permitted by another: no rule broken, an ability
  // suspended.
  if (barring.length) return 'advisory';

  return 'allowed';
}

// PHB Ch.3, Multi-Class Benefits and Restrictions:
//   "A multi-classed thief cannot use any thieving abilities other than open
//    locks or detect noise if he is wearing armor that is normally not allowed
//    to thieves. He must remove his gauntlets to open locks and his helmet to
//    detect noise."
//
// MULTI-CLASS ONLY. A single-class thief in heavy armor takes the Table 29
// percentage penalties instead and loses nothing outright -- the two are
// separate rules and the book keeps them separate.
//
// Returns { active, disabled:[skill indices], armorName, gauntlets, helmet }.
// Skill index order matches THIEF_SKILLS_BASE:
//   0 Pick Pockets, 1 Open Locks, 2 Find/Remove Traps, 3 Move Silently,
//   4 Hide in Shadows, 5 Detect Noise, 6 Climb Walls, 7 Read Languages
function getMultiClassThiefArmorPenalty(root) {
  const out = { active: false, disabled: [], armorName: '', gauntlets: false, helmet: false };

  if ((val(root, 'char_type') || 'single').toLowerCase() !== 'multi') return out;
  if (typeof ARMOR_TYPES === 'undefined') return out;

  // Is one of the classes a thief? Bards are rogues but this rule names thieves.
  const hasThief = [1, 2, 3].some(i => {
    const c = (val(root, 'mc_class' + i) || '').toLowerCase();
    return c.includes('thief') || c.includes('assassin');
  });
  if (!hasThief) return out;

  const allowed = CLASS_ARMOR_ALLOWED.thief;
  let badArmor = '';
  Array.from(root.querySelectorAll('.armor-list .item')).forEach(item => {
    const cb = item.querySelector('.equipped');
    if (!cb || !cb.checked) return;

    const slotEl = item.querySelector('.armor-slot') || item.querySelector('.armor-type');
    const slot = (slotEl || {}).value || 'Armor';
    const typeKey = item.querySelector('.armor-slot')
      ? ((item.querySelector('.armor-type') || {}).value || '')
      : '';
    const name = ((item.querySelector('.title') || {}).value || '').trim();

    if (slot === 'Gauntlets') { out.gauntlets = true; return; }
    if (slot === 'Helmet')    { out.helmet = true;    return; }
    if (slot !== 'Armor') return;

    const key = typeKey || (typeof inferArmorTypeKey === 'function' ? inferArmorTypeKey(name) : '');
    if (!key || key === 'none') return;
    if (allowed.indexOf(key) === -1) {
      badArmor = name || (ARMOR_TYPES[key] ? ARMOR_TYPES[key].label : key);
    }
  });

  if (badArmor) {
    out.active = true;
    out.armorName = badArmor;
    out.disabled = [0, 2, 3, 4, 6, 7];          // everything except Open Locks and Detect Noise
    if (out.gauntlets) out.disabled.push(1);    // gauntlets block open locks
    if (out.helmet)    out.disabled.push(5);    // helmet blocks detect noise
  }

  return out;
}

// === Ranger stealth (PHB Table 18) ===
// Format: [Hide in Shadows, Move Silently]. Table 18 stops at ranger 16 and
// marks 99% "maximum attainable", so 17-20 hold at the 16th-level row.
// These are NOT thief skills: the ranger text names Tables 27 (race) and 28
// (Dexterity) as the only modifiers and does NOT reference Table 29, so the
// thief's armor percentage adjustments do not apply. The ranger's armor rule
// is binary instead -- see RANGER_STEALTH_MAX_ARMOR below.
const RANGER_STEALTH = {
  1:  [10, 15],  2:  [15, 21],  3:  [20, 27],  4:  [25, 33],
  5:  [31, 40],  6:  [37, 47],  7:  [43, 55],  8:  [49, 62],
  9:  [56, 70], 10:  [63, 78], 11:  [70, 86], 12:  [77, 94],
  13: [85, 99], 14:  [93, 99], 15:  [99, 99], 16:  [99, 99],
  17: [99, 99], 18:  [99, 99], 19:  [99, 99], 20:  [99, 99]
};
const RANGER_STEALTH_CAP = 99;   // Table 18: "maximum attainable"

// Armor categories a ranger may still hide and move silently in. PHB: "Hiding
// in shadows and moving silently are not possible in any armor heavier than
// studded leather -- the armor is inflexible and makes too much noise."
// Elven chain IS allowed. Despite being chain, it weighs 15 lb against studded
// leather's 20 and permits Move 12 where studded leather drops to 9 -- so it is
// not "heavier than studded leather" by any measure the book uses. The rule's
// own stated reason (inflexible, too much noise) also fails to apply: elven
// chain is described as lighter and quieter, and wizards can cast in it.
// Now keyed off ARMOR_TYPES entries rather than Table 29 column names, since
// the stored armorTypeKey is the anchor. Studded leather is explicitly the
// PHB's line ("not possible in any armor heavier than studded leather").
// Elven chain qualifies on the numbers -- 15 lb and Move 12 against studded
// leather's 25 lb and Move 9 -- and the rule's own stated reason (inflexible,
// too much noise) does not apply to it either.
const RANGER_STEALTH_MAX_ARMOR = ['none', 'padded', 'leather', 'studded', 'elven_chain', 'silenced_elven'];

// === PHBR11 Tables 11 and 13: ranger stealth by armor (SUPPLEMENT, OFF by default) ===
// [Hide in Shadows, Move Silently], percentage points.
//
// THIS CONFLICTS WITH THE PHB, which is why it is gated. The PHB gives rangers
// NO armor percentages -- the ranger text names only Tables 27 (race) and 28
// (Dexterity) and never references Table 29 -- and states a binary rule instead:
// no hiding or moving silently in anything heavier than studded leather. The
// CRH disagrees on TWO points, not one:
//
//   1. It applies percentages, implying Table 18's base assumes LEATHER (which
//      is why leather is 0 here and no armor is a BONUS).
//   2. Its Table 11 lists RING MAIL -- heavier than studded leather -- so under
//      the CRH a ranger keeps a reduced chance rather than losing it entirely.
//
// Table 13 is the CRH's OWN optional extension, for DMs who let rangers wear
// anything. Both are folded into one toggle here: a table that has opted into
// the supplement's armor model has no reason to take half of it, and the
// Justifier and Stalker kits both already reference Table 13 by name.
const RANGER_STEALTH_ARMOR_CRH = {
  // Table 11 (p.11). "None" includes magical apparel such as cloaks and
  // bracers, but NOT large or bulky garments.
  none:         [  5,  10],
  leather:      [  0,   0],
  padded:       [-20, -20],
  studded:      [-20, -20],
  ring:         [-30, -40],
  // Table 13: Optional Armor Adjustments (p.11).
  hide:         [-20, -30],
  brigandine:   [-30, -40],
  scale:        [-50, -60],
  chain:        [-30, -40],
  elven_chain:  [-10, -10],
  // PHBR11 predates PHBR2 and prints no row for silenced elfin chain. It
  // INHERITS elfin chain's figures rather than being improved by Table 28's
  // relative logic: Table 28 is the only place any book states a difference,
  // and it speaks to thief skills, not ranger stealth. Chris's ruling, Aug 2026.
  silenced_elven: [-10, -10],
  splint:       [-30, -40],
  banded:       [-50, -60],
  bronze_plate: [-75, -80],
  plate:        [-75, -80],
  field_plate:  [-95, -95],
  full_plate:   [-95, -95]
};

// Which sub-class is the ranger? Half-elves may be fighter/ranger or
// cleric/ranger, so multi-class has to be searched rather than assumed.
function getRangerComponent(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const isRanger = c => !!c && String(c).toLowerCase().includes('ranger');

  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = val(root, 'mc_class' + i) || '';
      if (isRanger(c)) return { clazz: c, level: parseInt(val(root, 'mc_level' + i) || 0, 10) };
    }
    return null;
  }
  if (charType === 'dual') {
    const nw = { clazz: val(root, 'dc_new_class') || '',
                 level: parseInt(val(root, 'dc_new_level') || 0, 10) };
    const og = { clazz: val(root, 'dc_original_class') || '',
                 level: parseInt(val(root, 'dc_original_level') || 0, 10) };
    if (isRanger(nw.clazz)) return nw;
    if (isRanger(og.clazz)) { og.dormant = nw.level <= og.level; return og; }
    return null;
  }
  const clazz = val(root, 'clazz') || '';
  if (isRanger(clazz)) return { clazz: clazz, level: parseInt(val(root, 'level') || 0, 10) };
  return null;
}

// Full stealth picture for a ranger, or null if the character is not one.
// Returns natural and non-natural figures -- the PHB halves the chance in
// "non-natural surroundings (a musty crypt or city streets)" -- plus the armor
// verdict, so the UI can show why the numbers are unavailable.
function getRangerStealth(root) {
  const comp = getRangerComponent(root);
  if (!comp || !comp.level) return null;

  const base = RANGER_STEALTH[Math.min(Math.max(comp.level, 1), 20)];
  if (!base) return null;

  // Race and Dexterity adjustments come from the THIEF tables (27 and 28),
  // index 4 = Hide in Shadows, index 3 = Move Silently.
  const race = (val(root, 'race') || '').trim().toLowerCase();
  let racial = [0, 0, 0, 0, 0, 0, 0, 0];
  if (typeof THIEF_RACIAL_ADJUSTMENTS !== 'undefined') {
    for (const key in THIEF_RACIAL_ADJUSTMENTS) {
      if (race.includes(key)) { racial = THIEF_RACIAL_ADJUSTMENTS[key]; break; }
    }
  }
  const dex = parseInt(val(root, 'dex') || 9, 10);
  const dexAdj = (typeof THIEF_DEX_ADJUSTMENTS !== 'undefined')
    ? (THIEF_DEX_ADJUSTMENTS[dex] || [0, 0, 0, 0, 0]) : [0, 0, 0, 0, 0];

  // PHBR11 Table 12: Kit Adjustments. Percentage points, added alongside the
  // race and Dexterity figures. NO optional-rule gate -- this is not a
  // supplement overriding the PHB, it is the content of a kit the player chose,
  // and the kit selection IS the opt-in.
  //
  // Looked up by the same derivation validateKitAlignment and renderKitAbilities
  // use: the select stores the kit NAME with whitespace removed, not the KITS
  // object key.
  let kitMods = null, kitName = '';
  const kitValue = (val(root, 'kit') || '').trim();
  if (kitValue && typeof getKitsForClass === 'function') {
    const kit = getKitsForClass('ranger')
      .find(k => k.name.toLowerCase().replace(/\s+/g, '') === kitValue);
    if (kit && kit.thiefSkillMods) { kitMods = kit.thiefSkillMods; kitName = kit.name; }
  }

  // NULL is not zero. The Sea Ranger has NEITHER ability -- he replaces them
  // with Sea Legs and Aquatic Combat -- so the figures are unavailable rather
  // than unmodified, and the UI needs to say so instead of printing a number.
  const noStealth = !!(kitMods &&
    (kitMods.hideInShadows === null || kitMods.moveSilently === null));
  const kitHide = (kitMods && typeof kitMods.hideInShadows === 'number') ? kitMods.hideInShadows : 0;
  const kitMove = (kitMods && typeof kitMods.moveSilently  === 'number') ? kitMods.moveSilently  : 0;

// MOVED ABOVE THE ARITHMETIC. Under the CRH supplement rule the armor worn is
  // an INPUT to the percentages rather than only a yes/no gate, so it has to be
  // resolved before hide and move are computed.
  const armor = (typeof getThiefArmorCategory === 'function')
    ? getThiefArmorCategory(root) : { key: 'none', typeKey: 'none', name: 'No armor' };
  // typeKey, NOT key. key is the Table 29 COLUMN ('elven', 'padded', ...) while
  // RANGER_STEALTH_MAX_ARMOR lists ARMOR_TYPES keys ('elven_chain', 'studded').
  // The two vocabularies overlap enough to look interchangeable and are not.
  const armorKey = armor.typeKey || 'none';

  const crhArmor = (typeof isOptionalRule === 'function') &&
                   isOptionalRule('rangerArmorStealthCRH') &&
                   (typeof RANGER_STEALTH_ARMOR_CRH !== 'undefined');

  // Under the CRH the studded-leather ceiling is LIFTED: heavy armor carries a
  // steep penalty instead of removing the ability, so nothing is blocked. An
  // armor with no row falls back to [0, 0] rather than being treated as barred,
  // because a missing row is our gap, not a prohibition.
  const armorMod = crhArmor
    ? (RANGER_STEALTH_ARMOR_CRH[armorKey] || [0, 0])
    : [0, 0];
  const blocked = crhArmor
    ? false
    : RANGER_STEALTH_MAX_ARMOR.indexOf(armorKey) === -1;

  const clamp = v => Math.max(0, Math.min(RANGER_STEALTH_CAP, v));
  const hide = clamp(base[0] + racial[4] + dexAdj[4] + kitHide + armorMod[0]);
  const move = clamp(base[1] + racial[3] + dexAdj[3] + kitMove + armorMod[1]);

  return {
    level: comp.level,
    dormant: !!comp.dormant,
    base: base,
    racial: [racial[4], racial[3]],
    dex: [dexAdj[4], dexAdj[3]],
    kit: [kitHide, kitMove],
    armorMod: armorMod,
    crhArmor: crhArmor,
    kitName: kitName,
    noStealth: noStealth,
    kitNote: (kitMods && kitMods.note) ? kitMods.note : '',
    hide: hide,
    move: move,
    hideNonNatural: Math.floor(hide / 2),
    moveNonNatural: Math.floor(move / 2),
    armorName: armor.name,
    armorKey: armor.typeKey || armor.key,
    blocked: blocked
  };
}

// === Animal empathy (PHBR11 Ch.2, Tables 30 and 31) ===
// The ranger soothes an animal; the ANIMAL saves vs. rods, and the ranger's
// experience level PENALISES that save. So a higher ranger level makes the
// animal MORE likely to fail, which is the ranger succeeding -- the sign is
// easy to get backwards.
//
// Not gated behind the PHBR11 toggle. The PHB grants rangers animal empathy but
// never quantifies it; the CRH is the only place the numbers appear, so this
// ADDS a rule rather than changing one, and added content does not get a
// toggle. Ungated for the same reason the Falconry proficiency is.
const ANIMAL_EMPATHY_LEVEL_MOD = [
  { max: 3,        mod: -1 },
  { max: 6,        mod: -2 },
  { max: 9,        mod: -3 },
  { max: 12,       mod: -4 },
  { max: 15,       mod: -5 },
  { max: Infinity, mod: -6 }
];

// Table 30, in the book's own order. `shift` marks the two the text calls out:
// an Indifferent animal moves to Cautious OR Friendly, and the ranger chooses
// the direction of the shift for everything else.
const ANIMAL_ATTITUDES = [
  { name: 'Frightened',  text: 'Filled with panic and terror. Will flee at the earliest opportunity.' },
  { name: 'Friendly',    text: 'Feels warm or conciliatory toward the stranger. Will not attack. May nuzzle or lick the stranger to express affection.' },
  { name: 'Indifferent', text: 'Bored or unimpressed. Oblivious to the stranger.' },
  { name: 'Cautious',    text: 'Suspicious, guarded, nervous. Ready to defend itself if attacked.' },
  { name: 'Threatening', text: 'Openly belligerent. Growling, snapping, crouched to spring. Likely to attack if the stranger doesn\u2019t withdraw.' },
  { name: 'Hostile',     text: 'Aggressive, violent, enraged. Will definitely attack if the stranger doesn\u2019t withdraw; may pursue even if he does.' }
];

// Null when the character is not a ranger, so the caller can hide the panel.
function getAnimalEmpathy(root) {
  const comp = (typeof getRangerComponent === 'function') ? getRangerComponent(root) : null;
  if (!comp || !comp.level) return null;
  const lvl = comp.level;
  const row = ANIMAL_EMPATHY_LEVEL_MOD.find(r => lvl <= r.max);
  return {
    level:   lvl,
    dormant: !!comp.dormant,
    mod:     row ? row.mod : 0
  };
}

// Aliases
CLASS_ABILITIES.warrior = CLASS_ABILITIES.fighter;
CLASS_ABILITIES.priest = CLASS_ABILITIES.cleric;
CLASS_ABILITIES.wizard = CLASS_ABILITIES.mage;
CLASS_ABILITIES.rogue = CLASS_ABILITIES.thief;
CLASS_ABILITIES.specialist = CLASS_ABILITIES.mage;

// === Turn Undead Table (AD&D 2e, PHB Table 61) ===
// Format: number = d20 roll needed, T = automatic turn, D = automatic
//   destruction, 'D*' = destruction AND an additional 2d4 creatures of this
//   type are turned on top of the usual 2d6, '-' = cannot affect at all.
// Keys are the book's TWELVE columns, not one per level. Use
// getTurnUndeadColumn() (defined below the table) to map a level to a column.
// === COVER AND CONCEALMENT (PHB Table 59, Ch.9) ===
//
// TWO COLUMNS, NOT ONE SCALE. COVER is hard -- stone walls, doors, tables, tree
// trunks, earth embankments, walls of force: something that will stop a missile.
// CONCEALMENT is soft -- bushes, curtains, tapestries, smoke, fog, brambles:
// "The bushes cannot stop an arrow, but they do make it less likely that the
// character is hit." Players conflate the two constantly.
//
// THE COVER COLUMN IS NOT LINEAR: -2, -4, -7, -10. Not -2/-4/-6/-8. Do not
// "regularise" it.
//
// WHAT THE NUMBER DOES -- and why most of this is not the sheet's business:
//   * It is a penalty to the ATTACKER'S ATTACK ROLL. It does NOT change the
//     defender's Armor Class. When a monster shoots at a PC in cover, the DM
//     applies it to his own roll and the character sheet is not involved.
//   * The same figure is a BONUS to the covered character's SAVING THROWS
//     against spells that cause physical damage (fireball, lightning bolt).
//
// So only two rolls here belong to the player: his own attack against a covered
// target, and his own saving throw while behind cover. Both are situational and
// applied by hand -- same treatment as the racial Surprise Bonus, which is
// reported and never added.
//
// SIGN: stored exactly as printed, which is correct in BOTH directions. A -2
// subtracts from the attacker's d20; and saves here are TARGET numbers where
// lower is better, so -2 improves a save too. Same agreement the Dexterity
// Defensive Adjustment has -- see §4, Chapter 11.
//
// NOT MODELLED: the 90%-cover damage rule (half damage on a failed save, none
// on a success, and only if the blast actually struck the cover). That is the
// DM deciding where a fireball went off, not character state.
const COVER_MODIFIERS = [
  { hidden: 25, cover: -2,  concealment: -1 },
  { hidden: 50, cover: -4,  concealment: -2 },
  { hidden: 75, cover: -7,  concealment: -3 },
  { hidden: 90, cover: -10, concealment: -4 }
];

const TURN_UNDEAD_TABLE = {
  1: { skeleton: 10, zombie: 13, ghoul: 16, shadow: 19, wight: 20, ghast: '-', wraith: '-', mummy: '-', spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  2: { skeleton: 7, zombie: 10, ghoul: 13, shadow: 16, wight: 19, ghast: 20, wraith: '-', mummy: '-', spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  3: { skeleton: 4, zombie: 7, ghoul: 10, shadow: 13, wight: 16, ghast: 19, wraith: 20, mummy: '-', spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  4: { skeleton: 'T', zombie: 4, ghoul: 7, shadow: 10, wight: 13, ghast: 16, wraith: 19, mummy: 20, spectre: '-', vampire: '-', ghost: '-', lich: '-', special: '-' },
  5: { skeleton: 'T', zombie: 'T', ghoul: 4, shadow: 7, wight: 10, ghast: 13, wraith: 16, mummy: 19, spectre: 20, vampire: '-', ghost: '-', lich: '-', special: '-' },
  6: { skeleton: 'D', zombie: 'T', ghoul: 'T', shadow: 4, wight: 7, ghast: 10, wraith: 13, mummy: 16, spectre: 19, vampire: 20, ghost: '-', lich: '-', special: '-' },
  7: { skeleton: 'D', zombie: 'D', ghoul: 'T', shadow: 'T', wight: 4, ghast: 7, wraith: 10, mummy: 13, spectre: 16, vampire: 19, ghost: 20, lich: '-', special: '-' },
  8: { skeleton: 'D*', zombie: 'D', ghoul: 'D', shadow: 'T', wight: 'T', ghast: 4, wraith: 7, mummy: 10, spectre: 13, vampire: 16, ghost: 19, lich: 20, special: '-' },
  9: { skeleton: 'D*', zombie: 'D*', ghoul: 'D', shadow: 'D', wight: 'T', ghast: 'T', wraith: 4, mummy: 7, spectre: 10, vampire: 13, ghost: 16, lich: 19, special: 20 },
  '10-11': { skeleton: 'D*', zombie: 'D*', ghoul: 'D*', shadow: 'D', wight: 'D', ghast: 'T', wraith: 'T', mummy: 4, spectre: 7, vampire: 10, ghost: 13, lich: 16, special: 19 },
  '12-13': { skeleton: 'D*', zombie: 'D*', ghoul: 'D*', shadow: 'D*', wight: 'D', ghast: 'D', wraith: 'T', mummy: 'T', spectre: 4, vampire: 7, ghost: 10, lich: 13, special: 16 },
  '14+': { skeleton: 'D*', zombie: 'D*', ghoul: 'D*', shadow: 'D*', wight: 'D*', ghast: 'D', wraith: 'D', mummy: 'T', spectre: 'T', vampire: 4, ghost: 7, lich: 10, special: 13 }
};

// PHB Table 61 does NOT have twenty level columns. It has twelve:
//   1  2  3  4  5  6  7  8  9  10-11  12-13  14+
// The three highest are BANDS, and 14+ is the ceiling -- at any level from 14
// upward a lich is turned on a 10 and a Special on a 13, forever. The old
// one-column-per-level layout silently handed an 11th-level priest the 12-13
// results and a 12th-level priest the 14+ results, then invented ever-better
// columns above that until an 18th-level priest was auto-destroying liches,
// which the book never grants at any level.
function getTurnUndeadColumn(level) {
  const l = parseInt(level, 10);
  if (!l || l < 1) return null;
  if (l <= 9)  return TURN_UNDEAD_TABLE[l] || null;
  if (l <= 11) return TURN_UNDEAD_TABLE['10-11'] || null;
  if (l <= 13) return TURN_UNDEAD_TABLE['12-13'] || null;
  return TURN_UNDEAD_TABLE['14+'] || null;
}

// PHB Table 61 row labels, transcribed from the printed table. `hd` is the Hit
// Dice the row covers -- it is how a DM resolves an undead the table does not
// name by species. Five rows were previously off by one (Wight 4, Wraith 5,
// Mummy 6, Spectre 7, Vampire 8), so a party facing a 5 HD undead was reading
// the Shadow row instead of the Wight row.
//
// Zombie, Ghast and Special carry NO Hit Dice in the book. They are named
// exceptions sitting between the numbered bands, so a 2 HD undead uses GHOUL
// and a 4 HD undead uses SHADOW -- never Zombie or Ghast. Inventing a figure
// for them makes an exception look like the general case.
const TURN_UNDEAD_TYPES = [
  { key: 'skeleton', name: 'Skeleton', hd: 1,    hdLabel: '1 HD' },
  { key: 'zombie',   name: 'Zombie',   hd: null, hdLabel: '' },
  { key: 'ghoul',    name: 'Ghoul',    hd: 2,    hdLabel: '2 HD' },
  { key: 'shadow',   name: 'Shadow',   hd: 3,    hdLabel: '3-4 HD' },
  { key: 'wight',    name: 'Wight',    hd: 5,    hdLabel: '5 HD' },
  { key: 'ghast',    name: 'Ghast',    hd: null, hdLabel: '' },
  { key: 'wraith',   name: 'Wraith',   hd: 6,    hdLabel: '6 HD' },
  { key: 'mummy',    name: 'Mummy',    hd: 7,    hdLabel: '7 HD' },
  { key: 'spectre',  name: 'Spectre',  hd: 8,    hdLabel: '8 HD' },
  { key: 'vampire',  name: 'Vampire',  hd: 9,    hdLabel: '9 HD' },
  { key: 'ghost',    name: 'Ghost',    hd: 10,   hdLabel: '10 HD' },
  { key: 'lich',     name: 'Lich',     hd: 11,   hdLabel: '11+ HD' },
  { key: 'special',  name: 'Special',  hd: null, hdLabel: '' }
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

// === Weapon types (granular) ===
//
// THE ANCHOR, same principle as ARMOR_TYPES: the stored weapon type key is the
// source of truth for what a weapon IS. core_wp.json holds what it DOES.
//
// Historically core_wp.json's Type and Group columns were pure duplicates --
// all 77 rows had Type === Group -- so one column was doing no work. This table
// takes the granular axis: GROUP stays coarse (the 21 values below, used for
// related-weapon fallback and PHB Table 35 column selection) while the KEY is
// per specific weapon, because 2e specialization is declared on one weapon --
// a long sword, not "swords" -- and Group cannot answer that (Sword covers 11
// weapons, Polearm 18, Dagger 7).
//
// DELIBERATELY NOT STORED HERE: damage, speed, size, range, weight, cost.
// Those are STATISTICS and live in core_wp.json; wpName points at the canonical
// row and getWeaponTypeStats() reads them live. Only CLASSIFICATION is stored,
// so the two can never drift apart. This is also what lets a flavour-named
// weapon work: "Moon Hunter" tagged sword_long resolves Size M and 1d8/1d12.
//
// label is display only -- nothing parses it, so relabelling can never break a
// rule. Change a label freely; never change a key, or saved records orphan.
const WEAPON_TYPES = {
  // --- Supplement weapons (PHBR1, PHBR11) ---
  // A weapon in core_wp.json with NO entry here loses its mechanical identity
  // silently. inferWeaponTypeKey is built ENTIRELY from this object, so without
  // a key: getWeaponSpecialization bails at `if (!wtype) return null` and the
  // weapon can never be specialized; resolveWeaponProficiency cannot canonicalise
  // it, so PHBR1_SAME_PROFICIENCY and PHBR1_RELATED_WEAPONS cannot fire on it;
  // and getTwoHanderStyleEffect cannot read its inherent grip. The only visible
  // symptom is a Type dropdown showing an em-dash.
  //
  // Rapier, Sabre and Main-Gauche are all named in PHBR1_RELATED_WEAPONS, so
  // that relation table was PARTLY DEAD from the day it was written -- the
  // swashbuckler pairings had no type key to resolve through.
  //
  // ADDING A WEAPON TO core_wp.json IS HALF THE JOB. It needs an entry here too.
  // Generated from core_wp.json's own Group and Category so the two cannot
  // disagree; keys and display names were both checked against the existing 89.
  // PHBR1 p.101 primitive weapons. THESE SIX WERE MISSING and the omission was
  // silent, exactly as the header above warns. inferWeaponTypeKey substring-
  // matched "Dagger, Stone" to plain `dagger`, canonicalWeaponName then rewrote
  // the name to "Dagger", and every rule keyed on the record's own identity
  // looked up the wrong weapon: no shatter rule, no specialization, no
  // same-proficiency or related resolution, and no inherent GRIP -- which the
  // grip tooltip names "stone javelin, stone spear" among the ten weapons that
  // care about it. Found when the shatter note appeared on lances and not on
  // stone daggers; the lances had entries and these did not.
  //
  // Group and category mirror core_wp.json so the two cannot disagree.
  dagger_stone:            { label: 'Stone Dagger',          group: 'Dagger',    category: 'Melee/Thrown',  wpName: "Dagger, Stone" },
  dagger_bone:             { label: 'Bone Dagger',           group: 'Dagger',    category: 'Melee/Thrown',  wpName: "Dagger, Bone" },
  dagger_knife_stone:      { label: 'Stone Knife',           group: 'Dagger',    category: 'Melee/Thrown',  wpName: "Knife, Stone" },
  dagger_knife_bone:       { label: 'Bone Knife',            group: 'Dagger',    category: 'Melee/Thrown',  wpName: "Knife, Bone" },
  spear_javelin_stone:     { label: 'Stone Javelin',         group: 'Spear',     category: 'Thrown',        wpName: "Javelin, Stone" },
  spear_stone:             { label: 'Stone Spear',           group: 'Spear',     category: 'Melee/Thrown',  wpName: "Spear, Stone" },

  belaying_pin:            { label: 'Belaying Pin',          group: 'Club',      category: 'Melee',         wpName: "Belaying Pin" },
  flail_grain:             { label: 'Grain Flail',           group: 'Flail',     category: 'Melee',         wpName: "Flail, Grain" },
  gaff_attached:           { label: 'Gaff/Hook (Attached)',  group: 'Dagger',    category: 'Melee',         wpName: "Gaff/Hook, Attached" },
  gaff_held:               { label: 'Gaff/Hook (Held)',      group: 'Dagger',    category: 'Melee',         wpName: "Gaff/Hook, Held" },
  hatchet:                 { label: 'Hatchet',               group: 'Axe',       category: 'Melee',         wpName: "Hatchet" },
  ice_pick:                { label: 'Ice Pick',              group: 'Pick',      category: 'Melee',         wpName: "Ice Pick" },
  machete:                 { label: 'Machete',               group: 'Sword',     category: 'Melee',         wpName: "Machete" },
  main_gauche:             { label: 'Main-Gauche',           group: 'Dagger',    category: 'Melee',         wpName: "Main-Gauche" },
  rapier:                  { label: 'Rapier',                group: 'Sword',     category: 'Melee',         wpName: "Rapier" },
  ritiik:                  { label: 'Ritiik',                group: 'Spear',     category: 'Melee',         wpName: "Ritiik" },
  sabre:                   { label: 'Sabre',                 group: 'Sword',     category: 'Melee',         wpName: "Sabre" },
  snow_blade:              { label: 'Snow Blade (Iuak)',     group: 'Sword',     category: 'Melee',         wpName: "Snow Blade (Iuak)" },

  // --- Sword ---
  sword_bastard:           { label: 'Bastard Sword',       group: 'Sword',     category: 'Melee',         wpName: "Sword, Bastard" },
  sword_broad:             { label: 'Broad Sword',         group: 'Sword',     category: 'Melee',         wpName: "Sword, Broad" },
  sword_cutlass:           { label: 'Cutlass',             group: 'Sword',     category: 'Melee',         wpName: "Cutlass" },
  sword_falchion:          { label: 'Falchion',            group: 'Sword',     category: 'Melee',         wpName: "Falchion" },
  sword_katana:            { label: 'Katana',              group: 'Sword',     category: 'Melee',         wpName: "Katana" },
  sword_khopesh:           { label: 'Khopesh',             group: 'Sword',     category: 'Melee',         wpName: "Sword, Khopesh" },
  sword_long:              { label: 'Long Sword',          group: 'Sword',     category: 'Melee',         wpName: "Sword, Long" },
  sword_scimitar:          { label: 'Scimitar',            group: 'Sword',     category: 'Melee',         wpName: "Scimitar" },
  sword_drusus:            { label: 'Drusus',              group: 'Sword',     category: 'Melee',         wpName: "Drusus" },
  sword_short:             { label: 'Short Sword',         group: 'Sword',     category: 'Melee',         wpName: "Sword, Short" },
  sword_two_handed:        { label: 'Two-Handed Sword',    group: 'Sword',     category: 'Melee',         wpName: "Sword, Two-Handed" },
  sword_wakizashi:         { label: 'Wakizashi',           group: 'Sword',     category: 'Melee',         wpName: "Wakizashi" },
  // --- Dagger ---
  dagger:                  { label: 'Dagger',              group: 'Dagger',    category: 'Melee/Thrown',  wpName: "Dagger" },
  dagger_dirk:             { label: 'Dirk',                group: 'Dagger',    category: 'Melee',         wpName: "Dirk" },
  dagger_kama:             { label: 'Kama',                group: 'Dagger',    category: 'Melee',         wpName: "Kama" },
  dagger_knife:            { label: 'Knife',               group: 'Dagger',    category: 'Melee/Thrown',  wpName: "Knife" },
  dagger_sai:              { label: 'Sai',                 group: 'Dagger',    category: 'Melee',         wpName: "Sai" },
  dagger_sickle:           { label: 'Sickle',              group: 'Dagger',    category: 'Melee',         wpName: "Sickle" },
  dagger_stiletto:         { label: 'Stiletto',            group: 'Dagger',    category: 'Melee',         wpName: "Stiletto" },
  // --- Axe ---
  axe_battle:              { label: 'Battle Axe',          group: 'Axe',       category: 'Melee',         wpName: "Battle Axe" },
  axe_hand:                { label: 'Hand Axe',            group: 'Axe',       category: 'Melee/Thrown',  wpName: "Hand Axe" },
  // --- Club ---
  cestus:                  { label: 'Cestus',              group: 'Club',      category: 'Melee',         wpName: "Cestus" },
  club:                    { label: 'Club',                group: 'Club',      category: 'Melee',         wpName: "Club" },
  // --- Flail ---
  chain:                   { label: 'Chain',               group: 'Flail',     category: 'Melee',         wpName: "Chain" },
  flail_footmans:          { label: 'Footman\'s Flail',    group: 'Flail',     category: 'Melee',         wpName: "Flail, Footman's" },
  flail_horsemans:         { label: 'Horseman\'s Flail',   group: 'Flail',     category: 'Melee',         wpName: "Flail, Horseman's" },
  flail_nunchaku:          { label: 'Nunchaku',            group: 'Flail',     category: 'Melee',         wpName: "Nunchaku" },
  flail_scourge:           { label: 'Scourge',             group: 'Flail',     category: 'Melee',         wpName: "Scourge" },
  flail_three_section:     { label: 'Three-Section Staff', group: 'Flail',     category: 'Melee',         wpName: "Three-Section Staff" },
  // --- Hammer ---
  hammer:                  { label: 'Hammer',              group: 'Hammer',    category: 'Melee/Thrown',  wpName: "Hammer" },
  hammer_maul:             { label: 'Maul',                group: 'Hammer',    category: 'Melee',         wpName: "Maul" },
  hammer_war:              { label: 'War Hammer',          group: 'Hammer',    category: 'Melee',         wpName: "War Hammer" },
  // --- Mace ---
  mace_footmans:           { label: 'Footman\'s Mace',     group: 'Mace',      category: 'Melee',         wpName: "Mace, Footman's" },
  mace_horsemans:          { label: 'Horseman\'s Mace',    group: 'Mace',      category: 'Melee',         wpName: "Mace, Horseman's" },
  mace_morning_star:       { label: 'Morning Star',        group: 'Mace',      category: 'Melee',         wpName: "Morning Star" },
  // --- Pick ---
  // --- Pick ---
  // KEY DELIBERATELY LEFT AS pick_military. The key is what a weapon card
  // STORES, so renaming it would orphan every existing record; only the label
  // and the wpName pointer change. Nothing parses the label, which is exactly
  // why keys and labels are kept separate.
  pick_military:           { label: 'Footman\'s Pick',     group: 'Pick',      category: 'Melee',         wpName: "Pick, Footman's" },
  pick_horsemans:          { label: 'Horseman\'s Pick',    group: 'Pick',      category: 'Melee',         wpName: "Pick, Horseman's" },
  // --- Polearm ---
  polearm_bardiche:        { label: 'Bardiche',            group: 'Polearm',   category: 'Melee',         wpName: "Bardiche" },
  polearm_bec_de_corbin:   { label: 'Bec de Corbin',       group: 'Polearm',   category: 'Melee',         wpName: "Bec de Corbin" },
  polearm_bill_guisarme:   { label: 'Bill-Guisarme',       group: 'Polearm',   category: 'Melee',         wpName: "Bill-Guisarme" },
  polearm_fauchard:        { label: 'Fauchard',            group: 'Polearm',   category: 'Melee',         wpName: "Fauchard" },
  polearm_fauchard_fork:   { label: 'Fauchard-Fork',       group: 'Polearm',   category: 'Melee',         wpName: "Fauchard-Fork" },
  polearm_fork_military:   { label: 'Military Fork',       group: 'Polearm',   category: 'Melee',         wpName: "Fork, Military" },
  polearm_glaive:          { label: 'Glaive',              group: 'Polearm',   category: 'Melee',         wpName: "Glaive" },
  polearm_glaive_guisarme: { label: 'Glaive-Guisarme',     group: 'Polearm',   category: 'Melee',         wpName: "Glaive-Guisarme" },
  polearm_guisarme:        { label: 'Guisarme',            group: 'Polearm',   category: 'Melee',         wpName: "Guisarme" },
  polearm_guisarme_voulge: { label: 'Guisarme-Voulge',     group: 'Polearm',   category: 'Melee',         wpName: "Guisarme-Voulge" },
  polearm_halberd:         { label: 'Halberd',             group: 'Polearm',   category: 'Melee',         wpName: "Halberd" },
  polearm_naginata:        { label: 'Naginata',            group: 'Polearm',   category: 'Melee',         wpName: "Naginata" },
  polearm_tetsubo:         { label: 'Tetsubo',             group: 'Polearm',   category: 'Melee',         wpName: "Tetsubo" },
  polearm_hook_fauchard:   { label: 'Hook Fauchard',       group: 'Polearm',   category: 'Melee',         wpName: "Hook Fauchard" },
  polearm_lucern_hammer:   { label: 'Lucern Hammer',       group: 'Polearm',   category: 'Melee',         wpName: "Lucern Hammer" },
  polearm_mancatcher:      { label: 'Mancatcher',          group: 'Polearm',   category: 'Melee',         wpName: "Mancatcher" },
  polearm_partisan:        { label: 'Partisan',            group: 'Polearm',   category: 'Melee',         wpName: "Partisan" },
  polearm_pike_awl:        { label: 'Awl Pike',            group: 'Polearm',   category: 'Melee',         wpName: "Pike, Awl" },
  polearm_ranseur:         { label: 'Ranseur',             group: 'Polearm',   category: 'Melee',         wpName: "Ranseur" },
  polearm_scythe:          { label: 'Scythe',              group: 'Polearm',   category: 'Melee',         wpName: "Scythe" },
  polearm_spetum:          { label: 'Spetum',              group: 'Polearm',   category: 'Melee',         wpName: "Spetum" },
  polearm_voulge:          { label: 'Voulge',              group: 'Polearm',   category: 'Melee',         wpName: "Voulge" },
  // --- Spear ---
  spear:                   { label: 'Spear',               group: 'Spear',     category: 'Melee/Thrown',  wpName: "Spear" },
  spear_harpoon:           { label: 'Harpoon',             group: 'Spear',     category: 'Melee/Thrown',  wpName: "Harpoon" },
  spear_javelin:           { label: 'Javelin',             group: 'Spear',     category: 'Thrown',        wpName: "Javelin" },
  spear_pilum:             { label: 'Pilum',               group: 'Spear',     category: 'Thrown',        wpName: "Pilum" },
  spear_trident:           { label: 'Trident',             group: 'Spear',     category: 'Melee/Thrown',  wpName: "Trident" },
  // --- Lance ---
  lance_heavy:             { label: 'Heavy Lance',         group: 'Lance',     category: 'Melee',         wpName: "Lance, Heavy" },
  lance_jousting:          { label: 'Jousting Lance',      group: 'Lance',     category: 'Melee',         wpName: "Lance, Jousting" },
  lance_light:             { label: 'Light Lance',         group: 'Lance',     category: 'Melee',         wpName: "Lance, Light" },
  lance_medium:            { label: 'Medium Lance',        group: 'Lance',     category: 'Melee',         wpName: "Lance, Medium" },
  // --- Staff ---
  staff_bo:                { label: 'Bo Stick',            group: 'Staff',     category: 'Melee',         wpName: "Bo Stick" },
  staff_quarterstaff:      { label: 'Quarterstaff',        group: 'Staff',     category: 'Melee',         wpName: "Quarterstaff" },
  // --- Whip ---
  whip:                    { label: 'Whip',                group: 'Whip',      category: 'Melee',         wpName: "Whip" },
  // --- Net ---
  lasso:                   { label: 'Lasso',               group: 'Net',       category: 'Melee',         wpName: "Lasso" },
  net:                     { label: 'Net',                 group: 'Net',       category: 'Thrown',        wpName: "Net" },
  // --- Bola ---
  bola:                    { label: 'Bola',                group: 'Bola',      category: 'Thrown',        wpName: "Bola" },
  // --- Bow ---
  bow_composite_long:      { label: 'Composite Long Bow',  group: 'Bow',       category: 'Ranged',        wpName: "Composite Long Bow" },
  bow_composite_short:     { label: 'Composite Short Bow', group: 'Bow',       category: 'Ranged',        wpName: "Composite Short Bow" },
  bow_long:                { label: 'Long Bow',            group: 'Bow',       category: 'Ranged',        wpName: "Long Bow" },
  bow_daikyu:              { label: 'Daikyu',              group: 'Bow',       category: 'Ranged',        wpName: "Daikyu" },
  bow_short:               { label: 'Short Bow',           group: 'Bow',       category: 'Ranged',        wpName: "Short Bow" },
  // --- Crossbow ---
  crossbow_hand:           { label: 'Hand Crossbow',       group: 'Crossbow',  category: 'Ranged',        wpName: "Hand Crossbow" },
  crossbow_heavy:          { label: 'Heavy Crossbow',      group: 'Crossbow',  category: 'Ranged',        wpName: "Heavy Crossbow" },
  crossbow_light:          { label: 'Light Crossbow',      group: 'Crossbow',  category: 'Ranged',        wpName: "Light Crossbow" },
  // --- Sling ---
  sling:                   { label: 'Sling',               group: 'Sling',     category: 'Ranged',        wpName: "Sling" },
  sling_staff:             { label: 'Staff Sling',         group: 'Sling',     category: 'Ranged',        wpName: "Staff Sling" },
  // --- Dart ---
  dart:                    { label: 'Dart',                group: 'Dart',      category: 'Thrown',        wpName: "Dart" },
  dart_shuriken:           { label: 'Shuriken',            group: 'Dart',      category: 'Thrown',        wpName: "Shuriken" },
  // --- Blowgun ---
  blowgun:                 { label: 'Blowgun',             group: 'Blowgun',   category: 'Ranged',        wpName: "Blowgun" },
  // --- Firearm ---
  firearm_arquebus:        { label: 'Arquebus',            group: 'Firearm',   category: 'Ranged',        wpName: "Arquebus" },
  firearm_blunderbuss:     { label: 'Blunderbuss',         group: 'Firearm',   category: 'Ranged',        wpName: "Blunderbuss" }
};

// Display order for the type dropdown's optgroups. Melee first, then reach,
// then missile -- roughly how a player thinks about picking a weapon, and it
// keeps the eleven swords at the top where they are looked for most.
const WEAPON_GROUP_ORDER = [
  'Sword', 'Dagger', 'Axe', 'Club', 'Flail', 'Hammer', 'Mace', 'Pick',
  'Polearm', 'Spear', 'Lance', 'Staff', 'Whip', 'Net', 'Bola',
  'Bow', 'Crossbow', 'Sling', 'Dart', 'Blowgun', 'Firearm'
];

function getWeaponTypeData(key) {
  if (!key) return null;
  return WEAPON_TYPES[key] || null;
}

// The core_wp.json row a type key points at -- damage, speed, size, range,
// weight, cost. Returns null until WEAPONS_DATA has loaded, so callers must
// tolerate that (this is the same async caveat lookupWeaponData already has).
function getWeaponTypeStats(key) {
  const t = getWeaponTypeData(key);
  if (!t) return null;
  return lookupWeaponData(t.wpName);
}

// The coarse Group for a weapon. Prefers the stored type key; falls back to
// whatever coarse value a pre-dropdown record carried, so nothing regresses
// before the migration has touched a character.
function getWeaponGroup(typeKey, fallbackGroup) {
  const t = getWeaponTypeData(typeKey);
  if (t) return t.group;
  return (fallbackGroup || '').trim();
}

// --- Name inference (migration fallback only) -------------------------------
//
// Used ONLY to seed a type on records saved before the dropdown existed, and to
// prefill when the player types a recognised name. Once weaponTypeKey is set,
// the stored value always wins.
//
// Built from the table rather than hand-ordered like ARMOR_NAME_INFERENCE,
// because 77 weapons is too many to order reliably by hand. Two safeguards:
//   1. LONGEST FIRST, so "Composite Long Bow" cannot be eaten by "Long Bow",
//      "Long Bow" cannot be eaten by "Bow", "War Hammer" by "Hammer",
//      "Staff Sling" by "Sling", or "Three-Section Staff" by "Staff".
//   2. WORD BOUNDARIES, not raw substring. Short names would otherwise produce
//      nonsense: "Net" would match "bayonet", "Sai" would match "corsair",
//      "Dart" would match "Dartmoor Pike". \b stops all three.
// Both the canonical name and the label are matchable, so "Sword, Long" and
// "Long Sword" both resolve.
let _weaponInferenceList = null;
function buildWeaponInferenceList() {
  const out = [];
  Object.keys(WEAPON_TYPES).forEach(key => {
    const t = WEAPON_TYPES[key];
    [t.wpName, t.label].forEach(n => {
      const s = (n || '').trim().toLowerCase();
      if (s && !out.some(e => e.text === s)) out.push({ text: s, key: key });
    });
  });
  out.sort((a, b) => b.text.length - a.text.length);
  out.forEach(e => {
    e.re = new RegExp('\\b' + e.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  });
  return out;
}

function inferWeaponTypeKey(name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return '';
  if (!_weaponInferenceList) _weaponInferenceList = buildWeaponInferenceList();
  const exact = _weaponInferenceList.find(e => e.text === n);
  if (exact) return exact.key;
  const hit = _weaponInferenceList.find(e => e.re.test(n));
  return hit ? hit.key : '';
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
  // multi-class strings survive, and are rejoined WITH spaces to match what
  // formatMultiClassDisplay and formatDualClassDisplay put in the `clazz`
  // field: "Ranger 5 / Necromancer 6" must print as it appears on screen.
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
    .join(" / ");
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
  ["Harpoon", "Spear", "Trident", "Javelin"],
  // PHB lumps all of these into ONE related set, where core_wp.json splits them
  // across the Mace / Flail / Hammer / Club groups. The book wins.
  ["Mace, Footman's", "Mace, Horseman's", "Morning Star",
   "Flail, Footman's", "Flail, Horseman's", "Hammer", "War Hammer", "Club"],
  ["Fork, Military", "Ranseur", "Spetum", "Partisan"],
  ["Scimitar", "Sword, Bastard", "Sword, Long", "Sword, Broad"],
  ["Sling", "Staff Sling"]
];

// === PHBR1 proficiency relationships (Complete Fighter's Handbook, Ch.5) ======
//
// PHBR1 states relationships PER WEAPON, in prose, where the PHB states them as
// symmetric sets. It means three different things, and they are kept apart:
//
//   SAME               One proficiency covers both weapons. NOT the half
//                      penalty -- full proficiency, no penalty, and
//                      specialization transfers.
//   RELATED            The ordinary half-penalty relationship, extended to
//                      weapons the PHB never mentions.
//   RELATED TO GROUP   "related to all other polearms" / "related to but not
//                      identical to other bow proficiencies". Stored as the RULE
//                      rather than resolved to names: the weapon list is open,
//                      so a resolved list silently goes stale as books are
//                      audited. (Alignment and terrain resolve; weapons do not.)
//   UNRELATED          The book says outright the weapon is related to NOTHING.
//                      This is a positive statement and must BEAT the Group
//                      fallback, which would otherwise relate shuriken to darts
//                      because both carry Group "Dart".
//
// KEPT OUT OF PHB_RELATED_WEAPONS ON PURPOSE. That constant is the PHB's own
// list, transcribed verbatim; folding a supplement into it would make the data
// claim the PHB says something it does not -- the same reason demiRanger is kept
// out of `race` in kits.js.
//
// NO TOGGLE. Nothing here overrides a PHB statement: the PHB is silent on every
// weapon involved. What it displaces is the unsourced core_wp.json Group
// fallback -- house inference giving way to a printed rule.
//
// Verified August 2026 against 23 relationships the book states outright: 13 were
// wrong before this change, 0 after, with six PHB-only pairs unchanged.

const PHBR1_SAME_PROFICIENCY = [
  ["Stiletto", "Knife"],         // p.104: Knife proficiency IS Stiletto proficiency
  ["Bo Stick", "Quarterstaff"],  // p.100-101: "shares a proficiency with Quarterstaff"
  ["Drusus", "Sword, Short"],    // p.98: same proficiency; specialization transfers
  // pp.59-60 print "Dagger/Dirk" in the same slash form as the three above,
  // across Fencing Blades, Short Blades and Small Throwing Weapons. PHB Table 44
  // independently prints "Dagger or dirk" as a SINGLE ROW. Two weapons, one
  // proficiency -- they are not one weapon under two names, since Dagger is
  // Melee/Thrown and Dirk is Melee only.
  ["Dirk", "Dagger"]
];

const PHBR1_RELATED_WEAPONS = [
  ["Cutlass", "Sword, Short", "Dagger", "Dirk", "Knife", "Stiletto", "Main-Gauche"],
  ["Belaying Pin", "Club", "Mace, Footman's", "Mace, Horseman's"],
  ["Rapier", "Sabre"],           // p.104: explicitly NOT long sword or its relations
  ["Main-Gauche", "Dagger", "Dirk"],
  ["Katana", "Sword, Bastard", "Sword, Long"],
  ["Wakizashi", "Sword, Short"]
];

const PHBR1_RELATED_TO_GROUP = {
  "Naginata": "Polearm",
  "Tetsubo":  "Polearm",
  "Daikyu":   "Bow"
};

// PHBR1 p.60 Non-Groups: "none of these is similar in use to any other weapon.
// When a character picks one up and uses it without being proficient in it
// already, he suffers the full penalty." That is a statement about THIS rule --
// full penalty versus half -- so the list belongs here.
//
// BLOWGUN AND QUARTERSTAFF ARE INERT TODAY and are recorded anyway. Blowgun is
// the sole member of its Group, and Quarterstaff shares Staff only with Bo
// Stick, which is its same-proficiency pair and resolves as fully proficient one
// step earlier. Neither can reach the Group fallback. They are here so that a
// later book adding a second blowgun or a third staff weapon does not silently
// relate them -- which is precisely the drift the fallback gets wrong.
//
// ARQUEBUS IS DELIBERATELY ABSENT, and this is the one entry with a live
// consequence. It shares Group "Firearm" with Blunderbuss, so adding it would
// break that pairing. Blunderbuss is Unattributed and is not in PHBR1's
// Non-Groups list because PHBR1 does not know it exists; the book's "similar to
// no other weapon" was written about a world containing an arquebus and no
// blunderbuss, so reading it as a bar on that pair extends the statement past
// its evidence. Two firearms relating to each other is a house inference PHBR1
// was not ruling on.
//
// It also matters that this list is UNGATED. Its justification is that every
// pairing it affects involves a weapon the PHB does not print -- and Arquebus,
// Blowgun and Quarterstaff are all PHB weapons. The two added above cannot
// change any outcome, so the rationale survives; Arquebus would break it.
const PHBR1_UNRELATED = [
  "Bola", "Cestus", "Chain", "Gaff/Hook, Attached", "Gaff/Hook, Held",
  "Lasso", "Net", "Nunchaku", "Sai", "Shuriken",
  "Blowgun", "Quarterstaff"
];

// Every PHBR1 set a weapon belongs to. An array, not a single set: main-gauche
// and stiletto each appear in two.
function getPHBR1RelatedSets(weaponName) {
  const n = (weaponName || "").trim().toLowerCase();
  if (!n) return [];
  return PHBR1_RELATED_WEAPONS.filter(set =>
    set.some(w => w.toLowerCase() === n)
  );
}

function isPHBR1Unrelated(weaponName) {
  const n = (weaponName || "").trim().toLowerCase();
  if (!n) return false;
  return PHBR1_UNRELATED.some(w => w.toLowerCase() === n);
}

// === PHBR1 weapon groups (pp.58-60) — TIGHT, BROAD and NON-GROUP ===
//
// A FOURTH THING CALLED A WEAPON GROUP, and the one that finally breaks the
// pattern. WEAPON_GROUP_ORDER's 21 values are a PARTITION -- every weapon has
// exactly one Group. These OVERLAP: Dagger is in Fencing Blades, Short Blades,
// Blades and Small Throwing Weapons, all at once. So this can never be a field
// on a weapon record; it has to be a registry read the other way round.
//
// Buying a group grants proficiency in EVERY weapon in it, with no unfamiliarity
// penalty. Tight costs 2 slots, broad costs 3.
//
// TIGHT MAY BE USED AS RELATED GROUPS; BROAD MAY NOT. The book says both, in
// opposite directions, one page apart. p.59: "your DM can, if he wishes, use
// these categories as related groups." p.60, of the broad groups: "These groups
// may not be used to calculate weapon similarity for determining whether a
// character receives the full or partial attack penalty." The first is a DM
// OPTION and ships as an optional rule defaulting OFF; the second is a
// prohibition and is simply never consulted for similarity.
//
// YOU CAN NEVER SPECIALIZE IN A GROUP (p.60). Group proficiency DOES satisfy the
// "already proficient" prerequisite -- the book's worked example has a 1st-level
// warrior spend 3 slots on Blades and his 4th specializing Long Sword -- but the
// specialization itself is always in ONE weapon at the normal cost.
//
// SLASH-JOINED ENTRIES ARE ONE PROFICIENCY, NOT TWO. The book prints
// "Dagger/Dirk", "Knife/Stiletto", "Short sword/Drusus" and "Quarterstaff/Bo
// stick"; all four are in PHBR1_SAME_PROFICIENCY. Only the first name of each
// pair is listed below -- the pair table supplies the other. So Fencing Blades
// offers FIVE specializations, not seven.
//
// Names are core_wp.json `Weapon Name` values, not the book's phrasing, and all
// 140 were validated against it. The book writes "Long spear"; the record is
// "Spear, Long".
const PHBR1_TIGHT_GROUPS = {
  'Axes':             ["Battle Axe", "Hand Axe"],
  'Bows':             ["Composite Long Bow", "Composite Short Bow", "Daikyu",
                       "Long Bow", "Short Bow"],
  'Clubbing Weapons': ["Belaying Pin", "Club", "Mace, Footman's",
                       "Mace, Horseman's", "Morning Star", "War Hammer"],
  'Crossbows':        ["Hand Crossbow", "Heavy Crossbow", "Light Crossbow"],
  'Fencing Blades':   ["Dagger", "Knife", "Main-Gauche", "Rapier", "Sabre"],
  'Flails':           ["Flail, Footman's", "Flail, Horseman's"],
  'Lances':           ["Lance, Heavy", "Lance, Light", "Lance, Jousting",
                       "Lance, Medium"],
  'Long Blades':      ["Sword, Bastard", "Katana", "Sword, Long", "Scimitar",
                       "Sword, Two-Handed"],
  'Medium Blades':    ["Cutlass", "Sword, Khopesh", "Wakizashi"],
  'Picks':            ["Pick, Footman's", "Pick, Horseman's"],
  'Polearms':         ["Pike, Awl", "Bardiche", "Bec de Corbin", "Bill-Guisarme",
                       "Fauchard", "Fauchard-Fork", "Glaive", "Glaive-Guisarme",
                       "Guisarme", "Guisarme-Voulge", "Halberd", "Hook Fauchard",
                       "Lucern Hammer", "Mancatcher", "Fork, Military",
                       "Naginata", "Partisan", "Ranseur", "Spetum", "Tetsubo",
                       "Voulge"],
  'Short Blades':     ["Dagger", "Knife", "Main-Gauche", "Sword, Short"],
  'Sickles':          ["Sickle", "Scythe"],
  'Slings':           ["Sling", "Staff Sling"],
  'Spears':           ["Harpoon", "Javelin", "Spear, Long", "Spear", "Trident"],
  'Whips':            ["Scourge", "Whip"]
};

// p.60. Note Sickle and Scythe appear here as POLE WEAPONS as well as forming
// their own tight group -- the book files them both ways and so do we.
const PHBR1_BROAD_GROUPS = {
  'Blades':                 ["Sword, Bastard", "Cutlass", "Dagger", "Katana",
                             "Sword, Khopesh", "Knife", "Sword, Long",
                             "Main-Gauche", "Rapier", "Sabre", "Scimitar",
                             "Sword, Short", "Sword, Two-Handed", "Wakizashi"],
  'Cleaving/Crushing Weapons': ["Battle Axe", "Belaying Pin", "Club",
                             "Mace, Footman's", "Pick, Footman's", "Hand Axe",
                             "Mace, Horseman's", "Pick, Horseman's",
                             "Morning Star", "War Hammer"],
  'Pole Weapons':           ["Pike, Awl", "Bardiche", "Bec de Corbin",
                             "Bill-Guisarme", "Fauchard", "Fauchard-Fork",
                             "Glaive", "Glaive-Guisarme", "Guisarme",
                             "Guisarme-Voulge", "Halberd", "Harpoon",
                             "Hook Fauchard", "Javelin", "Lucern Hammer",
                             "Spear, Long", "Mancatcher", "Fork, Military",
                             "Naginata", "Partisan", "Ranseur", "Sickle",
                             "Scythe", "Spear", "Spetum", "Tetsubo", "Trident",
                             "Voulge"],
  'Small Throwing Weapons': ["Dagger", "Dart", "Hand Axe", "Knife", "Shuriken"]
};

// p.60: "the following weapons do not belong in any sort of group whatsoever...
// none of these is similar in use to any other weapon."
//
// DELIBERATELY NOT MERGED WITH PHBR1_UNRELATED, which they overlap but do not
// match. That list answers the RELATED-WEAPON half-penalty question and holds
// Cestus and Shuriken; this one answers the GROUP-PROFICIENCY question and holds
// neither -- the cestus because it needs no proficiency at all, and the shuriken
// because it IS in a broad group. Both can be true at once precisely because
// broad groups may not be read as similarity. Two questions, two lists.
const PHBR1_NON_GROUP_WEAPONS = [
  "Arquebus", "Blowgun", "Bola", "Chain", "Gaff/Hook, Held",
  "Gaff/Hook, Attached", "Lasso", "Net", "Quarterstaff", "Nunchaku", "Sai"
];

const PHBR1_GROUP_SLOT_COST = { tight: 2, broad: 3 };

// Every group a weapon belongs to. Returns [{ name, tier }], possibly several --
// Dagger comes back with four. Empty for a non-group weapon.
function getPHBR1WeaponGroups(weaponName) {
  const n = (weaponName || "").trim().toLowerCase();
  if (!n) return [];
  const hit = list => list.some(w =>
    w.toLowerCase() === n ||
    (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(w, weaponName)));
  const out = [];
  Object.keys(PHBR1_TIGHT_GROUPS).forEach(g => {
    if (hit(PHBR1_TIGHT_GROUPS[g])) out.push({ name: g, tier: 'tight' });
  });
  Object.keys(PHBR1_BROAD_GROUPS).forEach(g => {
    if (hit(PHBR1_BROAD_GROUPS[g])) out.push({ name: g, tier: 'broad' });
  });
  return out;
}

// The members of a named group, whichever tier it is. Null for an unknown name.
function getPHBR1GroupMembers(groupName) {
  if (!groupName) return null;
  return PHBR1_TIGHT_GROUPS[groupName] || PHBR1_BROAD_GROUPS[groupName] || null;
}

function isPHBR1NonGroupWeapon(weaponName) {
  const n = (weaponName || "").trim().toLowerCase();
  if (!n) return false;
  return PHBR1_NON_GROUP_WEAPONS.some(w =>
    w.toLowerCase() === n ||
    (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(w, weaponName)));
}

// PHBR1 p.103. Stone and bone weapons shatter in use:
//
//   "Stone weapons are used just like their modern counterparts, but are worth
//    less money, do less damage, and are more prone to shattering."
//   Bone weapons "shatter even more readily".
//
// Every time the weapon HITS, roll 1d6; on `shatterOn` or less the weapon (or
// its head) shatters and is useless. THE ATTACK STILL DOES ITS FULL DAMAGE --
// the shatter is what happens to the weapon, not to the blow.
//
// READ FROM THE RECORD, never parsed out of Notes and never inferred from the
// name. The prose in Notes says the same thing in English; `shatterOn` is the
// number, and the two were cross-checked against each other when the field was
// added. A name test would also miss a house weapon called "Bonecrusher".
//
// Returns { material, on, dieSides } or null. NOT GATED on the supplement:
// these six weapons exist only because PHBR1 prints them, so a table not using
// the book cannot be holding one, and gating would only hide a rule from
// somebody who had already chosen to carry the weapon.
function getWeaponShatter(weaponName, typeKey) {
  const rec = (typeof lookupWeaponData === 'function')
    ? lookupWeaponData(canonicalWeaponName(weaponName, typeKey)) : null;
  if (!rec) return null;
  const on = parseInt(rec.shatterOn, 10);
  if (isNaN(on) || on < 1) return null;
  return { material: rec.material || '', on: on, dieSides: 6 };
}

// PHBR1 p.85, "Lances and Dismounting" -- NOT the Jousting section above it:
//
//   "Lances often break. Any lance that hits and does more than 12 points of
//    damage, and any lance that has been successfully Parried by a shield, may
//    break. The player rolls 1d6: on a 1 or 2, the lance breaks and is useless
//    (except as a club)."
//
// "ANY LANCE", so all four records carry it, not just the jousting lance. The
// rule sits under a general mounted-combat heading; reading it as tournament-only
// would exempt a heavy lance in an ordinary charge, which the sentence does not.
//
// A SEPARATE FIELD FROM shatterOn, deliberately, and no record carries both.
// They are different mechanics that happen to share a die: shattering is rolled
// on EVERY hit, this only on a CONDITIONAL one. A single shared field would
// invite a later reader to collapse them, and the trigger is the whole
// difference -- which is why breakWhen travels with the number.
//
// The book's own vocabulary is kept: stone and bone SHATTER, lances BREAK.
function getWeaponBreak(weaponName, typeKey) {
  const rec = (typeof lookupWeaponData === 'function')
    ? lookupWeaponData(canonicalWeaponName(weaponName, typeKey)) : null;
  if (!rec) return null;
  const on = parseInt(rec.breakOn, 10);
  if (isNaN(on) || on < 1) return null;
  return { on: on, dieSides: 6, when: rec.breakWhen || '' };
}

// === PHBR1 weapon quality (pp.11-13) ===
//
// ENTIRELY NON-MAGICAL. The +1 is a plain arithmetic term, the same shape as a
// specialization bonus: it never lets a weapon strike a creature that can only
// be harmed by magical weapons, and it does not touch speed factor. Only the
// ENCHANTMENT LEVEL does those, which is why quality lives outside the
// enchantment panel entirely.
//
// FIVE KEYS FOR FOUR QUALITIES. The book gives Fine "either a +1 to hit or +1 to
// damage, not both", which is a CHOICE, not a level -- so it is two selectable
// states rather than one state plus a hidden sub-field. A quality key with a
// separate variant key stored beside it is the kit_variant shape, and that field
// was read on load and written nowhere for months without anyone noticing.
//
// AVERAGE IS ABSENCE. An untouched weapon stores no quality at all and reads as
// average, so every character predating this change is unaffected. Absence means
// not-applicable throughout this codebase.
//
// BREAKS: only POOR is automatic. The table marks Average with an asterisk
// reading "This isn't an automatic break; it breaks only if the DM feels like
// it", and Fine and Exceptional break "only in remarkable circumstances, as
// dictated by the DM". So three of the four rows are advisory prose, not a
// mechanic, and only Poor gets a note on the card.
//
// Read off the ATTACK ROLL, so there is no roller: a natural 1-5 is already on
// the die the player just threw. Same reasoning that gave crude weapons no
// roller either.
const WEAPON_QUALITIES = {
  poor:        { label: 'Poor',        hit: -1, dmg: -1, breakOn: 5, craft:  2,
                 blurb: 'Shabbily made, and it looks it.' },
  fine_hit:    { label: 'Fine',        hit:  1, dmg:  0, breakOn: 0, craft: -2,
                 blurb: 'Fine work. The book allows +1 to hit OR +1 damage, not both.' },
  fine_dmg:    { label: 'Fine',        hit:  0, dmg:  1, breakOn: 0, craft: -2,
                 blurb: 'Fine work. The book allows +1 to hit OR +1 damage, not both.' },
  exceptional: { label: 'Exceptional', hit:  1, dmg:  1, breakOn: 0, craft: -4,
                 blurb: 'Exceptional work \u2014 like a fine weapon, but with both bonuses.' }
};

// The dropdown's own order and wording. Built here rather than in the renderer
// so the labels state the numbers -- "Fine" alone cannot tell you which of the
// two Fine weapons you are looking at.
// === PHBR1 Armor Fitting (p.109, table reprinted p.118) ===
//
// "Armor made for one race rarely fits another: it may be too big, too small, or
// proportioned too strangely."
//
// ROW = the race TRYING TO WEAR it. COLUMN = the race it was BUILT FOR. The
// percentage is the chance it fits; the symbol says which way a failure goes.
//
//   '+'  too big   -- baggy, or so long it interferes with walking
//   '-'  too small -- not broad enough across the chest, or comically short
//   ''   even odds, 50/50 either way
//
// TRANSCRIBED AS PRINTED, INCLUDING THE ODD-LOOKING CELLS. Half-Elf wearing
// Gnome armor is 10% '+' -- too BIG, for armor made for someone half his height
// -- and Halfling wearing Elf armor is 30% '-', too SMALL, for armor made for
// someone far taller. Both are correct: the book defines "too large" to include
// BAGGY and "too small" to include NOT BROAD ENOUGH, so a gnome's proportionally
// wide breastplate hangs loose on a slim half-elf, and an elf's narrow one will
// not close over a halfling's chest. Do not "fix" these.
//
// Race keys match getRaceKey's output so the panel can default to the
// character's own race.
const ARMOR_FITTING = {
  dwarf:      { dwarf:{p:80,s:''},  elf:{p:0,s:'-'},  gnome:{p:10,s:'-'},
                'half-elf':{p:10,s:'-'}, halfling:{p:35,s:'-'}, human:{p:40,s:''} },
  elf:        { dwarf:{p:10,s:'+'}, elf:{p:90,s:''},  gnome:{p:50,s:'-'},
                'half-elf':{p:70,s:'+'}, halfling:{p:35,s:'+'}, human:{p:50,s:'+'} },
  gnome:      { dwarf:{p:40,s:'+'}, elf:{p:40,s:'+'}, gnome:{p:75,s:''},
                'half-elf':{p:25,s:'+'}, halfling:{p:60,s:'+'}, human:{p:20,s:'+'} },
  'half-elf': { dwarf:{p:20,s:'+'}, elf:{p:45,s:''},  gnome:{p:10,s:'+'},
                'half-elf':{p:70,s:''},  halfling:{p:35,s:''},  human:{p:50,s:''} },
  halfling:   { dwarf:{p:75,s:'+'}, elf:{p:30,s:'-'}, gnome:{p:35,s:'-'},
                'half-elf':{p:35,s:'+'}, halfling:{p:70,s:''},  human:{p:20,s:'+'} },
  human:      { dwarf:{p:50,s:'-'}, elf:{p:20,s:'-'}, gnome:{p:5,s:'-'},
                'half-elf':{p:30,s:'-'}, halfling:{p:10,s:'-'}, human:{p:65,s:''} }
};

const ARMOR_FITTING_RACES = ['dwarf', 'elf', 'gnome', 'half-elf', 'halfling', 'human'];

// === PHBR1 Chapter 4: Melee Maneuvers (pp.64-74, form p.122) ===
//
// "These maneuvers aren't limited to warrior-classes alone. ANYONE CAN PERFORM
// ANY OF THESE MANEUVERS, provided he has the right weapon or equipment. Any
// priest with a shield can perform a Shield-Punch or Shield-Rush; any rogue or
// mage with a good attack can Disarm a foe." So the panel is gated on the BOOK,
// never on class.
//
// Each maneuver constitutes one Attack. A character with multiple attacks can
// mix and match -- one Strike and one Parry, one Called Shot and one Disarm.
//
// `calledShot: true` means the full Called Shot protocol: announce before
// initiative, +1 penalty to the initiative roll, -4 to hit. NOTE PIN IS NOT ONE
// despite its -4: p.71 says "you don't have to announce it before initiative and
// you don't suffer a +1 to initiative. You do still suffer the -4 attack
// penalty." That distinction is invisible in the p.122 form's modifier column
// and is exactly the sort of thing a reference panel exists to carry.
const COMBAT_MANEUVERS = [
  { key: 'calledShot', name: 'Called Shot', mod: -4, calledShot: true,
    result: 'Varies',
    text: 'Strike a specific body part, disarm, smash something held, bypass armor, ' +
          'or attempt a special result. Announce before initiative; +1 penalty to the ' +
          'initiative roll.' },
  { key: 'disarm', name: 'Disarm', mod: -4, calledShot: true,
    result: 'One-handed weapon flies 2d6 feet; two-handed weapon or shield out of position',
    text: 'A Called Shot at the weapon itself. Roll 2d6 for feet flown and 1d6 for ' +
          'direction (1 straight ahead, 2 ahead-right, 3 behind-right, 4 straight ' +
          'behind, 5 behind-left, 6 ahead-left). Against a TWO-HANDED weapon it only ' +
          'knocks the weapon out of alignment and the wielder loses initiative next ' +
          'round \u2014 two Disarms in the same round are needed to knock it free. ' +
          'Against a SHIELD it draws the shield out of position: the wielder loses its ' +
          'AC bonus and any magical benefit for the rest of the round, regaining it at ' +
          'the start of the next. Worn items cannot be Disarmed.' },
  { key: 'grab', name: 'Grab', mod: -4, calledShot: true,
    result: 'Gets hand(s) on object',
    text: 'Needs at least one free hand; two are better for holding a person. Getting ' +
          'hold is not control: both parties roll 1d20 against Strength and whoever ' +
          'beats his own score by more wins the tug-of-war. A tie is re-rolled in the ' +
          'same round. One-handed Grabs are treated as Strength 3 lower.' },
  { key: 'holdAttack', name: 'Hold Attack', mod: 0,
    result: 'Attack waits until later in the round',
    text: 'Delay your attack until later in the round, hoping circumstances change. ' +
          'Announce on your turn; the DM asks again once everyone has gone. If you ' +
          'still do not act, you forfeit that attack. Archers use this a great deal.' },
  { key: 'parry', name: 'Parry', mod: 0, announce: true,
    result: 'Announce before initiative; a successful parry stops the enemy attack',
    text: 'Announce before initiative is rolled, and how many of your attacks are ' +
          'Parries. Roll to hit your attacker against his AC; a hit means his attack ' +
          'does you no damage. You need not parry the first attack made against you \u2014 ' +
          'you may choose which attacker. Thrown weapons can be parried; missiles ' +
          '(quarrels, arrows, sling stones, magic missiles) cannot.' },
  { key: 'pin', name: 'Pin', mod: -4,
    result: 'Enemy\u2019s weapon pinned against him',
    text: 'Move right up to your enemy and use a weapon or shield to pin or trap his ' +
          'weapon. UNLIKE a Called Shot this needs no announcement and carries no ' +
          'initiative penalty \u2014 but it does take the \u22124 to hit. While pinned, ' +
          'neither of you can use the weapon involved. The victim gets one struggle ' +
          'attempt immediately (a Strength roll as for Grab) and one each round after; ' +
          'the first struggle of each later round does not cost him an attack.' },
  { key: 'pullTrip', name: 'Pull/Trip', mod: 0,
    result: 'A successful attack knocks the enemy down',
    text: 'Describe how you are doing it; the DM may rule it impossible. Roll against ' +
          'AC as normal, then the target rolls 1d20 against Dexterity to stay upright: ' +
          '+6 if he was not moving, \u22123 if he was unaware. Best used on someone ' +
          'moving and unaware. Polearms and other long-hafted weapons are good at it, ' +
          'and reach a mounted rider.' },
  { key: 'sap', name: 'Sap', mod: -8, calledShot: true,
    result: 'Damage \u00d7 5% = knockout chance (40% max)',
    text: 'Hit him over the head to knock him out rather than kill him. A Called Shot ' +
          'at a FURTHER \u22124, so \u22128 in total. 5% knockout chance per point of ' +
          'damage, to a maximum of 40%. Only 25% of the damage is permanent. Melee ' +
          'weapons or bare hands only; Small or Medium targets only. Against a sleeping ' +
          'or held target it hits automatically and the chance rises to 10% per point ' +
          'to a maximum of 80% \u2014 but a failed roll of 81 or higher wakes him.' },
  { key: 'shieldPunch', name: 'Shield-Punch', mod: 0, needsShield: true,
    result: '1\u20133 points of damage (+ Strength bonus)',
    text: 'Slam a buckler, small or medium shield into your target. No attack bonus ' +
          'from the shield whatever its size or enchantment. You lose the shield\u2019s ' +
          'AC bonus from now until your next attack. A good maneuver when you have ' +
          'dropped your weapon \u2014 it beats a bare hand.' },
  { key: 'shieldRush', name: 'Shield-Rush', mod: 0, needsShield: true,
    result: 'As Shield-Punch, plus a knockdown chance',
    text: 'Start at least 10 feet away with a medium or body shield and run full-tilt ' +
          'into him. Damage as Shield-Punch; the target rolls 1d20 against Dexterity ' +
          'with +3 if moving toward you, +3 if not moving, \u22123 if hit from behind, ' +
          '\u22123 if unaware. More reliable than Pull/Trip \u2014 but if you MISS you ' +
          'must make a Dexterity check at \u22126 or go down yourself, and even on a hit ' +
          'you check unmodified.' },
  { key: 'strikeThrust', name: 'Strike/Thrust', mod: 0,
    result: 'Basic attack with weapon or empty hand',
    text: 'The basic combat maneuver, included for completeness. Firing or throwing a ' +
          'missile weapon is a Strike \u2014 usually you just say "Shoot".' }
];

// p.81, "The Locations". The p.122 form prints a single to-hit figure per
// location; these are the two components, because -8 is not a magic number but
// the Called Shot -4 PLUS a further -4 for a small target. A player who knows
// that can reason about it when other modifiers apply.
const MANEUVER_BODY_LOCATIONS = [
  { key: 'torso', name: 'Torso', mod: 0, extra: 0, calledShot: false,
    effect: 'No effect. The torso is hit by any attack that is not a Called Shot.' },
  { key: 'head', name: 'Head', mod: -8, extra: -4, calledShot: true,
    effect: 'DM chooses, or rolls 1d6: 1 Blind (attackers get +4 to hit), 2 Deaf, ' +
            '3 Dizzy (check Dexterity at \u22124), 4 Knockdown, 5 Blind and Deaf, ' +
            '6 Dizzy and Knockdown.' },
  { key: 'arms', name: 'Arms', mod: -4, extra: 0, calledShot: true,
    effect: 'Drops the held weapon, and a shield no longer helps AC. One right, one left.' },
  { key: 'legs', name: 'Legs', mod: -4, extra: 0, calledShot: true,
    effect: 'Check Dexterity to stay upright. One right, one left.' },
  { key: 'stun', name: 'Stun-Points', mod: -8, extra: -4, calledShot: true,
    effect: 'Movement is halved and attackers get +2 to hit. A broad category covering ' +
            'the solar plexus and other nerve centres which cause a great deal of pain ' +
            'when struck.' }
];

// The p.122 form: "Numbed" is 25% of the character's hit points and "Useless"
// 50%, each ROUNDED UP FROM .5. Damage to a location is tracked against these.
const MANEUVER_NUMBED_PCT  = 0.25;
const MANEUVER_USELESS_PCT = 0.50;

function maneuverThresholds(maxHp) {
  const hp = parseInt(maxHp, 10) || 0;
  if (hp <= 0) return null;
  const up = n => Math.round(n);   // .5 rounds up, which is Math.round for positives
  return { hp: hp, numbed: up(hp * MANEUVER_NUMBED_PCT),
           useless: up(hp * MANEUVER_USELESS_PCT) };
}

// Weapon-specific maneuver rules, gathered from the weapon descriptions in
// Chapter 5 rather than from the maneuver chapter -- which is why they are easy
// to miss and worth surfacing. Keys are core_wp.json `Weapon Name` values.
//
// `bonus`   { maneuverKey: modifier } applied on top of the maneuver's own.
// `only`    an EXCLUSIVE list: this weapon can perform no other maneuver.
// `barred`  maneuvers this weapon specifically cannot perform.
// `note`    prose shown on the maneuver row when this weapon is in hand.
const MANEUVER_WEAPON_RULES = {
  'Sai':          { bonus: { pin: 1, disarm: 1 },
                    note: 'Sai confer +1 to hit with Pin and Disarm (p.102).' },
  'Main-Gauche':  { bonus: { disarm: 1, parry: 1 },
                    note: 'Main-gauche confers +1 to hit with Disarm and Parry, and its ' +
                          'basket hilt counts as an iron gauntlet for Punching (p.104).' },
  'Cutlass':      { bonus: { parry: 1 },
                    note: 'The basket hilt gives +1 to hit with Parry and counts as an ' +
                          'iron gauntlet for Punching (p.100).' },
  'Sabre':        { bonus: { parry: 1 },
                    note: 'The basket hilt gives +1 to hit with Parry and counts as an ' +
                          'iron gauntlet for Punching (p.104).' },
  'Cestus':       { bonus: { grab: -2 },
                    note: 'A hand wearing a cestus may still Grab, at \u22122 to hit for ' +
                          'clumsiness AND \u22122 to your Strength for holding on (p.96).' },
  'Nunchaku':     { only: ['calledShot', 'disarm', 'parry', 'strikeThrust'],
                    note: 'The nunchaku performs Called Shots, Disarm, Parry and ' +
                          'Strike/Thrust only (p.102).' },
  'Chain':        { only: ['calledShot', 'disarm', 'parry', 'strikeThrust', 'pullTrip'],
                    note: 'The chain performs Called Shots, Disarm, Parry and ' +
                          'Strike/Thrust, plus three of the lasso\u2019s functions: ' +
                          'Pull/Trip by striking the legs, Dismount a Rider, and Snag a ' +
                          'Rider\u2019s Head (p.101).' },
  'Lasso':        { only: ['pullTrip', 'pin'], barred: ['parry', 'disarm'],
                    note: 'RANGE ONLY \u2014 the lasso cannot Parry or Disarm at all, and ' +
                          'cannot Pin in melee. Trip is a Called Shot to the legs then a ' +
                          'Dexterity roll; pinning both arms is a Called Shot to the arms ' +
                          'then a Strength roll. Each extra lasso is \u22124 to the ' +
                          'target\u2019s Strength for struggling, and at 0 he cannot escape ' +
                          '(pp.98\u201399).' },
  'Net':          { only: ['disarm', 'parry', 'pin'],
                    note: 'A properly folded net performs Disarm, Parry and Pin; once ' +
                          'unfolded all such attacks are at \u22123 to hit. A hit IS a Pin, ' +
                          'and the netted character may make NO attack on the netter at ' +
                          'all until he wins a Strength check and throws the net off ' +
                          '(p.99).' },
  'Gaff/Hook, Attached': { note: 'A gaff fixed to a stump cannot be dropped or Disarmed ' +
                                 '(p.100).' }
};

// "AS WITH OTHER BOWS, the daikyu can be used to perform the Called Shot,
// Disarm, Hold Attack, and Strike/Thrust maneuvers" (p.101). The phrasing makes
// this a rule about MISSILE WEAPONS GENERALLY, not about the daikyu -- and it is
// the single most useful line in the chapter for a filtered list, since nothing
// in the maneuver chapter itself says it.
const MANEUVER_MISSILE_ONLY = ['calledShot', 'disarm', 'holdAttack', 'strikeThrust'];

// What this weapon can do, and at what modifier. Returns
// { allowed: [keys], bonus: {key: mod}, note, reason } -- `reason` naming
// whatever narrowed the list, so the panel can say why rather than just hiding
// rows.
function getManeuverWeaponRules(weaponName, category) {
  const all = COMBAT_MANEUVERS.map(m => m.key);
  const rule = MANEUVER_WEAPON_RULES[(weaponName || '').trim()] || {};
  let allowed = all.slice();
  let reason = '';

  // The missile restriction applies FIRST and a weapon's own list narrows
  // further, never widens: a thrown weapon with its own `only` gets the
  // intersection. Nothing in the book grants a missile weapon a Parry.
  // MELEE/THROWN IS A MELEE WEAPON. The first version matched "thrown" anywhere
  // and so restricted the dagger, hand axe, spear, javelin and trident -- eleven
  // weapons that are melee arms which HAPPEN to be throwable. In hand they Parry
  // and Pin like anything else; the book's restriction is about a weapon being
  // USED as a missile, not about whether it could be.
  //
  // core_wp.json has exactly four categories: Melee, Melee/Thrown, Thrown,
  // Ranged. Anything containing "melee" keeps the full list.
  const cat = (category || '').toLowerCase();
  if (cat.indexOf('melee') === -1 && (cat.indexOf('thrown') !== -1 || cat === 'ranged')) {
    allowed = allowed.filter(k => MANEUVER_MISSILE_ONLY.indexOf(k) !== -1);
    reason = 'missile and thrown weapons perform only Called Shot, Disarm, Hold Attack ' +
             'and Strike/Thrust';
  }
  if (rule.only) {
    allowed = allowed.filter(k => rule.only.indexOf(k) !== -1);
    reason = rule.note || reason;
  }
  if (rule.barred) allowed = allowed.filter(k => rule.barred.indexOf(k) === -1);

  return { allowed: allowed, bonus: rule.bonus || {}, note: rule.note || '',
           reason: reason };
}

// === PHBR1 Piecemeal Armor (pp.111-112, table p.118) ===
//
// "Characters can wear armor assembled out of the remnants of other,
// mismatched sets of armor. It's not as good, and certainly not as
// good-looking, as wearing a matched suit. But sometimes necessity dictates
// that characters wear what's on hand."
//
// NOT A REPLACEMENT FOR THE STANDARD SYSTEM -- A STRICT SUPERSET. The `full`
// column IS the standard system: every one of the 14 rows equals 10 minus that
// armour's base AC, verified against core_armor.json. A character in a matched
// suit gets the same number by the same arithmetic whether this is switched on
// or off. Switching it on only unlocks the other five columns.
//
// AC = 10 - (sum of the pieces worn) - shield - Dex - everything else.
//
// FOURTEEN TYPES, WHICH IS ARMOR_TYPES MINUS `none`, `elven_chain` AND
// `silenced_elven`. Both chains are absent for the same reason: they are
// inherently magical, and split magical armour "grants none of its magical
// bonus" (p.112) -- so there is no number to give either. The UI therefore
// offers the partial slots ONLY for the types below:
// this is a LOCK rather than a warning, because the combination is not
// forbidden, it is UNCOMPUTABLE. Warn when a book says so; lock when the model
// says so.
//
// Columns: full suit, breastplate, two arms, one arm, two legs, one leg.
const PIECEMEAL_ARMOR = {
  banded:       { full: 6, breastplate: 3, two_arms: 2, one_arm: 1, two_legs: 1, one_leg: 0 },
  brigandine:   { full: 4, breastplate: 2, two_arms: 1, one_arm: 0, two_legs: 1, one_leg: 0 },
  bronze_plate: { full: 6, breastplate: 3, two_arms: 2, one_arm: 1, two_legs: 1, one_leg: 0 },
  chain:        { full: 5, breastplate: 2, two_arms: 2, one_arm: 1, two_legs: 1, one_leg: 0 },
  field_plate:  { full: 8, breastplate: 4, two_arms: 2, one_arm: 1, two_legs: 2, one_leg: 1 },
  full_plate:   { full: 9, breastplate: 4, two_arms: 3, one_arm: 1, two_legs: 2, one_leg: 1 },
  hide:         { full: 4, breastplate: 2, two_arms: 1, one_arm: 0, two_legs: 1, one_leg: 0 },
  leather:      { full: 2, breastplate: 1, two_arms: 1, one_arm: 0, two_legs: 0, one_leg: 0 },
  padded:       { full: 2, breastplate: 1, two_arms: 1, one_arm: 0, two_legs: 0, one_leg: 0 },
  plate:        { full: 7, breastplate: 3, two_arms: 2, one_arm: 1, two_legs: 2, one_leg: 1 },
  ring:         { full: 3, breastplate: 1, two_arms: 1, one_arm: 0, two_legs: 1, one_leg: 0 },
  scale:        { full: 4, breastplate: 2, two_arms: 1, one_arm: 0, two_legs: 1, one_leg: 0 },
  splint:       { full: 6, breastplate: 3, two_arms: 2, one_arm: 1, two_legs: 1, one_leg: 0 },
  studded:      { full: 3, breastplate: 1, two_arms: 1, one_arm: 0, two_legs: 1, one_leg: 0 }
};

// The five PARTIAL slots, in display order. `full` is deliberately absent: a
// full suit is the existing "Armor" slot and needs no new value.
//
// Weight is DERIVED, not entered (p.112): "The breastplate is 1/2 the weight of
// the original suit. Each arm and leg is 1/8 the weight of the original suit."
// So two arms or two legs is 1/4. Applied at the encumbrance walk rather than by
// rewriting the weight FIELD -- same anchor rule as elven half-weight.
const PIECEMEAL_SLOTS = [
  { key: 'breastplate', label: 'Breastplate', weightMult: 0.5   },
  { key: 'two_arms',    label: 'Two Arms',    weightMult: 0.25  },
  { key: 'one_arm',     label: 'One Arm',     weightMult: 0.125 },
  { key: 'two_legs',    label: 'Two Legs',    weightMult: 0.25  },
  { key: 'one_leg',     label: 'One Leg',     weightMult: 0.125 }
];

// May this armour type be worn piecemeal at all?
function isPiecemealType(armorTypeKey) {
  return !!(armorTypeKey && PIECEMEAL_ARMOR[armorTypeKey]);
}

// What a piece contributes. Returns { bonus, weightMult, label } or null.
// Gated on PHBR1 core: with the book off the stored slot survives untouched and
// the piece contributes nothing, like a suspended fighting style.
function getPiecemealPiece(armorTypeKey, slotKey) {
  if (typeof isSupplementActive === 'function' && !isSupplementActive('phbr1', 'piecemealArmor')) return null;
  const row = PIECEMEAL_ARMOR[armorTypeKey];
  const slot = PIECEMEAL_SLOTS.find(s => s.key === slotKey);
  if (!row || !slot) return null;
  return { bonus: row[slotKey] || 0, weightMult: slot.weightMult, label: slot.label };
}

// === PHBR1 High-Quality Racial Armor (pp.110-111) ===
//
// "Armor found as treasure has a chance to be high-quality armor. Ordinary armor
// has a 10% chance on percentile dice; magical armor has a 25% chance. Each race
// adds something different to its armor if it is high quality."
//
// The 10%/25% generation figures are the DM's roll and are recorded here as
// prose only -- nothing on a character sheet rolls them.
//
// FOUR OF THE SIX RACES CHANGE SOMETHING THE SHEET COMPUTES. Dwarven adds only
// item saving throws (a DMG table, DM-side) and damage points (parked), so a
// dwarven entry currently does nothing at all -- it is carried so the dropdown
// is complete and so the DP work later has somewhere to land.
//
// `dpMult` HAS NO CONSUMER and is deliberately stored anyway. The "Damage to
// Armor" rules are provisionally decided against (see the PHBR notes), but the
// dwarven "twice the number of damage points", human plate's "one and a half
// times", and the high-quality shield's "twice as many" are all stated HERE, in
// this section. Recording them now means building DP later is purely additive:
// a base-DP table and a consumer, with nothing in this registry to revisit.
//
// `itemSaveBonus` is recorded on the same principle. Item saving throws are a
// DMG chart and DM-side by the standing scope rule, so nothing reads it.
//
// `allows` is the list of ARMOR_TYPES keys a race can make as high-quality.
// null means all types. This is a REAL restriction the book states -- gnomes
// make only studded and padded leather, halflings only leather, half-elves
// everything except the soft armours and bronze plate -- so it drives an
// advisory rather than being decoration.
const HIGH_QUALITY_RACIAL_ARMOR = {
  dwarf: {
    label: 'Dwarven', allows: null,
    weightMult: 1, thiefRule: null, wearerSaves: null,
    itemSaveBonus: 6, dpMult: 2,
    blurb: 'Very, very resistant to damage. +6 to item saving throws, on top of any ' +
           'magical bonus.'
  },
  elf: {
    label: 'Elven', allows: null,
    weightMult: 0.5, thiefRule: null, wearerSaves: null,
    itemSaveBonus: 0, dpMult: 1,
    blurb: 'Elven steel \u2014 half the weight of ordinary armor. Elvish craftsmen never ' +
           'make it to order for outsiders; a piece is bestowed by elven royalty for ' +
           'deeds of exceptional valor.'
  },
  gnome: {
    label: 'Gnomish', allows: ['studded', 'padded'],
    weightMult: 1, thiefRule: 'noPenalty', wearerSaves: null,
    itemSaveBonus: 0, dpMult: 1,
    blurb: 'Very quiet studded and padded leather \u2014 the only high-quality armors ' +
           'gnomes make. Takes NO penalties at all on the Thieving Skill Armor ' +
           'Adjustment table.'
  },
  'half-elf': {
    // Stated as an exclusion list in the book; resolved to the inclusion list
    // here because every consumer asks "may this type be high-quality?" and an
    // exclusion would have to be inverted at each call site.
    label: 'Half-elven',
    allows: ['ring', 'brigandine', 'scale', 'chain', 'elven_chain', 'banded',
             'splint', 'plate', 'field_plate', 'full_plate'],
    weightMult: 0.9, thiefRule: null, wearerSaves: null,
    itemSaveBonus: 2, dpMult: 1,
    blurb: 'Fine steel at normal thickness \u2014 10% lighter than ordinary armor, and +2 ' +
           'to item saving throws. Half-elves make no high-quality leather, padded, ' +
           'studded leather, hide or bronze plate mail.'
  },
  halfling: {
    label: 'Halfling', allows: ['leather'],
    weightMult: 1, thiefRule: 'countsAsNone', wearerSaves: null,
    itemSaveBonus: 0, dpMult: 1,
    blurb: 'Leather only. Counts as "No Armor" on the Thieving Skill Armor ' +
           'Adjustment table.'
  },
  human: {
    label: 'Human', allows: null,
    weightMult: 1, thiefRule: null, wearerSaves: null,
    itemSaveBonus: 2, dpMult: 1,
    blurb: 'Especially tough \u2014 +2 to item saving throws whatever it is made of.',
    // THE ONE TYPE-SPECIFIC SUB-RULE IN THE SECTION. Plate mail, field plate and
    // full plate -- explicitly NOT bronze plate -- are made of fine steel but
    // built THICKER rather than lighter, so they stay normal weight and instead
    // give the WEARER a saving throw bonus. That is the only effect in the whole
    // subsystem that touches the character's own saves rather than the item's.
    plateRule: {
      types: ['plate', 'field_plate', 'full_plate'],
      weightMult: 1, itemSaveBonus: 4, dpMult: 1.5,
      wearerSaves: { rodStaffWand: 2, breathWeapon: 2 },
      blurb: 'Fine steel built thicker rather than lighter: normal weight, +4 to item ' +
             'saving throws, and the wearer gains +2 to saving throws vs. Rod, Staff ' +
             'or Wand and vs. Breath Weapon attacks.'
    }
  }
};

// High-quality SHIELDS grant nothing at all unless the Damage to Armor rules are
// in use, in which case they have twice the damage points. Recorded for the same
// forward-compatibility reason as dpMult above; no consumer today.
const HIGH_QUALITY_SHIELD_DP_MULT = 2;

// What a given piece actually grants. `makerRace` is the race that MADE it,
// `armorTypeKey` its ARMOR_TYPES key. Returns null when the piece is not marked
// high-quality or the race is unknown.
//
// Gated on PHBR1 core, like every other rule from this book: with the supplement
// off the flag stays on the armour untouched and grants nothing.
function getHighQualityArmor(makerRace, armorTypeKey) {
  const r = (makerRace || '').trim().toLowerCase();
  if (!r) return null;
  if (typeof isSupplementActive === 'function' && !isSupplementActive('phbr1', 'armorQuality')) return null;
  const base = HIGH_QUALITY_RACIAL_ARMOR[r];
  if (!base) return null;

  const key = (armorTypeKey || '').trim();
  const out = {
    race: r, label: base.label, allows: base.allows,
    weightMult: base.weightMult, thiefRule: base.thiefRule,
    wearerSaves: base.wearerSaves, itemSaveBonus: base.itemSaveBonus,
    dpMult: base.dpMult, blurb: base.blurb,
    // TRUE when this race cannot make THIS type as high-quality. Advisory only:
    // a DM may rule otherwise, and PHBR1 p.37's licence to modify applies here
    // as everywhere else.
    typeNotMade: !!(base.allows && key && base.allows.indexOf(key) === -1)
  };

  if (base.plateRule && key && base.plateRule.types.indexOf(key) !== -1) {
    out.weightMult    = base.plateRule.weightMult;
    out.itemSaveBonus = base.plateRule.itemSaveBonus;
    out.dpMult        = base.plateRule.dpMult;
    out.wearerSaves   = base.plateRule.wearerSaves;
    out.blurb         = base.plateRule.blurb;
    out.plate         = true;
  }
  return out;
}

// FULL PLATE IGNORES THE TABLE ENTIRELY (p.109): "it has only a 20% chance to fit
// another member of the same race (10% if the new wearer is of the other sex). A
// character cannot wear full plate made for a character of another race, period."
const ARMOR_FITTING_FULL_PLATE = { sameRace: 20, sameRaceOtherSex: 10, otherRace: 0 };

// Different sex costs 10%, "but never goes below 5%". On a failure caused by
// that modifier specifically, "the woman found the man's armor too big, or the
// man found the woman's too small".
const ARMOR_FITTING_SEX_MOD = -10;
const ARMOR_FITTING_FLOOR   = 5;

// Returns { pct, symbol, verdict, fullPlate, floored, parts } or null.
// `build` is the DM's role-played adjustment -- the book's example is +15% for a
// short, stocky human trying dwarven armor -- so it is a free number, not a
// dropdown: the book leaves the size entirely to the DM.
function getArmorFitting(wearerRace, builtForRace, opts) {
  const o = opts || {};
  const w = (wearerRace || '').trim().toLowerCase();
  const b = (builtForRace || '').trim().toLowerCase();
  if (!ARMOR_FITTING[w] || !ARMOR_FITTING[w][b]) return null;

  const parts = [];

  if (o.fullPlate) {
    let pct;
    if (w !== b) {
      pct = ARMOR_FITTING_FULL_PLATE.otherRace;
      parts.push('Full plate never fits across races');
    } else if (o.otherSex) {
      pct = ARMOR_FITTING_FULL_PLATE.sameRaceOtherSex;
      parts.push('Full plate, same race, other sex');
    } else {
      pct = ARMOR_FITTING_FULL_PLATE.sameRace;
      parts.push('Full plate, same race');
    }
    return { pct: pct, symbol: '', verdict: '', fullPlate: true, floored: false, parts: parts };
  }

  const cell = ARMOR_FITTING[w][b];
  let pct = cell.p;
  parts.push('Base ' + cell.p + '%');

  if (o.otherSex) { pct += ARMOR_FITTING_SEX_MOD; parts.push('Other sex ' + ARMOR_FITTING_SEX_MOD + '%'); }

  const build = parseInt(o.build, 10) || 0;
  if (build) { pct += build; parts.push('Build ' + (build > 0 ? '+' : '') + build + '%'); }

  // The floor applies to the SEX modifier by the book's wording. Applied to the
  // whole figure here because nothing else can drive it below 5 except a DM's
  // negative build adjustment, and floor-then-ignore would be stranger.
  let floored = false;
  if (pct < ARMOR_FITTING_FLOOR) { pct = ARMOR_FITTING_FLOOR; floored = true; }
  if (pct > 100) pct = 100;

  const verdict = cell.s === '+' ? 'too big'
                : cell.s === '-' ? 'too small'
                : 'even odds either way';

  return { pct: pct, symbol: cell.s, verdict: verdict, fullPlate: false,
           floored: floored, parts: parts };
}

const WEAPON_QUALITY_OPTIONS = [
  { key: '',            text: 'Average' },
  { key: 'poor',        text: 'Poor (\u22121 hit, \u22121 dmg, breaks on 1\u20135)' },
  { key: 'fine_hit',    text: 'Fine (+1 hit)' },
  { key: 'fine_dmg',    text: 'Fine (+1 damage)' },
  { key: 'exceptional', text: 'Exceptional (+1 hit, +1 dmg)' }
];

// Returns { key, label, hit, dmg, breakOn, craft, blurb } or null for average.
// Gated on PHBR1 core: with the book off a stored quality grants nothing and
// costs nothing, and the value stays on the weapon untouched -- the same
// suspension getFightingStyles and the weapon groups already use.
function getWeaponQuality(key) {
  if (!key) return null;
  if (typeof isSupplementActive === 'function' && !isSupplementActive('phbr1', 'weaponQuality')) return null;
  const q = WEAPON_QUALITIES[key];
  return q ? Object.assign({ key: key }, q) : null;
}

// Do these two weapons share ONE proficiency? Full proficiency, not the half
// penalty -- see the note in getWeaponProficiencyStatus.
function samePHBR1Proficiency(nameA, nameB) {
  const a = (nameA || "").trim().toLowerCase();
  const b = (nameB || "").trim().toLowerCase();
  if (!a || !b) return false;
  return PHBR1_SAME_PROFICIENCY.some(pair => {
    const x = pair[0].toLowerCase(), y = pair[1].toLowerCase();
    return (a === x && b === y) || (a === y && b === x);
  });
}

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
// The book name for a weapon, resolved through its type key when it has one.
//
// PHB_RELATED_WEAPONS is keyed by canonical names, so without this a renamed
// weapon can never appear in a PHB set and falls through to the GROUP fallback
// -- which is wider than the book. "Moon Hunter" would come back related to a
// short sword, where the PHB's sword set is only scimitar / bastard / long /
// broad. Resolving the name first keeps the book's narrower answer.
function canonicalWeaponName(name, typeKey) {
  const t = (typeof getWeaponTypeData === 'function') ? getWeaponTypeData(typeKey) : null;
  return t ? t.wpName : (name || "");
}

function areWeaponsRelated(nameA, groupA, nameB, groupB, keyA, keyB) {
  const cA = canonicalWeaponName(nameA, keyA);
  const cB = canonicalWeaponName(nameB, keyB);

  const setA = getPHBRelatedSet(cA);
  const setB = getPHBRelatedSet(cB);
  if (setA && setB) return setA === setB;

  // PHBR1's own sets, consulted BEFORE the old "one is listed, the other isn't"
  // bail-out. That line was the bug: every PHBR1 weapon is absent from the PHB
  // list, so pairing one with a PHB-listed weapon returned false before the
  // Group fallback could run. Belaying pin vs club, cutlass vs dagger, katana vs
  // long sword and nine others all failed that way.
  const p1A = getPHBR1RelatedSets(cA);
  const p1B = getPHBR1RelatedSets(cB);
  if (p1A.some(s => p1B.indexOf(s) !== -1)) return true;

  // "Related to nothing" is a POSITIVE statement in PHBR1 and must beat the
  // Group fallback, which would otherwise relate shuriken to darts because both
  // carry Group "Dart".
  if (isPHBR1Unrelated(cA) || isPHBR1Unrelated(cB)) return false;

  const gA = (groupA || "").trim().toLowerCase();
  const gB = (groupB || "").trim().toLowerCase();

  // A few weapons are related to a whole GROUP rather than a list -- "related to
  // all other polearms", "related to but not identical to other bow
  // proficiencies". Stored as the rule rather than resolved to names, because the
  // weapon list is open and a resolved list goes stale as books are audited.
  const tgA = PHBR1_RELATED_TO_GROUP[cA];
  const tgB = PHBR1_RELATED_TO_GROUP[cB];
  if (tgA && (tgA || "").toLowerCase() === gB) return true;
  if (tgB && (tgB || "").toLowerCase() === gA) return true;

  // PHBR1 p.59, DM's option: "These categories are very close to the related
  // weapon groups from page 52 of the Player's Handbook, and your DM can, if he
  // wishes, use these categories as related groups."
  //
  // ABOVE the exhaustive bail-out below, and that placement is the whole point.
  // The cutlass is named in a PHBR1 related set and the khopesh is named in
  // none, so the bail-out would refuse the pair -- yet both are Medium Blades,
  // which is exactly the relation this option exists to grant. The option adds a
  // BASIS for relatedness; it does not extend an existing list.
  //
  // BELOW isPHBR1Unrelated, equally deliberately: "related to nothing" is a
  // positive statement in PHBR1 and no group may overturn it.
  //
  // TIGHT ONLY. p.60, of the broad groups: "These groups may not be used to
  // calculate weapon similarity for determining whether a character receives the
  // full or partial attack penalty." getPHBR1WeaponGroups returns both tiers, so
  // the filter is not optional -- without it a dagger and a two-handed sword
  // would come back related through Blades.
  if (typeof isOptionalRule === 'function' && isOptionalRule('tightGroupsAsRelatedPHBR1') &&
      typeof getPHBR1WeaponGroups === 'function') {
    const tight = n => getPHBR1WeaponGroups(n)
      .filter(g => g.tier === 'tight')
      .map(g => g.name);
    const tA = tight(cA), tB = tight(cB);
    if (tA.length && tB.length && tA.some(g => tB.indexOf(g) !== -1)) return true;
  }

  // A weapon named in ANY book's list has exhaustive relationships; it does not
  // also pick up its whole Group.
  if (setA || setB || p1A.length || p1B.length) return false;

  return !!gA && gA === gB;
}

// A character's proficiency status with a given weapon.
// Returns "proficient" | "related" | "none".
function getWeaponProficiencyStatus(weaponName, weaponGroup, weaponProfs, weaponTypeKey) {
  const profs = weaponProfs || [];
  const n     = (weaponName || "").trim().toLowerCase();
  const key   = (weaponTypeKey || "").trim();
  if (!n && !key) return "none";

  // 1. TYPE KEY MATCH -- the anchor, and the reason this parameter exists.
  //    Two records naming the same specific weapon ARE the same weapon,
  //    whatever the player has called them, so a proficiency in Long Sword
  //    recognises a long sword named "Moon Hunter" as fully proficient rather
  //    than merely related. Names cannot do this; keys can.
  if (key && profs.some(p => (p.weaponTypeKey || "").trim() === key)) return "proficient";

  // 2. NAME MATCH -- for a weapon row or a proficiency that has no type set,
  //    i.e. anything not yet migrated, or a genuinely homebrew weapon with no
  //    equivalent in the book.
  if (n && profs.some(p => (p.name || "").trim().toLowerCase() === n)) return "proficient";

  // 2b. SAME PROFICIENCY -- PHBR1 states outright that certain weapons share one
  //     proficiency rather than merely resembling one another: knife/stiletto,
  //     bo stick/quarterstaff, short sword/drusus. That is FULL proficiency, not
  //     the half penalty, so it must be tested BEFORE the related check below --
  //     otherwise a short-sword-proficient character wielding a drusus takes a
  //     -1 the book does not impose.
  if (profs.some(p => samePHBR1Proficiency(
        canonicalWeaponName(weaponName, key),
        canonicalWeaponName(p.name, p.weaponTypeKey)))) {
    return "proficient";
  }

  // 2c. GROUP PROFICIENCY (PHBR1 pp.58-60). A group record carries `groupTier`
  //     and its `name` is a GROUP, not a weapon -- "Fencing Blades", not
  //     "Rapier". Buying it grants FULL proficiency in every member, so this
  //     belongs here with the other proficient outcomes and above the related
  //     check: a Fencing Blades character wielding a rapier takes no penalty at
  //     all, not a halved one.
  //
  //     GATED ON THE SUPPLEMENT. With PHBR1 core switched off the record stays
  //     on the character untouched and simply grants nothing, the same treatment
  //     getFightingStyles gives a style -- suspended, never refunded, never
  //     deleted. The slot counter must gate identically or the two will disagree
  //     about what the character paid for.
  //
  //     Membership goes through samePHBR1Proficiency as well as the name, so a
  //     Dirk is covered by the Dagger listed in four groups, and through
  //     canonicalWeaponName so a flavour-named weapon resolves by its type key.
  if (typeof isSupplementActive === 'function' && isSupplementActive('phbr1', 'weaponGroups') &&
      typeof getPHBR1GroupMembers === 'function') {
    const cName = canonicalWeaponName(weaponName, key);
    const cn = (cName || "").trim().toLowerCase();
    const inGroup = profs.some(p => {
      if (!p || !p.groupTier) return false;
      const members = getPHBR1GroupMembers(p.name);
      if (!members) return false;
      return members.some(m =>
        m.toLowerCase() === cn || samePHBR1Proficiency(m, cName));
    });
    if (inGroup) return "proficient";
  }

  // 3. Related weapon -- half penalty.
  if (profs.some(p => areWeaponsRelated(weaponName, weaponGroup, p.name, p.group,
                                        key, p.weaponTypeKey))) {
    return "related";
  }

  return "none";
}

// === Non-Proficiency Penalty (PHB Table 34, "Penalty" column) ===
// Warrior -2, Wizard -5, Priest -3, Rogue -3.
// Multi/dual-class characters use the BEST (least severe) penalty available --
// a fighter/mage swings a sword at -2, not -5.
function getNonProfPenalty(root) {
  // Chapter 5 is optional in full, but the rest of it opts out of itself -- a
  // table ignoring proficiencies just leaves the lists empty and the counters
  // read "0 of 4", which is unused rather than wrong. THIS is the one part that
  // imposes itself: the penalty applies to weapons you LACK a proficiency for,
  // so an empty list paints every weapon red. Hence the override.
  if (typeof isOptionalRule === "function" && !isOptionalRule("nonProficiencyPenalty")) {
    return 0;
  }

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


// === Attacking With Two Weapons (AD&D 2e, PHB Ch.9) ===
//
// "Attacks made with the main weapon suffer a -2 penalty, and attacks made with
// the second weapon suffer a -4 penalty. The character's Reaction Adjustment
// (based on his Dexterity, see Table 2) modifies this penalty. A low Dexterity
// score will worsen the character's chance to hit with each attack. A high
// Dexterity can negate this particular penalty, although it cannot result in a
// positive modifier on the attack rolls for either weapon (i.e., the Reaction
// Adjustment can, at best, raise the attack roll penalties to 0)."
//
// THE CAP IS ONE-SIDED. Math.min(0, ...) going up, nothing going down:
// DEX 18 (+2) -> 0 / -2. DEX 24 (+5) -> 0 / 0, NOT +3 / +1.
// DEX 3 (-3) -> -5 / -7, with no floor.
//
// DEX_TABLE index 0 is the REACTION Adjustment and this is its first consumer
// anywhere in the codebase. Index 1 is the Missile Attack Adjustment, which
// carries identical numbers in 2e -- they look like duplicates and are not, so
// do not collapse the two lookups.
const TWO_WEAPON_MAIN_PENALTY = -2;
const TWO_WEAPON_OFF_PENALTY  = -4;

// PHBR1 p.64: "your attack penalty drops: before, it was a -2 with your primary
// weapon and -4 with your secondary, but with Specialization in Two-Weapon Style
// it becomes 0 with your primary weapon and a -2 with your secondary."
//
// These REPLACE the PHB pair rather than adding to it, and the Dexterity
// Reaction Adjustment still applies on top afterwards -- a poor Dexterity
// worsens a specialist's penalties exactly as it worsens anyone else's, and the
// one-sided cap still forbids a positive modifier.
//
// NOT MODELLED YET: ambidexterity, which p.64 says takes a specialist to 0/0.
// It costs its own weapon proficiency slot (p.60) and has no field on the sheet,
// so a player who is ambidextrous should use the manual attack adjustment for
// the remaining -2 until it is built.
const TWO_WEAPON_SPEC_MAIN_PENALTY = 0;
const TWO_WEAPON_SPEC_OFF_PENALTY  = -2;

// Ch.3 Ranger: "When wearing studded leather or lighter armor, a ranger can
// fight two-handed with no penalty to his attack rolls" -- the book's own typo
// for two-WEAPON, since its cross-reference points straight at Ch.9. And:
// "A ranger can still fight with two weapons while wearing heavier armor than
// studded leather, but he suffers the standard attack roll penalties."
//
// So the exemption is CONDITIONAL, and its condition is the same printed phrase
// that gates ranger stealth. RANGER_STEALTH_MAX_ARMOR is reused deliberately
// rather than duplicated -- a second list would drift from the first, and the
// elven-chain ruling already recorded there would then apply to one rule and
// not the other.
function getTwoWeaponPenalties(root) {
  const dex    = parseInt(val(root, 'dex') || 0, 10);
  const dexRow = DEX_TABLE[dex];
  const reactionAdj = dexRow ? dexRow[0] : 0;

  // PHBR1 p.64. Style Specialization in Two-Weapon Style takes the pair from
  // -2/-4 to 0/-2. getFightingStyles returns zeros when PHBR1 is off, so a
  // PHB-only table sees the PHB numbers untouched.
  const styles = (typeof getFightingStyles === 'function')
    ? getFightingStyles(root) : null;
  const twoWeaponSpec = !!(styles && styles.active && styles.twoWeapon);

  const classes = (typeof getCharacterClassList === 'function')
    ? getCharacterClassList(root) : [];
  const isRanger = classes.some(c => (c || '').toLowerCase().includes('ranger'));

  let armorName = '', armorOk = false;
  if (isRanger) {
    const armor = (typeof getThiefArmorCategory === 'function')
      ? getThiefArmorCategory(root) : null;
    const typeKey = armor ? (armor.typeKey || 'none') : 'none';
    armorName = armor ? armor.name : '';
    armorOk = (typeof RANGER_STEALTH_MAX_ARMOR !== 'undefined') &&
              RANGER_STEALTH_MAX_ARMOR.indexOf(typeKey) !== -1;
  }

  if (isRanger && armorOk) {
    // PHBR1 p.64 addresses this overlap directly: "Though rangers don't suffer
    // the off-hand penalties for two-weapons use, they do not get a bonus to hit
    // if they devote a weapon proficiency slot to Two-Weapon Style. They do get
    // the other benefit, of being able to use weapons of equal length."
    //
    // So the slot buys a ranger in light armour NOTHING on his attack rolls --
    // he is already at 0/0 and the specialization cannot take him positive. It
    // is worth saying so, because a player who spent the slot will otherwise
    // assume the app has ignored it.
    return {
      main: 0, off: 0, exempt: true, reactionAdj: reactionAdj, armorName: armorName,
      styleSpec: twoWeaponSpec,
      reason: 'Ranger in ' + (armorName || 'light armour') +
              ': no two-weapon penalty (PHB Ch.3).' +
              (twoWeaponSpec
                ? ' Two-Weapon Style Specialization adds nothing to hit here -- you' +
                  ' are already at 0/0 -- but it does let you wield weapons of equal' +
                  ' length (PHBR1 p.64).'
                : '')
    };
  }

  // PHBR1 p.64: "(If you're already ambidextrous, as per 'Off-Hand Weapons Use'
  // above, that penalty is 0 with primary weapon and 0 with secondary weapon.)"
  //
  // THE PARENTHETICAL MODIFIES THE SPECIALIZED CASE ONLY. Ambidexterity on its
  // own does NOT improve the PHB's -2/-4 -- it cancels the -2 for fighting with
  // the WRONG hand (p.57), which is a different penalty entirely and one this
  // tool does not yet track, since there is no handedness field.
  const ambi = !!(styles && styles.active && styles.ambidextrous);
  const mainBase = twoWeaponSpec ? TWO_WEAPON_SPEC_MAIN_PENALTY : TWO_WEAPON_MAIN_PENALTY;
  const offBase  = (twoWeaponSpec && ambi) ? 0
                 : twoWeaponSpec           ? TWO_WEAPON_SPEC_OFF_PENALTY
                 :                           TWO_WEAPON_OFF_PENALTY;

  const cap = p => Math.min(0, p + reactionAdj);
  return {
    main: cap(mainBase),
    off:  cap(offBase),
    exempt: false,
    reactionAdj: reactionAdj,
    armorName: armorName,
    styleSpec: twoWeaponSpec,
    reason: (isRanger
      ? 'Ranger in ' + (armorName || 'heavy armour') +
        ': heavier than studded leather, so the standard penalties apply.'
      : '') +
      (twoWeaponSpec
        ? (isRanger ? ' ' : '') +
          (ambi
            ? 'Two-Weapon Style Specialization with Ambidexterity: 0/0 instead of ' +
              '-2/-4 (PHBR1 p.64).'
            : 'Two-Weapon Style Specialization: 0/-2 instead of -2/-4 (PHBR1 p.64).')
        : '')
  };
}


// Size and weight for the off-hand legality test. The ROW WINS: .weapon-size is
// an explicit override and .weight is what the player actually carries.
// core_wp.json is only the fallback for rows that never set either. Note the
// JSON stores weight as a STRING ("10 lb"), stripped to a number the same way
// app.js:3345 does it.
function getWeaponSizeAndWeight(rowEl) {
  if (!rowEl) return { name: '', size: '', weight: null };
  const q = sel => rowEl.querySelector(sel);
  const name = ((q('.title') && q('.title').value) || '').trim();

  let size   = ((q('.weapon-size') && q('.weapon-size').value) || '').trim().toUpperCase();
  let weight = parseFloat((q('.weight') && q('.weight').value) || '');

  if (!size || isNaN(weight)) {
    const ref = (typeof lookupWeaponData === 'function') ? lookupWeaponData(name) : null;
    if (ref) {
      if (!size) size = String(ref.Size || '').trim().toUpperCase();
      if (isNaN(weight)) weight = parseFloat(String(ref.Weight || '').replace(/[^0-9.]/g, ''));
    }
  }
  return { name: name, size: size, weight: isNaN(weight) ? null : weight };
}

// PHB Ch.9: "The second weapon must be smaller in size and weight than the
// character's main weapon (though a dagger can always be used as a second
// weapon, even if the primary weapon is also a dagger)."
//
// BOTH conditions, not either. The dagger clause exempts from both, which is
// why it is tested first -- a dagger against a dagger is explicitly legal even
// though it is neither smaller nor lighter.
//
// Returns legal:null when the data cannot support a judgement. Per the
// advisory-not-blocking principle, an unrecognised weapon says NOTHING rather
// than accusing the player of an illegal choice.
const OFFHAND_SIZE_RANK = { S: 1, M: 2, L: 3 };

// equalLengthOk relaxes the test from STRICTLY smaller to smaller-or-equal, on
// both size and weight. PHBR1 p.64, Two-Weapon Style Specialization: "you're
// allowed to use weapons of the same length in each hand, so you can, for
// example, wield two long swords."
//
// EQUAL, not larger. The relaxation turns < into <=; it does not permit an
// off-hand weapon heavier or bigger than the main one, and two long swords --
// same size M, same 4 lb -- are the book's own worked example of what it buys.
//
// Passed in rather than read from the sheet so this function stays pure; the
// caller already has the style state from getTwoWeaponPenalties.
function isLegalOffhandWeapon(main, off, equalLengthOk) {
  if (!main || !off) return { legal: null, reason: '' };

  if (/\bdagger\b/i.test(off.name)) {
    return { legal: true, reason: 'A dagger is always legal in the off hand (PHB Ch.9).' };
  }

  const mR = OFFHAND_SIZE_RANK[main.size], oR = OFFHAND_SIZE_RANK[off.size];
  if (!mR || !oR || main.weight === null || off.weight === null) {
    return { legal: null, reason: '' };
  }

  const smaller = equalLengthOk ? (oR <= mR)            : (oR < mR);
  const lighter = equalLengthOk ? (off.weight <= main.weight) : (off.weight < main.weight);
  if (smaller && lighter) {
    return {
      legal: true,
      reason: equalLengthOk && (oR === mR || off.weight === main.weight)
        ? 'Legal because of Two-Weapon Style Specialization, which permits ' +
          'weapons of equal length in each hand (PHBR1 p.64). Without it, PHB ' +
          'Ch.9 would require the off-hand weapon to be strictly smaller and lighter.'
        : ''
    };
  }

  const cmp = equalLengthOk ? 'larger in size' : 'not smaller in size';
  const wgt = equalLengthOk ? 'heavier'        : 'not lighter';
  const fails = [];
  if (!smaller) fails.push(cmp + ' (' + off.size + ' vs ' + main.size + ')');
  if (!lighter) fails.push(wgt + ' (' + off.weight + ' vs ' + main.weight + ' lb)');
  return {
    legal: false,
    reason: (off.name || 'The off-hand weapon') + ' is ' + fails.join(' and ') +
            ' than ' + (main.name || 'the main weapon') + '. ' +
            (equalLengthOk
              ? 'Two-Weapon Style Specialization permits weapons of EQUAL length ' +
                '(PHBR1 p.64), but not a heavier or larger one in the off hand.'
              : 'PHB Ch.9 requires the off-hand weapon to be smaller in size AND ' +
                'weight, unless it is a dagger.')
  };
}

// PHB Ch.9: "The use of two weapons enables the character to make one additional
// attack each combat round... The character gains only ONE additional attack
// each round, regardless of the number of attacks he may normally be allowed.
// Thus, a warrior able to attack 3/2 ... can attack 5/2."
//
// Rates are strings ("1", "3/2", "2"), so the arithmetic is done in HALVES and
// reformatted: 3/2 -> 5/2, 1 -> 2, 2 -> 3. The book's own example is the test.
// Multiply an attack rate by a factor, in HALVES, so "3/2" survives the trip.
// Slowed halves and Hasted doubles; both compound, so slowed-and-hasted returns
// to the original rate on its own without a special case.
//
// FLOOR AT ONE HALF, not zero: PHB Ch.9's slow spell halves the rate, and a
// character reduced to no attacks at all would be a stronger effect than any
// printed rule grants. 1/2 reads as "one attack every two rounds".
function scaleAttackRate(rate, mult) {
  const s = String(rate == null ? '1' : rate).trim();
  const frac = s.match(/^(\d+)\s*\/\s*2$/);
  let halves;
  if (frac) {
    halves = parseInt(frac[1], 10);
  } else {
    const whole = parseFloat(s);
    if (!isFinite(whole) || whole <= 0) return s;   // unparseable: leave alone
    halves = Math.round(whole * 2);
  }
  halves = Math.max(1, Math.round(halves * mult));
  return (halves % 2 === 0) ? String(halves / 2) : (halves + '/2');
}

function addOneAttackPerRound(rate) {
  const s = String(rate == null ? '1' : rate).trim();
  const frac = s.match(/^(\d+)\s*\/\s*2$/);
  let halves;
  if (frac) {
    halves = parseInt(frac[1], 10);
  } else {
    const whole = parseFloat(s);
    if (!isFinite(whole) || whole <= 0) return s;   // unparseable: leave it alone
    halves = Math.round(whole * 2);
  }
  halves += 2;
  return (halves % 2 === 0) ? String(halves / 2) : (halves + '/2');
}


// === Parrying (AD&D 2e, PHB Ch.9, Optional Rule) ===
//
// "In order to make himself harder to hit, a character can parry -- FORFEIT ALL
// ACTIONS FOR THE ROUND -- he can't attack, move, or cast spells. This frees the
// character to concentrate solely on defense. At this point, all characters but
// warriors gain an AC bonus equal to half their level. A 6th-level wizard would
// have a +3 bonus to his AC. A warrior gets a bonus equal to half his level plus
// one. A 6th-level fighter would gain a +4 AC bonus."
//
// THIS MUST NEVER BE ADDED TO THE AC FIELD. "Note that the benefit is not a
// perfect all-around defense, and it's not effective against rear or missile
// attacks. It applies only to those characters attacking the defender with
// frontal melee attacks. This optional defense has no effect against magical
// attacks, so it wouldn't do anything to protect a character from the force of a
// lightning bolt or fireball." An AC that silently included this would protect
// against arrows and fireballs, which the book rules out twice in one paragraph.
//
// ROUNDING IS UNSTATED. Both of the book's examples are 6th level, which divides
// evenly. Floor is used here -- a 5th-level wizard parries at +2 -- because 2e
// rounds down by default, and rounding up would make 5th level equal to 6th.
//
// MULTI- AND DUAL-CLASS ARE NOT ADDRESSED by the book either. Highest level is
// used, and the warrior +1 applies if ANY class qualifies, on the reading that a
// character parries with his best combat training.
function getParryBonus(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  let entries;

  if (charType === 'multi') {
    entries = [1, 2, 3].map(i => ({
      clazz: val(root, 'mc_class' + i) || '',
      level: parseInt(val(root, 'mc_level' + i) || 0, 10)
    }));
  } else if (charType === 'dual') {
    entries = [
      { clazz: val(root, 'dc_original_class') || '',
        level: parseInt(val(root, 'dc_original_level') || 0, 10) },
      { clazz: val(root, 'dc_new_class') || '',
        level: parseInt(val(root, 'dc_new_level') || 0, 10) }
    ];
  } else {
    entries = [{ clazz: val(root, 'clazz') || '',
                 level: parseInt(val(root, 'level') || 1, 10) }];
  }

  entries = entries.filter(e => e.clazz && e.level > 0);
  if (!entries.length) return null;

  const level = Math.max.apply(null, entries.map(e => e.level));
  const isWarrior = entries.some(e =>
    typeof isWarriorClass === 'function' && isWarriorClass(e.clazz));

  return {
    level: level,
    isWarrior: isWarrior,
    bonus: Math.floor(level / 2) + (isWarrior ? 1 : 0)
  };
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
// styleReduction is PHBR1 p.63's Two-Hander Style Specialization: -3 when the
// weapon is used two-handed. It STACKS with an enchantment's reduction and the
// floor at 0 is applied once, to the total, so a speed-2 dagger +1 held in a
// specialist's two hands cannot go negative.
function getEffectiveWeaponSpeed(speed, magicBonus, styleReduction) {
  const base  = parseInt(speed, 10);
  if (isNaN(base)) return null;

  const magic = parseInt(magicBonus, 10) || 0;

  // Only a positive enchantment speeds a weapon up. A cursed -1 weapon is not
  // made slower by this rule; the PHB only speaks of bonuses.
  const reduction = (magic > 0 ? magic : 0) + (parseInt(styleReduction, 10) || 0);

  return Math.max(0, base - reduction);
}

// ===========================================================================
// CLIMBING (PHB Ch.14, Tables 65-67)
// ===========================================================================

// Table 67: Rates of Climbing. Multiply by the character's CURRENT movement
// rate for feet per round, in any direction -- up, down or sideways.
//
// Stored as [numerator, denominator] rather than decimals so the panel prints an
// exact fraction and never shows 0.3333333333.
//
// null means the surface cannot be climbed under that condition AT ALL. The Ice
// wall row is blank on Dry and Slightly Slippery because an ice wall is slippery
// BY DEFINITION -- those columns do not exist. Very smooth is blank once wet
// because nobody can climb it. DO NOT FILL EITHER IN.
//
// Smooth-cracked and Rough share 1/3 and 1/4 despite differing when dry. The
// rows genuinely converge in the wet; that is the book, not a transcription slip.
//
// thiefRates carries the ** footnote: thieves alone have a very smooth /
// slightly slippery cell. It is a TABLE VALUE, so it doubles for thieves like
// every other cell -- the Ragnar worked example doubles 1/2 into 1. Even a thief
// cannot climb very smooth and slippery.
const CLIMBING_SURFACES = [
  { key: 'very_smooth',  label: 'Very smooth',     toolsOnly: true,
    rates:      { dry: [1,4], slight: null,  slippery: null },
    thiefRates: { dry: [1,4], slight: [1,4], slippery: null } },
  { key: 'smooth',       label: 'Smooth, cracked', toolsOnly: true,
    rates: { dry: [1,2], slight: [1,3], slippery: [1,4] } },
  { key: 'rough',        label: 'Rough',           toolsOnly: true,
    rates: { dry: [1,1], slight: [1,3], slippery: [1,4] } },
  { key: 'rough_ledges', label: 'Rough w/ledges',  toolsOnly: false,
    rates: { dry: [1,1], slight: [1,2], slippery: [1,3] } },
  { key: 'ice',          label: 'Ice wall',        toolsOnly: false,
    rates: { dry: null,  slight: null,  slippery: [1,4] } },
  { key: 'tree',         label: 'Tree',            toolsOnly: false,
    rates: { dry: [4,1], slight: [3,1], slippery: [2,1] } },
  { key: 'sloping',      label: 'Sloping wall',    toolsOnly: false,
    rates: { dry: [3,1], slight: [2,1], slippery: [1,1] } },
  { key: 'rope_wall',    label: 'Rope and wall',   toolsOnly: false,
    rates: { dry: [2,1], slight: [1,1], slippery: [1,2] } }
];

const CLIMBING_CONDITIONS = [
  { key: 'dry',      label: 'Dry' },
  { key: 'slight',   label: 'Slightly Slippery' },
  { key: 'slippery', label: 'Slippery' }
];

// Table 65: Base Climbing Success Rates. The two thief rows resolve against the
// character's own Climb Walls score rather than a printed number, so they carry
// no `base` -- getClimbingBase() supplies it.
const CLIMBING_CATEGORIES = {
  thief_mountaineer: { label: 'Thief with mountaineering proficiency',
                       fromClimbWalls: true, bonus: 10, note: 'Climb Walls % + 10%' },
  thief:             { label: 'Thief',
                       fromClimbWalls: true, bonus: 0,  note: 'Climb Walls %' },
  mountaineering:    { label: 'Mountaineering proficiency',
                       base: 40, perSlot: 10,           note: '40% + 10% per proficiency slot' },
  mountaineer:       { label: 'Mountaineer (DM ruling)',
                       base: 50,                        note: '50%' },
  unskilled:         { label: 'Unskilled climber',
                       base: 40,                        note: '40%' }
};

// Table 66: Climbing Modifiers -- the situational rows the player chooses.
const CLIMBING_MODIFIERS = {
  handholds:  { label: 'Abundant handholds (brush, trees, ledges)', mod:  40 },
  ropeWall:   { label: 'Rope and wall',                             mod:  55 },
  slopedIn:   { label: 'Sloped inward',                             mod:  25 },
  wounded:    { label: 'Climber wounded below half hit points',     mod: -10 }
};

// Table 66's surface-condition rows, keyed to CLIMBING_CONDITIONS so ONE
// dropdown drives both the Table 67 rate and this success modifier.
const CLIMBING_CONDITION_MODIFIERS = { dry: 0, slight: -25, slippery: -40 };

// Table 66 armor rows, keyed to ARMOR_TYPES so the stored construction type is
// what's read -- never the armor's name.
//
// THE TABLE DOES NOT LIST ring, hide OR brigandine. They are 0 here because the
// book omits them, not because they are weightless. Do not "complete" the list.
// Elven chain IS chain mail, so it takes the chain row as written.
const CLIMBING_ARMOR_MODIFIERS = {
  none: 0, leather: 0, ring: 0, hide: 0, brigandine: 0,
  padded: -5,  studded: -5,
  scale: -15,  chain: -15,  elven_chain: -15,  silenced_elven: -15,
  banded: -25, splint: -25,
  bronze_plate: -50, plate: -50, field_plate: -50, full_plate: -50
};

// Table 66 race rows. The footnote warns these duplicate Table 27, so a THIEF
// must not take them -- his Climb Walls score already carries the racial
// adjustment. getClimbingBase() is where that exclusion lives.
const CLIMBING_RACE_MODIFIERS = { dwarf: -10, gnome: -15, halfling: -15 };

// -5% per encumbrance category above unencumbered, OR per movement rate point
// lost off normal -- the two readings the dagger footnote offers.
const CLIMBING_ENCUMBRANCE_MOD = -5;

// The ARMOR_TYPES key of the equipped body armor, or 'none'. This is the same
// walk getThiefArmorCategory does, exposed under a name that isn't thief-specific
// -- climbing and swimming both need the construction type, and neither has
// anything to do with Table 29.
function getEquippedArmorTypeKey(root) {
  const cat = (typeof getThiefArmorCategory === 'function')
    ? getThiefArmorCategory(root) : null;
  return (cat && cat.typeKey) ? cat.typeKey : 'none';
}

// [1,4] -> '1/4'.  [4,1] -> '4'.  Table 67 prints exact fractions, so this
// formats rather than decimalising.
function climbFractionLabel(pair) {
  if (!pair) return '\u2014';
  return pair[1] === 1 ? String(pair[0]) : pair[0] + '/' + pair[1];
}

// THE THIEF TEST IS THE SCORE, NOT THE CLASS NAME. Any character with a Climb
// Walls percentage climbs as a thief -- which correctly picks up bards and any
// homebrew rogue without a list of class names to keep in sync.
function getClimbWallsScore(root) {
  return parseInt(val(root, 'thief_climb'), 10) || 0;
}

// Table 67. Returns feet per round, or blocked:true where the cell is empty.
// Verified against the chapter's worked example: Ragnar (thief, move 12) on
// rough w/ledges slightly slippery is 12 x 1/2 x 2 = 12 ft/round, and Rupert
// (nonthief, move 8) is 8 x 1/2 = 4. Rounding down is UNSTATED in the book;
// floor is chosen for the same reason as the parry bonus.
function getClimbingRate(root, surfaceKey, conditionKey, currentMovement) {
  const surf = CLIMBING_SURFACES.filter(s => s.key === surfaceKey)[0];
  if (!surf) return null;

  const isThief = getClimbWallsScore(root) > 0;
  const table   = (isThief && surf.thiefRates) ? surf.thiefRates : surf.rates;
  const pair    = table[conditionKey];

  if (!pair) return { blocked: true, surface: surf, isThief: isThief };

  const mult = (pair[0] / pair[1]) * (isThief ? 2 : 1);
  return {
    blocked: false, surface: surf, isThief: isThief, pair: pair,
    label: climbFractionLabel(pair),
    feetPerRound: Math.floor((parseInt(currentMovement, 10) || 0) * mult)
  };
}

// Total slots invested in Mountaineering, including any spent to improve it.
// 0 means the character does not have the proficiency.
function getMountaineeringSlots(root) {
  const p = ((root && root._nwps) || []).filter(n =>
    String((n && n.name) || '').trim().toLowerCase() === 'mountaineering')[0];
  if (!p) return 0;
  return (parseInt(p.slots, 10) || 1) + (parseInt(p.bonusSlots, 10) || 0);
}

// Which Table 65 row applies. dmMountaineer is the player's tickbox for the
// "Mountaineer (decided by DM)" row, which has no mechanical trigger to detect.
function getClimbingCategory(root, dmMountaineer) {
  const hasClimbWalls = getClimbWallsScore(root) > 0;
  const slots = getMountaineeringSlots(root);
  if (hasClimbWalls && slots > 0) return 'thief_mountaineer';
  if (hasClimbWalls)              return 'thief';
  if (slots > 0)                  return 'mountaineering';
  if (dmMountaineer)              return 'mountaineer';
  return 'unskilled';
}

// Table 65. Returns the base percentage before any Table 66 modifier.
//
// "40% + 10% per proficiency slot" is read as PER SLOT HELD, not per extra slot:
// one slot gives 50%, which is what makes the chapter's own claim true that a
// mountaineer climbs better than an unskilled character. The other reading puts
// him at 40%, level with unskilled, and the prose contradicts it.
function getClimbingBase(root, dmMountaineer) {
  const key = getClimbingCategory(root, dmMountaineer);
  const cat = CLIMBING_CATEGORIES[key];
  let pct;

  if (cat.fromClimbWalls) {
    pct = getClimbWallsScore(root) + (cat.bonus || 0);
  } else if (cat.perSlot) {
    pct = cat.base + cat.perSlot * getMountaineeringSlots(root);
  } else {
    pct = cat.base;
  }

  return { key: key, label: cat.label, note: cat.note, percent: pct,
           fromClimbWalls: !!cat.fromClimbWalls };
}

const CLIMBING_ENCUMBRANCE_ORDER =
  ['Unencumbered', 'Light', 'Moderate', 'Heavy', 'Severe', 'Overloaded!'];

// How many -5% steps the character's load costs him.
//
// Table 66's dagger footnote gives TWO readings -- per encumbrance category
// above unencumbered, OR per movement rate point lost off normal -- and which
// one is live follows the encumbrance optional rule. With it ON the character's
// movement really has been reduced, so points lost is the true figure. With it
// OFF nothing has moved and the category name is all there is to count.
function getClimbingEncumbranceSteps(root) {
  const usingPenalties = (typeof isOptionalRule === 'function') &&
                         isOptionalRule('encumbrancePenalties');

  if (usingPenalties &&
      root._baseMovement !== undefined && root._currentMovement !== undefined) {
    return Math.max(0, root._baseMovement - root._currentMovement);
  }

  const cat = String(val(root, 'encumbrance_category') || '').trim();
  const idx = CLIMBING_ENCUMBRANCE_ORDER.indexOf(cat);
  return idx > 0 ? idx : 0;
}

// Table 65 base with every Table 66 modifier applied. Returns the percentage
// plus an itemised breakdown, so the panel can show its working rather than a
// bare number the player has to trust.
//
// RACE IS SKIPPED FOR THIEVES, ARMOR IS NOT, and that asymmetry is deliberate.
// Table 66's footnote names race and only race: a thief's Climb Walls score
// already carries the Table 27 racial adjustment, so applying it again would
// penalise him twice. The book says nothing of the kind about armor, so armor
// applies to everyone as printed. Do not "even this up" in either direction.
function getClimbingSuccess(root, opts) {
  opts = opts || {};
  const base  = getClimbingBase(root, opts.dmMountaineer);
  const parts = [];

  ['handholds', 'ropeWall', 'slopedIn', 'wounded'].forEach(k => {
    if (opts[k] && CLIMBING_MODIFIERS[k]) {
      parts.push({ label: CLIMBING_MODIFIERS[k].label, mod: CLIMBING_MODIFIERS[k].mod });
    }
  });

  const armorKey = getEquippedArmorTypeKey(root);
  const armorMod = CLIMBING_ARMOR_MODIFIERS[armorKey] || 0;
  if (armorMod) {
    const lbl = (typeof ARMOR_TYPES !== 'undefined' && ARMOR_TYPES[armorKey])
      ? ARMOR_TYPES[armorKey].label : armorKey;
    parts.push({ label: 'Armor: ' + lbl, mod: armorMod });
  }

  if (!base.fromClimbWalls) {
    const race = String(val(root, 'race') || '').trim().toLowerCase();
    Object.keys(CLIMBING_RACE_MODIFIERS).forEach(r => {
      if (race.indexOf(r) !== -1) {
        parts.push({ label: r.charAt(0).toUpperCase() + r.slice(1), mod: CLIMBING_RACE_MODIFIERS[r] });
      }
    });
  }

  const steps = getClimbingEncumbranceSteps(root);
  if (steps > 0) {
    parts.push({ label: 'Encumbrance (' + steps + ')', mod: CLIMBING_ENCUMBRANCE_MOD * steps });
  }

  const condMod = CLIMBING_CONDITION_MODIFIERS[opts.condition] || 0;
  if (condMod) {
    const c = CLIMBING_CONDITIONS.filter(x => x.key === opts.condition)[0];
    parts.push({ label: 'Surface: ' + ((c && c.label) || opts.condition), mod: condMod });
  }

  let total = base.percent;
  parts.forEach(p => { total += p.mod; });

  return { base: base, parts: parts, percent: Math.max(0, total) };
}

// PHB Ch.14 swimming. THREE CORRECTIONS to what the sheet did before:
// the rate is HALF current movement (not a third), the gate is METAL armor
// (not any armor at all), and the figure is YARDS per round (not feet). The old
// 1/3 was the walking-on-the-bottom rate, lifted from the very next sentence.
//
// Verified against the book's example: movement 12 swims 60 yards (180 feet)
// in a round. Half the rate is NOT floored to whole inches first -- 9 gives
// 45 yards, not 40 -- because nothing in the chapter rounds the rate itself.
function getSwimmingState(root, baseMovement, currentMovement) {
  const base = parseInt(baseMovement, 10) || 0;
  const cur  = parseInt(currentMovement, 10) || 0;

  const armorKey  = getEquippedArmorTypeKey(root);
  const armorData = (typeof ARMOR_TYPES !== 'undefined') ? ARMOR_TYPES[armorKey] : null;
  const metal     = !!(armorData && armorData.metal);

  // "reduced to 1/3 or less of normal (due to gear)" -- the second sink clause.
  const crushed = base > 0 && cur <= base / 3;
  const blocked = metal || crushed;

  // Ch.14 opens by dividing everyone into untrained and proficient swimmers.
  // Untrained characters get a dog-paddle in calm water and "in no way do they
  // make any noticeable progress", so they are given NO rate -- the DM decides
  // whether a character can swim at all, and the proficiency is the one signal
  // the sheet actually holds.
  const proficient = ((root && root._nwps) || []).some(n =>
    String((n && n.name) || '').trim().toLowerCase() === 'swimming');

  // Double speed on a Strength check "vs. half the character's normal Strength
  // score". Halving is floored; the book does not say, and floor is the harder
  // reading -- same choice as the parry bonus.
  const str = parseInt(val(root, 'str'), 10) || 0;

  return {
    proficient: proficient,
    metalArmor: metal,
    armorLabel: (armorData && armorData.label) || '',
    crushed:    crushed,
    blocked:    blocked,
    swimYards:   blocked ? 0 : cur * 5,
    sprintYards: blocked ? 0 : cur * 10,
    sprintCheck: Math.floor(str / 2),
    bottomYards: Math.round((cur / 3) * 10)
  };
}

// PHB Ch.14, "Holding Your Breath". 1/3 Constitution in rounds, rounded up;
// halved (again rounded up) while exerting; halved again with no good gulp of
// air. THE FLOOR OF ONE ROUND IS ABSOLUTE -- "All characters are able to hold
// their breath for one round, regardless of circumstances" -- so a Constitution
// 3 character caught mid-exertion still gets his round.
//
// A character reduced to 1/3 or less of normal movement by encumbrance is
// ALWAYS considered to be exerting himself; that test is the caller's, because
// it needs both movement figures.
function getBreathHolding(root) {
  const con      = parseInt(val(root, 'con'), 10) || 0;
  const normal   = Math.max(1, Math.ceil(con / 3));
  const exerting = Math.max(1, Math.ceil(normal / 2));
  return {
    con: con,
    normal:         normal,
    exerting:       exerting,
    noGulp:         Math.max(1, Math.ceil(normal / 2)),
    noGulpExerting: Math.max(1, Math.ceil(exerting / 2))
  };
}

// Diving and surfacing, both 20 feet per round before load. `steps` is the same
// count getClimbingEncumbranceSteps returns -- categories above unencumbered, or
// movement points lost, depending on the encumbrance rule.
//
// The height bonus caps at +20, and the cap covers the HEIGHT component only,
// not the run. The book's own example is the proof: a run from 40 feet dives 50
// feet, which is 20 base + 10 run + 20 capped height.
function getDivingSurfacing(root, steps, heightFeet, hasRun) {
  const n    = Math.max(0, parseInt(steps, 10) || 0);
  const rate = Math.max(0, 20 - 2 * n);
  const h    = Math.max(0, parseInt(heightFeet, 10) || 0);

  const runBonus    = (hasRun || h > 0) ? 10 : 0;
  const heightBonus = Math.min(20, Math.floor(h / 10) * 5);

  return {
    steps:       n,
    diveFirst:   rate + runBonus + heightBonus,
    diveBase:    rate,
    runBonus:    runBonus,
    heightBonus: heightBonus,
    surfaceRate: rate,
    // "heavily loaded characters (those who have lost 10 or more points off
    // their normal movement rate) cannot even swim to the surface."
    cannotSurface: n >= 10,
    floatRate:     Math.max(0, rate - 5)
  };
}

// PHB Ch.14, "Cross-Country Movement". A normal day's march is 10 hours
// including reasonable stops for rest and meals, covering twice the movement
// rate in MILES -- an unencumbered human walks 24 miles across clear terrain.
// Force marching covers 2 1/2 times the rate, so that same man makes 30.
//
// `days` counts consecutive days of FORCE marching only. Ordinary marching
// costs nothing, needs no check, and carries no penalty.
//
// THE PENALTY COUNTS THE CURRENT DAY: one day of force marching is -1, not 0.
// The chapter settles this twice over -- Ragnar takes a -1 Constitution check
// after his FIRST round at triple speed, and the book's own eight-day force
// march figure is -8 rather than -7.
function getOverlandMovement(root, currentMovement, days) {
  const cur = parseInt(currentMovement, 10) || 0;
  const d   = Math.max(0, parseInt(days, 10) || 0);
  const con = parseInt(val(root, 'con'), 10) || 0;

  return {
    days:          d,
    normalMiles:   cur * 2,
    forceMiles:    cur * 2.5,
    // Large parties check against the party's AVERAGE Constitution, and
    // creatures with no Constitution score save vs. death instead. Both are
    // DM-side, so the sheet reports only this character's own number.
    conCheck:      con - d,
    // Cumulative, and it applies to ALL attack rolls -- not just melee.
    attackPenalty: -d,
    // Half a day's rest clears one day's attack penalty. The same half-day-per-
    // day figure is what allows force marching to resume after a failed check.
    restDays:      d / 2
  };
}

// === Tools tab sub-tabs ===
//
// One entry per panel on the Tools tab. The strip renders from this list, so
// adding a panel later is an entry here and nothing else -- same bargain as
// OPTIONAL_RULES.
//
// ORDER IS BY PERMANENCE, and that is the whole rule. Universal first, then race
// (fixed at creation), then class (can change on a dual-class), then kit (most
// mutable, most likely homebrewed), then the universal reference panels. The
// strip is therefore most stable on the left and never moves at all on the right.
// A new panel does not need a discussion, only an answer to "what gates it?"
//
// `section` is the class on the panel's <section>.
// `band`    is the ordering group above; entries are rendered in array order.
// `gated`   false means the tab is always present.
// `label`   is the tab text. `labelFrom` overrides it by reading an element
//           inside the panel, for a heading the panel computes for itself.
//
// APPLICABILITY IS THE PANEL'S INLINE display, NOT A SECOND COPY OF ITS RULE.
// renderThiefSkills, renderTurnUndead and renderRacialChecks already decide
// whether their section applies and write section.style.display. Re-deriving
// "is this character a thief" here would give the app two answers that can
// drift, and a drifted gate means either a tab with an empty panel behind it or
// a panel with no tab to reach it. The strip reads their answer instead.
const TOOLS_SUBTABS = [
  { key: 'dice',     label: 'Dice',              section: 'dice-rollers-section',   band: 'universal', gated: false },
  { key: 'racial',   label: 'Racial Abilities',  section: 'racial-checks-section',  band: 'race',      gated: true,
    labelFrom: '.racial-checks-title' },
  // THE THREE THIEF PANELS SIT TOGETHER. All three are gated on the character
  // being a thief, so all three are band 'class' by the permanence rule above --
  // Thief Equipment was briefly filed under 'reference', which pushed it past
  // Climbing, Armor Fitting and Maneuvers and split it from Thief Skills.
  { key: 'thief',    label: 'Thief Skills',      section: 'thief-skills-section',   band: 'class',     gated: true },
  // Gated: renderThiefEquipment hides the section when the PHBR2 band is off,
  // and toolsSubtabApplies reads that display to decide whether the tab exists.
  { key: 'thiefequip', label: 'Thief Equipment', section: 'thief-equip-section',    band: 'class',     gated: true },
  // WAS NEVER REGISTERED HERE AT ALL. renderToolsSubtabs hides non-active panels
  // by walking this array, so an unregistered section is never hidden and showed
  // up underneath every sub-tab. Fixed August 2026.
  { key: 'thiefrules', label: 'Thief Rules',     section: 'advanced-thief-section', band: 'class',     gated: true },
  { key: 'turning',  label: 'Turn Undead',       section: 'turn-undead-section',    band: 'class',     gated: true },
  // GATED on carrying a qualifying weapon, not on class or race -- at most ten
  // weapons in the book have a breakage rule and most characters carry none.
  // renderWeaponBreakage hides the section when the list is empty, which is
  // what toolsSubtabApplies reads.
  { key: 'breakage', label: 'Weapon Breakage',   section: 'weapon-breakage-section', band: 'class',    gated: true },
  { key: 'climbing', label: 'Climbing',          section: 'climbing-section',       band: 'reference', gated: false },
  // UNGATED. Anyone can loot armor, so there is nothing to gate on -- unlike the
  // class and race panels above. Reference, like Climbing and Cover.
  { key: 'fitting',  label: 'Armor Fitting',     section: 'armor-fitting-section',  band: 'reference', gated: false },
  // Gated: the renderer hides the section when the band is off, and
  // toolsSubtabApplies reads that display to decide whether the tab exists.
  { key: 'maneuvers', label: 'Maneuvers',        section: 'maneuvers-section',      band: 'reference', gated: true },
  { key: 'vision',   label: 'Vision & Light',    section: 'vision-light-section',   band: 'reference', gated: false },
  { key: 'cover',    label: 'Cover',             section: 'cover-reference-section',band: 'reference', gated: false },
  { key: 'overland', label: 'Overland',          section: 'overland-section',       band: 'reference', gated: false }
];

// The fallback tab. Always present, so it is always a valid destination -- which
// is what makes it the right landing spot when the active tab stops applying
// mid-session (dual-classing out of thief while Thief Skills is open).
const TOOLS_SUBTAB_DEFAULT = 'dice';

// Is a panel applicable to this character? Reads the INLINE display property
// only, which is what the three gating renderers write. The tab layer hides
// non-active panels with a CSS class instead, so the two never collide.
function toolsSubtabApplies(root, tab) {
  if (!tab.gated) return true;
  const el = root.querySelector('.' + tab.section);
  if (!el) return false;
  return el.style.display !== 'none';
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
// Two categories, rendered as separate sections in the Settings modal:
//   'phb'      -- rules the PHB itself marks optional. Enabling or disabling
//                 one is playing by the book either way.
//   'override' -- checks the app performs that the PHB states flatly. Turning
//                 one OFF is a house rule, so these default ON and exist mainly
//                 to silence a warning a DM has already waived.
// Entries with no category are treated as 'phb'.
const OPTIONAL_RULES = {
  parrying: {
    label:   'Parrying (forfeit the round for an AC bonus)',
    detail:  'PHB Ch.9. A character may parry -- forfeiting ALL actions for the round, ' +
             'no attack, no movement, no spells -- to gain an AC bonus of half his level, ' +
             'or half his level plus one for warriors. The bonus applies ONLY against ' +
             'frontal melee attacks: it does nothing against rear attacks, missiles, or ' +
             'magic. Shown as a separate figure in the Combat Quick Reference and never ' +
             'folded into Armor Class, because AC applies to everything.',
    category: 'phb',
    default: false
  },
  weaponSpeedInitiative: {
    label:   'Weapon speed factor modifies initiative',
    detail:  'PHB Table 56. Weapon speed is added to the initiative roll (low roll wins). ' +
             'Magical bonuses reduce speed factor by 1 per plus, minimum 0.',
    category: 'phb',
    // DEFAULTS POLICY: 'phb' entries ship OFF -- the book presents them as
    // additions to the base game, so ticking one is always the departure.
    // This mirrors 'override' entries, which ship ON because there the book's
    // rule is the default and unticking is the departure. Either way the
    // shipped state is the book as written, and no default reflects any one
    // table's house habits.
    default: false
  },
  spellCastingTimeInitiative: {
    label:   'Spell casting time modifies initiative',
    detail:  'PHB Ch.7. Where a spell\'s casting time is given as a bare number, that number ' +
             'is added to the initiative roll (low roll wins) -- the spell equivalent of weapon ' +
             'speed factor. Spells timed in rounds or turns are NOT modifiers: they resolve at ' +
             'the end of the stated round or turn instead, so a "1 round" spell is slower than ' +
             'a "1" spell, not faster.',
    category: 'phb',
    default: false
  },
  deityPowerLevel: {
    label:   'Patron deity power limits priest spell levels',
    detail:  'PHB Ch.7. "Your DM may rule that not all deities are equal." Demi-gods grant ' +
             'spells up to 5th level, lesser deities up to 6th, greater deities all levels. ' +
             'Set the patron\'s status on the Details tab; an unset patron is treated as a ' +
             'greater deity and is not restricted.',
    category: 'phb',
    default: false
  },
  spellComponents: {
    label:   'Spell components (V/S/M) are required',
    detail:  'PHB Ch.7. Without this rule every spell needs the caster to speak AND have ' +
             'both arms free. With it, a spell needs only what it lists -- so a verbal-only ' +
             'spell can be cast while bound, and a somatic-only spell inside a silence. ' +
             'Adds the casting conditions to each spell\'s detail panel.',
    category: 'phb',
    default: false
  },
  encumbrancePenalties: {
    label:   'Encumbrance affects movement and combat',
    detail:  'PHB "Effects of Encumbrance". Light x2/3 movement, Moderate x1/2 and -1 attack, ' +
             'Heavy x1/3 and -2 attack / +1 AC, Severe movement 1 and -4 attack / +3 AC. ' +
             'Encumbrance is itself an Optional Rule in the PHB, so ignoring it is RAW.',
    category: 'phb',
    default: false     // Chris's table does not use encumbrance
  },
  druidArmorRestriction: {
    label:   'Restrict druids to leather armor (PHB)',
    detail:  'PHB Ch.3: a druid may use "only \'natural\' armors -- leather armor and wooden ' +
             'shields... All other armors are forbidden to him." Unticking widens the list to ' +
             'padded, leather and hide, a common house reading based on avoiding metal. ' +
             'Advisory only; nothing is ever blocked.',
    category: 'override',
    default: true      // checked = the book's rule
  },
  weaponSpecialization: {
    label:   'Weapon specialization',
    detail:  'PHB Ch.5, an optional rule. A SINGLE-CLASS FIGHTER may specialize in one weapon ' +
             '-- not rangers, paladins, multi-class or dual-class characters. Costs 2 proficiency ' +
             'slots for a melee weapon or crossbow, 3 for any other bow. Melee specialists gain ' +
             '+1 to hit and +2 damage; bow and crossbow specialists gain a point-blank range ' +
             'category instead. Extra attacks come from Table 35, except for bows, which gain none.',
    category: 'phb',
    default: false
  },
  classAbilityMinimums: {
    label:   'Warn when ability scores are below class minimums',
    detail:  'PHB Table 13. Each class has minimum scores a character must meet to belong to ' +
             'it -- a paladin needs Strength 12, Constitution 9, Wisdom 13 and Charisma 17, for ' +
             'example. Specialist wizards are covered separately by Table 22. Advisory only; ' +
             'nothing is blocked, and the PHB itself allows a DM to permit a reroll or a raise.',
    category: 'override',
    default: true
  },
  nonProficiencyPenalty: {
    label:   'Apply non-proficiency attack penalties',
    detail:  'PHB Table 34. A character attacking with a weapon he is not proficient in takes a ' +
             'penalty to his attack roll -- warrior -2, priest and rogue -3, wizard -5, halved ' +
             'and rounded up for a related weapon. Chapter 5 is optional in full, but this is ' +
             'the only part of it that imposes itself on a table that ignores proficiencies: ' +
             'with an empty proficiency list every weapon is penalised. Switch off to silence ' +
             'the penalty and the weapon status stripes entirely.',
    category: 'override',
    default: true
  },
  classGroupLegality: {
    label:   'Warn on illegal class combinations',
    detail:  'PHB Ch.3 allows only one class from each group -- warrior, wizard, priest, rogue. ' +
             'Fighter/paladin, thief/bard and cleric/druid are therefore not legal multi- or ' +
             'dual-class combinations. Advisory only; nothing is ever blocked. Switch off if ' +
             'your DM has approved a combination and you would rather not see the banner.',
    category: 'override',
    default: true      // the tool's job is rules accuracy; opting out is deliberate
  },
  raceAbilityRequirements: {
    label:   'Warn when ability scores fall outside racial limits',
    detail:  'PHB Table 7. Every demihuman race has a minimum and a maximum for each ability. ' +
             'The check runs against the ROLLED score, not the one on the sheet -- the Table 8 ' +
             'racial adjustment is backed out first, so an elf showing Constitution 6 is read as ' +
             'a rolled 7 and passes. Humans have no limits and are never checked. Advisory only; ' +
             'nothing is blocked.',
    category: 'override',
    default: true
  },
  raceClassLegality: {
    label:   'Warn on classes a race may not take',
    detail:  'PHB Chapter 2. Each demihuman race has a fixed list of classes -- a dwarf may be a ' +
             'cleric, fighter or thief; a gnome may take the illusionist but not the plain mage; ' +
             'paladins are human-only. Specialist wizards defer to Table 22, and homebrew classes ' +
             'are never judged. Advisory only; nothing is blocked. This is a common place for a DM ' +
             'to allow an exception.',
    category: 'override',
    default: true
  },
  classAlignmentRequirements: {
    label:   'Warn when alignment conflicts with the class',
    detail:  'PHB Chapter 3. A paladin must be lawful good and must always remain lawful good; ' +
             'a ranger is always good; a druid must be neutral; a thief may be any alignment ' +
             'except lawful good; a bard must always be partially neutral. Fighters, wizards and ' +
             'clerics have no restriction -- a cleric takes any alignment acceptable to his order, ' +
             'which is the DM\'s call. Homebrew classes are never judged. Advisory only; nothing ' +
             'is blocked.',
    category: 'override',
    default: true
  },
  kitAlignmentRequirements: {
    label:   'Warn when alignment conflicts with the kit',
    detail:  'Kits carry their own alignment requirements from the Complete handbooks -- the ' +
             'Cavalier is lawful good, the Wanderer is neutral, the Feralan is partially neutral. ' +
             'These stack with the class requirement rather than replacing it. Kits whose ' +
             'requirement depends on the character\'s deity are reported but never judged. ' +
             'Advisory only; nothing is blocked.',
    category: 'override',
    default: true
  },
  agingEffects: {
    label:   'Show aging effects for the entered age',
    detail:  'PHB Tables 11 and 12. On reaching middle age, old age and venerable age a character ' +
             'takes cumulative ability score adjustments -- -1 Str, -1 Con, +1 Int and +1 Wis at ' +
             'middle age, and further sets after that. The app reports which bracket the character ' +
             'has reached and the running total; it never changes a score. Switch off to hide the ' +
             'notice entirely.',
    category: 'override',
    default: true
  },
  coinWeight2e: {
    label:   'Coins weigh 1/50 lb (2nd Edition)',
    detail:  'PHB Chapter 6 never states a coin weight, so neither figure is RAW from the ' +
             'Player\'s Handbook alone. Checked uses the 2nd Edition figure of 50 coins to the ' +
             'pound, which comes from the DMG\'s encumbrance rules. Unticked uses the 1st ' +
             'Edition figure of 10 coins to the pound, still common at many tables. Affects ' +
             'the coin weight field and therefore the encumbrance total.',
    // Moved out of 'override': there is no PHB coin weight, so "checked" could
    // never mean the book's rule. Settings persist by KEY, so an existing
    // preference survives the move.
    category: 'table',
    default: true      // checked = the 2e figure, the commoner reading
  },
  ammoBonusStacks: {
    label:   'Enchanted ammunition stacks with an enchanted launcher',
    detail:  'The PHB does not say whether a +1 arrow fired from a +1 bow gives +2 or +1. ' +
             'Checked adds both. Unticked takes the better of the two, which is the reading ' +
             'that stops enchanted ammunition being worthless to anyone holding a magic bow. ' +
             'Neither is more correct than the other -- ask your DM.',
    category: 'table',
    default: true
  },
  henchmanLimits: {
    label:   'Warn on Charisma henchman limits',
    detail:  'PHB Chapter 12. Charisma sets the maximum number of henchmen a character may ' +
             'have, and the chapter is explicit that this is a LIFETIME limit -- its own ' +
             'example is a Charisma 15 character whose seven henchmen have all died, and no ' +
             'more come. Retired, deceased and missing henchmen therefore all count. The ' +
             'check also reports any active henchman who has reached the character\'s own ' +
             'level, since Chapter 12 says such a henchman "leaves forever." Advisory only; ' +
             'nothing is blocked and no henchman is ever removed for you.',
    category: 'override',
    default: true
  },
  joggingAndRunning: {
    label:   'Jogging and running (exact chase speeds)',
    detail:  'PHB Ch.14, printed in a box headed "(Optional Rule)". A character can always ' +
             'jog at double his movement rate in yards, sustained for a number of rounds equal ' +
             'to his Constitution. Running is triple rate on a successful Strength check, ' +
             'quadruple at -4 and quintuple at -8, with a cumulative Constitution check every ' +
             'round after that. Without this rule the chapter settles a chase by comparing ' +
             'initiative dice instead, so the sheet shows no running figure at all.',
    category: 'phb',
    default: false
  },
  rangerTrackingCRH: {
    label:   'Ranger tracking: use the Complete Ranger\'s Handbook tables',
    detail:  'PHBR11 Tables 15\u201317 (p.15), which the book states may be used in place ' +
             'of PHB Table 39. Base is the ranger\'s Wisdom either way. Owned by the ' +
             '\u201cApply PHBR11 core rules\u201d toggle.',
    category: 'supplement',
    default: false
  },
  rangerDruidCRH: {
    label:   'Allow the half-elf ranger/druid multi-class',
    detail:  'PHBR11 p.79, printed as an Optional Rule. The PHB precludes this combination ' +
             'on alignment grounds -- a ranger must be good, a druid must be true neutral, ' +
             'and no alignment satisfies both. The CRH allows it where the campaign has a ' +
             'nature deity of good alignment whose specialty priests are druidic, AND that ' +
             'priesthood has an allied group of rangers. Both are your DM\'s call, not the ' +
             'app\'s: ticking this only stops the alignment warning for a ranger/druid. ' +
             'NOT ENFORCED: the CRH caps such a character at 16th level ranger and 9th ' +
             'level druid, and this app models no racial or class level limits at all.',
    category: 'supplement',
    default: false
  },
  rangerArmorStealthCRH: {
    label:   'Ranger stealth: use the Complete Ranger\'s Handbook armor table',
    detail:  'PHBR11 Tables 11 and 13. The PHB gives rangers no armor percentages and ' +
             'rules that hiding in shadows and moving silently are simply not possible ' +
             'in anything heavier than studded leather. The CRH replaces that with a ' +
             'sliding scale: +5%/+10% in no armor, no change in leather, -20%/-20% in ' +
             'padded or studded, -30%/-40% in ring mail, down to -95%/-95% in full ' +
             'plate. Ticking this ALSO lifts the studded-leather ceiling, since under ' +
             'the CRH a ranger in heavy armor keeps a reduced chance rather than none. ' +
             'The Justifier and Stalker kits both reference this table.',
    category: 'supplement',
    default: false
  },
  styleSpecializationPHBR1: {
    label:   'Fighting styles: Style Specialization (Complete Fighter\\u2019s Handbook)',
    detail:  'PHBR1 pp.61\\u201364. Four melee fighting styles \\u2014 Single-Weapon, ' +
             'Two-Hander, Weapon and Shield, Two-Weapon \\u2014 which every character ' +
             'already knows some of, by class, from the moment he is created. A weapon ' +
             'proficiency slot may be spent to SPECIALIZE in one. Only single-class ' +
             'Warriors may ever hold more than one specialization; only Warriors and ' +
             'Rogues may specialize in Two-Weapon Style. Single-Weapon Style is the ' +
             'only style that alters Armor Class, and only while one hand is empty; ' +
             'the others change speed factor, damage, attack penalties, or grant an ' +
             'extra attack usable solely for Shield-Punch and Parry. Turning this off ' +
             'suspends the effects without disturbing anything the player entered.',
    category: 'supplement',
    default: false
  }
};
// ===== Supplements (the Complete Handbooks and friends) =====
// ONE ROW PER BOOK, not one per rule. Fifteen handbooks with several conflicts
// each would be forty-odd checkboxes nobody reads, and the book is the real
// unit of consent anyway -- a table says "we use the Complete Ranger's
// Handbook", not "we use Table 11 but not Table 53".
//
// TWO TOGGLES PER BOOK, and the split is the book's own, not ours:
//
//   core     -- rules the book STATES. These change numbers. Ship OFF, so
//               unticked is always the PHB.
//   optional -- experiments the book itself flags as optional, in a box or
//               with "if your table wants to try this". These SUPPRESS
//               WARNINGS and enforce nothing. Ticking one means "stop telling
//               me this is illegal", so a table can build a demi-ranger without
//               the sheet complaining on every render.
//
// The distinction matters: bundling an optional experiment into "apply this
// book" would make a DM's judgement call automatic, and bundling a stated rule
// into "suppress warnings" would hide a real change behind a permissive label.
//
// `rules` lists the OPTIONAL_RULES keys the toggle owns. isOptionalRule()
// delegates for those keys, so every existing call site keeps working unchanged
// -- the rules stay the implementation layer and the book becomes the consent
// layer above it.
//
// `order` is the publication number, so the list reads PHBR1, PHBR2, ... and
// the Ranger's Handbook sits eleventh whenever the rest arrive.
const SUPPLEMENTS = {
  phbr1: {
    code:  'PHBR1',
    title: 'The Complete Fighter\u2019s Handbook',
    order: 1,

    // SIX BANDS, NOT ONE. This book adds six independent systems, and an
    // all-or-nothing toggle made a table that wanted weapon groups also take
    // piecemeal armour. `bandOrder` lets a book declare its own bands; a book
    // without it falls back to ['core','optional'], so PHBR11 is untouched.
    //
    // Every band carries `legacyBand`, which is what stops this change altering
    // any existing table's rules: a band with no stored value of its own reads
    // the old `phbr1.core` or `phbr1.optional` key instead. Somebody who ticked
    // "core" gets all five on, exactly as before.
    //
    // NOT GATED BY ANY BAND, deliberately: the PHBR1 weapon proficiency
    // RELATIONSHIPS, the same-proficiency pairs, baseWeapon variants, kit weapon
    // permission, the stone/bone and lance breakage notes, and the Armor Fitting
    // panel. All are CONTENT THE BOOK ADDS rather than rules that change core
    // arithmetic -- a stone dagger only exists because PHBR1 prints it, so a
    // table not using the book cannot be holding one.
    bandOrder: ['fightingStyles', 'weaponGroups', 'weaponQuality',
                'armorQuality', 'piecemealArmor', 'meleeManeuvers',
                'tightGroupsAsRelated'],

    fightingStyles: {
      label: 'Fighting styles',
      hint:  'Style specialization bought with weapon proficiency slots.',
      rules: ['styleSpecializationPHBR1'],
      legacyBand: 'core',
      changes: [
        { text: 'Fighting Styles and Style Specialization (pp.61\u201364). Every ' +
                'character already knows some styles by class and can never learn more ' +
                'after creation: Warriors know all four, Priests Single-Weapon, ' +
                'Two-Hander and Weapon and Shield, Rogues Single-Weapon, Two-Hander and ' +
                'Two-Weapon, Wizards Single-Weapon and Two-Hander. Specializing costs a ' +
                'weapon proficiency slot. Single-Weapon Style Specialization is the only ' +
                'one that changes Armor Class: \u22121 for one slot and \u22122 for two, ' +
                'and only while wielding a one-handed weapon you are proficient with and ' +
                'carrying nothing in the other hand \u2014 no shield, no second weapon.',
          caveat: 'Unticking SUSPENDS the bonus; it never refunds the slots or deletes ' +
                  'the specialization. The purchase stays on the character, greyed, and ' +
                  'returns intact when the book is switched back on.' }
      ]
    },

    weaponGroups: {
      label: 'Weapon groups',
      hint:  'Buy proficiency in a whole category of weapons at once.',
      rules: ['weaponGroupsPHBR1'],
      legacyBand: 'core',
      changes: [
        { text: 'Tight and Broad weapon groups (pp.58\u201360). A TIGHT group costs 2 ' +
                'proficiency slots and a BROAD group 3, and either grants full ' +
                'proficiency in every weapon it lists \u2014 sixteen tight groups from Axes ' +
                'to Whips, and four broad ones. A group can never be specialized in as a ' +
                'whole: buy the group, then specialize the individual weapon at its ' +
                'normal cost. The weapon browser offers that directly on any weapon a ' +
                'group already covers.' },
        { text: 'Ten weapons belong to no group at all and must each be bought ' +
                'separately: arquebus, blowgun, bola, chain, gaff/hook, lasso, net, ' +
                'quarterstaff, nunchaku and sai.',
          caveat: 'Unticking SUSPENDS a group: the record stays on the character, costs ' +
                  'nothing and grants nothing, and returns intact when switched back on.' }
      ]
    },

    weaponQuality: {
      label: 'Weapon quality',
      hint:  'Poor, Fine and Exceptional craftsmanship on individual weapons.',
      rules: ['weaponQualityPHBR1'],
      legacyBand: 'core',
      changes: [
        { text: 'Weapon quality (pp.11\u201313), as a dropdown on each weapon. Poor is ' +
                '\u22121 to hit and damage and breaks on a natural attack roll of 1\u20135. ' +
                'Fine grants +1 to hit OR +1 damage, not both. Exceptional grants both. ' +
                'Quality is NOT magical: it never lets a weapon harm a creature only ' +
                'magical weapons can hurt, and it does not reduce speed factor.',
          caveat: 'The control disappears when this is off, because quality is a PHBR1 ' +
                  'invention \u2014 a DM not using the book is not handing out Fine weapons. ' +
                  'Any quality already recorded is kept and returns when switched on.' }
      ]
    },

    armorQuality: {
      label: 'High-quality racial armor',
      hint:  'Elven, dwarven, gnomish and other racially-made armor.',
      rules: ['armorQualityPHBR1'],
      legacyBand: 'core',
      changes: [
        { text: 'High-quality racial armor (pp.110\u2013111), as a dropdown on each armor ' +
                'card. Elven is half weight and half-elven 10% lighter. Gnomish studded ' +
                'and padded leather takes NO penalties on the thieving skill table, and ' +
                'halfling leather counts as \u201cNo Armor\u201d there. Human plate, field ' +
                'plate and full plate is built thicker rather than lighter and gives the ' +
                'WEARER +2 to saving throws vs. Rod, Staff or Wand and vs. Breath Weapon.',
          caveat: 'Each race only makes certain types this way, and marking one that it ' +
                  'does not is warned about rather than blocked. Dwarven adds only item ' +
                  'saving throws, which are the DM\u2019s chart, so it changes nothing here. ' +
                  'The control disappears when this is off; the marking is kept.' }
      ]
    },

    piecemealArmor: {
      label: 'Piecemeal armor',
      hint:  'Mismatched pieces worn on separate parts of the body.',
      rules: ['piecemealArmorPHBR1'],
      legacyBand: 'core',
      changes: [
        { text: 'Piecemeal armor (pp.111\u2013112). Adds five wear locations to each ' +
                'armor card \u2014 breastplate, two arms, one arm, two legs, one leg \u2014 ' +
                'and your Armor Class becomes 10 minus the sum of the pieces. A breastplate ' +
                'weighs half the suit and each limb an eighth, calculated for you. This ' +
                'ADDS to the normal system rather than replacing it: a matched suit gives ' +
                'exactly the same AC either way.' },
        { text: 'Split magical armor grants none of its magical bonus, and elven chain ' +
                'cannot be worn in pieces at all, so those locations are not offered for ' +
                'it. For thieving skills the MOST RESTRICTIVE piece worn sets the column.',
          caveat: 'The thieving rule is this app\u2019s inference \u2014 PHBR1 does not say how ' +
                  'piecemeal armor meets the thieving skill table.' }
      ]
    },

    // NOT WHAT PHBR11's OPTIONAL BAND MEANS, which is why the hint is carried
    // here. PHBR11's optional rules suppress warnings and enforce nothing; this
    // one changes a to-hit penalty. What makes both "optional" is that the BOOK
    // marks them so: p.59 says "your DM CAN, IF HE WISHES, use these categories
    // as related groups."
    //
    // Independent of weaponGroups on purpose. A DM may reasonably use the
    // categories as a similarity table without letting anyone buy groups, or buy
    // groups while keeping PHB Table 32 for unfamiliar weapons.
    // REFERENCE, NOT ARITHMETIC. This band changes no number the sheet
    // calculates -- it adds a Tools panel that reports rules and shows which
    // maneuvers the character's weapons allow. Gated because Chapter 4 is
    // optional in the book's own voice, and a table not using it should not have
    // a tab for it.
    meleeManeuvers: {
      label: 'Melee maneuvers',
      hint:  'A Tools reference for the eleven combat maneuvers, body locations ' +
             'and hit-location thresholds.',
      rules: ['meleeManeuversPHBR1'],
      legacyBand: 'core',
      changes: [
        { text: 'Melee maneuvers (pp.64\u201374). Adds a Tools panel listing all eleven ' +
                'maneuvers with their attack modifiers and results \u2014 Called Shot, ' +
                'Disarm, Grab, Hold Attack, Parry, Pin, Pull/Trip, Sap, Shield-Punch, ' +
                'Shield-Rush and Strike/Thrust. ANYONE may attempt these, not only ' +
                'warriors: any priest with a shield can Shield-Punch, any rogue or mage ' +
                'with a good attack can Disarm.' },
        { text: 'Also shows the five body locations with their to-hit modifiers and ' +
                'effects, your \u201cNumbed\u201d and \u201cUseless\u201d thresholds at 25% ' +
                'and 50% of your hit points, and which maneuvers each weapon you carry ' +
                'can actually perform \u2014 a lasso can never Parry, a nunchaku is limited ' +
                'to four, and missile weapons to Called Shot, Disarm, Hold Attack and ' +
                'Strike/Thrust.',
          caveat: 'Reference only. Nothing here is enforced or rolled for you; each ' +
                  'maneuver still costs one of your attacks.' }
      ]
    },

    tightGroupsAsRelated: {
      label: 'Tight groups as related weapons',
      hint:  'A rule PHBR1 offers as the DM\u2019s choice rather than stating flatly. ' +
             'This one DOES change numbers.',
      rules: ['tightGroupsAsRelatedPHBR1'],
      legacyBand: 'optional',
      changes: [
        { text: 'Tight weapon groups count as RELATED weapons (p.59). Two weapons in ' +
                'the same tight group \u2014 khopesh and cutlass, both Medium Blades \u2014 ' +
                'cost half the non-proficiency penalty instead of the full one. ' +
                'Applies whether or not you have bought the group; the categories are ' +
                'being used as a similarity table, not as a purchase.',
          caveat: 'BROAD groups are NOT used, ever. p.60 says outright: \u201cThese groups ' +
                  'may not be used to calculate weapon similarity for determining ' +
                  'whether a character receives the full or partial attack penalty.\u201d ' +
                  'A weapon explicitly related to nothing stays related to nothing.' }
      ]
    }
  },
  phbr2: {
    code:  'PHBR2',
    title: 'The Complete Thief\u2019s Handbook',
    order: 2,

    // FIVE BANDS PLANNED, ONE BUILT. The rest are registered as they ship, so
    // the Supplements tab never shows a checkbox that does nothing. Planned:
    // kitSkillAdjustments (Table 4), kitProficiencyCost (the +1 slot for an
    // off-kit proficiency), equipmentSkillMods (Ch.5 per-item modifiers),
    // advancedThiefRules (mugging, advanced locks and traps, antidotes).
    //
    // NO legacyBand ANYWHERE, unlike PHBR1. The book is new, so no table has a
    // stored phbr2.core or phbr2.optional value for a band to inherit.
    bandOrder: ['armorThiefSkills', 'kitSkillAdjustments', 'kitProficiencyCost', 'equipmentSkillMods', 'advancedThiefRules'],
    armorThiefSkills: {
      label: 'Armor and thief skills',
      hint:  'Table 38 extends PHB Table 29 to every armor type.',
      rules: ['armorThiefSkillsPHBR2'],
      changes: [
        { text: 'Thief skills use Table 38 (p.115) in place of PHB Table 29. Its ' +
                'first three columns \u2014 no armor, elfin chain, studded or padded \u2014 ' +
                'are IDENTICAL to Table 29, so nothing changes for armor the PHB ' +
                'already covered. What it adds is the six types the PHB leaves out: ' +
                'hide, ring or chain, brigandine or splint, scale or banded, plate ' +
                'mail and plate armor. This app currently lumps all six into the ' +
                'studded/padded column, so a thief in chain mail reads -30% Pick ' +
                'Pockets where the book says -40%, and one in plate armor -30% ' +
                'where the book says -95%.',
          caveat: 'Table 38 assumes the armor is covered by another garment (note 4). ' +
                  'Elfin chain hides under normal clothing; everything else needs a ' +
                  'full body cloak. Not modelled.' },
        { text: 'No Dexterity BONUS applies to thief skills in any armor other than ' +
                'simple leather \u2014 penalties still do (Table 37, General Notes). ' +
                'Leather remains the baseline that adjusts nothing.' },
        { text: 'No skill falls below 1%. Table 38: a character \u201ccan always have a ' +
                '1% chance of success, even when trying to pick pockets in full plate ' +
                'armor.\u201d The 95% ceiling is unchanged.' }
      ]
    },

    kitSkillAdjustments: {
      label: 'Thief kit skill adjustments',
      hint:  'Table 4: each kit adjusts the eight thief skills.',
      rules: ['kitSkillAdjustmentsPHBR2'],
      changes: [
        { text: 'Each thief kit adjusts the eight thieving skills by the ' +
                'percentages in Table 4 (p.24) \u2014 a Cutpurse gets +10% Pick Pockets ' +
                'and \u22125% Climb Walls, a Troubleshooter \u221210% Pick Pockets and +5% ' +
                'Open Locks, and so on for all eighteen kits. ' +
                'THE BOOK ITSELF MARKS THIS OPTIONAL: the heading beneath the table ' +
                'reads \u201cThief Kits and Thieving Skills (Optional Rules)\u201d.',
          caveat: 'Table 5 (p.25) fixes the order \u2014 base score, then racial, then ' +
                  'Dexterity, then KIT, giving the total base skill that ' +
                  'discretionary points are spent on top of. The kit adjustment is a ' +
                  'PRE-DISCRETIONARY term, and that total may legitimately be ' +
                  'NEGATIVE: the book\u2019s own worked example ends at \u22125% Read Languages.' },
        { text: 'THREE CONDITIONAL BONUSES ARE NOT APPLIED as numbers, because ' +
                'Table 4 prints them as footnoted dashes. The Assassin and Bounty ' +
                'Hunter get +5% on a Pick Pockets roll ONLY when slipping poison or ' +
                'sedative into food or drink, and the Bandit +5% Move Silently ONLY ' +
                'in the wilderness. They are recorded on each kit\u2019s ability list ' +
                'instead, where the condition travels with the number.' },
        { text: 'Kit point budgets also differ where the book says so: the ASSASSIN ' +
                'gets 40 discretionary points at 1st level and 20 per level after, ' +
                'and the THUG 40 at 1st with the normal 30 after, against 60 and 30.',
                    caveat: 'The budgets are recorded in the kit data but NOTHING VALIDATES ' +
                  'THEM YET \u2014 no counter checks the eight point fields against a ' +
                  'total. Displayed, not enforced.' }
      ]
    },

    kitProficiencyCost: {
      label: 'Off-kit proficiency costs',
      hint:  'A proficiency your kit is not listed for costs one extra slot.',
      rules: ['kitProficiencyCostPHBR2'],
      changes: [
        { text: 'PHBR2 p.16: a thief may choose any of the new proficiencies, but ' +
                'if his kit is NOT LISTED AS APPROPRIATE in that proficiency\u2019s ' +
                'description, it costs one additional slot \u2014 \u201cjust as if the ' +
                'proficiency were restricted to another class\u201d. Appropriate means ' +
                'REQUIRED OR RECOMMENDED; both count.',
          caveat: 'ONE SURCHARGE, NEVER TWO. The book says \u201cjust as if\u201d, which is an ' +
                  'equivalence rather than an addition, so a proficiency that is both ' +
                  'out-of-group and off-kit still costs only +1. Applies ONLY to ' +
                  'proficiencies that carry kit lists \u2014 the Chapter 2 ones \u2014 so nothing ' +
                  'else in the list is affected.' },
        { text: 'A character with NO KIT is never surcharged, and a proficiency the ' +
                'kit GRANTS stays free \u2014 a granted proficiency cannot become unfree.' },
        { text: 'THE BOOK PRINTS THIS RELATIONSHIP TWICE and the two printings ' +
                'disagree in eleven places: once per proficiency in Chapter 2, and ' +
                'again in each kit\u2019s own Nonweapon Proficiencies line. The Scout is ' +
                'REQUIRED to take Tracking, yet Chapter 2\u2019s Tracking entry does not ' +
                'list him; Chapter 2 recommends Voice Mimicry for Spies, yet the Spy ' +
                'kit omits it.',
          caveat: 'A kit counts as appropriate if EITHER printing says so, so the ' +
                  'book\u2019s inconsistency never costs a player a slot. Run crosscheck.js ' +
                  'to list the eleven.' }
      ]
    },

    advancedThiefRules: {
      label: 'Advanced rules for thieves',
      hint:  'Chapter 7 reference: mugging, locks and traps, antidotes.',
      rules: ['advancedThiefRulesPHBR2'],
      changes: [
        { text: 'Adds a Chapter 7 reference panel on the Tools tab. Chapter 7 calls ' +
                'itself \u201crules of advanced complexity that players and DMs may wish ' +
                'to use\u201d, so it is optional in the book\u2019s own voice.',
          caveat: 'REFERENCE ONLY. Nothing is rolled, computed or enforced \u2014 the ' +
                  'app does not model backstab or lockpicking attempts.' },
        { text: 'Mugging, the thief\u2019s KO (p.114). A thief may knock out a victim by ' +
                'striking from behind with a BLUNT instrument. The target must already ' +
                'be backstab-eligible and no more than twice the thief\u2019s height. He ' +
                'gains the +4 backstab bonus, the victim loses shield and Dexterity ' +
                'bonuses, and a helmeted victim is AC 10 unless the head is protected. ' +
                'On a hit the victim saves versus petrification or falls unconscious for ' +
                '2d8 rounds, the save modified by the difference in level or Hit Dice.' },
        { text: 'Advanced locks and traps (pp.111\u2013112). Devices carry their own ' +
                'modifier to the thief\u2019s chance, locksmiths can build superior locks, ' +
                'multiple locks compound, and a failed SILENT picking attempt bars a ' +
                'normal retry on the same lock.' },
        { text: 'Poison antidotes (p.113), which the book marks optional in its own ' +
                'right. Producing one takes 1d6+4 minutes with materials to hand, at ' +
                '-10 if the poison was never identified, and fails outright if the total ' +
                'time exceeds the poison\u2019s onset.',
          caveat: 'Identifying a poison is an ASSASSIN KIT ability (pp.27\u201328), not a ' +
                  'Chapter 7 rule, so it is not gated here.' }
            ]
    },

    equipmentSkillMods: {
      label: 'Equipment and thief skills',
      hint:  'Chapter 5 gear adjusts the eight thief skills.',
      rules: ['equipmentSkillModsPHBR2'],
      changes: [
        { text: 'Adds a Thief Equipment panel on the Tools tab. Tick what the ' +
                'character is using and the panel shows the adjusted skill figures ' +
                'beside the sheet\u2019s own \u2014 footpad\u2019s boots +5 Move Silently and ' +
                '\u22125 Climb Walls, a darksuit +5 Hide in Shadows, a listening cone ' +
                '+5 Detect Noise, a grappling iron and rope +40 Climb Walls, and so on.',
          caveat: 'The panel READS the sheet and does not write to it. Chapter 5\u2019s ' +
                  'modifiers are situational \u2014 a clawed glove is worth +5, +10 or ' +
                  'nothing depending on the surface \u2014 so they cannot sit in the ' +
                  'skill fields the way armor and kit adjustments do.' },
        { text: 'Each item shows the percentage the book prints for it. PHBR2 p.90\u2019s ' +
                'ceiling on stacked nonmagical bonuses and its no-stacking guidance ' +
                'for similar items are addressed to the DM, not the player, and are ' +
                'not enforced or shown here.' }
      ]
    }
  },
  phbr11: {
    code:  'PHBR11',
    title: 'The Complete Ranger\u2019s Handbook',
    order: 11,
    core: {
      rules: ['rangerArmorStealthCRH', 'rangerTrackingCRH'],
      changes: [
        { text: 'Ranger stealth uses the CRH armor table (Tables 11 and 13) instead of ' +
                'the PHB\u2019s binary rule: +5%/+10% unarmored, no change in leather, ' +
                '-20%/-20% padded or studded, -30%/-40% ring mail, down to -95%/-95% in ' +
                'full plate. Also lifts the studded-leather ceiling, since under the CRH ' +
                'heavy armor reduces the chance rather than removing it.' },
        { text: 'Tracking uses CRH Tables 15\u201317 in place of PHB Table 39, as the book ' +
                'itself directs. Finer terrain detail (8 rows rather than 5), illumination ' +
                'as its own table (4 rows rather than one blanket -6), and modifiers the ' +
                'PHB has no equivalent for: +1 per three ranger levels, +2 in a specialized ' +
                'ranger\u2019s primary terrain, and bonuses for assisting trackers and an ' +
                'animal follower. Terrain and illumination become pick-one; special ' +
                'modifiers stay cumulative.',
          caveat: 'The cap on the assistance bonus (no more than the ranger\u2019s own ' +
                  '+1-per-3-levels) is shown but not enforced.' }
      ]
    },
    optional: {
      rules: ['rangerDruidCRH', 'demiRangersCRH'],
      changes: [
        { text: 'Half-elf ranger/druid (p.79). Stops the alignment warning for that ' +
                'pairing only \u2014 a ranger must be good and a druid true neutral, so ' +
                'the combination always conflicts. The book\u2019s conditions (a good ' +
                'nature deity with druidic specialty priests, and an allied group of ' +
                'rangers) are your DM\u2019s call.',
          caveat: 'The CRH caps such a character at 16th level ranger and 9th level ' +
                  'druid. Not enforced \u2014 this app models no level limits.' },
        { text: 'Demi-rangers (Table 53, p.79). Stops the race/class warning for the nine ' +
                'race-and-kit pairs the book lists: dwarf Guardian, Mountain Man or Warden; ' +
                'gnome Forest Runner, Pathfinder or Stalker; halfling Explorer, Feralan or ' +
                'Sea Ranger. Other combinations still warn.',
          caveat: 'Table 53 suggests caps of 15th level for dwarves, 11th for gnomes and ' +
                  '9th for halflings, and Table 54 a slower spell progression. Shown for ' +
                  'reference; neither is enforced.' }
      ]
    }
  }
};

const SUPPLEMENTS_STORAGE_KEY  = 'gsheets_supplements';
const SUPPLEMENTS_EXPAND_KEY   = 'gsheets_supplements_expanded';

// Books in publication order.
function getSupplementKeys() {
  return Object.keys(SUPPLEMENTS)
    .sort((a, b) => (SUPPLEMENTS[a].order || 0) - (SUPPLEMENTS[b].order || 0));
}

const OPTIONAL_RULES_CATEGORIES = {
  phb:      { label: '\u{1F4D6} Optional Rules',
              blurb: 'Rules the PHB marks optional. Use them or not as your table prefers.' },
  override: { label: '\u2696\uFE0F House Rules & Overrides',
              blurb: 'Checks against rules the PHB states flatly. Checked is always the ' +
                     'book\'s rule, so unticking one is the departure.' },
  // THIRD CATEGORY, and its invariant is deliberately different. The other two
  // both have a book position to anchor to. These are questions the PHB simply
  // does not answer, so NEITHER setting is more RAW than the other and the
  // default is only the commoner reading.
  // coinWeight2e was the first entry that never fitted 'override': it changes a
  // divisor rather than suppressing a warning, and there is no PHB coin weight
  // for "checked" to mean. Forcing a second such entry in would have quietly
  // broken the rule that ON always means the book.
 table:    { label: '\u{1F3B2} Table Rulings',
              blurb: 'Questions the PHB leaves open. The default is the more common reading, ' +
                     'not a rule -- settle these with your DM.' },
  // FOURTH CATEGORY. Rules from the Complete Handbooks and other supplements
  // that CHANGE something the PHB already settles. Its invariant is different
  // again from the other three: 'phb' and 'override' both anchor to the PHB,
  // and 'table' covers questions the PHB never answers -- but here the PHB DOES
  // answer, and a supplement answers differently.
  //
  // These always ship OFF. Unticked is the PHB, so ticking one is always the
  // departure, and a table that owns only the core book is never silently
  // playing a supplement's rules. Agreed with Chris, August 2026, as the
  // standing rule for EVERY supplement integrated from here on.
  //
  // Content a supplement ADDS rather than changes -- a new kit, a new
  // proficiency, a new weapon -- does NOT belong here. Adding a Falconry
  // proficiency to the list takes nothing away from a PHB-only table, and the
  // opt-in is choosing to use it. Only conflicts get a toggle.
  supplement: { label: '\u{1F4DA} Supplement Rules',
              blurb: 'Rules from the Complete Handbooks and other supplements that CHANGE ' +
                     'something the PHB settles. Unticked is always the PHB.' }
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
  'dragonlance':      { label: 'Dragonlance',       enabled: false, settingSpheres: [] },
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

// Which supplement toggle, if any, OWNS this rule key. Built once and cached,
// because isOptionalRule is called on every render.
let _supplementRuleOwner = null;
function getSupplementRuleOwner(key) {
  if (!_supplementRuleOwner) {
    _supplementRuleOwner = {};
    if (typeof SUPPLEMENTS !== 'undefined') {
            Object.keys(SUPPLEMENTS).forEach(bookKey => {
        const book = SUPPLEMENTS[bookKey] || {};
        // A book may declare its own bands via `bandOrder` -- PHBR1 has seven.
        // Indexing only core/optional meant every band-style key fell through
        // to OPTIONAL_RULES, where it does not exist, so isOptionalRule()
        // returned false forever and the toggle did nothing.
        // UNION, not replacement: a book may one day carry both shapes, and
        // bandOrder is listed last so a declared band wins any collision.
        const bands = ['core', 'optional'].concat(book.bandOrder || [])
          .filter((b, i, a) => a.indexOf(b) === i);
        bands.forEach(band => {
          const grp = book[band];
          if (!grp || !grp.rules) return;
          grp.rules.forEach(r => { _supplementRuleOwner[r] = { book: bookKey, band: band }; });
        });
      });
    }
  }
  return _supplementRuleOwner[key] || null;
}

// Is a supplement's core or optional band switched on?
//
// MIGRATION: before the book-level toggles existed, each rule had its own
// checkbox. If a player ticked one of those, the old key is still in storage
// and is honoured as the initial answer -- ticking "Ranger stealth: use the CRH
// armor table" last month must not silently switch itself off today. Once the
// book toggle is used, its own stored value takes over.
function isSupplementActive(bookKey, band) {
  const book = (typeof SUPPLEMENTS !== 'undefined') ? SUPPLEMENTS[bookKey] : null;
  if (!book || !book[band]) return false;

  try {
    const saved = JSON.parse(localStorage.getItem(SUPPLEMENTS_STORAGE_KEY) || '{}');
    const id = bookKey + '.' + band;
    if (Object.prototype.hasOwnProperty.call(saved, id)) return !!saved[id];

    // THE MIGRATION PATH FOR THE BAND SPLIT. PHBR1 was one `core` toggle and is
    // now six named bands, so a table that ticked "core" has a stored value
    // under `phbr1.core` and nothing under `phbr1.weaponGroups`. A band with no
    // key of its own falls back to the band it used to live in, so the split
    // changes nobody's rules.
    //
    // REACHED ONLY WHEN THE BAND'S OWN KEY IS ABSENT -- the hasOwnProperty check
    // above has already returned for an explicit true OR false. So the first
    // time the player touches an individual toggle, that band gets its own key
    // and stops consulting the legacy one, including when he unticks it.
    const legacy = book[band].legacyBand;
    if (legacy && legacy !== band) {
      const legacyId = bookKey + '.' + legacy;
      if (Object.prototype.hasOwnProperty.call(saved, legacyId)) return !!saved[legacyId];
    }
  } catch (e) { /* corrupt storage -- fall through */ }

  // Legacy per-rule settings, read directly rather than through
  // isOptionalRule() to avoid recursing back into this function.
  try {
    const old = JSON.parse(localStorage.getItem(OPTIONAL_RULES_STORAGE_KEY) || '{}');
    const hit = (book[band].rules || []).some(
      r => Object.prototype.hasOwnProperty.call(old, r) && !!old[r]);
    if (hit) return true;
  } catch (e) { /* corrupt storage -- fall through */ }

  return false;
}

function setSupplement(bookKey, band, enabled) {
  const book = (typeof SUPPLEMENTS !== 'undefined') ? SUPPLEMENTS[bookKey] : null;
  if (!book || !book[band]) return;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SUPPLEMENTS_STORAGE_KEY) || '{}'); }
  catch (e) { saved = {}; }
  saved[bookKey + '.' + band] = !!enabled;
  localStorage.setItem(SUPPLEMENTS_STORAGE_KEY, JSON.stringify(saved));
}

// Is an optional rule enabled? Reads the player's saved setting, falling back to
// the registry default. Safe to call before any settings UI exists.
//
// A rule a SUPPLEMENT owns delegates to that book's toggle instead. This is why
// absorbing the per-rule checkboxes needed no changes at the call sites:
// getRangerStealth and validateClassAlignment still ask isOptionalRule() the
// same question and are unaware the answer now comes from a book-level switch.
function isOptionalRule(key) {
  const owner = getSupplementRuleOwner(key);
  if (owner) return isSupplementActive(owner.book, owner.band);

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

// PHB Ch.3, dual-class: a character "can acquire up to four classes, one from
// each group." Multi-class combinations are enumerated per race and likewise
// never pair two classes from one group. So fighter/paladin, thief/bard and
// cleric/druid are all illegal -- but the app has no way to know your DM has
// not allowed one, hence advisory only, and switchable off entirely.
// Returns [] when the character is legal, single-classed, or the check is off.
function validateClassGroups(root) {
  const problems = [];
  if (typeof isOptionalRule === 'function' && !isOptionalRule('classGroupLegality')) return problems;
  if (typeof getClassCategory !== 'function') return problems;

  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const entries = [];

  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = (val(root, 'mc_class' + i) || '').trim();
      if (c) entries.push(c);
    }
  } else if (charType === 'dual') {
    const oc = (val(root, 'dc_original_class') || '').trim();
    const nc = (val(root, 'dc_new_class') || '').trim();
    if (oc) entries.push(oc);
    if (nc) entries.push(nc);
  } else {
    return problems;   // a single-class character cannot conflict with itself
  }
  if (entries.length < 2) return problems;

  const byGroup = {};
  entries.forEach(c => {
    const cat = getClassCategory(c);
    if (!cat) return;                       // unrecognised/homebrew: say nothing
    (byGroup[cat] = byGroup[cat] || []).push(c);
  });

  Object.keys(byGroup).forEach(cat => {
    if (byGroup[cat].length > 1) {
      problems.push(byGroup[cat].join(' and ') + ' are both ' + cat +
        '-group classes. The PHB allows only one class from each group ' +
        '(warrior, wizard, priest, rogue).');
    }
  });

  return problems;
}

// === Henchman limits (PHB Chapter 12) ===
// Two rules, and they deliberately count DIFFERENT SETS of henchmen.
//
// 1. THE LIFETIME LIMIT. Chapter 12: "A PC's Charisma determines the maximum
//    number of henchmen he can have. This is a lifetime limit, not just a
//    maximum possible at any given time." The chapter's worked example is
//    Rupert, Charisma 15, whose seven henchmen have all died -- and no more
//    come. So EVERY status counts. Retired, deceased and missing are all spent
//    against the total, which is why this reads every card in the list and
//    ignores the archive filter -- that only hides rows on screen.
//
// 2. LEVEL PARITY. "A henchman is always of lower level than the PC. Should he
//    ever equal or surpass the PC's level, the henchman leaves forever." Only
//    ACTIVE henchmen are checked. A man who has already died or parted ways
//    cannot leave again, and flagging him would be noise.
//
// The PC's level is the highest of his class components -- the same derivation
// paLevel() makes in calc.js. Chapter 12 says nothing about multi- and
// dual-class patrons, so the most generous reading is used: a 7th/5th
// fighter/thief counts as 7th, not 5th.
//
// Blank names and blank levels are skipped, so a freshly added empty card never
// trips either check. Advisory only; nothing is ever blocked.
function validateHenchmen(root) {
  const problems = [];
  if (typeof isOptionalRule === 'function' && !isOptionalRule('henchmanLimits')) return problems;
  if (!root) return problems;

  const cards = Array.from(root.querySelectorAll('.henchmen-list .item')).filter(el => {
    const n = el.querySelector('.henchman-name');
    return n && String(n.value || '').trim();
  });

  const cha = parseInt(val(root, 'cha') || 0, 10);
  const row = (typeof CHA_TABLE !== 'undefined' && CHA_TABLE[cha]) ? CHA_TABLE[cha] : null;
  if (row && cards.length > row.henchmen) {
    problems.push('Charisma ' + cha + ' allows ' +
      (row.henchmen === 0 ? 'no henchmen at all' : row.henchmen + ' henchmen in a lifetime') +
      ' (PHB Table 6), and ' + cards.length + ' are recorded. Retired, deceased and missing ' +
      'henchmen still count against the lifetime total.');
  }

  const comps  = (typeof getAllClassComponents === 'function') ? getAllClassComponents(root) : [];
  const levels = comps.map(c => parseInt(c.level, 10) || 0).filter(Boolean);
  const pcLevel = levels.length ? Math.max.apply(null, levels)
                                : (parseInt(val(root, 'level'), 10) || 0);
  if (pcLevel > 0) {
    cards.forEach(el => {
      const statusEl = el.querySelector('.henchman-status');
      if (statusEl && statusEl.value !== 'Active') return;

      const lvEl = el.querySelector('.henchman-level');
      const lv   = lvEl ? parseInt(lvEl.value, 10) : NaN;
      if (!lv || lv < pcLevel) return;

      const nameEl = el.querySelector('.henchman-name');
      const name   = nameEl ? String(nameEl.value).trim() : 'A henchman';
      problems.push(name + ' is level ' + lv + ', ' +
        (lv === pcLevel ? 'equal to' : 'above') + ' the character\'s level of ' + pcLevel +
        '. A henchman who equals or surpasses his patron leaves forever.');
    });
  }

  return problems;
}

// === Class ability minimums (PHB Table 13) ===
// Specialist wizards read "Var" in every column -- their requirements live in
// Table 22 and are handled by validateSpecialist(), so they are skipped here.
// Table 13's asterisk marks OPTIONAL classes (paladin, ranger, specialist,
// druid, bard) and notes that "Specialist includes illusionist" -- that is a
// campaign-permission matter for the DM, not a score check, so it is not modelled.
const CLASS_ABILITY_MINIMUMS = {
  fighter: { str: 9 },
  paladin: { str: 12, con: 9, wis: 13, cha: 17 },
  ranger:  { str: 13, dex: 13, con: 14, wis: 14 },
  mage:    { int: 9 },
  cleric:  { wis: 9 },
  druid:   { wis: 12, cha: 15 },
  thief:   { dex: 9 },
  bard:    { dex: 12, int: 13, cha: 15 }
};
const ABILITY_LABELS = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma'
};

// Advisory only. The PHB's own remedy for failing these is asking the DM to
// permit a reroll or a raised score -- a character-creation check, not
// something that stops play, so nothing here blocks.
function validateClassMinimums(root) {
  const problems = [];
  if (typeof isOptionalRule === 'function' && !isOptionalRule('classAbilityMinimums')) return problems;

  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const classes = [];
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = (val(root, 'mc_class' + i) || '').trim();
      if (c) classes.push(c);
    }
  } else if (charType === 'dual') {
    const oc = (val(root, 'dc_original_class') || '').trim();
    const nc = (val(root, 'dc_new_class') || '').trim();
    if (oc) classes.push(oc);
    if (nc) classes.push(nc);
  } else {
    const c = (val(root, 'clazz') || '').trim();
    if (c) classes.push(c);
  }
  if (!classes.length) return problems;

  classes.forEach(clazz => {
    const key = clazz.trim().toLowerCase();

    // Specialists: Table 13 defers to Table 22, which validateSpecialist covers.
    if (typeof SPECIALIST_WIZARDS !== 'undefined' && SPECIALIST_WIZARDS[key]) return;

    // Exact match first, then longest-key substring so compound and homebrew
    // names still resolve. Unrecognised classes say nothing at all.
    let mins = CLASS_ABILITY_MINIMUMS[key];
    if (!mins) {
      const k = Object.keys(CLASS_ABILITY_MINIMUMS)
        .sort((a, b) => b.length - a.length)
        .find(kk => key.indexOf(kk) !== -1);
      if (k) mins = CLASS_ABILITY_MINIMUMS[k];
    }
    if (!mins) return;

    Object.keys(mins).forEach(stat => {
      const score = parseInt(val(root, stat) || 0, 10);
      if (!score) return;                       // blank score: nothing to judge yet
      if (score < mins[stat]) {
        problems.push(clazz + ' requires ' + ABILITY_LABELS[stat] + ' ' + mins[stat] +
                      ' (PHB Table 13). This character has ' + score + '.');
      }
    });
  });

  return problems;
}

// === ALIGNMENT (PHB Chapter 4) ===
// Chapter 4 defines a CLOSED vocabulary: two axes -- ethos (law / neutrality /
// chaos) and morals (good / neutrality / evil) -- combining into nine
// alignments. Storing a KEY rather than the player's typing is what lets any
// rule read alignment reliably; nothing anywhere should ever parse the label.
//
// The tenth entry is not an alignment. Ch.4 "Non-Aligned Creatures": for
// unintelligent monsters and animals "alignment is simply not applicable... For
// these creatures, alignment is always detected as neutral." It exists so a
// war dog or a direwolf can be recorded honestly instead of being forced into
// True Neutral, which is a philosophical position an animal cannot hold.
const ALIGNMENTS = {
  lg: { label: 'Lawful Good',     abbr: 'LG', ethos: 'lawful',  morals: 'good' },
  ln: { label: 'Lawful Neutral',  abbr: 'LN', ethos: 'lawful',  morals: 'neutral' },
  le: { label: 'Lawful Evil',     abbr: 'LE', ethos: 'lawful',  morals: 'evil' },
  ng: { label: 'Neutral Good',    abbr: 'NG', ethos: 'neutral', morals: 'good' },
  tn: { label: 'True Neutral',    abbr: 'N',  ethos: 'neutral', morals: 'neutral' },
  ne: { label: 'Neutral Evil',    abbr: 'NE', ethos: 'neutral', morals: 'evil' },
  cg: { label: 'Chaotic Good',    abbr: 'CG', ethos: 'chaotic', morals: 'good' },
  cn: { label: 'Chaotic Neutral', abbr: 'CN', ethos: 'chaotic', morals: 'neutral' },
  ce: { label: 'Chaotic Evil',    abbr: 'CE', ethos: 'chaotic', morals: 'evil' },

  nonaligned: { label: 'Non-aligned (animal / unintelligent)', abbr: '\u2014',
                ethos: null, morals: null, notAnAlignment: true }
};

// Display order for dropdowns. Object key order is reliable in practice for
// string keys, but an explicit list means reordering the menu never risks
// touching the data.
const ALIGNMENT_ORDER = ['lg','ln','le','ng','tn','ne','cg','cn','ce','nonaligned'];

// Values the app itself writes that are deliberately NOT alignments. They are
// kept out of ALIGNMENTS so no rule can ever treat them as one.
const ALIGNMENT_NON_VALUES = {
  unknown: 'Unknown',
  other:   'Other (see notes)'
};

// Free text -> key. Existing sheets hold whatever anyone typed, and kits.js
// holds book phrasing, so this has to be forgiving. Returns '' when nothing
// matches -- callers preserve the original text rather than discarding it.
const ALIGNMENT_ALIASES = {
  'lawfulgood': 'lg', 'lg': 'lg',
  'lawfulneutral': 'ln', 'ln': 'ln',
  'lawfulevil': 'le', 'le': 'le',
  'neutralgood': 'ng', 'ng': 'ng',
  'neutralevil': 'ne', 'ne': 'ne',
  'chaoticgood': 'cg', 'cg': 'cg',
  'chaoticneutral': 'cn', 'cn': 'cn',
  'chaoticevil': 'ce', 'ce': 'ce',
  // True Neutral collects the most spellings by far.
  'trueneutral': 'tn', 'tn': 'tn', 'n': 'tn', 'neutral': 'tn',
  'neutralneutral': 'tn', 'nn': 'tn', 'truen': 'tn',
  // Non-aligned.
  'nonaligned': 'nonaligned', 'unaligned': 'nonaligned', 'none': 'nonaligned',
  'na': 'nonaligned', 'animal': 'nonaligned'
};

function normalizeAlignmentKey(text) {
  if (!text) return '';
  const raw = String(text).trim().toLowerCase();
  if (ALIGNMENTS[raw]) return raw;                 // already a key
  // Letters only: "Lawful Good", "lawful-good", "L.G." and "lawfulgood" all
  // collapse to the same lookup.
  const flat = raw.replace(/[^a-z]/g, '');
  return ALIGNMENT_ALIASES[flat] || '';
}

function getAlignmentData(key) {
  return ALIGNMENTS[normalizeAlignmentKey(key)] || null;
}

// Full name for display. Unrecognised text is returned UNCHANGED so a legacy
// or homebrew value never vanishes from a sheet or a printout.
function getAlignmentLabel(key) {
  const a = getAlignmentData(key);
  if (a) return a.label;
  if (key && ALIGNMENT_NON_VALUES[String(key).trim().toLowerCase()]) {
    return ALIGNMENT_NON_VALUES[String(key).trim().toLowerCase()];
  }
  return key ? String(key) : '';
}

function getAlignmentAbbr(key) {
  const a = getAlignmentData(key);
  return a ? a.abbr : (key ? String(key) : '');
}

// Ch.4 describes alignment along two axes; these read one axis at a time so a
// rule can ask the question the book actually asks. Non-aligned answers false
// to everything -- it holds no position on either axis.
function isAlignmentGood(key)    { const a = getAlignmentData(key); return !!a && a.morals === 'good'; }
function isAlignmentEvil(key)    { const a = getAlignmentData(key); return !!a && a.morals === 'evil'; }
function isAlignmentLawful(key)  { const a = getAlignmentData(key); return !!a && a.ethos  === 'lawful'; }
function isAlignmentChaotic(key) { const a = getAlignmentData(key); return !!a && a.ethos  === 'chaotic'; }

// "Partially neutral" is the bard's own wording -- neutral on EITHER axis, so
// LN, NG, TN, NE and CN qualify while the four corners do not. Expressed as the
// principle rather than a list of five, because kits.js uses the same phrase.
function isAlignmentPartiallyNeutral(key) {
  const a = getAlignmentData(key);
  return !!a && !a.notAnAlignment && (a.ethos === 'neutral' || a.morals === 'neutral');
}

// === Class alignment requirements (PHB Chapter 3) ===
// Written as the PRINCIPLE the book states, with the permitted list DERIVED
// from it, rather than nine hand-typed keys per class. The ranger reads
// "always good" and the bard "always partially neutral" -- deriving means each
// sentence is expressed once and no list can go stale behind an edit.
//
// Classes absent from this table have NO restriction and are never judged:
//   Fighter  -- "any alignment: good or evil, lawful or chaotic, or neutral"
//   Mage / specialist -- the class entries state no restriction at all
//   Cleric   -- "not restricted to good; they can have any alignment
//               acceptable to their order", which is the DM's call, not ours
const PLAYER_ALIGNMENTS = ALIGNMENT_ORDER.filter(k => !ALIGNMENTS[k].notAnAlignment);

const CLASS_ALIGNMENT_REQUIREMENTS = {
  paladin: {
    allowed:  ['lg'],
    describe: 'must be lawful good'
  },
  ranger: {
    allowed:  PLAYER_ALIGNMENTS.filter(isAlignmentGood),
    describe: 'must be good (lawful, neutral or chaotic)'
  },
  druid: {
    // "the druid must be neutral in alignment" -- unqualified, unlike the
    // bard's "partially neutral" printed a few pages later. Ch.4's own True
    // Neutral paragraph uses a druid as its worked example.
    allowed:  ['tn'],
    describe: 'must be true neutral'
  },
  thief: {
    allowed:  PLAYER_ALIGNMENTS.filter(k => k !== 'lg'),
    describe: 'may be any alignment except lawful good'
  },
  bard: {
    allowed:  PLAYER_ALIGNMENTS.filter(isAlignmentPartiallyNeutral),
    describe: 'must be partially neutral (neutral on at least one axis)'
  }
};

// Which classes does this character actually hold? Same shape as the block
// inside validateClassMinimums; that one is left alone rather than refactored
// mid-audit, but it could be moved onto this later.
function getCharacterClassList(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const classes = [];
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = (val(root, 'mc_class' + i) || '').trim();
      if (c) classes.push(c);
    }
  } else if (charType === 'dual') {
    const oc = (val(root, 'dc_original_class') || '').trim();
    const nc = (val(root, 'dc_new_class') || '').trim();
    if (oc) classes.push(oc);
    if (nc) classes.push(nc);
  } else {
    const c = (val(root, 'clazz') || '').trim();
    if (c) classes.push(c);
  }
  return classes;
}

// EXACT MATCH ONLY -- deliberately unlike CLASS_ABILITY_MINIMUMS and
// getClassCategory, which both fall back to substring matching. "hb_dpaladin"
// contains "paladin", so a substring fallback would silently bind a homebrew
// class to lawful good and strip a character of powers he has already lost in
// play. An alignment restriction is absolute where a minimum score is a
// nudge, so the safe failure here is saying nothing.
function validateClassAlignment(root) {
  const problems = [];
  if (typeof isOptionalRule === 'function' &&
      !isOptionalRule('classAlignmentRequirements')) return problems;

  const key = normalizeAlignmentKey(val(root, 'alignment'));
  if (!key) return problems;            // blank or unrecognised: nothing to judge

  const classes = getCharacterClassList(root);
  if (!classes.length) return problems;

  const label = getAlignmentLabel(key);

  // PHBR11 p.79, Optional Rule: The Ranger-Druid. The two requirements cannot
  // both be met -- ranger must be good, druid must be true neutral -- so this
  // character ALWAYS produces at least one warning, and the pairing is the
  // whole point of the rule. Scoped as narrowly as possible: it suppresses the
  // ranger and druid rows only, and only when BOTH are present. A ranger/cleric
  // or a lone druid is judged exactly as before, and every other class in a
  // ranger/druid's list still reports normally.
  const lowered = classes.map(c => String(c).trim().toLowerCase());
  const rangerDruid =
    lowered.some(c => c.includes('ranger')) &&
    lowered.some(c => c.includes('druid')) &&
    typeof isOptionalRule === 'function' &&
    isOptionalRule('rangerDruidCRH');

  classes.forEach(clazz => {
    const lc = String(clazz).trim().toLowerCase();
    if (rangerDruid && (lc.includes('ranger') || lc.includes('druid'))) return;
    const req = CLASS_ALIGNMENT_REQUIREMENTS[lc];
    if (!req) return;                   // unrecognised or unrestricted class
    if (req.allowed.indexOf(key) !== -1) return;
    problems.push('A ' + clazz + ' ' + req.describe +
                  ' (PHB Ch.3). This character is ' + label + '.');
  });

  return problems;
}

// === Kit alignment requirements (Complete handbooks, via kits.js) ===
// kits.js records these as free-text prose. Twelve distinct phrases appear
// across the whole file: Any / Lawful good / Lawful Good / Neutral /
// Any non-lawful / Any good / Any lawful / Lawful / Chaotic / Any neutral /
// Any evil / Deity-dependent.
//
// Returns true (satisfied), false (violated) or null (cannot be judged).
//
// THE ORDER OF THE CHECKS MATTERS. A named alignment is tested BEFORE the
// axis words, and the leading "Any" is NOT stripped first, because bare
// "Neutral" (the druid kits) means true neutral while "Any neutral" (the
// Feralan) means neutral on either axis. Stripping "Any" would collapse the
// two into one rule and quietly tighten nine kits.
function matchesAlignmentRequirement(alignKey, phrase) {
  const a = getAlignmentData(alignKey);
  if (!a) return null;

  // AUTHORITATIVE FORM: an explicit array of alignment keys, resolved from the
  // book's prose at audit time. There are only nine alignments, so the set is
  // always short enough to write down -- and writing it down removes the parser
  // entirely. The string path below matches on the FIRST axis keyword it finds
  // and silently drops the rest, so "Any good, non-lawful" enforces only the
  // non-lawful half. Use arrays for every newly audited kit.
  //
  // An EMPTY array means unknown, not "nothing is permitted" -- returning false
  // for all nine would raise a banner that can never be cleared.
  if (Array.isArray(phrase)) {
    return phrase.length ? phrase.indexOf(alignKey) !== -1 : null;
  }

  const p = String(phrase || '').trim().toLowerCase();
  if (!p) return null;
  if (p === 'any') return true;
  if (p.indexOf('deity') !== -1) return null;   // "Deity-dependent"

  // A named alignment: "Lawful good", "Lawful Good", "Neutral".
  const exact = normalizeAlignmentKey(p);
  if (exact) return exact === alignKey;

  // Otherwise an axis phrase, optionally negated ("Any non-lawful").
  const negated = /non-?\s*(lawful|chaotic|good|evil|neutral)/.test(p);

  let ok = null;
  if      (/lawful/.test(p))  ok = isAlignmentLawful(alignKey);
  else if (/chaotic/.test(p)) ok = isAlignmentChaotic(alignKey);
  else if (/good/.test(p))    ok = isAlignmentGood(alignKey);
  else if (/evil/.test(p))    ok = isAlignmentEvil(alignKey);
  else if (/neutral/.test(p)) ok = isAlignmentPartiallyNeutral(alignKey);

  if (ok === null) return null;
  return negated ? !ok : ok;
}

// Renders a kit's alignment requirement for the warning banner. The stored
// requirement is now a SET of alignment keys, which would concatenate as
// "ng,cg" if pushed straight into a sentence.
//
// Prefers requirements.alignmentPrinted when present -- the book's own wording
// is what the player will find if he goes looking, so the banner quotes the
// source rather than reciting a resolved list back at him. The list is the
// fallback, and the legacy string passes through untouched.
function describeAlignmentRequirement(reqs) {
  if (!reqs) return '';
  if (reqs.alignmentPrinted) return String(reqs.alignmentPrinted);

  const a = reqs.alignment;
  if (Array.isArray(a)) {
    const labels = a.map(k => (typeof getAlignmentLabel === 'function')
      ? getAlignmentLabel(k) : String(k)).filter(Boolean);
    if (!labels.length) return '';
    if (labels.length === 1) return labels[0];
    return labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1];
  }
  return String(a || '');
}

function validateKitAlignment(root) {
  const problems = [];
  if (typeof isOptionalRule === 'function' &&
      !isOptionalRule('kitAlignmentRequirements')) return problems;
  if (typeof getKitsForClass !== 'function') return problems;

  const kitValue = (val(root, 'kit') || '').trim();
  const clazz    = (val(root, 'clazz') || '').trim().toLowerCase();
  if (!kitValue || !clazz) return problems;

  // The select stores the kit NAME with whitespace removed, not the KITS
  // object key -- same lookup renderKitAbilities uses.
  const kit = getKitsForClass(clazz)
    .find(k => k.name.toLowerCase().replace(/\s+/g, '') === kitValue);
  if (!kit || !kit.requirements || !kit.requirements.alignment) return problems;

  const key = normalizeAlignmentKey(val(root, 'alignment'));
  if (!key) return problems;

  // Only a definite FALSE is reported. "Deity-dependent" returns null and says
  // nothing at all -- an amber banner that can never be cleared is exactly the
  // warning fatigue the override toggles exist to prevent.
  if (matchesAlignmentRequirement(key, kit.requirements.alignment) === false) {
    problems.push('The ' + kit.name + ' kit requires ' +
                  describeAlignmentRequirement(kit.requirements) +
                  '. This character is ' + getAlignmentLabel(key) + '.');
  }

  return problems;
}

// === Racial ability requirements (PHB Table 7) ===
// [min, max] for the ROLLED score, before Table 8 adjustments are applied.
// Humans have no row in Table 7 -- "Any character can be a human, if the player
// so desires" -- so they are never checked.
const RACE_ABILITY_REQUIREMENTS = {
  dwarf:      { str: [8, 18],  dex: [3, 17], con: [11, 18], int: [3, 18], wis: [3, 18], cha: [3, 17] },
  elf:        { str: [3, 18],  dex: [6, 18], con: [7, 18],  int: [8, 18], wis: [3, 18], cha: [8, 18] },
  gnome:      { str: [6, 18],  dex: [3, 18], con: [8, 18],  int: [6, 18], wis: [3, 18], cha: [3, 18] },
  "half-elf": { str: [3, 18],  dex: [6, 18], con: [6, 18],  int: [4, 18], wis: [3, 18], cha: [3, 18] },
  halfling:   { str: [7, 18],  dex: [7, 18], con: [10, 18], int: [6, 18], wis: [3, 17], cha: [3, 18] }
};
RACE_ABILITY_REQUIREMENTS.halfelf = RACE_ABILITY_REQUIREMENTS["half-elf"];

// === Racial ability adjustments (PHB Table 8) ===
// Note there is NO half-elf row and no human row -- those two races take no
// adjustment at all.
//
// The app does NOT apply these. Ability scores are entered by the player and
// assumed to be FINAL, post-adjustment values. This table exists so the Table 7
// check can work backwards from the entered score to the rolled one, which is
// what Table 7 actually governs: the chapter says to consult Table 7 BEFORE
// making adjustments, and that a character whose adjusted scores fall outside
// the range is still legal -- "The adjustments can also raise a score to 19 or
// lower it to 2." An elf legitimately showing Constitution 6 rolled a 7.
const RACE_ABILITY_ADJUSTMENTS = {
  dwarf:    { con: +1, cha: -1 },
  elf:      { dex: +1, con: -1 },
  gnome:    { int: +1, wis: -1 },
  halfling: { dex: +1, str: -1 }
};

// Resolve a free-text race field to a canonical key. Letters-only substring
// matching, the same approach validateSpecialist uses, so "Half-Elf",
// "halfelf", "Deep Gnome" and "Grey Elf" all resolve. ORDER MATTERS: "halfelf"
// contains "elf", so it must be tested first. Returns null for anything
// unrecognised -- homebrew races are never judged.
function getRaceKey(race) {
  const r = (race || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!r) return null;
  if (r.indexOf("halfelf")  !== -1) return "half-elf";
  if (r.indexOf("halfling") !== -1) return "halfling";
  if (r.indexOf("dwarf")    !== -1 || r.indexOf("dwarves") !== -1) return "dwarf";
  if (r.indexOf("gnome")    !== -1) return "gnome";
  if (r.indexOf("elf")      !== -1 || r.indexOf("elven")   !== -1) return "elf";
  if (r.indexOf("human")    !== -1) return "human";
  return null;
}

// PHB Table 7 footnote: "Halfling fighters do not roll for exceptional
// Strength." Only warriors get exceptional Strength at all, and the only
// warrior class open to a halfling is fighter, so no class check is needed --
// every halfling is covered.
function racePermitsExceptionalStrength(race) {
  return getRaceKey(race) !== "halfling";
}

// Advisory only, like the other validators. Compares the ROLLED score -- the
// entered score with the Table 8 adjustment backed out -- against Table 7.
// Returns [] when the race is human, unrecognised, or the check is switched off.
function validateRaceRequirements(root) {
  const problems = [];
  if (typeof isOptionalRule === 'function' && !isOptionalRule('raceAbilityRequirements')) return problems;

  const raceKey = getRaceKey(val(root, 'race'));
  if (!raceKey || raceKey === 'human') return problems;

  const reqs = RACE_ABILITY_REQUIREMENTS[raceKey];
  if (!reqs) return problems;
  const adj = RACE_ABILITY_ADJUSTMENTS[raceKey] || {};

  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
    const shown = parseInt(val(root, stat) || 0, 10);
    if (!shown) return;                       // blank score: nothing to judge yet
    const mod    = adj[stat] || 0;
    const rolled = shown - mod;               // back out Table 8
    const range  = reqs[stat];
    if (!range) return;
    if (rolled < range[0] || rolled > range[1]) {
      let msg = ABILITY_LABELS[stat] + ' ' + shown;
      if (mod) {
        msg += ' implies a rolled ' + rolled + ' after the ' +
               (mod > 0 ? '+' : '') + mod + ' racial adjustment';
      }
      msg += '. PHB Table 7 requires ' + range[0] + '-' + range[1] +
             ' (' + raceKey + ') before racial adjustments.';
      problems.push(msg);
    }
  });

  return problems;
}

// === Classes each race may take (PHB Chapter 2) ===
// Transcribed from the per-race prose. Human is absent deliberately: "Humans
// can choose to be of any class -- warrior, wizard, priest, or rogue -- and can
// rise to great level in any class." Humans are never checked.
//
// "specialist" stands for all eight specialist schools. Chapter 2 grants the
// elf a "wizard", the half-elf a "specialist wizard" and the gnome an
// "illusionist"; WHICH specialists accept WHICH races is Table 22's business
// and validateSpecialist() already checks it. Collapsing them here keeps a
// half-elf necromancer from drawing two warnings for one problem.
//
// NOTE the gnome row: "specialist" is present but "mage" is NOT. Chapter 2
// offers a gnome "a fighter, a thief, a cleric, or an illusionist" -- never a
// plain mage. That asymmetry is intentional, not a missing entry.
//
// Paladin appears in no demihuman row, which is the book's own way of making
// paladins human-only.
const RACE_CLASSES = {
  dwarf:      ["cleric", "fighter", "thief"],
  elf:        ["cleric", "fighter", "mage", "specialist", "thief", "ranger"],
  gnome:      ["cleric", "fighter", "thief", "specialist"],
  halfling:   ["cleric", "fighter", "thief"],
  "half-elf": ["cleric", "druid", "fighter", "ranger", "mage", "specialist", "thief", "bard"]
};
RACE_CLASSES.halfelf = RACE_CLASSES["half-elf"];

// Reduce a free-text class name to one of the tokens used in RACE_CLASSES.
// Returns null for anything we should not judge -- explicitly-marked homebrew
// (hb_ prefix) and unrecognised names both pass silently.
function getRaceClassToken(clazz) {
  const c = (clazz || "").trim().toLowerCase();
  if (!c) return null;
  if (c.indexOf("hb_") === 0) return null;      // homebrew: never judged

  // Specialist schools first -- exact, then substring so "gnome illusionist"
  // resolves as well as "illusionist".
  if (typeof SPECIALIST_WIZARDS !== 'undefined') {
    if (SPECIALIST_WIZARDS[c]) return "specialist";
    const sk = Object.keys(SPECIALIST_WIZARDS)
      .sort((a, b) => b.length - a.length)
      .find(k => c.indexOf(k) !== -1);
    if (sk) return "specialist";
  }

  const MAP = {
    fighter: "fighter", paladin: "paladin", ranger: "ranger",
    mage: "mage", wizard: "mage", specialist: "specialist",
    cleric: "cleric", priest: "cleric", druid: "druid",
    thief: "thief", rogue: "thief", bard: "bard"
  };
  if (MAP[c]) return MAP[c];
  const key = Object.keys(MAP)
    .sort((a, b) => b.length - a.length)
    .find(k => c.indexOf(k) !== -1);
  return key ? MAP[key] : null;
}

// Is the race or class a value this app can actually resolve?
//
// NOT A RULES CHECK -- every other validator here tests the book. This one tests
// whether the sheet is silently doing nothing. An unresolvable race means
// getRaceKey returns null at seven call sites, so racial languages, save
// bonuses, Table 7 validation and thief racial adjustments ALL go quiet while
// the character renders perfectly. An unresolvable class means getClassCategory
// returns null, so hitDiceParts returns null and hit dice do not resolve at all.
// Nothing warns today except the age, height and weight rollers.
//
// Deliberately NOT gated by isOptionalRule: this is not a house-rule matter, it
// is a statement of fact about what the app is applying.
function validateFieldRecognition(root) {
  const problems = [];

  const race = (val(root, 'race') || '').trim();
  if (race && typeof getRaceKey === 'function' && !getRaceKey(race)) {
    problems.push('Race "' + race + '" is not recognised. Racial languages, saving ' +
                  'throw bonuses, ability score ranges and thief skill adjustments ' +
                  'are NOT being applied. The six player races are dwarf, elf, gnome, ' +
                  'half-elf, halfling and human; subraces such as "Grey Elf" or ' +
                  '"Deep Gnome" resolve on their own.');
  }

  // Multi and dual-class characters keep their real classes in their own fields;
  // `clazz` holds a formatted display string for them, so check the components.
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const classes = [];
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = (val(root, 'mc_class' + i) || '').trim();
      if (c) classes.push(c);
    }
  } else if (charType === 'dual') {
    ['dc_original_class', 'dc_new_class'].forEach(f => {
      const c = (val(root, f) || '').trim();
      if (c) classes.push(c);
    });
  } else {
    const c = (val(root, 'clazz') || '').trim();
    if (c) classes.push(c);
  }

  classes.forEach(c => {
    // Homebrew is never judged, here as everywhere else.
    if (c.toLowerCase().indexOf('hb_') === 0) return;
    if (typeof getClassCategory === 'function' && !getClassCategory(c)) {
      problems.push('Class "' + c + '" is not recognised. Hit dice, saving throws, ' +
                    'THAC0 and proficiency slots cannot be resolved for it. Prefix a ' +
                    'deliberate homebrew class with "hb_" to silence this.');
    }
  });

  return problems;
}

// Advisory only. Returns [] for humans, unrecognised races, homebrew classes,
// or when the check is switched off.
function validateRaceClass(root) {
  const problems = [];
  if (typeof isOptionalRule === 'function' && !isOptionalRule('raceClassLegality')) return problems;

  const raceKey = getRaceKey(val(root, 'race'));
  if (!raceKey || raceKey === 'human') return problems;
  const allowed = RACE_CLASSES[raceKey];
  if (!allowed) return problems;

  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const classes = [];
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = (val(root, 'mc_class' + i) || '').trim();
      if (c) classes.push(c);
    }
  } else if (charType === 'dual') {
    const oc = (val(root, 'dc_original_class') || '').trim();
    const nc = (val(root, 'dc_new_class') || '').trim();
    if (oc) classes.push(oc);
    if (nc) classes.push(nc);
  } else {
    const c = (val(root, 'clazz') || '').trim();
    if (c) classes.push(c);
  }
  if (!classes.length) return problems;

  // PHBR11 Table 53, demi-rangers. SCOPED, not blanket: the suppression applies
  // only when the character's race AND selected kit match one of the nine pairs
  // the book lists, which is what the demiRanger field in kits.js is for. A
  // gnome Stalker goes quiet; a gnome Paladin still warns, and so does a gnome
  // ranger with no kit or a kit not on Table 53.
  let demiRangerOk = false;
  if (typeof isOptionalRule === 'function' && isOptionalRule('demiRangersCRH') &&
      typeof getKitsForClass === 'function') {
    const kitValue = (val(root, 'kit') || '').trim();
    if (kitValue) {
      const kit = getKitsForClass('ranger')
        .find(k => k.name.toLowerCase().replace(/\s+/g, '') === kitValue);
      const demi = kit && kit.requirements && kit.requirements.demiRanger;
      if (demi && demi.race === raceKey) demiRangerOk = true;
    }
  }

  classes.forEach(clazz => {
    const token = getRaceClassToken(clazz);
    if (!token) return;                        // homebrew or unrecognised: silent
    if (token === 'ranger' && demiRangerOk) return;
    if (allowed.indexOf(token) === -1) {
      problems.push(clazz + ' is not a class the PHB permits for this race (' +
        raceKey + ', Chapter 2). Permitted: ' + allowed.join(', ') + '.');
    }
  });

  return problems;
}

// === Starting age (PHB Table 11) ===
// Starting age = base + the variable die roll.
//
// Table 11's "Maximum Age Range" column is DELIBERATELY NOT TRANSCRIBED. The
// chapter states the maximum age "should be secretly determined and recorded by
// the DM. Player characters may have an idea of how long they expect to live,
// but do not know their true allotted life span." Do not add it.
const RACE_STARTING_AGE = {
  dwarf:      { base: 40,  dice: "5d6"  },
  elf:        { base: 100, dice: "5d6"  },
  gnome:      { base: 60,  dice: "3d12" },
  "half-elf": { base: 15,  dice: "1d6"  },
  halfling:   { base: 20,  dice: "3d4"  },
  human:      { base: 15,  dice: "1d4"  }
};
RACE_STARTING_AGE.halfelf = RACE_STARTING_AGE["half-elf"];

// === Aging effects (PHB Table 12) ===
// Ages are the PRINTED values. Table 12 describes them as 1/2 and 2/3 of the
// base maximum, but the book rounds (half-elf middle age prints as 62, not
// 62.5), so the printed figures are used rather than recomputed.
//
// Unlike Table 11's maximum age range, these thresholds ARE printed for players
// in Chapter 2, so displaying them is fine.
//
// The three footnotes are the mechanical payload, and the chapter states "All
// aging adjustments are cumulative" -- a venerable character has taken all
// three sets, not just the last.
const AGING_BRACKETS = [
  { key: "middle",    label: "Middle Age", effects: { str: -1,          con: -1, int: 1, wis: 1 } },
  { key: "old",       label: "Old Age",    effects: { str: -2, dex: -2, con: -1,         wis: 1 } },
  { key: "venerable", label: "Venerable",  effects: { str: -1, dex: -1, con: -1, int: 1, wis: 1 } }
];

const RACE_AGING = {
  dwarf:      { middle: 125, old: 167, venerable: 250 },
  elf:        { middle: 175, old: 233, venerable: 350 },
  gnome:      { middle: 100, old: 133, venerable: 200 },
  "half-elf": { middle: 62,  old: 83,  venerable: 125 },
  halfling:   { middle: 50,  old: 67,  venerable: 100 },
  human:      { middle: 45,  old: 60,  venerable: 90  }
};
RACE_AGING.halfelf = RACE_AGING["half-elf"];

// === Average height and weight (PHB Table 10) ===
// Height in INCHES, weight in POUNDS. Base is split male/female -- "Females
// tend to be lighter and shorter than males" -- and the same die modifier
// applies to both.
const RACE_HEIGHT_WEIGHT = {
  dwarf:      { height: { male: 43, female: 41, dice: "1d10" }, weight: { male: 130, female: 105, dice: "4d10" } },
  elf:        { height: { male: 55, female: 50, dice: "1d10" }, weight: { male: 90,  female: 70,  dice: "3d10" } },
  gnome:      { height: { male: 38, female: 36, dice: "1d6"  }, weight: { male: 72,  female: 68,  dice: "5d4"  } },
  "half-elf": { height: { male: 60, female: 58, dice: "2d6"  }, weight: { male: 110, female: 85,  dice: "3d12" } },
  halfling:   { height: { male: 32, female: 30, dice: "2d8"  }, weight: { male: 52,  female: 48,  dice: "5d4"  } },
  human:      { height: { male: 60, female: 59, dice: "2d10" }, weight: { male: 140, female: 100, dice: "6d10" } }
};
RACE_HEIGHT_WEIGHT.halfelf = RACE_HEIGHT_WEIGHT["half-elf"];

// Which aging brackets a character has reached, and the cumulative effect.
// Returns null when race or age is missing or unrecognised. Deliberately NOT
// gated on the optional rule -- the render layer decides whether to show it, so
// this stays a pure lookup.
function getAgingStatus(race, age) {
  const key = getRaceKey(race);
  const yrs = parseInt(age, 10);
  if (!key || !yrs || yrs < 1) return null;
  const thresholds = RACE_AGING[key];
  if (!thresholds) return null;

  const reached = [];
  const cumulative = {};
  let next = null;

  AGING_BRACKETS.forEach(b => {
    const at = thresholds[b.key];
    if (yrs >= at) {
      reached.push({ key: b.key, label: b.label, at: at, effects: b.effects });
      Object.keys(b.effects).forEach(stat => {
        cumulative[stat] = (cumulative[stat] || 0) + b.effects[stat];
      });
    } else if (!next) {
      next = { key: b.key, label: b.label, at: at };
    }
  });

  return {
    race: key,
    age: yrs,
    current: reached.length ? reached[reached.length - 1] : null,
    reached: reached,
    cumulative: cumulative,
    next: next
  };
}

// "-1 Str, -1 Con, +1 Int, +1 Wis" from an effects object. Fixed stat order so
// two brackets never print their adjustments in a different sequence.
function formatAgingEffects(effects) {
  const ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const SHORT = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' };
  if (!effects) return '';
  return ORDER
    .filter(s => effects[s])
    .map(s => (effects[s] > 0 ? '+' : '') + effects[s] + ' ' + SHORT[s])
    .join(', ');
}

// === Warrior melee attacks per round (PHB Table 15) ===
// WARRIORS ONLY -- the table is headed "Warrior Level" and the rule sits in the
// warrior group description. Every other class stays at 1 melee attack per
// round for its whole career.
// MELEE ONLY. Missile weapons have separate rates of fire (PHB Table 45) which
// are not derived from level.
const WARRIOR_ATTACKS_PER_ROUND = [
  { minLevel: 13, rate: '2'   },
  { minLevel: 7,  rate: '3/2' },
  { minLevel: 1,  rate: '1'   }
];

// Base melee attacks per round. Returns { rate, clazz, level, isWarrior }.
// Non-warriors get '1'.
function getBaseAttacksPerRound(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const pairs = [];
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = val(root, 'mc_class' + i) || '';
      if (c) pairs.push({ clazz: c, level: parseInt(val(root, 'mc_level' + i) || 0, 10) });
    }
  } else if (charType === 'dual') {
    // Both sides count: a dual-class character retains his old class's combat
    // ability, he merely forfeits the adventure's experience for using it.
    const nc = val(root, 'dc_new_class') || '';
    const oc = val(root, 'dc_original_class') || '';
    if (nc) pairs.push({ clazz: nc, level: parseInt(val(root, 'dc_new_level') || 0, 10) });
    if (oc) pairs.push({ clazz: oc, level: parseInt(val(root, 'dc_original_level') || 0, 10) });
  } else {
    const c = val(root, 'clazz') || '';
    if (c) pairs.push({ clazz: c, level: parseInt(val(root, 'level') || 0, 10) });
  }

  let best = { rate: '1', clazz: '', level: 0, isWarrior: false };
  pairs.forEach(p => {
    const cat = (typeof getClassCategory === 'function') ? getClassCategory(p.clazz) : null;
    if (cat !== 'warrior' || !p.level) return;
    const row = WARRIOR_ATTACKS_PER_ROUND.find(r => p.level >= r.minLevel);
    if (!row) return;
    if (p.level > best.level) {
      best = { rate: row.rate, clazz: p.clazz, level: p.level, isWarrior: true };
    }
  });
  return best;
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
// Opposition IS enforced -- see isOppositionSpell below, which tokenises the
// comma-joined School field and handles the Greater Divination wrinkle. An
// earlier note here claimed the opposite; it outlived the code it described.
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

// ===== Priest Sphere Access (PHB Ch.3 "Spells Allowed") =====
//
// A deity grants each sphere at one of two levels of access:
//   MAJOR -- any spell in that sphere the priest is high enough level to cast
//   MINOR -- spells of 3rd level or below in that sphere, and no higher
//
// PHB Ch.3: "A priest whose deity grants major access to a sphere can choose
// from any spell within that sphere (provided he is high enough in level to cast
// it), while one allowed only minor access to the sphere is limited to spells of
// 3rd level or below in that sphere."
//
// There is deliberately NO deity -> spheres lookup table here. The PHB publishes
// none: "Each deity's access to spheres is determined by the DM as he creates the
// pantheon of his world." Access is recorded per character from whatever the DM
// granted, which is why this is a stored character property and not a derivation.

const SPHERE_ACCESS_NONE  = 'none';
const SPHERE_ACCESS_MAJOR = 'major';
const SPHERE_ACCESS_MINOR = 'minor';

const MINOR_SPHERE_MAX_LEVEL = 3;

// The Sphere of All is not granted by any deity and is never editable:
// "All refers to spells usable by any priest, regardless of mythos. There are no
// Powers (deities) of the Sphere of All." It therefore has no major/minor state.
// Capping it at 3rd would also be flatly wrong -- it holds spells well above that
// (atonement is 5th, exaction 7th).
const SPHERE_ALL = 'All';

// The 16 spheres of influence the PHB itself defines (Ch.3).
// The spell data carries MORE than these: it splits the PHB's single "Elemental"
// sphere into its four elements and adds eight further Tome of Magic spheres
// (Chaos, Law, Numbers, Thought, Time, Travelers, War, Wards). Non-PHB spheres
// are never blocked -- they are only tagged in the UI, so a table running strict
// PHB can see at a glance which rows are not from the book.
const PHB_CORE_SPHERES = [
  'All', 'Animal', 'Astral', 'Charm', 'Combat', 'Creation', 'Divination',
  'Elemental', 'Guardian', 'Healing', 'Necromantic', 'Plant', 'Protection',
  'Summoning', 'Sun', 'Weather'
];

// The four spheres the data uses in place of the PHB's single "Elemental".
// A DM who grants "Elemental, major" is granting all four of these.
const ELEMENTAL_SPHERES = [
  'Elemental Air', 'Elemental Earth', 'Elemental Fire', 'Elemental Water'
];

// Is this the Sphere of All? Compared case-insensitively because the sphere name
// arrives from the spell data, the saved character record, and the UI, and those
// three have disagreed on casing before.
function isSphereAll(sphere) {
  return (sphere || '').trim().toLowerCase() === SPHERE_ALL.toLowerCase();
}

// Does the PHB define this sphere? The four "Elemental *" spheres count as PHB --
// they are that one PHB sphere subdivided, not an addition to it.
function isPHBSphere(sphere) {
  const s = (sphere || '').trim().toLowerCase();
  if (!s) return false;
  if (ELEMENTAL_SPHERES.some(e => e.toLowerCase() === s)) return true;
  return PHB_CORE_SPHERES.some(p => p.toLowerCase() === s);
}

// Highest spell level castable within ONE sphere, given that sphere's access.
//
// Returns Infinity where the sphere imposes no ceiling of its own (major access,
// and the Sphere of All). That is not "any level" -- the caller still has to clamp
// to what the character's own slot progression allows, and to the deity power cap
// if that optional rule is on. Keeping those limits separate is deliberate: they
// come from three different rules and the UI needs to say which one is biting.
//
// Returns 0 for no access, which is distinct from Infinity and must not be
// confused with it by a falsy check.
function getSphereLevelCap(sphere, access) {
  if (isSphereAll(sphere)) return Infinity;
  if (access === SPHERE_ACCESS_MAJOR) return Infinity;
  if (access === SPHERE_ACCESS_MINOR) return MINOR_SPHERE_MAX_LEVEL;
  return 0;
}

// Every sphere a spell is listed in, as an array of names.
//
// Accepts all three shapes a spell arrives in, because the browser, the spellbook
// and the memorized list each store it differently and unifying them here stops
// the next caller getting it wrong:
//   spells[] from SPELLS_DB  -> .sphere + .sphereSetting (comma-joined strings)
//   raw cleaned data         -> .spheres[] + .spheresSetting[]
//   saved character records  -> .schoolSphere (comma-joined string)
//
// Splits on commas ONLY, matching splitClassification() in spells.js: compound
// sphere names contain spaces ("Elemental Air"), so splitting on whitespace would
// shred them into tokens that match nothing.
function getSpellSpheres(spell) {
  if (!spell) return [];
  const out = [];

  const push = v => {
    if (!v) return;
    if (Array.isArray(v)) { v.forEach(x => push(x)); return; }
    String(v).split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
      if (!out.some(e => e.toLowerCase() === s.toLowerCase())) out.push(s);
    });
  };

  push(spell.spheres);
  push(spell.sphere);
  push(spell.spheresSetting);
  push(spell.sphereSetting);
  if (out.length === 0) push(spell.schoolSphere);

  return out;
}

// Look up one sphere in an access map, case-insensitively.
//
// The map keys come from getAllSpheres() and the spell's own sphere string comes
// from the same data, so they SHOULD match exactly -- but exact-match lookups on
// class and school names have silently broken four systems at once on this project
// before, so this one is defensive on purpose.
function getSphereAccessFor(sphere, accessMap) {
  const s = (sphere || '').trim().toLowerCase();
  if (!s) return SPHERE_ACCESS_NONE;
  const map = accessMap || {};
  const key = Object.keys(map).find(k => k.trim().toLowerCase() === s);
  return key ? (map[key] || SPHERE_ACCESS_NONE) : SPHERE_ACCESS_NONE;
}

// Can this priest take `spell`, and up to what spell level, on sphere access alone?
//
// A spell listed in MORE THAN ONE sphere qualifies on its BEST access. A spell
// sitting in both a major and a minor sphere is reached through the major one and
// the 3rd-level cap does not apply to it -- the priest has full access to that
// sphere and the spell is in it.
//
// This answers ONLY the sphere question. It does not know the character's level,
// his slot progression, or the deity power cap; those are separate limits applied
// by the caller. Kept apart deliberately so the UI can say which rule is biting
// rather than just refusing.
//
// Returns:
//   allowed   -- is any level of this spell reachable at all
//   cap       -- highest level reachable via the best sphere (Infinity = uncapped)
//   withinCap -- is THIS spell's own level within that cap
//   sphere    -- the sphere the cap came from
//   access    -- that sphere's access ('all' for the Sphere of All)
//   spheres   -- every sphere the spell is listed in, for tooltips
function getSpellSphereAccess(spell, accessMap) {
  const spheres = getSpellSpheres(spell);
  const level = (typeof spell?.level === 'number')
    ? spell.level
    : (parseInt(spell?.level, 10) || 0);

  const result = {
    allowed:   false,
    cap:       0,
    withinCap: false,
    sphere:    null,
    access:    SPHERE_ACCESS_NONE,
    spheres:   spheres,
    level:     level
  };

  spheres.forEach(name => {
    const all    = isSphereAll(name);
    const access = all ? 'all' : getSphereAccessFor(name, accessMap);
    const cap    = getSphereLevelCap(name, access);

    // Strict > keeps the FIRST sphere that reached a given cap, so a spell in two
    // major spheres reports the one listed first rather than the last.
    if (cap > result.cap) {
      result.cap    = cap;
      result.sphere = name;
      result.access = access;
    }
  });

  result.allowed   = result.cap > 0;
  result.withinCap = result.allowed && level <= result.cap;
  return result;
}

// ===== Deity Power Level (PHB Ch.7 -- OPTIONAL) =====
//
// "Your DM may rule that not all deities are equal, so that those of lesser power
// are unable to grant certain spells. If this optional rule is used, powers of
// demi-god status can only grant spells up to the 5th spell level. Lesser deities
// can grant 6th-level spells, while the greater deities have all spell levels
// available to them."
//
// This is a ceiling on what the PATRON can grant, so it applies to priest spells
// only and to every sphere alike -- it is not a sphere rule and does not interact
// with major/minor access. A cleric/mage's wizard side is untouched by it. The
// caller decides which spells it is applied to; this only reports the ceiling.

const DEITY_POWER_LEVELS = {
  greater: { label: 'Greater deity', maxSpellLevel: Infinity,
             note: 'All spell levels available.' },
  lesser:  { label: 'Lesser deity',  maxSpellLevel: 6,
             note: 'Grants spells up to 6th level.' },
  demigod: { label: 'Demi-god',      maxSpellLevel: 5,
             note: 'Grants spells up to 5th level.' }
};

// Unset means unrestricted. A character sheet with no answer recorded must not
// silently lose 6th and 7th level spells the moment the optional rule is ticked.
const DEITY_POWER_DEFAULT = 'greater';

// Normalize a stored status to a DEITY_POWER_LEVELS key. Strips everything but
// letters, so 'Demi-god', 'demi god' and 'DEMIGOD' all resolve. Unrecognized
// values fall back to the default rather than to a cap -- an unreadable value
// must never be the reason a priest loses spells.
function normalizeDeityPower(status) {
  const key = (status || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  return DEITY_POWER_LEVELS[key] ? key : DEITY_POWER_DEFAULT;
}

// Pure lookup: highest spell level a patron of this status can grant.
// Infinity for greater deities and for anything unrecognized.
function getDeityPowerCap(status) {
  return DEITY_POWER_LEVELS[normalizeDeityPower(status)].maxSpellLevel;
}

// The cap as it applies to THIS character, with the optional rule guard applied.
//
// Returns an object rather than a bare number so the UI can name the rule that is
// biting. Three separate limits can hold a priest's spell level down -- his own
// slot progression, minor sphere access, and this -- and "you cannot take that
// spell" is a much worse answer than "your patron is a demi-god."
//
//   cap     -- highest grantable spell level (Infinity = no restriction)
//   applied -- is a real restriction in force (false when the rule is off)
//   status  -- normalized key, or null when the rule is off
//   label   -- display name for the tooltip, or null
function getDeityLevelCap(root) {
  if (typeof isOptionalRule !== 'function' || !isOptionalRule('deityPowerLevel')) {
    return { cap: Infinity, applied: false, status: null, label: null };
  }

  // Guard `root` as well as `val` -- val() dereferences root.querySelector, so a
  // null root throws. No root means no answer recorded, which falls through to
  // the default and no cap. Fail open: never let a missing sheet be the reason a
  // priest loses spell levels.
  const raw = (root && typeof val === 'function') ? (val(root, 'deity_status') || '') : '';
  const key = normalizeDeityPower(raw);
  const row = DEITY_POWER_LEVELS[key];

  return {
    cap:     row.maxSpellLevel,
    applied: row.maxSpellLevel !== Infinity,
    status:  key,
    label:   row.label
  };
}

// ===== Memorization / Prayer Time (PHB Ch.7) =====
//
// "The wizard must have a clear head gained from a restful night's sleep and then
// has to spend time studying his spell books. The amount of study time needed is
// 10 minutes per level of the spell being memorized. Thus, a 9th-level spell (the
// most powerful) would require 90 minutes of careful study."
//
// Priests use the same figures: "The conditions for praying are identical to those
// needed for the wizard's studying." One helper serves both -- only the wording
// differs, and that is the caller's business.
//
// The eight hours is from the same chapter, in the reversible-spell example:
// "rest eight hours and study."

const MEMORIZATION_MINUTES_PER_SPELL_LEVEL = 10;
const MEMORIZATION_REST_HOURS = 8;

// Minutes to memorize ONE spell of the given level.
// Level 0 returns 0. That is arithmetic falling out of the formula, not a ruling:
// cantrips are a Tome of Magic addition and the PHB gives them no study time.
function getSpellMemorizationMinutes(level) {
  const lv = parseInt(level, 10);
  if (!isFinite(lv) || lv < 0) return 0;
  return lv * MEMORIZATION_MINUTES_PER_SPELL_LEVEL;
}

// Render minutes as "45 min" / "1 hr 30 min" / "2 hrs".
function formatMemorizationTime(minutes) {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m === 0) return 'none';
  if (m < 60) return m + ' min';

  const h    = Math.floor(m / 60);
  const rem  = m % 60;
  const hStr = h + (h === 1 ? ' hr' : ' hrs');
  return rem ? (hStr + ' ' + rem + ' min') : hStr;
}

// Total study/prayer time for an entire memorized loadout.
//
// Accepts an array of plain numbers OR of objects carrying a .level -- the
// memorized list stores rows and the browser stores spell objects, and neither
// should have to reshape before calling.
//
// Returns { minutes, text, spellCount, byLevel }, where byLevel[n] is how many
// spells are memorized at level n.
function getMemorizationTime(spells) {
  const byLevel = {};
  let minutes    = 0;
  let spellCount = 0;

  (Array.isArray(spells) ? spells : []).forEach(entry => {
    const lv = parseInt(
      (entry && typeof entry === 'object') ? entry.level : entry, 10
    );
    if (!isFinite(lv) || lv < 0) return;

    byLevel[lv] = (byLevel[lv] || 0) + 1;
    minutes    += getSpellMemorizationMinutes(lv);
    spellCount++;
  });

  return {
    minutes:    minutes,
    text:       formatMemorizationTime(minutes),
    spellCount: spellCount,
    byLevel:    byLevel
  };
}

// ===== Spell Casting Time (PHB Ch.7 -- OPTIONAL) =====
//
// "This entry is important, if the optional casting time rules are used. If only
// a number is given, the casting time is added to the caster's initiative die
// rolls. If the spell requires a round or number of rounds to cast, it goes into
// effect at the end of the last round of casting time. ... Spells requiring a
// turn or more go into effect at the end of the stated turn."
//
// The "only a number" wording is doing real work and is implemented literally.
// "1" is an initiative modifier; "1 round" is NOT -- it is a spell that resolves
// at the end of the round. Collapsing the two would hand every round-long spell a
// bogus +1 initiative, so the bare-number test is anchored at both ends.
//
// The real data is messier than the rule: 'rd.' appears as often as 'round', and
// entries like '3 or 1 turn' and '1 per claw' cannot be resolved without reading
// the spell. Anything not confidently a bare number yields NO initiative
// modifier. Over-reporting here would silently change combat order.

function parseSpellCastingTime(castTime) {
  const raw = String(castTime == null ? '' : castTime).trim();

  const out = {
    raw:        raw,
    kind:       'none',   // initiative | rounds | turns | longer | special | none
    initiative: null,     // non-null ONLY for kind 'initiative'
    value:      null,     // magnitude, where one can be read
    variable:   false,    // a range or per-level figure
    text:       ''
  };

  if (!raw) return out;

  // "If only a number is given" -- anchored, so '1 round' cannot reach here.
  const bare = raw.match(/^(\d+)$/);
  if (bare) {
    out.kind       = 'initiative';
    out.initiative = parseInt(bare[1], 10);
    out.value      = out.initiative;
    out.text       = '+' + out.initiative + ' initiative';
    return out;
  }

  const low = raw.toLowerCase();

  // Alternatives ('3 or 1 turn') need the spell text to resolve. Do not guess.
  if (/\bor\b/.test(low)) {
    out.kind = 'special';
    out.text = 'varies - see spell';
    return out;
  }

  // A range ('1-6 rd.') or a per-level figure ('1 round/level').
  out.variable = /\d\s*[-\u2013]\s*\d/.test(low) || low.indexOf('/') !== -1;

  const num = low.match(/(\d+)/);
  if (num) out.value = parseInt(num[1], 10);

  // \b works against 'rd.' because the period is a non-word character.
  if (/\brds?\b|\brounds?\b/.test(low)) {
    out.kind = 'rounds';
    out.text = out.variable
      ? 'resolves after ' + raw
      : 'resolves at end of round ' + (out.value || 1);
    return out;
  }

  if (/\bturns?\b/.test(low)) {
    out.kind = 'turns';
    out.text = out.variable
      ? 'resolves after ' + raw
      : 'resolves at end of turn ' + (out.value || 1);
    return out;
  }

  if (/\b(hour|hours|hr|hrs|day|days|week|weeks|month|months|year|years)\b/.test(low)) {
    out.kind = 'longer';
    out.text = 'takes ' + raw;
    return out;
  }

  out.kind = 'special';
  out.text = raw;
  return out;
}

// The initiative modifier for THIS spell with the optional rule guard applied.
// Returns null when the rule is off, when the casting time is not a bare number,
// or when it cannot be read -- callers add nothing on null.
//
// Mirrors getEffectiveWeaponSpeed's place in the weapon speed rule: the parser
// stays pure and testable, the gate lives in the wrapper.
function getSpellInitiativeModifier(castTime) {
  if (typeof isOptionalRule !== 'function' ||
      !isOptionalRule('spellCastingTimeInitiative')) return null;

  const parsed = parseSpellCastingTime(castTime);
  return parsed.kind === 'initiative' ? parsed.initiative : null;
}

// ===== Spell Components (PHB Ch.7 -- OPTIONAL) =====
//
// V / S / M. What makes this worth modelling is not the letters -- the sheet
// already prints those -- but that the rule CHANGES the base casting conditions.
//
// Without it, every spell needs the caster to speak AND have both arms free.
// With it, a spell needs only what it actually lists: a verbal-only spell can be
// cast while bound hand and foot, and a somatic-only spell can be cast inside a
// silence. That reverses which situations are survivable, which is exactly the
// sort of thing a player needs told at the table rather than inferred.
//
// PARSING IS DEFENSIVE BY NECESSITY. Provenance text has bled into this field in
// the source data -- 'V S Source: PHB page 171 WSC', 'V Source: The
// Planewalker's Handbook', 'V S Source: Page 1135 Encyclopedia Magica'. Matching
// letters anywhere would find the S in "Source" and the M in "Magica" and mark
// most of the library somatic and material. So: cut the provenance tail, then
// accept only whole tokens.
function parseSpellComponents(components) {
  const raw = String(components == null ? '' : components).trim();

  // Everything from "Source:" onward is provenance, not components.
  const head = raw.split(/\bSource\s*:/i)[0] || '';

  // Split on anything that is not a letter, so 'V, S, M' and 'V S M' both work.
  const tokens = head.split(/[^A-Za-z]+/).filter(Boolean);
  const has = L => tokens.some(t => t.toUpperCase() === L);

  const out = {
    raw:      raw,
    verbal:   has('V'),
    somatic:  has('S'),
    material: has('M')
  };

  // Distinguish "this spell has no components" from "we could not read the
  // field". Only the first is a fact; the second must stay silent.
  out.known = out.verbal || out.somatic || out.material;
  return out;
}

// Plain-English conditions for casting a spell under the component rules.
// Returns { known, needs[], prevented[], freedoms[] } -- `freedoms` being the
// interesting part: what this spell does NOT require that the base rules would.
function getSpellComponentNotes(components) {
  const c = parseSpellComponents(components);
  const out = { known: c.known, needs: [], prevented: [], freedoms: [] };
  if (!c.known) return out;

  if (c.verbal) {
    out.needs.push('speak clearly');
    out.prevented.push('silence, a gag, or anything else stopping speech');
  } else {
    out.freedoms.push('needs no speech \u2014 castable while gagged or silenced');
  }

  if (c.somatic) {
    out.needs.push('gesture freely');
    out.prevented.push('being bound or held, or too cramped to gesture');
  } else {
    out.freedoms.push('needs no gestures \u2014 castable while bound');
  }

  if (c.material) {
    out.needs.push('have the material component to hand');
    out.prevented.push('lacking or losing the component');
  }

  return out;
}
