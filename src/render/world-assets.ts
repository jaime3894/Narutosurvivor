const assets = new Map<string, HTMLImageElement>();
export const worldAsset = (key: string): HTMLImageElement | undefined =>
  assets.get(key);
export async function loadWorldAssets(root: URL): Promise<void> {
  const specs: readonly (readonly [string, number, number, string])[] = [
    ["terrain", 512, 256, "terrain-v7.png"],
    ["props", 512, 384, "props-v7.png"],
    ["terrain-extra", 512, 384, "terrain-v11.png"],
    ["props-extra", 512, 768, "props-v11.png"],
  ];
  await Promise.all(
    specs.map(async ([key, width, height, path]) => {
      const image = new Image();
      image.src = new URL(`assets/world/${path}`, root).href;
      try {
        await image.decode();
        if (image.width !== width || image.height !== height)
          throw new Error("Dimensiones");
        assets.set(key, image);
      } catch {
        console.warn(
          `Arte de escenario ${key} no disponible; se conserva el suelo de reserva.`,
        );
      }
    }),
  );
}
