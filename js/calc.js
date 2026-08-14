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

 // Spell Immunity — PHB Table 5. Keys off the WIS score ALONE, no class gate...
  // A WIS 19 fighter is just as immune to charm person as a WIS 19 cleric...
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

    // Build tooltip.
    //
    // SCOPE: settled from PHB Ch.1, Wisdom. The Magical Defense Adjustment
    // "applies to saving throws against magical spells that attack the mind:
    // beguiling, charm, fear, hypnosis, illusions, possession, suggestion, etc."
    //
    // The criterion is FUNCTIONAL, not school-based, and the list is open-ended.
    // Illusions and possession are named explicitly, so this is not an
    // Enchantment/Charm rule -- Ch.7's passing line to that effect is a
    // simplification and the defining chapter wins. The field label "Spell
    // (Mental)" is correct as it stands; do not narrow it to one school.
    const sign = adj >= 0 ? "+" : "";
    const modSign = manualMod >= 0 ? "+" : "";
    mentalSaveEl.title = `Spell (Mental) Save\nBase Spell Save: ${base}\nWIS MDA: ${sign}${adj}${manualMod !== 0 ? `\nManual Mod: ${modSign}${manualMod}` : ""}\nFinal: ${total}\n\nApplies to "magical spells that attack the mind: beguiling, charm, fear,\nhypnosis, illusions, possession, suggestion, etc." (PHB Ch.1, Wisdom).\nThe list is open-ended and is NOT limited to one school -- illusions and\npossession are named explicitly. Applied automatically, with no conscious\neffort from the character.`;
  }
}

