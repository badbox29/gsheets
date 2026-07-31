// AD&D 2e Condition/Status Effects Database
//
// SOURCING RULE FOR THIS FILE: every mechanical claim below traces to printed
// text, and the source is named in the description. An audit found six entries
// carrying invented mechanics -- including a Blinded penalty with the sign
// reversed, a Hasted AC bonus that does not exist, and a Confusion table whose
// probabilities were wrong -- all of which read as plausible rules. Anything
// that cannot be sourced says so in the text and leaves the number out.
//
// Where an effect comes from a SPELL rather than a general rule, the entry says
// so. Whether ordinary blindness or deafness carries the spell's numbers is the
// DM's call; the tool states what is printed and does not generalise silently.
//
// ===========================================================================
// STRUCTURED FIELDS -- SIGN CONVENTIONS. Read before adding or reading one.
//
// Getting a sign backwards here produces a plausible number that is wrong in
// the worst direction, and this project has been bitten by exactly that three
// times. Each field name states its own direction; none is "a bonus".
//
//   attackerToHit   Modifier to the ATTACKER'S roll against this character.
//                   POSITIVE = easier to hit him. Table 51 values go in as
//                   printed: prone +4, off-balance +2, surprised +1,
//                   invisible -4.
//   autoHit         true = melee attacks hit AUTOMATICALLY. Supersedes
//                   attackerToHit entirely; do not also set a modifier.
//   ownAttack       Modifier to THIS character's attack rolls. NEGATIVE = worse.
//   acPenalty       Points ADDED to Armor Class. In 2e higher AC is WORSE, so
//                   POSITIVE = worse. A "-4 penalty to AC" is a contradiction
//                   in terms and was the exact bug found in Blinded.
//   initiativeMod   Added to the initiative roll. Initiative is LOW-ROLL-WINS,
//                   so NEGATIVE = acts sooner. Hasted is -2.
//   moveMult        Multiplier on movement rate. 0.5 = half.
//   attackRateMult  Multiplier on attacks per round. 0.5 = half, 2 = double.
//   surpriseMod     Modifier to surprise rolls. NEGATIVE = worse. This is the
//                   character's OWN roll; a racial ability that penalises the
//                   OPPONENT'S roll is a different thing and does not go here.
//   savesWorseUnstated  true = saving throws suffer, with no number printed.
//                   A SAVING THROW field. It exists because this claim was once
//                   smuggled in as surpriseMod: null, which made a surprise
//                   field announce a saving throw effect.
//   verbalSpellFailPct  Percent chance to miscast a spell with a verbal
//                   component.
//   negatesDexCombat    true = all Dexterity combat BONUSES are cancelled.
//                   Bonuses only (PHB Ch.1): a character whose Defensive
//                   Adjustment is a PENALTY keeps it. Every reader must guard
//                   on dexAdj < 0 before backing the adjustment out.
//   blocksNaturalHealing  true = no hit points from natural rest. NEVER read
//                   this from a magical healing path.
//   beneficial      true = this condition helps the character.
//
// A FIELD IS PRESENT ONLY IF ITS VALUE IS SOURCED. Conditions whose effects
// vary (Poisoned, Cursed, Frightened, Confused) carry no numeric fields --
// their mechanics are situational or table-driven and belong in the prose.
// ===========================================================================
//
// PHB Table 51 is the authority for what attackers gain against a condition.
// Its three relevant rows: "Defender sleeping or held -- Automatic",
// "Defender stunned or prone -- +4", "Defender invisible -- -4",
// plus "Defender off-balance -- +2" and "Defender surprised -- +1".
const CONDITIONS_DB = [
  {
    name: 'Healthy',
    description: 'No adverse conditions affecting the character.'
  },
  {
    name: 'Poisoned',
    // PHB Ch.9, "Poison". The two named categories and their exact effects.
    description: 'Effects depend on the poison. PARALYTIC: unable to move for 2d6 hours, body limp, no other ill effects. DEBILITATING: 1d3 days with ALL ability scores reduced by half (apply every resulting adjustment to attack rolls, damage, Armor Class and so on), movement at half rate, and the character CANNOT HEAL by normal or magical means until the poison is neutralized or the duration elapses. Cure spells (including heal) do not halt a poison, and neutralize poison does not restore hit points already lost. Herbalism proficiency can reduce the danger (PHB Ch.9).'
  },
  {
    name: 'Diseased',
    description: 'Character is afflicted with disease. Typically causes ability score penalties, HP loss over time, and may be contagious. Removed by a cure disease spell, or by a paladin\u2019s laying on of hands. Duration and severity are the DM\u2019s call \u2014 2e handles disease in the DMG, not the PHB.'
  },
  {
    name: 'Cursed',
    description: 'Character is under a magical curse. Effects vary widely depending on the curse. Requires remove curse spell or fulfilling the curse\u2019s conditions.'
  },
  {
    name: 'Charmed',
    description: 'Character regards the caster as a trusted friend and ally, will not attack the charmer, and can be ordered to perform reasonable actions. Exact effects and duration depend on the spell used.'
  },
  {
    name: 'Held',
    autoHit: true,
    // Table 51: "Defender sleeping or held -- Automatic". NOT an AC penalty --
    // the attack simply hits. The old entry claimed "AC worsens significantly",
    // which is both weaker and wrong.
    description: 'Rigidly immobile. Cannot move or speak, but remains aware of events and can use abilities requiring neither motion nor speech. Being held does NOT prevent a condition worsening from wounds, disease or poison (hold person). ATTACKS IN MELEE HIT AUTOMATICALLY (PHB Table 51). If no other fighting is going on, the defender can be slain automatically.'
  },
  {
    name: 'Stunned',
    attackerToHit: 4,
    moveMult: 1/3,
    // Description from power word, stun; effects list from symbol (stunning).
    description: 'Reeling and unable to think coherently or act (power word, stun). Drops whatever is held. Cannot communicate, cast spells, use magical items, initiate psionics, use spell-like powers, fight, or move freely; movement is limited to one-third normal rate (symbol). ATTACKERS GAIN +4 TO HIT (PHB Table 51). Duration by power word, stun is 4d4 rounds at 1\u201330 hp, 2d4 at 31\u201360, 1d4 at 61\u201390; creatures over 90 hp are unaffected.'
  },
  {
    name: 'Unconscious',
    autoHit: true,
    // "May be coup de graced" removed -- coup de grace is not a 2e PHB concept
    // and appears nowhere in Chapter 9.
    description: 'Helpless and unaware of surroundings. Cannot take actions. ATTACKS IN MELEE HIT AUTOMATICALLY, as for a sleeping or held defender (PHB Table 51). If no other fighting is going on, the defender can be slain automatically.'
  },
  {
    name: 'Blinded',
    attackerToHit: 4,
    ownAttack: -4,
    // SIGN CORRECTED. The old entry read "-4 penalty to AC", which in 2e IMPROVES
    // Armor Class -- it made a blinded character harder to hit. The blindness
    // spell states the rule the other way round, and Blind-fighting (PHB Ch.5)
    // independently confirms the -4 attack figure.
    description: 'Able to see only a grayness. Suffers \u22124 to its own attack rolls, and its OPPONENTS GAIN +4 to their attack rolls (blindness). Blind-fighting proficiency reduces the character\u2019s own penalty to \u22122 in total darkness and \u22121 under starlight or moonlight, removes AC penalties from darkness, and halves the movement penalty \u2014 but grants no protection against missile fire. Cure spells do not remove the blindness spell; only dispel magic or the caster can.'
  },
  {
    name: 'Deafened',
    surpriseMod: -1,
    verbalSpellFailPct: 20,
    // Sourced to the deafness spell, which supplies BOTH effects. The 20%
    // miscast chance was missing entirely and is the more consequential half.
    description: 'Totally deaf and unable to hear any sounds. Suffers a \u22121 penalty to surprise rolls unless its other senses are unusually keen. DEAFENED SPELLCASTERS HAVE A 20% CHANCE TO MISCAST any spell with a verbal component (deafness). The deafness spell is removed only by dispel magic or by the caster.'
  },
  {
    name: 'Slowed',
    ownAttack: -4,
    acPenalty: 4,
    moveMult: 0.5,
    attackRateMult: 0.5,
    negatesDexCombat: true,
    // CORRECTED from the slow spell. The old entry had -2 AC (wrong sign AND
    // wrong number), omitted the attack penalty and the Dexterity clause
    // entirely, and added a casting-time effect that does not exist.
    description: 'Moves and attacks at half normal rate. ARMOR CLASS PENALTY OF +4 (worse), ATTACK PENALTY OF \u22124, and ALL DEXTERITY COMBAT BONUSES ARE NEGATED (slow). Negates a haste spell or equivalent. Saving throws against the slow spell itself suffer \u22124.'
  },
  {
    name: 'Hasted',
    initiativeMod: -2,
    moveMult: 2,
    attackRateMult: 2,
    beneficial: true,
    // CORRECTED from the haste spell. The old entry claimed "+2 to AC", which
    // the spell does not grant -- it gives a -2 INITIATIVE bonus. The ageing
    // clause was missing and is the most consequential part of the spell.
    description: 'Functions at double normal movement and attack rates, and gains a \u22122 INITIATIVE BONUS. Spellcasting and spell effects are NOT sped up. Grants no Armor Class benefit. AGES THE RECIPIENT BY ONE YEAR through sped-up metabolism. Not cumulative with itself or similar magic; negates a slow spell. (Beneficial condition, with a cost.)'
  },
  {
    name: 'Fatigued',
    // UNSOURCED NUMBERS REMOVED. The old entry gave -2 to attack, damage and
    // ability checks plus a movement reduction. None of that appears in Ch.9,
    // no spell produces it, and Ch.14's forced-march rule is -1 per day
    // cumulative, which does not match. Fatigue is a DMG concept; the marker is
    // useful, the invented penalties were not.
    description: 'Exhausted from overexertion or lack of rest. EFFECTS ARE THE DM\u2019S CALL \u2014 the PHB does not define a general fatigue condition. For reference, PHB Ch.14 gives forced marching a cumulative \u22121 to attack rolls per day of march, and running requires Constitution checks to sustain.'
  },
  {
    name: 'Malnourished and Sleep-Deprived',
    // FIRST STRUCTURED FIELD IN THIS DATABASE. Everything else here is prose,
    // which means real mechanics sit trapped in strings where nothing can read
    // them. Add structured fields alongside the description, never replacing it.
    //
    // PHB Ch.9, natural healing: "In both cases above, the character is assumed
    // to be getting adequate food, water, and sleep. If these are lacking, the
    // character does not regain any hit points that day."
    //
    // SCOPE: NATURAL healing only. That clause sits under the 1-per-day and
    // 3-per-day rest rates; magical healing is a separate section of the
    // chapter and is unaffected. A cure light wounds works fine on a starving
    // character, and this flag must never be read by potion or spell healing.
    blocksNaturalHealing: true,
    description: 'Lacking adequate food, water, or sleep. The character regains NO hit points from natural rest of any duration (PHB Ch.9). Magical healing is unaffected. Clear this once the character is properly fed, watered and rested.'
  },
  {
    name: 'Dying',
    description: 'At 0 to \u22129 hit points. Unconscious and losing 1 hit point per round until stabilized. Requires binding of wounds or healing magic. Dies at \u221210 (PHB Ch.9).'
  },
  {
    name: 'Dead',
    description: 'Reached \u221210 hit points or suffered an instant-death effect. Requires raise dead, resurrection, or wish to restore to life.'
  },
  {
    name: 'Petrified',
    description: 'Turned to stone. Unaware of surroundings and of the passage of time. Can be shattered if struck with sufficient force. Requires stone to flesh to restore.'
  },
  {
    name: 'Paralyzed',
    autoHit: true,
    // RECONCILED WITH HELD. The old entry gave attackers +4; Table 51 puts
    // "sleeping or held" in the Automatic row and only "stunned or prone" at +4.
    // The hold person spell describes exactly this state -- "cannot move or
    // speak, but they remain aware of events around them" -- so paralysis is
    // held for Table 51 purposes and the attack is automatic, not merely easier.
    description: 'Cannot move, but remains conscious and aware. Cannot cast spells requiring gestures. ATTACKS IN MELEE HIT AUTOMATICALLY, as for a sleeping or held defender (PHB Table 51) \u2014 this is the same state hold person produces, not the lesser +4 that applies to a stunned or prone defender.'
  },
  {
    name: 'Frightened',
    // CORRECTED from the fear spell. The old "-2 penalty if unable to flee" is
    // not in the spell; the drop-item chance, which is, was missing.
    description: 'Turns away from the source and flees in panic at its fastest rate, for a number of rounds equal to the caster\u2019s level. LIKELY TO DROP WHATEVER IS HELD: 60% at 1st level or 1 Hit Die, reduced 5% per level above that, so 15% at 10th and no chance at 13th (fear). Undead are unaffected, and a successful save negates. What happens to a frightened character who cannot flee is the DM\u2019s call.'
  },
  {
    name: 'Confused',
    // TABLE CORRECTED. The old spread (1-2 / 3-5 / 6-8 / 9-10) doubled the
    // chance of wandering away and nearly halved "stand confused". The printed
    // table is below, and CHAOS USES THE IDENTICAL TABLE.
    //
    // Note the asymmetry the old entry lost: wandering away lasts the WHOLE
    // duration, every other result is one round and then re-roll.
    description: 'Indecisive and unable to take effective action. Roll 1d10 at the start of each round \u2014 1: wander away (unless prevented) FOR THE WHOLE DURATION; 2\u20136: stand confused for one round, then roll again; 7\u20139: attack nearest creature for one round, then roll again; 10: act normally for one round, then roll again. Any confused creature that is attacked perceives the attacker as an enemy. (confusion and chaos share this table.)'
  },
  {
    name: 'Invisible',
    attackerToHit: -4,
    beneficial: true,
    // The attacker's -4 is Table 51 and is real. The old entry ALSO claimed the
    // invisible character gains +4 to attack; the invisibility spell says only
    // that invisibility "enables him to attack first". Claim removed.
    description: 'Cannot be seen by normal vision or infravision. ATTACKERS SUFFER \u22124 TO HIT (PHB Table 51); Blind-fighting proficiency reduces that penalty to \u22122. Invisibility ends the moment the character attacks, though it lets him attack first; bless, chant and prayer do not count as attacks. Dropped items become visible. Highly intelligent creatures of 10+ Hit Dice may notice an invisible object with a save vs. spell. (Beneficial condition.)'
  },
  {
    name: 'Prone',
    attackerToHit: 4,
    negatesDexCombat: true,
    // Table 51, same row as Stunned. Was missing entirely.
    // negatesDexCombat is PHB Ch.1, Defensive Adjustment: beneficial Dexterity
    // modifiers to Armor Class do not apply when movement is restricted, and
    // "attacked while prone" is the first case the book names.
    description: 'Knocked down or lying flat. ATTACKERS GAIN +4 TO HIT (PHB Table 51, "Defender stunned or prone"). Regaining your feet is the DM\u2019s call on cost.'
  },
  {
    name: 'Off-balance',
    attackerToHit: 2,
    // Table 51. Was missing entirely.
    description: 'Caught mid-movement, on poor footing, or otherwise unable to set for defence. ATTACKERS GAIN +2 TO HIT (PHB Table 51).'
  },
  {
    name: 'Surprised',
    attackerToHit: 1,
    negatesDexCombat: true,
    savesWorseUnstated: true,
    // Table 51 and PHB Ch.9 for the +1 and the saving throw clause. Everything
    // else is PHB Ch.11, which is the authority on what surprise COSTS you:
    // "the surprised characters lose all AC bonuses for high Dexterity during
    // that instant of surprise." BONUSES -- Ch.1 confirms only BENEFICIAL
    // Dexterity modifiers are suspended, so a poor-Dexterity penalty is not shed.
    description: 'Taken unawares and unable to react until wits are gathered. The unsurprised side gets ONE BONUS ROUND of melee, missile or magical item attacks at its full attacks per round, but CANNOT CAST SPELLS during it (PHB Ch.11). ALL DEXTERITY ARMOR CLASS BONUSES ARE LOST for that instant (PHB Ch.11); a Dexterity AC penalty is not shed. ATTACKERS GAIN +1 TO HIT (PHB Table 51), and a surprised character also has a DECREASED CHANCE OF ROLLING A SUCCESSFUL SAVING THROW (PHB Ch.9). If both groups surprise each other, the effects of surprise are cancelled (PHB Ch.11).'
  },
  {
    name: 'Fighting via Mirror',
    ownAttack: -2,
    negatesDexCombat: true,
    // PHB Ch.13, "Using Mirrors". The chapter gives two effects with DIFFERENT
    // SCOPES and this entry's name is deliberately the narrower of them. The
    // -2 covers "all actions requiring an ability or proficiency check or an
    // attack roll" -- lock-picking by reflection costs it too. The Dexterity
    // clause applies ONLY "if fighting an opponent seen only in a mirror", so
    // tagging a man merely peering round a corner would strip his AC for no
    // printed reason. negatesDexCombat is read by calc.js as AC-only and
    // guarded on dexDefAdj < 0, which is exactly right: the chapter forfeits
    // BONUSES, so a poor Dexterity keeps its penalty. The ability- and
    // proficiency-check half has no structured field and lives in the prose,
    // as Poisoned's does.
    description: 'Fighting an opponent seen only by reflection. Suffers \u22122 ON ATTACK ROLLS and LOSES ALL DEXTERITY BONUSES TO ARMOR CLASS. The same \u22122 applies to ANY action directed by a mirror, in or out of combat -- every ability check and every proficiency check -- because acting on a reflected view is disorienting. A MIRROR IS ALSO USELESS WITHOUT A LIGHT SOURCE. Mirrors are the standard answer to creatures so hideous that gazing directly upon them might turn the viewer to stone, such as a medusa (PHB Ch.13).'
  }
];

