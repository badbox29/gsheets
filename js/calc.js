// ===== Utilities =====
function renderWisdomPriestEffects(root) {
  const clazz = (val(root,"clazz")||"").toLowerCase();
  const wis = parseInt(val(root,"wis")||0,10);

  const mdaEl = root.querySelector('[data-field="wis_mda"]');
  const failureEl = root.querySelector('[data-field="wis_spell_failure"]');
  const immunityEl = root.querySelector('[data-field="wis_immunities"]');
  const bonusSpellsEl = root.querySelector('[data-field="wis_bonus_spells"]');

  if (!mdaEl || !failureEl || !immunityEl || !bonusSpellsEl) return;
  
  // Magical Defense Adj.
  mdaEl.value = (WIS_MDA[wis] !== undefined ? (WIS_MDA[wis] >=0 ? "+" : "")+WIS_MDA[wis] : "—");

  // Only for priests (cleric/druid)
  const isPriest = clazz.includes("cleric") || clazz.includes("druid") || clazz.includes("paladin") || clazz.includes("ranger");
  
  if (!isPriest) {
    failureEl.value = "";
    immunityEl.value = "";
    bonusSpellsEl.value = "";
    return;
  }

  // Spell failure
  failureEl.value = (wis <= 8 ? WIS_SPELL_FAILURE[wis] || "" : "—");

  // Immunities
  if (wis >= 19) {
    immunityEl.value = WIS_IMMUNITIES[wis] || WIS_IMMUNITIES[23];
  } else {
    immunityEl.value = "—";
  }
  
  // Bonus Spells
  const bonusSpells = WIS_BONUS_SPELLS[wis];
  if (bonusSpells && wis >= 13) {
    const bonusLevels = [];
    bonusSpells.forEach((count, level) => {
      if (count > 0 && level < 7) { // Only show levels 1-7 (index 0-6)
        bonusLevels.push(`+${count} L${level + 1}`);
      }
    });
    bonusSpellsEl.value = bonusLevels.length > 0 ? bonusLevels.join(", ") : "—";
  } else {
    bonusSpellsEl.value = "—";
  }
}
	
function renderWisdomSaveAdjustments(root) {
  const wis = parseInt(val(root,"wis")||0,10);
  if (!wis || wis < 1 || wis > 25) return;

  const adj = WIS_SAVE_ADJ[wis] || 0;

  // Save vs Spell base (save5) — unchanged, no WIS modifier applied here
  const spellSaveEl = root.querySelector('[data-field="save5"]');

  // Spell (Mental) field — applies WIS MDA adjustment
  const mentalSaveEl = root.querySelector('[data-field="save5_mental"]');
  if (mentalSaveEl && spellSaveEl) {
    const base = parseInt(spellSaveEl.value) || 0;
    const manualMod = parseInt((root.querySelector('[data-field="savemod5_mental"]') || {}).value || 0, 10);
    const total = base - adj + manualMod;
    mentalSaveEl.value = total;

    // Build tooltip
    const sign = adj >= 0 ? "+" : "";
    const modSign = manualMod >= 0 ? "+" : "";
    mentalSaveEl.title = `Spell (Mental) Save\nBase Spell Save: ${base}\nWIS MDA: ${sign}${adj}${manualMod !== 0 ? `\nManual Mod: ${modSign}${manualMod}` : ""}\nFinal: ${total}\n(Applies to mind-affecting spells only)`;
  }
}

function renderCharismaEffects(root) {
  const cha = parseInt(val(root,"cha")||0,10);
  if (!cha || cha < 2 || cha > 25) return;

  const effects = CHA_TABLE[cha];
  if (!effects) return;

  // Populate Details tab fields (original)
  val(root,"henchmen_max", effects.henchmen);
  val(root,"loyalty_base", effects.loyalty);

  // Reaction adj visible in two places on Details tab
  const adjStr = (effects.reaction >= 0 ? "+" : "") + effects.reaction;
  val(root,"cha_reaction_core", adjStr);
  
  // Populate Core tab Charisma fields
  val(root,"cha_max_henchmen_core", effects.henchmen);
  val(root,"cha_loyalty_core", effects.loyalty);
  
  // Also populate Followers tab fields (new)
  val(root,"reaction_adj", adjStr);
  
  // Update follower capacity fields in Followers tab
  const followersMaxEl = root.querySelector('[data-field="henchmen_max"]');
  const loyaltyBaseEl = root.querySelector('[data-field="loyalty_base"]');
  
  if (followersMaxEl) {
    followersMaxEl.value = effects.henchmen;
  }
  
  if (loyaltyBaseEl) {
    loyaltyBaseEl.value = effects.loyalty;
  }
}

function renderCurrentHP(root) {
  const maxHP = parseInt(val(root, 'hp') || 0, 10);
  const damageTaken = parseInt(val(root, 'damage_taken') || 0, 10);
  const currentHP = Math.max(0, maxHP - damageTaken);
  
  const currentHPEl = root.querySelector('[data-field="current_hp"]');
  if (currentHPEl) {
    currentHPEl.value = currentHP;
    
    // Color coding based on HP status
    if (currentHP === 0) {
      currentHPEl.style.color = '#ff4444'; // Red for 0 HP
    } else if (currentHP <= maxHP * 0.25) {
      currentHPEl.style.color = '#ff6b6b'; // Light red for critical
    } else if (currentHP <= maxHP * 0.5) {
      currentHPEl.style.color = '#ffa500'; // Orange for bloodied
    } else {
      currentHPEl.style.color = 'var(--accent-light)'; // Normal color
    }
  }
}

// ===== Combat Quick Reference =====
function renderCombatQuickReference(root) {
  // Get ability scores
  const dex = parseInt(val(root, 'dex') || 10, 10);
  const str = parseInt(val(root, 'str') || 10, 10);
  const strExceptional = val(root, 'str_exceptional') || '';
  
  // Get combat stats
  const clazz = val(root, 'clazz');
  const level = parseInt(val(root, 'level') || 1, 10);
  const thac0 = getThac0(clazz, level) || '—';
  const ac = val(root, 'ac') || '—';
  const moveRate = val(root, 'movement_current') || '—';
  
  // Calculate current HP
  const maxHP = parseInt(val(root, 'hp') || 0, 10);
  const damageTaken = parseInt(val(root, 'damage_taken') || 0, 10);
  const currentHP = Math.max(0, maxHP - damageTaken);
  const hpDisplay = currentHP + '/' + maxHP;
  
  // Calculate initiative (DEX reaction adjustment)
  const dexData = (typeof DEX_TABLE !== 'undefined' && DEX_TABLE[dex]) ? DEX_TABLE[dex] : null;
  const initiative = dexData ? dexData[0] : 0; // Reaction adjustment is index 0
  const initiativeStr = (initiative >= 0 ? '+' : '') + initiative;
  
  // Calculate STR bonuses
  let strToHit = 0;
  let strDamage = 0;
  if (typeof STR_TABLE !== 'undefined' && STR_TABLE[str]) {
    let strData = STR_TABLE[str];
    // Handle exceptional strength for 18
    if (str === 18 && strExceptional && typeof STR_EXCEPTIONAL !== 'undefined' && STR_EXCEPTIONAL[strExceptional]) {
      strData = STR_EXCEPTIONAL[strExceptional];
    }
    strToHit = strData[0] || 0;
    strDamage = strData[1] || 0;
  }
  
  // Calculate DEX missile bonus
  const dexData2 = (typeof DEX_TABLE !== 'undefined' && DEX_TABLE[dex]) ? DEX_TABLE[dex] : null;
  const dexMissile = dexData2 ? dexData2[1] : 0; // Missile attack adj is index 1
  
  // Update combat stats display
  const initiativeEl = root.querySelector('.combat-initiative');
  const thac0El = root.querySelector('.combat-thac0');
  const acEl = root.querySelector('.combat-ac');
  const moveEl = root.querySelector('.combat-move');
  const hpEl = root.querySelector('.combat-hp');
  
  if (initiativeEl) initiativeEl.textContent = initiativeStr;
  if (thac0El) thac0El.textContent = thac0;
  if (acEl) acEl.textContent = ac;
  if (moveEl) moveEl.textContent = moveRate;
  if (hpEl) {
    hpEl.textContent = hpDisplay;
    // Color code HP display
    if (currentHP === 0) {
      hpEl.style.color = '#ff4444';
    } else if (currentHP <= maxHP * 0.25) {
      hpEl.style.color = '#ff6b6b';
    } else if (currentHP <= maxHP * 0.5) {
      hpEl.style.color = '#ffa500';
    } else {
      hpEl.style.color = 'var(--accent-light)';
    }
  }
  
  // Get equipped weapons
  const weaponsList = root.querySelector('.combat-weapons-list');
  if (!weaponsList) return;
  
  const equippedWeapons = [];
  qsa(root, '.weapons-list .item').forEach(el => {
    const equipped = el.querySelector('.equipped');
    if (equipped && equipped.checked) {
      equippedWeapons.push({
        name: el.querySelector('.title').value || 'Unnamed Weapon',
        damageSM: el.querySelector('.damage-sm').value || '1d6',
        damageL: el.querySelector('.damage-l').value || '1d6',
        magicBonus: parseInt(el.querySelector('.magic-bonus').value || 0, 10)
      });
    }
  });
  
  // Render equipped weapons
  if (equippedWeapons.length === 0) {
    weaponsList.innerHTML = '<div style="color:var(--muted);font-style:italic;">No weapons equipped</div>';
  } else {
    let html = '';
    equippedWeapons.forEach(weapon => {
      const magicBonus = weapon.magicBonus || 0;
      
      // Calculate melee to-hit (STR + magic)
      const meleeToHit = strToHit + magicBonus;
      const meleeToHitStr = (meleeToHit >= 0 ? '+' : '') + meleeToHit;
      
      // Calculate missile to-hit (DEX + magic)
      const missileToHit = dexMissile + magicBonus;
      const missileToHitStr = (missileToHit >= 0 ? '+' : '') + missileToHit;
      
      // Calculate damage (STR + magic for melee, just magic for missile)
      const meleeDamage = strDamage + magicBonus;
      const meleeDamageStr = (meleeDamage >= 0 ? '+' : '') + meleeDamage;
      const missileDamage = magicBonus;
      const missileDamageStr = (missileDamage > 0 ? '+' + missileDamage : missileDamage < 0 ? missileDamage : '');
      
      html += '<div style="margin-bottom:6px;padding:4px;background:rgba(255,255,255,0.03);border-radius:4px;">';
      html += '<div style="font-weight:600;color:var(--accent-light);">• ' + weapon.name + '</div>';
      html += '<div style="margin-left:10px;color:var(--text);">';
      html += 'Melee: d20' + meleeToHitStr + ' → ' + weapon.damageSM + meleeDamageStr + ' / ' + weapon.damageL + meleeDamageStr + '<br>';
      html += 'Missile: d20' + missileToHitStr + ' → ' + weapon.damageSM + (missileDamageStr || '') + ' / ' + weapon.damageL + (missileDamageStr || '');
      html += '</div>';
      html += '</div>';
    });
    weaponsList.innerHTML = html;
  }
}
	
function cleanupOldWisTooltips(root) {
  const clazz = (val(root,"clazz")||"").toLowerCase();
  const level = parseInt(val(root,"level")||0);

  // Only clerics/druids are allowed Wisdom bonuses
  const isPriest = clazz.includes("cleric") || clazz.includes("druid");

  // Match table again for baseline slot numbers
  let table = null;
  if (clazz.includes("cleric")) table = SPELL_SLOTS_TABLES.cleric;
  else if (clazz.includes("druid")) table = SPELL_SLOTS_TABLES.druid;
  else if (clazz.includes("mage")) table = SPELL_SLOTS_TABLES.mage;
  else if (clazz.includes("illusionist")) table = SPELL_SLOTS_TABLES.illusionist;
  else if (clazz.includes("hb_dpaladin")) table = SPELL_SLOTS_TABLES.hb_dpaladin;
  else if (clazz.includes("demipaladin")) table = SPELL_SLOTS_TABLES.demipaladin;
  else if (clazz.includes("paladin")) table = SPELL_SLOTS_TABLES.paladin;
  else if (clazz.includes("ranger")) table = SPELL_SLOTS_TABLES.ranger;
  else if (clazz.includes("bard")) table = SPELL_SLOTS_TABLES.bard;

  if (!table) return;

  const baseSlots = table[level] ? [...table[level]] : Array(9).fill(0);

  // Scan all spell slot fields
  root.querySelectorAll('[data-field^="slots"]').forEach((el, i) => {
    if (!isPriest) {
      // Reset value to base table (no Wis bonuses for non-priests)
      el.value = baseSlots[i] || "";
      // Strip tooltip
      el.removeAttribute("title");
    }
  });
}

function renderConstitutionEffects(root) {
  const con = parseInt(val(root, "con") || 0, 10);
  const clazz = (val(root, "clazz") || "").toLowerCase();
  
  // Get the field elements
  const hpBonusEl = root.querySelector('[data-field="con_hpbonus"]');
  const shockEl = root.querySelector('[data-field="con_shock"]');
  const resEl = root.querySelector('[data-field="con_res"]');
  const poisonEl = root.querySelector('[data-field="con_poison"]');
  const regenEl = root.querySelector('[data-field="con_regen"]');
  
  if (!hpBonusEl || !shockEl || !resEl || !poisonEl || !regenEl) {
	return;
  }
  
  // Clear if invalid CON
  if (!con || con < 1 || con > 25) {
    hpBonusEl.value = "";
    shockEl.value = "";
    resEl.value = "";
    poisonEl.value = "";
    regenEl.value = "";
    return;
  }
  
  // Determine if warrior class
  const isWarrior = ["fighter", "paladin", "ranger", "warrior", "barbarian", "hb_dpaladin"].some(c => clazz.includes(c));
  
  // HP Bonus per level (index 0 = non-warrior, index 1 = warrior)
  const hpBonus = CON_HP_BONUS[con];
  if (hpBonus) {
    const bonus = isWarrior ? hpBonus[1] : hpBonus[0];
    const valueToSet = (bonus >= 0 ? "+" : "") + bonus;
    hpBonusEl.value = valueToSet
    hpBonusEl.title = isWarrior ? "Warrior HP bonus" : "Non-warrior HP bonus";
  } else {
    hpBonusEl.value = "";
  }
  
  // System Shock
  shockEl.value = (CON_SYSTEM_SHOCK[con] !== undefined ? CON_SYSTEM_SHOCK[con] + "%" : "");
  
  // Resurrection Survival
  resEl.value = (CON_RESURRECTION[con] !== undefined ? CON_RESURRECTION[con] + "%" : "");
  
  // Poison Save Adjustment
  const poisonAdj = CON_POISON_ADJ[con];
  if (poisonAdj !== undefined) {
    poisonEl.value = (poisonAdj >= 0 ? "+" : "") + poisonAdj;
    poisonEl.title = "Applied to Paralyzation/Poison/Death saves";
  } else {
    poisonEl.value = "";
  }
  
  // Regeneration
  if (CON_REGENERATION[con]) {
    regenEl.value = CON_REGENERATION[con];
  } else {
    regenEl.value = "—";
  }
}

