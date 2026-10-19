import { drawLuffyRig } from "./luffy-rig";
import { selectLuffyPunch, selectLuffyBodyAction } from "./luffy-pose";
import { drawLuffyKick } from "./luffy-kick";
import { drawFrankyRig } from "./franky-rig";
import { combatParts } from "./combat-parts";
import { contactReach, ease } from "./motion";
import { selectBodyAttack } from "./combat-pose";
import { drawCombatFighter } from "./combat-fighter";
import { characterNames } from "../data/content";
import type { CharacterId } from "../data/content";
import type { FormTier } from "../data/crew";
import type { Position } from "../core/entity";
import type { Run } from "../game/types";
import { animationProgress } from "../game/techniques";
import { drawSprite, getSpriteAtlas, facingDirection } from "./sprites";
function actor(
  ctx: CanvasRenderingContext2D,
  run: Run,
  id: CharacterId,
  position: Position,
  facing: Position,
  moving: boolean,
  form: FormTier,
  reducedMotion: boolean,
  support: boolean,
): void {
  const attacks = run.attacks.filter((item) => item.caster === id);
  const punch = id === "luffy" ? selectLuffyPunch(run) : undefined;
  const attack =
    id === "luffy" ? selectLuffyBodyAction(run) : selectBodyAttack(run, id);
  const direction = attack
    ? facingDirection(attack.direction.x, attack.direction.y)
    : facingDirection(facing.x, facing.y);
  const hurt = !support && run.player.invulnerable > 0;
  const state = hurt ? "hurt" : attack ? "attack" : moving ? "walk" : "idle";
  const atlas = getSpriteAtlas(id, form);
  const time = reducedMotion ? 0 : attack ? attack.age : run.elapsed;
  ctx.save();
  ctx.fillStyle = support ? "#2c514b" : "#294c43";
  ctx.beginPath();
  ctx.ellipse(
    position.x,
    position.y + 4,
    form === 2 && ["luffy", "chopper", "franky"].includes(id) ? 21 : 14,
    5,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (support) {
    ctx.strokeStyle = "#a1c6bd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(position.x, position.y + 4, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const inflate = attacks.find((item) => item.weapon === "balloon");
  const balloon = combatParts()?.luffyBalloon;
  if (inflate && balloon) {
    const progress = animationProgress(inflate);
    const inflation =
      progress.phase === "windup"
        ? 0.55 * ease(inflate.age / inflate.windup)
        : progress.phase === "active"
          ? 0.55 + 0.45 * contactReach(inflate)
          : 1 -
            ease(
              (inflate.age - inflate.windup - inflate.active) /
                inflate.recovery,
            );
    const scale = 0.62 + inflation * 0.38;
    const row = ["down", "left", "right", "up"].indexOf(direction);
    ctx.drawImage(
      balloon,
      inflate.form * 96,
      row * 80,
      96,
      80,
      position.x - 48 * scale,
      position.y - 74,
      96 * scale,
      80,
    );
  } else if (
    attack?.weapon === "whip" &&
    drawLuffyKick(ctx, run, attack, direction)
  ) {
    // La pierna móvil sustituye a la ausente en esta capa corporal.
  } else if (
    attack &&
    id === "franky" &&
    drawFrankyRig(ctx, attack, position, direction)
  ) {
    // Dos antebrazos propios; el que sale lleva su cadena y regresa al mismo codo.
  } else if (
    attack &&
    id !== "luffy" &&
    drawCombatFighter(ctx, attack, position, direction, reducedMotion)
  ) {
    // La pose ya contiene sus manos, pies y armas; no se superponen otros miembros.
  } else if (!punch || !drawLuffyRig(ctx, run, punch, direction)) {
    drawSprite(ctx, atlas, position, direction, state, time);
  }
  if (id === "luffy" && form > 0 && !reducedMotion) {
    ctx.strokeStyle = "#e9e6da";
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const drift = (time * 0.8 + i * 0.33) % 1;
      ctx.beginPath();
      ctx.arc(
        position.x - 21 + i * 20,
        position.y - 24 - drift * 35,
        4 + drift * 4,
        Math.PI,
        Math.PI * 2.3,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (id === "brook" && form > 0) {
    ctx.strokeStyle = "#a9dfef";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(position.x, position.y - 28, 31, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!support && run.transformTime > 0) {
    ctx.globalAlpha = Math.min(1, run.transformTime * 2);
    ctx.strokeStyle = "#f5d897";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      position.x,
      position.y - 15,
      24 + (0.7 - run.transformTime) * 55,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (support) {
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#d1e3c4";
    ctx.fillText(characterNames[id], position.x, position.y + 17);
  }
  ctx.restore();
}
export function drawFighter(
  ctx: CanvasRenderingContext2D,
  run: Run,
  reducedMotion: boolean,
): void {
  const actors = run.nakama.map((item) => ({
    id: item.character,
    position: item.position,
    facing: item.facing,
    moving: item.moving,
    form: 0 as FormTier,
    support: true,
  }));
  actors.push({
    id: run.character,
    position: run.player.position,
    facing: run.player.facing,
    moving: Math.hypot(run.player.velocity.x, run.player.velocity.y) > 0,
    form: run.form,
    support: false,
  });
  for (const item of actors.sort((a, b) => a.position.y - b.position.y))
    actor(
      ctx,
      run,
      item.id,
      item.position,
      item.facing,
      item.moving,
      item.form,
      reducedMotion,
      item.support,
    );
}
