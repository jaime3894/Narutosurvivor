import { steerAround } from "../src/game/terrain";
import {
  chooseBossReward,
  linkTechnique,
  bondCandidates,
  selectTechnique,
} from "../src/game/bonds";
import { grantUpgrade, closeChest } from "../src/game/progression";
import { passives, weaponKey } from "../src/data/content";
import { describe, expect, it } from "vitest";
import {
  combat,
  enemyTypes,
  xpForLevel,
  type UpgradeId,
} from "../src/data/combat";
import {
  chooseUpgrade,
  createRun,
  offerUpgrades,
  stats,
  step,
  togglePause,
} from "../src/game/simulation";
import type { Enemy, Input, Run } from "../src/game/types";

const idle: Input = { x: 0, y: 0, dash: false };
function advance(run: Run, seconds: number, input = idle): void {
  for (let i = 0; i < seconds * 60; i++) step(run, input, 1 / 60);
}
function enemy(run: Run, x = 1300, y = 900): Enemy {
  const foe: Enemy = {
    id: run.nextId++,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    health: { current: 28, maximum: 28 },
    kind: "sailor",
    radius: 12,
    flash: 0,
  };
  run.enemies.push(foe);
  return foe;
}
describe("combate y controles", () => {
  it("normaliza diagonales y respeta la costa", () => {
    const a = createRun(1),
      b = createRun(1);
    advance(a, 1, { x: 1, y: 0, dash: false });
    advance(b, 1, { x: 1, y: 1, dash: false });
    expect(a.distance).toBeCloseTo(b.distance);
    a.player.position.y = combat.world.shore + a.player.radius;
    a.spawnTimer = 100;
    advance(a, 25, { x: 1, y: 0, dash: false });
    expect(a.player.position.x).toBe(
      combat.world.width - combat.world.shore - a.player.radius,
    );
  });
  it("golpea automáticamente tras la preparación y deja experiencia", () => {
    const run = createRun(1);
    const target = enemy(run);
    advance(run, 1.2);
    expect(target.health.current).toBeLessThanOrEqual(0);
    expect(run.kills).toBeGreaterThan(0);
    expect(run.damageDealt).toBeGreaterThanOrEqual(28);
    expect(run.drops.some((drop) => drop.kind === "xp") || run.xp > 0).toBe(
      true,
    );
  });
  it("aplica invulnerabilidad temporal después del contacto", () => {
    const run = createRun(2);
    enemy(run, 1200, 900);
    step(run, idle, 1 / 60);
    const health = run.player.health.current;
    expect(health).toBe(90);
    enemy(run, run.player.position.x, run.player.position.y);
    step(run, idle, 1 / 60);
    expect(run.player.health.current).toBe(health);
  });
  it("la embestida derrota, protege y no permite ignorar el enfriamiento", () => {
    const run = createRun(3);
    enemy(run, 1200, 915);
    step(run, { x: 0, y: 1, dash: true }, 1 / 60);
    expect(run.kills).toBe(1);
    expect(run.player.health.current).toBe(100);
    const remaining = run.player.dashCooldown;
    step(run, { x: 0, y: 1, dash: true }, 1 / 60);
    expect(run.player.dashCooldown).toBeLessThan(remaining);
    expect(run.player.dashCooldown).toBeGreaterThan(2);
  });
  it("pausa y selección congelan toda la simulación", () => {
    const run = createRun(4);
    togglePause(run);
    const before = JSON.stringify(run);
    advance(run, 10, { x: 1, y: 1, dash: true });
    expect(JSON.stringify(run)).toBe(before);
    togglePause(run);
    run.xp = xpForLevel(run.level);
    offerUpgrades(run);
    const selecting = JSON.stringify(run);
    advance(run, 10);
    togglePause(run);
    expect(JSON.stringify(run)).toBe(selecting);
  });
  it("no genera enemigos encima del jugador al estar junto a la costa", () => {
    for (let seed = 0; seed < 32; seed++) {
      const run = createRun(seed);
      run.player.position = { x: combat.world.shore, y: combat.world.shore };
      run.spawnTimer = 0;
      step(run, idle, 1 / 60);
      expect(run.enemies).toHaveLength(1);
      const target = run.enemies[0];
      if (!target) throw new Error("No apareció el enemigo");
      expect(
        Math.hypot(
          target.position.x - run.player.position.x,
          target.position.y - run.player.position.y,
        ),
      ).toBeGreaterThan(540);
    }
  });
  it("los alimentos curan sin superar la vida máxima", () => {
    const run = createRun(11);
    run.player.health.current = 90;
    run.drops.push({
      position: { ...run.player.position },
      value: 18,
      kind: "heal",
      attracted: false,
    });
    step(run, idle, 1 / 60);
    expect(run.player.health.current).toBe(100);
    expect(run.drops).toHaveLength(0);
  });
  it("rechaza deltas inválidos", () => {
    for (const dt of [0, -1, Infinity, NaN, 1])
      expect(() => step(createRun(), idle, dt)).toThrow(RangeError);
  });
});
describe("experiencia, mejoras y fin de partida", () => {
  it("atrae cristales, sube de nivel y ofrece tres opciones diferentes", () => {
    const run = createRun(5);
    run.drops.push({
      position: { x: 1230, y: 900 },
      kind: "xp",
      value: 12,
      attracted: false,
    });
    advance(run, 1);
    expect(run.level).toBe(2);
    expect(run.xp).toBe(2);
    expect(run.status).toBe("upgrade");
    expect(new Set(run.choices).size).toBe(3);
    const choice = run.choices[0];
    expect(choice).toBeDefined();
    if (!choice) throw new Error("No se ofrecieron mejoras");
    const previous = run.ranks[choice];
    expect(chooseUpgrade(run, choice)).toBe(true);
    expect(run.ranks[choice]).toBe(previous + 1);
    expect(run.status).toBe("playing");
    expect(chooseUpgrade(run, choice)).toBe(false);
  });
  it("no ofrece rangos agotados y procesa experiencia acumulada", () => {
    const run = createRun(6);
    for (const id of ["gatling", "bazooka", "whip"] as const)
      grantUpgrade(run, weaponKey(id));
    for (const slot of run.weapons) run.ranks[weaponKey(slot.id)] = 5;
    for (const id of [
      "power",
      "tempo",
      "multishot",
      "stride",
      "magnet",
      "vitality",
    ] as const) {
      const definition = passives.find((item) => item.id === id);
      if (definition) run.ranks[id] = definition.max;
    }
    run.ranks.vitality = 1;
    run.player.health.maximum = 120;
    run.xp = 100;
    offerUpgrades(run);
    expect(run.choices).toEqual(["vitality"]);
    run.player.health.current = 50;
    chooseUpgrade(run, "vitality");
    expect(run.player.health).toEqual({ current: 85, maximum: 140 });
    expect(run.level).toBe(3);
    expect(run.status).toBe("upgrade");
    expect(run.choices).toEqual(["vitality"]);
  });
  it("aplica mejoras de combate sin mutar las definiciones", () => {
    const run = createRun(7);
    const base = stats(run);
    run.ranks.power = 2;
    run.ranks.tempo = 1;
    run.ranks.multishot = 2;
    expect(stats(run).damage).toBe(base.damage * 1.5);
    expect(stats(run).attackPeriod).toBeLessThan(base.attackPeriod);
    expect(stats(run).projectiles).toBe(3);
    expect(combat.player.damage).toBe(24);
  });
  it("termina en derrota o victoria y congela el resultado", () => {
    const lost = createRun(8);
    lost.player.health.current = 1;
    enemy(lost, 1200, 900);
    step(lost, idle, 1 / 60);
    expect(lost.status).toBe("lost");
    const time = lost.elapsed;
    advance(lost, 2);
    expect(lost.elapsed).toBe(time);
    const won = createRun(9);
    won.elapsed = combat.duration - 1 / 120;
    step(won, idle, 1 / 60);
    expect(won.status).toBe("won");
    expect(won.elapsed).toBe(300);
  });
  it("conserva experiencia sin superar el límite de recogibles", () => {
    const run = createRun(10);
    run.drops = Array.from({ length: combat.maximumDrops }, (_, i) => ({
      position: { x: i + 100, y: 100 },
      value: 2,
      kind: "xp",
      attracted: false,
    }));
    enemy(run, 1200, 915);
    step(run, { x: 0, y: 1, dash: true }, 1 / 60);
    expect(run.drops).toHaveLength(combat.maximumDrops);
    expect(run.drops.reduce((total, drop) => total + drop.value, 0)).toBe(
      combat.maximumDrops * 2 + enemyTypes.sailor.xp,
    );
  });
});

