// ===== ANIMALS, MOUNTS & TRANSPORT DATA =====
// PHB Chapter 6: Table 44 (Animals and Transport) merged with Table 49
// (Carrying Capacities of Animals).
//
// The three load bands are the book's own column headings. Carrying more than
// the "Base Move" band drops the animal to 2/3 its movement rate, and more than
// that to 1/3, with a ceiling of twice the normal load. Only the 14 mounts in
// Table 49 carry these -- the rest of the animals are priced but never loaded.
//
// Transport carries price only: Chapter 6 sends vehicle movement rates to the
// DMG, so there is nothing here to fill a Move field with.
let ANIMALS_DATA = [];

fetch('js/core_animals.json')
  .then(response => response.json())
  .then(data => {
    ANIMALS_DATA = data;
    console.log('Animals & transport loaded:', ANIMALS_DATA.length);
  })
  .catch(err => console.error('Error loading animals:', err));
