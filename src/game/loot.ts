import { combat } from "../data/combat";
import type { Run } from "./types";
import { distanceSquared, effect, hitEnemy, notify, stats } from "./rules";
import { openChest, spawnChest } from "./progression";
export function updateLoot(run: Run, dt: number): void {
  run.chestTimer -= dt;
  if (run.chestTimer <= 0) {
    const angle = run.random() * Math.PI * 2;
    spawnChest(run, {
      x: Math.max(
        100,
        Math.min(
          combat.world.width - 100,
          run.player.position.x + Math.cos(angle) * 180,
        ),
      ),
      y: Math.max(
        100,
        Math.min(
          combat.world.height - 100,
          run.player.position.y + Math.sin(angle) * 180,
        ),
      ),
    });
    run.chestTimer += 55;
    notify(run, "¡Un cofre en la costa! Busca su brillo dorado.");
  }
  for (const drop of run.drops) {
    const dx = run.player.position.x - drop.position.x,
      dy = run.player.position.y - drop.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance < stats(run).magnet) drop.attracted = true;
    if (drop.attracted && distance > 1) {
      const travel = Math.min(distance, (360 + distance * 3) * dt);
      drop.position.x += (dx / distance) * travel;
      drop.position.y += (dy / distance) * travel;
    }
    if (distance >= 20) continue;
    switch (drop.kind) {
      case "xp":
        run.xp =
          Math.round(
            (run.xp +
              drop.value * (1 + run.preparation.levels.experience * 0.05)) *
              100,
          ) / 100;
        break;
      case "heal":
        run.player.health.current = Math.min(
          run.player.health.maximum,
          run.player.health.current + drop.value * stats(run).food,
        );
        effect(run, run.player.position, "heal", drop.value);
        break;
      case "coin":
        run.berries += Math.round(drop.value * stats(run).currency);
        break;
      case "vacuum":
        for (const other of run.drops)
          if (other.kind === "xp" || other.kind === "coin")
            other.attracted = true;
        notify(run, "Imán de botín · los cristales y berries vienen hacia ti");
        break;
      case "bomb":
        for (const enemy of run.enemies)
          if (distanceSquared(enemy.position, run.player.position) < 600 ** 2)
            hitEnemy(run, enemy, 180, { x: 0, y: 0 }, false);
        effect(run, run.player.position, "explosion");
        run.hitStop = 0.045;
        notify(run, "¡Barril de pólvora!");
        break;
      case "haste":
        run.haste = Math.min(16, run.haste + 8);
        notify(run, "Impulso · +25% velocidad y +20% cadencia durante 8 s");
        break;
    }
    effect(run, drop.position, "pickup");
    drop.value = 0;
  }
  run.drops = run.drops.filter((drop) => drop.value > 0);
  const chest = run.chests.find(
    (item) => distanceSquared(item.position, run.player.position) < 28 ** 2,
  );
  if (chest) openChest(run, chest.id);
}
