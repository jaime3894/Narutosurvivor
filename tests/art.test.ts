import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { characters } from "../src/data/crew";
import { enemyTypes } from "../src/data/combat";
const manifest: Record<string, string> = JSON.parse(
  readFileSync("public/assets/manifest.json", "utf8"),
) as Record<string, string>;
const expected = [
  ...characters.flatMap((character) =>
    [0, 1, 2].map((tier) => `hero:${character.id}:${tier}`),
  ),
  ...Object.keys(enemyTypes).map((kind) => `enemy:${kind}`),
];
describe("arte de producción", () => {
  it.each(expected)(
    "%s tiene un atlas PNG publicado con dimensiones válidas",
    (key) => {
      const path = manifest[key];
      expect(path).toBeDefined();
      const png = readFileSync(`public/${path}`);
      expect([...png.subarray(0, 8)]).toEqual([
        137, 80, 78, 71, 13, 10, 26, 10,
      ]);
      expect(png.readUInt32BE(16)).toBe(960);
      expect(png.readUInt32BE(20)).toBe(320);
      expect(statSync(`public/${path}`).size).toBeLessThan(250_000);
    },
  );
  it("mantiene todo el reparto y los enemigos dentro de 5 MB", () => {
    expect(expected).toHaveLength(33);
    expect(
      expected.reduce(
        (sum, key) => sum + statSync(`public/${manifest[key]}`).size,
        0,
      ),
    ).toBeLessThan(5_000_000);
  });
});
