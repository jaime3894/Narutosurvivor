import { weapons, type UpgradeId } from "../data/content";
export const iconNames = [
  ...weapons.map((w) => w.id),
  "vitality",
  "power",
  "tempo",
  "stride",
  "magnet",
  "armor",
  "crit",
  "reach",
  "duration",
  "spirit",
  "regen",
  "luck",
  "greed",
  "multishot",
  "experience",
  "chest",
  "wheel",
  "upgrade",
] as const;
export function iconMarkup(key: string, className = ""): string {
  const clean = key.startsWith("weapon:") ? key.slice(7) : key;
  const index = iconNames.findIndex((id) => id === clean),
    i = index < 0 ? 35 : index;
  return `<span class="game-icon ${className}" aria-hidden="true" style="--icon-x:${i % 6};--icon-y:${Math.floor(i / 6)}"></span>`;
}
export const upgradeIcon = (id: UpgradeId): string =>
  iconMarkup(id, "upgrade-icon");
