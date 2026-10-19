import type { Projectile } from "../game/types";
import { ease } from "./motion";
export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  projectile: Projectile,
): void {
  const travel = Math.hypot(
    projectile.position.x - projectile.origin.x,
    projectile.position.y - projectile.origin.y,
  );
  const speed = Math.hypot(projectile.velocity.x, projectile.velocity.y) || 1;
  // La munición abandona el tirachinas, no aparece en el centro del torso.
  const offset = 24 * (1 - ease(travel / 60));
  const x = projectile.position.x + (projectile.velocity.x / speed) * offset;
  const y =
    projectile.position.y - 45 + (projectile.velocity.y / speed) * offset;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(projectile.velocity.y, projectile.velocity.x));
  if (projectile.form > 0) {
    const flap = Math.sin(travel * 0.13) * 8;
    ctx.fillStyle = projectile.form === 2 ? "#ff9e4c" : "#f0bd65";
    ctx.strokeStyle = "#fff0b5";
    ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, side * (12 + flap));
      ctx.lineTo(-15, side * (17 + flap));
      ctx.lineTo(-10, side * 4);
      ctx.lineTo(-21, side * 6);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#dc633b";
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(-19, 0);
  ctx.lineTo(-4, 4);
  ctx.fill();
  ctx.fillStyle = "#ffc36b";
  ctx.strokeStyle = "#794339";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5,
      r = i % 2 === 0 ? 7 : 3;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe9ac";
  ctx.fillRect(-2, -2, 3, 3);
  ctx.restore();
}
