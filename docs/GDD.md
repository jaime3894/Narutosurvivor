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

?debug habilita +10 XP y `window.__MAREA_DEBUG__`: snapshot, advance, grantXp, setHealth y choose. No existe ese puente en modo normal. advance usa el mismo paso fijo; se detiene en elecciones y resultados. La prueba de victoria en navegador restaura salud mediante depuración para verificar la pantalla; no se usa como evidencia de balance. Los tres pilotos de simulación sí recorren cinco minutos sin alterar salud, enemigos ni reglas: recogen experiencia, priorizan curación si falta vida y evitan contactos.

### Validación y límite del criterio de diversión

Los tests verifican mecánicas y partidas completas, no sensaciones humanas. Tres semillas (3894, 42, 123) sobreviven con un piloto automático: 1267/1286/1221 bajas, niveles 18/18/17. El build real se comprueba en Chromium con movimiento, pausa, selección, derrota/reinicio, victoria asistida y vista móvil. Se ha inspeccionado visualmente la interfaz en escritorio y móvil. Falta una partida humana de cinco minutos para aceptar «es divertido»; no se da por cumplido ese criterio con automatización. Antes de ampliar contenido, revisar respuesta del movimiento, utilidad de embestir, claridad de amenazas, frecuencia de elecciones y deseo de repetir.

## Referencia aportada por el usuario: PokéSurvivor

Repositorio: https://github.com/JPTER78/pokesurvivor. Revisados README, GDD y los sistemas de combate y aparición de enemigos. Se usa como referencia de diseño; no se incorpora código ni assets. Nuestra implementación sigue en TypeScript estricto con recursos procedurales originales.

Aspectos útiles para las siguientes iteraciones: familias de ataques con comportamientos distintos (fase 2), terreno e interacciones que dan motivos para explorar (fase 4) y cambios de ritmo mediante oleadas concentradas (director de fase 4). La densidad de enemigos debe servir a la legibilidad y al movimiento. La referencia no implica añadir ahora cuentas, multijugador ni su gacha, ni saltarse las fases previstas. Antes de ampliar contenido se mantiene la prioridad de pulir el núcleo de cinco minutos.

## Identidad de One Piece y animaciones de técnicas

Requisito del usuario: la identidad del personaje debe reconocerse tanto en la técnica como en su ejecución visual. PokéSurvivor inspira estructura y sensaciones; no determina nuestros poderes. Cada técnica debe declarar personajes y formas compatibles. El azar de mejoras, las afinidades y las evoluciones respetarán esa compatibilidad: Luffy no recibe ataques de agua; una técnica exclusiva no se convierte en un ataque universal por compartir estadísticas.

| Personaje | Lenguaje visual de sus técnicas                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Luffy     | Postura de preparación, brazo conectado al hombro que se estira, puño que conecta y retracción elástica. Patadas y ráfagas usan sus extremidades y las particularidades de la forma desbloqueada. |
| Zoro      | Preparación con sus espadas, movimiento de las hojas y arcos de corte sincronizados; los cortes a distancia solo en técnicas que los justifiquen.                                                 |
| Nami      | Gesto con Clima-Tact, formación del fenómeno meteorológico y descarga; las nubes y rayos tienen origen y secuencia visibles.                                                                      |
| Usopp     | Tensado del tirachinas, suelta y munición identificable; cada munición muestra su efecto propio al impactar.                                                                                      |
| Sanji     | Anticipación corporal, giro o extensión de pierna, impacto de patada y recuperación. El fuego requiere su técnica o forma correspondiente.                                                        |
| Chopper   | Cambio de silueta según la forma, preparación corporal y golpes coherentes con esa anatomía.                                                                                                      |
| Robin     | Aparición reconocible de brazos o piernas, acción coordinada e impacto, seguida de desaparición; no proyectiles genéricos.                                                                        |
| Franky    | Apertura o preparación del mecanismo, postura de disparo y cañón o rayo con origen visible; los efectos dependen de la técnica.                                                                   |
| Brook     | Desenvaine o postura de esgrima, desplazamiento y corte; hielo o efectos de alma solo cuando estén habilitados.                                                                                   |
| Jinbe     | Posturas y golpes de karate gyojin; el agua, cuando corresponda, sigue el gesto y la técnica.                                                                                                     |

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

## Dirección de arte de personajes — referencia visual del usuario

