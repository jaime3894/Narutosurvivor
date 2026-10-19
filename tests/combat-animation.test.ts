import { describe, expect, it } from "vitest";
import { createRun, step } from "../src/game/simulation";
import { weapons, weaponKey } from "../src/data/content";
import {
  combatPose,
  firstContact,
  selectBodyAttack,
  zoroBladeCount,
} from "../src/render/combat-pose";
import { hitPulse, mechanicalReach } from "../src/render/technique-effects";
import {
  selectLuffyBodyAction,
  selectLuffyPunch,
} from "../src/render/luffy-pose";
import { luffyKickPose } from "../src/render/luffy-kick";
import { animationProgress } from "../src/game/techniques";
import { frankyArms } from "../src/render/franky-rig";
import type { Attack } from "../src/game/types";

function realAttack(index: number): Attack {
  const definition = weapons[index];
  if (!definition) throw new Error("Arma inexistente");
  const run = createRun(1, definition.owner);
  run.weapons = [{ id: definition.id, timer: 0, evolved: false }];
  run.ranks[weaponKey(definition.id)] = 1;
  run.enemies.push({
    id: run.nextId++,
    kind: "brute",
    position: {
      x: run.player.position.x + Math.min(100, definition.range - 10),
      y: run.player.position.y,
    },
    velocity: { x: 0, y: 0 },
    health: { current: 10000, maximum: 10000 },
    radius: 19,
    flash: 0,
  });
  step(run, { x: 0, y: 0, dash: false }, 1 / 60);
  const attack = run.attacks.find((a) => a.weapon === definition.id);
  if (!attack) throw new Error(`Sin ataque: ${definition.id}`);
  return attack;
}

describe("coherencia del gesto y los efectos de las 18 técnicas", () => {
  it.each(weapons.map((w, index) => ({ id: w.id, index })))(
    "$id no anticipa el impacto y termina recuperado",
    ({ index }) => {
      const a = realAttack(index),
        contact = firstContact(a);
      a.age = contact - 0.0001;
      expect(hitPulse(a)).toBe(0);
      a.age = contact;
      expect(hitPulse(a)).toBe(1);
      expect(combatPose(a).frame).toBe(2);
      a.age = a.windup + a.active + a.recovery - 0.0001;
      expect(combatPose(a).frame).toBe(5);
      expect(combatPose(a).advance).toBeLessThan(0.001);
    },
  );
  it("un único gesto corporal gana aunque dos técnicas estén activas", () => {
    const run = createRun(1, "zoro");
    const a = realAttack(weapons.findIndex((w) => w.id === "onigiri"));
    const b = realAttack(weapons.findIndex((w) => w.id === "phoenix"));
    a.id = 1;
    b.id = 2;
    a.age = firstContact(a);
    b.age = 0.01;
    run.attacks = [a, b];
    expect(selectBodyAttack(run, "zoro")).toBe(a);
    b.age = firstContact(b);
    expect(selectBodyAttack(run, "zoro")).toBe(b);
    a.age = a.windup + a.active + a.recovery;
    b.age = b.windup + b.active + b.recovery;
    expect(selectBodyAttack(run, "zoro")).toBeUndefined();
  });
  it("Santoryu y Asura mantienen tres y nueve hojas", () => {
    expect([0, 1, 2].map(zoroBladeCount)).toEqual([3, 3, 9]);
  });
  it("Franky deja el muñón visible antes del contacto y recoge la cadena antes de reponer su puño", () => {
    const a = realAttack(weapons.findIndex((w) => w.id === "strongright"));
    a.age = a.windup;
    expect(combatPose(a).frame).toBe(2);
    expect(mechanicalReach(a)).toBe(0);
    a.age = firstContact(a);
    expect(mechanicalReach(a)).toBe(1);
    a.age = a.windup + a.active;
    expect(mechanicalReach(a)).toBe(0);
    expect(combatPose(a).frame).toBe(4);
  });
  it("Franky conserva dos antebrazos y el puño lanzado alcanza el objetivo en las cuatro vistas", () => {
    const a = realAttack(weapons.findIndex((w) => w.id === "strongright"));
    for (const direction of ["down", "left", "right", "up"] as const) {
      a.direction =
        direction === "left"
          ? { x: -1, y: 0 }
          : direction === "up"
            ? { x: 0, y: -1 }
            : direction === "down"
              ? { x: 0, y: 1 }
              : { x: 1, y: 0 };
      a.age = firstContact(a);
      const arms = frankyArms({ x: 0, y: 0 }, a, direction);
      expect(arms).toHaveLength(2);
      expect(arms.filter((arm) => arm.extended)).toHaveLength(1);
      const fist = arms.find((arm) => arm.extended)!.fist;
      expect(fist.x).toBeCloseTo(a.direction.x * a.distance);
      expect(fist.y).toBeCloseTo(-40 + a.direction.y * a.distance);
      a.age = a.windup + a.active + a.recovery;
      expect(
        frankyArms({ x: 0, y: 0 }, a, direction).every((arm) => !arm.extended),
      ).toBe(true);
    }
  });
  it("Muchi utiliza la misma rotación y longitud que la colisión barrida, sin superponer los puños", () => {
    const run = createRun(1),
      a = realAttack(weapons.findIndex((w) => w.id === "whip"));
    const punch = realAttack(0);
    punch.age = 0.01;
    run.attacks = [punch, a];
    a.age = a.windup + a.active * 0.4;
    expect(selectLuffyBodyAction(run)).toBe(a);
    expect(selectLuffyPunch(run)).toBeUndefined();
    const pose = luffyKickPose({ x: 100, y: 100 }, a, "right");
    expect(pose.angle).toBeCloseTo(
      Math.atan2(a.direction.y, a.direction.x) + 0.4 * Math.PI * 2,
    );
    expect(
      Math.hypot(pose.foot.x - pose.hip.x, pose.foot.y - pose.hip.y),
    ).toBeCloseTo(a.range * animationProgress(a).extension);
  });
});