// PHB Table 6. Charisma writes six read-only fields across three tabs.
//
// SCORE 1 IS VALID and was being excluded. CHA_TABLE defines it -- reaction -7,
// no henchmen at all, loyalty -8 -- but the old guard began at 2, so a
// Charisma 1 character kept whatever the last valid score had left in the boxes.
//
// The invalid branch now CLEARS instead of returning early. That is the same
// defect fixed on the Dexterity branch during the Chapter 11 pass: an early
// return leaves stale numbers on screen where they read as current.
//
// ONE WRITER PER FIELD. henchmen_max and loyalty_base were each written twice,
// once through val() and again through a querySelector block below it. Both
// wrote the same value so nothing looked wrong -- but two writers for one field
// is exactly how the AC variants drifted. Do not reintroduce the second block.
function renderCharismaEffects(root) {
  const FIELDS = ['henchmen_max', 'loyalty_base', 'cha_reaction_core',
                  'cha_max_henchmen_core', 'cha_loyalty_core', 'reaction_adj'];

  const cha = parseInt(val(root, "cha") || 0, 10);
  const effects = (cha >= 1 && cha <= 25) ? CHA_TABLE[cha] : null;

  if (!effects) {
    FIELDS.forEach(f => val(root, f, ''));
    return;
  }

  const adjStr = (effects.reaction >= 0 ? "+" : "") + effects.reaction;

  // Details tab
  val(root, "henchmen_max", effects.henchmen);
  val(root, "loyalty_base", effects.loyalty);

  // Core tab
  val(root, "cha_reaction_core",     adjStr);
  val(root, "cha_max_henchmen_core", effects.henchmen);
  val(root, "cha_loyalty_core",      effects.loyalty);

  // Followers tab
  val(root, "reaction_adj", adjStr);
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
// ===== Enchantment gating, shared by the armor, weapon and ammunition cards =====
// THE RULE: a bonus only counts when its row is ticked Enchanted. Unticking
// HIDES the fields rather than clearing them, so the recorded numbers survive --
// which means a hidden value would otherwise go on silently improving AC or
// to-hit with nothing on screen to explain it. That is the bug the checkbox
// exists to prevent, and this is the single place that prevents it.
//
// A row with NO checkbox falls through and reads its value as before, so any
// card not yet converted keeps working.
function itemIsEnchanted(itemEl) {
  if (!itemEl) return false;
  const chk = itemEl.querySelector('.is-magical');
  return chk ? !!chk.checked : true;
}

function itemMagicBonus(itemEl, selector) {
  if (!itemEl || !itemIsEnchanted(itemEl)) return 0;
  return parseInt((itemEl.querySelector(selector) || {}).value, 10) || 0;
}

// Resolve the ammunition a weapon row is set to fire, and what it grants.
// The link is BY NAME, matching the weapon card's dropdown -- see the note
// there. A selection that no longer matches any record returns missing:true
// rather than null, so the Quick Reference can say so instead of quietly
// dropping it.
// Returns null only when nothing is selected.
function getWeaponAmmoBonus(root, weaponEl) {
  if (!root || !weaponEl) return null;
  const name = ((weaponEl.querySelector('.weapon-ammo') || {}).value || '').trim();
  if (!name) return null;

  const row = Array.from(root.querySelectorAll('.ammunition-list .item'))
    .find(n => ((n.querySelector('.title') || {}).value || '').trim() === name);
  if (!row) return { name: name, missing: true, hit: 0, dmg: 0 };
  if (!itemIsEnchanted(row)) return { name: name, missing: false, hit: 0, dmg: 0 };

  // Same inheritance rule as the weapon card: blank inherits the enchantment
  // level, "0" is a real override meaning explicitly nothing.
  const m = itemMagicBonus(row, '.ammo-magic-bonus');
  const rawHit = (row.querySelector('.ammo-hit-adj') || {}).value;
  const rawDmg = (row.querySelector('.ammo-dmg-adj') || {}).value;
  const has = v => v !== '' && v !== undefined && v !== null;
  return {
    name: name,
    missing: false,
    hit: has(rawHit) ? (parseInt(rawHit, 10) || 0) : m,
    dmg: has(rawDmg) ? (parseInt(rawDmg, 10) || 0) : m
  };
}

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
  // The rail is a GRID CHILD now, not a border-left. A single-sided border
  // fights the card's border-radius, and the old inline borderLeft plus
  // paddingLeft:8px shifted the whole card's padding to make room for itself.
  // The colour still lives here -- one resolver, one answer -- but it is
  // expressed as a class so the stylesheet owns the paint.
  const statusKey = isSpecialized           ? 'specialized'
                  : status === 'proficient' ? 'proficient'
                  : status === 'related'    ? 'related'
                  : 'notprof';
  const railEl = rowEl.querySelector('.rail');
  if (railEl) railEl.className = 'rail ' + statusKey;
  // The word beside the rail. Colour alone is a code the reader must learn and
  // is invisible to anyone who cannot separate those hues, so the text carries
  // the meaning and the rail only accelerates it. Penalties are shown because a
  // penalty you cannot see is one you forget you are taking.
  // NOT `statusEl` -- that name is taken at the top of this function by the
  // .weapon-prof-status DROPDOWN, whose value is read as the manual override.
  // Two different things called status live in this scope: the override the
  // player chose, and the resolved answer shown on the card.
  const statusWordEl = rowEl.querySelector('.status');
  if (statusWordEl) {
    statusWordEl.className = 'status ' + statusKey;
    statusWordEl.textContent = isSpecialized           ? 'SPECIALIZED'
                             : status === 'proficient' ? 'PROFICIENT'
                             : status === 'related'    ? 'RELATED (' + penalty + ')'
                             : 'NOT PROF. (' + penalty + ')';
  }

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

// PHB Ch.9, Attacking With Two Weapons -- the character-level state, resolved
// once per render.
//
// WHICH WEAPON IS WHICH: the off-hand is whichever EQUIPPED row has the
// checkbox ticked; every other equipped MELEE row is a main-hand weapon.
// Missile weapons are excluded deliberately -- you cannot draw a bow with a
// weapon in each hand, and a melee stance penalty on a bow would be wrong twice
// over.
//
// Returns { active: false } when the stance is not in force, so every caller
// can bail on a single test.
function getTwoWeaponState(root) {
  const isEquipped = el => {
    const c = el.querySelector('.equipped');
    return !!(c && c.checked);
  };
  // A blank category is treated as melee: an un-migrated row is far more likely
  // to be a sword than a bow, and the alternative silently drops the penalty.
  const isMelee = el => {
    const cat = ((el.querySelector('.weapon-category') || {}).value || '').toLowerCase();
    return !cat || cat.indexOf('melee') !== -1;
  };

  const equipped = qsa(root, '.weapons-list .item').filter(isEquipped);
  // [0] takes the FIRST equipped weapon with the box ticked. The UI lets you
  // tick as many as you like and every one after the first is silently ignored
  // -- the same ambiguity ambiguousMain already warns about, one step earlier.
  // PHB Ch.9 assumes exactly one main and one off-hand: the -2/-4 pair and the
  // single extra attack are both written for that case. Advisory, never
  // blocking -- the tool warns but does not prevent.
  const offRows = equipped.filter(el => {
    const c = el.querySelector('.weapon-offhand');
    return !!(c && c.checked);
  });
  const offRow = offRows[0] || null;
  const ambiguousOff = offRows.length > 1;

  if (!offRow) return { active: false };

  const mainRows = equipped.filter(el => el !== offRow && isMelee(el));

  const pen = (typeof getTwoWeaponPenalties === 'function')
    ? getTwoWeaponPenalties(root)
    : { main: 0, off: 0, exempt: false, reactionAdj: 0, reason: '' };

  // Legality is judged against the FIRST main-hand weapon. With more than one
  // equipped the choice is arbitrary, which is worth saying out loud rather
  // than silently picking one and pronouncing on it -- hence ambiguousMain.
  const sizeOf = el => (typeof getWeaponSizeAndWeight === 'function')
    ? getWeaponSizeAndWeight(el) : null;
  const main = mainRows.length ? sizeOf(mainRows[0]) : null;
  const off  = sizeOf(offRow);
  // pen.styleSpec is set on BOTH return paths of getTwoWeaponPenalties, so a
  // ranger gets the equal-length permission too -- PHBR1 p.64 says he gains no
  // bonus to hit from the slot but does get this half of it.
  const legality = (main && off && typeof isLegalOffhandWeapon === 'function')
    ? isLegalOffhandWeapon(main, off, !!pen.styleSpec)
    : { legal: null, reason: '' };

  // "Nor can the character use a shield, unless it is kept strapped onto his
  // back" -- i.e. not in use. An EQUIPPED shield contradicts the stance.
  // .armor-slot holds the wear location with .armor-type as the legacy
  // fallback, matching how renderAC reads it.
  const shieldNames = Array.from(root.querySelectorAll('.armor-list .item'))
    .filter(isEquipped)
    .filter(item => (((item.querySelector('.armor-slot') ||
                       item.querySelector('.armor-type') || {}).value) || 'Armor') === 'Shield')
    .map(item => (((item.querySelector('.title') || {}).value) || 'shield').trim());

  return {
    active: true,
    pen: pen,
    offRow: offRow,
    mainRows: mainRows,
    noMainHand: mainRows.length === 0,
    ambiguousMain: mainRows.length > 1,
    ambiguousOff: ambiguousOff,
    legality: legality,
    shieldNames: shieldNames
  };
}

// ===== Condition ability effects =====
// What each ability score reaches. `effects` are PURE TABLE LOOKUPS off the
// current score and are safe to restate. `deferred` are CUMULATIVE OR ALREADY
// SPENT -- hit points banked across levels, languages already chosen, a
// spellbook that already exists -- and must never be restated as a number.
// Saying less beats stating a figure that is not true. See P8 in the notes.
const CONDITION_ABILITY_TOUCHES = {
  str: { label: 'Strength', effects: ['To-Hit Adj.', 'Damage Adj.', 'Weight Allowance',
         'Open Doors', 'Bend Bars/Lift Gates', 'encumbrance ceilings'], deferred: [] },
  dex: { label: 'Dexterity', effects: ['Reaction Adjustment', 'Missile Attack Adj.',
         'Defensive Adj. (AC)', 'thief skill percentages'], deferred: [] },
  con: { label: 'Constitution', effects: ['System Shock %', 'Resurrection Survival %',
         'Poison Save Adj.'], deferred: ['HP Bonus/Level (already banked across levels)'] },
  int: { label: 'Intelligence', effects: ['Spell Immunity'],
         deferred: ['Additional Languages (already chosen)',
                    'Learn Spell % and Max Spells/Level (govern a spellbook that exists)'] },
  wis: { label: 'Wisdom', effects: ['Magical Defense Adj.'],
         deferred: ['Bonus Priest Spells (already memorized)'] },
  cha: { label: 'Charisma', effects: ['Reaction Adjustment', 'Max Henchmen',
         'Loyalty Base'], deferred: [] }
};

// Which SAVING THROWS an ability actually reaches -- traced, not assumed.
// Wisdom hits Spell (Mental) only, for everyone. Constitution hits saves for
// three demihuman races only, via RACE_SAVE_BONUSES, and the gnome entry has
// NO poison clause. ABILITY_SAVE_BONUSES is empty by design: no other ability
// grants a saving throw bonus in 2e.
function conditionAffectedSaves(root, key) {
  if (key === 'wis') return ['Spell (Mental)'];
  if (key !== 'con') return [];
  const race = (typeof getRaceKey === 'function') ? getRaceKey(val(root, 'race')) : null;
  if (race === 'dwarf' || race === 'halfling') {
    return ['Paralyzation/Poison/Death', 'Rod/Staff/Wand', 'Spell'];
  }
  if (race === 'gnome') return ['Rod/Staff/Wand', 'Spell'];
  return [];
}

// Values that ACTUALLY CHANGE between the recorded score and the adjusted one.
// Rows where nothing moves are omitted on purpose: these tables are banded --
// DEX_TABLE is flat from 7 to 14, CON_POISON_ADJ from 3 to 18 -- so most -1s
// change nothing, and printing "+1 -> +1" trains the reader to skim.
//
// ALLOW-LIST ONLY. Every table here is a pure lookup off the current score.
// CON_HP_BONUS, INT_TABLE's language and spell columns and the priest bonus
// spells are deliberately ABSENT: those are cumulative or already spent, and
// restating them as a number would be a lie. See P8 in the project notes.
function conditionAbilityValueRows(root, key, base, now, adj) {
  const rows = [];
  const sgn  = v => (typeof v === 'number' && v > 0) ? '+' + v : String(v);
  const pct  = v => v + '%';
  const DASH = '\u2014';

  const at = (tbl, s, fmt, dflt) => {
    const v = tbl ? tbl[s] : undefined;
    if (v === undefined || v === null) return dflt;
    return fmt ? fmt(v) : v;
  };
  const push = (label, a, b) => {
    if (a === undefined || b === undefined) return;
    if (String(a) === String(b)) return;
    rows.push({ label: label, from: a, to: b });
  };

  if (key === 'str') {
    const clazz = val(root, 'clazz');
    const exc0  = val(root, 'str_exceptional') || '';
    const a = getStrengthData(base, exc0, clazz) || [];
    const b = getStrengthData(now, adj.strExceptional, clazz) || [];
    ['To-Hit Adj.', 'Damage Adj.', 'Weight Allowance', 'Open Doors', 'Bend Bars/Lift Gates']
      .forEach((L, i) => push(L, i < 2 ? sgn(a[i]) : a[i], i < 2 ? sgn(b[i]) : b[i]));
    const ea = getEncumbranceData(base, exc0, clazz);
    const eb = getEncumbranceData(now, adj.strExceptional, clazz);
    if (ea && eb) push('Max Carried Weight', ea[4], eb[4]);

  } else if (key === 'dex') {
    const a = DEX_TABLE[base] || [], b = DEX_TABLE[now] || [];
    ['Reaction Adjustment', 'Missile Attack Adj.', 'Defensive Adj. (AC)']
      .forEach((L, i) => push(L, sgn(a[i]), sgn(b[i])));

  } else if (key === 'con') {
    push('System Shock %', at(CON_SYSTEM_SHOCK, base, pct), at(CON_SYSTEM_SHOCK, now, pct));
    push('Resurrection Survival %', at(CON_RESURRECTION, base, pct), at(CON_RESURRECTION, now, pct));
    push('Poison Save Adj.', at(CON_POISON_ADJ, base, sgn), at(CON_POISON_ADJ, now, sgn));
    push('Regeneration', at(CON_REGENERATION, base, null, DASH), at(CON_REGENERATION, now, null, DASH));

  } else if (key === 'int') {
    push('Spell Immunity', at(INT_TABLE, base, r => r[3] || DASH),
                           at(INT_TABLE, now,  r => r[3] || DASH));

  } else if (key === 'wis') {
    push('Magical Defense Adj.', at(WIS_MDA, base, sgn), at(WIS_MDA, now, sgn));
    push('Spell Failure (priests)', at(WIS_FAILURE, base, null, DASH),
                                    at(WIS_FAILURE, now,  null, DASH));
    push('Spell Immunity', at(WIS_IMMUNITIES, base, null, DASH),
                           at(WIS_IMMUNITIES, now,  null, DASH));

  } else if (key === 'cha') {
    const a = CHA_TABLE[base] || {}, b = CHA_TABLE[now] || {};
    push('Reaction Adjustment', sgn(a.reaction), sgn(b.reaction));
    push('Max Henchmen', a.henchmen, b.henchmen);
    push('Loyalty Base', sgn(a.loyalty), sgn(b.loyalty));
  }

  return rows;
}

// DISPLAY ONLY. Reads the resolver and writes three containers; never touches a
// recorded score. <details> rather than title= on purpose -- tooltips do not
// fire on touch and this expanding list is the entire payload.
function renderConditionAbilityEffects(root) {
  const panel   = root.querySelector('.combat-ability-effects');
  const savesB  = root.querySelector('.saves-condition-banner');
  const fxB     = root.querySelector('.ability-effects-condition-banner');
  const hide = el => { if (el) { el.innerHTML = ''; el.style.display = 'none'; } };

  const adj = (typeof getConditionAdjustedAbilities === 'function')
    ? getConditionAdjustedAbilities(root) : { any: false, delta: {} };

  const keys = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    .filter(k => adj.delta && adj.delta[k]);

  // savesWorseUnstated fires the saves banner ON ITS OWN -- Surprised changes no
  // ability score, so without this the one section that needs to mention it
  // would stay silent. Second call to getActiveConditionEffects in this render;
  // it is a pure DOM read and renderCombatQuickReference already calls it twice.
  const fx        = (typeof getActiveConditionEffects === 'function')
    ? getActiveConditionEffects(root) : {};
  const worse     = !!fx.savesWorseUnstated;
  const worseFrom = (fx.sources && fx.sources.savesWorseUnstated) || [];

  if (!keys.length) {
    hide(panel); hide(fxB);
    if (worse && savesB) {
      savesB.innerHTML = '<strong>\u26A0 Saving throws are worse</strong> by an amount the rules ' +
        'do not state. From: ' + escapeHtml(worseFrom.join(', ')) + '.';
      savesB.style.display = '';
    } else {
      hide(savesB);
    }
    return;
  }

  const sign = n => (n > 0 ? '+' : '\u2212') + Math.abs(n);
  let html = '<div style="font-weight:600;margin-bottom:4px;color:var(--warning);">' +
             '\u26A0 Ability scores changed by conditions</div>';

  keys.forEach(k => {
    const t     = CONDITION_ABILITY_TOUCHES[k];
    const saves = conditionAffectedSaves(root, k);
    const src   = (adj.sources[k] || []).join(', ');
    const rows = conditionAbilityValueRows(root, k, adj.base[k], adj.adjusted[k], adj);
    let body = '';
    if (saves.length) {
      body += '<div><strong>Saving throws:</strong> ' + escapeHtml(saves.join(', ')) +
              ' \u2014 recompute from the adjusted score</div>';
    }
    if (rows.length) {
      body += '<div><strong>Ability effects:</strong></div>';
      rows.forEach(r => {
        body += '<div style="padding-left:8px;">' + escapeHtml(r.label) + ': ' +
                escapeHtml(String(r.from)) + ' \u2192 <strong>' +
                escapeHtml(String(r.to)) + '</strong></div>';
      });
    } else {
      body += '<div style="color:var(--muted);">No listed effect changes at this score ' +
              '\u2014 the tables are banded. Checked: ' + escapeHtml(t.effects.join(', ')) + '</div>';
    }
    t.deferred.forEach(d => {
      body += '<div style="color:var(--muted);">' + escapeHtml(d) +
              ' \u2014 affected; see your DM</div>';
    });
    if (src) {
      body += '<div style="color:var(--muted);margin-top:2px;">From: ' + escapeHtml(src) + '</div>';
    }
    html += '<details class="disclosure" style="margin-bottom:2px;">' +
            '<summary>' + escapeHtml(t.label.slice(0, 3).toUpperCase()) + ' ' + sign(adj.delta[k]) +
            ' (now ' + adj.adjusted[k] + ')</summary>' +
            '<div style="padding:2px 0 4px 12px;line-height:1.5;">' + body + '</div>' +
            '</details>';
  });

  if (panel) { panel.innerHTML = html; panel.style.display = ''; }

  // The two banners are POINTERS, not a second copy of the numbers. They name
  // the attributes so the player knows whether this section is affected at all,
  // and send him to the one place that carries the arithmetic.
  const named = keys.map(k => CONDITION_ABILITY_TOUCHES[k].label.slice(0, 3).toUpperCase() +
                              ' ' + sign(adj.delta[k])).join(', ');
  const savesKeys = keys.filter(k => conditionAffectedSaves(root, k).length);

  if (fxB) {
    // Name the sources here too. The savesWorseUnstated line says "From:
    // Surprised" and this one said only "from active conditions" -- one banner,
    // two conventions, which reads as a bug even though both were correct.
    const fxFrom = keys.reduce((acc, k) =>
      acc.concat((adj.sources[k] || []).filter(s => acc.indexOf(s) === -1)), []).join(', ');
    fxB.innerHTML = '<strong>\u26A0 ' + escapeHtml(named) + '.</strong> ' +
      'These boxes show your RECORDED scores and are not adjusted. See the Combat ' +
      'Quick Reference in the sidebar for what each change reaches. ' +
      'From: ' + escapeHtml(fxFrom) + '.';
    fxB.style.display = '';
  }

  if (savesB) {
    const parts = [];
    if (savesKeys.length) {
      const savesNamed = savesKeys.map(k =>
        CONDITION_ABILITY_TOUCHES[k].label.slice(0, 3).toUpperCase() + ' ' + sign(adj.delta[k])).join(', ');
      const savesFrom = savesKeys.reduce((acc, k) =>
        acc.concat((adj.sources[k] || []).filter(s => acc.indexOf(s) === -1)), []).join(', ');
      parts.push('<strong>\u26A0 ' + escapeHtml(savesNamed) + '.</strong> ' +
                 'These targets are not adjusted. See the Combat Quick Reference in the ' +
                 'sidebar. From: ' + escapeHtml(savesFrom) + '.');
    }
    if (worse) {
      parts.push('<strong>\u26A0 Saving throws are worse</strong> by an amount the rules do not ' +
                 'state. From: ' + escapeHtml(worseFrom.join(', ')) + '.');
    }
    if (!parts.length) { hide(savesB); return; }
    savesB.innerHTML = parts.map(p => '<div>' + p + '</div>').join('');
    savesB.style.display = '';
  }
}

// ===== Combat Quick Reference =====
function renderCombatQuickReference(root) {
  // FIRST, not last: this function returns early at `if (!weaponsList) return;`
  // further down, so anything at the bottom would not run for a character
  // whose weapons list is missing.
  renderConditionAbilityEffects(root);

  // Get ability scores
  const dex = parseInt(val(root, 'dex') || 10, 10);
  const str = parseInt(val(root, 'str') || 10, 10);
  const strExceptional = val(root, 'str_exceptional') || '';
  
  // Get combat stats
  const clazz = val(root, 'clazz');

  // THAC0 is resolved in exactly one place -- renderAttackMatrix -- and stashed
  // on root, the same arrangement renderArmorClass uses for _acBreakdown.
  //
  // This used to call getThac0(val(root,'clazz'), val(root,'level')) directly.
  // For a multi- or dual-class character the `clazz` field holds a DISPLAY
  // string like "Cleric 7/Fighter 9", which getClassCategory substring-matched
  // to a single category belonging to neither class, and `level` holds a figure
  // that need not match it -- producing a THAC0 the character has under no
  // class. It also skipped the STR and DEX to-hit adjustments entirely, so even
  // single-class sheets disagreed with their own attack matrix.
  //
  // Called lazily because the Quick Reference renders during character load,
  // before the first full recalculation.
  if (!root._thac0 && typeof renderAttackMatrix === 'function') renderAttackMatrix(root);
  const thac0Data    = root._thac0 || null;
  const thac0Base    = thac0Data ? thac0Data.base    : null;
  const thac0Melee   = thac0Data ? thac0Data.melee   : null;
  const thac0Missile = thac0Data ? thac0Data.missile : null;

  const ac = val(root, 'ac') || '—';
  const moveRate = val(root, 'movement_current') || '—';
  
  // Calculate current HP
  const maxHP = parseInt(val(root, 'hp') || 0, 10);
  const damageTaken = parseInt(val(root, 'damage_taken') || 0, 10);
  const currentHP = Math.max(0, maxHP - damageTaken);
  const hpDisplay = currentHP + '/' + maxHP;
  
  // PHB Ch.9: Dexterity does NOT modify initiative in 2e. Low roll wins.
  //
  // Condition modifiers ARE shown here, because unlike the Table 55 situational
  // list they are states the character is already in -- a hasted character has
  // his -2 whether or not he remembers it. Sign is stated in words: initiative
  // is low-roll-wins, so a negative modifier means acting SOONER, which reads
  // backwards to anyone expecting bigger-is-better.
  const initFx = (typeof getActiveConditionEffects === 'function')
    ? getActiveConditionEffects(root) : { initiativeMod: 0, sources: {} };
  const initMod = initFx.initiativeMod || 0;
  const initiativeStr = initMod
    ? 'd10' + (initMod > 0 ? '+' : '') + initMod + ' (low wins, ' +
      (initMod < 0 ? 'sooner' : 'later') + ')'
    : 'd10 (low wins)';
  
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
  
  // PHB Ch.9 conditions. The quick reference shows what the character is
  // ACTUALLY operating at right now; the main sheet keeps his own numbers.
  // Conditions are transient and the sheet autosaves, so writing +4 AC into the
  // field would leave a player who saved while Slowed permanently wrong. This is
  // derived every render and cannot persist a mistake.
  //
  // Unlike parrying, which is a CHOSEN action and shows "what you would defend
  // at if you spent the round", a condition is an ACTUAL state -- so it changes
  // the headline figure rather than sitting beside it.
  const condFx = (typeof getActiveConditionEffects === 'function')
    ? getActiveConditionEffects(root)
    : { any: false, acPenalty: 0, sources: {} };

  // Negating Dexterity combat bonuses costs the character his defensive
  // adjustment, which is a NEGATIVE number improving AC -- so removing it is a
  // positive AC penalty. DEX_TABLE index 2 is the Defensive Adjustment.
  let condAcPenalty = condFx.acPenalty || 0;
  const dexDefAdj = (typeof DEX_TABLE !== 'undefined' && DEX_TABLE[dex])
    ? DEX_TABLE[dex][2] : 0;
  if (condFx.negatesDexCombat && dexDefAdj < 0) condAcPenalty += -dexDefAdj;

  const acBase = parseInt(ac, 10);
  const acShown = (!isNaN(acBase) && condAcPenalty) ? acBase + condAcPenalty : ac;

  if (initiativeEl) {
    initiativeEl.textContent = initiativeStr;
    initiativeEl.style.color = initMod
      ? (initMod < 0 ? 'var(--success, #4ade80)' : 'var(--error, #ff6b6b)')
      : '';
    initiativeEl.title = initMod
      ? 'Active conditions modify initiative by ' + (initMod > 0 ? '+' : '') + initMod +
        ': ' + (initFx.sources.initiativeMod || []).join(', ') +
        '.\nInitiative is low-roll-wins, so a negative modifier means acting sooner.'
      : '';
  }
  if (thac0El) {
    if (thac0Data) {
      const thac0Sign = n => (n >= 0 ? '+' : '') + n;
      // Mirrors the gold header above the attack matrix. Collapsed to one number
      // when STR and DEX adjustments happen to agree, because "17 melee / 17
      // missile" is two numbers where the character has one.
      thac0El.textContent = (thac0Melee === thac0Missile)
        ? String(thac0Melee)
        : thac0Melee + ' melee / ' + thac0Missile + ' missile';
      thac0El.title =
        'Base ' + thac0Base + ' from class and level.\n' +
        'Melee ' + thac0Melee + ' (STR to-hit ' + thac0Sign(thac0Data.strAdj) + ').\n' +
        'Missile ' + thac0Missile + ' (DEX missile ' + thac0Sign(thac0Data.dexAdj) + ').\n\n' +
        'Weapon enchantment, specialisation and weapon-vs-armour-type are per\n' +
        'weapon and appear on the weapon lines below, not in this number.';
    } else {
      thac0El.textContent = '\u2014';
      thac0El.title = '';
    }
  }
  if (acEl) {
    acEl.textContent = acShown;
    acEl.style.color = condAcPenalty ? 'var(--error, #ff6b6b)' : '';
    acEl.title = condAcPenalty
      ? 'Base AC ' + acBase + ', worsened by ' + condAcPenalty +
        ' from active conditions. The character sheet\'s own AC field is unchanged.'
      : '';
  }

  // AC breakdown, mirroring the per-weapon lines further down this panel.
  // Built by renderArmorClass and stashed on root so there is only ONE copy of
  // the AC arithmetic -- duplicating that walk here is how the sign and slot
  // bugs got in. Called lazily if it has not run yet, which covers the Quick
  // Reference rendering before a full recalculation on first load.
  const acBreakEl = root.querySelector('.combat-ac-breakdown');
  if (acBreakEl) {
    if (!root._acBreakdown && typeof renderArmorClass === 'function') renderArmorClass(root);
    const acLinesOut = root._acBreakdown || [];
    let acHtml = acLinesOut.map(l => {
      // Violet for enchantment, matching the Magical row on weapon entries --
      // one colour language across the whole panel.
      const colour = (l.kind === 'magic') ? 'var(--magic, #a98fd0)' : 'var(--muted)';
      return '<div style="color:' + colour + ';">' + escapeHtml(l.text) + '</div>';
    }).join('');

    // Condition lines, above parrying. A changed headline number with no stated
    // cause is worse than no change at all -- the player has to be able to tell
    // a DM where the +4 came from.
    if (condAcPenalty) {
      const who = (condFx.sources.acPenalty || []).slice();
      if (condFx.negatesDexCombat && dexDefAdj < 0) {
        who.push('DEX bonus negated');
      }
      acHtml += '<div style="color:var(--error, #ff6b6b);">' +
                'Conditions +' + condAcPenalty + ' AC (worse): ' +
                escapeHtml(who.join(', ')) + '</div>';
    }

    // Parrying (PHB Ch.9, optional rule). Printed BESIDE Armor Class, never
    // added to it. The book rules the bonus out against rear attacks, missiles
    // and magic in the same paragraph that grants it, so an AC carrying this
    // silently would protect against arrows and fireballs.
    //
    // Shown as the resulting AC rather than a bare modifier: a player deciding
    // whether to give up his whole round wants the number he would defend at,
    // not arithmetic to do under pressure.
    if (typeof isOptionalRule === 'function' && isOptionalRule('parrying')) {
      const parry = (typeof getParryBonus === 'function') ? getParryBonus(root) : null;
      if (parry && parry.bonus > 0) {
        // NaN check, NOT `|| 10`. AC 0 is falsy, so the old fallback replaced a
        // legitimate AC of 0 with 10 -- and AC 0 is 2e's reference point, the
        // single most likely value to hit. A blank field still falls back to 10.
        // Parry from the AC the character is ACTUALLY at, conditions included.
        // The headline figure above already accounts for them; reading the raw
        // field here made the two lines of the same panel disagree whenever a
        // condition was active. acShown is a number when a condition applies and
        // the raw string otherwise, and parseInt takes both.
        const acNum = parseInt(acShown, 10);
        const parriedAC = (isNaN(acNum) ? 10 : acNum) - parry.bonus;
        const tip = 'Parrying (PHB Ch.9, optional rule).&#10;' +
          'Forfeits ALL actions for the round -- no attack, no movement,&#10;' +
          'no spells. Bonus is half your level' +
          (parry.isWarrior ? ' plus one for warriors' : '') +
          ', so level ' + parry.level + ' gives ' + parry.bonus + '.&#10;&#10;' +
          'Applies ONLY to frontal melee attacks. No effect against rear&#10;' +
          'attacks, missile fire, or magic -- it will not help against a&#10;' +
          'lightning bolt or fireball.';
        acHtml += '<div style="color:var(--info, #6fb3d2);" title="' + tip + '">' +
                  'Parrying: AC ' + parriedAC + ' (-' + parry.bonus +
                  ') vs frontal melee only</div>';
      }
    }

    acBreakEl.innerHTML = acHtml;
  }

  if (moveEl) {
    // Conditions multiply movement, and they COMPOUND -- Slowed and Stunned
    // together give 1/2 x 1/3 = 1/6, not whichever is worse. haste and slow
    // cancelling falls out of the same multiplication for free.
    const baseMove = (root._currentMovement !== undefined)
      ? root._currentMovement
      : parseInt(moveRate, 10);
    const mult = condFx.moveMult !== undefined ? condFx.moveMult : 1;

    if (!isNaN(baseMove) && mult !== 1) {
      const adjusted = Math.floor(baseMove * mult);
      moveEl.textContent = adjusted + '" (' + (adjusted * 10) + ' ft/round)';
      moveEl.style.color = mult < 1 ? 'var(--error, #ff6b6b)' : 'var(--success, #4ade80)';
      moveEl.title = 'Base ' + baseMove + '" adjusted by active conditions: ' +
                     (condFx.sources.moveMult || []).join(', ') +
                     '. The character sheet\'s own movement is unchanged.';
    } else {
      moveEl.textContent = moveRate;
      moveEl.style.color = '';
      moveEl.title = '';
    }
  }
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
  
  // PHB Ch.9 two-weapon fighting, resolved BEFORE the loop. The penalty a given
  // weapon takes depends on which OTHER weapons are equipped, so it cannot be
  // decided from inside a per-weapon iteration -- 5a below reads this.
  const twoWeapon = getTwoWeaponState(root);

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
        magicBonus: itemMagicBonus(el, '.magic-bonus'),
        // Passed through as raw strings, not numbers -- "" means inherit from
        // magicBonus and "0" means an explicit zero, and Number("") is 0, which
        // would collapse the two.
        // Forced to "0" rather than "" when unticked: "" would inherit from
        // magicBonus, which is already 0, so either works today -- but "0" says
        // "explicitly nothing" and cannot be re-broken by a later change to the
        // inheritance rule.
        hitAdj: itemIsEnchanted(el) ? (hitAdjEl ? hitAdjEl.value : '') : '0',
        dmgAdj: itemIsEnchanted(el) ? (dmgAdjEl ? dmgAdjEl.value : '') : '0',
        attacks: atkEl ? atkEl.value : '',
        // Free text on the card ("70/140/210"), passed through as typed rather
        // than parsed -- the player may have entered their own figures.
        range: (el.querySelector('.weapon-range') || {}).value || '',
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
        // PHB Ch.9. -4 in the off hand, -2 in the main, both ALREADY modified
        // by the Dexterity Reaction Adjustment and already capped at 0 by
        // getTwoWeaponPenalties -- do not re-apply either here. A missile
        // weapon is outside the stance entirely and keeps 0.
        isOffhand: twoWeapon.active && el === twoWeapon.offRow,
        // Needed as its OWN flag rather than inferred from a non-zero penalty.
        // A main-hand weapon whose penalty has been cancelled to 0 -- a ranger
        // in studded leather or lighter, or anyone with a Dexterity Reaction
        // Adjustment of +2 or better -- still has the stance in force, and
        // "twoWeaponPen is truthy" cannot express that.
        isMainHand: twoWeapon.active && twoWeapon.mainRows.indexOf(el) !== -1,
        twoWeaponPen: !twoWeapon.active ? 0
          : (el === twoWeapon.offRow) ? twoWeapon.pen.off
          : (twoWeapon.mainRows.indexOf(el) !== -1) ? twoWeapon.pen.main
          : 0,
        // Ammunition this weapon fires, resolved here because `el` is the DOM
        // row and only exists in this loop.
        ammo: (typeof getWeaponAmmoBonus === 'function')
          ? getWeaponAmmoBonus(root, el) : null,
        twoHander: getTwoHanderStyleEffect(root, el),
        effSpeed: getEffectiveWeaponSpeed(
          (el.querySelector('.speed') || {}).value,
          // 0 when unticked -- an untracked enchantment must not keep reducing
          // the speed factor.
          itemMagicBonus(el, '.magic-bonus'),
          // PHBR1 p.63: two-handed use with the specialization cuts speed factor
          // by 3. Passed in rather than subtracted afterwards so the floor at 0
          // is applied ONCE, to the final figure.
          (getTwoHanderStyleEffect(root, el) || {}).speedReduction || 0
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

    // PHB Ch.9 two-weapon advisories. WARN, never block -- these are the
    // player's and the DM's call, and several are legitimate at some tables.
    if (twoWeapon.active) {
      const warn = [];
      if (twoWeapon.noMainHand) {
        warn.push('A weapon is marked off-hand but no other melee weapon is equipped. ' +
                  'Two-weapon fighting needs a weapon in each hand.');
      }
      if (twoWeapon.shieldNames.length) {
        warn.push('Shield equipped (' + escapeHtml(twoWeapon.shieldNames.join(', ')) +
                  '). PHB Ch.9: you cannot use a shield while fighting with two weapons ' +
                  'unless it is strapped on your back -- and your AC above is still ' +
                  'counting it.');
      }
      if (twoWeapon.legality.legal === false) {
        warn.push(escapeHtml(twoWeapon.legality.reason));
      }
      if (twoWeapon.ambiguousMain) {
        // Worded to be true in BOTH cases. The old text claimed "the size and
        // weight check was made against the first of them", which is a lie when
        // the off-hand is a dagger -- isLegalOffhandWeapon() returns on the
        // dagger clause before comparing anything.
        warn.push('More than one main-hand melee weapon is equipped. Only one can be ' +
                  'wielded alongside the off-hand weapon; any legality check above used ' +
                  'the first of them.');
      }
      if (twoWeapon.ambiguousOff) {
        // The mirror of ambiguousMain, and previously silent: offRow takes the
        // first ticked weapon and every other one is ignored with no indication
        // which won. PHB Ch.9 is written for exactly one off-hand weapon -- the
        // -4 lands on it, the -2 on the main hand, and ONE extra attack results
        // regardless. Ticking three does not grant three.
        warn.push('More than one weapon is marked as off-hand. PHB Ch.9 assumes a ' +
                  'single off-hand weapon: the penalties and the one extra attack ' +
                  'above were figured from the first of them, and the others are ' +
                  'being ignored.');
      }
      if (warn.length) {
        html += '<div style="margin-bottom:6px;padding:4px 6px;' +
                'border-left:3px solid var(--warning, #e0a34a);' +
                'background:rgba(224,163,74,0.08);font-size:10px;line-height:1.4;' +
                'color:var(--warning, #e0a34a);">' + warn.join('<br>') + '</div>';
      }
    }
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

      // Snapshot the MAGICAL contribution before specialization is folded into
      // hitBase/dmgBase below. Those two are mutated from here on, and the
      // Magical row must report the enchantment's own share, not the total.
      const magicHit = hitBase;
      const magicDmg = dmgBase;

      // PHBR1 p.63. "If you specialize in Two-Hander Style and then use a
      // one-handed weapon in two hands, you also get a bonus of +1 to damage."
      //
      // ONE-HANDED weapons only. A two-handed sword is always in two hands and
      // gains nothing here -- it takes the speed factor cut instead. So this
      // needs the grip DECLARED as 2h on a weapon that could have been held in
      // one, which is what Grip 'flexible' and 'either' mean. Not magical, and
      // folded in before the Magical row is reported, same as specialization.
      const th = weapon.twoHander || null;
      if (th && th.damageBonus) dmgBase += th.damageBonus;

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
      // The character's Table 15 melee base -- but the MANUAL OVERRIDE wins if
      // one is set, exactly as it does on the character-level field. This used
      // to read the base alone, so a character with an override got it on the
      // Attacks/Round line and not on any weapon card, and print disagreed with
      // the screen. Deliberately NOT the effective rate: that includes the
      // two-weapon bonus, which belongs to the character rather than to any one
      // weapon.
      const baseRate =
        ((root.querySelector('[data-field="attacks_per_round_manual"]') || {}).value || '').trim() ||
        ((typeof getBaseAttacksPerRound === 'function')
          ? getBaseAttacksPerRound(root).rate : '1');
      const cat = (weapon.category || '').toLowerCase();
      // PHB Table 34: attack penalty for wielding a weapon you are not
      // proficient with. Related weapons cost half, rounded up.
      const profPen = weapon.profPenalty || 0;
      // PHB Ch.9 two-weapon fighting, kept SEPARATE from profPen rather than
      // folded into it -- profPen is printed verbatim in the Related and Not
      // Proficient badges above, so adding a stance penalty to it would make
      // those badges lie about the proficiency rules.
      const twoPen = weapon.twoWeaponPen || 0;

      // How Strength applies to THIS weapon (PHB). Hurled weapons get the full
      // Strength row; ordinary bows are capped at plain 18; crossbows, slings
      // and other mechanical devices get nothing.
      const adj = getWeaponStrAdjustments(
        strData, weapon.strMode, str, strExceptional, clazz
      );

      // Ammunition selected on this weapon, and what it contributes.
      //
      // STACKING IS A TABLE RULING, not a rule -- the PHB never says whether a
      // +1 arrow from a +1 bow is +2 or +1. The toggle decides, and the
      // comparison for "better of the two" is made against the weapon's own
      // ENCHANTMENT (magicHit/magicDmg), not against hitBase/dmgBase, because
      // those already have specialization folded in and specialization is not
      // an enchantment competing with the arrow's.
      // Resolved in the COLLECTION loop, where the DOM row is in scope. This is
      // the render loop and iterates plain objects -- there is no `el` here.
      const ammo = weapon.ammo || null;
      const ammoStacks = (typeof isOptionalRule !== 'function') || isOptionalRule('ammoBonusStacks');
      let ammoHitAdd = 0, ammoDmgAdd = 0;
      if (ammo && !ammo.missing) {
        ammoHitAdd = ammoStacks ? ammo.hit : Math.max(magicHit, ammo.hit) - magicHit;
        ammoDmgAdd = ammoStacks ? ammo.dmg : Math.max(magicDmg, ammo.dmg) - magicDmg;
      }

      // Which lines are meaningful for this weapon.
      const showMelee   = !cat || cat === 'melee' || cat === 'melee/thrown';
      const showThrown  = cat === 'thrown' || cat === 'melee/thrown';
      const showMissile = !cat || cat === 'ranged';

      html += '<div style="margin-bottom:6px;padding:4px;background:rgba(255,255,255,0.03);border-radius:4px;">';
      html += '<div style="font-weight:600;color:var(--accent-light);">\u2022 ' + escapeHtml(weapon.name);
      if (weapon.category) {
        html += ' <span style="font-size:10px;color:var(--muted);font-weight:400;">' + weapon.category + '</span>';
      }
      // The separator dot is painted MUTED and kept OUTSIDE the coloured span.
      // It used to sit inside it, so a red -2 dragged its own separator red and
      // the header read as a row of alarms instead of one item among several.
      const sepBadge = (text, color, tip) =>
        ' <span style="font-size:10px;color:var(--muted);font-weight:400;">\u00b7</span>' +
        ' <span style="font-size:10px;color:' + (color || 'var(--muted)') + ';font-weight:400;"' +
        (tip ? ' title="' + tip + '"' : '') + '>' + text + '</span>';

      // THIS CONDITION IS PROFICIENCY, NOT STANCE. It was briefly overwritten
      // with the two-weapon test, which made the Related branch fire whenever a
      // weapon was in the stance -- so a Not Proficient -2 silently relabelled
      // itself Related -2 the moment Off-hand was ticked, keeping the number and
      // changing only the word. The two-weapon badge lives on its own line
      // below; nothing about the stance belongs in this test.
      if (weapon.profStatus === 'related') {
        html += sepBadge('Related ' + profPen, 'var(--muted)',
          'A related weapon costs HALF the non-proficiency penalty, rounded up&#10;' +
          '(PHB Table 34). Separate from any two-weapon penalty; the two stack.');
      } else if (weapon.profStatus === 'none' && profPen) {
        html += sepBadge('Not Proficient ' + profPen, 'var(--error, #ff6b6b)',
          'Full non-proficiency attack penalty (PHB Table 34).&#10;' +
          'Warrior -2, Wizard -5, Priest -3, Rogue -3.&#10;' +
          'Separate from any two-weapon penalty; the two stack.');
      }
      // PHB Ch.9. On its OWN LINE, not in the header badge row. Sharing that row
      // with the proficiency badge made two unrelated penalties read as one --
      // a "Not Proficient -2" sitting beside an "Off-hand -3" invited the reader
      // to merge them, and the two come from different rules that stack.
      //
      // Shown even when the penalty is 0: a ranger in light armour, or anyone
      // whose Reaction Adjustment cancelled it, still HAS the stance in force
      // and needs to see that it was cancelled rather than never applied.
      let twLine = '';
      if (twoWeapon.active && (weapon.isOffhand || weapon.isMainHand)) {
        const twLabel = weapon.isOffhand ? 'Off-hand' : 'Main hand';
        const twColor = twoPen ? 'var(--error, #ff6b6b)' : 'var(--muted)';
        twLine = '<span style="font-size:11px;color:' + twColor + ';" ' +
                 'title="Two-weapon fighting (PHB Ch.9).&#10;' +
                 'Base -2 main hand / -4 off hand, modified by your Dexterity&#10;' +
                 'Reaction Adjustment (' + (twoWeapon.pen.reactionAdj >= 0 ? '+' : '') +
                 twoWeapon.pen.reactionAdj + '), which can reach 0 but never a bonus.&#10;' +
                 'This is SEPARATE from any non-proficiency penalty and the two&#10;' +
                 'stack -- Dexterity buys off the stance, never the proficiency.' +
                 (twoWeapon.pen.exempt ? '&#10;&#10;' + twoWeapon.pen.reason : '') + '">' +
                 'Two-weapon: ' + twLabel + (twoPen ? ' ' + twoPen : ' (no penalty)') +
                 '</span><br>';
      }
      if (weapon.effSpeed !== null && weapon.effSpeed !== undefined &&
          (typeof isOptionalRule !== 'function' || isOptionalRule('weaponSpeedInitiative'))) {
        html += ' <span style="font-size:10px;color:var(--muted);font-weight:400;" title="Weapon speed factor -- ADD this to your initiative roll (PHB Table 56).&#10;Magical bonuses reduce speed factor by 1 per plus (min 0).">· Spd ' + weapon.effSpeed + '</span>';
      }
      html += '</div>';
      html += '<div style="margin-left:10px;color:var(--text);">';
      html += twLine;

      if (showMelee) {
        const toHit = adj.toHit + hitBase + profPen + twoPen;
        const dmg   = adj.damage + dmgBase;
        html += 'Melee: d20' + sign(toHit) + ' → ' + weapon.damageSM + dmgSign(dmg) +
                ' / ' + weapon.damageL + dmgSign(dmg) + '<br>';
      }

      if (showThrown) {
        // PHB: "Attack roll and damage modifiers for Strength are always used
        // when an attack is made with a hurled weapon." DEX missile adjustment
        // applies too -- they stack.
        const toHit = dexMissile + adj.toHit + hitBase + profPen + twoPen;
        const dmg   = adj.damage + dmgBase;
        html += 'Thrown: d20' + sign(toHit) + ' → ' + weapon.damageSM + dmgSign(dmg) +
                ' / ' + weapon.damageL + dmgSign(dmg) + '<br>';
      }

      if (showMissile) {
        // adj is {0,0} for crossbows/slings, and the plain-18 row for an
        // ordinary bow, so this one expression covers every ranged case.
        // The ammunition's contribution lands here and NOWHERE ELSE -- melee and
        // thrown attacks do not involve a launcher.
        const toHit = dexMissile + adj.toHit + hitBase + profPen + ammoHitAdd;
        const dmg   = adj.damage + dmgBase + ammoDmgAdd;
        html += 'Missile: d20' + sign(toHit) + ' → ' + weapon.damageSM + dmgSign(dmg) +
                ' / ' + weapon.damageL + dmgSign(dmg) + '<br>';
      }

      // Attacks per round for this weapon. An explicit dropdown selection wins;
      // otherwise Table 35 for the specialized weapon, falling back to the
      // character's Table 15 base.
      // PHB Ch.9: the second weapon makes ONE additional attack, so the off-hand
      // weapon's own rate is 1 -- not the character's Table 15 rate, which
      // belongs to the main hand. Showing the full rate here would double-count
      // the bonus already added to Attacks/Round. An explicit per-weapon value
      // still wins, since that field exists to override exactly this kind of
      // derivation.
      const rateSrc = weapon.attacks ? 'set on the weapon card'
                    : weapon.isOffhand ? 'PHB Ch.9: the off-hand weapon makes the one extra attack'
                    : (specRate ? 'PHB Table 35, specialist' : 'PHB Table 15');
      const rate = weapon.attacks || (weapon.isOffhand ? '1' : (specRate || baseRate));
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

      // Magical enchantment. Reported whether or not the bonuses are uniform:
      // a Swordchucks +5 granting only +1 to hit and nothing to damage should
      // say exactly that, because the enchantment LEVEL and its EFFECTS are
      // separate fields and only the level decides what the weapon can strike.
      if (enchant) {
        const bits = [];
        if (magicHit) bits.push(sign(magicHit) + ' hit');
        if (magicDmg) bits.push(sign(magicDmg) + ' damage');
        const effects = bits.length
          ? bits.join(', ') + ' (included above)'
          : 'no hit or damage bonus';
        html += '<span style="color:var(--magic, #a98fd0);" ' +
                'title="The enchantment level is what lets this weapon harm a creature ' +
                'injured only by magical weapons, and it lowers the weapon speed factor by 1 ' +
                'per plus. Hit and damage adjustments are separate fields, so a weapon whose ' +
                'enchantment is not uniform reports what it actually grants.">' +
                'Magical +' + enchant + ': ' + effects + '</span><br>';
      }

      // Ammunition. Shown for missile weapons only -- a bow swung as a club
      // fires nothing, and thrown weapons are not launcher-and-ammunition.
      if (ammo && showMissile) {
        if (ammo.missing) {
          html += '<span style="color:var(--warning, #e0a34a);" ' +
                  'title="This weapon is set to fire ammunition that is no longer in your ' +
                  'Ammunition list -- most likely renamed or removed. The selection is kept ' +
                  'rather than cleared so it is not lost silently.">' +
                  'Ammo: ' + escapeHtml(ammo.name) + ' (not in your ammunition list)</span><br>';
        } else {
          const bits = [];
          if (ammoHitAdd) bits.push(sign(ammoHitAdd) + ' hit');
          if (ammoDmgAdd) bits.push(sign(ammoDmgAdd) + ' damage');
          const effect = bits.length
            ? bits.join(', ') + ' (included above)'
            : 'no bonus applied';
          html += '<span style="color:var(--magic, #a98fd0);" ' +
                  'title="Bonuses from the ammunition itself. Whether an enchanted arrow ' +
                  'stacks with an enchanted launcher is not addressed by the PHB -- it is set ' +
                  'under Table Rulings in Settings, currently ' +
                  (ammoStacks ? 'STACKING' : 'BETTER OF THE TWO') + '.">' +
                  'Ammo: ' + escapeHtml(ammo.name) + ' \u2014 ' + effect + '</span><br>';
        }
      }

      // Adjustments with no enchantment level -- deliberately NOT called
      // magical, since nothing here says the weapon is.
      // STANDALONE CONDITION, not an else-if. Inserting the ammunition block
      // above severed the original chain to if(enchant), so this quietly became
      // "else if this weapon has no ammunition" and printed alongside the
      // Magical row. Testing !enchant directly cannot be broken that way again.
      if (!enchant && (magicHit || magicDmg)) {
        const bits = [];
        if (magicHit) bits.push(sign(magicHit) + ' hit');
        if (magicDmg) bits.push(sign(magicDmg) + ' damage');
        html += '<span style="color:var(--muted);" ' +
                'title="Hit and damage adjustments set on the weapon card with no enchantment ' +
                'level. Not treated as magical.">' +
                'Adjustments: ' + bits.join(', ') + ' (included above)</span><br>';
      }

      // PHB Table 45 range bands. DISPLAYED, NEVER APPLIED -- the sheet cannot
      // know how far away the target is, so folding a modifier into the printed
      // to-hit figure would silently assert a range. Each band covers every
      // distance at or below its figure.
      if (weapon.range && (showThrown || showMissile) &&
          typeof getRangeModifiers === 'function') {
        const rm = getRangeModifiers(weapon.weaponTypeKey);
        html += '<span style="color:var(--muted);" ' +
                'title="Short / medium / long range in yards (PHB Table 45). A band covers ' +
                'every distance at or below its figure, so a heavy crossbow fired at 136 yards ' +
                'is at medium range.' +
                (rm.doubled ? ' Arquebus range modifiers are doubled.' : '') +
                ' Apply the modifier yourself.">' +
                'Range ' + weapon.range + ' yds: ' + sign(rm.short) + ' / ' +
                sign(rm.medium) + ' / ' + sign(rm.long) + ' to hit</span><br>';
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

  // PHB Ch.1: "Reaction Adjustment modifies the die roll to see if a character
  // is surprised when he unexpectedly encounters NPCs." The Combat tab shows
  // that same Table 2 figure under the book's FUNCTION for it, which is why the
  // printed sheet has always labelled the column "Surprise Adj". The field
  // existed in the template and was written by nothing anywhere -- it has been
  // blank since the day it was added. MIRRORED here, never separately computed.
  const reactionCombatEl = root.querySelector('[data-field="reaction_adj_combat"]');
  
  if (!reactionEl || !missileEl || !acEl) return;
  
  // Clear if invalid DEX
  if (!dex || dex < 1 || dex > 25) {
    reactionEl.value = "";
    if (reactionCombatEl) reactionCombatEl.value = "";
    missileEl.value = "";
    acEl.value = "";
    return;
  }
  
  const dexData = DEX_TABLE[dex];
  
  if (dexData) {
    // [reaction, missile attack, defensive AC]
    const [reaction, missile, defensive] = dexData;
    
    reactionEl.value = (reaction >= 0 ? "+" : "") + reaction;
    if (reactionCombatEl) reactionCombatEl.value = reactionEl.value;
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

  // Rendered FIRST, not last. Every branch below returns early -- multi-class,
  // dual-class, max level, unknown class -- so a call at the foot of this
  // function never runs for those characters, leaving the bonus field blank on
  // load until an ability score happens to be touched.
  renderPrimeRequisiteBonus(root);
  
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
      xpNextEl.value = "Enough XP \u2014 DM's call";
      xpNextEl.title = `${newClass} has enough XP for level ${newLevel + 1}. PHB Ch.8: the DM may require training first, and may rule that circumstances do not permit advancement.`;
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
    xpNextEl.value = "Enough XP \u2014 DM's call";
    xpNextEl.title = `Enough XP for level ${level + 1}. PHB Ch.8: the DM may require training first, and may rule that circumstances do not permit advancement.`;
  } else {
    xpNextEl.value = xpNeeded.toLocaleString();
    xpNextEl.title = `Need ${xpNeeded.toLocaleString()} more XP to reach level ${level + 1} (total: ${xpForNextLevel.toLocaleString()})`;
  }
}

function renderPrimeRequisiteBonus(root) {
  const xpBonusEl = root.querySelector('[data-field="xp_bonus"]');
  if (!xpBonusEl) return;

  // PHB Ch.3. Prime requisites come from the shared PRIME_REQUISITES table in
  // tables.js -- never re-derive them here. A local second copy is exactly how
  // the druid came to be missing Charisma in two files at once.
  const info = getCharacterPrimeRequisites(root);

  if (!info) {
    xpBonusEl.value = "\u2014";
    xpBonusEl.removeAttribute("title");
    return;
  }

  const primeReqNames = info.abilities.map(a => ABILITY_LABELS[a] || a);
  const allMeet16 = info.abilities.every(a => parseInt(val(root, a) || 0, 10) >= 16);
  
  if (allMeet16) {
    xpBonusEl.value = "+10%";
    xpBonusEl.title = `All prime requisites (${primeReqNames.join(", ")}) are 16+`;
  } else {
    xpBonusEl.value = "0%";
    xpBonusEl.title = `Prime requisites: ${primeReqNames.join(", ")} (need all 16+ for +10% bonus)`;
  }
}

// Collect the prime requisites governing THIS character, per PHB Ch.3.
//   single -- the one class (legacy "Fighter/Mage" strings are split, so a
//             composite left in `clazz` cannot silently drop its second half).
//   dual   -- the NEW class only: "the character no longer earns experience
//             points in his previous character class".
//   multi  -- the UNION of every component class. The book gives multi-class
//             characters no clause of their own, so the general rule governs
//             as written: 16+ in ALL his prime requisites.
// Returns { abilities, classes } or null. Callers must treat null as UNKNOWN,
// never as "no requirements" -- see getClassPrimeRequisites in tables.js.
function getCharacterPrimeRequisites(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  let names = [];

  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) names.push(val(root, 'mc_class' + i) || '');
  } else if (charType === 'dual') {
    names.push(val(root, 'dc_new_class') || '');
  } else {
    names = parseMultiClass(val(root, 'clazz') || '');
  }

  names = names.map(n => (n || '').trim()).filter(n => n && n.toLowerCase() !== 'none');

  const abilities = [];
  const classes = [];
  names.forEach(n => {
    const reqs = getClassPrimeRequisites(n);
    if (!reqs.length) return;
    classes.push(n);
    reqs.forEach(a => { if (!abilities.includes(a)) abilities.push(a); });
  });

  return abilities.length ? { abilities, classes } : null;
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
      dormantEl.innerHTML =
        '<strong style="color:var(--warning, #e0a34a);">\u26A0 Dormant class</strong>' +
        '<div style="margin-top:4px;">Your ' + escapeHtml(rogue.clazz) + ' levels are dormant until ' +
        'your new class passes level ' + escapeHtml(rogue.level) + '. These skills are shown ' +
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
      let html = '<strong>Armor: ' + escapeHtml(armorInfo.name) + '</strong> (PHB Table 29)';
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
  // BEFORE the early return below: rails must be repainted even when there are
  // no problems to report, or a piece of armor that has just become legal keeps
  // its red rail until something else triggers a redraw.
  if (typeof resolveArmorLegality === 'function') resolveArmorLegality(root);

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
  el.innerHTML =
    '<strong style="color:var(--warning, #e0a34a);">\u26A0 Armor restrictions</strong>' +
    problems.map(p => '<div style="margin-top:4px;">\u2022 ' + escapeHtml(p) + '</div>').join('') +
    '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
      'Advisory only \u2014 nothing is blocked. Druid and other class limits can be adjusted ' +
      'under House Rules &amp; Overrides in Settings.</div>';
  el.style.display = '';
}

// Paints the armor rail and its status word, and reveals the rail key. Called
// from renderArmorRestrictions so the banner and the per-card rails are always
// computed in the same pass and cannot disagree.
//
// The KEY ships hidden in the template and is unhidden here: a legend for
// colours nothing produces is worse than no legend at all.
function resolveArmorLegality(root) {
  const items = Array.from(root.querySelectorAll('.armor-list .item'));
  const key = root.querySelector('.armor-rail-key');
  if (key) key.style.display = items.length ? '' : 'none';

  items.forEach(item => {
    const state = (typeof getArmorLegality === 'function')
      ? getArmorLegality(item, root) : 'allowed';

    const railEl = item.querySelector('.rail');
    if (railEl) railEl.className = 'rail ' + state;

    // The word carries the meaning; the rail only accelerates it. Colour alone
    // is a code the reader must learn, and is invisible to anyone who cannot
    // separate those hues.
    const wordEl = item.querySelector('.status');
    if (wordEl) {
      wordEl.className = 'status ' + state;
      wordEl.textContent = state === 'restricted' ? 'NOT ALLOWED TO THIS CLASS'
                         : state === 'advisory'   ? 'STEALTH UNAVAILABLE'
                         : '';
    }
  });
}

// Animal empathy (PHBR11 Ch.2, Tables 30 and 31).
//
// THE SIGN IS THE THING TO GET RIGHT. The modifier is a PENALTY TO THE ANIMAL'S
// saving throw, not a bonus to the ranger, so a higher ranger level makes the
// animal more likely to FAIL its save -- which is the ranger succeeding. The
// panel says whose roll it is in as many words, because "-4" on a ranger's
// sheet reads as something bad happening to him.
function renderAnimalEmpathy(root) {
  const section = root.querySelector('.animal-empathy-display');
  if (!section) return;

  const ae = (typeof getAnimalEmpathy === 'function') ? getAnimalEmpathy(root) : null;
  if (!ae) { section.style.display = 'none'; return; }
  section.style.display = '';

  const body = section.querySelector('.animal-empathy-body');
  if (!body) return;

  const attitudes = (typeof ANIMAL_ATTITUDES !== 'undefined' ? ANIMAL_ATTITUDES : [])
    .map(a => `<div style="margin-top:4px;">
                 <strong style="color:var(--text);">${escapeHtml(a.name)}</strong>
                 <span style="color:var(--muted);"> \u2014 ${escapeHtml(a.text)}</span>
               </div>`).join('');

  const dormant = ae.dormant
    ? `<div style="margin-top:10px;padding:8px;border-radius:var(--radius);font-size:12px;
                   line-height:1.4;border:1px solid var(--warning, #e0a34a);
                   background:color-mix(in srgb, var(--accent) 8%, transparent);">
         <strong style="color:var(--warning, #e0a34a);">\u26A0 Dormant class</strong>
         <div style="margin-top:4px;">Your ranger levels are dormant until your new class passes
         level ${escapeHtml(String(ae.level))}. Shown for reference \u2014 using a former class\u2019s
         abilities costs you the experience for that adventure.</div>
       </div>`
    : '';

  body.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;">
      <div style="flex:1 1 220px;min-width:200px;padding:10px 12px;border:1px solid var(--border);
                  border-radius:var(--radius);background:var(--glass);">
        <div style="font-size:10px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;
                    color:var(--accent-light);margin-bottom:8px;">Wild animals</div>
        <div style="font-size:12px;line-height:1.5;">
          The animal rolls a saving throw vs. rods at
          <strong style="color:var(--accent-light);">${ae.mod}</strong>
          <span style="color:var(--muted);">(your level ${ae.level})</span>.
          <div style="color:var(--muted);margin-top:4px;">
            If it FAILS, you shift its attitude one step up or down Table 30, your choice.
            If it succeeds, nothing changes and you may not try again on that animal.
            The new reaction applies to you only, and lasts a few minutes to an hour after
            you leave.
          </div>
        </div>
      </div>
      <div style="flex:1 1 220px;min-width:200px;padding:10px 12px;border:1px solid var(--border);
                  border-radius:var(--radius);background:var(--glass);">
        <div style="font-size:10px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;
                    color:var(--accent-light);margin-bottom:8px;">Domestic animals</div>
        <div style="font-size:12px;line-height:1.5;">
          <strong style="color:var(--accent-light);">No saving throw.</strong>
          <div style="color:var(--muted);margin-top:4px;">
            Approach and soothe, and the animal becomes Friendly automatically and permanently,
            so long as you stay in sight of it. Includes formerly wild animals that have been
            tamed. You can also judge a domestic animal\u2019s general qualities by observation \u2014
            which puppy will be the best hunter, which horse is soundest.
          </div>
        </div>
      </div>
    </div>
    ${dormant}
    <details class="disclosure" style="font-size:11px;margin-top:10px;">
      <summary>conditions, and the animals this will not work on</summary>
      <div style="color:var(--muted);margin-top:6px;line-height:1.5;">
        <strong style="color:var(--text);">All of these must hold</strong><br>
        You must move quietly, slowly and confidently, speaking soothing words and making
        calming gestures \u2014 no fear shown, no weapon wielded, nothing that might frighten
        or enrage the animal. The animal must be able to see and hear you: you must be in
        plain sight, not hidden, with no barrier between you, and close enough for it to see
        your eyes. Ideally your companions are out of its sight, and at least 10 feet behind
        you if not. It must be stationary or moving only slightly \u2014 you cannot soothe a
        charging or attacking animal \u2014 and you must soothe it for
        <strong style="color:var(--text);">5-10 (1d6+4) uninterrupted rounds</strong>.<br><br>
        <strong style="color:var(--text);">Never works on</strong><br>
        Your species enemy, ever \u2014 the antagonism is too overwhelming to establish empathy.
        Non-intelligent animals (Intelligence 0) such as centipedes or barracudas. Creatures of
        higher intelligence, such as leprechauns, ogres and a paladin\u2019s warhorse, resist it.
        As a rule of thumb it works on natural animals of Animal to Low intelligence
        (Intelligence 1 to 7).<br><br>
        <strong style="color:var(--text);">Table 30 \u2014 attitudes</strong>
        ${attitudes}
      </div>
    </details>
  `;
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
  // Takes the INDEX (0 = hide, 1 = move silently) rather than the individual
  // figures, so every term getRangerStealth adds is named here. A breakdown
  // that does not sum to the number displayed is worse than no breakdown.
  const setTip = (field, i, halved) => {
    const el = root.querySelector('[data-field="' + field + '"]');
    if (!el) return;
    if (s.blocked) { el.title = 'Not possible in this armor.'; return; }
    let t = 'Base: ' + s.base[i] + '% (Table 18, ranger level ' + s.level + '), Race: ' +
            sgn(s.racial[i]) + ', DEX: ' + sgn(s.dex[i]);
    if (s.kit && s.kit[i]) t += ', Kit (' + (s.kitName || 'kit') + '): ' + sgn(s.kit[i]);
    if (s.crhArmor && s.armorMod && s.armorMod[i]) {
      t += ', Armor (' + s.armorName + ', CRH Table 11): ' + sgn(s.armorMod[i]);
    }
    if (halved) t += ', halved for non-natural surroundings';
    el.title = t;
  };
  setTip('ranger_hide',            0, false);
  setTip('ranger_movesilently',    1, false);
  setTip('ranger_hide_nonnatural', 0, true);
  setTip('ranger_move_nonnatural', 1, true);

  const noteEl = section.querySelector('.ranger-stealth-note');
  if (noteEl) {
    if (s.blocked) {
      noteEl.innerHTML =
        '<strong style="color:var(--warning, #e0a34a);">Stealth unavailable in ' +
          escapeHtml(s.armorName) + '</strong>' +
        '<div style="margin-top:4px;">Hiding in shadows and moving silently are not possible ' +
        'in armor heavier than studded leather \u2014 it is inflexible and makes too much ' +
        'noise (PHB Ch.3, Ranger).</div>';
      noteEl.style.color = '';
    } else {
      // THREE reasons stealth can be unblocked, and they are not interchangeable.
      // The PHB wording below is only true when the CRH supplement rule is OFF;
      // with it on nothing is ever blocked, so saying "studded leather or
      // lighter" about a man in chain mail is simply false.
      let why = 'Studded leather or lighter, so stealth is available.';
      if (s.crhArmor) {
        const mod = (s.armorMod && (s.armorMod[0] || s.armorMod[1]))
          ? ' It carries ' + sgn(s.armorMod[0]) + '% to hide in shadows and ' +
            sgn(s.armorMod[1]) + '% to move silently.'
          : ' It carries no adjustment.';
        why = 'Using the Complete Ranger\u2019s Handbook armor table (Tables 11 and 13), so ' +
              'armor adjusts the chance rather than removing it.' + mod;
      } else if (s.armorKey === 'elven_chain') {
        why = 'Elven chain weighs less than studded leather and is described as lighter and ' +
              'quieter, so it does not trip the ranger\u2019s armor restriction.';
      }
      noteEl.innerHTML =
        '<strong>Armor: ' + escapeHtml(s.armorName) + '</strong>' +
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
        'passes level ' + escapeHtml(String(s.level)) + '. Shown for reference \u2014 using a former ' +
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

  // SAME-PROFICIENCY PAIRS. Knife/Stiletto, Quarterstaff/Bo Stick and Short
  // Sword/Drusus are ONE proficiency with two names, not two proficiencies that
  // resemble each other -- PHBR1 p.59 prints each as a single slash-joined entry
  // in its weapon-group lists, exactly as it prints "Dagger/Dirk". There is only
  // ever one slot to have spent, so a specialist in either name is a specialist
  // in both.
  //
  // UNIFORM across all three pairs. p.98 states the transfer explicitly for the
  // Drusus and is silent for the other two, which looks like a distinction until
  // you notice the Drusus is a genuinely different weapon -- 50 gp, size M,
  // type S -- that a reader would reasonably ask about, while a stiletto costs
  // the same as a knife and differs only in damage type. Do NOT add a per-pair
  // flag for this; the asymmetry is in the prose, not in the rules.
  const profs = root._weaponProfs || [];
  const specialized = profs.some(p => {
    if (!p || !p.specialized) return false;
    if (names.indexOf(norm(p.name)) !== -1) return true;
    return (typeof samePHBR1Proficiency === 'function') &&
           names.some(n => samePHBR1Proficiency(n, p.name));
  });

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
  const beforeTwoWeapon = override || base.rate;

  // PHB Ch.9 two-weapon fighting. Applied ON TOP of whatever rate is already in
  // force, INCLUDING a manual override -- haste plus two weapons is a real
  // combination, and the override field exists to cover what the class tables
  // do not, which is a different thing from what Chapter 9 grants.
  const tw = (typeof getTwoWeaponState === 'function')
    ? getTwoWeaponState(root) : { active: false };
  const effective = (tw.active && typeof addOneAttackPerRound === 'function')
    ? addOneAttackPerRound(beforeTwoWeapon)
    : beforeTwoWeapon;

  // Amber for a manual override, blue for a rules-derived change. An override
  // outranks: it is the one the player set by hand and the one they can clear.
  const rateColor = override ? 'var(--warning, #e0a34a)'
                  : tw.active ? 'var(--info, #6fb3d2)' : '';

  if (autoEl) {
    autoEl.value = effective;
    autoEl.style.color = rateColor;
  }

  if (quickEl) {
    // THE MIRROR NO LONGER MIRRORS EXACTLY, AND THAT IS DELIBERATE. Conditions
    // are applied HERE and not to autoEl above: the Core tab states what the
    // character IS, the quick reference states what he can do RIGHT NOW. The
    // sheet autosaves, so writing a transient half-rate into the Core field
    // would persist it. Everything except conditions is still identical.
    const condRate = (typeof getActiveConditionEffects === 'function')
      ? getActiveConditionEffects(root) : { attackRateMult: 1, sources: {} };
    const rateMult = condRate.attackRateMult !== undefined ? condRate.attackRateMult : 1;

    let quickVal = effective;
    if (rateMult !== 1 && typeof scaleAttackRate === 'function') {
      quickVal = scaleAttackRate(effective, rateMult);
    }

    quickEl.value = quickVal;
    quickEl.readOnly = true;
    quickEl.style.color = (rateMult !== 1)
      ? (rateMult < 1 ? 'var(--error, #ff6b6b)' : 'var(--success, #4ade80)')
      : rateColor;

    const twNote = tw.active
      ? 'Melee attacks per round: ' + beforeTwoWeapon + ' +1 for two-weapon fighting = ' +
        effective + ' (PHB Ch.9).'
      : 'Melee attacks per round.';
    quickEl.title = twNote +
      (rateMult !== 1
        ? '\nActive conditions change this to ' + quickVal + ': ' +
          (condRate.sources.attackRateMult || []).join(', ') +
          '. The Core tab still shows ' + effective + '.'
        : '') +
      '\nEdit the base on the Core tab under Combat.';
  }

  if (!noteEl) return;

  // The note earns its place only when there is something to explain: an
  // override in force, or a warrior who has actually risen above 1 per round.
  // PHB Ch.9: "one additional attack each round... regardless of the number of
  // attacks he may normally be allowed." Printed as arithmetic rather than a
  // bare total so a player who already folded the extra attack into a manual
  // override can SEE the double-count instead of meeting it mid-fight.
  const twNote = tw.active
    ? beforeTwoWeapon + ' +1 for fighting with two weapons = ' + effective +
      ' (PHB Ch.9 grants one extra attack, and only one, however many you already have).'
    : '';

  if (override) {
    noteEl.innerHTML =
      'Manual override in effect (' + String(override).replace(/[<>&]/g, '') + '). ' +
      'Table 15 would give ' + base.rate + ' for this character. Clear the override to return to it.' +
      (twNote ? ' ' + twNote : '');
    noteEl.style.color = 'var(--warning, #e0a34a)';
    noteEl.style.display = '';
  } else if (tw.active) {
    noteEl.textContent = twNote +
      (base.isWarrior && base.rate !== '1'
        ? ' Base is ' + base.rate + ' at ' + base.clazz + ' level ' + base.level + ' (PHB Table 15).'
        : '');
    noteEl.style.color = 'var(--info, #6fb3d2)';
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
  // Not added to the guard below on purpose -- coin count and weight are the
  // function's reason to exist, coin value is an extra it can do without.
  const coinValueEl = root.querySelector('[data-field="coin_value"]');
  
  if (!coinTotalEl || !coinWeightEl) return;
  
  // Calculate totals
  const totalCoins = cp + sp + ep + gp + pp;
  // Coins per pound is a toggle -- see COINS_PER_POUND_2E in tables.js. The PHB
  // does not state a coin weight, so this reads the optional rule live and a
  // Settings change applies without a reload.
  const coinsPerPound = getCoinsPerPound();
  const weightLbs = totalCoins / coinsPerPound;
  
  // Display
  coinTotalEl.value = totalCoins.toLocaleString();
  coinWeightEl.value = weightLbs.toFixed(1);
  
  // Tooltip with breakdown
  if (totalCoins > 0) {
    coinWeightEl.title = `${totalCoins.toLocaleString()} coins total ` +
      `(${coinsPerPound} coins = 1 lb)`;
  } else {
    coinWeightEl.removeAttribute("title");
  }

  // Coin VALUE, PHB Table 42. A different question from the count above, which
  // is why both are shown: 500 cp and 500 pp are the same count and the same
  // weight, and a thousandfold apart in worth. Displayed in gp because Table 44
  // prices the equipment list in gp.
  if (coinValueEl && typeof coinsToGp === 'function') {
    const valueGp =
      coinsToGp(cp, 'cp') + coinsToGp(sp, 'sp') + coinsToGp(ep, 'ep') +
      coinsToGp(gp, 'gp') + coinsToGp(pp, 'pp');
    coinValueEl.value = formatGp(valueGp);
    if (valueGp > 0) {
      coinValueEl.title = 'PHB Table 42, worth in gp: ' +
        'cp 1/100, sp 1/10, ep 1/2, gp 1, pp 5';
    } else {
      coinValueEl.removeAttribute('title');
    }
  }
  // Whichever of the two renderers runs last leaves the totals correct, so both
  // call it rather than relying on an ordering in recalculateAll.
  if (typeof renderTreasureTotals === 'function') renderTreasureTotals(root);
}

// Total worth of the Other Valuables list, in gp. Deliberately NOT folded into
// renderEncumbrance: that function answers a weight question and this one
// answers a value question. They iterate the same list and share nothing else.
//
// Every row counts, whatever its type -- VALUABLE_TYPES is metadata and no
// arithmetic reads it. A blank Qty counts as one, matching the weight loop.
function renderValuablesValue(root) {
  const el = root.querySelector('[data-field="valuables_value"]');
  if (!el || typeof coinsToGp !== 'function') return;

  let totalGp = 0;
  Array.from(root.querySelectorAll('.valuables-list .item')).forEach(item => {
    const qtyRaw = parseFloat(item.querySelector('.qty')?.value);
    const qty  = isNaN(qtyRaw) ? 1 : qtyRaw;
    const each = parseFloat(item.querySelector('.value-each')?.value) || 0;
    const unit = (item.querySelector('.value-unit')?.value) || 'gp';
    totalGp += coinsToGp(each, unit) * qty;
  });

  el.value = formatGp(totalGp);
  renderTreasureTotals(root);
}

// Combined weight and worth of coins plus valuables. Both halves are already
// computed -- renderCoinWeight and the encumbrance pass -- so this only adds
// them up, and it reads the rendered fields rather than recomputing, so it can
// never disagree with the two rows above it.
//
// Commas have to come out before parsing: both figures go through
// toLocaleString on the way in, and parseFloat stops at the first comma, which
// would silently turn 4,180 into 4.
//
// There is deliberately NO total count. Four sapphires plus six pelts is ten
// things, and that is not a number anyone wants.
function renderTreasureTotals(root) {
  const wtEl = root.querySelector('[data-field="treasure_weight"]');
  const vlEl = root.querySelector('[data-field="treasure_value"]');
  if (!wtEl && !vlEl) return;
  const read = name => {
    const f = root.querySelector('[data-field="' + name + '"]');
    return parseFloat(String(f ? f.value : '').replace(/,/g, '')) || 0;
  };
  if (wtEl) wtEl.value = (read('coin_weight') + read('valuables_weight')).toFixed(1);
  if (vlEl && typeof formatGp === 'function') {
    vlEl.value = formatGp(read('coin_value') + read('valuables_value'));
  }
}

function renderRacialAbilities(root) {
  const racialAbilitiesList = root.querySelector('.racial-abilities-list');
  if (!racialAbilitiesList) return;

  const race = (val(root, "race") || "").trim().toLowerCase();

  // Resolve the race BEFORE touching the list. The old version bailed out on
  // any existing item at all -- which is why racial notes were frozen at
  // character creation for the life of the character. Nothing regenerated them
  // and no correction to RACIAL_ABILITIES could ever reach an existing sheet.
  let abilities = null;
  if (race && typeof RACIAL_ABILITIES !== 'undefined') {
    for (const raceKey in RACIAL_ABILITIES) {
      if (race.includes(raceKey)) { abilities = RACIAL_ABILITIES[raceKey]; break; }
    }
  }

  const autoNames = new Set(
    (abilities || []).map(a => (a.name || '').trim().toLowerCase())
  );

  Array.from(racialAbilitiesList.querySelectorAll('.item')).forEach(node => {
    // Normal path: flagged as auto-generated, so it is ours to replace.
    if (node.dataset.autoGenerated === 'true') { node.remove(); return; }

    // LEGACY SWEEP, and it is deliberately narrow. Every character saved before
    // this fix has unflagged racial entries that are nonetheless ours. Without
    // this branch they would survive the rebuild and the fresh copies would
    // land beside them as DUPLICATES.
    //
    // Matches on NAME ONLY and only against THIS race's set -- never against
    // every race, which would eat a deliberately customised "Infravision" on a
    // character whose race does not grant one. Self-healing: after the next
    // save every auto item carries the flag and this branch stops matching.
    const titleEl = node.querySelector('.title');
    const nm = titleEl ? (titleEl.value || '').trim().toLowerCase() : '';
    if (nm && autoNames.has(nm)) node.remove();
  });

  // Unknown or blank race: manual entries are preserved and nothing is added.
  if (!abilities) return;

  // A NEW object per node. Never pass the RACIAL_ABILITIES entry itself and
  // never set isAuto on it -- those objects are shared across every character
  // on screen, and mutating one would leak into all of them.
  abilities.forEach(ability => {
    const node = makeAbilityNode({
      name:   ability.name,
      notes:  ability.notes,
      isAuto: true
    }, () => markUnsaved(document.querySelector('.tab.active'), true, root));
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
  
  // Populate dropdown with kits, ALPHABETICALLY. getKitsForClass returns
  // Object.values(), which is insertion order -- so the dropdown was showing
  // whatever order the kits happen to sit in kits.js. That looked alphabetical
  // only because the original entries were typed that way; the ranger block is
  // now in the Complete Ranger's Handbook's own order with the two DRAGON #234
  // crypt kits appended, and they landed at the bottom.
  //
  // Sorted HERE rather than by reordering the data, so file order stays a
  // transcription concern (keep a book's kits in the book's order) and display
  // order stays a UI concern. Appending a kit can no longer disturb the list.
  availableKits.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(kit => {
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
  const kitAbilitiesList = root.querySelector('.kit-abilities-list');
  if (!kitAbilitiesList) return;

  const clazz    = (val(root, "clazz") || "").trim().toLowerCase();
  const kitValue = (val(root, "kit") || "").trim();

  // Resolve the kit BEFORE touching the list, so the sweep below has a name set
  // to match against. The old version resolved it midway and returned early in
  // three places, which meant the list was sometimes left untouched entirely.
  let abilities = null;
  if (kitValue && clazz && typeof getKitsForClass === 'function') {
    const selectedKit = getKitsForClass(clazz)
      .find(k => k.name.toLowerCase().replace(/\s+/g, '') === kitValue);
    if (selectedKit && selectedKit.abilities) abilities = selectedKit.abilities;
  }

  const autoNames = new Set(
    (abilities || []).map(a => (a.name || '').trim().toLowerCase())
  );

  Array.from(kitAbilitiesList.querySelectorAll('.item')).forEach(node => {
    // Normal path: flagged as auto-generated, so it is ours to replace.
    if (node.dataset.autoGenerated === 'true') { node.remove(); return; }

    // LEGACY SWEEP -- and here it also DEDUPLICATES, which is the whole point.
    // collectSheet never saved the isAuto flag for kit abilities, so every load
    // produced a set carrying no flags. Nothing was stripped, and re-selecting
    // the kit (which the dropdown reset forced on every load) appended a fresh
    // copy beside them. Characters are carrying two, four or more full sets.
    //
    // Matching on name removes every one of them and a single fresh set is
    // appended below. Self-healing on first load -- no migration script and no
    // manual cleanup. Manual entries whose names are not the kit's survive.
    const titleEl = node.querySelector('.title');
    const nm = titleEl ? (titleEl.value || '').trim().toLowerCase() : '';
    if (nm && autoNames.has(nm)) node.remove();
  });

  // No kit, unknown class, or a kit carrying no abilities: manual entries are
  // preserved and nothing is added.
  if (!abilities) return;

  // A NEW object per node -- never the kit's own ability object, which is
  // shared across every character on screen.
  abilities.forEach(ability => {
    const node = makeAbilityNode({
      name:   ability.name,
      notes:  ability.notes,
      isAuto: true
    }, () => markUnsaved(document.querySelector('.tab.active'), true, root));
    kitAbilitiesList.appendChild(node);
  });
}

// PHBR1 pp.62-63. Two-Hander Style Specialization, which grants TWO different
// things to two different sets of weapons:
//
//   SPEED FACTOR -3, whenever the weapon is used two-handed at all. The book's
//   worked example is the bastard sword: speed 6 in one hand, 8 in two, and 5
//   in two for a specialist -- "a very quick weapon in his hands".
//
//   +1 DAMAGE, but ONLY for a one-handed weapon held in two. A two-handed sword
//   is always in two hands and gains nothing; it takes the speed cut instead.
//
// Two-handedness is established from the row's DECLARED grip or from the
// weapon's INHERENT grip in core_wp.json -- a two-handed sword is two-handed
// whether or not the player touched the dropdown.
//
// The unclassified weapons (Grip empty -- the Unattributed ones, plus the broad
// sword, which PHBR1 p.93 simply omits) are treated permissively: a declared 2h
// grants both. Guessing wrong there costs +1 damage on a weapon nobody has a
// source for, which is preferable to silently refusing a player's explicit
// declaration.
function getTwoHanderStyleEffect(root, el) {
  const none = { active: false, twoHanded: false, speedReduction: 0, damageBonus: 0 };
  const styles = (typeof getFightingStyles === 'function')
    ? getFightingStyles(root) : null;
  if (!styles || !styles.active || !styles.twoHander) return none;
  if (!el) return none;

  const declared = ((el.querySelector('.weapon-grip') || {}).value || '');
  const wtypeEl  = el.querySelector('.weapon-wtype');
  const stats    = (wtypeEl && wtypeEl.value && typeof getWeaponTypeStats === 'function')
    ? getWeaponTypeStats(wtypeEl.value) : null;
  const inherent = stats ? (stats['Grip'] || '') : '';

  const twoHanded = (declared === '2h') || (inherent === 'two-handed');
  if (!twoHanded) return none;

  // Could this weapon have been held in ONE hand? Only then is it "a one-handed
  // weapon used in two". Unset counts as yes, per the note above.
  const couldBeOneHanded =
    inherent === 'flexible' || inherent === 'either' || inherent === '';

  return {
    active: true,
    twoHanded: true,
    speedReduction: 3,
    damageBonus: (declared === '2h' && couldBeOneHanded) ? 1 : 0
  };
}

// PHBR1 p.62. Single-Weapon Style Specialization: -1 AC for one proficiency
// slot, -2 for two, capped there.
//
// The bonus is NOT a property of the character -- it is a property of how he is
// standing right now: "the character wields a one-handed weapon in one hand and
// nothing in the other." So every condition is tested against live equipment,
// and the FIRST failure is reported, because the first one is the one the player
// can act on.
//
// Conditions, in the order the book states them:
//   - a shield is equipped              -> something is in the other hand
//   - an off-hand weapon is declared    -> likewise
//   - no melee weapon equipped          -> nothing to get the bonus with
//   - that weapon is held two-handed    -> either declared, or inherently so
//   - not PROFICIENT with it            -> p.62 requires proficiency, and
//     "related" is not proficient, so a related weapon does not qualify
//
// Returns { slots, applies, blockedBy, slotsIfNoShield } -- the last so
// No Shield AC can show what dropping the shield would actually buy.
function getSingleWeaponStyleState(root, shieldBonus) {
  const off = { slots: 0, applies: false, blockedBy: '', slotsIfNoShield: 0 };
  const styles = (typeof getFightingStyles === 'function')
    ? getFightingStyles(root) : null;
  if (!styles || !styles.active || !styles.singleWeapon) return off;

  const slots = styles.singleWeapon;
  const isEquipped = el => {
    const c = el.querySelector('.equipped');
    return !!(c && c.checked);
  };
  const rows = qsa(root, '.weapons-list .item').filter(isEquipped);

  // Everything EXCEPT the shield, so the caller can answer both "does it apply"
  // and "would it apply if he put the shield away".
  let blocked = '';
  const offhand = rows.some(el => {
    const c = el.querySelector('.weapon-offhand');
    return !!(c && c.checked);
  });
  const melee = rows.filter(el => {
    const cat = ((el.querySelector('.weapon-category') || {}).value || '').toLowerCase();
    return !cat || cat.indexOf('melee') !== -1;
  });

  if (offhand)        blocked = 'a weapon is declared in your off hand';
  else if (!melee.length) blocked = 'no melee weapon equipped';
  else {
    // The first equipped melee row, matching how getTwoWeaponState picks a main
    // hand. With several equipped the choice is arbitrary; that ambiguity is
    // already surfaced by the two-weapon advisory one step earlier.
    const el   = melee[0];
    const name = ((el.querySelector('.title') || {}).value || 'that weapon').trim();
    const declared = ((el.querySelector('.weapon-grip') || {}).value || '');
    // The row's stored TYPE KEY is the source of truth for what this weapon is
    // -- the anchor rule, same as resolveWeaponProficiency. The class is
    // .weapon-wtype, not .weapon-type: that one holds the Category.
    const wtypeEl  = el.querySelector('.weapon-wtype');
    const stats    = (wtypeEl && wtypeEl.value && typeof getWeaponTypeStats === 'function')
      ? getWeaponTypeStats(wtypeEl.value) : null;
    const inherent = stats ? (stats['Grip'] || '') : '';

    if (declared === '2h' || inherent === 'two-handed') {
      blocked = `${name} is being held two-handed`;
    } else {
      const st = (typeof resolveWeaponProficiency === 'function')
        ? resolveWeaponProficiency(root, el) : null;
      const prof = st && (st.status === 'proficient' || st.status === 'specialized');
      if (!prof) blocked = `you are not proficient with ${name}`;
    }
  }

  const shielded = (shieldBonus || 0) !== 0;
  return {
    slots: slots,
    applies: !blocked && !shielded,
    blockedBy: blocked || (shielded ? 'a shield is equipped' : ''),
    slotsIfNoShield: blocked ? 0 : slots
  };
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
  let miscBonus = 0;
  let miscNames = [];
  // Collected during the walk, turned into display lines after it.
  let baseACWinner = null;
  const acStackers = [];
  
  // Get all equipped armor/shields/accessories
  const armorItems = Array.from(root.querySelectorAll('.armor-list .item'));
  const equippedItems = armorItems.filter(item => {
    const checkbox = item.querySelector('.equipped');
    return checkbox && checkbox.checked;
  });
  
  // Process each equipped item
  equippedItems.forEach(item => {
    const name = item.querySelector('.title').value.trim();
    // WHICH SLOT this piece occupies. The armor card rewrite renamed the
    // classes -- .armor-slot now holds the WEAR LOCATION and .armor-type holds
    // the CONSTRUCTION key ("plate", "buckler_wood") -- but this function was
    // never updated. It was reading "plate" and matching none of the branches
    // below, so every equipped armor contributed NOTHING and AC sat at 10.
    // Read defensively, exactly as collectSheet does, so pre-rewrite records
    // still resolve.
    const type = (item.querySelector('.armor-slot') ||
                  item.querySelector('.armor-type') || {}).value || "Armor";
    const baseACValue = parseInt(item.querySelector('.base-ac').value, 10);
    // Gated on the Enchanted tick. A hidden non-zero value silently improving
    // AC is exactly the bug the checkbox exists to prevent.
    const magicBonus = itemMagicBonus(item, '.ac-bonus');

    if (!name) return;

    // SIGN: finalAC ADDS every term and lower is better, so an improvement must
    // be NEGATIVE. Shields work because core_armor.json stores their AC as -1.
    // The player types a PLUS -- "2" for plate mail +2 -- so the enchantment is
    // SUBTRACTED. It was being added, which made a +2 suit AC 5 instead of 1:
    // strictly worse than the plain armor.

    // Base AC providers (only best one counts)
    // Supplementary armor: ADDS to Armor Class instead of setting it, the same
    // shape as shields, rings and cloaks. Dastana is the live example -- "-1 to
    // AC when used with other armor" -- and its stored -1 is a BONUS in exactly
    // the convention shields use, not a base AC.
    // This is deliberately NOT the Bracers slot: bracers of defense replace
    // armor rather than supplementing it, which is the branch below.
    if (type === "Supplemental Armor") {
      if (!isNaN(baseACValue)) miscBonus += baseACValue;
      miscBonus -= magicBonus;
      miscNames.push(name);
      acStackers.push({ label: 'Supplemental', name,
        baseACValue: isNaN(baseACValue) ? 0 : baseACValue, magicBonus });
    }
    else if (type === "Armor" || type === "Bracers") {
      // GUARD: no armor in the book has a negative base AC. A negative here
      // always means a BONUS has landed in a base-AC field -- which is what made
      // an equipped Dastana produce AC -1, better than full plate and shield.
      // Skip it rather than let it set the base.
      if (baseACValue < 0) return;
      // Compare EFFECTIVE against EFFECTIVE. This used to test the candidate's
      // UNENCHANTED value against the incumbent's already-enchanted one, which
      // is not just wrong but ORDER-DEPENDENT: studded leather (7) and leather
      // +5 (effective 3) gave AC 7 or AC 3 purely according to which row came
      // first in the list.
      // isNaN rather than truthiness, so a legitimate AC 0 -- the best the
      // table reaches -- is not silently discarded as "blank".
      const effectiveAC = baseACValue - magicBonus;
      if (!isNaN(baseACValue) && effectiveAC < baseAC) {
        baseAC = effectiveAC;
        baseACSource = magicBonus ? (name + ' ' + magicSign(magicBonus)) : name;
        // Overwritten each time a better suit is found, so only the winner is
        // reported -- the losers contribute nothing and would confuse the list.
        baseACWinner = { name, baseACValue, magicBonus };
      }
    }
    // AC Bonus providers (all stack)
    else if (type === "Shield") {
      // Shield uses Base AC field as bonus value (e.g., -1 for small shield)
      if (baseACValue) {
        shieldBonus += baseACValue;
      }
      shieldBonus -= magicBonus; // Magical shield bonus
      shieldNames.push(name);
      acStackers.push({ label: 'Shield', name,
        baseACValue: isNaN(baseACValue) ? 0 : baseACValue, magicBonus });
    }
    else if (type === "Ring") {
      // Rings provide bonus from both fields
      if (baseACValue) {
        ringBonus += baseACValue;
      }
      ringBonus -= magicBonus;
      ringNames.push(name);
      acStackers.push({ label: 'Ring', name,
        baseACValue: isNaN(baseACValue) ? 0 : baseACValue, magicBonus });
    }
    else if (type === "Cloak") {
      // Cloaks provide bonus from both fields
      if (baseACValue) {
        cloakBonus += baseACValue;
      }
      cloakBonus -= magicBonus;
      cloakNames.push(name);
      acStackers.push({ label: 'Cloak', name,
        baseACValue: isNaN(baseACValue) ? 0 : baseACValue, magicBonus });
    }
    // Helmet, Gauntlets, Boots, Belt, Other = no AC effect
  });
  
  // Get DEX adjustment (already calculated)
  const dexAdj = parseInt(val(root, "dex_ac") || 0, 10);
  
  // Get manual adjustment
  const manualAdj = parseInt(val(root, "ac_manual") || 0, 10);
  
  // Calculate final AC (remember: lower is better in AD&D)
  // PHBR1 p.62. Single-Weapon Style Specialization is the ONLY thing in that
  // book which alters Armor Class -- Parry, Shield-Punch and the rest are all
  // attack-roll mechanics. It is a COMPUTATION, not compilation, so it belongs
  // in this number rather than only in the Quick Reference: print.js renders
  // finalAC, and the printout is what sits in front of the player in a fight.
  //
  // magicSign is not used here: finalAC ADDS every term and lower is better, so
  // the book's "+1 AC bonus" is stored as -1.
  const swStyle  = getSingleWeaponStyleState(root, shieldBonus);
  const styleAdj = swStyle.applies ? -swStyle.slots : 0;

  let finalAC = baseAC + shieldBonus + ringBonus + cloakBonus + dexAdj + manualAdj + miscBonus + styleAdj;

  // Structured breakdown for the Combat Quick Reference, built HERE rather than
  // recomputed there -- two copies of AC arithmetic is exactly how the sign and
  // slot bugs got in. Stashed on root because the Quick Reference is a separate
  // renderer; recalculateAll runs this first, so it is fresh whenever armor
  // changes, and the Quick Reference lazily calls this function if it is absent.
  //
  // Base armor SETS the number, so only the winner of the best-armor contest
  // appears. Everything else ADDS, so each contributor gets its own line.
  // A piece's own value and its enchantment are reported separately, because a
  // helm with base 0 and +1 contributes only through its enchantment and saying
  // "Supplemental -1" would misattribute where the point came from.
  const acLines = [];
  if (baseACWinner) {
    acLines.push({ kind: 'base',
      text: `${baseACWinner.name}: Base AC = ${baseACWinner.baseACValue}` });
    if (baseACWinner.magicBonus) {
      acLines.push({ kind: 'magic',
        text: `Magical ${magicSign(-baseACWinner.magicBonus)}: ${baseACWinner.name} (included above)` });
    }
  }
  acStackers.forEach(s => {
    if (s.baseACValue) {
      acLines.push({ kind: 'stack',
        text: `${s.label} ${magicSign(s.baseACValue)}: ${s.name} (included above)` });
    }
    if (s.magicBonus) {
      acLines.push({ kind: 'magic',
        text: `Magical ${magicSign(-s.magicBonus)}: ${s.name} (included above)` });
    }
  });
  if (dexAdj)    acLines.push({ kind: 'stack', text: `Dexterity ${magicSign(dexAdj)} (included above)` });
  if (manualAdj) acLines.push({ kind: 'stack', text: `Manual adjustment ${magicSign(manualAdj)} (included above)` });

  // PHBR1 p.62. A player who spent TWO proficiency slots on Single-Weapon Style
  // and sees no change to his AC cannot tell whether the app is broken or he is
  // holding a shield. Silent omission is the failure the advisory principle
  // exists to catch -- so the line is shown either way, and says which.
  if (swStyle.slots > 0) {
    if (swStyle.applies) {
      acLines.push({ kind: 'stack',
        text: `Single-Weapon Style x${swStyle.slots} ${magicSign(styleAdj)} (included above)` });
    } else {
      acLines.push({ kind: 'blocked',
        text: `Single-Weapon Style x${swStyle.slots} \u2014 not applying: ${swStyle.blockedBy}` });
    }
  }
  root._acBreakdown = acLines;
  
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
  
  if (miscBonus !== 0) {
    tooltip += `Supplemental: ${miscBonus >= 0 ? "+" : ""}${miscBonus} (${miscNames.join(", ")})\n`;
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
  
  // PHB Ch.1, Defensive Adjustment: "(In some situations, beneficial Dexterity
  // modifiers to Armor Class do not apply. Usually this occurs when a character
  // is attacked from behind or when his movement is restricted -- attacked
  // while prone, tied up, on a ledge, climbing a rope, etc.)"
  //
  // BENEFICIAL is the whole of it. dexAdj is negative for a good Dexterity, so
  // only a negative value is ever surrendered; a character whose Dexterity is
  // poor enough to carry a PENALTY keeps that penalty in every one of these
  // situations. The Quick Reference has guarded on this since the conditions
  // work went in (`dexDefAdj < 0`); these variants never did.
  //
  // Every variant below is now derived by backing ONE term out of finalAC
  // rather than re-adding the parts. Re-adding silently dropped miscBonus, so
  // supplemental magical AC was in Normal AC and in none of the variants.
  const dexForfeit = (dexAdj < 0) ? dexAdj : 0;

  if (acRearEl) {
    // Loses the shield AND the Dexterity bonus. PHB Ch.1 names being attacked
    // from behind as the first case where beneficial Dexterity AC modifiers
    // stop applying; this kept the Dexterity bonus, so it was wrong in the
    // opposite direction from Surprised AC.
    const rearAC = finalAC - shieldBonus - dexForfeit;
    acRearEl.value = rearAC;
    acRearEl.title = "Attacked from behind\nNo shield bonus, no Dexterity AC bonus (PHB Ch.1)";
  }
  
  if (acSurprisedEl) {
   // PHB Ch.11: "the surprised characters lose all AC bonuses for high
    // Dexterity during that instant of surprise." That is the WHOLE cost.
    // Nothing in the chapter takes the shield away -- a surprised man is still
    // holding it -- and this used to drop it anyway.
    const surprisedAC = finalAC - dexForfeit;
    acSurprisedEl.value = surprisedAC;
    acSurprisedEl.title = "Caught off-guard (PHB Ch.11)\n" +
      "Loses the Dexterity AC bonus only.\nShield and all magical bonuses still apply.";
  }
  
  if (acNoShieldEl) {
    // No Shield AC. No longer "same as rear" -- a rear attack costs the
    // Dexterity bonus too, and this does not.
    //
    // THE ONE VARIANT THAT ADDS A TERM RATHER THAN ONLY REMOVING ONE. Every
    // other derives by backing something out of finalAC, which was safe while
    // removing a term could only ever make things worse. PHBR1 p.62 breaks
    // that: Single-Weapon Style Specialization pays out only when nothing is
    // carried in the off hand, so putting the shield away is precisely the
    // condition that ENABLES it. Backing out the shield alone would understate
    // this number for exactly the character it matters most to.
    //
    // slotsIfNoShield comes from the SAME resolver as styleAdj, so the two
    // cannot drift -- see the note above finalAC.
    const styleAdjNoShield = -swStyle.slotsIfNoShield;
    const styleGain        = styleAdjNoShield - styleAdj;
    const noShieldAC       = finalAC - shieldBonus + styleGain;
    acNoShieldEl.value = noShieldAC;

    let t = "Without shield\nAll other bonuses apply";
    if (styleGain !== 0) {
      // The trade the rules actually present, stated rather than left for the
      // player to work out: a shield is worth its AC, and an empty hand is
      // worth the style bonus plus a free hand for Parry, grappling and
      // punching. Worth saying out loud when the numbers are close.
      t += `\n\nIncludes Single-Weapon Style x${swStyle.slotsIfNoShield} `
         + `${magicSign(styleAdjNoShield)},\nwhich the shield is currently suppressing.`;
      // The ACTUAL delta between this field and Normal AC, derived the same way
      // the value above is: noShieldAC = finalAC - shieldBonus + styleGain, so
      // the change is styleGain MINUS shieldBonus. Removing a -1 shield makes AC
      // one WORSE, so its sign flips; adding it here reported a -1 shield and a
      // -2 style as "3 better" when the field itself had correctly moved by 1.
      const net = styleGain - shieldBonus;
      if (net === 0) {
        t += `\nDropping the shield is AC-neutral, and frees\nyour hand for Parry, grappling and punching.`;
      } else if (net > 0) {
        t += `\nDropping the shield is a net ${net} WORSE on AC.`;
      } else {
        t += `\nDropping the shield is a net ${Math.abs(net)} BETTER on AC.`;
      }
    }
    acNoShieldEl.title = t;
  }
  
  if (acUnarmoredEl) {
    // Unarmored AC: 10 + DEX + manual only
    const unarmoredAC = 10 + dexAdj + manualAdj;
    acUnarmoredEl.value = unarmoredAC;
    acUnarmoredEl.title = "No armor or accessories\nBase 10 + DEX + manual adj.";
  }
  
  if (acVsMissilesEl) {
    // NOT UNFINISHED. Nothing in the PHB makes missile AC differ from normal
    // AC, and the old "same as normal for now" comment implied a calculation
    // was still owed. Chapter 9's cover and concealment rules -- the obvious
    // candidate -- penalise the ATTACKER'S ROLL and never touch the defender's
    // Armor Class, so there is nothing here to compute. The field survives
    // because the printed TSR record sheet has the column.
    const vsMissilesAC = finalAC;
    acVsMissilesEl.value = vsMissilesAC;
    acVsMissilesEl.title =
      'AC against missile attacks: ' + vsMissilesAC + '\n' +
      'The same as your normal Armor Class, and that is correct.\n\n' +
      'Cover and concealment (PHB Table 59) do NOT improve your AC -- they\n' +
      'penalise the shooter\'s attack roll, which the DM applies to his own\n' +
      'die. Cover also grants a bonus to YOUR saving throws against spells\n' +
      'causing physical damage.\n\n' +
      'The table is on the Tools tab under Cover & Concealment.\n' +
      '(Lower is better)';
  }

  // While Casting AC -- PHB Ch.7: "During the round in which the spell is cast,
  // the caster cannot move to dodge attacks. Therefore, no AC benefit from
  // Dexterity is gained by spellcasters while casting spells."
  //
  // Derived by backing dexAdj OUT of finalAC rather than re-adding the parts, so
  // it inherits shield, rings, cloaks, supplemental and manual adjustments for
  // free and cannot drift from Normal AC when any of those change. dexAdj is
  // negative for a good Dexterity, so subtracting it RAISES the number -- a worse
  // AC, which is exactly the penalty the rule describes.
  //
  // Spellcaster test matches toggleSpellBrowser's: it reads the top-level clazz,
  // so it inherits that function's behaviour on multi- and dual-class characters
  // rather than inventing a second, differently-wrong answer.
  const acCastingEl  = root.querySelector('[data-field="ac_while_casting"]');
  const acCastingRow = root.querySelector('.ac-casting-row');

  if (acCastingEl && acCastingRow) {
    const castClazz = (val(root, "clazz") || "").trim().toLowerCase();
    const castsSpells =
      (typeof isPriestClass === 'function' && isPriestClass(castClazz)) ||
      (typeof isWizardClass === 'function' && isWizardClass(castClazz));

    if (!castsSpells) {
      acCastingRow.style.display = 'none';
    } else {
      acCastingRow.style.display = '';

      // dexForfeit, NOT dexAdj. Ch.7 forfeits the BENEFIT of Dexterity; a bare
      // subtraction handed a poor-Dexterity caster a BETTER AC while casting by
      // shedding his penalty. See the note by the AC variants above.
      const castingAC = finalAC - dexForfeit;
      acCastingEl.value = castingAC;
      acCastingEl.title =
        'While Casting AC: ' + castingAC + '\n' +
        'Normal AC: ' + finalAC + '\n' +
        'Dexterity Defensive Adj. forfeited: ' +
          (dexForfeit ? (dexForfeit > 0 ? '+' : '') + dexForfeit : 'none') + '\n\n' +
        'PHB Ch.7: "During the round in which the spell is cast, the caster cannot\n' +
        'move to dodge attacks. Therefore, no AC benefit from Dexterity is gained\n' +
        'by spellcasters while casting spells."\n\n' +
        'Armour, shield and magical bonuses all still apply -- only the Dexterity\n' +
        'dodge is lost.\n' +
        '(Lower is better)';
    }
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
  
  // Clothing (PHB Ch.6): "Add five pounds for clothing, if any is worn."
  // Applied unconditionally -- the sheet does not track whether a character is
  // dressed, and 5 lbs is the book's abstraction for ordinary clothing. A robe
  // or cloak itemised in the armor list is counted separately, on top of this;
  // the PHB gives no guidance on that overlap.
  totalWeight += ENCUMBRANCE_CLOTHING_WEIGHT;

  // Coin weight (already calculated)
  const coinWeight = parseFloat(val(root, "coin_weight")) || 0;
  totalWeight += coinWeight;
  
  // Valuables weight (quantity * weight per item). Accumulated on its own as
  // well as into the running total, because the Treasure & Money panel shows it
  // beside coin weight -- a pack of gems and a purse are worth telling apart.
  // Written from HERE rather than by a second function, so exactly one place
  // computes this number and the two displays cannot drift.
  const valuables = Array.from(root.querySelectorAll('.valuables-list .item'));
  let valuablesWeight = 0;
  valuables.forEach(item => {
    const qtyRaw = parseFloat(item.querySelector('.qty')?.value);
    const qty = isNaN(qtyRaw) ? 1 : qtyRaw;
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    valuablesWeight += qty * weight;
  });
  totalWeight += valuablesWeight;

  const valuablesWeightEl = root.querySelector('[data-field="valuables_weight"]');
  if (valuablesWeightEl) valuablesWeightEl.value = valuablesWeight.toFixed(1);
  
  // Items weight (quantity * weight per item)
  const items = Array.from(root.querySelectorAll('.items-list .item'));
  items.forEach(item => {
    const qtyRaw = parseFloat(item.querySelector('.qty')?.value);
    const qty = isNaN(qtyRaw) ? 1 : qtyRaw;
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    totalWeight += qty * weight;
  });
  
  // Armor weight (all armor counts, equipped or not).
  // Magical armor is added to totalWeight -- it counts against the carrying
  // limit -- but tallied separately so it can be subtracted out of the figure
  // that determines the encumbrance CATEGORY. See effectiveWeight below.
  //
  // Detected from the card's explicit Enchanted tick. This USED to infer it
  // from a non-zero AC bonus, which could not see armor that is magical but
  // grants no AC -- elven chain being exactly that case. That gap is closed.
  //
  // The exclusion is applied whether or not the piece is equipped, matching how
  // this function already counts armor weight. The PHB's worked example has the
  // armor worn, so a DM who rules that a magical suit stuffed in a pack DOES
  // hamper you is reading it just as defensibly.
  const armor = Array.from(root.querySelectorAll('.armor-list .item'));
  let magicArmorWeight = 0;
  armor.forEach(item => {
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    const chk = item.querySelector('.is-magical');
    totalWeight += weight;
    if (chk && chk.checked) magicArmorWeight += weight;
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

  // Magic items weight. These were invisible to encumbrance entirely -- a staff
  // or a suit of magical plate on the Magic Items tab weighed nothing, while
  // every other carried-gear list counted. Surfaced by the PHB Ch.10 audit,
  // that being the chapter describing magic items as things a character finds
  // and carries.
  //
  // No magical-armor exclusion is applied here, because armor is not a magic
  // item type -- magical armor lives on the Armor tab, where the Ch.6 exclusion
  // is already handled against the armor list. See MAGIC_ITEM_TYPES.
  const magicItemEls = Array.from(root.querySelectorAll('.magic-items-list .item'));
  magicItemEls.forEach(item => {
    const qtyRaw = parseFloat(item.querySelector('.qty')?.value);
    const qty = isNaN(qtyRaw) ? 1 : qtyRaw;
    const weight = parseFloat(item.querySelector('.weight')?.value) || 0;
    totalWeight += qty * weight;
  });

  // Set current load
  currentLoadEl.value = totalWeight.toFixed(1);
  
  // Set max carried weight -- PHB Table 47's rightmost column, which is the
  // "severe" ceiling. NOTE: this is NOT the STR weight allowance (that is the
  // *unencumbered* ceiling). For 18/00 those are 480 and 335 respectively.
  const maxCarried = encData ? encData[4] : 0;
  maxCarryEl.value = maxCarried ? maxCarried.toFixed(0) : "";

  // Weight that actually counts against movement and combat. PHB: the weight of
  // magical armor "applies only toward the weight limit of the character. It
  // does not apply when determining the effects of encumbrance on movement and
  // combat." Clamped at zero for safety.
  const effectiveWeight = Math.max(0, totalWeight - magicArmorWeight);

  // Determine encumbrance category by absolute weight (PHB Table 47)
  let category = "";
  let tooltip = "";

  if (!encData) {
    category = "—";
    tooltip = "Enter STR to calculate";
  } else {
    const [unenc, light, moderate, heavy, severe] = encData;

    // Overloaded is a WEIGHT LIMIT question, so it tests the FULL carried
    // weight -- magical armor still has to be physically hauled. Every other
    // category drives movement and combat, so those test the EFFECTIVE weight
    // with magical armor removed (PHB, "Magical Armor and Encumbrance").
    if (totalWeight > severe) {
      category = "Overloaded!";
    } else if (effectiveWeight <= unenc) {
      category = "Unencumbered";
    } else if (effectiveWeight <= light) {
      category = "Light";
    } else if (effectiveWeight <= moderate) {
      category = "Moderate";
    } else if (effectiveWeight <= heavy) {
      category = "Heavy";
    } else {
      category = "Severe";
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
      `Includes ${ENCUMBRANCE_CLOTHING_WEIGHT} lbs clothing (PHB) and ` +
      `${coinWeight.toFixed(1)} lbs coin.\n` +
      (magicArmorWeight > 0
        ? `Carrying ${totalWeight.toFixed(1)} lbs, but ${magicArmorWeight.toFixed(1)} lbs of ` +
          `magical armor does not count toward encumbrance effects -- ` +
          `${effectiveWeight.toFixed(1)} lbs applies (PHB).\n`
        : ``) +
      `\n` +
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

  // Visible companion to the category tooltip. Without it, a Current Load of
  // 115 lbs sitting next to a category of "Light" reads as a bug rather than a
  // rule. Plain var(--glass), NOT amber -- this is information, not a problem,
  // and amber stays reserved for real ones.
  // Only numbers are interpolated here, so no HTML escaping is required. If
  // this is ever extended to name the armor pieces, that text is player-entered
  // and MUST be escaped.
  const magicNoteEl = root.querySelector('.encumbrance-magic-note');
  if (magicNoteEl) {
    if (magicArmorWeight > 0) {
      magicNoteEl.innerHTML =
        '<strong>Magical armor excluded:</strong> carrying ' +
        totalWeight.toFixed(1) + ' lbs, of which ' +
        magicArmorWeight.toFixed(1) + ' lbs is magical armor. ' +
        'Encumbrance effects are calculated on ' +
        effectiveWeight.toFixed(1) + ' lbs.' +
        '<br><span style="color:var(--muted);">PHB: the weight of magical armor ' +
        'counts toward what you can carry, but not toward its effects on ' +
        'movement and combat.</span>';
      magicNoteEl.style.display = 'block';
    } else {
      magicNoteEl.style.display = 'none';
      magicNoteEl.textContent = '';
    }
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
    const sphereToolbar    = priestSpheresDiv.querySelector('.sphere-access-toolbar');

    // The core spheres plus any this character's campaign setting unlocks
    // (Dark Sun paraelementals, Spelljammer's Cosmos). Setting spheres are kept
    // out of getAllSpheres() by design, so we append them per character here.
    const settingKey = (root.querySelector('[data-field="campaign_setting"]')?.value) || 'core';
    const extraSpheres = (typeof getSettingSpheres === 'function') ? getSettingSpheres(settingKey) : [];
    const sphereList = getAllSpheres().concat(extraSpheres);

    // Rebuild every render so a setting change adds/removes the setting spheres.
    // Preserve each sphere's ACCESS LEVEL across the rebuild, not merely whether
    // it was selected -- carrying only a boolean here would silently downgrade
    // every major sphere to whatever the default is on the next re-render.
    const previousAccess = {};
    Array.from(sphereCheckboxes.querySelectorAll('select[data-sphere]')).forEach(sel => {
      previousAccess[sel.getAttribute('data-sphere')] = sel.value;
    });

    const onSphereChange = () => {
      renderSphereAccessSummary(root);
      renderSpellBrowser(root);
      markUnsaved(document.querySelector('.tab.active'), true, root);
    };

    sphereCheckboxes.innerHTML = '';
    sphereList.forEach(sphere => {
      const isSetting = extraSpheres.includes(sphere);
      const row = document.createElement('label');

      // Tags are informational only, never restrictions. '(setting)' marks a
      // campaign-specific sphere; '(ToM)' marks one the PHB does not define, so a
      // table running strict PHB can see at a glance which rows are not from the
      // book without being prevented from using them.
      let tag = '';
      if (isSetting) {
        tag = ' <em style="color:var(--muted);font-style:italic;">(setting)</em>';
      } else if (typeof isPHBSphere === 'function' && !isPHBSphere(sphere)) {
        tag = ' <em style="color:var(--muted);font-style:italic;">(ToM)</em>';
      }

      // PHB Ch.3: "All refers to spells usable by any priest, regardless of
      // mythos. There are no Powers (deities) of the Sphere of All." No deity
      // grants it, so it has no major/minor state and must not be switchable off.
      // It also holds spells well above 3rd level, so capping it would be wrong.
      if (typeof isSphereAll === 'function' && isSphereAll(sphere)) {
        row.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;cursor:default;';
        row.innerHTML =
          '<span style="flex:0 0 78px;font-size:11px;color:var(--accent);">Always</span>' +
          '<span>' + escapeHtml(sphere) + tag + '</span>';
        row.title = 'PHB Ch.3: usable by any priest regardless of mythos.\n' +
                    'No deity grants it, so it has no major or minor access and\n' +
                    'cannot be turned off.';
        sphereCheckboxes.appendChild(row);
        return;
      }

      row.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;';
      row.innerHTML =
        '<select data-sphere="' + escapeHtml(sphere) + '" ' +
                'style="width:auto;flex:0 0 78px;font-size:11px;padding:2px 4px;">' +
          '<option value="none">\u2014</option>' +
          '<option value="major">Major</option>' +
          '<option value="minor">Minor</option>' +
        '</select>' +
        '<span>' + escapeHtml(sphere) + tag + '</span>';

      const sel  = row.querySelector('select');
      const prev = previousAccess[sphere];
      sel.value = (prev === 'major' || prev === 'minor') ? prev : 'none';
      sel.title = 'Major: any spell in this sphere you are high enough level to cast.\n' +
                  'Minor: spells of 3rd level and below only.\n' +
                  '\u2014 : no access.';
      sel.addEventListener('change', onSphereChange);

      sphereCheckboxes.appendChild(row);
    });

    // The PHB defines ONE Elemental sphere covering earth, air, fire and water;
    // the spell data splits it into four. A DM who granted "Elemental, major"
    // meant all four, so offer that in one action rather than making the player
    // find four rows scattered through an alphabetical list.
    if (sphereToolbar) {
      sphereToolbar.innerHTML = '';

      const elementalPresent = (typeof ELEMENTAL_SPHERES !== 'undefined') &&
        sphereList.some(s => ELEMENTAL_SPHERES.includes(s));

      if (elementalPresent) {
        const wrap = document.createElement('label');
        wrap.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);cursor:pointer;';
        wrap.innerHTML =
          '<span>Elemental (all four):</span>' +
          '<select class="sphere-elemental-all" style="width:auto;font-size:11px;padding:2px 4px;">' +
            '<option value="">\u2014 set \u2014</option>' +
            '<option value="major">Major</option>' +
            '<option value="minor">Minor</option>' +
            '<option value="none">None</option>' +
          '</select>';
        wrap.title = 'The PHB has a single Elemental sphere covering earth, air, fire and\n' +
                     'water. The spell data splits it into four, so this sets all four at once.';

        const bulk = wrap.querySelector('select');
        bulk.addEventListener('change', () => {
          const v = bulk.value;
          if (!v) return;
          // Match by attribute rather than building a selector string -- sphere
          // names are data-derived and must never be concatenated into a query.
          Array.from(sphereCheckboxes.querySelectorAll('select[data-sphere]')).forEach(sel => {
            if (ELEMENTAL_SPHERES.includes(sel.getAttribute('data-sphere'))) sel.value = v;
          });
          bulk.value = '';
          onSphereChange();
        });

        sphereToolbar.appendChild(wrap);
      }
    }

    renderSphereAccessSummary(root);
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
  //
  // TWO SHAPES ARE ACCEPTED, because every character saved before this change
  // stored a flat array of sphere names with no access level at all:
  //   legacy   ['Healing', 'Plant']
  //   current  { Healing: 'major', Plant: 'minor' }
  //
  // MIGRATION POLICY: legacy entries are promoted to MAJOR, deliberately. Major
  // is the permissive reading, so an existing priest cannot silently lose spells
  // he has been casting for months -- the player downgrades the ones his DM only
  // granted minor access to. Defaulting to minor would have quietly deleted every
  // 4th-level-and-up spell from his browser with no warning and no explanation.
  //
  // A legacy record naming 'All' simply finds no select, since the Sphere of All
  // is rendered as a fixed row. That is correct: it is always available anyway.
  if (root._pendingSpheres) {
    const pending = root._pendingSpheres;

    const selects = Array.from(
      root.querySelectorAll('.sphere-checkboxes select[data-sphere]')
    );
    // Case-insensitive match: the saved record, getAllSpheres() and the setting
    // sphere lists are three separate sources and have disagreed on casing before.
    const findSel = name => selects.find(s =>
      s.getAttribute('data-sphere').trim().toLowerCase() ===
      String(name).trim().toLowerCase()
    );

    if (Array.isArray(pending)) {
      pending.forEach(sphere => {
        const sel = findSel(sphere);
        if (sel) sel.value = 'major';
      });
    } else if (pending && typeof pending === 'object') {
      Object.keys(pending).forEach(sphere => {
        const access = pending[sphere];
        if (access !== 'major' && access !== 'minor') return;
        const sel = findSel(sphere);
        if (sel) sel.value = access;
      });
    }

    delete root._pendingSpheres;
    renderSphereAccessSummary(root);
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

// Read the character's sphere access off the sheet as { sphereName: 'major'|'minor' }.
//
// Spheres set to 'none' are OMITTED rather than stored as 'none'. Absence is the
// no-access answer everywhere else -- getSphereAccessFor() returns SPHERE_ACCESS_NONE
// for a missing key -- so recording them would be a second way of saying the same
// thing, and the two spellings would eventually disagree. It also keeps the saved
// record to the handful of spheres a deity actually granted rather than all 27.
//
// The Sphere of All never appears here. It has no major/minor state and is not
// rendered as a select, so there is nothing to read.
function getSphereAccessMap(root) {
  const map = {};
  if (!root) return map;

  Array.from(root.querySelectorAll('.sphere-checkboxes select[data-sphere]')).forEach(sel => {
    const name = sel.getAttribute('data-sphere');
    const v = sel.value;
    if (name && (v === 'major' || v === 'minor')) map[name] = v;
  });

  return map;
}

// One-line summary under the sphere grid: how many of each access, the minor-sphere
// cap spelled out, and the deity power cap when that optional rule is in force.
//
// Names the caps rather than leaving the player to discover them by finding a spell
// missing from the browser.
function renderSphereAccessSummary(root) {
  const el = root.querySelector('.sphere-access-summary');
  if (!el) return;

  const map = getSphereAccessMap(root);
  let major = 0, minor = 0;
  Object.keys(map).forEach(k => {
    if (map[k] === 'major') major++;
    else if (map[k] === 'minor') minor++;
  });

  const parts = [];

  if (major === 0 && minor === 0) {
    parts.push('<span style="color:var(--muted);">No spheres granted yet \u2014 ' +
               'only the Sphere of All is available.</span>');
  } else {
    parts.push('<strong>' + major + '</strong> major');
    parts.push('<strong>' + minor + '</strong> minor' +
               (minor > 0 ? ' <span style="color:var(--muted);">(3rd level and below)</span>' : ''));
    parts.push('<span style="color:var(--muted);">Sphere of All always available</span>');
  }

  // The deity power cap is a separate limit from sphere access and is reported
  // separately, so a player who cannot see a 6th-level spell knows which of the
  // two rules is responsible.
  const deity = (typeof getDeityLevelCap === 'function')
    ? getDeityLevelCap(root)
    : { applied: false };

  if (deity.applied) {
    parts.push('<span style="color:var(--accent);">Patron is a ' +
               escapeHtml(String(deity.label || '')) +
               ': nothing above level ' + deity.cap + '</span>');
  }

  el.innerHTML = parts.join(' <span style="color:var(--muted);">\u00B7</span> ');
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
    weightPerUnit: weightValue,
    // Carried onto the card for display. Previously dropped here: the browser
    // read these from core_ammo.json to render the picker row, then threw them
    // away when the card was built, so they never reached a character sheet.
    forWeapon:  ammo.Weapon || '',
    rangeMod:   ammo['Range Modifier'] || '',
    damageMod:  ammo['Damage Modifier'] || '',
    // Several rows carry their ENTIRE rule here while both modifier columns
    // read "+0" -- armor-piercing arrows ignore 1 point of AC, poisoned and
    // fire arrows, the bleed arrow. Dropping Notes left the most useful column
    // in the file and off the sheet.
    bookNotes:  ammo.Notes || ''
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
    // MOVEMENT IS DELIBERATELY NOT SHOWN -- DO NOT RE-ADD.
    // core_armor.json carries a Movement column (12/9/6) inherited from 1st
    // Edition, where the armor itself set a movement rate. AD&D 2e does not work
    // that way: movement is driven by ENCUMBRANCE, by total weight carried, via
    // PHB Table 47. Displaying it here presented a rule that does not exist in
    // this edition, sitting right next to figures that do. The column is left in
    // the JSON in case a table house-rules 1e-style armor movement, but nothing
    // reads it.
    // Provenance is shown instead: entries with no Source key are PHB Chapter 6,
    // so only the exceptions announce themselves.
    if (armor.Source) details.push(`Source: ${armor.Source}`);
    
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
  
  // Which slot this occupies. This USED to guess from the item's NAME with three
  // cases, and produced 'body' -- which is not one of the slot values at all, so
  // it silently fell through. core_armor.json has carried an "Armor Type" field
  // all along; read that instead of guessing.
  const ARMOR_TYPE_TO_SLOT = {
    'shield': 'Shield', 'helmet': 'Helmet', 'gauntlets': 'Gauntlets',
    'boots': 'Boots', 'clothing': 'Other', 'leg armor': 'Other',
    // Dastana is supplementary plate worn OVER armor -- "-1 to AC when used with
    // other armor". It ADDS rather than replacing, so it must not land in the
    // Bracers slot, which is the bracers-of-defense behaviour and competes with
    // body armor instead of stacking.
    'bracers': 'Supplemental Armor',
    // PHBR1 gladiator armor is assembled from separate pieces -- belt, cuirass,
    // fasciae, galerus, manica -- worn in combination rather than as a suit.
    // Same shape as Dastana: they ADD to protection rather than replacing body
    // armor, so without this a leather sleeve lands in the body armor slot and
    // drives the character's AC. (Galea and Myrmillo are typed 'Helmet' in the
    // data instead, because they genuinely are helmets.)
    'gladiator piece': 'Supplemental Armor',
    // core_armor.json's barding rows (Chain, Full Scale, Banded Mail, Full
    // Plate, the half-bardings) carry Armor Type "Horse Armor". Without a
    // mapping they fell through to 'Armor' and sat in the character's own body
    // armor slot. That was already wrong; it becomes actively dangerous once
    // armorTypeKey is stored below, because "Barding, Chain" would then resolve
    // to the chain key and drive AC, stealth and class restrictions from a
    // mount's armor. Barding is not worn by the character.
    'horse armor': 'Other'
  };
  const rawType  = String(armor['Armor Type'] || '').toLowerCase().trim();
  let armorType  = ARMOR_TYPE_TO_SLOT[rawType] || 'Armor';
  // "Medium (Special)", "Light (Oriental)", "Partial Plate" and similar all
  // describe construction, not slot -- they are worn as body armor.
  
  // Create the armor node and add it to the list
  const armorList = root.querySelector('.armor-list');
  if (!armorList) return;
  
  const newArmorNode = makeArmorNode({
    name: armor['Armor Name'],
    armorType: armorType,
    // THE ANCHOR RULE, finally honoured. getThiefArmorCategory documents the
    // stored armorTypeKey as authoritative with the NAME as a fallback "for
    // records predating the dropdown" -- but nothing ever wrote the key, so
    // inference was carrying every character, not just legacy ones.
    //
    // Inferred ONCE here, from the catalogue name, and stored. That is the
    // right place for a guess: made against a known-good name rather than a
    // user-editable title, then visible and correctable in the Type dropdown.
    // inferArmorTypeKey substring-matches, so "Boots, Hard Leather" would
    // resolve to leather -- harmless because the slot is Boots and every
    // consumer checks the slot first, but a reason not to re-run it per render.
    armorTypeKey: (typeof inferArmorTypeKey === 'function')
      ? inferArmorTypeKey(armor['Armor Name']) : '',
    baseAC: armor.AC || '10',
    acBonus: '0',
    equipped: false,
    weight: weightValue,
    notes: armor.Notes || ''
  }, () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
    // renderAC DOES NOT EXIST -- the function is renderArmorClass. This threw a
    // ReferenceError on every edit to an armor row added from the browser, which
    // killed the callback at that point. recalculateAll covers all of it.
    if (typeof recalculateAll === 'function') recalculateAll(root);
  });
  
  armorList.appendChild(newArmorNode);
  
  // Mark as unsaved
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) markUnsaved(activeTab, true, root);
  
  // recalculateAll rather than a hand-picked list. Armor moves Armor Class,
  // encumbrance, movement, thief skills, ranger stealth and the class-restriction
  // advisory, and the Combat Quick Reference mirrors several of those. Naming
  // renderers individually is how this list drifted out of date to begin with.
  if (typeof recalculateAll === 'function') recalculateAll(root);
  
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
  
  // Get selected spheres/schools.
  //
  // Every GRANTED sphere goes into the pool regardless of major or minor. The
  // 3rd-level cap on minor spheres gates the ADD buttons in the detail modal, not
  // visibility -- matching how the Intelligence and character-level caps already
  // behave here, and matching having the PSC open on the table for reference.
  //
  // The Sphere of All is appended unconditionally (PHB Ch.3: "usable by any
  // priest, regardless of mythos"). No deity grants it, so it has no row in the
  // access map and nothing else would ever put it in the pool.
  //
  // An EMPTY map deliberately yields an empty list, because filterSpells skips
  // the sphere filter entirely when given one -- so an unconfigured priest keeps
  // seeing every priest spell rather than being dropped into a browser holding
  // nothing but the Sphere of All. The summary line under the sphere grid is
  // where he's told no spheres are granted yet.
  const sphereAccess = getSphereAccessMap(root);
  const sphereKeys   = Object.keys(sphereAccess);
  const selectedSpheres = sphereKeys.length
    ? sphereKeys.concat(typeof SPHERE_ALL !== 'undefined' ? [SPHERE_ALL] : [])
    : [];

  const selectedSchools = Array.from(root.querySelectorAll('.school-checkboxes input[type="checkbox"]:checked'))
    .map(cb => cb.getAttribute('data-school'));

  // Stashed for showSpellDetails, which has to judge each spell individually --
  // the minor-sphere cap is per spell, not a single number, so it cannot ride on
  // root._spellLevelCap the way the Intelligence cap does.
  //
  // Unlike _spellLevelCap this is written on every browser render AND re-read
  // live in the modal, so a stale value cannot outlive a change to the grid.
  root._sphereAccess = sphereAccess;
  
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
    let html = '<option value="">' + allLabel + '</option>';
    values.forEach(v => { html += '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>'; });
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
          <strong>${escapeHtml(spell.name)}</strong>
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

// ===== Goods & Services price reference (PHB Chapter 6, Table 44) =====
// READ ONLY BY DESIGN -- there is no Add button and there should not be one.
// Clothing, Household Provisioning, Daily Food and Lodging and Services have no
// weight column in the book, so an entry added to inventory would sit in the
// encumbrance total contributing nothing. Clothing is the clearest case: the
// PHB omits garment weights precisely because encumbrance covers them with the
// flat 5 lb allowance in renderEncumbrance, so itemising them would double-count
// the rule. If an Add path is ever wanted it must REQUIRE a weight from the
// player rather than defaulting one to zero.
function renderGoodsReference(root) {
  const resultsDiv = root.querySelector('.goods-results');
  if (!resultsDiv) return;

  if (typeof GOODS_DATA === 'undefined' || !GOODS_DATA || GOODS_DATA.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">' +
      'Goods list not loaded. Check that js/core_goods.json is reachable.</p>';
    return;
  }

  const term = (root.querySelector('.goods-search') || {}).value || '';
  const t    = term.toLowerCase();
  const cat  = (root.querySelector('.goods-category-filter') || {}).value || '';

  const rows = GOODS_DATA.filter(g =>
    (!cat || g.Category === cat) &&
    (!t   || (g['Item Name'] || '').toLowerCase().includes(t)
          || (g.Category    || '').toLowerCase().includes(t)
          || (g.Notes       || '').toLowerCase().includes(t))
  );

  if (rows.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">' +
      'Nothing matches.</p>';
    return;
  }

  // Grouped under the book's own headings -- this is a list you scan for a price,
  // not one you hunt through item by item, so Table 44's groupings are the useful
  // ordering. Any category not in the known list still renders, appended after.
  const known = ['Clothing', 'Provisioning', 'Food & Lodging', 'Service'];
  const cats  = known.concat(
    [...new Set(rows.map(g => g.Category))].filter(c => known.indexOf(c) === -1)
  );

  // "Food & Lodging" contains an ampersand, so escaping is not optional here.
  let html = '';
  cats.forEach(c => {
    const group = rows.filter(g => g.Category === c);
    if (!group.length) return;
    html += '<div style="font-weight:600;color:var(--accent-light);font-size:12px;' +
            'margin:10px 0 4px;">' + escapeHtml(c) + '</div>';
    group.forEach(g => {
      html += '<div style="display:flex;justify-content:space-between;gap:12px;' +
              'padding:3px 6px;border-bottom:1px solid var(--border);font-size:12px;">' +
              '<span>' + escapeHtml(g['Item Name']) + '</span>' +
              '<span style="color:var(--muted);white-space:nowrap;">' + escapeHtml(g.Cost) + '</span>' +
              '</div>';
    });
  });

  html += '<div style="font-size:11px;color:var(--muted);margin-top:12px;font-style:italic;">' +
          'Showing ' + rows.length + ' of ' + GOODS_DATA.length + ' entries.</div>';

  resultsDiv.innerHTML = html;
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

    // PHB Table 63, read LIVE from LIGHT_SOURCES. core_equipment.json
    // deliberately does NOT restate radius or burning time -- one source of
    // truth, per the anchor rule, so these can never drift apart.
    //
    // null for anything Table 63 omits (Lamp, Common and Tinder Box), and
    // those correctly show no light line at all rather than an invented one.
    const ls63 = (typeof lightSourceByName === 'function')
      ? lightSourceByName(item['Item Name']) : null;
    if (ls63) {
      details.push(ls63.beamWidth
        ? `Light: ${ls63.radius} ft. beam, ${ls63.beamWidth} ft. wide at far end, burns ${ls63.burn} (Table 63)`
        : `Light: ${ls63.radius} ft. radius, burns ${ls63.burn} (Table 63)`);
      // Reads burnNote from LIGHT_SOURCES rather than restating the conflict in
      // core_equipment.json -- one source of truth, same as the numbers above.
      if (ls63.burnNote) details.push(ls63.burnNote);
    }
    
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

  // Header. Now a .stat-strip, styled by style.css rather than inline cssText --
  // same reason the card builders stopped styling themselves: the inline copies
  // drift and the theme switcher cannot reach them.
  const headerDiv = document.createElement('div');
  headerDiv.className = 'stat-strip';
  const atLimit = countedLangs >= languageLimit;

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
  const extraText = extras.length ? ` (${extras.join(', ')})` : '';

  // Three caption/value pairs. The at-limit state keeps --error via .over,
  // which means "wrong or forbidden" on every other surface too.
  headerDiv.innerHTML =
    `<span class="lab">LANGUAGES</span>` +
    `<span class="pair">known<b>${totalKnown}</b>${escapeHtml(extraText)}</span>` +
    `<span class="pair${atLimit ? ' over' : ''}">against INT cap` +
      `<b>${countedLangs} / ${languageLimit}</b></span>` +
    `<span class="pair">NWP slot${slotsSpent === 1 ? '' : 's'} spent<b>${slotsSpent}</b></span>`;
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
    const escName = escapeHtml(nativeLang.name);
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
          <strong>${escapeHtml(lang.name)}</strong>
          <span style="margin-left:8px;font-size:11px;color:var(--muted);">${lang.rarity}</span>
          ${badges}
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">
            ${lang.languageClass || ''}${lang.languageClass ? ' &middot; ' : ''}Cost: ${costText}
          </div>
          ${lang.description ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${escapeHtml(lang.description)}</div>` : ''}
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
// ===== Animals, Mounts & Transport browser (PHB Tables 44 + 49) =====
// Feeds the two follower lists. There is DELIBERATELY no "add to equipment"
// path: Chapter 6 gives animals no weight, so an inventory row would sit in the
// encumbrance total contributing nothing -- the same reason the goods modal is
// read-only. A goat belongs in the Unbonded list, which already covers animals
// the character owns without a bond.
function renderAnimalsBrowser(root) {
  const resultsDiv = root.querySelector('.animals-results');
  if (!resultsDiv) return;

  if (typeof ANIMALS_DATA === 'undefined' || !ANIMALS_DATA || ANIMALS_DATA.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">' +
      'Animal list not loaded. Check that js/core_animals.json is reachable.</p>';
    return;
  }

  const t   = ((root.querySelector('.animals-search') || {}).value || '').toLowerCase();
  const cat = (root.querySelector('.animals-category-filter') || {}).value || '';

  const rows = ANIMALS_DATA.filter(a =>
    (!cat || a.Category === cat) &&
    (!t   || (a.Name     || '').toLowerCase().indexOf(t) !== -1
          || (a.Category || '').toLowerCase().indexOf(t) !== -1)
  );

  resultsDiv.innerHTML = '';
  if (rows.length === 0) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">' +
      'Nothing matches.</p>';
    return;
  }

  rows.forEach(a => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px;' +
                        'padding:5px 6px;border-bottom:1px solid var(--border);font-size:12px;';

    // Only the 14 Table 49 mounts have load bands; everything else is priced only.
    const bands = a['Base Move']
      ? ' &middot; carries ' + escapeHtml(a['Base Move']) +
        ' <span style="opacity:0.7;">(2/3 move ' + escapeHtml(a['2/3 Move']) +
        ', 1/3 move ' + escapeHtml(a['1/3 Move']) + ')</span>'
      : '';

    const info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;';
    info.innerHTML = '<strong>' + escapeHtml(a.Name) + '</strong>' +
      '<span style="color:var(--muted);"> &middot; ' +
      escapeHtml(a.Cost || 'no price listed') + bands + '</span>';

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';

    const bonded = document.createElement('button');
    bonded.textContent = '+ Bonded';
    bonded.style.cssText = 'padding:2px 8px;font-size:11px;';
    bonded.title = 'Add to Bonded Mounts & Animal Companions. The book name goes into ' +
                   'Species and Name is left blank for you to fill in.';
    bonded.addEventListener('click', () => addAnimalFromBrowser(root, a, 'bonded'));

    const unbonded = document.createElement('button');
    unbonded.textContent = '+ Unbonded';
    unbonded.style.cssText = 'padding:2px 8px;font-size:11px;';
    unbonded.title = 'Add to Unbonded Mounts & Vehicles.';
    unbonded.addEventListener('click', () => addAnimalFromBrowser(root, a, 'unbonded'));

    btns.appendChild(bonded);
    btns.appendChild(unbonded);
    row.appendChild(info);
    row.appendChild(btns);
    resultsDiv.appendChild(row);
  });

  const count = document.createElement('div');
  count.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:var(--muted);' +
                        'border-top:1px solid var(--border);margin-top:8px;';
  count.textContent = 'Showing ' + rows.length + ' of ' + ANIMALS_DATA.length + ' entries';
  resultsDiv.appendChild(count);
}

