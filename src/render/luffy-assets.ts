interface LuffyLayers {
  arms: HTMLImageElement;
  bodies: HTMLImageElement;
  baseBody: HTMLImageElement;
}
let layers: LuffyLayers | undefined;
export const luffyLayers = (): LuffyLayers | undefined => layers;
export async function loadLuffyLayers(root: URL): Promise<void> {
  const specs = [
    ["luffy-arms-v4.png", 512, 192],
    ["luffy-bodies-v4.png", 288, 320],
    ["luffy-base-body-v4.png", 64, 320],
  ] as const;
  try {
    const images = await Promise.all(
      specs.map(async ([path, width, height]) => {
        const image = new Image();
        image.src = new URL(`assets/characters/${path}`, root).href;
        await image.decode();
        if (image.width !== width || image.height !== height)
          throw new Error(`Dimensiones de ${path}`);
        return image;
      }),
    );
    const [arms, bodies, baseBody] = images;
    if (arms && bodies && baseBody) layers = { arms, bodies, baseBody };
  } catch {
    console.warn(
      "Capas de Luffy no disponibles; se conserva el sprite integrado.",
    );
  }
}
