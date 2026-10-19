import type { Position } from "../core/entity";
import type { FormTier } from "./crew";
import type { Direction } from "../render/sprites";

type Elbows = Readonly<Record<Direction, readonly [Position, Position]>>;
/** Codos medidos en los cuerpos sin antebrazos: reserva detrás, brazo lanzador delante. */
export const frankyElbows: Readonly<Record<FormTier, Elbows>> = {
  0: {
    down: [
      { x: 23, y: -34 },
      { x: -23, y: -34 },
    ],
    left: [
      { x: -4, y: -35 },
      { x: 12, y: -35 },
    ],
    right: [
      { x: 4, y: -35 },
      { x: -12, y: -35 },
    ],
    up: [
      { x: -24, y: -34 },
      { x: 24, y: -34 },
    ],
  },
  1: {
    down: [
      { x: 30, y: -32 },
      { x: -30, y: -32 },
    ],
    left: [
      { x: -9, y: -34 },
      { x: 20, y: -33 },
    ],
    right: [
      { x: 9, y: -34 },
      { x: -20, y: -33 },
    ],
    up: [
      { x: -32, y: -33 },
      { x: 32, y: -33 },
    ],
  },
  2: {
    down: [
      { x: 32, y: -33 },
      { x: -32, y: -33 },
    ],
    left: [
      { x: -22, y: -35 },
      { x: 21, y: -35 },
    ],
    right: [
      { x: 22, y: -35 },
      { x: -21, y: -35 },
    ],
    up: [
      { x: -36, y: -33 },
      { x: 36, y: -33 },
    ],
  },
};
export const luffyKickHips: Readonly<Record<Direction, Position>> = {
  down: { x: -9, y: -29 },
  left: { x: -9, y: -25 },
  right: { x: -10, y: -25 },
  up: { x: -9, y: -26 },
};
