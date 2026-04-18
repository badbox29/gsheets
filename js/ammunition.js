// ===== AMMUNITION DATA =====
let AMMUNITION_DATA = [];

// Load ammunition from JSON
fetch('js/core_ammo.json')
  .then(response => response.json())
  .then(data => {
    AMMUNITION_DATA = data;
    console.log('Ammunition loaded:', AMMUNITION_DATA.length);
  })
  .catch(err => console.error('Error loading ammunition:', err));