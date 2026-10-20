import {
  regionalMoves,
  elementColors,
  type RegionalMoveId,
} from "../data/regional-bosses";
import { drawElementProjectile, isRegionalElement } from "./regional-effects";
import { busterRules } from "../data/missions";
import { bossMoves, fanPatterns } from "../data/boss-moves";
import { bosses, riftRules } from "../data/rifts";
import type { Run, Enemy } from "../game/types";
export function drawRifts(
  ctx: CanvasRenderingContext2D,
  run: Run,
  reduced: boolean,
): void {
  ctx.save();
  for (const shell of run.director.buster?.shells ?? []) {
    const progress = 1 - shell.remaining / busterRules.warning;
    ctx.fillStyle = "rgba(241,116,69,.22)";
    ctx.strokeStyle = "#ffdd94";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      shell.position.x,
      shell.position.y,
      busterRules.radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      shell.position.x,
      shell.position.y,
      Math.max(1, busterRules.radius * progress),
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * progress,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shell.position.x - 8, shell.position.y);
    ctx.lineTo(shell.position.x + 8, shell.position.y);
    ctx.moveTo(shell.position.x, shell.position.y - 8);
    ctx.lineTo(shell.position.x, shell.position.y + 8);
    ctx.stroke();
  }
  if (run.rift) {
    const { x, y } = run.rift.position;
    ctx.fillStyle = "#201b36";
    ctx.strokeStyle = "#bd9de9";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y - 16,
      24,
      36,
      reduced ? 0 : Math.sin(run.rift.remaining * 2) * 0.06,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#e4c5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 45);
    ctx.lineTo(x - 7, y - 23);
    ctx.lineTo(x + 7, y - 10);
    ctx.lineTo(x - 3, y + 10);
    ctx.stroke();
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffefd5";
    ctx.fillText(`GRIETA · ${Math.ceil(run.rift.remaining)}s`, x, y + 33);
  }
  if (run.arena) {
    const c = run.arena.center;
    ctx.fillStyle = "rgba(30,18,45,.22)";
    ctx.strokeStyle = "#c6a2e8";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, riftRules.arenaRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  for (const z of run.imuZones) {
    ctx.save();
    ctx.strokeStyle = z.element
      ? elementColors[z.element][0]
      : z.warning > 0
        ? "#eac2ff"
        : "#ffdaf3";
    ctx.fillStyle = z.element
      ? `${elementColors[z.element][1]}${z.warning > 0 ? "33" : "aa"}`
      : z.warning > 0
        ? "rgba(169,93,206,.17)"
        : "rgba(194,99,218,.65)";
    if (z.end) {
      ctx.lineWidth = z.radius * 2;
      ctx.lineCap = "round";
      ctx.globalAlpha = z.warning > 0 ? 0.35 : 0.9;
      ctx.beginPath();
      ctx.moveTo(z.position.x, z.position.y);
      ctx.lineTo(z.end.x, z.end.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(z.position.x, z.position.y, z.radius, 0, Math.PI * 2);
      if (z.innerRadius) {
        ctx.moveTo(z.position.x + z.innerRadius, z.position.y);
        ctx.arc(
          z.position.x,
          z.position.y,
          z.innerRadius,
          0,
          Math.PI * 2,
          true,
        );
      }
      ctx.fill("evenodd");
      ctx.stroke();
      if (!z.innerRadius) {
        ctx.beginPath();
        ctx.moveTo(z.position.x - 10, z.position.y);
        ctx.lineTo(z.position.x + 10, z.position.y);
        ctx.moveTo(z.position.x, z.position.y - 10);
        ctx.lineTo(z.position.x, z.position.y + 10);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  for (const h of run.hazards) {
    ctx.save();
    ctx.translate(h.position.x, h.position.y - (h.kind === "bomb" ? 0 : 34));
    if (isRegionalElement(h.kind)) {
      drawElementProjectile(ctx, h.kind, h.velocity, h.radius);
    } else if (h.kind === "bomb") {
      const progress = 1 - h.life / 0.35;
      ctx.strokeStyle = "#ffd189";
      ctx.fillStyle = "rgba(244,146,62,.22)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, h.radius * (0.6 + progress * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (h.kind === "void") {
      ctx.rotate(Math.atan2(h.velocity.y, h.velocity.x));
      ctx.fillStyle = "#301a43";
      ctx.strokeStyle = "#dc9cee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(-14, -6);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (h.kind === "wave" || h.kind === "sand") {
      ctx.rotate(Math.atan2(h.velocity.y, h.velocity.x));
      ctx.strokeStyle = h.kind === "sand" ? "#e3c689" : "#b5eff9";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-5, 0, 20, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = h.kind === "sand" ? "#a47d4b" : "#4bacc9";
      ctx.beginPath();
      ctx.arc(-11, 0, 24, -1.1, 1.1);
      ctx.stroke();
    } else {
      ctx.rotate(Math.atan2(h.velocity.y, h.velocity.x));
      ctx.fillStyle = "#d8e3ea";
      ctx.strokeStyle = "#593b56";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#c9a371";
      ctx.fillRect(-12, -2, 7, 4);
    }
    ctx.restore();
  }
  ctx.restore();
}
export function drawBossTelegraph(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
): void {
  const b = enemy.boss;
  if (!b) return;
  const d = bosses[b.kind],
    move = bossMoves[b.move];
  ctx.save();
  ctx.strokeStyle = "#f2bb78";
  ctx.fillStyle = "rgba(224,128,103,.2)";
  ctx.lineWidth = 3;
  if (
    b.kind !== "imu" &&
    !(b.move in regionalMoves) &&
    (b.phase === "windup" ||
      (b.phase === "attack" && (b.move === "slam" || b.move === "claw")))
  ) {
    if (["slam", "knifeRing", "bomb", "sandTomb"].includes(b.move)) {
      const position =
        b.move === "bomb" || b.move === "sandTomb" ? b.target : enemy.position;
      ctx.beginPath();
      ctx.arc(position.x, position.y, move.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (b.move === "bomb" || b.move === "sandTomb") {
        ctx.beginPath();
        ctx.moveTo(position.x - 12, position.y);
        ctx.lineTo(position.x + 12, position.y);
        ctx.moveTo(position.x, position.y - 12);
        ctx.lineTo(position.x, position.y + 12);
        ctx.stroke();
      }
    } else {
      const angle = Math.atan2(b.direction.y, b.direction.x),
        fan = fanPatterns[b.move];
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(angle);
      if (fan) {
        const count =
          enemy.health.current < enemy.health.maximum * 0.5
            ? fan.enraged
            : fan.count;
        for (let i = 0; i < count; i++) {
          const theta = fan.radial
            ? (i * Math.PI * 2) / count
            : (i - (count - 1) / 2) * fan.spread;
          ctx.beginPath();
          ctx.moveTo(Math.cos(theta) * 30, Math.sin(theta) * 30);
          ctx.lineTo(
            Math.cos(theta) * move.range,
            Math.sin(theta) * move.range,
          );
          ctx.stroke();
        }
      } else if (b.move === "claw" || b.move === "bladeCross") {
        const arc = Math.acos(0.45);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, move.range, -arc, arc);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        for (let line = 0; line < (b.move === "crossDash" ? 2 : 1); line++) {
          ctx.save();
          ctx.rotate((line * Math.PI) / 2);
          ctx.beginPath();
          ctx.rect(0, -18, move.range, 36);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }
  if (b.kind === "imu" && b.move === "shadowFan" && b.phase === "windup") {
    const phase = b.imuPhase ?? 1,
      count = phase === 1 ? 5 : phase === 2 ? 7 : 9,
      a = Math.atan2(b.direction.y, b.direction.x);
    for (let i = 0; i < count; i++) {
      const t = a + (i - (count - 1) / 2) * 0.23;
      ctx.beginPath();
      ctx.moveTo(enemy.position.x, enemy.position.y);
      ctx.lineTo(
        enemy.position.x + Math.cos(t) * 460,
        enemy.position.y + Math.sin(t) * 460,
      );
      ctx.stroke();
    }
  }
  const regional =
    b.move in regionalMoves
      ? regionalMoves[b.move as RegionalMoveId]
      : undefined;
  if (regional?.behavior === "fan" && b.phase === "windup") {
    const count =
        regional.count +
        (enemy.health.current < enemy.health.maximum * 0.5 ? 2 : 0),
      a = Math.atan2(b.direction.y, b.direction.x);
    ctx.strokeStyle = elementColors[regional.element][0];
    for (let i = 0; i < count; i++) {
      const t = a + (i - (count - 1) / 2) * regional.spread;
      ctx.beginPath();
      ctx.moveTo(enemy.position.x, enemy.position.y);
      ctx.lineTo(
        enemy.position.x + Math.cos(t) * regional.range,
        enemy.position.y + Math.sin(t) * regional.range,
      );
      ctx.stroke();
    }
  }
  ctx.textAlign = "center";
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#ffedd1";
  ctx.strokeStyle = "#272535";
  ctx.lineWidth = 4;
  ctx.strokeText(
    `${d.name}${b.kind === "imu" ? " · FASE " + (b.imuPhase ?? 1) + "/3" : ""}${enemy.health.current < enemy.health.maximum * 0.5 ? " · FURIA" : ""}`,
    enemy.position.x,
    enemy.position.y - 135,
  );
  ctx.fillText(
    `${d.name}${b.kind === "imu" ? " · FASE " + (b.imuPhase ?? 1) + "/3" : ""}${enemy.health.current < enemy.health.maximum * 0.5 ? " · FURIA" : ""}`,
    enemy.position.x,
    enemy.position.y - 135,
  );
  ctx.fillStyle = "#30273d";
  ctx.fillRect(enemy.position.x - 65, enemy.position.y - 128, 130, 6);
  ctx.fillStyle = d.color;
  ctx.fillRect(
    enemy.position.x - 65,
    enemy.position.y - 128,
    130 * Math.max(0, enemy.health.current / enemy.health.maximum),
    6,
  );
  ctx.restore();
}
