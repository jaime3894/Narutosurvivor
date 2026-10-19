/** Compila hojas ya dibujadas a nuestro contrato de atlas. No genera ni descarga arte. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { resolve } from "node:path";
const config = JSON.parse(
  await readFile(process.argv[2] ?? "sprite-art-input.json", "utf8"),
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  for (const entry of config) {
    const bytes = await readFile(entry.source);
    const atlases = await page.evaluate(
      async ({ entry, encoded }) => {
        const image = new Image();
        image.src = "data:image/png;base64," + encoded;
        await image.decode();
        if (image.width !== 1536 || image.height !== 1024)
          throw new Error("La hoja debe medir 1536×1024");
        const source = document.createElement("canvas");
        source.width = 1536;
        source.height = 1024;
        const sc = source.getContext("2d");
        sc.drawImage(image, 0, 0);
        const pixels = sc.getImageData(0, 0, 1536, 1024).data;
        // Componentes conexos: la generación no garantiza una cuadrícula exacta.
        // Se separan 24 cuerpos completos para no cortar pies ni copiar al vecino.
        const labels = new Int32Array(1536 * 1024),
          queue = new Int32Array(labels.length),
          parts = [];
        for (let start = 0; start < labels.length; start++) {
          if (labels[start] || pixels[start * 4 + 3] <= 100) continue;
          const label = parts.length + 1;
          let head = 0,
            tail = 1,
            minX = 1536,
            maxX = 0,
            minY = 1024,
            maxY = 0;
          queue[0] = start;
          labels[start] = label;
          while (head < tail) {
            const index = queue[head++],
              x = index % 1536,
              y = Math.floor(index / 1536);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            for (const next of [
              x > 0 ? index - 1 : -1,
              x < 1535 ? index + 1 : -1,
              y > 0 ? index - 1536 : -1,
              y < 1023 ? index + 1536 : -1,
            ])
              if (next >= 0 && !labels[next] && pixels[next * 4 + 3] > 100) {
                labels[next] = label;
                queue[tail++] = next;
              }
          }
          parts.push({
            label,
            area: tail,
            x: minX,
            y: minY,
            w: maxX - minX + 1,
            h: maxY - minY + 1,
          });
        }
        const bodies = [...parts]
          .sort((a, b) => b.area - a.area)
          .slice(0, 24)
          .sort((a, b) => a.y + a.h / 2 - (b.y + b.h / 2));
        const boxes = [];
        for (let row = 0; row < 4; row++)
          boxes.push(
            ...bodies
              .slice(row * 6, row * 6 + 6)
              .sort((a, b) => a.x + a.w / 2 - b.x - b.w / 2),
          );
        if (boxes.length !== 24)
          throw new Error("Se esperan 24 cuerpos separados");
        const owners = new Map(boxes.map((box, index) => [box.label, index]));
        for (const part of parts)
          if (!owners.has(part.label) && part.area >= 12) {
            let owner = 0,
              distance = Infinity;
            boxes.forEach((body, index) => {
              const value =
                ((part.x + part.w / 2 - body.x - body.w / 2) / 200) ** 2 +
                ((part.y + part.h / 2 - body.y - body.h / 2) / 230) ** 2;
              if (value < distance) {
                distance = value;
                owner = index;
              }
            });
            owners.set(part.label, owner);
          }
        const isolated = boxes.map(() => {
          const c = document.createElement("canvas");
          c.width = 1536;
          c.height = 1024;
          return c;
        });
        const buffers = boxes.map(() => new ImageData(1536, 1024));
        for (let index = 0; index < labels.length; index++) {
          const owner = owners.get(labels[index]);
          if (owner === undefined) continue;
          const target = buffers[owner].data;
          for (let channel = 0; channel < 4; channel++)
            target[index * 4 + channel] =
              channel === 3 ? 255 : pixels[index * 4 + channel];
        }
        boxes.forEach((box, index) => {
          for (const part of parts)
            if (owners.get(part.label) === index) {
              const right = Math.max(box.x + box.w, part.x + part.w),
                bottom = Math.max(box.y + box.h, part.y + part.h);
              box.x = Math.min(box.x, part.x);
              box.y = Math.min(box.y, part.y);
              box.w = right - box.x;
              box.h = bottom - box.y;
            }
          isolated[index].getContext("2d").putImageData(buffers[index], 0, 0);
        });
        const output = [];
        for (let tier = 0; tier < 3; tier++) {
          const canvas = document.createElement("canvas");
          canvas.width = 960;
          canvas.height = 320;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = false;
          const height = entry.heights?.[tier] ?? 70;
          const widest = Math.max(
            ...boxes
              .filter((_, i) => Math.floor((i % 6) / 2) === tier)
              .map((box) => (box.w / box.h) * height),
          );
          const ratio = Math.min(1, 60 / widest);
          for (let direction = 0; direction < 4; direction++)
            for (let frame = 0; frame < 15; frame++) {
              let row = direction,
                key =
                  frame < 4
                    ? 0
                    : frame < 10
                      ? [0, 0, 1, 1, 1, 0][frame - 4]
                      : frame < 13
                        ? (frame - 10) % 2
                        : 0;
              let flip = false;
              if (
                entry.profile === "alternate" &&
                (direction === 1 || direction === 2)
              )
                flip = key === 1;
              if (
                entry.profile === "mirror-left" &&
                (direction === 1 || direction === 2)
              ) {
                row = 1;
                flip = (key === 1) !== (direction === 2);
              }
              if (
                entry.profile === "mirror-right" &&
                (direction === 1 || direction === 2)
              ) {
                row = 1;
                flip = direction === 1;
              }
              if (
                entry.id === "luffy" &&
                tier === 2 &&
                direction === 1 &&
                key === 1
              )
                flip = true;
              if (entry.flipKeys?.[direction])
                flip = entry.flipKeys[direction][tier * 2 + key];
              const box = boxes[row * 6 + tier * 2 + key];
              const h = Math.round(height * ratio),
                w = Math.round((box.w / box.h) * h);
              const walking = frame >= 4 && frame < 10,
                attacking = frame >= 10 && frame < 13,
                hurt = frame >= 13;
              const bounce =
                walking && frame % 3 === 1 ? -1 : frame === 2 ? -1 : 0;
              ctx.save();
              ctx.beginPath();
              ctx.rect(frame * 64, direction * 80, 64, 80);
              ctx.clip();
              ctx.translate(frame * 64 + 32, direction * 80 + 74 + bounce);
              if (hurt) {
                ctx.translate(-2, -1);
                ctx.rotate(-0.05);
              }
              if (attacking) {
                const sign = direction === 1 ? -1 : 1;
                ctx.translate((frame - 10) * sign, -(frame === 11 ? 1 : 0));
                ctx.rotate(
                  (frame === 10 ? -0.04 : frame === 11 ? 0.05 : 0) * sign,
                );
              }
              if (flip) ctx.scale(-1, 1);
              ctx.drawImage(
                isolated[row * 6 + tier * 2 + key],
                box.x,
                box.y,
                box.w,
                box.h,
                -Math.floor(w / 2),
                -h,
                w,
                h,
              );
              ctx.restore();
            }
          // El atlas conserva alfa real y no depende de un color de fondo.
          const data = ctx.getImageData(0, 0, 960, 320);
          for (let i = 3; i < data.data.length; i += 4)
            if (data.data[i] < 12) data.data[i] = 0;
          ctx.putImageData(data, 0, 0);
          output.push(canvas.toDataURL("image/png").split(",")[1]);
        }
        return output;
      },
      { entry, encoded: bytes.toString("base64") },
    );
    for (let tier = 0; tier < 3; tier++) {
      const path =
        entry.id === "enemies"
          ? resolve(
              "public/assets/enemies",
              `${["sailor", "runner", "brute"][tier]}.png`,
            )
          : resolve("public/assets/characters", `${entry.id}-${tier}.png`);
      await mkdir(resolve(path, ".."), { recursive: true });
      await writeFile(path, Buffer.from(atlases[tier], "base64"));
      console.log(path);
    }
  }
} finally {
  await browser.close();
}
