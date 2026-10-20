import { expect, it } from "vitest";
import { createRun, step } from "../src/game/simulation";
import { emptyPreparation } from "../src/data/training";
import { chooseChestReward } from "../src/game/progression";
import {
  chooseBossReward,
  bondCandidates,
  linkTechnique,
} from "../src/game/bonds";
import { pilot, select } from "./pilot";
it("una partida continua supera cinco minutos con roles y cambios de zona, sin restaurar vida", () => {
  const run = createRun(42, "luffy", [], emptyPreparation(), "survival");
  for (
    let frame = 0;
    frame < 72000 && run.elapsed < 360 && run.status !== "lost";
    frame++
  ) {
    if (run.status === "upgrade") select(run);
    else if (run.status === "chest") chooseChestReward(run, 0);
    else if (run.status === "bossReward") {
      const bond = run.bossRewards.findIndex((r) => r.kind === "bond");
      const choice =
        bond >= 0
          ? bond
          : run.bossRewards.findIndex(
              (r) => r.id === "damage" || r.id === "health",
            );
      chooseBossReward(run, choice >= 0 ? choice : 0);
    } else if (run.status === "bond")
      linkTechnique(run, bondCandidates(run)[0]!);
    else step(run, pilot(run), 1 / 60);
  }
  console.info(
    `Supervivencia real: ${run.elapsed.toFixed(1)} s, ${run.kills} bajas, nivel ${run.level}, ${run.player.health.current.toFixed(1)} HP, ${run.bossesDefeated} jefes`,
  );
  expect(run.elapsed).toBeGreaterThanOrEqual(360);
  expect(run.status).not.toBe("lost");
  expect(run.kills).toBeGreaterThan(200);
  expect(run.director.imuSpawned).toBe(false);
}, 30000);
