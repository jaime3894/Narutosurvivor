import { describe, expect, it } from "vitest";
import { createRun, step } from "../src/game/simulation";
import { emptyPreparation } from "../src/data/training";
import { terrainTime } from "../src/data/missions";
import { voyageStage } from "../src/data/voyage";
import { worldProps, propsInArea } from "../src/data/terrain";
import { blocked, freePosition } from "../src/game/terrain";
import { enterRift, finishArena, updateRifts } from "../src/game/rifts";
import { updateDirector } from "../src/game/director";
import { updateImu, updateImuZones } from "../src/game/imu";
import { updateField } from "../src/game/field";
import { updateEnemyRole, updateShots } from "../src/game/enemy-roles";
import { hitEnemy } from "../src/game/rules";
import {
  newProfile,
  parseProfile,
  purchaseTraining,
  settleRun,
} from "../src/game/profile";
import { sustainedDamage, updateTechniques } from "../src/game/techniques";
import { upgradeComparison } from "../src/game/upgrade-preview";
import type { Enemy } from "../src/game/types";
const idle = { x: 0, y: 0, dash: false };
const survival = () =>
  createRun(3894, "luffy", [], emptyPreparation(), "survival");
function foe(): Enemy {
  return {
    id: 99,
    position: { x: 1300, y: 900 },
    velocity: { x: 0, y: 0 },
    health: { current: 100, maximum: 100 },
    kind: "sailor",
    radius: 12,
    flash: 0,
  };
}
describe("supervivencia continua", () => {
  it("cambia cada cuatro minutos, repite zonas y nunca gana a los cinco", () => {
    expect(
      [0, 239.99, 240, 479.99, 480, 720].map(
        (t) => voyageStage(t, "survival").id,
      ),
    ).toEqual(["coast", "coast", "harbor", "harbor", "desert", "sky"]);
    const run = survival();
    run.elapsed = 299.99;
    run.spawnTimer = 100;
    run.nextRiftTime = 1e6;
    step(run, idle, 0.02);
    expect(run.elapsed).toBeGreaterThan(300);
    expect(run.status).toBe("playing");
  });
  it("un cambio libera jugador, botín y compañeros sin perder técnicas", () => {
    const run = survival();
    run.elapsed = 239.99;
    run.spawnTimer = 100;
    const p = worldProps(120).find((p) => p.radius > 0)!;
    run.player.position = { x: p.x, y: p.centerY };
    run.weapons[0]!.timer = 2;
    step(run, idle, 0.02);
    expect(
      blocked(run.player.position, 12, terrainTime(run.elapsed, run.mission)),
    ).toBe(false);
    expect(run.weapons[0]!.id).toBe("pistol");
    expect(run.ranks["weapon:pistol"]).toBe(1);
  });
  it("conserva pausas y dispara un Buster Call en cada ciclo", () => {
    const run = survival();
    run.elapsed = 210;
    updateDirector(run, 0.02);
    expect(run.director.buster).not.toBeNull();
    run.status = "paused";
    const before = run.director.buster!.remaining;
    step(run, idle, 0.02);
    expect(run.director.buster!.remaining).toBe(before);
    run.status = "playing";
    run.elapsed = 239.99;
    step(run, idle, 0.02);
    expect(run.director.busterStarted).toBe(false);
    run.elapsed = 450;
    updateDirector(run, 0.02);
    expect(run.director.busterStarted).toBe(true);
  });
  it("genera Imu una sola vez al minuto 60, espera una arena activa y sigue después de vencer", () => {
    const run = survival();
    run.elapsed = 3599.99;
    updateDirector(run, 0.001);
    expect(run.rift).toBeNull();
    run.elapsed = 3600;
    updateDirector(run, 0.01);
    expect(run.rift?.boss).toBe("imu");
    updateRifts(run, 5.01);
    expect(run.arena).not.toBeNull();
    expect(run.enemies[0]!.health.maximum).toBe(180000);
    updateDirector(run, 0.01);
    expect(run.rift).toBeNull();
    finishArena(run, true);
    expect(run.director.imuDefeated).toBe(true);
    expect(run.berries).toBe(1000);
    expect(run.status).toBe("bossReward");
    run.status = "playing";
    run.bossRewards = [];
    step(run, idle, 0.02);
    expect(run.status).toBe("playing");
    expect(run.elapsed).toBeGreaterThan(3600);
    expect(run.rift?.boss).not.toBe("imu");
  });
  it("Imu cambia de repertorio con la vida; sus zonas avisan antes de dañar y dejan espacio", () => {
    const run = survival();
    run.elapsed = 3600;
    updateDirector(run, 0.01);
    run.rift!.position = { ...run.player.position };
    expect(enterRift(run)).toBe(true);
    const enemy = run.enemies[0]!,
      s = enemy.boss!;
    s.time = 0;
    updateImu(run, enemy, 0.01);
    expect(s.imuPhase).toBe(1);
    expect(s.move).toBe("shadowFan");
    enemy.health.current = enemy.health.maximum * 0.6;
    s.phase = "approach";
    s.cycle = 0;
    s.time = 0;
    updateImu(run, enemy, 0.01);
    expect(s.imuPhase).toBe(2);
    expect(s.move).toBe("eclipse");
    expect(run.imuZones).toHaveLength(1);
    run.player.invulnerable = 0;
    const hp = run.player.health.current;
    updateImuZones(run, 0.1);
    expect(run.player.health.current).toBe(hp);
    for (const z of run.imuZones) z.warning = 0;
    updateImuZones(run, 0.01);
    expect(run.player.health.current).toBeLessThan(hp);
    run.imuZones = [];
    enemy.health.current = enemy.health.maximum * 0.25;
    s.phase = "approach";
    s.cycle = 0;
    s.time = 0;
    updateImu(run, enemy, 0.01);
    expect(s.imuPhase).toBe(3);
    expect(s.move).toBe("throneRay");
    expect(run.imuZones).toHaveLength(3);
    expect(run.imuZones.every((z) => z.end && z.warning >= 1.4)).toBe(true);
    const before = enemy.health.current;
    hitEnemy(run, enemy, 100, { x: 0, y: 0 }, false);
    expect(enemy.health.current).toBeLessThan(before);
  });
  it("recorre sesenta minutos de eventos sin saltarse límites ni repetir Imu", () => {
    const run = survival();
    let count = 0;
    for (let t = 0; t <= 3900; t++) {
      run.elapsed = t;
      updateDirector(run, 1);
      if (run.rift?.boss === "imu") {
        count++;
        run.rift.position = { ...run.player.position };
        enterRift(run);
        finishArena(run, true);
        run.status = "playing";
      }
      expect(run.director.buster?.shells.length ?? 0).toBeLessThanOrEqual(8);
    }
    expect(count).toBe(1);
    expect(run.director.imuDefeated).toBe(true);
  });
});
describe("mundo e interacciones", () => {
  it("el índice espacial coincide con el mapa y las posiciones son irregulares", () => {
    const props = worldProps(0),
      sample = propsInArea(0, 1100, 800, 300, 300);
    for (const p of props.filter(
      (p) => p.x >= 1100 && p.x <= 1400 && p.y >= 800 && p.y <= 1100,
    ))
      expect(sample).toContain(p);
    expect(
      new Set(props.slice(0, 100).map((p) => Math.round(p.x) % 210)).size,
    ).toBeGreaterThan(50);
    const palm = props.find((p) => p.id === 0)!;
    expect(blocked({ x: palm.x, y: palm.y - palm.size * 0.65 }, 2, 0)).toBe(
      false,
    );
  });
  it("rompe un barril con ataques reales incluso sin enemigos y deja botín", () => {
    const run = survival();
    run.fieldTimer = 100;
    run.fieldObjects = [
      {
        id: 91,
        kind: "barrel",
        position: { x: 1250, y: 900 },
        health: 42,
        progress: 0,
        remaining: 80,
      },
    ];
    for (let i = 0; i < 240; i++) {
      updateTechniques(run, 1 / 60);
      updateField(run, 1 / 60);
    }
    expect(run.fieldObjects).toHaveLength(0);
    expect(run.drops.some((d) => d.kind === "coin")).toBe(true);
  });
  it("los suministros no se gastan a vida completa y la caja necesita tres segundos cerca", () => {
    const run = survival();
    run.fieldTimer = 100;
    const object = {
      id: 91,
      position: { ...run.player.position },
      health: 42,
      progress: 0,
      remaining: 80,
    };
    run.fieldObjects = [{ ...object, kind: "supplies" }];
    updateField(run, 0.1);
    expect(run.fieldObjects).toHaveLength(1);
    run.player.health.current = 50;
    updateField(run, 0.1);
    expect(run.player.health.current).toBe(80);
    expect(run.fieldObjects).toHaveLength(0);
    run.fieldObjects = [{ ...object, kind: "vault" }];
    updateField(run, 2.9);
    expect(run.chests).toHaveLength(0);
    updateField(run, 0.11);
    expect(run.chests).toHaveLength(1);
    expect(run.berries).toBe(20);
  });
  it("el fusilero avisa y fija puntería, las piedras detienen sus balas", () => {
    const run = survival(),
      enemy = foe();
    enemy.role = "rifle";
    enemy.roleTimer = 0;
    updateEnemyRole(run, enemy, 0.01);
    expect(enemy.warning).toBe(0.9);
    expect(run.shots).toHaveLength(0);
    const aim = { ...enemy.aim! };
    run.player.position.y += 50;
    updateEnemyRole(run, enemy, 1);
    expect(run.shots).toHaveLength(1);
    expect(enemy.aim).toEqual(aim);
    const rock = worldProps(0).find((p) => p.id === 3)!,
      center = {
        x: rock.footprint.reduce((s, v) => s + v.x, 0) / rock.footprint.length,
        y: rock.footprint.reduce((s, v) => s + v.y, 0) / rock.footprint.length,
      };
    run.shots = [
      { position: center, velocity: { x: 10, y: 0 }, life: 2, damage: 12 },
    ];
    updateShots(run, 0.02);
    expect(run.shots).toHaveLength(0);
  });
  it("el escudo protege el frente pero no la espalda; el oficial cura sin superar el máximo", () => {
    const run = survival(),
      enemy = foe();
    enemy.role = "shield";
    enemy.aim = { x: -1, y: 0 };
    run.enemies = [enemy];
    hitEnemy(run, enemy, 10, { x: 0, y: 0 }, false);
    expect(enemy.health.current).toBe(94);
    run.player.position.x = 1400;
    hitEnemy(run, enemy, 10, { x: 0, y: 0 }, false);
    expect(enemy.health.current).toBe(84);
    const officer = foe();
    officer.id = 100;
    officer.role = "officer";
    officer.roleTimer = 0;
    run.enemies.push(officer);
    updateEnemyRole(run, officer, 0.01);
    expect(enemy.health.current).toBe(96);
  });
  it("resuelve posiciones de llegada en las tres zonas sin bloquear objetivos", () => {
    for (const t of [0, 120, 240])
      for (const p of worldProps(t).slice(0, 50)) {
        const pos = freePosition({ x: p.x, y: p.centerY }, 25, t);
        expect(blocked(pos, 25, t)).toBe(false);
      }
  });
});
describe("cuenta y lectura de mejoras", () => {
  it("migra sumando las diez bolsas antiguas una sola vez y conserva los entrenamientos", () => {
    const fresh = newProfile();
    const sailors = Object.fromEntries(
      Object.entries(fresh.sailors).map(([id, s]) => [
        id,
        { ...s, berries: id === "zoro" ? 500 : 120 },
      ]),
    );
    sailors.luffy!.levels.health = 3;
    const migrated = parseProfile({
      version: 1,
      selected: "zoro",
      sailors,
      receipts: ["old"],
    });
    expect(migrated.berries).toBe(1580);
    expect(migrated.sailors.luffy.levels.health).toBe(3);
    expect(parseProfile(migrated)).toEqual(migrated);
    const before = migrated.berries;
    expect(purchaseTraining(migrated, "zoro", "health")).toBe(true);
    expect(migrated.berries).toBe(before - 60);
    expect(migrated.sailors.luffy.levels.health).toBe(3);
  });
  it("abona una sola vez en la cuenta, permite comprar para otro capitán y conserva tiempos largos", () => {
    const p = newProfile(),
      run = survival();
    run.elapsed = 3661;
    run.berries = 50;
    const reward = settleRun(p, run);
    expect(p.berries).toBe(120 + reward);
    expect(settleRun(p, run)).toBe(0);
    expect(purchaseTraining(p, "zoro", "damage")).toBe(true);
    expect(parseProfile(p).sailors.luffy.bestTime).toBe(3661);
  });
  it("las comparaciones de cartas son puras y muestran la transformación en el rango 5", () => {
    const run = survival();
    run.ranks["weapon:pistol"] = 4;
    const before = JSON.stringify(run);
    expect(upgradeComparison(run, "weapon:pistol")).toContain("→");
    expect(upgradeComparison(run, "vitality")).toContain("100 → 120");
    expect(JSON.stringify(run)).toBe(before);
  });
});

