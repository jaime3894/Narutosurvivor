import { worldProps } from "../src/data/terrain";
import { describe, it, expect } from "vitest";
import {
  islandAt,
  islandIds,
  newIslandIds,
  survivalRoute,
  islands,
} from "../src/data/islands";
import { missions, terrainTime } from "../src/data/missions";
import { voyageStage } from "../src/data/voyage";
import {
  regionalMoves,
  regionalRepertoires,
} from "../src/data/regional-bosses";
import { createRun } from "../src/game/simulation";
import { spawnRift, enterRift, updateBoss } from "../src/game/rifts";
import { updateDangerZones } from "../src/game/danger-zones";
import { hitEnemy } from "../src/game/rules";
const run = () => createRun(42);
describe("Grand Line", () => {
  it("usa quince ambientes de una misma isla hasta Imu, conservando el banco de pruebas", () => {
    expect(islandIds).toHaveLength(8);
    for (const [i, id] of survivalRoute.entries())
      expect(islandAt(i * 240).id).toBe(id);
    expect(survivalRoute).toHaveLength(15);
    expect(islandAt(2160).id).toBe("skypiea");
    expect(islandAt(3600).id).toBe(survivalRoute.at(-1));
    for (const id of newIslandIds) {
      expect(missions[id].encounters.map((e) => e.boss)).toEqual([
        islands[id].miniboss,
        islands[id].boss,
      ]);
      expect(voyageStage(9999, id).id).toBe(voyageStage(0, id).id);
      expect(terrainTime(9999, id)).toBe(islands[id].terrain);
      const props = worldProps(islands[id].terrain),
        stage = voyageStage(0, id);
      expect(props.length).toBeGreaterThan(500);
      expect(props.every((p) => stage.props.includes(p.id))).toBe(true);
    }
  });
  it.each(Object.entries(regionalRepertoires))(
    "%s anuncia tres patrones con objetivo fijado",
    (id, moves) => {
      const r = run();
      spawnRift(r);
      r.rift!.boss = id as keyof typeof regionalRepertoires;
      enterRift(r);
      const e = r.enemies[0]!;
      for (const m of moves) {
        r.imuZones = [];
        r.hazards = [];
        e.boss!.move = m;
        e.boss!.phase = "approach";
        e.boss!.time = 0;
        updateBoss(r, e, 0.01);
        const def = regionalMoves[m];
        expect(e.boss!.phase).toBe("windup");
        expect(r.hazards).toHaveLength(0);
        const target = { ...e.boss!.target };
        r.player.position.x += 80;
        updateBoss(r, e, def.windup + 0.01);
        expect(e.boss!.target).toEqual(target);
        if (def.behavior === "fan") {
          expect(r.hazards).toHaveLength(def.count);
          expect(r.hazards.every((h) => h.kind === def.element)).toBe(true);
        } else {
          expect(r.imuZones.length).toBeGreaterThan(0);
          expect(
            r.imuZones.every((z) => z.element === def.element && z.warning > 0),
          ).toBe(true);
        }
      }
    },
  );
  it("un anillo respeta su hueco, el aviso y el borde; un corredor acierta a lo largo de su segmento", () => {
    const r = run(),
      p = r.player.position,
      health = r.player.health.current;
    r.imuZones = [
      {
        position: { ...p },
        radius: 120,
        innerRadius: 60,
        warning: 1,
        life: 0.4,
        damage: 20,
      },
    ];
    updateDangerZones(r, 0.1);
    expect(r.player.health.current).toBe(health);
    r.imuZones[0]!.warning = 0;
    updateDangerZones(r, 0.01);
    expect(r.player.health.current).toBe(health);
    r.player.position.x += 90;
    updateDangerZones(r, 0.01);
    expect(r.player.health.current).toBeLessThan(health);
    const second = run(),
      q = second.player.position;
    second.imuZones = [
      {
        position: { x: q.x - 100, y: q.y },
        end: { x: q.x + 100, y: q.y },
        radius: 15,
        warning: 0,
        life: 0.4,
        damage: 20,
      },
    ];
    updateDangerZones(second, 0.01);
    expect(second.player.health.current).toBeLessThan(health);
  });
  it("Tekkai reduce daño durante la guardia y se abre al atacar", () => {
    const r = run();
    spawnRift(r);
    r.rift!.boss = "blueno";
    enterRift(r);
    const e = r.enemies[0]!;
    e.boss!.move = "tekkai";
    e.boss!.phase = "approach";
    e.boss!.time = 0;
    updateBoss(r, e, 0.01);
    expect(e.boss!.guard).toBe(true);
    const hp = e.health.current;
    hitEnemy(r, e, 100, { x: 0, y: 0 }, false);
    const guarded = hp - e.health.current;
    updateBoss(r, e, 2);
    expect(e.boss!.guard).toBe(false);
    const hp2 = e.health.current;
    hitEnemy(r, e, 100, { x: 0, y: 0 }, false);
    expect(hp2 - e.health.current).toBeGreaterThan(guarded);
  });
});
