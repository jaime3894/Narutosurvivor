import { combat } from "./combat";
import { voyageStage } from "./voyage";
import { createRandom } from "../core/random";
import type { Position } from "../core/entity";
export interface WorldProp {
  x: number;
  y: number;
  size: number;
  id: number;
  radius: number;
  centerY: number;
  slot: number;
  footprint: readonly Position[];
}
/** Pies medidos en el atlas 128 px: hojas, telas y copas no bloquean. */
const feet: readonly (readonly (readonly [number, number])[])[] = [
  [
    [43, 104],
    [57, 104],
    [59, 117],
    [39, 117],
  ],
  [],
  [
    [10, 89],
    [58, 89],
    [62, 111],
    [37, 118],
    [10, 108],
  ],
  [
    [16, 98],
    [29, 77],
    [93, 79],
    [114, 103],
    [103, 117],
    [29, 117],
  ],
  [
    [12, 99],
    [62, 91],
    [113, 103],
    [111, 118],
    [27, 118],
  ],
  [
    [20, 100],
    [102, 100],
    [110, 117],
    [17, 117],
  ],
  [
    [25, 109],
    [43, 109],
    [51, 121],
    [19, 121],
  ],
  [
    [13, 91],
    [110, 91],
    [114, 116],
    [11, 116],
  ],
  [
    [31, 105],
    [86, 103],
    [99, 117],
    [25, 117],
  ],
  [
    [20, 103],
    [94, 103],
    [106, 120],
    [13, 120],
  ],
  [
    [24, 100],
    [104, 100],
    [111, 117],
    [18, 117],
  ],
  [
    [94, 101],
    [108, 101],
    [112, 118],
    [88, 118],
  ],
];
export function pathCenter(x: number): number {
  return (
    900 + Math.sin((x - 1200) / 790) * 250 + Math.sin((x - 1200) / 2110) * 450
  );
}
export function clearing(x: number, y: number): boolean {
  return (
    Math.hypot(x - 1200, y - 900) < 155 || Math.abs(y - pathCenter(x)) < 70
  );
}
const cache = new Map<string, readonly WorldProp[]>();
export function worldProps(seconds: number): readonly WorldProp[] {
  const stage = voyageStage(seconds),
    cached = cache.get(stage.id);
  if (cached) return cached;
  const random = createRandom(31987),
    result: WorldProp[] = [],
    bins = new Map<string, Position[]>();
  // Centros de vegetación independientes de las posiciones de las piedras; muestreo por rechazo, sin cuadrícula visible.
  const clusters = Array.from({ length: 150 }, () => ({
    x: 100 + random() * (combat.world.width - 200),
    y: 100 + random() * (combat.world.height - 200),
    r: 130 + random() * 350,
  }));
  for (let attempt = 0; attempt < 13500; attempt++) {
    const x = 140 + random() * (combat.world.width - 280),
      y = 140 + random() * (combat.world.height - 280);
    const density = clusters.some((c) => Math.hypot(x - c.x, y - c.y) < c.r)
      ? 0.85
      : 0.18;
    if (random() > density || clearing(x, y)) continue;
    const bx = Math.floor(x / 100),
      by = Math.floor(y / 100);
    let close = false;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (
          bins
            .get(`${bx + dx},${by + dy}`)
            ?.some((p) => Math.hypot(x - p.x, y - p.y) < 83)
        )
          close = true;
    if (close) continue;
    const key = `${bx},${by}`,
      bucket = bins.get(key) ?? [];
    bucket.push({ x, y });
    bins.set(key, bucket);
    const slot = Math.floor(random() * 4),
      id = stage.props[slot] ?? stage.props[0],
      size = 76 + Math.floor(random() * 19);
    const footprint = (feet[id] ?? []).map(([px, py]) => ({
      x: x + ((px - 64) * size) / 128,
      y: y + ((py - 120) * size) / 128,
    }));
    const radius = footprint.length
      ? Math.max(...footprint.map((p) => Math.hypot(p.x - x, p.y - (y - 7))))
      : 0;
    result.push({ x, y, size, id, radius, centerY: y - 7, slot, footprint });
  }
  cache.set(stage.id, result);
  return result;
}
/** Vista espacial cacheada: el tamaño de la isla no multiplica el coste de cada fotograma. */
const indexes = new Map<string, Map<string, WorldProp[]>>();
export function propsInArea(
  seconds: number,
  x: number,
  y: number,
  width: number,
  height: number,
): WorldProp[] {
  const id = voyageStage(seconds).id;
  let index = indexes.get(id);
  if (!index) {
    index = new Map();
    for (const p of worldProps(seconds)) {
      const key = `${Math.floor(p.x / 320)},${Math.floor(p.y / 320)}`;
      const list = index.get(key) ?? [];
      list.push(p);
      index.set(key, list);
    }
    indexes.set(id, index);
  }
  const result: WorldProp[] = [];
  for (
    let gy = Math.floor((y - 110) / 320);
    gy <= Math.floor((y + height + 110) / 320);
    gy++
  )
    for (
      let gx = Math.floor((x - 110) / 320);
      gx <= Math.floor((x + width + 110) / 320);
      gx++
    )
      result.push(...(index.get(`${gx},${gy}`) ?? []));
  return result;
}

/** Manchas de suelo orgánicas, reproducibles y compartidas entre las tres ambientaciones. */
const patchRandom = createRandom(98761);
export const groundPatches = Array.from({ length: 500 }, () => {
  const x = 150 + patchRandom() * (combat.world.width - 300),
    y = 150 + patchRandom() * (combat.world.height - 300),
    rx = 90 + patchRandom() * 200,
    ry = 60 + patchRandom() * 140;
  return {
    x,
    y,
    rx,
    ry,
    points: Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6,
        r = 0.72 + patchRandom() * 0.28;
      return { x: x + Math.cos(a) * rx * r, y: y + Math.sin(a) * ry * r };
    }),
  };
});
