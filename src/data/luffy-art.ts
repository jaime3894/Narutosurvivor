import type { Position } from "../core/entity";
import type { FormTier } from "./crew";
type Views = "down" | "left" | "right" | "up";
/** Anclas medidas sobre las capas corporales, relativas al centro de los pies. */
export const luffyShoulders: Readonly<
  Record<FormTier, Readonly<Record<Views, readonly [Position, Position]>>>
> = {
  0: {
    down: [
      { x: -8, y: -47 },
      { x: 11, y: -47 },
    ],
    left: [
      { x: 10, y: -41 },
      { x: 3, y: -43 },
    ],
    right: [
      { x: -3, y: -43 },
      { x: -6, y: -41 },
    ],
    up: [
      { x: -10, y: -43 },
      { x: 10, y: -43 },
    ],
  },
  1: {
    down: [
      { x: -12, y: -43 },
      { x: 16, y: -43 },
    ],
    left: [
      { x: 4, y: -44 },
      { x: 9, y: -45 },
    ],
    right: [
      { x: -9, y: -45 },
      { x: -3, y: -44 },
    ],
    up: [
      { x: -14, y: -45 },
      { x: 14, y: -45 },
    ],
  },
  2: {
    down: [
      { x: -22, y: -51 },
      { x: 22, y: -50 },
    ],
    left: [
      { x: 5, y: -46 },
      { x: 10, y: -48 },
    ],
    right: [
      { x: -11, y: -46 },
      { x: -6, y: -44 },
    ],
    up: [
      { x: -22, y: -49 },
      { x: 22, y: -49 },
    ],
  },
};
