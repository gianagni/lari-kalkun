// Lari Kalkun: the run itself. The turkey runs on its own; the player steers
// between three lanes, jumps, and slides. The farmer chases from behind and
// the gap between them is the real health bar: hits and dawdling close it,
// corn and feathers open it. Reach the forest at 3000 m to escape.

import {
  CAUGHT_GAP, ESCAPE_DISTANCE, GAP, HAZARD, LANES, MAX_GAP, PLAYER, PX_PER_M,
  RUN, SCORE, SPAWN, START_GAP, TURKEY_X,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

export const EVENT_CORN = 1;
export const EVENT_FEATHER = 2;
export const EVENT_PUMPKIN = 4;
export const EVENT_HIT = 8;
export const EVENT_DODGE = 16;
export const EVENT_CAUGHT = 32;
export const EVENT_ESCAPED = 64;
export const EVENT_LEVEL = 128;

/** Small seeded random so a shot or a seeded run always plays the same. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTurkey() {
  return {
    lane: 1,
    laneFrom: 1,
    laneTimer: 0,
    y: 0,
    vy: 0,
    jumping: false,
    sliding: false,
    slideTimer: 0,
    invuln: 0,
    runPhase: 0,
    boostTimer: 0,
  };
}

export function createGame(seed) {
  // A fresh game always starts on the title screen with the turkey idle.
  const game = {
    seed,
    rand: mulberry32(seed),
    state: {
      screen: SCREEN_TITLE,
      score: 0,
      best: 0,
      distance: 0,
      lives: PLAYER.lives,
      speed: RUN.startSpeed,
      gap: START_GAP,
      stage: 0,
      time: 0,
      turkey: makeTurkey(),
      hazards: [],
      pickups: [],
      pops: [],
      hazardTimer: 1.2,
      cornTimer: 0.8,
      featherTimer: SPAWN.featherEvery,
      pumpkinTimer: SPAWN.pumpkinEvery,
      sinceFeather: 0,
      message: '',
      messageTimer: 0,
      shake: 0,
      muted: false,
      flash: 0,
    },
  };
  return game;
}

export function startGame(game) {
  const state = game.state;
  state.screen = SCREEN_PLAY;
  state.score = 0;
  state.distance = 0;
  state.lives = PLAYER.lives;
  state.speed = RUN.startSpeed;
  state.gap = START_GAP;
  state.stage = 0;
  state.time = 0;
  state.turkey = makeTurkey();
  state.hazards = [];
  state.pickups = [];
  state.pops = [];
  state.hazardTimer = 1.2;
  state.cornTimer = 0.8;
  state.featherTimer = SPAWN.featherEvery;
  state.pumpkinTimer = SPAWN.pumpkinEvery;
  state.sinceFeather = 0;
  state.message = '';
  state.messageTimer = 0;
  state.shake = 0;
  state.flash = 0;
}

function addPop(state, x, y, text, color) {
  state.pops.push({ x, y, text, color, life: 1 });
  if (state.pops.length > 12) state.pops.shift();
}

function pickLane(rand, avoid) {
  const lanes = [0, 1, 2].filter((lane) => lane !== avoid);
  return lanes[Math.floor(rand() * lanes.length)];
}

function spawnHazard(game) {
  const state = game.state;
  const rand = game.rand;
  const kinds = ['fence', 'hay', 'oven', 'knife', 'net'];
  const weights = [3, 2, 2, 2, 2];
  let roll = rand() * 11;
  let kind = 'fence';
  for (let i = 0; i < kinds.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      kind = kinds[i];
      break;
    }
  }
  const lane = Math.floor(rand() * 3);
  const def = HAZARD[kind];
  state.hazards.push({
    kind,
    lane,
    dist: state.distance + 42 + rand() * 8,
    width: def.width,
    height: def.height,
    passed: false,
    swing: kind === 'knife' ? rand() * Math.PI * 2 : 0,
  });
  if (kind === 'knife' && rand() < 0.5) {
    const other = pickLane(rand, lane);
    state.hazards.push({
      kind: 'fence',
      lane: other,
      dist: state.distance + 44 + rand() * 6,
      width: HAZARD.fence.width,
      height: HAZARD.fence.height,
      passed: false,
      swing: 0,
    });
  }
}

function spawnCorn(game, lane) {
  const state = game.state;
  const rand = game.rand;
  const useLane = lane === undefined ? Math.floor(rand() * 3) : lane;
  const count = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < count; i += 1) {
    state.pickups.push({
      kind: 'corn',
      lane: useLane,
      dist: state.distance + 40 + i * 2.2,
      taken: false,
    });
  }
}

function spawnFeather(game) {
  const state = game.state;
  state.pickups.push({
    kind: 'feather',
    lane: Math.floor(game.rand() * 3),
    dist: state.distance + 42,
    taken: false,
  });
}

function spawnPumpkin(game) {
  const state = game.state;
  state.pickups.push({
    kind: 'pumpkin',
    lane: Math.floor(game.rand() * 3),
    dist: state.distance + 42,
    taken: false,
  });
}

function turkeyGroundY(state) {
  const turkey = state.turkey;
  const from = LANES[turkey.laneFrom].ground;
  const to = LANES[turkey.lane].ground;
  const t = turkey.laneTimer >= PLAYER.laneSwitchSeconds ? 1 : turkey.laneTimer / PLAYER.laneSwitchSeconds;
  return from + (to - from) * t;
}

function turkeyScale(state) {
  const turkey = state.turkey;
  const from = LANES[turkey.laneFrom].scale;
  const to = LANES[turkey.lane].scale;
  const t = turkey.laneTimer >= PLAYER.laneSwitchSeconds ? 1 : turkey.laneTimer / PLAYER.laneSwitchSeconds;
  return from + (to - from) * t;
}

function hazardScreenX(state, hazard) {
  return TURKEY_X + (hazard.dist - state.distance) * PX_PER_M;
}

function hitTurkey(state, hazard) {
  const turkey = state.turkey;
  if (turkey.invuln > 0 || hazard.passed) return false;
  const x = hazardScreenX(state, hazard);
  if (Math.abs(x - TURKEY_X) > 34) return false;
  if (hazard.lane !== turkey.lane) return false;
  const ground = turkeyGroundY(state);
  const feet = ground - turkey.y;
  const scale = turkeyScale(state);
  const def = HAZARD[hazard.kind];
  const top = feet - def.height * 52 * scale;
  const bottom = feet;
  if (hazard.kind === 'net') {
    if (turkey.sliding) return false;
    return bottom > top + 26 * scale;
  }
  if (hazard.kind === 'knife') {
    const swing = Math.sin(hazard.swing) * 0.5 + 0.5;
    const bladeBottom = top + 30 * scale + swing * 90 * scale;
    return feet > top && bladeBottom > feet - 70 * scale;
  }
  if (turkey.jumping && feet < top - 6) return false;
  return true;
}

function takeHit(game, hazard) {
  const state = game.state;
  const turkey = state.turkey;
  hazard.passed = true;
  state.lives -= 1;
  state.gap = Math.max(CAUGHT_GAP, state.gap - GAP.hitPenalty);
  turkey.invuln = PLAYER.invulnSeconds;
  state.shake = 0.5;
  state.flash = 0.35;
  state.message = state.lives > 0 ? 'Aduh! Petani makin dekat!' : 'Tertangkap!';
  state.messageTimer = 1.4;
  addPop(state, TURKEY_X, turkeyGroundY(state) - 110, '-1 NYAWA', '#ff5a4a');
  if (state.lives <= 0) {
    state.screen = SCREEN_CAUGHT;
    return EVENT_HIT | EVENT_CAUGHT;
  }
  return EVENT_HIT;
}

export function updateGame(game, dt, controls, attract) {
  const state = game.state;
  const turkey = state.turkey;
  let events = 0;
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.shake > 0) state.shake -= dt;
  if (state.flash > 0) state.flash -= dt;
  for (const pop of state.pops) {
    pop.life -= dt * 0.9;
    pop.y -= 34 * dt;
  }
  state.pops = state.pops.filter((pop) => pop.life > 0);
  if (turkey.invuln > 0) turkey.invuln -= dt;
  if (turkey.boostTimer > 0) turkey.boostTimer -= dt;

  if (attract || state.screen === SCREEN_TITLE) {
    turkey.runPhase += dt * 7;
    return events;
  }

  const stage = Math.min(2, Math.floor(state.distance / RUN.stageLength));
  if (stage !== state.stage) {
    state.stage = stage;
    events |= EVENT_LEVEL;
    state.message = stage === 1 ? 'Ladang terbuka! Lebih cepat!' : 'Hutan di depan! Sedikit lagi!';
    state.messageTimer = 1.8;
  }

  const targetSpeed = Math.min(RUN.maxSpeed, RUN.startSpeed + state.distance * RUN.speedPerMetre);
  state.speed += (targetSpeed - state.speed) * dt * 0.5;
  const boost = turkey.boostTimer > 0 ? 1.35 : 1;
  const speed = state.speed * boost;
  state.distance += speed * dt;
  state.score += speed * dt * SCORE.perMetre;
  turkey.runPhase += dt * (7 + speed * 0.5);

  if (controls.left && turkey.lane > 0 && turkey.laneTimer >= PLAYER.laneSwitchSeconds) {
    turkey.laneFrom = turkey.lane;
    turkey.lane -= 1;
    turkey.laneTimer = 0;
  }
  if (controls.right && turkey.lane < 2 && turkey.laneTimer >= PLAYER.laneSwitchSeconds) {
    turkey.laneFrom = turkey.lane;
    turkey.lane += 1;
    turkey.laneTimer = 0;
  }
  turkey.laneTimer += dt;
  if (controls.jump && !turkey.jumping && !turkey.sliding) {
    turkey.jumping = true;
    turkey.vy = PLAYER.jumpVelocity;
  }
  if (turkey.jumping) {
    turkey.vy -= PLAYER.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y <= 0) {
      turkey.y = 0;
      turkey.vy = 0;
      turkey.jumping = false;
    }
  }
  if (controls.slide && !turkey.jumping && !turkey.sliding) {
    turkey.sliding = true;
    turkey.slideTimer = PLAYER.slideSeconds;
  }
  if (turkey.sliding) {
    turkey.slideTimer -= dt;
    if (turkey.slideTimer <= 0) turkey.sliding = false;
  }

  state.gap = Math.max(CAUGHT_GAP, state.gap - GAP.drift * dt);
  if (state.gap <= CAUGHT_GAP) {
    state.screen = SCREEN_CAUGHT;
    state.message = 'Tertangkap!';
    return events | EVENT_CAUGHT;
  }

  const spawnScale = 1 - (state.speed - RUN.startSpeed) / (RUN.maxSpeed - RUN.startSpeed) * 0.45;
  state.hazardTimer -= dt;
  if (state.hazardTimer <= 0) {
    spawnHazard(game);
    state.hazardTimer = SPAWN.hazardStart * spawnScale + game.rand() * 0.5;
  }
  state.cornTimer -= dt;
  if (state.cornTimer <= 0) {
    spawnCorn(game);
    state.cornTimer = SPAWN.cornStart * spawnScale + game.rand() * 0.6;
  }
  state.sinceFeather += dt;
  state.featherTimer -= dt;
  if (state.featherTimer <= 0) {
    spawnFeather(game);
    state.featherTimer = SPAWN.featherEvery;
    state.sinceFeather = 0;
  }
  state.pumpkinTimer -= dt;
  if (state.pumpkinTimer <= 0) {
    spawnPumpkin(game);
    state.pumpkinTimer = SPAWN.pumpkinEvery;
  }

  for (const hazard of state.hazards) {
    if (hazard.kind === 'knife') hazard.swing += dt * 3.2;
    const x = hazardScreenX(state, hazard);
    if (!hazard.passed && x < TURKEY_X - 60) {
      hazard.passed = true;
      state.score += SCORE.dodge;
      state.gap = Math.min(MAX_GAP, state.gap + GAP.dodgeBonus);
      events |= EVENT_DODGE;
      addPop(state, TURKEY_X + 60, turkeyGroundY(state) - 100, '+20', '#ffd98a');
    }
    if (hitTurkey(state, hazard)) {
      events |= takeHit(game, hazard);
      if (state.screen === SCREEN_CAUGHT) return events;
    }
  }
  state.hazards = state.hazards.filter((hazard) => hazardScreenX(state, hazard) > -160);

  for (const pickup of state.pickups) {
    if (pickup.taken) continue;
    const x = TURKEY_X + (pickup.dist - state.distance) * PX_PER_M;
    if (Math.abs(x - TURKEY_X) > 36) continue;
    if (pickup.lane !== turkey.lane) continue;
    const ground = turkeyGroundY(state);
    const feet = ground - turkey.y;
    const bob = Math.sin(state.time * 3 + pickup.dist) * 6;
    const py = ground - 52 - bob;
    if (Math.abs(feet - 40 - py) > 64 && !turkey.jumping) continue;
    pickup.taken = true;
    const px = x;
    if (pickup.kind === 'corn') {
      state.score += SCORE.corn;
      state.gap = Math.min(MAX_GAP, state.gap + GAP.cornBonus);
      events |= EVENT_CORN;
      addPop(state, px, py - 30, '+50', '#f2c230');
    } else if (pickup.kind === 'feather') {
      state.score += SCORE.feather;
      state.gap = Math.min(MAX_GAP, state.gap + GAP.featherBonus);
      turkey.boostTimer = 3;
      events |= EVENT_FEATHER;
      state.message = 'Bulu ajaib! Lari lebih cepat!';
      state.messageTimer = 1.2;
      addPop(state, px, py - 30, 'CEPAT!', '#f2ede2');
    } else {
      state.score += SCORE.pumpkin;
      state.lives = Math.min(PLAYER.lives, state.lives + 1);
      events |= EVENT_PUMPKIN;
      state.message = 'Labu! +1 nyawa.';
      state.messageTimer = 1.2;
      addPop(state, px, py - 30, '+1 NYAWA', '#e86a1e');
    }
  }
  state.pickups = state.pickups.filter((pickup) => !pickup.taken && TURKEY_X + (pickup.dist - state.distance) * PX_PER_M > -80);

  if (state.distance >= ESCAPE_DISTANCE) {
    state.screen = SCREEN_ESCAPED;
    state.message = 'Lolos ke hutan!';
    return events | EVENT_ESCAPED;
  }
  return events;
}

export { turkeyGroundY, turkeyScale, hazardScreenX };
