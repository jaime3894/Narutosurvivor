# Recursos visuales

La fase 0 dibuja su isla y su aventurero directamente con Canvas en src/render/island.ts. No descarga imágenes, fuentes, logotipos, audio ni sprites de terceros.

## Contrato previsto para recursos propios

Ubicación futura: public/assets/. No se requieren estos archivos para iniciar la fase 0.

- characters/<id>.png: atlas transparente, celdas 32×32; filas abajo, izquierda, derecha y arriba. Cada fila: seis cuadros de caminar y cuatro de reposo.
- bosses/<id>.png: celdas 96×96; preparar un manifiesto de animaciones antes de integrar ataques y anticipaciones.
- tiles/<island>.png: celdas 16×16 sin suavizado.
- audio/: recursos originales o con licencia documentada.

El cargador de atlas y su fallback procedural se implementarán con los personajes; esta fase solo incluye el render procedural. Al integrar cada recurso, registrar autor, licencia y origen. Los archivos deben ser propios o contar con derechos de uso. No usar recursos extraídos de juegos o del anime.
