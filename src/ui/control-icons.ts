export type ControlIcon = "fullscreen" | "settings" | "pause" | "play" | "dash";
const paths: Readonly<Record<ControlIcon, string>> = {
  fullscreen: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2-5h4l.5 3 2 .9L19 5.5l2 3.5-2 2v2l2 2-2 3.5-2.5-1.4-2 .9-.5 3h-4l-.5-3-2-.9L5 18.5 3 15l2-2v-2L3 9l2-3.5 2.5 1.4 2-.9.5-3Z",
  pause: "M8 5v14M16 5v14",
  play: "m8 4 12 8-12 8V4Z",
  dash: "m4 19 15-15m-9 0h9v9M3 12l4-4m1 13 4-4",
};
export const controlIcon = (id: ControlIcon): string =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${id === "pause" ? '<path d="' + paths[id] + '" stroke-width="4"/>' : '<path d="' + paths[id] + '"/>'}</svg>`;
