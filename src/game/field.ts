import { fieldRules, fieldDefinitions, fieldKinds } from "../data/survival";
import { attackContains } from "./techniques";
import { terrainTime } from "../data/missions";
import { freePosition } from "./terrain";
import { addDrop, distanceSquared, effect, notify, stats } from "./rules";
import { spawnChest } from "./progression";
import type { Run } from "./types";
/** Objetivos breves opcionales: el reloj y las oleadas nunca se detienen al abrir una caja. */
export function updateField(run: Run, dt: number): void {
  if (run.mission !== "survival") return;
  run.fieldTimer -= dt;
  if (run.fieldTimer <= 0) {
    run.fieldTimer = fieldRules.interval;
    if (run.fieldObjects.length < fieldRules.maximum) {
      const angle = run.random() * Math.PI * 2,
        kind = fieldKinds[Math.floor(run.random() * fieldKinds.length)]!;
      const position = freePosition(
        {
          x: run.player.position.x + Math.cos(angle) * fieldRules.distance,
          y: run.player.position.y + Math.sin(angle) * fieldRules.distance,
        },
        25,
        terrainTime(run.elapsed, run.mission),
      );
      run.fieldObjects.push({
        id: run.nextId++,
        kind,
        position,
        health: fieldDefinitions[kind].health,
        progress: 0,
        remaining: fieldRules.lifetime,
      });
      notify(run, fieldDefinitions[kind].notice);
    }
  }
  for (const object of run.fieldObjects) {
    object.remaining -= dt;
    const near =
      distanceSquared(object.position, run.player.position) <
      fieldRules.reach ** 2;
    if (object.kind === "supplies" && near) {
      const heal = Math.min(
        30 * stats(run).food,
        run.player.health.maximum - run.player.health.current,
      );
      if (heal > 0) {
        run.player.health.current += heal;
        effect(run, object.position, "heal", Math.round(heal));
        object.remaining = 0;
      }
    } else if (object.kind === "vault") {
      object.progress = near
        ? object.progress + dt
        : Math.max(0, object.progress - dt * 0.5);
      if (
        object.progress >= fieldRules.vaultSeconds &&
        spawnChest(run, object.position)
      ) {
        run.berries += fieldRules.vaultBerries;
        object.remaining = 0;
        effect(run, object.position, "level");
      }
    } else if (object.kind === "barrel") {
      for (const attack of run.attacks) {
        if (attack.caster !== run.character) continue;
        if (
          attack.age < attack.windup ||
          attack.age > attack.windup + attack.active
        )
          continue;
        if (attackContains(run, attack, object.position, 22))
          object.health -= attack.damage * dt * 3;
      }
      for (const p of run.projectiles)
        if (
          p.life > 0 &&
          distanceSquared(p.position, object.position) < 30 ** 2
        ) {
          object.health -= p.damage;
          p.life = 0;
        }
      if (run.player.dashTime > 0 && near) object.health = 0;
      if (object.health <= 0) {
        object.remaining = 0;
        effect(run, object.position, "kill");
        addDrop(run, {
          position: { ...object.position },
          kind: "coin",
          value: 12,
          attracted: false,
        });
        addDrop(run, {
          position: { x: object.position.x + 12, y: object.position.y },
          kind: "xp",
          value: 8,
          attracted: false,
        });
        if (run.random() < 0.4)
          addDrop(run, {
            position: { x: object.position.x - 12, y: object.position.y },
            kind: "heal",
            value: 18,
            attracted: false,
          });
      }
    }
  }
  run.fieldObjects = run.fieldObjects.filter(
    (o) =>
      o.remaining > 0 &&
      distanceSquared(o.position, run.player.position) < 1300 ** 2,
  );
}
