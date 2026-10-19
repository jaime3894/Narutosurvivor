# Recursos visuales — FASE 3

El juego incluye cuerpos animados y enemigos dibujados con Canvas, más retratos y rostros de fan art original MIT. No necesita descargar imágenes durante la partida. Los sprites no proceden de juegos oficiales ni capturas del anime.

## Procedencia y créditos

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

Los atlas generados se cachean por personaje/forma en memoria. La orientación lateral adapta la pose, cabeza y extremidades; no equivale a cuatro ilustraciones independientes de autor. La revisión ampliada se conserva en [galería](screenshots/fase3-galeria.png). Es una primera versión jugable pendiente de valoración artística del usuario.

## Ataques y anclas

El atlas es corporal: la extensión de un brazo no cabe en una celda. `src/render/techniques.ts` dibuja extremidades/armas conectadas desde el actor, con hombro visual a `(0,-31)` respecto a pies. `src/game/techniques.ts` controla anticipación, fase activa, impactos y recuperación con paso fijo; el render consume esos tiempos. Sustituir un atlas no cambia daño ni colisión. Luffy mantiene hombro–brazo–puño al estirar y retraer; Zoro mueve hojas; Sanji extiende/gira piernas. Franky utiliza cadena metálica y Boundman brazos oscuros de haki, con estilos separados.

Cada personaje tiene idle, caminar, ataque y daño; las piernas alternan y las armas acompañan la pose. La reducción de movimiento conserva las señales funcionales y reduce vapor, temblores y partículas. Los enemigos tienen uniforme y gorra de la Marina, ropa de la banda de Buggy o cuerpo pesado/maza de los matones de Alvida. Son esbirros originales; jefes con nombre en fase 4.

## Recursos de fases siguientes

- Jefes: celdas previstas 96×96; definir manifiesto de patrones y anticipaciones durante fase 4.
- Suelos: mosaicos 16×16 sin suavizado, integración por isla en fase 4.
- Audio: solo original o con licencia registrada; implementación en fase 6.

Registrar siempre autor, URL, licencia y modificaciones de cualquier nuevo recurso. El atlas corporal opcional ya funciona; los contratos de jefes, terreno y audio aún no son cargadores implementados.
