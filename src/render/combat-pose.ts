import type { CharacterId } from "../data/content";
import type { Attack, Run } from "../game/types";
import { ease } from "./motion";

export function firstContact(attack: Attack): number {
  return (
    attack.strikes[0]?.at ??
    attack.windup + Math.min(0.04, attack.active * 0.25)
  );
}
export function selectBodyAttack(
  run: Run,
  caster: CharacterId,
): Attack | undefined {
  return run.attacks
    .filter(
      (a) => a.caster === caster && a.age < a.windup + a.active + a.recovery,
    )
    .sort((a, b) => priority(b) - priority(a) || b.id - a.id)[0];
}
function priority(a: Attack): number {
  return a.age < a.windup ? 1 : a.age < a.windup + a.active ? 3 : 2;
}

/** Claves dibujadas, unidas a eventos de la simulación, nunca a un reloj de FPS. */
export function combatPose(attack: Attack): {
  frame: number;
  advance: number;
  lift: number;
  tilt: number;
} {
  const contact = firstContact(attack),
    end = attack.windup + attack.active;
  let frame: number;
  if (attack.age < attack.windup * 0.4) frame = 0;
  else if (attack.age < contact) frame = 1;
  else if (attack.age < contact + Math.min(0.04, attack.active * 0.35))
    frame = 2;
  else if (attack.age < end) frame = 3;
  else frame = attack.age < end + attack.recovery * 0.65 ? 4 : 5;
  if (
    attack.caster === "franky" &&
    attack.age >= attack.windup &&
    attack.age < contact
  )
    frame = 2;
  const amount =
    attack.age < contact
      ? ease(
          (attack.age - attack.windup) /
            Math.max(0.001, contact - attack.windup),
        )
      : attack.age < end
        ? 1
        : 1 - ease((attack.age - end) / attack.recovery);
  const heavy = attack.weapon === "concasse";
  return {
    frame,
    advance: amount * (attack.caster === "brook" ? 9 : 3),
    lift: heavy
      ? frame < 2
        ? -9 * ease(attack.age / contact)
        : frame === 2
          ? -5
          : 0
      : 0,
    tilt: heavy && frame >= 1 && frame <= 3 ? (Math.PI / 2) * amount : 0,
  };
}

export function zoroBladeCount(form: number): number {
  return form === 2 ? 9 : 3;
}
