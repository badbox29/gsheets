// ===== MAGICAL ITEMS DATA =====
// Items from the PHBR supplement series. Not the DMG -- its magic item lists run
// to hundreds of entries and are not this programme's subject.
//
// Field reference lives in gsheets_phbr_notes.md, not here: core_magic.json is a
// BARE ARRAY like every other core_*.json, so it carries no schema block.
let MAGIC_DATA = [];

// Load magical items from JSON
fetch('js/core_magic.json')
  .then(response => response.json())
  .then(data => {
    MAGIC_DATA = data;
    console.log('Magical items loaded:', MAGIC_DATA.length);
  })
  .catch(err => console.error('Error loading magical items:', err));
