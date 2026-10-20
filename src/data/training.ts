import type { CharacterId, WeaponId } from "./content";
export const training = {
  health: {
    name: "Vitalidad",
    detail: "+8 vida máxima",
    max: 10,
    base: 60,
    growth: 1.35,
    icon: "vitality",
  },
  damage: {
    name: "Fuerza",
    detail: "+4% de daño",
    max: 10,
    base: 80,
    growth: 1.38,
    icon: "power",
  },
  speed: {
    name: "Paso ligero",
    detail: "+3% de velocidad",
    max: 8,
    base: 70,
    growth: 1.4,
    icon: "stride",
  },
  cooldown: {
    name: "Reflejos",
    detail: "−3% de recarga",
    max: 8,
    base: 90,
    growth: 1.42,
    icon: "tempo",
  },
  armor: {
    name: "Haki defensivo",
    detail: "+1 de armadura",
    max: 8,
    base: 100,
    growth: 1.4,
    icon: "armor",
  },
  regen: {
    name: "Recuperación",
    detail: "+0,15 vida/s",
    max: 5,
    base: 120,
    growth: 1.5,
    icon: "regen",
  },
  magnet: {
    name: "Brújula",
    detail: "+10% radio de recogida",
    max: 6,
    base: 50,
    growth: 1.4,
    icon: "magnet",
  },
  experience: {
    name: "Sabiduría",
    detail: "+5% de experiencia",
    max: 8,
    base: 100,
    growth: 1.42,
    icon: "experience",
  },
  currency: {
    name: "Cazatesoros",
    detail: "+8% de berries",
    max: 8,
    base: 100,
    growth: 1.45,
    icon: "greed",
  },
  repertoire: {
    name: "Repertorio",
    detail: "Empieza con dos técnicas propias",
    max: 1,
    base: 350,
    growth: 1,
    icon: "multishot",
  },
  critical: {
    name: "Golpe crítico",
    detail: "+2% de probabilidad crítica",
    max: 10,
    base: 90,
    growth: 1.4,
    icon: "crit",
  },
  rerolls: {
    name: "Cambio de cartas",
    detail: "+1 cambio por partida",
    max: 3,
    base: 150,
    growth: 1.6,
    icon: "upgrade",
  },
  veto: {
    name: "Veto de técnica",
    detail: "Omite una técnica en las cartas",
    max: 2,
    base: 180,
    growth: 1.6,
    icon: "spirit",
  },
  starter: {
    name: "Técnica inicial",
    detail: "Elige tu ataque de salida",
    max: 1,
    base: 200,
    growth: 1,
    icon: "reach",
  },
} as const;
export type TrainingId = keyof typeof training;
export const trainingIds = Object.keys(training) as TrainingId[];
export type TrainingLevels = Record<TrainingId, number>;
export const emptyTraining = (): TrainingLevels =>
  Object.fromEntries(trainingIds.map((id) => [id, 0])) as TrainingLevels;
export const trainingCost = (id: TrainingId, level: number): number =>
  Math.round((training[id].base * training[id].growth ** level) / 10) * 10;
export interface Preparation {
  levels: TrainingLevels;
  starter?: WeaponId;
  banned: WeaponId[];
}
export const emptyPreparation = (): Preparation => ({
  levels: emptyTraining(),
  banned: [],
});
export interface SailorRecord {
  levels: TrainingLevels;
  starter?: WeaponId;
  banned: WeaponId[];
  runs: number;
  wins: number;
  bestTime: number;
  kills: number;
}
export interface Profile {
  version: 2;
  berries: number;
  selected: CharacterId;
  sailors: Record<CharacterId, SailorRecord>;
  receipts: string[];
}
