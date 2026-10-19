import { animationFeel } from "../data/animation";
import { barrageReach, contactReach, ease } from "./motion";
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
  elbow: Position;
  extended: boolean;
  open: boolean;
}
export interface LuffyPose {
  root: Position;
  form: FormTier;
  bodyAngle: number;
  arms: readonly [LuffyArmPose, LuffyArmPose];
  phase: "windup" | "active" | "recovery";
}
const punchWeapons = new Set(["pistol", "gatling", "bazooka"]);
/** Un solo controlador corporal: dos brazos incluso con varias técnicas simultáneas. */
export function selectLuffyPunch(run: Run): Attack | undefined {
  const attack = selectLuffyBodyAction(run);
  return attack && punchWeapons.has(attack.weapon) ? attack : undefined;
}
export function selectLuffyBodyAction(run: Run): Attack | undefined {
  if (
    run.attacks.some(
      (attack) => attack.caster === "luffy" && attack.weapon === "balloon",
    )
  )
    return run.attacks.find(
      (attack) => attack.caster === "luffy" && attack.weapon === "balloon",
    );
  return run.attacks
    .filter(
      (attack) =>
        attack.caster === "luffy" &&
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
  const recovery = Math.min(
    1,
    Math.max(0, (attack.age - attack.windup - attack.active) / attack.recovery),
  );
  const reach = contactReach(attack);
  const prepare = ease(attack.age / attack.windup);
  const pull =
    animationFeel.windupPull *
    (phase === "windup" ? prepare : phase === "active" ? 1 - reach : 0);
  const lean =
    phase === "windup"
      ? -prepare
      : phase === "active"
        ? -1 + 2.5 * reach
        : 1.5 * (1 - ease(recovery));
  const profile = direction === "left" || direction === "right";
  const sign = direction === "left" ? -1 : 1;
  const bodyAngle = profile
    ? sign *
      (phase === "windup"
        ? -animationFeel.torsoWindup * prepare
        : phase === "active"
          ? -animationFeel.torsoWindup +
            (animationFeel.torsoWindup + animationFeel.torsoFollowThrough) *
              reach
          : animationFeel.torsoFollowThrough * (1 - ease(recovery)))
    : 0;
  const origin = casterPosition(run, "luffy"),
    root = {
      x: origin.x + attack.direction.x * lean,
      y: origin.y + attack.direction.y * lean,
    };
  const form = attack.form;
  const target = attackEndpoint(run, attack);
  const near: -1 | 1 = direction === "left" ? -1 : 1;
  const makeArm = (side: -1 | 1): LuffyArmPose => {
    const attachment = luffyShoulders[form][direction][side === -1 ? 0 : 1];
    const ax = attachment.x,
      ay = attachment.y + animationFeel.hipHeight;
    const shoulder = {
      x: root.x + ax * Math.cos(bodyAngle) - ay * Math.sin(bodyAngle),
      y:
        root.y -
        animationFeel.hipHeight +
        ax * Math.sin(bodyAngle) +
        ay * Math.cos(bodyAngle),
    };
    const rest = {
      x: shoulder.x + (side === -1 ? 12 : -10) - attack.direction.x * pull,
      y: shoulder.y + 6 - attack.direction.y * pull,
    };
    const participates = attack.weapon === "bazooka" || side === near;
    const amount =
      attack.weapon === "gatling"
        ? barrageReach(attack, side === near ? 0 : 1)
        : participates
          ? reach
          : 0;
    const separation = attack.weapon === "bazooka" ? side * 7 : 0;
    const goal = {
      x: target.x - attack.direction.y * separation,
      y: target.y - 45 + attack.direction.x * separation,
    };
    const fist = {
      x: rest.x + (goal.x - rest.x) * amount,
      y: rest.y + (goal.y - rest.y) * amount,
    };
    const dx = fist.x - shoulder.x,
      dy = fist.y - shoulder.y,
      length = Math.hypot(dx, dy) || 1;
    const bend = animationFeel.armBend * Math.sin(Math.PI * amount) * side;
    const elbow = {
      x: (shoulder.x + fist.x) / 2 - (dy / length) * bend,
      y: (shoulder.y + fist.y) / 2 + (dx / length) * bend,
    };
    return {
      side,
      shoulder,
      fist,
      elbow,
      extended: amount > 0.005,
      open: attack.weapon === "bazooka",
    };
  };
  return { root, form, bodyAngle, phase, arms: [makeArm(-1), makeArm(1)] };
}
