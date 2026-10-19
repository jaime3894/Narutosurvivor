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

Los cofres ofrecen tres opciones únicas y pausan hasta elegir una; no conceden mejoras antes de la selección. Una evolución requiere rango 5 de técnica, rango 2 del pasivo vinculado y tiempo >=60 s; se aplica desde un premio del cofre y nunca se repite. El primer cofre llega a 35 s: permite una mejora temprana o reservarlo para evolucionar más tarde. La suerte aumenta la cantidad de berries cuando se ofrecen como alternativa; no modifica el número de tarjetas ni las futuras tiradas de gacha. Las berries son de la partida; guardado y recompensa de cuenta permanecen en fase 5.

Se conserva el render procedural original, ahora con poses y extremidades de ataque en vez de bolas genéricas para Luffy. Es una presentación funcional del combate, no la aprobación del arte final pedido por el usuario. Los atlas, modelos definitivos y variantes de forma siguen pendientes de fase 3. Las capturas de COMBATE.md se tomaron en depuración y no acreditan balance ni calidad final del reparto.

Validación de esta entrega: 82 tests de lógica, incluidos ejecución y evolución de las 18 técnicas, los diez propietarios, límites de build, efectos de pasivos/recogibles, cofres y tres simulaciones de cinco minutos. Siete E2E comprueban el build, incluyendo el banco de 18 técnicas y una evolución recogiendo el cofre. La victoria E2E sigue usando restauración de salud para verificar la interfaz; las tres simulaciones de cinco minutos usan reglas normales. La aceptación subjetiva de diversión sigue requiriendo juego humano.

## Fase 3 — reglas y decisiones implementadas

Fuente de verdad: `src/data/crew.ts`. Los diez Sombrero de Paja se eligen como capitán antes de zarpar. Cada uno conserva su técnica inicial, catálogo exclusivo y un innato distinto. Las formas cambian estadísticas, silueta y presentación; Sanji aplica quemadura en estilos de fuego y Brook ralentiza con Soul Solid/Soul King. Luffy nunca obtiene fuego, hielo ni agua por cambiar de forma o reclutar compañeros.

Se interpretan «tres formas» como tres estilos jugables por personaje: no todos poseen tres transformaciones físicas canónicas. Nami usa Clima-Tact/Sorcery/Zeus; Usopp Tirachinas/Kabuto/Sogeking; Jinbe karate/guardia/maestro. Luffy tiene base/Gear Second/Boundman; Zoro Santoryu/Santoryu · Bandana/Asura; Chopper Brain/Heavy/Monster; Sanji base/Diable/Ifrit; Robin base/Gigantesco/Demonio; Franky base/Battle/General; Brook músico/Soul Solid/Soul King. Este es un recorrido de combate del juego, no una cronología del anime.

Las formas se activan automáticamente al alcanzar 5/5 en sus técnicas, sin requisito de nivel de cuenta ni consumo de energía. La segunda forma exige la técnica inicial a 5/5; la tercera exige además la segunda técnica propia a 5/5. Chopper, Robin, Franky, Brook y Jinbe solo tienen una técnica en el catálogo actual: para su tercera forma se exige evolucionarla, conservando el dominio 5/5. La tabla exacta está en `src/data/form-progression.ts`. Una forma conseguida permanece disponible toda la partida; F y los botones permiten escoger otra sin curar. La energía se muestra como ∞ y nunca provoca regreso a base. El cambio conserva su breve recarga de 1,25 s para que los gestos sean legibles. No hay costes de energía en técnicas ni embestida. Se cancelan ataques del capitán al transformar; los proyectiles emitidos conservan su fuente.

Dos nakama como máximo, distintos del capitán y entre sí. Siguen una formación a ambos lados, usan su arma inicial desde su propio cuerpo y no ocupan huecos de la build. Los apoyos usan su estilo base y no tienen salud propia. Su daño escala del 47% al 85% según nivel y su recarga es 2,6 veces la técnica normal. Chopper cura 6 cada 12 s y Sanji 4 cada 12 s. Diez parejas proporcionan sinergias; se consideran también parejas entre los dos apoyos. No hay ataques prestados al capitán.

Innatos: Luffy +10% alcance; Zoro +15% daño al primer tramo de vida (>70%); Nami +25% berries; Usopp +18% crítico a >180 unidades; Sanji cura 8 cada 20 bajas; Chopper +0,3 vida/s; Robin +3 XP cada 15 bajas; Franky +2 armadura; Brook revive una vez al 40% con 2 s de protección; Jinbe -20% recarga de embestida. Los innatos de economía, supervivencia y contador corresponden al capitán; los de técnica siguen al propietario del golpe. Crítico total limitado al 85%.

