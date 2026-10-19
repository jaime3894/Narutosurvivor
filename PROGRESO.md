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

- Fase 2: 18 armas, 14 pasivos, cofres, evoluciones, afinidades, recogibles y juice completo. Definir los catálogos en datos antes de implementarlos: faltan en el fragmento original recibido.
- Fase 3: personajes, formas, innatos y nakama.
- Fase 4: islas, minijefes, jefes, director por datos y Buster Call. La arena actual no representa East Blue completa.
- Fase 5: meta-progresión y guardado versionado; las partidas actuales no se guardan al recargar.
- Fase 6: audio, i18n, controles táctiles definitivos/mando, PWA, accesibilidad completa y estrés.
- Fase 7: gacha solo para depuración y tests de distribución.
- Fase 8: frutas, diarios, Infinito y Nuevo Mundo.
- Cargador de atlas propios con fallback al integrar personajes; contrato en docs/ASSETS.md.

## Entrega en GitHub

Por indicación del usuario, trabajar en cloud y subir cada fase a jaime3894/Narutosurvivor. Antes de entregar: tests, build, E2E pertinentes, registrar pendientes y crear un commit de fase. Publicar sin forzar ni sobrescribir trabajo remoto.

## Información incompleta

El mensaje inicial recibido empieza al final de la fase 1; no contiene la definición original de fase 0 ni el inicio del GDD. Los supuestos se registran en docs/GDD.md sin bloquear el desarrollo.
