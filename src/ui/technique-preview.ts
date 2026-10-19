import type { CharacterId, WeaponId } from "../data/content";
import { weaponById } from "../data/content";
import type { FormTier } from "../data/crew";
import { createRun } from "../game/simulation";
import type { Attack, Run } from "../game/types";
import { drawFighter } from "../render/fighter";
import { drawTechniques } from "../render/techniques";
import { drawProjectile } from "../render/projectile";
import { firstContact } from "../render/combat-pose";
import { drawSprite, getSpriteAtlas, type Direction } from "../render/sprites";

export function createTechniquePreview(): (
  ctx: CanvasRenderingContext2D,
  id: CharacterId,
  form: FormTier,
  weapon: WeaponId,
  direction: Direction,
  time: number,
) => void {
  let cached: { key: string; run: Run; attack: Attack } | undefined;
  return (ctx, id, form, weapon, direction, time) => {
    const key = `${id}:${form}:${weapon}:${direction}`;
    if (cached?.key !== key) {
      const run = createRun(1, id),
        definition = weaponById(weapon);
      const vector =
        direction === "left"
          ? { x: -1, y: 0 }
          : direction === "up"
            ? { x: 0, y: -1 }
            : direction === "down"
              ? { x: 0, y: 1 }
              : { x: 1, y: 0 };
      run.form = form;
      run.player.position = { x: 0, y: 0 };
      run.player.invulnerable = 0;
      const count = definition.strikes,
        active = definition.active,
        at = definition.windup + Math.min(active * 0.25, 0.04);
      const attack: Attack = {
        id: 1,
        caster: id,
        form,
        weapon,
        age: 0,
        windup: definition.windup,
        active,
        recovery: definition.recovery,
        direction: vector,
        distance: 55,
        range: 65,
        target: { x: vector.x * 55, y: vector.y * 55 },
        strikes: Array.from({ length: count }, (_, index) => ({
          at: at + (count > 1 ? (index / count) * active * 0.7 : 0),
          index,
          fired: false,
        })),
        hitIds: [],
        evolved: false,
        damage: 0,
        width: 18,
      };
      cached = { key, run, attack };
    }
    const { run, attack } = cached,
      cycle = attack.windup + attack.active + attack.recovery;
    // Ralentí de demostración: conserva el orden relativo de los tiempos del motor.
    attack.age = (time * 0.65) % (cycle + 0.55);
    run.attacks = attack.age < cycle ? [attack] : [];
    ctx.save();
    ctx.translate(
      direction === "left" ? 140 : direction === "right" ? 80 : 110,
      172,
    );
    ctx.scale(1.55, 1.55);
    if (run.attacks.length) {
      drawFighter(ctx, run, false);
      drawTechniques(ctx, run, true);
      if (weapon === "firestar" && attack.age >= firstContact(attack)) {
        const travel = (attack.age - firstContact(attack)) * 160;
        drawProjectile(ctx, {
          id: 1,
          weapon,
          caster: id,
          form,
          position: {
            x: attack.direction.x * travel,
            y: attack.direction.y * travel,
          },
          origin: { x: 0, y: 0 },
          velocity: {
            x: attack.direction.x * 580,
            y: attack.direction.y * 580,
          },
          damage: 0,
          life: 1,
          evolved: false,
        });
      }
    } else
      drawSprite(
        ctx,
        getSpriteAtlas(id, form),
        { x: 0, y: 0 },
        direction,
        "idle",
        0,
      );
    ctx.restore();
  };
}
