/** Exporta las hojas de Luffy aprobadas a atlas y capas corporales independientes. */
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const config = JSON.parse(await readFile(process.argv[2], "utf8"));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  for (const [kind, path] of Object.entries(config)) {
    const encoded = (await readFile(path)).toString("base64");
    const result = await page.evaluate(
      async ({ kind, encoded }) => {
        const columns = kind === "base" ? 8 : kind === "arms" ? 4 : 3,
          rows = kind === "arms" ? 3 : 4;
        const image = new Image();
        image.src = "data:image/png;base64," + encoded;
        await image.decode();
        const width = image.width,
          height = image.height,
          source = document.createElement("canvas");
        source.width = width;
        source.height = height;
        const ctx = source.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, width, height).data,
          labels = new Int32Array(width * height),
          queue = new Int32Array(labels.length),
          parts = [];
        for (let start = 0; start < labels.length; start++) {
          if (labels[start] || pixels[start * 4 + 3] <= 100) continue;
          const label = parts.length + 1;
          let head = 0,
            tail = 1,
            x0 = width,
            y0 = height,
            x1 = 0,
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
        const biggest = [...parts]
            .sort((a, b) => b.area - a.area)
            .slice(0, columns * rows)
            .sort((a, b) => a.y + a.h / 2 - b.y - b.h / 2),
          boxes = [];
        for (let row = 0; row < rows; row++)
          boxes.push(
            ...biggest
              .slice(row * columns, (row + 1) * columns)
              .sort((a, b) => a.x + a.w / 2 - b.x - b.w / 2),
          );
        if (boxes.length !== columns * rows)
          throw new Error("Faltan figuras de " + kind);
        const figures = boxes.map((box, index) => {
          const canvas = document.createElement("canvas");
          canvas.width = box.w;
          canvas.height = box.h;
          const target = canvas.getContext("2d"),
            data = target.createImageData(box.w, box.h);
          for (let y = 0; y < box.h; y++)
            for (let x = 0; x < box.w; x++) {
              const src = (box.y + y) * width + box.x + x;
              if (labels[src] !== box.label) continue;
              const dest = (y * box.w + x) * 4;
              data.data[dest] = pixels[src * 4];
              data.data[dest + 1] = pixels[src * 4 + 1];
              data.data[dest + 2] = pixels[src * 4 + 2];
              data.data[dest + 3] = 255;
            }
          target.putImageData(data, 0, 0);
          return { canvas, index };
        });
        function canvas(w, h) {
          const image = document.createElement("canvas");
          image.width = w;
          image.height = h;
          image.getContext("2d").imageSmoothingEnabled = false;
          return image;
        }
        function body(target, index, x, y, h, maxWidth = 60) {
          const image = figures[index].canvas;
          const scale = Math.min(h / image.height, maxWidth / image.width);
          const w = Math.round(image.width * scale),
            height = Math.round(image.height * scale);
          target.drawImage(
            image,
            Math.round(x - w / 2),
            Math.round(y - height),
            w,
            height,
          );
        }
        const output = {};
        if (kind === "base") {
          const atlas = canvas(960, 320),
            target = atlas.getContext("2d");
          const bodies = canvas(64, 320),
            bodyCtx = bodies.getContext("2d");
          for (let row = 0; row < 4; row++) {
            body(bodyCtx, row * 8 + 7, 32, row * 80 + 74, 68);
            for (let frame = 0; frame < 15; frame++) {
              // El atlas normal conserva brazos en todas sus poses; los puñetazos usan la capa sin brazos.
              const pose = frame < 4 ? 0 : frame < 10 ? frame - 3 : 0;
              target.save();
              target.beginPath();
              target.rect(frame * 64, row * 80, 64, 80);
              target.clip();
              body(target, row * 8 + pose, frame * 64 + 32, row * 80 + 74, 68);
              target.restore();
            }
          }
          output["luffy-base-v4.png"] = atlas.toDataURL().split(",")[1];
          output["luffy-base-body-v4.png"] = bodies.toDataURL().split(",")[1];
        } else if (kind === "bodies") {
          const atlas = canvas(288, 320),
            target = atlas.getContext("2d");
          for (let row = 0; row < 4; row++)
            for (let form = 0; form < 3; form++)
              body(
                target,
                row * 3 + form,
                form * 96 + 48,
                row * 80 + 74,
                form === 2 ? 72 : 68,
                92,
              );
          output["luffy-bodies-v4.png"] = atlas.toDataURL().split(",")[1];
        } else {
          const atlas = canvas(512, 192),
            target = atlas.getContext("2d");
          for (let row = 0; row < 3; row++)
            for (let col = 0; col < 4; col++) {
              const part = figures[row * 4 + col].canvas;
              const scale = Math.min(
                  (col < 2 ? 120 : 58) / part.width,
                  56 / part.height,
                ),
                w = Math.round(part.width * scale),
                h = Math.round(part.height * scale);
              target.drawImage(
                part,
                col * 128 + (col < 2 ? 4 : Math.round((128 - w) / 2)),
                row * 64 + Math.round((64 - h) / 2),
                w,
                h,
              );
            }
          output["luffy-arms-v4.png"] = atlas.toDataURL().split(",")[1];
        }
        return output;
      },
      { kind, encoded },
    );
    for (const [name, base64] of Object.entries(result)) {
      await writeFile(
        "public/assets/characters/" + name,
        Buffer.from(base64, "base64"),
      );
      console.log(name);
    }
  }
} finally {
  await browser.close();
}
