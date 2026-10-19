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
- Fase 3: implementada; ver entrega más abajo.
- Fase 4: islas, minijefes, jefes, director por datos y Buster Call. La arena actual no representa East Blue completa.
- Fase 5: meta-progresión y guardado versionado; las partidas actuales no se guardan al recargar.
- Fase 6: audio, i18n, controles táctiles definitivos/mando, PWA, accesibilidad completa y estrés.
- Fase 7: gacha solo para depuración y tests de distribución.
- Fase 8: frutas, diarios, Infinito y Nuevo Mundo.
- Cargador de atlas propios con fallback: implementado en fase 3; contrato en docs/ASSETS.md.

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
- Histórico de fase 2 (sustituido por FASE 4A): cofres de 1/3/5 premios, evolución condicionada a técnica 5 + pasivo 2 + 60 s, pantalla de botín pausada y entrega una sola vez.
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

## FASE 3 — personajes, formas y nakama

- Diez capitanes seleccionables con innatos, técnica inicial propia y tres estilos cada uno. El desbloqueo original por nivel/agotamiento se sustituye en FASE 4A por dominio de técnicas y energía infinita.
- Hasta dos nakama con seguimiento, ataques desde su posición, apoyo médico/cocina y diez sinergias por parejas. La selección sobrevive al reinicio de partida; persistencia entre recargas en fase 5.
- Atlas de 30 estilos con cuatro orientaciones y estados idle/caminar/atacar/daño. Rostros y retratos de fan art original MIT de gshklovs/opshell; cuerpos, ropa, armas y animaciones adaptados para este juego. Licencia y procedencia incluidas. No se usan sprites oficiales extraídos.
- Marines, piratas de la banda de Buggy y matones de Alvida sustituyen a las siluetas básicas: uniformes, pañuelos, parche, barba, sable y maza. Son esbirros; Alvida, Buggy y otros jefes con nombre pertenecen a fase 4.
- Manifiesto opcional de atlas PNG propios con comprobación de dimensiones y fallback integrado. Contrato y créditos actualizados en docs/ASSETS.md.

### Validación

98 tests de lógica, build estricto y 12 E2E del build: selección de tripulación en escritorio/móvil, tres sinergias simultáneas, formas bloqueadas/desbloqueadas, reinicio conservando compañeros, diez capitanes y 30 previsualizaciones distintas, carga de atlas propio y regresiones de combate/Pages. Tres simulaciones de cinco minutos con reglas normales siguen pasando. Galería de los 30 estilos y enemigos, menú y combate inspeccionados en Chromium sin errores de render.

### Límites concretos

El arte incorporado mejora identidad, volumen y movimiento; es una primera versión jugable, no una aprobación del usuario del acabado definitivo. Las vistas laterales usan poses adaptadas, no ilustraciones independientes dibujadas a mano. Los nakama combaten en estilo base y no tienen barra de salud propia. Algunos personajes representan tres estilos de combate en vez de tres transformaciones anatómicas canónicas; decisión explicada en GDD. Prueba humana de diversión pendiente; audio, mando y pulido global siguen en fase 6. No se adelantan islas/jefes, guardado ni gacha.

## Corrección de acabado artístico — FASE 3

Solicitud del usuario: rehacer el acabado tomando como referencia modelos 2D detallados, sin avanzar de fase. Se han creado e integrado 33 atlas PNG de cuerpo completo: 30 estilos de los diez personajes y tres enemigos. Sustituyen la presentación procedural habitual tanto en selector como en combate. Incluyen caras, ropa, equipo y vistas específicas. Las ilustraciones se generaron para el proyecto con asistencia de IA; no se descargaron sprites oficiales. Investigación y decisión en GDD.

Compilación por componentes de alfa para conservar figuras completas, corrección de perfiles y eliminación de restos de sprites vecinos. Marcha con dos poses clave por dirección y seis tiempos; preparación, ataque y daño derivados del cuerpo, junto con las extremidades de las técnicas. Se corrigieron ancla de hombro, color de Gear Second, multigolpes de Boundman y composición de Fusen. Fuentes y límites documentados en ASSETS.

Verificación: 132 tests de lógica/recursos, build estricto y 13 E2E del build. Los recursos tienen dimensiones correctas, transparencia real, cuatro vistas, poses distintas y un total inferior a 5 MB. Galería completa, selector y combate revisados en Chromium; control móvil y ruta de Pages cubiertos. Continúan pendientes la aprobación artística del usuario y su prueba humana de cinco minutos. Los ciclos no son seis dibujos manuales independientes; se documenta expresamente. Siguiente fase prevista sigue siendo 4, después de revisar este acabado.

## Corrección de Luffy — postura normal y puño conectado

