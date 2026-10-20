import { islandIds, islands } from "../data/islands";
import { missions, type MissionId } from "../data/missions";
import { bosses } from "../data/rifts";
import { iconMarkup } from "./icons";
export function openMissions(onStart: (id: MissionId) => void): void {
  const previous = document.activeElement,
    dialog = document.createElement("dialog");
  dialog.className = "mission-dialog settings-dialog";
  dialog.setAttribute("aria-label", "Islas y jefes");
  dialog.innerHTML = `<header><div><p class="eyebrow">RUMBO A LA GRAN LÍNEA</p><h1>Islas y jefes</h1></div><button id="close-missions">Volver</button></header><p>Práctica por capítulos: cinco minutos de travesía, minijefes y un duelo final. El reloj se detiene en las arenas. Vence al jefe final para completar la isla.</p><div class="mission-grid">${Object.values(
    missions,
  )
    .map(
      (m) =>
        `<article class="mission-card"><div class="mission-banner ${m.id}" style="--island-color:${islands[m.id].color}">${iconMarkup(m.id === "alabasta" ? "cyclone" : "wheel")}</div><h2>${m.name}</h2><p>${m.description}</p><ol>${m.encounters.map((e) => `<li>${Math.floor(e.at / 60)}:${String(e.at % 60).padStart(2, "0")} · ${e.role === "final" ? "JEFE FINAL" : "MINIJEFE"} · ${bosses[e.boss].name}</li>`).join("")}</ol><p class="mission-call">Buster Call · ${Math.floor(m.busterAt / 60)}:${String(m.busterAt % 60).padStart(2, "0")} · Esquiva el bombardeo naval.</p><button data-mission="${m.id}">Zarpar · ${m.name}</button></article>`,
    )
    .join(
      "",
    )}</div><p class="settings-help">El botón principal inicia supervivencia sin límite: zonas cada 4 minutos, grietas opcionales e Imu al minuto 60. Estas misiones tienen encuentros obligatorios y derrota si agotas el tiempo del duelo. Las ocho islas están disponibles para practicar sin bloqueo de cuenta.</p>`;
  dialog
    .querySelector("#close-missions")
    ?.addEventListener("click", () => dialog.close());
  dialog.querySelectorAll<HTMLButtonElement>("[data-mission]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.mission;
      if (!islandIds.includes(id as (typeof islandIds)[number])) return;
      dialog.close();
      onStart(id as (typeof islandIds)[number]);
    }),
  );
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    },
    { once: true },
  );
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>("#close-missions")?.focus();
}
