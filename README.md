# Marea de aventuras

Survivor pirata web con 33 atlas 2D de cuerpo completo creados para el juego con asistencia de IA. **Fase 3 implementada:** diez capitanes, tres estilos por personaje, innatos y hasta dos nakama con sinergias. Mantiene las partidas de cinco minutos, 18 técnicas, 14 pasivos, cofres y evoluciones. Pendiente validar la diversión con una partida humana.

## Jugar online

[**Abrir Marea de aventuras**](https://jaime3894.github.io/One-piece-survivor/) y pulsar **Elegir tripulación** antes de **Zarpar hacia East Blue**. No requiere instalar Node ni descargar el repositorio.

## Iniciar en desarrollo

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
- Recoge cristales para ganar experiencia, carne para curarte y cofres para mejorar o evolucionar técnicas.
- Evolución: técnica rango 5 + pasivo vinculado rango 2 + un cofre después de 01:00. Las recetas están en el **Cuaderno de combate** del puerto.
- Luffy base tiene postura neutral y seis poses de carrera. En el selector: **De pie**, **Correr** y **Golpe de goma** para demostrar el brazo texturizado y conectado.
- **F** o botones de forma: cambiar estilo. Desbloqueos en niveles 4 y 8; las formas gastan energía, el estilo base la recupera.
- Cada capitán solo aprende sus técnicas. Los nakama siguen al capitán y atacan con su propia arma; no ocupan huecos de su build.
- En móvil: arrastra sobre la arena y usa el botón Embestir. Controles táctiles definitivos y mando en fase 6.

## Comprobaciones

```sh
npm test
npm run build
npm run test:e2e
```

Los 143 tests de lógica y recursos incluyen ejecución y evolución de las 18 técnicas, compatibilidades y tres simulaciones completas de cinco minutos sin trucos. Las quince pruebas E2E usan el build de producción en el puerto 4173 y verifican controles, pausa, mejoras, resultados, diseño móvil, catálogo, las 18 técnicas en el banco, la evolución desde un cofre, tripulación, 30 vistas de formas, sprites propios y la ruta de GitHub Pages. La victoria E2E usa salud restaurada en depuración; verifica interfaz, no dificultad.

El entorno cloud ya tiene Chromium en `/usr/bin/chromium`. Fuera de él puedes usar `CHROMIUM_PATH=/ruta/al/navegador npm run test:e2e` o instalar el navegador de Playwright con `npx playwright install chromium`. No requiere ese navegador para jugar, compilar ni ejecutar los tests de lógica.

`npm run preview` sirve `dist`. Añade `?debug` al abrir el juego para mostrar +10 XP, selector del banco de 18 técnicas, preparación de evolución, desbloqueo de formas y el puente de pruebas `window.__MAREA_DEBUG__` (documentado en el GDD). No aparece en modo normal.

## Documentación

- [Diseño y decisiones](docs/GDD.md)
- [Progreso y pendientes](PROGRESO.md)
- [Catálogo y recetas de combate](docs/COMBATE.md)
- [Contrato de recursos](docs/ASSETS.md)
- [Publicación en GitHub Pages](docs/PUBLICAR.md)

Los modelos jugables usan atlas ilustrados propios; el arte procedural anterior queda como reserva. Retratos de reserva originales de [gshklovs/opshell](https://github.com/gshklovs/opshell), licencia MIT conservada en `public/licenses/`. Cuerpos, animaciones y enemigos adaptados para el juego. Puedes añadir tus atlas PNG siguiendo [ASSETS.md](docs/ASSETS.md). No incluye sprites extraídos de juegos oficiales, backend ni credenciales. Los cambios se entregan por fases en GitHub después de pasar build y tests.
