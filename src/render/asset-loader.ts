import { newIslandIds } from "../data/islands";
import { loadWorldAssets } from "./world-assets";
import { loadBossAtlases } from "./boss-assets";
import { loadLuffyLayers } from "./luffy-assets";
import { loadCombatAtlases } from "./combat-assets";
import { loadCombatParts } from "./combat-parts";
import { characters } from "../data/crew";
import { enemyTypes } from "../data/combat";

const replacements = new Map<string, HTMLImageElement>();
export const replacementAtlas = (key: string): HTMLImageElement | undefined =>
  replacements.get(key);
/** Los atlas opcionales son locales: nunca se necesita un servicio externo para jugar. */
export async function loadCustomAtlases(): Promise<void> {
  try {
    const root = new URL(import.meta.env.BASE_URL, location.href);
    await Promise.all([
      loadWorldAssets(root),
      loadBossAtlases(root),
      loadLuffyLayers(root),
      loadCombatAtlases(root),
      loadCombatParts(root),
    ]);
    const response = await fetch(new URL("assets/manifest.json", root), {
      cache: "no-cache",
    });
    if (!response.ok) return;
    const manifest: unknown = await response.json();
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
      return;
    const keys = new Set([
      ...characters.flatMap((character) =>
        [0, 1, 2].map((tier) => `hero:${character.id}:${tier}`),
      ),
      ...Object.keys(enemyTypes).map((kind) => `enemy:${kind}`),
      ...newIslandIds.map((id) => `faction:${id}`),
    ]);
    await Promise.all(
      Object.entries(manifest).map(async ([key, path]: [string, unknown]) => {
        if (!keys.has(key) || typeof path !== "string") return;
        const url = new URL(path, root);
        if (url.origin !== root.origin || !url.pathname.endsWith(".png"))
          return;
        const image = new Image();
        image.src = url.href;
        try {
          await image.decode();
          if (image.width === 960 && image.height === 320)
            replacements.set(key, image);
          else console.warn(`Atlas ${key}: se esperan 960×320 píxeles.`);
        } catch {
          console.warn(
            `Atlas ${key}: no disponible; se usa el arte integrado.`,
          );
        }
      }),
    );
  } catch {
    /* Un manifiesto ausente o inválido conserva los sprites integrados. */
  }
}
