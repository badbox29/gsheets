// ===== EQUIPMENT DATA =====
let EQUIPMENT_DATA = [];

// Load equipment from JSON
fetch('js/core_equipment.json')
  .then(response => response.json())
  .then(data => {
    EQUIPMENT_DATA = data;
    console.log('Equipment loaded:', EQUIPMENT_DATA.length);
  })
  .catch(err => console.error('Error loading equipment:', err));