import { grantUpgrade } from "../src/game/progression";
import { describe, it, expect } from "vitest";
import {
  newProfile,
  parseProfile,
  purchaseTraining,
  prepareSailor,
  settleRun,
  setStarter,
  setVeto,
} from "../src/game/profile";
import { trainingIds, trainingCost } from "../src/data/training";
import { characterNames, weapons, weaponKey } from "../src/data/content";
import { createRun, stats, step } from "../src/game/simulation";
import {
  eligibleUpgrades,
  offerUpgrades,
  rerollUpgrades,
} from "../src/game/progression";
import { spawnRift, enterRift, updateBoss } from "../src/game/rifts";
import {
  bondCandidates,
  bondLimit,
  chooseBossReward,
  linkTechnique,
  offerBossRewards,
} from "../src/game/bonds";
import { bossMoves, bossRepertoire } from "../src/data/boss-moves";
import { voyageStage } from "../src/data/voyage";
import { bosses, type BossId } from "../src/data/rifts";
import type { CharacterId } from "../src/data/content";
describe("entrenamiento por tripulante", () => {
  it("compra una vez al precio mostrado sin tocar otra bolsa, bloquea saldo y rangos insuficientes", () => {
    const p = newProfile(),
      zoro = structuredClone(p.sailors.zoro);
    expect(trainingCost("health", 0)).toBe(60);
    expect(purchaseTraining(p, "luffy", "health")).toBe(true);
    expect(p.sailors.luffy.berries).toBe(60);
    expect(p.sailors.luffy.levels.health).toBe(1);
    expect(p.sailors.zoro).toEqual(zoro);
    expect(purchaseTraining(p, "luffy", "damage")).toBe(false);
    p.sailors.luffy.berries = 1e7;
    for (let i = 0; i < 9; i++)
      expect(purchaseTraining(p, "luffy", "health")).toBe(true);
    const wallet = p.sailors.luffy.berries;
    expect(purchaseTraining(p, "luffy", "health")).toBe(false);
    expect(p.sailors.luffy.berries).toBe(wallet);
  });
  it("aplica cada estadística comprada en el motor sin alterar personajes de apoyo", () => {
    const p = newProfile();
    for (const id of trainingIds) p.sailors.luffy.levels[id] = 1;
    const base = createRun(1),
      trained = createRun(1, "luffy", [], prepareSailor(p, "luffy"));
    expect(trained.player.health.maximum).toBe(108);
    expect(trained.rerollsLeft).toBe(1);
    expect(trained.weapons).toHaveLength(2);
    const before = stats(base),
      after = stats(trained);
    expect(after.damage).toBeGreaterThan(before.damage);
    expect(after.speed).toBeGreaterThan(before.speed);
    expect(after.attackPeriod).toBeLessThan(before.attackPeriod);
    expect(after.armor).toBeGreaterThan(before.armor);
    expect(after.regen).toBeGreaterThan(before.regen);
    expect(after.magnet).toBeGreaterThan(before.magnet);
    expect(after.criticalChance).toBeGreaterThan(before.criticalChance);
    expect(after.currency).toBeGreaterThan(before.currency);
    expect(stats(trained, "zoro").damage).toBe(stats(base, "zoro").damage);
    trained.drops.push({
      position: { ...trained.player.position },
      kind: "xp",
      value: 2,
      attracted: false,
    });
    step(trained, { x: 0, y: 0, dash: false }, 1 / 60);
    expect(trained.xp).toBe(2.1);
  });
  it("el ataque inicial y el veto solo admiten técnicas propias, no la inicial ni duplicados", () => {
    const p = newProfile();
    expect(setStarter(p, "luffy", "gatling")).toBe(false);
    p.sailors.luffy.levels.starter = 1;
    p.sailors.luffy.levels.veto = 1;
    expect(setStarter(p, "luffy", "onigiri")).toBe(false);
    expect(setStarter(p, "luffy", "gatling")).toBe(true);
    expect(setVeto(p, "luffy", ["gatling"])).toBe(false);
    expect(setVeto(p, "luffy", ["onigiri"])).toBe(false);
    expect(setVeto(p, "luffy", ["whip", "whip"])).toBe(false);
    expect(setVeto(p, "luffy", ["whip"])).toBe(true);
    const run = createRun(1, "luffy", [], prepareSailor(p, "luffy"));
    expect(run.activeWeapon).toBe("gatling");
    expect(eligibleUpgrades(run)).not.toContain("weapon:whip");
    expect(run.ranks[weaponKey("gatling")]).toBe(1);
    expect(purchaseTraining(p, "chopper", "repertoire")).toBe(false);
  });
  it("cambiar cartas consume una carga y conserva nivel y XP, sin volver a cobrar una subida", () => {
    const run = createRun(8);
    run.rerollsLeft = 1;
    run.xp = 50;
    offerUpgrades(run);
    const choices = [...run.choices],
      level = run.level,
      xp = run.xp;
    expect(rerollUpgrades(run)).toBe(true);
    expect(run.rerollsLeft).toBe(0);
    expect(run.level).toBe(level);
    expect(run.xp).toBe(xp);
    expect(run.choices.some((id) => !choices.includes(id))).toBe(true);
    expect(new Set(run.choices).size).toBe(3);
    expect(rerollUpgrades(run)).toBe(false);
  });
  it("liquida el botín una sola vez, en el personaje usado, y restaura un guardado equivalente", () => {
    const p = newProfile(),
      run = createRun(8, "zoro");
    run.status = "won";
    run.elapsed = 300;
    run.kills = 120;
    run.berries = 25;
    run.bossesDefeated = 2;
    const reward = settleRun(p, run);
    expect(reward).toBe(255);
    expect(p.sailors.zoro.berries).toBe(375);
    expect(p.sailors.luffy.berries).toBe(120);
    expect(p.sailors.zoro.runs).toBe(1);
    expect(settleRun(p, run)).toBe(0);
    expect(parseProfile(JSON.parse(JSON.stringify(p)) as unknown)).toEqual(p);
  });
  it("sanea rangos, saldo, técnicas ajenas y datos no finitos del guardado", () => {
    const raw = newProfile();
    raw.sailors.luffy.berries = -90;
    raw.sailors.luffy.levels.health = 999;
    raw.sailors.luffy.levels.starter = 1;
    raw.sailors.luffy.starter = "onigiri";
    raw.sailors.luffy.levels.veto = 2;
    raw.sailors.luffy.banned = ["pistol", "onigiri", "whip"];
    const parsed = parseProfile(raw);
    expect(parsed.sailors.luffy.berries).toBe(0);
    expect(parsed.sailors.luffy.levels.health).toBe(10);
    expect(parsed.sailors.luffy.starter).toBeUndefined();
    expect(parsed.sailors.luffy.banned).toEqual(["whip"]);
    expect(() => parseProfile({ version: 999 })).toThrow();
  });
});
describe("vínculos exclusivos", () => {
  it.each(Object.keys(characterNames) as CharacterId[])(
    "%s nunca puede recibir la técnica de otro capitán, tampoco mediante selección manipulada",
    (id) => {
      const run = createRun(1, id);
      const other = weapons.find(
        (w) => w.owner === id && w.id !== run.activeWeapon,
      );
      if (other) expect(grantUpgrade(run, weaponKey(other.id))).toBe(true);
      offerBossRewards(run);
      const candidates = bondCandidates(run);
      expect(
        candidates.every((w) => weapons.find((d) => d.id === w)?.owner === id),
      ).toBe(true);
      expect(bondLimit(run)).toBe(
        Math.min(4, weapons.filter((w) => w.owner === id).length),
      );
      const foreign = weapons.find((w) => w.owner !== id)!;
      run.status = "bond";
      const snapshot = JSON.stringify(run);
      expect(linkTechnique(run, foreign.id)).toBe(false);
      expect(JSON.stringify(run)).toBe(snapshot);
      if (weapons.filter((w) => w.owner === id).length === 1) {
        offerBossRewards(run);
        expect(run.bossRewards.every((r) => r.kind === "boon")).toBe(true);
      } else {
        run.status = "playing";
        offerBossRewards(run);
        expect(chooseBossReward(run, 0)).toBe(true);
        expect(linkTechnique(run, candidates[0]!)).toBe(true);
        expect(run.assists).toHaveLength(0);
      }
    },
  );
});
describe("escenarios y jefes reforzados", () => {
  it("cambia exactamente a 2:00 y 4:00, aumentando vida, velocidad, daño y presión", () => {
    expect(voyageStage(119.99).id).toBe("coast");
    expect(voyageStage(120).id).toBe("harbor");
    expect(voyageStage(239.99).id).toBe("harbor");
    const stage = voyageStage(240);
    expect(stage.id).toBe("desert");
    expect(stage.health).toBeGreaterThan(1);
    expect(stage.speed).toBeGreaterThan(1);
    expect(stage.damage).toBeGreaterThan(1);
    expect(stage.spawn).toBeLessThan(1);
    const run = createRun(8);
    run.elapsed = 239.99;
    run.spawnTimer = 0;
    run.random = () => 0;
    step(run, { x: 0, y: 0, dash: false }, 1 / 60);
    expect(run.enemies[0]?.elite).toBe(true);
    expect(run.enemies[0]!.health.maximum).toBeGreaterThan(200);
    expect(run.notice).toContain("Alabasta");
  });
  it.each(Object.keys(bosses) as BossId[])(
    "%s recorre sus tres ataques y tiene poses de marcha reales en el estado del motor",
    (id) => {
      const run = createRun(8);
      spawnRift(run);
      run.rift!.boss = id;
      enterRift(run);
      const enemy = run.enemies[0]!,
        state = enemy.boss!;
      expect(enemy.health.maximum).toBeGreaterThanOrEqual(1100);
      const moves = new Set<string>();
      for (let cycle = 0; cycle < 3; cycle++) {
        state.phase = "approach";
        state.time = 0;
        updateBoss(run, enemy, 0.01);
        expect(state.phase).toBe("windup");
        moves.add(state.move);
        const direction = { ...state.direction };
        run.player.position.x += 30;
        updateBoss(run, enemy, bossMoves[state.move].windup + 0.01);
        expect(state.phase).toBe("attack");
        expect(state.direction).toEqual(direction);
        updateBoss(run, enemy, bossMoves[state.move].active + 0.01);
        expect(state.phase).toBe("recover");
        updateBoss(run, enemy, 2);
      }
      expect([...moves]).toEqual([...bossRepertoire[id]]);
      state.phase = "approach";
      state.time = 1;
      run.player.position = { x: enemy.position.x + 200, y: enemy.position.y };
      const before = state.walkTime;
      updateBoss(run, enemy, 0.05);
      expect(state.moving).toBe(true);
      expect(state.walkTime).toBeGreaterThan(before);
    },
  );
});
