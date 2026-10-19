import { moveOnTerrain, steerAround } from "./terrain";
import { activeSynergies, characterById, type FormTier } from "../data/crew";
import { masteredForm, syncForms } from "./forms";
import type { CharacterId } from "../data/content";
import type { Position } from "../core/entity";
import type { Run } from "./types";
export function casterPosition(run: Run, character: CharacterId): Position {
  if (character === run.character) return run.player.position;
  const nakama = [...run.nakama, ...run.assists].find(
    (item) => item.character === character,
  );
  if (!nakama)
    throw new Error("La técnica necesita un actor de su propietario.");
  return nakama.position;
}
export const casterForm = (run: Run, character: CharacterId): FormTier =>
  character === run.character ? run.form : masteredForm(run, character);
export function changeForm(run: Run, form: FormTier): boolean {
  const definition = characterById(run.character).forms[form];
  if (
    run.status !== "playing" ||
    form === run.form ||
    (form > 0 && (form > run.formUnlocked || run.formCooldown > 0))
  )
    return false;
  run.form = form;
  run.formCooldown = 1.25;
  run.transformTime = 0.5;
  run.attacks = run.attacks.filter((attack) => attack.caster !== run.character);
  if (form > 0)
    run.player.invulnerable = Math.max(run.player.invulnerable, 0.15);
  run.notice = definition.name;
  run.noticeTime = 3;
  return true;
}
export function cycleForm(run: Run): boolean {
  const next: FormTier =
    run.form === 0 ? 1 : run.form === 1 && run.formUnlocked >= 2 ? 2 : 0;
  return changeForm(run, next);
}
export function updateCrew(run: Run, dt: number): void {
  run.formCooldown = Math.max(0, run.formCooldown - dt);
  run.transformTime = Math.max(0, run.transformTime - dt);
  syncForms(run);
  run.energy = 100;
  const facing = run.player.facing;
  [...run.nakama, ...run.assists].forEach((nakama, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const target = {
      x:
        run.player.position.x -
        facing.x * (42 + Math.floor(index / 2) * 38) -
        facing.y * side * 43,
      y:
        run.player.position.y -
        facing.y * (42 + Math.floor(index / 2) * 38) +
        facing.x * side * 43,
    };
    const dx = target.x - nakama.position.x,
      dy = target.y - nakama.position.y;
    const distance = Math.hypot(dx, dy);
    const travel = Math.min(distance, (225 + distance * 2) * dt);
    if (distance > 1) {
      if (run.arena) {
        nakama.position.x += (dx / distance) * travel;
        nakama.position.y += (dy / distance) * travel;
      } else {
        const direction = steerAround(
          nakama.position,
          target,
          10,
          run.elapsed,
          index,
        );
        moveOnTerrain(
          nakama.position,
          { x: direction.x * travel, y: direction.y * travel },
          10,
          run.elapsed,
        );
      }
      nakama.facing = { x: dx / distance, y: dy / distance };
    }
    nakama.moving = distance > 5;
    nakama.supportTimer -= dt;
    if (nakama.supportTimer <= 0 && run.nakama.includes(nakama)) {
      const heal =
        nakama.character === "chopper"
          ? 6
          : nakama.character === "sanji"
            ? 4
            : 0;
      if (heal > 0) {
        run.player.health.current = Math.min(
          run.player.health.maximum,
          run.player.health.current + heal,
        );
        run.notice = `${characterById(nakama.character).id === "chopper" ? "Chopper te atiende" : "Sanji prepara un tentempié"} · +${heal} vida`;
        run.noticeTime = 2;
      }
      nakama.supportTimer = 12;
    }
  });
}
export function tryRevive(run: Run): boolean {
  if (
    run.character !== "brook" ||
    run.reviveUsed ||
    run.player.health.current > 0
  )
    return false;
  run.reviveUsed = true;
  run.player.health.current = run.player.health.maximum * 0.4;
  run.player.invulnerable = 2;
  run.notice = "¡Yohoho! Brook se levanta · segunda vida consumida";
  run.noticeTime = 4;
  run.transformTime = 0.7;
  return true;
}
export const crewSynergyNames = (run: Run): string =>
  activeSynergies(
    run.character,
    run.nakama.map((item) => item.character),
  )
    .map((item) => item.name)
    .join(" · ");
