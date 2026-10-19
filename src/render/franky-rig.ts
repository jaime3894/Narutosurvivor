import type { Position } from "../core/entity";
import type { Attack } from "../game/types";
import type { Direction } from "./sprites";
import { mechanicalReach } from "./technique-effects";
import { combatParts } from "./combat-parts";
import { frankyElbows } from "../data/technique-joints";

export function frankyArms(
  root: Position,
  attack: Attack,
  direction: Direction,
): readonly { elbow: Position; fist: Position; extended: boolean }[] {
  const reach = mechanicalReach(attack);
  return frankyElbows[attack.form][direction].map((anchor, index) => {
    const elbow = { x: root.x + anchor.x, y: root.y + anchor.y };
    const rest = { x: elbow.x + Math.sign(anchor.x) * 5, y: elbow.y + 27 };
    const amount = index === 1 ? reach : 0;
    const goal = {
      x: root.x + attack.direction.x * attack.distance,
      y: root.y - 40 + attack.direction.y * attack.distance,
    };
    return {
      elbow,
      fist: {
        x: rest.x + (goal.x - rest.x) * amount,
        y: rest.y + (goal.y - rest.y) * amount,
      },
      extended: amount > 0.005,
    };
  });
}
export function drawFrankyRig(
  ctx: CanvasRenderingContext2D,
  attack: Attack,
  root: Position,
  direction: Direction,
): boolean {
  const parts = combatParts();
  if (!parts) return false;
  const arms = frankyArms(root, attack, direction),
    row = ["down", "left", "right", "up"].indexOf(direction);
  const drawArm = (index: number): void => {
    const arm = arms[index];
    if (!arm) return;
    const angle = Math.atan2(
      arm.fist.y - arm.elbow.y,
      arm.fist.x - arm.elbow.x,
    );
    const length = Math.hypot(
      arm.fist.x - arm.elbow.x,
      arm.fist.y - arm.elbow.y,
    );
    const size = attack.form === 2 ? 38 : 32,
      chain = Math.max(0, length - size + 2);
    ctx.save();
    ctx.translate(arm.elbow.x, arm.elbow.y);
    ctx.rotate(angle);
    if (chain > 1) {
      ctx.strokeStyle = "#344e5c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(chain, 0);
      ctx.stroke();
      ctx.strokeStyle = "#dae6df";
      ctx.lineWidth = 1.5;
      for (let x = 2; x < chain; x += 6) {
        ctx.beginPath();
        ctx.ellipse(
          x,
          0,
          3.5,
          2,
          x % 12 === 2 ? 0 : Math.PI / 2,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }
    ctx.drawImage(
      parts.frankyFists,
      attack.form * 64,
      0,
      64,
      64,
      chain - 2,
      -size / 2,
      size,
      size,
    );
    ctx.restore();
  };
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawArm(0);
  ctx.drawImage(
    parts.frankyBodies,
    attack.form * 96,
    row * 80,
    96,
    80,
    root.x - 48,
    root.y - 74,
    96,
    80,
  );
  drawArm(1);
  ctx.restore();
  return true;
}
