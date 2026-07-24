// Adding temp variable for sync testing
const APP_JS_BUILD = 'prod-1';

// Shortcuts & constants
const $ = id => document.getElementById(id);
const CHAR_MAP_KEY = 'adnd2e_characters_map';
const KV_CONFIG_KEY = 'adnd2e_kv_config';
// Upload gate. Only rejects the absurd -- anything under this is cropped and
// downscaled to AVATAR_OUT_* regardless of what came in, so refusing a 3MB
// photo would mean refusing work the cropper is about to do anyway. The old
// 1MB cap rejected files the app could handle perfectly well.
const AVATAR_MAX_SIZE = 12 * 1024 * 1024; // 12 MB

// Stored portrait dimensions. 3:2, matching the .avatar box and the print
// plate's portrait frame, so a saved portrait fills all three with no
// letterboxing. 660px across a 150pt printed frame is roughly 317 dpi -- past
// the point where more pixels show on paper.
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

// ===== KV Sync — config helpers =====
// KV settings are stored separately from character data so they persist
// independently of character saves and exports.
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
  else if (/\bhalf[-\s]?orc\b/.test(raceRaw)) raceKey = "halforc";

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

  renderWisdomSaveAdjustments(root);
  renderWisdomPriestEffects(root); 
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
function getThac0(clazz, level) {
  level = Math.min(Math.max(parseInt(level, 10) || 1, 1), 20); // clamp 1-20
  const cat = (typeof getClassCategory === 'function') ? getClassCategory(clazz) : null;
  const table = cat && THAC0_TABLES[cat];
  return table ? table[level - 1] : 20;   // unrecognised class -> unmodified 20
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
          slots = slots.map((s, i) => s + bonus[i]);
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

  // Hard whitelist for Wisdom bonuses: cleric & druid only
  let appliedBonus = null;
  if ((clazz.includes("cleric") || clazz.includes("druid")) && WIS_BONUS_SPELLS[wis]) {
    const bonus = WIS_BONUS_SPELLS[wis];
    slots = slots.map((s,i) => s + bonus[i]);
    appliedBonus = bonus;
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

  // Helper for displayed "needed" values (d20 space)
  const clampD20 = n => Math.max(1, Math.min(20, n));

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
      const needed  = clampD20(rawMode);

      const tooltip = `AC ${ac} — ${label}
Need to roll: ${needed}
THAC0 ${thac0Mode} (base ${thac0Base}, ${adjLabel} ${adjSign})
Unmodified: ${clampD20(rawBase)} (raw ${rawBase})`;

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
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes val" placeholder="" value="'+(data.notes||'')+'" style="width:100%">' +
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
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes val" placeholder="" value="'+(data.notes||'')+'" style="width:100%">' +
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
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes val" placeholder="" value="'+(data.notes||'')+'" style="width:100%">' +
    '</div>';
  
  el.querySelector('.rm').onclick=()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,textarea').forEach(inp=>{
    inp.addEventListener('input',()=>{
      onChange && onChange();
    });
  });
  return el;
}
function makeSpellNode(data={}, onChange){
  const el=document.createElement('div');
  el.className='item';
  el.innerHTML=
    '<input class="title" placeholder="Spell" value="'+(data.name||'')+'">' +
    '<input class="val" placeholder="Level" value="'+(data.level||'')+'">' +
    '<button class="rm">Remove</button>';
  el.querySelector('.rm').onclick=()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,textarea').forEach(inp=>
    inp.addEventListener('input',()=>onChange && onChange())
  );
  return el;
}
function makeMemSpellNode(data={}, onChange){
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.style.padding = '12px';
  
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Spell Name</div>' +
      '<div style="width:50px;text-align:center;">Level</div>' +
      '<div style="width:70px;"></div>' + // Space for Details button
      '<div style="width:55px;"></div>' + // Space for Cast button
      '<div style="width:75px;"></div>' + // Space for Forget button
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:stretch;">' +
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1;font-weight:bold;">' +
      '<input class="level" type="text" placeholder="" value="'+(data.level||'')+'" style="width:50px;text-align:center;" readonly>' +
      '<button class="toggle-spell-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
      '<button class="cast-spell" style="padding:8px 12px;font-size:11px;background:rgba(100,150,255,0.3);border:1px solid rgba(100,150,255,0.5);">'+(data.cast ? 'Uncast' : 'Cast')+'</button>' +
      '<button class="rm">Forget</button>' +
    '</div>' +
    '<div class="spell-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">School/Sphere</label>' +
          '<input class="school-sphere" placeholder="" value="'+(data.schoolSphere||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Casting Time</label>' +
          '<input class="cast-time" placeholder="" value="'+(data.castTime||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Range</label>' +
          '<input class="range" placeholder="" value="'+(data.range||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Duration</label>' +
          '<input class="duration" placeholder="" value="'+(data.duration||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Components</label>' +
          '<input class="components" placeholder="" value="'+(data.components||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Save</label>' +
          '<input class="save" placeholder="" value="'+(data.save||'')+'" style="width:100%;"></div>' +
      '</div>' +
      '<div style="margin-bottom:8px;">' +
        '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Description</label>' +
        '<textarea class="description" placeholder="" style="width:100%;min-height:80px;resize:vertical;">'+(data.description||'')+'</textarea>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Personal Notes</label>' +
        '<textarea class="notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;">'+(data.notes||'')+'</textarea>' +
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
  
  // Cast button
  const castBtn = el.querySelector('.cast-spell');
  castBtn.onclick = () => {
    const root = el.closest('.sheet-container');
    const isCast = el.classList.contains('spell-cast');

    // Find the spell name node (adjust selectors if yours differ)
    const nameEl = el.querySelector('.spell-name, .title, .name');

    if (isCast) {
      // Uncast the spell
      el.classList.remove('spell-cast');
      el.style.opacity = '1';

      // ⬇️ strike-through removed ONLY from the name (not the whole row)
      if (nameEl) nameEl.style.textDecoration = 'none';

      castBtn.textContent = 'Cast';
      castBtn.style.background = 'rgba(100,150,255,0.3)';
      castBtn.style.borderColor = 'rgba(100,150,255,0.5)';
    } else {
      // Cast the spell
      el.classList.add('spell-cast');
      el.style.opacity = '0.5';

      // ⬇️ strike-through applied ONLY to the name
      if (nameEl) nameEl.style.textDecoration = 'line-through';

      castBtn.textContent = 'Uncast';
      castBtn.style.background = 'rgba(100,255,100,0.3)';
      castBtn.style.borderColor = 'rgba(100,255,100,0.5)';
    }

    onChange && onChange();
    if (root) renderMemorizedSpellStatus(root);
  };
  
  // Apply cast styling if loaded as cast
  if (data.cast) {
    el.classList.add('spell-cast');
    el.style.opacity = '0.5';

    // ⬇️ strike-through only on the name
    const nameEl = el.querySelector('.spell-name, .title, .name');
    if (nameEl) nameEl.style.textDecoration = 'line-through';

    castBtn.style.background = 'rgba(100,255,100,0.3)';
    castBtn.style.borderColor = 'rgba(100,255,100,0.5)';
  }
  
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
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.style.padding = '12px';
  
el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Spell Name</div>' +
      '<div style="width:50px;text-align:center;">Level</div>' +
      '<div style="width:70px;"></div>' + // Space for Details button
      '<div style="width:80px;"></div>' + // Space for Memorize button
      '<div style="width:75px;"></div>' + // Space for Move to... button
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
	'<div style="display:flex;gap:8px;align-items:stretch;">' +
	  '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1;font-weight:bold;">' +
	  '<input class="level" type="number" placeholder="" value="'+(data.level||'')+'" style="width:50px;text-align:center;">' +
	  '<button class="toggle-spellbook-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
	  '<button class="memorize-spell" style="padding:8px 12px;font-size:11px;background:var(--accent);border:none;border-radius:4px;cursor:pointer;">Memorize</button>' +
	  '<button class="move-to-spellbook" style="padding:8px 12px;font-size:11px;">Move to...</button>' +
	  '<button class="rm">Remove</button>' +
	'</div>' +
	'<div class="free-spell-row" style="display:none;margin-top:6px;font-size:12px;">' +
	  '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">' +
	    '<input type="checkbox" class="free-spell-check">' +
	    '<span class="free-spell-label" style="color:var(--muted);"></span>' +
	  '</label>' +
	'</div>' +
	'<div class="spellbook-details" style="display:none;margin-top:8px;">' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:4px;">' +
        (data.schoolSphere ? data.schoolSphere + ' | ' : '') +
        (data.castTime || '') + ' | ' +
        (data.range || '') + ' | ' +
        (data.duration || '') +
      '</div>' +
      '<div style="font-size:12px;white-space:pre-wrap;max-height:200px;overflow-y:auto;">' +
        (data.description || 'No description available.') +
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
    });
  }
  
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
  
  // Wire up inputs
  el.querySelectorAll('input').forEach(inp =>{
    inp.addEventListener('input', ()=>{
      onChange && onChange();
      // Update summary when name or level changes
	  if (inp.classList.contains('level') || inp.classList.contains('title')) {
        const root = inp.closest('.sheet-container');
        if (root && inp.classList.contains('level')) {
          sortSpellbook(root);
          // Reapply current filter
          const filter = root.querySelector('.spellbook-level-filter');
          if (filter) {
            filterSpellbook(root, filter.value);
          }
        }
      }
    });
  });
  
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
    const levelA = parseInt(a.querySelector('.level')?.value || 999, 10);
    const levelB = parseInt(b.querySelector('.level')?.value || 999, 10);
    
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
}
function makeItemNode(data={}, onChange){
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Item</div>' +
      '<div style="width:80px;text-align:center;">Quantity</div>' +
      '<div style="width:80px;text-align:center;">Weight (lbs)</div>' +
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;">' +
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1">' +
      '<input class="qty" type="number" placeholder="" value="'+(data.qty||'')+'" style="width:80px;text-align:center;">' +
      '<input class="weight" type="number" step="0.1" placeholder="" value="'+(data.weight||'')+'" style="width:80px;text-align:center;">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<input class="notes" placeholder="" value="'+(data.notes||'')+'" style="width:100%">' +
    '</div>';
  el.querySelector('.rm').onclick = ()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input').forEach(inp =>
    inp.addEventListener('input', ()=>onChange && onChange())
  );
  return el;
}
function makeValuableNode(data={}, onChange){
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.style.padding = '12px';
  
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Item Name</div>' +
      '<div style="width:60px;text-align:center;">Qty</div>' +
      '<div style="width:80px;text-align:center;">Weight (ea)</div>' +
      '<div style="width:70px;"></div>' + // Remove button space
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:stretch;margin-bottom:8px;">' +
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1;">' +
      '<input class="qty" type="number" placeholder="" value="'+(data.qty||'')+'" style="width:60px;text-align:center;">' +
      '<input class="weight" type="number" step="0.1" placeholder="" value="'+(data.weight||'')+'" style="width:80px;text-align:center;">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<div style="display:flex;gap:6px;">' +
        '<input class="notes" placeholder="" value="'+(data.notes||'')+'" style="flex:1">' +
        '<div style="display:flex;flex-direction:column;width:100px;">' +
          '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Value (ea)</label>' +
          '<input class="value-each" type="text" placeholder="" value="'+(data.valueEach||'')+'" style="width:100%">' +
        '</div>' +
      '</div>' +
    '</div>';
  
  // Remove button triggers onChange
  el.querySelector('.rm').onclick = ()=>{ 
    el.remove(); 
    onChange && onChange(); 
  };
  
  // ALL inputs trigger onChange (which includes renderEncumbrance)
  el.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      onChange && onChange();
    });
  });
  
  return el;
}