El usuario aporta una captura de PokéSurvivor como referencia de calidad de sprites: personajes con silueta propia, perspectiva cenital de tres cuartos, volumen y sombreado pixel art. Se toma el nivel de acabado y legibilidad, no los diseños de Pokémon. Nuestro reparto es el de One Piece; la apariencia debe expresar personaje, vestuario y forma aun sin etiquetas ni efectos de combate.

Los personajes actuales son placeholders de fase 1, no modelos definitivos ni una muestra del acabado aprobado. No se considerará resuelto el arte cambiando el color de un mismo muñeco rectangular para todo el reparto. Luffy necesita sombrero de paja con cinta, pelo negro, chaleco, pantalones cortos, sandalias y proporciones reconocibles; Zoro, pelo, vestuario y espadas; Sanji, silueta, peinado y traje. Los demás tienen el mismo requisito de identidad propia. Vestuario y rasgos se ajustarán a la versión o forma representada.

La dirección mantiene figuras chibi expresivas, contornos selectivos, paletas coherentes, luces y sombras con intención, sombra de contacto y escala consistente con el escenario. Idle, caminar, atacar y recibir daño son estados distintos; no basta desplazar un dibujo rígido arriba y abajo. Las extremidades y armas se animan en conjunto con las técnicas descritas antes.

Se conserva 32×32 como punto de partida del contrato, no como límite que obligue a perder rasgos. Se permiten celdas mayores por personaje o forma con metadatos explícitos y un ancla común a los pies, sin estirar ni deformar la imagen. La resolución elegida debe verse bien a la escala real de juego, en movimiento y con varias entidades en pantalla. La ampliación del pixel art debe ser nítida y uniforme.

Antes de producir todo el reparto en fase 3, crear y revisar un personaje piloto de Luffy en reposo, caminando y ejecutando un golpe de goma. Validar identidad, proporciones, perspectiva y continuidad del brazo tanto de cerca como dentro de una partida. Después aplicar el acabado al resto. La fase 2 prepara técnicas y compatibilidad; esta exigencia no adelanta la implementación de los diez personajes ni modifica el orden de fases. Recursos originales dibujados o generados para el proyecto y assets propios del usuario; sin extracción de sprites oficiales.

## Fase 2 — contenido de combate implementado

La fase 2 reemplaza las mejoras y los disparos provisionales de fase 1. Catálogo, números y recetas completos en [COMBATE.md](COMBATE.md); la fuente de verdad es src/data/content.ts. Se han implementado 18 técnicas para los diez propietarios y 14 pasivos, además de cofres, evoluciones, afinidades y seis clases de recogible. Los nombres y cifras son decisiones de diseño propias: el fragmento recibido no incluía un catálogo cerrado. Las evoluciones con sufijos descriptivos no se presentan como nuevas técnicas canónicas ni desbloquean transformaciones.

En modo normal se mantiene Luffy como actor de desarrollo y solo puede adquirir sus cinco técnicas, con cuatro huecos disponibles para elegir build. El resto de propietarios tiene su ejecución y compatibilidad comprobables en el banco ?debug; no se anticipa la selección de personajes, formas, innatos ni nakama de fase 3. Luffy no recibe agua, fuego ni armas ajenas. Las afinidades agrupan técnicas/pasivos para aplicar estadísticas, sin cambiar poderes. La pólvora es un recogible ambiental identificado como barril, no una técnica elemental de Luffy.

La simulación se separa en reglas, progresión, técnicas y botín. Cada técnica declara anticipación, fase activa y recuperación; los impactos se disparan en el paso fijo de simulación, una vez por evento. Los proyectiles reales solo se usan donde corresponden (munición de Usopp). Pistol y Gatling mantienen el brazo conectado al hombro y visible durante extensión y retracción; Muchi comprueba el barrido de la pierna en movimiento y evita repetir daño por fotograma. La cadencia tiene como mínimo la duración de la animación completa para conservar su lectura.

Los cofres ofrecen 1/3/5 premios y pausan mientras se muestra el botín. Una evolución requiere rango 5 de técnica, rango 2 del pasivo vinculado y tiempo >=60 s; se aplica desde un premio del cofre y nunca se repite. El primer cofre llega a 35 s: permite una mejora temprana o reservarlo para evolucionar más tarde. La suerte aumenta la probabilidad de cofres de varios premios, sin tocar tiradas de gacha futuras. Las berries son de la partida; guardado y recompensa de cuenta permanecen en fase 5.

Se conserva el render procedural original, ahora con poses y extremidades de ataque en vez de bolas genéricas para Luffy. Es una presentación funcional del combate, no la aprobación del arte final pedido por el usuario. Los atlas, modelos definitivos y variantes de forma siguen pendientes de fase 3. Las capturas de COMBATE.md se tomaron en depuración y no acreditan balance ni calidad final del reparto.

