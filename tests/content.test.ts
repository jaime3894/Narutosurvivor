import { describe, expect, it } from "vitest";
import {
  characterNames,
  contentLimits,
  passives,
  pickupDefinitions,
  upgrades,
  weaponById,
  weaponKey,
  weapons,
  type CharacterId,
  type PassiveId,
  type WeaponId,
} from "../src/data/content";
import { createRun, step, stats } from "../src/game/simulation";
import {
  eligibleUpgrades,
  grantUpgrade,
  evolutionCandidates,
  openChest,
  closeChest,
  spawnChest,
} from "../src/game/progression";
import { affinities, hitEnemy } from "../src/game/rules";
import { animationProgress, updateTechniques } from "../src/game/techniques";
import type { Run, Enemy } from "../src/game/types";
const idle = { x: 0, y: 0, dash: false };
function target(run: Run, x = 1300, y = 900, hp = 10000): Enemy {
  const enemy: Enemy = {
    id: run.nextId++,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    health: { current: hp, maximum: hp },
    kind: "brute",
    radius: 19,
    flash: 0,
  };
  run.enemies.push(enemy);
  return enemy;
}
function equipOnly(id: WeaponId): Run {
  const run = createRun(3894, weaponById(id).owner);
  for (const definition of weapons) run.ranks[weaponKey(definition.id)] = 0;
  run.weapons = [{ id, timer: 0, evolved: false }];
  run.ranks[weaponKey(id)] = 1;
  run.spawnTimer = 1000;
  run.chestTimer = 1000;
  return run;
}
function prepare(id: WeaponId): Run {
  const run = equipOnly(id);
  for (let i = 0; i < 4; i++)
    expect(grantUpgrade(run, weaponKey(id))).toBe(true);
  const requirement = weaponById(id).evolution.passive;
  for (let i = 0; i < contentLimits.passiveEvolutionRank; i++)
    expect(grantUpgrade(run, requirement)).toBe(true);
  run.elapsed = 61;
  return run;
}
describe("catálogo y compatibilidad", () => {
  it("contiene exactamente 18 técnicas y 14 pasivos únicos y cubre a los diez personajes", () => {
    expect(weapons).toHaveLength(18);
    expect(passives).toHaveLength(14);
    expect(new Set(weapons.map((item) => item.id)).size).toBe(18);
    expect(new Set(passives.map((item) => item.id)).size).toBe(14);
    expect(new Set(weapons.map((item) => item.owner)).size).toBe(10);
    expect(new Set(upgrades.map((item) => item.id)).size).toBe(32);
    for (const definition of weapons) {
      expect(
        passives.some((item) => item.id === definition.evolution.passive),
      ).toBe(true);
      expect(definition.damage).toBeGreaterThan(0);
      expect(definition.cooldown).toBeGreaterThan(definition.windup);
    }
  });
  it.each(Object.keys(characterNames) as CharacterId[])(
    "%s nunca recibe técnicas de otro personaje",
    (character) => {
      const run = createRun(42, character);
      for (const definition of weapons) {
        expect(eligibleUpgrades(run).includes(weaponKey(definition.id))).toBe(
          definition.owner === character,
        );
        if (definition.owner !== character)
          expect(grantUpgrade(run, weaponKey(definition.id))).toBe(false);
      }
      expect(
        run.weapons.every((slot) => weaponById(slot.id).owner === character),
      ).toBe(true);
    },
  );
  it("respeta cuatro técnicas y seis pasivos; permite mejorar los que ya tienes", () => {
    const run = createRun(1);
    for (const id of ["gatling", "bazooka", "whip"] as const)
      expect(grantUpgrade(run, weaponKey(id))).toBe(true);
    expect(grantUpgrade(run, "weapon:balloon")).toBe(false);
    for (const id of [
      "power",
      "tempo",
      "multishot",
      "stride",
      "magnet",
      "vitality",
    ] as const)
      expect(grantUpgrade(run, id)).toBe(true);
    expect(grantUpgrade(run, "armor")).toBe(false);
    expect(grantUpgrade(run, "power")).toBe(true);
    expect(grantUpgrade(run, "weapon:pistol")).toBe(true);
  });
  it("activa afinidades por técnicas y pasivos sin conceder elementos nuevos", () => {
    const run = createRun(2);
    expect(affinities(run).rubber).toBe(1);
    grantUpgrade(run, "tempo");
    expect(affinities(run).rubber).toBe(2);
    grantUpgrade(run, "reach");
    expect(affinities(run).rubber).toBe(3);
    grantUpgrade(run, "crit");
    expect(
      run.weapons.every((slot) => weaponById(slot.id).affinity === "rubber"),
    ).toBe(true);
  });
});
describe("ejecución real de cada técnica", () => {
  it.each(weapons.map((item) => item.id))(
    "%s anticipa antes de hacer daño y ejecuta todos sus impactos",
    (id) => {
      const run = equipOnly(id);
      const victim = target(run);
      updateTechniques(run, 1 / 60);
      const attack = run.attacks[0];
      if (!attack) throw new Error("No se inició la técnica");
      expect(animationProgress(attack).phase).toBe("windup");
      expect(victim.health.current).toBe(victim.health.maximum);
      for (let i = 0; i < 60; i++) updateTechniques(run, 1 / 60);
      expect(run.damageDealt).toBeGreaterThan(0);
      expect(victim.health.current).toBeLessThan(victim.health.maximum);
      if (weaponById(id).owner === "luffy")
        expect(run.projectiles).toHaveLength(0);
    },
  );
  it("un golpe simple no repite daño cada fotograma y no salta hacia otro objetivo", () => {
    const run = equipOnly("pistol");
    const victim = target(run);
    for (let i = 0; i < 30; i++) updateTechniques(run, 1 / 60);
    expect(run.damageDealt).toBe(28);
    expect(run.kills).toBe(0);
    expect(victim.health.current).toBe(9972);
    const a = run.attacks[0];
    if (a) expect(a.strikes.filter((item) => item.fired)).toHaveLength(1);
  });
  it("el golpe de goma atraviesa objetivos alineados y la ráfaga tiene impactos separados", () => {
    const run = equipOnly("pistol");
    target(run);
    target(run, 1340);
    for (let i = 0; i < 30; i++) updateTechniques(run, 1 / 60);
    expect(run.damageDealt).toBe(56);
    const barrage = equipOnly("gatling");
    target(barrage);
    for (let i = 0; i < 50; i++) updateTechniques(barrage, 1 / 60);
    expect(barrage.damageDealt).toBeGreaterThan(13 * 2);
  });
});
describe("cofres y evoluciones", () => {
  it.each(weapons.map((item) => item.id))(
    "evoluciona %s solo con técnica 5, pasivo 2, tiempo y cofre",
    (id) => {
      const run = prepare(id);
      expect(evolutionCandidates(run)).toEqual([id]);
      run.elapsed = 59;
      expect(evolutionCandidates(run)).toEqual([]);
      run.elapsed = 61;
      run.ranks[weaponById(id).evolution.passive] = 1;
      expect(evolutionCandidates(run)).toEqual([]);
      run.ranks[weaponById(id).evolution.passive] = 2;
      const chest = spawnChest(run);
      if (!chest) throw new Error("No hay cofre");
      expect(openChest(run, chest.id)).toBe(true);
      expect(run.status).toBe("chest");
      expect(run.weapons[0]?.evolved).toBe(true);
      expect(run.chestRewards[0]?.title).toBe(weaponById(id).evolution.title);
      expect(run.evolvedCount).toBe(1);
      expect(openChest(run, chest.id)).toBe(false);
      closeChest(run);
      expect(evolutionCandidates(run)).toEqual([]);
      const normal = equipOnly(id),
        evolved = run;
      target(normal);
      target(evolved);
      for (let i = 0; i < 50; i++) {
        updateTechniques(normal, 1 / 60);
        updateTechniques(evolved, 1 / 60);
      }
      expect(evolved.damageDealt).toBeGreaterThan(normal.damageDealt);
    },
  );
  it("consume cofres una sola vez y congela el mundo hasta continuar", () => {
    const run = createRun(1);
    const chest = spawnChest(run);
    if (!chest) throw new Error("No hay cofre");
    openChest(run, chest.id);
    const state = JSON.stringify(run);
    step(run, idle, 1 / 60);
    expect(JSON.stringify(run)).toBe(state);
    expect(run.openedChests).toBe(1);
    expect(run.chestRewards.length).toBeGreaterThan(0);
    closeChest(run);
    expect(run.status).toBe("playing");
    expect(openChest(run, chest.id)).toBe(false);
  });
  it("la suerte mejora el tamaño del premio y el cofre sin mejoras concede berries", () => {
    const a = createRun(1),
      b = createRun(1);
    a.random = () => 0.08;
    b.random = () => 0.08;
    b.ranks.luck = 5;
    const ca = spawnChest(a),
      cb = spawnChest(b);
    if (!ca || !cb) throw new Error("Cofre ausente");
    openChest(a, ca.id);
    openChest(b, cb.id);
    expect(a.chestRewards).toHaveLength(3);
    expect(b.chestRewards).toHaveLength(5);
    const full = prepare("pistol");
    for (const item of upgrades) full.ranks[item.id] = item.max;
    const cc = spawnChest(full);
    if (!cc) throw new Error("Cofre ausente");
    openChest(full, cc.id);
    expect(
      full.chestRewards.some((reward) => reward.kind === "evolution"),
    ).toBe(true);
    expect(
      full.chestRewards.filter((reward) => reward.kind === "berries").length +
        1,
    ).toBe(full.chestRewards.length);
  });
});
describe("pasivos y recogibles", () => {
  it.each([
    "power",
    "tempo",
    "multishot",
    "stride",
    "magnet",
    "armor",
    "crit",
    "reach",
    "duration",
    "spirit",
  ] as PassiveId[])("%s modifica estadísticas efectivas", (id) => {
    const run = createRun(1);
    const before = stats(run);
    grantUpgrade(run, id);
    expect(stats(run)).not.toEqual(before);
  });
  it("regenera vida, reduce daño y aplica críticos con efectos de impacto", () => {
    const run = createRun(2);
    run.player.health.current = 50;
    grantUpgrade(run, "regen");
    run.spawnTimer = 1000;
    for (let i = 0; i < 60; i++) step(run, idle, 1 / 60);
    expect(run.player.health.current).toBeCloseTo(50.35);
    run.ranks.armor = 5;
    const foe = target(run, 1200, 900);
    foe.kind = "runner";
    step(run, idle, 1 / 60);
    expect(run.damageTaken).toBe(1);
    run.ranks.crit = 5;
    run.random = () => 0;
    const victim = target(run, 1400);
    hitEnemy(run, victim, 10, { x: 0, y: 0 });
    expect(victim.health.current).toBe(9983);
    expect(run.effects.some((item) => item.kind === "critical")).toBe(true);
    expect(run.hitStop).toBeGreaterThan(0);
  });
  it("cada recogible aplica su efecto y desaparece; imán, bomba y berries tienen reglas reales", () => {
    for (const kind of Object.keys(
      pickupDefinitions,
    ) as (keyof typeof pickupDefinitions)[]) {
      const run = createRun(1);
      run.spawnTimer = 1000;
      run.player.health.current = 50;
      const foe = target(run, 1450, 900, 100);
      run.drops.push({
        position: { x: 1700, y: 900 },
        value: 2,
        kind: "xp",
        attracted: false,
      });
      run.drops.push({
        position: { ...run.player.position },
        value:
          kind === "heal" ? 18 : kind === "coin" ? 25 : kind === "xp" ? 2 : 1,
        kind,
        attracted: false,
      });
      if (kind === "coin") run.ranks.greed = 2;
      step(run, idle, 1 / 60);
      if (kind === "xp") expect(run.xp).toBe(2);
      if (kind === "heal") expect(run.player.health.current).toBe(68);
      if (kind === "coin") expect(run.berries).toBe(35);
      if (kind === "vacuum")
        expect(
          run.drops.find((drop) => drop.position.x > 1600)?.attracted,
        ).toBe(true);
      if (kind === "bomb") {
        expect(foe.health.current).toBeLessThanOrEqual(0);
        expect(run.effects.some((item) => item.kind === "explosion")).toBe(
          true,
        );
      }
      if (kind === "haste") {
        expect(run.haste).toBe(8);
        expect(stats(run).speed).toBeGreaterThan(215);
      }
      expect(
        run.drops.filter(
          (drop) => drop.kind === kind && drop.position.x === 1200,
        ),
      ).toHaveLength(0);
    }
  });
});
