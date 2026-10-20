import { openMissions } from "./ui/missions";
import { loadCustomAtlases } from "./render/asset-loader";
import { openCrew } from "./ui/crew";
import type { CrewSelection } from "./data/crew";
import { openCatalog } from "./ui/catalog";
import { openTraining } from "./ui/training";
import { profile, saveProfile } from "./ui/profile-store";
import { renderPort } from "./ui/port";
import { startSession } from "./ui/session";
import "./style.css";
import "./ui/crew.css";
import "./ui/battle.css";
import "./ui/pirate.css";
import "./ui/viewport.css";
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Falta el contenedor principal");
const app = root;
let selection: CrewSelection = { captain: profile.selected, nakama: [] };
let cleanup: (() => void) | undefined;
const debug = new URLSearchParams(location.search).has("debug");
function showPort(): void {
  cleanup?.();
  cleanup = undefined;
  cleanup = renderPort(
    app,
    selection,
    {
      play: () => {
        cleanup?.();
        cleanup = startSession(app, showPort, debug, selection);
      },
      missions: () =>
        openMissions((id) => {
          cleanup?.();
          cleanup = startSession(app, showPort, debug, selection, id);
        }),
      crew: () =>
        openCrew(selection, (next) => {
          selection = next;
          profile.selected = next.captain;
          saveProfile();
          showPort();
        }),
      training: () => openTraining(selection.captain, showPort),
      catalog: openCatalog,
      select: (id) => {
        selection = {
          captain: id,
          nakama: selection.nakama.filter((n) => n !== id),
        };
        profile.selected = id;
        saveProfile();
        showPort();
      },
    },
    debug,
  );
}
app.innerHTML =
  '<main class="loading-screen" role="status"><p class="eyebrow">MAREA DE AVENTURAS</p><h1>Preparando la tripulación…</h1></main>';
void loadCustomAtlases().then(showPort);
