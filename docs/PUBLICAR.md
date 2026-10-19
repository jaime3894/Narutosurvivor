# Publicar el juego con GitHub Pages

Se ha preparado `.github/workflows/pages.yml`: cada push a `main` instala dependencias, ejecuta tests de lógica, compila, prueba Chromium y sube `dist` a GitHub Pages. También permite ejecución manual. Solo se publica si todas las comprobaciones pasan. No requiere introducir tokens ni credenciales en el código: utiliza el token limitado que GitHub proporciona al workflow.

Dirección prevista después del primer despliegue correcto:

https://jaime3894.github.io/One-piece-survivor/

Esta URL no constituye prueba de que Pages esté habilitado o de que el despliegue haya terminado. Consultar la ejecución de Actions y comprobar la página antes de anunciarla como publicada.

## Activación inicial, si aún no está habilitado Pages

1. Abrir https://github.com/jaime3894/One-piece-survivor/settings/pages con la cuenta propietaria.
2. En **Build and deployment → Source**, seleccionar **GitHub Actions**. No crear un segundo workflow desde una plantilla; el repositorio ya tiene uno.
3. Abrir https://github.com/jaime3894/One-piece-survivor/actions/workflows/pages.yml y comprobar la ejecución. Si la primera falló porque Pages estaba desactivado, pulsar **Run workflow → main → Run workflow** después de activarlo.
4. Esperar a que terminen «Validar y construir» y «Publicar». El entorno `github-pages` muestra la dirección generada por GitHub.

Una vez activado, las siguientes fases se publican al subir a `main`. No hay que ejecutar npm en el PC para jugar.

## Validación local realizada

- `npm test`: 82 tests aprobados.
- `npm run build`: tipos y build aprobados.
- `npm run test:e2e`: ocho pruebas aprobadas, incluida una que sirve `dist` bajo `/One-piece-survivor/`, carga el juego e inicia una partida.
- `vite.config.ts` usa rutas relativas para que los assets funcionen en la subcarpeta del repositorio.

El test local de ruta no acredita que GitHub haya completado el despliegue remoto.

## Estado verificado al continuar la publicación

La API de GitHub ya es accesible. El repositorio informa `has_pages: false`. La ejecución [39219463652](https://github.com/jaime3894/One-piece-survivor/actions/runs/39219463652) completó correctamente instalación, tests, build, navegador y subida del sitio compilado. El job «Publicar» falla en «Configurar Pages» con «Get Pages site failed / Not Found»; el paso de despliegue no llega a ejecutarse.

Se intentó activar Pages con la API oficial (`POST /repos/jaime3894/One-piece-survivor/pages`, `build_type: workflow`). GitHub respondió **403 Resource not accessible by integration**. El acceso general al repositorio y a Actions funciona; falta autorización específica de Pages en la integración. No es un fallo de compilación ni una aprobación pendiente del código.

La URL pública devuelve 404. Para desbloquear la publicación, el propietario debe habilitar Pages con origen **GitHub Actions** mediante los pasos anteriores. Después puede reejecutarse el workflow existente, sin instalar npm en el ordenador. No se debe cambiar la visibilidad del repositorio ni introducir tokens en el código para resolverlo.

Los dominios `api.github.com` y `jaime3894.github.io`, antes bloqueados por el proxy, ya permiten completar estas comprobaciones desde la máquina actual. Esto no acredita por sí solo la publicación de una nueva versión del entorno cloud.