Arte: el permiso posterior del usuario para usar recursos gratuitos permite incorporar fan art original con licencia explícita. Se seleccionó `gshklovs/opshell`, commit fijado en los créditos, cuya licencia MIT incluye su arte original. Solo se copiaron paletas y retratos de los diez personajes. Rostros adaptados a cuerpos animados propios; atlas 64×80 con 15 cuadros por dirección. No se incorpora código del repositorio ni assets extraídos de juegos/anime. El sistema acepta atlas propios sin modificar simulación. Los enemigos actuales se visten como marines, banda de Buggy y matones de Alvida; sus jefes y patrones se reservan para fase 4.

La galería y el juego se revisaron tras corregir huecos de cuello, proporciones y el color de haki: el brazo elástico de Boundman usa negro/rojo, separado de la cadena metálica de Franky. El nivel de acabado definitivo sigue abierto a evaluación visual del usuario. Las simulaciones y E2E no sustituyen la prueba humana de cinco minutos.

## Revisión artística de FASE 3 solicitada por el usuario

El usuario rechazó el acabado de cabezas MIT sobre cuerpos construidos con elipses. La nueva referencia exige sprites 2D de cuerpo completo con anatomía, vestuario sombreado, siluetas y vistas distintas. No se avanza a fase 4 durante esta corrección.

Se buscaron fuentes de sprites en GitHub para los diez personajes y repositorios generales de pixel art de One Piece. `iscluis06/luffy_test`, `Shayan-Memon/fighting-game-goku-vs-luffy`, `Gabitob/Chopper-Idle-Game-1.0` y otros resultados no proporcionaban una licencia utilizable verificada para su arte; no se copiaron. La búsqueda web general por Bing fue rechazada por el proxy y no se presenta como una búsqueda completa de internet. `gshklovs/opshell` sí conservaba licencia explícita, pero sus retratos no resolvían el acabado corporal. Se opta por crear hojas propias con IA de imagen guiada por los rasgos de cada personaje, en lugar de continuar montando el mismo cuerpo procedural.

Se integran 33 atlas de 960×320: los 30 estilos y marines/piratas de Buggy/matones de Alvida. Las hojas maestras tienen tres pares de poses y cuatro filas de orientación. El compilador separa componentes de alfa y reasigna accesorios a la figura adecuada; no confía en que la generación haya respetado exactamente la cuadrícula. Se han corregido recortes de pies y restos del personaje vecino, y se han normalizado las vistas laterales de hojas inconsistentes. Los sprites pequeños conservan contorno, textura de pelo, ropa, armas y diferencias de forma. La altura de Chopper Brain Point es menor; la escala se adapta al ancho para conservar alas, espadas y brazos dentro de la celda.

Dos poses clave por orientación alimentan seis tiempos de marcha con cadencia legible; no se confunden con seis dibujos originales distintos. El ataque inclina y recupera el cuerpo según la edad de su técnica. La goma se une al hombro adaptado a la anatomía nueva; Gear Second utiliza piel rosada y Boundman haki oscuro con pulsación en multigolpes. Fusen conserva cabeza y pies del modelo. La munición de Usopp se dibuja a la altura del tirachinas, con la misma elevación visual que el origen de su técnica. Las técnicas y reglas de daño se mantienen.

El selector muestra el modelo jugable, para que la ilustración del menú no oculte un cuerpo básico durante la partida. Los PNG están versionados; los originales generados no son una dependencia del build ni requieren servicio de IA al jugar. Los 33 atlas pesan menos de 5 MB en total. El acabado se revisa en galería, combate y móvil; los tests comprueban carga, alfa, poses y ausencia de regresiones, no que el usuario haya aprobado la calidad artística.

## Luffy base — postura, carrera y brazos sustituibles

Nueva corrección solicitada por el usuario dentro de fase 3: el estilo «Sombrero de Paja» necesita estar de pie al descansar, correr con su propia animación y lanzar el puño desde su brazo real, sin conservar los puños originales a la vez.

Se reemplaza su atlas base por `luffy-base-v4.png`: pose neutral con pies apoyados y brazos relajados, seis dibujos de carrera distintos en cada una de las cuatro direcciones. El selector abre «De pie» y permite demostrar «Correr» y «Golpe de goma». La previsualización usa el mismo render corporal que la partida; la reducción de movimiento mantiene la postura neutral en el selector.

