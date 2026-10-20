export type RegionalElement =
  | "cloud"
  | "lightning"
  | "door"
  | "claw"
  | "shadow"
  | "axe"
  | "magma"
  | "thread"
  | "flame"
  | "club";
export interface RegionalMove {
  name: string;
  windup: number;
  active: number;
  recovery: number;
  range: number;
  damage: number;
  behavior: "fan" | "zones" | "rush" | "beam" | "ring" | "guard";
  element: RegionalElement;
  count: number;
  radius: number;
  spread: number;
}
function move(
  name: string,
  behavior: RegionalMove["behavior"],
  element: RegionalElement,
  range: number,
  windup = 1.2,
  count = 1,
  radius = 45,
  spread = 0.2,
): RegionalMove {
  return {
    name,
    behavior,
    element,
    range,
    windup,
    count,
    radius,
    spread,
    active: behavior === "rush" ? 0.55 : 0.45,
    recovery: 1.35,
    damage: behavior === "beam" ? 1.3 : 1,
  };
}
export const regionalMoves = {
  sphereFan: move("Esferas sorpresa", "fan", "cloud", 380, 1.1, 5, 12, 0.25),
  mantraDash: move("Mantra · deslizamiento", "rush", "cloud", 300, 1.2),
  cloudTraps: move("Prueba de las esferas", "zones", "cloud", 60, 1.5, 3, 60),
  elThor: move("El Thor", "zones", "lightning", 70, 1.5, 1, 70),
  sango: move(
    "Sango · descarga ramificada",
    "fan",
    "lightning",
    450,
    1.2,
    5,
    9,
    0.25,
  ),
  raigo: move(
    "Raigo · anillo del trueno",
    "ring",
    "lightning",
    220,
    1.8,
    1,
    110,
  ),
  airDoor: move("Air Door · corredor", "beam", "door", 370, 1.4, 1, 24),
  tekkai: move("Tekkai · contraataque", "guard", "door", 135, 1.5, 1, 135),
  doorDash: move("Doa Doa · irrupción", "rush", "door", 310, 1.2),
  shigan: move("Shigan · carga del leopardo", "rush", "claw", 330, 1.05),
  rankyaku: move("Rankyaku · tres cortes", "fan", "claw", 430, 1.1, 3, 12, 0.3),
  rokuogan: move("Rokuogan", "beam", "claw", 330, 1.5, 1, 30),
  deadHand: move("Dead Hand · cañones", "fan", "axe", 400, 1.2, 4, 9, 0.16),
  lionCharge: move("Embestida del león", "rush", "claw", 300, 1.1),
  graveBombs: move("Artillería del cementerio", "zones", "axe", 62, 1.6, 2, 62),
  brickBat: move(
    "Brick Bat · murciélagos",
    "fan",
    "shadow",
    400,
    1.2,
    7,
    12,
    0.2,
  ),
  shadowField: move(
    "Doppelman · pozos de sombra",
    "zones",
    "shadow",
    60,
    1.6,
    3,
    60,
  ),
  shadowsAsgard: move("Shadows Asgard", "ring", "shadow", 220, 1.8, 1, 95),
  ashigara: move("Ashigara Dokkoi", "beam", "axe", 250, 1.2, 1, 28),
  axeSlam: move("Hacha de la guardia", "zones", "axe", 105, 1.45, 1, 105),
  sumoGuard: move("Defensa del sumo", "guard", "axe", 125, 1.5, 1, 125),
  daiFunka: move("Dai Funka", "fan", "magma", 410, 1.3, 5, 16, 0.22),
  meigo: move("Meigo", "rush", "magma", 320, 1.35),
  ryuseiKazan: move("Ryusei Kazan", "zones", "magma", 65, 1.8, 4, 65),
  corridaGlaive: move("Corrida Glaive", "rush", "claw", 330, 1.1),
  hiraCape: move(
    "Hira Hira · capa de acero",
    "guard",
    "thread",
    130,
    1.4,
    1,
    130,
  ),
  viperaGlaive: move("Vipera Glaive", "beam", "claw", 400, 1.3, 1, 20),
  goshikito: move(
    "Goshikito · cinco hilos",
    "fan",
    "thread",
    470,
    1.25,
    5,
    7,
    0.18,
  ),
  overheat: move("Overheat", "beam", "thread", 580, 1.5, 1, 18),
  spiderWeb: move("Spider Web", "ring", "thread", 220, 1.7, 1, 90),
  karyudon: move("Karyudon", "fan", "flame", 440, 1.4, 5, 15, 0.24),
  wingHunt: move("Caza imperial", "rush", "flame", 360, 1.3),
  imperialFlame: move("Llama imperial", "ring", "flame", 210, 1.7, 1, 100),
  thunderBagua: move("Raimei Hakke", "rush", "club", 410, 1.45),
  boloBreath: move("Bolo Breath", "beam", "flame", 600, 1.8, 1, 32),
  dragonBlaze: move("Llamas del dragón", "zones", "flame", 72, 1.7, 3, 72),
} as const;
export type RegionalMoveId = keyof typeof regionalMoves;
export const regionalRepertoires = {
  satori: ["sphereFan", "mantraDash", "cloudTraps"],
  enel: ["elThor", "sango", "raigo"],
  blueno: ["airDoor", "tekkai", "doorDash"],
  lucci: ["shigan", "rankyaku", "rokuogan"],
  absalom: ["deadHand", "lionCharge", "graveBombs"],
  moria: ["brickBat", "shadowField", "shadowsAsgard"],
  sentomaru: ["ashigara", "axeSlam", "sumoGuard"],
  akainu: ["daiFunka", "meigo", "ryuseiKazan"],
  diamante: ["corridaGlaive", "hiraCape", "viperaGlaive"],
  doflamingo: ["goshikito", "overheat", "spiderWeb"],
  king: ["karyudon", "wingHunt", "imperialFlame"],
  kaido: ["thunderBagua", "boloBreath", "dragonBlaze"],
} as const satisfies Record<string, readonly RegionalMoveId[]>;
export const elementColors: Readonly<
  Record<RegionalElement, readonly [string, string]>
> = {
  cloud: ["#e9faff", "#a7d5e8"],
  lightning: ["#fff2a5", "#8ad9ff"],
  door: ["#b7e3dc", "#638e96"],
  claw: ["#e4f2f8", "#a3bacd"],
  shadow: ["#c5a5ef", "#513b72"],
  axe: ["#e9d8b3", "#a87b64"],
  magma: ["#ffd085", "#cf533a"],
  thread: ["#fff0fa", "#e597c7"],
  flame: ["#ffe8a3", "#e77742"],
  club: ["#e5b5ff", "#725086"],
};
