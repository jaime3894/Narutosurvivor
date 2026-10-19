import { openCatalog } from "./ui/catalog";
import "./style.css";
import "./ui/battle.css";
import { game } from "./data/game";
import { drawIsland } from "./render/island";
import { startSession } from "./ui/session";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Falta el contenedor principal");
const app: HTMLDivElement = root;
let cleanup: (() => void) | undefined;
const debug = new URLSearchParams(location.search).has("debug");
function showPort(): void {
  cleanup?.();
  cleanup = undefined;
  app.innerHTML = `
    <header><a href="./" class="brand">MAREA<span> / SURVIVOR</span></a><span class="badge">${game.phase}</span></header>
    <main>
      <section class="intro"><p class="eyebrow">BITÁCORA 003 / EL PRIMER DESEMBARCO</p><h1>Una ola más<span>.</span><br>Una aventura tuya.</h1><p class="description">Puños de goma. Cofres. Nuevas técnicas.<br>Cinco minutos para conquistar la costa.</p><button id="play">Zarpar hacia East Blue <span>↗</span></button><button class="secondary port-catalog" id="catalog">Cuaderno de combate</button><p class="caption">WASD / flechas · Espacio para embestir · Ataque automático</p></section>
      <section class="map" aria-label="Vista procedural de East Blue"><div class="map-label"><span>01 / EAST BLUE</span><span>LA MAREA SUBE</span></div><canvas aria-label="Isla pixel art con palmeras, embarcadero y un aventurero"></canvas><div class="map-footer"><span>RESISTE · MEJORA · REPITE</span><span>✦</span></div></section>
      <section class="status"><div><span class="number">01</span><h2>No dejes de moverte</h2><p>Tus proyectiles buscan al enemigo cercano. Tú eliges dónde combatir.</p></div><div><span class="number">02</span><h2>Rompe el cerco</h2><p>Embestir te protege y derriba a los enemigos en tu camino. Úsalo para abrir una salida.</p></div><div><span class="number">03</span><h2>Haz tuya la partida</h2><p>Recoge cristales y elige mejoras. Sobrevive cinco minutos para asegurar la costa.</p></div></section>
    </main><footer>MAREA DE AVENTURAS <span>PROTOTIPO FASE 2 · ARTE PROCEDURAL ORIGINAL</span></footer>`;
  app.querySelector("#catalog")?.addEventListener("click", openCatalog);
  const canvas = app.querySelector("canvas");
  if (canvas) drawIsland(canvas, game.island.seed);
  app.querySelector("#play")?.addEventListener("click", () => {
    cleanup = startSession(app, showPort, debug);
  });
}
showPort();
