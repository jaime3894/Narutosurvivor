interface CombatParts {
  frankyFists: HTMLImageElement;
  frankyBodies: HTMLImageElement;
  luffyKick: HTMLImageElement;
  luffySandals: HTMLImageElement;
  luffyBalloon: HTMLImageElement;
}
let parts: CombatParts | undefined;
export const combatParts = (): CombatParts | undefined => parts;
export async function loadCombatParts(root: URL): Promise<void> {
  try {
    const specs = [
      ["franky-fists-v5.png", 192, 64],
      ["luffy-kick-bodies-v5.png", 288, 320],
      ["luffy-sandals-v5.png", 96, 16],
      ["franky-bodies-v5.png", 288, 320],
      ["luffy-balloon-v5.png", 288, 320],
    ] as const;
    const images = await Promise.all(
      specs.map(async ([path, width, height]) => {
        const image = new Image();
        image.src = new URL(`assets/characters/${path}`, root).href;
        await image.decode();
        if (image.width !== width || image.height !== height)
          throw new Error("Dimensiones de " + path);
        return image;
      }),
    );
    const [frankyFists, luffyKick, luffySandals, frankyBodies, luffyBalloon] =
      images;
    if (
      frankyFists &&
      luffyKick &&
      luffySandals &&
      frankyBodies &&
      luffyBalloon
    )
      parts = {
        frankyFists,
        luffyKick,
        luffySandals,
        frankyBodies,
        luffyBalloon,
      };
  } catch {
    console.warn(
      "Piezas de técnicas no disponibles; se conserva el arte de reserva.",
    );
  }
}
