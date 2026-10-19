import { voyageStage, type VoyageStage } from "../data/voyage";
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
): void {
  const stage = voyageStage(seconds),
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
  // Senderos de contorno natural, con un claro transitable en el punto de desembarco.
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = ps[stage.path] ?? "#c1ab78";
  ctx.lineWidth = 105;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(100, 720);
  ctx.bezierCurveTo(600, 560, 650, 1140, 1200, 900);
  ctx.bezierCurveTo(1680, 650, 1900, 1250, 2300, 1080);
  ctx.stroke();
  ctx.lineWidth = 76;
  ctx.beginPath();
  ctx.moveTo(1020, 100);
  ctx.bezierCurveTo(1420, 460, 900, 620, 1200, 900);
  ctx.bezierCurveTo(1480, 1170, 1100, 1460, 1380, 1700);
  ctx.stroke();
  ctx.fillStyle = ps[stage.path] ?? "#b7a27c";
  ctx.beginPath();
  ctx.ellipse(1200, 900, 113, 82, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  drawDecorations(ctx, view, stage);
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
  stage: VoyageStage,
): void {
  const props = worldAsset("props");
  if (!props) return;
  for (let gy = 0; gy < 8; gy++)
    for (let gx = 0; gx < 11; gx++) {
      const hash = Math.abs(Math.imul(gx + 17, gy * 71 + 39)),
        x = 150 + gx * 210 + (hash % 65),
        y = 180 + gy * 205 + (hash % 45);
      if (
        (Math.abs(x - 1200) < 125 && Math.abs(y - 900) < 100) ||
        x < view.x - 128 ||
        x > view.x + view.width + 128 ||
        y < view.y - 128 ||
        y > view.y + view.height + 128
      )
        continue;
      const id = stage.props[hash % 4] ?? stage.props[0];
      const size = 104 + (hash % 29);
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
}
