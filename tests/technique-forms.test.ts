import { describe, expect, it } from "vitest";
import { weapons, weaponKey } from "../src/data/content";
import { characters } from "../src/data/crew";
import { formMilestones } from "../src/data/form-progression";
import {
  techniqueDefinition,
  techniqueStyles,
} from "../src/data/technique-forms";
import { syncForms } from "../src/game/forms";
import { createRun } from "../src/game/simulation";
import { updateTechniques } from "../src/game/techniques";
import { frankyArms } from "../src/render/franky-rig";

describe("técnicas propias de cada transformación", () => {
  it.each(weapons)(
    "$id cambia ritmo y cobertura conservando dueño y ranura",
    (weapon) => {
      const definitions = ([0, 1, 2] as const).map((tier) =>
        techniqueDefinition(weapon.id, tier),
      );
      expect(new Set(definitions.map((d) => d.title)).size).toBe(3);
      expect(
        new Set(
          definitions.map(
            (d) =>
              `${d.windup}:${d.active}:${d.recovery}:${d.width}:${d.strikes}`,
          ),
        ).size,
      ).toBe(3);
      for (const tier of [0, 1, 2] as const) {
        const d = definitions[tier]!;
        expect(d.owner).toBe(weapon.owner);
        expect(d.id).toBe(weapon.id);
        const run = createRun(11, weapon.owner);
        run.form = tier;
        run.weapons = [{ id: weapon.id, timer: 0, evolved: false }];
        run.activeWeapon = weapon.id;
        run.enemies.push({
          id: 999,
          kind: "brute",
          position: { x: 1240, y: 900 },
          velocity: { x: 0, y: 0 },
          health: { current: 1e6, maximum: 1e6 },
          radius: 19,
          flash: 0,
        });
        updateTechniques(run, 1 / 60);
        const a = run.attacks[0]!;
        expect(a).toBeDefined();
        expect(a.form).toBe(tier);
        expect(a.windup).toBeCloseTo(d.windup);
        expect(a.active).toBeCloseTo(d.active);
        expect(a.strikes.length).toBeGreaterThanOrEqual(d.strikes);
        expect(
          a.strikes.every(
            (event) => event.at >= a.windup && event.at < a.windup + a.active,
          ),
        ).toBe(true);
      }
      expect(techniqueStyles[weapon.id][1].detail).not.toEqual(
        techniqueStyles[weapon.id][0].detail,
      );
    },
  );
  it.each(characters)(
    "$id exige dominio 5/5, activa técnicas nuevas y no regala salud",
    (character) => {
      const run = createRun(1, character.id),
        rule = formMilestones[character.id];
      run.player.health.current = 41;
      run.ranks[weaponKey(rule.first)] = 4;
      syncForms(run);
      expect(run.form).toBe(0);
      run.ranks[weaponKey(rule.first)] = 5;
      syncForms(run);
      expect(run.form).toBe(1);
      expect(techniqueDefinition(rule.first, run.form).title).not.toEqual(
        techniqueDefinition(rule.first, 0).title,
      );
      if (rule.second) run.ranks[weaponKey(rule.second)] = 5;
      else run.weapons[0]!.evolved = true;
      syncForms(run);
      expect(run.form).toBe(2);
      expect(run.player.health.current).toBe(41);
      expect(run.energy).toBe(100);
    },
  );
  it("General Cannon mantiene los dos brazos cerca del cuerpo mientras dispara", () => {
    const run = createRun(1, "franky");
    run.form = 2;
    run.enemies.push({
      id: 999,
      kind: "brute",
      position: { x: 1360, y: 900 },
      velocity: { x: 0, y: 0 },
      health: { current: 1000, maximum: 1000 },
      radius: 19,
      flash: 0,
    });
    updateTechniques(run, 1 / 60);
    const a = run.attacks[0]!;
    a.age = a.strikes[0]!.at;
    const arms = frankyArms(run.player.position, a, "right");
    expect(arms).toHaveLength(2);
    for (const arm of arms)
      expect(
        Math.hypot(
          arm.fist.x - run.player.position.x,
          arm.fist.y - run.player.position.y,
        ),
      ).toBeLessThan(60);
  });
});
