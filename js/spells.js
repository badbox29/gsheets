// === Spell Database (AD&D 2E) ===
// Parsed from spells.json

// AD&D 2E wizard schools, in the canonical compound form the cleaned data uses.
// (These are only a fallback for building filter menus; getAllSchools() reads
// the actual values present in the loaded data.)
const OFFICIAL_SCHOOLS = [
  'Abjuration', 'Alteration', 'Conjuration/Summoning', 'Divination',
  'Enchantment/Charm', 'Illusion/Phantasm', 'Invocation/Evocation', 'Necromancy'
];

// AD&D 2E priest spheres (core). Setting-specific spheres (Cosmos, the Dark Sun
// paraelementals) live in a separate field and are intentionally excluded here.
const OFFICIAL_SPHERES = [
  'All', 'Animal', 'Astral', 'Chaos', 'Charm', 'Combat', 'Creation',
  'Divination', 'Elemental Air', 'Elemental Earth', 'Elemental Fire',
  'Elemental Water', 'Guardian', 'Healing', 'Law', 'Necromantic', 'Numbers',
  'Plant', 'Protection', 'Summoning', 'Sun', 'Thought', 'Time', 'Travelers',
  'War', 'Wards', 'Weather'
];

// Split a comma-joined school/sphere string into its individual tokens.
// The cleaned data stores multi-value classifications as "A, B" and compound
// names as single tokens ("Invocation/Evocation"), so we split ONLY on commas.
function splitClassification(str) {
  return (str || '').split(',').map(s => s.trim()).filter(Boolean);
}

let SPELLS_DB = [];
let SPELLS_LOADED = false;

