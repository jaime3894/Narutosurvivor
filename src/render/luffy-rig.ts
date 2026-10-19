import type { Attack, Run } from "../game/types";
import type { Direction } from "./sprites";
import { luffyLayers } from "./luffy-assets";
import { makeLuffyPose, type LuffyArmPose } from "./luffy-pose";
export function drawLuffyRig(
  ctx: CanvasRenderingContext2D,
  run: Run,
  attack: Attack,
  direction: Direction,
): boolean {
  const layers = luffyLayers();
  if (!layers) return false;
  const pose = makeLuffyPose(run, attack, direction);
  const near = direction === "left" ? -1 : 1,
    back = pose.arms.find((arm) => arm.side !== near),
    front = pose.arms.find((arm) => arm.side === near);
  const twist =
    attack.weapon === "pistol" && attack.evolved
      ? Math.min(1, Math.max(0, (attack.age - attack.windup) / attack.active)) *
        Math.PI *
        2
      : 0;
  if (back) drawArm(ctx, layers.arms, back, pose.form, twist);
  const row = ["down", "left", "right", "up"].indexOf(direction);
  const body = pose.form === 0 ? layers.baseBody : layers.bodies;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    body,
    pose.form === 0 ? 0 : pose.form * 96,
    row * 80,
    pose.form === 0 ? 64 : 96,
    80,
    Math.round(pose.root.x - (pose.form === 0 ? 32 : 48)),
    Math.round(pose.root.y - 74),
    pose.form === 0 ? 64 : 96,
    80,
  );
  if (back && (direction === "down" || direction === "up")) {
    const size = pose.form === 2 ? 14 : 10;
    ctx.drawImage(
      layers.arms,
      4,
      pose.form * 64 + 14,
      28,
      36,
      Math.round(back.shoulder.x - size / 2),
      Math.round(back.shoulder.y - 7),
      size,
      14,
    );
  }
  if (front) drawArm(ctx, layers.arms, front, pose.form, twist);
  return true;
}
function drawArm(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  arm: LuffyArmPose,
  form: number,
  twist: number,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const bulk = form === 2 ? 1.25 : 1;
  if (!arm.extended) {
    const col = arm.side === -1 ? 2 : 3;
    ctx.drawImage(
      image,
      col * 128 + 32,
      form * 64 + 4,
      64,
      56,
      Math.round(arm.shoulder.x + (arm.side === -1 ? -3 : -15) * bulk),
      Math.round(arm.shoulder.y - 3),
      20 * bulk,
      23 * bulk,
    );
  } else {
    const dx = arm.fist.x - arm.shoulder.x,
      dy = arm.fist.y - arm.shoulder.y,
      length = Math.hypot(dx, dy),
      angle = Math.atan2(dy, dx);
    ctx.translate(arm.shoulder.x, arm.shoulder.y);
    ctx.rotate(angle);
    const col = arm.open ? 128 : 0;
    // Solo se estira la textura del antebrazo; la mano mantiene su volumen.
    ctx.drawImage(
      image,
      col + 64,
      form * 64 + 24,
      32,
      24,
      0,
      -4.5 * bulk,
      Math.max(1, length - 5 * bulk),
      9 * bulk,
    );
    ctx.drawImage(
      image,
      col + 4,
      form * 64 + 14,
      28,
      36,
      -4 * bulk,
      -7 * bulk,
      10 * bulk,
      14 * bulk,
    );
    if (arm.open)
      ctx.drawImage(
        image,
        128 + 84,
        form * 64 + 4,
        44,
        56,
        length - 7 * bulk,
        -11 * bulk,
        17 * bulk,
        22 * bulk,
      );
    else {
      ctx.translate(length, 0);
      ctx.rotate(twist);
      ctx.drawImage(
        image,
        100,
        form * 64 + 20,
        28,
        32,
        -6 * bulk,
        -8 * bulk,
        14 * bulk,
        16 * bulk,
      );
    }
  }
  ctx.restore();
}
