import type { CharacterId } from "./content";

export const combatArtists = [
  "zoro",
  "sanji",
  "nami",
  "usopp",
  "chopper",
  "robin",
  "brook",
  "jinbe",
] as const satisfies readonly CharacterId[];
export type CombatArtist = (typeof combatArtists)[number];
export const combatLayout = {
  width: 1152,
  height: 768,
  cellWidth: 192,
  cellHeight: 128,
  frames: 6,
  anchorX: 80,
  anchorY: 118,
} as const;
export const combatAtlasPath = (id: CombatArtist): string =>
  `assets/characters/${id}-combat-v5.png`;

/** Una sola anatomía visible; las otras técnicas conservan únicamente sus efectos. */
export const bodyActions: Readonly<Record<CharacterId, string>> = {
  luffy: "goma",
  zoro: "agarre y corte de katana",
  sanji: "patada de pierna negra",
  nami: "gesto de Clima-Tact",
  usopp: "tensar y soltar tirachinas",
  chopper: "puñetazo de pezuña",
  robin: "cruzar brazos Hana Hana",
  franky: "lanzamiento de antebrazo mecánico",
  brook: "desenvaine de bastón-espada",
  jinbe: "palma abierta de karate gyojin",
};
