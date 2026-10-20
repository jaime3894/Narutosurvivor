import { it, expect } from "vitest";
import { createRun, step } from "../src/game/simulation";
import { missions } from "../src/data/missions";
import { emptyPreparation } from "../src/data/training";
import {
  chooseBossReward,
  bondCandidates,
  linkTechnique,
} from "../src/game/bonds";
import { closeChest } from "../src/game/progression";
import { combat } from "../src/data/combat";
import { pilot, select } from "./pilot";
it.each(Object.values(missions))(
  "$name se completa con reglas reales, incluidos minijefes, bombardeo y jefe final",
  (mission) => {
    const preparation = emptyPreparation();
    // Los bancos avanzados validan entrenamiento básico, sin restaurar vida durante la partida.
    if (!["east-blue", "alabasta"].includes(mission.id)) {
      preparation.levels.health = 2;
      preparation.levels.damage = 2;
      preparation.levels.regen = 1;
    }
    const run = createRun(
      3894,
      "luffy",
      ["east-blue", "alabasta"].includes(mission.id) ? [] : ["zoro"],
      preparation,
      mission.id,
    );
    for (
      let frame = 0;
      frame < 72000 && !["won", "lost"].includes(run.status);
      frame++
    ) {
      while (["upgrade", "chest", "bossReward"].includes(run.status)) {
        if (run.status === "upgrade") select(run);
        else if (run.status === "chest") closeChest(run);
        else {
          const bond = run.bossRewards.findIndex((r) => r.kind === "bond");
          if (bond >= 0) {
            chooseBossReward(run, bond);
            const id = bondCandidates(run)[0];
            if (!id || !linkTechnique(run, id))
              throw new Error("Vínculo de prueba inválido");
          } else
            chooseBossReward(
              run,
              run.bossRewards.findIndex((r) => r.kind === "boon"),
            );
        }
      }
      step(run, pilot(run), 1 / 60);
      expect(run.enemies.length).toBeLessThanOrEqual(combat.maximumEnemies);
    }
    console.info(
      `${mission.name}: ${run.status}, ${run.elapsed}s, ${run.kills} bajas, nivel ${run.level}, ${run.player.health.current} HP, jefes ${run.bossesDefeated}, final ${run.director.finalDefeated}`,
    );
    expect(run.status).toBe("won");
    expect(run.director.finalDefeated).toBe(true);
    expect(run.bossesDefeated).toBe(mission.encounters.length);
    expect(run.director.busterStarted).toBe(true);
    expect(run.director.buster).toBeNull();
  },
  15000,
);
