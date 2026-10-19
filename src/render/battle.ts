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
  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly reducedMotion: boolean,
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D no disponible");
    this.context = context;
    const resize = (): void => {
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.round(600 * (bounds.width / (bounds.height || 1)));
      canvas.height = 600;
      context.imageSmoothingEnabled = false;
    };
    resize();
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(canvas);
  }
  draw(run: Run, dt: number): void {
    const ctx = this.context;
    const VIEW_WIDTH = this.canvas.width;
    const VIEW_HEIGHT = this.canvas.height;
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
    ctx.fillStyle = "#cbb980";
    ctx.fillRect(20, 20, combat.world.width - 40, combat.world.height - 40);
    ctx.fillStyle = "#719363";
    ctx.fillRect(64, 64, combat.world.width - 128, combat.world.height - 128);
    for (
      let x = Math.floor(camX / 64) * 64;
      x < camX + VIEW_WIDTH + 64;
      x += 64
    ) {
      for (
        let y = Math.floor(camY / 64) * 64;
        y < camY + VIEW_HEIGHT + 64;
        y += 64
      ) {
        if (
          x < 80 ||
          y < 80 ||
          x > combat.world.width - 100 ||
          y > combat.world.height - 100
        )
          continue;
        const hash = Math.abs(Math.imul(x + 31, y + 13));
        ctx.fillStyle = hash % 3 === 0 ? "#789c68" : "#67895d";
        ctx.fillRect(x + (hash % 39), y + (hash % 29), 4, 3);
        ctx.fillRect(x + 14, y + 36, 2, 5);
        if (hash % 13 === 0) {
          ctx.fillStyle = "#dbc986";
          ctx.fillRect(x + 38, y + 12, 3, 3);
        }
      }
    }
    // Anillos y ruinas solo decorativos: ningún obstáculo invisible.
    ctx.strokeStyle = "#9aa577";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1200, 900, 104, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#84986a";
    ctx.beginPath();
    ctx.arc(1200, 900, 114, 0, Math.PI * 2);
    ctx.stroke();
    for (const [x, y] of [
      [700, 550],
      [1700, 1250],
      [1800, 480],
      [600, 1350],
    ]) {
      if (x === undefined || y === undefined) continue;
      ctx.fillStyle = "#536950";
      ctx.fillRect(x, y, 28, 20);
      ctx.fillStyle = "#b2b18c";
      ctx.fillRect(x, y - 4, 24, 16);
      ctx.fillStyle = "#c5c39d";
      ctx.fillRect(x + 3, y - 7, 18, 4);
    }
    drawLoot(ctx, run, this.reducedMotion);
    for (const enemy of [...run.enemies].sort(
      (a, b) => a.position.y - b.position.y,
    )) {
      if (
        enemy.position.x < camX - 40 ||
        enemy.position.x > camX + VIEW_WIDTH + 40 ||
        enemy.position.y < camY - 40 ||
        enemy.position.y > camY + VIEW_HEIGHT + 40
      )
        continue;
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
      drawSprite(
        ctx,
        getEnemyAtlas(enemy.kind),
        enemy.position,
        direction,
        enemy.flash > 0 ? "hurt" : "walk",
        this.reducedMotion ? 0 : run.elapsed,
        enemy.kind === "brute" ? 1.08 : 0.88,
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
      if (enemy.health.current < enemy.health.maximum) {
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
    ctx.globalAlpha =
      player.invulnerable > 0 && Math.floor(run.elapsed * 18) % 2 === 0
        ? 0.65
        : 1;
    drawFighter(ctx, run, this.reducedMotion);
    drawTechniques(ctx, run, this.reducedMotion);
    ctx.globalAlpha = 1;
    if (player.dashTime > 0) {
      ctx.strokeStyle = "#b6f4e9";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y - 4, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const projectile of run.projectiles) {
      const { x, y } = projectile.position;
      ctx.fillStyle = "#f1aa56";
      ctx.strokeStyle = "#704238";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? 8 : 3;
        if (i === 0)
          ctx.moveTo(
            x + Math.cos(angle) * radius,
            y - 45 + Math.sin(angle) * radius,
          );
        else
          ctx.lineTo(
            x + Math.cos(angle) * radius,
            y - 45 + Math.sin(angle) * radius,
          );
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    for (const effect of run.effects) {
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
      if (effect.value > 0) {
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = effect.kind === "hurt" ? "#ffb7a0" : "#fff6d8";
        ctx.fillText(
          `${effect.kind === "critical" ? "✦ " : effect.kind === "heal" ? "+" : ""}${effect.value}`,
          x,
          y - 18 - progress * (this.reducedMotion ? 0 : 20),
        );
      }
      if (["level", "evolve", "explosion", "heal"].includes(effect.kind)) {
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
          14 + progress * (effect.kind === "explosion" ? 280 : 70),
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
    if (hurt) {
      ctx.fillStyle = `rgba(190, 65, 50, ${hurt.life * 0.22})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
    // Brújula hacia la experiencia lejana más cercana.
    const farDrop =
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
