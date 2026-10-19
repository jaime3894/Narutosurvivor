import type { Position, Velocity, Health } from "../core/entity";
import type { EnemyKind, UpgradeId } from "../data/combat";
export type RunStatus = "playing" | "paused" | "upgrade" | "won" | "lost";
export interface Player {
  position: Position;
  velocity: Velocity;
  health: Health;
  radius: number;
  facing: Position;
  invulnerable: number;
  dashTime: number;
  dashCooldown: number;
}
export interface Enemy {
  id: number;
  position: Position;
  velocity: Velocity;
  health: Health;
  kind: EnemyKind;
  radius: number;
  flash: number;
}
export interface Projectile {
  id: number;
  position: Position;
  velocity: Velocity;
  damage: number;
  life: number;
}
export interface Drop {
  position: Position;
  value: number;
  kind: "xp" | "heal";
  attracted: boolean;
}
export interface Effect {
  position: Position;
  kind: "hit" | "kill" | "hurt" | "dash" | "pickup";
  life: number;
  total: number;
  value: number;
}
export interface Input {
  x: number;
  y: number;
  dash: boolean;
}
export interface Run {
  status: RunStatus;
  elapsed: number;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  drops: Drop[];
  effects: Effect[];
  level: number;
  xp: number;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  distance: number;
  choices: UpgradeId[];
  ranks: Record<UpgradeId, number>;
  attackTimer: number;
  spawnTimer: number;
  nextId: number;
  random: () => number;
}
