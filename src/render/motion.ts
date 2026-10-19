import { animationFeel } from "../data/animation";
import type { Attack } from "../game/types";
export const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));
export const ease = (value: number): number => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
/** Una extensión alcanza el objetivo en el evento de impacto, no según los FPS. */
export function contactReach(attack: Attack): number {
  if (attack.age < attack.windup) return 0;
  const end = attack.windup + attack.active;
  if (attack.age >= end) return 1 - ease((attack.age - end) / attack.recovery);
  const first =
    attack.strikes[0]?.at ??
    attack.windup + Math.min(attack.active * 0.25, 0.04);
  return ease(
    (attack.age - attack.windup) / Math.max(0.001, first - attack.windup),
  );
}
/** Cada brazo recupera antes de su siguiente golpe de Gatling. */
export function barrageReach(attack: Attack, parity: number): number {
  let reach = 0;
  const strikes = attack.strikes.filter(
    (strike) => strike.index % 2 === parity,
  );
  for (let index = 0; index < strikes.length; index++) {
    const strike = strikes[index];
    if (!strike) continue;
    const next = strikes[index + 1];
    const launch = Math.min(
      animationFeel.barrageLaunch,
      Math.max(0.012, strike.at - attack.windup),
    );
    const hold = animationFeel.barrageHold;
    const remaining =
      attack.windup + attack.active + attack.recovery - strike.at - hold;
    const recovery = Math.max(
      0.005,
      Math.min(
        animationFeel.barrageReturn,
        remaining,
        next ? next.at - strike.at - launch - hold : Infinity,
      ),
    );
    const age = attack.age;
    const amount =
      age <= strike.at
        ? ease((age - strike.at + launch) / launch)
        : age <= strike.at + hold
          ? 1
          : 1 - ease((age - strike.at - hold) / recovery);
    reach = Math.max(reach, amount);
  }
  return reach;
}

export function bladeMotion(attack: Attack): { offset: number; trail: number } {
  const contact =
    attack.strikes[0]?.at ??
    attack.windup + Math.min(0.04, attack.active * 0.25);
  const end = attack.windup + attack.active;
  if (attack.age < attack.windup)
    return { offset: -0.8 - 0.35 * ease(attack.age / attack.windup), trail: 0 };
  if (attack.age < contact)
    return {
      offset:
        -1.15 *
        (1 -
          ease(
            (attack.age - attack.windup) /
              Math.max(0.001, contact - attack.windup),
          )),
      trail: 0.55,
    };
  if (attack.age < end)
    return {
      offset:
        0.65 * ease((attack.age - contact) / Math.max(0.001, end - contact)),
      trail: 0.55,
    };
  const returnTime = ease((attack.age - end) / attack.recovery);
  return { offset: 0.65 - 1.1 * returnTime, trail: 0.55 * (1 - returnTime) };
}
