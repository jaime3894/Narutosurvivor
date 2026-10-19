# Recursos visuales — FASE 3

El juego carga **33 atlas PNG ilustrados**: diez personajes × tres estilos y tres tipos de enemigo. Son hojas nuevas creadas para este proyecto con asistencia de IA de imagen, separadas, normalizadas y exportadas al contrato del juego. Se sirven desde el propio repositorio; no hay dependencia de una web externa. El render procedural y el fan art MIT anterior quedan como reserva si falta un archivo.

## Arte principal — revisión de acabado

Los atlas están en `public/assets/characters/<id>-<forma>.png` y `public/assets/enemies/<tipo>.png`, registrados en `public/assets/manifest.json`. Cada uno tiene silueta corporal, cara, ropa y equipo propios; hay vistas frontal, lateral y trasera. Chopper conserva una altura menor en Brain Point; las formas mecánicas, gigantes y Asura cambian anatomía/equipo. La exportación separa figuras por componentes de alfa para evitar recortes de pies, duplicar fragmentos del vecino o dejar fondos pintados.

Las imágenes maestras se generaron durante esta revisión y no son sprites descargados ni extraídos de videojuegos. Los PNG compilados están versionados y bastan para jugar, probar y compilar en una sesión nueva. El permiso de uso de una ilustración no transfiere derechos sobre los personajes de One Piece.

El atlas reproduce seis tiempos de marcha a partir de **dos poses clave por dirección**, con pausas y cambios de apoyo; no son seis dibujos independientes. Reposo, anticipación/ataque y daño se derivan de esas poses con desplazamiento, inclinación y recuperación. Las extremidades de las técnicas continúan animándose por separado y el cuerpo utiliza la edad del ataque. Este cambio mejora el acabado, sin presentarse como una animación final de seis fotogramas dibujados a mano.

La adaptación opcional se hace con `node scripts/compile-sprite-art.mjs /ruta/config.json`. La configuración es una lista de `{ "id": "luffy", "source": "/ruta/hoja1536x1024.png", "heights": [68,68,72] }`; las hojas maestras deben tener tres pares de poses × cuatro orientaciones. Se necesita Chromium (o `CHROMIUM_PATH`). No se ejecuta generación de imágenes durante el build. Las variantes `profile` y `flipKeys` corrigen hojas cuya orientación no coincide con la fila pedida.

## Recursos anteriores de reserva — procedencia y créditos

