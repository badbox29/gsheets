// AD&D 2e Condition/Status Effects Database
const CONDITIONS_DB = [
  {
    name: 'Healthy',
    description: 'No adverse conditions affecting the character.'
  },
  {
    name: 'Poisoned',
    description: 'Character has been poisoned. Effects vary by poison type but typically include ability score penalties, HP damage over time, or death. Requires save vs. poison or neutralize poison spell to cure.'
  },
  {
    name: 'Diseased',
    description: 'Character is afflicted with disease. Typically causes ability score penalties, HP loss over time, and may be contagious. Requires cure disease spell or extended rest with proper care.'
  },
  {
    name: 'Cursed',
    description: 'Character is under a magical curse. Effects vary widely depending on the curse. Requires remove curse spell or fulfilling curse conditions.'
  },
  {
    name: 'Charmed',
    description: 'Character regards the caster as a trusted friend and ally. Will not attack the charmer and will defend them. Can be ordered to perform reasonable actions. Duration varies by spell.'
  },
  {
    name: 'Held',
    description: 'Character is paralyzed and cannot move or speak, though remains aware of surroundings. AC worsens significantly. Cannot cast spells or use items. Automatically hit in melee.'
  },
  {
    name: 'Stunned',
    description: 'Character is reeling and unable to think coherently or act. Maximum movement is 1/3 normal rate (minimum 3). Cannot communicate, cast spells, use items, fight effectively, or use psionics. Attackers gain +4 to hit.'
  },
  {
    name: 'Unconscious',
    description: 'Character is helpless and unaware of surroundings. Cannot take actions. Automatically hit in melee combat. May be coup de graced.'
  },
  {
    name: 'Blinded',
    description: 'Character cannot see. -4 penalty to AC and attack rolls. Cannot cast spells requiring line of sight. Movement rate halved. Automatically fails checks requiring sight.'
  },
  {
    name: 'Deafened',
    description: 'Character cannot hear. -1 penalty to surprise rolls. Cannot hear verbal commands or warnings. Spells with verbal components may require concentration checks (DM discretion).'
  },
  {
    name: 'Slowed',
    description: 'Character moves and attacks at half normal rate. Can only make one attack per round regardless of normal number of attacks. Casting time doubled. -2 to AC.'
  },
  {
    name: 'Hasted',
    description: 'Character moves and attacks at double rate. Gains extra attack per round. Movement rate doubled. +2 to AC. (Beneficial condition)'
  },
  {
    name: 'Fatigued',
    description: 'Character is exhausted from overexertion or lack of rest. -2 penalty to attack rolls, damage rolls, and ability checks. Movement rate reduced by 1/3.'
  },
  {
    name: 'Dying',
    description: 'Character is at 0 to -9 hit points. Unconscious and losing 1 HP per round until stabilized. Requires immediate aid (binding wounds) or healing magic. Dies at -10 HP.'
  },
  {
    name: 'Dead',
    description: 'Character has reached -10 hit points or suffered instant death effect. Requires raise dead, resurrection, or wish spell to restore to life.'
  },
  {
    name: 'Petrified',
    description: 'Character has been turned to stone. Unaware of surroundings and passage of time. Can be shattered if struck with sufficient force. Requires stone to flesh spell to restore.'
  },
  {
    name: 'Paralyzed',
    description: 'Character cannot move but remains conscious and aware. Can still speak, think, and perceive surroundings. Cannot cast spells requiring gestures. Attackers gain +4 to hit.'
  },
  {
    name: 'Frightened',
    description: 'Character must flee from source of fear for duration. If unable to flee, cowers and fights at -2 penalty. May drop items. Requires successful save to overcome.'
  },
  {
    name: 'Confused',
    description: 'Character acts randomly each round. Roll 1d10: 1-2 wander away, 3-5 stand confused, 6-8 attack nearest creature, 9-10 act normally. Cannot cast spells reliably.'
  },
  {
    name: 'Invisible',
    description: 'Character cannot be seen. Attackers suffer -4 to hit. Character gains +4 to attack rolls. Ends if character attacks. (Beneficial condition)'
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