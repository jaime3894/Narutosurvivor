import { openSettings } from "./settings";
import { game } from "../data/game";
import { characterNames } from "../data/content";
import { characters, type CrewSelection } from "../data/crew";
import { drawWorld } from "../render/world";
import { drawSprite, getSpriteAtlas } from "../render/sprites";
import { profile, storageNotice } from "./profile-store";
import { iconMarkup } from "./icons";
interface PortActions {
  play: () => void;
  missions: () => void;
  crew: () => void;
  training: () => void;
  catalog: () => void;
  select: (id: CrewSelection["captain"]) => void;
}
export function renderPort(
  app: HTMLElement,
  selection: CrewSelection,
  actions: PortActions,
): () => void {
  const sailor = profile.sailors[selection.captain];
  app.innerHTML = `<div class="port-shell"><canvas id="port-world" aria-label="Puerto pirata ilustrado de East Blue"></canvas><div class="port-shade"></div><header class="port-top"><a href="./" class="brand">MAREA<span> / SURVIVOR</span></a><span class="wallet">${iconMarkup("greed")} ${profile.berries}<small>BERRIES DE LA CUENTA</small></span><span class="badge">${game.phase}</span></header><main class="port-main"><section class="port-hero"><p class="eyebrow">ONE PIECE FAN ADVENTURE</p><h1>Marea de<br><span>aventuras</span></h1><p class="port-tagline">Un capitán. Una tripulación. Tu próxima leyenda.</p><div class="captain-pedestal"><canvas id="port-captain" width="200" height="200" aria-label="${characterNames[selection.captain]} preparado para zarpar"></canvas><span class="captain-tag">CAPITÁN</span><h2>${characterNames[selection.captain]}</h2><p>${selection.nakama.length ? "Nakama · " + selection.nakama.map((id) => characterNames[id]).join(" + ") : "Elige hasta dos nakama de apoyo"}</p></div><div class="port-crew-strip" aria-label="Elegir capitán">${characters.map((c) => `<button data-port-captain="${c.id}" aria-label="Capitán ${characterNames[c.id]}" aria-pressed="${selection.captain === c.id}"><canvas width="48" height="64" data-mini="${c.id}"></canvas><span>${characterNames[c.id]}</span></button>`).join("")}</div></section><aside class="port-sidebar"><nav aria-label="Menú de aventura"><button class="port-nav play-nav" id="play" aria-label="Zarpar hacia East Blue">${iconMarkup("wheel")}<span><strong>Zarpar hacia East Blue</strong><small>Supervivencia sin límite · zonas cada 4 min</small></span><b>›</b></button><button class="port-nav" id="missions" aria-label="Islas y jefes">${iconMarkup("cyclone")}<span><strong>Islas y jefes</strong><small>East Blue · Alabasta · Buster Call</small></span></button><button class="port-nav" id="crew" aria-label="Elegir tripulación">${iconMarkup("pistol")}<span><strong>Elegir tripulación</strong><small>Diez capitanes · nakama y formas</small></span></button><button class="port-nav" id="training" aria-label="Mejoras">${iconMarkup("upgrade")}<span><strong>Mejoras</strong><small>Haz más fuerte a tu capitán en cada run</small></span></button><button class="port-nav" id="catalog" aria-label="Cuaderno de combate">${iconMarkup("experience")}<span><strong>Cuaderno de combate</strong><small>Técnicas, pasivos y evoluciones</small></span></button><button class="port-nav" id="port-settings" aria-label="Ajustes">${iconMarkup("wheel")}<span><strong>Ajustes</strong><small>Pantalla completa, gráficos y controles</small></span></button><div class="port-nav unavailable">${iconMarkup("chest")}<span><strong>Gacha</strong><small>Próximamente</small></span><span class="lock-mark">🔒</span></div></nav><section class="port-record"><p>TRAVESÍAS <b>${sailor.runs}</b> · VICTORIAS <b>${sailor.wins}</b></p><p>Mejor tiempo <b>${Math.floor(sailor.bestTime / 60)}:${String(sailor.bestTime % 60).padStart(2, "0")}</b> · Derrotados <b>${sailor.kills}</b></p></section><p class="port-hint">WASD / flechas · Espacio para embestir<br>F: formas · 1–4: técnica o vínculo</p>${storageNotice() ? `<p role="status">${storageNotice()}</p>` : ""}</aside></main><footer class="port-footer">PROYECTO FAN NO OFICIAL <span>EAST BLUE → ALABASTA</span></footer></div>`;
  app
    .querySelector("#port-settings")
    ?.addEventListener("click", () => openSettings());
  for (const [id, action] of Object.entries({
    play: actions.play,
    missions: actions.missions,
    crew: actions.crew,
    training: actions.training,
    catalog: actions.catalog,
  }))
    app.querySelector("#" + id)?.addEventListener("click", action);
  app.querySelectorAll<HTMLButtonElement>("[data-port-captain]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = characters.find((c) => c.id === b.dataset.portCaptain)?.id;
      if (id) actions.select(id);
    }),
  );
  const world = app.querySelector<HTMLCanvasElement>("#port-world")!,
    ctx = world.getContext("2d")!;
  world.width = 1440;
  world.height = 900;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.scale(1.3, 1.3);
  ctx.translate(-620, -420);
  drawWorld(ctx, { x: 620, y: 420, width: 1110, height: 695 }, 0);
  ctx.restore();
  for (const c of app.querySelectorAll<HTMLCanvasElement>("[data-mini]")) {
    const id = characters.find((ch) => ch.id === c.dataset.mini)?.id,
      sc = c.getContext("2d");
    if (id && sc)
      drawSprite(
        sc,
        getSpriteAtlas(id, 0),
        { x: 24, y: 62 },
        "down",
        "idle",
        0,
        0.8,
      );
  }
  const hero = app.querySelector<HTMLCanvasElement>("#port-captain")!,
    hc = hero.getContext("2d")!;
  hc.imageSmoothingEnabled = false;
  let frame = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw(time: number): void {
    hc.clearRect(0, 0, 200, 200);
    hc.fillStyle = "#101b4366";
    hc.beginPath();
    hc.ellipse(100, 174, 54, 12, 0, 0, Math.PI * 2);
    hc.fill();
    drawSprite(
      hc,
      getSpriteAtlas(selection.captain, 0),
      { x: 100, y: 175 },
      "down",
      "idle",
      reduced ? 0 : time / 1000,
      2.2,
    );
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
}
