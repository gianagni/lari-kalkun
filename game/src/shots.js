// Lari Kalkun: the four deterministic screenshot scenes behind
// ?shot=title|run|chase|escape. Each one places the turkey, the farmer, the
// hazards and the pickups by hand, so the same query always paints the same
// frame. No random draws and no clock run in a shot.

import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './state.js';

function baseScene(game, distance, score) {
  const state = game.state;
  state.screen = SCREEN_PLAY;
  state.distance = distance;
  state.score = score;
  state.time = 42;
  state.message = '';
  state.messageTimer = 0;
  state.shake = 0;
  state.flash = 0;
  state.turkey.lane = 1;
  state.turkey.laneFrom = 1;
  state.turkey.laneTimer = 1;
  state.turkey.y = 0;
  state.turkey.vy = 0;
  state.turkey.jumping = false;
  state.turkey.sliding = false;
  state.turkey.invuln = 0;
  state.turkey.runPhase = 2.4;
  state.turkey.boostTimer = 0;
  state.hazards = [];
  state.pickups = [];
  state.pops = [];
  return state;
}

function putHazard(state, kind, lane, dist, swing) {
  state.hazards.push({
    kind,
    lane,
    dist,
    width: 2,
    height: 1.4,
    passed: false,
    swing: swing ?? 0,
  });
}

function putPickup(state, kind, lane, dist) {
  state.pickups.push({ kind, lane, dist, taken: false });
}

/**
 * Stage the named scene on `game` (title, run, chase, escape; anything else
 * is title) and return the screen to draw.
 */
export function stageShot(name, game) {
  if (name === 'run') {
    const state = baseScene(game, 640, 1280);
    state.lives = 3;
    state.speed = 11.5;
    state.gap = 58;
    state.stage = 0;
    state.turkey.jumping = true;
    state.turkey.y = 150;
    state.turkey.vy = 320;
    state.turkey.runPhase = 1.1;
    putHazard(state, 'fence', 1, 640, 0);
    putHazard(state, 'hay', 0, 652, 0);
    putHazard(state, 'oven', 2, 668, 0);
    putPickup(state, 'corn', 1, 648);
    putPickup(state, 'corn', 1, 650.2);
    putPickup(state, 'corn', 1, 652.4);
    putPickup(state, 'feather', 2, 660);
    state.pops.push({ x: 420, y: 420, text: '+50', color: '#f2c230', life: 1 });
    return SCREEN_PLAY;
  }
  if (name === 'chase') {
    const state = baseScene(game, 1840, 3720);
    state.lives = 1;
    state.speed = 15.2;
    state.gap = 14;
    state.stage = 1;
    state.turkey.runPhase = 4.6;
    state.message = 'Aduh! Petani makin dekat!';
    state.messageTimer = 1.4;
    putHazard(state, 'oven', 1, 1852, 0);
    putHazard(state, 'knife', 1, 1858, 1.1);
    putHazard(state, 'net', 2, 1862, 0);
    putHazard(state, 'fence', 0, 1866, 0);
    putPickup(state, 'corn', 0, 1870);
    return SCREEN_PLAY;
  }
  if (name === 'escape') {
    const state = baseScene(game, 3000, 6120);
    state.screen = SCREEN_ESCAPED;
    state.lives = 2;
    state.speed = 0;
    state.gap = 96;
    state.stage = 2;
    state.best = 6120;
    state.message = 'Lolos ke hutan!';
    return SCREEN_ESCAPED;
  }
  const state = baseScene(game, 0, 0);
  state.screen = SCREEN_TITLE;
  state.lives = 3;
  state.speed = 9;
  state.gap = 34;
  state.stage = 0;
  state.best = 0;
  putHazard(state, 'fence', 0, 30, 0);
  putHazard(state, 'hay', 2, 38, 0);
  putPickup(state, 'corn', 1, 34);
  return SCREEN_TITLE;
}

export function shotSeed(name) {
  const seeds = { title: 7, run: 21, chase: 42, escape: 99 };
  return seeds[name] ?? 7;
}
