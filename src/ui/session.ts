import { voyageStage } from "../data/voyage";
import { bossMoves } from "../data/boss-moves";
import { prepareSailor, settleRun } from "../game/profile";
import { profile, saveProfile } from "./profile-store";
import { iconMarkup, upgradeIcon } from "./icons";
import { canReroll, rerollUpgrades } from "../game/progression";
import { formRequirement } from "../game/forms";
import { formMilestones } from "../data/form-progression";
import {
  activeTechniques,
  bondLimit,
  bondCandidates,
  chooseBossReward,
  linkTechnique,
  cancelBond,
  selectTechnique,
} from "../game/bonds";
import { spawnRift, enterRift } from "../game/rifts";
import { bosses } from "../data/rifts";
import {
  characterById,
  activeSynergies,
  type CrewSelection,
  type FormTier,
} from "../data/crew";
import { cycleForm, changeForm } from "../game/crew";
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
import {
  closeChest,
  chooseChestReward,
  grantUpgrade,
  spawnChest,
} from "../game/progression";
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
    form: FormTier;
    energy: number;
    linked: WeaponId[];
    boss: string | null;
    rift: boolean;
    bossesDefeated: number;
    stage: string;
    nakama: { character: CharacterId; x: number; y: number }[];
    synergies: string[];
    casters: CharacterId[];
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
  unlockForms: () => void;
  setTime: (seconds: number) => void;
  openRift: () => void;
  defeatBoss: () => void;
  chooseChest: (index: number) => boolean;
  form: (tier: FormTier) => boolean;
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
  selection: CrewSelection = { captain: "luffy", nakama: [] },
): () => void {
  const makeRun = () =>
    createRun(
      Date.now(),
      selection.captain,
      selection.nakama,
      prepareSailor(profile, selection.captain),
    );
  let run = makeRun();
  let accountReward = 0;
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
        <div class="crew-hud"><div class="form-controls" role="group" aria-label="Cambiar forma">${[0, 1, 2].map((tier) => `<button data-form-tier="${tier}"></button>`).join("")}</div><div class="energy-row"><span>ENERGÍA <b id="energy-text">∞</b></span><div class="meter energy-meter" role="progressbar" aria-label="Energía de forma infinita" aria-valuetext="Infinita" aria-valuemin="0" aria-valuemax="100"><i id="energy-bar"></i></div></div><p id="innate-label"></p><p id="nakama-label"></p><p id="synergy-label"></p></div>
        <div class="battle-bottom"><div><span class="keycap">W A S D</span> o flechas · movimiento <span class="keycap">ESPACIO</span> embestida</div><button class="dash-button" id="dash">➶ Embestir <span id="dash-state">LISTO</span></button></div>
        <button class="small-button" id="enter-rift" hidden>Entrar en la grieta</button><p id="rift-status" role="status"></p><p class="battle-tip">F: cambiar forma · 1–4: técnica o vínculo · Técnicas automáticas · Recoge cofres para evolucionar · Arrastra en la arena para moverte</p>
        ${debug ? `<div class="debug-tools"><span>BANCO DE TÉCNICAS Y FORMAS</span><button id="debug-xp">+10 XP</button><button id="debug-forms">Desbloquear formas</button><select id="debug-technique" aria-label="Técnica de depuración">${weapons.map((item) => `<option value="${item.id}">${characterNames[item.owner]} · ${item.title}</option>`).join("")}</select><button id="debug-evolution">Preparar evolución</button><button id="debug-chest">Cofre</button><button id="debug-vacuum">Imán</button><button id="debug-rift">Grieta</button><button id="debug-boss">Derrotar jefe</button></div>` : ""}
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
  const controls = new Controls(canvas, pause, () => {
    cycleForm(run);
    hud();
  });
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

  root
    .querySelectorAll<HTMLButtonElement>("[data-form-tier]")
    .forEach((button) =>
      button.addEventListener(
        "click",
        () => {
          const tier = Number(button.dataset.formTier);
          if (tier === 0 || tier === 1 || tier === 2) changeForm(run, tier);
          hud();
          canvas.focus({ preventScroll: true });
        },
        { signal },
      ),
    );
  function hud(): void {
    query(".battle-location").textContent = voyageStage(
      run.elapsed,
    ).name.toUpperCase();
    const character = characterById(run.character);
    query("#energy-text").textContent = "∞";
    query("#energy-bar").style.width = `${run.energy}%`;
    query(".energy-meter").setAttribute(
      "aria-valuenow",
      String(Math.floor(run.energy)),
    );
    root
      .querySelectorAll<HTMLButtonElement>("[data-form-tier]")
      .forEach((button) => {
        const tier = Number(button.dataset.formTier) as FormTier;
        const definition = character.forms[tier];
        button.textContent = `${tier + 1}. ${definition.name}${tier > run.formUnlocked ? " · " + formRequirement(run.character, tier) : ""}`;
        button.classList.toggle("active", run.form === tier);
        button.setAttribute("aria-pressed", String(run.form === tier));
        button.disabled =
          run.status !== "playing" ||
          (tier > 0 && (tier > run.formUnlocked || run.formCooldown > 0));
      });
    query("#innate-label").textContent = `Innato · ${character.innate}`;
    query("#nakama-label").textContent = run.nakama.length
      ? `Nakama · ${run.nakama.map((item) => characterNames[item.character]).join(" + ")}`
      : "Sin nakama · elige compañeros en el puerto";
    query("#synergy-label").textContent = activeSynergies(
      run.character,
      run.nakama.map((item) => item.character),
    )
      .map((item) => `${item.name}: ${item.description}`)
      .join(" / ");
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
    xpText.textContent = `${Math.round(run.xp * 100) / 100} / ${xpForLevel(run.level)}`;
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
      run.activeWeapon,
      run.linkedWeapons,
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
            return `<button data-active-weapon="${slot.id}" aria-pressed="${activeTechniques(run).includes(slot.id)}" class="loadout-chip ${slot.evolved ? "evolved" : ""}" title="${definition.description}">${run.linkedWeapons.includes(slot.id) ? "∞ " : ""}${iconMarkup(slot.id)} ${slot.evolved ? definition.evolution.title : definition.title} <b>${run.ranks[weaponKey(slot.id)]}/5</b></button>`;
          })
          .join("") +
        `<span class="loadout-empty">${run.weapons.length}/${contentLimits.weapons} TÉCNICAS</span>`;
      query("#passive-loadout").innerHTML =
        passives
          .filter((item) => run.ranks[item.id] > 0)
          .map(
            (item) =>
              `<span title="${item.title}: ${item.description}">${iconMarkup(item.id)} ${item.title} ${run.ranks[item.id]}</span>`,
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
    query("#rift-status").textContent = run.arena
      ? `${bosses[run.enemies[0]?.boss?.kind ?? "buggy"].name} · ${bossMoves[run.enemies[0]?.boss?.move ?? "knifeFan"].name} · ${Math.ceil(run.arena.remaining)} s`
      : run.rift
        ? `Grieta · ${Math.ceil(run.rift.remaining)} s · ${Math.round(Math.hypot(run.rift.position.x - run.player.position.x, run.rift.position.y - run.player.position.y))} m`
        : `Jefes vencidos: ${run.bossesDefeated} · Vínculo ${run.linkedWeapons.length}/${bondLimit(run)}`;
    query<HTMLButtonElement>("#enter-rift").hidden = !run.rift;
    query<HTMLButtonElement>("#enter-rift").disabled =
      run.status !== "playing" ||
      !run.rift ||
      Math.hypot(
        run.rift.position.x - run.player.position.x,
        run.rift.position.y - run.player.position.y,
      ) > 200;
    query("#loot-stats").textContent =
      `฿ ${run.berries} · COFRES ${run.openedChests}${run.haste > 0 ? ` · IMPULSO ${Math.ceil(run.haste)}s` : ""}`;
  }
  function restart(): void {
    run = makeRun();
    accountReward = 0;
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
    const key = `${run.status}:${run.level}:${run.chestSerial}:${run.rewardSerial}`;
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
            ? `<button class="upgrade-card" data-upgrade="${id}">${upgradeIcon(id)}<span class="card-kind">${id.startsWith("weapon:") ? "TÉCNICA · " + characterNames[run.character] : "BONUS DE COMBATE"}</span><span class="upgrade-name">${upgrade.title}</span><span class="upgrade-description">${upgrade.description}</span><span class="upgrade-rank">RANGO ${run.ranks[id] + 1} / ${upgrade.max} · TECLA ${index + 1}</span></button>`
            : "";
        })
        .join(
          "",
        )}</div><div class="modal-actions"><button id="reroll-upgrades" class="secondary" ${canReroll(run) ? "" : "disabled"}>Cambiar cartas · ${run.rerollsLeft} restantes</button></div>`;
    } else if (run.status === "chest") {
      content = `<p class="eyebrow">COFRE ABIERTO · ELIGE 1 DE 3</p><h1>El mar guarda tesoros.</h1><p class="modal-subtitle">El combate está detenido. Solo recibirás la opción elegida.</p><div class="upgrade-grid">${run.chestRewards.map((r, i) => `<button class="upgrade-card ${r.kind === "evolution" ? "evolved" : ""}" data-chest="${i}">${iconMarkup(r.id ?? (r.kind === "berries" ? "greed" : r.kind === "haste" ? "stride" : r.kind === "vitality" ? "vitality" : "chest"), "upgrade-icon")}<span class="upgrade-name">${r.title}</span><span class="upgrade-description">${r.detail}</span><span class="upgrade-rank">ELEGIR · TECLA ${i + 1}</span></button>`).join("")}</div>`;
    } else if (run.status === "bossReward") {
      content = `<p class="eyebrow">JEFE DERROTADO · ELIGE UNA RECOMPENSA</p><h1>La tripulación crece.</h1><div class="upgrade-grid">${run.bossRewards.map((r, i) => `<button class="upgrade-card" data-boss-reward="${i}">${iconMarkup(r.id === "bond" ? "multishot" : r.id === "damage" ? "power" : r.id === "health" ? "vitality" : r.id === "speed" ? "stride" : r.id, "upgrade-icon")}<span class="upgrade-name">${r.title}</span><span class="upgrade-description">${r.detail}</span><span class="upgrade-rank">TECLA ${i + 1}</span></button>`).join("")}</div>`;
    } else if (run.status === "bond") {
      content = `<p class="eyebrow">VÍNCULO · ${Math.max(2, run.linkedWeapons.length + 1)} TÉCNICAS JUNTAS</p><h1>Elige qué técnica vincular.</h1><p class="modal-subtitle">${run.linkedWeapons.length ? run.linkedWeapons.map((w) => weaponById(w).title).join(" + ") : weaponById(run.activeWeapon).title}. Solo aparecen técnicas de ${characterNames[run.character]}.</p><div class="upgrade-grid">${bondCandidates(
        run,
      )
        .map((id) => {
          const w = weaponById(id);
          return `<button class="upgrade-card" data-link="${id}">${iconMarkup(id, "upgrade-icon")}<span class="upgrade-name">${w.title}</span><span class="upgrade-description">Técnica de ${characterNames[run.character]} · ${w.description}</span></button>`;
        })
        .join(
          "",
        )}</div><button id="back-rewards">Volver a recompensas</button>`;
    } else if (run.status === "paused") {
      content =
        '<p class="eyebrow">UN RESPIRO EN ALTA MAR</p><h1>A tu ritmo.</h1><p class="modal-subtitle">La partida está en pausa.</p><div class="modal-actions"><button id="resume">Continuar</button><button class="secondary" id="leave">Volver al puerto</button></div>';
    } else {
      accountReward = settleRun(profile, run);
      saveProfile();
      const won = run.status === "won";
      content = `<p class="eyebrow">${won ? "TRAVESÍA COMPLETADA" : "EL MAR VOLVERÁ A LLAMARTE"}</p><h1>${won ? "La costa es tuya." : "Una ola más."}</h1><p class="modal-subtitle">${won ? "Cinco minutos. Una pequeña leyenda." : "Cada intento deja una historia. Vuelve a intentarlo."}</p><div class="results-grid"><div><strong>${formatTime(run.elapsed)}</strong><span>RESISTIDO</span></div><div><strong>${run.kills}</strong><span>DERROTADOS</span></div><div><strong>${run.level}</strong><span>NIVEL</span></div><div><strong>${Math.round(run.damageDealt)}</strong><span>DAÑO CAUSADO</span></div></div><div class="build-summary">${
        upgrades
          .filter((item) => run.ranks[item.id] > 0)
          .map((item) => `${item.title} ${run.ranks[item.id]}`)
          .join(" · ") || "Sin mejoras adquiridas"
      }</div><p class="results-account">${iconMarkup("greed")} +${accountReward} berries para ${characterNames[run.character]} · Bolsa: ${profile.sailors[run.character].berries}</p><p class="results-loot">฿ ${run.berries} berries · ${run.openedChests} cofres · ${run.evolvedCount} evoluciones</p><div class="modal-actions"><button id="restart">Otra partida ↗</button><button class="secondary" id="leave">Volver al puerto</button></div>`;
    }
    overlay.innerHTML = `<div class="scrim"><section class="battle-modal" role="dialog" aria-modal="true" aria-label="${run.status === "upgrade" ? "Elige una mejora" : run.status === "paused" ? "Pausa" : run.status === "chest" ? "Botín del cofre" : run.status === "bossReward" ? "Recompensa del jefe" : run.status === "bond" ? "Vincular técnicas" : "Resultados"}">${content}</section></div>`;
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
    overlay.querySelectorAll<HTMLButtonElement>("[data-chest]").forEach((b) =>
      b.addEventListener("click", () => {
        chooseChestReward(run, Number(b.dataset.chest));
        syncOverlay();
        hud();
      }),
    );
    overlay
      .querySelectorAll<HTMLButtonElement>("[data-boss-reward]")
      .forEach((b) =>
        b.addEventListener("click", () => {
          chooseBossReward(run, Number(b.dataset.bossReward));
          syncOverlay();
          hud();
        }),
      );
    overlay.querySelectorAll<HTMLButtonElement>("[data-link]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = bondCandidates(run).find((id) => id === b.dataset.link);
        if (id) linkTechnique(run, id);
        syncOverlay();
        hud();
      }),
    );
    overlay.querySelector("#back-rewards")?.addEventListener("click", () => {
      cancelBond(run);
      syncOverlay();
      hud();
    });
    overlay.querySelector("#reroll-upgrades")?.addEventListener("click", () => {
      rerollUpgrades(run);
      syncOverlay();
      hud();
    });
    overlay.querySelector("#resume")?.addEventListener("click", pause);
    overlay.querySelector("#restart")?.addEventListener("click", restart);
    overlay.querySelector("#leave")?.addEventListener("click", () => {
      settleRun(profile, run);
      saveProfile();
      onExit();
    });
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
          return;
        }
      }
      if (
        !event.repeat &&
        ["Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)
      ) {
        const index = Number(event.code.slice(-1)) - 1;
        if (run.status === "chest") chooseChestReward(run, index);
        else if (run.status === "bossReward") chooseBossReward(run, index);
        else if (run.status === "playing") {
          const slot = run.weapons[index];
          if (slot) selectTechnique(run, slot.id);
        }
        syncOverlay();
        hud();
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
        form: run.form,
        energy: run.energy,
        linked: [...run.linkedWeapons],
        boss: run.enemies.find((e) => e.boss)?.boss?.kind ?? null,
        rift: Boolean(run.rift),
        bossesDefeated: run.bossesDefeated,
        stage: voyageStage(run.elapsed).id,
        nakama: run.nakama.map((item) => ({
          character: item.character,
          x: item.position.x,
          y: item.position.y,
        })),
        synergies: activeSynergies(
          run.character,
          run.nakama.map((item) => item.character),
        ).map((item) => item.id),
        casters: run.attacks.map((item) => item.caster),
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
        run.activeWeapon = id;
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
      unlockForms: () => {
        const rule = formMilestones[run.character];
        run.ranks[weaponKey(rule.first)] = 5;
        if (rule.second) run.ranks[weaponKey(rule.second)] = 5;
        else {
          const slot = run.weapons.find((w) => w.id === rule.first);
          if (slot) slot.evolved = true;
        }
        run.formUnlocked = 2;
        run.energy = 100;
        run.formCooldown = 0;
        hud();
      },
      setTime: (seconds) => {
        run.elapsed = Math.max(0, Math.min(299, seconds));
        hud();
        renderer.draw(run, 0.016);
      },
      openRift: () => {
        spawnRift(run);
        enterRift(run);
        syncOverlay();
        hud();
      },
      defeatBoss: () => {
        const boss = run.enemies.find((e) => e.boss);
        if (boss) {
          boss.health.current = 0;
          step(run, { x: 0, y: 0, dash: false }, 1 / 60);
        }
        syncOverlay();
        hud();
      },
      chooseChest: (index) => {
        const accepted = chooseChestReward(run, index);
        syncOverlay();
        hud();
        return accepted;
      },
      form: (tier) => {
        const result = changeForm(run, tier);
        hud();
        renderer.draw(run, 0.016);
        return result;
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
    query("#debug-forms").addEventListener(
      "click",
      () => window.__MAREA_DEBUG__?.unlockForms(),
      { signal },
    );
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
  query("#enter-rift").addEventListener(
    "click",
    () => {
      enterRift(run);
      hud();
      canvas.focus();
    },
    { signal },
  );
  query("#weapon-loadout").addEventListener(
    "click",
    (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        "[data-active-weapon]",
      );
      const id = run.weapons.find(
        (w) => w.id === button?.dataset.activeWeapon,
      )?.id;
      if (id) selectTechnique(run, id);
      hud();
    },
    { signal },
  );
  if (debug) {
    query("#debug-rift").addEventListener(
      "click",
      () => window.__MAREA_DEBUG__?.openRift(),
      { signal },
    );
    query("#debug-boss").addEventListener(
      "click",
      () => window.__MAREA_DEBUG__?.defeatBoss(),
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
