# Recursos visuales — FASE 3

El juego carga **33 atlas PNG ilustrados**: diez personajes × tres estilos y tres tipos de enemigo. Son hojas nuevas creadas para este proyecto con asistencia de IA de imagen, separadas, normalizadas y exportadas al contrato del juego. Se sirven desde el propio repositorio; no hay dependencia de una web externa. El render procedural y el fan art MIT anterior quedan como reserva si falta un archivo.

## Arte principal — revisión de acabado

Los atlas están en `public/assets/characters/<id>-<forma>.png` y `public/assets/enemies/<tipo>.png`, registrados en `public/assets/manifest.json`. Cada uno tiene silueta corporal, cara, ropa y equipo propios; hay vistas frontal, lateral y trasera. Chopper conserva una altura menor en Brain Point; las formas mecánicas, gigantes y Asura cambian anatomía/equipo. La exportación separa figuras por componentes de alfa para evitar recortes de pies, duplicar fragmentos del vecino o dejar fondos pintados.

Las imágenes maestras se generaron durante esta revisión y no son sprites descargados ni extraídos de videojuegos. Los PNG compilados están versionados y bastan para jugar, probar y compilar en una sesión nueva. El permiso de uso de una ilustración no transfiere derechos sobre los personajes de One Piece.

El atlas reproduce seis tiempos de marcha a partir de **dos poses clave por dirección**, con pausas y cambios de apoyo; no son seis dibujos independientes. Reposo, anticipación/ataque y daño se derivan de esas poses con desplazamiento, inclinación y recuperación. El estado de ataque del atlas normal sirve de reserva: la revisión v5 utiliza poses de combate propias y piezas independientes para Luffy/Franky, descritas más abajo. La marcha general conserva dos poses; no se presenta como seis dibujos independientes.

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

El cuerpo del ataque contiene sus manos, pies y equipo: `combat-fighter.ts` selecciona claves dibujadas según los eventos del motor. `techniques.ts` añade únicamente efectos. Luffy utiliza sus rigs de brazos/pierna o el cuerpo de Fusen; Franky utiliza un cuerpo sin antebrazos y exactamente dos piezas mecánicas. Las anclas se separan de la lógica en `src/data/luffy-art.ts` y `src/data/technique-joints.ts`. No se añade una katana desde el hombro ni otra pierna sobre una pose que ya la tiene.

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


## Técnicas v5 — poses completas y piezas conectadas

Ocho hojas `assets/characters/{zoro,sanji,nami,usopp,chopper,robin,brook,jinbe}-combat-v5.png`, **1152×768** transparentes. Seis columnas de **192×128**, ancla de apoyo **(80,118)**. Filas: base frontal/posterior, estilo 1 frontal/posterior, estilo 2 frontal/posterior. Cada fila utiliza una perspectiva de tres cuartos orientada a la derecha; izquierda se espeja y arriba utiliza la vista posterior. Son vistas adaptadas, no rotación continua dibujada para cada ángulo. Claves: guardia, anticipación, contacto, continuación, recogida, guardia. Sogeking comparte su guardia inicial/final; las otras claves son distintas. La escala es fija dentro de cada fila para evitar encoger el torso al levantar una espada.

Zoro tiene Santoryu también en base: Oni Giri requiere tres katanas. La tercera forma se compone de tres manifestaciones Santoryu; se ocultan las piernas de las dos manifestaciones laterales. Hay tres cabezas, seis brazos y nueve hojas, con un solo apoyo inferior. Las filas 4/5 del PNG repiten Santoryu para mantener el contrato; el compositor dibuja Asura.

Piezas adicionales:

| Archivo | Dimensiones | Contenido |
| --- | --- | --- |
| `franky-bodies-v5.png` | 288×320 | Tres formas × cuatro vistas, celdas 96×80, ancla (48,74), sin ambos antebrazos |
| `franky-fists-v5.png` | 192×64 | Tres piezas de antebrazo/puño, celdas 64×64, unión al codo por cadena |
| `luffy-kick-bodies-v5.png` | 288×320 | Tres formas × cuatro vistas con dos brazos y una pierna de apoyo; el rig sustituye la pierna ausente |
| `luffy-sandals-v5.png` | 96×16 | Tres terminaciones texturizadas, celdas 32×16 |
| `luffy-balloon-v5.png` | 288×320 | Tres formas × cuatro vistas del cuerpo hinchado completo de Fusen |

El build precarga estas piezas y las hojas de combate del mismo origen, además de los 33 atlas normales y las capas v4. Presupuesto conjunto: menos de **8 MB** de PNG; revisión actual aproximadamente **7,33 MB**. `scripts/optimize-png.mjs` recomprime IDAT sin cambiar ningún píxel y verifica la igualdad de los datos descomprimidos.

Exportar poses: `node scripts/compile-combat-art.mjs /ruta/config.json`. Entradas `{id,source,heights:[70,70,72]}`; `sourceRows`, `rowMap`, `rowCuts` y `poseMap` permiten ordenar y separar filas; `patch:{target,row,count}` incorpora filas dibujadas aparte. Ejemplo: una hoja de Nami por estilo usa `sourceRows:2`, `heights:[70]`, con la primera como base y las otras parcheando las filas 2/4 con `count:2`. Se verifican recortes y poses vacías después de exportar.

Exportar piezas: `node scripts/compile-luffy-art.mjs /ruta/config.json` admite además `{kick:"/ruta/12-cuerpos.png",franky:"/ruta/3-antebrazos.png",frankyBody:"/ruta/12-cuerpos-sin-antebrazos.png",balloon:"/ruta/12-fusen.png"}`. El build utiliza los PNG versionados; no necesita generar ni descargar imágenes. Para reemplazar el arte propio de las técnicas deben sustituirse estas hojas/piezas con el mismo contrato, además del manifiesto normal si se cambia reposo/marcha.

Procedencia: ilustraciones originales creadas para esta revisión con asistencia de IA de imagen, usando como referencia las hojas originales de la revisión anterior. No son sprites oficiales ni recursos extraídos de juegos. El registro MIT de los retratos de reserva continúa separado. La revisión visual no constituye aprobación artística del usuario.

Banco visual: con `npm run dev` activo, `node scripts/review-combat-art.mjs` genera las galerías de [base](screenshots/tecnicas-forma-0-v5.png), [estilo 1](screenshots/tecnicas-forma-1-v5.png) y [estilo 2](screenshots/tecnicas-forma-2-v5.png): 18 técnicas × tres formas × seis tiempos. El selector incorpora «Ver técnica», elección de técnica propia y vista.