- Autor: **gshklovs**, proyecto [opshell](https://github.com/gshklovs/opshell).
- Revisión fijada: `4f51b3530104f47f5efdd4874e3f3d8abe3a3271`.
- Origen: `packs/onepiece/art/{id}.json`, paleta y `variants.common.rows` de los diez Sombrero de Paja. Retratos 28×28; no se copió código.
- Licencia MIT, copyright 2026 gshklovs: [texto conservado](../public/licenses/opshell-MIT.txt), [registro de modificaciones](../public/licenses/README.txt). El README de origen declara que la licencia cubre código y fan art original, no arte extraído.
- Uso: retratos en selector y caras recortadas/adaptadas en cuerpos propios. Ropa, sombreado corporal, piernas, brazos, orientaciones, armas, formas y enemigos se construyeron para este juego. Créditos y licencia accesibles desde el selector.
- Los personajes y nombres pertenecen a sus titulares; la licencia de estas ilustraciones originales no transfiere derechos sobre la franquicia. No se presenta como producto oficial.

## Sustituir por tus propios atlas

Edita `public/assets/manifest.json`. Ejemplo:

```json
{
  "hero:luffy:0": "assets/characters/luffy-base.png",
  "hero:luffy:1": "assets/characters/luffy-gear-second.png",
  "hero:luffy:2": "assets/characters/luffy-boundman.png",
  "enemy:sailor": "assets/enemies/marine.png",
  "enemy:runner": "assets/enemies/buggy-pirate.png",
  "enemy:brute": "assets/enemies/alvida-pirate.png"
}
```

Los otros IDs son zoro/nami/usopp/sanji/chopper/robin/franky/brook/jinbe; cada uno admite 0/1/2. Solo se cargan PNG del mismo origen. Un archivo ausente, inválido o con dimensiones incorrectas conserva el sprite integrado. El manifiesto vacío funciona sin configuración. Las rutas son relativas a la base del despliegue, también bajo `/One-piece-survivor/`.

Contrato corporal: **960×320 PNG transparente**, celdas **64×80**, 15 columnas y 4 filas. Filas: abajo, izquierda, derecha, arriba. Columnas: reposo 0–3, caminar 4–9, ataque 10–12, daño 13–14. Ancla de pies `(32,74)` dentro de cada celda. Cuatro/seis/tres/dos fotogramas por estado; reproducción aproximada 3/10/12/10 FPS. Resolución ampliada respecto a los 32×32 propuestos inicialmente para conservar detalle y formas grandes. No estirar los cuerpos para llenar la celda.

Los PNG principales se precargan y decodifican antes de mostrar el puerto. En reserva, los atlas procedurales se cachean por personaje/forma. La revisión ampliada actual se conserva en [galería](screenshots/fase3-galeria.png); el selector utiliza los mismos modelos de cuerpo completo que el combate. El acabado sigue sujeto a valoración artística del usuario.

## Ataques y anclas

El atlas es corporal: la extensión de un brazo no cabe en una celda. `src/render/techniques.ts` dibuja extremidades/armas conectadas desde el actor, con hombro visual a `(0,-45)` respecto a pies. `src/game/techniques.ts` controla anticipación, fase activa, impactos y recuperación con paso fijo; el render consume esos tiempos. Sustituir un atlas no cambia daño ni colisión. Luffy mantiene hombro–brazo–puño al estirar y retraer; Zoro mueve hojas; Sanji extiende/gira piernas. Franky utiliza cadena metálica y Boundman brazos oscuros de haki, con estilos separados.

Cada personaje tiene idle, caminar, ataque y daño; las piernas alternan y las armas acompañan la pose. La reducción de movimiento conserva las señales funcionales y reduce vapor, temblores y partículas. Los enemigos tienen uniforme y gorra de la Marina, ropa de la banda de Buggy o cuerpo pesado/maza de los matones de Alvida. Son esbirros originales; jefes con nombre en fase 4.

## Recursos de fases siguientes

- Jefes: celdas previstas 96×96; definir manifiesto de patrones y anticipaciones durante fase 4.
- Suelos: mosaicos 16×16 sin suavizado, integración por isla en fase 4.
- Audio: solo original o con licencia registrada; implementación en fase 6.

Registrar siempre autor, URL, licencia y modificaciones de cualquier nuevo recurso. El atlas corporal opcional ya funciona; los contratos de jefes, terreno y audio aún no son cargadores implementados.

## Excepción de Luffy base: seis poses y capas de puñetazo

`public/assets/characters/luffy-base-v4.png` mantiene 960×320: columnas 0–3 neutral, 4–9 seis dibujos de carrera independientes, 10–14 neutral como reserva. El combate con puñetazos sustituye el cuerpo entero por el torso sin brazos y añade exactamente dos brazos modulares; no usa la reserva neutral como cuerpo de ataque.

- `luffy-base-body-v4.png`: 64×320; cuatro filas de torso base sin brazos, ancla `(32,74)`.
- `luffy-bodies-v4.png`: 288×320; tres columnas de 96×80 y cuatro orientaciones, para torso de los Gears, ancla `(48,74)`.
- `luffy-arms-v4.png`: 512×192; cuatro columnas de 128×64 (brazo recto con puño, recto con palma, guardia izquierda/derecha), tres filas de materiales base/Second/haki.

Las anclas del hombro se definen por forma y vista en `src/data/luffy-art.ts`. Las manos se dibujan con tamaño estable; el tramo de piel se estira con su textura y contorno. El cuerpo de ataque no contiene manos horneadas, por lo que no aparecen puños adicionales. Para sustituir el arte de ataque de Luffy deben reemplazarse también estas capas, además del atlas normal de reposo/carrera. Las capas son propias de esta revisión con asistencia de IA de imagen, sin sprites extraídos de juegos.

Exportación opcional: `node scripts/compile-luffy-art.mjs /ruta/config.json`, con `{ "base": "/ruta/hoja8x4.png", "arms": "/ruta/brazos4x3.png", "bodies": "/ruta/torsos3x4.png" }`. Requiere Chromium; el build usa los PNG ya exportados y no necesita las hojas maestras ni IA. [Ver postura, carrera y golpe](screenshots/luffy-postura-carrera-golpe.png).
