import { terrainTime, type MissionId } from "./missions";
export const voyageStages = [
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
    subtitle: "Último minuto · enemigos veteranos",
    ground: 4,
    path: 5,
    props: [8, 9, 10, 11],
    health: 1.45,
    speed: 1.12,
    damage: 1.3,
    spawn: 0.8,
    brutes: 0.35,
  },
] as const;
export type VoyageStage = (typeof voyageStages)[number];
export const voyageStage = (
  seconds: number,
  mission: MissionId = "voyage",
): VoyageStage =>
  terrainTime(seconds, mission) >= 240
    ? voyageStages[2]
    : terrainTime(seconds, mission) >= 120
      ? voyageStages[1]
      : voyageStages[0];
