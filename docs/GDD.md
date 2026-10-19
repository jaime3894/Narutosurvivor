# Marea de aventuras — GDD

## Alcance y supuestos
El fragmento recibido empieza al final de la fase 1. No incluye la definición de fase 0, el catálogo de armas/pasivos ni los pilares originales. Se interpreta fase 0 como cimientos técnicos y documentación, sin inventar un catálogo definitivo. El repositorio conserva su nombre Narutosurvivor; el título provisional de interfaz es Marea de aventuras, coherente con el tema pirata solicitado.

## Pilares provisionales
- Movimiento inmediato, impactos legibles y decisiones frecuentes.
- Una sesión debe resultar divertida durante cinco minutos antes de ampliar contenido.
- Claridad visual bajo presión; priorizar pulido del núcleo sobre cantidad.
- Arte procedural original, sin recursos oficiales descargados.

## Decisiones técnicas
Aplicación web con Vite, TypeScript estricto y Canvas 2D: despliegue estático y futuro soporte móvil sin motor pesado. No hay servicios externos, secretos ni backend. Vitest verifica lógica independiente del navegador. Entidades por componentes opcionales; configuración en src/data y render en src/render. La integración temporal está preparada y probada; el bucle de simulación llegará con el combate. Paso fijo objetivo: 60 Hz, render separado y acumulador limitado para evitar saltos al volver de otra pestaña.

El generador de isla usa semilla reproducible. No es un mapa jugable todavía. La pantalla inicial comunica el estado real: el botón navega a la descripción del proyecto; no promete iniciar una partida. ?debug solo muestra metadatos en esta fase.

## Hoja de ruta
0. Herramientas, arquitectura mínima, arte procedural y documentación.
1. Movimiento, cámara, enemigos, ataque automático, experiencia, subida de nivel, pausa y resultados. Validar cinco minutos de juego; este alcance es provisional por faltar el inicio del prompt.
2. 18 armas, 14 pasivos, cofres, evoluciones, afinidades, recogibles y efectos de impacto. Definir catálogos antes de implementarlos.
3. Los 10 Sombrero de Paja, tres formas por personaje, innatos y nakama con sinergias.
4. East Blue y Alabasta, minijefes, jefes, director por datos y Buster Call; luego otras islas.
5. Thousand Sunny, tienda, recompensa de cuenta, logros, Codex, guardado versionado y mapa.
6. UI, audio, ajustes, idiomas, táctil, mando, PWA, accesibilidad y estrés.
7. Gacha interno con datos, distribución y depuración; al jugador: Próximamente.
8. Frutas del Diablo, diarios, Infinito y Nuevo Mundo.

## Criterios de aceptación
Fase 0: instalación reproducible, tipos y build válidos, pruebas de lógica, página inicial servida y ruta de assets documentada. No se considera demostrado el criterio de diversión con una pantalla inicial. Fase 1 debe medirse mediante partidas reales de cinco minutos y ajustes de ritmo, respuesta e impactos; no basta una simulación mental.
