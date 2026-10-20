import { it, expect } from "vitest";
import { combat } from "../src/data/combat";
import {
  islandDistance,
  islandOutline,
  constrainIsland,
} from "../src/data/island-shape";
it("dibujo y colisión comparten una costa irregular y redondeada", () => {
  const points = islandOutline();
  expect(points.length).toBeGreaterThan(500);
  for (const p of points) expect(Math.abs(islandDistance(p))).toBeLessThan(0.1);
  expect(
    new Set(points.filter((p) => p.y < 400).map((p) => Math.round(p.y))).size,
  ).toBeGreaterThan(20);
  expect(islandDistance({ x: 220, y: 220 })).toBeGreaterThan(0);
  for (const start of [
    { x: 0, y: 0 },
    { x: 0, y: 900 },
    { x: combat.world.width, y: combat.world.height },
    { x: 1500, y: 0 },
  ]) {
    const p = { ...start };
    constrainIsland(p, 12);
    expect(islandDistance(p)).toBeLessThanOrEqual(-12);
  }
  expect(islandDistance({ x: 1200, y: 900 })).toBeLessThan(-150);
});
