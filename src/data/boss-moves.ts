export const bossMoves = {
  shadowFan: {
    name: "Lanzas del vacío",
    windup: 1.25,
    active: 0.5,
    recovery: 1.5,
    range: 460,
    damage: 1,
  },
  eclipse: {
    name: "Eclipse del trono",
    windup: 1.6,
    active: 0.6,
    recovery: 1.8,
    range: 85,
    damage: 1.2,
  },
  throneRay: {
    name: "Sentencia del trono",
    windup: 1.5,
    active: 0.6,
    recovery: 2,
    range: 600,
    damage: 1.3,
  },
  bladeCross: {
    name: "Spider · corte de acero",
    windup: 1,
    active: 0.35,
    recovery: 1.2,
    range: 155,
    damage: 1.3,
  },
  bladeDash: {
    name: "Sparkling Daisy",
    windup: 1.05,
    active: 0.5,
    recovery: 1.3,
    range: 300,
    damage: 1.25,
  },
  bladeFan: {
    name: "Spiral Hollow",
    windup: 1.2,
    active: 0.4,
    recovery: 1.4,
    range: 320,
    damage: 1.1,
  },
  sandFan: {
    name: "Desert Spada",
    windup: 1.15,
    active: 0.45,
    recovery: 1.3,
    range: 360,
    damage: 1.1,
  },
  sandTomb: {
    name: "Desert Girasole",
    windup: 1.55,
    active: 0.4,
    recovery: 1.5,
    range: 100,
    damage: 1.5,
  },
  hookDash: {
    name: "Gancho dorado",
    windup: 1.1,
    active: 0.6,
    recovery: 1.4,
    range: 290,
    damage: 1.3,
  },
  knifeFan: {
    name: "Bara Bara · abanico de cuchillos",
    windup: 0.9,
    active: 0.32,
    recovery: 1.1,
    range: 330,
    damage: 1,
  },
  knifeRing: {
    name: "Bara Bara · rueda de dagas",
    windup: 1.1,
    active: 0.4,
    recovery: 1.4,
    range: 300,
    damage: 0.9,
  },
  bomb: {
    name: "Bomba Buggy",
    windup: 1.3,
    active: 0.35,
    recovery: 1.4,
    range: 90,
    damage: 1.5,
  },
  dash: {
    name: "Shakushi · corte veloz",
    windup: 0.85,
    active: 0.42,
    recovery: 1.1,
    range: 290,
    damage: 1.15,
  },
  crossDash: {
    name: "Shakushi · doble cruce",
    windup: 1.05,
    active: 0.74,
    recovery: 1.5,
    range: 270,
    damage: 1.2,
  },
  claw: {
    name: "Garras del gato negro",
    windup: 0.7,
    active: 0.3,
    recovery: 0.8,
    range: 135,
    damage: 1.3,
  },
  slam: {
    name: "Kiribachi · golpe de sierra",
    windup: 1.1,
    active: 0.35,
    recovery: 1.3,
    range: 150,
    damage: 1.3,
  },
  sharkWave: {
    name: "Karate gyojin · oleada",
    windup: 1.1,
    active: 0.45,
    recovery: 1.3,
    range: 360,
    damage: 1,
  },
  charge: {
    name: "Shark on Darts",
    windup: 1.15,
    active: 0.65,
    recovery: 1.5,
    range: 300,
    damage: 1.2,
  },
} as const;
export type BossMoveId = keyof typeof bossMoves;
export const bossRepertoire = {
  imu: ["shadowFan", "eclipse", "throneRay"],
  mr1: ["bladeCross", "bladeDash", "bladeFan"],
  crocodile: ["sandFan", "sandTomb", "hookDash"],
  buggy: ["knifeFan", "bomb", "knifeRing"],
  kuro: ["dash", "claw", "crossDash"],
  arlong: ["slam", "sharkWave", "charge"],
} as const satisfies Record<string, readonly BossMoveId[]>;

export interface FanPattern {
  count: number;
  enraged: number;
  speed: number;
  spread: number;
  kind: "knife" | "wave" | "sand";
  radial?: boolean;
}
/** Motor y avisos comparten cantidad, velocidad y ángulos de los proyectiles. */
export const fanPatterns: Readonly<Partial<Record<BossMoveId, FanPattern>>> = {
  knifeFan: { count: 7, enraged: 9, speed: 280, spread: 0.15, kind: "knife" },
  knifeRing: {
    count: 12,
    enraged: 16,
    speed: 220,
    spread: 0,
    kind: "knife",
    radial: true,
  },
  sharkWave: { count: 3, enraged: 5, speed: 220, spread: 0.27, kind: "wave" },
  bladeFan: { count: 7, enraged: 9, speed: 300, spread: 0.16, kind: "knife" },
  sandFan: { count: 5, enraged: 7, speed: 235, spread: 0.22, kind: "sand" },
};
