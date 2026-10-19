import { bossMoves } from "../data/boss-moves";
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
    ctx.translate(h.position.x, h.position.y - (h.kind === "bomb" ? 0 : 34));
    if (h.kind === "bomb") {
      const progress = 1 - h.life / 0.35;
      ctx.strokeStyle = "#ffd189";
      ctx.fillStyle = "rgba(244,146,62,.22)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, h.radius * (0.6 + progress * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (h.kind === "wave") {
      ctx.rotate(Math.atan2(h.velocity.y, h.velocity.x));
      ctx.strokeStyle = "#b5eff9";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-5, 0, 20, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = "#4bacc9";
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
    b.phase === "windup" ||
    (b.phase === "attack" && (b.move === "slam" || b.move === "claw"))
  ) {
    if (b.move === "slam" || b.move === "knifeRing" || b.move === "bomb") {
      const position = b.move === "bomb" ? b.target : enemy.position;
      ctx.beginPath();
      ctx.arc(position.x, position.y, move.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (b.move === "bomb") {
        ctx.beginPath();
        ctx.moveTo(position.x - 12, position.y);
        ctx.lineTo(position.x + 12, position.y);
        ctx.moveTo(position.x, position.y - 12);
        ctx.lineTo(position.x, position.y + 12);
        ctx.stroke();
      }
    } else {
      const angle = Math.atan2(b.direction.y, b.direction.x),
        wide =
          b.move === "knifeFan" || b.move === "sharkWave" || b.move === "claw";
      for (let line = 0; line < (b.move === "crossDash" ? 2 : 1); line++) {
        ctx.save();
        ctx.translate(enemy.position.x, enemy.position.y);
        ctx.rotate(angle + (line * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(move.range, -(wide ? 100 : 18));
        ctx.lineTo(move.range, wide ? 100 : 18);
        ctx.lineTo(0, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  ctx.textAlign = "center";
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#ffedd1";
  ctx.strokeStyle = "#272535";
  ctx.lineWidth = 4;
  ctx.strokeText(
    `${d.name}${enemy.health.current < enemy.health.maximum * 0.5 ? " · FURIA" : ""}`,
    enemy.position.x,
    enemy.position.y - 135,
  );
  ctx.fillText(
    `${d.name}${enemy.health.current < enemy.health.maximum * 0.5 ? " · FURIA" : ""}`,
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
