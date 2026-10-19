import { worldProps, type WorldProp } from "../data/terrain";
import { voyageStage } from "../data/voyage";
import { combat } from "../data/combat";
import type { Position } from "../core/entity";
const bucketSize = 160;
const indexes = new Map<string, Map<string, WorldProp[]>>();
function index(seconds: number): Map<string, WorldProp[]> {
  const key = voyageStage(seconds).id,
    cached = indexes.get(key);
  if (cached) return cached;
  const result = new Map<string, WorldProp[]>();
  for (const prop of worldProps(seconds)) {
    if (!prop.radius) continue;
    const key = `${Math.floor(prop.x / bucketSize)},${Math.floor(prop.centerY / bucketSize)}`;
    const bucket = result.get(key) ?? [];
    bucket.push(prop);
    result.set(key, bucket);
  }
  indexes.set(key, result);
  return result;
}
export function nearbyObstacles(
  position: Position,
  seconds: number,
  reach = 80,
): WorldProp[] {
  const map = index(seconds),
    result: WorldProp[] = [];
  for (
    let y = Math.floor((position.y - reach) / bucketSize);
    y <= Math.floor((position.y + reach) / bucketSize);
    y++
  )
    for (
      let x = Math.floor((position.x - reach) / bucketSize);
      x <= Math.floor((position.x + reach) / bucketSize);
      x++
    )
      result.push(...(map.get(`${x},${y}`) ?? []));
  return result;
}
export function blocked(
  position: Position,
  radius: number,
  seconds: number,
): boolean {
  return nearbyObstacles(position, seconds, radius + 40).some(
    (p) =>
      Math.hypot(position.x - p.x, position.y - p.centerY) <
      radius + p.radius - 0.001,
  );
}
export function resolveObstacles(
  position: Position,
  radius: number,
  seconds: number,
): void {
  const near = nearbyObstacles(position, seconds, radius + 45);
  for (let pass = 0; pass < 3; pass++)
    for (const p of near) {
      const dx = position.x - p.x,
        dy = position.y - p.centerY,
        d = Math.hypot(dx, dy),
        r = radius + p.radius;
      if (d < r) {
        const nx = d > 0.0001 ? dx / d : 1,
          ny = d > 0.0001 ? dy / d : 0;
        position.x = p.x + nx * (r + 0.01);
        position.y = p.centerY + ny * (r + 0.01);
      }
    }
  const margin = combat.world.shore + radius;
  position.x = Math.max(
    margin,
    Math.min(combat.world.width - margin, position.x),
  );
  position.y = Math.max(
    margin,
    Math.min(combat.world.height - margin, position.y),
  );
}
/** Pasos cortos también durante la embestida: no se salta un tronco de un fotograma a otro. */
export function moveOnTerrain(
  position: Position,
  delta: Position,
  radius: number,
  seconds: number,
): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y) / 6));
  for (let i = 0; i < steps; i++) {
    position.x += delta.x / steps;
    position.y += delta.y / steps;
    resolveObstacles(position, radius, seconds);
  }
}
export function freePosition(
  position: Position,
  radius: number,
  seconds: number,
): Position {
  const p = { ...position };
  resolveObstacles(p, radius, seconds);
  if (!blocked(p, radius, seconds)) return p;
  for (let distance = 24; distance <= 168; distance += 24)
    for (let i = 0; i < 16; i++) {
      const candidate = {
        x: position.x + Math.cos((i * Math.PI) / 8) * distance,
        y: position.y + Math.sin((i * Math.PI) / 8) * distance,
      };
      resolveObstacles(candidate, radius, seconds);
      if (!blocked(candidate, radius, seconds)) return candidate;
    }
  return p;
}
export function steerAround(
  position: Position,
  target: Position,
  radius: number,
  seconds: number,
  tie = 1,
): Position {
  const dx = target.x - position.x,
    dy = target.y - position.y,
    length = Math.hypot(dx, dy) || 1;
  let x = dx / length,
    y = dy / length;
  for (const p of nearbyObstacles(position, seconds, 95)) {
    const ox = p.x - position.x,
      oy = p.centerY - position.y,
      along = ox * x + oy * y,
      cross = x * oy - y * ox;
    if (
      along > 0 &&
      along < Math.min(length, radius + p.radius + 52) &&
      Math.abs(cross) < radius + p.radius + 9
    ) {
      const side =
        Math.abs(cross) < 0.5 ? (tie % 2 ? 1 : -1) : cross > 0 ? -1 : 1;
      const angle = side * 1.05,
        c = Math.cos(angle),
        s = Math.sin(angle);
      return { x: x * c - y * s, y: x * s + y * c };
    }
  }
  return { x, y };
}
