export type CharacterId =
  | "luffy"
  | "zoro"
  | "nami"
  | "usopp"
  | "sanji"
  | "chopper"
  | "robin"
  | "franky"
  | "brook"
  | "jinbe";
export type Affinity =
  | "rubber"
  | "steel"
  | "body"
  | "weather"
  | "nature"
  | "tech"
  | "soul"
  | "tide"
  | "fire";
export type PassiveId =
  | "power"
  | "tempo"
  | "multishot"
  | "stride"
  | "magnet"
  | "vitality"
  | "armor"
  | "regen"
  | "crit"
  | "reach"
  | "duration"
  | "luck"
  | "greed"
  | "spirit";
export type WeaponId =
  | "pistol"
  | "gatling"
  | "bazooka"
  | "whip"
  | "balloon"
  | "onigiri"
  | "phoenix"
  | "collier"
  | "concasse"
  | "thunder"
  | "cyclone"
  | "firestar"
  | "popgreen"
  | "hoof"
  | "clutch"
  | "strongright"
  | "aubade"
  | "sharkbrick";
export type AnimationKind =
  | "stretch"
  | "barrage"
  | "double"
  | "sweep"
  | "inflate"
  | "slash"
  | "cutwave"
  | "kick"
  | "stomp"
  | "lightning"
  | "cyclone"
  | "pellet"
  | "vine"
  | "hoof"
  | "clutch"
  | "chain"
  | "iai"
  | "palm";
