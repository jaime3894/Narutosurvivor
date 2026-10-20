import { islandOutline } from "../data/island-shape";
import { terrainTime, type MissionId } from "../data/missions";
import {
  propsInArea,
  pathCenter,
  horizontalTracks,
  verticalTracks,
  verticalPath,
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
  for (let i = 0; i < (worldAsset("terrain-extra") ? 20 : 8); i++) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const sc = c.getContext("2d")!;
    sc.imageSmoothingEnabled = false;
    sc.drawImage(
      i >= 8 ? worldAsset("terrain-extra")! : image,
      ((i >= 8 ? i - 8 : i) % 4) * 128,
      Math.floor((i >= 8 ? i - 8 : i) / 4) * 128,
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
    ps = patterns(ctx);
  const borders: Record<
    string,
    { outside: string | CanvasPattern; rim: number; line: string }
  > = {
    coast: { outside: ps[3] ?? "#236782", rim: 1, line: "#d1f0e3" },
    harbor: { outside: ps[3] ?? "#236782", rim: 7, line: "#a4abb2" },
    desert: { outside: ps[3] ?? "#236782", rim: 4, line: "#b58f66" },
    sky: { outside: "#234862", rim: 8, line: "#eefaff" },
    judicial: { outside: ps[3] ?? "#244c6c", rim: 11, line: "#a5b4c5" },
    haunted: { outside: "#111c2a", rim: 13, line: "#736782" },
    war: { outside: "#233c51", rim: 14, line: "#bfdde5" },
    roses: { outside: ps[3] ?? "#316b89", rim: 17, line: "#e1bfbc" },
    samurai: { outside: ps[3] ?? "#23596a", rim: 19, line: "#837664" },
  };
  const border = borders[stage.id] ?? borders.coast!;
  function outline(inset = 0): void {
    const points = islandOutline(inset);
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  }
  ctx.save();
  ctx.fillStyle = border.outside;
  ctx.fillRect(view.x, view.y, view.width, view.height);
  outline();
  ctx.fillStyle = ps[border.rim] ?? "#8b8d8b";
  ctx.fill();
  ctx.strokeStyle = border.line;
  ctx.lineWidth = stage.id === "sky" ? 22 : 9;
  ctx.stroke();
  outline(60);
  ctx.fillStyle = ps[stage.ground] ?? "#71825e";
  ctx.fill();
  if (stage.id === "sky") {
    const points = islandOutline();
    ctx.fillStyle = "#edfaff";
    ctx.strokeStyle = "#c5e5f3";
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      if (
        p.x < view.x - 50 ||
        p.x > view.x + view.width + 50 ||
        p.y < view.y - 50 ||
        p.y > view.y + view.height + 50
      )
        continue;
      for (const [dx, dy, r] of [
        [-14, 2, 16],
        [3, -2, 22],
        [20, 5, 14],
      ]) {
        ctx.beginPath();
        const variation = 0.85 + (Math.sin(p.x * 0.17 + p.y * 0.09) + 1) * 0.16;
        ctx.arc(p.x + dx!, p.y + dy!, r! * variation, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  outline();
  ctx.clip();
  if (stage.id === "coast") {
    ctx.fillStyle = "rgba(19,45,45,.16)";
    outline(60);
    ctx.fill();
  }
  ctx.save();
  ctx.fillStyle =
    ps[stage.id === "coast" ? 1 : stage.id === "harbor" ? 7 : stage.path] ??
    "#b8a178";
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
  for (const [track] of horizontalTracks.entries()) {
    ctx.lineWidth = track === 0 ? 105 : 72;
    ctx.beginPath();
    for (let x = start; x <= end; x += 80) {
      const y = pathCenter(x, track);
      if (x === start) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const yStart = Math.max(80, Math.floor((view.y - 160) / 80) * 80),
    yEnd = Math.min(combat.world.height - 80, view.y + view.height + 160);
  for (const [track] of verticalTracks.entries()) {
    ctx.lineWidth = 66;
    ctx.beginPath();
    for (let y = yStart; y <= yEnd; y += 80) {
      const x = verticalPath(y, track);
      if (y === yStart) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
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
  const props = worldAsset(prop.id >= 12 ? "props-extra" : "props");
  if (!props) return;
  const { x, y, size } = prop;
  const id = prop.id >= 12 ? prop.id - 12 : prop.id;
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

export function worldPattern(
  ctx: CanvasRenderingContext2D,
  index: number,
): CanvasPattern | undefined {
  return patterns(ctx)[index];
}
