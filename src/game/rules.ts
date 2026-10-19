import { combat, enemyTypes } from "../data/combat";
import {
  affinityNames,
  passives,
  weaponById,
  type Affinity,
} from "../data/content";
import type { Position } from "../core/entity";
import type { Effect, Enemy, Run } from "./types";
export const distanceSquared = (a: Position, b: Position): number =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export function affinities(run: Run): Partial<Record<Affinity, number>> {
  const counts: Partial<Record<Affinity, number>> = {};
  for (const slot of run.weapons) {
    const affinity = weaponById(slot.id).affinity;
    counts[affinity] = (counts[affinity] ?? 0) + 1;
  }
  for (const passive of passives)
    if (run.ranks[passive.id] > 0)
      counts[passive.affinity] = (counts[passive.affinity] ?? 0) + 1;
  return counts;
}
export const stats = (run: Run) => ({
  damage:
    combat.player.damage *
    (1 + run.ranks.power * 0.25 + run.ranks.spirit * 0.05),
  attackPeriod:
    (combat.player.attackPeriod * 0.88 ** run.ranks.tempo) /
    (run.haste > 0 ? 1.2 : 1),
  speed:
    combat.player.speed *
    (1 + run.ranks.stride * 0.1) *
    (run.haste > 0 ? 1.25 : 1),
  projectiles: 1 + run.ranks.multishot,
  magnet: 68 + run.ranks.magnet * 45,
  range: 1 + run.ranks.reach * 0.12,
  duration: 1 + run.ranks.duration * 0.15,
  armor: run.ranks.armor * 2,
  criticalChance: run.ranks.crit * 0.06,
  dashCooldown: combat.dash.cooldown * 0.92 ** run.ranks.spirit,
});
export function effect(
  run: Run,
  position: Position,
  kind: Effect["kind"],
  value = 0,
): void {
  if (run.effects.length >= 180) run.effects.shift();
  const life = kind === "pickup" ? 0.2 : kind === "evolve" ? 0.8 : 0.4;
  run.effects.push({
    position: { ...position },
    kind,
    life,
    total: life,
    value,
  });
}
export function notify(run: Run, text: string): void {
  run.notice = text;
  run.noticeTime = 3;
}
export function addDrop(run: Run, drop: Run["drops"][number]): void {
  if (run.drops.length < combat.maximumDrops) {
    run.drops.push(drop);
    return;
  }
  const same = run.drops.find((item) => item.kind === drop.kind);
  if (
    same &&
    (drop.kind === "xp" || drop.kind === "coin" || drop.kind === "heal")
  )
    same.value += drop.value;
  else if (drop.kind === "xp" || drop.kind === "coin") {
    const replace = run.drops.findIndex(
      (item) => item.kind !== "xp" && item.kind !== "coin",
    );
    if (replace >= 0) run.drops[replace] = drop;
  }
}
export function hitEnemy(
  run: Run,
  enemy: Enemy,
  damage: number,
  impulse: Position,
  canCrit = true,
): void {
  if (enemy.health.current <= 0) return;
  const critical =
    canCrit && run.ranks.crit > 0 && run.random() < stats(run).criticalChance;
  const amount = damage * (critical ? 1.7 : 1);
  run.damageDealt += Math.min(enemy.health.current, amount);
  enemy.health.current -= amount;
  enemy.flash = critical ? 0.18 : 0.1;
  enemy.velocity.x += impulse.x;
  enemy.velocity.y += impulse.y;
  effect(
    run,
    enemy.position,
    critical ? "critical" : "hit",
    Math.round(amount),
  );
  if (critical) run.hitStop = Math.max(run.hitStop, 0.025);
  if (enemy.health.current > 0) return;
  run.kills++;
  effect(run, enemy.position, "kill");
  addDrop(run, {
    position: { ...enemy.position },
    value: enemyTypes[enemy.kind].xp,
    kind: "xp",
    attracted: false,
  });
  if (run.kills % 18 === 0)
    addDrop(run, {
      position: { ...enemy.position },
      value: 18,
      kind: "heal",
      attracted: false,
    });
  if (run.kills % 9 === 0)
    addDrop(run, {
      position: { ...enemy.position },
      value: 10,
      kind: "coin",
      attracted: false,
    });
  if (run.kills % 70 === 0) {
    const kind =
      (["vacuum", "bomb", "haste"] as const)[Math.floor(run.random() * 3)] ??
      "vacuum";
    addDrop(run, {
      position: { ...enemy.position },
      value: 1,
      kind,
      attracted: false,
    });
  }
}
export const affinityDescription = (run: Run): string =>
  Object.entries(affinities(run))
    .filter(([, count]) => count >= 2)
    .map(
      ([id, count]) =>
        `${affinityNames[id as Affinity]} ${count} · +12% daño${count >= 3 ? ", +8% alcance" : ""}`,
    )
    .join(" / ");
