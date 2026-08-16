// Adding temp variable for sync testing.
const APP_JS_BUILD = 'prod-1';

// Shortcuts & constants
const $ = id => document.getElementById(id);
const CHAR_MAP_KEY = 'adnd2e_characters_map';
const KV_CONFIG_KEY = 'adnd2e_kv_config';
// Upload gate. Only rejects the absurd -- anything under this is downscaled to
// AVATAR_SRC_MAX regardless of what came in, so refusing a 3MB photo would mean
// refusing work we are about to do anyway. The old 1MB cap rejected files the
// app could handle perfectly well.
const AVATAR_MAX_SIZE = 12 * 1024 * 1024; // 12 MB

// STORED SOURCE. What actually lives in the character record now -- the whole
// uploaded image, not a crop of it, because character art is nearly always
// portrait while the .avatar box is 3:2 landscape.
//
// 1024 is set by the portrait window, which caps at 300px wide: past roughly
// 600px there is nothing left for a retina display to show. It is not set by
// print, which renders from the crop at AVATAR_OUT_* below.
//
// The ceiling is real, not aesthetic: localStorage is ~5MB for every character
// plus the map plus config, and each portrait rides into KV as well. 1024 at
// q0.82 lands near 110KB; 1600 would land near 260KB and put a dozen
// characters within reach of the quota.
const AVATAR_SRC_MAX = 1024;      // longest edge, px
const AVATAR_SRC_QUALITY = 0.82;

// PRINT RASTER dimensions -- no longer the stored size. 3:2, matching the
// .avatar box and the print plate's portrait frame. 660px across a 150pt
// printed frame is roughly 317 dpi, past the point where more pixels show on
// paper. Produced on demand by avatarPrintDataUrl() and never saved.
const AVATAR_OUT_W = 660;
const AVATAR_OUT_H = 440;

// JPEG rather than PNG: portraits are photographic, and a PNG of one is
// typically ten times the size for no visible gain. Quality 0.85 is where the
// curve flattens.
const AVATAR_JPEG_QUALITY = 0.85;
const AUTOSAVE_INTERVAL = 60; // seconds between autosaves

// ===== KV Sync — token generation =====
function generateSyncToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// ===== Character generator — name tables =====
// js/core_names.json is ~380KB and most sessions never open the generator, so
// this loads LAZILY on first modal open rather than at boot. Deliberately the
// spells.js shape (flag-guarded, awaited, idempotent) and NOT the weapons.js
// fire-and-forget fetch, which would pay the cost on every page view.
//
// A failure is non-fatal: NAMES_DB stays null, NAMES_LOADED goes true so we do
// not retry on every click, and the generator reports it rather than throwing.
let NAMES_DB = null;
let NAMES_LOADED = false;
let NAMES_LOADING = null;

async function loadNameTables() {
  if (NAMES_LOADED) return NAMES_DB;
  // Concurrent callers await the SAME promise instead of each firing a fetch.
  if (NAMES_LOADING) return NAMES_LOADING;

  NAMES_LOADING = (async () => {
    try {
      const response = await fetch('js/core_names.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      NAMES_DB = data;
      console.log('Name tables loaded:',
        (data.firstNames || []).length + ' first, ' +
        (data.lastNames  || []).length + ' last, ' +
        (data.titles     || []).length + ' titles');
    } catch (err) {
      console.error('Error loading name tables:', err);
      NAMES_DB = null;
    } finally {
      NAMES_LOADED = true;
      NAMES_LOADING = null;
    }
    return NAMES_DB;
  })();

  return NAMES_LOADING;
}

// Fills the six generator dropdowns. EVERY list is derived from an existing
// table rather than hardcoded here -- a second copy of the race or class
// vocabulary would drift the moment either changes.
//
// Re-run on class change: kits and legal alignments both depend on it.
function populateGeneratorControls(root) {
  const raceSel  = qs(root, '.gen-race');
  const classSel = qs(root, '.gen-class');
  if (!raceSel || !classSel) return;

  // The six PHB races. getRaceKey is the app's own normaliser, so this is the
  // authoritative list -- half-orc is absent because 2e dropped it (see notes).
  if (!raceSel.options.length) {
    ['human', 'dwarf', 'elf', 'gnome', 'half-elf', 'halfling'].forEach(r => {
      const o = document.createElement('option');
      o.value = r;
      o.textContent = r.charAt(0).toUpperCase() + r.slice(1).replace('-e', '-E');
      raceSel.appendChild(o);
    });
    raceSel.insertBefore(new Option('Random', 'random'), raceSel.firstChild);
    raceSel.value = 'random';
  }

  // Single classes only. CLASS_CATEGORIES also carries generic ('warrior') and
  // homebrew ('hb_') entries, which are real classes on a sheet but not things
  // to offer in a generator.
  if (!classSel.options.length && typeof CLASS_CATEGORIES === 'object') {
    Object.keys(CLASS_CATEGORIES)
      // hb_ is the homebrew prefix. 'demipaladin' is Chris's one-off demi-paladin
      // under a second, UNPREFIXED key, so the prefix filter alone misses it --
      // exclude it by name. A one-off character is not a generator option.
      .filter(c => c.indexOf('hb_') !== 0 && c !== 'demipaladin')
      // CLASS_CATEGORIES also carries the four GROUP names and 'specialist' as
      // catch-alls. They are real values on a sheet, but not classes to offer.
      .filter(c => ['warrior', 'priest', 'rogue', 'wizard', 'specialist'].indexOf(c) === -1)
      .sort()
      .forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        // Legality lives in TWO tables: CLASS_ABILITY_MINIMUMS covers the eight
        // PHB classes, and specialists are deliberately skipped there because
        // Table 13 defers to Table 22 -- their minimums are in SPECIALIST_WIZARDS.
        // A class in neither cannot have requirements enforced, so roll-until-
        // legal is a no-op for it. Say so rather than letting it look gated.
        const hasMins = (typeof CLASS_ABILITY_MINIMUMS === 'object' && CLASS_ABILITY_MINIMUMS[c]) ||
                        (typeof SPECIALIST_WIZARDS === 'object' && SPECIALIST_WIZARDS[c]);
        o.textContent = c.charAt(0).toUpperCase() + c.slice(1) +
                        (hasMins ? '' : ' (no ability requirements)');
        classSel.appendChild(o);
      });
    classSel.insertBefore(new Option('Random', 'random'), classSel.firstChild);
    classSel.value = 'random';
  }

  // Kits and legal alignments BOTH depend on class, so they have to follow it
  // rather than only filling on modal open. Assigned with onchange (not
  // addEventListener) so reopening the modal cannot stack duplicate handlers.
  classSel.onchange = () => {
    populateGeneratorKits(root);
    populateGeneratorAlignments(root);
  };

  populateGeneratorKits(root);
  populateGeneratorAlignments(root);
}

// Kits depend on class. 'Random' class means we cannot know the kit list yet,
// so the control degrades to None rather than offering kits from a class the
// character may not get.
function populateGeneratorKits(root) {
  const classSel = qs(root, '.gen-class');
  const kitSel   = qs(root, '.gen-kit');
  if (!kitSel) return;

  const clazz = classSel ? classSel.value : '';
  kitSel.innerHTML = '<option value="">None</option>';
  if (!clazz || clazz === 'random' || typeof getKitsForClass !== 'function') {
    kitSel.disabled = true;
    return;
  }
  const kits = getKitsForClass(clazz) || [];
  kitSel.disabled = kits.length === 0;
  kits.forEach(kit => {
    const o = document.createElement('option');
    o.value = kit.name.toLowerCase().replace(/\s+/g, '');
    o.textContent = kit.name;
    kitSel.appendChild(o);
  });
}

// Only alignments the chosen class can legally hold. A paladin offers Lawful
// Good and nothing else, so an illegal character cannot be requested in the
// first place -- cheaper than generating one and rejecting it.
function populateGeneratorAlignments(root) {
  const classSel = qs(root, '.gen-class');
  const alignSel = qs(root, '.gen-alignment');
  if (!alignSel || typeof ALIGNMENT_ORDER === 'undefined') return;

  const clazz = classSel ? classSel.value : '';
  const req = (clazz && clazz !== 'random' && typeof CLASS_ALIGNMENT_REQUIREMENTS === 'object')
    ? CLASS_ALIGNMENT_REQUIREMENTS[clazz] : null;
  const allowed = req ? req.allowed : PLAYER_ALIGNMENTS;

  alignSel.innerHTML = '';
  alignSel.appendChild(new Option('Random (legal for class)', 'random'));
  allowed.forEach(key => {
    if (!ALIGNMENTS[key] || ALIGNMENTS[key].notAnAlignment) return;
    alignSel.appendChild(new Option(ALIGNMENTS[key].label, key));
  });
  if (req) {
    const note = ' \u2014 ' + req.describe;
    alignSel.options[0].textContent = 'Random' + note;
  }
}

// Resolve race and class against each other BEFORE any dice are rolled.
//
// A race/class mismatch can never be fixed by rerolling -- Abjurer is human-only
// and an elf Abjurer stays illegal at attempt one million. Legality here comes
// from RACE_CLASSES (Chapter 2) plus, for specialists, the per-school `races`
// array in SPECIALIST_WIZARDS, which is narrower still.
//
// Returns { race, clazz } or { error } when the pair cannot be satisfied.
// root is REQUIRED in practice: every tab carries its own copy of the modal, so
// a document-wide lookup finds the first tab's class dropdown, which is empty
// unless the modal was opened there. That yields zero legal classes for every
// race and reports a nonsense "no class is legal for a <race>" error.
function resolveGeneratorRaceClass(wantRace, wantClass, root) {
  const RACES = ['human', 'dwarf', 'elf', 'gnome', 'half-elf', 'halfling'];
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const classLegalForRace = (clazz, raceKey) => {
    // Specialists carry their OWN race list, and it is stricter than the
    // Chapter 2 row -- an elf may be "specialist" generally but not an Abjurer.
    if (typeof SPECIALIST_WIZARDS === 'object' && SPECIALIST_WIZARDS[clazz]) {
      const races = SPECIALIST_WIZARDS[clazz].races || [];
      if (races.indexOf(raceKey) === -1) return false;
    }
    if (raceKey === 'human') return true;          // humans may be anything
    const allowed = (typeof RACE_CLASSES === 'object') ? RACE_CLASSES[raceKey] : null;
    if (!allowed) return true;                     // unknown race: do not judge
    const token = (typeof getRaceClassToken === 'function')
      ? getRaceClassToken(clazz) : null;
    if (!token) return true;                       // unrecognised class: silent
    return allowed.indexOf(token) !== -1;
  };

  const scope = root || (typeof getActiveRoot === 'function' ? getActiveRoot() : null);
  const classSel = scope ? qs(scope, '.gen-class') : null;
  const allClasses = classSel
    ? Array.from(classSel.options).map(o => o.value).filter(v => v && v !== 'random')
    : [];

  const raceGiven  = wantRace  && wantRace  !== 'random';
  const classGiven = wantClass && wantClass !== 'random';

  if (raceGiven && classGiven) {
    if (!classLegalForRace(wantClass, wantRace)) {
      return { error: 'A ' + wantRace + ' cannot be a ' + wantClass + '.' };
    }
    return { race: wantRace, clazz: wantClass };
  }

  // Build the legal pairs and draw from those, rather than guessing and
  // retrying -- with one side fixed the candidate list is short.
  if (raceGiven) {
    const ok = allClasses.filter(c => classLegalForRace(c, wantRace));
    if (!ok.length) return { error: 'No available class is legal for a ' + wantRace + '.' };
    return { race: wantRace, clazz: pick(ok) };
  }
  if (classGiven) {
    const ok = RACES.filter(r => classLegalForRace(wantClass, r));
    if (!ok.length) return { error: 'No player race can be a ' + wantClass + '.' };
    return { race: pick(ok), clazz: wantClass };
  }

  const race = pick(RACES);
  const ok = allClasses.filter(c => classLegalForRace(c, race));
  if (!ok.length) return { error: 'No available class is legal for a ' + race + '.' };
  return { race: race, clazz: pick(ok) };
}

// Roll a legal set of ability scores for a given race and class.
//
// THE METHODS ARE NOT EQUIVALENT, and that drives the design:
//   - method1 rolls 3d6 six times IN ORDER and cannot be rearranged.
//   - method2, 3d6 and 4d6 produce six scores the player assigns freely, so we
//     ASSIGN TO FIT before rerolling -- place each requirement on a score that
//     satisfies it, then fill the rest. Far fewer rerolls, and it is what a
//     player actually does.
//
// Method I rerolls until legal, which is rejection sampling: the result is
// systematically stronger than plain 3d6, because we are sampling 3d6 CONDITIONED
// on legality. The rarity is itself the rule -- paladins are rare precisely
// because those scores in order are rare -- so the attempt count is REPORTED
// rather than hidden. attempts is returned for that purpose.
//
// Legality lives in THREE places and all three must be checked:
//   Table 7  RACE_ABILITY_REQUIREMENTS -- tested against the ROLLED score
//   Table 8  RACE_ABILITY_ADJUSTMENTS  -- applied AFTER, giving the final score
//   Table 13 CLASS_ABILITY_MINIMUMS, or SPECIALIST_WIZARDS.minAbility for a
//            specialist, which validateAbilityMinimums deliberately skips
//            because Table 13 defers to Table 22.
const GEN_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const GEN_MAX_ROLL_ATTEMPTS = 250000;

function generatorClassMinimums(clazz) {
  const c = (clazz || '').toLowerCase();
  if (typeof SPECIALIST_WIZARDS === 'object' && SPECIALIST_WIZARDS[c]) {
    const spec = SPECIALIST_WIZARDS[c];
    // A specialist is a wizard first: INT 9 from the mage row, plus the school's
    // own minimum from Table 22.
    const mins = Object.assign({}, (CLASS_ABILITY_MINIMUMS || {}).mage || {});
    if (spec.minAbility) mins[spec.minAbility.stat] = spec.minAbility.score;
    return mins;
  }
  return (typeof CLASS_ABILITY_MINIMUMS === 'object' && CLASS_ABILITY_MINIMUMS[c])
    ? CLASS_ABILITY_MINIMUMS[c] : {};
}

function generatorRollScores(race, clazz, method) {
  const raceKey = (typeof getRaceKey === 'function') ? getRaceKey(race) : null;
  const ranges  = (typeof RACE_ABILITY_REQUIREMENTS === 'object' && raceKey)
    ? RACE_ABILITY_REQUIREMENTS[raceKey] : null;
  const adj     = (typeof RACE_ABILITY_ADJUSTMENTS === 'object' && raceKey)
    ? (RACE_ABILITY_ADJUSTMENTS[raceKey] || {}) : {};
  const mins    = generatorClassMinimums(clazz);

  // Six totals for one character. 3d6 and 4d6 return ONE roll per call, so they
  // are called six times; method1 and method2 already return six.
  const rollSix = () => {
    if (method === 'method1' || method === 'method2') {
      return rollAbilityScores(method).map(r => r.total);
    }
    const out = [];
    for (let i = 0; i < 6; i++) out.push(rollAbilityScores(method)[0].total);
    return out;
  };

  const rolledOk = (ability, rolled) => {
    if (!ranges || !ranges[ability]) return true;
    return rolled >= ranges[ability][0] && rolled <= ranges[ability][1];
  };
  const finalOk = (ability, rolled) => {
    if (!mins[ability]) return true;
    return rolled + (adj[ability] || 0) >= mins[ability];
  };
  const fits = (ability, rolled) => rolledOk(ability, rolled) && finalOk(ability, rolled);

  // Assignable methods: try to PLACE the six totals rather than reroll blindly.
  // Hardest requirement first, so a scarce high score is not spent on an easy
  // slot. Greedy is sufficient here -- six values, six slots, and the
  // constraints are simple thresholds.
  const assign = totals => {
    const pool = totals.slice();
    const out = {};
    const order = GEN_ABILITIES.slice().sort((a, b) => (mins[b] || 0) - (mins[a] || 0));
    for (const ability of order) {
      let idx = -1;
      let best = Infinity;
      pool.forEach((v, i) => {
        // Cheapest score that still satisfies the slot: spending an 18 on a
        // requirement of 9 wastes it.
        if (fits(ability, v) && v < best) { best = v; idx = i; }
      });
      if (idx === -1) return null;
      out[ability] = pool.splice(idx, 1)[0];
    }
    return out;
  };

  let attempts = 0;
  while (attempts < GEN_MAX_ROLL_ATTEMPTS) {
    attempts++;
    const totals = rollSix();

    if (method === 'method1') {
      // IN ORDER: str, dex, con, int, wis, cha. No rearranging.
      const set = {};
      GEN_ABILITIES.forEach((a, i) => { set[a] = totals[i]; });
      if (GEN_ABILITIES.every(a => fits(a, set[a]))) {
        return { rolled: set, adjusted: applyGeneratorAdjustments(set, adj), attempts: attempts };
      }
    } else {
      const set = assign(totals);
      if (set) {
        return { rolled: set, adjusted: applyGeneratorAdjustments(set, adj), attempts: attempts };
      }
    }
  }

  return { error: 'Could not roll a legal ' + clazz + ' after ' +
                  GEN_MAX_ROLL_ATTEMPTS.toLocaleString() + ' attempts.', attempts: attempts };
}

// Table 8 applied to the rolled scores. Kept separate so the ROLLED values stay
// available -- Table 7 is tested against those, and the sheet's own validator
// backs the adjustment out again to do the same.
function applyGeneratorAdjustments(set, adj) {
  const out = {};
  GEN_ABILITIES.forEach(a => { out[a] = set[a] + (adj[a] || 0); });
  return out;
}

// Physical description and hit points. Everything here is a table lookup plus
// dice -- Tables 10 and 11 are transcribed in tables.js and photo-verified.
//
// Height and weight are BASE + dice, and the base differs by sex, so gender has
// to be resolved before this runs.
function generatorPhysical(race, gender) {
  const raceKey = (typeof getRaceKey === 'function') ? getRaceKey(race) : null;
  const hw  = (typeof RACE_HEIGHT_WEIGHT === 'object' && raceKey) ? RACE_HEIGHT_WEIGHT[raceKey] : null;
  const age = (typeof RACE_STARTING_AGE  === 'object' && raceKey) ? RACE_STARTING_AGE[raceKey]  : null;
  const sex = (gender === 'female') ? 'female' : 'male';
  const out = {};

  if (hw) {
    out.height = hw.height[sex] + rollDiceFormula(hw.height.dice).total;
    out.weight = hw.weight[sex] + rollDiceFormula(hw.weight.dice).total;
  }
  if (age) out.age = age.base + rollDiceFormula(age.dice).total;
  return out;
}

// Hit points for a single-class character at a given level.
//
// Three rules interact and all three are already in tables.js:
//   hitDiceParts   -- how many dice, and the FLAT points gained past the cap
//                     (warrior/priest 10th+, wizard/rogue 11th+)
//   applyHitDieFloor -- Table 3's CON 20+ footnotes turn low rolls into 2s, 3s
//                     or 4s. PER DIE, and NOT applied to flat levels, because
//                     no die is rolled there.
//   CON_HP_BONUS   -- a PAIR: [0] for everyone, [1] the warriors-only figure.
//                     A CON 18 fighter gets +4 where a CON 18 thief gets +2.
//
// The Constitution bonus applies once per Hit Die, and NOT to flat levels --
// the same reason the floor does not.
function generatorHitPoints(clazz, level, con) {
  const parts = (typeof hitDiceParts === 'function') ? hitDiceParts(clazz, 1, level) : null;
  if (!parts) return null;

  const row = (typeof CON_HP_BONUS === 'object') ? CON_HP_BONUS[con] : null;
  const isWarrior = (typeof isWarriorClass === 'function') && isWarriorClass(clazz);
  const conBonus = row ? (isWarrior ? row[1] : row[0]) : 0;

  let total = 0;
  const rolls = [];
  for (let i = 0; i < parts.dice; i++) {
    let r = rollDie(parts.die);
    if (typeof applyHitDieFloor === 'function') r = applyHitDieFloor(r, con);
    rolls.push(r);
    total += r + conBonus;
  }
  total += parts.flat;

  // A living character has at least 1 hit point, however punishing the
  // Constitution penalty.
  return { hp: Math.max(1, total), rolls: rolls, conBonus: conBonus, flat: parts.flat };
}

// Draw a name and, sometimes, a title from core_names.json.
//
// HALF-ELVES HAVE NO POOL OF THEIR OWN. _meta.derivedRacePools says to build
// their candidates from the union of human and elf, plus any record explicitly
// tagged half-elf. Do not look for half-elf tags on ordinary names -- v4 removed
// them deliberately, and re-adding them would double-weight those entries.
function generatorNamePool(list, raceKey, gender) {
  if (!list) return [];
  const wanted = (raceKey === 'half-elf') ? ['human', 'elf', 'half-elf'] : [raceKey];
  return list.filter(rec => {
    if (gender && rec.gender && rec.gender !== gender) return false;
    return (rec.race || []).some(r => wanted.indexOf(r) !== -1);
  });
}

// Chance that a character has a title at all, by level. Bands are [min, max];
// _meta.titleChanceRule says 21+ uses the final band rather than falling off
// the end of the table.
function generatorTitleChance(level) {
  const bands = (NAMES_DB && NAMES_DB._meta && NAMES_DB._meta.titleChanceByLevel) || [];
  if (!bands.length) return 0;
  for (const b of bands) {
    if (level >= b.levels[0] && level <= b.levels[1]) return b.chance;
  }
  return bands[bands.length - 1].chance;
}

// Eligible titles for this character, then a WEIGHTED draw -- weight is the only
// tuning the file carries, and a uniform pick would throw it away.
// AFFINITY WEIGHTS, IT DOES NOT GATE. Only three things are hard gates: gender,
// the race array, and minLevel. Class and race affinity multiply a title's
// weight instead of excluding it, because every title's own eligibility.note
// says class affinity is a generator heuristic and not a rules requirement --
// filtering on it contradicts the data. A human cleric of a forge god may be
// Forgehand; he is simply four times less likely to be than a dwarf.
//
// The multiplier comes from _meta.affinityWeighting so it can be tuned in the
// data file rather than here.
function generatorPickTitle(raceKey, gender, clazz, level) {
  if (!NAMES_DB || !NAMES_DB.titles) return '';
  if (Math.random() > generatorTitleChance(level)) return '';

  const group = (typeof getClassCategory === 'function') ? getClassCategory(clazz) : null;
  const c = (clazz || '').toLowerCase();
  const mult = ((NAMES_DB._meta || {}).affinityWeighting || {}).multiplier || 1;

  // Hard gates only.
  const eligible = NAMES_DB.titles.filter(t => {
    const e = t.eligibility || {};
    if (t.gender && t.gender !== 'any' && t.gender !== gender) return false;
    if ((t.race || []).length && (t.race || []).indexOf(raceKey) === -1) return false;
    if (e.minLevel && level < e.minLevel) return false;
    return true;
  });
  if (!eligible.length) return '';

  // Race and class affinity stack: a dwarf priest drawing Keeper of the Forge
  // gets both multipliers, which is the intent -- it is the most fitting title
  // in the set for him.
  const weightOf = t => {
    const e = t.eligibility || {};
    let w = e.weight || 1;
    if ((t.raceAffinity || []).indexOf(raceKey) !== -1) w *= mult;
    const names = e.classes || [];
    const groups = e.classGroups || [];
    if (names.indexOf(c) !== -1 || (group && groups.indexOf(group) !== -1)) w *= mult;
    return w;
  };

  const total = eligible.reduce((sum, t) => sum + weightOf(t), 0);
  let n = Math.random() * total;
  for (const t of eligible) {
    n -= weightOf(t);
    if (n <= 0) return t.title;
  }
  return eligible[eligible.length - 1].title;
}

// Returns { first, last, title }. The caller joins first and last into the Name
// field; the TITLE IS KEPT SEPARATE and must never be appended to it -- Name is
// the KV sync key and the export filename, which is what _meta.titleIntegration
// warns about.
function generatorPickName(race, gender, clazz, level) {
  if (!NAMES_DB) return { first: '', last: '', title: '', error: 'Name tables are not loaded.' };
  const raceKey = (typeof getRaceKey === 'function') ? getRaceKey(race) : race;

  const firsts = generatorNamePool(NAMES_DB.firstNames, raceKey, gender);
  const lasts  = generatorNamePool(NAMES_DB.lastNames,  raceKey, null);
  const pick = arr => arr.length ? arr[Math.floor(Math.random() * arr.length)].name : '';

  return {
    first: pick(firsts),
    last:  pick(lasts),
    title: generatorPickTitle(raceKey, gender, clazz, level)
  };
}

// Assemble everything into a character record and open it.
//
// Builds the SAME shape collectSheet produces, so loadSheet restores it with no
// special casing: meta for identity, scores and hit points; details for the
// physical description. Anything omitted simply loads blank.
//
// Opens through openIntoCurrentOrNew -- the helper Import already uses. It
// replaces an untouched tab and opens a new one otherwise, so a character with
// data is never overwritten. Do not reimplement that test here.
function runCharacterGenerator(root) {
  const gv = sel => { const el = qs(root, sel); return el ? el.value : ''; };
  const level = Math.max(1, Math.min(20, parseInt(gv('.gen-level'), 10) || 1));

  const pair = resolveGeneratorRaceClass(gv('.gen-race'), gv('.gen-class'), root);
  if (pair.error) return { error: pair.error };

  const gender = (gv('.gen-gender') === 'random')
    ? (Math.random() < 0.5 ? 'male' : 'female')
    : gv('.gen-gender');

  // "Roll attributes" off means the DM will roll at the table and only wants the
  // identity generated. HIT POINTS GO WITH IT: there is no Constitution to apply,
  // and rolling Hit Dice with no CON bonus would look like a real number while
  // quietly being the wrong one. Legality is unchecked in this mode too -- the
  // sheet's own validators will flag it once scores are entered by hand.
  const rollBox = qs(root, '.gen-roll-attrs');
  const wantScores = rollBox ? rollBox.checked : true;

  let scores = null;
  if (wantScores) {
    scores = generatorRollScores(pair.race, pair.clazz, gv('.gen-roll-method'));
    if (scores.error) return { error: scores.error };
  }

  const physical = generatorPhysical(pair.race, gender);
  const hp = wantScores ? generatorHitPoints(pair.clazz, level, scores.adjusted.con) : null;
  const nm = generatorPickName(pair.race, gender, pair.clazz, level);

  // Alignment: an explicit choice wins, otherwise draw from the legal set for
  // the class rather than from all nine.
  let alignment = gv('.gen-alignment');
  if (!alignment || alignment === 'random') {
    const req = (typeof CLASS_ALIGNMENT_REQUIREMENTS === 'object')
      ? CLASS_ALIGNMENT_REQUIREMENTS[pair.clazz] : null;
    const pool = (req && req.allowed) ? req.allowed
               : (typeof PLAYER_ALIGNMENTS !== 'undefined' ? PLAYER_ALIGNMENTS : ['tn']);
    alignment = pool[Math.floor(Math.random() * pool.length)];
  }

  const fullName = [nm.first, nm.last].filter(Boolean).join(' ') || 'Unnamed';

  // The FIELD is a comma-separated list -- a character collects titles from
  // different peoples over play, by hand. The GENERATOR never merges into it:
  // generation always produces a new character (openIntoCurrentOrNew replaces a
  // pristine tab or opens a new one, and never overwrites a populated sheet), so
  // reading the current sheet's title here would leak one character's honorifics
  // onto an unrelated one.
  const titleField = nm.title || '';

  const data = {
    meta: {
      name: fullName,
      title: titleField,
      // Title-cased for display only, per hyphenated part so "half-elf" becomes
      // "Half-Elf". The lowercase key is what every table matches on, so the
      // conversion happens HERE, at the boundary, and pair.race/pair.clazz stay
      // lowercase for the lookups above. Both fields are free-text inputs, so an
      // unrecognised value cannot silently blank them the way a <select> would;
      // getRaceKey normalises case on the way back in regardless.
      race: pair.race.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-'),
      // The sheet's <select> options are "Male" and "Female", CAPITALISED, while
      // core_names.json uses lowercase and the pools match on that. Setting a
      // <select> to a value with no matching option fails SILENTLY and leaves it
      // blank -- the same defect loadSheet documents for kit and campaign
      // setting. Convert here, at the boundary, and keep the lowercase value
      // internally for the name and title lookups.
      gender: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '',
      clazz: pair.clazz.charAt(0).toUpperCase() + pair.clazz.slice(1),
      level: String(level),
      kit: gv('.gen-kit') || '',
      alignment: alignment,
      char_type: 'single',
      hp: hp ? String(hp.hp) : '',
      // TABLE 8 IS ALREADY APPLIED. The sheet stores final scores; its own
      // validators back the adjustment out again to test Table 7.
      str: scores ? String(scores.adjusted.str) : '',
      dex: scores ? String(scores.adjusted.dex) : '',
      con: scores ? String(scores.adjusted.con) : '',
      int: scores ? String(scores.adjusted.int) : '',
      wis: scores ? String(scores.adjusted.wis) : '',
      cha: scores ? String(scores.adjusted.cha) : ''
    },
    details: {
      height: physical.height ? String(physical.height) : '',
      weight: physical.weight ? String(physical.weight) : '',
      age:    physical.age    ? String(physical.age)    : ''
    }
  };

  openIntoCurrentOrNew(fullName, data);

  return {
    name: fullName,
    title: nm.title,
    race: pair.race,
    clazz: pair.clazz,
    level: level,
    gender: gender,
    alignment: alignment,
    attempts: scores ? scores.attempts : 0,
    hp: hp ? hp.hp : null
  };
}

// ===== KV Sync — config helpers =====
// KV settings are stored separately from character data so they persist
// independently of character saves and exports.
//
// GET-OR-CREATE: kvToken is the one field that can NEVER come back empty. Both
// exits fill it — the try block generates one when absent, and the catch returns
// a fresh object that already has one. So `if (!cfg.kvToken)` after a call here
// can never fire. Three such guards were removed rather than repaired; each one
// asserted that a missing token was a case that occurs, which is a small lie to
// the next reader. workerUrl is the real guard, and it stands alone.
//
// This is also why import does not adopt a token out of an exported file: the
// old "adopt if we have none" branch was unreachable for the same reason. See
// the import handler.
function getKvConfig() {
  try {
    const raw = localStorage.getItem(KV_CONFIG_KEY);
    const cfg = raw ? JSON.parse(raw) : {};
    if (!cfg.kvToken)    cfg.kvToken    = generateSyncToken();
    if (!cfg.kvEnabled)  cfg.kvEnabled  = false;
    if (!cfg.workerUrl)  cfg.workerUrl  = '';
    if (!cfg.kvLastPush) cfg.kvLastPush = 0;
    if (!cfg.kvLastPull) cfg.kvLastPull = 0;
    return cfg;
  } catch(e) {
    return { kvToken: generateSyncToken(), kvEnabled: false, workerUrl: '', kvLastPush: 0, kvLastPull: 0 };
  }
}
function saveKvConfig(cfg) {
  localStorage.setItem(KV_CONFIG_KEY, JSON.stringify(cfg));
}

const tabBar = $('tab-bar');
const tabContents = $('tab-contents');
let tabCounter = 1;

/* === NEW: Vertical tab wiring === */
function bindVerticalTabs(root){
  const tabs = root.querySelectorAll('.vtab');
  const panels = root.querySelectorAll('.vtab-content');
  tabs.forEach(tab=>{
    tab.onclick = ()=>{
      const target = tab.dataset.vtab;
      tabs.forEach(t=>t.classList.toggle('active', t===tab));
      panels.forEach(p=>p.classList.toggle('active', p.dataset.vtab === target));
      
      // Auto-expand textareas when tab becomes visible
      setTimeout(() => {
        const activePanel = root.querySelector(`.vtab-content[data-vtab="${target}"]`);
        if (activePanel) {
          activePanel.querySelectorAll('textarea').forEach(ta => autoExpand(ta));
        }
      }, 50);
    };
  });
}

// The tab that owns a given sheet. The inverse of the root lookup below, and
// the reverse of the walk closeTab already does with root.closest('.tab-content').
// Correct for a background sheet, where .tab.active would give the wrong answer.
function getTabForRoot(root){
  const content = (root && root.closest) ? root.closest('.tab-content') : null;
  const id = content && content.dataset ? content.dataset.id : null;
  return id ? document.querySelector('.tab[data-id="' + id + '"]') : null;
}

function getActiveRoot(){
  const active = document.querySelector('.tab-content.active');
  return active ? active.querySelector('.sheet-container') : null;
}
function getRootForTab(tab){
  const id = tab.dataset.id;
  const content = document.querySelector('.tab-content[data-id="' + id + '"]');
  return content ? content.querySelector('.sheet-container') : null;
}
function setTabLabel(tab, text){
  const lab = tab.querySelector('.label');
  if(lab) lab.textContent = text;
  else tab.innerHTML = '<span class="label">' + text + '</span> <span class="close">×</span>';
}
function isSheetEmpty(root){
  if(!root) return true;
  const fields = [
    'name','player','race','clazz','alignment','xp','hp','ac','thac0',
    'str','dex','con','int','wis','cha',
    'save1','save2','save3','save4','save5','notes',
    'thief_pickpockets','thief_openlocks','thief_traps','thief_movesilently','thief_hide','thief_detectnoise','thief_climb','thief_readlang',
    'notes_powers','notes_hindrances','notes_classkit',
    'slots1','slots2','slots3','slots4','slots5','slots6','slots7','slots8','slots9',
    'used1','used2','used3','used4','used5','used6','used7','used8','used9',
    'magic-schools','magic-notes',
    'cp','sp','ep','gp','pp',
    'encumbrance_current','encumbrance_max'
  ];

  for(const f of fields){
    const el = root.querySelector('[data-field="' + f + '"]');
    if(el && (el.value||'').trim()!=='') return false;
  }
  if(root.querySelector('.weapon-profs-list .item') ||
     root.querySelector('.nwp-list .item') ||
     root.querySelector('.class-abilities-list .item') ||
     root.querySelector('.racial-abilities-list .item') ||
     root.querySelector('.kit-abilities-list .item') ||
     root.querySelector('.memspells-list .item') ||
     root.querySelector('.items-list .item') ||
     root.querySelector('.armor-list .item') ||
     root.querySelector('.weapons-list .item') ||
     root.querySelector('.magic-items-list .item')) return false;
  if(root._avatarData) return false;
  return true;
}

// ===== Save-key helpers (ensure autosave overwrites the last saved version) =====
function getTabSaveKey(tab){ return tab.dataset.saveKey || ''; }
function setTabSaveKey(tab, key){ tab.dataset.saveKey = key || ''; }

// ===== Autosave message helpers =====
const autosaveState = new Map(); // id -> {timer, remaining}

function showSidebarEditing(root, remaining){
  const sidebar = root.querySelector('.sidebar-message');
  if(!sidebar) return;
  const nm = (val(root,'name') || '').trim() || 'Unnamed';
  const countdown = remaining != null ? ' <span style="color:var(--muted)">(autosave in ' + remaining + 's)</span>' : '';
  sidebar.innerHTML = 'Currently editing: <span class="current-name">' + nm + '</span>' + countdown;
  sidebar.style.display = 'block';
}
function showSidebarAutosaved(root){
  const sidebar = root.querySelector('.sidebar-message');
  if(!sidebar) return;
  sidebar.innerHTML = '<span style="color:var(--accent-light)">Changes autosaved.</span>';
  sidebar.style.display = 'block';
}
function hideSidebarMessage(root){
  const sidebar = root.querySelector('.sidebar-message');
  if(sidebar) sidebar.style.display = 'none';
}
function stopAutosaveForTab(id){
  const st = autosaveState.get(id);
  if(st && st.timer) clearInterval(st.timer);
  autosaveState.delete(id);
}
function startAutosaveForTab(tab, root){
  const id = tab.dataset.id;
  stopAutosaveForTab(id);
  const st = { remaining: AUTOSAVE_INTERVAL, timer: null };
  autosaveState.set(id, st);
  showSidebarEditing(root, st.remaining);
  st.timer = setInterval(()=>{
    // If no longer unsaved (manual save), stop timer
    if(!tab.classList.contains('unsaved')){
      stopAutosaveForTab(id);
      return;
    }
    st.remaining -= 1;
    if(st.remaining <= 0){
      performAutosave(tab, root);
      // performAutosave clears unsaved & stops timer
    } else {
      showSidebarEditing(root, st.remaining);
    }
  }, 1000);
}
// ===== Mass-emptying guard (the silent-flatten failure, §0) =====
//
// collectSheet reads the DOM, so a list that failed to build reads as an empty
// list and the save replaces real data with nothing. The render-completion flag
// prevents the known cause; this catches the symptom whatever the cause.
//
// THE THRESHOLD IS THE WHOLE DESIGN. Deleting your last weapon is normal.
// Weapons, armor, ammunition, proficiencies and companions all emptying in ONE
// save is not. Two or more sections going non-empty to empty is the bar; one is
// always allowed. Too sensitive and it gets dismissed reflexively, which is
// worse than absent.
//
// Paths read off the real collectSheet return object, not from memory.
const FLATTEN_WATCHED_PATHS = [
  'weaponProficiencies', 'nonWeaponProficiencies', 'classAbilities',
  'racialAbilities', 'kitAbilities',
  'items', 'valuables', 'armor', 'weapons', 'ammunition', 'magicItems',
  'mounts', 'henchmen', 'hirelings', 'companions',
  'languages', 'weaponProfs', 'nwps', 'conditions',
  'selectedSpheres', 'selectedSchools',
  'magic.memorized', 'magic.spellbooks', 'magic.schools',
  'notesTab.sessionLog', 'notesTab.questJournal', 'notesTab.npcs',
  'notesTab.locations', 'notesTab.characterJournal'
];

// null means "not a collection here" -- absent on one side, or a legacy record
// that never had the key. Those are SKIPPED, which handles new characters,
// deletions and old saves for free.
function flattenSizeAt(record, path){
  let node = record;
  const parts = path.split('.');
  for (let i = 0; i < parts.length; i++){
    if (!node || typeof node !== 'object') return null;
    node = node[parts[i]];
  }
  if (Array.isArray(node)) return node.length;
  // selectedSpheres is an OBJECT keyed by sphere name, not an array. Measure
  // both shapes rather than assuming.
  if (node && typeof node === 'object') return Object.keys(node).length;
  return null;
}

function findFlattenedSections(prev, next){
  const emptied = [];
  FLATTEN_WATCHED_PATHS.forEach(p => {
    const a = flattenSizeAt(prev, p);
    const b = flattenSizeAt(next, p);
    if (a === null || b === null) return;
    if (a > 0 && b === 0) emptied.push(p);
  });
  return emptied;
}

// Remembered per character AND per set of emptied sections. Without this, a
// refusal would re-prompt on every autosave tick: performAutosave returns before
// stopAutosaveForTab, so the timer keeps running.
const _flattenDecisions = {};

function passesFlattenCheck(map, context){
  let prevMap;
  try { prevMap = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}'); }
  catch(_) { return true; }   // no readable previous state: nothing to compare

  const hits = [];
  Object.keys(map || {}).forEach(name => {
    const prev = prevMap[name];
    if (!prev || typeof prev !== 'object') return;   // new character
    const emptied = findFlattenedSections(prev, map[name]);
    if (emptied.length >= 2) hits.push({ name: name, emptied: emptied });
  });
  if (!hits.length) return true;

  const signature = hits.map(h => h.name + ':' + h.emptied.join(',')).join('|');
  if (_flattenDecisions[signature] === 'allow') return true;
  if (_flattenDecisions[signature] === 'block'){
    console.error('[flatten guard] Write refused again, same change.', hits);
    return false;
  }

  console.error('[flatten guard] Mass emptying detected' +
                (context ? ' (' + context + ')' : ''), hits);

  const detail = hits.map(h =>
    '  ' + h.name + ' — ' + h.emptied.length + ' sections: ' + h.emptied.join(', ')
  ).join('\n');

  // confirm, not alert: a hard block would trap anyone legitimately stripping a
  // character, with no way to save ever again. Default is to REFUSE.
  const proceed = confirm(
    'SAVE BLOCKED — this save would empty several sections at once.' +
    (context ? '\n\n(' + context + ')' : '') +
    '\n\n' + detail +
    '\n\nThis is what a failed render looks like: lists that did not build read ' +
    'as empty and overwrite your real data. Nothing has been lost yet, and your ' +
    'work is still on screen.' +
    '\n\nIf you did NOT just delete all of that yourself, click Cancel, then ' +
    'reload WITHOUT saving — the last good copy is still stored.' +
    '\n\nClick OK only if you meant to clear these sections.'
  );

  _flattenDecisions[signature] = proceed ? 'allow' : 'block';
  return proceed;
}

// Every write to the character map goes through here. localStorage throws
// QuotaExceededError when the origin's ~5MB budget is full, and an uncaught
// throw skips whatever follows -- which in saveAsDialog meant no "Saved" alert
// AND no error, a failed save indistinguishable from a successful one.
//
// The quota is per ORIGIN, not per app. Everything on badbox29.github.io shares
// it, so gsheets can be well under 5MB and still fail because another tool has
// grown. That is worth saying out loud; it is not guessable from the failure.
//
// Returns true on success, false on failure. Callers that show their own
// confirmation should check it before claiming anything was saved.
function writeCharacterMap(map, context){
  // The mass-emptying check runs BEFORE the write, at the single chokepoint all
  // six call sites funnel through -- including 'KV pull merge', the path that
  // propagated the flattened copy to other devices in the original incident.
  if (!passesFlattenCheck(map, context)) return false;

  try {
    localStorage.setItem(CHAR_MAP_KEY, JSON.stringify(map));
    return true;
  } catch(err) {
    console.error('Character map write failed' + (context ? ' (' + context + ')' : ''), err);

    const quota = err && (err.name === 'QuotaExceededError' ||
                          err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                          err.code === 22);

    let used = 0;
    try {
      Object.keys(localStorage).forEach(k => { used += localStorage.getItem(k).length; });
    } catch(_) {}

    alert(
      (quota ? 'SAVE FAILED — browser storage is full.' : 'SAVE FAILED.') +
      (context ? '\n\n(' + context + ')' : '') +
      '\n\nYour work is still on screen and nothing has been lost, but it is NOT ' +
      'stored. Do not close this tab yet.' +
      (quota
        ? '\n\nStorage is shared by every site on this domain, not just this app, ' +
          'so freeing space elsewhere helps too. Currently using about ' +
          (used / 1024 / 1024).toFixed(1) + 'MB of roughly 5MB.' +
          '\n\nQuickest fixes: delete characters you no longer need, or use ' +
          'Adjust on large portraits to shrink them.'
        : '\n\nSee the browser console for details.')
    );
    return false;
  }
}
function performAutosave(tab, root){
  // REFUSE TO WRITE A SHEET THAT HAS NOT FINISHED RENDERING. collectSheet reads
  // the DOM, so a list that never built reads as an empty list, and the write
  // replaces real data with nothing -- silently, and then KV-syncs it to every
  // other device. The flag is set at the end of loadSheet and on the two blank
  // paths (newTab's else branch, and the default tab in the boot IIFE).
  //
  // Deliberately NOT an alert: this fires during normal operation, in the gap
  // between a tab being built and its data loading. Skipping the write is
  // correct and the next autosave picks it up. The console line is for
  // diagnosis if it ever fires repeatedly, which would mean a builder is
  // throwing and the flag is never being set.
  if (!root._renderComplete) {
    console.warn('[autosave] Skipped: sheet has not finished rendering.');
    return;
  }

  const data = collectSheet(root);
  const currentTypedName = (data.meta.name && data.meta.name.trim()) || 'Unnamed';

  // Overwrite last saved slot (stick to the last manual save/load key if present)
  const key = getTabSaveKey(tab) || currentTypedName;
  const map = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}');
  map[key] = data;
  if(!writeCharacterMap(map, 'autosave')) return;

  // Reflect current typed name in the tab label (visual), without changing save key
  setTabLabel(tab, currentTypedName);

  // Clear unsaved, stop timer, and show "autosaved" message
  tab.classList.remove('unsaved');
  stopAutosaveForTab(tab.dataset.id);
  showSidebarAutosaved(root);
  kvPushDebounced();
}

// Finds the correct sheet root element given any inside element (button, tab, etc.)
function resolveSheetRoot(fromEl) {
  // Try to resolve from the provided element
  if (fromEl && typeof fromEl.closest === 'function') {
    const inside = fromEl.closest('.sheet-root, .sheet, .sheet-container');
    if (inside) return inside;

    // If we were given a child element, find its owning tab first
    const tab = fromEl.closest('.vtab, .tab') ||
                document.querySelector('.vtab.active, .tab.active') ||
                document.querySelector('.vtab, .tab');
    if (tab) {
      const candidate = tab.querySelector('.sheet-root, .sheet, .sheet-container');
      if (candidate) return candidate;
    }
  }

  // Fallbacks if no element was provided or nothing matched above
  return document.querySelector('.sheet-root, .sheet, .sheet-container');
}


// Toggle unsaved state and manage sidebar + autosave
// Close any open info disclosure when the click lands outside it. A <details>
// normally only toggles from its own summary, which is fine for an inline
// panel but wrong for one that floats over the page like a popover.
// ONE document-level listener, guarded so opening several character tabs
// cannot stack duplicates.
if (!window._infoDisclosureBound) {
  window._infoDisclosureBound = true;
  document.addEventListener('click', (e) => {
    document.querySelectorAll('details.disclosure.info[open]').forEach(d => {
      // Clicking the summary of an already-open panel still lands INSIDE it,
      // so the browser's own toggle handles closing and this is a no-op --
      // otherwise the two would fight and it would never close.
      if (!d.contains(e.target)) d.open = false;
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('details.disclosure.info[open]').forEach(d => { d.open = false; });
  });
}

function markUnsaved(tab, unsaved, root){
  // If a non-tab element was passed (e.g., a button inside the sheet), try to resolve the tab from it
  if (tab && typeof tab.closest === 'function' && !tab.classList?.contains('tab')) {
    const maybe = tab.closest('.tab');
    if (maybe) tab = maybe;
  }

  // Fallbacks if we still don't have a tab element
  if (!tab || !tab.classList) {
    tab = document.querySelector('.tab.active') || document.querySelector('.tab');
  }

  // If there is still no tab, bail out gracefully instead of throwing
  if (!tab || !tab.classList) {
    console.warn('markUnsaved: no tab context available');
    return;
  }

  // Resolve root if missing
  // if (!root) root = getRootForTab(tab);
  if (!root) root = resolveSheetRoot(tab);


  // Toggle UI state
  tab.classList.toggle('unsaved', !!unsaved);

  if (unsaved) {
    // Always restart countdown on new edits
    startAutosaveForTab(tab, root);
  } else {
    hideSidebarMessage(root);
    stopAutosaveForTab(tab.dataset.id);
  }
}

// ===== Tabs & navigation =====
function setActiveTab(id){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.id===id));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.toggle('active', c.dataset.id===id));

  // Sync sidebar name for the now-active sheet
  const activeRoot = getActiveRoot();
  if(activeRoot){
    const nm = (val(activeRoot,'name') || '').trim();
    const currentNameEl = activeRoot.querySelector('.current-name');
    if(currentNameEl) currentNameEl.textContent = nm || 'Unnamed';

    const activeTab = document.querySelector('.tab[data-id="' + id + '"]');
    if(activeTab && activeTab.classList.contains('unsaved')){
      const st = autosaveState.get(id);
      if(st){ showSidebarEditing(activeRoot, st.remaining); }
      else { showSidebarEditing(activeRoot, AUTOSAVE_INTERVAL); }
    } else {
      // Hide message unless it’s the autosaved notice
      const msg = activeRoot.querySelector('.sidebar-message');
      if(msg && (msg.textContent.trim() === '' || msg.textContent.indexOf('Currently editing') !== -1)) {
        hideSidebarMessage(activeRoot);
      }
    }
  }
}

function newTab(name='Character', data=null){
  const id = 'tab' + Date.now() + Math.floor(Math.random()*1000);
  const tab = document.createElement('div');
  tab.className = 'tab'; tab.dataset.id = id;
  tab.innerHTML = '<span class="label">' + name + '</span> <span class="close">×</span>';
  tabBar.insertBefore(tab, $('add-tab'));

  const content = document.createElement('div');
  content.className = 'tab-content'; content.dataset.id = id;
  const container = document.createElement('div');
  container.className = 'grid sheet-container';
  container.innerHTML = SHEET_HTML;
  content.appendChild(container);
  tabContents.appendChild(content);

  bindSheet(container, tab);
  if(data){
    loadSheet(container, data);
    // Loaded data should be considered clean; set the save key to the provided name
    setTabSaveKey(tab, name || '');
    markUnsaved(tab, false, container);
  } else {
    // A BLANK character never passes through loadSheet, so nothing would ever
    // set its render flag and it could never autosave. Its lists are legitimately
    // empty rather than missing, so the sheet is complete as soon as SHEET_HTML
    // is in place and bound.
    container._renderComplete = true;
  }

  tab.querySelector('.close').onclick = ()=> closeTab(tab, content);
  tab.onclick = (e)=>{ if(!e.target.classList.contains('close')) setActiveTab(id); };

  setActiveTab(id);
  return id;
}

function closeTab(tab, content){
  const wasActive = tab.classList.contains('active');
  // Stop any autosave for this tab
  stopAutosaveForTab(tab.dataset.id);

  tab.remove(); content.remove();
  const tabs = document.querySelectorAll('.tab');
  if(!tabs.length){
    // No tabs left: make a fresh blank
    tabCounter = 1;
    const id = newTab('Character ' + tabCounter);
    setActiveTab(id);
    return;
  }
  if(wasActive){ setActiveTab(tabs[tabs.length-1].dataset.id); }
}

// ===== Sheet helpers =====
function qs(root, sel){ return root.querySelector(sel); }
function qsa(root, sel){ return Array.from(root.querySelectorAll(sel)); }
function val(root, field, v){
  const el = qs(root, '[data-field="' + field + '"]');
  if(!el) return '';
  if(v===undefined) return el.value||'';
  el.value=v;
}

function getSaveCategory(clazz) {
  clazz = (clazz || "").toLowerCase();
  return CLASS_CATEGORIES[clazz] || null; 
}

function getSavingThrows(clazz, level) {
  const cat = getSaveCategory(clazz);
  if (!cat) return [null,null,null,null,null];
  const table = SAVES[cat];
  // Find the highest row where level >= row.level
  let row = table[0];
  for (let r of table) {
    if (level >= r.level) row = r;
  }
  return row.saves;
}

function renderSavingThrows(root) {
  const clazz = val(root, "clazz");
  const level = parseInt(val(root, "level") || 1, 10);
  const charType = (val(root, "char_type") || "single").toLowerCase();
  
  let saves;
  let baseSaves;
  
  // Check if multi-class character
  if (charType === 'multi') {
    const class1 = val(root, 'mc_class1') || '';
    const class2 = val(root, 'mc_class2') || '';
    const class3 = val(root, 'mc_class3') || '';
    const level1 = parseInt(val(root, 'mc_level1') || 1, 10);
    const level2 = parseInt(val(root, 'mc_level2') || 1, 10);
    const level3 = parseInt(val(root, 'mc_level3') || 0, 10);
    
    const classData = [];
    if (class1) classData.push({ clazz: class1, level: level1 });
    if (class2) classData.push({ clazz: class2, level: level2 });
    if (class3) classData.push({ clazz: class3, level: level3 });
    
    // Use best saves from all classes
    const savesResult = getBestSaves(classData);
    saves = savesResult.saves.slice();
    baseSaves = saves.slice();
    
    // Store source info for tooltips
    root._multiClassSaveSources = savesResult.sources;
  } else if (charType === 'dual') {
    const originalClass = val(root, 'dc_original_class') || '';
    const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
    const newClass = val(root, 'dc_new_class') || '';
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
	const isDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (newLevel <= originalLevel);
    
    if (isDormant) {
      // Dormant: Use ONLY new class
      saves = getSavingThrows(newClass, newLevel).slice();
      baseSaves = saves.slice();
      
      // Create simple source info
      const newClassName = newClass.charAt(0).toUpperCase() + newClass.slice(1);
      root._dualClassSaveSources = Array(5).fill(`${newClassName} ${newLevel} (Dormant)`);
    } else {
      // Active: Use BEST of both
      const classData = [];
      if (originalClass) classData.push({ clazz: originalClass, level: originalLevel });
      if (newClass) classData.push({ clazz: newClass, level: newLevel });
      
      const savesResult = getBestSaves(classData);
      saves = savesResult.saves.slice();
      baseSaves = saves.slice();
      
      // Store source info with "Active" indicator
      root._dualClassSaveSources = savesResult.sources.map(src => `${src} (Active)`);
    }
  } else {
    // Single-class: use existing logic
    saves = getSavingThrows(clazz, level).slice();
    baseSaves = saves.slice();
  }

  // Ability scores
  const dex = parseInt(val(root, "dex") || 0, 10);
  const wis = parseInt(val(root, "wis") || 0, 10);
  const con = parseInt(val(root, "con") || 0, 10);
  const abilities = { dex, wis, con };

  // Race detection
  const raceRaw = (val(root, "race") || "").toLowerCase();
  let raceKey = null;
  if (/\bdwarf\b/.test(raceRaw)) raceKey = "dwarf";
  else if (/\bhalfling\b/.test(raceRaw)) raceKey = "halfling";
  else if (/\bgnome\b/.test(raceRaw)) raceKey = "gnome";
  else if (/\bhalf[-\s]?elf\b/.test(raceRaw)) raceKey = "halfelf";
  else if (/\belf\b/.test(raceRaw)) raceKey = "elf";

  // Kit detection
  const kitRaw = (val(root, "kit") || "").toLowerCase();
  let kitKey = null;
  Object.keys(KIT_SAVE_BONUSES).forEach(k => {
    if (kitRaw.includes(k)) kitKey = k;
  });

  // Collect adjustments
  let totalAdj = [0,0,0,0,0];
  let notes = [[],[],[],[],[]];

  // Abilities
  for (let ability in ABILITY_SAVE_BONUSES) {
    for (let saveIdx in ABILITY_SAVE_BONUSES[ability]) {
      const fn = ABILITY_SAVE_BONUSES[ability][saveIdx];
      const bonus = fn(abilities);
      if (bonus !== 0) {
        totalAdj[saveIdx] += bonus;
        notes[saveIdx].push(`${ability.toUpperCase()} ${bonus >= 0 ? "+" : ""}${bonus}`);
      }
    }
  }

  // Race
  if (raceKey && RACE_SAVE_BONUSES[raceKey]) {
    for (let saveIdx in RACE_SAVE_BONUSES[raceKey]) {
      const fn = RACE_SAVE_BONUSES[raceKey][saveIdx];
      const bonus = fn(abilities);
      if (bonus !== 0) {
        totalAdj[saveIdx] += bonus;
        notes[saveIdx].push(`Race ${bonus >= 0 ? "+" : ""}${bonus}`);
      }
    }
  }

  // Kit
  if (kitKey && KIT_SAVE_BONUSES[kitKey]) {
    for (let saveIdx in KIT_SAVE_BONUSES[kitKey]) {
      const fn = KIT_SAVE_BONUSES[kitKey][saveIdx];
      const bonus = fn(abilities);
      if (bonus !== 0) {
        totalAdj[saveIdx] += bonus;
        notes[saveIdx].push(`Kit ${bonus >= 0 ? "+" : ""}${bonus}`);
      }
    }
  }

  // Class -- PHB Ch.3, Paladin: "A paladin receives a +2 bonus to all saving
  // throws." All five categories, every level. hasPaladinSaveBonus() excludes
  // hb_dpaladin and demipaladin on purpose; see the comment block in tables.js.
  let saveClassNames;
  if (charType === 'multi') {
    // Defensive only -- paladins are human-only and multi-classing is
    // demihuman-only, so no legal combination reaches this branch.
    saveClassNames = ['mc_class1', 'mc_class2', 'mc_class3'].map(f => val(root, f));
  } else if (charType === 'dual') {
    // A dormant class grants none of its abilities, so it grants no bonus.
    const dcDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (parseInt(val(root, 'dc_new_level') || 1, 10) <= parseInt(val(root, 'dc_original_level') || 0, 10));
    saveClassNames = dcDormant
      ? [val(root, 'dc_new_class')]
      : [val(root, 'dc_original_class'), val(root, 'dc_new_class')];
  } else {
    saveClassNames = [clazz];
  }

// PHBR1 p.110. Human high-quality plate mail, field plate and full plate --
  // NOT bronze plate -- is "made of fine steel, but instead of being lighter
  // than usual, it is built thicker in order to make it more resistant to
  // damage ... Also, it gives the wearer a +2 to saving throws vs. Rod, Staff,
  // or Wand and Breath Weapon attacks."
  //
  // THE ONLY EFFECT IN THE WHOLE SUBSYSTEM THAT REACHES THE CHARACTER'S OWN
  // SAVES. Everything else racial armour does is item saving throws (a DMG
  // chart, DM-side), weight, or the thieving table.
  //
  // APPLIED, not merely displayed, unlike renderMagicalArmorSaveNote above. That
  // note stays display-only because Chapter 10's bonus is SITUATIONAL -- it
  // applies against attacks the armour would physically turn, which is the DM's
  // call. This one is flat and unconditional while the armour is worn, so it
  // belongs in the number, like the paladin's +2 below.
  //
  // SIGN: saves are TARGET numbers where lower is better, so a +2 to the roll is
  // stored as -2. Same convention the paladin bonus uses.
  //
  // Indices 1 and 3 are Rod/Staff/Wand and Breath Weapon.
  Array.from(root.querySelectorAll('.armor-list .item')).forEach(item => {
    const eq = item.querySelector('.equipped');
    if (!eq || !eq.checked) return;
    const hqRace = (item.querySelector('.armor-hq-race') || {}).value || '';
    if (!hqRace || typeof getHighQualityArmor !== 'function') return;
    const hq = getHighQualityArmor(hqRace, (item.querySelector('.armor-type') || {}).value || '');
    if (!hq || !hq.wearerSaves) return;
    const nm = ((item.querySelector('.title') || {}).value || '').trim() || (hq.label + ' plate');
    if (hq.wearerSaves.rodStaffWand) {
      totalAdj[1] -= hq.wearerSaves.rodStaffWand;
      notes[1].push(nm + ' -' + hq.wearerSaves.rodStaffWand +
                    ' (+' + hq.wearerSaves.rodStaffWand + ' to roll)');
    }
    if (hq.wearerSaves.breathWeapon) {
      totalAdj[3] -= hq.wearerSaves.breathWeapon;
      notes[3].push(nm + ' -' + hq.wearerSaves.breathWeapon +
                    ' (+' + hq.wearerSaves.breathWeapon + ' to roll)');
    }
  });

  if (saveClassNames.some(c => hasPaladinSaveBonus(c))) {
    for (let i = 0; i < 5; i++) {
      totalAdj[i] += PALADIN_SAVE_BONUS;
      // Note text carries BOTH numbers on purpose. The stored delta is -2
      // because these adjust the target; the book's wording is +2 to the roll.
      // Showing only one of the two reads as a bug from whichever side you look.
      notes[i].push('Paladin -2 (+2 to roll)');
    }
  }

  // User mods
  for (let i=0; i<5; i++) {
    const modField = root.querySelector(`[data-field="savemod${i+1}"]`);
    if (modField && modField.value) {
      const bonus = parseInt(modField.value,10) || 0;
      if (bonus !== 0) {
        totalAdj[i] += bonus;
        notes[i].push(`Mod ${bonus >= 0 ? "+" : ""}${bonus}`);
      }
    }
  }

  // Apply adjustments
  for (let i=0; i<5; i++) {
    saves[i] += totalAdj[i];
  }

  // Labels
  const labels = [
    "Paralyzation/Poison/Death",
    "Rod/Staff/Wand",
    "Petrification/Polymorph",
    "Breath Weapon",
    "Spell"
  ];

  // Render
  ["save1","save2","save3","save4","save5"].forEach((f,i)=>{
    const el = root.querySelector('[data-field="'+f+'"]');
    if (!el) return;

    const base = baseSaves[i] ?? "";
    const adj  = saves[i] ?? "";

    // Default display
    el.value = (adj !== base) ? `${adj} (${base})` : `${adj}`;

    // Build tooltip
    let tip = `${labels[i]} Save\nFinal: ${adj}\nBase: ${base}`;
    if (notes[i].length) tip += `\nAdjustments: ${notes[i].join(", ")}`;

	// Add multi-class or dual-class source if applicable
    const charType = (val(root, "char_type") || "single").toLowerCase();
    if (charType === 'multi' && root._multiClassSaveSources && root._multiClassSaveSources[i]) {
      tip += `\nMulti-class: Best from ${root._multiClassSaveSources[i]}`;
    } else if (charType === 'dual' && root._dualClassSaveSources && root._dualClassSaveSources[i]) {
      tip += `\nDual-class: ${root._dualClassSaveSources[i]}`;
    }

    el.title = tip;
 });

  renderDexteritySaveNote(root);
  renderMagicalArmorSaveNote(root);
  renderWisdomSaveAdjustments(root);;
  renderWisdomPriestEffects(root); 
}

// PHB Chapter 10, Magical Armor: enchanted armor grants "some measure of
// protection against attacks that normal armors would not stop", the book's
// example being chain mail +1 improving a save against a dragon's fiery breath
// by 1.
//
// DISPLAY ONLY -- deliberately NOT added to save1-save5. The bonus is
// situational: it applies against attacks the armor would physically turn, and
// the book gives one example rather than a category list. Baking it into a
// printed target would overstate the character on every save where it does not
// apply -- the same reasoning that keeps circumstantial bonuses out of
// getNWPCheckTarget.
//
// Body armor only, the 'Armor' slot. Chapter 10's statement and its example are
// both about armor proper; shields, helms and cloaks are not covered by it, so
// they are not claimed here. Do not widen without a citation.
//
// This keys off the AC BONUS, not the Enchanted? tick, and that difference from
// the encumbrance code is deliberate. Encumbrance excludes any magical armor,
// so it must read the tick to see elven chain. Here the bonus IS the rule --
// the book ties the save improvement to the +N -- so armor enchanted to +0
// grants nothing to report.
function renderMagicalArmorSaveNote(root) {
  const noteEl = root.querySelector('.armor-save-note');
  if (!noteEl) return;

  const pieces = Array.from(root.querySelectorAll('.armor-list .item'))
    .filter(item => {
      const slot = (item.querySelector('.armor-slot') || {}).value || '';
      const eq   = item.querySelector('.equipped');
      const mag  = item.querySelector('.is-magical');
      const bon  = parseInt((item.querySelector('.ac-bonus') || {}).value, 10) || 0;
      return slot === 'Armor' && eq && eq.checked && mag && mag.checked && bon > 0;
    })
    .map(item => ({
      name: (((item.querySelector('.title') || {}).value) || 'Magical armor').trim(),
      bonus: parseInt((item.querySelector('.ac-bonus') || {}).value, 10) || 0
    }));

  if (!pieces.length) {
    noteEl.style.display = 'none';
    noteEl.innerHTML = '';
    return;
  }

  // Armor names are PLAYER-ENTERED and go into innerHTML -- must be escaped.
  const list = pieces.map(p => escapeHtml(p.name) + ' (+' + p.bonus + ')').join(', ');

  noteEl.innerHTML =
    '<strong>Magical armor may improve saving throws:</strong> ' + list + '. ' +
    'PHB Ch.10 gives enchanted armor protection against attacks ordinary armor ' +
    'would not stop -- its example is chain mail +1 improving a save against ' +
    'dragon breath by 1.' +
    '<br><span style="color:var(--muted);">Situational, so it is NOT included in ' +
    'the figures above. It applies only against attacks the armor would ' +
    'physically turn, which is your DM\'s call. Use the +/- box to apply it.</span>';
  noteEl.style.display = 'block';
}

// PHB Ch.1, Dexterity: "Defensive Adjustment applies to a character's saving
// throws (see Glossary) against attacks that can be dodged -- lightning bolts,
// boulders, etc. It also modifies the character's Armor Class."
//
// The Armor Class half has always been applied. The SAVING THROW half was not
// applied anywhere, and is the older omission of the two.
//
// DISPLAY ONLY, and deliberately not added to save1-save5, for exactly the
// reason the magical armor note is not: the criterion is FUNCTIONAL -- "can be
// dodged" -- and is not one of the five printed categories. A dodgeable attack
// can arrive as a breath weapon, a spell or a falling rock, and plenty of
// things in every one of those columns cannot be dodged at all. This is the
// same shape as the Ch.1 Wisdom scope resolution: state the criterion, let the
// DM apply it.
//
// SIGN: no conversion needed. Saves here are TARGET numbers where lower is
// better, and Table 2 prints the Defensive Adjustment negative for a good
// Dexterity -- so the printed figure already runs the right way when typed into
// the +/- box. Same agreement the paladin bonus has.
function renderDexteritySaveNote(root) {
  const noteEl = root.querySelector('.dex-save-note');
  if (!noteEl) return;

  const dexScore = parseInt(val(root, 'dex') || 0, 10);
  const dexRow = (typeof DEX_TABLE !== 'undefined' && DEX_TABLE[dexScore])
    ? DEX_TABLE[dexScore] : null;
  const adj = dexRow ? dexRow[2] : 0;

  // Nothing to say from Dexterity 7 to 14, where the adjustment is 0.
  if (!dexRow || !adj) {
    noteEl.style.display = 'none';
    noteEl.innerHTML = '';
    return;
  }

  // No player-entered text reaches innerHTML here -- every value is derived
  // from DEX_TABLE. If that ever changes, escape it.
  const shown = (adj > 0 ? '+' : '') + adj;
  noteEl.innerHTML =
    '<strong>Dexterity Defensive Adj. ' + shown +
    ' may apply to saving throws:</strong> ' +
    'PHB Ch.1 extends the Defensive Adjustment to saves against attacks that ' +
    'can be dodged, its examples being lightning bolts and boulders.' +
    '<br><span style="color:var(--muted);">Situational, so it is NOT included ' +
    'in the figures above. The test is whether the attack could be dodged, not ' +
    'which of the five categories it falls under, so it is your DM\'s call. ' +
    'Enter ' + shown + ' in the +/- box for the relevant save when it applies.' +
    '</span>';
  noteEl.style.display = 'block';
}

// === THAC0 rules (AD&D 2e) ===
// Resolved through getClassCategory rather than a hardcoded list. The old list
// tested only mage/wizard/illusionist/specialist, so SEVEN of the eight
// specialist schools -- abjurer, conjurer, diviner, enchanter, invoker,
// necromancer, transmuter -- matched nothing and fell through to the flat 20
// fallback. A 6th-level necromancer showed THAC0 20 where Table 20 gives 19.
//
// It was also order-dependent, because .includes() over an unordered list means
// the first line to match wins: "demipaladin" sat on the PRIEST line and got
// priest THAC0, and a "cleric/thief" would hit cleric before thief.
// getClassCategory does exact-match first, then longest-key-first substring, so
// homebrew and compound names resolve and "demipaladin" cannot be eaten by
// "paladin". CLASS_CATEGORIES' four values map directly onto THAC0_TABLES' keys.
// PHB Table 53 is printed for levels 1-20. Above that, Table 54 gives each
// group's Improvement Rate and the progression simply continues -- Warrior 1
// point per level, Rogue 1 per 2, Priest 2 per 3, Wizard 1 per 3.
//
// The old code clamped at 20, so a 25th-level fighter shared a 20th-level
// fighter's THAC0. That is not a printed ceiling; it is where the table stopped
// printing. THAC0 is allowed to go to 0 and negative -- a 21st-level warrior
// hits AC 0 on a 0, which is correct and reachable with any attack bonus.
const THAC0_IMPROVEMENT = {
  warrior: { points: 1, perLevels: 1 },
  rogue:   { points: 1, perLevels: 2 },
  priest:  { points: 2, perLevels: 3 },
  wizard:  { points: 1, perLevels: 3 }
};

function getThac0(clazz, level) {
  level = Math.max(parseInt(level, 10) || 1, 1);
  const cat = (typeof getClassCategory === 'function') ? getClassCategory(clazz) : null;
  const table = cat && THAC0_TABLES[cat];
  if (!table) return 20;                    // unrecognised class -> unmodified 20

  if (level <= table.length) return table[level - 1];

  // Extend past the printed table using Table 54's rate. Floor division on the
  // levels gained means a Rogue at 21 keeps 20th's value and improves at 22,
  // matching how the printed table steps rather than averaging across it.
  const rate = THAC0_IMPROVEMENT[cat];
  if (!rate) return table[table.length - 1];
  const gained = Math.floor((level - table.length) / rate.perLevels) * rate.points;
  return table[table.length - 1] - gained;
}

// Visible companion to the per-slot tooltips: explains why a priest's 6th- or
// 7th-level slots are blank. Computed independently of renderSpellSlots' four
// branches -- each of those returns early, so this is called at the top rather
// than threaded through all of them.
function renderWisGateNote(root) {
  const noteEl = root.querySelector('.wis-gate-note');
  if (!noteEl) return;
  const hide = () => { noteEl.style.display = 'none'; noteEl.innerHTML = ''; };
  if (typeof getPriestWisdomGateNotes !== 'function' ||
      typeof getClassCategory !== 'function') { hide(); return; }

  const wis = parseInt(val(root, 'wis') || 0, 10);
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  const isPriestClazz = c => c && getClassCategory(c) === 'priest';

  // Resolve the priest sub-class and the level it is at.
  let clazz = '', level = 0;
  if (charType === 'multi') {
    for (let i = 1; i <= 3; i++) {
      const c = val(root, 'mc_class' + i) || '';
      if (isPriestClazz(c)) { clazz = c; level = parseInt(val(root, 'mc_level' + i) || 0, 10); break; }
    }
  } else if (charType === 'dual') {
    const nc = val(root, 'dc_new_class') || '', nl = parseInt(val(root, 'dc_new_level') || 0, 10);
    const oc = val(root, 'dc_original_class') || '', ol = parseInt(val(root, 'dc_original_level') || 0, 10);
    if (isPriestClazz(nc)) { clazz = nc; level = nl; }
    else if (nl > ol && isPriestClazz(oc)) { clazz = oc; level = ol; }  // dormant original casts nothing
  } else {
    const c = val(root, 'clazz') || '';
    if (isPriestClazz(c)) { clazz = c; level = parseInt(val(root, 'level') || 0, 10); }
  }
  if (!clazz || !level) { hide(); return; }

  // RAW table row -- the gate notes need the ungated numbers to know whether
  // this character would have had slots at those levels at all.
  const table = (typeof getSpellTableForClass === 'function') ? getSpellTableForClass(clazz) : null;
  const raw = table && table[level];
  if (!raw) { hide(); return; }

  const gated = getPriestWisdomGateNotes(raw, wis);
  if (!gated.length) { hide(); return; }

  const items = gated
    .map(g => `<li>${g.level}th-level priest spells require Wisdom ${g.min}</li>`)
    .join('');
  noteEl.innerHTML =
    '<strong>Spell levels locked by Wisdom (PHB Table 24)</strong>' +
    '<ul style="margin:6px 0 0 18px;padding:0;">' + items + '</ul>' +
    '<div style="margin-top:6px;">Your Wisdom is ' + (wis || '\u2014') +
    '. These slots are not granted until it rises.</div>';
  noteEl.style.color = 'var(--warning, #e0a34a)';
  noteEl.style.display = '';
}

function renderSpellSlots(root) {
  renderWisGateNote(root);
  const clazz = (val(root,"clazz")||"").toLowerCase();
  const level = parseInt(val(root,"level")||0);
  const charType = (val(root, "char_type") || "single").toLowerCase();
  const wis = parseInt(val(root,"wis")||0);
  
  // Check if multi-class character
  if (charType === 'multi') {
    const class1 = val(root, 'mc_class1') || '';
    const class2 = val(root, 'mc_class2') || '';
    const class3 = val(root, 'mc_class3') || '';
    const level1 = parseInt(val(root, 'mc_level1') || 1, 10);
    const level2 = parseInt(val(root, 'mc_level2') || 1, 10);
    const level3 = parseInt(val(root, 'mc_level3') || 0, 10);
    
    const classData = [];
    if (class1) classData.push({ clazz: class1, level: level1 });
    if (class2) classData.push({ clazz: class2, level: level2 });
    if (class3) classData.push({ clazz: class3, level: level3 });
    
    // Combine spell slots from all caster classes
    const combined = combineSpellSlots(classData, wis);
    const slots = combined.slots;
    const sources = combined.sources;
    const details = combined.details;
    
    // Write combined slots to fields with detailed tooltips
    slots.forEach((n, i) => {
      const el = root.querySelector(`[data-field="slots${i+1}"]`);
      if (el) {
        el.value = n || "";
        if (n > 0 && details[i].length > 0) {
          el.title = `Level ${i+1} Spell Slots (Total: ${n})\n${details[i].join('\n')}`;
        } else {
          el.title = "";
        }
      }
    });
    
    return;
  }
  
  // Dual-class: check dormancy
  if (charType === 'dual') {
    const originalClass = val(root, 'dc_original_class') || '';
    const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
    const newClass = val(root, 'dc_new_class') || '';
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
    const isDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (newLevel <= originalLevel);
    
    if (isDormant) {
      // Dormant: Use ONLY new class spell slots
      const table = getSpellTableForClass(newClass);
      if (!table || !table[newLevel]) return;
      
      let slots = table[newLevel] ? [...table[newLevel]] : Array(9).fill(0);
      
      // Add wisdom bonus if new class is a priest
      const category = CLASS_CATEGORIES[normalizeClassName(newClass)];
      if (category === 'priest' && wis >= 13) {
        const bonus = WIS_BONUS_SPELLS[wis];
        if (bonus) {
          // PHB Table 5: bonus spells apply only at levels the priest can
          // already cast (see single-class path above).
          slots = slots.map((s, i) => s + (s > 0 ? bonus[i] : 0));
        }
      }

      // PHB Table 24: 6th-level priest spells require WIS 17+, 7th require 18+.
      if (category === 'priest' && typeof applyPriestWisdomGate === 'function') {
        slots = applyPriestWisdomGate(slots, wis);
      }
      
      // Write slots with dormant indicator
      slots.forEach((n, i) => {
        const el = root.querySelector(`[data-field="slots${i+1}"]`);
        if (el) {
          el.value = n || "";
          if (n > 0) {
            const className = newClass.charAt(0).toUpperCase() + newClass.slice(1);
            el.title = `${className} ${newLevel} (Dormant)`;
          } else {
            el.title = "";
          }
        }
      });
      
      return;
    } else {
      // Active: Combine spell slots from both classes (if both are casters)
      const classData = [];
      if (originalClass) classData.push({ clazz: originalClass, level: originalLevel });
      if (newClass) classData.push({ clazz: newClass, level: newLevel });
      
      const combined = combineSpellSlots(classData, wis);
      const slots = combined.slots;
      const details = combined.details;
      
      // Write combined slots with active indicator and per-class breakdown
      slots.forEach((n, i) => {
        const el = root.querySelector(`[data-field="slots${i+1}"]`);
        if (el) {
          el.value = n || "";
          if (n > 0 && details[i].length > 0) {
            el.title = `Level ${i+1} Spell Slots (Total: ${n}, Active)\n${details[i].join('\n')}`;
          } else {
            el.title = "";
          }
        }
        const bd = root.querySelector(`[data-field="slot_breakdown_${i+1}"]`);
        if (bd) {
          if (n > 0 && details[i].length > 1) {
            bd.textContent = details[i]
              .filter(d => !d.startsWith('Wisdom'))
              .map(d => d.replace(/^(\w+):\s*(\d+)$/, '$1: $2'))
              .join(' / ');
          } else {
            bd.textContent = '';
          }
        }
      });
      
      return;
    }
  }
  
  // Single-class: use existing logic
  if (!clazz || !level) return;

  // Match class
  let table = null;
  if (clazz.includes("cleric") || clazz.includes("priest")) table = SPELL_SLOTS_TABLES.cleric;
  else if (clazz.includes("druid")) table = SPELL_SLOTS_TABLES.druid;
  else if (clazz.includes("shaman")) table = SPELL_SLOTS_TABLES.cleric;
  else if (clazz.includes("hb_dpaladin")) table = SPELL_SLOTS_TABLES.hb_dpaladin;
  else if (clazz.includes("demipaladin")) table = SPELL_SLOTS_TABLES.demipaladin;
  else if (clazz.includes("paladin")) table = SPELL_SLOTS_TABLES.paladin;
  else if (clazz.includes("ranger")) table = SPELL_SLOTS_TABLES.ranger;
  else if (clazz.includes("mage") || clazz.includes("wizard") || 
           clazz.includes("abjurer") || clazz.includes("conjurer") || 
           clazz.includes("enchanter") || clazz.includes("invoker") || 
           clazz.includes("necromancer") || clazz.includes("transmuter") || 
           clazz.includes("diviner") || clazz.includes("evoker") ||
           clazz.includes("illusionist")) table = SPELL_SLOTS_TABLES.mage;
  else if (clazz.includes("bard")) table = SPELL_SLOTS_TABLES.bard;
  
  // Skip non-casters entirely
  if (!table) return;
  if (!table[level]) return; // Also check if the table has data for this level

  // Base slots
  let slots = table[level] ? [...table[level]] : Array(9).fill(0);

 // Grand Druid allotment (PHB Ch.3): from 15th level a druid "knows six spells
  // of each level, instead of the normal spell progression". Replaces the Table
  // 24 row entirely, BEFORE the Wisdom bonus and gate are applied on top.
  let druidAllotmentApplied = false;
  if (typeof applyGrandDruidAllotment === 'function') {
    const afterAllotment = applyGrandDruidAllotment(slots, clazz, level);
    if (afterAllotment !== slots) { slots = afterAllotment; druidAllotmentApplied = true; }
  }

  // Hard whitelist for Wisdom bonuses: cleric & druid only. The Grand Druid's
  // Table 5 bonus is a separate grant from Wisdom, not part of the "normal spell
  // progression" the allotment replaces, so it still stacks on top.
  let appliedBonus = null;
  if ((clazz.includes("cleric") || clazz.includes("druid")) && WIS_BONUS_SPELLS[wis]) {
    const bonus = WIS_BONUS_SPELLS[wis];
    // PHB Table 5: bonus spells are available "only when the priest is entitled
    // to spells of the appropriate level." Add the bonus only where the priest
    // already has at least one slot of that level from the class progression.
    slots = slots.map((s,i) => s + (s > 0 ? bonus[i] : 0));
    appliedBonus = bonus;
  }

  // Druid bonus spell-level pool (Grand Druid 6, archdruid 4). A pool spent as
  // whole spells, folded into the slot row. MUST precede the Wisdom gate so a
  // level spent on a 6th-level spell by a WIS 16 druid is zeroed like any other.
  let druidBonusAlloc = null;
  if (typeof getDruidRole === 'function' && isDruidClass(clazz)) {
    const role = getDruidRole(clazz, level, val(root, 'druid_role'));
    const pool = getDruidBonusPool(role);
    if (pool > 0) {
      const alloc = [];
      for (let i = 1; i <= 9; i++) alloc[i-1] = parseInt(val(root, 'druid_bonus_' + i) || 0, 10) || 0;
      if (typeof getDruidBonusSpent === 'function' && getDruidBonusSpent(alloc) > 0) {
        slots = applyDruidBonusSpells(slots, alloc);
        druidBonusAlloc = alloc;
      }
    }
  }

  // PHB Table 24 footnotes: 6th-level priest spells are usable only with WIS 17+
  // and 7th-level only with WIS 18+. Notes are gathered BEFORE gating, because
  // afterwards the counts are zero and there is nothing left to explain.
  // Keyed on the class GROUP, so it is a harmless no-op for paladins (4 spell
  // levels) and rangers (3), who can never reach the gated levels anyway.
  let wisGateNotes = [];
  if (typeof getClassCategory === 'function' && getClassCategory(clazz) === 'priest' &&
      typeof getPriestWisdomGateNotes === 'function') {
    wisGateNotes = getPriestWisdomGateNotes(slots, wis);
    if (wisGateNotes.length) slots = applyPriestWisdomGate(slots, wis);
  }

  // Specialist wizards gain one additional spell per spell level, which must be
  // taken in their own school (PHB Ch.3).
  const spec = applySpecialistBonus(slots, clazz);
  slots = spec.slots;
  const specSchool = spec.school;

  // Write to fields with tooltip if a bonus was actually applied
  slots.forEach((n,i) => {
    const el = root.querySelector(`[data-field="slots${i+1}"]`);
    if (el) {
      el.value = n || "";

      const notes = [];
      if (appliedBonus && appliedBonus[i] > 0) {
        notes.push(`Includes Wis bonus (+${appliedBonus[i]})`);
      }
      if (specSchool && n > 0) {
        notes.push(`Includes +1 specialist slot -- must be a ${specSchool} spell`);
      }
      const gated = wisGateNotes.find(g => g.level === i + 1);
      if (gated) {
        notes.push(`Locked: ${gated.level}th-level priest spells require Wisdom ${gated.min} (PHB Table 24). You have ${wis || '\u2014'}.`);
      }
      el.title = notes.join('\n');
    }
  });
}

function renderAttackMatrix(root) {
  const clazz = val(root, "clazz");
  const level = parseInt(val(root, "level") || 1, 10);
  const charType = (val(root, "char_type") || "single").toLowerCase();

  // Canonical 2E matrix width (columns: -10 .. +10)
  const AC_MIN = -10;
  const AC_MAX = 10;

  // PHB Ch.9, "Impossible To-Hit Numbers": "An attack may be so difficult it
  // requires a roll greater than 20, or so ridiculously easy it can be made on a
  // roll less than 1. In both cases, an attack roll is still required!" And:
  // "a roll of 20 is always considered a hit and a roll of 1 is always a miss."
  //
  // So BOTH ends of the table are real states with real rules, not errors to be
  // clamped away -- and a cell reading "1" was a lie, because a natural 1 never
  // hits no matter what the target is.
  //
  // '*'   = hits on anything but a natural 1  (target 1 or lower)
  // '20*' = needs a natural 20                (target above 20)
  //
  // The raw arithmetic is kept separate from the display: the base THAC0 stays
  // negative because the whole matrix is computed FROM it. Flooring THAC0 at 1
  // to make the AC 0 column agree would break AC -10, turning a correct 6 into
  // an 11 -- tidying the trivial end of the table by breaking the useful end.
  const clampD20 = n => Math.max(1, Math.min(20, n));
  // Plain ASCII asterisk to match print.js, where U+2217 renders as a missing
  // glyph. Screen and printout showing different symbols for the same rule is
  // worse than either symbol being slightly less pretty.
  const displayD20 = n => (n <= 1 ? '*' : (n > 20 ? '20*' : String(n)));

  // --- Determine base THAC0 (handles single / multi / dual) ---
  let thac0Base;

  if (charType === 'multi') {
    const class1 = val(root, 'mc_class1') || '';
    const class2 = val(root, 'mc_class2') || '';
    const class3 = val(root, 'mc_class3') || '';
    const level1 = parseInt(val(root, 'mc_level1') || 1, 10);
    const level2 = parseInt(val(root, 'mc_level2') || 1, 10);
    const level3 = parseInt(val(root, 'mc_level3') || 0, 10);

    const classData = [];
    if (class1) classData.push({ clazz: class1, level: level1 });
    if (class2) classData.push({ clazz: class2, level: level2 });
    if (class3) classData.push({ clazz: class3, level: level3 });

    const thac0Result = getBestTHAC0(classData);
    thac0Base = thac0Result && typeof thac0Result.thac0 === 'number' ? thac0Result.thac0 : undefined;
    root._multiClassTHAC0Source = thac0Result && thac0Result.source ? thac0Result.source : '';
  } else if (charType === 'dual') {
    const originalClass = val(root, 'dc_original_class') || '';
    const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
    const newClass = val(root, 'dc_new_class') || '';
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
    const isDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (newLevel <= originalLevel);

    if (isDormant) {
      thac0Base = getThac0(newClass, newLevel);
      root._dualClassTHAC0Source = `${newClass ? (newClass[0].toUpperCase() + newClass.slice(1)) : 'Unknown'} ${newLevel} (Dormant)`;
    } else {
      const classData = [];
      if (originalClass) classData.push({ clazz: originalClass, level: originalLevel });
      if (newClass) classData.push({ clazz: newClass, level: newLevel });

      const thac0Result = getBestTHAC0(classData);
      thac0Base = thac0Result && typeof thac0Result.thac0 === 'number' ? thac0Result.thac0 : undefined;
      root._dualClassTHAC0Source = thac0Result && thac0Result.source ? `Best from ${thac0Result.source} (Active)` : '';
    }
  } else {
    // Single-class
    thac0Base = getThac0(clazz, level);
  }

  // Fallback to a sane default if tables failed to return something
  if (typeof thac0Base !== 'number' || Number.isNaN(thac0Base)) thac0Base = 20;

 // --- Ability adjustments for melee/missile THAC0s ---
  const str = parseInt(val(root, "str") || 0, 10);
  const dex = parseInt(val(root, "dex") || 0, 10);
  const strExceptional = val(root, "str_exceptional") || "";

  // Shared helper handles exceptional 18/xx (warriors only). Index 0 = melee to-hit adj.
  // Reuses `clazz`, already declared at the top of renderAttackMatrix().
  let strToHit = 0;
  const strData = getStrengthData(str, strExceptional, clazz);
  if (strData) strToHit = strData[0];

  // DEX_TABLE[dex][1] = missile to-hit adj
  let dexToHit = 0;
  const dexData = (typeof DEX_TABLE !== "undefined" && DEX_TABLE[dex]) ? DEX_TABLE[dex] : null;
  if (dexData) dexToHit = dexData[1];

  const thac0Melee   = thac0Base - strToHit;
  const thac0Missile = thac0Base - dexToHit;

  // Stashed for the Combat Quick Reference and print.js. Both used to recompute
  // THAC0 themselves from val(root,'clazz'), which for multi- and dual-class
  // characters is a DISPLAY string ("Cleric 7/Fighter 9") -- getClassCategory
  // substring-matched it to a category that belonged to neither class, then
  // crossed that with whatever the hidden `level` field held. Only this function
  // resolves THAC0 correctly (getBestTHAC0 for multi, dormancy for dual), so it
  // is now the only place that resolves it at all.
  root._thac0 = {
    base:    thac0Base,
    melee:   thac0Melee,
    missile: thac0Missile,
    strAdj:  strToHit,
    dexAdj:  dexToHit
  };

  // --- Base THAC0 display summary ---
  const baseBox = root.querySelector(".base-thac0");
  if (baseBox) {
    let thac0Tooltip = 'Unmodified';
    if (charType === 'multi' && root._multiClassTHAC0Source) {
      thac0Tooltip = `Best THAC0 from ${root._multiClassTHAC0Source}`;
    } else if (charType === 'dual' && root._dualClassTHAC0Source) {
      thac0Tooltip = root._dualClassTHAC0Source;
    }

    baseBox.innerHTML = `
      Base THAC0: <span title="${thac0Tooltip}">${thac0Base}</span> |
      Melee: <span title="Base ${thac0Base}, STR to-hit ${strToHit >= 0 ? '+' : ''}${strToHit}">${thac0Melee}</span> |
      Missile: <span title="Base ${thac0Base}, DEX to-hit ${dexToHit >= 0 ? '+' : ''}${dexToHit}">${thac0Missile}</span>
    `;
  }

  // --- Attack matrix table (AC -10 .. +10) ---
  const container = root.querySelector(".attack-matrix");
  if (!container) return;

  // Three rows: AC / Melee / Missile. The rows now show what the player actually
  // needs to ROLL, with the unmodified base THAC0 moved into the hover tooltip.
  const strSign = (strToHit >= 0 ? "+" : "") + strToHit;
  const dexSign = (dexToHit >= 0 ? "+" : "") + dexToHit;

  // Header row
  let html = "<table class='attack-matrix-table'><tr><th>AC</th>";
  for (let ac = AC_MIN; ac <= AC_MAX; ac++) {
    html += `<th>${ac}</th>`;
  }
  html += "</tr>";

  // Build a data row for one attack mode.
  const buildRow = (label, thac0Mode, adjLabel, adjSign) => {
    let row = `<tr><th title="THAC0 ${thac0Mode} (base ${thac0Base}, ${adjLabel} ${adjSign})">${label}</th>`;
    for (let ac = AC_MIN; ac <= AC_MAX; ac++) {
      const rawBase = thac0Base  - ac;
      const rawMode = thac0Mode  - ac;
      const needed  = displayD20(rawMode);

      // The tooltip carries the RAW number as well as the symbol. A player who
      // sees '*' should still be able to find out that his true to-hit number
      // against AC 0 is -4, which is the same figure the gold header shows.
      const explain = rawMode <= 1
        ? `Hits on anything but a natural 1 (true number ${rawMode})`
        : (rawMode > 20
            ? `Needs a natural 20 (true number ${rawMode})`
            : `Need to roll: ${rawMode}`);

      const tooltip = `AC ${ac} — ${label}
${explain}
THAC0 ${thac0Mode} (base ${thac0Base}, ${adjLabel} ${adjSign})
Unmodified: ${displayD20(rawBase)} (raw ${rawBase})`;

      row += `<td title="${tooltip}">${needed}</td>`;
    }
    return row + "</tr>";
  };

  html += buildRow("Melee",   thac0Melee,   "STR to-hit", strSign);
  html += buildRow("Missile", thac0Missile, "DEX missile", dexSign);

  html += "</table>";
  container.innerHTML = html;
}

// Auto-expand textareas
function autoExpand(el) {
  el.style.height = "auto"; // reset
  const min = parseInt(window.getComputedStyle(el).minHeight, 10) || 0;
  el.style.height = Math.max(el.scrollHeight, min) + "px";
}

/* === list item factories === */
function makeProfNode(data={}, onChange){
  const el=document.createElement('div');
  el.className='item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  el.innerHTML=
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Proficiency</div>' +
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes val" placeholder="" value="'+escapeHtml(data.notes||'')+'" style="width:100%">' +
    '</div>';
  
  el.querySelector('.rm').onclick=()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,textarea').forEach(inp=>
    inp.addEventListener('input',()=>onChange && onChange())
  );
  return el;
}

function makeWeaponProfNode(data={}, onChange){
  const el=document.createElement('div');
  el.className='item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  el.innerHTML=
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Weapon</div>' +
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes val" placeholder="" value="'+escapeHtml(data.notes||'')+'" style="width:100%">' +
    '</div>';
  
  el.querySelector('.rm').onclick=()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,textarea').forEach(inp=>
    inp.addEventListener('input',()=>onChange && onChange())
  );
  return el;
}
function makeAbilityNode(data={}, onChange){
  const el=document.createElement('div');
  el.className='item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  if (data.isAuto) {
    el.dataset.autoGenerated = 'true';
  }
  
  el.innerHTML=
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Ability</div>' +
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      // TEXTAREA, not input. Kit ability notes are transcribed book prose and
      // routinely run to several hundred characters -- the Berserker's Going
      // Berserk card is over a thousand -- so a one-line input made every one of
      // them a horizontal scroll. The value goes BETWEEN the tags here, not in a
      // value attribute.
      '<textarea class="notes val" placeholder="" rows="1" ' +
        'style="width:100%;resize:vertical;overflow:hidden;">' +
        escapeHtml(data.notes||'') +
      '</textarea>' +
    '</div>';
  
  el.querySelector('.rm').onclick=()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,textarea').forEach(inp=>{
    inp.addEventListener('input',()=>{
      onChange && onChange();
    });
  });

  // Grow to fit on load and on every edit. autoExpand needs the element to be
  // laid out to measure scrollHeight, and this node is built BEFORE it is
  // appended, so the initial call is deferred a tick. The two existing sweeps
  // (on tab switch and after load) will re-fit anything that was hidden at the
  // time, which is what makes a card on an inactive tab come out right.
  const notesEl = el.querySelector('.notes');
  if (notesEl && typeof autoExpand === 'function') {
    notesEl.addEventListener('input', () => autoExpand(notesEl));
    setTimeout(() => autoExpand(notesEl), 0);
  }
  return el;
}
function makeSpellNode(data={}, onChange){
  const el=document.createElement('div');
  el.className='item';
  el.innerHTML=
    '<input class="title" placeholder="Spell" value="'+escapeHtml(data.name||'')+'">' +
    '<input class="val" placeholder="Level" value="'+escapeHtml(data.level||'')+'">' +
    '<button class="rm">Remove</button>';
  el.querySelector('.rm').onclick=()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,textarea').forEach(inp=>
    inp.addEventListener('input',()=>onChange && onChange())
  );
  return el;
}
// A memorized spell is in exactly one of three states.
//
// PHB Ch.7 separates a spell deliberately CAST from one LOST to a broken
// casting: if the caster is struck by a weapon or fails a saving throw before
// the spell goes off, his concentration is disrupted and the spell is lost from
// memory. Both leave the slot spent and both must be re-studied at 10 minutes
// per level -- but they are not the same event, and collapsing them meant a
// disrupted spell had to be marked Cast, which made the study-time readout
// describe something that never happened.
//
// The states are mutually exclusive. A spell cannot be both: disruption happens
// INSTEAD of the casting, not after it, which is why each button disables the
// other rather than letting the two stack.
function getMemSpellState(el) {
  if (el.classList.contains('spell-lost')) return 'lost';
  if (el.classList.contains('spell-cast')) return 'cast';
  return 'available';
}

function setMemSpellState(el, state) {
  const castBtn = el.querySelector('.cast-spell');
  const lostBtn = el.querySelector('.lose-spell');

  // TWO SETS OF CLASS NAMES, deliberately. getMemSpellState reads
  // spell-cast/spell-lost and other callers may too, so those stay; the plain
  // cast/lost pair is what the stylesheet hooks. Renaming one without the other
  // is the kind of silent breakage that is hard to trace later.
  el.classList.remove('spell-cast', 'spell-lost', 'cast', 'lost');
  if (state === 'cast') el.classList.add('spell-cast', 'cast');
  if (state === 'lost') el.classList.add('spell-lost', 'lost');

  // The row-wide opacity and the inline strike-through are GONE: the stylesheet
  // strikes the name and dims the row from those classes. Dimming the whole row
  // in JS also dimmed the buttons, which have to stay legible to be pressed.
  el.style.opacity = '';
  const nameEl = el.querySelector('.spell-name, .title, .name');
  if (nameEl) nameEl.style.textDecoration = '';

  // Colours moved to TOKENS in style.css. The hardcoded rgba here could not
  // survive the theme switcher -- it would stay dark-mode blue on a light card.
  // Green now means AVAILABLE rather than cast, and lost is amber rather than
  // red: green-vs-red is the pair one man in twelve cannot separate, and it was
  // the pair that mattered most -- castable now versus gone.
  if (castBtn) {
    const on = (state === 'cast');
    castBtn.textContent = on ? 'Uncast' : 'Cast';
    castBtn.classList.toggle('on', on);
    castBtn.disabled = (state === 'lost');
  }

  if (lostBtn) {
    const on = (state === 'lost');
    lostBtn.textContent = on ? 'Restore' : 'Lost';
    lostBtn.classList.toggle('on', on);
    lostBtn.disabled = (state === 'cast');
  }
}

function makeMemSpellNode(data={}, onChange){
  const el = document.createElement('div');
  // 'gear' brings the shared card shell -- grid, rail, row1/row2, spacer --
  // and 'spell' adds what only spells need. The inline styles are removed
  // rather than left dead: an inline style beats the stylesheet, so
  // alignItems:stretch would override the grid's align-items:center.
  el.className = 'item gear spell';
  
  el.innerHTML =
    // Rail carries STATE here -- green available, grey cast, amber lost. Own-
    // school gold is deliberately NOT applied in this list: it would silently
    // override state on every spell of a specialist's own school, which for an
    // invoker is most of the list.
    '<div class="rail"></div>' +
    '<div class="row1">' +
      // Level is readonly -- inherited from the spellbook entry, never typed --
      // so it renders as a rank rather than a field inviting an edit that does
      // nothing. The input is kept so collectSheet still finds .level.
      '<span class="lvl">'+escapeHtml(data.level||'')+'</span>' +
      '<input class="level" type="hidden" value="'+escapeHtml(data.level||'')+'">' +
      '<span class="school">'+escapeHtml((data.schoolSphere||'').toUpperCase())+'</span>' +
      '<span class="meta" style="font-size:11px;color:var(--muted);">'+
        escapeHtml(data.castTime||'')+(data.range?' &middot; '+escapeHtml(data.range):'')+'</span>' +
      '<div class="spacer"></div>' +
      '<div class="btns">' +
        '<button class="toggle-spell-details act-details">Details</button>' +
        '<button class="cast-spell act-cast">Cast</button>' +
        '<button class="lose-spell act-lost" title="PHB Ch.7: struck by a weapon or failing a saving throw before the spell goes off breaks concentration and the spell is lost from memory.&#10;&#10;The slot is spent and the spell must be re-studied, but it was never actually cast.">Lost</button>' +
        '<button class="rm act-forget">Forget</button>' +
      '</div>' +
    '</div>' +
    '<div class="row2">' +
      '<input class="title spell-name" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:0 0 auto;min-width:0;">' +
      // Quiet at rest, gold when set: normal is what nearly every spell is, and
      // reversed CHANGES WHAT THE SPELL DOES.
      '<button type="button" class="revchip" aria-pressed="false" title="PHB Ch.7: a reversible spell must be memorized in the form you intend to cast.&#10;A priest petitions for the reversed version when praying; a wizard chooses at memorization.&#10;The reversed spell is named in the description -- the sheet does not rename it for you.">Normal</button>' +
    '</div>' +
    '<div class="spell-details" style="display:none;margin-top:8px;">' +
      // Reference figures, read from the spell data. The Form select is kept as
      // a HIDDEN input: collectSheet reads .spell-form, and the chip above is
      // now the control. Removing it would drop the field from save and load.
      '<select class="spell-form" style="display:none;">' +
        '<option value="normal"'+(data.form === 'reversed' ? '' : ' selected')+'>Normal</option>' +
        '<option value="reversed"'+(data.form === 'reversed' ? ' selected' : '')+'>Reversed</option>' +
      '</select>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">School/Sphere</label>' +
          '<input class="school-sphere" placeholder="" value="'+escapeHtml(data.schoolSphere||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Casting Time</label>' +
          '<input class="cast-time" placeholder="" value="'+escapeHtml(data.castTime||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Range</label>' +
          '<input class="range" placeholder="" value="'+escapeHtml(data.range||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Duration</label>' +
          '<input class="duration" placeholder="" value="'+escapeHtml(data.duration||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Components</label>' +
          '<input class="components" placeholder="" value="'+escapeHtml(data.components||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Save</label>' +
          '<input class="save" placeholder="" value="'+escapeHtml(data.save||'')+'" style="width:100%;"></div>' +
      '</div>' +
      '<div style="margin-bottom:8px;">' +
        '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Description</label>' +
        '<textarea class="description" placeholder="" style="width:100%;min-height:80px;resize:vertical;">'+escapeHtml(data.description||'')+'</textarea>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Personal Notes</label>' +
        '<textarea class="notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;">'+escapeHtml(data.notes||'')+'</textarea>' +
      '</div>' +
    '</div>';
  
  // Toggle details button
  const toggleBtn = el.querySelector('.toggle-spell-details');
  const detailsDiv = el.querySelector('.spell-details');
  const descriptionTextarea = el.querySelector('.description');
  
  toggleBtn.onclick = () => {
    if (detailsDiv.style.display === 'none') {
      detailsDiv.style.display = 'block';
      toggleBtn.textContent = 'Hide';
      // Auto-expand description when showing details
      if (descriptionTextarea) {
        autoExpand(descriptionTextarea);
      }
    } else {
      detailsDiv.style.display = 'none';
      toggleBtn.textContent = 'Details';
    }
  };
  
  // Cast / Lost buttons. Both toggle back to 'available', so either can be undone.
  const castBtn = el.querySelector('.cast-spell');
  const lostBtn = el.querySelector('.lose-spell');

  const setState = (state) => {
    const root = el.closest('.sheet-container');
    setMemSpellState(el, state);
    onChange && onChange();
    if (root) renderMemorizedSpellStatus(root);
  };

  if (castBtn) {
    castBtn.onclick = () => {
      setState(getMemSpellState(el) === 'cast' ? 'available' : 'cast');
    };
  }

  if (lostBtn) {
    lostBtn.onclick = () => {
      setState(getMemSpellState(el) === 'lost' ? 'available' : 'lost');
    };
  }

  // Reversed chip. Replaces the Form dropdown that used to sit in the panel:
  // the state is read on the collapsed row, so the control belongs there too.
  // It sits beside the NAME because that is what it qualifies -- which spell
  // you are actually casting. The sheet never renames the spell; the reverse is
  // named in the description prose, and no rule derives one name from the other
  // (light/darkness, bless/curse, purify/putrefy food & drink).
  const revChip  = el.querySelector('.revchip');
  const formHold = el.querySelector('.spell-form');
  if (revChip && formHold) {
    const syncRev = () => {
      const on = formHold.value === 'reversed';
      revChip.classList.toggle('on', on);
      revChip.textContent = on ? 'Reversed' : 'Normal';
      revChip.setAttribute('aria-pressed', String(on));
    };
    syncRev();
    revChip.onclick = () => {
      formHold.value = (formHold.value === 'reversed') ? 'normal' : 'reversed';
      syncRev();
      onChange && onChange();
    };
  }

  // Restore saved state. `lost` is checked first: a record written before this
  // change has no `lost` field at all and falls through to the old cast/available
  // behaviour untouched.
  setMemSpellState(el, data.lost ? 'lost' : (data.cast ? 'cast' : 'available'));
  
  // Forget button (renamed from Remove)
  el.querySelector('.rm').onclick=()=>{ 
    const root = el.closest('.sheet-container');
    el.remove(); 
    onChange && onChange(); 
    if (root) {
      setTimeout(() => renderMemorizedSpellStatus(root), 0);
    }
  };
  
  // Wire up all inputs/textareas
  el.querySelectorAll('input,textarea').forEach(inp =>{
    inp.addEventListener('input', ()=>{
      onChange && onChange();
      // Update status and sort when level or name changes
	  if (inp.classList.contains('level') || inp.classList.contains('title')) {
        const root = inp.closest('.sheet-container');
        if (root) {
          if (inp.classList.contains('level')) {
            renderMemorizedSpellStatus(root);
            // Reapply current filter
            const filter = root.querySelector('.memspell-level-filter');
            if (filter) {
              filterMemorizedSpells(root, filter.value);
            }
          }
          sortMemorizedSpells(root);
        }
      }
    });
    if (inp.tagName === 'TEXTAREA') {
      autoExpand(inp);
      inp.addEventListener('input', () => autoExpand(inp));
    }
  });
  
  return el;
}
function makeSpellbookNode(data={}, onChange){
  const el = document.createElement('div');
  // See makeMemSpellNode: 'gear' brings the shared shell, 'spell' adds what
  // only spells need. Inline styles removed rather than left dead -- an inline
  // style beats the stylesheet.
  el.className = 'item gear spell';
  
el.innerHTML =
    // Rail marks the specialist's OWN school, and once wired to
    // isOppositionSpell the schools he may never learn from. Neutral throughout
    // for a non-specialist or a priest -- getSpecialistSchool returns nothing,
    // so no branch is needed for them.
    '<div class="rail neutral"></div>' +
    '<div class="row1">' +
      // CORE FIELDS FIRST, ALWAYS IN THE SAME ORDER: level, school. Anything
      // conditional comes AFTER, so a badge only some rows carry can never
      // shift the fields every row carries and make the eye re-find them.
      '<span class="lvl"></span>' +
      '<span class="school">'+escapeHtml((data.schoolSphere||'').toUpperCase())+'</span>' +
      '<span class="freetag" style="display:none;">FREE SPELL</span>' +
      '<div class="spacer"></div>' +
      '<div class="btns">' +
        '<button class="toggle-spellbook-details act-details">Details</button>' +
        '<button class="memorize-spell primary">Memorize</button>' +
        '<button class="move-to-spellbook act-details">Move to&hellip;</button>' +
        '<button class="rm act-remove">Remove</button>' +
      '</div>' +
    '</div>' +
    '<div class="row2">' +
      '<input class="title spell-name" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:1;min-width:0;">' +
    '</div>' +
    '<div class="spellbook-details" style="display:none;">' +
      // Level is EDITABLE here, unlike the memorized card where it is inherited.
      // The circle on the collapsed row mirrors this field.
      '<div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:10px;">' +
        '<div style="display:flex;flex-direction:column;">' +
          '<label style="font-size:11px;color:var(--muted);margin-bottom:2px;">Level</label>' +
          '<input class="level" type="number" placeholder="" value="'+escapeHtml(data.level||'')+'" style="width:70px;text-align:center;">' +
        '</div>' +
        // The free-spell claim moved in here from a row under the card. It is a
        // once-per-level decision, not something read at a glance -- the FREE
        // SPELL tag on the collapsed row is what reports it.
        '<div class="free-spell-row" style="display:none;">' +
          '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">' +
            '<input type="checkbox" class="free-spell-check" style="width:auto;">' +
            '<span class="free-spell-label" style="color:var(--muted);"></span>' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div class="spell-statline">' +
        '<div><span>SCHOOL/SPHERE</span><b>'+escapeHtml(data.schoolSphere||'\u2014')+'</b></div>' +
        '<div><span>CASTING TIME</span><b>'+escapeHtml(data.castTime||'\u2014')+'</b></div>' +
        '<div><span>RANGE</span><b>'+escapeHtml(data.range||'\u2014')+'</b></div>' +
        '<div><span>DURATION</span><b>'+escapeHtml(data.duration||'\u2014')+'</b></div>' +
      '</div>' +
      '<div style="font-size:12px;white-space:pre-wrap;max-height:200px;overflow-y:auto;">' +
        escapeHtml(data.description || 'No description available.') +
      '</div>' +
    '</div>';
  
  // Store full spell data on the element
  el._spellData = data;

  // Free-spell claim checkbox (shown only for own-school spells by
  // renderSpecialistSpellNotes). State persists via el._spellData.freeSpell.
  const freeCheck = el.querySelector('.free-spell-check');
  if (freeCheck) {
    freeCheck.checked = !!data.freeSpell;
    freeCheck.addEventListener('change', () => {
      if (el._spellData) el._spellData.freeSpell = freeCheck.checked;
      const r = el.closest('.sheet-container');
      onChange && onChange();
      if (r && typeof syncSpellbookToData === 'function') syncSpellbookToData(r);
      syncBookLevel();
    });
  }

  // The level circle on the collapsed row mirrors the editable field in the
  // panel. The INPUT stays the source of truth -- sortSpellbook and every other
  // reader address .level -- and the circle is display only, so there is never
  // a second stored copy to drift.
  const bookLvlInput = el.querySelector('.level');
  const bookLvlDot   = el.querySelector('.lvl');
  const syncBookLevel = () => {
    if (bookLvlDot && bookLvlInput) bookLvlDot.textContent = bookLvlInput.value || '\u2013';
  };
  syncBookLevel();
  if (bookLvlInput) bookLvlInput.addEventListener('input', syncBookLevel);
  
  // Toggle details button
  const toggleDetailsBtn = el.querySelector('.toggle-spellbook-details');
  const detailsDiv = el.querySelector('.spellbook-details');
  if (toggleDetailsBtn && detailsDiv) {
    toggleDetailsBtn.onclick = () => {
      if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        toggleDetailsBtn.textContent = 'Hide';
      } else {
        detailsDiv.style.display = 'none';
        toggleDetailsBtn.textContent = 'Details';
      }
    };
  }
  
  // Memorize button - copies spell to memorized list (leaves original in spellbook)
  el.querySelector('.memorize-spell').addEventListener('click', (e) => {
    copyToMemorized(el, onChange);
    markUnsaved(e.currentTarget || el, true);
  });
  
  // Move to spellbook button
  el.querySelector('.move-to-spellbook').onclick = () => {
    moveSpellToAnotherSpellbook(el, onChange);
  };
  
  // Remove button
  el.querySelector('.rm').onclick = ()=>{ 
    el.remove(); 
    onChange && onChange();
  };
  
  // Wire up inputs.
  //
  // The level field is handled in TWO phases on purpose.
  //
  // Re-sorting on every `input` event was wrong: each spinner click moved the row
  // into a different level block, so stepping 1 -> 2 -> 3 threw it past every
  // level-1 spell, then every level-2 spell, in a list that was jumping under the
  // cursor. sortSpellbook() also clears the list's innerHTML and re-appends every
  // row, which drops focus, so the field died after one click.
  //
  // Nothing about the ORDER needs to be right mid-edit. The row re-sorts once, on
  // blur, when the player has settled on a level.
  el.querySelectorAll('input').forEach(inp =>{
    inp.addEventListener('input', ()=>{
      onChange && onChange();
    });
  });

  // Settle the row once editing finishes: sort it into place, make sure the
  // active filter still shows it, and follow it if it has moved out of view.
  const levelInput = el.querySelector('.level');
  if (levelInput) {
    levelInput.addEventListener('blur', ()=>{
      const root = levelInput.closest('.sheet-container');
      if (!root) return;

      sortSpellbook(root);

      const filter = root.querySelector('.spellbook-level-filter');
      if (filter) {
        // Redirect a level-specific filter to follow the spell rather than
        // hiding it. 'All levels' ('') already shows everything, and a blank
        // level field means there is nothing to follow.
        const newLevel = String(levelInput.value || '').trim();
        if (filter.value !== '' && newLevel !== '' && filter.value !== newLevel) {
          const hasOption = Array.from(filter.options).some(o => o.value === newLevel);
          if (hasOption) filter.value = newLevel;
        }
        filterSpellbook(root, filter.value);
      }

      // 'nearest' scrolls only when the row is genuinely off-screen, so a row
      // that barely moved doesn't twitch the page under the player.
      const movedRow = levelInput.closest('.item');
      if (movedRow && typeof movedRow.scrollIntoView === 'function') {
        try { movedRow.scrollIntoView({ block: 'nearest' }); }
        catch (e) { movedRow.scrollIntoView(false); }
      }
    });
  }
  
  return el;
}

// Helper function to copy spell from spellbook to memorized (leaves original in spellbook)
function copyToMemorized(spellbookNode, onChange) {
  const root = spellbookNode.closest('.sheet-container');
  if (!root) return;
  
  const spellData = spellbookNode._spellData || {
    name: spellbookNode.querySelector('.title').value,
    level: spellbookNode.querySelector('.level').value
  };
  
  // Add to memorized list (COPY, not move - original stays in spellbook)
  const memList = root.querySelector('.memspells-list');
  if (memList) {
    const memNode = makeMemSpellNode(spellData, () => {
      setTimeout(() => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) markUnsaved(activeTab, true, root);
        renderMemorizedSpellStatus(root);
      }, 0);
    });
    memList.appendChild(memNode);
    sortMemorizedSpells(root);
    renderMemorizedSpellStatus(root);
    
    // Mark unsaved
	const tab = document.querySelector('.tab.active');
      if (tab) markUnsaved(tab, true, root);
    
    // Apply current filter
    const filter = root.querySelector('.memspell-level-filter');
    if (filter) {
      filterMemorizedSpells(root, filter.value);
    }
    
    onChange && onChange();
  }
  // NOTE: Original spell stays in spellbook (this is a copy operation)
}

// Helper function to return spell from memorized to spellbook
function returnMemSpellToSpellbook(memNode, onChange) {
  const root = memNode.closest('.sheet-container');
  if (!root) return;
  
  // Get spell data from the memorized spell node
  const spellData = {
    name: memNode.querySelector('.title').value,
    level: memNode.querySelector('.level').value,
    schoolSphere: memNode.querySelector('.school-sphere')?.value || '',
    castTime: memNode.querySelector('.cast-time')?.value || '',
    range: memNode.querySelector('.range')?.value || '',
    duration: memNode.querySelector('.duration')?.value || '',
    components: memNode.querySelector('.components')?.value || '',
    save: memNode.querySelector('.save')?.value || '',
    description: memNode.querySelector('.description')?.value || '',
    notes: memNode.querySelector('.notes')?.value || ''
  };
  
  // Add to spellbook
  const spellbookList = root.querySelector('.spellbook-list');
  if (spellbookList) {
    const spellbookNode = makeSpellbookNode(spellData, () => {
      markUnsaved(document.querySelector('.tab.active'), true, root);
    });
    spellbookList.appendChild(spellbookNode);
    sortSpellbook(root);
  }
  
  // Remove from memorized
  memNode.remove();
  renderMemorizedSpellStatus(root);
  
  // Mark unsaved
  const tab = document.querySelector('.tab.active');
  markUnsaved(tab, true, root);
  
  onChange && onChange();
}

// Sort spellbook by level, then alphabetically
function sortSpellbook(root) {
  const spellbookList = root.querySelector('.spellbook-list');
  if (!spellbookList) return;
  
  const items = Array.from(spellbookList.querySelectorAll('.item'));
  
  items.sort((a, b) => {
    // Blank levels sort FIRST, not last. A spell with no level yet is one the
    // player is in the middle of adding, so it belongs at the top where it can
    // be seen -- appending it to the end of a long book meant it could arrive
    // off-screen, and its first increment then threw it all the way to the top.
    // Only EMPTY values are affected; a non-numeric level still yields NaN and
    // sorts as it always did.
    const levelA = parseInt(a.querySelector('.level')?.value || -1, 10);
    const levelB = parseInt(b.querySelector('.level')?.value || -1, 10);
    
    if (levelA !== levelB) {
      return levelA - levelB;
    }
    
    const nameA = (a.querySelector('.title')?.value || '').toLowerCase();
    const nameB = (b.querySelector('.title')?.value || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  spellbookList.innerHTML = '';
  items.forEach(item => spellbookList.appendChild(item));
}
// Show/hide spellbook section based on class
function toggleSpellbookSection(root) {
  const clazz = (val(root, "clazz") || "").trim().toLowerCase();
  const spellbookSection = root.querySelector('.spellbook-section');
  
  if (!spellbookSection) return;
  
  // Show spellbook for all spellcasters (optional for priests, essential for wizards/bards)
  const isSpellcaster = clazz.includes('cleric') || clazz.includes('druid') || 
                        clazz.includes('priest') || clazz.includes('shaman') ||
                        clazz.includes('paladin') || clazz.includes('dpaladin') ||
                        clazz.includes('ranger') ||
                        clazz.includes('mage') || clazz.includes('wizard') || 
                        clazz.includes('illusionist') || clazz.includes('specialist') ||
                        clazz.includes('bard') || clazz.includes('abjurer') || 
                        clazz.includes('conjurer') || clazz.includes('enchanter') || 
                        clazz.includes('invoker') || clazz.includes('necromancer') || 
                        clazz.includes('transmuter') || clazz.includes('diviner') || 
                        clazz.includes('evoker');
  
  spellbookSection.style.display = isSpellcaster ? 'block' : 'none';

  // The sidebar Study / Pray button follows the same test. Kept here rather than
  // given its own copy of that class list: two lists of caster classes WILL
  // drift, and a fighter offered a Study button or a necromancer denied one are
  // both silent failures nobody reports.
  const studyBtn = root.querySelector('.study-button');
  if (studyBtn) {
    studyBtn.style.display = isSpellcaster ? 'block' : 'none';
    // Priests pray; the conditions are identical (PHB Ch.7).
    const isPriestCaster = clazz.includes('cleric') || clazz.includes('druid') ||
                           clazz.includes('priest') || clazz.includes('shaman') ||
                           clazz.includes('paladin');
    studyBtn.textContent = isPriestCaster ? '\uD83D\uDE4F Pray' : '\uD83D\uDCD6 Study';
  }
}
function makeItemNode(data={}, onChange){
  const el = document.createElement('div');
  // See makeAmmunitionNode for what 'gear' opts into. The inline
  // flexDirection/alignItems are removed rather than left dead: an inline style
  // beats the stylesheet, and alignItems:stretch would override the grid's
  // align-items:center on every row.
  el.className = 'item gear';
  // Held on the node rather than in a hidden input: it is never edited, only
  // carried, and a hidden input would show up in the blanket input listener.
  if (data.category) el.dataset.category = data.category;
  el.innerHTML =
    // No state axis on plain equipment, so quantity takes the control slot and
    // the rail stays neutral. The hero figure is LINE WEIGHT -- qty x each --
    // because that is the number encumbrance reads, and until now it appeared
    // nowhere on screen. Twelve torches reading "12 lb" answers the question
    // people are actually asking when they scan the list.
    '<div class="rail"></div>' +
    '<div class="row1">' +
      '<div class="qtybox">' +
        '<input class="qty" type="number" min="0" step="1" inputmode="numeric" value="'+escapeHtml(data.qty||'')+'">' +
        '<span class="spin">' +
          '<button type="button" class="qty-up" aria-label="Add one">&#9650;</button>' +
          '<button type="button" class="qty-down" aria-label="Remove one">&#9660;</button>' +
        '</span>' +
        '<span class="qlab">qty</span>' +
      '</div>' +
      // Conditional, so it comes AFTER the core fields -- a badge only some
      // rows carry must never shift the fields every row carries.
      (data.category ? '<span class="tag">' + escapeHtml(String(data.category).toUpperCase()) + '</span>' : '') +
      '<div class="spacer"></div>' +
      '<div class="stat each eq-each"></div>' +
      '<div class="stat eq-line"></div>' +
      '<div class="btns">' +
        '<button class="toggle-details">Details</button>' +
        '<button class="rm">Remove</button>' +
      '</div>' +
    '</div>' +
    '<div class="row2">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:1;min-width:0;">' +
    '</div>' +
    '<div class="gear-details" style="display:none;">' +
      '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
        '<div style="width:100px;text-align:center;">Weight (lbs, ea)</div>' +
      '</div>' +
      '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:8px;">' +
        '<input class="weight" type="number" step="0.1" placeholder="" value="'+escapeHtml(data.weight||'')+'" style="width:100px;text-align:center;">' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes" placeholder="" value="'+escapeHtml(data.notes||'')+'" style="width:100%">' +
    '</div>';

  const eqToggleBtn = el.querySelector('.toggle-details');
  const eqDetails   = el.querySelector('.gear-details');
  if (eqToggleBtn && eqDetails) {
    eqToggleBtn.onclick = () => {
      const open = eqDetails.style.display !== 'none';
      eqDetails.style.display = open ? 'none' : 'block';
      eqToggleBtn.textContent = open ? 'Details' : 'Hide';
    };
  }

  // Derived live from the two fields on the card; never stored.
  const syncEquipLine = () => {
    const each = parseFloat((el.querySelector('.weight') || {}).value);
    const qty  = parseInt((el.querySelector('.qty') || {}).value || 0, 10) || 0;
    const eachEl = el.querySelector('.eq-each');
    const lineEl = el.querySelector('.eq-line');
    if (eachEl) eachEl.textContent = isNaN(each) ? '' : each + ' lb ea';
    if (lineEl) {
      lineEl.innerHTML = isNaN(each)
        ? ''
        : '<b>' + escapeHtml(String(+(each * qty).toFixed(2))) + '</b> lb total';
    }
  };
  syncEquipLine();
  ['.qty', '.weight'].forEach(s => {
    const f = el.querySelector(s);
    if (f) f.addEventListener('input', syncEquipLine);
  });

  const eqQty = el.querySelector('.qty');
  const eqStep = (delta) => {
    const n = parseInt(eqQty.value || 0, 10);
    eqQty.value = Math.max(0, (isNaN(n) ? 0 : n) + delta);
    eqQty.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const eqUp = el.querySelector('.qty-up'), eqDown = el.querySelector('.qty-down');
  if (eqUp)   eqUp.onclick   = () => eqStep(1);
  if (eqDown) eqDown.onclick = () => eqStep(-1);
  eqQty.addEventListener('input', () => {
    const clean = String(eqQty.value).replace(/[^0-9]/g, '');
    if (clean !== eqQty.value) eqQty.value = clean;
  });

  el.querySelector('.rm').onclick = ()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input').forEach(inp =>
    inp.addEventListener('input', ()=>onChange && onChange())
  );
  return el;
}

function makeValuableNode(data={}, onChange){
  const el = document.createElement('div');
  // See makeAmmunitionNode for what 'gear' opts into. All three inline styles
  // are removed rather than left dead: an inline style beats the stylesheet, so
  // alignItems:stretch would override the grid's align-items:center, and the
  // 12px padding would fight the padding change that marks an unequipped card.
  el.className = 'item gear';
  
  // MIGRATION -- Value (ea) used to be a free-text box, so existing records
  // hold strings like "500 gp" or "1,000". A record with no structured `value`
  // gets one parsed out of the old string exactly once (parseLegacyValueEach in
  // tables.js). A record that already HAS `value` is never touched, so this can
  // never overwrite real data. `valueEach` is read here and written nowhere --
  // once a migrated character is saved, the legacy field is gone for good.
  let vValue = (data.value !== undefined) ? data.value : '';
  let vUnit  = data.unit || 'gp';
  if (data.value === undefined && data.valueEach && typeof parseLegacyValueEach === 'function') {
    const migrated = parseLegacyValueEach(data.valueEach);
    vValue = migrated.value;
    vUnit  = migrated.unit;
  }

  // Type is metadata -- no arithmetic reads it. See VALUABLE_TYPES in tables.js.
  const vType = data.type || '';
  const vTypeOptions = (typeof VALUABLE_TYPES !== 'undefined' ? VALUABLE_TYPES : [])
    .map(t => '<option value="'+escapeHtml(t.key)+'"'+(t.key===vType?' selected':'')+'>'+
              escapeHtml(t.label)+'</option>').join('');
  const vUnitOptions = (typeof COIN_UNITS !== 'undefined' ? COIN_UNITS : ['gp'])
    .map(u => '<option value="'+u+'"'+(u===vUnit?' selected':'')+'>'+u.toUpperCase()+
              '</option>').join('');

  el.innerHTML =
    // No state axis on a valuable -- nothing is equipped or worn -- so quantity
    // takes the control slot and the rail stays neutral.
    '<div class="rail"></div>' +
    '<div class="row1">' +
      '<div class="qtybox">' +
        '<input class="qty" type="number" min="0" step="1" inputmode="numeric" value="'+escapeHtml(data.qty||'')+'">' +
        '<span class="spin">' +
          '<button type="button" class="qty-up" aria-label="Add one">&#9650;</button>' +
          '<button type="button" class="qty-down" aria-label="Remove one">&#9660;</button>' +
        '</span>' +
        '<span class="qlab">qty</span>' +
      '</div>' +
      '<span class="tag"></span>' +
      '<div class="spacer"></div>' +
      '<div class="stat each val-each"></div>' +
      '<div class="stat val-line"></div>' +
      '<div class="btns">' +
        '<button class="toggle-details">Details</button>' +
        '<button class="rm">Remove</button>' +
      '</div>' +
    '</div>' +
    '<div class="row2">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:1;min-width:0;">' +
    '</div>' +
    '<div class="valuable-details" style="display:none;">' +
      '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
        '<div style="width:120px;">Type</div>' +
        '<div style="width:90px;text-align:center;">Value (ea)</div>' +
        '<div style="width:70px;text-align:center;">Unit</div>' +
        '<div style="width:80px;text-align:center;">Weight (ea)</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;align-items:stretch;margin-bottom:8px;">' +
        '<select class="valuable-type" style="width:120px;">'+vTypeOptions+'</select>' +
        '<input class="value-each" type="number" step="0.01" min="0" placeholder="" value="'+escapeHtml(vValue||'')+'" style="width:90px;text-align:right;">' +
        '<select class="value-unit" style="width:70px;">'+vUnitOptions+'</select>' +
        '<input class="weight" type="number" step="0.1" placeholder="" value="'+escapeHtml(data.weight||'')+'" style="width:80px;text-align:center;">' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes" placeholder="" value="'+escapeHtml(data.notes||'')+'" style="width:100%;">' +
    '</div>';

  // Details toggle. This card had NONE -- every valuable rendered fully
  // expanded, three rows deep, however many you were carrying.
  const vToggleBtn = el.querySelector('.toggle-details');
  const vDetails   = el.querySelector('.valuable-details');
  if (vToggleBtn && vDetails) {
    vToggleBtn.onclick = () => {
      const open = vDetails.style.display !== 'none';
      vDetails.style.display = open ? 'none' : 'block';
      vToggleBtn.textContent = open ? 'Details' : 'Hide';
    };
  }

  // Collapsed-row figures. The hero number is the LINE value -- qty x each --
  // because four sapphires at 1,000 gp is a 4,000 gp line, and that is the
  // figure anyone scanning the list is actually after. The unit price sits
  // muted beside it. Derived live; never stored.
  const syncValuableLine = () => {
    const num = sel => parseFloat((el.querySelector(sel) || {}).value);
    const unit = ((el.querySelector('.value-unit') || {}).value || 'gp').toUpperCase();
    const each = num('.value-each');
    const qty  = parseInt((el.querySelector('.qty') || {}).value || 0, 10) || 0;
    const eachEl = el.querySelector('.val-each');
    const lineEl = el.querySelector('.val-line');
    const fmt = n => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (eachEl) eachEl.textContent = isNaN(each) ? '' : fmt(each) + ' ' + unit + ' ea';
    if (lineEl) {
      lineEl.innerHTML = isNaN(each)
        ? ''
        : '<b>' + escapeHtml(fmt(each * qty)) + '</b> ' + escapeHtml(unit);
    }
    const tagEl = el.querySelector('.tag');
    const sel   = el.querySelector('.valuable-type');
    if (tagEl && sel) {
      tagEl.textContent = sel.value ? sel.options[sel.selectedIndex].text.toUpperCase() : '';
    }
  };
  syncValuableLine();
  ['.qty', '.value-each'].forEach(s => {
    const f = el.querySelector(s);
    if (f) f.addEventListener('input', syncValuableLine);
  });
  ['.value-unit', '.valuable-type'].forEach(s => {
    const f = el.querySelector(s);
    if (f) f.addEventListener('change', syncValuableLine);
  });

  // Quantity spinner. Dispatches a real 'input' event rather than assigning
  // .value silently, so the blanket listener below still fires.
  const vQty = el.querySelector('.qty');
  const vStep = (delta) => {
    const n = parseInt(vQty.value || 0, 10);
    vQty.value = Math.max(0, (isNaN(n) ? 0 : n) + delta);
    vQty.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const vUp = el.querySelector('.qty-up'), vDown = el.querySelector('.qty-down');
  if (vUp)   vUp.onclick   = () => vStep(1);
  if (vDown) vDown.onclick = () => vStep(-1);
  vQty.addEventListener('input', () => {
    const clean = String(vQty.value).replace(/[^0-9]/g, '');
    if (clean !== vQty.value) vQty.value = clean;
  });

  // Remove button triggers onChange
  el.querySelector('.rm').onclick = ()=>{ 
    el.remove(); 
    onChange && onChange(); 
  };
  
  // Text and number inputs report on 'input'; dropdowns report on 'change' and
  // would otherwise mark nothing at all. Both paths reach the same onChange.
  el.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      onChange && onChange();
    });
  });
  el.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      onChange && onChange();
    });
  });
  
  return el;
}

// ===== Enchanted-item badge: shared by the armor, weapon and ammunition cards =====
// Rendered into the identity row so an enchanted item announces itself on a
// COLLAPSED card, which is the whole point -- the number is what you would
// otherwise expand the card to find.
//
//   enchanted, with a bonus -> "(+2)", or "(+5: +1/+0)" when a weapon's actual
//                              effects diverge from its enchantment level
//   enchanted, no bonus     -> a dot. "(+0)" reads as worthless, and elven chain
//                              is exactly that case: magical, AC 5, no plus.
//   mundane                 -> an EMPTY slot, still emitted, so every row in a
//                              list keeps the same geometry
// AN UNIDENTIFIED ITEM SHOWS THE DOT, NEVER THE NUMBER. The bonus is recorded
// on the card but the character does not know it yet, and the collapsed row is
// the one surface that would otherwise announce it without being opened.
// Callers pass '' for text when the item is enchanted but not identified.
function magicBadgeHtml(isMagical, text) {
  if (!isMagical) return '<span class="magic-badge"></span>';
  return '<span class="magic-badge" title="Enchanted">' +
         (text ? text : '<span class="magic-dot"></span>') + '</span>';
}

// Refresh a badge in place. Called from the Enchanted tick, the Identified tick
// AND every bonus field, so the collapsed view can never lag behind the
// expanded one.
function updateMagicBadge(el, isMagical, text) {
  const b = el.querySelector('.magic-badge');
  if (!b) return;
  if (!isMagical) { b.innerHTML = ''; b.removeAttribute('title'); return; }
  b.innerHTML = text ? text : '<span class="magic-dot"></span>';
  b.title = 'Enchanted';
}

// A cursed item must not render as "+-1".
function magicSign(n) { return (n >= 0 ? '+' : '') + n; }

function makeArmorNode(data={}, onChange){
  const el = document.createElement('div');
  // See makeAmmunitionNode for what 'gear' opts into. The inline
  // flexDirection/alignItems are removed rather than left dead: an inline style
  // beats the stylesheet, and alignItems:stretch would override the grid's
  // align-items:center on every row.
  el.className = 'item gear';

  // Build the construction dropdown from ARMOR_TYPES / SHIELD_TYPES /
  // WEARABLE_TYPES. THE POINT OF THIS FIELD: it is the anchor that ties a
  // free-text name to the rules. "Gladiator Armor" or "Shadowsilk Wrap" are
  // NAMES; the type is what Table 29, ranger stealth and the class
  // restrictions actually read. Nothing parses the label -- the option VALUE
  // is the key, so relabelling can never break a rule.
  const opt = (v, lbl, sel) =>
    '<option value="' + v + '"' + (sel === v ? ' selected' : '') + '>' + lbl + '</option>';
  const cur = data.armorTypeKey || '';
  let typeOpts = '<option value="">— select —</option>';
  if (typeof ARMOR_TYPES !== 'undefined') {
    typeOpts += '<optgroup label="Armor">';
    Object.keys(ARMOR_TYPES).forEach(k => { typeOpts += opt(k, ARMOR_TYPES[k].label, cur); });
    typeOpts += '</optgroup>';
  }
  if (typeof SHIELD_TYPES !== 'undefined') {
    typeOpts += '<optgroup label="Shields">';
    Object.keys(SHIELD_TYPES).forEach(k => { typeOpts += opt(k, SHIELD_TYPES[k].label, cur); });
    typeOpts += '</optgroup>';
  }
  if (typeof WEARABLE_TYPES !== 'undefined') {
    typeOpts += '<optgroup label="Other worn">';
    Object.keys(WEARABLE_TYPES).forEach(k => { typeOpts += opt(k, WEARABLE_TYPES[k].label, cur); });
    typeOpts += '</optgroup>';
  }

  // "Bracers" REPLACES body armor (bracers of defense -- they do not stack).
  // "Supplemental Armor" ADDS to it (dastana, vambraces worn over armor).
  const slots = ['Armor','Shield','Helmet','Bracers','Supplemental Armor','Gauntlets','Boots','Cloak','Belt','Ring','Other'];

  // PHBR1 pp.111-112. The five PARTIAL slots are offered only when this card's
  // armour type actually has a row in the piecemeal table -- fourteen types,
  // everything except elven chain.
  //
  // A LOCK, NOT A WARNING, and the distinction matters. Elsewhere this tool
  // warns and lets the player proceed, because a DM may overrule the book. Here
  // there is nothing to overrule: elven chain has NO ROW, so a piecemeal elven
  // sleeve has no value at all. Offering a control that can only produce a blank
  // is worse than not offering it.
  //
  // Gated on PHBR1 too, via getPiecemealPiece returning null with the book off.
  // An ALREADY-STORED partial slot is preserved regardless -- see the append
  // below -- so switching the book off, or changing the type out from under a
  // piece, never silently rewrites the player's card.
  const pmType = data.armorTypeKey || (typeof inferArmorTypeKey === 'function'
    ? inferArmorTypeKey(data.name || '') : '');
  const pmOn = (typeof getPiecemealPiece === 'function') &&
               !!getPiecemealPiece(pmType, 'breastplate');
  if (pmOn && typeof PIECEMEAL_SLOTS !== 'undefined') {
    PIECEMEAL_SLOTS.forEach(s => slots.push(s.label));
  }

  // KEEP A STORED VALUE THAT IS NO LONGER OFFERED. A card saved as
  // "Splint Mail / One Arm" whose type is later switched to elven chain, or
  // loaded with PHBR1 switched off, would otherwise silently snap back to
  // "Armor" -- mutating data the player never asked to change. The option is
  // re-added so the select can still show it; the piece contributes 0 and the
  // card says why.
  const curSlot = data.armorType || 'Armor';
  if (curSlot && slots.indexOf(curSlot) === -1) slots.push(curSlot);

  // GROUPED, NOT RENAMED. The stored slot value IS the label string, so
  // renaming these to "PM - Breastplate" would orphan every card already saved
  // as "Breastplate". An optgroup separates them visually and changes no data.
  // The type dropdown above already uses optgroups, so this matches.
  const pmLabels = (typeof PIECEMEAL_SLOTS !== 'undefined')
    ? PIECEMEAL_SLOTS.map(s => s.label) : [];
  const plain = slots.filter(s => pmLabels.indexOf(s) === -1);
  const pieces = slots.filter(s => pmLabels.indexOf(s) !== -1);
  let slotOpts = plain.map(s => opt(s, s, curSlot)).join('');
  if (pieces.length) {
    slotOpts += '<optgroup label="Piecemeal (PHBR1)">' +
                pieces.map(s => opt(s, s, curSlot)).join('') +
                '</optgroup>';
  }

  // MIGRATION -- NOT OPTIONAL. Records written before the Enchanted checkbox
  // existed carry a bonus but no isMagical flag. Without this, every magic item
  // on every saved character would load unticked, its group would collapse, and
  // its AC bonus would sit in the file where nobody could see it. A non-zero
  // acBonus is therefore read as enchanted.
  // Once the flag exists it always wins, so a player who unticks a +1 item and
  // saves gets that respected on the next load.
  // See makeAmmunitionNode: a missing flag reads as IDENTIFIED.
  const armorIdentified = (data.identified !== undefined) ? !!data.identified : true;
  const armorIsMagical = (data.isMagical !== undefined)
    ? !!data.isMagical
    : (parseFloat(data.acBonus) || 0) !== 0;

  el.innerHTML =
    // The header strip this used to open is GONE, not fixed: the column labels
    // it carried are now per-field labels in the expanded panel, and the chip
    // labels itself. That is also what retires the missing-opening-tag bug.
    // The rail will carry LEGALITY -- class restriction, ranger stealth -- once
    // a resolver exists. Left classless until then rather than given a colour
    // that would claim an answer nothing has computed.
    '<div class="rail"></div>' +
    '<div class="row1">' +
      '<label class="chip state">' +
        '<input type="checkbox" class="equipped" '+(data.equipped?'checked':'')+'>' +
        '<span class="on">Worn</span><span class="off">Stowed</span>' +
      '</label>' +
      '<span class="status"></span>' +
      '<div class="spacer"></div>' +
      '<div class="stat arm-ac"></div>' +
      '<div class="stat arm-weight"></div>' +
      // PHBR1 piecemeal note. Filled by syncArmorLine and empty for ordinary
      // armour, so it costs nothing on a card that is not a piece. Sits with the
      // other at-a-glance chips because the AC a piece contributes is NOT its
      // base AC, and that has to be visible without expanding the card.
      '<div class="stat arm-pm-note" style="font-size:10px;color:var(--accent-light);"></div>' +
      '<div class="btns">' +
        '<button class="toggle-details">Details</button>' +
        '<button class="rm">Remove</button>' +
      '</div>' +
    '</div>' +
    // Row 2: the name alone at full card width. sizeArmorName() still sizes the
    // input to its contents so the badge sits against the text.
    '<div class="row2">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:0 0 auto;min-width:0;">' +
      // See makeAmmunitionNode: unidentified shows the dot, never the number.
      magicBadgeHtml(armorIsMagical,
        (armorIdentified && (parseFloat(data.acBonus) || 0) !== 0)
          ? '(' + magicSign(parseFloat(data.acBonus)) + ')' : '') +
    '</div>' +

    '<div class="armor-details" style="display:none;">' +
      '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
        '<div style="flex:1;text-align:center;">Type</div>' +
        '<div style="width:100px;text-align:center;">Worn As</div>' +
        '<div style="width:70px;text-align:center;">Base AC</div>' +
        '<div style="width:80px;text-align:center;">Weight (lbs)</div>' +
      '</div>' +
      '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:6px;">' +
        '<select class="armor-type" style="flex:1;">' + typeOpts + '</select>' +
        '<select class="armor-slot" style="width:100px;">' + slotOpts + '</select>' +
        '<input class="base-ac" type="number" placeholder="" value="'+escapeHtml(data.baseAC||'')+'" style="width:70px;text-align:center;">' +
        '<input class="weight" type="number" step="0.1" placeholder="" value="'+escapeHtml(data.weight||'')+'" style="width:80px;text-align:center;">' +
      '</div>' +
      // The old "Magic" column is now a labelled AC Bonus inside the enchanted
      // group, so the number and the fact of being magical are separate things.
      '<div class="ench-panel">' +
        '<div class="ench-head">' +
          '<label>' +
            '<input type="checkbox" class="is-magical"' + (armorIsMagical ? ' checked' : '') + '>' +
            'Enchanted?' +
          '</label>' +
          '<label class="ench-ident">' +
            '<input type="checkbox" class="is-identified"' + (armorIdentified ? ' checked' : '') + '>' +
            'Identified?' +
          '</label>' +
          '<span class="ench-veil">Effects unknown until identified</span>' +
        '</div>' +
        '<div class="ench-body">' +
          '<div class="ench-fields">' +
            '<div class="ench-name">' +
              '<label style="display:block;margin-bottom:3px;">True name</label>' +
              '<input class="true-name" value="'+escapeHtml(data.trueName||'')+'">' +
            '</div>' +
            '<label>AC Bonus<input class="ac-bonus" type="number" value="'+escapeHtml(data.acBonus||'')+'"></label>' +
          '</div>' +
          '<div class="ench-effects">' +
            '<label style="display:block;margin-bottom:3px;">Effects</label>' +
            '<textarea class="ench-effects-text">'+escapeHtml(data.effects||'')+'</textarea>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // PHBR1 pp.110-111. OUTSIDE the enchantment panel deliberately: high
      // quality is visible on inspection, like Type and Weight, and gating it
      // behind Enchanted would force the player to tick a lie to record it.
      '<div class="phbr1-only" style="display:flex;gap:8px;align-items:flex-end;margin-bottom:6px;">' +
        '<label style="display:flex;flex-direction:column;gap:2px;">' +
          '<span style="font-size:11px;color:var(--muted);">High-quality racial armor</span>' +
          '<select class="armor-hq-race" style="width:170px;" title="' +
            'PHBR1 pp.110-111. Armor found as treasure has a 10% chance of being&#10;' +
            '  high-quality (25% if magical) \u2014 the DM\u2019s roll, not yours.&#10;' +
            'Each race adds something different: elven is half weight, half-elven&#10;' +
            '  10% lighter, gnomish takes no thieving penalties, halfling leather&#10;' +
            '  counts as No Armor, and human plate gives the WEARER +2 vs Rod,&#10;' +
            '  Staff or Wand and vs Breath Weapon.&#10;' +
            'Shields gain nothing from being high-quality.">' +
            '<option value="">Ordinary</option>' +
            ((typeof HIGH_QUALITY_RACIAL_ARMOR !== 'undefined'
              ? Object.keys(HIGH_QUALITY_RACIAL_ARMOR) : [])
              .map(k => '<option value="' + k + '"' +
                        ((data.highQualityRace || '') === k ? ' selected' : '') + '>' +
                        escapeHtml(HIGH_QUALITY_RACIAL_ARMOR[k].label) + '</option>').join('')) +
          '</select>' +
        '</label>' +
        '<div class="armor-hq-note" style="flex:1;font-size:11px;color:var(--muted);line-height:1.4;"></div>' +
      '</div>' +
      '<div class="armor-type-note" style="display:none;font-size:11px;line-height:1.4;padding:6px 8px;background:var(--glass);border-radius:4px;"></div>' +
      // Notes lives here rather than on the collapsed row. At flex:2 up there it
      // truncated to uselessness -- "Interlocking metal plates covering most of
      // the b" -- while consuming the width the name and badge needed. Full
      // width down here it is actually readable, and the collapsed row is left
      // to do its real job: identify, equip, expand.
      '<div style="font-size:11px;color:var(--muted);margin:6px 0 2px;">Notes</div>' +
      // See makeWeaponNode: style.css matches input[type=text], so a typeless
      // input never picks up width:100%.
      '<input class="notes" placeholder="" value="'+escapeHtml(data.notes||'')+'" style="width:100%;">' +
    '</div>';

  // Collapse/expand, same pattern as the weapon card.
  const armorToggleBtn = el.querySelector('.toggle-details');
  const armorDetails   = el.querySelector('.armor-details');
  if (armorToggleBtn && armorDetails) {
    armorToggleBtn.onclick = () => {
      const open = armorDetails.style.display !== 'none';
      armorDetails.style.display = open ? 'none' : 'block';
      armorToggleBtn.textContent = open ? 'Details' : 'Hide';
    };
  }

  // Collapsed-row figures. Read LIVE from the detail inputs -- derived values
  // are never stored separately, and a stored copy is a copy that drifts.
  // Base AC shows an em dash when the field is empty rather than a blank,
  // because SHIELD_TYPES deliberately carry no `ac`: applyTypeDefaults clears
  // the field when a shield is chosen, since a shield's bonus is not a base AC.
  // A dash says "not applicable here"; a blank says "you forgot to fill it in".
  const syncArmorLine = () => {
    const val = sel => ((el.querySelector(sel) || {}).value || '').trim();
    const acEl = el.querySelector('.arm-ac');
    const wtEl = el.querySelector('.arm-weight');
    if (acEl) {
      const ac = val('.base-ac');
      // TWO DIFFERENT QUANTITIES share this column, so they cannot share a
      // caption. Body armor's 5 is a RESULTING Armor Class; a buckler's -1 is a
      // MODIFIER to it. AC descends in AD&D, so -1 is an improvement -- but
      // printed as "AC -1" beside "AC 5" it reads as the worst armor on the
      // sheet. The slot decides the wording.
      const slot = val('.armor-slot') || 'Armor';
      const isMod = (slot === 'Shield');
      const label = isMod ? 'AC mod' : 'AC';
      // A leading + on a positive modifier, so the sign is always explicit.
      const shown = (isMod && ac !== '' && !/^[+-]/.test(ac) && parseFloat(ac) > 0)
        ? '+' + ac : ac;
      acEl.innerHTML = ac === ''
        ? label + ' <span class="none">&mdash;</span>'
        : label + ' <b>' + escapeHtml(shown) + '</b>';
    }
    if (wtEl) {
      const w = val('.weight');
      if (w === '') { wtEl.textContent = ''; wtEl.title = ''; }
      else {
        // THE FIELD HOLDS THE WHOLE SUIT'S WEIGHT and always will -- that is the
        // anchor rule, and core_armor.json is its source. But a chip reading
        // "40 lb" beside a breastplate is a lie about what the character is
        // carrying, and encumbrance was already counting 20. Show what he
        // actually bears; keep the printed figure in the tooltip.
        const raw = parseFloat(w) || 0;
        let eff = raw, why = [];
        const hqR = val('.armor-hq-race');
        if (hqR && typeof getHighQualityArmor === 'function') {
          const hqW = getHighQualityArmor(hqR, val('.armor-type'));
          if (hqW && hqW.weightMult !== 1) { eff *= hqW.weightMult; why.push(hqW.label); }
        }
        const pmS = (typeof PIECEMEAL_SLOTS !== 'undefined')
          ? PIECEMEAL_SLOTS.find(s => s.label === (val('.armor-slot') || 'Armor')) : null;
        if (pmS && typeof getPiecemealPiece === 'function') {
          const pmP = getPiecemealPiece(val('.armor-type'), pmS.key);
          if (pmP) { eff *= pmP.weightMult; why.push(pmS.label); }
        }
        // MUST MATCH renderEncumbrance's arithmetic exactly, in the same order.
        // Two places computing one number is the drift risk here; if either
        // changes, change both.
        const round = n => (Math.round(n * 100) / 100);
        wtEl.textContent = round(eff) + ' lb';
        wtEl.title = (eff !== raw)
          ? round(eff) + ' lb carried \u2014 ' + why.join(', ') +
            '.\nThe field holds ' + raw + ' lb, the printed weight of the full suit.'
          : '';
      }
    }

    // PHBR1. A note on the COLLAPSED row, so a piecemeal piece announces itself
    // without expanding the card -- the AC it contributes is not its base AC and
    // that needs saying where it is read.
    const pmNoteEl = el.querySelector('.arm-pm-note');
    if (pmNoteEl) {
      const pmS2 = (typeof PIECEMEAL_SLOTS !== 'undefined')
        ? PIECEMEAL_SLOTS.find(s => s.label === (val('.armor-slot') || 'Armor')) : null;
      if (!pmS2) { pmNoteEl.textContent = ''; pmNoteEl.title = ''; }
      else {
        const pmP2 = (typeof getPiecemealPiece === 'function')
          ? getPiecemealPiece(val('.armor-type'), pmS2.key) : null;
        if (!pmP2) {
          // PHBR1 off, or a type with no row. The piece stays and grants nothing.
          pmNoteEl.textContent = 'piecemeal \u2014 no value';
          pmNoteEl.title = 'This piece contributes no AC: either PHBR1 is switched off ' +
                           'in Settings, or this armour type has no piecemeal values ' +
                           '(elven chain is magical and cannot be split).';
        } else {
          pmNoteEl.textContent = 'piecemeal \u00b7 ' + pmS2.label + ' \u00b7 ' +
                                 (pmP2.bonus ? '\u2212' + pmP2.bonus + ' AC' : 'no AC');
          pmNoteEl.title = 'PHBR1 pp.111-112. Worn as ' + pmS2.label.toLowerCase() +
                           ', this piece contributes ' + pmP2.bonus + ' to your armour ' +
                           'total rather than setting your AC.' +
                           (pmP2.bonus ? '' : ' The table gives this type 0 in that column ' +
                           '\u2014 leather sleeves only help if you have both.');
        }
      }
    }
  };
  syncArmorLine();
  ['.base-ac', '.weight'].forEach(sel => {
    const f = el.querySelector(sel);
    if (f) f.addEventListener('input', syncArmorLine);
  });
  // Picking a type PREFILLS both fields, and that happens on 'change' rather
  // than 'input', so the row would otherwise show the old numbers until the
  // next keystroke.
  const armorTypeSelEl = el.querySelector('.armor-type');
  if (armorTypeSelEl) armorTypeSelEl.addEventListener('change', syncArmorLine);
  // The slot and the high-quality race both change the effective weight and the
  // piecemeal note, so both must refresh the line. Shipping the wiring with the
  // feature -- this is the failure recorded at the top of section 7.
  const slotSelEl = el.querySelector('.armor-slot');
  if (slotSelEl) slotSelEl.addEventListener('change', syncArmorLine);
  const hqSelEl = el.querySelector('.armor-hq-race');
  if (hqSelEl) hqSelEl.addEventListener('change', syncArmorLine);

  // Enchanted toggle. HIDES, NEVER CLEARS -- unticking must not destroy a bonus
  // the player recorded. What makes an unticked item mundane is the calculation
  // side ignoring the value, not the value being gone.
  const armorMagicChk    = el.querySelector('.is-magical');
  
  // The badge tracks BOTH the tick and the bonus value, so it is refreshed from
  // one place that every relevant control calls.
  const armorBadgeText = () => {
    const n = parseFloat((el.querySelector('.ac-bonus') || {}).value);
    return (!isNaN(n) && n !== 0) ? '(' + magicSign(n) + ')' : '';
  };
  // See makeAmmunitionNode: the CSS gates the panel body, not this function.
  const armorIdentChk = el.querySelector('.is-identified');
  const refreshArmorMagic = () => {
    const on = !!(armorMagicChk && armorMagicChk.checked);
    const known = !armorIdentChk || armorIdentChk.checked;
    updateMagicBadge(el, on, known ? armorBadgeText() : '');
  };
  if (armorIdentChk) armorIdentChk.addEventListener('change', () => {
    refreshArmorMagic(); onChange && onChange();
  });

  if (armorMagicChk) {
    armorMagicChk.addEventListener('change', () => {
      refreshArmorMagic();
      onChange && onChange();
    });
  }
  const armorAcBonusEl = el.querySelector('.ac-bonus');
  if (armorAcBonusEl) {
    // Refresh ONLY. The blanket 'input, select' listener at the end of this
    // function already reports the change, so calling onChange here too would
    // fire it twice for every keystroke.
    armorAcBonusEl.addEventListener('input', refreshArmorMagic);
  }

  // The name field grows with its contents so the badge sits immediately to the
  // right of the text rather than at the far edge of the column. An <input>
  // cannot shrink-to-fit in CSS -- there is no width:fit-content for form
  // fields -- so the width is set here in ch units, the width of a "0" in the
  // current font. With a proportional face that is an approximation, but it
  // tracks closely and costs nothing. If it ever needs to be exact, measure a
  // hidden mirror span with the input's computed font instead.
  // Clamped so an empty field is still clickable and a very long name cannot
  // push the badge into the buttons.
  const sizeArmorName = () => {
    const inp = el.querySelector('.title');
    if (!inp) return;
    const n = (inp.value || inp.placeholder || '').length;
    inp.style.width = Math.min(Math.max(n + 2, 12), 40) + 'ch';
  };
  const armorTitleEl = el.querySelector('.title');
  if (armorTitleEl) armorTitleEl.addEventListener('input', sizeArmorName);
  sizeArmorName();

  // Picking a type PREFILLS AC and weight -- an enchanted or homebrew piece
  // keeps whatever the player typed. This is the autofill-not-authority rule:
  // the stored type drives the rules either way.
  //
  // "Is it blank" is not a good enough test. Switching Plate Mail -> Leather
  // left AC 3 and 50 lbs sitting on the leather, because the fields were no
  // longer empty. So track PROVENANCE: dataset.autoVal remembers what WE last
  // wrote. If the field still holds exactly that, it is ours to overwrite or
  // clear; if it differs, the player has taken ownership and we never touch it
  // again. Mirrors fillAuto on the weapon card -- keep the two in step.
  //
  // applyTypeDefaults(false) runs at construction and returns before this, so a
  // card built from a saved character never gets an autoVal and is never
  // rewritten.
  const armorFillAuto = (selector, value) => {
    const f = el.querySelector(selector);
    if (!f) return;
    const cur  = String(f.value).trim();
    const mine = f.dataset.autoVal !== undefined && cur === f.dataset.autoVal;
    if (cur !== '' && !mine) return;              // player owns it -- leave alone
    const v = (value === undefined || value === null) ? '' : String(value);
    f.value = v;
    if (v === '') delete f.dataset.autoVal;
    else          f.dataset.autoVal = v;
  };

  const typeSel = el.querySelector('.armor-type');
  const noteEl  = el.querySelector('.armor-type-note');
  const applyTypeDefaults = (userInitiated) => {
    const key = typeSel.value;
    const d = (typeof ARMOR_TYPES !== 'undefined' && ARMOR_TYPES[key])
           || (typeof SHIELD_TYPES !== 'undefined' && SHIELD_TYPES[key])
           || (typeof WEARABLE_TYPES !== 'undefined' && WEARABLE_TYPES[key]) || null;
    if (noteEl) {
      if (d && d.defends) {
        noteEl.textContent = d.defends;
        noteEl.style.color = 'var(--muted)';
        noteEl.style.display = '';
      } else {
        noteEl.style.display = 'none';
        noteEl.textContent = '';
      }
    }
    if (!d || !userInitiated) return;
    // Pass '' when the new type has no value for a field, so a stale figure left
    // by the PREVIOUS type is cleared rather than inherited. SHIELD_TYPES carry
    // no `ac` -- a shield's bonus is not a base AC -- so picking one clears it.
    armorFillAuto('.base-ac', typeof d.ac     === 'number' ? d.ac     : '');
    armorFillAuto('.weight',  typeof d.weight === 'number' ? d.weight : '');
    // Keep the wear slot consistent with the chosen type.
    const slotEl = el.querySelector('.armor-slot');
    if (slotEl) {
      if (d.size) slotEl.value = 'Shield';
      else if (d.slot) slotEl.value = d.slot;
      else if (typeof ARMOR_TYPES !== 'undefined' && ARMOR_TYPES[key]) slotEl.value = 'Armor';
    }
  };
  applyTypeDefaults(false);

  // PHBR1 pp.110-111. The note beside the dropdown. Refreshed on BOTH controls,
  // because the answer depends on the pair: gnomish is fine on studded leather
  // and impossible on chain, so changing either the race or the armour TYPE can
  // turn the advisory on or off.
  //
  // ADVISORY, NEVER BLOCKING. A race that cannot make this type as high-quality
  // is warned about and nothing is prevented -- PHBR1 p.37's licence to modify
  // applies here as everywhere, and a DM may simply have decided otherwise.
  const hqSel  = el.querySelector('.armor-hq-race');
  const hqNote = el.querySelector('.armor-hq-note');
  function syncHqNote() {
    if (!hqNote) return;
    const race = hqSel ? hqSel.value : '';
    if (!race || typeof getHighQualityArmor !== 'function') {
      hqNote.innerHTML = ''; return;
    }
    const hq = getHighQualityArmor(race, (typeSel || {}).value || '');
    if (!hq) {
      // The supplement is switched off. Say so rather than going silent, or the
      // stored race reads as having no effect for no visible reason.
      hqNote.innerHTML = '<span style="color:var(--warning, #e0a34a);">' +
        'PHBR1 is switched off in Settings, so this grants nothing. The marking is kept.' +
        '</span>';
      return;
    }
    let h = escapeHtml(hq.blurb);
    if (hq.typeNotMade) {
      const allowed = (hq.allows || []).map(k =>
        (typeof ARMOR_TYPES !== 'undefined' && ARMOR_TYPES[k]) ? ARMOR_TYPES[k].label : k);
      h = '<span style="color:var(--warning, #e0a34a);">' + escapeHtml(hq.label) +
          ' armorers do not make this type as high-quality' +
          (allowed.length ? ' \u2014 only ' + escapeHtml(allowed.join(', ')) : '') +
          '.</span> ' + h;
    }
    // Shields gain nothing at all from being high-quality (p.111), unless the
    // Damage to Armor rules are in use -- and those are not built.
    const slotNow = ((el.querySelector('.armor-slot') || {}).value) || 'Armor';
    if (slotNow === 'Shield') {
      h = '<span style="color:var(--muted);">A high-quality shield grants no bonus ' +
          'at all (PHBR1 p.111).</span> ' + h;
    }
    hqNote.innerHTML = h;
  }
  syncHqNote();
  if (hqSel) hqSel.addEventListener('change', () => { syncHqNote(); onChange && onChange(); });

  typeSel.addEventListener('change', () => {
    applyTypeDefaults(true);
    syncHqNote();
    onChange && onChange();
  });

  el.querySelector('.rm').onclick = ()=>{
    // Capture the parent BEFORE removing -- afterwards el is detached and
    // closest() cannot find the sheet root.
    const sheetRoot = el.closest('.sheet-container');
    el.remove();
    onChange && onChange();
    // .remove() fires no input/change event, so the delegated armor listener
    // never sees it.
    if (sheetRoot && typeof renderThiefSkills === 'function') renderThiefSkills(sheetRoot);
    if (sheetRoot && typeof renderRangerStealth === 'function') renderRangerStealth(sheetRoot);
  };
  el.querySelectorAll('input, select').forEach(inp =>
    inp.addEventListener('input', ()=>onChange && onChange())
  );
  el.querySelector('.equipped').addEventListener('change', ()=>onChange && onChange());
  el.querySelector('.armor-slot').addEventListener('change', ()=>{
    // The shield caveat in the high-quality note depends on the SLOT, not the type.
    syncHqNote();
    onChange && onChange();
  });
  return el;
}

// Helper function to apply archive filtering based on toggle state
function applyArchiveFilter(root, listSelector, toggleSelector, statusSelector) {
  const list = root.querySelector(listSelector);
  const toggle = root.querySelector(toggleSelector);
  if (!list || !toggle) return;
  
  const showArchived = toggle.checked;
  
  Array.from(list.children).forEach(item => {
    const statusSelect = item.querySelector(statusSelector);
    const status = statusSelect ? statusSelect.value : 'Active';
    const isArchived = status !== 'Active';
    
    if (showArchived) {
      item.style.display = '';
      if (isArchived) {
        item.style.opacity = '0.6';
        item.style.background = 'rgba(255,255,255,0.02)';
      } else {
        item.style.opacity = '';
        item.style.background = '';
      }
    } else {
      item.style.display = isArchived ? 'none' : '';
      item.style.opacity = '';
      item.style.background = '';
    }
  });
}

// ===== Mounts & Vehicles =====
// === MOVING BETWEEN BONDED AND UNBONDED ===
//
// The two record shapes overlap but are not identical -- unbonded-only fields
// are type, cost and morale; bonded-only are bond, loyalty and isMount. A move
// that only copied the fields the destination UI displays would silently drop
// the rest, so a round trip would lose data.
//
// Instead the WHOLE record travels. Each node stashes the object it was built
// from on el._data, and a move merges the current DOM values over that. Fields
// the destination cannot display ride along invisibly and come back if the
// record is ever moved again.
function readNodeFields(el, prefix, fields){
  const out = {};
  fields.forEach(f => {
    const node = el.querySelector('.' + prefix + '-' + f.cls);
    if(!node) return;
    out[f.key] = (node.type === 'checkbox') ? !!node.checked : node.value;
  });
  return out;
}

const MOUNT_NODE_FIELDS = [
  {key:'name',cls:'name'},{key:'type',cls:'type'},{key:'hp',cls:'hp'},{key:'ac',cls:'ac'},
  {key:'movement',cls:'movement'},{key:'capacity',cls:'capacity'},{key:'cost',cls:'cost'},
  {key:'status',cls:'status'},{key:'species',cls:'species'},{key:'hd',cls:'hd'},
  {key:'thac0',cls:'thac0'},{key:'attacks',cls:'attacks'},{key:'morale',cls:'morale'},
  {key:'str',cls:'str'},{key:'dex',cls:'dex'},{key:'con',cls:'con'},{key:'int',cls:'int'},
  {key:'wis',cls:'wis'},{key:'cha',cls:'cha'},{key:'per',cls:'per'},{key:'com',cls:'com'},
  {key:'abilities',cls:'abilities'},{key:'notes',cls:'notes'}
];

const COMPANION_NODE_FIELDS = [
  {key:'name',cls:'name'},{key:'species',cls:'species'},{key:'hd',cls:'hd'},{key:'hp',cls:'hp'},
  {key:'ac',cls:'ac'},{key:'thac0',cls:'thac0'},{key:'attacks',cls:'attacks'},
  {key:'alignment',cls:'alignment'},{key:'str',cls:'str'},{key:'dex',cls:'dex'},
  {key:'con',cls:'con'},{key:'int',cls:'int'},{key:'wis',cls:'wis'},{key:'cha',cls:'cha'},
  {key:'per',cls:'per'},{key:'com',cls:'com'},{key:'loyalty',cls:'loyalty'},
  {key:'bond',cls:'bond'},{key:'status',cls:'status'},{key:'isMount',cls:'is-mount'},
  {key:'movement',cls:'movement'},{key:'capacity',cls:'capacity'},
  {key:'abilities',cls:'abilities'},{key:'notes',cls:'notes'}
];

function moveMountToBonded(el, onChange){
  const merged = Object.assign({}, el._data || {}, readNodeFields(el, 'mount', MOUNT_NODE_FIELDS));
  // Anything in the unbonded list is by definition something you ride or drive.
  merged.isMount = true;
  const root = el.closest('.sheet-container');
  const list = root && root.querySelector('.companions-list');
  if(!list) return;
  list.appendChild(makeCompanionNode(merged, onChange));
  el.remove();
  onChange && onChange();
}

function moveBondedToUnbonded(el, onChange){
  const merged = Object.assign({}, el._data || {}, readNodeFields(el, 'companion', COMPANION_NODE_FIELDS));
  const root = el.closest('.sheet-container');
  const list = root && root.querySelector('.mounts-list');
  if(!list) return;
  list.appendChild(makeMountNode(merged, onChange));
  el.remove();
  onChange && onChange();
}

function makeMountNode(m, onChange){
  const el = document.createElement('div');
  el.className = 'item follower';
  // Kept so fields this UI does not display survive a move -- see the
  // comment above readNodeFields.
  el._data = m || {};
  
  el.innerHTML =
    '<div class="fol-rail"></div>' +
    '<div class="fol-r1">' +
      '<input class="mount-name" placeholder="e.g., Shadowfax" value="'+escapeHtml(m.name||'')+'">' +
      '<select class="mount-status">' +
        '<option value="Active"'+((m.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
        '<option value="Retired"'+((m.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
        '<option value="Deceased"'+((m.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
        '<option value="Missing"'+((m.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
      '</select>' +
      '<select class="mount-type" style="width:120px;">' +
        '<option value=""'+((m.type||'')==''?' selected':'')+'>--</option>' +
        '<option value="Animal"'+((m.type||'')==='Animal'?' selected':'')+'>Animal</option>' +
        '<option value="Wagon"'+((m.type||'')==='Wagon'?' selected':'')+'>Wagon</option>' +
        '<option value="Ship"'+((m.type||'')==='Ship'?' selected':'')+'>Ship</option>' +
        '<option value="Other Transport"'+((m.type||'')==='Other Transport'?' selected':'')+'>Other Transport</option>' +
      '</select>' +
	  '<button class="move-to-bonded" style="padding:8px 10px;font-size:11px;" title="Move to Bonded Mounts &amp; Animal Companions. Nothing is lost -- fields that list does not show are kept.">&rarr; Bonded</button>' +
      '<button class="toggle-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div class="fol-r2">' +
      '<span class="fol-stat">hp<input class="mount-hp" type="number" placeholder="0" value="'+escapeHtml(m.hp||'')+'"></span>' +
      '<span class="fol-stat">ac<input class="mount-ac" type="number" placeholder="10" value="'+escapeHtml(m.ac||'')+'"></span>' +
      '<span class="fol-stat">mv<input class="mount-movement" placeholder="e.g., 24" value="'+escapeHtml(m.movement||'')+'"></span>' +
      '<span class="fol-stat wide">carries<input class="mount-capacity" placeholder="e.g., 400 lbs" value="'+escapeHtml(m.capacity||'')+'"></span>' +
    '</div>' +
    '<div class="mount-details" style="display:none;margin-top:8px;">' +
    '<div class="mount-animal-fields" style="display:'+(m.type==='Animal'?'block':'none')+';margin-bottom:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Species</label>' +
          '<input class="mount-species" placeholder="e.g., War Horse" value="'+escapeHtml(m.species||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">HD</label>' +
          '<input class="mount-hd" placeholder="e.g., 3+3" value="'+escapeHtml(m.hd||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">THAC0</label>' +
          '<input class="mount-thac0" type="number" placeholder="20" value="'+escapeHtml(m.thac0||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);"># of Attacks</label>' +
          '<input class="mount-attacks" placeholder="e.g., 3" value="'+escapeHtml(m.attacks||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Morale</label>' +
          '<input class="mount-morale" type="number" placeholder="--" value="'+escapeHtml(m.morale||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="mount-str" type="number" placeholder="--" value="'+escapeHtml(m.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="mount-dex" type="number" placeholder="--" value="'+escapeHtml(m.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="mount-con" type="number" placeholder="--" value="'+escapeHtml(m.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="mount-int" type="number" placeholder="--" value="'+escapeHtml(m.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="mount-wis" type="number" placeholder="--" value="'+escapeHtml(m.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="mount-cha" type="number" placeholder="--" value="'+escapeHtml(m.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="mount-per" type="number" placeholder="--" value="'+escapeHtml(m.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="mount-com" type="number" placeholder="--" value="'+escapeHtml(m.com||'')+'" style="width:100%;"></div>' +
      '</div>' +
    '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Cost</label>' +
          '<input class="mount-cost" placeholder="e.g., 250 gp" value="'+escapeHtml(m.cost||'')+'" style="width:100%;"></div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Special Abilities</label>' +
      '<textarea class="mount-abilities" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+escapeHtml(m.abilities||'')+'</textarea>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="mount-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+escapeHtml(m.notes||'')+'</textarea>' +
    '</div>';
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
  const setRail = ()=>{
    const v = (el.querySelector('.mount-status').value || 'Active').toLowerCase();
    el.classList.remove('st-retired','st-missing','st-deceased');
    if(v !== 'active') el.classList.add('st-' + v);
  };
  setRail();
  el.querySelector('.mount-status').addEventListener('change', setRail);

  const detailsDiv = el.querySelector('.mount-details');
  const abilitiesArea = el.querySelector('.mount-abilities');
  const notesArea = el.querySelector('.mount-notes');
  
  const expandTextarea = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 60) + 'px';
  };
  
  const toBondedBtn = el.querySelector('.move-to-bonded');
  if(toBondedBtn){
    toBondedBtn.onclick = ()=> moveMountToBonded(el, onChange);
  }

  toggleBtn.onclick = ()=>{
    const isOpen = detailsDiv.style.display !== 'none';
    detailsDiv.style.display = isOpen ? 'none' : 'block';
    toggleBtn.textContent = isOpen ? 'Details' : 'Hide';
    
    // Expand textareas when opening details
    if(!isOpen){
      setTimeout(()=>{
        expandTextarea(abilitiesArea);
        expandTextarea(notesArea);
      }, 0);
    }
  };
  
  // Input event listeners for live expansion
  abilitiesArea.addEventListener('input', ()=>expandTextarea(abilitiesArea));
  notesArea.addEventListener('input', ()=>expandTextarea(notesArea));
  
  // Remove button with confirmation
  el.querySelector('.rm').onclick = ()=>{
    const name = el.querySelector('.mount-name').value || 'this mount';
    if(confirm(`Remove ${name}?`)){
      el.remove();
      onChange && onChange();
    }
  };
  
  // All inputs trigger onChange
  el.querySelectorAll('input, textarea, select').forEach(inp => {
    inp.addEventListener('input', ()=>onChange && onChange());
    inp.addEventListener('change', ()=>onChange && onChange());
  });
  
  // Type dropdown should show/hide animal fields
  const typeSelect = el.querySelector('.mount-type');
  const animalFields = el.querySelector('.mount-animal-fields');
  if(typeSelect && animalFields){
    typeSelect.addEventListener('change', ()=>{
      animalFields.style.display = (typeSelect.value === 'Animal') ? 'block' : 'none';
    });
  }
  
  // Status change should trigger archive filter
  const statusSelect = el.querySelector('.mount-status');
  if(statusSelect){
    statusSelect.addEventListener('change', ()=>{
      const root = el.closest('.sheet-container');
      if(root) applyArchiveFilter(root, '.mounts-list', '.show-archived-mounts', '.mount-status');
    });
  }
  
  return el;
}

// ===== Henchmen & Retainers =====
function makeHenchmanNode(h, onChange){
  const el = document.createElement('div');
  // .follower supplies the grid, the rail and the summary rows. The three
  // inline styles below were the old column layout and are now the CSS's job.
  el.className = 'item follower';

  // PHB Ch.12: henchmen "commonly receive a portion (half a normal share) of
  // all treasure and magic found on adventures", so a NEW card opens on Half
  // share. A LOADED record is left exactly as saved -- an h.share of '' is a
  // player who deliberately picked "--", and ONLY an absent key means a card
  // that has never been filled in. Do not simplify this to (h.share || ...),
  // which would silently overwrite every deliberate "--" on the next load.
  const sh = (h.share === undefined || h.share === null) ? 'Half share' : h.share;

  el.innerHTML =
    '<div class="fol-rail"></div>' +
    '<div class="fol-r1">' +
      '<input class="henchman-name" placeholder="e.g., Garrett the Bold" value="'+escapeHtml(h.name||'')+'">' +
      '<select class="henchman-status fol-status" style="font-size:11px;padding:2px 6px;">' +
        '<option value="Active"'+((h.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
        '<option value="Retired"'+((h.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
        '<option value="Deceased"'+((h.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
        '<option value="Missing"'+((h.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
      '</select>' +
      '<button class="toggle-details btn-quiet">Details</button>' +
      '<button class="rm btn-danger">Remove</button>' +
    '</div>' +
    '<div class="fol-r2">' +
      '<span class="fol-stat">hp<input class="henchman-hp" type="number" placeholder="--" value="'+escapeHtml(h.hp||'')+'"></span>' +
      '<span class="fol-stat">ac<input class="henchman-ac" type="number" placeholder="--" value="'+escapeHtml(h.ac||'')+'"></span>' +
      '<span class="fol-stat">thac0<input class="henchman-thac0" type="number" placeholder="--" value="'+escapeHtml(h.thac0||'')+'"></span>' +
      '<span class="fol-stat">loyalty<input class="henchman-loyalty" type="number" placeholder="--" title="Your Loyalty Base from PHB Table 6 modifies this. The loyalty and morale checks themselves are the DM\'s -- PHB Ch.12 refers them to the DMG." value="'+escapeHtml(h.loyalty||'')+'"></span>' +
      '<span class="fol-stat">morale<input class="henchman-morale" type="number" placeholder="--" value="'+escapeHtml(h.morale||'')+'"></span>' +
      '<span class="fol-stat wide">share<select class="henchman-share">' +
        '<option value=""'+(sh===''?' selected':'')+'>--</option>' +
        '<option value="Half share"'+(sh==='Half share'?' selected':'')+'>Half share</option>' +
        '<option value="Full share"'+(sh==='Full share'?' selected':'')+'>Full share</option>' +
        '<option value="Wage only"'+(sh==='Wage only'?' selected':'')+'>Wage only</option>' +
        '<option value="Custom"'+(sh==='Custom'?' selected':'')+'>Custom</option>' +
      '</select></span>' +
    '</div>' +
    '<div class="henchman-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Race</label>' +
          '<input class="henchman-race" placeholder="e.g., Human" value="'+escapeHtml(h.race||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Class</label>' +
          '<input class="henchman-class" placeholder="e.g., Fighter" value="'+escapeHtml(h.class||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Level</label>' +
          '<input class="henchman-level" type="number" placeholder="--" value="'+escapeHtml(h.level||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="henchman-str" type="number" placeholder="--" value="'+escapeHtml(h.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="henchman-dex" type="number" placeholder="--" value="'+escapeHtml(h.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="henchman-con" type="number" placeholder="--" value="'+escapeHtml(h.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="henchman-int" type="number" placeholder="--" value="'+escapeHtml(h.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="henchman-wis" type="number" placeholder="--" value="'+escapeHtml(h.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="henchman-cha" type="number" placeholder="--" value="'+escapeHtml(h.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="henchman-per" type="number" placeholder="--" value="'+escapeHtml(h.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="henchman-com" type="number" placeholder="--" value="'+escapeHtml(h.com||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Alignment</label>' +
          alignmentSelectHTML('henchman-alignment', h.alignment) + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Equipment Held</label>' +
          '<input class="henchman-equipment" placeholder="" value="'+escapeHtml(h.equipment||'')+'" style="width:100%;"></div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="henchman-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+escapeHtml(h.notes||'')+'</textarea>' +
    '</div>';

  // Rail follows the status select. Set once on build so a loaded card is right
  // before any interaction, then on every change.
  const setRail = ()=>{
    const v = (el.querySelector('.henchman-status').value || 'Active').toLowerCase();
    el.classList.remove('st-retired','st-missing','st-deceased');
    if(v !== 'active') el.classList.add('st-' + v);
  };
  setRail();
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
  const detailsDiv = el.querySelector('.henchman-details');
  toggleBtn.onclick = ()=>{
    const isOpen = detailsDiv.style.display !== 'none';
    detailsDiv.style.display = isOpen ? 'none' : 'block';
    toggleBtn.textContent = isOpen ? 'Details' : 'Hide';
  };
  
  // PHB Ch.12. The lifetime count and the level check both read this card, so
  // the banner must refresh whenever one changes. Doing it HERE is one hook
  // instead of one per call site -- loadSheet and the +Add button pass
  // different onChange handlers -- and matches the idiom the archive filter
  // below already uses.
  //
  // The remove path captures root BEFORE el.remove(); afterwards closest()
  // returns null and the count would never drop back under the limit.
  const refreshLimits = (rootEl)=>{
    const r = rootEl || el.closest('.sheet-container');
    if(r && typeof renderHenchmanLimits === 'function') renderHenchmanLimits(r);
  };

  // Remove button with confirmation
  el.querySelector('.rm').onclick = ()=>{
    const name = el.querySelector('.henchman-name').value || 'this henchman';
    if(confirm(`Remove ${name}?`)){
      const rootBefore = el.closest('.sheet-container');
      el.remove();
      onChange && onChange();
      refreshLimits(rootBefore);
    }
  };
  
  // All inputs trigger onChange
  el.querySelectorAll('input, textarea, select').forEach(inp => {
    inp.addEventListener('input', ()=>{ onChange && onChange(); refreshLimits(); });
    inp.addEventListener('change', ()=>{ onChange && onChange(); refreshLimits(); });
  });
  
  // Status change should trigger archive filter
  const statusSelect = el.querySelector('.henchman-status');
  if(statusSelect){
    statusSelect.addEventListener('change', ()=>{
      setRail();
      const root = el.closest('.sheet-container');
      if(root) applyArchiveFilter(root, '.henchmen-list', '.show-archived-henchmen', '.henchman-status');
    });
  }
  
  // Auto-expand textarea
  const notesArea = el.querySelector('.henchman-notes');
  const expandTextarea = () => {
    notesArea.style.height = 'auto';
    notesArea.style.height = Math.max(notesArea.scrollHeight, 60) + 'px';
  };
  notesArea.addEventListener('input', expandTextarea);
  setTimeout(expandTextarea, 0);
  
  return el;
}

// ===== Followers & Hirelings =====
function makeHirelingNode(h, onChange){
  const el = document.createElement('div');
  el.className = 'item follower';

  el.innerHTML =
    '<div class="fol-rail"></div>' +
    '<div class="fol-r1">' +
      '<input class="hireling-name" placeholder="e.g., 10 Men-at-Arms" value="'+escapeHtml(h.name||'')+'">' +
      '<select class="hireling-status">' +
        '<option value="Active"'+((h.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
        '<option value="Retired"'+((h.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
        '<option value="Deceased"'+((h.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
        '<option value="Missing"'+((h.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
      '</select>' +
      '<button class="toggle-details btn-quiet">Details</button>' +
      '<button class="rm btn-danger">Remove</button>' +
    '</div>' +
    '<div class="fol-r2">' +
      '<span class="fol-stat">qty<input class="hireling-quantity" type="number" placeholder="1" value="'+escapeHtml(h.quantity||'')+'"></span>' +
      '<span class="fol-stat grow">purpose<input class="hireling-purpose" placeholder="e.g., Guard the stronghold" value="'+escapeHtml(h.purpose||'')+'"></span>' +
    '</div>' +
    '<div class="hireling-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        // PHB Ch.12 separates hirelings from followers by the shape of the
        // agreement. FIRST field on the card, because it governs how every
        // other one reads: Duration is a contract term for a hireling and
        // means nothing for a follower, who serves no term at all.
        '<div><label style="font-size:11px;color:var(--muted);">Category</label>' +
          '<select class="hireling-category" style="width:100%;" title="PHB Ch.12.&#10;&#10;HIRELING -- employed for a stated term of service or a specific task. Bound by regular pay and good treatment only; the chapter says flatly that hirelings do not serve out of any great loyalty. Freely replaced.&#10;&#10;FOLLOWER -- serves no term of contract at all. A stronghold is required to attract any. Followers appear only once and no replacements arrive for the fallen; all followers in a unit gain a level at the same time; and they do not accompany the party on adventures.&#10;&#10;Leave unset if you are not sure which a record is.">' +
            (typeof NPC_CATEGORIES !== 'undefined' ? NPC_CATEGORIES.map(c =>
              '<option value="'+escapeHtml(c.key)+'"'+((h.category||'')===c.key?' selected':'')+'>'+
              escapeHtml(c.label)+'</option>').join('') : '') +
          '</select></div>' +
        // Relabelled from "Type": this is the OCCUPATION, the thing Chapter 12
        // lists as archer, armorer, sage, spy. The stored key stays `type`.
        '<div><label style="font-size:11px;color:var(--muted);">Wage</label>' +
          '<input class="hireling-wage" placeholder="e.g., 2 gp/month" value="'+escapeHtml(h.wage||'')+'" style="width:100%;"></div>' +
        '<div><label class="hireling-duration-label" style="font-size:11px;color:var(--muted);">Duration</label>' +
          '<input class="hireling-duration" placeholder="e.g., 6 months" value="'+escapeHtml(h.duration||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Occupation</label>' +
          '<input class="hireling-type" placeholder="e.g., Men-at-Arms, Torchbearer" value="'+escapeHtml(h.type||'')+'" style="width:100%;"></div>' +
        // PHB Ch.12 gives followers the one thing most hirelings lack: they
        // "can increase in level", and every follower in a unit advances at the
        // same time. The card had THAC0 and a full ability spread but nowhere
        // to record the level itself, so the rule had no home.
        '<div><label style="font-size:11px;color:var(--muted);">Level</label>' +
          '<input class="hireling-level" type="number" placeholder="--" title="PHB Ch.12. Followers can gain levels, and ALL followers in a unit advance together -- one figure covers the whole unit. Most hirelings never advance at all." value="'+escapeHtml(h.level||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Alignment</label>' +
          alignmentSelectHTML('hireling-alignment', h.alignment) + '</div>' +
        '<div><label style="font-size:11px;color:var(--muted);">THAC0</label>' +
          '<input class="hireling-thac0" type="number" placeholder="--" value="'+escapeHtml(h.thac0||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="hireling-str" type="number" placeholder="--" value="'+escapeHtml(h.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="hireling-dex" type="number" placeholder="--" value="'+escapeHtml(h.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="hireling-con" type="number" placeholder="--" value="'+escapeHtml(h.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="hireling-int" type="number" placeholder="--" value="'+escapeHtml(h.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="hireling-wis" type="number" placeholder="--" value="'+escapeHtml(h.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="hireling-cha" type="number" placeholder="--" value="'+escapeHtml(h.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="hireling-per" type="number" placeholder="--" value="'+escapeHtml(h.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="hireling-com" type="number" placeholder="--" value="'+escapeHtml(h.com||'')+'" style="width:100%;"></div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="hireling-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+escapeHtml(h.notes||'')+'</textarea>' +
    '</div>';
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
  const detailsDiv = el.querySelector('.hireling-details');
  toggleBtn.onclick = ()=>{
    const isOpen = detailsDiv.style.display !== 'none';
    detailsDiv.style.display = isOpen ? 'none' : 'block';
    toggleBtn.textContent = isOpen ? 'Details' : 'Hide';
  };

  // PHB Ch.12: followers "do not serve for a specific term of contract", so
  // Duration means nothing for one. DIMMED, NEVER HIDDEN AND NEVER CLEARED --
  // the same rule the fallen paladin's spellbooks follow. The value goes on
  // being collected, saved and PRINTED whatever the screen shows, so a field
  // that vanished would quietly contradict the PDF.
  //
  // A Duration already filled in stays fully legible; only an EMPTY one dims.
  // Dimming text someone deliberately entered would hide the very mismatch
  // this is meant to surface.
  const setRail = ()=>{
    const v = (el.querySelector('.hireling-status').value || 'Active').toLowerCase();
    el.classList.remove('st-retired','st-missing','st-deceased');
    if(v !== 'active') el.classList.add('st-' + v);
  };
  setRail();
  el.querySelector('.hireling-status').addEventListener('change', setRail);

  const durationEl  = el.querySelector('.hireling-duration');
  const durationLab = el.querySelector('.hireling-duration-label');
  const categoryEl  = el.querySelector('.hireling-category');
  const syncDuration = ()=>{
    if(!durationEl || !categoryEl) return;
    const isFollower = categoryEl.value === 'follower';
    const hasValue   = String(durationEl.value || '').trim() !== '';
    durationEl.placeholder = isFollower
      ? 'No term \u2014 followers serve no contract'
      : 'e.g., 6 months';
    const dim = isFollower && !hasValue;
    durationEl.style.opacity = dim ? '0.45' : '';
    if(durationLab) durationLab.style.opacity = dim ? '0.45' : '';
  };
  if(categoryEl) categoryEl.addEventListener('change', syncDuration);
  if(durationEl) durationEl.addEventListener('input', syncDuration);
  syncDuration();
  
  // Remove button with confirmation
  el.querySelector('.rm').onclick = ()=>{
    const name = el.querySelector('.hireling-name').value || 'this hireling';
    if(confirm(`Remove ${name}?`)){
      el.remove();
      onChange && onChange();
    }
  };
  
  // All inputs trigger onChange
  el.querySelectorAll('input, textarea, select').forEach(inp => {
    inp.addEventListener('input', ()=>onChange && onChange());
    inp.addEventListener('change', ()=>onChange && onChange());
  });
  
  // Status change should trigger archive filter
  const statusSelect = el.querySelector('.hireling-status');
  if(statusSelect){
    statusSelect.addEventListener('change', ()=>{
      const root = el.closest('.sheet-container');
      if(root) applyArchiveFilter(root, '.hirelings-list', '.show-archived-hirelings', '.hireling-status');
    });
  }
  
  // Auto-expand textarea
  const notesArea = el.querySelector('.hireling-notes');
  const expandTextarea = () => {
    notesArea.style.height = 'auto';
    notesArea.style.height = Math.max(notesArea.scrollHeight, 60) + 'px';
  };
  notesArea.addEventListener('input', expandTextarea);
  setTimeout(expandTextarea, 0);
  
  return el;
}

// ===== Animal Companions =====
function makeCompanionNode(c, onChange){
  const el = document.createElement('div');
  el.className = 'item follower';
  // Kept so fields this UI does not display survive a move -- see the
  // comment above readNodeFields.
  el._data = c || {};
  
  el.innerHTML =
    '<div class="fol-rail"></div>' +
    '<div class="fol-r1">' +
      '<input class="companion-name" placeholder="e.g., Whiskers" value="'+escapeHtml(c.name||'')+'">' +
      '<select class="companion-status">' +
        '<option value="Active"'+((c.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
        '<option value="Retired"'+((c.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
        '<option value="Deceased"'+((c.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
        '<option value="Missing"'+((c.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
      '</select>' +
      '<button class="move-to-unbonded btn-quiet" title="Move to Unbonded Mounts &amp; Vehicles. Nothing is lost -- fields that list does not show are kept.">&rarr; Unbonded</button>' +
      '<button class="toggle-details btn-quiet">Details</button>' +
      '<button class="rm btn-danger">Remove</button>' +
    '</div>' +
    '<div class="fol-r2">' +
      '<span class="fol-stat wide">bond<select class="companion-bond">' +
        '<option value=""'+(c.bond===''?' selected':'')+'>--</option>' +
        '<option value="Familiar"'+((c.bond||'')==='Familiar'?' selected':'')+'>Familiar</option>' +
        '<option value="Animal Companion"'+((c.bond||'')==='Animal Companion'?' selected':'')+'>Animal Companion</option>' +
        '<option value="Follower"'+((c.bond||'')==='Follower'?' selected':'')+'>Follower</option>' +
        '<option value="Mount"'+((c.bond||'')==='Mount'?' selected':'')+'>Mount</option>' +
        '<option value="Vehicle"'+((c.bond||'')==='Vehicle'?' selected':'')+'>Vehicle</option>' +
      '</select></span>' +
      '<span class="fol-stat">hd<input class="companion-hd" placeholder="e.g., 2+2" value="'+escapeHtml(c.hd||'')+'"></span>' +
      '<span class="fol-stat">hp<input class="companion-hp" type="number" placeholder="--" value="'+escapeHtml(c.hp||'')+'"></span>' +
      '<span class="fol-stat">ac<input class="companion-ac" type="number" placeholder="--" value="'+escapeHtml(c.ac||'')+'"></span>' +
      '<span class="fol-stat">loyalty<input class="companion-loyalty" type="number" placeholder="--" value="'+escapeHtml(c.loyalty||'')+'"></span>' +
    '</div>' +
    '<div class="companion-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Species</label>' +
          '<input class="companion-species" placeholder="e.g., Wolf, Hawk" value="'+escapeHtml(c.species||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">THAC0</label>' +
          '<input class="companion-thac0" type="number" placeholder="--" value="'+escapeHtml(c.thac0||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Attacks</label>' +
          '<input class="companion-attacks" placeholder="e.g., 1d6/1d6" value="'+escapeHtml(c.attacks||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Alignment</label>' +
          alignmentSelectHTML('companion-alignment', c.alignment) + '</div>' +
        '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="companion-str" type="number" placeholder="--" value="'+escapeHtml(c.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="companion-dex" type="number" placeholder="--" value="'+escapeHtml(c.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="companion-con" type="number" placeholder="--" value="'+escapeHtml(c.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="companion-int" type="number" placeholder="--" value="'+escapeHtml(c.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="companion-wis" type="number" placeholder="--" value="'+escapeHtml(c.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="companion-cha" type="number" placeholder="--" value="'+escapeHtml(c.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="companion-per" type="number" placeholder="--" value="'+escapeHtml(c.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="companion-com" type="number" placeholder="--" value="'+escapeHtml(c.com||'')+'" style="width:100%;"></div>' +
      '</div>' +
      // Is Mount is deliberately INDEPENDENT of Bond Type. Bond records what the
      // creature IS -- familiar, animal companion, follower. Is Mount records
      // what it DOES. A familiar can be ridden; an animal companion can be
      // ridden. Forcing that choice through a single-select dropdown is what
      // made a ridden animal companion unrecordable.
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<label style="font-size:12px;color:var(--text);display:flex;align-items:center;gap:6px;cursor:pointer;margin:0;">' +
          '<input type="checkbox" class="companion-is-mount" '+(c.isMount?'checked':'')+' style="width:auto;margin:0;">' +
          'Is Mount &mdash; can be ridden or driven' +
        '</label>' +
      '</div>' +
      '<div class="companion-mount-fields" style="display:'+(c.isMount?'grid':'none')+';grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Movement</label>' +
          '<input class="companion-movement" placeholder="e.g., 18" value="'+escapeHtml(c.movement||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Capacity</label>' +
          '<input class="companion-capacity" placeholder="e.g., 220 lbs" value="'+escapeHtml(c.capacity||'')+'" style="width:100%;"></div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Special Abilities</label>' +
      '<textarea class="companion-abilities" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+escapeHtml(c.abilities||'')+'</textarea>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="companion-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+escapeHtml(c.notes||'')+'</textarea>' +
    '</div>';
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
  const setRail = ()=>{
    const v = (el.querySelector('.companion-status').value || 'Active').toLowerCase();
    el.classList.remove('st-retired','st-missing','st-deceased');
    if(v !== 'active') el.classList.add('st-' + v);
  };
  setRail();
  el.querySelector('.companion-status').addEventListener('change', setRail);

  const detailsDiv = el.querySelector('.companion-details');
  toggleBtn.onclick = ()=>{
    const isOpen = detailsDiv.style.display !== 'none';
    detailsDiv.style.display = isOpen ? 'none' : 'block';
    toggleBtn.textContent = isOpen ? 'Details' : 'Hide';
  };
  
  // Remove button with confirmation
  el.querySelector('.rm').onclick = ()=>{
    const name = el.querySelector('.companion-name').value || 'this companion';
    if(confirm(`Remove ${name}?`)){
      el.remove();
      onChange && onChange();
    }
  };

  const toUnbondedBtn = el.querySelector('.move-to-unbonded');
  if(toUnbondedBtn){
    toUnbondedBtn.onclick = ()=> moveBondedToUnbonded(el, onChange);
  }
  
  // All inputs trigger onChange
  el.querySelectorAll('input, textarea, select').forEach(inp => {
    inp.addEventListener('input', ()=>onChange && onChange());
    inp.addEventListener('change', ()=>onChange && onChange());
  });
  
  // Status change should trigger archive filter
  const statusSelect = el.querySelector('.companion-status');
  if(statusSelect){
    statusSelect.addEventListener('change', ()=>{
      const root = el.closest('.sheet-container');
      if(root) applyArchiveFilter(root, '.companions-list', '.show-archived-companions', '.companion-status');
    });
  }

  // Movement and Capacity only apply to something that can be ridden, so they
  // stay hidden until Is Mount is ticked. Hiding rather than removing means a
  // creature that stops being a mount keeps its recorded values.
  const isMountChk = el.querySelector('.companion-is-mount');
  const mountFields = el.querySelector('.companion-mount-fields');
  if(isMountChk && mountFields){
    isMountChk.addEventListener('change', ()=>{
      mountFields.style.display = isMountChk.checked ? 'grid' : 'none';
    });
  }
  
  // Auto-expand textareas
  const abilitiesArea = el.querySelector('.companion-abilities');
  const notesArea = el.querySelector('.companion-notes');
  const expandTextarea = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 60) + 'px';
  };
  abilitiesArea.addEventListener('input', ()=>expandTextarea(abilitiesArea));
  notesArea.addEventListener('input', ()=>expandTextarea(notesArea));
  setTimeout(()=>{
    expandTextarea(abilitiesArea);
    expandTextarea(notesArea);
  }, 0);
  
  return el;
}

// --- Weapon row dropdown builders -------------------------------------------

function weaponCategoryOptions(selected) {
  const cats = ['', 'Melee', 'Melee/Thrown', 'Thrown', 'Ranged'];
  const sel  = (selected || '').trim();
  return cats.map(c =>
    '<option value="'+c+'"'+(c.toLowerCase() === sel.toLowerCase() ? ' selected' : '')+'>'+(c || '--')+'</option>'
  ).join('');
}

function weaponTypeOptions(selected) {
  // Granular per-weapon types, grouped under <optgroup> headings by their
  // coarse Group. The option VALUE is a WEAPON_TYPES key and the LABEL is
  // display only -- nothing parses the label, so it can be reworded freely.
  //
  // 77 flat options would be unusable, and the optgroup headings double as a
  // visible statement of the coarse/granular relationship: the eleven swords
  // sit under "Sword", which is still the value the related-weapon rules and
  // the Table 35 columns reason about.
  const sel = (selected || '').trim();

  let out = '<option value="">--</option>';

  // tables.js may not have loaded, or an older copy may be cached. Degrade to
  // a bare dropdown rather than throwing and taking the whole card down.
  if (typeof WEAPON_TYPES === 'undefined' || typeof WEAPON_GROUP_ORDER === 'undefined') {
    if (sel) out += '<option value="' + escapeHtml(sel) + '" selected>' + escapeHtml(sel) + '</option>';
    return out;
  }

  // A stored value that is not a key is either a pre-migration coarse value
  // ("Sword") or something typed by hand. Keep it as its own option, flagged,
  // so it displays honestly and survives a save instead of being silently
  // dropped to blank. The migration in a later step clears these out.
  if (sel && !WEAPON_TYPES[sel]) {
    out += '<option value="' + escapeHtml(sel) + '" selected>' + escapeHtml(sel) + ' (legacy)</option>';
  }

  WEAPON_GROUP_ORDER.forEach(group => {
    const keys = Object.keys(WEAPON_TYPES).filter(k => WEAPON_TYPES[k].group === group);
    if (!keys.length) return;
    out += '<optgroup label="' + escapeHtml(group) + '">';
    keys.forEach(k => {
      out += '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' +
             escapeHtml(WEAPON_TYPES[k].label) + '</option>';
    });
    out += '</optgroup>';
  });

  return out;
}

function weaponProficiencyOptions(selected) {
  // "auto" derives status from _weaponProfs using the PHB related-weapons list.
  // The other three are DM/kit overrides -- the PHB explicitly leaves related
  // weapon decisions to the DM, and kits or magic items can grant proficiency
  // the tool cannot see.
  const opts = {
    auto:       'Auto',
    proficient: 'Proficient',
    related:    'Related',
    none:       'Not Proficient'
  };
  const sel = (selected || 'auto').trim().toLowerCase();
  return Object.keys(opts).map(k =>
    '<option value="'+k+'"'+(k === sel ? ' selected' : '')+'>'+opts[k]+'</option>'
  ).join('');
}

function weaponStrBonusOptions(selected, category, wtype) {
  // Fall back to the PHB default for this category/type when the weapon has no
  // explicit setting (legacy rows, or freshly added weapons).
  const fallback = (typeof getDefaultWeaponStrMode === 'function')
    ? getDefaultWeaponStrMode(category, wtype)
    : 'exceptional';
  const sel = (selected || fallback).trim().toLowerCase();

  const labels = {
    none:        'None',
    standard:    'Standard',
    exceptional: 'Exceptional'
  };

  return ['none', 'standard', 'exceptional'].map(m =>
    '<option value="'+m+'"'+(m === sel ? ' selected' : '')+'>'+labels[m]+'</option>'
  ).join('');
}

// Attacks per round: every value 2e actually produces. Kept as a dropdown
// rather than free text because the notes field has historically collected
// things like "num att 32", which is 3/2 written without the slash.
function weaponAttacksOptions(sel) {
  // PHB Table 35 needs 1/2, 4, 5 and 6 as well: a 1st-level heavy crossbow
  // specialist fires once every two rounds, and a 13th-level dart specialist
  // throws six times a round.
  const vals = ['', '1/2', '1', '3/2', '2', '5/2', '3', '4', '5', '6'];
  return vals.map(v =>
    '<option value="' + v + '"' + (String(sel || '') === v ? ' selected' : '') + '>' +
    (v === '' ? 'Auto' : v) + '</option>'
  ).join('');
}

// Size override. Blank defers to core_wp.json, which only resolves when the
// weapon's name matches the book exactly.
function weaponSizeOptions(sel) {
  const vals = ['', 'S', 'M', 'L'];
  return vals.map(v =>
    '<option value="' + v + '"' + (String(sel || '') === v ? ' selected' : '') + '>' +
    (v === '' ? 'Auto' : v) + '</option>'
  ).join('');
}

// PHBR1 pp.62-63 and 93. Stored on the WEAPON, not the character: a fighter can
// carry a spear he uses two-handed and a katana he uses in one, and the grip
// belongs to each weapon independently. Same reasoning as `offhand`.
//
// Blank is AUTO, not "one-handed", so that a weapon which does not care about
// grip stays untouched. core_wp.json was normalised in the same pass so that the
// main Damage columns always hold the ONE-HANDED line -- before that, Harpoon,
// Javelin and Bastard Sword held their two-handed figures, and the bastard sword
// record was internally mixed, carrying a one-handed speed factor beside
// two-handed damage.
// A label and its control as ONE flex item, so a wrapping row can never leave a
// heading stranded above the wrong control. Wrapping in a <label> also makes the
// heading a hit target for its own field, which matters on a phone.
function wpnField(label, width, inner) {
  return '<label style="width:' + width + 'px;display:flex;flex-direction:column;' +
           'gap:2px;align-items:center;">' +
           '<span style="font-size:11px;color:var(--muted);white-space:nowrap;">' +
             label +
           '</span>' + inner +
         '</label>';
}

function weaponGripOptions(sel) {
  const vals = [['', 'Auto'], ['1h', 'One-handed'], ['2h', 'Two-handed']];
  return vals.map(v =>
    '<option value="' + v[0] + '"' + (String(sel || '') === v[0] ? ' selected' : '') + '>' +
    v[1] + '</option>'
  ).join('');
}

// Fill a weapon Group filter dropdown from WEAPON_GROUP_ORDER.
//
// Both browsers' option lists were written by hand and had drifted badly: the
// Learn browser offered 9 of the 21 groups, the inventory browser 13, and both
// carried phantom values ("Club/Mace", "Other") matching no weapon at all. A
// missing group could not be filtered to; a phantom one silently returned an
// empty list, which reads as "no such weapons exist" rather than as a bug.
//
// Generated from the one ordered list in tables.js so the two can never diverge
// from each other or from the data again. REBUILDS rather than appends, so it
// is idempotent and safe to call more than once.
function populateWeaponGroupFilter(sel) {
  if (!sel || typeof WEAPON_GROUP_ORDER === 'undefined') return;

  // The two browsers word the leading option differently ("All Groups" vs
  // "All Types"), so it is preserved rather than imposed.
  const first    = sel.querySelector('option[value=""]');
  const allLabel = first ? first.textContent : 'All Groups';
  const current  = sel.value;

  sel.innerHTML = '<option value="">' + allLabel + '</option>' +
    WEAPON_GROUP_ORDER.map(g => '<option value="' + g + '">' + g + '</option>').join('');

  // Keep the player's selection across a rebuild -- unless it was one of the
  // phantom values, which have nothing to restore to.
  if (current && WEAPON_GROUP_ORDER.indexOf(current) !== -1) sel.value = current;
}

// Which granular type a saved weapon record represents.
//
// Migration lives here rather than in loadSheet because every path that builds
// a weapon row goes through makeWeaponNode -- load, manual add, and the browser
// -- so one resolver covers all three and none of them can drift.
function resolveWeaponTypeKey(data) {
  const stored = (data.weaponTypeKey || '').trim();
  const coarse = (data.wtype || '').trim();

  // 1. A stored granular key always wins. THIS IS THE ANCHOR -- the whole point
  //    of the field is that it survives whatever the player names the weapon.
  if (stored && typeof getWeaponTypeData === 'function' && getWeaponTypeData(stored)) {
    return stored;
  }

  // 2. A pre-migration record carries only a coarse group and a free-text name,
  //    and the name is where the specificity actually lives. Infer it once.
  if (typeof inferWeaponTypeKey === 'function') {
    const guess = inferWeaponTypeKey(data.name);
    if (guess) {
      // GUARD: if the record already asserted a coarse group and the name lands
      // in a DIFFERENT one, the name is misleading -- something recorded as a
      // Sword but flavour-named "...Dagger of the Sea". Do not assert a specific
      // weapon we are not confident about; fall through and let the player pick.
      const g = (typeof getWeaponGroup === 'function') ? getWeaponGroup(guess, '') : '';
      if (!coarse || !g || g.toLowerCase() === coarse.toLowerCase()) return guess;
    }
  }

  // 3. Nothing recognisable. Keep the coarse value -- weaponTypeOptions renders
  //    it as "(legacy)" so it reads honestly, and getWeaponGroup passes it
  //    straight through, so the related-weapon rules keep working in the
  //    meantime. Never blank out data we cannot improve on.
  return coarse;
}

function makeWeaponNode(data={}, onChange){
  // Resolved once, up front, so the Type dropdown and the STR-mode default can
  // never disagree about what this weapon is.
  const wTypeKey = resolveWeaponTypeKey(data);

  const el = document.createElement('div');
  // See makeAmmunitionNode for what 'gear' opts into. The inline
  // flexDirection/alignItems are removed rather than left dead: an inline style
  // beats the stylesheet, and alignItems:stretch would override the grid's
  // align-items:center on every row.
  el.className = 'item gear';
  // MIGRATION -- NOT OPTIONAL. Records written before the Enchanted checkbox
  // existed carry bonuses but no isMagical flag. Any non-zero value among the
  // three counts as enchanted, or every magic weapon on every saved character
  // would load unticked with its numbers hidden. Once the flag exists it wins,
  // so unticking a +1 weapon and saving is respected on the next load.
  // See makeAmmunitionNode: a missing flag reads as IDENTIFIED.
  const weaponIdentified = (data.identified !== undefined) ? !!data.identified : true;
  const weaponIsMagical = (data.isMagical !== undefined)
    ? !!data.isMagical
    : ((parseFloat(data.magicBonus) || 0) !== 0 ||
       (parseFloat(data.hitAdj)     || 0) !== 0 ||
       (parseFloat(data.dmgAdj)     || 0) !== 0);

  // Badge text at build time. The live version is weaponBadgeText() in the
  // wiring below; this one only has to cover the initial render.
  // An ordinary +2 reads "(+2)". A weapon whose effects diverge from its
  // enchantment -- Swordchucks +5 granting only +1 to hit -- reads "(+5: +1/+0)"
  // so the collapsed card cannot mislead. Enchanted with no plus at all falls
  // back to the dot, since "(+0)" reads as worthless.
  const weaponInitialBadge = (() => {
    const num = s => { const v = parseFloat(s); return isNaN(v) ? null : v; };
    const m  = num(data.magicBonus) || 0;
    const h  = num(data.hitAdj), d = num(data.dmgAdj);
    const eh = (h === null) ? m : h, ed = (d === null) ? m : d;
    if (m === 0 && eh === 0 && ed === 0) return '';
    // Keep in step with weaponBadgeText -- see the note there.
    if ((eh === m && ed === m) || (eh === 0 && ed === 0)) return '(' + magicSign(m) + ')';
    return '(' + magicSign(m) + ': ' + magicSign(eh) + '/' + magicSign(ed) + ')';
  })();

  el.innerHTML =
    // The rail carries PROFICIENCY, painted by resolveWeaponProficiency in
    // calc.js. Left classless here: the resolver owns it, and giving it a
    // starting colour would mean two places deciding the same thing.
    '<div class="rail"></div>' +
    '<div class="row1">' +
      // Both chips are <label>s wrapping the REAL checkboxes, so .equipped and
      // .weapon-offhand keep working and collectSheet is untouched. The label
      // makes the whole pill a hit target, which matters far more on a phone.
      '<label class="chip state">' +
        '<input type="checkbox" class="equipped" '+(data.equipped?'checked':'')+'>' +
        '<span class="on">Equipped</span><span class="off">Unequipped</span>' +
      '</label>' +
      // PHB Ch.9. Deliberately on the IDENTITY row, not behind the disclosure:
      // this carries a -2/-4 attack penalty, and a penalty hidden behind a
      // disclosure is a penalty players forget they are taking.
      '<label class="chip hand"' +
        ' title="Mark this weapon as the OFF-HAND weapon (PHB Ch.9, Attacking&#10;' +
        'With Two Weapons). Grants ONE extra attack per round, no matter how&#10;' +
        'many you already have. Applies -4 here and -2 to the main-hand weapon,&#10;' +
        'both modified by your Dexterity Reaction Adjustment -- which can bring&#10;' +
        'them to 0 but never to a bonus. Rangers in studded leather or lighter&#10;' +
        'are exempt. You cannot use a shield while fighting with two weapons.">' +
        '<input type="checkbox" class="weapon-offhand" '+(data.offhand?'checked':'')+'>' +
        '<span class="on">Off-hand</span><span class="off">Main hand</span>' +
      '</label>' +
      // Filled by resolveWeaponProficiency alongside the rail. The word carries
      // the meaning; the rail only accelerates it.
      '<span class="status"></span>' +
      '<div class="spacer"></div>' +
      '<div class="stat wpn-damage"></div>' +
      '<div class="stat wpn-weight"></div>' +
      // PHBR1 p.13. POOR IS THE ONLY AUTOMATIC BREAK of the four qualities --
      // Average, Fine and Exceptional are all explicitly the DM's discretion, so
      // they get no note. Read off the ATTACK ROLL, so no roller: the natural
      // 1-5 is already on the die the player just threw.
      (function () {
        const q = (typeof getWeaponQuality === 'function')
          ? getWeaponQuality(data.quality || '') : null;
        if (!q || !q.breakOn) return '';
        return '<div class="stat" title="' + escapeHtml(
          'PHBR1 p.13. A poor-quality weapon breaks on a natural attack roll of 1 to ' +
          q.breakOn + '. Shabbily made, and it looks it. No separate roll \u2014 read it ' +
          'off the attack die.') + '">breaks on 1\u2013' + q.breakOn + '</div>';
      })() +

      // REFERENCE ONLY, no roller. The card lives on the Equipment tab and the
      // roll is wanted mid-combat, so the button belongs with the other rollers
      // on Tools -- putting it here would send the player to a different tab on
      // every hit anyway. The note stays because this is where the weapon is
      // defined, and a rule that fires on every hit must not sit behind a
      // disclosure.
      (function () {
        const k = wTypeKey || '';
        const sh = (typeof getWeaponShatter === 'function')
          ? getWeaponShatter(data.name || '', k) : null;
        const br = sh ? null
          : ((typeof getWeaponBreak === 'function') ? getWeaponBreak(data.name || '', k) : null);
        if (!sh && !br) return '';
        const rule = sh || br;
        const thr = rule.on === 1 ? '1' : '1 or 2';
        void thr;
        // NO MATERIAL PREFIX. "BONE \u00b7 shatters on 1 or 2" was the longest label of
        // the set and wrapped row1, pushing Details and Remove onto a second line
        // and making one card taller than its neighbours. The card is titled
        // "Dagger, Bone", so the prefix restated the name; it moves to the
        // tooltip, which is also where a RENAMED weapon can still report it.
        const lab = sh ? 'shatters on ' + thr : 'breaks on ' + thr;
        const tip = sh
          ? 'PHBR1 p.101. ' + (sh.material ? 'A ' + sh.material + ' weapon. ' : '') +
            'Roll 1d6 on EVERY hit; on ' + thr + ' the weapon shatters and is ' +
            'useless. The attack still does its full damage. Roll it on the Tools tab.'
          : 'PHBR1 p.85. Roll 1d6 after ' + (br.when || 'a qualifying hit') + '; on ' + thr +
            ' the lance breaks and is useless, except as a club. Roll it on the Tools tab.';
        return '<div class="stat" title="' + escapeHtml(tip) + '">' + escapeHtml(lab) + '</div>';
      })() +
      '<div class="btns">' +
        '<button class="toggle-details">Details</button>' +
        '<button class="rm">Remove</button>' +
      '</div>' +
    '</div>' +
    // Row 2: the name alone at full card width, so a long name never truncates.
    // sizeWeaponName() still sizes the input to its contents so the badge sits
    // against the text rather than at the far edge.
    '<div class="row2">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:0 0 auto;min-width:0;">' +
      // See makeAmmunitionNode: unidentified shows the dot, never the number.
      magicBadgeHtml(weaponIsMagical, weaponIdentified ? weaponInitialBadge : '') +
    '</div>' +
    // Everything below the identity row is collapsed by default. The stats a
    // player needs mid-combat are already surfaced on the Combat Quick
    // Reference card, so the card here is for editing, not for reading.
    '<div class="weapon-details" style="display:none;">' +
    // flex-wrap so this degrades to two lines on a phone instead of overflowing
    // the card. Nothing here flexes any more -- Damage Type holds "B, P, S" and
    // was taking every pixel the row had left over.
    // ONE row of label+control PAIRS, not two parallel rows. The old markup had
    // a headings row and a controls row wrapping independently: as soon as
    // either wrapped, the headings' second line rendered directly above the
    // controls' FIRST line, so "Size" and "Grip" sat above Speed and Dmg (S-M).
    // That was already happening before Grip existed -- seven fields overflowed
    // a narrow card and Size wrapped alone. Pairing kills the class of bug
    // instead of tuning widths until it hides.
    //
    // flex-START, not flex-end: number inputs carry a spinner and are taller than
    // text inputs, so aligning the BOTTOMS left the headings sitting at different
    // heights across the row. Aligning the tops lines the headings up, which is
    // the element the eye scans.
    '<div style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px;margin-bottom:6px;">' +
      wpnField('Speed', 60,
        '<input class="speed" type="number" placeholder="" value="'+escapeHtml(data.speed||'')+'" style="width:60px;text-align:center;">') +
      wpnField('Dmg (S-M)', 90,
        '<input class="damage-sm" placeholder="" value="'+escapeHtml(data.damageSM||'')+'" style="width:90px;text-align:center;">') +
      wpnField('Dmg (L)', 90,
        '<input class="damage-l" placeholder="" value="'+escapeHtml(data.damageL||'')+'" style="width:90px;text-align:center;">') +
      wpnField('Weight (lbs)', 80,
        '<input class="weight" type="number" step="0.1" placeholder="" value="'+escapeHtml(data.weight||'')+'" style="width:80px;text-align:center;">') +
      wpnField('Damage Type', 100,
      '<input class="damage-type" placeholder="B, P, S" value="'+escapeHtml(data.damageType||'')+'" style="width:100px;text-align:center;" title="' +
        'Bludgeoning, Piercing or Slashing (PHB Table 44).&#10;' +
        'Some weapons carry two, e.g. P/S for a halberd.&#10;' +
        'Filled from the weapon list when you pick a Type, if left blank.">') +
      wpnField('Attacks/Rd', 100,
      '<select class="weapon-attacks" style="width:100px;" title="' +
        'Attacks per round with THIS weapon.&#10;' +
        'Blank uses the character-level Attacks/Round on the Combat tab.&#10;' +
        '3/2 means three attacks every two rounds.">' +
        weaponAttacksOptions(data.attacks) +
      '</select>') +
      wpnField('Size', 90,
      '<select class="weapon-size" style="width:90px;" title="' +
        'Weapon size (S/M/L).&#10;' +
        'Blank looks it up from the weapon list by name.&#10;' +
        'Set it for a custom weapon, or one whose name does not match the book.">' +
        weaponSizeOptions(data.size) +
      '</select>') +
      // PHBR1-ONLY CONTROL. Weapon quality is a PHBR1 invention -- with the book
      // off, a DM is not handing out Fine or Exceptional weapons, so there is
      // nothing for the field to record. Wrapped rather than removed: the value
      // must survive, and collectSheet reads the DOM.
      '<div class="phbr1-only" style="display:contents;">' +
      wpnField('Quality', 190,
      '<select class="weapon-quality" style="width:190px;" title="' +
        'Weapon quality (PHBR1 pp.11-13).&#10;' +
        'NOT MAGICAL: quality never lets a weapon strike a creature that can only&#10;' +
        '  be harmed by magical weapons, and it does not reduce speed factor.&#10;' +
        '  Only the enchantment level does those.&#10;' +
        'Fine is listed twice because the book grants EITHER +1 to hit OR +1 to&#10;' +
        '  damage, not both. Exceptional gets both.&#10;' +
        'Poor breaks on a natural attack roll of 1-5; the other grades break only&#10;' +
        '  at the DM\u2019s discretion.">' +
        ((typeof WEAPON_QUALITY_OPTIONS !== 'undefined' ? WEAPON_QUALITY_OPTIONS : [])
          .map(o => '<option value="' + o.key + '"' +
                    ((data.quality || '') === o.key ? ' selected' : '') + '>' +
                    escapeHtml(o.text) + '</option>').join('')) +
      '</select>') +
      '</div>' +
      wpnField('Grip', 110,
      '<select class="weapon-grip" style="width:110px;" title="' +
        'How this weapon is held (PHBR1 pp.62-63, 93).&#10;' +
        'Only ten weapons care: harpoon, javelin, spear, long spear, trident,&#10;' +
        '  stone javelin, stone spear, katana, bastard sword, wakizashi.&#10;' +
        'They do DIFFERENT DAMAGE in one hand and in two, and the bastard&#10;' +
        '  sword also changes speed factor -- 6 in one hand, 8 in two.&#10;' +
        'Auto uses the one-handed line, which is how the records are stored.&#10;' +
        'Harmless on every other weapon.">' +
        weaponGripOptions(data.grip) +
      '</select>') +
    '</div>' +
    // Magic, Hit Adj and Dmg Adj were spread across two separate rows. Grouped
    // here they read as one idea and the card gets SHORTER, not taller.
    // Magic is the ENCHANTMENT LEVEL -- what the weapon can strike, and its
    // speed-factor reduction. The two adjustments are its EFFECTS, which can
    // diverge from it. Keeping them adjacent is what makes that legible.
    '<div class="ench-panel">' +
      '<div class="ench-head">' +
        '<label>' +
          '<input type="checkbox" class="is-magical"' + (weaponIsMagical ? ' checked' : '') + '>' +
          'Enchanted?' +
        '</label>' +
        '<label class="ench-ident">' +
          '<input type="checkbox" class="is-identified"' + (weaponIdentified ? ' checked' : '') + '>' +
          'Identified?' +
        '</label>' +
        '<span class="ench-veil">Effects unknown until identified</span>' +
      '</div>' +
      '<div class="ench-body">' +
        '<div class="ench-fields">' +
          '<div class="ench-name">' +
            '<label style="display:block;margin-bottom:3px;">True name</label>' +
            '<input class="true-name" value="'+escapeHtml(data.trueName||'')+'">' +
          '</div>' +
          '<label title="' +
            'Enchantment level -- 5 for a +5 weapon.&#10;' +
            'This is what lets the weapon harm a creature injured only by magical&#10;' +
            '  weapons, and it lowers the speed factor by 1 per plus.&#10;' +
            'Hit and damage fall back to this when left blank.">Magic' +
            '<input class="magic-bonus" type="number" placeholder="0" value="'+escapeHtml(data.magicBonus||'')+'">' +
          '</label>' +
          '<label title="' +
            'To-hit bonus granted by this weapon.&#10;' +
            'Leave blank to use the Magic value -- correct for an ordinary +N weapon.&#10;' +
            'Set it when the enchantment is not uniform: a +5 weapon that only grants&#10;' +
            '  +1 to hit takes Magic 5 and Hit Adj 1.&#10;' +
            'Strength and any non-proficiency penalty are added on top of this.">Hit Adj' +
            '<input class="weapon-hit-adj" type="number" value="'+escapeHtml(data.hitAdj!==undefined&&data.hitAdj!==null?data.hitAdj:'')+'">' +
          '</label>' +
          '<label title="' +
            'Damage bonus granted by this weapon.&#10;' +
            'Leave blank to use the Magic value.&#10;' +
            'Set to 0 for a weapon that helps you hit but not hurt.&#10;' +
            'Non-proficiency never reduces damage (PHB Table 34).">Dmg Adj' +
            '<input class="weapon-dmg-adj" type="number" value="'+escapeHtml(data.dmgAdj!==undefined&&data.dmgAdj!==null?data.dmgAdj:'')+'">' +
          '</label>' +
        '</div>' +
        '<div class="ench-effects">' +
          '<label style="display:block;margin-bottom:3px;">Effects</label>' +
          '<textarea class="ench-effects-text">'+escapeHtml(data.effects||'')+'</textarea>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="weapon-missile-head" style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div class="weapon-ammo-head" style="width:220px;text-align:center;">Ammunition</div>' +
      '<div class="weapon-range-head" style="width:160px;text-align:center;">Range (S/M/L)</div>' +
    '</div>' +
    '<div class="weapon-missile-row" style="display:flex;align-items:stretch;gap:8px;margin-bottom:6px;">' +
      '<select class="weapon-ammo" style="width:150px;" title="' +
        'Which ammunition this weapon fires, chosen from your own Ammunition list.&#10;' +
        'Its enchantment is applied to missile attacks with this weapon.&#10;' +
        'Whether an enchanted arrow stacks with an enchanted bow is a table&#10;' +
        '  ruling -- see Table Rulings in Settings.&#10;' +
        'The list is rebuilt each time you open it, so ammunition added since&#10;' +
        '  this card was drawn still appears." style="width:220px;"></select>' +
      // Fixed width, not flex:1. As the only flexing item on the row it took
      // every spare pixel, so "70/140/210" sat in a field wide enough for a
      // sentence. Trailing empty space reads better than a stretched input.
      '<input class="weapon-range" value="'+escapeHtml(data.range||'')+'" placeholder="e.g. 50/100/150" style="width:160px;text-align:center;" title="' +
        'Short / medium / long range in yards, for missile weapons.&#10;' +
        'Filled from PHB Table 45 when you pick a Type, if left blank.&#10;' +
        'Bows and slings carry their flight-arrow / bullet ranges; sheaf&#10;' +
        'arrows and sling stones are shorter -- see core_ammo.json.&#10;' +
        'Attack rolls take -2 at medium range and -5 at long.">' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="width:120px;text-align:center;">Category</div>' +
      '<div style="width:150px;text-align:center;">Type</div>' +
      '<div style="width:90px;text-align:center;">Group</div>' +
      '<div style="width:120px;text-align:center;">STR Bonus</div>' +
      // Left-aligned so the label sits over the left edge of its dropdown, and
      // flex:1 so the status can run past 120px into the space the old spacer
      // was wasting. min-width:0 plus ellipsis means it shrinks rather than
      // widening the card -- the sidebar can never be squeezed by it again.
      '<div style="flex:1;min-width:0;text-align:left;white-space:nowrap;' +
           'overflow:hidden;text-overflow:ellipsis;">Proficiency' +
        '<span class="weapon-prof-badge"></span>' +
      '</div>' +
    '</div>' +
    // flex-start, not stretch: the Proficiency column is a stack (select plus
    // its badge caption) and under stretch every other control grew to match
    // its height. Each control keeps its natural height instead.
    '<div style="display:flex;align-items:flex-start;gap:8px;">' +
      '<select class="weapon-category" style="width:120px;">' +
        weaponCategoryOptions(data.category) +
      '</select>' +
      '<select class="weapon-wtype" style="width:150px;" title="' +
        'The specific weapon this is, mechanically.&#10;' +
        'Set it on a custom or magical weapon and every rule that needs to know&#10;' +
        '  what it IS -- group, size, damage dice, speed -- resolves correctly,&#10;' +
        '  however you have named it.&#10;' +
        'Picking a Type fills BLANK fields only; anything you typed is kept.">' +
        weaponTypeOptions(wTypeKey) +
      '</select>' +
      '<input class="weapon-group" readonly tabindex="-1" value="" ' +
        'style="width:90px;text-align:center;background:var(--glass);color:var(--muted);">' +
      '<select class="weapon-str-bonus" style="width:120px;" title="' +
        'How Strength applies to this weapon (PHB).&#10;' +
        'Exceptional: full STR row incl. 18/xx -- melee and hurled weapons.&#10;' +
        'Standard: STR bonus capped at plain 18 -- an ordinary bow. A bow that&#10;' +
        '  grants exceptional-STR bonuses must be custom crafted (3-5x cost).&#10;' +
        'None: no STR adjustment -- crossbows and other mechanical devices.&#10;' +
        'Defaults are set from Category and Type; override as your DM allows.">' +
        weaponStrBonusOptions(data.strBonus, data.category,
          (typeof getWeaponGroup === 'function')
            ? getWeaponGroup(wTypeKey, wTypeKey)
            : wTypeKey) +
      '</select>' +
      '<select class="weapon-prof-status" style="width:120px;" title="' +
        'Proficiency with this weapon (PHB Table 34 penalty column).&#10;' +
        'Auto: derived from your Weapon Proficiencies, using the PHB&#10;' +
        '  related-weapons list. Related weapons cost HALF the penalty.&#10;' +
        'Proficient: no penalty (use if a kit or item grants it).&#10;' +
        'Related: half penalty -- for DMs who count similar weapons the&#10;' +
        '  PHB list omits (e.g. short sword vs long sword).&#10;' +
        'Not Proficient: force the full penalty.">' +
        weaponProficiencyOptions(data.profStatus) +
        '</select>' +
    '</div>' +
    // Notes moved down from the identity row -- at flex:2 up there it truncated
    // mid-word while consuming the width the name and badge needed.
    '<div style="font-size:11px;color:var(--muted);margin:6px 0 2px;">Notes</div>' +
    // width:100% is explicit because style.css matches on input[type=text], an
    // ATTRIBUTE selector -- a typeless <input> never gets the global rule. In a
    // flex row that went unnoticed; in a block context it falls back to the
    // browser default of about 20 characters.
    '<input class="notes" placeholder="" value="'+escapeHtml(data.notes||'')+'" style="width:100%;">' +
  '</div>';
  // Details toggle. Weapons carry four rows of fields now -- eight weapons
  // expanded is an unreadable wall -- so everything but the identity row is
  // collapsed by default, matching the henchmen, mounts and companion cards.
  const weaponToggleBtn = el.querySelector('.toggle-details');
  const weaponDetails   = el.querySelector('.weapon-details');
  if (weaponToggleBtn && weaponDetails) {
    weaponToggleBtn.onclick = () => {
      const open = weaponDetails.style.display !== 'none';
      weaponDetails.style.display = open ? 'none' : 'block';
      weaponToggleBtn.textContent = open ? 'Details' : 'Hide';
    };
  }

  // Collapsed-row damage and weight. Read LIVE from the detail inputs rather
  // than stored -- derived values are never kept separately anywhere in this
  // codebase, and a stored copy is a copy that drifts. S-M and L are both shown
  // because which one applies is decided by the target, not by the weapon.
  const syncWeaponLine = () => {
    const val = sel => ((el.querySelector(sel) || {}).value || '').trim();
    const dmgEl = el.querySelector('.wpn-damage');
    const wtEl  = el.querySelector('.wpn-weight');
    if (dmgEl) {
      const sm = val('.damage-sm'), l = val('.damage-l');
      dmgEl.textContent = (sm || l)
        ? (sm || '\u2014') + ' / ' + (l || '\u2014')
        : '';
    }
    if (wtEl) {
      const w = val('.weight');
      wtEl.textContent = w === '' ? '' : w + ' lb';
    }
  };
  syncWeaponLine();
  ['.damage-sm', '.damage-l', '.weight'].forEach(sel => {
    const f = el.querySelector(sel);
    if (f) f.addEventListener('input', syncWeaponLine);
  });

  // The name field grows with its contents so the badge sits right against the
  // text. An <input> cannot shrink-to-fit in CSS, so the width is set here in ch
  // units. Clamped so an empty field stays clickable and a long name cannot push
  // the badge into the buttons.
  // Declared BEFORE refreshWeaponMagic, which calls it.
  const sizeWeaponName = () => {
    const inp = el.querySelector('.title');
    if (!inp) return;
    const n = (inp.value || inp.placeholder || '').length;
    inp.style.width = Math.min(Math.max(n + 2, 12), 40) + 'ch';
  };

  // Enchanted toggle. HIDES, NEVER CLEARS -- unticking must not destroy the
  // three recorded values. What makes an unticked weapon mundane is the
  // calculation side ignoring them, not the values being gone.
  const wpnMagicChk    = el.querySelector('.is-magical');
  
  // Live badge text. Mirrors weaponInitialBadge above -- keep the two in step.
  const weaponBadgeText = () => {
    const num = sel => {
      const v = parseFloat((el.querySelector(sel) || {}).value);
      return isNaN(v) ? null : v;
    };
    const m  = num('.magic-bonus') || 0;
    const h  = num('.weapon-hit-adj'), d = num('.weapon-dmg-adj');
    const eh = (h === null) ? m : h, ed = (d === null) ? m : d;
    if (m === 0 && eh === 0 && ed === 0) return '';        // -> falls back to the dot
    // BOTH ADJUSTMENTS AT ZERO IS NOT A DIVERGENCE WORTH SHOWING. A +5 weapon
    // granting no combat bonus is still a +5 weapon for what it can strike and
    // for speed factor, which is what the badge reports. "(+5: +0/+0)" is three
    // zeros saying what "(+5)" says. The divergence form is kept for what it was
    // built for -- effects that differ AND are non-zero, like +5 granting +1.
    if ((eh === m && ed === m) || (eh === 0 && ed === 0)) return '(' + magicSign(m) + ')';
    return '(' + magicSign(m) + ': ' + magicSign(eh) + '/' + magicSign(ed) + ')';
  };

  // See makeAmmunitionNode: the CSS gates the panel body, not this function.
  const wpnIdentChk = el.querySelector('.is-identified');
  const refreshWeaponMagic = () => {
    const on = !!(wpnMagicChk && wpnMagicChk.checked);
    const known = !wpnIdentChk || wpnIdentChk.checked;
    updateMagicBadge(el, on, known ? weaponBadgeText() : '');
    sizeWeaponName();
  };
  if (wpnIdentChk) wpnIdentChk.addEventListener('change', () => {
    refreshWeaponMagic(); onChange && onChange();
  });

  if (wpnMagicChk) {
    wpnMagicChk.addEventListener('change', () => {
      refreshWeaponMagic();
      onChange && onChange();
    });
  }
  // All three bonus fields feed the badge, so all three refresh it. Refresh
  // ONLY -- the blanket input listener at the end of this function already
  // reports the value change, and calling onChange here would double it.
  ['.magic-bonus', '.weapon-hit-adj', '.weapon-dmg-adj'].forEach(sel => {
    const f = el.querySelector(sel);
    if (f) f.addEventListener('input', refreshWeaponMagic);
  });

  const wpnTitleEl = el.querySelector('.title');
  if (wpnTitleEl) wpnTitleEl.addEventListener('input', sizeWeaponName);
  sizeWeaponName();

  // Ammunition selector. Rebuilt on FOCUS from the character's own ammunition
  // list, so newly added ammo appears without a reload and a deleted record
  // stops being offered -- no need to hook every change to the ammo list.
  //
  // A stored selection that no longer matches any record is KEPT and marked
  // "(missing)" rather than dropped. Silently clearing it would destroy
  // information the player put there, and the marker makes a broken link
  // obvious instead of quiet.
  //
  // Options are built with textContent, not string concatenation, so ammunition
  // names -- which are free text -- need no escaping.
  const ammoSel = el.querySelector('.weapon-ammo');
  const populateWeaponAmmo = () => {
    if (!ammoSel) return;
    const chosen = ammoSel.value || data.ammo || '';
    const sheet  = el.closest('.sheet-container');
    const names  = sheet
      ? Array.from(sheet.querySelectorAll('.ammunition-list .item'))
          .map(n => ((n.querySelector('.title') || {}).value || '').trim())
          .filter(Boolean)
      : [];
    const add = (value, label) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      ammoSel.appendChild(o);
    };
    ammoSel.innerHTML = '';
    add('', 'None');
    names.forEach(n => add(n, n));
    if (chosen && names.indexOf(chosen) === -1) add(chosen, chosen + ' (missing)');
    ammoSel.value = chosen;
  };
  // A launcher fires ammunition; a sword does not, and a thrown dagger is not
  // launcher-and-ammunition. Shown for Ranged only.
  //
  // The selection is HIDDEN, never cleared -- consistent with the Enchanted
  // groups. Switching a bow to a sword and back keeps the arrow choice, and the
  // Quick Reference already ignores ammunition on anything but a missile line,
  // so a stored value on a melee weapon is inert rather than wrong.
  //
  // .weapon-category is queried inside the function rather than captured,
  // because catSel is declared further down this file and would be in the
  // temporal dead zone at this point.
  const ammoHead  = el.querySelector('.weapon-ammo-head');
  const rangeEl   = el.querySelector('.weapon-range');
  const rangeHead = el.querySelector('.weapon-range-head');
  // The row holding both. Once Attacks/Rd and Size moved up to the row above,
  // a melee weapon leaves this one entirely empty -- so hide the strip rather
  // than leave two orphaned column headings over nothing.
  const missileHead = el.querySelector('.weapon-missile-head');
  const missileRow  = el.querySelector('.weapon-missile-row');
  const syncAmmoVisibility = () => {
    const cs  = el.querySelector('.weapon-category');
    const cat = ((cs && cs.value) || '').trim().toLowerCase();

    // Ammunition: a launcher only. A sword fires nothing and a thrown dagger is
    // not launcher-and-ammunition.
    const showAmmo = cat === 'ranged';
    if (ammoSel)  ammoSel.style.display  = showAmmo ? '' : 'none';
    if (ammoHead) ammoHead.style.display = showAmmo ? '' : 'none';

    // Range: missile OR thrown. PHB Table 45 covers thrown weapons -- dagger,
    // hand axe, javelin, spear -- as well as bows and crossbows, but a pure
    // melee weapon has no range at all. Chapter 6's weapon table has no length
    // or reach column, so there is nothing to show for a longsword.
    // Blank category is treated as showing, matching how the Quick Reference
    // defaults an unclassified weapon to a missile line.
    const showRange = !cat || cat === 'ranged' || cat === 'thrown' || cat === 'melee/thrown';
    if (rangeEl)   rangeEl.style.display   = showRange ? '' : 'none';
    if (rangeHead) rangeHead.style.display = showRange ? '' : 'none';

    const showRow = showAmmo || showRange;
    if (missileHead) missileHead.style.display = showRow ? 'flex' : 'none';
    if (missileRow)  missileRow.style.display  = showRow ? 'flex' : 'none';
  };
  if (ammoSel) {
    populateWeaponAmmo();
    syncAmmoVisibility();
    // 'focus' fires before the list drops open, so the options are already
    // current by the time the player sees them.
    ammoSel.addEventListener('focus', populateWeaponAmmo);

    const catForAmmo  = el.querySelector('.weapon-category');
    const typeForAmmo = el.querySelector('.weapon-wtype');
    if (catForAmmo) catForAmmo.addEventListener('change', syncAmmoVisibility);
    // Picking a Type can FILL Category programmatically, which fires no change
    // event -- and that handler is registered after this one, so listening
    // directly would read the old value. Defer a tick so it runs afterwards.
    if (typeForAmmo) typeForAmmo.addEventListener('change', () => setTimeout(syncAmmoVisibility, 0));
  }

  // Remove button
  el.querySelector('.rm').onclick = ()=>{ el.remove(); onChange && onChange(); };
  // 'input, select' -- NOT 'input' alone. This matched <input> TAGS only, so
  // Attacks/Rd, Size and Proficiency (all <select>) never marked the sheet
  // unsaved and a change to them could be lost. The armor card already reads
  // 'input, select'; this brings the weapon card into line.
  // The Category / Type / STR Bonus selects have their own 'change' handlers
  // below and will now also fire this on 'input'. markUnsaved is idempotent, so
  // the duplication is wasteful rather than wrong.
  el.querySelectorAll('input, select').forEach(inp =>
    inp.addEventListener('input', ()=>onChange && onChange())
  );

  // The Category / Type / STR Bonus dropdowns are <select>, not <input>, so the
  // listener above misses them entirely.
  el.querySelectorAll('select').forEach(sel =>
    sel.addEventListener('change', ()=>onChange && onChange())
  );

  // Changing Category or Type re-derives the STR Bonus default -- but only if
  // the player hasn't deliberately overridden it. Once they pick a value by
  // hand we leave it alone.
  const catSel  = el.querySelector('.weapon-category');
  const typeSel = el.querySelector('.weapon-wtype');
  const strSel  = el.querySelector('.weapon-str-bonus');

  // "Blank means inherit" is invisible in an empty number box -- it reads as
  // zero. Showing the inherited value as a placeholder makes the distinction
  // legible: a greyed 5 means "5 unless you override", an entered 0 means
  // "explicitly nothing". Kept in sync with Magic, since that is the source.
  const magicEl  = el.querySelector('.magic-bonus');
  const hitAdjEl = el.querySelector('.weapon-hit-adj');
  const dmgAdjEl = el.querySelector('.weapon-dmg-adj');

  const syncAdjPlaceholders = () => {
    const enchant = parseInt(magicEl && magicEl.value, 10) || 0;
    const shown = String(enchant);
    if (hitAdjEl) hitAdjEl.placeholder = shown;
    if (dmgAdjEl) dmgAdjEl.placeholder = shown;
  };

  if (magicEl) magicEl.addEventListener('input', syncAdjPlaceholders);
  syncAdjPlaceholders();

  if (strSel) strSel.addEventListener('change', () => { strSel.dataset.userSet = '1'; });

  [catSel, typeSel].forEach(s => {
    if (!s || !strSel) return;
    s.addEventListener('change', () => {
      if (strSel.dataset.userSet === '1') return;
      if (typeof getDefaultWeaponStrMode === 'function') {
        // typeSel now holds a WEAPON_TYPES key, but getDefaultWeaponStrMode
        // reasons about the coarse group ("bow", "crossbow"). Passing the value
        // as its own fallback handles both vocabularies: a key resolves to its
        // group, a pre-migration coarse value passes through untouched.
        strSel.value = getDefaultWeaponStrMode(
          catSel.value,
          (typeof getWeaponGroup === 'function')
            ? getWeaponGroup(typeSel.value, typeSel.value)
            : typeSel.value
        );
      }
      onChange && onChange();
    });
  });

  // --- Type -> Group display, and Type -> stat prefill ------------------------
  // Group is DERIVED, never stored as its own input: there is one place to set
  // the weapon's identity, so the coarse and granular values cannot disagree.
  const groupEl = el.querySelector('.weapon-group');

  const syncWeaponGroup = () => {
    if (!groupEl) return;
    const v = typeSel ? typeSel.value : '';
    const g = (typeof getWeaponGroup === 'function') ? getWeaponGroup(v, v) : '';
    groupEl.value = g || '';
    groupEl.title = g
      ? 'Coarse weapon group, derived from Type.\u000a' +
        'Used for the PHB related-weapon half-penalty fallback and for\u000a' +
        '  Table 35 column selection.\u000a' +
        'Not editable -- change the Type and this follows.'
      : 'No group yet. Pick a Type and this fills in.';
  };

  // THE ANCHOR RULE, same as the armor card: a Type PREFILLS fields and never
  // overwrites one the player has filled. An enchanted or homebrew weapon keeps
  // its own numbers while still resolving a real group, size and dice.
  //
  // "Is it blank" is not a good enough test on its own. Switching Long Bow ->
  // Halberd left the bow's range sitting on the halberd, because the field was
  // no longer empty and the halberd has nothing to say about range. So track
  // PROVENANCE instead: dataset.autoVal remembers what WE last wrote. If the
  // field still holds exactly that, it is ours to overwrite or clear; if it
  // differs, the player has taken ownership and we never touch it again. Same
  // idea as strSel.dataset.userSet just below.
  //
  // A weapon loaded from a saved character carries no autoVal, so every filled
  // field reads as player-owned and nothing is disturbed. That is deliberate --
  // this must never be able to rewrite an existing character's weapons.
  const fillAuto = (selector, value) => {
    const f = el.querySelector(selector);
    if (!f) return;
    const cur  = String(f.value).trim();
    const mine = f.dataset.autoVal !== undefined && cur === f.dataset.autoVal;
    if (cur !== '' && !mine) return;              // player owns it -- leave alone
    const v = (value === undefined || value === null) ? '' : String(value);
    f.value = v;
    if (v === '') delete f.dataset.autoVal;
    else          f.dataset.autoVal = v;
  };

  // PHBR1 pp.62-63, 93. Ten weapons carry a second damage line for two-handed
  // use, and the bastard sword a second speed factor as well. ONE resolver,
  // called by both the Type listener and the Grip listener, so the two can never
  // disagree about which line is current -- two expressions of one rule is
  // exactly how the AC variants drifted.
  //
  // Falls back to the one-handed column whenever the two-handed one is empty,
  // which covers every weapon that does not care about grip, and the wakizashi,
  // which may be held either way for identical damage.
  const gripStats = (stats) => {
    const two  = ((el.querySelector('.weapon-grip') || {}).value || '') === '2h';
    const pick = (one, second) => (two && second) ? second : one;
    return {
      speed: pick(stats['Speed Factor'], stats['Speed Factor 2H']),
      sm:    pick(stats['Damage (S-M)'], stats['Damage (S-M) 2H']),
      l:     pick(stats['Damage (L)'],   stats['Damage (L) 2H'])
    };
  };

  // A DELIBERATE, NARROW EXCEPTION to the rule above fillAuto that a saved
  // character's weapons are never rewritten. That rule exists because changing
  // Type cascades across eight fields and could silently trash a custom weapon.
  // Grip is different: it is an explicit action on ONE weapon, and it may only
  // ever swap between the two values the BOOK prints for that weapon.
  //
  // So provenance is established by CONTENT rather than by dataset.autoVal:
  // if the field holds exactly the one-handed or exactly the two-handed figure,
  // it came from the book and is safe to swap. Anything else -- a house value, a
  // hand-typed die -- is the player's and is left alone. Without this, grip would
  // be a silent no-op on every character loaded from storage, because a saved
  // weapon carries no autoVal at all.
  const fillGrip = (selector, oneVal, twoVal, want) => {
    const f = el.querySelector(selector);
    if (!f) return;
    const cur  = String(f.value).trim();
    const book = [oneVal, twoVal]
      .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
      .map(v => String(v).trim());
    const ours = cur === '' ||
                 (f.dataset.autoVal !== undefined && cur === f.dataset.autoVal) ||
                 book.indexOf(cur) !== -1;
    if (!ours) return;                            // player owns it -- leave alone
    const v = (want === undefined || want === null) ? '' : String(want);
    f.value = v;
    if (v === '') delete f.dataset.autoVal;
    else          f.dataset.autoVal = v;
  };

  const gripSel = el.querySelector('.weapon-grip');
  if (gripSel && typeSel) {
    gripSel.addEventListener('change', () => {
      const stats = (typeof getWeaponTypeStats === 'function')
        ? getWeaponTypeStats(typeSel.value) : null;
      if (!stats) return;
      const gs = gripStats(stats);
      fillGrip('.speed',     stats['Speed Factor'], stats['Speed Factor 2H'], gs.speed);
      fillGrip('.damage-sm', stats['Damage (S-M)'], stats['Damage (S-M) 2H'], gs.sm);
      fillGrip('.damage-l',  stats['Damage (L)'],   stats['Damage (L) 2H'],   gs.l);
      if (typeof onChange === 'function') onChange();
    });
  }

  if (typeSel) {
    typeSel.addEventListener('change', () => {
      const key = typeSel.value;
      const t   = (typeof getWeaponTypeData === 'function') ? getWeaponTypeData(key) : null;

      if (t) {
        // Category is CLASSIFICATION, so it lives in WEAPON_TYPES and is
        // available even before core_wp.json has finished loading.
        fillAuto('.weapon-category', t.category);

        // Everything else is a STATISTIC, read live through the wpName pointer
        // so it is never duplicated and cannot drift from the book.
        const stats = (typeof getWeaponTypeStats === 'function') ? getWeaponTypeStats(key) : null;
        if (stats) {
          const gs = gripStats(stats);
          fillAuto('.speed',       gs.speed);
          fillAuto('.damage-sm',   gs.sm);
          fillAuto('.damage-l',    gs.l);
          fillAuto('.weapon-size', stats['Size']);
          // core_wp.json stores Table 45 ranges as three fields, not one string.
          // Compose them into the "S/M/L" form the Range field expects. A melee
          // weapon passes '' so that a stale range left by the PREVIOUS Type is
          // cleared rather than inherited. Staff sling has no short range, so a
          // band can legitimately be blank -- the dash keeps the three positions
          // readable.
          const rS = stats['Range (S)'], rM = stats['Range (M)'], rL = stats['Range (L)'];
          fillAuto('.weapon-range', (rM || rL)
            ? [rS || '--', rM || '--', rL || '--'].join('/')
            : '');
          // Weapon Type (B/P/S) -- feeds the optional Weapon Type vs. Armor rule
          // in PHB Ch.9. Blank for whip, scourge and mancatcher, which the book
          // itself leaves without a type.
          fillAuto('.damage-type', stats['Type']);
          // core_wp.json stores weight as "7 lb"; the field is type=number and
          // rejects the unit, so strip everything but the digits.
          const w = parseFloat(String(stats['Weight'] || '').replace(/[^0-9.]/g, ''));
          fillAuto('.weight', isNaN(w) ? '' : w);
        }
      }

      // ORDERING TRAP: the STR-mode listener above is registered first, so it
      // has already run against the OLD Category by the time we get here. If we
      // just filled a blank Category, its answer is stale -- re-derive it.
      if (strSel && strSel.dataset.userSet !== '1' && typeof getDefaultWeaponStrMode === 'function') {
        strSel.value = getDefaultWeaponStrMode(
          catSel ? catSel.value : '',
          (typeof getWeaponGroup === 'function') ? getWeaponGroup(key, key) : key
        );
      }

      syncWeaponGroup();
      onChange && onChange();
    });
  }

  syncWeaponGroup();
  el.querySelector('.equipped').addEventListener('change', ()=>onChange && onChange());
  return el;
}

function makeMagicItemNode(data={}, onChange){
  const el = document.createElement('div');
  // See makeAmmunitionNode for what 'gear' opts into. The inline
  // flexDirection/alignItems are removed rather than left dead: an inline
  // style beats the stylesheet, and alignItems:stretch would override the
  // grid's align-items:center.
  el.className = 'item gear';

  // Records saved before this field existed carry no `identified` flag. A
  // missing flag reads as IDENTIFIED -- otherwise every magic item on every
  // existing character would suddenly claim to be a mystery. Same treatment
  // isMagical already gets on legacy armor and weapon cards.
  const miIdentified = (data.identified !== undefined) ? !!data.identified : true;
  const miType = data.type || '';
  const miTypeOptions = (typeof MAGIC_ITEM_TYPES !== 'undefined' ? MAGIC_ITEM_TYPES : [])
    .map(t => '<option value="'+escapeHtml(t.key)+'"'+(t.key===miType?' selected':'')+'>'+
              escapeHtml(t.label)+'</option>').join('');

  el.innerHTML =
    // Three grid children: rail, row1, row2. A magic item is magical by
    // definition, so the rail is always --magic -- it is the one card type
    // where the rail states a fact rather than a status.
    '<div class="rail enchanted"></div>' +
    '<div class="row1">' +
      '<div class="qtybox">' +
        '<input class="qty" type="number" min="0" step="1" inputmode="numeric" value="'+escapeHtml(data.qty||'')+'">' +
        '<span class="spin">' +
          '<button type="button" class="qty-up" aria-label="Add one">&#9650;</button>' +
          '<button type="button" class="qty-down" aria-label="Remove one">&#9660;</button>' +
        '</span>' +
        '<span class="qlab">qty</span>' +
      '</div>' +
      '<div class="spacer"></div>' +
      '<div class="stat mi-charges"></div>' +
      '<div class="btns">' +
        '<button class="toggle-details">Details</button>' +
        '<button class="rm">Remove</button>' +
      '</div>' +
    '</div>' +
    '<div class="row2">' +
      '<input class="title" placeholder="" value="'+escapeHtml(data.name||'')+'" style="flex:1;min-width:0;">' +
    '</div>' +
    // Everything below is collapsed by default. Type and Weight sit OUTSIDE the
    // enchantment panel because both are known on pickup: you can see it is a
    // ring and you can weigh it. Only what an identification reveals is gated.
    '<div class="magic-item-details" style="display:none;">' +
      '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
        '<div style="width:120px;">Type</div>' +
        '<div style="width:80px;text-align:center;">Weight (ea)</div>' +
      '</div>' +
      '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:10px;">' +
        '<select class="magic-item-type" style="width:120px;">'+miTypeOptions+'</select>' +
        '<input class="weight" type="number" step="0.1" placeholder="" value="'+escapeHtml(data.weight||'')+'" style="width:80px;text-align:center;">' +
      '</div>' +
      // 'always' variant: a magic item is magical by definition, so this panel
      // has NO Enchanted toggle and gates on Identified alone. Until now the
      // Identified box rendered but gated nothing -- the card claimed a state it
      // did not enforce.
      '<div class="ench-panel always">' +
        '<div class="ench-head">' +
          '<label class="ench-ident">' +
            '<input type="checkbox" class="is-identified"'+(miIdentified?' checked':'')+'>' +
            'Identified?' +
          '</label>' +
          '<span class="ench-veil">Effects unknown until identified</span>' +
        '</div>' +
        '<div class="ench-body">' +
          '<div class="ench-fields">' +
            '<div class="ench-name">' +
              '<label style="display:block;margin-bottom:3px;">True name</label>' +
              '<input class="true-name" value="'+escapeHtml(data.trueName||'')+'">' +
            '</div>' +
            '<div class="magic-item-charges-group" style="display:none;gap:11px;">' +
              '<label>Charges<input class="charges" type="number" value="'+escapeHtml(data.charges||'')+'"></label>' +
              '<label>Max<input class="charges-max" type="number" value="'+escapeHtml(data.chargesMax||'')+'"></label>' +
            '</div>' +
            '<label>Command word<input class="command-word" value="'+escapeHtml(data.commandWord||'')+'" style="width:150px;text-align:left;"></label>' +
          '</div>' +
          '<div class="ench-effects">' +
            '<label style="display:block;margin-bottom:3px;">Description / Powers</label>' +
            '<textarea class="notes" placeholder="">'+escapeHtml(data.notes||'')+'</textarea>' +
          '</div>' +
        '</div>' +
      '</div>' +
    // Closes .magic-item-details, opened above.
    '</div>';
  // Charges show only for the types Chapter 10 states are expendable -- wands,
  // staves and rods. Read from MAGIC_ITEM_TYPES so that registry stays the one
  // place the rule lives; charging another type is a tables.js edit, not a
  // change here.
  const miTypeSel   = el.querySelector('.magic-item-type');
  const miChargeGrp = el.querySelector('.magic-item-charges-group');
  const syncMagicItemCharges = ()=>{
    const show = (typeof magicItemTypeHasCharges === 'function') &&
                 magicItemTypeHasCharges(miTypeSel.value);
    miChargeGrp.style.display = show ? 'flex' : 'none';
  };
  syncMagicItemCharges();
  miTypeSel.addEventListener('change', ()=>{
    syncMagicItemCharges(); syncMiCollapsed(); onChange && onChange();
  });

  // Details toggle. This card had NONE -- every magic item rendered fully
  // expanded, so eight items was eight four-row blocks. Same pattern as the
  // armor, weapon and ammunition cards.
  const miToggleBtn = el.querySelector('.toggle-details');
  const miDetails   = el.querySelector('.magic-item-details');
  if (miToggleBtn && miDetails) {
    miToggleBtn.onclick = () => {
      const open = miDetails.style.display !== 'none';
      miDetails.style.display = open ? 'none' : 'block';
      miToggleBtn.textContent = open ? 'Details' : 'Hide';
    };
  }

  // Collapsed-row readouts. Charges are shown only for the types
  // MAGIC_ITEM_TYPES marks as charged; everything else gets an em dash, which
  // says "not applicable" where a blank would say "you forgot to fill this in".
  const syncMiCollapsed = () => {
    const out = el.querySelector('.mi-charges');
    if (!out) return;
    const charged = (typeof magicItemTypeHasCharges === 'function') &&
                    magicItemTypeHasCharges(miTypeSel.value);
    // EMPTY, not a dash. An em dash earns its place in a column where sibling
    // rows show numbers -- a shield's Base AC beside armour that has one. Alone
    // on a card it just reads as a broken control.
    if (!charged) { out.textContent = ''; return; }
    const cur = el.querySelector('.charges').value;
    const max = el.querySelector('.charges-max').value;
    out.innerHTML = (cur === '' && max === '')
      ? ''
      : '<b>' + escapeHtml(cur || '0') + '</b>' + (max ? ' / ' + escapeHtml(max) : '');
  };
  syncMiCollapsed();
  ['.charges', '.charges-max'].forEach(sel => {
    const f = el.querySelector(sel);
    if (f) f.addEventListener('input', syncMiCollapsed);
  });

  // Quantity spinner. Dispatches a real 'input' event rather than assigning
  // .value silently, so the blanket listener below still fires and the sheet
  // marks unsaved. Floors at zero.
  const miQty = el.querySelector('.qty');
  const miStep = (delta) => {
    const n = parseInt(miQty.value || 0, 10);
    miQty.value = Math.max(0, (isNaN(n) ? 0 : n) + delta);
    miQty.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const miUp = el.querySelector('.qty-up'), miDown = el.querySelector('.qty-down');
  if (miUp)   miUp.onclick   = () => miStep(1);
  if (miDown) miDown.onclick = () => miStep(-1);
  miQty.addEventListener('input', () => {
    const clean = String(miQty.value).replace(/[^0-9]/g, '');
    if (clean !== miQty.value) miQty.value = clean;
  });

  el.querySelector('.rm').onclick = ()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,select,textarea').forEach(inp =>
    inp.addEventListener('input', ()=>onChange && onChange())
  );
  return el;
}

// The reference strip on an ammunition card: which weapon it is for, and its
// range and damage modifiers as PRINTED. Deliberately not parsed -- the values
// include "+1 vs unarmored", "2d4 vs undead", "1d3 + 2d6 fire (2 rds)" and
// "Special", which are conditional or typed rather than arithmetic. Showing the
// string is honest; computing it would need a conditional-damage model.
//
// "10/20/30" style values in Range Modifier are ABSOLUTE ranges for thrown
// stones, not modifiers -- they have no base weapon to modify. Shown as-is.
function ammoRefHtml(data) {
  const bits = [];
  const clean = v => {
    const s = String(v == null ? '' : v).trim();
    return (!s || s === 'N/A' || s === 'None' || s === '+0') ? '' : s;
  };
  if (data.forWeapon) bits.push('for ' + escapeHtml(String(data.forWeapon)));
  const rng = clean(data.rangeMod);
  const dmg = clean(data.damageMod);
  if (rng) bits.push('range ' + escapeHtml(rng));
  if (dmg) bits.push('dmg ' + escapeHtml(dmg));
  if (!bits.length) return '';
  return '<span class="ammo-ref" style="font-size:10px;color:var(--muted);' +
         'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
         'align-self:center;margin-left:8px;" title="From the ammunition tables. ' +
         'Reference only \u2014 apply these yourself.">' +
         bits.join(' \u00B7 ') + '</span>';
}

function makeAmmunitionNode(data={}, onChange){
  const el = document.createElement('div');
  // 'gear' opts this card into the shared gear-card grammar in style.css --
  // two-row grid, status rail, chips, spinner. The base 'item' class is left
  // alone because every other list in the app uses it.
  el.className = 'item gear';
  // Stored on the ELEMENT, not just rendered, because collectSheet reads them
  // back from here on save. ammoRefHtml trims "+0" and "N/A" out of the
  // display, so reading the rendered text would round-trip a lossy version.
  if (data.forWeapon) el.dataset.forWeapon = data.forWeapon;
  if (data.rangeMod)  el.dataset.rangeMod  = data.rangeMod;
  if (data.damageMod) el.dataset.damageMod = data.damageMod;
  if (data.bookNotes) el.dataset.bookNotes = data.bookNotes;
  // The old inline flexDirection/alignItems are GONE, not just unused: an
  // inline style beats the stylesheet, and alignItems:stretch would override
  // the grid's align-items:center on every row.
  
  // Calculate total weight
  const quantity = parseInt(data.quantity || 0, 10);
  const weightPerUnit = parseFloat(data.weightPerUnit || 0);
  const totalWeight = (quantity * weightPerUnit).toFixed(2);

  // NO migration needed here, unlike armor and weapons. This card has never had
  // magic fields, so there is no prior value to infer an enchantment from -- an
  // existing record simply loads unticked, which is correct rather than lossy.
  const ammoIsMagical = !!data.isMagical;
  // A missing flag reads as IDENTIFIED. Anything magical already on a character
  // has been identified by definition -- it was recorded with its numbers -- and
  // the alternative would turn every existing enchanted item into a mystery and
  // blank the badge numbers on sheets that have always shown them.
  const ammoIdentified = (data.identified !== undefined) ? !!data.identified : true;

  // Badge text at build time; the live version is ammoBadgeText() in the wiring.
  const ammoInitialBadge = (() => {
    const num = s => { const v = parseFloat(s); return isNaN(v) ? null : v; };
    const m  = num(data.magicBonus) || 0;
    const h  = num(data.hitAdj), d = num(data.dmgAdj);
    const eh = (h === null) ? m : h, ed = (d === null) ? m : d;
    if (m === 0 && eh === 0 && ed === 0) return '';
    // Keep in step with ammoBadgeText -- see the note there.
    if ((eh === m && ed === m) || (eh === 0 && ed === 0)) return '(' + magicSign(m) + ')';
    return '(' + magicSign(m) + ': ' + magicSign(eh) + '/' + magicSign(ed) + ')';
  })();
  
  el.innerHTML =
    // Three GRID CHILDREN, not a wrapper: the rail spans both rows via
    // grid-row:1/span 2, which needs row1 and row2 to be real grid rows.
    // Ammunition has no worn state, so the rail stays neutral -- an honest
    // blank rather than a colour that means nothing.
    '<div class="rail"></div>' +
    '<div class="row1">' +
      // THE ONLY .quantity input on this card. The +/- buttons in the details
      // panel and the spinner here both drive THIS one, so there is never a
      // second copy to drift out of sync -- collectSheet reads .quantity and
      // must find exactly one.
      '<div class="qtybox">' +
        '<input class="quantity" type="number" min="0" step="1" inputmode="numeric" value="'+escapeHtml(data.quantity||0)+'">' +
        '<span class="spin">' +
          '<button type="button" class="qty-up" aria-label="Add one">&#9650;</button>' +
          '<button type="button" class="qty-down" aria-label="Remove one">&#9660;</button>' +
        '</span>' +
        '<span class="qlab">qty</span>' +
      '</div>' +
      '<div class="spacer"></div>' +
      // A SEPARATE class from .ammo-total-weight in the details panel:
      // updateAmmoItemWeight uses querySelector, which returns the FIRST match
      // only, so two elements sharing that class would leave the panel stale.
      '<div class="stat"><b class="ammo-line-weight">' + totalWeight + '</b> lb total</div>' +
      '<div class="btns">' +
        '<button class="toggle-details">Details</button>' +
        '<button class="rm">Remove</button>' +
      '</div>' +
    '</div>' +
    // Row 2: the name alone, full card width, so it never truncates.
    '<div class="row2">' +
      '<input class="title" placeholder="e.g., Arrows, Bolts" value="'+escapeHtml(data.name||'')+'" style="flex:0 0 auto;min-width:0;">' +
	  // Reference only, from core_ammo.json. NOT applied to any calculation:
      // an ammunition card has no link to a weapon card -- the data says
      // "Bow (any)", a category rather than a weapon, and a character may carry
      // two bows and three arrow types. So the player reads these and applies
      // them himself. Until this line existed the values sat in the JSON and
      // reached nothing; the dead-field audit found them.
      ammoRefHtml(data) +
      // Unidentified falls back to the dot: the bonus is recorded, but the
      // character does not know it, and the collapsed row must not announce a
      // number nobody has learned yet. refreshAmmoMagic applies the same rule
      // live; this is the initial render.
      magicBadgeHtml(ammoIsMagical, ammoIdentified ? ammoInitialBadge : '') +
    '</div>' +
    '<div class="ammo-details" style="display:none;">' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
        '<div style="flex:1;">' +
          '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Adjust Quantity</label>' +
          '<div style="display:flex;gap:4px;align-items:center;">' +
            '<button class="ammo-minus-10" style="padding:4px 8px;font-size:11px;">-10</button>' +
            '<button class="ammo-minus-1" style="padding:4px 8px;font-size:11px;">-1</button>' +
            '<button class="ammo-plus-1" style="padding:4px 8px;font-size:11px;">+1</button>' +
            '<button class="ammo-plus-10" style="padding:4px 8px;font-size:11px;">+10</button>' +
          '</div>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Weight per Unit (lbs)</label>' +
          '<input class="weight-per-unit" type="number" step="0.01" min="0" value="'+escapeHtml(data.weightPerUnit||0.1)+'" style="width:100%;">' +
          // INSIDE this flex column, NOT a sibling of .ammo-details. .item.gear
          // is a two-column grid (3px rail, 1fr content) with no grid-column on
          // its children, so placement is automatic and depends entirely on the
          // child COUNT. An extra top-level child shifts every element after it
          // one cell and pushes content into the 3px rail column -- the card
          // collapses into a vertical stack. See the comment above el.innerHTML.
          (data.bookNotes
            ? '<div style="font-size:11px;color:var(--muted);font-style:italic;' +
              'margin-top:6px;line-height:1.4;">' + escapeHtml(data.bookNotes) + '</div>'
            : '') +
        '</div>' +
      '</div>' +
    '<div class="ench-panel">' +
      '<div class="ench-head">' +
        '<label>' +
          '<input type="checkbox" class="is-magical"' + (ammoIsMagical ? ' checked' : '') + '>' +
          'Enchanted?' +
        '</label>' +
        '<label class="ench-ident">' +
          '<input type="checkbox" class="is-identified"' + (ammoIdentified ? ' checked' : '') + '>' +
          'Identified?' +
        '</label>' +
        '<span class="ench-veil">Effects unknown until identified</span>' +
      '</div>' +
      '<div class="ench-body">' +
        '<div class="ench-fields">' +
          '<div class="ench-name">' +
            '<label style="display:block;margin-bottom:3px;">True name</label>' +
            '<input class="true-name" value="'+escapeHtml(data.trueName||'')+'">' +
          '</div>' +
          '<label title="' +
            'Enchantment level of the ammunition itself -- 1 for a +1 arrow.&#10;' +
            'This applies to the WHOLE stack; a quiver of twenty +1 arrows is one&#10;' +
            '  record, and the quantity does not change the bonus.&#10;' +
            'The PHB does not say whether an enchanted arrow and an enchanted bow&#10;' +
            '  stack. That is a table ruling, so the sheet reports this bonus and&#10;' +
            '  leaves the combination to you and your DM.">Magic' +
            '<input class="ammo-magic-bonus" type="number" placeholder="0" value="'+escapeHtml(data.magicBonus||'')+'">' +
          '</label>' +
          '<label title="' +
            'To-hit bonus granted by this ammunition.&#10;' +
            'Leave blank to use the Magic value -- correct for an ordinary +N arrow.&#10;' +
            'Set it when the enchantment is not uniform.">Hit Adj' +
            '<input class="ammo-hit-adj" type="number" value="'+escapeHtml(data.hitAdj!==undefined&&data.hitAdj!==null?data.hitAdj:'')+'">' +
          '</label>' +
          '<label title="' +
            'Damage bonus granted by this ammunition.&#10;' +
            'Leave blank to use the Magic value.&#10;' +
            'Set to 0 for ammunition that helps you hit but not hurt.">Dmg Adj' +
            '<input class="ammo-dmg-adj" type="number" value="'+escapeHtml(data.dmgAdj!==undefined&&data.dmgAdj!==null?data.dmgAdj:'')+'">' +
          '</label>' +
        '</div>' +
        '<div class="ench-effects">' +
          '<label style="display:block;margin-bottom:3px;">Effects</label>' +
          '<textarea class="ench-effects-text">'+escapeHtml(data.effects||'')+'</textarea>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--muted);margin-top:6px;">' +
        'Total Weight: <span class="ammo-total-weight" style="color:var(--accent-light);font-weight:600;">' + totalWeight + ' lbs</span>' +
      '</div>' +
    '</div>';
  
  // Remove button
  el.querySelector('.rm').onclick = ()=>{ 
    el.remove(); 
    onChange && onChange();
    updateTotalAmmoWeight(el.closest('.sheet-container'));
  };
  
  // Quantity adjustment buttons
  const quantityInput = el.querySelector('.quantity');

  // Collapsed-row spinner. Deliberately reuses the SAME path as the panel's
  // +/- buttons rather than setting .value directly: encumbrance, the line
  // total and the unsaved marker all hang off that work, and a silent
  // assignment fires none of them. Floors at zero -- a stack cannot go negative.
  const ammoStep = (delta) => {
    const current = parseInt(quantityInput.value || 0, 10);
    quantityInput.value = Math.max(0, current + delta);
    updateAmmoItemWeight(el);
    onChange && onChange();
    const r = el.closest('.sheet-container');
    if (r) {
      updateTotalAmmoWeight(r);
      if (typeof renderEncumbrance === 'function')  renderEncumbrance(r);
      if (typeof renderMovementRate === 'function') renderMovementRate(r);
    }
  };
  const ammoUp = el.querySelector('.qty-up');
  const ammoDown = el.querySelector('.qty-down');
  if (ammoUp)   ammoUp.onclick   = () => ammoStep(1);
  if (ammoDown) ammoDown.onclick = () => ammoStep(-1);
  // Digits only, and never below zero, however the field is typed into.
  quantityInput.addEventListener('input', () => {
    const clean = String(quantityInput.value).replace(/[^0-9]/g, '');
    if (clean !== quantityInput.value) quantityInput.value = clean;
  });
  
el.querySelector('.ammo-minus-10').onclick = ()=>{
    const current = parseInt(quantityInput.value || 0, 10);
    quantityInput.value = Math.max(0, current - 10);
    updateAmmoItemWeight(el);
    onChange && onChange();
    const root = el.closest('.sheet-container');
	console.log('About to call renderEncumbrance, root:', root);
    console.log('Ammo items found:', root.querySelectorAll('.ammunition-list .item').length);
    updateTotalAmmoWeight(root);
    renderEncumbrance(root);
    renderMovementRate(root);
  };
  
  el.querySelector('.ammo-minus-1').onclick = ()=>{
    const current = parseInt(quantityInput.value || 0, 10);
    quantityInput.value = Math.max(0, current - 1);
    updateAmmoItemWeight(el);
    onChange && onChange();
    const root = el.closest('.sheet-container');
    updateTotalAmmoWeight(root);
    renderEncumbrance(root);
    renderMovementRate(root);
  };
  
  el.querySelector('.ammo-plus-1').onclick = ()=>{
    const current = parseInt(quantityInput.value || 0, 10);
    quantityInput.value = current + 1;
    updateAmmoItemWeight(el);
    onChange && onChange();
    const root = el.closest('.sheet-container');
    updateTotalAmmoWeight(root);
    renderEncumbrance(root);
    renderMovementRate(root);
  };
  
  el.querySelector('.ammo-plus-10').onclick = ()=>{
    const current = parseInt(quantityInput.value || 0, 10);
    quantityInput.value = current + 10;
    updateAmmoItemWeight(el);
    onChange && onChange();
    const root = el.closest('.sheet-container');
    updateTotalAmmoWeight(root);
    renderEncumbrance(root);
    renderMovementRate(root);
  };
  
  // Update weight when quantity or weight per unit changes
  quantityInput.addEventListener('input', ()=>{
    updateAmmoItemWeight(el);
    onChange && onChange();
    const root = el.closest('.sheet-container');
    updateTotalAmmoWeight(root);
    renderEncumbrance(root);
    renderMovementRate(root);
  });
  
  el.querySelector('.weight-per-unit').addEventListener('input', ()=>{
    updateAmmoItemWeight(el);
    onChange && onChange();
    const root = el.closest('.sheet-container');
    updateTotalAmmoWeight(root);
    renderEncumbrance(root);
    renderMovementRate(root);
  });
  
  // Name changes
  el.querySelector('.title').addEventListener('input', ()=>{
    onChange && onChange();
  });

  // Collapse/expand, matching the armor and weapon cards.
  const ammoToggleBtn = el.querySelector('.toggle-details');
  const ammoDetails   = el.querySelector('.ammo-details');
  if (ammoToggleBtn && ammoDetails) {
    ammoToggleBtn.onclick = () => {
      const open = ammoDetails.style.display !== 'none';
      ammoDetails.style.display = open ? 'none' : 'block';
      ammoToggleBtn.textContent = open ? 'Details' : 'Hide';
    };
  }

  // The name field grows with its contents so the badge sits against the text.
  // Declared before refreshAmmoMagic, which calls it -- const arrow functions
  // are not hoisted.
  const sizeAmmoName = () => {
    const inp = el.querySelector('.title');
    if (!inp) return;
    const n = (inp.value || inp.placeholder || '').length;
    inp.style.width = Math.min(Math.max(n + 2, 12), 40) + 'ch';
  };

  // Enchanted toggle. HIDES, NEVER CLEARS.
  const ammoMagicChk    = el.querySelector('.is-magical');
  
  const ammoBadgeText = () => {
    const num = sel => {
      const v = parseFloat((el.querySelector(sel) || {}).value);
      return isNaN(v) ? null : v;
    };
    const m  = num('.ammo-magic-bonus') || 0;
    const h  = num('.ammo-hit-adj'), d = num('.ammo-dmg-adj');
    const eh = (h === null) ? m : h, ed = (d === null) ? m : d;
    if (m === 0 && eh === 0 && ed === 0) return '';        // -> falls back to the dot
    // BOTH ADJUSTMENTS AT ZERO IS NOT A DIVERGENCE WORTH SHOWING. "(+2: +0/+0)"
    // is three zeros to say what "(+2)" says: the enchantment level, which is
    // what the badge is for. The Quick Reference already reports "no hit or
    // damage bonus" in words. The divergence form is kept for the case it was
    // built for -- effects that differ AND are non-zero, like +5 granting +1.
    if ((eh === m && ed === m) || (eh === 0 && ed === 0)) return '(' + magicSign(m) + ')';
    return '(' + magicSign(m) + ': ' + magicSign(eh) + '/' + magicSign(ed) + ')';
  };

  // The .magic-fields show/hide is GONE: the CSS gates the panel body on the
  // two checkboxes now, so doing it here as well would be two mechanisms
  // deciding one thing. The badge still has to be refreshed in JS.
  const ammoIdentChk = el.querySelector('.is-identified');
  const refreshAmmoMagic = () => {
    const on = !!(ammoMagicChk && ammoMagicChk.checked);
    const known = !ammoIdentChk || ammoIdentChk.checked;
    updateMagicBadge(el, on, known ? ammoBadgeText() : '');
    sizeAmmoName();
  };
  if (ammoIdentChk) ammoIdentChk.addEventListener('change', () => {
    refreshAmmoMagic(); onChange && onChange();
  });

  if (ammoMagicChk) {
    ammoMagicChk.addEventListener('change', () => {
      refreshAmmoMagic();
      onChange && onChange();
    });
  }
  // Unlike the armor and weapon cards, THIS card has no blanket 'input, select'
  // listener -- every field is wired individually -- so these must call
  // onChange themselves or an enchantment edit would never mark the sheet dirty.
  ['.ammo-magic-bonus', '.ammo-hit-adj', '.ammo-dmg-adj'].forEach(sel => {
    const f = el.querySelector(sel);
    if (f) f.addEventListener('input', () => { refreshAmmoMagic(); onChange && onChange(); });
  });

  el.querySelector('.title').addEventListener('input', sizeAmmoName);
  sizeAmmoName();

  return el;
}

// Update individual ammo item's total weight display
function updateAmmoItemWeight(ammoNode) {
  const quantity = parseInt(ammoNode.querySelector('.quantity').value || 0, 10);
  const weightPerUnit = parseFloat(ammoNode.querySelector('.weight-per-unit').value || 0);
  const totalWeight = (quantity * weightPerUnit).toFixed(2);
  
  const weightDisplay = ammoNode.querySelector('.ammo-total-weight');
  if (weightDisplay) {
    weightDisplay.textContent = totalWeight + ' lbs';
  }
  // The collapsed row carries the same figure in its own class -- see the
  // comment in makeAmmunitionNode for why it cannot share .ammo-total-weight.
  // Bare number here; the row supplies the "lb total" caption.
  const lineWeight = ammoNode.querySelector('.ammo-line-weight');
  if (lineWeight) {
    lineWeight.textContent = totalWeight;
  }
}

// Update total ammunition weight display
function updateTotalAmmoWeight(root) {
  if (!root) return;
  
  const ammoItems = root.querySelectorAll('.ammunition-list .item');
  let totalWeight = 0;
  
  ammoItems.forEach(item => {
    const quantity = parseInt(item.querySelector('.quantity').value || 0, 10);
    const weightPerUnit = parseFloat(item.querySelector('.weight-per-unit').value || 0);
    totalWeight += quantity * weightPerUnit;
  });
  
  const totalDisplay = root.querySelector('.total-ammo-weight');
  if (totalDisplay) {
    totalDisplay.textContent = totalWeight.toFixed(2) + ' lbs';
  }
  
  // TODO: This will be integrated with encumbrance calculation in a later change
}

function collectSheet(root){
  const meta = {
    name: val(root,'name'),
    player: val(root,'player'),
    // SEPARATE FROM NAME, deliberately. Name is the character map key and the
    // export filename, so appending a title there would change where the
    // character is stored. core_names.json says the same in _meta.titleIntegration.
    title: val(root,'title'),
    race: val(root,'race'),
	gender: val(root,'gender'),
    clazz: val(root,'clazz'),
	level: val(root,'level'),
	kit: val(root,'kit'),
    alignment: val(root,'alignment'),
    campaign_setting: val(root,'campaign_setting') || 'core',
    xp: val(root,'xp'),
    char_type: val(root,'char_type'),
    mc_class1: val(root,'mc_class1'),
    mc_class2: val(root,'mc_class2'),
    mc_class3: val(root,'mc_class3'),
    mc_level1: val(root,'mc_level1'),
    mc_level2: val(root,'mc_level2'),
    mc_level3: val(root,'mc_level3'),
	dc_original_class: val(root,'dc_original_class'),
    dc_original_level: val(root,'dc_original_level'),
    dc_new_class: val(root,'dc_new_class'),
    dc_new_level: val(root,'dc_new_level'),
    dc_original_hp: val(root,'dc_original_hp'),
    dc_new_hp: val(root,'dc_new_hp'),
    hp: val(root,'hp'),
	damage_taken: val(root,'damage_taken'),
    hit_dice_manual: val(root,'hit_dice_manual'),
    con_initial: val(root,'con_initial'),
    deaths_to_date: val(root,'deaths_to_date'),
    druid_role: val(root,'druid_role'),
    druid_surrendered_xp: val(root,'druid_surrendered_xp'),
    druid_bonus_1: val(root,'druid_bonus_1'),
    druid_bonus_2: val(root,'druid_bonus_2'),
    druid_bonus_3: val(root,'druid_bonus_3'),
    druid_bonus_4: val(root,'druid_bonus_4'),
    druid_bonus_5: val(root,'druid_bonus_5'),
    druid_bonus_6: val(root,'druid_bonus_6'),
    ac: val(root,'ac'),
	ac_manual: val(root,'ac_manual'),
    str: val(root,'str'),
	str_exceptional: val(root,'str_exceptional'),
    dex: val(root,'dex'),
    con: val(root,'con'),
    int: val(root,'int'),
    wis: val(root,'wis'),
    cha: val(root,'cha'),
    per: val(root,'per'),
    com: val(root,'com'),
    movement_flying: val(root,'movement_flying'),
	attacks_per_round: (qs(root, '.combat-attacks-per-round') && qs(root, '.combat-attacks-per-round').value) || '',
    attacks_per_round_manual: val(root, 'attacks_per_round_manual'),
    saves: [
      val(root,'save1'),
      val(root,'save2'),
      val(root,'save3'),
      val(root,'save4'),
      val(root,'save5')
    ],
    notes: val(root,'notes')
  };
  
  // Collect saving throw modifiers
	const saveMods = {
	  save1: val(root, "savemod1"),
	  save2: val(root, "savemod2"),
	  save3: val(root, "savemod3"),
	  save4: val(root, "savemod4"),
	  save5: val(root, "savemod5"),
	  save5_mental: val(root, "savemod5_mental")
	};

  // Skills: lists
  const weaponProficiencies = qsa(root,'.weapon-profs-list .item')
    .map(n=>({name:n.querySelector('.title').value, notes:n.querySelector('.val').value}));
  const nonWeaponProficiencies = qsa(root,'.nwp-list .item')
    .map(n=>({name:n.querySelector('.title').value, notes:n.querySelector('.val').value}));
  const classAbilities = qsa(root,'.class-abilities-list .item')
    .map(n=>({
      name:n.querySelector('.title').value, 
      notes:n.querySelector('.val').value,
      isAuto: n.dataset.autoGenerated === 'true'
    }));
  // isAuto persists the auto-generated flag, matching classAbilities above.
  // Without it the flag was lost on every save/load round trip -- which is the
  // other half of why racial abilities were frozen. Even once the renderer
  // started stamping the flag, nothing carried it across a reload, so the very
  // next load would have looked like a sheet full of manual entries.
  //
  // kitAbilities below still lacks this and duplicates as a result. Fixed
  // separately: existing characters are already carrying multiple copies, so
  // that one needs a sweep as well as a flag.
  const racialAbilities = qsa(root,'.racial-abilities-list .item')
    .map(n=>({
      name:n.querySelector('.title').value,
      notes:n.querySelector('.val').value,
      isAuto: n.dataset.autoGenerated === 'true'
    }));
  // isAuto, matching classAbilities and racialAbilities above. Without it the
  // flag died on every save/load round trip, so renderKitAbilities could never
  // recognise its own output and appended a duplicate set instead of replacing
  // one. The name sweep in that function cleans up the damage already done;
  // this is what stops it recurring.
  const kitAbilities = qsa(root,'.kit-abilities-list .item')
    .map(n=>({
      name:n.querySelector('.title').value,
      notes:n.querySelector('.val').value,
      isAuto: n.dataset.autoGenerated === 'true'
    }));

  // Thief abilities
  const thief = {
    pickPockets: val(root,'thief_pickpockets'),
    openLocks: val(root,'thief_openlocks'),
    traps: val(root,'thief_traps'),
    moveSilently: val(root,'thief_movesilently'),
    hideInShadows: val(root,'thief_hide'),
    detectNoise: val(root,'thief_detectnoise'),
    climbWalls: val(root,'thief_climb'),
    readLanguages: val(root,'thief_readlang'),
    // Discretionary points allocated
    pointsPickPockets: val(root,'thief_points_pickpockets'),
    pointsOpenLocks: val(root,'thief_points_openlocks'),
    pointsTraps: val(root,'thief_points_traps'),
    pointsMoveSilently: val(root,'thief_points_movesilently'),
    pointsHide: val(root,'thief_points_hide'),
    pointsDetectNoise: val(root,'thief_points_detectnoise'),
    pointsClimb: val(root,'thief_points_climb'),
    pointsReadLang: val(root,'thief_points_readlang')
  };

  // Extended notes
  const notesEx = {
    powers: val(root,'notes_powers'),
    hindrances: val(root,'notes_hindrances'),
    classkit: val(root,'notes_classkit')
  };

  // Magic tab
  // Sync current spellbook UI to data before collecting
  syncSpellbookToData(root);
  
  const spellbooksData = getSpellbooksData(root);
  
  const magic = {
    slots: [
      val(root,'slots1'),
      val(root,'slots2'),
      val(root,'slots3'),
      val(root,'slots4'),
      val(root,'slots5'),
      val(root,'slots6'),
      val(root,'slots7'),
      val(root,'slots8'),
      val(root,'slots9')
    ],
    used: [
      val(root,'used1'),
      val(root,'used2'),
      val(root,'used3'),
      val(root,'used4'),
      val(root,'used5'),
      val(root,'used6'),
      val(root,'used7'),
      val(root,'used8'),
      val(root,'used9')
    ],
    memorized: qsa(root,'.memspells-list .item').map(n=>({
      name: n.querySelector('.title')?.value || '',
      level: n.querySelector('.level')?.value || '',
      schoolSphere: n.querySelector('.school-sphere')?.value || '',
      castTime: n.querySelector('.cast-time')?.value || '',
      range: n.querySelector('.range')?.value || '',
      duration: n.querySelector('.duration')?.value || '',
      components: n.querySelector('.components')?.value || '',
      save: n.querySelector('.save')?.value || '',
      description: n.querySelector('.description')?.value || '',
      notes: n.querySelector('.notes')?.value || '',
      // PHB Ch.7: which version of a reversible spell was memorized. Absent on
      // older records, where the row builder falls through to 'normal'.
      form: n.querySelector('.spell-form')?.value || 'normal',
      cast: n.classList.contains('spell-cast'),
      // PHB Ch.7: lost to disrupted concentration rather than cast. Mutually
      // exclusive with `cast`; absent on older records, which read as false.
      lost: n.classList.contains('spell-lost')
    })),
    spellbooks: spellbooksData.spellbooks,
    activeSpellbookId: spellbooksData.activeSpellbookId,
    schools: val(root,'magic-schools'),
    notes: val(root,'magic-notes')
  };

  // Core lists
  const spells = qsa(root,'.spells-list .item') // kept for back-compat; core no longer has it
    .map(n=>({name:n.querySelector('.title').value, level:n.querySelector('.val').value}));
  // Collect sphere ACCESS (priests) as { sphereName: 'major' | 'minor' }.
  //
  // SHAPE CHANGE, SAME KEY. This used to be a flat array of sphere names, which
  // could not express major versus minor and therefore could not carry PHB Ch.3's
  // 3rd-level cap on minor spheres. The key is deliberately left as
  // `selectedSpheres` rather than renamed: renderSpellAccess accepts both shapes
  // and promotes a legacy array to MAJOR access, so every character saved before
  // this change keeps working and nobody loses a spell they had been casting.
  //
  // Spheres set to no access are omitted rather than written as 'none'. Absence
  // is the no-access answer everywhere else in the sphere code, and carrying two
  // spellings of the same state would eventually let them disagree.
  const selectedSpheres = (typeof getSphereAccessMap === 'function')
    ? getSphereAccessMap(root)
    : {};
  
  // Collect selected schools (wizards)
  const selectedSchools = Array.from(root.querySelectorAll('.school-checkboxes input[type="checkbox"]:checked'))
    .map(cb => cb.getAttribute('data-school'));
  const items = qsa(root,'.items-list .item')
    .map(n=>({
      name: n.querySelector('.title').value, 
      qty: n.querySelector('.qty').value,
      weight: (n.querySelector('.weight') && n.querySelector('.weight').value) || '',
      // Stored, not derived. The category comes from core_equipment.json when
      // the browser adds the item and is read back on load; nothing infers it
      // from the name, because inference is what the anchor rule exists to stop.
      category: n.dataset.category || '',
      notes: (n.querySelector('.notes') && n.querySelector('.notes').value) || ''
    }));
  const valuables = qsa(root,'.valuables-list .item')
    .map(n=>({
      name: n.querySelector('.title').value, 
      qty: n.querySelector('.qty').value,
      weight: (n.querySelector('.weight') && n.querySelector('.weight').value) || '',
      notes: (n.querySelector('.notes') && n.querySelector('.notes').value) || '',
      type:  (n.querySelector('.valuable-type') || {}).value || '',
      value: (n.querySelector('.value-each')    || {}).value || '',
      unit:  (n.querySelector('.value-unit')    || {}).value || 'gp'
    }));
  const armor = qsa(root,'.armor-list .item')
    .map(n=>({
      name: n.querySelector('.title').value,
      // armorType = WHERE it is worn (Armor / Shield / Helmet / ...).
      // armorTypeKey = WHAT IT IS (leather, plate, buckler_wood, ...), the
      // anchor every rule reads. The class names were swapped in the card
      // rewrite -- .armor-slot now holds the wear location and .armor-type
      // holds the construction -- so both are read defensively here.
      armorType: (n.querySelector('.armor-slot') || n.querySelector('.armor-type') || {}).value || 'Armor',
      armorTypeKey: (n.querySelector('.armor-type') ? n.querySelector('.armor-type').value : '') || '',
      baseAC: n.querySelector('.base-ac').value,
      acBonus: n.querySelector('.ac-bonus').value,
      // Explicit enchantment flag. This is what the encumbrance rule should key
      // off instead of "acBonus is non-zero", which cannot see a magical item
      // that grants no AC -- elven chain being the live example.
      isMagical: !!(n.querySelector('.is-magical') || {}).checked,
      identified: !!(n.querySelector('.is-identified') || {}).checked,
      trueName: (n.querySelector('.true-name') || {}).value || '',
      effects: (n.querySelector('.ench-effects-text') || {}).value || '',
      // PHBR1 pp.110-111. The race that MADE it, blank for ordinary armour.
      // Absence means not-applicable, so armour predating this field is
      // untouched and nothing migrates.
      highQualityRace: (n.querySelector('.armor-hq-race') || {}).value || '',
      equipped: n.querySelector('.equipped').checked,
      weight: (n.querySelector('.weight') && n.querySelector('.weight').value) || '',
      notes: n.querySelector('.notes').value
    }));

  const weapons = qsa(root,'.weapons-list .item')
    .map(n=>({
      name: n.querySelector('.title').value,
      damageSM: (n.querySelector('.damage-sm') && n.querySelector('.damage-sm').value) || '',
      damageL: (n.querySelector('.damage-l') && n.querySelector('.damage-l').value) || '',
      magicBonus: (n.querySelector('.magic-bonus') && n.querySelector('.magic-bonus').value) || '',
      isMagical: !!(n.querySelector('.is-magical') || {}).checked,
      identified: !!(n.querySelector('.is-identified') || {}).checked,
      trueName: (n.querySelector('.true-name') || {}).value || '',
      effects: (n.querySelector('.ench-effects-text') || {}).value || '',
      weight: (n.querySelector('.weight') && n.querySelector('.weight').value) || '',
      speed: (n.querySelector('.speed') && n.querySelector('.speed').value) || '',
      damageType: (n.querySelector('.damage-type') && n.querySelector('.damage-type').value) || '',
      equipped: (n.querySelector('.equipped') && n.querySelector('.equipped').checked) || false,
      notes: (n.querySelector('.notes') && n.querySelector('.notes').value) || '',
      // How Strength applies to this weapon (PHB). Category/Type drive the
      // default; strBonus is the explicit, DM-overridable setting.
      category: (n.querySelector('.weapon-category') && n.querySelector('.weapon-category').value) || '',
      // TWO VOCABULARIES, TWO FIELDS -- never one field carrying two meanings.
      // weaponTypeKey is the GRANULAR key ("sword_long"). wtype is the COARSE
      // group ("Sword"), DERIVED from it, kept because every existing consumer
      // already reads it and because a group is what the related-weapon rules
      // and the Table 35 columns actually reason about. Deriving rather than
      // storing separately means the two can never fall out of step.
      weaponTypeKey: (function () {
        const v = (n.querySelector('.weapon-wtype') && n.querySelector('.weapon-wtype').value) || '';
        return (typeof getWeaponTypeData === 'function' && getWeaponTypeData(v)) ? v : '';
      })(),
      wtype: (function () {
        const v = (n.querySelector('.weapon-wtype') && n.querySelector('.weapon-wtype').value) || '';
        return (typeof getWeaponGroup === 'function') ? getWeaponGroup(v, v) : v;
      })(),
      strBonus: (n.querySelector('.weapon-str-bonus') && n.querySelector('.weapon-str-bonus').value) || '',
      profStatus: (n.querySelector('.weapon-prof-status') && n.querySelector('.weapon-prof-status').value) || 'auto',
      // Per-weapon adjustments. All five are optional and blank means inherit:
      // hitAdj/dmgAdj fall back to magicBonus, attacks to the character-level
      // Attacks/Round, size to core_wp.json, and range has no source at all.
      //
      // Stored as strings so an explicit 0 survives -- "0" is a real override
      // (a weapon that helps you hit but not hurt), where a number would be
      // indistinguishable from blank under any falsy test downstream.
      hitAdj: (n.querySelector('.weapon-hit-adj') && n.querySelector('.weapon-hit-adj').value) || '',
      dmgAdj: (n.querySelector('.weapon-dmg-adj') && n.querySelector('.weapon-dmg-adj').value) || '',
      attacks: (n.querySelector('.weapon-attacks') && n.querySelector('.weapon-attacks').value) || '',
      size: (n.querySelector('.weapon-size') && n.querySelector('.weapon-size').value) || '',
      // PHBR1 pp.62-63, 93. Ten weapons have DIFFERENT damage in one hand and
      // two, and the bastard sword also has a different speed factor. Blank
      // means "as the record stands", which is the ONE-HANDED line -- core_wp
      // was normalised so the main Damage columns are consistently one-handed.
      grip: (n.querySelector('.weapon-grip') && n.querySelector('.weapon-grip').value) || '',
      // PHBR1 pp.11-13. Blank IS average -- absence means not-applicable, so a
      // weapon predating this field reads as average and nothing migrates.
      quality: (n.querySelector('.weapon-quality') && n.querySelector('.weapon-quality').value) || '',
      // PHB Ch.9 two-weapon fighting. Stored ON THE WEAPON rather than as one
      // character-level "off-hand weapon" pointer, so renaming or reordering
      // the list cannot orphan it.
      offhand: !!(n.querySelector('.weapon-offhand') || {}).checked,
      range: (n.querySelector('.weapon-range') && n.querySelector('.weapon-range').value) || '',
      // The ammunition this weapon fires, stored BY NAME -- that is the identity
      // shown on the ammo card. A rename breaks the link, which the dropdown
      // surfaces with a "(missing)" marker rather than silently clearing.
      ammo: (n.querySelector('.weapon-ammo') && n.querySelector('.weapon-ammo').value) || ''
    }));
	
  const ammunition = qsa(root,'.ammunition-list .item')
    .map(n=>({
      name: n.querySelector('.title').value,
      quantity: n.querySelector('.quantity').value,
      weightPerUnit: n.querySelector('.weight-per-unit').value,
	  // Read back off the card's dataset rather than the DOM text, so the
      // stored value stays the book's string even after ammoRefHtml has
      // trimmed "+0" and "N/A" out of the display.
      forWeapon:  n.dataset.forWeapon  || '',
      rangeMod:   n.dataset.rangeMod   || '',
      damageMod:  n.dataset.damageMod  || '',
      bookNotes:  n.dataset.bookNotes  || '',
      isMagical:  !!(n.querySelector('.is-magical') || {}).checked,
      identified: !!(n.querySelector('.is-identified') || {}).checked,
      trueName:   (n.querySelector('.true-name') || {}).value || '',
      effects:    (n.querySelector('.ench-effects-text') || {}).value || '',
      magicBonus: (n.querySelector('.ammo-magic-bonus') || {}).value || '',
      hitAdj:     (n.querySelector('.ammo-hit-adj')     || {}).value || '',
      dmgAdj:     (n.querySelector('.ammo-dmg-adj')     || {}).value || ''
    }));

  const magicItems = qsa(root,'.magic-items-list .item')
    .map(n=>({
      name:        n.querySelector('.title').value,
      type:        (n.querySelector('.magic-item-type') || {}).value   || '',
      qty:         (n.querySelector('.qty')             || {}).value   || '',
      weight:      (n.querySelector('.weight')          || {}).value   || '',
      charges:     (n.querySelector('.charges')         || {}).value   || '',
      chargesMax:  (n.querySelector('.charges-max')     || {}).value   || '',
      commandWord: (n.querySelector('.command-word')    || {}).value   || '',
      identified:  !!(n.querySelector('.is-identified') || {}).checked,
      trueName:    (n.querySelector('.true-name')       || {}).value   || '',
      notes: (n.querySelector('.notes') && n.querySelector('.notes').value) || ''
    }));
	
  // Mounts
  const mounts = [];
  qsa(root,'.mounts-list .item').forEach(el=>{
    mounts.push({
      name: el.querySelector('.mount-name').value,
      type: el.querySelector('.mount-type').value,
      hp: el.querySelector('.mount-hp').value,
      ac: el.querySelector('.mount-ac').value,
      movement: el.querySelector('.mount-movement').value,
      capacity: el.querySelector('.mount-capacity').value,
      cost: el.querySelector('.mount-cost').value,
      status: el.querySelector('.mount-status').value,
      species: el.querySelector('.mount-species').value,
      hd: el.querySelector('.mount-hd').value,
      thac0: el.querySelector('.mount-thac0').value,
      attacks: el.querySelector('.mount-attacks').value,
      morale: el.querySelector('.mount-morale').value,
      str: el.querySelector('.mount-str').value,
      dex: el.querySelector('.mount-dex').value,
      con: el.querySelector('.mount-con').value,
      int: el.querySelector('.mount-int').value,
      wis: el.querySelector('.mount-wis').value,
      cha: el.querySelector('.mount-cha').value,
      per: el.querySelector('.mount-per').value,
      com: el.querySelector('.mount-com').value,
      abilities: el.querySelector('.mount-abilities').value,
      notes: el.querySelector('.mount-notes').value
    });
  });
  
  // Henchmen
  const henchmen = [];
  qsa(root,'.henchmen-list .item').forEach(el=>{
    henchmen.push({
      name: el.querySelector('.henchman-name').value,
      race: el.querySelector('.henchman-race').value,
      class: el.querySelector('.henchman-class').value,
      level: el.querySelector('.henchman-level').value,
      hp: el.querySelector('.henchman-hp').value,
      ac: el.querySelector('.henchman-ac').value,
      thac0: el.querySelector('.henchman-thac0').value,
      str: el.querySelector('.henchman-str').value,
      dex: el.querySelector('.henchman-dex').value,
      con: el.querySelector('.henchman-con').value,
      int: el.querySelector('.henchman-int').value,
      wis: el.querySelector('.henchman-wis').value,
      cha: el.querySelector('.henchman-cha').value,
      per: el.querySelector('.henchman-per').value,
      com: el.querySelector('.henchman-com').value,
      alignment: el.querySelector('.henchman-alignment').value,
      loyalty: el.querySelector('.henchman-loyalty').value,
      morale: el.querySelector('.henchman-morale').value,
      share: el.querySelector('.henchman-share').value,
      equipment: el.querySelector('.henchman-equipment').value,
      status: el.querySelector('.henchman-status').value,
      notes: el.querySelector('.henchman-notes').value
    });
  });
  
  // Hirelings
  const hirelings = [];
  qsa(root,'.hirelings-list .item').forEach(el=>{
    hirelings.push({
      name: el.querySelector('.hireling-name').value,
      // PHB Ch.12 hireling/follower split. `type` is the OCCUPATION and keeps
      // its original key; `category` is the new one. Read defensively so a card
      // rendered before this field existed cannot throw and break the save.
      category: (el.querySelector('.hireling-category') || {}).value || '',
      type: el.querySelector('.hireling-type').value,
      // Defensive for the same reason as `category` above.
      level: (el.querySelector('.hireling-level') || {}).value || '',
      quantity: el.querySelector('.hireling-quantity').value,
      wage: el.querySelector('.hireling-wage').value,
      duration: el.querySelector('.hireling-duration').value,
      purpose: el.querySelector('.hireling-purpose').value,
      alignment: el.querySelector('.hireling-alignment').value,
      thac0: el.querySelector('.hireling-thac0').value,
      str: el.querySelector('.hireling-str').value,
      dex: el.querySelector('.hireling-dex').value,
      con: el.querySelector('.hireling-con').value,
      int: el.querySelector('.hireling-int').value,
      wis: el.querySelector('.hireling-wis').value,
      cha: el.querySelector('.hireling-cha').value,
      per: el.querySelector('.hireling-per').value,
      com: el.querySelector('.hireling-com').value,
      status: el.querySelector('.hireling-status').value,
      notes: el.querySelector('.hireling-notes').value
    });
  });

  // Animal Companions
  const companions = [];
  qsa(root,'.companions-list .item').forEach(el=>{
    companions.push({
      name: el.querySelector('.companion-name').value,
      species: el.querySelector('.companion-species').value,
      hd: el.querySelector('.companion-hd').value,
      hp: el.querySelector('.companion-hp').value,
      ac: el.querySelector('.companion-ac').value,
      thac0: el.querySelector('.companion-thac0').value,
      attacks: el.querySelector('.companion-attacks').value,
      alignment: el.querySelector('.companion-alignment').value,
      str: el.querySelector('.companion-str').value,
      dex: el.querySelector('.companion-dex').value,
      con: el.querySelector('.companion-con').value,
      int: el.querySelector('.companion-int').value,
      wis: el.querySelector('.companion-wis').value,
      cha: el.querySelector('.companion-cha').value,
      per: el.querySelector('.companion-per').value,
      com: el.querySelector('.companion-com').value,
      loyalty: el.querySelector('.companion-loyalty').value,
      bond: el.querySelector('.companion-bond').value,
      status: el.querySelector('.companion-status').value,
      // Mount-ness is independent of bond type -- see makeCompanionNode.
      // Movement and capacity are collected whether or not isMount is ticked,
      // so unticking it never destroys recorded values.
      isMount: !!(el.querySelector('.companion-is-mount') || {}).checked,
      movement: (el.querySelector('.companion-movement') || {}).value || '',
      capacity: (el.querySelector('.companion-capacity') || {}).value || '',
      abilities: el.querySelector('.companion-abilities').value,
      notes: el.querySelector('.companion-notes').value
    });
  });

  const avatar = root._avatarData || null;

  // Details tab
  const details = {
    homeworld: val(root,'homeworld'),
    homeland: val(root,'homeland'),
    birthplace: val(root,'birthplace'),
    patronDeity: val(root,'patron_deity'),
    // PHB Ch.7 optional rule: greater / lesser / demigod. Stored alongside the
    // patron's name because it is a property of the deity, not of the character.
    deityStatus: val(root,'deity_status'),
    birthorder: val(root,'birthorder'),
    father: val(root,'father'),
    mother: val(root,'mother'),
    siblings: val(root,'siblings'),
    familyStanding: val(root,'family_standing'),
    familyOccupation: val(root,'family_occupation'),
    familyWealth: val(root,'family_wealth'),
    inheritance: val(root,'inheritance'),
    familyProperty: val(root,'family_property'),
    extendedFamily: val(root,'extended_family'),
    familyHistory: val(root,'family_history'),
    height: val(root,'height'),
    weight: val(root,'weight'),
    age: val(root,'age'),
    hair: val(root,'hair'),
    eyes: val(root,'eyes'),
    appearanceNotes: val(root,'appearance_notes'),
    alliances: val(root,'alliances'),
    // henchmenMax and loyaltyBase deliberately absent -- see loadSheet.
    // Charisma is already saved; these are read back out of CHA_TABLE.
    henchmenNotes: val(root,'henchmen_notes'),
    backgroundHistory: val(root,'background_history')
  };

  // Notes tab - collect entries from each category
  const notesTab = {
    sessionLog: Array.from(qsa(root, '.notes-entries-list[data-category="session_log"] .item')).map(item => item._entryData).filter(d => d),
    questJournal: Array.from(qsa(root, '.notes-entries-list[data-category="quest_journal"] .item')).map(item => item._entryData).filter(d => d),
    npcs: Array.from(qsa(root, '.notes-entries-list[data-category="npcs"] .item')).map(item => item._entryData).filter(d => d),
    locations: Array.from(qsa(root, '.notes-entries-list[data-category="locations"] .item')).map(item => item._entryData).filter(d => d),
    characterJournal: Array.from(qsa(root, '.notes-entries-list[data-category="character_journal"] .item')).map(item => item._entryData).filter(d => d)
  };
  
  // === Conditions ===
  const conditions = Array.from(qsa(root, '.conditions-list .condition-item')).map(item => ({
    condition: item.dataset.condition,
    duration: item.dataset.duration,
    hpLoss: item.dataset.hpLoss || ''
  }));
  
  // === Languages ===
  const languages = root._languages || [];
  
  // === Weapon and non-weapon proficiencies ===
  const weaponProfs = root._weaponProfs || [];
  const nwps = root._nwps || [];
  
  // === Combat Round ===
  const roundDisplay = root.querySelector('.combat-round-display');
  const combatRound = roundDisplay ? parseInt(roundDisplay.textContent, 10) || 1 : 1;

  return {
    meta,
    weaponProficiencies,
    nonWeaponProficiencies,
    classAbilities,
    racialAbilities,
    kitAbilities,
    thief,
    notesEx,
    magic,
    spells,
    items,
	valuables,
    armor,
    weapons,
	ammunition,
    magicItems,
    mounts,
	henchmen,
	hirelings,
	companions,
	savingThrows: saveMods,
    coins: {
      cp: val(root,'cp'),
      sp: val(root,'sp'),
      ep: val(root,'ep'),
      gp: val(root,'gp'),
      pp: val(root,'pp')
    },
    encumbrance: {
      current: val(root,'encumbrance_current'),
      max: val(root,'encumbrance_max')
    },
    profSlotAdj: {
      wp: val(root,'prof_wp_adj'),
      nwp: val(root,'prof_nwp_adj')
    },
    // PHBR1 pp.61-64. Slot COUNTS, not booleans: Single-Weapon and Weapon and
    // Shield can each take a second slot for a further benefit, and the others
    // cannot. Saved unconditionally, whether or not PHBR1 is switched on --
    // disabling the book suspends the EFFECT, never the purchase.
    fightingStyles: {
      singleWeapon: val(root,'style_single_weapon'),
      twoHander:    val(root,'style_two_hander'),
      weaponShield: val(root,'style_weapon_shield'),
      twoWeapon:    val(root,'style_two_weapon'),
      ambidextrous: val(root,'style_ambidextrous')
    },
    // A physical characteristic, on the Details tab with height and hair, and
    // UNGATED -- a character is right- or left-handed whatever books the table
    // uses. Only the RULE attached to it is PHBR1's (p.57): -2 to hit with all
    // attacks on a round he is forced to use the wrong hand. "If he does not
    // specify one, the DM should assume the character is right-handed."
    handedness: val(root,'handedness'),
    // PHBR1. The branching-kit choice — Pirate/Outlaw orientation, Amazon race.
    // TOP LEVEL, not inside meta, because that is where loadSheet reads it from.
    // It was written NOWHERE until now: loadSheet has always read data.kitVariant
    // and collectSheet has never produced it, so every variant silently reset to
    // the race-or-default fallback on the next load.
    kitVariant: val(root,'kit_variant'),
    // Kit-granted proficiencies the player has deliberately deleted. Without
    // this the next syncKitGrantedNWPs puts every one of them straight back, so
    // the decision survived only until the character was reloaded.
    declinedGrants: root._declinedGrants || [],
    selectedSpheres: selectedSpheres,
    selectedSchools: selectedSchools,
	languages: languages,
	weaponProfs: weaponProfs,
    nwps: nwps,
    avatar,
	details,
	notesTab,
	conditions: conditions,
	combatRound: combatRound,
	// Per-character sync timestamp. Every save path routes through collectSheet(),
	// so stamping here covers autosave, Save, and Save As. KV sync compares this
	// to decide which copy of a character is newer. Records saved before this
	// existed have no _updatedAt and are treated as oldest (see kvMergeChars).
	_updatedAt: Date.now()
  };
}

// Runs the spell-data migration after a character loads. Async so it can wait
// for SPELLS_DB; called fire-and-forget from loadSheet so loadSheet stays sync.
// Migrates the DATA in place, re-renders the affected UI, and surfaces only
// level changes (which affect slot accounting) in a dismissible banner.
async function migrateSheetSpells(root) {
  if (typeof migrateSavedSpells !== 'function') return;
  await loadSpells();

  const levelChanges = [];

  // Spellbooks (data lives on root._spellbooksData; UI rebuilt after).
  const sbData = (typeof getSpellbooksData === 'function') ? getSpellbooksData(root) : null;
  let spellbooksTouched = false;
  if (sbData && Array.isArray(sbData.spellbooks)) {
    sbData.spellbooks.forEach(sb => {
      if (Array.isArray(sb.spells) && sb.spells.length) {
        const changes = migrateSavedSpells(sb.spells);
        if (changes.length) { levelChanges.push(...changes); }
        spellbooksTouched = true;
      }
    });
    if (spellbooksTouched && typeof setupSpellbookTabs === 'function') {
      setupSpellbookTabs(root);   // rebuild UI from migrated data
    }
  }

  // Memorized spells store their fields as live DOM inputs (no _spellData
  // object), so build a plain record from each node, migrate it, then write the
  // cleaned values back into the inputs.
  const memList = root.querySelector('.memspells-list');
  if (memList) {
    Array.from(memList.querySelectorAll('.item')).forEach(node => {
      const get = sel => node.querySelector(sel);
      const rec = {
        name:         get('.title')?.value || '',
        level:        get('.level')?.value || '',
        schoolSphere: get('.school-sphere')?.value || '',
        castTime:     get('.cast-time')?.value || '',
        range:        get('.range')?.value || '',
        duration:     get('.duration')?.value || '',
        components:   get('.components')?.value || '',
        save:         get('.save')?.value || '',
        description:  get('.description')?.value || ''
      };
      const changes = migrateSavedSpells([rec]);
      if (changes.length) { levelChanges.push(...changes); }

      // Write cleaned values back into the DOM inputs.
      const setVal = (sel, v) => { const el = get(sel); if (el != null && v != null && v !== '') el.value = v; };
      setVal('.level', rec.level);
      setVal('.school-sphere', rec.schoolSphere);
      setVal('.cast-time', rec.castTime);
      setVal('.range', rec.range);
      setVal('.duration', rec.duration);
      setVal('.components', rec.components);
      setVal('.save', rec.save);
      setVal('.description', rec.description);
    });
    if (typeof renderMemorizedSpellStatus === 'function') renderMemorizedSpellStatus(root);
  }

  if (levelChanges.length) {
    showSpellMigrationBanner(root, levelChanges);
  }
}

// Dismissible banner listing level corrections. Separate from .sidebar-message
// (which the autosave loop overwrites every second).
function showSpellMigrationBanner(root, changes) {
  let banner = root.querySelector('.spell-migration-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'spell-migration-banner';
    banner.style.cssText =
      'margin:8px 0;padding:10px 12px;border:1px solid var(--accent);' +
      'border-radius:6px;background:var(--glass);font-size:12px;';
    const anchor = root.querySelector('.spell-access-container') ||
                   root.querySelector('.spellbook-list');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(banner, anchor);
    } else {
      root.appendChild(banner);
    }
  }
  const rows = changes.map(c =>
    `<li><strong>${escapeHtml(c.name)}</strong>: level ${c.from} &rarr; ${c.to}` +
    (c.ref ? ` <span style="color:var(--muted)">(${c.ref})</span>` : '') + `</li>`
  ).join('');
  banner.innerHTML =
    `<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">` +
    `<div><strong>Spell levels updated from the compendium:</strong>` +
    `<ul style="margin:6px 0 0 16px;padding:0;">${rows}</ul></div>` +
    `<button class="dismiss-spell-migration" style="padding:2px 8px;flex:none;">&times;</button></div>`;
  banner.style.display = 'block';
  banner.querySelector('.dismiss-spell-migration').onclick = () => { banner.style.display = 'none'; };
}

// Populate the Campaign Setting dropdown from CAMPAIGN_SETTINGS. Greyed
// (disabled:false) settings appear but are non-selectable. Idempotent.
// === ALIGNMENT DROPDOWN (PHB Chapter 4) ===
// Options are built from ALIGNMENTS in tables.js so the vocabulary lives in
// exactly one place. Two menus come off the same data: the character's own,
// which offers the nine alignments and nothing else, and the follower menu,
// which also offers Non-aligned, Unknown and Other -- a war dog holds no
// ethical position at all, and a DM's notes on an NPC are not always tidy.
function buildAlignmentOptions(mode, selectedKey) {
  if (typeof ALIGNMENTS === 'undefined' || typeof ALIGNMENT_ORDER === 'undefined') {
    return '<option value=""></option>';
  }

  // Marked as each option is built. Searching the finished string for the
  // right option afterwards would break on any value containing a quote.
  const sel = k => (selectedKey && k === selectedKey) ? ' selected' : '';

  let html = '<option value=""></option>';

  ALIGNMENT_ORDER.forEach(key => {
    const a = ALIGNMENTS[key];
    if (a.notAnAlignment && mode !== 'follower') return;
    const suffix = a.notAnAlignment ? '' : ' (' + a.abbr + ')';
    html += '<option value="' + key + '"' + sel(key) + '>' +
            escapeHtml(a.label + suffix) + '</option>';
  });

  if (mode === 'follower' && typeof ALIGNMENT_NON_VALUES !== 'undefined') {
    Object.keys(ALIGNMENT_NON_VALUES).forEach(k => {
      html += '<option value="' + k + '"' + sel(k) + '>' +
              escapeHtml(ALIGNMENT_NON_VALUES[k]) + '</option>';
    });
  }

  return html;
}

// A finished <select> for a follower card, with `value` already selected.
// Returning markup rather than an element means each node builder needs ONE
// swap inside its innerHTML string and no follow-up call afterwards.
// Unrecognised text is preserved as its own option exactly as on the
// character's own menu, so a DM's note reading "chaotic-ish" survives.
function alignmentSelectHTML(cls, value, style) {
  const text = String(value == null ? '' : value).trim();

  let target = (text && typeof normalizeAlignmentKey === 'function')
    ? normalizeAlignmentKey(text) : '';
  if (!target && text && typeof ALIGNMENT_NON_VALUES !== 'undefined' &&
      ALIGNMENT_NON_VALUES[text.toLowerCase()]) {
    target = text.toLowerCase();
  }

  let opts = buildAlignmentOptions('follower', target);
  if (text && !target) {
    opts += '<option value="' + escapeHtml(text) + '" selected>' +
            escapeHtml(text) + '  (unrecognised)</option>';
  }

  return '<select class="' + escapeHtml(cls) + '" style="' +
         escapeHtml(style || 'width:100%;') + '">' + opts + '</select>';
}

// Fills a <select> and selects `raw`, which may already be a key, may be
// legacy free text, or may be something nobody recognises.
//
// UNRECOGNISED TEXT IS NEVER DISCARDED. Assigning an unmatched value to a
// <select> silently blanks it, and collectSheet would then write that blank
// straight back over the character's real alignment on the next save. So
// anything that does not resolve is injected as its own option and left
// selected -- a sheet that held "Lawful Stupid" still holds it afterwards.
function fillAlignmentSelect(selectEl, raw, mode) {
  if (!selectEl) return;
  selectEl.innerHTML = buildAlignmentOptions(mode);

  const text = (raw === undefined || raw === null) ? '' : String(raw).trim();
  if (!text) { selectEl.value = ''; return; }

  let target = (typeof normalizeAlignmentKey === 'function')
    ? normalizeAlignmentKey(text) : '';

  // A value the app itself wrote on a follower card ("unknown", "other").
  if (!target && typeof ALIGNMENT_NON_VALUES !== 'undefined' &&
      ALIGNMENT_NON_VALUES[text.toLowerCase()]) {
    target = text.toLowerCase();
  }

  // Either unrecognised, or a real key this particular menu does not offer.
  // Keep the original text verbatim rather than losing it.
  if (!target || !Array.from(selectEl.options).some(o => o.value === target)) {
    const opt = document.createElement('option');
    opt.value = text;
    opt.textContent = text + '  (unrecognised)';
    selectEl.appendChild(opt);
    selectEl.value = text;
    return;
  }

  selectEl.value = target;
}

function populateAlignmentDropdown(root) {
  const sel = qs(root, '[data-field="alignment"]');
  if (!sel) return;
  fillAlignmentSelect(sel, sel.value, 'character');
}

// loadSheet's counterpart to val(). Fills the options and sets the value in
// one call, so nothing can set a value before its option exists.
function setAlignmentValue(root, raw) {
  const sel = qs(root, '[data-field="alignment"]');
  if (!sel) return;
  fillAlignmentSelect(sel, raw, 'character');
}

function populateCampaignSettings(root) {
  const sel = root.querySelector('[data-field="campaign_setting"]');
  if (!sel || sel.options.length > 0) return;
  if (typeof CAMPAIGN_SETTINGS === 'undefined') return;
  Object.keys(CAMPAIGN_SETTINGS).forEach(key => {
    const s = CAMPAIGN_SETTINGS[key];
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = s.enabled ? s.label : s.label + ' \u2014 (no effect yet)';
    opt.disabled = !s.enabled;
    sel.appendChild(opt);
  });
  // Changing the setting re-renders the priest sphere menu so setting-specific
  // spheres appear/disappear, and marks the sheet unsaved.
  sel.addEventListener('change', () => {
    if (typeof renderSpellAccess === 'function') renderSpellAccess(root);
    markUnsaved(document.querySelector('.tab.active'), true, root);
  });
}

function loadSheet(root, data){
  if(!data) return;

  // Clear FIRST. From here until the flag is set again at the bottom, this sheet
  // is mid-render and autosave will refuse to write it. The early return above
  // is deliberately left outside that window: a call with no data renders
  // nothing, so it must not invalidate a sheet that already rendered fine.
  root._renderComplete = false;

  // Declined kit grants. Set HERE, at the very top, because syncKitGrantedNWPs
  // reads it on the FIRST kit render -- set it any later and that first sync
  // re-adds every grant the player deleted, which is the bug this fixes.
  // Absent on records saved before this existed, which reads as an empty list:
  // nothing declined, every grant restored exactly as before.
  root._declinedGrants = Array.isArray(data.declinedGrants) ? data.declinedGrants : [];

  // Twelve list builders below pass ()=>markUnsaved(tab,true,root) as their
  // onChange, but this function's signature is (root, data) -- there has never
  // been a `tab` in scope, so every one of those arrows threw ReferenceError on
  // its first line and list edits never marked the sheet dirty. Saves were
  // carried entirely by the top-level fields, which bind through bindSheet.
  //
  // Resolved from the ROOT, not from .tab.active. Those are not the same thing:
  // loadSheet runs while the previous tab is still frontmost, so capturing the
  // active tab here binds a second character's edits to the first one's tab.
  // newTab links the two explicitly -- root is the .sheet-container inside a
  // .tab-content carrying the tab's id -- so walk that instead.
  const tab = getTabForRoot(root);

  const m = data.meta || {};
  populateCampaignSettings(root);   // options must exist before we set the value
  val(root,'name',m.name||'');
  val(root,'player',m.player||'');
  // Absent on every record saved before the field existed, which reads as empty
  // -- correct, and no migration needed.
  val(root,'title',m.title||'');
  val(root,'race',m.race||'');
  val(root,'gender',m.gender||'');
  val(root,'clazz',m.clazz||'');
  val(root,'level',m.level||'');
  // Options must exist before we set the value -- the same rule as
  // populateCampaignSettings above, which was fixed for this exact defect.
  // Setting a <select> to an option that does not exist yet fails SILENTLY and
  // leaves it at "". populateKitDropdown then ran hundreds of lines later,
  // read the already-empty value as its "current selection", and faithfully
  // restored the emptiness -- so every character silently lost its kit on load.
  //
  // It reads only clazz (set on the line above); isMultiClass parses the class
  // string and getKitsForClass takes a class name, so neither needs char_type,
  // which is not restored until further down. It is called again later in
  // loadSheet, which is harmless -- the second call preserves the selection.
  populateKitDropdown(root);
  val(root,'kit',m.kit||'');
  setAlignmentValue(root, m.alignment || '');
  val(root,'campaign_setting', m.campaign_setting || 'core');
  val(root,'xp',m.xp||'');
  // Load multi-class/dual-class data (backward compatible - defaults to 'single')
  val(root,'char_type',m.char_type||'single');
  val(root,'mc_class1',m.mc_class1||'');
  val(root,'mc_class2',m.mc_class2||'');
  val(root,'mc_class3',m.mc_class3||'');
  val(root,'mc_level1',m.mc_level1||'1');
  val(root,'mc_level2',m.mc_level2||'1');
  val(root,'mc_level3',m.mc_level3||'1');
  // Load dual-class data
  val(root,'dc_original_class',m.dc_original_class||'');
  val(root,'dc_original_level',m.dc_original_level||'');
  val(root,'dc_new_class',m.dc_new_class||'');
  val(root,'dc_new_level',m.dc_new_level||'1');
  val(root,'dc_original_hp',m.dc_original_hp||'');
  val(root,'dc_new_hp',m.dc_new_hp||'');
  // Initialize field visibility based on char_type
  // Use setTimeout to ensure DOM is fully updated before calculating
  setTimeout(() => {
    handleCharacterTypeChange(root);
  }, 0);
  val(root,'hp',m.hp||'');
  val(root,'damage_taken',m.damage_taken||'');
  val(root,'hit_dice_manual',m.hit_dice_manual||'');
	val(root,'con_initial',m.con_initial||'');
	val(root,'deaths_to_date',m.deaths_to_date||'');
	val(root,'druid_role',m.druid_role||'');
	val(root,'druid_surrendered_xp',m.druid_surrendered_xp||'');
	val(root,'druid_bonus_1',m.druid_bonus_1||'');
	val(root,'druid_bonus_2',m.druid_bonus_2||'');
	val(root,'druid_bonus_3',m.druid_bonus_3||'');
	val(root,'druid_bonus_4',m.druid_bonus_4||'');
	val(root,'druid_bonus_5',m.druid_bonus_5||'');
	val(root,'druid_bonus_6',m.druid_bonus_6||'');
	// Baseline for the Hierophant XP-transfer detector: seed it from the loaded
	// role so a load never looks like a fresh selection and never moves XP.
	root._prevDruidRole = (m.druid_role || '').toLowerCase();
  val(root,'ac',m.ac||'');
  val(root,'ac_manual',m.ac_manual||'');
  val(root,'str',m.str||'');
  val(root,'str_exceptional',m.str_exceptional||'');
  val(root,'dex',m.dex||'');
  val(root,'con',m.con||'');
  val(root,'int',m.int||'');
  val(root,'wis',m.wis||'');
  val(root,'cha',m.cha||'');
  val(root,'per',m.per||'');
  val(root,'com',m.com||'');
  val(root,'movement_flying',m.movement_flying||'');
  const s = m.saves || [];
  val(root,'save1',s[0]||'');
  val(root,'save2',s[1]||'');
  val(root,'save3',s[2]||'');
  val(root,'save4',s[3]||'');
  val(root,'save5',s[4]||'');
  val(root,'notes',m.notes||'');
  
  // Calculate current HP after loading
  renderCurrentHP(root);
  renderHitDice(root);
  renderRevivals(root);
  
  // Combat attacks per round
  const attacksPerRoundEl = qs(root, '.combat-attacks-per-round');
  if (attacksPerRoundEl) {
    attacksPerRoundEl.value = m.attacks_per_round || '';
  }
  // The Core tab override is the field players edit now. Migrate any value from
  // the old sidebar box on first load so nothing entered before this change is
  // silently lost -- the sidebar is a readonly mirror from here on.
  // Migrate ONLY from records saved before the Core-tab field existed. Testing
  // for undefined rather than falsy is essential: a new record stores '' when
  // there is no override, and `||` would fall through to attacks_per_round --
  // which now holds the EFFECTIVE value, so every load would copy the derived
  // number into the override field and permanently flag a manual override.
  val(root, 'attacks_per_round_manual',
      (m.attacks_per_round_manual !== undefined)
        ? m.attacks_per_round_manual
        : (m.attacks_per_round || ''));
  if (typeof renderAttacksPerRound === 'function') renderAttacksPerRound(root);

  // Skills lists
  const wlist = qs(root,'.weapon-profs-list'); wlist.innerHTML='';
  (data.weaponProficiencies||[]).forEach(p=>wlist.appendChild(makeWeaponProfNode(p)));

  const nwp = qs(root,'.nwp-list'); nwp.innerHTML='';
  const nwpSource = (data.nonWeaponProficiencies || data.proficiencies || []);
  nwpSource.forEach(p=>nwp.appendChild(makeProfNode(p)));
  
  // Load languages
  root._languages = data.languages || [];
  if (typeof ensureNativeLanguage === 'function') ensureNativeLanguage(root);
  
  // Load weapon proficiencies
  const profAdj = data.profSlotAdj || {};
  val(root, 'prof_wp_adj',  profAdj.wp  || 0);
  val(root, 'prof_nwp_adj', profAdj.nwp || 0);

  // Characters saved before PHBR1 existed have no fightingStyles key at all, so
  // every style reads 0 and the block is inert. Nothing to migrate.
  const styles = data.fightingStyles || {};
  val(root, 'style_single_weapon', styles.singleWeapon || 0);
  val(root, 'style_two_hander',    styles.twoHander    || 0);
  val(root, 'style_weapon_shield', styles.weaponShield || 0);
  val(root, 'style_two_weapon',    styles.twoWeapon    || 0);
  val(root, 'style_ambidextrous',  styles.ambidextrous || 0);
  // Right by the book's own default, which also means every character saved
  // before this field existed loads as right-handed rather than blank.
  val(root, 'handedness', data.handedness || 'right');
  // STASHED ON root, not written to the select. At this point the variant
  // <select> has no options at all -- populateKitVariantDropdown has not run --
  // and assigning .value to a select with no matching option silently yields "".
  // The old code set it here and then populateKitVariantDropdown read the field
  // back, got "", and fell through to race-or-default, so the choice never
  // survived a load. The comment claiming this ordering was deliberate had it
  // exactly backwards.
  root._pendingKitVariant = data.kitVariant || '';

  root._weaponProfs = data.weaponProfs || [];
  
  // Load non-weapon proficiencies
  root._nwps = data.nwps || [];

  const cl = qs(root,'.class-abilities-list'); cl.innerHTML='';
  (data.classAbilities||[]).forEach(p=>cl.appendChild(makeAbilityNode(p, ()=>markUnsaved(tab,true,root))));

  const rl = qs(root,'.racial-abilities-list'); rl.innerHTML='';
  (data.racialAbilities||[]).forEach(p=>rl.appendChild(makeAbilityNode(p, ()=>markUnsaved(tab,true,root))));

  const kl = qs(root,'.kit-abilities-list'); kl.innerHTML='';
  (data.kitAbilities||[]).forEach(p=>kl.appendChild(makeAbilityNode(p, ()=>markUnsaved(tab,true,root))));

  // Thief abilities
  const t = data.thief || {};
  val(root,'thief_pickpockets', t.pickPockets||'');
  val(root,'thief_openlocks', t.openLocks||'');
  val(root,'thief_traps', t.traps||'');
  val(root,'thief_movesilently', t.moveSilently||'');
  val(root,'thief_hide', t.hideInShadows||'');
  val(root,'thief_detectnoise', t.detectNoise||'');
  val(root,'thief_climb', t.climbWalls||'');
  val(root,'thief_readlang', t.readLanguages||'');
  
  // Restore discretionary points
  val(root,'thief_points_pickpockets', t.pointsPickPockets||0);
  val(root,'thief_points_openlocks', t.pointsOpenLocks||0);
  val(root,'thief_points_traps', t.pointsTraps||0);
  val(root,'thief_points_movesilently', t.pointsMoveSilently||0);
  val(root,'thief_points_hide', t.pointsHide||0);
  val(root,'thief_points_detectnoise', t.pointsDetectNoise||0);
  val(root,'thief_points_climb', t.pointsClimb||0);
  val(root,'thief_points_readlang', t.pointsReadLang||0);
  
  // Load points into the allocation UI inputs
  root.querySelectorAll('.thief-point-input').forEach(input => {
    const skill = input.dataset.skill;
    const savedPoints = val(root, `thief_points_${skill}`) || 0;
    input.value = savedPoints;
  });

  // Extended notes
  const nx = data.notesEx || {};
  val(root,'notes_powers', nx.powers||'');
  val(root,'notes_hindrances', nx.hindrances||'');
  val(root,'notes_classkit', nx.classkit||'');

  // Core lists (spells retained for back-compat only)
  const spl = qs(root,'.spells-list'); if(spl){ spl.innerHTML=''; (data.spells||[]).forEach(sp=>spl.appendChild(makeSpellNode(sp))); }

  const items = qs(root,'.items-list'); items.innerHTML='';
  (data.items||[]).forEach(it=>items.appendChild(makeItemNode(it, ()=>markUnsaved(tab,true,root))));

  const valuables = qs(root,'.valuables-list');
  if(valuables){
    valuables.innerHTML='';
    (data.valuables||[]).forEach(val=>valuables.appendChild(makeValuableNode(val,()=>markUnsaved(tab,true,root))));
  }

  const armor = qs(root,'.armor-list'); armor.innerHTML='';
  (data.armor||[]).forEach(a=>armor.appendChild(makeArmorNode(a, ()=>markUnsaved(tab,true,root))));

  const weapons = qs(root,'.weapons-list'); weapons.innerHTML='';
  (data.weapons||[]).forEach(w=>weapons.appendChild(makeWeaponNode(w, ()=>markUnsaved(tab,true,root))));

  // WEAPONS_DATA loads async, so it may not be ready at load time. Retry briefly.
  if (typeof backfillWeaponCategories === 'function') {
    const tryBackfill = (attempts) => {
      if (typeof WEAPONS_DATA !== 'undefined' && WEAPONS_DATA.length) {
        backfillWeaponCategories(root);
      } else if (attempts > 0) {
        setTimeout(() => tryBackfill(attempts - 1), 300);
      }
    };
    tryBackfill(10);
  }
  
  // Render combat reference after weapons are loaded
  renderCombatQuickReference(root);
  
  const ammunition = qs(root,'.ammunition-list'); 
  if(ammunition){
    ammunition.innerHTML='';
    (data.ammunition||[]).forEach(a=>ammunition.appendChild(makeAmmunitionNode(a, ()=>{
      if(tab) markUnsaved(tab,true,root);
      updateTotalAmmoWeight(root);
      renderEncumbrance(root);
      renderMovementRate(root);
    })));
    updateTotalAmmoWeight(root);
  }
  
  const magicItems = qs(root,'.magic-items-list'); magicItems.innerHTML='';
  // The onChange was MISSING here. Every other list passes one, so on a
  // character loaded from storage an edited magic item never marked the sheet
  // unsaved -- the change was silently lost on the next load. It also has to
  // re-run encumbrance and movement now that magic items carry weight.
  (data.magicItems||[]).forEach(m=>magicItems.appendChild(makeMagicItemNode(m, ()=>{
    if(tab) markUnsaved(tab,true,root);
    renderEncumbrance(root);
    renderMovementRate(root);
  })));
  
  // Mounts
  const mounts = qs(root,'.mounts-list'); 
  if(mounts){
    mounts.innerHTML='';
    (data.mounts||[]).forEach(m=>mounts.appendChild(makeMountNode(m, ()=>{
      if(tab) markUnsaved(tab,true,root);
    })));
    applyArchiveFilter(root, '.mounts-list', '.show-archived-mounts', '.mount-status');
  }
  
  // Mounts show archived toggle
  const showArchivedMounts = root.querySelector('.show-archived-mounts');
  if(showArchivedMounts){
    showArchivedMounts.onchange = ()=>{
      applyArchiveFilter(root, '.mounts-list', '.show-archived-mounts', '.mount-status');
    };
  }
  
  // Henchmen
  const henchmen = qs(root,'.henchmen-list');
  if(henchmen){
    henchmen.innerHTML='';
    (data.henchmen||[]).forEach(h=>henchmen.appendChild(makeHenchmanNode(h, ()=>{
      if(tab) markUnsaved(tab,true,root);
    })));
    applyArchiveFilter(root, '.henchmen-list', '.show-archived-henchmen', '.henchman-status');
  }
  
  // Henchmen show archived toggle
  const showArchivedHenchmen = root.querySelector('.show-archived-henchmen');
  if(showArchivedHenchmen){
    showArchivedHenchmen.onchange = ()=>{
      applyArchiveFilter(root, '.henchmen-list', '.show-archived-henchmen', '.henchman-status');
    };
  }
  
  // Hirelings
  const hirelings = qs(root,'.hirelings-list');
  if(hirelings){
    hirelings.innerHTML='';
    (data.hirelings||[]).forEach(h=>hirelings.appendChild(makeHirelingNode(h, ()=>{
      if(tab) markUnsaved(tab,true,root);
    })));
    applyArchiveFilter(root, '.hirelings-list', '.show-archived-hirelings', '.hireling-status');
  }
  
  // Hirelings show archived toggle
  const showArchivedHirelings = root.querySelector('.show-archived-hirelings');
  if(showArchivedHirelings){
    showArchivedHirelings.onchange = ()=>{
      applyArchiveFilter(root, '.hirelings-list', '.show-archived-hirelings', '.hireling-status');
    };
  }

  // Animal Companions
  const companions = qs(root,'.companions-list');
  if(companions){
    companions.innerHTML='';
    (data.companions||[]).forEach(c=>companions.appendChild(makeCompanionNode(c, ()=>{
      if(tab) markUnsaved(tab,true,root);
    })));
    applyArchiveFilter(root, '.companions-list', '.show-archived-companions', '.companion-status');
  }
  
  // Animal Companions show archived toggle
  const showArchivedCompanions = root.querySelector('.show-archived-companions');
  if(showArchivedCompanions){
    showArchivedCompanions.onchange = ()=>{
      applyArchiveFilter(root, '.companions-list', '.show-archived-companions', '.companion-status');
    };
  }

  setAvatar(root, data.avatar||null);

  // === Magic tab fields ===
  const mg = data.magic || {};
  const slots = mg.slots || [];
  const used = mg.used || [];

  val(root,'slots1',slots[0]||'');
  val(root,'slots2',slots[1]||'');
  val(root,'slots3',slots[2]||'');
  val(root,'slots4',slots[3]||'');
  val(root,'slots5',slots[4]||'');
  val(root,'slots6',slots[5]||'');
  val(root,'slots7',slots[6]||'');
  val(root,'slots8',slots[7]||'');
  val(root,'slots9',slots[8]||'');

  val(root,'used1',used[0]||'');
  val(root,'used2',used[1]||'');
  val(root,'used3',used[2]||'');
  val(root,'used4',used[3]||'');
  val(root,'used5',used[4]||'');
  val(root,'used6',used[5]||'');
  val(root,'used7',used[6]||'');
  val(root,'used8',used[7]||'');
  val(root,'used9',used[8]||'');

  const mems = qs(root,'.memspells-list');
  if(mems){
    mems.innerHTML='';
    (mg.memorized||[]).forEach(s=>{
      mems.appendChild(makeMemSpellNode(s, ()=>{
        if(tab) markUnsaved(tab,true,root);
      }));
    });
    // Update spell status after loading memorized spells
    renderMemorizedSpellStatus(root);
  }
  
  // === Load multiple spellbooks with backward compatibility ===
  if (mg.spellbooks && mg.spellbooks.length > 0) {
    // New format: multiple spellbooks
    // Always default to first spellbook (Primary) on load
    setSpellbooksData(root, {
      spellbooks: mg.spellbooks,
      activeSpellbookId: mg.spellbooks[0].id
    });
  } else if (mg.spellbook && mg.spellbook.length > 0) {
    // Old format: single spellbook array - migrate to new format
    setSpellbooksData(root, {
      spellbooks: [{
        id: generateSpellbookId(),
        name: 'Primary Spellbook',
        spells: mg.spellbook
      }],
      activeSpellbookId: null
    });
    const tempData = getSpellbooksData(root);
    tempData.activeSpellbookId = tempData.spellbooks[0].id;
  } else {
    // No spellbook data - create default empty spellbook
    getSpellbooksData(root);
  }
  
  // Setup and render spellbook tabs
  setupSpellbookTabs(root);

  val(root,'magic-schools', mg.schools || '');
  val(root,'magic-notes', mg.notes || '');

  // Coins
  const coins = data.coins || {};
  val(root,'cp', coins.cp || '');
  val(root,'sp', coins.sp || '');
  val(root,'ep', coins.ep || '');
  val(root,'gp', coins.gp || '');
  val(root,'pp', coins.pp || '');
  
  // Set default level filters to Level 1
  const memspellFilter = qs(root, '.memspell-level-filter');
  if (memspellFilter) {
    memspellFilter.value = '1';
    filterMemorizedSpells(root, '1');
  }

  const spellbookFilter = qs(root, '.spellbook-level-filter');
  if (spellbookFilter) {
    spellbookFilter.value = '1';
    filterSpellbook(root, '1');
  }

  // Encumbrance
  const enc = data.encumbrance || {};
  val(root,'encumbrance_current', enc.current || '');
  val(root,'encumbrance_max', enc.max || '');

  // === Details tab ===
  const d = data.details || {};
  val(root,'homeworld', d.homeworld || '');
  val(root,'homeland', d.homeland || '');
  val(root,'birthplace', d.birthplace || '');
  val(root,'patron_deity', d.patronDeity || '');
  // Absent on every character saved before this change. Empty resolves to
  // "greater" in normalizeDeityPower(), so an old record is unrestricted --
  // a missing value must never be the reason a priest loses spell levels.
  val(root,'deity_status', d.deityStatus || '');
  val(root,'birthorder', d.birthorder || '');
  val(root,'father', d.father || '');
  val(root,'mother', d.mother || '');
  val(root,'siblings', d.siblings || '');
  val(root,'family_standing', d.familyStanding || '');
  val(root,'family_occupation', d.familyOccupation || '');
  val(root,'family_wealth', d.familyWealth || '');
  val(root,'inheritance', d.inheritance || '');
  val(root,'family_property', d.familyProperty || '');
  val(root,'extended_family', d.extendedFamily || '');
  val(root,'family_history', d.familyHistory || '');
  val(root,'height', d.height || '');
  val(root,'weight', d.weight || '');
  val(root,'age', d.age || '');
  val(root,'hair', d.hair || '');
  val(root,'eyes', d.eyes || '');
  val(root,'appearance_notes', d.appearanceNotes || '');
  val(root,'alliances', d.alliances || '');
  // henchmen_max and loyalty_base are NOT restored here. Both are pure
  // functions of Charisma, and renderCharismaEffects further down this same
  // function writes them from CHA_TABLE. Restoring a saved copy first meant an
  // old sheet briefly showed a stale number, and would have kept showing it
  // outright if the table were ever corrected. Derived values are never stored.
  val(root,'henchmen_notes', d.henchmenNotes || '');
  val(root,'background_history', d.backgroundHistory || '');

  // === Notes tab ===
  const nt = data.notesTab || {};
  
  // Load Session Log entries
  const sessionLogList = qs(root, '.notes-entries-list[data-category="session_log"]');
  if (sessionLogList) {
    sessionLogList.innerHTML = '';
    (nt.sessionLog || []).forEach(entry => {
      entry._isEditing = false; // Load in view mode
      const node = makeSessionLogEntry(entry, () => markUnsaved(tab, true, root));
      sessionLogList.appendChild(node);
    });
  }
  
  // Load Quest Journal entries
  const questJournalList = qs(root, '.notes-entries-list[data-category="quest_journal"]');
  if (questJournalList) {
    questJournalList.innerHTML = '';
    (nt.questJournal || []).forEach(entry => {
      entry._isEditing = false;
      const node = makeQuestJournalEntry(entry, () => markUnsaved(tab, true, root));
      questJournalList.appendChild(node);
    });
  }
  
  // Load NPC entries
  const npcsList = qs(root, '.notes-entries-list[data-category="npcs"]');
  if (npcsList) {
    npcsList.innerHTML = '';
    (nt.npcs || []).forEach(entry => {
      entry._isEditing = false;
      const node = makeNPCEntry(entry, () => markUnsaved(tab, true, root));
      npcsList.appendChild(node);
    });
  }
  
  // Load Location entries
  const locationsList = qs(root, '.notes-entries-list[data-category="locations"]');
  if (locationsList) {
    locationsList.innerHTML = '';
    (nt.locations || []).forEach(entry => {
      entry._isEditing = false;
      const node = makeLocationEntry(entry, () => markUnsaved(tab, true, root));
      locationsList.appendChild(node);
    });
  }
  
  // Load Character Journal entries
  const journalList = qs(root, '.notes-entries-list[data-category="character_journal"]');
  if (journalList) {
    journalList.innerHTML = '';
    (nt.characterJournal || []).forEach(entry => {
      entry._isEditing = false;
      const node = makeCharacterJournalEntry(entry, () => markUnsaved(tab, true, root));
      journalList.appendChild(node);
    });
  }

  // === Load Conditions ===
  const conditionsList = qs(root, '.conditions-list');
  if (conditionsList) {
    conditionsList.innerHTML = '';
    (data.conditions || []).forEach(c => {
      const node = makeConditionNode(c, () => {
        if (tab) {
          markUnsaved(tab, true, root);
          renderCombatQuickReference(root);
        }
      });
      conditionsList.appendChild(node);
    });
    updateConditionDisplay(root);
  }
  
  // === Load Combat Round ===
  const roundDisplay = qs(root, '.combat-round-display');
  if (roundDisplay) {
    roundDisplay.textContent = data.combatRound || 1;
  }

  // Update sidebar name immediately after load (already declared earlier)
  const currentNameEl = qs(root, '.current-name');
  if(currentNameEl) currentNameEl.textContent = (m.name||'').trim() || 'Unnamed';

  // Hide any editing message after load
  hideSidebarMessage(root);

  // === Restore Saving Throw Mods if present ===
  const mods = (data.savingThrows || {});
  if (mods.save1 !== undefined) val(root, "savemod1", mods.save1);
  if (mods.save2 !== undefined) val(root, "savemod2", mods.save2);
  if (mods.save3 !== undefined) val(root, "savemod3", mods.save3);
  if (mods.save4 !== undefined) val(root, "savemod4", mods.save4);
  if (mods.save5 !== undefined) val(root, "savemod5", mods.save5);
  if (mods.save5_mental !== undefined) val(root, "savemod5_mental", mods.save5_mental);

  // Store spheres/schools temporarily on root - they'll be restored after renderSpellAccess completes
  if (data.selectedSpheres) {
    root._pendingSpheres = data.selectedSpheres;
  }
  
  if (data.selectedSchools) {
    root._pendingSchools = data.selectedSchools;
  }

  // === Force recalculation of dependent fields ===
  if (typeof renderSpecialistValidation === 'function') renderSpecialistValidation(root);
  if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(root);
  // loadSheet and bindSheet each keep their OWN hand-picked render list instead
  // of calling recalculateAll, so anything added to that function must be
  // repeated in both or it never fires on load.
  if (typeof renderHenchmanLimits === 'function') renderHenchmanLimits(root);
  if (typeof renderExceptionalStrengthLock === 'function') renderExceptionalStrengthLock(root);
  if (typeof renderAgingEffects === 'function') renderAgingEffects(root);
  renderSavingThrows(root);
  renderAttackMatrix(root);
  renderSpellSlots(root);
  cleanupOldWisTooltips(root);
  renderCharismaEffects(root);
  renderConstitutionEffects(root);
  renderStrengthEffects(root);
  renderDexterityEffects(root);
  renderIntelligenceEffects(root);
  renderXPProgression(root);
  renderCoinWeight(root);
  renderRacialAbilities(root);
  renderClassAbilities(root);
  populateKitDropdown(root);
  renderKitAbilities(root);
  renderArmorClass(root);
  renderEncumbrance(root);
  renderMovementRate(root);
  renderSpellAccess(root);
  toggleSpellBrowser(root);
  toggleLanguageBrowser(root);
  renderMemorizedSpellStatus(root);
  sortMemorizedSpells(root);
  toggleSpellbookSection(root);
  sortSpellbook(root);
  renderLanguageProficiencies(root);
  renderWeaponProficiencies(root);
  renderNWProficiencies(root);
  renderProficiencySlots(root);
  renderThiefSkills(root);
  updateThiefSkillsAccessibility(root); // NEW LINE - Update skill accessibility
  renderThiefSkillsSection(root);
  if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
  if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
  renderThiefPointsSection(root);
  updateThiefPointsDisplay(root);
  renderCharacterBonuses(root);
  // Check dwarven abilities on load
  renderRacialChecks(root);
  renderCharacterBonuses(root);
  // Auto-expand all textareas on load (with slight delay to ensure content is rendered)
  setTimeout(() => {
    root.querySelectorAll('textarea').forEach(ta => autoExpand(ta));
  }, 100);

  // Migrate saved spells against the current compendium (async, fire-and-forget
  // so loadSheet stays synchronous). Fixes messy old school/sphere strings and
  // surfaces any level corrections in a dismissible banner.
  migrateSheetSpells(root);

  // RENDER COMPLETED. Set LAST, and never in bindSheet: the whole point is that
  // a builder throwing part-way through this function leaves the flag CLEAR, so
  // autosave refuses to write a sheet whose lists never rendered. collectSheet
  // cannot tell "no weapons" from "the weapons list is missing", and that
  // ambiguity is what flattened a character once already (§0).
  root._renderComplete = true;
}

/* A portrait is { src, crop } -- the stored original, plus the rectangle that
   frames the thumbnail. Anything saved before this feature is a bare data URL,
   which normalises to crop:null and renders exactly as it always did. No
   migration pass: old records simply keep working. */
function normalizeAvatar(a){
  if (!a) return null;
  if (typeof a === 'string') return { src: a, crop: null };
  if (typeof a === 'object' && a.src) return { src: a.src, crop: a.crop || null };
  return null;
}

/* Render the crop by positioning the image inside the box, in PERCENTAGES.
   Percentages rather than pixels because the sidebar's width is fluid: a pixel
   layout would need recomputing on every resize, and this needs recomputing
   never.

   The height and top percentages resolve against the box's HEIGHT while the
   width and left resolve against its WIDTH, so the two only agree if the crop
   rectangle carries the same 3:2 ratio as the box. It always does -- the
   cropper's frame is fixed at 3:2 -- but that is the assumption holding this
   up, which is why applyCrop keeps two decimals instead of rounding. */
function applyAvatarCrop(box, img, crop){
  if (!crop || !crop.w || !crop.h) {
    // No rectangle recorded: fall back to the stylesheet's 100% + cover.
    img.style.width = ''; img.style.height = '';
    img.style.left  = ''; img.style.top    = '';
    img.style.objectFit = '';
    return;
  }
  const nW = img.naturalWidth, nH = img.naturalHeight;
  if (!nW || !nH) return;
  img.style.width  = (nW / crop.w * 100) + '%';
  img.style.height = (nH / crop.h * 100) + '%';
  img.style.left   = (-crop.x / crop.w * 100) + '%';
  img.style.top    = (-crop.y / crop.h * 100) + '%';
  // The percentages already carry the aspect ratio; cover would crop a second
  // time on top of the crop we just expressed.
  img.style.objectFit = 'fill';
}

function setAvatar(root, avatar){
  const box = qs(root,'.avatar');
  const rec = normalizeAvatar(avatar);
  box.innerHTML='';
  box.classList.toggle('has-portrait', !!rec);
  root._avatarData = rec;
  // Cached print raster is derived from what just changed, so it is now stale.
  root._avatarPrint = null;
  if(rec){
    const img = document.createElement('img');
    img.alt = '';
    img.onload = () => applyAvatarCrop(box, img, rec.crop);
    img.src = rec.src;
    box.appendChild(img);
    // A data URL already in the decode cache can be complete before onload is
    // attached. Calling twice is harmless; never calling leaves it unframed.
    if (img.complete && img.naturalWidth) applyAvatarCrop(box, img, rec.crop);
  } else {
    const span = document.createElement('span');
    span.className='small placeholder';
    span.textContent='No avatar — upload below';
    box.appendChild(span);
  }
}

/* The printable 3:2 raster. DERIVED, so it is never stored -- print.js asks for
   it at print time and the result is memoised on the root for the session only.
   Drawn from the <img> already in the DOM, which is decoded by the time anyone
   can click Print, so this stays synchronous and pdfMake gets its data URL
   without a promise. */
function avatarPrintDataUrl(root){
  const rec = root && root._avatarData ? root._avatarData : null;
  if (!rec || !rec.src) return null;
  if (root._avatarPrint) return root._avatarPrint;
  const img = root.querySelector('.avatar img');
  // Not decoded yet: the original is still a valid image, so print that rather
  // than printing nothing.
  if (!img || !img.complete || !img.naturalWidth) return rec.src;
  const crop = rec.crop;
  const canvas = document.createElement('canvas');
  canvas.width  = AVATAR_OUT_W;
  canvas.height = AVATAR_OUT_H;
  const ctx = canvas.getContext('2d');
  // JPEG has no alpha, so a transparent PNG would composite onto black anyway.
  // Doing it explicitly makes that a decision rather than a surprise.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (crop && crop.w && crop.h) { sx = crop.x; sy = crop.y; sw = crop.w; sh = crop.h; }
  try {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    root._avatarPrint = canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY);
  } catch(err) {
    console.warn('Portrait raster failed:', err);
    return rec.src;
  }
  return root._avatarPrint;
}

/* The ONE lossy step in the portrait path. Runs on upload, before the cropper,
   so the pixels the cropper sees are the pixels that get stored and every later
   re-frame works from them. Skips re-encoding a JPEG that is already small
   enough, because a needless re-encode is a second generation of loss. */
function downscaleImage(dataUrl, maxEdge, quality, cb){
  const im = new Image();
  im.onload = () => {
    const nW = im.naturalWidth, nH = im.naturalHeight;
    if (!nW || !nH) { cb(null); return; }
    const k = Math.min(1, maxEdge / Math.max(nW, nH));
    if (k === 1 && /^data:image\/jpeg/i.test(dataUrl)) { cb(dataUrl); return; }
    const w = Math.max(1, Math.round(nW * k));
    const h = Math.max(1, Math.round(nH * k));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    try {
      ctx.drawImage(im, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', quality));
    } catch(err) { console.warn('Portrait downscale failed:', err); cb(null); }
  };
  im.onerror = () => cb(null);
  im.src = dataUrl;
}

// === PORTRAIT WINDOW ===
//
// The .avatar box is 3:2 landscape; character art is almost always portrait. So
// the crop frames a THUMBNAIL and this shows the artwork as drawn.
//
// Dwell rather than instant: the sidebar is sticky and the cursor crosses it on
// the way to other controls, and a portrait that flashes up on every pass is an
// irritation rather than a feature.
const PORTRAIT_HOVER_DELAY = 450;   // ms of mouse dwell before opening
const PORTRAIT_PRESS_DELAY = 500;   // ms of hold before opening, on touch
const PORTRAIT_PRESS_SLOP  = 10;    // px of finger drift still counted as a hold

function portraitEls(root){
  return {
    pop:  qs(root, '.portrait-pop'),
    img:  qs(root, '.portrait-pop-img'),
    back: qs(root, '.portrait-pop-backdrop')
  };
}

function positionPortraitWindow(root){
  const e = portraitEls(root);
  const box = qs(root, '.avatar');
  if (!e.pop || !box || e.pop.style.display === 'none') return;
  const b = box.getBoundingClientRect();
  const p = e.pop.getBoundingClientRect();
  // Prefer the empty space LEFT of the sidebar. Right of it is usually off the
  // viewport, since the sidebar is the rightmost column.
  let left = b.left - p.width - 12;
  if (left < 8) left = b.right + 12;
  if (left + p.width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - p.width - 8);
  let top = b.top + (b.height / 2) - (p.height / 2);
  if (top < 8) top = 8;
  if (top + p.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - p.height - 8);
  e.pop.style.left = left + 'px';
  e.pop.style.top  = top + 'px';
}

/* viaTouch is load-bearing. The backdrop is a full-viewport element whose only
   job is catching the tap that dismisses this on a phone. Showing it for a
   MOUSE hover slides an invisible sheet under the cursor, which takes the
   pointer off .avatar, fires mouseleave, closes the window, uncovers .avatar,
   fires mouseenter -- and the window flickers open and shut forever. */
function openPortraitWindow(root, viaTouch){
  const rec = root._avatarData;
  const e = portraitEls(root);
  if (!rec || !rec.src || !e.pop || !e.img) return;
  clearTimeout(root._portraitHideT);
  // Position once now and again on load: the window is sized by the image, so
  // before it decodes there is no height to centre against.
  e.img.onload = () => positionPortraitWindow(root);
  e.img.src = rec.src;
  e.pop.style.display = 'block';
  if (viaTouch && e.back) e.back.style.display = 'block';
  positionPortraitWindow(root);
  // Two frames, not one. display:block has to be committed before the class
  // lands, or the opacity transition has no start value and the window snaps in.
  requestAnimationFrame(() => requestAnimationFrame(() => e.pop.classList.add('open')));
}

function closePortraitWindow(root){
  const e = portraitEls(root);
  if (!e.pop) return;
  e.pop.classList.remove('open');
  if (e.back) e.back.style.display = 'none';
  // Hide only after the fade, or it vanishes mid-transition.
  clearTimeout(root._portraitHideT);
  root._portraitHideT = setTimeout(() => {
    e.pop.style.display = 'none';
    if (e.img) { e.img.onload = null; e.img.removeAttribute('src'); }
  }, 200);
}

function bindPortraitWindow(root){
  const box = qs(root, '.avatar');
  const e = portraitEls(root);
  if (!box || !e.pop) return;

  let hoverT = null, pressT = null, pressX = 0, pressY = 0;

  const endPress = () => { clearTimeout(pressT); pressT = null; };

  box.addEventListener('mouseenter', () => {
    if (!root._avatarData) return;
    clearTimeout(hoverT);
    hoverT = setTimeout(() => openPortraitWindow(root), PORTRAIT_HOVER_DELAY);
  });
  box.addEventListener('mouseleave', () => {
    clearTimeout(hoverT); hoverT = null;
    closePortraitWindow(root);
  });

  // Touch. pointerType is tested rather than binding touchstart, so a stylus
  // behaves like a finger and the mouse path above is never doubled up.
  box.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' || !root._avatarData) return;
    pressX = ev.clientX; pressY = ev.clientY;
    clearTimeout(pressT);
    pressT = setTimeout(() => openPortraitWindow(root, true), PORTRAIT_PRESS_DELAY);
  });
  box.addEventListener('pointerup', endPress);
  box.addEventListener('pointercancel', endPress);
  // A scroll that happens to start on the portrait is a scroll. The slop is
  // there because a finger never holds perfectly still -- cancelling on any
  // movement at all would make the long-press almost impossible to trigger.
  box.addEventListener('pointermove', ev => {
    if (ev.pointerType === 'mouse' || !pressT) return;
    if (Math.abs(ev.clientX - pressX) > PORTRAIT_PRESS_SLOP ||
        Math.abs(ev.clientY - pressY) > PORTRAIT_PRESS_SLOP) endPress();
  });
  // Without this, iOS and Android raise their own image menu on top of ours.
  box.addEventListener('contextmenu', ev => { if (root._avatarData) ev.preventDefault(); });

  if (e.back) e.back.addEventListener('click', () => closePortraitWindow(root));
  // These two are per-sheet, so N open tabs means N listeners. Each only acts on
  // its own root and closing an already-closed window is a no-op, so the cost is
  // a few dead calls rather than a bug.
  window.addEventListener('resize', () => positionPortraitWindow(root));
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') closePortraitWindow(root);
  });
}

// === AVATAR CROPPER ===
//
// A FIXED 3:2 window with the image moving behind it, rather than a resizable
// selection box. Two reasons: a wrong-shaped result is impossible, and there is
// no handle-dragging geometry to get wrong. Same interaction as any
// profile-picture cropper.
//
// The ratio is shared by three places -- this frame, the .avatar box in
// style.css, and the print plate's portrait frame -- so a crop fills all three
// edge to edge.
//
// srcUrl is the STORED ORIGINAL and initCrop is the rectangle last recorded
// against it, or null for a fresh upload. Applying records a new rectangle; it
// never rewrites srcUrl, so re-framing is non-destructive however often it runs.
function openAvatarCropper(root, tab, srcUrl, initCrop){
  const overlay   = qs(root, '.avatar-modal-overlay');
  const frame     = qs(root, '.avatar-crop-frame');
  const img       = qs(root, '.avatar-crop-img');
  const zoomInp   = qs(root, '.avatar-crop-zoom');
  const info      = qs(root, '.avatar-crop-info');
  const cancelBtn = qs(root, '.avatar-crop-cancel');
  const applyBtn  = qs(root, '.avatar-crop-apply');
  if(!overlay || !frame || !img || !zoomInp || !cancelBtn || !applyBtn) return;

  // Natural size, current scale, and the image's top-left in frame coordinates.
  let nW = 0, nH = 0, baseScale = 1, scale = 1, x = 0, y = 0;
  let dragging = false, lastX = 0, lastY = 0;

  // Shown before measuring: clientWidth is 0 on a display:none element, and
  // every calculation below is in frame pixels.
  overlay.style.display = 'flex';

  const frameSize = () => ({ w: frame.clientWidth, h: frame.clientHeight });

  // The image must always cover the frame -- no gaps at any offset or zoom.
  const clamp = () => {
    const f = frameSize();
    const dw = nW * scale, dh = nH * scale;
    if (dw <= f.w) { x = (f.w - dw) / 2; }
    else { if (x > 0) x = 0; if (x < f.w - dw) x = f.w - dw; }
    if (dh <= f.h) { y = (f.h - dh) / 2; }
    else { if (y > 0) y = 0; if (y < f.h - dh) y = f.h - dh; }
  };

  const paint = () => {
    clamp();
    img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  };

  // Zoom about the centre of the frame, so the thing being looked at stays put
  // instead of sliding away as the slider moves.
  const onZoom = () => {
    const f = frameSize();
    const z = parseFloat(zoomInp.value) || 1;
    const cx = (f.w / 2 - x) / scale;
    const cy = (f.h / 2 - y) / scale;
    scale = baseScale * z;
    x = f.w / 2 - cx * scale;
    y = f.h / 2 - cy * scale;
    paint();
  };

  const onDown = e => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    frame.style.cursor = 'grabbing';
    if (frame.setPointerCapture) { try { frame.setPointerCapture(e.pointerId); } catch(_) {} }
  };
  const onMove = e => {
    if (!dragging) return;
    x += e.clientX - lastX;
    y += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    paint();
  };
  const onUp = () => { dragging = false; frame.style.cursor = 'grab'; };

  // The modal markup is reused for every crop on this sheet, so listeners have
  // to come off again or they stack and each drag moves the image N times.
  function closeCropper(){
    overlay.style.display = 'none';
    frame.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    zoomInp.removeEventListener('input', onZoom);
    cancelBtn.removeEventListener('click', closeCropper);
    applyBtn.removeEventListener('click', applyCrop);
    img.onload = null; img.onerror = null;
    img.removeAttribute('src');
  }

  // Records a RECTANGLE, not a picture. The 660x440 raster this used to produce
  // was a derived value stored in place of what it derived from -- which is why
  // the original was unrecoverable and Adjust was lossy. The source plus the
  // rectangle are the facts; the thumbnail and the print plate are renders of
  // them, made on demand.
  function applyCrop(){
    const f = frameSize();

    // What the frame is showing, expressed in the source image's own pixels.
    let sx = -x / scale, sy = -y / scale;
    let sw = f.w / scale, sh = f.h / scale;
    // Float guard: clamp() keeps these in range, but a rounding error of a
    // fraction of a pixel puts the rectangle outside the image.
    sx = Math.max(0, Math.min(sx, nW));
    sy = Math.max(0, Math.min(sy, nH));
    sw = Math.min(sw, nW - sx);
    // Derive h from w rather than trusting the frame's own height. sh started
    // as f.h / scale, so sw/sh reduces to f.w/f.h -- and clientWidth and
    // clientHeight are INTEGERS, so a frame CSS-sized at 3:2 reports as e.g.
    // 472x314 (1.5032). That 0.1% was landing in every stored crop.
    //
    // Invisible in the thumbnail (a third of a pixel over a 300px box), but
    // applyAvatarCrop's percentage maths states the rectangle is exactly 3:2,
    // and a documented invariant should be true rather than nearly true.
    sh = Math.min(sw * AVATAR_OUT_H / AVATAR_OUT_W, nH - sy);

    if (!(sw > 0 && sh > 0)) {
      alert('That crop could not be applied. Try again.');
      return;
    }

    // Two decimals, not integers. The thumbnail maths in applyAvatarCrop relies
    // on this rectangle holding the frame's 3:2 ratio, and rounding w and h
    // independently to whole pixels can break that by enough to letterbox.
    setAvatar(root, {
      src: srcUrl,
      crop: {
        x: +sx.toFixed(2), y: +sy.toFixed(2),
        w: +sw.toFixed(2), h: +sh.toFixed(2)
      }
    });
    markUnsaved(tab, true, root);
    closeCropper();
  }

  img.onload = () => {
    nW = img.naturalWidth; nH = img.naturalHeight;
    if (!nW || !nH) { alert('That image could not be read.'); closeCropper(); return; }

    img.style.width  = nW + 'px';
    img.style.height = nH + 'px';

    const f = frameSize();
    baseScale = Math.max(f.w / nW, f.h / nH);   // cover the frame at zoom 1

    if (initCrop && initCrop.w && initCrop.h) {
      // Reopen on the SAME framing the player last chose, rather than resetting
      // to centre. Adjust is now a nudge, so landing somewhere else each time
      // would make it useless.
      scale = f.w / initCrop.w;
      x = -initCrop.x * scale;
      y = -initCrop.y * scale;
      // scale can never fall below baseScale -- a recorded crop is by
      // construction no wider than the cover width -- so this stays in range.
      zoomInp.value = Math.min(4, Math.max(1, scale / baseScale));
    } else {
      scale = baseScale;
      zoomInp.value = 1;
      x = (f.w - nW * scale) / 2;
      y = (f.h - nH * scale) / 2;
    }
    paint();

    if (info) {
      info.textContent = 'Source ' + nW + ' \u00d7 ' + nH +
        ' \u2014 the box sets the thumbnail and print framing. The full image is kept.';
    }
  };
  img.onerror = () => { alert('That image could not be read.'); closeCropper(); };
  img.src = srcUrl;

  frame.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  zoomInp.addEventListener('input', onZoom);
  cancelBtn.addEventListener('click', closeCropper);
  applyBtn.addEventListener('click', applyCrop);
}

// Return true if saved, false if cancelled
function saveAsDialog(root, tab){
  const data = collectSheet(root);
  let name = data.meta.name && data.meta.name.trim()
    ? data.meta.name.trim()
    : prompt('Save character as (name):','');

  if(!name) return false;

  // Save and keep the "slot" consistent (remove old key if renamed)
  const map = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}');
  const oldKey = getTabSaveKey(tab);
  map[name] = data;
  if(oldKey && oldKey !== name){
    // Tombstone the old key rather than deleting it outright. A bare delete is
    // invisible to KV sync -- the merge would simply pull the old name back
    // from the remote copy and you would end up with the character twice.
    map[oldKey] = {
      _deletedAt: Date.now(),
      meta: { name: oldKey }
    };
  }
  // The original bug: this threw, and everything below -- setTabSaveKey, the
  // label update, clearing the unsaved flag, the "Saved" alert -- never ran.
  // No confirmation and no error, which reads exactly like a no-op.
  if(!writeCharacterMap(map, 'Save As')) return false;
  setTabSaveKey(tab, name);

  // Update the tab label from the saved name
  setTabLabel(tab, name);

  // Update the sidebar name immediately
  const currentNameEl = root.querySelector('.current-name');
  if(currentNameEl) currentNameEl.textContent = name;

  // Hide unsaved indicator & message after manual save
  markUnsaved(tab, false, root);

  alert('Saved: ' + name);
  return true;
}

function openPicker(){
  const map = JSON.parse(localStorage.getItem(CHAR_MAP_KEY)||'{}');
  // Deleted characters are kept as tombstones so the deletion can sync to other
  // devices. They must never appear in the picker.
  const names = Object.keys(map).filter(n => !map[n] || !map[n]._deletedAt);
  if(!names.length){
    alert('No saved characters. Use Save As… first.');
    return null;
  }
  const modal=document.createElement('div');
  modal.style.position='fixed';
  modal.style.inset='0';
  modal.style.background='rgba(0,0,0,0.6)';
  modal.style.display='flex';
  modal.style.justifyContent='center';
  modal.style.alignItems='center';
  modal.innerHTML=
    '<div style="background:#232739;padding:20px;border-radius:8px;min-width:320px;color:#fff;border:1px solid var(--border)">' +
      '<h3 style="margin-top:0">Open Saved Character</h3>' +
      '<select id="charPicker" style="width:100%;margin-bottom:12px;padding:6px;border-radius:6px;background:#1a1d29;color:#fff;border:1px solid var(--border)">' +
        names.map(n=>'<option value="'+escapeHtml(n)+'">'+escapeHtml(n)+'</option>').join('') +
      '</select>' +
      '<div style="text-align:right;display:flex;gap:8px;justify-content:flex-end">' +
        '<button id="cancelChar" class="ghost">Cancel</button>' +
        '<button id="openChar">Open</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  return {modal, map};
}

function isTabPristine(root) {
  // Check if the character sheet is untouched/empty
  const data = collectSheet(root);
  const meta = data.meta || {};
  
  // Check if any meaningful data exists
  const hasName = meta.name && meta.name.trim() && meta.name.trim() !== 'Character 1';
  const hasPlayer = meta.player && meta.player.trim();
  const hasRace = meta.race && meta.race.trim();
  const hasClass = meta.clazz && meta.clazz.trim();
  const hasXP = meta.xp && meta.xp !== '0' && meta.xp !== '';
  const hasHP = meta.hp && meta.hp !== '0' && meta.hp !== '';
  
  // Check if any proficiencies, abilities, or equipment exist
  const hasProfs = (data.weaponProficiencies && data.weaponProficiencies.length > 0) ||
                   (data.nonWeaponProficiencies && data.nonWeaponProficiencies.length > 0);
  const hasAbilities = (data.classAbilities && data.classAbilities.length > 0) ||
                       (data.racialAbilities && data.racialAbilities.length > 0) ||
                       (data.kitAbilities && data.kitAbilities.length > 0);
  const hasEquipment = (data.items && data.items.length > 0) ||
                       (data.weapons && data.weapons.length > 0) ||
                       (data.armor && data.armor.length > 0) ||
                       (data.magicItems && data.magicItems.length > 0);
  
  // Tab is pristine if none of the above exist
  return !hasName && !hasPlayer && !hasRace && !hasClass && !hasXP && !hasHP && 
         !hasProfs && !hasAbilities && !hasEquipment;
}

function openIntoCurrentOrNew(name, data) {
  const defaultTab = document.querySelector('.tab[data-id="default"]');
  const defaultContent = document.querySelector('.tab-content[data-id="default"]');
  const defaultRoot = defaultContent ? defaultContent.querySelector('.sheet-container') : null;

  // Check if default tab exists and is pristine
  if (defaultTab && defaultRoot && isTabPristine(defaultRoot)) {
    // Close the pristine default tab
    const wasActive = defaultTab.classList.contains('active');
    stopAutosaveForTab(defaultTab.dataset.id);
    defaultTab.remove();
    defaultContent.remove();
    
    // Create new tab with imported character
    const newId = newTab(name, data);
    setActiveTab(newId);
  } else if (defaultTab && defaultTab.classList.contains('active')) {
    // Default tab exists but has data - convert it
    const id = generateId();
    defaultTab.dataset.id = id;
    defaultTab.removeAttribute("data-default");
    setTabLabel(defaultTab, name);

    // Load the data into UI
    const activeRoot = getActiveRoot();
    if (activeRoot) {
      loadSheet(activeRoot, data);
      setTabSaveKey(defaultTab, name || '');
      markUnsaved(defaultTab, false, activeRoot);
    }
  } else {
    // Normal path: make a new tab
    newTab(name, data);
  }
}

function bindSheet(root, tab){
  // NEW: wire the vertical tabs for this sheet instance
  bindVerticalTabs(root);
  initMobileDrawer(root);

  // Populate the Campaign Setting dropdown for EVERY sheet (new or loaded).
  // loadSheet also calls this, but new characters never go through loadSheet,
  // so without this a brand-new sheet's dropdown would be empty until saved.
  populateCampaignSettings(root);

  // Tab title auto-update from Name
  const nameInput = qs(root,'[data-field="name"]');
  const tabLabel = tab.querySelector('.label');

  const syncTitle = ()=>{
    const nm = (nameInput.value||'').trim();
    const finalName = nm || 'Character';
    tabLabel.textContent = finalName;

    const currentNameEl = qs(root, '.current-name');
    if(currentNameEl) currentNameEl.textContent = nm || 'Unnamed';

    markUnsaved(tab, true, root);
  };
  nameInput.addEventListener('input', syncTitle);
  
  const classInput = qs(root, '[data-field="clazz"]');
  const levelInput = qs(root, '[data-field="level"]');
  [classInput, levelInput].forEach(inp => {
    if (inp) inp.addEventListener("input", () => {
	  // If class changed, reset kit
      if (inp === classInput) {
        const kitSelect = root.querySelector('[data-field="kit"]');
        if (kitSelect) kitSelect.value = '';
        renderKitAbilities(root); // Clear kit abilities
      }
	  
      renderAttackMatrix(root);
      renderSavingThrows(root);
	  renderSpellSlots(root);
	  renderCharismaEffects(root);
	  renderConstitutionEffects(root);
	  renderStrengthEffects(root);
	  renderDexterityEffects(root);
	  renderIntelligenceEffects(root);
	  renderXPProgression(root);
	  renderClassAbilities(root);
	  populateKitDropdown(root);
	  renderSpellAccess(root);
      toggleSpellBrowser(root);
	  renderMemorizedSpellStatus(root);
	  toggleSpellbookSection(root);
	  renderThiefSkills(root);
	  renderThiefSkillsSection(root);
	  renderThiefPointsSection(root);
	  renderTurnUndeadTable(root);
	  updateThiefPointsDisplay(root);
	  renderCharacterBonuses(root);

      // This listener maintains its own hand-written list of renderers, and
      // that list had DRIFTED from recalculateAll(). It was missing
      // renderProficiencySlots -- so weapon, nonweapon and language slots kept
      // their old budget until the character was saved and reloaded -- and also
      // renderAttacksPerRound and renderCombatQuickReference, so a warrior
      // reaching 7th level kept 1 attack per round and a stale quick reference.
      //
      // recalculateAll() is the maintained list and already ends with the quick
      // reference, which must run last because it reads THAC0, AC and Strength
      // adjustments the earlier calls produce. Calling it here means any future
      // addition to it is picked up on level-up for free, instead of this list
      // drifting again. The overlapping calls above are idempotent renders.
      if (typeof recalculateAll === 'function') recalculateAll(root);
    });
  });
  
  // CON triggers constitution effects AND saving throws (for poison adj)
  const conInput = qs(root, '[data-field="con"]');
  if (conInput) {
    conInput.addEventListener("input", () => {
      renderConstitutionEffects(root);
      renderSavingThrows(root); // Re-render to update poison save tooltip
	  renderRacialChecks(root);  // Update dwarven save bonuses
	  renderCharacterBonuses(root);
      // Both read CON and were missing. renderHitDice for the Table 3 hit-die
      // FLOOR note ("Constitution 19: every Hit Die counts a result below 3 as
      // 3"), and renderMovementRate for the breath-holding line, a third of
      // Constitution in rounds. Notes rather than headline figures, which is why
      // the staleness went unseen.
      if (typeof renderHitDice === 'function') renderHitDice(root);
      if (typeof renderMovementRate === 'function') renderMovementRate(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // STR triggers strength effects AND attack matrix (for melee to-hit) AND prime req XP bonus
  const strInput = qs(root, '[data-field="str"]');
  const strExceptionalInput = qs(root, '[data-field="str_exceptional"]');
  if (strInput) {
    strInput.addEventListener("input", () => {
      renderStrengthEffects(root);
      renderAttackMatrix(root); // Re-render for STR-based melee bonus
	  renderEncumbrance(root);
	  renderMovementRate(root);
      renderCombatQuickReference(root);
      renderPrimeRequisiteBonus(root); // Re-render for prime requisite
      const charType = (val(root, "char_type") || "single").toLowerCase();
      if (charType === 'dual') updateDualClassCalculations(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // Exceptional strength field also triggers recalc
  if (strExceptionalInput) {
    strExceptionalInput.addEventListener("input", () => {
      renderStrengthEffects(root);
      renderAttackMatrix(root);
	  renderEncumbrance(root);
	  renderMovementRate(root);
      renderCombatQuickReference(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // DEX triggers dexterity effects AND attack matrix (for missile to-hit) AND saving throws (breath weapon) AND prime req XP bonus AND thief skills
  const dexInput = qs(root, '[data-field="dex"]');
  if (dexInput) {
    dexInput.addEventListener("input", () => {
      renderDexterityEffects(root);
      renderAttackMatrix(root); // Re-render for DEX-based missile bonus
      renderSavingThrows(root); // Re-render for DEX breath weapon save
	  renderArmorClass(root); // Re-render for Armor Class
      renderCombatQuickReference(root);
      renderPrimeRequisiteBonus(root); // Re-render for prime requisite
      renderThiefSkills(root); // Re-render thief skills for DEX modifier
      updateThiefSkillsAccessibility(root); // NEW LINE - Update skill accessibility
	  renderThiefSkillsSection(root);
	  updateThiefSkillsAccessibility(root); // NEW LINE - Update skill accessibility
	  renderThiefPointsSection(root);
	  renderTurnUndeadTable(root);
	  const charType = (val(root, "char_type") || "single").toLowerCase();
      if (charType === 'dual') updateDualClassCalculations(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // Manual AC adjustment triggers AC recalculation
  const acManualInput = qs(root, '[data-field="ac_manual"]');
  if (acManualInput) {
    acManualInput.addEventListener("input", () => {
      renderArmorClass(root);
      markUnsaved(tab, true, root);
    });
  }

  // Manual proficiency slot adjustments (kits, DM rulings) -- live update
  ['prof_wp_adj', 'prof_nwp_adj'].forEach(field => {
    const inp = qs(root, '[data-field="' + field + '"]');
    if (inp) {
      inp.addEventListener("input", () => {
        renderProficiencySlots(root);
        markUnsaved(tab, true, root);
      });
    }
  });

  // INT triggers intelligence effects AND prime req XP bonus
  const intInput = qs(root, '[data-field="int"]');
  if (intInput) {
    intInput.addEventListener("input", () => {
      renderIntelligenceEffects(root);
      renderPrimeRequisiteBonus(root);
      renderProficiencySlots(root);  // INT grants bonus NWP slots (PHB Table 4)
      const charType = (val(root, "char_type") || "single").toLowerCase();
      if (charType === 'dual') updateDualClassCalculations(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // WIS triggers wisdom effects AND spell slots (for bonus spells) AND saving throws AND memorized spell status AND prime req XP bonus
  const wisInput = qs(root, '[data-field="wis"]');
  if (wisInput) {
    wisInput.addEventListener("input", () => {
      renderWisdomPriestEffects(root);
      renderSpellSlots(root);
      renderSavingThrows(root);
      renderMemorizedSpellStatus(root);
      renderPrimeRequisiteBonus(root); // Re-render for prime requisite
	  const charType = (val(root, "char_type") || "single").toLowerCase();
      if (charType === 'dual') updateDualClassCalculations(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // CHA triggers charisma effects (follower capacity, loyalty, reaction adj) AND prime req XP bonus
  const chaInput = qs(root, '[data-field="cha"]');
  if (chaInput) {
    chaInput.addEventListener("input", () => {
      renderCharismaEffects(root);
      renderPrimeRequisiteBonus(root); // Re-render for prime requisite
	  const charType = (val(root, "char_type") || "single").toLowerCase();
      if (charType === 'dual') updateDualClassCalculations(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // XP field triggers XP progression calculation and multi-class XP split
  const xpInput = qs(root, '[data-field="xp"]');
  if (xpInput) {
    xpInput.addEventListener("input", () => {
      const charType = (val(root, "char_type") || "single").toLowerCase();
      if (charType === 'multi') {
        updateMultiClassCalculations(root);
      }
      renderXPProgression(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // === Character Type Dropdown Handler ===
  const charTypeSelect = qs(root, '[data-field="char_type"]');
  if (charTypeSelect) {
    charTypeSelect.addEventListener('change', () => {
      handleCharacterTypeChange(root);
      markUnsaved(tab, true, root);
    });
    
    // Initialize visibility on load
    handleCharacterTypeChange(root);
  }
  
  // === Multi-Class Field Listeners ===
  ['mc_class1', 'mc_class2', 'mc_class3', 'mc_level1', 'mc_level2', 'mc_level3'].forEach(field => {
    const el = qs(root, `[data-field="${field}"]`);
    if (el) {
      el.addEventListener('change', () => {
        updateMultiClassCalculations(root);
        markUnsaved(tab, true, root);
      });
    }
  });
  
  // === Dual-Class Field Listeners ===
  ['dc_original_class', 'dc_original_level', 'dc_new_class', 'dc_new_level'].forEach(field => {
    const el = qs(root, `[data-field="${field}"]`);
    if (el) {
      el.addEventListener('input', () => {
        updateDualClassCalculations(root);
        markUnsaved(tab, true, root);
      });
    }
  });
  
  // === Dual-Class HP Field Listeners ===
  ['dc_original_hp', 'dc_new_hp'].forEach(field => {
    const el = qs(root, `[data-field="${field}"]`);
    if (el) {
      el.addEventListener('input', () => {
        calculateDualClassHP(root);
        markUnsaved(tab, true, root);
      });
    }
  });
  
  // Coin fields trigger coin weight calculation
  ['cp', 'sp', 'ep', 'gp', 'pp'].forEach(coinType => {
    const coinInput = qs(root, `[data-field="${coinType}"]`);
    if (coinInput) {
      coinInput.addEventListener("input", () => {
        renderCoinWeight(root);
		renderEncumbrance(root);
		renderMovementRate(root);
        markUnsaved(tab, true, root);
      });
    }
  });
  
  // HP and Damage Taken fields trigger current HP calculation
  const hpInput = qs(root, '[data-field="hp"]');
  const damageTakenInput = qs(root, '[data-field="damage_taken"]');
  
  if (hpInput) {
    hpInput.addEventListener('input', () => {
      renderCurrentHP(root);
      renderCombatQuickReference(root);
      markUnsaved(tab, true, root);
    });
  }
  
  if (damageTakenInput) {
    damageTakenInput.addEventListener('input', () => {
      renderCurrentHP(root);
      renderCombatQuickReference(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // Clear damage button
  const clearDamageBtn = qs(root, '.clear-damage');
  if (clearDamageBtn) {
    clearDamageBtn.onclick = () => {
      val(root, 'damage_taken', '0');
      renderCurrentHP(root);
      renderCombatQuickReference(root);
      markUnsaved(tab, true, root);
    };
  }

  // Event delegation for the valuables list. Delegation rather than per-node
  // wiring because it covers rows created by loadSheet too, whose onChange only
  // marks the sheet unsaved.
  const valuablesList = qs(root, '.valuables-list');
  if (valuablesList) {
    const valuablesChanged = (e) => {
      const c = e.target.classList;
      if (c.contains('qty') || c.contains('weight')) {
        renderEncumbrance(root);
        renderMovementRate(root);
      }
      // Quantity moves BOTH totals, so it is deliberately in both branches.
      if (c.contains('qty') || c.contains('value-each') || c.contains('value-unit')) {
        if (typeof renderValuablesValue === 'function') renderValuablesValue(root);
      }
    };
    valuablesList.addEventListener('input', valuablesChanged);
    // Dropdowns are read on 'change' -- the convention the rest of this file
    // follows. Without this the Unit selector would move nothing.
    valuablesList.addEventListener('change', valuablesChanged);
  }

  // Add event delegation for items list to trigger encumbrance
  const itemsList = qs(root, '.items-list');
  if (itemsList) {
    itemsList.addEventListener('input', (e) => {
      // Trigger if weight OR quantity changes
      if (e.target.classList.contains('weight') || e.target.classList.contains('qty')) {
        renderEncumbrance(root);
        renderMovementRate(root);
      }
    });
  }

  // Add event delegation for armor list to trigger encumbrance
  const armorList = qs(root, '.armor-list');
  if (armorList) {
    // These fire for EVERY armor row regardless of how it was created, so this
    // is the reliable place to react -- the per-node onChange differs by path
    // (loadSheet passes markUnsaved only, the browser passes recalculateAll).
    //
    // recalculateAll rather than a hand-picked list. The old lists called
    // renderArmorClass, which writes the AC FIELD, but the Combat Quick
    // Reference keeps its own copy of AC and was never told -- which is why AC
    // only moved after a save and reload. The 'input' branch also missed
    // .base-ac and .ac-bonus entirely, so typing an AC updated nothing at all.
    const armorChanged = () => {
      if (typeof recalculateAll === 'function') recalculateAll(root);
      // Advisories are not part of recalculateAll.
      if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
    };

    armorList.addEventListener('input', (e) => {
      // .title is here because thief skills key off the armor NAME -- PHB Table
      // 29 matches on it, so renaming "Leather Armor" to "Studded Leather"
      // changes which column applies.
      if (e.target.classList.contains('weight')   ||
          e.target.classList.contains('base-ac')  ||
          e.target.classList.contains('ac-bonus') ||
          e.target.classList.contains('title')) {
        armorChanged();
      }
    });
    // Separate listener for checkboxes and selects -- 'change', not 'input'.
    armorList.addEventListener('change', (e) => {
      // .equipped, plus both type axes: .armor-slot decides whether a piece
      // counts as body armor at all, .armor-type decides its Table 29 column.
      // .is-magical gates whether the AC bonus applies and whether the piece is
      // excluded from encumbrance effects.
      if (e.target.classList.contains('equipped')   ||
          e.target.classList.contains('armor-type') ||
          e.target.classList.contains('armor-slot') ||
          e.target.classList.contains('is-magical')  ||
          // PHBR1 high-quality racial armor. Reaches encumbrance (elven half
          // weight, half-elven -10%), getThiefArmorCategory (gnome takes no
          // penalty, halfling leather counts as No Armor) and saving throws
          // (human plate gives the wearer +2 vs Rod/Staff/Wand and Breath
          // Weapon) -- so it needs the full recalculateAll, not a local render.
          //
          // THIS WHITELIST IS THE THIRD TIME THIS BUG HAS APPEARED. Adding a
          // control to an armour card is only half the job: if its class is not
          // listed here, nothing recalculates until a save and reload. See the
          // note above about .base-ac and .ac-bonus.
          e.target.classList.contains('armor-hq-race')) {
        armorChanged();
      }
    });
  }

  // Add event delegation for weapons list to trigger encumbrance and combat reference
  const weaponsList = qs(root, '.weapons-list');
  if (weaponsList) {
    weaponsList.addEventListener('input', (e) => {
      // Trigger if weight changes
      if (e.target.classList.contains('weight')) {
        renderEncumbrance(root);
        renderMovementRate(root);
      }
      // Always update combat reference for any weapon changes
      renderCombatQuickReference(root);
    });
    // <select> and checkbox fire 'change', never 'input', so the listener above
    // cannot see them. This previously only watched .equipped, which meant the
    // Category, Type, STR Bonus and Proficiency dropdowns -- all of which move
    // the to-hit number -- left the quick reference card showing stale values
    // until some other edit forced a re-render. Attacks/Rd and Size join them.
    weaponsList.addEventListener('change', (e) => {
      if (e.target.classList.contains('weight')) {
        renderEncumbrance(root);
        renderMovementRate(root);
      }
      // Two weapons grant one extra attack per round (PHB Ch.9), a
      // CHARACTER-level number that lives on the Core tab and is mirrored into
      // the quick reference. This used to fire only for .weapon-offhand, which
      // was too narrow: the stance also depends on which weapons are EQUIPPED
      // and on their category, so equipping a second melee weapon left
      // Attacks/Round stale at its pre-stance value while the weapon cards
      // below it correctly showed the stance in force. Unconditional now --
      // the function is cheap and re-derives everything it needs.
      // recalculateAll rather than the hand-picked pair this used to call. PHBR1
      // p.62 made a WEAPON change able to move ARMOR CLASS: Single-Weapon Style
      // Specialization pays out only while one hand is empty, so equipping a
      // weapon, ticking off-hand, or switching a grip to two-handed all suppress
      // it -- and renderArmorClass was never in this list, so the Core tab kept
      // the bonus until a save and reload while the quick reference below it
      // correctly dropped it. The armor list already learned this lesson; see
      // the comment on armorChanged.
      if (typeof recalculateAll === 'function') recalculateAll(root);
    });
  }
  
  // Combat attacks per round field triggers save
  const attacksPerRoundInput = qs(root, '.combat-attacks-per-round');
  if (attacksPerRoundInput) {
    attacksPerRoundInput.addEventListener('input', () => {
      markUnsaved(tab, true, root);
      if (typeof renderAttacksPerRound === 'function') renderAttacksPerRound(root);
    });
  }
  
  // Race field triggers racial abilities population AND thief skills
  const raceInput = qs(root, '[data-field="race"]');
  if (raceInput) {
    raceInput.addEventListener("input", () => {
      const charType = (val(root, "char_type") || "single").toLowerCase();
      if (charType === 'multi') {
        updateMultiClassCalculations(root);
      } else if (charType === 'dual') {
        updateDualClassCalculations(root);
      }
      renderRacialAbilities(root);
      populateKitDropdown(root);
      renderKitAbilities(root);
      renderMovementRate(root);
      if (typeof ensureNativeLanguage === 'function') ensureNativeLanguage(root);
      renderLanguageProficiencies(root);
      renderProficiencySlots(root);
      renderThiefSkills(root);
	  updateThiefSkillsAccessibility(root);
	  renderThiefSkillsSection(root);
	  renderThiefPointsSection(root);
	  renderTurnUndeadTable(root);
	  renderRacialChecks(root);
	  renderCharacterBonuses(root);
      markUnsaved(tab, true, root);
	  renderNWProficiencies(root);
      renderProficiencySlots(root);

      // This listener kept its own hand-written list of eighteen renderers and
      // had DRIFTED, exactly as the class/level listener above did. Nothing
      // added to recalculateAll since the list was written was reached on a race
      // change: Armor Fitting was the symptom that exposed it -- the wearer
      // dropdown follows the character's race and only updated after a save and
      // reload -- but ranger stealth, armour restrictions and the Tools sub-tab
      // strip all read race too, and only recalculated by luck.
      //
      // Note the multi- and dual-class branches at the top already reach
      // recalculateAll through updateMultiClassCalculations and
      // updateDualClassCalculations, so ONLY SINGLE-CLASS CHARACTERS were
      // affected -- which is the hardest kind of bug to notice, since it works
      // on half your test characters.
      //
      // recalculateAll is the maintained list. The overlapping calls above are
      // idempotent renders; the cost is waste, not error, and the alternative is
      // this list drifting again the next time a panel is added.
      if (typeof recalculateAll === 'function') recalculateAll(root);
    });
  }
  
  const kitInput = qs(root, '[data-field="kit"]');
  if (kitInput) {
    kitInput.addEventListener("change", () => {
      renderKitAbilities(root);
      renderCharacterBonuses(root);
      markUnsaved(tab, true, root);
    });
  }
  
  // Note: Class abilities are triggered by class/level listener below (already exists)

  // Specialist requirement warning -- one delegated listener rather than patching
  // the class, race, char_type and five separate ability listeners individually.
  ['input', 'change'].forEach(evt => {
    root.addEventListener(evt, (e) => {
      const f = e.target && e.target.getAttribute && e.target.getAttribute('data-field');
      if (!f) return;
      if (['clazz', 'race', 'char_type', 'str', 'int', 'wis', 'con', 'cha', 'dex',
           'mc_class1', 'mc_class2', 'mc_class3',
           'dc_new_class', 'dc_original_class'].indexOf(f) !== -1) {
        if (typeof renderSpecialistValidation === 'function') renderSpecialistValidation(root);
        if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(root);
        if (typeof renderExceptionalStrengthLock === 'function') renderExceptionalStrengthLock(root);
      }
      // Aging keys off race AND age, so it takes its own branch rather than
      // pushing 'age' into the list above and running four validators on every
      // keystroke in a field none of them read.
      if (f === 'age' || f === 'race') {
        if (typeof renderAgingEffects === 'function') renderAgingEffects(root);
      }
      // Alignment and kit feed only the two alignment checks, so they take
      // their own branch for exactly the same reason. Class changes are
      // already covered by the list above.
      if (f === 'alignment' || f === 'kit') {
        if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(root);
      }
    });
  });

  // Initial render
  populateAlignmentDropdown(root);
  if (typeof renderSpecialistValidation === 'function') renderSpecialistValidation(root);
  if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(root);
  // loadSheet and bindSheet each keep their OWN hand-picked render list instead
  // of calling recalculateAll, so anything added to that function must be
  // repeated in both or it never fires on load.
  if (typeof renderHenchmanLimits === 'function') renderHenchmanLimits(root);
  if (typeof renderExceptionalStrengthLock === 'function') renderExceptionalStrengthLock(root);
  if (typeof renderAgingEffects === 'function') renderAgingEffects(root);
  renderAttackMatrix(root);
  renderSavingThrows(root);
  renderSpellSlots(root);
  renderCharismaEffects(root);
  renderConstitutionEffects(root);
  renderStrengthEffects(root);
  renderDexterityEffects(root);
  renderIntelligenceEffects(root);
  renderXPProgression(root);
  renderCoinWeight(root);
  renderRacialAbilities(root);
  renderClassAbilities(root);
  populateKitDropdown(root);
  renderKitAbilities(root);
  renderArmorClass(root);
  renderEncumbrance(root);
  renderMovementRate(root);
  renderSpellAccess(root);
  toggleSpellBrowser(root);
  toggleLanguageBrowser(root);
  if (typeof ensureNativeLanguage === 'function') ensureNativeLanguage(root);
  renderLanguageProficiencies(root);
  renderWeaponProficiencies(root);
  renderNWProficiencies(root);
  renderProficiencySlots(root);
  renderMemorizedSpellStatus(root);
  toggleSpellbookSection(root);
  bindDiceRollers(root);
  bindThiefSkillRoller(root);
  bindThiefPointsAllocation(root);
  bindTurnUndead(root);
  // Initialize dwarven abilities
  renderRacialChecks(root);
  renderCharacterBonuses(root);
  bindRacialChecks(root);
  renderCombatQuickReference(root);
  renderCurrentHP(root);
  renderHitDice(root);
  renderRevivals(root);
  renderThiefSkills(root);
  if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
  if (typeof renderAnimalEmpathy === 'function') renderAnimalEmpathy(root);
  if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
  if (typeof renderDruidRole === 'function') renderDruidRole(root);
  // Vision & Light (PHB Ch.13). bindSheet ONLY -- deliberately NOT added to
  // loadSheet or recalculateAll, unlike everything above it. The panel reads
  // nothing from the character, so it cannot go stale when one changes, and
  // re-rendering two static tables on every recalculation would be waste.
  // This is the one exception to the "repeat it in both lists" rule, and the
  // reason is that there is no character state to keep in step.
  if (typeof renderVisionLightPanel === 'function') renderVisionLightPanel(root);
  if (typeof renderCoverReference === 'function') renderCoverReference(root);

  // The strip, on first paint. In BOTH lists -- unlike the two panels above it,
  // which are pure reference and so are bindSheet-only. This one genuinely can
  // go stale: whether a tab exists depends on class and race, so it belongs in
  // recalculateAll as well. Here it just means a character opens with one panel
  // showing rather than a stack that collapses on the first keystroke.
  //
  // Runs after renderRacialChecks and renderThiefSkills above, which is what it
  // reads to decide the strip's contents.
  if (typeof renderWeaponBreakage === 'function') renderWeaponBreakage(root);
  if (typeof renderArmorFitting === 'function') renderArmorFitting(root);
  if (typeof renderPHBR1OnlyControls === 'function') renderPHBR1OnlyControls(root);
  if (typeof renderToolsSubtabs === 'function') renderToolsSubtabs(root);
  if (typeof renderSectionGroups === 'function') renderSectionGroups(root);

  // Ranger stealth depends on class, level, race and Dexterity across all three
  // character types. One delegated listener rather than patching each of the
  // existing class/level/ability handlers separately.
  const rangerStealthFields =
    /^(clazz|level|race|dex|char_type|mc_(class|level)[123]|dc_(original|new)_(class|level))$/;
  root.addEventListener('input', (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (f && rangerStealthFields.test(f)) {
      if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
      if (typeof renderAnimalEmpathy === 'function') renderAnimalEmpathy(root);
      if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
    }
  });
  root.addEventListener('change', (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (f && rangerStealthFields.test(f)) {
      if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
      if (typeof renderAnimalEmpathy === 'function') renderAnimalEmpathy(root);
      if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
    }
  });

  // PHBR1 pp.61-64. Style specializations are spend, so changing one has to
  // repaint the weapon slot counter immediately. Nothing recalculates on a
  // data-field change generically -- every field is named in some delegated
  // listener like this one -- so a new field that feeds a derived number needs
  // its own branch or it only updates on save and reload.
  // A stale variant key surviving a kit change is silent and wrong -- an Amazon
  // whose orientation is "outlaw". Cleared before the dropdown repopulates so
  // the fallback chain runs fresh.
  root.addEventListener('change', (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (f === 'kit') {
      const sel = root.querySelector('[data-field="kit_variant"]');
      if (sel) sel.value = '';
      // Repopulate EXPLICITLY. populateKitVariantDropdown is called from inside
      // populateKitDropdown, which only runs when the CLASS changes -- so on a
      // kit change it was never reached, and the column stayed in whatever state
      // the last class change left it: hidden, because the kit was empty then.
      // recalculateAll does not touch the kit dropdowns either.
      if (typeof populateKitVariantDropdown === 'function') populateKitVariantDropdown(root);
      if (typeof renderKitAbilities === 'function') renderKitAbilities(root);
      if (typeof recalculateAll === 'function') recalculateAll(root);
    }
    if (f === 'kit_variant') {
      // renderKitAbilities EXPLICITLY. recalculateAll does not touch the kit
      // renderers at all -- the same reason the variant dropdown itself needed
      // an explicit populate call on a kit change. The ability cards are the
      // only visible consequence of choosing an orientation, so without this the
      // dropdown appears to do nothing until a save and reload.
      if (typeof renderKitAbilities === 'function') renderKitAbilities(root);
      if (typeof recalculateAll === 'function') recalculateAll(root);
    }
  });

  const fightingStyleFields =
    /^style_(single_weapon|two_hander|weapon_shield|two_weapon|ambidextrous)$/;
  root.addEventListener('change', (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (f && fightingStyleFields.test(f)) {
      // recalculateAll, NOT a hand-picked list of renderers. A style touches the
      // slot counter, Armor Class, the AC tooltip, the breakdown the Combat
      // Quick Reference reads, and print -- and those have ORDER constraints
      // between them (renderCombatQuickReference has to stay last). Naming three
      // of them here would work today and rot the moment a fourth is added,
      // which is exactly how this bug appeared: the listener repainted the slot
      // counter and nothing else, so AC was only correct after a save and reload.
      if (typeof recalculateAll === 'function') recalculateAll(root);
    }
  });

  // Hit Dice and revival tracking. One delegated listener rather than binding
  // each field separately -- Hit Dice depends on class and level, which live in
  // eleven different fields across the three character types. Bound for both
  // input and change so the <select> controls (char_type, mc_class*) are caught.
  const hitDiceFields =
    /^(hit_dice_manual|attacks_per_round_manual|clazz|level|char_type|con|mc_(class|level)[123]|dc_(original|new)_(class|level))$/;
  const onHpTrackingChange = (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (!f) return;
    if (f === 'con_initial' || f === 'deaths_to_date') renderRevivals(root);
    else if (hitDiceFields.test(f)) {
      renderHitDice(root);
      // Table 15 keys off the same class-and-level fields as Hit Dice.
      if (typeof renderAttacksPerRound === 'function') renderAttacksPerRound(root);
      // renderAttacksPerRound only writes the two CHARACTER-level fields. The
      // per-weapon "Attacks: N/round" lines are built by the quick reference,
      // which reads the same base rate -- so setting a manual override moved the
      // headline number and left every weapon card showing the old one until the
      // character was saved and reloaded. Same drift recalculateAll's closing
      // comment warns about: anything that recalculates WITHOUT touching a
      // weapon row leaves the quick reference stale.
      if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);
    }
  };
  root.addEventListener('input', onHpTrackingChange);
  root.addEventListener('change', onHpTrackingChange);

  // Druid Standing (PHB Ch.3). The role dropdown and the six bonus-pool boxes
  // all feed the spell-slot totals, so any change re-runs renderSpellSlots --
  // which recomputes the slots AND calls renderDruidRole through the render
  // suite, refreshing the pool readout and gate-disabling in one pass. Role and
  // level also change which pool levels the WIS gate gates, hence level is here.
  const druidRoleFields =
    /^(druid_role|druid_bonus_[1-9]|clazz|level|wis)$/;
  const onDruidRoleChange = (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (!f || !druidRoleFields.test(f)) return;

    // XP transfer on the deliberate act of stepping down or reversing it. Fires
    // ONLY on an explicit change of the role dropdown -- never from the derived
    // role, a level edit, or a load -- so a misclick is the only thing it can be.
    // PHB Ch.3: on stepping down the former Grand Druid "must relinquish... all
    // his experience points but 1". Reversing ADDS the surrendered XP back to
    // whatever is now in the main field, so a session played while mistakenly
    // stepped down keeps its earnings.
    if (f === 'druid_role') {
      const prev = (root._prevDruidRole || '').toLowerCase();
      const now  = (val(root, 'druid_role') || '').toLowerCase();

      if (now === 'hierophant' && prev !== 'hierophant') {
        // Step down: move all but 1 XP into the surrendered field.
        const xp = parseInt(val(root, 'xp') || 0, 10);
        if (!isNaN(xp) && xp > 1) {
          const existing = parseInt(val(root, 'druid_surrendered_xp') || 0, 10) || 0;
          val(root, 'druid_surrendered_xp', String(existing + (xp - 1)));
          val(root, 'xp', '1');
        }
      } else if (prev === 'hierophant' && now !== 'hierophant') {
        // Reverse: add the surrendered XP back to the current main total, then
        // clear the surrendered field. Addition, not overwrite, preserves any
        // XP earned while stepped down.
        const surr = parseInt(val(root, 'druid_surrendered_xp') || 0, 10) || 0;
        if (surr > 0) {
          const xp = parseInt(val(root, 'xp') || 0, 10) || 0;
          val(root, 'xp', String(xp + surr));
          val(root, 'druid_surrendered_xp', '');
        }
      }

      root._prevDruidRole = now;

      // XP changed, so the level/next-level and XP progression displays must
      // refresh alongside the spell-slot render below.
      if (typeof renderXPProgression === 'function') renderXPProgression(root);
    }

    renderSpellSlots(root);
    if (typeof renderDruidRole === 'function') renderDruidRole(root);
  };
  root.addEventListener('input', onDruidRoleChange);
  root.addEventListener('change', onDruidRoleChange);

  // Mark unsaved on any input/textarea change
  // .ephemeral marks a control that describes a MOMENT, not the character --
  // the Proficiency Abilities cooperation toggle, for instance. These are never
  // collected by collectSheet, so marking the sheet dirty for one would trigger
  // an autosave that writes nothing new AND restamps _updatedAt. Since KV merge
  // resolves conflicts by "later stamp wins", that would let a device win a
  // merge purely because someone ticked a box -- exactly the stale-autosave
  // clobber the sync rebuild was meant to prevent.
  qsa(root, 'input:not(.ephemeral),textarea:not(.ephemeral)').forEach(inp=>{
    const ev = inp.type === 'file' ? 'change' : 'input';
    inp.addEventListener(ev, ()=>markUnsaved(tab, true, root));
  });
  
  // Saving throw modifiers: re-render live
  qsa(root, '[data-field^="savemod"]').forEach(inp => {
    inp.addEventListener('input', () => {
      renderSavingThrows(root);
      markUnsaved(tab, true, root);
    });
  });

  // Core tab: Add Item button
  const coreAddItem = qs(root,'.add-item');
  if(coreAddItem){
    coreAddItem.onclick = ()=>{
      qs(root,'.items-list').appendChild(makeItemNode({}, ()=>{
        markUnsaved(tab,true,root);
        renderEncumbrance(root);
      }));
      markUnsaved(tab,true,root);
    };
  }
  
  // Equipment tab lists
  const addArmor = qs(root,'.add-armor');
  if(addArmor){
    addArmor.onclick = ()=>{
      const node = makeArmorNode({}, ()=>{
        markUnsaved(tab,true,root);
        renderArmorClass(root);
        renderEncumbrance(root);
      });
      qs(root,'.armor-list').appendChild(node);
      markUnsaved(tab,true,root);
    };
  }

  const addWeapon = qs(root,'.add-weapon');
  if(addWeapon){
    addWeapon.onclick = ()=>{
      qs(root,'.weapons-list').appendChild(makeWeaponNode({}, ()=>{
        markUnsaved(tab,true,root);
        renderEncumbrance(root);
        // Proficiency badges and the status stripe are painted as a side effect
        // of renderCombatQuickReference, which walks every weapon row. Without
        // this, editing a row's name or Type left its badge stale until
        // something else happened to trigger a recalculation.
        if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);
      }));
      markUnsaved(tab,true,root);
      // A newly added row has no badge or stripe until something paints it.
      if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);
    };
  }

  const addMagicItem = qs(root,'.add-magic-item');
  if(addMagicItem){
    addMagicItem.onclick = ()=>{
      // Magic items now carry a weight, so editing one has to re-run
      // encumbrance and movement the way every other carried-gear list does.
      qs(root,'.magic-items-list').appendChild(makeMagicItemNode({}, ()=>{
        markUnsaved(tab,true,root);
        renderEncumbrance(root);
        renderMovementRate(root);
      }));
      markUnsaved(tab,true,root);
      renderEncumbrance(root);
      renderMovementRate(root);
    };
  }
  
  // Followers tab lists
  const addMount = qs(root,'.add-mount');
  if(addMount){
    addMount.onclick = ()=>{
      qs(root,'.mounts-list').appendChild(makeMountNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  
  const addHenchman = qs(root,'.add-henchman');
  if(addHenchman){
    addHenchman.onclick = ()=>{
      qs(root,'.henchmen-list').appendChild(makeHenchmanNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  
  const addHireling = qs(root,'.add-hireling');
  if(addHireling){
    addHireling.onclick = ()=>{
      qs(root,'.hirelings-list').appendChild(makeHirelingNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  
  const addCompanion = qs(root,'.add-companion');
  if(addCompanion){
    addCompanion.onclick = ()=>{
      qs(root,'.companions-list').appendChild(makeCompanionNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  
  const addAmmunition = qs(root,'.add-ammunition');
  if(addAmmunition){
    addAmmunition.onclick = ()=>{
      qs(root,'.ammunition-list').appendChild(makeAmmunitionNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }

  // Other Valuables
  const addValuable = qs(root, '.add-valuable');
  if (addValuable) {
    addValuable.onclick = () => {
      qs(root, '.valuables-list').appendChild(makeValuableNode({}, () => {
        markUnsaved(tab, true, root);
        renderEncumbrance(root);  // Recalculates when valuable is modified
      }));
      markUnsaved(tab, true, root);
    };
  }

  // Skills tab lists
  const addWProf = qs(root,'.add-weapon-prof');
  if(addWProf){
    addWProf.onclick = ()=>{
      qs(root,'.weapon-profs-list').appendChild(makeWeaponProfNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  const addNWP = qs(root,'.add-nwp');
  if(addNWP){
    addNWP.onclick = ()=>{
      qs(root,'.nwp-list').appendChild(makeProfNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  const addClassAbility = qs(root,'.add-class-ability');
  if(addClassAbility){
    addClassAbility.onclick = ()=>{
      qs(root,'.class-abilities-list').appendChild(makeAbilityNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  const addRacialAbility = qs(root,'.add-racial-ability');
  if(addRacialAbility){
    addRacialAbility.onclick = ()=>{
      qs(root,'.racial-abilities-list').appendChild(makeAbilityNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }
  const addKitAbility = qs(root,'.add-kit-ability');
  if(addKitAbility){
    addKitAbility.onclick = ()=>{
      qs(root,'.kit-abilities-list').appendChild(makeAbilityNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
    };
  }

  // Magic tab: Memorized Spells
  const addMem = qs(root,'.add-memspell');
  if(addMem){
    addMem.onclick = ()=>{
      qs(root,'.memspells-list').appendChild(makeMemSpellNode({}, ()=>{
        markUnsaved(tab,true,root);
        renderMemorizedSpellStatus(root);
      }));
      markUnsaved(tab,true,root);
      renderMemorizedSpellStatus(root);
    };
  }
  
  // Add spell to active spellbook
  const addSpellbookSpell = qs(root, '.add-spellbook-spell');
  if (addSpellbookSpell) {
    addSpellbookSpell.onclick = () => {
      const spellbookList = qs(root, '.spellbook-list');
      if (spellbookList) {
        const node = makeSpellbookNode({}, () => {
          markUnsaved(tab, true, root);
          syncSpellbookToData(root);
        });
        spellbookList.appendChild(node);

        // Sort, filter and reveal. Appending alone dropped the new blank row at
        // the very bottom of the book -- off-screen in anything but a short list
        // -- and left it there until the first level edit happened to trigger a
        // sort, at which point it leapt to the top. Doing the work on ADD means
        // the row arrives where it will stay.
        sortSpellbook(root);

        // A level filter would otherwise hide a blank-level row outright, so the
        // player clicks Add and nothing appears at all.
        const filter = root.querySelector('.spellbook-level-filter');
        if (filter && filter.value !== '') {
          filter.value = '';
        }
        if (filter) filterSpellbook(root, filter.value);

        // Put the cursor in the name field -- it is the first thing to fill in,
        // and focusing it scrolls the row into view as a side effect.
        const nameInput = node.querySelector('.title');
        if (nameInput) {
          try { nameInput.focus(); } catch (e) { /* not yet laid out */ }
        }
        if (typeof node.scrollIntoView === 'function') {
          try { node.scrollIntoView({ block: 'nearest' }); }
          catch (e) { node.scrollIntoView(false); }
        }

        markUnsaved(tab, true, root);
        syncSpellbookToData(root);
      }
    };
  }
  
  // Toggle spell access visibility
  const toggleSpellAccess = qs(root, '.toggle-spell-access');
  if (toggleSpellAccess) {
    toggleSpellAccess.onclick = () => {
      const container = qs(root, '.spell-access-container');
      if (container) {
        if (container.style.display === 'none') {
          container.style.display = 'block';
        } else {
          container.style.display = 'none';
        }
      }
    };
  }
  
  // Spell browser controls
  const refreshSpells = qs(root, '.refresh-spells');
  if (refreshSpells) {
    refreshSpells.onclick = () => renderSpellBrowser(root);
  }
  
  // Toggle spell browser visibility
  const toggleBrowserVis = qs(root, '.toggle-spell-browser-visibility');
  if (toggleBrowserVis) {
    toggleBrowserVis.onclick = () => {
      const content = qs(root, '.spell-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // Toggle language browser visibility
  const toggleLangBrowserVis = qs(root, '.toggle-language-browser-visibility');
  if (toggleLangBrowserVis) {
    toggleLangBrowserVis.onclick = () => {
      const content = qs(root, '.language-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // Toggle spellbook visibility
  const toggleSpellbookVis = qs(root, '.toggle-spellbook-visibility');
  if (toggleSpellbookVis) {
    toggleSpellbookVis.onclick = () => {
      const content = qs(root, '.spellbook-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  } 
  
  const spellSearch = qs(root, '.spell-search');
  if (spellSearch) {
    spellSearch.addEventListener('input', () => renderSpellBrowser(root));
  }
  
  const spellLevelFilter = qs(root, '.spell-level-filter');
  if (spellLevelFilter) {
    spellLevelFilter.addEventListener('change', () => renderSpellBrowser(root));
  }

  // New faceted filter dropdowns: re-render on change so they filter and re-facet.
  ['.spell-cat-filter', '.spell-source-filter', '.spell-save-filter'].forEach(sel => {
    const el = qs(root, sel);
    if (el) el.addEventListener('change', () => renderSpellBrowser(root));
  });

  // Reset clears the browser controls only (search, level, school/sphere, source,
  // save) -- it must NOT touch the Spell Access checkboxes, which are a character
  // setting rather than a browse filter.
  const spellResetFilters = qs(root, '.spell-reset-filters');
  if (spellResetFilters) {
    spellResetFilters.addEventListener('click', () => {
      ['.spell-search', '.spell-level-filter', '.spell-cat-filter',
       '.spell-source-filter', '.spell-save-filter'].forEach(sel => {
        const el = qs(root, sel);
        if (el) el.value = '';
      });
      renderSpellBrowser(root);
    });
  }
  
  // Language browser controls
  const refreshLanguages = qs(root, '.refresh-languages');
  if (refreshLanguages) {
    refreshLanguages.onclick = () => renderLanguageBrowser(root);
  }
  
  const languageSearch = qs(root, '.language-search');
  if (languageSearch) {
    languageSearch.addEventListener('input', () => renderLanguageBrowser(root));
  }
  
  const languageRarityFilter = qs(root, '.language-rarity-filter');
  if (languageRarityFilter) {
    languageRarityFilter.addEventListener('change', () => renderLanguageBrowser(root));
  }
  
  // Add custom language button
  const addCustomLang = qs(root, '.add-custom-language');
  if (addCustomLang) {
    addCustomLang.onclick = () => addCustomLanguage(root);
  }
  
  // Toggle equipment browser visibility
  const toggleEquipmentBrowserVis = qs(root, '.toggle-equipment-browser-visibility');
  if (toggleEquipmentBrowserVis) {
    toggleEquipmentBrowserVis.onclick = () => {
      const content = qs(root, '.equipment-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // Equipment browser controls
  const refreshEquipment = qs(root, '.refresh-equipment');
  if (refreshEquipment) {
    refreshEquipment.onclick = () => renderEquipmentBrowser(root);
  }
  
  const equipmentSearch = qs(root, '.equipment-search');
  if (equipmentSearch) {
    equipmentSearch.addEventListener('input', () => renderEquipmentBrowser(root));
  }
  
  const equipmentCategoryFilter = qs(root, '.equipment-category-filter');
  if (equipmentCategoryFilter) {
    equipmentCategoryFilter.addEventListener('change', () => renderEquipmentBrowser(root));
  }

  // Goods & Services price reference -- a read-only modal, rendered on open
  // rather than at load so it costs nothing for a player who never opens it.
  const openGoodsModal = qs(root, '.open-goods-modal');
  if (openGoodsModal) {
    openGoodsModal.onclick = () => {
      const overlay = qs(root, '.goods-modal-overlay');
      if (!overlay) return;
      // 'flex', not 'block' -- the overlay centres its card with flexbox.
      overlay.style.display = 'flex';
      if (typeof renderGoodsReference === 'function') renderGoodsReference(root);
    };
  }

  const goodsModalClose = qs(root, '.goods-modal-close');
  if (goodsModalClose) {
    goodsModalClose.onclick = () => {
      const overlay = qs(root, '.goods-modal-overlay');
      if (overlay) overlay.style.display = 'none';
    };
  }

  // Character generator. The name tables are ~380KB, so they load on FIRST OPEN
  // rather than at boot -- most sessions never open this. Same shape as
  // loadSpells(): a flag-guarded async loader the opener awaits.
  const generateChar = qs(root, '.generate-char');
  if (generateChar) {
    generateChar.onclick = async () => {
      const overlay = qs(root, '.gen-modal-overlay');
      if (!overlay) return;
      // 'flex', not 'block' -- the overlay centres its card with flexbox.
      overlay.style.display = 'flex';
      const loading = qs(root, '.gen-loading');
      const result  = qs(root, '.gen-result');
      if (result) { result.style.display = 'none'; result.innerHTML = ''; }
      if (!NAMES_LOADED) {
        if (loading) loading.style.display = 'block';
        await loadNameTables();
        if (loading) loading.style.display = 'none';
      }
      if (typeof populateGeneratorControls === 'function') populateGeneratorControls(root);
    };
  }

  const genModalClose = qs(root, '.gen-modal-close');
  if (genModalClose) {
    genModalClose.onclick = () => {
      const overlay = qs(root, '.gen-modal-overlay');
      if (overlay) overlay.style.display = 'none';
    };
  }

  const genOverlay = qs(root, '.gen-modal-overlay');
  if (genOverlay) {
    // Backdrop only -- a click inside the card bubbles here too.
    genOverlay.addEventListener('click', (e) => {
      if (e.target === genOverlay) genOverlay.style.display = 'none';
    });
  }

  const genRun = qs(root, '.gen-run');
  if (genRun) {
    genRun.onclick = () => {
      const result = qs(root, '.gen-result');
      const out = runCharacterGenerator(root);

      if (out.error) {
        // Errors keep the modal OPEN so the offending choice can be changed --
        // closing it would make the user rebuild every selection.
        if (result) {
          result.innerHTML = '<strong style="color:var(--warning);">\u26A0 ' +
                             escapeHtml(out.error) + '</strong>';
          result.style.display = 'block';
        }
        return;
      }

      // The character is already open in a tab behind the modal. The summary
      // goes in .gen-result and the modal STAYS OPEN, so it can be read and
      // another character generated without reopening.
      //
      // Deliberately NOT the sidebar: startAutosaveForTab rewrites
      // .sidebar-message once a second with the autosave countdown, so anything
      // posted there is erased within a second on an unsaved sheet.
      // openIntoCurrentOrNew may REPLACE this whole tab -- when the current one
      // is pristine it removes the .tab-content and builds a fresh one. The
      // modal markup lives inside the sheet template, so `root` is now detached
      // and writing to it paints a node that is no longer on the page. Re-find
      // the modal from the ACTIVE root, and reopen it: from the user's side the
      // window simply stayed open.
      const liveRoot   = getActiveRoot() || root;
      const liveResult = qs(liveRoot, '.gen-result');
      const liveOverlay = qs(liveRoot, '.gen-modal-overlay');

      // EVERY TAB HAS ITS OWN MODAL -- the markup is part of the sheet template.
      // The overlay we opened belongs to the tab the button was clicked in, and
      // generation has since moved to a different tab, so that one must be
      // hidden or it sits at display:flex forever and "reappears" the next time
      // that tab is brought forward. Harmless when root is the detached tab
      // openIntoCurrentOrNew replaced, and harmless when root === liveRoot,
      // since the show below runs after this hide.
      const originOverlay = qs(root, '.gen-modal-overlay');
      if (originOverlay) originOverlay.style.display = 'none';

      if (!liveResult) return;

      // THIS IS A DIFFERENT TAB'S MODAL, and its controls have never been
      // populated -- populateGeneratorControls only runs from the Generate
      // button's own handler. Left unfilled, .gen-class has no options, so the
      // next click finds no legal class for any race. Populate it, then carry
      // the settings across so the window the user sees still shows what they
      // chose rather than silently resetting to defaults.
      if (liveRoot !== root) {
        if (typeof populateGeneratorControls === 'function') populateGeneratorControls(liveRoot);
        ['.gen-race', '.gen-gender', '.gen-class', '.gen-level', '.gen-roll-method']
          .forEach(s => {
            const from = qs(root, s), to = qs(liveRoot, s);
            if (from && to) to.value = from.value;
          });
        // Kit and alignment depend on class, so they must be rebuilt AFTER the
        // class value is copied across, then have their own values applied.
        if (typeof populateGeneratorKits === 'function') populateGeneratorKits(liveRoot);
        if (typeof populateGeneratorAlignments === 'function') populateGeneratorAlignments(liveRoot);
        ['.gen-kit', '.gen-alignment'].forEach(s => {
          const from = qs(root, s), to = qs(liveRoot, s);
          if (from && to) to.value = from.value;
        });
        const fromBox = qs(root, '.gen-roll-attrs'), toBox = qs(liveRoot, '.gen-roll-attrs');
        if (fromBox && toBox) toBox.checked = fromBox.checked;
      }

      if (liveOverlay) liveOverlay.style.display = 'flex';

      let html = '<strong>' + escapeHtml(out.name) + '</strong>';
      if (out.title) html += ' <em>' + escapeHtml(out.title) + '</em>';
      html += '<br>Level ' + out.level + ' ' + escapeHtml(out.gender) + ' ' +
              escapeHtml(out.race) + ' ' + escapeHtml(out.clazz);
      if (out.hp) html += ' \u2014 ' + out.hp + ' hp';

      // Report the reroll count rather than hiding it. Rerolling until legal is
      // rejection sampling: the result is stronger than the method implies, and
      // for Method I a demanding class can take thousands of sets. That rarity
      // IS the rule, so it is shown rather than quietly smoothed away.
      if (out.attempts > 1) {
        html += '<br><span style="color:var(--muted);">' +
                out.attempts.toLocaleString() + ' sets rolled before a legal one.</span>';
      }
      if (out.title) {
        html += '<br><span style="color:var(--muted);">The sheet has no title field yet ' +
                '\u2014 note it by hand for now.</span>';
      }
      html += '<br><span style="color:var(--muted);">Opened in a tab behind this window.</span>';

      liveResult.innerHTML = html;
      liveResult.style.display = 'block';
    };
  }

  const goodsOverlay = qs(root, '.goods-modal-overlay');
  if (goodsOverlay) {
    // Click the backdrop to dismiss -- but ONLY the backdrop. A click inside the
    // card bubbles up to here as well and must not close the modal.
    goodsOverlay.addEventListener('click', (e) => {
      if (e.target === goodsOverlay) goodsOverlay.style.display = 'none';
    });
  }

  const goodsSearch = qs(root, '.goods-search');
  if (goodsSearch) {
    goodsSearch.addEventListener('input', () => renderGoodsReference(root));
  }

  const goodsCategoryFilter = qs(root, '.goods-category-filter');
  if (goodsCategoryFilter) {
    goodsCategoryFilter.addEventListener('change', () => renderGoodsReference(root));
  }
  
  // Animals, Mounts & Transport browser. Rendered on first EXPAND rather than at
  // load -- it feeds the follower lists and most sessions never open it.
  const toggleAnimalsBrowserVis = qs(root, '.toggle-animals-browser-visibility');
  if (toggleAnimalsBrowserVis) {
    toggleAnimalsBrowserVis.onclick = () => {
      const content = qs(root, '.animals-browser-content');
      if (!content) return;
      const opening = content.style.display === 'none';
      content.style.display = opening ? 'block' : 'none';
      if (opening && typeof renderAnimalsBrowser === 'function') renderAnimalsBrowser(root);
    };
  }

  const refreshAnimals = qs(root, '.refresh-animals');
  if (refreshAnimals) {
    refreshAnimals.onclick = () => renderAnimalsBrowser(root);
  }

  const animalsSearch = qs(root, '.animals-search');
  if (animalsSearch) {
    animalsSearch.addEventListener('input', () => renderAnimalsBrowser(root));
  }

  const animalsCategoryFilter = qs(root, '.animals-category-filter');
  if (animalsCategoryFilter) {
    animalsCategoryFilter.addEventListener('change', () => renderAnimalsBrowser(root));
  }

  // Toggle weapon inventory browser visibility
  const toggleWeaponInventoryBrowserVis = qs(root, '.toggle-weapon-inventory-browser-visibility');
  if (toggleWeaponInventoryBrowserVis) {
    toggleWeaponInventoryBrowserVis.onclick = () => {
      const content = qs(root, '.weapon-inventory-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // Weapon inventory browser controls
  const refreshWeaponInventoryBrowser = qs(root, '.refresh-weapon-inventory-browser');
  if (refreshWeaponInventoryBrowser) {
    refreshWeaponInventoryBrowser.onclick = () => renderWeaponInventoryBrowser(root);
  }
  
  const weaponInventorySearch = qs(root, '.weapon-inventory-search');
  if (weaponInventorySearch) {
    weaponInventorySearch.addEventListener('input', () => renderWeaponInventoryBrowser(root));
  }
  
  const weaponInventoryCategoryFilter = qs(root, '.weapon-inventory-category-filter');
  if (weaponInventoryCategoryFilter) {
    weaponInventoryCategoryFilter.addEventListener('change', () => renderWeaponInventoryBrowser(root));
  }
  
  const weaponInventoryTypeFilter = qs(root, '.weapon-inventory-type-filter');
  if (weaponInventoryTypeFilter) {
    populateWeaponGroupFilter(weaponInventoryTypeFilter);
    weaponInventoryTypeFilter.addEventListener('change', () => renderWeaponInventoryBrowser(root));
  }
  
  // Toggle ammunition browser visibility
  const toggleAmmunitionBrowserVis = qs(root, '.toggle-ammunition-browser-visibility');
  if (toggleAmmunitionBrowserVis) {
    toggleAmmunitionBrowserVis.onclick = () => {
      const content = qs(root, '.ammunition-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // Ammunition browser controls
  const refreshAmmunitionBrowser = qs(root, '.refresh-ammunition-browser');
  if (refreshAmmunitionBrowser) {
    refreshAmmunitionBrowser.onclick = () => renderAmmunitionBrowser(root);
  }
  
  const ammunitionSearchNew = qs(root, '.ammunition-search');
  if (ammunitionSearchNew) {
    ammunitionSearchNew.addEventListener('input', () => renderAmmunitionBrowser(root));
  }
  
  const ammunitionTypeFilterNew = qs(root, '.ammunition-type-filter');
  if (ammunitionTypeFilterNew) {
    ammunitionTypeFilterNew.addEventListener('change', () => renderAmmunitionBrowser(root));
  }
  
  // Toggle armor browser visibility
  const toggleArmorBrowserVis = qs(root, '.toggle-armor-browser-visibility');
  if (toggleArmorBrowserVis) {
    toggleArmorBrowserVis.onclick = () => {
      const content = qs(root, '.armor-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // Armor browser controls
  const refreshArmorBrowser = qs(root, '.refresh-armor-browser');
  if (refreshArmorBrowser) {
    refreshArmorBrowser.onclick = () => renderArmorBrowser(root);
  }
  
  const armorSearchNew = qs(root, '.armor-search');
  if (armorSearchNew) {
    armorSearchNew.addEventListener('input', () => renderArmorBrowser(root));
  }
  
  const armorTypeFilterNew = qs(root, '.armor-type-filter');
  if (armorTypeFilterNew) {
    armorTypeFilterNew.addEventListener('change', () => renderArmorBrowser(root));
  }
  
  // Toggle weapon browser visibility
  const toggleWeaponBrowserVis = qs(root, '.toggle-weapon-browser-visibility');
  if (toggleWeaponBrowserVis) {
    toggleWeaponBrowserVis.onclick = () => {
      const content = qs(root, '.weapon-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // Weapon browser controls
  const refreshWeapons = qs(root, '.refresh-weapons');
  if (refreshWeapons) {
    refreshWeapons.onclick = () => renderWeaponBrowser(root);
  }
  
  const weaponSearch = qs(root, '.weapon-search');
  if (weaponSearch) {
    weaponSearch.addEventListener('input', () => renderWeaponBrowser(root));
  }
  
  const weaponCategoryFilter = qs(root, '.weapon-category-filter');
  if (weaponCategoryFilter) {
    weaponCategoryFilter.addEventListener('change', () => renderWeaponBrowser(root));
  }
  
  const weaponGroupFilter = qs(root, '.weapon-group-filter');
  if (weaponGroupFilter) {
    populateWeaponGroupFilter(weaponGroupFilter);
    weaponGroupFilter.addEventListener('change', () => renderWeaponBrowser(root));
  }
  
  // Add custom weapon proficiency button
  const addCustomWeaponProf = qs(root, '.add-custom-weapon-prof');
  if (addCustomWeaponProf) {
    addCustomWeaponProf.onclick = () => addCustomWeaponProficiency(root);
  }
  
  // Toggle NWP browser visibility
  const toggleNWPBrowserVis = qs(root, '.toggle-nwp-browser-visibility');
  if (toggleNWPBrowserVis) {
    toggleNWPBrowserVis.onclick = () => {
      const content = qs(root, '.nwp-browser-content');
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }
    };
  }
  
  // NWP browser controls
  const refreshNWP = qs(root, '.refresh-nwp');
  if (refreshNWP) {
    refreshNWP.onclick = () => renderNWPBrowser(root);
  }
  
  const nwpSearch = qs(root, '.nwp-search');
  if (nwpSearch) {
    nwpSearch.addEventListener('input', () => renderNWPBrowser(root));
  }
  
  const nwpCategoryFilter = qs(root, '.nwp-category-filter');
  if (nwpCategoryFilter) {
    nwpCategoryFilter.addEventListener('change', () => renderNWPBrowser(root));
  }
  
  // Add custom NWP button
  const addCustomNWP = qs(root, '.add-custom-nwp');
  if (addCustomNWP) {
    addCustomNWP.onclick = () => addCustomNWProficiency(root);
  }
  
  // Memorized spells level filter
  const memspellFilter = qs(root, '.memspell-level-filter');
  if (memspellFilter) {
    memspellFilter.addEventListener('change', () => {
      filterMemorizedSpells(root, memspellFilter.value);
    });
  }

  // Spellbook level filter
  const spellbookFilter = qs(root, '.spellbook-level-filter');
  if (spellbookFilter) {
    spellbookFilter.addEventListener('change', () => {
      filterSpellbook(root, spellbookFilter.value);
    });
  }

  // Avatar
  bindPortraitWindow(root);
  qs(root,'.upload-avatar').onclick = ()=> qs(root,'.avatar-input').click();
  qs(root,'.avatar-input').onchange = e=>{
    const f=e.target.files&&e.target.files[0];
    if(!f) return;
    // The cap only rejects the absurd. Everything under it gets downscaled to
    // AVATAR_SRC_MAX regardless of what came in, so refusing a 2MB photo would
    // be refusing work we are about to do anyway.
    if(f.size > AVATAR_MAX_SIZE){
      alert("That image is " + (f.size/1024/1024).toFixed(1) + "MB, over the " +
            (AVATAR_MAX_SIZE/1024/1024).toFixed(0) + "MB limit.\n\n" +
            "Try exporting it smaller, or take a screenshot of it.");
      e.target.value='';
      return;
    }
    const r=new FileReader();
    r.onload=ev=>{
      // Downscale BEFORE the cropper, not after. This is the only lossy step in
      // the whole path now: what the cropper receives is what gets stored, and
      // every later re-frame works from these same pixels rather than from a
      // crop of a crop.
      downscaleImage(ev.target.result, AVATAR_SRC_MAX, AVATAR_SRC_QUALITY, src => {
        if(!src){ alert('That image could not be read.'); return; }
        openAvatarCropper(root, tab, src, null);
      });
    };
    r.readAsDataURL(f);
    // Cleared so re-picking the SAME file fires change again -- otherwise
    // cancelling the cropper and retrying the same image does nothing.
    e.target.value='';
  };
  // Re-frame the stored ORIGINAL, not the last crop of it. This used to feed
  // the cropper its own 660x440 output, so every Adjust was another generation
  // of loss and could only ever zoom further in. Now the crop is a rectangle
  // recorded against pixels that never change, and adjusting is free.
  //
  // Legacy portraits saved as a bare data URL still arrive here with crop:null,
  // and re-framing one records a proper rectangle -- the same "migrates when
  // someone happens to care" behaviour as before, minus the quality loss.
  qs(root,'.adjust-avatar').onclick = ()=>{
    const rec = root._avatarData;
    if(!rec || !rec.src){
      alert('No portrait to adjust yet — upload one first.');
      return;
    }
    openAvatarCropper(root, tab, rec.src, rec.crop || null);
  };
  qs(root,'.remove-avatar').onclick = ()=>{
    closePortraitWindow(root);
    setAvatar(root,null);
    markUnsaved(tab,true,root);
  };
  // Save / Save As / Open (picker) / Export / Import / Print
  qs(root,'.save-local').onclick = ()=>{
    if(saveAsDialog(root, tab)) markUnsaved(tab,false,root);
  };
  qs(root,'.save-as').onclick = ()=>{
    if(saveAsDialog(root, tab)) markUnsaved(tab,false,root);
  };
  qs(root,'.open-local').onclick = ()=>{
    const ctx=openPicker(); if(!ctx) return;
    const {modal,map}=ctx;
    modal.querySelector('#cancelChar').onclick=()=>modal.remove();
    modal.querySelector('#openChar').onclick=()=>{
      const pick=modal.querySelector('#charPicker').value;
      if(pick && map[pick]) openIntoCurrentOrNew(pick, map[pick]);
      modal.remove();
    };
  };
  qs(root,'.export-json').onclick = ()=>{
    const obj = collectSheet(root);
    // The sync token is deliberately NOT written here. getKvConfig() always
    // returns a token, so the old condition was always true and every export
    // from every browser carried that browser's KV credential -- which meant
    // handing a character file to another player handed them the keys to your
    // namespace. Exports are character data only.
    const sanitize = s => (s||'').toString().trim().replace(/\s+/g,'_').replace(/[^A-Za-z0-9_\-]/g,'');

    const charName = sanitize(obj.meta.name) || 'Unnamed';

    // Build timestamp (YYYY-MM-DD_HHMM)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth()+1).padStart(2,'0');
    const dd   = String(now.getDate()).padStart(2,'0');
    const hh   = String(now.getHours()).padStart(2,'0');
    const min  = String(now.getMinutes()).padStart(2,'0');

    const timestamp = `${yyyy}-${mm}-${dd}_${hh}${min}`;

    // Final filename: CharacterName_Timestamp.adnd2e.json
    const filename = `${charName}_${timestamp}.adnd2e.json`;

    const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),0);
  };
  qs(root,'.import-json').onclick = ()=> qs(root,'.import-file').click();
  qs(root,'.import-file').onchange = e=>{
    const f=e.target.files&&e.target.files[0];
    if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const obj=JSON.parse(ev.target.result);
        const nm = (obj.meta&&obj.meta.name)||'Imported Character';
        // NO TOKEN ADOPTION. There used to be a block here that adopted an
        // exported file's _kvToken "if we do not already have one" -- and it
        // could never run. getKvConfig() is a GET-OR-CREATE: line 41 fills in a
        // freshly generated token before returning, so the !cfg.kvToken guard
        // was testing a property the call above had just made impossible.
        // Verified by transcribing both functions and running them: there is no
        // ordering, including import-before-boot, in which it fires.
        //
        // Not repaired, removed. The sync token is BROWSER state, not character
        // state, and silently taking an identity out of a file someone sent you
        // is the wrong default -- characters get shared around a table. The
        // documented manual path (Settings -> Enter Token) already does this
        // deliberately and has always worked.
        //
        // A stray _kvToken in an older export is harmless: loadSheet only reads
        // named fields, and saving rebuilds the record from collectSheet, so it
        // cannot survive the round trip.
        openIntoCurrentOrNew(nm, obj);
      }catch(err){ alert('Invalid JSON: '+err.message); }
    };
    r.readAsText(f);
    e.target.value='';
  };
  qs(root,'.delete-char').onclick = ()=>{
    const data = collectSheet(root);
    const name = (data.meta.name && data.meta.name.trim()) || null;

    if(!name){
      alert("This character has no name and cannot be deleted.");
      return;
    }

    if(!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)){
      return;
    }

    // Write a TOMBSTONE rather than removing the key outright. KV sync merges
    // per-character by timestamp, so a plain delete would simply be re-added
    // from the remote copy on the next sync. The tombstone carries a newer
    // timestamp than the record it replaces, so the deletion propagates.
    // Note: the character DATA is discarded -- this is not an undelete feature.
    const map = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}');
    if(map[name]){
      map[name] = {
        _deletedAt: Date.now(),
        meta: { name: name }
      };
      writeCharacterMap(map, 'delete character');
    }

    // Deleting never pushed to KV before, so deletions silently failed to sync.
    if (typeof kvPushDebounced === 'function') kvPushDebounced();

    // Close the current tab
    closeTab(tab, root.closest('.tab-content'));

    alert(`Deleted: ${name}`);
  };
  // Print button now opens the options modal instead of generating directly.
  qs(root,'.print').onclick = () => openPrintModal(root);

  // Print options modal
  qs(root, '.print-modal-close').onclick = () => closePrintModal(root);
  qs(root, '.print-modal-overlay').addEventListener('click', e => {
    if (e.target === qs(root, '.print-modal-overlay')) closePrintModal(root);
  });
  qs(root, '.print-select-all').onclick  = () => { setAllPrintOptions(root, true); updatePrintPageEstimate(root); };
  qs(root, '.print-select-none').onclick = () => { setAllPrintOptions(root, false); updatePrintPageEstimate(root); };
  qs(root, '.print-select-core').onclick = () => {
    applyPrintOptionsToModal(root, getPrintOptions.defaults || Object.assign({}, PRINT_OPTION_DEFAULTS, { blanks: PRINT_BLANK_DEFAULTS }));
    updatePrintPageEstimate(root);
  };

  // One delegated listener rather than 40 individual ones.
  qs(root, '.print-modal-overlay').addEventListener('change', e => {
    if (e.target.matches('.print-opt, .print-blank, .print-spellbook-detail')) {
      updatePrintPageEstimate(root);
    }
  });
  qs(root, '.print-modal-generate').onclick = () => {
    const opts = readPrintOptionsFromModal(root);
    savePrintOptions(opts);
    closePrintModal(root);
    generateCharacterPDF(root, opts);
  };

  // Blank sheet. Takes the LOOK from the modal (palette and both fonts, which
  // live above the tab strip and are shared) and forces everything else. The
  // section choices and blank-row counts describe a character's sheet, and a
  // blank one is not that -- so they are not read, and NOT saved either: a
  // blank print must never overwrite the preferences the other tab remembers.
  qs(root, '.print-blank-generate').onclick = () => {
    const look = readPrintOptionsFromModal(root);
    closePrintModal(root);
    generateCharacterPDF(root, buildBlankPrintOptions(look));
  };

  // Tab strip. Same classes and same shape as the Settings modal, so there is
  // one tab mechanism in this codebase rather than three that drift apart.
  qs(root, '.print-subtab-bar').addEventListener('click', e => {
    const tab = e.target.closest('.subtab');
    if (!tab) return;
    const want = tab.dataset.printTab;
    qs(root, '.print-subtab-bar').querySelectorAll('.subtab').forEach(t => {
      t.classList.toggle('active', t === tab);
    });
    qs(root, '.print-modal-overlay').querySelectorAll('.print-panel').forEach(p => {
      p.classList.toggle('subtab-panel-hidden', p.dataset.panel !== want);
    });
  });

  // KV Settings modal
  qs(root, '.kv-settings').onclick = () => openKvSettingsModal(root);
  qs(root, '.kv-modal-close').onclick = () => closeKvSettingsModal(root);

  // Theme tiles. These call applyTheme(), which is also what the mode lamp in
  // the header calls, so there is ONE place that writes both attributes and the
  // localStorage key -- the two controls cannot drift apart.
  const grid = qs(root, '.theme-grid');
  if (grid) {
    paintThemeTiles(grid);
    grid.querySelectorAll('input[type=radio]').forEach(r => {
      r.onchange = () => applyTheme(r.value, null);
    });
  }
  qs(root, '.kv-modal-overlay').addEventListener('click', e => {
    if (e.target === qs(root, '.kv-modal-overlay')) closeKvSettingsModal(root);
  });
  qs(root, '.kv-save-worker-url').onclick  = () => kvSaveWorkerUrl(root);
  qs(root, '.kv-copy-token').onclick       = () => kvCopyToken(root);
  qs(root, '.kv-enter-token').onclick      = () => kvEnterToken(root);
  qs(root, '.kv-reset-token').onclick      = () => kvResetToken(root);
  qs(root, '.kv-push-manual').onclick      = () => kvPushManual(root);
  qs(root, '.kv-pull-manual').onclick      = () => kvPullManual(root);
  qs(root, '.kv-enabled-chk').onchange     = e  => kvSaveEnabled(e.target.checked, root);

  // Condition tracker
  const addConditionBtn = qs(root, '.add-condition');
  if (addConditionBtn) {
    addConditionBtn.onclick = () => addConditionDialog(root, tab);
  }

  // Combat round tracker
  const nextRoundBtn = qs(root, '.next-round-btn');
  if (nextRoundBtn) {
    nextRoundBtn.onclick = () => incrementCombatRound(root, tab);
  }
  
  const resetRoundBtn = qs(root, '.reset-round-btn');
  if (resetRoundBtn) {
    resetRoundBtn.onclick = () => resetCombatRound(root, tab);
  }
  
  // Rest button
  qs(root, '.rest-button').onclick = () => {
    openRestDialog(root, tab);
  };

  // Study / Pray button. Visibility is owned by toggleSpellbookSection(), which
  // already holds the spellcaster test -- do not re-derive it here.
  const studyBtn = qs(root, '.study-button');
  if (studyBtn) {
    studyBtn.onclick = () => {
      openStudyModal(root, tab);
    };
  }

  // Ensure sidebar hidden at init for a fresh sheet
  hideSidebarMessage(root);
  
  // Auto-expand all textareas in this sheet
  root.querySelectorAll('textarea').forEach(t => {
    autoExpand(t); // expand once on load
    t.addEventListener('input', () => autoExpand(t));
  });
  
  // Setup spellbook tabs system
  setupSpellbookTabs(root);
  
  // === NOTES TAB FUNCTIONALITY ===
  
  // Category selector dropdown
  const notesCategorySelector = qs(root, '.notes-category-selector');
  if (notesCategorySelector) {
    notesCategorySelector.addEventListener('change', (e) => {
      const category = e.target.value;
      // Hide all sections
      root.querySelectorAll('.notes-section').forEach(section => {
        section.style.display = 'none';
      });
      // Show selected section
      const selectedSection = root.querySelector(`.notes-section[data-category="${category}"]`);
      if (selectedSection) {
        selectedSection.style.display = 'block';
      }
    });
  }
  
  // Add Entry buttons
  const addEntryButtons = root.querySelectorAll('.add-note-entry');
  addEntryButtons.forEach(btn => {
    btn.onclick = () => {
      const category = btn.getAttribute('data-category');
      const list = root.querySelector(`.notes-entries-list[data-category="${category}"]`);
      if (!list) return;
      
      const onChange = () => markUnsaved(tab, true, root);
      let entryNode = null;
      
      switch(category) {
        case 'session_log':
          entryNode = makeSessionLogEntry({}, onChange);
          break;
        case 'quest_journal':
          entryNode = makeQuestJournalEntry({}, onChange);
          break;
        case 'npcs':
          entryNode = makeNPCEntry({}, onChange);
          break;
        case 'locations':
          entryNode = makeLocationEntry({}, onChange);
          break;
        case 'character_journal':
          entryNode = makeCharacterJournalEntry({}, onChange);
          break;
      }
      
      if (entryNode) {
        list.appendChild(entryNode);
      }
    };
  });
}

// === MOBILE DRAWER FUNCTIONALITY ===
function initMobileDrawer(root) {
  const drawer = root.querySelector('.right-card');
  const toggle = root.querySelector('.drawer-toggle');
  const backdrop = root.querySelector('.drawer-backdrop');
  
  if (!drawer || !toggle || !backdrop) return;
  
  // Toggle drawer open/closed
  toggle.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('drawer-open');
    
    if (isOpen) {
      // Close drawer
      drawer.classList.remove('drawer-open');
      toggle.classList.remove('drawer-open');
      backdrop.classList.remove('active');
      toggle.textContent = '«';
      toggle.setAttribute('aria-label', 'Open sidebar');
    } else {
      // Open drawer
      drawer.classList.add('drawer-open');
      toggle.classList.add('drawer-open');
      backdrop.classList.add('active');
      toggle.textContent = '»';
      toggle.setAttribute('aria-label', 'Close sidebar');
    }
  });
  
  // Close drawer when clicking backdrop
  backdrop.addEventListener('click', () => {
    drawer.classList.remove('drawer-open');
    toggle.classList.remove('drawer-open');
    backdrop.classList.remove('active');
    toggle.textContent = '«';
    toggle.setAttribute('aria-label', 'Open sidebar');
  });
  
  // Close drawer when clicking certain buttons (optional but good UX)
  const closeOnClick = [
    '.save-local',
    '.save-as',
    '.open-local',
    '.export-json',
    '.import-json',
    '.delete-char',
    '.print',
    '.kv-settings'
  ];
  
  closeOnClick.forEach(selector => {
    const btn = drawer.querySelector(selector);
    if (btn) {
      btn.addEventListener('click', () => {
        drawer.classList.remove('drawer-open');
        toggle.classList.remove('drawer-open');
        backdrop.classList.remove('active');
        toggle.textContent = '«';
        toggle.setAttribute('aria-label', 'Open sidebar');
      });
    }
  });
}

// ===== KV Sync — modal UI functions =====

function openKvSettingsModal(root) {
  const cfg = getKvConfig();
  qs(root, '.kv-worker-url-inp').value = cfg.workerUrl || '';
  qs(root, '.kv-token-display').value  = cfg.kvToken   || '';
  qs(root, '.kv-enabled-chk').checked  = !!cfg.kvEnabled;
  qs(root, '.kv-worker-url-status').textContent = '';
  qs(root, '.kv-token-status').textContent      = '';
  updateKvSyncStatus(root, cfg);
  renderOptionalRules(root);
  renderSupplements(root);
  // Bound once (guarded internally), reset every open so the modal always
  // lands on Sync Settings rather than wherever it was last left.
  bindSettingsTabs(root);
  resetSettingsTabs(root);
  qs(root, '.kv-modal-overlay').style.display = 'flex';
}

// Settings modal sub-tabs. Deliberately the SAME classes as the Tools tab strip
// -- .subtab, .subtab-panel-hidden -- rather than a parallel set, so there is
// one tab mechanism in the codebase instead of two that drift.
//
// No existence/visibility split here, unlike Tools. Every settings section shows
// for everyone and the modal opens with no character loaded, so a hidden panel
// only ever means "not the tab you are on". Building the second mechanism would
// be machinery for a case that cannot arise.
//
// Always opens on Sync Settings; the tab is not remembered between openings.
function bindSettingsTabs(scope) {
  const bar = scope.querySelector('.settings-subtab-bar');
  if (!bar || bar._bound) return;
  bar._bound = true;

  const modal = bar.closest('.kv-modal-overlay') || scope;
  bar.addEventListener('click', (e) => {
    const tab = e.target.closest('.subtab');
    if (!tab) return;
    const want = tab.dataset.settingsTab;

    bar.querySelectorAll('.subtab').forEach(t => {
      t.classList.toggle('active', t === tab);
    });
    modal.querySelectorAll('.settings-panel').forEach(p => {
      p.classList.toggle('subtab-panel-hidden', p.dataset.panel !== want);
    });
  });
}

// Reset to the first tab every time the modal opens, so it is predictable
// rather than wherever it was left.
function resetSettingsTabs(scope) {
  const bar = scope.querySelector('.settings-subtab-bar');
  if (!bar) return;
  const modal = bar.closest('.kv-modal-overlay') || scope;
  bar.querySelectorAll('.subtab').forEach(t => {
    t.classList.toggle('active', t.dataset.settingsTab === 'sync');
  });
  modal.querySelectorAll('.settings-panel').forEach(p => {
    p.classList.toggle('subtab-panel-hidden', p.dataset.panel !== 'sync');
  });
}

// Render one checkbox per entry in the OPTIONAL_RULES registry (tables.js).
// Adding a new optional rule means adding a registry entry and one
// isOptionalRule() guard at the call site -- no UI work required here.
function renderOptionalRules(root) {
  if (typeof OPTIONAL_RULES === 'undefined') return;

  // Group by category so PHB-optional rules and house-rule overrides read as
  // different things. Entries with no category fall back to 'phb'.
  const cats = (typeof OPTIONAL_RULES_CATEGORIES !== 'undefined') ? OPTIONAL_RULES_CATEGORIES : {};
  const order = Object.keys(cats).length ? Object.keys(cats) : ['phb'];
  const grouped = {};
  Object.keys(OPTIONAL_RULES).forEach(k => {
    const c = OPTIONAL_RULES[k].category || 'phb';
    (grouped[c] = grouped[c] || []).push(k);
  });

  // Each category renders into its OWN panel now, one per settings tab, rather
  // than all three stacked in a single list. The category heading the old code
  // emitted is gone: the tab is the heading, and printing both says it twice.
  // The blurb moves into the panel, which is what makes the explanatory text
  // swap with the tab.
  //
  // Driven off OPTIONAL_RULES_CATEGORIES, so a fourth rule category added to
  // tables.js needs only a matching panel and tab in sheet_template.js -- the
  // renderer needs no change at all.
  order.forEach(cat => {
    const listEl = root.querySelector('.optional-rules-list[data-cat="' + cat + '"]');
    if (!listEl) return;
    listEl.innerHTML = '';

    const panel = listEl.closest('.settings-panel');
    const meta  = cats[cat] || {};
    const blurbEl = panel ? panel.querySelector('.settings-blurb') : null;
    if (blurbEl) blurbEl.textContent = meta.blurb || '';

    const keys = grouped[cat] || [];
    keys.forEach(key => renderOneOptionalRule(listEl, key));
  });
}

// One checkbox row. Split out of renderOptionalRules so the grouping loop above
// stays readable.
// ===== Supplements =====
// One collapsed row per book, in publication order, expanding to the two
// toggles. Deliberately NOT folded into renderOptionalRules: that function
// renders a flat list of checkboxes from OPTIONAL_RULES, and a book is a
// two-level thing -- a row that opens, containing toggles that own several
// rules each.
function renderSupplements(root) {
  const listEl = root.querySelector('.supplements-list');
  if (!listEl || typeof SUPPLEMENTS === 'undefined') return;
  listEl.innerHTML = '';

  let expanded = {};
  try { expanded = JSON.parse(localStorage.getItem(SUPPLEMENTS_EXPAND_KEY) || '{}'); }
  catch (e) { expanded = {}; }

  getSupplementKeys().forEach(bookKey => {
    const book = SUPPLEMENTS[bookKey];
    const active = ['core', 'optional'].some(b => isSupplementActive(bookKey, b));
    // A book with anything switched on is ALWAYS open, whatever the saved
    // state. A live supplement collapsed out of sight is how a table loses
    // track of which rules it is playing.
    const open = active || !!expanded[bookKey];

    const wrap = document.createElement('div');
    wrap.style.cssText = 'background:var(--glass);border-radius:4px;margin-bottom:6px;';

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;cursor:pointer;';
    head.innerHTML =
      '<span class="supp-caret" style="font-size:10px;color:var(--muted);width:10px;">' +
        (open ? '\u25BC' : '\u25B6') + '</span>' +
      '<span style="font-size:12px;font-weight:600;">' + escapeHtml(book.code) + '</span>' +
      '<span style="font-size:12px;color:var(--muted);flex:1;">' + escapeHtml(book.title) + '</span>' +
      (active ? '<span style="font-size:10px;color:var(--accent-light);">\u25CF active</span>' : '');

    const body = document.createElement('div');
    body.style.cssText = 'padding:0 8px 8px 26px;' + (open ? '' : 'display:none;');

    const BANDS = {
      core:     { label: 'Apply ' + book.code + ' core rules',
                  hint:  'Rules this book states as its own. These change how numbers are ' +
                         'calculated. Unticked is the PHB.' },
      optional: { label: 'Apply ' + book.code + ' optional rules',
                  hint:  'Experiments the book itself marks optional. These SUPPRESS ' +
                         'warnings so your table can build them \u2014 they enforce nothing.' }
    };

    // A BAND MAY OVERRIDE ITS OWN HINT, because "optional" does not mean the
    // same thing in every book. PHBR11's optional rules suppress warnings and
    // enforce nothing, which is what the default says. PHBR1's optional band
    // holds one rule that changes a to-hit penalty -- both are optional in the
    // sense that matters, namely that the BOOK marks them so, but a shared hint
    // would have to lie about one of them. The registry knows which it is.
    const bandHint = (band, meta) => (book[band] && book[band].hint) || meta.hint;

    ['core', 'optional'].forEach(band => {
      const grp = book[band];
      if (!grp) return;
      const meta = BANDS[band];

      const row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin:0 0 8px;';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = isSupplementActive(bookKey, band);
      cb.style.cssText = 'width:16px;height:16px;cursor:pointer;flex-shrink:0;margin-top:1px;';

      const changes = (grp.changes || []).map(c =>
        '<li style="margin-top:3px;">' + escapeHtml(c.text) +
        (c.caveat ? '<div style="color:var(--warning, #e0a34a);margin-top:2px;">' +
                    escapeHtml(c.caveat) + '</div>' : '') + '</li>').join('');

      const text = document.createElement('div');
      text.style.flex = '1';
      text.innerHTML =
        '<div style="font-size:12px;">' + meta.label + '</div>' +
        '<div style="font-size:10px;color:var(--muted);margin-top:2px;">' +
          bandHint(band, meta) + '</div>' +
        (changes ? '<ul style="font-size:10px;color:var(--muted);margin:4px 0 0;' +
                   'padding-left:14px;">' + changes + '</ul>' : '');

      row.appendChild(cb);
      row.appendChild(text);
      body.appendChild(row);

      cb.addEventListener('click', e => e.stopPropagation());
      cb.addEventListener('change', () => {
        setSupplement(bookKey, band, cb.checked);
        renderSupplements(root);          // repaint: the active marker may change
        recalcAllOpenSheets();
      });
    });

    head.addEventListener('click', () => {
      const nowOpen = body.style.display === 'none';
      body.style.display = nowOpen ? '' : 'none';
      const caret = head.querySelector('.supp-caret');
      if (caret) caret.textContent = nowOpen ? '\u25BC' : '\u25B6';
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(SUPPLEMENTS_EXPAND_KEY) || '{}'); }
      catch (e) { saved = {}; }
      saved[bookKey] = nowOpen;
      localStorage.setItem(SUPPLEMENTS_EXPAND_KEY, JSON.stringify(saved));
    });

    wrap.appendChild(head);
    wrap.appendChild(body);
    listEl.appendChild(wrap);
  });
}

// Shared by the optional-rule checkboxes and the supplement toggles, which used
// to carry two copies of this list. Both change rules that move movement,
// combat, stealth and the build advisories.
function recalcAllOpenSheets() {
  document.querySelectorAll('.sheet-container').forEach(sheet => {
    if (typeof recalculateAll === 'function') recalculateAll(sheet);
    // renderArmorRestrictions and renderHenchmanLimits ARE inside
    // recalculateAll and need no line here. renderClassGroupValidation is not,
    // so it still does.
    if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(sheet);
    if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(sheet);
  });
}

function renderOneOptionalRule(listEl, key) {
  {
    const rule = OPTIONAL_RULES[key];

    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:8px;background:var(--glass);border-radius:4px;margin-bottom:6px;';

    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin:0;';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'optional-rule-chk';
    cb.dataset.rule = key;
    cb.checked = isOptionalRule(key);
    cb.style.cssText = 'width:16px;height:16px;cursor:pointer;flex-shrink:0;margin-top:1px;';

    const text = document.createElement('div');
    text.style.flex = '1';
    text.innerHTML =
      '<div style="font-size:12px;">' + rule.label + '</div>' +
      '<div style="font-size:10px;color:var(--muted);margin-top:2px;">' + (rule.detail || '') + '</div>';

    row.appendChild(cb);
    row.appendChild(text);
    wrap.appendChild(row);
    listEl.appendChild(wrap);

    cb.addEventListener('change', () => {
      setOptionalRule(key, cb.checked);
      // Recalculate every open tab -- these rules affect movement, combat, etc.
      document.querySelectorAll('.sheet-container').forEach(sheet => {
        if (typeof recalculateAll === 'function') recalculateAll(sheet);
        // renderArmorRestrictions and renderHenchmanLimits ARE inside
        // recalculateAll and need no line here. renderClassGroupValidation is
        // not, so it still does.
        if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(sheet);
        if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(sheet);
      });
    });
  }
}

function closeKvSettingsModal(root) {
  qs(root, '.kv-modal-overlay').style.display = 'none';
}

// ===== Print options modal =====
// These are BROWSER settings, not character data -- they live in localStorage
// and are deliberately kept out of the character record and the KV payload,
// consistent with how optional rules and KV config are handled.

const PRINT_OPTS_KEY = 'gsheets_print_options';

// Sections a traditional AD&D 2e record sheet surfaces are ON by default.
// Empty sections collapse at print time, so defaulting something ON costs
// nothing for a character who has no data for it.
const PRINT_OPTION_DEFAULTS = {
  // Character
  abilities:        true,
  powersHindrances: true,
  thiefSkills:      true,
  languages:        true,
  conditions:       false,
  portrait:         false,
  // Magic
  spellAccess:      true,
  memorized:        true,
  spellbooks:       true,
  // Gear
  equipment:        true,
  magicItems:       true,
  armorAmmo:        true,
  // Background & followers
  details:          true,
  background:       false,
  henchmen:         true,
  hirelings:        true,
  companions:       true,
  mounts:           true,
  // Journal
  sessionLog:       false,
  questJournal:     false,
  npcs:             false,
  locations:        false,
  characterJournal: false,
  // Sub-option (not a checkbox)
  spellbookDetail:  'summary',

  // Colour scheme for section rules and table header tints. Keys map to
  // PRINT_PALETTES in print.js. Defaults to graphite -- no colour -- so
  // anyone who never opens this dropdown gets the ink-cheapest sheet.
  palette:          'graphite',

  // Typeface for section headings only; table data always uses the body font
  // below. Keys map to PRINT_TITLE_FONTS
  // in print.js. 'Roboto' means no embedded font at all, which is also the
  // fallback if a fetch fails.
  titleFont:        'Cinzel',

  // Typeface for everything except section headings. Keys map to
  // PRINT_BODY_FONTS in print.js; unlike the title font this needs all four
  // styles, since table headers are bold and empty sections print in italics.
  bodyFont:         'PTSans',

  // Extras -- checkboxes in the "Blank Lines & Extra Pages" panel
  changesPage:      false,
  printDate:        false,
  tallyBoxes:       false
};

// Blank rows appended to the end of each printed list, and extra whole pages
// appended to the end of the sheet. Zero disables -- no separate checkbox.
//
// Defaults are roughly "one session's worth of acquisitions" for the lists
// that change fast, and less for the ones that rarely do. All default to 0 for
// the extra PAGES, which are opt-in: a player who wants them knows they do.
// Blank rows on a BLANK sheet, as distinct from the handful appended to a real
// character's lists. Sized to fill a page rather than to leave room for one
// session's acquisitions -- a blank sheet with three weapon rows is no use to
// anyone rolling a character up longhand.
const PRINT_BLANK_SHEET_ROWS = {
  // Equipment, Valuables and the coin block share ONE section, and the coin
  // block is a columns: node -- pdfMake cannot split those, so it moves whole
  // to the next page rather than flowing. 60 equipment rows pushed the section
  // past a page and stranded the coins on their own. These three are sized to
  // fit together on one page: a page holds roughly 36 blank rows at 6pt.
  weapons: 14, equipment: 30, valuables: 8, magicItems: 12,
  armor: 14, ammo: 12, weaponProfs: 14, nwps: 14, languages: 15,
  memorized: 55, spellbook: 30, conditions: 18,
  henchmen: 9, hirelings: 9, companions: 30, mounts: 30,
  // The prose sections have no table body to push blank rows into, so these
  // counts are RULED WRITING LINES, not table rows -- print.js reads them
  // through ruledLines() rather than blankRows(). Powers and Hindrances are
  // sized to finish page 3, which currently ends about a quarter short.
  abilities: 12,
  powers: 5, hindrances: 5,
  background: 14,
  sessionLog: 24, questJournal: 24, npcs: 24, locations: 24,
  characterJournal: 48,
  // Two of each appendix page. A blank sheet is for rolling a character up on
  // paper, so the spell pages are not "extra" here -- they are the only ones
  // there will be. Each prints APPENDIX_ROWS (32) ruled rows.
  extraSpellbookPages: 2, extraMemorizationPages: 2, extraBlankPages: 2
};

// Builds the options for a blank sheet: the caller's LOOK, every section on,
// generous rows, and the blank flag print.js keys off.
//
// Every section prints regardless of what the other tab has ticked. A blank
// sheet is a form, and omitting the spellbook page because this character has
// no spells would defeat the point -- the whole reason to print one is that
// there is no character yet.
function buildBlankPrintOptions(look) {
  const opts = Object.assign({}, PRINT_OPTION_DEFAULTS);
  Object.keys(opts).forEach(k => {
    if (typeof opts[k] === 'boolean') opts[k] = true;
  });
  opts.palette   = (look && look.palette)   || 'graphite';
  opts.titleFont = (look && look.titleFont) || 'Roboto';
  opts.bodyFont  = (look && look.bodyFont)  || 'Roboto';
  opts.blanks    = Object.assign({}, PRINT_BLANK_SHEET_ROWS);
  opts.blankSheet = true;
  return opts;
}

const PRINT_BLANK_DEFAULTS = {
  weapons:                3,
  equipment:              8,
  valuables:              4,
  magicItems:             4,
  armor:                  3,
  ammo:                   3,
  weaponProfs:            3,
  nwps:                   4,
  languages:              2,
  memorized:              6,
  spellbook:              8,
  conditions:             4,
  henchmen:               2,
  hirelings:              2,
  companions:             2,
  mounts:                 2,
  extraSpellbookPages:    0,
  extraMemorizationPages: 0,
  extraBlankPages:        0
};

// Saved prefs are layered OVER the defaults, so a new option added to the
// registry later still gets its default for users with an existing saved set.
function getPrintOptions() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(PRINT_OPTS_KEY)) || {};
  } catch (e) {
    saved = {};
  }
  const opts = Object.assign({}, PRINT_OPTION_DEFAULTS, saved);
  // Blank counts live on their own sub-object so they never collide with an
  // option key, and so a new entry added later still picks up its default.
  opts.blanks = Object.assign({}, PRINT_BLANK_DEFAULTS, saved.blanks || {});
  return opts;
}

// Rough page estimate for the modal footer. Not exact -- pdfMake decides the
// real breaks -- but close enough to warn before generating twenty pages.
function estimatePrintPages(root, opts) {
  let pages = 2;                       // core pages, always printed
  if (opts.languages || opts.thiefSkills || opts.abilities ||
      opts.powersHindrances || opts.conditions) pages += 1;
  if (opts.spellAccess || opts.memorized || opts.spellbooks) pages += 1;
  if (opts.equipment || opts.magicItems) pages += 1;
  if (opts.details || opts.background || opts.henchmen ||
      opts.hirelings || opts.companions || opts.mounts) pages += 1;
  if (opts.sessionLog || opts.questJournal || opts.npcs ||
      opts.locations || opts.characterJournal) pages += 1;

  const b = opts.blanks || {};
  const blankRows = Object.keys(PRINT_BLANK_DEFAULTS)
    .filter(k => k.indexOf('extra') !== 0)
    .reduce((n, k) => n + (parseInt(b[k], 10) || 0), 0);
  pages += Math.ceil(blankRows / 45);  // ~45 rows to a page at 6pt

  pages += (parseInt(b.extraSpellbookPages, 10) || 0);
  pages += (parseInt(b.extraMemorizationPages, 10) || 0);
  pages += (parseInt(b.extraBlankPages, 10) || 0);
  if (opts.changesPage) pages += 1;

  return pages;
}

function updatePrintPageEstimate(root) {
  const el = qs(root, '.print-page-estimate');
  if (!el) return;
  const n = estimatePrintPages(root, readPrintOptionsFromModal(root));
  el.textContent = `Estimated: ${n} page${n === 1 ? '' : 's'}`;
}

function savePrintOptions(opts) {
  try {
    localStorage.setItem(PRINT_OPTS_KEY, JSON.stringify(opts));
  } catch (e) {
    console.warn('Could not save print options:', e);
  }
}

function applyPrintOptionsToModal(root, opts) {
  qsa(root, '.print-opt').forEach(cb => {
    cb.checked = !!opts[cb.dataset.opt];
  });
  const sel = qs(root, '.print-spellbook-detail');
  if (sel) sel.value = opts.spellbookDetail || 'summary';
  const pal = qs(root, '.print-palette');
  if (pal) pal.value = opts.palette || 'graphite';
  const tf = qs(root, '.print-title-font');
  if (tf) tf.value = opts.titleFont || 'Cinzel';
  const bf = qs(root, '.print-body-font');
  if (bf) bf.value = opts.bodyFont || 'PTSans';

  const blanks = opts.blanks || PRINT_BLANK_DEFAULTS;
  qsa(root, '.print-blank').forEach(inp => {
    const v = blanks[inp.dataset.blank];
    inp.value = (v === undefined || v === null) ? 0 : v;
  });
}

function readPrintOptionsFromModal(root) {
  const opts = {};
  qsa(root, '.print-opt').forEach(cb => {
    opts[cb.dataset.opt] = cb.checked;
  });
  const sel = qs(root, '.print-spellbook-detail');
  opts.spellbookDetail = sel ? sel.value : 'summary';
  const pal = qs(root, '.print-palette');
  opts.palette = pal ? pal.value : 'graphite';
  const tf = qs(root, '.print-title-font');
  opts.titleFont = tf ? tf.value : 'Cinzel';
  const bf = qs(root, '.print-body-font');
  opts.bodyFont = bf ? bf.value : 'PTSans';

  opts.blanks = {};
  qsa(root, '.print-blank').forEach(inp => {
    const n = parseInt(inp.value, 10);
    opts.blanks[inp.dataset.blank] = (isNaN(n) || n < 0) ? 0 : n;
  });
  return opts;
}

function setAllPrintOptions(root, checked) {
  qsa(root, '.print-opt').forEach(cb => { cb.checked = checked; });
}

function openPrintModal(root) {
  applyPrintOptionsToModal(root, getPrintOptions());
  updatePrintPageEstimate(root);
  qs(root, '.print-modal-overlay').style.display = 'flex';
}

function closePrintModal(root) {
  qs(root, '.print-modal-overlay').style.display = 'none';
}

function updateKvSyncStatus(root, cfg) {
  if (!cfg) cfg = getKvConfig();
  const statusEl    = qs(root, '.kv-sync-status');
  const timestampEl = qs(root, '.kv-timestamps');
  const pushEl      = qs(root, '.kv-last-push-display');
  const pullEl      = qs(root, '.kv-last-pull-display');
  if (statusEl) {
    statusEl.textContent = cfg.kvEnabled ? '● Active' : '○ Disabled';
    statusEl.style.color = cfg.kvEnabled ? 'var(--accent-light)' : 'var(--muted)';
  }
  const fmt = ts => ts ? new Date(ts).toLocaleString() : '—';
  if (cfg.kvLastPush || cfg.kvLastPull) {
    if (timestampEl) timestampEl.style.display = 'block';
    if (pushEl) pushEl.textContent = fmt(cfg.kvLastPush);
    if (pullEl) pullEl.textContent = fmt(cfg.kvLastPull);
  } else {
    if (timestampEl) timestampEl.style.display = 'none';
  }
}

async function kvSaveWorkerUrl(root) {
  const inp    = qs(root, '.kv-worker-url-inp');
  const status = qs(root, '.kv-worker-url-status');
  const url    = (inp.value || '').trim();
  const cfg    = getKvConfig();
  cfg.workerUrl = url;
  saveKvConfig(cfg);
  if (!url) {
    status.style.color = 'var(--muted)';
    status.textContent = '✓ Cleared.';
    setTimeout(() => { status.textContent = ''; }, 3000);
    return;
  }
  status.style.color = 'var(--muted)';
  status.textContent = 'Verifying…';
  try {
    const res  = await fetch(url.replace(/\/+$/, '') + '/ping');
    const data = await res.json();
    if (data.ok) {
      status.style.color = 'var(--accent-light)';
      status.textContent = '✓ Worker reachable — URL saved.';
    } else {
      status.style.color = 'orange';
      status.textContent = '⚠ Worker responded unexpectedly. URL saved anyway.';
    }
  } catch(e) {
    status.style.color = 'orange';
    status.textContent = '⚠ Could not reach worker — check the URL. Saved anyway.';
  }
  setTimeout(() => { status.textContent = ''; }, 4000);
}

function kvCopyToken(root) {
  const cfg = getKvConfig();
  navigator.clipboard.writeText(cfg.kvToken).then(() => {
    const btn = qs(root, '.kv-copy-token');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  });
}

function kvEnterToken(root) {
  const newToken = (prompt('Paste the sync token from your other device:') || '').trim();
  if (!newToken) return;
  const status = qs(root, '.kv-token-status');
  if (newToken.length < 32) {
    status.style.color = '#d9534f';
    status.textContent = '✗ Token too short — make sure you copied the full token.';
    setTimeout(() => { status.textContent = ''; }, 3000);
    return;
  }
  const cfg      = getKvConfig();
  cfg.kvToken    = newToken;
  cfg.kvLastPush = 0;
  cfg.kvLastPull = 0;
  saveKvConfig(cfg);
  qs(root, '.kv-token-display').value = newToken;
  status.style.color = 'var(--accent-light)';
  status.textContent = '✓ Token saved — use Pull from KV to download your characters.';
  setTimeout(() => { status.textContent = ''; }, 4000);
}

function kvResetToken(root) {
  if (!confirm('This will generate a new sync token and disconnect from your current KV data.\n\nYour local characters are safe. Are you sure?')) return;
  const cfg      = getKvConfig();
  cfg.kvToken    = generateSyncToken();
  cfg.kvLastPush = 0;
  cfg.kvLastPull = 0;
  saveKvConfig(cfg);
  qs(root, '.kv-token-display').value = cfg.kvToken;
  updateKvSyncStatus(root, cfg);
}

function kvSaveEnabled(checked, root) {
  const cfg     = getKvConfig();
  cfg.kvEnabled = checked;
  saveKvConfig(cfg);
  updateKvSyncStatus(root, cfg);
  if (checked) kvPull(false);
}

// ===== KV Sync — push / pull =====

let _kvPushTimer = null;

function kvPushDebounced() {
  const cfg = getKvConfig();
  if (!cfg.kvEnabled) return;
  clearTimeout(_kvPushTimer);
  _kvPushTimer = setTimeout(kvPush, 5000);
}

// Merge two character maps, keeping whichever copy of each character is newer.
// Characters saved before per-character timestamps existed have no _updatedAt;
// they are treated as oldest (0), so any stamped record wins over them. Once
// each device has saved once, comparisons become reliable.
//
// NOTE: this relies on device clocks being roughly in sync. A phone whose clock
// is badly wrong can win a comparison it should lose.
// How long tombstones are retained before being purged. Matches the worker's
// 90-day KV expiry, so a device offline longer than this may resurrect a
// deleted character -- an acceptable trade to stop tombstones growing forever.
const KV_TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// Merge two character maps, keeping whichever copy of each character is newer.
//
// A record is either a live character (_updatedAt) or a tombstone marking a
// deletion (_deletedAt). Both are just timestamps, so the comparison is the
// same either way -- the later stamp wins. That means a character edited on one
// device AFTER being deleted on another correctly survives, and vice versa.
//
// Records saved before per-character timestamps existed have neither field and
// are treated as oldest (0), so any stamped record beats them.
//
// NOTE: relies on device clocks being roughly in sync.
function kvMergeChars(localMap, remoteMap) {
  const stamp = rec => (rec && (rec._updatedAt || rec._deletedAt)) || 0;

  const merged = { ...localMap };
  let updated = 0;

  Object.entries(remoteMap || {}).forEach(([name, remoteChar]) => {
    const localChar = merged[name];

    if (!localChar) {
      merged[name] = remoteChar;
      updated++;
      return;
    }

    if (stamp(remoteChar) > stamp(localChar)) {
      merged[name] = remoteChar;
      updated++;
    }
  });

  // Purge tombstones older than the TTL so they don't accumulate indefinitely.
  const cutoff = Date.now() - KV_TOMBSTONE_TTL_MS;
  Object.keys(merged).forEach(name => {
    const rec = merged[name];
    if (rec && rec._deletedAt && rec._deletedAt < cutoff) {
      delete merged[name];
    }
  });

  return { merged, updated };
}

// force = true skips the merge and replaces KV outright. Only reachable from
// the manual push button; autosave always merges.
async function kvPush(force = false) {
  const cfg = getKvConfig();
  if (!cfg.workerUrl) return;
  const rawMap   = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}');
  const charMap  = {};
  Object.entries(rawMap).forEach(([name, data]) => {
    // Tombstones must sync -- that is the whole point of them -- so they are
    // included even though they carry no real character data.
    if (data && data._deletedAt) { charMap[name] = data; return; }

    const charName = (data?.meta?.name || '').trim();
    if (charName && charName.toLowerCase() !== 'unnamed') charMap[name] = data;
  });
  if (Object.keys(charMap).length === 0) return;

  // Fetch what is already in KV and merge, rather than blindly overwriting.
  // Without this, a device holding a stale copy will clobber newer data pushed
  // from another device the moment it autosaves.
  let toPush = charMap;
  try {
    if (force) throw new Error('force push -- skipping merge');
    const getRes = await fetch(cfg.workerUrl.replace(/\/+$/, '') + '/kv', {
      method:  'GET',
      headers: { 'X-Sync-Token': cfg.kvToken },
    });
    if (getRes.ok) {
      const { found, data } = await getRes.json();
      if (found && data && data.payload && data.payload.characters) {
        const { merged } = kvMergeChars(charMap, data.payload.characters);
        toPush = merged;
      }
    }
  } catch (e) {
    // If the read fails, fall back to pushing local as-is rather than losing
    // the save entirely. Worst case is the old clobber behavior.
    console.warn('[KV] pre-push read failed, pushing local only:', e);
  }

  const now      = Date.now();
  const envelope = {
    version:   2,
    updatedAt: now,
    clientId:  cfg.clientId || 'unknown',
    payload: {
      characters: toPush,
      kvToken:    cfg.kvToken,
    }
  };
  try {
    const res = await fetch(cfg.workerUrl.replace(/\/+$/, '') + '/kv', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Sync-Token': cfg.kvToken },
      body:    JSON.stringify(envelope),
    });
    if (res.ok) {
      cfg.kvLastPush = now;
      saveKvConfig(cfg);
    }
  } catch(e) { console.warn('[KV] push failed:', e); }
}

async function kvPull(overwrite = false) {
  const cfg = getKvConfig();
  if (!cfg.workerUrl) return 0;
  try {
    const res = await fetch(cfg.workerUrl.replace(/\/+$/, '') + '/kv', {
      method:  'GET',
      headers: { 'X-Sync-Token': cfg.kvToken },
    });
    if (!res.ok) return 0;
    const { found, data } = await res.json();
    if (!found || !data || !data.payload) return 0;
    const remoteChars = data.payload.characters || {};
    const localMap    = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}');
    let added = 0;
    let finalMap;

    if (overwrite) {
      // Explicit REPLACE -- remote wins outright, no timestamp check.
      finalMap = { ...localMap };
      Object.entries(remoteChars).forEach(([name, charData]) => {
        finalMap[name] = charData;
        added++;
      });
    } else {
      // Normal pull -- take a remote character only if it is genuinely newer.
      const res2 = kvMergeChars(localMap, remoteChars);
      finalMap = res2.merged;
      added    = res2.updated;
    }

    // The worst of the five to lose silently: the merge has already resolved
    // remote against local, so a dropped write means the pull looks like it
    // succeeded while the characters it brought down were never stored.
    if (added > 0 && !writeCharacterMap(finalMap, 'KV pull merge')) return;
    const now      = Date.now();
    cfg.kvLastPull = now;
    saveKvConfig(cfg);
    return added;
  } catch(e) {
    console.warn('[KV] pull failed:', e);
    return 0;
  }
}

async function kvPushManual(root) {
  const status  = qs(root, '.kv-token-status');
  const warning =
    'Push to KV:\n\n' +
    '  MERGE — combine local and KV, keeping the newer copy of each character (safe)\n' +
    '  FORCE — replace KV entirely with your local characters\n\n' +
    '⚠ FORCE discards anything in KV that is not on this device.\n' +
    'Only use it to repair bad KV data.\n\n' +
    'Type MERGE or FORCE:';

  const answer = prompt(warning, 'MERGE');
  if (answer === null) {
    status.style.color = 'var(--muted)';
    status.textContent = 'Push cancelled.';
    setTimeout(() => { status.textContent = ''; }, 2000);
    return;
  }

  const mode = (answer || '').trim().toUpperCase();
  if (mode !== 'MERGE' && mode !== 'FORCE') {
    status.style.color = 'var(--muted)';
    status.textContent = 'Push cancelled — type MERGE or FORCE.';
    setTimeout(() => { status.textContent = ''; }, 3000);
    return;
  }

  status.style.color = 'var(--accent-light)';
  status.textContent = mode === 'FORCE' ? '⬆ Pushing (force)…' : '⬆ Pushing (merge)…';

  await kvPush(mode === 'FORCE');

  status.textContent = mode === 'FORCE' ? '✓ KV replaced with local data.' : '✓ Pushed and merged.';
  updateKvSyncStatus(root, getKvConfig());
  setTimeout(() => { status.textContent = ''; }, 3000);
}
async function kvPullManual(root) {
  const status = qs(root, '.kv-token-status');

  // kvPull(false) is ADD-ONLY -- it skips any character whose name already
  // exists locally, so it can never bring down an updated version. That is why
  // a second device stays frozen at an old level. Offer the overwrite path.
  const choice = prompt(
    'Pull from KV:\n\n' +
    '  ADD   — only bring down characters you do not already have (safe)\n' +
    '  REPLACE — overwrite your local copies with the KV versions\n\n' +
    'Use REPLACE if a character is out of date on this device.\n' +
    '⚠ REPLACE discards any local changes not yet pushed to KV.\n\n' +
    'Type ADD or REPLACE:',
    'ADD'
  );

  if (choice === null) {
    status.style.color = 'var(--muted)';
    status.textContent = 'Pull cancelled.';
    setTimeout(() => { status.textContent = ''; }, 2000);
    return;
  }

  const mode = (choice || '').trim().toUpperCase();
  if (mode !== 'ADD' && mode !== 'REPLACE') {
    status.style.color = 'var(--muted)';
    status.textContent = 'Pull cancelled — type ADD or REPLACE.';
    setTimeout(() => { status.textContent = ''; }, 3000);
    return;
  }

  const overwrite = (mode === 'REPLACE');

  status.style.color = 'var(--accent-light)';
  status.textContent = overwrite ? '⬇ Pulling (replace)…' : '⬇ Pulling (add only)…';

  const added = await kvPull(overwrite);

  if (added === 0) {
    status.style.color = 'var(--muted)';
    status.textContent = overwrite
      ? '✓ Nothing found in KV for this token.'
      : '✓ No new characters found. Use REPLACE to update existing ones.';
  } else if (added > 0) {
    status.style.color = 'var(--accent-light)';
    status.textContent = overwrite
      ? `✓ ${added} character(s) replaced from KV. Reload the tab to see changes.`
      : `✓ ${added} character(s) pulled. Use Open… to load them.`;
  } else {
    status.style.color = '#d9534f';
    status.textContent = '✗ Pull failed — check your Worker URL and token.';
  }

  updateKvSyncStatus(root, getKvConfig());
  setTimeout(() => { status.textContent = ''; }, 5000);
}

// Filter memorized spells by level
function filterMemorizedSpells(root, selectedLevel) {
  const memList = root.querySelector('.memspells-list');
  if (!memList) return;
  
  const spellItems = memList.querySelectorAll('.item');
  
  spellItems.forEach(item => {
    const levelInput = item.querySelector('.level');
    if (!levelInput) {
      item.style.display = '';
      return;
    }
    
    const spellLevel = levelInput.value.trim();
    const parsedLevel = parseInt(spellLevel, 10);
    
    // Show all if no filter selected
    if (selectedLevel === '') {
      item.style.display = '';
      return;
    }
    
    // Show "special" spells (non-numeric or out of range)
    if (selectedLevel === 'special') {
      if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 9) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
      return;
    }
    
    // Show specific level
    const filterLevel = parseInt(selectedLevel, 10);
    if (parsedLevel === filterLevel) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });

  // Headers count only VISIBLE rows, so they have to be recomputed after the
  // filter has run -- otherwise a filtered list reports spells that are not on
  // screen, and headers whose whole group was hidden sit there labelling
  // nothing.
  if (typeof updateMemLevelHeaders === 'function') updateMemLevelHeaders(root);
}

// Filter spellbook by level
function filterSpellbook(root, selectedLevel) {
  const spellbookList = root.querySelector('.spellbook-list');
  if (!spellbookList) return;
  
  const spellItems = spellbookList.querySelectorAll('.item');
  
  spellItems.forEach(item => {
    const levelInput = item.querySelector('.level');
    if (!levelInput) {
      item.style.display = '';
      return;
    }
    
    const spellLevel = levelInput.value.trim();
    const parsedLevel = parseInt(spellLevel, 10);
    
    // Show all if no filter selected
    if (selectedLevel === '') {
      item.style.display = '';
      return;
    }
    
    // Show "special" spells (non-numeric or out of range)
    if (selectedLevel === 'special') {
      if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 9) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
      return;
    }
    
    // Show specific level
    const filterLevel = parseInt(selectedLevel, 10);
    if (parsedLevel === filterLevel) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// ===== Tabs bootstrap & handlers =====
function openIntoCurrentOrNewWrapper(name, data){ return openIntoCurrentOrNew(name, data); } // (kept for clarity)

function openNewBlankTab(){ tabCounter++; newTab('Character ' + tabCounter); }

$('add-tab').onclick = openNewBlankTab;

function openIntoCurrentOrNewFromPicker(name, map){ return openIntoCurrentOrNew(name, map[name]); }

function setDefaultTabHandlers(defaultTab){
  // close handler
  defaultTab.querySelector('.close').onclick = ()=>{
    closeTab(defaultTab, document.querySelector('.tab-content[data-id="default"]'));
  };
  // click handler
  defaultTab.onclick = (e)=>{
    if(!e.target.classList.contains('close')) setActiveTab('default');
  };
}

// === Condition/Status Tracker Functions ===

// Aggregate the mechanical effects of every ACTIVE condition into one object.
//
// Additive fields SUM; multiplicative fields MULTIPLY -- a character both Slowed
// and Stunned moves at 1/2 x 1/3 = 1/6, not at whichever is worse. Each effect
// records which conditions produced it so the quick reference can name them
// rather than showing an unexplained number.
//
// DELIBERATELY OMITS attackerToHit and autoHit. Those are the ATTACKER'S
// numbers, rolled by the DM -- there is nothing for this sheet to compute from
// them, and folding them in would imply the character's own AC had changed.
// They stay on the condition card where the player can read them out.
function getActiveConditionEffects(root) {
  const out = {
    ownAttack: 0, acPenalty: 0, initiativeMod: 0, surpriseMod: 0,
    moveMult: 1, attackRateMult: 1, negatesDexCombat: false,
    // Keyed by ability ('str', 'dex', ...) rather than a fixed set, so an
    // ability nobody has modified is absent rather than sitting at 0. Its
    // sources entry is likewise an OBJECT of arrays, not a flat array.
    abilityMods: {},
    savesWorseUnstated: false,
    sources: { ownAttack: [], acPenalty: [], initiativeMod: [], surpriseMod: [],
               moveMult: [], attackRateMult: [], negatesDexCombat: [],
               savesWorseUnstated: [], abilityMods: {} },
    any: false
  };

  const list = root && root.querySelector('.conditions-list');
  if (!list || typeof CONDITIONS_DB === 'undefined') return out;

  Array.from(list.querySelectorAll('.condition-item')).forEach(item => {
    const name = item.dataset.condition || '';
    const def = CONDITIONS_DB.find(c => c.name === name);
    if (!def) return;

    const add = (key, val) => {
      if (val === undefined || val === null || val === 0) return;
      out[key] += val; out.sources[key].push(name); out.any = true;
    };
    const mul = (key, val) => {
      if (val === undefined || val === null || val === 1) return;
      out[key] *= val; out.sources[key].push(name); out.any = true;
    };

    add('ownAttack',     def.ownAttack);
    add('acPenalty',     def.acPenalty);
    add('initiativeMod', def.initiativeMod);
    // The character's OWN surprise roll (PHB Ch.11). Safe to sum: add() skips
    // null and undefined, so a condition without one contributes nothing.
    add('surpriseMod',   def.surpriseMod);
    mul('moveMult',      def.moveMult);
    mul('attackRateMult', def.attackRateMult);
    if (def.negatesDexCombat) {
      out.negatesDexCombat = true;
      out.sources.negatesDexCombat.push(name);
      out.any = true;
    }

    // Ability score modifiers SUM, per ability, and each records its sources.
    // Positive values are supported deliberately: a future buff condition uses
    // the same field. Zero rows are skipped, so a condition that lists an
    // ability at 0 contributes nothing and names nobody.
    // A saving-throw effect with NO NUMBER (Surprised, PHB Ch.9). Boolean, not
    // summed: two conditions that both make saves worse still say only that
    // saves are worse. Kept separate from surpriseMod, which is a different
    // roll -- conflating them is the bug conditions.js records in its header.
    if (def.savesWorseUnstated) {
      out.savesWorseUnstated = true;
      out.sources.savesWorseUnstated.push(name);
      out.any = true;
    }

    if (def.abilityMods) {
      Object.keys(def.abilityMods).forEach(k => {
        const v = def.abilityMods[k];
        if (!v) return;
        out.abilityMods[k] = (out.abilityMods[k] || 0) + v;
        (out.sources.abilityMods[k] = out.sources.abilityMods[k] || []).push(name);
        out.any = true;
      });
    }
  });

  return out;
}

// Ability scores as the active conditions leave them. READ-ONLY: nothing here
// writes to the sheet, and the recorded scores are never touched. See P8 in the
// project notes for the scope decision behind this.
//
// Returns { any, base{}, adjusted{}, delta{}, sources{}, strExceptional }.
//
// EXCEPTIONAL STRENGTH (Chris's ruling): a whole-point penalty removes it for
// the duration -- an 18/00 warrior at -1 has a plain 17's effects. That falls
// out of getStrengthData, which only consults the percentile at exactly 18, so
// no special case is needed. The percentile is carried forward ONLY when the
// character already had an 18: a buff that raises 17 to 18 does not grant
// exceptional Strength, which is rolled once at generation. A future PERCENTILE
// debuff belongs on strExceptional below; the return shape already carries it.
function getConditionAdjustedAbilities(root) {
  const KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const eff  = getActiveConditionEffects(root);
  const mods = eff.abilityMods || {};
  const out  = { any: false, base: {}, adjusted: {}, delta: {}, sources: {},
                 strExceptional: '' };

  KEYS.forEach(k => {
    const raw = parseInt(val(root, k), 10);
    const d   = mods[k] || 0;
    out.base[k]    = isNaN(raw) ? null : raw;
    out.delta[k]   = d;
    out.sources[k] = (eff.sources.abilityMods && eff.sources.abilityMods[k]) || [];
    // Clamp 1-25: STR_TABLE and WIS_MDA both define 1, and getStrengthData
    // returns null outside the table, which prints as a blank rather than a
    // number.
    out.adjusted[k] = (out.base[k] === null) ? null
                    : Math.max(1, Math.min(25, out.base[k] + d));
    if (d) out.any = true;
  });

  if (out.base.str === 18 && out.adjusted.str === 18) {
    out.strExceptional = val(root, 'str_exceptional') || '';
  }

  return out;
}

// PHB Ch.11 surprise modifiers, gathered from what the sheet already knows.
//
// The roller used to say "No standard modifier applies", which Ch.11 denies
// outright: "The surprise roll can also be modified by Dexterity, race, class,
// cleverness, and situation." Most of that is the DM's, but two pieces are the
// character's own and were already sitting on this sheet unread.
//
// DIRECTION is spelled out in words because surprise runs opposite to most
// rolls and both chapters bother to say so. Ch.11: "A plus to your die roll
// reduces the odds that you are surprised." Ch.1: "The more positive the
// modifier, the less likely the character is to be surprised."
//
// The racial Surprise Bonus is REPORTED AND NEVER ADDED. Elves and halflings
// penalise their opponents' rolls, not their own; folding it in here would be
// the right modifier applied to the wrong side of the table.
function buildSurpriseModifierLines(root, dex, total) {
  const lines = [];

  // Dexterity Reaction Adjustment. PHB Ch.1 defines this column BY this
  // function, which is why the printed sheet labels it "Surprise Adj".
  // DEX_TABLE index 0.
  const dexRow = (typeof DEX_TABLE !== 'undefined' && DEX_TABLE[dex]) ? DEX_TABLE[dex] : null;
  const dexAdj = dexRow ? dexRow[0] : 0;
  if (dexAdj) {
    lines.push('Dexterity Reaction Adj. ' + (dexAdj > 0 ? '+' : '') + dexAdj +
               ':   ' + (total + dexAdj));
  } else {
    lines.push('Dexterity Reaction Adj.: none at this score.');
  }

  // Conditions carrying a SOURCED surpriseMod. Deafened, at -1, is the only one
  // in the book today.
  const fx = (typeof getActiveConditionEffects === 'function')
    ? getActiveConditionEffects(root) : { surpriseMod: 0, sources: {} };
  if (fx.surpriseMod) {
    lines.push('Conditions ' + (fx.surpriseMod > 0 ? '+' : '') + fx.surpriseMod +
               ':   ' + (total + dexAdj + fx.surpriseMod) +
               '   [' + (fx.sources.surpriseMod || []).join(', ') + ']');
  }

  // The number that actually decides it. The threshold used to sit beside the
  // RAW roll at the top of the tooltip, which is the one figure it must never
  // be read against -- 1-3 is tested after modifiers, which is the entire point
  // of having a modifier. Stated here, on the adjusted figure, instead.
  const adjusted = total + dexAdj + (fx.surpriseMod || 0);
  lines.push('');
  lines.push('SURPRISED ON 1-3 AFTER MODIFIERS.  Yours: ' + adjusted + '.');

  // Racial bonus -- reported, not applied. See the note above.
  const raceKey = (typeof getRaceKey === 'function') ? getRaceKey(val(root, 'race')) : null;
  const racial = (raceKey && typeof RACIAL_ABILITIES !== 'undefined' &&
                  RACIAL_ABILITIES[raceKey]) || [];
  if (racial.some(a => a && a.name === 'Surprise Bonus')) {
    lines.push('');
    lines.push('Racial Surprise Bonus: applies to the OPPOSING side roll,');
    lines.push('not to this one. See Racial Abilities for its conditions.');
  }

  lines.push('');
  lines.push('A PLUS reduces the odds you are surprised; a MINUS');
  lines.push('increases them (PHB Ch.11). Your DM may add further');
  lines.push('modifiers for race, class, cleverness and situation.');

  return lines;
}

// Returns the active condition that blocks natural healing, or null.
//
// Reads the STRUCTURED flag off CONDITIONS_DB rather than matching on a name,
// so adding another blocking condition later is a data change with no code
// change -- the same shape the Table 51 work will need for attacker modifiers.
// Returns the whole definition, not a boolean, so callers can quote its name
// and description back to the player instead of failing silently.
function getNaturalHealingBlocker(root) {
  const list = root && root.querySelector('.conditions-list');
  if (!list || typeof CONDITIONS_DB === 'undefined') return null;
  const active = Array.from(list.querySelectorAll('.condition-item'))
    .map(item => item.dataset.condition || '');
  return CONDITIONS_DB.find(c =>
    c.blocksNaturalHealing && active.indexOf(c.name) !== -1) || null;
}

function makeConditionNode(data = {}, onChange) {
  const el = document.createElement('div');
  el.className = 'condition-item';
  el.dataset.condition = data.condition || '';
  el.dataset.duration = data.duration || '';
  el.dataset.hpLoss = data.hpLoss || '';
  
  const conditionName = data.condition || 'Unknown';
  const duration = data.duration || '';
  const hpLoss = data.hpLoss || '';
  const durationText = duration ? `(${duration} rnds)` : '';
  
  // Check if this condition can cause HP loss
  const canLoseHP = ['Poisoned', 'Diseased', 'Dying'].includes(conditionName);
  
  // Always shown. A condition with no duration is the common case at the table
  // -- the DM says "you're stunned", then a round later says how long -- and
  // gating these on an existing duration made that unreachable.
  //
  // -1 clamps at 0 and blanks the display, so 0 reads as "indefinite" rather
  // than "expires now". The nag banner treats it the same way.
  const durationButtons =
    '<button class="duration-dec" title="Reduce duration by one round (stops at 0 = indefinite)" style="padding:2px 6px;font-size:11px;margin-left:4px;">-1</button>' +
    '<button class="duration-inc" title="Add a round to this condition\'s duration" style="padding:2px 6px;font-size:11px;">+1</button>';
  
  // Show HP loss field for applicable conditions
  const hpLossField = canLoseHP ?
    '<div style="margin-top:4px;font-size:11px;">' +
      '<label style="color:var(--muted);">HP Loss/Round: </label>' +
      '<input class="hp-loss-input" type="number" min="0" value="' + hpLoss + '" style="width:50px;padding:2px 4px;text-align:center;background:var(--input-bg);color:var(--text);border:1px solid var(--border);border-radius:4px;" placeholder="0">' +
    '</div>'
    : '';
  
  // Mechanical summary, straight from the structured fields. Shown on the card
  // face rather than inside the collapsed description: a player who has to
  // expand a panel to find out that attacks against him hit automatically will
  // not do it mid-combat.
  //
  // Beneficial conditions are tinted differently -- Hasted and Invisible sitting
  // in a red-bordered "condition" card already reads as bad news, and the effect
  // line is the place to correct that impression.
  const condDef = (typeof CONDITIONS_DB !== 'undefined')
    ? CONDITIONS_DB.find(c => c.name === conditionName) : null;
  const condEffects = (typeof summarizeConditionEffects === 'function')
    ? summarizeConditionEffects(condDef || conditionName) : [];
  const effectsLine = condEffects.length
    ? '<div class="condition-effects" style="margin-top:3px;font-size:10px;line-height:1.3;color:' +
      (condDef && condDef.beneficial ? 'var(--success, #4ade80)' : 'var(--error, #ff6b6b)') +
      ';">' + condEffects.join(' \u00b7 ') + '</div>'
    : '';

  // Beneficial conditions get a green card. Hasted and Invisible sitting in a
  // red alarm-coloured panel actively miscommunicated -- the effects text was
  // already green, which just made the card contradict itself.
  const benef  = !!(condDef && condDef.beneficial);
  const cardBg = benef ? 'rgba(110,220,150,0.08)' : 'rgba(255,100,100,0.1)';
  const cardBd = benef ? 'rgba(110,220,150,0.30)' : 'rgba(255,100,100,0.3)';
  const btnBg  = benef ? 'rgba(110,220,150,0.15)' : 'rgba(255,100,100,0.2)';
  const btnBd  = benef ? 'rgba(110,220,150,0.35)' : 'rgba(255,100,100,0.4)';
  const btnFg  = benef ? 'var(--success, #4ade80)' : '#ff6b6b';

  el.innerHTML = 
    // align-items:flex-start, NOT center -- with two lines of effects text a
    // vertically centred button drifts away from the name it belongs to.
    // The gap and the button's flex:0 0 auto stop the text crowding it.
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:6px 8px;background:' + cardBg + ';border:1px solid ' + cardBd + ';border-radius:4px;margin-bottom:6px;">' +
      // min-width:0 is the actual fix. A flex item defaults to min-width:auto,
      // so it refuses to shrink below its own text and overruns its neighbour
      // instead of wrapping. Without this the effects line sat under the button.
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
          '<strong class="condition-name" style="color:var(--text);">' + conditionName + '</strong>' +
          '<span class="condition-duration duration-display" style="font-size:11px;color:var(--muted);">' + durationText + '</span>' +
          durationButtons +
        '</div>' +
        effectsLine +
        hpLossField +
      '</div>' +
      '<button class="condition-remove" style="flex:0 0 auto;padding:4px 8px;font-size:11px;background:' + btnBg + ';border:1px solid ' + btnBd + ';color:' + btnFg + ';border-radius:4px;cursor:pointer;">Remove</button>' +
    '</div>' +
    // A <details> disclosure, not a click-anywhere-on-the-card toggle. It gives
    // the player something visible to click, works on touch, and drops the
    // four-way exclusion list the old handler needed to avoid firing on Remove
    // and the duration buttons. The text is static, so it is rendered up front
    // rather than filled in by a handler.
    '<details class="disclosure" style="font-size:11px;margin:-2px 0 6px;">' +
      '<summary>rules text</summary>' +
      '<div class="condition-description" style="padding:6px 8px;background:var(--glass);' +
        'border:1px solid var(--border);border-radius:4px;margin-top:4px;color:var(--muted);' +
        'line-height:1.45;">' +
        escapeHtml(typeof getConditionDescription === 'function'
          ? getConditionDescription(conditionName) : '') +
      '</div>' +
    '</details>';
  
  // HP Loss input handler
  if (canLoseHP) {
    const hpLossInput = el.querySelector('.hp-loss-input');
    hpLossInput.onchange = () => {
      el.dataset.hpLoss = hpLossInput.value;
      onChange && onChange();
    };
  }
  
  // Duration adjustment buttons -- ALWAYS wired, not just when a duration was
  // set at creation. Previously both the buttons and these handlers were gated
  // on `duration`, so a condition added without one could never be given one:
  // the round counter would tick past it forever. Combat is exactly when a DM
  // says "make that three rounds".
  const bumpNag = () => {
    const r = el.closest('.sheet-container');
    if (r && typeof updateConditionDisplay === 'function') updateConditionDisplay(r);
  };
  {
    el.querySelector('.duration-dec').onclick = (e) => {
      e.stopPropagation();
      let currentDuration = parseInt(el.dataset.duration, 10) || 0;
      if (currentDuration > 0) {
        currentDuration--;
        el.dataset.duration = currentDuration.toString();
        const durationSpan = el.querySelector('.condition-duration');
        if (currentDuration > 0) {
          durationSpan.textContent = `(${currentDuration} rnds)`;
        } else {
          durationSpan.textContent = '';
        }
        onChange && onChange();
        bumpNag();
      }
    };
    
    el.querySelector('.duration-inc').onclick = (e) => {
      e.stopPropagation();
      let currentDuration = parseInt(el.dataset.duration, 10) || 0;
      currentDuration++;
      el.dataset.duration = currentDuration.toString();
      const durationSpan = el.querySelector('.condition-duration');
      durationSpan.textContent = `(${currentDuration} rnds)`;
      onChange && onChange();
      bumpNag();
    };
  }
  
  // Remove button
  el.querySelector('.condition-remove').onclick = (e) => {
    e.stopPropagation();
    const root = el.closest('.sheet-container');
    el.remove();
    updateConditionDisplay(root);
    onChange && onChange();
  };
  
  return el;
}

function updateConditionDisplay(root) {
  const healthyIndicator = root.querySelector('.healthy-indicator');
  const conditionsList = root.querySelector('.conditions-list');
  const addButton = root.querySelector('.add-condition');
  
  if (!healthyIndicator || !conditionsList) return;
  
  const conditions = conditionsList.querySelectorAll('.condition-item');
  
  // Nag banner. Created lazily rather than added to sheet_template.js, so an
  // older saved layout picks it up without a template migration.
  let nag = root.querySelector('.condition-nag');
  if (!nag) {
    nag = document.createElement('div');
    nag.className = 'condition-nag';
    conditionsList.parentNode.insertBefore(nag, conditionsList);
  }

  if (conditions.length === 0) {
    // Show healthy indicator
    healthyIndicator.style.display = 'block';
    conditionsList.style.display = 'none';
    nag.style.display = 'none';
    nag.innerHTML = '';
  } else {
    // Show conditions list
    healthyIndicator.style.display = 'none';
    conditionsList.style.display = 'block';

    // Grouped by WHAT THE PLAYER CAN DO ABOUT IT, which is the only grouping
    // that changes behaviour. A banner that says "you have 3 conditions" gets
    // ignored; one that says "resting will heal you nothing" does not.
    const rows = Array.from(conditions).map(item => {
      const name = item.dataset.condition || '';
      const dur  = parseInt(item.dataset.duration, 10);
      return {
        name: name,
        def: (typeof CONDITIONS_DB !== 'undefined')
          ? CONDITIONS_DB.find(c => c.name === name) : null,
        dur: isNaN(dur) ? null : dur
      };
    });

    const lines = [];

    // Most urgent first: a state where attacks simply hit.
    const auto = rows.filter(r => r.def && r.def.autoHit).map(r => r.name);
    if (auto.length) {
      lines.push({ tone: 'bad', text: auto.join(', ') +
        ' \u2014 melee attacks against you hit AUTOMATICALLY' });
    }

    const blocked = rows.filter(r => r.def && r.def.blocksNaturalHealing).map(r => r.name);
    if (blocked.length) {
      lines.push({ tone: 'bad', text: blocked.join(', ') +
        ' \u2014 resting will restore 0 hit points' });
    }

    const ticking = rows.filter(r => r.dur !== null && r.dur > 0);
    if (ticking.length) {
      const soon = ticking.filter(r => r.dur <= 1).map(r => r.name);
      lines.push({ tone: 'warn',
        text: ticking.length + ' expiring \u2014 advance the round to tick ' +
              (ticking.length === 1 ? 'it' : 'them') + ' down' +
              (soon.length ? ' (' + soon.join(', ') + ' ends next round)' : '') });
    }

    // No duration and not beneficial: nothing the round counter will ever clear.
    const manual = rows.filter(r => (r.dur === null || r.dur <= 0) &&
                                    !(r.def && r.def.beneficial)).map(r => r.name);
    if (manual.length) {
      lines.push({ tone: 'muted', text: manual.join(', ') +
        ' \u2014 will not expire on their own; clear when resolved' });
    }

    const colour = t => t === 'bad'  ? 'var(--error, #ff6b6b)'
                      : t === 'warn' ? 'var(--warning, #e0a34a)'
                      : 'var(--muted)';
    nag.innerHTML = lines.map(l =>
      '<div style="font-size:10px;line-height:1.35;color:' + colour(l.tone) + ';">' +
      escapeHtml(l.text) + '</div>').join('');
    nag.style.cssText = 'margin-bottom:6px;padding:5px 7px;border-radius:4px;' +
      'border-left:3px solid ' + colour(lines.length ? lines[0].tone : 'muted') + ';' +
      'background:rgba(255,255,255,0.03);';
    nag.style.display = lines.length ? 'block' : 'none';
  }
  
  // Always show the add button if it exists
  if (addButton) {
    addButton.style.display = 'inline-block';
  }

  // Conditions now change AC, movement and attack rate in the Combat Quick
  // Reference, so every mutation has to refresh it. Placed HERE rather than at
  // the five call sites -- load, add, remove, next round, reset -- because a
  // sixth will be added eventually and would be missed. That is exactly the
  // drift that left proficiency slots stale on level-up and per-weapon attack
  // rates stale on a manual override.
  //
  // Neither of these calls back into updateConditionDisplay, so there is no
  // recursion. recalculateAll() is deliberately NOT used: it runs two dozen
  // renderers, and this fires on every duration tick.
  if (typeof renderAttacksPerRound === 'function') renderAttacksPerRound(root);
  if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);
}

function addConditionDialog(root, tab) {
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;';
  
  // escapeHtml on both the attribute and the text. Condition names are ours and
  // contain no quotes today, so this fixes no live bug -- but an unescaped value
  // in an attribute is the exact pattern that silently truncated 130-odd fields
  // before the escapeHtml sweep, and this was the last one left in this path.
  const conditionOptions = getAllConditionNames()
    .filter(name => name !== 'Healthy')
    .map(name => '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>')
    .join('');
  
  modal.innerHTML = 
    '<div style="background:var(--panel);padding:20px;border-radius:8px;min-width:320px;border:1px solid var(--border);">' +
      '<h3 style="margin-top:0;color:var(--text);">Add Condition</h3>' +
      '<label style="display:block;margin-bottom:4px;font-size:12px;color:var(--muted);">Condition</label>' +
      '<select id="condition-select" style="width:100%;margin-bottom:12px;padding:6px;border-radius:6px;background:#1a1d29;color:var(--text);border:1px solid var(--border);">' +
        '<option value="">Select condition...</option>' +
        conditionOptions +
      '</select>' +
      '<label style="display:block;margin-bottom:4px;font-size:12px;color:var(--muted);">Duration (rounds)</label>' +
      '<input type="text" id="duration-input" placeholder="e.g., 5 or leave blank" style="width:100%;margin-bottom:12px;padding:6px;border-radius:6px;background:#1a1d29;color:var(--text);border:1px solid var(--border);" />' +
      '<div style="text-align:right;display:flex;gap:8px;justify-content:flex-end;">' +
        '<button id="cancel-condition" class="ghost">Cancel</button>' +
        '<button id="add-condition-btn">Add</button>' +
      '</div>' +
    '</div>';
  
  document.body.appendChild(modal);
  
  // Wire up buttons
  modal.querySelector('#cancel-condition').onclick = () => modal.remove();
  modal.querySelector('#add-condition-btn').onclick = () => {
    const condition = modal.querySelector('#condition-select').value;
    const duration = modal.querySelector('#duration-input').value.trim();
    
    if (!condition) {
      alert('Please select a condition');
      return;
    }
    
    const conditionsList = root.querySelector('.conditions-list');
    const conditionNode = makeConditionNode(
      { condition, duration },
      () => markUnsaved(tab, true, root)
    );
    
    conditionsList.appendChild(conditionNode);
    updateConditionDisplay(root);
    markUnsaved(tab, true, root);
    modal.remove();
  };
  
  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

// Combat Round Tracker Functions
function incrementCombatRound(root, tab) {
  const roundDisplay = root.querySelector('.combat-round-display');
  if (!roundDisplay) return;
  
  let currentRound = parseInt(roundDisplay.textContent, 10) || 1;
  currentRound++;
  roundDisplay.textContent = currentRound;
  
  // Apply HP loss from conditions FIRST
  const conditionsList = root.querySelector('.conditions-list');
  let totalHPLoss = 0;
  
  if (conditionsList) {
    const conditions = Array.from(conditionsList.querySelectorAll('.condition-item'));
    
    // Calculate total HP loss this round
    conditions.forEach(item => {
      const hpLoss = parseInt(item.dataset.hpLoss || 0, 10);
      if (hpLoss > 0) {
        totalHPLoss += hpLoss;
      }
    });
    
    // Apply HP loss if any
    if (totalHPLoss > 0) {
      const currentDamage = parseInt(val(root, 'damage_taken') || 0, 10);
      const newDamage = currentDamage + totalHPLoss;
      val(root, 'damage_taken', newDamage);
      renderCurrentHP(root);
	  renderCombatQuickReference(root);
      
      // Show notification
      const maxHP = parseInt(val(root, 'hp') || 0, 10);
      const currentHP = maxHP - newDamage;
      
      if (currentHP <= 0) {
        alert(`⚠️ You have taken ${totalHPLoss} HP damage from conditions this round and are now at ${currentHP} HP!\n\nYou are dying or dead!`);
      } else if (currentHP <= maxHP * 0.25) {
        alert(`⚠️ You have taken ${totalHPLoss} HP damage from conditions this round.\n\nCurrent HP: ${currentHP}/${maxHP} (Critical!)`);
      }
    }
    
    // Decrement all condition durations
    conditions.forEach(item => {
      let duration = parseInt(item.dataset.duration, 10);
      if (!isNaN(duration) && duration > 0) {
        duration--;
        item.dataset.duration = duration.toString();
        
        if (duration === 0) {
          // Remove condition when duration hits 0
          item.remove();
        } else {
          // Update display
          const durationSpan = item.querySelector('.condition-duration');
          if (durationSpan) {
            durationSpan.textContent = `(${duration} rnds)`;
          }
        }
      }
    });
    updateConditionDisplay(root);
  }
  
  markUnsaved(tab, true, root);
}

function resetCombatRound(root, tab) {
  const roundDisplay = root.querySelector('.combat-round-display');
  if (!roundDisplay) return;
  
  roundDisplay.textContent = '1';
  markUnsaved(tab, true, root);
}

// Rest Dialog and Functions
function openRestDialog(root, tab) {
  // Check for Dying condition - block rest entirely
  const conditionsList = root.querySelector('.conditions-list');
  if (conditionsList) {
    const dyingCondition = Array.from(conditionsList.querySelectorAll('.condition-item'))
      .find(item => item.dataset.condition === 'Dying');
    
    if (dyingCondition) {
      alert('Cannot rest while Dying! You must be stabilized first.');
      return;
    }
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;';
  
  modal.innerHTML = 
    '<div style="background:var(--panel);padding:20px;border-radius:8px;min-width:400px;max-width:500px;border:1px solid var(--border);">' +
      '<h3 style="margin-top:0;color:var(--text);">💤 Rest & Recovery</h3>' +
      '<p style="font-size:12px;color:var(--muted);margin-bottom:16px;">Choose a rest duration:</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<button class="rest-option" data-rest-type="night" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">8 Hours (Night\'s Rest)</div>' +
          '<div style="font-size:11px;color:var(--muted);">No HP recovered &mdash; 2e heals per <em>day</em> of rest. Clears temporary conditions and meets the rest requirement for Study / Pray.</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="day_light" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">1 Day (Light Activity)</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover 1 HP. Travel and light work are fine; fighting is not.</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="full_bed" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">1 Day (Complete Bed Rest)</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover 3 HP. Doing nothing for an entire day.</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="week" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">7 Days (Week of Bed Rest)</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover 21 HP + CON bonus, clear temporary conditions.</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="half" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">Rest to Half HP</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover 50% of missing HP, clear temporary conditions.</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="full" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">Rest to Full HP</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover all HP, clear temporary conditions.</div>' +
        '</button>' +
      '</div>' +
      '<div style="margin-top:16px;text-align:right;">' +
        '<button id="cancel-rest" class="ghost">Cancel</button>' +
      '</div>' +
    '</div>';
  
  document.body.appendChild(modal);
  
  // Wire up rest option buttons
  modal.querySelectorAll('.rest-option').forEach(btn => {
    btn.onmouseenter = () => {
      btn.style.background = 'rgba(150,100,255,0.1)';
    };
    btn.onmouseleave = () => {
      btn.style.background = 'var(--glass)';
    };
    btn.onclick = () => {
      const restType = btn.dataset.restType;
      performRest(root, tab, restType);
      modal.remove();
    };
  });
  
  // Cancel button
  modal.querySelector('#cancel-rest').onclick = () => modal.remove();
  
  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

function performRest(root, tab, restType) {
  // Get current HP values
  const maxHP = parseInt(val(root, 'hp') || 0, 10);
  const damageTaken = parseInt(val(root, 'damage_taken') || 0, 10);
  const currentHP = maxHP - damageTaken;
  
  // Constitution hit point bonus, added ONCE to the 21 recovered over a full
  // week of bed rest -- PHB Ch.9: "For each complete week of bed rest, the
  // character can add any Constitution hit point bonus he might have to the
  // base of 21 points (3 points per day) he regained during that week."
  //
  // THIS WAS BROKEN AND SILENTLY SO. It read CON_TABLE, which does not exist
  // anywhere in the codebase, behind a `typeof CON_TABLE !== 'undefined'` guard
  // that was therefore always false -- so conMod was permanently 0 and the week
  // option delivered a flat 21 while advertising "+ CON bonus". A bare
  // CON_TABLE[con] would have thrown on the first click and been fixed years
  // ago; the guard is what hid it. Do not "defensively" guard a constant whose
  // absence is a bug rather than a possibility.
  //
  // CON_HP_BONUS is [non-warrior, warrior] and the columns diverge sharply --
  // at CON 18 a fighter has +4 where a wizard has +2. isWarriorClass() matches
  // on substring, so hb_dpaladin and demipaladin both resolve as warriors,
  // agreeing with the HP-per-level calculation in calc.js.
  const con = parseInt(val(root, 'con') || 10, 10);
  const conIsWarrior = (typeof isWarriorClass === 'function')
    ? isWarriorClass(val(root, 'clazz') || '')
    : false;
  const conRow = (typeof CON_HP_BONUS !== 'undefined') ? CON_HP_BONUS[con] : null;
  const conMod = conRow ? (conIsWarrior ? conRow[1] : conRow[0]) : 0;
  
  // Calculate HP recovery based on rest type
  let hpRecovered = 0;
  let rounds = 0;
    
  switch(restType) {
    // PHB Ch.9 gives exactly TWO natural healing rates, and both are per DAY:
    // "1 hit point per day of rest", where rest is low activity -- "nothing more
    // strenuous than riding a horse or traveling from one place to another" --
    // and 3 per day for "complete bed rest (doing nothing for an entire day)".
    //
    // There is no eight-hour healing rule in 2e. A night's sleep followed by a
    // day of adventuring is not rest at all: "Fighting, running in fear... and
    // any other strenuous activity prevents resting." So this tier heals
    // NOTHING. It exists because eight hours is the PHB Ch.7 prerequisite for
    // studying or praying, which is now a separate button.
    case 'night':
      hpRecovered = 0;
      rounds = 480; // 8 hours of 1-minute rounds
      break;
    case 'day_light':
      hpRecovered = 1;
      rounds = 1440; // 24 hours
      break;
    case 'full_bed':
      hpRecovered = 3;
      rounds = 1440; // 24 hours
      break;
    case 'week':
      hpRecovered = 21 + conMod;
      rounds = 10080; // 7 days × 24 hours × 60 minutes
      break;
    case 'half':
      const missingHP = damageTaken;
      hpRecovered = Math.floor(missingHP / 2);
      rounds = 0; // Instant for custom rest
      break;
    case 'full':
      hpRecovered = damageTaken; // Recover all missing HP
      rounds = 0; // Instant for custom rest
      break;
  }
  
  // PHB Ch.9, natural healing: "the character is assumed to be getting adequate
  // food, water, and sleep. If these are lacking, the character does not regain
  // any hit points that day."
  //
  // Applies to EVERY tier including Rest to Half/Full -- those are natural rest
  // compressed for convenience, not a different kind of recovery. Magical
  // healing is a separate section of the chapter and must never consult this.
  //
  // Zeroed AFTER the switch rather than skipping it, so `rounds` still carries
  // its value: a poisoned character bleeding 1 HP per round over a week loses
  // that HP whether or not he is also starving. Being unable to heal does not
  // make you immune to damage.
  const healingBlocker = (typeof getNaturalHealingBlocker === 'function')
    ? getNaturalHealingBlocker(root) : null;
  if (healingBlocker) hpRecovered = 0;

  // Calculate HP loss from conditions during rest
  let totalHPLoss = 0;
  const conditionsList = root.querySelector('.conditions-list');
  if (conditionsList && rounds > 0) {
    const conditions = Array.from(conditionsList.querySelectorAll('.condition-item'));
    conditions.forEach(item => {
      const hpLoss = parseInt(item.dataset.hpLoss || 0, 10);
      if (hpLoss > 0) {
        totalHPLoss += hpLoss * rounds;
      }
    });
  }
  
  // Calculate net HP change
  const netHPChange = hpRecovered - totalHPLoss;
  const finalHP = currentHP + netHPChange;
  
  // Check if rest would kill the character
  if (finalHP <= 0) {
    const warningMsg = 
      `WARNING: Resting for this duration will result in death!\n\n` +
      `Current HP: ${currentHP}\n` +
      `HP Recovered: +${hpRecovered}\n` +
      `HP Lost from conditions: -${totalHPLoss} (over ${rounds} rounds)\n` +
      `Net Result: ${finalHP} HP\n\n` +
      `You will die from your conditions during rest. Seek medical treatment first!`;
    
    alert(warningMsg);
    return;
  }
  
  // Perform the rest
  const newDamageTaken = Math.max(0, damageTaken - netHPChange);
  val(root, 'damage_taken', newDamageTaken);
  renderCurrentHP(root);
  
  // Spell recovery deliberately does NOT happen here -- it lives behind the
  // Study / Pray button. PHB Ch.7: "The wizard must have a clear head gained
  // from a restful night's sleep AND THEN has to spend time studying his spell
  // books. The amount of study time needed is 10 minutes per level of the spell
  // being memorized." Rest is the prerequisite, not the recovery.
  //
  // Two bugs went out with this block. It hand-rolled the DOM changes that
  // setMemSpellState() already performs, so the two could drift; and it cleared
  // only .spell-cast, never .spell-lost -- so a spell disrupted mid-casting
  // stayed lost through any amount of rest, even though Ch.7 treats both as
  // simply needing to be re-studied.
  
  // Remove temporary conditions
  if (conditionsList) {
    const conditions = Array.from(conditionsList.querySelectorAll('.condition-item'));
    const temporaryConditions = [
      'Charmed', 'Held', 'Stunned', 'Unconscious', 'Blinded', 'Deafened',
      'Slowed', 'Hasted', 'Fatigued', 'Frightened', 'Confused', 'Invisible', 'Paralyzed'
    ];
    
    conditions.forEach(item => {
      const conditionName = item.dataset.condition;
      
      // Remove if temporary
      if (temporaryConditions.includes(conditionName)) {
        item.remove();
      }
      
      // A week of bed rest deliberately does NOT cure disease. That behaviour
      // was here and was UNSOURCED: Chapter 9 mentions disease nowhere across
      // all 25 pages, and disease is a DMG topic in 2e. The PHB touches it only
      // via paladin immunity and the cure disease spell. Removed rather than
      // left in place, because plausible-sounding invented mechanics are harder
      // to catch later than obviously wrong ones.
    });
    
    updateConditionDisplay(root);
  }
  
  // Reset combat round to 1
  const roundDisplay = root.querySelector('.combat-round-display');
  if (roundDisplay) {
    roundDisplay.textContent = '1';
  }
  
  // Update Combat Quick Reference
  renderCombatQuickReference(root);
  
  // Auto-save the character after resting
  const data = collectSheet(root);
  const currentTypedName = (data.meta.name && data.meta.name.trim()) || 'Unnamed';
  const key = getTabSaveKey(tab) || currentTypedName;
  const map = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}');
  map[key] = data;
  if(!writeCharacterMap(map, 'auto-save after resting')) return;
  
  // Clear unsaved status
  markUnsaved(tab, false, root);
  showSidebarAutosaved(root);
  
  // Report the CAPPED ACTUAL, not the raw arithmetic. newDamageTaken is already
  // clamped with Math.max(0, ...), but the old message printed hpRecovered and
  // currentHP + netHPChange unclamped -- so a week's rest that overhealed would
  // claim "30 -> 55" on a character whose maximum is 49. Deriving both numbers
  // from newDamageTaken means the summary cannot disagree with the sheet.
  const actualRecovered = damageTaken - newDamageTaken;
  const newHP = maxHP - newDamageTaken;

  const restTitles = {
    night:     "Night's rest",
    day_light: 'Day of light activity',
    full_bed:  'Day of complete bed rest',
    week:      'Week of bed rest',
    half:      'Rest to half HP',
    full:      'Rest to full HP'
  };

  const rows = [];

  // PHB Ch.9: "For each complete week of bed rest, the character can add any
  // Constitution hit point bonus he might have to the base of 21 points (3
  // points per day)." Itemised so the Constitution column in use is visible --
  // a warrior and a wizard at the same score get different numbers, and a
  // silently wrong column is exactly what went unnoticed here for years.
  if (restType === 'week') {
    rows.push({ label: 'Base recovery', value: '21', note: '3 HP x 7 days' });
    if (conMod) {
      rows.push({
        label: 'Constitution bonus',
        value: (conMod > 0 ? '+' : '') + conMod,
        note: (conIsWarrior ? 'warrior' : 'non-warrior') + ' column, CON ' + con,
        tone: conMod > 0 ? 'good' : 'bad'
      });
    }
  }

  // Named explicitly rather than leaving a bare "Recovered 0". A player who
  // rests a week and gets nothing will assume the tool is broken unless it says
  // which condition did it -- and the fix is one click away in the tracker.
  if (healingBlocker) {
    rows.push({
      label: healingBlocker.name,
      value: 'no HP recovered',
      note: 'PHB Ch.9 -- natural healing only; magical healing still works',
      tone: 'bad'
    });
  }

  if (totalHPLoss > 0) {
    rows.push({ label: 'Lost to conditions', value: '-' + totalHPLoss, tone: 'bad' });
  }

  if (actualRecovered < netHPChange) {
    rows.push({
      label: 'Capped at maximum HP',
      value: '-' + (netHPChange - actualRecovered),
      tone: 'bad'
    });
  }

  rows.push({ label: 'Recovered', value: String(actualRecovered),
              tone: actualRecovered > 0 ? 'good' : undefined, strong: true });
  rows.push({ label: 'Hit points', value: currentHP + ' \u2192 ' + newHP, strong: true });

  // Spell recovery is NOT part of rest. PHB Ch.7 requires a restful night's
  // sleep AND 10 minutes of study per spell level -- rest is only the
  // prerequisite. Claiming "Spells regained" here skipped the study entirely.
  const restNotes = ['Temporary conditions cleared'];
  // Diseased is NOT removed by rest. See the removal block above -- unsourced.

  showRestSummary(restTitles[restType] || 'Rest complete', rows, restNotes);
}

// Styled rest summary. Takes ROWS rather than a pre-baked string, deliberately:
// the spell-recovery split will change what rest reports, and the conditions
// work will add lines like "Malnourished -- no HP recovered". A helper that
// takes data survives both; one that formats a message does not.
//   rows:  { label, value, note?, tone?: 'good'|'bad', strong?: true }
//   notes: plain strings, listed underneath with a tick
function showRestSummary(title, rows, notes) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);' +
    'display:flex;justify-content:center;align-items:center;z-index:10000;';

  const tone = t => t === 'good' ? 'var(--success, #4ade80)'
                  : t === 'bad'  ? 'var(--error, #ff6b6b)'
                  : 'var(--text)';

  const rowHtml = (rows || []).map(r =>
    '<div style="display:flex;justify-content:space-between;align-items:baseline;' +
      'gap:12px;padding:3px 0;' +
      (r.strong ? 'border-top:1px solid var(--border);margin-top:4px;padding-top:6px;' : '') +
    '">' +
      '<span style="font-size:12px;color:' +
        (r.strong ? 'var(--text);font-weight:600' : 'var(--muted)') + ';">' +
        escapeHtml(r.label) +
        (r.note ? ' <span style="font-size:10px;color:var(--muted);">(' +
                  escapeHtml(r.note) + ')</span>' : '') +
      '</span>' +
      '<span style="font-size:13px;font-weight:600;white-space:nowrap;color:' +
        tone(r.tone) + ';">' + escapeHtml(r.value) + '</span>' +
    '</div>'
  ).join('');

  const noteHtml = (notes && notes.length)
    ? '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">' +
        notes.map(n => '<div style="font-size:11px;color:var(--muted);padding:1px 0;">\u2713 ' +
          escapeHtml(n) + '</div>').join('') +
      '</div>'
    : '';

  modal.innerHTML =
    '<div style="background:var(--panel);padding:20px;border-radius:8px;min-width:340px;' +
      'max-width:440px;border:1px solid var(--border);">' +
      '<h3 style="margin-top:0;color:var(--text);">\uD83D\uDCA4 ' + escapeHtml(title) + '</h3>' +
      rowHtml + noteHtml +
      '<div style="margin-top:16px;text-align:right;">' +
        '<button id="close-rest-summary" class="ghost">Close</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);
  modal.querySelector('#close-rest-summary').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

// === Spell Recovery (PHB Ch.7) ===
//
// Separate from rest by design. "The wizard must have a clear head gained from
// a restful night's sleep AND THEN has to spend time studying his spell books.
// The amount of study time needed is 10 minutes per level of the spell being
// memorized." Rest is the prerequisite; study is the recovery.
//
// PARTIAL RECOVERY IS SUPPORTED, and that is the RAW reading. Study time is
// stated PER SPELL -- "10 minutes per level of THE SPELL being memorized" -- and
// the chapter's own advice that a wizard may "cast a spell just to cleanse his
// mind for another spell" only works if slots are filled individually. The book
// never requires an all-or-nothing session, so neither does this.
//
// Priests are identical: "The conditions for praying are identical to those
// needed for the wizard's studying." Only the wording changes.
//
// Both 'cast' and 'lost' spells are recoverable -- each simply needs re-studying.
// The old rest code cleared only 'cast', stranding disrupted spells forever.
const STUDY_MINUTES_PER_LEVEL = 10;

function formatStudyTime(mins) {
  if (mins < 60) return mins + ' minute' + (mins === 1 ? '' : 's');
  const h = Math.floor(mins / 60), r = mins % 60;
  return h + ' hour' + (h === 1 ? '' : 's') + (r ? ' ' + r + ' min' : '');
}

function openStudyModal(root, tab) {
  const items = Array.from(root.querySelectorAll('.memspells-list .item'));
  const spent = items.filter(el =>
    typeof getMemSpellState === 'function' && getMemSpellState(el) !== 'available');

  const clazz = (val(root, 'clazz') || '').toLowerCase();
  const isPriest = (typeof isPriestClass === 'function')
    ? isPriestClass(clazz) : /cleric|druid|priest/.test(clazz);
  const verb = isPriest ? 'Pray' : 'Study';
  const icon = isPriest ? '\uD83D\uDE4F' : '\uD83D\uDCD6';

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);' +
    'display:flex;justify-content:center;align-items:center;z-index:10000;';
  const close = () => modal.remove();

  if (!spent.length) {
    modal.innerHTML =
      '<div style="background:var(--panel);padding:20px;border-radius:8px;min-width:320px;' +
        'max-width:420px;border:1px solid var(--border);">' +
        '<h3 style="margin-top:0;color:var(--text);">' + icon + ' ' + verb + '</h3>' +
        '<p style="font-size:12px;color:var(--muted);">Every memorized spell is still ' +
        'available. Nothing to recover.</p>' +
        '<div style="margin-top:16px;text-align:right;">' +
          '<button id="study-close" class="ghost">Close</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('#study-close').onclick = close;
    modal.onclick = e => { if (e.target === modal) close(); };
    return;
  }

  const rows = spent.map((el, i) => {
    const name = (el.querySelector('.title') || {}).value || 'Unnamed spell';
    const lvl = Math.max(1, parseInt((el.querySelector('.level') || {}).value, 10) || 1);
    return { el: el, idx: i, name: name, lvl: lvl,
             state: getMemSpellState(el), mins: lvl * STUDY_MINUTES_PER_LEVEL };
  }).sort((a, b) => a.lvl - b.lvl || a.name.localeCompare(b.name));

  const rowHtml = rows.map(r =>
    '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;">' +
      '<input type="checkbox" class="study-pick" data-idx="' + r.idx + '" checked>' +
      '<span style="flex:1;font-size:12px;color:var(--text);">' + escapeHtml(r.name) +
        ' <span style="color:var(--muted);font-size:10px;">L' + r.lvl + '</span> ' +
        (r.state === 'lost'
          ? '<span style="color:var(--error, #ff6b6b);font-size:10px;">disrupted</span>'
          : '<span style="color:var(--muted);font-size:10px;">cast</span>') +
      '</span>' +
      '<span style="font-size:11px;color:var(--muted);white-space:nowrap;">' + r.mins + ' min</span>' +
    '</label>').join('');

  modal.innerHTML =
    '<div style="background:var(--panel);padding:20px;border-radius:8px;min-width:380px;' +
      'max-width:480px;max-height:80vh;overflow:auto;border:1px solid var(--border);">' +
      '<h3 style="margin-top:0;color:var(--text);">' + icon + ' ' + verb + '</h3>' +
      '<p style="font-size:11px;color:var(--muted);margin:0 0 10px 0;">PHB Ch.7: after a ' +
        'restful night\u2019s sleep, ' + (isPriest ? 'prayer' : 'study') + ' takes 10 minutes ' +
        'per spell level. Recover as many or as few as you like.</p>' +
      '<div style="border-top:1px solid var(--border);padding-top:6px;">' + rowHtml + '</div>' +
      '<div id="study-total" style="margin-top:10px;padding-top:8px;' +
        'border-top:1px solid var(--border);display:flex;justify-content:space-between;' +
        'font-size:12px;font-weight:600;color:var(--text);"></div>' +
      '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">' +
        '<button id="study-cancel" class="ghost">Cancel</button>' +
        '<button id="study-go">' + verb + '</button></div></div>';

  document.body.appendChild(modal);

  const picks = () => Array.from(modal.querySelectorAll('.study-pick'));
  const chosenRows = () => picks().filter(c => c.checked)
    .map(c => rows.filter(r => r.idx === parseInt(c.dataset.idx, 10))[0]);

  const refresh = () => {
    const chosen = chosenRows();
    const mins = chosen.reduce((s, r) => s + r.mins, 0);
    modal.querySelector('#study-total').innerHTML =
      '<span>' + chosen.length + ' spell' + (chosen.length === 1 ? '' : 's') + '</span>' +
      '<span>' + (mins ? formatStudyTime(mins) : '\u2014') + '</span>';
    modal.querySelector('#study-go').disabled = (chosen.length === 0);
  };
  picks().forEach(c => { c.onchange = refresh; });
  refresh();

  modal.querySelector('#study-cancel').onclick = close;
  modal.onclick = e => { if (e.target === modal) close(); };

  modal.querySelector('#study-go').onclick = () => {
    const chosen = chosenRows();
    const mins = chosen.reduce((s, r) => s + r.mins, 0);
    chosen.forEach(r => setMemSpellState(r.el, 'available'));
    if (typeof renderMemorizedSpellStatus === 'function') renderMemorizedSpellStatus(root);
    close();

    // Autosave, matching performRest -- these modals commit immediately rather
    // than leaving the sheet dirty, so a closed tab cannot lose the recovery.
    const data = collectSheet(root);
    const key = getTabSaveKey(tab) ||
                ((data.meta.name && data.meta.name.trim()) || 'Unnamed');
    const map = JSON.parse(localStorage.getItem(CHAR_MAP_KEY) || '{}');
    map[key] = data;
    if (writeCharacterMap(map, 'auto-save after studying')) {
      markUnsaved(tab, false, root);
      showSidebarAutosaved(root);
    }

    showRestSummary(isPriest ? 'Prayer complete' : 'Study complete', [
      { label: 'Spells recovered', value: String(chosen.length), tone: 'good', strong: true },
      { label: 'Time spent', value: formatStudyTime(mins), strong: true }
    ], ['Requires a restful night\u2019s sleep beforehand (PHB Ch.7)']);
  };
}

// ===== NOTES TAB ENTRY MANAGEMENT =====

// Create entry node for Session Log
function makeSessionLogEntry(data = {}, onChange) {
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  const isEditing = data._isEditing !== false; // Default to editing for new entries
  
  if (isEditing) {
    el.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <div style="flex:1;">
          <label style="font-size:11px;color:var(--muted);">Date</label>
          <input class="entry-date" type="text" value="${escapeHtml(data.date || '')}" style="width:100%;" placeholder="e.g., Jan 15, 2025">
        </div>
        <div style="flex:1;">
          <label style="font-size:11px;color:var(--muted);">XP Gained</label>
          <input class="entry-xp" type="text" value="${escapeHtml(data.xp || '')}" style="width:100%;" placeholder="e.g., 1000">
        </div>
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Events</label>
        <textarea class="entry-events" style="width:100%;min-height:60px;resize:vertical;" placeholder="What happened this session?">${escapeHtml(data.events || '')}</textarea>
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Loot</label>
        <textarea class="entry-loot" style="width:100%;min-height:60px;resize:vertical;" placeholder="What treasure was found?">${escapeHtml(data.loot || '')}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="save-entry">Save</button>
        <button class="cancel-entry" class="ghost">Cancel</button>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-weight:600;color:var(--accent-light);">${escapeHtml(data.date || 'No Date')}</div>
          <div style="font-size:11px;color:var(--muted);">XP: ${escapeHtml(data.xp || 'N/A')}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="margin-bottom:4px;">
        <strong style="font-size:11px;color:var(--muted);">Events:</strong>
        <div style="white-space:pre-wrap;">${escapeHtml(data.events || 'None')}</div>
      </div>
      <div>
        <strong style="font-size:11px;color:var(--muted);">Loot:</strong>
        <div style="white-space:pre-wrap;">${escapeHtml(data.loot || 'None')}</div>
      </div>
    `;
  }
  
  // Store data on element
  el._entryData = data;
  
  // Wire up buttons
  if (isEditing) {
    el.querySelector('.save-entry').onclick = () => {
      const newData = {
        date: el.querySelector('.entry-date').value,
        xp: el.querySelector('.entry-xp').value,
        events: el.querySelector('.entry-events').value,
        loot: el.querySelector('.entry-loot').value,
        _isEditing: false
      };
      el.replaceWith(makeSessionLogEntry(newData, onChange));
      onChange && onChange();
    };
    
    el.querySelector('.cancel-entry').onclick = () => {
      if (!data.date && !data.xp && !data.events && !data.loot) {
        el.remove(); // Remove if it's a new empty entry
      } else {
        data._isEditing = false;
        el.replaceWith(makeSessionLogEntry(data, onChange));
      }
    };
    
    // Auto-expand textareas
    el.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', () => autoExpand(ta));
      autoExpand(ta);
    });
  } else {
    el.querySelector('.edit-entry').onclick = () => {
      data._isEditing = true;
      el.replaceWith(makeSessionLogEntry(data, onChange));
    };
    
    el.querySelector('.delete-entry').onclick = () => {
      if (confirm('Delete this entry?')) {
        el.remove();
        onChange && onChange();
      }
    };
  }
  
  return el;
}

// Create entry node for Quest Journal
function makeQuestJournalEntry(data = {}, onChange) {
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  const isEditing = data._isEditing !== false;
  
  if (isEditing) {
    el.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <div style="flex:2;">
          <label style="font-size:11px;color:var(--muted);">Quest Name</label>
          <input class="entry-name" type="text" value="${escapeHtml(data.name || '')}" style="width:100%;" placeholder="Quest title">
        </div>
        <div style="flex:1;">
          <label style="font-size:11px;color:var(--muted);">Status</label>
          <select class="entry-status" style="width:100%;padding:8px;border-radius:6px;background:#1a1d29;color:inherit;border:1px solid var(--border);">
            <option value="Active" ${data.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Completed" ${data.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Objective</label>
        <input class="entry-objective" type="text" value="${escapeHtml(data.objective || '')}" style="width:100%;" placeholder="What needs to be done?">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Reward</label>
        <input class="entry-reward" type="text" value="${escapeHtml(data.reward || '')}" style="width:100%;" placeholder="What's the reward?">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Notes</label>
        <textarea class="entry-notes" style="width:100%;min-height:60px;resize:vertical;" placeholder="Additional details...">${escapeHtml(data.notes || '')}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="save-entry">Save</button>
        <button class="cancel-entry" class="ghost">Cancel</button>
      </div>
    `;
  } else {
    const statusColor = data.status === 'Completed' ? 'var(--muted)' : 'var(--accent-light)';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-weight:600;color:${statusColor};">${escapeHtml(data.name || 'Unnamed Quest')}</div>
          <div style="font-size:11px;color:var(--muted);">[${escapeHtml(data.status || 'Active')}]</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="margin-bottom:4px;">
        <strong style="font-size:11px;color:var(--muted);">Objective:</strong> ${escapeHtml(data.objective || 'None')}
      </div>
      <div style="margin-bottom:4px;">
        <strong style="font-size:11px;color:var(--muted);">Reward:</strong> ${escapeHtml(data.reward || 'None')}
      </div>
      ${data.notes ? `<div><strong style="font-size:11px;color:var(--muted);">Notes:</strong><div style="white-space:pre-wrap;">${escapeHtml(data.notes)}</div></div>` : ''}
    `;
  }
  
  el._entryData = data;
  
  if (isEditing) {
    el.querySelector('.save-entry').onclick = () => {
      const newData = {
        name: el.querySelector('.entry-name').value,
        status: el.querySelector('.entry-status').value,
        objective: el.querySelector('.entry-objective').value,
        reward: el.querySelector('.entry-reward').value,
        notes: el.querySelector('.entry-notes').value,
        _isEditing: false
      };
      el.replaceWith(makeQuestJournalEntry(newData, onChange));
      onChange && onChange();
    };
    
    el.querySelector('.cancel-entry').onclick = () => {
      if (!data.name && !data.objective) {
        el.remove();
      } else {
        data._isEditing = false;
        el.replaceWith(makeQuestJournalEntry(data, onChange));
      }
    };
    
    el.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', () => autoExpand(ta));
      autoExpand(ta);
    });
  } else {
    el.querySelector('.edit-entry').onclick = () => {
      data._isEditing = true;
      el.replaceWith(makeQuestJournalEntry(data, onChange));
    };
    
    el.querySelector('.delete-entry').onclick = () => {
      if (confirm('Delete this quest?')) {
        el.remove();
        onChange && onChange();
      }
    };
  }
  
  return el;
}

// Create entry node for NPCs
function makeNPCEntry(data = {}, onChange) {
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  const isEditing = data._isEditing !== false;
  
  if (isEditing) {
    el.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <div style="flex:2;">
          <label style="font-size:11px;color:var(--muted);">NPC Name</label>
          <input class="entry-name" type="text" value="${escapeHtml(data.name || '')}" style="width:100%;" placeholder="Character name">
        </div>
        <div style="flex:1;">
          <label style="font-size:11px;color:var(--muted);">Type</label>
          <select class="entry-type" style="width:100%;padding:8px;border-radius:6px;background:#1a1d29;color:inherit;border:1px solid var(--border);">
            <option value="Ally" ${data.type === 'Ally' ? 'selected' : ''}>Ally</option>
            <option value="Enemy" ${data.type === 'Enemy' ? 'selected' : ''}>Enemy</option>
            <option value="Contact" ${data.type === 'Contact' ? 'selected' : ''}>Contact</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Relationship / Notes</label>
        <textarea class="entry-relationship" style="width:100%;min-height:60px;resize:vertical;" placeholder="How do you know them? What's your relationship?">${escapeHtml(data.relationship || '')}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="save-entry">Save</button>
        <button class="cancel-entry" class="ghost">Cancel</button>
      </div>
    `;
  } else {
    const typeColors = {
      'Ally': '#4ade80',
      'Enemy': '#f87171',
      'Contact': '#fbbf24'
    };
    const typeColor = typeColors[data.type] || 'var(--muted)';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-weight:600;color:var(--accent-light);">${escapeHtml(data.name || 'Unnamed NPC')}</div>
          <div style="font-size:11px;color:${typeColor};">[${escapeHtml(data.type || 'Contact')}]</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="white-space:pre-wrap;">${escapeHtml(data.relationship || 'No notes')}</div>
    `;
  }
  
  el._entryData = data;
  
  if (isEditing) {
    el.querySelector('.save-entry').onclick = () => {
      const newData = {
        name: el.querySelector('.entry-name').value,
        type: el.querySelector('.entry-type').value,
        relationship: el.querySelector('.entry-relationship').value,
        _isEditing: false
      };
      el.replaceWith(makeNPCEntry(newData, onChange));
      onChange && onChange();
    };
    
    el.querySelector('.cancel-entry').onclick = () => {
      if (!data.name && !data.relationship) {
        el.remove();
      } else {
        data._isEditing = false;
        el.replaceWith(makeNPCEntry(data, onChange));
      }
    };
    
    el.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', () => autoExpand(ta));
      autoExpand(ta);
    });
  } else {
    el.querySelector('.edit-entry').onclick = () => {
      data._isEditing = true;
      el.replaceWith(makeNPCEntry(data, onChange));
    };
    
    el.querySelector('.delete-entry').onclick = () => {
      if (confirm('Delete this NPC?')) {
        el.remove();
        onChange && onChange();
      }
    };
  }
  
  return el;
}

// Create entry node for Locations
function makeLocationEntry(data = {}, onChange) {
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  const isEditing = data._isEditing !== false;
  
  if (isEditing) {
    el.innerHTML = `
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Location Name</label>
        <input class="entry-name" type="text" value="${escapeHtml(data.name || '')}" style="width:100%;" placeholder="Place name">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Description</label>
        <input class="entry-description" type="text" value="${escapeHtml(data.description || '')}" style="width:100%;" placeholder="Brief description">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Key Details</label>
        <textarea class="entry-details" style="width:100%;min-height:60px;resize:vertical;" placeholder="Important information, NPCs, dangers, etc.">${escapeHtml(data.details || '')}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="save-entry">Save</button>
        <button class="cancel-entry" class="ghost">Cancel</button>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-weight:600;color:var(--accent-light);">${escapeHtml(data.name || 'Unnamed Location')}</div>
          <div style="font-size:11px;color:var(--muted);">${escapeHtml(data.description || '')}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      ${data.details ? `<div style="white-space:pre-wrap;">${escapeHtml(data.details)}</div>` : ''}
    `;
  }
  
  el._entryData = data;
  
  if (isEditing) {
    el.querySelector('.save-entry').onclick = () => {
      const newData = {
        name: el.querySelector('.entry-name').value,
        description: el.querySelector('.entry-description').value,
        details: el.querySelector('.entry-details').value,
        _isEditing: false
      };
      el.replaceWith(makeLocationEntry(newData, onChange));
      onChange && onChange();
    };
    
    el.querySelector('.cancel-entry').onclick = () => {
      if (!data.name && !data.details) {
        el.remove();
      } else {
        data._isEditing = false;
        el.replaceWith(makeLocationEntry(data, onChange));
      }
    };
    
    el.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', () => autoExpand(ta));
      autoExpand(ta);
    });
  } else {
    el.querySelector('.edit-entry').onclick = () => {
      data._isEditing = true;
      el.replaceWith(makeLocationEntry(data, onChange));
    };
    
    el.querySelector('.delete-entry').onclick = () => {
      if (confirm('Delete this location?')) {
        el.remove();
        onChange && onChange();
      }
    };
  }
  
  return el;
}

// Create entry node for Character Journal
function makeCharacterJournalEntry(data = {}, onChange) {
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  const isEditing = data._isEditing !== false;
  
  if (isEditing) {
    el.innerHTML = `
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Entry Title / Date</label>
        <input class="entry-title" type="text" value="${escapeHtml(data.title || '')}" style="width:100%;" placeholder="e.g., 'Reflections on our Quest' or 'Jan 15, 2025'">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Journal Entry</label>
        <textarea class="entry-content" style="width:100%;min-height:80px;resize:vertical;" placeholder="Your character's thoughts, feelings, goals...">${escapeHtml(data.content || '')}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="save-entry">Save</button>
        <button class="cancel-entry" class="ghost">Cancel</button>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-weight:600;color:var(--accent-light);">${escapeHtml(data.title || 'Untitled Entry')}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="white-space:pre-wrap;">${escapeHtml(data.content || 'No content')}</div>
    `;
  }
  
  el._entryData = data;
  
  if (isEditing) {
    el.querySelector('.save-entry').onclick = () => {
      const newData = {
        title: el.querySelector('.entry-title').value,
        content: el.querySelector('.entry-content').value,
        _isEditing: false
      };
      el.replaceWith(makeCharacterJournalEntry(newData, onChange));
      onChange && onChange();
    };
    
    el.querySelector('.cancel-entry').onclick = () => {
      if (!data.title && !data.content) {
        el.remove();
      } else {
        data._isEditing = false;
        el.replaceWith(makeCharacterJournalEntry(data, onChange));
      }
    };
    
    el.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', () => autoExpand(ta));
      autoExpand(ta);
    });
  } else {
    el.querySelector('.edit-entry').onclick = () => {
      data._isEditing = true;
      el.replaceWith(makeCharacterJournalEntry(data, onChange));
    };
    
    el.querySelector('.delete-entry').onclick = () => {
      if (confirm('Delete this journal entry?')) {
        el.remove();
        onChange && onChange();
      }
    };
  }
  
  return el;
}

// ===== Bootstrap the default tab =====
(function init(){
  // The inline script in index.html sets the attributes before the stylesheet
  // loads, to avoid a flash -- but it cannot validate them, because the
  // stylesheet is not parsed yet. This is the first chance to check, and it
  // also rewrites localStorage so a bad value is corrected once rather than
  // every load.
  const pref = readThemePref();
  applyTheme(pref.theme || themeFallback(), pref.mode || 'dark');

  const firstContainer = document.querySelector('.tab-content.active .sheet-container');  firstContainer.innerHTML = SHEET_HTML;

  const defaultTab = document.querySelector('.tab[data-id="default"]');
  if(!defaultTab.querySelector('.label')){
    const text = defaultTab.textContent.replace('×','').trim() || 'Character 1';
    defaultTab.innerHTML = '<span class="label">' + text + '</span> <span class="close">×</span>';
  }

  bindSheet(firstContainer, defaultTab);

  // The default tab is built HERE, not by newTab, so neither of the other two
  // render-flag paths reaches it. Without this line the tab every user starts in
  // could never autosave -- a data-loss bug introduced by the data-loss fix.
  // Blank like newTab's else branch: its lists are empty, not missing.
  firstContainer._renderComplete = true;

  setDefaultTabHandlers(defaultTab);

  // Ensure a clean start
  hideSidebarMessage(firstContainer);

  // KV Sync — ensure token exists, pull on load if enabled
  const _kvCfgInit = getKvConfig();
  saveKvConfig(_kvCfgInit);
  if (_kvCfgInit.kvEnabled && _kvCfgInit.workerUrl) {
    kvPull(false).then(added => {
      if (added > 0) console.log(`[KV] Pulled ${added} character(s) on load.`);
    });
  }
})();

// KV Sync — flush pending push when tab is hidden or closed
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && _kvPushTimer) {
    clearTimeout(_kvPushTimer);
    _kvPushTimer = null;
    kvPush();
  }
});
window.addEventListener('pagehide', () => {
  if (_kvPushTimer) {
    clearTimeout(_kvPushTimer);
    _kvPushTimer = null;
    kvPush();
  }
});

// ===== Multiple Spellbooks Management =====

// Generate unique ID for spellbooks
function generateSpellbookId() {
  return 'spellbook-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Get spellbooks data structure from root
function getSpellbooksData(root) {
  if (!root._spellbooksData) {
    root._spellbooksData = {
      spellbooks: [{
        id: generateSpellbookId(),
        name: 'Primary Spellbook',
        spells: []
      }],
      activeSpellbookId: null
    };
    root._spellbooksData.activeSpellbookId = root._spellbooksData.spellbooks[0].id;
  }
  return root._spellbooksData;
}

// Set spellbooks data on root
function setSpellbooksData(root, data) {
  root._spellbooksData = data;
}

// Get active spellbook
function getActiveSpellbook(root) {
  const data = getSpellbooksData(root);
  return data.spellbooks.find(sb => sb.id === data.activeSpellbookId) || data.spellbooks[0];
}

// Set active spellbook
function setActiveSpellbook(root, spellbookId) {
  const data = getSpellbooksData(root);
  data.activeSpellbookId = spellbookId;
  renderSpellbookTabs(root);
  loadSpellbookSpells(root, spellbookId);
  
  // Scroll the active tab into view
  setTimeout(() => {
    const activeTab = root.querySelector('.spellbook-tab.active');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, 100);
}

// Sync spellbook list from UI back to data structure
function syncSpellbookToData(root) {
  const data = getSpellbooksData(root);
  const activeSpellbook = getActiveSpellbook(root);
  
  if (!activeSpellbook) return;
  
  const spellbookList = root.querySelector('.spellbook-list');
  if (!spellbookList) return;
  
  // Collect spells from UI
  const spells = Array.from(spellbookList.querySelectorAll('.item')).map(node => ({
    name: node.querySelector('.title')?.value || '',
    level: node.querySelector('.level')?.value || '',
    schoolSphere: (node._spellData && node._spellData.schoolSphere) || '',
    castTime: (node._spellData && node._spellData.castTime) || '',
    range: (node._spellData && node._spellData.range) || '',
    duration: (node._spellData && node._spellData.duration) || '',
    components: (node._spellData && node._spellData.components) || '',
    save: (node._spellData && node._spellData.save) || '',
    description: (node._spellData && node._spellData.description) || '',
    notes: (node._spellData && node._spellData.notes) || '',
    freeSpell: !!(node._spellData && node._spellData.freeSpell)
  }));
  
  activeSpellbook.spells = spells;

  // Refresh specialist free-spell checkboxes + earned/used counts on every sync.
  if (typeof renderSpecialistSpellNotes === 'function') renderSpecialistSpellNotes(root);
  // Spells-known counter: syncSpellbookToData is the central hook for every
  // add / edit / remove path, so one call here covers them all.
  if (typeof renderKnownSpellStatus === 'function') renderKnownSpellStatus(root);
}

// Load spells for a specific spellbook into UI
function loadSpellbookSpells(root, spellbookId) {
  const data = getSpellbooksData(root);
  const spellbook = data.spellbooks.find(sb => sb.id === spellbookId);
  
  if (!spellbook) return;
  
  const spellbookList = root.querySelector('.spellbook-list');
  if (!spellbookList) return;
  
  spellbookList.innerHTML = '';
  
  const tab = document.querySelector('.tab.active');
  spellbook.spells.forEach(spell => {
    const node = makeSpellbookNode(spell, () => {
      markUnsaved(tab, true, root);
      syncSpellbookToData(root);
    });
    spellbookList.appendChild(node);
  });
  
  sortSpellbook(root);
  
  // Apply current filter
  const filter = root.querySelector('.spellbook-level-filter');
  if (filter) {
    filterSpellbook(root, filter.value);
  }

  // Refresh specialist free-spell checkboxes + used count for the loaded book.
  if (typeof renderSpecialistSpellNotes === 'function') renderSpecialistSpellNotes(root);
  if (typeof renderKnownSpellStatus === 'function') renderKnownSpellStatus(root);
}

// Create a single spellbook tab element
function createSpellbookTab(root, spellbook, index) {
  const data = getSpellbooksData(root);
  const isActive = spellbook.id === data.activeSpellbookId;
  
  const tab = document.createElement('div');
  tab.className = 'spellbook-tab' + (isActive ? ' active' : '');
  tab.dataset.spellbookId = spellbook.id;
  tab.style.cssText = `
    padding: 6px 12px;
    background: ${isActive ? 'var(--accent)' : 'var(--glass)'};
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    min-width: 120px;
    transition: all 0.2s ease;
  `;
  
  // Tab name (editable on double-click)
  const nameSpan = document.createElement('span');
  nameSpan.className = 'spellbook-tab-name';
  nameSpan.textContent = spellbook.name;
  nameSpan.style.flex = '1';
  tab.appendChild(nameSpan);
  
  // Close button (not on first spellbook)
  if (index > 0) {
    const closeBtn = document.createElement('span');
    closeBtn.className = 'spellbook-tab-close';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      font-size: 18px;
      line-height: 1;
      opacity: 0.6;
      margin-left: 4px;
    `;
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSpellbook(root, spellbook.id);
    };
    closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.6';
    tab.appendChild(closeBtn);
  }
  
  // Click to activate
  tab.onclick = () => setActiveSpellbook(root, spellbook.id);
  
  // Double-click to rename
  nameSpan.ondblclick = (e) => {
    e.stopPropagation();
    renameSpellbook(root, spellbook.id);
  };
  
  // Hover effect
  if (!isActive) {
    tab.onmouseenter = () => tab.style.background = 'var(--accent-dim)';
    tab.onmouseleave = () => tab.style.background = 'var(--glass)';
  }
  
  return tab;
}

// Render spellbook tabs
function renderSpellbookTabs(root) {
  const data = getSpellbooksData(root);
  const tabsContainer = root.querySelector('.spellbook-tabs');
  if (!tabsContainer) return;
  
  tabsContainer.innerHTML = '';
  
  // Find the index of the active spellbook
  const activeIndex = data.spellbooks.findIndex(sb => sb.id === data.activeSpellbookId);
  
  // Reorganize: ensure active spellbook is in first 4 visible tabs
  let visibleSpellbooks = [...data.spellbooks];
  if (activeIndex >= 4) {
    // Move active spellbook to position 3 (last visible slot)
    const activeSpellbook = visibleSpellbooks.splice(activeIndex, 1)[0];
    visibleSpellbooks.splice(3, 0, activeSpellbook);
  }
  
  // Render first 4 tabs
  const visibleCount = Math.min(4, visibleSpellbooks.length);
  
  visibleSpellbooks.slice(0, visibleCount).forEach((spellbook, index) => {
    // Find original index for proper close button behavior
    const originalIndex = data.spellbooks.findIndex(sb => sb.id === spellbook.id);
    const tab = createSpellbookTab(root, spellbook, originalIndex);
    tabsContainer.appendChild(tab);
  });
  
  // Handle overflow menu for 5+ spellbooks
  const overflowContainer = root.querySelector('.spellbook-overflow-container');
  if (data.spellbooks.length >= 5) {
    overflowContainer.style.display = 'block';
    renderOverflowMenu(root, visibleSpellbooks.slice(0, visibleCount));
  } else {
    overflowContainer.style.display = 'none';
  }
  
  // Update scroll arrows visibility
  updateScrollArrows(root);
}

// Render overflow menu for spellbooks 5+
function renderOverflowMenu(root, visibleSpellbooks) {
  const data = getSpellbooksData(root);
  const menu = root.querySelector('.spellbook-overflow-menu');
  if (!menu) return;
  
  menu.innerHTML = '';
  
  // Add spellbooks that aren't in the visible tabs
  const visibleIds = visibleSpellbooks.map(sb => sb.id);
  const overflowSpellbooks = data.spellbooks.filter(sb => !visibleIds.includes(sb.id));
  
  overflowSpellbooks.forEach((spellbook) => {
    const isActive = spellbook.id === data.activeSpellbookId;
    
    const item = document.createElement('div');
    item.className = 'spellbook-overflow-item';
    item.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 13px;
      background: ${isActive ? 'var(--accent-dim)' : 'transparent'};
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      color: var(--text);
    `;
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = spellbook.name;
    nameSpan.style.flex = '1';
    item.appendChild(nameSpan);
    
    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'font-size: 18px; opacity: 0.6;';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSpellbook(root, spellbook.id);
    };
    item.appendChild(closeBtn);
    
    item.onclick = () => {
      setActiveSpellbook(root, spellbook.id);
      menu.style.display = 'none';
    };
    
    item.onmouseenter = () => {
      if (!isActive) item.style.background = 'var(--accent-dim)';
      closeBtn.style.opacity = '1';
    };
    item.onmouseleave = () => {
      if (!isActive) item.style.background = 'transparent';
      closeBtn.style.opacity = '0.6';
    };
    
    menu.appendChild(item);
  });
}

// Update scroll arrows visibility and functionality
function updateScrollArrows(root) {
  const wrapper = root.querySelector('.spellbook-tabs-wrapper');
  const tabs = root.querySelector('.spellbook-tabs');
  const leftBtn = root.querySelector('.spellbook-scroll-left');
  const rightBtn = root.querySelector('.spellbook-scroll-right');
  
  if (!wrapper || !tabs || !leftBtn || !rightBtn) return;
  
  const needsScroll = tabs.scrollWidth > wrapper.clientWidth;
  
  leftBtn.style.display = needsScroll ? 'block' : 'none';
  rightBtn.style.display = needsScroll ? 'block' : 'none';
  
  // Scroll functionality
  leftBtn.onclick = () => {
    wrapper.scrollBy({ left: -150, behavior: 'smooth' });
  };
  
  rightBtn.onclick = () => {
    wrapper.scrollBy({ left: 150, behavior: 'smooth' });
  };
}

// Add new spellbook
function addNewSpellbook(root) {
  const data = getSpellbooksData(root);
  const newName = prompt('Enter name for new spellbook:', `Spellbook ${data.spellbooks.length + 1}`);
  
  if (!newName) return;
  
  const newSpellbook = {
    id: generateSpellbookId(),
    name: newName.trim(),
    spells: []
  };
  
  data.spellbooks.push(newSpellbook);
  setActiveSpellbook(root, newSpellbook.id);
  
  const tab = document.querySelector('.tab.active');
  markUnsaved(tab, true, root);
}

// Rename spellbook
function renameSpellbook(root, spellbookId) {
  const data = getSpellbooksData(root);
  const spellbook = data.spellbooks.find(sb => sb.id === spellbookId);
  
  if (!spellbook) return;
  
  const newName = prompt('Rename spellbook:', spellbook.name);
  if (!newName) return;
  
  spellbook.name = newName.trim();
  renderSpellbookTabs(root);
  
  const tab = document.querySelector('.tab.active');
  markUnsaved(tab, true, root);
}

// Delete spellbook
function deleteSpellbook(root, spellbookId) {
  const data = getSpellbooksData(root);
  
  // Don't allow deleting the last spellbook
  if (data.spellbooks.length === 1) {
    alert('Cannot delete the last spellbook.');
    return;
  }
  
  const spellbook = data.spellbooks.find(sb => sb.id === spellbookId);
  if (!spellbook) return;
  
  // Confirm deletion if spellbook has spells
  if (spellbook.spells.length > 0) {
    const confirmed = confirm(`Delete "${spellbook.name}"? This will permanently remove ${spellbook.spells.length} spell(s).`);
    if (!confirmed) return;
  }
  
  // Remove spellbook
  data.spellbooks = data.spellbooks.filter(sb => sb.id !== spellbookId);
  
  // If deleted spellbook was active, switch to first spellbook
  if (data.activeSpellbookId === spellbookId) {
    setActiveSpellbook(root, data.spellbooks[0].id);
  } else {
    renderSpellbookTabs(root);
  }
  
  const tab = document.querySelector('.tab.active');
  markUnsaved(tab, true, root);
}

// Toggle overflow menu visibility
function setupOverflowMenu(root) {
  const btn = root.querySelector('.spellbook-overflow-btn');
  const menu = root.querySelector('.spellbook-overflow-menu');
  
  if (!btn || !menu) return;
  
  btn.onclick = (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  };
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
}

// Setup spellbook tabs system
function setupSpellbookTabs(root) {
  // Initialize default spellbook data if not present
  if (!root._spellbooksData) {
    getSpellbooksData(root);
  }
  
  // Render initial tabs
  renderSpellbookTabs(root);
  
  // Load initial spellbook
  const data = getSpellbooksData(root);
  loadSpellbookSpells(root, data.activeSpellbookId);
  
  // Setup add spellbook button
  const addBtn = root.querySelector('.add-spellbook-btn');
  if (addBtn) {
    addBtn.onclick = () => addNewSpellbook(root);
  }
  
  // Setup overflow menu
  setupOverflowMenu(root);
  
  // Update scroll arrows on window resize
  window.addEventListener('resize', () => updateScrollArrows(root));
}

// Move spell to another spellbook
function moveSpellToAnotherSpellbook(spellNode, onChange) {
  const root = spellNode.closest('.sheet-container');
  if (!root) return;
  
  const data = getSpellbooksData(root);
  const activeSpellbook = getActiveSpellbook(root);
  
  // Get list of other spellbooks
  const otherSpellbooks = data.spellbooks.filter(sb => sb.id !== activeSpellbook.id);
  
  if (otherSpellbooks.length === 0) {
    alert('No other spellbooks available. Create another spellbook first.');
    return;
  }
  
  // Create a modal to select target spellbook
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:2000;';
  
  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:#232739;padding:20px;border-radius:8px;min-width:320px;color:#fff;border:1px solid var(--border);';
  
  dialog.innerHTML = 
    '<h3 style="margin-top:0;">Move Spell To...</h3>' +
    '<p style="font-size:13px;color:var(--muted);margin-bottom:12px;">Select the spellbook to move this spell to:</p>' +
    '<select id="target-spellbook" style="width:100%;margin-bottom:12px;padding:8px;border-radius:6px;background:#1a1d29;color:#fff;border:1px solid var(--border);font-size:14px;">' +
      otherSpellbooks.map(sb => `<option value="${sb.id}">${escapeHtml(sb.name)}</option>`).join('') +
    '</select>' +
    '<div style="text-align:right;display:flex;gap:8px;justify-content:flex-end">' +
      '<button id="cancel-move" class="ghost">Cancel</button>' +
      '<button id="confirm-move">Move Spell</button>' +
    '</div>';
  
  modal.appendChild(dialog);
  document.body.appendChild(modal);
  
  // Cancel button
  dialog.querySelector('#cancel-move').onclick = () => modal.remove();
  
  // Confirm button
  dialog.querySelector('#confirm-move').onclick = () => {
    const targetId = dialog.querySelector('#target-spellbook').value;
    const targetSpellbook = data.spellbooks.find(sb => sb.id === targetId);
    
    if (!targetSpellbook) {
      modal.remove();
      return;
    }
    
    // Get spell data from node
    const spellData = spellNode._spellData || {
      name: spellNode.querySelector('.title').value,
      level: spellNode.querySelector('.level').value,
      schoolSphere: '',
      castTime: '',
      range: '',
      duration: '',
      components: '',
      save: '',
      description: '',
      notes: ''
    };
    
    // Check for duplicates in target spellbook
    const isDuplicate = targetSpellbook.spells.some(s => 
      s.name.toLowerCase() === spellData.name.toLowerCase()
    );
    
    if (isDuplicate) {
      alert(`"${spellData.name}" already exists in ${targetSpellbook.name}.`);
      modal.remove();
      return;
    }
    
    // Add to target spellbook
    targetSpellbook.spells.push(spellData);
    
    // Remove from current spellbook UI and data
    spellNode.remove();
    syncSpellbookToData(root);
    
    // Mark as unsaved
    const tab = document.querySelector('.tab.active');
    markUnsaved(tab, true, root);
    
    onChange && onChange();
    
    alert(`Moved "${spellData.name}" to ${targetSpellbook.name}`);
    modal.remove();
  };
  
  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}
	
/* ===== Theme and mode =====
   Two axes on <html>: data-theme (which palette) and data-mode (dark|light).
   Per-browser only -- deliberately NOT in the character record or the KV
   payload, matching how print options are handled.

   index.html carries a tiny inline copy of the read half, before the
   stylesheet, so a saved light mode does not flash dark on load. If the key
   name changes, it must change in BOTH places. */
const THEME_KEY = 'gsheets_theme';

function readThemePref() {
  try { return JSON.parse(localStorage.getItem(THEME_KEY) || '{}') || {}; }
  catch (e) { return {}; }
}

/* Read each theme's REAL palette and paint its tile from it.
   A hidden probe element gets the theme's attributes, so getComputedStyle
   returns exactly what that theme would produce in the current mode. Hardcoding
   the swatch colours in CSS would mean a theme's tile could drift from the
   theme, and adding a theme would mean editing two places instead of one. */
function paintThemeTiles(grid) {
  const mode = document.documentElement.getAttribute('data-mode') || 'dark';
  const cur  = document.documentElement.getAttribute('data-theme') || 'slate-brass';
  const probe = document.createElement('div');
  probe.style.display = 'none';
  document.body.appendChild(probe);
  grid.querySelectorAll('.theme-tile').forEach(tile => {
    const key = tile.getAttribute('data-theme-key');
    probe.setAttribute('data-theme', key);
    probe.setAttribute('data-mode', mode);
    const cs = getComputedStyle(probe);
    tile.style.setProperty('--tbg',    cs.getPropertyValue('--bg').trim());
    tile.style.setProperty('--tpanel', cs.getPropertyValue('--panel').trim());
    tile.style.setProperty('--tacc',   cs.getPropertyValue('--accent').trim());
    tile.style.setProperty('--tal',    cs.getPropertyValue('--accent-light').trim());
    const on = key === cur;
    tile.classList.toggle('selected', on);
    const radio = tile.querySelector('input[type=radio]');
    if (radio) radio.checked = on;
  });
  probe.remove();
}

/* Which themes actually exist, read out of the stylesheet rather than kept as a
   list here. A hardcoded list would need editing every time a theme is added,
   renamed or removed -- and the case this guards against IS someone editing
   themes, so a list that can go stale is the wrong tool.

   Note a probe element cannot be used for this: custom properties INHERIT, so a
   div carrying an unknown data-theme still reports the <html> palette's --bg
   and would look valid. */
/* var, not let: same hoisting problem as themeFallback above. As `var` this is
   `undefined` when init() runs, which is falsy, so the cache check below simply
   misses and the scan proceeds normally. */
var THEME_KEYS = null;
function knownThemes() {
  if (THEME_KEYS) return THEME_KEYS;
  const keys = new Set();
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }  // cross-origin
    for (const rule of rules) {
      const sel = rule.selectorText;
      if (!sel) continue;
      const found = sel.match(/\[data-theme="[a-z0-9-]+"\]/g);
      if (found) found.forEach(s => keys.add(s.slice(13, -2)));
    }
  }
  THEME_KEYS = keys;
  return keys;
}

/* A hoisted FUNCTION, not a const. init() is an IIFE that runs ~600 lines above
   this point, and a const/let is in the temporal dead zone until its own line is
   evaluated -- so a const here throws a ReferenceError at boot. `var` would be
   worse: it hoists as undefined and would set data-theme="undefined", failing
   silently instead of loudly. Function declarations hoist completely. */
function themeFallback() { return 'slate-brass'; }

function applyTheme(theme, mode) {
  const el = document.documentElement;
  if (theme) el.setAttribute('data-theme', theme);
  if (mode)  el.setAttribute('data-mode', mode);

  // A stored theme that no longer exists leaves every palette unmatched and the
  // app renders with unresolved variables. Fall back rather than showing that.
  const known = knownThemes();
  if (known.size && !known.has(el.getAttribute('data-theme'))) {
    el.setAttribute('data-theme', themeFallback());
  }
  if (el.getAttribute('data-mode') !== 'light') el.setAttribute('data-mode', 'dark');
  // The lamp's ART is pure CSS off <html data-mode>, so nothing here touches a
  // colour, a class or a path. What JS must still do is the part a stylesheet
  // cannot express: the ACCESSIBLE state. aria-pressed is what a screen reader
  // announces; title is what a mouse user gets on hover. Neither is derivable
  // from CSS, which is the whole reason this block still exists at all.
  //
  // Driven by the MODE rather than by the click, so the control still reads
  // correctly after a reload and not only after someone has pressed it once.
  const isLight = el.getAttribute('data-mode') === 'light';
  const lamp = document.getElementById('mode-lamp');
  if (lamp) {
    lamp.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    // title names the DESTINATION (what a click will do); aria-label names the
    // CONTROL and never changes. Putting the destination in both would make a
    // screen reader announce "switch to light mode" as the button's NAME.
    lamp.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
  }
  // Repaint and re-mark the picker if it is on screen, so applyTheme stays the
  // single writer. The repaint matters because the tiles are drawn in the
  // CURRENT MODE -- flipping the lamp must redraw all ten, not just re-tick one.
  const grid = document.querySelector('.theme-grid');
  if (grid) paintThemeTiles(grid);
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify({
      theme: el.getAttribute('data-theme'),
      mode:  el.getAttribute('data-mode')
    }));
  } catch (e) {}
}

/* The mode lamp's handler. Renamed from tdnn(), which was named after the
   borrowed toggle's markup and meant nothing here. Nothing calls the old name
   any more -- the inline onclick in index.html is gone with it.

   Bound below rather than in the per-sheet wiring, because the lamp lives in
   index.html and exists ONCE for the whole app, not once per character tab.
   app.js is the last script in <body>, so the button is already parsed by the
   time this runs and no DOMContentLoaded wrapper is needed. */
function toggleMode() {
  const cur = document.documentElement.getAttribute('data-mode');
  applyTheme(null, cur === 'light' ? 'dark' : 'light');
}
(function bindModeLamp() {
  const lamp = document.getElementById('mode-lamp');
  if (lamp) lamp.addEventListener('click', toggleMode);
})();

/* ===== DICE ROLLER UTILITIES ===== */

// Roll a single die
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// Parse and roll dice formula (e.g., "2d6+3", "1d20-2")
function rollDiceFormula(formula) {
  const match = formula.match(/(\d+)d(\d+)([+\-]\d+)?/i);
  if (!match) return null;
  
  const numDice = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  
  if (numDice < 1 || numDice > 100 || sides < 1 || sides > 1000) {
    return null;
  }
  
  const rolls = [];
  let total = 0;
  
  for (let i = 0; i < numDice; i++) {
    const roll = rollDie(sides);
    rolls.push(roll);
    total += roll;
  }
  
  total += modifier;
  
  return {
    formula: formula,
    rolls: rolls,
    modifier: modifier,
    total: total
  };
}

// Add roll to history display
function addRollToHistory(root, result) {
  const historyEl = root.querySelector('.roll-history');
  if (!historyEl) return;
  
  // Remove placeholder if it exists
  const placeholder = historyEl.querySelector('div[style*="font-style:italic"]');
  if (placeholder) placeholder.remove();
  
  const entry = document.createElement('div');
  entry.style.cssText = 'padding:8px;margin-bottom:6px;background:rgba(255,255,255,0.05);border-radius:6px;border-left:3px solid var(--accent);';
  
  const timestamp = new Date().toLocaleTimeString();
  const rollsDisplay = result.rolls ? result.rolls.join(', ') : result.total;
  const modDisplay = result.modifier ? ` ${result.modifier >= 0 ? '+' : ''}${result.modifier}` : '';
  
  // Detail was previously hover-only via entry.title, which does not fire on
  // touch at all -- so on a phone the STR/DEX breakdown, the WIS save
  // adjustment and every proficiency result were simply unreachable. A native
  // <details> is discoverable, works on touch, and stays collapsed so the
  // history remains scannable. Same pattern as .print-extras in the print modal.
  // No shared escape helper exists in this project -- every function that needs
  // one declares it locally. Following that convention rather than adding a
  // global here.
  // Summary carries NO inline styles -- inline beats the stylesheet, and the
  // .roll-history details rules in style.css do the work.
  const detailBlock = result.modifierInfo ? `
    <details style="margin-top:4px;">
      <summary>details</summary>
      <div style="white-space:pre-wrap;color:var(--text);font-size:11px;margin-top:4px;padding-left:4px;border-left:2px solid var(--border);">${escapeHtml(result.modifierInfo)}</div>
    </details>` : '';

  entry.innerHTML = `
    <div style="color:var(--accent-light);font-weight:600;">${result.formula}: ${result.total}</div>
    <div style="color:var(--muted);font-size:11px;">Rolls: [${rollsDisplay}]${modDisplay} - ${timestamp}</div>
    ${detailBlock}
  `;
  
  // Add to top of history
  historyEl.insertBefore(entry, historyEl.firstChild);
  
  // Limit history to 20 entries
  while (historyEl.children.length > 20) {
    historyEl.removeChild(historyEl.lastChild);
  }
}

// Roll ability scores using various methods
function rollAbilityScores(method) {
  const results = [];
  
  if (method === '3d6') {
    const roll = rollDiceFormula('3d6');
    return [roll];
  } else if (method === '4d6') {
    // Roll 4d6, drop lowest
    const rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
    rolls.sort((a, b) => a - b);
    const dropped = rolls.shift(); // Remove lowest
    const total = rolls.reduce((sum, r) => sum + r, 0);
    
    return [{
      formula: '4d6 (drop lowest)',
      rolls: rolls,
      modifier: 0,
      total: total,
      dropped: dropped
    }];
  } else if (method === 'method1') {
    // Method I: Roll 3d6 six times
    for (let i = 0; i < 6; i++) {
      results.push(rollDiceFormula('3d6'));
    }
    return results;
  } else if (method === 'method2') {
    // Method II: Roll 3d6 twelve times, pick best 6
    const allRolls = [];
    for (let i = 0; i < 12; i++) {
      allRolls.push(rollDiceFormula('3d6'));
    }
    allRolls.sort((a, b) => b.total - a.total);
    return allRolls.slice(0, 6);
  }
  
  return results;
}

// Bind dice roller events for a sheet
function bindDiceRollers(root) {
  // Standard dice buttons
  const standardDiceButtons = root.querySelectorAll('.roll-dice');
  standardDiceButtons.forEach(btn => {
    btn.onclick = () => {
      const formula = btn.getAttribute('data-dice');
      const result = rollDiceFormula(formula);
      if (result) {
        addRollToHistory(root, result);
      }
    };
  });
  
  // Custom dice roller
  const customInput = root.querySelector('.custom-dice-input');
  const customButton = root.querySelector('.roll-custom-dice');
  
  if (customButton && customInput) {
    customButton.onclick = () => {
      const formula = customInput.value.trim();
      if (!formula) return;
      
      const result = rollDiceFormula(formula);
      if (result) {
        addRollToHistory(root, result);
        customInput.value = '';
      } else {
        alert('Invalid dice formula. Use format like: 2d6+3, 1d20, 3d8-2');
      }
    };
    
    // Allow Enter key to roll
    customInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        customButton.click();
      }
    };
  }
  
  // Ability score rollers
  const abilityButtons = root.querySelectorAll('.roll-ability');
  abilityButtons.forEach(btn => {
    btn.onclick = () => {
      const method = btn.getAttribute('data-method');
      const results = rollAbilityScores(method);
      
      results.forEach(result => {
        addRollToHistory(root, result);
      });
    };
  });
  
  // Clear history button
  const clearButton = root.querySelector('.clear-roll-history');
  if (clearButton) {
    clearButton.onclick = () => {
      const historyEl = root.querySelector('.roll-history');
      if (historyEl) {
        historyEl.innerHTML = '<div style="color:var(--muted);font-style:italic;">Roll results will appear here...</div>';
      }
    };
  }
  
  // Common game roll buttons
  const gameRollButtons = root.querySelectorAll('.game-roll');
  gameRollButtons.forEach(btn => {
    btn.onclick = () => {
      const rollType = btn.getAttribute('data-roll');
      let result = null;
      let modifiers = null; // Will hold modifier info for tooltip
      
      // Get ability scores for modifiers
      const str = parseInt(val(root, 'str') || 0, 10);
      const dex = parseInt(val(root, 'dex') || 0, 10);
      const cha = parseInt(val(root, 'cha') || 0, 10);
      const strExceptional = val(root, 'str_exceptional') || '';
      const rollClazz = val(root, 'clazz') || '';
      
      switch(rollType) {
        case 'initiative':
          result = rollDiceFormula('1d10');
          result.formula = 'Initiative (d10)';
          // PHB Ch.9: LOW ROLL WINS. Dexterity is NOT an initiative modifier in
          // 2e (Table 2 has no initiative column; Tables 55/56 never mention it).
          // Weapon speed factor IS a modifier (Table 56) and is ADDED to the roll.
          {
            const initLines = [];
            const equipped = [];
            const useSpeed = (typeof isOptionalRule === 'function')
                               ? isOptionalRule('weaponSpeedInitiative')
                               : true;

            if (useSpeed) root.querySelectorAll('.weapons-list .item').forEach(w => {
              const eq = w.querySelector('.equipped');
              if (!eq || !eq.checked) return;
              const nm    = (w.querySelector('.title') || {}).value || 'Unnamed';
              const spd   = (w.querySelector('.speed') || {}).value || '';
              const magic = (w.querySelector('.magic-bonus') || {}).value || '';
              const eff   = getEffectiveWeaponSpeed(spd, magic);
              if (eff !== null) equipped.push({ name: nm, base: parseInt(spd, 10), eff: eff, magic: parseInt(magic, 10) || 0 });
            });

            if (equipped.length) {
              initLines.push('Rolled: ' + result.total + '  (low wins)');
              initLines.push('');
              equipped.forEach(w => {
                const note = (w.magic > 0)
                  ? ' [speed ' + w.base + ' - ' + w.magic + ' magic = ' + w.eff + ']'
                  : ' [speed ' + w.eff + ']';
                initLines.push(w.name + ':  ' + (result.total + w.eff) + note);
              });
              initLines.push('');
            } else {
              initLines.push('Rolled: ' + result.total + '  (low wins)');
              initLines.push(useSpeed
                ? 'No equipped weapon -- no speed factor applied.'
                : 'Weapon speed initiative is off (Settings > Optional Rules).');
              initLines.push('');
            }

            // Spell casting time is the caster's equivalent of weapon speed factor
            // (PHB Ch.7, optional): "If only a number is given, the casting time is
            // added to the caster's initiative die rolls."
            //
            // ONLY a bare number qualifies. Spells timed in rounds or turns resolve
            // at the end of the stated round or turn and take no modifier at all --
            // which is why this asks getSpellInitiativeModifier rather than reading
            // the field directly. A "1 round" spell must never be mistaken for a
            // "1" spell; they look nearly identical and mean opposite things.
            const useCastTime = (typeof isOptionalRule === 'function') &&
                                isOptionalRule('spellCastingTimeInitiative');

            if (useCastTime) {
              const castable = [];
              root.querySelectorAll('.memspells-list .item').forEach(s => {
                // A spell already marked Cast is spent and cannot be cast again
                // this round, so listing it would only be noise.
                if (s.classList.contains('spell-cast')) return;
                const nm  = (s.querySelector('.title') || {}).value || 'Unnamed';
                const ct  = (s.querySelector('.cast-time') || {}).value || '';
                const mod = (typeof getSpellInitiativeModifier === 'function')
                              ? getSpellInitiativeModifier(ct)
                              : null;
                if (mod !== null) castable.push({ name: nm, mod: mod });
              });

              if (castable.length) {
                initLines.push('Spells memorized (casting time added):');
                // Capped: a high-level caster can hold twenty spells and the roller
                // is a tooltip, not a spell list.
                castable.slice(0, 10).forEach(s => {
                  initLines.push('  ' + s.name + ':  ' + (result.total + s.mod) +
                                 '  [+' + s.mod + ']');
                });
                if (castable.length > 10) {
                  initLines.push('  ...and ' + (castable.length - 10) + ' more.');
                }
                initLines.push('');
              }
            }

            initLines.push('Other modifiers (PHB Table 55):');
            initLines.push('hasted -2, slowed +2, higher ground -1,');
            initLines.push('set vs charge -2, waiting +1,');
            initLines.push('wading +2 / deep water +4, hindered +3,');
            // Table 55's largest modifier, and the one most often forgotten:
            // "situations in which the party is in a completely different
            // environment (swimming underwater without the aid of a ring of
            // free action, for example)".
            initLines.push('foreign environment +6.');

            modifiers = initLines.join('\n');
          }
          break;
          
        case 'surprise':
          result = rollDiceFormula('1d10');
		  result.formula = 'Surprise (d10)';
		  // PHB Ch.11: "determined by rolling 1d10 for each side ... If the die
          // roll is a 1, 2, or 3, that group or character is surprised."
          modifiers = ['Rolled: ' + result.total + '   (raw d10)', '']
            .concat(buildSurpriseModifierLines(root, dex, result.total))
            .join('\n');
          break;
          
        case 'to-hit':
          result = rollDiceFormula('1d20');
          result.formula = 'Attack Roll (d20)';
          // Show both melee (STR) and missile (DEX) modifiers
          const strData = getStrengthData(str, strExceptional, rollClazz);
          const dexDataAttack = (typeof DEX_TABLE !== 'undefined' && DEX_TABLE[dex]) ? DEX_TABLE[dex] : null;
          let modLines = [];
          if (strData) {
            const strMod = strData[0]; // To-hit bonus is index 0
            modLines.push(`Melee (STR): ${strMod >= 0 ? '+' : ''}${strMod} → ${result.total + strMod}`);
          }
          if (dexDataAttack) {
            const dexMod = dexDataAttack[1]; // Missile attack adj is index 1
            modLines.push(`Missile (DEX): ${dexMod >= 0 ? '+' : ''}${dexMod} → ${result.total + dexMod}`);
          }
          modifiers = modLines.length > 0 ? modLines.join('\n') : 'No modifiers';
          break;
          
        case 'saving-throw':
          result = rollDiceFormula('1d20');
          result.formula = 'Saving Throw (d20)';
          // Show WIS modifier for mental saves
          const wis = parseInt(val(root, 'wis') || 0, 10);
          const wisAdj = (typeof WIS_MDA !== 'undefined' && WIS_MDA[wis]) ? WIS_MDA[wis] : 0;
          modifiers = `Mental effects (WIS): ${wisAdj >= 0 ? '+' : ''}${wisAdj} → ${result.total + wisAdj}\n(Other saves: check character sheet)`;
          break;
          
        case 'ability-check':
          result = rollDiceFormula('1d20');
          result.formula = 'Ability Check (d20)';
          modifiers = 'Roll under ability score to succeed\n(Refer to specific ability scores on sheet)';
          break;

        // PHB Ch.5: "the player rolls 1d20. If the roll is equal to or less
        // than the character's adjusted ability score, the character
        // accomplished what he was trying to do. (A roll of 20 always fails.)"
        // One d20 answers this for every proficiency at once, so rather than
        // add a selector the result is reported against all of them.
        case 'proficiency-check': {
          result = rollDiceFormula('1d20');
          result.formula = 'Proficiency Check (d20)';

          const profList = root._nwps || [];
          const natural20 = result.total === 20;
          const profLines = [];

          if (typeof getNWPCheckTarget !== 'function') {
            modifiers = 'Roll equal to or under the adjusted ability score.\n' +
                        'A natural 20 always fails.';
          } else if (!profList.length) {
            modifiers = 'No nonweapon proficiencies recorded.\n\n' +
                        'Roll equal to or under the adjusted ability score.\n' +
                        'A natural 20 always fails.';
          } else {
            profList.forEach(n => {
              const c = getNWPCheckTarget(root, n);
              if (!c.hasCheck) {
                profLines.push(`—  ${c.name}: no check required`);
              } else if (c.impossible) {
                profLines.push(`✗  ${c.name}: impossible (target ${c.target})`);
              } else {
                const made = !natural20 && result.total <= c.target;
                profLines.push(`${made ? '✓' : '✗'}  ${c.name}: need ${c.target} or less`);
              }
            });
            profLines.sort();
            modifiers = (natural20
              ? 'NATURAL 20 — every proficiency check fails.\n\n'
              : '') + profLines.join('\n');
          }
          break;
        }
          
        case 'reaction':
          result = rollDiceFormula('2d10');
          result.formula = 'Reaction (2d10)';
          // PHB Table 6's Charisma Reaction Adjustment. REPORTED, NOT FOLDED IN
          // -- the headline stays the raw 2d10, as it does for every other roll
          // type, and the adjusted figure is spelled out beneath it. Chapter 11
          // taught this the hard way: a bare number parked beside a threshold
          // reads as a rules question when the two do not agree.
          //
          // NO RESULT BANDS ARE SHOWN, and their absence is deliberate. The PHB
          // prints no reaction result table anywhere -- Chapter 12 defines an
          // NPC as one the DM controls, and the interpretation is his.
          const chaData = (typeof CHA_TABLE !== 'undefined' && CHA_TABLE[cha]) ? CHA_TABLE[cha] : null;
          if (chaData) {
            const chaAdj = chaData.reaction;
            modifiers = `Raw roll: ${result.total} (2d10)\n` +
                        `Charisma Reaction Adj.: ${chaAdj >= 0 ? '+' : ''}${chaAdj}\n` +
                        `ADJUSTED REACTION: ${result.total + chaAdj}\n\n` +
                        `The PHB prints no result bands for this roll. NPCs are ` +
                        `DM-controlled (Ch.12), so the adjusted figure is his to read.`;
          } else {
            modifiers = `No Charisma recorded, so no Reaction Adjustment applies.\n\n` +
                        `The PHB prints no result bands for this roll. NPCs are ` +
                        `DM-controlled (Ch.12), so the figure is his to read.`;
          }
          break;
          
        case 'open-doors':
          result = rollDiceFormula('1d20');
          result.formula = 'Open Doors (d20)';
          // STR open doors
          const strDataDoors = getStrengthData(str, strExceptional, rollClazz);
          if (strDataDoors) {
            const openDoors = strDataDoors[3]; // Open doors is index 3
            modifiers = `STR open doors: ${openDoors}\n(Roll ${openDoors} or less to open)`;
          }
          break;
          
        case 'bend-bars':
          result = rollDiceFormula('1d100');
          result.formula = 'Bend Bars (d100)';
          // STR bend bars
          const strDataBend = getStrengthData(str, strExceptional, rollClazz);
          if (strDataBend) {
            const bendBars = strDataBend[4]; // Bend bars is index 4
            modifiers = `STR bend bars: ${bendBars}%\n(Roll ${bendBars} or less to succeed)`;
          }
          break;

        // The three cases below are wrapped in braces. The older cases declare
        // their consts directly in the switch's own block scope, which works
        // only as long as every name is unique across every case -- braces make
        // each of these self-contained instead.
        case 'starting-age': {
          const ageKey = (typeof getRaceKey === 'function') ? getRaceKey(val(root, 'race')) : null;
          const ageRow = (ageKey && typeof RACE_STARTING_AGE !== 'undefined') ? RACE_STARTING_AGE[ageKey] : null;
          if (!ageRow) {
            result = { formula: 'Starting Age \u2014 race not recognised', rolls: [], modifier: 0, total: '\u2014' };
            modifiers = 'PHB Table 11 covers dwarf, elf, gnome, half-elf, halfling and human.\n' +
                        'Set the Race field to one of those first.';
            break;
          }
          result = rollDiceFormula(ageRow.dice + '+' + ageRow.base);
          if (result) {
            result.formula = 'Starting Age (' + ageKey + ')';
            modifiers = 'PHB Table 11: base ' + ageRow.base + ' + ' + ageRow.dice + '.\n' +
                        'Variable roll ' + (result.total - ageRow.base) +
                        ', starting age ' + result.total + '.';
          }
          break;
        }

        case 'height': {
          const htKey = (typeof getRaceKey === 'function') ? getRaceKey(val(root, 'race')) : null;
          const htRow = (htKey && typeof RACE_HEIGHT_WEIGHT !== 'undefined') ? RACE_HEIGHT_WEIGHT[htKey] : null;
          if (!htRow) {
            result = { formula: 'Height \u2014 race not recognised', rolls: [], modifier: 0, total: '\u2014' };
            modifiers = 'PHB Table 10 covers dwarf, elf, gnome, half-elf, halfling and human.\n' +
                        'Set the Race field to one of those first.';
            break;
          }
          // ONE die roll applied to BOTH bases. This is a single character whose
          // gender may simply not be recorded yet -- not two characters -- so the
          // same modifier is added to the male and female base figures.
          const htRoll = rollDiceFormula(htRow.height.dice);
          if (!htRoll) break;
          const htM  = htRow.height.male   + htRoll.total;
          const htF  = htRow.height.female + htRoll.total;
          const inch = n => Math.floor(n / 12) + "' " + (n % 12) + '"';
          const htG  = (val(root, 'gender') || '').toLowerCase();
          result = htRoll;
          result.formula = 'Height (' + htKey + ')';
          result.total = (htG === 'female') ? htF + ' in (' + inch(htF) + ')'
                       : (htG === 'male')   ? htM + ' in (' + inch(htM) + ')'
                       : htM + ' / ' + htF + ' in';
          modifiers = 'PHB Table 10. ' + htRow.height.dice + ' rolled ' + htRoll.total + '.\n' +
                      'Male:   ' + htM + ' in (' + inch(htM) + ')\n' +
                      'Female: ' + htF + ' in (' + inch(htF) + ')' +
                      (htG ? '' : '\nSet Gender in Basic Info to pick one automatically.');
          break;
        }

        case 'weight': {
          const wtKey = (typeof getRaceKey === 'function') ? getRaceKey(val(root, 'race')) : null;
          const wtRow = (wtKey && typeof RACE_HEIGHT_WEIGHT !== 'undefined') ? RACE_HEIGHT_WEIGHT[wtKey] : null;
          if (!wtRow) {
            result = { formula: 'Weight \u2014 race not recognised', rolls: [], modifier: 0, total: '\u2014' };
            modifiers = 'PHB Table 10 covers dwarf, elf, gnome, half-elf, halfling and human.\n' +
                        'Set the Race field to one of those first.';
            break;
          }
          const wtRoll = rollDiceFormula(wtRow.weight.dice);
          if (!wtRoll) break;
          const wtM = wtRow.weight.male   + wtRoll.total;
          const wtF = wtRow.weight.female + wtRoll.total;
          const wtG = (val(root, 'gender') || '').toLowerCase();
          result = wtRoll;
          result.formula = 'Weight (' + wtKey + ')';
          result.total = (wtG === 'female') ? wtF + ' lb'
                       : (wtG === 'male')   ? wtM + ' lb'
                       : wtM + ' / ' + wtF + ' lb';
          modifiers = 'PHB Table 10. ' + wtRow.weight.dice + ' rolled ' + wtRoll.total + '.\n' +
                      'Male:   ' + wtM + ' lb\n' +
                      'Female: ' + wtF + ' lb' +
                      (wtG ? '' : '\nSet Gender in Basic Info to pick one automatically.');
          break;
        }
      }
      
      if (result) {
        // Add modifiers as a property on the result for the tooltip
        if (modifiers) {
          result.modifierInfo = modifiers;
        }
        addRollToHistory(root, result);
      }
    };
  });
}

// Update thief skill percentages in the roller
function updateThiefSkillRoller(root) {
  const percentageDisplays = root.querySelectorAll('.thief-skill-percentage');
  
  percentageDisplays.forEach(display => {
    const skillField = display.getAttribute('data-skill');
    const skillValue = val(root, skillField) || '0';
    display.textContent = `${skillValue}%`;
  });
}

// Render/show Thief Skills section based on class
function renderThiefSkillsSection(root) {
  const section = root.querySelector('.thief-skills-section');
  if (!section) return;
  
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  let hasThiefSkills = false;
  
  // Helper function to check if a class is thief-type
  function isThiefClass(className) {
    const c = (className || '').toLowerCase();
    return c.includes('thief') || c.includes('bard') || c.includes('assassin');
  }
  
  if (charType === 'multi') {
    // Multi-class: Show if ANY class is thief
    const class1 = val(root, 'mc_class1') || '';
    const class2 = val(root, 'mc_class2') || '';
    const class3 = val(root, 'mc_class3') || '';
    
    hasThiefSkills = isThiefClass(class1) || isThiefClass(class2) || isThiefClass(class3);
    
  } else if (charType === 'dual') {
    // Dual-class: Check dormancy
    const originalClass = val(root, 'dc_original_class') || '';
    const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
    const newClass = val(root, 'dc_new_class') || '';
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
    const isDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (newLevel <= originalLevel);
    
    if (isDormant) {
      // Dormant: Only show if NEW class is thief
      hasThiefSkills = isThiefClass(newClass);
    } else {
      // Active: Show if EITHER class is thief
      hasThiefSkills = isThiefClass(originalClass) || isThiefClass(newClass);
    }
    
  } else {
    // Single-class: Check the main class field
    const clazz = val(root, 'clazz') || '';
    hasThiefSkills = isThiefClass(clazz);
  }
  
  // Get all thief-related sections
  const allThiefSections = root.querySelectorAll('.thief-abilities-display, .thief-skills-section');
  
  if (!hasThiefSkills) {
    allThiefSections.forEach(s => s.style.display = 'none');
  } else {
    allThiefSections.forEach(s => s.style.display = 'block');
    updateThiefSkillRoller(root);
    updateThiefSkillsAccessibility(root);
  }
}

// Disable thief skills that bards cannot use
function updateThiefSkillsAccessibility(root) {
  const clazz = (val(root, 'clazz') || '').toLowerCase();
  const isBard = clazz.includes('bard');
  
  // Skills that bards CANNOT use (indices 1,2,3,4 in the arrays)
  const bardDisabledSkills = ['openlocks', 'traps', 'movesilently', 'hide'];
  
  bardDisabledSkills.forEach(skill => {
    // Disable discretionary point inputs
    const pointInput = root.querySelector(`.thief-point-input[data-skill="${skill}"]`);
    if (pointInput) {
      pointInput.disabled = isBard;
      pointInput.value = isBard ? '0' : pointInput.value;
      if (isBard) {
        pointInput.style.opacity = '0.4';
        pointInput.style.cursor = 'not-allowed';
      } else {
        pointInput.style.opacity = '1';
        pointInput.style.cursor = '';
      }
    }
	
	// Grey out the readonly percentage display fields
    const displayField = root.querySelector(`[data-field="thief_${skill}"]`);
    if (displayField) {
      if (isBard) {
        displayField.style.opacity = '0.4';
        displayField.style.cursor = 'not-allowed';
        displayField.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
      } else {
        displayField.style.opacity = '1';
        displayField.style.cursor = '';
        displayField.style.backgroundColor = '';
      }
    }
    
    // Disable roller section elements
    const rollItem = root.querySelector(`.roll-thief-skill[data-skill="thief_${skill}"]`)?.closest('.thief-skill-roll-item');
    if (rollItem) {
      if (isBard) {
        rollItem.style.opacity = '0.4';
        rollItem.style.pointerEvents = 'none';
      } else {
        rollItem.style.opacity = '1';
        rollItem.style.pointerEvents = '';
      }
    }
  });
}

// Calculate total discretionary points available based on class and level
function calculateThiefPointsAvailable(root) {
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  
  // Helper to check if a class is thief-type
  function isThiefClass(className) {
    const c = (className || '').toLowerCase();
    return c.includes('thief') || c.includes('assassin');
  }
  
  function isBardClass(className) {
    const c = (className || '').toLowerCase();
    return c.includes('bard');
  }
  
  let thiefLevel = 0;
  let isBard = false;
  
  if (charType === 'multi') {
    // Multi-class: Use the thief class level
    const class1 = val(root, 'mc_class1') || '';
    const class2 = val(root, 'mc_class2') || '';
    const class3 = val(root, 'mc_class3') || '';
    const level1 = parseInt(val(root, 'mc_level1') || 0, 10);
    const level2 = parseInt(val(root, 'mc_level2') || 0, 10);
    const level3 = parseInt(val(root, 'mc_level3') || 0, 10);
    
    if (isThiefClass(class1)) thiefLevel = level1;
    else if (isThiefClass(class2)) thiefLevel = level2;
    else if (isThiefClass(class3)) thiefLevel = level3;
    
    if (isBardClass(class1) || isBardClass(class2) || isBardClass(class3)) {
      isBard = true;
    }
    
  } else if (charType === 'dual') {
    // Dual-class: Depends on dormancy
    const originalClass = val(root, 'dc_original_class') || '';
    const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
    const newClass = val(root, 'dc_new_class') || '';
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
    const isDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (newLevel <= originalLevel);
    
    if (isDormant) {
      // Only new class counts
      if (isThiefClass(newClass)) thiefLevel = newLevel;
      if (isBardClass(newClass)) isBard = true;
    } else {
      // Both classes count - use the higher thief level
      let originalThiefLevel = isThiefClass(originalClass) ? originalLevel : 0;
      let newThiefLevel = isThiefClass(newClass) ? newLevel : 0;
      thiefLevel = Math.max(originalThiefLevel, newThiefLevel);
      
      if (isBardClass(originalClass) || isBardClass(newClass)) {
        isBard = true;
      }
    }
    
  } else {
    // Single-class
    const clazz = (val(root, 'clazz') || '').toLowerCase();
    const level = parseInt(val(root, 'level')) || 1;
    
    if (isThiefClass(clazz)) thiefLevel = level;
    if (isBardClass(clazz)) isBard = true;
  }
  
  // Get bard level if applicable
  let bardLevel = 0;
  if (isBard) {
    if (charType === 'multi') {
      const class1 = val(root, 'mc_class1') || '';
      const class2 = val(root, 'mc_class2') || '';
      const class3 = val(root, 'mc_class3') || '';
      const level1 = parseInt(val(root, 'mc_level1') || 0, 10);
      const level2 = parseInt(val(root, 'mc_level2') || 0, 10);
      const level3 = parseInt(val(root, 'mc_level3') || 0, 10);
      
      if (isBardClass(class1)) bardLevel = level1;
      else if (isBardClass(class2)) bardLevel = level2;
      else if (isBardClass(class3)) bardLevel = level3;
    } else if (charType === 'dual') {
      const originalClass = val(root, 'dc_original_class') || '';
      const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
      const newClass = val(root, 'dc_new_class') || '';
      const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
      const isDormant = (root._isDualClassDormant !== undefined)
        ? root._isDualClassDormant
        : (newLevel <= originalLevel);
      
      if (isDormant) {
        if (isBardClass(newClass)) bardLevel = newLevel;
      } else {
        let originalBardLevel = isBardClass(originalClass) ? originalLevel : 0;
        let newBardLevel = isBardClass(newClass) ? newLevel : 0;
        bardLevel = Math.max(originalBardLevel, newBardLevel);
      }
    } else {
      const level = parseInt(val(root, 'level')) || 1;
      bardLevel = level;
    }
  }
  
  if (thiefLevel === 0 && bardLevel === 0) return 0;
  
  // Calculate points based on level
  // Thieves: 30 at 1st level, +20 per level thereafter
  // Bards: 20 at 1st level, +15 per level thereafter
  if (thiefLevel > 0) {
    return 30 + ((thiefLevel - 1) * 20);
  } else if (bardLevel > 0) {
    return 20 + ((bardLevel - 1) * 15);
  }
  
  return 0;
}

// Update the discretionary points display
function updateThiefPointsDisplay(root) {
  const totalPoints = calculateThiefPointsAvailable(root);
  
  // Calculate allocated points from all inputs
  let allocatedPoints = 0;
  root.querySelectorAll('.thief-point-input').forEach(input => {
    allocatedPoints += parseInt(input.value) || 0;
  });
  
  const remainingPoints = totalPoints - allocatedPoints;
  
  // Update display
  const totalEl = root.querySelector('.thief-total-points');
  const allocatedEl = root.querySelector('.thief-allocated-points');
  const remainingEl = root.querySelector('.thief-remaining-points');
  
  if (totalEl) totalEl.textContent = totalPoints;
  if (allocatedEl) allocatedEl.textContent = allocatedPoints;
  if (remainingEl) {
    remainingEl.textContent = remainingPoints;
    // Color code: green if points remaining, red if over-allocated
    if (remainingPoints < 0) {
      remainingEl.style.color = '#ef4444';
    } else if (remainingPoints > 0) {
      remainingEl.style.color = '#10b981';
    } else {
      remainingEl.style.color = '#fbbf24';
    }
  }

// Show/hide warning if there are unassigned points
  const warningEl = root.querySelector('.thief-points-warning');
  if (warningEl) {
    if (remainingPoints > 0) {
      warningEl.style.display = 'inline';
    } else {
      warningEl.style.display = 'none';
    }
  }
}

// Render/show discretionary points section based on class
function renderThiefPointsSection(root) {
  const clazz = (val(root, 'clazz') || '').toLowerCase();
  const section = root.querySelector('.thief-points-section');
  
  if (!section) return;
  
  const isBard = clazz.includes('bard');
  const isThief = clazz.includes('thief') || clazz.includes('assassin');
  const hasThiefSkills = isThief || isBard;
  
  if (!hasThiefSkills) {
    section.style.display = 'none';
  } else {
    section.style.display = 'block';
    
    // For bards, disable skills they don't have
    if (isBard) {
      root.querySelectorAll('.thief-point-input').forEach(input => {
        const skill = input.dataset.skill;
        // Bards only get: pickpockets, detectnoise, climb, readlang
        if (skill !== 'pickpockets' && skill !== 'detectnoise' && skill !== 'climb' && skill !== 'readlang') {
		  input.disabled = true;
		  input.value = 0;
		  input.style.opacity = '0.4';
		  // Also clear the hidden field so bards don't get points in skills they can't use
		  val(root, `thief_points_${skill}`, 0);
		} else {
          input.disabled = false;
          input.style.opacity = '1';
        }
      });
    } else {
      // Thieves/assassins can use all skills
      root.querySelectorAll('.thief-point-input').forEach(input => {
        input.disabled = false;
        input.style.opacity = '1';
      });
    }
    
    updateThiefPointsDisplay(root);
  }
}

// Bind discretionary points allocation events
function bindThiefPointsAllocation(root) {
  renderThiefPointsSection(root);
  
  root.querySelectorAll('.thief-point-input').forEach(input => {
    input.addEventListener('input', () => {
      const skill = input.dataset.skill;
      const points = parseInt(input.value) || 0;
      
      // Update the hidden field
      val(root, `thief_points_${skill}`, points);
      
      // Update the display
      updateThiefPointsDisplay(root);
      
      // Recalculate thief skills to show new percentages
      if (typeof renderThiefSkills === 'function') {
        renderThiefSkills(root);
        updateThiefSkillsAccessibility(root); // NEW LINE - Update skill accessibility
      }
      
      // Update the roller display
      updateThiefSkillRoller(root);
    });
  });
  
  // Load existing allocated points from hidden fields into inputs
  root.querySelectorAll('.thief-point-input').forEach(input => {
    const skill = input.dataset.skill;
    const savedPoints = val(root, `thief_points_${skill}`) || 0;
    input.value = savedPoints;
  });
  
  updateThiefPointsDisplay(root);
  
  // Bind toggle button
  const toggleBtn = root.querySelector('.toggle-thief-points');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const content = root.querySelector('.thief-points-content');
      if (content) {
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
          content.classList.remove('collapsed');
          toggleBtn.textContent = 'Hide Point Allocation';
        } else {
          content.classList.add('collapsed');
          toggleBtn.textContent = 'Show Point Allocation';
        }
      }
    });
  }
}

// Bind thief skill roller events
function bindThiefSkillRoller(root) {
  // Initial render of section visibility
  renderThiefSkillsSection(root);
  const rollButtons = root.querySelectorAll('.roll-thief-skill');
  
  // Function to add roll to thief-specific history
  function addThiefRollToHistory(skillName, roll, target, success) {
    const historyEl = root.querySelector('.thief-roll-history');
    if (!historyEl) return;
    
    // Clear placeholder if present
    if (historyEl.querySelector('[style*="italic"]')) {
      historyEl.innerHTML = '';
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const successText = success ? 'SUCCESS' : 'FAILED';
    const color = success ? '#4ade80' : '#f87171';
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '8px';
    entry.style.paddingBottom = '8px';
    entry.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    entry.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div style="flex:1;">
          <div style="font-weight:600;">${skillName}</div>
          <div style="font-size:11px;opacity:0.7;">Rolled ${roll} / ${target}% needed</div>
        </div>
        <div style="color:${color};font-weight:600;">${successText}</div>
      </div>
      <div style="font-size:10px;opacity:0.5;margin-top:2px;">${timestamp}</div>
    `;
    
    historyEl.insertBefore(entry, historyEl.firstChild);
  }
  
  // Function to update adjusted percentage display
  function updateAdjustedDisplay(item) {
    const modifierInput = item.querySelector('.thief-skill-modifier');
    const adjustedDisplay = item.querySelector('.thief-skill-adjusted');
    const percentageDisplay = item.querySelector('.thief-skill-percentage');
    const skillField = percentageDisplay.getAttribute('data-skill');
    const baseValue = parseInt(val(root, skillField) || 0, 10);
    const modifier = parseInt(modifierInput?.value || 0, 10);
    
    if (modifier !== 0) {
      const adjusted = baseValue + modifier;
      adjustedDisplay.textContent = `→ ${adjusted}%`;
    } else {
      adjustedDisplay.textContent = '';
    }
  }
  
  rollButtons.forEach(btn => {
    const item = btn.closest('.thief-skill-roll-item');
    const modifierInput = item.querySelector('.thief-skill-modifier');
    
    // Update adjusted display when modifier changes
    if (modifierInput) {
      modifierInput.addEventListener('input', () => {
        updateAdjustedDisplay(item);
      });
    }
    
    btn.onclick = () => {
      const skillField = btn.getAttribute('data-skill');
      const skillValue = parseInt(val(root, skillField) || 0, 10);
      const skillName = item.querySelector('div[style*="font-weight:600"]').textContent;
      
      // Get modifier from input
      const modifier = parseInt(modifierInput?.value || 0, 10);
      
      // Get result display element
      const resultDisplay = item.querySelector('.thief-skill-result');
      const adjustedDisplay = item.querySelector('.thief-skill-adjusted');
      
      // Calculate adjusted percentage
      const adjustedSkill = skillValue + modifier;
      
      // Roll d100
      const roll = Math.floor(Math.random() * 100) + 1;
      
      // Determine success/failure
      const success = roll <= adjustedSkill;
      
      // Clear all result displays first
      root.querySelectorAll('.thief-skill-result').forEach(r => {
        r.textContent = '';
        r.title = '';
      });
      
      // Display result for this skill only
      if (success) {
        resultDisplay.textContent = `${roll} - SUCCESS`;
        resultDisplay.style.color = '#4ade80'; // green
      } else {
        resultDisplay.textContent = `${roll} - FAILED`;
        resultDisplay.style.color = '#f87171'; // red
      }
      
      // Add details on hover
      resultDisplay.title = `Roll: ${roll}\nBase: ${skillValue}%${modifier !== 0 ? `\nModifier: ${modifier >= 0 ? '+' : ''}${modifier}%` : ''}\nTarget: ${adjustedSkill}%`;
      
      // Add to thief-specific history
      addThiefRollToHistory(skillName, roll, adjustedSkill, success);
      
      // Clear modifier and adjusted display after roll
      if (modifierInput) {
        modifierInput.value = '';
      }
      adjustedDisplay.textContent = '';
    };
  });
  
  // Clear thief roll history button
  const clearButton = root.querySelector('.clear-thief-roll-history');
  if (clearButton) {
    clearButton.onclick = () => {
      const historyEl = root.querySelector('.thief-roll-history');
      if (historyEl) {
        historyEl.innerHTML = '<div style="color:var(--muted);font-style:italic;">Thief skill roll results will appear here...</div>';
      }
    };
  }
  
  // Update section visibility and percentages when tool tab is opened
  const toolsTab = root.querySelector('[data-vtab="tools"]');
  if (toolsTab) {
    toolsTab.addEventListener('click', () => {
      renderThiefSkillsSection(root);
      updateThiefSkillRoller(root);
	  renderRacialChecks(root);  // Check dwarven abilities when tools tab opens
	  renderCharacterBonuses(root);
    });
  }
  
  // Update percentages initially
  updateThiefSkillRoller(root);
}

// ===== DWARVEN ABILITIES =====
function renderRacialChecks(root) {
  if (!root) return;

  const section = root.querySelector('.racial-checks-section');
  if (!section) return;

  const data = (typeof racialChecksFor === 'function')
    ? racialChecksFor(val(root, 'race') || '') : null;

  if (!data) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  const titleEl = section.querySelector('.racial-checks-title');
  const noteEl  = section.querySelector('.racial-checks-note');
  const grid    = section.querySelector('.racial-checks-grid');
  if (titleEl) titleEl.textContent = data.label;
  if (noteEl)  noteEl.textContent  = data.condition || '';
  if (!grid) return;

  grid.innerHTML = data.checks.map(c => {
    const range = (c.threshold === 1) ? '1' : ('1-' + c.threshold);
    const line  = (c.inverted ? 'Fails on ' : 'Success: ') + range + ' on 1d' + c.die;
    const bits  = [];
    if (c.anyTime) bits.push('May be attempted at any time.');
    if (c.note)    bits.push(c.note);
    return '<div class="detection-ability" style="padding:8px;border:1px solid var(--border);border-radius:4px;">' +
      '<div style="font-weight:600;font-size:12px;">' + escapeHtml(c.name) + '</div>' +
      '<div style="font-size:11px;color:var(--muted);">' + escapeHtml(line) + '</div>' +
      (bits.length
        ? '<div style="font-size:10px;color:var(--muted);font-style:italic;margin-top:2px;">' +
          escapeHtml(bits.join(' ')) + '</div>'
        : '') +
      '<button class="roll-detection" data-name="' + escapeHtml(c.name) + '"' +
        ' data-die="' + c.die + '" data-success="' + c.threshold + '"' +
        (c.inverted ? ' data-inverted="1"' : '') +
        ' style="margin-top:4px;padding:4px 8px;font-size:11px;">Roll d' + c.die + '</button>' +
      '<div class="detection-result" style="margin-top:4px;font-size:11px;font-weight:600;"></div>' +
      '</div>';
  }).join('');

  // Nothing further to do: the saving throw bonus dwarves and gnomes get from
  // Constitution is applied by renderSavingThrows via RACE_SAVE_BONUSES, and
  // shows in the save tooltips as "Race -N".
}

// === Character Bonuses & Abilities Quick Reference ===
function renderCharacterBonuses(root) {
  const section = root.querySelector('.character-bonuses-section');
  if (!section) return;
  
  const combatSection = section.querySelector('.bonuses-combat-section');
  const combatList = section.querySelector('.bonuses-combat-list');
  const defensiveSection = section.querySelector('.bonuses-defensive-section');
  const defensiveList = section.querySelector('.bonuses-defensive-list');
  const specialSection = section.querySelector('.bonuses-special-section');
  const specialList = section.querySelector('.bonuses-special-list');
  
  if (!combatList || !defensiveList || !specialList) return;
  
  // Get character info
  const raceRaw = (val(root, "race") || "").toLowerCase();
  const kitRaw = (val(root, "kit") || "").toLowerCase();
  const charType = (val(root, "char_type") || "single").toLowerCase();
  
  // Normalize race
  let race = null;
  if (/\bdwarf\b/.test(raceRaw)) race = "dwarf";
  else if (/\bhalfling\b/.test(raceRaw)) race = "halfling";
  else if (/\bgnome\b/.test(raceRaw)) race = "gnome";
  else if (/\bhalf[-\s]?elf\b/.test(raceRaw)) race = /\bhalf[-\s]?elf\b/.test(raceRaw) ? "half-elf" : "halfelf";
  else if (/\belf\b/.test(raceRaw)) race = "elf";
  else if (/\bhuman\b/.test(raceRaw)) race = "human";
  
  // Collect all bonuses
  let allCombat = [];
  let allDefensive = [];
  let allSpecial = [];
  
  // Add racial bonuses
  // RACIAL_COMBAT_BONUSES holds ability NAMES now, not prose. racialBonusEntries
  // pulls the wording live from RACIAL_ABILITIES, so this panel and the ability
  // cards can no longer say different things about the same rule -- which they
  // already did, for surprise and for sleep/charm resistance.
  if (race && typeof racialBonusEntries === 'function') {
    racialBonusEntries(race, 'combat')
      .forEach(b => allCombat.push({ ...b, source: "Race" }));
    racialBonusEntries(race, 'defensive')
      .forEach(b => allDefensive.push({ ...b, source: "Race" }));
    racialBonusEntries(race, 'special')
      .forEach(b => allSpecial.push({ ...b, source: "Race" }));
  }
  
  // Get classes and levels
  let classes = [];
  if (charType === 'multi') {
    const class1 = val(root, 'mc_class1') || '';
    const class2 = val(root, 'mc_class2') || '';
    const class3 = val(root, 'mc_class3') || '';
    const level1 = parseInt(val(root, 'mc_level1') || 1, 10);
    const level2 = parseInt(val(root, 'mc_level2') || 1, 10);
    const level3 = parseInt(val(root, 'mc_level3') || 0, 10);
    
    if (class1) classes.push({ clazz: class1.toLowerCase(), level: level1 });
    if (class2) classes.push({ clazz: class2.toLowerCase(), level: level2 });
    if (class3) classes.push({ clazz: class3.toLowerCase(), level: level3 });
  } else if (charType === 'dual') {
    const originalClass = val(root, 'dc_original_class') || '';
    const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
    const newClass = val(root, 'dc_new_class') || '';
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
    const isDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (newLevel <= originalLevel);
    
    if (isDormant) {
      // Only new class abilities available
      if (newClass) classes.push({ clazz: newClass.toLowerCase(), level: newLevel });
    } else {
      // Both classes available
      if (originalClass) classes.push({ clazz: originalClass.toLowerCase(), level: originalLevel });
      if (newClass) classes.push({ clazz: newClass.toLowerCase(), level: newLevel });
    }
  } else {
    // Single class
    const clazz = val(root, "clazz");
    const level = parseInt(val(root, "level") || 1, 10);
    if (clazz) classes.push({ clazz: clazz.toLowerCase(), level: level });
  }
  
  // Add class bonuses for each class
  classes.forEach(({ clazz, level }) => {
    if (CLASS_COMBAT_BONUSES[clazz]) {
      const classBonuses = CLASS_COMBAT_BONUSES[clazz];
      
      classBonuses.combat.forEach(bonus => {
        // Check level requirements including maxLevel for progressive abilities
        if (!bonus.level || level >= bonus.level) {
          // If maxLevel is specified, only show if level is within range
          if (bonus.maxLevel && level > bonus.maxLevel) {
            return; // Skip this bonus, level is too high
          }
          
          let bonusToAdd = { ...bonus, source: "Class" };
          // Handle calculated abilities (like Lay on Hands)
          if (bonus.calculated && bonus.name === "Lay on Hands") {
            bonusToAdd.notes = `${2 * level} HP, once per day`;
          }
          allCombat.push(bonusToAdd);
        }
      });
      
      classBonuses.defensive.forEach(bonus => {
        if (!bonus.level || level >= bonus.level) {
          // If maxLevel is specified, only show if level is within range
          if (bonus.maxLevel && level > bonus.maxLevel) {
            return;
          }
          allDefensive.push({ ...bonus, source: "Class" });
        }
      });
      
      classBonuses.special.forEach(bonus => {
        if (!bonus.level || level >= bonus.level) {
          // If maxLevel is specified, only show if level is within range
          if (bonus.maxLevel && level > bonus.maxLevel) {
            return;
          }
          
          let bonusToAdd = { ...bonus, source: "Class" };
          // Handle calculated abilities
          if (bonus.calculated && bonus.name === "Lay on Hands") {
            bonusToAdd.notes = `${2 * level} HP, once per day`;
          }
          allSpecial.push(bonusToAdd);
        }
      });
    }
  });

  // === Proficiency bonuses (PHB Ch.5) ===
  // Blind-fighting is the only proficiency whose numbers modify COMBAT rather
  // than a proficiency check, so it belongs here beside THAC0 rather than on the
  // proficiency card. Note the AC entry is NOT "no penalty" -- darkness costs
  // him nothing only inside melee range; missile penalties still apply.
  ((root && root._nwps) || []).forEach(p => {
    const pname = String((p && p.name) || '').trim().toLowerCase();
    if (pname !== 'blind-fighting' && pname !== 'blind fighting') return;

    allCombat.push({ name: 'Blind-Fighting \u2014 darkness',
      notes: '\u22122 to attack in total darkness instead of \u22124; \u22121 under starlight or moonlight',
      source: 'Proficiency' });
    allCombat.push({ name: 'Blind-Fighting \u2014 invisible foes',
      notes: 'Attack penalty reduced to \u22122, though he only knows their general location and cannot target them exactly',
      source: 'Proficiency' });
    allDefensive.push({ name: 'Blind-Fighting \u2014 Armor Class',
      notes: 'No AC penalty from darkness against threats within melee reach. Missile penalties still apply.',
      source: 'Proficiency' });
    allSpecial.push({ name: 'Blind-Fighting \u2014 movement and abilities',
      notes: 'Half the normal movement penalty in darkness. Special abilities normally lost in darkness are retained at half effectiveness. Does not allow spell use.',
      source: 'Proficiency' });
  });

  // Add kit bonuses and track replacements
  let replacedAbilities = [];
  if (kitRaw && KIT_COMBAT_BONUSES) {
    // Try to find matching kit
    let kitKey = null;
    Object.keys(KIT_COMBAT_BONUSES).forEach(k => {
      if (kitRaw.includes(k)) kitKey = k;
    });
    
    if (kitKey && KIT_COMBAT_BONUSES[kitKey]) {
      const kitBonuses = KIT_COMBAT_BONUSES[kitKey];
      
      kitBonuses.combat.forEach(bonus => {
        // Track if this replaces a class ability
        if (bonus.replacesClassAbility) {
          replacedAbilities.push(bonus.replacesClassAbility);
        }
        
        // Handle calculated replacements (like Medician's enhanced healing)
        let bonusToAdd = { ...bonus, source: "Kit" };
        if (bonus.name === "Enhanced Healing" && classes.some(c => c.clazz === 'paladin')) {
          const paladinLevel = classes.find(c => c.clazz === 'paladin').level;
          bonusToAdd.notes = `Lay on hands heals ${3 * paladinLevel} HP (3 per level instead of 2)`;
        }
        allCombat.push(bonusToAdd);
      });
      
      kitBonuses.defensive.forEach(bonus => {
        if (bonus.replacesClassAbility) {
          replacedAbilities.push(bonus.replacesClassAbility);
        }
        allDefensive.push({ ...bonus, source: "Kit" });
      });
      
      kitBonuses.special.forEach(bonus => {
        if (bonus.replacesClassAbility) {
          replacedAbilities.push(bonus.replacesClassAbility);
        }
        
        // Handle calculated replacements
        let bonusToAdd = { ...bonus, source: "Kit" };
        if (bonus.name === "Enhanced Healing" && classes.some(c => c.clazz === 'paladin')) {
          const paladinLevel = classes.find(c => c.clazz === 'paladin').level;
          bonusToAdd.notes = `Lay on hands heals ${3 * paladinLevel} HP (3 per level instead of 2)`;
        }
        allSpecial.push(bonusToAdd);
      });
    }
  }
  
  // Filter out replaced class abilities
  if (replacedAbilities.length > 0) {
    allCombat = allCombat.filter(bonus => 
      bonus.source !== "Class" || !replacedAbilities.includes(bonus.name)
    );
    allDefensive = allDefensive.filter(bonus => 
      bonus.source !== "Class" || !replacedAbilities.includes(bonus.name)
    );
    allSpecial = allSpecial.filter(bonus => 
      bonus.source !== "Class" || !replacedAbilities.includes(bonus.name)
    );
  }
  
  // Render bonuses
  combatList.innerHTML = '';
  defensiveList.innerHTML = '';
  specialList.innerHTML = '';
  
  if (allCombat.length > 0) {
    allCombat.forEach(bonus => {
      const div = document.createElement('div');
      div.style.marginBottom = '4px';
      div.innerHTML = `<strong>${bonus.name}</strong> <span style="color:var(--muted);font-size:10px;">(${bonus.source})</span><br>${bonus.notes}`;
      combatList.appendChild(div);
    });
    combatSection.style.display = 'block';
  } else {
    combatSection.style.display = 'none';
  }
  
  if (allDefensive.length > 0) {
    allDefensive.forEach(bonus => {
      const div = document.createElement('div');
      div.style.marginBottom = '4px';
      div.innerHTML = `<strong>${bonus.name}</strong> <span style="color:var(--muted);font-size:10px;">(${bonus.source})</span><br>${bonus.notes}`;
      defensiveList.appendChild(div);
    });
    defensiveSection.style.display = 'block';
  } else {
    defensiveSection.style.display = 'none';
  }
  
  if (allSpecial.length > 0) {
    allSpecial.forEach(bonus => {
      const div = document.createElement('div');
      div.style.marginBottom = '4px';
      div.innerHTML = `<strong>${bonus.name}</strong> <span style="color:var(--muted);font-size:10px;">(${bonus.source})</span><br>${bonus.notes}`;
      specialList.appendChild(div);
    });
    specialSection.style.display = 'block';
  } else {
    specialSection.style.display = 'none';
  }
  
  // Show/hide entire section
  if (allCombat.length > 0 || allDefensive.length > 0 || allSpecial.length > 0) {
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
  }
}

// Delegated, and bound ONCE. The cards are rebuilt whenever the race changes,
// so per-button handlers would be lost on every re-render; the old code got
// away with it only because the six cards were static markup.
function bindRacialChecks(root) {
  const section = root && root.querySelector('.racial-checks-section');
  if (!section || section._rcBound) return;

  section.addEventListener('click', (e) => {
    const btn = e.target.closest('.roll-detection');
    if (btn) {
      const die       = parseInt(btn.dataset.die, 10) || 6;
      const threshold = parseInt(btn.dataset.success, 10) || 0;
      const inverted  = btn.dataset.inverted === '1';
      const name      = btn.dataset.name || 'Check';

      const roll = Math.floor(Math.random() * die) + 1;
      const hit  = roll <= threshold;

      // "hit" means the threshold was met. For an INVERTED check that is the
      // BAD outcome, so the wording and the colour flip -- the arithmetic does
      // not. Getting this backwards would colour a malfunction green.
      const good = inverted ? !hit : hit;
      const word = inverted ? (hit ? 'MALFUNCTION' : 'Works')
                            : (hit ? 'SUCCESS!'    : 'Failed');

      const resultDiv = btn.parentElement.querySelector('.detection-result');
      if (resultDiv) {
        resultDiv.innerHTML = '<span style="color:' + (good ? '#10b981' : '#ef4444') + '">' +
          'd' + die + ': ' + roll + ' \u2014 ' + word + '</span>';
      }
      addDetectionHistory(root, name, roll, die, threshold, good, word);
      return;
    }

    if (e.target.closest('.clear-detection-history')) {
      const history = root.querySelector('.detection-history');
      if (history) {
        history.innerHTML = '<div style="color:var(--muted);font-style:italic;">Rolls will appear here...</div>';
      }
    }
  });

  section._rcBound = true;
}

function addDetectionHistory(root, ability, roll, die, needed, good, word) {
  const history = root.querySelector('.detection-history');
  if (!history) return;

  if (history.querySelector('div[style*="italic"]')) history.innerHTML = '';

  const time = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  const entry = document.createElement('div');
  entry.style.cssText = 'margin-bottom:2px;color:' + (good ? '#10b981' : '#ef4444');
  // textContent, not innerHTML -- ability names come from data but this is a
  // log line with no markup in it and no reason to parse any.
  entry.textContent = '[' + time + '] ' + ability + ': d' + die + '=' + roll +
                      ' (need \u2264' + needed + ') ' + word;

  history.insertBefore(entry, history.firstChild);
  while (history.children.length > 20) history.removeChild(history.lastChild);
}

// updateDwarvenSaves() was deleted here. It queried .dwarf-con-score,
// .dwarf-save-bonus and five .dwarf-save-* elements, none of which have ever
// existed in sheet_template.js -- the Dwarven Abilities section holds the
// detection suite and nothing else. So it computed a Constitution save bonus
// on every call and wrote it nowhere.
//
// Deleted rather than left dormant because it was wrong in two ways that would
// have surfaced the moment anyone added that markup: it re-applied the CON
// bonus to save1-save5 values that ALREADY include it (renderSavingThrows
// applies RACE_SAVE_BONUSES), and it applied the poison bonus unconditionally.
// That last part is right for dwarves and halflings and WRONG for gnomes --
// PHB Ch.2 gives gnomes the bonus against wands, staves, rods and spells only.
// The live code gets that asymmetry right; this would have quietly undone it.

function renderTurnUndeadTable(root) {
  const section = root.querySelector('.turn-undead-section');
  if (!section) return;
  
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  
  // Helper functions
  function isClericClass(className) {
    const c = (className || '').toLowerCase();
    return c.includes('cleric') || c.includes('priest') || c.includes('shaman');
  }
  
  function isPaladinClass(className) {
    const c = (className || '').toLowerCase();
    return c.includes('paladin');
  }
  
  function canTurnUndead(className) {
    return isClericClass(className) || isPaladinClass(className);
  }
  
  let hasTurnUndead = false;
  let effectiveLevel = 0;
  let isPaladin = false;
  
  if (charType === 'multi') {
    // Multi-class: Show if ANY class can turn undead
    const class1 = val(root, 'mc_class1') || '';
    const class2 = val(root, 'mc_class2') || '';
    const class3 = val(root, 'mc_class3') || '';
    const level1 = parseInt(val(root, 'mc_level1') || 0, 10);
    const level2 = parseInt(val(root, 'mc_level2') || 0, 10);
    const level3 = parseInt(val(root, 'mc_level3') || 0, 10);
    
    // Find the cleric/paladin class and use that level
    if (canTurnUndead(class1)) {
      hasTurnUndead = true;
      effectiveLevel = level1;
      isPaladin = isPaladinClass(class1);
    } else if (canTurnUndead(class2)) {
      hasTurnUndead = true;
      effectiveLevel = level2;
      isPaladin = isPaladinClass(class2);
    } else if (canTurnUndead(class3)) {
      hasTurnUndead = true;
      effectiveLevel = level3;
      isPaladin = isPaladinClass(class3);
    }
    
  } else if (charType === 'dual') {
    // Dual-class: Check dormancy
    const originalClass = val(root, 'dc_original_class') || '';
    const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
    const newClass = val(root, 'dc_new_class') || '';
    const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
    const isDormant = (root._isDualClassDormant !== undefined)
      ? root._isDualClassDormant
      : (newLevel <= originalLevel);
    
    if (isDormant) {
      // Dormant: Only new class matters
      if (canTurnUndead(newClass)) {
        hasTurnUndead = true;
        effectiveLevel = newLevel;
        isPaladin = isPaladinClass(newClass);
      }
    } else {
      // Active: Use whichever class can turn undead (or higher level if both can)
      const originalCanTurn = canTurnUndead(originalClass);
      const newCanTurn = canTurnUndead(newClass);
      
      if (originalCanTurn || newCanTurn) {
        hasTurnUndead = true;
        
        // Use the higher level if both can turn
        if (originalCanTurn && newCanTurn) {
          effectiveLevel = Math.max(originalLevel, newLevel);
          // If either is paladin, use paladin rules
          isPaladin = isPaladinClass(originalClass) || isPaladinClass(newClass);
        } else if (originalCanTurn) {
          effectiveLevel = originalLevel;
          isPaladin = isPaladinClass(originalClass);
        } else {
          effectiveLevel = newLevel;
          isPaladin = isPaladinClass(newClass);
        }
      }
    }
    
  } else {
    // Single-class
    const clazz = val(root, 'clazz') || '';
    const level = parseInt(val(root, 'level') || 0, 10);
    
    hasTurnUndead = canTurnUndead(clazz);
    effectiveLevel = level;
    isPaladin = isPaladinClass(clazz);
  }
  
  // Show/hide section
  if (!hasTurnUndead) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  
  // PHB Ch.3, Paladin: "A paladin gains the power to turn undead and fiends
  // when he reaches 3rd level. He affects these monsters the same as does a
  // cleric two levels lower -- for example, at 3rd level he has the turning
  // power of a 1st-level cleric." Below 3rd a paladin cannot turn AT ALL; the
  // old Math.max(1, ...) floor quietly gave a 1st-level paladin the turning
  // power of a 1st-level cleric, three levels early.
  if (isPaladin) {
    if (effectiveLevel < 3) {
      section.style.display = 'none';
      return;
    }
    effectiveLevel = effectiveLevel - 2;
  }
  
  // No level cap. Table 61's 14+ column IS the ceiling, and
  // getTurnUndeadColumn() folds every level from 14 upward into it.
  const turnData = getTurnUndeadColumn(effectiveLevel);
  if (!turnData) return;
  
  // Render the table rows
  const rowsContainer = root.querySelector('.turn-undead-rows');
  if (!rowsContainer) return;
  
  rowsContainer.innerHTML = '';
  
  TURN_UNDEAD_TYPES.forEach(undeadType => {
    const requirement = turnData[undeadType.key];
    
    // Skip if cannot turn
    if (requirement === '-') return;
    
    const row = document.createElement('div');
    row.className = 'turn-undead-row';
    row.style.cssText = 'display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;';
    
    let requirementText = '';
    let requirementColor = '';
    
    if (requirement === 'D' || requirement === 'D*') {
      requirementText = requirement === 'D*' ? '⚡ Destroy +2d4' : '⚡ Destroy';
      requirementColor = '#fbbf24'; // gold
    } else if (requirement === 'T') {
      requirementText = '⚡ Auto Turn';
      requirementColor = '#4ade80'; // green
    } else {
      requirementText = `Roll ${requirement}+`;
      requirementColor = 'var(--text)';
    }
    
    // Zombie, Ghast and Special carry no Hit Dice figure in Table 61 -- print
    // nothing rather than a fabricated number (or the literal "null").
    const hdLine = undeadType.hdLabel
      ? `<div style="font-size:11px;color:var(--muted);">${undeadType.hdLabel}</div>`
      : '';
    
    row.innerHTML = `
      <div style="flex:1;">
        <div style="font-weight:600;font-size:13px;">${undeadType.name}</div>
        ${hdLine}
      </div>
      <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
        <div style="font-size:13px;font-weight:600;color:${requirementColor};min-width:110px;text-align:center;">${requirementText}</div>
        <button class="turn-undead-btn" data-undead="${undeadType.key}" data-requirement="${requirement}" data-name="${undeadType.name}" style="padding:6px 16px;">Turn</button>
      </div>
    `;
    
    rowsContainer.appendChild(row);
  });
}

/**
 * Get spell slot table for a class name
 */
function getSpellTableForClass(className) {
  const clazz = (className || '').toLowerCase();
  
  if (clazz.includes("cleric") || clazz.includes("priest")) return SPELL_SLOTS_TABLES.cleric;
  if (clazz.includes("druid")) return SPELL_SLOTS_TABLES.druid;
  if (clazz.includes("shaman")) return SPELL_SLOTS_TABLES.cleric;
  if (clazz.includes("hb_dpaladin")) return SPELL_SLOTS_TABLES.hb_dpaladin;
  if (clazz.includes("demipaladin")) return SPELL_SLOTS_TABLES.demipaladin;
  if (clazz.includes("paladin")) return SPELL_SLOTS_TABLES.paladin;
  if (clazz.includes("ranger")) return SPELL_SLOTS_TABLES.ranger;
  if (clazz.includes("mage") || clazz.includes("wizard") || 
      clazz.includes("abjurer") || clazz.includes("conjurer") || 
      clazz.includes("enchanter") || clazz.includes("invoker") || 
      clazz.includes("necromancer") || clazz.includes("transmuter") || 
      clazz.includes("diviner") || clazz.includes("evoker") ||
      clazz.includes("illusionist")) return SPELL_SLOTS_TABLES.mage;
  if (clazz.includes("bard")) return SPELL_SLOTS_TABLES.bard;
  
  return null;
}

// Bind Turn Undead events
function bindTurnUndead(root) {
  // Function to add result to history
  function addTurnUndeadToHistory(undeadName, requirement, roll, numTurned, wasDestroyed, bonusTurned) {
    const historyEl = root.querySelector('.turn-undead-history');
    if (!historyEl) return;
    
    // Clear placeholder if present
    if (historyEl.querySelector('[style*="italic"]')) {
      historyEl.innerHTML = '';
    }
    
    const timestamp = new Date().toLocaleTimeString();
    let resultText = '';
    let color = '';
    
    if (wasDestroyed) {
      resultText = `DESTROYED ${numTurned}`;
      if (bonusTurned) resultText += ` (+${bonusTurned} turned)`;
      color = '#fbbf24'; // gold
    } else if (requirement === 'T') {
      resultText = `TURNED ${numTurned}`;
      color = '#4ade80'; // green
    } else if (roll >= parseInt(requirement, 10)) {
      resultText = `SUCCESS - ${numTurned} turned`;
      color = '#4ade80'; // green
    } else {
      resultText = 'FAILED';
      color = '#f87171'; // red
    }
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '8px';
    entry.style.paddingBottom = '8px';
    entry.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    entry.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div style="flex:1;">
          <div style="font-weight:600;">${undeadName}</div>
          ${roll ? `<div style="font-size:11px;opacity:0.7;">Rolled ${roll} (needed ${requirement}+)</div>` : ''}
        </div>
        <div style="color:${color};font-weight:600;font-size:12px;text-align:right;">${resultText}</div>
      </div>
      <div style="font-size:10px;opacity:0.5;margin-top:2px;">${timestamp}</div>
    `;
    
    historyEl.insertBefore(entry, historyEl.firstChild);
  }
  
  // Delegate event handler for turn buttons
  root.addEventListener('click', (e) => {
    if (!e.target.classList.contains('turn-undead-btn')) return;
    
    const btn = e.target;
    const undeadName = btn.getAttribute('data-name');
    const requirement = btn.getAttribute('data-requirement');
    
    // PHB Ch.9: "A successful turn or dispel affects 2d6 undead." That is a
    // COUNT OF CREATURES, not a total of Hit Dice -- hence numTurned, not
    // hdTurned. The old data-hd read was parsed and then never used.
    let roll = null;
    let numTurned = 0;
    let bonusTurned = 0;
    let wasDestroyed = false;
    
    if (requirement === 'D' || requirement === 'D*') {
      numTurned = rollDice(2, 6);
      wasDestroyed = true;
      // Table 61 footnote *: an additional 2d4 creatures of this type are
      // turned, over and above the 2d6 destroyed.
      if (requirement === 'D*') bonusTurned = rollDice(2, 4);
    } else if (requirement === 'T') {
      numTurned = rollDice(2, 6);
    } else {
      roll = rollDice(1, 20);
      if (roll >= parseInt(requirement, 10)) {
        numTurned = rollDice(2, 6);
      }
    }
    
    addTurnUndeadToHistory(undeadName, requirement, roll, numTurned, wasDestroyed, bonusTurned);
  });
  
  // Clear history button
  const clearButton = root.querySelector('.clear-turn-undead-history');
  if (clearButton) {
    clearButton.onclick = () => {
      const historyEl = root.querySelector('.turn-undead-history');
      if (historyEl) {
        historyEl.innerHTML = '<div style="color:var(--muted);font-style:italic;">Turn undead results will appear here...</div>';
      }
    };
  }
  
  // Update table when tools tab or level/class changes
  const toolsTab = root.querySelector('[data-vtab="tools"]');
  if (toolsTab) {
    toolsTab.addEventListener('click', () => {
      renderTurnUndeadTable(root);
    });
  }
  
  // Initial render
  renderTurnUndeadTable(root);
}

// Helper function to roll dice
function rollDice(numDice, numSides) {
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * numSides) + 1;
  }
  return total;
}

// ===== MULTI-CLASS AND DUAL-CLASS SUPPORT =====

/**
 * Handle character type dropdown changes
 * Show/hide appropriate fields based on selection
 */
function handleCharacterTypeChange(root) {
  if (!root) return;
  
  const charType = (val(root, 'char_type') || 'single').toLowerCase();
  
  // Get field groups
  const singleFields = root.querySelectorAll('.single-class-field');
  const singleDualFields = root.querySelectorAll('.single-dual-field');
  const singleMultiHP = root.querySelectorAll('.single-multi-hp');
  const dualHPFields = root.querySelectorAll('.dual-hp-fields');
  const multiFields = root.querySelector('.multi-class-fields');
  const dualFields = root.querySelector('.dual-class-fields');
  
  // Hide all first
  singleFields.forEach(f => f.style.display = 'none');
  singleDualFields.forEach(f => f.style.display = 'none');
  singleMultiHP.forEach(f => f.style.display = 'none');
  dualHPFields.forEach(f => f.style.display = 'none');
  if (multiFields) multiFields.style.display = 'none';
  if (dualFields) dualFields.style.display = 'none';
  
  // Show appropriate fields
  if (charType === 'single') {
    singleFields.forEach(f => f.style.display = '');
    singleDualFields.forEach(f => f.style.display = '');
    singleMultiHP.forEach(f => f.style.display = '');
  } else if (charType === 'multi') {
    singleMultiHP.forEach(f => f.style.display = '');
    if (multiFields) multiFields.style.display = '';
    updateMultiClassCalculations(root);
  } else if (charType === 'dual') {
    singleDualFields.forEach(f => f.style.display = '');
    dualHPFields.forEach(f => f.style.display = '');
    if (dualFields) dualFields.style.display = '';
    updateDualClassCalculations(root);
  }
  
  // Update XP field note based on character type
  const xpNote = root.querySelector('.xp-note');
  if (xpNote) {
    if (charType === 'dual') {
      const newClass = val(root, 'dc_new_class') || '';
      xpNote.textContent = newClass ? `(${newClass} only)` : '';
    } else {
      xpNote.textContent = '';
    }
  }
  
  // Restore proper class name when switching away from multi/dual
  if (charType === 'single') {
    const currentClazz = val(root, 'clazz');
    // If clazz has multi-class or dual-class formatting, extract the main class
    if (currentClazz.includes('/')) {
      // For dual-class, use the new class (the one they're actively advancing)
      const newClass = val(root, 'dc_new_class');
      if (newClass) {
        val(root, 'clazz', newClass);
      } else {
        // For multi-class, use the first class
        const class1 = val(root, 'mc_class1');
        if (class1) {
          val(root, 'clazz', class1);
        }
      }
    }
  }
  
  // Recalculate everything
  recalculateAll(root);
}

/**
 * Calculate total HP for dual-class character
 */
function calculateDualClassHP(root) {
  if (!root) return;
  
  const originalHP = parseInt(val(root, 'dc_original_hp') || 0, 10);
  const newHP = parseInt(val(root, 'dc_new_hp') || 0, 10);
  const totalHP = originalHP + newHP;
  
  // Update ALL hp fields (both single/multi and dual versions)
  const hpFields = root.querySelectorAll('[data-field="hp"]');
  hpFields.forEach(field => {
    field.value = totalHP;
  });
  
  // Also update current HP display if needed
  renderCurrentHP(root);
  renderCombatQuickReference(root);
}

/**
 * Update multi-class calculations and validation
 */
function updateMultiClassCalculations(root) {
  if (!root) return;
  
  const race = (val(root, 'race') || '').trim().toLowerCase();
  const class1 = val(root, 'mc_class1') || '';
  const class2 = val(root, 'mc_class2') || '';
  const class3 = val(root, 'mc_class3') || '';
  const level1 = parseInt(val(root, 'mc_level1') || 1, 10);
  const level2 = parseInt(val(root, 'mc_level2') || 1, 10);
  const level3 = parseInt(val(root, 'mc_level3') || 0, 10);
  
  // If class3 is empty or "none", clear level3
  if (!class3 || class3 === 'none') {
    val(root, 'mc_level3', '');
  }
  const totalXP = parseInt(val(root, 'xp') || 0, 10);
  
  const validationMsg = root.querySelector('.mc-validation-message');
  
  // Build classes array
  const classes = [];
  if (class1) classes.push(class1);
  if (class2) classes.push(class2);
  if (class3) classes.push(class3);
  
  // Validate race can multi-class
  if (!canRaceMultiClass(race)) {
    if (validationMsg) {
      validationMsg.innerHTML = `<span style="color:#d9534f;">⚠ ${escapeHtml(race || 'This race')} cannot multi-class. Only demihumans can multi-class.</span>`;
      validationMsg.style.background = 'rgba(217, 83, 79, 0.1)';
      validationMsg.style.border = '1px solid rgba(217, 83, 79, 0.3)';
    }
    return;
  }
  
  // Validate class combination
  if (classes.length < 2) {
    if (validationMsg) {
      validationMsg.innerHTML = `<span style="color:#f0ad4e;">⚠ Select at least 2 classes for multi-class character.</span>`;
      validationMsg.style.background = 'rgba(240, 173, 78, 0.1)';
      validationMsg.style.border = '1px solid rgba(240, 173, 78, 0.3)';
    }
    return;
  }
  
  if (!isValidMultiClassCombo(race, classes)) {
    if (validationMsg) {
      validationMsg.innerHTML = `<span style="color:#d9534f;">⚠ Invalid combination: ${classes.join('/')} is not allowed for ${escapeHtml(race)}.</span>`;
      validationMsg.style.background = 'rgba(217, 83, 79, 0.1)';
      validationMsg.style.border = '1px solid rgba(217, 83, 79, 0.3)';
    }
    return;
  }
  
  // Valid combination!
  if (validationMsg) {
    validationMsg.innerHTML = `<span style="color:#5cb85c;">✓ Valid ${classes.join('/')} combination for ${escapeHtml(race)}.</span>`;
    validationMsg.style.background = 'rgba(92, 184, 92, 0.1)';
    validationMsg.style.border = '1px solid rgba(92, 184, 92, 0.3)';
  }
  
  // Split XP among classes
  const numClasses = classes.length;
  const xpPerClass = splitXP(totalXP, numClasses);
  
  // Update XP display for each class
  if (class1) val(root, 'mc_xp1', xpPerClass.toLocaleString());
  if (class2) val(root, 'mc_xp2', xpPerClass.toLocaleString());
  if (class3) val(root, 'mc_xp3', xpPerClass.toLocaleString());

  // Per-class next-level advisement. PHB Ch.8: reaching the threshold is not
  // the same as advancing -- the DM may require training first, and may rule
  // that circumstances do not permit it -- so this advises and never acts.
  const mcNextFor = (className, lvl) => {
    const t = (typeof getXPTable === 'function') ? getXPTable(className) : null;
    const n = parseInt(lvl, 10);
    if (!Array.isArray(t) || isNaN(n)) return '\u2014';
    if (typeof t[n] !== 'number') return 'Max level';
    const needed = t[n] - xpPerClass;
    return needed <= 0 ? "Enough XP \u2014 DM's call" : needed.toLocaleString();
  };
  val(root, 'mc_xp_next1', class1 ? mcNextFor(class1, level1) : '');
  val(root, 'mc_xp_next2', class2 ? mcNextFor(class2, level2) : '');
  val(root, 'mc_xp_next3', class3 ? mcNextFor(class3, level3) : '');
  
  // Update the main "Class" field to show multi-class format
  const classDisplay = formatMultiClassDisplay(classes, [level1, level2, level3].slice(0, numClasses));
  val(root, 'clazz', classDisplay);
  
  // Update thief points display
  updateThiefPointsDisplay(root);
  
  // Recalculate stats with multi-class rules
  recalculateAll(root);
}

/**
 * Recalculate all stats (helper function)
 */
function recalculateAll(root) {
  if (!root) return;
  
  // Call all the existing calculation functions
  if (typeof renderAbilityBonuses === 'function') renderAbilityBonuses(root);
  if (typeof renderSavingThrows === 'function') renderSavingThrows(root);
  if (typeof renderAttackMatrix === 'function') renderAttackMatrix(root);
  if (typeof renderSpellSlots === 'function') renderSpellSlots(root);
  if (typeof renderXPProgression === 'function') renderXPProgression(root);
  if (typeof renderPrimeRequisiteBonus === 'function') renderPrimeRequisiteBonus(root);
  if (typeof renderThiefSkills === 'function') renderThiefSkills(root);
  if (typeof renderThiefSkillsSection === 'function') renderThiefSkillsSection(root);
  if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
  if (typeof renderAnimalEmpathy === 'function') renderAnimalEmpathy(root);
  if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
  if (typeof renderTurnUndeadTable === 'function') renderTurnUndeadTable(root);
  if (typeof renderCurrentHP === 'function') renderCurrentHP(root);
  if (typeof renderHitDice === 'function') renderHitDice(root);
  if (typeof renderAttacksPerRound === 'function') renderAttacksPerRound(root);
  if (typeof renderRevivals === 'function') renderRevivals(root);
  // renderCoinWeight MUST run before renderEncumbrance -- encumbrance reads the
  // coin_weight field that this writes. Without it, flipping the coin weight
  // toggle recalculates encumbrance from the previous divisor's number, and the
  // change appears not to work until the player happens to edit a coin field.
  if (typeof renderCoinWeight === 'function') renderCoinWeight(root);
  // Value, not weight -- no ordering dependency, unlike the pair around it.
  if (typeof renderValuablesValue === 'function') renderValuablesValue(root);
  if (typeof renderEncumbrance === 'function') renderEncumbrance(root);
  if (typeof renderProficiencySlots === 'function') renderProficiencySlots(root);
  if (typeof renderMovementRate === 'function') renderMovementRate(root);
  // AFTER renderMovementRate, always. Both panels multiply against
  // root._currentMovement, which that function is what stashes -- run either one
  // ahead of it and every rate silently reads zero, which is exactly what the
  // climb rate did while the movement section was blanked.
  // renderCombatQuickReference stays last in this list regardless; see below.
  if (typeof renderClimbingPanel === 'function') renderClimbingPanel(root);
  if (typeof renderOverlandPanel === 'function') renderOverlandPanel(root);
  if (typeof renderArmorClass === 'function') renderArmorClass(root);
  if (typeof renderClassAbilities === 'function') renderClassAbilities(root);
  if (typeof renderCharacterBonuses === 'function') renderCharacterBonuses(root);
  // PHB Ch.12 henchman limits. IN recalculateAll rather than bolted onto the
  // handful of sites that refresh advisories by hand, because the lifetime
  // count moves with CHARISMA and the level check moves with the character's
  // LEVEL -- neither of which touches a henchman card, and both of which land
  // here. renderArmorRestrictions is already in this list for the same reason.
  // The henchman list gets its own hook as well; see the add-henchman wiring.
  if (typeof renderHenchmanLimits === 'function') renderHenchmanLimits(root);
  // LAST, and it was missing entirely. The Quick Reference reads THAC0, AC and
  // Strength adjustments that the calls above produce, so it has to run after
  // them -- but it was never in recalculateAll at all, only on the seventeen
  // paths that touch a weapon row. Anything that recalculated WITHOUT touching
  // a weapon left it stale: toggling an optional rule, changing a level or an
  // ability score. Unequipping and re-equipping a weapon "fixed" it only
  // because that is one of the seventeen.
  // It also repaints the proficiency badges and stripes as a side effect, so
  // those were going stale in exactly the same cases.
  if (typeof renderCombatQuickReference === 'function') renderCombatQuickReference(root);
  // BEFORE renderToolsSubtabs below, which reads this section's inline display
  // to decide whether the tab exists at all. It depends on the weapons list, so
  // it belongs in recalculateAll rather than bindSheet alone -- adding, removing
  // or renaming a weapon must be able to make the tab appear and disappear.
  if (typeof renderWeaponBreakage === 'function') renderWeaponBreakage(root);
  if (typeof renderArmorFitting === 'function') renderArmorFitting(root);
  if (typeof renderPHBR1OnlyControls === 'function') renderPHBR1OnlyControls(root);

  // DEAD LAST, and deliberately after the Quick Reference. This does not break
  // the "Quick Reference stays last" rule -- that rule is about reading THAC0,
  // AC and Strength adjustments the calls above produce, and the sub-tab strip
  // produces and reads none of them. It only needs to run after everything that
  // can change whether a Tools panel APPLIES, and last is the one position that
  // guarantees it without having to keep track of which renderers those are.
  if (typeof renderToolsSubtabs === 'function') renderToolsSubtabs(root);

  // After everything that can hide a section, so it sees the final answer.
  if (typeof renderSectionGroups === 'function') renderSectionGroups(root);
}

/**
 * Update dual-class calculations and validation
 */
function updateDualClassCalculations(root) {
  if (!root) return;
  
  const race = (val(root, 'race') || '').trim().toLowerCase();
  const originalClass = val(root, 'dc_original_class') || '';
  const originalLevel = parseInt(val(root, 'dc_original_level') || 0, 10);
  const newClass = val(root, 'dc_new_class') || '';
  const newLevel = parseInt(val(root, 'dc_new_level') || 1, 10);
  
  const statusMsg = root.querySelector('.dc-status-message');
  
  // Validate race can dual-class
  if (!canDualClass(race)) {
    if (statusMsg) {
      statusMsg.innerHTML = `<span style="color:#d9534f;">⚠ Only humans can dual-class.</span>`;
      statusMsg.style.background = 'rgba(217, 83, 79, 0.1)';
      statusMsg.style.border = '1px solid rgba(217, 83, 79, 0.3)';
    }
    return;
  }
  
  // Need both classes selected
  if (!originalClass || !newClass) {
    if (statusMsg) {
      statusMsg.innerHTML = `<span style="color:#f0ad4e;">⚠ Select both original and new class.</span>`;
      statusMsg.style.background = 'rgba(240, 173, 78, 0.1)';
      statusMsg.style.border = '1px solid rgba(240, 173, 78, 0.3)';
    }
    return;
  }
  
  // Validate prime requisites
  const errors = validateDualClassRequirements(root, originalClass, newClass);

  // A class whose prime requisites cannot be resolved is reported ALONGSIDE the
  // status, never in place of it. getClassPrimeRequisites returns [] for an
  // unrecognised name, and an empty list runs zero checks inside
  // validateDualClassRequirements -- so silence there means "not checked",
  // never "passed". Homebrew class names are legitimate, so this must not
  // suppress the dormancy banner the way a real failure does.
  const unchecked = [originalClass, newClass].filter(
    c => c && !getClassPrimeRequisites(c).length);
  const uncheckedNote = unchecked.length
    ? `<br><span style="color:#f0ad4e;">Prime requisites unknown for ${escapeHtml(unchecked.join(' and '))} \u2014 that requirement was not checked.</span>`
    : '';

  if (errors.length > 0) {
    if (statusMsg) {
      statusMsg.innerHTML = `<span style="color:#d9534f;">\u26A0 Prime Requisite Requirements Not Met:<br>${errors.map(escapeHtml).join('<br>')}</span>${uncheckedNote}`;
      statusMsg.style.background = 'rgba(217, 83, 79, 0.1)';
      statusMsg.style.border = '1px solid rgba(217, 83, 79, 0.3)';
    }
    return;
  }
  
  // Get status (dormant or active)
  const status = getDualClassStatus(originalClass, originalLevel, newClass, newLevel);
  
  if (statusMsg) {
    const color = status.type === 'success' ? '#5cb85c' : '#f0ad4e';
    statusMsg.innerHTML = `<span style="color:${color};">${escapeHtml(status.message)}</span>${uncheckedNote}`;
    statusMsg.style.background = status.type === 'success' 
      ? 'rgba(92, 184, 92, 0.1)' 
      : 'rgba(240, 173, 78, 0.1)';
    statusMsg.style.border = status.type === 'success'
      ? '1px solid rgba(92, 184, 92, 0.3)'
      : '1px solid rgba(240, 173, 78, 0.3)';
  }
  
  // Update the main "Class" field to show dual-class format
  const classDisplay = formatDualClassDisplay(originalClass, originalLevel, newClass, newLevel);
  val(root, 'clazz', classDisplay);
  
  // Store dormancy state for other calculations to use
  root._isDualClassDormant = status.isDormant;
  root._dualClassOriginal = { class: originalClass, level: originalLevel };
  root._dualClassNew = { class: newClass, level: newLevel };
  
  // Update XP field note
  const xpNote = root.querySelector('.xp-note');
  if (xpNote) {
    xpNote.textContent = `(${newClass} only)`;
  }
  
  // Calculate total HP from original + new
  calculateDualClassHP(root);
  
  // Update thief points display
  updateThiefPointsDisplay(root);
  
  // Recalculate stats with dual-class rules
  recalculateAll(root);
}