// Load spells from the pre-parsed spells-clean.json.
// The new file already has structured fields (schools[], spheres[], level, etc.)
// so no description parsing is needed. We flatten to the exact SPELLS_DB shape
// every consumer already expects, so nothing downstream has to change.
// Canonicalize equivalent saving-throw spellings so the browser's Save filter and
// the detail modal show one consistent value. Conservative on purpose: only merges
// that are unambiguously the SAME save (the "negates" family, case-only dupes) plus
// whitespace trimming. Genuinely different or garbled values (e.g. glued source
// tags like "(Special - PSC)") are left untouched for a source-data pass verified
// against the WSC/PSC.
const SAVE_ALIASES = {
  'neg': 'Neg.',
  'neg.': 'Neg.',
  'nega.': 'Neg.',
  'negate': 'Neg.',
  'negates': 'Neg.',
  'none or neg': 'None or Neg.',
  'none or neg.': 'None or Neg.'
};
function normalizeSave(raw) {
  const s = (raw || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return SAVE_ALIASES[s.toLowerCase()] || s;
}

async function loadSpells() {
  if (SPELLS_LOADED) return SPELLS_DB;

  try {
    const response = await fetch('js/spells-clean.json');
    const rawSpells = await response.json();

    SPELLS_DB = rawSpells
      // Drop non-castable entries: the 3 WSC "Lost spell" lore footnotes and
      // the 1 empty scrape artifact. They aren't real, pickable spells.
      .filter(spell => spell.castable !== false)
      .map(spell => {
        // level may be a number or the string "Cantrip"; anything non-numeric
        // becomes 0 so level comparisons and sorting never yield NaN.
        let level = spell.level;
        if (typeof level !== 'number') {
          const n = parseInt(level, 10);
          level = Number.isFinite(n) ? n : 0;
        }

       // schools[] / spheres[] -> the single string the old code emitted.
        const school = Array.isArray(spell.schools) ? spell.schools.join(', ') : (spell.schools || '');
        const sphere = Array.isArray(spell.spheres) ? spell.spheres.join(', ') : (spell.spheres || '');
        // Setting-specific spheres (Dark Sun paraelementals, Spelljammer Cosmos)
        // are kept separate so they only match when a campaign setting unlocks them.
        const sphereSetting = Array.isArray(spell.spheresSetting) ? spell.spheresSetting.join(', ') : (spell.spheresSetting || '');

        return {
          name: spell.name,
          level: level,
          class: (spell.class || '').toLowerCase(),
          school: school,
          sphere: sphere,
          sphereSetting: sphereSetting,
          range: spell.range || '',
          duration: spell.duration || '',
          aoe: spell.aoe || '',
          castTime: spell.castingTime || '',   // field renamed in the new data
          save: normalizeSave(spell.save),
          components: spell.components || '',
          description: spell.description || '',  // already clean; no stripping needed
          source: spell.source || '',
          wscRef: spell.wscRef || ''
        };
      });

    SPELLS_LOADED = true;
    console.log(`Loaded ${SPELLS_DB.length} spells from database`);
    return SPELLS_DB;
  } catch (error) {
    console.error('Error loading spells:', error);
    return [];
  }
}

// Filter spells by class, level, and spheres/schools
function filterSpells(options = {}) {
  const {
    spellClass = '',    // 'wizard' or 'priest'
    maxLevel = 9,       // highest level character can cast
    spheres = [],       // array of sphere names for priests
    schools = []        // array of school names for wizards
  } = options;
  
  return SPELLS_DB.filter(spell => {
    // Filter by class
    if (spellClass && !spell.class.includes(spellClass)) {
      return false;
    }
    
    // Filter by level
    if (spell.level > maxLevel) {
      return false;
    }
    
    // Filter by spheres (for priests). Exact token match, not substring:
    // 'Water' must not match 'Elemental Water', and 'Air' must not match
    // arbitrary text. A spell qualifies if ANY of its spheres is selected.
    // Setting spheres (from the character's campaign setting) count too, so a
    // Dark Sun cleric who ticks Elemental Magma sees the paraelemental spells.
    if (spellClass.includes('priest') && spheres.length > 0) {
      const spellSpheres = splitClassification(spell.sphere)
        .concat(splitClassification(spell.sphereSetting));
      const wanted = spheres.map(s => s.toLowerCase());
      const hasMatchingSphere = spellSpheres.some(sp =>
        wanted.includes(sp.toLowerCase())
      );
      if (!hasMatchingSphere) {
        return false;
      }
    }

    // Filter by schools (for wizards). Same exact-token rule; a multi-school
    // spell qualifies if any of its schools is selected.
    if (spellClass.includes('wizard') && schools.length > 0) {
      const spellSchools = splitClassification(spell.school);
      const wanted = schools.map(s => s.toLowerCase());
      const hasMatchingSchool = spellSchools.some(sc =>
        wanted.includes(sc.toLowerCase())
      );
      if (!hasMatchingSchool) {
        return false;
      }
    }
    
    return true;
  });
}

// Unique list of all spheres actually present in the loaded data. The cleaned
// data already holds canonical tokens, so we just split and collect -- no
// regex scanning of free text.
function getAllSpheres() {
  const spheres = new Set();
  SPELLS_DB.forEach(spell => {
    splitClassification(spell.sphere).forEach(s => spheres.add(s));
  });
  return Array.from(spheres).sort();
}

// Unique list of all schools actually present in the loaded data. Split-and-
// collect on the canonical tokens; no free-text scanning.
function getAllSchools() {
  const schools = new Set();
  SPELLS_DB.forEach(spell => {
    splitClassification(spell.school).forEach(s => schools.add(s));
  });
  return Array.from(schools).sort();
}

// Extract clean description (remove metadata lines)
function cleanSpellDescription(fullDescription) {
  if (!fullDescription) return '';
  
  // Split into lines
  const lines = fullDescription.split('\n');
  
  // Skip lines that start with known metadata fields
  const metadataFields = [
    'Spell Level:', 'Class:', 'School:', 'Sphere:', 'Range:', 
    'Duration:', 'AOE:', 'Area of Effect:', 'Source:', 'Casting Time:', 
    'Save:', 'Saving Throw:', 'Req:', 'Components:', 'PO:', 'Subtlety',
    'Knockdown', 'Sensory', 'Critical'
  ];
  
  const descriptionLines = lines.filter(line => {
    const trimmed = line.trim();
    // Skip empty lines at start
    if (!trimmed) return false;
    // Skip metadata lines
    return !metadataFields.some(field => trimmed.startsWith(field));
  });
  
  // Join back together and trim
  return descriptionLines.join('\n').trim();
}

// ===== Spell data migration =====
// Re-resolve saved spells against the current SPELLS_DB.
//  - school/sphere, blank fields, and the components "Source:" leak are cleaned
//    up SILENTLY (the old strings were always messy; fixing them loses nothing).
//  - LEVEL changes are returned to the caller to surface, because level drives
//    slot accounting and is the only change that can alter how a character plays.
// Returns an array of level-change records: { name, from, to, ref }.
function migrateSavedSpells(spellArray) {
  if (!Array.isArray(spellArray) || SPELLS_DB.length === 0) return [];

  const byName = {};
  SPELLS_DB.forEach(s => { byName[s.name.toLowerCase()] = s; });

  const levelChanges = [];

  spellArray.forEach(saved => {
    const match = byName[(saved.name || '').toLowerCase()];
    if (!match) return; // unknown / homebrew: never touch

    // --- silent cleanups ---
    const canonCS = spellClassification(match);
    if (canonCS && (saved.schoolSphere || '').trim() !== canonCS) {
      saved.schoolSphere = canonCS;
    }

    const fill = {
      castTime: match.castTime, range: match.range, duration: match.duration,
      components: match.components, save: match.save, description: match.description
    };
    Object.keys(fill).forEach(f => {
      if (!String(saved[f] == null ? '' : saved[f]).trim() && fill[f]) saved[f] = fill[f];
    });

    // Self-heal descriptions mangled by the old parser, without ever touching
    // hand-edited text. Replace the saved description only when it is provably
    // corrupt-or-superseded AND the DB has a real description to swap in:
    //   (1) it carries a known corruption signature the correct text never has
    //       (a leading PO block, a bare PO attribute line, or a "page NNN"
    //       citation prefix); or
    //   (2) it is a strict, meaningfully-shorter substring of the canonical
    //       description -- i.e. the DB version is the same text with a truncated
    //       beginning restored, so replacing loses nothing.
    const savedDesc = String(saved.description || '');
    const canonDesc = String(match.description || '');
    if (canonDesc.length > 40 && savedDesc) {
      const hasCorruptionSignature =
        /^\s*PO:\s*S&M\b/.test(savedDesc) ||
        /^\s*(Subtlety|Knockdown|Sensory|Critical)\s*\n/.test(savedDesc) ||
        /^\s*page\s+\d+\s/i.test(savedDesc);
      const isTruncatedSubstring =
        canonDesc.indexOf(savedDesc.trim()) !== -1 &&
        savedDesc.trim().length < canonDesc.length - 20;
      if (hasCorruptionSignature || isTruncatedSubstring) {
        saved.description = canonDesc;
      }
    }

    if (saved.components && /\bSource:/i.test(saved.components)) {
      const fixed = saved.components.split(/\s*Source:/i)[0].trim();
      if (fixed) saved.components = fixed;
    }

    // --- surfaced: level ---
    const curLevel = String(saved.level == null ? '' : saved.level).trim();
    const newLevel = String(match.level);
    if (curLevel !== '' && curLevel !== newLevel) {
      levelChanges.push({
        name: saved.name, from: curLevel, to: newLevel, ref: match.wscRef || ''
      });
      saved.level = match.level;
    }
  });

  return levelChanges;
}
