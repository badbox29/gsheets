// ===== MULTI-CLASS SUPPORT (AD&D 2e) =====
// Multi-classing is only available to demihumans
// XP is split evenly between all classes
// Character uses BEST THAC0, BEST of each save type
// HP is averaged across all classes

// === Valid Multi-Class Combinations by Race (AD&D 2e PHB) ===
const MULTICLASS_COMBOS = {
  elf: [
    ["fighter", "mage"],
    ["fighter", "thief"],
    ["mage", "thief"],
    ["fighter", "mage", "thief"]
  ],
  "half-elf": [
    // Any two classes
    ["fighter", "cleric"],
    ["fighter", "thief"],
    ["fighter", "mage"],
    ["fighter", "druid"],
    ["fighter", "ranger"],
    ["cleric", "ranger"],
    ["cleric", "mage"],
    ["thief", "mage"],
    ["cleric", "thief"],
    // Plus the triple:
    ["fighter", "mage", "cleric"]
  ],
  halfelf: [
    // Alias for "half-elf"
    ["fighter", "cleric"],
    ["fighter", "thief"],
    ["fighter", "mage"],
    ["fighter", "druid"],
    ["fighter", "ranger"],
    ["cleric", "ranger"],
    ["cleric", "mage"],
    ["thief", "mage"],
    ["cleric", "thief"],
    ["fighter", "mage", "cleric"]
  ],
  dwarf: [
    ["fighter", "thief"],
    ["fighter", "cleric"]
  ],
  gnome: [
    ["fighter", "thief"],
    ["fighter", "illusionist"],
    ["cleric", "thief"],
    ["illusionist", "thief"],
    ["cleric", "illusionist"]
  ],
  halfling: [
    ["fighter", "thief"]
  ]
};

/**
 * Normalize a class name for comparison
 */
function normalizeClassName(className) {
  if (!className) return '';
  return className.trim().toLowerCase();
}

/**
 * Check if a race can multi-class at all
 */
function canRaceMultiClass(race) {
  const r = normalizeClassName(race);
  return r && MULTICLASS_COMBOS[r] !== undefined;
}

/**
 * Check if a specific multi-class combination is valid for a race
 * @param {string} race - Character's race
 * @param {Array<string>} classes - Array of class names
 * @returns {boolean} - True if valid combination
 */
function isValidMultiClassCombo(race, classes) {
  const r = normalizeClassName(race);
  
  // If race can't multi-class, return false
  if (!MULTICLASS_COMBOS[r]) return false;
  
  // Normalize and sort the classes array for comparison
  const normalizedClasses = classes.map(c => normalizeClassName(c)).sort();
  
  // Check if this combination exists in the allowed list
  const validCombos = MULTICLASS_COMBOS[r];
  return validCombos.some(combo => {
    const sortedCombo = combo.map(c => normalizeClassName(c)).sort();
    return JSON.stringify(sortedCombo) === JSON.stringify(normalizedClasses);
  });
}

/**
 * Get all valid multi-class combinations for a race
 * @param {string} race - Character's race
 * @returns {Array<Array<string>>} - Array of valid class combinations
 */
function getValidCombosForRace(race) {
  const r = normalizeClassName(race);
  return MULTICLASS_COMBOS[r] || [];
}

/**
 * Split XP evenly among classes
 * @param {number} totalXP - Total XP earned
 * @param {number} numClasses - Number of classes (2 or 3)
 * @returns {number} - XP per class
 */
function splitXP(totalXP, numClasses) {
  if (!numClasses || numClasses < 1) return 0;
  return Math.floor(totalXP / numClasses);
}

/**
 * Calculate total XP from individual class XP values
 * @param {Array<number>} classXPs - Array of XP values per class
 * @returns {number} - Total XP
 */
function calculateTotalXP(classXPs) {
  if (!classXPs || !classXPs.length) return 0;
  // Each class XP represents a split portion, so multiply by number of classes
  return classXPs[0] * classXPs.length;
}

/**
 * Get the best (lowest) THAC0 from multiple classes
 * Returns object with thac0 value and source class info
 * @param {Array<{class: string, level: number}>} classData
 * @returns {Object} - {thac0: number, source: string}
 */
function getBestTHAC0(classData) {
  let bestTHAC0 = 20;
  let bestSource = '';
  
  classData.forEach(({clazz, level}) => {
    const category = CLASS_CATEGORIES[normalizeClassName(clazz)] || 'rogue';
    const table = THAC0_TABLES[category] || THAC0_TABLES.rogue;
    const thac0 = table[Math.min(level - 1, table.length - 1)] || 20;
    
    // Lower is better for THAC0
    if (thac0 < bestTHAC0) {
      bestTHAC0 = thac0;
      bestSource = `${clazz.charAt(0).toUpperCase() + clazz.slice(1)} ${level}`;
    }
  });
  
  return { thac0: bestTHAC0, source: bestSource };
}

/**
 * Get the best (lowest) saving throws from multiple classes
 * Returns object with saves array and source info for each
 * @param {Array<{class: string, level: number}>} classData
 * @returns {Object} - {saves: Array<number>, sources: Array<string>}
 */
