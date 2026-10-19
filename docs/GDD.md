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

## Referencia aportada por el usuario: PokéSurvivor

Repositorio: https://github.com/JPTER78/pokesurvivor. Revisados README, GDD y los sistemas de combate y aparición de enemigos. Se usa como referencia de diseño; no se incorpora código ni assets. Nuestra implementación sigue en TypeScript estricto con recursos procedurales originales.

Aspectos útiles para las siguientes iteraciones: familias de ataques con comportamientos distintos (fase 2), terreno e interacciones que dan motivos para explorar (fase 4) y cambios de ritmo mediante oleadas concentradas (director de fase 4). La densidad de enemigos debe servir a la legibilidad y al movimiento. La referencia no implica añadir ahora cuentas, multijugador ni su gacha, ni saltarse las fases previstas. Antes de ampliar contenido se mantiene la prioridad de pulir el núcleo de cinco minutos.

## Identidad de One Piece y animaciones de técnicas

Requisito del usuario: la identidad del personaje debe reconocerse tanto en la técnica como en su ejecución visual. PokéSurvivor inspira estructura y sensaciones; no determina nuestros poderes. Cada técnica debe declarar personajes y formas compatibles. El azar de mejoras, las afinidades y las evoluciones respetarán esa compatibilidad: Luffy no recibe ataques de agua; una técnica exclusiva no se convierte en un ataque universal por compartir estadísticas.

| Personaje | Lenguaje visual de sus técnicas |
| --- | --- |
| Luffy | Postura de preparación, brazo conectado al hombro que se estira, puño que conecta y retracción elástica. Patadas y ráfagas usan sus extremidades y las particularidades de la forma desbloqueada. |
| Zoro | Preparación con sus espadas, movimiento de las hojas y arcos de corte sincronizados; los cortes a distancia solo en técnicas que los justifiquen. |
| Nami | Gesto con Clima-Tact, formación del fenómeno meteorológico y descarga; las nubes y rayos tienen origen y secuencia visibles. |
| Usopp | Tensado del tirachinas, suelta y munición identificable; cada munición muestra su efecto propio al impactar. |
| Sanji | Anticipación corporal, giro o extensión de pierna, impacto de patada y recuperación. El fuego requiere su técnica o forma correspondiente. |
| Chopper | Cambio de silueta según la forma, preparación corporal y golpes coherentes con esa anatomía. |
| Robin | Aparición reconocible de brazos o piernas, acción coordinada e impacto, seguida de desaparición; no proyectiles genéricos. |
| Franky | Apertura o preparación del mecanismo, postura de disparo y cañón o rayo con origen visible; los efectos dependen de la técnica. |
| Brook | Desenvaine o postura de esgrima, desplazamiento y corte; hielo o efectos de alma solo cuando estén habilitados. |
| Jinbe | Posturas y golpes de karate gyojin; el agua, cuando corresponda, sigue el gesto y la técnica. |

Esto define el lenguaje de animación, no desbloquea ahora personajes, formas o técnicas de fases posteriores. El catálogo exacto y sus restricciones se concretan en fase 2; personajes, formas y animaciones específicas se integran en fase 3, siguiendo el orden acordado. Fase 2 debe dejar listo el contrato de anticipación, fase activa, impacto y recuperación para que cada técnica tenga una representación propia. No se da por terminada una técnica de personaje si solo funciona su daño y su presentación sigue siendo una bola genérica.

### Criterios visuales y temporales

- Cada ataque posee preparación, ejecución e impacto, y recuperación. El daño se vincula al momento o intervalo activo de la simulación; no se aplica al comenzar una animación que aún no ha conectado.
- En un puñetazo de goma se ve la continuidad hombro–brazo–puño durante extensión y retracción, incluso al cambiar de dirección. No es un puño desconectado que viaja como una bala. El alcance y la colisión siguen la técnica, no el tamaño de un sprite ornamental.
- Los ataques dirigidos conservan una dirección u objetivo de impacto coherente durante su ejecución. Si el objetivo desaparece, la animación termina sin saltos hacia otro enemigo ni daño duplicado.
- Multigolpes y técnicas simultáneas pueden compartir recursos de render, pero cada impacto conserva su origen, timing y lectura. Cadencia, número de golpes y evoluciones no autorizan reemplazar la anatomía por puntos o destellos indistinguibles.
- Pixel art sí; técnicas indistinguibles hechas con las mismas bolitas de distinto color, no. Los proyectiles son válidos para munición, disparos o técnicas que realmente lo sean, con silueta y efecto propios.
- La reducción de movimiento atenúa sacudidas y partículas; mantiene la animación funcional y las señales necesarias para leer el ataque.
- Se revisan en movimiento normal y lento, en varias direcciones y con varios enemigos. Los tests verifican eventos de daño y estados; la revisión visual verifica postura, continuidad y carácter reconocible.

Se usarán dibujos procedurales articulados y assets propios cuando estén disponibles. La ausencia de atlas no elimina este requisito: el fallback también debe representar la acción del personaje. No se descargarán ni integrarán sprites, animaciones, música o logotipos extraídos de obras oficiales. Los proyectiles de la fase 1 son un mecanismo provisional del prototipo y no representan el ataque definitivo de Luffy.
