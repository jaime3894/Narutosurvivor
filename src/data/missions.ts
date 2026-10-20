import { islands, islandAt, survivalRoute, type IslandId } from "./islands";
import { survivalRules } from "./survival";
import type { BossId } from "./rifts";
export type MissionId = "survival" | "voyage" | IslandId;
export interface WaveDefinition {
  at: number;
  name: string;
  interval: number;
  batch: number;
  weights: readonly [number, number, number];
  health: number;
  speed: number;
  damage: number;
}
export interface EncounterDefinition {
  at: number;
  boss: BossId;
  role: "miniboss" | "final";
  health: number;
  seconds: number;
}
export interface MissionDefinition {
  id: Exclude<MissionId, "voyage" | "survival">;
  name: string;
  description: string;
  duration: number;
  encounters: readonly EncounterDefinition[];
  waves: readonly WaveDefinition[];
  busterAt: number;
  busterDuration: number;
}
const wave = (
  at: number,
  name: string,
  interval: number,
  batch: number,
  weights: readonly [number, number, number],
  health: number,
  speed = 1,
  damage = 1,
): WaveDefinition => ({
  at,
  name,
  interval,
  batch,
  weights,
  health,
  speed,
  damage,
});
function chapter(
  id: Exclude<IslandId, "east-blue" | "alabasta">,
): MissionDefinition {
  const i = islands[id];
  return {
    id,
    name: i.name,
    description: i.description,
    duration: 300,
    busterAt: 210,
    busterDuration: i.hazard === "buster" ? 28 : 18,
    encounters: [
      { at: 90, boss: i.miniboss, role: "miniboss", health: 0.65, seconds: 90 },
      { at: 300, boss: i.boss, role: "final", health: 1, seconds: 150 },
    ],
    waves: [
      wave(0, i.faction, 0.8, 1, i.weights, 1),
      wave(60, "Avanzada · " + i.faction, 0.68, 2, i.weights, 1.1),
      wave(150, "Asalto · " + i.name, 0.56, 2, i.weights, 1.25, 1.04),
      wave(240, "Guardia del jefe", 0.46, 3, i.weights, 1.4, 1.08, 1.15),
    ],
  };
}
export const missions: Readonly<
  Record<Exclude<MissionId, "voyage" | "survival">, MissionDefinition>
> = {
  "east-blue": {
    id: "east-blue",
    name: "East Blue",
    description:
      "Costa, puerto y Arlong Park. Buggy y Kuro vigilan el camino; Arlong espera al final.",
    duration: 300,
    busterAt: 210,
    busterDuration: 24,
    encounters: [
      { at: 75, boss: "buggy", role: "miniboss", health: 0.7, seconds: 75 },
      { at: 155, boss: "kuro", role: "miniboss", health: 0.7, seconds: 75 },
      { at: 300, boss: "arlong", role: "final", health: 1, seconds: 120 },
    ],
    waves: [
      wave(0, "Desembarco", 0.85, 1, [1, 0, 0], 1),
      wave(45, "Patrulla del puerto", 0.72, 1, [0.65, 0.35, 0], 1.05),
      wave(105, "Refuerzos de Kuro", 0.66, 2, [0.4, 0.45, 0.15], 1.1),
      wave(
        180,
        "Piratas de Arlong",
        0.55,
        2,
        [0.35, 0.3, 0.35],
        1.2,
        1.05,
        1.1,
      ),
      wave(
        240,
        "Asalto a Arlong Park",
        0.45,
        3,
        [0.25, 0.35, 0.4],
        1.35,
        1.08,
        1.2,
      ),
    ],
  },
  skypiea: chapter("skypiea"),
  "enies-lobby": chapter("enies-lobby"),
  "thriller-bark": chapter("thriller-bark"),
  marineford: chapter("marineford"),
  dressrosa: chapter("dressrosa"),
  wano: chapter("wano"),
  alabasta: {
    id: "alabasta",
    name: "Alabasta",
    description:
      "Cruza las dunas y las ruinas de Rainbase. Derrota a Mr.1 y detén a Crocodile.",
    duration: 300,
    busterAt: 210,
    busterDuration: 28,
    encounters: [
      { at: 90, boss: "mr1", role: "miniboss", health: 0.7, seconds: 90 },
      { at: 300, boss: "crocodile", role: "final", health: 1, seconds: 120 },
    ],
    waves: [
      wave(0, "Dunas de Nanohana", 0.8, 1, [0.7, 0.3, 0], 1),
      wave(45, "Agentes de Baroque Works", 0.68, 1, [0.5, 0.35, 0.15], 1.05),
      wave(105, "Emboscada en Rainbase", 0.6, 2, [0.3, 0.45, 0.25], 1.1),
      wave(180, "Guardia de Alubarna", 0.5, 2, [0.3, 0.3, 0.4], 1.2, 1.05, 1.1),
      wave(
        240,
        "Tormenta de arena",
        0.43,
        3,
        [0.2, 0.35, 0.45],
        1.35,
        1.1,
        1.2,
      ),
    ],
  },
};
export function terrainTime(
  seconds: number,
  mission: MissionId = "voyage",
): number {
  if (mission === "survival") {
    const zone =
      Math.floor(seconds / survivalRules.zoneSeconds) % survivalRoute.length;
    return zone === 1
      ? 120
      : islands[survivalRoute[zone] ?? "east-blue"].terrain;
  }
  if (mission === "voyage") return Math.min(seconds, 359);
  return mission === "east-blue"
    ? Math.min(seconds, 239)
    : islands[mission].terrain;
}
export function waveAt(
  seconds: number,
  mission: MissionId,
): WaveDefinition | undefined {
  if (mission === "voyage" || (mission === "survival" && seconds < 720))
    return undefined;
  if (mission === "survival") {
    const island = islandAt(seconds),
      zone = Math.floor(seconds / 240);
    return wave(
      0,
      island.faction,
      Math.max(0.19, 0.85 - seconds * 0.0018),
      Math.min(6, 1 + Math.floor(seconds / 90)),
      island.weights,
      1.45 + Math.min(zone * 0.03, 1),
      1.1,
      1.25,
    );
  }
  const waves = missions[mission].waves;
  return [...waves].reverse().find((w) => seconds >= w.at) ?? waves[0];
}
export const busterRules = {
  interval: 2.2,
  warning: 1.35,
  radius: 48,
  damage: 24,
  maxShells: 8,
} as const;
