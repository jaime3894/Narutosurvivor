import { animationFeel } from "../data/animation";
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
  ctx.save();
  ctx.translate(pose.root.x, pose.root.y - animationFeel.hipHeight);
  ctx.rotate(pose.bodyAngle);
  ctx.drawImage(
    body,
    pose.form === 0 ? 0 : pose.form * 96,
    row * 80,
    pose.form === 0 ? 64 : 96,
    80,
    -(pose.form === 0 ? 32 : 48),
    animationFeel.hipHeight - 74,
    pose.form === 0 ? 64 : 96,
    80,
  );
  ctx.restore();
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
    const point = (t: number) => ({
      x:
        (1 - t) ** 2 * arm.shoulder.x +
        2 * (1 - t) * t * arm.elbow.x +
        t * t * arm.fist.x,
      y:
        (1 - t) ** 2 * arm.shoulder.y +
        2 * (1 - t) * t * arm.elbow.y +
        t * t * arm.fist.y,
    });
    const length = Math.hypot(
      arm.fist.x - arm.shoulder.x,
      arm.fist.y - arm.shoulder.y,
    );
    const segments = Math.max(4, Math.min(18, Math.ceil(length / 18)));
    for (let i = 0; i < segments; i++) {
      const start = point(i / segments),
        end = point((i + 1) / segments);
      const distance = Math.hypot(end.x - start.x, end.y - start.y);
      ctx.save();
      ctx.translate(start.x, start.y);
      ctx.rotate(Math.atan2(end.y - start.y, end.x - start.x));
      ctx.drawImage(
        image,
        64 + (i / segments) * 32,
        form * 64 + 24,
        32 / segments,
        24,
        -0.5,
        -4.5 * bulk,
        distance + 1,
        9 * bulk,
      );
      ctx.restore();
    }
    ctx.save();
    ctx.translate(arm.shoulder.x, arm.shoulder.y);
    ctx.rotate(
      Math.atan2(arm.elbow.y - arm.shoulder.y, arm.elbow.x - arm.shoulder.x),
    );
    ctx.drawImage(
      image,
      4,
      form * 64 + 14,
      28,
      36,
      -4 * bulk,
      -7 * bulk,
      10 * bulk,
      14 * bulk,
    );
    ctx.restore();
    ctx.translate(arm.fist.x, arm.fist.y);
    ctx.rotate(Math.atan2(arm.fist.y - arm.elbow.y, arm.fist.x - arm.elbow.x));
    if (arm.open)
      ctx.drawImage(
        image,
        128 + 84,
        form * 64 + 4,
        44,
        56,
        -7 * bulk,
        -11 * bulk,
        17 * bulk,
        22 * bulk,
      );
    else {
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
