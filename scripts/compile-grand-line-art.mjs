/** Empaquetado de arte original: extrae figuras RGBA, alinea pies y respeta la identidad de cada fila. */
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const config = JSON.parse(await readFile(process.argv[2], "utf8"));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  for (const job of config) {
    const encoded = (await readFile(job.source)).toString("base64");
    const outputs = await page.evaluate(
      async ({ job, encoded }) => {
        const image = new Image();
        image.src = "data:image/png;base64," + encoded;
        await image.decode();
        const src = document.createElement("canvas");
        src.width = image.width;
        src.height = image.height;
        const sc = src.getContext("2d", { willReadFrequently: true });
        sc.drawImage(image, 0, 0);
        const pixels = sc.getImageData(0, 0, src.width, src.height).data;
        if (job.kind === "tiles") {
          const c = document.createElement("canvas");
          c.width = 512;
          c.height = 384;
          const ctx = c.getContext("2d");
          ctx.imageSmoothingEnabled = false;
          for (let i = 0; i < 12; i++)
            ctx.drawImage(
              image,
              ((i % 4) * image.width) / 4,
              (Math.floor(i / 4) * image.height) / 3,
              image.width / 4,
              image.height / 3,
              (i % 4) * 128,
              Math.floor(i / 4) * 128,
              128,
              128,
            );
          return [{ id: "terrain", png: c.toDataURL().split(",")[1] }];
        }
        const rows = job.kind === "poses" ? 3 : 6,
          cols = job.kind === "walk" ? 6 : 4;
        const counts = Array.from({ length: src.height }, (_, y) => {
          let count = 0;
          for (let x = 0; x < src.width; x++)
            if (pixels[(y * src.width + x) * 4 + 3] > 110) count++;
          return count;
        });
        const cuts = [0];
        for (let row = 1; row < rows; row++) {
          const expected = (row * src.height) / rows,
            reach = Math.floor((src.height / rows) * 0.22);
          let best = Math.floor(expected),
            score = Infinity;
          for (
            let y = Math.max(cuts.at(-1) + 20, Math.floor(expected - reach));
            y < Math.min(src.height - 20, expected + reach);
            y++
          ) {
            const value = counts[y] + Math.abs(y - expected) * 0.001;
            if (value < score) {
              score = value;
              best = y;
            }
          }
          cuts.push(best);
        }
        cuts.push(src.height);
        const frames = [];
        for (let row = 0; row < rows; row++) {
          const top = cuts[row],
            bottom = cuts[row + 1],
            labels = new Int32Array(src.width * (bottom - top)),
            parts = [];
          for (let start = 0; start < labels.length; start++) {
            if (
              labels[start] ||
              pixels[
                ((top + Math.floor(start / src.width)) * src.width +
                  (start % src.width)) *
                  4 +
                  3
              ] <= 110
            )
              continue;
            const label = parts.length + 1,
              queue = [start];
            labels[start] = label;
            let x0 = src.width,
              x1 = 0,
              y0 = bottom,
              y1 = top;
            for (let head = 0; head < queue.length; head++) {
              const at = queue[head],
                x = at % src.width,
                y = Math.floor(at / src.width);
              x0 = Math.min(x0, x);
              x1 = Math.max(x1, x);
              y0 = Math.min(y0, top + y);
              y1 = Math.max(y1, top + y);
              for (const next of [
                x > 0 ? at - 1 : -1,
                x < src.width - 1 ? at + 1 : -1,
                y > 0 ? at - src.width : -1,
                y < bottom - top - 1 ? at + src.width : -1,
              ])
                if (
                  next >= 0 &&
                  !labels[next] &&
                  pixels[
                    ((top + Math.floor(next / src.width)) * src.width +
                      (next % src.width)) *
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
              x1,
              y0,
              y1,
              w: x1 - x0 + 1,
              h: y1 - y0 + 1,
            });
          }
          const main = parts
            .sort((a, b) => b.area - a.area)
            .slice(0, cols)
            .sort((a, b) => a.x0 - b.x0);
          if (main.length !== cols || main.some((p) => p.area < 300))
            throw new Error(`Fila incompleta ${job.kind}:${row}`);
          for (const p of main) {
            const c = document.createElement("canvas");
            c.width = p.w;
            c.height = p.h;
            const ctx = c.getContext("2d"),
              data = ctx.createImageData(p.w, p.h);
            for (let y = 0; y < p.h; y++)
              for (let x = 0; x < p.w; x++)
                if (
                  labels[(p.y0 + y - top) * src.width + p.x0 + x] === p.label
                ) {
                  const i = ((p.y0 + y) * src.width + p.x0 + x) * 4;
                  data.data.set(pixels.subarray(i, i + 4), (y * p.w + x) * 4);
                }
            ctx.putImageData(data, 0, 0);
            let left = p.w,
              right = 0;
            for (
              let y = Math.max(0, p.h - Math.max(4, Math.round(p.h * 0.04)));
              y < p.h;
              y++
            )
              for (let x = 0; x < p.w; x++)
                if (data.data[(y * p.w + x) * 4 + 3] > 110) {
                  left = Math.min(left, x);
                  right = Math.max(right, x);
                }
            frames.push({
              figure: c,
              w: p.w,
              h: p.h,
              foot: (left + right) / 2,
            });
          }
        }
        if (job.kind === "props") {
          const c = document.createElement("canvas");
          c.width = 512;
          c.height = 768;
          const ctx = c.getContext("2d");
          ctx.imageSmoothingEnabled = false;
          frames.forEach((f, i) => {
            const scale = Math.min(
                56 / Math.max(f.foot, f.w - f.foot),
                108 / f.h,
              ),
              w = Math.round(f.w * scale),
              h = Math.round(f.h * scale);
            ctx.drawImage(
              f.figure,
              0,
              0,
              f.w,
              f.h,
              (i % 4) * 128 + 64 - Math.round(f.foot * scale),
              Math.floor(i / 4) * 128 + 120 - h,
              w,
              h,
            );
          });
          return [{ id: "props", png: c.toDataURL().split(",")[1] }];
        }
        if (job.kind === "enemies")
          return job.ids.map((id, index) => {
            const own = frames.slice(index * 8, index * 8 + 8),
              c = document.createElement("canvas");
            c.width = 960;
            c.height = 320;
            const ctx = c.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            const scale = Math.min(
              58 / Math.max(...own.map((f) => f.h)),
              28 / Math.max(...own.map((f) => Math.max(f.foot, f.w - f.foot))),
            );
            const directions = [
                [0, 1],
                [4, 5],
                [6, 7],
                [2, 3],
              ],
              patterns = [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1];
            directions.forEach((pair, row) =>
              patterns.forEach((phase, col) => {
                const f = own[pair[phase]],
                  w = Math.round(f.w * scale),
                  h = Math.round(f.h * scale);
                ctx.drawImage(
                  f.figure,
                  0,
                  0,
                  f.w,
                  f.h,
                  col * 64 + 32 - Math.round(f.foot * scale),
                  row * 80 + 74 - h,
                  w,
                  h,
                );
              }),
            );
            return { id, png: c.toDataURL().split(",")[1] };
          });
        return job.ids.map((id, index) => {
          const own = frames.slice(
            index * (job.kind === "walk" ? 12 : 4),
            (index + 1) * (job.kind === "walk" ? 12 : 4),
          );
          const cell = job.kind === "walk" ? 192 : 256,
            c = document.createElement("canvas");
          c.width = cell * (job.kind === "walk" ? 6 : 4);
          c.height = job.kind === "walk" ? 256 : 128;
          const ctx = c.getContext("2d");
          ctx.imageSmoothingEnabled = false;
          const scale = Math.min(
            108 / Math.max(...own.map((f) => f.h)),
            (cell / 2 - 12) /
              Math.max(...own.map((f) => Math.max(f.foot, f.w - f.foot))),
          );
          own.forEach((f, i) => {
            const w = Math.round(f.w * scale),
              h = Math.round(f.h * scale);
            ctx.drawImage(
              f.figure,
              0,
              0,
              f.w,
              f.h,
              (i % (job.kind === "walk" ? 6 : 4)) * cell +
                cell / 2 -
                Math.round(f.foot * scale),
              Math.floor(i / (job.kind === "walk" ? 6 : 4)) * 128 + 118 - h,
              w,
              h,
            );
          });
          return { id, png: c.toDataURL().split(",")[1] };
        });
      },
      { job, encoded },
    );
    await mkdir("docs/art-source", { recursive: true });
    if (job.source !== `docs/art-source/${job.name}-v11.png`)
      await copyFile(job.source, `docs/art-source/${job.name}-v11.png`);
    for (const output of outputs) {
      const path =
        job.kind === "props" || job.kind === "tiles"
          ? `public/assets/world/${output.id}-v11.png`
          : job.kind === "enemies"
            ? `public/assets/enemies/${output.id}-v11.png`
            : `public/assets/bosses/${output.id}${job.kind === "walk" ? "-walk" : ""}-v11.png`;
      await writeFile(path, Buffer.from(output.png, "base64"));
      console.log(path);
    }
  }
} finally {
  await browser.close();
}