/** Piloto de validación: busca botín, evita contactos y elige daño/multidisparo. No altera salud ni reglas. */
function pilot(run: Run): Input {
  const player = run.player.position;
  const healing =
    run.player.health.current < run.player.health.maximum - 25
      ? run.drops.filter((drop) => drop.kind === "heal")
      : [];
  const nearestDrop = [...(healing.length > 0 ? healing : run.drops)].sort(
    (a, b) =>
      Math.hypot(a.position.x - player.x, a.position.y - player.y) -
      Math.hypot(b.position.x - player.x, b.position.y - player.y),
  )[0];
  const phase = run.elapsed * 0.065;
  const arenaTime = run.arena ? 75 - run.arena.remaining : 0;
  const arenaGoal = run.arena
    ? {
        x: run.arena.center.x + Math.cos(arenaTime * 0.9) * 195,
        y: run.arena.center.y + Math.sin(arenaTime * 0.9) * 195,
      }
    : undefined;
  const goal = arenaGoal ??
    run.rift?.position ??
    nearestDrop?.position ?? {
      x: 1200 + Math.cos(phase) * 370,
      y: 900 + Math.sin(phase) * 320,
    };
  const direct = run.arena
    ? { x: goal.x - player.x, y: goal.y - player.y }
    : steerAround(player, goal, run.player.radius, run.elapsed);
  const dx = direct.x,
    dy = direct.y;
  const distance = Math.hypot(dx, dy) || 1;
  let x = dx / distance,
    y = dy / distance;
  let close = 0;
  for (const foe of run.enemies) {
    const ex = player.x - foe.position.x,
      ey = player.y - foe.position.y;
    const d = Math.hypot(ex, ey) || 1;
    if (d < 120) {
      const weight = (120 - d) / 45;
      x += (ex / d) * weight;
      y += (ey / d) * weight;
    }
    if (d < 70) close++;
  }
  return {
    x,
    y,
    dash:
      close >= 2 ||
      run.hazards.some(
        (h) =>
          Math.hypot(h.position.x - player.x, h.position.y - player.y) < 65,
      ),
  };
}
function select(run: Run): void {
  const order: UpgradeId[] = [
    "power",
    "multishot",
    "tempo",
    "weapon:pistol",
    "weapon:gatling",
    "weapon:whip",
    "weapon:bazooka",
    "vitality",
    "magnet",
    "stride",
  ];
  const id =
    run.player.health.current < 80 && run.choices.includes("vitality")
      ? "vitality"
      : (order.find((item) => run.choices.includes(item)) ?? run.choices[0]);
  if (!id || !chooseUpgrade(run, id)) throw new Error("Mejora inválida");
  if (!run.linkedWeapons.length && run.weapons.some((w) => w.id === "gatling"))
    selectTechnique(run, "gatling");
}
describe("partida representativa", () => {
  it("simula cinco minutos con enemigos, bajas y progresión usando las reglas reales", () => {
    const results: string[] = [];
    for (const seed of [3894, 42, 123]) {
      const run = createRun(seed);
      for (
        let frame = 0;
        frame < 72000 && !["won", "lost"].includes(run.status);
        frame++
      ) {
        while (
          run.status === "upgrade" ||
          run.status === "chest" ||
          run.status === "bossReward"
        ) {
          if (run.status === "bossReward") {
            const link = run.bossRewards.findIndex((r) => r.kind === "bond");
            if (link >= 0) {
              chooseBossReward(run, link);
              const options = bondCandidates(run);
              const id =
                (["gatling", "pistol", "whip", "bazooka"] as const).find((w) =>
                  options.includes(w),
                ) ?? options[0];
              if (!id || !linkTechnique(run, id))
                throw new Error("Vínculo inválido");
            } else
              chooseBossReward(
                run,
                run.bossRewards.findIndex((r) => r.kind === "boon"),
              );
          } else if (run.status === "chest") closeChest(run);
          else select(run);
        }
        step(run, pilot(run), 1 / 60);
        expect(run.enemies.length).toBeLessThanOrEqual(combat.maximumEnemies);
        expect(run.drops.length).toBeLessThanOrEqual(combat.maximumDrops);
        expect(run.effects.length).toBeLessThanOrEqual(180);
        expect(Number.isFinite(run.player.position.x)).toBe(true);
      }
      results.push(
        `${seed}: ${run.status}, ${run.elapsed.toFixed(1)}s, ${run.kills} bajas, nivel ${run.level}, ${run.player.health.current} HP, arena=${run.arena?.bossId}, boss=${run.enemies.find((e) => e.boss)?.boss?.kind}`,
      );
      expect(run.status, results.join("\n")).toBe("won");
      expect(run.kills).toBeGreaterThan(150);
      expect(run.level).toBeGreaterThan(7);
    }
    console.info(results.join("\n"));
  }, 15000);
});
