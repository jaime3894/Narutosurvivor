import { describe, it, expect } from "vitest";
import {
  missions,
  busterRules,
  waveAt,
  terrainTime,
} from "../src/data/missions";
import { createRun, step, togglePause } from "../src/game/simulation";
import { emptyPreparation } from "../src/data/training";
import { updateDirector } from "../src/game/director";
import {
  enterRift,
  finishArena,
  updateRifts,
  updateBoss,
} from "../src/game/rifts";
import { chooseBossReward } from "../src/game/bonds";
import { voyageStage } from "../src/data/voyage";
import { bossMoves } from "../src/data/boss-moves";
const idle = { x: 0, y: 0, dash: false };
describe("misiones y director por datos", () => {
  it.each(Object.values(missions))(
    "$name tiene oleadas válidas, minijefe, jefe final y bombardeo",
    (mission) => {
      expect(mission.waves[0]!.at).toBe(0);
      expect(mission.encounters.at(-1)?.role).toBe("final");
      expect(mission.encounters.at(-1)?.at).toBe(mission.duration);
      expect(mission.encounters.some((e) => e.role === "miniboss")).toBe(true);
      for (const wave of mission.waves) {
        expect(wave.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
        expect(wave.interval).toBeGreaterThan(0.18);
        expect(wave.batch).toBeLessThanOrEqual(3);
        expect(waveAt(wave.at, mission.id)).toBe(wave);
      }
      expect(mission.busterAt + mission.busterDuration).toBeLessThan(
        mission.duration,
      );
    },
  );
  it("East Blue conserva costa/puerto y Alabasta usa desierto desde el desembarco", () => {
    expect(voyageStage(300, "east-blue").id).toBe("harbor");
    expect(voyageStage(0, "alabasta").id).toBe("desert");
    expect(terrainTime(45, "voyage")).toBe(45);
  });
  it.each(Object.values(missions))(
    "$name ejecuta encuentros una vez y exige derrotar al jefe final",
    (mission) => {
      const run = createRun(1, "luffy", [], emptyPreparation(), mission.id);
      run.spawnTimer = 999;
      for (const [index, encounter] of mission.encounters.entries()) {
        run.elapsed = encounter.at;
        // El bombardeo ya finalizó cuando se llega al jefe final.
        run.director.busterStarted = true;
        updateDirector(run, 1 / 60);
        expect(run.rift?.boss).toBe(encounter.boss);
        expect(run.rift?.encounter?.index).toBe(index);
        const portal = run.rift;
        updateDirector(run, 1 / 60);
        expect(run.rift).toBe(portal);
        expect(enterRift(run)).toBe(true);
        expect(run.arena?.remaining).toBe(encounter.seconds);
        expect(run.status).not.toBe("won");
        finishArena(run, true);
        expect(run.director.nextEncounter).toBe(index + 1);
        expect(run.status).toBe("bossReward");
        chooseBossReward(
          run,
          run.bossRewards.findIndex((r) => r.kind === "boon"),
        );
      }
      expect(run.director.finalDefeated).toBe(true);
      step(run, idle, 1 / 60);
      expect(run.status).toBe("won");
    },
  );
  it("el aviso no se reinicia, entra automáticamente y agotar el duelo de campaña derrota", () => {
    const run = createRun(1, "luffy", [], emptyPreparation(), "alabasta");
    run.elapsed = 90;
    updateDirector(run, 1 / 60);
    run.player.position = { x: 2300, y: 1500 };
    run.rift!.remaining = 0.001;
    updateRifts(run, 1 / 60);
    expect(run.arena?.encounter?.role).toBe("miniboss");
    expect(run.enemies[0]!.boss?.kind).toBe("mr1");
    run.arena!.remaining = 0.001;
    updateRifts(run, 1 / 60);
    expect(run.status).toBe("lost");
    expect(run.bossesDefeated).toBe(0);
  });
  it("pausa y arena congelan Buster Call; cada impacto avisa, daña una vez y drena al terminar", () => {
    const run = createRun(4, "luffy", [], emptyPreparation(), "east-blue");
    run.elapsed = 210;
    run.director.nextEncounter = 2;
    run.spawnTimer = 999;
    updateDirector(run, 0.01);
    expect(run.director.buster).not.toBeNull();
    const call = run.director.buster!;
    call.shells = [
      { id: 1, position: { ...run.player.position }, remaining: 0.02 },
    ];
    const snapshot = JSON.stringify(run.director);
    togglePause(run);
    step(run, idle, 1 / 60);
    expect(JSON.stringify(run.director)).toBe(snapshot);
    togglePause(run);
    const hp = run.player.health.current;
    updateDirector(run, 0.01);
    expect(run.player.health.current).toBe(hp);
    updateDirector(run, 0.02);
    expect(run.player.health.current).toBe(hp - busterRules.damage);
    expect(call.shells).toHaveLength(0);
    const damaged = run.player.health.current;
    updateDirector(run, 0.01);
    expect(run.player.health.current).toBe(damaged);
    call.remaining = 0.001;
    call.timer = 99;
    updateDirector(run, 0.01);
    expect(run.director.buster).toBeNull();
    updateDirector(run, 0.01);
    expect(run.director.buster).toBeNull();
  });
  it.each(["mr1", "crocodile"] as const)(
    "%s ejecuta los tres patrones, bloquea su puntería y cambia a furia",
    (boss) => {
      const run = createRun(1, "luffy", [], emptyPreparation(), "alabasta");
      run.elapsed = 90;
      updateDirector(run, 0.01);
      run.rift!.boss = boss;
      enterRift(run);
      const enemy = run.enemies[0]!,
        seen = new Set<string>();
      run.player.health.current = 1e6;
      run.player.health.maximum = 1e6;
      for (let i = 0; i < 2400; i++) {
        updateBoss(run, enemy, 1 / 60);
        seen.add(enemy.boss!.move);
      }
      expect(seen.size).toBe(3);
      expect(
        run.hazards.some(
          (h) => h.kind === (boss === "crocodile" ? "sand" : "knife"),
        ),
      ).toBe(true);
      enemy.boss!.phase = "approach";
      enemy.boss!.time = 0;
      enemy.health.current = enemy.health.maximum * 0.4;
      updateBoss(run, enemy, 0.01);
      expect(enemy.boss!.time).toBeCloseTo(
        bossMoves[enemy.boss!.move].windup * 0.82,
      );
    },
  );
});
