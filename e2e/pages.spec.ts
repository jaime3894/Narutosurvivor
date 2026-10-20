import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { expect, test } from "@playwright/test";

test("el build arranca bajo /One-piece-survivor/ sin rutas de assets rotas", async ({
  page,
}) => {
  const root = resolve("dist");
  const prefix = "/One-piece-survivor/";
  const contentTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
  };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
      if (!pathname.startsWith(prefix)) {
        response.writeHead(404).end();
        return;
      }
      const target = resolve(
        root,
        pathname.slice(prefix.length) || "index.html",
      );
      if (!target.startsWith(root + sep)) {
        response.writeHead(403).end();
        return;
      }
      const data = await readFile(target);
      response
        .writeHead(200, {
          "Content-Type":
            contentTypes[extname(target)] ?? "application/octet-stream",
        })
        .end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  try {
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Servidor de prueba no disponible");
    await page.goto(`http://127.0.0.1:${address.port}${prefix}`);
    await page.getByRole("button", { name: "Comenzar supervivencia" }).click();
    await expect(page.locator("#battle")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Pausa" })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await new Promise<void>((done, reject) =>
      server.close((error) => (error ? reject(error) : done())),
    );
  }
});
