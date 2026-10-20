import { arenaBounds, bossArenas } from "../data/arenas";
import { feet, type WorldProp } from "../data/terrain";
import { penetration } from "./terrain";
import type { Position } from "../core/entity";
import type { RiftArena } from "./types";
const cache = new WeakMap<RiftArena, readonly WorldProp[]>();
export function arenaProps(arena: RiftArena): readonly WorldProp[] {
  const cached = cache.get(arena);
  if (cached) return cached;
  const def = bossArenas[arena.boss];
  const anchors =
    def.layout === "aisle"
      ? [
          [-190, -140],
          [190, -140],
          [-210, 150],
          [210, 150],
        ]
      : def.layout === "staggered"
        ? [
            [-220, -130],
            [190, -80],
            [-160, 155],
            [240, 180],
          ]
        : [
            [-210, -130],
            [210, -130],
            [-210, 165],
            [210, 165],
          ];
  const props = anchors.map(([dx = 0, dy = 0], i) => {
    const id = def.props[i % 2] ?? def.props[0],
      x = arena.center.x + dx,
      y = arena.center.y + dy,
      size = 132;
    const footprint = (feet[id] ?? []).map(([px, py]) => ({
      x: x + ((px - 64) * size) / 128,
      y: y + ((py - 120) * size) / 128,
    }));
    return {
      id,
      x,
      y,
      size,
      footprint,
      slot: i,
      centerY: y - 7,
      radius: Math.max(
        ...footprint.map((p) => Math.hypot(p.x - x, p.y - y + 7)),
        0,
      ),
    };
  });
  cache.set(arena, props);
  return props;
}
export function arenaBlocked(
  arena: RiftArena,
  position: Position,
  radius: number,
): boolean {
  return (
    Math.abs(position.x - arena.center.x) > arenaBounds.halfWidth - radius ||
    Math.abs(position.y - arena.center.y) > arenaBounds.halfHeight - radius ||
    arenaProps(arena).some((p) => Boolean(penetration(position, radius, p)))
  );
}
export function resolveArena(
  arena: RiftArena,
  position: Position,
  radius: number,
): void {
  for (let i = 0; i < 4; i++)
    for (const prop of arenaProps(arena)) {
      const push = penetration(position, radius, prop);
      if (push) {
        position.x += push.x;
        position.y += push.y;
      }
    }
  position.x = Math.max(
    arena.center.x - arenaBounds.halfWidth + radius,
    Math.min(arena.center.x + arenaBounds.halfWidth - radius, position.x),
  );
  position.y = Math.max(
    arena.center.y - arenaBounds.halfHeight + radius,
    Math.min(arena.center.y + arenaBounds.halfHeight - radius, position.y),
  );
}
export function moveInArena(
  arena: RiftArena,
  position: Position,
  delta: Position,
  radius: number,
): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y) / 6));
  for (let i = 0; i < steps; i++) {
    position.x += delta.x / steps;
    position.y += delta.y / steps;
    resolveArena(arena, position, radius);
  }
}
/** Un rodeo corto evita que la persecución se quede clavada en una columna. */
export function arenaHeading(
  arena: RiftArena,
  position: Position,
  target: Position,
  radius: number,
): Position {
  const angle = Math.atan2(target.y - position.y, target.x - position.x);
  for (const turn of [0, 0.65, -0.65, 1.25, -1.25]) {
    const x = Math.cos(angle + turn),
      y = Math.sin(angle + turn);
    if (
      !arenaBlocked(
        arena,
        { x: position.x + x * 65, y: position.y + y * 65 },
        radius,
      )
    )
      return { x, y };
  }
  return { x: 0, y: 0 };
}
