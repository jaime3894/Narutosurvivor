import type { Position } from "../core/entity";
import type { Attack } from "../game/types";
import { animationProgress } from "../game/techniques";
import { firstContact } from "./combat-pose";
import { clamp01, contactReach, ease } from "./motion";

export function hitPulse(a: Attack): number {
  const events = a.strikes.length ? a.strikes : [{ at: firstContact(a) }];
  return events.reduce(
    (pulse, event) =>
      event.at > a.age
        ? pulse
        : Math.max(pulse, 1 - ease((a.age - event.at) / 0.11)),
    0,
  );
}
export function mechanicalReach(a: Attack): number {
  const end = a.windup + a.active;
  return contactReach(a) * (1 - ease((a.age - end + 0.055) / 0.055));
}
function petals(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time: number,
): void {
  ctx.fillStyle = "#efb7d4";
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + time;
    ctx.save();
    ctx.translate(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
/** Las manos de Robin brotan junto a la víctima y cierran los dedos al impactar. */
export function drawClutch(
  ctx: CanvasRenderingContext2D,
  a: Attack,
  target: Position,
  reduced: boolean,
): void {
  const growth =
    a.age < firstContact(a)
      ? ease(
          (a.age - a.windup * 0.55) /
            Math.max(0.001, firstContact(a) - a.windup * 0.55),
        )
      : 1;
  const alpha =
    a.age < a.windup + a.active
      ? 1
      : 1 - ease((a.age - a.windup - a.active) / a.recovery);
  const giant = a.form === 1 ? 1.6 : a.form === 2 ? 1.3 : 1;
  for (const limb of Array.from(
    { length: a.form === 2 ? 6 : 2 },
    (_, i) => i,
  )) {
    const side = limb % 2 === 0 ? -1 : 1;
    const level = Math.floor(limb / 2);
    const x = target.x + side * (24 + level * 9),
      y = target.y + 24 - level * 15;
    ctx.save();
    ctx.globalAlpha *= alpha;
    petals(ctx, x, y, reduced ? 4 : 4 + a.age * 15, a.age);
    ctx.translate(x, y);
    ctx.scale(side * growth * giant, growth * giant);
    if (a.form === 2) ctx.rotate((level - 1) * 0.35 * growth);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(5, -28);
    ctx.lineTo(-15, -40);
    ctx.strokeStyle = a.form === 2 ? "#453449" : "#6e4945";
    ctx.lineWidth = 11;
    ctx.stroke();
    ctx.strokeStyle = a.form === 2 ? "#94617c" : "#e7af8d";
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = a.form === 2 ? "#c294ae" : "#ffe0b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-1, -2);
    ctx.lineTo(3, -26);
    ctx.lineTo(-16, -38);
    ctx.stroke();
    const curl = hitPulse(a) * 4;
    ctx.fillStyle = a.form === 2 ? "#94617c" : "#edbd99";
    ctx.beginPath();
    ctx.ellipse(-18, -41, 6, 7, -0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 3;
    for (let finger = 0; finger < 4; finger++) {
      ctx.beginPath();
      ctx.moveTo(-20 + finger * 2, -44);
      ctx.quadraticCurveTo(
        -27 + finger * 2,
        -49,
        -25 + finger * 2 + curl,
        -39 + finger,
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-14, -42);
    ctx.quadraticCurveTo(-7, -40, -12, -35);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawWeather(
  ctx: CanvasRenderingContext2D,
  a: Attack,
  target: Position,
  cyclone: boolean,
): void {
  const progress = animationProgress(a),
    contact = firstContact(a);
  const build = ease(a.age / contact),
    fade =
      progress.phase === "recovery"
        ? 1 - ease((a.age - a.windup - a.active) / a.recovery)
        : 1;
  ctx.globalAlpha *= fade;
  if (cyclone) {
    const growth = ease(
      (a.age - a.windup * 0.5) / Math.max(0.001, contact - a.windup * 0.5),
    );
    ctx.strokeStyle = "#c9e5df";
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(
        target.x,
        target.y + 20 - i * 13 * growth,
        (11 + i * 8) * growth,
        5 + i,
        0,
        a.age * 10 + i,
        a.age * 10 + i + 4.9,
      );
      ctx.stroke();
    }
    return;
  }
  ctx.fillStyle = a.form === 2 ? "#65527d" : "#818da3";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(
      target.x + i * 15 * build,
      target.y - 50 - Math.abs(i) * 3,
      20 * build,
      10 * build,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  if (a.form === 2 && build > 0.7) {
    ctx.fillStyle = "#ece4f5";
    ctx.fillRect(target.x - 7, target.y - 52, 3, 3);
    ctx.fillRect(target.x + 4, target.y - 52, 3, 3);
    ctx.beginPath();
    ctx.arc(target.x, target.y - 47, 5, 0, Math.PI);
    ctx.strokeStyle = "#ece4f5";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (a.age >= contact && a.age < a.windup + a.active) {
    ctx.strokeStyle = "#e8b94e";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(target.x - 6, target.y - 49);
    ctx.lineTo(target.x + 7, target.y - 30);
    ctx.lineTo(target.x - 5, target.y - 27);
    ctx.lineTo(target.x + 2, target.y + 13);
    ctx.stroke();
    ctx.strokeStyle = "#fff4ce";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

export function drawVines(
  ctx: CanvasRenderingContext2D,
  a: Attack,
  target: Position,
): void {
  const growth =
    a.age < firstContact(a)
      ? ease(
          (a.age - a.windup * 0.6) /
            Math.max(0.001, firstContact(a) - a.windup * 0.6),
        )
      : 1;
  ctx.globalAlpha *=
    a.age < a.windup + a.active
      ? 1
      : 1 - ease((a.age - a.windup - a.active) / a.recovery);
  for (let i = -1; i <= 1; i++) {
    const x = target.x + i * (a.form > 0 ? 24 : 18);
    ctx.strokeStyle = "#294f3b";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, target.y + 20);
    if (a.form === 1) {
      ctx.lineTo(x + i * 6, target.y + 20 - growth * (65 - Math.abs(i) * 9));
    } else
      ctx.bezierCurveTo(
        x + i * 27,
        target.y + 15 - growth * 55,
        x - i * 13,
        target.y + 20 - growth * 65,
        x + i * 7,
        target.y + 20 - growth * 40,
      );
    ctx.stroke();
    ctx.strokeStyle = "#89b65f";
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let leaf = 0; leaf < 3; leaf++) {
      ctx.fillStyle = leaf % 2 ? "#a5cb6d" : "#4d874e";
      ctx.beginPath();
      ctx.ellipse(
        x + (leaf % 2 ? 7 : -5),
        target.y + 15 - leaf * 13 * growth,
        9 * growth,
        4 * growth,
        leaf % 2 ? -0.5 : 0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
}

export function drawCut(
  ctx: CanvasRenderingContext2D,
  a: Attack,
  origin: Position,
  color: string,
  reduced: boolean,
): void {
  if (a.age < firstContact(a)) return;
  const wave = a.weapon === "phoenix",
    end = a.windup + a.active;
  const time = clamp01(
    (a.age - firstContact(a)) / Math.max(0.001, end - firstContact(a)),
  );
  const angle = Math.atan2(a.direction.y, a.direction.x);
  const travel = wave ? 35 + (a.distance - 35) * ease(time) : 36 + 12 * time;
  const x = origin.x + a.direction.x * travel,
    y = origin.y + a.direction.y * travel;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha *= 1 - ease(time);
  ctx.strokeStyle =
    a.caster === "brook" && a.form > 0
      ? "#b5ebff"
      : a.form === 2 && a.caster === "zoro"
        ? "#ceadf3"
        : color;
  ctx.lineWidth = a.evolved ? 4 : 2.5;
  const count =
    a.caster === "zoro" ? (a.form === 2 ? 9 : 3) : a.form === 2 ? 3 : 1;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 4, -22 + i * 4);
    ctx.quadraticCurveTo(13 + i * 4, 0, -9 + i * 4, 23 - i * 4);
    ctx.stroke();
  }
  if (a.caster === "brook" && a.form > 0 && !reduced) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-5, i * 12);
      ctx.lineTo(9, i * 12);
      ctx.moveTo(2, i * 12 - 7);
      ctx.lineTo(2, i * 12 + 7);
      ctx.stroke();
    }
  }
  ctx.restore();
}
