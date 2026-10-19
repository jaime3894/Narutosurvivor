import { bossOrder, type BossId } from "../data/rifts";
import type { Enemy } from "../game/types";
const atlases = new Map<BossId, HTMLImageElement>();
export const bossAtlas = (id: BossId): HTMLImageElement | undefined =>
  atlases.get(id);
export async function loadBossAtlases(root: URL): Promise<void> {
  await Promise.all(
    bossOrder.map(async (id) => {
      const image = new Image();
      image.src = new URL(`assets/bosses/${id}-v6.png`, root).href;
      try {
        await image.decode();
        if (image.width !== 1024 || image.height !== 128)
          throw new Error("Dimensiones");
        atlases.set(id, image);
      } catch {
        console.warn(
          `Atlas de ${id} ausente; se conserva el enemigo integrado.`,
        );
      }
    }),
  );
}
export function drawBoss(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  target: { x: number; y: number },
  reducedMotion = false,
): boolean {
  const state = enemy.boss;
  if (!state) return false;
  const atlas = bossAtlas(state.kind);
  if (!atlas) return false;
  const frame =
    state.phase === "windup"
      ? 2
      : state.phase === "attack"
        ? 3
        : target.y < enemy.position.y
          ? 1
          : 0;
  ctx.save();
  ctx.translate(enemy.position.x, enemy.position.y);
  const direction =
    state.phase === "windup" || state.phase === "attack"
      ? state.direction.x
      : target.x - enemy.position.x;
  if (direction < 0) ctx.scale(-1, 1);
  const fraction =
    state.phase === "windup" && !reducedMotion
      ? Math.sin(Math.max(0, state.time) * 8) * 0.6
      : 0;
  ctx.drawImage(
    atlas,
    frame * 256,
    0,
    256,
    128,
    -128 + fraction,
    -118,
    256,
    128,
  );
  ctx.restore();
  return true;
}