function getBestSaves(classData) {
  // Start with worst possible saves
  let bestSaves = [20, 20, 20, 20, 20];
  let sources = ['', '', '', '', ''];
  const saveNames = ['Para/Poison/Death', 'Rod/Staff/Wand', 'Petrification/Polymorph', 'Breath Weapon', 'Spell'];
  
  classData.forEach(({clazz, level}) => {
    const category = CLASS_CATEGORIES[normalizeClassName(clazz)] || 'rogue';
    const table = SAVES[category];
    
    if (!table) return;
    
    // Find the appropriate level entry (they increase at intervals)
    let saves = [20, 20, 20, 20, 20];
    for (let i = table.length - 1; i >= 0; i--) {
      if (level >= table[i].level) {
        saves = table[i].saves;
        break;
      }
    }
    
    // Take the best (lowest) of each save type and track source
    for (let i = 0; i < 5; i++) {
      if (saves[i] < bestSaves[i]) {
        bestSaves[i] = saves[i];
        sources[i] = `${clazz.charAt(0).toUpperCase() + clazz.slice(1)} ${level}`;
      }
    }
  });
  
  return { saves: bestSaves, sources };
}

/**
 * Calculate average HP for multi-class character
 * This is a simplified version - actual implementation should track HP per level
 * @param {Array<{class: string, level: number, hitDie: number}>} classData
 * @param {number} conBonus - Constitution HP bonus per level
 * @returns {number} - Average max HP
 */
function calculateAverageHP(classData, conBonus) {
  // This is a placeholder - the actual HP calculation should be done
  // by tracking each level and averaging the hit dice
  // For now, we'll return a simple calculation
  
  let totalHP = 0;
  const maxLevel = Math.max(...classData.map(c => c.level));
  
  // Get hit dice for each class
  const hitDice = classData.map(c => {
    const clazz = normalizeClassName(c.clazz);
    // Warriors: d10, Priests: d8, Rogues: d6, Wizards: d4
    const category = CLASS_CATEGORIES[clazz] || 'rogue';
    if (category === 'warrior') return 10;
    if (category === 'priest') return 8;
    if (category === 'rogue') return 6;
    if (category === 'wizard') return 4;
    return 6; // default
  });
  
  // For each level, average the hit dice of all classes
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    let levelHP = 0;
    let numClassesAtThisLevel = 0;
    
    classData.forEach((c, idx) => {
      if (c.level >= lvl) {
        levelHP += hitDice[idx];
        numClassesAtThisLevel++;
      }
    });
    
    if (numClassesAtThisLevel > 0) {
      // Average and add CON bonus
      totalHP += Math.floor(levelHP / numClassesAtThisLevel) + conBonus;
    }
  }
  
  return totalHP;
}

/**
 * Combine spell slots from multiple caster classes
 * @param {Array<{class: string, level: number, wis: number}>} classData
 * @param {number} wisdom - Wisdom score for bonus spells
 * @returns {Object} - {slots: Array<number>, sources: Array<string>, details: Array<Array<string>>}
 */
function combineSpellSlots(classData, wisdom) {
  const combinedSlots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const sources = [];
  const details = [[], [], [], [], [], [], [], [], []]; // Detailed breakdown per spell level
  
  classData.forEach(({clazz, level}) => {
    const normalized = normalizeClassName(clazz);
    const table = SPELL_SLOTS_TABLES[normalized];
    
    if (!table || !table[level]) return; // Not a caster or invalid level
    
    sources.push(clazz);
    const slots = table[level];
    
    // Add base slots from this class
    for (let i = 0; i < slots.length && i < 9; i++) {
      const baseSlots = slots[i] || 0;
      if (baseSlots > 0) {
        combinedSlots[i] += baseSlots;
        const className = clazz.charAt(0).toUpperCase() + clazz.slice(1);
        details[i].push(`${className}: ${baseSlots}`);
      }
    }
    
    // Add wisdom bonus spells for priests only
    const category = CLASS_CATEGORIES[normalized];
    if (category === 'priest' && wisdom >= 13) {
      const wisBonus = WIS_BONUS_SPELLS[wisdom] || [0,0,0,0,0,0,0,0,0];
      for (let i = 0; i < wisBonus.length && i < 9; i++) {
        if (wisBonus[i] > 0) {
          combinedSlots[i] += wisBonus[i];
          details[i].push(`Wisdom bonus: +${wisBonus[i]}`);
        }
      }
    }
  });
  
  return { slots: combinedSlots, sources, details };
}

/**
 * Generate a display string for multi-class
 * @param {Array<string>} classes - Array of class names
 * @param {Array<number>} levels - Array of levels
 * @returns {string} - Display string like "Fighter 5 / Mage 4"
 */
function formatMultiClassDisplay(classes, levels) {
  if (!classes || !levels || classes.length !== levels.length) {
    return '';
  }
  
  return classes.map((c, idx) => {
    const className = c.charAt(0).toUpperCase() + c.slice(1);
    return `${className} ${levels[idx]}`;
  }).join(' / ');
}

/**
 * Check if character should be treated as multi-class
 * @param {Object} root - Character sheet root element
 * @returns {boolean}
 */
function isMultiClassCharacter(root) {
  if (!root) return false;
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  return charType === 'multi';
}