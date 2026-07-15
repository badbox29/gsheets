// === Spell Database (AD&D 2E) ===
// Parsed from spells.json

// Official AD&D 2E spell schools
const OFFICIAL_SCHOOLS = [
  'Abjuration', 'Alteration', 'Conjuration', 'Divination', 
  'Enchantment', 'Illusion', 'Invocation', 'Necromancy',
  'Evocation', 'Summoning', 'Charm', 'Transmutation',
  // Specialist schools and variations
  'Wild Magic', 'Elemental', 'Geometry', 'Song', 'Alchemy',
  'Artifice', 'Mentalism', 'Shadow', 'Dimension', 'Force',
  'Chronomancy', 'Metamagic', 'Province'
];

// Official AD&D 2E priest spheres
const OFFICIAL_SPHERES = [
  'All', 'Animal', 'Astral', 'Charm', 'Combat', 'Creation',
  'Divination', 'Elemental', 'Guardian', 'Healing', 'Necromantic',
  'Plant', 'Protection', 'Summoning', 'Sun', 'Weather',
  'Chaos', 'Law', 'Numbers', 'Thought', 'Time', 'Travelers',
  'War', 'Wards'
];

let SPELLS_DB = [];
let SPELLS_LOADED = false;

// Load spells from the pre-parsed spells-clean.json.
// The new file already has structured fields (schools[], spheres[], level, etc.)
// so no description parsing is needed. We flatten to the exact SPELLS_DB shape
// every consumer already expects, so nothing downstream has to change.
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

        return {
          name: spell.name,
          level: level,
          class: (spell.class || '').toLowerCase(),
          school: school,
          sphere: sphere,
          range: spell.range || '',
          duration: spell.duration || '',
          aoe: spell.aoe || '',
          castTime: spell.castingTime || '',   // field renamed in the new data
          save: spell.save || '',
          components: spell.components || '',
          description: spell.description || ''  // already clean; no stripping needed
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
    
    // Filter by spheres (for priests)
    if (spellClass.includes('priest') && spheres.length > 0) {
      const spellSpheres = spell.sphere.toLowerCase();
      const hasMatchingSphere = spheres.some(s => 
        spellSpheres.includes(s.toLowerCase())
      );
      if (!hasMatchingSphere) {
        return false;
      }
    }
    
    // Filter by schools (for wizards)
    if (spellClass.includes('wizard') && schools.length > 0) {
      const spellSchools = spell.school.toLowerCase();
      const hasMatchingSchool = schools.some(s => 
        spellSchools.includes(s.toLowerCase())
      );
      if (!hasMatchingSchool) {
        return false;
      }
    }
    
    return true;
  });
}

// Get unique list of all spheres (cleaned and deduplicated)
function getAllSpheres() {
  const spheres = new Set();
  
  SPELLS_DB.forEach(spell => {
    if (spell.sphere) {
      const sphereText = spell.sphere;
      
      // Try to extract official sphere names from the text
      OFFICIAL_SPHERES.forEach(officialSphere => {
        // Use word boundary to avoid partial matches
        const regex = new RegExp('\\b' + officialSphere + '\\b', 'i');
        if (regex.test(sphereText)) {
          spheres.add(officialSphere);
        }
      });
    }
  });
  
  return Array.from(spheres).sort();
}

// Get unique list of all schools (cleaned and deduplicated)
function getAllSchools() {
  const schools = new Set();
  
  SPELLS_DB.forEach(spell => {
    if (spell.school) {
      const schoolText = spell.school;
      
      // Try to extract official school names from the text
      OFFICIAL_SCHOOLS.forEach(officialSchool => {
        if (schoolText.includes(officialSchool)) {
          schools.add(officialSchool);
        }
      });
    }
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

    // Self-heal descriptions mangled by the old parser. Only replace when the
    // SAVED text carries a known corruption signature -- a leading PO block, a
    // bare PO attribute, or a "page NNN" citation prefix -- AND the DB has a
    // real description to put in its place. These signatures never appear in a
    // correct description, so hand-typed content is never touched.
    const savedDesc = String(saved.description || '');
    const looksMangled =
      /^\s*PO:\s*S&M\b/.test(savedDesc) ||
      /^\s*(Subtlety|Knockdown|Sensory|Critical)\s*\n/.test(savedDesc) ||
      /^\s*page\s+\d+\s/i.test(savedDesc);
    if (looksMangled && match.description && match.description.length > 40) {
      saved.description = match.description;
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
