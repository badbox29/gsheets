// ===== SHEET TEMPLATE (scoped; no IDs) =====
const SHEET_HTML = `
  <div class="sheet-body">
    <!-- Vertical Tab Bar -->
    <div class="vtab-bar">
      <div class="vtab active" data-vtab="core">Core</div>
      <div class="vtab" data-vtab="skills">Proficiencies</div>
      <div class="vtab" data-vtab="abilities">Abilities</div>
      <div class="vtab" data-vtab="magic">Magic</div>
      <div class="vtab" data-vtab="equipment">Equipment</div>
      <div class="vtab" data-vtab="weapons-armor">Weapons & Armor</div>
      <div class="vtab" data-vtab="magic-items">Magic Items</div>
      <div class="vtab" data-vtab="details">Details</div>
      <div class="vtab" data-vtab="followers">Followers</div>
      <div class="vtab" data-vtab="notes">Notes</div>
      <div class="vtab" data-vtab="tools">Tools</div>
    </div>

    <!-- Content Panels -->
    <div class="vtab-content active" data-vtab="core">
      <main class="card">
        <!-- Basic Info -->
        <section class="section">
          <h3>Basic Info</h3>
          <div class="row">
            <div class="col"><label>Name</label><input data-field="name" type="text"></div>
            <div class="col"><label>Player</label><input data-field="player" type="text"></div>
			<div class="col">
              <label>Character Type</label>
              <select data-field="char_type">
                <option value="single">Single-Class</option>
                <option value="multi">Multi-Class</option>
                <option value="dual">Dual-Class</option>
              </select>
            </div>
          </div>
		  <div class="row" style="margin-top:8px">
            <div class="col"><label>Race</label><input data-field="race" type="text"></div>
            <div class="col">
              <label>Gender</label>
              <select data-field="gender">
                <option value="">Please Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div class="col single-class-field"><label>Class</label><input data-field="clazz" type="text"></div>
            <div class="col single-class-field">
              <label>Kit</label>
              <select data-field="kit">
                <option value="">Standard Class</option>
              </select>
            </div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Alignment</label><input data-field="alignment" type="text"></div>
            <div class="col">
              <label>XP <span class="xp-note" style="font-size:10px;color:var(--muted);font-weight:normal;"></span></label>
              <input data-field="xp" type="number">
            </div>
            <div class="col single-class-field"><label>Level</label><input data-field="level" type="number" min="1" value="1"></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col single-dual-field"><label>XP for Next Level</label><input data-field="xp_next" type="text" readonly></div>
            <div class="col single-dual-field"><label>Prime Req. XP Bonus</label><input data-field="xp_bonus" type="text" readonly></div>
          </div>
          
          <!-- Multi-Class Fields (hidden by default) -->
          <div class="multi-class-fields" style="display:none;">
            <div class="row" style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.1);border-radius:4px;">
              <div class="col" style="flex:2">
                <label>Class 1</label>
                <select data-field="mc_class1">
                  <option value="">Select Class</option>
                  <option value="fighter">Fighter</option>
                  <option value="ranger">Ranger</option>
                  <option value="paladin">Paladin</option>
                  <option value="cleric">Cleric</option>
                  <option value="druid">Druid</option>
                  <option value="mage">Mage</option>
                  <option value="illusionist">Illusionist</option>
                  <option value="thief">Thief</option>
                </select>
              </div>
              <div class="col" style="flex:1">
                <label>Level</label>
                <input data-field="mc_level1" type="number" min="1" value="1">
              </div>
              <div class="col" style="flex:1">
                <label>XP</label>
                <input data-field="mc_xp1" type="text" readonly>
              </div>
            </div>
            <div class="row" style="margin-top:4px;padding:8px;background:rgba(0,0,0,0.1);border-radius:4px;">
              <div class="col" style="flex:2">
                <label>Class 2</label>
                <select data-field="mc_class2">
                  <option value="">Select Class</option>
                  <option value="fighter">Fighter</option>
                  <option value="ranger">Ranger</option>
                  <option value="paladin">Paladin</option>
                  <option value="cleric">Cleric</option>
                  <option value="druid">Druid</option>
                  <option value="mage">Mage</option>
                  <option value="illusionist">Illusionist</option>
                  <option value="thief">Thief</option>
                </select>
              </div>
              <div class="col" style="flex:1">
                <label>Level</label>
                <input data-field="mc_level2" type="number" min="1" value="1">
              </div>
              <div class="col" style="flex:1">
                <label>XP</label>
                <input data-field="mc_xp2" type="text" readonly>
              </div>
            </div>
            <div class="row" style="margin-top:4px;padding:8px;background:rgba(0,0,0,0.1);border-radius:4px;">
              <div class="col" style="flex:2">
                <label>Class 3 (Optional)</label>
                <select data-field="mc_class3">
                  <option value="">None</option>
                  <option value="fighter">Fighter</option>
                  <option value="cleric">Cleric</option>
                  <option value="mage">Mage</option>
                  <option value="thief">Thief</option>
                </select>
              </div>
              <div class="col" style="flex:1">
                <label>Level</label>
                <input data-field="mc_level3" type="number" min="1" value="1">
              </div>
              <div class="col" style="flex:1">
                <label>XP</label>
                <input data-field="mc_xp3" type="text" readonly>
              </div>
            </div>
            <div class="row" style="margin-top:8px;">
              <div class="col">
                <div class="mc-validation-message" style="padding:8px;border-radius:4px;font-size:12px;"></div>
              </div>
            </div>
          </div>
          
          <!-- Dual-Class Fields (hidden by default) -->
          <div class="dual-class-fields" style="display:none;">
            <div class="row" style="margin-top:8px;">
              <div class="col" style="flex:3;">
                <div style="padding:8px;background:rgba(0,0,0,0.05);border-radius:4px;font-size:11px;color:var(--muted);">
                  <strong>Dual-Class Setup:</strong> Enter your original class info, then specify your new class. You must have 15+ in original class prime requisites and 17+ in new class prime requisites.
                </div>
              </div>
            </div>
            <div class="row" style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.1);border-radius:4px;">
              <div class="col" style="flex:2;">
                <label>Original Class</label>
                <input data-field="dc_original_class" type="text" placeholder="e.g., Fighter">
              </div>
              <div class="col" style="flex:1;">
                <label>Original Level</label>
                <input data-field="dc_original_level" type="number" min="1" placeholder="1">
              </div>
              <div class="col" style="flex:2;">
                <label>New Class</label>
                <input data-field="dc_new_class" type="text" placeholder="e.g., Mage">
              </div>
              <div class="col" style="flex:1;">
                <label>New Level</label>
                <input data-field="dc_new_level" type="number" min="1" value="1">
              </div>
            </div>
            <div class="row" style="margin-top:4px;">
              <div class="col">
                <div class="dc-status-message" style="padding:8px;border-radius:4px;font-size:12px;"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Ability Scores -->
        <section class="section">
          <h3>Ability Scores</h3>
          <div class="stat-grid">
            <div class="stat">STR<br><input data-field="str" type="number" min="1" max="25"></div>
            <div class="stat">DEX<br><input data-field="dex" type="number" min="1" max="25"></div>
            <div class="stat">CON<br><input data-field="con" type="number" min="1" max="25"></div>
            <div class="stat">INT<br><input data-field="int" type="number" min="1" max="25"></div>
            <div class="stat">WIS<br><input data-field="wis" type="number" min="1" max="25"></div>
            <div class="stat">CHA<br><input data-field="cha" type="number" min="1" max="25"></div>
            <div class="stat">PER<br><input data-field="per" type="number" min="1" max="25"></div>
            <div class="stat">COM<br><input data-field="com" type="number" min="1" max="25"></div>
          </div>
        </section>

		<!-- Combat -->
		<section class="section">
		  <h3>Combat</h3>
		  <div class="row">
			<div class="col single-multi-hp">
			  <label>HP (Max)</label>
			  <input data-field="hp" type="number">
			</div>
			<div class="col dual-hp-fields" style="display:none;">
			  <label>Total HP</label>
			  <input data-field="hp" type="number" readonly title="Auto-calculated from Original + New Class HP">
			</div>
			<div class="col dual-hp-fields" style="display:none;">
			  <label>Original Class HP</label>
			  <input data-field="dc_original_hp" type="number" min="0" title="HP from your original class levels (frozen)">
			</div>
			<div class="col dual-hp-fields" style="display:none;">
			  <label>New Class HP</label>
			  <input data-field="dc_new_hp" type="number" min="0" title="HP gained from new class levels">
			</div>
			<div class="col">
			  <label>Damage Taken</label>
			  <div style="display:flex;gap:4px;align-items:center;">
			    <input data-field="damage_taken" type="number" placeholder="0" min="0" style="flex:1;">
			    <button class="clear-damage" style="padding:4px 8px;font-size:11px;">Clear</button>
			  </div>
			</div>
			<div class="col"><label>Current HP</label><input data-field="current_hp" type="text" readonly style="font-weight:bold;"></div>
		  </div>
		  <div class="row" style="margin-top:8px">
			<div class="col"><label>Manual AC Adj.</label><input data-field="ac_manual" type="number" placeholder="0"></div>
			<div class="col"><label>Reaction Adj.</label><input data-field="reaction_adj_combat" type="text" readonly></div>
			<div class="col"></div>
		  </div>
		  <div class="row" style="margin-top:12px">
			<div class="col"><label>Normal AC</label><input data-field="ac" type="text" readonly></div>
			<div class="col"><label>Rear AC</label><input data-field="ac_rear" type="text" readonly></div>
			<div class="col"><label>Surprised AC</label><input data-field="ac_surprised" type="text" readonly></div>
		  </div>
		  <div class="row" style="margin-top:8px">
			<div class="col"><label>No Shield AC</label><input data-field="ac_no_shield" type="text" readonly></div>
			<div class="col"><label>Unarmored AC</label><input data-field="ac_unarmored" type="text" readonly></div>
			<div class="col"><label>vs Missiles AC</label><input data-field="ac_vs_missiles" type="text" readonly></div>
		  </div>
		</section>

		<section class="section">		
		  <div class="col" style="flex:1 1 100%">
		    <!-- <label>Attack Matrix (auto-calculated)</label> -->
		    <div class="base-thac0 small"></div>
		    <div class="attack-matrix"></div>
		  </div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Saving Throws -->
		<section class="section saving-throws">
		  <h3>Saving Throws (auto-calculated)</h3>

		  <div class="row">
			<div class="col">
			  <div class="save-pair">
				<div class="labels">
				  <label class="save-label">Paralyzation/Poison/Death</label>
				  <label class="mod-label">+/-</label>
				</div>
				<div class="inputs">
				  <input data-field="save1" class="save-input" type="text" readonly>
				  <input data-field="savemod1" class="mod-input" type="number" step="1" value="0">
				</div>
			  </div>
			</div>

			<div class="col">
			  <div class="save-pair">
				<div class="labels">
				  <label class="save-label">Rod/Staff/Wand</label>
				  <label class="mod-label">+/-</label>
				</div>
				<div class="inputs">
				  <input data-field="save2" class="save-input" type="text" readonly>
				  <input data-field="savemod2" class="mod-input" type="number" step="1" value="0">
				</div>
			  </div>
			</div>
		  </div>

		  <div class="row" style="margin-top:8px">
			<div class="col">
			  <div class="save-pair">
				<div class="labels">
				  <label class="save-label">Petrification/Polymorph</label>
				  <label class="mod-label">+/-</label>
				</div>
				<div class="inputs">
				  <input data-field="save3" class="save-input" type="text" readonly>
				  <input data-field="savemod3" class="mod-input" type="number" step="1" value="0">
				</div>
			  </div>
			</div>

			<div class="col">
			  <div class="save-pair">
				<div class="labels">
				  <label class="save-label">Breath Weapon</label>
				  <label class="mod-label">+/-</label>
				</div>
				<div class="inputs">
				  <input data-field="save4" class="save-input" type="text" readonly>
				  <input data-field="savemod4" class="mod-input" type="number" step="1" value="0">
				</div>
			  </div>
			</div>
		  </div>

		  <div class="row" style="margin-top:8px;display:flex;gap:12px;align-items:flex-start;">
			<div style="flex:1;min-width:0;">
			  <div class="save-pair">
				<div class="labels">
				  <label class="save-label">Spell</label>
				  <label class="mod-label">+/-</label>
				</div>
				<div class="inputs">
				  <input data-field="save5" class="save-input" type="text" readonly>
				  <input data-field="savemod5" class="mod-input" type="number" step="1" value="0">
				</div>
			  </div>
			</div>
			<div style="flex:1;min-width:0;">
			  <div class="save-pair">
				<div class="labels">
				  <label class="save-label">Spell (Mental)</label>
				  <label class="mod-label">+/-</label>
				</div>
				<div class="inputs">
				  <input data-field="save5_mental" class="save-input" type="text" readonly title="Spell save adjusted for Wisdom Magical Defense Adj. (mental/mind-affecting spells only)">
				  <input data-field="savemod5_mental" class="mod-input" type="number" step="1" value="0">
				</div>
			  </div>
			</div>
		  </div>
		</section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
		
		<!-- Strength Effects -->
        <section class="section">
          <h3>Strength Effects</h3>
          <div class="row">
            <div class="col">
              <label>To-Hit Adj.</label>
              <input data-field="str_tohit" type="text" readonly>
            </div>
            <div class="col">
              <label>Damage Adj.</label>
              <input data-field="str_damage" type="text" readonly>
            </div>
            <div class="col">
              <label>Weight Allowance</label>
              <input data-field="str_weight" type="text" readonly>
            </div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col">
              <label>Open Doors</label>
              <input data-field="str_opendoors" type="text" readonly>
            </div>
            <div class="col">
              <label>Bend Bars/Lift Gates</label>
              <input data-field="str_bendbars" type="text" readonly>
            </div>
            <div class="col">
              <label>Exceptional STR (warriors only)</label>
              <input data-field="str_exceptional" type="text" placeholder="01-00">
            </div>
          </div>
        </section>
		
		<!-- Dexterity Effects -->
        <section class="section">
          <h3>Dexterity Effects</h3>
          <div class="row">
            <div class="col">
              <label>Reaction Adjustment</label>
              <input data-field="dex_reaction" type="text" readonly>
            </div>
            <div class="col">
              <label>Missile Attack Adj.</label>
              <input data-field="dex_missile" type="text" readonly>
            </div>
            <div class="col">
              <label>Defensive Adj. (AC)</label>
              <input data-field="dex_ac" type="text" readonly>
            </div>
          </div>
        </section>

		<!-- Constitution Effects -->
		<section class="section">
		  <h3>Constitution Effects</h3>
		  <div class="row">
			<div class="col">
			  <label>HP Bonus/Level</label>
			  <input data-field="con_hpbonus" type="text" readonly>
			</div>
			<div class="col">
			  <label>System Shock %</label>
			  <input data-field="con_shock" type="text" readonly>
			</div>
			<div class="col">
			  <label>Resurrection Survival %</label>
			  <input data-field="con_res" type="text" readonly>
			</div>
		  </div>
		  <div class="row" style="margin-top:8px">
			<div class="col">
			  <label>Poison Save Adj.</label>
			  <input data-field="con_poison" type="text" readonly>
			</div>
			<div class="col">
			  <label>Regeneration</label>
			  <input data-field="con_regen" type="text" readonly>
			</div>
			<div class="col"></div>
		  </div>
		</section>
		
		<!-- Intelligence Effects -->
        <section class="section">
          <h3>Intelligence Effects</h3>
          <div class="row">
            <div class="col">
              <label># Languages</label>
              <input data-field="int_languages" type="text" readonly>
            </div>
            <div class="col">
              <label>Bonus NWPs</label>
              <input data-field="int_bonus_profs" type="text" readonly>
            </div>
            <div class="col">
              <label>Spell Immunity</label>
              <input data-field="int_immunity" type="text" readonly>
            </div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col">
              <label>Learn Spell % (Wizards)</label>
              <input data-field="int_learn_spell" type="text" readonly>
            </div>
            <div class="col">
              <label>Max Spells/Level (Wizards)</label>
              <input data-field="int_max_spells" type="text" readonly>
            </div>
            <div class="col"><!-- empty for layout --></div>
          </div>
        </section>

		<!-- Wisdom Modifiers -->
		<section class="section">
		  <h3>Wisdom Effects</h3>
		  <div class="row">
			<div class="col">
			  <label>Magical Defense Adj.</label>
			  <input data-field="wis_mda" type="text" readonly>
			</div>
			<div class="col">
			  <label>Spell Failure %</label>
			  <input data-field="wis_spell_failure" type="text" readonly>
			</div>
			<div class="col">
			  <label>Mind Immunities</label>
			  <input data-field="wis_immunities" type="text" readonly>
			</div>
		  </div>
		  <div class="row" style="margin-top:8px">
			<div class="col" style="flex:2;">
			  <label>Bonus Spells (Priests)</label>
			  <input data-field="wis_bonus_spells" type="text" readonly>
			</div>
			<div class="col"></div>
		  </div>
		</section>
		
		<!-- Charisma Effects -->
        <section class="section">
          <h3>Charisma Effects</h3>
          <div class="row">
            <div class="col"><label>Reaction Adj.</label><input data-field="cha_reaction_core" type="text" readonly></div>
            <div class="col"><label>Max Henchmen</label><input data-field="cha_max_henchmen_core" type="number" readonly></div>
            <div class="col"><label>Loyalty Base</label><input data-field="cha_loyalty_core" type="number" readonly></div>
          </div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Notes -->
        <section class="section">
          <h3>Notes</h3>
          <textarea data-field="notes"></textarea>
        </section>		
		
      </main>
    </div>

    <div class="vtab-content" data-vtab="skills">
      <main class="card">
        <!-- Language Browser -->
        <section class="section language-browser-section">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Language Browser</h3>
            <button class="toggle-language-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            Search and browse available languages. Click "Learn" to add a language to your proficiencies.
          </p>
          
          <div class="language-browser-content" style="display:none;">
            <!-- Search and Filters -->
            <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
              <input class="language-search" type="text" placeholder="Search languages..." style="flex:1;min-width:200px;">
              <select class="language-rarity-filter" style="width:150px;">
                <option value="">All Rarities</option>
                <option value="Common">Common</option>
                <option value="Uncommon">Uncommon</option>
                <option value="Rare">Rare</option>
                <option value="Very Rare">Very Rare</option>
                <option value="Exotic">Exotic</option>
                <option value="Secret">Secret</option>
              </select>
              <button class="refresh-languages" style="padding:8px 16px;">Refresh List</button>
            </div>
            
            <!-- Language Results -->
            <div class="language-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
              <p style="color:var(--muted);text-align:center;padding:20px;">Click Refresh List to load available languages.</p>
            </div>
          </div>
        </section>

        <hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

        <!-- Language Proficiencies -->
        <section class="section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;">Language Proficiencies</h3>
            <button class="add-custom-language">+ Add Custom Language</button>
          </div>
          <div class="list language-profs-list"></div>
        </section>

        <hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Weapon Proficiencies Browser -->
        <section class="section weapon-browser-section">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Weapon Proficiencies Browser</h3>
            <button class="toggle-weapon-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            Search and browse available weapons. Click "Learn" to add a weapon proficiency.
          </p>
          
          <div class="weapon-browser-content" style="display:none;">
            <!-- Search and Filters -->
            <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
              <input class="weapon-search" type="text" placeholder="Search weapons..." style="flex:1;min-width:200px;">
              <select class="weapon-category-filter" style="width:150px;">
                <option value="">All Categories</option>
                <option value="Melee">Melee</option>
                <option value="Ranged">Ranged</option>
              </select>
              <select class="weapon-group-filter" style="width:150px;">
                <option value="">All Groups</option>
                <option value="Axe">Axe</option>
                <option value="Bow">Bow</option>
                <option value="Crossbow">Crossbow</option>
                <option value="Flail">Flail</option>
                <option value="Polearm">Polearm</option>
                <option value="Spear">Spear</option>
                <option value="Sword">Sword</option>
                <option value="Club/Mace">Club/Mace</option>
                <option value="Other">Other</option>
              </select>
              <button class="refresh-weapons" style="padding:8px 16px;">Refresh List</button>
            </div>
            
            <!-- Weapon Results -->
            <div class="weapon-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
              <p style="color:var(--muted);text-align:center;padding:20px;">Click Refresh List to load available weapons.</p>
            </div>
          </div>
        </section>

        <hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

        <!-- Weapon Proficiencies -->
        <section class="section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;">Weapon Proficiencies</h3>
            <button class="add-custom-weapon-prof">+ Add Custom Weapon Proficiency</button>
          </div>
          <div class="list weapon-profs-list"></div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Non-Weapon Proficiencies Browser -->
        <section class="section nwp-browser-section">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Non-Weapon Proficiencies Browser</h3>
            <button class="toggle-nwp-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            Search and browse available non-weapon proficiencies. Click "Learn" to add a proficiency.
          </p>
          
          <div class="nwp-browser-content" style="display:none;">
            <!-- Search and Filters -->
            <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
              <input class="nwp-search" type="text" placeholder="Search proficiencies..." style="flex:1;min-width:200px;">
              <select class="nwp-category-filter" style="width:150px;">
                <option value="">All Categories</option>
                <option value="General">General</option>
                <option value="Warrior">Warrior</option>
                <option value="Wizard">Wizard</option>
                <option value="Priest">Priest</option>
                <option value="Rogue">Rogue</option>
              </select>
              <button class="refresh-nwp" style="padding:8px 16px;">Refresh List</button>
            </div>
            
            <!-- NWP Results -->
            <div class="nwp-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
              <p style="color:var(--muted);text-align:center;padding:20px;">Click Refresh List to load available proficiencies.</p>
            </div>
          </div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">
        
        <!-- Non-Weapon Proficiencies -->
        <section class="section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;">Non-Weapon Proficiencies</h3>
            <button class="add-custom-nwp">+ Add Custom Non-Weapon Proficiency</button>
          </div>
          <div class="list nwp-list"></div>
        </section>
      </main>
    </div>

    <div class="vtab-content" data-vtab="abilities">
      <main class="card">
        <!-- Thief Abilities -->
        <section class="section thief-abilities-display">
          <h3>Thief Abilities</h3>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Pick Pockets</label><input data-field="thief_pickpockets" type="number" min="0" max="100" readonly></div>
            <div class="col"><label>Open Locks</label><input data-field="thief_openlocks" type="number" min="0" max="100" readonly></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Find/Remove Traps</label><input data-field="thief_traps" type="number" min="0" max="100" readonly></div>
            <div class="col"><label>Move Silently</label><input data-field="thief_movesilently" type="number" min="0" max="100" readonly></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Hide in Shadows</label><input data-field="thief_hide" type="number" min="0" max="100" readonly></div>
            <div class="col"><label>Detect Noise</label><input data-field="thief_detectnoise" type="number" min="0" max="100" readonly></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Climb Walls</label><input data-field="thief_climb" type="number" min="0" max="100" readonly></div>
            <div class="col"><label>Read Languages</label><input data-field="thief_readlang" type="number" min="0" max="100" readonly></div>
          </div>
		  <!-- Hidden fields to store discretionary points allocated to each skill -->
          <input data-field="thief_points_pickpockets" type="hidden" value="0">
          <input data-field="thief_points_openlocks" type="hidden" value="0">
          <input data-field="thief_points_traps" type="hidden" value="0">
          <input data-field="thief_points_movesilently" type="hidden" value="0">
          <input data-field="thief_points_hide" type="hidden" value="0">
          <input data-field="thief_points_detectnoise" type="hidden" value="0">
          <input data-field="thief_points_climb" type="hidden" value="0">
          <input data-field="thief_points_readlang" type="hidden" value="0">
        </section>
		
		<!-- Discretionary Points Allocation -->
        <section class="section thief-points-section thief-abilities-display" style="display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <h3 style="margin:0;">Discretionary Points</h3>
              <span class="thief-points-warning" style="display:none;color:#fbbf24;font-size:13px;font-weight:600;">⚠ You have unassigned skill points</span>
            </div>
            <button class="toggle-thief-points" type="button" style="padding:6px 12px;font-size:13px;">Show Point Allocation</button>
          </div>
          
          <div class="thief-points-content collapsed">
            <div style="background:#1a1a1a;padding:12px;border-radius:4px;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;">Total Points Available:</span>
                <span class="thief-total-points" style="font-size:18px;font-weight:700;color:#fbbf24;">0</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                <span style="font-weight:600;">Points Allocated:</span>
                <span class="thief-allocated-points" style="font-size:18px;font-weight:700;">0</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                <span style="font-weight:600;">Points Remaining:</span>
                <span class="thief-remaining-points" style="font-size:18px;font-weight:700;color:#10b981;">0</span>
              </div>
            </div>
            
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
              Allocate your discretionary points to improve thief skills. Final skill % = Base + Race + DEX + Points.
            </p>
            
            <div class="row" style="margin-top:8px">
              <div class="col">
                <label>Pick Pockets</label>
                <input class="thief-point-input" data-skill="pickpockets" type="number" min="0" value="0">
              </div>
              <div class="col">
                <label>Open Locks</label>
                <input class="thief-point-input" data-skill="openlocks" type="number" min="0" value="0">
              </div>
            </div>
            <div class="row" style="margin-top:8px">
              <div class="col">
                <label>Find/Remove Traps</label>
                <input class="thief-point-input" data-skill="traps" type="number" min="0" value="0">
              </div>
              <div class="col">
                <label>Move Silently</label>
                <input class="thief-point-input" data-skill="movesilently" type="number" min="0" value="0">
              </div>
            </div>
            <div class="row" style="margin-top:8px">
              <div class="col">
                <label>Hide in Shadows</label>
                <input class="thief-point-input" data-skill="hide" type="number" min="0" value="0">
              </div>
              <div class="col">
                <label>Detect Noise</label>
                <input class="thief-point-input" data-skill="detectnoise" type="number" min="0" value="0">
              </div>
            </div>
            <div class="row" style="margin-top:8px">
              <div class="col">
                <label>Climb Walls</label>
                <input class="thief-point-input" data-skill="climb" type="number" min="0" value="0">
              </div>
              <div class="col">
                <label>Read Languages</label>
                <input class="thief-point-input" data-skill="readlang" type="number" min="0" value="0">
              </div>
            </div>
          </div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Class / Racial / Kit Abilities (addable) -->
        <section class="section">
          <h3>Class Abilities <button class="add-class-ability">+ Add</button></h3>
          <div class="list class-abilities-list"></div>
        </section>
        <section class="section">
          <h3>Racial Abilities <button class="add-racial-ability">+ Add</button></h3>
          <div class="list racial-abilities-list"></div>
        </section>
        <section class="section">
          <h3>Kit Abilities <button class="add-kit-ability">+ Add</button></h3>
          <div class="list kit-abilities-list"></div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Special Notes -->
        <section class="section">
          <h3>Special Powers / Benefits</h3>
          <textarea data-field="notes_powers" style="overflow:auto"></textarea>
        </section>
        <section class="section">
          <h3>Special Hindrances</h3>
          <textarea data-field="notes_hindrances" style="overflow:auto"></textarea>
        </section>
        <section class="section">
          <h3>Class / Kit Notes</h3>
          <textarea data-field="notes_classkit" style="overflow:auto"></textarea>
        </section>
      </main>
    </div>

    <div class="vtab-content" data-vtab="magic">
      <main class="card">
        <!-- Spell Slots -->
        <section class="section">
          <h3>Spell Slots</h3>
			<div class="row">
			  <div class="col"><label>1st</label><input data-field="slots1" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_1"></div></div>
			  <div class="col"><label>2nd</label><input data-field="slots2" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_2"></div></div>
			  <div class="col"><label>3rd</label><input data-field="slots3" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_3"></div></div>
			  <div class="col"><label>4th</label><input data-field="slots4" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_4"></div></div>
			</div>
			<div class="row">
			  <div class="col"><label>5th</label><input data-field="slots5" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_5"></div></div>
			  <div class="col"><label>6th</label><input data-field="slots6" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_6"></div></div>
			  <div class="col"><label>7th</label><input data-field="slots7" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_7"></div></div>
			  <div class="col"><label>8th</label><input data-field="slots8" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_8"></div></div>
			  <div class="col"><label>9th</label><input data-field="slots9" type="text" readonly><div class="slot-breakdown" data-field="slot_breakdown_9"></div></div>
			</div>
        </section>

		<!-- Wisdom-based Modifiers -->
		<section class="section">
		  <h3>Wisdom Effects</h3>
		  <div class="row">
			<div class="col">
			  <label>Spell Failure Chance</label>
			  <input data-field="wis_spell_failure" type="text" readonly>
			</div>
			<div class="col">
			  <label>Wisdom Immunities</label>
			  <input data-field="wis_immunities" type="text" readonly>
			</div>
		  </div>
		</section>
		
	    <!-- Spell Access (Spheres/Schools) -->
	    <section class="section">
		  <div style="display:flex;justify-content:space-between;align-items:center;">
		    <h3>Spell Access</h3>
		    <button class="toggle-spell-access" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
		    Select which spheres (priests) or schools (wizards) your character has access to. This filters available spells.
		  </p>
		
          <div class="spell-access-container" style="display:none;">
		    <!-- Priest Spheres -->
		    <div class="priest-spheres" style="display:none;">
			  <h4 style="margin-bottom:8px;">Priest Spheres</h4>
			  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;" class="sphere-checkboxes">
			    <!-- Populated dynamically -->
			  </div>
		    </div>
		  
		    <!-- Wizard Schools -->
		    <div class="wizard-schools" style="display:none;margin-top:16px;">
			  <h4 style="margin-bottom:8px;">Wizard Schools</h4>
			  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;" class="school-checkboxes">
			    <!-- Populated dynamically -->
			  </div>
		    </div>
		  </div>
	    </section>

		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
		
		<!-- Spell Browser -->
        <section class="section spell-browser-section" style="display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Spell Browser</h3>
            <button class="toggle-spell-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            Search and browse available spells. Click a spell to view details or add to memorized list.
          </p>
          
          <div class="spell-browser-content" style="display:none;">
            <!-- Search and Filters -->
            <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
              <input class="spell-search" type="text" placeholder="Search spells..." style="flex:1;min-width:200px;">
              <select class="spell-level-filter" style="width:120px;">
                <option value="">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
                <option value="6">Level 6</option>
                <option value="7">Level 7</option>
                <option value="8">Level 8</option>
                <option value="9">Level 9</option>
              </select>
              <button class="refresh-spells" style="padding:8px 16px;">Refresh List</button>
            </div>
            
            <!-- Spell Results -->
            <div class="spell-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
              <p style="color:var(--muted);text-align:center;padding:20px;">No spells found. Select your class and spheres/schools, then click Refresh List.</p>
            </div>
          </div>
        </section>

		<hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">
		
		<!-- Memorized Spells -->
		<section class="section">
		  <h3>Memorized Spells</h3>
		  
		  <!-- Spell slot status display -->
		  <div class="spell-slot-status" style="margin-bottom:12px;padding:8px;background:var(--glass);border-radius:4px;font-size:13px;">
			<strong>Spells Memorized:</strong> <span class="spell-status-text" style="margin-left:8px;">—</span>
		  </div>
		  
		  <!-- Level filter -->
		  <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
			<label style="font-size:12px;color:var(--muted);">Select to view memorized spells by level, or select 'All levels' to view your entire memorized spell list</label>
			<select class="memspell-level-filter" style="width:120px;">
			  <option value="">All levels</option>
			  <option value="special">Special</option>
			  <option value="1">Level 1</option>
			  <option value="2">Level 2</option>
			  <option value="3">Level 3</option>
			  <option value="4">Level 4</option>
			  <option value="5">Level 5</option>
			  <option value="6">Level 6</option>
			  <option value="7">Level 7</option>
			  <option value="8">Level 8</option>
			  <option value="9">Level 9</option>
			</select>
		  </div>
		  
		  <div class="list memspells-list"></div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

		<!-- Spell Books / Known Spells -->
		<section class="section spellbook-section" style="display:none;">
		  <div style="display:flex;justify-content:space-between;align-items:center;">
			<h3>Spell Books / Known Spells</h3>
			<button class="toggle-spellbook-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
			Spells you know (Wizards) or have learned (other casting classes). 
			Click "Memorize" to prepare a spell for casting.
		  </p>
		  
		  <!-- SPELLBOOK TABS ROW -->
		  <div class="spellbook-tabs-container" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;position:relative;">
			<!-- Left scroll arrow -->
			<button class="spellbook-scroll-left" style="padding:4px 8px;font-size:14px;display:none;flex-shrink:0;" title="Scroll left">←</button>
			
			<!-- Tabs wrapper with horizontal scroll -->
			<div class="spellbook-tabs-wrapper" style="flex:1;overflow-x:hidden;position:relative;">
			  <div class="spellbook-tabs" style="display:flex;gap:4px;transition:transform 0.3s ease;">
				<!-- Tabs will be inserted here dynamically -->
			  </div>
			</div>
			
			<!-- Right scroll arrow -->
			<button class="spellbook-scroll-right" style="padding:4px 8px;font-size:14px;display:none;flex-shrink:0;" title="Scroll right">→</button>
			
			<!-- Overflow menu (for 5+ spellbooks) -->
			<div class="spellbook-overflow-container" style="position:relative;flex-shrink:0;display:none;">
			  <button class="spellbook-overflow-btn" style="padding:4px 12px;font-size:14px;">⋯</button>
				<div class="spellbook-overflow-menu" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:#232739;border:1px solid var(--border);border-radius:6px;padding:4px;min-width:180px;max-height:300px;overflow-y:auto;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
				<!-- Overflow items inserted here -->
			  </div>
			</div>
			
			<!-- Add spellbook button -->
			<button class="add-spellbook-btn" style="padding:4px 12px;font-size:14px;flex-shrink:0;" title="Add new spellbook">+ Add</button>
		  </div>
		  
		  <div class="spellbook-content" style="display:block;">
			<!-- Level filter -->
			<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
			  <label style="font-size:12px;color:var(--muted);">Select to view your spell book by level, or select 'All levels' to view your entire spell book</label>
			  <select class="spellbook-level-filter" style="width:120px;margin-left:auto;">
				<option value="">All levels</option>
				<option value="special">Special</option>
				<option value="1">Level 1</option>
				<option value="2">Level 2</option>
				<option value="3">Level 3</option>
				<option value="4">Level 4</option>
				<option value="5">Level 5</option>
				<option value="6">Level 6</option>
				<option value="7">Level 7</option>
				<option value="8">Level 8</option>
				<option value="9">Level 9</option>
			  </select>
			  <button class="add-spellbook-spell" style="padding:4px 12px;font-size:12px;margin-left:auto;">+ Add Spell</button>
			</div>
			
			<div class="list spellbook-list"></div>
		  </div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Magic Notes -->
        <section class="section">
          <h3>Magic Notes</h3>
          <label>Journal</label>
          <textarea data-field="magic-schools"></textarea>
          <label style="margin-top:8px">Miscellaneous</label>
          <textarea data-field="magic-notes"></textarea>
        </section>
      </main>
    </div>

    <div class="vtab-content" data-vtab="equipment">
	  <main class="card">
		<!-- Equipment Browser -->
		<section class="section equipment-browser-section">
		  <div style="display:flex;justify-content:space-between;align-items:center;">
			<h3>Carried Equipment Browser</h3>
			<button class="toggle-equipment-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
			Search and browse available equipment. Click "Add" to add an item to your inventory.
		  </p>
		  
		  <div class="equipment-browser-content" style="display:none;">
			<!-- Search and Filters -->
			<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
			  <input class="equipment-search" type="text" placeholder="Search equipment..." style="flex:1;min-width:200px;">
			  <select class="equipment-category-filter" style="width:150px;">
				<option value="">All Categories</option>
				<option value="Container">Container</option>
				<option value="Light Source">Light Source</option>
				<option value="Adventuring Gear">Adventuring Gear</option>
				<option value="Tool">Tool</option>
				<option value="Camping">Camping</option>
				<option value="Food">Food</option>
				<option value="Clothing">Clothing</option>
				<option value="Medical">Medical</option>
				<option value="Restraint">Restraint</option>
				<option value="Entertainment">Entertainment</option>
				<option value="Animal Gear">Animal Gear</option>
				<option value="Transport">Transport</option>
				<option value="Personal">Personal</option>
				<option value="Weapon">Weapon</option>
			  </select>
			  <button class="refresh-equipment" style="padding:8px 16px;">Refresh List</button>
			</div>
			
			<!-- Equipment Results -->
			<div class="equipment-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
			  <p style="color:var(--muted);text-align:center;padding:20px;">Click Refresh List to load available equipment.</p>
			</div>
		  </div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

		<!-- Carried Equipment -->
		<section class="section">
		  <h3>Carried Equipment <button class="add-item">+ Add Custom Item</button></h3>
		  <div class="list items-list"></div>
		</section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Treasure & Money -->
        <section class="section">
          <h3>Treasure & Money</h3>
          
          <h4 style="margin-bottom:8px;font-size:14px;">Coins Possessed</h4>
          <div class="row">
            <div class="col"><label>CP</label><input data-field="cp" type="number"></div>
            <div class="col"><label>SP</label><input data-field="sp" type="number"></div>
            <div class="col"><label>EP</label><input data-field="ep" type="number"></div>
            <div class="col"><label>GP</label><input data-field="gp" type="number"></div>
            <div class="col"><label>PP</label><input data-field="pp" type="number"></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Total Coins</label><input data-field="coin_total" type="text" readonly></div>
            <div class="col"><label>Coin Weight (lbs)</label><input data-field="coin_weight" type="text" readonly></div>
            <div class="col"><!-- empty for layout --></div>
          </div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;margin-bottom:8px;">
            <h4 style="font-size:14px;margin:0;">Other Valuables</h4>
            <button class="add-valuable">+ Add Item</button>
          </div>
          <div class="list valuables-list"></div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

		<!-- Encumbrance -->
		<section class="section">
		  <h3>Encumbrance</h3>
		  <div class="row">
			<div class="col"><label>Current Load (lbs)</label><input data-field="encumbrance_current" type="text" readonly></div>
			<div class="col"><label>Max Carry (lbs)</label><input data-field="encumbrance_max" type="text" readonly></div>
			<div class="col"><label>Encumbrance Category</label><input data-field="encumbrance_category" type="text" readonly></div>
		  </div>
		</section>

		<!-- Movement Rate -->
		<section class="section">
		  <h3>Movement Rate</h3>
		  <div class="row">
			<div class="col"><label>Base Movement</label><input data-field="movement_base" type="text" readonly></div>
			<div class="col"><label>Current Movement</label><input data-field="movement_current" type="text" readonly></div>
			<div class="col"><label>Running (×3)</label><input data-field="movement_running" type="text" readonly></div>
		  </div>
		  <div class="row" style="margin-top:8px">
			<div class="col"><label>Climbing (÷2)</label><input data-field="movement_climbing" type="text" readonly></div>
			<div class="col"><label>Swimming</label><input data-field="movement_swimming" type="text" readonly></div>
			<div class="col"><label>Flying (if applicable)</label><input data-field="movement_flying" type="number" min="0" placeholder="0"></div>
		  </div>
		</section>
	  </main>
	</div>

    <div class="vtab-content" data-vtab="weapons-armor">
	  <main class="card">
		<!-- Weapon Browser -->
		<section class="section weapon-inventory-browser-section">
		  <div style="display:flex;justify-content:space-between;align-items:center;">
			<h3>Weapon Browser</h3>
			<button class="toggle-weapon-inventory-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
			Search and browse available weapons. Click "Add" to add a weapon to your inventory.
		  </p>
		  
		  <div class="weapon-inventory-browser-content" style="display:none;">
			<!-- Search and Filters -->
			<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
			  <input class="weapon-inventory-search" type="text" placeholder="Search weapons..." style="flex:1;min-width:200px;">
			  <select class="weapon-inventory-category-filter" style="width:120px;">
				<option value="">All Categories</option>
				<option value="Melee">Melee</option>
				<option value="Ranged">Ranged</option>
			  </select>
			  <select class="weapon-inventory-type-filter" style="width:120px;">
				<option value="">All Types</option>
				<option value="Axe">Axe</option>
				<option value="Bow">Bow</option>
				<option value="Crossbow">Crossbow</option>
				<option value="Dagger">Dagger</option>
				<option value="Flail">Flail</option>
				<option value="Hammer">Hammer</option>
				<option value="Mace">Mace</option>
				<option value="Polearm">Polearm</option>
				<option value="Spear">Spear</option>
				<option value="Sword">Sword</option>
				<option value="Whip">Whip</option>
				<option value="Sling">Sling</option>
				<option value="Staff">Staff</option>
				<option value="Other">Other</option>
			  </select>
			  <button class="refresh-weapon-inventory-browser" style="padding:8px 16px;">Refresh List</button>
			</div>
			
			<!-- Weapon Results -->
			<div class="weapon-inventory-browser-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
			  <p style="color:var(--muted);text-align:center;padding:20px;">Click Refresh List to load available weapons.</p>
			</div>
		  </div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

		<!-- Weapons -->
		<section class="section">
		  <h3>Weapons <button class="add-weapon">+ Add Custom Weapon</button></h3>
		  <div class="list weapons-list"></div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

		<!-- Ammunition Browser -->
		<section class="section ammunition-browser-section">
		  <div style="display:flex;justify-content:space-between;align-items:center;">
			<h3>Ammunition Browser</h3>
			<button class="toggle-ammunition-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
			Search and browse available ammunition. Click "Add" to add ammunition to your inventory.
		  </p>
		  
		  <div class="ammunition-browser-content" style="display:none;">
			<!-- Search and Filters -->
			<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
			  <input class="ammunition-search" type="text" placeholder="Search ammunition..." style="flex:1;min-width:200px;">
			  <select class="ammunition-type-filter" style="width:150px;">
				<option value="">All Types</option>
				<option value="Arrow">Arrow</option>
				<option value="Bolt">Bolt</option>
				<option value="Bullet">Bullet</option>
				<option value="Stone">Stone</option>
				<option value="Dart">Dart</option>
				<option value="Other">Other</option>
			  </select>
			  <button class="refresh-ammunition-browser" style="padding:8px 16px;">Refresh List</button>
			</div>
			
			<!-- Ammunition Results -->
			<div class="ammunition-browser-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
			  <p style="color:var(--muted);text-align:center;padding:20px;">Click Refresh List to load available ammunition.</p>
			</div>
		  </div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

		<!-- Ammunition -->
		<section class="section">
		  <h3>Ammunition <button class="add-ammunition">+ Add Custom Ammo</button></h3>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
			Track arrows, bolts, sling stones, and other ammunition. Weight auto-updates encumbrance.
		  </p>
		  <div class="list ammunition-list"></div>
		  <div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;">
			<strong style="font-size:12px;">Total Ammo Weight:</strong> 
			<span class="total-ammo-weight" style="color:var(--accent-light);font-weight:600;">0.0 lbs</span>
		  </div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

		<!-- Armor Browser -->
		<section class="section armor-browser-section">
		  <div style="display:flex;justify-content:space-between;align-items:center;">
			<h3>Armor & Shields Browser</h3>
			<button class="toggle-armor-browser-visibility" style="padding:4px 12px;font-size:12px;">Show/Hide</button>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
			Search and browse available armor and shields. Click "Add" to add armor to your inventory.
		  </p>
		  
		  <div class="armor-browser-content" style="display:none;">
			<!-- Search and Filters -->
			<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
			  <input class="armor-search" type="text" placeholder="Search armor..." style="flex:1;min-width:200px;">
			  <select class="armor-type-filter" style="width:150px;">
				<option value="">All Types</option>
				<option value="None">None</option>
				<option value="Light">Light</option>
				<option value="Medium">Medium</option>
				<option value="Heavy">Heavy</option>
				<option value="Shield">Shield</option>
			  </select>
			  <button class="refresh-armor-browser" style="padding:8px 16px;">Refresh List</button>
			</div>
			
			<!-- Armor Results -->
			<div class="armor-browser-results" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:4px;padding:8px;">
			  <p style="color:var(--muted);text-align:center;padding:20px;">Click Refresh List to load available armor.</p>
			</div>
		  </div>
		</section>

		<hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

		<!-- Armor & Shields -->
		<section class="section">
		  <h3>Armor & Shields <button class="add-armor">+ Add Custom Armor</button></h3>
		  <div class="list armor-list"></div>
		</section>
	  </main>
	</div>

	<div class="vtab-content" data-vtab="magic-items">
	  <main class="card">
		<!-- Magic Items -->
		<section class="section">
		  <h3>Magic Items <button class="add-magic-item">+ Add</button></h3>
		  <div class="list magic-items-list"></div>
		</section>
	  </main>
	</div>
    <div class="vtab-content" data-vtab="details">
      <main class="card">
        <!-- Personal Info -->
        <section class="section">
          <h3>Personal Info</h3>
          <div class="row">
            <div class="col"><label>Homeworld</label><input data-field="homeworld" type="text"></div>
            <div class="col"><label>Homeland</label><input data-field="homeland" type="text"></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Birthplace</label><input data-field="birthplace" type="text"></div>
            <div class="col"><label>Patron Deity</label><input data-field="patron_deity" type="text"></div>
          </div>
        </section>

        <!-- Appearance -->
        <section class="section">
          <h3>Appearance</h3>
          <div class="row">
            <div class="col"><label>Height</label><input data-field="height" type="text"></div>
            <div class="col"><label>Weight</label><input data-field="weight" type="text"></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Hair</label><input data-field="hair" type="text"></div>
            <div class="col"><label>Eyes</label><input data-field="eyes" type="text"></div>
          </div>
          <label style="margin-top:8px">Appearance Notes</label>
          <textarea data-field="appearance_notes"></textarea>
        </section>

        <!-- Family Information -->
        <section class="section">
          <h3>Family Information</h3>
          <div class="row">
            <div class="col"><label>Father (Name/Status)</label><input data-field="father" type="text"></div>
            <div class="col"><label>Mother (Name/Status)</label><input data-field="mother" type="text"></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Siblings</label><input data-field="siblings" type="text"></div>
            <div class="col"><label>Birth Order</label><input data-field="birthorder" type="text"></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Family Social Standing</label><input data-field="family_standing" type="text"></div>
            <div class="col"><label>Family Occupation/Trade</label><input data-field="family_occupation" type="text"></div>
          </div>
          <div class="row" style="margin-top:8px">
            <div class="col"><label>Family Wealth</label><input data-field="family_wealth" type="text"></div>
            <div class="col"><label>Inheritance Rights</label><input data-field="inheritance" type="text"></div>
          </div>
          <label style="margin-top:8px">Family Property & Holdings</label>
          <textarea data-field="family_property" style="min-height:60px"></textarea>
          <label style="margin-top:8px">Extended Family & Relations</label>
          <textarea data-field="extended_family" style="min-height:60px"></textarea>
          <label style="margin-top:8px">Family Reputation & History</label>
          <textarea data-field="family_history" style="min-height:80px"></textarea>
        </section>

        <!-- Allies, Contacts & Organizations -->
        <section class="section">
          <h3>Alliances & Contacts</h3>
          <textarea data-field="alliances"></textarea>
        </section>

		<!-- Background History -->
        <section class="section">
          <h3>Background History</h3>
          <textarea data-field="background_history" style="min-height:120px"></textarea>
        </section>
      </main>
    </div>

    <div class="vtab-content" data-vtab="followers">
      <main class="card">
        <!-- Follower Stats -->
        <section class="section">
          <h3>Follower Capacity</h3>
          <div class="row">
            <div class="col"><label>Reaction Adj.</label><input data-field="reaction_adj" type="text" readonly></div>
            <div class="col"><label>Max Followers</label><input data-field="henchmen_max" type="number" readonly></div>
            <div class="col"><label>Loyalty Base</label><input data-field="loyalty_base" type="number" readonly></div>
          </div>
        </section>

        <hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

        <!-- Mounts & Vehicles -->
		<section class="section">
		  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
			<h3 style="margin:0;">Mounts & Vehicles</h3>
			<div style="display:flex;gap:12px;align-items:center;">
			  <button class="add-mount">+ Add</button>
			  <label style="font-size:12px;color:var(--muted);cursor:pointer;user-select:none;">
				<input type="checkbox" class="show-archived-mounts" style="margin-right:4px;">
				Show Archived
			  </label>
			</div>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
			Horses, ponies, wagons, ships, and transportation
		  </p>
		  <div class="list mounts-list"></div>
		</section>

        <hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

        <!-- Henchmen & Retainers -->
		<section class="section">
		  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
			<h3 style="margin:0;">Henchmen & Retainers</h3>
			<div style="display:flex;gap:12px;align-items:center;">
			  <button class="add-henchman">+ Add</button>
			  <label style="font-size:12px;color:var(--muted);cursor:pointer;user-select:none;">
				<input type="checkbox" class="show-archived-henchmen" style="margin-right:4px;">
				Show Archived
			  </label>
			</div>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
			Loyal companions who adventure with you
		  </p>
		  <div class="list henchmen-list"></div>
		</section>

        <hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

        <!-- Followers & Hirelings -->
		<section class="section">
		  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
			<h3 style="margin:0;">Followers & Hirelings</h3>
			<div style="display:flex;gap:12px;align-items:center;">
			  <button class="add-hireling">+ Add</button>
			  <label style="font-size:12px;color:var(--muted);cursor:pointer;user-select:none;">
				<input type="checkbox" class="show-archived-hirelings" style="margin-right:4px;">
				Show Archived
			  </label>
			</div>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
			Mercenaries, specialists, staff, and temporary help
		  </p>
		  <div class="list hirelings-list"></div>
		</section>

        <hr style="margin:24px 0;border:none;border-top:1px solid #555;opacity:0.4;">

        <!-- Animal Companions -->
		<section class="section">
		  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
			<h3 style="margin:0;">Animal Companions</h3>
			<div style="display:flex;gap:12px;align-items:center;">
			  <button class="add-companion">+ Add</button>
			  <label style="font-size:12px;color:var(--muted);cursor:pointer;user-select:none;">
				<input type="checkbox" class="show-archived-companions" style="margin-right:4px;">
				Show Archived
			  </label>
			</div>
		  </div>
		  <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
			Rangers' companions, familiars, and bonded beasts
		  </p>
		  <div class="list companions-list"></div>
		</section>
      </main>
    </div>

    <div class="vtab-content" data-vtab="notes">
      <main class="card">
        <section class="section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;">Notes</h3>
            <select class="notes-category-selector" style="padding:6px 12px;border-radius:6px;background:#1a1d29;color:inherit;border:1px solid var(--border);">
              <option value="session_log">Session Log</option>
              <option value="quest_journal">Quest Journal</option>
              <option value="npcs">Important NPCs</option>
              <option value="locations">Locations & World Lore</option>
              <option value="character_journal">Character Journal</option>
            </select>
          </div>
          
          <!-- Dynamic content area that changes based on dropdown -->
          <div class="notes-content-area">
            <!-- Session Log -->
            <div class="notes-section" data-category="session_log" style="display:block;">
              <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
                Chronicle your adventure sessions with dates, XP earned, and key events.
              </p>
              <div style="margin-bottom:12px;">
                <button class="add-note-entry" data-category="session_log">+ Add Entry</button>
              </div>
              <div class="notes-entries-list" data-category="session_log"></div>
            </div>
            
            <!-- Quest Journal -->
            <div class="notes-section" data-category="quest_journal" style="display:none;">
              <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
                Track active and completed quests, objectives, and rewards.
              </p>
              <div style="margin-bottom:12px;">
                <button class="add-note-entry" data-category="quest_journal">+ Add Entry</button>
              </div>
              <div class="notes-entries-list" data-category="quest_journal"></div>
            </div>
            
            <!-- Important NPCs -->
            <div class="notes-section" data-category="npcs" style="display:none;">
              <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
                Keep notes on allies, contacts, enemies, and their relationships with you.
              </p>
              <div style="margin-bottom:12px;">
                <button class="add-note-entry" data-category="npcs">+ Add Entry</button>
              </div>
              <div class="notes-entries-list" data-category="npcs"></div>
            </div>
            
            <!-- Locations & World Lore -->
            <div class="notes-section" data-category="locations" style="display:none;">
              <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
                Document places you've visited, rumors heard, and world-building details.
              </p>
              <div style="margin-bottom:12px;">
                <button class="add-note-entry" data-category="locations">+ Add Entry</button>
              </div>
              <div class="notes-entries-list" data-category="locations"></div>
            </div>
            
            <!-- Character Journal -->
            <div class="notes-section" data-category="character_journal" style="display:none;">
              <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">
                Personal reflections, character goals, motivations, and roleplaying notes.
              </p>
              <div style="margin-bottom:12px;">
                <button class="add-note-entry" data-category="character_journal">+ Add Entry</button>
              </div>
              <div class="notes-entries-list" data-category="character_journal"></div>
            </div>
          </div>
        </section>
      </main>
    </div>
	  <div class="vtab-content" data-vtab="tools">
      <main class="card">
        <!-- Dice Rollers -->
        <section class="section">
          <h3>Dice Rollers</h3>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            Quick dice rolling utilities for gameplay.
          </p>
          
          <!-- Standard Dice -->
          <div style="margin-bottom:16px;">
            <h4 style="font-size:14px;margin-bottom:8px;">Standard Dice</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="roll-dice" data-dice="1d4" style="padding:8px 16px;">d4</button>
              <button class="roll-dice" data-dice="1d6" style="padding:8px 16px;">d6</button>
              <button class="roll-dice" data-dice="1d8" style="padding:8px 16px;">d8</button>
              <button class="roll-dice" data-dice="1d10" style="padding:8px 16px;">d10</button>
              <button class="roll-dice" data-dice="1d12" style="padding:8px 16px;">d12</button>
              <button class="roll-dice" data-dice="1d20" style="padding:8px 16px;">d20</button>
              <button class="roll-dice" data-dice="1d100" style="padding:8px 16px;">d100</button>
            </div>
          </div>
          
          <!-- Custom Roll -->
          <div style="margin-bottom:16px;">
            <h4 style="font-size:14px;margin-bottom:8px;">Custom Roll</h4>
            <div style="display:flex;gap:8px;align-items:center;">
              <input class="custom-dice-input" type="text" placeholder="e.g., 2d6+3" style="width:150px;">
              <button class="roll-custom-dice" style="padding:8px 16px;">Roll</button>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;">
              Format: [number]d[sides][+/-modifier] (e.g., 3d6, 2d8+5, 1d20-2)
            </div>
          </div>
          
          <!-- Ability Score Rolling -->
          <div style="margin-bottom:16px;">
            <h4 style="font-size:14px;margin-bottom:8px;">Ability Score Rolling</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="roll-ability" data-method="3d6" style="padding:8px 16px;">3d6</button>
              <button class="roll-ability" data-method="4d6" style="padding:8px 16px;">4d6 (drop lowest)</button>
              <button class="roll-ability" data-method="method1" style="padding:8px 16px;">Method I (3d6, 6 times)</button>
              <button class="roll-ability" data-method="method2" style="padding:8px 16px;">Method II (3d6, 12 times)</button>
            </div>
          </div>
          
		  <!-- Common Game Rolls + Roll History (side by side) -->
          <div style="display:grid;grid-template-columns:30% 70%;gap:16px;margin-bottom:16px;">
            <!-- Common Game Rolls (left side) -->
            <div>
              <h4 style="font-size:14px;margin-bottom:8px;">Common Game Rolls</h4>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <button class="game-roll" data-roll="initiative" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Initiative (d10)</span>
                  <span style="font-size:10px;opacity:0.6;">Lower is better</span>
                </button>
                <button class="game-roll" data-roll="surprise" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Surprise (d10)</span>
				  <span style="font-size:10px;opacity:0.6;">1-3 = surprised</span>
                </button>
                <button class="game-roll" data-roll="to-hit" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Attack Roll (d20)</span>
                  <span style="font-size:10px;opacity:0.6;">Meet/beat target number</span>
                </button>
                <button class="game-roll" data-roll="saving-throw" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Saving Throw (d20)</span>
                  <span style="font-size:10px;opacity:0.6;">Meet/beat save value</span>
                </button>
                <button class="game-roll" data-roll="ability-check" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Ability Check (d20)</span>
                  <span style="font-size:10px;opacity:0.6;">Roll under ability score</span>
                </button>
                <button class="game-roll" data-roll="reaction" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Reaction (2d10)</span>
                  <span style="font-size:10px;opacity:0.6;">2-7 neg, 8-14 neutral, 15+ pos</span>
                </button>
                <button class="game-roll" data-roll="open-doors" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Open Doors (d20)</span>
                  <span style="font-size:10px;opacity:0.6;">Roll under STR doors value</span>
                </button>
                <button class="game-roll" data-roll="bend-bars" style="padding:6px 10px;text-align:left;display:flex;flex-direction:column;">
                  <span style="font-weight:600;font-size:12px;">Bend Bars (d100)</span>
                  <span style="font-size:10px;opacity:0.6;">Roll under STR percentage</span>
                </button>
              </div>
            </div>
            
            <!-- Roll History (right side) -->
            <div>
              <h4 style="font-size:14px;margin-bottom:8px;">Roll History (most recent on top)</h4>
              <div class="roll-history" style="height:310px;overflow-y:auto;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-family:monospace;font-size:12px;margin-bottom:8px;">
                <div style="color:var(--muted);font-style:italic;">Roll results will appear here...</div>
              </div>
              <button class="clear-roll-history" style="padding:6px 12px;font-size:12px;">Clear History</button>
            </div>
          </div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
		
		<!-- Thief Skill Roller -->
        <section class="section thief-skills-section" style="display:none;">
          <h3>Thief Skill Roller</h3>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            Quick rolling for thief abilities. Click Roll to test against your current skill percentages.
          </p>
          
          <div style="display:grid;grid-template-columns:55% 45%;gap:16px;">
            <!-- Thief Skills (left side) -->
            <div class="thief-skills-roller">
			<h4 style="font-size:14px;margin-bottom:8px;">Thief Rolls</h4>
			<!-- Pick Pockets -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Pick Pockets</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_pickpockets">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_pickpockets" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
              
              <!-- Open Locks -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Open Locks</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_openlocks">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_openlocks" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
              
              <!-- Find/Remove Traps -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Find/Remove Traps</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_traps">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_traps" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
              
              <!-- Move Silently -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Move Silently</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_movesilently">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_movesilently" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
              
              <!-- Hide in Shadows -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Hide in Shadows</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_hide">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_hide" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
              
              <!-- Detect Noise -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Detect Noise</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_detectnoise">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_detectnoise" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
              
              <!-- Climb Walls -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Climb Walls</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_climb">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_climb" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
              
              <!-- Read Languages -->
              <div class="thief-skill-roll-item" style="display:flex;align-items:center;padding:8px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;">Read Languages</div>
                  <div style="font-size:11px;color:var(--muted);">
                    Base: <span class="thief-skill-percentage" data-skill="thief_readlang">--</span>
                    <span class="thief-skill-adjusted" style="font-weight:600;color:#fbbf24;margin-left:8px;"></span>
                  </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                  <input type="number" class="thief-skill-modifier" placeholder="+/-" style="width:60px;padding:4px;text-align:center;" title="Situational modifier">
                  <button class="roll-thief-skill" data-skill="thief_readlang" style="padding:6px 12px;white-space:nowrap;">Roll</button>
                  <div class="thief-skill-result" style="font-size:12px;font-weight:600;text-align:center;min-width:110px;"></div>
                </div>
              </div>
			</div>
            
            <!-- Thief Roll History (right side) -->
            <div>
              <h4 style="font-size:14px;margin-bottom:8px;">Thief Roll History (most recent on top)</h4>
              <div class="thief-roll-history" style="height:400px;overflow-y:auto;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-family:monospace;font-size:12px;border:1px solid var(--border);margin-bottom:8px;">
                <div style="color:var(--muted);font-style:italic;">Thief skill roll results will appear here...</div>
              </div>
              <button class="clear-thief-roll-history" style="padding:6px 12px;font-size:12px;">Clear History</button>
            </div>
          </div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
		
		<!-- Turn Undead Calculator -->
        <section class="section turn-undead-section" style="display:none;">
          <h3>Turn Undead</h3>
          <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            Attempt to turn undead creatures. Auto-updates based on your character level.
          </p>
          
          <div style="display:grid;grid-template-columns:65% 35%;gap:16px;">
            <!-- Turn Undead Table (left side) -->
            <div class="turn-undead-table">
              <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;margin-bottom:8px;font-weight:600;font-size:11px;">
                <div>Undead Type</div>
                <div style="text-align:center;">Requirement</div>
                <div></div>
              </div>
              
              <!-- Will be populated by JavaScript -->
              <div class="turn-undead-rows"></div>
            </div>
            
            <!-- Turn History (right side) -->
            <div>
              <h4 style="font-size:14px;margin-bottom:8px;">Turn History</h4>
              <div class="turn-undead-history" style="height:400px;overflow-y:auto;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-family:monospace;font-size:12px;border:1px solid var(--border);margin-bottom:8px;">
                <div style="color:var(--muted);font-style:italic;">Turn undead results will appear here...</div>
              </div>
              <button class="clear-turn-undead-history" style="padding:6px 12px;font-size:12px;">Clear History</button>
            </div>
          </div>
        </section>
		
		<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
        
        <!-- Dwarven Abilities (only shown for dwarves) -->
        <section class="section dwarven-abilities-section" style="display:none;">
          <h3>Dwarven Abilities</h3>
          
          <!-- Detection Suite -->
          <div style="margin-bottom:24px;">
            <h4 style="font-size:14px;margin-bottom:8px;">Detection Suite</h4>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
              All detection abilities require 10' movement rate and concentration. Roll d6 for each:
            </p>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <!-- Grade or Slope -->
              <div class="detection-ability" style="padding:8px;border:1px solid var(--border);border-radius:4px;">
                <div style="font-weight:600;font-size:12px;">Grade or Slope</div>
                <div style="font-size:11px;color:var(--muted);">Success: 1-5 on d6</div>
                <button class="roll-detection" data-ability="grade" data-success="5" style="margin-top:4px;padding:4px 8px;font-size:11px;">Roll d6</button>
                <div class="detection-result" style="margin-top:4px;font-size:11px;font-weight:600;"></div>
              </div>
              
              <!-- New Construction -->
              <div class="detection-ability" style="padding:8px;border:1px solid var(--border);border-radius:4px;">
                <div style="font-weight:600;font-size:12px;">New Construction</div>
                <div style="font-size:11px;color:var(--muted);">Success: 1-5 on d6</div>
                <button class="roll-detection" data-ability="new-construction" data-success="5" style="margin-top:4px;padding:4px 8px;font-size:11px;">Roll d6</button>
                <div class="detection-result" style="margin-top:4px;font-size:11px;font-weight:600;"></div>
              </div>
              
              <!-- Sliding/Shifting Walls -->
              <div class="detection-ability" style="padding:8px;border:1px solid var(--border);border-radius:4px;">
                <div style="font-weight:600;font-size:12px;">Sliding/Shifting Walls</div>
                <div style="font-size:11px;color:var(--muted);">Success: 1-4 on d6</div>
                <button class="roll-detection" data-ability="sliding-walls" data-success="4" style="margin-top:4px;padding:4px 8px;font-size:11px;">Roll d6</button>
                <div class="detection-result" style="margin-top:4px;font-size:11px;font-weight:600;"></div>
              </div>
              
              <!-- Stonework Traps -->
              <div class="detection-ability" style="padding:8px;border:1px solid var(--border);border-radius:4px;">
                <div style="font-weight:600;font-size:12px;">Stonework Traps</div>
                <div style="font-size:11px;color:var(--muted);">Success: 1-3 on d6</div>
                <button class="roll-detection" data-ability="stonework-traps" data-success="3" style="margin-top:4px;padding:4px 8px;font-size:11px;">Roll d6</button>
                <div class="detection-result" style="margin-top:4px;font-size:11px;font-weight:600;"></div>
              </div>
              
              <!-- Depth Underground -->
              <div class="detection-ability" style="padding:8px;border:1px solid var(--border);border-radius:4px;">
                <div style="font-weight:600;font-size:12px;">Depth Underground</div>
                <div style="font-size:11px;color:var(--muted);">Success: 1-3 on d6</div>
                <button class="roll-detection" data-ability="depth" data-success="3" style="margin-top:4px;padding:4px 8px;font-size:11px;">Roll d6</button>
                <div class="detection-result" style="margin-top:4px;font-size:11px;font-weight:600;"></div>
              </div>
              
              <!-- Direction Underground -->
              <div class="detection-ability" style="padding:8px;border:1px solid var(--border);border-radius:4px;">
                <div style="font-weight:600;font-size:12px;">Direction Underground</div>
                <div style="font-size:11px;color:var(--muted);">Success: 1-3 on d6</div>
                <button class="roll-detection" data-ability="direction" data-success="3" style="margin-top:4px;padding:4px 8px;font-size:11px;">Roll d6</button>
                <div class="detection-result" style="margin-top:4px;font-size:11px;font-weight:600;"></div>
              </div>
            </div>
            
            <!-- Detection History -->
            <div style="margin-top:12px;">
              <div style="font-size:12px;font-weight:600;margin-bottom:4px;">Detection History</div>
              <div class="detection-history" style="height:120px;overflow-y:auto;padding:6px;background:rgba(255,255,255,0.03);border-radius:4px;font-family:monospace;font-size:11px;border:1px solid var(--border);">
                <div style="color:var(--muted);font-style:italic;">Detection rolls will appear here...</div>
              </div>
              <button class="clear-detection-history" style="margin-top:4px;padding:4px 8px;font-size:11px;">Clear History</button>
            </div>
          </div>
        </section>		
      </main>
    </div>
  </div>

  <aside class="card right-card">
    <div class="avatar"><span class="small placeholder">No avatar — upload below</span></div>
    <input class="file-input avatar-input" type="file" accept="image/*">
    <div class="controls">
      <button class="upload-avatar">Upload Avatar</button>
      <button class="remove-avatar">Remove</button>
    </div>
	
	<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">

    <div class="sidebar-message">Currently editing: <span class="current-name">Unnamed</span></div>

<div style="margin-top:16px">
      <label class="small">Export / Import</label>
      <div class="buttons">
        <button class="save-local">Save</button>
        <button class="save-as">Save As…</button>
        <button class="open-local">Open…</button>
        <button class="export-json">Export</button>
        <button class="import-json">Import</button>
		<button class="delete-char">Delete</button>
        <button class="print">Print</button>
		<button class="kv-settings">⚙ Settings</button>
		<input class="file-input import-file" type="file" accept="application/json">
      </div>
    </div>
	
	<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
    
    <!-- Combat Tracker (Round + Conditions) -->
    <div style="margin-top:16px;padding:10px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:6px;">
      <!-- Round Counter -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">⚔️</span>
          <span style="font-size:13px;font-weight:600;color:var(--text);">Round</span>
          <span class="combat-round-display" style="font-size:18px;font-weight:700;color:var(--accent-light);">1</span>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <button class="next-round-btn" style="flex:1;padding:6px 12px;font-size:12px;font-weight:600;">Next Round ➔</button>
        <button class="reset-round-btn" style="padding:6px 12px;font-size:11px;" class="ghost">Reset</button>
      </div>
      
      <!-- Condition/Status Tracker -->
      <div style="border-top:1px solid rgba(255,100,100,0.3);padding-top:8px;">
      <label class="small">Condition / Status</label>
        <div class="condition-status-container">
          <div class="healthy-indicator" style="display:block;color:var(--accent-light);font-size:12px;padding:4px 0;">✓ Healthy</div>
          <div class="conditions-list" style="display:none;"></div>
          <button class="add-condition" style="padding:4px 8px;font-size:11px;margin-top:4px;">+ Add</button>
        </div>
      </div>
    </div>
	
	<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
	
	<!-- Rest & Recovery -->
	<div style="margin-top:16px;padding:10px;background:rgba(150,100,255,0.05);border:1px solid rgba(150,100,255,0.2);border-radius:6px;">
	  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
		<div style="display:flex;align-items:center;gap:8px;">
		  <span style="font-size:16px;">💤</span>
		  <span style="font-size:13px;font-weight:600;color:var(--text);">Rest & Recovery</span>
		</div>
	  </div>
	  <p style="font-size:11px;color:var(--muted);margin:0 0 8px 0;">Take a rest to recover HP, regain spells, and remove temporary conditions.</p>
	  <button class="rest-button" style="width:100%;padding:8px;font-size:13px;font-weight:600;background:rgba(150,100,255,0.2);border:1px solid rgba(150,100,255,0.4);color:var(--accent-light);border-radius:6px;cursor:pointer;">🛌 Rest</button>
	</div>

	<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
	
	<!-- Combat Quick Reference -->
	<div style="margin-top:16px;padding:10px;background:rgba(100,255,150,0.05);border:1px solid rgba(100,255,150,0.2);border-radius:6px;">
	  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
		<div style="display:flex;align-items:center;gap:8px;">
		  <span style="font-size:16px;">⚔️</span>
		  <span style="font-size:13px;font-weight:600;color:var(--text);">Combat Quick Reference</span>
		</div>
	  </div>
	  
	  <!-- Combat Stats -->
	  <div style="font-size:11px;line-height:1.6;margin-bottom:8px;">
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
		  <div><strong>HP:</strong> <span class="combat-hp" style="font-weight:bold;">—</span></div>
		  <div><strong>Initiative:</strong> <span class="combat-initiative">—</span></div>
		  <div><strong>THAC0:</strong> <span class="combat-thac0">—</span></div>
		  <div><strong>AC:</strong> <span class="combat-ac">—</span></div>
		</div>
		<div style="margin-top:4px;">
		  <strong>Move:</strong> <span class="combat-move">—</span>
		</div>
		<div style="margin-top:4px;">
		  <strong>Attacks/Round:</strong> 
		  <input class="combat-attacks-per-round" type="text" placeholder="1" style="width:40px;padding:2px 4px;text-align:center;background:var(--glass);border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px;">
		</div>
	  </div>
	  
	  <!-- Equipped Weapons -->
	  <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;">
		<div style="font-size:11px;font-weight:600;margin-bottom:4px;color:var(--accent-light);">Equipped Weapons:</div>
		<div class="combat-weapons-list" style="font-size:11px;line-height:1.5;">
		  <div style="color:var(--muted);font-style:italic;">No weapons equipped</div>
		</div>
	  </div>
	</div>
	
	<hr style="margin:24px 0;border:none;border-top:1px solid var(--accent);opacity:0.5;">
	
	<!-- Character Bonuses & Abilities (Quick Reference) -->
	<div class="character-bonuses-section" style="display:none;margin-top:16px;padding:10px;background:rgba(100,255,150,0.05);border:1px solid rgba(100,255,150,0.2);border-radius:6px;">
	  <!-- Header -->
	  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
		<div style="display:flex;align-items:center;gap:8px;">
		  <span style="font-size:16px;">⚔️</span>
		  <span style="font-size:13px;font-weight:600;color:var(--text);">Character Bonuses & Abilities</span>
		</div>
	  </div>

	  <!-- Combat Bonuses -->
	  <div class="bonuses-combat-section" style="display:none;margin-bottom:8px;">
		<div style="font-size:11px;font-weight:600;margin-bottom:4px;color:var(--accent-light);">⚔️ Combat Bonuses:</div>
		<div class="bonuses-combat-list" style="font-size:11px;line-height:1.6;">
		  <!-- Populated by JavaScript -->
		</div>
	  </div>

	  <!-- Defensive Bonuses -->
	  <div class="bonuses-defensive-section" style="display:none;margin-bottom:8px;">
		<div style="font-size:11px;font-weight:600;margin-bottom:4px;color:var(--accent-light);">🛡️ Defensive Bonuses:</div>
		<div class="bonuses-defensive-list" style="font-size:11px;line-height:1.6;">
		  <!-- Populated by JavaScript -->
		</div>
	  </div>

	  <!-- Special Abilities -->
	  <div class="bonuses-special-section" style="display:none;">
		<div style="font-size:11px;font-weight:600;margin-bottom:4px;color:var(--accent-light);">✨ Special Abilities:</div>
		<div class="bonuses-special-list" style="font-size:11px;line-height:1.6;">
		  <!-- Populated by JavaScript -->
		</div>
	  </div>
	</div>
  </aside>
  <!-- Spell Details Modal -->
        <div class="spell-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;justify-content:center;align-items:center;">
          <div class="spell-modal-content" style="background:var(--panel);border-radius:8px;max-width:600px;max-height:80vh;overflow-y:auto;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
              <div>
                <h2 class="spell-modal-name" style="margin:0 0 4px 0;"></h2>
                <div class="spell-modal-level" style="color:var(--muted);font-size:14px;"></div>
              </div>
              <button class="close-spell-modal" style="font-size:24px;padding:4px 12px;line-height:1;">×</button>
            </div>
            
            <div class="spell-modal-stats" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px;font-size:13px;">
              <!-- Stats populated dynamically -->
            </div>
            
            <div class="spell-modal-description" style="line-height:1.6;white-space:pre-wrap;"></div>
            
            <div style="display:flex;gap:8px;margin-top:24px;justify-content:flex-end;">
              <button class="add-to-memorized" style="padding:8px 16px;">Add to Memorized</button>
              <button class="close-spell-modal-btn" style="padding:8px 16px;">Close</button>
            </div>
          </div>
        </div>
	</div>
	
	<!-- Mobile Drawer Toggle Button -->
	<button class="drawer-toggle" aria-label="Open sidebar">
	  «
	</button>
	
	<!-- Drawer Backdrop (for closing when clicking outside) -->
	<div class="drawer-backdrop"></div>

	<!-- KV Sync Settings Modal -->
	<div class="kv-modal-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;justify-content:center;align-items:center;">
	  <div style="background:var(--panel);border-radius:8px;max-width:480px;width:90%;max-height:85vh;overflow-y:auto;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
	    <h2 style="margin:0 0 4px 0;font-size:16px;">⚙ Settings</h2>
	    <p style="font-size:12px;color:var(--muted);margin:0 0 16px;">Cloud sync for your character data via Cloudflare KV storage.</p>

	    <!-- Worker URL -->
	    <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Worker URL</label>
	    <p style="font-size:11px;color:var(--muted);margin:0 0 6px;">Deploy the gsheets-worker to your Cloudflare account and paste the URL here.</p>
	    <div style="display:flex;gap:6px;margin-bottom:4px;">
	      <input type="text" class="kv-worker-url-inp" placeholder="https://gsheets-worker.your-subdomain.workers.dev" style="flex:1;padding:6px 8px;font-size:12px;background:var(--glass);border:1px solid var(--border);border-radius:4px;color:var(--text);">
	      <button class="kv-save-worker-url" style="padding:6px 12px;font-size:12px;">Save</button>
	    </div>
	    <div class="kv-worker-url-status" style="font-size:11px;color:var(--accent-light);min-height:16px;margin-bottom:16px;"></div>

	    <hr style="border:none;border-top:1px solid var(--border);margin:0 0 16px;">

	    <!-- Sync Token -->
	    <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">☁️ KV Sync</label>
	    <p style="font-size:11px;color:var(--muted);margin:0 0 8px;">Syncs your characters across browsers via KV storage. Each user gets a unique sync token. To set up a new browser, follow the steps below in order.</p>

	    <p style="font-size:11px;margin:0 0 6px;"><strong>Step 1</strong> — Enter and save your Worker URL above.</p>
	    <p style="font-size:11px;margin:0 0 6px;"><strong>Step 2</strong> — Your sync token is your identity. Copy it and keep it safe. On a new browser, use <em>Enter Token</em> to paste it so both devices share the same KV namespace. Your token is also included in any JSON export.</p>

	    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
	      <input type="text" class="kv-token-display" readonly style="flex:1;padding:6px 8px;font-size:11px;font-family:monospace;background:var(--glass);border:1px solid var(--border);border-radius:4px;color:var(--muted);">
	      <button class="kv-copy-token" style="padding:6px 10px;font-size:11px;">Copy</button>
	      <button class="kv-enter-token" style="padding:6px 10px;font-size:11px;">Enter Token</button>
	      <button class="kv-reset-token" style="padding:6px 10px;font-size:11px;">Reset</button>
	    </div>
	    <p style="font-size:10px;color:var(--muted);margin:0 0 12px;">Reset generates a new token and permanently disconnects this browser from its current KV data.</p>

	    <p style="font-size:11px;margin:0 0 6px;"><strong>Step 3</strong> — On a new browser, after entering the token, click <em>Pull from KV</em> to download your characters. On your primary browser, use <em>Push to KV</em> to force an immediate upload.</p>
	    <div style="display:flex;gap:8px;margin-bottom:4px;">
	      <button class="kv-push-manual" style="font-size:11px;padding:6px 12px;">⬆ Push to KV</button>
	      <button class="kv-pull-manual" style="font-size:11px;padding:6px 12px;">⬇ Pull from KV</button>
	    </div>
	    <div class="kv-token-status" style="font-size:11px;color:var(--accent-light);min-height:14px;margin-bottom:12px;"></div>

	    <!-- Auto Sync Toggle -->
	    <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--glass);border-radius:4px;margin-bottom:8px;">
	      <input type="checkbox" class="kv-enabled-chk" style="width:16px;height:16px;cursor:pointer;">
	      <span style="font-size:12px;">Enable automatic KV sync</span>
	      <span class="kv-sync-status" style="margin-left:auto;font-size:11px;color:var(--muted);"></span>
	    </div>
	    <p style="font-size:10px;color:var(--muted);margin:0 0 12px;">When enabled, changes will be pushed to KV automatically within a few seconds and pulled on every page load.</p>

	    <!-- Timestamps -->
	    <div class="kv-timestamps" style="display:none;font-size:11px;color:var(--muted);margin-bottom:16px;padding-top:8px;border-top:1px solid var(--border);">
	      <div>⬆ Last pushed: <span class="kv-last-push-display" style="color:var(--text);">—</span></div>
	      <div>⬇ Last pulled: <span class="kv-last-pull-display" style="color:var(--text);">—</span></div>
	    </div>

	    <hr style="border:none;border-top:1px solid var(--border);margin:0 0 16px;">
	    <div style="display:flex;justify-content:flex-end;">
	      <button class="kv-modal-close" style="padding:8px 20px;">Close</button>
	    </div>
	  </div>
	</div>
`;