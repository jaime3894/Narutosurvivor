# Marea de aventuras

Survivor pirata web de One Piece. **Supervivencia continua:** zonas cada cuatro minutos, grietas con jefes, técnicas vinculadas e Imu al minuto 60. Diez capitanes con tres formas, 18 técnicas y 14 pasivos. Monedas globales y entrenamiento propio por capitán. Las misiones cortas de East Blue y Alabasta siguen disponibles como práctica. Arte original creado para el juego; no contiene sprites oficiales extraídos.

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
- Recoge cristales para ganar experiencia, carne para curarte y cofres para elegir una de tres recompensas.
- En supervivencia: rompe barriles con ataques o embestida, recoge suministros y permanece tres segundos cerca de una caja fuerte para abrirla.
- Fusileros anuncian sus tiros; árboles y piedras sirven de cobertura. Flanquea a los guardias y prioriza a los oficiales que curan.
- La cuenta comparte berries entre todos los capitanes; las mejoras compradas pertenecen al capitán elegido.
- Evolución: técnica rango 5 + pasivo vinculado rango 2 + un cofre después de 01:00. Las recetas están en el **Cuaderno de combate** del puerto.
- Luffy base tiene postura neutral y seis poses de carrera. En el selector: **De pie**, **Correr** y **Golpe de goma** para demostrar el brazo texturizado y conectado.
- Las formas se desbloquean y seleccionan automáticamente al dominar sus técnicas a 5/5. Luffy: Pistol → Gear Second; después Gatling → Gear Fourth. No hay consumo de energía. **F** permite alternar los estilos ya disponibles. Consulta el siguiente requisito en la pausa.
- Cada capitán solo aprende sus técnicas. Los nakama siguen al capitán y atacan con su propia arma; no ocupan huecos de su build.
- En móvil: arrastra sobre la arena y usa el botón Embestir. Controles táctiles definitivos y mando en fase 6.

## Comprobaciones

```sh
npm test
npm run build
npm run test:e2e
```

`npm test` verifica lógica, recursos, migración de monedas, colisiones, objetivos, roles e Imu. Incluye partidas completas sin restaurar salud, una simulación de 61 minutos con entrenamiento máximo y dos nakama, y una escena sintética de estrés con 150 enemigos. La prueba larga puede tardar varios minutos. `npm run test:e2e` comprueba el build real, móvil, ajustes, compras, cofres, vínculos y las tres fases de Imu. Los recorridos largos de interfaz usan depuración y no demuestran balance de una hora.

El entorno cloud ya tiene Chromium en `/usr/bin/chromium`. Fuera de él puedes usar `CHROMIUM_PATH=/ruta/al/navegador npm run test:e2e` o instalar el navegador de Playwright con `npx playwright install chromium`. No requiere ese navegador para jugar, compilar ni ejecutar los tests de lógica.

`npm run preview` sirve `dist`. Añade `?debug` al abrir el juego para mostrar +10 XP, selector del banco de 18 técnicas, preparación de evolución, desbloqueo de formas y el puente de pruebas `window.__MAREA_DEBUG__` (documentado en el GDD). No aparece en modo normal.

## Documentación

- [Diseño y decisiones](docs/GDD.md)
- [Progreso y pendientes](PROGRESO.md)
- [Catálogo y recetas de combate](docs/COMBATE.md)
- [Contrato de recursos](docs/ASSETS.md)
- [Publicación en GitHub Pages](docs/PUBLICAR.md)

Los modelos jugables usan atlas ilustrados propios; el arte procedural anterior queda como reserva. Retratos de reserva originales de [gshklovs/opshell](https://github.com/gshklovs/opshell), licencia MIT conservada en `public/licenses/`. Cuerpos, animaciones y enemigos adaptados para el juego. Puedes añadir tus atlas PNG siguiendo [ASSETS.md](docs/ASSETS.md). No incluye sprites extraídos de juegos oficiales, backend ni credenciales. Los cambios se entregan por fases en GitHub después de pasar build y tests.
