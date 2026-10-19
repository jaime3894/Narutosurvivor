export const riftRules = {
  firstTime: 35,
  firstKills: 80,
  interval: 45,
  killInterval: 120,
  ttl: 40,
  arenaTime: 75,
  arenaRadius: 290,
  maxBond: 4,
} as const;
export const bosses = {
  buggy: {
    name: "Buggy, el Payaso",
    subtitle: "Bara Bara · lluvia de cuchillos",
    health: 1100,
    damage: 18,
    speed: 82,
    radius: 24,
    color: "#cf8bb8",
  },
  kuro: {
    name: "Kuro, de los Mil Planes",
    subtitle: "Shakushi · garras del gato negro",
    health: 1700,
    damage: 22,
    speed: 105,
    radius: 22,
    color: "#99b6b0",
  },
  arlong: {
    name: "Arlong, el Dientes de Sierra",
    subtitle: "Kiribachi · embestida del tiburón",
    health: 2400,
    damage: 28,
    speed: 80,
    radius: 29,
    color: "#84c8df",
  },
} as const;
export type BossId = keyof typeof bosses;
export const bossOrder: readonly BossId[] = ["buggy", "kuro", "arlong"];
export const boons = {
  damage: {
    title: "Voluntad del conquistador",
    detail: "+15% de daño permanente en esta partida",
    max: 20,
  },
  health: {
    title: "Vitalidad de la tripulación",
    detail: "+25 de vida máxima y recuperas 25 de vida",
    max: 20,
  },
  speed: {
    title: "Paso de aventurero",
    detail: "+10% de velocidad permanente",
    max: 6,
  },
  armor: {
    title: "Guardia de acero",
    detail: "+2 de armadura permanente",
    max: 10,
  },
  regen: {
    title: "Segundo aliento",
    detail: "+0,5 de vida por segundo",
    max: 10,
  },
  tempo: {
    title: "Ritmo de combate",
    detail: "+10% de cadencia permanente",
    max: 8,
  },
} as const;
export type BoonId = keyof typeof boons;
