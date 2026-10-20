import { allBosses as bossOrder, bossArt } from "../src/data/rifts";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { characters } from "../src/data/crew";
import { enemyTypes } from "../src/data/combat";
import {
  combatArtists,
  combatAtlasPath,
  combatLayout,
} from "../src/data/combat-art";
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
      ) +
        [
          "luffy-arms-v4.png",
          "luffy-bodies-v4.png",
          "luffy-base-body-v4.png",
        ].reduce(
          (sum, name) =>
            sum + statSync(`public/assets/characters/${name}`).size,
          0,
        ),
    ).toBeLessThan(5_000_000);
  });
});

describe("poses corporales de combate", () => {
  it.each(combatArtists)("%s publica todas las poses y formas", (id) => {
    const png = readFileSync(`public/${combatAtlasPath(id)}`);
    expect(png.readUInt32BE(16)).toBe(combatLayout.width);
    expect(png.readUInt32BE(20)).toBe(combatLayout.height);
    // Hasta 36 poses anchas; el presupuesto conjunto incluye también el arte anterior.
    expect(png.length).toBeLessThan(500_000);
  });
  it("toda la precarga artística permanece dentro de 10 MB", () => {
    const base = expected.reduce(
      (sum, key) => sum + statSync(`public/${manifest[key]}`).size,
      0,
    );
    const poses = combatArtists.reduce(
      (sum, id) => sum + statSync(`public/${combatAtlasPath(id)}`).size,
      0,
    );
    const layers = [
      "luffy-arms-v4.png",
      "luffy-bodies-v4.png",
      "luffy-base-body-v4.png",
      "luffy-kick-bodies-v5.png",
      "luffy-sandals-v5.png",
      "franky-fists-v5.png",
      "franky-bodies-v5.png",
      "luffy-balloon-v5.png",
    ];
    expect(
      base +
        poses +
        bossOrder.reduce(
          (sum, id) => sum + statSync(`public/${bossArt(id).walk}`).size,
          0,
        ) +
        [
          "world/terrain-v7.png",
          "world/props-v7.png",
          "icons/icons-v7.png",
        ].reduce(
          (sum, path) => sum + statSync(`public/assets/${path}`).size,
          0,
        ) +
        bossOrder.reduce(
          (sum, id) => sum + statSync(`public/${bossArt(id).poses}`).size,
          0,
        ) +
        layers.reduce(
          (sum, path) =>
            sum + statSync(`public/assets/characters/${path}`).size,
          0,
        ),
    ).toBeLessThan(10_000_000);
  });
  it.each([
    ["luffy-kick-bodies-v5.png", 288, 320],
    ["luffy-sandals-v5.png", 96, 16],
    ["franky-fists-v5.png", 192, 64],
    ["franky-bodies-v5.png", 288, 320],
    ["luffy-balloon-v5.png", 288, 320],
  ] as const)(
    "%s conserva el contrato de las piezas anatómicas",
    (name, width, height) => {
      const png = readFileSync(`public/assets/characters/${name}`);
      expect(png.readUInt32BE(16)).toBe(width);
      expect(png.readUInt32BE(20)).toBe(height);
    },
  );
});
describe("capas anatómicas de Luffy", () => {
  it.each([
    ["luffy-arms-v4.png", 512, 192],
    ["luffy-bodies-v4.png", 288, 320],
    ["luffy-base-body-v4.png", 64, 320],
  ] as const)("%s conserva el contrato de capas", (name, width, height) => {
    const png = readFileSync(`public/assets/characters/${name}`);
    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);
  });
});

describe("arte de jefes", () => {
  it.each(bossOrder)("%s tiene cuatro poses en un PNG compacto", (id) => {
    const path = `public/${bossArt(id).poses}`,
      png = readFileSync(path);
    expect(png.readUInt32BE(16)).toBe(id === "imu" ? 1536 : 1024);
    expect(png.readUInt32BE(20)).toBe(128);
    expect(statSync(path).size).toBeLessThan(100_000);
  });
});

describe("recursos del puerto y escenarios v7", () => {
  it.each([
    ["world/terrain-v7.png", 512, 256],
    ["world/props-v7.png", 512, 384],
    ["icons/icons-v7.png", 384, 384],
    ...bossOrder.map((id) => [bossArt(id).walk.slice(7), 1152, 256]),
  ])(
    "%s publica un atlas completo con contrato estable",
    (path, width, height) => {
      const png = readFileSync(`public/assets/${path}`);
      expect(png.readUInt32BE(16)).toBe(width);
      expect(png.readUInt32BE(20)).toBe(height);
      expect(png.length).toBeLessThan(500_000);
    },
  );
});
