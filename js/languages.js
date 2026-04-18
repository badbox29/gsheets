// ===== LANGUAGES DATA =====
let LANGUAGES_DATA = [];

// Load languages from JSON
fetch('js/languages.json')
  .then(response => response.json())
  .then(data => {
    LANGUAGES_DATA = data;
    console.log('Languages loaded:', LANGUAGES_DATA.length);
  })
  .catch(err => console.error('Error loading languages:', err));