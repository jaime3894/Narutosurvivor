import type { FormTier } from "../data/crew";
import type { Position, Velocity, Health } from "../core/entity";
import type { EnemyKind } from "../data/combat";
import type {
  CharacterId,
  PickupKind,
  UpgradeId,
  WeaponId,
} from "../data/content";
export type RunStatus =
  | "playing"
  | "paused"
  | "upgrade"
  | "chest"
  | "won"
  | "lost";
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
  slow?: number;
  burn?: number;
  burnTick?: number;
}
export interface Projectile {
  id: number;
  position: Position;
  velocity: Velocity;
  damage: number;
  life: number;
  weapon: WeaponId;
  caster: CharacterId;
  form: FormTier;
  origin: Position;
  evolved: boolean;
}
export interface Drop {
  position: Position;
  value: number;
  kind: PickupKind;
  attracted: boolean;
}
export interface Effect {
  position: Position;
  kind:
    | "hit"
    | "critical"
    | "kill"
    | "hurt"
    | "dash"
    | "pickup"
    | "level"
    | "evolve"
    | "explosion"
    | "heal";
  life: number;
  total: number;
  value: number;
}
export interface Input {
  x: number;
  y: number;
  dash: boolean;
}
export interface WeaponSlot {
  id: WeaponId;
  timer: number;
  evolved: boolean;
}
export interface Strike {
  at: number;
  fired: boolean;
  index: number;
}
export interface Attack {
  id: number;
  weapon: WeaponId;
  caster: CharacterId;
  form: FormTier;
  age: number;
  windup: number;
  active: number;
  recovery: number;
  direction: Position;
  distance: number;
  range: number;
  target: Position;
  strikes: Strike[];
  hitIds: number[];
  evolved: boolean;
  damage: number;
  width: number;
}
export interface Chest {
  id: number;
  position: Position;
}
export interface ChestReward {
  kind: "evolution" | "upgrade" | "berries";
  title: string;
  detail: string;
  id?: UpgradeId;
}
export interface Nakama {
  character: CharacterId;
  position: Position;
  facing: Position;
  moving: boolean;
  timer: number;
  supportTimer: number;
}
export interface Run {
  status: RunStatus;
  character: CharacterId;
  form: FormTier;
  energy: number;
  formCooldown: number;
  transformTime: number;
  reviveUsed: boolean;
  nakama: Nakama[];
  elapsed: number;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  attacks: Attack[];
  drops: Drop[];
  effects: Effect[];
  weapons: WeaponSlot[];
  chests: Chest[];
  chestRewards: ChestReward[];
  chestSerial: number;
  chestTimer: number;
  berries: number;
  openedChests: number;
  evolvedCount: number;
  haste: number;
  hitStop: number;
  notice: string;
  noticeTime: number;
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
