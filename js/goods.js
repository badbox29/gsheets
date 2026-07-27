// ===== GOODS & SERVICES DATA =====
// PHB Chapter 6, Table 44: Clothing, Household Provisioning, Daily Food and
// Lodging, and Services. These are PRICE REFERENCE ONLY -- deliberately no
// weight field, because the book gives none for these sub-tables. Clothing in
// particular is weightless on purpose: encumbrance handles it with the flat
// 5 lb clothing allowance, so itemising garment weights would double-count.
// Nothing here is addable to inventory for the same reason.
let GOODS_DATA = [];

fetch('js/core_goods.json')
  .then(response => response.json())
  .then(data => {
    GOODS_DATA = data;
    console.log('Goods loaded:', GOODS_DATA.length);
  })
  .catch(err => console.error('Error loading goods:', err));
