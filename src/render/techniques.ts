import { casterPosition } from "../game/crew";
import type { Position } from "../core/entity";
import { affinityColors, weaponById } from "../data/content";
import type { Run } from "../game/types";
import { animationProgress, attackEndpoint } from "../game/techniques";

function limb(
  ctx: CanvasRenderingContext2D,
  start: Position,
  end: Position,
  twist = false,
  mechanical = false,
  ending: "fist" | "foot" | "hoof" = "fist",
  haki = false,
): void {
  ctx.lineCap = "round";
  ctx.strokeStyle = "#473e37";
  ctx.lineWidth = mechanical ? 11 : 9;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.strokeStyle = haki ? "#342c40" : mechanical ? "#9ab3b7" : "#e7af83";
  ctx.lineWidth = mechanical ? 7 : 6;
  ctx.stroke();
  ctx.strokeStyle = haki ? "#a74850" : mechanical ? "#e7eeee" : "#ffd4a2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(start.x - 1, start.y - 2);
  ctx.lineTo(end.x - 1, end.y - 2);
  ctx.stroke();
  if (twist || mechanical) {
    const dx = end.x - start.x,
      dy = end.y - start.y,
      length = Math.hypot(dx, dy) || 1;
    ctx.strokeStyle = mechanical ? "#526c77" : "#a96950";
    ctx.lineWidth = 2;
    for (let t = 0.15; t < 0.9; t += 0.12) {
      const x = start.x + dx * t,
        y = start.y + dy * t;
      ctx.beginPath();
      ctx.moveTo(x + (dy / length) * 3, y - (dx / length) * 3);
      ctx.lineTo(x - (dy / length) * 3, y + (dx / length) * 3);
      ctx.stroke();
    }
  }
  if (ending !== "fist") {
    ctx.fillStyle = ending === "hoof" ? "#6b493a" : "#3a3b37";
    ctx.fillRect(end.x - 7, end.y - 4, 15, 9);
    ctx.fillStyle = ending === "hoof" ? "#b58862" : "#d3a46c";
    ctx.fillRect(end.x - 6, end.y - 3, 12, 5);
    ctx.fillStyle = "#453d33";
    ctx.fillRect(end.x - 1, end.y - 3, 2, 6);
    return;
  }
  ctx.fillStyle = "#473e37";
  ctx.fillRect(end.x - 6, end.y - 6, 13, 12);
  ctx.fillStyle = haki ? "#292a39" : mechanical ? "#a9c4c8" : "#efbd91";
  ctx.fillRect(end.x - 4, end.y - 5, 9, 8);
  ctx.fillStyle = haki ? "#b45259" : mechanical ? "#e1eddd" : "#ffe0ae";
  ctx.fillRect(end.x - 3, end.y - 5, 7, 2);
  ctx.fillStyle = "#a77758";
  ctx.fillRect(end.x - 3, end.y + 1, 1, 2);
  ctx.fillRect(end.x, end.y + 1, 1, 2);
}
export function drawTechniques(
  ctx: CanvasRenderingContext2D,
  run: Run,
  reducedMotion: boolean,
): void {
  for (const attack of run.attacks) {
    const definition = weaponById(attack.weapon);
    const progress = animationProgress(attack);
    const caster = casterPosition(run, attack.caster);
    const origin = { x: caster.x, y: caster.y - 31 };
    const point = attackEndpoint(run, attack);
    const target = { x: attack.target.x, y: attack.target.y - 31 };
    const angle = Math.atan2(attack.direction.y, attack.direction.x);
    const phase = (attack.age - attack.windup) / attack.active;
    const active = progress.phase === "active";
    const extension = progress.extension;
    const color = affinityColors[definition.affinity];
    ctx.save();
    ctx.lineJoin = "round";
    if (progress.phase === "windup") {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y + 14, 18, angle - 0.5, angle + 0.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    switch (definition.animation) {
      case "stretch":
      case "chain":
      case "double":
      case "barrage": {
        const count =
          definition.animation === "double"
            ? 2
            : definition.animation === "barrage"
              ? 3
              : 1;
        for (let i = 0; i < count; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const shoulder = { x: origin.x + side * 8, y: origin.y };
          const oscillation =
            definition.animation === "barrage" && active
              ? 0.35 +
                0.65 *
                  Math.abs(
                    Math.sin(phase * attack.strikes.length * Math.PI + i * 1.9),
                  )
              : 1;
          const spread = count > 1 ? (i - (count - 1) / 2) * 17 : 0;
          const end = {
            x:
              shoulder.x +
              (point.x - origin.x) * extension * oscillation -
              attack.direction.y * spread,
            y:
              shoulder.y +
              (point.y - 31 - origin.y) * extension * oscillation +
              attack.direction.x * spread,
          };
          limb(
            ctx,
            shoulder,
            end,
            attack.evolved && attack.weapon === "pistol",
            definition.animation === "chain",
            "fist",
            attack.caster === "luffy" && attack.form === 2,
          );
        }
        break;
      }
      case "sweep":
      case "kick":
      case "stomp":
      case "hoof": {
        const sweep = definition.animation === "sweep";
        const rotation =
          angle +
          (sweep ? Math.max(0, phase) * Math.PI * 2 : -0.25 * extension);
        const length =
          (sweep ? attack.range : Math.min(attack.range, 105)) * extension;
        const hip = {
          x: origin.x,
          y: origin.y + (definition.animation === "hoof" ? 0 : 10),
        };
        limb(
          ctx,
          hip,
          {
            x: hip.x + Math.cos(rotation) * length,
            y: hip.y + Math.sin(rotation) * length,
          },
          false,
          false,
          definition.animation === "hoof" ? "hoof" : "foot",
        );
        if (active) {
          ctx.strokeStyle =
            attack.caster === "sanji" && attack.form > 0
              ? attack.form === 2
                ? "#71ddf6"
                : "#f2a34f"
              : attack.evolved
                ? "#ffe4a0"
                : "#ebd8ae";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            hip.x,
            hip.y,
            Math.max(1, Math.abs(length)),
            rotation - 0.5,
            rotation + 0.1,
          );
          ctx.stroke();
        }
        break;
      }
      case "inflate": {
        if (active) {
          ctx.strokeStyle = "#e5e2b5";
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            origin.x,
            origin.y + 12,
            attack.range * Math.max(0.1, Math.min(1, phase * 4)),
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
        break;
      }
      case "slash":
      case "iai":
      case "cutwave": {
        const rotation = angle - 0.8 + extension * 1.6;
        const length = 52;
        ctx.strokeStyle = "#263e43";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(
          origin.x + Math.cos(rotation) * length,
          origin.y + Math.sin(rotation) * length,
        );
        ctx.stroke();
        ctx.strokeStyle = "#e4eee2";
        ctx.lineWidth = 3;
        ctx.stroke();
        if (active) {
          ctx.strokeStyle =
            attack.caster === "brook" && attack.form > 0 ? "#a6e0f2" : color;
          ctx.lineWidth = attack.evolved ? 7 : 4;
          ctx.beginPath();
          ctx.arc(
            origin.x,
            origin.y,
            definition.animation === "cutwave"
              ? attack.distance * Math.min(1, phase * 5)
              : attack.range * 0.8,
            angle - 0.65,
            angle + 0.65,
          );
          ctx.stroke();
        }
        break;
      }
      case "lightning":
      case "cyclone": {
        const hand = { x: origin.x + 10, y: origin.y + 1 };
        ctx.strokeStyle = "#debb73";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(hand.x - 8, hand.y + 10);
        ctx.lineTo(hand.x + 22, hand.y - 25);
        ctx.stroke();
        if (definition.animation === "lightning") {
          ctx.fillStyle = active ? "#d8c9eb" : "#a0a7c0";
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.ellipse(
              target.x + i * 15,
              target.y - 50 - Math.abs(i) * 2,
              22,
              12,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
          if (active) {
            ctx.strokeStyle = "#fff2b2";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(target.x - 6, target.y - 49);
            ctx.lineTo(target.x + 7, target.y - 32);
            ctx.lineTo(target.x - 5, target.y - 28);
            ctx.lineTo(target.x + 2, target.y + 8);
            ctx.stroke();
          }
        } else if (active) {
          ctx.strokeStyle = "#d4e9df";
          ctx.lineWidth = 3;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.ellipse(
              target.x,
              target.y - i * 13,
              attack.width * (1 - i * 0.16),
              10,
              0,
              phase * 8 + i,
              phase * 8 + i + 4.8,
            );
            ctx.stroke();
          }
        }
        break;
      }
      case "pellet":
      case "vine": {
        ctx.strokeStyle = "#6b4935";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(origin.x + 8, origin.y + 9);
        ctx.lineTo(origin.x + 12, origin.y - 9);
        ctx.lineTo(origin.x + 5, origin.y - 17);
        ctx.moveTo(origin.x + 12, origin.y - 9);
        ctx.lineTo(origin.x + 20, origin.y - 16);
        ctx.stroke();
        ctx.strokeStyle = "#edc17f";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(origin.x + 5, origin.y - 17);
        ctx.lineTo(
          origin.x - 5 - (progress.phase === "windup" ? 6 : 0),
          origin.y - 7,
        );
        ctx.lineTo(origin.x + 20, origin.y - 16);
        ctx.stroke();
        if (definition.animation === "vine" && active) {
          ctx.strokeStyle = "#315b42";
          ctx.lineWidth = 7;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(target.x + i * 22, target.y + 12);
            ctx.quadraticCurveTo(
              target.x + i * 40,
              target.y - 50,
              target.x + i * 16,
              target.y - 18,
            );
            ctx.stroke();
            ctx.fillStyle = "#96bc64";
            ctx.beginPath();
            ctx.ellipse(
              target.x + i * 16,
              target.y - 18,
              13,
              5,
              i,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }
        break;
      }
      case "clutch": {
        if (active || progress.phase === "recovery") {
          for (const side of [-1, 1]) {
            const start = { x: target.x + side * 29, y: target.y + 12 };
            const end = { x: target.x + side * 5, y: target.y - 13 };
            ctx.strokeStyle = attack.form === 2 ? "#795568" : "#dba77f";
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(target.x + side * 29, target.y - 17);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            ctx.fillStyle = "#f2c79b";
            ctx.fillRect(end.x - 5, end.y - 4, 10, 8);
          }
        }
        break;
      }
      case "palm": {
        limb(
          ctx,
          { x: origin.x + 8, y: origin.y },
          {
            x: origin.x + attack.direction.x * 34 * extension,
            y: origin.y + attack.direction.y * 34 * extension,
          },
        );
        if (active) {
          ctx.strokeStyle = "#b1e1e1";
          ctx.lineWidth = 4;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
              origin.x,
              origin.y,
              Math.max(
                1,
                attack.range * Math.min(1, Math.max(0.05, phase * 4)) - i * 12,
              ),
              angle - 0.8,
              angle + 0.8,
            );
            ctx.stroke();
          }
        }
        break;
      }
    }
    if (attack.evolved && active && !reducedMotion) {
      ctx.strokeStyle = "#f8d997";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(
        origin.x,
        origin.y + 14,
        26,
        run.elapsed * 3,
        run.elapsed * 3 + 4,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}
