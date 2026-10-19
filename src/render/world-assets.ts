const assets = new Map<string, HTMLImageElement>();
export const worldAsset = (key: string): HTMLImageElement | undefined =>
  assets.get(key);
export async function loadWorldAssets(root: URL): Promise<void> {
  await Promise.all(
    [
      ["terrain", 512, 256],
      ["props", 512, 384],
    ].map(async ([key, width, height]) => {
      const image = new Image();
      image.src = new URL(`assets/world/${key}-v7.png`, root).href;
      try {
        await image.decode();
        if (image.width !== width || image.height !== height)
          throw new Error("Dimensiones");
        assets.set(String(key), image);
      } catch {
        console.warn(
          `Arte de escenario ${key} no disponible; se conserva suelo de reserva.`,
        );
      }
    }),
  );
}
