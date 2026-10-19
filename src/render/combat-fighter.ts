import type { Position } from "../core/entity";
import type { Attack } from "../game/types";
import { combatLayout } from "../data/combat-art";
import { combatAtlas } from "./combat-assets";
import { combatPose, zoroBladeCount } from "./combat-pose";
import type { Direction } from "./sprites";

export function drawCombatFighter(
  ctx: CanvasRenderingContext2D,
  attack: Attack,
  root: Position,
  direction: Direction,
  reducedMotion: boolean,
): boolean {
  const atlas = combatAtlas(attack.caster);
  if (!atlas) return false;
  const pose = combatPose(attack);
  const sign = direction === "left" ? -1 : 1;
  const tier =
    attack.caster === "zoro" ? Math.min(1, attack.form) : attack.form;
  const row = tier * 2 + (direction === "up" ? 1 : 0);
  const { cellWidth, cellHeight, anchorX, anchorY } = combatLayout;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(
    root.x + attack.direction.x * pose.advance,
    root.y + attack.direction.y * pose.advance + pose.lift,
  );
  ctx.scale(sign, 1);
  // Concassé: talón descendente desde una postura aérea, sin inventar una tercera pierna.
  ctx.translate(0, -25);
  ctx.rotate(pose.tilt);
  ctx.translate(0, 25);
  const draw = (offset: number, alpha: number): void => {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(
      atlas,
      pose.frame * cellWidth,
      row * cellHeight,
      cellWidth,
      cellHeight,
      -anchorX + offset,
      -anchorY,
      cellWidth,
      cellHeight,
    );
    ctx.restore();
  };
  // Asura es una manifestación de tres cuerpos Santoryu: 3 cabezas, 6 brazos, 9 hojas.
  // Sus copias persistentes son anatomía del estilo, no manos/espadas de estela.
  if (attack.caster === "zoro" && attack.form === 2) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-120, -140, 240, 116);
    ctx.rect(-120, -24, 76, 70);
    ctx.rect(44, -24, 76, 70);
    ctx.clip();
    ctx.filter = "sepia(1) saturate(3) hue-rotate(215deg)";
    ctx.translate(0, -4);
    const manifestations = zoroBladeCount(attack.form) / 3 - 1;
    for (let copy = 0; copy < manifestations; copy++)
      draw(copy === 0 ? -11 : 11, reducedMotion ? 0.5 : 0.65);
    ctx.restore();
  }
  draw(0, 1);
  ctx.restore();
  return true;
}
