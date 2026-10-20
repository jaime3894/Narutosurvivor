/** Parámetros del modo continuo; no dependen de render ni del estado de una partida. */
export const survivalRules = {
  zoneSeconds: 240,
  secretBossAt: 3600,
  secretBossTime: 240,
  secretReward: 1000,
  newWorldHealth: 1.6,
  riftRest: 30,
} as const;
export const fieldRules = {
  firstAt: 12,
  interval: 26,
  maximum: 6,
  lifetime: 80,
  distance: 240,
  reach: 52,
  vaultSeconds: 3,
  vaultBerries: 20,
} as const;
export const fieldDefinitions = {
  barrel: {
    atlas: 2,
    health: 42,
    title: "PROVISIONES",
    notice: "Barril de provisiones · rómpelo con tus técnicas",
  },
  supplies: {
    atlas: 7,
    health: 1,
    title: "SANJI · +30 HP",
    notice: "Suministros de Sanji · recupera vida",
  },
  vault: {
    atlas: 4,
    health: 1,
    title: "CAJA · 3 s",
    notice: "Caja fuerte de la Marina · acércate 3 s para abrirla",
  },
} as const;
export const fieldKinds = Object.keys(
  fieldDefinitions,
) as (keyof typeof fieldDefinitions)[];

export const survivalPressure = (seconds: number): number =>
  1 + Math.min(3, seconds / 1200);
