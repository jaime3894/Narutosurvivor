export interface Position {
  x: number;
  y: number;
}
export interface Velocity {
  x: number;
  y: number;
}
export interface Health {
  current: number;
  maximum: number;
}
/** Componentes independientes: sin jerarquías de personajes. */
export interface Entity {
  readonly id: number;
  position: Position;
  velocity?: Velocity;
  health?: Health;
}
export function integrate(entity: Entity, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError("Tiempo inválido");
  if (!entity.velocity) return;
  entity.position.x += entity.velocity.x * seconds;
  entity.position.y += entity.velocity.y * seconds;
}
