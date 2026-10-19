import { describe, expect, it } from "vitest";
import { characters, activeSynergies, validateCrew } from "../src/data/crew";
import { weaponById } from "../src/data/content";
import { createRun, step, stats, togglePause } from "../src/game/simulation";
import {
  casterPosition,
  changeForm,
  tryRevive,
  updateCrew,
} from "../src/game/crew";
import { hitEnemy } from "../src/game/rules";
import type { Enemy, Run } from "../src/game/types";
function target(run: Run): Enemy {
  return {
    id: run.nextId++,
    kind: "brute",
    position: { x: 1500, y: 900 },
    velocity: { x: 0, y: 0 },
    health: { current: 500, maximum: 500 },
    radius: 19,
    flash: 0,
  };
}
describe("tripulación y formas", () => {
  it.each(characters)(
    "$id tiene tres estilos, arma propia y transformaciones sin curación gratuita",
    (character) => {
      const run = createRun(17, character.id);
      expect(weaponById(run.weapons[0]!.id).owner).toBe(character.id);
      expect(character.forms.map((form) => form.level)).toEqual([1, 4, 8]);
      expect(changeForm(run, 1)).toBe(false);
      run.level = 4;
      run.player.health.current = 43;
      expect(changeForm(run, 1)).toBe(true);
      expect(changeForm(run, 2)).toBe(false);
      expect(stats(run).damage).toBeGreaterThan(0);
      expect(changeForm(run, 0)).toBe(true);
      run.level = 8;
      run.formCooldown = 0;
      expect(changeForm(run, 2)).toBe(true);
      expect(run.player.health.current).toBe(43);
      expect(stats(run).damage).toBeGreaterThan(24);
      updateCrew(run, 7);
      expect(run.energy).toBe(0);
      expect(run.form).toBe(0);
      updateCrew(run, 1);
      expect(run.energy).toBeGreaterThan(0);
    },
  );
  it("pausar congela energía, apoyo y transformaciones", () => {
    const run = createRun(1, "luffy", ["chopper"]);
    run.level = 8;
    changeForm(run, 2);
    const energy = run.energy,
      position = { ...run.nakama[0]!.position };
    togglePause(run);
    for (let i = 0; i < 60; i++) step(run, { x: 1, y: 0, dash: false }, 1 / 60);
    expect(run.energy).toBe(energy);
    expect(run.nakama[0]!.position).toEqual(position);
    expect(changeForm(run, 0)).toBe(false);
  });
  it("rechaza compañeros duplicados, al capitán y más de dos", () => {
    expect(() =>
      validateCrew({ captain: "luffy", nakama: ["luffy"] }),
    ).toThrow();
    expect(() =>
      validateCrew({ captain: "luffy", nakama: ["zoro", "zoro"] }),
    ).toThrow();
    expect(() =>
      validateCrew({ captain: "luffy", nakama: ["zoro", "sanji", "nami"] }),
    ).toThrow();
  });
  it("activa parejas de los tres miembros y conserva las armas del capitán", () => {
    const run = createRun(1, "luffy", ["zoro", "sanji"]);
    expect(activeSynergies("luffy", ["zoro", "sanji"])).toHaveLength(3);
    expect(stats(run).damage).toBeCloseTo(24 * 1.1 * 1.05);
    const foe = target(run);
    foe.position = { x: 1230, y: 900 };
    run.enemies.push(foe);
    const casters = new Set<string>();
    for (let i = 0; i < 30; i++) {
      step(run, { x: 1, y: 0, dash: false }, 1 / 60);
      for (const attack of run.attacks) casters.add(attack.caster);
    }
    expect(run.weapons.map((item) => weaponById(item.id).owner)).toEqual([
      "luffy",
    ]);
    expect(casters.has("sanji")).toBe(true);
    expect(casters.has("zoro")).toBe(true);
    expect(casterPosition(run, "zoro")).toEqual(run.nakama[0]!.position);
    expect(casterPosition(run, "zoro")).not.toEqual(run.player.position);
  });
  it("Chopper y Sanji curan como apoyos sin superar el máximo", () => {
    const run = createRun(1, "luffy", ["chopper", "sanji"]);
    run.player.health.current = 50;
    for (const nakama of run.nakama) nakama.supportTimer = 0;
    updateCrew(run, 0.1);
    expect(run.player.health.current).toBe(60);
    run.player.health.current = 99;
    for (const nakama of run.nakama) nakama.supportTimer = 0;
    updateCrew(run, 0.1);
    expect(run.player.health.current).toBe(100);
  });
  it("aplica los diez innatos y distingue la fuente de cada ataque", () => {
    expect(stats(createRun(1, "luffy")).range).toBeCloseTo(1.1);
    const zoro = createRun(1, "zoro"),
      foe = target(zoro);
    hitEnemy(zoro, foe, 100, { x: 0, y: 0 }, false);
    expect(foe.health.current).toBeCloseTo(385);
    expect(stats(createRun(1, "nami")).currency).toBe(1.25);
    const usopp = createRun(1, "usopp");
    usopp.random = () => 0.1;
    const far = target(usopp);
    hitEnemy(usopp, far, 100, { x: 0, y: 0 });
    expect(far.health.current).toBe(330);
    const sanji = createRun(1, "sanji");
    sanji.kills = 19;
    sanji.player.health.current = 40;
    hitEnemy(sanji, target(sanji), 1000, { x: 0, y: 0 }, false);
    expect(sanji.player.health.current).toBe(48);
    expect(stats(createRun(1, "chopper")).regen).toBeCloseTo(0.3);
    const robin = createRun(1, "robin");
    robin.kills = 14;
    hitEnemy(robin, target(robin), 1000, { x: 0, y: 0 }, false);
    expect(robin.xp).toBe(3);
    expect(stats(createRun(1, "franky")).armor).toBe(2);
    const brook = createRun(1, "brook");
    brook.player.health.current = 0;
    expect(tryRevive(brook)).toBe(true);
    expect(brook.player.health.current).toBe(40);
    brook.player.health.current = 0;
    expect(tryRevive(brook)).toBe(false);
    expect(stats(createRun(1, "jinbe")).dashCooldown).toBeCloseTo(2.6 * 0.8);
  });
  it("el frío y el fuego pertenecen a sus personajes y formas", () => {
    const run = createRun(1, "luffy", ["brook", "sanji"]);
    const frozen = target(run);
    hitEnemy(run, frozen, 1, { x: 0, y: 0 }, false, {
      character: "brook",
      form: 1,
      origin: casterPosition(run, "brook"),
    });
    expect(frozen.slow).toBeGreaterThan(0);
    expect(frozen.burn).toBeUndefined();
    const burned = target(run);
    hitEnemy(run, burned, 1, { x: 0, y: 0 }, false, {
      character: "sanji",
      form: 2,
      origin: casterPosition(run, "sanji"),
    });
    expect(burned.burn).toBeGreaterThan(0);
    expect(burned.slow).toBeUndefined();
    const rubber = target(run);
    hitEnemy(run, rubber, 1, { x: 0, y: 0 }, false, {
      character: "luffy",
      form: 2,
      origin: run.player.position,
    });
    expect(rubber.burn).toBeUndefined();
    expect(rubber.slow).toBeUndefined();
  });
});
