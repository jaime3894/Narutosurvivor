import { elementColors, type RegionalElement } from "../data/regional-bosses";
import type { Position } from "../core/entity";
export const isRegionalElement = (id: string): id is RegionalElement =>
  Object.hasOwn(elementColors, id);
/** Motivos legibles propios: hilos, murciélagos, descargas y magma conservan su identidad. */
export function drawElementProjectile(
  ctx: CanvasRenderingContext2D,
  element: RegionalElement,
  velocity: Position,
  radius: number,
): void {
  const [light, dark] = elementColors[element];
  ctx.rotate(Math.atan2(velocity.y, velocity.x));
  ctx.strokeStyle = light;
  ctx.fillStyle = dark;
  ctx.lineWidth = 2;
  if (element === "lightning") {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -3);
    ctx.lineTo(-9, 3);
    ctx.lineTo(-4, -6);
    ctx.lineTo(7, 4);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fffbe0";
    ctx.beginPath();
    ctx.moveTo(-9, 3);
    ctx.lineTo(-2, 12);
    ctx.lineTo(8, 8);
    ctx.stroke();
  } else if (element === "thread") {
    for (const y of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(-26, y);
      ctx.quadraticCurveTo(-4, y - 4, 21, y);
      ctx.stroke();
    }
  } else if (element === "shadow") {
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-3, -6);
    ctx.lineTo(-18, -17);
    ctx.lineTo(-12, -3);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-12, 3);
    ctx.lineTo(-18, 17);
    ctx.lineTo(-3, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f2b1e9";
    ctx.fillRect(4, -4, 3, 2);
    ctx.fillRect(4, 3, 3, 2);
  } else if (element === "magma" || element === "flame") {
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(14, -radius, -8, -radius);
    ctx.lineTo(-31, -9);
    ctx.lineTo(-19, -2);
    ctx.lineTo(-34, 8);
    ctx.lineTo(-8, radius);
    ctx.quadraticCurveTo(14, radius, 18, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(4, 0, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = element === "magma" ? "#5f302e" : "#fff6cb";
    ctx.fillRect(-5, -3, 5, 5);
    ctx.fillRect(7, 0, 4, 5);
  } else if (element === "cloud") {
    for (const [x, y, r] of [
      [-8, 0, 10],
      [0, -5, 11],
      [9, 1, 9],
    ]) {
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.arc(x!, y!, r!, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = dark;
    ctx.beginPath();
    ctx.arc(0, 0, 13, -1, 1.6);
    ctx.stroke();
    ctx.fillStyle = "#e7bf6a";
    ctx.fillRect(4, -2, 4, 4);
  } else if (element === "claw") {
    for (const offset of [-7, 0, 7]) {
      ctx.beginPath();
      ctx.moveTo(-15, offset - 3);
      ctx.quadraticCurveTo(13, offset - 10, 22, offset);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-7, -6);
    ctx.lineTo(-12, -3);
    ctx.lineTo(-12, 3);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.fillRect(-22, -2, 12, 4);
  }
}
