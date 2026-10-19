import { bosses, bossOrder, riftRules } from "../data/rifts";
import { combat } from "../data/combat";
import type { Enemy, Run } from "./types";
import { distanceSquared, effect, notify, stats } from "./rules";
import { offerBossRewards } from "./bonds";
export function spawnRift(run: Run): boolean {
  if (run.status !== "playing" || run.rift || run.arena) return false;
  const angle = run.random() * Math.PI * 2;
  run.rift = {
    position: {
      x: Math.max(
        120,
        Math.min(
          combat.world.width - 120,
          run.player.position.x + Math.cos(angle) * 170,
        ),
      ),
      y: Math.max(
        120,
        Math.min(
          combat.world.height - 120,
          run.player.position.y + Math.sin(angle) * 170,
        ),
      ),
    },
    remaining: riftRules.ttl,
    boss: bossOrder[run.bossesDefeated % bossOrder.length] ?? "buggy",
  };
  notify(
    run,
    "¡Una grieta! Entra para desafiar al jefe y ganar un vínculo o atributo.",
  );
  return true;
}
function schedule(run: Run): void {
  run.nextRiftTime = run.elapsed + riftRules.interval;
  run.nextRiftKills = run.kills + riftRules.killInterval;
}
export function enterRift(run: Run): boolean {
  const rift = run.rift;
  if (
    run.status !== "playing" ||
    !rift ||
    distanceSquared(rift.position, run.player.position) > 200 ** 2
  )
    return false;
  const center = {
    x: Math.max(360, Math.min(combat.world.width - 360, run.player.position.x)),
    y: Math.max(
      360,
      Math.min(combat.world.height - 360, run.player.position.y),
    ),
  };
  const id = run.nextId++,
    definition = bosses[rift.boss],
    health = definition.health * (1 + Math.floor(run.bossesDefeated / 3) * 0.4);
  run.arena = {
    center,
    remaining: riftRules.arenaTime,
    bossId: id,
    returnPosition: { ...run.player.position },
    enemies: run.enemies,
    drops: run.drops,
    chests: run.chests,
  };
  run.enemies = [
    {
      id,
      kind: rift.boss === "kuro" ? "runner" : "brute",
      position: { x: center.x, y: center.y - 110 },
      velocity: { x: 0, y: 0 },
      health: { current: health, maximum: health },
      radius: definition.radius,
      flash: 0,
      boss: {
        kind: rift.boss,
        phase: "approach",
        time: 0.8,
        target: { ...run.player.position },
        direction: { x: 0, y: 1 },
      },
    },
  ];
  run.player.position = { x: center.x, y: center.y + 105 };
  run.player.invulnerable = 1;
  for (const ally of [...run.nakama, ...run.assists])
    ally.position = { ...run.player.position };
  run.drops = [];
  run.chests = [];
  run.attacks = [];
  run.projectiles = [];
  run.hazards = [];
  run.rift = null;
  notify(run, `${definition.name} · esquiva sus avisos · 75 s`);
  return true;
}
export function finishArena(run: Run, victory: boolean): void {
  const arena = run.arena;
  if (!arena) return;
  run.enemies = arena.enemies;
  run.drops = arena.drops;
  run.chests = arena.chests;
  run.player.position = arena.returnPosition;
  for (const ally of [...run.nakama, ...run.assists])
    ally.position = { ...arena.returnPosition };
  run.arena = null;
  run.attacks = [];
  run.projectiles = [];
  run.hazards = [];
  run.effects = [];
  run.player.invulnerable = 1;
  schedule(run);
  if (victory) {
    run.bossesDefeated++;
    offerBossRewards(run);
  } else
    notify(
      run,
      "La grieta se cierra · sin recompensa · habrá otra oportunidad",
    );
}
export function clampArena(run: Run): void {
  if (!run.arena) return;
  const p = run.player.position,
    c = run.arena.center,
    dx = p.x - c.x,
    dy = p.y - c.y,
    d = Math.hypot(dx, dy),
    radius = riftRules.arenaRadius - run.player.radius;
  if (d > radius) {
    p.x = c.x + (dx / d) * radius;
    p.y = c.y + (dy / d) * radius;
  }
}
export function hurtPlayer(run: Run, amount: number): void {
  const player = run.player;
  if (player.invulnerable > 0 || player.health.current <= 0) return;
  const damage = Math.max(1, amount - stats(run).armor);
  player.health.current = Math.max(0, player.health.current - damage);
  run.damageTaken += damage;
  player.invulnerable = 0.75;
  effect(run, player.position, "hurt", damage);
}
export function updateBoss(run: Run, enemy: Enemy, dt: number): void {
  const state = enemy.boss;
  if (!state) return;
  const d = bosses[state.kind],
    p = run.player.position;
  state.time -= dt;
  if (state.phase === "approach") {
    const dx = p.x - enemy.position.x,
      dy = p.y - enemy.position.y,
      length = Math.hypot(dx, dy) || 1;
    if (length > 100) {
      enemy.position.x +=
        (dx / length) * d.speed * ((enemy.slow ?? 0) > 0 ? 0.7 : 1) * dt;
      enemy.position.y +=
        (dy / length) * d.speed * ((enemy.slow ?? 0) > 0 ? 0.7 : 1) * dt;
    }
    if (state.time <= 0) {
      state.phase = "windup";
      state.time = d.windup;
      state.target = { ...p };
      state.direction = { x: dx / length, y: dy / length };
    }
  } else if (state.phase === "windup" && state.time <= 0) {
    state.phase = "attack";
    state.time = d.active;
    if (d.pattern === "knives") {
      const base = Math.atan2(state.direction.y, state.direction.x);
      for (let i = -3; i <= 3; i++)
        run.hazards.push({
          id: run.nextId++,
          position: { ...enemy.position },
          velocity: {
            x: Math.cos(base + i * 0.18) * 250,
            y: Math.sin(base + i * 0.18) * 250,
          },
          radius: 7,
          damage: d.damage,
          life: 2.6,
          kind: "knife",
        });
    } else if (
      d.pattern === "slam" &&
      distanceSquared(p, enemy.position) < (d.range + run.player.radius) ** 2
    )
      hurtPlayer(run, d.damage);
  } else if (state.phase === "attack") {
    if (d.pattern === "dash") {
      enemy.position.x += state.direction.x * 640 * dt;
      enemy.position.y += state.direction.y * 640 * dt;
      if (run.arena) {
        const c = run.arena.center,
          dx = enemy.position.x - c.x,
          dy = enemy.position.y - c.y,
          len = Math.hypot(dx, dy);
        if (len > 250) {
          enemy.position.x = c.x + (dx / len) * 250;
          enemy.position.y = c.y + (dy / len) * 250;
        }
      }
    }
    if (state.time <= 0) {
      state.phase = "recover";
      state.time = d.recovery;
    }
  } else if (state.phase === "recover" && state.time <= 0) {
    state.phase = "approach";
    state.time = 0.6;
  }
  if (
    distanceSquared(p, enemy.position) <
    (enemy.radius + run.player.radius) ** 2
  )
    hurtPlayer(run, d.damage);
}
export function updateRifts(run: Run, dt: number): void {
  if (run.arena) {
    run.arena.remaining -= dt;
    for (const h of run.hazards) {
      h.position.x += h.velocity.x * dt;
      h.position.y += h.velocity.y * dt;
      h.life -= dt;
      if (
        distanceSquared(h.position, run.player.position) <
        (h.radius + run.player.radius) ** 2
      ) {
        hurtPlayer(run, h.damage);
        h.life = 0;
      }
    }
    run.hazards = run.hazards.filter((h) => h.life > 0).slice(-80);
    if (run.arena.remaining <= 0) finishArena(run, false);
    return;
  }
  if (run.rift) {
    run.rift.remaining -= dt;
    if (run.rift.remaining <= 0) {
      run.rift = null;
      schedule(run);
    } else if (
      distanceSquared(run.rift.position, run.player.position) <
      28 ** 2
    )
      enterRift(run);
  } else if (run.elapsed >= run.nextRiftTime || run.kills >= run.nextRiftKills)
    spawnRift(run);
}
