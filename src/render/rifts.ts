import { bosses, riftRules } from "../data/rifts";
import type { Run, Enemy } from "../game/types";
export function drawRifts(
  ctx: CanvasRenderingContext2D,
  run: Run,
  reduced: boolean,
): void {
  ctx.save();
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
  for (const h of run.hazards) {
    ctx.save();
    ctx.translate(h.position.x, h.position.y);
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
  const d = bosses[b.kind];
  ctx.save();
  ctx.strokeStyle = d.color;
  ctx.fillStyle = "rgba(224,128,103,.2)";
  ctx.lineWidth = 3;
  if (b.phase === "windup") {
    if (d.pattern === "slam") {
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, d.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(Math.atan2(b.direction.y, b.direction.x));
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(d.range, -(d.pattern === "knives" ? 130 : 18));
      ctx.lineTo(d.range, d.pattern === "knives" ? 130 : 18);
      ctx.lineTo(0, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.textAlign = "center";
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#ffedd1";
  ctx.strokeStyle = "#272535";
  ctx.lineWidth = 4;
  ctx.strokeText(d.name, enemy.position.x, enemy.position.y - 135);
  ctx.fillText(d.name, enemy.position.x, enemy.position.y - 135);
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
