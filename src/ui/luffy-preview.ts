import { createRun } from "../game/simulation";
import { weaponById } from "../data/content";
import { drawLuffyRig } from "../render/luffy-rig";
import { drawSprite, getSpriteAtlas } from "../render/sprites";
import type { Attack } from "../game/types";
export type LuffyPreviewAction = "idle" | "walk" | "punch";
export function createLuffyPreview(): (
  ctx: CanvasRenderingContext2D,
  action: LuffyPreviewAction,
  time: number,
) => void {
  const run = createRun(1, "luffy"),
    definition = weaponById("pistol");
  run.player.position = { x: 0, y: 0 };
  const attack: Attack = {
    id: 1,
    caster: "luffy",
    form: 0,
    weapon: "pistol",
    age: 0,
    windup: definition.windup,
    active: definition.active,
    recovery: definition.recovery,
    direction: { x: 1, y: 0 },
    distance: 62,
    range: definition.range,
    target: { x: 62, y: 0 },
    strikes: [],
    hitIds: [],
    evolved: false,
    damage: definition.damage,
    width: definition.width,
  };
  return (ctx, action, time) => {
    if (action !== "punch") {
      drawSprite(
        ctx,
        getSpriteAtlas("luffy", 0),
        { x: 110, y: 172 },
        "down",
        action,
        time,
        2,
      );
      return;
    }
    const cycle = attack.windup + attack.active + attack.recovery;
    attack.age = time % (cycle + 0.8);
    run.attacks = attack.age < cycle ? [attack] : [];
    ctx.save();
    ctx.translate(65, 172);
    ctx.scale(1.8, 1.8);
    if (run.attacks.length === 0 || !drawLuffyRig(ctx, run, attack, "right"))
      drawSprite(
        ctx,
        getSpriteAtlas("luffy", 0),
        { x: 0, y: 0 },
        "right",
        "idle",
        0,
      );
    ctx.restore();
  };
}
