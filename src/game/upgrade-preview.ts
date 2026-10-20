import type { Run } from "./types";
import { stats } from "./rules";
import { masteredForm } from "./forms";
import { techniqueDefinition } from "../data/technique-forms";
import { weaponKey, type UpgradeId, type WeaponId } from "../data/content";
import { techniqueValues } from "./techniques";
/** Proyección pura de la tarjeta; usa los mismos rangos y modificadores de forma del combate. */
export function upgradeComparison(run: Run, id: UpgradeId): string {
  const next: Run = {
    ...run,
    ranks: { ...run.ranks, [id]: run.ranks[id] + 1 },
  };
  const tier = masteredForm(next);
  if (tier > run.formUnlocked) next.form = tier;
  const before = stats(run),
    after = stats(next);
  const n = (v: number) => Number(v.toFixed(1));
  if (id.startsWith("weapon:")) {
    const w = id.slice(7) as WeaponId,
      oldRank = run.ranks[weaponKey(w)],
      d = techniqueDefinition(w, run.form),
      nd = techniqueDefinition(w, next.form),
      evolved = run.weapons.find((s) => s.id === w)?.evolved;
    if (!next.weapons.some((slot) => slot.id === w))
      next.weapons = [...next.weapons, { id: w, timer: 0, evolved: false }];
    const a = techniqueValues(run, d, Boolean(evolved)),
      b = techniqueValues(next, nd, Boolean(evolved));
    return `${oldRank ? n(a.damage) + " → " : ""}${n(b.damage)} daño/golpe · alcance ${n(a.range)} → ${n(b.range)}`;
  }
  const value =
    id === "power" || id === "spirit"
      ? ["Daño", before.damage, after.damage]
      : id === "tempo"
        ? ["Intervalo base", before.attackPeriod, after.attackPeriod]
        : id === "stride"
          ? ["Velocidad", before.speed, after.speed]
          : id === "magnet"
            ? ["Recogida", before.magnet, after.magnet]
            : id === "armor"
              ? ["Armadura", before.armor, after.armor]
              : id === "regen"
                ? ["HP/s", before.regen, after.regen]
                : id === "crit"
                  ? [
                      "Crítico %",
                      before.criticalChance * 100,
                      after.criticalChance * 100,
                    ]
                  : undefined;
  if (value)
    return `${value[0]} ${n(Number(value[1]))} → ${n(Number(value[2]))}`;
  if (id === "vitality")
    return `HP máximo ${run.player.health.maximum} → ${run.player.health.maximum + 20}`;
  if (id === "reach") return `Alcance ×${n(before.range)} → ×${n(after.range)}`;
  if (id === "duration")
    return `Duración ×${n(before.duration)} → ×${n(after.duration)}`;
  if (id === "multishot")
    return `Proyectiles ${before.projectiles} → ${after.projectiles}`;
  if (id === "greed")
    return `Botín ×${n(before.currency)} → ×${n(after.currency)}`;
  return `Rango ${run.ranks[id]} → ${run.ranks[id] + 1}`;
}
