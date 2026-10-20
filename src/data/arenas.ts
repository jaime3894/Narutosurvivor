import type { BossId } from "./rifts";
export interface ArenaDefinition {
  name: string;
  floor: number;
  props: readonly [number, number];
  accent: string;
  layout: "corners" | "staggered" | "aisle";
}
const arena = (
  name: string,
  floor: number,
  props: readonly [number, number],
  accent: string,
  layout: ArenaDefinition["layout"] = "corners",
): ArenaDefinition => ({ name, floor, props, accent, layout });
export const bossArenas: Readonly<Record<BossId, ArenaDefinition>> = {
  buggy: arena("Muelle del circo", 2, [5, 2], "#dba8c7", "staggered"),
  kuro: arena("Patio de la mansión", 0, [3, 0], "#a9c7af", "aisle"),
  arlong: arena("Patio de Arlong Park", 1, [3, 4], "#88d2e2"),
  mr1: arena("Ruinas de acero", 4, [10, 8], "#cfb589", "staggered"),
  crocodile: arena("Patio de Rainbase", 4, [8, 10], "#e3bf75", "aisle"),
  satori: arena("Prueba de las esferas", 8, [14, 13], "#c9edff"),
  enel: arena("Santuario del trueno", 9, [14, 13], "#ffe9a8", "aisle"),
  blueno: arena("Puertas de Justicia", 10, [19, 16], "#aad0dc", "staggered"),
  lucci: arena("Torre del Rokushiki", 11, [19, 17], "#d8dfe9"),
  absalom: arena("Patio de las tumbas", 12, [21, 23], "#c6a3dc", "staggered"),
  moria: arena("Jardín de las sombras", 13, [20, 21], "#c0a3e5", "aisle"),
  sentomaru: arena("Bastión de la guardia", 15, [25, 27], "#a9c9e5"),
  akainu: arena("Plaza de magma", 15, [24, 27], "#ffad76", "staggered"),
  diamante: arena("Arena de la Corrida", 16, [29, 28], "#f5c2a0"),
  doflamingo: arena("Patio de los hilos", 17, [31, 30], "#f3b5d8", "aisle"),
  king: arena("Bastión de las llamas", 19, [33, 35], "#ffbf83", "staggered"),
  kaido: arena("Azotea de las Bestias", 19, [35, 34], "#deb4ff"),
  imu: arena("Salón del Trono Vacío", 13, [14, 22], "#d8b6ff", "aisle"),
};
export const arenaBounds = { halfWidth: 410, halfHeight: 285 } as const;