- Nuevo Luffy base con postura neutral, pies apoyados y brazos relajados. Seis dibujos de carrera distintos por dirección. Selector con «De pie», «Correr» y «Golpe de goma», mostrando la pose neutral inicialmente.
- Torso de ataque sin brazos y dos extremidades texturizadas, con piel base/Second/haki. El brazo que golpea sustituye al de guardia; el puño conserva su textura y tamaño durante extensión/retracción. Anclas por vista/forma; los Gears conservan cuerpos anchos.
- Un controlador corporal de dos brazos evita duplicados con Pistol, Bazooka, Gatling y técnicas simultáneas. Fusen no añade puños ajenos a la silueta hinchada. Las reglas de combate no cambian.
- 143 tests de lógica/recursos y 15 E2E del build: continuidad del puño, retorno, prioridad entre técnicas, dos brazos, alternancia Gatling, uso como nakama, seis dibujos de carrera en cuatro vistas y selector de demostración. Build estricto aprobado. Revisión visual ampliada y dentro de la interfaz.

Límites: los otros nueve personajes y las marchas de Gear Second/Boundman conservan su ciclo de dos poses. Las capas nuevas cubren los puñetazos de Luffy; los ataques de pierna y Fusen mantienen su ejecución de fase 3. Las técnicas simultáneas comparten dos brazos visibles para conservar anatomía, aunque sus impactos sigan activos. La aprobación artística y la prueba humana de diversión siguen pendientes. No se avanza a fase 4 durante esta corrección.

## Pulido final de técnicas — FASE 3

- Aceleración/contacto/recuperación más naturales en Pistol y Bazooka; brazo curvo al recoger, mano de tamaño estable y torso con giro de cadera manteniendo unidos los hombros.
- Gatling sincronizado con cada impacto real del motor, repartido entre dos brazos; sin manos de estela adicionales. Corrección verificada con los tiempos de ataques creados por la simulación.
- Trayectoria de espada y estela coordinadas, estocadas con avance/retracción y pie orientado en las patadas. Sanji utiliza pantalón y zapato oscuros, con longitud de pierna limitada y señal del área de impacto.
- 145 tests, build estricto y 15 E2E aprobados. Revisión visual ampliada de Pistol, Gatling, Bazooka, Oni Giri y Collier Shoot; banco completo de 18 técnicas cubierto por E2E. No cambian datos de daño, alcance ni colisiones.

La fase 3 sigue disponible: diez personajes, tres estilos, innatos y nakama con sinergias. Pendientes de valoración humana: acabado de movimiento y diversión durante cinco minutos. El resto de cuerpos conserva sus animaciones actuales; este pulido no equivale a una renovación de todos los atlas. Siguiente bloque de contenido previsto: fase 4, islas y jefes, tras probar la tripulación actual.


## Auditoría completa de técnicas y corrección de Zoro — FASE 3 / v5

- Sustituidas las superposiciones de armas/miembros por ocho hojas de poses completas y rigs específicos de Luffy/Franky. Zoro sujeta sus tres katanas durante el corte; Asura añade manifestaciones de torso sin duplicar piernas. Base renombrada a Santoryu para que Oni Giri sea coherente.
- Revisadas las 18 técnicas en tres formas: anticipación, contacto, continuación y regreso. Corregidos Concassé descendente, ropa continua de Robin/Nami, guardia de Sogeking y recortes de las alas de Robin. Codos/cadera medidos en datos; el antebrazo de Franky sale de su cuerpo, no aparece otro puño sobre el existente.
- Muchi utiliza cuerpo con una sola pierna de apoyo y la pierna móvil texturizada; Fusen tiene sus doce vistas/cuerpos hinchados propios. Pistol/Bazooka/Gatling conservan el rig conectado y su sincronización con el motor.
- Selector con demostración de técnicas y cuatro vistas para toda la tripulación, incluyendo formas avanzadas; accesible sin herramientas de depuración. Galerías de 54 combinaciones × seis tiempos en docs/screenshots/tecnicas-forma-*-v5.png.
- PNG originales de esta revisión asistidos por IA; sin recursos oficiales descargados. Precarga completa de arte de aproximadamente 7,33 MB, con compresión sin pérdida y presupuesto total de 8 MB.

Validación: 182 tests de lógica/recursos, build estricto y 18 E2E del build, incluida la comprobación de 288 celdas sin vacíos/recortes, selector de todas las técnicas, demostración de Zoro en móvil y ruta de Pages. Las tres simulaciones de cinco minutos conservan sus resultados de victoria y progresión. Los resultados exactos de ejecución se comunican junto al commit publicado.

Pendientes documentados: valoración artística y prueba humana de diversión; direcciones de ataque con vistas de tres cuartos y espejo, sin dibujos independientes para 360 grados; marcha/reposo de los otros nueve personajes conserva dos poses; las técnicas simultáneas comparten un único gesto corporal y mantienen sus efectos/eventos. Esos límites no se presentan como acabado perfecto. La petición actual corrige FASE 3; no se adelantan islas, jefes o meta-progresión.


## FASE 4A — Cofres elegibles, dominio, energía infinita y grietas

