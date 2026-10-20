import { it, expect } from "vitest";
import { allBosses } from "../src/data/rifts";
import { bossArenas, arenaBounds } from "../src/data/arenas";
import { createRun } from "../src/game/simulation";
import {
  spawnRift,
  enterRift,
  finishArena,
  updateRifts,
} from "../src/game/rifts";
import {
  arenaProps,
  arenaBlocked,
  moveInArena,
} from "../src/game/arena-terrain";
it.each(allBosses)(
  "%s tiene recinto específico, entrada libre y obstáculos sólidos al embestir",
  (id) => {
    const run = createRun(42),
      returnPosition = { ...run.player.position };
    spawnRift(run, id);
    enterRift(run);
    const room = run.arena!;
    expect(room.boss).toBe(id);
    expect(bossArenas[id].name.length).toBeGreaterThan(5);
    expect(arenaProps(room)).toHaveLength(4);
    expect(arenaBlocked(room, run.player.position, run.player.radius)).toBe(
      false,
    );
    expect(
      arenaBlocked(room, run.enemies[0]!.position, run.enemies[0]!.radius),
    ).toBe(false);
    for (const p of arenaProps(room)) {
      const center = {
        x: p.footprint.reduce((v, p) => v + p.x, 0) / p.footprint.length,
        y: p.footprint.reduce((v, p) => v + p.y, 0) / p.footprint.length,
      };
      expect(arenaBlocked(room, center, 12)).toBe(true);
      const position = { x: center.x - 130, y: center.y };
      let deflected = false;
      for (let i = 0; i < 52; i++) {
        const before = { ...position };
        moveInArena(room, position, { x: 5, y: 0 }, 12);
        expect(arenaBlocked(room, position, 12)).toBe(false);
        if (
          position.x - before.x < 4.9 ||
          Math.abs(position.y - before.y) > 0.1
        )
          deflected = true;
      }
      expect(deflected).toBe(true);
    }
    const position = { ...room.center };
    moveInArena(room, position, { x: 2000, y: 2000 }, 12);
    expect(Math.abs(position.x - room.center.x)).toBeLessThanOrEqual(
      arenaBounds.halfWidth - 12,
    );
    expect(Math.abs(position.y - room.center.y)).toBeLessThanOrEqual(
      arenaBounds.halfHeight - 12,
    );
    finishArena(run, false);
    expect(run.player.position).toEqual(returnPosition);
  },
);
it("una columna bloquea proyectiles del jefe antes de tocar al jugador", () => {
  const r = createRun(42);
  spawnRift(r, "lucci");
  enterRift(r);
  const p = arenaProps(r.arena!)[0]!,
    center = {
      x: p.footprint.reduce((s, v) => s + v.x, 0) / p.footprint.length,
      y: p.footprint.reduce((s, v) => s + v.y, 0) / p.footprint.length,
    };
  r.player.position = { x: center.x + 100, y: center.y };
  r.player.invulnerable = 0;
  const hp = r.player.health.current;
  r.hazards = [
    {
      id: 99,
      position: { x: center.x - 100, y: center.y },
      velocity: { x: 300, y: 0 },
      radius: 8,
      damage: 40,
      life: 2,
      kind: "claw",
    },
  ];
  for (let i = 0; i < 50; i++) updateRifts(r, 1 / 60);
  expect(r.hazards).toHaveLength(0);
  expect(r.player.health.current).toBe(hp);
});
