import { islands } from "../src/data/islands";
import { emptyPreparation } from "../src/data/training";
import { describe, expect, it } from "vitest";
import { combat } from "../src/data/combat";
import { worldProps } from "../src/data/terrain";
import {
  blocked,
  freePosition,
  moveOnTerrain,
  steerAround,
} from "../src/game/terrain";
import { AutoQuality, parsePreferences } from "../src/core/preferences";
import { createRun, step } from "../src/game/simulation";
import { spawnChest } from "../src/game/progression";
import { spawnRift } from "../src/game/rifts";

describe("terreno sólido compartido", () => {
  it("multiplica por treinta y seis la superficie y distribuye objetos pequeños en toda la isla", () => {
    expect(combat.world.width * combat.world.height).toBe(4800 * 3600 * 36);
    const props = worldProps(0);
    expect(props.length).toBeGreaterThan(300);
    expect(props.some((p) => p.x > 4000 && p.y > 3000)).toBe(true);
    expect(props.every((p) => p.size >= 76 && p.size <= 94)).toBe(true);
    expect(blocked({ x: 1200, y: 900 }, 12, 0)).toBe(false);
  });
  it.each([0, 120, 240, 360, 480, 600, 720, 840, 960])(
    "impide atravesar sólidos incluso embistiendo en etapa %s",
    (time) => {
      for (const p of worldProps(time)
        .filter((p) => p.radius > 0)
        .slice(0, 30)) {
        const center = {
          x: p.footprint.reduce((sum, v) => sum + v.x, 0) / p.footprint.length,
          y: p.footprint.reduce((sum, v) => sum + v.y, 0) / p.footprint.length,
        };
        const position = { x: center.x - 80, y: center.y };
        // Un polígono permite deslizarse por sus bordes: comprueba cada paso, no una pared circular ficticia.
        let stopped = false;
        for (let i = 0; i < 30; i++) {
          const before = position.x;
          moveOnTerrain(position, { x: 5, y: 0 }, 12, time);
          expect(blocked(position, 12, time)).toBe(false);
          if (position.x - before < 4) stopped = true;
        }
        expect(stopped).toBe(true);
        const free = freePosition({ x: p.x, y: p.centerY }, 20, time);
        expect(blocked(free, 20, time)).toBe(false);
      }
    },
  );
  it("permite bordear una roca y aplica el choque al jugador real", () => {
    const p = worldProps(0).find((p) => p.slot === 3)!;
    const centerY =
      p.footprint.reduce((sum, v) => sum + v.y, 0) / p.footprint.length;
    const run = createRun(1);
    run.spawnTimer = 100;
    run.player.position = { x: p.x - p.radius - 12 - 8, y: centerY };
    for (let i = 0; i < 8; i++)
      step(run, { x: 1, y: 0, dash: i === 0 }, 1 / 60);
    expect(run.player.position.x).toBeLessThan(p.x);
    const goal = { x: p.x + 100, y: centerY };
    for (let i = 0; i < 180; i++) {
      const direction = steerAround(run.player.position, goal, 12, 0);
      moveOnTerrain(
        run.player.position,
        { x: direction.x * 3, y: direction.y * 3 },
        12,
        0,
      );
    }
    expect(run.player.position.x).toBeGreaterThan(p.x + 50);
  });
  it.each([0, 120, 240, 360, 480, 600, 720, 840, 960])(
    "cofres y grietas nunca nacen dentro de sólidos (%s)",
    (time) => {
      const island = Object.values(islands).find((i) => i.terrain === time);
      const run = createRun(
        1,
        "luffy",
        [],
        emptyPreparation(),
        time >= 360 ? island!.id : "voyage",
      );
      run.elapsed = time;
      const p = worldProps(time).find((p) => p.radius > 0)!;
      spawnChest(run, { x: p.x, y: p.centerY });
      expect(blocked(run.chests[0]!.position, 20, time)).toBe(false);
      spawnRift(run);
      expect(blocked(run.rift!.position, 26, time)).toBe(false);
    },
  );
});
it("el cambio de tramo conserva accesibles los cofres y libera al jugador", () => {
  const run = createRun(1);
  const prop = worldProps(0).find((p) => p.slot === 1)!;
  run.elapsed = 119.999;
  run.spawnTimer = 100;
  run.player.position = { x: prop.x, y: prop.centerY };
  const other = worldProps(0).filter((p) => p.slot === 1)[1]!;
  spawnChest(run, { x: other.x, y: other.centerY });
  step(run, { x: 0, y: 0, dash: false }, 1 / 60);
  expect(blocked(run.player.position, run.player.radius, run.elapsed)).toBe(
    false,
  );
  expect(blocked(run.chests[0]!.position, 20, run.elapsed)).toBe(false);
});
describe("preferencias y calidad automática", () => {
  it("rechaza valores persistidos inválidos y conserva opciones válidas", () => {
    expect(
      parsePreferences({ quality: "ultra", zoom: 0, damageNumbers: "false" }),
    ).toEqual(parsePreferences(null));
    expect(
      parsePreferences({ quality: "low", zoom: 0.8, calm: true }),
    ).toMatchObject({ quality: "low", zoom: 0.8, calm: true });
  });
  it("baja tras carga sostenida, recupera con margen y limita móvil a media", () => {
    const monitor = new AutoQuality();
    for (let i = 0; i < 130; i++) monitor.sample(1 / 30);
    expect(monitor.level).toBe(1);
    for (let i = 0; i < 600; i++) monitor.sample(1 / 60);
    expect(monitor.level).toBe(2);
    const mobile = new AutoQuality(true);
    for (let i = 0; i < 700; i++) mobile.sample(1 / 60);
    expect(mobile.level).toBe(1);
  });
});
