import {
  newProfile,
  parseProfile,
  profileKey,
  legacyProfileKey,
} from "../game/profile";
import type { Profile } from "../data/training";
let message = "";
function load(): Profile {
  try {
    const raw =
      localStorage.getItem(profileKey) ??
      localStorage.getItem(legacyProfileKey);
    if (!raw) return newProfile();
    try {
      const parsed = parseProfile(JSON.parse(raw) as unknown);
      try {
        localStorage.setItem(profileKey, JSON.stringify(parsed));
      } catch {
        message =
          "Migración aplicada en memoria; no se puede guardar en este navegador.";
      }
      return parsed;
    } catch {
      localStorage.setItem(profileKey + ".backup", raw);
      message =
        "El guardado anterior no es válido. Se ha conservado una copia local.";
      return newProfile();
    }
  } catch {
    message =
      "El navegador no permite guardar: tus cambios durarán esta sesión.";
    return newProfile();
  }
}
export const profile = load();
export const storageNotice = (): string => message;
export function saveProfile(): boolean {
  try {
    localStorage.setItem(profileKey, JSON.stringify(profile));
    return true;
  } catch {
    message =
      "No se pudo guardar. Tus cambios siguen disponibles en esta sesión.";
    return false;
  }
}
