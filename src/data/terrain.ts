import { combat } from "./combat";
import { voyageStage } from "./voyage";
export interface WorldProp {
  x: number;
  y: number;
  size: number;
  id: number;
  radius: number;
  centerY: number;
  slot: number;
}
const cache = new Map<string, readonly WorldProp[]>();
/** La misma geometría se usa al dibujar, chocar y colocar botín. */
export function worldProps(seconds: number): readonly WorldProp[] {
  const stage = voyageStage(seconds),
    cached = cache.get(stage.id);
  if (cached) return cached;
  const result: WorldProp[] = [];
  for (let gy = 0; 180 + gy * 210 < combat.world.height - 100; gy++)
    for (let gx = 0; 150 + gx * 210 < combat.world.width - 100; gx++) {
      const hash = Math.abs(Math.imul(gx + 17, gy * 71 + 39)),
        x = 150 + gx * 210 + (hash % 65),
        y = 180 + gy * 210 + (hash % 45);
      const localX = x % 2400,
        localY = y % 1800;
      if (Math.abs(localX - 1200) < 150 && Math.abs(localY - 900) < 120)
        continue;
      const slot = hash % 4,
        id = stage.props[slot] ?? stage.props[0],
        size = 76 + (hash % 19);
      const radii =
        stage.id === "coast"
          ? [9, 0, 17, 27]
          : stage.id === "harbor"
            ? [22, 16, 9, 25]
            : [14, 20, 19, 12];
      const radius = ((radii[slot] ?? 0) * size) / 88;
      result.push({ x, y, size, id, radius, centerY: y - 7, slot });
    }
  cache.set(stage.id, result);
  return result;
}