// Get condition description by name
function getConditionDescription(conditionName) {
  const condition = CONDITIONS_DB.find(c => c.name === conditionName);
  return condition ? condition.description : 'No description available.';
}

// Get all condition names for dropdown
function getAllConditionNames() {
  return CONDITIONS_DB.map(c => c.name);
}

// Short mechanical summary of a condition, built from the STRUCTURED fields
// only -- never parsed out of the description. Returns [] for conditions whose
// effects are situational (Poisoned, Cursed, Frightened, Confused), which is
// correct: they have no single modifier to state.
//
// Phrasing states DIRECTION IN WORDS, not just sign. "+4 AC (worse)" rather
// than "+4 AC", because a player glancing at a card should not have to
// remember which way 2e's AC runs.
function summarizeConditionEffects(nameOrDef) {
  const c = (typeof nameOrDef === 'string')
    ? CONDITIONS_DB.find(x => x.name === nameOrDef)
    : nameOrDef;
  if (!c) return [];

  const out = [];
  const sign = n => (n > 0 ? '+' : '') + n;

  // autoHit supersedes attackerToHit -- it is a different rule, not a big bonus.
  if (c.autoHit) out.push('melee hits automatically');
  else if (c.attackerToHit !== undefined && c.attackerToHit !== 0) {
    out.push('attackers ' + sign(c.attackerToHit) +
             (c.attackerToHit > 0 ? ' to hit' : ' to hit (harder)'));
  }

  if (c.ownAttack) out.push(sign(c.ownAttack) + ' your attacks');
  if (c.acPenalty) out.push(sign(c.acPenalty) + ' AC (worse)');
  if (c.initiativeMod) {
    out.push(sign(c.initiativeMod) + ' initiative' +
             (c.initiativeMod < 0 ? ' (sooner)' : ' (later)'));
  }
  if (c.moveMult !== undefined && c.moveMult !== 1) {
    out.push(c.moveMult === 0.5 ? 'half move'
           : c.moveMult === 2   ? 'double move'
           : Math.round(c.moveMult * 100) + '% move');
  }
  if (c.attackRateMult !== undefined && c.attackRateMult !== 1) {
    out.push(c.attackRateMult === 0.5 ? 'half attacks'
           : c.attackRateMult === 2   ? 'double attacks'
           : Math.round(c.attackRateMult * 100) + '% attacks');
  }
  if (c.negatesDexCombat)    out.push('no DEX combat bonuses');
  if (c.surpriseMod)         out.push(sign(c.surpriseMod) + ' surprise');
  if (c.savesWorseUnstated)  out.push('saves worse (amount unstated)');
  if (c.verbalSpellFailPct)  out.push(c.verbalSpellFailPct + '% verbal miscast');
  if (c.blocksNaturalHealing) out.push('no natural healing');

  return out;
}