Validación de esta entrega: 82 tests de lógica, incluidos ejecución y evolución de las 18 técnicas, los diez propietarios, límites de build, efectos de pasivos/recogibles, cofres y tres simulaciones de cinco minutos. Siete E2E comprueban el build, incluyendo el banco de 18 técnicas y una evolución recogiendo el cofre. La victoria E2E sigue usando restauración de salud para verificar la interfaz; las tres simulaciones de cinco minutos usan reglas normales. La aceptación subjetiva de diversión sigue requiriendo juego humano.

## Fase 3 — reglas y decisiones implementadas

Fuente de verdad: `src/data/crew.ts`. Los diez Sombrero de Paja se eligen como capitán antes de zarpar. Cada uno conserva su técnica inicial, catálogo exclusivo y un innato distinto. Las formas cambian estadísticas, silueta y presentación; Sanji aplica quemadura en estilos de fuego y Brook ralentiza con Soul Solid/Soul King. Luffy nunca obtiene fuego, hielo ni agua por cambiar de forma o reclutar compañeros.

Se interpretan «tres formas» como tres estilos jugables por personaje: no todos poseen tres transformaciones físicas canónicas. Nami usa Clima-Tact/Sorcery/Zeus; Usopp Tirachinas/Kabuto/Sogeking; Jinbe karate/guardia/maestro. Luffy tiene base/Gear Second/Boundman; Zoro una espada/Santoryu/Asura; Chopper Brain/Heavy/Monster; Sanji base/Diable/Ifrit; Robin base/Gigantesco/Demonio; Franky base/Battle/General; Brook músico/Soul Solid/Soul King. Este es un recorrido de combate del juego, no una cronología del anime.

El segundo estilo exige nivel 4 y consume 8 energía/s; el tercero nivel 8 y 15/s. Energía máxima 100, regeneración base 14/s solo en estilo inicial, mínimo 25 para activar y recarga de cambio 1,25 s. Volver a base siempre es posible durante combate y no cura. Al agotarse se vuelve automáticamente a base. Se cancelan ataques del capitán al cambiar; proyectiles ya emitidos conservan propietario y forma de origen. Pausas, cofres y elecciones congelan energía y compañeros. F recorre las formas disponibles; también hay botones táctiles con nivel requerido visible.

Dos nakama como máximo, distintos del capitán y entre sí. Siguen una formación a ambos lados, usan su arma inicial desde su propio cuerpo y no ocupan huecos de la build. Se mantienen en estilo base, sin salud propia. Su daño escala del 47% al 85% según nivel y su recarga es 2,6 veces la técnica normal. Chopper cura 6 cada 12 s y Sanji 4 cada 12 s. Diez parejas proporcionan sinergias; se consideran también parejas entre los dos apoyos. No hay ataques prestados al capitán.

Innatos: Luffy +10% alcance; Zoro +15% daño al primer tramo de vida (>70%); Nami +25% berries; Usopp +18% crítico a >180 unidades; Sanji cura 8 cada 20 bajas; Chopper +0,3 vida/s; Robin +3 XP cada 15 bajas; Franky +2 armadura; Brook revive una vez al 40% con 2 s de protección; Jinbe -20% recarga de embestida. Los innatos de economía, supervivencia y contador corresponden al capitán; los de técnica siguen al propietario del golpe. Crítico total limitado al 85%.

Arte: el permiso posterior del usuario para usar recursos gratuitos permite incorporar fan art original con licencia explícita. Se seleccionó `gshklovs/opshell`, commit fijado en los créditos, cuya licencia MIT incluye su arte original. Solo se copiaron paletas y retratos de los diez personajes. Rostros adaptados a cuerpos animados propios; atlas 64×80 con 15 cuadros por dirección. No se incorpora código del repositorio ni assets extraídos de juegos/anime. El sistema acepta atlas propios sin modificar simulación. Los enemigos actuales se visten como marines, banda de Buggy y matones de Alvida; sus jefes y patrones se reservan para fase 4.

La galería y el juego se revisaron tras corregir huecos de cuello, proporciones y el color de haki: el brazo elástico de Boundman usa negro/rojo, separado de la cadena metálica de Franky. El nivel de acabado definitivo sigue abierto a evaluación visual del usuario. Las simulaciones y E2E no sustituyen la prueba humana de cinco minutos.