export type HitShape = "line" | "cone" | "circle" | "target" | "projectile";
export interface WeaponDefinition {
  id: WeaponId;
  owner: CharacterId;
  title: string;
  description: string;
  affinity: Affinity;
  animation: AnimationKind;
  shape: HitShape;
  damage: number;
  cooldown: number;
  range: number;
  width: number;
  windup: number;
  active: number;
  recovery: number;
  strikes: number;
  evolution: {
    title: string;
    passive: PassiveId;
    damage: number;
    range: number;
  };
}
export interface PassiveDefinition {
  id: PassiveId;
  title: string;
  description: string;
  symbol: string;
  max: number;
  affinity: Affinity;
}
export const characterNames: Record<CharacterId, string> = {
  luffy: "Luffy",
  zoro: "Zoro",
  nami: "Nami",
  usopp: "Usopp",
  sanji: "Sanji",
  chopper: "Chopper",
  robin: "Robin",
  franky: "Franky",
  brook: "Brook",
  jinbe: "Jinbe",
};
export const affinityNames: Record<Affinity, string> = {
  rubber: "Goma",
  steel: "Acero",
  body: "Cuerpo",
  weather: "Clima",
  nature: "Naturaleza",
  tech: "Ingenio",
  soul: "Alma",
  tide: "Marea",
  fire: "Fuego",
};
export const affinityColors: Record<Affinity, string> = {
  rubber: "#efad83",
  steel: "#b9d8db",
  body: "#f2cf89",
  weather: "#d8c4f5",
  nature: "#a9d47e",
  tech: "#8ad4d8",
  soul: "#c4b2ed",
  tide: "#8bcddc",
  fire: "#f3a36c",
};
export const passives: readonly PassiveDefinition[] = [
  {
    id: "power",
    title: "Voluntad de combate",
    description: "+25% de daño base.",
    symbol: "✦",
    max: 5,
    affinity: "body",
  },
  {
    id: "tempo",
    title: "Ritmo de aventura",
    description: "12% menos de recarga.",
    symbol: "»",
    max: 5,
    affinity: "rubber",
  },
  {
    id: "multishot",
    title: "Cadena de golpes",
    description: "+1 impacto en ráfagas; +8% de daño en ataques simples.",
    symbol: "⋔",
    max: 4,
    affinity: "rubber",
  },
  {
    id: "stride",
    title: "Pies ligeros",
    description: "+10% de velocidad base.",
    symbol: "➶",
    max: 5,
    affinity: "body",
  },
  {
    id: "magnet",
    title: "Brújula de botín",
    description: "+45 de radio de recogida.",
    symbol: "◎",
    max: 5,
    affinity: "tech",
  },
  {
    id: "vitality",
    title: "Ración de viaje",
    description: "+20 de vida máxima; recupera 35 de vida.",
    symbol: "♥",
    max: 5,
    affinity: "body",
  },
  {
    id: "armor",
    title: "Guardia firme",
    description: "Reduce el daño de contacto en 2, mínimo 1.",
    symbol: "⬡",
    max: 5,
    affinity: "steel",
  },
  {
    id: "regen",
    title: "Botiquín de cubierta",
    description: "Recupera 0,35 de vida por segundo.",
    symbol: "+",
    max: 5,
    affinity: "nature",
  },
  {
    id: "crit",
    title: "Instinto ofensivo",
    description: "+6% de probabilidad de crítico (daño ×1,7).",
    symbol: "✧",
    max: 5,
    affinity: "fire",
  },
  {
    id: "reach",
    title: "Técnica depurada",
    description: "+12% de alcance y área.",
    symbol: "↔",
    max: 5,
    affinity: "rubber",
  },
  {
    id: "duration",
    title: "Pulso sostenido",
    description: "+15% de fase activa y daño de técnicas persistentes.",
    symbol: "◷",
    max: 5,
    affinity: "weather",
  },
  {
    id: "luck",
    title: "Viento a favor",
    description: "Mejora la probabilidad de cofres de 3 y 5 premios.",
    symbol: "☘",
    max: 5,
    affinity: "weather",
  },
  {
    id: "greed",
    title: "Bolsa de navegante",
    description: "+20% de berries recogidos durante esta partida.",
    symbol: "฿",
    max: 5,
    affinity: "tide",
  },
  {
    id: "spirit",
    title: "Espíritu indomable",
    description: "8% menos de recarga de embestida y +5% de daño.",
    symbol: "⚑",
    max: 5,
    affinity: "soul",
  },
];
function weapon(
  id: WeaponId,
  owner: CharacterId,
  title: string,
  description: string,
  affinity: Affinity,
  animation: AnimationKind,
  shape: HitShape,
  damage: number,
  cooldown: number,
  range: number,
  width: number,
  strikes: number,
  passive: PassiveId,
  evolution: string,
): WeaponDefinition {
  return {
    id,
    owner,
    title,
    description,
    affinity,
    animation,
    shape,
    damage,
    cooldown,
    range,
    width,
    windup: animation === "barrage" ? 0.1 : 0.14,
    active: strikes > 1 ? 0.36 : 0.13,
    recovery: 0.16,
    strikes,
    evolution: { title: evolution, passive, damage: 1.65, range: 1.2 },
  };
}
export const weapons: readonly WeaponDefinition[] = [
  weapon(
    "pistol",
    "luffy",
    "Gomu Gomu no Pistol",
    "Un brazo se estira y conecta un puñetazo.",
    "rubber",
    "stretch",
    "line",
    28,
    0.68,
    350,
    18,
    1,
    "reach",
    "Gomu Gomu no Rifle",
  ),
  weapon(
    "gatling",
    "luffy",
    "Gomu Gomu no Gatling",
    "Ráfaga de puños conectados al cuerpo.",
    "rubber",
    "barrage",
    "line",
    13,
    1.25,
    285,
    26,
    4,
    "tempo",
    "Gomu Gomu no Storm",
  ),
  weapon(
    "bazooka",
    "luffy",
    "Gomu Gomu no Bazooka",
    "Dos brazos empujan y golpean en un cono.",
    "rubber",
    "double",
    "cone",
    48,
    2.1,
    260,
    70,
    1,
    "power",
    "Gomu Gomu no Cannon",
  ),
  weapon(
    "whip",
    "luffy",
    "Gomu Gomu no Muchi",
    "Barrido de pierna elástica alrededor de Luffy.",
    "rubber",
    "sweep",
    "circle",
    26,
    1.7,
    160,
    50,
    1,
    "stride",
    "Muchi · Barrido completo",
  ),
  weapon(
    "balloon",
    "luffy",
    "Gomu Gomu no Fusen",
    "Infla el cuerpo y aparta enemigos cercanos.",
    "rubber",
    "inflate",
    "circle",
    20,
    3.1,
    130,
    75,
    1,
    "vitality",
    "Fusen · Rebote reforzado",
  ),
  weapon(
    "onigiri",
    "zoro",
    "Oni Giri",
    "Espadas cruzadas, paso y corte frontal.",
    "steel",
    "slash",
    "cone",
    42,
    1.1,
    145,
    75,
    1,
    "power",
    "Oni Giri · Corte encadenado",
  ),
  weapon(
    "phoenix",
    "zoro",
    "36 Pound Ho",
    "La espada lanza una onda de corte al frente.",
    "steel",
    "cutwave",
    "line",
    32,
    1.4,
    420,
    34,
    1,
    "reach",
    "108 Pound Ho",
  ),
  weapon(
    "collier",
    "sanji",
    "Collier Shoot",
    "Giro de cadera y patada ascendente.",
    "body",
    "kick",
    "cone",
    38,
    0.95,
    140,
    75,
    1,
    "tempo",
    "Collier · Combo de patadas",
  ),
  weapon(
    "concasse",
    "sanji",
    "Concassé",
    "Elevación de pierna y golpe descendente.",
    "body",
    "stomp",
    "circle",
    52,
    2.3,
    130,
    80,
    1,
    "power",
    "Concassé · Impacto ampliado",
  ),
  weapon(
    "thunder",
    "nami",
    "Thunderbolt Tempo",
    "El Clima-Tact forma una nube y descarga un rayo.",
    "weather",
    "lightning",
    "target",
    48,
    1.7,
    440,
    55,
    1,
    "duration",
    "Thunderbolt Tempo · Tormenta",
  ),
  weapon(
    "cyclone",
    "nami",
    "Cyclone Tempo",
    "Un giro del Clima-Tact genera un remolino.",
    "weather",
    "cyclone",
    "target",
    14,
    2.4,
    320,
    85,
    4,
    "reach",
    "Cyclone Tempo · Vendaval",
  ),
  weapon(
    "firestar",
    "usopp",
    "Estrella de fuego",
    "Tensa el tirachinas y dispara munición incendiaria.",
    "fire",
    "pellet",
    "projectile",
    34,
    1.05,
    440,
    15,
    1,
    "crit",
    "Estrella de fuego · Estallido",
  ),
  weapon(
    "popgreen",
    "usopp",
    "Pop Green · Enredadera",
    "Una semilla hace brotar tallos que golpean.",
    "nature",
    "vine",
    "target",
    18,
    2,
    350,
    75,
    3,
    "duration",
    "Pop Green · Jardín de tallos",
  ),
  weapon(
    "hoof",
    "chopper",
    "Kokutei",
    "Un golpe de pezuña con preparación corporal.",
    "nature",
    "hoof",
    "cone",
    44,
    1.2,
    145,
    75,
    1,
    "vitality",
    "Kokutei · Doble impacto",
  ),
  weapon(
    "clutch",
    "robin",
    "Clutch",
    "Brotan brazos junto al objetivo y cierran la presa.",
    "body",
    "clutch",
    "target",
    40,
    1.6,
    320,
    45,
    1,
    "duration",
    "Clutch · Presa múltiple",
  ),
  weapon(
    "strongright",
    "franky",
    "Strong Right",
    "Puño mecánico unido al brazo mediante una cadena.",
    "tech",
    "chain",
    "line",
    42,
    1.25,
    400,
    25,
    1,
    "armor",
    "Strong Right · Retorno de cadena",
  ),
  weapon(
    "aubade",
    "brook",
    "Aubade Coup Droit",
    "Desenvaine y estocada recta con recuperación.",
    "soul",
    "iai",
    "line",
    40,
    1.15,
    260,
    30,
    1,
    "spirit",
    "Aubade · Doble estocada",
  ),
  weapon(
    "sharkbrick",
    "jinbe",
    "Samegawara Seiken",
    "Postura de karate gyojin y onda de impacto frontal.",
    "tide",
    "palm",
    "cone",
    46,
    1.5,
    210,
    80,
    1,
    "armor",
    "Samegawara · Onda profunda",
  ),
];
export const weaponById = (id: WeaponId): WeaponDefinition => {
  const definition = weapons.find((item) => item.id === id);
  if (!definition) throw new Error(`Técnica desconocida: ${id}`);
  return definition;
};
export const passiveById = (id: PassiveId): PassiveDefinition => {
  const definition = passives.find((item) => item.id === id);
  if (!definition) throw new Error(`Pasivo desconocido: ${id}`);
  return definition;
};
export const weaponKey = (id: WeaponId): `weapon:${WeaponId}` => `weapon:${id}`;
export type UpgradeId = PassiveId | `weapon:${WeaponId}`;
export interface UpgradeDefinition {
  id: UpgradeId;
  title: string;
  description: string;
  symbol: string;
  max: number;
}
export const upgrades: readonly UpgradeDefinition[] = [
  ...passives,
  ...weapons.map((item) => ({
    id: weaponKey(item.id),
    title: item.title,
    description: item.description,
    symbol: "⚔",
    max: 5,
  })),
];
export const contentLimits = {
  weapons: 4,
  passives: 6,
  weaponRank: 5,
  passiveEvolutionRank: 2,
  evolutionTime: 60,
} as const;
export const pickupDefinitions = {
  xp: { title: "Cristal", color: "#8be3cf" },
  heal: { title: "Carne", color: "#f79587" },
  coin: { title: "Berries", color: "#efd078" },
  vacuum: { title: "Imán de botín", color: "#c6b3f4" },
  bomb: { title: "Barril de pólvora", color: "#f6a15f" },
  haste: { title: "Impulso", color: "#a5e7ef" },
} as const;
export type PickupKind = keyof typeof pickupDefinitions;
