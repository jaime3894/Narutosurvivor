import { islandDistance } from "./island-shape";
import { combat } from "./combat";
import { terrainStage } from "./voyage";
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
export const feet: readonly (readonly (readonly [number, number])[])[] = [
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
  [
    [31, 99],
    [28, 108],
    [47, 118],
    [82, 118],
    [94, 108],
    [98, 99],
  ],
  [
    [26, 99],
    [24, 108],
    [26, 118],
    [102, 118],
    [104, 108],
    [102, 99],
  ],
  [
    [23, 99],
    [26, 108],
    [56, 118],
    [76, 118],
    [101, 108],
    [103, 99],
  ],
  [],
  [
    [10, 99],
    [40, 108],
    [63, 118],
    [66, 118],
    [74, 108],
    [72, 99],
  ],
  [
    [17, 99],
    [24, 108],
    [60, 118],
    [67, 118],
    [75, 108],
    [88, 99],
  ],
  [
    [61, 110],
    [66, 110],
    [67, 119],
    [60, 119],
  ],
  [
    [36, 99],
    [32, 108],
    [35, 118],
    [91, 118],
    [96, 108],
    [104, 99],
  ],
  [
    [38, 99],
    [34, 108],
    [52, 118],
    [83, 118],
    [99, 108],
    [88, 99],
  ],
  [
    [17, 99],
    [19, 108],
    [61, 118],
    [66, 118],
    [86, 108],
    [93, 99],
  ],
  [
    [13, 99],
    [22, 108],
    [65, 118],
    [68, 118],
    [76, 108],
    [77, 99],
  ],
  [
    [11, 99],
    [17, 108],
    [57, 118],
    [66, 118],
    [75, 108],
    [75, 99],
  ],
  [
    [10, 99],
    [20, 108],
    [48, 118],
    [79, 118],
    [111, 108],
    [111, 99],
  ],
  [
    [13, 99],
    [12, 108],
    [63, 118],
    [64, 118],
    [66, 108],
    [67, 99],
  ],
  [
    [10, 99],
    [12, 108],
    [73, 118],
    [75, 118],
    [83, 108],
    [82, 99],
  ],
  [
    [13, 99],
    [22, 108],
    [63, 118],
    [65, 118],
    [83, 108],
    [84, 99],
  ],
  [
    [15, 99],
    [15, 108],
    [62, 118],
    [65, 118],
    [76, 108],
    [80, 99],
  ],
  [
    [21, 99],
    [24, 108],
    [61, 118],
    [68, 118],
    [80, 108],
    [84, 99],
  ],
  [
    [13, 99],
    [16, 108],
    [53, 118],
    [86, 118],
    [95, 108],
    [98, 99],
  ],
  [
    [26, 99],
    [33, 108],
    [55, 118],
    [74, 118],
    [87, 108],
    [91, 99],
  ],
  [
    [45, 99],
    [28, 108],
    [49, 118],
    [83, 118],
    [87, 108],
    [82, 99],
  ],
  [
    [37, 99],
    [32, 108],
    [49, 118],
    [82, 118],
    [86, 108],
    [91, 99],
  ],
  [
    [38, 99],
    [31, 108],
    [56, 118],
    [73, 118],
    [104, 108],
    [100, 99],
  ],
  [
    [22, 99],
    [24, 108],
    [62, 118],
    [66, 118],
    [115, 108],
    [116, 99],
  ],
];
export const horizontalTracks = [0, 0.22, 0.48, 0.76] as const;
export const verticalTracks = [0.13, 0.47, 0.81] as const;
export function pathCenter(x: number, track = 0): number {
  return (
    900 +
    (horizontalTracks[track] ?? 0) * combat.world.height +
    Math.sin((x - 1200) / (790 + track * 190) + track * 0.7) * 250 +
    Math.sin((x - 1200) / (2110 + track * 240)) * 450
  );
}
export function verticalPath(y: number, track: number): number {
  return (
    (verticalTracks[track] ?? 0.5) * combat.world.width +
    Math.sin(y / (1250 + track * 170) + track) * 370 +
    Math.sin(y / 430) * 95
  );
}
export function clearing(x: number, y: number): boolean {
  return (
    Math.hypot(x - 1200, y - 900) < 180 ||
    horizontalTracks.some((_, i) => Math.abs(y - pathCenter(x, i)) < 70) ||
    verticalTracks.some((_, i) => Math.abs(x - verticalPath(y, i)) < 55)
  );
}
const cache = new Map<string, readonly WorldProp[]>();
export function worldProps(seconds: number): readonly WorldProp[] {
  const stage = terrainStage(seconds),
    cached = cache.get(stage.id);
  if (cached) return cached;
  const random = createRandom(31987),
    result: WorldProp[] = [],
    bins = new Map<string, Position[]>();
  // Centros de vegetación independientes de las posiciones de las piedras; muestreo por rechazo, sin cuadrícula visible.
  const clusters = Array.from({ length: 600 }, () => ({
    x: 100 + random() * (combat.world.width - 200),
    y: 100 + random() * (combat.world.height - 200),
    r: 130 + random() * 350,
  }));
  const clusterBins = new Map<string, typeof clusters>();
  for (const c of clusters) {
    const key = `${Math.floor(c.x / 640)},${Math.floor(c.y / 640)}`,
      bin = clusterBins.get(key) ?? [];
    bin.push(c);
    clusterBins.set(key, bin);
  }
  for (let attempt = 0; attempt < 54000; attempt++) {
    const x = 140 + random() * (combat.world.width - 280),
      y = 140 + random() * (combat.world.height - 280);
    let dense = false;
    for (let dy = -1; dy <= 1 && !dense; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (
          clusterBins
            .get(`${Math.floor(x / 640) + dx},${Math.floor(y / 640) + dy}`)
            ?.some((c) => Math.hypot(x - c.x, y - c.y) < c.r)
        ) {
          dense = true;
          break;
        }
    const density = dense ? 0.85 : 0.18;
    if (random() > density || clearing(x, y) || islandDistance({ x, y }) > -100)
      continue;
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
  const id = terrainStage(seconds).id;
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
export const groundPatches = Array.from({ length: 2000 }, () => {
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
