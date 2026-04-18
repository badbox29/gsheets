// print.js - PDF Character Sheet Generation

function generateCharacterPDF(root) {
  if (!root) {
    alert('No active character sheet found.');
    return;
  }

  // === BASIC INFO ===
  const characterName = val(root, 'name') || '';
  const playerName = val(root, 'player') || '';
  const race = val(root, 'race') || '';
  const clazz = val(root, 'clazz') || '';
  const level = val(root, 'level') || '';
  const kit = val(root, 'kit') || '';
  const alignment = val(root, 'alignment') || '';
  const xp = val(root, 'xp') || '';
  
  // === ABILITY SCORES ===
  const str = val(root, 'str') || '';
  const strEx = val(root, 'str_exceptional') || '';
  const dex = val(root, 'dex') || '';
  const con = val(root, 'con') || '';
  const int = val(root, 'int') || '';
  const wis = val(root, 'wis') || '';
  const cha = val(root, 'cha') || '';
  
  // === STR MODIFIERS ===
  const strHitAdj = val(root, 'str_tohit') || '';
  const strDmgAdj = val(root, 'str_damage') || '';
  const strWeight = val(root, 'str_weight') || '';
  const strOpenDoors = val(root, 'str_opendoors') || '';
  const strBendBars = val(root, 'str_bendbars') || '';
  
  // === DEX MODIFIERS ===
  const dexReaction = val(root, 'dex_reaction') || '';
  const dexMissile = val(root, 'dex_missile') || '';
  const dexAC = val(root, 'dex_ac') || '';
  
  // === CON MODIFIERS ===
  const conHP = val(root, 'con_hpbonus') || '';
  const conShock = val(root, 'con_shock') || '';
  const conResurrect = val(root, 'con_res') || '';
  const conPoison = val(root, 'con_poison') || '';
  const conRegen = val(root, 'con_regen') || '';
  
  // === INT MODIFIERS ===
  const intLanguages = val(root, 'int_languages') || '';
  const intBonusProfs = val(root, 'int_bonus_profs') || '';
  const intImmunity = val(root, 'int_immunity') || '';
  const intLearnSpell = val(root, 'int_learn_spell') || '';
  const intMaxSpells = val(root, 'int_max_spells') || '';
  
  // === WIS MODIFIERS ===
  const wisMagicDef = val(root, 'wis_mda') || '';
  const wisSpellBonus = val(root, 'wis_bonus_spells') || '';
  const wisSpellFailure = val(root, 'wis_spell_failure') || '';
  const wisImmunity = val(root, 'wis_immunities') || '';
  
  // === CHA MODIFIERS ===
  const chaMaxHench = val(root, 'cha_max_henchmen_core') || '';
  const chaLoyalty = val(root, 'cha_loyalty_core') || '';
  const chaReaction = val(root, 'cha_reaction_core') || '';
  
  // === COMBAT STATS ===
  const hp = val(root, 'hp') || '';
  const ac = val(root, 'ac') || '';
  const acRear = val(root, 'ac_rear') || '';
  const acSurprised = val(root, 'ac_surprised') || '';
  const acNoShield = val(root, 'ac_no_shield') || '';
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
  const weapons = [];
  const weaponNodes = root.querySelectorAll('.weapons-list .item');
  weaponNodes.forEach(node => {
    const name = node.querySelector('.title')?.value || '';
    if (name.trim()) {
      weapons.push({
        name: name,
        attacks: node.querySelector('.attacks')?.value || '',
        size: node.querySelector('.size')?.value || '',
        type: node.querySelector('.type')?.value || '',
        speed: node.querySelector('.speed')?.value || '',
        hitDmg: (node.querySelector('.to-hit')?.value || '') + '/' + (node.querySelector('.damage')?.value || ''),
        damage: node.querySelector('.damage')?.value || '',
        range: node.querySelector('.range')?.value || ''
      });
    }
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
              { text: kit ? `${clazz}/${kit}` : clazz, fontSize: 8, border: [true, false, false, true] },
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
                      { text: 'STR', fontSize: 7, bold: true, rowSpan: 2, alignment: 'center', margin: [0, 6, 0, 0] },
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
                      { text: 'DEX', fontSize: 7, bold: true, rowSpan: 2, alignment: 'center', margin: [0, 4, 0, 0] },
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
                      { text: 'CON', fontSize: 7, bold: true, rowSpan: 2, alignment: 'center', margin: [0, 6, 0, 0] },
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
                      { text: 'INT', fontSize: 7, bold: true, rowSpan: 2, alignment: 'center', margin: [0, 6, 0, 0] },
                      { text: '# Lang', fontSize: 5, alignment: 'center' },
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
                      { text: 'WIS', fontSize: 7, bold: true, rowSpan: 2, alignment: 'center', margin: [0, 6, 0, 0] },
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
                      { text: 'CHA', fontSize: 7, bold: true, rowSpan: 2, alignment: 'center', margin: [0, 4, 0, 0] },
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
      {
        text: 'COMBAT',
        fontSize: 8,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 2]
      },
      {
        columns: [
          // Armor/AC Section
          {
            width: '30%',
            stack: [
              {
                table: {
                  widths: ['45%', '55%'],
                  body: [
                    [
                      { 
                        stack: [
                          { text: 'ARMOR', fontSize: 7, bold: true, alignment: 'center' },
                          { text: '\n\n', fontSize: 20 },
                          { text: 'CLASS', fontSize: 7, bold: true, alignment: 'center', margin: [0, 15, 0, 0] }
                        ],
                        rowSpan: 4
                      },
                      { text: 'Surprised AC', fontSize: 6 }
                    ],
                    [
                      {},
                      { text: acSurprised, fontSize: 8 }
                    ],
                    [
                      {},
                      { text: 'Shieldless AC', fontSize: 6 }
                    ],
                    [
                      {},
                      { text: acNoShield, fontSize: 8 }
                    ],
                    [
                      { text: '', fontSize: 6 },
                      { text: 'Rear AC', fontSize: 6 }
                    ],
                    [
                      { text: 'Type Worn', fontSize: 6 },
                      { text: acRear, fontSize: 8 }
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
      
      // === THAC0 MATRIX ===
      {
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
      {
        text: 'COMBAT MODIFIERS',
        fontSize: 8,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 2]
      },
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
      
      // === WEAPON COMBAT ===
      {
        text: 'WEAPON COMBAT',
        fontSize: 8,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 2]
      },
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
      
      // === PROFICIENCIES ===
      {
        text: 'PROFICIENCIES',
        fontSize: 8,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 2]
      },
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
    ]
  };

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`${characterName.replace(/[^a-z0-9]/gi, '_')}_CharSheet.pdf`);
}