import {
  affinityNames,
  characterNames,
  contentLimits,
  passives,
  passiveById,
  weapons,
} from "../data/content";
export function openCatalog(): void {
  const dialog = document.createElement("dialog");
  dialog.className = "catalog-dialog";
  dialog.setAttribute("aria-label", "Cuaderno de combate");
  dialog.innerHTML = `<div class="catalog-heading"><div><p class="eyebrow">BITÁCORA DE TÉCNICAS · FASE 2</p><h2>Un estilo para cada nakama.</h2></div><button class="small-button" id="close-catalog">Cerrar ✕</button></div><p class="catalog-intro">18 técnicas · 14 pasivos · 4 huecos de técnica y 6 de pasivo. Luffy solo aprende sus técnicas de goma. El resto está disponible en el banco de depuración hasta la fase de personajes.</p><h3>Técnicas y evoluciones</h3><div class="catalog-grid">${weapons.map((item) => `<article class="catalog-card"><span class="catalog-owner">${characterNames[item.owner]} / ${affinityNames[item.affinity]}</span><h4>${item.title}</h4><p>${item.description}</p><div class="recipe">EVOLUCIÓN → ${item.evolution.title}<br>Rango 5 + ${passiveById(item.evolution.passive).title} rango ${contentLimits.passiveEvolutionRank} + cofre tras 01:00.</div></article>`).join("")}</div><h3>Pasivos</h3><div class="catalog-grid">${passives.map((item) => `<article class="catalog-card"><span class="catalog-owner">${item.symbol} / ${affinityNames[item.affinity]} · ${item.max} rangos</span><h4>${item.title}</h4><p>${item.description}</p></article>`).join("")}</div><h3>Afinidades</h3><p class="catalog-intro">Dos técnicas o pasivos de una afinidad: +12% de daño para esas técnicas. Tres o más: también +8% de alcance. Las afinidades no conceden poderes ajenos al personaje. Los nombres con sufijo describen mejoras originales del juego, no formas nuevas del anime.</p>`;
  document.body.append(dialog);
  const previous = document.activeElement;
  const close = (): void => {
    dialog.close();
  };
  dialog.querySelector("#close-catalog")?.addEventListener("click", close);
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      if (previous instanceof HTMLElement)
        previous.focus({ preventScroll: true });
    },
    { once: true },
  );
  dialog.addEventListener("click", (event) => {
    if (
      event.target === dialog &&
      (event.clientX < dialog.getBoundingClientRect().left ||
        event.clientX > dialog.getBoundingClientRect().right)
    )
      close();
  });
  dialog.showModal();
}
