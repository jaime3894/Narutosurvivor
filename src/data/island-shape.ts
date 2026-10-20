import { combat } from "./combat";
import type { Position } from "../core/entity";
/** Límite compartido por dibujo y física: costa ondulada con cabos redondeados. */
export function islandDistance(p: Position): number {
  const r = 650,
    qx =
      Math.abs(p.x - combat.world.width / 2) -
      (combat.world.width / 2 - 220 - r),
    qy =
      Math.abs(p.y - combat.world.height / 2) -
      (combat.world.height / 2 - 220 - r);
  const base =
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r;
  if (base < -150 || base > 150) return base;
  return (
    base +
    25 * Math.sin(p.x / 950) +
    20 * Math.sin(p.y / 850) +
    12 * Math.sin(p.x / 330 + p.y / 410) +
    18 * Math.sin(p.x / 125 + p.y / 85)
  );
}
export function constrainIsland(p: Position, radius: number): void {
  for (let i = 0; i < 5; i++) {
    const depth = islandDistance(p) + radius;
    if (depth <= 0) return;
    const dx =
        islandDistance({ x: p.x + 0.5, y: p.y }) -
        islandDistance({ x: p.x - 0.5, y: p.y }),
      dy =
        islandDistance({ x: p.x, y: p.y + 0.5 }) -
        islandDistance({ x: p.x, y: p.y - 0.5 }),
      gradientSquared = dx * dx + dy * dy || 1;
    p.x -= (dx / gradientSquared) * (depth + 1);
    p.y -= (dy / gradientSquared) * (depth + 1);
  }
}
const outlines = new Map<number, readonly Position[]>();
export function islandOutline(inset = 0): readonly Position[] {
  const cached = outlines.get(inset);
  if (cached) return cached;
  const w = combat.world.width,
    h = combat.world.height,
    r = 650,
    edge = 220,
    points: Position[] = [];
  const corners = [
    [w - edge - r, edge + r, -Math.PI / 2],
    [w - edge - r, h - edge - r, 0],
    [edge + r, h - edge - r, Math.PI / 2],
    [edge + r, edge + r, Math.PI],
  ] as const;
  for (let i = 0; i < corners.length; i++) {
    const [cx, cy, start] = corners[i]!;
    for (let n = 0; n <= 20; n++) {
      const a = start + (n * Math.PI) / 40;
      points.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    const next = corners[(i + 1) % 4]!,
      a = start + Math.PI / 2,
      p = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r },
      q = {
        x: next[0] + Math.cos(next[2]) * r,
        y: next[1] + Math.sin(next[2]) * r,
      },
      steps = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 40);
    for (let n = 1; n < steps; n++)
      points.push({
        x: p.x + ((q.x - p.x) * n) / steps,
        y: p.y + ((q.y - p.y) * n) / steps,
      });
  }
  for (const p of points)
    for (let i = 0; i < 5; i++) {
      const error = islandDistance(p) + inset;
      if (Math.abs(error) < 0.05) break;
      const dx =
          islandDistance({ x: p.x + 0.5, y: p.y }) -
          islandDistance({ x: p.x - 0.5, y: p.y }),
        dy =
          islandDistance({ x: p.x, y: p.y + 0.5 }) -
          islandDistance({ x: p.x, y: p.y - 0.5 }),
        gradientSquared = dx * dx + dy * dy || 1;
      p.x -= (dx / gradientSquared) * error;
      p.y -= (dy / gradientSquared) * error;
    }
  outlines.set(inset, points);
  return points;
}
