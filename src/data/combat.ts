export const combat = {
  duration: 300,
  world: { width: 2400, height: 1800, shore: 72 },
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
    health: 28,
    speed: 76,
    radius: 12,
    damage: 10,
    xp: 2,
    color: "#8faec3",
  },
  runner: {
    health: 20,
    speed: 130,
    radius: 9,
    damage: 8,
    xp: 2,
    color: "#e9a263",
  },
  brute: {
    health: 110,
    speed: 55,
    radius: 19,
    damage: 18,
    xp: 6,
    color: "#b47d99",
  },
} as const;
export type EnemyKind = keyof typeof enemyTypes;
export const upgrades = [
  {
    id: "power",
    title: "Golpe certero",
    description: "+25% de daño base.",
    symbol: "✦",
    max: 8,
  },
  {
    id: "tempo",
    title: "Manos rápidas",
    description: "Ataca un 12% más rápido.",
    symbol: "»",
    max: 6,
  },
  {
    id: "multishot",
    title: "Fuego cruzado",
    description: "+1 proyectil por ataque.",
    symbol: "⋔",
    max: 4,
  },
  {
    id: "stride",
    title: "Pies ligeros",
    description: "+10% de velocidad base.",
    symbol: "➶",
    max: 5,
  },
  {
    id: "magnet",
    title: "Brújula de botín",
    description: "+45 de alcance para recoger experiencia.",
    symbol: "◎",
    max: 5,
  },
  {
    id: "vitality",
    title: "Segundo aliento",
    description: "+20 de vida máxima y recupera 35 de vida.",
    symbol: "♥",
    max: 6,
  },
] as const;
export type UpgradeId = (typeof upgrades)[number]["id"];
export const xpForLevel = (level: number): number =>
  6 + level * 4 + Math.floor((level - 1) ** 2 * 1.1);
