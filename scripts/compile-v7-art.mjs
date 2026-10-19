/** Exporta recursos originales aprobados; no genera ni redibuja arte. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
const config = JSON.parse(await readFile(process.argv[2], "utf8"));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  for (const entry of config) {
    const encoded = (await readFile(entry.source)).toString("base64");
    const result = await page.evaluate(
      async ({ entry, encoded }) => {
        const image = new Image();
        image.src = "data:image/png;base64," + encoded;
        await image.decode();
        const w = image.width,
          h = image.height,
          c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, w, h).data;
        const kind = entry.kind,
          columns = kind === "terrain" || kind === "props" ? 4 : 6,
          rows = kind === "icons" ? 6 : kind === "props" ? 3 : 2,
          cell =
            kind === "walk"
              ? 192
              : kind === "props" || kind === "terrain"
                ? 128
                : 64,
          ch = kind === "walk" ? 128 : cell;
        const out = document.createElement("canvas");
        out.width = columns * cell;
        out.height = rows * ch;
        const oc = out.getContext("2d");
        oc.imageSmoothingEnabled = false;
        const reports = [];
        let boxes = [];
        let labels;
        let owners;
        if (kind === "walk") {
          labels = new Int32Array(w * h);
          const queue = new Int32Array(w * h),
            parts = [];
          for (let start = 0; start < w * h; start++) {
            if (labels[start] || pixels[start * 4 + 3] <= 100) continue;
            const label = parts.length + 1;
            let head = 0,
              tail = 1,
              x0 = w,
              y0 = h,
              x1 = 0,
              y1 = 0;
            queue[0] = start;
            labels[start] = label;
            while (head < tail) {
              const index = queue[head++],
                x = index % w,
                y = Math.floor(index / w);
              x0 = Math.min(x0, x);
              x1 = Math.max(x1, x);
              y0 = Math.min(y0, y);
              y1 = Math.max(y1, y);
              for (const next of [
                x > 0 ? index - 1 : -1,
                x < w - 1 ? index + 1 : -1,
                y > 0 ? index - w : -1,
                y < h - 1 ? index + w : -1,
              ])
                if (next >= 0 && !labels[next] && pixels[next * 4 + 3] > 100) {
                  labels[next] = label;
                  queue[tail++] = next;
                }
            }
            parts.push({
              label,
              area: tail,
              x: x0,
              y: y0,
              w: x1 - x0 + 1,
              h: y1 - y0 + 1,
            });
          }
          const big = parts
            .filter((p) => p.area > 500)
            .sort((a, b) => b.area - a.area)
            .slice(0, 12)
            .sort((a, b) => a.y + a.h / 2 - b.y - b.h / 2);
          if (big.length !== 12) throw new Error("Faltan poses de " + entry.id);
          for (let row = 0; row < 2; row++)
            boxes.push(
              ...big.slice(row * 6, row * 6 + 6).sort((a, b) => a.x - b.x),
            );
          owners = new Map(boxes.map((b, i) => [b.label, i]));
          for (const part of parts)
            if (!owners.has(part.label) && part.area >= 8) {
              let nearest = 0,
                best = Infinity;
              boxes.forEach((b, i) => {
                const d =
                  ((part.x + part.w / 2 - b.x - b.w / 2) / (w / 6)) ** 2 +
                  ((part.y + part.h / 2 - b.y - b.h / 2) / (h / 2)) ** 2;
                if (d < best) {
                  best = d;
                  nearest = i;
                }
              });
              if (best < 0.4) owners.set(part.label, nearest);
            }
        } else
          for (let row = 0; row < rows; row++)
            for (let col = 0; col < columns; col++) {
              const x = Math.round((col * w) / columns),
                y = entry.rowCuts?.[row] ?? Math.round((row * h) / rows),
                right = Math.round(((col + 1) * w) / columns),
                bottom =
                  entry.rowCuts?.[row + 1] ??
                  Math.round(((row + 1) * h) / rows);
              let x0 = right,
                y0 = bottom,
                x1 = x,
                y1 = y;
              for (let py = y; py < bottom; py++)
                for (let px = x; px < right; px++)
                  if (pixels[(py * w + px) * 4 + 3] > 32) {
                    x0 = Math.min(x0, px);
                    y0 = Math.min(y0, py);
                    x1 = Math.max(x1, px);
                    y1 = Math.max(y1, py);
                  }
              boxes.push(
                kind === "terrain"
                  ? { x, y, w: right - x, h: bottom - y }
                  : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
              );
            }
        const walkScale =
          kind === "walk"
            ? Math.min(
                100 / (boxes.reduce((sum, b) => sum + b.h, 0) / 12),
                166 / Math.max(...boxes.map((b) => b.w)),
                112 / Math.max(...boxes.map((b) => b.h)),
              )
            : 1;
        for (let i = 0; i < boxes.length; i++) {
          const b = boxes[i],
            col = i % columns,
            row = Math.floor(i / columns);
          if (b.w <= 0 || b.h <= 0) throw new Error("Celda vacía " + i);
          const f = document.createElement("canvas");
          f.width = b.w;
          f.height = b.h;
          const fc = f.getContext("2d");
          if (kind === "walk") {
            const data = fc.createImageData(b.w, b.h);
            for (let y = 0; y < b.h; y++)
              for (let x = 0; x < b.w; x++) {
                const index = (b.y + y) * w + b.x + x;
                if (owners.get(labels[index]) === i)
                  data.data.set(
                    pixels.subarray(index * 4, index * 4 + 4),
                    (y * b.w + x) * 4,
                  );
              }
            fc.putImageData(data, 0, 0);
          } else fc.drawImage(image, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
          const scale =
              kind === "walk"
                ? walkScale
                : kind === "terrain"
                  ? 1
                  : Math.min((cell - 10) / b.w, (ch - 10) / b.h),
            dw = kind === "terrain" ? 128 : Math.round(b.w * scale),
            dh = kind === "terrain" ? 128 : Math.round(b.h * scale);
          const x = col * cell + Math.round((cell - dw) / 2),
            y =
              row * ch +
              (kind === "walk"
                ? 118 - dh
                : kind === "props"
                  ? 120 - dh
                  : Math.round((ch - dh) / 2));
          oc.drawImage(f, x, y, dw, dh);
          reports.push({ i, w: dw, h: dh });
        }
        return { png: out.toDataURL().split(",")[1], reports };
      },
      { entry, encoded },
    );
    const target =
      entry.kind === "walk"
        ? `public/assets/bosses/${entry.id}-walk-v7.png`
        : `public/assets/${entry.kind === "icons" ? "icons" : "world"}/${entry.kind}-v7.png`;
    await mkdir(target.slice(0, target.lastIndexOf("/")), { recursive: true });
    await writeFile(target, Buffer.from(result.png, "base64"));
    console.log(entry.kind, entry.id ?? "", JSON.stringify(result.reports));
  }
} finally {
  await browser.close();
}
