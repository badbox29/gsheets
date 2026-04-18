// ===== WEAPONS DATA =====
let WEAPONS_DATA = [];

// Load weapons from JSON
fetch('js/core_wp.json')
  .then(response => response.json())
  .then(data => {
    WEAPONS_DATA = data;
    console.log('Weapons loaded:', WEAPONS_DATA.length);
  })
  .catch(err => console.error('Error loading weapons:', err));