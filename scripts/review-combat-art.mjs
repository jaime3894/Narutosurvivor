/** Banco visual del render real. Ejecutar con npm run dev activo. */
import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage({
      viewport: { width: 1620, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning") errors.push(message.text());
  });
  await page.goto(process.argv[2] ?? "http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).waitFor();
  await page.evaluate(async () => {
    const { combatAtlas } = await import("/src/render/combat-assets.ts");
    const { combatParts } = await import("/src/render/combat-parts.ts");
    const { luffyLayers } = await import("/src/render/luffy-assets.ts");
    if (!combatParts() || !luffyLayers() || !combatAtlas("zoro"))
      throw new Error(
        "El banco debe usar los módulos precargados: reinicia Vite antes de la revisión visual.",
      );
  });
  for (const form of [0, 1, 2]) {
    await page.evaluate(async (form) => {
      const { createRun, step } = await import("/src/game/simulation.ts");
      const { weapons } = await import("/src/data/content.ts");
      const { drawFighter } = await import("/src/render/fighter.ts");
      const { drawTechniques } = await import("/src/render/techniques.ts");
      const { drawProjectile } = await import("/src/render/projectile.ts");
      const c = document.createElement("canvas");
      c.id = "combat-review";
      c.width = 1620;
      c.height = weapons.length * 170;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#183b43";
      ctx.fillRect(0, 0, c.width, c.height);
      for (let row = 0; row < weapons.length; row++) {
        const definition = weapons[row],
          run = createRun(1, definition.owner);
        run.form = form;
        run.weapons = [{ id: definition.id, timer: 0, evolved: false }];
        run.ranks["weapon:" + definition.id] = 1;
        run.enemies = [
          {
            id: 500,
            kind: "brute",
            position: { x: 1300, y: 900 },
            velocity: { x: 0, y: 0 },
            health: { current: 10000, maximum: 10000 },
            radius: 19,
            flash: 0,
          },
        ];
        step(run, { x: 0, y: 0, dash: false }, 1 / 60);
        const a = run.attacks.find((a) => a.weapon === definition.id);
        if (!a) throw new Error("Sin ataque " + definition.id);
        run.player.position = { x: 0, y: 0 };
        run.player.invulnerable = 0;
        a.direction = { x: 1, y: 0 };
        a.target = { x: a.distance, y: 0 };
        const at = a.strikes[0].at,
          times = [
            a.windup * 0.15,
            a.windup * 0.85,
            at,
            at + (a.windup + a.active - at) * 0.7,
            a.windup + a.active + a.recovery * 0.3,
            a.windup + a.active + a.recovery * 0.9,
          ];
        for (let col = 0; col < 6; col++) {
          a.age = times[col];
          run.attacks = [a];
          ctx.save();
          ctx.beginPath();
          ctx.rect(col * 270, row * 170, 270, 170);
          ctx.clip();
          ctx.translate(col * 270 + 60, row * 170 + 130);
          ctx.scale(1.35, 1.35);
          drawFighter(ctx, run, false);
          drawTechniques(ctx, run, false);
          if (a.weapon === "firestar" && a.age >= at) {
            const travel = (a.age - at) * 300;
            drawProjectile(ctx, {
              id: 1,
              weapon: a.weapon,
              caster: a.caster,
              form,
              position: { x: travel, y: 0 },
              origin: { x: 0, y: 0 },
              velocity: { x: 580, y: 0 },
              damage: 0,
              life: 1,
              evolved: false,
            });
          }
          ctx.restore();
          ctx.fillStyle = "#ead7ae";
          ctx.font = "12px monospace";
          ctx.fillText(
            `${definition.owner} / ${definition.id} / ${["guardia", "anticipa", "contacto", "continua", "recoge", "reposo"][col]}`,
            col * 270 + 10,
            row * 170 + 157,
          );
        }
      }
      document.querySelector("#app").replaceChildren(c);
    }, form);
    await page
      .locator("#combat-review")
      .screenshot({ path: `docs/screenshots/tecnicas-forma-${form}-v5.png` });
  }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "54 combinaciones técnica/forma × seis tiempos, sin errores ni recursos de reserva.",
  );
} finally {
  await browser.close();
}
