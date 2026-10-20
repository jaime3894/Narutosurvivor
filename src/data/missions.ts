import { survivalRules } from "./survival";
import type { BossId } from "./rifts";
export type MissionId = "survival" | "voyage" | "east-blue" | "alabasta";
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
  return mission === "survival"
    ? [0, 120, 240][Math.floor(seconds / survivalRules.zoneSeconds) % 3]!
    : mission === "east-blue"
      ? Math.min(seconds, 239)
      : mission === "alabasta"
        ? 240 + seconds
        : seconds;
}
export function waveAt(
  seconds: number,
  mission: MissionId,
): WaveDefinition | undefined {
  if (mission === "voyage" || mission === "survival") return undefined;
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