function addAnimalFromBrowser(root, entry, destination) {
  // Table 49's load bands are a NOTE, not a computed field. Nothing yet works
  // out a mount's actual movement from what it is carrying -- if that gets
  // built, this note is the data it would use.
  const capacityNote = entry['Base Move']
    ? 'Carries ' + entry['Base Move'] + ' at full move, ' + entry['2/3 Move'] +
      ' at 2/3 move, ' + entry['1/3 Move'] + ' at 1/3 move (PHB Table 49).'
    : '';

  const markDirty = () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
  };

  if (destination === 'bonded') {
    const list = root.querySelector('.companions-list');
    if (!list) return;
    // Species holds the book name and Name is left BLANK, because a companion is
    // named by its owner. The companion node has no cost field, so the price
    // rides along in notes rather than being silently dropped.
    const notes = [entry.Cost ? 'Cost: ' + entry.Cost : '', capacityNote, entry.Notes || '']
      .filter(Boolean).join(' ');
    list.appendChild(makeCompanionNode({
      name:     '',
      species:  entry.Name,
      capacity: entry['Base Move'] || '',
      // Ticked only for the 14 Table 49 mounts -- an animal with a carrying
      // capacity is one you can ride or load. One click undoes it.
      isMount:  !!entry['Base Move'],
      notes:    notes
    }, markDirty));
  } else {
    const list = root.querySelector('.mounts-list');
    if (!list) return;
    // Movement is left blank on purpose. Table 49 gives carrying capacity, not
    // speed, and Chapter 6 sends vehicle movement rates to the DMG.
    const notes = [capacityNote, entry.Notes || ''].filter(Boolean).join(' ');
    list.appendChild(makeMountNode({
      name:     entry.Name,
      type:     entry.Category,
      cost:     entry.Cost || '',
      capacity: entry['Base Move'] || '',
      notes:    notes
    }, markDirty));
  }

  markDirty();
}

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
    // THE ANCHOR RULE: the browser knows the category, so it is stored on the
    // record. Without this the card's type caption has no backing data and
    // would have to be guessed from the name -- the same problem ammoKey was
    // added to solve. A hand-added item simply has none, and shows none.
    category: item.Category || '',
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
    
    // Three reasons a Learn button should not be offered, all of them cases
    // where clicking it would waste a proficiency slot on nothing.
    const wName = weapon['Weapon Name'];
    const norm  = s => String(s || '').trim().toLowerCase();
    const known = (root._weaponProfs || []);

    //  (1) ALREADY KNOWN. On a 109-row list the only way to check was to scroll
    //      back to the proficiency list and compare by eye.
    const haveIt = known.some(p => p && norm(p.name) === norm(wName));

    //  (2) COVERED BY A SAME-PROFICIENCY PAIR. Knife/Stiletto, Quarterstaff/Bo
    //      Stick and Short Sword/Drusus are ONE proficiency with two names --
    //      PHBR1 p.59 prints each as a single slash-joined entry. Buying the
    //      second name spends a slot on something already owned.
    const coveredBy = haveIt ? null : known.find(p =>
      p && typeof samePHBR1Proficiency === 'function' &&
      samePHBR1Proficiency(wName, p.name));

    //  (3) REQUIRES NO PROFICIENCY AT ALL. PHBR1 p.96, restated in the p.60
    //      Non-Groups list: "The Cestus doesn't require any Proficiency. It
    //      enhances punching damage, and everyone knows how to punch."
    const noProf = norm(wName) === 'cestus';

    const learnBtn = document.createElement('button');
    learnBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';

    if (noProf && !haveIt) {
      // NOT disabled. PHBR1 p.96: "Cestus ... does not require weapon
      // proficiency; anyone can use cesti with no proficiency penalty.
      // Therefore, Specialization with Cestus costs only one weapon proficiency
      // slot." The entry is still needed -- it is what the Specialized checkbox
      // hangs on, and p.25 lists Cestus among the weapons a Gladiator may take
      // his free Weapon Specialization in. Disabling this made a legal purchase
      // unreachable.
      //
      // The row it adds should be worth ZERO slots until Specialized is ticked,
      // which is the `slots` field on the proficiency record.
      learnBtn.textContent = 'Add (0 slots)';
      learnBtn.title = 'The cestus requires no weapon proficiency -- everyone can ' +
                       'use one with no penalty (PHBR1 p.96). Adding it here costs ' +
                       'NOTHING; it exists so you can tick Specialized, which costs ' +
                       'one slot instead of the usual two, precisely because there ' +
                       'is no proficiency to buy first.';
      learnBtn.onclick = (e) => {
        e.stopPropagation();
        addWeaponProficiency(root, weapon);
      };
    } else if (haveIt) {
      learnBtn.textContent = 'Known';
      learnBtn.disabled = true;
      learnBtn.title = 'Already in your weapon proficiencies.';
    } else if (coveredBy) {
      learnBtn.textContent = 'Covered';
      learnBtn.disabled = true;
      learnBtn.title = `Covered by your ${coveredBy.name} proficiency -- these are ` +
                       `one proficiency with two names (PHBR1 p.59), so there is ` +
                       `nothing further to buy.`;
    } else {
      learnBtn.textContent = 'Learn';
      learnBtn.onclick = (e) => {
        e.stopPropagation();
        addWeaponProficiency(root, weapon);
      };
    }

    if (learnBtn.disabled) {
      learnBtn.style.opacity = '0.55';
      learnBtn.style.cursor  = 'not-allowed';
      // The ROW dims too, so a scan down the list reads as a column of
      // availability rather than requiring the button text to be read on each.
      weaponDiv.style.opacity = '0.65';
    }
    
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

  // PHBR1 p.96: "Cestus, because it is simply a bonus to punching-type attacks,
  // does not require weapon proficiency; anyone can use cesti with no
  // proficiency penalty. Therefore, Specialization with Cestus costs only one
  // weapon proficiency slot."
  //
  // The row still has to EXIST -- it is what the Specialized checkbox hangs on,
  // and PHBR1 p.25 lists Cestus among the weapons a Gladiator may take his free
  // Weapon Specialization in. It just costs nothing by itself, so a specialist
  // pays 1 rather than the usual 1 + 1. Kept here rather than in the browser so
  // it holds however the row was added.
  const freeProficiency =
    String(weapon['Weapon Name'] || '').trim().toLowerCase() === 'cestus';

  root._weaponProfs.push({
    name: weapon['Weapon Name'],
    weaponTypeKey: profTypeKey,
    // Derived from the key, with the browser's own Group as the fallback for
    // the impossible case where inference misses.
    group: (typeof getWeaponGroup === 'function')
      ? getWeaponGroup(profTypeKey, weapon.Group || '')
      : (weapon.Group || ''),
    slots: freeProficiency ? 0 : 1
  });
  
  renderWeaponProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// PHBR1 pp.61-62. Who may KNOW a style and who may SPECIALIZE in one are two
