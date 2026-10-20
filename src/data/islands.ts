import type { BossId } from "./rifts";
export type IslandId =
  | "east-blue"
  | "alabasta"
  | "skypiea"
  | "enies-lobby"
  | "thriller-bark"
  | "marineford"
  | "dressrosa"
  | "wano";
export interface IslandDefinition {
  id: IslandId;
  name: string;
  description: string;
  terrain: number;
  boss: BossId;
  miniboss: BossId;
  faction: string;
  color: string;
  weights: readonly [number, number, number];
  roleChance: number;
  hazard:
    | "none"
    | "lightning"
    | "buster"
    | "shadow"
    | "ice"
    | "thread"
    | "flame";
}
export const islands: Readonly<Record<IslandId, IslandDefinition>> = {
  "east-blue": {
    id: "east-blue",
    name: "East Blue",
    description: "Costa, puerto y Arlong Park.",
    terrain: 0,
    boss: "arlong",
    miniboss: "kuro",
    faction: "Piratas y Marina",
    color: "#9dc5b3",
    weights: [0.5, 0.3, 0.2],
    roleChance: 0.28,
    hazard: "none",
  },
  alabasta: {
    id: "alabasta",
    name: "Alabasta",
    description: "Dunas, ruinas y agentes de Baroque Works.",
    terrain: 240,
    boss: "crocodile",
    miniboss: "mr1",
    faction: "Baroque Works",
    color: "#e2bd78",
    weights: [0.3, 0.35, 0.35],
    roleChance: 0.3,
    hazard: "none",
  },
  skypiea: {
    id: "skypiea",
    name: "Skypiea",
    description: "Mar de nubes, ruinas doradas y guardianes celestes.",
    terrain: 360,
    boss: "enel",
    miniboss: "satori",
    faction: "Guardia de Upper Yard",
    color: "#bce8ef",
    weights: [0.35, 0.45, 0.2],
    roleChance: 0.3,
    hazard: "lightning",
  },
  "enies-lobby": {
    id: "enies-lobby",
    name: "Enies Lobby",
    description: "Fortaleza judicial, agentes del Gobierno y bombardeo naval.",
    terrain: 480,
    boss: "lucci",
    miniboss: "blueno",
    faction: "Agentes del Gobierno",
    color: "#a9bbd6",
    weights: [0.45, 0.35, 0.2],
    roleChance: 0.3,
    hazard: "buster",
  },
  "thriller-bark": {
    id: "thriller-bark",
    name: "Thriller Bark",
    description: "Cementerio sobre un barco, zombis y sombras inquietas.",
    terrain: 600,
    boss: "moria",
    miniboss: "absalom",
    faction: "Zombis de Thriller Bark",
    color: "#bf9cdb",
    weights: [0.25, 0.25, 0.5],
    roleChance: 0.24,
    hazard: "shadow",
  },
  marineford: {
    id: "marineford",
    name: "Marineford",
    description: "Plaza de guerra, placas de hielo y fuerzas de la Marina.",
    terrain: 720,
    boss: "akainu",
    miniboss: "sentomaru",
    faction: "Élite de la Marina",
    color: "#bacbd8",
    weights: [0.5, 0.2, 0.3],
    roleChance: 0.38,
    hazard: "ice",
  },
  dressrosa: {
    id: "dressrosa",
    name: "Dressrosa",
    description: "Plazas floridas, oficiales de la familia y redes de hilo.",
    terrain: 840,
    boss: "doflamingo",
    miniboss: "diamante",
    faction: "Familia Donquixote",
    color: "#edb1ce",
    weights: [0.25, 0.5, 0.25],
    roleChance: 0.32,
    hazard: "thread",
  },
  wano: {
    id: "wano",
    name: "Wano",
    description: "Jardines, aldeas de madera y piratas de las Bestias.",
    terrain: 960,
    boss: "kaido",
    miniboss: "king",
    faction: "Piratas de las Bestias",
    color: "#dca0b0",
    weights: [0.2, 0.3, 0.5],
    roleChance: 0.34,
    hazard: "flame",
  },
};
export const islandIds = Object.keys(islands) as IslandId[];
export const newIslandIds = islandIds.slice(2);
/** Una sola isla: quince ambientes temporales, sin seleccionar destinos ni reiniciar. */
export const survivalRoute: readonly IslandId[] = [
  "east-blue",
  "east-blue",
  "alabasta",
  "skypiea",
  "enies-lobby",
  "thriller-bark",
  "marineford",
  "dressrosa",
  "wano",
  "skypiea",
  "enies-lobby",
  "marineford",
  "dressrosa",
  "wano",
  "thriller-bark",
];
const environmentNames = [
  "Costa pirata",
  "Puerto asediado",
  "Dunas y ruinas",
  "Jardín de nubes",
  "Fortaleza judicial",
  "Bosque de sombras",
  "Campo de guerra",
  "Plaza de los hilos",
  "Jardín de las Bestias",
  "Tormenta celeste",
  "Asedio del Gobierno",
  "Guerra total",
  "Red carmesí",
  "Dominio de las Bestias",
  "Antesala del Trono Vacío",
] as const;
export function survivalStageIndex(seconds: number): number {
  return Math.min(
    survivalRoute.length - 1,
    Math.max(0, Math.floor(seconds / 240)),
  );
}
export function survivalEnvironment(seconds: number): string {
  return environmentNames[survivalStageIndex(seconds)] ?? environmentNames[0];
}
export function islandAt(
  seconds: number,
  mission: string = "survival",
): IslandDefinition {
  if (mission in islands) return islands[mission as IslandId];
  if (mission === "voyage")
    return seconds >= 240 ? islands.alabasta : islands["east-blue"];
  return islands[survivalRoute[survivalStageIndex(seconds)] ?? "east-blue"];
}
