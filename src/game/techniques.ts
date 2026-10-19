import { techniqueDefinition } from "../data/technique-forms";
import { activeTechniques } from "./bonds";
import { characterById } from "../data/crew";
import { casterPosition, casterForm } from "./crew";
import type { CharacterId } from "../data/content";
import { combat } from "../data/combat";
import { weaponById, weaponKey, type WeaponDefinition } from "../data/content";
import type { Position } from "../core/entity";
import type { Attack, Run } from "./types";
import { affinities, distanceSquared, hitEnemy, stats } from "./rules";
export function pointSegmentDistance(
  point: Position,
  start: Position,
  end: Position,
): number {
  const dx = end.x - start.x,
    dy = end.y - start.y;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        (dx * dx + dy * dy || 1),
    ),
  );
  return Math.hypot(point.x - start.x - dx * t, point.y - start.y - dy * t);
}
export function attackEndpoint(run: Run, attack: Attack): Position {
  const origin = casterPosition(run, attack.caster);
  return {
    x: origin.x + attack.direction.x * attack.distance,
    y: origin.y + attack.direction.y * attack.distance,
  };
}
export function animationProgress(attack: Attack): {
  phase: "windup" | "active" | "recovery";
  extension: number;
} {
  if (attack.age < attack.windup)
    return {
      phase: "windup",
      extension: -0.15 * Math.sin(((attack.age / attack.windup) * Math.PI) / 2),
    };
  if (attack.age < attack.windup + attack.active) {
    const phase = (attack.age - attack.windup) / attack.active;
    return { phase: "active", extension: Math.min(1, phase * 5) };
  }
  return {
    phase: "recovery",
    extension: Math.max(
      0,
      1 - (attack.age - attack.windup - attack.active) / attack.recovery,
    ),
  };
}
function createAttack(
  run: Run,
  definition: WeaponDefinition,
  evolved: boolean,
  caster: CharacterId = run.character,
): Attack | undefined {
  const rank = Math.max(1, run.ranks[weaponKey(definition.id)]);
  const attributes = stats(run, caster);
  const origin = casterPosition(run, caster);
  const synergy = affinities(run)[definition.affinity] ?? 0;
  const range =
    definition.range *
    attributes.range *
    (evolved ? definition.evolution.range : 1) *
    (synergy >= 3 ? 1.08 : 1);
  const target = run.enemies
    .filter(
      (enemy) =>
        enemy.health.current > 0 &&
        distanceSquared(enemy.position, origin) < range ** 2,
    )
    .sort(
      (a, b) =>
        distanceSquared(a.position, origin) -
        distanceSquared(b.position, origin),
    )[0];
  if (!target) return undefined;
  const dx = target.position.x - origin.x,
    dy = target.position.y - origin.y;
  const length = Math.hypot(dx, dy) || 1;
  const count =
    definition.strikes > 1
      ? definition.strikes +
        run.ranks.multishot +
        (evolved ? 2 : 0) +
        attributes.strikes
      : 1 + attributes.strikes;
  const active =
    definition.active * (definition.strikes > 1 ? attributes.duration : 1);
  const hitAt = definition.windup + Math.min(active * 0.25, 0.04);
  return {
    id: run.nextId++,
    weapon: definition.id,
    caster,
    form: casterForm(run, caster),
    age: 0,
    windup: definition.windup,
    active,
    recovery: definition.recovery,
    direction: { x: dx / length, y: dy / length },
    distance: Math.min(range, length + 8),
    range,
    target: { ...target.position },
    strikes: Array.from({ length: count }, (_, index) => ({
      at: hitAt + (count > 1 ? (index / count) * active * 0.7 : 0),
      fired: false,
      index,
    })),
    evolved,
    damage:
      ((definition.damage * attributes.damage) / combat.player.damage) *
      (1 + (rank - 1) * 0.18) *
      (evolved ? definition.evolution.damage : 1) *
      (synergy >= 2 ? 1.12 : 1) *
      (definition.strikes > 1
        ? attributes.duration
        : 1 + run.ranks.multishot * 0.08) *
      (caster === run.character ? 1 : Math.min(0.85, 0.45 + run.level * 0.02)),
    width: definition.width * attributes.range,
    hitIds: [],
  };
}
function strike(run: Run, attack: Attack, index: number): void {
  const definition = techniqueDefinition(attack.weapon, attack.form);
  const origin = casterPosition(run, attack.caster);
  const endpoint = attackEndpoint(run, attack);
  if (definition.shape === "projectile") {
    const angle =
      Math.atan2(attack.direction.y, attack.direction.x) +
      (attack.form > 0 ? (index - (attack.strikes.length - 1) / 2) * 0.1 : 0);
    run.projectiles.push({
      id: run.nextId++,
      position: { ...origin },
      velocity: { x: Math.cos(angle) * 580, y: Math.sin(angle) * 580 },
      damage: attack.damage,
      life: attack.distance / 580 + 0.2,
      weapon: attack.weapon,
      caster: attack.caster,
      form: attack.form,
      origin: { ...origin },
      evolved: attack.evolved,
    });
    return;
  }
  if (definition.animation === "sweep") {
    const phase = (attack.age - attack.windup) / attack.active;
    const extension = animationProgress(attack).extension;
    const angle =
      Math.atan2(attack.direction.y, attack.direction.x) + phase * Math.PI * 2;
    const foot = {
      x: origin.x + Math.cos(angle) * attack.range * extension,
      y: origin.y + Math.sin(angle) * attack.range * extension,
    };
    for (const enemy of run.enemies) {
      if (
        attack.hitIds.includes(enemy.id) ||
        pointSegmentDistance(enemy.position, origin, foot) >
          enemy.radius + attack.width * 0.45
      )
        continue;
      attack.hitIds.push(enemy.id);
      hitEnemy(
        run,
        enemy,
        attack.damage,
        {
          x: Math.cos(angle) * 240,
          y: Math.sin(angle) * 240,
        },
        true,
        { character: attack.caster, form: attack.form, origin },
      );
    }
    return;
  }
  const spread =
    definition.animation === "barrage" ? (index % 2 === 0 ? -1 : 1) * 12 : 0;
  const end = {
    x: endpoint.x - attack.direction.y * spread,
    y: endpoint.y + attack.direction.x * spread,
  };
  for (const enemy of run.enemies) {
    if (enemy.health.current <= 0) continue;
    const dx = enemy.position.x - origin.x,
      dy = enemy.position.y - origin.y;
    const distance = Math.hypot(dx, dy);
    let hit = false;
    if (definition.shape === "line")
      hit =
        pointSegmentDistance(enemy.position, origin, end) <
        attack.width + enemy.radius;
    else if (definition.shape === "target")
      hit =
        distanceSquared(enemy.position, attack.target) <
        (attack.width + enemy.radius) ** 2;
    else if (definition.shape === "circle")
      hit = distance < attack.range + enemy.radius;
    else if (definition.shape === "cone")
      hit =
        distance < attack.range + enemy.radius &&
        (distance < 30 ||
          (dx * attack.direction.x + dy * attack.direction.y) / distance >
            Math.cos(Math.PI * 0.38));
    if (hit)
      hitEnemy(
        run,
        enemy,
        attack.damage,
        {
          x: attack.direction.x * 220,
          y: attack.direction.y * 220,
        },
        true,
        { character: attack.caster, form: attack.form, origin },
      );
  }
}
export function updateTechniques(run: Run, dt: number): void {
  const active = activeTechniques(run);
  const slots = run.weapons.filter((w) => active.includes(w.id));
  for (const slot of slots) slot.timer = Math.max(0, slot.timer - dt);
  const groupReady = slots.every((s) => s.timer === 0);
  for (const slot of slots) {
    if (!groupReady) continue;
    if (slot.timer > 0 || run.attacks.length >= 16) continue;
    const definition = techniqueDefinition(
      slot.id,
      casterForm(run, weaponById(slot.id).owner),
    );
    const attack = createAttack(
      run,
      definition,
      slot.evolved,
      definition.owner,
    );
    if (!attack) continue;
    run.attacks.push(attack);
    slot.timer = Math.max(
      attack.windup + attack.active + attack.recovery,
      (definition.cooldown * stats(run, definition.owner).attackPeriod) /
        combat.player.attackPeriod,
    );
  }
  if (active.length > 1 && groupReady) {
    const timer = Math.max(...slots.map((s) => s.timer));
    for (const slot of slots) slot.timer = timer;
  }
  for (const nakama of run.nakama) {
    nakama.timer = Math.max(0, nakama.timer - dt);
    if (nakama.timer > 0 || run.attacks.length >= 16) continue;
    const definition = techniqueDefinition(
      characterById(nakama.character).starter,
      casterForm(run, nakama.character),
    );
    if (active.includes(definition.id)) continue;
    const attack = createAttack(run, definition, false, nakama.character);
    if (attack) {
      run.attacks.push(attack);
      nakama.timer = Math.max(
        attack.windup + attack.active + attack.recovery,
        (definition.cooldown *
          2.6 *
          stats(run, nakama.character).attackPeriod) /
          combat.player.attackPeriod,
      );
    }
  }
  for (const attack of run.attacks) {
    attack.age += dt;
    if (weaponById(attack.weapon).animation === "sweep") {
      if (
        attack.age >= attack.windup &&
        attack.age < attack.windup + attack.active
      )
        strike(run, attack, 0);
      continue;
    }
    for (const moment of attack.strikes)
      if (!moment.fired && attack.age >= moment.at) {
        moment.fired = true;
        strike(run, attack, moment.index);
      }
  }
  run.attacks = run.attacks.filter(
    (attack) => attack.age < attack.windup + attack.active + attack.recovery,
  );
  run.attackTimer = run.weapons[0]?.timer ?? 0;
  for (const projectile of run.projectiles) {
    const old = { ...projectile.position };
    projectile.position.x += projectile.velocity.x * dt;
    projectile.position.y += projectile.velocity.y * dt;
    projectile.life -= dt;
    for (const enemy of run.enemies) {
      if (
        enemy.health.current <= 0 ||
        pointSegmentDistance(enemy.position, old, projectile.position) >
          enemy.radius + 6
      )
        continue;
      hitEnemy(
        run,
        enemy,
        projectile.damage,
        {
          x: projectile.velocity.x * 0.3,
          y: projectile.velocity.y * 0.3,
        },
        true,
        {
          character: projectile.caster,
          form: projectile.form,
          origin: projectile.origin,
        },
      );
      if (projectile.evolved) {
        for (const nearby of run.enemies)
          if (
            nearby.id !== enemy.id &&
            distanceSquared(nearby.position, enemy.position) < 80 ** 2
          )
            hitEnemy(
              run,
              nearby,
              projectile.damage * 0.6,
              { x: 0, y: 0 },
              true,
              {
                character: projectile.caster,
                form: projectile.form,
                origin: projectile.origin,
              },
            );
      }
      projectile.life = 0;
      break;
    }
  }
  run.projectiles = run.projectiles.filter((projectile) => projectile.life > 0);
}
