/** Empaqueta seis poses y doce pasos originales, sin redibujar ni incluir fragmentos de celdas vecinas. */
import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
const source = process.argv[2];
if (!source) throw new Error("Indica la hoja original RGBA");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const sheets = await page.evaluate(
    async (encoded) => {
      const image = new Image();
      image.src = "data:image/png;base64," + encoded;
      await image.decode();
      const c = document.createElement("canvas");
      c.width = image.width;
      c.height = image.height;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data,
        frames = [];
      const cuts = [0, 336, 663, c.height];
      for (let row = 0; row < 3; row++) {
        const top = cuts[row],
          bottom = cuts[row + 1],
          height = bottom - top,
          labels = new Int32Array(c.width * height),
          parts = [];
        for (let start = 0; start < labels.length; start++) {
          if (
            labels[start] ||
            data[
              ((top + Math.floor(start / c.width)) * c.width +
                (start % c.width)) *
                4 +
                3
            ] <= 110
          )
            continue;
          const label = parts.length + 1,
            queue = [start];
          labels[start] = label;
          let x0 = c.width,
            x1 = 0,
            y0 = bottom,
            y1 = top;
          for (let head = 0; head < queue.length; head++) {
            const at = queue[head],
              x = at % c.width,
              y = Math.floor(at / c.width);
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, top + y);
            y1 = Math.max(y1, top + y);
            for (const next of [
              x > 0 ? at - 1 : -1,
              x < c.width - 1 ? at + 1 : -1,
              y > 0 ? at - c.width : -1,
              y < height - 1 ? at + c.width : -1,
            ])
              if (
                next >= 0 &&
                !labels[next] &&
                data[
                  ((top + Math.floor(next / c.width)) * c.width +
                    (next % c.width)) *
                    4 +
                    3
                ] > 110
              ) {
                labels[next] = label;
                queue.push(next);
              }
          }
          parts.push({
            label,
            area: queue.length,
            x0,
            y0,
            w: x1 - x0 + 1,
            h: y1 - y0 + 1,
          });
        }
        const main = parts
          .sort((a, b) => b.area - a.area)
          .slice(0, 6)
          .sort((a, b) => a.x0 - b.x0);
        if (main.length !== 6 || main.some((p) => p.area < 10000))
          throw new Error("Fila incompleta");
        for (const part of main) {
          const figure = document.createElement("canvas");
          figure.width = part.w;
          figure.height = part.h;
          const fc = figure.getContext("2d"),
            pixels = fc.createImageData(part.w, part.h);
          for (let y = 0; y < part.h; y++)
            for (let x = 0; x < part.w; x++) {
              const sx = part.x0 + x,
                sy = part.y0 + y;
              if (labels[(sy - top) * c.width + sx] === part.label)
                pixels.data.set(
                  data.subarray(
                    (sy * c.width + sx) * 4,
                    (sy * c.width + sx) * 4 + 4,
                  ),
                  (y * part.w + x) * 4,
                );
            }
          fc.putImageData(pixels, 0, 0);
          frames.push({ ...part, figure });
        }
      }
      const output = [];
      for (const kind of ["poses", "walk"]) {
        const out = document.createElement("canvas");
        out.width = kind === "poses" ? 1536 : 1152;
        out.height = kind === "poses" ? 128 : 256;
        const oc = out.getContext("2d");
        oc.imageSmoothingEnabled = false;
        const selected =
            kind === "poses" ? frames.slice(0, 6) : frames.slice(6),
          cell = kind === "poses" ? 256 : 192,
          scale = 108 / Math.max(...frames.map((f) => f.h));
        selected.forEach((f, i) => {
          const w = Math.round(f.w * scale),
            h = Math.round(f.h * scale);
          oc.drawImage(
            f.figure,
            0,
            0,
            f.w,
            f.h,
            (i % 6) * cell + Math.floor((cell - w) / 2),
            Math.floor(i / 6) * 128 + 118 - h,
            w,
            h,
          );
        });
        output.push({
          kind,
          encoded: out.toDataURL("image/png").split(",")[1],
        });
      }
      return output;
    },
    (await readFile(source)).toString("base64"),
  );
  await mkdir("public/assets/bosses", { recursive: true });
  for (const s of sheets)
    await writeFile(
      `public/assets/bosses/imu-${s.kind === "walk" ? "walk-" : ""}v10.png`,
      Buffer.from(s.encoded, "base64"),
    );
  await mkdir("docs/art-source", { recursive: true });
  await copyFile(source, "docs/art-source/imu-v10.png");
} finally {
  await browser.close();
}
