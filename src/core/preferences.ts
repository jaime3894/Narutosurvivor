export type Quality = "auto" | "high" | "medium" | "low";
export interface Preferences {
  quality: Quality;
  zoom: 0.8 | 1 | 1.2;
  damageNumbers: boolean;
  calm: boolean;
  fps: boolean;
  touchScale: 0.8 | 1 | 1.25;
}
export const defaultPreferences: Readonly<Preferences> = {
  quality: "auto",
  zoom: 1,
  damageNumbers: true,
  calm: false,
  fps: false,
  touchScale: 1,
};
export function parsePreferences(value: unknown): Preferences {
  const result = { ...defaultPreferences };
  if (!value || typeof value !== "object" || Array.isArray(value))
    return result;
  const data = value as Record<string, unknown>;
  if (["auto", "high", "medium", "low"].includes(String(data.quality)))
    result.quality = data.quality as Quality;
  if (data.zoom === 0.8 || data.zoom === 1 || data.zoom === 1.2)
    result.zoom = data.zoom;
  if (
    data.touchScale === 0.8 ||
    data.touchScale === 1 ||
    data.touchScale === 1.25
  )
    result.touchScale = data.touchScale;
  for (const key of ["damageNumbers", "calm", "fps"] as const)
    if (typeof data[key] === "boolean") result[key] = data[key];
  return result;
}
export class AutoQuality {
  level: 0 | 1 | 2;
  fps = 60;
  private elapsed = 0;
  private frames = 0;
  private slow = 0;
  private fast = 0;
  constructor(private readonly mobile = false) {
    this.level = mobile ? 1 : 2;
  }
  sample(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.elapsed += dt;
    this.frames++;
    if (this.elapsed < 1) return;
    this.fps = this.frames / this.elapsed;
    this.elapsed = 0;
    this.frames = 0;
    if (this.fps < 45) {
      this.slow++;
      this.fast = 0;
    } else if (this.fps > 57) {
      this.fast++;
      this.slow = 0;
    } else {
      this.fast = 0;
      this.slow = 0;
    }
    if (this.slow >= 3 && this.level > 0) {
      this.level = (this.level - 1) as 0 | 1;
      this.slow = 0;
    }
    if (this.fast >= 8 && this.level < (this.mobile ? 1 : 2)) {
      this.level = (this.level + 1) as 1 | 2;
      this.fast = 0;
    }
  }
}
export interface RenderPreferences {
  level: 0 | 1 | 2;
  zoom: number;
  damageNumbers: boolean;
  calm: boolean;
}
export const defaultRenderPreferences: RenderPreferences = {
  level: 2,
  zoom: 1,
  damageNumbers: true,
  calm: false,
};
