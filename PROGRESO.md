# Progreso

## FASE 0 — base publicada

Proyecto Vite/TypeScript estricto, scripts, lockfile, composición de entidades, aleatoriedad reproducible, portada procedural, GDD y contrato de assets. Publicada en GitHub: 131f5fc.

## FASE 1 — núcleo implementado

- Movimiento normalizado, costa, cámara suave limitada a la isla y bucle fijo 60 Hz.
- Ataque automático con proyectiles, daño, empuje, destellos, partículas y embestida invulnerable con enfriamiento.
- Tres clases de enemigo con presión creciente; cristales, atracción y alimentos.
- Experiencia, seis mejoras provisionales, elecciones de tres opciones y rangos máximos.
- HUD, pausa manual/automática, victoria a 05:00, derrota, resultados, build y reinicio limpio.
- Arrastre básico en móvil, selección por teclado, foco en diálogos, reducción de movimiento y herramientas ?debug.

### Verificación

- 17 tests de lógica aprobados. Tres partidas simuladas de 300 s con reglas reales: 1267/1286/1221 bajas, nivel 18/18/17. El piloto no restaura vida ni modifica reglas; busca alimentos si necesita curarse.
- Tipos estrictos y build aprobados.
- 4 E2E aprobados en Chromium sobre el build: movimiento/pausa/mejora/derrota/reinicio, victoria asistida por depuración, vista móvil con arrastre y selección, y ausencia de herramientas de debug en modo normal.
- Render de escritorio y móvil inspeccionado; sin errores de JavaScript en la comprobación visual.

### Aceptación pendiente

«Es divertido cinco minutos» requiere jugar una partida humana. La automatización demuestra funcionamiento y viabilidad, no diversión. Probar antes de ampliar contenido; ajustar el núcleo según las sensaciones. No se ha probado en móviles físicos ni con mando. El audio, el catálogo completo y el director de islas aún no corresponden a esta fase.

## Próximas fases

- Fase 2: implementada; ver entrega más abajo. Catálogo propio documentado porque no figuraba en el fragmento recibido.
- Fase 3: personajes, formas, innatos y nakama.
- Fase 4: islas, minijefes, jefes, director por datos y Buster Call. La arena actual no representa East Blue completa.
- Fase 5: meta-progresión y guardado versionado; las partidas actuales no se guardan al recargar.
- Fase 6: audio, i18n, controles táctiles definitivos/mando, PWA, accesibilidad completa y estrés.
- Fase 7: gacha solo para depuración y tests de distribución.
- Fase 8: frutas, diarios, Infinito y Nuevo Mundo.
- Cargador de atlas propios con fallback al integrar personajes; contrato en docs/ASSETS.md.

## Entrega en GitHub

Por indicación del usuario, trabajar en cloud y subir cada fase a jaime3894/One-piece-survivor (nombre actual del repositorio). Antes de entregar: tests, build, E2E pertinentes, registrar pendientes y crear un commit de fase. Publicar sin forzar ni sobrescribir trabajo remoto.

## Información incompleta

El mensaje inicial recibido empieza al final de la fase 1; no contiene la definición original de fase 0 ni el inicio del GDD. Los supuestos se registran en docs/GDD.md sin bloquear el desarrollo.

## Requisitos de identidad y animación confirmados

- Mantener las técnicas fieles a One Piece y a cada personaje/forma: por ejemplo, Luffy no utiliza ataques de agua. El catálogo de fase 2 debe incluir restricciones explícitas, también para mejoras y evoluciones.
- El usuario pide animación corporal reconocible para todos: extensión e impacto/retracción del brazo de Luffy, cortes de Zoro, patadas de Sanji, etc. No sustituir estas acciones por bolas genéricas.
- Fase 2 prepara el contrato temporal y visual de técnicas; fase 3 integra los personajes y formas con sus animaciones. El fallback procedural debe cumplir el mismo criterio aunque aún no haya atlas propios.
- Registro previo a fase 2: los disparos de fase 1 eran provisionales. En fase 2 se han sustituido por extremidades animadas; el arte definitivo sigue pendiente de fase 3.

