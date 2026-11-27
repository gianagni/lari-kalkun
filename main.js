// Lari Kalkun: boot and the one loop. Input is read every frame, the run
// advances in fixed 1/60 s steps, and the renderer paints what is there. The
// game moves between five screens: title, playing, paused, caught, escaped.
//
// ?shot=title|run|chase|escape (with &seed=N) stages that scene instead of
// running the loop, paints it twice and sets window.__shotReady for a
// screenshot. ?seed=N fixes the spawns for a normal run.

import { FIELD, STEP } from './config.js';
import { createAudio } from './audio.js';
import {
  KEY_CONFIRM, KEY_MUTE, KEY_PAUSE, KEY_RESTART, createInput, hitRect,
} from './input.js';
import { drawGame } from './render.js';
import { shotSeed, stageShot } from './shots.js';
import {
  EVENT_CAUGHT, EVENT_CORN, EVENT_DODGE, EVENT_ESCAPED, EVENT_FEATHER,
  EVENT_HIT, EVENT_PUMPKIN, SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED,
  SCREEN_PLAY, SCREEN_TITLE, createGame, startGame, updateGame,
} from './state.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : (shot ? shotSeed(shot) : Math.floor(Math.random() * 4294967296));

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(seed);
const audio = createAudio();
const state = game.state;
// Test hook: the live state is readable from the console for play-testing.
window.__kalkun = game;

/** Size the canvas to its logical field and keep it sharp on dense screens. */
function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const width = Math.floor(FIELD.width * scale);
  const height = Math.floor(FIELD.height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = FIELD.width * ratio;
  canvas.height = FIELD.height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

const ctx = fitCanvas();
window.addEventListener('resize', () => {
  fitCanvas();
});

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem('lari-kalkun.best') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem('lari-kalkun.best', String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

state.best = readBest();

function playEvents(events) {
  if (events & EVENT_CORN) audio.corn();
  if (events & EVENT_FEATHER) audio.feather();
  if (events & EVENT_PUMPKIN) audio.pumpkin();
  if (events & EVENT_DODGE) audio.dodge();
  if (events & EVENT_HIT) {
    audio.crash();
    audio.shout();
  }
  if (events & EVENT_CAUGHT) audio.caught();
  if (events & EVENT_ESCAPED) audio.escaped();
}

function runShot(name) {
  stageShot(name, game);
  let painted = 0;
  function paint() {
    drawGame(ctx, game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();
  // Edge-triggered moves: a quick tap can land and lift between two frames,
  // so the key queue records the intent and the next step consumes it.
  let jumpQueued = false;
  let slideQueued = false;
  let laneQueued = 0;

  function announce(message) {
    status.textContent = message;
  }

  function endRun() {
    if (state.score > state.best) {
      state.best = state.score;
      saveBest(state.best);
    }
    if (state.screen === SCREEN_ESCAPED) announce(`Lolos! Skor ${Math.floor(state.score)}.`);
    else announce(`Tertangkap. Skor ${Math.floor(state.score)}.`);
  }

  function buttonRect() {
    return { x: FIELD.width / 2 - 220, y: 470, width: 440, height: 64 };
  }

  function handleClicks() {
    for (const point of input.takeClicks()) {
      audio.unlock();
      if (state.screen === SCREEN_TITLE) {
        audio.gobble();
        startGame(game);
        announce('Lari! Lompat pagar, kumpulkan jagung.');
        continue;
      }
      if (state.screen === SCREEN_CAUGHT || state.screen === SCREEN_ESCAPED) {
        if (hitRect(point.x, point.y, buttonRect())) {
          audio.gobble();
          startGame(game);
          announce('Lari! Lompat pagar, kumpulkan jagung.');
        }
        continue;
      }
      if (state.screen === SCREEN_PAUSED) {
        state.screen = SCREEN_PLAY;
        announce('Lanjut lari.');
      }
    }
  }

  function handleKeys() {
    for (const code of input.takeKeys()) {
      audio.unlock();
      if (code === KEY_MUTE) {
        state.muted = !state.muted;
        audio.setMuted(state.muted);
        announce(state.muted ? 'Suara mati.' : 'Suara hidup.');
        continue;
      }
      if (code === KEY_RESTART && state.screen !== SCREEN_TITLE) {
        startGame(game);
        announce('Lari! Lompat pagar, kumpulkan jagung.');
        continue;
      }
      if (code === KEY_PAUSE && state.screen === SCREEN_PLAY) {
        state.screen = SCREEN_PAUSED;
        announce('Jeda.');
        continue;
      }
      if (code === KEY_PAUSE && state.screen === SCREEN_PAUSED) {
        state.screen = SCREEN_PLAY;
        announce('Lanjut lari.');
        continue;
      }
      if (code === KEY_CONFIRM) {
        if (state.screen === SCREEN_TITLE) {
          audio.gobble();
          startGame(game);
          announce('Lari! Lompat pagar, kumpulkan jagung.');
        } else if (state.screen === SCREEN_CAUGHT || state.screen === SCREEN_ESCAPED) {
          audio.gobble();
          startGame(game);
          announce('Lari! Lompat pagar, kumpulkan jagung.');
        } else if (state.screen === SCREEN_PAUSED) {
          state.screen = SCREEN_PLAY;
          announce('Lanjut lari.');
        }
        // The Space that starts a run must not also queue a jump.
        continue;
      }
      if ((code === 'ArrowUp' || code === 'KeyW' || code === 'Space') && state.screen === SCREEN_PLAY) {
        audio.flap();
        jumpQueued = true;
      }
      if (code === 'ArrowLeft' || code === 'KeyA') {
        if (state.screen === SCREEN_PLAY) laneQueued = -1;
      }
      if (code === 'ArrowRight' || code === 'KeyD') {
        if (state.screen === SCREEN_PLAY) laneQueued = 1;
      }
      if ((code === 'ArrowDown' || code === 'KeyS') && state.screen === SCREEN_PLAY) {
        slideQueued = true;
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClicks();
    handleKeys();
    if (state.screen === SCREEN_PLAY) {
      const live = input.controls();
      const controls = {
        left: live.left || laneQueued < 0,
        right: live.right || laneQueued > 0,
        jump: live.jump || jumpQueued,
        slide: live.slide || slideQueued,
      };
      jumpQueued = false;
      slideQueued = false;
      laneQueued = 0;
      while (accumulator >= STEP) {
        const events = updateGame(game, STEP, controls, false);
        playEvents(events);
        accumulator -= STEP;
        if (state.screen === SCREEN_CAUGHT || state.screen === SCREEN_ESCAPED) {
          endRun();
          break;
        }
      }
    } else if (state.screen === SCREEN_TITLE) {
      while (accumulator >= STEP) {
        updateGame(game, STEP, { left: false, right: false, jump: false, slide: false }, true);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    drawGame(ctx, game);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN_PLAY) {
      state.screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Lari Kalkun. Tekan Spasi atau klik untuk lari.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
