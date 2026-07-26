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

 // Spell Immunity — PHB Table 5. Keys off the WIS score ALONE, no class gate.
  // A WIS 19 fighter is just as immune to charm person as a WIS 19 cleric.
  if (wis >= 19) {
    immunityEl.value = WIS_IMMUNITIES[wis] || "—";
  } else {
    immunityEl.value = "—";
  }

  // Bonus spells and spell failure are PRIEST CLASSES ONLY (clerics + druids).
  // Paladins and rangers cast priest spells but are warriors — per PHB they get
  // no WIS bonus spells and are not subject to WIS spell failure.
  const isPriest = clazz.includes("cleric") || clazz.includes("druid");

  if (!isPriest) {
    failureEl.value = "";
    bonusSpellsEl.value = "";
    return;
  }

  // Spell failure — PHB Table 5: 80% at WIS 1 sliding to 5% at WIS 12, 0% at 13+.
  failureEl.value = (wis <= 12 ? (WIS_FAILURE[wis] || "—") : "0%");
  
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

  const adj = WIS_MDA[wis] || 0;

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

// Hit Dice: derived from class and level, unless the player has typed an
// override. The override wins whenever it is non-blank; clearing it returns
// the field to the derived value.
function renderHitDice(root) {
  const el = root.querySelector('[data-field="hit_dice"]');
  if (!el) return;

  const override = (val(root, 'hit_dice_manual') || '').trim();
  const derived  = (typeof getHitDice === 'function') ? getHitDice(root) : '';

  if (override) {
    el.value = override;
    el.style.color = 'var(--warning, #e0a34a)';
  } else {
    el.value = derived;
    el.style.color = '';
  }

  // PHB Table 3 footnotes ** / *** / ****: at very high Constitution every Hit
  // Die roll has a floor. Shown as a visible note rather than a tooltip because
  // it changes dice outcomes at the table and a tooltip is easy to miss.
  // Keyed to CURRENT Constitution -- Table 3 says to always use the current
  // score for hit point bonuses and penalties. con_initial is only for revivals.
  const noteEl = root.querySelector('.hit-dice-note');
  if (!noteEl) return;

  const con   = parseInt(val(root, 'con') || 0, 10);
  const floor = (typeof getMinHitDieRoll === 'function') ? getMinHitDieRoll(con) : 0;

  if (!floor) {
    noteEl.style.display = 'none';
    noteEl.textContent = '';
    return;
  }

  let msg = 'Constitution ' + con + ': every Hit Die you roll counts a result below '
          + floor + ' as ' + floor + ' (PHB Table 3). The floor applies per die, and '
          + 'not to the flat hit points gained once your class stops rolling Hit Dice.';

  // If exactly one die size is in play, say what the floor actually does to it.
  // Multi-class values list several dice, so the concrete note is skipped there
  // rather than guessing which die it refers to.
  const dice = (el.value || '').match(/d(\d+)/g) || [];
  if (dice.length === 1) {
    const sides = parseInt(dice[0].slice(1), 10);
    if (floor >= sides) {
      msg += ' Your d' + sides + ' can no longer roll below ' + sides
           + ' -- every Hit Die is automatically maximum.';
    }
  }

  noteEl.textContent = msg;
  noteEl.style.color = 'var(--info, #6fb3d2)';
  noteEl.style.display = '';
}

// Revivals remaining. PHB p.21: a character's STARTING Constitution is the
// absolute limit on how many times he may be raised or resurrected. Magic that
// restores lost Constitution does not restore revivals, which is why this
// counts against con_initial and never against the current con field.
function renderRevivals(root) {
  const el     = root.querySelector('[data-field="revivals_remaining"]');
  const noteEl = root.querySelector('.revival-status');
  if (!el) return;

  const startCon = parseInt(val(root, 'con_initial') || 0, 10);
  let   deaths   = parseInt(val(root, 'deaths_to_date') || 0, 10);
  if (isNaN(deaths) || deaths < 0) deaths = 0;

  const hide = () => { if (noteEl) { noteEl.style.display = 'none'; noteEl.textContent = ''; } };
  const show = (text, color) => {
    if (!noteEl) return;
    noteEl.textContent = text;
    noteEl.style.color = color;
    noteEl.style.display = '';
  };

  if (!startCon || startCon < 1) {
    el.value = '';
    el.style.color = '';
    if (deaths > 0) {
      show('Set Starting CON to track how many revivals remain.', 'var(--muted)');
    } else {
      hide();
    }
    return;
  }

  const left = startCon - deaths;
  el.value = left + ' of ' + startCon;

  if (left <= 0) {
    el.style.color = 'var(--error, #ff6b6b)';
    show('Revivals exhausted. Nothing short of divine intervention can bring this character back (PHB p.21).',
         'var(--error, #ff6b6b)');
  } else if (left === 1) {
    el.style.color = 'var(--warning, #e0a34a)';
    show('One revival left. A failed resurrection survival roll is permanent regardless.',
         'var(--warning, #e0a34a)');
  } else {
    el.style.color = '';
    hide();
  }
}

