import { createRandom } from "../core/random";
import {
  combat,
  enemyTypes,
  upgrades,
  xpForLevel,
  type EnemyKind,
  type UpgradeId,
} from "../data/combat";
import type { Position } from "../core/entity";
import type { Effect, Enemy, Input, Run } from "./types";

export function createRun(seed = Date.now()): Run {
  return {
    status: "playing",
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
    drops: [],
    effects: [],
    level: 1,
    xp: 0,
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    distance: 0,
    choices: [],
    ranks: {
      power: 0,
      tempo: 0,
      multishot: 0,
      stride: 0,
      magnet: 0,
      vitality: 0,
    },
    attackTimer: 0,
    spawnTimer: 0.3,
    nextId: 1,
    random: createRandom(seed),
  };
}
export const distanceSquared = (a: Position, b: Position): number =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const stats = (run: Run) => ({
  damage: combat.player.damage * (1 + run.ranks.power * 0.25),
  attackPeriod: combat.player.attackPeriod * 0.88 ** run.ranks.tempo,
  speed: combat.player.speed * (1 + run.ranks.stride * 0.1),
  projectiles: 1 + run.ranks.multishot,
  magnet: 68 + run.ranks.magnet * 45,
});
function effect(
  run: Run,
  position: Position,
  kind: Effect["kind"],
  value = 0,
): void {
  if (run.effects.length >= 180) run.effects.shift();
  const life = kind === "pickup" ? 0.2 : 0.4;
  run.effects.push({
    position: { ...position },
    kind,
    life,
    total: life,
    value,
  });
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
function fire(run: Run): void {
  const targets = run.enemies
    .filter(
      (enemy) =>
        distanceSquared(enemy.position, run.player.position) <
        combat.player.range ** 2,
    )
    .sort(
      (a, b) =>
        distanceSquared(a.position, run.player.position) -
        distanceSquared(b.position, run.player.position),
    );
  const first = targets[0];
  if (!first) return;
  const attributes = stats(run);
  for (let i = 0; i < attributes.projectiles; i++) {
    const target = targets[i % targets.length] ?? first;
    const angle = Math.atan2(
      target.position.y - run.player.position.y,
      target.position.x - run.player.position.x,
    );
    run.projectiles.push({
      id: run.nextId++,
      position: { ...run.player.position },
      velocity: { x: Math.cos(angle) * 640, y: Math.sin(angle) * 640 },
      damage: attributes.damage,
      life: 0.95,
    });
  }
  run.attackTimer = attributes.attackPeriod;
}
function hitEnemy(
  run: Run,
  enemy: Enemy,
  damage: number,
  impulse: Position,
): void {
  const actualDamage = Math.min(enemy.health.current, damage);
  enemy.health.current -= damage;
  enemy.flash = 0.12;
  enemy.velocity.x += impulse.x;
  enemy.velocity.y += impulse.y;
  run.damageDealt += actualDamage;
  effect(run, enemy.position, "hit", Math.round(damage));
  if (enemy.health.current > 0) return;
  run.kills++;
  effect(run, enemy.position, "kill");
  // Fusionar experiencia al alcanzar el límite preserva su valor y acota memoria.
  if (run.drops.length >= combat.maximumDrops) {
    const existing = run.drops.find((drop) => drop.kind === "xp");
    if (existing) existing.value += enemyTypes[enemy.kind].xp;
  } else
    run.drops.push({
      position: { ...enemy.position },
      value: enemyTypes[enemy.kind].xp,
      kind: "xp",
      attracted: false,
    });
  if (run.kills % 18 === 0 && run.drops.length < combat.maximumDrops) {
    run.drops.push({
      position: { ...enemy.position },
      value: 18,
      kind: "heal",
      attracted: false,
    });
  }
}
export function offerUpgrades(run: Run): void {
  if (run.status !== "playing" || run.xp < xpForLevel(run.level)) return;
  run.xp -= xpForLevel(run.level);
  run.level++;
  const available = upgrades
    .filter((upgrade) => run.ranks[upgrade.id] < upgrade.max)
    .map((upgrade) => upgrade.id);
  run.choices = [];
  while (available.length > 0 && run.choices.length < 3) {
    const index = Math.floor(run.random() * available.length);
    const [choice] = available.splice(index, 1);
    if (choice) run.choices.push(choice);
  }
  if (run.choices.length === 0) {
    run.player.health.current = Math.min(
      run.player.health.maximum,
      run.player.health.current + 25,
    );
    return;
  }
  run.status = "upgrade";
}
export function chooseUpgrade(run: Run, id: UpgradeId): boolean {
  if (run.status !== "upgrade" || !run.choices.includes(id)) return false;
  const definition = upgrades.find((upgrade) => upgrade.id === id);
  if (!definition || run.ranks[id] >= definition.max) return false;
  run.ranks[id]++;
  if (id === "vitality") {
    run.player.health.maximum += 20;
    run.player.health.current = Math.min(
      run.player.health.maximum,
      run.player.health.current + 35,
    );
  }
  run.choices = [];
  run.status = "playing";
  offerUpgrades(run);
  return true;
}
export function togglePause(run: Run): void {
  if (run.status === "playing") run.status = "paused";
  else if (run.status === "paused") run.status = "playing";
}
export function step(run: Run, input: Input, dt: number): void {
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05)
    throw new RangeError("Usa pasos entre 0 y 50 ms");
  if (run.status !== "playing") return;
  run.elapsed = Math.min(combat.duration, run.elapsed + dt);
  const player = run.player;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashTime = Math.max(0, player.dashTime - dt);
  const length = Math.hypot(input.x, input.y);
  const direction =
    length > 0 ? { x: input.x / length, y: input.y / length } : { x: 0, y: 0 };
  if (length > 0 && player.dashTime === 0) player.facing = direction;
  if (input.dash && player.dashCooldown === 0) {
    player.dashTime = combat.dash.duration;
    player.dashCooldown = combat.dash.cooldown;
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
  run.attackTimer = Math.max(0, run.attackTimer - dt);
  if (run.attackTimer === 0) fire(run);
  for (const enemy of run.enemies) {
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
      if (player.dashTime > 0) {
        hitEnemy(run, enemy, enemy.health.current, {
          x: (-dx / distance) * 300,
          y: (-dy / distance) * 300,
        });
      } else if (player.invulnerable === 0) {
        const damage = enemyTypes[enemy.kind].damage;
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
  for (const projectile of run.projectiles) {
    const old = { ...projectile.position };
    projectile.position.x += projectile.velocity.x * dt;
    projectile.position.y += projectile.velocity.y * dt;
    projectile.life -= dt;
    for (const enemy of run.enemies) {
      if (enemy.health.current <= 0) continue;
      // Distancia al segmento: evita atravesar objetivos entre dos pasos.
      const vx = projectile.position.x - old.x,
        vy = projectile.position.y - old.y;
      const lengthSquared = vx * vx + vy * vy;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((enemy.position.x - old.x) * vx + (enemy.position.y - old.y) * vy) /
            (lengthSquared || 1),
        ),
      );
      const closest = { x: old.x + vx * t, y: old.y + vy * t };
      if (distanceSquared(closest, enemy.position) <= (enemy.radius + 5) ** 2) {
        hitEnemy(run, enemy, projectile.damage, {
          x: projectile.velocity.x * 0.35,
          y: projectile.velocity.y * 0.35,
        });
        projectile.life = 0;
        break;
      }
    }
  }
  run.enemies = run.enemies.filter((enemy) => enemy.health.current > 0);
  run.projectiles = run.projectiles.filter((projectile) => projectile.life > 0);
  for (const drop of run.drops) {
    const dx = player.position.x - drop.position.x,
      dy = player.position.y - drop.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance < stats(run).magnet) drop.attracted = true;
    if (drop.attracted && distance > 1) {
      const travel = Math.min(distance, (360 + distance * 3) * dt);
      drop.position.x += (dx / distance) * travel;
      drop.position.y += (dy / distance) * travel;
    }
    if (distance < 20) {
      if (drop.kind === "xp") run.xp += drop.value;
      else
        player.health.current = Math.min(
          player.health.maximum,
          player.health.current + drop.value,
        );
      effect(run, drop.position, "pickup");
      drop.value = 0;
    }
  }
  run.drops = run.drops.filter((drop) => drop.value > 0);
  for (const item of run.effects) item.life -= dt;
  run.effects = run.effects.filter((item) => item.life > 0);
  if (player.health.current <= 0) run.status = "lost";
  else if (run.elapsed >= combat.duration) run.status = "won";
  else offerUpgrades(run);
}
