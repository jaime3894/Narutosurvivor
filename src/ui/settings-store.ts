import {
  AutoQuality,
  parsePreferences,
  type Preferences,
  type RenderPreferences,
} from "../core/preferences";
export const settingsKey = "marea.settings.v1";
let notice = "";
function load(): Preferences {
  try {
    return parsePreferences(
      JSON.parse(localStorage.getItem(settingsKey) ?? "null") as unknown,
    );
  } catch {
    return parsePreferences(null);
  }
}
export const preferences = load();
export const qualityMonitor = new AutoQuality(
  matchMedia("(pointer: coarse)").matches,
);
export function savePreferences(): void {
  try {
    localStorage.setItem(settingsKey, JSON.stringify(preferences));
    notice = "";
  } catch {
    notice =
      "No se pueden guardar los ajustes: se aplican durante esta sesión.";
  }
}
export const settingsNotice = (): string => notice;
export const renderPreferences = (): RenderPreferences => ({
  level:
    preferences.quality === "auto"
      ? qualityMonitor.level
      : preferences.quality === "high"
        ? 2
        : preferences.quality === "medium"
          ? 1
          : 0,
  zoom: preferences.zoom,
  damageNumbers: preferences.damageNumbers,
  calm: preferences.calm,
});
