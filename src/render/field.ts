import { fieldDefinitions, fieldRules } from "../data/survival";
import type { Run } from "../game/types";
import { worldAsset } from "./world-assets";
export function drawField(ctx: CanvasRenderingContext2D, run: Run): void {
  const props = worldAsset("props");
  for (const object of run.arena ? [] : run.fieldObjects) {
    const { x, y } = object.position;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = object.kind === "supplies" ? "#b5edbf" : "#f4d17d";
    ctx.fillStyle = "rgba(15,25,35,.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 3, 29, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const id = fieldDefinitions[object.kind].atlas;
    if (props)
      ctx.drawImage(
        props,
        (id % 4) * 128,
        Math.floor(id / 4) * 128,
        128,
        128,
        -32,
        -55,
        64,
        64,
      );
    ctx.textAlign = "center";
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#fff1c9";
    ctx.fillText(fieldDefinitions[object.kind].title, 0, 24);
    if (object.kind === "vault" && object.progress > 0) {
      ctx.fillStyle = "#263d4a";
      ctx.fillRect(-25, 30, 50, 4);
      ctx.fillStyle = "#ffdb83";
      ctx.fillRect(
        -25,
        30,
        (50 * object.progress) / fieldRules.vaultSeconds,
        4,
      );
    }
    ctx.restore();
  }
  for (const enemy of run.enemies) {
    if (!enemy.role) continue;
    const { x, y } = enemy.position;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 11px monospace";
    ctx.fillStyle =
      enemy.role === "officer"
        ? "#f6d17c"
        : enemy.role === "shield"
          ? "#9fdaed"
          : "#ffd1b0";
    ctx.fillText(
      enemy.role === "officer"
        ? "✚ OFICIAL"
        : enemy.role === "shield"
          ? "▣ GUARDIA"
          : "⌖ FUSILERO",
      x,
      y - 66,
    );
    if (enemy.role === "shield") {
      const a = Math.atan2(enemy.aim?.y ?? 1, enemy.aim?.x ?? 0);
      ctx.strokeStyle = "#badde9";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, enemy.radius + 7, a - 0.8, a + 0.8);
      ctx.stroke();
    }
    if ((enemy.warning ?? 0) > 0 && enemy.aim) {
      ctx.strokeStyle = "#ffe2a0";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + enemy.aim.x * 440, y + enemy.aim.y * 440);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = "#fff2bf";
  ctx.lineWidth = 3;
  for (const s of run.shots) {
    const a = Math.atan2(s.velocity.y, s.velocity.x);
    ctx.beginPath();
    ctx.moveTo(s.position.x, s.position.y);
    ctx.lineTo(
      s.position.x - Math.cos(a) * 12,
      s.position.y - Math.sin(a) * 12,
    );
    ctx.stroke();
  }
  ctx.restore();
}
