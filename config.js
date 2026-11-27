// Lari Kalkun: tuning for the turkey escape run. All numbers live here so the
// run can be rebalanced without touching the rules in state.js or render.js.

export const FIELD = { width: 1280, height: 800 };
export const STEP = 1 / 60;

/** The three running lanes: ground line and draw scale per lane (near lanes read bigger). */
export const LANES = [
  { ground: 566, scale: 0.86 },
  { ground: 636, scale: 1.0 },
  { ground: 706, scale: 1.14 },
];
export const TURKEY_X = 300;
/** Pixels per metre of run, used to place hazards ahead of the turkey. */
export const PX_PER_M = 30;

/** How far the turkey must run to reach the safety of the forest. */
export const ESCAPE_DISTANCE = 3000;
/** The farmer catches the turkey when the gap closes to this. */
export const CAUGHT_GAP = 0;
/** Gap when a run starts, and the most it can grow to. */
export const START_GAP = 60;
export const MAX_GAP = 120;

export const PLAYER = {
  lives: 3,
  jumpVelocity: 980,
  gravity: 2600,
  slideSeconds: 0.65,
  invulnSeconds: 1.6,
  laneSwitchSeconds: 0.16,
};

export const RUN = {
  startSpeed: 9,
  maxSpeed: 17,
  /** Speed grows this much per metre run. */
  speedPerMetre: 0.0022,
  /** Metres of run between stages: farmyard, open fields, forest edge. */
  stageLength: 1000,
};

export const GAP = {
  /** The gap drifts closed this fast (m/s) when the turkey dawdles. */
  drift: 0.9,
  /** Corn nudges the gap open; a feather opens it more; a hit slams it shut. */
  cornBonus: 2.5,
  featherBonus: 9,
  hitPenalty: 16,
  /** Cleanly passing a hazard opens the gap a little. */
  dodgeBonus: 1.5,
};

export const SCORE = {
  perMetre: 2,
  corn: 50,
  feather: 30,
  pumpkin: 100,
  dodge: 20,
};

export const SPAWN = {
  /** Seconds between hazard spawns at the start, shrinking as the run speeds up. */
  hazardStart: 1.5,
  hazardEnd: 0.8,
  cornStart: 1.1,
  cornEnd: 0.7,
  featherEvery: 14,
  pumpkinEvery: 45,
};

export const HAZARD = {
  fence: { width: 1.6, height: 1.0, jump: true, slide: false },
  hay: { width: 2.2, height: 1.4, jump: true, slide: false },
  oven: { width: 2.4, height: 1.6, jump: true, slide: false },
  knife: { width: 1.2, height: 2.6, jump: false, slide: false },
  net: { width: 2.0, height: 1.2, jump: false, slide: true },
};

/** Warm dusk palette for the farm at sunset. */
export const COLORS = {
  skyTop: '#3d2b63',
  skyMid: '#b5526a',
  skyLow: '#f28c4b',
  sun: '#ffd98a',
  hillFar: '#6b4a7a',
  hillNear: '#4a5d3a',
  ground: '#7a5a33',
  grass: '#5d7a35',
  barn: '#8a3b2e',
  barnRoof: '#5d2a20',
  fenceWood: '#6b4a2f',
  turkeyBody: '#8a5a2e',
  turkeyWing: '#6b4220',
  turkeyHead: '#c98a4b',
  turkeyWattle: '#c23b2e',
  farmerShirt: '#3e6b8a',
  farmerPants: '#4a3b52',
  farmerSkin: '#e8b88a',
  farmerHat: '#d9b24a',
  ovenGlow: '#ff7a2e',
  knifeBlade: '#d9dee6',
  cornYellow: '#f2c230',
  featherWhite: '#f2ede2',
  pumpkinOrange: '#e86a1e',
};
