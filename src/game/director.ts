import { busterRules, missions, terrainTime } from "../data/missions";
import { freePosition } from "./terrain";
import { spawnRift, hurtPlayer } from "./rifts";
import { effect, notify, distanceSquared } from "./rules";
import type { Run } from "./types";
/** Un reloj de costa: pausa, elecciones y arenas congelan los eventos y el bombardeo. */
export function updateDirector(run: Run, dt: number): void {
  if (run.mission === "voyage" || run.arena || run.status !== "playing") return;
  const definition = missions[run.mission],
    state = run.director;
  const next = definition.encounters[state.nextEncounter];
  if (next && run.elapsed >= next.at && !state.buster && !run.rift?.encounter) {
    run.rift = null;
    if (spawnRift(run, next.boss)) {
      run.rift!.encounter = {
        index: state.nextEncounter,
        role: next.role,
        health: next.health,
        seconds: next.seconds,
      };
      run.rift!.remaining = 5;
      notify(
        run,
        `${next.role === "final" ? "JEFE FINAL" : "MINIJEFE"} · ${next.boss === "mr1" ? "Mr.1" : next.boss === "crocodile" ? "Crocodile" : next.boss} · el duelo empieza en 5 s`,
      );
    }
  }
  if (!state.busterStarted && run.elapsed >= definition.busterAt) {
    state.busterStarted = true;
    state.buster = {
      remaining: definition.busterDuration,
      timer: 2,
      shells: [],
    };
    notify(run, "BUSTER CALL · ¡esquiva las zonas de bombardeo!");
  }
  const call = state.buster;
  if (!call) return;
  call.remaining = Math.max(0, call.remaining - dt);
  call.timer -= dt;
  for (const shell of call.shells) {
    shell.remaining -= dt;
    if (shell.remaining <= 0) {
      effect(run, shell.position, "shell");
      if (
        distanceSquared(shell.position, run.player.position) <
        (busterRules.radius + run.player.radius) ** 2
      )
        hurtPlayer(run, busterRules.damage);
    }
  }
  call.shells = call.shells.filter((s) => s.remaining > 0);
  if (call.remaining > 0 && call.timer <= 0) {
    call.timer += busterRules.interval;
    const heading = run.player.facing;
    for (let i = 0; i < 3 && call.shells.length < busterRules.maxShells; i++) {
      const angle = run.random() * Math.PI * 2,
        distance = i === 0 ? 0 : 85 + run.random() * 75;
      const position = freePosition(
        {
          x:
            run.player.position.x + heading.x * 35 + Math.cos(angle) * distance,
          y:
            run.player.position.y + heading.y * 35 + Math.sin(angle) * distance,
        },
        busterRules.radius,
        terrainTime(run.elapsed, run.mission),
      );
      call.shells.push({
        id: run.nextId++,
        position,
        remaining: busterRules.warning,
      });
    }
  }
  if (call.remaining === 0 && !call.shells.length) {
    state.buster = null;
    notify(run, "El Buster Call se retira · sigue avanzando");
  }
}
