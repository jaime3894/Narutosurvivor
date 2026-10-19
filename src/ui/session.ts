import {
  characterNames,
  contentLimits,
  passives,
  weapons,
  weaponById,
  weaponKey,
  type CharacterId,
  type PickupKind,
  type WeaponId,
} from "../data/content";
import { addDrop, affinities, affinityDescription } from "../game/rules";
import { closeChest, grantUpgrade, spawnChest } from "../game/progression";
import { upgrades, xpForLevel, type UpgradeId } from "../data/combat";
import {
  chooseUpgrade,
  createRun,
  step,
  togglePause,
} from "../game/simulation";
import type { Input, Run } from "../game/types";
import { BattleRenderer } from "../render/battle";
import { Controls } from "./input";

export const formatTime = (seconds: number): string =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
export interface DebugBridge {
  snapshot: () => {
    status: Run["status"];
    elapsed: number;
    kills: number;
    level: number;
    health: number;
    enemies: number;
    xp: number;
    x: number;
    y: number;
    choices: UpgradeId[];
    character: CharacterId;
    weapons: { id: WeaponId; rank: number; evolved: boolean }[];
    chests: number;
    rewards: string[];
    berries: number;
    attacks: number;
  };
  advance: (seconds: number, input?: Input) => void;
  grantXp: (amount: number) => void;
  setHealth: (health: number) => void;
  choose: (id: UpgradeId) => boolean;
  equipTechnique: (id: WeaponId) => void;
  prepareEvolution: (id: WeaponId) => void;
  dropPickup: (kind: PickupKind) => void;
  spawnChest: () => void;
  closeChest: () => void;
}
declare global {
  interface Window {
    __MAREA_DEBUG__?: DebugBridge;
  }
}

