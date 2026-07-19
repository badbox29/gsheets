// print.js - PDF Character Sheet Generation

function generateCharacterPDF(root, opts) {
  if (!root) {
    alert('No active character sheet found.');
    return;
  }

  // Print options come from the modal. A direct call -- or any older code
  // path that still calls generateCharacterPDF(root) with one argument --
  // falls back to the saved set, so this function is never left guessing.
  if (!opts) {
    opts = (typeof getPrintOptions === 'function') ? getPrintOptions() : {};
  }

  // Full character record, identical in shape to the JSON export.
  //
  // Page 1 deliberately keeps using val(root, ...) DOM scraping: it works and
  // it is tested. Every NEW section reads from `sheet` instead, because the
  // arrays -- spellbooks, henchmen, equipment, journal entries -- are not
  // reachable through val() at all.
  const sheet = (typeof collectSheet === 'function') ? collectSheet(root) : null;

  // Wraps a section heading together with its content so pdfMake treats the
  // pair as one indivisible block. If the whole thing will not fit in the
  // space left on the current page, all of it moves to the next page -- the
  // heading can never be orphaned at the foot of a page with its table on the
  // following one.
  //
  // The trade is whitespace at the bottom of some pages. That is the correct
  // trade for a character sheet: a player scanning for "PROFICIENCIES" should
  // find the list directly underneath it, every time.
  //
  // Sections that are inherently taller than a page (a large spellbook, a long
  // session log) must NOT use this -- they get the heading plus their first few
  // rows wrapped, with the remainder allowed to flow.
  const printSection = (title, ...blocks) => ({
    unbreakable: true,
    stack: [
      {
        text: title,
        fontSize: 8,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 2]
      },
      ...blocks
    ]
  });

  // Forces a section to begin a new page. Used to pin the fixed page layout in
  // place rather than letting sections land wherever they happen to fall --
  // page 1 is always the core stats page, page 2 is always weapons and
  // proficiencies, and so on. Wrapping rather than mutating keeps printSection
  // free of page-layout concerns.
  const pageBreakBefore = node => Object.assign({}, node, { pageBreak: 'before' });

  // Every table on this sheet uses the same hairline grid. Defined once here
  // rather than repeated inline at each table, as the page 1 code does.
  const gridLayout = {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    paddingLeft: () => 2,
    paddingRight: () => 2,
    paddingTop: () => 1,
    paddingBottom: () => 1
  };

  // Spreads a section into the content array only when its checkbox is ticked
  // AND it actually has data. An optional section that is switched on but
  // empty collapses to nothing rather than printing a heading over a blank
  // table -- which is why defaulting options ON in the modal costs nothing.
  const optional = (show, ...nodes) => (show ? nodes : []);

  // Rows whose name is blank are placeholder rows in the UI, not real entries.
  const named = arr => (Array.isArray(arr) ? arr.filter(r => r && String(r.name || '').trim()) : []);

  const cell = (t, size, opt) =>
    Object.assign({ text: (t === null || t === undefined) ? '' : String(t), fontSize: size || 6 }, opt || {});

  // === BASIC INFO ===
  const characterName = val(root, 'name') || '';
  const playerName = val(root, 'player') || '';
  const race = val(root, 'race') || '';
  const clazz = val(root, 'clazz') || '';
  const level = val(root, 'level') || '';
  const kit = val(root, 'kit') || '';
  const alignment = val(root, 'alignment') || '';
  const xp = val(root, 'xp') || '';

  // The class field is free text, so it can hold an internal flag such as
  // "hb_dpaladin". getClassDisplayName (tables.js) maps the known ones and
  // prettifies the rest. Kit is a separate field entirely and prints blank
  // when the character has no kit.
  const clazzDisplay = (typeof getClassDisplayName === 'function')
    ? getClassDisplayName(clazz)
    : clazz;
  
  // === ABILITY SCORES ===
 const str = val(root, 'str') || '';
  const strEx = val(root, 'str_exceptional') || '';
  const dex = val(root, 'dex') || '';
  const con = val(root, 'con') || '';
  const int = val(root, 'int') || '';
  const wis = val(root, 'wis') || '';
  const cha = val(root, 'cha') || '';

  // A blank cell on a printed sheet reads as a rendering failure. An em dash
  // reads as "this modifier does not apply to this character" -- which is the
  // truth for, say, a paladin's Wisdom bonus spells.
  const orDash = v =>
    (v === null || v === undefined || String(v).trim() === '') ? '\u2014' : String(v);

  // Exceptional Strength prints in the PHB's 18/xx form. Only warriors with
  // STR 18 ever have a value here.
  const strDisplay = (str && strEx) ? `${str}/${strEx}` : str;
  
  // === STR MODIFIERS ===
  const strHitAdj = orDash(val(root, 'str_tohit'));
  const strDmgAdj = orDash(val(root, 'str_damage'));
  const strWeight = orDash(val(root, 'str_weight'));
  const strOpenDoors = orDash(val(root, 'str_opendoors'));
  const strBendBars = orDash(val(root, 'str_bendbars'));
  
  // === DEX MODIFIERS ===
  const dexReaction = orDash(val(root, 'dex_reaction'));
  const dexMissile = orDash(val(root, 'dex_missile'));
  const dexAC = orDash(val(root, 'dex_ac'));
  
  // === CON MODIFIERS ===
  const conHP = orDash(val(root, 'con_hpbonus'));
  const conShock = orDash(val(root, 'con_shock'));
  const conResurrect = orDash(val(root, 'con_res'));
  const conPoison = orDash(val(root, 'con_poison'));
  const conRegen = orDash(val(root, 'con_regen'));
  
  // === INT MODIFIERS ===
  const intLanguages = orDash(val(root, 'int_languages'));
  const intBonusProfs = orDash(val(root, 'int_bonus_profs'));
  const intImmunity = orDash(val(root, 'int_immunity'));
  const intLearnSpell = orDash(val(root, 'int_learn_spell'));
  const intMaxSpells = orDash(val(root, 'int_max_spells'));
  
  // === WIS MODIFIERS ===
  const wisMagicDef = orDash(val(root, 'wis_mda'));
  const wisSpellBonus = orDash(val(root, 'wis_bonus_spells'));
  const wisSpellFailure = orDash(val(root, 'wis_spell_failure'));
  const wisImmunity = orDash(val(root, 'wis_immunities'));
  
  // === CHA MODIFIERS ===
  const chaMaxHench = orDash(val(root, 'cha_max_henchmen_core'));
  const chaLoyalty = orDash(val(root, 'cha_loyalty_core'));
  const chaReaction = orDash(val(root, 'cha_reaction_core'));
  
  // === COMBAT STATS ===
  const hp = val(root, 'hp') || '';
  const ac = orDash(val(root, 'ac'));
  const acRear = orDash(val(root, 'ac_rear'));
  const acSurprised = orDash(val(root, 'ac_surprised'));
  const acNoShield = orDash(val(root, 'ac_no_shield'));
  const acVsMissiles = orDash(val(root, 'ac_vs_missiles'));

  // "Type Worn" on the traditional sheet -- what the character is actually
  // wearing. Restricted to Armor and Shield entries: helmets, boots and belts
  // live in the same list but contribute no AC and would crowd a narrow
  // column. Read from the character record because the armor list is an
  // array, which val() cannot reach.
  const armorWorn = (sheet && Array.isArray(sheet.armor))
    ? sheet.armor
        .filter(a => a && a.equipped && (a.armorType === 'Armor' || a.armorType === 'Shield'))
        .map(a => String(a.name || '').trim())
        .filter(Boolean)
        .join(', ')
    : '';
  const thac0 = root.querySelector('.combat-thac0')?.textContent.trim() || '';
  
  // === MOVEMENT ===
  const baseMovement = val(root, 'movement_base') || '';
  
  // === ENCUMBRANCE ===
  const encumbranceMax = val(root, 'encumbrance_max') || '';
  
  // === SAVING THROWS ===
  // Parse saves from the tooltip which contains base and modifier info
  const parseSave = (saveNum) => {
    const el = root.querySelector(`[data-field="save${saveNum}"]`);
    const total = el?.value || '';
    const tooltip = el?.title || '';
    
    if (!total) return { base: '', mod: '', total: '' };
    
    // Try to extract base from tooltip (format: "Base: X")
    const baseMatch = tooltip.match(/Base:\s*(\d+)/);
    if (baseMatch) {
      const base = parseInt(baseMatch[1]);
      const totalNum = parseInt(total);
      const mod = totalNum - base;
      return {
        base: base.toString(),
        mod: mod !== 0 ? (mod >= 0 ? `+${mod}` : mod.toString()) : '',
        total: total
      };
    } else {
      // No base found in tooltip, assume no modifiers
      return { base: total, mod: '', total: total };
    }
  };
  
  const save1Data = parseSave(1);
  const save2Data = parseSave(2);
  const save3Data = parseSave(3);
  const save4Data = parseSave(4);
  const save5Data = parseSave(5);
  
  // === COLLECT WEAPONS ===
  // Weapon rows.
  //
  // The previous version queried .attacks, .size, .to-hit and .range, none of
  // which makeWeaponNode ever renders -- so four of the seven columns were
  // reading nothing at all. The real classes are .title, .speed, .damage-sm,
  // .damage-l, .magic-bonus, .damage-type and .weapon-str-bonus.
  //
  // Where the character record has no value, core_wp.json is consulted through
  // lookupWeaponData() so a weapon the player typed by name still prints its
  // book Size, Speed Factor and damage dice.
  const weapons = [];
  const weaponNodes = root.querySelectorAll('.weapons-list .item');

  // Strength row for this character, resolved once. Exceptional STR is handled
  // inside getStrengthData, which only grants the 18/xx row to warriors.
  const strDataForWeapons = (typeof getStrengthData === 'function')
    ? getStrengthData(str, strEx, clazz)
    : null;

  // Attacks per round is a character-level field on this sheet, not per weapon.
  const attacksPerRound =
    (root.querySelector('.combat-attacks-per-round')?.value || '').trim();

  const signed = n => (n > 0 ? '+' + n : String(n));

  weaponNodes.forEach(node => {
    const name = (node.querySelector('.title')?.value || '').trim();
    if (!name) return;

    const ref = (typeof lookupWeaponData === 'function') ? lookupWeaponData(name) : null;
    const magic = parseInt(node.querySelector('.magic-bonus')?.value, 10) || 0;

    // Speed: the row's own value wins, then the book. A magical bonus reduces
    // the speed factor by 1 per plus (PHB Table 56), floored at 0.
    const rawSpeed = (node.querySelector('.speed')?.value || '').trim()
      || (ref ? ref['Speed Factor'] : '') || '';
    const effSpeed = (typeof getEffectiveWeaponSpeed === 'function')
      ? getEffectiveWeaponSpeed(rawSpeed, magic)
      : null;

    // Damage dice, S-M and L.
    const dmgSM = (node.querySelector('.damage-sm')?.value || '').trim()
      || (ref ? ref['Damage (S-M)'] : '') || '';
    const dmgL = (node.querySelector('.damage-l')?.value || '').trim()
      || (ref ? ref['Damage (L)'] : '') || '';
    const damage = (dmgSM && dmgL && dmgSM !== dmgL)
      ? `${dmgSM} / ${dmgL}`
      : (dmgSM || dmgL || '');

    // Hit and damage adjustment: Strength (per this weapon's STR mode) plus
    // the magical bonus.
    const strMode = node.querySelector('.weapon-str-bonus')?.value || 'none';
    const adj = (typeof getWeaponStrAdjustments === 'function')
      ? getWeaponStrAdjustments(strDataForWeapons, strMode, str, strEx, clazz)
      : { toHit: 0, damage: 0 };
    const hitAdj = (adj.toHit || 0) + magic;
    const dmgAdj = (adj.damage || 0) + magic;

    weapons.push({
      name: name,
      attacks: attacksPerRound || '\u2014',
      size: (ref && ref['Size']) ? ref['Size'] : '\u2014',
      type: (node.querySelector('.damage-type')?.value || '').trim() || '\u2014',
      speed: (effSpeed === null) ? '\u2014' : String(effSpeed),
      hitDmg: `${signed(hitAdj)} / ${signed(dmgAdj)}`,
      damage: damage || '\u2014',
      range: (node.querySelector('.notes')?.value || '').trim()
    });
  });
  
  // === COLLECT PROFICIENCIES (weapon + non-weapon) ===
  const proficiencies = [];
  
  // Collect weapon proficiencies
  const wpNodes = root.querySelectorAll('.weapon-profs-list .weapon-prof-item');
  wpNodes.forEach(node => {
    const nameElement = node.querySelector('strong');
    const name = nameElement?.textContent.trim() || '';
    if (name) {
      proficiencies.push({
        name: name
      });
    }
  });
  
  // Collect non-weapon proficiencies
  const nwpNodes = root.querySelectorAll('.nwp-list .nwp-item');
  nwpNodes.forEach(node => {
    const nameElement = node.querySelector('strong');
    const name = nameElement?.textContent.trim() || '';
    if (name) {
      proficiencies.push({
        name: name
      });
    }
  });
  
  // === CALCULATE THAC0 MATRIX ===
  const thac0Num = parseInt(thac0) || 20;
  const thac0Matrix = [];
  for (let targetAC = 10; targetAC >= -10; targetAC--) {
    const rollNeeded = thac0Num - targetAC;
    thac0Matrix.push(rollNeeded > 20 ? '20+' : (rollNeeded < 1 ? '1' : rollNeeded.toString()));
  }

  // === ARMOR & AMMUNITION (optional) ===
  // Both are arrays on the character record and therefore unreachable through
  // val(), so they read from `sheet`.
  const armorRows = named(sheet && sheet.armor);
  const ammoRows = named(sheet && sheet.ammunition);
  const showArmorAmmo = !!opts.armorAmmo && (armorRows.length > 0 || ammoRows.length > 0);

  const armorAmmoBlocks = [];

  if (showArmorAmmo && armorRows.length) {
    armorAmmoBlocks.push({
      table: {
        headerRows: 1,
        widths: ['26%', '12%', '10%', '10%', '8%', '8%', '26%'],
        body: [
          [
            cell('Armor / Shield', 6, { bold: true }),
            cell('Type', 6, { bold: true, alignment: 'center' }),
            cell('Base AC', 6, { bold: true, alignment: 'center' }),
            cell('Magic', 6, { bold: true, alignment: 'center' }),
            cell('Worn', 6, { bold: true, alignment: 'center' }),
            cell('Wt', 6, { bold: true, alignment: 'center' }),
            cell('Notes', 6, { bold: true })
          ],
          ...armorRows.map(a => [
            cell(a.name),
            cell(a.armorType, 6, { alignment: 'center' }),
            cell(a.baseAC, 6, { alignment: 'center' }),
            cell(a.acBonus, 6, { alignment: 'center' }),
            cell(a.equipped ? 'Yes' : '', 6, { alignment: 'center' }),
            cell(a.weight, 6, { alignment: 'center' }),
            cell(a.notes)
          ])
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  if (showArmorAmmo && ammoRows.length) {
    armorAmmoBlocks.push({
      table: {
        headerRows: 1,
        widths: ['40%', '15%', '20%', '25%'],
        body: [
          [
            cell('Ammunition', 6, { bold: true }),
            cell('Qty', 6, { bold: true, alignment: 'center' }),
            cell('Wt each', 6, { bold: true, alignment: 'center' }),
            cell('Total wt', 6, { bold: true, alignment: 'center' })
          ],
          ...ammoRows.map(a => {
            const qty = parseFloat(a.quantity) || 0;
            const per = parseFloat(a.weightPerUnit) || 0;
            const total = qty * per;
            return [
              cell(a.name),
              cell(a.quantity, 6, { alignment: 'center' }),
              cell(a.weightPerUnit, 6, { alignment: 'center' }),
              cell(total ? total.toFixed(1) : '', 6, { alignment: 'center' })
            ];
          })
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === LANGUAGES (optional) ===
  const languageRows = named(sheet && sheet.languages);
  const showLanguages = !!opts.languages && languageRows.length > 0;

  // Mirrors the on-screen header: the three buckets sum to the total. The
  // native tongue carries isGranted in some records, so it is excluded from
  // the granted count to avoid being reported twice.
  const langNative = languageRows.filter(l => l.isNative).length;
  const langGranted = languageRows.filter(l => l.isGranted && !l.isNative).length;
  const langPurchased = languageRows.length - langNative - langGranted;

  const languageBlocks = [];

  if (showLanguages) {
    languageBlocks.push({
      text: `Languages Known: ${languageRows.length} ` +
            `(${langNative} native, ${langGranted} granted, ${langPurchased} purchased). ` +
            `The native tongue is free and does not count against the Intelligence limit.`,
      fontSize: 6,
      italics: true,
      margin: [0, 0, 0, 3]
    });

    languageBlocks.push({
      table: {
        headerRows: 1,
        widths: ['26%', '10%', '10%', '10%', '14%', '30%'],
        body: [
          [
            cell('Language', 6, { bold: true }),
            cell('Speak', 6, { bold: true, alignment: 'center' }),
            cell('Read', 6, { bold: true, alignment: 'center' }),
            cell('Write', 6, { bold: true, alignment: 'center' }),
            cell('Source', 6, { bold: true, alignment: 'center' }),
            cell('Language Group', 6, { bold: true })
          ],
          ...languageRows.map(l => [
            cell(l.name),
            // canSpeak was added after some records were saved. A missing
            // value means the language predates the flag, and every language
            // on the list could be spoken back then -- so absent reads as yes.
            cell(l.canSpeak !== false ? 'X' : '', 6, { alignment: 'center' }),
            cell(l.canRead ? 'X' : '', 6, { alignment: 'center' }),
            cell(l.canWrite ? 'X' : '', 6, { alignment: 'center' }),
            cell(l.isNative ? 'Native' : (l.isGranted ? 'Granted' : 'Learned'), 6, { alignment: 'center' }),
            cell(l.languageClass)
          ])
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === THIEF SKILLS (optional) ===
  // Stored as a flat object of eight skills plus the discretionary points
  // allocated to each. Non-rogues have the object but leave it empty, which
  // is what collapses the section for them.
  const thief = (sheet && sheet.thief) || {};

  const THIEF_SKILLS = [
    ['Pick Pockets',       'pickPockets',    'pointsPickPockets'],
    ['Open Locks',         'openLocks',      'pointsOpenLocks'],
    ['Find/Remove Traps',  'traps',          'pointsTraps'],
    ['Move Silently',      'moveSilently',   'pointsMoveSilently'],
    ['Hide in Shadows',    'hideInShadows',  'pointsHide'],
    ['Detect Noise',       'detectNoise',    'pointsDetectNoise'],
    ['Climb Walls',        'climbWalls',     'pointsClimb'],
    ['Read Languages',     'readLanguages',  'pointsReadLang']
  ];

  // A thief sheet with every score blank and no points spent is not a thief.
  const hasThiefData = THIEF_SKILLS.some(([, scoreKey, pointsKey]) =>
    String(thief[scoreKey] || '').trim() !== '' ||
    (parseInt(thief[pointsKey], 10) || 0) > 0
  );
  const showThief = !!opts.thiefSkills && hasThiefData;

  const thiefBlocks = [];

  if (showThief) {
    thiefBlocks.push({
      table: {
        headerRows: 1,
        widths: ['40%', '20%', '20%', '20%'],
        body: [
          [
            cell('Thief Skill', 6, { bold: true }),
            cell('Score', 6, { bold: true, alignment: 'center' }),
            cell('Pts Spent', 6, { bold: true, alignment: 'center' }),
            cell('Roll', 6, { bold: true, alignment: 'center' })
          ],
          ...THIEF_SKILLS.map(([label, scoreKey, pointsKey]) => {
            const score = String(thief[scoreKey] || '').trim();
            return [
              cell(label),
              cell(score ? `${score}%` : '\u2014', 6, { alignment: 'center' }),
              cell(thief[pointsKey] || '0', 6, { alignment: 'center' }),
              cell('d100', 6, { alignment: 'center' })
            ];
          })
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === CLASS / RACIAL / KIT ABILITIES (optional) ===
  const classAbilityRows = named(sheet && sheet.classAbilities);
  const racialAbilityRows = named(sheet && sheet.racialAbilities);
  const kitAbilityRows = named(sheet && sheet.kitAbilities);
  const classKitNotes = String((sheet && sheet.notesEx && sheet.notesEx.classkit) || '').trim();

  const showAbilities = !!opts.abilities && (
    classAbilityRows.length > 0 ||
    racialAbilityRows.length > 0 ||
    kitAbilityRows.length > 0 ||
    classKitNotes !== ''
  );

  // A labelled two-column table: ability name on the left, its effect on the
  // right. Returns an array so it can be spread straight into the block list,
  // and an empty group contributes nothing at all.
  const abilityGroup = (label, rows) => rows.length === 0 ? [] : [
    { text: label, fontSize: 7, bold: true, margin: [0, 2, 0, 2] },
    {
      table: {
        widths: ['30%', '70%'],
        body: rows.map(a => [
          cell(a.name, 6, { bold: true }),
          cell(a.notes)
        ])
      },
      layout: gridLayout,
      margin: [0, 0, 0, 4]
    }
  ];

  const abilityBlocks = [];

  if (showAbilities) {
    abilityBlocks.push(...abilityGroup('Class Abilities', classAbilityRows));
    abilityBlocks.push(...abilityGroup('Racial Abilities', racialAbilityRows));
    abilityBlocks.push(...abilityGroup('Kit Abilities', kitAbilityRows));

    if (classKitNotes) {
      abilityBlocks.push({ text: 'Class / Kit Notes', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      abilityBlocks.push({ text: classKitNotes, fontSize: 6, margin: [0, 0, 0, 4] });
    }
  }

  // Page 3 collects the character-detail sections. It opens only if at least
  // one of them is actually printing -- switching them all off produces no
  // blank page. Further sections OR into this flag as they are added.
  const showPage3 = showLanguages || showThief || showAbilities;

  // Create PDF document definition
  const docDefinition = {
    pageSize: 'LETTER',
    pageMargins: [20, 20, 20, 20],
    info: {
      title: `${characterName} - Character Sheet`,
      author: playerName,
      subject: 'AD&D 2nd Edition Character Sheet'
    },
    content: [
      // === TOP INFO BAR ===
      {
        table: {
          widths: ['25%', '18%', '12%', '15%', '15%', '15%'],
          body: [
            [
              { text: 'Character', fontSize: 6, bold: true, border: [true, true, false, false] },
              { text: 'Class/Kit', fontSize: 6, bold: true, border: [true, true, false, false] },
              { text: 'Level', fontSize: 6, bold: true, border: [true, true, false, false] },
              { text: 'Race', fontSize: 6, bold: true, border: [true, true, false, false] },
              { text: 'Alignment', fontSize: 6, bold: true, border: [true, true, false, false] },
              { 
                stack: [
                  { text: 'Advanced', fontSize: 10, bold: true, alignment: 'right', margin: [0, 0, 0, -2] },
                  { 
                    text: 'Dungeons&Dragons', 
                    fontSize: 11, 
                    bold: true, 
                    alignment: 'right',
                    margin: [0, 0, 0, -2]
                  },
                  { text: '2nd Edition', fontSize: 7, italics: true, alignment: 'right' }
                ],
                rowSpan: 2,
                border: [true, true, true, false]
              }
            ],
            [
              { text: characterName, fontSize: 8, border: [true, false, false, true] },
              { text: kit ? `${clazzDisplay}/${kit}` : clazzDisplay, fontSize: 8, border: [true, false, false, true] },
              { text: level, fontSize: 8, border: [true, false, false, true] },
              { text: race, fontSize: 8, border: [true, false, false, true] },
              { text: alignment, fontSize: 8, border: [true, false, false, true] },
              {}
            ],
            [
              { text: 'Patron Deity/Religion', fontSize: 6, bold: true, border: [true, true, false, false], colSpan: 3 },
              {},
              {},
              { text: 'Place of Origin', fontSize: 6, bold: true, border: [true, true, false, false], colSpan: 2 },
              {},
              { text: 'PLAYER CHARACTER RECORD', fontSize: 7, bold: true, alignment: 'center', border: [true, false, true, true] }
            ],
            [
              { text: '', fontSize: 8, border: [true, false, false, true], colSpan: 3 },
              {},
              {},
              { text: '', fontSize: 8, border: [true, false, false, true], colSpan: 2 },
              {},
              { text: '', border: [true, false, true, false] }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 1,
          paddingBottom: () => 1
        },
        margin: [0, 0, 0, 5]
      },
      
      // === MAIN SECTION: Ability Scores + Saving Throws ===
      {
        unbreakable: true,
        columns: [
          // LEFT: ABILITY SCORES
          {
            width: '52%',
            stack: [
              {
                text: 'ABILITY SCORES',
                fontSize: 8,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 2]
              },
              {
                table: {
                  widths: ['14%', '12%', '12%', '12%', '14%', '12%', '12%'],
                  body: [
                    // STR Header Row
                    [
                      {
                        stack: [
                          { text: 'STR', fontSize: 7, bold: true, alignment: 'center' },
                          { text: strDisplay, fontSize: 10, bold: true, alignment: 'center', margin: [0, 1, 0, 0] }
                        ],
                        rowSpan: 2,
                        margin: [0, 3, 0, 0]
                      },
                      { text: 'Hit\nAdj', fontSize: 5, alignment: 'center' },
                      { text: 'Dmg\nAdj', fontSize: 5, alignment: 'center' },
                      { text: 'Weight\nAllow', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Open\nDoors', fontSize: 5, alignment: 'center' },
                      { text: 'Bend\nBars', fontSize: 5, alignment: 'center' }
                    ],
                    // STR Values
                    [
                      {},
                      { text: strHitAdj, fontSize: 7, alignment: 'center' },
                      { text: strDmgAdj, fontSize: 7, alignment: 'center' },
                      { text: strWeight, fontSize: 6, alignment: 'center', colSpan: 2 },
                      {},
                      { text: strOpenDoors, fontSize: 7, alignment: 'center' },
                      { text: strBendBars, fontSize: 7, alignment: 'center' }
                    ],
                    // DEX Header Row
                    [
                      {
                        stack: [
                          { text: 'DEX', fontSize: 7, bold: true, alignment: 'center' },
                          { text: dex, fontSize: 10, bold: true, alignment: 'center', margin: [0, 1, 0, 0] }
                        ],
                        rowSpan: 2,
                        margin: [0, 2, 0, 0]
                      },
                      { text: 'Surprise\nAdj', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Missile Att\nAdj', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Defensive\nAdj', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    // DEX Values
                    [
                      {},
                      { text: dexReaction, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {},
                      { text: dexMissile, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {},
                      { text: dexAC, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    // CON Header Row
                    [
                      {
                        stack: [
                          { text: 'CON', fontSize: 7, bold: true, alignment: 'center' },
                          { text: con, fontSize: 10, bold: true, alignment: 'center', margin: [0, 1, 0, 0] }
                        ],
                        rowSpan: 2,
                        margin: [0, 3, 0, 0]
                      },
                      { text: 'HP\nAdj', fontSize: 5, alignment: 'center' },
                      { text: 'System\nShock', fontSize: 5, alignment: 'center' },
                      { text: 'Resurrect\nSurvival', fontSize: 5, alignment: 'center' },
                      { text: 'Poison\nSave', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Regen', fontSize: 5, alignment: 'center' }
                    ],
                    // CON Values
                    [
                      {},
                      { text: conHP, fontSize: 7, alignment: 'center' },
                      { text: conShock, fontSize: 7, alignment: 'center' },
                      { text: conResurrect, fontSize: 7, alignment: 'center' },
                      { text: conPoison, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {},
                      { text: conRegen, fontSize: 7, alignment: 'center' }
                    ],
                    // INT Header Row
                    [
                      {
                        stack: [
                          { text: 'INT', fontSize: 7, bold: true, alignment: 'center' },
                          { text: int, fontSize: 10, bold: true, alignment: 'center', margin: [0, 1, 0, 0] }
                        ],
                        rowSpan: 2,
                        margin: [0, 3, 0, 0]
                      },
                      { text: "Add'l\nLang", fontSize: 5, alignment: 'center' },
                      { text: 'Bonus\nNWPs', fontSize: 5, alignment: 'center' },
                      { text: 'Learn\nSpell%', fontSize: 5, alignment: 'center' },
                      { text: 'Max #\nSpells', fontSize: 5, alignment: 'center' },
                      { text: 'Spell\nImmun', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    // INT Values
                    [
                      {},
                      { text: intLanguages, fontSize: 7, alignment: 'center' },
                      { text: intBonusProfs, fontSize: 7, alignment: 'center' },
                      { text: intLearnSpell, fontSize: 7, alignment: 'center' },
                      { text: intMaxSpells, fontSize: 7, alignment: 'center' },
                      { text: intImmunity, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    // WIS Header Row
                    [
                     {
                        stack: [
                          { text: 'WIS', fontSize: 7, bold: true, alignment: 'center' },
                          { text: wis, fontSize: 10, bold: true, alignment: 'center', margin: [0, 1, 0, 0] }
                        ],
                        rowSpan: 2,
                        margin: [0, 3, 0, 0]
                      },
                      { text: 'Magical\nDef Adj', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Bonus\nSpells', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Spell\nFailure', fontSize: 5, alignment: 'center' },
                      { text: 'Spell\nImmun', fontSize: 5, alignment: 'center' }
                    ],
                    // WIS Values
                    [
                      {},
                      { text: wisMagicDef, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {},
                      { text: wisSpellBonus, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {},
                      { text: wisSpellFailure, fontSize: 7, alignment: 'center' },
                      { text: wisImmunity, fontSize: 7, alignment: 'center' }
                    ],
                    // CHA Header Row
                    [
                      {
                        stack: [
                          { text: 'CHA', fontSize: 7, bold: true, alignment: 'center' },
                          { text: cha, fontSize: 10, bold: true, alignment: 'center', margin: [0, 1, 0, 0] }
                        ],
                        rowSpan: 2,
                        margin: [0, 2, 0, 0]
                      },
                      { text: 'Max #\nHenchmen', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Loyalty\nBase', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {},
                      { text: 'Reaction\nAdj', fontSize: 5, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    // CHA Values
                    [
                      {},
                      { text: chaMaxHench, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {},
                      { text: chaLoyalty, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {},
                      { text: chaReaction, fontSize: 7, alignment: 'center', colSpan: 2 },
                      {}
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  paddingLeft: () => 1,
                  paddingRight: () => 1,
                  paddingTop: () => 1,
                  paddingBottom: () => 1
                }
              }
            ]
          },
          
          // RIGHT: SAVING THROWS
          {
            width: '48%',
            stack: [
              {
                text: 'SAVING THROWS',
                fontSize: 8,
                bold: true,
                alignment: 'center',
                margin: [5, 0, 0, 2]
              },
              {
                table: {
                  widths: ['40%', '12%', '12%', '12%', '12%', '12%'],
                  body: [
                    [
                      { text: '', fontSize: 6 },
                      { text: 'Start', fontSize: 6, alignment: 'center' },
                      { text: 'Mod', fontSize: 6, alignment: 'center' },
                      { text: 'Total', fontSize: 6, alignment: 'center' },
                      { text: '+/-', fontSize: 6, alignment: 'center' },
                      { text: 'Modifier', fontSize: 6, alignment: 'center' }
                    ],
                    [
                      { text: 'Paralyzation/\nPoison/Death', fontSize: 6 },
                      { text: save1Data.base, fontSize: 9, bold: true, alignment: 'center' },
                      { text: save1Data.mod, fontSize: 8, alignment: 'center' },
                      { text: save1Data.total, fontSize: 9, bold: true, alignment: 'center' },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 }
                    ],
                    [
                      { text: 'Rod, Staff,\nor Wand', fontSize: 6 },
                      { text: save2Data.base, fontSize: 9, bold: true, alignment: 'center' },
                      { text: save2Data.mod, fontSize: 8, alignment: 'center' },
                      { text: save2Data.total, fontSize: 9, bold: true, alignment: 'center' },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 }
                    ],
                    [
                      { text: 'Petrification/\nPolymorph', fontSize: 6 },
                      { text: save3Data.base, fontSize: 9, bold: true, alignment: 'center' },
                      { text: save3Data.mod, fontSize: 8, alignment: 'center' },
                      { text: save3Data.total, fontSize: 9, bold: true, alignment: 'center' },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 }
                    ],
                    [
                      { text: 'Breath Weapon', fontSize: 6 },
                      { text: save4Data.base, fontSize: 9, bold: true, alignment: 'center' },
                      { text: save4Data.mod, fontSize: 8, alignment: 'center' },
                      { text: save4Data.total, fontSize: 9, bold: true, alignment: 'center' },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 }
                    ],
                    [
                      { text: 'Spell', fontSize: 6 },
                      { text: save5Data.base, fontSize: 9, bold: true, alignment: 'center' },
                      { text: save5Data.mod, fontSize: 8, alignment: 'center' },
                      { text: save5Data.total, fontSize: 9, bold: true, alignment: 'center' },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 }
                    ],
                    [
                      { text: 'Spell\nResistance', fontSize: 6 },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 },
                      { text: '', fontSize: 8 }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 2,
                  paddingBottom: () => 2
                },
                margin: [5, 0, 0, 0]
              }
            ]
          }
        ],
        margin: [0, 0, 0, 5]
      },
      
      // === COMBAT SECTION ===
      printSection('COMBAT',
      {
        columns: [
          // Armor/AC Section
          {
            width: '30%',
            stack: [
              {
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      { text: 'ARMOR CLASS', fontSize: 7, bold: true, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    [
                      { text: ac, fontSize: 18, bold: true, alignment: 'center', colSpan: 2, margin: [0, 2, 0, 2] },
                      {}
                    ],
                    [
                      { text: 'Rear', fontSize: 6, alignment: 'center' },
                      { text: 'Surprised', fontSize: 6, alignment: 'center' }
                    ],
                    [
                      { text: acRear, fontSize: 8, alignment: 'center' },
                      { text: acSurprised, fontSize: 8, alignment: 'center' }
                    ],
                    [
                      { text: 'Shieldless', fontSize: 6, alignment: 'center' },
                      { text: 'vs Missiles', fontSize: 6, alignment: 'center' }
                    ],
                    [
                      { text: acNoShield, fontSize: 8, alignment: 'center' },
                      { text: acVsMissiles, fontSize: 8, alignment: 'center' }
                    ],
                    [
                      { text: 'Armor Worn', fontSize: 6, colSpan: 2 },
                      {}
                    ],
                    [
                      { text: armorWorn || '\u2014', fontSize: 6, colSpan: 2, margin: [0, 1, 0, 1] },
                      {}
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 1,
                  paddingBottom: () => 1
                }
              }
            ]
          },
          
          // DEX/Vision/Hearing Checks
          {
            width: '22%',
            stack: [
              {
                table: {
                  widths: ['100%'],
                  body: [
                    [{ text: 'DEX Checks', fontSize: 6 }],
                    [{ text: '', fontSize: 8, margin: [0, 4, 0, 4] }],
                    [{ text: 'Vision Checks', fontSize: 6 }],
                    [{ text: '', fontSize: 8, margin: [0, 4, 0, 4] }],
                    [{ text: 'Hearing Checks', fontSize: 6 }],
                    [{ text: '', fontSize: 8, margin: [0, 4, 0, 4] }]
                  ]
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 1,
                  paddingBottom: () => 1
                },
                margin: [5, 0, 0, 0]
              }
            ]
          },
          
          // HP Section
          {
            width: '28%',
            stack: [
              {
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      { text: 'HIT POINTS', fontSize: 7, bold: true, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    [
                      { text: 'Numbed #', fontSize: 6 },
                      { text: 'Wounds', fontSize: 6 }
                    ],
                    [
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] },
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] }
                    ],
                    [
                      { text: 'Useless #', fontSize: 6 },
                      { text: '', fontSize: 6 }
                    ],
                    [
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] },
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] }
                    ],
                    [
                      { text: 'Max Deaths', fontSize: 6 },
                      { text: '', fontSize: 6 }
                    ],
                    [
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] },
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] }
                    ],
                    [
                      { text: 'Hit Dice: d', fontSize: 6 },
                      { text: 'Deaths to Date', fontSize: 6 }
                    ],
                    [
                      { text: hp, fontSize: 8, alignment: 'center' },
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 1,
                  paddingBottom: () => 1
                },
                margin: [5, 0, 0, 0]
              }
            ]
          },
          
          // Movement/Weight
          {
            width: '20%',
            stack: [
              {
                table: {
                  widths: ['100%'],
                  body: [
                    [{ text: 'Movement', fontSize: 6 }],
                    [{ text: baseMovement, fontSize: 8 }],
                    [{ text: 'Max Carry', fontSize: 6 }],
                    [{ text: encumbranceMax, fontSize: 8 }],
                    [{ text: 'Current', fontSize: 6 }],
                    [{ text: '', fontSize: 8, margin: [0, 13, 0, 13] }]
                  ]
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 1,
                  paddingBottom: () => 1
                },
                margin: [5, 0, 0, 0]
              }
            ]
          }
        ],
        margin: [0, 0, 0, 5]
      },
      
      ),

      // === THAC0 MATRIX ===
      {
        unbreakable: true,
        table: {
          widths: ['11%', ...Array(21).fill('*')],
          body: [
            [
              { text: "Target's AC", fontSize: 6, bold: true },
              ...['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10'].map(ac => 
                ({ text: ac, fontSize: 6, bold: true, alignment: 'center' })
              )
            ],
            [
              { text: 'To Hit #', fontSize: 6, bold: true },
              ...thac0Matrix.map(roll => ({ text: roll, fontSize: 7, alignment: 'center' }))
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          paddingLeft: () => 1,
          paddingRight: () => 1,
          paddingTop: () => 1,
          paddingBottom: () => 1
        },
        margin: [0, 0, 0, 5]
      },
      
      // === COMBAT MODIFIERS ===
      printSection('COMBAT MODIFIERS',
      {
        columns: [
          {
            width: '33%',
            table: {
              widths: ['70%', '30%'],
              body: [
                [
                  { text: 'To Hit Modifiers', fontSize: 7, bold: true },
                  { text: '+/-', fontSize: 7, bold: true, alignment: 'center' }
                ],
                [
                  { text: 'Non-proficiency penalty', fontSize: 7 },
                  { text: '', fontSize: 7, margin: [0, 5, 0, 5] }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 2,
              paddingBottom: () => 2
            }
          },
          {
            width: '33%',
            table: {
              widths: ['70%', '30%'],
              body: [
                [
                  { text: 'Damage Modifiers', fontSize: 7, bold: true },
                  { text: '+/-', fontSize: 7, bold: true, alignment: 'center' }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 2,
              paddingBottom: () => 2
            },
            margin: [5, 0, 0, 0]
          },
          {
            width: '34%',
            table: {
              widths: ['70%', '30%'],
              body: [
                [
                  { text: 'AC Modifiers', fontSize: 7, bold: true },
                  { text: '+/-', fontSize: 7, bold: true, alignment: 'center' }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ],
                [
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] },
                  { text: '', fontSize: 7, margin: [0, 8, 0, 8] }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 2,
              paddingBottom: () => 2
            },
            margin: [5, 0, 0, 0]
          }
        ],
        margin: [0, 0, 0, 5]
      },
      
      ),

      // === PAGE 2: Weapons & Proficiencies ===
      pageBreakBefore(printSection('WEAPON COMBAT',
      {
        table: {
          widths: ['25%', '6%', '6%', '8%', '8%', '12%', '17%', '18%'],
          body: [
            [
              { text: 'Weapon', fontSize: 6, bold: true },
              { text: '#AT', fontSize: 6, bold: true, alignment: 'center' },
              { text: 'Size', fontSize: 6, bold: true, alignment: 'center' },
              { text: 'Type', fontSize: 6, bold: true, alignment: 'center' },
              { text: 'Speed', fontSize: 6, bold: true, alignment: 'center' },
              { text: 'Hit/Dmg Adj', fontSize: 6, bold: true, alignment: 'center' },
              { text: 'Damage', fontSize: 6, bold: true, alignment: 'center' },
              { text: 'Range/Special', fontSize: 6, bold: true }
            ],
            ...weapons.slice(0, 8).map(w => [
              { text: w.name, fontSize: 7 },
              { text: w.attacks, fontSize: 7, alignment: 'center' },
              { text: w.size, fontSize: 7, alignment: 'center' },
              { text: w.type, fontSize: 7, alignment: 'center' },
              { text: w.speed, fontSize: 7, alignment: 'center' },
              { text: w.hitDmg, fontSize: 7, alignment: 'center' },
              { text: w.damage, fontSize: 7, alignment: 'center' },
              { text: w.range, fontSize: 6 }
            ]),
            ...Array(Math.max(0, 8 - weapons.length)).fill(null).map(() => [
              { text: '', margin: [0, 4, 0, 4] },
              { text: '', margin: [0, 4, 0, 4] },
              { text: '', margin: [0, 4, 0, 4] },
              { text: '', margin: [0, 4, 0, 4] },
              { text: '', margin: [0, 4, 0, 4] },
              { text: '', margin: [0, 4, 0, 4] },
              { text: '', margin: [0, 4, 0, 4] },
              { text: '', margin: [0, 4, 0, 4] }
            ])
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2
        },
        margin: [0, 0, 0, 5]
      },
      
      )),

      // === PROFICIENCIES ===
      printSection('PROFICIENCIES',
      {
        columns: [
          {
            width: '33%',
            table: {
              widths: ['100%'],
              body: [
                [
                  { text: 'Proficiency', fontSize: 6, bold: true }
                ],
                ...proficiencies.slice(0, 6).map(p => [
                  { text: p.name, fontSize: 6 }
                ]),
                ...Array(Math.max(0, 6 - proficiencies.slice(0, 6).length)).fill(null).map(() => [
                  { text: '', margin: [0, 3, 0, 3] }
                ])
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 1,
              paddingBottom: () => 1
            }
          },
          {
            width: '33%',
            table: {
              widths: ['100%'],
              body: [
                [
                  { text: 'Proficiency', fontSize: 6, bold: true }
                ],
                ...proficiencies.slice(6, 12).map(p => [
                  { text: p.name, fontSize: 6 }
                ]),
                ...Array(Math.max(0, 6 - proficiencies.slice(6, 12).length)).fill(null).map(() => [
                  { text: '', margin: [0, 3, 0, 3] }
                ])
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 1,
              paddingBottom: () => 1
            },
            margin: [5, 0, 0, 0]
          },
          {
            width: '34%',
            table: {
              widths: ['100%'],
              body: [
                [
                  { text: 'Proficiency', fontSize: 6, bold: true }
                ],
                ...proficiencies.slice(12, 18).map(p => [
                  { text: p.name, fontSize: 6 }
                ]),
                ...Array(Math.max(0, 6 - proficiencies.slice(12, 18).length)).fill(null).map(() => [
                  { text: '', margin: [0, 3, 0, 3] }
                ])
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 1,
              paddingBottom: () => 1
            },
            margin: [5, 0, 0, 0]
          }
        ]
      }
      ),

      // === ARMOR & AMMUNITION (optional) ===
      ...optional(showArmorAmmo,
        printSection('ARMOR & AMMUNITION', ...armorAmmoBlocks)
      ),

      // === PAGE 3: Character Detail ===
      ...optional(showPage3,
        { text: '', fontSize: 1, pageBreak: 'before' }
      ),

      // === LANGUAGES (optional) ===
      ...optional(showLanguages,
        printSection('LANGUAGES', ...languageBlocks)
      ),

      // === THIEF SKILLS (optional) ===
      ...optional(showThief,
        printSection('THIEF SKILLS', ...thiefBlocks)
      ),

      // === CLASS / RACIAL / KIT ABILITIES (optional) ===
      ...optional(showAbilities,
        printSection('SPECIAL ABILITIES', ...abilityBlocks)
      )
    ]
  };

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`${characterName.replace(/[^a-z0-9]/gi, '_')}_CharSheet.pdf`);
}
