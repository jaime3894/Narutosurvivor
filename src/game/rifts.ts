import { terrainTime } from "../data/missions";
import { freePosition } from "./terrain";
import { bossMoves, bossRepertoire, fanPatterns } from "../data/boss-moves";
import { bosses, bossOrder, riftRules, type BossId } from "../data/rifts";
import { combat } from "../data/combat";
import type { Enemy, Run } from "./types";
import { distanceSquared, effect, notify, stats } from "./rules";
import { offerBossRewards } from "./bonds";
export function spawnRift(run: Run, kind?: BossId): boolean {
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
    boss: kind ?? bossOrder[run.bossesDefeated % bossOrder.length] ?? "buggy",
  };
  run.rift.position = freePosition(
    run.rift.position,
    26,
    terrainTime(run.elapsed, run.mission),
  );
  if (run.noticeTime < 4)
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
    health =
      definition.health *
      (1 + run.elapsed / 450 + run.bossesDefeated * 0.18) *
      (rift.encounter?.health ?? 1);
  run.arena = {
    ...(rift.encounter ? { encounter: rift.encounter } : {}),
    center,
    remaining: rift.encounter?.seconds ?? riftRules.arenaTime,
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
        move: bossRepertoire[rift.boss][0],
        cycle: 0,
        walkTime: 0,
        moving: false,
        burst: 0,
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
  notify(
    run,
    `${definition.name} · esquiva sus avisos · ${run.arena.remaining} s`,
  );
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
    if (arena.encounter) {
      run.director.nextEncounter = arena.encounter.index + 1;
      if (arena.encounter.role === "final") run.director.finalDefeated = true;
    }
    run.bossesDefeated++;
    offerBossRewards(run);
  } else if (arena.encounter) {
    run.status = "lost";
    notify(run, "El duelo terminó sin vencer al jefe");
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
function clampBoss(run: Run, enemy: Enemy): void {
  if (!run.arena) return;
  const c = run.arena.center,
    dx = enemy.position.x - c.x,
    dy = enemy.position.y - c.y,
    len = Math.hypot(dx, dy);
  if (len > 255) {
    enemy.position.x = c.x + (dx / len) * 255;
    enemy.position.y = c.y + (dy / len) * 255;
  }
}
function emitFan(
  run: Run,
  enemy: Enemy,
  count: number,
  speed: number,
  spread: number,
  kind: "knife" | "wave" | "sand",
  radial = false,
): void {
  const state = enemy.boss;
  if (!state) return;
  const angle = Math.atan2(state.direction.y, state.direction.x),
    damage = bosses[state.kind].damage * bossMoves[state.move].damage;
  for (let i = 0; i < count; i++) {
    const a = radial
      ? angle + (i * Math.PI * 2) / count
      : angle + (i - (count - 1) / 2) * spread;
    run.hazards.push({
      id: run.nextId++,
      position: {
        x: enemy.position.x + Math.cos(a) * 30,
        y: enemy.position.y + Math.sin(a) * 30,
      },
      velocity: { x: Math.cos(a) * speed, y: Math.sin(a) * speed },
      radius: kind === "wave" || kind === "sand" ? 14 : 7,
      damage,
      life: 3,
      kind,
    });
  }
}
export function updateBoss(run: Run, enemy: Enemy, dt: number): void {
  const state = enemy.boss;
  if (!state) return;
  const d = bosses[state.kind],
    p = run.player.position,
    move = bossMoves[state.move],
    enraged = enemy.health.current < enemy.health.maximum * 0.5;
  state.time -= dt;
  state.moving = false;
  if (state.phase === "approach") {
    const dx = p.x - enemy.position.x,
      dy = p.y - enemy.position.y,
      len = Math.hypot(dx, dy) || 1;
    const desired = ["bomb", "knifeRing", "sandTomb", "sandFan"].includes(
      state.move,
    )
      ? 155
      : 90;
    if (len > desired) {
      const speed =
        d.speed * ((enemy.slow ?? 0) > 0 ? 0.7 : 1) * (enraged ? 1.15 : 1);
      enemy.position.x += (dx / len) * speed * dt;
      enemy.position.y += (dy / len) * speed * dt;
      state.moving = true;
      state.walkTime += dt;
    }
    if (state.time <= 0) {
      state.phase = "windup";
      state.time = move.windup * (enraged ? 0.82 : 1);
      state.target = { ...p };
      state.direction = { x: dx / len, y: dy / len };
      state.burst = 0;
    }
  } else if (state.phase === "windup" && state.time <= 0) {
    state.phase = "attack";
    state.time = move.active;
    const fan = fanPatterns[state.move];
    if (fan)
      emitFan(
        run,
        enemy,
        enraged ? fan.enraged : fan.count,
        fan.speed,
        fan.spread,
        fan.kind,
        fan.radial ?? false,
      );
    else if (state.move === "bomb" || state.move === "sandTomb")
      run.hazards.push({
        id: run.nextId++,
        position: { ...state.target },
        velocity: { x: 0, y: 0 },
        radius: move.range,
        damage: d.damage * move.damage,
        life: 0.35,
        kind: "bomb",
      });
    else if (
      state.move === "slam" &&
      distanceSquared(p, enemy.position) < (move.range + run.player.radius) ** 2
    )
      hurtPlayer(run, d.damage * move.damage);
    else if (state.move === "claw" || state.move === "bladeCross") {
      const dx = p.x - enemy.position.x,
        dy = p.y - enemy.position.y,
        len = Math.hypot(dx, dy) || 1;
      if (
        len < move.range + run.player.radius &&
        (dx * state.direction.x + dy * state.direction.y) / len > 0.45
      )
        hurtPlayer(run, d.damage * move.damage);
    }
  } else if (state.phase === "attack") {
    if (
      ["dash", "crossDash", "charge", "bladeDash", "hookDash"].includes(
        state.move,
      )
    ) {
      if (
        state.move === "crossDash" &&
        state.time <= move.active * 0.45 &&
        state.burst === 0
      ) {
        state.direction = { x: -state.direction.y, y: state.direction.x };
        state.burst = 1;
      }
      const speed =
        state.move === "bladeDash" || state.move === "hookDash"
          ? move.range / move.active
          : state.move === "charge"
            ? 470
            : 660;
      enemy.position.x += state.direction.x * speed * dt;
      enemy.position.y += state.direction.y * speed * dt;
    }
    if (state.time <= 0) {
      state.phase = "recover";
      state.time = move.recovery * (enraged ? 0.75 : 1);
    }
  } else if (state.phase === "recover" && state.time <= 0) {
    state.cycle++;
    const repertoire = bossRepertoire[state.kind];
    state.move = repertoire[state.cycle % repertoire.length] ?? repertoire[0];
    state.phase = "approach";
    state.time = enraged ? 0.25 : 0.45;
  }
  clampBoss(run, enemy);
  if (
    distanceSquared(p, enemy.position) <
    (enemy.radius + run.player.radius) ** 2
  )
    hurtPlayer(
      run,
      d.damage *
        (["dash", "crossDash", "charge", "bladeDash", "hookDash"].includes(
          state.move,
        ) && state.phase === "attack"
          ? 1.3
          : 1),
    );
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
    if (run.rift.encounter && run.rift.remaining <= dt) {
      run.rift.position = { ...run.player.position };
      enterRift(run);
      return;
    }
    run.rift.remaining -= dt;
    if (run.rift.remaining <= 0) {
      run.rift = null;
      schedule(run);
    } else if (
      distanceSquared(run.rift.position, run.player.position) <
      28 ** 2
    )
      enterRift(run);
  } else if (
    run.mission === "voyage" &&
    (run.elapsed >= run.nextRiftTime || run.kills >= run.nextRiftKills)
  )
    spawnRift(run);
}
