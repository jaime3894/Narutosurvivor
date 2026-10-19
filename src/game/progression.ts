import { terrainTime } from "../data/missions";
import { freePosition } from "./terrain";
import { syncForms } from "./forms";
import { xpForLevel } from "../data/combat";
import {
  contentLimits,
  passives,
  upgrades,
  weaponById,
  weaponKey,
  type UpgradeId,
  type WeaponId,
} from "../data/content";
import type { Run, Chest } from "./types";
import { effect, notify, stats } from "./rules";
export function eligibleUpgrades(run: Run): UpgradeId[] {
  const passiveCount = passives.filter((item) => run.ranks[item.id] > 0).length;
  return upgrades
    .filter((item) => {
      if (run.ranks[item.id] >= item.max) return false;
      const weapon = run.weapons.find((slot) => weaponKey(slot.id) === item.id);
      if (item.id.startsWith("weapon:")) {
        const definition = weaponById(item.id.slice(7) as WeaponId);
        return (
          definition.owner === run.character &&
          (!run.preparation.banned.includes(definition.id) ||
            Boolean(weapon)) &&
          (!weapon || !weapon.evolved) &&
          (Boolean(weapon) || run.weapons.length < contentLimits.weapons)
        );
      }
      return run.ranks[item.id] > 0 || passiveCount < contentLimits.passives;
    })
    .map((item) => item.id);
}
export function grantUpgrade(run: Run, id: UpgradeId): boolean {
  if (!eligibleUpgrades(run).includes(id)) return false;
  run.ranks[id]++;
  if (id.startsWith("weapon:")) {
    const weaponId = id.slice(7) as WeaponId;
    if (!run.weapons.some((slot) => slot.id === weaponId))
      run.weapons.push({ id: weaponId, timer: 0, evolved: false });
  }
  if (id === "vitality") {
    run.player.health.maximum += 20;
    run.player.health.current = Math.min(
      run.player.health.maximum,
      run.player.health.current + 35,
    );
  }
  syncForms(run);
  return true;
}
export function offerUpgrades(run: Run): void {
  if (run.status !== "playing" || run.xp < xpForLevel(run.level)) return;
  run.xp -= xpForLevel(run.level);
  run.level++;
  const available = eligibleUpgrades(run);
  run.choices = [];
  // Una opción de técnica si queda alguna, para evitar elecciones enteras de pasivos al principio.
  const technique = available.filter((id) => id.startsWith("weapon:"));
  if (technique.length > 0) {
    const selected = technique[Math.floor(run.random() * technique.length)];
    if (selected) {
      run.choices.push(selected);
      available.splice(available.indexOf(selected), 1);
    }
  }
  while (available.length > 0 && run.choices.length < 3) {
    const [choice] = available.splice(
      Math.floor(run.random() * available.length),
      1,
    );
    if (choice) run.choices.push(choice);
  }
  effect(run, run.player.position, "level");
  if (run.choices.length === 0) {
    run.player.health.current = Math.min(
      run.player.health.maximum,
      run.player.health.current + 25,
    );
    notify(run, "Maestría completa · recuperas 25 de vida");
  } else run.status = "upgrade";
}
export function chooseUpgrade(run: Run, id: UpgradeId): boolean {
  if (
    run.status !== "upgrade" ||
    !run.choices.includes(id) ||
    !grantUpgrade(run, id)
  )
    return false;
  run.choices = [];
  run.status = "playing";
  offerUpgrades(run);
  return true;
}
export function evolutionCandidates(run: Run): WeaponId[] {
  if (run.elapsed < contentLimits.evolutionTime) return [];
  return run.weapons
    .filter(
      (slot) =>
        !slot.evolved &&
        run.ranks[weaponKey(slot.id)] >= contentLimits.weaponRank &&
        run.ranks[weaponById(slot.id).evolution.passive] >=
          contentLimits.passiveEvolutionRank,
    )
    .map((slot) => slot.id);
}
export function spawnChest(
  run: Run,
  position = run.player.position,
): Chest | undefined {
  if (run.chests.length >= 4) return undefined;
  const chest = {
    id: run.nextId++,
    position: run.arena
      ? { ...position }
      : freePosition(position, 20, terrainTime(run.elapsed, run.mission)),
  };
  run.chests.push(chest);
  return chest;
}
export function openChest(run: Run, id: number): boolean {
  if (run.status !== "playing" || !run.chests.some((chest) => chest.id === id))
    return false;
  run.chests = run.chests.filter((chest) => chest.id !== id);
  run.openedChests++;
  run.chestSerial++;
  run.chestRewards = evolutionCandidates(run)
    .slice(0, 1)
    .map((id) => ({
      kind: "evolution",
      id: weaponKey(id),
      title: weaponById(id).evolution.title,
      detail: "Evolucionar · +65% daño, +20% alcance y ejecución reforzada",
    }));
  const pool = eligibleUpgrades(run).filter(
    (id) => !run.chestRewards.some((r) => r.id === id),
  );
  while (pool.length && run.chestRewards.length < 3) {
    const [id] = pool.splice(Math.floor(run.random() * pool.length), 1);
    if (id)
      run.chestRewards.push({
        kind: "upgrade",
        id,
        title: upgrades.find((u) => u.id === id)?.title ?? id,
        detail: `Rango ${run.ranks[id] + 1}`,
      });
  }
  const amount = Math.round(
    75 * stats(run).currency * (1 + run.ranks.luck * 0.1),
  );
  const fallback: Run["chestRewards"] = [
    {
      kind: "berries",
      amount,
      title: `${amount} berries`,
      detail: "Botín de esta partida",
    },
    {
      kind: "vitality",
      amount: 15,
      title: "Reserva de vitalidad",
      detail: "+15 vida máxima y recuperas 15",
    },
    {
      kind: "haste",
      amount: 12,
      title: "Impulso de combate",
      detail: "12 segundos de velocidad y cadencia",
    },
  ];
  while (run.chestRewards.length < 3) {
    const reward = fallback.shift();
    if (reward) run.chestRewards.push(reward);
  }
  run.status = "chest";
  return true;
}
export function chooseChestReward(run: Run, index: number): boolean {
  const reward = run.chestRewards[index];
  if (run.status !== "chest" || !Number.isInteger(index) || !reward)
    return false;
  if (reward.kind === "evolution" && reward.id) {
    const slot = run.weapons.find(
      (w) =>
        weaponKey(w.id) === reward.id &&
        evolutionCandidates(run).includes(w.id),
    );
    if (!slot) return false;
    slot.evolved = true;
    run.evolvedCount++;
    effect(run, run.player.position, "evolve");
    syncForms(run);
  } else if (reward.kind === "upgrade" && reward.id) {
    if (!grantUpgrade(run, reward.id)) return false;
  } else if (reward.kind === "berries") run.berries += reward.amount ?? 0;
  else if (reward.kind === "vitality") {
    run.player.health.maximum += reward.amount ?? 15;
    run.player.health.current = Math.min(
      run.player.health.maximum,
      run.player.health.current + (reward.amount ?? 15),
    );
  } else if (reward.kind === "haste")
    run.haste = Math.max(run.haste, reward.amount ?? 12);
  run.chestRewards = [];
  run.status = "playing";
  offerUpgrades(run);
  return true;
}
// Compatibilidad con herramientas de simulación: equivale a elegir la primera tarjeta.
export function closeChest(run: Run): void {
  chooseChestReward(run, 0);
}

export function canReroll(run: Run): boolean {
  return (
    run.status === "upgrade" &&
    run.rerollsLeft > 0 &&
    eligibleUpgrades(run).some((id) => !run.choices.includes(id))
  );
}
export function rerollUpgrades(run: Run): boolean {
  if (!canReroll(run)) return false;
  const available = eligibleUpgrades(run),
    fresh = available.filter((id) => !run.choices.includes(id)),
    first = fresh[Math.floor(run.random() * fresh.length)];
  if (!first) return false;
  run.choices = [first];
  available.splice(available.indexOf(first), 1);
  while (available.length && run.choices.length < 3) {
    const [id] = available.splice(
      Math.floor(run.random() * available.length),
      1,
    );
    if (id) run.choices.push(id);
  }
  run.rerollsLeft--;
  run.rewardSerial++;
  return true;
}
