import { loadCustomAtlases } from "./render/asset-loader";
import { openCrew } from "./ui/crew";
import { characterNames } from "./data/content";
import type { CrewSelection } from "./data/crew";
import "./ui/crew.css";
import { openCatalog } from "./ui/catalog";
import "./style.css";
import "./ui/battle.css";
import { game } from "./data/game";
import { drawIsland } from "./render/island";
import { startSession } from "./ui/session";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Falta el contenedor principal");
const app: HTMLDivElement = root;
let selection: CrewSelection = { captain: "luffy", nakama: [] };
let cleanup: (() => void) | undefined;
const debug = new URLSearchParams(location.search).has("debug");
function showPort(): void {
  cleanup?.();
  cleanup = undefined;
  app.innerHTML = `
    <header><a href="./" class="brand">MAREA<span> / SURVIVOR</span></a><span class="badge">${game.phase}</span></header>
    <main>
      <section class="intro"><p class="eyebrow">BITÁCORA 004 / UNA TRIPULACIÓN, UN SUEÑO</p><h1>Una ola más<span>.</span><br>Una aventura tuya.</h1><p class="description">Diez sueños. Tu tripulación.<br>Elige capitán, reúne nakama y conquista la costa.</p><button id="play">Zarpar hacia East Blue <span>↗</span></button><button class="secondary port-catalog" id="crew">Elegir tripulación</button><p class="crew-selected">${[selection.captain, ...selection.nakama].map((id) => characterNames[id]).join(" + ")}</p><button class="secondary port-catalog" id="catalog">Cuaderno de combate</button><p class="caption">WASD / flechas · Espacio para embestir · Ataque automático</p></section>
      <section class="map" aria-label="Vista procedural de East Blue"><div class="map-label"><span>01 / EAST BLUE</span><span>LA MAREA SUBE</span></div><canvas aria-label="Isla pixel art con palmeras, embarcadero y un aventurero"></canvas><div class="map-footer"><span>RESISTE · MEJORA · REPITE</span><span>✦</span></div></section>
      <section class="status"><div><span class="number">01</span><h2>No dejes de moverte</h2><p>Tus técnicas buscan al enemigo cercano. Tú eliges dónde combatir.</p></div><div><span class="number">02</span><h2>Rompe el cerco</h2><p>Embestir te protege y derriba a los enemigos en tu camino. Úsalo para abrir una salida.</p></div><div><span class="number">03</span><h2>Haz tuya la partida</h2><p>Recoge cristales y elige mejoras. Sobrevive cinco minutos para asegurar la costa.</p></div></section>
    </main><footer>MAREA DE AVENTURAS <span>FASE 3 · PERSONAJES Y NAKAMA · SPRITES 2D ILUSTRADOS</span></footer>`;
  app.querySelector("#catalog")?.addEventListener("click", openCatalog);
  app.querySelector("#crew")?.addEventListener("click", () =>
    openCrew(selection, (next) => {
      selection = next;
      showPort();
    }),
  );
  const canvas = app.querySelector("canvas");
  if (canvas)
    drawIsland(canvas, game.island.seed, selection.captain, selection.nakama);
  app.querySelector("#play")?.addEventListener("click", () => {
    cleanup = startSession(app, showPort, debug, selection);
  });
}
app.innerHTML = `<main><section class="intro" role="status"><p class="eyebrow">MAREA DE AVENTURAS</p><h1>Preparando la tripulación…</h1></section></main>`;
void loadCustomAtlases().then(showPort);
