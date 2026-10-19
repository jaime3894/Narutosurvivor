import { replacementAtlas } from "./asset-loader";
import type { CharacterId } from "../data/content";
import type { FormTier } from "../data/crew";
import type { EnemyKind } from "../data/combat";
import { paintPortrait } from "./portraits";
export type Direction = "down" | "left" | "right" | "up";
export type SpriteState = "idle" | "walk" | "attack" | "hurt";
export const spriteLayout = {
  width: 64,
  height: 80,
  anchorX: 32,
  anchorY: 74,
  frames: 15,
  directions: 4,
} as const;
const starts: Record<SpriteState, number> = {
  idle: 0,
  walk: 4,
  attack: 10,
  hurt: 13,
};
const counts: Record<SpriteState, number> = {
  idle: 4,
  walk: 6,
  attack: 3,
  hurt: 2,
};
const cache = new Map<string, HTMLCanvasElement>();
const directions: Direction[] = ["down", "left", "right", "up"];
export function facingDirection(x: number, y: number): Direction {
  return Math.abs(x) > Math.abs(y)
    ? x < 0
      ? "left"
      : "right"
    : y < 0
      ? "up"
      : "down";
}
/** Elipses rasterizadas sin bordes suavizados para cuerpos y texturas pixel art. */
function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let row = -Math.floor(ry); row <= Math.floor(ry); row++) {
    const width = Math.floor(
      rx * Math.sqrt(Math.max(0, 1 - (row * row) / (ry * ry || 1))),
    );
    ctx.fillRect(Math.round(x - width), Math.round(y + row), width * 2 + 1, 1);
  }
}
function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function sword(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: number,
): void {
  for (let i = 0; i < 20; i++) {
    rect(ctx, x + i * side * 0.4, y - i, 2, 2, "#d6e8e1");
    rect(ctx, x + i * side * 0.4 + 1, y - i, 1, 2, "#708f91");
  }
  rect(ctx, x - 3, y, 7, 2, "#c4a767");
  rect(ctx, x, y + 2, 2, 6, "#634d57");
}
function flames(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  phase: number,
): void {
  for (let i = 0; i < 4; i++) {
    ellipse(
      ctx,
      x + i * 3 - 5,
      y - 3 - Math.abs(Math.sin(phase + i)) * 4,
      3,
      6,
      color,
    );
    rect(ctx, x + i * 3 - 5, y - 3, 1, 4, "#fff3b6");
  }
}
function paintCharacter(
  ctx: CanvasRenderingContext2D,
  id: CharacterId,
  tier: FormTier,
  direction: Direction,
  state: SpriteState,
  frame: number,
): void {
  const back = direction === "up",
    side = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const walk =
    state === "walk" ? Math.round(Math.sin((frame * Math.PI) / 3) * 3) : 0;
  const breath = state === "idle" && frame > 1 ? 1 : 0;
  const attack = state === "attack";
  const hurt = state === "hurt";
  ctx.save();
  ctx.translate(8 + (hurt ? -2 : attack ? side * 2 : 0), 10 + breath);
  const skin =
    id === "jinbe"
      ? "#69b2c6"
      : id === "brook"
        ? "#eee9c6"
        : id === "chopper"
          ? "#bd8b61"
          : id === "luffy" && tier === 1
            ? "#e99b92"
            : "#edb88c";
  const shade =
    id === "jinbe" ? "#3e7f9f" : id === "brook" ? "#a5a6aa" : "#ac7759";
  const heavy =
    (id === "franky" && tier > 0) ||
    (id === "chopper" && tier > 0) ||
    id === "jinbe" ||
    (id === "luffy" && tier === 2);
  const width = heavy ? (id === "chopper" && tier === 2 ? 32 : 28) : 18;
  const small = id === "chopper" && tier === 0;
  const chestY = small ? 36 : 29,
    chestH = small ? 12 : 18;
  if (id === "usopp" && tier === 2) {
    ellipse(ctx, 24, 39, 17, 19, "#923f3c");
    ellipse(ctx, 24, 40, 13, 16, "#c55d43");
  }
  if (id === "robin" && tier === 2) {
    for (const s of [-1, 1]) {
      ellipse(ctx, 24 + s * 17, 27, 9, 14, "#40344f");
      for (let i = 0; i < 3; i++)
        rect(ctx, 24 + s * (16 + i * 3), 16 + i * 5, 4, 15 - i * 3, "#6e4c76");
    }
  }
  if (id === "zoro" && tier === 2) {
    for (const s of [-1, 1]) {
      ctx.globalAlpha = 0.6;
      paintPortrait(ctx, id, 10 + s * 13, 8, 0.85, 0, 20);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++)
        sword(ctx, 24 + s * (13 + i * 3), 35 + i * 7, s);
    }
  }
  if (id === "nami") {
    for (const s of [-1, 1]) {
      ellipse(ctx, 24 + s * 10, 29, 6, 16, "#ae512a");
      ellipse(ctx, 24 + s * 11, 29, 4, 13, "#e48b42");
    }
  }
  if (id === "robin") {
    for (const s of [-1, 1]) ellipse(ctx, 24 + s * 10, 30, 5, 18, "#292336");
  }
  const legColor =
    id === "sanji" || id === "brook"
      ? "#26343d"
      : id === "zoro"
        ? "#426b50"
        : id === "robin"
          ? "#5b4773"
          : id === "franky" && tier === 2
            ? "#c6cdd0"
            : id === "jinbe"
              ? "#376985"
              : "#3b6476";
  const legWidth = heavy ? 8 : small ? 4 : 6;
  for (const s of [-1, 1]) {
    const step = s * walk;
    const lx = 24 + s * (heavy ? 8 : small ? 4 : 5) - legWidth / 2;
    ellipse(ctx, lx + legWidth / 2, 51 + step, legWidth / 2 + 1, 8, shade);
    rect(ctx, lx, 45 + step, legWidth, 11, legColor);
    if (["luffy", "nami", "chopper", "franky"].includes(id))
      rect(ctx, lx + 1, 53 + step, legWidth - 1, 5, skin);
    ellipse(
      ctx,
      lx + legWidth / 2 + side,
      59 + step,
      legWidth / 2 + 2,
      2,
      "#283b40",
    );
    rect(
      ctx,
      lx,
      58 + step,
      legWidth + 1,
      1,
      id === "sanji" ? "#69717a" : "#c7a573",
    );
    if (id === "sanji" && tier > 0 && s === 1)
      flames(ctx, lx + 3, 56 + step, tier === 2 ? "#69d8f0" : "#f39a49", frame);
  }
  const cloth =
    id === "luffy"
      ? "#cb503c"
      : id === "zoro"
        ? "#e4dec1"
        : id === "nami"
          ? "#78bab0"
          : id === "usopp"
            ? "#a6804f"
            : id === "sanji"
              ? "#293849"
              : id === "chopper"
                ? "#bf875f"
                : id === "robin"
                  ? "#64518c"
                  : id === "franky"
                    ? "#c95e52"
                    : id === "brook"
                      ? "#303647"
                      : "#d88847";
  const light =
    id === "luffy"
      ? "#ef7954"
      : id === "zoro"
        ? "#faf0d1"
        : id === "nami"
          ? "#a5dfc5"
          : id === "usopp"
            ? "#d3ac70"
            : id === "sanji"
              ? "#465774"
              : id === "chopper"
                ? "#e1b385"
                : id === "robin"
                  ? "#9580b7"
                  : id === "franky"
                    ? "#e58c6d"
                    : id === "brook"
                      ? "#56536b"
                      : "#efa75f";
  ellipse(
    ctx,
    24,
    chestY + chestH / 2,
    width / 2 + 2,
    chestH / 2 + 2,
    "#33403c",
  );
  ellipse(ctx, 24, chestY + chestH / 2, width / 2, chestH / 2, cloth);
  ellipse(
    ctx,
    22,
    chestY + chestH / 2 - 1,
    width / 2 - 3,
    chestH / 2 - 1,
    light,
  );
  if (id === "luffy" || (id === "franky" && tier < 2)) {
    ellipse(
      ctx,
      24,
      chestY + 7,
      5,
      9,
      tier === 2 && id === "luffy" ? "#c47b62" : skin,
    );
    rect(ctx, 19, chestY + 4, 2, 10, shade);
    rect(ctx, 29, chestY + 4, 1, 10, shade);
    if (id === "franky") {
      rect(ctx, 21, 33, 6, 2, "#284c60");
      rect(ctx, 23, 31, 2, 6, "#284c60");
    }
  }
  if (id === "luffy" && tier === 2) {
    ellipse(ctx, 24, 34, 16, 12, "#ac5e50");
    ellipse(ctx, 24, 31, 13, 10, "#df9a79");
    for (let i = -1; i <= 1; i++) rect(ctx, 22 + i * 6, 32, 3, 5, "#a86151");
  }
  if (id === "nami") {
    rect(ctx, 16, 32, 16, 2, "#ddede0");
    rect(ctx, 16, 37, 16, 2, "#ddede0");
    rect(ctx, 20, 42, 8, 3, skin);
    rect(ctx, 30, 31, 2, 5, "#3b83a3");
  }
  if (id === "sanji") {
    rect(ctx, 22, 29, 6, 11, "#759bb1");
    rect(ctx, 24, 30, 2, 10, "#313c54");
    for (let y = 36; y < 45; y += 5) rect(ctx, 18, y, 1, 1, "#d9c78e");
  }
  if (id === "zoro") {
    rect(ctx, 13, 42, 22, 4, "#6d8a53");
    rect(ctx, 14, 45, 21, 3, "#8d4b50");
    for (let i = 0; i < 3; i++) rect(ctx, 10 + i * 4, 40 - i, 2, 15, "#4d3d53");
  }
  if (id === "usopp") {
    rect(ctx, 16, 29, 3, 16, "#735639");
    rect(ctx, 29, 29, 3, 16, "#735639");
    ellipse(ctx, 24, 39, 5, 4, "#c49b5f");
  }
  if (id === "robin") {
    rect(ctx, 19, 29, 10, 8, skin);
    rect(ctx, 22, 30, 4, 10, "#322c49");
    for (let i = 0; i < 4; i++) rect(ctx, 15 + i * 5, 43, 2, 5, "#ab95c7");
  }
  if (id === "brook") {
    for (let i = 0; i < 3; i++) {
      rect(ctx, 21, 32 + i * 4, 6, 2, "#d4cfb7");
      rect(ctx, 24, 31 + i * 4, 1, 3, "#7d8290");
    }
    ellipse(ctx, 24, 30, 12, 3, tier === 2 ? "#eab254" : "#b8a4c8");
  }
  if (id === "jinbe") {
    for (let y = 29; y < 44; y += 5)
      for (let x = 15; x < 34; x += 8) {
        rect(ctx, x, y, 3, 2, "#f3d99c");
        rect(ctx, x + 1, y - 1, 1, 4, "#f3d99c");
      }
    rect(ctx, 10, 43, 29, 4, "#31445c");
    rect(ctx, 22, 43, 4, 4, "#e9ca83");
  }
  if (id === "franky" && tier === 2) {
    ellipse(ctx, 24, 35, 17, 15, "#aabbbc");
    rect(ctx, 12, 24, 24, 14, "#e8e2c2");
    rect(ctx, 19, 29, 11, 10, "#d3a44f");
    rect(ctx, 21, 27, 7, 14, "#c0764d");
    rect(ctx, 15, 42, 18, 5, "#3a535c");
  }
  for (const s of [-1, 1]) {
    const ay = attack ? 27 : 33 - s * walk,
      ax = 24 + s * (width / 2 + 3);
    const metal = id === "franky";
    const armColor = metal
      ? "#9aafb5"
      : id === "luffy" && tier === 2
        ? "#303447"
        : skin;
    const armWide = metal
      ? tier === 2
        ? 8
        : 7
      : id === "luffy" && tier === 2
        ? 7
        : id === "robin" && tier === 1
          ? 7
          : small
            ? 3
            : 4;
    if (attack && ["luffy", "franky"].includes(id) && s === -1) continue;
    ellipse(ctx, ax, ay + 5, armWide + 1, 9, "#3b3e3c");
    ellipse(ctx, ax - 1, ay + 4, armWide, 8, armColor);
    ellipse(ctx, ax, ay + 12, armWide, 3, metal ? "#d3e2df" : skin);
    if (metal) {
      rect(ctx, ax - 2, ay + 3, 5, 2, "#547e9a");
      rect(ctx, ax, ay + 1, 1, 6, "#547e9a");
    }
    if (id === "zoro" && tier > 0) sword(ctx, ax, ay + 12, s);
  }
  // La nuca conecta la cabeza con los hombros también al caminar.
  const headY = small ? 14 : 7;
  rect(ctx, 20, headY + 16, 9, chestY - headY - 12, shade);
  rect(ctx, 21, headY + 16, 6, chestY - headY - 11, skin);
  if (id === "usopp" && tier === 1) {
    rect(ctx, 39, 22, 2, 30, "#48633e");
    for (const s of [-1, 1]) {
      rect(ctx, 40 + s * 5, 18, 2, 12, "#668750");
      rect(ctx, 40 + s * 3, 26, 2, 5, "#826640");
    }
  }
  if (id === "nami" && tier === 1) {
    ellipse(ctx, 42, 17, 9, 5, "#aaa8be");
    rect(ctx, 38, 19, 3, 6, "#f4cf70");
  }
  if (id === "brook" && tier === 1) {
    rect(ctx, 39, 27, 2, 26, "#a9e3e9");
    rect(ctx, 38, 28, 1, 20, "#f0ffff");
  }
  if (id === "jinbe" && tier > 0) {
    for (const s of [-1, 1]) {
      ellipse(ctx, 24 + s * 15, tier === 2 ? 31 : 38, 8, 6, "#32556d");
      ellipse(ctx, 24 + s * 16, tier === 2 ? 28 : 36, 6, 4, "#8ac2cc");
    }
    rect(ctx, 12, 42, 24, 3, tier === 2 ? "#efd498" : "#263e59");
  }

  if (back) {
    ellipse(
      ctx,
      24,
      headY + 11,
      12,
      11,
      id === "jinbe"
        ? "#273a4a"
        : id === "chopper"
          ? "#af7851"
          : id === "nami"
            ? "#c46d37"
            : id === "sanji"
              ? "#d8b461"
              : id === "zoro"
                ? "#587745"
                : "#292b3c",
    );
    if (id === "luffy" && tier === 0) {
      ellipse(ctx, 24, headY + 6, 17, 5, "#9a743c");
      ellipse(ctx, 24, headY + 4, 15, 4, "#e7c36b");
      rect(ctx, 14, headY, 21, 6, "#d5a95e");
      rect(ctx, 14, headY + 4, 21, 3, "#ae493b");
    }
    if (id === "chopper") {
      rect(ctx, 10, headY, 28, 8, "#b15872");
      rect(ctx, 12, headY - 3, 24, 6, "#ce7a91");
    }
  } else if (id === "usopp" && tier === 2) {
    paintPortrait(ctx, id, 10 + side, headY, 1, 0, 20);
    ellipse(ctx, 24 + side, headY + 12, 11, 9, "#a16a35");
    ellipse(ctx, 24 + side, headY + 11, 10, 8, "#f4d25f");
    for (const eye of [-1, 1]) {
      ellipse(ctx, 24 + eye * 5 + side, headY + 11, 3, 3, "#f7f0d6");
      rect(ctx, 23 + eye * 5 + side, headY + 10, 2, 3, "#273648");
    }
    rect(ctx, 24 + side * 3, headY + 14, side === 0 ? 4 : 9, 3, "#c99442");
  } else if (id === "luffy" && tier > 0) {
    ellipse(ctx, 24, headY + 12, 12, 11, "#272735");
    paintPortrait(ctx, id, 10 + side, headY + 8, 1, 9, 20);
    for (let i = 0; i < 7; i++)
      rect(ctx, 13 + i * 3, headY + 5 - (i % 2) * 2, 3, 6, "#262634");
  } else paintPortrait(ctx, id, 10 + side, headY, 1, 0, 20);
  if (id === "zoro" && tier > 0) {
    rect(ctx, 12, headY + 5, 24, 3, "#2a3935");
    rect(ctx, 8, headY + 6, 5, 2, "#2a3935");
    if (!back) sword(ctx, 21, headY + 18, 1);
  }
  if (id === "nami") {
    rect(ctx, 40, 24, 2, 29, "#6cacc0");
    for (let y = 27; y < 50; y += 8) rect(ctx, 39, y, 4, 2, "#cde6d1");
    if (tier === 2) {
      ellipse(ctx, 43, 17, 13, 7, "#87849d");
      ellipse(ctx, 40, 15, 11, 5, "#d2c9df");
      rect(ctx, 39, 16, 2, 2, "#3b3658");
      rect(ctx, 46, 16, 2, 2, "#3b3658");
    }
  }
  if (id === "robin" && tier === 2) {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++)
        rect(ctx, 24 + s * (8 + i * 0.7), headY + 3 - i, 3, 3, "#806078");
    }
  }
  if (id === "brook" && tier === 2) {
    rect(ctx, 12, headY - 1, 24, 4, "#d8aa4d");
    for (let i = 0; i < 5; i++)
      rect(ctx, 13 + i * 5, headY - 5, 3, 6, "#efcb65");
  }
  if (id === "chopper") {
    for (const s of [-1, 1]) {
      rect(ctx, 24 + s * 17, headY + 2, 3, 10, "#7d533b");
      rect(ctx, 24 + s * 17, headY + 2, 6 * s, 2, "#ad7b4c");
    }
    if (tier === 2) {
      ellipse(ctx, 11, 30, 5, 13, "#bd946a");
      ellipse(ctx, 37, 30, 5, 13, "#bd946a");
    }
  }
  if (id === "franky" && tier === 2) {
    rect(ctx, 11, headY + 2, 26, 7, "#ece4c9");
    rect(ctx, 15, headY + 8, 18, 3, "#3d6b79");
    rect(ctx, 22, headY - 3, 5, 6, "#d25541");
  }
  ctx.restore();
}
function paintEnemy(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  dir: Direction,
  state: SpriteState,
  frame: number,
): void {
  ctx.save();
  ctx.translate(8, 10);
  const walk =
    state === "walk" ? Math.round(Math.sin((frame * Math.PI) / 3) * 3) : 0;
  const heavy = kind === "brute",
    back = dir === "up",
    side = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const width = heavy ? 29 : 18;
  for (const s of [-1, 1]) {
    rect(ctx, 24 + s * 6 - 3, 44 + s * walk, 7, 14, "#384b62");
    ellipse(ctx, 24 + s * 6, 59 + s * walk, 5, 2, "#25343b");
  }
  ellipse(ctx, 24, 36, width / 2 + 2, 13, "#303d45");
  ellipse(
    ctx,
    24,
    34,
    width / 2,
    12,
    kind === "sailor" ? "#e1e3cf" : heavy ? "#985357" : "#795582",
  );
  ellipse(
    ctx,
    21,
    33,
    width / 2 - 4,
    10,
    kind === "sailor" ? "#fff3d6" : heavy ? "#be7670" : "#b083ab",
  );
  if (kind === "sailor") {
    rect(ctx, 19, 25, 10, 7, "#536c91");
    rect(ctx, 22, 28, 4, 12, "#719cb7");
    rect(ctx, 13, 43, 22, 3, "#476d88");
  } else {
    for (let y = 29; y < 44; y += 5)
      rect(
        ctx,
        heavy ? 10 : 16,
        y,
        heavy ? 29 : 17,
        2,
        heavy ? "#d1a88b" : "#ead9bc",
      );
    rect(ctx, 12, 44, 25, 3, "#594a41");
  }
  for (const s of [-1, 1]) {
    ellipse(
      ctx,
      24 + s * (width / 2 + 3),
      36 - s * walk,
      heavy ? 6 : 4,
      10,
      "#9d7056",
    );
    ellipse(
      ctx,
      23 + s * (width / 2 + 3),
      34 - s * walk,
      heavy ? 5 : 3,
      8,
      "#e3b18b",
    );
  }
  ellipse(ctx, 24, 18, 12, 12, "#3c393a");
  ellipse(ctx, 24, 18, 10, 10, "#bd8a65");
  ellipse(ctx, 22, 16, 8, 8, "#e8bd93");
  if (!back) {
    rect(ctx, 18 + side, 15, 3, 2, "#3a3540");
    rect(ctx, 27 + side, 15, 3, 2, "#3a3540");
    rect(ctx, 19 + side, 13, 3, 1, "#4e3b36");
    rect(ctx, 26 + side, 13, 4, 1, "#4e3b36");
    rect(ctx, 20, 23, 10, 1, "#895447");
    if (kind === "runner") {
      rect(ctx, 27 + side, 14, 4, 4, "#293039");
      rect(ctx, 16, 14, 17, 1, "#593d37");
    }
    if (heavy) {
      for (let y = 23; y < 29; y++)
        rect(ctx, 18 + (y - 23), y, 13 - 2 * (y - 23), 1, "#51433c");
      rect(ctx, 29, 18, 1, 5, "#9a5348");
    }
  } else ellipse(ctx, 24, 16, 11, 8, "#39464b");
  if (kind === "sailor") {
    ellipse(ctx, 24, 9, 16, 4, "#547594");
    ellipse(ctx, 24, 7, 14, 4, "#e5e8d8");
    rect(ctx, 14, 1, 20, 7, "#f4f1d5");
    rect(ctx, 19, 3, 11, 2, "#567c9c");
  } else if (kind === "runner") {
    rect(ctx, 12, 8, 24, 4, "#a95448");
    rect(ctx, 9, 9, 5, 3, "#b65c4d");
    sword(ctx, 40, 45, 1);
  } else {
    rect(ctx, 13, 6, 23, 4, "#764a3e");
    rect(ctx, 38, 24, 6, 30, "#7c583d");
    ellipse(ctx, 41, 23, 6, 10, "#a07a4c");
    for (let i = 0; i < 5; i++)
      rect(ctx, 38 + (i % 2) * 3, 16 + i * 4, 2, 2, "#c6a06a");
  }
  ctx.restore();
}
export function getSpriteAtlas(
  id: CharacterId,
  tier: FormTier,
): HTMLCanvasElement | HTMLImageElement {
  return (
    replacementAtlas(`hero:${id}:${tier}`) ??
    atlas(`hero:${id}:${tier}`, (ctx, d, s, f) =>
      paintCharacter(ctx, id, tier, d, s, f),
    )
  );
}
export function getEnemyAtlas(
  kind: EnemyKind,
): HTMLCanvasElement | HTMLImageElement {
  return (
    replacementAtlas(`enemy:${kind}`) ??
    atlas(`enemy:${kind}`, (ctx, d, s, f) => paintEnemy(ctx, kind, d, s, f))
  );
}
function atlas(
  key: string,
  paint: (
    ctx: CanvasRenderingContext2D,
    d: Direction,
    s: SpriteState,
    f: number,
  ) => void,
): HTMLCanvasElement {
  const existing = cache.get(key);
  if (existing) return existing;
  const canvas = document.createElement("canvas");
  canvas.width = 64 * 15;
  canvas.height = 80 * 4;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.imageSmoothingEnabled = false;
  for (let d = 0; d < 4; d++)
    for (const state of ["idle", "walk", "attack", "hurt"] as const)
      for (let f = 0; f < counts[state]; f++) {
        ctx.save();
        ctx.translate((starts[state] + f) * 64, d * 80);
        ctx.beginPath();
        ctx.rect(0, 0, 64, 80);
        ctx.clip();
        paint(ctx, directions[d] ?? "down", state, f);
        ctx.restore();
      }
  cache.set(key, canvas);
  return canvas;
}
export function spriteFrame(state: SpriteState, time: number): number {
  return (
    starts[state] +
    (Math.floor(
      time *
        (state === "walk"
          ? 10
          : state === "attack"
            ? 12
            : state === "hurt"
              ? 10
              : 3),
    ) %
      counts[state])
  );
}
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  position: { x: number; y: number },
  direction: Direction,
  state: SpriteState,
  time: number,
  scale = 1,
): void {
  const frame = spriteFrame(state, time),
    row = directions.indexOf(direction);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    frame * 64,
    row * 80,
    64,
    80,
    Math.round(position.x - 32 * scale),
    Math.round(position.y - 74 * scale),
    64 * scale,
    80 * scale,
  );
}