function renderStrengthEffects(root) {
  const str = parseInt(val(root, "str") || 0, 10);
  const clazz = (val(root, "clazz") || "").toLowerCase();
  const exceptionalStr = val(root, "str_exceptional").trim();
  
  // Get the field elements
  const tohitEl = root.querySelector('[data-field="str_tohit"]');
  const damageEl = root.querySelector('[data-field="str_damage"]');
  const weightEl = root.querySelector('[data-field="str_weight"]');
  const doorsEl = root.querySelector('[data-field="str_opendoors"]');
  const bendbarsEl = root.querySelector('[data-field="str_bendbars"]');
  
  if (!tohitEl || !damageEl || !weightEl || !doorsEl || !bendbarsEl) return;
  
  // Clear if invalid STR
  if (!str || str < 1 || str > 25) {
    tohitEl.value = "";
    damageEl.value = "";
    weightEl.value = "";
    doorsEl.value = "";
    bendbarsEl.value = "";
    return;
  }
  
  // Determine if warrior class (can have exceptional strength)
  const isWarrior = ["fighter", "paladin", "ranger", "warrior", "barbarian"].some(c => clazz.includes(c));
  
  let strData = STR_TABLE[str];
  
  // Handle exceptional strength for 18/xx (warriors only)
  if (str === 18 && isWarrior && exceptionalStr) {
    const excValue = parseInt(exceptionalStr, 10);
    if (excValue >= 1 && excValue <= 50) {
      strData = STR_18_EXCEPTIONAL[1];
    } else if (excValue >= 51 && excValue <= 75) {
      strData = STR_18_EXCEPTIONAL[51];
    } else if (excValue >= 76 && excValue <= 90) {
      strData = STR_18_EXCEPTIONAL[76];
    } else if (excValue >= 91 && excValue <= 99) {
      strData = STR_18_EXCEPTIONAL[91];
    } else if (excValue === 0 || excValue === 100) {
      strData = STR_18_EXCEPTIONAL[100];
    }
  }
  
  if (strData) {
    // [to-hit, damage, weight, open doors, bend bars]
    const [tohit, damage, weight, doors, bendbars] = strData;
    
    tohitEl.value = (tohit >= 0 ? "+" : "") + tohit;
    damageEl.value = (damage >= 0 ? "+" : "") + damage;
    weightEl.value = weight + " lbs";
    doorsEl.value = doors + " (d20)";
    bendbarsEl.value = bendbars + "%";
    
    // Tooltip for exceptional strength
    if (str === 18 && isWarrior && exceptionalStr) {
      tohitEl.title = `Includes exceptional STR 18/${exceptionalStr}`;
      damageEl.title = `Includes exceptional STR 18/${exceptionalStr}`;
      weightEl.title = `Includes exceptional STR 18/${exceptionalStr}`;
    } else {
      tohitEl.removeAttribute("title");
      damageEl.removeAttribute("title");
      weightEl.removeAttribute("title");
    }
  }
}

function renderDexterityEffects(root) {
  const dex = parseInt(val(root, "dex") || 0, 10);
  
  // Get the field elements
  const reactionEl = root.querySelector('[data-field="dex_reaction"]');
  const missileEl = root.querySelector('[data-field="dex_missile"]');
  const acEl = root.querySelector('[data-field="dex_ac"]');
  
  if (!reactionEl || !missileEl || !acEl) return;
  
  // Clear if invalid DEX
  if (!dex || dex < 1 || dex > 25) {
    reactionEl.value = "";
    missileEl.value = "";
    acEl.value = "";
    return;
  }
  
  const dexData = DEX_TABLE[dex];
  
  if (dexData) {
    // [reaction, missile attack, defensive AC]
    const [reaction, missile, defensive] = dexData;
    
    reactionEl.value = (reaction >= 0 ? "+" : "") + reaction;
    missileEl.value = (missile >= 0 ? "+" : "") + missile;
    acEl.value = (defensive >= 0 ? "+" : "") + defensive;
    
    // Tooltip for AC (since negative is better)
    acEl.title = defensive < 0 
      ? "Negative AC is better (harder to hit)" 
      : defensive > 0 
        ? "Positive AC is worse (easier to hit)" 
        : "No AC adjustment";
  }
}

function renderIntelligenceEffects(root) {
  const int = parseInt(val(root, "int") || 0, 10);
  const clazz = (val(root, "clazz") || "").toLowerCase();
  
  // Get the field elements
  const languagesEl = root.querySelector('[data-field="int_languages"]');
  const bonusProfsEl = root.querySelector('[data-field="int_bonus_profs"]');
  const immunityEl = root.querySelector('[data-field="int_immunity"]');
  const learnSpellEl = root.querySelector('[data-field="int_learn_spell"]');
  const maxSpellsEl = root.querySelector('[data-field="int_max_spells"]');
  
  if (!languagesEl || !bonusProfsEl || !immunityEl || !learnSpellEl || !maxSpellsEl) return;
  
  // Clear if invalid INT
  if (!int || int < 1 || int > 25) {
    languagesEl.value = "";
    bonusProfsEl.value = "";
    immunityEl.value = "";
    learnSpellEl.value = "";
    maxSpellsEl.value = "";
    return;
  }
  
  const intData = INT_TABLE[int];
  const bonusProfs = INT_BONUS_PROFS[int];
  
  // Check if wizard class
  const isWizard = ["mage", "wizard", "illusionist", "specialist", "abjurer", "conjurer", 
                     "diviner", "enchanter", "invoker", "necromancer", "transmuter"].some(c => clazz.includes(c));
  
  if (intData) {
    // [# languages, learn spell %, max spells/level, spell immunity]
    const [languages, learnSpell, maxSpells, immunity] = intData;
    
    languagesEl.value = languages;
    bonusProfsEl.value = bonusProfs || 0;
    immunityEl.value = immunity || "—";
    
    // Wizard-specific fields
    if (isWizard && int >= 9) {
      learnSpellEl.value = learnSpell + "%";
      maxSpellsEl.value = maxSpells;
    } else if (isWizard && int < 9) {
      learnSpellEl.value = "Too low";
      maxSpellsEl.value = "—";
      learnSpellEl.title = "INT 9+ required for wizards";
    } else {
      learnSpellEl.value = "—";
      maxSpellsEl.value = "—";
    }
  }
}

function renderXPProgression(root) {
  const clazz = (val(root, "clazz") || "").trim();
  const level = parseInt(val(root, "level") || 1, 10);
  const currentXP = parseInt(val(root, "xp") || 0, 10);
  const charType = (val(root, "char_type") || "single").toLowerCase();
  
  const xpNextEl = root.querySelector('[data-field="xp_next"]');
  if (!xpNextEl) return;
  
  // Handle multi-class characters
  if (charType === 'multi') {
    xpNextEl.value = "See class XP fields";
    xpNextEl.title = "Multi-class characters split XP evenly between classes. Check individual class XP fields for progression.";
    return;
  }
  
  // Handle dual-class characters
  if (charType === 'dual') {
    const newClass = (val(root, 'dc_new_class') || '').trim();
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
    
    if (!newClass) {
      xpNextEl.value = "—";
      xpNextEl.removeAttribute("title");
      return;
    }
    
    // Get XP table for new class
    const xpTable = getXPTable(newClass);
    
    if (!xpTable) {
      xpNextEl.value = "Unknown class";
      xpNextEl.title = "XP table not found for new class";
      return;
    }
    
    // Check if at max level
    if (newLevel >= 20) {
      xpNextEl.value = "Max level";
      xpNextEl.title = "New class has reached level 20";
      return;
    }
    
    // Calculate XP needed for next level in NEW class
    const xpForNextLevel = xpTable[newLevel];
    const xpNeeded = xpForNextLevel - currentXP;
    
    if (xpNeeded <= 0) {
      xpNextEl.value = "Ready to level!";
      xpNextEl.title = `${newClass} has enough XP to advance to level ${newLevel + 1}`;
    } else {
      xpNextEl.value = xpNeeded.toLocaleString();
      xpNextEl.title = `${newClass} needs ${xpNeeded.toLocaleString()} more XP to reach level ${newLevel + 1} (total: ${xpForNextLevel.toLocaleString()})`;
    }
    
    return;
  }
  
  // Handle empty or invalid class
  if (!clazz) {
    xpNextEl.value = "—";
    xpNextEl.removeAttribute("title");
    return;
  }
  
  // Check if old-style multi-class (for backward compatibility)
  if (isMultiClass(clazz)) {
    xpNextEl.value = "Multi-class (see notes)";
    xpNextEl.title = "Multi-class characters divide XP between classes. Track each class level separately.";
    return;
  }
  
  // Get XP table for this class
  const xpTable = getXPTable(clazz);
  
  if (!xpTable) {
    xpNextEl.value = "Unknown class";
    xpNextEl.title = "XP table not found for this class";
    return;
  }
  
  // Check if at max level
  if (level >= 20) {
    xpNextEl.value = "Max level";
    xpNextEl.title = "Character has reached level 20";
    return;
  }
  
  // Calculate XP needed for next level
  const xpForNextLevel = xpTable[level]; // level 5 char needs xpTable[5] to reach level 6
  const xpNeeded = xpForNextLevel - currentXP;
  
  if (xpNeeded <= 0) {
    xpNextEl.value = "Ready to level!";
    xpNextEl.title = `You have enough XP to advance to level ${level + 1}`;
  } else {
    xpNextEl.value = xpNeeded.toLocaleString();
    xpNextEl.title = `Need ${xpNeeded.toLocaleString()} more XP to reach level ${level + 1} (total: ${xpForNextLevel.toLocaleString()})`;
  }
  
  // Calculate Prime Requisite XP Bonus
  renderPrimeRequisiteBonus(root);
}

function renderPrimeRequisiteBonus(root) {
  let clazz = (val(root, "clazz") || "").trim().toLowerCase();
  const xpBonusEl = root.querySelector('[data-field="xp_bonus"]');
  
  if (!xpBonusEl) return;
  
  // For dual-class, use NEW class for prime requisite bonus
  const charType = (val(root, "char_type") || "single").toLowerCase();
  if (charType === 'dual') {
    const newClass = (val(root, 'dc_new_class') || '').trim().toLowerCase();
    if (newClass) {
      clazz = newClass;
    }
  }
  
  if (!clazz) {
    xpBonusEl.value = "—";
    xpBonusEl.removeAttribute("title");
    return;
  }
  
  // Get ability scores
  const str = parseInt(val(root, "str") || 0, 10);
  const dex = parseInt(val(root, "dex") || 0, 10);
  const con = parseInt(val(root, "con") || 0, 10);
  const int = parseInt(val(root, "int") || 0, 10);
  const wis = parseInt(val(root, "wis") || 0, 10);
  const cha = parseInt(val(root, "cha") || 0, 10);
  
  // Determine prime requisites based on class
  let primeReqs = [];
  let primeReqNames = [];
  
  if (clazz.includes("fighter") || clazz.includes("warrior")) {
    primeReqs = [str];
    primeReqNames = ["Strength"];
  } else if (clazz.includes("ranger")) {
    primeReqs = [str, dex, wis];
    primeReqNames = ["Strength", "Dexterity", "Wisdom"];
  } else if (clazz.includes("paladin")) {
    primeReqs = [str, cha];
    primeReqNames = ["Strength", "Charisma"];
  } else if (clazz.includes("mage") || clazz.includes("wizard") || clazz.includes("illusionist") || 
             clazz.includes("abjurer") || clazz.includes("conjurer") || clazz.includes("diviner") ||
             clazz.includes("enchanter") || clazz.includes("invoker") || clazz.includes("necromancer") ||
             clazz.includes("transmuter") || clazz.includes("evoker") || clazz.includes("specialist")) {
    primeReqs = [int];
    primeReqNames = ["Intelligence"];
  } else if (clazz.includes("cleric") || clazz.includes("priest") || clazz.includes("druid")) {
    primeReqs = [wis];
    primeReqNames = ["Wisdom"];
  } else if (clazz.includes("thief") || clazz.includes("rogue")) {
    primeReqs = [dex];
    primeReqNames = ["Dexterity"];
  } else if (clazz.includes("bard")) {
    primeReqs = [dex, cha];
    primeReqNames = ["Dexterity", "Charisma"];
  } else {
    // Unknown class
    xpBonusEl.value = "—";
    xpBonusEl.removeAttribute("title");
    return;
  }
  
  // Check if all prime requisites are 16+
  const allMeet16 = primeReqs.every(score => score >= 16);
  
  if (allMeet16) {
    xpBonusEl.value = "+10%";
    xpBonusEl.title = `All prime requisites (${primeReqNames.join(", ")}) are 16+`;
  } else {
    xpBonusEl.value = "0%";
    xpBonusEl.title = `Prime requisites: ${primeReqNames.join(", ")} (need all 16+ for +10% bonus)`;
  }
}

