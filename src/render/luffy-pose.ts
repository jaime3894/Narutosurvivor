import { luffyShoulders } from "../data/luffy-art";
import type { Position } from "../core/entity";
import type { FormTier } from "../data/crew";
import type { Attack, Run } from "../game/types";
import type { Direction } from "./sprites";
import { casterPosition } from "../game/crew";
import { attackEndpoint } from "../game/techniques";
export interface LuffyArmPose {
  side: -1 | 1;
  shoulder: Position;
  fist: Position;
  extended: boolean;
  open: boolean;
}
export interface LuffyPose {
  root: Position;
  form: FormTier;
  arms: readonly [LuffyArmPose, LuffyArmPose];
  phase: "windup" | "active" | "recovery";
}
const punchWeapons = new Set(["pistol", "gatling", "bazooka"]);
/** Un solo controlador corporal: dos brazos incluso con varias técnicas simultáneas. */
export function selectLuffyPunch(run: Run): Attack | undefined {
  if (
    run.attacks.some(
      (attack) => attack.caster === "luffy" && attack.weapon === "balloon",
    )
  )
    return undefined;
  return run.attacks
    .filter(
      (attack) =>
        attack.caster === "luffy" &&
        punchWeapons.has(attack.weapon) &&
        attack.age < attack.windup + attack.active + attack.recovery,
    )
    .sort((a, b) => priority(b) - priority(a) || b.id - a.id)[0];
}
function priority(attack: Attack): number {
  return attack.age < attack.windup
    ? 1
    : attack.age < attack.windup + attack.active
      ? 3
      : 2;
}
export function makeLuffyPose(
  run: Run,
  attack: Attack,
  direction: Direction,
): LuffyPose {
  const phase =
    attack.age < attack.windup
      ? "windup"
      : attack.age < attack.windup + attack.active
        ? "active"
        : "recovery";
  const activeTime = Math.max(0, (attack.age - attack.windup) / attack.active);
  const recovery = Math.min(
    1,
    Math.max(0, (attack.age - attack.windup - attack.active) / attack.recovery),
  );
  const reach =
    phase === "windup"
      ? 0
      : phase === "active"
        ? Math.min(1, activeTime * 5)
        : 1 - recovery;
  const pull =
    phase === "windup"
      ? Math.sin(((attack.age / attack.windup) * Math.PI) / 2) * 5
      : phase === "active"
        ? 5 * (1 - reach)
        : 0;
  const lean =
    phase === "windup"
      ? -Math.sin(((attack.age / attack.windup) * Math.PI) / 2)
      : phase === "active"
        ? -1 + 2.5 * reach
        : 1.5 * (1 - recovery);
  const origin = casterPosition(run, "luffy"),
    root = {
      x: origin.x + attack.direction.x * lean,
      y: origin.y + attack.direction.y * lean,
    };
  const form = attack.form;
  const target = attackEndpoint(run, attack);
  const near: -1 | 1 = direction === "left" ? -1 : 1;
  const alternation =
    attack.weapon === "gatling"
      ? Math.floor(activeTime * Math.max(2, attack.strikes.length)) % 2
      : 0;
  const striking: -1 | 1 = alternation === 1 ? (near === 1 ? -1 : 1) : near;
  const makeArm = (side: -1 | 1): LuffyArmPose => {
    const attachment = luffyShoulders[form][direction][side === -1 ? 0 : 1];
    const shoulder = { x: root.x + attachment.x, y: root.y + attachment.y };
    const rest = {
      x: shoulder.x + (side === -1 ? 12 : -10) - attack.direction.x * pull,
      y: shoulder.y + 6 - attack.direction.y * pull,
    };
    const participates = attack.weapon === "bazooka" || side === striking;
    const pulse =
      attack.weapon === "gatling"
        ? phase === "active"
          ? Math.sin(
              ((activeTime * Math.max(2, attack.strikes.length)) % 1) * Math.PI,
            )
          : 0
        : reach;
    const amount = participates ? pulse : 0;
    const separation = attack.weapon === "bazooka" ? side * 7 : 0;
    const goal = {
      x: target.x - attack.direction.y * separation,
      y: target.y - 45 + attack.direction.x * separation,
    };
    return {
      side,
      shoulder,
      fist: {
        x: rest.x + (goal.x - rest.x) * amount,
        y: rest.y + (goal.y - rest.y) * amount,
      },
      extended: amount > 0.005,
      open: attack.weapon === "bazooka",
    };
  };
  return { root, form, phase, arms: [makeArm(-1), makeArm(1)] };
}
