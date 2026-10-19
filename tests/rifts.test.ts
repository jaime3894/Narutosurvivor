import { describe, expect, it } from "vitest";
import { createRun, step, stats, togglePause } from "../src/game/simulation";
import {
  spawnRift,
  enterRift,
  finishArena,
  updateRifts,
  updateBoss,
} from "../src/game/rifts";
import {
  activeTechniques,
  chooseBossReward,
  linkTechnique,
  bondCandidates,
  selectTechnique,
} from "../src/game/bonds";
import {
  chooseChestReward,
  openChest,
  spawnChest,
  grantUpgrade,
} from "../src/game/progression";
import { updateTechniques } from "../src/game/techniques";
import { casterPosition, updateCrew } from "../src/game/crew";
import { bosses, riftRules, type BossId } from "../src/data/rifts";
import { weaponKey, weaponById } from "../src/data/content";
import type { Run } from "../src/game/types";
const idle = { x: 0, y: 0, dash: false };
function arena(run: Run, kind: BossId = "buggy"): void {
  expect(spawnRift(run)).toBe(true);
  run.rift!.boss = kind;
  expect(enterRift(run)).toBe(true);
}
function victory(run: Run): void {
  arena(run);
  run.enemies[0]!.health.current = 0;
  step(run, idle, 1 / 60);
  expect(run.status).toBe("bossReward");
}
function bond(run: Run, id: Parameters<typeof linkTechnique>[1]): void {
  const index = run.bossRewards.findIndex((r) => r.id === "bond");
  expect(chooseBossReward(run, index)).toBe(true);
  expect(linkTechnique(run, id)).toBe(true);
}
describe("cofres de elección", () => {
  it.each([0, 1, 2])(
    "aplica solo la tarjeta %i, rechaza índices y doble concesión",
    (index) => {
      const run = createRun(42);
      const ranks = { ...run.ranks };
      const chest = spawnChest(run)!;
      expect(openChest(run, chest.id)).toBe(true);
      expect(run.chestRewards).toHaveLength(3);
      expect(run.ranks).toEqual(ranks);
      expect(new Set(run.chestRewards.map((r) => r.id ?? r.kind)).size).toBe(3);
      expect(chooseChestReward(run, -1)).toBe(false);
      expect(chooseChestReward(run, 0.5)).toBe(false);
      const chosen = run.chestRewards[index]!;
      expect(chooseChestReward(run, index)).toBe(true);
      if (chosen.id) expect(run.ranks[chosen.id]).toBe(ranks[chosen.id] + 1);
      expect(
        Object.keys(ranks).filter(
          (id) =>
            run.ranks[id as keyof typeof ranks] !==
            ranks[id as keyof typeof ranks],
        ),
      ).toHaveLength(1);
      expect(chooseChestReward(run, index)).toBe(false);
    },
  );
  it("suerte aumenta berries sin concederlas antes de elegir", () => {
    const a = createRun(1),
      b = createRun(1);
    for (const run of [a, b]) {
      for (const key of Object.keys(run.ranks))
        run.ranks[key as keyof typeof run.ranks] = 5;
      run.weapons[0]!.evolved = true;
    }
    a.ranks.luck = 0;
    b.ranks.luck = 5;
    for (const run of [a, b]) {
      openChest(run, spawnChest(run)!.id);
      expect(run.berries).toBe(0);
      expect(run.chestRewards).toHaveLength(3);
    }
    expect(
      b.chestRewards.find((r) => r.kind === "berries")!.amount,
    ).toBeGreaterThan(
      a.chestRewards.find((r) => r.kind === "berries")!.amount!,
    );
  });
});
describe("grieta y arena", () => {
  it.each(["time", "kills"])(
    "aparece por umbral de %s sin exigir ambos",
    (trigger) => {
      const run = createRun(1);
      if (trigger === "time") run.elapsed = 35;
      else run.kills = 80;
      updateRifts(run, 1 / 60);
      expect(run.rift).not.toBeNull();
      expect(spawnRift(run)).toBe(false);
      const rift = run.rift;
      togglePause(run);
      step(run, idle, 1 / 60);
      expect(run.rift).toEqual(rift);
    },
  );
  it("caduca y programa otra sin acumular portales ni aparecer fuera de la costa", () => {
    const run = createRun(1);
    run.player.position = { x: 80, y: 80 };
    spawnRift(run);
    expect(run.rift!.position.x).toBeGreaterThanOrEqual(120);
    expect(run.rift!.position.y).toBeGreaterThanOrEqual(120);
    run.rift!.remaining = 0.001;
    updateRifts(run, 1 / 60);
    expect(run.rift).toBeNull();
    expect(run.nextRiftTime).toBe(run.elapsed + 45);
    expect(run.nextRiftKills).toBe(run.kills + 120);
    updateRifts(run, 1 / 60);
    expect(run.rift).toBeNull();
  });
  it("aísla la arena y restaura costa, cofres, posición y reloj sin conceder premio al agotar tiempo", () => {
    const run = createRun(7);
    run.spawnTimer = 999;
    spawnChest(run, { x: 1450, y: 900 });
    run.drops.push({
      position: { x: 1400, y: 900 },
      value: 3,
      kind: "xp",
      attracted: false,
    });
    const coast = {
      position: { ...run.player.position },
      chests: run.chests,
      drops: run.drops,
      elapsed: run.elapsed,
      chestTimer: run.chestTimer,
    };
    arena(run);
    expect(run.chests).toHaveLength(0);
    expect(run.drops).toHaveLength(0);
    for (let i = 0; i < 60; i++) step(run, { x: 1, y: 0, dash: false }, 1 / 60);
    expect(run.elapsed).toBe(coast.elapsed);
    expect(run.chestTimer).toBe(coast.chestTimer);
    expect(run.enemies).toHaveLength(1);
    expect(
      Math.hypot(
        run.player.position.x - run.arena!.center.x,
        run.player.position.y - run.arena!.center.y,
      ),
    ).toBeLessThanOrEqual(riftRules.arenaRadius);
    run.arena!.remaining = 0.001;
    step(run, idle, 1 / 60);
    expect(run.arena).toBeNull();
    expect(run.chests).toEqual(coast.chests);
    expect(run.drops).toEqual(coast.drops);
    expect(run.player.position).toEqual(coast.position);
    expect(run.status).toBe("playing");
    expect(run.bossesDefeated).toBe(0);
  });
  it.each(Object.keys(bosses) as BossId[])(
    "%s anticipa, ejecuta su patrón y sobrevive a una embestida",
    (kind) => {
      const run = createRun(1);
      arena(run, kind);
      const boss = run.enemies[0]!;
      run.player.position = { x: boss.position.x, y: boss.position.y + 30 };
      boss.boss!.time = 0;
      updateBoss(run, boss, 1 / 60);
      expect(boss.boss!.phase).toBe("windup");
      const aim = { ...boss.boss!.direction };
      const life = run.player.health.current;
      run.player.position.x += 20;
      updateBoss(run, boss, bosses[kind].windup + 0.01);
      expect(boss.boss!.phase).toBe("attack");
      expect(boss.boss!.direction).toEqual(aim);
      if (kind === "buggy") expect(run.hazards).toHaveLength(7);
      if (kind === "kuro") {
        const before = { ...boss.position };
        updateBoss(run, boss, 0.1);
        expect(boss.position).not.toEqual(before);
      }
      if (kind === "arlong") {
        run.player.invulnerable = 0;
        boss.boss!.phase = "windup";
        boss.boss!.time = 0;
        updateBoss(run, boss, 1 / 60);
        expect(run.player.health.current).toBeLessThan(life);
      }
      run.player.position = { ...boss.position };
      step(run, { ...idle, dash: true }, 1 / 60);
      expect(boss.health.current).toBeGreaterThan(0);
    },
  );
  it("los proyectiles dañan una vez y desaparecen al volver de la arena", () => {
    const run = createRun(1);
    arena(run);
    run.player.invulnerable = 0;
    run.hazards.push({
      id: 999,
      position: { ...run.player.position },
      velocity: { x: 0, y: 0 },
      radius: 7,
      damage: 14,
      life: 1,
      kind: "knife",
    });
    updateRifts(run, 1 / 60);
    expect(run.player.health.current).toBe(86);
    expect(run.hazards).toHaveLength(0);
    finishArena(run, false);
    expect(run.hazards).toHaveLength(0);
  });
});
describe("recompensas y vínculos", () => {
  it("cada victoria concede una sola decisión, pausa el mundo y los atributos afectan a estadísticas reales", () => {
    const run = createRun(1);
    victory(run);
    expect(run.bossesDefeated).toBe(1);
    expect(run.bossRewards).toHaveLength(3);
    const snapshot = JSON.stringify(run);
    step(run, idle, 1 / 60);
    expect(JSON.stringify(run)).toBe(snapshot);
    expect(chooseBossReward(run, 9)).toBe(false);
    const i = run.bossRewards.findIndex((r) => r.kind === "boon"),
      reward = run.bossRewards[i]!;
    const before = stats(run),
      health = run.player.health.maximum;
    expect(chooseBossReward(run, i)).toBe(true);
    expect(chooseBossReward(run, i)).toBe(false);
    expect(run.bossesDefeated).toBe(1);
    if (reward.id === "health")
      expect(run.player.health.maximum).toBe(health + 25);
    else expect(stats(run)).not.toEqual(before);
  });
  it("vincula 2, 3 y 4 técnicas; conserva propietarios, elenco y permite cambiar al ataque suelto", () => {
    const run = createRun(42, "luffy", ["chopper"]);
    for (const [index, id] of (
      ["onigiri", "sharkbrick", "thunder"] as const
    ).entries()) {
      victory(run);
      bond(run, id);
      expect(run.linkedWeapons).toHaveLength(index + 2);
      expect(activeTechniques(run)).toEqual(run.linkedWeapons);
      expect(run.weapons.length).toBe(index + 2);
      expect(run.nakama).toHaveLength(1);
      expect(grantUpgrade(run, weaponKey(id))).toBe(true);
    }
    expect(run.assists.map((n) => n.character)).toEqual([
      "zoro",
      "jinbe",
      "nami",
    ]);
    run.enemies = [
      {
        id: 777,
        kind: "brute",
        position: { x: 1240, y: 920 },
        velocity: { x: 0, y: 0 },
        health: { current: 99999, maximum: 99999 },
        radius: 19,
        flash: 0,
      },
    ];
    updateCrew(run, 0.1);
    updateTechniques(run, 1 / 60);
    const own = run.attacks.filter((a) => run.linkedWeapons.includes(a.weapon));
    expect(own).toHaveLength(4);
    for (const a of own) {
      expect(a.caster).toBe(weaponById(a.weapon).owner);
      if (a.caster !== run.character)
        expect(casterPosition(run, a.caster)).not.toEqual(run.player.position);
    }
    expect(new Set(run.weapons.map((w) => w.timer)).size).toBe(1);
    victory(run);
    expect(run.bossRewards.every((r) => r.kind === "boon")).toBe(true);
    expect(bondCandidates(run)).toHaveLength(0);
    expect(linkTechnique(run, "gatling")).toBe(false);
  });
  it("rechaza doble vínculo y ofrece técnicas aprendidas con los cuatro huecos llenos", () => {
    const run = createRun(1);
    grantUpgrade(run, "weapon:gatling");
    grantUpgrade(run, "weapon:whip");
    grantUpgrade(run, "weapon:bazooka");
    victory(run);
    expect(bondCandidates(run)).not.toContain("thunder");
    bond(run, "gatling");
    expect(linkTechnique(run, "whip")).toBe(false);
    expect(selectTechnique(run, "whip")).toBe(true);
    expect(activeTechniques(run)).toEqual(["whip"]);
    victory(run);
    expect(chooseBossReward(run, 0)).toBe(true);
    expect(bondCandidates(run)).toContain("whip");
    expect(linkTechnique(run, "whip")).toBe(true);
    expect(activeTechniques(run)).toHaveLength(3);
  });
});
