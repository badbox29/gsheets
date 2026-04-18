// ===== DUAL-CLASS SUPPORT (AD&D 2e) =====
// Dual-classing is only available to humans
// Original class becomes dormant until new class level exceeds original level
// After activation, can use abilities from both classes

/**
 * Check if a character can dual-class
 * Only humans can dual-class in AD&D 2e
 */
function canDualClass(race) {
  const r = (race || '').trim().toLowerCase();
  return r === 'human' || r === '';
}

/**
 * Get prime requisites for a class
 * Returns array of ability names that are prime requisites
 */
function getPrimeRequisites(className) {
  const clazz = (className || '').trim().toLowerCase();
  
  if (clazz.includes('fighter') || clazz.includes('warrior')) {
    return ['str'];
  } else if (clazz.includes('ranger')) {
    return ['str', 'dex', 'wis'];
  } else if (clazz.includes('paladin')) {
    return ['str', 'cha'];
  } else if (clazz.includes('mage') || clazz.includes('wizard') || 
             clazz.includes('illusionist') || clazz.includes('specialist')) {
    return ['int'];
  } else if (clazz.includes('cleric') || clazz.includes('priest')) {
    return ['wis'];
  } else if (clazz.includes('druid')) {
    return ['wis'];
  } else if (clazz.includes('thief') || clazz.includes('rogue')) {
    return ['dex'];
  } else if (clazz.includes('bard')) {
    return ['dex', 'cha'];
  }
  
  return [];
}

/**
 * Get ability score value by name
 */
function getAbilityScore(root, abilityName) {
  return parseInt(val(root, abilityName) || 0, 10);
}

/**
 * Check if prime requisites meet dual-class requirements
 * Original class needs 15+ in all prime requisites
 * New class needs 17+ in all prime requisites
 */
function validateDualClassRequirements(root, originalClass, newClass) {
  const errors = [];
  
  // Get prime requisites for both classes
  const originalPrimes = getPrimeRequisites(originalClass);
  const newPrimes = getPrimeRequisites(newClass);
  
  // Check original class prime requisites (need 15+)
  originalPrimes.forEach(ability => {
    const score = getAbilityScore(root, ability);
    if (score < 15) {
      const abilityName = ability.toUpperCase();
      errors.push(`${abilityName} must be 15+ for ${originalClass} (currently ${score})`);
    }
  });
  
  // Check new class prime requisites (need 17+)
  newPrimes.forEach(ability => {
    const score = getAbilityScore(root, ability);
    if (score < 17) {
      const abilityName = ability.toUpperCase();
      errors.push(`${abilityName} must be 17+ for ${newClass} (currently ${score})`);
    }
  });
  
  return errors;
}

/**
 * Check if dual-class character is dormant
 * Dormant when new class level <= original class level
 */
function isDormant(originalLevel, newLevel) {
  return newLevel <= originalLevel;
}

/**
 * Get status message for dual-class character
 */
function getDualClassStatus(originalClass, originalLevel, newClass, newLevel) {
  if (isDormant(originalLevel, newLevel)) {
    const levelsNeeded = originalLevel - newLevel + 1;
    const nextLevel = newLevel + 1;
    return {
      isDormant: true,
      message: `⚠ DORMANT: Only ${newClass} abilities available. Reach ${newClass} ${originalLevel + 1} to activate ${originalClass} abilities (${levelsNeeded} level${levelsNeeded > 1 ? 's' : ''} to go).`,
      type: 'warning'
    };
  } else {
    return {
      isDormant: false,
      message: `✓ ACTIVE: Can use abilities from both ${originalClass} ${originalLevel} and ${newClass} ${newLevel}.`,
      type: 'success'
    };
  }
}

/**
 * Format dual-class display string
 */
function formatDualClassDisplay(originalClass, originalLevel, newClass, newLevel) {
  const orig = originalClass.charAt(0).toUpperCase() + originalClass.slice(1);
  const newC = newClass.charAt(0).toUpperCase() + newClass.slice(1);
  return `${orig} ${originalLevel} / ${newC} ${newLevel}`;
}

/**
 * Check if character should be treated as dual-class
 */
function isDualClassCharacter(root) {
  if (!root) return false;
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  return charType === 'dual';
}