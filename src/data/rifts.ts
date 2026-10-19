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
    health: 480,
    damage: 14,
    speed: 64,
    radius: 24,
    windup: 0.9,
    active: 0.3,
    recovery: 1.5,
    range: 310,
    color: "#cf8bb8",
    pattern: "knives",
  },
  kuro: {
    name: "Kuro, de los Mil Planes",
    subtitle: "Shakushi · garras del gato negro",
    health: 700,
    damage: 18,
    speed: 82,
    radius: 22,
    windup: 0.8,
    active: 0.38,
    recovery: 1.3,
    range: 290,
    color: "#99b6b0",
    pattern: "dash",
  },
  arlong: {
    name: "Arlong, el Dientes de Sierra",
    subtitle: "Kiribachi · embestida del tiburón",
    health: 950,
    damage: 22,
    speed: 60,
    radius: 29,
    windup: 1.05,
    active: 0.25,
    recovery: 1.6,
    range: 135,
    color: "#84c8df",
    pattern: "slam",
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
