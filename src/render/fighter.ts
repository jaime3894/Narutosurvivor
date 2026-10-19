import { weaponById } from "../data/content";
import { animationProgress } from "../game/techniques";
import type { Run } from "../game/types";
/** Actor provisional articulado; los atlas definitivos se integran en fase 3. */
export function drawFighter(
  ctx: CanvasRenderingContext2D,
  run: Run,
  reducedMotion: boolean,
): void {
  const { player } = run;
  const moving = Math.hypot(player.velocity.x, player.velocity.y) > 0;
  const swing = moving && !reducedMotion ? Math.sin(run.elapsed * 16) * 2 : 0;
  const attack = run.attacks[0];
  const pose = attack ? animationProgress(attack) : undefined;
  const inflate = run.attacks.find((item) => item.weapon === "balloon");
  const lift = inflate
    ? Math.max(0, animationProgress(inflate).extension) * 24
    : 0;
  const lean = attack
    ? attack.direction.x * Math.max(0, pose?.extension ?? 0) * 3
    : 0;
  ctx.save();
  ctx.translate(Math.round(player.position.x), Math.round(player.position.y));
  ctx.fillStyle = "#294b46";
  ctx.beginPath();
  ctx.ellipse(0, 7, 15 + lift * 0.2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(lean, -Math.abs(swing) * 0.5);
  const luffy = run.character === "luffy";
  const legInUse = run.attacks.some((item) =>
    ["sweep", "kick", "stomp"].includes(weaponById(item.weapon).animation),
  );
  if (!inflate) {
    ctx.fillStyle = "#523c32";
    ctx.fillRect(-10, -3 + swing, 8, 12);
    if (!legInUse) ctx.fillRect(3, -3 - swing, 8, 12);
    ctx.fillStyle = "#dfa175";
    ctx.fillRect(-9, -3 + swing, 6, 10);
    if (!legInUse) ctx.fillRect(4, -3 - swing, 6, 10);
    ctx.fillStyle = "#9c7350";
    ctx.fillRect(-11, 6 + swing, 10, 4);
    if (!legInUse) ctx.fillRect(2, 6 - swing, 10, 4);
    ctx.fillStyle = "#3b4243";
    ctx.fillRect(-8, 6 + swing, 2, 3);
    if (!legInUse) ctx.fillRect(5, 6 - swing, 2, 3);
    ctx.fillStyle = "#233e50";
    ctx.fillRect(-11, -8, 23, 9);
    ctx.fillStyle = "#54849a";
    ctx.fillRect(-9, -7, 8, 6);
    ctx.fillRect(3, -7, 7, 6);
    ctx.fillStyle = "#dce1c4";
    ctx.fillRect(-11, -1, 10, 3);
    ctx.fillRect(2, -1, 10, 3);
    ctx.fillStyle = "#e8ac7c";
    ctx.fillRect(-8, -24, 17, 17);
    ctx.fillStyle = luffy ? "#a94638" : "#365b65";
    ctx.fillRect(-12, -24, 9, 18);
    ctx.fillRect(4, -24, 9, 18);
    ctx.fillStyle = luffy ? "#e4714b" : "#7dabb2";
    ctx.fillRect(-10, -23, 6, 15);
    ctx.fillRect(5, -23, 6, 15);
    ctx.fillStyle = "#f3cb78";
    ctx.fillRect(-6, -8, 15, 2);
    const armActions = run.attacks.map(
      (item) => weaponById(item.weapon).animation,
    );
    if (
      !armActions.some((kind) =>
        ["stretch", "chain", "barrage", "double"].includes(kind),
      )
    ) {
      ctx.fillStyle = "#bc805e";
      ctx.fillRect(-15, -21 + swing, 5, 17);
      ctx.fillStyle = "#edb98a";
      ctx.fillRect(-14, -21 + swing, 4, 14);
    }
    if (!armActions.some((kind) => ["barrage", "double"].includes(kind))) {
      ctx.fillStyle = "#bc805e";
      ctx.fillRect(11, -21 - swing, 5, 17);
      ctx.fillStyle = "#edb98a";
      ctx.fillRect(11, -21 - swing, 4, 14);
    }
  }
  ctx.translate(0, -lift);
  ctx.fillStyle = "#263334";
  ctx.fillRect(-10, -37, 21, 13);
  ctx.fillRect(-12, -32, 24, 6);
  ctx.fillStyle = "#bc805c";
  ctx.fillRect(-8, -35, 17, 13);
  ctx.fillStyle = "#efbd8b";
  ctx.fillRect(-7, -35, 15, 11);
  ctx.fillStyle = "#ffdaa3";
  ctx.fillRect(-5, -34, 10, 5);
  ctx.fillStyle = "#283337";
  ctx.fillRect(-5, -31, 2, 3);
  ctx.fillRect(4, -31, 2, 3);
  ctx.fillStyle = "#a1644f";
  ctx.fillRect(3, -26, 5, 1);
  ctx.fillRect(5, -27, 1, 3);
  ctx.fillStyle = "#774b3c";
  ctx.fillRect(-3, -25, 6, 1);
  if (luffy) {
    ctx.fillStyle = "#574633";
    ctx.fillRect(-18, -39, 36, 6);
    ctx.fillRect(-12, -48, 24, 10);
    ctx.fillStyle = "#d5aa5c";
    ctx.fillRect(-17, -40, 34, 5);
    ctx.fillRect(-11, -47, 22, 9);
    ctx.fillStyle = "#efcf85";
    ctx.fillRect(-9, -47, 18, 3);
    ctx.fillRect(-15, -40, 29, 2);
    ctx.fillStyle = "#b9523c";
    ctx.fillRect(-11, -41, 22, 4);
    ctx.fillStyle = "#f3d795";
    ctx.fillRect(-8, -46, 2, 3);
    ctx.fillRect(0, -46, 2, 3);
    ctx.fillRect(7, -45, 2, 3);
    ctx.fillStyle = "#283337";
    ctx.fillRect(-11, -34, 3, 7);
    ctx.fillRect(8, -34, 3, 6);
  }
  ctx.restore();
}
