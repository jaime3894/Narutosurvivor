import { survivalPressure } from "../data/survival";
import type { Enemy, Run } from "./types";
import { terrainTime } from "../data/missions";
import { blocked } from "./terrain";
import { distanceSquared, notify } from "./rules";
import { hurtPlayer } from "./rifts";
/** El fusilero fija la puntería ANTES de disparar; los oficiales refuerzan solo unidades cercanas. */
export function updateEnemyRole(run: Run, enemy: Enemy, dt: number): number {
  if (!enemy.role) return 1;
  enemy.roleTimer = (enemy.roleTimer ?? 2) - dt;
  const d = Math.sqrt(distanceSquared(enemy.position, run.player.position));
  if (enemy.role === "rifle") {
    if ((enemy.warning ?? 0) > 0) {
      enemy.warning = Math.max(0, enemy.warning! - dt);
      if (enemy.warning === 0 && enemy.aim && run.shots.length < 45) {
        run.shots.push({
          position: { ...enemy.position },
          velocity: { x: enemy.aim.x * 275, y: enemy.aim.y * 275 },
          life: 2.2,
          damage:
            (12 + Math.min(18, run.elapsed / 180)) *
            survivalPressure(run.elapsed),
        });
        enemy.roleTimer = 3.2;
      }
      return 0;
    }
    if (enemy.roleTimer <= 0 && d < 440) {
      enemy.aim = {
        x: (run.player.position.x - enemy.position.x) / (d || 1),
        y: (run.player.position.y - enemy.position.y) / (d || 1),
      };
      enemy.warning = 0.9;
    }
    return d < 230 ? 0 : d < 320 ? 0.35 : 0.9;
  }
  if (enemy.role === "officer") {
    if (enemy.roleTimer <= 0) {
      enemy.roleTimer = 7;
      for (const other of run.enemies)
        if (
          !other.boss &&
          other.id !== enemy.id &&
          distanceSquared(other.position, enemy.position) < 180 ** 2
        ) {
          other.health.current = Math.min(
            other.health.maximum,
            other.health.current + other.health.maximum * 0.12,
          );
          other.flash = 0.2;
        }
      if (d < 350)
        notify(run, "¡Oficial de la Marina! Cura a los enemigos cercanos");
    }
    return d < 170 ? 0.35 : 0.85;
  }
  if (!enemy.aim || enemy.roleTimer <= 0) {
    enemy.aim = {
      x: (run.player.position.x - enemy.position.x) / (d || 1),
      y: (run.player.position.y - enemy.position.y) / (d || 1),
    };
    enemy.roleTimer = 1.4;
  }
  return 0.75;
}
export function updateShots(run: Run, dt: number): void {
  for (const shot of run.shots) {
    shot.life -= dt;
    const steps = Math.ceil(
      (Math.hypot(shot.velocity.x, shot.velocity.y) * dt) / 5,
    );
    for (let i = 0; i < steps && shot.life > 0; i++) {
      shot.position.x += (shot.velocity.x * dt) / steps;
      shot.position.y += (shot.velocity.y * dt) / steps;
      if (blocked(shot.position, 3, terrainTime(run.elapsed, run.mission)))
        shot.life = 0;
      else if (
        distanceSquared(shot.position, run.player.position) <
        (run.player.radius + 4) ** 2
      ) {
        hurtPlayer(run, shot.damage);
        shot.life = 0;
      }
    }
  }
  run.shots = run.shots.filter((s) => s.life > 0);
}