describe("carga de una partida larga", () => {
  it("mantiene los límites con 150 enemigos, roles y botín al minuto 59", () => {
    const run = survival();
    run.elapsed = 3540;
    run.nextRiftTime = 1e6;
    run.nextRiftKills = 1e6;
    run.fieldTimer = 1e6;
    // Escena sintética de estrés, no prueba de supervivencia ni balance.
    run.player.health = { current: 100000, maximum: 100000 };
    for (let i = 0; i < 150; i++) {
      const enemy = foe(),
        a = (i * Math.PI * 2) / 150;
      enemy.id = i + 100;
      enemy.position = freePosition(
        { x: 1200 + Math.cos(a) * 300, y: 900 + Math.sin(a) * 300 },
        12,
        terrainTime(run.elapsed, run.mission),
      );
      enemy.health = { current: 100000, maximum: 100000 };
      enemy.role = (["rifle", "shield", "officer"] as const)[i % 3]!;
      run.enemies.push(enemy);
    }
    run.nextId = 1000;
    const start = performance.now();
    for (let frame = 0; frame < 600; frame++) {
      step(
        run,
        {
          x: Math.cos(frame / 90),
          y: Math.sin(frame / 90),
          dash: frame % 160 === 0,
        },
        1 / 60,
      );
      expect(run.enemies.length).toBeLessThanOrEqual(150);
      expect(run.shots.length).toBeLessThanOrEqual(45);
      expect(run.effects.length).toBeLessThanOrEqual(180);
      expect(run.drops.length).toBeLessThanOrEqual(240);
      expect(
        Number.isFinite(run.player.position.x + run.player.position.y),
      ).toBe(true);
    }
    expect(run.status).toBe("playing");
    console.info(
      `Estrés: 600 pasos con 150 enemigos en ${(performance.now() - start).toFixed(0)} ms`,
    );
  });
});