Los puñetazos usan una capa de torso sin brazos y dos extremidades de textura independiente. Los brazos de guardia pertenecen al mismo sistema: uno se prepara, estira y retrae para Pistol/Rifle, ambos participan en Bazooka, y Gatling alterna los dos. Se estira solo el antebrazo, manteniendo el volumen y los detalles del puño o la palma; Rifle conserva el giro del puño al evolucionar. Los puntos de hombro por forma/orientación están medidos en `src/data/luffy-art.ts`. Materiales: piel cálida, piel rosada Gear Second y haki oscuro Boundman. Las capas más anchas de los Gears preservan su escala y no encogen el torso para encajarlo en una celda corporal estrecha.

Una sola técnica controla los dos brazos de Luffy en cada instante, priorizando fase activa sobre recuperación y preparación. Varias técnicas simultáneas siguen aplicando sus reglas de daño, pero comparten el cuerpo para evitar cuatro o seis brazos superpuestos. Gatling no acumula manos ni brazos de estela. Fusen prioriza su silueta hinchada y evita superponer puñetazos de otra técnica. La extensión y la recuperación son continuas en los límites de fase; el puño vuelve a la guardia antes de terminar.

El render normal de técnicas deja de añadir un puño geométrico cuando están disponibles estas capas. Luffy como nakama usa las mismas capas desde su posición. Los demás personajes conservan sus atlas y técnicas. La regla de dos brazos limita la presentación simultánea, no la simulación, el alcance ni la colisión existentes. Captura de revisión: `docs/screenshots/luffy-postura-carrera-golpe.png`. El acabado y las sensaciones siguen sujetos a valoración humana.

## Pulido de técnicas — cierre de FASE 3

Solicitud: rematar a Luffy y dar más naturalidad a las técnicas antes de continuar con personajes/formas. La fase 3 ya contiene los diez capitanes, 30 estilos, innatos, nakama y sinergias; este trabajo cierra su pulido, sin adelantar islas o jefes de fase 4.

Pistol y Bazooka usan aceleración y frenado suaves, alcanzando la máxima extensión en el evento de contacto de la simulación. La recuperación curva el antebrazo hacia la guardia en lugar de recoger un segmento rígido a velocidad constante. La textura se reparte una sola vez por la curva y la mano mantiene su tamaño. El torso gira ligeramente alrededor de la cadera; las anclas de hombro reciben la misma transformación para conservar continuidad. Se conservan dos brazos y el giro de Rifle.

Gatling deja de usar una onda periódica independiente del combate: cada brazo prepara, toca y recupera alrededor de los tiempos `strikes[].at` del motor. Los golpes pares e impares se reparten entre los dos brazos. Puede haber dos brazos extendidos a la vez; no se crean manos adicionales. Se comprueba que la posición del puño alcanza el objetivo en cada evento real de daño.

Las espadas preparan el corte y cruzan la dirección del objetivo en el contacto; la estela sigue detrás del filo. Las estocadas se presentan como avance y retracción. Los pies se orientan con la patada, con sandalia para Luffy, zapato y pantalón oscuro para Sanji y pezuña para Chopper. La pierna de Sanji tiene longitud visual limitada y la señal de impacto representa el área cubierta por la patada. Alcances, daños y colisiones conservan los valores de combate. El barrido de Muchi mantiene el recorrido empleado por su colisión.

Parámetros visuales en `src/data/animation.ts`; interpolación en `src/render/motion.ts`. No se regeneran modelos ni se añade contenido. Revisión de secuencias ampliadas, 145 tests y 15 E2E del build, incluyendo el banco de 18 técnicas y una evolución. La naturalidad final y el criterio de diversión requieren valoración al jugar; los otros personajes conservan sus atlas corporales actuales. Captura: `docs/screenshots/tecnicas-pulido-fase3.png`.


## Auditoría de fidelidad de técnicas — revisión v5 de FASE 3

El fallo visual de Zoro procedía de superponer una hoja dibujada desde el hombro a un sprite que ya sostenía su katana. El mismo patrón duplicaba piernas de Sanji y antebrazos de Franky. Se separa la representación corporal de los efectos: una sola acción posee el cuerpo; los efectos de otras técnicas simultáneas no crean más extremidades. No cambia el balance de daño, alcance, cadencia o colisiones.

