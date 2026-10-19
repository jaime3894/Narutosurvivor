# Marea de aventuras

Prototipo web de supervivencia pirata. Fase 0: infraestructura y portada procedural; todavía sin combate.

Requiere Node.js 22.12+ (validado con Node 24) y npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

El servidor de desarrollo usa el puerto 5173. Debes ver una portada con una isla pixel art y un botón que lleva a la descripción del proyecto. Añade `?debug` para ver semilla y paso temporal objetivo. `npm run preview` sirve el build del directorio dist.

- [Diseño y decisiones](docs/GDD.md)
- [Progreso y pendientes](PROGRESO.md)
- [Contrato de recursos](docs/ASSETS.md)

No se incluyen assets oficiales, servicios externos ni credenciales.