function makeArmorNode(data={}, onChange){
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';

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

  const slots = ['Armor','Shield','Helmet','Bracers','Gauntlets','Boots','Cloak','Belt','Ring','Other'];
  const slotOpts = slots.map(s => opt(s, s, data.armorType || 'Armor')).join('');

  el.innerHTML =
    // --- Identity row: always visible, mirrors the weapon card ---
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="width:60px;text-align:center;">Equipped</div>' +
      '<div style="flex:1;">Armor</div>' +
      '<div style="flex:2;">Notes</div>' +
      '<div style="width:148px;"></div>' +
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:6px;">' +
      '<input type="checkbox" class="equipped" '+(data.equipped?'checked':'')+' style="width:60px;margin:auto;">' +
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1">' +
      '<input class="notes" placeholder="" value="'+(data.notes||'')+'" style="flex:2">' +
      '<button class="toggle-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
      '<button class="rm">Remove</button>' +
    '</div>' +

    '<div class="armor-details" style="display:none;">' +
      '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
        '<div style="flex:1;text-align:center;">Type</div>' +
        '<div style="width:100px;text-align:center;">Worn As</div>' +
        '<div style="width:70px;text-align:center;">Base AC</div>' +
        '<div style="width:60px;text-align:center;">Magic</div>' +
        '<div style="width:80px;text-align:center;">Weight (lbs)</div>' +
      '</div>' +
      '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:6px;">' +
        '<select class="armor-type" style="flex:1;">' + typeOpts + '</select>' +
        '<select class="armor-slot" style="width:100px;">' + slotOpts + '</select>' +
        '<input class="base-ac" type="number" placeholder="" value="'+(data.baseAC||'')+'" style="width:70px;text-align:center;">' +
        '<input class="ac-bonus" type="number" placeholder="" value="'+(data.acBonus||'')+'" style="width:60px;text-align:center;">' +
        '<input class="weight" type="number" step="0.1" placeholder="" value="'+(data.weight||'')+'" style="width:80px;text-align:center;">' +
      '</div>' +
      '<div class="armor-type-note" style="display:none;font-size:11px;line-height:1.4;padding:6px 8px;background:var(--glass);border-radius:4px;"></div>' +
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

  // Picking a type PREFILLS AC and weight, but only into blank fields -- an
  // enchanted or homebrew piece keeps whatever the player typed. This is the
  // autofill-not-authority rule: the stored type drives the rules either way.
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
    const acEl = el.querySelector('.base-ac');
    const wtEl = el.querySelector('.weight');
    if (acEl && !acEl.value && typeof d.ac === 'number')     acEl.value = d.ac;
    if (wtEl && !wtEl.value && typeof d.weight === 'number') wtEl.value = d.weight;
    // Keep the wear slot consistent with the chosen type.
    const slotEl = el.querySelector('.armor-slot');
    if (slotEl) {
      if (d.size) slotEl.value = 'Shield';
      else if (d.slot) slotEl.value = d.slot;
      else if (typeof ARMOR_TYPES !== 'undefined' && ARMOR_TYPES[key]) slotEl.value = 'Armor';
    }
  };
  applyTypeDefaults(false);
  typeSel.addEventListener('change', () => { applyTypeDefaults(true); onChange && onChange(); });

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
  el.querySelector('.armor-slot').addEventListener('change', ()=>onChange && onChange());
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
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.style.padding = '12px';
  // Kept so fields this UI does not display survive a move -- see the
  // comment above readNodeFields.
  el._data = m || {};
  
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Mount/Vehicle Name</div>' +
      '<div style="width:120px;">Type</div>' +
      '<div style="width:80px;"></div>' + // Space for Details button
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:stretch;margin-bottom:8px;">' +
      '<input class="mount-name" placeholder="e.g., Shadowfax" value="'+(m.name||'')+'" style="flex:1;font-weight:bold;">' +
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
    '<div class="mount-animal-fields" style="display:'+(m.type==='Animal'?'block':'none')+';margin-bottom:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Species</label>' +
          '<input class="mount-species" placeholder="e.g., War Horse" value="'+(m.species||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">HD</label>' +
          '<input class="mount-hd" placeholder="e.g., 3+3" value="'+(m.hd||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">THAC0</label>' +
          '<input class="mount-thac0" type="number" placeholder="20" value="'+(m.thac0||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);"># of Attacks</label>' +
          '<input class="mount-attacks" placeholder="e.g., 3" value="'+(m.attacks||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Morale</label>' +
          '<input class="mount-morale" type="number" placeholder="--" value="'+(m.morale||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="mount-str" type="number" placeholder="--" value="'+(m.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="mount-dex" type="number" placeholder="--" value="'+(m.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="mount-con" type="number" placeholder="--" value="'+(m.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="mount-int" type="number" placeholder="--" value="'+(m.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="mount-wis" type="number" placeholder="--" value="'+(m.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="mount-cha" type="number" placeholder="--" value="'+(m.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="mount-per" type="number" placeholder="--" value="'+(m.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="mount-com" type="number" placeholder="--" value="'+(m.com||'')+'" style="width:100%;"></div>' +
      '</div>' +
    '</div>' +
    '<div class="mount-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">HP</label>' +
          '<input class="mount-hp" type="number" placeholder="0" value="'+(m.hp||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">AC</label>' +
          '<input class="mount-ac" type="number" placeholder="10" value="'+(m.ac||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Movement</label>' +
          '<input class="mount-movement" placeholder="e.g., 24" value="'+(m.movement||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Carrying Capacity</label>' +
          '<input class="mount-capacity" placeholder="e.g., 400 lbs" value="'+(m.capacity||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Cost</label>' +
          '<input class="mount-cost" placeholder="e.g., 250 gp" value="'+(m.cost||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Status</label>' +
          '<select class="mount-status" style="width:100%;">' +
            '<option value="Active"'+((m.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
            '<option value="Retired"'+((m.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
            '<option value="Deceased"'+((m.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
            '<option value="Missing"'+((m.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
          '</select></div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Special Abilities</label>' +
      '<textarea class="mount-abilities" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;margin-bottom:8px;">'+(m.abilities||'')+'</textarea>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="mount-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+(m.notes||'')+'</textarea>' +
    '</div>';
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
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
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.style.padding = '12px';
  
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Henchman Name</div>' +
      '<div style="width:80px;"></div>' + // Space for Details button
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:stretch;">' +
      '<input class="henchman-name" placeholder="e.g., Garrett the Bold" value="'+(h.name||'')+'" style="flex:1;font-weight:bold;">' +
      '<button class="toggle-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div class="henchman-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Race</label>' +
          '<input class="henchman-race" placeholder="e.g., Human" value="'+(h.race||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Class</label>' +
          '<input class="henchman-class" placeholder="e.g., Fighter" value="'+(h.class||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Level</label>' +
          '<input class="henchman-level" type="number" placeholder="--" value="'+(h.level||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">HP</label>' +
          '<input class="henchman-hp" type="number" placeholder="--" value="'+(h.hp||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">AC</label>' +
          '<input class="henchman-ac" type="number" placeholder="--" value="'+(h.ac||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">THAC0</label>' +
          '<input class="henchman-thac0" type="number" placeholder="--" value="'+(h.thac0||'')+'" style="width:100%;"></div>' +
       '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="henchman-str" type="number" placeholder="--" value="'+(h.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="henchman-dex" type="number" placeholder="--" value="'+(h.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="henchman-con" type="number" placeholder="--" value="'+(h.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="henchman-int" type="number" placeholder="--" value="'+(h.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="henchman-wis" type="number" placeholder="--" value="'+(h.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="henchman-cha" type="number" placeholder="--" value="'+(h.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="henchman-per" type="number" placeholder="--" value="'+(h.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="henchman-com" type="number" placeholder="--" value="'+(h.com||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Alignment</label>' +
          '<input class="henchman-alignment" placeholder="e.g., LG" value="'+(h.alignment||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Loyalty Score</label>' +
          '<input class="henchman-loyalty" type="number" placeholder="e.g., 2d6" value="'+(h.loyalty||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Morale</label>' +
          '<input class="henchman-morale" type="number" placeholder="--" value="'+(h.morale||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Share</label>' +
          '<select class="henchman-share" style="width:100%;">' +
            '<option value=""'+(h.share===''?' selected':'')+'>--</option>' +
            '<option value="Half share"'+((h.share||'')==='Half share'?' selected':'')+'>Half share</option>' +
            '<option value="Full share"'+((h.share||'')==='Full share'?' selected':'')+'>Full share</option>' +
            '<option value="Wage only"'+((h.share||'')==='Wage only'?' selected':'')+'>Wage only</option>' +
            '<option value="Custom"'+((h.share||'')==='Custom'?' selected':'')+'>Custom</option>' +
          '</select></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Equipment Held</label>' +
          '<input class="henchman-equipment" placeholder="" value="'+(h.equipment||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Status</label>' +
          '<select class="henchman-status" style="width:100%;">' +
            '<option value="Active"'+((h.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
            '<option value="Retired"'+((h.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
            '<option value="Deceased"'+((h.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
            '<option value="Missing"'+((h.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
          '</select></div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="henchman-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+(h.notes||'')+'</textarea>' +
    '</div>';
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
  const detailsDiv = el.querySelector('.henchman-details');
  toggleBtn.onclick = ()=>{
    const isOpen = detailsDiv.style.display !== 'none';
    detailsDiv.style.display = isOpen ? 'none' : 'block';
    toggleBtn.textContent = isOpen ? 'Details' : 'Hide';
  };
  
  // Remove button with confirmation
  el.querySelector('.rm').onclick = ()=>{
    const name = el.querySelector('.henchman-name').value || 'this henchman';
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
  const statusSelect = el.querySelector('.henchman-status');
  if(statusSelect){
    statusSelect.addEventListener('change', ()=>{
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
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.style.padding = '12px';
  
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Name/Description</div>' +
      '<div style="width:80px;"></div>' + // Space for Details button
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:stretch;">' +
      '<input class="hireling-name" placeholder="e.g., 10 Men-at-Arms" value="'+(h.name||'')+'" style="flex:1;font-weight:bold;">' +
      '<button class="toggle-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div class="hireling-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Type</label>' +
          '<input class="hireling-type" placeholder="e.g., Men-at-Arms, Torchbearer" value="'+(h.type||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Quantity</label>' +
          '<input class="hireling-quantity" type="number" placeholder="1" value="'+(h.quantity||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Wage</label>' +
          '<input class="hireling-wage" placeholder="e.g., 2 gp/month" value="'+(h.wage||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Duration</label>' +
          '<input class="hireling-duration" placeholder="e.g., 6 months" value="'+(h.duration||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Purpose/Task</label>' +
          '<input class="hireling-purpose" placeholder="e.g., Guard the stronghold" value="'+(h.purpose||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Alignment</label>' +
          '<input class="hireling-alignment" placeholder="e.g., LG" value="'+(h.alignment||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">THAC0</label>' +
          '<input class="hireling-thac0" type="number" placeholder="--" value="'+(h.thac0||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="hireling-str" type="number" placeholder="--" value="'+(h.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="hireling-dex" type="number" placeholder="--" value="'+(h.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="hireling-con" type="number" placeholder="--" value="'+(h.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="hireling-int" type="number" placeholder="--" value="'+(h.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="hireling-wis" type="number" placeholder="--" value="'+(h.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="hireling-cha" type="number" placeholder="--" value="'+(h.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="hireling-per" type="number" placeholder="--" value="'+(h.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="hireling-com" type="number" placeholder="--" value="'+(h.com||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Status</label>' +
          '<select class="hireling-status" style="width:100%;">' +
            '<option value="Active"'+((h.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
            '<option value="Retired"'+((h.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
            '<option value="Deceased"'+((h.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
            '<option value="Missing"'+((h.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
          '</select></div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="hireling-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+(h.notes||'')+'</textarea>' +
    '</div>';
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
  const detailsDiv = el.querySelector('.hireling-details');
  toggleBtn.onclick = ()=>{
    const isOpen = detailsDiv.style.display !== 'none';
    detailsDiv.style.display = isOpen ? 'none' : 'block';
    toggleBtn.textContent = isOpen ? 'Details' : 'Hide';
  };
  
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
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.style.padding = '12px';
  // Kept so fields this UI does not display survive a move -- see the
  // comment above readNodeFields.
  el._data = c || {};
  
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Companion Name</div>' +
      '<div style="width:80px;"></div>' + // Space for Details button
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:stretch;">' +
      '<input class="companion-name" placeholder="e.g., Whiskers" value="'+(c.name||'')+'" style="flex:1;font-weight:bold;">' +
      '<button class="move-to-unbonded" style="padding:8px 10px;font-size:11px;" title="Move to Unbonded Mounts &amp; Vehicles. Nothing is lost -- fields that list does not show are kept.">&rarr; Unbonded</button>' +
      '<button class="toggle-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div class="companion-details" style="display:none;margin-top:8px;">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">' +
        '<div><label style="font-size:11px;color:var(--muted);">Species</label>' +
          '<input class="companion-species" placeholder="e.g., Wolf, Hawk" value="'+(c.species||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">HD</label>' +
          '<input class="companion-hd" placeholder="e.g., 2+2" value="'+(c.hd||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">HP</label>' +
          '<input class="companion-hp" type="number" placeholder="--" value="'+(c.hp||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">AC</label>' +
          '<input class="companion-ac" type="number" placeholder="--" value="'+(c.ac||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">THAC0</label>' +
          '<input class="companion-thac0" type="number" placeholder="--" value="'+(c.thac0||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Attacks</label>' +
          '<input class="companion-attacks" placeholder="e.g., 1d6/1d6" value="'+(c.attacks||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Alignment</label>' +
          '<input class="companion-alignment" placeholder="e.g., N" value="'+(c.alignment||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">STR</label>' +
          '<input class="companion-str" type="number" placeholder="--" value="'+(c.str||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">DEX</label>' +
          '<input class="companion-dex" type="number" placeholder="--" value="'+(c.dex||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CON</label>' +
          '<input class="companion-con" type="number" placeholder="--" value="'+(c.con||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">INT</label>' +
          '<input class="companion-int" type="number" placeholder="--" value="'+(c.int||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">WIS</label>' +
          '<input class="companion-wis" type="number" placeholder="--" value="'+(c.wis||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">CHA</label>' +
          '<input class="companion-cha" type="number" placeholder="--" value="'+(c.cha||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">PER</label>' +
          '<input class="companion-per" type="number" placeholder="--" value="'+(c.per||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">COM</label>' +
          '<input class="companion-com" type="number" placeholder="--" value="'+(c.com||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Loyalty</label>' +
          '<input class="companion-loyalty" type="number" placeholder="--" value="'+(c.loyalty||'')+'" style="width:100%;"></div>' +
        '<div style="grid-column: span 2;"><label style="font-size:11px;color:var(--muted);">Bond Type</label>' +
          '<select class="companion-bond" style="width:100%;">' +
            '<option value=""'+(c.bond===''?' selected':'')+'>--</option>' +
            '<option value="Familiar"'+((c.bond||'')==='Familiar'?' selected':'')+'>Familiar</option>' +
            '<option value="Animal Companion"'+((c.bond||'')==='Animal Companion'?' selected':'')+'>Animal Companion</option>' +
            '<option value="Follower"'+((c.bond||'')==='Follower'?' selected':'')+'>Follower</option>' +
            '<option value="Mount"'+((c.bond||'')==='Mount'?' selected':'')+'>Mount</option>' +
            '<option value="Vehicle"'+((c.bond||'')==='Vehicle'?' selected':'')+'>Vehicle</option>' +
          '</select></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Status</label>' +
          '<select class="companion-status" style="width:100%;">' +
            '<option value="Active"'+((c.status||'Active')==='Active'?' selected':'')+'>Active</option>' +
            '<option value="Retired"'+((c.status||'')==='Retired'?' selected':'')+'>Retired</option>' +
            '<option value="Deceased"'+((c.status||'')==='Deceased'?' selected':'')+'>Deceased</option>' +
            '<option value="Missing"'+((c.status||'')==='Missing'?' selected':'')+'>Missing</option>' +
          '</select></div>' +
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
          '<input class="companion-movement" placeholder="e.g., 18" value="'+(c.movement||'')+'" style="width:100%;"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);">Capacity</label>' +
          '<input class="companion-capacity" placeholder="e.g., 220 lbs" value="'+(c.capacity||'')+'" style="width:100%;"></div>' +
      '</div>' +
      '</div>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Special Abilities</label>' +
      '<textarea class="companion-abilities" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;margin-bottom:8px;">'+(c.abilities||'')+'</textarea>' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>' +
      '<textarea class="companion-notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;overflow-y:hidden;">'+(c.notes||'')+'</textarea>' +
    '</div>';
  
  // Toggle details
  const toggleBtn = el.querySelector('.toggle-details');
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
  // The full set of Type values used in core_wp.json, so a weapon backfilled
  // from the browser (Type: "Sword", "Polearm", ...) displays honestly rather
  // than falling back to blank. Only Bow / Crossbow / Sling / Blowgun / Firearm
  // actually change how Strength applies -- the rest are descriptive.
  const types = [
    '', 'Axe', 'Blowgun', 'Bola', 'Bow', 'Club', 'Crossbow', 'Dagger', 'Dart',
    'Firearm', 'Flail', 'Hammer', 'Lance', 'Mace', 'Net', 'Pick', 'Polearm',
    'Sling', 'Spear', 'Staff', 'Sword', 'Whip', 'Other'
  ];
  const sel = (selected || '').trim();

  // Keep an unrecognized value (a custom weapon typed by hand) rather than
  // silently dropping it to blank.
  if (sel && !types.some(t => t.toLowerCase() === sel.toLowerCase())) {
    types.push(sel);
  }

  return types.map(t =>
    '<option value="'+t+'"'+(t.toLowerCase() === sel.toLowerCase() ? ' selected' : '')+'>'+(t || '--')+'</option>'
  ).join('');
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
  const vals = ['', '1', '3/2', '2', '5/2', '3'];
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

function makeWeaponNode(data={}, onChange){
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="width:60px;text-align:center;">Equipped</div>' +
      '<div style="flex:1;">Weapon</div>' +
      '<div style="flex:2;">Notes</div>' +
      '<div style="width:148px;"></div>' + // Space for Details + Remove buttons
    '</div>' +
   '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:6px;">' +
      '<input type="checkbox" class="equipped" '+(data.equipped?'checked':'')+' style="width:60px;margin:auto;">' +
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1">' +
      '<input class="notes" placeholder="" value="'+(data.notes||'')+'" style="flex:2">' +
      '<button class="toggle-details" style="padding:8px 12px;font-size:11px;">Details</button>' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    // Everything below the identity row is collapsed by default. The stats a
    // player needs mid-combat are already surfaced on the Combat Quick
    // Reference card, so the card here is for editing, not for reading.
    '<div class="weapon-details" style="display:none;">' +
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="width:60px;text-align:center;">Speed</div>' +
      '<div style="width:90px;text-align:center;">Dmg (S-M)</div>' +
      '<div style="width:90px;text-align:center;">Dmg (L)</div>' +
      '<div style="width:60px;text-align:center;">Magic</div>' +
      '<div style="width:80px;text-align:center;">Weight (lbs)</div>' +
      '<div style="flex:1;text-align:center;">Damage Type</div>' +
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:6px;">' +
      '<input class="speed" type="number" placeholder="" value="'+(data.speed||'')+'" style="width:60px;text-align:center;">' +
      '<input class="damage-sm" placeholder="" value="'+(data.damageSM||'')+'" style="width:90px;text-align:center;">' +
      '<input class="damage-l" placeholder="" value="'+(data.damageL||'')+'" style="width:90px;text-align:center;">' +
      '<input class="magic-bonus" type="number" placeholder="0" value="'+(data.magicBonus||'')+'" style="width:60px;text-align:center;">' +
      '<input class="weight" type="number" step="0.1" placeholder="" value="'+(data.weight||'')+'" style="width:80px;text-align:center;">' +
      '<input class="damage-type" placeholder="e.g., Slashing" value="'+(data.damageType||'')+'" style="flex:1">' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="width:90px;text-align:center;">Hit Adj</div>' +
      '<div style="width:90px;text-align:center;">Dmg Adj</div>' +
      '<div style="width:100px;text-align:center;">Attacks/Rd</div>' +
      '<div style="width:90px;text-align:center;">Size</div>' +
      '<div style="flex:1;text-align:center;">Range (S/M/L)</div>' +
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:6px;">' +
      '<input class="weapon-hit-adj" type="number" value="'+(data.hitAdj!==undefined&&data.hitAdj!==null?data.hitAdj:'')+'" style="width:90px;text-align:center;" title="' +
        'To-hit bonus granted by this weapon.&#10;' +
        'Leave blank to use the Magic value -- correct for an ordinary +N weapon.&#10;' +
        'Set it when the enchantment is not uniform: a +5 weapon that only grants&#10;' +
        '  +1 to hit takes Magic 5 and Hit Adj 1.&#10;' +
        'Strength and any non-proficiency penalty are added on top of this.">' +
      '<input class="weapon-dmg-adj" type="number" value="'+(data.dmgAdj!==undefined&&data.dmgAdj!==null?data.dmgAdj:'')+'" style="width:90px;text-align:center;" title="' +
        'Damage bonus granted by this weapon.&#10;' +
        'Leave blank to use the Magic value.&#10;' +
        'Set to 0 for a weapon that helps you hit but not hurt.&#10;' +
        'Non-proficiency never reduces damage (PHB Table 34).">' +
      '<select class="weapon-attacks" style="width:100px;" title="' +
        'Attacks per round with THIS weapon.&#10;' +
        'Blank uses the character-level Attacks/Round on the Combat tab.&#10;' +
        '3/2 means three attacks every two rounds.">' +
        weaponAttacksOptions(data.attacks) +
      '</select>' +
      '<select class="weapon-size" style="width:90px;" title="' +
        'Weapon size (S/M/L).&#10;' +
        'Blank looks it up from the weapon list by name.&#10;' +
        'Set it for a custom weapon, or one whose name does not match the book.">' +
        weaponSizeOptions(data.size) +
      '</select>' +
      '<input class="weapon-range" value="'+(data.range||'')+'" placeholder="e.g. 50/100/150" style="flex:1;text-align:center;" title="' +
        'Short / medium / long range in yards, for missile weapons.&#10;' +
        'Manual only -- the weapon list carries no range data.">' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="width:130px;text-align:center;">Category</div>' +
      '<div style="width:110px;text-align:center;">Type</div>' +
      '<div style="width:130px;text-align:center;">STR Bonus</div>' +
      '<div style="width:130px;text-align:center;">Proficiency</div>' +
      '<div style="flex:1;"></div>' +
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;">' +
      '<select class="weapon-category" style="width:130px;">' +
        weaponCategoryOptions(data.category) +
      '</select>' +
      '<select class="weapon-wtype" style="width:110px;">' +
        weaponTypeOptions(data.wtype) +
      '</select>' +
      '<select class="weapon-str-bonus" style="width:130px;" title="' +
        'How Strength applies to this weapon (PHB).&#10;' +
        'Exceptional: full STR row incl. 18/xx -- melee and hurled weapons.&#10;' +
        'Standard: STR bonus capped at plain 18 -- an ordinary bow. A bow that&#10;' +
        '  grants exceptional-STR bonuses must be custom crafted (3-5x cost).&#10;' +
        'None: no STR adjustment -- crossbows and other mechanical devices.&#10;' +
        'Defaults are set from Category and Type; override as your DM allows.">' +
        weaponStrBonusOptions(data.strBonus, data.category, data.wtype) +
      '</select>' +
      '<select class="weapon-prof-status" style="width:130px;" title="' +
        'Proficiency with this weapon (PHB Table 34 penalty column).&#10;' +
        'Auto: derived from your Weapon Proficiencies, using the PHB&#10;' +
        '  related-weapons list. Related weapons cost HALF the penalty.&#10;' +
        'Proficient: no penalty (use if a kit or item grants it).&#10;' +
        'Related: half penalty -- for DMs who count similar weapons the&#10;' +
        '  PHB list omits (e.g. short sword vs long sword).&#10;' +
        'Not Proficient: force the full penalty.">' +
        weaponProficiencyOptions(data.profStatus) +
      '</select>' +
      '<div class="weapon-prof-badge" style="flex:1;display:flex;align-items:center;font-size:11px;padding-left:6px;"></div>' +
    '</div>' +
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

  // Remove button
  el.querySelector('.rm').onclick = ()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input').forEach(inp =>
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
        strSel.value = getDefaultWeaponStrMode(catSel.value, typeSel.value);
      }
      onChange && onChange();
    });
  });
  el.querySelector('.equipped').addEventListener('change', ()=>onChange && onChange());
  return el;
}

function makeMagicItemNode(data={}, onChange){
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Magic Item</div>' +
      '<div style="width:70px;"></div>' + // Space for Remove button
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;">' +
      '<input class="title" placeholder="" value="'+(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="margin-top:6px;">' +
      '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Description / Powers</label>' +
      '<textarea class="notes" placeholder="" style="width:100%;min-height:60px;resize:vertical;">'+(data.notes||'')+'</textarea>' +
    '</div>';
  el.querySelector('.rm').onclick = ()=>{ el.remove(); onChange && onChange(); };
  el.querySelectorAll('input,textarea').forEach(inp =>
    inp.addEventListener('input', ()=>onChange && onChange())
  );
  return el;
}

function makeAmmunitionNode(data={}, onChange){
  const el = document.createElement('div');
  el.className = 'item';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'stretch';
  
  // Calculate total weight
  const quantity = parseInt(data.quantity || 0, 10);
  const weightPerUnit = parseFloat(data.weightPerUnit || 0);
  const totalWeight = (quantity * weightPerUnit).toFixed(2);
  
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;color:var(--muted);">' +
      '<div style="flex:1;">Ammo Type</div>' +
      '<div style="width:70px;"></div>' +
    '</div>' +
    '<div style="display:flex;align-items:stretch;gap:8px;margin-bottom:8px;">' +
      '<input class="title" placeholder="e.g., Arrows, Bolts" value="'+(data.name||'')+'" style="flex:1">' +
      '<button class="rm">Remove</button>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
      '<div style="flex:1;">' +
        '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Quantity</label>' +
        '<div style="display:flex;gap:4px;align-items:center;">' +
          '<button class="ammo-minus-10" style="padding:4px 8px;font-size:11px;">-10</button>' +
          '<button class="ammo-minus-1" style="padding:4px 8px;font-size:11px;">-1</button>' +
          '<input class="quantity" type="number" min="0" value="'+(data.quantity||0)+'" style="width:80px;text-align:center;">' +
          '<button class="ammo-plus-1" style="padding:4px 8px;font-size:11px;">+1</button>' +
          '<button class="ammo-plus-10" style="padding:4px 8px;font-size:11px;">+10</button>' +
        '</div>' +
      '</div>' +
      '<div style="flex:1;">' +
        '<label style="font-size:11px;color:var(--muted);display:block;margin-bottom:2px;">Weight per Unit (lbs)</label>' +
        '<input class="weight-per-unit" type="number" step="0.01" min="0" value="'+(data.weightPerUnit||0.1)+'" style="width:100%;">' +
      '</div>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--muted);">' +
      'Total Weight: <span class="ammo-total-weight" style="color:var(--accent-light);font-weight:600;">' + totalWeight + ' lbs</span>' +
    '</div>';
  
  // Remove button
  el.querySelector('.rm').onclick = ()=>{ 
    el.remove(); 
    onChange && onChange();
    updateTotalAmmoWeight(el.closest('.sheet-container'));
  };
  
  // Quantity adjustment buttons
  const quantityInput = el.querySelector('.quantity');
  
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
    race: val(root,'race'),
	gender: val(root,'gender'),
    clazz: val(root,'clazz'),
	level: val(root,'level'),
	kit: val(root,'kit'),
    alignment: val(root,'alignment'),
    campaign_setting: val(root,'campaign_setting') || 'core',
    xp: val(root,'xp'),
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
  const racialAbilities = qsa(root,'.racial-abilities-list .item')
    .map(n=>({name:n.querySelector('.title').value, notes:n.querySelector('.val').value}));
  const kitAbilities = qsa(root,'.kit-abilities-list .item')
    .map(n=>({name:n.querySelector('.title').value, notes:n.querySelector('.val').value}));

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
      cast: n.classList.contains('spell-cast')
    })),
    spellbooks: spellbooksData.spellbooks,
    activeSpellbookId: spellbooksData.activeSpellbookId,
    schools: val(root,'magic-schools'),
    notes: val(root,'magic-notes')
  };

  // Core lists
  const spells = qsa(root,'.spells-list .item') // kept for back-compat; core no longer has it
    .map(n=>({name:n.querySelector('.title').value, level:n.querySelector('.val').value}));
  // Collect selected spheres (priests)
  const selectedSpheres = Array.from(root.querySelectorAll('.sphere-checkboxes input[type="checkbox"]:checked'))
    .map(cb => cb.getAttribute('data-sphere'));
  
  // Collect selected schools (wizards)
  const selectedSchools = Array.from(root.querySelectorAll('.school-checkboxes input[type="checkbox"]:checked'))
    .map(cb => cb.getAttribute('data-school'));
  const items = qsa(root,'.items-list .item')
    .map(n=>({
      name: n.querySelector('.title').value, 
      qty: n.querySelector('.qty').value,
      weight: (n.querySelector('.weight') && n.querySelector('.weight').value) || '',
      notes: (n.querySelector('.notes') && n.querySelector('.notes').value) || ''
    }));
  const valuables = qsa(root,'.valuables-list .item')
    .map(n=>({
      name: n.querySelector('.title').value, 
      qty: n.querySelector('.qty').value,
      weight: (n.querySelector('.weight') && n.querySelector('.weight').value) || '',
      notes: (n.querySelector('.notes') && n.querySelector('.notes').value) || '',
      valueEach: (n.querySelector('.value-each') && n.querySelector('.value-each').value) || ''
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
      weight: (n.querySelector('.weight') && n.querySelector('.weight').value) || '',
      speed: (n.querySelector('.speed') && n.querySelector('.speed').value) || '',
      damageType: (n.querySelector('.damage-type') && n.querySelector('.damage-type').value) || '',
      equipped: (n.querySelector('.equipped') && n.querySelector('.equipped').checked) || false,
      notes: (n.querySelector('.notes') && n.querySelector('.notes').value) || '',
      // How Strength applies to this weapon (PHB). Category/Type drive the
      // default; strBonus is the explicit, DM-overridable setting.
      category: (n.querySelector('.weapon-category') && n.querySelector('.weapon-category').value) || '',
      wtype: (n.querySelector('.weapon-wtype') && n.querySelector('.weapon-wtype').value) || '',
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
      range: (n.querySelector('.weapon-range') && n.querySelector('.weapon-range').value) || ''
    }));
	
  const ammunition = qsa(root,'.ammunition-list .item')
    .map(n=>({
      name: n.querySelector('.title').value,
      quantity: n.querySelector('.quantity').value,
      weightPerUnit: n.querySelector('.weight-per-unit').value
    }));

  const magicItems = qsa(root,'.magic-items-list .item')
    .map(n=>({
      name: n.querySelector('.title').value,
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
      type: el.querySelector('.hireling-type').value,
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
    hair: val(root,'hair'),
    eyes: val(root,'eyes'),
    appearanceNotes: val(root,'appearance_notes'),
    alliances: val(root,'alliances'),
    henchmenMax: val(root,'henchmen_max'),
    loyaltyBase: val(root,'loyalty_base'),
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
    `<li><strong>${c.name}</strong>: level ${c.from} &rarr; ${c.to}` +
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
  val(root,'race',m.race||'');
  val(root,'gender',m.gender||'');
  val(root,'clazz',m.clazz||'');
  val(root,'level',m.level||'');
  val(root,'kit',m.kit||'');
  val(root,'alignment',m.alignment||'');
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
  (data.magicItems||[]).forEach(m=>magicItems.appendChild(makeMagicItemNode(m)));
  
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
  val(root,'hair', d.hair || '');
  val(root,'eyes', d.eyes || '');
  val(root,'appearance_notes', d.appearanceNotes || '');
  val(root,'alliances', d.alliances || '');
  val(root,'henchmen_max', d.henchmenMax || '');
  val(root,'loyalty_base', d.loyaltyBase || '');
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
  checkDwarvenAbilities(root);
  renderCharacterBonuses(root);
  // Auto-expand all textareas on load (with slight delay to ensure content is rendered)
  setTimeout(() => {
    root.querySelectorAll('textarea').forEach(ta => autoExpand(ta));
  }, 100);

  // Migrate saved spells against the current compendium (async, fire-and-forget
  // so loadSheet stays synchronous). Fixes messy old school/sphere strings and
  // surfaces any level corrections in a dismissible banner.
  migrateSheetSpells(root);
}

function setAvatar(root, dataUrl){
  const box = qs(root,'.avatar');
  box.innerHTML='';
  root._avatarData = dataUrl || null;
  if(dataUrl){
    const img = document.createElement('img');
    img.src = dataUrl;
    box.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className='small placeholder';
    span.textContent='No avatar — upload below';
    box.appendChild(span);
  }
}

// === AVATAR CROPPER ===
//
// A FIXED 3:2 window with the image moving behind it, rather than a resizable
// selection box. Two reasons: a wrong-shaped result is impossible, and there is
// no handle-dragging geometry to get wrong. Same interaction as any
// profile-picture cropper.
//
// The ratio is shared by three places -- this frame, the .avatar box in
// style.css, and the print plate's portrait frame -- so a saved portrait fills
// all three edge to edge.
function openAvatarCropper(root, tab, dataUrl){
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

  function applyCrop(){
    const f = frameSize();
    const canvas = document.createElement('canvas');
    canvas.width  = AVATAR_OUT_W;
    canvas.height = AVATAR_OUT_H;
    const ctx = canvas.getContext('2d');

    // What the frame is showing, expressed in the source image's own pixels.
    let sx = -x / scale, sy = -y / scale;
    let sw = f.w / scale, sh = f.h / scale;
    // Float guard: clamp() keeps these in range, but a rounding error of a
    // fraction of a pixel makes drawImage throw rather than clip.
    sx = Math.max(0, Math.min(sx, nW));
    sy = Math.max(0, Math.min(sy, nH));
    sw = Math.min(sw, nW - sx);
    sh = Math.min(sh, nH - sy);

    // JPEG has no alpha, so a transparent PNG would composite onto black by
    // default anyway -- doing it explicitly makes that a decision, not a
    // surprise.
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let out;
    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      out = canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY);
    } catch(err) {
      console.warn('Avatar crop failed:', err);
      alert('That image could not be processed. Try a different file.');
      return;
    }

    setAvatar(root, out);
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
    scale = baseScale;
    zoomInp.value = 1;
    x = (f.w - nW * scale) / 2;
    y = (f.h - nH * scale) / 2;
    paint();

    if (info) {
      info.textContent = 'Source ' + nW + ' \u00d7 ' + nH +
        ' \u2014 saved as ' + AVATAR_OUT_W + ' \u00d7 ' + AVATAR_OUT_H + ' JPEG.';
    }
  };
  img.onerror = () => { alert('That image could not be read.'); closeCropper(); };
  img.src = dataUrl;

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
        names.map(n=>'<option value="'+n+'">'+n+'</option>').join('') +
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
    });
  });
  
  // CON triggers constitution effects AND saving throws (for poison adj)
  const conInput = qs(root, '[data-field="con"]');
  if (conInput) {
    conInput.addEventListener("input", () => {
      renderConstitutionEffects(root);
      renderSavingThrows(root); // Re-render to update poison save tooltip
	  checkDwarvenAbilities(root);  // Update dwarven save bonuses
	  renderCharacterBonuses(root);
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

  // Add event delegation for valuables list to trigger encumbrance
  const valuablesList = qs(root, '.valuables-list');
  if (valuablesList) {
    valuablesList.addEventListener('input', (e) => {
      // Only trigger if the changed element is qty or weight
      if (e.target.classList.contains('qty') || e.target.classList.contains('weight')) {
        renderEncumbrance(root);
        renderMovementRate(root);
      }
    });
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
    armorList.addEventListener('input', (e) => {
      // Trigger if weight changes
      if (e.target.classList.contains('weight')) {
        renderEncumbrance(root);
        renderMovementRate(root);
      }
      // Thief skills key off the armor NAME (PHB Table 29 matches on it), so a
      // rename from "Leather Armor" to "Studded Leather" has to re-run them.
      if (e.target.classList.contains('title')) {
        if (typeof renderThiefSkills === 'function') renderThiefSkills(root);
        if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
		if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
      }
    });
    // Separate listener for checkbox and select changes (use 'change' not 'input')
    armorList.addEventListener('change', (e) => {
      if (e.target.classList.contains('equipped')) {
        renderArmorClass(root);
        renderMovementRate(root);
        if (typeof renderThiefSkills === 'function') renderThiefSkills(root);
        if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
		if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
      }
      // Also trigger for armor type dropdown changes
      // Both axes matter: .armor-slot decides whether a piece counts as body
      // armor at all, .armor-type decides which Table 29 column it uses.
      if (e.target.classList.contains('armor-type') ||
          e.target.classList.contains('armor-slot')) {
        renderArmorClass(root);
        renderMovementRate(root);
        // Only Armor-type items count as body armor for Table 29, so switching
        // an item to or from "Shield" changes which piece the lookup finds.
        if (typeof renderThiefSkills === 'function') renderThiefSkills(root);
        if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
		if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
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
      renderCombatQuickReference(root);
    });
  }
  
  // Combat attacks per round field triggers save
  const attacksPerRoundInput = qs(root, '.combat-attacks-per-round');
  if (attacksPerRoundInput) {
    attacksPerRoundInput.addEventListener('input', () => {
      markUnsaved(tab, true, root);
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
      renderRacialAbilities(root);renderRacialAbilities(root);
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
	  checkDwarvenAbilities(root);
	  renderCharacterBonuses(root);
      markUnsaved(tab, true, root);
	  renderNWProficiencies(root);
      renderProficiencySlots(root);
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
      if (['clazz', 'race', 'char_type', 'int', 'wis', 'con', 'cha', 'dex',
           'mc_class1', 'mc_class2', 'mc_class3',
           'dc_new_class', 'dc_original_class'].indexOf(f) !== -1) {
        if (typeof renderSpecialistValidation === 'function') renderSpecialistValidation(root);
        if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(root);
      }
    });
  });

  // Initial render
  if (typeof renderSpecialistValidation === 'function') renderSpecialistValidation(root);
  if (typeof renderClassGroupValidation === 'function') renderClassGroupValidation(root);
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
  checkDwarvenAbilities(root);
  renderCharacterBonuses(root);
  setupDwarvenDetection(root);
  renderCombatQuickReference(root);
  renderCurrentHP(root);
  renderHitDice(root);
  renderRevivals(root);
  renderThiefSkills(root);
  if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
  if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);

  // Ranger stealth depends on class, level, race and Dexterity across all three
  // character types. One delegated listener rather than patching each of the
  // existing class/level/ability handlers separately.
  const rangerStealthFields =
    /^(clazz|level|race|dex|char_type|mc_(class|level)[123]|dc_(original|new)_(class|level))$/;
  root.addEventListener('input', (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (f && rangerStealthFields.test(f)) {
      if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
      if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
    }
  });
  root.addEventListener('change', (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (f && rangerStealthFields.test(f)) {
      if (typeof renderRangerStealth === 'function') renderRangerStealth(root);
      if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
    }
  });

  // Hit Dice and revival tracking. One delegated listener rather than binding
  // each field separately -- Hit Dice depends on class and level, which live in
  // eleven different fields across the three character types. Bound for both
  // input and change so the <select> controls (char_type, mc_class*) are caught.
  const hitDiceFields =
    /^(hit_dice_manual|clazz|level|char_type|con|mc_(class|level)[123]|dc_(original|new)_(class|level))$/;
  const onHpTrackingChange = (e) => {
    const f = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-field') : null;
    if (!f) return;
    if (f === 'con_initial' || f === 'deaths_to_date') renderRevivals(root);
    else if (hitDiceFields.test(f)) renderHitDice(root);
  };
  root.addEventListener('input', onHpTrackingChange);
  root.addEventListener('change', onHpTrackingChange);

  // Mark unsaved on any input/textarea change
  qsa(root, 'input,textarea').forEach(inp=>{
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
      }));
      markUnsaved(tab,true,root);
    };
  }

  const addMagicItem = qs(root,'.add-magic-item');
  if(addMagicItem){
    addMagicItem.onclick = ()=>{
      qs(root,'.magic-items-list').appendChild(makeMagicItemNode({}, ()=>markUnsaved(tab,true,root)));
      markUnsaved(tab,true,root);
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
  qs(root,'.upload-avatar').onclick = ()=> qs(root,'.avatar-input').click();
  qs(root,'.avatar-input').onchange = e=>{
    const f=e.target.files&&e.target.files[0];
    if(!f) return;
    // The cap now only rejects the absurd. Everything under it gets cropped and
    // downscaled to AVATAR_OUT_W x AVATAR_OUT_H regardless of what came in, so
    // refusing a 2MB photo would be refusing work we are about to do anyway.
    if(f.size > AVATAR_MAX_SIZE){
      alert("That image is " + (f.size/1024/1024).toFixed(1) + "MB, over the " +
            (AVATAR_MAX_SIZE/1024/1024).toFixed(0) + "MB limit.\n\n" +
            "Try exporting it smaller, or take a screenshot of it.");
      e.target.value='';
      return;
    }
    const r=new FileReader();
    r.onload=ev=>{
      openAvatarCropper(root, tab, ev.target.result);
    };
    r.readAsDataURL(f);
    // Cleared so re-picking the SAME file fires change again -- otherwise
    // cancelling the cropper and retrying the same image does nothing.
    e.target.value='';
  };
  // Re-crop what is already stored. This is how portraits saved before the
  // cropper existed get migrated: there is no migration pass, the player just
  // adjusts one when they happen to care.
  qs(root,'.adjust-avatar').onclick = ()=>{
    if(!root._avatarData){
      alert('No portrait to adjust yet — upload one first.');
      return;
    }
    openAvatarCropper(root, tab, root._avatarData);
  };
  qs(root,'.remove-avatar').onclick = ()=>{
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
    const kvCfgExp = getKvConfig();
    if (kvCfgExp.kvToken) obj._kvToken = kvCfgExp.kvToken;
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
        // If the exported file carries a KV token, adopt it (but don't
        // overwrite an existing token — only use it if we have none yet)
        if (obj._kvToken) {
          const cfg = getKvConfig();
          if (!cfg.kvToken) {
            cfg.kvToken = obj._kvToken;
            saveKvConfig(cfg);
          }
        }
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

  // KV Settings modal
  qs(root, '.kv-settings').onclick = () => openKvSettingsModal(root);
  qs(root, '.kv-modal-close').onclick = () => closeKvSettingsModal(root);
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
  qs(root, '.kv-modal-overlay').style.display = 'flex';
}

// Render one checkbox per entry in the OPTIONAL_RULES registry (tables.js).
// Adding a new optional rule means adding a registry entry and one
// isOptionalRule() guard at the call site -- no UI work required here.
function renderOptionalRules(root) {
  const listEl = qs(root, '.optional-rules-list');
  if (!listEl || typeof OPTIONAL_RULES === 'undefined') return;

  listEl.innerHTML = '';

  // Group by category so PHB-optional rules and house-rule overrides read as
  // different things. Entries with no category fall back to 'phb'.
  const cats = (typeof OPTIONAL_RULES_CATEGORIES !== 'undefined') ? OPTIONAL_RULES_CATEGORIES : {};
  const order = Object.keys(cats).length ? Object.keys(cats) : ['phb'];
  const grouped = {};
  Object.keys(OPTIONAL_RULES).forEach(k => {
    const c = OPTIONAL_RULES[k].category || 'phb';
    (grouped[c] = grouped[c] || []).push(k);
  });

  order.forEach(cat => {
    const keys = grouped[cat];
    if (!keys || !keys.length) return;
    const meta = cats[cat] || {};
    // Only label the sections when there is more than one, or a lone group
    // gets a redundant heading directly under the modal's own.
    if (order.filter(c => grouped[c] && grouped[c].length).length > 1) {
      const head = document.createElement('div');
      head.style.cssText = 'margin:12px 0 6px;font-size:12px;font-weight:bold;color:var(--accent-light);';
      head.textContent = meta.label || cat;
      listEl.appendChild(head);
      if (meta.blurb) {
        const blurb = document.createElement('div');
        blurb.style.cssText = 'font-size:10px;color:var(--muted);margin-bottom:8px;line-height:1.4;';
        blurb.textContent = meta.blurb;
        listEl.appendChild(blurb);
      }
    }
    keys.forEach(key => renderOneOptionalRule(listEl, key));
  });
}

// One checkbox row. Split out of renderOptionalRules so the grouping loop above
// stays readable.
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
        // Advisory banners are not part of recalculateAll, so refresh them too.
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
  if (!cfg.kvToken) return;
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
  if (!cfg.workerUrl || !cfg.kvToken) return;
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
  if (!cfg.workerUrl || !cfg.kvToken) return 0;
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
  
  // Only show +1/-1 buttons if there's a duration
  const durationButtons = duration ?
    '<button class="duration-dec" style="padding:2px 6px;font-size:11px;margin-left:4px;">-1</button>' +
    '<button class="duration-inc" style="padding:2px 6px;font-size:11px;">+1</button>'
    : '';
  
  // Show HP loss field for applicable conditions
  const hpLossField = canLoseHP ?
    '<div style="margin-top:4px;font-size:11px;">' +
      '<label style="color:var(--muted);">HP Loss/Round: </label>' +
      '<input class="hp-loss-input" type="number" min="0" value="' + hpLoss + '" style="width:50px;padding:2px 4px;text-align:center;background:var(--input-bg);color:var(--text);border:1px solid var(--border);border-radius:4px;" placeholder="0">' +
    '</div>'
    : '';
  
  el.innerHTML = 
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:4px;margin-bottom:6px;cursor:pointer;">' +
      '<div style="flex:1;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<strong class="condition-name" style="color:var(--text);">' + conditionName + '</strong>' +
          '<span class="condition-duration duration-display" style="font-size:11px;color:var(--muted);">' + durationText + '</span>' +
          durationButtons +
        '</div>' +
        hpLossField +
      '</div>' +
      '<button class="condition-remove" style="padding:4px 8px;font-size:11px;background:rgba(255,100,100,0.2);border:1px solid rgba(255,100,100,0.4);color:#ff6b6b;border-radius:4px;cursor:pointer;">Remove</button>' +
    '</div>' +
    '<div class="condition-description" style="display:none;padding:8px;background:var(--glass);border:1px solid var(--border);border-radius:4px;margin-top:-6px;margin-bottom:6px;font-size:12px;color:var(--muted);line-height:1.4;"></div>';
  
  // Toggle description on click
  const mainDiv = el.querySelector('div');
  mainDiv.onclick = (e) => {
    if (e.target.classList.contains('condition-remove') || 
        e.target.classList.contains('duration-inc') || 
        e.target.classList.contains('duration-dec') ||
        e.target.classList.contains('hp-loss-input')) {
      return;
    }
    const desc = el.querySelector('.condition-description');
    if (desc.style.display === 'none') {
      desc.style.display = 'block';
      desc.textContent = getConditionDescription(conditionName);
    } else {
      desc.style.display = 'none';
    }
  };
  
  // HP Loss input handler
  if (canLoseHP) {
    const hpLossInput = el.querySelector('.hp-loss-input');
    hpLossInput.onchange = () => {
      el.dataset.hpLoss = hpLossInput.value;
      onChange && onChange();
    };
  }
  
  // Duration adjustment buttons
  if (duration) {
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
  
  if (conditions.length === 0) {
    // Show healthy indicator
    healthyIndicator.style.display = 'block';
    conditionsList.style.display = 'none';
  } else {
    // Show conditions list
    healthyIndicator.style.display = 'none';
    conditionsList.style.display = 'block';
  }
  
  // Always show the add button if it exists
  if (addButton) {
    addButton.style.display = 'inline-block';
  }
}

function addConditionDialog(root, tab) {
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;';
  
  const conditionOptions = getAllConditionNames()
    .filter(name => name !== 'Healthy')
    .map(name => '<option value="' + name + '">' + name + '</option>')
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
          '<div style="font-size:11px;color:var(--muted);">Recover 1 HP, regain spells, clear temporary conditions</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="full_bed" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">24 Hours (Full Bed Rest)</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover 3 HP, regain spells, clear temporary conditions</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="week" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">7 Days (Week of Bed Rest)</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover 21 HP + CON bonus, regain spells, clear temporary conditions, remove Diseased</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="half" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">Rest to Half HP</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover 50% of missing HP, regain spells, clear temporary conditions</div>' +
        '</button>' +
        '<button class="rest-option" data-rest-type="full" style="padding:12px;text-align:left;background:var(--glass);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:background 0.2s;">' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">Rest to Full HP</div>' +
          '<div style="font-size:11px;color:var(--muted);">Recover all HP, regain spells, clear temporary conditions</div>' +
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
  
  // Get CON modifier for week rest
  const con = parseInt(val(root, 'con') || 10, 10);
  const conMod = (typeof CON_TABLE !== 'undefined' && CON_TABLE[con]) ? CON_TABLE[con][0] : 0;
  
  // Calculate HP recovery based on rest type
  let hpRecovered = 0;
  let rounds = 0;
  let removesDiseased = false;
  
  switch(restType) {
    case 'night':
      hpRecovered = 1;
      rounds = 480; // 8 hours × 60 minutes/hour × 1 round/minute (assuming 1 minute rounds)
      break;
    case 'full_bed':
      hpRecovered = 3;
      rounds = 1440; // 24 hours
      break;
    case 'week':
      hpRecovered = 21 + conMod;
      rounds = 10080; // 7 days × 24 hours × 60 minutes
      removesDiseased = true;
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
  
  // Clear spell "cast" status
  const memSpells = root.querySelectorAll('.memspells-list .item');
  memSpells.forEach(spell => {
    spell.classList.remove('spell-cast');
    spell.style.opacity = '1';
    
    // Remove strike-through from spell name
    const nameEl = spell.querySelector('.spell-name, .title, .name');
    if (nameEl) nameEl.style.textDecoration = 'none';
    
    // Reset cast button appearance
    const castBtn = spell.querySelector('.cast-spell');
    if (castBtn) {
      castBtn.textContent = 'Cast';
      castBtn.style.background = 'rgba(100,150,255,0.3)';
      castBtn.style.borderColor = 'rgba(100,150,255,0.5)';
    }
  });
  
  // Reset spell slot "used" counters to 0
  for (let i = 1; i <= 9; i++) {
    val(root, `used${i}`, '0');
  }
  
  // Update spell status display
  renderMemorizedSpellStatus(root);
  
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
      
      // Remove Diseased if week rest
      if (removesDiseased && conditionName === 'Diseased') {
        item.remove();
      }
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
  
  // Show success message
  let message = `Rest complete!\n\n`;
  message += `HP Change: ${currentHP} → ${currentHP + netHPChange}\n`;
  if (totalHPLoss > 0) {
    message += `(Recovered ${hpRecovered} HP, lost ${totalHPLoss} HP to conditions)\n`;
  } else {
    message += `(Recovered ${hpRecovered} HP)\n`;
  }
  message += `Spells regained\n`;
  message += `Temporary conditions cleared\n`;
  if (removesDiseased) {
    message += `Diseased condition removed`;
  }
  
  alert(message);
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
          <input class="entry-date" type="text" value="${data.date || ''}" style="width:100%;" placeholder="e.g., Jan 15, 2025">
        </div>
        <div style="flex:1;">
          <label style="font-size:11px;color:var(--muted);">XP Gained</label>
          <input class="entry-xp" type="text" value="${data.xp || ''}" style="width:100%;" placeholder="e.g., 1000">
        </div>
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Events</label>
        <textarea class="entry-events" style="width:100%;min-height:60px;resize:vertical;" placeholder="What happened this session?">${data.events || ''}</textarea>
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Loot</label>
        <textarea class="entry-loot" style="width:100%;min-height:60px;resize:vertical;" placeholder="What treasure was found?">${data.loot || ''}</textarea>
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
          <div style="font-weight:600;color:var(--accent-light);">${data.date || 'No Date'}</div>
          <div style="font-size:11px;color:var(--muted);">XP: ${data.xp || 'N/A'}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="margin-bottom:4px;">
        <strong style="font-size:11px;color:var(--muted);">Events:</strong>
        <div style="white-space:pre-wrap;">${data.events || 'None'}</div>
      </div>
      <div>
        <strong style="font-size:11px;color:var(--muted);">Loot:</strong>
        <div style="white-space:pre-wrap;">${data.loot || 'None'}</div>
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
          <input class="entry-name" type="text" value="${data.name || ''}" style="width:100%;" placeholder="Quest title">
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
        <input class="entry-objective" type="text" value="${data.objective || ''}" style="width:100%;" placeholder="What needs to be done?">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Reward</label>
        <input class="entry-reward" type="text" value="${data.reward || ''}" style="width:100%;" placeholder="What's the reward?">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Notes</label>
        <textarea class="entry-notes" style="width:100%;min-height:60px;resize:vertical;" placeholder="Additional details...">${data.notes || ''}</textarea>
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
          <div style="font-weight:600;color:${statusColor};">${data.name || 'Unnamed Quest'}</div>
          <div style="font-size:11px;color:var(--muted);">[${data.status || 'Active'}]</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="margin-bottom:4px;">
        <strong style="font-size:11px;color:var(--muted);">Objective:</strong> ${data.objective || 'None'}
      </div>
      <div style="margin-bottom:4px;">
        <strong style="font-size:11px;color:var(--muted);">Reward:</strong> ${data.reward || 'None'}
      </div>
      ${data.notes ? `<div><strong style="font-size:11px;color:var(--muted);">Notes:</strong><div style="white-space:pre-wrap;">${data.notes}</div></div>` : ''}
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
          <input class="entry-name" type="text" value="${data.name || ''}" style="width:100%;" placeholder="Character name">
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
        <textarea class="entry-relationship" style="width:100%;min-height:60px;resize:vertical;" placeholder="How do you know them? What's your relationship?">${data.relationship || ''}</textarea>
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
          <div style="font-weight:600;color:var(--accent-light);">${data.name || 'Unnamed NPC'}</div>
          <div style="font-size:11px;color:${typeColor};">[${data.type || 'Contact'}]</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="white-space:pre-wrap;">${data.relationship || 'No notes'}</div>
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
        <input class="entry-name" type="text" value="${data.name || ''}" style="width:100%;" placeholder="Place name">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Description</label>
        <input class="entry-description" type="text" value="${data.description || ''}" style="width:100%;" placeholder="Brief description">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Key Details</label>
        <textarea class="entry-details" style="width:100%;min-height:60px;resize:vertical;" placeholder="Important information, NPCs, dangers, etc.">${data.details || ''}</textarea>
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
          <div style="font-weight:600;color:var(--accent-light);">${data.name || 'Unnamed Location'}</div>
          <div style="font-size:11px;color:var(--muted);">${data.description || ''}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      ${data.details ? `<div style="white-space:pre-wrap;">${data.details}</div>` : ''}
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
        <input class="entry-title" type="text" value="${data.title || ''}" style="width:100%;" placeholder="e.g., 'Reflections on our Quest' or 'Jan 15, 2025'">
      </div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:var(--muted);">Journal Entry</label>
        <textarea class="entry-content" style="width:100%;min-height:80px;resize:vertical;" placeholder="Your character's thoughts, feelings, goals...">${data.content || ''}</textarea>
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
          <div style="font-weight:600;color:var(--accent-light);">${data.title || 'Untitled Entry'}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="edit-entry" style="padding:4px 8px;font-size:11px;">Edit</button>
          <button class="delete-entry" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      </div>
      <div style="white-space:pre-wrap;">${data.content || 'No content'}</div>
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
  const firstContainer = document.querySelector('.tab-content.active .sheet-container');
  firstContainer.innerHTML = SHEET_HTML;

  const defaultTab = document.querySelector('.tab[data-id="default"]');
  if(!defaultTab.querySelector('.label')){
    const text = defaultTab.textContent.replace('×','').trim() || 'Character 1';
    defaultTab.innerHTML = '<span class="label">' + text + '</span> <span class="close">×</span>';
  }

  bindSheet(firstContainer, defaultTab);

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
      otherSpellbooks.map(sb => `<option value="${sb.id}">${sb.name}</option>`).join('') +
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
	
/* ===== Light/Dark toggle logic (from the second file, pared to what’s needed here) ===== */
function tdnn() {
  const moon = document.getElementsByClassName("moon")[0];
  const toggle = document.getElementsByClassName("tdnn")[0];
  if (!moon || !toggle) return;
  moon.classList.toggle("sun");
  toggle.classList.toggle("day");
  document.body.classList.toggle("light");
}
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
  
  entry.innerHTML = `
    <div style="color:var(--accent-light);font-weight:600;">${result.formula}: ${result.total}</div>
    <div style="color:var(--muted);font-size:11px;">Rolls: [${rollsDisplay}]${modDisplay} - ${timestamp}</div>
  `;
  
  // Add tooltip if modifier info exists
  if (result.modifierInfo) {
    entry.title = result.modifierInfo;
    entry.style.cursor = 'help';
  }
  
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

            initLines.push('Other modifiers (PHB Table 55):');
            initLines.push('hasted -2, slowed +2, higher ground -1,');
            initLines.push('set vs charge -2, waiting +1,');
            initLines.push('wading +2 / deep water +4, hindered +3.');

            modifiers = initLines.join('\n');
          }
          break;
          
        case 'surprise':
          result = rollDiceFormula('1d10');
		  result.formula = 'Surprise (d10)';
		  modifiers = 'Roll 1-3 = surprised\nNo standard modifier applies';
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
          
        case 'reaction':
          result = rollDiceFormula('2d10');
          result.formula = 'Reaction (2d10)';
          // CHA reaction adjustment
          const chaData = (typeof CHA_TABLE !== 'undefined' && CHA_TABLE[cha]) ? CHA_TABLE[cha] : null;
          if (chaData) {
            const chaAdj = chaData.reaction;
            modifiers = `CHA modifier: ${chaAdj >= 0 ? '+' : ''}${chaAdj}\nModified roll: ${result.total + chaAdj}`;
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
	  checkDwarvenAbilities(root);  // Check dwarven abilities when tools tab opens
	  renderCharacterBonuses(root);
    });
  }
  
  // Update percentages initially
  updateThiefSkillRoller(root);
}

// ===== DWARVEN ABILITIES =====
function checkDwarvenAbilities(root) {
  if (!root) return;
  
  const race = (val(root, 'race') || '').toLowerCase();
  const dwarvenSection = root.querySelector('.dwarven-abilities-section');
  
  if (!dwarvenSection) return;
  
  // Show section if character is any type of dwarf
  const isDwarf = race.includes('dwarf') || race.includes('dwarven') || race.includes('duergar');
  dwarvenSection.style.display = isDwarf ? 'block' : 'none';
  
  if (isDwarf) {
    updateDwarvenSaves(root);
  }
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
  else if (/\bhalf[-\s]?orc\b/.test(raceRaw)) race = /\bhalf[-\s]?orc\b/.test(raceRaw) ? "half-orc" : "halforc";
  else if (/\bhuman\b/.test(raceRaw)) race = "human";
  
  // Collect all bonuses
  let allCombat = [];
  let allDefensive = [];
  let allSpecial = [];
  
  // Add racial bonuses
  if (race && RACIAL_COMBAT_BONUSES[race]) {
    const racial = RACIAL_COMBAT_BONUSES[race];
    racial.combat.forEach(bonus => {
      allCombat.push({ ...bonus, source: "Race" });
    });
    racial.defensive.forEach(bonus => {
      allDefensive.push({ ...bonus, source: "Race" });
    });
    racial.special.forEach(bonus => {
      allSpecial.push({ ...bonus, source: "Race" });
    });
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

function setupDwarvenDetection(root) {
  if (!root) return;
  
  // Setup detection roll buttons
  root.querySelectorAll('.roll-detection').forEach(btn => {
    btn.onclick = () => {
      const ability = btn.dataset.ability;
      const successMax = parseInt(btn.dataset.success);
      const roll = Math.floor(Math.random() * 6) + 1;
      const success = roll <= successMax;
      
      // Get ability display name
      const abilityNames = {
        'grade': 'Grade/Slope',
        'new-construction': 'New Construction',
        'sliding-walls': 'Sliding Walls',
        'stonework-traps': 'Stonework Traps',
        'depth': 'Depth Underground',
        'direction': 'Direction Underground'
      };
      
      const abilityName = abilityNames[ability] || ability;
      
      // Display result next to button
      const resultDiv = btn.parentElement.querySelector('.detection-result');
      if (resultDiv) {
        resultDiv.innerHTML = `<span style="color: ${success ? '#10b981' : '#ef4444'}">
          d6: ${roll} - ${success ? 'SUCCESS!' : 'Failed'}
        </span>`;
      }
      
      // Add to history
      addDetectionHistory(root, abilityName, roll, successMax, success);
    };
  });
  
  // Setup clear history button
  const clearBtn = root.querySelector('.clear-detection-history');
  if (clearBtn) {
    clearBtn.onclick = () => {
      const history = root.querySelector('.detection-history');
      if (history) {
        history.innerHTML = '<div style="color:var(--muted);font-style:italic;">Detection rolls will appear here...</div>';
      }
    };
  }
}

function addDetectionHistory(root, ability, roll, needed, success) {
  const history = root.querySelector('.detection-history');
  if (!history) return;
  
  // Clear placeholder text if present
  if (history.querySelector('div[style*="italic"]')) {
    history.innerHTML = '';
  }
  
  const time = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  });
  
  const entry = document.createElement('div');
  entry.style.cssText = `margin-bottom:2px;color:${success ? '#10b981' : '#ef4444'}`;
  entry.innerHTML = `[${time}] ${ability}: d6=${roll} (need ≤${needed}) ${success ? 'SUCCESS' : 'FAIL'}`;
  
  // Add to top of history
  history.insertBefore(entry, history.firstChild);
  
  // Limit history to 20 entries
  while (history.children.length > 20) {
    history.removeChild(history.lastChild);
  }
}

function updateDwarvenSaves(root) {
  if (!root) return;
  
  const con = parseInt(val(root, 'con')) || 10;
  
  // Calculate Constitution save bonus based on AD&D 2e PHB
  let saveBonus = 0;
  if (con >= 4 && con <= 6) saveBonus = 1;
  else if (con >= 7 && con <= 10) saveBonus = 2;
  else if (con >= 11 && con <= 13) saveBonus = 3;
  else if (con >= 14 && con <= 17) saveBonus = 4;
  else if (con >= 18) saveBonus = 5;
  
  // Update display
  const conDisplay = root.querySelector('.dwarf-con-score');
  const bonusDisplay = root.querySelector('.dwarf-save-bonus');
  
  if (conDisplay) conDisplay.textContent = con;
  if (bonusDisplay) bonusDisplay.textContent = `+${saveBonus}`;
  
  // Get current saves and apply bonus
  const save1 = parseInt(val(root, 'save1')) || 20;  // Paralyzation/Poison/Death
  const save2 = parseInt(val(root, 'save2')) || 20;  // Rod/Staff/Wand
  const save3 = parseInt(val(root, 'save3')) || 20;  // Petrification/Polymorph
  const save4 = parseInt(val(root, 'save4')) || 20;  // Breath Weapon
  const save5 = parseInt(val(root, 'save5')) || 20;  // Spell
  
  // Update save displays (bonus applies to poison, rod/staff/wand, and spell)
  const poisonDisplay = root.querySelector('.dwarf-save-poison');
  const rswDisplay = root.querySelector('.dwarf-save-rsw');
  const ppDisplay = root.querySelector('.dwarf-save-pp');
  const breathDisplay = root.querySelector('.dwarf-save-breath');
  const spellDisplay = root.querySelector('.dwarf-save-spell');
  
  if (poisonDisplay) poisonDisplay.textContent = `${save1 - saveBonus}`;
  if (rswDisplay) rswDisplay.textContent = `${save2 - saveBonus}`;
  if (ppDisplay) ppDisplay.textContent = `${save3}`;  // No bonus
  if (breathDisplay) breathDisplay.textContent = `${save4}`;  // No bonus
  if (spellDisplay) spellDisplay.textContent = `${save5 - saveBonus}`;
}



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
  
  // Paladins turn as clerics 2 levels lower
  if (isPaladin) {
    effectiveLevel = Math.max(1, effectiveLevel - 2);
  }
  
  // Cap at level 20
  effectiveLevel = Math.min(20, effectiveLevel);
  
  // Get the turn undead data for this level
  const turnData = TURN_UNDEAD_TABLE[effectiveLevel];
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
    
    if (requirement === 'D') {
      requirementText = '⚡ Destroy';
      requirementColor = '#fbbf24'; // gold
    } else if (requirement === 'T') {
      requirementText = '⚡ Auto Turn';
      requirementColor = '#4ade80'; // green
    } else {
      requirementText = `Roll ${requirement}+`;
      requirementColor = 'var(--text)';
    }
    
    row.innerHTML = `
      <div style="flex:1;">
        <div style="font-weight:600;font-size:13px;">${undeadType.name}</div>
        <div style="font-size:11px;color:var(--muted);">HD: ${undeadType.hd}</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
        <div style="font-size:13px;font-weight:600;color:${requirementColor};min-width:110px;text-align:center;">${requirementText}</div>
        <button class="turn-undead-btn" data-undead="${undeadType.key}" data-requirement="${requirement}" data-name="${undeadType.name}" data-hd="${undeadType.hd}" style="padding:6px 16px;">Turn</button>
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
  function addTurnUndeadToHistory(undeadName, requirement, roll, hdTurned, wasDestroyed) {
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
      resultText = `DESTROYED ${hdTurned} HD`;
      color = '#fbbf24'; // gold
    } else if (requirement === 'T' || requirement === 'D') {
      resultText = `TURNED ${hdTurned} HD`;
      color = '#4ade80'; // green
    } else if (roll >= parseInt(requirement)) {
      resultText = `SUCCESS - ${hdTurned} HD turned`;
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
    const undeadHD = parseInt(btn.getAttribute('data-hd'));
    
    let roll = null;
    let hdTurned = 0;
    let wasDestroyed = false;
    
    if (requirement === 'D') {
      // Automatic destruction
      hdTurned = rollDice(2, 6);
      wasDestroyed = true;
    } else if (requirement === 'T') {
      // Automatic turn
      hdTurned = rollDice(2, 6);
    } else {
      // Need to roll d20
      roll = rollDice(1, 20);
      if (roll >= parseInt(requirement)) {
        // Success - roll 2d6 for HD
        hdTurned = rollDice(2, 6);
      }
    }
    
    // Add to history
    addTurnUndeadToHistory(undeadName, requirement, roll, hdTurned, wasDestroyed);
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
      validationMsg.innerHTML = `<span style="color:#d9534f;">⚠ ${race || 'This race'} cannot multi-class. Only demihumans can multi-class.</span>`;
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
      validationMsg.innerHTML = `<span style="color:#d9534f;">⚠ Invalid combination: ${classes.join('/')} is not allowed for ${race}.</span>`;
      validationMsg.style.background = 'rgba(217, 83, 79, 0.1)';
      validationMsg.style.border = '1px solid rgba(217, 83, 79, 0.3)';
    }
    return;
  }
  
  // Valid combination!
  if (validationMsg) {
    validationMsg.innerHTML = `<span style="color:#5cb85c;">✓ Valid ${classes.join('/')} combination for ${race}.</span>`;
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
  if (typeof renderArmorRestrictions === 'function') renderArmorRestrictions(root);
  if (typeof renderTurnUndeadTable === 'function') renderTurnUndeadTable(root);
  if (typeof renderCurrentHP === 'function') renderCurrentHP(root);
  if (typeof renderHitDice === 'function') renderHitDice(root);
  if (typeof renderRevivals === 'function') renderRevivals(root);
  if (typeof renderEncumbrance === 'function') renderEncumbrance(root);
  if (typeof renderProficiencySlots === 'function') renderProficiencySlots(root);
  if (typeof renderMovementRate === 'function') renderMovementRate(root);
  if (typeof renderArmorClass === 'function') renderArmorClass(root);
  if (typeof renderClassAbilities === 'function') renderClassAbilities(root);
  if (typeof renderCharacterBonuses === 'function') renderCharacterBonuses(root);
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
  
  if (errors.length > 0) {
    if (statusMsg) {
      statusMsg.innerHTML = `<span style="color:#d9534f;">⚠ Prime Requisite Requirements Not Met:<br>${errors.join('<br>')}</span>`;
      statusMsg.style.background = 'rgba(217, 83, 79, 0.1)';
      statusMsg.style.border = '1px solid rgba(217, 83, 79, 0.3)';
    }
    return;
  }
  
  // Get status (dormant or active)
  const status = getDualClassStatus(originalClass, originalLevel, newClass, newLevel);
  
  if (statusMsg) {
    const color = status.type === 'success' ? '#5cb85c' : '#f0ad4e';
    statusMsg.innerHTML = `<span style="color:${color};">${status.message}</span>`;
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