Oni Giri es Santoryu. Por coherencia se cambia el estilo base de Zoro de «Una espada» a «Santoryu»; el segundo pasa a «Santoryu · Bandana», conservando sus estadísticas. Asura compone tres manifestaciones con los agarres correctos y oculta los apoyos inferiores duplicados. No se usan espadas flotantes para simular el número de hojas.

| Personaje | Técnicas | Gesto y efecto verificados |
| --- | --- | --- |
| Luffy | Pistol, Gatling, Bazooka | Dos brazos texturizados, extensión/contacto/retorno; Gatling sigue cada evento; Bazooka usa palmas |
| Luffy | Muchi, Fusen | Pierna elástica sustituye la ausente del cuerpo y comparte giro/longitud del barrido; Fusen tiene silueta hinchada ilustrada propia |
| Zoro | Oni Giri, Phoenix | Katanas agarradas por dos manos y boca, anticipación de corte, seguimiento y recogida; Phoenix libera estela tras el corte |
| Sanji | Collier, Concassé | Rodilla recogida, patada y retorno con dos piernas; Concassé gira hacia un talonazo descendente; botas naranjas/azules en Diable/Ifrit |
| Nami | Thunder, Cyclone | Un Clima-Tact sujeto, elevación y gesto de lanzamiento; tormenta o remolino crecen junto al objetivo; Zeus conserva su identidad |
| Usopp | Fire Star, Pop Green | Tirachinas tensado y liberado con ambas manos; estrella incendiaria sale desde el arma; brotes y lianas para Pop Green |
| Chopper | Hoof | Golpe de pezuña delantera, con volumen Brain/Heavy/Monster, sin pierna humana añadida |
| Robin | Clutch | Cruza sus brazos; manos brotan junto a la víctima con pétalos, articulación y cierre de dedos |
| Franky | Strong Right | Torso sin antebrazos, dos piezas mecánicas; una sale desde el codo con cadena y retorna antes de guardar |
| Brook | Aubade | Preparación de desenvaine, una hoja y una vaina, continuación y recogida; hielo/alma en sus estilos avanzados |
| Jinbe | Shark Brick | Palma azul abierta, apoyo ancho de karate gyojin, impulso de cadera y ondas de presión; no un puño humano genérico |

Los tiempos se toman del motor de combate y del evento real de impacto. Los atlas usan seis claves por acción con vistas de tres cuartos frontal/posterior y espejo lateral. Se elige esta solución para mantener ropa, anatomía y agarres dibujados juntos, frente al error de añadir miembros a un cuerpo ya completo. Luffy y Franky necesitan piezas separadas porque su extremidad sale de la celda. El selector permite inspeccionar las 18 técnicas y las 30 combinaciones de personaje/forma; no exige activar depuración ni modifica una partida.

Límites explícitos: las vistas no son una animación dibujada en 360 grados; los ataques cercanos representan un área estilizada, cuyo alcance jugable puede superar la longitud anatómica del miembro. Reposo/marcha de los otros nueve personajes mantiene la revisión anterior. Los tests comprueban eventos, recursos y ejecución; la calidad artística final y la diversión de cinco minutos necesitan valoración humana. No se declara «animación perfecta» por pasar tests. La siguiente fase de contenido continúa siendo FASE 4.


## FASE 4A — Grietas, jefes y vínculos

Referencia mecánica: lectura de `JPTER78/pokesurvivor` (`rift.js`, `player.js` y `levelup.js`), sin copiar código ni recursos. Allí los vínculos agrupan movimientos; aquí vinculan técnicas y conservan al propietario de cada poder. Es un primer bloque de fase 4: no representa East Blue/Alabasta completas ni Buster Call.

