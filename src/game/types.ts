import type { IslandId } from "../data/islands";
import type { RegionalElement } from "../data/regional-bosses";
import type { MissionId } from "../data/missions";
import type { BossMoveId } from "../data/boss-moves";
import type { Preparation } from "../data/training";
import type { FormTier } from "../data/crew";
import type { Position, Velocity, Health } from "../core/entity";
import type { EnemyKind } from "../data/combat";
import type { BossId, BoonId } from "../data/rifts";
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
  | "bossReward"
  | "bond"
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
  elite?: boolean;
  faction?: IslandId;
  role?: "rifle" | "shield" | "officer";
  roleTimer?: number;
  aim?: Position;
  warning?: number;
  radius: number;
  flash: number;
  slow?: number;
  burn?: number;
  burnTick?: number;
  boss?: {
    kind: BossId;
    imuPhase?: 1 | 2 | 3;
    guard?: boolean;
    move: BossMoveId;
    cycle: number;
    walkTime: number;
    moving: boolean;
    burst: number;
    phase: "approach" | "windup" | "attack" | "recover";
    time: number;
    target: Position;
    direction: Position;
  };
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
    | "shell"
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
  kind: "evolution" | "upgrade" | "berries" | "vitality" | "haste";
  title: string;
  detail: string;
  id?: UpgradeId;
  amount?: number;
}
export interface CampaignEncounter {
  index: number;
  role: "miniboss" | "final";
  health: number;
  seconds: number;
}
export interface ShellWarning {
  id: number;
  position: Position;
  remaining: number;
}
export interface DirectorState {
  nextEncounter: number;
  finalDefeated: boolean;
  busterStarted: boolean;
  imuSpawned: boolean;
  imuDefeated: boolean;
  buster: { remaining: number; timer: number; shells: ShellWarning[] } | null;
}
export interface Rift {
  encounter?: CampaignEncounter;
  position: Position;
  remaining: number;
  boss: BossId;
}
export interface RiftArena {
  boss: BossId;
  encounter?: CampaignEncounter;
  center: Position;
  remaining: number;
  bossId: number;
  returnPosition: Position;
  enemies: Enemy[];
  drops: Drop[];
  chests: Chest[];
}
export interface Hazard {
  id: number;
  position: Position;
  velocity: Velocity;
  radius: number;
  damage: number;
  life: number;
  kind:
    | "void"
    | "knife"
    | "wave"
    | "bomb"
    | "claw"
    | "sand"
    | "shadow"
    | RegionalElement;
}
export interface BossReward {
  kind: "bond" | "boon" | "supply";
  id: "bond" | BoonId | "berries" | "rest" | "haste";
  title: string;
  detail: string;
}
export interface Nakama {
  character: CharacterId;
  position: Position;
  facing: Position;
  moving: boolean;
  timer: number;
  supportTimer: number;
}
export interface FieldObject {
  id: number;
  kind: "barrel" | "supplies" | "vault";
  position: Position;
  health: number;
  progress: number;
  remaining: number;
}
export interface Run {
  islandTimer: number;
  imuZones: {
    position: Position;
    element?: RegionalElement;
    innerRadius?: number;
    end?: Position;
    radius: number;
    warning: number;
    life: number;
    damage: number;
  }[];
  fieldObjects: FieldObject[];
  fieldTimer: number;
  shots: {
    position: Position;
    velocity: Velocity;
    life: number;
    damage: number;
  }[];
  mission: MissionId;
  director: DirectorState;
  id: string;
  preparation: Preparation;
  rerollsLeft: number;
  status: RunStatus;
  character: CharacterId;
  form: FormTier;
  formUnlocked: FormTier;
  energy: number;
  formCooldown: number;
  transformTime: number;
  reviveUsed: boolean;
  nakama: Nakama[];
  assists: Nakama[];
  activeWeapon: WeaponId;
  linkedWeapons: WeaponId[];
  rift: Rift | null;
  arena: RiftArena | null;
  nextRiftTime: number;
  nextRiftEarliest: number;
  nextRiftKills: number;
  bossesDefeated: number;
  hazards: Hazard[];
  bossRewards: BossReward[];
  rewardSerial: number;
  boons: Record<BoonId, number>;
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
