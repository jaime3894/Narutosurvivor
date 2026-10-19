import type { Input } from "../game/types";
export class Controls {
  private readonly keys = new Set<string>();
  private dashQueued = false;
  private pointer:
    | { id: number; startX: number; startY: number; x: number; y: number }
    | undefined;
  private readonly abort = new AbortController();
  constructor(canvas: HTMLCanvasElement, onPause: () => void) {
    const signal = this.abort.signal;
    window.addEventListener(
      "keydown",
      (event) => {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
            event.code,
          )
        )
          event.preventDefault();
        if (event.code === "Escape" || event.code === "KeyP") {
          if (!event.repeat) onPause();
        }
        if (event.code === "Space" && !event.repeat) this.dashQueued = true;
        this.keys.add(event.code);
      },
      { signal },
    );
    window.addEventListener("keyup", (event) => this.keys.delete(event.code), {
      signal,
    });
    window.addEventListener("blur", () => this.clear(), { signal });
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (this.pointer) return;
        canvas.setPointerCapture(event.pointerId);
        this.pointer = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          x: 0,
          y: 0,
        };
      },
      { signal },
    );
    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (this.pointer?.id !== event.pointerId) return;
        this.pointer.x = (event.clientX - this.pointer.startX) / 40;
        this.pointer.y = (event.clientY - this.pointer.startY) / 40;
      },
      { signal },
    );
    const release = (event: PointerEvent): void => {
      if (this.pointer?.id === event.pointerId) this.pointer = undefined;
    };
    canvas.addEventListener("pointerup", release, { signal });
    canvas.addEventListener("pointercancel", release, { signal });
    canvas.addEventListener("lostpointercapture", release, { signal });
  }
  dash(): void {
    this.dashQueued = true;
  }
  clear(): void {
    this.keys.clear();
    this.pointer = undefined;
    this.dashQueued = false;
  }
  read(): Input {
    const axis = (positive: string[], negative: string[]): number =>
      Number(positive.some((key) => this.keys.has(key))) -
      Number(negative.some((key) => this.keys.has(key)));
    const x = axis(["KeyD", "ArrowRight"], ["KeyA", "KeyQ", "ArrowLeft"]);
    const y = axis(["KeyS", "ArrowDown"], ["KeyW", "KeyZ", "ArrowUp"]);
    const input = {
      x: x || this.pointer?.x || 0,
      y: y || this.pointer?.y || 0,
      dash: this.dashQueued,
    };
    this.dashQueued = false;
    return input;
  }
  destroy(): void {
    this.abort.abort();
    this.clear();
  }
}
