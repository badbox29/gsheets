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

// Load and parse spells.json
async function loadSpells() {
  if (SPELLS_LOADED) return SPELLS_DB;
  
  try {
    const response = await fetch('js/spells.json');
    const rawSpells = await response.json();
    
    // Parse each spell to extract class, level, school/sphere from description
    SPELLS_DB = rawSpells.map(spell => {
      const desc = spell.description || '';
      
      // Extract spell level
      const levelMatch = desc.match(/Spell Level:\s*(\d+)/i);
      const level = levelMatch ? parseInt(levelMatch[1], 10) : 0;
      
      // Extract class
      const classMatch = desc.match(/Class:\s*([\w\s,\/]+)/i);
      const spellClass = classMatch ? classMatch[1].trim() : '';
      
      // Extract school (for wizards)
      const schoolMatch = desc.match(/School:\s*([\w\s,\/]+)/i);
      const school = schoolMatch ? schoolMatch[1].trim() : '';
      
      // Extract sphere (for priests)
      const sphereMatch = desc.match(/Sphere:\s*([\w\s,\/\(\)-]+)/i);
      const sphere = sphereMatch ? sphereMatch[1].trim() : '';
      
      // Extract other useful fields
      const rangeMatch = desc.match(/Range:\s*([^\n]+)/i);
      const range = rangeMatch ? rangeMatch[1].trim() : '';
      
      const durationMatch = desc.match(/Duration:\s*([^\n]+)/i);
      const duration = durationMatch ? durationMatch[1].trim() : '';
      
      const aoeMatch = desc.match(/AOE:\s*([^\n]+)/i);
      const aoe = aoeMatch ? aoeMatch[1].trim() : '';
      
      const castTimeMatch = desc.match(/Casting Time:\s*([^\n]+)/i);
      const castTime = castTimeMatch ? castTimeMatch[1].trim() : '';
      
      const saveMatch = desc.match(/Save:\s*([^\n]+)/i);
      const save = saveMatch ? saveMatch[1].trim() : '';
      
      const componentsMatch = desc.match(/Req:\s*([^\n]+)/i);
      const components = componentsMatch ? componentsMatch[1].trim() : '';
      
      return {
        name: spell.name,
        level: level,
        class: spellClass.toLowerCase(),
        school: school,
        sphere: sphere,
        range: range,
        duration: duration,
        aoe: aoe,
        castTime: castTime,
        save: save,
        components: components,
        description: cleanSpellDescription(desc)
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