import { expect, it } from "vitest";
import { createRun, step } from "../src/game/simulation";
import { training, trainingIds, emptyPreparation } from "../src/data/training";
import { chooseChestReward } from "../src/game/progression";
import {
  chooseBossReward,
  bondCandidates,
  linkTechnique,
} from "../src/game/bonds";
import { pilot, select } from "./pilot";
it("una cuenta entrenada resiste 61 minutos, vence a Imu y continúa sin restaurar vida", async () => {
  const preparation = emptyPreparation();
  for (const id of trainingIds) preparation.levels[id] = training[id].max;
  const run = createRun(
    42,
    "luffy",
    ["zoro", "sanji"],
    preparation,
    "survival",
  );
  let imuSeconds = 0;
  for (
    let frame = 0;
    frame < 1000000 && run.elapsed < 3660 && run.status !== "lost";
    frame++
  ) {
    if (frame % 3000 === 0)
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (run.status === "upgrade") select(run);
    else if (run.status === "chest") chooseChestReward(run, 0);
    else if (run.status === "bossReward") {
      const bond = run.bossRewards.findIndex((r) => r.kind === "bond");
      const rest =
        run.player.health.current < run.player.health.maximum * 0.65
          ? run.bossRewards.findIndex((r) => r.id === "rest")
          : -1;
      const choice =
        rest >= 0
          ? rest
          : bond >= 0
            ? bond
            : run.bossRewards.findIndex(
                (r) => r.id === "damage" || r.id === "health",
              );
      chooseBossReward(run, choice >= 0 ? choice : 0);
    } else if (run.status === "bond")
      linkTechnique(run, bondCandidates(run)[0]!);
    else {
      if (run.enemies.some((e) => e.boss?.kind === "imu")) imuSeconds += 1 / 60;
      step(run, pilot(run), 1 / 60);
    }
  }
  console.info(
    `Supervivencia real: ${run.elapsed.toFixed(1)} s, ${run.kills} bajas, nivel ${run.level}, ${run.player.health.current.toFixed(1)} HP, ${run.bossesDefeated} jefes · duelo Imu ${imuSeconds.toFixed(1)} s`,
  );
  expect(run.elapsed).toBeGreaterThanOrEqual(3660);
  expect(run.status).not.toBe("lost");
  expect(run.kills).toBeGreaterThan(200);
  expect(run.director.imuDefeated).toBe(true);
}, 240000);
