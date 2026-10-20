import { terrainTime, type MissionId } from "../data/missions";
import {
  propsInArea,
  pathCenter,
  groundPatches,
  type WorldProp,
} from "../data/terrain";
import { voyageStage } from "../data/voyage";
import { worldAsset } from "./world-assets";
import { combat } from "../data/combat";
interface WorldView {
  x: number;
  y: number;
  width: number;
  height: number;
}
let tiles: CanvasPattern[] = [];
let source: HTMLImageElement | undefined;
function patterns(ctx: CanvasRenderingContext2D): CanvasPattern[] {
  const image = worldAsset("terrain");
  if (!image) return [];
  if (source === image && tiles.length) return tiles;
  source = image;
  tiles = [];
  for (let i = 0; i < 8; i++) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const sc = c.getContext("2d")!;
    sc.imageSmoothingEnabled = false;
    sc.drawImage(
      image,
      (i % 4) * 128,
      Math.floor(i / 4) * 128,
      128,
      128,
      0,
      0,
      128,
      128,
    );
    const p = ctx.createPattern(c, "repeat");
    if (p) tiles.push(p);
  }
  return tiles;
}
export function drawWorld(
  ctx: CanvasRenderingContext2D,
  view: WorldView,
  seconds: number,
  options: {
    clear?: { x: number; y: number; radius: number };
    lighting?: boolean;
    mission?: MissionId;
    decorations?: boolean;
  } = {},
): void {
  const stage = voyageStage(seconds, options.mission),
    ps = patterns(ctx),
    shore = combat.world.shore;
  ctx.save();
  ctx.fillStyle = ps[3] ?? "#317f96";
  ctx.fillRect(view.x, view.y, view.width, view.height);
  ctx.fillStyle = ps[1] ?? "#c7b47c";
  ctx.fillRect(20, 20, combat.world.width - 40, combat.world.height - 40);
  ctx.fillStyle =
    ps[stage.ground] ?? (stage.id === "desert" ? "#b99961" : "#6b8957");
  ctx.fillRect(
    shore,
    shore,
    combat.world.width - shore * 2,
    combat.world.height - shore * 2,
  );
  if (stage.id === "coast") {
    ctx.fillStyle = "rgba(19,45,45,.2)";
    ctx.fillRect(
      shore,
      shore,
      combat.world.width - shore * 2,
      combat.world.height - shore * 2,
    );
  }
  ctx.save();
  ctx.fillStyle =
    ps[stage.id === "coast" ? 1 : stage.id === "harbor" ? 7 : 5] ?? "#b8a178";
  ctx.globalAlpha = stage.id === "coast" ? 0.72 : 0.8;
  for (const patch of groundPatches) {
    if (
      patch.x + patch.rx < view.x ||
      patch.x - patch.rx > view.x + view.width ||
      patch.y + patch.ry < view.y ||
      patch.y - patch.ry > view.y + view.height
    )
      continue;
    ctx.beginPath();
    const last = patch.points[patch.points.length - 1]!,
      first = patch.points[0]!;
    ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
    patch.points.forEach((point, i) => {
      const next = patch.points[(i + 1) % patch.points.length]!;
      ctx.quadraticCurveTo(
        point.x,
        point.y,
        (point.x + next.x) / 2,
        (point.y + next.y) / 2,
      );
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = ps[stage.path] ?? "#b7a27c";
  ctx.lineWidth = 105;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.86;
  ctx.beginPath();
  const start = Math.max(80, Math.floor((view.x - 160) / 80) * 80),
    end = Math.min(combat.world.width - 80, view.x + view.width + 160);
  for (let x = start; x <= end; x += 80) {
    const y = pathCenter(x);
    if (x === start) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  if (options.decorations !== false)
    drawDecorations(
      ctx,
      view,
      terrainTime(seconds, options.mission),
      options.clear,
    );
  if (options.lighting === false) {
    ctx.restore();
    return;
  }
  const wash = ctx.createRadialGradient(
    view.x + view.width / 2,
    view.y + view.height / 2,
    100,
    view.x + view.width / 2,
    view.y + view.height / 2,
    view.width * 0.7,
  );
  wash.addColorStop(0, "rgba(9,24,36,0)");
  wash.addColorStop(1, "rgba(9,24,36,.2)");
  ctx.fillStyle = wash;
  ctx.fillRect(view.x, view.y, view.width, view.height);
  ctx.restore();
}
function drawDecorations(
  ctx: CanvasRenderingContext2D,
  view: WorldView,
  seconds: number,
  clear?: { x: number; y: number; radius: number },
): void {
  const props = worldAsset("props");
  if (!props) return;
  for (const prop of propsInArea(
    seconds,
    view.x,
    view.y,
    view.width,
    view.height,
  )) {
    const { x, y } = prop;
    if (
      x < view.x - 128 ||
      x > view.x + view.width + 128 ||
      y < view.y - 128 ||
      y > view.y + view.height + 128
    )
      continue;
    if (clear && Math.hypot(x - clear.x, y - clear.y) < clear.radius + 80)
      continue;
    drawWorldProp(ctx, prop);
  }
}

export function drawWorldProp(
  ctx: CanvasRenderingContext2D,
  prop: WorldProp,
): void {
  const props = worldAsset("props");
  if (!props) return;
  const { x, y, id, size } = prop;
  ctx.drawImage(
    props,
    (id % 4) * 128,
    Math.floor(id / 4) * 128,
    128,
    128,
    x - size / 2,
    y - (size * 120) / 128,
    size,
    size,
  );
}