// different questions, and the book answers them separately.
//
// KNOWN, fixed at creation and never expandable: "All Warriors start play
// knowing how to use all four styles. Priests start play knowing how to use
// Single-Weapon, Two-Hander, and Weapon and Shield styles. Rogues start play
// knowing how to use Single-Weapon, Two-Hander, and Two-Weapon styles. Wizards
// start play knowing how to use Single-Weapon and Two-Hander styles."
const PHBR1_STYLES_KNOWN = {
  warrior: ['singleWeapon', 'twoHander', 'weaponShield', 'twoWeapon'],
  priest:  ['singleWeapon', 'twoHander', 'weaponShield'],
  rogue:   ['singleWeapon', 'twoHander', 'twoWeapon'],
  wizard:  ['singleWeapon', 'twoHander']
};
const PHBR1_STYLE_LABELS = {
  singleWeapon: 'Single-Weapon',
  twoHander:    'Two-Hander',
  weaponShield: 'Weapon and Shield',
  twoWeapon:    'Two-Weapon'
};

// Returns plain strings. Every one is a WARNING -- nothing here prevents a
// selection or alters a number, because the DM may have ruled otherwise and
// PHBR1 p.37 explicitly invites him to.
function getFightingStyleAdvisories(root) {
  const out = [];
  const styles = (typeof getFightingStyles === 'function')
    ? getFightingStyles(root) : null;
  if (!styles || !styles.active) return out;

  const classes = (typeof getCharacterClassList === 'function')
    ? getCharacterClassList(root) : [];
  const cats = classes
    .map(c => (typeof getClassCategory === 'function') ? getClassCategory(c) : null)
    .filter(Boolean);
  const charType = ((typeof val === 'function' ? val(root, 'char_type') : '') || 'single')
    .toLowerCase();

  // A multi-class character knows the union of his classes' styles -- he is both
  // things at once. Silent when the class is unrecognised or homebrew rather
  // than guessing at a category.
  const known = {};
  cats.forEach(cat => (PHBR1_STYLES_KNOWN[cat] || []).forEach(k => { known[k] = true; }));

  const taken = Object.keys(PHBR1_STYLE_LABELS).filter(k => styles[k] > 0);

  if (cats.length) {
    taken.filter(k => !known[k]).forEach(k => {
      out.push(`${PHBR1_STYLE_LABELS[k]} is not a style your class knows, and styles ` +
               `cannot be learned after creation (PHBR1 p.61).`);
    });

    // "Only Warriors, Rogues and Priests can buy Style Specializations. Only
    // Warriors and Rogues can buy the Two-Weapon Style Specialization."
    if (taken.length && cats.every(c => c === 'wizard')) {
      out.push('Wizards cannot buy Style Specialization (PHBR1 p.62).');
    }
    if (styles.twoWeapon > 0 && !cats.some(c => c === 'warrior' || c === 'rogue')) {
      out.push('Only Warriors and Rogues may specialize in Two-Weapon Style (PHBR1 p.62).');
    }

    // "A character may begin play with only one Style Specialization. If he is a
    // single-class Warrior, may learn others as he gains new Weapon
    // Proficiencies through experience."
    const isSingleWarrior = charType === 'single' && cats.length === 1 && cats[0] === 'warrior';
    if (taken.length > 1 && !isSingleWarrior) {
      out.push('Only a single-class Warrior may hold more than one Style ' +
               'Specialization (PHBR1 p.62).');
    }
  }

  // PHBR1 p.57. The -2 for fighting with the wrong hand is SITUATIONAL -- the
  // book's example is a character whose good hand is chained to a wall -- so it
  // is stated here rather than applied to any number. It becomes computable only
  // when hit locations exist and a Numbed or Useless arm forces the swap.
  //
  // This is also the ONLY thing ambidexterity does outside two-weapon fighting,
  // so a player who spent the slot should be told what he bought.
  const hand = ((typeof val === 'function' ? val(root, 'handedness') : '') || 'right');
  if (styles.ambidextrous) {
    out.push('Ambidextrous: no -2 for fighting with either hand, and equally adept ' +
             'at noncombat tasks with both (PHBR1 p.61). This grants no extra attack.');
  } else {
    out.push(`${hand === 'left' ? 'Left' : 'Right'}-handed: -2 to hit with ALL attacks ` +
             `on any round you are forced to fight with the other hand (PHBR1 p.57).`);
  }

  // NOT SILENTLY INERT. Weapon and Shield's main grant is an extra attack usable
  // only for Shield-Punch and Parry, and neither maneuver exists in this tool
  // yet, so a player who spent the slot would otherwise see nothing happen at
  // all and reasonably conclude the app is broken.
  if (styles.weaponShield > 0) {
    out.push('Weapon and Shield grants an extra attack usable ONLY for ' +
             'Shield-Punch and Parry (PHBR1 p.63) \u2014 neither maneuver is built ' +
             'yet, so nothing is applied for it.');
  }

  return out;
}

