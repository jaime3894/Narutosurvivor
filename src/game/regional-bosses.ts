import { arenaHeading, moveInArena } from "./arena-terrain";
import { regionalMoves, type RegionalMoveId } from "../data/regional-bosses";
import { bossRepertoire } from "../data/boss-moves";
import { bosses } from "../data/rifts";
import { distanceSquared } from "./rules";
import { hurtPlayer } from "./rifts";
import type { Enemy, Run } from "./types";
/** Los avisos y el daño comparten las mismas zonas persistentes; la puntería queda fijada al preparar. */
export function updateRegionalBoss(run: Run, enemy: Enemy, dt: number): void {
  const s = enemy.boss;
  if (!s || !(s.move in regionalMoves)) return;
  const move = regionalMoves[s.move as RegionalMoveId],
    furious = enemy.health.current < enemy.health.maximum * 0.5;
  s.time -= dt;
  s.moving = false;
  s.guard = move.behavior === "guard" && s.phase === "windup";
  if (s.phase === "approach") {
    const dx = run.player.position.x - enemy.position.x,
      dy = run.player.position.y - enemy.position.y,
      d = Math.hypot(dx, dy) || 1;
    const wanted =
      move.behavior === "fan" || move.behavior === "zones" ? 170 : 110;
    if (d > wanted) {
      const speed =
        bosses[s.kind].speed *
        (furious ? 1.1 : 1) *
        ((enemy.slow ?? 0) > 0 ? 0.7 : 1);
      const heading = run.arena
        ? arenaHeading(
            run.arena,
            enemy.position,
            run.player.position,
            enemy.radius,
          )
        : { x: dx / d, y: dy / d };
      if (run.arena)
        moveInArena(
          run.arena,
          enemy.position,
          { x: heading.x * speed * dt, y: heading.y * speed * dt },
          enemy.radius,
        );
      s.moving = true;
      s.walkTime += dt;
    }
    if (s.time <= 0) {
      s.phase = "windup";
      s.time = move.windup;
      s.target = { ...run.player.position };
      s.direction = { x: dx / d, y: dy / d };
      s.guard = move.behavior === "guard";
      const damage = bosses[s.kind].damage * move.damage;
      if (move.behavior === "zones") {
        for (let i = 0; i < move.count; i++) {
          const a = (i * Math.PI * 2) / Math.max(1, move.count - 1);
          run.imuZones.push({
            position:
              i === 0
                ? { ...s.target }
                : {
                    x: s.target.x + Math.cos(a) * 135,
                    y: s.target.y + Math.sin(a) * 135,
                  },
            radius: move.radius,
            warning: move.windup,
            life: 0.4,
            damage,
            element: move.element,
          });
        }
      } else if (move.behavior === "beam" || move.behavior === "rush") {
        run.imuZones.push({
          position: { ...enemy.position },
          end: {
            x: enemy.position.x + s.direction.x * move.range,
            y: enemy.position.y + s.direction.y * move.range,
          },
          radius: move.behavior === "rush" ? enemy.radius : move.radius,
          warning: move.windup,
          life: move.active,
          damage: move.behavior === "rush" ? 0 : damage,
          element: move.element,
        });
      } else if (move.behavior === "ring" || move.behavior === "guard")
        run.imuZones.push({
          position: { ...enemy.position },
          radius: move.range,
          ...(move.behavior === "ring" ? { innerRadius: move.radius } : {}),
          warning: move.windup,
          life: 0.4,
          damage,
          element: move.element,
        });
    }
  } else if (s.phase === "windup" && s.time <= 0) {
    s.phase = "attack";
    s.time = move.active;
    s.guard = false;
    if (move.behavior === "fan") {
      const angle = Math.atan2(s.direction.y, s.direction.x),
        count = move.count + (furious ? 2 : 0);
      for (let i = 0; i < count && run.hazards.length < 80; i++) {
        const a = angle + (i - (count - 1) / 2) * move.spread;
        run.hazards.push({
          id: run.nextId++,
          position: { ...enemy.position },
          velocity: { x: Math.cos(a) * 285, y: Math.sin(a) * 285 },
          radius: move.radius,
          damage: bosses[s.kind].damage * move.damage,
          life: 3,
          kind: move.element,
        });
      }
    }
  } else if (s.phase === "attack") {
    if (move.behavior === "rush") {
      if (run.arena)
        moveInArena(
          run.arena,
          enemy.position,
          {
            x: ((s.direction.x * move.range) / move.active) * dt,
            y: ((s.direction.y * move.range) / move.active) * dt,
          },
          enemy.radius,
        );
    }
    if (s.time <= 0) {
      s.phase = "recover";
      s.time = move.recovery * (furious ? 0.65 : 0.85);
    }
  } else if (s.phase === "recover" && s.time <= 0) {
    s.cycle++;
    const repertoire = bossRepertoire[s.kind];
    s.move = repertoire[s.cycle % repertoire.length] ?? repertoire[0];
    s.phase = "approach";
    s.time = 0.3;
  }
  if (
    distanceSquared(enemy.position, run.player.position) <
    (enemy.radius + run.player.radius) ** 2
  )
    hurtPlayer(run, bosses[s.kind].damage * (s.phase === "attack" ? 1.2 : 1));
}
