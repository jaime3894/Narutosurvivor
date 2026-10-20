import { arenaHeading } from "../src/game/arena-terrain";
import { steerAround } from "../src/game/terrain";
import { terrainTime } from "../src/data/missions";
import { chooseUpgrade } from "../src/game/simulation";
import { selectTechnique } from "../src/game/bonds";
import type { UpgradeId } from "../src/data/combat";
import type { Input, Run } from "../src/game/types";
/** Piloto de validación: busca botín, evita contactos y elige daño/multidisparo. No altera salud ni reglas. */
export function pilot(run: Run): Input {
  const player = run.player.position;
  const healing =
    run.player.health.current < run.player.health.maximum - 25
      ? run.drops.filter((drop) => drop.kind === "heal")
      : [];
  const nearestDrop = [...(healing.length > 0 ? healing : run.drops)].sort(
    (a, b) =>
      Math.hypot(a.position.x - player.x, a.position.y - player.y) -
      Math.hypot(b.position.x - player.x, b.position.y - player.y),
  )[0];
  const phase = run.elapsed * 0.065;
  const arenaTime = run.arena ? 75 - run.arena.remaining : 0;
  const arenaGoal = run.arena
    ? {
        x: run.arena.center.x + Math.cos(arenaTime * 0.9) * 195,
        y: run.arena.center.y + Math.sin(arenaTime * 0.9) * 195,
      }
    : undefined;
  const supplies =
    run.mission === "survival" &&
    run.player.health.current < run.player.health.maximum * 0.75
      ? run.fieldObjects
          .filter((o) => o.kind === "supplies")
          .sort(
            (a, b) =>
              Math.hypot(a.position.x - player.x, a.position.y - player.y) -
              Math.hypot(b.position.x - player.x, b.position.y - player.y),
          )[0]?.position
      : undefined;
  const survivalHeal =
    run.mission === "survival" ? healing[0]?.position : undefined;
  const goal = arenaGoal ??
    supplies ??
    survivalHeal ??
    (run.rift?.encounter ||
    run.player.health.current >= run.player.health.maximum * 0.55
      ? run.rift?.position
      : undefined) ??
    nearestDrop?.position ?? {
      x: 1200 + Math.cos(phase) * 370,
      y: 900 + Math.sin(phase) * 320,
    };
  const direct = run.arena
    ? { x: goal.x - player.x, y: goal.y - player.y }
    : steerAround(
        player,
        goal,
        run.player.radius,
        terrainTime(run.elapsed, run.mission),
      );
  const dx = direct.x,
    dy = direct.y;
  const distance = Math.hypot(dx, dy) || 1;
  let x = dx / distance,
    y = dy / distance;
  let close = 0;
  for (const foe of run.enemies) {
    const ex = player.x - foe.position.x,
      ey = player.y - foe.position.y;
    const d = Math.hypot(ex, ey) || 1;
    if (d < 120) {
      const weight = (120 - d) / 45;
      x += (ex / d) * weight;
      y += (ey / d) * weight;
    }
    if (d < 70) close++;
  }
  for (const shot of run.shots) {
    const dx = player.x - shot.position.x,
      dy = player.y - shot.position.y,
      len = Math.hypot(dx, dy) || 1;
    if (len < 110) {
      const side = shot.velocity.x * dy - shot.velocity.y * dx >= 0 ? 1 : -1,
        speed = Math.hypot(shot.velocity.x, shot.velocity.y) || 1;
      x += (-shot.velocity.y / speed) * side * 2.5;
      y += (shot.velocity.x / speed) * side * 2.5;
    }
  }
  for (const shell of run.director.buster?.shells ?? []) {
    const dx = player.x - shell.position.x,
      dy = player.y - shell.position.y,
      len = Math.hypot(dx, dy) || 1;
    if (len < 100) {
      x += (dx / len) * 3;
      y += (dy / len) * 3;
    }
  }
  for (const zone of run.imuZones) {
    let zx = zone.position.x,
      zy = zone.position.y;
    if (zone.end) {
      const vx = zone.end.x - zx,
        vy = zone.end.y - zy,
        t = Math.max(
          0,
          Math.min(
            1,
            ((player.x - zx) * vx + (player.y - zy) * vy) /
              (vx * vx + vy * vy || 1),
          ),
        );
      zx += vx * t;
      zy += vy * t;
    }
    const dx = player.x - zx,
      dy = player.y - zy,
      len = Math.hypot(dx, dy) || 1;
    if (len < zone.radius + 45 && len > (zone.innerRadius ?? 0) - 35) {
      const sign =
        zone.innerRadius && len < (zone.radius + zone.innerRadius) / 2 ? -1 : 1;
      x += (dx / len) * sign * 4;
      y += (dy / len) * sign * 4;
    }
  }
  if (run.arena) {
    const len = Math.hypot(x, y) || 1;
    const heading = arenaHeading(
      run.arena,
      player,
      { x: player.x + (x / len) * 100, y: player.y + (y / len) * 100 },
      run.player.radius,
    );
    x = heading.x;
    y = heading.y;
  }
  if (!run.arena) {
    const len = Math.hypot(x, y) || 1;
    const safe = steerAround(
      player,
      { x: player.x + (x / len) * 100, y: player.y + (y / len) * 100 },
      run.player.radius,
      terrainTime(run.elapsed, run.mission),
    );
    x = safe.x;
    y = safe.y;
  }
  return {
    x,
    y,
    dash:
      close >= 2 ||
      run.hazards.some(
        (h) =>
          Math.hypot(h.position.x - player.x, h.position.y - player.y) < 65,
      ),
  };
}
export function select(run: Run): void {
  const order: UpgradeId[] = [
    "power",
    "multishot",
    "tempo",
    "weapon:pistol",
    "weapon:gatling",
    "weapon:whip",
    "weapon:bazooka",
    "vitality",
    "magnet",
    "stride",
  ];
  const id =
    run.player.health.current < 80 && run.choices.includes("vitality")
      ? "vitality"
      : (order.find((item) => run.choices.includes(item)) ?? run.choices[0]);
  if (!id || !chooseUpgrade(run, id)) throw new Error("Mejora inválida");
  if (!run.linkedWeapons.length && run.weapons.some((w) => w.id === "gatling"))
    selectTechnique(run, "gatling");
}
