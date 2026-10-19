import {
  preferences,
  savePreferences,
  settingsNotice,
  renderPreferences,
} from "./settings-store";
import type { Quality } from "../core/preferences";
type FullDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
export const fullscreenActive = (): boolean =>
  Boolean(
    document.fullscreenElement ||
      (document as FullDocument).webkitFullscreenElement,
  );
export const fullscreenSupported = (): boolean =>
  Boolean(
    document.fullscreenEnabled ||
      (document as FullDocument).webkitFullscreenEnabled,
  );
export async function toggleFullscreen(): Promise<string> {
  try {
    const doc = document as FullDocument,
      element = document.documentElement as FullElement;
    if (fullscreenActive()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else await doc.webkitExitFullscreen?.();
    } else if (element.requestFullscreen) await element.requestFullscreen();
    else if (element.webkitRequestFullscreen)
      await element.webkitRequestFullscreen();
    else
      return "Este navegador no permite pantalla completa. Amplía la ventana desde sus controles.";
    return "";
  } catch {
    return "El navegador no ha permitido cambiar a pantalla completa. Prueba desde el botón de nuevo.";
  }
}
export function openSettings(onClose: () => void = () => {}): void {
  const previous = document.activeElement,
    dialog = document.createElement("dialog");
  dialog.className = "settings-dialog";
  dialog.setAttribute("aria-label", "Ajustes");
  dialog.innerHTML = `<header><div><p class="eyebrow">MAREA / ESTE DISPOSITIVO</p><h1>Ajustes</h1></div><button id="close-settings" class="small-button">Volver</button></header><section><h2>Pantalla y gráficos</h2>
 <div class="settings-row"><div><b>Pantalla completa</b><small>Amplía el juego a toda la pantalla.</small></div><button id="settings-fullscreen" class="small-button" ${fullscreenSupported() ? "" : "disabled"}>${fullscreenActive() ? "Salir de pantalla completa" : "Activar pantalla completa"}</button></div>
 <label class="settings-row"><span><b>Calidad gráfica</b><small>Auto adapta resolución y efectos. Las colisiones y los ataques no cambian.</small></span><select id="setting-quality">${[
   ["auto", "Automática"],
   ["high", "Alta"],
   ["medium", "Media"],
   ["low", "Baja"],
 ]
   .map(
     ([id, name]) =>
       `<option value="${id}" ${preferences.quality === id ? "selected" : ""}>${name}</option>`,
   )
   .join("")}</select></label>
 <label class="settings-row"><span><b>Distancia de cámara</b><small>80% muestra más terreno; 120% acerca los personajes.</small></span><select id="setting-zoom">${[0.8, 1, 1.2].map((v) => `<option value="${v}" ${preferences.zoom === v ? "selected" : ""}>${Math.round(v * 100)}%</option>`).join("")}</select></label>
 ${[
   [
     "damageNumbers",
     "Números de daño",
     "Muestra el daño de los golpes sobre los enemigos.",
   ],
   [
     "calm",
     "Movimiento reducido",
     "Reduce sacudidas, destellos y movimientos decorativos.",
   ],
   ["fps", "Mostrar FPS", "Muestra el rendimiento durante el combate."],
 ]
   .map(
     ([id, title, detail]) =>
       `<label class="settings-row"><span><b>${title}</b><small>${detail}</small></span><input type="checkbox" data-setting="${id}" ${preferences[id as "calm" | "damageNumbers" | "fps"] ? "checked" : ""}></label>`,
   )
   .join("")}
 </section><section><h2>Controles</h2><label class="settings-row"><span><b>Tamaño de botones táctiles</b><small>Ajusta el botón de embestida en el campo.</small></span><select id="setting-touch">${[0.8, 1, 1.25].map((v) => `<option value="${v}" ${preferences.touchScale === v ? "selected" : ""}>${Math.round(v * 100)}%</option>`).join("")}</select></label><p class="settings-help">WASD o flechas: moverse · Espacio: embestir · 1–4: técnica · F: forma · P/Escape: pausa. En móvil, arrastra sobre el terreno para moverte y toca una técnica para seleccionarla.</p></section><p id="settings-status" role="status">${fullscreenSupported() ? settingsNotice() : "Este navegador no permite pantalla completa mediante un botón web."}</p><p class="settings-help">Los ajustes se guardan en este navegador. Calidad efectiva: <span id="effective-quality">${["Baja", "Media", "Alta"][renderPreferences().level]}</span>.</p>`;
  const update = (): void => {
    const label = dialog.querySelector("#effective-quality");
    if (label)
      label.textContent =
        ["Baja", "Media", "Alta"][renderPreferences().level] ?? "Alta";
    const status = dialog.querySelector("#settings-status");
    if (status) status.textContent = settingsNotice();
  };
  dialog
    .querySelector("#close-settings")
    ?.addEventListener("click", () => dialog.close());
  dialog
    .querySelector("#settings-fullscreen")
    ?.addEventListener("click", () => {
      void toggleFullscreen().then((message) => {
        dialog.querySelector("#settings-status")!.textContent = message;
        dialog.querySelector("#settings-fullscreen")!.textContent =
          fullscreenActive()
            ? "Salir de pantalla completa"
            : "Activar pantalla completa";
      });
    });
  dialog.querySelector("#setting-quality")?.addEventListener("change", (e) => {
    preferences.quality = (e.target as HTMLSelectElement).value as Quality;
    savePreferences();
    update();
  });
  dialog.querySelector("#setting-zoom")?.addEventListener("change", (e) => {
    const value = Number((e.target as HTMLSelectElement).value);
    if (value === 0.8 || value === 1 || value === 1.2) preferences.zoom = value;
    savePreferences();
    update();
  });
  dialog.querySelector("#setting-touch")?.addEventListener("change", (e) => {
    const value = Number((e.target as HTMLSelectElement).value);
    if (value === 0.8 || value === 1 || value === 1.25)
      preferences.touchScale = value;
    savePreferences();
    update();
  });
  dialog.querySelectorAll<HTMLInputElement>("[data-setting]").forEach((input) =>
    input.addEventListener("change", () => {
      const key = input.dataset.setting;
      if (key === "damageNumbers" || key === "calm" || key === "fps")
        preferences[key] = input.checked;
      savePreferences();
      update();
    }),
  );
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      onClose();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    },
    { once: true },
  );
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>("#close-settings")?.focus();
}
