import { arenaBounds, bossArenas } from "../data/arenas";
import { worldPattern } from "./world";
import type { RiftArena } from "../game/types";
export function drawBossArena(
  ctx: CanvasRenderingContext2D,
  arena: RiftArena,
  view: { x: number; y: number; width: number; height: number },
): void {
  const def = bossArenas[arena.boss],
    x = arena.center.x - arenaBounds.halfWidth,
    y = arena.center.y - arenaBounds.halfHeight,
    w = arenaBounds.halfWidth * 2,
    h = arenaBounds.halfHeight * 2;
  ctx.save();
  ctx.fillStyle = "#080f1e";
  ctx.fillRect(view.x, view.y, view.width, view.height);
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 22;
  ctx.fillStyle = worldPattern(ctx, def.floor) ?? "#253447";
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.fillStyle = arena.boss === "imu" ? "#120d2999" : "#0a112329";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#101725";
  ctx.lineWidth = 20;
  ctx.strokeRect(x - 10, y - 10, w + 20, h + 20);
  ctx.strokeStyle = def.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = def.accent + "55";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 18, y + 18, w - 36, h - 36);
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++) {
      const px = arena.center.x + side * (arenaBounds.halfWidth + 12),
        py = y + 25 + (i * (h - 50)) / 6;
      ctx.fillStyle = "#293347";
      ctx.fillRect(px - 10, py - 12, 20, 24);
      ctx.fillStyle = def.accent;
      ctx.fillRect(px - 3, py - 5, 6, 10);
    }
  ctx.fillStyle = "#0a1229e8";
  ctx.fillRect(arena.center.x - 180, y + 14, 360, 27);
  ctx.fillStyle = def.accent;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(def.name.toUpperCase(), arena.center.x, y + 32);
  ctx.restore();
}