- Primera grieta: 35 segundos de costa **o** 80 bajas. Las siguientes: 45 segundos **o** 120 bajas desde la anterior resolución/caducidad. Portal opcional a 170 unidades, ajustado a costa transitable, duración 40 s y sin acumulación. Entrada al acercarse a 28 unidades o mediante el botón accesible a menos de 200. Un portal caducado no concede nada.
- Arena aislada de radio 290 y límite 75 s. Se conservan enemigos, botín y cofres de la costa; se detienen allí el reloj de 300 s, las oleadas y el temporizador de cofres. Las habilidades y la vida siguen siendo reales. Derrotar al jefe abre recompensa; agotar 75 s devuelve a la costa sin premio; morir termina la partida. Se limpian ataques/proyectiles al cruzar para impedir impactos invisibles. Elegir arenas alarga la duración real por encima de cinco minutos de costa.
- Jefes por datos: Buggy (abanico de cuchillos), Kuro (carga con dirección fijada) y Arlong (golpe circular de Kiribachi). Anticipación visible y ventana de recuperación, barra de vida y contador. El dash protege pero no mata instantáneamente a un jefe. Se repiten en orden con +40% de vida por vuelta completa. Los patrones son interpretaciones de esta versión, no todas sus técnicas canónicas.
- Al ganar se elige una recompensa: vínculo o atributos. El primer vínculo une la técnica activa con otra; los siguientes amplían ese mismo grupo hasta cuatro. Si faltan técnicas puede aprenderse una desde la elección del vínculo, respetando el inventario de cuatro. Las teclas 1–4 y las fichas seleccionan el ataque/grupo activo; las técnicas vinculadas comienzan en el mismo ciclo y comparten la cadencia de la más lenta. Las técnicas sueltas no se lanzan mientras esté activo otro grupo. Los nakama elegidos en el puerto mantienen su apoyo habitual, evitando duplicar su técnica cuando ya está en el grupo activo.
- Revisión 4B solicitada por el usuario: se elimina la opción de vincular técnicas ajenas y de reclutar asistentes por vínculo. El menú y el motor solo aceptan armas del capitán. Los dos nakama elegidos en puerto mantienen su función independiente. Un mismo personaje conserva un gesto corporal principal aunque haya más de una técnica suya vinculada, manteniendo sus impactos y efectos.
- Alternativas: +15% daño, +25 vida máxima/curación, +10% velocidad, +2 armadura, +0,5 vida/s o +10% cadencia, durante esta partida. Se muestran dos alternativas aleatorias además del vínculo; con cuatro técnicas vinculadas se muestran tres atributos. Límites de apilado en datos para evitar velocidades incontrolables; al agotarlos todos se ofrece vitalidad adicional. La recompensa se consume una vez; volver desde la lista de técnicas conserva la decisión pendiente. No existe persistencia de cuenta en este bloque.
- Los cofres no consumen una evolución ni un rango hasta pulsar su tarjeta. Cuando se cumple técnica 5 + pasivo 2 + 60 s, se garantiza una opción de evolución. Sin mejoras posibles, las alternativas son berries, vida o impulso; siguen siendo tres distintas. Las elecciones congelan toda la simulación.

El piloto de validación se adapta al nuevo grupo activo: busca las grietas, elige vínculos y prioriza daño/cadencia antes de llenar el inventario de técnicas inactivas. No modifica salud ni daño para forzar victorias. La prueba humana de diversión y el ajuste final de dificultad siguen pendientes.


## FASE 4B — Travesía ilustrada y preparación del capitán

La petición actual adelanta de forma acotada las mejoras y el guardado de perfil previstos en fase 5, y la presentación de menús de fase 6. No declara completas esas fases: faltan la campaña integral de islas, Buster Call, tienda completa del Sunny, logros/Codex persistente, audio, mando, PWA y resto del alcance original. Prima poder jugar, elegir y comprar mejoras reales sobre mostrar secciones decorativas sin función.

### Repertorio y dificultad

Los vínculos **solo** usan técnicas del capitán. La exclusión se aplica tanto al listado como a la validación de la compra, la elección activa y el motor; manipular una elección no concede una técnica ajena. Se conservan las 18 técnicas del catálogo: Luffy puede llegar a cuatro vinculadas; quienes tienen dos llegan a dos, y quienes tienen una reciben atributos desde el primer jefe. Se evita inventar técnicas ajenas para rellenar cuatro huecos. Los botones muestran el límite real del personaje.

Jefes: Buggy 1100 HP, Kuro 1700, Arlong 2400 antes del escalado `1 + tiempoCosta/450 + jefesDerrotados×0,18`. Tres ataques por jefe en `boss-moves.ts`: abanico/bomba/rueda de cuchillos; carga/garra/doble cruce; Kiribachi/oleada/embestida. Cada uno tiene preparación, área o dirección bloqueada, ejecución y recuperación. Bajo 50% de vida acortan preparación a 82%, recuperación a 75% y ganan presión. Las dagas y ondas salen del cuerpo; las bombas señalan antes su zona de impacto. Las seis poses de marcha frontal y posterior por jefe sustituyen el deslizamiento de una pose fija. No se añade consumo de energía.