it("las recompensas de reserva respetan los máximos de atributos, sin vida infinita tras muchos jefes", async () => {
  const { boons } = await import("../src/data/rifts");
  const { offerBossRewards, chooseBossReward } = await import(
    "../src/game/bonds"
  );
  const run = survival();
  for (const id of Object.keys(boons) as (keyof typeof boons)[])
    run.boons[id] = boons[id].max;
  const hp = run.player.health.maximum;
  for (let i = 0; i < 100; i++) {
    offerBossRewards(run);
    expect(run.bossRewards).toHaveLength(3);
    expect(run.bossRewards.every((r) => r.kind === "supply")).toBe(true);
    expect(chooseBossReward(run, i % 3)).toBe(true);
  }
  expect(run.player.health.maximum).toBe(hp);
  expect(run.boons.health).toBe(boons.health.max);
  expect(run.berries).toBeGreaterThan(0);
});

it("la resistencia de Imu se ajusta a una build extrema al entrar y queda fija durante el duelo", () => {
  const run = survival();
  run.weapons = [
    { id: "pistol", timer: 0, evolved: false },
    { id: "gatling", timer: 0, evolved: false },
    { id: "bazooka", timer: 0, evolved: false },
    { id: "whip", timer: 0, evolved: false },
  ];
  run.linkedWeapons = ["pistol", "gatling", "bazooka", "whip"];
  for (const slot of run.weapons) run.ranks[`weapon:${slot.id}`] = 5;
  run.form = 2;
  run.formUnlocked = 2;
  run.ranks.power = 5;
  run.ranks.multishot = 5;
  run.ranks.tempo = 5;
  run.boons.damage = 20;
  run.boons.tempo = 8;
  run.elapsed = 3600;
  updateDirector(run, 0.01);
  run.rift!.position = { ...run.player.position };
  const expected = Math.max(180000, sustainedDamage(run) * 60);
  enterRift(run);
  expect(run.enemies[0]!.health.maximum).toBeCloseTo(expected);
  expect(expected).toBeGreaterThan(180000);
  run.boons.damage = 0;
  expect(run.enemies[0]!.health.maximum).toBeCloseTo(expected);
});