export function startSession(
  root: HTMLElement,
  onExit: () => void,
  debug: boolean,
): () => void {
  let run = createRun();
  let stopped = false;
  let frame = 0;
  let previous = performance.now();
  let accumulator = 0;
  let lastHud = 0;
  let overlayKey = "";
  let buildKey = "";
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const abort = new AbortController();
  const signal = abort.signal;
  root.innerHTML = `
    <div class="battle-shell">
      <header class="battle-header"><a class="brand" href="./">MAREA<span> / SURVIVOR</span></a><span class="battle-location">EAST BLUE · EL PRIMER DESEMBARCO</span><button class="small-button" id="pause" aria-label="Pausar partida">Ⅱ Pausa</button></header>
      <main class="battle-main">
        <div class="hud"><div class="health-block"><span class="hud-label">VITALIDAD <b id="hp-text"></b></span><div class="meter health-meter" role="progressbar" aria-label="Vida" aria-valuemin="0"><i id="hp-bar"></i></div></div><div class="clock"><strong id="time">00:00</strong><span>RESISTE 05:00</span></div><div class="kill-block"><strong id="kills">0</strong><span>DERROTADOS</span></div></div>
        <div class="arena"><canvas id="battle" tabindex="0" aria-label="Campo de combate. Muévete con WASD o flechas. Espacio para embestir, Escape para pausar."></canvas><div id="overlay"></div><div class="arena-corner"><span id="fighter-name">LUFFY</span> / EAST BLUE <span>✦</span></div><div id="wave-note" class="wave-note">Encuentra tu ritmo. Recoge los cristales.</div></div>
        <div class="xp-row"><span id="level">NIVEL 1</span><div class="meter xp-meter" role="progressbar" aria-label="Experiencia" aria-valuemin="0"><i id="xp-bar"></i></div><span id="xp-text"></span></div>
        <div class="loadout"><div id="weapon-loadout" class="loadout-weapons"></div><div id="passive-loadout" class="loadout-passives"></div><div class="loadout-foot"><span id="affinities"></span><span id="loot-stats">฿ 0 · COFRES 0</span></div></div>
        <div class="battle-bottom"><div><span class="keycap">W A S D</span> o flechas · movimiento <span class="keycap">ESPACIO</span> embestida</div><button class="dash-button" id="dash">➶ Embestir <span id="dash-state">LISTO</span></button></div>
        <p class="battle-tip">Técnicas automáticas · Recoge cofres para evolucionar · Arrastra en la arena para moverte</p>
        ${debug ? `<div class="debug-tools"><span>BANCO DE TÉCNICAS · modelos provisionales</span><button id="debug-xp">+10 XP</button><select id="debug-technique" aria-label="Técnica de depuración">${weapons.map((item) => `<option value="${item.id}">${characterNames[item.owner]} · ${item.title}</option>`).join("")}</select><button id="debug-evolution">Preparar evolución</button><button id="debug-chest">Cofre</button><button id="debug-vacuum">Imán</button></div>` : ""}
      </main>
    </div>`;
  const query = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Falta ${selector}`);
    return element;
  };
  const canvas = query<HTMLCanvasElement>("#battle");
  const overlay = query("#overlay");
  const renderer = new BattleRenderer(
    canvas,
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const controls = new Controls(canvas, pause);
  const hpText = query("#hp-text"),
    hpBar = query("#hp-bar"),
    hpMeter = query(".health-meter");
  const xpText = query("#xp-text"),
    xpBar = query("#xp-bar"),
    xpMeter = query(".xp-meter");
  const time = query("#time"),
    kills = query("#kills"),
    level = query("#level"),
    dashState = query("#dash-state");
  const dashButton = query<HTMLButtonElement>("#dash");
  const pauseButton = query<HTMLButtonElement>("#pause");
  const note = query("#wave-note");

  function pause(): void {
    togglePause(run);
    controls.clear();
    syncOverlay();
  }
  pauseButton.addEventListener("click", pause, { signal });
  dashButton.addEventListener(
    "click",
    () => {
      controls.dash();
      canvas.focus({ preventScroll: true });
    },
    { signal },
  );
  query(".brand").addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      if (run.status === "playing") pause();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden && run.status === "playing") pause();
      controls.clear();
      accumulator = 0;
      previous = performance.now();
    },
    { signal },
  );
  window.addEventListener(
    "blur",
    () => {
      if (run.status === "playing") pause();
    },
    { signal },
  );

  function hud(): void {
    hpText.textContent = `${Math.ceil(run.player.health.current)} / ${run.player.health.maximum}`;
    hpBar.style.width = `${(run.player.health.current / run.player.health.maximum) * 100}%`;
    hpMeter.setAttribute(
      "aria-valuenow",
      String(Math.ceil(run.player.health.current)),
    );
    hpMeter.setAttribute("aria-valuemax", String(run.player.health.maximum));
    time.textContent = formatTime(run.elapsed);
    kills.textContent = String(run.kills);
    level.textContent = `NIVEL ${run.level}`;
    xpText.textContent = `${run.xp} / ${xpForLevel(run.level)}`;
    xpBar.style.width = `${Math.min(100, (run.xp / xpForLevel(run.level)) * 100)}%`;
    xpMeter.setAttribute("aria-valuenow", String(run.xp));
    xpMeter.setAttribute("aria-valuemax", String(xpForLevel(run.level)));
    dashState.textContent =
      run.player.dashCooldown > 0
        ? `${run.player.dashCooldown.toFixed(1)} s`
        : "LISTO";
    dashButton.disabled =
      run.status !== "playing" || run.player.dashCooldown > 0;
    pauseButton.disabled = !["playing", "paused"].includes(run.status);
    pauseButton.textContent =
      run.status === "paused" ? "▷ Continuar" : "Ⅱ Pausa";
    const wave = Math.floor(run.elapsed / 60);
    note.textContent =
      run.noticeTime > 0
        ? run.notice
        : run.elapsed < 12
          ? "Encuentra tu ritmo. Recoge los cristales."
          : ([
              "El mar empieza a agitarse",
              "Refuerzos en la costa",
              "La marea no espera",
              "No dejes que te rodeen",
              "Último esfuerzo. Resiste.",
            ][Math.min(wave, 4)] ?? "");
    const nextBuild = JSON.stringify([
      run.character,
      run.ranks,
      run.weapons.map((slot) => slot.evolved),
    ]);
    if (nextBuild !== buildKey) {
      buildKey = nextBuild;
      query("#fighter-name").textContent =
        characterNames[run.character].toUpperCase();
      query("#weapon-loadout").innerHTML =
        run.weapons
          .map((slot) => {
            const definition = weaponById(slot.id);
            return `<span class="loadout-chip ${slot.evolved ? "evolved" : ""}" title="${definition.description}">${slot.evolved ? "✦" : "⚔"} ${slot.evolved ? definition.evolution.title : definition.title} <b>${run.ranks[weaponKey(slot.id)]}/5</b></span>`;
          })
          .join("") +
        `<span class="loadout-empty">${run.weapons.length}/${contentLimits.weapons} TÉCNICAS</span>`;
      query("#passive-loadout").innerHTML =
        passives
          .filter((item) => run.ranks[item.id] > 0)
          .map(
            (item) =>
              `<span title="${item.title}: ${item.description}">${item.symbol} ${item.title} ${run.ranks[item.id]}</span>`,
          )
          .join("") ||
        "<span>Recoge cristales para elegir técnicas y pasivos.</span>";
      const active = Object.entries(affinities(run)).filter(
        ([, count]) => count >= 2,
      );
      query("#affinities").textContent =
        active.length > 0
          ? affinityDescription(run)
          : "Afinidades: combina 2 técnicas o pasivos del mismo grupo";
    }
    query("#loot-stats").textContent =
      `฿ ${run.berries} · COFRES ${run.openedChests}${run.haste > 0 ? ` · IMPULSO ${Math.ceil(run.haste)}s` : ""}`;
  }
  function restart(): void {
    run = createRun();
    controls.clear();
    accumulator = 0;
    previous = performance.now();
    renderer.camera.x = run.player.position.x;
    renderer.camera.y = run.player.position.y;
    syncOverlay();
    hud();
    canvas.focus({ preventScroll: true });
  }
  function syncOverlay(): void {
    const key = `${run.status}:${run.level}:${run.chestSerial}`;
    if (key === overlayKey) return;
    overlayKey = key;
    controls.clear();
    accumulator = 0;
    if (run.status === "playing") {
      overlay.innerHTML = "";
      canvas.focus({ preventScroll: true });
      return;
    }
    let content: string;
    if (run.status === "upgrade") {
      content = `<p class="eyebrow">NIVEL ${run.level} · ELIGE TU RUMBO</p><h1>Más fuerte con cada ola.</h1><p class="modal-subtitle">El combate está detenido. Elige una mejora.</p><div class="upgrade-grid">${run.choices
        .map((id, index) => {
          const upgrade = upgrades.find((item) => item.id === id);
          return upgrade
            ? `<button class="upgrade-card" data-upgrade="${id}"><span class="upgrade-icon">${upgrade.symbol}</span><span class="upgrade-name">${upgrade.title}</span><span class="upgrade-description">${upgrade.description}</span><span class="upgrade-rank">RANGO ${run.ranks[id] + 1} / ${upgrade.max} · TECLA ${index + 1}</span></button>`
            : "";
        })
        .join("")}</div>`;
    } else if (run.status === "chest") {
      const evolution = run.chestRewards.some(
        (reward) => reward.kind === "evolution",
      );
      content = `<p class="eyebrow">COFRE ABIERTO · ${run.chestRewards.length} PREMIO${run.chestRewards.length > 1 ? "S" : ""}</p><h1>${evolution ? "Tu técnica evoluciona." : "El mar guarda tesoros."}</h1><div class="chest-rewards">${run.chestRewards.map((reward) => `<div class="chest-reward ${reward.kind === "evolution" ? "evolved" : ""}"><strong>${reward.kind === "evolution" ? "✦ " : ""}${reward.title}</strong><span>${reward.detail}</span></div>`).join("")}</div><div class="modal-actions"><button id="close-chest">Continuar la aventura</button></div>`;
    } else if (run.status === "paused") {
      content =
        '<p class="eyebrow">UN RESPIRO EN ALTA MAR</p><h1>A tu ritmo.</h1><p class="modal-subtitle">La partida está en pausa.</p><div class="modal-actions"><button id="resume">Continuar</button><button class="secondary" id="leave">Volver al puerto</button></div>';
    } else {
      const won = run.status === "won";
      content = `<p class="eyebrow">${won ? "TRAVESÍA COMPLETADA" : "EL MAR VOLVERÁ A LLAMARTE"}</p><h1>${won ? "La costa es tuya." : "Una ola más."}</h1><p class="modal-subtitle">${won ? "Cinco minutos. Una pequeña leyenda." : "Cada intento deja una historia. Vuelve a intentarlo."}</p><div class="results-grid"><div><strong>${formatTime(run.elapsed)}</strong><span>RESISTIDO</span></div><div><strong>${run.kills}</strong><span>DERROTADOS</span></div><div><strong>${run.level}</strong><span>NIVEL</span></div><div><strong>${Math.round(run.damageDealt)}</strong><span>DAÑO CAUSADO</span></div></div><div class="build-summary">${
        upgrades
          .filter((item) => run.ranks[item.id] > 0)
          .map((item) => `${item.title} ${run.ranks[item.id]}`)
          .join(" · ") || "Sin mejoras adquiridas"
      }</div><p class="results-loot">฿ ${run.berries} berries · ${run.openedChests} cofres · ${run.evolvedCount} evoluciones</p><div class="modal-actions"><button id="restart">Otra partida ↗</button><button class="secondary" id="leave">Volver al puerto</button></div>`;
    }
    overlay.innerHTML = `<div class="scrim"><section class="battle-modal" role="dialog" aria-modal="true" aria-label="${run.status === "upgrade" ? "Elige una mejora" : run.status === "paused" ? "Pausa" : run.status === "chest" ? "Botín del cofre" : "Resultados"}">${content}</section></div>`;
    overlay
      .querySelectorAll<HTMLButtonElement>("[data-upgrade]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const id = run.choices.find(
            (choice) => choice === button.dataset.upgrade,
          );
          if (id) {
            chooseUpgrade(run, id);
            syncOverlay();
            hud();
          }
        });
      });
    overlay.querySelector("#close-chest")?.addEventListener("click", () => {
      closeChest(run);
      syncOverlay();
      hud();
    });
    overlay.querySelector("#resume")?.addEventListener("click", pause);
    overlay.querySelector("#restart")?.addEventListener("click", restart);
    overlay.querySelector("#leave")?.addEventListener("click", onExit);
    overlay.querySelector<HTMLButtonElement>("button")?.focus();
  }
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        run.status === "upgrade" &&
        ["Digit1", "Digit2", "Digit3"].includes(event.code) &&
        !event.repeat
      ) {
        const id = run.choices[Number(event.code.slice(-1)) - 1];
        if (id) {
          chooseUpgrade(run, id);
          syncOverlay();
          hud();
        }
      }
      if (event.code === "Tab" && run.status !== "playing") {
        const buttons = Array.from(
          overlay.querySelectorAll<HTMLButtonElement>("button"),
        );
        const first = buttons[0],
          last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    },
    { signal },
  );
  function update(now: number): void {
    if (stopped) return;
    const dt = Math.min(0.1, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (run.hitStop > 0 && !reducedMotion && run.status === "playing") {
      run.hitStop = Math.max(0, run.hitStop - dt);
      accumulator = 0;
    } else if (run.status === "playing") {
      accumulator += dt;
      const input =
        accumulator >= 1 / 60 ? controls.read() : { x: 0, y: 0, dash: false };
      let first = true;
      while (accumulator >= 1 / 60 && run.status === "playing") {
        step(run, { ...input, dash: first && input.dash }, 1 / 60);
        first = false;
        accumulator -= 1 / 60;
      }
    } else accumulator = 0;
    syncOverlay();
    renderer.draw(run, dt);
    if (now - lastHud > 80) {
      hud();
      lastHud = now;
    }
    frame = requestAnimationFrame(update);
  }
  if (debug) {
    window.__MAREA_DEBUG__ = {
      snapshot: () => ({
        status: run.status,
        elapsed: run.elapsed,
        kills: run.kills,
        level: run.level,
        health: run.player.health.current,
        enemies: run.enemies.length,
        xp: run.xp,
        x: run.player.position.x,
        y: run.player.position.y,
        choices: [...run.choices],
        character: run.character,
        weapons: run.weapons.map((slot) => ({
          id: slot.id,
          rank: run.ranks[weaponKey(slot.id)],
          evolved: slot.evolved,
        })),
        chests: run.chests.length,
        rewards: run.chestRewards.map((reward) => reward.title),
        berries: run.berries,
        attacks: run.attacks.length,
      }),
      advance: (seconds, input = { x: 0, y: 0, dash: false }) => {
        for (
          let i = 0;
          i < Math.min(600, Math.max(0, seconds)) * 60 &&
          run.status === "playing";
          i++
        )
          step(run, input, 1 / 60);
        syncOverlay();
        hud();
        renderer.draw(run, 0.016);
      },
      grantXp: (amount) => {
        run.xp += Math.max(0, Math.floor(amount));
        step(run, { x: 0, y: 0, dash: false }, 1 / 60);
        syncOverlay();
        hud();
      },
      setHealth: (health) => {
        run.player.health.current = Math.max(
          0,
          Math.min(run.player.health.maximum, health),
        );
      },
      equipTechnique: (id) => {
        const definition = weaponById(id);
        run = createRun(3894, definition.owner);
        for (const item of weapons) run.ranks[weaponKey(item.id)] = 0;
        run.ranks[weaponKey(id)] = 1;
        run.weapons = [{ id, timer: 0, evolved: false }];
        run.enemies.push({
          id: run.nextId++,
          position: {
            x: 1200 + Math.min(180, definition.range * 0.65),
            y: 900,
          },
          velocity: { x: 0, y: 0 },
          health: { current: 2000, maximum: 2000 },
          kind: "brute",
          radius: 19,
          flash: 0,
        });
        overlayKey = "";
        renderer.camera.x = run.player.position.x;
        renderer.camera.y = run.player.position.y;
        controls.clear();
        accumulator = 0;
        syncOverlay();
        hud();
        query<HTMLSelectElement>("#debug-technique").value = id;
      },
      prepareEvolution: (id) => {
        window.__MAREA_DEBUG__?.equipTechnique(id);
        for (let i = 0; i < 4; i++) grantUpgrade(run, weaponKey(id));
        const passive = weaponById(id).evolution.passive;
        grantUpgrade(run, passive);
        grantUpgrade(run, passive);
        run.elapsed = 61;
        run.chestTimer = 55;
        spawnChest(run, {
          x: run.player.position.x + 65,
          y: run.player.position.y,
        });
        hud();
      },
      dropPickup: (kind) => {
        addDrop(run, {
          position: { ...run.player.position },
          kind,
          value: kind === "coin" ? 25 : kind === "heal" ? 18 : 1,
          attracted: false,
        });
      },
      spawnChest: () => {
        spawnChest(run, {
          x: run.player.position.x + 65,
          y: run.player.position.y,
        });
      },
      closeChest: () => {
        closeChest(run);
        syncOverlay();
        hud();
      },
      choose: (id) => {
        const accepted = chooseUpgrade(run, id);
        syncOverlay();
        hud();
        return accepted;
      },
    };
    query("#debug-xp").addEventListener(
      "click",
      () => window.__MAREA_DEBUG__?.grantXp(10),
      { signal },
    );
  }
  if (debug) {
    query<HTMLSelectElement>("#debug-technique").addEventListener(
      "change",
      (event) => {
        const selected = weapons.find(
          (item) => item.id === (event.target as HTMLSelectElement).value,
        );
        if (selected) window.__MAREA_DEBUG__?.equipTechnique(selected.id);
      },
      { signal },
    );
    query("#debug-evolution").addEventListener(
      "click",
      () => {
        const selected = run.weapons[0];
        if (selected) window.__MAREA_DEBUG__?.prepareEvolution(selected.id);
      },
      { signal },
    );
    query("#debug-chest").addEventListener(
      "click",
      () => window.__MAREA_DEBUG__?.spawnChest(),
      { signal },
    );
    query("#debug-vacuum").addEventListener(
      "click",
      () => window.__MAREA_DEBUG__?.dropPickup("vacuum"),
      { signal },
    );
  }
  hud();
  syncOverlay();
  frame = requestAnimationFrame(update);
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    abort.abort();
    controls.destroy();
    renderer.destroy();
    delete window.__MAREA_DEBUG__;
  };
}
