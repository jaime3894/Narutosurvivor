import { describe, expect, it } from "vitest";
import { createRun, step } from "../src/game/simulation";
import { weaponById, type WeaponId } from "../src/data/content";
import { makeLuffyPose, selectLuffyPunch } from "../src/render/luffy-pose";
import type { Attack, Run } from "../src/game/types";
function punch(run: Run, weapon: WeaponId = "pistol", age = 0.2): Attack {
  const definition = weaponById(weapon);
  return {
    id: run.nextId++,
    caster: "luffy",
    form: run.form,
    weapon,
    age,
    windup: definition.windup,
    active: definition.active,
    recovery: definition.recovery,
    direction: { x: 1, y: 0 },
    distance: 150,
    range: definition.range,
    target: { x: 1350, y: 900 },
    strikes: Array.from({ length: definition.strikes }, (_, index) => ({
      index,
      at:
        definition.windup +
        Math.min(definition.active * 0.25, 0.04) +
        (definition.strikes > 1
          ? (index / definition.strikes) * definition.active * 0.7
          : 0),
      fired: false,
    })),
    hitIds: [],
    evolved: false,
    damage: definition.damage,
    width: definition.width,
  };
}
describe("anatomía y continuidad de Luffy", () => {
  it("Pistol estira un brazo y conserva el otro en guardia, sin crear un tercer puño", () => {
    const run = createRun(1);
    const pose = makeLuffyPose(run, punch(run), "right");
    expect(pose.arms).toHaveLength(2);
    expect(pose.arms.filter((arm) => arm.extended)).toHaveLength(1);
    expect(pose.arms.find((arm) => arm.extended)!.fist.x).toBeCloseTo(1350);
  });
  it("Bazooka utiliza los dos brazos existentes", () => {
    const run = createRun(1);
    const pose = makeLuffyPose(run, punch(run, "bazooka"), "right");
    expect(pose.arms).toHaveLength(2);
    expect(pose.arms.every((arm) => arm.extended && arm.open)).toBe(true);
  });
  it("Gatling alterna y retrae los dos brazos sin acumular manos de ráfaga", () => {
    const run = createRun(1),
      attack = punch(run, "gatling");
    const extended = new Set<number>();
    for (let frame = 0; frame < 60; frame++) {
      attack.age = attack.windup + (attack.active * frame) / 60;
      const pose = makeLuffyPose(run, attack, "down");
      expect(pose.arms).toHaveLength(2);
      expect(
        pose.arms.filter((arm) => arm.extended).length,
      ).toBeLessThanOrEqual(2);
      for (const arm of pose.arms) if (arm.extended) extended.add(arm.side);
    }
    expect(extended.size).toBe(2);
  });
  it("preparación, extensión y recuperación no teletransportan el puño en sus límites", () => {
    const run = createRun(1),
      attack = punch(run);
    for (const boundary of [attack.windup, attack.windup + attack.active]) {
      attack.age = boundary - 0.000001;
      const before = makeLuffyPose(run, attack, "right");
      attack.age = boundary + 0.000001;
      const after = makeLuffyPose(run, attack, "right");
      for (let arm = 0; arm < 2; arm++)
        expect(
          Math.hypot(
            before.arms[arm]!.fist.x - after.arms[arm]!.fist.x,
            before.arms[arm]!.fist.y - after.arms[arm]!.fist.y,
          ),
        ).toBeLessThan(0.1);
    }
  });
  it("la recuperación devuelve el puño cerca del hombro antes de terminar", () => {
    const run = createRun(1),
      attack = punch(run);
    attack.age = attack.windup + attack.active + attack.recovery - 0.00001;
    const pose = makeLuffyPose(run, attack, "right");
    for (const arm of pose.arms)
      expect(
        Math.hypot(arm.fist.x - arm.shoulder.x, arm.fist.y - arm.shoulder.y),
      ).toBeLessThan(20);
  });
  it("varias técnicas simultáneas comparten un solo controlador de dos brazos", () => {
    const run = createRun(1),
      preparing = punch(run, "bazooka", 0.01),
      active = punch(run, "pistol", 0.2);
    run.attacks = [preparing, active, punch(run, "gatling", 0.01)];
    expect(selectLuffyPunch(run)?.id).toBe(active.id);
    expect(
      makeLuffyPose(run, selectLuffyPunch(run)!, "down").arms,
    ).toHaveLength(2);
  });
  it("Fusen evita superponer brazos de otras técnicas a su cuerpo inflado", () => {
    const run = createRun(1);
    run.attacks = [punch(run), punch(run, "balloon")];
    expect(selectLuffyPunch(run)).toBeUndefined();
  });
  it("funciona desde la posición del nakama Luffy sin mover el origen al capitán", () => {
    const run = createRun(1, "zoro", ["luffy"]);
    const pose = makeLuffyPose(run, punch(run), "down");
    expect(pose.root.x).toBeCloseTo(run.nakama[0]!.position.x + 1.5);
    expect(pose.root.x).not.toBeCloseTo(run.player.position.x + 1.5);
  });
});

