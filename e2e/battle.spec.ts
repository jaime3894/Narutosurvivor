import { expect, test } from "@playwright/test";
import type { DebugBridge } from "../src/ui/session";
declare global {
  interface Window {
    __MAREA_DEBUG__?: DebugBridge;
  }
}

test("movimiento, pausa, mejora, derrota y reinicio en el build real", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await expect(page.locator("#battle")).toBeVisible();
  const start = await page.evaluate(() => window.__MAREA_DEBUG__?.snapshot());
  if (!start) throw new Error("Falta puente de depuración");
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => page.evaluate(() => window.__MAREA_DEBUG__?.snapshot().x))
    .toBeGreaterThan(start.x + 30);
  await page.keyboard.up("KeyD");
  await page.keyboard.press("Space");
  await expect(page.locator("#dash-state")).not.toHaveText("LISTO");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Pausa" })).toBeVisible();
  const paused = await page.evaluate(() => window.__MAREA_DEBUG__?.snapshot());
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__?.snapshot().elapsed),
  ).toBe(paused?.elapsed);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "+10 XP" }).click();
  await expect(
    page.getByRole("dialog", { name: "Elige una mejora" }),
  ).toBeVisible();
  await expect(page.locator("[data-upgrade]")).toHaveCount(3);
  await page.keyboard.press("Digit1");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#level")).toHaveText("NIVEL 2");
  await page.evaluate(() => {
    window.__MAREA_DEBUG__?.setHealth(0);
    window.__MAREA_DEBUG__?.advance(1);
  });
  await expect(page.getByRole("dialog", { name: "Resultados" })).toContainText(
    "Una ola más.",
  );
  await page.getByRole("button", { name: "Otra partida" }).click();
  await expect(page.locator("#level")).toHaveText("NIVEL 1");
  await expect(page.locator("#hp-text")).toHaveText("100 / 100");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Volver al puerto" }).click();
  await expect(
    page.getByRole("button", { name: "Zarpar hacia East Blue" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__MAREA_DEBUG__)).toBeUndefined();
  expect(errors).toEqual([]);
});

test("pantalla de victoria tras 300 segundos simulados (salud restaurada por depuración)", async ({
  page,
}) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  const result = await page.evaluate(() => {
    const bridge = window.__MAREA_DEBUG__;
    if (!bridge) throw new Error("Falta puente de depuración");
    for (
      let i = 0;
      i < 700 && !["won", "lost"].includes(bridge.snapshot().status);
      i++
    ) {
      const state = bridge.snapshot();
      if (state.status === "upgrade") {
        const choice = state.choices[0];
        if (choice) bridge.choose(choice);
      } else {
        bridge.setHealth(100);
        bridge.advance(0.5);
      }
    }
    return bridge.snapshot();
  });
  expect(result.status).toBe("won");
  expect(result.elapsed).toBe(300);
  await expect(page.getByRole("dialog", { name: "Resultados" })).toContainText(
    "La costa es tuya.",
  );
  await expect(page.getByRole("dialog")).toContainText("05:00");
});

test("móvil: selección visible, arrastre y controles táctiles básicos", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  const box = await page.locator("#battle").boundingBox();
  if (!box) throw new Error("Arena ausente");
  const before = await page.evaluate(
    () => window.__MAREA_DEBUG__?.snapshot().x,
  );
  await page.mouse.move(box.x + 120, box.y + 140);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 140);
  await expect
    .poll(async () => page.evaluate(() => window.__MAREA_DEBUG__?.snapshot().x))
    .toBeGreaterThan((before ?? 0) + 15);
  await page.mouse.up();
  await page.getByRole("button", { name: "+10 XP" }).click();
  const cards = page.locator("[data-upgrade]");
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) await expect(cards.nth(i)).toBeInViewport();
  await cards.first().click();
  await page.getByRole("button", { name: "Embestir" }).click();
  await expect(page.locator("#dash-state")).not.toHaveText("LISTO");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("el modo normal no expone herramientas de depuración", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  expect(await page.evaluate(() => window.__MAREA_DEBUG__)).toBeUndefined();
  await expect(page.locator(".debug-tools")).toHaveCount(0);
});

test("el cuaderno enumera 18 técnicas, 14 pasivos y recetas de evolución", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Cuaderno de combate" }).click();
  const dialog = page.getByRole("dialog", { name: "Cuaderno de combate" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".catalog-card")).toHaveCount(32);
  await expect(dialog).toContainText("Gomu Gomu no Pistol");
  await expect(dialog).toContainText("Jinbe");
  await expect(dialog).toContainText("Rango 5");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Cuaderno de combate" }),
  ).toBeFocused();
});

test("las 18 técnicas se ejecutan sin errores de render en el banco de depuración", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  const options = await page
    .locator("#debug-technique option")
    .evaluateAll((elements) =>
      elements.map((element) => (element as HTMLOptionElement).value),
    );
  expect(options).toHaveLength(18);
  for (const option of options) {
    await page.locator("#debug-technique").selectOption(option);
    await page.evaluate(() => window.__MAREA_DEBUG__?.advance(0.22));
    const state = await page.evaluate(() => window.__MAREA_DEBUG__?.snapshot());
    expect(state?.weapons[0]?.id).toBe(option);
    expect(state?.attacks).toBeGreaterThan(0);
    await expect(page.locator("#weapon-loadout")).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});

test("recoger un cofre evoluciona Rifle, pausa y permite continuar con la nueva build", async ({
  page,
}) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await page.getByRole("button", { name: "Preparar evolución" }).click();
  await expect(page.locator("#weapon-loadout")).toContainText("5/5");
  await page.evaluate(() =>
    window.__MAREA_DEBUG__?.advance(0.5, { x: 1, y: 0, dash: false }),
  );
  const dialog = page.getByRole("dialog", { name: "Botín del cofre" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Gomu Gomu no Rifle");
  const state = await page.evaluate(() => window.__MAREA_DEBUG__?.snapshot());
  expect(state?.weapons[0]?.evolved).toBe(false);
  await expect(dialog.locator("[data-chest]")).toHaveCount(3);
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__?.snapshot().elapsed),
  ).toBe(state?.elapsed);
  await dialog.getByRole("button", { name: /Gomu Gomu no Rifle/ }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      window
        .__MAREA_DEBUG__!.snapshot()
        .weapons.some((w) => w.id === "pistol" && w.evolved),
    ),
  ).toBe(true);
  await expect(
    page.locator("#weapon-loadout [data-active-weapon=pistol]"),
  ).toHaveAttribute("aria-label", "Gomu Gomu no Pistol 5/5");
});
