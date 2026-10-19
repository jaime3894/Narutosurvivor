# Publicar el juego con GitHub Pages

Se ha preparado `.github/workflows/pages.yml`: cada push a `main` instala dependencias, ejecuta tests de lógica, compila, prueba Chromium y sube `dist` a GitHub Pages. También permite ejecución manual. Solo se publica si todas las comprobaciones pasan. No requiere introducir tokens ni credenciales en el código: utiliza el token limitado que GitHub proporciona al workflow.

Juego publicado:

https://jaime3894.github.io/One-piece-survivor/

Publicación confirmada mediante la ejecución correcta del workflow y respuestas HTTPS 200 de la página y sus assets.

## Activación inicial, si aún no está habilitado Pages

1. Abrir https://github.com/jaime3894/One-piece-survivor/settings/pages con la cuenta propietaria.
2. En **Build and deployment → Source**, seleccionar **GitHub Actions**. No crear un segundo workflow desde una plantilla; el repositorio ya tiene uno.
3. Abrir https://github.com/jaime3894/One-piece-survivor/actions/workflows/pages.yml y comprobar la ejecución. Si la primera falló porque Pages estaba desactivado, pulsar **Run workflow → main → Run workflow** después de activarlo.
4. Esperar a que terminen «Validar y construir» y «Publicar». El entorno `github-pages` muestra la dirección generada por GitHub.

Una vez activado, las siguientes fases se publican al subir a `main`. No hay que ejecutar npm en el PC para jugar.

## Validación local realizada

- `npm test`: 143 tests aprobados.
- `npm run build`: tipos y build aprobados.
- `npm run test:e2e`: quince pruebas aprobadas, incluida una que sirve `dist` bajo `/One-piece-survivor/`, carga el juego e inicia una partida.
- `vite.config.ts` usa rutas relativas para que los assets funcionen en la subcarpeta del repositorio.

El test local de ruta no acredita que GitHub haya completado el despliegue remoto.

## Publicación verificada

El propietario hizo público el repositorio y habilitó Pages con Source GitHub Actions. Después se lanzó el workflow existente. La ejecución [39228910746](https://github.com/jaime3894/One-piece-survivor/actions/runs/39228910746) terminó correctamente: validación, construcción, pruebas de navegador, subida del artefacto, configuración de Pages y despliegue.

La página pública devuelve HTTP 200 y el título «Marea de aventuras». JavaScript y CSS publicados se descargaron con verificación TLS normal y coinciden byte por byte con el build local validado. No se aplicó ninguna excepción TLS. Chromium en el cloud no completó la navegación HTTPS directa por su almacén de certificados del proxy; esa comprobación no se da por aprobada. Las ocho pruebas E2E del build sí pasaron en GitHub y la disponibilidad de página y assets se verificó por HTTPS.

Los bloqueos anteriores están resueltos para publicar: primero faltaba acceso de red, después la visibilidad y activación de Pages. No se añadieron tokens al código. La integración continúa sin poder cambiar ajustes administrativos, pero el workflow ya puede desplegar con sus permisos de Pages.

Las próximas fases se actualizarán en la misma URL cuando su workflow complete las comprobaciones y el despliegue. La entrega de FASE 3 añade diez capitanes, 30 estilos, nakama y arte integrado; cada despliegue se valida antes de publicar. El historial anterior de esta página corresponde al primer despliegue de FASE 2.
