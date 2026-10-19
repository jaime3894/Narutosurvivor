import type { CharacterId, WeaponId } from "./content";
export interface FormMilestones {
  first: WeaponId;
  second?: WeaponId;
}
/** Cada técnica se domina a 5/5. Sin segunda técnica propia, el último estilo pide su evolución. */
export const formMilestones: Readonly<Record<CharacterId, FormMilestones>> = {
  luffy: { first: "pistol", second: "gatling" },
  zoro: { first: "onigiri", second: "phoenix" },
  sanji: { first: "collier", second: "concasse" },
  nami: { first: "thunder", second: "cyclone" },
  usopp: { first: "firestar", second: "popgreen" },
  chopper: { first: "hoof" },
  robin: { first: "clutch" },
  franky: { first: "strongright" },
  brook: { first: "aubade" },
  jinbe: { first: "sharkbrick" },
};
