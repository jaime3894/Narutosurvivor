/** Integra las hojas originales aprobadas de dos jefes. Recorta y alinea; no redibuja sprites. */
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const config = JSON.parse(await readFile(process.argv[2], "utf8"));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  for (const kind of ["poses", "walk"]) {
    const encoded = (await readFile(config[kind])).toString("base64");
    const results = await page.evaluate(
      async ({ encoded, kind }) => {
        const image = new Image();
        image.src = "data:image/png;base64," + encoded;
        await image.decode();
        const source = document.createElement("canvas");
        source.width = image.width;
        source.height = image.height;
        const sc = source.getContext("2d", { willReadFrequently: true });
        sc.drawImage(image, 0, 0);
        const pixels = sc.getImageData(0, 0, source.width, source.height).data;
        const columns = kind === "walk" ? 6 : 4,
          rows = kind === "walk" ? 4 : 2;
        const boxes = [];
        for (let row = 0; row < rows; row++)
          for (let col = 0; col < columns; col++) {
            const left = Math.round((col * image.width) / columns),
              right = Math.round(((col + 1) * image.width) / columns),
              top = Math.round((row * image.height) / rows),
              bottom = Math.round(((row + 1) * image.height) / rows);
            const cw = right - left,
              ch = bottom - top,
              labels = new Int32Array(cw * ch),
              parts = [];
            for (let start = 0; start < labels.length; start++) {
              if (
                labels[start] ||
                pixels[
                  ((top + Math.floor(start / cw)) * image.width +
                    left +
                    (start % cw)) *
                    4 +
                    3
                ] <= 100
              )
                continue;
              const label = parts.length + 1,
                queue = [start];
              labels[start] = label;
              let x0 = right,
                x1 = left,
                y0 = bottom,
                y1 = top;
              for (let head = 0; head < queue.length; head++) {
                const at = queue[head],
                  x = at % cw,
                  y = Math.floor(at / cw);
                x0 = Math.min(x0, left + x);
                x1 = Math.max(x1, left + x);
                y0 = Math.min(y0, top + y);
                y1 = Math.max(y1, top + y);
                for (const next of [
                  x > 0 ? at - 1 : -1,
                  x < cw - 1 ? at + 1 : -1,
                  y > 0 ? at - cw : -1,
                  y < ch - 1 ? at + cw : -1,
                ])
                  if (
                    next >= 0 &&
                    !labels[next] &&
                    pixels[
                      ((top + Math.floor(next / cw)) * image.width +
                        left +
                        (next % cw)) *
                        4 +
                        3
                    ] > 100
                  ) {
                    labels[next] = label;
                    queue.push(next);
                  }
              }
              parts.push({ label, area: queue.length, x0, x1, y0, y1 });
            }
            const main = [...parts].sort((a, b) => b.area - a.area)[0];
            if (!main || main.area > cw * ch * 0.85)
              throw new Error(
                `Celda sin transparencia o vacía ${kind}:${row}:${col}`,
              );
            const accepted = parts.filter(
              (p) =>
                p === main ||
                (p.area >= 8 &&
                  p.x0 <= main.x1 + 8 &&
                  p.x1 >= main.x0 - 8 &&
                  p.y0 <= main.y1 + 8 &&
                  p.y1 >= main.y0 - 8),
            );
            const set = new Set(accepted.map((p) => p.label));
            const x0 = Math.min(...accepted.map((p) => p.x0)),
              x1 = Math.max(...accepted.map((p) => p.x1)),
              y0 = Math.min(...accepted.map((p) => p.y0)),
              y1 = Math.max(...accepted.map((p) => p.y1));
            const figure = document.createElement("canvas");
            figure.width = x1 - x0 + 1;
            figure.height = y1 - y0 + 1;
            const fc = figure.getContext("2d"),
              data = fc.createImageData(figure.width, figure.height);
            for (let y = y0; y <= y1; y++)
              for (let x = x0; x <= x1; x++)
                if (set.has(labels[(y - top) * cw + x - left])) {
                  const src = (y * image.width + x) * 4;
                  data.data.set(
                    pixels.subarray(src, src + 4),
                    ((y - y0) * figure.width + x - x0) * 4,
                  );
                }
            fc.putImageData(data, 0, 0);
            let footLeft = figure.width,
              footRight = 0;
            for (
              let y = Math.max(
                0,
                figure.height - Math.max(6, Math.round(figure.height * 0.08)),
              );
              y < figure.height;
              y++
            )
              for (let x = 0; x < figure.width; x++)
                if (data.data[(y * figure.width + x) * 4 + 3] > 100) {
                  footLeft = Math.min(footLeft, x);
                  footRight = Math.max(footRight, x);
                }
            boxes.push({
              foot: (footLeft + footRight) / 2,
              x: x0,
              y: y0,
              w: figure.width,
              h: figure.height,
              figure,
            });
          }
        return [0, 1].map((character) => {
          const per = kind === "walk" ? 12 : 4,
            own = boxes.slice(character * per, (character + 1) * per);
          const scale = Math.min(
            100 / own[0].h,
            112 / Math.max(...own.map((b) => b.h)),
            (kind === "walk" ? 166 : 210) / Math.max(...own.map((b) => b.w)),
          );
          const canvas = document.createElement("canvas");
          canvas.width = kind === "walk" ? 1152 : 1024;
          canvas.height = kind === "walk" ? 256 : 128;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = false;
          own.forEach((b, i) => {
            const cell = kind === "walk" ? 192 : 256,
              col = i % columns,
              row = Math.floor(i / columns),
              w = Math.round(b.w * scale),
              h = Math.round(b.h * scale);
            ctx.drawImage(
              b.figure,
              0,
              0,
              b.w,
              b.h,
              Math.round(col * cell + cell / 2 - b.foot * scale),
              row * 128 + 118 - h,
              w,
              h,
            );
          });
          return {
            png: canvas.toDataURL().split(",")[1],
            width: canvas.width,
            height: canvas.height,
          };
        });
      },
      { encoded, kind },
    );
    for (const [i, id] of ["mr1", "crocodile"].entries()) {
      const path = `public/assets/bosses/${id}${kind === "walk" ? "-walk" : ""}-v9.png`;
      await writeFile(path, Buffer.from(results[i].png, "base64"));
      console.log(path, results[i].width, results[i].height);
    }
  }
} finally {
  await browser.close();
}
