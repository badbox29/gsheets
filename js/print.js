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
  // How many data rows stay glued to the section heading before the table is
  // allowed to break. Enough to prove the section started; few enough that the
  // glued block still fits in most page remainders.
  const SECTION_LEAD_ROWS = 5;

  // Binds a section heading to the start of its content so the heading can
  // never be orphaned at the foot of a page, while still allowing a long table
  // to break across pages.
  //
  // The first attempt split the table into a glued lead and a free-flowing
  // tail. That worked, but the tail had to re-declare its header row so the
  // columns would reprint on continuation pages -- which meant the header
  // appeared TWICE whenever both halves landed on the same page.
  //
  // This version instead folds the title (and any preamble blocks) INTO the
  // table as borderless full-width rows, and declares them part of headerRows.
  // pdfMake then does the work natively: the title and column headers reprint
  // at the top of every page the table spills onto, nothing is ever doubled,
  // and keepWithHeaderRows stops the header being stranded alone at the foot
  // of a page. One table, no manual splitting.
  const printSection = (title, ...blocks) => {
    // Treatment I: centred small caps with a hairline rule running out to each
    // margin. The rules are drawn as the BOTTOM border of two flexible side
    // cells rather than as canvas lines, because a canvas needs an explicit
    // width in points and these sections sit at several different widths.
    // Borders size themselves to whatever column they land in.
    const titleNode = {
      table: {
        widths: ['*', 'auto', '*'],
        body: [[
          { text: ' ', fontSize: 8, border: [false, false, false, true] },
          {
            text: title,
            fontSize: 8,
            bold: true,
            color: palette.ink,
            characterSpacing: 1.2,
            alignment: 'center',
            margin: [8, 0, 8, 0],
            border: [false, false, false, false]
          },
          { text: ' ', fontSize: 8, border: [false, false, false, true] }
        ]]
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0,
        hLineColor: () => palette.rule,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0
      },
      margin: [0, 0, 0, 2]
    };

    // The first real table in the section. A section built from columns or
    // pure prose has none, and keeps the original glued-block behavior.
    const tableIdx = blocks.findIndex(b => b && b.table && Array.isArray(b.table.body));
    if (tableIdx < 0) {
      return { unbreakable: true, stack: [titleNode, ...blocks] };
    }

    const tableBlock = blocks[tableIdx];
    const colCount = (tableBlock.table.widths && tableBlock.table.widths.length)
      || (tableBlock.table.body[0] || []).length
      || 1;

    // A full-width borderless row, so a heading or summary line sits inside
    // the table structurally while still looking like floating text.
    const fullWidthRow = node => {
      const row = [Object.assign({}, node, {
        colSpan: colCount,
        border: [false, false, false, false]
      })];
      for (let i = 1; i < colCount; i++) row.push({});
      return row;
    };

    const preambleBlocks = blocks.slice(0, tableIdx);
    const preambleRows = preambleBlocks.map(fullWidthRow);
    const existingHeaderRows = tableBlock.table.headerRows || 0;

    // The title and preamble sit inside headerRows so they reprint on every
    // continuation page -- but they must not pick up the header tint, so the
    // first cell of each carries a marker that gridLayout's fillColor checks.
    const titleRow = fullWidthRow(titleNode);
    titleRow[0]._sectionTitle = true;
    preambleRows.forEach(r => { r[0]._sectionTitle = true; });

    // Column-header text takes the scheme's ink. Done here rather than at
    // twenty individual table definitions.
    const originalBody = tableBlock.table.body.map((row, i) =>
      i < existingHeaderRows
        ? row.map(c => (c && typeof c === 'object' && 'text' in c)
            ? Object.assign({}, c, { color: palette.ink })
            : c)
        : row
    );

    const merged = Object.assign({}, tableBlock, {
      table: Object.assign({}, tableBlock.table, {
        body: [titleRow, ...preambleRows, ...originalBody],
        headerRows: 1 + preambleRows.length + existingHeaderRows,
        // Keep this many data rows with the header rather than letting a
        // header sit alone at the bottom of a page.
        keepWithHeaderRows: SECTION_LEAD_ROWS
      })
    });

    return { stack: [merged, ...blocks.slice(tableIdx + 1)] };
  };

  // Forces a section to begin a new page. Used to pin the fixed page layout in
  // place rather than letting sections land wherever they happen to fall --
  // page 1 is always the core stats page, page 2 is always weapons and
  // proficiencies, and so on. Wrapping rather than mutating keeps printSection
  // free of page-layout concerns.
  const pageBreakBefore = node => Object.assign({}, node, { pageBreak: 'before' });

  // Every table on this sheet uses the same hairline grid. Defined once here
  // rather than repeated inline at each table, as the page 1 code does.
  // === COLOUR SCHEMES ===
  //
  // Four values each. `ink` is section titles and column-header text, `rule`
  // is every table border, `tint` is the header-row fill, and `body` is the
  // ordinary table text -- kept nearly black in every scheme, because tinting
  // body text at 6pt costs legibility for no gain.
  //
  // All six print as grey on a mono printer, so the choice only shows on a
  // colour device. Graphite is the default and uses no colour at all.
  const PRINT_PALETTES = {
    graphite: { ink: '#2c2c2a', rule: '#a8a8a5', tint: '#eeeeec', body: '#1f1f1e' },
    slate:    { ink: '#2b4257', rule: '#9aabbd', tint: '#e7edf3', body: '#1e2730' },
    oxblood:  { ink: '#6b2430', rule: '#bfa0a4', tint: '#f3e8e9', body: '#2a1f21' },
    sepia:    { ink: '#5c4326', rule: '#b5a184', tint: '#f2ebdd', body: '#2b2318' },
    forest:   { ink: '#2f4a35', rule: '#9db3a2', tint: '#e6ede7', body: '#1f2a21' },
    plum:     { ink: '#4a2e56', rule: '#ab9ab8', tint: '#efe8f3', body: '#251d29' }
  };

  const palette = PRINT_PALETTES[opts.palette] || PRINT_PALETTES.graphite;

  // Defined once and used by every table in the document, so these three
  // callbacks recolour the entire sheet. fillColor tints only the rows
  // declared as headerRows -- which, since printSection folds the section
  // title into the header rows, would also tint the title. The title rows
  // carry no border and sit above the real header, so they are excluded by
  // checking for the borderless marker set in printSection.
  const gridLayout = {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => palette.rule,
    vLineColor: () => palette.rule,
    fillColor: (rowIndex, node) => {
      const hdr = node.table.headerRows || 0;
      if (rowIndex >= hdr) return null;
      const row = node.table.body[rowIndex] || [];
      const first = row[0] || {};
      return first._sectionTitle ? null : palette.tint;
    },
    paddingLeft: () => 2,
    paddingRight: () => 2,
    paddingTop: () => 1,
    paddingBottom: () => 1
  };

  // Used for the LEAD half of a split table. When a section is split, the lead
  // and the remainder are two separate tables; if they land on the same page,
  // drawing both the lead's bottom rule and the remainder's top rule would
  // produce a doubled line where they meet. Omitting the lead's closing rule
  // makes the join invisible in the common case, at the cost of leaving the
  // lead slightly open at the foot of a page on the rarer case where the
  // split actually falls there.
  // === PAGE 1 FORM LAYOUT ===
  //
  // Page 1 and the weapon table are FORMS -- boxed cells a player writes into
  // -- where pages 3 onward are reference tables. So they get no header tint;
  // white cells throughout, with the scheme showing in the rules instead.
  //
  // Two weights do the work: a 1.25pt boundary in the full ink around the
  // outside of each block, and 0.5pt hairlines in the pale tone inside it.
  // That is what gives page 1 structure without any fills. The original code
  // used a single 1pt black rule everywhere, which is why it reads flat.
  const formLayout = (padX, padY) => ({
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => palette.rule,
    vLineColor: () => palette.rule,
    paddingLeft: () => padX,
    paddingRight: () => padX,
    paddingTop: () => padY,
    paddingBottom: () => padY
  });

  const gridLayoutOpenBottom = {
    hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 1),
    vLineWidth: () => 1,
    hLineColor: () => palette.rule,
    vLineColor: () => palette.rule,
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

  // === BLANK ROWS ===
  // A printed sheet is used away from the app, so every list needs room to
  // write in what gets picked up during a session. Counts come from the print
  // modal; zero disables. The rows are taller than data rows to leave room
  // for handwriting.
  const blanks = (opts && opts.blanks) || {};
  const blankCount = key => Math.max(0, parseInt(blanks[key], 10) || 0);

  const blankRows = (key, cols) => {
    const n = blankCount(key);
    const out = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push({ text: '', fontSize: 6, margin: [0, 4, 0, 4] });
      out.push(row);
    }
    return out;
  };

  // A section prints if it has data OR if blank rows were asked for -- a
  // player who wants somewhere to record the magic items they find should get
  // the section even though they own none yet.
  const hasContent = (rows, key) => rows.length > 0 || blankCount(key) > 0;

  // === USED TALLY ===
  // Consumables count DOWN during play, and the quantity itself changes -- pick
  // up two arrows and any pre-drawn set of boxes is already wrong. So this is
  // just open space, sized for hash marks. Players tally the usual way.
  const tallyBoxes = () =>
    ({ text: ' ', fontSize: 9, margin: [0, 3, 0, 3] });

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
  const damageTaken = val(root, 'damage_taken') || '0';
  const currentHP = val(root, 'current_hp') || hp;
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
  //
  // This used to regex-scrape el.title looking for "Base: X". That worked, but
  // it silently degraded to "no modifiers at all" the moment the tooltip's
  // wording changed -- a wrong number printed confidently, with no error.
  //
  // The record carries the modifiers directly in sheet.savingThrows (save1
  // through save5, plus save5_mental), and the field's own value is the final
  // total. Base is then simply total minus modifier, with no parsing involved.
  const saveMods = (sheet && sheet.savingThrows) || {};

  const parseSave = (saveNum) => {
    const el = root.querySelector(`[data-field="save${saveNum}"]`);
    const total = el?.value || '';
    if (!total) return { base: '', mod: '', total: '' };

    const totalNum = parseInt(total, 10);
    const modNum = parseInt(saveMods[`save${saveNum}`], 10) || 0;

    if (isNaN(totalNum)) return { base: total, mod: '', total: total };

    return {
      base: String(totalNum - modNum),
      mod: modNum !== 0 ? (modNum > 0 ? `+${modNum}` : String(modNum)) : '',
      total: total
    };
  };
  
  const save1Data = parseSave(1);
  const save2Data = parseSave(2);
  const save3Data = parseSave(3);
  const save4Data = parseSave(4);
  const save5Data = parseSave(5);

  // save5_mental is a second modifier against mental-effect spells (charm,
  // domination and the like) where Wisdom's Magical Defense Adjustment applies
  // on top of the ordinary spell save. It is recorded but has never printed.
  const save5MentalMod = parseInt(saveMods.save5_mental, 10) || 0;
  const save5MentalTotal = (save5Data.total && !isNaN(parseInt(save5Data.total, 10)))
    ? parseInt(save5Data.total, 10) - save5MentalMod
    : null;
  const save5MentalNote = (save5MentalMod !== 0 && save5MentalTotal !== null)
    ? `vs. mental-effect spells: ${save5MentalTotal} ` +
      `(${save5MentalMod > 0 ? '+' : ''}${save5MentalMod} Wisdom magical defense)`
    : '';
  
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

  // Zero is signed too: "+0 / +0" reads as a computed adjustment of none,
  // where "0 / 0" reads like a field nobody filled in.
  const signed = n => (n >= 0 ? '+' + n : String(n));

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
  //
  // Previously this scraped the <strong> out of each DOM card and kept nothing
  // but the name, merged weapon and nonweapon profs into one flat list, and
  // hard-capped the output at 18 entries -- so a character with 19 silently
  // lost the rest. The record carries both arrays fully structured, including
  // the ability check that is the whole point of a nonweapon proficiency.
  const weaponProfRows = named(sheet && sheet.weaponProfs);
  const nwpRows = named(sheet && sheet.nwps);

  // Slot budget, so the printed sheet shows the same accounting as the app.
  const profSlots = (typeof getCharacterProficiencySlots === 'function')
    ? getCharacterProficiencySlots(root)
    : null;

  const wpSpent = weaponProfRows.reduce((n, p) => n + (parseInt(p.slots, 10) || 0), 0);
  const nwpProfSpent = nwpRows.reduce((n, p) => n + (parseInt(p.slots, 10) || 0), 0);
  const langSpent = (typeof getLanguageSlotsSpent === 'function')
    ? getLanguageSlotsSpent(root)
    : 0;
  const nwpSpent = nwpProfSpent + langSpent;
  
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
  const showArmorAmmo = !!opts.armorAmmo &&
    (hasContent(armorRows, 'armor') || hasContent(ammoRows, 'ammo'));

  const armorAmmoBlocks = [];

  if (showArmorAmmo && hasContent(armorRows, 'armor')) {
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
          ]),
          ...blankRows('armor', 7)
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  if (showArmorAmmo && hasContent(ammoRows, 'ammo')) {
    armorAmmoBlocks.push({
      table: {
        headerRows: 1,
        widths: opts.tallyBoxes
          ? ['26%', '8%', '11%', '11%', '44%']
          : ['40%', '15%', '20%', '25%'],
        body: [
          [
            cell('Ammunition', 6, { bold: true }),
            cell('Qty', 6, { bold: true, alignment: 'center' }),
            cell('Wt each', 6, { bold: true, alignment: 'center' }),
            cell('Total wt', 6, { bold: true, alignment: 'center' }),
            ...(opts.tallyBoxes ? [cell('Used', 6, { bold: true })] : [])
          ],
          ...ammoRows.map(a => {
            const qty = parseFloat(a.quantity) || 0;
            const per = parseFloat(a.weightPerUnit) || 0;
            const total = qty * per;
            return [
              cell(a.name),
              cell(a.quantity, 6, { alignment: 'center' }),
              cell(a.weightPerUnit, 6, { alignment: 'center' }),
              cell(total ? total.toFixed(1) : '', 6, { alignment: 'center' }),
              ...(opts.tallyBoxes ? [tallyBoxes(a.quantity)] : [])
            ];
          }),
          ...blankRows('ammo', opts.tallyBoxes ? 5 : 4)
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === LANGUAGES (optional) ===
  const languageRows = named(sheet && sheet.languages);
  const showLanguages = !!opts.languages && hasContent(languageRows, 'languages');

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
          ]),
          ...blankRows('languages', 6)
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

  // === POWERS & HINDRANCES (optional) ===
  // Free-text fields. Kit and homebrew-class benefits go in powers; the
  // matching restrictions go in hindrances. Printed as prose because that is
  // how they are entered -- there is no structure to tabulate.
  const powersText = String((sheet && sheet.notesEx && sheet.notesEx.powers) || '').trim();
  const hindrancesText = String((sheet && sheet.notesEx && sheet.notesEx.hindrances) || '').trim();
  const showPowers = !!opts.powersHindrances && (powersText !== '' || hindrancesText !== '');

  const powersBlocks = [];

  if (showPowers) {
    if (powersText) {
      powersBlocks.push({ text: 'Powers', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      powersBlocks.push({ text: powersText, fontSize: 6, margin: [0, 0, 0, 4] });
    }
    if (hindrancesText) {
      powersBlocks.push({ text: 'Hindrances', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      powersBlocks.push({ text: hindrancesText, fontSize: 6, margin: [0, 0, 0, 4] });
    }
  }

  // === ACTIVE CONDITIONS (optional) ===
  // Note the shape: conditions carry a `condition` key, not `name`, so the
  // named() helper does not apply here.
  const conditionRows = (sheet && Array.isArray(sheet.conditions))
    ? sheet.conditions.filter(c => c && String(c.condition || '').trim())
    : [];
  const showConditions = !!opts.conditions && hasContent(conditionRows, 'conditions');

  // The stored value is the condition's display name, which is also its key
  // into the effects database.
  const conditionEffect = name => {
    if (typeof CONDITIONS_DB === 'undefined' || !Array.isArray(CONDITIONS_DB)) return '';
    const hit = CONDITIONS_DB.find(c =>
      String(c.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase());
    return hit ? String(hit.description || '') : '';
  };

  const conditionBlocks = [];

  if (showConditions) {
    conditionBlocks.push({
      table: {
        headerRows: 1,
        widths: ['20%', '12%', '10%', '58%'],
        body: [
          [
            cell('Condition', 6, { bold: true }),
            cell('Duration', 6, { bold: true, alignment: 'center' }),
            cell('HP Loss', 6, { bold: true, alignment: 'center' }),
            cell('Effect', 6, { bold: true })
          ],
          ...conditionRows.map(c => [
            cell(c.condition, 6, { bold: true }),
            cell(c.duration || '\u2014', 6, { alignment: 'center' }),
            cell(c.hpLoss || '\u2014', 6, { alignment: 'center' }),
            cell(conditionEffect(c.condition))
          ]),
          ...blankRows('conditions', 4)
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // Page 3 collects the character-detail sections. It opens only if at least
  // one of them is actually printing -- switching them all off produces no
  // blank page. Further sections OR into this flag as they are added.
  const showPage3 = showLanguages || showThief || showAbilities || showPowers || showConditions;

  // === SPELL SLOTS & ACCESS (optional) ===
  const magic = (sheet && sheet.magic) || {};
  const slotArr = Array.isArray(magic.slots) ? magic.slots : [];
  const usedArr = Array.isArray(magic.used) ? magic.used : [];
  const spheresList = (sheet && Array.isArray(sheet.selectedSpheres)) ? sheet.selectedSpheres : [];
  const schoolsList = (sheet && Array.isArray(sheet.selectedSchools)) ? sheet.selectedSchools : [];
  const accessNotes = String(magic.schools || '').trim();
  const magicNotes = String(magic.notes || '').trim();

  const hasAnySlots = slotArr.some(s => String(s || '').trim() !== '');
  const showSpellAccess = !!opts.spellAccess && (
    hasAnySlots ||
    spheresList.length > 0 ||
    schoolsList.length > 0 ||
    accessNotes !== '' ||
    magicNotes !== ''
  );

  const spellAccessBlocks = [];

  if (showSpellAccess) {
    // All nine levels always print. A caster who cannot reach 7th level yet
    // still benefits from seeing the ladder they are climbing, and a fixed
    // grid is what a traditional sheet looks like.
    const levelIdx = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    spellAccessBlocks.push({
      table: {
        widths: ['16%', ...Array(9).fill('*')],
        body: [
          [
            cell('Spell Level', 6, { bold: true }),
            ...levelIdx.map(i => cell(String(i + 1), 6, { bold: true, alignment: 'center' }))
          ],
          [
            cell('Slots', 6, { bold: true }),
            ...levelIdx.map(i => cell(slotArr[i] || '\u2014', 7, { alignment: 'center' }))
          ],
          [
            cell('Cast', 6, { bold: true }),
            ...levelIdx.map(i => cell(usedArr[i] || '', 7, { alignment: 'center' }))
          ],
          [
            cell('Remaining', 6, { bold: true }),
            ...levelIdx.map(i => {
              const s = parseInt(slotArr[i], 10);
              if (isNaN(s)) return cell('\u2014', 7, { alignment: 'center' });
              const u = parseInt(usedArr[i], 10) || 0;
              return cell(String(s - u), 7, { alignment: 'center' });
            })
          ]
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });

    if (spheresList.length) {
      spellAccessBlocks.push({ text: 'Spheres of Access', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      spellAccessBlocks.push({ text: spheresList.join(', '), fontSize: 6, margin: [0, 0, 0, 4] });
    }

    if (schoolsList.length) {
      spellAccessBlocks.push({ text: 'Schools of Magic', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      spellAccessBlocks.push({ text: schoolsList.join(', '), fontSize: 6, margin: [0, 0, 0, 4] });
    }

    if (accessNotes) {
      spellAccessBlocks.push({ text: 'Access Notes', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      spellAccessBlocks.push({ text: accessNotes, fontSize: 6, margin: [0, 0, 0, 4] });
    }

    if (magicNotes) {
      spellAccessBlocks.push({ text: 'Magic Notes', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      spellAccessBlocks.push({ text: magicNotes, fontSize: 6, margin: [0, 0, 0, 4] });
    }
  }

  // === MEMORIZED SPELLS (optional) ===
  // Always summary lines. The spellbook detail toggle governs the spellbook
  // only -- a memorization list is a play aid, and thirteen full descriptions
  // would bury it.
  const memorizedRows = named(magic.memorized);
  const showMemorized = !!opts.memorized && hasContent(memorizedRows, 'memorized');

  // Sorted by spell level, then alphabetically inside each level, which is how
  // a caster reads their own list. Levels that will not parse sort last.
  const memorizedSorted = memorizedRows.slice().sort((a, b) => {
    const la = parseInt(a.level, 10);
    const lb = parseInt(b.level, 10);
    const na = isNaN(la) ? 99 : la;
    const nb = isNaN(lb) ? 99 : lb;
    if (na !== nb) return na - nb;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  const memorizedBlocks = [];

  if (showMemorized) {
    memorizedBlocks.push({
      table: {
        headerRows: 1,
        widths: ['5%', '21%', '15%', '7%', '12%', '16%', '11%', '7%', '6%'],
        body: [
          [
            cell('Lvl', 6, { bold: true, alignment: 'center' }),
            cell('Spell', 6, { bold: true }),
            cell('School / Sphere', 6, { bold: true }),
            cell('Cast', 6, { bold: true, alignment: 'center' }),
            cell('Range', 6, { bold: true }),
            cell('Duration', 6, { bold: true }),
            cell('Save', 6, { bold: true }),
            cell('Comp', 6, { bold: true, alignment: 'center' }),
            cell('Used', 6, { bold: true, alignment: 'center' })
          ],
          ...memorizedSorted.map(s => [
            cell(s.level, 6, { alignment: 'center' }),
            cell(s.name, 6, { bold: true }),
            cell(s.schoolSphere),
            cell(s.castTime, 6, { alignment: 'center' }),
            cell(s.range),
            cell(s.duration),
            cell(s.save),
            cell(s.components, 6, { alignment: 'center' }),
            cell(s.cast ? 'X' : '', 6, { alignment: 'center' })
          ]),
          ...blankRows('memorized', 9)
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === SPELLBOOKS (optional) ===
  //
  // This is the one section that can genuinely outgrow a page, so it does NOT
  // use printSection. Instead the heading, the book label and the first few
  // rows travel together as one unbreakable block, and the remainder is a
  // separate table that is free to flow onto the next page, repeating its
  // header row as it goes. A heading is never orphaned; a long list is still
  // allowed to break.
  const spellbooks = Array.isArray(magic.spellbooks) ? magic.spellbooks : [];
  const booksWithSpells = spellbooks.filter(b => b && named(b.spells).length > 0);
  const showSpellbooks = !!opts.spellbooks && booksWithSpells.length > 0;
  const spellbookFull = opts.spellbookDetail === 'full';

  // (Row-splitting is handled by printSection via keepWithHeaderRows.)

  const sortSpells = rows => rows.slice().sort((a, b) => {
    const la = parseInt(a.level, 10);
    const lb = parseInt(b.level, 10);
    const na = isNaN(la) ? 99 : la;
    const nb = isNaN(lb) ? 99 : lb;
    if (na !== nb) return na - nb;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  // The Free column only earns its width for a specialist wizard who has
  // actually flagged free school spells, so it is added per book.
  const spellHeaderRow = hasFree => {
    const row = [
      cell('Lvl', 6, { bold: true, alignment: 'center' }),
      cell('Spell', 6, { bold: true }),
      cell('School / Sphere', 6, { bold: true }),
      cell('Cast', 6, { bold: true, alignment: 'center' }),
      cell('Range', 6, { bold: true }),
      cell('Duration', 6, { bold: true }),
      cell('Save', 6, { bold: true }),
      cell('Comp', 6, { bold: true, alignment: 'center' })
    ];
    if (hasFree) row.push(cell('Free', 6, { bold: true, alignment: 'center' }));
    return row;
  };

  const spellDataRow = (s, hasFree) => {
    const row = [
      cell(s.level, 6, { alignment: 'center' }),
      cell(s.name, 6, { bold: true }),
      cell(s.schoolSphere),
      cell(s.castTime, 6, { alignment: 'center' }),
      cell(s.range),
      cell(s.duration),
      cell(s.save),
      cell(s.components, 6, { alignment: 'center' })
    ];
    if (hasFree) row.push(cell(s.freeSpell ? 'X' : '', 6, { alignment: 'center' }));
    return row;
  };

  const spellTable = (rows, hasFree, withBlanks) => ({
    table: {
      headerRows: 1,
      widths: hasFree
        ? ['5%', '21%', '16%', '6%', '12%', '17%', '9%', '6%', '8%']
        : ['6%', '23%', '17%', '7%', '13%', '18%', '10%', '6%'],
      body: [
        spellHeaderRow(hasFree),
        ...rows.map(s => spellDataRow(s, hasFree)),
        ...(withBlanks ? blankRows('spellbook', hasFree ? 9 : 8) : [])
      ]
    },
    layout: gridLayout,
    margin: [0, 0, 0, 5]
  });

  const spellbookBlocks = [];

  if (showSpellbooks) {
    booksWithSpells.forEach((book, bookIndex) => {
      const rows = sortSpells(named(book.spells));
      const hasFree = rows.some(s => s.freeSpell);
      const isActive = book.id && book.id === magic.activeSpellbookId;
      const label = {
        text: `${book.name || 'Spellbook'} \u2014 ${rows.length} spell${rows.length === 1 ? '' : 's'}` +
              (isActive ? ' (active)' : ''),
        fontSize: 7,
        bold: true,
        margin: [0, 2, 0, 2]
      };

      // No manual lead/tail split any more. printSection folds the title and
      // the book label into the table's header rows, so pdfMake breaks the
      // list itself -- reprinting the title and column headers on each
      // continuation page, with nothing doubled at the join.
      //
      // The section title rides with the first book only; later books get
      // their label as the heading so each one is still announced.
      spellbookBlocks.push(
        bookIndex === 0
          ? printSection('SPELLBOOKS', label, spellTable(rows, hasFree, true))
          : printSection(label.text, spellTable(rows, hasFree, true))
      );

      if (spellbookFull) {
        spellbookBlocks.push({
          text: `${book.name || 'Spellbook'} \u2014 Spell Descriptions`,
          fontSize: 7,
          bold: true,
          margin: [0, 4, 0, 2]
        });
        rows.forEach(s => {
          const desc = String(s.description || '').trim();
          spellbookBlocks.push({
            text: [
              { text: `${s.name} `, bold: true },
              { text: `(Lvl ${s.level || '?'}, ${s.schoolSphere || 'unclassified'})  `, italics: true },
              { text: desc || 'No description recorded.' }
            ],
            fontSize: 6,
            margin: [0, 0, 0, 3]
          });
        });
      }
    });
  }

  // Page 4 carries the magic sections. Same rule as page 3 -- the break is
  // only emitted if something on the page is actually going to print.
  const showPage4 = showSpellAccess || showMemorized || showSpellbooks;

  // === EQUIPMENT, VALUABLES & COINS (optional) ===
  const itemRows = named(sheet && sheet.items);
  const valuableRows = named(sheet && sheet.valuables);
  const coins = (sheet && sheet.coins) || {};
  const enc = (sheet && sheet.encumbrance) || {};
  const hasCoins = ['cp', 'sp', 'ep', 'gp', 'pp'].some(k => (parseFloat(coins[k]) || 0) > 0);

  const showEquipment = !!opts.equipment &&
    (hasContent(itemRows, 'equipment') || hasContent(valuableRows, 'valuables') || hasCoins);

  // Qty x unit weight, so the sheet shows what the stack actually weighs.
  const stackWeight = r => {
    const q = parseFloat(r.qty) || 0;
    const w = parseFloat(r.weight) || 0;
    const t = q * w;
    return t ? t.toFixed(1) : '';
  };

  const equipmentBlocks = [];

  if (showEquipment) {
    if (hasContent(itemRows, 'equipment')) {
      equipmentBlocks.push({ text: 'Equipment', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      equipmentBlocks.push({
        table: {
          headerRows: 1,
          widths: ['32%', '7%', '10%', '10%', '41%'],
          body: [
            [
              cell('Item', 6, { bold: true }),
              cell('Qty', 6, { bold: true, alignment: 'center' }),
              cell('Wt ea', 6, { bold: true, alignment: 'center' }),
              cell('Total', 6, { bold: true, alignment: 'center' }),
              cell('Notes', 6, { bold: true })
            ],
            ...itemRows.map(r => [
              cell(r.name),
              cell(r.qty, 6, { alignment: 'center' }),
              cell(r.weight, 6, { alignment: 'center' }),
              cell(stackWeight(r), 6, { alignment: 'center' }),
              cell(r.notes)
            ]),
            ...blankRows('equipment', 5)
          ]
        },
        layout: gridLayout,
        margin: [0, 0, 0, 5]
      });
    }

    if (hasContent(valuableRows, 'valuables')) {
      equipmentBlocks.push({ text: 'Valuables', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
      equipmentBlocks.push({
        table: {
          headerRows: 1,
          widths: ['30%', '7%', '13%', '9%', '9%', '32%'],
          body: [
            [
              cell('Valuable', 6, { bold: true }),
              cell('Qty', 6, { bold: true, alignment: 'center' }),
              cell('Value ea', 6, { bold: true, alignment: 'center' }),
              cell('Wt ea', 6, { bold: true, alignment: 'center' }),
              cell('Total wt', 6, { bold: true, alignment: 'center' }),
              cell('Notes', 6, { bold: true })
            ],
            ...valuableRows.map(r => [
              cell(r.name),
              cell(r.qty, 6, { alignment: 'center' }),
              cell(r.valueEach || '\u2014', 6, { alignment: 'center' }),
              cell(r.weight, 6, { alignment: 'center' }),
              cell(stackWeight(r), 6, { alignment: 'center' }),
              cell(r.notes)
            ]),
            ...blankRows('valuables', 6)
          ]
        },
        layout: gridLayout,
        margin: [0, 0, 0, 5]
      });
    }

    // Coins and the encumbrance totals share a row -- both are "what am I
    // carrying" figures and neither justifies a section of its own.
    equipmentBlocks.push({
      columns: [
        {
          width: '55%',
          table: {
            widths: ['20%', '20%', '20%', '20%', '20%'],
            body: [
              [
                cell('CP', 6, { bold: true, alignment: 'center' }),
                cell('SP', 6, { bold: true, alignment: 'center' }),
                cell('EP', 6, { bold: true, alignment: 'center' }),
                cell('GP', 6, { bold: true, alignment: 'center' }),
                cell('PP', 6, { bold: true, alignment: 'center' })
              ],
              [
                cell(coins.cp || '0', 8, { alignment: 'center' }),
                cell(coins.sp || '0', 8, { alignment: 'center' }),
                cell(coins.ep || '0', 8, { alignment: 'center' }),
                cell(coins.gp || '0', 8, { alignment: 'center' }),
                cell(coins.pp || '0', 8, { alignment: 'center' })
              ]
            ]
          },
          layout: gridLayout
        },
        {
          width: '45%',
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                cell('Weight Carried', 6, { bold: true, alignment: 'center' }),
                cell('Maximum', 6, { bold: true, alignment: 'center' })
              ],
              [
                cell(enc.current || '\u2014', 8, { alignment: 'center' }),
                cell(enc.max || '\u2014', 8, { alignment: 'center' })
              ]
            ]
          },
          layout: gridLayout,
          margin: [5, 0, 0, 0]
        }
      ],
      margin: [0, 0, 0, 5]
    });
  }

  // === MAGIC ITEMS (optional) ===
  // A separate checkbox from equipment on purpose: a player may well want the
  // gear list on a printout while keeping the magic inventory off it.
  const magicItemRows = named(sheet && sheet.magicItems);
  const showMagicItems = !!opts.magicItems && hasContent(magicItemRows, 'magicItems');

  const magicItemBlocks = [];

  if (showMagicItems) {
    magicItemBlocks.push({
      table: {
        headerRows: 1,
        widths: opts.tallyBoxes ? ['26%', '46%', '28%'] : ['32%', '68%'],
        body: [
          [
            cell('Magic Item', 6, { bold: true }),
            cell('Notes / Charges', 6, { bold: true }),
            ...(opts.tallyBoxes ? [cell('Charges Used', 6, { bold: true })] : [])
          ],
          ...magicItemRows.map(m => [
            cell(m.name, 6, { bold: true }),
            cell(String(m.notes || '').trim()),
            ...(opts.tallyBoxes ? [tallyBoxes()] : [])
          ]),
          ...blankRows('magicItems', opts.tallyBoxes ? 3 : 2)
        ]
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // Page 5 carries gear.
  const showPage5 = showEquipment || showMagicItems;

  // === CHARACTER DETAILS (optional) ===
  const details = (sheet && sheet.details) || {};

  // Printed in this order, and only when filled in. Most characters leave the
  // majority of these blank, so a fixed grid of empty labels would waste most
  // of a page. Note "birthorder" is lower-case r in the record.
  const DETAIL_FIELDS = [
    ['Patron Deity', 'patronDeity'],
    ['Birthplace', 'birthplace'],
    ['Homeland', 'homeland'],
    ['Homeworld', 'homeworld'],
    ['Birth Order', 'birthorder'],
    ['Height', 'height'],
    ['Weight', 'weight'],
    ['Hair', 'hair'],
    ['Eyes', 'eyes'],
    ['Father', 'father'],
    ['Mother', 'mother'],
    ['Siblings', 'siblings'],
    ['Family Standing', 'familyStanding'],
    ['Family Occupation', 'familyOccupation'],
    ['Family Wealth', 'familyWealth'],
    ['Inheritance', 'inheritance'],
    ['Family Property', 'familyProperty'],
    ['Extended Family', 'extendedFamily'],
    ['Family History', 'familyHistory'],
    ['Appearance', 'appearanceNotes'],
    ['Alliances', 'alliances']
  ];

  const detailPairs = DETAIL_FIELDS
    .map(([label, key]) => [label, String(details[key] || '').trim()])
    .filter(([, value]) => value !== '');

  const showDetails = !!opts.details && detailPairs.length > 0;

  const detailBlocks = [];

  if (showDetails) {
    // Two label/value pairs per row, so short values do not each consume a
    // full-width line. An odd count leaves the last row half empty.
    const detailRows = [];
    for (let i = 0; i < detailPairs.length; i += 2) {
      const left = detailPairs[i];
      const right = detailPairs[i + 1];
      detailRows.push([
        cell(left[0], 6, { bold: true }),
        cell(left[1]),
        cell(right ? right[0] : '', 6, { bold: true }),
        cell(right ? right[1] : '')
      ]);
    }

    detailBlocks.push({
      table: {
        widths: ['18%', '32%', '18%', '32%'],
        body: detailRows
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === BACKGROUND / HISTORY (optional) ===
  // Off by default in the modal: it is prose the player wrote for themselves,
  // not something anyone reads mid-session. Ticked on, it prints verbatim
  // including line breaks, since the field is a textarea.
  const backgroundText = String(details.backgroundHistory || '').trim();
  const showBackground = !!opts.background && backgroundText !== '';

  const backgroundBlocks = [];

  if (showBackground) {
    backgroundBlocks.push({
      text: backgroundText,
      fontSize: 7,
      lineHeight: 1.15,
      margin: [0, 0, 0, 5]
    });
  }

  // === HENCHMEN (optional) ===
  const henchmenRows = named(sheet && sheet.henchmen);
  const henchmenNotes = String(details.henchmenNotes || '').trim();
  const showHenchmen = !!opts.henchmen && (henchmenRows.length > 0 || henchmenNotes !== '');

  // Twenty-plus fields per henchman is far too many for one table row, so the
  // combat-relevant ones get columns and everything else is composed into a
  // full-width detail row beneath. Empty pieces are omitted rather than
  // printing "Alignment: " with nothing after it.
  const followerDetail = (rec, abilityKeys, extraFields) => {
    const parts = [];

    const push = (label, value) => {
      const v = String(value || '').trim();
      if (!v) return;
      if (parts.length) parts.push({ text: '   ' });
      parts.push({ text: label + ': ', bold: true });
      parts.push({ text: v });
    };

    const abilities = (abilityKeys || [])
      .map(k => (String(rec[k] || '').trim() ? `${k.toUpperCase()} ${rec[k]}` : null))
      .filter(Boolean)
      .join('  ');

    // Labelled "Scores", not "Abilities" -- companions and mounts also carry a
    // free-text `abilities` field for special attacks and defenses, and the two
    // print side by side. Using the same word for both read as a duplicated
    // label on Mr. Fluffles.
    push('Scores', abilities);
    (extraFields || []).forEach(([label, key]) => push(label, rec[key]));

    return parts;
  };

  const HENCH_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'per', 'com'];
  const HENCH_EXTRAS = [
    ['Alignment', 'alignment'],
    ['Equipment', 'equipment'],
    ['Notes', 'notes']
  ];

  const henchmenBlocks = [];

  if (showHenchmen && hasContent(henchmenRows, 'henchmen')) {
    const body = [[
      cell('Henchman', 6, { bold: true }),
      cell('Race', 6, { bold: true }),
      cell('Class', 6, { bold: true }),
      cell('Lvl', 6, { bold: true, alignment: 'center' }),
      cell('HP', 6, { bold: true, alignment: 'center' }),
      cell('AC', 6, { bold: true, alignment: 'center' }),
      cell('THAC0', 6, { bold: true, alignment: 'center' }),
      cell('Loy', 6, { bold: true, alignment: 'center' }),
      cell('Mor', 6, { bold: true, alignment: 'center' }),
      cell('Share', 6, { bold: true }),
      cell('Status', 6, { bold: true })
    ]];

    henchmenRows.forEach(h => {
      body.push([
        cell(h.name, 6, { bold: true }),
        cell(h.race),
        cell(h.class),
        cell(h.level, 6, { alignment: 'center' }),
        cell(h.hp, 6, { alignment: 'center' }),
        cell(h.ac, 6, { alignment: 'center' }),
        cell(h.thac0, 6, { alignment: 'center' }),
        cell(h.loyalty, 6, { alignment: 'center' }),
        cell(h.morale, 6, { alignment: 'center' }),
        cell(h.share),
        cell(h.status)
      ]);

      const detail = followerDetail(h, HENCH_ABILITIES, HENCH_EXTRAS);
      if (detail.length) {
        body.push([
          { text: detail, fontSize: 6, colSpan: 11, margin: [0, 1, 0, 1] },
          {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
        ]);
      }
    });

    body.push(...blankRows('henchmen', 11));

    henchmenBlocks.push({
      table: {
        headerRows: 1,
        widths: ['15%', '9%', '10%', '4%', '5%', '4%', '6%', '4%', '4%', '13%', '26%'],
        body: body
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  if (showHenchmen && henchmenNotes) {
    henchmenBlocks.push({ text: 'Henchmen Notes', fontSize: 7, bold: true, margin: [0, 2, 0, 2] });
    henchmenBlocks.push({ text: henchmenNotes, fontSize: 6, margin: [0, 0, 0, 4] });
  }

  // === HIRELINGS (optional) ===
  // Hirelings are hired for a job, not sworn to the character, so the columns
  // are contractual -- type, quantity, wage, duration, purpose -- rather than
  // the loyalty and morale a henchman carries. Ability scores are recorded but
  // rarely filled in, so they drop into the detail row.
  const hirelingRows = named(sheet && sheet.hirelings);
  const showHirelings = !!opts.hirelings && hasContent(hirelingRows, 'hirelings');

  const HIRE_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'per', 'com'];
  const HIRE_EXTRAS = [
    ['Alignment', 'alignment'],
    ['THAC0', 'thac0'],
    ['Notes', 'notes']
  ];

  const hirelingBlocks = [];

  if (showHirelings) {
    const body = [[
      cell('Hireling', 6, { bold: true }),
      cell('Type', 6, { bold: true }),
      cell('Qty', 6, { bold: true, alignment: 'center' }),
      cell('Wage', 6, { bold: true, alignment: 'center' }),
      cell('Duration', 6, { bold: true, alignment: 'center' }),
      cell('Purpose', 6, { bold: true }),
      cell('Status', 6, { bold: true })
    ]];

    hirelingRows.forEach(h => {
      body.push([
        cell(h.name, 6, { bold: true }),
        cell(h.type),
        cell(h.quantity, 6, { alignment: 'center' }),
        cell(h.wage || '\u2014', 6, { alignment: 'center' }),
        cell(h.duration || '\u2014', 6, { alignment: 'center' }),
        cell(h.purpose),
        cell(h.status)
      ]);

      const detail = followerDetail(h, HIRE_ABILITIES, HIRE_EXTRAS);
      if (detail.length) {
        body.push([
          { text: detail, fontSize: 6, colSpan: 7, margin: [0, 1, 0, 1] },
          {}, {}, {}, {}, {}, {}
        ]);
      }
    });

    body.push(...blankRows('hirelings', 7));

    hirelingBlocks.push({
      table: {
        headerRows: 1,
        widths: ['17%', '20%', '5%', '9%', '10%', '25%', '14%'],
        body: body
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === COMPANIONS (optional) ===
  // Animal companions, familiars and bonded creatures. Statted as monsters
  // rather than characters, so the columns are hit dice and attacks rather
  // than class and level.
  const companionRows = named(sheet && sheet.companions);
  const showCompanions = !!opts.companions && hasContent(companionRows, 'companions');

  const COMP_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'per', 'com'];
  const COMP_EXTRAS = [
    ['Alignment', 'alignment'],
    ['Special', 'abilities'],
    ['Notes', 'notes']
  ];

  const companionBlocks = [];

  if (showCompanions) {
    const body = [[
      cell('Bonded', 6, { bold: true }),
      cell('Species', 6, { bold: true }),
      cell('HD', 6, { bold: true, alignment: 'center' }),
      cell('HP', 6, { bold: true, alignment: 'center' }),
      cell('AC', 6, { bold: true, alignment: 'center' }),
      cell('THAC0', 6, { bold: true, alignment: 'center' }),
      cell('Attacks', 6, { bold: true }),
      cell('Move', 6, { bold: true, alignment: 'center' }),
      cell('Capacity', 6, { bold: true, alignment: 'center' }),
      cell('Loy', 6, { bold: true, alignment: 'center' }),
      cell('Bond', 6, { bold: true }),
      cell('Status', 6, { bold: true })
    ]];

    companionRows.forEach(c => {
      body.push([
        // A ridden companion gets a marker so the Move and Capacity columns
        // read as belonging to it rather than looking like stray data.
        cell((c.isMount ? '\u2022 ' : '') + String(c.name || ''), 6, { bold: true }),
        cell(c.species),
        cell(c.hd, 6, { alignment: 'center' }),
        cell(c.hp, 6, { alignment: 'center' }),
        cell(c.ac, 6, { alignment: 'center' }),
        cell(c.thac0, 6, { alignment: 'center' }),
        cell(c.attacks),
        cell(c.movement, 6, { alignment: 'center' }),
        cell(c.capacity, 6, { alignment: 'center' }),
        cell(c.loyalty, 6, { alignment: 'center' }),
        cell(c.bond),
        cell(c.status)
      ]);

      const detail = followerDetail(c, COMP_ABILITIES, COMP_EXTRAS);
      if (detail.length) {
        body.push([
          { text: detail, fontSize: 6, colSpan: 12, margin: [0, 1, 0, 1] },
          {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
        ]);
      }
    });

    body.push(...blankRows('companions', 12));

    companionBlocks.push({
      table: {
        headerRows: 1,
        widths: ['13%', '11%', '6%', '4%', '4%', '6%', '12%', '6%', '8%', '4%', '11%', '15%'],
        body: body
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // === MOUNTS (optional) ===
  // Mounts carry both creature stats and logistics -- movement rate, carrying
  // capacity, purchase cost -- so the columns lean toward what matters when
  // you are deciding whether to ride out or how much the beast can haul.
  const mountRows = named(sheet && sheet.mounts);
  const showMounts = !!opts.mounts && hasContent(mountRows, 'mounts');

  const MOUNT_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'per', 'com'];
  const MOUNT_EXTRAS = [
    ['Type', 'type'],
    ['Cost', 'cost'],
    ['Special', 'abilities'],
    ['Notes', 'notes']
  ];

  const mountBlocks = [];

  if (showMounts) {
    const body = [[
      cell('Mount / Vehicle', 6, { bold: true }),
      cell('Species', 6, { bold: true }),
      cell('HD', 6, { bold: true, alignment: 'center' }),
      cell('HP', 6, { bold: true, alignment: 'center' }),
      cell('AC', 6, { bold: true, alignment: 'center' }),
      cell('THAC0', 6, { bold: true, alignment: 'center' }),
      cell('Attacks', 6, { bold: true }),
      cell('Move', 6, { bold: true, alignment: 'center' }),
      cell('Capacity', 6, { bold: true, alignment: 'center' }),
      cell('Mor', 6, { bold: true, alignment: 'center' }),
      cell('Status', 6, { bold: true })
    ]];

    mountRows.forEach(m => {
      body.push([
        cell(m.name, 6, { bold: true }),
        cell(m.species),
        cell(m.hd, 6, { alignment: 'center' }),
        cell(m.hp, 6, { alignment: 'center' }),
        cell(m.ac, 6, { alignment: 'center' }),
        cell(m.thac0, 6, { alignment: 'center' }),
        cell(m.attacks),
        cell(m.movement, 6, { alignment: 'center' }),
        cell(m.capacity, 6, { alignment: 'center' }),
        cell(m.morale, 6, { alignment: 'center' }),
        cell(m.status)
      ]);

      const detail = followerDetail(m, MOUNT_ABILITIES, MOUNT_EXTRAS);
      if (detail.length) {
        body.push([
          { text: detail, fontSize: 6, colSpan: 11, margin: [0, 1, 0, 1] },
          {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
        ]);
      }
    });

    body.push(...blankRows('mounts', 11));

    mountBlocks.push({
      table: {
        headerRows: 1,
        widths: ['14%', '12%', '6%', '5%', '4%', '7%', '13%', '7%', '9%', '5%', '18%'],
        body: body
      },
      layout: gridLayout,
      margin: [0, 0, 0, 5]
    });
  }

  // Page 6 carries background and followers.
  const showPage6 = showDetails || showBackground || showHenchmen ||
    showHirelings || showCompanions || showMounts;

  // === JOURNAL (optional) ===
  //
  // All five journal categories are arrays of structured records, not free
  // text. They are rendered as labelled prose rather than tables because the
  // content is long-form -- a session log entry can run several paragraphs,
  // which no column width survives.
  const notesTab = (sheet && sheet.notesTab) || {};
  const journalList = key => (Array.isArray(notesTab[key]) ? notesTab[key] : []);

  // One entry: a bold heading line, then each non-empty field labelled beneath.
  // Blank fields are skipped rather than printing a bare label.
  const journalEntry = (heading, fields) => {
    const parts = [{ text: heading || '(untitled)', fontSize: 7, bold: true, margin: [0, 3, 0, 1] }];
    fields.forEach(([label, value]) => {
      const v = String(value || '').trim();
      if (!v) return;
      parts.push({
        text: [
          { text: label ? label + ': ' : '', bold: true },
          { text: v }
        ],
        fontSize: 6,
        margin: [0, 0, 0, 2]
      });
    });
    return parts;
  };

  // The section title travels with the first entry. Each subsequent entry is
  // its own unbreakable block, so the list may break between entries but never
  // in the middle of one, and the title is never orphaned.
  const journalSection = (title, entries) => {
    if (!entries.length) return [];
    const blocks = [{
      unbreakable: true,
      stack: [
        { text: title, fontSize: 8, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
        ...entries[0]
      ]
    }];
    entries.slice(1).forEach(e => blocks.push({ unbreakable: true, stack: e }));
    return blocks;
  };

  const sessionLogRows = journalList('sessionLog');
  const questRows = named(journalList('questJournal'));
  const npcRows = named(journalList('npcs'));
  const locationRows = named(journalList('locations'));
  const charJournalRows = journalList('characterJournal');

  const showSessionLog = !!opts.sessionLog && sessionLogRows.length > 0;
  const showQuests = !!opts.questJournal && questRows.length > 0;
  const showNpcs = !!opts.npcs && npcRows.length > 0;
  const showLocations = !!opts.locations && locationRows.length > 0;
  const showCharJournal = !!opts.characterJournal && charJournalRows.length > 0;

  const sessionLogBlocks = !showSessionLog ? [] : journalSection('SESSION LOG',
    sessionLogRows.map(e => journalEntry(
      e.date || 'Undated session',
      [['XP', e.xp], ['Events', e.events], ['Loot', e.loot]]
    ))
  );

  const questBlocks = !showQuests ? [] : journalSection('QUEST JOURNAL',
    questRows.map(e => journalEntry(
      e.status ? `${e.name} \u2014 ${e.status}` : e.name,
      [['Objective', e.objective], ['Reward', e.reward], ['Notes', e.notes]]
    ))
  );

  const npcBlocks = !showNpcs ? [] : journalSection('NPCs',
    npcRows.map(e => journalEntry(
      e.type ? `${e.name} \u2014 ${e.type}` : e.name,
      [['Relationship', e.relationship], ['Notes', e.notes]]
    ))
  );

  const locationBlocks = !showLocations ? [] : journalSection('LOCATIONS',
    locationRows.map(e => journalEntry(
      e.name,
      [['Description', e.description], ['Details', e.details]]
    ))
  );

  const charJournalBlocks = !showCharJournal ? [] : journalSection('CHARACTER JOURNAL',
    charJournalRows.map(e => journalEntry(e.title, [['', e.content]]))
  );

  // === EXPERIENCE ===
  // getXPTable (tables.js) resolves specialists, class-group aliases and
  // multi-class strings to the right progression. The table is indexed from
  // zero for level 1, so table[level] is the threshold for the NEXT level.
  const xpTable = (typeof getXPTable === 'function') ? getXPTable(clazz) : null;
  const levelNum = parseInt(level, 10);
  const nextLevelXP = (Array.isArray(xpTable) && !isNaN(levelNum) && typeof xpTable[levelNum] === 'number')
    ? xpTable[levelNum]
    : null;

  const commafy = v => {
    const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10);
    return isNaN(n) ? String(v || '') : n.toLocaleString('en-US');
  };

  const xpDisplay = xp ? commafy(xp) : '\u2014';
  const nextLevelDisplay = (nextLevelXP === null) ? '\u2014' : commafy(nextLevelXP);

  // === EXTRA APPENDED PAGES ===
  //
  // Whole blank pages added to the end of the sheet, for a player working from
  // paper between sessions. Each is a full-page table so the ruling matches
  // the rest of the sheet rather than being loose lines.
  // Printed-on date. A player working from paper needs to know which printout
  // is current and what the app looked like when it was made -- without it,
  // two printouts a month apart are indistinguishable.
  const printedOn = opts.printDate
    ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  const extraSpellbookPages = blankCount('extraSpellbookPages');
  const extraMemorizationPages = blankCount('extraMemorizationPages');
  const extraBlankPages = blankCount('extraBlankPages');

  // Usable height of a Letter page. The 32pt bottom margin is where the footer
  // is DRAWN, not space reserved above it, so a further allowance is subtracted
  // to keep the last row clear of it. The remaining slack is deliberate: a
  // little white space at the foot of a blank page is much better than one row
  // spilling onto a page of its own.
  const PAGE_CONTENT_HEIGHT = 792 - 20 - 32 - 24;

  // Height of one blank row: its text line box, plus gridLayout's 1pt cell
  // padding top and bottom, plus the vertical margin set on the cell.
  //
  // Blank cells carry a single space rather than an empty string on purpose --
  // pdfMake collapses the line box of an empty string, so a row built from ''
  // is shorter than its font size implies and the page underfills.
  const blankRowHeight = (vMargin, fontSize) => (fontSize * 1.6) + 2 + (vMargin * 2);

  const rowsToFillPage = (usedByHeadings, vMargin, fontSize) =>
    Math.max(1, Math.floor((PAGE_CONTENT_HEIGHT - usedByHeadings) / blankRowHeight(vMargin, fontSize)));

  const blankCell = (fontSize, vMargin) =>
    ({ text: ' ', fontSize: fontSize, margin: [0, vMargin, 0, vMargin] });

  const extraPageBlocks = [];

  // Continuation spellbook pages: the same columns as the spellbook section so
  // a spell written here transcribes back into the app cleanly.
  for (let i = 0; i < extraSpellbookPages; i++) {
    const body = [spellHeaderRow(false)];
    // Headings used: section title (~12pt) plus the table's header row (~10pt).
    const rows = rowsToFillPage(22, 4, 6);
    for (let r = 0; r < rows; r++) {
      body.push(Array(8).fill(null).map(() => blankCell(6, 4)));
    }
    extraPageBlocks.push({
      pageBreak: 'before',
      stack: [
        { text: 'SPELLBOOK (CONTINUED)', fontSize: 8, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
        { table: { headerRows: 1, widths: ['6%', '23%', '17%', '7%', '13%', '18%', '10%', '6%'], body: body }, layout: gridLayout }
      ]
    });
  }

  // Memorization worksheet: slot boxes grouped by spell level, sized to the
  // character's own slot counts so a caster fills in exactly what they have.
  // Falls back to a generic grid for a character with no slots recorded.
  for (let i = 0; i < extraMemorizationPages; i++) {
    const wsBlocks = [];
    let anyLevel = false;

    for (let lvl = 0; lvl < 9; lvl++) {
      const n = parseInt(slotArr[lvl], 10);
      if (isNaN(n) || n < 1) continue;
      anyLevel = true;
      const body = [[
        cell('Cast', 6, { bold: true, alignment: 'center' }),
        cell('Spell', 6, { bold: true }),
        cell('School / Sphere', 6, { bold: true }),
        cell('Range', 6, { bold: true }),
        cell('Duration', 6, { bold: true }),
        cell('Save', 6, { bold: true })
      ]];
      for (let s = 0; s < n; s++) {
        body.push(Array(6).fill(null).map(() => ({ text: '', fontSize: 6, margin: [0, 5, 0, 5] })));
      }
      wsBlocks.push({ text: `Level ${lvl + 1} \u2014 ${n} slot${n === 1 ? '' : 's'}`, fontSize: 7, bold: true, margin: [0, 4, 0, 2] });
      wsBlocks.push({
        table: { headerRows: 1, widths: ['6%', '26%', '22%', '16%', '20%', '10%'], body: body },
        layout: gridLayout
      });
    }

    if (!anyLevel) {
      const body = [];
      const rows = rowsToFillPage(24, 5, 6);
      for (let r = 0; r < rows; r++) {
        body.push(Array(6).fill(null).map(() => blankCell(6, 5)));
      }
      wsBlocks.push({
        table: { widths: ['6%', '26%', '22%', '16%', '20%', '10%'], body: body },
        layout: gridLayout
      });
    }

    extraPageBlocks.push({
      pageBreak: 'before',
      stack: [
        { text: 'DAILY MEMORIZATION', fontSize: 8, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
        { text: 'Date: ______________________', fontSize: 7, margin: [0, 0, 0, 4] },
        ...wsBlocks
      ]
    });
  }

  // "Changes to Enter" -- the sync-back page. A player working from paper
  // accumulates changes across a session; without somewhere structured to
  // record them, re-entering afterwards is an act of memory. Headed sections
  // turn that into transcription.
  if (opts.changesPage) {
    const ruled = (rows, height) => {
      const body = [];
      for (let r = 0; r < rows; r++) {
        body.push([{ text: '', fontSize: 8, margin: [0, height, 0, height] }]);
      }
      return {
        table: { widths: ['100%'], body: body },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 1 : 0,
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 1,
          paddingBottom: () => 1
        },
        margin: [0, 0, 0, 6]
      };
    };

    const changeHeading = t => ({ text: t, fontSize: 7, bold: true, margin: [0, 2, 0, 2] });

    extraPageBlocks.push({
      pageBreak: 'before',
      stack: [
        { text: 'CHANGES TO ENTER', fontSize: 8, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
        {
          text: 'Record what changed during play, then enter it in the app. Tick each line once it has been entered.',
          fontSize: 6,
          italics: true,
          margin: [0, 0, 0, 4]
        },
        {
          columns: [
            {
              width: '48%',
              stack: [
                {
                  table: {
                    widths: ['40%', '30%', '30%'],
                    body: [
                      [cell('', 6), cell('Before', 6, { bold: true, alignment: 'center' }), cell('After', 6, { bold: true, alignment: 'center' })],
                      [cell('Experience', 6, { bold: true }), cell(xpDisplay, 6, { alignment: 'center' }), cell('', 8, { margin: [0, 3, 0, 3] })],
                      [cell('Level', 6, { bold: true }), cell(level, 6, { alignment: 'center' }), cell('', 8, { margin: [0, 3, 0, 3] })],
                      [cell('Current HP', 6, { bold: true }), cell(currentHP, 6, { alignment: 'center' }), cell('', 8, { margin: [0, 3, 0, 3] })],
                      [cell('Damage taken', 6, { bold: true }), cell(damageTaken, 6, { alignment: 'center' }), cell('', 8, { margin: [0, 3, 0, 3] })],
                      [cell('Armor class', 6, { bold: true }), cell(ac, 6, { alignment: 'center' }), cell('', 8, { margin: [0, 3, 0, 3] })]
                    ]
                  },
                  layout: gridLayout,
                  margin: [0, 0, 0, 6]
                },
                changeHeading('Coins & valuables'),
                ruled(6, 5)
              ]
            },
            {
              width: '52%',
              stack: [
                changeHeading('Equipment gained / lost'),
                ruled(9, 5)
              ],
              margin: [6, 0, 0, 0]
            }
          ]
        },
        changeHeading('Spells learned, scribed or expended'),
        ruled(5, 5),
        changeHeading('Proficiencies, languages & abilities gained'),
        ruled(4, 5),
        changeHeading('Followers, mounts & henchmen'),
        ruled(4, 5),
        changeHeading('Other notes for the DM'),
        ruled(5, 5)
      ]
    });
  }

  // Plain ruled pages.
  for (let i = 0; i < extraBlankPages; i++) {
    const body = [];
    const rows = rowsToFillPage(12, 7, 8);
    for (let r = 0; r < rows; r++) {
      body.push([blankCell(8, 7)]);
    }
    extraPageBlocks.push({
      pageBreak: 'before',
      stack: [
        { text: 'NOTES', fontSize: 8, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
        {
          table: { widths: ['100%'], body: body },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 1 : 0,
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 1,
            paddingBottom: () => 1
          }
        }
      ]
    });
  }

  // === CHARACTER PORTRAIT (optional) ===
  // pdfMake takes a base64 data URL directly, but supports JPEG and PNG only.
  // Any other format throws and takes the entire PDF down with it, so the
  // format is verified rather than trusted -- an unsupported portrait simply
  // does not print instead of breaking the sheet.
  const avatarData = String((sheet && sheet.avatar) || '').trim();
  const portraitUsable = /^data:image\/(png|jpe?g);base64,/i.test(avatarData);
  const showPortrait = !!opts.portrait && portraitUsable;

  // Page 7 onward carries the journal.
  const showPage7 = showSessionLog || showQuests || showNpcs ||
    showLocations || showCharJournal;

  // Create PDF document definition
  const docDefinition = {
    pageSize: 'LETTER',
    // Bottom margin widened from 20 to 32 to make room for the footer.
    pageMargins: [20, 20, 20, 32],
    info: {
      title: `${characterName} - Character Sheet`,
      author: playerName,
      subject: 'AD&D 2nd Edition Character Sheet'
    },

    // A character sheet that runs to seven pages will get separated, dropped,
    // and mixed with other players' sheets. Every page identifies itself.
    footer: (currentPage, pageCount) => ({
      margin: [20, 4, 20, 0],
      columns: [
        {
          text: [
            { text: characterName || 'Unnamed', bold: true },
            { text: `  \u2014  ${clazzDisplay || 'Adventurer'}${level ? ' ' + level : ''}` +
                    `${race ? ', ' + race : ''}` },
            playerName ? { text: `  \u2014  ${playerName}`, italics: true } : { text: '' }
          ],
          fontSize: 6,
          color: '#555555'
        },
        {
          text: printedOn
            ? `Printed ${printedOn}  \u2014  Page ${currentPage} of ${pageCount}`
            : `Page ${currentPage} of ${pageCount}`,
          fontSize: 6,
          color: '#555555',
          alignment: 'right'
        }
      ]
    }),
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
              // These two cells were labelled but never populated -- the values
              // live on the details record, not in a top-level field.
              { text: details.patronDeity || '', fontSize: 8, border: [true, false, false, true], colSpan: 3 },
              {},
              {},
              { text: details.birthplace || details.homeland || '', fontSize: 8, border: [true, false, false, true], colSpan: 2 },
              {},
              showPortrait
                ? { image: avatarData, fit: [64, 64], alignment: 'center', border: [true, false, true, false] }
                : { text: '', border: [true, false, true, false] }
            ],
            [
              { text: 'Player', fontSize: 6, bold: true, border: [true, true, false, false], colSpan: 2 },
              {},
              { text: 'Experience', fontSize: 6, bold: true, border: [true, true, false, false], colSpan: 2 },
              {},
              { text: 'Next Level', fontSize: 6, bold: true, border: [true, true, false, false] },
              { text: '', border: [true, false, true, false] }
            ],
            [
              { text: playerName, fontSize: 8, border: [true, false, false, true], colSpan: 2 },
              {},
              { text: xpDisplay, fontSize: 8, border: [true, false, false, true], colSpan: 2 },
              {},
              { text: nextLevelDisplay, fontSize: 8, border: [true, false, false, true] },
              { text: '', border: [true, false, true, true] }
            ]
          ]
        },
        layout: formLayout(2, 1),
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
                layout: formLayout(1, 1)
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
                layout: formLayout(2, 2),
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
                layout: formLayout(2, 1)
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
                layout: formLayout(2, 1),
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
                      { text: 'Max HP', fontSize: 6, alignment: 'center' },
                      { text: 'Damage Taken', fontSize: 6, alignment: 'center' }
                    ],
                    [
                      { text: hp, fontSize: 10, bold: true, alignment: 'center' },
                      { text: damageTaken, fontSize: 10, bold: true, alignment: 'center' }
                    ],
                    [
                      { text: 'Current HP', fontSize: 6, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    [
                      { text: currentHP, fontSize: 16, bold: true, alignment: 'center', colSpan: 2, margin: [0, 1, 0, 1] },
                      {}
                    ],
                    // Hit Dice and the death stats are not yet fields in the app.
                    // They print as blank boxes for hand entry until they are --
                    // see the follow-up to-do. Deliberately NOT derived here:
                    // Max Deaths depends on rules that need PHB verification.
                    [
                      { text: 'Hit Dice', fontSize: 6, alignment: 'center' },
                      { text: 'Max Deaths', fontSize: 6, alignment: 'center' }
                    ],
                    [
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] },
                      { text: '', fontSize: 8, margin: [0, 5, 0, 5] }
                    ],
                    [
                      { text: 'Deaths to Date', fontSize: 6, alignment: 'center', colSpan: 2 },
                      {}
                    ],
                    [
                      { text: '', fontSize: 8, colSpan: 2, margin: [0, 5, 0, 5] },
                      {}
                    ]
                  ]
                },
                layout: formLayout(2, 1),
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
                layout: formLayout(2, 1),
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
        layout: formLayout(1, 1),
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
            layout: formLayout(2, 2)
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
            layout: formLayout(2, 2),
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
            layout: formLayout(2, 2),
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
          headerRows: 1,
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
            ...blankRows('weapons', 8)
          ]
        },
        layout: gridLayout,
        margin: [0, 0, 0, 5]
      },
      
      )),

      // === PROFICIENCIES ===
      printSection('PROFICIENCIES',
        {
          columns: [
            {
              width: '48%',
              stack: [
                {
                  text: profSlots && profSlots.valid
                    ? `Weapon Proficiencies \u2014 ${wpSpent} of ${profSlots.wpTotal} slots used`
                    : 'Weapon Proficiencies',
                  fontSize: 7,
                  bold: true,
                  margin: [0, 0, 0, 2]
                },
                {
                  table: {
                    headerRows: 1,
                    widths: ['58%', '28%', '14%'],
                    body: [
                      [
                        cell('Proficiency', 6, { bold: true, color: palette.ink }),
                        cell('Group', 6, { bold: true, color: palette.ink }),
                        cell('Slots', 6, { bold: true, alignment: 'center', color: palette.ink })
                      ],
                      ...(hasContent(weaponProfRows, 'weaponProfs')
                        ? weaponProfRows.map(p => [
                            cell(p.name),
                            cell(p.group),
                            cell(p.slots, 6, { alignment: 'center' })
                          ])
                        : [[cell('None', 6, { italics: true }), cell(''), cell('')]]),
                      ...blankRows('weaponProfs', 3)
                    ]
                  },
                  layout: gridLayout
                }
              ]
            },
            {
              width: '52%',
              stack: [
                {
                  text: profSlots && profSlots.valid
                    ? `Nonweapon Proficiencies \u2014 ${nwpSpent} of ${profSlots.nwpTotal} slots used` +
                      (langSpent ? ` (${langSpent} on languages)` : '')
                    : 'Nonweapon Proficiencies',
                  fontSize: 7,
                  bold: true,
                  margin: [0, 0, 0, 2]
                },
                {
                  table: {
                    headerRows: 1,
                    widths: ['42%', '20%', '10%', '28%'],
                    body: [
                      [
                        cell('Proficiency', 6, { bold: true, color: palette.ink }),
                        cell('Group', 6, { bold: true, color: palette.ink }),
                        cell('Slots', 6, { bold: true, alignment: 'center', color: palette.ink }),
                        cell('Check', 6, { bold: true, color: palette.ink })
                      ],
                      ...(hasContent(nwpRows, 'nwps')
                        ? nwpRows.map(p => [
                            cell(p.name),
                            cell(p.category),
                            cell(p.slots, 6, { alignment: 'center' }),
                            cell(p.abilityCheck)
                          ])
                        : [[cell('None', 6, { italics: true }), cell(''), cell(''), cell('')]]),
                      ...blankRows('nwps', 4)
                    ]
                  },
                  layout: gridLayout,
                  margin: [5, 0, 0, 0]
                }
              ]
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
      ),

      // === POWERS & HINDRANCES (optional) ===
      ...optional(showPowers,
        printSection('POWERS & HINDRANCES', ...powersBlocks)
      ),

      // === ACTIVE CONDITIONS (optional) ===
      ...optional(showConditions,
        printSection('ACTIVE CONDITIONS', ...conditionBlocks)
      ),

      // === PAGE 4: Magic ===
      ...optional(showPage4,
        { text: '', fontSize: 1, pageBreak: 'before' }
      ),

      // === SPELL SLOTS & ACCESS (optional) ===
      ...optional(showSpellAccess,
        printSection('SPELL SLOTS & ACCESS', ...spellAccessBlocks)
      ),

      // === MEMORIZED SPELLS (optional) ===
      ...optional(showMemorized,
        printSection('MEMORIZED SPELLS', ...memorizedBlocks)
      ),

      // === SPELLBOOKS (optional) ===
      // Spread directly rather than through printSection -- this section
      // builds its own heading so the list is allowed to break across pages.
      ...optional(showSpellbooks, ...spellbookBlocks),

      // === PAGE 5: Gear ===
      ...optional(showPage5,
        { text: '', fontSize: 1, pageBreak: 'before' }
      ),

      // === EQUIPMENT, VALUABLES & COINS (optional) ===
      ...optional(showEquipment,
        printSection('EQUIPMENT & VALUABLES', ...equipmentBlocks)
      ),

      // === MAGIC ITEMS (optional) ===
      ...optional(showMagicItems,
        printSection('MAGIC ITEMS', ...magicItemBlocks)
      ),

      // === PAGE 6: Background & Followers ===
      ...optional(showPage6,
        { text: '', fontSize: 1, pageBreak: 'before' }
      ),

      // === CHARACTER DETAILS (optional) ===
      ...optional(showDetails,
        printSection('CHARACTER DETAILS', ...detailBlocks)
      ),

      // === BACKGROUND / HISTORY (optional) ===
      ...optional(showBackground,
        printSection('BACKGROUND & HISTORY', ...backgroundBlocks)
      ),

      // === HENCHMEN (optional) ===
      ...optional(showHenchmen,
        printSection('HENCHMEN', ...henchmenBlocks)
      ),

      // === HIRELINGS (optional) ===
      ...optional(showHirelings,
        printSection('HIRELINGS', ...hirelingBlocks)
      ),

      // === COMPANIONS (optional) ===
      ...optional(showCompanions,
        printSection('BONDED MOUNTS & ANIMAL COMPANIONS', ...companionBlocks)
      ),

      // === MOUNTS (optional) ===
      ...optional(showMounts,
        printSection('UNBONDED MOUNTS & VEHICLES', ...mountBlocks)
      ),

      // === PAGE 7+: Journal ===
      ...optional(showPage7,
        { text: '', fontSize: 1, pageBreak: 'before' }
      ),

      // These build their own headings so the lists may break between entries.
      ...optional(showSessionLog, ...sessionLogBlocks),
      ...optional(showQuests, ...questBlocks),
      ...optional(showNpcs, ...npcBlocks),
      ...optional(showLocations, ...locationBlocks),
      ...optional(showCharJournal, ...charJournalBlocks),

      // === EXTRA APPENDED PAGES ===
      // Each carries its own pageBreak, so no page-group flag is needed.
      ...extraPageBlocks
    ]
  };
  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`${characterName.replace(/[^a-z0-9]/gi, '_')}_CharSheet.pdf`);
}
