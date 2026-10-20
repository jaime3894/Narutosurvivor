import {
  characterNames,
  weapons,
  type CharacterId,
  type WeaponId,
} from "../data/content";
import { characterById } from "../data/crew";
import {
  training,
  trainingIds,
  emptyTraining,
  trainingCost,
  type TrainingId,
  type Profile,
  type SailorRecord,
  type Preparation,
} from "../data/training";
import type { Run } from "./types";
export const profileKey = "marea.profile.v2";
export const legacyProfileKey = "marea.profile.v1";
const ids = Object.keys(characterNames) as CharacterId[];
export const newSailor = (): SailorRecord => ({
  levels: emptyTraining(),
  banned: [],
  runs: 0,
  wins: 0,
  bestTime: 0,
  kills: 0,
});
export const newProfile = (): Profile => ({
  version: 2,
  berries: 120,
  selected: "luffy",
  sailors: Object.fromEntries(ids.map((id) => [id, newSailor()])) as Record<
    CharacterId,
    SailorRecord
  >,
  receipts: [],
});
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function number(value: unknown, max = 1e9): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(0, Math.floor(value)))
    : 0;
}
export function parseProfile(value: unknown): Profile {
  const data = record(value);
  if (data.version !== 1 && data.version !== 2)
    throw new Error("Versión de guardado no reconocida");
  const result = newProfile(),
    sailors = record(data.sailors);
  if (ids.includes(data.selected as CharacterId))
    result.selected = data.selected as CharacterId;
  result.receipts = Array.isArray(data.receipts)
    ? data.receipts.filter((v): v is string => typeof v === "string").slice(-64)
    : [];
  result.berries = data.version === 2 ? number(data.berries) : 0;
  for (const id of ids) {
    const raw = record(sailors[id]);
    if (!Object.keys(raw).length) continue;
    const s = result.sailors[id],
      levels = record(raw.levels),
      own = weapons.filter((w) => w.owner === id).map((w) => w.id);
    if (data.version === 1)
      result.berries = Math.min(1e9, result.berries + number(raw.berries));
    for (const key of trainingIds)
      s.levels[key] = number(levels[key], training[key].max);
    s.runs = number(raw.runs);
    s.wins = Math.min(s.runs, number(raw.wins));
    s.bestTime = number(raw.bestTime, 31_536_000);
    s.kills = number(raw.kills);
    if (s.levels.starter && own.includes(raw.starter as WeaponId))
      s.starter = raw.starter as WeaponId;
    const starter = s.starter ?? characterById(id).starter;
    s.banned = Array.isArray(raw.banned)
      ? [...new Set(raw.banned)]
          .filter(
            (w): w is WeaponId => own.includes(w as WeaponId) && w !== starter,
          )
          .slice(0, s.levels.veto)
      : [];
  }
  return result;
}
export function purchaseTraining(
  profile: Profile,
  character: CharacterId,
  id: TrainingId,
): boolean {
  const sailor = profile.sailors[character],
    level = sailor.levels[id],
    own = weapons.filter((w) => w.owner === character);
  if (
    level >= training[id].max ||
    ((id === "repertoire" || id === "starter" || id === "veto") &&
      own.length < 2)
  )
    return false;
  const cost = trainingCost(id, level);
  if (profile.berries < cost) return false;
  profile.berries -= cost;
  sailor.levels[id]++;
  return true;
}
export function prepareSailor(
  profile: Profile,
  character: CharacterId,
): Preparation {
  const s = profile.sailors[character];
  return {
    levels: { ...s.levels },
    ...(s.starter ? { starter: s.starter } : {}),
    banned: [...s.banned],
  };
}
export function setStarter(
  profile: Profile,
  character: CharacterId,
  id: WeaponId,
): boolean {
  const s = profile.sailors[character];
  if (
    !s.levels.starter ||
    !weapons.some((w) => w.id === id && w.owner === character)
  )
    return false;
  s.starter = id;
  s.banned = s.banned.filter((w) => w !== id);
  return true;
}
export function setVeto(
  profile: Profile,
  character: CharacterId,
  ids: WeaponId[],
): boolean {
  const s = profile.sailors[character],
    starter = s.starter ?? characterById(character).starter;
  if (
    ids.length > s.levels.veto ||
    new Set(ids).size !== ids.length ||
    ids.some(
      (id) =>
        id === starter ||
        !weapons.some((w) => w.id === id && w.owner === character),
    )
  )
    return false;
  s.banned = [...ids];
  return true;
}
export function settleRun(profile: Profile, run: Run): number {
  if (profile.receipts.includes(run.id)) return 0;
  const sailor = profile.sailors[run.character];
  const reward = Math.max(
    0,
    Math.floor(
      run.berries +
        run.kills / 4 +
        run.elapsed / 10 +
        run.bossesDefeated * 35 +
        (run.status === "won" ? 100 : 0),
    ),
  );
  profile.berries = Math.min(1e9, profile.berries + reward);
  sailor.runs++;
  if (run.status === "won") sailor.wins++;
  sailor.bestTime = Math.max(sailor.bestTime, Math.floor(run.elapsed));
  sailor.kills += run.kills;
  profile.receipts.push(run.id);
  profile.receipts = profile.receipts.slice(-64);
  return reward;
}
