import { terrainTime } from "../data/missions";
import { missions, waveAt, type MissionId } from "../data/missions";
import { updateDirector } from "./director";
import { moveOnTerrain, freePosition, steerAround } from "./terrain";
import { voyageStage } from "../data/voyage";
import { emptyPreparation, type Preparation } from "../data/training";
import { riftRules } from "../data/rifts";
import { updateRifts, updateBoss, finishArena, clampArena } from "./rifts";
import { characterById, validateCrew } from "../data/crew";
import { updateCrew, tryRevive } from "./crew";
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
  nakama: CharacterId[] = [],
  preparation: Preparation = emptyPreparation(),
  mission: MissionId = "voyage",
): Run {
  validateCrew({ captain: character, nakama });
  const own = weapons.filter((w) => w.owner === character);
  const selected =
    preparation.levels.starter && own.some((w) => w.id === preparation.starter)
      ? preparation.starter
      : characterById(character).starter;
  const starter = weapons.find((item) => item.id === selected);
  if (!starter) throw new Error("Personaje sin técnica inicial");
  const ranks = Object.fromEntries(
    upgrades.map((item) => [item.id, 0]),
  ) as Record<UpgradeId, number>;
  ranks[weaponKey(starter.id)] = 1;
  const initialWeapons = [{ id: starter.id, timer: 0, evolved: false }];
  const extra = own.find(
    (w) => w.id !== starter.id && !preparation.banned.includes(w.id),
  );
  if (preparation.levels.repertoire && extra) {
    initialWeapons.push({ id: extra.id, timer: 0, evolved: false });
    ranks[weaponKey(extra.id)] = 1;
  }
  const health = combat.player.health + preparation.levels.health * 8;
  return {
    mission,
    director: {
      nextEncounter: 0,
      finalDefeated: false,
      busterStarted: false,
      buster: null,
    },
    id: crypto.randomUUID(),
    preparation: {
      ...preparation,
      levels: { ...preparation.levels },
      banned: [...preparation.banned],
    },
    rerollsLeft: preparation.levels.rerolls,
    status: "playing",
    character,
    form: 0,
    formUnlocked: 0,
    assists: [],
    activeWeapon: starter.id,
    linkedWeapons: [],
    rift: null,
    arena: null,
    nextRiftTime: riftRules.firstTime,
    nextRiftKills: riftRules.firstKills,
    bossesDefeated: 0,
    hazards: [],
    bossRewards: [],
    rewardSerial: 0,
    boons: { damage: 0, health: 0, speed: 0, armor: 0, regen: 0, tempo: 0 },
    energy: 100,
    formCooldown: 0,
    transformTime: 0,
    reviveUsed: false,
    nakama: nakama.map((id, index) => ({
      character: id,
      position: { x: 1200 + (index === 0 ? -43 : 43), y: 858 },
      facing: { x: 0, y: 1 },
      moving: false,
      timer: 0,
      supportTimer: 12,
    })),
    elapsed: 0,
    player: {
      position: { x: 1200, y: 900 },
      velocity: { x: 0, y: 0 },
      health: { current: health, maximum: health },
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
    weapons: initialWeapons,
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
  const roll = run.random(),
    stage = voyageStage(run.elapsed, run.mission);
  const wave = waveAt(run.elapsed, run.mission);
  const kind: EnemyKind = wave
    ? roll < wave.weights[0]
      ? "sailor"
      : roll < wave.weights[0] + wave.weights[1]
        ? "runner"
        : "brute"
    : run.elapsed > 75 && roll < stage.brutes
      ? "brute"
      : run.elapsed > 25 && roll < 0.43
        ? "runner"
        : "sailor";
  const definition = enemyTypes[kind];
  const elite = run.elapsed >= 240 && run.random() < 0.22;
  const health =
    definition.health *
    (1 + run.elapsed / 600) *
    (wave ? wave.health : stage.health) *
    (elite ? 1.5 : 1);
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
    position = freePosition(
      position,
      definition.radius,
      terrainTime(run.elapsed, run.mission),
    );
    if (distanceSquared(position, run.player.position) >= 550 ** 2) break;
    angle += Math.PI / 4;
  }
  run.enemies.push({
    id: run.nextId++,
    kind,
    elite,
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
  if (run.player.health.current <= 0 && !tryRevive(run)) {
    run.status = "lost";
    return;
  }
  const duration =
    run.mission === "voyage" ? combat.duration : missions[run.mission].duration;
  const previousStage = voyageStage(run.elapsed, run.mission);
  if (!run.arena) run.elapsed = Math.min(duration, run.elapsed + dt);
  const stage = voyageStage(run.elapsed, run.mission);
  if (stage.id !== previousStage.id) {
    for (const chest of run.chests)
      chest.position = freePosition(
        chest.position,
        20,
        terrainTime(run.elapsed, run.mission),
      );
    if (run.rift)
      run.rift.position = freePosition(
        run.rift.position,
        26,
        terrainTime(run.elapsed, run.mission),
      );
    run.notice = `${stage.name} · ${stage.subtitle}`;
    run.noticeTime = 6;
  }
  updateDirector(run, dt);
  updateCrew(run, dt);
  run.noticeTime = Math.max(0, run.noticeTime - dt);
  run.haste = Math.max(0, run.haste - dt);
  const player = run.player;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashTime = Math.max(0, player.dashTime - dt);
  player.health.current = Math.min(
    player.health.maximum,
    player.health.current + stats(run).regen * dt,
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
  if (run.arena) {
    player.position.x += player.velocity.x * dt;
    player.position.y += player.velocity.y * dt;
  } else
    moveOnTerrain(
      player.position,
      { x: player.velocity.x * dt, y: player.velocity.y * dt },
      player.radius,
      terrainTime(run.elapsed, run.mission),
    );
  clampPlayer(run);
  clampArena(run);
  player.velocity = {
    x: (player.position.x - before.x) / dt,
    y: (player.position.y - before.y) / dt,
  };
  run.distance += Math.hypot(
    player.position.x - before.x,
    player.position.y - before.y,
  );
  if (!run.arena) run.spawnTimer -= dt;
  if (!run.arena && run.spawnTimer <= 0) {
    const batch =
      waveAt(run.elapsed, run.mission)?.batch ??
      1 + Math.floor(run.elapsed / 90);
    for (
      let i = 0;
      i < batch && run.enemies.length < combat.maximumEnemies;
      i++
    )
      spawn(run);
    run.spawnTimer += Math.max(
      0.19,
      waveAt(run.elapsed, run.mission)?.interval ??
        (0.85 - run.elapsed * 0.0018) * stage.spawn,
    );
  }
  for (const enemy of run.enemies) {
    if (enemy.health.current <= 0) continue;
    enemy.flash = Math.max(0, enemy.flash - dt);
    const dx = player.position.x - enemy.position.x,
      dy = player.position.y - enemy.position.y;
    const distance = Math.hypot(dx, dy) || 1;
    enemy.slow = Math.max(0, (enemy.slow ?? 0) - dt);
    if ((enemy.burn ?? 0) > 0) {
      enemy.burn = Math.max(0, (enemy.burn ?? 0) - dt);
      enemy.burnTick = (enemy.burnTick ?? 0) - dt;
      if (enemy.burnTick <= 0) {
        hitEnemy(run, enemy, 4, { x: 0, y: 0 }, false, {
          character: "sanji",
          form: 0,
          origin: enemy.position,
        });
        enemy.burnTick = 0.5;
      }
      if (enemy.health.current <= 0) continue;
    }
    if (enemy.boss) {
      updateBoss(run, enemy, dt);
      continue;
    }
    const speed =
      enemyTypes[enemy.kind].speed *
      (waveAt(run.elapsed, run.mission)?.speed ?? stage.speed) *
      (enemy.elite ? 1.08 : 1) *
      (1 + run.elapsed / 1500) *
      ((enemy.slow ?? 0) > 0 ? 0.6 : 1);
    const heading = steerAround(
      enemy.position,
      player.position,
      enemy.radius,
      terrainTime(run.elapsed, run.mission),
      enemy.id,
    );
    moveOnTerrain(
      enemy.position,
      {
        x: (heading.x * speed + enemy.velocity.x) * dt,
        y: (heading.y * speed + enemy.velocity.y) * dt,
      },
      enemy.radius,
      terrainTime(run.elapsed, run.mission),
    );
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
          enemyTypes[enemy.kind].damage *
            (waveAt(run.elapsed, run.mission)?.damage ?? stage.damage) *
            (enemy.elite ? 1.2 : 1) -
            stats(run).armor,
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
    if (!run.arena) updateLoot(run, dt);
  }
  if (
    player.health.current > 0 &&
    run.arena &&
    run.enemies.some((e) => e.id === run.arena?.bossId && e.health.current <= 0)
  )
    finishArena(run, true);
  if (run.status === "playing") updateRifts(run, dt);
  run.enemies = run.enemies.filter((enemy) => enemy.health.current > 0);
  for (const item of run.effects) item.life -= dt;
  run.effects = run.effects.filter((item) => item.life > 0);
  if (player.health.current <= 0 && !tryRevive(run)) run.status = "lost";
  else if (
    run.status === "playing" &&
    run.elapsed >= duration &&
    (run.mission === "voyage" || run.director.finalDefeated)
  )
    run.status = "won";
  else offerUpgrades(run);
}
