import { arenaHeading, moveInArena } from "./arena-terrain";
import type { Enemy, Run } from "./types";
import { bossMoves } from "../data/boss-moves";
import { bosses } from "../data/rifts";
import { distanceSquared, notify } from "./rules";
import { hurtPlayer } from "./rifts";
/** Ataques originales de fan: cada tercio cambia el repertorio, nunca vuelve invulnerable a Imu. */
export function updateImu(run: Run, enemy: Enemy, dt: number): void {
  const s = enemy.boss;
  if (!s) return;
  const phase =
    enemy.health.current > (enemy.health.maximum * 2) / 3
      ? 1
      : enemy.health.current > enemy.health.maximum / 3
        ? 2
        : 3;
  if (s.imuPhase !== phase) {
    s.imuPhase = phase;
    notify(
      run,
      `IMU · FASE ${phase}/3 · ${["", "Lanzas del vacío", "Eclipse", "Sentencia del trono"][phase]}`,
    );
  }
  s.time -= dt;
  s.moving = false;
  if (s.phase === "approach") {
    const dx = run.player.position.x - enemy.position.x,
      dy = run.player.position.y - enemy.position.y,
      len = Math.hypot(dx, dy) || 1;
    if (len > 170) {
      if (run.arena) {
        const heading = arenaHeading(
          run.arena,
          enemy.position,
          run.player.position,
          enemy.radius,
        );
        moveInArena(
          run.arena,
          enemy.position,
          {
            x: heading.x * bosses.imu.speed * dt,
            y: heading.y * bosses.imu.speed * dt,
          },
          enemy.radius,
        );
      }
      s.moving = true;
      s.walkTime += dt;
    }
    if (s.time <= 0) {
      s.move =
        phase === 1
          ? "shadowFan"
          : phase === 2
            ? s.cycle % 2
              ? "shadowFan"
              : "eclipse"
            : s.cycle % 3 === 0
              ? "throneRay"
              : s.cycle % 3 === 1
                ? "eclipse"
                : "shadowFan";
      s.phase = "windup";
      s.time = bossMoves[s.move].windup;
      s.target = { ...run.player.position };
      s.direction = { x: dx / len, y: dy / len };
      if (s.move === "eclipse") {
        run.imuZones.push({
          position: { ...s.target },
          radius: 70,
          warning: s.time,
          life: 0.45,
          damage: 68,
        });
        if (phase === 3)
          for (const sign of [-1, 1])
            run.imuZones.push({
              position: { x: s.target.x + sign * 140, y: s.target.y + 70 },
              radius: 60,
              warning: s.time,
              life: 0.45,
              damage: 68,
            });
      } else if (s.move === "throneRay") {
        for (const offset of [-0.5, 0, 0.5]) {
          const a = Math.atan2(s.direction.y, s.direction.x) + offset;
          run.imuZones.push({
            position: { ...enemy.position },
            end: {
              x: enemy.position.x + Math.cos(a) * 600,
              y: enemy.position.y + Math.sin(a) * 600,
            },
            radius: 16,
            warning: s.time,
            life: 0.6,
            damage: 84,
          });
        }
      }
    }
  } else if (s.phase === "windup" && s.time <= 0) {
    s.phase = "attack";
    s.time = bossMoves[s.move].active;
    if (s.move === "shadowFan") {
      const count = phase === 1 ? 5 : phase === 2 ? 7 : 9,
        angle = Math.atan2(s.direction.y, s.direction.x);
      for (let i = 0; i < count; i++) {
        const a = angle + (i - (count - 1) / 2) * 0.23;
        run.hazards.push({
          id: run.nextId++,
          position: { ...enemy.position },
          velocity: { x: Math.cos(a) * 225, y: Math.sin(a) * 225 },
          radius: 9,
          damage: bosses.imu.damage,
          life: 3,
          kind: "void",
        });
      }
    }
  } else if (s.phase === "attack" && s.time <= 0) {
    s.phase = "recover";
    s.time = bossMoves[s.move].recovery;
  } else if (s.phase === "recover" && s.time <= 0) {
    s.phase = "approach";
    s.time = 0.7;
    s.cycle++;
  }
  if (
    distanceSquared(enemy.position, run.player.position) <
    (enemy.radius + run.player.radius) ** 2
  )
    hurtPlayer(run, bosses.imu.damage);
}
export { updateDangerZones as updateImuZones } from "./danger-zones";
