import { terrainTime, type MissionId } from "./missions";
export interface VoyageStage {
  id: string;
  at: number;
  name: string;
  subtitle: string;
  ground: number;
  path: number;
  props: readonly [number, number, number, number];
  health: number;
  speed: number;
  damage: number;
  spawn: number;
  brutes: number;
}
export const voyageStages: readonly VoyageStage[] = [
  {
    id: "coast",
    at: 0,
    name: "East Blue · Costa del amanecer",
    subtitle: "Una brisa antes de la tormenta",
    ground: 0,
    path: 1,
    props: [0, 1, 2, 3],
    health: 1,
    speed: 1,
    damage: 1,
    spawn: 1,
    brutes: 0.17,
  },
  {
    id: "harbor",
    at: 120,
    name: "East Blue · Puerto de contrabandistas",
    subtitle: "Llegan refuerzos al muelle",
    ground: 2,
    path: 5,
    props: [4, 5, 6, 7],
    health: 1.15,
    speed: 1.04,
    damage: 1.1,
    spawn: 0.94,
    brutes: 0.23,
  },
  {
    id: "desert",
    at: 240,
    name: "Alabasta · Vanguardia del desierto",
    subtitle: "Dunas y ruinas · enemigos veteranos",
    ground: 4,
    path: 5,
    props: [8, 9, 10, 11],
    health: 1.45,
    speed: 1.12,
    damage: 1.3,
    spawn: 0.8,
    brutes: 0.35,
  },
  ...[
    [
      "sky",
      360,
      "Skypiea · Upper Yard",
      "Nubes, oro y guardianes celestes",
      8,
      9,
    ],
    [
      "judicial",
      480,
      "Enies Lobby · Torre de Justicia",
      "Rokushiki bajo el fuego de la Marina",
      10,
      11,
    ],
    [
      "haunted",
      600,
      "Thriller Bark · Cementerio del terror",
      "Las sombras no detienen tu avance",
      12,
      13,
    ],
    [
      "war",
      720,
      "Marineford · Plaza de guerra",
      "Hielo y acero sobre la bahía",
      14,
      15,
    ],
    [
      "roses",
      840,
      "Dressrosa · Plaza de las flores",
      "Esquiva los hilos de la familia",
      16,
      17,
    ],
    [
      "samurai",
      960,
      "Wano · Camino de los cerezos",
      "El territorio de las Bestias",
      18,
      19,
    ],
  ].map((row, index) => ({
    id: String(row[0]),
    at: Number(row[1]),
    name: String(row[2]),
    subtitle: String(row[3]),
    ground: Number(row[4]),
    path: Number(row[5]),
    props: [
      12 + index * 4,
      13 + index * 4,
      14 + index * 4,
      15 + index * 4,
    ] as const,
    health: 1.45 + index * 0.08,
    speed: 1.1,
    damage: 1.25,
    spawn: 0.8,
    brutes: 0.3,
  })),
];
export function voyageStage(
  seconds: number,
  mission: MissionId = "voyage",
): VoyageStage {
  return terrainStage(terrainTime(seconds, mission));
}
/** Código de terreno ya resuelto: no vuelve a aplicar el reloj de una misión. */
export function terrainStage(code: number): VoyageStage {
  return (
    [...voyageStages].reverse().find((s) => code >= s.at) ?? voyageStages[0]!
  );
}
