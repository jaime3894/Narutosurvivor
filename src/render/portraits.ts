import luffy from "../assets/portraits/luffy.json";
import zoro from "../assets/portraits/zoro.json";
import nami from "../assets/portraits/nami.json";
import usopp from "../assets/portraits/usopp.json";
import sanji from "../assets/portraits/sanji.json";
import chopper from "../assets/portraits/chopper.json";
import robin from "../assets/portraits/robin.json";
import franky from "../assets/portraits/franky.json";
import brook from "../assets/portraits/brook.json";
import jinbe from "../assets/portraits/jinbe.json";
import type { CharacterId } from "../data/content";
interface Portrait {
  palette: Readonly<Record<string, string>>;
  rows: readonly string[];
}
export const portraits: Readonly<Record<CharacterId, Portrait>> = {
  luffy,
  zoro,
  nami,
  usopp,
  sanji,
  chopper,
  robin,
  franky,
  brook,
  jinbe,
};
export function paintPortrait(
  ctx: CanvasRenderingContext2D,
  id: CharacterId,
  x: number,
  y: number,
  scale = 1,
  start = 0,
  end = 28,
): void {
  const data = portraits[id];
  for (let row = start; row < end; row++) {
    const pixels = data.rows[row];
    if (!pixels) continue;
    for (let col = 0; col < pixels.length; col++) {
      const key = pixels[col];
      const color = key ? data.palette[key] : undefined;
      if (!color || key === ".") continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x + col * scale),
        Math.round(y + (row - start) * scale),
        scale,
        scale,
      );
    }
  }
}
