import {
  combatArtists,
  combatAtlasPath,
  combatLayout,
  type CombatArtist,
} from "../data/combat-art";
import type { CharacterId } from "../data/content";

const atlases = new Map<CharacterId, HTMLImageElement>();
export const combatAtlas = (id: CharacterId): HTMLImageElement | undefined =>
  atlases.get(id);
export async function loadCombatAtlases(root: URL): Promise<void> {
  await Promise.all(
    combatArtists.map(async (id: CombatArtist) => {
      const image = new Image();
      image.src = new URL(combatAtlasPath(id), root).href;
      try {
        await image.decode();
        if (
          image.width !== combatLayout.width ||
          image.height !== combatLayout.height
        )
          throw new Error("Dimensiones");
        atlases.set(id, image);
      } catch {
        console.warn(
          `Poses de combate de ${id} no disponibles; se conserva el atlas corporal.`,
        );
      }
    }),
  );
}
