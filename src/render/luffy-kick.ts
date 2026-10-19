import type { Position } from "../core/entity";
import type { Attack, Run } from "../game/types";
import { animationProgress } from "../game/techniques";
import { casterPosition } from "../game/crew";
import { combatParts } from "./combat-parts";
import { luffyLayers } from "./luffy-assets";
import type { Direction } from "./sprites";
import { luffyKickHips } from "../data/technique-joints";

export function luffyKickPose(
  root: Position,
  attack: Attack,
  direction: Direction,
): { hip: Position; foot: Position; angle: number } {
  const phase = (attack.age - attack.windup) / attack.active;
  // Misma rotación y extensión que la colisión barrida del motor.
  const angle =
    Math.atan2(attack.direction.y, attack.direction.x) +
    Math.max(0, phase) * Math.PI * 2;
  const extension = animationProgress(attack).extension;
  const anchor = luffyKickHips[direction];
  const hip = {
    x: root.x + anchor.x,
    y: root.y + (attack.form === 2 ? -23 : anchor.y),
  };
  const length = extension > 0 ? attack.range * extension : 14;
  return {
    hip,
    foot: {
      x: hip.x + Math.cos(angle) * length,
      y: hip.y + Math.sin(angle) * length,
    },
    angle,
  };
}
export function drawLuffyKick(
  ctx: CanvasRenderingContext2D,
  run: Run,
  attack: Attack,
  direction: Direction,
): boolean {
  const parts = combatParts(),
    layers = luffyLayers();
  if (!parts || !layers) return false;
  const root = casterPosition(run, "luffy"),
    pose = luffyKickPose(root, attack, direction);
  const row = ["down", "left", "right", "up"].indexOf(direction);
  const leg = (): void => {
    const length = Math.hypot(
      pose.foot.x - pose.hip.x,
      pose.foot.y - pose.hip.y,
    );
    ctx.save();
    ctx.translate(pose.hip.x, pose.hip.y);
    ctx.rotate(pose.angle);
    ctx.drawImage(
      layers.arms,
      64,
      attack.form * 64 + 24,
      32,
      24,
      0,
      -4,
      length,
      8,
    );
    ctx.drawImage(
      parts.luffySandals,
      attack.form * 32,
      0,
      32,
      16,
      length - 7,
      -5,
      23,
      12,
    );
    ctx.restore();
  };
  if (Math.sin(pose.angle) < 0) leg();
  ctx.drawImage(
    parts.luffyKick,
    attack.form * 96,
    row * 80,
    96,
    80,
    root.x - 48,
    root.y - 74,
    96,
    80,
  );
  if (Math.sin(pose.angle) >= 0) leg();
  return true;
}
