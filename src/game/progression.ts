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
  const chest = { id: run.nextId++, position: { ...position } };
  run.chests.push(chest);
  return chest;
}
export function openChest(run: Run, id: number): boolean {
  if (run.status !== "playing" || !run.chests.some((chest) => chest.id === id))
    return false;
  run.chests = run.chests.filter((chest) => chest.id !== id);
  run.openedChests++;
  run.chestSerial++;
  const roll = run.random() * 100;
  const count =
    roll < 5 + run.ranks.luck ? 5 : roll < 30 + run.ranks.luck * 2 ? 3 : 1;
  run.chestRewards = [];
  for (let i = 0; i < count; i++) {
    const evolution = evolutionCandidates(run)[0];
    if (evolution) {
      const slot = run.weapons.find((item) => item.id === evolution);
      if (slot) {
        slot.evolved = true;
        run.evolvedCount++;
        const definition = weaponById(evolution);
        run.chestRewards.push({
          kind: "evolution",
          title: definition.evolution.title,
          detail:
            "Técnica evolucionada · +65% daño, +20% alcance y ejecución reforzada",
          id: weaponKey(evolution),
        });
        effect(run, run.player.position, "evolve");
      }
    } else {
      const pool = eligibleUpgrades(run);
      const choice = pool[Math.floor(run.random() * pool.length)];
      if (choice && grantUpgrade(run, choice)) {
        run.chestRewards.push({
          kind: "upgrade",
          title: upgrades.find((item) => item.id === choice)?.title ?? choice,
          detail: `Rango ${run.ranks[choice]}`,
          id: choice,
        });
      } else {
        const berries = Math.round(75 * stats(run).currency);
        run.berries += berries;
        run.chestRewards.push({
          kind: "berries",
          title: `${berries} berries`,
          detail: "Botín de esta partida",
        });
      }
    }
  }
  run.status = "chest";
  return true;
}
export function closeChest(run: Run): void {
  if (run.status !== "chest") return;
  run.status = "playing";
  offerUpgrades(run);
}
