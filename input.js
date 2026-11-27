// Lari Kalkun: keyboard and mouse input. Keys are queued so a quick tap is
// never lost between frames; held keys steer the turkey every frame.

export const KEY_LEFT = 'ArrowLeft';
export const KEY_RIGHT = 'ArrowRight';
export const KEY_JUMP = 'Space';
export const KEY_SLIDE = 'ArrowDown';
export const KEY_CONFIRM = 'Space';
export const KEY_PAUSE = 'KeyP';
export const KEY_RESTART = 'KeyR';
export const KEY_MUTE = 'KeyM';

const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
  'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyP', 'KeyR', 'KeyM',
]);

export function createInput(canvas) {
  const held = new Set();
  const queue = [];
  const clicks = [];

  function onKeyDown(event) {
    if (!GAME_KEYS.has(event.code)) return;
    event.preventDefault();
    if (!event.repeat) queue.push(event.code);
    held.add(event.code);
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clicks.push({
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    });
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    takeKeys() {
      const out = queue.splice(0, queue.length);
      return out;
    },
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    controls() {
      return {
        left: held.has('ArrowLeft') || held.has('KeyA'),
        right: held.has('ArrowRight') || held.has('KeyD'),
        jump: held.has('ArrowUp') || held.has('KeyW') || held.has('Space'),
        slide: held.has('ArrowDown') || held.has('KeyS'),
      };
    },
  };
}

/** True when the point (in canvas pixels) falls inside the rectangle. */
export function hitRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
