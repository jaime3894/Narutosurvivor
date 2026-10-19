import type { Attack } from "../game/types";
import type { Position } from "../core/entity";
import { firstContact } from "./combat-pose";
import { hitPulse } from "./technique-effects";
import { ease } from "./motion";
/** Efectos ligados a la misma ventana de contacto que causa daño. Nunca crean extremidades duplicadas. */
export function drawFormEffects(
  ctx: CanvasRenderingContext2D,
  a: Attack,
  origin: Position,
  target: Position,
  reduced: boolean,
): void {
  if (a.form === 0) return;
  const contact = firstContact(a),
    end = a.windup + a.active;
  const prepare = ease(a.age / contact),
    life = a.age < end ? 1 : 1 - ease((a.age - end) / a.recovery);
  const active = a.age >= contact && a.age < end;
  const phase = ease((a.age - contact) / Math.max(0.001, end - contact));
  const pulse = hitPulse(a),
    angle = Math.atan2(a.direction.y, a.direction.x);
  ctx.save();
  ctx.globalAlpha *= life;
  const ring = (p: Position, r: number, color: string, scaleY = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = a.form === 2 ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(
      p.x,
      p.y,
      Math.max(1, r),
      Math.max(1, r * scaleY),
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  };
  switch (a.caster) {
    case "luffy":
      if (a.form === 1) {
        ctx.strokeStyle = "#e6f4f0";
        ctx.lineWidth = 2;
        ctx.globalAlpha *= 0.45;
        for (let i = 0; i < 3; i++) {
          const t = (a.age * 1.5 + i / 3) % 1;
          ctx.beginPath();
          ctx.moveTo(origin.x - 15 + i * 13, origin.y + 20 - t * 15);
          ctx.bezierCurveTo(
            origin.x - 25 + i * 13,
            origin.y - t * 30,
            origin.x + 5 + i * 13,
            origin.y - 10 - t * 30,
            origin.x - 15 + i * 13,
            origin.y - 20 - t * 30,
          );
          ctx.stroke();
        }
        if (active && !reduced) {
          ctx.globalAlpha = 0.6;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(
              origin.x - a.direction.y * side * 14,
              origin.y + a.direction.x * side * 14,
            );
            ctx.lineTo(
              target.x - a.direction.y * side * 10,
              target.y + a.direction.x * side * 10,
            );
            ctx.stroke();
          }
        }
      } else {
        if (a.age < contact) {
          ctx.globalAlpha *= 0.55 * prepare;
          ring(origin, 22 + 4 * Math.sin(a.age * 30), "#d9a0d8", 0.65);
        }
        if (active) {
          ctx.globalAlpha *= 0.65 * (1 - phase);
          ring(target, 12 + phase * 50, "#eac5dc", 0.65);
          ring(target, 6 + phase * 32, "#f4d58c", 0.65);
        }
      }
      break;
    case "zoro":
      if (active) {
        ctx.save();
        ctx.translate(origin.x, origin.y);
        ctx.rotate(angle);
        ctx.strokeStyle = a.form === 2 ? "#cda4f4" : "#d8edb4";
        ctx.lineWidth = 2;
        ctx.globalAlpha *= 1 - phase;
        if (a.form === 1) {
          ctx.rotate(phase * Math.PI * 2);
          for (let i = 0; i < 3; i++) {
            ctx.rotate((Math.PI * 2) / 3);
            ctx.beginPath();
            ctx.arc(0, 0, 28 + phase * 35, -0.7, 0.7);
            ctx.stroke();
          }
        } else
          for (let i = 0; i < 9; i++) {
            const y = (i - 4) * 7;
            ctx.beginPath();
            ctx.moveTo(12, y - 12);
            ctx.lineTo(Math.min(a.distance, 90), -y + 12);
            ctx.stroke();
          }
        ctx.restore();
      }
      break;
    case "sanji":
      if (active) {
        ctx.strokeStyle = a.form === 1 ? "#ff9c42" : "#77dcff";
        ctx.lineWidth = a.form === 2 ? 5 : 3;
        ctx.globalAlpha *= pulse;
        for (let i = 0; i < (a.form === 2 ? 5 : 3); i++) {
          const theta = angle + (i - 2) * 0.16;
          ctx.beginPath();
          ctx.moveTo(
            target.x - Math.cos(theta) * 18,
            target.y - Math.sin(theta) * 18,
          );
          ctx.quadraticCurveTo(
            target.x - Math.cos(theta) * 4,
            target.y - 18 - i * 4,
            target.x + Math.cos(theta) * 12,
            target.y - 24 - i * 4,
          );
          ctx.stroke();
        }
        if (a.form === 2) ring(target, 10 + (1 - pulse) * 35, "#9ceaff", 0.6);
      }
      break;
    case "nami":
      if (active) {
        ctx.strokeStyle = a.form === 2 ? "#c8b2ff" : "#fff0ae";
        ctx.lineWidth = 2;
        ctx.globalAlpha *= 0.5 + pulse * 0.5;
        for (let i = 0; i < (a.form === 2 ? 5 : 3); i++) {
          const side = (i - (a.form === 2 ? 2 : 1)) * a.width * 0.45;
          ctx.beginPath();
          ctx.moveTo(target.x, target.y - 45);
          ctx.lineTo(target.x + side * 0.6, target.y - 24);
          ctx.lineTo(target.x + side * 0.4 - 4, target.y - 16);
          ctx.lineTo(target.x + side, target.y + 10);
          ctx.stroke();
        }
      }
      break;
    case "usopp":
      if (a.weapon === "popgreen" && a.form === 2 && active) {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.strokeStyle = "#b7dc8a";
        ctx.lineWidth = 4;
        ctx.globalAlpha *= 1 - phase;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 35, 18);
          ctx.lineTo(side * 25, -8);
          ctx.lineTo(side * 12, -26);
          ctx.lineTo(0, -14);
          ctx.lineTo(side * 6, 4);
          ctx.stroke();
        }
        ring({ x: 0, y: 0 }, 12 + phase * 35, "#d8e8bd", 0.65);
        ctx.restore();
      }
      break;
    case "chopper":
      if (active) {
        ctx.globalAlpha *= pulse;
        if (a.form === 1) {
          for (const side of [-1, 1]) {
            ctx.strokeStyle = "#f4c8c3";
            ctx.lineWidth = 4;
            ctx.strokeRect(target.x + side * 8 - 3, target.y - 5, 6, 12);
          }
        } else {
          ring(target, 10 + phase * a.width, "#e7bf91", 0.55);
          for (let i = 0; i < 5; i++) {
            const t = angle + (i - 2) * 0.3;
            ctx.strokeStyle = "#ebd5b1";
            ctx.beginPath();
            ctx.moveTo(target.x + Math.cos(t) * 15, target.y + Math.sin(t) * 8);
            ctx.lineTo(
              target.x + Math.cos(t) * 45,
              target.y + Math.sin(t) * 22,
            );
            ctx.stroke();
          }
        }
      }
      break;
    case "robin":
      if (a.form === 2 && active) {
        ctx.globalAlpha *= pulse * 0.5;
        ring(target, 18 + phase * a.width, "#cc8fae", 0.7);
      }
      break;
    case "franky":
      if (a.form === 2) {
        const muzzle = {
          x: origin.x + a.direction.x * 27,
          y: origin.y + a.direction.y * 27,
        };
        if (!active) {
          ctx.globalAlpha *= prepare * 0.7;
          ring(muzzle, 4 + prepare * 10, "#e5f9ff");
        } else {
          ctx.strokeStyle = "#a9e8f7";
          ctx.lineWidth = a.width * 0.8;
          ctx.globalAlpha *= 0.4 + 0.3 * pulse;
          ctx.beginPath();
          ctx.moveTo(muzzle.x, muzzle.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.strokeStyle = "#fff6dc";
          ctx.lineWidth = a.width * 0.25;
          ctx.stroke();
          ring(target, 10 + phase * 45, "#e3f1dd", 0.7);
        }
      } else if (active) {
        ctx.globalAlpha *= pulse;
        ring(target, 10 + phase * 24, "#f1d3a6", 0.65);
      }
      break;
    case "brook":
      if (active) {
        ctx.strokeStyle = "#b2eaf5";
        ctx.lineWidth = 2;
        ctx.globalAlpha *= 1 - phase;
        for (let i = 0; i < (a.form === 2 ? 7 : 3); i++) {
          const t = (i * Math.PI * 2) / (a.form === 2 ? 7 : 3);
          const r = 8 + phase * a.width;
          const x = target.x + Math.cos(t) * r,
            y = target.y + Math.sin(t) * r;
          ctx.beginPath();
          ctx.moveTo(x - 4, y + 8);
          ctx.lineTo(x, y - 10);
          ctx.lineTo(x + 4, y + 8);
          ctx.stroke();
        }
      }
      break;
    case "jinbe":
      if (active) {
        ctx.globalAlpha *= 1 - phase;
        if (a.form === 1) {
          for (let i = 0; i < 3; i++)
            ring(
              origin,
              Math.max(1, phase * a.range - i * 14),
              "#c2e9e2",
              0.65,
            );
        } else {
          ctx.save();
          ctx.translate(origin.x, origin.y);
          ctx.rotate(angle);
          ctx.strokeStyle = "#a9e4e5";
          ctx.lineWidth = 3;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            for (let i = 0; i <= 20; i++) {
              const x = 20 + ((a.distance - 20) * i) / 20,
                y =
                  Math.sin((i / 20) * Math.PI * 4 - phase * 6) *
                  a.width *
                  0.35 *
                  side;
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      break;
  }
  ctx.restore();
}