function renderThiefSkills(root) {
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  const level = parseInt(val(root, "level") || 1, 10);
  const race = (val(root, "race") || "").trim().toLowerCase();
  const dex = parseInt(val(root, "dex") || 9, 10);
  
  // Only calculate for thieves and bards
  const isThief = clazz.includes("thief") || clazz.includes("rogue");
  const isBard = clazz.includes("bard");
  
  if (!isThief && !isBard) {
    // Not a thief or bard, clear all fields
    val(root, 'thief_pickpockets', '');
    val(root, 'thief_openlocks', '');
    val(root, 'thief_traps', '');
    val(root, 'thief_movesilently', '');
    val(root, 'thief_hide', '');
    val(root, 'thief_detectnoise', '');
    val(root, 'thief_climb', '');
    val(root, 'thief_readlang', '');
    return;
  }
  
  // Get base skills for the class and level
  const baseTable = isBard ? BARD_SKILLS_BASE : THIEF_SKILLS_BASE;
  // Cap at level 20 for levels beyond the table
  const effectiveLevel = Math.min(level, 20);
  const baseSkills = baseTable[effectiveLevel] || baseTable[1];
  
  if (!baseSkills) return;
  
  // Get racial adjustments
  let racialAdj = [0, 0, 0, 0, 0, 0, 0, 0];
  if (typeof THIEF_RACIAL_ADJUSTMENTS !== 'undefined') {
    for (let raceKey in THIEF_RACIAL_ADJUSTMENTS) {
      if (race.includes(raceKey)) {
        racialAdj = THIEF_RACIAL_ADJUSTMENTS[raceKey];
        break;
      }
    }
  }
  
  // Get DEX adjustments (only applies to first 5 skills)
  let dexAdj = [0, 0, 0, 0, 0];
  if (typeof THIEF_DEX_ADJUSTMENTS !== 'undefined') {
    dexAdj = THIEF_DEX_ADJUSTMENTS[dex] || [0, 0, 0, 0, 0];
  }
  
  // Get discretionary points allocated to each skill
  const pointsPP = parseInt(val(root, 'thief_points_pickpockets')) || 0;
  const pointsOL = parseInt(val(root, 'thief_points_openlocks')) || 0;
  const pointsTR = parseInt(val(root, 'thief_points_traps')) || 0;
  const pointsMS = parseInt(val(root, 'thief_points_movesilently')) || 0;
  const pointsHI = parseInt(val(root, 'thief_points_hide')) || 0;
  const pointsDN = parseInt(val(root, 'thief_points_detectnoise')) || 0;
  const pointsCW = parseInt(val(root, 'thief_points_climb')) || 0;
  const pointsRL = parseInt(val(root, 'thief_points_readlang')) || 0;
  
  // For bards, clear any points allocated to inaccessible skills
  if (isBard) {
    val(root, 'thief_points_openlocks', 0);
    val(root, 'thief_points_traps', 0);
    val(root, 'thief_points_movesilently', 0);
    val(root, 'thief_points_hide', 0);
  }
  
  // Calculate final percentages: Base + Race + DEX + Discretionary Points
  // [Pick Pockets, Open Locks, Find/Remove Traps, Move Silently, Hide in Shadows, Detect Noise, Climb Walls, Read Languages]
  
  // For bards, only calculate PP, DN, CW, RL (indices 0, 5, 6, 7)
  // Other skills (OL, TR, MS, HI - indices 1, 2, 3, 4) are not accessible
  const pickpockets = Math.max(0, Math.min(99, baseSkills[0] + racialAdj[0] + dexAdj[0] + pointsPP));
  const openlocks = isBard ? '' : Math.max(0, Math.min(99, baseSkills[1] + racialAdj[1] + dexAdj[1] + pointsOL));
  const traps = isBard ? '' : Math.max(0, Math.min(99, baseSkills[2] + racialAdj[2] + dexAdj[2] + pointsTR));
  const movesilently = isBard ? '' : Math.max(0, Math.min(99, baseSkills[3] + racialAdj[3] + dexAdj[3] + pointsMS));
  const hide = isBard ? '' : Math.max(0, Math.min(99, baseSkills[4] + racialAdj[4] + dexAdj[4] + pointsHI));
  const detectnoise = Math.max(0, Math.min(99, baseSkills[5] + racialAdj[5] + pointsDN));
  const climb = Math.max(0, Math.min(99, baseSkills[6] + racialAdj[6] + pointsCW));
  const readlang = Math.max(0, Math.min(99, baseSkills[7] + racialAdj[7] + pointsRL));
  
  // Set values
  val(root, 'thief_pickpockets', pickpockets);
  val(root, 'thief_openlocks', openlocks);
  val(root, 'thief_traps', traps);
  val(root, 'thief_movesilently', movesilently);
  val(root, 'thief_hide', hide);
  val(root, 'thief_detectnoise', detectnoise);
  val(root, 'thief_climb', climb);
  val(root, 'thief_readlang', readlang);
  
  // Add tooltips showing breakdown (including discretionary points)
  const ppEl = root.querySelector('[data-field="thief_pickpockets"]');
  if (ppEl) {
    ppEl.title = `Base: ${baseSkills[0]}, Race: ${racialAdj[0] >= 0 ? '+' : ''}${racialAdj[0]}, DEX: ${dexAdj[0] >= 0 ? '+' : ''}${dexAdj[0]}, Points: +${pointsPP}`;
  }
  
  const olEl = root.querySelector('[data-field="thief_openlocks"]');
  if (olEl) {
    olEl.title = isBard ? 'Not available to bards' : `Base: ${baseSkills[1]}, Race: ${racialAdj[1] >= 0 ? '+' : ''}${racialAdj[1]}, DEX: ${dexAdj[1] >= 0 ? '+' : ''}${dexAdj[1]}, Points: +${pointsOL}`;
  }
  
  const trEl = root.querySelector('[data-field="thief_traps"]');
  if (trEl) {
    trEl.title = isBard ? 'Not available to bards' : `Base: ${baseSkills[2]}, Race: ${racialAdj[2] >= 0 ? '+' : ''}${racialAdj[2]}, DEX: ${dexAdj[2] >= 0 ? '+' : ''}${dexAdj[2]}, Points: +${pointsTR}`;
  }
  
  const msEl = root.querySelector('[data-field="thief_movesilently"]');
  if (msEl) {
    msEl.title = isBard ? 'Not available to bards' : `Base: ${baseSkills[3]}, Race: ${racialAdj[3] >= 0 ? '+' : ''}${racialAdj[3]}, DEX: ${dexAdj[3] >= 0 ? '+' : ''}${dexAdj[3]}, Points: +${pointsMS}`;
  }
  
  const hiEl = root.querySelector('[data-field="thief_hide"]');
  if (hiEl) {
    hiEl.title = isBard ? 'Not available to bards' : `Base: ${baseSkills[4]}, Race: ${racialAdj[4] >= 0 ? '+' : ''}${racialAdj[4]}, DEX: ${dexAdj[4] >= 0 ? '+' : ''}${dexAdj[4]}, Points: +${pointsHI}`;
  }
  
  const dnEl = root.querySelector('[data-field="thief_detectnoise"]');
  if (dnEl) {
    dnEl.title = `Base: ${baseSkills[5]}, Race: ${racialAdj[5] >= 0 ? '+' : ''}${racialAdj[5]}, Points: +${pointsDN}`;
  }
  
  const clEl = root.querySelector('[data-field="thief_climb"]');
  if (clEl) {
    clEl.title = `Base: ${baseSkills[6]}, Race: ${racialAdj[6] >= 0 ? '+' : ''}${racialAdj[6]}, Points: +${pointsCW}`;
  }
  
  const rlEl = root.querySelector('[data-field="thief_readlang"]');
  if (rlEl) {
    rlEl.title = `Base: ${baseSkills[7]}, Race: ${racialAdj[7] >= 0 ? '+' : ''}${racialAdj[7]}, Points: +${pointsRL}`;
  }
}

function renderCoinWeight(root) {
  const cp = parseInt(val(root, "cp") || 0, 10);
  const sp = parseInt(val(root, "sp") || 0, 10);
  const ep = parseInt(val(root, "ep") || 0, 10);
  const gp = parseInt(val(root, "gp") || 0, 10);
  const pp = parseInt(val(root, "pp") || 0, 10);
  
  const coinTotalEl = root.querySelector('[data-field="coin_total"]');
  const coinWeightEl = root.querySelector('[data-field="coin_weight"]');
  
  if (!coinTotalEl || !coinWeightEl) return;
  
  // Calculate totals
  const totalCoins = cp + sp + ep + gp + pp;
  const weightLbs = totalCoins / 10; // 10 coins = 1 lb in AD&D 2E
  
  // Display
  coinTotalEl.value = totalCoins.toLocaleString();
  coinWeightEl.value = weightLbs.toFixed(1);
  
  // Tooltip with breakdown
  if (totalCoins > 0) {
    coinWeightEl.title = `${totalCoins.toLocaleString()} coins total (10 coins = 1 lb)`;
  } else {
    coinWeightEl.removeAttribute("title");
  }
}

function renderRacialAbilities(root) {
  const race = (val(root, "race") || "").trim().toLowerCase();
  
  const racialAbilitiesList = root.querySelector('.racial-abilities-list');
  if (!racialAbilitiesList) return;
  
  // Don't auto-populate if user has manually added abilities
  // (check if list already has items)
  const existingItems = racialAbilitiesList.querySelectorAll('.item');
  if (existingItems.length > 0) {
    // User has custom abilities, don't overwrite
    return;
  }
  
  if (!race) {
    // No race specified, leave empty
    return;
  }
  
  // Find matching race in RACIAL_ABILITIES
  let abilities = null;
  for (let raceKey in RACIAL_ABILITIES) {
    if (race.includes(raceKey)) {
      abilities = RACIAL_ABILITIES[raceKey];
      break;
    }
  }
  
  if (!abilities) {
    // Race not found in database, leave empty for manual entry
    return;
  }
  
  // Populate the list with racial abilities
  racialAbilitiesList.innerHTML = '';
  abilities.forEach(ability => {
    const node = makeAbilityNode(ability, () => markUnsaved(
      document.querySelector('.tab.active'),
      true,
      root
    ));
    racialAbilitiesList.appendChild(node);
  });
}

function populateKitDropdown(root) {
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  const kitSelect = root.querySelector('[data-field="kit"]');
  
  if (!kitSelect) return;
  
  // Save current selection
  const currentKit = kitSelect.value;
  
  // Clear existing options except first
  kitSelect.innerHTML = '<option value="">Standard Class</option>';
  
  if (!clazz) {
    kitSelect.disabled = true;
    return;
  }
  
  // Check if multi-class (kits not allowed for multi-class in AD&D 2E)
  if (isMultiClass(clazz)) {
    kitSelect.innerHTML = '<option value="">No kits available (multi-class)</option>';
    kitSelect.disabled = true;
    return;
  }
  
  // Enable dropdown
  kitSelect.disabled = false;
  
  // Get available kits for this class
  const availableKits = getKitsForClass(clazz);
  
  if (availableKits.length === 0) {
    kitSelect.innerHTML = '<option value="">No kits available</option>';
    kitSelect.disabled = true;
    return;
  }
  
  // Populate dropdown with kits
  availableKits.forEach(kit => {
    const option = document.createElement('option');
    option.value = kit.name.toLowerCase().replace(/\s+/g, '');
    option.textContent = kit.name;
    kitSelect.appendChild(option);
  });
  
  // Restore previous selection if it's still valid
  if (currentKit && Array.from(kitSelect.options).some(opt => opt.value === currentKit)) {
    kitSelect.value = currentKit;
  }
}

function renderKitAbilities(root) {
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  const kitValue = (val(root, "kit") || "").trim();
  
  const kitAbilitiesList = root.querySelector('.kit-abilities-list');
  if (!kitAbilitiesList) return;
  
  // If no kit selected, clear the list
  if (!kitValue || kitValue === "") {
    // Only clear auto-generated items
    const existingItems = Array.from(kitAbilitiesList.querySelectorAll('.item'));
    const autoItems = existingItems.filter(item => item.dataset.autoGenerated);
    autoItems.forEach(item => item.remove());
    return;
  }
  
  if (!clazz) return;
  
  // Get the kit data
  const availableKits = getKitsForClass(clazz);
  const selectedKit = availableKits.find(k => k.name.toLowerCase().replace(/\s+/g, '') === kitValue);
  
  if (!selectedKit || !selectedKit.abilities) return;
  
  // Get existing items
  const existingItems = Array.from(kitAbilitiesList.querySelectorAll('.item'));
  
  // Separate auto-generated from manual
  const manualItems = existingItems.filter(item => !item.dataset.autoGenerated);
  const autoItems = existingItems.filter(item => item.dataset.autoGenerated);
  
  // Remove all auto-generated items
  autoItems.forEach(item => item.remove());
  
  // Add new kit abilities
  selectedKit.abilities.forEach(ability => {
    const node = makeAbilityNode({
      name: ability.name,
      notes: ability.notes,
      isAuto: true
    }, () => markUnsaved(
      document.querySelector('.tab.active'),
      true,
      root
    ));
    kitAbilitiesList.appendChild(node);
  });
}

function renderArmorClass(root) {
  const acField = root.querySelector('[data-field="ac"]');
  if (!acField) return;
  
  // Start with base AC 10 (unarmored)
  let baseAC = 10;
  let baseACSource = "None";
  let shieldBonus = 0;
  let shieldNames = [];
  let ringBonus = 0;
  let ringNames = [];
  let cloakBonus = 0;
  let cloakNames = [];
  
  // Get all equipped armor/shields/accessories
  const armorItems = Array.from(root.querySelectorAll('.armor-list .item'));
  const equippedItems = armorItems.filter(item => {
    const checkbox = item.querySelector('.equipped');
    return checkbox && checkbox.checked;
  });
  
  // Process each equipped item
  equippedItems.forEach(item => {
    const name = item.querySelector('.title').value.trim();
    const type = item.querySelector('.armor-type')?.value || "Armor";
    const baseACValue = parseInt(item.querySelector('.base-ac').value, 10);
    const magicBonus = parseInt(item.querySelector('.ac-bonus').value, 10) || 0;
    
    if (!name) return;
    
    // Base AC providers (only best one counts)
    if (type === "Armor" || type === "Bracers") {
      if (baseACValue && baseACValue < baseAC) {
        baseAC = baseACValue + magicBonus; // Magical armor adds to base
        baseACSource = name;
      }
    }
    // AC Bonus providers (all stack)
    else if (type === "Shield") {
      // Shield uses Base AC field as bonus value (e.g., -1 for small shield)
      if (baseACValue) {
        shieldBonus += baseACValue;
      }
      shieldBonus += magicBonus; // Magical shield bonus
      shieldNames.push(name);
    }
    else if (type === "Ring") {
      // Rings provide bonus from both fields
      if (baseACValue) {
        ringBonus += baseACValue;
      }
      ringBonus += magicBonus;
      ringNames.push(name);
    }
    else if (type === "Cloak") {
      // Cloaks provide bonus from both fields
      if (baseACValue) {
        cloakBonus += baseACValue;
      }
      cloakBonus += magicBonus;
      cloakNames.push(name);
    }
    // Helmet, Gauntlets, Boots, Belt, Other = no AC effect
  });
  
  // Get DEX adjustment (already calculated)
  const dexAdj = parseInt(val(root, "dex_ac") || 0, 10);
  
  // Get manual adjustment
  const manualAdj = parseInt(val(root, "ac_manual") || 0, 10);
  
  // Calculate final AC (remember: lower is better in AD&D)
  let finalAC = baseAC + shieldBonus + ringBonus + cloakBonus + dexAdj + manualAdj;
  
  // Set the normal AC field
  acField.value = finalAC;
  
  // Build detailed tooltip for normal AC
  let tooltip = `Armor Class Breakdown:\n`;
  tooltip += `Base AC: ${baseAC} (${baseACSource})\n`;
  
  if (shieldBonus !== 0) {
    tooltip += `Shield: ${shieldBonus >= 0 ? "+" : ""}${shieldBonus} (${shieldNames.join(", ")})\n`;
  }
  
  if (ringBonus !== 0) {
    tooltip += `Ring: ${ringBonus >= 0 ? "+" : ""}${ringBonus} (${ringNames.join(", ")})\n`;
  }
  
  if (cloakBonus !== 0) {
    tooltip += `Cloak: ${cloakBonus >= 0 ? "+" : ""}${cloakBonus} (${cloakNames.join(", ")})\n`;
  }
  
  if (dexAdj !== 0) {
    tooltip += `DEX: ${dexAdj >= 0 ? "+" : ""}${dexAdj}\n`;
  }
  
  if (manualAdj !== 0) {
    tooltip += `Manual: ${manualAdj >= 0 ? "+" : ""}${manualAdj}\n`;
  }
  
  tooltip += `\nFinal AC: ${finalAC}`;
  tooltip += `\n(Lower is better)`;
  
  acField.title = tooltip;
  
  // Calculate AC variants
  const acRearEl = root.querySelector('[data-field="ac_rear"]');
  const acSurprisedEl = root.querySelector('[data-field="ac_surprised"]');
  const acNoShieldEl = root.querySelector('[data-field="ac_no_shield"]');
  const acUnarmoredEl = root.querySelector('[data-field="ac_unarmored"]');
  const acVsMissilesEl = root.querySelector('[data-field="ac_vs_missiles"]');
  
  if (acRearEl) {
    // Rear AC: loses shield bonus
    const rearAC = baseAC + ringBonus + cloakBonus + dexAdj + manualAdj;
    acRearEl.value = rearAC;
    acRearEl.title = "Attacked from behind\nNo shield bonus";
  }
  
  if (acSurprisedEl) {
    // Surprised AC: loses shield and DEX bonuses
    const surprisedAC = baseAC + ringBonus + cloakBonus + manualAdj;
    acSurprisedEl.value = surprisedAC;
    acSurprisedEl.title = "Caught off-guard\nNo shield or DEX bonus";
  }
  
  if (acNoShieldEl) {
    // No Shield AC: same as rear but clearer label
    const noShieldAC = baseAC + ringBonus + cloakBonus + dexAdj + manualAdj;
    acNoShieldEl.value = noShieldAC;
    acNoShieldEl.title = "Without shield\nAll other bonuses apply";
  }
  
  if (acUnarmoredEl) {
    // Unarmored AC: 10 + DEX + manual only
    const unarmoredAC = 10 + dexAdj + manualAdj;
    acUnarmoredEl.value = unarmoredAC;
    acUnarmoredEl.title = "No armor or accessories\nBase 10 + DEX + manual adj.";
  }
  
  if (acVsMissilesEl) {
    // vs Missiles AC: same as normal for now (could add missile-specific modifiers later)
    const vsMissilesAC = finalAC;
    acVsMissilesEl.value = vsMissilesAC;
    acVsMissilesEl.title = "AC against ranged attacks\nCurrently same as normal AC";
  }
}

