// ===== ARMOR DATA =====
let ARMOR_DATA = [];

// Load armor from JSON
fetch('js/core_armor.json')
  .then(response => response.json())
  .then(data => {
    ARMOR_DATA = data;
    console.log('Armor loaded:', ARMOR_DATA.length);
  })
  .catch(err => console.error('Error loading armor:', err));