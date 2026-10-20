import type { Run } from "./types";
import { distanceSquared } from "./rules";
import { hurtPlayer } from "./rifts";
export function updateDangerZones(run: Run, dt: number): void {
  for (const z of run.imuZones) {
    if (z.warning > 0) {
      z.warning -= dt;
      continue;
    }
    z.life -= dt;
    let x = z.position.x,
      y = z.position.y;
    if (z.end) {
      const dx = z.end.x - x,
        dy = z.end.y - y,
        t = Math.max(
          0,
          Math.min(
            1,
            ((run.player.position.x - x) * dx +
              (run.player.position.y - y) * dy) /
              (dx * dx + dy * dy || 1),
          ),
        );
      x += t * dx;
      y += t * dy;
    }
    const distance = Math.sqrt(distanceSquared({ x, y }, run.player.position));
    if (
      z.damage > 0 &&
      distance < z.radius + run.player.radius &&
      distance > Math.max(-1, (z.innerRadius ?? 0) - run.player.radius)
    )
      hurtPlayer(run, z.damage);
  }
  run.imuZones = run.imuZones.filter((z) => z.life > 0);
}
