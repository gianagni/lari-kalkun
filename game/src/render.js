// Lari Kalkun: every pixel the game paints. The farm at dusk is drawn in
// code (canvas paths only): sky, sun, barn and trees in parallax, three
// running lanes, the turkey, the farmer chasing from behind, the oven, the
// knife, fences, nets, corn and feathers, and the HUD and screens.

import { COLORS, ESCAPE_DISTANCE, FIELD, LANES, PX_PER_M, RUN, TURKEY_X } from './config.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, hazardScreenX, turkeyGroundY, turkeyScale } from './state.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, state) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, COLORS.skyTop);
  grad.addColorStop(0.45, COLORS.skyMid);
  grad.addColorStop(0.75, COLORS.skyLow);
  grad.addColorStop(1, '#e8a35a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const sunX = 1020;
  const sunY = 190;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 150);
  glow.addColorStop(0, 'rgba(255, 217, 138, 0.9)');
  glow.addColorStop(1, 'rgba(255, 217, 138, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 150, sunY - 150, 300, 300);
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 220, 180, 0.35)';
  for (let i = 0; i < 3; i += 1) {
    const cx = 180 + i * 420 - ((state.distance * 4 + i * 130) % 420);
    const cy = 110 + i * 36;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 60, cy + 8, 60, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(ctx, state) {
  ctx.fillStyle = COLORS.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  const off1 = (state.distance * 8) % 640;
  for (let x = -off1; x <= FIELD.width + 640; x += 640) {
    ctx.quadraticCurveTo(x + 160, 430, x + 320, 520);
    ctx.quadraticCurveTo(x + 480, 610, x + 640, 520);
  }
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.lineTo(0, FIELD.height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 560);
  const off2 = (state.distance * 16) % 480;
  for (let x = -off2; x <= FIELD.width + 480; x += 480) {
    ctx.quadraticCurveTo(x + 120, 500, x + 240, 560);
    ctx.quadraticCurveTo(x + 360, 620, x + 480, 560);
  }
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.lineTo(0, FIELD.height);
  ctx.closePath();
  ctx.fill();
}

function drawBarn(ctx, state) {
  const bx = 980 - ((state.distance * 16) % 1600);
  if (bx < -220 || bx > FIELD.width + 60) return;
  const by = 470;
  ctx.fillStyle = COLORS.barn;
  ctx.fillRect(bx, by, 150, 96);
  ctx.fillStyle = COLORS.barnRoof;
  ctx.beginPath();
  ctx.moveTo(bx - 10, by);
  ctx.lineTo(bx + 75, by - 52);
  ctx.lineTo(bx + 160, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8d9a0';
  ctx.lineWidth = 4;
  ctx.strokeRect(bx + 55, by + 34, 40, 62);
  ctx.beginPath();
  ctx.moveTo(bx + 55, by + 34);
  ctx.lineTo(bx + 95, by + 96);
  ctx.moveTo(bx + 95, by + 34);
  ctx.lineTo(bx + 55, by + 96);
  ctx.stroke();
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(bx + 18, by + 18, 24, 24);
  ctx.fillRect(bx + 108, by + 18, 24, 24);
}

function drawTrees(ctx, state) {
  for (let i = 0; i < 5; i += 1) {
    const spacing = 340;
    const tx = ((i * spacing - state.distance * 30) % (spacing * 5) + spacing * 5) % (spacing * 5) - 80;
    const ty = 520 + (i % 2) * 18;
    const s = 0.8 + (i % 3) * 0.2;
    ctx.fillStyle = '#3a4a26';
    ctx.fillRect(tx - 5 * s, ty, 10 * s, 44 * s);
    ctx.beginPath();
    ctx.arc(tx, ty - 18 * s, 34 * s, 0, Math.PI * 2);
    ctx.arc(tx - 24 * s, ty + 2 * s, 24 * s, 0, Math.PI * 2);
    ctx.arc(tx + 24 * s, ty + 2 * s, 24 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx, state) {
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, 540, FIELD.width, 260);
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 540, FIELD.width, 14);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 2;
  for (const lane of LANES) {
    ctx.beginPath();
    ctx.moveTo(0, lane.ground + 4);
    ctx.lineTo(FIELD.width, lane.ground + 4);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 24; i += 1) {
    const gx = ((i * 173 - state.distance * PX_PER_M) % 1400 + 1400) % 1400 - 60;
    const gy = 560 + ((i * 37) % 220);
    ctx.fillRect(gx, gy, 26, 4);
  }
}

function drawFence(ctx, x, lane, scale) {
  const ground = lane.ground;
  ctx.strokeStyle = COLORS.fenceWood;
  ctx.lineWidth = 6 * scale;
  ctx.beginPath();
  ctx.moveTo(x - 30 * scale, ground - 46 * scale);
  ctx.lineTo(x - 30 * scale, ground);
  ctx.moveTo(x + 30 * scale, ground - 46 * scale);
  ctx.lineTo(x + 30 * scale, ground);
  ctx.stroke();
  ctx.lineWidth = 5 * scale;
  ctx.beginPath();
  ctx.moveTo(x - 38 * scale, ground - 38 * scale);
  ctx.lineTo(x + 38 * scale, ground - 38 * scale);
  ctx.moveTo(x - 38 * scale, ground - 20 * scale);
  ctx.lineTo(x + 38 * scale, ground - 20 * scale);
  ctx.stroke();
}

function drawHay(ctx, x, lane, scale) {
  const ground = lane.ground;
  ctx.fillStyle = '#d9a83e';
  ctx.beginPath();
  ctx.arc(x, ground - 26 * scale, 34 * scale, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a87c22';
  ctx.lineWidth = 2 * scale;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.arc(x, ground - 26 * scale, (14 + Math.abs(i) * 7) * scale, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
}

function drawOven(ctx, x, lane, scale, time) {
  const ground = lane.ground;
  const flicker = 0.75 + Math.sin(time * 9 + x) * 0.25;
  const glow = ctx.createRadialGradient(x, ground - 40 * scale, 8, x, ground - 40 * scale, 90 * scale);
  glow.addColorStop(0, `rgba(255, 122, 46, ${0.55 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 122, 46, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 90 * scale, ground - 130 * scale, 180 * scale, 130 * scale);
  ctx.fillStyle = '#3a3a42';
  roundRect(ctx, x - 34 * scale, ground - 72 * scale, 68 * scale, 72 * scale, 8 * scale);
  ctx.fill();
  ctx.fillStyle = '#23232a';
  ctx.fillRect(x - 40 * scale, ground - 80 * scale, 80 * scale, 10 * scale);
  ctx.fillStyle = COLORS.ovenGlow;
  roundRect(ctx, x - 24 * scale, ground - 56 * scale, 48 * scale, 34 * scale, 6 * scale);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.moveTo(x - 16 * scale, ground - 24 * scale);
  ctx.quadraticCurveTo(x - 8 * scale, ground - 44 * scale, x, ground - 22 * scale);
  ctx.quadraticCurveTo(x + 8 * scale, ground - 44 * scale, x + 16 * scale, ground - 24 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(13 * scale)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('OVEN', x, ground - 62 * scale);
}

function drawKnife(ctx, x, lane, scale, swing) {
  const ground = lane.ground;
  const angle = Math.sin(swing) * 0.5;
  const pivotY = ground - 190 * scale;
  ctx.save();
  ctx.translate(x, pivotY);
  ctx.rotate(angle);
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(-4 * scale, 0, 8 * scale, 44 * scale);
  ctx.fillStyle = COLORS.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-13 * scale, 44 * scale);
  ctx.lineTo(13 * scale, 44 * scale);
  ctx.lineTo(0, 150 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(-6 * scale, 50 * scale);
  ctx.lineTo(6 * scale, 50 * scale);
  ctx.lineTo(0, 120 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(x - 26 * scale, pivotY - 8 * scale, 52 * scale, 10 * scale);
}

function drawNet(ctx, x, lane, scale) {
  const ground = lane.ground;
  ctx.strokeStyle = '#c9b18a';
  ctx.lineWidth = 3 * scale;
  for (let i = 0; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 34 * scale + i * 17 * scale, ground - 52 * scale);
    ctx.lineTo(x - 34 * scale + i * 17 * scale, ground);
    ctx.stroke();
  }
  for (let j = 0; j <= 3; j += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 34 * scale, ground - 52 * scale + j * 17 * scale);
    ctx.lineTo(x + 34 * scale, ground - 52 * scale + j * 17 * scale);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(x - 40 * scale, ground - 56 * scale, 80 * scale, 6 * scale);
}

function drawCorn(ctx, x, y, scale) {
  ctx.fillStyle = COLORS.cornYellow;
  ctx.beginPath();
  ctx.ellipse(x, y, 12 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c99412';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(x - 7 * scale, y - 8 * scale);
  ctx.lineTo(x + 7 * scale, y - 8 * scale);
  ctx.moveTo(x - 8 * scale, y);
  ctx.lineTo(x + 8 * scale, y);
  ctx.moveTo(x - 7 * scale, y + 8 * scale);
  ctx.lineTo(x + 7 * scale, y + 8 * scale);
  ctx.stroke();
  ctx.fillStyle = '#5d7a35';
  ctx.beginPath();
  ctx.moveTo(x - 4 * scale, y + 16 * scale);
  ctx.lineTo(x + 4 * scale, y + 16 * scale);
  ctx.lineTo(x, y + 26 * scale);
  ctx.closePath();
  ctx.fill();
}

function drawFeather(ctx, x, y, scale, time) {
  const sway = Math.sin(time * 2 + x * 0.05) * 6;
  ctx.save();
  ctx.translate(x + sway, y);
  ctx.rotate(0.4);
  ctx.fillStyle = COLORS.featherWhite;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9 * scale, 20 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8a98a';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(0, -18 * scale);
  ctx.lineTo(0, 18 * scale);
  ctx.stroke();
  ctx.restore();
}

function drawPumpkin(ctx, x, y, scale) {
  ctx.fillStyle = COLORS.pumpkinOrange;
  ctx.beginPath();
  ctx.ellipse(x, y, 20 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b34a0e';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.ellipse(x - 7 * scale, y, 7 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 7 * scale, y, 7 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#3a5a26';
  ctx.fillRect(x - 2 * scale, y - 22 * scale, 5 * scale, 8 * scale);
}

function drawTurkey(ctx, state) {
  const turkey = state.turkey;
  const ground = turkeyGroundY(state);
  const scale = turkeyScale(state);
  const x = TURKEY_X;
  const feet = ground - turkey.y;
  const s = scale;
  const legSwing = Math.sin(turkey.runPhase) * 10 * s;
  const blink = turkey.invuln > 0 && Math.floor(state.time * 12) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  ctx.save();
  ctx.translate(x, feet);
  if (turkey.sliding) {
    ctx.scale(1.25, 0.62);
    ctx.translate(-8 * s, 12 * s);
  }
  ctx.fillStyle = COLORS.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, -34 * s, 30 * s, 26 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a86a35';
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(-28 * s + i * 3 * s, -52 * s - Math.abs(i) * -6 * s, 9 * s, 22 * s, i * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.turkeyWing;
  ctx.beginPath();
  ctx.ellipse(-4 * s, -34 * s, 18 * s, 13 * s, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 3 * s;
  const legLift = turkey.jumping ? 8 * s : 0;
  ctx.beginPath();
  ctx.moveTo(-8 * s, -12 * s);
  ctx.lineTo(-8 * s + legSwing, -legLift);
  ctx.moveTo(8 * s, -12 * s);
  ctx.lineTo(8 * s - legSwing, -legLift);
  ctx.stroke();
  ctx.fillStyle = COLORS.turkeyHead;
  ctx.beginPath();
  ctx.arc(24 * s, -62 * s, 13 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.moveTo(34 * s, -64 * s);
  ctx.lineTo(48 * s, -59 * s);
  ctx.lineTo(34 * s, -55 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(30 * s, -50 * s, 4 * s, 8 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(27 * s, -65 * s, 2.4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFarmer(ctx, state) {
  const gap = state.gap;
  const x = TURKEY_X - 46 - gap * 3.1;
  if (x < -160) return;
  const ground = LANES[1].ground + 6;
  const s = 1.35;
  const step = Math.sin(state.time * 11) * 12;
  ctx.save();
  ctx.translate(x, ground);
  ctx.strokeStyle = COLORS.farmerPants;
  ctx.lineWidth = 9 * s;
  ctx.beginPath();
  ctx.moveTo(-6 * s, -52 * s);
  ctx.lineTo(-6 * s + step, 0);
  ctx.moveTo(8 * s, -52 * s);
  ctx.lineTo(8 * s - step, 0);
  ctx.stroke();
  ctx.fillStyle = COLORS.farmerShirt;
  roundRect(ctx, -22 * s, -108 * s, 46 * s, 60 * s, 8 * s);
  ctx.fill();
  ctx.fillStyle = COLORS.farmerPants;
  ctx.fillRect(-20 * s, -108 * s, 42 * s, 22 * s);
  ctx.strokeStyle = COLORS.farmerSkin;
  ctx.lineWidth = 8 * s;
  ctx.beginPath();
  ctx.moveTo(16 * s, -96 * s);
  ctx.lineTo(44 * s, -78 * s + step * 0.4);
  ctx.moveTo(-14 * s, -96 * s);
  ctx.lineTo(-38 * s, -70 * s - step * 0.4);
  ctx.stroke();
  ctx.fillStyle = COLORS.farmerSkin;
  ctx.beginPath();
  ctx.arc(4 * s, -124 * s, 16 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(9 * s, -128 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(10 * s, -128 * s, 1.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a2e';
  ctx.beginPath();
  ctx.arc(4 * s, -112 * s, 8 * s, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = COLORS.farmerHat;
  ctx.beginPath();
  ctx.ellipse(4 * s, -136 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8 * s, -156 * s, 24 * s, 22 * s);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PETANI!', x, ground - 190);
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(20, 12, 30, 0.72)';
  roundRect(ctx, 16, 14, 420, 96, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SKOR', 34, 38);
  ctx.fillText('JARAK', 180, 38);
  ctx.fillText('KECEPATAN', 300, 38);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(String(Math.floor(state.score)), 34, 74);
  ctx.fillText(`${Math.floor(state.distance)} m`, 180, 74);
  ctx.fillText(`${Math.round(state.speed * 3.6)} km/j`, 300, 74);
  ctx.fillStyle = '#ff5a4a';
  ctx.font = 'bold 22px sans-serif';
  for (let i = 0; i < 3; i += 1) {
    const hx = 470 + i * 34;
    const hy = 52;
    ctx.beginPath();
    ctx.arc(hx - 6, hy - 6, 8, 0, Math.PI * 2);
    ctx.arc(hx + 6, hy - 6, 8, 0, Math.PI * 2);
    ctx.moveTo(hx - 12, hy - 2);
    ctx.quadraticCurveTo(hx, hy + 14, hx + 12, hy - 2);
    ctx.closePath();
    ctx.fillStyle = i < state.lives ? '#ff5a4a' : 'rgba(255, 255, 255, 0.22)';
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('NYAWA', 470, 38);
  ctx.fillStyle = 'rgba(20, 12, 30, 0.72)';
  roundRect(ctx, 16, 122, 300, 54, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('JARAK DARI PETANI', 32, 142);
  const gapRatio = Math.max(0, Math.min(1, state.gap / 120));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  roundRect(ctx, 32, 150, 268, 12, 6);
  ctx.fill();
  ctx.fillStyle = gapRatio > 0.5 ? '#7ac74f' : gapRatio > 0.25 ? '#f2c230' : '#ff5a4a';
  roundRect(ctx, 32, 150, 268 * gapRatio, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(state.gap)} m`, 300, 143);
  ctx.textAlign = 'left';
  const stageNames = ['HALAMAN PETERNAKAN', 'LADANG TERBUKA', 'TEPI HUTAN'];
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(stageNames[state.stage], 980, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Hutan ${Math.max(0, Math.round(ESCAPE_DISTANCE - state.distance))} m lagi`, 980, 62);
  if (state.messageTimer > 0 && state.message) {
    ctx.fillStyle = 'rgba(20, 12, 30, 0.8)';
    const w = ctx.measureText(state.message).width + 36;
    roundRect(ctx, FIELD.width / 2 - w / 2, 190, w, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, FIELD.width / 2, 220);
    ctx.textAlign = 'left';
  }
}

function drawPops(ctx, state) {
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  for (const pop of state.pops) {
    ctx.globalAlpha = Math.max(0, Math.min(1, pop.life));
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20, 10, 30, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 92px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LARI KALKUN', FIELD.width / 2, 240);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('Kalkun kabur dari makan malam Thanksgiving!', FIELD.width / 2, 292);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#ffe9c4';
  ctx.fillText('Lompat pagar dan oven, merunduk di bawah jaring, kumpulkan jagung,', FIELD.width / 2, 336);
  ctx.fillText('dan jangan sampai petani menangkapmu sebelum hutan.', FIELD.width / 2, 366);
  ctx.fillStyle = '#2b1a12';
  roundRect(ctx, FIELD.width / 2 - 260, 420, 520, 66, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('TEKAN SPASI ATAU KLIK UNTUK LARI', FIELD.width / 2, 462);
  ctx.fillStyle = '#fff';
  ctx.font = '19px sans-serif';
  ctx.fillText('A / D atau panah kiri-kanan: pindah jalur    Spasi / W: lompat    S: merunduk', FIELD.width / 2, 530);
  ctx.fillText('P: jeda    R: ulang    M: suara', FIELD.width / 2, 560);
  if (state.best > 0) {
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Skor terbaik: ${Math.floor(state.best)}`, FIELD.width / 2, 610);
  }
  ctx.textAlign = 'left';
}

function drawEnd(ctx, state, escaped) {
  ctx.fillStyle = escaped ? 'rgba(18, 46, 24, 0.55)' : 'rgba(46, 12, 12, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = escaped ? '#b8e986' : '#ff8a7a';
  ctx.font = 'bold 76px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(escaped ? 'LOLOS!' : 'TERTANGKAP!', FIELD.width / 2, 250);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(
    escaped
      ? 'Kalkun sampai di hutan. Tidak jadi makan malam tahun ini.'
      : 'Petani berhasil menangkap kalkun. Thanksgiving tetap jalan.',
    FIELD.width / 2, 306,
  );
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`Skor: ${Math.floor(state.score)}    Jarak: ${Math.floor(state.distance)} m`, FIELD.width / 2, 380);
  if (state.best > 0) {
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText(`Skor terbaik: ${Math.floor(state.best)}`, FIELD.width / 2, 420);
  }
  ctx.fillStyle = '#2b1a12';
  roundRect(ctx, FIELD.width / 2 - 220, 470, 440, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('TEKAN R UNTUK LARI LAGI', FIELD.width / 2, 512);
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 10, 30, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('JEDA', FIELD.width / 2, 380);
  ctx.font = '24px sans-serif';
  ctx.fillText('Tekan P untuk lanjut', FIELD.width / 2, 430);
  ctx.textAlign = 'left';
}

export function drawGame(ctx, game) {
  const state = game.state;
  // A hard hit shakes the whole frame for half a second.
  ctx.save();
  if (state.shake > 0) {
    const mag = state.shake * 14;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawSky(ctx, state);
  drawHills(ctx, state);
  drawBarn(ctx, state);
  drawTrees(ctx, state);
  drawGround(ctx, state);
  const sortedHazards = [...state.hazards].sort((a, b) => a.lane - b.lane);
  for (const hazard of sortedHazards) {
    const x = hazardScreenX(state, hazard);
    if (x < -160 || x > FIELD.width + 160) continue;
    const lane = LANES[hazard.lane];
    const scale = lane.scale;
    if (hazard.kind === 'fence') drawFence(ctx, x, lane, scale);
    else if (hazard.kind === 'hay') drawHay(ctx, x, lane, scale);
    else if (hazard.kind === 'oven') drawOven(ctx, x, lane, scale, state.time);
    else if (hazard.kind === 'knife') drawKnife(ctx, x, lane, scale, hazard.swing);
    else drawNet(ctx, x, lane, scale);
  }
  for (const pickup of state.pickups) {
    if (pickup.taken) continue;
    const x = TURKEY_X + (pickup.dist - state.distance) * PX_PER_M;
    if (x < -60 || x > FIELD.width + 60) continue;
    const lane = LANES[pickup.lane];
    const bob = Math.sin(state.time * 3 + pickup.dist) * 6;
    const y = lane.ground - 52 - bob;
    if (pickup.kind === 'corn') drawCorn(ctx, x, y, lane.scale);
    else if (pickup.kind === 'feather') drawFeather(ctx, x, y, lane.scale, state.time);
    else drawPumpkin(ctx, x, y, lane.scale);
  }
  if (state.screen === SCREEN_TITLE) {
    drawFarmer(ctx, { ...state, gap: 34 });
    drawTurkey(ctx, state);
    drawTitle(ctx, state);
  } else {
    drawFarmer(ctx, state);
    drawTurkey(ctx, state);
    drawPops(ctx, state);
    drawHud(ctx, state);
    if (state.screen === SCREEN_CAUGHT) drawEnd(ctx, state, false);
    else if (state.screen === SCREEN_ESCAPED) drawEnd(ctx, state, true);
    else if (state.screen === SCREEN_PAUSED) drawPaused(ctx);
  }
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 60, 40, ${state.flash * 0.5})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
  ctx.restore();
}
