import { newProfile, parseProfile, profileKey } from "../game/profile";
import type { Profile } from "../data/training";
let message = "";
function load(): Profile {
  try {
    const raw = localStorage.getItem(profileKey);
    if (!raw) return newProfile();
    try {
      return parseProfile(JSON.parse(raw) as unknown);
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