- Cofres con tres botones reales: elegir una tarjeta concede únicamente esa recompensa. Evolución garantizada como alternativa al reunir los requisitos, sin aplicarse al abrir. Ratón, teclado 1–3 y móvil, con pausa y protección contra concesión duplicada.
- Formas automáticas al dominar 5/5 las técnicas correspondientes; requisitos exactos visibles y separados en datos. Para los cinco personajes con una sola técnica, la tercera forma requiere su evolución. Energía infinita en todas las formas, sin agotamiento ni retorno forzado. La sinergia que regeneraba energía ahora regenera vida.
- Grietas opcionales por tiempo o bajas; arena, jefe con anticipación/recuperación y regreso a la costa. Buggy, Kuro y Arlong con patrones distintos e ilustraciones originales asistidas por IA; sin sprites oficiales descargados. La costa y sus cofres se conservan al entrar/salir; sus cinco minutos se detienen durante el duelo.
- Recompensa de jefe: unir técnicas o mejorar atributos, seleccionables con fichas y 1–4. La revisión 4B elimina los vínculos ajenos de esta primera versión y limita la capacidad al repertorio propio.
- Depuración `?debug`: botones Grieta/Derrotar jefe para revisar el ciclo, cofres y formas. Lista de vínculos desplazable, sin opciones inaccesibles fuera del marco.

Pendiente de FASE 4: estructura completa de East Blue/Alabasta, minijefes de isla, director general de oleadas por datos y Buster Call; después el resto de islas. Los tres jefes actuales pertenecen al ciclo de grietas, no sustituyen ese contenido. Arte de jefes con cuatro poses, vistas posteriores para guardia y espejo lateral; ataques en tres cuartos sin dibujos independientes de espalda. No se declara animación perfecta ni aprobación artística humana. Balance y diversión requieren partida humana. Meta-progresión, guardado, audio y fases posteriores mantienen su orden.

Validación de esta revisión: **200 tests de lógica/recursos y 21 E2E aprobados**, build estricto aprobado. Tres simulaciones de cinco minutos terminan en victoria sin alterar salud ni reglas; revisión visual de las tres arenas y la lista móvil en `docs/screenshots/*-v6.png`. Los tests incluyen decisiones sin mutación previa, dominio de los diez capitanes, energía infinita, caducidad/aislamiento/retorno de grietas, patrones de los tres jefes, límites y propietarios de vínculos, atributos reales y ciclos completos de interfaz en escritorio/móvil.


## FASE 4B — Rediseño de travesía y entrenamiento por personaje

- Vínculos exclusivos del capitán, validados en motor e interfaz. Luffy hasta cuatro; personajes con dos técnicas hasta dos; personajes con una reciben atributos. No se reclutan asistentes mediante vínculos. Nakama del puerto conservan sus propios ataques.
- Jefes más fuertes, tres patrones cada uno y fase agresiva al perder la mitad de vida. Marcha ilustrada de seis dibujos por vista frontal/posterior; avisos de bomba, anillos, cargas y ondas. Salud escala por progreso de costa/jefes, sin agotamiento de energía.
- Costa, puerto y desierto: ocho materiales texturizados, doce props y caminos curvos. Cambio a 2:00 y 4:00, con veteranos y mayores estadísticas/presión al final. Director de tramos en datos; esto no sustituye la campaña completa de East Blue/Alabasta.
- Puerto rediseñado tomando la referencia aportada: retrato central, selección rápida de capitán, navegación azul, moneda dorada, registros y Gacha «Próximamente». 36 iconos ilustrados propios para las 18 técnicas y sus bonus/acciones, integrados en cartas, inventario y cuaderno. Pixelify Sans con licencia OFL distribuida localmente.
- Pantalla de 14 mejoras por personaje: estadísticas, repertorio, inicio, veto y cambio de cartas. Berries separadas por capitán, compra con coste/rango/topes y efectos reales al zarpar. Se gana botín al terminar o abandonar hacia el puerto, una sola vez.
- Perfil local versionado con validación, copia de respaldo ante datos inválidos y aviso si no puede guardar. Persisten compras/bolsa/estadísticas/selección. No sincroniza dispositivos ni reanuda combates cerrados. Esta parte de fase 5 se adelanta por solicitud expresa; no se declara completa toda la meta-progresión.

Validación local: 226 tests y 26 E2E, build estricto y tres simulaciones de 300 segundos de costa con victoria sin modificar salud ni reglas. Se adaptó el piloto para moverse por la arena y esquivar avisos, cuyo reloj es independiente del de costa; margen de simulación aumentado para los duelos más largos. Contratos de doce poses de marcha por jefe, ausencia de recortes, guardado tras recarga, compras aisladas por personaje, coste visible y menú móvil, exclusión de técnicas ajenas, transición y cartas con iconos comprobados. Capturas en `docs/screenshots/*-v7.png`.

Pendientes: campaña de islas, minijefes, director completo/Buster Call y fases posteriores; prueba humana de balance/diversión; animaciones de ataque exclusivas para cada patrón de jefe, perfiles dibujados independientes y decoración con colisión si se decide incorporarla. Google/Kenney bloquearon la consulta con HTTP 403; se documenta la procedencia real de los recursos sin atribuir búsquedas exitosas ni usar recursos oficiales extraídos.
