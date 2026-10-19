export const combat = {
  duration: 300,
  world: { width: 4800, height: 3600, shore: 72 },
  player: {
    radius: 12,
    speed: 215,
    health: 100,
    damage: 24,
    attackPeriod: 0.65,
    range: 520,
  },
  dash: { speed: 740, duration: 0.18, cooldown: 2.6 },
  maximumEnemies: 150,
  maximumDrops: 240,
} as const;
export const enemyTypes = {
  sailor: {
    name: "Marinero de la Marina",
    health: 28,
    speed: 76,
    radius: 12,
    damage: 10,
    xp: 2,
    color: "#8faec3",
  },
  runner: {
    name: "Pirata de la banda de Buggy",
    health: 20,
    speed: 130,
    radius: 9,
    damage: 8,
    xp: 2,
    color: "#e9a263",
  },
  brute: {
    name: "Matón de Alvida",
    health: 110,
    speed: 55,
    radius: 19,
    damage: 18,
    xp: 6,
    color: "#b47d99",
  },
} as const;
export type EnemyKind = keyof typeof enemyTypes;
export { upgrades, type UpgradeId } from "./content";
export const xpForLevel = (level: number): number =>
  6 + level * 4 + Math.floor((level - 1) ** 2 * 1.1);
