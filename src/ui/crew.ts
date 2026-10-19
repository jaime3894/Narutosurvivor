import { createLuffyPreview, type LuffyPreviewAction } from "./luffy-preview";
import {
  characters,
  characterById,
  activeSynergies,
  validateCrew,
  type CrewSelection,
  type FormTier,
} from "../data/crew";
import { characterNames } from "../data/content";
import { getSpriteAtlas, drawSprite } from "../render/sprites";
export function openCrew(
  initial: CrewSelection,
  onConfirm: (selection: CrewSelection) => void,
): void {
  let selection: CrewSelection = {
    captain: initial.captain,
    nakama: [...initial.nakama],
  };
  let preview: FormTier = 0;
  let previewAction: LuffyPreviewAction = "idle";
  let previewStarted = performance.now();
  const luffyPreview = createLuffyPreview();
  let frame = 0;
  let stopped = false;
  const previous = document.activeElement;
  const dialog = document.createElement("dialog");
  dialog.className = "crew-dialog";
  dialog.setAttribute("aria-label", "Elegir tripulación");
  function render(): void {
    const chosen = characterById(selection.captain);
    const form = chosen.forms[preview];
    dialog.innerHTML = `<div class="crew-heading"><div><p class="eyebrow">LOS SOMBRERO DE PAJA / FASE 3</p><h2>Elige a tus nakama.</h2></div><button id="close-crew" class="small-button">Cerrar ✕</button></div><p class="crew-intro">Un capitán y hasta dos compañeros de apoyo. Cada uno pelea con su propia técnica.</p><div class="crew-layout"><div class="crew-grid">${characters.map((item) => `<article class="crew-card ${item.id === selection.captain ? "selected" : ""}"><button class="captain-choice" data-captain="${item.id}" aria-label="Elegir a ${characterNames[item.id]} como capitán" aria-pressed="${item.id === selection.captain}"><canvas class="crew-portrait" data-portrait="${item.id}" width="112" height="112"></canvas><strong>${characterNames[item.id]}</strong><span>${item.role}</span></button><label class="nakama-choice"><input type="checkbox" data-nakama="${item.id}" aria-label="Reclutar a ${characterNames[item.id]} como nakama" ${selection.nakama.includes(item.id) ? "checked" : ""} ${item.id === selection.captain || (!selection.nakama.includes(item.id) && selection.nakama.length >= 2) ? "disabled" : ""}>${item.id === selection.captain ? "CAPITÁN" : "NAKAMA"}</label></article>`).join("")}</div><aside class="crew-details"><canvas id="crew-preview" width="220" height="210" aria-label="Vista de ${characterNames[chosen.id]} ${form.name}"></canvas>${chosen.id === "luffy" && preview === 0 ? `<div class="form-tabs" role="group" aria-label="Animaciones de Luffy">${(["idle", "walk", "punch"] as const).map((action) => `<button data-preview-action="${action}" aria-pressed="${action === previewAction}" class="${action === previewAction ? "active" : ""}">${action === "idle" ? "De pie" : action === "walk" ? "Correr" : "Golpe de goma"}</button>`).join("")}</div>` : ""}<p class="eyebrow">${chosen.role}</p><h3>${characterNames[chosen.id]}</h3><p class="innate"><b>Innato</b> · ${chosen.innate}</p><div class="form-tabs" role="group" aria-label="Vista de formas">${chosen.forms.map((item, index) => `<button data-form-preview="${index}" class="${preview === index ? "active" : ""}" aria-pressed="${preview === index}">${index + 1}. ${item.name}</button>`).join("")}</div><p class="form-description"><b>${form.name}</b> · ${form.description}<br>${preview === 0 ? "Estilo inicial · recupera energía" : "Disponible en nivel " + form.level + " · consume " + form.drain + " energía/s"}</p><p class="support-description">Como nakama: ${chosen.support}</p></aside></div><div class="crew-bottom"><div><b>Tripulación</b> · ${[selection.captain, ...selection.nakama].map((id) => characterNames[id]).join(" + ")}<p id="crew-synergies">${
      activeSynergies(selection.captain, selection.nakama)
        .map((item) => `${item.name}: ${item.description}`)
        .join("<br>") || "Combina nakama para descubrir sinergias."
    }</p></div><button id="confirm-crew">Confirmar tripulación ↗</button></div><p class="art-credit">Fan art procedural de reserva: <a href="https://github.com/gshklovs/opshell" target="_blank" rel="noopener noreferrer">gshklovs / opshell</a> · arte original de fan, MIT. Sprites de cuerpo completo creados para este juego con asistencia de IA y adaptados al atlas animado. <a href="./licenses/opshell-MIT.txt" target="_blank" rel="noopener noreferrer">Licencia</a></p>`;
    for (const canvas of dialog.querySelectorAll<HTMLCanvasElement>(
      "[data-portrait]",
    )) {
      const id = characters.find(
        (item) => item.id === canvas.dataset.portrait,
      )?.id;
      const ctx = canvas.getContext("2d");
      if (id && ctx)
        drawSprite(
          ctx,
          getSpriteAtlas(id, 0),
          { x: 56, y: 107 },
          "down",
          "idle",
          0,
          1.4,
        );
    }
    dialog
      .querySelectorAll<HTMLButtonElement>("[data-preview-action]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          const action = button.dataset.previewAction;
          if (action === "idle" || action === "walk" || action === "punch") {
            previewAction = action;
            previewStarted = performance.now();
            render();
            dialog
              .querySelector<HTMLButtonElement>(
                `[data-preview-action="${action}"]`,
              )
              ?.focus({ preventScroll: true });
          }
        }),
      );
    dialog
      .querySelectorAll<HTMLButtonElement>("[data-captain]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          const id = characters.find(
            (item) => item.id === button.dataset.captain,
          )?.id;
          if (!id) return;
          selection = {
            captain: id,
            nakama: selection.nakama.filter((item) => item !== id),
          };
          preview = 0;
          previewAction = "idle";
          render();
          dialog
            .querySelector<HTMLButtonElement>(`[data-captain="${id}"]`)
            ?.focus({ preventScroll: true });
        }),
      );
    dialog
      .querySelectorAll<HTMLInputElement>("[data-nakama]")
      .forEach((input) =>
        input.addEventListener("change", () => {
          const id = characters.find(
            (item) => item.id === input.dataset.nakama,
          )?.id;
          if (!id) return;
          selection.nakama = input.checked
            ? [...selection.nakama, id]
            : selection.nakama.filter((item) => item !== id);
          render();
          dialog
            .querySelector<HTMLInputElement>(`[data-nakama="${id}"]`)
            ?.focus({ preventScroll: true });
        }),
      );
    dialog
      .querySelectorAll<HTMLButtonElement>("[data-form-preview]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          const value = Number(button.dataset.formPreview);
          if (value === 0 || value === 1 || value === 2) {
            preview = value;
            previewAction = "idle";
            previewStarted = performance.now();
            render();
            dialog
              .querySelector<HTMLButtonElement>(
                `[data-form-preview="${value}"]`,
              )
              ?.focus({ preventScroll: true });
          }
        }),
      );
    dialog
      .querySelector("#close-crew")
      ?.addEventListener("click", () => dialog.close());
    dialog.querySelector("#confirm-crew")?.addEventListener("click", () => {
      validateCrew(selection);
      onConfirm({ captain: selection.captain, nakama: [...selection.nakama] });
      dialog.close();
    });
  }
  function animate(now: number): void {
    if (stopped) return;
    const canvas = dialog.querySelector<HTMLCanvasElement>("#crew-preview");
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, 220, 210);
      ctx.fillStyle = "#193c43";
      ctx.fillRect(0, 0, 220, 210);
      ctx.fillStyle = "#345249";
      ctx.beginPath();
      ctx.ellipse(110, 176, 38, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (selection.captain === "luffy" && preview === 0) {
        luffyPreview(
          ctx,
          reduced ? "idle" : previewAction,
          reduced ? 0 : (now - previewStarted) / 1000,
        );
      } else
        drawSprite(
          ctx,
          getSpriteAtlas(selection.captain, preview),
          { x: 110, y: 172 },
          "down",
          reduced ? "idle" : "walk",
          reduced ? 0 : now / 1000,
          2,
        );
    }
    frame = requestAnimationFrame(animate);
  }
  document.body.append(dialog);
  render();
  dialog.showModal();
  frame = requestAnimationFrame(animate);
  dialog.addEventListener(
    "close",
    () => {
      stopped = true;
      cancelAnimationFrame(frame);
      dialog.remove();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    },
    { once: true },
  );
}
