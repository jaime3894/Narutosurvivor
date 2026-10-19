# Publicar el juego con GitHub Pages

Se ha preparado `.github/workflows/pages.yml`: cada push a `main` instala dependencias, ejecuta tests de lógica, compila, prueba Chromium y sube `dist` a GitHub Pages. También permite ejecución manual. Solo se publica si todas las comprobaciones pasan. No requiere introducir tokens ni credenciales en el código: utiliza el token limitado que GitHub proporciona al workflow.

Dirección prevista después del primer despliegue correcto:

https://jaime3894.github.io/Narutosurvivor/

Esta URL no constituye prueba de que Pages esté habilitado o de que el despliegue haya terminado. Consultar la ejecución de Actions y comprobar la página antes de anunciarla como publicada.

## Activación inicial, si aún no está habilitado Pages

1. Abrir https://github.com/jaime3894/Narutosurvivor/settings/pages con la cuenta propietaria.
2. En **Build and deployment → Source**, seleccionar **GitHub Actions**. No crear un segundo workflow desde una plantilla; el repositorio ya tiene uno.
3. Abrir https://github.com/jaime3894/Narutosurvivor/actions/workflows/pages.yml y comprobar la ejecución. Si la primera falló porque Pages estaba desactivado, pulsar **Run workflow → main → Run workflow** después de activarlo.
4. Esperar a que terminen «Validar y construir» y «Publicar». El entorno `github-pages` muestra la dirección generada por GitHub.

Una vez activado, las siguientes fases se publican al subir a `main`. No hay que ejecutar npm en el PC para jugar.

## Validación local realizada

- `npm test`: 82 tests aprobados.
- `npm run build`: tipos y build aprobados.
- `npm run test:e2e`: ocho pruebas aprobadas, incluida una que sirve `dist` bajo `/Narutosurvivor/`, carga el juego e inicia una partida.
- `vite.config.ts` usa rutas relativas para que los assets funcionen en la subcarpeta del repositorio.

El test local de ruta no acredita que GitHub haya completado el despliegue remoto.

## Bloqueo observado desde el entorno cloud

La conexión a `api.github.com` y `jaime3894.github.io` recibe un 403 del proxy durante CONNECT, antes de llegar al servicio. Se puede subir código por Git, pero ese resultado no establece permisos de administración de Pages. No se ha confirmado el estado de Pages desde la API ni se ha podido comprobar la web pública desde este entorno.

Se han añadido ambos destinos al borrador de red del entorno, conservando los presets existentes. Guardar un borrador no aplica la red: se necesita revisar, guardar y publicar en ajustes. La activación de GitHub Pages se puede realizar directamente en GitHub independientemente de ese cambio de red. No se necesita pegar secretos en el chat.
