// ===== Utilities =====.
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

 // Spell Immunity — PHB Table 5. Keys off the WIS score ALONE, no class gate.,
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
  // === PHBR2 Swashbuckler: fighter THAC0 with his weapon of choice ===
  //
  // p.42: the extra weapon proficiency slot must go to a stiletto, main-gauche,
  // rapier or sabre, "and with this, the Swashbuckler's 'weapon of choice,' the
  // thief is able to fight with the THAC0 of a fighter of his experience level."
  // ONE nominated weapon, not all four -- the four are what he may CHOOSE from.
  //
  // SHOWN AS A DELTA, NOT A THAC0. The gap is purely progression, so subtracting
  // it from any row of the attack matrix is correct and carries that weapon's
  // Strength, enchantment and specialisation adjustments with it. A standalone
  // figure here would be a bare number the reader could not place.
  //
  // NOT BAND-GATED, unlike every other PHBR2 mechanic: this is a kit benefit,
  // and the kit only exists at all when PHBR2's kits are in play. Chris's call,
  // August 2026.
  //
  // NOT A SECOND THAC0 PROGRESSION either, and deliberately -- one kit of
  // eighteen does not justify teaching renderAttackMatrix, the multi-class
  // resolver and the dual-class resolver about a per-weapon class swap.
  const swashEl = root.querySelector('.combat-swashbuckler');
  if (swashEl) {
    const kitVal = (val(root, 'kit') || '').toLowerCase().replace(/\s+/g, '');
    const lvl    = parseInt(val(root, 'level') || 0, 10);
    const tables = (typeof THAC0_TABLES !== 'undefined') ? THAC0_TABLES : null;
    let delta = null;
    if (kitVal === 'swashbuckler' && tables && lvl >= 1) {
      // Clamped at the table's length, as getThac0 does: both tables stop at 20.
      const i = Math.min(lvl, tables.rogue.length) - 1;
      delta = tables.rogue[i] - tables.warrior[i];
    }
    if (delta === null) {
      swashEl.style.display = 'none';
      swashEl.textContent = '';
    } else {
      swashEl.style.display = '';
      // ZERO IS WORTH PRINTING. Both tables start at 20, so a 1st-level
      // Swashbuckler's headline benefit is worth nothing yet -- saying so is
      // more use than an absent line he would read as a bug.
      swashEl.innerHTML = '<strong>Weapon of choice:</strong> ' +
        (delta > 0
          ? 'THAC0 is <strong>' + delta + ' better</strong> (fighter progression at level ' + lvl + ')'
          : 'no THAC0 benefit yet \u2014 the fighter and rogue progressions are equal at 1st level');
      swashEl.title =
        'PHBR2 p.42. The Swashbuckler fights with the THAC0 of a FIGHTER of his ' +
        'experience level, using the one weapon bought with his extra ' +
        'proficiency slot: stiletto, main-gauche, rapier or sabre.\n\n' +
        'Subtract ' + delta + ' from that weapon\u2019s row on the attack matrix. ' +
        'Strength, enchantment and specialisation are already in those rows and ' +
        'still apply.\n\n' +
        'The gap widens with level: 0 at 1st, 3 at 6th, 10 at 20th.';
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
    // PHBR4 p.20: on abandoning his school "he loses all saving throw bonuses at
    // the time of his conversion", so these modifiers stop even while the class
    // field still names the school.
    const gaveUpSchool = (typeof hasAbandonedSchool === 'function') && hasAbandonedSchool(root);
    if (specSchool && !gaveUpSchool) {
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
        quality: (el.querySelector('.weapon-quality') || {}).value || '',
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

      // PHBR1 weapon quality. Folded in AFTER the magicHit/magicDmg snapshot
      // above and BEFORE specialization, alongside the two-hander bonus -- it is
      // a plain arithmetic term of exactly that kind. Putting it above the
      // snapshot would make a Fine +5 sword report its ENCHANTMENT as +6, which
      // is the bug the snapshot exists to prevent.
      //
      // It never touches `enchant`, so quality can never let a weapon strike a
      // creature that only a magical weapon can harm.
      const wq = (typeof getWeaponQuality === 'function')
        ? getWeaponQuality(weapon.quality || '') : null;
      if (wq) { hitBase += wq.hit; dmgBase += wq.dmg; }

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

      // PHBR1 breakage. THE mid-combat surface -- the weapon card is on the
      // Equipment tab and this panel is in the sidebar, so a rule that fires on
      // every hit belongs here. A REMINDER, never a roll: this function renders,
      // it does not resolve, and the roller lives on Tools with the others.
      if (typeof getWeaponShatter === 'function' || typeof getWeaponBreak === 'function') {
        const bSh = (typeof getWeaponShatter === 'function')
          ? getWeaponShatter(weapon.name, weapon.weaponTypeKey) : null;
        const bBr = bSh ? null
          : ((typeof getWeaponBreak === 'function')
              ? getWeaponBreak(weapon.name, weapon.weaponTypeKey) : null);
        const bRule = bSh || bBr;
        if (bRule) {
          const bThr = bRule.on === 1 ? '1' : '1 or 2';
          html += '<span style="color:var(--warning, #e0a34a);" ' +
                  'title="' + (bSh
                    ? 'PHBR1 p.101. Rolled on EVERY hit. The attack still does its full damage.'
                    : 'PHBR1 p.85. Rolled only after ' + escapeHtml(bBr.when || 'a qualifying hit') +
                      '. Breaks to a club.') +
                  ' Roll it on the Tools tab.">' +
                  (bSh
                    ? (bSh.material ? escapeHtml(bSh.material) + ': ' : '') +
                      'shatters on ' + bThr + ' (1d6) each hit'
                    : 'breaks on ' + bThr + ' (1d6) if over 12 damage or parried') +
                  '</span><br>';
        }
      }

      // Quality reported on its OWN line, like specialization and enchantment.
      // Poor is the only grade whose break is automatic, so it is the only one
      // that says anything about breaking.
      if (wq) {
        const qBits = [];
        if (wq.hit) qBits.push((wq.hit > 0 ? '+' : '') + wq.hit + ' hit');
        if (wq.dmg) qBits.push((wq.dmg > 0 ? '+' : '') + wq.dmg + ' damage');
        html += '<span style="color:var(--info, #6fb3d2);" ' +
                'title="' + escapeHtml(wq.blurb + ' Quality is NOT magical: it does not let ' +
                  'this weapon harm a creature that only magical weapons can hurt, and it ' +
                  'does not reduce speed factor.') + '">' +
                escapeHtml(wq.label) + ': ' +
                (qBits.length ? qBits.join(', ') + ' (included above)' : 'no adjustment') +
                (wq.breakOn ? ' \u00b7 breaks on a natural 1\u2013' + wq.breakOn : '') +
                '</span><br>';
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
  
  // ONLY THE TABLE 4 READ SHIFTS. INT_BONUS_PROFS below keeps the RAW score --
  // PHBR4 p.40 names four things its limitation touches and bonus proficiencies
  // is not among them, and neither is the experience bonus.
  const spInt = (typeof getEffectiveIntForSpellTable === 'function') ? getEffectiveIntForSpellTable(root) : int;
  const intData = INT_TABLE[spInt];
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

// PHBR3 specialty priest overrides: the SINGLE OWNER of visibility for the
// Specialty Priest block and for the 5%-tier note in the XP disclosure. Two
// owners is how the kit Variant column once rendered blank on single-class
// sheets, so nothing else may write display on either element.
//
// char_type IS CHECKED FIRST, and not only for the stated single-class scope.
// getClassCategory matches by substring, longest key first, so "Cleric 7 /
// Fighter 9" resolves to WARRIOR (fighter, 7 chars, beats cleric, 6) while
// "Cleric 7 / Thief 9" resolves to priest. Gating on category alone would admit
// some multi-class priests and reject others at random. Testing char_type first
// means that ambiguity is never reached.
// PHBR3 pp.19-21 restriction banners. ONE renderer, four banners, driven by a
// table -- they share a gate, a style and their show-if-nonempty logic, and
// differ only in which fields feed them and where they land. A fifth is a row
// in SP_BANNERS, not a sixth function.
//
// ECHOES, NOT JUDGEMENTS. Each shows back what the player recorded under
// Specialty Priest. Nothing here reads an armor row, a weapon row or an item --
// which is the point. The books decline to state materials often enough
// (Shield, Small is "wooden or metal"; the gladiator cuirass is "leather or
// metal") that a computed verdict would have to invent one.
//
// CROSSOVER GROUP DELIBERATELY HAS NO BANNER. It is the one specialty priest
// setting that already does something visible -- slot costs move in that very
// section and every affected proficiency reports it -- so a banner would only
// narrate what the numbers already say.
// Resolve the applied template from the provenance field. Returns null for
// DM-Created, for an unrecognised label, and for "(Modified)" only in the sense
// that the suffix is stripped first -- a modified priesthood is STILL that
// priesthood for checking purposes, which is Chris's ruling on provenance: the
// DM said "you are a priest of War, with a tweak".
function getAppliedTemplate(root) {
  const src = (val(root, 'sp_template_source') || '').replace(/\s*\(Modified\)\s*$/, '').trim();
  if (!src || src === 'DM-Created') return null;
  const list = (typeof PRIESTHOOD_TEMPLATES !== 'undefined') ? PRIESTHOOD_TEMPLATES : [];
  return list.find(p => (p.label || '') === src) || null;
}

// UNARMED COMBAT (PHBR1 pp.74-78). Owns the .unarmed-styles block: visibility,
// the derived readout, and the advisory.
//
// SLOT COUNTS, NOT SPECIALIZATION LEVELS. The select value is how many weapon
// proficiency slots the character has put into that style, because the two do
// not line up across the three: everyone already knows punching and wrestling,
// so ONE slot buys specialization outright, while Martial Arts costs a slot
// merely to KNOW and a second to specialize. One honest number in the field,
// and the bonuses derived from it here.
//
// THE BONUS LADDER (p.78, Continuing Specialization): the first specializing
// slot gives +1/+1/+1, and EACH FURTHER slot gives another +1 to hit, +1 to
// damage and +1 chart bonus.
const UNARMED_STYLES = [
  { field: 'unarmed_punching',     label: 'Punching',     specAt: 1 },
  { field: 'unarmed_wrestling',    label: 'Wrestling',    specAt: 1 },
  { field: 'unarmed_martial_arts', label: 'Martial Arts', specAt: 2 }
];

function unarmedBonus(slots, specAt) {
  const n = parseInt(slots, 10) || 0;
  return n < specAt ? 0 : (n - specAt) + 1;
}

function renderUnarmedStyles(root) {
  const box = root.querySelector('.unarmed-styles');
  if (!box) return;
  const on = (typeof isSupplementActive === 'function') &&
             isSupplementActive('phbr1', 'unarmedCombat');
  box.style.display = on ? '' : 'none';
  if (!on) return;

  const sumEl = root.querySelector('.unarmed-summary');
  const advEl = root.querySelector('.unarmed-advisory');
  const parts = [], warn = [];
  let specialized = 0;

  UNARMED_STYLES.forEach(s => {
    const slots = parseInt(val(root, s.field), 10) || 0;
    if (!slots) return;
    const b = unarmedBonus(slots, s.specAt);
    if (!b) {
      // Martial Arts at exactly one slot: known, not specialized.
      parts.push('<strong>' + s.label + '</strong> known, not specialized');
      return;
    }
    specialized++;
    parts.push('<strong>' + s.label + '</strong> +' + b + ' to hit, +' + b +
               ' damage, +' + b + ' chart bonus');
  });

  // ONE STYLE ONLY, for most characters (p.77). A single-class Warrior and the
  // PHBR3 Fighting-Monk are the exceptions, which is why this tests the KIT and
  // not the class alone.
  const clazz  = (val(root, 'clazz') || '').toLowerCase();
  const single = (val(root, 'char_type') || 'single').toLowerCase() === 'single';
  // THE SELECT STORES THE KIT NAME WITH WHITESPACE STRIPPED, NOT THE OBJECT KEY
  // (see the option builder: kit.name.toLowerCase().replace(/\s+/g,'')). The
  // name is "Fighting-Monk", so the stored value is "fighting-monk" WITH THE
  // HYPHEN -- the key `fightingmonk` never appears in the field. Punctuation is
  // stripped here rather than matched, so a rename to "Fighting Monk" or
  // "Fighting/Monk" still resolves.
  const kitVal = (val(root, 'kit') || '').toLowerCase().replace(/[^a-z]/g, '');
  const isWarrior = single && (typeof getClassCategory === 'function') &&
                    getClassCategory(clazz) === 'warrior';
  const isMonk    = kitVal === 'fightingmonk';
  const mayHaveMany = isWarrior || isMonk;

  if (specialized > 1 && !mayHaveMany) {
    warn.push('PHBR1 p.77: any character may specialize in ONE of the three unarmed styles. ' +
              'Only a single-class warrior \u2014 or the Fighting-Monk from PHBR3 \u2014 may take more.');
  }
  const continuing = UNARMED_STYLES.filter(s =>
    unarmedBonus(val(root, s.field), s.specAt) > 1).map(s => s.label);
  if (continuing.length && !mayHaveMany) {
    warn.push('PHBR1 p.78: Continuing Specialization \u2014 spending further slots for another ' +
              '+1 each \u2014 is open only to single-class warriors and Fighting-Monks. ' +
              'This character has it in ' + escapeHtml(continuing.join(', ')) + '.');
  }
  // A Rogue may take no weapon specialization at all, but may still take ONE
  // unarmed style (p.75). Worth stating, because it reads like a contradiction.
  if (specialized === 1 && (typeof getClassCategory === 'function') &&
      getClassCategory(clazz) === 'rogue') {
    parts.push('<span style="color:var(--muted);">A rogue may take one unarmed style ' +
               'specialization even though he may take no weapon specialization (p.75).</span>');
  }

  if (sumEl) {
    sumEl.innerHTML = parts.length
      ? parts.join(' <span style="color:var(--muted);">\u00B7</span> ') +
        '<br><span style="color:var(--muted);">One extra unarmed attack per round while both ' +
        'hands are free and empty. Chart bonus of +2 or more lets you choose any maneuver in ' +
        'range on the results table.</span>'
      : '<span style="color:var(--muted);">Everyone can punch and wrestle without spending a ' +
        'slot. Specializing buys +1 to hit, +1 damage and a +1 chart bonus.</span>';
  }
  if (advEl) {
    advEl.innerHTML = warn.length
      ? '<strong>Unarmed combat</strong> \u2014 advisory; nothing is blocked.<br>' + warn.join('<br>')
      : '';
    advEl.style.display = warn.length ? '' : 'none';
  }
}

// The Tools-tab companion to the maneuvers panel. Renders the three lookup
// tables from UNARMED_DATA -- no game data lives in this function or in the
// markup it fills.
//
// THE TABLES ARE LIVE, NOT INERT. A chart bonus lets the character choose any
// maneuver within its range on a given roll, which no static table can show, so
// the rows in reach of his bonus are marked and the panel repaints when his
// specialization changes.
function unarmedRow(cells, opts) {
  const o = opts || {};
  return '<div style="display:flex;gap:10px;padding:3px 6px;border-radius:3px;' +
         (o.head ? 'font-size:11px;color:var(--muted);border-bottom:1px solid var(--border);' : 'font-size:12px;') +
         '">' + cells.map(c =>
           '<span style="' + (c.w || 'flex:1') + ';' + (c.style || '') + '">' +
           escapeHtml(String(c.t)) + '</span>').join('') + '</div>';
}

function renderUnarmedTables(root) {
  const sec = root.querySelector('.unarmed-section');
  if (!sec) return;
  const on = (typeof isSupplementActive === 'function') &&
             isSupplementActive('phbr1', 'unarmedCombat');
  sec.style.display = on ? '' : 'none';
  if (!on) return;
  const D = (typeof UNARMED_DATA !== 'undefined') ? UNARMED_DATA : null;
  if (!D) return;

  const slots = f => { const v = parseInt(val(root, f), 10); return isNaN(v) ? 0 : v; };
  const maSlots = slots('unarmed_martial_arts');
  const maBonus = (typeof unarmedBonus === 'function') ? unarmedBonus(maSlots, 2) : 0;
  const pBonus  = (typeof unarmedBonus === 'function') ? unarmedBonus(slots('unarmed_punching'), 1) : 0;
  const wBonus  = (typeof unarmedBonus === 'function') ? unarmedBonus(slots('unarmed_wrestling'), 1) : 0;

  const intro = sec.querySelector('.unarmed-tables-intro');
  if (intro) intro.textContent =
    'Everyone can punch and wrestle without spending a slot. Martial Arts must be learned, ' +
    'and exists only if your DM says it does. Damage is mostly temporary: 75% of punching ' +
    'and wrestling damage, and 75% of martial arts damage, wears off after the fight.';

  // What the character actually has, so the tables below are not abstract.
  const bEl = sec.querySelector('.unarmed-tables-bonuses');
  if (bEl) {
    const bits = [];
    if (pBonus) bits.push('Punching +' + pBonus + ' hit, +' + pBonus + ' damage, chart +' + pBonus);
    if (wBonus) bits.push('Wrestling +' + wBonus + ' hit, +' + wBonus + ' damage, chart +' + wBonus);
    if (maSlots === 1) bits.push('Martial Arts known, not specialized');
    else if (maBonus) bits.push('Martial Arts +' + maBonus + ' hit, +' + maBonus + ' damage, chart +' + maBonus);
    bEl.innerHTML = bits.length
      ? '<div style="font-size:12px;line-height:1.6;">' + bits.map(escapeHtml).join(
          ' <span style="color:var(--muted);">\u00B7</span> ') +
        '<div style="font-size:11px;color:var(--muted);margin-top:2px;">A CHART BONUS DOES NOT ' +
        'CHANGE YOUR ROLL \u2014 it lets you take a different row once you have hit. At +1 you may ' +
        'take the maneuver one row above or below the one you rolled, usually for more damage or ' +
        'a better knockout chance. At +2 or more you may choose ANY maneuver within that ' +
        'range.</div></div>'
      : '<div style="font-size:11px;color:var(--muted);">You have not specialized in an unarmed ' +
        'style. Set one on the Proficiencies tab to see your chart bonus applied below.</div>';
  }

  // --- Martial Arts Results (PHBR1 p.76). Shown only if he knows the style. ---
  const maEl = sec.querySelector('.unarmed-table-ma');
  if (maEl) {
    if (!maSlots) { maEl.innerHTML = ''; }
    else {
      const rows = (D.martialArtsResults && D.martialArtsResults.rows) || [];
      maEl.innerHTML =
        '<h4 style="font-size:12px;margin:0 0 6px;">Martial Arts Results</h4>' +
        unarmedRow([{t:'Roll',w:'width:70px'},{t:'Maneuver',w:'flex:1'},
                    {t:'Dmg',w:'width:50px'},{t:'% KO',w:'width:50px'}], {head:true}) +
        rows.map((r, i) =>
          unarmedRow([{t:r.roll,w:'width:70px'},{t:r.maneuver,w:'flex:1'},
                      {t:r.damage,w:'width:50px'},{t:r.koPercent + '%',w:'width:50px'}]
                     )).join('') +
        (maBonus > 0
          ? '<div style="font-size:11px;color:var(--muted);margin-top:4px;">Your +' + maBonus +
            ' chart bonus: once you hit, you may take a maneuver up to ' + maBonus + ' row' +
            (maBonus > 1 ? 's' : '') + ' above or below the one you rolled' +
            (maBonus > 1 ? ', and anything in between' : '') + '.</div>'
          : '');
    }
  }

  // --- Maneuver descriptions, collapsed. ---
  const dEl = sec.querySelector('.unarmed-maneuver-descriptions');
  if (dEl) {
    dEl.innerHTML = (!maSlots) ? '' :
      '<details><summary style="cursor:pointer;font-size:12px;color:var(--accent);">' +
      'What each maneuver is</summary><div style="padding:6px 2px;font-size:12px;line-height:1.6;">' +
      (D.maneuvers || []).map(m =>
        '<div style="margin-bottom:3px;"><strong>' + escapeHtml(m.name) + '</strong> \u2014 ' +
        escapeHtml(m.description) + '</div>').join('') + '</div></details>';
  }

  // --- Punching and Wrestling Results (PHB Table 58). Always shown. ---
  const pwEl = sec.querySelector('.unarmed-table-pw');
  if (pwEl) {
    const t58 = D.phbTable58 || {};
    pwEl.innerHTML =
      '<h4 style="font-size:12px;margin:0 0 6px;">Punching and Wrestling Results ' +
      '<span style="font-weight:400;color:var(--muted);font-size:11px;">(PHB Table 58)</span></h4>' +
      unarmedRow([{t:'Roll',w:'width:70px'},{t:'Punch',w:'flex:1'},{t:'Dmg',w:'width:44px'},
                  {t:'% KO',w:'width:44px'},{t:'Wrestle',w:'flex:1'}], {head:true}) +
      (t58.rows || []).map(r =>
        unarmedRow([{t:r.roll,w:'width:70px'},{t:r.punch,w:'flex:1'},{t:r.damage,w:'width:44px'},
                    {t:r.koPercent + '%',w:'width:44px'},
                    {t:r.wrestle + (r.hold ? '  \u21bb held' : ''),w:'flex:1',
                     style: r.hold ? 'color:var(--accent-light);' : ''}]
                   )).join('') +
      '<div style="font-size:11px;color:var(--muted);margin-top:4px;">' +
      '\u21bb held \u2014 the hold can be maintained round to round until broken. ' +
      'One roll gives both columns; use whichever you were attempting.</div>';
  }

  // --- Armor Modifiers for Wrestling (PHB Table 57). ---
  const arEl = sec.querySelector('.unarmed-table-armor');
  if (arEl) {
    const t57 = D.phbTable57 || {};
    arEl.innerHTML =
      '<h4 style="font-size:12px;margin:0 0 6px;">Armor Modifiers for Wrestling ' +
      '<span style="font-weight:400;color:var(--muted);font-size:11px;">(PHB Table 57)</span></h4>' +
      unarmedRow([{t:'Armor',w:'flex:1'},{t:'Modifier',w:'width:80px'}], {head:true}) +
      (t57.rows || []).map(r =>
        unarmedRow([{t:r.armor,w:'flex:1'},{t:r.modifier,w:'width:80px'}])).join('') +
      '<div style="font-size:11px;color:var(--muted);margin-top:4px;">' +
      escapeHtml(t57.note || '') + '</div>';
  }
}

// KIT REQUIREMENT CHECKS ARE NOT HERE. They live in tables.js as
// validateKitAbilities, validateKitGender and validateKitPriesthood, feeding
// renderClassGroupValidation's shared banner alongside validateKitAlignment.
//
// A renderer was built here first and removed: it duplicated validateKitAlignment,
// which had existed all along and handled a case the new one did not -- a kit
// whose alignment requirement is deity-dependent returns null and says nothing,
// because an amber banner that can never be cleared is warning fatigue. The
// duplicate was written after a grep for `.requirements` came back empty and the
// negative was not sanity-checked against a field known to be populated.

// FOUR CROSS-CHECKS, three of them here and the sphere budget in
// renderSphereAccessSummary where the counting already happens.
//
// ADVISORY, AND WORDED AS GUIDANCE RATHER THAN ERROR. PHBR3 breaks its own rules
// in its own entries -- Agriculture is Poor combat on a d8 where p.21 says d6 --
// so a check that called that a mistake would be calling the book wrong.
const ABILITY_LABELS_SP = { str:'Strength', dex:'Dexterity', con:'Constitution',
                            int:'Intelligence', wis:'Wisdom', cha:'Charisma' };

function renderSpecialtyPriestChecks(root) {
  const el = root.querySelector('.sp-checks');
  if (!el) return;
  const on = (typeof getSpecialtyPriestOverride === 'function') &&
             (getSpecialtyPriestOverride(root, 'sp_combat') !== null);
  const gate = (typeof isSupplementActive === 'function') &&
               isSupplementActive('phbr3', 'specialtyPriests');
  const lines = [];

  if (gate) {
    const t = getAppliedTemplate(root);

    // 1. MINIMUM ABILITY SCORES. Template-only: the sheet has no field for them.
    if (t && t.minAbilities) {
      const short = Object.keys(t.minAbilities).filter(k => {
        const have = parseInt(val(root, k) || 0, 10);
        return have > 0 && have < t.minAbilities[k];
      });
      if (short.length) {
        lines.push('<strong>' + escapeHtml(t.label) + '</strong> asks ' +
          escapeHtml(Object.keys(t.minAbilities)
            .map(k => (ABILITY_LABELS_SP[k] || k) + ' ' + t.minAbilities[k]).join(', ')) +
          ' \u2014 short on ' + escapeHtml(short.map(k => ABILITY_LABELS_SP[k] || k).join(', ')) + '.');
      }
    }

    // 2. RACES ALLOWED. Template-only, same reason.
    if (t && t.racesAllowed && t.racesAllowed.length &&
        typeof getRaceKey === 'function') {
      const rk = getRaceKey(val(root, 'race') || '');
      if (rk && t.racesAllowed.indexOf(rk) === -1) {
        lines.push('<strong>' + escapeHtml(t.label) + '</strong> is open to ' +
          escapeHtml(t.racesAllowed.join(', ')) + ' \u2014 this character is ' +
          escapeHtml(rk) + '.');
      }
    }

    // 3. HIT DIE vs COMBAT ABILITIES (p.21). Character fields, so this works for
    // a DM-invented faith as well as a printed one.
    const die = getSpecialtyPriestOverride(root, 'sp_hit_die');
    const cbt = getSpecialtyPriestOverride(root, 'sp_combat');
    if (die && cbt) {
      if (die === '4' && cbt !== 'poor') {
        lines.push('PHBR3 p.21 gives four-sided dice only to a priesthood with POOR ' +
                   'combat abilities, and warns even then that it need not be so.');
      } else if (die === '6' && cbt === 'good') {
        lines.push('PHBR3 p.21 gives six-sided dice to a priesthood with MEDIUM to POOR ' +
                   'combat abilities.');
      }
    }
  }

  el.innerHTML = lines.length
    ? '<strong>Priesthood guidance</strong> \u2014 advisory; nothing here is blocked.<br>' +
      lines.join('<br>')
    : '';
  el.style.display = lines.length ? '' : 'none';
}

const SP_BANNERS = [
  { key: 'armor',       heading: 'Priesthood restrictions',
    fields: [['sp_restrict_armor', 'Armor'], ['sp_restrict_clothing', 'Dress']] },
  { key: 'weapons',     heading: 'Priesthood restrictions',
    fields: [['sp_restrict_weapons', 'Weapons']] },
  { key: 'items',       heading: 'Priesthood restrictions',
    fields: [['sp_restrict_items', 'Magical items']] },
  { key: 'observances', heading: 'Priesthood observances',
    fields: [['sp_restrict_celibacy', 'Celibacy &amp; chastity'],
             ['sp_restrict_diet', 'Diet &amp; contamination'],
             ['sp_restrict_mutilation', 'Mutilation'],
             ['sp_restrictions', 'Other']] }
];

// renderSpecialtyPriestFaith WAS HERE and has been removed. It owned the Faith
// Type and Combat Abilities row while those fields lived on the Details tab;
// when they moved into the collapsible Core block they came under
// renderSpecialtyPriest's gate, leaving this function with nothing to select.
// Its guard meant it failed safe rather than loudly, which is exactly why dead
// code like this survives -- deleted rather than left to look meaningful.
function renderSpecialtyPriestBanners(root) {
  const els = root.querySelectorAll('.sp-restrict-banner');
  if (!els.length) return;

  // Same gate as the fields themselves. With the band off, or on a fighter, or
  // on a multi-class character, every banner goes quiet -- but nothing typed is
  // touched, so it all comes back.
  const on = (typeof getSpecialtyPriestOverride === 'function');

  els.forEach(el => {
    const def = SP_BANNERS.find(b => b.key === el.getAttribute('data-sp-banner'));
    if (!def) return;
    const lines = on ? def.fields
      .map(([f, label]) => {
        const v = (getSpecialtyPriestOverride(root, f) || '').trim();
        return v ? '<strong>' + label + ':</strong> ' + escapeHtml(v) : '';
      })
      .filter(Boolean) : [];
    if (!lines.length) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }
    el.innerHTML = '<strong>' + def.heading + '</strong> (PHBR3 pp.19\u201321) \u2014 ' +
                   'advisory; nothing here is blocked.<br>' + lines.join('<br>');
    el.style.display = '';
  });
}

// SINGLE OWNER of the Class Status column and its banner. Fills the option
// labels too, because "Fallen -- irrevocable" and "Renounced -- irrevocable"
// are the same stored state in different words, and hardcoding either in the
// template would be wrong for the other class.
//
// PALADINS ARE CLASS_CATEGORIES "warrior", NOT "priest", so the test needs both
// conditions. char_type is checked first for the same reason it is in
// renderSpecialtyPriest: getClassCategory matches by substring, longest key
// first, so "Cleric 7 / Fighter 9" resolves to warrior while "Cleric 7 /
// Thief 9" resolves to priest.
function renderClassStatus(root) {
  const col  = root.querySelector('.class-status-col');
  const note = root.querySelector('.class-status-note');
  if (!col && !note) return;

  const clazz  = (val(root, 'clazz') || '').toLowerCase();
  const single = (val(root, 'char_type') || 'single').toLowerCase() === 'single';
  const isPaladin = single && clazz.includes('paladin');
  const isPriest  = single && (typeof getClassCategory === 'function') &&
                    getClassCategory(clazz) === 'priest';
  // A SPECIALIST WIZARD, or a mage who used to be one. The second half matters:
  // PHBR4 p.20 says he "must remain a mage for the duration of his career", so
  // the class field is expected to read Mage afterwards -- and the control that
  // records what happened must not vanish the moment he edits it.
  const wasSpec   = ((val(root, 'former_school') || '').trim() !== '');
  const isSpecialist = single &&
    (((typeof getSpecialistSchool === 'function') && !!getSpecialistSchool(clazz)) || wasSpec);
  const show = isPaladin || isPriest || isSpecialist;

  if (col) col.style.display = show ? '' : 'none';
  if (!show) { if (note) note.style.display = 'none'; return; }

  const L = isSpecialist
    ? { graced:    'Abandoned \u2014 bonuses retained by DM',
        suspended: '',
        fallen:    'Abandoned his school \u2014 irrevocable' }
    : isPriest
    ? { graced:    'Renounced \u2014 abilities retained by DM',
        suspended: 'Spells withheld pending atonement',
        fallen:    'Renounced \u2014 irrevocable' }
    : { graced:    'Fallen \u2014 abilities retained by DM',
        suspended: 'Suspended pending atonement',
        fallen:    'Fallen \u2014 irrevocable' };
  Object.keys(L).forEach(k => {
    const opt = col && col.querySelector('.cs-' + k);
    if (!opt) return;
    // PHBR4's abandonment IS VOLUNTARY AND HAS NO ATONEMENT PATH, so there is
    // no wizard analogue of 'suspended' and none is invented. Hidden rather
    // than relabelled -- a state the book does not describe should not be
    // offered under a name we made up. 'graced' is dropped for the same reason
    // in a different direction: abandoning is the player's own choice, so
    // "abandoned but the DM let him keep it" is a state nobody asks for.
    // Chris's call on both.
    const hideForWizard = isSpecialist && (k === 'suspended' || k === 'graced');
    opt.hidden = hideForWizard;
    opt.disabled = hideForWizard;
    opt.textContent = L[k] || '';
  });

  // THE FORMER SPECIALTY COLUMN, shown only once he has actually abandoned one.
  // Kept visible when the value is set even if the class no longer resolves as a
  // specialist -- which is the normal end state, since the book has him become a
  // mage. Hiding it then would strand the value where nobody could correct it.
  const fsCol = root.querySelector('.former-school-col');
  const fsSel = root.querySelector('[data-field="former_school"]');
  const clzEl = root.querySelector('[data-field="clazz"]');
  const stNow = (typeof getFallenStatus === 'function') ? getFallenStatus(root) : '';
  const fsVal = (val(root, 'former_school') || '').trim();
  if (fsCol) {
    fsCol.style.display = (stNow === 'fallen' && (isSpecialist || fsVal)) ? '' : 'none';
  }

  // BOTH FIELDS LOCK WHILE THE STATUS IS SET, because neither is a decision --
  // they are consequences of one. The decision is the status dropdown, which
  // stays live, and setting it back to Active unlocks and restores both.
  //
  // Former Specialty is not something a player should be able to revise: it
  // records what he WAS at the moment he gave it up, and editing it silently
  // rewrites his learn chances for every spell in the game.
  //
  // GREYED, NOT DISABLED, for the class field: a disabled input is not
  // submitted by some browsers and this one is read by val() everywhere.
  // readOnly keeps the value intact.
  const lockDown = (stNow === 'fallen' && !!fsVal);
  if (fsSel) {
    fsSel.disabled = lockDown;
    fsSel.style.opacity = lockDown ? '0.6' : '';
    fsSel.title = lockDown
      ? 'Locked \u2014 this records the school he gave up. Set Class Status back to Active to change it.'
      : 'The school this wizard abandoned. Used to work out his learn chances (PHBR4 p.20).';
  }
  if (clzEl) {
    const wasLocked = clzEl.readOnly;
    clzEl.readOnly = lockDown;
    clzEl.style.opacity = lockDown ? '0.6' : '';
    if (lockDown) {
      clzEl.title = 'Locked \u2014 PHBR4 p.20: a wizard who abandons his school "must remain a ' +
                    'mage for the duration of his career". Set Class Status back to Active to ' +
                    'restore ' + (fsVal.charAt(0).toUpperCase() + fsVal.slice(1)) + '.';
    } else if (wasLocked) {
      clzEl.title = '';
    }
  }

  if (!note) return;
  const status = (typeof getFallenStatus === 'function') ? getFallenStatus(root) : '';
  const NOTE = isSpecialist ? {
    graced: '',
    suspended: '',
    fallen: 'PHBR4 p.20: he keeps every spell he already knows and his spellbook is untouched. ' +
            'What stops is his specialist saving throw modifiers, his acquired powers, and any ' +
            'further bonus spells \u2014 he keeps the bonus spells he had before the change. His ' +
            'learn chances become: no bonus in his former school, still \u221215% in other schools, ' +
            'and half of (base \u2212 15) in the schools that used to oppose him. PERMANENT: he can ' +
            'never regain the school, and can only ever become a mage, never another specialist. ' +
            'THE SHEET DOES NOT CHANGE YOUR CLASS \u2014 edit it to Mage yourself when your DM says so.'
  } : {
    graced: isPriest
      ? 'RECORDED, NOT ENFORCED. This priest has renounced his faith, but his DM has left his powers intact \u2014 nothing on the sheet is withdrawn. PHBR3 p.122 sets out what would otherwise follow.'
      : 'RECORDED, NOT ENFORCED. This paladin has fallen, but his DM has left his abilities intact \u2014 nothing on the sheet is withdrawn. PHB Ch.3 sets out what would otherwise follow.',
    suspended: isPriest
      ? 'The god is withholding spells (PHBR3 pp.120\u2013121). A willful breach of the priesthood\u2019s weapon or armour restrictions costs 2d6 damage, every spell that day, and no spells for 1d6 days; purification and atonement restore them. Granted powers and turning are withdrawn here until you set the status back.'
      : 'PHB Ch.3: an evil act committed while enchanted or magically controlled suspends paladinhood until an atonement spell is cast. Saving throw bonus, turning and 9th-level spellcasting are withdrawn until you set the status back.',
    fallen: isPriest
      ? 'PHBR3 p.122: he loses all granted powers, and \u201che\u2019ll never again be a priest.\u201d By combat ability \u2014 GOOD: lose one experience level and become a fighter. MEDIUM: lose two. POOR: start over as a fighter under the dual-class rules. THE SHEET DOES NOT CHANGE YOUR CLASS OR LEVEL \u2014 edit them yourself when your DM says so.'
      : 'PHB Ch.3: a knowing, willing evil act ends paladinhood \u201cimmediately and irrevocably\u2026 He is ever after a fighter.\u201d He keeps none of the special benefits, INCLUDING the 9th-level spellcasting the book prints inside that list. THE SHEET DOES NOT CHANGE YOUR CLASS \u2014 edit it yourself when your DM says so.'
  };
  note.textContent = NOTE[status] || '';
  note.style.display = status ? '' : 'none';
}

// Builds the template list. Called at bind time AND again when the fetch lands,
// since a sheet opened on a cold load would otherwise show only DM-Created.
// Rebuilds from scratch rather than appending, so a second call cannot double
// the list.
function populatePriesthoodTemplates(root) {
  const sel = root.querySelector('[data-field="sp_template"]');
  if (!sel) return;
  const list = (typeof PRIESTHOOD_TEMPLATES !== 'undefined') ? PRIESTHOOD_TEMPLATES : [];
  sel.innerHTML = '<option value="">\u2014 apply a template \u2014</option>' +
                  '<option value="dm">DM-Created</option>' +
                  list.slice().sort((a, b) => (a.label || '').localeCompare(b.label || ''))
                      .map(p => '<option value="' + escapeHtml(p.key) + '">' +
                                escapeHtml(p.label) + '</option>').join('');
  sel.value = '';
}

// THE THIRTEEN FIELDS A TEMPLATE WRITES, paired with the key it reads. Spheres,
// granted powers, followers and the rest of the 36 are carried in the data but
// have no control to write into yet -- they are transcribed once and wired when
// their consumers exist, rather than re-read later.
const SP_TEMPLATE_FIELDS = [
  ['sp_prime_req2', 'primeReq2'], ['sp_hit_die', 'hitDie'],
  ['sp_crossover', 'crossover'], ['sp_language_slot', 'languageSlot'],
  ['sp_weapon_spec', 'weaponSpec'], ['sp_faith_type', 'faithType'],
  ['sp_combat', 'combat'],
  ['sp_restrict_armor', 'restrictArmor'], ['sp_restrict_weapons', 'restrictWeapons'],
  ['sp_restrict_clothing', 'restrictClothing'], ['sp_restrict_celibacy', 'restrictCelibacy'],
  ['sp_restrict_diet', 'restrictDiet'], ['sp_restrict_items', 'restrictItems'],
  ['sp_restrict_mutilation', 'restrictMutilation'], ['sp_restrictions', 'restrictions']
];

// Does any specialty priest field hold anything? Decides whether applying a
// template needs to ask first -- prompting on a blank sheet is noise.
function specialtyPriestHasContent(root) {
  return SP_TEMPLATE_FIELDS.some(([f]) => (val(root, f) || '').trim());
}

// Writes a template's values across every field, INCLUDING BLANKING the ones it
// leaves empty. Chris's ruling, and it is the right one: a template field left
// empty is a positive statement -- "this priesthood imposes no dietary
// restriction" -- so a stale value the player typed earlier would misrepresent
// the priesthood he just chose.
//
// Never touches patron_deity. That holds the god's NAME, not his attribute.
function applyPriesthoodTemplate(root, key) {
  if (key === 'dm') {
    SP_TEMPLATE_FIELDS.forEach(([f]) => val(root, f, ''));
    val(root, 'sp_template_source', 'DM-Created');
    return true;
  }
  const list = (typeof PRIESTHOOD_TEMPLATES !== 'undefined') ? PRIESTHOOD_TEMPLATES : [];
  const t = list.find(p => p.key === key);
  if (!t) return false;
  SP_TEMPLATE_FIELDS.forEach(([f, k]) => val(root, f, t[k] || ''));
  applyTemplateSpheres(root, t);
  val(root, 'sp_template_source', t.label || key);
  return true;
}

// Writes sphere access into the per-character map. THE BIGGEST CONVENIENCE HERE:
// a player otherwise sets twenty-odd of these by hand, one row at a time.
//
// CLEARS EVERY ROW FIRST, for the same reason a template blanks the text fields
// it leaves empty -- a sphere the previous template granted and this one does not
// would otherwise survive and misrepresent the priesthood just chosen.
//
// SILENT NO-OP IF THE ROWS DO NOT EXIST. They are built by renderSpellAccess on
// the Magic tab and only for priest characters, so a template applied before that
// has run finds nothing. Harmless: the caller re-renders immediately after, and
// the values are re-read from the DOM, not cached.
//
// "All" IS NEVER SET. It renders as static text with no select -- no deity grants
// it and it cannot be switched off (PHB Ch.3) -- so the data omits it entirely.
function applyTemplateSpheres(root, t) {
  const sels = root.querySelectorAll('.sphere-checkboxes select[data-sphere]');
  if (!sels.length) return;
  const want = {};
  (t.spheresMajor || []).forEach(s => { want[s.toLowerCase()] = 'major'; });
  (t.spheresMinor || []).forEach(s => { want[s.toLowerCase()] = 'minor'; });

  // ANNOUNCE ANY SPHERE NAME THAT MATCHES NO ROW. The match above is
  // case-insensitive on purpose -- getAllSpheres() derives its names from the
  // spell data, and that list, the saved record and the setting spheres have
  // disagreed on casing before -- but tolerance means a bad name does NOTHING
  // rather than failing loudly. That is how a template shipped with an
  // unexpanded "elemental" applied five of its eight spheres and looked like it
  // had worked.
  //
  // Cheap insurance with fifty-odd entries still to transcribe: a typo, a Tome
  // of Magic sphere that postdates PHBR3, or another unexpanded "Elemental"
  // announces itself on the first apply instead of hiding in the data.
  const known = {};
  sels.forEach(sel => { known[(sel.getAttribute('data-sphere') || '').toLowerCase()] = true; });
  const unmatched = Object.keys(want).filter(k => !known[k]);
  if (unmatched.length) {
    console.warn('Priesthood template "' + (t.key || '?') + '": no sphere row matches ' +
                 unmatched.join(', ') + '. Check core_PHBR3_priesthoods.json against ' +
                 'getAllSpheres() \u2014 note there is no bare "Elemental" row; it splits ' +
                 'into Elemental Air, Earth, Fire and Water.');
  }
  // Case-insensitive, because getAllSpheres() derives these names from the spell
  // data and the saved record, that list and the setting spheres have disagreed
  // on casing before.
  sels.forEach(sel => {
    const name = (sel.getAttribute('data-sphere') || '').toLowerCase();
    sel.value = want[name] || 'none';
  });
}

function renderSpecialtyPriest(root) {
  const block = root.querySelector('.specialty-priest');
  const note  = root.querySelector('.specialty-priest-note');
  if (!block && !note) return;

  const bandOn = (typeof isSupplementActive === 'function') &&
                 isSupplementActive('phbr3', 'specialtyPriests');
  const single = (val(root, 'char_type') || 'single').toLowerCase() === 'single';
  const isPriest = (typeof getClassCategory === 'function') &&
                   getClassCategory(val(root, 'clazz') || '') === 'priest';

  const show = bandOn && single && isPriest;
  if (block) block.style.display = show ? 'block'  : 'none';
  if (note)  note.style.display  = show ? 'inline' : 'none';
}

// Does this character have a PHBR3 override in force? Every consumer asks
// through here rather than reading the field, so the band check lives in one
// place -- unticking the book suspends the effect while the entry stays put.
// Returns '' when the override is off or inapplicable, so callers can treat the
// result as falsy without a second gate.
function getSpecialtyPriestOverride(root, field) {
  if (!root) return '';
  if (typeof isSupplementActive !== 'function') return '';
  if (!isSupplementActive('phbr3', 'specialtyPriests')) return '';
  if ((val(root, 'char_type') || 'single').toLowerCase() !== 'single') return '';
  if (typeof getClassCategory !== 'function') return '';
  if (getClassCategory(val(root, 'clazz') || '') !== 'priest') return '';
  return val(root, field) || '';
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
  
  // PHBR3 p.13. A priesthood may name a second prime requisite beside Wisdom,
  // and that brings a tier the PHB does not have: EITHER at 16 earns +5%, BOTH
  // earn +10%. Read through getSpecialtyPriestOverride so the band gate lives in
  // one place -- with PHBR3 off it returns '' and the PHB branch below runs
  // untouched.
  //
  // GUARDED TO A SOLE WISDOM PRIME REQUISITE. The druid already has two (Wis,
  // Cha) and the paladin, ranger and bard have their own sets; PHBR3 builds its
  // priesthoods on the CLERIC, so a second requisite only makes sense where
  // Wisdom stands alone. Anything else falls through to the PHB rule.
  const second = getSpecialtyPriestOverride(root, 'sp_prime_req2');
  if (second && info.abilities.length === 1 && info.abilities[0] === 'wis') {
    const wisOK = parseInt(val(root, 'wis') || 0, 10) >= 16;
    const secOK = parseInt(val(root, second) || 0, 10) >= 16;
    const pair  = 'Wisdom and ' + (ABILITY_LABELS[second] || second);
    if (wisOK && secOK) {
      xpBonusEl.value = "+10%";
      xpBonusEl.title = `${pair} are both 16+ (PHBR3 p.13)`;
    } else if (wisOK || secOK) {
      xpBonusEl.value = "+5%";
      xpBonusEl.title = `One of ${pair} is 16+ \u2014 both would earn +10% (PHBR3 p.13)`;
    } else {
      xpBonusEl.value = "0%";
      xpBonusEl.title = `${pair}: either at 16 earns +5%, both earn +10% (PHBR3 p.13)`;
    }
    return;
  }

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

  // Two PHBR2 rules ride on Table 38. Both live only when armorInfo.phbr2 is
  // set, which never happens for a bard -- see getThiefArmorAdjustments.
  //
  // THE DEXTERITY FORFEIT (Table 37, General Notes): "No dexterity bonuses
  // apply to thief functions (though penalties do) when wearing armor other
  // than simple leather." Beneficial-only, like dexForfeit in Ch.11: negatives
  // survive, positives drop. STUDDED AND PADDED ARE "OTHER" -- Table 37 has no
  // leather column because leather is the baseline, while Studded or Padded is
  // a named column at -30%, and footnote 4 uses the same phrase the same way.
  // NO ARMOUR keeps its bonus: Table 38's No Armor column is the best there is.
  const floor = armorInfo.phbr2
    ? ((typeof THIEF_SKILL_MIN_PHBR2 !== 'undefined') ? THIEF_SKILL_MIN_PHBR2 : 1) : 0;
  const forfeitDex = !!armorInfo.phbr2 &&
    armorInfo.key !== 'leather' && armorInfo.key !== 'none';
  const dexUse = forfeitDex ? dexAdj.map(v => (v < 0 ? v : 0)) : dexAdj;

  // THE 1% FLOOR "even when trying to pick pockets in full plate armor" exists
  // to stop ARMOUR reducing a real chance to nothing. It must never CREATE one.
  // A thief with 0% Read Languages cannot read them at all -- base index 7 is 0
  // at every level -- and a 1% would let a d100 roll of 01 succeed at something
  // impossible. So the floor applies only where the pre-armour chance was
  // already above zero.
    // PHBR2 Table 4, positioned by Table 5 (p.25), which fixes the order:
  //   base score -> racial -> Dexterity -> KIT -> total base skill,
  // and discretionary points are spent ON TOP of that total. So the kit
  // adjustment is a PRE-DISCRETIONARY term and sits with the other three, not
  // alongside armour.
  //
  // Table 5's own worked example ends with Read Languages at -5%, so THE TOTAL
  // MAY LEGITIMATELY BE NEGATIVE and must not be clamped here. The only floor
  // is the PHBR2 1% one below, which applies after armour and only where the
  // pre-armour chance was already above zero.
  const kitMods = (typeof getKitSkillMods === 'function') ? getKitSkillMods(root) : null;
  const kitAdj  = kitMods ? kitMods.adj : [0,0,0,0,0,0,0,0];

  const skillVal = (i, points, useDex) => {
    const preArmor = baseSkills[i] + racialAdj[i] + (useDex ? dexUse[i] : 0) + kitAdj[i] + points;
    const lo = (floor && preArmor > 0) ? floor : 0;
    return Math.max(lo, Math.min(cap, preArmor + armorAdj[i]));
  };

  const pickpockets  = skillVal(0, pointsPP, true);
  const openlocks    = isBard ? '' : skillVal(1, pointsOL, true);
  const traps        = isBard ? '' : skillVal(2, pointsTR, true);
  const movesilently = isBard ? '' : skillVal(3, pointsMS, true);
  const hide         = isBard ? '' : skillVal(4, pointsHI, true);
  const detectnoise  = skillVal(5, pointsDN, false);
  const climb        = skillVal(6, pointsCW, false);
  const readlang     = skillVal(7, pointsRL, false);
  
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
        // EVERY TERM IN THE SUM IS NAMED HERE, in Table 5's order: base, race,
    // Dexterity, KIT, then armour and points. A breakdown that does not add up
    // to the number displayed is worse than no breakdown at all.
    const parts = ['Base: ' + baseSkills[i], 'Race: ' + sgn(racialAdj[i])];
    // dexUse, NOT dexAdj: under PHBR2 the Dexterity BONUS is forfeited in armour
    // heavier than simple leather. This line predated that rule and would have
    // reported a bonus the calculation had already dropped.
    if (i < 5) parts.push('DEX: ' + sgn(dexUse[i]) + (forfeitDex ? ' (bonus forfeited in this armor)' : ''));
    if (kitAdj[i] !== 0) parts.push('Kit (' + (kitMods ? kitMods.name : 'kit') + '): ' + sgn(kitAdj[i]));
    if (armorAdj[i] !== 0) parts.push('Armor (' + armorInfo.name + '): ' + sgn(armorAdj[i]));
    parts.push('Points: +' + skillPoints[i]);
    const total = baseSkills[i] + racialAdj[i] + (i < 5 ? dexUse[i] : 0) +
                  kitAdj[i] + armorAdj[i] + skillPoints[i];
    if (total > THIEF_SKILL_MAX) parts.push('capped at ' + THIEF_SKILL_MAX + '%');
    if (floor && total < floor && (total - armorAdj[i]) > 0) {
      parts.push('floored at ' + floor + '% (PHBR2)');
    }
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
            let html = '<strong>Armor: ' + escapeHtml(armorInfo.name) + '</strong> ' +
                 (armorInfo.phbr2 ? '(PHBR2 Table 38)' : '(PHB Table 29)');
      if (shown.length) html += '<div style="margin-top:4px;">' + shown.join(' &middot; ') + '</div>';
      if (armorInfo.key === 'chain') {
        html += '<div style="margin-top:4px;">Includes the additional \u22125% bards suffer in non-elven chain mail.</div>';
      }
      // Stated outright because it is INVISIBLE in the percentages above: the
      // forfeit removes a bonus rather than adding a penalty, so nothing in the
      // breakdown accounts for it and a player would see his Dexterity silently
      // stop counting.
      //
      // AND NAME THE FIGURES, not just the rule. A Dex 18 thief putting on
      // silenced elfin chain watches Pick Pockets fall 15 while the armor line
      // moves 5, and until this itemised the other 10 there was nothing on
      // screen that accounted for it -- the answer lived only in the field's
      // hover tooltip. dexAdj is the raw Table 28 row and dexUse is what
      // survived the forfeit, so their difference IS the amount lost.
      // Dexterity reaches the first five skills only.
      if (forfeitDex) {
        const lost = dexAdj
          .map((v, i) => (v > 0 && i < 5 && !(isBard && i >= 1 && i <= 4))
            ? labels[i] + ' ' + sgn(dexUse[i] - v) + '%' : null)
          .filter(Boolean);
        html += '<div style="margin-top:4px;">No Dexterity bonus applies to thief skills in armor ' +
                'other than simple leather (Table 37, General Notes). Penalties still apply.' +
                (lost.length
                  ? '<div style="margin-top:2px;">Dexterity bonus forfeited: ' +
                    lost.join(' &middot; ') + '</div>'
                  : '<div style="margin-top:2px;">Your Dexterity grants no bonus to these ' +
                    'skills, so this costs you nothing.</div>') +
                '</div>';
      }
      if (armorInfo.illegal) {
        // Says only what is now true. The old text also claimed "Table 29 does
        // not cover it", fusing class legality with table coverage -- the very
        // conflation getThiefArmorCategory was just fixed to separate. It was
        // already wrong for a thief in chain mail (covered by the table, but
        // forbidden to him), and PHBR2's Table 38 covers every type there is.
        html += '<div style="margin-top:6px;color:var(--warning, #e0a34a);">Your class may not wear this armor ' +
                '(PHB Ch.3). The worst column is applied \u2014 check with your DM.</div>';
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
      } else if (s.armorKey === 'elven_chain' || s.armorKey === 'silenced_elven') {
        // Both chains, and for the same reason -- silenced elfin chain is elfin
        // chain with each link wrapped, so it is if anything quieter still. Left
        // as one branch rather than two: the exemption argument is identical and
        // a second copy would be a second thing to keep true.
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

  if (typeof populateKitVariantDropdown === 'function') populateKitVariantDropdown(root);
}

// The kit object currently selected, or null. Both the variant dropdown and
// renderKitAbilities need it, and resolving it twice from the same three fields
// is how two renderers start disagreeing about which kit is selected.
function getSelectedKit(root) {
  const clazz    = (val(root, "clazz") || "").trim().toLowerCase();
  const kitValue = (val(root, "kit") || "").trim();
  if (!clazz || !kitValue || typeof getKitsForClass !== 'function') return null;
  return getKitsForClass(clazz)
    .find(k => k.name.toLowerCase().replace(/\s+/g, '') === kitValue) || null;
}

// PHBR1. A few kits are ONE kit in the book that BRANCHES -- Pirate/Outlaw on
// orientation, the Amazon on race -- so the column appears only when the
// selected kit carries a `variants` block, and vanishes otherwise.
//
// `default: null` means the choice is MANDATORY and the character is incomplete
// until it is made (Pirate/Outlaw: neither orientation is the fallback). A
// non-null default means the axis is refinement and ignoring it still yields a
// correct character (Amazon: human).
function populateKitVariantDropdown(root) {
  const col = root.querySelector('.kit-variant-col');
  const sel = root.querySelector('[data-field="kit_variant"]');
  if (!col || !sel) return;

  const kit = getSelectedKit(root);
  const v   = kit && kit.variants;
  if (!v || !Array.isArray(v.options) || !v.options.length) {
    col.style.display = 'none';
    sel.innerHTML = '';
    return;
  }

  col.style.display = '';
  const label = col.querySelector('.kit-variant-label');
  if (label) {
    label.textContent = v.axis
      ? v.axis.charAt(0).toUpperCase() + v.axis.slice(1)
      : 'Variant';
  }
  sel.title = v.axisPrinted || '';

  const current = sel.value;
  sel.innerHTML = (v.default === null || v.default === undefined)
    ? '<option value="">\u2014 choose \u2014</option>'
    : '';
  v.options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.key;
    opt.textContent = o.label || o.key;
    if (o.note) opt.title = o.note;
    sel.appendChild(opt);
  });

  const has = k => Array.from(sel.options).some(o => o.value === k);

  // Restore, then fall back through: the character's stored choice, then the
  // RACE if that is what the axis is about, then the book's default.
  //
  // Race only PRESELECTS -- it never locks. A DM may perfectly well allow a
  // human raised among dwarven Amazons, and the same reasoning that makes the
  // Fallen Paladin's alignment a prompt rather than a gate applies here.
  // The pending value from loadSheet wins, and is consumed once -- it exists
  // only because the select had no options when the character was loaded. After
  // that the field itself is the source of truth, so a later kit change is not
  // overridden by a stale load-time value.
  let stored = val(root, 'kit_variant') || current;
  if (root._pendingKitVariant) {
    stored = root._pendingKitVariant;
    root._pendingKitVariant = '';
  }
  const race   = (val(root, 'race') || '').trim().toLowerCase();
  if (stored && has(stored))                                sel.value = stored;
  else if (v.axis === 'race' && has(race))                  sel.value = race;
  else if (v.default && has(v.default))                     sel.value = v.default;
  else                                                      sel.value = sel.options[0].value;
}

// Seeds the kit's benefits and hindrances into the player's own Special Powers
// and Special Hindrances fields. THE SAME TEXT the reference disclosure shows,
// deliberately -- that makes the disclosure a true immutable copy of what was
// put in the field, and makes the comparison below a plain equality test.
//
// THESE ARE PLAYER-OWNED FIELDS, so the rule is: never overwrite writing that
// is not ours. We know what we last seeded, so we can tell the two apart --
// the same reasoning as _declinedGrants, which exists because the sheet cannot
// otherwise distinguish a deliberate deletion from an absence.
//
//   empty            -> seed it
//   equals our seed  -> untouched, so a kit change may replace it
//   anything else    -> the player's, and left alone permanently
//
// A player who edits the field keeps his text through later kit changes. That
// is intended: his writing outranks our convenience, and the disclosure still
// shows the new kit's reference so nothing is hidden from him.
function seedKitNotes(root) {
  if (!root._seededNotes || typeof root._seededNotes !== 'object') {
    root._seededNotes = { powers: '', hindrances: '' };
  }
  const kit = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;
  const want = {
    powers:     (kit && kit.benefits)   ? String(kit.benefits)   : '',
    hindrances: (kit && kit.hindrances) ? String(kit.hindrances) : ''
  };

  [['powers', 'notes_powers'], ['hindrances', 'notes_hindrances']].forEach(pair => {
    const key = pair[0], field = pair[1];
    const el  = root.querySelector('[data-field="' + field + '"]');
    if (!el) return;

    // NEVER WRITE INTO A FIELD BEING TYPED IN. recalculateAll runs on input
    // events, so without this a render mid-sentence would replace the caret's
    // line. Skipping is safe -- the next render after blur will catch up.
    if (document.activeElement === el) return;

    const cur  = el.value || '';
    const seed = root._seededNotes[key] || '';
    if (cur !== '' && cur !== seed) return;      // the player's writing; hands off
    if (cur === want[key]) { root._seededNotes[key] = want[key]; return; }

    el.value = want[key];
    root._seededNotes[key] = want[key];
    // Only ever reached when the text actually changed, so this cannot mark a
    // freshly loaded sheet dirty for no reason.
    if (typeof markUnsaved === 'function') {
      markUnsaved(document.querySelector('.tab.active'), true, root);
    }
  });
}

// PHBR4 p.40's three Militant Wizard mage limitations. THREE BANNERS, NOT ONE,
// because the three effects surface in three different places on the sheet and a
// banner belongs at the top of the section it explains -- Chris's call.
//
// THE PICKER IS THE SOURCE OF TRUTH FOR THE THIRD ONE. Barred schools are
// unticked AND disabled in Spell Access, so the only way back is the picker.
// UNTICKING IS WHAT ACTUALLY ENFORCES IT: renderSpellBrowser reads :checked, so
// a disabled-but-still-ticked box would go on granting access.
//
// SCHOOLS THE PLAYER UNTICKED HIMSELF ARE NEVER RE-TICKED. This only ever turns
// boxes OFF, and only ever releases ones it had locked, so his own choices
// survive a change of limitation untouched -- the same rule as the kit notes
// seeding.
function renderMilitantWizardLimits(root) {
  const lim    = (typeof getMageLimitation === 'function') ? getMageLimitation(root) : '';
  const barred = (typeof getMageBarredSchools === 'function') ? getMageBarredSchools(root) : [];
  const kit    = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;
  const kitName = (kit && kit.name) || 'kit';

  const limCol = root.querySelector('.mw-limitation-col');
  const barCol = root.querySelector('.mw-barred-row');
  const offers = !!(kit && kit.mageLimitations) &&
                 !((typeof getSpecialistSchool === 'function') &&
                   getSpecialistSchool(val(root, 'clazz') || ''));
  if (limCol) limCol.style.display = offers ? '' : 'none';
  if (barCol) barCol.style.display = (offers && lim === 'fiveSchools') ? '' : 'none';

  const show = (sel, html) => {
    const el = root.querySelector(sel);
    if (!el) return;
    el.innerHTML = html || '';
    el.style.display = html ? '' : 'none';
  };

  show('.mw-int-banner', lim === 'intMinusTwo'
    ? '<strong>' + escapeHtml(kitName) + ' limitation (PHBR4 p.40):</strong> he learns spells ' +
      'as if his Intelligence were <strong>two points lower</strong>. Every figure in this ' +
      'section is read from Table 4, so all of them shift \u2014 additional languages, chance to ' +
      'learn, maximum spells per level, spell immunity, and the highest level he can cast. ' +
      'His experience bonus for a high prime requisite is <em>not</em> affected.'
    : '');

  show('.mw-highlevel-banner', lim === 'noHighLevel'
    ? '<strong>' + escapeHtml(kitName) + ' limitation (PHBR4 p.40):</strong> forbidden to learn ' +
      '<strong>8th- and 9th-level spells from any school</strong>. His maximum spell level is ' +
      'capped at 7th however high his level and Intelligence go.'
    : '');

  const named = barred.length ? barred.map(escapeHtml).join(', ') : 'none chosen yet';
  show('.mw-barred-banner', lim === 'fiveSchools'
    ? '<strong>' + escapeHtml(kitName) + ' limitation (PHBR4 p.40):</strong> he may learn from ' +
      'only five schools. Your DM rolls 1d8 three times, rerolling duplicates, to decide which ' +
      'three are closed to him \u2014 currently <strong>' + named + '</strong>. Those schools are ' +
      'switched off and locked below. To change them, edit <em>Schools Barred</em> beside the ' +
      'Kit field; they cannot be re-enabled here.' +
      (barred.some(b => String(b).trim().toLowerCase() === 'greater divination')
        ? ' <em>Greater divination has no checkbox of its own \u2014 it means divination of 5th ' +
          'level and above, so the Divination box stays ticked and only the higher-level ' +
          'spells are refused.</em>'
        : '')
    : '');

  const boxes = root.querySelectorAll('.school-checkboxes input[type="checkbox"]');
  const nz = s => String(s || '').trim().toLowerCase();
  let changed = false;
  boxes.forEach(cb => {
    const school = cb.getAttribute('data-school') || '';
    const isBarred = (lim === 'fiveSchools') && barred.some(b => nz(b) === nz(school));
    if (isBarred) {
      if (cb.checked) { cb.checked = false; changed = true; }
      cb.disabled = true;
      if (cb.parentElement) cb.parentElement.style.opacity = '0.5';
      cb.title = 'Closed by the ' + kitName + ' limitation (PHBR4 p.40). Change it beside the Kit field.';
    } else if (cb.disabled) {
      // Releases only a box THIS function locked, and leaves it UNTICKED --
      // re-ticking would hand back access the player may never have had.
      cb.disabled = false;
      if (cb.parentElement) cb.parentElement.style.opacity = '';
      cb.title = '';
    }
  });
  if (changed && typeof renderSpellBrowser === 'function') renderSpellBrowser(root);
}

// The creation-time half of the kit's data: starting money, required equipment,
// secondary skills, school preferences, what abandoning costs. Consulted once
// and then noise, so it lives collapsed rather than on the sheet.
//
// FULLY DATA-DRIVEN. getKitDetailBlocks works from an EXCLUDE list, so a field
// added to any future kit appears here on its own with a humanised label -- no
// edit to this function. Promoting one to an ability card is a single entry in
// KIT_CARD_FIELDS.
//
// Hidden entirely when a kit carries nothing, and when no kit is selected. That
// second case is why this is called ABOVE renderKitAbilities' early return:
// clearing the kit is precisely when the disclosure must be emptied.
// Everything PHBR4 pp.90-94 lets us work out for one project. PURE -- takes a
// stored project and the character, returns numbers. No DOM, so the printed
// sheet and the panel cannot disagree.
//
// INTELLIGENCE IS THE RAW SCORE. The formula reads "10% base + Intelligence +
// experience level", using the ability score itself as a percentage addend --
// not a Table 4 lookup. PHBR4 p.40's intMinusTwo limitation names four Table 4
// columns and research is not among them, so getEffectiveIntForSpellTable is
// deliberately NOT used here.
function computeResearchProject(root, proj) {
  const lvl   = Math.max(1, Math.min(9, parseInt(proj.level, 10) || 1));
  const isNew = (proj.kind || 'new') !== 'existing';
  const intScore  = parseInt(val(root, 'int') || 0, 10) || 0;
  const charLevel = parseInt(val(root, 'level') || 0, 10) || 0;

  // Table 15, p.91. The library a wizard must have ACCESS to, not own.
  const LIB = [0, 2000, 4000, 8000, 14000, 22000, 32000, 44000, 58000, 74000];
  const libNeeded = LIB[lvl] || 0;

  const weekly     = parseInt(proj.weeklyCost || 0, 10) || 0;
  const weeks      = parseInt(proj.weeksElapsed || 0, 10) || 0;
  const libStart   = parseInt(proj.libraryStart || 0, 10) || 0;
  // "Half of the operational cost goes toward new books, so the value of the
  // library increases." The one figure nobody tracks by hand.
  const libNow     = libStart + Math.floor(weekly / 2) * weeks;
  const libShort   = Math.max(0, libNeeded - libNow);

  const prepWeeks  = lvl + 1;              // "spell level plus one weeks"
  const minWeeks   = lvl * 2;              // "two weeks per level of the spell"
  const totalWeeks = prepWeeks + minWeeks;

  const base   = (isNew ? 10 : 30) + intScore + charLevel - (lvl * 2);
  const cap    = isNew ? 50 : 70;
  const extra  = parseInt(proj.extraThisWeek || 0, 10) || 0;
  // "+10% per additional 2,000 gp, to a maximum of 8,000 gp."
  const bought = Math.min(40, Math.floor(extra / 2000) * 10);
  // AMBIGUOUS IN THE BOOK and read the narrow way: money raises the chance
  // TOWARD the cap and never past it, but a base already above the cap is not
  // pulled down -- the cap is on what spending can buy, not on the wizard.
  const chance = base >= cap ? base : Math.min(cap, base + bought);

  return {
    lvl: lvl, isNew: isNew, libNeeded: libNeeded, libNow: libNow, libShort: libShort,
    prepWeeks: prepWeeks, minWeeks: minWeeks, totalWeeks: totalWeeks,
    base: base, bought: bought, cap: cap, chance: chance,
    intScore: intScore, charLevel: charLevel, weekly: weekly, weeks: weeks,
    // p.94: some DMs require a roll even at 100%, with 95+ always a failure.
    autoSuccess: chance >= 100,
    spent: parseInt(proj.goldSpent || 0, 10) || 0,
    labCost: parseInt(proj.labCost || 0, 10) || 0
  };
}

// OWNS THE DISPLAY DECISION for the Tools sub-tab, which reads this section's
// style.display rather than re-deriving the gate.
function renderSpellResearch(root) {
  const sec = root.querySelector('.spell-research-section');
  if (!sec) return;
  const allowed = (typeof canResearchSpells === 'function') && canResearchSpells(root);
  sec.style.display = allowed ? '' : 'none';
  if (!allowed) return;

  // BOUND TO THE SECTION, ONCE, and not in bindSheet. The section is hidden
  // until the class allows research, so a sheet that loads as a Fighter and is
  // later changed to Mage would never have had its button wired. Same fault the
  // organizations block documents: wiring belongs to the section, which always
  // exists; the contents come and go.
  if (!sec._researchBound) {
    sec._researchBound = true;
    const add = sec.querySelector('.add-research-project');
    if (add) add.onclick = () => addResearchProject(root);
  }

  const list  = root.querySelector('.research-projects-list');
  const empty = root.querySelector('.research-empty');
  const empty = root.querySelector('.research-empty');
  const n = list ? list.querySelectorAll('.research-project').length : 0;
  if (empty) empty.style.display = n ? 'none' : '';
}

function renderKitReference(root) {
  const wrap = root.querySelector('.kit-reference');
  const body = root.querySelector('.kit-reference-body');
  if (!wrap || !body) return;

  const kit    = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;
  const blocks = (kit && typeof getKitDetailBlocks === 'function')
    ? getKitDetailBlocks(kit).reference : [];

  if (!blocks.length) {
    body.innerHTML = '';
    wrap.style.display = 'none';
    wrap.open = false;
    return;
  }

  // escapeHtml, not raw interpolation -- this is transcribed book prose and
  // carries quotes, ampersands and the occasional angle bracket.
  const esc = (typeof escapeHtml === 'function') ? escapeHtml : (x => x);
  body.innerHTML = blocks.map(b =>
    '<div style="margin-bottom:8px;">' +
      '<strong>' + esc(b.label) + ':</strong> ' + esc(b.text) +
    '</div>').join('');

  // The summary carries the kit name so a collapsed row still says whose rules
  // these are -- there is no other label on the element.
  const summary = wrap.querySelector('summary');
  if (summary) summary.textContent = 'About this kit: ' + (kit.name || '');

  wrap.style.display = '';
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

  // Kit-granted proficiencies are part of what the kit IS, so they sync wherever
  // the kit's abilities render. ABOVE the early return below, deliberately:
  // clearing the kit leaves `abilities` null, and that is exactly the case where
  // grants must be REMOVED. Placed after it, the un-grant never ran and a
  // Standard Class character kept showing GRANTED rows until a save and reload.
  if (typeof syncKitGrantedNWPs === 'function') syncKitGrantedNWPs(root);
  if (typeof renderKitAdvisories === 'function') renderKitAdvisories(root);
  if (typeof renderNWProficiencies === 'function') renderNWProficiencies(root);
	
  // The reference disclosure syncs wherever the kit's abilities render, for the
  // same reason the proficiency grants do -- ABOVE the early return, because
  // clearing the kit is exactly when it must be emptied and hidden.
  if (typeof renderKitReference === 'function') renderKitReference(root);
  // Same placement and the same reason: clearing the kit must clear the
  // limitation banners and release any schools it had locked.
  if (typeof renderMilitantWizardLimits === 'function') renderMilitantWizardLimits(root);

  // Same placement, same reason: clearing the kit must clear an unedited seed
  // rather than leaving the old kit's benefits sitting under no kit at all.
  if (typeof seedKitNotes === 'function') seedKitNotes(root);

  // DERIVED CARDS: benefits, hindrances, reaction and taboos. Fields the kit
  // carries that no other renderer consumes, and that assert a persistent fact
  // about the character rather than asking anything of him -- so cards, not
  // banners, per the test in renderKitAdvisories.
  const detailKit   = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;
  const detailCards = (detailKit && typeof getKitDetailBlocks === 'function')
    ? getKitDetailBlocks(detailKit).cards : [];

  // CHECKED AGAINST detailCards TOO, not just `abilities`. A kit can carry
  // hindrances and no abilities at all, and the old early return would have
  // dropped its cards on the floor.
  if (!abilities && !detailCards.length) return;

  // A NEW object per node -- never the kit's own ability object, which is
  // shared across every character on screen.
  (abilities || []).forEach(ability => {
    const node = makeAbilityNode({
      name:   ability.name,
      notes:  ability.notes,
      isAuto: true
    }, () => markUnsaved(document.querySelector('.tab.active'), true, root));
    kitAbilitiesList.appendChild(node);
  });

  detailCards.forEach(card => {
    const node = makeAbilityNode({
      name:   card.name,
      notes:  card.notes,
      isAuto: true
    }, () => markUnsaved(document.querySelector('.tab.active'), true, root));
    kitAbilitiesList.appendChild(node);
  });

  // THE VARIANT CARD. Without this the orientation dropdown is inert -- the
  // choice changes proficiency data that has no consumer yet, so a player would
  // pick Pirate or Outlaw and watch nothing happen.
  //
  // An unmade MANDATORY choice (default: null) gets a card too. Pirate/Outlaw
  // shares one Description and one Role but branches its weapons, bonus
  // proficiencies and secondary skill, so a character with no orientation is
  // not half-built -- he is un-built, and silence would hide that.
  // PREPENDED, not appended -- the branching choice is what defines the
  // character, so it reads first rather than after four cards that are true of
  // both branches. `insertBefore(..., firstChild)` rather than a second loop,
  // because the shared cards were just appended above.
  const addVariantCard = node => kitAbilitiesList.insertBefore(node, kitAbilitiesList.firstChild);

  const kit = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;
  const v   = kit && kit.variants;
  if (v && Array.isArray(v.options) && v.options.length) {
    const chosen = (val(root, 'kit_variant') || '').trim();
    const opt    = v.options.find(o => o.key === chosen);
    const axis   = v.axis || 'variant';

    if (opt) {
      const bits = [];
      if (opt.note) bits.push(opt.note);
      const p = opt.proficiencies || {};
      ['weapon', 'nonweapon'].forEach(sec => {
        const d = p[sec];
        if (!d) return;
        const parts = [];
        ['bonus', 'required', 'recommended', 'allowed', 'barred'].forEach(f => {
          if (Array.isArray(d[f]) && d[f].length) {
            parts.push(f.charAt(0).toUpperCase() + f.slice(1) + ': ' + d[f].join(', '));
          }
        });
        if (d.allowedPrinted) parts.push(d.allowedPrinted);
        if (parts.length) {
          bits.push((sec === 'weapon' ? 'Weapon proficiencies. ' : 'Nonweapon proficiencies. ')
                    + parts.join('. ') + '.');
        }
      });
      addVariantCard(makeAbilityNode({
        name:   (opt.label || opt.key) + ' (' + axis + ')',
        notes:  bits.join(' '),
        isAuto: true
      }, () => markUnsaved(document.querySelector('.tab.active'), true, root)));
    }
    // The unmade-choice prompt used to live here as an ability card. It is now
    // the kit advisory banner above the nonweapon proficiency list: a card
    // asserts what the character HAS, and this asserted what he has not. The
    // card for a CHOSEN variant stays, because that one is a genuine ability.
  }
}

// Every kit advisory, in one banner above the nonweapon proficiency list.
//
// A BANNER, NOT AN ABILITY CARD. A card asserts a fact about the character; a
// banner asks something of the player. The "Choose an orientation" card was
// formatted identically to the abilities beside it and sat in a list of things
// the character HAS, while saying he does not have them.
//
// Each entry must be CLEARABLE by the player -- the test from the project notes
// for whether a persistent advisory is legitimate. An unmade choice clears when
// it is made; a required proficiency clears when it is bought. A recommended
// list would never clear, which is why recommendations are marked at the point
// of choice instead and are not here.
function renderKitAdvisories(root) {
  const el    = root.querySelector('.kit-advisory-note');
  const elWpn = root.querySelector('.kit-advisory-note-wpn');
  if (!el && !elWpn) return;

  // nz, not norm. The previous version called a `norm` that is not declared in
  // this function and is not global -- it threw partway through, AFTER the items
  // were built but BEFORE the banner was written, so the banner silently kept
  // its previous contents and looked merely stale rather than broken.
  const nz = s => String(s || '').trim().toLowerCase();

  const items    = [];
  const itemsWpn = [];
  const kit   = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;

  // 1. An unmade MANDATORY variant choice. Moved off the Abilities tab, but it
  //    is resolved on the CORE tab, so the banner has to say where to go.
  const v = kit && kit.variants;
  if (v && Array.isArray(v.options) && v.options.length) {
    const chosen = (val(root, 'kit_variant') || '').trim();
    const known  = v.options.some(o => o.key === chosen);
    if (!known && (v.default === null || v.default === undefined)) {
      items.push('Choose ' + (v.axis === 'orientation' ? 'an' : 'a') + ' ' +
                 (v.axis || 'variant') + ' for this kit on the Core tab: ' +
                 v.options.map(o => o.label || o.key).join(' or ') +
                 '. They differ in required weapons, bonus proficiencies and ' +
                 'secondary skill, and neither is the default \u2014 until you ' +
                 'choose, this kit grants nothing.');
    }
  }

  // 2. Unmade bonus CHOICES. "Bonus: Hunting or Fishing" is ONE free
  //    proficiency, not two, so nothing can be granted automatically. Adding
  //    either from the browser satisfies it and the sync marks it GRANTED.
  const prof   = (typeof getKitProficiencies === 'function') ? getKitProficiencies(root) : null;
  const nwp    = (prof && prof.nonweapon) || {};
  const owned  = (root._nwps || []).map(n => String(n && n.name || '').trim().toLowerCase());
  const has    = n => owned.indexOf(String(n).trim().toLowerCase()) !== -1;

  (nwp.bonusChoice || []).forEach(group => {
    if (group.some(has)) return;
    items.push('Bonus proficiency, choose one: <b>' + group.join('</b> or <b>') +
               '</b>. Add it below and it becomes free.');
  });

  // 2a. DECLINED GRANTS. A player may delete a proficiency his kit gives him --
  //     PHBR1 p.37 tells DMs to modify kits -- and that decision now persists.
  //     Say so: a granted proficiency silently absent from the list below is
  //     indistinguishable from a bug, and this is the only advisory that
  //     reports something the player has taken away rather than not yet bought.
  //
  //     UNCONDITIONAL BONUSES ONLY. A declined bonusChoice pick must NEVER
  //     appear here: deleting one is how you SWITCH, and the choose-one line
  //     above correctly reappears at that same moment. Two banner lines for one
  //     deliberate act, one of them telling him to undo it, is worse than none.
  const declined = Array.isArray(root._declinedGrants) ? root._declinedGrants : [];
  (nwp.bonus || [])
    .filter(n => !has(n) && declined.some(d => nz(d) === nz(n)))
    .forEach(n => {
      items.push('<b>' + n + '</b> is granted free by this kit and you have ' +
                 'removed it. Add it back below to restore it, or leave it as it is.');
    });

  // 3. REQUIRED proficiencies not yet bought. The kit forces a slot onto these,
  //    so they are the player's to buy -- never auto-added, unlike bonuses.
  (nwp.required || []).filter(n => !has(n)).forEach(n => {
    items.push('<b>' + n + '</b> is required by this kit. Add it below; it costs ' +
               'a slot like any other proficiency.');
  });

  // 4. REQUIRED WEAPONS. Six kits have them and NONE has bonus weapons, so this
  //    side is advisory only -- nothing is ever granted free. Matched through
  //    samePHBR1Proficiency so a Stalker who bought Knife is not told to go and
  //    buy Stiletto: they are one proficiency with two names.
  const wpn   = (prof && prof.weapon) || {};
  const wOwn  = (root._weaponProfs || []).map(w => String(w && w.name || ''));
  const hasW  = n => wOwn.some(o =>
    nz(o) === nz(n) ||
    (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(o, n)));

  (wpn.required || []).filter(n => !hasW(n)).forEach(n => {
    itemsWpn.push('<b>' + n + '</b> is a required weapon PROFICIENCY for this kit \u2014 ' +
               'add it under Weapon Proficiencies above. Owning the weapon is not ' +
               'the same thing; an Amazon carrying a spear she is not trained with ' +
               'still fights at the non-proficiency penalty.');
  });

  // A required CHOICE -- "Lance (any; player choice)", "Belaying Pin or
  // Gaff/Hook". Satisfied by any one of the group, so it clears as soon as the
  // player owns one.
  (wpn.requiredChoice || []).forEach(group => {
    if (group.some(hasW)) return;
    itemsWpn.push('Required weapon proficiency, choose one: <b>' +
               group.join('</b> or <b>') + '</b> \u2014 add it under Weapon ' +
               'Proficiencies above.');
  });

  (wpn.requiredChoiceGroups || []).forEach(g => {
    const inGroup = (root._weaponProfs || []).some(w =>
      w && nz(w.group) === nz(g));
    if (inGroup) return;
    itemsWpn.push('This kit requires a weapon proficiency from the <b>' + g +
               '</b> group, your choice of which \u2014 add it under Weapon ' +
               'Proficiencies above.');
  });

  const paint = (node, list) => {
    if (!node) return;
    if (!list.length) { node.style.display = 'none'; node.innerHTML = ''; return; }
    node.innerHTML =
      '<strong style="color:var(--warning, #e0a34a);">\u26A0 Kit</strong>' +
      list.map(t => '<div style="margin-top:4px;">\u2022 ' + t + '</div>').join('') +
      '<div style="margin-top:6px;color:var(--muted);font-size:11px;">' +
        'Advisory only \u2014 nothing is blocked. A DM may modify any kit; PHBR1 p.37 ' +
        'says outright that he can and should.</div>';
    node.style.display = '';
  };
  paint(el,    items);
  paint(elWpn, itemsWpn);
}

// Bring the character's nonweapon proficiency list into line with what his kit
// GRANTS. Called whenever the kit, the variant or the class changes.
//
// AUTO-MANAGED RECORDS, the same contract as the kit ability cards: anything
// this function added, it may remove. A record is marked isKitGranted and is
// swept on every run, so switching kits never leaves a previous kit's free
// proficiencies behind.
//
// THREE CASES, and the middle one is the reason this cannot be a simple add:
//
//   not present            -> add it, granted, 0 slots
//   present and granted    -> leave it; it is ours and still correct
//   present and NOT granted -> the player bought it himself before taking the
//                             kit. Do NOT add a duplicate and do NOT silently
//                             seize his record: mark it granted so he stops
//                             being charged, and remember that he owned it, so
//                             that abandoning the kit hands it back rather than
//                             deleting a proficiency he paid for.
//
// PHBR11 p.77 and PHBR1 p.37 both say bonus proficiencies are NOT lost when a
// kit is abandoned -- "the character doesn't lose those, but he must pay for
// them from the next free slots he has available". Removing a granted record
// outright would break that rule, so a record the player owned first is only
// ever un-granted, never deleted.
function syncKitGrantedNWPs(root) {
  if (!root._nwps) root._nwps = [];
  const list = root._nwps;

  const prof = (typeof getKitProficiencies === 'function') ? getKitProficiencies(root) : null;
  const want = (prof && prof.nonweapon && Array.isArray(prof.nonweapon.bonus))
    ? prof.nonweapon.bonus.slice() : [];

  const norm = s => String(s || '').trim().toLowerCase();

  // bonusChoice is a CHOICE, and the app must never make it -- "Bonus: Hunting
  // or Fishing" is one free proficiency, not two, and the pick is permanent.
  // So nothing is granted until the player adds one of the named proficiencies
  // himself; then it becomes free, via the same adoption path as a bonus he
  // happened to already own.
  //
  // FIRST LISTED wins if he owns several. Deterministic, and it never silently
  // swaps which one is free when he later buys the other -- a player who owns
  // both Hunting and Fishing gets Hunting free today and tomorrow.
  const ownedNames = (list || []).map(n => norm(n && n.name));
  ((prof && prof.nonweapon && prof.nonweapon.bonusChoice) || []).forEach(group => {
    const picked = group.find(g => ownedNames.indexOf(norm(g)) !== -1);
    if (picked) want.push(picked);
  });

  const wanted = new Set(want.map(norm));

  // Sweep: drop records WE created that are no longer wanted; hand back records
  // the player owned first.
  for (let i = list.length - 1; i >= 0; i--) {
    const n = list[i];
    if (!n || !n.isKitGranted) continue;
    if (wanted.has(norm(n.name))) continue;
    if (n.wasPlayerOwned) {
      delete n.isKitGranted;
      delete n.wasPlayerOwned;
    } else {
      list.splice(i, 1);
    }
  }

  // DECLINED GRANTS. A player may delete a proficiency his kit gives him -- PHBR1
  // p.37 tells DMs to modify kits, and this tool warns rather than blocks. Before
  // this list existed the sync simply put it back, at the bottom of the list,
  // undoing the deletion in front of him.
  //
  // Keyed by NAME and persisted, so it survives a reload and a kit change. Adding
  // the proficiency back by hand un-declines it and it becomes granted again --
  // which is the only way to reverse the decision, and a deliberate one.
  if (!Array.isArray(root._declinedGrants)) root._declinedGrants = [];
  const declined = root._declinedGrants;
  const isDeclined = n => declined.some(d => norm(d) === norm(n));

  // Add or adopt.
  want.forEach(name => {
    const existing = list.find(n => n && norm(n.name) === norm(name));
    if (existing) {
      // Present again, so the decline is spent. Re-granting here is what makes
      // the GRANTED flip immediate when a bonusChoice is satisfied from the
      // browser, rather than waiting for the next kit render.
      const di = declined.findIndex(d => norm(d) === norm(name));
      if (di !== -1) declined.splice(di, 1);
      if (!existing.isKitGranted) {
        existing.wasPlayerOwned = true;
        existing.isKitGranted   = true;
      }
      return;
    }
    if (isDeclined(name)) return;
    const rec = (typeof NWP_DATA !== 'undefined' && Array.isArray(NWP_DATA))
      ? NWP_DATA.find(r => norm(r['Proficiency Name']) === norm(name))
      : null;
    list.push({
      name:         rec ? rec['Proficiency Name'] : name,
      category:     rec ? (rec.Category || '') : '',
      slots:        0,
      abilityCheck: rec ? (rec['Ability Check'] || '') : '',
      notes:        rec ? (rec.Notes || '') : '',
      isKitGranted: true
    });
  });
}

// The kit's proficiency block with the selected variant's overrides applied.
// THE ONE READER, for when consumers are built -- the four-way schema has none
// yet, and resolving the merge separately in each would be how they start
// disagreeing about what a Pirate is proficient with.
//
// An option's `proficiencies` overrides the kit's own block PER SECTION: the
// Amazon's dwarf variant replaces only `weapon`, so the human bonus nonweapon
// proficiencies still apply, while her gnome variant replaces both. A section
// the variant does not name is inherited whole, never merged field by field --
// a variant that names `weapon` is stating what that weapon block IS.
function getKitProficiencies(root) {
  const kit = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;
  if (!kit) return null;

  const base = kit.proficiencies || null;
  const v    = kit.variants;
  if (!v || !Array.isArray(v.options) || !v.options.length) return base;

  const chosen = (val(root, 'kit_variant') || '').trim() ||
                 (v.default || '');
  const opt = v.options.find(o => o.key === chosen);
  if (!opt || !opt.proficiencies) return base;

  const out = Object.assign({}, base || {});
  ['weapon', 'nonweapon'].forEach(sec => {
    if (opt.proficiencies[sec]) out[sec] = opt.proficiencies[sec];
  });
  return out;
}

// May this character take a weapon proficiency in THIS weapon, given his kit?
//
// ONE RESOLVER, the way isOptionalRule is one read point. Both the weapon
// browser and the weapon proficiency picker ask it, so neither reimplements the
// precedence -- and there is precedence to get wrong: the Seeker carries an
// allow-list AND a bar, at two different scopes.
//
// Returns { state, via, kitName, scope, active, recommended, printed }.
//
//   state        'unrestricted' | 'allowed' | 'barred'
//   via          'whitelist' | 'blacklist' | null -- WHICH rule decided
//   scope        'creation' | 'permanent' -- when that rule applies
//   active       whether it applies to this character RIGHT NOW
//   recommended  flavour only; independent of state, and never restricts
//
// ACTIVE IS SEPARATE FROM STATE on purpose. A creation-scope restriction is
// still TRUE of the kit at 7th level -- it explains why the character's early
// proficiencies look the way they do -- it simply no longer forbids anything.
// Collapsing the two would either grey a battle axe for a 7th-level Mountain
// Man (wrong) or erase the rule from the card entirely (also wrong). The caller
// greys on `active` and labels on `state`.
//
// BLACKLIST BEATS WHITELIST. Only the Seeker carries both and the book is
// unambiguous about him: the allow-list governs his single 1st-level slot,
// while "he can never use a sword of any type" is permanent and absolute. So a
// long sword must come back barred rather than merely off-list, and it must
// stay barred at 12th level when the allow-list has lapsed.
//
// Name matching goes through samePHBR1Proficiency, so a Stalker who bought
// Knife is not told his Stiletto is off-list -- they are one proficiency with
// two names (PHBR1 p.59). Group matching uses the weapon's resolved Group.
function getKitWeaponPermission(root, weaponName, typeKey, group) {
  const none = { state: 'unrestricted', via: null, kitName: '', scope: 'permanent',
                 active: false, recommended: false, printed: '' };
  if (!root) return none;

  const prof = (typeof getKitProficiencies === 'function') ? getKitProficiencies(root) : null;
  const w = prof && prof.weapon;
  if (!w) return none;

  const kit = (typeof getSelectedKit === 'function') ? getSelectedKit(root) : null;
  const kitName = (kit && kit.name) || '';

  const nz = s => String(s || '').trim().toLowerCase();

  // PHBR1 p.103: "Stone weapons are used just like their modern counterparts",
  // and bone weapons "are likewise used like their modern counterparts". A
  // stone dagger IS a dagger -- the book's general statement of the principle
  // is that "the club is the same weapon regardless of technological
  // advancement". So a kit permitting Dagger permits its variants, and one
  // barring Dagger bars them too.
  //
  // WITHOUT THIS the Beastmaster -- whose restriction is literally "weapons he
  // can make himself" -- was permitted a steel dagger and refused a bone one.
  // Every whitelist kit in the book had the same hole, because all six variants
  // are variants of Dagger, Knife, Javelin or Spear and every one of those
  // appears on some kit's list.
  //
  // baseWeapon, NOT Group. The stone javelin's group is Spear and the bone
  // knife's group is Dagger, so neither resolves by group -- and matching by
  // group would wrongly admit Gaff/Hook and Kama, which sit in the Dagger group
  // and are not daggers.
  //
  // CONTAINED TO PERMISSION. This answers "may I learn this?" and nothing else.
  // It must never reach areWeaponsRelated or getWeaponSpecialization: whether
  // one proficiency covers both materials is a separate question the p.59
  // proficiency lists answer, and widening this quietly would repeat the
  // allowedGroups leak the schema header warns about.
  const wRec = (typeof lookupWeaponData === 'function') ? lookupWeaponData(weaponName) : null;
  const wBase = (wRec && wRec.baseWeapon) ? wRec.baseWeapon : '';

  const nameHit = list => Array.isArray(list) && list.some(n =>
    nz(n) === nz(weaponName) ||
    (wBase && nz(n) === nz(wBase)) ||
    (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(n, weaponName)));
  // The row's resolved Group, with the raw value as a fallback so a
  // pre-migration row carrying a coarse group still matches.
  const g = (typeof getWeaponGroup === 'function') ? (getWeaponGroup(typeKey, group) || group) : group;
  const groupHit = list => Array.isArray(list) && list.some(x => nz(x) === nz(g));

  // A creation-scope rule binds only while the character is being built. Level
  // is read from the whole character rather than the `level` field, which is a
  // display string for multi- and dual-class sheets.
  const lvl = (typeof getAllClassComponents === 'function')
    ? (getAllClassComponents(root) || []).reduce((m, c) => Math.max(m, parseInt(c.level, 10) || 0), 0)
    : (parseInt(val(root, 'level'), 10) || 0);
  const bindsNow = scope => scope !== 'creation' || lvl <= 1;

  const recommended = nameHit(w.recommended) || groupHit(w.recommendedGroups);
  const printed = w.allowedPrinted || '';

  // 1. Blacklist first -- see the note above.
  if (nameHit(w.barred) || groupHit(w.barredGroups)) {
    const scope = w.barredScope === 'creation' ? 'creation' : 'permanent';
    return { state: 'barred', via: 'blacklist', kitName: kitName, scope: scope,
             active: bindsNow(scope), recommended: recommended, printed: printed };
  }

  // 2. Whitelist, if the kit prints one. allowed and allowedGroups are a UNION:
  //    "axe (any), club, dagger" is one list wearing two fields.
  const hasWhitelist = (Array.isArray(w.allowed) && w.allowed.length) ||
                       (Array.isArray(w.allowedGroups) && w.allowedGroups.length);
  if (hasWhitelist) {
    const scope = w.allowedScope === 'creation' ? 'creation' : 'permanent';
    const on = nameHit(w.allowed) || groupHit(w.allowedGroups);
    return { state: on ? 'allowed' : 'barred', via: 'whitelist', kitName: kitName,
             scope: scope, active: bindsNow(scope), recommended: recommended,
             printed: printed };
  }

  // 3. No rule. recommended still rides along -- the Barbarian and the
  //    Beast-Rider land here, and both have recommendations and no restriction.
  return { state: 'unrestricted', via: null, kitName: kitName, scope: 'permanent',
           active: false, recommended: recommended, printed: printed };
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

    // PHBR1 pp.111-112. A piecemeal piece ADDS to AC, the same shape as
    // supplemental armour, shields, rings and cloaks -- it never sets a base.
    // So a character wearing nothing but pieces gets exactly AC = 10 - (sum),
    // which is the book's arithmetic.
    //
    // The slot is stored as the LABEL ("One Arm"), matching how every other
    // slot value is stored, so it is resolved back to a key here.
    //
    // SPLIT MAGICAL ARMOUR GRANTS NOTHING (p.112): "once the magical armor is
    // split into little bits, or pieces are merely separated and not worn
    // together, the magical bonus doesn't work." So magicBonus is deliberately
    // NOT applied to a piece -- the one place in this walk that ignores it.
    //
    // SIGN: finalAC adds every term and lower is better, so an improvement is
    // NEGATIVE. The table stores positive protection values, hence the subtract.
    const pmSlot = (typeof PIECEMEAL_SLOTS !== 'undefined')
      ? PIECEMEAL_SLOTS.find(s => s.label === type) : null;
    if (pmSlot) {
      const pmKey = (item.querySelector('.armor-type') || {}).value ||
        (typeof inferArmorTypeKey === 'function' ? inferArmorTypeKey(name) : '');
      const pm = (typeof getPiecemealPiece === 'function')
        ? getPiecemealPiece(pmKey, pmSlot.key) : null;
      // null when PHBR1 is off, or when the type has no row (elven chain). The
      // piece stays on the character and contributes zero rather than vanishing.
      if (pm && pm.bonus) {
        miscBonus -= pm.bonus;
        miscNames.push(name + ' (' + pmSlot.label + ')');
        acStackers.push({ label: 'Piecemeal', name: name + ' \u2014 ' + pmSlot.label,
          baseACValue: -pm.bonus, magicBonus: 0 });
      }
      return;
    }

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
    // THE ONE VARIANT THAT NEVER FOLLOWED THE DERIVATION RULE. It was built from
    // scratch as 10 + dexAdj + manualAdj, which silently dropped miscBonus,
    // ringBonus and cloakBonus -- the exact class of bug the rule was introduced
    // to kill, still live in the variant nobody converted.
    //
    // Building it by BACKING TERMS OUT of finalAC instead makes the omissions
    // explicit and makes each one a decision:
    //
    //   baseAC - 10   armour itself. Out. This is the whole point of the field.
    //   shieldBonus   a shield. Out.
    //   miscBonus     Supplemental Armor -- bracers, greaves, gladiator belt and
    //                 fasciae. ARMOUR, so out. The old code dropped this one and
    //                 was accidentally right.
    //   ringBonus     a ring of protection. STAYS. It plainly still works when
    //                 you are naked, and the old code was wrong to drop it.
    //   cloakBonus    a cloak of protection. STAYS, same reasoning.
    //   dexAdj        stays.
    //   manualAdj     stays -- the DM's override survives being stripped.
    //   styleAdj      STAYS. PHBR1 p.62's Single-Weapon Style bonus is
    //                 nimbleness and a free hand, not equipment; a naked fencer
    //                 still fences.
    const unarmoredAC = finalAC - (baseAC - 10) - shieldBonus - miscBonus;
    acUnarmoredEl.value = unarmoredAC;

    let t = "No armor, shield, or supplemental armor pieces\n" +
            "Base 10 + DEX + manual adj.";
    if (ringBonus)  t += `\nRing ${ringBonus >= 0 ? "+" : ""}${ringBonus} still applies`;
    if (cloakBonus) t += `\nCloak ${cloakBonus >= 0 ? "+" : ""}${cloakBonus} still applies`;
    if (styleAdj)   t += `\nSingle-Weapon Style ${magicSign(styleAdj)} still applies`;
    acUnarmoredEl.title = t;
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
    let weight = parseFloat(item.querySelector('.weight')?.value) || 0;

    // PHBR1 pp.110-111. Elven high-quality armour is "1/2 the weight of ordinary
    // armor" and half-elven "-10% the weight of ordinary armor of the same
    // kind". Applied HERE rather than by rewriting the weight FIELD, because the
    // field holds what the book prints for that armour type -- the anchor rule.
    // A stored lighter figure would drift from core_armor.json and could not be
    // undone by unticking.
    //
    // Human high-quality plate is explicitly NORMAL weight: "instead of being
    // lighter than usual, it is built thicker". Its weightMult is 1, so it falls
    // through this untouched, which is the correct behaviour rather than an
    // omission.
    const hqRace = (item.querySelector('.armor-hq-race') || {}).value || '';
    if (hqRace && typeof getHighQualityArmor === 'function') {
      const hq = getHighQualityArmor(hqRace,
        (item.querySelector('.armor-type') || {}).value || '');
      if (hq && hq.weightMult !== 1) weight = weight * hq.weightMult;
    }

    // PHBR1 p.112: "The breastplate is 1/2 the weight of the original suit. Each
    // arm and leg is 1/8 the weight of the original suit." So two arms or two
    // legs is 1/4.
    //
    // MULTIPLIED, NOT STORED, for the same reason as the elven half-weight
    // above: the weight FIELD holds what the book prints for the whole suit,
    // and a stored fraction would drift from core_armor.json and could not be
    // undone by changing the slot back.
    //
    // AFTER the racial multiplier deliberately -- a half-weight elven breastplate
    // is half of half. Both are proportions of the same original suit, so they
    // compose.
    const pmSlotW = (typeof PIECEMEAL_SLOTS !== 'undefined')
      ? PIECEMEAL_SLOTS.find(s => s.label ===
          ((item.querySelector('.armor-slot') || {}).value || '')) : null;
    if (pmSlotW && typeof getPiecemealPiece === 'function') {
      const pmW = getPiecemealPiece(
        (item.querySelector('.armor-type') || {}).value || '', pmSlotW.key);
      // null with PHBR1 off, and the full weight then applies -- consistent with
      // the piece granting no AC either. Suspended, not half-suspended.
      if (pmW) weight = weight * pmW.weightMult;
    }

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

  // PHBR3 p.122, "Toning Down the Cleric". Counted and reported, NEVER enforced:
  // the book intends the four choices to be fixed at creation, but a misclick
  // should not cost a character his spheres, and a DM who is DMing will notice
  // someone trying it on.
  //
  // VANILLA CLERICS ALONE. Druids are excluded because their spheres are already
  // restricted by design and the rule names the Cleric only. A character with a
  // PHBR3 priesthood recorded is excluded because he is a priest of a specific
  // mythos, not a Cleric -- and this rule exists precisely so that he is no
  // longer outshone by one. Reading sp_prime_req2 and friends directly rather
  // than through getSpecialtyPriestOverride, because the question here is "has a
  // priesthood been recorded", not "is the override in force" -- the answer must
  // not change when the specialtyPriests band is toggled off.
  if (typeof isSupplementActive === 'function' &&
      isSupplementActive('phbr3', 'toningDownCleric')) {
    const clazz = (val(root, 'clazz') || '').trim().toLowerCase();
    const single = (val(root, 'char_type') || 'single').toLowerCase() === 'single';
    const hasPriesthood = ['sp_prime_req2', 'sp_hit_die', 'sp_crossover',
                           'sp_language_slot', 'sp_weapon_spec', 'sp_restrictions']
                          .some(f => (val(root, f) || '').trim());
    if (single && clazz === 'cleric' && !hasPriesthood) {
      const over = [];
      if (major > 3) over.push((major - 3) + ' major over');
      if (minor > 2) over.push((minor - 2) + ' minor over');
      parts.push(over.length
        ? '<span style="color:var(--warning);">Toned-down cleric: 3 major and 2 minor \u2014 ' +
          escapeHtml(over.join(', ')) + '</span>'
        : '<span style="color:var(--muted);">Toned-down cleric: ' + major + '/3 major, ' +
          minor + '/2 minor</span>');
    }
  }

  // 4. SPHERE BUDGET (PHBR3 p.22): Good 3 major + 2 minor, Medium 5 + 4, Poor
  // 7 + 6, counting All among the majors. Reported, never enforced -- p.41 says
  // outright that not all the book's own priesthoods follow it, and Arts (ten
  // major on Poor combat) and Birth/Children (eleven) prove it.
  if (typeof getSpecialtyPriestOverride === 'function') {
    const cbt = getSpecialtyPriestOverride(root, 'sp_combat');
    const BUDGET = { good: [3, 2], medium: [5, 4], poor: [7, 6] };
    if (BUDGET[cbt]) {
      const [bMaj, bMin] = BUDGET[cbt];
      const majWithAll = major + 1;   // All is always granted and has no control
      const over = majWithAll > bMaj || minor > bMin;
      parts.push('<span style="color:var(--' + (over ? 'warning' : 'muted') + ');">' +
        cbt.charAt(0).toUpperCase() + cbt.slice(1) + ' combat budget: ' +
        majWithAll + '/' + bMaj + ' major, ' + minor + '/' + bMin + ' minor</span>');
    }
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
      // Alias carries the same weapon's name in another tradition -- "Bo" on
      // the Quarterstaff, "Bill" on the Gaff/Hook. PHBR15 states outright that
      // its repeated weapons are western weapons under Oriental names carrying
      // identical statistics, so those become aliases rather than duplicate
      // rows. Search had no way to find them; the Bill alias has sat unfindable
      // in a Notes field since the PHBR3 pass.
      (weapon.Alias && weapon.Alias.toLowerCase().includes(searchTerm)) ||
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
    
    // Kit permission, MARKING ONLY -- the Add button is never disabled here.
    //
    // This browser sells WEAPONS; the proficiency picker sells PROFICIENCIES,
    // and almost every kit restriction is written about the latter: "Must
    // choose his initial weapon PROFICIENCIES from", "Receives only a single
    // weapon PROFICIENCY at first level", "may not start out play having a
    // PROFICIENCY in a ranged weapon". Nothing stops a character carrying a
    // weapon he is untrained with -- he takes the Table 34 penalty, which the
    // weapon card already reports on its own.
    //
    // So the tag is a heads-up before he spends the money, not a gate. Muted
    // rather than red for the same reason: red here would claim a prohibition
    // the book does not make.
    const invPerm = (typeof getKitWeaponPermission === 'function')
      ? getKitWeaponPermission(root, weapon['Weapon Name'],
          (typeof inferWeaponTypeKey === 'function') ? inferWeaponTypeKey(weapon['Weapon Name']) : '',
          weapon.Group || '')
      : { state: 'unrestricted', active: false, recommended: false };

    let invTag = '';
    if (invPerm.state === 'barred' && invPerm.active) {
      invTag = '<span style="margin-left:8px;font-size:10px;color:var(--muted);">' +
               escapeHtml(invPerm.kitName) + ': no proficiency ' +
               (invPerm.scope === 'creation' ? 'yet' : 'for this') + '</span>';
    } else if (invPerm.recommended) {
      invTag = '<span style="margin-left:8px;font-size:10px;color:var(--accent-light);">' +
               escapeHtml(invPerm.kitName) + ': recommended</span>';
    }

    // Build info display
    let infoHTML = `
      <div>
        <strong>${weapon['Weapon Name']}</strong>${invTag}
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
    const matchSource = spell => !sourceFilter || (spell.source || '') === sourceFilter;
    
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

// Add a magical item from the browser. THE ONLY BROWSER THAT ROUTES TO THREE
// DIFFERENT LISTS: weapons to the Weapons tab, slotted worn items to the Armor
// tab, everything else to the Magic Items tab. Nothing appears in two places.
//
// The card must come out INDISTINGUISHABLE from one filled in by hand, so
// Enchanted and Identified are both ticked and the enchantment fields filled.
// Every item in core_magic.json is a named item from a book, so it is by
// definition identified; unidentified loot is manual entry.
function addMagicFromBrowser(root, item) {
  if (!item) return;
  const num = s => { const m = String(s == null ? '' : s).match(/[\d.]+/); return m ? m[0] : ''; };
  const done = () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) markUnsaved(activeTab, true, root);
    if (typeof recalculateAll === 'function') recalculateAll(root);
  };
  // TITLE vs TRUE NAME follows the card convention: the title is the mundane
  // thing ("Dagger"), the true name is the magical one ("Dagger of Impaling").
  // With no mundane base -- Boots of Balance, Bag of Vanishing -- both are the
  // item's own name rather than inventing a generic.
  const title = item.baseType || item.name;
  const dest  = (typeof magicDestination === 'function') ? magicDestination(item) : { list: 'magic' };
  let added = null;   // the node just created, so its textareas can be sized below

  if (dest.list === 'weapons') {
    const list = root.querySelector('.weapons-list');
    if (!list) return;
    const base = (typeof WEAPONS_DATA !== 'undefined' ? WEAPONS_DATA : [])
      .find(w => w['Weapon Name'] === item.baseType) || {};
    added = makeWeaponNode({
      name: title,
      damageSM: base['Damage (S-M)'] || '', damageL: base['Damage (L)'] || '',
      speed: base['Speed Factor'] || '',    weight: num(base.Weight),
      isMagical: true, identified: true, trueName: item.name,
      // magicBonus is the ENCHANTMENT LEVEL; hitAdj/dmgAdj are separate because
      // several of these are non-uniform. Left blank where the book gives no
      // flat bonus -- Crossbow of Angling is +2 on the BOLT, not the bow, and
      // filling it here would hand out a permanent +2 crossbow.
      magicBonus: (item.magicBonus == null ? '' : item.magicBonus),
      hitAdj:     (item.hitAdj     == null ? '' : item.hitAdj),
      dmgAdj:     (item.dmgAdj     == null ? '' : item.dmgAdj),
      effects: item.effects || ''
    }, done);
    list.appendChild(added);
  } else if (dest.list === 'armor') {
    const list = root.querySelector('.armor-list');
    if (!list) return;
    const base = (typeof ARMOR_DATA !== 'undefined' ? ARMOR_DATA : [])
      .find(a => a['Armor Name'] === item.baseType) || {};
    added = makeArmorNode({
      name: title,
      armorType: item.slot || 'Other',
      armorTypeKey: (item.baseType && typeof inferArmorTypeKey === 'function')
        ? inferArmorTypeKey(item.baseType) : '',
      // BASE AC IS LEFT BLANK where the item has no mundane armour behind it.
      // On Cloak/Ring/Belt/Amulet/Robe/Boots the field ADDS to AC rather than
      // setting it, so a number here makes the character WORSE -- that is the
      // eight-point error a Cloak of Shadows produced. Bonuses go in acBonus.
      baseAC: base.AC || '',
      acBonus: (item.acBonus == null ? '' : item.acBonus),
      equipped: false,
      weight: num(base.Weight),
      isMagical: true, identified: true, trueName: item.name,
      effects: item.effects || ''
    }, done);
    list.appendChild(added);
  } else {
    const list = root.querySelector('.magic-items-list');
    if (!list) return;
    // TRUE NAME omitted deliberately. On a weapon or armour the title is the
    // mundane thing and the true name the magical one -- "Dagger" /
    // "Dagger of Impaling". A pure magic item has no mundane base, so setting
    // both to the same string just printed the name twice.
    const node = makeMagicItemNode({
      name: item.name, qty: '1', identified: true,
      notes: (item.effects || '') +
             (item.source ? '  [' + item.source.book + ' p.' + item.source.page + ']' : '')
    }, done);
    list.appendChild(node);
    added = node;
  }
  done();

  // SIZE THE NEW CARD NOW. The observer binds the input listener, but its first
  // measurement can land before layout; and this is the feature that produced
  // the card, so it ships its own refresh rather than relying on a sweep.
  // Two frames, because one is not enough after an insert.
  // A card routed to ANOTHER TAB cannot be measured at all -- that panel is
  // display:none and scrollHeight is 0 -- so autoExpand declines to write a
  // height and the vtab-switch sweep sizes it on arrival, before the player can
  // see it. That case is inherent, not a bug.
  if (added && typeof autoExpand === 'function') {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      added.querySelectorAll('textarea').forEach(ta => autoExpand(ta));
    }));
  }
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
    const intScore = (typeof getEffectiveIntForSpellTable === 'function')
      ? getEffectiveIntForSpellTable(root) : (parseInt(val(root, 'int') || 0, 10));
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
    const kitCapNotice = (typeof getMageLimitation === 'function') &&
                         getMageLimitation(root) === 'noHighLevel' && maxSpellLevel === 7;
    if (kitCapNotice) {
      capNoticeEl.style.display = 'block';
      capNoticeEl.textContent =
        'Your kit forbids 8th- and 9th-level spells from any school (PHBR4 p.40), ' +
        'capping you at level 7. Higher-level spells show for reference but can\u2019t be added.';
    } else if (intCapped) {
      // The EFFECTIVE score, so the number quoted matches the cap it explains.
      const intScore = (typeof getEffectiveIntForSpellTable === 'function')
        ? getEffectiveIntForSpellTable(root) : (parseInt(val(root, 'int') || 0, 10));
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
  const uwFilter     = root.querySelector('.spell-uw-filter')?.value || '';
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
  // PHBR4 Ch.6 pp.73-74. DELIBERATELY NOT A FACETED DROPDOWN like the three
  // above: its vocabulary is a fixed set of four states rather than values
  // discovered from the data, and one of them -- "works underwater" -- is the
  // ABSENCE of a flag, which populateFacet cannot express because it filters
  // falsy values out. So the options are hard-coded in sheet_template.js and
  // this predicate reads them directly.
  //
  // Three stored states, four choices. 'airy' is its own option rather than a
  // sub-case of failure because it is genuinely actionable: those spells work
  // normally inside an airy water spell, and a caster who has one wants them
  // listed. 'no' covers ONLY the spells with no reprieve.
  const matchUW = spell => {
    if (!uwFilter) return true;
    const uw = spell.underwater || '';
    if (uwFilter === 'ok')       return !uw;
    if (uwFilter === 'modified') return uw === 'modified';
    if (uwFilter === 'airy')     return uw === 'ineffective-unless-airy-water';
    if (uwFilter === 'no')       return uw === 'ineffective';
    return true;
  };

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
    if (matchSearch(spell) && matchLevel(spell) && matchSource(spell) && matchSave(spell) && matchUW(spell)) {
      splitClassification(spell[catField]).forEach(t => catValues.add(t));
    }
  });
  populateFacet(root.querySelector('.spell-cat-filter'),
    isPriest ? 'All Spheres' : 'All Schools', catValues);

  const sourceValues = new Set();
  pool.forEach(spell => {
    if (matchSearch(spell) && matchLevel(spell) && matchCat(spell) && matchSave(spell)) {
      if (spell.source && matchUW(spell)) sourceValues.add(spell.source);
    }
  });
  populateFacet(root.querySelector('.spell-source-filter'), 'All Sources', sourceValues);

  const saveValues = new Set();
  pool.forEach(spell => {
    if (matchSearch(spell) && matchLevel(spell) && matchCat(spell) && matchSource(spell)) {
      if (spell.save && matchUW(spell)) saveValues.add(spell.save);
    }
  });
  populateFacet(root.querySelector('.spell-save-filter'), 'All Saves', saveValues);

  // Final filtered list for display (all predicates ANDed).
  let filteredSpells = pool.filter(spell =>
    matchSearch(spell) && matchLevel(spell) && matchCat(spell) && matchSource(spell) &&
    matchSave(spell) && matchUW(spell));
  
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
  // "the number of languages he can learn" -- PHBR4 p.40.
  const int = (typeof getEffectiveIntForSpellTable === 'function')
    ? getEffectiveIntForSpellTable(root) : (parseInt(val(root, 'int') || 0, 10));
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
  // See deleteLanguageProficiency: a new language spends a nonweapon slot, and
  // under PHBR3's Language and Communication grant it may also change how many
  // are subsidized -- so the budget line has to repaint here too.
  if (typeof renderProficiencySlots === 'function') renderProficiencySlots(root);

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
  // "the number of languages he can learn" -- PHBR4 p.40.
  const int = (typeof getEffectiveIntForSpellTable === 'function')
    ? getEffectiveIntForSpellTable(root) : (parseInt(val(root, 'int') || 0, 10));
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
    // Languages are bought with NONWEAPON slots, so removing one frees budget.
    // Missing here, and in addLanguageProficiency, since before PHBR3 --
    // setNativeLanguage and updateLanguageFlag both carry this call and these
    // two did not, so the counter went stale on every add and delete.
    if (typeof renderProficiencySlots === 'function') renderProficiencySlots(root);

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

  // "Familiars" is not a Category -- a cat is livestock AND a familiar, and
  // splitting it into two rows would put two cats in the browser. It is a
  // filter over a field instead.
  //
  // THE CONTROL IS ALWAYS PRESENT; THE BAND DECIDES WHAT IT CONTAINS. Familiars
  // are a PHB feature, so a table that never opens PHBR4 still needs the list --
  // just the shorter one. PHBR4 Table 17 SUBSTITUTES the PHB p.134 list rather
  // than extending it, which is why this is either/or and not a union.
  const useP4 = (typeof isOptionalRule === 'function' &&
                 isOptionalRule('familiarListPHBR4'));
  const rows = ANIMALS_DATA.filter(a =>
    (cat === 'Familiar'
       ? !!(useP4 ? a.familiarPHBR4 : a.familiarPHB)
       : (!cat || a.Category === cat)) &&
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

    // THE QUICK PATH ONLY, and only for creatures eligible under the rules in
    // force -- the PHB six with PHBR4 off, its twenty-five with it on. The
    // ordinary + Bonded route stays open for ANY creature, because both books
    // say so outright: PHB p.134 "the referee can substitute other small
    // animals suitable to the area", and PHBR4 p.108 the same. A DM permitting
    // a raven as a familiar under PHB-only rules is doing what the book invites.
    const uw = (typeof isOptionalRule === 'function' &&
                isOptionalRule('familiarListPHBR4'));
    if (uw ? a.familiarPHBR4 : a.familiarPHB) {
      const fam = document.createElement('button');
      fam.textContent = '+ Familiar';
      fam.style.cssText = 'padding:2px 8px;font-size:11px;';
      fam.title = 'Add to Bonded Mounts & Animal Companions with the bond set to ' +
                  'Familiar.' + (a.sensoryPowers ? ' Sensory powers: ' + a.sensoryPowers : '');
      fam.addEventListener('click', () => addAnimalFromBrowser(root, a, 'familiar'));
      btns.appendChild(fam);
    }

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

  // 'familiar' IS THE BONDED PATH WITH THE BOND PRESET. It must be named
  // explicitly: the else branch below is the UNBONDED list, so an unrecognised
  // destination would file a wizard's familiar among his carts.
  if (destination === 'bonded' || destination === 'familiar') {
    const list = root.querySelector('.companions-list');
    if (!list) return;
    // Species holds the book name and Name is left BLANK, because a companion is
    // named by its owner. The companion node has no cost field, so the price
    // rides along in notes rather than being silently dropped.
    //
    // SENSORY POWERS RIDE ALONG UNGATED. Only the PHB prints them, and only for
    // its six, but PHBR4 Table 17 substitutes the ROLL TABLE, not the creatures
    // -- a cat's night vision does not stop existing because the DM uses a
    // longer list. So with PHBR4 on, six of the twenty-five carry them and the
    // rest carry none, which is exactly what the two books say between them.
    const notes = [
      entry.Cost ? 'Cost: ' + entry.Cost : '',
      (destination === 'familiar' && entry.sensoryPowers)
        ? 'Sensory powers: ' + entry.sensoryPowers : '',
      capacityNote,
      entry.Notes || ''
    ].filter(Boolean).join(' ');
    list.appendChild(makeCompanionNode({
      name:     '',
      species:  entry.Name,
      // The bond select already offers Familiar; this just presets it.
      bond:     destination === 'familiar' ? 'Familiar' : '',
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
  // "the number of languages he can learn" -- PHBR4 p.40.
  const int = (typeof getEffectiveIntForSpellTable === 'function')
    ? getEffectiveIntForSpellTable(root) : (parseInt(val(root, 'int') || 0, 10));
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
// ===== MAGICAL ITEMS BROWSER =====
// Ungated: the books ADD this content, so no supplement toggle guards it.
// The Add button is labelled by DESTINATION, because this is the one browser
// whose items land on other tabs -- see addMagicFromBrowser.
function populateMagicFilters(root) {
  if (typeof MAGIC_DATA === 'undefined' || !MAGIC_DATA.length) return;
  // REBUILT from the data, never hand-maintained: every new supplement can
  // introduce a displayGroup or a book, and a hardcoded list would silently
  // omit it. Idempotent, so calling twice is safe.
  const fill = (sel, values) => {
    if (!sel) return;
    const first = sel.querySelector('option[value=""]');
    const allLabel = first ? first.textContent : 'All';
    const current = sel.value;
    sel.innerHTML = '<option value="">' + escapeHtml(allLabel) + '</option>' +
      values.map(v => '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>').join('');
    sel.value = current;
  };
  const uniq = arr => [...new Set(arr)].sort();
  fill(root.querySelector('.magic-group-filter'), uniq(MAGIC_DATA.map(i => i.displayGroup).filter(Boolean)));
  fill(root.querySelector('.magic-book-filter'),  uniq(MAGIC_DATA.map(i => i.source && i.source.book).filter(Boolean)));
}

// Where an item goes when added, and what the button therefore says.
function magicDestination(item) {
  if (item.category === 'weapon') return { list: 'weapons', label: 'Add to Weapons' };
  if (item.category === 'worn' && item.slot) return { list: 'armor', label: 'Add to Armor' };
  return { list: 'magic', label: 'Add' };
}

async function renderMagicBrowser(root) {
  const resultsDiv = root.querySelector('.magic-results');
  if (!resultsDiv) return;

  if (typeof MAGIC_DATA === 'undefined' || !MAGIC_DATA.length) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (typeof MAGIC_DATA === 'undefined' || !MAGIC_DATA.length) {
      resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Magical items not loaded. Please refresh the page.</p>';
      return;
    }
  }
  populateMagicFilters(root);

  const term  = (root.querySelector('.magic-search')?.value || '').toLowerCase();
  const group = root.querySelector('.magic-group-filter')?.value;
  const book  = root.querySelector('.magic-book-filter')?.value;

  let list = MAGIC_DATA.slice();
  if (group) list = list.filter(i => i.displayGroup === group);
  if (book)  list = list.filter(i => i.source && i.source.book === book);
  if (term)  list = list.filter(i =>
    i.name.toLowerCase().includes(term) ||
    (i.effects || '').toLowerCase().includes(term) ||
    (i.baseType || '').toLowerCase().includes(term));

  if (!list.length) {
    resultsDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No magical items match those filters.</p>';
    return;
  }

  const RESTRICT = {
    thief:          'Thieves only',
    thiefPreferred: 'Best for thieves',
    warrior:        'Warriors only',
    warriorPriest:  'Warriors or priests only',
    rangerPreferred:'Best for rangers'
  };

  list.sort((a, b) => a.name.localeCompare(b.name));
  resultsDiv.innerHTML = list.map(i => {
    const d = magicDestination(i);
    const tags = [];
    if (RESTRICT[i.restriction]) tags.push(RESTRICT[i.restriction]);
    if (i.xp === 'U') tags.push('Unique'); else if (i.xp) tags.push(i.xp + ' XP');
    if (i.baseType) tags.push(escapeHtml(i.baseType));
    return '<div style="border-bottom:1px solid var(--border);padding:8px 4px;">' +
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">' +
        '<div style="flex:1;">' +
          '<strong>' + escapeHtml(i.name) + '</strong> ' +
          '<span style="font-size:11px;color:var(--muted);">' +
            escapeHtml(i.displayGroup || '') +
            (i.source ? ' &middot; ' + escapeHtml(i.source.book) + ' p.' + escapeHtml(String(i.source.page)) : '') +
          '</span>' +
          (tags.length ? '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' + tags.join(' &middot; ') + '</div>' : '') +
        '</div>' +
        '<button class="add-magic-from-browser" data-magic-name="' + escapeHtml(i.name) + '" style="flex-shrink:0;">' +
          escapeHtml(d.label) + '</button>' +
      '</div>' +
      '<div style="font-size:11px;line-height:1.5;color:var(--muted);margin-top:4px;">' + escapeHtml(i.effects || '') + '</div>' +
    '</div>';
  }).join('');
}

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
      (weapon.Alias && weapon.Alias.toLowerCase().includes(searchTerm)) ||
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
    
    // Kit permission for THIS weapon. Resolved once and used twice -- for the
    // tag below and for the Learn button further down -- so the row's label and
    // its button can never disagree about whether the kit permits it.
    //
    // An INLINE TAG NAMING THE KIT, not a rail colour. --st-forbidden already
    // means "not proficient", "restricted", "opposition school" and "deceased
    // follower"; a fifth meaning would make the vocabulary unreadable, and the
    // one thing the player needs here is WHICH KIT said so.
    const perm = (typeof getKitWeaponPermission === 'function')
      ? getKitWeaponPermission(root, weapon['Weapon Name'],
          (typeof inferWeaponTypeKey === 'function') ? inferWeaponTypeKey(weapon['Weapon Name']) : '',
          weapon.Group || '')
      : { state: 'unrestricted', active: false, recommended: false };

    // A LAPSED creation-scope rule still gets a tag, muted. It is why his early
    // proficiencies look the way they do, and going silent at 2nd level would
    // read as the restriction never having existed.
    // THREE STATES, NOT TWO. A creation-scope restriction that is currently
    // binding is not the same claim as a permanent one, and must not borrow its
    // wording -- "not permitted" reads as never, which is exactly what the same
    // row denies at 2nd level.
    let permTag = '';
    if (perm.state === 'barred' && perm.active && perm.scope === 'creation') {
      permTag = '<span style="margin-left:8px;font-size:10px;color:var(--error, #ff6b6b);">' +
                escapeHtml(perm.kitName) + ': not at 1st level</span>';
    } else if (perm.state === 'barred' && perm.active) {
      permTag = '<span style="margin-left:8px;font-size:10px;color:var(--error, #ff6b6b);">' +
                escapeHtml(perm.kitName) + ': not permitted</span>';
    } else if (perm.state === 'barred') {
      permTag = '<span style="margin-left:8px;font-size:10px;color:var(--muted);">' +
                escapeHtml(perm.kitName) + ': restricted at creation</span>';
    } else if (perm.recommended) {
      permTag = '<span style="margin-left:8px;font-size:10px;color:var(--accent-light);">' +
                escapeHtml(perm.kitName) + ': recommended</span>';
    }

    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    infoDiv.innerHTML = `
      <div>
        <strong>${weapon['Weapon Name']}</strong>${permTag}
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

    //  (3) REQUIRES NO PROFICIENCY AT ALL. Read from the DATA, not matched by
    //      name -- the flag is a column in core_wp.json so the next handbook
    //      that prints such a weapon needs no code change. Today only the cestus
    //      carries it (PHBR1 p.96, restated in the p.60 Non-Groups list).
    const noProf = String(weapon['No Proficiency'] || '').trim().toLowerCase() === 'yes';

    //  (4) COVERED BY A WEAPON GROUP he has bought (PHBR1 pp.58-60). Without
    //      this the browser offered a live Learn button for a weapon he was
    //      already proficient with -- `haveIt` matches on p.name, and a group
    //      record is named "Blades", not "Sword, Long" -- and clicking it
    //      charged a redundant slot. A silent overcharge.
    //
    //      Gated on the supplement: with PHBR1 off the group grants nothing, so
    //      the weapon genuinely is unlearned and Learn is correct again.
    const groupCover = (function () {
      if (haveIt || coveredBy) return null;
      if (!(typeof isSupplementActive === 'function' &&
            isSupplementActive('phbr1', 'weaponGroups'))) return null;
      if (typeof getPHBR1GroupMembers !== 'function') return null;

      const hit = known.find(p => {
        if (!p || !p.groupTier) return false;
        const members = getPHBR1GroupMembers(p.name) || [];
        return members.some(m => norm(m) === norm(wName) ||
          (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(m, wName)));
      });
      if (!hit) return null;

      // Already specialized through a slots:0 record? Then there is nothing
      // left to sell and the row should read Known, not Specialize.
      const alreadySpec = known.some(p =>
        p && p.specialized && norm(p.name) === norm(wName));
      if (alreadySpec) return null;

      const specRuleOn = (typeof isOptionalRule !== 'function') ||
                         isOptionalRule('weaponSpecialization');
      const canSpec = specRuleOn && (typeof canSpecialize === 'function') &&
                      canSpecialize(root);
      return {
        groupName: hit.name,
        canSpec: canSpec,
        specCost: (typeof getSpecializationCost === 'function')
          ? getSpecializationCost(weapon.Group || '') : 1
      };
    })();

    const learnBtn = document.createElement('button');
    learnBtn.style.cssText = 'padding:4px 12px;font-size:12px;margin-left:8px;flex-shrink:0;';

    // The barred test is deliberately allowed to PRE-EMPT this branch. A cestus
    // costs no proficiency slot (PHBR1 p.96), so the zero-cost Add is normally
    // right -- but a kit that restricts which weapons the character may use
    // still has something to say about it, and a row showing a red "not
    // permitted" tag beside a live Add button is incoherent whichever way the
    // rule falls. haveIt still wins over both: a cestus already owned reads
    // Known regardless of what the kit says.
    if (noProf && !haveIt && !(perm.active && perm.state === 'barred')) {
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
    } else if (groupCover && groupCover.canSpec) {
      // COVERED BY A GROUP, SPECIALIZATION AVAILABLE. PHBR1 p.60's own worked
      // example: three slots for the Blades broad group, the fourth to
      // specialize Long Sword. So this must be reachable, and there is no
      // per-weapon card to tick because the group record names the GROUP.
      //
      // THE CESTUS SHAPE. A record with slots:0 whose only cost is the
      // specialization -- 1 for a melee weapon, 2 for a bow, straight out of
      // getSpecializationCost. getWeaponSpecialization already reads
      // `specialized` off _weaponProfs, so nothing downstream needs changing.
      learnBtn.textContent = 'Specialize (' + groupCover.specCost +
                             (groupCover.specCost === 1 ? ' slot)' : ' slots)');
      learnBtn.title =
        'You are already proficient with this weapon through the ' +
        groupCover.groupName + ' group, so proficiency costs nothing further.' +
        '\u000a\u000aPHBR1 p.60: a group can never be specialized in as a whole \u2014 ' +
        'specializations are taken one weapon at a time, at the normal cost.';
      learnBtn.onclick = (e) => {
        e.stopPropagation();
        if (!root._weaponProfs) root._weaponProfs = [];
        root._weaponProfs.push({
          name: wName,
          weaponTypeKey: (typeof inferWeaponTypeKey === 'function')
            ? (inferWeaponTypeKey(wName) || '') : '',
          group: weapon.Group || '',
          // ZERO, not 1. The proficiency is already paid for by the group; only
          // the specialization is being bought here.
          slots: 0,
          specialized: true
        });
        if (typeof renderWeaponProficiencies === 'function') renderWeaponProficiencies(root);
        const tab = document.querySelector('.tab.active');
        if (tab && typeof markUnsaved === 'function') markUnsaved(tab, true, root);
      };
    } else if (groupCover) {
      // Covered, but specialization is not on the table -- it is single-class
      // fighters only and itself an optional rule. Say what covers him and offer
      // nothing; a Learn button here would sell a slot for what he already owns.
      learnBtn.textContent = 'Covered';
      learnBtn.disabled = true;
      learnBtn.title = 'Already proficient through the ' + groupCover.groupName +
                       ' group (PHBR1 pp.58-60). There is nothing further to buy.';
    } else if (perm.active && perm.state === 'barred') {
      // AFTER haveIt and coveredBy on purpose. A proficiency already owned is
      // reported as Known whatever the kit says -- the DM may have allowed it,
      // or it may predate the kit, and neither is the browser's business to
      // relitigate. This branch only declines to SELL something new.
      // TWO DIFFERENT FACTS, and one label for both was a lie. A permanent bar
      // means never; a creation-scope bar means NOT YET, and the same row says
      // so itself one level later when the tag goes grey. "Not for this kit" on
      // a Beastmaster's long sword told him his kit forbids it outright, when
      // the book only forbids it while he is being built.
      const permCreation = (perm.scope === 'creation');
      learnBtn.textContent = permCreation ? 'Not yet' : 'Not for this kit';
      learnBtn.disabled = true;
      learnBtn.title =
        (permCreation
          ? 'Restricted while this character is being built. The ' + perm.kitName +
            ' limits what he STARTS with, not what he may ever learn \u2014 this ' +
            'opens up above 1st level.'
          : (perm.via === 'whitelist'
              ? 'Not on the ' + perm.kitName + '\u2019s permitted weapon list.'
              : 'Barred by the ' + perm.kitName + ' kit.')) +
        (perm.printed ? '\u000a\u000aThe book says: \u201c' + perm.printed + '\u201d' : '') +
        '\u000a\u000aAdvisory only \u2014 PHBR1 p.37 says a DM may modify any kit. If yours ' +
        'has, add it with the custom button below.';
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
    String(weapon['No Proficiency'] || '').trim().toLowerCase() === 'yes';

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
  if (!isSupplementActive('phbr1', 'fightingStyles')) return off;

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

// Weapon proficiency slots spent on unarmed styles (PHBR1 pp.74-78). SEPARATE
// FROM getFightingStyles because the two are separate bands -- a table can have
// the armed styles without the unarmed ones -- but they charge the same budget,
// so renderProficiencySlots adds both.
//
// THE STORED VALUE IS ALREADY A SLOT COUNT, which is why this is a sum and not a
// conversion. That was the reason for storing slots rather than specialization
// levels: the three styles reach specialization at different slot counts, and a
// level would have had to be converted back here to charge for it.
//
// ZERO WHEN THE BAND IS OFF, so a table without it sees the number it always
// saw -- and the purchase is suspended rather than refunded, which matches how
// the armed styles and every other supplement toggle behave.
function getUnarmedStyleSlots(root) {
  if (typeof isSupplementActive === 'function' &&
      !isSupplementActive('phbr1', 'unarmedCombat')) return 0;
  const n = f => {
    const el = root.querySelector('[data-field="' + f + '"]');
    const v  = el ? parseInt(el.value, 10) : 0;
    return isNaN(v) ? 0 : Math.max(0, v);
  };
  return Math.min(4, n('unarmed_punching')) +
         Math.min(4, n('unarmed_wrestling')) +
         Math.min(5, n('unarmed_martial_arts'));
}

// Render the weapon + nonweapon proficiency slot counters (PHB Table 34).
// The weapon proficiency browser answers questions ABOUT THE CHARACTER -- is
// this already Known, is it Covered by a paired proficiency, does his kit permit
// it, and has a creation-scope restriction lapsed -- but it is rendered only by
// its own Refresh button and its three filter dropdowns. So every one of those
// answers went stale the moment anything changed, and the player had to know to
// press Refresh to see the truth. Learning a weapon did not flip its row to
// Known either; that predates the kit work.
//
// HOOKED IN renderProficiencySlots, ONE PLACE, because everything that can
// change an answer already reaches it: recalculateAll for level, class, kit and
// char_type; renderWeaponProficiencies for learn and delete; loadSheet and
// bindSheet on the way in. A list of individual call sites is what rots -- see
// the drift the class/level listener accumulated.
//
// GUARDED ON VISIBILITY. This runs from recalculateAll, which fires on every
// keystroke anywhere on the sheet, and a rebuild is ~109 rows. Closed panel,
// no work. Fire-and-forget: renderWeaponBrowser is async and nothing here
// depends on its result.
function refreshWeaponBrowserIfOpen(root) {
  const panel = root && root.querySelector('.weapon-browser-content');
  if (!panel || panel.style.display === 'none') return;
  if (typeof renderWeaponBrowser === 'function') renderWeaponBrowser(root);
}

// PHBR1 pp.58-60. The buying control for whole-group proficiencies.
//
// A SEPARATE CONTROL, not a row in the weapon browser, because a group is not a
// weapon -- there is nothing to search for, filter by category, or read a damage
// die off. Sixteen tight groups and four broad ones fit in one dropdown.
//
// HIDDEN WHEN THE BOOK IS OFF, like the fighting styles box. Records already
// bought stay in _weaponProfs untouched, cost nothing and grant nothing; see the
// gates in getWeaponProficiencyStatus and renderProficiencySlots.
function renderWeaponGroups(root) {
  const box = root && root.querySelector('.weapon-groups-box');
  if (!box) return;

  const on = (typeof isSupplementActive === 'function') &&
             isSupplementActive('phbr1', 'weaponGroups');
  box.style.display = on ? '' : 'none';
  if (!on) return;
  if (typeof PHBR1_TIGHT_GROUPS === 'undefined') return;

  const sel = box.querySelector('.weapon-group-picker');
  const membersEl = box.querySelector('.weapon-group-members');
  const noteEl = box.querySelector('.weapon-groups-note');
  if (!sel) return;

  // Built ONCE. Rebuilding on every render would discard the player's selection
  // mid-decision -- the same reason buildClimbingControls separates build from
  // render, and the opposite of renderToolsSubtabs, whose selection lives on the
  // root rather than in the DOM.
  if (!sel.options.length) {
    const opt = (g, tier, cost) => {
      const n = (getPHBR1GroupMembers(g) || []).length;
      const o = document.createElement('option');
      o.value = g;
      o.dataset.tier = tier;
      o.textContent = g + ' \u2014 ' + cost + ' slots (' + n + ' weapons)';
      return o;
    };
    const mk = (label, obj, tier) => {
      const og = document.createElement('optgroup');
      og.label = label;
      Object.keys(obj).sort().forEach(g =>
        og.appendChild(opt(g, tier, PHBR1_GROUP_SLOT_COST[tier])));
      sel.appendChild(og);
    };
    mk('Tight groups \u2014 2 slots', PHBR1_TIGHT_GROUPS, 'tight');
    mk('Broad groups \u2014 3 slots', PHBR1_BROAD_GROUPS, 'broad');
  }

  // What he is about to buy. Pole Weapons has 28 members and Blades 14; nobody
  // should have to commit three slots to find out which.
  const showMembers = () => {
    if (!membersEl) return;
    const members = getPHBR1GroupMembers(sel.value) || [];
    membersEl.textContent = members.length
      ? members.join(' \u00b7 ')
      : '';
  };
  showMembers();

  if (noteEl) {
    noteEl.textContent =
      'Grants proficiency in every weapon listed, with no unfamiliarity penalty. ' +
      'A group can never be specialized in \u2014 buy the group, then specialize the ' +
      'individual weapon at its normal cost.';
  }

  // Bound once, flagged on the box. This renders from renderProficiencySlots,
  // which runs from recalculateAll on every keystroke, so an unguarded
  // addEventListener would stack a listener per keypress.
  if (!box._wgBound) {
    box._wgBound = true;
    sel.addEventListener('change', showMembers);

    const addBtn = box.querySelector('.add-weapon-group');
    if (addBtn) addBtn.onclick = () => {
      const name = sel.value;
      const tier = sel.options[sel.selectedIndex] &&
                   sel.options[sel.selectedIndex].dataset.tier;
      if (!name || !tier) return;
      if (!root._weaponProfs) root._weaponProfs = [];

      const nz = s => String(s || '').trim().toLowerCase();
      if (root._weaponProfs.some(p => p && p.groupTier && nz(p.name) === nz(name))) {
        alert('You already have proficiency in the ' + name + ' group.');
        return;
      }

      // ADVISORY, NEVER BLOCKING. Buying Blades when you already hold Long
      // Blades is wasteful rather than illegal, and a DM may have his own view.
      // Say so and let him decide -- the same treatment kit restrictions get.
      const members = getPHBR1GroupMembers(name) || [];
      const covered = root._weaponProfs.filter(p => {
        if (!p) return false;
        if (p.groupTier) {
          const sub = getPHBR1GroupMembers(p.name) || [];
          return sub.length && sub.every(w =>
            members.some(m => nz(m) === nz(w)));
        }
        return members.some(m => nz(m) === nz(p.name) ||
          (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(m, p.name)));
      }).map(p => p.name);

      if (covered.length) {
        const ok = confirm(
          'The ' + name + ' group already covers what you have paid for separately:\n\n  ' +
          covered.join(', ') +
          '\n\nThose slots are not refunded and nothing is removed. Add the group anyway?');
        if (!ok) return;
      }

      root._weaponProfs.push({
        name: name,
        groupTier: tier,
        slots: PHBR1_GROUP_SLOT_COST[tier]
      });

      if (typeof renderWeaponProficiencies === 'function') renderWeaponProficiencies(root);
      const tab = document.querySelector('.tab.active');
      if (tab && typeof markUnsaved === 'function') markUnsaved(tab, true, root);
    };
  }
}

function renderProficiencySlots(root) {
  refreshWeaponBrowserIfOpen(root);
  // FIRST statement deliberately. This function has two early returns below --
  // missing elements, and an unrecognized class whose budget cannot be computed
  // -- and the Proficiency Abilities section must still render for a homebrew
  // class. Threading the call through both branches would be fragile, so it
  // leads instead. Same reason renderWisGateNote leads renderSpellSlots.
  if (typeof renderProficiencyAbilities === 'function') renderProficiencyAbilities(root);

  // PHBR1 pp.61-64. Shown only when the book is on; the four fields keep their
  // values either way, so switching the book off and on again returns the
  // character to exactly where he was.
  renderWeaponGroups(root);

  const stylesBox = root.querySelector('.fighting-styles');
  if (stylesBox) {
    stylesBox.style.display =
      (typeof isSupplementActive === 'function' && isSupplementActive('phbr1', 'fightingStyles'))
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
  let groupCount = 0;
  weaponProfs.forEach(w => {
    // `|| 1` cannot distinguish an ABSENT slots value from a deliberate ZERO,
    // and 0 is falsy -- so a free proficiency was charged a slot anyway. The
    // cestus is the first weapon to need it (PHBR1 p.96: no proficiency
    // required, which is why specializing costs one slot rather than two), and
    // core_wp.json now carries a `No Proficiency` column so others can follow
    // without code changes.
    const wSlots = parseInt(w.slots, 10);

    // PHBR1 pp.58-60. A GROUP record is priced by its tier, not by the stored
    // slots value -- 2 for tight, 3 for broad -- so a costing change in a later
    // printing is one edit to PHBR1_GROUP_SLOT_COST rather than a migration of
    // every saved character. The stored value is the fallback.
    //
    // COSTS NOTHING WHEN THE BOOK IS OFF, because it GRANTS nothing when the
    // book is off -- getWeaponProficiencyStatus gates identically. Charging for
    // a suspended benefit would be the worst of both. Same treatment
    // getFightingStyles gives a style: suspended, never refunded, never deleted.
    if (w.groupTier) {
      const phbr1On = (typeof isSupplementActive === 'function') &&
                      isSupplementActive('phbr1', 'weaponGroups');
      if (phbr1On) {
        const tierCost = (typeof PHBR1_GROUP_SLOT_COST === 'object')
          ? PHBR1_GROUP_SLOT_COST[w.groupTier] : undefined;
        wpSpent += (tierCost !== undefined) ? tierCost : (isNaN(wSlots) ? 2 : wSlots);
        groupCount++;
      }
      // A GROUP IS NEVER SPECIALIZED (p.60): "this doesn't mean a character can
      // specialize in an entire group of weapons... He'd have to take one-slot
      // Specializations individually." Returning here rather than guarding the
      // branch below, so a stray `specialized` flag on a group record -- which
      // the UI must never produce -- cannot silently charge for it either.
      return;
    }

    wpSpent += isNaN(wSlots) ? 1 : wSlots;
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
  // PHBR1 pp.74-78, same budget. Punching and Wrestling cost nothing to KNOW,
  // so only the specializing slots are charged; Martial Arts costs one slot
  // just to learn.
  if (typeof getUnarmedStyleSlots === 'function') wpSpent += getUnarmedStyleSlots(root);

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
    const cost = getNWPSlotCost(n, allowedGroups, root);
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

  // PHBR3 p.25, Language and Communication: "one extra nonweapon proficiency
  // slot each level, and must use that slot to acquire a language."
  //
  // MODELLED AS AN OFFSET AGAINST LANGUAGE SPEND, not as an addition to the
  // budget. The book restricts these slots to languages; adding them to
  // nwpTotal would let them be spent on Herbalism with nothing to object. The
  // min() means a grant can never exceed what languages actually cost, so it
  // cannot subsidize anything else, and the displayed total is the same either
  // way.
  const langGrant = getSpecialtyPriestOverride(root, 'sp_language_slot')
    ? Math.min(parseInt(val(root, 'level') || 1, 10), langSpent)
    : 0;
  nwpSpent -= langGrant;

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
  if (langSpent > 0) {
    spendParts.push(langGrant > 0
      ? `${langSpent} on languages (${langGrant} granted)`
      : `${langSpent} on languages`);
  }
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
    if (groupCount > 0) {
      t += `\n  (includes ${groupCount} weapon group${groupCount > 1 ? 's' : ''};`;
      t += `\n   tight ${PHBR1_GROUP_SLOT_COST.tight} slots, broad ${PHBR1_GROUP_SLOT_COST.broad};`;
      t += `\n   PHBR1 pp.58-60. A group grants proficiency in`;
      t += `\n   every weapon in it, but can never be specialized`;
      t += `\n   in -- specialize the individual weapon instead.)`;
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

  // PHBR3 p.90: the War priest "must choose ONE weapon from the list of weapons
  // available and specialize in that weapon." One, not several. Nothing in the
  // PHB limits a fighter this way, so this is checked only where the permission
  // came from a priesthood -- getSpecialtyPriestOverride returns '' for anyone
  // else, including every fighter.
  const advisoryDiv = root.querySelector('.weapon-profs-advisory');
  if (advisoryDiv) {
    const isPriestSpec = (typeof getSpecialtyPriestOverride === 'function') &&
                         getSpecialtyPriestOverride(root, 'sp_weapon_spec');
    const specCount = (root._weaponProfs || []).filter(p => p.specialized).length;
    if (isPriestSpec && specCount > 1) {
      advisoryDiv.textContent =
        'PHBR3 p.90: a specialty priest may specialize in ONE weapon only \u2014 ' +
        specCount + ' are marked. The bonuses still apply; ask your DM.';
      advisoryDiv.style.display = '';
    } else {
      advisoryDiv.textContent = '';
      advisoryDiv.style.display = 'none';
    }
  }

  const listDiv = root.querySelector('.weapon-profs-list');
  
  if (!listDiv) return;
  
  const weaponProfs = root._weaponProfs || [];
  
  listDiv.innerHTML = '';
  
  if (weaponProfs.length === 0) {
    const emptyDiv = document.createElement('p');
    emptyDiv.style.cssText = 'color:var(--muted);font-size:12px;padding:8px;';
    emptyDiv.textContent = 'No weapon proficiencies yet.';
    listDiv.appendChild(emptyDiv);
    // Same reasoning as the nonweapon list above.
    if (typeof renderKitAdvisories === 'function') renderKitAdvisories(root);
    return;
  }
  
  // PHB: weapon specialization is available to SINGLE-CLASS FIGHTERS ONLY, and
  // is itself an optional rule (Ch.5) -- switching it off in Settings hides the
  // control and stops the slot charge, without clearing anyone's saved flag.
  const specRuleOn = (typeof isOptionalRule !== 'function') || isOptionalRule('weaponSpecialization');
  const specAllowed = specRuleOn && canSpecialize(root);

  // DISPLAY ORDER ONLY -- a group card, then the specialization cards it covers,
  // then everything else in the order it was bought. `_weaponProfs` is NOT
  // reordered: the delete buttons carry the ARRAY index, so a display sort that
  // renumbered them would delete the wrong record. Hence pairs of {p, i}.
  //
  // Only slots:0 specialization cards tuck. A weapon bought normally that later
  // fell inside a group was still paid for on its own and keeps its place.
  const wpDisplay = (function () {
    const items = weaponProfs.map((p, i) => ({ p: p, i: i }));
    if (typeof getPHBR1GroupMembers !== 'function') return items;
    const groups = items.filter(x => x.p && x.p.groupTier);
    if (!groups.length) return items;

    const nz = s => String(s || '').trim().toLowerCase();
    // FIRST covering group wins when several apply -- a dagger held through both
    // Short Blades and Blades tucks under whichever was bought first, and stays
    // there. Deterministic beats clever.
    const coverOf = x => {
      if (!x.p || x.p.groupTier) return -1;
      if (parseInt(x.p.slots, 10) !== 0 || !x.p.specialized) return -1;
      const g = groups.find(gr => {
        const m = getPHBR1GroupMembers(gr.p.name) || [];
        return m.some(w => nz(w) === nz(x.p.name) ||
          (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(w, x.p.name)));
      });
      return g ? g.i : -1;
    };

    const tucked = {};
    const rest = [];
    items.forEach(x => {
      const gi = coverOf(x);
      if (gi >= 0) (tucked[gi] = tucked[gi] || []).push(x);
      else rest.push(x);
    });

    const out = [];
    rest.forEach(x => {
      out.push(x);
      if (x.p && x.p.groupTier && tucked[x.i]) out.push.apply(out, tucked[x.i]);
    });
    return out;
  })();

  wpDisplay.forEach(({ p: prof, i: index }) => {
    const profDiv = document.createElement('div');
    profDiv.className = 'weapon-prof-item';
    profDiv.style.cssText = 'padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);display:flex;justify-content:space-between;align-items:center;';

    // A GROUP RECORD IS A DIFFERENT KIND OF THING and gets its own card. The
    // Type dropdown asks which specific weapon this is -- a group is not one --
    // and the Specialized checkbox contradicts PHBR1 p.60 outright. Ticking it
    // would also be silently inert, since renderProficiencySlots returns before
    // the specialization branch for group records.
    if (prof.groupTier) {
      const gOn = (typeof isSupplementActive === 'function') &&
                  isSupplementActive('phbr1', 'weaponGroups');
      const gMembers = (typeof getPHBR1GroupMembers === 'function')
        ? (getPHBR1GroupMembers(prof.name) || []) : [];
      const gCost = gOn
        ? ((typeof PHBR1_GROUP_SLOT_COST === 'object' &&
            PHBR1_GROUP_SLOT_COST[prof.groupTier]) || prof.slots || 0)
        : 0;

      // SUSPENDED, NOT HIDDEN, when the book is off. Hiding it would take the
      // Delete button with it and leave an unreachable record on the character.
      // Same treatment as the stale "Specialized (N/A)" flag below.
      const gSuspended = !gOn
        ? '<span style="font-size:11px;color:var(--warning, #e0a34a);margin-left:8px;" ' +
          'title="PHBR1 core rules are switched off in Settings, so this group grants ' +
          'nothing and costs nothing. It is kept exactly as bought -- switch the book ' +
          'back on and it applies again.">suspended \u2014 PHBR1 off</span>'
        : '';

      // Dim the TEXT, never the button. A suspended card is inert and should
      // read that way, but Delete is the only way to remove it and must stay
      // legible -- the lesson makeMemSpellNode records about row-wide opacity.
      profDiv.innerHTML =
        '<div style="flex:1;' + (gOn ? '' : 'opacity:0.55;') + '">' +
          '<strong>' + escapeHtml(prof.name) + '</strong>' +
          '<span style="margin-left:8px;font-size:11px;color:var(--muted);">' +
            escapeHtml(prof.groupTier) + ' group' +
          '</span>' + gSuspended +
          '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' +
            'Slots: ' + gCost + ' \u00b7 ' + gMembers.length + ' weapons' +
          '</div>' +
          (gMembers.length
            ? '<details class="disclosure" style="font-size:11px;margin-top:4px;">' +
              '<summary>weapons covered</summary>' +
              '<div style="color:var(--muted);margin-top:4px;line-height:1.5;">' +
                escapeHtml(gMembers.join(' \u00b7 ')) +
              '</div></details>'
            : '') +
        '</div>' +
        '<button class="delete-weapon-prof" data-index="' + index + '" ' +
          'style="padding:4px 8px;font-size:11px;margin-left:8px;">Delete</button>';

      listDiv.appendChild(profDiv);
      return;
    }

    const specCost = getSpecializationCost(prof.group);
    // Only charge for specialization when the rule is actually in play. The
    // flag is left alone so ticking the rule back on restores it intact.
    // Same trap as the counter in renderProficiencySlots: `|| 1` cannot tell an
    // ABSENT slots value from a deliberate ZERO, and 0 is falsy. The cestus
    // (PHBR1 p.96, no proficiency required) stores 0 and was displaying 1, so
    // the rows added up to more than the counter reported. isNaN is the test
    // that means "absent"; `|| 1` means "absent OR zero".
    const profSlots = parseInt(prof.slots, 10);
    const totalSlots = (isNaN(profSlots) ? 1 : profSlots) +
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

    // A slots:0 specialization card looks like a bug without this -- the
    // proficiency was paid for by a group, and the card must say which one or
    // the zero is unexplained. Also drives the indent that tucks it under its
    // group in the list.
    const coveringGroup = (function () {
      if (prof.groupTier || parseInt(prof.slots, 10) !== 0) return '';
      if (typeof getPHBR1GroupMembers !== 'function') return '';
      const nz = s => String(s || '').trim().toLowerCase();
      const g = weaponProfs.find(q => {
        if (!q || !q.groupTier) return false;
        const m = getPHBR1GroupMembers(q.name) || [];
        return m.some(w => nz(w) === nz(prof.name) ||
          (typeof samePHBR1Proficiency === 'function' && samePHBR1Proficiency(w, prof.name)));
      });
      return g ? g.name : '';
    })();
    if (coveringGroup) profDiv.style.marginLeft = '18px';

    profDiv.innerHTML = `
      <div style="flex:1;">
        <strong>${escapeHtml(prof.name)}</strong>
        <span style="margin-left:8px;font-size:11px;color:var(--muted);">${profGroup || '\u2014'}</span>
        ${coveringGroup ? `<span style="margin-left:8px;font-size:11px;color:var(--accent-light);"
            title="Proficiency comes from the ${escapeHtml(coveringGroup)} group, so it cost no slot of its own. Only the specialization was paid for.">covered by ${escapeHtml(coveringGroup)}</span>` : ''}
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

  if (typeof renderKitAdvisories === 'function') renderKitAdvisories(root);
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
  
  // renderWeaponProficiencies fires renderKitAdvisories itself, at its tail.
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
    const effCost   = getNWPSlotCost(nwp, allowedGroups, root);
    const isCrossover = effCost > baseSlots;

    const slotText = isCrossover
      ? `<span style="color:var(--error, #ff6b6b);" title="${nwpSurchargeTitle(nwp, allowedGroups, root)}">Slots: ${effCost} (${baseSlots} +1 ${nwpSurchargeLabel(nwp, allowedGroups, root)})</span>`
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
  
  // The browser's Learn path. Adding a proficiency can satisfy a kit's
  // bonusChoice or required entry, which changes whether it is granted and
  // whether the advisory still applies -- and neither renderNWProficiencies nor
  // recalculateAll reaches the kit renderers.
  if (typeof renderKitAbilities === 'function') renderKitAbilities(root);
  else renderNWProficiencies(root);
  
  // Mark as unsaved
  const tab = document.querySelector('.tab.active');
  if (tab) markUnsaved(tab, true, root);
}

// Row text and tooltip for a surcharged proficiency. Both ask getNWPSurcharge
// rather than inferring from the cost, because cost alone cannot distinguish a
// PHB Table 38 class-group charge from a PHBR2 kit charge -- and the row used to
// assert Table 38 for both, on proficiencies that were in group.
function nwpSurchargeLabel(nwp, allowedGroups, root) {
  const src = (typeof getNWPSurcharge === 'function')
    ? getNWPSurcharge(nwp, allowedGroups, root).source : 'class';
  return src === 'kit' ? 'off-kit' : 'out-of-group';
}

function nwpSurchargeTitle(nwp, allowedGroups, root) {
  const src = (typeof getNWPSurcharge === 'function')
    ? getNWPSurcharge(nwp, allowedGroups, root).source : 'class';
  if (src === 'kit') {
    return 'Off-kit proficiency: +1 slot (PHBR2 p.16). This proficiency is in one ' +
           'of your class groups, but your kit is not listed as appropriate for it, ' +
           'so it costs one slot more \u2014 just as if it belonged to another class.';
  }
  if (src === 'both') {
    return 'Out-of-group AND off-kit: +1 slot total, not +2. PHB Table 38 and PHBR2 ' +
           'p.16 would each charge one slot, and PHBR2 states the kit rule as an ' +
           'equivalence rather than an addition, so only one applies.';
  }
  return 'Out-of-group proficiency: +1 slot (PHB Table 38)';
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
    // The advisory still has to run. An EMPTY list is precisely when a kit's
    // required and bonusChoice entries are all unsatisfied, so returning before
    // the call at the tail left the banner stale when the LAST proficiency was
    // deleted -- while deleting one of several worked, because the function ran
    // to completion.
    if (typeof renderKitAdvisories === 'function') renderKitAdvisories(root);
    return;
  }
  
  // Effective costs include the PHB Table 38 out-of-group surcharge.
  const nwpAllowedGroups = getAllowedNWPGroups(root);

  nwps.forEach((nwp, index) => {
    const nwpDiv = document.createElement('div');
    nwpDiv.className = 'nwp-item';
    nwpDiv.style.cssText = 'padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:4px;background:var(--glass);';

    const baseSlots = parseInt(nwp.slots, 10) || 1;
    const effCost   = getNWPSlotCost(nwp, nwpAllowedGroups, root);
    // A proficiency that costs nothing must SAY why, or it reads as a bug.
    // GRANTED in words rather than a colour alone: the status vocabulary is full
    // at five tokens, and this is a claim about where a proficiency CAME FROM,
    // not a rules state of the character.
    const slotText  = nwp.isKitGranted
      ? `<span style="color:var(--accent-light);" title="Granted free by your kit ` +
        `(PHBR11 p.77, PHBR1 p.37). Bonus proficiencies are NOT lost if you abandon ` +
        `the kit -- you keep them, but must pay for them out of the next free slots ` +
        `you have available.">GRANTED \u00B7 0 slots</span>`
      : effCost > baseSlots
      ? `<span style="color:var(--error, #ff6b6b);" title="${nwpSurchargeTitle(nwp, nwpAllowedGroups, root)}">Slots: ${effCost} (${baseSlots} +1 ${nwpSurchargeLabel(nwp, nwpAllowedGroups, root)})</span>`
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

  // The advisory is wired HERE rather than at each mutation site. Add, delete
  // and add-custom are three chances to forget, and I forgot. Everything that
  // changes this list already ends up here.
  if (typeof renderKitAdvisories === 'function') renderKitAdvisories(root);
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
      text: 'Melee attack against anything within 10 ft, at &minus;4 to the check. Failure means landing badly for 1d3 damage.' },
    // PHBR1 p.85, "Lances and Dismounting". THE ONLY DEFENSIVE ENTRY on this
    // panel -- every other feat is something the rider CHOOSES to attempt; this
    // one is forced on him by being hit, which is why it carries its own tag
    // rather than reading as a seventh trick he can pull.
    //
    // "AFTER DOUBLING" is load-bearing and easy to miss: the DMG doubles lance
    // damage on a charge, so the 8-point threshold is measured against the
    // DOUBLED figure. A medium lance at 1d6+1 doubled averages 9, so this fires
    // far more often than the number suggests.
    //
    // No modifier is stated, so it is the plain Riding check shown above.
    { check: 'defend', name: 'Staying in the saddle when lanced',
      text: 'Anytime a lance hits you while mounted and does <strong>8 or more points ' +
            'of damage after doubling</strong>, you must make this check or be ' +
            'dismounted, falling for an additional 1&ndash;2 damage. The lance is designed ' +
            'to unhorse as much as to wound. In a joust both riders strike at once, so ' +
            'both can fail and land together.' }
  ];

  const tag = f => f.check === 'no'
    ? '<span style="color:var(--success, #6fbf73);">automatic</span>'
    : f.check === 'penalty'
    ? '<span style="color:var(--warning, #e0a34a);">check at &minus;4</span>'
    : f.check === 'defend'
    ? '<span style="color:var(--error, #ff6b6b);">check or fall</span>'
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

// --- Tumbling (PHB Ch.5) ---
// CALCULATOR. Placed BEFORE jumping so the two acrobatic panels sit together.
//
// THE +4 AC IS NOT A finalAC TERM, and deliberately. The book grants it only
// "against attacks directed solely at him in any round of combat, provided he
// has the initiative and foregoes all attacks that round" -- three conditions
// resolved at the table, in a single round, one of which costs the character
// his entire action. A standing term in the AC field would claim it in every
// round including the ones he spends attacking. Same reasoning as the PHBR2
// equipment panel: situational modifiers belong to the moment, not the sheet.
//
// PHBR2 Table 37 will later replace the flat +4 and +2 with an armor-dependent
// row. Its No Armor column IS +4 and +2, so the figures below are that table's
// first column and nothing here will contradict it.
PROF_ABILITY_BUILDERS['tumbling'] = function (root, entry, panelEl) {
  // An empty category means encumbrance has not been computed yet, not that the
  // character is overloaded -- do not lock the panel on a blank.
  const cat = String(val(root, 'encumbrance_category') || '').trim();
  const ok  = (cat === '' || cat === 'Unencumbered' || cat === 'Light');
  const c   = getNWPCheckTarget(root, entry.nwp);

  // PHBR2 Table 37 REPLACES the PHB's flat +4 and +2, which is safe because its
  // No Armor column IS +4 and +2 -- the same relationship Table 38's first three
  // columns have to Table 29. With the band off these stay the book's figures.
  const acro = (typeof getAcrobaticArmorMods === 'function')
    ? getAcrobaticArmorMods(root) : null;
  const defAC  = acro ? acro.row.tumbleDef : 4;
  const atkAdj = acro ? acro.row.tumbleAtk : 2;
  const fallMod = (acro && typeof acro.row.falling === 'number') ? acro.row.falling : 0;
  const aName = acro ? ' \u00B7 ' + escapeHtml(acro.name) : '';

  const row = (name, fig, note) =>
    '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
      '<span style="width:150px;flex-shrink:0;"><strong>' + escapeHtml(name) + '</strong></span>' +
      '<span style="color:var(--accent-light);width:90px;flex-shrink:0;">' + fig + '</span>' +
      '<span style="color:var(--muted);flex:1;min-width:200px;">' + note + '</span>' +
    '</div>';

  panelEl.innerHTML =
    paBox(ok ? 'Available \u2014 ' + (cat || 'no load recorded')
             : 'Unavailable \u2014 ' + escapeHtml(cat) + ' encumbrance',
          ok ? 'Tumbling can only be performed at light encumbrance or less.'
             : 'Tumbling can only be performed while burdened with light encumbrance ' +
               'or less. Drop weight to use any of the below.') +
    '<div style="font-size:11px;' + (ok ? '' : 'opacity:.5;') + '">' +
    row('Defensive', (defAC ? '+' + defAC + ' AC' : 'none') + aName,
        'Against attacks directed SOLELY at him, in any round of combat, provided he ' +
        'has the INITIATIVE and FOREGOES ALL ATTACKS that round. Situational, so it is ' +
        'not added to the Armor Class field \u2014 claim it at the table for the round.') +
    row('Attack', (atkAdj ? '+' + atkAdj + ' to hit' : 'none') + aName,
        'In UNARMED combat only.' +
        (acro && !atkAdj ? ' This armor removes the bonus entirely.' : '')) +
    (c.hasCheck
    ? row('Falling', paFmt(c.target + fallMod) +
                       (fallMod ? ' (' + c.target + ' ' + fallMod + ')' : ''),
            'One proficiency check on ' + escapeHtml(c.abilityLabel) + '. On a success: ' +
            'NO damage from a fall of 10 feet or less, and HALF damage from a fall of ' +
            '60 feet or less. Falls from greater heights do normal damage however the ' +
            'check goes.' + (c.alwaysFailsOn20 ? ' A natural 20 always fails.' : ''))
      : '') +
    '</div>';
};

// --- Jumping (PHB Ch.5) ---
// CALCULATOR. The book gives formulas and two height caps; this resolves them
// against the character's own level and height so nothing is worked out at the
// table. No proficiency check is mentioned for jumping itself.
PROF_ABILITY_BUILDERS['jumping'] = function (root, entry, panelEl) {
  const st = getProfAbilityState(root, 'jumping');
  const lvl = paLevel(root);
  const half = Math.floor(lvl / 2);
  const h = paHeightInches(root);
  const ft = n => (n / 12).toFixed(1).replace(/\.0$/, '');
  const capBroad = h ? ft(h * 6) + ' ft' : null;
  const capHigh  = h ? ft(h * 1.5) + ' ft' : null;

  // PHBR2 Table 37. The jump rows adjust a DISTANCE IN FEET, so they are shown
  // as a separate term rather than folded into the dice expression -- "2d6 + 5
  // ft, armor -15 ft" stays readable where "2d6 - 10 ft" does not.
  const acro = (typeof getAcrobaticArmorMods === 'function')
    ? getAcrobaticArmorMods(root) : null;
  const aj = k => (acro && typeof acro.row[k] === 'number') ? acro.row[k] : 0;
  const trimFt = n => String(Number(n.toFixed(2)));
  const armorNote = k => {
    const v = aj(k);
    if (!v) return null;
    return 'Armor (' + escapeHtml(acro.name) + ') ' + (v > 0 ? '+' : '') + trimFt(v) + ' ft';
  };

  const jumps = [
    { n: 'Running broad jump', f: `2d6 + ${lvl} ft`,  c: capBroad ? `max ${capBroad} (6\u00D7 height)` : null,
      a: armorNote('broadRun'), note: 'Needs a 20-foot running start.' },
    { n: 'Running high jump',  f: `1d3 + ${half} ft`, c: capHigh ? `max ${capHigh} (1\u00BD\u00D7 height)` : null,
      a: armorNote('highRun'), note: 'Needs a 20-foot running start.' },
    { n: 'Standing broad jump', f: `1d6 + ${half} ft`, c: null,
      a: armorNote('broadStand'), note: 'No run-up.' },
    { n: 'Standing high jump',  f: '3 ft',             c: null,
      a: armorNote('highStand'), note: 'No run-up. A flat figure.' }
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
      '<span style="color:var(--muted);">' + (j.c ? j.c + ' \u00B7 ' : '') + escapeHtml(j.note) +
        (j.a ? '<br><span style="color:var(--warning, #e0a34a);">' + j.a + '</span>' : '') +
      '</span>' +
      '</div>').join('') +
    '</div>' +
    // p.114, and it is NOT a floor at zero: "Should the resulting total be less
    // than zero, the character fails the acrobatic feat entirely (probably by
    // tripping and landing flat on his face)." Clamping would have turned a
    // pratfall into standing still.
    (acro
      ? '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">' +
        'A jump whose adjusted distance comes out <strong style="color:var(--text);">below zero ' +
        'is a failed attempt</strong>, not a jump of no distance \u2014 the character trips and ' +
        'lands flat on his face.</div>'
      : '') +
        // POLE LENGTH IS AN INPUT, because every vault figure derives from it and
    // nothing else: span is 1.5x the pole, the height cleared IS the pole, and
    // the feet-landing obstacle is half of it. Prose made the player do three
    // multiplications at the table for a number the panel already had.
    //
    // EPHEMERAL, like every other panel condition here -- which pole he happens
    // to be holding is true of the moment, not of the character.
    //
    // The legal range is ADVISORY. A pole outside 4-10 feet longer than his
    // height still computes; it just says so. Warn, never block.
    (function () {
      const trim = n => String(Number(n.toFixed(2)));
      const poleMin = h ? (h + 48) / 12 : null;
      const poleMax = h ? (h + 120) / 12 : null;
      const poleVal = parseFloat(st.pole);
      const pole = (!isNaN(poleVal) && poleVal > 0) ? poleVal : null;
      const outOfRange = (pole !== null && poleMin !== null) &&
                         (pole < poleMin - 0.001 || pole > poleMax + 0.001);
      // PHBR2 p.114 CREATES a check the PHB does not have: "To successfully get
      // off the ground in armor bulkier than leather requires a proficiency
      // check, adjusted, as indicated on Table 37." A NULL poleVault entry means
      // no check is required at all -- which is why the No Armor column prints a
      // dash rather than a zero.
      const pvMod = (acro && typeof acro.row.poleVault === 'number') ? acro.row.poleVault : null;
      const pvChk = (pvMod !== null && entry && entry.nwp)
        ? getNWPCheckTarget(root, entry.nwp) : null;
      // "a pole vaulter with armor heavier or bulkier than studded or padded can
      // vault no higher than the height of the pole" -- the columns at or beyond
      // hide, which is where Table 37's own ordering puts the break.
      const pvCapped = !!acro &&
        ['hide','ring_chain','brigandine_splint','scale_banded','plate_mail','plate_armor']
          .indexOf(acro.col) !== -1;

      return '<div style="font-size:11px;margin-bottom:12px;">' +
        '<div style="font-weight:600;margin-bottom:4px;">Pole vault</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
          '<input type="number" class="jmp-pole" min="0" step="0.5" ' +
            'value="' + (pole !== null ? trim(pole) : '') + '" placeholder="ft" ' +
            'style="width:64px;flex-shrink:0;padding:2px 4px;font-size:11px;">' +
          '<span>Pole length' +
            (poleMin !== null
              ? ' <span style="color:var(--muted);">(' + trim(poleMin) + ' to ' +
                trim(poleMax) + ' ft for his height)</span>'
              : ' <span style="color:var(--muted);">(set Height to see his legal range)</span>') +
          '</span>' +
        '</div>' +
        (pole !== null
          ? '<div style="display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap;">' +
              '<span style="width:150px;flex-shrink:0;"><strong>Distance spanned</strong></span>' +
              '<span style="color:var(--accent-light);width:110px;flex-shrink:0;">' +
                trim(pole * 1.5) + ' ft</span>' +
              '<span style="color:var(--muted);">1\u00BD times the pole.</span></div>' +
            '<div style="display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap;">' +
              '<span style="width:150px;flex-shrink:0;"><strong>Height cleared</strong></span>' +
              '<span style="color:var(--accent-light);width:110px;flex-shrink:0;">' +
                trim(pole) + ' ft</span>' +
              '<span style="color:var(--muted);">Equal to the pole.</span></div>' +
            '<div style="display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap;">' +
              '<span style="width:150px;flex-shrink:0;"><strong>Land on his feet</strong></span>' +
              '<span style="color:var(--accent-light);width:110px;flex-shrink:0;">up to ' +
                trim(pole / 2) + ' ft</span>' +
              '<span style="color:var(--muted);">Only over an obstacle no higher than half the pole.</span></div>' +
            // paFmt, NOT a hand-rolled "roll N or less": a target below 1 has to
            // read "no roll can succeed", and in plate mail it frequently is one
            // -- Str 12 against Table 37's -12 lands exactly on zero. The figure
            // was right; "roll 0 or less" was an instruction nobody can follow.
            (pvMod !== null && pvChk && pvChk.hasCheck
              ? '<div style="color:var(--warning, #e0a34a);margin-top:4px;">Armor (' +
                escapeHtml(acro.name) + '): getting off the ground needs a ' +
                escapeHtml(pvChk.abilityLabel) + ' proficiency check \u2014 <strong>' +
                paFmt(pvChk.target + pvMod) + '</strong> (' + pvChk.target + ' ' + pvMod + ').' +
                (pvChk.target + pvMod < 1
                  ? ' He cannot vault in this armor.'
                  : '') + '</div>'
              : '') +
            (pvCapped
              ? '<div style="color:var(--warning, #e0a34a);margin-top:4px;">In this armor he ' +
                'can vault no higher than the height of the pole.</div>'
              : '') +
            (outOfRange
              ? '<div style="color:var(--warning, #e0a34a);margin-top:4px;">A pole for this ' +
                'character should be ' + trim(poleMin) + ' to ' + trim(poleMax) + ' ft \u2014 4 to 10 ' +
                'feet longer than his height. Figures above still apply if your DM allows it.</div>'
              : '')
          : '<div style="color:var(--muted);">Enter a pole length for the vault figures.</div>') +
        '</div>';
    })() +
    '<details class="disclosure" style="font-size:11px;">' +
    '<summary>pole vault rules</summary>' +
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

  const poleEl = panelEl.querySelector('.jmp-pole');
  if (poleEl) poleEl.onchange = () => {
    st.pole = poleEl.value;
    renderProficiencyAbilities(root);
  };
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
    // PHBR2 Table 37 armour, when the band is on. Applied OUTSIDE the
    // Math.min(0, ...) that caps width relief: a balancing rod offsets a narrow
    // rope, it does not offset a suit of plate mail.
    const acro = (typeof getAcrobaticArmorMods === 'function')
      ? getAcrobaticArmorMods(root) : null;
    const armorPen = (acro && typeof acro.row.tightrope === 'number') ? acro.row.tightrope : 0;
    const relief = slots + (rod ? 2 : 0);
    const pen = Math.min(0, band.pen + relief) - wind + armorPen;
    const target = (c.hasCheck ? c.target : 0) + pen + coop;
    const parts = [];
    if (band.pen) parts.push('Width ' + band.pen);
    if (relief)   parts.push('Reduced by ' + relief + (rod ? ' (rod' + (slots ? ' + slots' : '') + ')' : ' (extra slots)'));
    if (wind)     parts.push('Wind or vibration -' + wind);
    if (armorPen) parts.push('Armor (' + acro.name + ') ' + armorPen);
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
    // Record the decline BEFORE the splice, while the record is still readable.
    // Only a GRANTED record needs it -- deleting one the player bought himself
    // is just a deletion.
    const gone = root._nwps[index];
    if (gone && gone.isKitGranted) {
      if (!Array.isArray(root._declinedGrants)) root._declinedGrants = [];
      if (!root._declinedGrants.some(d =>
            String(d).trim().toLowerCase() === String(gone.name).trim().toLowerCase())) {
        root._declinedGrants.push(gone.name);
      }
    }
    root._nwps.splice(index, 1);
    // Removal can UN-satisfy a bonusChoice or a required entry, so the banner
    // has to come back. Same call as the add paths.
    if (typeof renderKitAbilities === 'function') renderKitAbilities(root);
    else renderNWProficiencies(root);
    
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
  
  // renderKitAbilities, not renderNWProficiencies: it calls syncKitGrantedNWPs,
  // renderKitAdvisories and renderNWProficiencies in the right order. A custom
  // proficiency can satisfy a kit's bonusChoice or required entry by name, so
  // the grant and the banner both have to be re-evaluated.
  if (typeof renderKitAbilities === 'function') renderKitAbilities(root);
  else renderNWProficiencies(root);
  
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
  // AN ABANDONED SPECIALIST IS NO LONGER OPPOSED BY ANYTHING. PHBR4 p.20 gives
  // him a chance to learn from his former opposition schools -- half of (base
  // minus 15) -- so leaving the block in place would deny him a spell the book
  // explicitly lets him attempt, and the formula above would never be reached.
  const hasAbandoned = (typeof hasAbandonedSchool === 'function') && hasAbandonedSchool(root);
  if (!hasAbandoned &&
    typeof isOppositionSpell === 'function' && isOppositionSpell(spell, clazz, root)) {
    const oppList = (typeof getOppositionSchools === 'function') ? getOppositionSchools(clazz, root).join(', ') : '';
    // WHICH TABLE ACTUALLY APPLIED. A kit may replace Table 22 outright -- PHBR4
    // Table 6 does for the Militant Wizard -- and citing the PHB for a list that
    // did not come from it sends the player to the wrong page.
    let oppCite = 'PHB Table 22';
    if (typeof getSelectedKit === 'function' && typeof SPECIALIST_WIZARDS !== 'undefined') {
      const oppKit = getSelectedKit(root);
      const oppKey = Object.keys(SPECIALIST_WIZARDS)
        .find(k => String(clazz || '').trim().toLowerCase().includes(k));
      if (oppKit && oppKit.oppositionOverride && oppKey &&
          Array.isArray(oppKit.oppositionOverride[oppKey])) {
        oppCite = oppKit.name + ' kit, PHBR4 Table 6';
      }
    }
    reasons.push('Opposition school for your specialty' +
                 (oppList ? ' (' + oppList + ')' : '') +
                 ' \u2014 cannot be learned (' + oppCite + ').');
  }

  // (3) and (4) are PRIEST rules and apply only to priest spells. Detected from
  // spell.class, falling back to "does it have spheres at all" so a saved record
  // without a class field is still judged correctly.
  const spellIsPriest =
    String(spell.class || '').toLowerCase().includes('priest') ||
    ((typeof getSpellSpheres === 'function') && getSpellSpheres(spell).length > 0);

  // GREATER DIVINATION CANNOT BE A CHECKBOX. Spell Access offers "Divination"
  // as one box, but PHBR4's 1d8 list bars "greater divination" -- divination of
  // 5TH LEVEL OR HIGHER -- and lesser divination stays open to every wizard.
  // Unticking the box would take both. So the other seven schools are enforced
  // by unticking in Spell Access and this one is enforced here, on the level,
  // exactly as isOppositionSpell handles the same distinction.
  const mwBarred = (typeof getMageBarredSchools === 'function') ? getMageBarredSchools(root) : [];
  if (mwBarred.some(b => String(b).trim().toLowerCase() === 'greater divination')) {
    const mwSchools = (typeof splitClassification === 'function')
      ? splitClassification(spell.school) : [String(spell.school || '')];
    const mwLevel = (typeof spell.level === 'number')
      ? spell.level : (parseInt(spell.level, 10) || 0);
    if (mwLevel >= 5 && mwSchools.some(s => String(s).trim().toLowerCase() === 'divination')) {
      reasons.push('Greater divination is closed to you by your kit limitation ' +
                   '(PHBR4 p.40) \u2014 divination spells of 5th level and above ' +
                   'cannot be learned. Lesser divination, 4th level and below, ' +
                   'is unaffected.');
    }
  }

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
  // `abandonedForNote` joins the gate because once the class field reads Mage,
  // specSchool is null and this whole note disappears -- taking the half-chance
  // formula with it at exactly the moment it matters.
  const abandonedForNote = (typeof getFormerSpecialty === 'function') ? getFormerSpecialty(root) : '';
  if ((specSchool || abandonedForNote) && !blocked && spellLevelNum > 0) {
    // "chance to learn" -- PHBR4 p.40.
    const intScore = (typeof getEffectiveIntForSpellTable === 'function')
      ? getEffectiveIntForSpellTable(root) : (parseInt(val(root, 'int') || 0, 10));
    const baseLearn = (typeof INT_TABLE !== 'undefined' && INT_TABLE[intScore]) ? INT_TABLE[intScore][1] : 0;

    // ABANDONED SPECIALIST (PHBR4 p.20). Three branches, and the third is not a
    // modifier at all but a different formula: for schools that opposed the one
    // he gave up, the chance is HALF of (base minus 15). The book's worked
    // example is a former necromancer with Intelligence 13 learning an illusion
    // spell at 1/2 x (55 - 15) = 20 percent.
    //
    // Computed from getFormerSpecialty, NOT from the class field -- he is a mage
    // now, and the class field is expected to say so.
    const abandoned = (typeof getFormerSpecialty === 'function') ? getFormerSpecialty(root) : '';
    let halvedLearn = 0;
    if (abandoned && typeof getOppositionSchools === 'function') {
      // Passing root so an abandoned MILITANT WIZARD is judged against the
      // oppositions his kit gave him, not the PHB's -- those were the schools
      // that actually opposed him, and the half-chance formula turns on which
      // list applies.
      const wasOpp = getOppositionSchools(abandoned, root);
      const schools = (typeof splitClassification === 'function')
        ? splitClassification(spell.school) : [String(spell.school || '')];
      const nz = x => String(x || '').trim().toLowerCase();
      if (schools.some(sc => wasOpp.some(o => nz(o) === nz(sc)))) {
        halvedLearn = Math.max(1, Math.floor((baseLearn - 15) / 2));
      }
    }
    if (intScore >= 9 && baseLearn > 0) {
      // PHBR4 p.20: an abandoned specialist "no longer receives a bonus" for
      // spells of his former school. isSpecialtySpell knows nothing about
      // status -- it takes a class string, not a root -- so the gate is here,
      // where root is already in scope.
      const own = !abandoned &&
                  (typeof isSpecialtySpell === 'function') && isSpecialtySpell(spell, clazz);
      const mod = own ? 15 : -15;
      const eff = halvedLearn
        ? halvedLearn
        : Math.max(1, Math.min(100, baseLearn + mod));
      const learnNote = document.createElement('div');
      learnNote.className = 'spell-learn-note';
      learnNote.style.cssText = 'font-size:11px;color:var(--muted);text-align:right;margin-top:8px;';
      learnNote.textContent =
        // THE WHOLE PARENTHETICAL IS ONE OR THE OTHER. Leaving the modifier and
        // the school label outside the ternary appended them to the halved
        // branch too, producing "half of 85% - 15%, a school that opposed your
        // former specialty-15% no specialty school - abandoned".
        'Chance to learn: ' + eff + '% (' + (halvedLearn
          ? 'half of ' + baseLearn + '% \u2212 15%, a school that opposed your former specialty'
          : baseLearn + '% ' + (mod > 0 ? '+' : '\u2212') + '15% ' +
            (own ? 'specialty school'
                 : abandoned ? 'no specialty school \u2014 abandoned'
                 : 'non-specialty school')) + ')';
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
  const out = { max: 0, intCapped: false, kitCapped: false, clazz: '', level: 0 };

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
  // "the highest level of spells he can cast" -- PHBR4 p.40.
  const spInt = (typeof getEffectiveIntForSpellTable === 'function') ? getEffectiveIntForSpellTable(root) : int;
  const intRow = (typeof INT_TABLE !== 'undefined') ? INT_TABLE[spInt] : null;
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
      // PHBR4 p.40's FIRST limitation: "forbidden to learn 8th-level and
      // 9th-level spells from any school". A REAL CAP, not an advisory --
      // Chris's call -- with the mw-highlevel-banner saying why, because a cap
      // that does not explain itself reads as a bug.
      let kitCapped = false;
      if ((typeof getMageLimitation === 'function') &&
          getMageLimitation(root) === 'noHighLevel' && cap > 7) {
        cap = 7; kitCapped = true;
      }
      out.max = cap; out.intCapped = capped; out.kitCapped = kitCapped;
      out.clazz = p.clazz; out.level = p.level;
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
  // PHBR4 p.40 names "the maximum number of spells per level he can know" as one
  // of the four things its Intelligence limitation touches.
  const spInt = (typeof getEffectiveIntForSpellTable === 'function') ? getEffectiveIntForSpellTable(root) : int;
  const row = (typeof INT_TABLE !== 'undefined') ? INT_TABLE[spInt] : null;
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
      problems: (typeof validateKitAlignment === 'function') ? validateKitAlignment(root) : [] },
    // The remaining kit requirements, which had no consumer until now. They join
    // this banner rather than getting their own because that is what this
    // function is for -- one banner, one heading per source when a source fires
    // alone, and a Settings toggle each.
    { heading: 'Ability scores and kit (Complete handbooks)',
      problems: (typeof validateKitAbilities === 'function') ? validateKitAbilities(root) : [] },
    { heading: 'Gender and kit (Complete handbooks)',
      problems: (typeof validateKitGender === 'function') ? validateKitGender(root) : [] },
    { heading: 'Priesthood and kit (PHBR3 Ch.4)',
      problems: (typeof validateKitPriesthood === 'function') ? validateKitPriesthood(root) : [] },
    { heading: 'Specialisation and kit (PHBR4 p.34)',
      problems: (typeof validateKitSchool === 'function') ? validateKitSchool(root) : [] }
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
    const opp = (typeof isOppositionSpell === 'function') && isOppositionSpell(probe, component.clazz, root);

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

  // GREY THE CONTAINER, do not empty it. A withdrawn ability is still a fact
  // about the character -- the paladin who fell had a detect evil, and gets it
  // back on atonement. Dimming the whole list is also far cheaper than testing
  // every ability individually and looks identical.
  // AN ABANDONED SPECIALIST KEEPS HIS CLASS ABILITIES. He is a mage now, and
  // Spell Casting and Create Magic Items are the mage's, not the specialist's.
  // What he loses -- the saving throw modifiers and the acquired powers -- is
  // removed at source by addSpecialistPowersPHBR4, so there is nothing here to
  // grey and greying it would claim he had stopped being a wizard.
  const gated = (typeof abilitiesAreWithdrawn === 'function') &&
                abilitiesAreWithdrawn(root) &&
                !((typeof hasAbandonedSchool === 'function') && hasAbandonedSchool(root));
  classAbilitiesList.style.opacity       = gated ? '0.45' : '';
  classAbilitiesList.style.pointerEvents = gated ? 'none' : '';
  classAbilitiesList.title = gated
    ? 'Withdrawn while this character\u2019s class status is set. Nothing is lost \u2014 set the status back to Active and these return.'
    : '';

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
    // SEVEN OF THE EIGHT SPECIALISTS MATCHED NOTHING HERE, and had shown no
    // class abilities at all -- not even Spell Casting. The loop above tests
    // the class NAME against CLASS_ABILITIES keys by substring, and abjurer,
    // conjurer, diviner, enchanter, invoker, necromancer and transmuter
    // contain none of them. Only illusionist has a key of its own.
    // CLASS_ABILITIES.specialist existed for exactly this and nothing ever
    // routed to it. getSpecialistSchool is the single resolver for "is this a
    // specialist", so it decides here too rather than a second name list.
    if (!classData && typeof getSpecialistSchool === 'function' &&
        getSpecialistSchool(clazz)) {
      classData = CLASS_ABILITIES.specialist;
    }

    if (classData) {
      for (let lvl in classData) {
        if (parseInt(lvl, 10) <= level) {
          classData[lvl].forEach(a => {
            out.push({ name: a.name, notes: a.notes, isAuto: true });
          });
        }
      }
    }

    // PHBR4 Ch.1 save modifiers and acquired powers. Returns immediately when
    // phbr4.schoolPowers is unticked. Runs even when classData was null, so a
    // future specialist name with no CLASS_ABILITIES entry still gets them.
    if (typeof addSpecialistPowersPHBR4 === 'function') {
      addSpecialistPowersPHBR4(out, clazz, level, root);
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

// PHBR1-ONLY CONTROLS. Weapon quality and high-quality racial armour are both
// PHBR1 INVENTIONS -- unlike a magic bonus, which exists in the core rules, a DM
// running without the book is not handing out Fine weapons or gnomish
// high-quality studded leather. So with the supplement off there is nothing for
// either field to record, and they hide, exactly as the fighting-styles box and
// the weapon-groups picker already do.
//
// HIDDEN, NEVER REMOVED. collectSheet reads the DOM, so a removed control is a
// LOST VALUE. The stored quality and maker-race survive untouched underneath and
// return intact when the book is switched back on -- suspend, never delete, the
// same treatment a suspended fighting style gets.
//
// ONE FUNCTION FOR BOTH, called from recalculateAll, because the supplement
// toggle does NOT rebuild weapon and armour cards: a hook that only ran when a
// card was built would leave every existing card showing a control the setting
// had just switched off. Two separate hooks would be two things to keep in step.
function renderPHBR1OnlyControls(root) {
  if (!root) return;
  // EACH WRAPPER NAMES ITS OWN BAND via data-phbr1-band, because weapon quality
  // and high-quality racial armour are now separate toggles and one gate cannot
  // serve both. A wrapper with no attribute falls back to the whole book being
  // off, which is the safe reading for anything added later and not yet tagged.
  Array.from(root.querySelectorAll('.phbr1-only')).forEach(el => {
    const band = el.dataset.phbr1Band || '';
    const on = (typeof isSupplementActive === 'function') &&
               (band ? isSupplementActive('phbr1', band)
                     : (SUPPLEMENTS.phbr1.bandOrder || []).some(b => isSupplementActive('phbr1', b)));
    // The weapon wrapper uses display:contents so the field stays in the same
    // flex row as Size and Grip; restoring '' would make it a block and break
    // that row. Read the intent off the element rather than storing a second
    // flag on it.
    if (!el._phbr1Display) {
      el._phbr1Display = (el.style.display === 'none') ? '' : (el.style.display || '');
    }
    el.style.display = on ? el._phbr1Display : 'none';
  });

  // ARMOUR SLOT DROPDOWNS ARE REBUILT, not toggled. The wrappers above only
  // needed hiding because they already exist; the five piecemeal slots are
  // OPTIONS, and options built once at card creation cannot react to a setting
  // changing afterwards. Without this, unticking Piecemeal armor left them in
  // every open dropdown until the sheet was reloaded.
  //
  // Hung here rather than in a function of its own because this already runs
  // from recalculateAll and bindSheet and already exists to answer "a PHBR1
  // toggle may have moved". A second hook would be a second thing to keep in
  // step -- the drift recorded at the top of section 7.
  //
  // refreshArmorSlotOptions preserves each card's current value, including one
  // that is no longer offered, so nothing is rewritten behind the player.
  if (typeof refreshArmorSlotOptions === 'function') {
    Array.from(root.querySelectorAll('.armor-list .item')).forEach(el => {
      refreshArmorSlotOptions(el);
      // The chips depend on the same toggles as the dropdown -- the piecemeal
      // note and the effective weight both change when a band moves -- so they
      // are refreshed in the same pass rather than by a second hook.
      if (typeof el._syncArmorLine === 'function') el._syncArmorLine();
    });
  }
}

// PHBR1 Ch.4. A REFERENCE PANEL, not a calculator: it reports rules, derives two
// thresholds from the character's hit points, and says which maneuvers the
// weapon in question can actually perform. Nothing is rolled or enforced.
//
// Lists EVERY weapon carried, equipped or not. A player asks "what could I do if
// I drew the sai?" as often as "what can I do now", and the answer differs
// sharply -- a lasso can never Parry, a nunchaku is limited to four maneuvers.
function renderManeuvers(root) {
  const sec = root && root.querySelector('.maneuvers-section');
  if (!sec) return;

  const on = (typeof isSupplementActive === 'function') &&
             isSupplementActive('phbr1', 'meleeManeuvers');
  sec.style.display = on ? '' : 'none';
  if (!on || typeof COMBAT_MANEUVERS === 'undefined') return;

  const intro = sec.querySelector('.maneuvers-intro');
  if (intro) {
    intro.textContent =
      'Anyone may attempt these \u2014 not warriors alone. Each maneuver costs one of ' +
      'your attacks, so a character with two attacks can mix them freely.';
  }

  // Numbed and Useless, from MAX hit points. Recomputed every render, so they
  // follow a level-up without anything else being wired.
  const thEl = sec.querySelector('.maneuvers-thresholds');
  if (thEl) {
    const maxHp = val(root, 'hp_max') || val(root, 'hp_total') || '';
    const t = (typeof maneuverThresholds === 'function') ? maneuverThresholds(maxHp) : null;
    thEl.innerHTML = t
      ? '<div style="display:flex;gap:18px;align-items:baseline;">' +
          '<div><span style="font-size:11px;color:var(--muted);">Numbed</span> ' +
            '<span style="font-size:18px;font-weight:600;color:var(--warning, #e0a34a);">' +
            t.numbed + '</span></div>' +
          '<div><span style="font-size:11px;color:var(--muted);">Useless</span> ' +
            '<span style="font-size:18px;font-weight:600;color:var(--error, #ff6b6b);">' +
            t.useless + '</span></div>' +
          '<div style="font-size:11px;color:var(--muted);flex:1;">25% and 50% of your ' +
            t.hp + ' hit points, rounded up. Damage to a body location reaching these ' +
            'triggers the effects below.</div>' +
        '</div>'
      : '<div style="font-size:11px;color:var(--muted);">Set your maximum hit points to ' +
        'see your Numbed and Useless thresholds.</div>';
  }

  // Weapon picker. Built once so a selection survives a re-render, but the
  // OPTIONS are rebuilt when the carried weapons change -- the lesson from the
  // armour slot dropdown, which could not react to anything after construction.
  const sel  = sec.querySelector('.maneuvers-weapon');
  const noteEl = sec.querySelector('.maneuvers-weapon-note');
  const carried = Array.from(root.querySelectorAll('.weapons-list .item')).map(el => ({
    name: ((el.querySelector('.title') || {}).value || '').trim(),
    cat:  ((el.querySelector('.weapon-category') || {}).value || ''),
    eq:   !!(el.querySelector('.equipped') || {}).checked
  })).filter(w => w.name);

  if (sel) {
    const want = ['|Bare hands or an unlisted weapon'].concat(
      carried.map(w => w.name + '|' + w.name + (w.eq ? '' : ' (stowed)')));
    const have = Array.from(sel.options).map(o => o.value + '|' + o.textContent);
    if (want.join('\u0001') !== have.join('\u0001')) {
      const keep = sel.value;
      sel.innerHTML = want.map(s => {
        const i = s.indexOf('|');
        return '<option value="' + escapeHtml(s.slice(0, i)) + '">' +
               escapeHtml(s.slice(i + 1)) + '</option>';
      }).join('');
      if (Array.from(sel.options).some(o => o.value === keep)) sel.value = keep;
    }
  }

  const pickName = sel ? sel.value : '';
  const pick = carried.find(w => w.name === pickName) || null;
  const rules = (typeof getManeuverWeaponRules === 'function')
    ? getManeuverWeaponRules(pickName, pick ? pick.cat : '')
    : { allowed: COMBAT_MANEUVERS.map(m => m.key), bonus: {}, note: '', reason: '' };

  if (noteEl) {
    noteEl.innerHTML = rules.note
      ? escapeHtml(rules.note)
      : (pickName ? 'No special maneuver rules for this weapon \u2014 the book lists ' +
                    'restrictions only where they exist.' : '');
  }

  // The maneuver list. Disallowed rows are SHOWN AND GREYED rather than hidden,
  // with the reason, because "a lasso cannot Parry" is the useful fact and a
  // missing row conveys nothing.
  const listEl = sec.querySelector('.maneuvers-list');
  if (listEl) {
    // Built as a named row so the list can be PARTITIONED without duplicating
    // the markup: available first, unavailable below, each keeping the book's
    // own alphabetical order.
    const rowHtml = m => {
      const ok    = rules.allowed.indexOf(m.key) !== -1;
      const bonus = rules.bonus[m.key] || 0;
      const total = m.mod + bonus;
      const sign  = n => (n > 0 ? '+' : '') + n;
      const shield = m.needsShield
        ? Array.from(root.querySelectorAll('.armor-list .item')).some(el =>
            ((el.querySelector('.armor-slot') || {}).value === 'Shield') &&
            (el.querySelector('.equipped') || {}).checked)
        : true;

      return '<div style="padding:6px 8px;border:1px solid var(--border);' +
               'border-radius:var(--radius);margin-bottom:5px;' +
               (ok ? '' : 'opacity:0.5;') + '">' +
               '<div style="display:flex;gap:8px;align-items:baseline;">' +
               '<strong style="flex:1;">' + escapeHtml(m.name) + '</strong>' +
               (bonus ? '<span style="font-size:11px;color:var(--success, #4ade80);">' +
                        sign(bonus) + ' this weapon</span>' : '') +
               '<span style="font-variant-numeric:tabular-nums;font-weight:600;">' +
                 (total === 0 ? '\u20130' : sign(total)) + '</span>' +
             '</div>' +
             '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' +
               escapeHtml(m.result) +
               (m.calledShot ? ' \u00b7 announce before initiative, +1 to your initiative roll' : '') +
             '</div>' +
             (!ok ? '<div style="font-size:11px;color:var(--error, #ff6b6b);margin-top:2px;">' +
                    'Not with this weapon' + (rules.reason ? ' \u2014 ' + escapeHtml(rules.reason) : '') +
                    '</div>' : '') +
             (m.needsShield && !shield
                ? '<div style="font-size:11px;color:var(--warning, #e0a34a);margin-top:2px;">' +
                  'Needs an equipped shield.</div>' : '') +
             '<details class="disclosure" style="font-size:11px;margin-top:4px;">' +
               '<summary>details</summary>' +
               '<div style="color:var(--muted);margin-top:4px;line-height:1.5;">' +
                 escapeHtml(m.text) + '</div>' +
             '</details>' +
           '</div>';
    };

    // SORTED INTO TWO BLOCKS, not filtered. What a weapon CANNOT do is the
    // useful fact -- a lasso never Parries -- so the unavailable rows stay
    // visible with their reason; they simply stop interrupting the list of
    // things the character can actually attempt.
    //
    // Order WITHIN each block is unchanged, which is alphabetical because the
    // book's own form lists them that way. Two stable partitions rather than a
    // sort, so nothing reorders when a weapon is picked beyond the split itself.
    const avail   = COMBAT_MANEUVERS.filter(m => rules.allowed.indexOf(m.key) !== -1);
    const unavail = COMBAT_MANEUVERS.filter(m => rules.allowed.indexOf(m.key) === -1);

    listEl.innerHTML =
      avail.map(rowHtml).join('') +
      // No divider when nothing is excluded, so an unrestricted weapon -- and
      // the no-weapon-selected default -- looks exactly as it did before.
      (unavail.length
        ? '<div style="display:flex;align-items:center;gap:8px;margin:10px 0 6px;">' +
            '<div style="flex:1;height:1px;background:var(--border);"></div>' +
            '<span style="font-size:10px;color:var(--muted);text-transform:uppercase;' +
              'letter-spacing:0.08em;">Not with this weapon</span>' +
            '<div style="flex:1;height:1px;background:var(--border);"></div>' +
          '</div>' +
          unavail.map(rowHtml).join('')
        : '');
  }

  const locEl = sec.querySelector('.maneuvers-locations');
  if (locEl && typeof MANEUVER_BODY_LOCATIONS !== 'undefined') {
    locEl.innerHTML = MANEUVER_BODY_LOCATIONS.map(l =>
      '<div style="display:flex;gap:10px;padding:4px 8px;border-bottom:1px solid var(--border);">' +
        '<strong style="width:100px;">' + escapeHtml(l.name) + '</strong>' +
        '<span style="width:70px;font-variant-numeric:tabular-nums;">' +
          (l.mod === 0 ? '\u20130' : l.mod) + '</span>' +
        '<span style="flex:1;font-size:11px;color:var(--muted);">' +
          escapeHtml(l.effect) +
          (l.extra ? ' <em>(Called Shot \u22124, plus a further ' + l.extra +
                     ' for a small target.)</em>' : '') +
        '</span>' +
      '</div>').join('');
  }

    if (!sec._mvBound) {
    sec._mvBound = true;
    sec.addEventListener('change', () => renderManeuvers(root));
  }
}

// PHBR2 Ch.7 reference panel. Unlike renderManeuvers this depends on NOTHING
// about the character -- the content is static. It stays a render function so
// the band toggle can show and hide it live, like every other supplement panel,
// rather than being baked into the template where it could never be hidden.
function renderAdvancedThiefRules(root) {
  const sec = root && root.querySelector('.advanced-thief-section');
  if (!sec) return;

  // Band AND class, as with the equipment panel. Chapter 7's mugging rules need
  // backstab eligibility and its lock and trap rules need lockpicking, both
  // thief-only. The ANTIDOTE section is the one part any class could use, since
  // it runs off a Herbalism check -- not enough to show a fighter a panel titled
  // "Advanced Rules for Thieves". Chris's call, August 2026; if antidotes are
  // wanted for non-thieves later they are a paragraph that can move out.
  const on = (typeof isSupplementActive === 'function') &&
             isSupplementActive('phbr2', 'advancedThiefRules') &&
             (typeof characterHasThiefSkills !== 'function' ||
              characterHasThiefSkills(root));
  sec.style.display = on ? '' : 'none';
  if (!on || typeof PHBR2_ADVANCED_RULES === 'undefined') return;

  const intro = sec.querySelector('.advanced-thief-intro');
  if (intro) {
    intro.textContent =
      'Chapter 7 calls itself \u201crules of advanced complexity that players and DMs ' +
      'may wish to use\u201d. Reference only \u2014 nothing here is rolled, computed or ' +
      'enforced.';
  }

  const list = sec.querySelector('.advanced-thief-list');
  if (!list) return;
  list.innerHTML = PHBR2_ADVANCED_RULES.map(blk =>
    '<div style="margin-bottom:14px;">' +
      '<h4 style="font-size:12px;margin:0 0 4px;">' + escapeHtml(blk.title) +
        ' <span style="font-weight:400;color:var(--muted);">' + escapeHtml(blk.page) + '</span></h4>' +
      '<ul style="margin:0;padding-left:18px;font-size:11px;line-height:1.6;color:var(--muted);">' +
        blk.lines.map(l => '<li>' + escapeHtml(l) + '</li>').join('') +
      '</ul>' +
    '</div>'
    ).join('');
}

// PHBR2 Ch.5 equipment panel. READS the sheet and never writes to it: Chapter
// 5's modifiers are situational -- a clawed glove is worth +10, +5 or nothing
// depending on the surface -- so they cannot live in the thief skill fields the
// way armour and kit adjustments do. Must run AFTER renderThiefSkills, since it
// reads the figures that function writes.
//
// Selections are held on the node in _teOn, not in a data-field: they answer
// "what is true in this room", not "what is true of this character", and
// collectSheet must never see them. Every control is .ephemeral for the same
// reason.
function renderThiefEquipment(root) {
  const sec = root && root.querySelector('.thief-equip-section');
  if (!sec) return;

  // TWO GATES, and both are necessary. The band says the table is in play; the
  // class test says this character has anything for it to act on. Every item
  // here modifies one of the eight thief skills, so without them the readout is
  // eight em dashes -- which is what a fighter saw.
  //
  // characterHasThiefSkills is the shared resolver in tables.js, NOT a local
  // copy: bards and assassins have thief skills, multi-class counts any class,
  // and dual-class turns on dormancy. Re-deriving that here would be the third
  // copy of a rule that has to stay identical in three places.
  const on = (typeof isSupplementActive === 'function') &&
             isSupplementActive('phbr2', 'equipmentSkillMods') &&
             (typeof characterHasThiefSkills !== 'function' ||
              characterHasThiefSkills(root));
  sec.style.display = on ? '' : 'none';
  if (!on || typeof PHBR2_EQUIPMENT_SKILL_MODS === 'undefined') return;

  const KEYS = ['pickPockets', 'openLocks', 'findTraps', 'moveSilently',
                'hideInShadows', 'detectNoise', 'climbWalls', 'readLanguages'];
  const FIELDS = ['thief_pickpockets', 'thief_openlocks', 'thief_traps',
                  'thief_movesilently', 'thief_hide', 'thief_detectnoise',
                  'thief_climb', 'thief_readlang'];
  const LABELS = ['Pick Pockets', 'Open Locks', 'Find/Remove Traps', 'Move Silently',
                  'Hide in Shadows', 'Detect Noise', 'Climb Walls', 'Read Languages'];
  const sgn = v => (v >= 0 ? '+' : '') + v;

  if (!sec._teOn) sec._teOn = {};

  const intro = sec.querySelector('.thief-equip-intro');
  if (intro) {
    intro.textContent =
      'Tick what the thief is using right now. Each item shows the percentage ' +
      'PHBR2 prints for it. This panel does not change the skill fields above \u2014 ' +
      'Chapter 5\u2019s modifiers depend on the surface, the light and what he is ' +
      'doing, so they belong to the moment rather than to the character.';
  }

  // Surface selector, built once so a re-render never discards the choice.
  const surfSel = sec.querySelector('.thief-equip-surface');
  const SURF = (typeof PHBR2_CLIMB_SURFACES !== 'undefined')
    ? PHBR2_CLIMB_SURFACES : [{ key: 'other', label: 'Rough or normal surface' }];
  if (surfSel && !surfSel.options.length) {
    surfSel.innerHTML = SURF.map(s =>
      '<option value="' + escapeHtml(s.key) + '">' + escapeHtml(s.label) + '</option>').join('');
  }
  const surface = (surfSel && surfSel.value) || SURF[0].key;

  // Per-item contribution at the CURRENT surface. An item whose every modifier
  // is zero here reads as useless rather than as a bonus of nothing.
  const contribution = (e) => {
    const out = {};
    if (e.mods) Object.keys(e.mods).forEach(k => { if (e.mods[k]) out[k] = e.mods[k]; });
    if (e.surfaceMods) {
      const cw = e.surfaceMods[surface] || 0;
      if (cw) out.climbWalls = (out.climbWalls || 0) + cw;
    }
    return out;
  };

  const list = sec.querySelector('.thief-equip-list');
  if (list) {
    const surfLabel = (SURF.find(s => s.key === surface) || {}).label || surface;
    // GROUPED, in first-appearance order rather than a hardcoded list, so a new
    // group is a data change and nothing else. An entry with no `group` is
    // Equipment -- the fifteen Chapter 5 rows predate the field and must not
    // need editing to keep working.
    const seen = [];
    PHBR2_EQUIPMENT_SKILL_MODS.forEach(e => {
      const g = e.group || 'Equipment';
      if (seen.indexOf(g) === -1) seen.push(g);
    });
    let lastGroup = null;
    list.innerHTML = seen.map(g => PHBR2_EQUIPMENT_SKILL_MODS
      .filter(e => (e.group || 'Equipment') === g)
      .map((e) => {
      const c = contribution(e);
      const bits = KEYS.filter(k => c[k]).map(k => sgn(c[k]) + ' ' + LABELS[KEYS.indexOf(k)]);
      // A REFERENCE ROW IS NEVER DEAD. `dead` means "contributes nothing here",
      // which greys the row and prints "no effect here" -- actively wrong for
      // the shell game, where the rule IS that a roll is required. It has no
      // number because the book gives it none, not because the number is zero.
      const dead = !e.reference && !bits.length;
      const head = (lastGroup === g) ? '' :
        '<div style="font-size:11px;font-weight:600;color:var(--accent-light);' +
        'margin:10px 0 2px;">' + escapeHtml(g) + '</div>';
      lastGroup = g;
      // A surface item that grants nothing here must SAY so. Dropping the climb
      // figure from the summary is not enough -- clawed gloves still show their
      // move silently penalty, so the row looks unchanged, which is exactly how
      // it read on a very smooth wall. `dead` cannot carry this: the gloves keep
      // that -5 whatever the surface and are therefore never dead.
      const noClimb = !!e.surfaceMods && !e.surfaceMods[surface];
      const checked = sec._teOn[e.item] ? ' checked' : '';
      // A reference row gets a bullet where the checkbox would be, so the column
      // still lines up and nobody hunts for a tick-box that was never there.
      return head +
        '<label class="te-row" style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;' +
             'border-bottom:1px solid var(--border);' + (dead ? 'opacity:.55;' : '') + '">' +
        (e.reference
          ? '<span style="width:13px;flex-shrink:0;margin-top:3px;color:var(--muted);' +
            'text-align:center;">\u2022</span>'
          : '<input type="checkbox" class="ephemeral te-item" data-te="' + escapeHtml(e.item) +
            '" style="margin-top:3px;"' + checked + '>') +
        '<span style="flex:1;min-width:0;">' +
          '<span style="font-size:12px;">' + escapeHtml(e.item) + '</span> ' +
          '<span style="font-size:11px;color:var(--muted);">' + escapeHtml(e.page) + '</span>' +
          '<span style="display:block;font-size:11px;color:var(--muted);line-height:1.5;">' +
            escapeHtml(e.when) +
            (dead ? ' \u2014 no effect here'
                  : ' \u2014 ' + escapeHtml(bits.join(', '))) +
            (noClimb ? '<br>No climbing bonus on a ' +
                       escapeHtml(surfLabel.toLowerCase()) +
                       ' \u2014 too few nooks and crannies to grip.'
                     : '') +
            (e.note ? '<br>' + escapeHtml(e.note) : '') +
          '</span>' +
        '</span>' +
      '</label>';
      }).join('')
    ).join('');
  }

  // Sum the ticked items. A `reference` row has no checkbox and no numbers, so
  // it can never be ticked -- the guard is belt and braces against a stale
  // _teOn entry surviving a data change.
  const delta = [0, 0, 0, 0, 0, 0, 0, 0];
  PHBR2_EQUIPMENT_SKILL_MODS.forEach(e => {
    if (e.reference || !sec._teOn[e.item]) return;
    const c = contribution(e);
    KEYS.forEach((k, i) => { if (c[k]) delta[i] += c[k]; });
  });

  // Read the computed figures rather than recomputing them: renderThiefSkills is
  // the single resolver and already handles bards, the multi-class armour gate
  // and the PHBR2 floor. A blank or em dash means the skill is not available,
  // and no amount of equipment makes it available.
  const cap = (typeof THIEF_SKILL_MAX !== 'undefined') ? THIEF_SKILL_MAX : 95;
  const readout = sec.querySelector('.thief-equip-readout');
  if (readout) {
    readout.innerHTML = FIELDS.map((f, i) => {
      const el = root.querySelector('[data-field="' + f + '"]');
      const raw = el ? String(el.value).trim() : '';
      const base = parseInt(raw, 10);
      const live = !isNaN(base);
      const adj = live ? Math.max(0, Math.min(cap, base + delta[i])) : null;
      const moved = live && delta[i] !== 0;
      return '<div style="display:flex;gap:8px;align-items:baseline;padding:3px 0;font-size:12px;">' +
        '<span style="flex:1;color:var(--muted);">' + LABELS[i] + '</span>' +
        '<span style="width:52px;text-align:right;color:var(--muted);">' +
          (live ? base + '%' : escapeHtml(raw || '\u2014')) + '</span>' +
        '<span style="width:52px;text-align:right;color:var(--muted);">' +
          (moved ? sgn(delta[i]) : '') + '</span>' +
        '<span style="width:60px;text-align:right;font-weight:600;' +
          (moved ? '' : 'color:var(--muted);') + '">' +
          (live ? adj + '%' : '\u2014') + '</span>' +
      '</div>';
    }).join('');
  }

  if (!sec._teBound) {
    sec._teBound = true;
    sec.addEventListener('change', (ev) => {
      const box = ev.target.closest && ev.target.closest('.te-item');
      if (box) sec._teOn[box.dataset.te] = box.checked;
      renderThiefEquipment(root);
    });
    const clear = sec.querySelector('.thief-equip-clear');
    if (clear) clear.addEventListener('click', () => {
      sec._teOn = {};
      renderThiefEquipment(root);
    });
  }
}

// Defaults the wearer to the character's own race, which is the common case and
// costs nothing. The armor is something he does not own yet, so "made for" is
// left for him to pick.
function renderArmorFitting(root) {
  const sec = root && root.querySelector('.armor-fitting-section');
  if (!sec || typeof ARMOR_FITTING === 'undefined') return;

  const wearerSel = sec.querySelector('.af-wearer');
  const builtSel  = sec.querySelector('.af-builtfor');
  if (!wearerSel || !builtSel) return;

  const nice = r => r.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('-');

  // Built ONCE. This renders from recalculateAll, so rebuilding would discard
  // the player's selection mid-lookup -- the same reason buildClimbingControls
  // separates build from render.
  // OPTIONS ARE BUILT ONCE; THE DEFAULT IS APPLIED EVERY RENDER UNTIL TOUCHED.
  // Doing both in one "build once" block was wrong: bindSheet renders this panel
  // BEFORE loadSheet fills the race field, so the first pass saw an empty race,
  // fell through to the first option, and the guard then stopped the default
  // ever being reapplied. Every character defaulted to Dwarf.
  //
  // The same shape as the populateKitDropdown ordering bug, mirrored -- there a
  // value was set before its options existed; here options were built before the
  // value existed.
  if (!wearerSel.options.length) {
    ARMOR_FITTING_RACES.forEach(r => {
      wearerSel.appendChild(new Option(nice(r), r));
      builtSel.appendChild(new Option(nice(r), r));
    });
  }

  // Follows the character's race until the player picks a wearer himself, so
  // changing the race on the sheet moves it too. Once he chooses, it is his.
  if (!sec._afWearerTouched) {
    const own = (typeof getRaceKey === 'function') ? getRaceKey(val(root, 'race')) : '';
    if (own && ARMOR_FITTING[own]) {
      wearerSel.value = own;
      // "Made for" starts matched to the wearer as a neutral opening position,
      // but only until it has been set once -- it must not be dragged along
      // afterwards, since the looted armor is the whole question.
      if (!sec._afBuiltInit) { builtSel.value = own; sec._afBuiltInit = true; }
    }
  }

  const opts = {
    otherSex:  !!(sec.querySelector('.af-othersex') || {}).checked,
    fullPlate: !!(sec.querySelector('.af-fullplate') || {}).checked,
    build:     (sec.querySelector('.af-build') || {}).value || 0
  };
  const fit = (typeof getArmorFitting === 'function')
    ? getArmorFitting(wearerSel.value, builtSel.value, opts) : null;

  const resEl = sec.querySelector('.armor-fitting-result');
  if (resEl && fit) {
    const colour = fit.pct >= 60 ? 'var(--success, #4ade80)'
                 : fit.pct >= 25 ? 'var(--warning, #e0a34a)'
                 : 'var(--error, #ff6b6b)';
    resEl.innerHTML =
      '<div style="font-size:20px;font-weight:600;color:' + colour + ';">' + fit.pct + '%</div>' +
      '<div style="font-size:12px;color:var(--muted);">chance it fits \u2014 roll percentile equal or under' +
        (fit.fullPlate ? '' : ', a failure means it is <strong>' + escapeHtml(fit.verdict) + '</strong>') +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:4px;">' +
        escapeHtml(fit.parts.join(' \u00b7 ')) +
        (fit.floored ? ' \u00b7 floored at ' + ARMOR_FITTING_FLOOR + '%' : '') +
      '</div>';
  }

  // The whole table, with the active row and column marked. A player deciding
  // whether to haul a suit back to town wants to see the alternatives, not just
  // the one cell he asked about.
  const tblEl = sec.querySelector('.armor-fitting-table');
  if (tblEl) {
    const th = 'padding:4px 8px;border-bottom:1px solid var(--border);font-size:11px;';
    let h = '<table style="width:100%;border-collapse:collapse;"><thead><tr>' +
            '<th style="text-align:left;' + th + '">Trying to wear</th>';
    ARMOR_FITTING_RACES.forEach(c => {
      const on = c === builtSel.value;
      h += '<th style="text-align:right;' + th + (on ? 'color:var(--accent-light);' : '') + '">' +
           escapeHtml(nice(c)) + '</th>';
    });
    h += '</tr></thead><tbody>';
    ARMOR_FITTING_RACES.forEach(r => {
      const rowOn = r === wearerSel.value;
      h += '<tr' + (rowOn ? ' style="background:var(--glass);"' : '') + '>' +
           '<td style="padding:3px 8px;' + (rowOn ? 'color:var(--accent-light);font-weight:600;' : '') + '">' +
           escapeHtml(nice(r)) + '</td>';
      ARMOR_FITTING_RACES.forEach(c => {
        const cell = ARMOR_FITTING[r][c];
        const hot = rowOn && c === builtSel.value;
        h += '<td style="padding:3px 8px;text-align:right;font-variant-numeric:tabular-nums;' +
             (hot ? 'color:var(--accent-light);font-weight:700;' : '') + '">' +
             cell.p + '%' + (cell.s ? ' ' + cell.s : '') + '</td>';
      });
      h += '</tr>';
    });
    tblEl.innerHTML = h + '</tbody></table>';
  }

  const noteEl = sec.querySelector('.armor-fitting-note');
  if (noteEl) {
    noteEl.innerHTML =
      '<strong>+</strong> too big \u2014 baggy, or so long it interferes with walking. ' +
      '<strong>\u2212</strong> too small \u2014 not broad enough across the chest, or comically short. ' +
      'No symbol means even odds either way.<br>' +
      'Some cells read oddly and are as printed: gnome armor can be <em>too big</em> for a ' +
      'half-elf because it is proportionally broad, and elven armor <em>too small</em> for a ' +
      'halfling because it is narrow.<br>' +
      'A different sex costs 10%, never below 5%; on such a failure a woman finds a man\u2019s ' +
      'armor too big and a man finds a woman\u2019s too small. <strong>Full plate ignores the table ' +
      'entirely</strong> \u2014 20% within your own race, 10% across sexes, and never across races. ' +
      'The DM may adjust for a character\u2019s role-played build; the book\u2019s example is +15% for a ' +
      'short, stocky human trying dwarven armor.';
  }

  // Bound once, flagged on the section. This renders from recalculateAll, so an
  // unguarded addEventListener would stack a listener per keystroke. Never calls
  // markUnsaved: a lookup is not an edit to the character.
  if (!sec._afBound) {
    sec._afBound = true;
    const onEdit = (e) => {
      // Touching EITHER select is a deliberate choice, so the wearer stops
      // following the character's race from then on. Checking the target rather
      // than setting the flag on any event keeps the build-adjustment box and
      // the tickboxes from counting as an override.
      if (e.target && (e.target.classList.contains('af-wearer') ||
                       e.target.classList.contains('af-builtfor'))) {
        sec._afWearerTouched = true;
        sec._afBuiltInit = true;
      }
      renderArmorFitting(root);
    };
    sec.addEventListener('change', onEdit);
    sec.addEventListener('input',  onEdit);
  }
}

function renderWeaponBreakage(root) {
  const sec = root && root.querySelector('.weapon-breakage-section');
  if (!sec) return;

  const rows = [];
  Array.from(root.querySelectorAll('.weapons-list .item')).forEach(el => {
    const nm = ((el.querySelector('.title') || {}).value || '').trim();
    const key = (el.querySelector('.weapon-wtype') || {}).value || '';
    if (!nm && !key) return;
    const sh = (typeof getWeaponShatter === 'function') ? getWeaponShatter(nm, key) : null;
    const br = sh ? null
      : ((typeof getWeaponBreak === 'function') ? getWeaponBreak(nm, key) : null);
    if (!sh && !br) return;
    const eq = el.querySelector('.equipped');
    rows.push({
      name: nm || 'Unnamed weapon',
      kind: sh ? 'shatter' : 'break',
      rule: sh || br,
      material: sh ? (sh.material || '') : '',
      equipped: !!(eq && eq.checked)
    });
  });

  if (!rows.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';

  const intro = sec.querySelector('.weapon-breakage-intro');
  if (intro) {
    intro.textContent =
      'Roll after a hit to see whether the weapon survived it. Nothing is removed ' +
      'for you \u2014 delete the weapon on the Equipment tab if it goes.';
  }

  const list = sec.querySelector('.weapon-breakage-list');
  if (!list) return;

  list.innerHTML = rows.map((r, i) => {
    const thr = r.rule.on === 1 ? '1' : '1 or 2';
    const when = (r.kind === 'shatter')
      ? 'every hit'
      : 'over 12 damage, or parried by a shield';
    return '<div style="display:flex;align-items:center;gap:10px;padding:6px 8px;' +
             'border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;">' +
             '<div style="flex:1;min-width:0;">' +
               '<div style="font-weight:600;">' + escapeHtml(r.name) +
                 (r.equipped ? '' : ' <span style="font-size:11px;color:var(--muted);">stowed</span>') +
               '</div>' +
               '<div style="font-size:11px;color:var(--muted);">' +
                 (r.material ? escapeHtml(r.material) + ' \u00b7 ' : '') +
                 (r.kind === 'shatter' ? 'shatters' : 'breaks') +
                 ' on ' + thr + ' (1d' + r.rule.dieSides + ') \u00b7 ' + escapeHtml(when) +
               '</div>' +
             '</div>' +
             '<div class="wb-result" data-i="' + i + '" style="font-weight:600;font-size:12px;' +
               'min-width:120px;text-align:right;"></div>' +
             '<button class="wb-roll" data-i="' + i + '" style="padding:4px 12px;font-size:12px;">' +
               (r.kind === 'shatter' ? 'Shatters?' : 'Breaks?') +
             '</button>' +
           '</div>';
  }).join('');

  // Rebound on every render because the list is rebuilt; onclick assignment
  // rather than addEventListener, so a re-render cannot stack handlers.
  Array.from(list.querySelectorAll('.wb-roll')).forEach(btn => {
    btn.onclick = () => {
      const r = rows[parseInt(btn.dataset.i, 10)];
      if (!r) return;
      const roll = Math.floor(Math.random() * r.rule.dieSides) + 1;
      const gone = roll <= r.rule.on;
      const verb = r.kind === 'shatter' ? 'SHATTERS' : 'BREAKS';
      const thr = r.rule.on === 1 ? '1' : '1 or 2';

      const out = list.querySelector('.wb-result[data-i="' + btn.dataset.i + '"]');
      if (out) {
        out.textContent = roll + ' \u2014 ' + (gone ? verb : 'holds');
        out.style.color = gone ? 'var(--error, #ff6b6b)' : 'var(--success, #4ade80)';
      }

      if (typeof addRollToHistory === 'function') {
        addRollToHistory(root, {
          formula: r.name + (r.kind === 'shatter' ? ' \u2014 shatter check' : ' \u2014 break check'),
          rolls: [roll],
          modifier: 0,
          total: roll,
          modifierInfo:
            (gone
              ? verb + ' \u2014 the weapon is useless' +
                (r.kind === 'break' ? ', except as a club' : '')
              : 'Holds \u2014 no damage to the weapon') +
            '\n\nBreaks on ' + thr + ' on 1d' + r.rule.dieSides + '.' +
            (r.kind === 'shatter'
              ? '\nRolled on EVERY hit. The attack still does its full damage (PHBR1 p.101).'
              : '\nRolled only after a hit doing more than 12 damage, or one parried by a ' +
                'shield (PHBR1 p.85).')
        });
      }
    };
  });
}

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