`voyageStages` dirige tres tramos: costa tropical 0–119 s, puerto 120–239 s y vanguardia de Alabasta desde 240 s. Suelo, caminos y decoración cambian al cruzar el umbral; el estado del jugador y botín permanece. No es aún una campaña de Alabasta completa. El último tramo multiplica vida ×1,45, velocidad ×1,12, daño ×1,3 y período de aparición ×0,8; 22% de los nuevos enemigos son veteranos con resistencia adicional, más velocidad y aro dorado. Las apariciones conservan distancia segura y los límites de 150 enemigos/240 recogibles. El reloj de costa sigue detenido durante las arenas.

### Mejoras previas y economía

Cada capitán dispone de bolsa, rangos y estadísticas propios. Se conceden 120 berries iniciales por personaje una sola vez al crear el perfil. El coste siguiente es visible y crece con el rango; se rechaza compra sin saldo o al alcanzar el tope. La pantalla permite editar otro tripulante sin cambiar al capitán seleccionado para zarpar.

- Vitalidad +8 HP/rango, daño +4%, velocidad +3%, recarga −3%, armadura +1, regeneración +0,15 HP/s, recogida +10%, experiencia +5%, berries +8% y crítico +2%. Topes y costes en `training.ts`.
- Repertorio permite empezar con dos técnicas propias. Técnica inicial permite escoger gratis la salida una vez comprada. No se ofrecen compras de repertorio/inicial/veto a personajes con una sola técnica.
- Cambio de cartas otorga cargas por partida. Una carga produce tres opciones válidas incluyendo al menos una diferente, conserva nivel/XP y no cobra otra subida. Sin alternativas se desactiva.
- Veto oculta una técnica propia no inicial en cartas/cofres; un vínculo todavía puede aprenderla y, una vez aprendida, sus rangos vuelven a ser elegibles. No permite técnicas ajenas, duplicados ni vetar la salida.
- Al terminar o volver al puerto se abona `floor(berriesRun + bajas/4 + segundosCosta/10 + 35×jefes + 100 si victoria)`. Se acredita una sola vez por identificador de partida, al capitán utilizado. Compras y logros estadísticos no afectan al daño de los nakama por herencia de mejoras del capitán.

Guardado local versionado `marea.profile.v1`: se validan claves, finitud, topes y propietarios al cargar. Un formato inválido se conserva en copia `.backup` y se informa; si el navegador deniega almacenamiento se juega en memoria con aviso. El perfil pertenece a este navegador y origen: no hay cuenta/sincronización entre dispositivos ni continuación de una partida cerrada. Una recarga a mitad del combate pierde esa partida no liquidada; las compras previamente guardadas permanecen. Un cambio de origen (localhost/Pages) usa otro perfil.

### Dirección de arte y recursos

Referencia visual y funcional: capturas aportadas y lectura de `JPTER78/pokesurvivor/js/data/upgrades.js`. Código propio. Menú azul con contornos claros, oro para acciones/moneda, retrato central y accesos funcionales a jugar, tripulación, mejoras y cuaderno. Gacha conserva «Próximamente». Cartas de técnica y bonus usan 36 iconos originales ilustrados, correspondientes a puños de goma, espadas, botas, Clima-Tact, semillas, pezuña, brazos, mecánica, alma/karate y atributos.

Se intentaron consultas de Google sobre tilesets e iconos de One Piece y las páginas de Kenney Tiny Town/Pirate Kit; el proxy respondió 403. No se presenta esa búsqueda como resultados revisados ni se reutilizan sprites sin licencia. GitHub sí permitió consultar la referencia y Google Fonts: Pixelify Sans, SIL OFL 1.1, distribución original verificada y licencia conservada. Los escenarios, props, iconos y marchas se crearon para este proyecto con asistencia de IA y se exportaron sin copiar sprites de juegos/anime. Contratos, fuentes y límites en ASSETS.

Suelos de 128 px repetibles, ocho materiales, doce objetos decorativos y caminos curvos dibujados con esos materiales. Son decoración transitable; no se introducen colisiones invisibles. Los dibujos de props se exportan con cortes de fila medidos para evitar cortar palmeras y añadir restos de filas contiguas. Presupuesto PNG total de precarga/interfaz 9 MB, ampliado desde 8 por contenido nuevo, con test que suma también marchas, escenarios e iconos. No hay dependencias de servicios de imágenes para jugar.

Límites visuales: los ataques de jefe comparten poses de preparación/ejecución, aunque sus patrones y efectos son distintos; perfiles laterales por espejo y ataques en tres cuartos. El terreno repite texturas y los objetos decorativos no bloquean. La valoración de acabado y diversión sigue siendo humana; no se declara animación perfecta ni fidelidad de fotograma a material oficial.
