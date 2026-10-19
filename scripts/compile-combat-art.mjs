/** Exporta poses originales ya dibujadas. Config: [{id, source, heights:[70,70,72]}]. */
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
        const rows = entry.sourceRows ?? (entry.id === "zoro" ? 4 : 6);
        const biggest = parts
          .filter((p) => p.area > 150)
          .sort((a, b) => b.area - a.area)
          .slice(0, rows * 6)
          .sort((a, b) => a.y + a.h / 2 - b.y - b.h / 2);
        if (biggest.length !== rows * 6)
          throw new Error(`${entry.id}: faltan cuerpos`);
        const boxes = [];
        for (let row = 0; row < rows; row++)
          boxes.push(
            ...biggest
              .slice(row * 6, (row + 1) * 6)
              .sort((a, b) => a.x + a.w / 2 - b.x - b.w / 2),
          );
        const owners = new Map(boxes.map((b, i) => [b.label, i]));
        for (const part of parts)
          if (!owners.has(part.label) && part.area >= 8) {
            let owner = 0,
              distance = Infinity;
            boxes.forEach((b, i) => {
              const d =
                ((part.x + part.w / 2 - b.x - b.w / 2) / (width / 6)) ** 2 +
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
        atlas.width = 1152;
        atlas.height = 768;
        const ctx = atlas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        const report = [];
        const rowMap =
          entry.rowMap ?? Array.from({ length: rows }, (_, i) => i);
        for (let row = 0; row < rowMap.length; row++) {
          const sourceRow = rowMap[row];
          const rowBoxes = boxes.slice(sourceRow * 6, sourceRow * 6 + 6);
          // Escala única por fila, calculada con guardias y contacto, sin encoger al alzar la espada.
          const reference = [0, 2, 3, 5]
            .map((i) => rowBoxes[i].h)
            .sort((a, b) => a - b);
          const bodyHeight = entry.heights[Math.floor(row / 2)] ?? 70;
          const scale = Math.min(
            bodyHeight / ((reference[1] + reference[2]) / 2),
            120 / Math.max(...rowBoxes.map((b) => b.w)),
            116 / Math.max(...rowBoxes.map((b) => b.h)),
          );
          for (let frame = 0; frame < 6; frame++) {
            const index =
                sourceRow * 6 + (entry.poseMap?.[row]?.[frame] ?? frame),
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
            ctx.rect(frame * 192, row * 128, 192, 128);
            ctx.clip();
            ctx.drawImage(
              figure,
              Math.round(frame * 192 + 80 - foot * scale),
              Math.round(row * 128 + 118 - box.h * scale),
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
        }
        // Zoro Asura se compone en ejecución de tres siluetas Santoryu, no de otra hoja generada.
        if (rows === 4)
          ctx.drawImage(atlas, 0, 256, 1152, 256, 0, 512, 1152, 256);
        return { png: atlas.toDataURL().split(",")[1], report };
      },
      { entry, encoded },
    );
    const targetPath = `public/assets/characters/${entry.patch?.target ?? entry.id}-combat-v5.png`;
    let png = result.png;
    if (entry.patch) {
      const previous = (await readFile(targetPath)).toString("base64");
      png = await page.evaluate(
        async ({ previous, update, row, count }) => {
          const images = await Promise.all(
            [previous, update].map(async (encoded) => {
              const image = new Image();
              image.src = "data:image/png;base64," + encoded;
              await image.decode();
              return image;
            }),
          );
          const c = document.createElement("canvas");
          c.width = 1152;
          c.height = 768;
          const ctx = c.getContext("2d");
          ctx.drawImage(images[0], 0, 0);
          ctx.clearRect(0, row * 128, 1152, 128 * count);
          ctx.drawImage(
            images[1],
            0,
            0,
            1152,
            128 * count,
            0,
            row * 128,
            1152,
            128 * count,
          );
          return c.toDataURL().split(",")[1];
        },
        {
          previous,
          update: png,
          row: entry.patch.row,
          count: entry.patch.count ?? 1,
        },
      );
    }
    await writeFile(targetPath, Buffer.from(png, "base64"));
    console.log(entry.id, JSON.stringify(result.report));
  }
} finally {
  await browser.close();
}
