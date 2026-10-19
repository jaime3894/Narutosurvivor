import { createRandom } from '../core/random';
export function drawIsland(canvas: HTMLCanvasElement, seed: number): void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D no disponible');
  const random = createRandom(seed);
  canvas.width = 640;
  canvas.height = 360;
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#174b5d';
  context.fillRect(0, 0, 640, 360);
  for (let i = 0; i < 160; i++) {
    context.fillStyle = i % 2 ? '#24677a' : '#1c5668';
    context.fillRect(Math.floor(random() * 160) * 4, Math.floor(random() * 90) * 4, 12, 2);
  }
  const land = (color: string, x: number, y: number, w: number, h: number): void => {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
  };
  land('#dab979', 136, 96, 368, 192);
  land('#dab979', 168, 72, 304, 240);
  land('#669761', 168, 104, 304, 176);
  land('#78a269', 200, 88, 240, 208);
  for (let i = 0; i < 25; i++) {
    const x = 208 + Math.floor(random() * 220);
    const y = 108 + Math.floor(random() * 160);
    land('#547d56', x, y, 4, 4);
  }
  for (const [x, y] of [[200, 136], [416, 120], [392, 240]]) {
    if (x === undefined || y === undefined) continue;
    land('#795c43', x, y, 8, 32);
    land('#315e49', x - 16, y - 12, 40, 16);
    land('#3e7752', x - 8, y - 20, 24, 32);
  }
  land('#ad7c52', 300, 272, 40, 64);
  for (let y = 276; y < 336; y += 12) land('#70533d', 300, y, 40, 2);
  land('#19313e', 312, 184, 16, 20);
  land('#e6a578', 312, 176, 16, 12);
  land('#df7655', 308, 192, 24, 12);
  land('#eac777', 304, 172, 32, 6);
  land('#eac777', 312, 164, 16, 8);
}