describe("el gesto coincide con los impactos reales", () => {
  it("cada golpe de Gatling alcanza su objetivo en el evento de daño del motor", () => {
    const run = createRun(1);
    run.weapons = [{ id: "gatling", timer: 0, evolved: false }];
    run.ranks["weapon:gatling"] = 1;
    run.enemies.push({
      id: run.nextId++,
      kind: "brute",
      position: { x: 1320, y: 900 },
      velocity: { x: 0, y: 0 },
      health: { current: 10000, maximum: 10000 },
      radius: 19,
      flash: 0,
    });
    step(run, { x: 0, y: 0, dash: false }, 1 / 60);
    const attack = run.attacks.find((item) => item.weapon === "gatling");
    expect(attack).toBeDefined();
    if (!attack) throw new Error("Gatling no arrancó");
    for (const strike of attack.strikes) {
      attack.age = strike.at;
      const pose = makeLuffyPose(run, attack, "right");
      const arm = pose.arms[strike.index % 2 === 0 ? 1 : 0];
      expect(arm.fist.x).toBeCloseTo(run.player.position.x + attack.distance);
      expect(arm.fist.y).toBeCloseTo(run.player.position.y - 45);
    }
  });
  it("la recuperación dobla el brazo y llega a la guardia con velocidad suave", () => {
    const run = createRun(1),
      attack = punch(run);
    attack.age = attack.windup + attack.active + attack.recovery * 0.5;
    const arm = makeLuffyPose(run, attack, "right").arms[1];
    const mid = {
      x: (arm.shoulder.x + arm.fist.x) / 2,
      y: (arm.shoulder.y + arm.fist.y) / 2,
    };
    expect(
      Math.hypot(arm.elbow.x - mid.x, arm.elbow.y - mid.y),
    ).toBeGreaterThan(5);
    attack.age = attack.windup + attack.active + attack.recovery * 0.99;
    expect(
      Math.hypot(
        makeLuffyPose(run, attack, "right").arms[1].fist.x - arm.shoulder.x,
        makeLuffyPose(run, attack, "right").arms[1].fist.y - arm.shoulder.y,
      ),
    ).toBeLessThan(20);
  });
});

it("Kong Gun repliega el brazo entre impactos de la forma final", () => {
  const run = createRun(1);
  run.form = 2;
  const a: Attack = {
    id: 1,
    weapon: "pistol",
    caster: "luffy",
    form: 2,
    age: 0,
    windup: 0.3,
    active: 0.5,
    recovery: 0.3,
    direction: { x: 1, y: 0 },
    distance: 100,
    range: 120,
    target: { x: 1300, y: 900 },
    strikes: [
      { at: 0.34, index: 0, fired: false },
      { at: 0.52, index: 1, fired: false },
      { at: 0.7, index: 2, fired: false },
    ],
    evolved: false,
    damage: 20,
    width: 20,
    hitIds: [],
  };
  a.age = 0.34;
  const contact = makeLuffyPose(run, a, "right").arms[1];
  a.age = 0.46;
  const returnArm = makeLuffyPose(run, a, "right").arms[1];
  const reach = (arm: typeof contact) =>
    Math.hypot(arm.fist.x - arm.shoulder.x, arm.fist.y - arm.shoulder.y);
  expect(reach(contact)).toBeGreaterThan(reach(returnArm) + 30);
  a.age = 0.52;
  expect(reach(makeLuffyPose(run, a, "right").arms[1])).toBeGreaterThan(
    reach(returnArm) + 30,
  );
});
