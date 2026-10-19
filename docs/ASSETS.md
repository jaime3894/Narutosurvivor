# Recursos visuales

La fase 0 dibuja su isla y su aventurero directamente con Canvas en src/render/island.ts. No descarga imágenes, fuentes, logotipos, audio ni sprites de terceros.

## Contrato previsto para recursos propios

Ubicación futura: public/assets/. No se requieren estos archivos para iniciar la fase 0.

- characters/<id>.png: atlas transparente, celdas 32×32; filas abajo, izquierda, derecha y arriba. Cada fila: seis cuadros de caminar y cuatro de reposo.
- bosses/<id>.png: celdas 96×96; preparar un manifiesto de animaciones antes de integrar ataques y anticipaciones.
- tiles/<island>.png: celdas 16×16 sin suavizado.
- audio/: recursos originales o con licencia documentada.

El cargador de atlas y su fallback procedural se implementarán con los personajes; esta fase solo incluye el render procedural. Al integrar cada recurso, registrar autor, licencia y origen. Los archivos deben ser propios o contar con derechos de uso. No usar recursos extraídos de juegos o del anime.

## Animaciones de combate por técnica — requisito para fases 2 y 3

El atlas inicial de reposo/caminar no basta para aprobar un personaje. Su presentación de combate debe incluir preparación, fase activa, impacto y recuperación, con dirección, ancla a los pies y puntos de unión para manos, hombros y armas. Los recursos de ataque pueden usar atlas separados y tamaños propios; no hay que comprimir un brazo extendido dentro de una celda corporal de 32×32.

Contrato a implementar en fase 2 y consumir con los personajes en fase 3:

- Identidad: personaje, forma y técnica; compatibilidad explícita con sus poderes.
- Secuencia: fotogramas o poses de cada fase, duración y modo de orientación.
- Anclas: pies, hombros, manos y posición del arma cuando corresponda.
- Eventos de simulación: inicio/fin del intervalo de golpe, impactos de multigolpe y final de recuperación. El render consume estos tiempos; no decide el daño según los FPS.
- Capas: cuerpo, extremidades/arma y efectos. El alcance de una extremidad puede dibujarse con segmentos articulados entre anclas, manteniendo la unión al cuerpo.
- Sustitución: un atlas propio reemplaza la presentación manteniendo las anclas y eventos de la técnica. El fallback procedural conserva su identidad y movimiento.

Caso de referencia obligatorio: Luffy prepara el golpe, el brazo se estira desde el hombro hacia el punto de contacto, el puño impacta y el brazo se retrae. Zoro mueve las espadas durante el corte y Sanji ejecuta una patada visible. No basta con emitir partículas o proyectiles desde un personaje inmóvil. La lista de lenguajes visuales para los diez personajes está en el GDD.

Estado actual: contrato documentado; todavía no existe el sistema de animaciones por técnica ni se consideran implementadas estas animaciones.
