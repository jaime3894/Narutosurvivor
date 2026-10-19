import { describe, expect, it } from "vitest";
import { createRun } from "../src/game/simulation";
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
      at: 0,
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
      ).toBeLessThanOrEqual(1);
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