function renderEncumbrance(root) {
  const currentLoadEl = root.querySelector('[data-field="encumbrance_current"]');
  const maxCarryEl = root.querySelector('[data-field="encumbrance_max"]');
  const categoryEl = root.querySelector('[data-field="encumbrance_category"]');
  
  if (!currentLoadEl || !maxCarryEl || !categoryEl) return;
  
  // Get max carry from STR weight allowance (already calculated)
  const strWeightAllowance = parseFloat(val(root, "str_weight").replace(/[^\d.]/g, '')) || 0;
  
  // Calculate total weight carried
  let totalWeight = 0;
  
  // Coin weight (already calculated)
  const coinWeight = parseFloat(val(root, "coin_weight")) || 0;
  totalWeight += coinWeight;
  
  // Valuables weight (quantity * weight per item) - NEW
  const valuables = Array.from(root.querySelectorAll('.valuables-list .item'));
  valuables.forEach(item => {
    const qty = parseFloat(item.querySelector('.qty')?.value) || 1;
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    totalWeight += qty * weight;
  });
  
  // Items weight (quantity * weight per item)
  const items = Array.from(root.querySelectorAll('.items-list .item'));
  items.forEach(item => {
    const qty = parseFloat(item.querySelector('.qty')?.value) || 1;
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    totalWeight += qty * weight;
  });
  
  // Armor weight (all armor counts, equipped or not)
  const armor = Array.from(root.querySelectorAll('.armor-list .item'));
  armor.forEach(item => {
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    totalWeight += weight;
  });
  
  // Weapon weight
  const weapons = Array.from(root.querySelectorAll('.weapons-list .item'));
  weapons.forEach(item => {
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    totalWeight += weight;
  });
  
  // Ammunition weight
  const ammunition = Array.from(root.querySelectorAll('.ammunition-list .item'));
  ammunition.forEach(item => {
    const qty = parseFloat(item.querySelector('.quantity')?.value) || 0;
    const wtPerUnit = parseFloat(item.querySelector('.weight-per-unit')?.value) || 0;
    totalWeight += qty * wtPerUnit;
  });
  
  // Set current load
  currentLoadEl.value = totalWeight.toFixed(1);
  
  // Set max carry
  maxCarryEl.value = strWeightAllowance.toFixed(0);
  
  // Calculate encumbrance category
  let category = "";
  let tooltip = "";
  
  if (strWeightAllowance === 0) {
    category = "—";
    tooltip = "Enter STR to calculate";
  } else {
    const ratio = totalWeight / strWeightAllowance;
    
    if (ratio <= 0.33) {
      category = "Unencumbered";
      tooltip = "0-33% of max load\nNo penalties";
    } else if (ratio <= 0.67) {
      category = "Light";
      tooltip = "34-67% of max load\nMovement slightly reduced";
    } else if (ratio <= 1.0) {
      category = "Moderate";
      tooltip = "68-100% of max load\nMovement reduced, combat penalties";
    } else if (ratio <= 1.5) {
      category = "Heavy";
      tooltip = "101-150% of max load\nSevere movement penalty\n-4 AC, -2 attack";
    } else if (ratio <= 2.0) {
      category = "Severe";
      tooltip = "151-200% of max load\nCan barely move\n-6 AC, -4 attack";
    } else {
      category = "Overloaded!";
      tooltip = "Over 200% of max load\nCannot move!";
    }
  }
  
  categoryEl.value = category;
  categoryEl.title = tooltip;
  
  // Add color coding
  if (category === "Unencumbered" || category === "Light") {
    categoryEl.style.color = "var(--accent-light)";
  } else if (category === "Moderate") {
    categoryEl.style.color = "var(--text)";
  } else if (category === "Heavy" || category === "Severe") {
    categoryEl.style.color = "#ff9800";
  } else if (category === "Overloaded!") {
    categoryEl.style.color = "#f44336";
  }
}

async function renderSpellAccess(root) {
  console.log('[Spell Access] Starting...');
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  
  const accessContainer = root.querySelector('.spell-access-container');
  const priestSpheresDiv = root.querySelector('.priest-spheres');
  const wizardSchoolsDiv = root.querySelector('.wizard-schools');
  
  if (!accessContainer || !priestSpheresDiv || !wizardSchoolsDiv) return;
  
  console.log('[Spell Access] Loading spells...');
  // Load spells if not already loaded
  await loadSpells();
  console.log('[Spell Access] Spells loaded, count:', SPELLS_DB.length);
  
  // Determine if character is a spellcaster
  const isPriest = clazz.includes('cleric') || clazz.includes('druid') || 
                   clazz.includes('priest') || clazz.includes('shaman') ||
                   clazz.includes('paladin') || clazz.includes('dpaladin') ||
                   clazz.includes('ranger');
  const isWizard = clazz.includes('mage') || clazz.includes('wizard') || 
                   clazz.includes('illusionist') || clazz.includes('specialist') ||
                   clazz.includes('bard');
  
  // Hide everything if not a spellcaster
  if (!isPriest && !isWizard) {
    accessContainer.style.display = 'none';
    return;
  }
  
  // Keep container collapsed by default (user can expand with button)
  // Don't change display if it's already set
  if (!accessContainer.style.display) {
    accessContainer.style.display = 'none';
  }
  
  // Show/populate priest spheres
  if (isPriest) {
    priestSpheresDiv.style.display = 'block';
    const sphereCheckboxes = priestSpheresDiv.querySelector('.sphere-checkboxes');
    
    // Only populate if empty
    if (sphereCheckboxes.children.length === 0) {
      const allSpheres = getAllSpheres();
      allSpheres.forEach(sphere => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;font-size:12px;cursor:pointer;';
        label.innerHTML = 
          `<input type="checkbox" data-sphere="${sphere}" style="margin-right:6px;width:auto;">` +
          `<span>${sphere}</span>`;
        
        // Wire up change event
        const checkbox = label.querySelector('input');
        checkbox.addEventListener('change', () => {
          renderSpellBrowser(root);
          markUnsaved(document.querySelector('.tab.active'), true, root);
        });
        
        sphereCheckboxes.appendChild(label);
      });
    }
  } else {
    priestSpheresDiv.style.display = 'none';
  }
  
  // Show/populate wizard schools
  if (isWizard) {
    wizardSchoolsDiv.style.display = 'block';
    const schoolCheckboxes = wizardSchoolsDiv.querySelector('.school-checkboxes');
    
    // Only populate if empty
    if (schoolCheckboxes.children.length === 0) {
      const allSchools = getAllSchools();
      allSchools.forEach(school => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;font-size:12px;cursor:pointer;';
        label.innerHTML = 
          `<input type="checkbox" data-school="${school}" style="margin-right:6px;width:auto;">` +
          `<span>${school}</span>`;
        
        // Wire up change event
        const checkbox = label.querySelector('input');
        checkbox.addEventListener('change', () => {
          renderSpellBrowser(root);
          markUnsaved(document.querySelector('.tab.active'), true, root);
        });
        
        schoolCheckboxes.appendChild(label);
      });
    }
  } else {
    wizardSchoolsDiv.style.display = 'none';
  }
  // Restore previously selected spheres/schools from root element data
  // (stored temporarily during load)
  if (root._pendingSpheres) {
    root._pendingSpheres.forEach(sphere => {
      const allCheckboxes = Array.from(root.querySelectorAll('.sphere-checkboxes input[type="checkbox"]'));
      const checkbox = allCheckboxes.find(cb => cb.getAttribute('data-sphere') === sphere);
      if (checkbox) checkbox.checked = true;
    });
    delete root._pendingSpheres;
  }
  
  if (root._pendingSchools) {
    root._pendingSchools.forEach(school => {
      const allCheckboxes = Array.from(root.querySelectorAll('.school-checkboxes input[type="checkbox"]'));
      const checkbox = allCheckboxes.find(cb => cb.getAttribute('data-school') === school);
      if (checkbox) checkbox.checked = true;
    });
    delete root._pendingSchools;
  }
}

// Show/hide spell browser based on class
function toggleSpellBrowser(root) {
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  const browserSection = root.querySelector('.spell-browser-section');
  
  if (!browserSection) return;
  
  const isSpellcaster = clazz.includes('cleric') || clazz.includes('druid') || 
                        clazz.includes('priest') || clazz.includes('shaman') ||
                        clazz.includes('paladin') || clazz.includes('dpaladin') ||
                        clazz.includes('ranger') ||
                        clazz.includes('mage') || clazz.includes('wizard') || 
                        clazz.includes('illusionist') || clazz.includes('specialist') ||
                        clazz.includes('bard');
  
  browserSection.style.display = isSpellcaster ? 'block' : 'none';
}

// ===== WEAPON BROWSER =====
function toggleWeaponBrowserNew(root) {
  const content = root.querySelector('.weapon-browser-content');
  if (content) {
    content.style.display = (content.style.display === 'none') ? 'block' : 'none';
  }
}

async function renderWeaponInventoryBrowser(root) {
  const resultsDiv = root.querySelector('.weapon-inventory-browser-results');
  
  if (!resultsDiv) return;
  
  // Ensure weapons data is loaded
  if (!WEAPONS_DATA || WEAPONS_DATA.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!WEAPONS_DATA || WEAPONS_DATA.length === 0) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Weapons not loaded. Please refresh the page.</p>';
      return;
    }
  }
  
  // Get search term and filters
  const searchTerm = (root.querySelector('.weapon-inventory-search')?.value || '').toLowerCase();
  const categoryFilter = root.querySelector('.weapon-inventory-category-filter')?.value;
  const typeFilter = root.querySelector('.weapon-inventory-type-filter')?.value;
  
  // Filter weapons
  let filteredWeapons = [...WEAPONS_DATA];
  
  // Apply search filter
  if (searchTerm) {
    filteredWeapons = filteredWeapons.filter(weapon => 
      weapon['Weapon Name'].toLowerCase().includes(searchTerm) ||
      (weapon.Type && weapon.Type.toLowerCase().includes(searchTerm)) ||
      (weapon.Group && weapon.Group.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply category filter
  if (categoryFilter) {
    if (categoryFilter === 'Melee') {
      // Include weapons with "Melee" in the category
      filteredWeapons = filteredWeapons.filter(weapon => 
        weapon.Category && weapon.Category.includes('Melee')
      );
    } else if (categoryFilter === 'Ranged') {
      // Include Ranged and Thrown weapons
      filteredWeapons = filteredWeapons.filter(weapon => 
        weapon.Category === 'Ranged' || 
        (weapon.Category && weapon.Category.includes('Thrown'))
      );
    }
  }
  
  // Apply type filter
  if (typeFilter) {
    filteredWeapons = filteredWeapons.filter(weapon => 
      weapon.Type === typeFilter
    );
  }
  
  // Sort alphabetically if no filters, otherwise group by category/type
  if (!categoryFilter && !typeFilter) {
    // No filters - sort alphabetically by name only
    filteredWeapons.sort((a, b) => {
      return a['Weapon Name'].localeCompare(b['Weapon Name']);
    });
  } else {
    // Filters selected - sort by category, then type, then name
    filteredWeapons.sort((a, b) => {
      if (a.Category !== b.Category) return a.Category.localeCompare(b.Category);
      if (a.Type !== b.Type) return a.Type.localeCompare(b.Type);
      return a['Weapon Name'].localeCompare(b['Weapon Name']);
    });
  }
  
  // Render results
  if (filteredWeapons.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No weapons found matching criteria.</p>';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  filteredWeapons.forEach(weapon => {
    const weaponDiv = document.createElement('div');
    weaponDiv.className = 'weapon-result-item';
    weaponDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s;';
    
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    
    // Build info display
    let infoHTML = `
      <div>
        <strong>${weapon['Weapon Name']}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${weapon.Category || ''} - ${weapon.Type || ''}</span>
      </div>
    `;
    
    // Add details line
    let details = [];
    if (weapon['Damage (S-M)']) details.push(`Dmg: ${weapon['Damage (S-M)']}/${weapon['Damage (L)'] || weapon['Damage (S-M)']}`);
    if (weapon.Weight) details.push(`Weight: ${weapon.Weight}`);
    if (weapon.Cost) details.push(`Cost: ${weapon.Cost}`);
    if (weapon['Speed Factor']) details.push(`Speed: ${weapon['Speed Factor']}`);
    
    if (details.length > 0) {
      infoHTML += `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${details.join(' | ')}</div>`;
    }
    
    infoDiv.innerHTML = infoHTML;
    
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      addWeaponFromInventoryBrowser(root, weapon);
    };
    
    weaponDiv.appendChild(infoDiv);
    weaponDiv.appendChild(addBtn);
    
    // Hover effect
    weaponDiv.addEventListener('mouseenter', () => {
      weaponDiv.style.background = 'var(--glass)';
    });
    weaponDiv.addEventListener('mouseleave', () => {
      weaponDiv.style.background = '';
    });
    
    resultsDiv.appendChild(weaponDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredWeapons.length} weapon${filteredWeapons.length !== 1 ? 's' : ''}`;
  resultsDiv.appendChild(countDiv);
}

// Add weapon from browser to weapons list
function addWeaponFromInventoryBrowser(root, weapon) {
  // Parse weight - extract just the number
  let weightValue = '';
  if (weapon.Weight) {
    const weightMatch = weapon.Weight.match(/[\d.]+/);
    if (weightMatch) {
      weightValue = weightMatch[0];
    }
  }
  
  // Create the weapon node and add it to the list
  const weaponsList = root.querySelector('.weapons-list');
  if (!weaponsList) return;
  
  const newWeaponNode = makeWeaponNode({
    name: weapon['Weapon Name'],
    damageSM: weapon['Damage (S-M)'] || '',
    damageL: weapon['Damage (L)'] || '',
    magicBonus: '',
    weight: weightValue,
    speed: weapon['Speed Factor'] || '',
    damageType: '',
    equipped: false,
    notes: `${weapon.Type || ''} | ${weapon.Group || ''}`
  }, () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
    renderEncumbrance(root);
    renderMovementRate(root);
  });
  
  weaponsList.appendChild(newWeaponNode);
  
  // Mark as unsaved
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) markUnsaved(activeTab, true, root);
  
  // Trigger encumbrance recalculation
  renderEncumbrance(root);
  renderMovementRate(root);
  
  // Visual feedback
  const addBtn = event?.target;
  if (addBtn) {
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Added!';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.textContent = originalText;
      addBtn.disabled = false;
    }, 1000);
  }
}

// ===== AMMUNITION BROWSER =====
function toggleAmmunitionBrowser(root) {
  const content = root.querySelector('.ammunition-browser-content');
  if (content) {
    content.style.display = (content.style.display === 'none') ? 'block' : 'none';
  }
}

async function renderAmmunitionBrowser(root) {
  const resultsDiv = root.querySelector('.ammunition-browser-results');
  
  if (!resultsDiv) return;
  
  // Ensure ammunition data is loaded
  if (!AMMUNITION_DATA || AMMUNITION_DATA.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!AMMUNITION_DATA || AMMUNITION_DATA.length === 0) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Ammunition not loaded. Please refresh the page.</p>';
      return;
    }
  }
  
  // Get search term and type filter
  const searchTerm = (root.querySelector('.ammunition-search')?.value || '').toLowerCase();
  const typeFilter = root.querySelector('.ammunition-type-filter')?.value;
  
  // Filter ammunition
  let filteredAmmo = [...AMMUNITION_DATA];
  
  // Apply search filter
  if (searchTerm) {
    filteredAmmo = filteredAmmo.filter(ammo => 
      ammo['Ammunition Name'].toLowerCase().includes(searchTerm) ||
      (ammo.Weapon && ammo.Weapon.toLowerCase().includes(searchTerm)) ||
      (ammo.Notes && ammo.Notes.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply type filter
  if (typeFilter) {
    filteredAmmo = filteredAmmo.filter(ammo => 
      ammo['Ammunition Type'] === typeFilter
    );
  }
  
  // Sort alphabetically if no filter, otherwise group by type
  if (!typeFilter) {
    // No filter - sort alphabetically by name only
    filteredAmmo.sort((a, b) => {
      return a['Ammunition Name'].localeCompare(b['Ammunition Name']);
    });
  } else {
    // Filter selected - sort by type, then name
    filteredAmmo.sort((a, b) => {
      if (a['Ammunition Type'] !== b['Ammunition Type']) return a['Ammunition Type'].localeCompare(b['Ammunition Type']);
      return a['Ammunition Name'].localeCompare(b['Ammunition Name']);
    });
  }
  
  // Render results
  if (filteredAmmo.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No ammunition found matching criteria.</p>';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  filteredAmmo.forEach(ammo => {
    const ammoDiv = document.createElement('div');
    ammoDiv.className = 'ammunition-result-item';
    ammoDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s;';
    
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    
    // Build info display
    let infoHTML = `
      <div>
        <strong>${ammo['Ammunition Name']}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${ammo['Ammunition Type'] || ''}</span>
      </div>
    `;
    
    // Add details line
    let details = [];
    if (ammo.Weapon) details.push(`For: ${ammo.Weapon}`);
    if (ammo.Weight) details.push(`Weight: ${ammo.Weight}`);
    if (ammo.Cost) details.push(`Cost: ${ammo.Cost}`);
    
    if (details.length > 0) {
      infoHTML += `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${details.join(' | ')}</div>`;
    }
    
    // Add notes if present
    if (ammo.Notes) {
      infoHTML += `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${ammo.Notes}</div>`;
    }
    
    infoDiv.innerHTML = infoHTML;
    
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      addAmmunitionFromBrowser(root, ammo);
    };
    
    ammoDiv.appendChild(infoDiv);
    ammoDiv.appendChild(addBtn);
    
    // Hover effect
    ammoDiv.addEventListener('mouseenter', () => {
      ammoDiv.style.background = 'var(--glass)';
    });
    ammoDiv.addEventListener('mouseleave', () => {
      ammoDiv.style.background = '';
    });
    
    resultsDiv.appendChild(ammoDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredAmmo.length} ammunition type${filteredAmmo.length !== 1 ? 's' : ''}`;
  resultsDiv.appendChild(countDiv);
}

// Add ammunition from browser to ammunition list
function addAmmunitionFromBrowser(root, ammo) {
  // Parse weight per unit - extract just the number
  let weightValue = '0.1'; // default
  if (ammo.Weight) {
    const weightMatch = ammo.Weight.match(/[\d.]+/);
    if (weightMatch) {
      weightValue = weightMatch[0];
    }
  }
  
  // Create the ammunition node and add it to the list
  const ammoList = root.querySelector('.ammunition-list');
  if (!ammoList) return;
  
  const newAmmoNode = makeAmmunitionNode({
    name: ammo['Ammunition Name'],
    quantity: 20, // Default to 20 arrows/bolts
    weightPerUnit: weightValue
  }, () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
    updateTotalAmmoWeight(root);
    renderEncumbrance(root);
    renderMovementRate(root);
  });
  
  ammoList.appendChild(newAmmoNode);
  
  // Mark as unsaved
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) markUnsaved(activeTab, true, root);
  
  // Trigger weight recalculations
  updateTotalAmmoWeight(root);
  renderEncumbrance(root);
  renderMovementRate(root);
  
  // Visual feedback
  const addBtn = event?.target;
  if (addBtn) {
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Added!';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.textContent = originalText;
      addBtn.disabled = false;
    }, 1000);
  }
}

