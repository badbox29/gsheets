// ===== PHBR3 PRIESTHOOD TEMPLATES =====
// Chapter 3's sample priesthoods, as STARTING POINTS rather than as rules.
// p.40 tells the DM outright he may rewrite races allowed, proficiencies,
// rights, weapon and armor restrictions, other limitations and spheres -- so
// applying one of these populates the Specialty Priest fields and then gets out
// of the way. Edit anything afterwards and the provenance field reads
// "X (Modified)".
//
// TRANSCRIPTION IS INCOMPLETE and that is fine: a priesthood with no entry
// simply does not appear in the dropdown. Nothing here is load-bearing, so a
// missing or failed fetch leaves the tool exactly as it was without templates.
let PRIESTHOOD_TEMPLATES = [];

fetch('js/core_PHBR3_priesthoods.json')
  .then(response => response.json())
  .then(data => {
    // The file is an object with a _README block, not a bare array -- the
    // schema notes live beside the data so they cannot drift from it.
    PRIESTHOOD_TEMPLATES = (data && data.priesthoods) || [];
    console.log('Priesthood templates loaded:', PRIESTHOOD_TEMPLATES.length);
    // The dropdown is built once at bind time, so a sheet opened before this
    // resolves would show an empty list. Repopulate every open sheet on
    // arrival; harmless if none exist yet.
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.sheet-container').forEach(sheet => {
        if (typeof populatePriesthoodTemplates === 'function') populatePriesthoodTemplates(sheet);
      });
    }
  })
  .catch(err => console.error('Error loading priesthood templates:', err));
