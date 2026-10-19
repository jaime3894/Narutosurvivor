import type { CharacterId, WeaponId } from "./content";
export type FormTier = 0 | 1 | 2;
export interface Modifiers {
  damage: number;
  speed: number;
  cooldown: number;
  range: number;
  armor: number;
  critical: number;
  regen: number;
  strikes: number;
  food: number;
  currency: number;
  dash: number;
}
export const neutral: Readonly<Modifiers> = {
  damage: 1,
  speed: 1,
  cooldown: 1,
  range: 1,
  armor: 0,
  critical: 0,
  regen: 0,
  strikes: 0,
  food: 1,
  currency: 1,
  dash: 1,
};
export interface FormDefinition {
  name: string;
  description: string;
  modifiers: Readonly<Modifiers>;
}
export interface CharacterDefinition {
  id: CharacterId;
  role: string;
  color: string;
  starter: WeaponId;
  innate: string;
  support: string;
  forms: readonly [FormDefinition, FormDefinition, FormDefinition];
}
function form(
  name: string,
  description: string,
  _tier: FormTier,
  modifiers: Partial<Modifiers> = {},
): FormDefinition {
  return {
    name,
    description,
    modifiers: { ...neutral, ...modifiers },
  };
}
export const characters: readonly CharacterDefinition[] = [
  {
    id: "luffy",
    role: "Capitán · Goma",
    color: "#e68d60",
    starter: "pistol",
    innate: "Cuerpo de goma: +10% de alcance en sus técnicas.",
    support: "Puñetazo de goma desde su propia posición.",
    forms: [
      form("Sombrero de Paja", "Goma, movilidad y puños elásticos.", 0),
      form("Gear Second", "Vapor, piel enrojecida y golpes acelerados.", 1, {
        damage: 1.2,
        speed: 1.2,
        cooldown: 0.8,
      }),
      form(
        "Gear Fourth · Boundman",
        "Torso inflado, brazos de haki y rebotes.",
        2,
        { damage: 1.65, range: 1.25, armor: 2, speed: 0.95, strikes: 2 },
      ),
    ],
  },
  {
    id: "zoro",
    role: "Espadachín · Acero",
    color: "#a6c578",
    starter: "onigiri",
    innate:
      "Primer corte: +15% de daño contra enemigos por encima del 70% de vida.",
    support: "Oni Giri desde su posición, sin prestar espadas al capitán.",
    forms: [
      form(
        "Santoryu",
        "Oni Giri: dos katanas en las manos y una en la boca.",
        0,
      ),
      form(
        "Santoryu · Bandana",
        "Bandana y agarre de tres espadas en combate.",
        1,
        {
          damage: 1.25,
          critical: 0.06,
          range: 1.1,
        },
      ),
      form("Asura", "Tres rostros y siluetas de nueve espadas.", 2, {
        damage: 1.65,
        range: 1.2,
        strikes: 2,
        armor: 1,
      }),
    ],
  },
  {
    id: "nami",
    role: "Navegante · Clima",
    color: "#efb76b",
    starter: "thunder",
    innate: "Tesoro encontrado: +25% de berries recogidos.",
    support: "Descargas con su Clima-Tact.",
    forms: [
      form("Clima-Tact", "Bastón meteorológico y nubes de tormenta.", 0),
      form("Sorcery Clima-Tact", "Nubes densas y mayor alcance.", 1, {
        range: 1.25,
        cooldown: 0.9,
        damage: 1.1,
      }),
      form("Zeus", "Nube con identidad propia y descargas dobles.", 2, {
        damage: 1.5,
        strikes: 1,
        range: 1.15,
      }),
    ],
  },
  {
    id: "usopp",
    role: "Tirador · Ingenio",
    color: "#d8bb81",
    starter: "firestar",
    innate: "Tirador certero: +18% de crítico a más de 180 unidades.",
    support: "Munición de tirachinas, no técnicas de otros personajes.",
    forms: [
      form("Tirachinas", "Pañuelo, gafas y munición reconocible.", 0),
      form("Kabuto", "Tirachinas grande y preparación de disparo.", 1, {
        range: 1.3,
        critical: 0.08,
      }),
      form("Sogeking", "Máscara, capa y precisión a distancia.", 2, {
        damage: 1.55,
        range: 1.35,
        critical: 0.1,
      }),
    ],
  },
  {
    id: "sanji",
    role: "Cocinero · Patadas",
    color: "#f0cf84",
    starter: "collier",
    innate: "Cocina de campaña: cura 8 de vida cada 20 bajas.",
    support:
      "Patadas propias; además prepara un tentempié de 4 de vida cada 12 s.",
    forms: [
      form("Pierna Negra", "Traje, giro de cadera y patadas.", 0),
      form("Diable Jambe", "Una pierna encendida con fuego naranja.", 1, {
        damage: 1.25,
        speed: 1.1,
      }),
      form("Ifrit Jambe", "Llamas azules y patadas más rápidas.", 2, {
        damage: 1.6,
        cooldown: 0.85,
        speed: 1.15,
      }),
    ],
  },
  {
    id: "chopper",
    role: "Médico · Zoan",
    color: "#e4a8b2",
    starter: "hoof",
    innate: "Médico de a bordo: regenera 0,3 de vida por segundo.",
    support: "Kokutei de apoyo; cura 6 de vida cada 12 s.",
    forms: [
      form("Brain Point", "Pequeño reno con sombrero y astas.", 0),
      form("Heavy Point", "Torso humanoide y pezuñas robustas.", 1, {
        damage: 1.25,
        armor: 2,
        range: 1.1,
      }),
      form("Monster Point", "Gran silueta de reno y golpes amplios.", 2, {
        damage: 1.7,
        range: 1.4,
        armor: 3,
        speed: 0.85,
      }),
    ],
  },
  {
    id: "robin",
    role: "Arqueóloga · Hana",
    color: "#c1a1d9",
    starter: "clutch",
    innate: "Lectura del combate: +3 de experiencia cada 15 bajas.",
    support: "Brazos que florecen junto al objetivo.",
    forms: [
      form("Hana Hana", "Manos que brotan y cierran la presa.", 0),
      form("Gigantesco Mano", "Brazos mayores y zona de presa ampliada.", 1, {
        damage: 1.2,
        range: 1.25,
      }),
      form("Demonio Fleur", "Silueta oscura, cuernos y alas.", 2, {
        damage: 1.65,
        range: 1.3,
        strikes: 1,
      }),
    ],
  },
  {
    id: "franky",
    role: "Carpintero · Cíborg",
    color: "#9ed3d5",
    starter: "strongright",
    innate: "Cuerpo de acero: reduce el daño de contacto en 2.",
    support: "Strong Right unido a su propio brazo por una cadena.",
    forms: [
      form("Franky", "Camisa abierta, tupé y antebrazos metálicos.", 0),
      form("Battle Franky", "Hombros y brazos reforzados.", 1, {
        damage: 1.2,
        armor: 3,
      }),
      form("General Franky", "Armadura mecánica y puños pesados.", 2, {
        damage: 1.6,
        armor: 5,
        range: 1.15,
        speed: 0.85,
      }),
    ],
  },
  {
    id: "brook",
    role: "Músico · Alma",
    color: "#c2b9e5",
    starter: "aubade",
    innate:
      "Yohoho: revive una vez por partida con 40% de vida y 2 s de protección.",
    support: "Estocadas desde su posición.",
    forms: [
      form("Espadachín músico", "Afro, sombrero de copa y esgrima.", 0),
      form("Soul Solid", "Frío en la espada; los golpes ralentizan.", 1, {
        damage: 1.15,
        speed: 1.15,
      }),
      form("Soul King", "Corona, manto y alma visible; mantiene el frío.", 2, {
        damage: 1.5,
        critical: 0.1,
        range: 1.2,
      }),
    ],
  },
  {
    id: "jinbe",
    role: "Timonel · Karate gyojin",
    color: "#91cbd9",
    starter: "sharkbrick",
    innate: "Paso de timonel: 20% menos de recarga de embestida.",
    support: "Karate gyojin y ondas desde su propio cuerpo.",
    forms: [
      form("Karate gyojin", "Kimono, postura firme y golpes de palma.", 0),
      form("Guardia de timonel", "Guardia baja y mangas amplias.", 1, {
        armor: 3,
        damage: 1.15,
      }),
      form("Maestro del karate", "Onda amplia y control de la distancia.", 2, {
        damage: 1.55,
        range: 1.3,
        armor: 2,
      }),
    ],
  },
];
export interface Synergy {
  id: string;
  pair: readonly [CharacterId, CharacterId];
  name: string;
  description: string;
  modifiers: Partial<Modifiers>;
  magnet?: number;
}
export const synergies: readonly Synergy[] = [
  {
    id: "captain-swordsman",
    pair: ["luffy", "zoro"],
    name: "Promesa de dos soñadores",
    description: "+10% de daño.",
    modifiers: { damage: 1.1 },
  },
  {
    id: "wings",
    pair: ["zoro", "sanji"],
    name: "Las alas del capitán",
    description: "8% menos de recarga y +4% crítico.",
    modifiers: { cooldown: 0.92, critical: 0.04 },
  },
  {
    id: "ingenuity",
    pair: ["nami", "usopp"],
    name: "Ingenio de cubierta",
    description: "+12% alcance y +25 recogida.",
    modifiers: { range: 1.12 },
    magnet: 25,
  },
  {
    id: "care",
    pair: ["chopper", "robin"],
    name: "Cuidar de los nuestros",
    description: "+0,4 de vida por segundo.",
    modifiers: { regen: 0.4 },
  },
  {
    id: "workshop",
    pair: ["franky", "usopp"],
    name: "Taller improvisado",
    description: "+8% daño y +5% alcance.",
    modifiers: { damage: 1.08, range: 1.05 },
  },
  {
    id: "calm",
    pair: ["brook", "jinbe"],
    name: "Calma bajo presión",
    description: "+2 armadura y +0,2 vida/s.",
    modifiers: { armor: 2, regen: 0.2 },
  },
  {
    id: "appetite",
    pair: ["luffy", "sanji"],
    name: "Apetito sin límites",
    description: "+25% curación de comida y +5% daño.",
    modifiers: { food: 1.25, damage: 1.05 },
  },
  {
    id: "course",
    pair: ["nami", "jinbe"],
    name: "Rumbo seguro",
    description: "+8% velocidad y 10% menos de recarga de embestida.",
    modifiers: { speed: 1.08, dash: 0.9 },
  },
  {
    id: "shadows",
    pair: ["robin", "brook"],
    name: "Sombras y almas",
    description: "+6% crítico.",
    modifiers: { critical: 0.06 },
  },
  {
    id: "science",
    pair: ["chopper", "franky"],
    name: "Ciencia a bordo",
    description: "+0,4 vida/s y +1 armadura.",
    modifiers: { regen: 0.4, armor: 1 },
  },
];
export const characterById = (id: CharacterId): CharacterDefinition => {
  const character = characters.find((item) => item.id === id);
  if (!character) throw new Error(`Personaje desconocido: ${id}`);
  return character;
};
export interface CrewSelection {
  captain: CharacterId;
  nakama: CharacterId[];
}
export function validateCrew(selection: CrewSelection): void {
  if (
    !characters.some((item) => item.id === selection.captain) ||
    selection.nakama.length > 2 ||
    new Set(selection.nakama).size !== selection.nakama.length ||
    selection.nakama.includes(selection.captain) ||
    selection.nakama.some((id) => !characters.some((item) => item.id === id))
  )
    throw new Error(
      "Tripulación inválida: un capitán y hasta dos nakama diferentes.",
    );
}
export const activeSynergies = (
  captain: CharacterId,
  nakama: readonly CharacterId[],
): readonly Synergy[] => {
  const crew = [captain, ...nakama];
  return synergies.filter((item) => item.pair.every((id) => crew.includes(id)));
};
export function combinedSynergies(
  captain: CharacterId,
  nakama: readonly CharacterId[],
): Modifiers {
  const result: Modifiers = { ...neutral };
  const multiplicative = [
    "damage",
    "speed",
    "cooldown",
    "range",
    "food",
    "currency",
    "dash",
  ] as const;
  const additive = ["armor", "critical", "regen", "strikes"] as const;
  for (const synergy of activeSynergies(captain, nakama)) {
    for (const key of multiplicative)
      result[key] *= synergy.modifiers[key] ?? 1;
    for (const key of additive) result[key] += synergy.modifiers[key] ?? 0;
  }
  return result;
}
