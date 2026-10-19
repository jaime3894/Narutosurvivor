import { drawFormEffects } from "./form-effects";
import { casterPosition } from "../game/crew";
import { affinityColors, weaponById } from "../data/content";
import type { Run } from "../game/types";
import { animationProgress, attackEndpoint } from "../game/techniques";
import { firstContact } from "./combat-pose";
import { selectLuffyBodyAction } from "./luffy-pose";
import { ease } from "./motion";
import {
  drawClutch,
  drawCut,
  drawVines,
  drawWeather,
  hitPulse,
} from "./technique-effects";

/** El cuerpo dibuja sus extremidades y equipo. Aquí solo viven efectos de las técnicas. */
export function drawTechniques(
  ctx: CanvasRenderingContext2D,
  run: Run,
  reducedMotion: boolean,
): void {
  const luffyAction = selectLuffyBodyAction(run);
  for (const attack of run.attacks) {
    const definition = weaponById(attack.weapon),
      progress = animationProgress(attack);
    const caster = casterPosition(run, attack.caster),
      origin = { x: caster.x, y: caster.y - 40 };
    const endpoint = attackEndpoint(run, attack),
      target = { x: attack.target.x, y: attack.target.y - 40 };
    const color = affinityColors[definition.affinity],
      angle = Math.atan2(attack.direction.y, attack.direction.x);
    const contact = firstContact(attack),
      pulse = hitPulse(attack);
    const phase = Math.max(
      0,
      (attack.age - contact) /
        Math.max(0.001, attack.windup + attack.active - contact),
    );
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    switch (definition.animation) {
      case "slash":
      case "cutwave":
      case "iai":
        drawCut(ctx, attack, origin, color, reducedMotion);
        break;
      case "chain":
        // El rig mecánico dibuja la única cadena y los dos antebrazos del cuerpo.
        break;
      case "lightning":
      case "cyclone":
        drawWeather(ctx, attack, target, definition.animation === "cyclone");
        break;
      case "clutch":
        drawClutch(ctx, attack, target, reducedMotion);
        break;
      case "vine":
        drawVines(ctx, attack, target);
        break;
      case "pellet":
        // El tirachinas y su goma están en la pose; la munición la mueve el motor.
        break;
      case "kick":
      case "stomp":
      case "hoof": {
        if (pulse <= 0) break;
        const stomp = definition.animation === "stomp";
        ctx.globalAlpha = pulse;
        ctx.strokeStyle =
          attack.caster === "sanji" && attack.form > 0
            ? attack.form === 2
              ? "#93e9ff"
              : "#ffb35e"
            : "#e6d6b2";
        ctx.lineWidth = 2.5;
        if (stomp) {
          ctx.beginPath();
          ctx.ellipse(
            caster.x,
            caster.y + 3,
            attack.range * (1 - pulse * 0.6),
            12 + (1 - pulse) * 16,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        } else {
          const reach = Math.min(attack.distance, attack.range);
          ctx.beginPath();
          ctx.arc(
            origin.x,
            origin.y,
            Math.max(1, reach),
            angle - 0.35,
            angle + 0.35,
          );
          ctx.stroke();
          if (attack.caster === "chopper") {
            ctx.lineWidth = attack.form === 2 ? 5 : 3;
            for (const side of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(endpoint.x + side * 4, endpoint.y - 47);
              ctx.lineTo(endpoint.x + side * 4, endpoint.y - 34);
              ctx.stroke();
            }
          }
        }
        break;
      }
      case "palm": {
        if (attack.form > 0) break;
        if (attack.age < contact || progress.phase !== "active") break;
        ctx.strokeStyle = "#b1e6e3";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8 * (1 - ease(phase));
        for (let i = 0; i < 3; i++) {
          const distance = Math.max(
            1,
            28 + (attack.distance - 28) * ease(phase) - i * 9,
          );
          ctx.beginPath();
          ctx.arc(origin.x, origin.y, distance, angle - 0.65, angle + 0.65);
          ctx.stroke();
        }
        break;
      }
      case "sweep": {
        if (attack.id !== luffyAction?.id || progress.phase !== "active") break;
        const rotation =
          angle + ((attack.age - attack.windup) / attack.active) * Math.PI * 2;
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = "#e6d4ae";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          caster.x - 7,
          caster.y - 27,
          Math.max(1, attack.range * Math.max(0, progress.extension)),
          rotation - (reducedMotion ? 0.15 : 0.4),
          rotation,
        );
        ctx.stroke();
        break;
      }
      case "inflate": {
        if (attack.age < contact || progress.phase !== "active") break;
        ctx.strokeStyle = "#ede0b5";
        ctx.globalAlpha = 0.5 * (1 - ease(phase));
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(
          caster.x,
          caster.y - 15,
          Math.max(1, attack.range * ease(phase)),
          Math.max(1, attack.range * ease(phase) * 0.6),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        break;
      }
      case "stretch":
      case "double":
      case "barrage":
        // Los dos brazos texturizados se dibujan una sola vez en el rig de Luffy.
        break;
    }
    drawFormEffects(
      ctx,
      attack,
      origin,
      { x: endpoint.x, y: endpoint.y - 40 },
      reducedMotion,
    );
    ctx.restore();
  }
}
