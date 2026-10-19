import { formMilestones } from "../data/form-progression";
import { characterById, type FormTier } from "../data/crew";
import { weaponById, weaponKey, type CharacterId } from "../data/content";
import type { Run } from "./types";
export function masteredForm(
  run: Run,
  id: CharacterId = run.character,
): FormTier {
  const rule = formMilestones[id];
  if (run.ranks[weaponKey(rule.first)] < 5) return 0;
  if (
    rule.second
      ? run.ranks[weaponKey(rule.second)] >= 5
      : run.weapons.some((w) => w.id === rule.first && w.evolved)
  )
    return 2;
  return 1;
}
export function formRequirement(id: CharacterId, tier: FormTier): string {
  if (tier === 0) return "Estilo inicial · energía infinita";
  const rule = formMilestones[id];
  return tier === 1
    ? `${weaponById(rule.first).title} 5/5`
    : rule.second
      ? `${weaponById(rule.first).title} + ${weaponById(rule.second).title} 5/5`
      : `Evolucionar ${weaponById(rule.first).title}`;
}
export function syncForms(run: Run): void {
  const tier = masteredForm(run);
  if (tier <= run.formUnlocked) return;
  run.formUnlocked = tier;
  run.form = tier;
  run.energy = 100;
  run.transformTime = 0.7;
  run.attacks = run.attacks.filter((a) => a.caster !== run.character);
  run.notice = `¡${characterById(run.character).forms[tier].name}! · dominio de técnica · energía infinita`;
  run.noticeTime = 4;
}