// Resolve a weapon row's proficiency status and paint its badge.
// Returns { status, penalty } so the caller can apply the penalty to to-hit.
function resolveWeaponProficiency(root, rowEl) {
  const nameEl   = rowEl.querySelector('.title');
  const typeEl   = rowEl.querySelector('.weapon-wtype');
  const statusEl = rowEl.querySelector('.weapon-prof-status');
  const badgeEl  = rowEl.querySelector('.weapon-prof-badge');

  const weaponName = nameEl ? nameEl.value : '';

  // THE ANCHOR RULE: the row's stored type key is the source of truth for what
  // this weapon IS, so it is consulted FIRST. That inversion is the whole point
  // -- a flavour name now resolves to the Sword group instead of nothing at
  // all. The name is only read when no type has been set, i.e. legacy rows.
  //
  // Proficiency records carry type keys too now, so a key match on BOTH sides
  // means the same specific weapon and reads as fully proficient. That is what
  // lets a renamed weapon be recognised at all; matching on names never could.
  // Group stays as the fallback wherever either side has no type set.
  const typeVal = typeEl ? typeEl.value : '';

  // Pass a REAL key only. A pre-migration row still holds a coarse group here
  // ("Sword"), which is not a WEAPON_TYPES key and must never be compared
  // against one -- the two vocabularies look alike and are not interchangeable.
  const weaponTypeKey = (typeof getWeaponTypeData === 'function' && getWeaponTypeData(typeVal))
    ? typeVal : '';

  let weaponGroup = (typeof getWeaponGroup === 'function') ? getWeaponGroup(typeVal, '') : '';
  if (!weaponGroup) {
    const match = (typeof lookupWeaponData === 'function') ? lookupWeaponData(weaponName) : null;
    weaponGroup = match ? (match.Group || '') : typeVal;
  }

  // An empty row is not "Not Proficient" -- it is not a weapon yet. Now that
  // every row gets a badge painted rather than only the equipped ones, blank
  // placeholder rows would otherwise be accused of a penalty they cannot
  // incur. Clear the badge and return neutral.
  if (!String(weaponName).trim() && !typeVal) {
    if (badgeEl) { badgeEl.innerHTML = ''; badgeEl.title = ''; }
    rowEl.style.borderLeft = '';
    rowEl.style.paddingLeft = '';
    return { status: 'proficient', penalty: 0 };
  }

  const override = statusEl ? (statusEl.value || 'auto') : 'auto';

  const status = (override === 'auto')
    ? getWeaponProficiencyStatus(weaponName, weaponGroup, root._weaponProfs, weaponTypeKey)
    : override;

  const fullPenalty = getNonProfPenalty(root);
  const penalty     = getWeaponAttackPenalty(status, fullPenalty);

  // Specialization supersedes the Proficient badge -- you cannot specialize
  // without being proficient first, so the two can never both apply and showing
  // the lesser one wastes the space.
  const spec = (typeof getWeaponSpecialization === 'function')
    ? getWeaponSpecialization(root, rowEl) : null;
  const isSpecialized = !!(spec && spec.specialized) && status === 'proficient';

  // Status colour, reused for the badge AND the card's left edge so a glance
  // down the list reads as a column of statuses.
  // Related stays MUTED rather than amber: --accent-light is #e3c48f and amber
  // is #e0a34a, near-identical in hue, so a 3px amber stripe would read as
  // "Proficient" at a glance -- and identically so to anyone with a red-green
  // deficiency. Grey is also the honest signal: a half penalty is a downgrade,
  // not a warning, and amber is worth reserving for real problems.
  const statusColor = isSpecialized           ? 'var(--info, #6fb3d2)'
                    : status === 'proficient' ? 'var(--accent-light)'
                    : status === 'related'    ? 'var(--muted)'
                    : 'var(--error, #ff6b6b)';
  rowEl.style.borderLeft = '3px solid ' + statusColor;
  rowEl.style.paddingLeft = '8px';

  if (badgeEl) {
    let text, color, tip;
    if (isSpecialized) {
      text  = 'Specialized';
      color = statusColor;
      tip   = 'Specialized (PHB Ch.5): +1 to hit and +2 damage with a melee weapon, ' +
              'or a point-blank range category with a bow or crossbow.\n' +
              'Proficiency is a prerequisite, so this replaces the Proficient badge.';
    } else if (status === 'proficient') {
      text  = 'Proficient';
      color = 'var(--accent-light)';
      tip   = 'No attack penalty.';
    } else if (status === 'related') {
      text  = 'Related (' + penalty + ')';
      color = statusColor;
      tip   = 'A related weapon costs HALF the normal non-proficiency penalty,\n' +
              'rounded up (PHB "Related Weapons Bonus"). Full penalty would be ' + fullPenalty + '.';
    } else {
      text  = 'Not Prof. (' + penalty + ')';
      color = statusColor;
      tip   = 'Non-proficiency attack penalty (PHB Table 34).\n' +
              'Warrior -2, Wizard -5, Priest -3, Rogue -3.';
    }
    // The separator is built WITH the status rather than sitting in the
    // template, so a blank row leaves no dangling pipe beside the label.
    badgeEl.innerHTML = '<span style="opacity:0.5;">&nbsp;|&nbsp;</span>' +
                        '<span style="color:' + color + ';">' + text + '</span>';
    badgeEl.title = tip;
  }

  return { status, penalty };
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
  
  // PHB Ch.9: Dexterity does NOT modify initiative in 2e. Low roll wins.
  const initiativeStr = 'd10 (low wins)';
  
  // Calculate STR bonuses — shared helper handles exceptional 18/xx (warriors only)
  let strToHit = 0;
  let strDamage = 0;
  const strData = getStrengthData(str, strExceptional, clazz);
  if (strData) {
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
  
  // Specialist save modifier (PHB Ch.3 / Table 22). Specialist wizards save at
  // +1 vs. spells of their own school cast by other wizards, and their targets
  // save at -1 vs. the specialist's own-school spells. Shown for specialists only.
  const specSavesEl = root.querySelector('.combat-specialist-saves');
  if (specSavesEl) {
    const specSchool = (typeof getSpecialistSchool === 'function') ? getSpecialistSchool(clazz) : null;
    if (specSchool) {
      const specKey = (typeof SPECIALIST_WIZARDS !== 'undefined')
        ? Object.keys(SPECIALIST_WIZARDS).find(k => (clazz || '').toLowerCase().includes(k))
        : null;
      const specName = specKey ? specKey.charAt(0).toUpperCase() + specKey.slice(1) : 'Specialist';
      specSavesEl.innerHTML =
        '<strong style="color:var(--accent-light);">' + specName + ':</strong> ' +
        '+1 to your saves vs. ' + specSchool + ' spells cast by other wizards; ' +
        'targets save at \u22121 vs. your ' + specSchool + ' spells.';
      specSavesEl.style.display = '';
    } else {
      specSavesEl.innerHTML = '';
      specSavesEl.style.display = 'none';
    }
  }

  // Get equipped weapons
  const weaponsList = root.querySelector('.combat-weapons-list');
  if (!weaponsList) return;
  
  const equippedWeapons = [];
  qsa(root, '.weapons-list .item').forEach(el => {
    // Paint EVERY row's proficiency badge, equipped or not. This call renders
    // the badge as a SIDE EFFECT, and it used to sit inside the equipped branch
    // below -- so an unequipped weapon never got a badge at all, and unequipping
    // one left the last badge painted and stranded until the character was
    // reloaded. The quick-reference list further down still collects only
    // equipped weapons; this just makes sure every card tells the truth.
    const prof = resolveWeaponProficiency(root, el);

    const equipped = el.querySelector('.equipped');
    if (equipped && equipped.checked) {
      const catEl  = el.querySelector('.weapon-category');
      const typeEl = el.querySelector('.weapon-wtype');
      const strEl  = el.querySelector('.weapon-str-bonus');

      const category = catEl  ? catEl.value  : '';
      // wtype holds the GRANULAR key; wGroup is the COARSE group derived from
      // it, and the group is what getDefaultWeaponStrMode reasons about. Passing
      // the value as its own fallback keeps pre-migration rows working.
      const wtype    = typeEl ? typeEl.value : '';
      const wGroup   = (typeof getWeaponGroup === 'function')
        ? getWeaponGroup(wtype, wtype) : wtype;

      const hitAdjEl = el.querySelector('.weapon-hit-adj');
      const dmgAdjEl = el.querySelector('.weapon-dmg-adj');
      const atkEl    = el.querySelector('.weapon-attacks');

      equippedWeapons.push({
        name: el.querySelector('.title').value || 'Unnamed Weapon',
        damageSM: el.querySelector('.damage-sm').value || '1d6',
        damageL: el.querySelector('.damage-l').value || '1d6',
        magicBonus: parseInt(el.querySelector('.magic-bonus').value || 0, 10),
        // Passed through as raw strings, not numbers -- "" means inherit from
        // magicBonus and "0" means an explicit zero, and Number("") is 0, which
        // would collapse the two.
        hitAdj: hitAdjEl ? hitAdjEl.value : '',
        dmgAdj: dmgAdjEl ? dmgAdjEl.value : '',
        attacks: atkEl ? atkEl.value : '',
        // Resolved from the weapon's TYPE against the proficiency list, so a
        // flavour-named weapon still matches the proficiency it really is.
        specialized: (typeof getWeaponSpecialization === 'function')
          ? !!(getWeaponSpecialization(root, el) || {}).specialized
          : false,
        specLevel: parseInt(val(root, 'level') || 0, 10),
        category: category,
        weaponTypeKey: wtype,
        wtype: wGroup,
        strMode: (strEl && strEl.value) || getDefaultWeaponStrMode(category, wGroup),
        profStatus: prof.status,
        profPenalty: prof.penalty,
        effSpeed: getEffectiveWeaponSpeed(
          (el.querySelector('.speed') || {}).value,
          (el.querySelector('.magic-bonus') || {}).value
        )
      });
    }
  });

  // Render equipped weapons
  if (equippedWeapons.length === 0) {
    weaponsList.innerHTML = '<div style="color:var(--muted);font-style:italic;">No weapons equipped</div>';
  } else {
    const sign = n => (n >= 0 ? '+' : '') + n;
    const dmgSign = n => (n > 0 ? '+' + n : n < 0 ? String(n) : '');

    let html = '';
    equippedWeapons.forEach(weapon => {
      // magicBonus is the ENCHANTMENT LEVEL -- it drives the speed-factor
      // reduction and what the weapon can strike. It is also the default for
      // both adjustments, which is correct for an ordinary +N weapon.
      //
      // hitAdj / dmgAdj override it when the enchantment is not uniform: a +5
      // weapon granting only +1 to hit and nothing to damage takes magicBonus 5,
      // hitAdj 1, dmgAdj 0. Blank means inherit; "0" is a real override, hence
      // the explicit empty-string test rather than a falsy one.
      const enchant = weapon.magicBonus || 0;
      let hitBase = (weapon.hitAdj !== '' && weapon.hitAdj !== undefined && weapon.hitAdj !== null)
        ? (parseInt(weapon.hitAdj, 10) || 0)
        : enchant;
      let dmgBase = (weapon.dmgAdj !== '' && weapon.dmgAdj !== undefined && weapon.dmgAdj !== null)
        ? (parseInt(weapon.dmgAdj, 10) || 0)
        : enchant;

      // Weapon specialization (PHB Ch.5). Melee specialists gain +1 to hit and
      // +2 damage ON TOP of Strength and magic. Bow and crossbow specialists
      // gain no flat bonus -- they get a point-blank range category instead.
      // These bonuses are NOT magical and do not let the weapon strike a
      // creature that can only be injured by magical weapons.
      let specBonus = null;
      let specRate = null;
      if (weapon.specialized && typeof getSpecialistCombatBonuses === 'function') {
        specBonus = getSpecialistCombatBonuses(
          weapon.weaponTypeKey, weapon.category, weapon.wtype);
        hitBase += specBonus.hit;
        dmgBase += specBonus.damage;
        // Table 35 replaces the Table 15 rate for the specialized weapon only.
        // Returns null for bows, which gain no extra attacks.
        if (typeof getSpecialistAttackRate === 'function') {
          specRate = getSpecialistAttackRate(
            weapon.specLevel, weapon.weaponTypeKey, weapon.category, weapon.wtype);
        }
      }

      // The character's Table 15 melee base, used when nothing more specific
      // applies. Missile weapons have their own rates of fire (Table 45) which
      // the app does not model, so this is a floor rather than an authority.
      const baseRate = (typeof getBaseAttacksPerRound === 'function')
        ? getBaseAttacksPerRound(root).rate : '1';
      const cat = (weapon.category || '').toLowerCase();
      // PHB Table 34: attack penalty for wielding a weapon you are not
      // proficient with. Related weapons cost half, rounded up.
      const profPen = weapon.profPenalty || 0;

      // How Strength applies to THIS weapon (PHB). Hurled weapons get the full
      // Strength row; ordinary bows are capped at plain 18; crossbows, slings
      // and other mechanical devices get nothing.
      const adj = getWeaponStrAdjustments(
        strData, weapon.strMode, str, strExceptional, clazz
      );

      // Which lines are meaningful for this weapon.
      const showMelee   = !cat || cat === 'melee' || cat === 'melee/thrown';
      const showThrown  = cat === 'thrown' || cat === 'melee/thrown';
      const showMissile = !cat || cat === 'ranged';

      html += '<div style="margin-bottom:6px;padding:4px;background:rgba(255,255,255,0.03);border-radius:4px;">';
      html += '<div style="font-weight:600;color:var(--accent-light);">• ' + weapon.name;
      if (weapon.category) {
        html += ' <span style="font-size:10px;color:var(--muted);font-weight:400;">' + weapon.category + '</span>';
      }
      if (weapon.profStatus === 'related') {
        html += ' <span style="font-size:10px;color:var(--muted);font-weight:400;">· Related ' + profPen + '</span>';
      } else if (weapon.profStatus === 'none' && profPen) {
        html += ' <span style="font-size:10px;color:var(--error, #ff6b6b);font-weight:400;">· Not Proficient ' + profPen + '</span>';
      }
      if (weapon.effSpeed !== null && weapon.effSpeed !== undefined &&
          (typeof isOptionalRule !== 'function' || isOptionalRule('weaponSpeedInitiative'))) {
        html += ' <span style="font-size:10px;color:var(--muted);font-weight:400;" title="Weapon speed factor -- ADD this to your initiative roll (PHB Table 56).&#10;Magical bonuses reduce speed factor by 1 per plus (min 0).">· Spd ' + weapon.effSpeed + '</span>';
      }
      html += '</div>';
      html += '<div style="margin-left:10px;color:var(--text);">';

      if (showMelee) {
        const toHit = adj.toHit + hitBase + profPen;
        const dmg   = adj.damage + dmgBase;
        html += 'Melee: d20' + sign(toHit) + ' → ' + weapon.damageSM + dmgSign(dmg) +
                ' / ' + weapon.damageL + dmgSign(dmg) + '<br>';
      }

      if (showThrown) {
        // PHB: "Attack roll and damage modifiers for Strength are always used
        // when an attack is made with a hurled weapon." DEX missile adjustment
        // applies too -- they stack.
        const toHit = dexMissile + adj.toHit + hitBase + profPen;
        const dmg   = adj.damage + dmgBase;
        html += 'Thrown: d20' + sign(toHit) + ' → ' + weapon.damageSM + dmgSign(dmg) +
                ' / ' + weapon.damageL + dmgSign(dmg) + '<br>';
      }

      if (showMissile) {
        // adj is {0,0} for crossbows/slings, and the plain-18 row for an
        // ordinary bow, so this one expression covers every ranged case.
        const toHit = dexMissile + adj.toHit + hitBase + profPen;
        const dmg   = adj.damage + dmgBase;
        html += 'Missile: d20' + sign(toHit) + ' → ' + weapon.damageSM + dmgSign(dmg) +
                ' / ' + weapon.damageL + dmgSign(dmg) + '<br>';
      }

      // Attacks per round for this weapon. An explicit dropdown selection wins;
      // otherwise Table 35 for the specialized weapon, falling back to the
      // character's Table 15 base.
      const rateSrc = weapon.attacks ? 'set on the weapon card'
                    : (specRate ? 'PHB Table 35, specialist' : 'PHB Table 15');
      const rate = weapon.attacks || specRate || baseRate;
      if (rate) {
        html += '<span title="' + rateSrc + '">Attacks: ' + rate + '/round</span><br>';
      }

      if (specBonus && specBonus.pointBlank) {
        html += '<span style="color:var(--info, #6fb3d2);" ' +
                'title="Point-blank range is granted to bow and crossbow specialists only. ' +
                'No extra damage. With the weapon already nocked or cocked and the target in ' +
                'sight, you may fire at the start of the round before initiative is rolled.">' +
                'Point blank ' + specBonus.pointBlank + ': +2 to hit</span><br>';
      } else if (weapon.specialized && specBonus && specBonus.hit) {
        html += '<span style="color:var(--info, #6fb3d2);" ' +
                'title="Specialization bonuses are not magical and do not let this weapon ' +
                'harm a creature that can only be injured by magical weapons.">' +
                'Specialized: +1 hit, +2 damage (included above)</span><br>';
      }

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
  // PHB Ch.3: specialist wizards use the MAGE spell progression and XP table.
  // SPELL_SLOTS_TABLES has no illusionist/necromancer/etc. keys -- they all
  // resolve to mage.
  else if (clazz.includes("mage") || clazz.includes("wizard") ||
           clazz.includes("illusionist") || clazz.includes("abjurer") ||
           clazz.includes("conjurer") || clazz.includes("enchanter") ||
           clazz.includes("invoker") || clazz.includes("necromancer") ||
           clazz.includes("transmuter") || clazz.includes("diviner") ||
           clazz.includes("evoker")) table = SPELL_SLOTS_TABLES.mage;
  else if (clazz.includes("hb_dpaladin")) table = SPELL_SLOTS_TABLES.hb_dpaladin;
  else if (clazz.includes("demipaladin")) table = SPELL_SLOTS_TABLES.demipaladin;
  else if (clazz.includes("paladin")) table = SPELL_SLOTS_TABLES.paladin;
  else if (clazz.includes("ranger")) table = SPELL_SLOTS_TABLES.ranger;
  else if (clazz.includes("bard")) table = SPELL_SLOTS_TABLES.bard;

  if (!table) return;

  let baseSlots = table[level] ? [...table[level]] : Array(9).fill(0);

  // Specialist wizards get +1 slot per castable spell level (PHB Ch.3). This
  // path RESETS the slot fields for non-priests, so it must apply the same
  // bonus app.js does -- otherwise it silently wipes it.
  const spec = applySpecialistBonus(baseSlots, clazz);
  baseSlots = spec.slots;

  // Scan all spell slot fields
  root.querySelectorAll('[data-field^="slots"]').forEach((el, i) => {
    if (!isPriest) {
      // Reset value to base table (no Wis bonuses for non-priests)
      el.value = baseSlots[i] || "";
      if (spec.school && baseSlots[i] > 0) {
        el.title = `Includes +1 specialist slot -- must be a ${spec.school} spell`;
      } else {
        el.removeAttribute("title");
      }
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
  
  // Arcane casters use INT for spells: wizards, all 8 specialists, and bards.
  // Per PHB (Bard, Ch.3), a bard's Intelligence determines both how many wizard
  // spells he can know and his chance to learn any given one -- an INT check is
  // required to learn each spell -- so bards get the Chance to Learn Spell % and
  // the Max Spells per Level cap, same as a wizard.
  const isWizard = isWizardClass(clazz);
  
  if (intData) {
    // [# languages, learn spell %, max spells/level, spell immunity]
    const [languages, learnSpell, maxSpells, immunity] = intData;
    
    languagesEl.value = languages;

    // PHB Table 4 footnote: "* While unable to speak a language, the character
    // can communicate with grunts and gestures."
    if (int === 1) {
      languagesEl.title =
        "Intelligence 1: no languages.\n\n" +
        "While unable to speak a language, the character can communicate " +
        "with grunts and gestures. (PHB Table 4)";
      languagesEl.style.color = 'var(--muted)';
    } else {
      languagesEl.title = "Languages the character may learn IN ADDITION to " +
                          "his native tongue (PHB Table 4). The native language " +
                          "is always free and never counts against this.";
      languagesEl.style.color = '';
    }

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

// Resolve which sub-class is the rogue. PHB Ch.3 permits only one class per
// group, so no legal character has two rogue-group classes and first-match is
// safe. Dual-class checks the NEW class first -- that is the one being actively
// advanced, matching getWizardComponent's behaviour.
// The predicate mirrors renderThiefSkillsSection's (app.js) so the panel's
// visibility and its numbers can never disagree.
function getRogueComponent(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const isRogue = (c) => {
    const s = (c || '').toLowerCase();
    return !!s && (s.includes('thief') || s.includes('bard') ||
                   s.includes('rogue') || s.includes('assassin'));
  };

  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = val(root, 'mc_class' + i) || '';
      if (isRogue(c)) return { clazz: c, level: parseInt(val(root, 'mc_level' + i) || 0, 10) };
    }
    return null;
  }

  if (charType === 'dual') {
    const nw = { clazz: val(root, 'dc_new_class') || '',
                 level: parseInt(val(root, 'dc_new_level') || 0, 10) };
    const og = { clazz: val(root, 'dc_original_class') || '',
                 level: parseInt(val(root, 'dc_original_level') || 0, 10) };
    if (isRogue(nw.clazz)) return nw;
    if (isRogue(og.clazz)) {
      og.dormant = nw.level <= og.level;   // former class, new one has not passed it yet
      return og;
    }
    return null;
  }

  const clazz = val(root, 'clazz') || '';
  if (isRogue(clazz)) return { clazz: clazz, level: parseInt(val(root, 'level') || 0, 10) };
  return null;
}

function renderThiefSkills(root) {
  const race = (val(root, "race") || "").trim().toLowerCase();
  const dex = parseInt(val(root, "dex") || 9, 10);

  // Read the rogue component rather than clazz/level directly -- those are empty
  // for a multi-class fighter/thief, which is why the panel rendered blank.
  const rogue = (typeof getRogueComponent === 'function') ? getRogueComponent(root) : null;
  const clazz = rogue ? (rogue.clazz || '').trim().toLowerCase() : '';
  const level = rogue ? rogue.level : 0;

  const isThief = clazz.includes("thief") || clazz.includes("rogue") || clazz.includes("assassin");
  const isBard = clazz.includes("bard");

  // Dual-class dormancy advisory. The PHB penalty for falling back on a former
  // class is losing that adventure's experience, not being unable -- so the
  // skills stay visible and this only warns.
  const dormantEl = root.querySelector('.thief-dormant-note');
  if (dormantEl) {
    if (rogue && rogue.dormant) {
      const escD = s => String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      dormantEl.innerHTML =
        '<strong style="color:var(--warning, #e0a34a);">\u26A0 Dormant class</strong>' +
        '<div style="margin-top:4px;">Your ' + escD(rogue.clazz) + ' levels are dormant until ' +
        'your new class passes level ' + escD(String(rogue.level)) + '. These skills are shown ' +
        'for reference \u2014 using a former class\u2019s abilities costs you the experience for ' +
        'that adventure, so check with your DM before relying on them.</div>';
      dormantEl.style.display = '';
    } else {
      dormantEl.style.display = 'none';
      dormantEl.innerHTML = '';
    }
  }

  if ((!isThief && !isBard) || !level) {
    // Not a rogue, or no level recorded -- clear all fields and the armor note
    val(root, 'thief_pickpockets', '');
    val(root, 'thief_openlocks', '');
    val(root, 'thief_traps', '');
    val(root, 'thief_movesilently', '');
    val(root, 'thief_hide', '');
    val(root, 'thief_detectnoise', '');
    val(root, 'thief_climb', '');
    val(root, 'thief_readlang', '');
    const armorNoteEl0 = root.querySelector('.thief-armor-note');
    if (armorNoteEl0) { armorNoteEl0.style.display = 'none'; armorNoteEl0.innerHTML = ''; }
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

  // Get armor adjustments (PHB Table 29). Applies to all eight skills.
  let armorAdj = [0, 0, 0, 0, 0, 0, 0, 0];
  let armorInfo = { key: 'leather', name: 'Leather', illegal: false };
  if (typeof getThiefArmorAdjustments === 'function') {
    armorInfo = getThiefArmorAdjustments(root, isBard);
    armorAdj = armorInfo.adj;
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
  // PHB Ch.3: "no skill can be raised above 95 percent, including all
  // adjustments for Dexterity, race, and armor." The old ceiling here was 99.
  const cap = (typeof THIEF_SKILL_MAX !== 'undefined') ? THIEF_SKILL_MAX : 95;
  const pickpockets = Math.max(0, Math.min(cap, baseSkills[0] + racialAdj[0] + dexAdj[0] + armorAdj[0] + pointsPP));
  const openlocks = isBard ? '' : Math.max(0, Math.min(cap, baseSkills[1] + racialAdj[1] + dexAdj[1] + armorAdj[1] + pointsOL));
  const traps = isBard ? '' : Math.max(0, Math.min(cap, baseSkills[2] + racialAdj[2] + dexAdj[2] + armorAdj[2] + pointsTR));
  const movesilently = isBard ? '' : Math.max(0, Math.min(cap, baseSkills[3] + racialAdj[3] + dexAdj[3] + armorAdj[3] + pointsMS));
  const hide = isBard ? '' : Math.max(0, Math.min(cap, baseSkills[4] + racialAdj[4] + dexAdj[4] + armorAdj[4] + pointsHI));
  const detectnoise = Math.max(0, Math.min(cap, baseSkills[5] + racialAdj[5] + armorAdj[5] + pointsDN));
  const climb = Math.max(0, Math.min(cap, baseSkills[6] + racialAdj[6] + armorAdj[6] + pointsCW));
  const readlang = Math.max(0, Math.min(cap, baseSkills[7] + racialAdj[7] + armorAdj[7] + pointsRL));
  
  // PHB Ch.3: a MULTI-CLASSED thief in armor not normally allowed to thieves
  // loses every thieving ability except open locks and detect noise -- and even
  // those need his gauntlets and helmet off. This is a separate rule from the
  // Table 29 percentages a single-class thief takes, and it removes the ability
  // outright rather than penalising it.
  const mcPenalty = (typeof getMultiClassThiefArmorPenalty === 'function')
    ? getMultiClassThiefArmorPenalty(root)
    : { active: false, disabled: [], armorName: '', gauntlets: false, helmet: false };

  // An em dash, not 0%: the ability is not possible, not merely certain to fail.
  const DASH = '\u2014';
  const gate = (i, v) => (mcPenalty.active && mcPenalty.disabled.indexOf(i) !== -1) ? DASH : v;

  // Set values
  val(root, 'thief_pickpockets', gate(0, pickpockets));
  val(root, 'thief_openlocks',   gate(1, openlocks));
  val(root, 'thief_traps',       gate(2, traps));
  val(root, 'thief_movesilently',gate(3, movesilently));
  val(root, 'thief_hide',        gate(4, hide));
  val(root, 'thief_detectnoise', gate(5, detectnoise));
  val(root, 'thief_climb',       gate(6, climb));
  val(root, 'thief_readlang',    gate(7, readlang));
  
  // Tooltip breakdown, built in one loop rather than eight near-identical blocks.
  // DEX (Table 28) applies only to the first five skills; armor (Table 29)
  // applies to all eight, though Read Languages is "--" in every column.
  const SKILL_FIELDS = [
    'thief_pickpockets', 'thief_openlocks', 'thief_traps', 'thief_movesilently',
    'thief_hide', 'thief_detectnoise', 'thief_climb', 'thief_readlang'
  ];
  const skillPoints = [pointsPP, pointsOL, pointsTR, pointsMS, pointsHI, pointsDN, pointsCW, pointsRL];
  const sgn = v => (v >= 0 ? '+' : '') + v;

  SKILL_FIELDS.forEach((field, i) => {
    const el = root.querySelector('[data-field="' + field + '"]');
    if (!el) return;
    if (isBard && i >= 1 && i <= 4) { el.title = 'Not available to bards'; return; }
    if (mcPenalty.active && mcPenalty.disabled.indexOf(i) !== -1) {
      let why = 'Unavailable: a multi-classed thief in ' + mcPenalty.armorName +
                ' loses every thieving ability except open locks and detect noise (PHB Ch.3).';
      if (i === 1 && mcPenalty.gauntlets) why = 'Unavailable: remove your gauntlets to open locks (PHB Ch.3).';
      if (i === 5 && mcPenalty.helmet)    why = 'Unavailable: remove your helmet to detect noise (PHB Ch.3).';
      el.title = why;
      return;
    }
    const parts = ['Base: ' + baseSkills[i], 'Race: ' + sgn(racialAdj[i])];
    if (i < 5) parts.push('DEX: ' + sgn(dexAdj[i]));
    if (armorAdj[i] !== 0) parts.push('Armor (' + armorInfo.name + '): ' + sgn(armorAdj[i]));
    parts.push('Points: +' + skillPoints[i]);
    const total = baseSkills[i] + racialAdj[i] + (i < 5 ? dexAdj[i] : 0) + armorAdj[i] + skillPoints[i];
    if (total > THIEF_SKILL_MAX) parts.push('capped at ' + THIEF_SKILL_MAX + '%');
    el.title = parts.join(', ');
  });

  // Visible armor note (PHB Table 29). Silent when wearing leather, which is the
  // baseline the Table 26 scores already assume and adjusts nothing.
  const armorNoteEl = root.querySelector('.thief-armor-note');
  if (armorNoteEl) {
    if (armorInfo.key === 'leather' && !armorInfo.illegal) {
      armorNoteEl.style.display = 'none';
      armorNoteEl.innerHTML = '';
    } else {
      const labels = ['Pick Pockets','Open Locks','Find/Remove Traps','Move Silently',
                      'Hide in Shadows','Detect Noise','Climb Walls','Read Languages'];
      const shown = armorAdj
        .map((v, i) => (v !== 0 && !(isBard && i >= 1 && i <= 4)) ? labels[i] + ' ' + sgn(v) + '%' : null)
        .filter(Boolean);
      let html = '<strong>Armor: ' + armorInfo.name + '</strong> (PHB Table 29)';
      if (shown.length) html += '<div style="margin-top:4px;">' + shown.join(' &middot; ') + '</div>';
      if (armorInfo.key === 'chain') {
        html += '<div style="margin-top:4px;">Includes the additional \u22125% bards suffer in non-elven chain mail.</div>';
      }
      if (armorInfo.illegal) {
        html += '<div style="margin-top:6px;color:var(--warning, #e0a34a);">This armor is heavier than your class may wear. ' +
                'Table 29 does not cover it, so the worst column is applied \u2014 check with your DM.</div>';
      }
      armorNoteEl.innerHTML = html;
      armorNoteEl.style.color = armorInfo.illegal ? '' : 'var(--muted)';
      armorNoteEl.style.display = '';
    }
  }
}

// Ranger stealth (PHB Table 18). Separate from renderThiefSkills because the
// rules differ: rangers take race and Dexterity adjustments but NOT the thief's
// Table 29 armor percentages, and their armor rule is a binary gate instead.
// Class armor restrictions (PHB Ch.3). Advisory only -- a DM may have granted
// an exception, and the specialist suite's no-blocking philosophy applies.
function renderArmorRestrictions(root) {
  const el = root.querySelector('.armor-restriction-note');
  if (!el) return;

  const problems = (typeof getArmorRestrictionProblems === 'function')
    ? getArmorRestrictionProblems(root) : [];
  if (!problems.length) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }

  // Armor names are free text.
  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  el.innerHTML =
    '<strong style="color:var(--warning, #e0a34a);">\u26A0 Armor restrictions (PHB Ch.3)</strong>' +
    problems.map(p => '<div style="margin-top:4px;">\u2022 ' + esc(p) + '</div>').join('') +
    '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
      'Advisory only \u2014 nothing is blocked. Druid and other class limits can be adjusted ' +
      'under House Rules &amp; Overrides in Settings.</div>';
  el.style.display = '';
}

function renderRangerStealth(root) {
  const section = root.querySelector('.ranger-stealth-display');
  if (!section) return;

  const s = (typeof getRangerStealth === 'function') ? getRangerStealth(root) : null;
  if (!s) { section.style.display = 'none'; return; }
  section.style.display = '';

  // An em dash, not 0%: when armor blocks stealth the attempt is impossible,
  // not merely certain to fail.
  const DASH = '\u2014';
  val(root, 'ranger_hide',             s.blocked ? DASH : s.hide + '%');
  val(root, 'ranger_movesilently',     s.blocked ? DASH : s.move + '%');
  val(root, 'ranger_hide_nonnatural',  s.blocked ? DASH : s.hideNonNatural + '%');
  val(root, 'ranger_move_nonnatural',  s.blocked ? DASH : s.moveNonNatural + '%');

  const sgn = v => (v >= 0 ? '+' : '') + v;
  const setTip = (field, base, racial, dexA, halved) => {
    const el = root.querySelector('[data-field="' + field + '"]');
    if (!el) return;
    if (s.blocked) { el.title = 'Not possible in this armor.'; return; }
    let t = 'Base: ' + base + '% (Table 18, ranger level ' + s.level + '), Race: ' +
            sgn(racial) + ', DEX: ' + sgn(dexA);
    if (halved) t += ', halved for non-natural surroundings';
    el.title = t;
  };
  setTip('ranger_hide',            s.base[0], s.racial[0], s.dex[0], false);
  setTip('ranger_movesilently',    s.base[1], s.racial[1], s.dex[1], false);
  setTip('ranger_hide_nonnatural', s.base[0], s.racial[0], s.dex[0], true);
  setTip('ranger_move_nonnatural', s.base[1], s.racial[1], s.dex[1], true);

  const esc = x => String(x)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const noteEl = section.querySelector('.ranger-stealth-note');
  if (noteEl) {
    if (s.blocked) {
      noteEl.innerHTML =
        '<strong style="color:var(--warning, #e0a34a);">Stealth unavailable in ' +
          esc(s.armorName) + '</strong>' +
        '<div style="margin-top:4px;">Hiding in shadows and moving silently are not possible ' +
        'in armor heavier than studded leather \u2014 it is inflexible and makes too much ' +
        'noise (PHB Ch.3, Ranger).</div>';
      noteEl.style.color = '';
    } else {
      let why = 'Studded leather or lighter, so stealth is available.';
      if (s.armorKey === 'elven_chain') {
        why = 'Elven chain weighs less than studded leather and is described as lighter and ' +
              'quieter, so it does not trip the ranger\u2019s armor restriction.';
      }
      noteEl.innerHTML =
        '<strong>Armor: ' + esc(s.armorName) + '</strong>' +
        '<div style="margin-top:4px;">' + why + ' The upper figures apply in natural ' +
        'surroundings; use the halved ones in a crypt, dungeon or city street.</div>';
      noteEl.style.color = 'var(--muted)';
    }
    noteEl.style.display = '';
  }

  const dormEl = section.querySelector('.ranger-stealth-dormant');
  if (dormEl) {
    if (s.dormant) {
      dormEl.innerHTML =
        '<strong style="color:var(--warning, #e0a34a);">\u26A0 Dormant class</strong>' +
        '<div style="margin-top:4px;">Your ranger levels are dormant until your new class ' +
        'passes level ' + esc(String(s.level)) + '. Shown for reference \u2014 using a former ' +
        'class\u2019s abilities costs you the experience for that adventure.</div>';
      dormEl.style.display = '';
    } else {
      dormEl.style.display = 'none';
      dormEl.innerHTML = '';
    }
  }
}

// Is this weapon the one the character specialized in?
//
// The link is PROFICIENCY NAME -> weapon card TYPE, not the weapon's own name.
// Both draw on the same core_wp.json vocabulary, so a weapon called "Moon
// Hunter" with Type "Short Sword" correctly picks up a Short Sword
// specialization. Matching on the name would fail for every flavour-named or
// magical weapon on the sheet.
//
// Returns { specialized, wtype, category, group, level } or null when the
// character cannot specialize at all.
function getWeaponSpecialization(root, weaponEl) {
  if (typeof isOptionalRule === 'function' && !isOptionalRule('weaponSpecialization')) return null;
  if (typeof canSpecialize !== 'function' || !canSpecialize(root)) return null;

  const level = parseInt(val(root, 'level') || 0, 10);
  if (!level) return null;

  const q = sel => {
    const el = weaponEl && weaponEl.querySelector(sel);
    return el ? (el.value || '').trim() : '';
  };
  const wtype = q('.weapon-wtype');
  if (!wtype) return null;                    // no mechanical identity set

  const category = q('.weapon-category');
  const group = q('.weapon-group');

  // The Type dropdown stores a KEY ("sword_long"); weapon proficiencies are
  // named in the book's style ("Sword, Long"). WEAPON_TYPES carries both, so
  // resolve the key to its wpName rather than comparing the key to a name.
  // The label ("Long Sword") is accepted too, defensively -- nothing should
  // depend on which of the three spellings a record happens to hold.
  const td = (typeof WEAPON_TYPES !== 'undefined') ? WEAPON_TYPES[wtype] : null;
  const norm = s => String(s || '').trim().toLowerCase();
  const names = [td && td.wpName, td && td.label, wtype].filter(Boolean).map(norm);

  const profs = root._weaponProfs || [];
  const specialized = profs.some(p => p && p.specialized && names.indexOf(norm(p.name)) !== -1);

  return { specialized, wtype, category, group, level };
}

// Melee attacks per round (PHB Table 15), derived with manual override -- the
// same pattern as Hit Dice: the readonly field shows the EFFECTIVE value and
// tints amber when an override is in force, and the override field is what the
// player types into.
//
// The Core tab is the home for this. The Combat Quick Ref box in the sidebar
// mirrors the effective value and is made readonly, so there is exactly one
// place to edit it and the two can never disagree.
function renderAttacksPerRound(root) {
  const autoEl = root.querySelector('[data-field="attacks_per_round_auto"]');
  const manEl  = root.querySelector('[data-field="attacks_per_round_manual"]');
  const quickEl = root.querySelector('.combat-attacks-per-round');
  const noteEl = root.querySelector('.attacks-per-round-note');

  const base = (typeof getBaseAttacksPerRound === 'function')
    ? getBaseAttacksPerRound(root) : { rate: '1', isWarrior: false, clazz: '', level: 0 };

  const override = manEl ? (manEl.value || '').trim() : '';
  const effective = override || base.rate;

  if (autoEl) {
    autoEl.value = effective;
    autoEl.style.color = override ? 'var(--warning, #e0a34a)' : '';
  }

  if (quickEl) {
    // Mirror only. Editing lives on the Core tab now.
    quickEl.value = effective;
    quickEl.readOnly = true;
    quickEl.style.color = override ? 'var(--warning, #e0a34a)' : '';
    quickEl.title = 'Melee attacks per round. Edit on the Core tab under Combat.';
  }

  if (!noteEl) return;

  // The note earns its place only when there is something to explain: an
  // override in force, or a warrior who has actually risen above 1 per round.
  if (override) {
    noteEl.innerHTML =
      'Manual override in effect (' + String(override).replace(/[<>&]/g, '') + '). ' +
      'Table 15 would give ' + base.rate + ' for this character. Clear the override to return to it.';
    noteEl.style.color = 'var(--warning, #e0a34a)';
    noteEl.style.display = '';
  } else if (base.isWarrior && base.rate !== '1') {
    noteEl.textContent =
      base.rate + ' melee attacks per round at ' + base.clazz + ' level ' + base.level +
      ' (PHB Table 15). Missile weapons have their own rates of fire and are not affected.';
    noteEl.style.color = 'var(--info, #6fb3d2)';
    noteEl.style.display = '';
  } else {
    noteEl.style.display = 'none';
    noteEl.textContent = '';
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
  
  // PHB Table 47 -- absolute pound thresholds keyed by STR score.
  // getEncumbranceData() handles exceptional 18/xx (warriors only).
  const encStr = parseInt(val(root, "str") || 0, 10);
  const encExceptional = val(root, "str_exceptional") || "";
  const encClazz = val(root, "clazz") || "";
  const encData = getEncumbranceData(encStr, encExceptional, encClazz);
  
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
  
  // Set max carried weight -- PHB Table 47's rightmost column, which is the
  // "severe" ceiling. NOTE: this is NOT the STR weight allowance (that is the
  // *unencumbered* ceiling). For 18/00 those are 480 and 335 respectively.
  const maxCarried = encData ? encData[4] : 0;
  maxCarryEl.value = maxCarried ? maxCarried.toFixed(0) : "";

  // Determine encumbrance category by absolute weight (PHB Table 47)
  let category = "";
  let tooltip = "";

  if (!encData) {
    category = "—";
    tooltip = "Enter STR to calculate";
  } else {
    const [unenc, light, moderate, heavy, severe] = encData;

    if (totalWeight <= unenc) {
      category = "Unencumbered";
    } else if (totalWeight <= light) {
      category = "Light";
    } else if (totalWeight <= moderate) {
      category = "Moderate";
    } else if (totalWeight <= heavy) {
      category = "Heavy";
    } else if (totalWeight <= severe) {
      category = "Severe";
    } else {
      category = "Overloaded!";
    }

    const eff = ENCUMBRANCE_EFFECTS[category] || ENCUMBRANCE_EFFECTS["Overloaded"];
    tooltip =
      `${category} (PHB Table 47)\n` +
      `Unencumbered: 0-${unenc} lbs\n` +
      `Light: ${unenc + 1}-${light} lbs\n` +
      `Moderate: ${light + 1}-${moderate} lbs\n` +
      `Heavy: ${moderate + 1}-${heavy} lbs\n` +
      `Severe: ${heavy + 1}-${severe} lbs\n` +
      `Max carried: ${severe} lbs\n\n` +
      eff.desc;
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
  
  // Determine if character is a spellcaster (shared helpers recognise all 8
  // specialist wizard classes, so specialists never get silently excluded).
  const isPriest = isPriestClass(clazz);
  const isWizard = isWizardClass(clazz);
  
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

    // The core spheres plus any this character's campaign setting unlocks
    // (Dark Sun paraelementals, Spelljammer's Cosmos). Setting spheres are kept
    // out of getAllSpheres() by design, so we append them per character here.
    const settingKey = (root.querySelector('[data-field="campaign_setting"]')?.value) || 'core';
    const extraSpheres = (typeof getSettingSpheres === 'function') ? getSettingSpheres(settingKey) : [];
    const sphereList = getAllSpheres().concat(extraSpheres);

    // Rebuild every render so a setting change adds/removes the setting spheres.
    // Preserve which boxes were checked across the rebuild.
    const previouslyChecked = new Set(
      Array.from(sphereCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.getAttribute('data-sphere'))
    );
    sphereCheckboxes.innerHTML = '';
    sphereList.forEach(sphere => {
      const isSetting = extraSpheres.includes(sphere);
      const label = document.createElement('label');
      label.style.cssText = 'display:flex;align-items:center;font-size:12px;cursor:pointer;';
      label.innerHTML =
        `<input type="checkbox" data-sphere="${sphere}" style="margin-right:6px;width:auto;">` +
        `<span>${sphere}${isSetting ? ' <em style="color:var(--muted);font-style:italic;">(setting)</em>' : ''}</span>`;

      const checkbox = label.querySelector('input');
      if (previouslyChecked.has(sphere)) checkbox.checked = true;
      checkbox.addEventListener('change', () => {
        renderSpellBrowser(root);
        markUnsaved(document.querySelector('.tab.active'), true, root);
      });

      sphereCheckboxes.appendChild(label);
    });
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
  
 const isSpellcaster = isPriestClass(clazz) || isWizardClass(clazz);
  
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
  
  // Apply type filter. The dropdown's option values are coarse GROUP names
  // ("Sword", "Polearm"), so it is matched against Group -- core_wp.json's Type
  // column is a duplicate of Group and is no longer read anywhere.
  if (typeFilter) {
    filteredWeapons = filteredWeapons.filter(weapon => 
      weapon.Group === typeFilter
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
      if (a.Group !== b.Group) return (a.Group || '').localeCompare(b.Group || '');
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
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${weapon.Category || ''} - ${weapon.Group || ''}</span>
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

// Weapons saved before the category field existed have no Category/Type, so
// Strength is applied to them as if they were melee. Backfill from core_wp.json
// by name where we can. Non-destructive: never overwrites a value the player has
// already set, and leaves custom weapons (no match) alone with their defaults.
function backfillWeaponCategories(root) {
  if (typeof WEAPONS_DATA === 'undefined' || !WEAPONS_DATA.length) return 0;

  const rows = root.querySelectorAll('.weapons-list .item');
  let filled = 0;

  rows.forEach(row => {
    const nameEl = row.querySelector('.title');
    const catEl  = row.querySelector('.weapon-category');
    const typeEl = row.querySelector('.weapon-wtype');
    const strEl  = row.querySelector('.weapon-str-bonus');
    if (!nameEl || !catEl || !typeEl) return;

    // Already categorized -- leave it alone.
    if (catEl.value || typeEl.value) return;

    const match = lookupWeaponData(nameEl.value);
    if (!match) return;

    catEl.value  = match.Category || '';
    // The dropdown holds a GRANULAR key now, not the coarse Type. match came
    // from an exact name lookup, so inference on that same name always hits.
    typeEl.value = (typeof inferWeaponTypeKey === 'function')
      ? (inferWeaponTypeKey(match['Weapon Name']) || '')
      : '';

    if (strEl && !strEl.dataset.userSet) {
      strEl.value = getDefaultWeaponStrMode(
        catEl.value,
        (typeof getWeaponGroup === 'function')
          ? getWeaponGroup(typeEl.value, typeEl.value)
          : typeEl.value
      );
    }
    filled++;
  });

  return filled;
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
  
  const wCategory = weapon.Category || '';
  // Group is the only coarse axis. core_wp.json used to carry a Type column
  // that duplicated it byte-for-byte; that column has been deleted, and the
  // granular axis now lives in WEAPON_TYPES in tables.js instead.
  const wGroup    = weapon.Group || '';

  const newWeaponNode = makeWeaponNode({
    name: weapon['Weapon Name'],
    damageSM: weapon['Damage (S-M)'] || '',
    damageL: weapon['Damage (L)'] || '',
    magicBonus: '',
    weight: weightValue,
    speed: weapon['Speed Factor'] || '',
    damageType: '',
    equipped: false,
    // This was the Type and Group interpolated together, which printed the same
    // word twice ("Sword | Sword") because those two columns are duplicates.
    // Both now live in real structured fields, so Notes goes back to being the
    // player's own space.
    notes: '',
    // The name came straight out of core_wp.json, so inference is an exact hit.
    // This is the one place the granular key costs nothing to obtain.
    category: wCategory,
    weaponTypeKey: (typeof inferWeaponTypeKey === 'function')
                     ? (inferWeaponTypeKey(weapon['Weapon Name']) || '')
                     : '',
    wtype:    wGroup,
    strBonus: (typeof getDefaultWeaponStrMode === 'function')
                ? getDefaultWeaponStrMode(wCategory, wGroup)
                : ''
  }, () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
    renderEncumbrance(root);
    renderMovementRate(root);
    // Repaint proficiency badges and status stripes when any field on any
    // weapon row changes -- they are a side effect of renderCombatQuickReference.
    if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);
  });
  
  weaponsList.appendChild(newWeaponNode);
  
  // Mark as unsaved
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) markUnsaved(activeTab, true, root);
  
  // Trigger encumbrance recalculation
  renderEncumbrance(root);
  renderMovementRate(root);
  
  // A browser-added weapon arrives with its name, category and granular type
  // key already set, so it can be judged immediately -- there is no reason to
  // make the player tick Equipped just to find out whether they can use it.
  if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);
  
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
  
  // Determine caster type and max spell level (shared helpers recognise all 8
  // specialist wizard classes).
  const isPriest = isPriestClass(clazz);
  const isWizard = isWizardClass(clazz);
  
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
  
  // Determine max spell level the character can actually cast.
  //
  // Previously this used Math.ceil(level / 2), a homebrew approximation. The
  // real answer is in SPELL_SLOTS_TABLES: the highest spell level for which the
  // character has a slot. And for wizards, PHB Table 4 caps the highest spell
  // level by INTELLIGENCE -- an INT 9 wizard can never cast above 4th level, no
  // matter how high he goes.
  let maxSpellLevel;

  const slotsTable = (typeof SPELL_SLOTS_TABLES !== 'undefined') ? SPELL_SLOTS_TABLES[clazz] : null;
  const slotsAtLevel = slotsTable ? slotsTable[level] : null;

  if (slotsAtLevel) {
    maxSpellLevel = 0;
    for (let i = slotsAtLevel.length - 1; i >= 0; i--) {
      if (slotsAtLevel[i] > 0) { maxSpellLevel = i + 1; break; }
    }
  } else {
    // Class not in the progression table (homebrew, specialist school names, etc.)
    maxSpellLevel = Math.min(Math.ceil(level / 2), isPriest ? 7 : 9);
  }

  // PHB Table 4: Intelligence caps a wizard's highest castable spell level.
  let intCapped = false;
  if (isWizard && typeof INT_TABLE !== 'undefined') {
    const intScore = parseInt(val(root, 'int') || 0, 10);
    const intRow   = INT_TABLE[intScore];
    const intMax   = intRow ? intRow[4] : 0;   // index 4 = max spell level

    if (intMax > 0 && intMax < maxSpellLevel) {
      maxSpellLevel = intMax;
      intCapped = true;
    } else if (intMax === 0) {
      // INT below 9 -- cannot cast wizard spells at all.
      maxSpellLevel = 0;
      intCapped = true;
    }
  }

  // Note (but don't blank the browser) when the character can't cast anything
  // yet -- spells still show for reference; the modal will gate the buttons.
  if (maxSpellLevel === 0) {
    const intScore = parseInt(val(root, 'int') || 0, 10);
    const capNoticeEl0 = root.querySelector('.spell-int-cap-notice');
    if (capNoticeEl0) {
      capNoticeEl0.style.display = 'block';
      capNoticeEl0.textContent =
        (isWizard && intScore < 9
          ? 'Intelligence ' + intScore + ' is too low to cast wizard spells (PHB Table 4 requires 9+). Browse for reference; spells can\u2019t be added.'
          : 'No castable spell levels yet. Browse for reference; spells can\u2019t be added.');
    }
  }
  
  // Surface the max castable level so a player understands why some spells can
  // be browsed but not added.
  const capNoticeEl = root.querySelector('.spell-int-cap-notice');
  if (capNoticeEl && maxSpellLevel > 0) {
    if (intCapped) {
      const intScore = parseInt(val(root, 'int') || 0, 10);
      capNoticeEl.style.display = 'block';
      capNoticeEl.textContent =
        'Intelligence ' + intScore + ' caps you at level ' + maxSpellLevel +
        ' spells (PHB Table 4). Higher-level spells show for reference but can\u2019t be added.';
    } else {
      capNoticeEl.style.display = 'none';
    }
  }

 // Show ALL spell levels in the browser for reference (like having the WSC/PSC
  // open at the table). The max castable level only gates the ACTION BUTTONS in
  // the detail modal, not visibility -- so we filter with no level ceiling here
  // and stash the real cap for showSpellDetails to read.
  root._spellLevelCap = maxSpellLevel;
  // Accessible pool (class + Spell Access schools/spheres). Every browser filter
  // below narrows WITHIN this pool, so the faceted dropdowns are accessible-only.
  const pool = filterSpells({
    spellClass: isPriest ? 'priest' : 'wizard',
    maxLevel: 99,
    spheres: selectedSpheres,
    schools: selectedSchools
  });

  // Read the browser filter controls.
  const catFilter    = root.querySelector('.spell-cat-filter')?.value || '';
  const sourceFilter = root.querySelector('.spell-source-filter')?.value || '';
  const saveFilter   = root.querySelector('.spell-save-filter')?.value || '';
  const catField     = isPriest ? 'sphere' : 'school';

  // Independent predicates (AND when combined). Kept separate so each dropdown's
  // options can be computed by applying every predicate EXCEPT its own (faceting).
  const matchSearch = spell => !searchTerm ||
    spell.name.toLowerCase().includes(searchTerm) ||
    spell.description.toLowerCase().includes(searchTerm);
  const matchLevel = spell => {
    if (!levelFilter) return true;
    const lvl = parseInt(spell.level, 10);
    if (levelFilter === 'special') return isNaN(lvl) || lvl < 1 || lvl > 9;
    return spell.level === parseInt(levelFilter, 10);
  };
  const matchCat = spell => !catFilter ||
    splitClassification(spell[catField]).some(t => t.toLowerCase() === catFilter.toLowerCase());
  const matchSource = spell => !sourceFilter || (spell.source || '') === sourceFilter;
  const matchSave   = spell => !saveFilter || (spell.save || '') === saveFilter;

  // Faceted population: fill a <select> with the distinct values still reachable
  // given the OTHER active filters. Always keep the current selection as an
  // option so an explicit choice is never silently dropped.
  const populateFacet = (selectEl, allLabel, valueSet) => {
    if (!selectEl) return;
    const current = selectEl.value;
    const values = Array.from(valueSet).filter(Boolean);
    if (current && !values.includes(current)) values.push(current);
    values.sort((a, b) => a.localeCompare(b));
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    let html = '<option value="">' + allLabel + '</option>';
    values.forEach(v => { html += '<option value="' + esc(v) + '">' + esc(v) + '</option>'; });
    selectEl.innerHTML = html;
    selectEl.value = current;
  };

  const catValues = new Set();
  pool.forEach(spell => {
    if (matchSearch(spell) && matchLevel(spell) && matchSource(spell) && matchSave(spell)) {
      splitClassification(spell[catField]).forEach(t => catValues.add(t));
    }
  });
  populateFacet(root.querySelector('.spell-cat-filter'),
    isPriest ? 'All Spheres' : 'All Schools', catValues);

  const sourceValues = new Set();
  pool.forEach(spell => {
    if (matchSearch(spell) && matchLevel(spell) && matchCat(spell) && matchSave(spell)) {
      if (spell.source) sourceValues.add(spell.source);
    }
  });
  populateFacet(root.querySelector('.spell-source-filter'), 'All Sources', sourceValues);

  const saveValues = new Set();
  pool.forEach(spell => {
    if (matchSearch(spell) && matchLevel(spell) && matchCat(spell) && matchSource(spell)) {
      if (spell.save) saveValues.add(spell.save);
    }
  });
  populateFacet(root.querySelector('.spell-save-filter'), 'All Saves', saveValues);

  // Final filtered list for display (all predicates ANDed).
  let filteredSpells = pool.filter(spell =>
    matchSearch(spell) && matchLevel(spell) && matchCat(spell) && matchSource(spell) && matchSave(spell));
  
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
  
  // Intelligence language cap (PHB Table 4). The native tongue is NOT counted --
  // Table 4 lists languages the character can learn IN ADDITION to it.
  const int = parseInt(val(root, 'int') || 0, 10);
  const intData = INT_TABLE[int];
  const languageLimit = intData ? intData[0] : 0;

  const counted = (root._languages || []).filter(countsAgainstLanguageCap).length;

  if (counted >= languageLimit) {
    alert(`You cannot learn more languages! Your Intelligence (${int}) allows a maximum of ${languageLimit} language${languageLimit !== 1 ? 's' : ''} beyond your native tongue. You currently know ${counted}.`);
    return;
  }

  // Add the language. PHB: "This knowledge extends only to speaking the
  // language; it does not include reading or writing." So new languages arrive
  // SPEAK-ONLY -- literacy costs a further proficiency slot and must be ticked.
  root._languages.push({
    name: lang.Language,
    rarity: lang.Rarity || 'Unknown',
    languageClass: lang['Language Class'] || '',
    nativeRace: lang['Native Race'] || '',
    rootLanguage: lang['Root Language'] || 'None',
    description: lang.Description || '',
    canSpeak: true,
    canRead: false,
    canWrite: false,
    isNative: false,
    isGranted: false
  });
  
  renderLanguageProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// Ensure the character's native language is present and tagged.
//
// NON-DESTRUCTIVE by design:
//   - never deletes or renames an existing language
//   - never overrides a native tag the player has already set
//   - only ADDS the racial native language if the character has none at all
//     (so a player who deliberately removed it won't have it forced back)
//
// PHB: the native tongue is free -- it costs no proficiency slot and is not
// counted against the Intelligence language cap (Table 4 counts languages
// learned IN ADDITION to it).
function ensureNativeLanguage(root) {
  if (!root._languages) root._languages = [];

  // Player has already nominated a native language -- leave it alone.
  if (root._languages.some(l => l.isNative)) return false;

  const race = val(root, 'race') || '';
  const racial = (typeof getRacialLanguages === 'function') ? getRacialLanguages(race) : null;
  if (!racial || !racial.native) return false;

  // Retro-tag: the language is already in the list, just untagged.
  const existing = root._languages.find(
    l => (l.name || '').toLowerCase() === racial.native.toLowerCase()
  );
  if (existing) {
    existing.isNative = true;
    existing.canSpeak = true;
    return true;
  }

  // Only auto-add when the character has no languages yet (i.e. new character).
  if (root._languages.length > 0) return false;

  const src = (typeof LANGUAGES_DATA !== 'undefined' && LANGUAGES_DATA.length)
    ? LANGUAGES_DATA.find(l => l.Language === racial.native)
    : null;

  root._languages.push({
    name:          racial.native,
    rarity:        src ? (src.Rarity || 'Common') : 'Common',
    languageClass: src ? (src['Language Class'] || '') : '',
    nativeRace:    src ? (src['Native Race'] || '') : '',
    rootLanguage:  src ? (src['Root Language'] || 'None') : 'None',
    description:   src ? (src.Description || '') : '',
    canSpeak:      true,
    canRead:       false,
    canWrite:      false,
    isNative:      true,
    isGranted:     false
  });

  return true;
}

// Render language proficiencies list
function renderLanguageProficiencies(root) {
  const listDiv = root.querySelector('.language-profs-list');
  
  if (!listDiv) return;
  
  const languages = root._languages || [];
  
  // Intelligence language cap (PHB Table 4). The NATIVE tongue is excluded --
  // Table 4 counts languages learned IN ADDITION to it.
  const int = parseInt(val(root, 'int') || 0, 10);
  const intData = INT_TABLE[int];
  const languageLimit = intData ? intData[0] : 0;

  const countedLangs = languages.filter(countsAgainstLanguageCap).length;
  const nativeCount  = languages.filter(l => l.isNative).length;
  const grantedCount = languages.filter(l => l.isGranted && !l.isNative).length;
  const slotsSpent   = getLanguageSlotsSpent(root);

  listDiv.innerHTML = '';

  // Header
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = 'padding:8px;margin-bottom:8px;background:var(--glass);border-radius:4px;font-size:13px;';
  const atLimit = countedLangs >= languageLimit;
  const color = atLimit ? 'var(--error, #ff6b6b)' : 'var(--accent-light)';

  // Report the same information two ways, because they answer different questions:
  // the TOTAL is "how many languages do I speak", the counted figure is "how many
  // more can I learn". The old header showed only the counted figure but labelled
  // it "Languages Known", which under-reported the total by the native tongue.
  const totalKnown     = languages.length;
  const purchasedCount = totalKnown - nativeCount - grantedCount;

  let extras = [];
  if (nativeCount)    extras.push(`${nativeCount} native`);
  if (grantedCount)   extras.push(`${grantedCount} granted`);
  if (purchasedCount) extras.push(`${purchasedCount} purchased`);
  const extraText = extras.length ? ` <span style="color:var(--muted);">(${extras.join(', ')})</span>` : '';

  headerDiv.innerHTML =
    `<strong>Languages Known:</strong> ${totalKnown}${extraText}` +
    `<div style="margin-top:3px;">` +
      `<span style="color:${color}">${countedLangs} / ${languageLimit}</span>` +
      ` <span style="color:var(--muted);">count against your Intelligence limit ` +
      `(the native tongue does not)</span>` +
      ` <span style="color:var(--muted);">&middot; ${slotsSpent} NWP slot${slotsSpent === 1 ? '' : 's'} spent</span>` +
    `</div>`;
  headerDiv.title =
    `Intelligence ${int} allows ${languageLimit} language${languageLimit === 1 ? '' : 's'} beyond your native tongue (PHB Table 4).\n\n` +
    `NATIVE: free -- costs no slot, not counted against the cap.\n` +
    `GRANTED: given by the DM at character creation -- costs no slots, but DOES count against the cap.\n` +
    `Otherwise: 1 slot to speak, +1 slot for literacy (Read and Write are a single purchase).`;
  listDiv.appendChild(headerDiv);

  // The native tongue gets its own spot rather than sitting as just another card.
  // It is categorically different from every other language -- free, one per
  // character, and NOT counted against the Intelligence cap (PHB Table 4 counts
  // languages learned IN ADDITION to it). Showing it only as a list item is what
  // made the "Additional Languages" figure look like a contradiction at low INT.
  const nativeLang = languages.find(l => l.isNative);
  const nativeDiv = document.createElement('div');
  nativeDiv.style.cssText =
    'padding:8px;margin-bottom:8px;background:var(--glass);border-radius:4px;' +
    'font-size:13px;border-left:3px solid var(--accent);';
  if (nativeLang) {
    const escName = String(nativeLang.name || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    nativeDiv.innerHTML =
      '<strong style="color:var(--accent-light);">Native Tongue:</strong> ' + escName +
      ' <span style="color:var(--muted);">&middot; free \u2014 costs no proficiency slot</span>';
  } else {
    nativeDiv.innerHTML =
      '<strong style="color:var(--accent-light);">Native Tongue:</strong> ' +
      '<span style="color:var(--muted);">none set \u2014 use \u201cSet as Native\u201d on a language below</span>';
  }
  listDiv.appendChild(nativeDiv);
  
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

    const cost = getLanguageSlotCost(lang);
    const border = lang.isNative ? 'var(--accent-light)' : 'var(--border)';
    langDiv.style.cssText = `padding:8px;margin-bottom:8px;border:1px solid ${border};border-radius:4px;background:var(--glass);`;

    // Badges
    let badges = '';
    if (lang.isNative) {
      badges += `<span style="margin-left:8px;font-size:10px;padding:1px 6px;border-radius:8px;background:var(--accent-light);color:var(--badge-fg,#000);font-weight:600;"
                       title="Native tongue -- free, and not counted against your Intelligence language cap.">NATIVE</span>`;
    }
    if (lang.isGranted && !lang.isNative) {
      badges += `<span style="margin-left:8px;font-size:10px;padding:1px 6px;border-radius:8px;background:var(--border);color:var(--text);"
                       title="Granted by the DM at character creation -- costs no proficiency slots, but still counts against your Intelligence cap.">GRANTED</span>`;
    }

    const costText = cost === 0
      ? `<span style="color:var(--accent-light);">Free</span>`
      : `${cost} slot${cost === 1 ? '' : 's'}`;

    // "Set as Native" only offered on languages that aren't already native.
    const nativeBtn = lang.isNative
      ? ''
      : `<button class="set-native-language" data-index="${index}" style="padding:4px 8px;font-size:11px;margin-left:8px;"
                 title="Mark this as your native tongue. Free, and not counted against your Intelligence cap.">Set as Native</button>`;

    langDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div style="flex:1;">
          <strong>${lang.name}</strong>
          <span style="margin-left:8px;font-size:11px;color:var(--muted);">${lang.rarity}</span>
          ${badges}
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">
            ${lang.languageClass || ''}${lang.languageClass ? ' &middot; ' : ''}Cost: ${costText}
          </div>
          ${lang.description ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${lang.description}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;flex-shrink:0;">
          ${nativeBtn}
          <button class="delete-language" data-index="${index}" style="padding:4px 8px;font-size:11px;margin-left:8px;">Delete</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;font-size:12px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;" title="Speak the language. 1 slot (PHB: 'Languages, Modern').">
          <input type="checkbox" class="lang-speak" data-index="${index}" ${lang.canSpeak !== false ? 'checked' : ''}>
          <span>Speak</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;" title="Read and Write are a SINGLE purchase -- 1 slot covers both (PHB: 'Reading/Writing').">
          <input type="checkbox" class="lang-read" data-index="${index}" ${lang.canRead ? 'checked' : ''}>
          <span>Read</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;" title="Read and Write are a SINGLE purchase -- 1 slot covers both (PHB: 'Reading/Writing').">
          <input type="checkbox" class="lang-write" data-index="${index}" ${lang.canWrite ? 'checked' : ''}>
          <span>Write</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;margin-left:auto;" title="The DM gave you this language at character creation. Costs no slots, but still counts against your Intelligence cap.">
          <input type="checkbox" class="lang-granted" data-index="${index}" ${lang.isGranted ? 'checked' : ''}>
          <span style="color:var(--muted);">Granted by DM</span>
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

  [['lang-speak', 'canSpeak'], ['lang-read', 'canRead'], ['lang-write', 'canWrite'], ['lang-granted', 'isGranted']]
    .forEach(([cls, field]) => {
      listDiv.querySelectorAll('.' + cls).forEach(cb => {
        cb.onchange = () => {
          const index = parseInt(cb.getAttribute('data-index'), 10);
          updateLanguageFlag(root, index, field, cb.checked);
        };
      });
    });

  listDiv.querySelectorAll('.set-native-language').forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.getAttribute('data-index'), 10);
      setNativeLanguage(root, index);
    };
  });
}

// Mark a language as the character's native tongue. Only one language can be
// native, so this clears the flag from any other and warns before overriding.
function setNativeLanguage(root, index) {
  if (!root._languages || !root._languages[index]) return;

  const lang = root._languages[index];
  const current = root._languages.find(l => l.isNative);

  if (current && current !== lang) {
    if (!confirm(`${current.name} is currently your native language.\n\nReplace it with ${lang.name}?`)) return;
  }

  root._languages.forEach(l => { l.isNative = false; });
  lang.isNative = true;
  lang.canSpeak = true;  // you always speak your native tongue

  renderLanguageProficiencies(root);
  if (typeof renderProficiencySlots === 'function') renderProficiencySlots(root);

  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
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

  // These flags drive slot cost, the Intelligence cap, and the badges, so the
  // cards and the proficiency counter both have to repaint.
  renderLanguageProficiencies(root);
  if (typeof renderProficiencySlots === 'function') renderProficiencySlots(root);

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
        ${weapon.Category || ''}
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
  
  // The name came straight out of core_wp.json, so inference is an exact hit
  // and the granular key costs nothing here.
  const profTypeKey = (typeof inferWeaponTypeKey === 'function')
    ? (inferWeaponTypeKey(weapon['Weapon Name']) || '')
    : '';

  root._weaponProfs.push({
    name: weapon['Weapon Name'],
    weaponTypeKey: profTypeKey,
    // Derived from the key, with the browser's own Group as the fallback for
    // the impossible case where inference misses.
    group: (typeof getWeaponGroup === 'function')
      ? getWeaponGroup(profTypeKey, weapon.Group || '')
      : (weapon.Group || ''),
    slots: 1
  });
  
  renderWeaponProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// Render the weapon + nonweapon proficiency slot counters (PHB Table 34).
function renderProficiencySlots(root) {
  // FIRST statement deliberately. This function has two early returns below --
  // missing elements, and an unrecognized class whose budget cannot be computed
  // -- and the Proficiency Abilities section must still render for a homebrew
  // class. Threading the call through both branches would be fragile, so it
  // leads instead. Same reason renderWisGateNote leads renderSpellSlots.
  if (typeof renderProficiencyAbilities === 'function') renderProficiencyAbilities(root);

  const wpTextEl  = root.querySelector('.wp-slot-text');
  const nwpTextEl = root.querySelector('.nwp-slot-text');
  const wpBoxEl   = root.querySelector('.wp-slot-counter');
  const nwpBoxEl  = root.querySelector('.nwp-slot-counter');

  if (!wpTextEl || !nwpTextEl) return;

  const budget = getCharacterProficiencySlots(root);

  if (!budget.valid) {
    wpTextEl.textContent  = "—";
    nwpTextEl.textContent = "—";
    if (wpBoxEl)  wpBoxEl.title  = "Enter a recognized class and level to calculate slots.";
    if (nwpBoxEl) nwpBoxEl.title = "Enter a recognized class and level to calculate slots.";
    return;
  }

  // --- Weapon slots spent ---
  // Base proficiency + specialization. PHB "Cost of Specialization": melee
  // weapons and crossbows cost 2 slots total (1 prof + 1 spec); any bow other
  // than a crossbow costs 3 total (1 prof + 2 spec).
  const weaponProfs = root._weaponProfs || [];
  let wpSpent = 0;
  let specCount = 0;
  weaponProfs.forEach(w => {
    wpSpent += (parseInt(w.slots, 10) || 1);
    if (w.specialized) {
      wpSpent += getSpecializationCost(w.group);
      specCount++;
    }
  });

  // --- Nonweapon slots spent ---
  // Base cost from core_nwp.json (some cost 2), PLUS the PHB Table 38 crossover
  // surcharge: a proficiency from a group outside the character's class costs
  // one additional slot.
  const nwps = root._nwps || [];
  const allowedGroups = getAllowedNWPGroups(root);
  let nwpSpent = 0;
  let crossoverCount = 0;
  let bonusSlotTotal = 0;
  nwps.forEach(n => {
    const cost = getNWPSlotCost(n, allowedGroups);
    // PHB: additional slots may be spent on a proficiency already known, for
    // +1 to its checks (or, for eight of them, some other benefit). Those
    // slots come out of the same budget and were never being charged.
    const extra = Math.max(0, parseInt(n.bonusSlots, 10) || 0);
    nwpSpent += cost + extra;
    bonusSlotTotal += extra;
    if (cost > (parseInt(n.slots, 10) || 1)) crossoverCount++;
  });

  // Languages are bought with nonweapon proficiency slots (PHB: "Languages,
  // Modern" to speak, "Reading/Writing" for literacy). Native and DM-granted
  // languages are free. They draw on the same pool, so they count here.
  const langSpent = getLanguageSlotsSpent(root);
  nwpSpent += langSpent;

  // --- Render ---
  const wpOver  = wpSpent  > budget.wpTotal;
  const nwpOver = nwpSpent > budget.nwpTotal;

  const overColor = 'var(--error, #ff6b6b)';
  const okColor   = 'var(--accent-light)';

  wpTextEl.textContent = `${wpSpent} / ${budget.wpTotal} used`;
  wpTextEl.style.color = wpOver ? overColor : okColor;

  let nwpLabel = `${nwpSpent} / ${budget.nwpTotal} used`;
  if (budget.intBonus > 0) {
    nwpLabel += ` (${budget.nwpBase} class + ${budget.intBonus} INT`;
    nwpLabel += budget.nwpAdj ? `, ${budget.nwpAdj > 0 ? '+' : ''}${budget.nwpAdj} manual)` : ')';
  }
  // Spend that ISN'T visible in the proficiency list below. Languages are the
  // big one -- they draw on the same pool, so "4 / 7 used" over an empty list
  // reads as a contradiction with only a hover tooltip to resolve it, and on a
  // phone there is no hover at all.
  const spendParts = [];
  if (langSpent > 0)      spendParts.push(`${langSpent} on languages`);
  if (bonusSlotTotal > 0) spendParts.push(`${bonusSlotTotal} on extra slots`);
  if (spendParts.length)  nwpLabel += ` \u00B7 ${spendParts.join(', ')}`;
  nwpTextEl.textContent = nwpLabel;
  nwpTextEl.style.color = nwpOver ? overColor : okColor;

  // --- Tooltips ---
  const breakdown = budget.sources.join('\n');

  if (wpBoxEl) {
    let t = `Weapon Proficiency Slots (PHB Table 34)\n${breakdown}\n\nAvailable: ${budget.wpTotal}\nSpent: ${wpSpent}`;
    if (specCount > 0) {
      t += `\n  (includes ${specCount} specialization${specCount > 1 ? 's' : ''};`;
      t += `\n   melee/crossbow +1 slot, bow +2 slots)`;
    }
    if (!canSpecialize(root)) {
      t += `\n\nSpecialization is available to single-class\nfighters only (PHB).`;
    }
    if (wpOver) t += `\n\nOVER BUDGET by ${wpSpent - budget.wpTotal}`;
    wpBoxEl.title = t;
  }

  if (nwpBoxEl) {
    let t = `Nonweapon Proficiency Slots (PHB Table 34)\n${breakdown}\n\nAvailable: ${budget.nwpTotal}\nSpent: ${nwpSpent}`;
    if (langSpent > 0) {
      t += `\n  (includes ${langSpent} slot${langSpent === 1 ? '' : 's'} spent on languages)`;
    }
    if (crossoverCount > 0) {
      t += `\n  (includes ${crossoverCount} out-of-group proficienc${crossoverCount > 1 ? 'ies' : 'y'}`;
      t += `\n   at +1 slot each -- PHB Table 38)`;
    }
    if (bonusSlotTotal > 0) {
      t += `\n  (includes ${bonusSlotTotal} extra slot${bonusSlotTotal === 1 ? '' : 's'} spent`;
      t += `\n   to improve proficiencies)`;
    }
    if (allowedGroups && allowedGroups.size > 0) {
      const groupList = Array.from(allowedGroups)
        .map(g => g.charAt(0).toUpperCase() + g.slice(1))
        .join(', ');
      t += `\n\nYour groups (no surcharge): ${groupList}`;
    }
    t += `\n\nIntelligence bonus slots are general purpose --\nthey may be spent on any nonweapon proficiency,\nincluding languages.`;
    if (nwpOver) t += `\n\nOVER BUDGET by ${nwpSpent - budget.nwpTotal}`;
    nwpBoxEl.title = t;
  }
}

// Render weapon proficiencies list
// Backfill weaponTypeKey on proficiency records saved before the type dropdown.
//
// NON-DESTRUCTIVE: only fills a key that is missing, inferring it from the
// proficiency's NAME. Proficiencies are nearly always added from the Learn
// browser, so their names are canonical and inference is an exact hit; a
// hand-typed custom may not resolve and is simply left for the player to set.
//
// Where a key IS known, group is re-derived from it, because group is a derived
// value now. This also quietly repairs records whose group was typed into the
// old prompt() as "Swords" or similar and had stopped matching anything.
function migrateWeaponProfTypes(root) {
  const profs = root._weaponProfs || [];

  profs.forEach(p => {
    if (!p) return;

    if (!p.weaponTypeKey && typeof inferWeaponTypeKey === 'function') {
      const guess = inferWeaponTypeKey(p.name);
      if (guess) {
        // Same guard as resolveWeaponTypeKey on the weapon card: if the record
        // already claims a group and the name lands in a DIFFERENT one, the
        // name is misleading. Do not assert a weapon we are unsure about.
        const g       = (typeof getWeaponGroup === 'function') ? getWeaponGroup(guess, '') : '';
        const claimed = (p.group || '').trim();
        if (!claimed || !g || g.toLowerCase() === claimed.toLowerCase()) {
          p.weaponTypeKey = guess;
        }
      }
    }

    if (p.weaponTypeKey && typeof getWeaponGroup === 'function') {
      const g = getWeaponGroup(p.weaponTypeKey, '');
      if (g) p.group = g;
    }
  });
}

function renderWeaponProficiencies(root) {
  // Migrate FIRST. renderCombatQuickReference below resolves proficiency
  // status, so it has to see the keys -- otherwise it reports the old
  // name-matched answer and does not run again until something else changes.
  migrateWeaponProfTypes(root);

  renderProficiencySlots(root);
  if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);

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
  
  // PHB: weapon specialization is available to SINGLE-CLASS FIGHTERS ONLY, and
  // is itself an optional rule (Ch.5) -- switching it off in Settings hides the
  // control and stops the slot charge, without clearing anyone's saved flag.
  const specRuleOn = (typeof isOptionalRule !== 'function') || isOptionalRule('weaponSpecialization');
  const specAllowed = specRuleOn && canSpecialize(root);

  weaponProfs.forEach((prof, index) => {
    const profDiv = document.createElement('div');
    profDiv.className = 'weapon-prof-item';
    profDiv.style.cssText = 'padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);display:flex;justify-content:space-between;align-items:center;';

    const specCost = getSpecializationCost(prof.group);
    // Only charge for specialization when the rule is actually in play. The
    // flag is left alone so ticking the rule back on restores it intact.
    const totalSlots = (parseInt(prof.slots, 10) || 1) +
                       ((prof.specialized && specAllowed) ? specCost : 0);

    let specHTML = '';
    if (specAllowed) {
      specHTML = `
        <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);margin:0 8px 0 0;white-space:nowrap;cursor:pointer;"
               title="Specialization costs ${specCost} additional slot${specCost > 1 ? 's' : ''} for this weapon.&#10;PHB: melee/crossbow = +1, any other bow = +2.">
          <input type="checkbox" class="weapon-prof-specialized" data-index="${index}" ${prof.specialized ? 'checked' : ''} style="width:auto;margin:0;">
          Specialized
        </label>`;
    } else if (prof.specialized) {
      // Flag a stale flag -- e.g. a fighter who later multi-classed.
      specHTML = `<span style="font-size:11px;color:var(--error, #ff6b6b);margin-right:8px;white-space:nowrap;"
                        title="Specialization is available to single-class fighters only (PHB). This flag is not being counted.">Specialized (N/A)</span>`;
    }

    // Group is derived from the key and shown read-only, so the player can see
    // WHY a related-weapon match does or does not happen.
    const profGroup = (typeof getWeaponGroup === 'function')
      ? getWeaponGroup(prof.weaponTypeKey, prof.group || '')
      : (prof.group || '');

    // weaponTypeOptions lives in app.js, which loads AFTER calc.js -- fine,
    // because this only runs at render time, long after both have executed.
    // Guarded anyway so a load failure degrades instead of throwing.
    const typeOptsHTML = (typeof weaponTypeOptions === 'function')
      ? weaponTypeOptions(prof.weaponTypeKey || '')
      : '';

    profDiv.innerHTML = `
      <div style="flex:1;">
        <strong>${prof.name}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${profGroup || '\u2014'}</span>
        <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
          <label style="font-size:11px;color:var(--muted);margin:0;">Type</label>
          <select class="weapon-prof-type" data-index="${index}" style="width:170px;font-size:11px;padding:2px;"
                  title="Which specific weapon this proficiency covers.&#10;Set it and a weapon you have renamed still counts as proficient,&#10;instead of falling back to a group match.&#10;Leave it blank for anything with no equivalent in the book.">
            ${typeOptsHTML}
          </select>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">Slots: ${totalSlots}${prof.specialized && specAllowed ? ` (${prof.slots} + ${specCost} specialization)` : ''}</div>
      </div>
      ${specHTML}
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

  // Attach specialization toggles
  listDiv.querySelectorAll('.weapon-prof-specialized').forEach(cb => {
    cb.onchange = () => {
      const index = parseInt(cb.getAttribute('data-index'), 10);
      if (!root._weaponProfs || !root._weaponProfs[index]) return;
      root._weaponProfs[index].specialized = cb.checked;
      renderWeaponProficiencies(root);
      const tab = document.querySelector('.tab.active');
      if (tab) markUnsaved(tab, true, root);
    };
  });

  // Attach type dropdowns. This is the anchor for the proficiency: setting it
  // is what lets a renamed weapon on the Weapons list be recognised as this
  // exact weapon rather than merely something in the same group.
  listDiv.querySelectorAll('.weapon-prof-type').forEach(sel => {
    sel.onchange = () => {
      const index = parseInt(sel.getAttribute('data-index'), 10);
      if (!root._weaponProfs || !root._weaponProfs[index]) return;
      const p = root._weaponProfs[index];
      p.weaponTypeKey = sel.value;

      // Group is DERIVED. A CLEARED type deliberately leaves the old group
      // standing rather than blanking it: proficiencies like Shield or
      // Wrestling have a real group and no entry in WEAPON_TYPES at all, and
      // wiping their group would break the slot counter and the related-weapon
      // fallback for them.
      if (typeof getWeaponGroup === 'function') {
        const g = getWeaponGroup(sel.value, '');
        if (g) p.group = g;
      }

      renderWeaponProficiencies(root);
      const tab = document.querySelector('.tab.active');
      if (tab) markUnsaved(tab, true, root);
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
  
  // The group prompt is gone. It was free text, so "Swords" or a stray capital
  // silently broke related-weapon matching with nothing on screen to say so --
  // the proficiency simply stopped counting and looked fine. Group is DERIVED
  // from the type key now, and the type comes from a controlled dropdown.
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
  
  // The typed name may well be a book weapon ("long sword"), in which case
  // inference resolves it and the group fills itself. A genuinely homebrew name
  // resolves to nothing, and the player picks a Type on the card instead.
  const customTypeKey = (typeof inferWeaponTypeKey === 'function')
    ? (inferWeaponTypeKey(weaponName) || '')
    : '';

  root._weaponProfs.push({
    name: weaponName.trim(),
    weaponTypeKey: customTypeKey,
    // DERIVED from the key, never entered. See the note on the prompts above.
    group: (typeof getWeaponGroup === 'function') ? getWeaponGroup(customTypeKey, '') : '',
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
  
  // Several proficiencies appear once per Table 37 group they belong to (e.g.
  // Reading/Writing exists as both Priest and Wizard). That duplication is
  // needed so getNWPSlotCost() can apply the Table 38 crossover surcharge --
  // but the player should only ever see ONE entry per proficiency. Collapse
  // duplicates, preferring the variant that is IN the character's own groups
  // (cheapest), falling back to any variant if none are.
  const allowedGroups = getAllowedNWPGroups(root);

  if (!categoryFilter) {
    const byName = new Map();
    filteredNWPs.forEach(nwp => {
      const name = nwp['Proficiency Name'];
      const existing = byName.get(name);
      if (!existing) {
        byName.set(name, nwp);
        return;
      }
      // Prefer an in-group variant over an out-of-group one.
      const cost    = getNWPSlotCost({ slots: nwp.Slots, category: nwp.Category }, allowedGroups);
      const oldCost = getNWPSlotCost({ slots: existing.Slots, category: existing.Category }, allowedGroups);
      if (cost < oldCost) byName.set(name, nwp);
    });
    filteredNWPs = Array.from(byName.values());
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

    // Effective cost for THIS character, including the Table 38 surcharge.
    const baseSlots = parseInt(nwp.Slots, 10) || 1;
    // Pass the WHOLE record. A synthetic {slots, category} object has no name,
    // so getNWPGroups cannot reach NWP_TABLE37_GROUPS and falls back to the one
    // stored Category -- which charged a thief the out-of-group surcharge for
    // Blind-fighting, Gaming and Set Snares, all of which are Rogue as well as
    // Warrior. getNWPSlotCost already reads nwp.slots || nwp.Slots.
    const effCost   = getNWPSlotCost(nwp, allowedGroups);
    const isCrossover = effCost > baseSlots;

    const slotText = isCrossover
      ? `<span style="color:var(--error, #ff6b6b);" title="Out-of-group proficiency: +1 slot (PHB Table 38)">Slots: ${effCost} (${baseSlots} +1 out-of-group)</span>`
      : `Slots: ${effCost}`;

    const browseGroupLabel = getNWPGroups(nwp)
      .map(g => g.charAt(0).toUpperCase() + g.slice(1))
      .join(', ');

    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    infoDiv.innerHTML = `
      <div>
        <strong>${nwp['Proficiency Name']}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${browseGroupLabel}</span>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">
        ${slotText} | ${formatNWPCheck(root, nwp)}
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
  renderProficiencySlots(root);

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
  
  // Effective costs include the PHB Table 38 out-of-group surcharge.
  const nwpAllowedGroups = getAllowedNWPGroups(root);

  nwps.forEach((nwp, index) => {
    const nwpDiv = document.createElement('div');
    nwpDiv.className = 'nwp-item';
    nwpDiv.style.cssText = 'padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);';

    const baseSlots = parseInt(nwp.slots, 10) || 1;
    const effCost   = getNWPSlotCost(nwp, nwpAllowedGroups);
    const slotText  = effCost > baseSlots
      ? `<span style="color:var(--error, #ff6b6b);" title="Out-of-group proficiency: +1 slot (PHB Table 38)">Slots: ${effCost} (${baseSlots} +1 out-of-group)</span>`
      : `Slots: ${effCost}`;

    // Show every Table 37 group this proficiency belongs to, not just the one
    // label stored in core_nwp.json -- otherwise the tag contradicts the cost.
    const groupLabel = getNWPGroups(nwp)
      .map(g => g.charAt(0).toUpperCase() + g.slice(1))
      .join(', ');

    const checkText = formatNWPCheck(root, nwp);

    // PHB: extra slots spent on a proficiency already known buy +1 to its
    // checks -- except for the eight in NWP_BONUS_SLOT_EFFECTS, where they buy
    // something the check target cannot express. Show which applies.
    const bonusSlots = Math.max(0, parseInt(nwp.bonusSlots, 10) || 0);
    const altEffect  = (typeof NWP_BONUS_SLOT_EFFECTS === 'object' && NWP_BONUS_SLOT_EFFECTS)
      ? NWP_BONUS_SLOT_EFFECTS[(nwp.name || '').trim().toLowerCase()]
      : null;
    const effectNote = altEffect
      ? `<span style="color:var(--info, #6fb3d2);">${altEffect}</span>`
      : `<span style="color:var(--muted);">each extra slot gives +1 to this check</span>`;

    // Extra slots buy +1 to the check, or whatever NWP_BONUS_SLOT_EFFECTS says.
    // A proficiency with NEITHER -- no check and no alternate benefit -- has
    // nothing to sell, so the control is hidden rather than offering a
    // meaningless purchase. Blind-fighting is currently the only one.
    const parsedCheck = (typeof parseNWPCheck === 'function')
      ? parseNWPCheck(nwp.abilityCheck) : null;
    const canImprove  = !!altEffect || !parsedCheck || parsedCheck.hasCheck;

    nwpDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
        <div style="flex:1;">
          <strong>${nwp.name}</strong>
          <span style="margin-left:8px;font-size:11px;color:var(--muted);">${groupLabel}</span>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">
            ${slotText} | ${checkText}
          </div>
          ${canImprove ? `
          <div style="font-size:11px;color:var(--muted);margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <label style="display:inline;margin:0;color:var(--muted);">Extra slots</label>
            <input type="number" class="nwp-bonus-slots" data-index="${index}"
                   min="0" max="9" step="1" value="${bonusSlots}"
                   style="width:48px;flex-shrink:0;padding:2px 4px;font-size:11px;"
                   title="Additional proficiency slots spent to improve this proficiency (PHB Ch.5). These come out of your nonweapon proficiency budget.">
            ${effectNote}
          </div>` : ''}
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

  // Extra slots spent to improve a proficiency (PHB Ch.5). Rides in the _nwps
  // array, so collectSheet/loadSheet persist it with no further wiring.
  listDiv.querySelectorAll('.nwp-bonus-slots').forEach(inp => {
    inp.onchange = () => {
      const i = parseInt(inp.getAttribute('data-index'), 10);
      if (!root._nwps || !root._nwps[i]) return;
      root._nwps[i].bonusSlots = Math.max(0, parseInt(inp.value, 10) || 0);
      // Re-render rather than patching in place: this changes the check target,
      // the effect note AND the slot counter, and renderNWProficiencies calls
      // renderProficiencySlots on its way in.
      renderNWProficiencies(root);
      const tab = document.querySelector('.tab.active');
      if (tab) markUnsaved(tab, true, root);
    };
  });
}

// Render the PHB Chapter 5 proficiency check as a TARGET NUMBER rather than the
// raw Table 37 string. "Check: Wis / -1" tells a player nothing he can act on;
// "Wis 14 -1 = roll 13 or less" is the number he actually rolls against.
// The arithmetic lives in getNWPCheckTarget (tables.js); this is display only.
function formatNWPCheck(root, nwp) {
  if (typeof getNWPCheckTarget !== 'function') {
    // Accepts a stored card object OR a raw core_nwp.json record.
    return `Check: ${nwp.abilityCheck || nwp['Ability Check'] || 'N/A'}`;
  }

  const c = getNWPCheckTarget(root, nwp);

  // Table 37 lists Blind-fighting and Mountaineering as "NA / NA" -- they have
  // no check at all, so printing a target number would be a lie.
  if (!c.hasCheck) {
    return `<span title="PHB Table 37 lists no ability check for this proficiency.">No check required</span>`;
  }

  const sign  = n => (n < 0 ? `-${Math.abs(n)}` : `+${n}`);
  const parts = [`${c.abilityLabel} ${c.score}`];
  if (c.modifier) parts.push(sign(c.modifier));
  c.adjustments.forEach(a => parts.push(sign(a.mod)));

  const why = c.adjustments.map(a => `${a.label} ${sign(a.mod)}`).join(', ');
  const tip = 'PHB Ch.5: roll 1d20; equal to or under the target succeeds. '
            + 'A natural 20 always fails.' + (why ? ` Includes: ${why}.` : '');

  // Below 1 no roll can ever succeed. For Tracking the book says the trail is
  // then permanently lost to that character.
  if (c.impossible) {
    return `<span style="color:var(--error, #ff6b6b);" title="${tip}">`
         + `${parts.join(' ')} = no roll can succeed</span>`;
  }

  const note = c.alwaysFailsOn20
    ? ` <span style="color:var(--muted);" title="A roll of 20 always fails, however high the target.">(20 still fails)</span>`
    : '';

  return `<span title="${tip}">${parts.join(' ')} = roll ${c.target} or less</span>${note}`;
}

// === Proficiency Abilities (PHB Ch.5) ===
// One tab per learned proficiency that has interactive rules. Registry lives in
// tables.js; builders register themselves here, keyed by the same name.
//
// ALL STATE IN THIS SECTION IS EPHEMERAL. root._profAbilityState and
// root._profAbilityTab are deliberately NOT read by collectSheet -- these
// describe one attempt under one set of conditions, not the character. A saved
// "in a sleet storm" would be wrong the next time the sheet is opened. If
// anyone later adds these to collectSheet, that is a bug, not an improvement.
const PROF_ABILITY_BUILDERS = {};   // key -> function(root, entry, panelEl)

// PHB: "If two proficient characters work together... use the higher ability
// score, +1 for assistance. Never more than +1."
function getProficiencyCooperation(root) {
  const el = root && root.querySelector('.prof-ability-coop');
  return !!(el && el.checked);
}

// Per-panel scratch state, created on demand and never persisted.
function getProfAbilityState(root, key) {
  if (!root._profAbilityState) root._profAbilityState = {};
  if (!root._profAbilityState[key]) root._profAbilityState[key] = {};
  return root._profAbilityState[key];
}

function renderProficiencyAbilities(root) {
  const sec = root.querySelector('.proficiency-abilities-display');
  if (!sec) return;

  const entries = (typeof getProficiencyAbilities === 'function')
    ? getProficiencyAbilities(root) : [];

  if (!entries.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';

  // Keep the active tab across re-renders when it is still valid -- otherwise
  // deleting an unrelated proficiency would throw the player back to tab one.
  let active = root._profAbilityTab;
  if (!entries.some(e => e.key === active)) active = entries[0].key;
  root._profAbilityTab = active;

  const tabsEl  = sec.querySelector('.prof-ability-tabs');
  const panelEl = sec.querySelector('.prof-ability-panel');
  if (!tabsEl || !panelEl) return;

  tabsEl.innerHTML = '';
  entries.forEach(e => {
    const b = document.createElement('button');
    b.textContent = e.label;
    b.className = 'prof-ability-tab';
    b.style.cssText = 'padding:4px 12px;font-size:12px;flex-shrink:0;' +
      (e.key === active ? '' : 'opacity:0.5;');
    b.onclick = () => { root._profAbilityTab = e.key; renderProficiencyAbilities(root); };
    tabsEl.appendChild(b);
  });

  // Handlers are ASSIGNED, not added, so re-rendering cannot stack duplicates.
  const coop = sec.querySelector('.prof-ability-coop');
  if (coop) coop.onchange = () => renderProficiencyAbilities(root);

  // Reset means "an unmodified attempt by this character alone" -- so it clears
  // the cooperation toggle as well as every panel's conditions.
  const resetBtn = sec.querySelector('.prof-ability-reset');
  if (resetBtn) resetBtn.onclick = () => {
    if (coop) coop.checked = false;
    root._profAbilityState = {};
    renderProficiencyAbilities(root);
  };

  panelEl.innerHTML = '';
  const entry = entries.find(e => e.key === active);
  const build = PROF_ABILITY_BUILDERS[active];
  if (build) {
    build(root, entry, panelEl);
  } else {
    panelEl.innerHTML =
      '<div style="font-size:11px;color:var(--muted);">No panel built for this proficiency yet.</div>';
  }
}

// --- Tracking (PHB Ch.5, Tables 39 and 40) ---
// Two phases in the book: FINDING a trail (gated by prerequisites) and
// FOLLOWING it (re-checked on three triggers). The panel computes the chance
// and the party's movement rate, and states the rules it cannot enforce.
PROF_ABILITY_BUILDERS['tracking'] = function (root, entry, panelEl) {
  const st = getProfAbilityState(root, 'tracking');
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const base = getNWPCheckTarget(root, entry.nwp);
  const coop = getProficiencyCooperation(root);

  let total = base.hasCheck ? base.target : 0;
  const lines = [];
  base.adjustments.forEach(a =>
    lines.push(`${a.label}: ${a.mod < 0 ? a.mod : '+' + a.mod}`));

  (TRACKING_MODIFIERS || []).forEach(m => {
    if (m.repeating) {
      const n = Math.max(0, parseInt(st[m.key], 10) || 0);
      const times = Math.floor(n / m.per);
      if (times > 0) {
        const amt = m.mod * times;
        total += amt;
        lines.push(`${m.label} (${n}): ${amt < 0 ? amt : '+' + amt}`);
      }
    } else if (st[m.key]) {
      total += m.mod;
      if (m.mod !== 0) lines.push(`${m.label}: ${m.mod < 0 ? m.mod : '+' + m.mod}`);
    }
  });

  // Tracking states the cooperation rule in its own words: "+1 to the ability
  // score of the MOST ADEPT tracker. Once he loses the trail, it is lost to all."
  if (coop) { total += 1; lines.push('Most adept of several trackers: +1'); }

  // The below-zero rule is a LATCH, not a live comparison: "further tracking is
  // impossible even if the chance later improves." Nothing here can enforce
  // that across sessions, so it is stated rather than modelled.
  const lost = total < 0;
  const move = (typeof getTrackingMovement === 'function') ? getTrackingMovement(total) : null;

  const rows = (TRACKING_MODIFIERS || []).map(m => {
    // A zero-modifier row does nothing when ticked. It stays in the list so a
    // player scanning for "normal ground" finds it, but is muted so it does not
    // read as broken.
    const dim = m.mod === 0 ? 'opacity:0.55;' : '';
    return m.repeating
      ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
           <input type="number" class="trk-num" data-key="${m.key}" min="0" step="1"
                  value="${Math.max(0, parseInt(st[m.key], 10) || 0)}"
                  style="width:52px;flex-shrink:0;padding:2px 4px;font-size:11px;">
           <span>${esc(m.countLabel)}
             <span style="color:var(--muted);">(${m.mod > 0 ? '+' : ''}${m.mod} per ${m.per})</span>
           </span>
         </div>`
      : `<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;color:var(--text);cursor:pointer;${dim}">
           <input type="checkbox" class="trk-chk" data-key="${m.key}" ${st[m.key] ? 'checked' : ''}
                  style="width:auto;flex-shrink:0;">
           <span>${esc(m.label)}
             <span style="color:var(--muted);">(${m.mod > 0 ? '+' : ''}${m.mod})</span>
           </span>
         </label>`;
  }).join('');

  // A d20 cannot roll above 20, so a target of 20 or more is an automatic
  // success -- printing "23 or less on 1d20" states a number the die cannot
  // exceed. The natural 20 is then the only thing that can go wrong.
  const auto = !lost && total >= (typeof NWP_NATURAL_FAIL === 'number' ? NWP_NATURAL_FAIL : 20);

  const result = lost
    ? `<div style="color:var(--error, #ff6b6b);font-weight:600;">Trail lost \u2014 chance ${total}</div>
       <div style="font-size:11px;color:var(--muted);margin-top:2px;">
         Below 0 the trail is totally lost to this character and further tracking is
         impossible, even if the chance later improves. Others may still track it.
       </div>`
    : auto
    ? `<div style="font-weight:600;color:var(--success, #6fbf73);">Automatic success \u2014 only a natural 20 fails</div>
       <div style="font-size:11px;color:var(--muted);margin-top:2px;">
         Chance ${total}, above the die \u00B7 movement ${move ? esc(move.label) : '\u2014'} (whole party)
       </div>`
    : `<div style="font-weight:600;color:var(--accent-light);">Chance to track: ${total} or less on 1d20</div>
       <div style="font-size:11px;color:var(--muted);margin-top:2px;">
         Movement while tracking: ${move ? esc(move.label) : '\u2014'} (whole party)
         \u00B7 a natural 20 always fails
       </div>`;

  panelEl.innerHTML = `
    <div style="padding:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);margin-bottom:12px;">
      ${result}
      ${lines.length ? `<div style="font-size:11px;color:var(--muted);margin-top:6px;white-space:pre-wrap;">${esc(lines.join('\n'))}</div>` : ''}
    </div>

    <div style="font-size:11px;font-weight:600;margin-bottom:6px;">Conditions \u2014 tick every one that applies, they are cumulative</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0 16px;font-size:11px;margin-bottom:12px;">
      ${rows}
    </div>

    <details class="disclosure" style="font-size:11px;">
      <summary>tracking rules</summary>
      <div style="color:var(--muted);margin-top:6px;line-height:1.5;">
        <strong style="color:var(--text);">Finding the trail</strong><br>
        Indoors: must have seen the creature within 30 minutes and start where it
        was last seen. Outdoors: must have seen it, have eyewitness reports, or
        have obvious evidence it is in the area. On a failure no further attempt
        is possible until those conditions are met again under different
        circumstances.<br><br>
        <strong style="color:var(--text);">While following</strong><br>
        Re-check when the chance drops, when a second track crosses the first, or
        whenever the party resumes after a halt. After a failed check one more is
        allowed following an hour spent searching; fail that and no further
        attempts can be made.<br><br>
        A separate check identifies the creature type and rough number, if the
        character knows that kind of creature. Flying and noncorporeal creatures
        are effectively untrackable.
      </div>
    </details>
  `;

  panelEl.querySelectorAll('.trk-chk').forEach(el => {
    el.onchange = () => { st[el.dataset.key] = el.checked; renderProficiencyAbilities(root); };
  });
  panelEl.querySelectorAll('.trk-num').forEach(el => {
    el.onchange = () => { st[el.dataset.key] = el.value; renderProficiencyAbilities(root); };
  });
};

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

// A spell's classification label. Priest spells are gated by SPHERE and wizard
// spells by SCHOOL, but priest spells now legitimately carry both, so show what
// applies: sphere for priests, school for wizards, and both if a spell has them.
function spellClassification(spell) {
  const parts = [];
  if (spell.sphere) parts.push(spell.sphere);
  if (spell.school && spell.school !== spell.sphere) parts.push(spell.school);
  return parts.join(' | ') || spell.school || spell.sphere || '';
}

// Placeholder for spell details modal (we'll implement this next)
// Show spell details in modal
function showSpellDetails(root, spell) {
  const modal = root.querySelector('.spell-modal');
  if (!modal) return;
  
  // Populate modal content
  modal.querySelector('.spell-modal-name').textContent = spell.name;
  modal.querySelector('.spell-modal-level').textContent = 
    `Level ${spell.level} | ${spellClassification(spell)}`;
  
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

  // Source citation, e.g. "WSC Vol.1 p.22" (falls back to just the source book).
  const citation = [spell.source, spell.wscRef].filter(Boolean).join(' ');
  const srcEl = modal.querySelector('.spell-modal-source');
  if (srcEl) {
    srcEl.textContent = citation ? `Source: ${citation}` : '';
  }

  // Description
  modal.querySelector('.spell-modal-description').textContent = spell.description;
  
  // Show modal
  modal.style.display = 'flex';
  
  // Close buttons
  const closeButtons = modal.querySelectorAll('.close-spell-modal, .close-spell-modal-btn');
  closeButtons.forEach(btn => {
    btn.onclick = () => modal.style.display = 'none';
  });
  
  // Two independent reasons a spell can be browsed but not added:
  //   1. Above the character's max castable level (class progression / INT cap)
  //   2. In a specialist wizard's OPPOSITION schools (PHB Table 22) -- they may
  //      study opposition spells for reference but never learn them.
  // Computed live rather than read from root._spellLevelCap: that cache went
  // stale on any level change and defaulted to 99 -- blocking nothing at all --
  // before the spell browser had rendered even once.
  const levelCap = getMaxSpellLevel(root).max;
  const spellLevelNum = (typeof spell.level === 'number') ? spell.level : parseInt(spell.level, 10) || 0;
  const overCap = levelCap > 0 && spellLevelNum > levelCap;

  // Resolve the WIZARD sub-class, not the top-level class field. A multi-class
  // gnome fighter/illusionist has an empty clazz, so reading it directly meant
  // opposition blocking silently never fired for the one specialist actually
  // permitted to multi-class -- and for every dual-class specialist too.
  const wizComp = (typeof getWizardComponent === 'function') ? getWizardComponent(root) : null;
  const clazz = wizComp ? wizComp.clazz : (val(root, 'clazz') || '');
  const opposed = (typeof isOppositionSpell === 'function') && isOppositionSpell(spell, clazz);

  const blocked = overCap || opposed;

  // Build the reason text (may cite both).
  let blockReason = '';
  if (overCap && opposed) {
    blockReason = 'Above your max castable level (' + levelCap + ') and in an opposition school \u2014 reference only.';
  } else if (overCap) {
    blockReason = 'Above your maximum castable spell level (' + levelCap + ') \u2014 shown for reference only.';
  } else if (opposed) {
    const oppList = (typeof getOppositionSchools === 'function') ? getOppositionSchools(clazz).join(', ') : '';
    blockReason = 'Opposition school for your specialty' + (oppList ? ' (' + oppList + ')' : '') + ' \u2014 cannot be learned (PHB Table 22).';
  }

  // Update button container to have both options
  const buttonContainer = modal.querySelector('.spell-modal-content > div:last-child');
  const disabledStyle = blocked ? 'opacity:0.4;cursor:not-allowed;' : '';

  // The reason note sits ABOVE the button row as its own block, not as a flex
  // child of the right-aligned button container. Remove any prior note first.
  const priorNote = modal.querySelector('.spell-cap-note');
  if (priorNote) priorNote.remove();
  if (blocked) {
    const note = document.createElement('div');
    note.className = 'spell-cap-note';
    note.style.cssText = 'font-size:11px;color:var(--muted);text-align:right;margin-top:16px;';
    note.textContent = blockReason;
    buttonContainer.parentNode.insertBefore(note, buttonContainer);
  }

  // Specialist learn-spell modifier (PHB Ch.3): +15% for own-school spells,
  // -15% for other schools. Only shown for specialists, on spells they could
  // actually attempt to learn -- i.e. not blocked (opposition schools can't be
  // learned at all, and spells above the castable level can't be learned yet).
  const priorLearnNote = modal.querySelector('.spell-learn-note');
  if (priorLearnNote) priorLearnNote.remove();
  const specSchool = (typeof getSpecialistSchool === 'function') ? getSpecialistSchool(clazz) : null;
  // Cantrips (level 0) follow Tome of Magic acquisition rules, not the standard
  // Table 4 chance-to-learn roll, so skip the +/-15% note for them.
  if (specSchool && !blocked && spellLevelNum > 0) {
    const intScore = parseInt(val(root, 'int') || 0, 10);
    const baseLearn = (typeof INT_TABLE !== 'undefined' && INT_TABLE[intScore]) ? INT_TABLE[intScore][1] : 0;
    if (intScore >= 9 && baseLearn > 0) {
      const own = (typeof isSpecialtySpell === 'function') && isSpecialtySpell(spell, clazz);
      const mod = own ? 15 : -15;
      const eff = Math.max(1, Math.min(100, baseLearn + mod));
      const learnNote = document.createElement('div');
      learnNote.className = 'spell-learn-note';
      learnNote.style.cssText = 'font-size:11px;color:var(--muted);text-align:right;margin-top:8px;';
      learnNote.textContent =
        'Chance to learn: ' + eff + '% (' + baseLearn + '% ' +
        (mod > 0 ? '+' : '\u2212') + '15% ' +
        (own ? 'specialty school' : 'non-specialty school') + ')';
      buttonContainer.parentNode.insertBefore(learnNote, buttonContainer);
    }
  }

  buttonContainer.innerHTML = `
    <button class="add-to-spellbook" style="padding:8px 16px;${disabledStyle}"${blocked ? ' disabled' : ''}>Add to Spellbook</button>
    <button class="add-to-memorized" style="padding:8px 16px;${disabledStyle}"${blocked ? ' disabled' : ''}>Add to Memorized</button>
    <button class="close-spell-modal-btn" style="padding:8px 16px;">Close</button>
  `;

  // Wire up new buttons
  buttonContainer.querySelector('.close-spell-modal-btn').onclick = () => {
    modal.style.display = 'none';
  };

  if (!blocked) {
    buttonContainer.querySelector('.add-to-spellbook').onclick = () => {
      addSpellToSpellbook(root, spell);
      modal.style.display = 'none';
    };

    buttonContainer.querySelector('.add-to-memorized').onclick = () => {
      addSpellToMemorized(root, spell);
      modal.style.display = 'none';
    };
  }
  
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
    schoolSphere: spellClassification(spell),
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
    schoolSphere: spellClassification(spell),
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
// Specialist bonus-slot utilization (PHB Ch.3 illusionist text: "memorize an extra
// spell at each spell level... at least one of these must be an illusion spell").
// Parallel row under "Spells Memorized:" showing, per castable level, whether at
// least one specialty-school spell is memorized there -- which is what activates
// the +1 bonus slot at that level. used/1: GREEN at 1/1 (bonus active), NORMAL at
// 0/1 (available, unused), NEVER red (it's optional). Works for single/multi/dual
// via getWizardComponent -> the wizard sub-class + sub-level.
// Druid Standing panel (PHB Ch.3, "The Grand Druid and Hierophant Druids").
// Reveals the section for druids only, drives the bonus-spell-level pool, and
// surfaces the advisory campaign notes. Never blocks: the pool over-spend goes
// red the way over-memorization does, and every rules constraint here is a note.
// The slot ARITHMETIC lives in renderSpellSlots (app.js) -- this function owns
// the CONTROL and its readout, not the totals.
function renderDruidRole(root) {
  // The Druid Standing controls now live on TWO tabs: the role dropdown, the
  // surrendered-XP field and the advisory note are on Abilities
  // (.druid-standing-section), and the bonus spell-level pool is on Magic
  // (.druid-slots-section). Each is shown/hidden on its own so a druid without
  // a pool still sees the role controls, and neither is a descendant of the
  // other -- pool inputs are queried against root, not a shared section.
  const standing = root.querySelector('.druid-standing-section');
  const slotsSec = root.querySelector('.druid-slots-section');
  if (!standing && !slotsSec) return;

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hideAll = () => {
    if (standing) standing.style.display = 'none';
    if (slotsSec) slotsSec.style.display = 'none';
  };

  if (typeof isDruidClass !== 'function' || !isDruidClass(val(root, 'clazz'))) { hideAll(); return; }
  if (standing) standing.style.display = '';

  const level      = parseInt(val(root, 'level') || 0, 10);
  const storedRole = val(root, 'druid_role');
  const role       = (typeof getDruidRole === 'function') ? getDruidRole(val(root, 'clazz'), level, storedRole) : '';
  const wis        = parseInt(val(root, 'wis') || 0, 10);

  // Advisory campaign notes (single-in-the-world, level cap, hierophant-only
  // 17th+). Plus the one state the rules forbid: a hierophant below 16th level.
  const noteEl = standing ? standing.querySelector('.druid-role-note') : null;
  if (noteEl) {
    let notes = (typeof getDruidRoleNotes === 'function')
      ? getDruidRoleNotes(val(root, 'clazz'), level, role) : [];
    if ((storedRole || '').toLowerCase() === 'hierophant' && !isNaN(level) &&
        level < 16 && level > 0) {
      notes = ['A hierophant druid is a former Grand Druid who has stepped down at ' +
               '16th level; the title is not available below 16th.'].concat(notes);
    }
    if (notes.length) {
      noteEl.innerHTML = notes.map(n => '<div style="margin-top:4px;">\u2022 ' + esc(n) + '</div>').join('');
      noteEl.style.color = 'var(--warning, #e0a34a)';
      noteEl.style.display = '';
    } else {
      noteEl.style.display = 'none';
      noteEl.innerHTML = '';
    }
  }

  // Bonus spell-level pool. The whole Magic-tab section is shown only when the
  // role grants a pool; an ordinary druid or a stepped-down hierophant sees no
  // pool section at all.
  const pool = (typeof getDruidBonusPool === 'function') ? getDruidBonusPool(role) : 0;
  if (!slotsSec) return;
  if (pool <= 0) { slotsSec.style.display = 'none'; return; }
  slotsSec.style.display = '';

  // Disable any pool input for a spell level the WIS gate locks (6th needs 17,
  // 7th needs 18). The pool has no 7th box, so only the 6th can be gated here,
  // but the loop reads PRIEST_SPELL_LEVEL_WIS_MIN so it stays correct if that
  // ever changes. A gated box is zeroed and disabled with an explanatory title.
  const alloc = [];
  for (let i = 1; i <= 6; i++) {
    const box = slotsSec.querySelector('[data-field="druid_bonus_' + i + '"]');
    if (!box) { alloc[i-1] = 0; continue; }
    const gateMin = (typeof PRIEST_SPELL_LEVEL_WIS_MIN !== 'undefined')
      ? PRIEST_SPELL_LEVEL_WIS_MIN[i] : undefined;
    const gated = (gateMin !== undefined) && (isNaN(wis) || wis < gateMin);
    if (gated) {
      box.value = 0;
      box.disabled = true;
      box.title = i + 'th-level priest spells require Wisdom ' + gateMin +
                  ' (PHB Table 24). You have ' + (wis || '\u2014') + '.';
    } else {
      box.disabled = false;
      box.title = '';
    }
    alloc[i-1] = parseInt(box.value || 0, 10) || 0;
  }

  // Running total: "N of POOL spell levels allocated", red when over budget.
  const readout = slotsSec.querySelector('.druid-bonus-readout');
  if (readout) {
    const spent = (typeof getDruidBonusSpent === 'function') ? getDruidBonusSpent(alloc) : 0;
    const over  = spent > pool;
    const roleLabel = (typeof DRUID_ROLES !== 'undefined' && DRUID_ROLES[role])
      ? DRUID_ROLES[role].label : 'Druid';
    readout.innerHTML =
      '<strong>' + esc(roleLabel) + ':</strong> ' + spent + ' of ' + pool +
      ' bonus spell levels allocated' +
      (over ? ' \u2014 over budget' : '') +
      '. These are added to your spell slots above.';
    readout.style.color = over ? 'var(--error, #d9534f)' : 'var(--muted)';
  }
}

function renderSpecialistMemorizedStatus(root) {
  const rowEl = root.querySelector('.specialist-mem-status');
  const textEl = root.querySelector('.specialist-mem-status-text');
  if (!rowEl || !textEl) return;

  const component = (typeof getWizardComponent === 'function') ? getWizardComponent(root) : null;
  const school = (component && typeof getSpecialistSchool === 'function') ? getSpecialistSchool(component.clazz) : null;

  // Not a specialist -> hide the row entirely.
  if (!component || !school) {
    rowEl.style.display = 'none';
    textEl.innerHTML = '';
    return;
  }

  // Castable spell levels come from the wizard SUB-level via the base mage table.
  let castableMax = 0;
  if (typeof SPELL_SLOTS_TABLES !== 'undefined' && SPELL_SLOTS_TABLES.mage) {
    const rows = SPELL_SLOTS_TABLES.mage;
    let row = rows[component.level];
    if (!row && component.level > 0) {
      const maxLvl = Math.max.apply(null, Object.keys(rows).map(k => parseInt(k, 10)));
      row = rows[Math.min(component.level, maxLvl)];
    }
    if (Array.isArray(row)) {
      for (let i = 0; i < row.length && i < 9; i++) {
        if (row[i] > 0) castableMax = i + 1;
      }
    }
  }

  if (castableMax === 0) {
    rowEl.style.display = 'none';
    textEl.innerHTML = '';
    return;
  }

  // Which castable levels have at least one specialty-school spell memorized.
  const hasSpecialty = {};
  const memItems = Array.from(root.querySelectorAll('.memspells-list .item'));
  memItems.forEach(item => {
    const lvl = parseInt(item.querySelector('.level')?.value, 10);
    if (!(lvl >= 1 && lvl <= 9)) return;
    const schoolSphere = item.querySelector('.school-sphere')?.value || '';
    if (typeof isSpecialtySpell === 'function' &&
        isSpecialtySpell({ school: schoolSphere, level: lvl }, component.clazz)) {
      hasSpecialty[lvl] = true;
    }
  });

  const parts = [];
  for (let level = 1; level <= castableMax; level++) {
    const active = !!hasSpecialty[level];
    const color = active ? '#4caf50' : 'var(--muted)'; // green when bonus active, muted when unused
    const check = active ? '\u2713 ' : ''; // checkmark on active (claimed) levels
    parts.push(`<span style="color:${color};">${check}Level ${level}</span>`);
  }

  textEl.innerHTML = parts.join('&nbsp;&nbsp;&nbsp;');
  rowEl.style.display = '';
}

// Spells known per level against the PHB Table 4 Intelligence cap.
// Wizards only -- priests do not learn spells into books and take no INT cap.
// Counts across ALL spellbooks: the PHB says a wizard's spell book "can be a
// single book, a set of books, a bundle of scrolls", so the limit is on spells
// known, not per volume. Reports only; never blocks, matching the memorized
// counter's behaviour when a caster over-memorizes.
// Highest spell level a character can actually cast. TWO limits apply and the
// lower wins: the class progression (a 5th-level mage has three spell levels
// however clever he is) and PHB Table 4's Intelligence ceiling.
//
// Computed on demand, NOT cached. root._spellLevelCap was written only by
// renderSpellBrowser -- which runs on the refresh button and the filter
// controls but not on class, level or Intelligence changes -- so it went stale
// the moment a level was edited, and defaulted to 99 (blocking nothing) before
// the browser had ever rendered.
//
// KNOWN LIMITATION: for a multi-class caster this returns the best figure
// across all classes. A cleric/mage browsing priest spells is therefore judged
// by whichever side reaches higher. The browser already filters by class
// access, so this is an approximation rather than a hole.
function getMaxSpellLevel(root) {
  const out = { max: 0, intCapped: false, clazz: '', level: 0 };

  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const pairs = [];
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = val(root, 'mc_class' + i) || '';
      if (c) pairs.push({ clazz: c, level: parseInt(val(root, 'mc_level' + i) || 0, 10) });
    }
  } else if (charType === 'dual') {
    const nc = val(root, 'dc_new_class') || '';
    const oc = val(root, 'dc_original_class') || '';
    if (nc) pairs.push({ clazz: nc, level: parseInt(val(root, 'dc_new_level') || 0, 10) });
    if (oc) pairs.push({ clazz: oc, level: parseInt(val(root, 'dc_original_level') || 0, 10) });
  } else {
    const c = val(root, 'clazz') || '';
    if (c) pairs.push({ clazz: c, level: parseInt(val(root, 'level') || 0, 10) });
  }

  const int = parseInt(val(root, 'int') || 0, 10);
  const intRow = (typeof INT_TABLE !== 'undefined') ? INT_TABLE[int] : null;
  const intMax = intRow ? (parseInt(intRow[4], 10) || 0) : 0;

  pairs.forEach(p => {
    const key = (p.clazz || '').trim().toLowerCase();
    if (!key || !p.level || typeof SPELL_SLOTS_TABLES === 'undefined') return;

    const isWiz  = (typeof isWizardClass === 'function') && isWizardClass(p.clazz);
    const isBard = key.indexOf('bard') !== -1;

    // Specialist school names are not keys in SPELL_SLOTS_TABLES -- they use
    // the mage progression (PHB Ch.3).
    let tbl = SPELL_SLOTS_TABLES[key];
    if (!tbl && isWiz) tbl = SPELL_SLOTS_TABLES.mage;
    const slots = tbl ? tbl[p.level] : null;
    if (!slots) return;

    let cap = 0;
    for (let i = slots.length - 1; i >= 0; i--) {
      if (slots[i] > 0) { cap = i + 1; break; }
    }
    if (!cap) return;

    // Table 4 caps wizards AND bards -- both learn spells into books and both
    // key off Intelligence. Priests are not affected.
    let capped = false;
    if (isWiz || isBard) {
      if (intMax === 0)      { cap = 0; capped = true; }
      else if (intMax < cap) { cap = intMax; capped = true; }
    }

    if (cap > out.max) {
      out.max = cap; out.intCapped = capped; out.clazz = p.clazz; out.level = p.level;
    }
  });

  return out;
}

function renderKnownSpellStatus(root) {
  const wrap = root.querySelector('.spellbook-known-status');
  const text = root.querySelector('.spellbook-known-text');
  if (!wrap || !text) return;

  const comp = (typeof getWizardComponent === 'function') ? getWizardComponent(root) : null;
  if (!comp) { wrap.style.display = 'none'; return; }

  // Table 4 column 3 is a number below INT 19 and the string "All" from 19 up.
  const int = parseInt(val(root, 'int') || 0, 10);
  const row = (typeof INT_TABLE !== 'undefined') ? INT_TABLE[int] : null;
  const rawCap = row ? row[2] : 0;
  const uncapped = (typeof rawCap === 'string');
  const cap = uncapped ? Infinity : (parseInt(rawCap, 10) || 0);
  // Highest spell level this character may learn -- see getMaxSpellLevel.
  const intMaxLevel = row ? (parseInt(row[4], 10) || 0) : 0;
  const maxSpellLevel = getMaxSpellLevel(root).max;

  if (!uncapped && cap <= 0) {
    // INT below 9 -- cannot be a wizard at all. The spell browser already
    // explains this, so say nothing here rather than showing 0/0 nine times.
    wrap.style.display = 'none';
    return;
  }

  // Tally by level across every spellbook. Level 0 (cantrips) is deliberately
  // excluded -- Table 4 governs the nine wizard spell levels.
  const known = {};
  let freeCount = 0;
  const sbData = (typeof getSpellbooksData === 'function') ? getSpellbooksData(root) : null;
  if (sbData && Array.isArray(sbData.spellbooks)) {
    sbData.spellbooks.forEach(sb => {
      (sb.spells || []).forEach(s => {
        const lv = parseInt(s.level, 10);
        if (lv >= 1 && lv <= 9) {
          known[lv] = (known[lv] || 0) + 1;
          if (s.freeSpell) freeCount++;
        }
      });
    });
  }

  const parts = [];
  let anyOver = false;
  const beyondLevels = [];
  for (let lv = 1; lv <= 9; lv++) {
    const n = known[lv] || 0;
    if (n === 0) continue;                       // don't list levels with nothing recorded
    const over = !uncapped && n > cap;
    // Separate problem from the count: Table 4 also caps the highest spell
    // LEVEL a wizard may learn at all. An INT 9 wizard stops at 4th, so a
    // recorded 6th-level spell is not merely surplus -- it is unlearnable.
    const beyond = maxSpellLevel > 0 && lv > maxSpellLevel;
    if (over) anyOver = true;
    if (beyond) beyondLevels.push(lv);
    const color = (over || beyond) ? '#f44336' : 'var(--text)';
    parts.push('<span style="color:' + color + ';">Level ' + lv + ': ' + n + '/' +
               (beyond ? '\u2014' : (uncapped ? 'All' : cap)) + '</span>');
  }

  if (!parts.length) {
    text.innerHTML = '<span style="color:var(--muted);">No spells recorded' +
      (uncapped ? '' : ' \u2014 Intelligence ' + int + ' allows ' + cap + ' per level') + '</span>';
  } else {
    text.innerHTML = parts.join(' <span style="color:var(--muted);">-</span> ');
    if (beyondLevels.length) {
      const capReason = (maxSpellLevel === intMaxLevel && intMaxLevel > 0)
        ? 'Intelligence ' + int + ' (PHB Table 4)'
        : 'your caster level';
      text.innerHTML += '<div style="margin-top:4px;color:#f44336;font-size:11px;">' +
        'You can learn spells up to level ' + maxSpellLevel + ' \u2014 limited by ' + capReason +
        '. Level ' + beyondLevels.join(', ') +
        ' cannot be learned yet. Nothing is blocked \u2014 check with your DM.</div>';
    }
    if (anyOver) {
      text.innerHTML += '<div style="margin-top:4px;color:#f44336;font-size:11px;">' +
        'Over the Intelligence limit of ' + cap + ' spells per level (PHB Table 4). ' +
        'Nothing is blocked \u2014 check with your DM.</div>';
    }
    if (freeCount > 0) {
      text.innerHTML += '<div style="margin-top:4px;color:var(--muted);font-size:11px;">' +
        'Includes ' + freeCount + ' free specialist spell' + (freeCount === 1 ? '' : 's') +
        '. The PHB grants these without a learn roll but does not exempt them from the ' +
        'per-level maximum, so they are counted.</div>';
    }
  }
  wrap.style.display = '';
}

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

  // Specialist reminders piggyback on this render so they refresh on every
  // class/level/load/spell change without wiring separate call sites.
  renderSpecialistSpellNotes(root);
  renderSpecialistMemorizedStatus(root);
  renderKnownSpellStatus(root);
  renderDruidRole(root);
}

// Specialist spell reminders (PHB Ch.3). Populates two notes for specialist
// wizards and clears them for everyone else:
//   .specialist-slot-note      -- under Spell Slots: the bonus slot + free spell
//                                 rules, kept distinct so the +1 slot (already in
//                                 the counts, own-school) isn't confused with the
//                                 free spell (a separate spellbook entry).
//   .specialist-freespell-note -- above the Spellbook: how many free own-school
//                                 spells have been earned (one per spell level reached).
// Resolve the WIZARD component of a character (single, multi, or dual class):
// returns { clazz, level } for the sub-class that casts wizard spells, or null.
// Lets the specialist features key off the wizard sub-class/sub-level instead of
// the top-level class -- e.g. a gnome fighter/illusionist, or a human dual-classed
// into a specialist. Multi-class: mc_class1..3 / mc_level1..3 (only demihuman
// multi-class specialist is the gnome illusionist). Dual: dc_new_* / dc_original_*.
// Specialist requirement warning banner. ADVISORY ONLY -- it never blocks or
// changes any calculation, matching the no-blocking philosophy of the rest of the
// specialist suite. validateSpecialist() (tables.js) returns an array of problem
// strings from PHB Table 22: ability minimums, race restrictions, and the
// multi-class rule. Empty array -> banner hidden.
function renderSpecialistValidation(root) {
  const el = root.querySelector('.specialist-validation-message');
  if (!el) return;

  const problems = (typeof validateSpecialist === 'function') ? validateSpecialist(root) : [];
  if (!problems || problems.length === 0) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }

  // Race is free text, so escape before injecting into the banner.
  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  el.innerHTML =
    '<strong style="color:var(--warning, #e0a34a);">\u26A0 Specialist requirements (PHB Table 22)</strong>' +
    problems.map(p => '<div style="margin-top:4px;">\u2022 ' + esc(p) + '</div>').join('') +
    '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
      'Advisory only \u2014 nothing is blocked, and your DM may allow exceptions.</div>';
  el.style.display = '';
}

// PHB Ch.3 allows only one class per group (warrior, wizard, priest, rogue), so
// fighter/paladin, thief/bard and cleric/druid are illegal combinations.
// Advisory only, and suppressible entirely via the classGroupLegality override
// in Settings -- a DM may well have approved the combination.
function renderClassGroupValidation(root) {
  const el = root.querySelector('.class-group-validation-message');
  if (!el) return;

  // Six independent advisory checks share this banner. Each has its own
  // Settings toggle and returns [] when switched off, so combining them here
  // needs no extra gating.
  const sources = [
    { heading: 'Class combination (PHB Ch.3)',
      problems: (typeof validateClassGroups === 'function') ? validateClassGroups(root) : [] },
    { heading: 'Class ability minimums (PHB Table 13)',
      problems: (typeof validateClassMinimums === 'function') ? validateClassMinimums(root) : [] },
    { heading: 'Racial ability requirements (PHB Table 7)',
      problems: (typeof validateRaceRequirements === 'function') ? validateRaceRequirements(root) : [] },
    { heading: 'Class not open to this race (PHB Ch.2)',
      problems: (typeof validateRaceClass === 'function') ? validateRaceClass(root) : [] },
    { heading: 'Alignment and class (PHB Ch.4)',
      problems: (typeof validateClassAlignment === 'function') ? validateClassAlignment(root) : [] },
    { heading: 'Alignment and kit (Complete handbooks)',
      problems: (typeof validateKitAlignment === 'function') ? validateKitAlignment(root) : [] }
  ];

  const active   = sources.filter(s => s.problems.length);
  const problems = active.reduce((all, s) => all.concat(s.problems), []);
  if (!problems.length) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }

  // Class and race names are free text, so escape before injecting.
  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // One source gets its own specific heading; two or more fall back to the
  // generic one rather than trying to name every combination.
  const heading = (active.length === 1) ? active[0].heading : 'Character build';

  el.innerHTML =
    '<strong style="color:var(--warning, #e0a34a);">\u26A0 ' + heading + '</strong>' +
    problems.map(p => '<div style="margin-top:4px;">\u2022 ' + esc(p) + '</div>').join('') +
    '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
      'Advisory only \u2014 nothing is blocked. Switch this check off under ' +
      'House Rules &amp; Overrides in Settings if your DM has approved it.</div>';
  el.style.display = '';
}

// PHB Tables 11 and 12. Reports which aging bracket the character has reached
// and the cumulative adjustment, and never changes an ability score.
// Informational, so it uses --info blue rather than the amber reserved for
// actual problems.
function renderAgingEffects(root) {
  const el = root.querySelector('.aging-note');
  if (!el) return;

  const hide = () => { el.style.display = 'none'; el.innerHTML = ''; };

  if (typeof isOptionalRule === 'function' && !isOptionalRule('agingEffects')) return hide();
  if (typeof getAgingStatus !== 'function') return hide();

  const status = getAgingStatus(val(root, 'race'), val(root, 'age'));
  if (!status) return hide();

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = '';

  if (status.current) {
    html += '<strong style="color:var(--info, #6fb3d2);">' + esc(status.current.label) +
            '</strong> \u2014 age ' + status.age + ', reached at ' + status.current.at + '.';
    html += '<div style="margin-top:6px;">Cumulative adjustment: <strong>' +
            esc(formatAgingEffects(status.cumulative)) + '</strong></div>';
    // Only break out the individual brackets once more than one has stacked --
    // with a single bracket the itemised line just repeats the total.
    if (status.reached.length > 1) {
      html += status.reached.map(b =>
        '<div style="margin-top:3px;color:var(--muted);">\u2022 ' + esc(b.label) +
        ' (' + b.at + '): ' + esc(formatAgingEffects(b.effects)) + '</div>').join('');
    }
  } else {
    html += '<strong style="color:var(--info, #6fb3d2);">Prime of life</strong> \u2014 age ' +
            status.age + '. No aging adjustments yet.';
  }

  if (status.next) {
    const nb = (typeof AGING_BRACKETS !== 'undefined')
      ? AGING_BRACKETS.find(b => b.key === status.next.key) : null;
    html += '<div style="margin-top:6px;color:var(--muted);">Next: ' + esc(status.next.label) +
            ' at ' + status.next.at +
            (nb ? ' (' + esc(formatAgingEffects(nb.effects)) + ')' : '') + '.</div>';
  }

  html += '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
          'PHB Table 12. Advisory only \u2014 no ability score is changed for you. ' +
          'Apply these by hand if your table uses them.</div>';

  el.innerHTML = html;
  el.style.display = '';
}

// PHB Table 7 footnote: "Halfling fighters do not roll for exceptional
// Strength." Locks AND clears the field, because getStrengthData() and
// getEncumbranceData() take scalars and cannot see race -- a value left sitting
// in the input would still be read and applied.
function renderExceptionalStrengthLock(root) {
  const input = root.querySelector('[data-field="str_exceptional"]');
  const note  = root.querySelector('.str-exceptional-note');
  if (!input) return;

  const permitted = (typeof racePermitsExceptionalStrength !== 'function') ||
                    racePermitsExceptionalStrength(val(root, 'race'));

  if (permitted) {
    input.readOnly = false;
    input.style.opacity = '';
    input.style.cursor = '';
    if (note) { note.style.display = 'none'; note.innerHTML = ''; }
    return;
  }

  if (input.value) input.value = '';
  input.readOnly = true;
  input.style.opacity = '0.5';
  input.style.cursor = 'not-allowed';
  if (note) {
    note.innerHTML = 'Locked \u2014 PHB Table 7: halfling fighters do not roll for exceptional Strength.';
    note.style.display = '';
  }
}

function getWizardComponent(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const isWiz = (c) => !!c && (typeof isWizardClass === 'function') && isWizardClass(c);

  if (charType === 'multi') {
    const parts = [
      { clazz: val(root, 'mc_class1') || '', level: parseInt(val(root, 'mc_level1') || 0, 10) },
      { clazz: val(root, 'mc_class2') || '', level: parseInt(val(root, 'mc_level2') || 0, 10) },
      { clazz: val(root, 'mc_class3') || '', level: parseInt(val(root, 'mc_level3') || 0, 10) }
    ];
    return parts.find(p => isWiz(p.clazz)) || null;
  }

  if (charType === 'dual') {
    const nw   = { clazz: val(root, 'dc_new_class') || '', level: parseInt(val(root, 'dc_new_level') || 0, 10) };
    const orig = { clazz: val(root, 'dc_original_class') || '', level: parseInt(val(root, 'dc_original_level') || 0, 10) };
    if (isWiz(nw.clazz)) return nw;
    if (isWiz(orig.clazz)) return orig;
    return null;
  }

  // single-class
  const clazz = val(root, 'clazz') || '';
  if (isWiz(clazz)) return { clazz: clazz, level: parseInt(val(root, 'level') || 0, 10) };
  return null;
}

function renderSpecialistSpellNotes(root) {
  const slotNote = root.querySelector('.specialist-slot-note');
  const freeNote = root.querySelector('.specialist-freespell-note');
  if (!slotNote && !freeNote) return;

  const component = (typeof getWizardComponent === 'function') ? getWizardComponent(root) : null;
  const school = (component && typeof getSpecialistSchool === 'function') ? getSpecialistSchool(component.clazz) : null;

  // Not a specialist -> clear/hide both notes and hide every free-spell checkbox.
  if (!school) {
    if (slotNote) { slotNote.innerHTML = ''; slotNote.style.display = 'none'; }
    if (freeNote) { freeNote.innerHTML = ''; freeNote.style.display = 'none'; }
    root.querySelectorAll('.spellbook-list .item .free-spell-row').forEach(r => { r.style.display = 'none'; });
    return;
  }

  if (slotNote) {
    slotNote.innerHTML =
      '<strong style="color:var(--accent-light);">' + school + ' specialist:</strong>' +
      '<div style="margin-top:3px;">\u2022 <strong>Bonus slot:</strong> +1 slot at each castable level ' +
        '(already in the counts above) \u2014 to use it at a given level you must memorize at least one ' + school + ' spell at that level.</div>' +
      '<div style="margin-top:3px;">\u2022 <strong>Free spell:</strong> one ' + school + ' spell is added to your ' +
        'spellbook each time you reach a new spell level \u2014 no learn roll needed.</div>' +
      '<div style="margin-top:3px;">\u2022 <strong>Two separate perks:</strong> the bonus slot is a memorization slot (tracked under Spells Memorized); the free spell is a spell added to your spellbook (tracked below). Claiming one has nothing to do with the other.</div>';
    slotNote.style.display = '';
  }

  // Earned = number of wizard spell levels reached (one free spell each), from the
  // wizard SUB-level via getWizardComponent so single/multi/dual all work.
  let earned = 0;
  if (typeof SPELL_SLOTS_TABLES !== 'undefined' && SPELL_SLOTS_TABLES.mage) {
    const rows = SPELL_SLOTS_TABLES.mage;
    let row = rows[component.level];
    if (!row && component.level > 0) {
      const maxLvl = Math.max.apply(null, Object.keys(rows).map(k => parseInt(k, 10)));
      row = rows[Math.min(component.level, maxLvl)];
    }
    if (Array.isArray(row)) earned = row.filter(n => n > 0).length;
  }

  // Show a "Free [school] spell" checkbox on OWN-SCHOOL spellbook entries only.
  root.querySelectorAll('.spellbook-list .item').forEach(item => {
    const rowEl = item.querySelector('.free-spell-row');
    if (!rowEl) return;
    const sd = item._spellData || {};
    const own = (typeof isSpecialtySpell === 'function') &&
      isSpecialtySpell({ school: sd.schoolSphere || '', level: sd.level }, component.clazz);
    if (own) {
      const labelEl = rowEl.querySelector('.free-spell-label');
      if (labelEl) labelEl.textContent = 'Free ' + school + ' spell';
      rowEl.style.display = '';
    } else {
      rowEl.style.display = 'none';
    }
  });

  // Used = raw count of claimed free spells across ALL of the character's spellbooks.
  let used = 0;
  if (typeof getSpellbooksData === 'function') {
    const sbData = getSpellbooksData(root);
    if (sbData && Array.isArray(sbData.spellbooks)) {
      used = sbData.spellbooks.reduce((n, sb) => n + ((sb.spells || []).filter(s => s.freeSpell).length), 0);
    }
  }

  if (freeNote) {
    let usedColor = 'var(--text)';                     // partial (used < earned)
    if (used > earned) usedColor = '#f44336';          // over-claim -> red
    else if (used === earned && earned > 0) usedColor = '#4caf50'; // fully claimed -> green

    freeNote.innerHTML =
      '<div><strong style="color:var(--accent-light);">Free ' + school + ' spells earned:</strong> ' + earned +
        ' <span style="color:var(--muted);">(one per spell level reached \u2014 add from the browser, no learn roll)</span></div>' +
      '<div style="margin-top:3px;"><strong style="color:var(--accent-light);">Free ' + school + ' spells used:</strong> ' +
        '<span style="color:' + usedColor + ';">' + used + '</span>' +
        ' <span style="color:var(--muted);">(tick \u201cFree ' + school + ' spell\u201d on the ' + school + ' spells in your book)</span></div>';
    freeNote.style.display = '';
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
  // PHB Ch.14 movement rates.
  //
  // ORDER IS LOAD-BEARING. The loop below tests race.includes(raceKey) and
  // breaks on the first hit, and "half-elf" contains "elf" -- so the half-elf
  // keys must sit ahead of the bare 'elf' key or a half-elf resolves through
  // 'elf' and reports its race name as "Elf". Both are 12 today so nothing is
  // visibly wrong, but the ordering matters the moment they diverge.
  const raceMovement = {
    'half-elf': 12,
    'half elf': 12,
    'halfelf': 12,
    'human': 12,
    'elf': 12,
    'dwarf': 6,
    'halfling': 6,
    'gnome': 6
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
  
  // Encumbrance movement penalties -- OPTIONAL RULE, off by default.
  // When ENCUMBRANCE_RULES_ENABLED is false, encumbrance is purely
  // informational: the category still displays, but movement is never reduced.
  let currentMovement = baseMovement;
  let encumbranceNote = "";

  if (typeof isOptionalRule === "function" && isOptionalRule("encumbrancePenalties")) {
    // PHB "Effects of Encumbrance" (Basic/Tournament rule):
    // Light reduces movement by 1/3, Moderate by 1/2, Heavy by 2/3,
    // and Severe lowers the movement rate to 1. Round fractions down.
    if (category === "Light") {
      currentMovement = Math.floor(baseMovement * 2 / 3);
      encumbranceNote = " (Light Load)";
    } else if (category === "Moderate") {
      currentMovement = Math.floor(baseMovement * 1 / 2);
      encumbranceNote = " (Moderate Load)";
    } else if (category === "Heavy") {
      currentMovement = Math.floor(baseMovement * 1 / 3);
      encumbranceNote = " (Heavy Load)";
    } else if (category === "Severe") {
      currentMovement = 1;
      encumbranceNote = " (Severe Load)";
    } else if (category === "Overloaded!") {
      currentMovement = 0;
      encumbranceNote = " (Overloaded!)";
    }
  } else if (category && category !== "Unencumbered" && category !== "—") {
    // Informational only -- flag the load without touching the numbers.
    encumbranceNote = " (" + category.replace("!", "") + " load -- no penalty applied)";
  }
  
  // Derived multiplier -- retained for the tooltip and color coding below.
  // With encumbrance rules off this is always 1.0, so movement renders normally.
  const movementMultiplier = baseMovement > 0 ? currentMovement / baseMovement : 1;

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
