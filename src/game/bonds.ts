import { weapons, weaponById, weaponKey, type WeaponId } from "../data/content";
import { boons } from "../data/rifts";
import type { Run } from "./types";
import { offerUpgrades } from "./progression";
export function activeTechniques(run: Run): WeaponId[] {
  const active = run.weapons.some((w) => w.id === run.activeWeapon)
    ? run.activeWeapon
    : run.weapons[0]?.id;
  return active
    ? run.linkedWeapons.includes(active)
      ? run.linkedWeapons
      : [active]
    : [];
}
export function selectTechnique(run: Run, id: WeaponId): boolean {
  if (run.status !== "playing" || !run.weapons.some((w) => w.id === id))
    return false;
  run.activeWeapon = id;
  return true;
}
export function bondCandidates(run: Run): WeaponId[] {
  if (run.linkedWeapons.length >= 4) return [];
  return weapons
    .filter(
      (w) =>
        !run.linkedWeapons.includes(w.id) &&
        (run.linkedWeapons.length > 0 || w.id !== run.activeWeapon) &&
        (run.weapons.some((s) => s.id === w.id) || run.weapons.length < 4),
    )
    .map((w) => w.id);
}
export function offerBossRewards(run: Run): void {
  run.bossRewards = [];
  if (bondCandidates(run).length)
    run.bossRewards.push({
      kind: "bond",
      id: "bond",
      title: `Vincular ${Math.max(2, run.linkedWeapons.length + 1)} técnicas`,
      detail: "Lanzarlas juntas · cada nakama conserva sus propios poderes",
    });
  const available = Object.entries(boons).filter(
    ([id, b]) => run.boons[id as keyof typeof boons] < b.max,
  );
  while (available.length && run.bossRewards.length < 3) {
    const [entry] = available.splice(
      Math.floor(run.random() * available.length),
      1,
    );
    if (entry) {
      const [id, b] = entry;
      run.bossRewards.push({
        kind: "boon",
        id: id as keyof typeof boons,
        title: b.title,
        detail: b.detail,
      });
    }
  }
  // Siempre hay recompensa útil, incluso después de maximizar todos los atributos.
  if (!run.bossRewards.length)
    run.bossRewards.push({
      kind: "boon",
      id: "health",
      title: "Reserva de vida",
      detail: "+25 vida máxima y recuperas 25",
    });
  run.rewardSerial++;
  run.status = "bossReward";
}
export function chooseBossReward(run: Run, index: number): boolean {
  const reward = run.bossRewards[index];
  if (run.status !== "bossReward" || !Number.isInteger(index) || !reward)
    return false;
  if (reward.kind === "bond") {
    run.status = "bond";
    run.rewardSerial++;
    return true;
  }
  if (reward.id === "bond") return false;
  run.boons[reward.id]++;
  if (reward.id === "health") {
    run.player.health.maximum += 25;
    run.player.health.current = Math.min(
      run.player.health.maximum,
      run.player.health.current + 25,
    );
  }
  finishReward(run);
  return true;
}
function finishReward(run: Run): void {
  run.bossRewards = [];
  run.status = "playing";
  offerUpgrades(run);
}
export function linkTechnique(run: Run, id: WeaponId): boolean {
  if (run.status !== "bond" || !bondCandidates(run).includes(id)) return false;
  if (!run.linkedWeapons.length) run.linkedWeapons = [run.activeWeapon];
  if (!run.weapons.some((w) => w.id === id)) {
    run.weapons.push({ id, timer: 0, evolved: false });
    run.ranks[weaponKey(id)] = 1;
  }
  const owner = weaponById(id).owner;
  if (
    owner !== run.character &&
    ![...run.nakama, ...run.assists].some((n) => n.character === owner)
  )
    run.assists.push({
      character: owner,
      position: { ...run.player.position },
      facing: { ...run.player.facing },
      moving: false,
      timer: 0,
      supportTimer: 12,
    });
  run.linkedWeapons.push(id);
  run.activeWeapon = run.linkedWeapons[0] ?? id;
  for (const slot of run.weapons) slot.timer = 0;
  run.notice = `Vínculo ${run.linkedWeapons.length}/4 · ${run.linkedWeapons.map((w) => weaponById(w).title).join(" + ")}`;
  run.noticeTime = 4;
  finishReward(run);
  return true;
}
export function cancelBond(run: Run): void {
  if (run.status === "bond") {
    run.status = "bossReward";
    run.rewardSerial++;
  }
}
