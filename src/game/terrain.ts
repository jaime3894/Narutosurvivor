import { islandDistance, constrainIsland } from "../data/island-shape";
import { worldProps, type WorldProp } from "../data/terrain";
import { terrainStage } from "../data/voyage";
import type { Position } from "../core/entity";
const bucketSize = 160;
const indexes = new Map<string, Map<string, WorldProp[]>>();
function index(seconds: number): Map<string, WorldProp[]> {
  const key = terrainStage(seconds).id,
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
/** Punto más cercano y normal exterior sobre el polígono de la base. */
export function penetration(
  position: Position,
  radius: number,
  p: WorldProp,
): Position | undefined {
  const vertices = p.footprint;
  if (!vertices.length) return;
  let inside = false,
    nearest = Infinity,
    qx = 0,
    qy = 0,
    nx = 0,
    ny = 0;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[j]!,
      b = vertices[i]!;
    if (
      a.y > position.y !== b.y > position.y &&
      position.x < ((b.x - a.x) * (position.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      l = dx * dx + dy * dy;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((position.x - a.x) * dx + (position.y - a.y) * dy) / (l || 1),
      ),
    );
    const x = a.x + t * dx,
      y = a.y + t * dy,
      d = Math.hypot(position.x - x, position.y - y);
    if (d < nearest) {
      nearest = d;
      qx = x;
      qy = y;
      nx = dy / Math.sqrt(l || 1);
      ny = -dx / Math.sqrt(l || 1);
    }
  }
  if (!inside && nearest >= radius - 0.001) return;
  if (nearest > 0.0001) {
    nx = (position.x - qx) / nearest;
    ny = (position.y - qy) / nearest;
    if (inside) {
      nx = -nx;
      ny = -ny;
    }
  }
  return {
    x: qx + nx * (radius + 0.02) - position.x,
    y: qy + ny * (radius + 0.02) - position.y,
  };
}
export function blocked(
  position: Position,
  radius: number,
  seconds: number,
): boolean {
  return (
    islandDistance(position) > -radius ||
    nearbyObstacles(position, seconds, radius + 95).some((p) =>
      Boolean(penetration(position, radius, p)),
    )
  );
}
export function resolveObstacles(
  position: Position,
  radius: number,
  seconds: number,
): void {
  const near = nearbyObstacles(position, seconds, radius + 95);
  for (let pass = 0; pass < 4; pass++)
    for (const p of near) {
      const push = penetration(position, radius, p);
      if (push) {
        position.x += push.x;
        position.y += push.y;
      }
    }
  constrainIsland(position, radius);
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
