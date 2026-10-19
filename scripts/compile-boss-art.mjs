/** Exporta 4 poses por jefe desde una hoja original de 3 filas × 4 columnas. Config: [{id, source, row}]. */
import { readFile, writeFile } from "node:fs/promises";
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
        const width = image.width,
          height = image.height,
          source = document.createElement("canvas");
        source.width = width;
        source.height = height;
        const sc = source.getContext("2d", { willReadFrequently: true });
        sc.drawImage(image, 0, 0);
        const pixels = sc.getImageData(0, 0, width, height).data;
        // Algunas hojas tienen pies y pelo de filas vecinas contiguos. La división
        // explícita de filas separa las celdas sin eliminar ni inventar píxeles.
        const bandAt = new Int16Array(height);
        if (entry.rowCuts)
          for (let row = 0; row < entry.rowCuts.length - 1; row++)
            bandAt.fill(row, entry.rowCuts[row], entry.rowCuts[row + 1]);
        const labels = new Int32Array(width * height),
          queue = new Int32Array(width * height),
          parts = [];
        for (let start = 0; start < labels.length; start++) {
          if (labels[start] || pixels[start * 4 + 3] <= 100) continue;
          const label = parts.length + 1;
          let head = 0,
            tail = 1,
            x0 = width,
            x1 = 0,
            y0 = height,
            y1 = 0;
          queue[0] = start;
          labels[start] = label;
          while (head < tail) {
            const index = queue[head++],
              x = index % width,
              y = Math.floor(index / width);
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
            for (const next of [
              x > 0 ? index - 1 : -1,
              x < width - 1 ? index + 1 : -1,
              y > 0 ? index - width : -1,
              y < height - 1 ? index + width : -1,
            ]) {
              if (
                next >= 0 &&
                (!entry.rowCuts ||
                  bandAt[Math.floor(next / width)] === bandAt[y]) &&
                !labels[next] &&
                pixels[next * 4 + 3] > 100
              ) {
                labels[next] = label;
                queue[tail++] = next;
              }
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
        const rows = 3,
          columns = 4;
        const biggest = parts
          .filter((p) => p.area > 150)
          .sort((a, b) => b.area - a.area)
          .slice(0, rows * columns)
          .sort((a, b) => a.y + a.h / 2 - b.y - b.h / 2);
        if (biggest.length !== 12) throw new Error("Faltan figuras de jefe");
        const boxes = [];
        for (let row = 0; row < 3; row++)
          boxes.push(
            ...biggest.slice(row * 4, row * 4 + 4).sort((a, b) => a.x - b.x),
          );
        const owners = new Map(boxes.map((b, i) => [b.label, i]));
        for (const part of parts)
          if (!owners.has(part.label) && part.area >= 8) {
            let owner = 0,
              distance = Infinity;
            boxes.forEach((b, i) => {
              const d =
                ((part.x + part.w / 2 - b.x - b.w / 2) / (width / 4)) ** 2 +
                ((part.y + part.h / 2 - b.y - b.h / 2) / (height / rows)) ** 2;
              if (d < distance) {
                owner = i;
                distance = d;
              }
            });
            // No incorporar polvo alejado de la silueta.
            if (distance < 0.45) owners.set(part.label, owner);
          }
        const atlas = document.createElement("canvas");
        atlas.width = 1024;
        atlas.height = 128;
        const ctx = atlas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        const report = [];
        const row = entry.row;
        const rowBoxes = boxes.slice(row * 4, row * 4 + 4);
        const scale = Math.min(
          100 / rowBoxes[0].h,
          180 / Math.max(...rowBoxes.map((b) => b.w)),
          114 / Math.max(...rowBoxes.map((b) => b.h)),
        );
        for (let frame = 0; frame < 4; frame++) {
          const index = row * 4 + frame,
            box = boxes[index];
          const figure = document.createElement("canvas");
          figure.width = box.w;
          figure.height = box.h;
          const fc = figure.getContext("2d"),
            data = fc.createImageData(box.w, box.h);
          let minFoot = box.w,
            maxFoot = 0;
          for (let y = 0; y < box.h; y++)
            for (let x = 0; x < box.w; x++) {
              const src = (box.y + y) * width + box.x + x;
              if (owners.get(labels[src]) !== index) continue;
              const dest = (y * box.w + x) * 4;
              data.data.set(pixels.subarray(src * 4, src * 4 + 4), dest);
              if (y > box.h - Math.max(6, box.h * 0.08)) {
                minFoot = Math.min(minFoot, x);
                maxFoot = Math.max(maxFoot, x);
              }
            }
          fc.putImageData(data, 0, 0);
          const foot = (minFoot + maxFoot) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(frame * 256, 0, 256, 128);
          ctx.clip();
          ctx.drawImage(
            figure,
            Math.round(frame * 256 + 128 - foot * scale),
            Math.round(118 - box.h * scale),
            Math.round(box.w * scale),
            Math.round(box.h * scale),
          );
          ctx.restore();
          report.push({
            row,
            frame,
            width: Math.round(box.w * scale),
            height: Math.round(box.h * scale),
          });
        }
        return { png: atlas.toDataURL().split(",")[1], report };
      },
      { entry, encoded },
    );
    const targetPath = `public/assets/bosses/${entry.id}-v6.png`;
    const png = result.png;
    await writeFile(targetPath, Buffer.from(png, "base64"));
    console.log(entry.id, JSON.stringify(result.report));
  }
} finally {
  await browser.close();
}
