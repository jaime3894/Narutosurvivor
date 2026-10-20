import {
  defaultRenderPreferences,
  type RenderPreferences,
} from "../core/preferences";
import { drawField } from "./field";
import { propsInArea } from "../data/terrain";
import { terrainTime } from "../data/missions";
import { drawWorld, drawWorldProp } from "./world";
import { drawBoss } from "./boss-assets";
import { drawRifts, drawBossTelegraph } from "./rifts";
import { drawProjectile } from "./projectile";
import { getEnemyAtlas, drawSprite, facingDirection } from "./sprites";
import { drawTechniques } from "./techniques";
import { drawFighter } from "./fighter";
import { drawLoot } from "./loot";
import { combat } from "../data/combat";
import type { Position } from "../core/entity";
import type { Run } from "../game/types";

export class BattleRenderer {
  readonly context: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  readonly camera: Position = { x: 1200, y: 900 };
  private viewWidth = 800;
  private viewHeight = 600;
  private resizeKey = "";
  private bounds = { width: 800, height: 600 };
  get reducedMotion(): boolean {
    return this.systemCalm || this.preferences().calm;
  }
  private resize(): void {
    const prefs = this.preferences();
    const key = `${this.bounds.width}:${this.bounds.height}:${prefs.level}:${prefs.zoom}`;
    if (key === this.resizeKey) return;
    this.resizeKey = key;
    this.viewHeight = 720 / prefs.zoom;
    this.viewWidth =
      (this.viewHeight * this.bounds.width) / (this.bounds.height || 1);
    const density = [0.6, 0.8, 1][prefs.level] ?? 1;
    this.canvas.width = Math.round(this.viewWidth * density);
    this.canvas.height = Math.round(this.viewHeight * density);
    this.context.imageSmoothingEnabled = false;
  }
  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly systemCalm: boolean,
    private readonly preferences: () => RenderPreferences = () =>
      defaultRenderPreferences,
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D no disponible");
    this.context = context;
    const resize = (): void => {
      const bounds = canvas.getBoundingClientRect();
      this.bounds = { width: bounds.width, height: bounds.height };
      this.resize();
    };
    resize();
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(canvas);
  }
  draw(run: Run, dt: number): void {
    const ctx = this.context;
    this.resize();
    const prefs = this.preferences();
    const VIEW_WIDTH = this.viewWidth;
    const VIEW_HEIGHT = this.viewHeight;
    ctx.setTransform(
      this.canvas.width / VIEW_WIDTH,
      0,
      0,
      this.canvas.height / VIEW_HEIGHT,
      0,
      0,
    );
    const player = run.player;
    const blend = this.reducedMotion ? 1 : 1 - Math.exp(-10 * dt);
    this.camera.x += (player.position.x - this.camera.x) * blend;
    this.camera.y += (player.position.y - this.camera.y) * blend;
    this.camera.x = Math.max(
      VIEW_WIDTH / 2 - 16,
      Math.min(combat.world.width - VIEW_WIDTH / 2 + 16, this.camera.x),
    );
    this.camera.y = Math.max(
      VIEW_HEIGHT / 2 - 16,
      Math.min(combat.world.height - VIEW_HEIGHT / 2 + 16, this.camera.y),
    );
    const camX = Math.round(this.camera.x - VIEW_WIDTH / 2);
    const camY = Math.round(this.camera.y - VIEW_HEIGHT / 2);
    ctx.fillStyle = "#245b67";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.save();
    const hurt = run.effects.find((effect) => effect.kind === "hurt");
    const shake =
      hurt && !this.reducedMotion
        ? (Math.sin(hurt.life * 110) * 4 * hurt.life) / hurt.total
        : 0;
    ctx.translate(-camX + shake, -camY);
    drawWorld(
      ctx,
      { x: camX, y: camY, width: VIEW_WIDTH, height: VIEW_HEIGHT },
      run.elapsed,
      {
        lighting: prefs.level > 0,
        decorations: false,
        mission: run.mission,
        ...(run.arena ? { clear: { ...run.arena.center, radius: 290 } } : {}),
      },
    );
    drawRifts(ctx, run, this.reducedMotion);
    drawLoot(ctx, run, this.reducedMotion);
    drawField(ctx, run);
    const layers = [
      ...run.enemies.map((enemy) => ({
        kind: "enemy" as const,
        y: enemy.position.y,
        enemy,
      })),
      ...propsInArea(
        terrainTime(run.elapsed, run.mission),
        camX,
        camY,
        VIEW_WIDTH,
        VIEW_HEIGHT,
      )
        .filter(
          (prop) =>
            !run.arena ||
            Math.hypot(
              prop.x - run.arena.center.x,
              prop.y - run.arena.center.y,
            ) > 370,
        )
        .map((prop) => ({ kind: "prop" as const, y: prop.y, prop })),
      { kind: "player" as const, y: player.position.y },
    ].sort((a, b) => a.y - b.y);
    for (const layer of layers) {
      if (layer.kind === "prop") {
        drawWorldProp(ctx, layer.prop);
        continue;
      }
      if (layer.kind === "player") {
        ctx.globalAlpha =
          player.invulnerable > 0 && Math.floor(run.elapsed * 18) % 2 === 0
            ? 0.65
            : 1;
        drawFighter(ctx, run, this.reducedMotion);
        ctx.globalAlpha = 1;
        continue;
      }
      const enemy = layer.enemy;
      if (
        enemy.position.x < camX - 40 ||
        enemy.position.x > camX + VIEW_WIDTH + 40 ||
        enemy.position.y < camY - 40 ||
        enemy.position.y > camY + VIEW_HEIGHT + 40
      )
        continue;
      drawBossTelegraph(ctx, enemy);
      if (enemy.elite) {
        ctx.strokeStyle = "#f2c66b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          enemy.position.x,
          enemy.position.y + 4,
          enemy.radius + 5,
          7,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      ctx.fillStyle = "#284b42";
      ctx.beginPath();
      ctx.ellipse(
        enemy.position.x,
        enemy.position.y + 4,
        enemy.kind === "brute" ? 19 : 12,
        5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      const direction = facingDirection(
        player.position.x - enemy.position.x,
        player.position.y - enemy.position.y,
      );
      if (!drawBoss(ctx, enemy, player.position, this.reducedMotion))
        drawSprite(
          ctx,
          getEnemyAtlas(enemy.kind, enemy.faction),
          enemy.position,
          direction,
          enemy.flash > 0 ? "hurt" : "walk",
          this.reducedMotion
            ? 0
            : run.elapsed + (run.arena ? 75 - run.arena.remaining : 0),
          enemy.boss ? 1.5 : enemy.kind === "brute" ? 1.08 : 0.88,
        );
      if (enemy.flash > 0) {
        ctx.fillStyle = "rgba(255,245,208,.5)";
        ctx.fillRect(enemy.position.x - 8, enemy.position.y - 35, 16, 13);
      }
      if ((enemy.burn ?? 0) > 0) {
        ctx.fillStyle = "#e5a25f";
        ctx.fillRect(enemy.position.x - 7, enemy.position.y - 20, 3, 8);
        ctx.fillRect(enemy.position.x + 5, enemy.position.y - 14, 3, 6);
      }
      if ((enemy.slow ?? 0) > 0) {
        ctx.strokeStyle = "#abe2e9";
        ctx.strokeRect(enemy.position.x - 13, enemy.position.y - 6, 26, 10);
      }
      if (!enemy.boss && enemy.health.current < enemy.health.maximum) {
        ctx.fillStyle = "#29423e";
        ctx.fillRect(enemy.position.x - 12, enemy.position.y - 60, 24, 3);
        ctx.fillStyle = "#f0b185";
        ctx.fillRect(
          enemy.position.x - 12,
          enemy.position.y - 60,
          (24 * enemy.health.current) / enemy.health.maximum,
          3,
        );
      }
    }
    drawTechniques(ctx, run, this.reducedMotion);
    ctx.globalAlpha = 1;
    if (player.dashTime > 0) {
      ctx.strokeStyle = "#b6f4e9";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y - 4, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const projectile of run.projectiles) drawProjectile(ctx, projectile);
    for (const effect of run.effects.slice(-[60, 110, 180][prefs.level]!)) {
      const progress = 1 - effect.life / effect.total;
      ctx.globalAlpha = 1 - progress;
      const { x, y } = effect.position;
      if (
        effect.kind === "hit" ||
        effect.kind === "critical" ||
        effect.kind === "kill"
      ) {
        ctx.strokeStyle = effect.kind === "kill" ? "#f4ce79" : "#fff4d8";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const radius = 8 + progress * (this.reducedMotion ? 6 : 28);
          ctx.beginPath();
          ctx.moveTo(
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius,
          );
          ctx.lineTo(
            x + Math.cos(angle) * (radius + 5),
            y + Math.sin(angle) * (radius + 5),
          );
          ctx.stroke();
        }
      }
      if (effect.value > 0 && prefs.damageNumbers) {
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = effect.kind === "hurt" ? "#ffb7a0" : "#fff6d8";
        ctx.fillText(
          `${effect.kind === "critical" ? "✦ " : effect.kind === "heal" ? "+" : ""}${effect.value}`,
          x,
          y - 18 - progress * (this.reducedMotion ? 0 : 20),
        );
      }
      if (
        ["level", "evolve", "explosion", "heal", "shell"].includes(effect.kind)
      ) {
        ctx.strokeStyle =
          effect.kind === "heal"
            ? "#b8edc4"
            : effect.kind === "explosion"
              ? "#f3ad78"
              : "#f4d88b";
        ctx.lineWidth = effect.kind === "explosion" ? 5 : 2;
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          14 +
            progress *
              (effect.kind === "explosion"
                ? 280
                : effect.kind === "shell"
                  ? 34
                  : 70),
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      if (effect.kind === "pickup") {
        ctx.strokeStyle = "#b5f2d9";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 3 + progress * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (effect.kind === "dash") {
        ctx.strokeStyle = "#a8e5d1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12 + progress * 32, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (hurt && !this.reducedMotion) {
      ctx.fillStyle = `rgba(190, 65, 50, ${hurt.life * 0.22})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
    // Brújula hacia la experiencia lejana más cercana.
    const farDrop =
      run.rift ??
      run.chests[0] ??
      run.drops
        .filter((drop) => drop.kind === "xp")
        .sort(
          (a, b) =>
            Math.hypot(
              a.position.x - player.position.x,
              a.position.y - player.position.y,
            ) -
            Math.hypot(
              b.position.x - player.position.x,
              b.position.y - player.position.y,
            ),
        )[0];
    if (
      farDrop &&
      Math.hypot(
        farDrop.position.x - player.position.x,
        farDrop.position.y - player.position.y,
      ) > 330
    ) {
      const angle = Math.atan2(
        farDrop.position.y - player.position.y,
        farDrop.position.x - player.position.x,
      );
      ctx.save();
      ctx.translate(
        VIEW_WIDTH / 2 + Math.cos(angle) * 230,
        VIEW_HEIGHT / 2 + Math.sin(angle) * 180,
      );
      ctx.rotate(angle);
      ctx.fillStyle = "#9fe2cd";
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-6, 5);
      ctx.fill();
      ctx.restore();
    }
  }
  destroy(): void {
    this.resizeObserver.disconnect();
  }
}
