import { survivalPressure } from "../data/survival";
import { islandAt } from "../data/islands";
import { notify } from "./rules";
import type { Run } from "./types";
/** Peligros locales, siempre anunciados; no alteran ni ocultan los controles. */
export function updateIslandEvents(run: Run, dt: number): void {
  if (run.mission === "voyage") return;
  const island = islandAt(run.elapsed, run.mission);
  if (island.hazard === "none" || island.hazard === "buster") return;
  run.islandTimer -= dt;
  if (run.islandTimer > 0) return;
  run.islandTimer = 24;
  const element = island.hazard === "ice" ? "cloud" : island.hazard;
  const p = { ...run.player.position };
  if (island.hazard === "thread") {
    const a = run.random() * Math.PI * 2;
    run.imuZones.push({
      position: { x: p.x - Math.cos(a) * 240, y: p.y - Math.sin(a) * 240 },
      end: { x: p.x + Math.cos(a) * 240, y: p.y + Math.sin(a) * 240 },
      radius: 13,
      warning: 1.7,
      life: 0.35,
      damage: 22 * survivalPressure(run.elapsed),
      element: "thread",
    });
  } else
    run.imuZones.push({
      position: p,
      radius: island.hazard === "ice" ? 58 : 64,
      warning: 1.6,
      life: 0.35,
      damage: 20 * survivalPressure(run.elapsed),
      element,
    });
  notify(
    run,
    island.hazard === "lightning"
      ? "¡Relámpago de Upper Yard! Sal del círculo"
      : island.hazard === "shadow"
        ? "¡Sombras bajo tus pies! Cambia de posición"
        : island.hazard === "ice"
          ? "¡El hielo se resquebraja! Sal del círculo"
          : island.hazard === "thread"
            ? "¡Red de hilos! Cruza antes de que cierre"
            : "¡Lluvia de fuego! Esquiva las marcas",
  );
}
