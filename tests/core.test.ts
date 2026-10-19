import { describe, expect, it } from "vitest";
import { createRandom } from "../src/core/random";
import { integrate, type Entity } from "../src/core/entity";
describe("simulación base", () => {
  it("reproduce un escenario con la misma semilla", () => {
    const a = createRandom(3894),
      b = createRandom(3894);
    const values = Array.from({ length: 1000 }, () => a());
    expect(values).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBe(1000);
  });
  it("integra componentes de movimiento sin depender de la tasa de fotogramas", () => {
    const a: Entity = {
      id: 1,
      position: { x: 0, y: 0 },
      velocity: { x: 120, y: -60 },
    };
    const b: Entity = structuredClone(a);
    integrate(a, 1);
    for (let i = 0; i < 60; i++) integrate(b, 1 / 60);
    expect(b.position.x).toBeCloseTo(a.position.x);
    expect(b.position.y).toBeCloseTo(a.position.y);
  });
  it("admite entidades inmóviles y rechaza tiempos inválidos", () => {
    const entity: Entity = { id: 2, position: { x: 4, y: 8 } };
    integrate(entity, 1);
    expect(entity.position).toEqual({ x: 4, y: 8 });
    for (const time of [-1, NaN, Infinity])
      expect(() => integrate(entity, time)).toThrow(RangeError);
  });
});
