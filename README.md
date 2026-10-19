# Marea de aventuras

Survivor pirata web con arte procedural original. **Fase 1 implementada:** partidas de cinco minutos, combate automático, embestida, enemigos, experiencia, seis mejoras, pausa y resultados. Pendiente validar la diversión con una partida humana.

## Iniciar

Requiere Node.js 22.12+ (validado con Node 24) y npm.

```sh
npm ci
npm run dev
```

Abre el puerto 5173 y pulsa **Zarpar hacia East Blue**.

- **WASD / ZQSD / flechas:** movimiento. El ataque es automático.
- **Espacio:** embestida, con protección y eliminación por contacto; enfriamiento 2,6 s.
- **Escape / P:** pausa. Cambiar de pestaña también pausa.
- **1 / 2 / 3** o clic: elegir mejora cuando subes de nivel.
- Recoge cristales para ganar experiencia y alimentos rosados para recuperar vida.
- En móvil: arrastra sobre la arena y usa el botón Embestir. Controles táctiles definitivos y mando en fase 6.

## Comprobaciones

```sh
npm test
npm run build
npm run test:e2e
```

Los 17 tests de lógica incluyen tres simulaciones completas de cinco minutos sin trucos. Las cuatro pruebas E2E usan el build de producción en el puerto 4173 y verifican controles, pausa, mejoras, resultados y diseño móvil. La victoria E2E usa salud restaurada en depuración; verifica interfaz, no dificultad.

El entorno cloud ya tiene Chromium en `/usr/bin/chromium`. Fuera de él puedes usar `CHROMIUM_PATH=/ruta/al/navegador npm run test:e2e` o instalar el navegador de Playwright con `npx playwright install chromium`. No requiere ese navegador para jugar, compilar ni ejecutar los tests de lógica.

`npm run preview` sirve `dist`. Añade `?debug` al abrir el juego para mostrar +10 XP y el puente de pruebas `window.__MAREA_DEBUG__` (documentado en el GDD). No aparece en modo normal.

## Documentación

- [Diseño y decisiones](docs/GDD.md)
- [Progreso y pendientes](PROGRESO.md)
- [Contrato de recursos](docs/ASSETS.md)

No incluye assets oficiales, backend ni credenciales. Los cambios se entregan por fases en GitHub después de pasar build y tests.
