# Marea de aventuras — GDD

## Alcance y supuestos

El fragmento recibido empieza al final de la fase 1. No incluye la definición de fase 0, el catálogo de armas/pasivos ni los pilares originales. Se interpreta fase 0 como cimientos técnicos y documentación, sin inventar un catálogo definitivo. El repositorio conserva su nombre Narutosurvivor; el título provisional de interfaz es Marea de aventuras, coherente con el tema pirata solicitado.

## Pilares provisionales

- Movimiento inmediato, impactos legibles y decisiones frecuentes.
- Una sesión debe resultar divertida durante cinco minutos antes de ampliar contenido.
- Claridad visual bajo presión; priorizar pulido del núcleo sobre cantidad.
- Arte procedural original, sin recursos oficiales descargados.

## Decisiones técnicas

Aplicación web con Vite, TypeScript estricto y Canvas 2D: despliegue estático y futuro soporte móvil sin motor pesado. No hay servicios externos, secretos ni backend. Vitest verifica lógica independiente del navegador. Entidades por componentes opcionales; configuración en src/data y render en src/render. La fase 1 implementa integración temporal y bucle de simulación. Paso fijo objetivo: 60 Hz, render separado y acumulador limitado para evitar saltos al volver de otra pestaña.

La portada conserva una isla procedural con semilla reproducible. Su botón inicia una partida en la arena de fase 1. La depuración es opcional y se describe más abajo.

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

## Fase 1 — núcleo implementado

### Bucle y ritmo

Partidas de cinco minutos en una arena de 2400×1800 unidades. La costa limita el movimiento; las ruinas son decorativas. Simulación fija a 60 Hz y acumulación máxima de 100 ms por fotograma: al volver de una pestaña no se ejecutan segundos de daño atrasado. La cámara sigue suavemente, se limita a la isla y adapta la anchura lógica a la vista móvil, evitando recortar el combate.

La velocidad base es 215 unidades/s; las diagonales se normalizan. WASD, ZQSD y flechas mueven. Espacio embiste a 740 unidades/s durante 180 ms, con 2,6 s de enfriamiento. La embestida concede invulnerabilidad breve y derrota enemigos al contacto, incluidos los brutos: una herramienta potente pero temporal para romper cercos. Su dirección queda fijada mientras dura. Los botones de la interfaz permiten pausar y embestir; arrastrar desde un punto de la arena ofrece control táctil básico. El mando y el joystick visual quedan para fase 6.

Ataque automático al objetivo más próximo a menos de 520 unidades. Proyectiles con velocidad 640, cadencia inicial 650 ms y colisión por segmento para evitar atravesar enemigos entre pasos. Daño visible, destellos, empuje, estelas, partículas de eliminación y sacudida breve al recibir daño. Se respeta reducción de movimiento. El resto del juice y el audio se ampliarán en sus fases.

### Enemigos y progresión

Marineros desde el inicio; corredores después de 25 s; brutos después de 75 s. Aumentan frecuencia, número, vida y velocidad según tiempo; las variantes y parámetros viven en src/data/combat.ts. Esto es un escalado provisional de fase 1, no el director por datos completo ni el contenido de East Blue de fase 4. El spawn mantiene al menos 550 unidades de distancia incluso cerca de las esquinas.

Recoger cristales, en vez de ganar experiencia al matar, obliga a volver sobre el terreno y escoger rutas. Seis mejoras provisionales: daño, cadencia, multidisparo, velocidad, atracción y vitalidad. No representan todavía las 18 armas y 14 pasivos de fase 2. Cada nivel ofrece tres opciones diferentes sin rangos agotados. Requisito de XP: 6 + 4 × nivel + floor(1,1 × (nivel − 1)²); se añade crecimiento cuadrático para evitar interrupciones constantes al final. La experiencia sobrante se conserva y encadena elecciones si procede. Un alimento de 18 HP cada 18 bajas permite recuperarse tomando riesgos para recogerlo.

Los límites de 150 enemigos, 240 recogibles y 180 efectos acotan costes. La experiencia sobrante se fusiona con un cristal existente al alcanzar el límite de recogibles, sin perder valor. No se afirma validación de estrés: corresponde a fase 6.

### Estados, resultados y depuración

Estados explícitos: jugando, pausa, mejora, victoria y derrota. Pausa manual con P/Escape; pausa automática al perder foco o esconder pestaña. Las mejoras detienen el mundo y permiten elegir con 1/2/3. Los diálogos reciben foco y mantienen la navegación por Tab dentro de sus botones. Al morir o llegar a 05:00 aparecen duración, bajas, nivel, daño y build; se puede reintentar o volver al puerto. Reiniciar crea un estado nuevo sin conservar mejoras ni callbacks anteriores.

?debug habilita +10 XP y window.**MAREA_DEBUG**: snapshot, advance, grantXp, setHealth y choose. No existe ese puente en modo normal. advance usa el mismo paso fijo; se detiene en elecciones y resultados. La prueba de victoria en navegador restaura salud mediante depuración para verificar la pantalla; no se usa como evidencia de balance. Los tres pilotos de simulación sí recorren cinco minutos sin alterar salud, enemigos ni reglas: recogen experiencia, priorizan curación si falta vida y evitan contactos.

### Validación y límite del criterio de diversión

Los tests verifican mecánicas y partidas completas, no sensaciones humanas. Tres semillas (3894, 42, 123) sobreviven con un piloto automático: 1267/1286/1221 bajas, niveles 18/18/17. El build real se comprueba en Chromium con movimiento, pausa, selección, derrota/reinicio, victoria asistida y vista móvil. Se ha inspeccionado visualmente la interfaz en escritorio y móvil. Falta una partida humana de cinco minutos para aceptar «es divertido»; no se da por cumplido ese criterio con automatización. Antes de ampliar contenido, revisar respuesta del movimiento, utilidad de embestir, claridad de amenazas, frecuencia de elecciones y deseo de repetir.