// PHBR1 pp.61-64. THE ONE READER of the four style fields, so the slot counter
// and the Armor Class term can never disagree about what the character bought --
// two expressions of one rule is how the AC variants drifted in the first place.
//
// Returns zeros when PHBR1 is switched off, and that is the entire gate: with
// the book off a style costs nothing and grants nothing, while the values the
// player entered sit untouched on the sheet and come back the moment it is
// switched on again. Suspended, never refunded, never deleted -- the same
// treatment the Fallen Paladin spec gives a spellbook.
//
// Clamped to the printed maxima rather than trusted: Single-Weapon and Weapon
// and Shield cap at two slots, the other two at one, and a hand-edited save
// should not be able to buy a third.
function getFightingStyles(root) {
  const off = { singleWeapon: 0, twoHander: 0, weaponShield: 0, twoWeapon: 0,
                ambidextrous: 0, total: 0, active: false };
  if (typeof isSupplementActive !== 'function') return off;
  if (!isSupplementActive('phbr1', 'core')) return off;

  const n = f => {
    const el = root.querySelector('[data-field="' + f + '"]');
    const v  = el ? parseInt(el.value, 10) : 0;
    return isNaN(v) ? 0 : Math.max(0, v);
  };
  const s = {
    singleWeapon: Math.min(2, n('style_single_weapon')),
    twoHander:    Math.min(1, n('style_two_hander')),
    weaponShield: Math.min(2, n('style_weapon_shield')),
    twoWeapon:    Math.min(1, n('style_two_weapon')),
    // PHBR1 p.60. Not a style, but it costs one weapon proficiency slot from the
    // same budget, so it belongs in the total the counter charges for.
    ambidextrous: Math.min(1, n('style_ambidextrous')),
    active: true
  };
  s.total = s.singleWeapon + s.twoHander + s.weaponShield + s.twoWeapon +
            s.ambidextrous;
  return s;
}

