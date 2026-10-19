import { pickupDefinitions } from "../data/content";
import type { Run } from "../game/types";
export function drawLoot(
  ctx: CanvasRenderingContext2D,
  run: Run,
  reducedMotion: boolean,
): void {
  for (const drop of run.drops) {
    const { x, y } = drop.position;
    ctx.fillStyle = "#284e49";
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pickupDefinitions[drop.kind].color;
    if (drop.kind === "xp") {
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 5, y);
      ctx.fill();
      ctx.fillStyle = "#d1fff0";
      ctx.fillRect(x - 1, y - 4, 2, 3);
    } else if (drop.kind === "heal") {
      ctx.fillStyle = "#efe2bb";
      ctx.fillRect(x - 9, y - 1, 18, 3);
      ctx.fillRect(x - 10, y - 3, 3, 7);
      ctx.fillRect(x + 8, y - 3, 3, 7);
      ctx.fillStyle = "#a8573e";
      ctx.fillRect(x - 5, y - 7, 11, 12);
      ctx.fillStyle = "#e79266";
      ctx.fillRect(x - 3, y - 6, 7, 8);
    } else if (drop.kind === "coin") {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9c733b";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("฿", x, y + 3);
    } else {
      ctx.strokeStyle = pickupDefinitions[drop.kind].color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#152f38";
      ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = pickupDefinitions[drop.kind].color;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        drop.kind === "vacuum" ? "U" : drop.kind === "bomb" ? "✹" : "»",
        x,
        y + 4,
      );
    }
  }
  for (const chest of run.chests) {
    const { x, y } = chest.position;
    ctx.fillStyle = "#345249";
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#694c39";
    ctx.fillRect(x - 15, y - 9, 30, 20);
    ctx.fillStyle = "#b57c48";
    ctx.fillRect(x - 13, y - 12, 26, 20);
    ctx.fillStyle = "#e9c478";
    ctx.fillRect(x - 10, y - 12, 4, 20);
    ctx.fillRect(x + 6, y - 12, 4, 20);
    ctx.fillRect(x - 13, y - 3, 26, 3);
    ctx.fillRect(x - 3, y - 3, 6, 8);
    ctx.fillStyle = "#624d38";
    ctx.fillRect(x - 1, y - 1, 2, 3);
    const shine = reducedMotion ? 1 : 0.6 + Math.sin(run.elapsed * 5) * 0.4;
    ctx.globalAlpha = shine;
    ctx.fillStyle = "#ffdfa2";
    ctx.fillRect(x + 18, y - 17, 1, 9);
    ctx.fillRect(x + 14, y - 13, 9, 1);
    ctx.globalAlpha = 1;
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffdf9b";
    ctx.fillText("COFRE", x, y - 24);
  }
}
