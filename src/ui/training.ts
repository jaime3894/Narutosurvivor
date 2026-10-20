import {
  characterNames,
  weapons,
  type CharacterId,
  type WeaponId,
} from "../data/content";
import { characters, characterById } from "../data/crew";
import { training, trainingIds, trainingCost } from "../data/training";
import { purchaseTraining, setStarter, setVeto } from "../game/profile";
import { profile, saveProfile, storageNotice } from "./profile-store";
import { iconMarkup } from "./icons";
import { drawSprite, getSpriteAtlas } from "../render/sprites";
export function openTraining(initial: CharacterId, onClose: () => void): void {
  let selected = initial;
  const dialog = document.createElement("dialog");
  dialog.className = "training-dialog";
  dialog.setAttribute("aria-label", "Mejoras del tripulante");
  const previous = document.activeElement;
  function render(): void {
    const sailor = profile.sailors[selected],
      own = weapons.filter((w) => w.owner === selected),
      starter = sailor.starter ?? characterById(selected).starter;
    dialog.innerHTML = `<header class="training-heading"><div><p class="eyebrow">THOUSAND SUNNY / ENTRENAMIENTO</p><h1>Mejoras del tripulante</h1></div><button id="training-back" class="small-button">Volver</button></header>
 <div class="training-summary"><canvas width="112" height="120" aria-label="${characterNames[selected]}"></canvas><div><p>Las berries son globales. Cada tripulante conserva sus propias mejoras.</p><label>Tripulante <select id="training-character">${characters.map((c) => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${characterNames[c.id]} · ${profile.sailors[c.id].runs} travesías</option>`).join("")}</select></label></div><strong class="wallet">${iconMarkup("greed")}<span>${profile.berries}</span><small>BERRIES</small></strong></div>
 <p class="training-feedback" role="status">${storageNotice() || "120 berries de bienvenida para la cuenta · las compras se conservan entre partidas."}</p>
 <div class="training-grid">${trainingIds
   .map((id) => {
     const item = training[id],
       level = sailor.levels[id],
       maxed = level >= item.max,
       unavailable =
         ["starter", "repertoire", "veto"].includes(id) && own.length < 2,
       cost = trainingCost(id, level);
     return `<article class="training-card">${iconMarkup(item.icon)}<div><h2>${item.name}</h2><p>${item.detail}</p><div class="training-pips" aria-label="Nivel ${level} de ${item.max}">${Array.from({ length: item.max }, (_, i) => `<i class="${i < level ? "filled" : ""}"></i>`).join("")}</div><small>${level}/${item.max}</small></div><button class="coin-button" data-train="${id}" aria-label="Mejorar ${item.name} por ${cost} berries" ${maxed || unavailable || profile.berries < cost ? "disabled" : ""}>${iconMarkup("greed")}<span>${maxed ? "MÁX." : unavailable ? "SIN SEGUNDA TÉCNICA" : cost}</span></button></article>`;
   })
   .join("")}</div>
 <section class="training-loadout"><div><h2>Técnica inicial</h2><p>${sailor.levels.starter ? "Elige gratis entre tus técnicas propias." : "Compra Técnica inicial para cambiar tu ataque de salida."}</p><select id="training-starter" aria-label="Técnica inicial" ${sailor.levels.starter ? "" : "disabled"}>${own.map((w) => `<option value="${w.id}" ${w.id === starter ? "selected" : ""}>${w.title}</option>`).join("")}</select></div><div><h2>Veto de técnicas · ${sailor.banned.length}/${sailor.levels.veto}</h2><p>Las técnicas vetadas no aparecen en las cartas hasta aprenderlas mediante un vínculo.</p>${
   own
     .filter((w) => w.id !== starter)
     .map(
       (w) =>
         `<label class="veto-option"><input type="checkbox" data-veto="${w.id}" ${sailor.banned.includes(w.id) ? "checked" : ""} ${!sailor.banned.includes(w.id) && sailor.banned.length >= sailor.levels.veto ? "disabled" : ""}>${w.title}</label>`,
     )
     .join("") || "<p>Este tripulante tiene una sola técnica.</p>"
 }</div></section>`;
    const canvas = dialog.querySelector("canvas")!,
      ctx = canvas.getContext("2d");
    if (ctx)
      drawSprite(
        ctx,
        getSpriteAtlas(selected, 0),
        { x: 56, y: 113 },
        "down",
        "idle",
        0,
        1.4,
      );
    dialog
      .querySelector("#training-back")
      ?.addEventListener("click", () => dialog.close());
    dialog
      .querySelector("#training-character")
      ?.addEventListener("change", (e) => {
        const id = (e.target as HTMLSelectElement).value;
        if (characters.some((c) => c.id === id)) {
          selected = id as CharacterId;
          render();
        }
      });
    dialog.querySelectorAll<HTMLButtonElement>("[data-train]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = trainingIds.find((id) => id === b.dataset.train);
        if (id && purchaseTraining(profile, selected, id)) {
          saveProfile();
          render();
          dialog
            .querySelector<HTMLButtonElement>(`[data-train="${id}"]`)
            ?.focus();
        }
      }),
    );
    dialog
      .querySelector("#training-starter")
      ?.addEventListener("change", (e) => {
        if (
          setStarter(
            profile,
            selected,
            (e.target as HTMLSelectElement).value as WeaponId,
          )
        ) {
          saveProfile();
          render();
        }
      });
    dialog.querySelectorAll<HTMLInputElement>("[data-veto]").forEach((input) =>
      input.addEventListener("change", () => {
        const ids = Array.from(
          dialog.querySelectorAll<HTMLInputElement>("[data-veto]:checked"),
        ).map((i) => i.dataset.veto as WeaponId);
        setVeto(profile, selected, ids);
        saveProfile();
        render();
      }),
    );
  }
  dialog.addEventListener("close", () => {
    dialog.remove();
    onClose();
    if (previous instanceof HTMLElement && previous.isConnected)
      previous.focus();
  });
  document.body.append(dialog);
  render();
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>("#training-back")?.focus();
}