// Render the weapon + nonweapon proficiency slot counters (PHB Table 34).
function renderProficiencySlots(root) {
  // FIRST statement deliberately. This function has two early returns below --
  // missing elements, and an unrecognized class whose budget cannot be computed
  // -- and the Proficiency Abilities section must still render for a homebrew
  // class. Threading the call through both branches would be fragile, so it
  // leads instead. Same reason renderWisGateNote leads renderSpellSlots.
  if (typeof renderProficiencyAbilities === 'function') renderProficiencyAbilities(root);

  // PHBR1 pp.61-64. Shown only when the book is on; the four fields keep their
  // values either way, so switching the book off and on again returns the
  // character to exactly where he was.
  const stylesBox = root.querySelector('.fighting-styles');
  if (stylesBox) {
    stylesBox.style.display =
      (typeof isSupplementActive === 'function' && isSupplementActive('phbr1', 'core'))
        ? '' : 'none';
    const noteEl = stylesBox.querySelector('.fighting-styles-note');
    if (noteEl) {
      const adv = (typeof getFightingStyleAdvisories === 'function')
        ? getFightingStyleAdvisories(root) : [];
      // ADVISORY, NEVER BLOCKING. The dropdowns stay fully selectable and the
      // arithmetic keeps running -- PHBR1 p.37 tells DMs to modify these rules
      // for their own campaigns, so a warning is the most the sheet may do.
      noteEl.textContent = adv.length ? adv.join('  \u00B7  ') : '';
      noteEl.style.color = adv.length ? 'var(--warning)' : '';
    }
  }

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

  // PHBR1 pp.61-64. Style specializations are bought from THIS budget, one slot
  // each, and Single-Weapon and Weapon and Shield may each take a second. Zero
  // when the book is off, so a PHB-only table sees the number it always saw.
  const styles = getFightingStyles(root);
  wpSpent += styles.total;

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

  // Same reasoning as the language note below: style slots are spend that is not
  // visible in the proficiency list, so "5 / 4 used" over a four-item list would
  // read as a contradiction resolvable only by hovering -- and on a phone there
  // is no hover at all.
  let wpLabel = `${wpSpent} / ${budget.wpTotal} used`;
  if (styles.total > 0) {
    wpLabel += ` \u00B7 ${styles.total} on style${styles.total === 1 ? '' : 's'}`;
  }
  wpTextEl.textContent = wpLabel;
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
    if (styles.total > 0) {
      const bits = [];
      if (styles.singleWeapon) bits.push(`Single-Weapon x${styles.singleWeapon}`);
      if (styles.twoHander)    bits.push(`Two-Hander`);
      if (styles.weaponShield) bits.push(`Weapon and Shield x${styles.weaponShield}`);
      if (styles.twoWeapon)    bits.push(`Two-Weapon`);
      if (styles.ambidextrous) bits.push(`Ambidexterity`);
      t += `\n  (includes ${styles.total} slot${styles.total === 1 ? '' : 's'} on`;
      t += `\n   fighting styles -- ${bits.join(', ')};`;
      t += `\n   PHBR1 pp.61-64)`;
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
        <strong>${escapeHtml(prof.name)}</strong>
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

    // Circumstance-dependent bonuses. Kept OUT of the check target on purpose
    // -- see NWP_SITUATIONAL_NOTES in tables.js -- so they are shown rather
    // than silently added. Text is authored, not user input, so no escaping.
    const situational = (typeof NWP_SITUATIONAL_NOTES === 'object' && NWP_SITUATIONAL_NOTES)
      ? (NWP_SITUATIONAL_NOTES[(nwp.name || '').trim().toLowerCase()] || [])
      : [];

    nwpDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
        <div style="flex:1;">
          <strong>${escapeHtml(nwp.name)}</strong>
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
          ${nwp.notes ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;font-style:italic;">${escapeHtml(nwp.notes)}</div>` : ''}
          ${situational.length ? `
          <details class="disclosure" style="font-size:11px;margin-top:4px;">
            <summary>situational</summary>
            <ul style="margin:4px 0 0 16px;padding:0;color:var(--muted);">
              ${situational.map(s => `<li style="margin-bottom:2px;">${s}</li>`).join('')}
            </ul>
          </details>` : ''}
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
  const base = getNWPCheckTarget(root, entry.nwp);
  const coop = getProficiencyCooperation(root);

  // PHBR11 Tables 15-17 replace PHB Table 39 outright -- the book says so in as
  // many words -- so this is a list swap, not a merge. The loop below is
  // unchanged: both lists share the same {key, label, mod, repeating, per}
  // shape, and the CRH entries add `group` and `autoLevel` on top.
  const useCRH = (typeof isOptionalRule === 'function') &&
                 isOptionalRule('rangerTrackingCRH') &&
                 (typeof TRACKING_MODIFIERS_CRH !== 'undefined');
  const modList = useCRH ? TRACKING_MODIFIERS_CRH : (TRACKING_MODIFIERS || []);

  let total = base.hasCheck ? base.target : 0;
  const lines = [];
  base.adjustments.forEach(a =>
    lines.push(`${a.label}: ${a.mod < 0 ? a.mod : '+' + a.mod}`));

  // Table 17's "+1 per three experience levels" is DERIVED, never entered. The
  // ranger's level is already on the sheet, and asking him to type it would be
  // a field the player fills in about himself. getRangerComponent handles
  // single, multi and dual class.
  let rangerLevel = 0;
  if (useCRH && typeof getRangerComponent === 'function') {
    const comp = getRangerComponent(root);
    if (comp && comp.level) rangerLevel = comp.level;
  }
  const levelBonus = Math.floor(rangerLevel / 3);

  modList.forEach(m => {
    if (m.autoLevel) {
      if (levelBonus > 0) {
        total += levelBonus;
        lines.push(`Ranger level ${rangerLevel} (+1 per 3): +${levelBonus}`);
      }
      return;
    }
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

  // Terrain and illumination are "use only one" in the CRH, so they render as
  // RADIOS. The PHB list is one flat group of checkboxes and keeps that shape.
  const renderRow = m => {
    if (m.autoLevel) {
      return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="width:52px;flex-shrink:0;text-align:center;padding:2px 4px;font-size:11px;
                             border:1px solid var(--border);border-radius:var(--radius);
                             background:color-mix(in srgb, var(--accent) 10%, transparent);
                             color:var(--accent-light);font-weight:600;">${levelBonus > 0 ? '+' + levelBonus : '\u2014'}</span>
                <span>${escapeHtml(m.label)}
                  <span style="color:var(--muted);">(from your ranger level, not entered)</span>
                </span>
              </div>`;
    }
    const note = m.note
      ? `<div style="color:var(--muted);margin-left:22px;">${escapeHtml(m.note)}</div>` : '';
    if (m.repeating) {
      return `<div style="margin-bottom:4px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <input type="number" class="trk-num" data-key="${m.key}" min="0" step="1"
                         value="${Math.max(0, parseInt(st[m.key], 10) || 0)}"
                         style="width:52px;flex-shrink:0;padding:2px 4px;font-size:11px;">
                  <span>${escapeHtml(m.countLabel)}
                    <span style="color:var(--muted);">(${m.mod > 0 ? '+' : ''}${m.mod} per ${m.per})</span>
                  </span>
                </div>${note}
              </div>`;
    }
    const grp = m.group && TRACKING_GROUPS_CRH && TRACKING_GROUPS_CRH[m.group];
    const exclusive = !!(grp && grp.exclusive);
    // A zero-modifier row does nothing when ticked. It stays in the list so a
    // player scanning for "normal ground" finds it, but is muted so it does not
    // read as broken. NOT muted when exclusive -- there it is a real choice.
    const dim = (m.mod === 0 && !exclusive) ? 'opacity:0.55;' : '';
    const input = exclusive
      ? `<input type="radio" class="trk-radio" name="trk-grp-${m.group}" data-key="${m.key}"
                data-group="${m.group}" ${st[m.key] ? 'checked' : ''}
                style="width:auto;flex-shrink:0;">`
      : `<input type="checkbox" class="trk-chk" data-key="${m.key}" ${st[m.key] ? 'checked' : ''}
                style="width:auto;flex-shrink:0;">`;
    return `<div style="margin-bottom:4px;">
              <label style="display:flex;align-items:flex-start;gap:6px;color:var(--text);cursor:pointer;${dim}">
                ${input}
                <span>${escapeHtml(m.label)}
                  <span style="color:var(--muted);">(${m.mod > 0 ? '+' : ''}${m.mod})</span>
                </span>
              </label>${note}
            </div>`;
  };

  // Each CRH table gets its own bordered box with an uppercase rule label, so
  // "use only one" and "use all applicable" are attached to the group they
  // govern rather than asserted once at the top for a mixed list. Matches the
  // Ranger Stealth section's grammar directly above it.
  let rows;
  if (useCRH) {
    const BOX = 'flex:1 1 260px;min-width:240px;padding:10px 12px;border:1px solid var(--border);' +
                'border-radius:var(--radius);background:var(--glass);';
    const CAP = 'font-size:10px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;' +
                'color:var(--accent-light);margin-bottom:8px;';
    rows = '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
      Object.keys(TRACKING_GROUPS_CRH).map(g => {
        const inGroup = modList.filter(m => m.group === g);
        if (!inGroup.length) return '';
        const meta  = TRACKING_GROUPS_CRH[g];
        const parts = meta.label.split('\u2014');
        const name  = escapeHtml((parts[0] || meta.label).trim());
        const rule  = parts[1] ? escapeHtml(parts[1].trim()) : '';
        // Special is the long one; let it take the full width on its own row.
        const box = meta.exclusive ? BOX : BOX + 'flex-basis:100%;';
        return `<div style="${box}">
                  <div style="${CAP}">${name}${rule ? ' <span style="font-weight:normal;text-transform:none;letter-spacing:0;color:var(--muted);">\u00B7 ' + rule + '</span>' : ''}</div>
                  ${inGroup.map(renderRow).join('')}
                </div>`;
      }).join('') + '</div>';
  } else {
    rows = modList.map(renderRow).join('');
  }

  const _unusedRows = (TRACKING_MODIFIERS || []).map(m => {
    // A zero-modifier row does nothing when ticked. It stays in the list so a
    // player scanning for "normal ground" finds it, but is muted so it does not
    // read as broken.
    const dim = m.mod === 0 ? 'opacity:0.55;' : '';
    return m.repeating
      ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
           <input type="number" class="trk-num" data-key="${m.key}" min="0" step="1"
                  value="${Math.max(0, parseInt(st[m.key], 10) || 0)}"
                  style="width:52px;flex-shrink:0;padding:2px 4px;font-size:11px;">
           <span>${escapeHtml(m.countLabel)}
             <span style="color:var(--muted);">(${m.mod > 0 ? '+' : ''}${m.mod} per ${m.per})</span>
           </span>
         </div>`
      : `<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;color:var(--text);cursor:pointer;${dim}">
           <input type="checkbox" class="trk-chk" data-key="${m.key}" ${st[m.key] ? 'checked' : ''}
                  style="width:auto;flex-shrink:0;">
           <span>${escapeHtml(m.label)}
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
         Chance ${total}, above the die \u00B7 movement ${move ? escapeHtml(move.label) : '\u2014'} (whole party)
       </div>`
    : `<div style="font-weight:600;color:var(--accent-light);">Chance to track: ${total} or less on 1d20</div>
       <div style="font-size:11px;color:var(--muted);margin-top:2px;">
         Movement while tracking: ${move ? escapeHtml(move.label) : '\u2014'} (whole party)
         \u00B7 a natural 20 always fails
       </div>`;

  panelEl.innerHTML = `
    <div style="padding:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);margin-bottom:12px;">
      ${result}
      ${lines.length ? `<div style="font-size:11px;color:var(--muted);margin-top:6px;white-space:pre-wrap;">${escapeHtml(lines.join('\n'))}</div>` : ''}
    </div>

    <div style="font-size:11px;font-weight:600;margin-bottom:6px;">${useCRH
      ? 'Conditions \u2014 each box says whether it takes one choice or several'
      : 'Conditions \u2014 tick every one that applies, they are cumulative'}</div>
    <div style="${useCRH
      ? 'font-size:11px;margin-bottom:12px;'
      : 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0 16px;font-size:11px;margin-bottom:12px;'}">
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
  // A radio group is one choice, so selecting one must CLEAR its siblings in
  // the scratch state -- the browser unchecks them visually but knows nothing
  // about st.
  panelEl.querySelectorAll('.trk-radio').forEach(el => {
    el.onchange = () => {
      (TRACKING_MODIFIERS_CRH || [])
        .filter(m => m.group === el.dataset.group)
        .forEach(m => { st[m.key] = false; });
      st[el.dataset.key] = true;
      renderProficiencyAbilities(root);
    };
  });
  panelEl.querySelectorAll('.trk-num').forEach(el => {
    el.onchange = () => { st[el.dataset.key] = el.value; renderProficiencyAbilities(root); };
  });
};

// --- Riding, Land-Based (PHB Ch.5) ---
// A REFERENCE panel: no inputs. Its value over the printed prose is marking
// which feats are automatic and which need a check, and computing the -4 leap
// target the player would otherwise work out mid-combat.
// NOTE the proficiency is NOT required to ride -- only Airborne says that. Land
// riding without it works; the proficiency buys these feats.
PROF_ABILITY_BUILDERS['riding, land-based'] = function (root, entry, panelEl) {
  
  const c = getNWPCheckTarget(root, entry.nwp);
  const fail = (typeof NWP_NATURAL_FAIL === 'number') ? NWP_NATURAL_FAIL : 20;
  const fmt = t => t < 1 ? 'no roll can succeed'
    : t >= fail ? 'automatic, but a natural 20 still fails'
    : `roll ${t} or less`;

  const head = c.hasCheck
    ? `<div style="font-weight:600;color:var(--accent-light);">Riding check: ${escapeHtml(c.abilityLabel)} ${c.score}${c.modifier ? (c.modifier < 0 ? ' ' + c.modifier : ' +' + c.modifier) : ''} = ${fmt(c.target)}</div>
       <div style="font-size:11px;color:var(--muted);margin-top:2px;">
         Leaping down to attack takes &minus;4: ${fmt(c.target - 4)}
       </div>`
    : '<div style="color:var(--muted);">No ability check listed.</div>';

  // check: 'no' automatic, 'yes' needs a proficiency check, 'penalty' at -4.
  const feats = [
    { check: 'no',  name: 'Vault into the saddle',
      text: 'Automatic while the mount stands still, even in armor. A check is needed to get it moving in the same round, or to vault onto a moving mount. Failure means falling to the ground.' },
    { check: 'no',  name: 'Jump obstacles, leap gaps',
      text: 'Automatic under 3 ft tall or 12 ft across. A check pushes that to 7 ft tall or 30 ft across. Failure means the mount balks, then a second check to keep your seat.' },
    { check: 'yes', name: 'Spur to great speed',
      text: '+6 ft per round to the mount\u2019s movement, up to 4 turns, with a check each turn. Fail the first and no further attempts may be made, though the mount moves normally. Fail a later one and it slows to a walk and you must dismount and lead it for a turn. Either way, after 4 turns of racing the steed must be walked by its dismounted rider for one turn.' },
    { check: 'no',  name: 'Guide with the knees',
      text: 'Frees both hands for bows or two-handed weapons. No check unless you take damage while riding \u2014 then a check, and failure means falling for an extra 1d6.' },
    { check: 'no',  name: 'Hang alongside the steed',
      text: 'Armor Class improved by 6, and any attack that would have struck your normal AC strikes the mount instead. You cannot attack or wear armor while doing it.' },
    { check: 'penalty', name: 'Leap down and attack',
      text: 'Melee attack against anything within 10 ft, at &minus;4 to the check. Failure means landing badly for 1d3 damage.' }
  ];

  const tag = f => f.check === 'no'
    ? '<span style="color:var(--success, #6fbf73);">automatic</span>'
    : f.check === 'penalty'
    ? '<span style="color:var(--warning, #e0a34a);">check at &minus;4</span>'
    : '<span style="color:var(--info, #6fb3d2);">check</span>';

  panelEl.innerHTML = `
    <div style="padding:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);margin-bottom:12px;">
      ${head}
    </div>
    <div style="font-size:11px;">
      ${feats.map(f => `
        <div style="margin-bottom:8px;">
          <div><strong>${escapeHtml(f.name)}</strong> &middot; ${tag(f)}</div>
          <div style="color:var(--muted);margin-top:1px;">${f.text}</div>
        </div>`).join('')}
    </div>
    <details class="disclosure" style="font-size:11px;">
      <summary>mount types</summary>
      <div style="color:var(--muted);margin-top:6px;line-height:1.5;">
        The mount type is declared when the proficiency slot is filled. The book
        names griffons, unicorns and dire wolves among the possibilities, along
        with virtually any creature used as a mount by humans, demihumans or
        humanoids. Unlike Riding, Airborne, this entry does <strong>not</strong>
        say that additional slots buy additional mount types \u2014 so RAW they give
        +1 to the check instead. A DM may well allow the Airborne reading.
      </div>
    </details>
  `;
};

// --- Healing (PHB Ch.5) ---
// A CALCULATOR panel. The one thing it computes that the book does not hand you
// is the HERBALISM interaction: that proficiency raises the complete-rest
// recovery rate from 2 to 3, adds +2 to disease checks, and is what makes
// swallowed or touched poisons treatable at all. Detecting it removes three
// separate "do I have the other one?" lookups.
PROF_ABILITY_BUILDERS['healing'] = function (root, entry, panelEl) {
  const c    = getNWPCheckTarget(root, entry.nwp);
  const coop = getProficiencyCooperation(root) ? 1 : 0;
  const fail = (typeof NWP_NATURAL_FAIL === 'number') ? NWP_NATURAL_FAIL : 20;
  const fmt  = t => t < 1 ? 'no roll can succeed'
    : t >= fail ? 'automatic, 20 still fails'
    : `roll ${t} or less`;

  const herb = ((root && root._nwps) || [])
    .some(n => String((n && n.name) || '').trim().toLowerCase() === 'herbalism');

  const baseT    = (c.hasCheck ? c.target : 0) + coop;
  const diseaseT = baseT + (herb ? 2 : 0);

  const rates = [
    { hp: 1, when: 'Travelling or nonstrenuous activity', ok: true },
    { hp: 2, when: 'Complete rest', ok: !herb },
    { hp: 3, when: 'Complete rest, healer also has herbalism', ok: herb }
  ];

  panelEl.innerHTML = `
    <div style="padding:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);margin-bottom:12px;">
      <div style="font-weight:600;color:var(--accent-light);">Healing check: ${fmt(baseT)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">
        Disease treatment: ${fmt(diseaseT)}${herb ? ' (includes +2 for herbalism)' : ''}
        ${coop ? ' \u00B7 includes +1 for assistance' : ''}
      </div>
      <div style="font-size:11px;margin-top:4px;color:${herb ? 'var(--success, #6fbf73)' : 'var(--muted)'};">
        Herbalism: ${herb ? 'yes \u2014 better rest recovery, +2 vs disease, and swallowed or touched poisons treatable' : 'no \u2014 without it, rest recovery caps at 2 hp/day and swallowed or touched poisons cannot be treated'}
      </div>
    </div>

    <div style="font-size:11px;margin-bottom:12px;">
      <div style="font-weight:600;margin-bottom:4px;">First aid</div>
      <div style="color:var(--muted);margin-bottom:10px;">
        Tend within one round of wounding and make a successful check to restore
        <strong style="color:var(--text);">1d3 hit points</strong> \u2014 never more than
        were lost in the previous round. Only one attempt per character per day.
      </div>

      <div style="font-weight:600;margin-bottom:4px;">Recovery under care \u2014 no check, just regular attention</div>
      ${rates.map(r => `
        <div style="display:flex;gap:8px;margin-bottom:2px;${r.ok ? '' : 'opacity:0.45;'}">
          <span style="width:64px;flex-shrink:0;color:${r.ok ? 'var(--accent-light)' : 'var(--muted)'};">${r.hp} hp/day</span>
          <span style="color:var(--muted);">${escapeHtml(r.when)}</span>
        </div>`).join('')}
      <div style="color:var(--muted);margin-top:6px;">Up to six patients at a time.</div>
    </div>

    <details class="disclosure" style="font-size:11px;">
      <summary>poison and disease</summary>
      <div style="color:var(--muted);margin-top:6px;line-height:1.5;">
        <strong style="color:var(--text);">Poison</strong><br>
        Only for poison that entered <em>through a wound</em>. Begin tending the
        round after the character is poisoned and continue for the next five
        rounds: the victim gains <strong style="color:var(--text);">+2 to his saving
        throw</strong>, delayed until the last round of tending. No check is
        required, but the victim must be tended immediately, can do nothing
        himself, and the healer normally sacrifices any other action. If care or
        rest is interrupted he saves immediately and normally \u2014 and it cannot be
        retried, since more healing does not help.<br><br>
        Swallowed or touched poisons need <strong style="color:var(--text);">both
        healing and herbalism</strong>: healing to diagnose, herbalism to prepare
        a purgative.<br><br>
        <strong style="color:var(--text);">Disease</strong><br>
        A successful check automatically reduces a normal disease to its mildest
        form and shortest duration. Herbalism adds +2 to that check. A magical
        disease can be <em>diagnosed</em> on a successful check, but being magical
        it can only be treated by magical means.
      </div>
    </details>
  `;
};

// --- Shared helpers for the remaining panels ---
function paFmt(t) {
  const fail = (typeof NWP_NATURAL_FAIL === 'number') ? NWP_NATURAL_FAIL : 20;
  return t < 1 ? 'no roll can succeed'
    : t >= fail ? 'automatic, 20 still fails'
    : 'roll ' + t + ' or less';
}

function paBox(main, sub) {
  return '<div style="padding:8px;border:1px solid var(--border);border-radius:4px;' +
    'background:var(--glass);margin-bottom:12px;">' +
    '<div style="font-weight:600;color:var(--accent-light);">' + main + '</div>' +
    (sub ? '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' + sub + '</div>' : '') +
    '</div>';
}

function paHasProf(root, name) {
  const n = String(name).toLowerCase();
  return ((root && root._nwps) || [])
    .some(p => String((p && p.name) || '').trim().toLowerCase() === n);
}

function paLevel(root) {
  const comps = (typeof getAllClassComponents === 'function') ? getAllClassComponents(root) : [];
  const lv = comps.map(c => parseInt(c.level, 10) || 0).filter(Boolean);
  return lv.length ? Math.max.apply(null, lv) : (parseInt(val(root, 'level'), 10) || 0);
}

// Height is a FREE-TEXT field, so parse defensively. Returns inches or null --
// null means the caps cannot be computed and the panel says so rather than
// inventing a number.
function paHeightInches(root) {
  const t = String(val(root, 'height') || '').trim().toLowerCase();
  if (!t) return null;
  let m = t.match(/(\d+)\s*(?:'|ft|feet)\s*(\d+)?/);
  if (m) return parseInt(m[1], 10) * 12 + (parseInt(m[2], 10) || 0);
  m = t.match(/(\d+(?:\.\d+)?)\s*cm/);
  if (m) return Math.round(parseFloat(m[1]) / 2.54);
  m = t.match(/(\d+)\s*(?:"|in\b|inch)/);
  if (m) return parseInt(m[1], 10);
  m = t.match(/^(\d+(?:\.\d+)?)$/);
  if (m) {
    const n = parseFloat(m[1]);
    if (n >= 24 && n <= 108) return Math.round(n);   // inches
    if (n >= 2 && n <= 9)    return Math.round(n * 12); // feet
  }
  return null;
}

// --- Jumping (PHB Ch.5) ---
// CALCULATOR. The book gives formulas and two height caps; this resolves them
// against the character's own level and height so nothing is worked out at the
// table. No proficiency check is mentioned for jumping itself.
PROF_ABILITY_BUILDERS['jumping'] = function (root, entry, panelEl) {
  const lvl = paLevel(root);
  const half = Math.floor(lvl / 2);
  const h = paHeightInches(root);
  const ft = n => (n / 12).toFixed(1).replace(/\.0$/, '');
  const capBroad = h ? ft(h * 6) + ' ft' : null;
  const capHigh  = h ? ft(h * 1.5) + ' ft' : null;

  const jumps = [
    { n: 'Running broad jump', f: `2d6 + ${lvl} ft`,  c: capBroad ? `max ${capBroad} (6\u00D7 height)` : null,
      note: 'Needs a 20-foot running start.' },
    { n: 'Running high jump',  f: `1d3 + ${half} ft`, c: capHigh ? `max ${capHigh} (1\u00BD\u00D7 height)` : null,
      note: 'Needs a 20-foot running start.' },
    { n: 'Standing broad jump', f: `1d6 + ${half} ft`, c: null, note: 'No run-up.' },
    { n: 'Standing high jump',  f: '3 ft',             c: null, note: 'No run-up. A flat figure.' }
  ];

  panelEl.innerHTML =
    paBox('Level ' + lvl + (h ? ' \u00B7 height ' + ft(h) + ' ft' : ''),
      h ? 'Caps are computed from the Height field in Character Details.'
        : 'Set Height in Character Details to compute the 6\u00D7 and 1\u00BD\u00D7 caps.') +
    '<div style="font-size:11px;margin-bottom:12px;">' +
    jumps.map(j =>
      '<div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap;">' +
      '<span style="width:150px;flex-shrink:0;"><strong>' + escapeHtml(j.n) + '</strong></span>' +
      '<span style="color:var(--accent-light);width:110px;flex-shrink:0;">' + j.f + '</span>' +
      '<span style="color:var(--muted);">' + (j.c ? j.c + ' \u00B7 ' : '') + escapeHtml(j.note) + '</span>' +
      '</div>').join('') +
    '</div>' +
    '<details class="disclosure" style="font-size:11px;">' +
    '<summary>pole vault</summary>' +
    '<div style="color:var(--muted);margin-top:6px;line-height:1.5;">' +
    'Requires at least a 30-foot running start. The pole must be 4 to 10 feet longer ' +
    'than the character\u2019s height' + (h ? ' \u2014 for him, ' + ft(h + 48) + ' to ' + ft(h + 120) + ' ft' : '') + '. ' +
    'The vault spans a distance equal to 1\u00BD times the length of the pole, and clears a ' +
    'height equal to the pole\u2019s length. He may choose to land on his feet if the vault ' +
    'carries him over an obstacle no higher than half the pole\u2019s length. The pole is ' +
    'dropped at the end of the vault in all cases.<br><br>' +
    'The book\u2019s example: with a 12-foot pole he could vault through a window 12 feet up, ' +
    'land on his feet in an opening 6 feet up, or cross a moat 18 feet wide.' +
    '</div></details>';
};

// --- Tightrope Walking (PHB Ch.5) ---
// MODIFIERS, but with a BAND selector rather than checkboxes -- the width
// categories are mutually exclusive. Extra proficiency slots reduce the
// penalties by 1 each, which is why this proficiency is in
// NWP_BONUS_SLOT_EFFECTS and its slots are NOT added to the check target.
PROF_ABILITY_BUILDERS['tightrope walking'] = function (root, entry, panelEl) {
  const st = getProfAbilityState(root, 'tightrope walking');
  const c = getNWPCheckTarget(root, entry.nwp);
  const coop = getProficiencyCooperation(root) ? 1 : 0;
  const slots = Math.max(0, parseInt(entry.nwp.bonusSlots, 10) || 0);

  const bands = [
    { key: 'rope',   label: '1 inch or less (a rope)', pen: -10 },
    { key: 'narrow', label: '2 to 6 inches',           pen: -5 },
    { key: 'plank',  label: '7 to 12 inches',          pen: 0 },
    { key: 'wide',   label: 'Wider than 1 foot',       pen: null }
  ];
  const band = bands.find(b => b.key === (st.band || 'rope')) || bands[0];
  const wind = Math.min(6, Math.max(0, parseInt(st.wind, 10) || 0));
  const rod  = !!st.rod;

  let body;
  if (band.pen === null) {
    body = paBox('No check required',
      'Wider than 1 foot needs no check for a proficient character under normal circumstances.');
  } else {
    const relief = slots + (rod ? 2 : 0);
    const pen = Math.min(0, band.pen + relief) - wind;
    const target = (c.hasCheck ? c.target : 0) + pen + coop;
    const parts = [];
    if (band.pen) parts.push('Width ' + band.pen);
    if (relief)   parts.push('Reduced by ' + relief + (rod ? ' (rod' + (slots ? ' + slots' : '') + ')' : ' (extra slots)'));
    if (wind)     parts.push('Wind or vibration -' + wind);
    if (coop)     parts.push('Assistance +1');
    body = paBox('Balance check: ' + paFmt(target),
      'One check every 60 feet or part thereof \u00B7 movement 60 ft per round' +
      (parts.length ? '<br>' + escapeHtml(parts.join(' \u00B7 ')) : ''));
  }

  panelEl.innerHTML = body +
    '<div style="font-size:11px;margin-bottom:12px;">' +
    '<div style="font-weight:600;margin-bottom:4px;">Surface width</div>' +
    bands.map(b =>
      '<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;color:var(--text);cursor:pointer;">' +
      '<input type="radio" name="trw-band" class="trw-band" value="' + b.key + '"' +
      (b.key === band.key ? ' checked' : '') + ' style="width:auto;flex-shrink:0;">' +
      '<span>' + escapeHtml(b.label) +
      '<span style="color:var(--muted);"> (' + (b.pen === null ? 'no check' : b.pen) + ')</span>' +
      '</span></label>').join('') +
    '<label style="display:flex;align-items:center;gap:6px;margin:8px 0 4px;color:var(--text);cursor:pointer;">' +
    '<input type="checkbox" class="trw-rod"' + (rod ? ' checked' : '') + ' style="width:auto;flex-shrink:0;">' +
    '<span>Using a balancing rod <span style="color:var(--muted);">(penalties reduced by 2)</span></span></label>' +
    '<div style="display:flex;align-items:center;gap:6px;">' +
    '<input type="number" class="trw-wind" min="0" max="6" step="1" value="' + wind + '" ' +
    'style="width:52px;flex-shrink:0;padding:2px 4px;font-size:11px;">' +
    '<span>Wind or vibration <span style="color:var(--muted);">(penalties increased by 2 to 6, DM\u2019s call)</span></span>' +
    '</div>' +
    (slots ? '<div style="color:var(--info, #6fb3d2);margin-top:6px;">' + slots +
      ' extra proficiency slot' + (slots > 1 ? 's' : '') + ' reduce the penalties by ' + slots + '.</div>' : '') +
    '</div>' +
    '<details class="disclosure" style="font-size:11px;">' +
    '<summary>fighting on the rope</summary>' +
    '<div style="color:var(--muted);margin-top:6px;line-height:1.5;">' +
    'A character may fight while on a tightrope at <strong style="color:var(--text);">&minus;5 to his attack roll</strong>, ' +
    'and must make a successful check at the beginning of each round to avoid falling off. ' +
    'Since he cannot maneuver he gains <strong style="color:var(--text);">no Dexterity adjustment to Armor Class</strong>. ' +
    'If struck while on the rope he must roll an immediate check to retain his balance.<br><br>' +
    'Any narrow surface not angled up or down more than 45 degrees can be negotiated.' +
    '</div></details>';

  panelEl.querySelectorAll('.trw-band').forEach(el => {
    el.onchange = () => { st.band = el.value; renderProficiencyAbilities(root); };
  });
  const rodEl = panelEl.querySelector('.trw-rod');
  if (rodEl) rodEl.onchange = () => { st.rod = rodEl.checked; renderProficiencyAbilities(root); };
  const windEl = panelEl.querySelector('.trw-wind');
  if (windEl) windEl.onchange = () => { st.wind = windEl.value; renderProficiencyAbilities(root); };
};

// --- Disguise (PHB Ch.5) ---
// The two penalties are INDEPENDENT axes and the book states their combination
// explicitly: race or sex -7, a specific person -10, together -17.
PROF_ABILITY_BUILDERS['disguise'] = function (root, entry, panelEl) {
  const st = getProfAbilityState(root, 'disguise');
  const c = getNWPCheckTarget(root, entry.nwp);
  const coop = getProficiencyCooperation(root) ? 1 : 0;

  const opts = [
    { key: 'race',     label: 'Another race or sex', mod: -7 },
    { key: 'specific', label: 'A specific individual', mod: -10 }
  ];
  let pen = 0;
  const parts = [];
  opts.forEach(o => { if (st[o.key]) { pen += o.mod; parts.push(o.label + ' ' + o.mod); } });
  if (coop) parts.push('Assistance +1');
  const target = (c.hasCheck ? c.target : 0) + pen + coop;

  panelEl.innerHTML =
    paBox('Disguise check: ' + paFmt(target),
      parts.length ? escapeHtml(parts.join(' \u00B7 '))
        : 'Unmodified \u2014 any general type of person of about the same height, age, weight and race.') +
    '<div style="font-size:11px;margin-bottom:12px;">' +
    opts.map(o =>
      '<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;color:var(--text);cursor:pointer;">' +
      '<input type="checkbox" class="dsg-chk" data-key="' + o.key + '"' + (st[o.key] ? ' checked' : '') +
      ' style="width:auto;flex-shrink:0;">' +
      '<span>' + escapeHtml(o.label) + ' <span style="color:var(--muted);">(' + o.mod + ')</span></span></label>').join('') +
    '<div style="color:var(--muted);margin-top:6px;">These are cumulative \u2014 a specific person of ' +
    'another race or sex is &minus;17, which the book calls extremely difficult.</div>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--muted);">A failed roll means the attempt was too obvious in some way.</div>';

  panelEl.querySelectorAll('.dsg-chk').forEach(el => {
    el.onchange = () => { st[el.dataset.key] = el.checked; renderProficiencyAbilities(root); };
  });
};

// --- Forgery (PHB Ch.5) ---
// The odd one out: THE PLAYER SHOULD NOT ROLL THIS. "The forger only thinks he
// has been successful; the DM rolls the check in secret and the forger does not
// learn of a failure until it is too late." So the panel shows the target and
// the three outcome tiers as reference and pointedly offers no roll.
PROF_ABILITY_BUILDERS['forgery'] = function (root, entry, panelEl) {
  const st = getProfAbilityState(root, 'forgery');
  const c = getNWPCheckTarget(root, entry.nwp);
  const coop = getProficiencyCooperation(root) ? 1 : 0;

  const cases = [
    { key: 'generic', label: 'Document with no personal handwriting (military orders, decrees)',
      mod: 0, needs: 'Must have seen a similar document before.' },
    { key: 'name', label: 'A name or signature',
      mod: -2, needs: 'Requires an autograph of that person.' },
    { key: 'hand', label: 'A longer document in a particular hand',
      mod: -3, needs: 'Requires a large sample of that person\u2019s handwriting.' }
  ];
  const cur = cases.find(x => x.key === (st.mode || 'generic')) || cases[0];
  const target = (c.hasCheck ? c.target : 0) + cur.mod + coop;

  panelEl.innerHTML =
    paBox('Forgery check: ' + paFmt(target),
      escapeHtml(cur.needs) + (cur.mod ? ' \u00B7 ' + cur.mod + ' penalty' : '') + (coop ? ' \u00B7 Assistance +1' : '')) +
    '<div style="font-size:11px;margin-bottom:12px;">' +
    '<div style="font-weight:600;margin-bottom:4px;">What is being forged</div>' +
    cases.map(x =>
      '<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;color:var(--text);cursor:pointer;">' +
      '<input type="radio" name="frg-mode" class="frg-mode" value="' + x.key + '"' +
      (x.key === cur.key ? ' checked' : '') + ' style="width:auto;flex-shrink:0;">' +
      '<span>' + escapeHtml(x.label) + ' <span style="color:var(--muted);">(' + (x.mod || 0) + ')</span></span></label>').join('') +
    '</div>' +
    '<div style="padding:8px;border:1px solid var(--warning, #e0a34a);border-radius:4px;font-size:11px;margin-bottom:12px;">' +
    '<strong style="color:var(--warning, #e0a34a);">The DM rolls this in secret.</strong> ' +
    '<span style="color:var(--muted);">The forger only thinks he has been successful, ' +
    'and does not learn of a failure until it is too late.</span></div>' +
    '<details class="disclosure" style="font-size:11px;">' +
    '<summary>outcomes</summary>' +
    '<div style="color:var(--muted);margin-top:6px;line-height:1.5;">' +
    '<strong style="color:var(--text);">Creating a forgery</strong><br>' +
    'Success \u2014 passes examination by all but those intimately familiar with the handwriting, ' +
    'or anyone with forgery proficiency who examines it carefully.<br>' +
    'Failure \u2014 detectable by anyone familiar with that type of document or handwriting, if examined closely.<br>' +
    'Natural 20 \u2014 immediately detectable by anyone who normally handles such documents, without close examination.<br><br>' +
    '<strong style="color:var(--text);">Detecting a forgery</strong><br>' +
    'Success \u2014 the authenticity of any document can be ascertained.<br>' +
    'Failure \u2014 the answer is unknown.<br>' +
    'Natural 20 \u2014 the character reaches the incorrect conclusion.' +
    '</div></details>';

  panelEl.querySelectorAll('.frg-mode').forEach(el => {
    el.onchange = () => { st.mode = el.value; renderProficiencyAbilities(root); };
  });
};

// --- Set Snares (PHB Ch.5) ---
// Man-traps are THIEVES ONLY -- "thief characters (and only thieves)". Animal
// Lore gives +2 for GAME ONLY, explicitly not monsters or intelligent beings.
PROF_ABILITY_BUILDERS['set snares'] = function (root, entry, panelEl) {
  const st = getProfAbilityState(root, 'set snares');
  const c = getNWPCheckTarget(root, entry.nwp);
  const coop = getProficiencyCooperation(root) ? 1 : 0;
  const lore = paHasProf(root, 'animal lore');
  const isThief = (typeof getAllClassComponents === 'function' ? getAllClassComponents(root) : [])
    .some(x => String(x.clazz || '').trim().toLowerCase().indexOf('thief') !== -1);

  const large = !!st.large;
  const game  = !!st.game;
  let pen = 0;
  const parts = [];
  if (large) { pen -= 4; parts.push('Larger creature -4'); }
  if (game && lore) { pen += 2; parts.push('Animal lore, game only +2'); }
  if (coop) parts.push('Assistance +1');
  const target = (c.hasCheck ? c.target : 0) + pen + coop;

  panelEl.innerHTML =
    paBox('Snare check: ' + paFmt(target),
      (parts.length ? escapeHtml(parts.join(' \u00B7 ')) + '<br>' : '') +
      'Rolled when the snare is first constructed, and again every time it is set.') +
    '<div style="font-size:11px;margin-bottom:12px;">' +
    '<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;color:var(--text);cursor:pointer;">' +
    '<input type="checkbox" class="sns-large"' + (large ? ' checked' : '') + ' style="width:auto;flex-shrink:0;">' +
    '<span>For a larger creature \u2014 tiger pit, net snare <span style="color:var(--muted);">(&minus;4)</span></span></label>' +
    '<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;color:var(--text);cursor:pointer;' +
    (lore ? '' : 'opacity:0.45;') + '">' +
    '<input type="checkbox" class="sns-game"' + (game ? ' checked' : '') + (lore ? '' : ' disabled') +
    ' style="width:auto;flex-shrink:0;">' +
    '<span>Catching game <span style="color:var(--muted);">(+2 with animal lore' +
    (lore ? '' : ' \u2014 not known') + ')</span></span></label>' +
    '<div style="color:var(--muted);margin-top:6px;">A successful check does not ensure the snare ' +
    'catches anything, only that it works if triggered. The DM decides whether it is triggered. ' +
    'Failure is opaque \u2014 bad workmanship, scent left in the area, poor concealment \u2014 and the ' +
    'exact nature of the problem need not be known.</div>' +
    '</div>' +
    '<details class="disclosure" style="font-size:11px;">' +
    '<summary>time, help and man-traps</summary>' +
    '<div style="color:var(--muted);margin-top:6px;line-height:1.5;">' +
    'Small snare or trap \u2014 1 hour, one person.<br>' +
    'Larger trap \u2014 2d4 hours, two to three people, though only one need have the proficiency.<br>' +
    'Man-trap \u2014 1d8 hours, one or more people depending on its nature.<br>' +
    'Appropriate materials are required in every case.<br><br>' +
    '<strong style="color:' + (isThief ? 'var(--success, #6fbf73)' : 'var(--warning, #e0a34a)') + ';">Man-traps: ' +
    (isThief ? 'available to this character.' : 'thieves only \u2014 not available to this character.') + '</strong> ' +
    'Thief characters, and only thieves, can rig traps meant for people \u2014 crossbows, deadfalls, ' +
    'spiked springboards. The procedure is the same as for a large trap, and the DM determines damage.' +
    '</div></details>';

  const lg = panelEl.querySelector('.sns-large');
  if (lg) lg.onchange = () => { st.large = lg.checked; renderProficiencyAbilities(root); };
  const gm = panelEl.querySelector('.sns-game');
  if (gm) gm.onchange = () => { st.game = gm.checked; renderProficiencyAbilities(root); };
};

// --- Hunting (PHB Ch.5) ---
// The penalty counts NON-PROFICIENT hunters, so extra bodies hurt here -- the
// inverse of the cooperation rule, which is why cooperation is not offered.
PROF_ABILITY_BUILDERS['hunting'] = function (root, entry, panelEl) {
  const st = getProfAbilityState(root, 'hunting');
  const c = getNWPCheckTarget(root, entry.nwp);
  const others = Math.max(0, parseInt(st.others, 10) || 0);
  const yards  = Math.max(0, parseInt(st.close, 10) || 0);
  const target = (c.hasCheck ? c.target : 0) - others;
  const checks = Math.ceil(yards / 20);

  panelEl.innerHTML =
    paBox('Stalking check: ' + paFmt(target),
      (others ? others + ' nonproficient hunter' + (others > 1 ? 's' : '') + ' in the party \u00B7 &minus;' + others + '<br>' : '') +
      'Success brings the hunter and those with him within 101 to 200 yards (100 + 1d100).') +
    '<div style="font-size:11px;margin-bottom:12px;">' +
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
    '<input type="number" class="hnt-others" min="0" step="1" value="' + others + '" ' +
    'style="width:52px;flex-shrink:0;padding:2px 4px;font-size:11px;">' +
    '<span>Nonproficient hunters in the party <span style="color:var(--muted);">(&minus;1 each)</span></span></div>' +
    '<div style="display:flex;align-items:center;gap:6px;">' +
    '<input type="number" class="hnt-close" min="0" step="20" value="' + yards + '" ' +
    'style="width:60px;flex-shrink:0;padding:2px 4px;font-size:11px;">' +
    '<span>Yards to close <span style="color:var(--muted);">(one check per 20 yards' +
    (checks ? ' \u2014 ' + checks + ' check' + (checks > 1 ? 's' : '') : '') + ')</span></span></div>' +
    '<div style="color:var(--muted);margin-top:8px;">If the stalking succeeds, the hunter ' +
    'automatically surprises the game. The type of animal depends on the terrain and the DM.</div>' +
    '</div>';

  const o = panelEl.querySelector('.hnt-others');
  if (o) o.onchange = () => { st.others = o.value; renderProficiencyAbilities(root); };
  const cl = panelEl.querySelector('.hnt-close');
  if (cl) cl.onchange = () => { st.close = cl.value; renderProficiencyAbilities(root); };
};

// --- Riding, Airborne (PHB Ch.5) ---
// REFERENCE. Unlike land riding, this proficiency is REQUIRED to handle a
// flying mount at all, and extra slots DO buy additional mount types.
PROF_ABILITY_BUILDERS['riding, airborne'] = function (root, entry, panelEl) {
  const c = getNWPCheckTarget(root, entry.nwp);
  const head = c.hasCheck
    ? 'Riding check: ' + paFmt(c.target)
    : 'No ability check listed.';

  const feats = [
    { k: 'no', n: 'Leap on and take off',
      t: 'Leap onto the saddle while the creature stands on the ground and spur it airborne, as a single action. No check required.' },
    { k: 'mix', n: 'Drop 10 feet',
      t: 'To the ground, or onto another mount land-based or flying. No check when at light encumbrance dropping to the ground; a check in every other situation. Failure means normal falling damage, or missing the target entirely and perhaps taking a great deal more.' },
    { k: 'penalty', n: 'Drop and attack',
      t: 'A character dropping to the ground may attempt an immediate melee attack if his check is made at &minus;4. Failure carries the same consequences as above.' },
    { k: 'yes', n: 'Spur to greater speed',
      t: '+1d4 to the mount\u2019s movement rate on a successful check, held for four consecutive rounds. Fail and you may try again next round; fail twice and no attempt is possible for a full turn. Afterwards its movement drops to \u2154 and its Maneuverability Class worsens by one class, until it lands and rests at least one hour.' },
    { k: 'mix', n: 'Guide with knees and feet',
      t: 'Keeps the hands free. A check is needed only after the character suffers damage. Fail and he is knocked from the saddle \u2014 then a second check to catch himself and hang from the side by one hand, or some equally perilous position. Fail that and he falls.' }
  ];
  const tag = k => k === 'no'
    ? '<span style="color:var(--success, #6fbf73);">automatic</span>'
    : k === 'penalty'
    ? '<span style="color:var(--warning, #e0a34a);">check at &minus;4</span>'
    : k === 'mix'
    ? '<span style="color:var(--muted);">conditional</span>'
    : '<span style="color:var(--info, #6fb3d2);">check</span>';

  panelEl.innerHTML =
    paBox(head, c.hasCheck ? 'Dropping and attacking takes &minus;4: ' + paFmt(c.target - 4) : '') +
    '<div style="font-size:11px;">' +
    feats.map(f =>
      '<div style="margin-bottom:8px;">' +
      '<div><strong>' + escapeHtml(f.n) + '</strong> &middot; ' + tag(f.k) + '</div>' +
      '<div style="color:var(--muted);margin-top:1px;">' + f.t + '</div></div>').join('') +
    '</div>' +
    '<details class="disclosure" style="font-size:11px;">' +
    '<summary>mounts and the saddle strap</summary>' +
    '<div style="color:var(--muted);margin-top:6px;line-height:1.5;">' +
    'The particular creature is chosen when the proficiency is taken, and <strong style="color:var(--text);">' +
    'additional slots buy additional mount types</strong>. Unlike land-based riding, a character ' +
    '<strong style="color:var(--text);">must</strong> have this proficiency, or ride with someone who does, ' +
    'to handle a flying mount at all.<br><br>' +
    'A rider can strap himself into the saddle to avoid being thrown \u2014 though that could be a ' +
    'disadvantage if his mount is slain and plummets toward the ground.' +
    '</div></details>';
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
  
  // Stats grid.
  //
  // All six fields are escaped. They come from the spell JSON rather than the
  // player, but they are still arbitrary text going into innerHTML, and a single
  // '<' in a components note would silently swallow the rest of the grid.
  const statsDiv = modal.querySelector('.spell-modal-stats');

  // Casting time gains a plain-English reading when the optional rule is on.
  // PHB Ch.7: a bare number is added to the initiative roll; "1 round" is NOT --
  // it resolves at the end of the round. Those two look nearly identical in the
  // data and mean opposite things at the table, so the modal says which it is
  // rather than leaving the player to infer it from a missing word.
  let castTimeHtml = escapeHtml(String(spell.castTime || ''));
  if (typeof isOptionalRule === 'function' &&
      isOptionalRule('spellCastingTimeInitiative') &&
      typeof parseSpellCastingTime === 'function') {
    const ct = parseSpellCastingTime(spell.castTime);
    if (ct.kind !== 'none' && ct.text) {
      // Accent only for a real initiative modifier -- that is the one the player
      // has to act on when rolling. Everything else is muted context.
      const colour = (ct.kind === 'initiative') ? 'var(--accent)' : 'var(--muted)';
      castTimeHtml += ' <span style="color:' + colour + ';font-size:11px;">(' +
                      escapeHtml(ct.text) + ')</span>';
    }
  }

  // Components gain their casting conditions when the optional rule is on. The
  // letters alone don't tell a player what he can still do while grappled; the
  // point of the rule is that a V-only spell works while bound and an S-only one
  // works inside a silence, and neither is obvious from "V" or "S".
  let componentsHtml = escapeHtml(String(spell.components || ''));
  if (typeof isOptionalRule === 'function' &&
      isOptionalRule('spellComponents') &&
      typeof getSpellComponentNotes === 'function') {
    const cn = getSpellComponentNotes(spell.components);
    if (cn.known) {
      const bits = [];
      if (cn.needs.length) {
        bits.push('<div style="color:var(--muted);font-size:11px;margin-top:2px;">Must ' +
                  escapeHtml(cn.needs.join(', ')) + '.</div>');
      }
      // Freedoms are accented: they are what the rule GIVES the caster, and the
      // thing he is least likely to work out unprompted.
      cn.freedoms.forEach(f => {
        bits.push('<div style="color:var(--accent);font-size:11px;margin-top:2px;">' +
                  escapeHtml(f) + '</div>');
      });
      componentsHtml += bits.join('');
    }
  }

  statsDiv.innerHTML = `
    <div><strong>Range:</strong> ${escapeHtml(String(spell.range || ''))}</div>
    <div><strong>Duration:</strong> ${escapeHtml(String(spell.duration || ''))}</div>
    <div><strong>Area of Effect:</strong> ${escapeHtml(String(spell.aoe || ''))}</div>
    <div><strong>Casting Time:</strong> ${castTimeHtml}</div>
    <div><strong>Components:</strong> ${componentsHtml}</div>
    <div><strong>Saving Throw:</strong> ${escapeHtml(String(spell.save || ''))}</div>
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
  
  // FOUR independent reasons a spell can be browsed but not added. Collected into
  // a list rather than an if/else chain over the combinations -- that approach was
  // already awkward at two reasons and would need sixteen branches at four.
  //   1. Above the character's max castable level (class progression / INT cap)
  //   2. In a specialist wizard's OPPOSITION schools (PHB Table 22)
  //   3. Reachable only through a MINOR sphere, above 3rd level (PHB Ch.3)
  //   4. Above what the patron deity can grant (PHB Ch.7, optional rule)
  const reasons = [];

  // (1) Computed live rather than read from root._spellLevelCap: that cache went
  // stale on any level change and defaulted to 99 -- blocking nothing at all --
  // before the spell browser had rendered even once.
  const levelCap = getMaxSpellLevel(root).max;
  const spellLevelNum = (typeof spell.level === 'number') ? spell.level : parseInt(spell.level, 10) || 0;
  if (levelCap > 0 && spellLevelNum > levelCap) {
    reasons.push('Above your maximum castable spell level (' + levelCap + ').');
  }

  // (2) Resolve the WIZARD sub-class, not the top-level class field. A multi-class
  // gnome fighter/illusionist has an empty clazz, so reading it directly meant
  // opposition blocking silently never fired for the one specialist actually
  // permitted to multi-class -- and for every dual-class specialist too.
  const wizComp = (typeof getWizardComponent === 'function') ? getWizardComponent(root) : null;
  const clazz = wizComp ? wizComp.clazz : (val(root, 'clazz') || '');
  if (typeof isOppositionSpell === 'function' && isOppositionSpell(spell, clazz)) {
    const oppList = (typeof getOppositionSchools === 'function') ? getOppositionSchools(clazz).join(', ') : '';
    reasons.push('Opposition school for your specialty' +
                 (oppList ? ' (' + oppList + ')' : '') +
                 ' \u2014 cannot be learned (PHB Table 22).');
  }

  // (3) and (4) are PRIEST rules and apply only to priest spells. Detected from
  // spell.class, falling back to "does it have spheres at all" so a saved record
  // without a class field is still judged correctly.
  const spellIsPriest =
    String(spell.class || '').toLowerCase().includes('priest') ||
    ((typeof getSpellSpheres === 'function') && getSpellSpheres(spell).length > 0);

  if (spellIsPriest) {
    const accessMap = (typeof getSphereAccessMap === 'function') ? getSphereAccessMap(root) : {};

    // Only judge sphere access once the player has actually recorded some. An
    // unconfigured priest is left alone rather than blocked out of every spell
    // on the list -- same reasoning as the browser pool in renderSpellBrowser.
    if (Object.keys(accessMap).length > 0 && typeof getSpellSphereAccess === 'function') {
      const access = getSpellSphereAccess(spell, accessMap);

      if (!access.allowed) {
        reasons.push('Your deity grants no access to ' +
                     (access.spheres.length ? access.spheres.join(' or ') : 'this spell\u2019s sphere') + '.');
      } else if (!access.withinCap) {
        // Reached only through a minor sphere. access.sphere names the BEST one,
        // so this reports the sphere that got closest rather than an arbitrary one.
        reasons.push('Only minor access to ' + access.sphere +
                     ' \u2014 minor spheres are limited to spells of 3rd level and below (PHB Ch.3).');
      }
    }

    // (4) Separate from sphere access on purpose: it is a limit on the patron, not
    // on the sphere, so a player who hits it is told which of the two stopped him.
    const deity = (typeof getDeityLevelCap === 'function')
      ? getDeityLevelCap(root)
      : { applied: false };

    if (deity.applied && spellLevelNum > deity.cap) {
      reasons.push('Your patron is a ' + deity.label +
                   ' and cannot grant spells above level ' + deity.cap + ' (PHB Ch.7).');
    }
  }

  const blocked = reasons.length > 0;
  const blockReason = blocked ? (reasons.join(' ') + ' Shown for reference only.') : '';

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
      noteEl.innerHTML = notes.map(n => '<div style="margin-top:4px;">\u2022 ' + escapeHtml(n) + '</div>').join('');
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
      '<strong>' + escapeHtml(roleLabel) + ':</strong> ' + spent + ' of ' + pool +
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

  // The Table 4 material below -- spells known per level, the chance to learn,
  // free specialist spells -- is WIZARD-ONLY and stays gated on the wizard
  // component. Priests don't learn spells into books and have no per-level cap.
  //
  // The maximum spell LEVEL warning is NOT wizard-only, and returning early here
  // hid it from every other casting class. A demi-paladin caps at 4th-level
  // spells because of his slot progression, not his Intelligence. This section is
  // used by them too -- "Spells you know (Wizards) or have learned (other casting
  // classes)" -- so they were recording unlearnable spells with no feedback at all.
  const comp  = (typeof getWizardComponent === 'function') ? getWizardComponent(root) : null;
  const isWiz = !!comp;

  // Table 4 column 3 is a number below INT 19 and the string "All" from 19 up.
  const int = parseInt(val(root, 'int') || 0, 10);
  const row = (typeof INT_TABLE !== 'undefined') ? INT_TABLE[int] : null;
  const rawCap = row ? row[2] : 0;
  const uncapped = (typeof rawCap === 'string');
  const cap = uncapped ? Infinity : (parseInt(rawCap, 10) || 0);
  // Highest spell level this character may learn -- see getMaxSpellLevel.
  const intMaxLevel = row ? (parseInt(row[4], 10) || 0) : 0;
  const maxSpellLevel = getMaxSpellLevel(root).max;

  if (isWiz && !uncapped && cap <= 0) {
    // INT below 9 -- cannot be a wizard at all. The spell browser already
    // explains this, so say nothing here rather than showing 0/0 nine times.
    wrap.style.display = 'none';
    return;
  }

  // A non-wizard whose class yields no level cap (fighter, thief, or a paladin
  // too low to cast) has nothing to report -- and must not be shown a cap of 0
  // as though it were a restriction.
  if (!isWiz && maxSpellLevel <= 0) { wrap.style.display = 'none'; return; }

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
    // The per-level ceiling is a Table 4 rule and applies to wizards only. A
    // non-wizard is never "over" -- printing him a denominator would invent a
    // limit the book doesn't give him.
    const over = isWiz && !uncapped && n > cap;
    // Separate problem from the count: Table 4 also caps the highest spell
    // LEVEL a wizard may learn at all. An INT 9 wizard stops at 4th, so a
    // recorded 6th-level spell is not merely surplus -- it is unlearnable.
    const beyond = maxSpellLevel > 0 && lv > maxSpellLevel;
    if (over) anyOver = true;
    if (beyond) beyondLevels.push(lv);
    const color = (over || beyond) ? '#f44336' : 'var(--text)';
    const denom = !isWiz ? '' : ('/' + (beyond ? '\u2014' : (uncapped ? 'All' : cap)));
    parts.push('<span style="color:' + color + ';">Level ' + lv + ': ' + n + denom + '</span>');
  }

  if (!parts.length) {
    text.innerHTML = '<span style="color:var(--muted);">No spells recorded' +
      ((isWiz && !uncapped) ? ' \u2014 Intelligence ' + int + ' allows ' + cap + ' per level' : '') +
      '</span>';
  } else {
    text.innerHTML = parts.join(' <span style="color:var(--muted);">-</span> ');
    if (beyondLevels.length) {
      // Only a wizard's ceiling can come from Intelligence. For anyone else the
      // limit is always the slot progression, so don't offer Table 4 as a reason.
      const capReason = (isWiz && maxSpellLevel === intMaxLevel && intMaxLevel > 0)
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
  renderMemorizationTime(root);
}

// Study / prayer time for the current memorized list (PHB Ch.7).
//
// "The amount of study time needed is 10 minutes per level of the spell being
// memorized." Priests are identical: "the conditions for praying are identical
// to those needed for the wizard's studying."
//
// TWO figures, because they answer different questions:
//   recovery  -- re-study only the spells marked Cast. Uncast spells stay put,
//                since "a wizard cannot choose to forget a memorized spell to
//                replace it with another one." This is the after-a-fight number.
//   full list -- memorize the whole loadout from scratch, for when the player
//                changes his selection entirely.
//
// Called from renderMemorizedSpellStatus, which the Cast button already invokes,
// so toggling a spell refreshes this without a separate listener.
function renderMemorizationTime(root) {
  const wrap  = root.querySelector('.memorization-time-status');
  const label = root.querySelector('.memorization-time-label');
  const text  = root.querySelector('.memorization-time-text');
  if (!wrap || !label || !text) return;

  const clazz = (val(root, 'clazz') || '').trim().toLowerCase();
  const isWiz = (typeof isWizardClass === 'function') && isWizardClass(clazz);
  const isPri = (typeof isPriestClass === 'function') && isPriestClass(clazz);

  if (!isWiz && !isPri) { wrap.style.display = 'none'; return; }

  // The cast flag lives on the row's own class list, which is exactly what
  // collectSheet persists (`cast: n.classList.contains('spell-cast')`), so the
  // display and the saved record can never disagree about what has been spent.
  const all   = [];
  const spent = [];
  let castCount = 0, lostCount = 0;
  Array.from(root.querySelectorAll('.memspells-list .item')).forEach(item => {
    const lv = parseInt(item.querySelector('.level')?.value, 10);
    if (!isFinite(lv) || lv < 0) return;
    all.push(lv);
    // Cast and lost both spend the slot and both cost the same to recover. The
    // states are mutually exclusive, so else-if is enough -- a row carrying both
    // classes would be a bug upstream, not something to total twice here.
    if (item.classList.contains('spell-cast'))      { spent.push(lv); castCount++; }
    else if (item.classList.contains('spell-lost')) { spent.push(lv); lostCount++; }
  });

  if (all.length === 0) { wrap.style.display = 'none'; return; }

  wrap.style.display = '';

  // A priest prays rather than studies; the arithmetic is the same and only the
  // wording changes. A mixed caster gets the wizard wording -- the spellbook is
  // the more demanding of the two and the figure covers both.
  // No colon, and uppercase: this element is now a .lab caption in a stat
  // strip, so the strip supplies the styling and the punctuation is redundant.
  label.textContent = isWiz ? 'STUDY TIME' : 'PRAYER TIME';

  const fullTime  = getMemorizationTime(all);
  const spentTime = getMemorizationTime(spent);

  const parts = [];

  if (spentTime.spellCount > 0) {
    // Break down the mix only when there IS one -- "(2 cast, 0 lost)" on an
    // ordinary day is noise, and most days are ordinary.
    let what;
    if (castCount && lostCount) {
      what = spentTime.spellCount + ' spells (' + castCount + ' cast, ' + lostCount + ' lost)';
    } else if (lostCount) {
      what = lostCount + ' lost spell' + (lostCount === 1 ? '' : 's');
    } else {
      what = castCount + ' cast spell' + (castCount === 1 ? '' : 's');
    }
    parts.push('<strong>' + escapeHtml(spentTime.text) + '</strong> to recover ' + what);
  } else {
    parts.push('<span style="color:var(--muted);">nothing spent</span>');
  }

  parts.push('<span style="color:var(--muted);">' + escapeHtml(fullTime.text) +
             ' for the full list of ' + fullTime.spellCount + '</span>');

  parts.push('<span style="color:var(--muted);">after ' +
             MEMORIZATION_REST_HOURS + ' hrs rest</span>');

  text.innerHTML = parts.join(' <span style="color:var(--muted);">\u00B7</span> ');
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
  el.innerHTML =
    '<strong style="color:var(--warning, #e0a34a);">\u26A0 Specialist requirements (PHB Table 22)</strong>' +
    problems.map(p => '<div style="margin-top:4px;">\u2022 ' + escapeHtml(p) + '</div>').join('') +
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
    // FIRST in the list on purpose when it fires alone: if the race or class
    // cannot be resolved, several of the checks above return [] for that same
    // reason, so this is the finding that explains their silence.
    { heading: 'Race or class not recognised',
      problems: (typeof validateFieldRecognition === 'function') ? validateFieldRecognition(root) : [] },
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

  // One source gets its own specific heading; two or more fall back to the
  // generic one rather than trying to name every combination.
  const heading = (active.length === 1) ? active[0].heading : 'Character build';

  el.innerHTML =
    '<strong style="color:var(--warning, #e0a34a);">\u26A0 ' + heading + '</strong>' +
    problems.map(p => '<div style="margin-top:4px;">\u2022 ' + escapeHtml(p) + '</div>').join('') +
    '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
      'Advisory only \u2014 nothing is blocked. Switch this check off under ' +
      'House Rules &amp; Overrides in Settings if your DM has approved it.</div>';
  el.style.display = '';
}

// PHB Chapter 12, henchmen. Two rules, one banner -- validateHenchmen() in
// tables.js holds the reasoning and returns the problem strings. Amber like the
// other rule warnings, because both findings are departures from a printed rule
// rather than neutral information.
//
// Henchman NAMES arrive here from a free-text input, so every string is escaped
// before it is injected.
function renderHenchmanLimits(root) {
  const el = root.querySelector('.henchman-limit-message');
  if (!el) return;

  const problems = (typeof validateHenchmen === 'function') ? validateHenchmen(root) : [];
  if (!problems || problems.length === 0) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }

  el.innerHTML =
    '<strong style="color:var(--warning, #e0a34a);">\u26A0 Henchmen (PHB Ch.12)</strong>' +
    problems.map(p => '<div style="margin-top:4px;">\u2022 ' + escapeHtml(p) + '</div>').join('') +
    '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
      'Advisory only \u2014 nothing is blocked and no henchman is ever removed. Switch ' +
      'this check off under House Rules &amp; Overrides in Settings.</div>';
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

  let html = '';

  if (status.current) {
    html += '<strong style="color:var(--info, #6fb3d2);">' + escapeHtml(status.current.label) +
            '</strong> \u2014 age ' + status.age + ', reached at ' + status.current.at + '.';
    html += '<div style="margin-top:6px;">Cumulative adjustment: <strong>' +
            escapeHtml(formatAgingEffects(status.cumulative)) + '</strong></div>';
    // Only break out the individual brackets once more than one has stacked --
    // with a single bracket the itemised line just repeats the total.
    if (status.reached.length > 1) {
      html += status.reached.map(b =>
        '<div style="margin-top:3px;color:var(--muted);">\u2022 ' + escapeHtml(b.label) +
        ' (' + b.at + '): ' + escapeHtml(formatAgingEffects(b.effects)) + '</div>').join('');
    }
  } else {
    html += '<strong style="color:var(--info, #6fb3d2);">Prime of life</strong> \u2014 age ' +
            status.age + '. No aging adjustments yet.';
  }

  if (status.next) {
    const nb = (typeof AGING_BRACKETS !== 'undefined')
      ? AGING_BRACKETS.find(b => b.key === status.next.key) : null;
    html += '<div style="margin-top:6px;color:var(--muted);">Next: ' + escapeHtml(status.next.label) +
            ' at ' + status.next.at +
            (nb ? ' (' + escapeHtml(formatAgingEffects(nb.effects)) + ')' : '') + '.</div>';
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

  // The spellbook rail key is BUILT HERE rather than baked into the template
  // because it is conditional: own/opposition/other only means anything to a
  // specialist. A priest or a generalist mage has neutral rails throughout, and
  // a key explaining three colours none of which appear is worse than no key.
  // Created once per list and reused, so repeated calls do not stack copies.
  const ensureBookKey = (listEl) => {
    let key = listEl.previousElementSibling;
    if (!key || !key.classList.contains('spellbook-rail-key')) {
      key = document.createElement('div');
      key.className = 'spell-listbar spellbook-rail-key';
      key.innerHTML =
        '<span class="key"><i style="background:var(--accent-light)"></i>own school</span>' +
        '<span class="key"><i style="background:var(--error)"></i>opposition &mdash; may never be learned</span>' +
        '<span class="key"><i style="background:var(--border)"></i>other school</span>';
      listEl.parentNode.insertBefore(key, listEl);
    }
    return key;
  };
  root.querySelectorAll('.spellbook-list').forEach(listEl => {
    ensureBookKey(listEl).style.display = school ? '' : 'none';
  });

  // Not a specialist -> clear/hide both notes, hide every free-spell checkbox
  // and every FREE SPELL tag, and reset every rail to neutral. A generalist
  // mage and a priest both land here: getSpecialistSchool returns nothing for
  // them, so no separate branch is needed.
  if (!school) {
    if (slotNote) { slotNote.innerHTML = ''; slotNote.style.display = 'none'; }
    if (freeNote) { freeNote.innerHTML = ''; freeNote.style.display = 'none'; }
    root.querySelectorAll('.spellbook-list .item .free-spell-row').forEach(r => { r.style.display = 'none'; });
    root.querySelectorAll('.spellbook-list .item .freetag').forEach(t => { t.style.display = 'none'; });
    root.querySelectorAll('.spellbook-list .item .rail').forEach(r => { r.className = 'rail neutral'; });
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

  // Paint each spellbook row: the rail carries school standing, the FREE SPELL
  // tag reports a claimed free spell, and the claim checkbox is offered only on
  // own-school entries.
  //
  // OPPOSITION is a real prohibition -- a specialist may browse those spells but
  // never learn them (PHB Table 22) -- so it takes --error, the same colour that
  // means "not allowed to this class" on the armor rail. isOppositionSpell
  // already handles the diviner wrinkle, where Greater Divination bans only
  // Divination of 5th level and above.
  root.querySelectorAll('.spellbook-list .item').forEach(item => {
    const sd = item._spellData || {};
    const probe = { school: sd.schoolSphere || '', level: sd.level };
    const own = (typeof isSpecialtySpell === 'function') && isSpecialtySpell(probe, component.clazz);
    const opp = (typeof isOppositionSpell === 'function') && isOppositionSpell(probe, component.clazz);

    const railEl = item.querySelector('.rail');
    if (railEl) railEl.className = 'rail ' + (own ? 'own' : opp ? 'opposition' : 'neutral');

    const tagEl = item.querySelector('.freetag');
    if (tagEl) tagEl.style.display = (own && sd.freeSpell) ? '' : 'none';

    const rowEl = item.querySelector('.free-spell-row');
    if (!rowEl) return;
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
  
  // Clear and re-append in sorted order, inserting a header whenever the level
  // changes. Headers are built HERE rather than kept in the DOM because this
  // function already wipes the list -- anywhere else they would accumulate.
  memList.innerHTML = '';
  let lastLevel = null;
  items.forEach(item => {
    const raw = (item.querySelector('.level') || {}).value || '';
    const lvl = raw === '' ? '\u2014' : raw;
    if (lvl !== lastLevel) {
      const head = document.createElement('div');
      head.className = 'spell-lvlhead';
      head.dataset.level = lvl;
      memList.appendChild(head);
      lastLevel = lvl;
    }
    memList.appendChild(item);
  });
  updateMemLevelHeaders(root);
}

// Availability counts on the level headers -- the question actually asked
// mid-combat, previously answerable only by counting strike-throughs by eye.
//
// Counts only VISIBLE rows, so it agrees with the level filter rather than
// reporting spells that are not on screen. A header whose whole group is
// filtered out hides itself; a header with nothing under it would otherwise sit
// there labelling empty space.
function updateMemLevelHeaders(root) {
  const memList = root.querySelector('.memspells-list');
  if (!memList) return;
  const heads = Array.from(memList.querySelectorAll('.spell-lvlhead'));
  heads.forEach(head => {
    let total = 0, left = 0;
    let node = head.nextElementSibling;
    while (node && !node.classList.contains('spell-lvlhead')) {
      if (node.classList.contains('item') && node.style.display !== 'none') {
        total++;
        // 'spell-cast' and 'spell-lost' are what setMemSpellState writes; a row
        // carrying neither is still available.
        if (!node.classList.contains('spell-cast') &&
            !node.classList.contains('spell-lost')) left++;
      }
      node = node.nextElementSibling;
    }
    if (!total) { head.style.display = 'none'; return; }
    head.style.display = '';
    head.innerHTML = 'LEVEL ' + escapeHtml(head.dataset.level || '') +
                     ' &mdash; <b>' + left + '</b> of ' + total + ' still available';
  });
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
  const jogEl = root.querySelector('[data-field="movement_jog"]');
  const swimmingEl = root.querySelector('[data-field="movement_swimming"]');
  const bottomEl = root.querySelector('[data-field="movement_bottom"]');
  const breathEl = root.querySelector('[data-field="movement_breath"]');

  // THE GUARD NAMES ONLY WHAT THIS FUNCTION CANNOT WORK WITHOUT. It used to
  // require all five fields including movement_climbing, so deleting that field
  // silently blanked the entire section. Optional fields are guarded at their
  // own write instead.
  if (!baseMovementEl || !currentMovementEl || !swimmingEl) return;
  
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

  // Jogging and running are an OPTIONAL RULE (Ch.14 prints both in a box headed
  // "(Optional Rule)"), and running is not a flat multiplier -- x3 needs a
  // successful Strength check, x4 at -4, x5 at -8. Both are given in YARDS.
  const runRule = (typeof isOptionalRule === 'function') &&
                  isOptionalRule('joggingAndRunning');

  // Swimming. The old code used 1/3 and blocked on ANY equipped armor; the book
  // gives HALF, in yards, and blocks on METAL armor or a load that has cut
  // movement to a third or less. getSwimmingState owns all of it.
  const swim = (typeof getSwimmingState === 'function')
    ? getSwimmingState(root, baseMovement, currentMovement)
    : null;
  
  // Format output.
  //
  // FEET PER ROUND, NOT PER TURN. Ch.14: "his movement rate corresponds to tens
  // of feet per round." A turn is ten minutes, so the old label overstated every
  // movement figure on the sheet by a factor of ten. Outdoors the same rate is
  // tens of YARDS per round, which is why both are named in the tooltip.
  baseMovementEl.value = `${baseMovement}" (${baseMovement * 10} ft/round) - ${raceName}`;
  baseMovementEl.title = `Base movement for ${raceName}\n` +
    `1" = 10 feet per round in a dungeon, or 10 yards per round outdoors\n` +
    `1 round = 1 minute; 1 turn = 10 rounds`;
  
  // Stashed for the quick reference, which needs the NUMBER to apply condition
  // multipliers -- the field itself holds a formatted string. Same pattern as
  // root._acBreakdown: one copy of the arithmetic, read by whoever needs it.
  root._currentMovement = currentMovement;
  // Stashed alongside it because Table 66's encumbrance modifier counts movement
  // POINTS LOST, which needs both figures. Same one-copy-of-the-arithmetic
  // reasoning as _currentMovement itself.
  root._baseMovement = baseMovement;
  currentMovementEl.value = `${currentMovement}" (${currentMovement * 10} ft/round)${encumbranceNote}`;
  currentMovementEl.title = `Current movement with encumbrance\nBase: ${baseMovement}" × ${movementMultiplier.toFixed(2)} = ${currentMovement}"`;
  
  const optRow = root.querySelector('.movement-optional-row');
  if (optRow) optRow.style.display = runRule ? '' : 'none';

  if (runRule && jogEl) {
    jogEl.value = `${currentMovement * 20} yards/round`;
    jogEl.title = `Jogging is double the movement rate, in yards.\n` +
      `Sustained for ${val(root, 'con') || '?'} rounds (your Constitution), then a\n` +
      `Constitution check each further round. A failed check means resting for as\n` +
      `many rounds as you jogged.`;
  }
  if (runRule && runningEl) {
    runningEl.value = `${currentMovement * 30} yards/round`;
    runningEl.title = `Running is TRIPLE the rate on a successful Strength check.\n` +
      `x4 on a Strength check at -4, x5 at -8. Failing only means you cannot\n` +
      `reach that speed, and you may not try for it again this run.\n` +
      `Constitution check every round thereafter: -1 per round at x3,\n` +
      `-2 at x4, -3 at x5, cumulative. Fail and you must stop and rest a turn.`;
  }

  if (swim) {
    if (swim.blocked) {
      swimmingEl.value = swim.metalArmor
        ? `Cannot swim (${swim.armorLabel})`
        : `Cannot swim (load)`;
      swimmingEl.title = swim.metalArmor
        ? `Ch.14: a character in METAL armor cannot swim -- the weight pulls him under.\n` +
          `Non-metal armor does not stop you swimming.`
        : `Ch.14: movement cut to a third or less of normal by gear. He sinks.`;
      swimmingEl.style.color = "#ff5252";
    } else {
      swimmingEl.value = `${swim.swimYards} yards/round`;
      swimmingEl.title = `Half your current movement rate, times 10, in yards.\n` +
        `Double it to ${swim.sprintYards} on a Strength check against ${swim.sprintCheck}\n` +
        `(half your Strength score).\n\n` +
        (swim.proficient
          ? `You have the Swimming proficiency.`
          : `NO SWIMMING PROFICIENCY. Ch.14 divides characters into untrained and\n` +
            `proficient swimmers, and an untrained swimmer manages a dog-paddle in\n` +
            `calm water and "in no way" makes noticeable progress. Whether your\n` +
            `character can swim at all is your DM's call.`);
      swimmingEl.style.color = swim.proficient ? "inherit" : "#ff9800";
    }

    if (bottomEl) {
      bottomEl.value = `${swim.bottomYards} yards/round`;
      bottomEl.title = `A character who cannot swim -- in metal armor, or crushed to a\n` +
        `third of his movement by gear -- can still WALK ALONG THE BOTTOM at a\n` +
        `third of his current movement rate. Drowning still applies.`;
    }
  }

  if (breathEl && typeof getBreathHolding === 'function') {
    const br = getBreathHolding(root);
    breathEl.value = `${br.normal} rounds`;
    breathEl.title = `A third of your Constitution in rounds, rounded up.\n` +
      `Halved to ${br.exerting} while exerting yourself -- and gear that cuts you to a\n` +
      `third of normal movement counts as exerting, always.\n` +
      `Halved again with no good gulp of air: ${br.noGulp} normally, ${br.noGulpExerting} exerting.\n\n` +
      `Beyond that, a Constitution check every round -- the first unmodified,\n` +
      `then a cumulative -2. Fail it and you must breathe.\n` +
      `Everyone gets at least one round, whatever the circumstances.`;
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
  if (runningEl) runningEl.style.color = movementColor;
  if (jogEl)     jogEl.style.color = movementColor;

  // Swimming keeps whatever colour was set alongside its value above. It goes
  // red when the character cannot swim AT ALL -- metal armor or a crushing
  // load -- and movementColor knows nothing about either.
}

// ===========================================================================
// CLIMBING PANEL (PHB Ch.14, Tables 65-67)
// ===========================================================================

// Populates the panel's controls, ONCE. Split out from the renderer on purpose:
// the renderer runs on every recalculation, and rebuilding a <select> throws
// away whatever the player had chosen. Build here, read there.
//
// Rope and wall is NOT offered as a checkbox even though Table 66 lists it at
// +55%. It is already a Table 67 surface, and the two describe one situation --
// a player who picked the surface and then had to remember a matching tickbox
// would be one forgotten click away from a wrong number. The renderer sets it
// from the surface instead.
function buildClimbingControls(root) {
  const section = root.querySelector('.climbing-section');
  if (!section || typeof CLIMBING_SURFACES === 'undefined') return;

  const surfSel = section.querySelector('.climbing-surface');
  const condSel = section.querySelector('.climbing-condition');

  if (surfSel && !surfSel.options.length) {
    CLIMBING_SURFACES.forEach(s => surfSel.appendChild(new Option(s.label, s.key)));
    surfSel.value = 'rough';
  }
  if (condSel && !condSel.options.length) {
    CLIMBING_CONDITIONS.forEach(c => condSel.appendChild(new Option(c.label, c.key)));
    condSel.value = 'dry';
  }

  const optHost = section.querySelector('.climbing-options');
  if (optHost && !optHost.children.length) {
    [['handholds',     CLIMBING_MODIFIERS.handholds.label],
     ['slopedIn',      CLIMBING_MODIFIERS.slopedIn.label],
     ['wounded',       CLIMBING_MODIFIERS.wounded.label],
     ['dmMountaineer', 'DM rules this character a mountaineer']
    ].forEach(b => {
      const lab = document.createElement('label');
      lab.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;';
      lab.innerHTML = '<input type="checkbox" class="ephemeral climbing-opt" data-opt="' +
                      escapeHtml(b[0]) + '"><span>' + escapeHtml(b[1]) + '</span>';
      optHost.appendChild(lab);
    });
  }

  // Bind ONCE, flagged on the section -- same reasoning as the vision panel's
  // _vlBound flag, and it matters more here: this renderer runs from
  // recalculateAll, so an unguarded addEventListener would stack a new listener
  // on every keystroke anywhere on the sheet.
  //
  // THIS HANDLER MUST NOT CALL markUnsaved. Every control in the panel is
  // ephemeral. Choosing a surface is a lookup, not an edit to the character, and
  // restamping _updatedAt for it would push a cloud sync over nothing.
  if (!section._climbBound) {
    section.addEventListener('change', () => renderClimbingPanel(root));
    section._climbBound = true;
  }
}

// Reads the panel's controls and the character, and paints the result. Safe to
// call on any sheet -- a character with no Climb Walls score is an unskilled
// climber, which is a valid Table 65 row, not a missing case.
function renderClimbingPanel(root) {
  const section = root.querySelector('.climbing-section');
  if (!section || typeof getClimbingSuccess !== 'function') return;

  buildClimbingControls(root);

  const surfEl  = section.querySelector('.climbing-surface');
  const condEl  = section.querySelector('.climbing-condition');
  const surfKey = (surfEl && surfEl.value) || 'rough';
  const condKey = (condEl && condEl.value) || 'dry';

  // Rope and wall is a SURFACE, so Table 66's +55% follows from the dropdown
  // rather than from a tickbox the player could forget while the rope is
  // plainly in his hands.
  const opts = { condition: condKey, ropeWall: surfKey === 'rope_wall' };
  section.querySelectorAll('.climbing-opt').forEach(cb => {
    opts[cb.dataset.opt] = cb.checked;
  });

  const move = parseInt(root._currentMovement, 10) || 0;
  const succ = getClimbingSuccess(root, opts);
  const rate = getClimbingRate(root, surfKey, condKey, move);

  const resEl = section.querySelector('.climbing-result');
  if (resEl) {
    let rateTxt;
    if (!rate || rate.blocked) {
      rateTxt = '<span style="color:var(--error, #ff6b6b);">' +
                'cannot be climbed under this condition</span>';
    } else {
      rateTxt = rate.feetPerRound + ' ft/round <span style="color:var(--muted);">(' +
                escapeHtml(rate.label) + ' \u00d7 ' + move +
                (rate.isThief ? ', doubled for a thief' : '') + ')</span>';
    }
    resEl.innerHTML =
      '<div style="font-size:20px;font-weight:600;">' + succ.percent + '%</div>' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">' +
        escapeHtml(succ.base.label) +
        ' \u2014 roll percentile equal or under to succeed</div>' +
      '<div style="font-size:13px;">Climb rate: ' + rateTxt + '</div>';
  }

  const brkEl = section.querySelector('.climbing-breakdown');
  if (brkEl) {
    let html = '<div>Base ' + succ.base.percent + '% (' +
               escapeHtml(succ.base.note) + ')</div>';
    succ.parts.forEach(p => {
      html += '<div>' + (p.mod > 0 ? '+' : '') + p.mod + '% &mdash; ' +
              escapeHtml(p.label) + '</div>';
    });
    brkEl.innerHTML = html;
  }

  const notesEl = section.querySelector('.climbing-notes');
  if (!notesEl) return;

  const key  = succ.base.key;
  const surf = rate && rate.surface;
  let html   = '';

  // Table 67's asterisk. ADVISORY, never blocking -- a DM may rule a character
  // has picked up enough rope work. Amber is reserved for real problems, and an
  // unskilled climber staring at a sheer wall is one.
  if (surf && surf.toolsOnly && key === 'unskilled') {
    html += '<div style="color:var(--warning, #ff9800);margin-bottom:8px;">' +
            '<strong>An unskilled climber cannot attempt this surface.</strong> ' +
            'Table 67: nonthief characters must be mountaineers and have appropriate ' +
            'tools (pitons, rope and the like) to climb very smooth, smooth or rough faces.' +
            '</div>';
  } else if (surf && surf.toolsOnly && (key === 'mountaineering' || key === 'mountaineer')) {
    html += '<div style="margin-bottom:8px;">A mountaineer needs <strong>proper ' +
            'equipment</strong> for this surface. Thieves alone climb it bare-handed.</div>';
  }

  html +=
    '<div style="margin-bottom:8px;"><strong style="color:var(--text);">The check comes ' +
    'before the first 10 feet</strong> of any climb of 10 feet or more. Fail it and the ' +
    'character can find no route and may not try that climb again until something changes ' +
    '&mdash; half a mile along the cliff face, or a better chance of success. Long climbs, ' +
    'over 100 feet or more than one turn, may need further checks; an ice wall needs one ' +
    'every round without tools.</div>' +
    '<div><strong style="color:var(--text);">Climbing costs you your Dexterity and shield ' +
    'AC bonuses</strong>, and rear attack modifiers usually apply. Your own attack, damage ' +
    'and saving throws take &minus;2. Attackers above you gain +2; those below take a ' +
    'further &minus;2. You cannot use a two-handed weapon, and spells need a steady, ' +
    'braced position.</div>';

  notesEl.innerHTML = html;
}

// ===========================================================================
// OVERLAND & ENDURANCE PANEL (PHB Ch.14)
// ===========================================================================

function renderOverlandPanel(root) {
  const section = root.querySelector('.overland-section');
  if (!section || typeof getOverlandMovement !== 'function') return;

  // Bind once, flagged on the section -- see the note in buildClimbingControls.
  // 'input' rather than 'change' so the figures follow a typed number as it is
  // entered; both boxes are ephemeral and neither marks the sheet unsaved.
  if (!section._overlandBound) {
    section.addEventListener('input', () => renderOverlandPanel(root));
    section._overlandBound = true;
  }

  const move   = parseInt(root._currentMovement, 10) || 0;
  const days   = parseInt((section.querySelector('.overland-days')   || {}).value, 10) || 0;
  const height = parseInt((section.querySelector('.overland-height') || {}).value, 10) || 0;

  const ol    = getOverlandMovement(root, move, days);
  const steps = (typeof getClimbingEncumbranceSteps === 'function')
    ? getClimbingEncumbranceSteps(root) : 0;
  const dv = getDivingSurfacing(root, steps, height, height > 0);

  const row = (k, v) =>
    '<div style="display:flex;justify-content:space-between;gap:16px;padding:3px 0;">' +
    '<span style="color:var(--muted);">' + k + '</span><span>' + v + '</span></div>';

  let html = '<div style="font-size:13px;">' +
    row('Normal march (10 hrs)', ol.normalMiles + ' miles/day') +
    row('Force march', ol.forceMiles + ' miles/day');

  if (days > 0) {
    html += row('Constitution check', ol.conCheck + ' or less, at day ' + days) +
            row('Attack penalty', ol.attackPenalty) +
            row('Rest to clear it', ol.restDays + ' days');
  }

  html += row('Dive, first round', dv.diveFirst + ' feet') +
          row('Surfacing', dv.cannotSurface
            ? '<span style="color:var(--error, #ff6b6b);">cannot reach the surface</span>'
            : dv.surfaceRate + ' ft/round') +
          row('Floating up (unconscious)', dv.floatRate + ' ft/round') +
          '</div>';

  const resEl = section.querySelector('.overland-result');
  if (resEl) resEl.innerHTML = html;

  const notesEl = section.querySelector('.overland-notes');
  if (!notesEl) return;

  let nHtml =
    '<div style="margin-bottom:8px;"><strong style="color:var(--text);">A day\'s march is ' +
    '10 hours</strong>, stops for rest and meals included, covering twice your movement ' +
    'rate in miles. Force marching pushes that to two and a half times, at the cost of a ' +
    'Constitution check at the end of each day &mdash; at &minus;1 per consecutive day. ' +
    'Fail it and no further force marching is possible until you have fully recovered, ' +
    'though you can still march at the normal rate.</div>' +
    '<div style="margin-bottom:8px;"><strong style="color:var(--text);">The attack penalty ' +
    'is cumulative and applies whether the check passes or fails.</strong> Half a day\'s ' +
    'rest clears one day\'s worth. Large parties check against the party\'s average ' +
    'Constitution; creatures with no Constitution score save vs. death instead. Terrain, ' +
    'weather and short rations all modify the pace &mdash; those are DMG territory.</div>' +
    '<div><strong style="color:var(--text);">Diving adds 10 feet for a run</strong> or a ' +
    'few feet of height, plus 5 feet per 10 feet of height, capped at +20. Both diving and ' +
    'surfacing lose 2 feet per encumbrance step. Swimming for hours costs Constitution ' +
    'and stacks attack penalties; a day\'s rest restores 1d6 ability points and clears ' +
    '2d6 of attack penalty.</div>';

  notesEl.innerHTML = nHtml;
}

// ===========================================================================
// TOOLS TAB SUB-TABS
// ===========================================================================

// Builds the strip from TOOLS_SUBTABS, hides every panel but the active one.
//
// MUST RUN AFTER the three gating renderers -- renderThiefSkills,
// renderTurnUndeadTable and renderRacialChecks. It reads the inline display
// they write to decide which tabs exist, so running it first shows a strip
// built from last recalculation's answer.
//
// The strip is rebuilt in full every call. That is safe ONLY because the
// selection lives in root._toolsSubtab rather than in the DOM -- the opposite
// of the vision panel's <select>, which had to be built once precisely because
// it holds the choice itself.
// Hide a section group when every section inside it is hidden, so a character
// never sees a gold band naming a group with nothing under it.
//
// READS each section's own inline display rather than re-deriving any gate.
// The gating renderers already decide whether their section applies; asking the
// same question a second way is how two answers drift apart, which is the
// reasoning behind toolsSubtabApplies as well.
//
// MUST use section.style.display and NOT getComputedStyle or offsetParent.
// Every inactive vertical tab is display:none, so a computed check would find
// every group on every tab the user is not currently looking at to be empty and
// hide the lot of them.
//
// The zero-sections guard is deliberate: an empty list would satisfy .some()
// vacuously and hide a group that simply has no sections yet.
function renderSectionGroups(root) {
  if (!root) return;
  Array.from(root.querySelectorAll('.section-group')).forEach(group => {
    const sections = Array.from(group.querySelectorAll('.section'));
    if (!sections.length) return;
    const anyVisible = sections.some(s => s.style.display !== 'none');
    group.classList.toggle('group-empty', !anyVisible);
  });
}

function renderToolsSubtabs(root) {
  const bar = root.querySelector('.subtab-bar');
  if (!bar || typeof TOOLS_SUBTABS === 'undefined') return;

  // A registry entry with no matching section is skipped rather than rendered
  // as a tab onto nothing -- the state a kit entry would sit in before its
  // panel is written.
  const available = TOOLS_SUBTABS.filter(t =>
    root.querySelector('.' + t.section) && toolsSubtabApplies(root, t));
  if (!available.length) return;

  // Fall back to Dice when the active tab has stopped applying -- dual-classing
  // out of thief with Thief Skills open. Then to the first available tab, in
  // case a future gate ever hides Dice itself.
  let active = root._toolsSubtab;
  if (!available.some(t => t.key === active)) active = TOOLS_SUBTAB_DEFAULT;
  if (!available.some(t => t.key === active)) active = available[0].key;
  root._toolsSubtab = active;

  bar.innerHTML = '';
  available.forEach(t => {
    // labelFrom lets a panel that computes its own heading name its own tab --
    // "Dwarven Abilities" vs "Elven Abilities". Falls back to the static label
    // for the moment before that panel has first rendered.
    let label = t.label;
    if (t.labelFrom) {
      const el = root.querySelector('.' + t.section + ' ' + t.labelFrom);
      const txt = el ? el.textContent.trim() : '';
      if (txt) label = txt;
    }
    const btn = document.createElement('div');
    btn.className = 'subtab ephemeral' + (t.key === active ? ' active' : '');
    btn.dataset.subtab = t.key;
    btn.textContent = label;
    bar.appendChild(btn);
  });

  // Hide by CLASS. Inline display belongs to the gating renderers and means
  // something different; see the note on .subtab-panel-hidden in style.css.
  TOOLS_SUBTABS.forEach(t => {
    const el = root.querySelector('.' + t.section);
    if (el) el.classList.toggle('subtab-panel-hidden', t.key !== active);
  });

  // Delegated to the BAR, not the buttons, so it survives the rebuild above.
  // Bound once, flagged on the element. Never calls markUnsaved: choosing a
  // tab is not an edit to the character.
  if (!bar._subtabBound) {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.subtab');
      if (!btn) return;
      root._toolsSubtab = btn.dataset.subtab;
      renderToolsSubtabs(root);
    });
    bar._subtabBound = true;
  }
}

// ===========================================================================
// VISION AND LIGHT (PHB Ch.13)
//
// PURE REFERENCE. These read nothing from the character and write nothing to
// it. No data-field is touched, so collectSheet never sees the panel, nothing
// is saved or loaded, and it does not print.
//
// Do NOT wire these into recalculateAll. The content is identical for every
// character and does not change when a stat does; re-rendering two tables on
// every keystroke would be pure waste. renderVisionLightPanel is called once
// per sheet from bindSheet.
// ===========================================================================

function renderVisibilityRanges(root) {
  const host = root.querySelector('.visibility-ranges-table');
  if (!host || typeof VISIBILITY_RANGES === 'undefined') return;

  const sel  = root.querySelector('.visibility-size');
  const size = (sel && sel.value) || 'M';

  const cols = [['movement','Movement'], ['spotted','Spotted'],
                ['type','Type'], ['id','ID'], ['detail','Detail']];

  const th = 'padding:4px 8px;border-bottom:1px solid var(--border);font-size:11px;';
  const td = 'padding:3px 8px;text-align:right;font-variant-numeric:tabular-nums;';

  let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr>' +
             '<th style="text-align:left;' + th + '">Condition</th>';
  cols.forEach(c => {
    html += '<th style="text-align:right;' + th + '">' + escapeHtml(c[1]) + '</th>';
  });
  html += '</tr></thead><tbody>';

  VISIBILITY_RANGES.forEach(row => {
    const r = (typeof visibilityRowForSize === 'function')
      ? visibilityRowForSize(row, size) : row;
    html += '<tr><td style="padding:3px 8px;">' + escapeHtml(r.condition) + '</td>';
    // 'en-US' explicitly, not the browser's locale. This is a transcription of
    // an English table and 1,500 must not render as 1.500 for anybody.
    cols.forEach(c => {
      html += '<td style="' + td + '">' + r[c[0]].toLocaleString('en-US') + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  // The column definitions. The chapter spells these out and a bare grid of
  // numbers loses them entirely.
  html += '<div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.6;">' +
    '<strong>Movement</strong> a moving figure &middot; ' +
    '<strong>Spotted</strong> moving or still &middot; ' +
    '<strong>Type</strong> species, race, weapons &middot; ' +
    '<strong>ID</strong> the individual &middot; ' +
    '<strong>Detail</strong> small actions</div>';

  host.innerHTML = html;
}

function renderLightSources(root) {
  const host = root.querySelector('.light-sources-table');
  if (!host || typeof LIGHT_SOURCES === 'undefined') return;

  const th = 'padding:4px 8px;border-bottom:1px solid var(--border);font-size:11px;';

  let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr>' +
    '<th style="text-align:left;'  + th + '">Source</th>' +
    '<th style="text-align:right;' + th + '">Radius</th>' +
    '<th style="text-align:left;'  + th + '">Burning time</th>' +
    '</tr></thead><tbody>';

  LIGHT_SOURCES.forEach(s => {
    // Table 63 italicises the two spells and marks the beams and the optional
    // rule with its own asterisks. Both markers are derived from the flags, so
    // adding a charged entry later cannot leave a footnote orphaned.
    const nm   = s.magical ? '<em>' + escapeHtml(s.name) + '</em>' : escapeHtml(s.name);
    // Markers ACCUMULATE. The beacon lantern carries both a cone footnote and a
    // burn-time conflict, so a ternary chain would silently drop one.
    const marks = (s.beamWidth ? '*' : '') + (s.optional ? '**' : '') +
                  (s.burnNote ? '\u2020' : '');
    const mark = marks;
    html += '<tr><td style="padding:3px 8px;">' + nm + mark + '</td>' +
      '<td style="padding:3px 8px;text-align:right;font-variant-numeric:tabular-nums;">' +
        s.radius + ' ft.</td>' +
      '<td style="padding:3px 8px;">' + escapeHtml(s.burn) + '</td></tr>';
  });
  html += '</tbody></table>';

  // Cone widths read from the data rather than retyped, so they cannot drift.
  const beams = LIGHT_SOURCES.filter(s => s.beamWidth)
    .map(s => escapeHtml(s.name.toLowerCase()) + ' ' + s.beamWidth + ' ft. wide')
    .join(', ');

  // Derived from the data, like the beam widths above, so a second conflicting
  // entry cannot leave an orphaned dagger.
  const burnNotes = LIGHT_SOURCES.filter(s => s.burnNote)
    .map(s => escapeHtml(s.name) + ' \u2014 ' + escapeHtml(s.burnNote))
    .join('<br>');

  html += '<div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.6;">' +
    '<strong>*</strong> Not a radius but a cone-shaped beam, measured at its far end: ' +
      beams + '.<br>' +
    '<strong>**</strong> Magical weapons shed light only if your DM allows this optional rule.' +
    (burnNotes ? '<br><strong>\u2020</strong> ' + burnNotes : '') +
    '</div>';

  host.innerHTML = html;
}

// Single entry point, so app.js needs exactly one call.
function renderVisionLightPanel(root) {
  const sel = root.querySelector('.visibility-size');

  // Populate and bind ONCE. The guard flag matters: re-binding on every render
  // stacks listeners, and every stacked listener re-renders -- the classic way
  // one <select> change turns into eight.
  if (sel && typeof VISIBILITY_SIZES !== 'undefined' && !sel._vlBound) {
    sel.innerHTML = VISIBILITY_SIZES.map(s =>
      '<option value="' + escapeHtml(s.key) + '">' + escapeHtml(s.label) + '</option>'
    ).join('');
    sel.value = 'M';
    sel.addEventListener('change', () => renderVisibilityRanges(root));
    sel._vlBound = true;
  }

  renderVisibilityRanges(root);
  renderLightSources(root);
}

// Cover and concealment (PHB Table 59). Same shape as the vision panel: pure
// reference, no character state, rendered once from bindSheet.
function renderCoverReference(root) {
  const host = root.querySelector('.cover-modifiers-table');
  if (!host || typeof COVER_MODIFIERS === 'undefined') return;

  const th = 'padding:4px 8px;border-bottom:1px solid var(--border);font-size:11px;';
  const td = 'padding:3px 8px;text-align:right;font-variant-numeric:tabular-nums;';

  let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr>' +
    '<th style="text-align:left;'  + th + '">Target is</th>' +
    '<th style="text-align:right;' + th + '">Cover</th>' +
    '<th style="text-align:right;' + th + '">Concealment</th>' +
    '</tr></thead><tbody>';

  COVER_MODIFIERS.forEach(r => {
    html += '<tr><td style="padding:3px 8px;">' + r.hidden + '% hidden</td>' +
      '<td style="' + td + '">' + r.cover + '</td>' +
      '<td style="' + td + '">' + r.concealment + '</td></tr>';
  });

  host.innerHTML = html + '</tbody></table>';
}