// ===== ARMOR BROWSER =====
function toggleArmorBrowser(root) {
  const content = root.querySelector('.armor-browser-content');
  if (content) {
    content.style.display = (content.style.display === 'none') ? 'block' : 'none';
  }
}

async function renderArmorBrowser(root) {
  const resultsDiv = root.querySelector('.armor-browser-results');
  
  if (!resultsDiv) return;
  
  // Ensure armor data is loaded
  if (!ARMOR_DATA || ARMOR_DATA.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!ARMOR_DATA || ARMOR_DATA.length === 0) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Armor not loaded. Please refresh the page.</p>';
      return;
    }
  }
  
  // Get search term and type filter
  const searchTerm = (root.querySelector('.armor-search')?.value || '').toLowerCase();
  const typeFilter = root.querySelector('.armor-type-filter')?.value;
  
  // Filter armor
  let filteredArmor = [...ARMOR_DATA];
  
  // Apply search filter
  if (searchTerm) {
    filteredArmor = filteredArmor.filter(armor => 
      armor['Armor Name'].toLowerCase().includes(searchTerm) ||
      (armor.Notes && armor.Notes.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply type filter
  if (typeFilter) {
    filteredArmor = filteredArmor.filter(armor => 
      armor['Armor Type'] === typeFilter
    );
  }
  
  // Sort alphabetically if no filter, otherwise group by type
  if (!typeFilter) {
    // No filter - sort alphabetically by name only
    filteredArmor.sort((a, b) => {
      return a['Armor Name'].localeCompare(b['Armor Name']);
    });
  } else {
    // Filter selected - sort by type, then AC, then name
    filteredArmor.sort((a, b) => {
      if (a['Armor Type'] !== b['Armor Type']) return a['Armor Type'].localeCompare(b['Armor Type']);
      const acA = parseInt(a.AC) || 10;
      const acB = parseInt(b.AC) || 10;
      if (acA !== acB) return acA - acB; // Lower AC is better
      return a['Armor Name'].localeCompare(b['Armor Name']);
    });
  }
  
  // Render results
  if (filteredArmor.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No armor found matching criteria.</p>';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  filteredArmor.forEach(armor => {
    const armorDiv = document.createElement('div');
    armorDiv.className = 'armor-result-item';
    armorDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s;';
    
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    
    // Build info display
    let infoHTML = `
      <div>
        <strong>${armor['Armor Name']}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${armor['Armor Type'] || ''}</span>
      </div>
    `;
    
    // Add details line
    let details = [];
    if (armor.AC) details.push(`AC: ${armor.AC}`);
    if (armor.Weight) details.push(`Weight: ${armor.Weight}`);
    if (armor.Cost) details.push(`Cost: ${armor.Cost}`);
    if (armor.Movement) details.push(`Movement: ${armor.Movement}`);
    
    if (details.length > 0) {
      infoHTML += `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${details.join(' | ')}</div>`;
    }
    
    // Add notes if present
    if (armor.Notes) {
      infoHTML += `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${armor.Notes}</div>`;
    }
    
    infoDiv.innerHTML = infoHTML;
    
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      addArmorFromBrowser(root, armor);
    };
    
    armorDiv.appendChild(infoDiv);
    armorDiv.appendChild(addBtn);
    
    // Hover effect
    armorDiv.addEventListener('mouseenter', () => {
      armorDiv.style.background = 'var(--glass)';
    });
    armorDiv.addEventListener('mouseleave', () => {
      armorDiv.style.background = '';
    });
    
    resultsDiv.appendChild(armorDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredArmor.length} armor piece${filteredArmor.length !== 1 ? 's' : ''}`;
  resultsDiv.appendChild(countDiv);
}

// Add armor from browser to armor list
function addArmorFromBrowser(root, armor) {
  // Parse weight - extract just the number
  let weightValue = '';
  if (armor.Weight) {
    const weightMatch = armor.Weight.match(/[\d.]+/);
    if (weightMatch) {
      weightValue = weightMatch[0];
    }
  }
  
  // Determine armor type for the dropdown
  let armorType = 'body';
  if (armor['Armor Name'].toLowerCase().includes('shield')) {
    armorType = 'shield';
  } else if (armor['Armor Name'].toLowerCase().includes('helmet')) {
    armorType = 'helmet';
  }
  
  // Create the armor node and add it to the list
  const armorList = root.querySelector('.armor-list');
  if (!armorList) return;
  
  const newArmorNode = makeArmorNode({
    name: armor['Armor Name'],
    armorType: armorType,
    baseAC: armor.AC || '10',
    acBonus: '0',
    equipped: false,
    weight: weightValue,
    notes: armor.Notes || ''
  }, () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
    renderEncumbrance(root);
    renderMovementRate(root);
    renderAC(root);
  });
  
  armorList.appendChild(newArmorNode);
  
  // Mark as unsaved
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) markUnsaved(activeTab, true, root);
  
  // Trigger recalculations
  renderEncumbrance(root);
  renderMovementRate(root);
  renderAC(root);
  
  // Visual feedback
  const addBtn = event?.target;
  if (addBtn) {
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Added!';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.textContent = originalText;
      addBtn.disabled = false;
    }, 1000);
  }
}

// ===== EQUIPMENT BROWSER =====
function toggleEquipmentBrowser(root) {
  const content = root.querySelector('.equipment-browser-content');
  if (content) {
    content.style.display = (content.style.display === 'none') ? 'block' : 'none';
  }
}

// Toggle language browser visibility (always visible since all characters can learn languages)
function toggleLanguageBrowser(root) {
  const browserSection = root.querySelector('.language-browser-section');
  
  if (!browserSection) return;
  
  // Language browser is always available to all characters
  browserSection.style.display = 'block';
}

// Render spell browser results
async function renderSpellBrowser(root) {
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  const level = parseInt(val(root, "level") || 1, 10);
  const resultsDiv = root.querySelector('.spell-results');
  
  if (!resultsDiv) return;
  
  // Ensure spells are loaded
  await loadSpells();
  
  // Determine caster type and max spell level
  const isPriest = clazz.includes('cleric') || clazz.includes('druid') || 
                   clazz.includes('priest') || clazz.includes('shaman') ||
                   clazz.includes('paladin') || clazz.includes('dpaladin') ||
                   clazz.includes('ranger');
  const isWizard = clazz.includes('mage') || clazz.includes('wizard') || 
                   clazz.includes('illusionist') || clazz.includes('specialist') ||
                   clazz.includes('bard');
  
  if (!isPriest && !isWizard) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Not a spellcaster class.</p>';
    return;
  }
  
  // Get selected spheres/schools
  const selectedSpheres = Array.from(root.querySelectorAll('.sphere-checkboxes input[type="checkbox"]:checked'))
    .map(cb => cb.getAttribute('data-sphere'));
  const selectedSchools = Array.from(root.querySelectorAll('.school-checkboxes input[type="checkbox"]:checked'))
    .map(cb => cb.getAttribute('data-school'));
  
  // Get search term and level filter
  const searchTerm = (root.querySelector('.spell-search')?.value || '').toLowerCase();
  const levelFilter = root.querySelector('.spell-level-filter')?.value;
  
  // Determine max spell level character can cast
  let maxSpellLevel = Math.min(Math.ceil(level / 2), isPriest ? 7 : 9);
  
  // Filter spells
  let filteredSpells = filterSpells({
    spellClass: isPriest ? 'priest' : 'wizard',
    maxLevel: maxSpellLevel,
    spheres: selectedSpheres,
    schools: selectedSchools
  });
  
  // Apply search filter
  if (searchTerm) {
    filteredSpells = filteredSpells.filter(spell => 
      spell.name.toLowerCase().includes(searchTerm) ||
      spell.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply level filter
  if (levelFilter) {
    filteredSpells = filteredSpells.filter(spell => 
      spell.level === parseInt(levelFilter, 10)
    );
  }
  
  // Sort by level, then name
  filteredSpells.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });
  
  // Render results
  if (filteredSpells.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No spells found matching criteria.</p>';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  filteredSpells.forEach(spell => {
    const spellDiv = document.createElement('div');
    spellDiv.className = 'spell-result-item';
    spellDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;cursor:pointer;transition:background 0.2s;';
    spellDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${spell.name}</strong>
          <span style="margin-left:8px;font-size:11px;color:var(--muted);">Level ${spell.level}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);">
          ${isPriest ? spell.sphere : spell.school}
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px;">
        ${spell.range} | ${spell.duration} | ${spell.components}
      </div>
    `;
    
    // Hover effect
    spellDiv.addEventListener('mouseenter', () => {
      spellDiv.style.background = 'var(--glass)';
    });
    spellDiv.addEventListener('mouseleave', () => {
      spellDiv.style.background = '';
    });
    
    // Click to show details (we'll implement this next)
    spellDiv.addEventListener('click', () => {
      showSpellDetails(root, spell);
    });
    
    resultsDiv.appendChild(spellDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredSpells.length} spell${filteredSpells.length !== 1 ? 's' : ''}`;
  resultsDiv.appendChild(countDiv);
}

async function renderEquipmentBrowser(root) {
  const resultsDiv = root.querySelector('.equipment-results');
  
  if (!resultsDiv) return;
  
  // Ensure equipment data is loaded
  if (!EQUIPMENT_DATA || EQUIPMENT_DATA.length === 0) {
    // Try to wait a bit for the data to load
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!EQUIPMENT_DATA || EQUIPMENT_DATA.length === 0) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Equipment not loaded. Please refresh the page.</p>';
      return;
    }
  }
  
  // Get search term and category filter
  const searchTerm = (root.querySelector('.equipment-search')?.value || '').toLowerCase();
  const categoryFilter = root.querySelector('.equipment-category-filter')?.value;
  
  // Filter equipment
  let filteredEquipment = [...EQUIPMENT_DATA];
  
  // Apply search filter
  if (searchTerm) {
    filteredEquipment = filteredEquipment.filter(item => 
      item['Item Name'].toLowerCase().includes(searchTerm) ||
      (item.Category && item.Category.toLowerCase().includes(searchTerm)) ||
      (item.Notes && item.Notes.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply category filter
  if (categoryFilter) {
    filteredEquipment = filteredEquipment.filter(item => 
      item.Category === categoryFilter
    );
  }
  
  // Sort alphabetically if no filter, otherwise group by category
  if (!categoryFilter) {
    // No filter - sort alphabetically by name only
    filteredEquipment.sort((a, b) => {
      return a['Item Name'].localeCompare(b['Item Name']);
    });
  } else {
    // Filter selected - sort by category, then name
    filteredEquipment.sort((a, b) => {
      if (a.Category !== b.Category) return a.Category.localeCompare(b.Category);
      return a['Item Name'].localeCompare(b['Item Name']);
    });
  }
  
  // Render results
  if (filteredEquipment.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No equipment found matching criteria.</p>';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  filteredEquipment.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'equipment-result-item';
    itemDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s;';
    
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    
    // Build info display
    let infoHTML = `
      <div>
        <strong>${item['Item Name']}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${item.Category || ''}</span>
      </div>
    `;
    
    // Add details line
    let details = [];
    if (item.Weight && item.Weight !== 'N/A') details.push(`Weight: ${item.Weight}`);
    if (item.Cost && item.Cost !== 'N/A') details.push(`Cost: ${item.Cost}`);
    if (item.Capacity && item.Capacity !== 'N/A') details.push(`Capacity: ${item.Capacity}`);
    
    if (details.length > 0) {
      infoHTML += `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${details.join(' | ')}</div>`;
    }
    
    // Add notes if present
    if (item.Notes) {
      infoHTML += `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${item.Notes}</div>`;
    }
    
    infoDiv.innerHTML = infoHTML;
    
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      addEquipmentFromBrowser(root, item);
    };
    
    itemDiv.appendChild(infoDiv);
    itemDiv.appendChild(addBtn);
    
    // Hover effect
    itemDiv.addEventListener('mouseenter', () => {
      itemDiv.style.background = 'var(--glass)';
    });
    itemDiv.addEventListener('mouseleave', () => {
      itemDiv.style.background = '';
    });
    
    resultsDiv.appendChild(itemDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredEquipment.length} item${filteredEquipment.length !== 1 ? 's' : ''}`;
  resultsDiv.appendChild(countDiv);
}

// Render Language Browser
async function renderLanguageBrowser(root) {
  const resultsDiv = root.querySelector('.language-results');
  
  if (!resultsDiv) return;
  
  // Ensure languages are loaded
  if (!LANGUAGES_DATA || LANGUAGES_DATA.length === 0) {
    // Try to wait a bit for the data to load
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!LANGUAGES_DATA || LANGUAGES_DATA.length === 0) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Languages not loaded. Please refresh the page.</p>';
      return;
    }
  }
  
  // Get search term and rarity filter
  const searchTerm = (root.querySelector('.language-search')?.value || '').toLowerCase();
  const rarityFilter = root.querySelector('.language-rarity-filter')?.value;
  
  // Filter languages
  let filteredLanguages = [...LANGUAGES_DATA];
  
  // Apply search filter
  if (searchTerm) {
    filteredLanguages = filteredLanguages.filter(lang => 
      lang.Language.toLowerCase().includes(searchTerm) ||
      (lang.Description && lang.Description.toLowerCase().includes(searchTerm)) ||
      (lang['Language Class'] && lang['Language Class'].toLowerCase().includes(searchTerm)) ||
      (lang['Native Race'] && lang['Native Race'].toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply rarity filter
  if (rarityFilter) {
    filteredLanguages = filteredLanguages.filter(lang => 
      lang.Rarity === rarityFilter
    );
  }
  
  // Sort alphabetically if no filter, otherwise group by rarity
  if (!rarityFilter) {
    // No filter - sort alphabetically by name only
    filteredLanguages.sort((a, b) => {
      return a.Language.localeCompare(b.Language);
    });
  } else {
    // Filter selected - sort by rarity, then name
    const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Very Rare': 4, 'Exotic': 5, 'Secret': 6 };
    filteredLanguages.sort((a, b) => {
      const rarityA = rarityOrder[a.Rarity] || 999;
      const rarityB = rarityOrder[b.Rarity] || 999;
      if (rarityA !== rarityB) return rarityA - rarityB;
      return a.Language.localeCompare(b.Language);
    });
  }
  
  // Render results
  if (filteredLanguages.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No languages found matching criteria.</p>';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  filteredLanguages.forEach(lang => {
    const langDiv = document.createElement('div');
    langDiv.className = 'language-result-item';
    langDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s;';
    
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    infoDiv.innerHTML = `
      <div>
        <strong>${lang.Language}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${lang.Rarity || 'Unknown'}</span>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">
        ${lang['Language Class'] || ''} ${lang['Native Race'] ? `| ${lang['Native Race']}` : ''}
      </div>
      ${lang.Description ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${lang.Description}</div>` : ''}
    `;
    
    const learnBtn = document.createElement('button');
    learnBtn.textContent = 'Learn';
    learnBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';
    learnBtn.onclick = (e) => {
      e.stopPropagation();
      addLanguageProficiency(root, lang);
    };
    
    langDiv.appendChild(infoDiv);
    langDiv.appendChild(learnBtn);
    
    // Hover effect
    langDiv.addEventListener('mouseenter', () => {
      langDiv.style.background = 'var(--glass)';
    });
    langDiv.addEventListener('mouseleave', () => {
      langDiv.style.background = '';
    });
    
    resultsDiv.appendChild(langDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredLanguages.length} language${filteredLanguages.length !== 1 ? 's' : ''}`;
  resultsDiv.appendChild(countDiv);
}

// Add language to proficiencies
function addLanguageProficiency(root, lang) {
  // Initialize languages array if it doesn't exist
  if (!root._languages) {
    root._languages = [];
  }
  
  // Check if language already learned
  const alreadyLearned = root._languages.some(l => l.name === lang.Language);
  if (alreadyLearned) {
    alert(`You already know ${lang.Language}!`);
    return;
  }
  
  // Calculate language limit based on Intelligence using INT_TABLE
  const int = parseInt(val(root, 'int') || 0, 10);
  const intData = INT_TABLE[int];
  const languageLimit = intData ? intData[0] : 0; // First value in array is # of languages
  
  // Check if at language limit
  if (root._languages.length >= languageLimit) {
    alert(`You cannot learn more languages! Your Intelligence (${int}) allows a maximum of ${languageLimit} language${languageLimit !== 1 ? 's' : ''}. You currently know ${root._languages.length}.`);
    return;
  }
  
  // Add the language with read/write flags
  root._languages.push({
    name: lang.Language,
    rarity: lang.Rarity || 'Unknown',
    languageClass: lang['Language Class'] || '',
    nativeRace: lang['Native Race'] || '',
    rootLanguage: lang['Root Language'] || 'None',
    description: lang.Description || '',
    canRead: true,
    canWrite: true
  });
  
  renderLanguageProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// Render language proficiencies list
function renderLanguageProficiencies(root) {
  const listDiv = root.querySelector('.language-profs-list');
  
  if (!listDiv) return;
  
  const languages = root._languages || [];
  
  // Calculate language limit using INT_TABLE
  const int = parseInt(val(root, 'int') || 0, 10);
  const intData = INT_TABLE[int];
  const languageLimit = intData ? intData[0] : 0;
  
  listDiv.innerHTML = '';
  
  // Add language count header
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = 'padding:8px;margin-bottom:8px;background:var(--glass);border-radius:4px;font-size:13px;';
  const atLimit = languages.length >= languageLimit;
  const color = atLimit ? 'var(--error, #ff6b6b)' : 'var(--muted)';
  headerDiv.innerHTML = `<strong>Languages Known:</strong> <span style="color:${color}">${languages.length} / ${languageLimit}</span> (based on INT ${int})`;
  listDiv.appendChild(headerDiv);
  
  if (languages.length === 0) {
    const emptyDiv = document.createElement('p');
    emptyDiv.style.cssText = 'color:var(--muted);font-size:12px;padding:8px;';
    emptyDiv.textContent = 'No languages learned yet.';
    listDiv.appendChild(emptyDiv);
    return;
  }
  
  languages.forEach((lang, index) => {
    const langDiv = document.createElement('div');
    langDiv.className = 'language-prof-item';
    langDiv.style.cssText = 'padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);';
    
    langDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div style="flex:1;">
          <strong>${lang.name}</strong>
          <span style="margin-left:8px;font-size:11px;color:var(--muted);">${lang.rarity}</span>
          ${lang.languageClass ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${lang.languageClass}</div>` : ''}
          ${lang.description ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${lang.description}</div>` : ''}
        </div>
        <button class="delete-language" data-index="${index}" style="padding:4px 8px;font-size:11px;margin-left:8px;">Delete</button>
      </div>
      <div style="display:flex;gap:12px;font-size:12px;">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
          <input type="checkbox" class="lang-read" data-index="${index}" ${lang.canRead ? 'checked' : ''}>
          <span>Read</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
          <input type="checkbox" class="lang-write" data-index="${index}" ${lang.canWrite ? 'checked' : ''}>
          <span>Write</span>
        </label>
      </div>
    `;
    
    listDiv.appendChild(langDiv);
  });
  
  // Attach event listeners
  listDiv.querySelectorAll('.delete-language').forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.getAttribute('data-index'), 10);
      deleteLanguageProficiency(root, index);
    };
  });
  
  listDiv.querySelectorAll('.lang-read').forEach(cb => {
    cb.onchange = () => {
      const index = parseInt(cb.getAttribute('data-index'), 10);
      updateLanguageFlag(root, index, 'canRead', cb.checked);
    };
  });
  
  listDiv.querySelectorAll('.lang-write').forEach(cb => {
    cb.onchange = () => {
      const index = parseInt(cb.getAttribute('data-index'), 10);
      updateLanguageFlag(root, index, 'canWrite', cb.checked);
    };
  });
}

// Delete a language proficiency
function deleteLanguageProficiency(root, index) {
  if (!root._languages || !root._languages[index]) return;
  
  const langName = root._languages[index].name;
  
  if (confirm(`Remove ${langName} from your languages?`)) {
    root._languages.splice(index, 1);
    renderLanguageProficiencies(root);
    
    // Mark as unsaved
    const tab = document.querySelector('.tab.active');
    if (tab) markUnsaved(tab, true, root);
  }
}

// Update language read/write flags
function updateLanguageFlag(root, index, flagName, value) {
  if (!root._languages || !root._languages[index]) return;
  
  root._languages[index][flagName] = value;
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// Add equipment item from browser to carried equipment
function addEquipmentFromBrowser(root, item) {
  // Parse weight - extract just the number
  let weightValue = '';
  if (item.Weight && item.Weight !== 'N/A') {
    const weightMatch = item.Weight.match(/[\d.]+/);
    if (weightMatch) {
      weightValue = weightMatch[0];
    }
  }
  
  // Create the item node and add it to the list
  const itemsList = root.querySelector('.items-list');
  if (!itemsList) return;
  
  const newItemNode = makeItemNode({
    name: item['Item Name'],
    qty: 1,
    weight: weightValue,
    notes: item.Notes || ''
  }, () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
    renderEncumbrance(root);
    renderMovementRate(root);
  });
  
  itemsList.appendChild(newItemNode);
  
  // Mark as unsaved
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) markUnsaved(activeTab, true, root);
  
  // Trigger encumbrance recalculation
  renderEncumbrance(root);
  renderMovementRate(root);
  
  // Visual feedback
  const addBtn = event?.target;
  if (addBtn) {
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Added!';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.textContent = originalText;
      addBtn.disabled = false;
    }, 1000);
  }
}

// Add custom language manually
function addCustomLanguage(root) {
  const langName = prompt('Enter language name:');
  if (!langName || !langName.trim()) return;
  
  const rarity = prompt('Enter rarity (Common, Uncommon, Rare, Very Rare, Exotic, Secret):', 'Common');
  if (!rarity) return;
  
  // Initialize languages array if it doesn't exist
  if (!root._languages) {
    root._languages = [];
  }
  
  // Check if language already learned
  const alreadyLearned = root._languages.some(l => l.name.toLowerCase() === langName.trim().toLowerCase());
  if (alreadyLearned) {
    alert(`You already know ${langName}!`);
    return;
  }
  
  // Calculate language limit based on Intelligence
  const int = parseInt(val(root, 'int') || 0, 10);
  const intData = INT_TABLE[int];
  const languageLimit = intData ? intData[0] : 0;
  
  // Check if at language limit
  if (root._languages.length >= languageLimit) {
    alert(`You cannot learn more languages! Your Intelligence (${int}) allows a maximum of ${languageLimit} language${languageLimit !== 1 ? 's' : ''}. You currently know ${root._languages.length}.`);
    return;
  }
  
  // Add the custom language
  root._languages.push({
    name: langName.trim(),
    rarity: rarity || 'Common',
    languageClass: '',
    nativeRace: '',
    rootLanguage: 'None',
    description: '(Custom)',
    canRead: true,
    canWrite: true
  });
  
  renderLanguageProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// ===== WEAPON PROFICIENCIES BROWSER =====
async function renderWeaponBrowser(root) {
  const resultsDiv = root.querySelector('.weapon-results');
  
  if (!resultsDiv) return;
  
  // Ensure weapons are loaded
  if (!WEAPONS_DATA || WEAPONS_DATA.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!WEAPONS_DATA || WEAPONS_DATA.length === 0) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Weapons not loaded. Please refresh the page.</p>';
      return;
    }
  }
  
  // Get search term and filters
  const searchTerm = (root.querySelector('.weapon-search')?.value || '').toLowerCase();
  const categoryFilter = root.querySelector('.weapon-category-filter')?.value;
  const groupFilter = root.querySelector('.weapon-group-filter')?.value;
  
  // Filter weapons
  let filteredWeapons = [...WEAPONS_DATA];
  
  // Apply search filter
  if (searchTerm) {
    filteredWeapons = filteredWeapons.filter(weapon => 
      weapon['Weapon Name'].toLowerCase().includes(searchTerm) ||
      (weapon.Group && weapon.Group.toLowerCase().includes(searchTerm)) ||
      (weapon.Type && weapon.Type.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply category filter
  if (categoryFilter) {
    if (categoryFilter === 'Melee') {
      // Include weapons with "Melee" in the category
      filteredWeapons = filteredWeapons.filter(weapon => 
        weapon.Category && weapon.Category.includes('Melee')
      );
    } else if (categoryFilter === 'Ranged') {
      // Include Ranged and Thrown weapons
      filteredWeapons = filteredWeapons.filter(weapon => 
        weapon.Category === 'Ranged' || 
        (weapon.Category && weapon.Category.includes('Thrown'))
      );
    }
  }
  
  // Apply group filter
  if (groupFilter) {
    filteredWeapons = filteredWeapons.filter(weapon => 
      weapon.Group === groupFilter
    );
  }
  
  // Sort alphabetically if "All Groups" selected, otherwise group by group
  if (!groupFilter) {
    // "All Groups" selected - sort alphabetically by name only
    filteredWeapons.sort((a, b) => {
      return a['Weapon Name'].localeCompare(b['Weapon Name']);
    });
  } else {
    // Specific group selected - sort by group, then name
    filteredWeapons.sort((a, b) => {
      if (a.Group !== b.Group) return (a.Group || '').localeCompare(b.Group || '');
      return a['Weapon Name'].localeCompare(b['Weapon Name']);
    });
  }
  
  resultsDiv.innerHTML = '';
  
  filteredWeapons.forEach(weapon => {
    const weaponDiv = document.createElement('div');
    weaponDiv.className = 'weapon-result-item';
    weaponDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s;';
    
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    infoDiv.innerHTML = `
      <div>
        <strong>${weapon['Weapon Name']}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${weapon.Group || ''}</span>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">
        ${weapon.Category || ''} ${weapon.Type ? `| ${weapon.Type}` : ''}
        ${weapon['Damage (S-M)'] ? `| Damage: ${weapon['Damage (S-M)']}` : ''}
      </div>
    `;
    
    const learnBtn = document.createElement('button');
    learnBtn.textContent = 'Learn';
    learnBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';
    learnBtn.onclick = (e) => {
      e.stopPropagation();
      addWeaponProficiency(root, weapon);
    };
    
    weaponDiv.appendChild(infoDiv);
    weaponDiv.appendChild(learnBtn);
    
    // Hover effect
    weaponDiv.addEventListener('mouseenter', () => {
      weaponDiv.style.background = 'var(--glass)';
    });
    weaponDiv.addEventListener('mouseleave', () => {
      weaponDiv.style.background = '';
    });
    
    resultsDiv.appendChild(weaponDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredWeapons.length} weapon${filteredWeapons.length !== 1 ? 's' : ''}`;
  resultsDiv.appendChild(countDiv);
}

// Add weapon proficiency from browser
function addWeaponProficiency(root, weapon) {
  // Initialize weapon proficiencies array if it doesn't exist
  if (!root._weaponProfs) {
    root._weaponProfs = [];
  }
  
  // Check if weapon already learned
  const alreadyLearned = root._weaponProfs.some(w => w.name === weapon['Weapon Name']);
  if (alreadyLearned) {
    alert(`You are already proficient with ${weapon['Weapon Name']}!`);
    return;
  }
  
  // Add the weapon proficiency
  root._weaponProfs.push({
    name: weapon['Weapon Name'],
    group: weapon.Group || '',
    slots: 1
  });
  
  renderWeaponProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// Render weapon proficiencies list
function renderWeaponProficiencies(root) {
  const listDiv = root.querySelector('.weapon-profs-list');
  
  if (!listDiv) return;
  
  const weaponProfs = root._weaponProfs || [];
  
  listDiv.innerHTML = '';
  
  if (weaponProfs.length === 0) {
    const emptyDiv = document.createElement('p');
    emptyDiv.style.cssText = 'color:var(--muted);font-size:12px;padding:8px;';
    emptyDiv.textContent = 'No weapon proficiencies yet.';
    listDiv.appendChild(emptyDiv);
    return;
  }
  
  weaponProfs.forEach((prof, index) => {
    const profDiv = document.createElement('div');
    profDiv.className = 'weapon-prof-item';
    profDiv.style.cssText = 'padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);display:flex;justify-content:space-between;align-items:center;';
    
    profDiv.innerHTML = `
      <div style="flex:1;">
        <strong>${prof.name}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${prof.group}</span>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">Slots: ${prof.slots}</div>
      </div>
      <button class="delete-weapon-prof" data-index="${index}" style="padding:4px 8px;font-size:11px;margin-left:8px;">Delete</button>
    `;
    
    listDiv.appendChild(profDiv);
  });
  
  // Attach delete event listeners
  listDiv.querySelectorAll('.delete-weapon-prof').forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.getAttribute('data-index'), 10);
      deleteWeaponProficiency(root, index);
    };
  });
}

// Delete a weapon proficiency
function deleteWeaponProficiency(root, index) {
  if (!root._weaponProfs || !root._weaponProfs[index]) return;
  
  const weaponName = root._weaponProfs[index].name;
  
  if (confirm(`Remove ${weaponName} proficiency?`)) {
    root._weaponProfs.splice(index, 1);
    renderWeaponProficiencies(root);
    
    // Mark as unsaved
    const tab = document.querySelector('.tab.active');
    if (tab) markUnsaved(tab, true, root);
  }
}

// Add custom weapon proficiency manually
function addCustomWeaponProficiency(root) {
  const weaponName = prompt('Enter weapon name:');
  if (!weaponName || !weaponName.trim()) return;
  
  const group = prompt('Enter weapon group (e.g., Sword, Axe, Bow):', '');
  const slots = prompt('Enter slots required:', '1');
  
  // Initialize weapon proficiencies array if it doesn't exist
  if (!root._weaponProfs) {
    root._weaponProfs = [];
  }
  
  // Check if weapon already learned
  const alreadyLearned = root._weaponProfs.some(w => w.name.toLowerCase() === weaponName.trim().toLowerCase());
  if (alreadyLearned) {
    alert(`You are already proficient with ${weaponName}!`);
    return;
  }
  
  // Add the custom weapon proficiency
  root._weaponProfs.push({
    name: weaponName.trim(),
    group: group ? group.trim() : '',
    slots: parseInt(slots) || 1
  });
  
  renderWeaponProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// ===== NON-WEAPON PROFICIENCIES BROWSER =====
async function renderNWPBrowser(root) {
  const resultsDiv = root.querySelector('.nwp-results');
  
  if (!resultsDiv) return;
  
  // Ensure NWPs are loaded
  if (!NWP_DATA || NWP_DATA.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!NWP_DATA || NWP_DATA.length === 0) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Non-weapon proficiencies not loaded. Please refresh the page.</p>';
      return;
    }
  }
  
  // Get search term and filter
  const searchTerm = (root.querySelector('.nwp-search')?.value || '').toLowerCase();
  const categoryFilter = root.querySelector('.nwp-category-filter')?.value;
  
  // Filter NWPs
  let filteredNWPs = [...NWP_DATA];
  
  // Apply search filter
  if (searchTerm) {
    filteredNWPs = filteredNWPs.filter(nwp => 
      nwp['Proficiency Name'].toLowerCase().includes(searchTerm) ||
      (nwp.Category && nwp.Category.toLowerCase().includes(searchTerm)) ||
      (nwp.Notes && nwp.Notes.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply category filter
  if (categoryFilter) {
    filteredNWPs = filteredNWPs.filter(nwp => 
      nwp.Category === categoryFilter
    );
  }
  
  // Sort alphabetically if no filter, otherwise group by category
  if (!categoryFilter) {
    // No filter - sort alphabetically by name only
    filteredNWPs.sort((a, b) => {
      return a['Proficiency Name'].localeCompare(b['Proficiency Name']);
    });
  } else {
    // Filter selected - sort by category, then name
    filteredNWPs.sort((a, b) => {
      if (a.Category !== b.Category) return (a.Category || '').localeCompare(b.Category || '');
      return a['Proficiency Name'].localeCompare(b['Proficiency Name']);
    });
  }
  
  // Render results
  if (filteredNWPs.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No proficiencies found matching criteria.</p>';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  filteredNWPs.forEach(nwp => {
    const nwpDiv = document.createElement('div');
    nwpDiv.className = 'nwp-result-item';
    nwpDiv.style.cssText = 'padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;transition:background 0.2s;';
    
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    infoDiv.innerHTML = `
      <div>
        <strong>${nwp['Proficiency Name']}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${nwp.Category || ''}</span>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">
        Slots: ${nwp.Slots || '1'} | Check: ${nwp['Ability Check'] || 'N/A'}
      </div>
      ${nwp.Notes ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${nwp.Notes}</div>` : ''}
    `;
    
    const learnBtn = document.createElement('button');
    learnBtn.textContent = 'Learn';
    learnBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';
    learnBtn.onclick = (e) => {
      e.stopPropagation();
      addNWProficiency(root, nwp);
    };
    
    nwpDiv.appendChild(infoDiv);
    nwpDiv.appendChild(learnBtn);
    
    // Hover effect
    nwpDiv.addEventListener('mouseenter', () => {
      nwpDiv.style.background = 'var(--glass)';
    });
    nwpDiv.addEventListener('mouseleave', () => {
      nwpDiv.style.background = '';
    });
    
    resultsDiv.appendChild(nwpDiv);
  });
  
  // Show count
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px;';
  countDiv.textContent = `Showing ${filteredNWPs.length} proficienc${filteredNWPs.length !== 1 ? 'ies' : 'y'}`;
  resultsDiv.appendChild(countDiv);
}

// Add non-weapon proficiency from browser
function addNWProficiency(root, nwp) {
  // Initialize NWP array if it doesn't exist
  if (!root._nwps) {
    root._nwps = [];
  }
  
  // Check if proficiency already learned
  const alreadyLearned = root._nwps.some(n => n.name === nwp['Proficiency Name']);
  if (alreadyLearned) {
    alert(`You already have the ${nwp['Proficiency Name']} proficiency!`);
    return;
  }
  
  // Add the NWP
  root._nwps.push({
    name: nwp['Proficiency Name'],
    category: nwp.Category || '',
    slots: parseInt(nwp.Slots) || 1,
    abilityCheck: nwp['Ability Check'] || '',
    notes: nwp.Notes || ''
  });
  
  renderNWProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// Render non-weapon proficiencies list
function renderNWProficiencies(root) {
  const listDiv = root.querySelector('.nwp-list');
  
  if (!listDiv) return;
  
  const nwps = root._nwps || [];
  
  listDiv.innerHTML = '';
  
  if (nwps.length === 0) {
    const emptyDiv = document.createElement('p');
    emptyDiv.style.cssText = 'color:var(--muted);font-size:12px;padding:8px;';
    emptyDiv.textContent = 'No non-weapon proficiencies yet.';
    listDiv.appendChild(emptyDiv);
    return;
  }
  
  nwps.forEach((nwp, index) => {
    const nwpDiv = document.createElement('div');
    nwpDiv.className = 'nwp-item';
    nwpDiv.style.cssText = 'padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);';
    
    nwpDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
        <div style="flex:1;">
          <strong>${nwp.name}</strong>
          <span style="margin-left:8px;font-size:11px;color:var(--muted);">${nwp.category}</span>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">
            Slots: ${nwp.slots} | Check: ${nwp.abilityCheck}
          </div>
          ${nwp.notes ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${nwp.notes}</div>` : ''}
        </div>
        <button class="delete-nwp" data-index="${index}" style="padding:4px 8px;font-size:11px;margin-left:8px;">Delete</button>
      </div>
    `;
    
    listDiv.appendChild(nwpDiv);
  });
  
  // Attach delete event listeners
  listDiv.querySelectorAll('.delete-nwp').forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.getAttribute('data-index'), 10);
      deleteNWProficiency(root, index);
    };
  });
}

// Delete a non-weapon proficiency
function deleteNWProficiency(root, index) {
  if (!root._nwps || !root._nwps[index]) return;
  
  const nwpName = root._nwps[index].name;
  
  if (confirm(`Remove ${nwpName} proficiency?`)) {
    root._nwps.splice(index, 1);
    renderNWProficiencies(root);
    
    // Mark as unsaved
    const tab = document.querySelector('.tab.active');
    if (tab) markUnsaved(tab, true, root);
  }
}

// Add custom non-weapon proficiency manually
function addCustomNWProficiency(root) {
  const nwpName = prompt('Enter proficiency name:');
  if (!nwpName || !nwpName.trim()) return;
  
  const category = prompt('Enter category (General, Warrior, Wizard, Priest, Rogue):', 'General');
  const slots = prompt('Enter slots required:', '1');
  const abilityCheck = prompt('Enter ability check (e.g., Int / 0, Wis / -1):', '');
  
  // Initialize NWP array if it doesn't exist
  if (!root._nwps) {
    root._nwps = [];
  }
  
  // Check if proficiency already learned
  const alreadyLearned = root._nwps.some(n => n.name.toLowerCase() === nwpName.trim().toLowerCase());
  if (alreadyLearned) {
    alert(`You already have the ${nwpName} proficiency!`);
    return;
  }
  
  // Add the custom NWP
  root._nwps.push({
    name: nwpName.trim(),
    category: category ? category.trim() : 'General',
    slots: parseInt(slots) || 1,
    abilityCheck: abilityCheck ? abilityCheck.trim() : '',
    notes: '(Custom)'
  });
  
  renderNWProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}



// Placeholder for spell details modal (we'll implement this next)
// Show spell details in modal
function showSpellDetails(root, spell) {
  const modal = root.querySelector('.spell-modal');
  if (!modal) return;
  
  // Populate modal content
  modal.querySelector('.spell-modal-name').textContent = spell.name;
  modal.querySelector('.spell-modal-level').textContent = 
    `Level ${spell.level} | ${spell.school || spell.sphere}`;
  
  // Stats grid
  const statsDiv = modal.querySelector('.spell-modal-stats');
  statsDiv.innerHTML = `
    <div><strong>Range:</strong> ${spell.range}</div>
    <div><strong>Duration:</strong> ${spell.duration}</div>
    <div><strong>Area of Effect:</strong> ${spell.aoe}</div>
    <div><strong>Casting Time:</strong> ${spell.castTime}</div>
    <div><strong>Components:</strong> ${spell.components}</div>
    <div><strong>Saving Throw:</strong> ${spell.save}</div>
  `;
  
  // Description
  modal.querySelector('.spell-modal-description').textContent = spell.description;
  
  // Show modal
  modal.style.display = 'flex';
  
  // Close buttons
  const closeButtons = modal.querySelectorAll('.close-spell-modal, .close-spell-modal-btn');
  closeButtons.forEach(btn => {
    btn.onclick = () => modal.style.display = 'none';
  });
  
  // Update button container to have both options
  const buttonContainer = modal.querySelector('.spell-modal-content > div:last-child');
  buttonContainer.innerHTML = `
    <button class="add-to-spellbook" style="padding:8px 16px;">Add to Spellbook</button>
    <button class="add-to-memorized" style="padding:8px 16px;">Add to Memorized</button>
    <button class="close-spell-modal-btn" style="padding:8px 16px;">Close</button>
  `;
  
  // Wire up new buttons
  buttonContainer.querySelector('.close-spell-modal-btn').onclick = () => {
    modal.style.display = 'none';
  };
  
  buttonContainer.querySelector('.add-to-spellbook').onclick = () => {
    addSpellToSpellbook(root, spell);
    modal.style.display = 'none';
  };
  
  buttonContainer.querySelector('.add-to-memorized').onclick = () => {
    addSpellToMemorized(root, spell);
    modal.style.display = 'none';
  };
  
  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Add spell to memorized list
function addSpellToMemorized(root, spell) {
  // Find the memorized spells list
  const memList = root.querySelector('.memspells-list');
  
  if (!memList) {
    alert('Memorized spells section not found');
    return;
  }
  
  // Create a new memorized spell node with all details
  const spellData = {
    name: spell.name,
    level: spell.level,
    schoolSphere: spell.school || spell.sphere,
    castTime: spell.castTime,
    range: spell.range,
    duration: spell.duration,
    components: spell.components,
    save: spell.save,
    description: spell.description,
    notes: '' // Leave notes empty for user to fill in
  };
  
  const node = makeMemSpellNode(spellData, () => {
    markUnsaved(document.querySelector('.tab.active'), true, root);
  });
  
  memList.appendChild(node);
  
  // Sort the list
  sortMemorizedSpells(root);
  
  // Update spell slot status
  renderMemorizedSpellStatus(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  markUnsaved(tab, true, root);
  
  // Apply current filter
  const filter = root.querySelector('.memspell-level-filter');
  if (filter) {
    filterMemorizedSpells(root, filter.value);
  }
  
  console.log(`Added "${spell.name}" to memorized spells`);
}

// Add spell to spellbook
function addSpellToSpellbook(root, spell) {
  const activeSpellbook = getActiveSpellbook(root);
  
  if (!activeSpellbook) {
    alert('No active spellbook found');
    return;
  }
  
  // Check for duplicates in the active spellbook
  const isDuplicate = activeSpellbook.spells.some(s => 
    s.name.toLowerCase() === spell.name.toLowerCase()
  );
  
  if (isDuplicate) {
    alert(`"${spell.name}" is already in your ${activeSpellbook.name}.`);
    return;
  }
  
  // Create spell data
  const spellData = {
    name: spell.name,
    level: spell.level,
    schoolSphere: spell.school || spell.sphere,
    castTime: spell.castTime,
    range: spell.range,
    duration: spell.duration,
    components: spell.components,
    save: spell.save,
    description: spell.description,
    notes: ''
  };
  
  // Add to UI
  const spellbookList = root.querySelector('.spellbook-list');
  if (spellbookList) {
    const node = makeSpellbookNode(spellData, () => {
      markUnsaved(document.querySelector('.tab.active'), true, root);
      syncSpellbookToData(root);
    });
    spellbookList.appendChild(node);
    
    // Sort and filter
    sortSpellbook(root);
    const filter = root.querySelector('.spellbook-level-filter');
    if (filter) {
      filterSpellbook(root, filter.value);
    }
  }
  
  // Sync to data structure
  syncSpellbookToData(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  markUnsaved(tab, true, root);
  
  console.log(`Added "${spell.name}" to ${activeSpellbook.name}`);
}

// Render memorized spell slot status with warnings
function renderMemorizedSpellStatus(root) {
  const statusText = root.querySelector('.spell-status-text');
  if (!statusText) return;
  
  // Get available spell slots (already calculated from WIS bonuses, etc.)
  const slots = [];
  for (let i = 1; i <= 9; i++) {
    const slotVal = parseInt(val(root, `slots${i}`) || 0, 10);
    slots[i] = slotVal;
  }
  
  // Count memorized spells by level
  const memorized = {};
  const memItems = Array.from(root.querySelectorAll('.memspells-list .item'));
  memItems.forEach(item => {
    const levelInput = item.querySelector('.level');
    if (levelInput) {
      const level = parseInt(levelInput.value, 10);
      if (level >= 1 && level <= 9) {
        memorized[level] = (memorized[level] || 0) + 1;
      }
    }
  });
  
  // Build status text with color coding
  const statusParts = [];
  for (let level = 1; level <= 9; level++) {
    const available = slots[level] || 0;
    const used = memorized[level] || 0;
    
    // Skip levels with no slots
    if (available === 0 && used === 0) continue;
    
    // Determine color
    let color = 'var(--text)'; // normal
    if (used > available) {
      color = '#f44336'; // red - over limit (same as "Overloaded!" encumbrance)
    }
    
    statusParts.push(
      `<span style="color:${color};">Level ${level}: ${used}/${available}</span>`
    );
  }
  
  // Display status or fallback message
  if (statusParts.length === 0) {
    statusText.innerHTML = '<span style="color:var(--muted);">No spell slots available</span>';
  } else {
    statusText.innerHTML = statusParts.join(' <span style="color:var(--muted);">-</span> ');
  }
}

// Sort memorized spells by level, then alphabetically
function sortMemorizedSpells(root) {
  const memList = root.querySelector('.memspells-list');
  if (!memList) return;
  
  // Get all spell items
  const items = Array.from(memList.querySelectorAll('.item'));
  
  // Sort by level (ascending), then by name (alphabetical)
  items.sort((a, b) => {
    const levelA = parseInt(a.querySelector('.level')?.value || 999, 10);
    const levelB = parseInt(b.querySelector('.level')?.value || 999, 10);
    
    // First compare by level
    if (levelA !== levelB) {
      return levelA - levelB;
    }
    
    // If levels are equal, compare by name
    const nameA = (a.querySelector('.title')?.value || '').toLowerCase();
    const nameB = (b.querySelector('.title')?.value || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Clear and re-append in sorted order
  memList.innerHTML = '';
  items.forEach(item => memList.appendChild(item));
}

function renderClassAbilities(root) {
  const classAbilitiesList = root.querySelector('.class-abilities-list');
  if (!classAbilitiesList) return;

  const charType = (val(root, "char_type") || "single").toLowerCase();

  // Utility: get auto abilities for a single class up to a level
  function getAbilitiesFor(clazz, level) {
    const out = [];
    if (!clazz || !level) return out;

    let classData = null;
    for (let key in CLASS_ABILITIES) {
      if ((clazz + '').toLowerCase().includes(key)) {
        classData = CLASS_ABILITIES[key];
        break;
      }
    }
    if (!classData) return out;

    for (let lvl in classData) {
      if (parseInt(lvl, 10) <= level) {
        classData[lvl].forEach(a => {
          out.push({ name: a.name, notes: a.notes, isAuto: true });
        });
      }
    }
    return out;
  }

  // Keep manual items, remove only auto-generated ones
  const existing = Array.from(classAbilitiesList.querySelectorAll('.item'));
  const autoItems = existing.filter(n => n.dataset.autoGenerated);
  autoItems.forEach(n => n.remove());

  let toRender = [];

  if (charType === 'multi') {
    // Collect abilities from up to three classes at their own levels
    const class1 = (val(root, 'mc_class1') || '').trim().toLowerCase();
    const class2 = (val(root, 'mc_class2') || '').trim().toLowerCase();
    const class3 = (val(root, 'mc_class3') || '').trim().toLowerCase();
    const level1 = parseInt(val(root, 'mc_level1') || 1, 10);
    const level2 = parseInt(val(root, 'mc_level2') || 1, 10);
    const level3 = parseInt(val(root, 'mc_level3') || 0, 10);

    const parts = [];
    if (class1) parts.push({ clazz: class1, level: level1 });
    if (class2) parts.push({ clazz: class2, level: level2 });
    if (class3) parts.push({ clazz: class3, level: level3 });

    parts.forEach(p => {
      const abs = getAbilitiesFor(p.clazz, p.level);
      abs.forEach(a => {
        toRender.push({
          // Prefix class for clarity when names overlap (e.g., “Followers”)
          name: `${p.clazz.charAt(0).toUpperCase() + p.clazz.slice(1)} — ${a.name}`,
          notes: a.notes,
          isAuto: true
        });
      });
    });

  } else if (charType === 'dual') {
    // Use the dedicated dual-class renderer (handles dormant/active)
    if (typeof renderDualClassAbilities === 'function') {
      return renderDualClassAbilities(root, classAbilitiesList);
    }
    return;

  } else {
    // Single-class
    const clazz = (val(root, "clazz") || "").trim().toLowerCase();
    const level = parseInt(val(root, "level") || 1, 10);
    if (!clazz || !level) return;
    toRender = getAbilitiesFor(clazz, level);
  }

  if (!toRender.length) return;

  toRender.forEach(ability => {
    const node = makeAbilityNode(ability, () => markUnsaved(
      document.querySelector('.tab.active'),
      true,
      root
    ));
    classAbilitiesList.appendChild(node);
  });
}

/**
 * Render class abilities for dual-class characters
 * Shows original class abilities as dormant, new class as active
 */
function renderDualClassAbilities(root, classAbilitiesList) {
  const originalClass = (val(root, 'dc_original_class') || '').trim().toLowerCase();
  const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
  const newClass = (val(root, 'dc_new_class') || '').trim().toLowerCase();
  const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
  
  // Calculate dormancy status (in case it hasn't been set yet)
  const isDormant = newLevel <= originalLevel;
  
  // Get existing items
  const existingItems = Array.from(classAbilitiesList.querySelectorAll('.item'));
  const manualItems = existingItems.filter(item => !item.dataset.autoGenerated);
  const autoItems = existingItems.filter(item => item.dataset.autoGenerated);
  
  // Remove all auto-generated items
  autoItems.forEach(item => item.remove());
  
  // Collect abilities from both classes
  const abilitiesToRender = [];
  
  // Original class abilities (mark as dormant if needed)
  if (originalClass && originalLevel > 0) {
    let originalClassData = null;
    for (let classKey in CLASS_ABILITIES) {
      if (originalClass.includes(classKey)) {
        originalClassData = CLASS_ABILITIES[classKey];
        break;
      }
    }
    
    if (originalClassData) {
      for (let abilityLevel in originalClassData) {
        if (parseInt(abilityLevel, 10) <= originalLevel) {
          originalClassData[abilityLevel].forEach(ability => {
            const abilityName = isDormant 
              ? `${ability.name} (DORMANT)` 
              : ability.name;
            
            abilitiesToRender.push({
              name: abilityName,
              notes: ability.notes,
              isAuto: true,
              isDormant: isDormant
            });
          });
        }
      }
    }
  }
  
  // New class abilities (always active)
  if (newClass && newLevel > 0) {
    let newClassData = null;
    for (let classKey in CLASS_ABILITIES) {
      if (newClass.includes(classKey)) {
        newClassData = CLASS_ABILITIES[classKey];
        break;
      }
    }
    
    if (newClassData) {
      for (let abilityLevel in newClassData) {
        if (parseInt(abilityLevel, 10) <= newLevel) {
          newClassData[abilityLevel].forEach(ability => {
            abilitiesToRender.push({
              name: ability.name,
              notes: ability.notes,
              isAuto: true,
              isDormant: false
            });
          });
        }
      }
    }
  }
  
  // Add abilities with appropriate styling
  abilitiesToRender.forEach(ability => {
    const node = makeAbilityNode(ability, () => markUnsaved(
      document.querySelector('.tab.active'),
      true,
      root
    ));
    
    // Apply dormant styling if needed
    if (ability.isDormant) {
      node.classList.add('ability-dormant');
    } else {
      node.classList.add('ability-active');
    }
    
    classAbilitiesList.appendChild(node);
  });
}

function renderMovementRate(root) {
  const baseMovementEl = root.querySelector('[data-field="movement_base"]');
  const currentMovementEl = root.querySelector('[data-field="movement_current"]');
  const runningEl = root.querySelector('[data-field="movement_running"]');
  const climbingEl = root.querySelector('[data-field="movement_climbing"]');
  const swimmingEl = root.querySelector('[data-field="movement_swimming"]');
  
  if (!baseMovementEl || !currentMovementEl || !runningEl || !climbingEl || !swimmingEl) return;
  
  // Get race to determine base movement
  const race = (val(root, "race") || "").trim().toLowerCase();
  
  // Base movement rates by race (in inches per round)
  const raceMovement = {
    'human': 12,
    'elf': 12,
    'half-elf': 12,
    'half elf': 12,
    'halfelf': 12,
    'dwarf': 6,
    'halfling': 6,
    'gnome': 6,
    'half-orc': 12,
    'half orc': 12,
    'halforc': 12
  };
  
  let baseMovement = 12; // Default to human
  let raceName = "Human";
  
  // Find matching race
  for (let raceKey in raceMovement) {
    if (race.includes(raceKey)) {
      baseMovement = raceMovement[raceKey];
      raceName = raceKey.charAt(0).toUpperCase() + raceKey.slice(1).replace(/-/g, '-');
      break;
    }
  }
  
  // Get encumbrance category
  const category = val(root, "encumbrance_category") || "";
  
  // Calculate movement modifier based on encumbrance
  let movementMultiplier = 1.0;
  let encumbranceNote = "";
  
  if (category === "Unencumbered" || category === "Light") {
    movementMultiplier = 1.0;
    encumbranceNote = "";
  } else if (category === "Moderate") {
    movementMultiplier = 2/3;
    encumbranceNote = " (Moderate Load)";
  } else if (category === "Heavy") {
    movementMultiplier = 0.5;
    encumbranceNote = " (Heavy Load)";
  } else if (category === "Severe") {
    movementMultiplier = 1/3;
    encumbranceNote = " (Severe Load)";
  } else if (category === "Overloaded!") {
    movementMultiplier = 0;
    encumbranceNote = " (Overloaded!)";
  }
  
  // Calculate current movement
  const currentMovement = Math.round(baseMovement * movementMultiplier * 10) / 10;
  
  // Calculate derived movements
  const running = Math.round(currentMovement * 3 * 10) / 10;
  const climbing = Math.round(currentMovement / 2 * 10) / 10;
  
  // Swimming calculation - check if wearing armor
  const armorList = root.querySelectorAll('.armor-list .item');
  let wearingArmor = false;
  let armorNames = [];
  
  armorList.forEach(item => {
    const equipped = item.querySelector('.equipped')?.checked;
    const type = item.querySelector('.armor-type')?.value || "Armor";
    const name = item.querySelector('.title')?.value || "";
    
    // Only "Armor" type prevents swimming when equipped
    if (equipped && type === "Armor" && name.trim() !== '') {
      wearingArmor = true;
      armorNames.push(name);
    }
  });
  
  // Build armor name string (in case multiple armors equipped)
  const armorName = armorNames.join(", ");
  
  let swimming = 0;
  let swimmingNote = "";
  
  if (wearingArmor) {
    swimming = 0;
    swimmingNote = `Cannot swim (${armorName})`;
  } else {
    swimming = Math.round(currentMovement / 3 * 10) / 10;
    swimmingNote = `${swimming}" (${swimming * 10} ft/turn)`;
  }
  
  // Format output
  baseMovementEl.value = `${baseMovement}" (${baseMovement * 10} ft/turn) - ${raceName}`;
  baseMovementEl.title = `Base movement for ${raceName}\n1" = 10 feet per turn\n1 round = 1 minute`;
  
  currentMovementEl.value = `${currentMovement}" (${currentMovement * 10} ft/turn)${encumbranceNote}`;
  currentMovementEl.title = `Current movement with encumbrance\nBase: ${baseMovement}" × ${movementMultiplier.toFixed(2)} = ${currentMovement}"`;
  
  runningEl.value = `${running}" (${running * 10} ft/turn)`;
  runningEl.title = `Short sprint (3× current movement)\nCan only maintain for a few rounds`;
  
  climbingEl.value = `${climbing}" (${climbing * 10} ft/turn)`;
  climbingEl.title = `Climbing speed (1/2 current movement)\nMay require ability checks`;
  
  swimmingEl.value = swimmingNote;
  if (wearingArmor) {
    swimmingEl.title = `Swimming impossible while wearing armor\nRemove armor to swim at 1/3 current movement`;
    swimmingEl.style.color = "#ff5252";
  } else {
    swimmingEl.title = `Swimming speed (1/3 current movement)\nUnarmored only`;
    swimmingEl.style.color = "inherit";
  }
  
  // Color coding for current movement and derived speeds
  let movementColor;
  if (movementMultiplier >= 1.0) {
    movementColor = "var(--accent-light)";
  } else if (movementMultiplier >= 0.5) {
    movementColor = "var(--text)";
  } else if (movementMultiplier > 0) {
    movementColor = "#ff9800";
  } else {
    movementColor = "#ff5252";
  }
  
  currentMovementEl.style.color = movementColor;
  runningEl.style.color = movementColor;
  climbingEl.style.color = movementColor;
  
  // Swimming color was already set above (don't override it)
  // It stays red for armored, or inherits movementColor for unarmored
  if (!wearingArmor) {
    swimmingEl.style.color = movementColor;
  }
}