import { createRandom } from "../core/random";
import { combat, enemyTypes, type EnemyKind } from "../data/combat";
import {
  upgrades,
  weapons,
  weaponKey,
  type CharacterId,
  type UpgradeId,
} from "../data/content";
import type { Position } from "../core/entity";
import type { Input, Run } from "./types";
import { distanceSquared, effect, hitEnemy, stats } from "./rules";
import { offerUpgrades } from "./progression";
import { updateTechniques } from "./techniques";
import { updateLoot } from "./loot";
export { distanceSquared, stats } from "./rules";
export { chooseUpgrade, offerUpgrades } from "./progression";

export function createRun(
  seed = Date.now(),
  character: CharacterId = "luffy",
): Run {
  const starter = weapons.find((item) => item.owner === character);
  if (!starter) throw new Error("Personaje sin técnica inicial");
  const ranks = Object.fromEntries(
    upgrades.map((item) => [item.id, 0]),
  ) as Record<UpgradeId, number>;
  ranks[weaponKey(starter.id)] = 1;
  return {
    status: "playing",
    character,
    elapsed: 0,
    player: {
      position: { x: 1200, y: 900 },
      velocity: { x: 0, y: 0 },
      health: { current: combat.player.health, maximum: combat.player.health },
      radius: combat.player.radius,
      facing: { x: 0, y: 1 },
      invulnerable: 0,
      dashTime: 0,
      dashCooldown: 0,
    },
    enemies: [],
    projectiles: [],
    attacks: [],
    drops: [],
    effects: [],
    weapons: [{ id: starter.id, timer: 0, evolved: false }],
    chests: [],
    chestRewards: [],
    chestSerial: 0,
    chestTimer: 35,
    berries: 0,
    openedChests: 0,
    evolvedCount: 0,
    haste: 0,
    hitStop: 0,
    notice: "",
    noticeTime: 0,
    level: 1,
    xp: 0,
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    distance: 0,
    choices: [],
    ranks,
    attackTimer: 0,
    spawnTimer: 0.3,
    nextId: 1,
    random: createRandom(seed),
  };
}
function clampPlayer(run: Run): void {
  const { position } = run.player;
  position.x = Math.max(
    combat.world.shore,
    Math.min(combat.world.width - combat.world.shore, position.x),
  );
  position.y = Math.max(
    combat.world.shore,
    Math.min(combat.world.height - combat.world.shore, position.y),
  );
}
function spawn(run: Run): void {
  let angle = run.random() * Math.PI * 2;
  const radius = 610 + run.random() * 90;
  const roll = run.random();
  const kind: EnemyKind =
    run.elapsed > 75 && roll < 0.17
      ? "brute"
      : run.elapsed > 25 && roll < 0.43
        ? "runner"
        : "sailor";
  const definition = enemyTypes[kind];
  const health = definition.health * (1 + run.elapsed / 600);
  let position: Position = { x: 0, y: 0 };
  for (let attempt = 0; attempt < 8; attempt++) {
    position = {
      x: Math.max(
        30,
        Math.min(
          combat.world.width - 30,
          run.player.position.x + Math.cos(angle) * radius,
        ),
      ),
      y: Math.max(
        30,
        Math.min(
          combat.world.height - 30,
          run.player.position.y + Math.sin(angle) * radius,
        ),
      ),
    };
    if (distanceSquared(position, run.player.position) >= 550 ** 2) break;
    angle += Math.PI / 4;
  }
  run.enemies.push({
    id: run.nextId++,
    kind,
    position,
    velocity: { x: 0, y: 0 },
    health: { current: health, maximum: health },
    radius: definition.radius,
    flash: 0,
  });
}

export function togglePause(run: Run): void {
  if (run.status === "playing") run.status = "paused";
  else if (run.status === "paused") run.status = "playing";
}
export function step(run: Run, input: Input, dt: number): void {
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05)
    throw new RangeError("Usa pasos entre 0 y 50 ms");
  if (run.status !== "playing") return;
  if (run.player.health.current <= 0) {
    run.status = "lost";
    return;
  }
  run.elapsed = Math.min(combat.duration, run.elapsed + dt);
  run.noticeTime = Math.max(0, run.noticeTime - dt);
  run.haste = Math.max(0, run.haste - dt);
  const player = run.player;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashTime = Math.max(0, player.dashTime - dt);
  player.health.current = Math.min(
    player.health.maximum,
    player.health.current + run.ranks.regen * 0.35 * dt,
  );
  const length = Math.hypot(input.x, input.y);
  const direction =
    length > 0 ? { x: input.x / length, y: input.y / length } : { x: 0, y: 0 };
  if (length > 0 && player.dashTime === 0) player.facing = direction;
  if (input.dash && player.dashCooldown === 0) {
    player.dashTime = combat.dash.duration;
    player.dashCooldown = stats(run).dashCooldown;
    player.invulnerable = Math.max(
      player.invulnerable,
      combat.dash.duration + 0.06,
    );
    effect(run, player.position, "dash");
  }
  const speed = player.dashTime > 0 ? combat.dash.speed : stats(run).speed;
  const movement = player.dashTime > 0 ? player.facing : direction;
  const before = { ...player.position };
  player.velocity = { x: movement.x * speed, y: movement.y * speed };
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;
  clampPlayer(run);
  run.distance += Math.hypot(
    player.position.x - before.x,
    player.position.y - before.y,
  );
  run.spawnTimer -= dt;
  if (run.spawnTimer <= 0) {
    const batch = 1 + Math.floor(run.elapsed / 90);
    for (
      let i = 0;
      i < batch && run.enemies.length < combat.maximumEnemies;
      i++
    )
      spawn(run);
    run.spawnTimer += Math.max(0.24, 0.85 - run.elapsed * 0.0018);
  }
  for (const enemy of run.enemies) {
    if (enemy.health.current <= 0) continue;
    enemy.flash = Math.max(0, enemy.flash - dt);
    const dx = player.position.x - enemy.position.x,
      dy = player.position.y - enemy.position.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = enemyTypes[enemy.kind].speed * (1 + run.elapsed / 1500);
    enemy.position.x += ((dx / distance) * speed + enemy.velocity.x) * dt;
    enemy.position.y += ((dy / distance) * speed + enemy.velocity.y) * dt;
    enemy.velocity.x *= Math.exp(-12 * dt);
    enemy.velocity.y *= Math.exp(-12 * dt);
    if (distance < player.radius + enemy.radius) {
      if (player.dashTime > 0)
        hitEnemy(
          run,
          enemy,
          enemy.health.current,
          { x: (-dx / distance) * 300, y: (-dy / distance) * 300 },
          false,
        );
      else if (player.invulnerable === 0) {
        const damage = Math.max(
          1,
          enemyTypes[enemy.kind].damage - stats(run).armor,
        );
        player.health.current = Math.max(0, player.health.current - damage);
        run.damageTaken += damage;
        player.invulnerable = 0.75;
        effect(run, player.position, "hurt", damage);
        enemy.velocity = {
          x: (-dx / distance) * 360,
          y: (-dy / distance) * 360,
        };
      }
    }
  }
  if (player.health.current > 0) {
    updateTechniques(run, dt);
    updateLoot(run, dt);
  }
  run.enemies = run.enemies.filter((enemy) => enemy.health.current > 0);
  for (const item of run.effects) item.life -= dt;
  run.effects = run.effects.filter((item) => item.life > 0);
  if (player.health.current <= 0) run.status = "lost";
  else if (run.elapsed >= combat.duration) run.status = "won";
  else offerUpgrades(run);
}
