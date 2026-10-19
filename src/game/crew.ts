import {
  activeSynergies,
  characterById,
  combinedSynergies,
  type FormTier,
} from "../data/crew";
import type { CharacterId } from "../data/content";
import type { Position } from "../core/entity";
import type { Run } from "./types";
export function casterPosition(run: Run, character: CharacterId): Position {
  if (character === run.character) return run.player.position;
  const nakama = run.nakama.find((item) => item.character === character);
  if (!nakama)
    throw new Error("La técnica necesita un actor de su propietario.");
  return nakama.position;
}
export const casterForm = (run: Run, character: CharacterId): FormTier =>
  character === run.character ? run.form : 0;
export function changeForm(run: Run, form: FormTier): boolean {
  const definition = characterById(run.character).forms[form];
  if (
    run.status !== "playing" ||
    form === run.form ||
    (form > 0 &&
      (run.level < definition.level || run.energy < 25 || run.formCooldown > 0))
  )
    return false;
  run.form = form;
  run.formCooldown = 1.25;
  run.transformTime = 0.5;
  run.attacks = run.attacks.filter((attack) => attack.caster !== run.character);
  if (form > 0)
    run.player.invulnerable = Math.max(run.player.invulnerable, 0.15);
  run.notice = `${definition.name}${form === 0 ? " · recuperando energía" : " · ¡a combatir!"}`;
  run.noticeTime = 3;
  return true;
}
export function cycleForm(run: Run): boolean {
  const next: FormTier =
    run.form === 0 ? 1 : run.form === 1 && run.level >= 8 ? 2 : 0;
  return changeForm(run, next);
}
export function updateCrew(run: Run, dt: number): void {
  run.formCooldown = Math.max(0, run.formCooldown - dt);
  run.transformTime = Math.max(0, run.transformTime - dt);
  const form = characterById(run.character).forms[run.form];
  if (run.form === 0)
    run.energy = Math.min(
      100,
      run.energy +
        (14 +
          combinedSynergies(
            run.character,
            run.nakama.map((item) => item.character),
          ).energyRegen) *
          dt,
    );
  else {
    run.energy = Math.max(0, run.energy - form.drain * dt);
    if (run.energy === 0) {
      run.form = 0;
      run.transformTime = 0.4;
      run.notice = "Sin energía · vuelves al estilo base";
      run.noticeTime = 3;
      run.attacks = run.attacks.filter(
        (attack) => attack.caster !== run.character,
      );
    }
  }
  const facing = run.player.facing;
  run.nakama.forEach((nakama, index) => {
    const side = index === 0 ? -1 : 1;
    const target = {
      x: run.player.position.x - facing.x * 42 - facing.y * side * 43,
      y: run.player.position.y - facing.y * 42 + facing.x * side * 43,
    };
    const dx = target.x - nakama.position.x,
      dy = target.y - nakama.position.y;
    const distance = Math.hypot(dx, dy);
    const travel = Math.min(distance, (225 + distance * 2) * dt);
    if (distance > 1) {
      nakama.position.x += (dx / distance) * travel;
      nakama.position.y += (dy / distance) * travel;
      nakama.facing = { x: dx / distance, y: dy / distance };
    }
    nakama.moving = distance > 5;
    nakama.supportTimer -= dt;
    if (nakama.supportTimer <= 0) {
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
