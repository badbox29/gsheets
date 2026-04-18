// ===== NON-WEAPON PROFICIENCIES DATA =====
let NWP_DATA = [];

// Load non-weapon proficiencies from JSON
fetch('js/core_nwp.json')
  .then(response => response.json())
  .then(data => {
    NWP_DATA = data;
    console.log('Non-weapon proficiencies loaded:', NWP_DATA.length);
  })
  .catch(err => console.error('Error loading non-weapon proficiencies:', err));