## Referencia visual de personajes confirmada

El usuario pide sprites de One Piece con el nivel de detalle, volumen y animación de la captura de PokéSurvivor que aportó. Los muñecos de fase 1 son placeholders; no cumplen el objetivo final. En fase 3 se preparará primero un Luffy piloto reconocible en reposo, caminar y golpe de goma, antes de extender el acabado al reparto. Criterios y adaptación del tamaño de atlas documentados en GDD y ASSETS. Este cambio solo registra requisitos, sin implementar ni dar por aprobados los modelos finales.

## FASE 2 — contenido de combate implementado

- 18 técnicas por propietario, con ejecución, animación procedural y receta de evolución; 14 pasivos con efectos aplicados. Catálogo completo en docs/COMBATE.md.
- Cuatro huecos de técnica y seis de pasivo, rangos máximos, ofertas sin duplicados y rechazo de técnicas ajenas. Luffy solo utiliza sus técnicas de goma.
- Cofres de 1/3/5 premios, evolución condicionada a técnica 5 + pasivo 2 + 60 s, pantalla de botín pausada y entrega una sola vez.
- Afinidades por grupos, berries de partida, carne, cristales, imán, barril e impulso; límites de entidades conservados.
- Extremidades conectadas, ráfagas, barridos, torso inflado y torsión de Rifle; efectos de daño, críticos, recogida, nivel, evolución, explosión y cofres.
- Cuaderno con las 18 técnicas, 14 pasivos y sus recetas; build y afinidades visibles en HUD; banco de técnicas con ?debug.

### Verificación de FASE 2

82 tests de lógica y siete E2E aprobados durante la implementación; build y tipos estrictos aprobados. Tres simulaciones de cinco minutos con reglas normales siguen sobreviviendo. Se han inspeccionado capturas de Pistol conectado y evolución a Rifle en escritorio y móvil, sin errores de render. Comprobación final repetida tras el formateo: todos los comandos aprobados.

### Límites y siguientes fases

Los modelos y atlas definitivos, las tres formas, innatos, selección de los diez personajes y nakama siguen en fase 3. Para probar todas las técnicas antes de eso, el banco de depuración cambia también el propietario; no convierte a Luffy en usuario de ataques ajenos. Las evoluciones del catálogo no desbloquean Gears ni otras formas. Audio y ajustes completos siguen en fase 6; guardado de berries de cuenta en fase 5. La diversión humana sigue pendiente de evaluación. No se han descargado recursos oficiales.

## Publicación web — completada

Juego disponible en https://jaime3894.github.io/One-piece-survivor/ . El usuario hizo público el repositorio y seleccionó GitHub Actions como Source de Pages. La ejecución 39228910746 terminó correctamente en validación y despliegue. GitHub ejecutó tests, build y ocho E2E, incluida la prueba de la ruta /One-piece-survivor/.

Verificación pública: HTML HTTP 200 con título correcto; JS y CSS descargados con verificación TLS normal, idénticos al build local validado. Chromium del cloud no pudo completar la navegación HTTPS directa por el certificado del proxy; esa comprobación queda diferenciada de los E2E del build y de las peticiones HTTPS satisfactorias. No se deshabilitó la verificación TLS.

El workflow publica cada push a main después de pasar los checks. Instrucciones y enlace en README.md y docs/PUBLICAR.md. No cambia el alcance de FASE 2 ni adelanta FASE 3.

Nombre actual del repositorio: jaime3894/One-piece-survivor. Origin actualizado y commits confirmados por Git. El checkout local conserva /workspace/Narutosurvivor. Los bloqueos previos de red, repositorio privado y activación de Pages ya se resolvieron para este despliegue; no queda una acción del usuario pendiente para abrir la web.
