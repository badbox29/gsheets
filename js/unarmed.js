// ===== UNARMED COMBAT: PUNCHING, WRESTLING, MARTIAL ARTS =====
// PHBR1 The Complete Fighter's Handbook pp.74-78, with PHB Tables 57 and 58,
// which PHBR1 refers to but does not reprint.
//
// THE FILE THIS REPLACED WAS FABRICATED. 63 rows of invented named styles --
// Tae Kwon Do, Judo, Praying Mantis, Eagle Claw -- 21 of 22 sampled names
// absent from all 129 pages of PHBR1, while the maneuvers the book actually
// prints were missing entirely. It sat in js/ unread for a long time looking
// authoritative. Nothing should be built against a data file without checking
// its Source strings resolve.
//
// NOT LOAD-BEARING. Nothing reads this yet; a failed fetch leaves the tool
// exactly as it was.
let UNARMED_DATA = null;

fetch('js/core_unarmed_martial_arts.json')
  .then(response => response.json())
  .then(data => {
    UNARMED_DATA = data;
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.sheet-container').forEach(sheet => {
        if (typeof renderUnarmedTables === 'function') renderUnarmedTables(sheet);
      });
    }
      (data.styles || []).length + ' styles, ' +
      ((data.martialArtsResults && data.martialArtsResults.rows) || []).length + ' martial arts rows, ' +
      ((data.phbTable58 && data.phbTable58.rows) || []).length + ' punch/wrestle rows');
  })
  .catch(err => console.error('Error loading unarmed combat data:', err));
