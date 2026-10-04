# AdopMe

AdopMe es una aplicación de adopción de mascotas que corre entera en el navegador. La persona busca perros, gatos y otros compañeros, guarda favoritos, responde un test de compatibilidad, envía una solicitud y el refugio de demostración da seguimiento. No hay servidor de aplicación.

**No usa Firebase ni ningún otro backend.** Las cuentas, el catálogo editado, las solicitudes, los favoritos, el tema y el resultado del test viven en `localStorage` de este navegador. La sesión activa vive en `sessionStorage`. Si se borra el almacenamiento del sitio, esos datos desaparecen.

## Tecnologías

- HTML, CSS y JavaScript en módulos ES, sin React, Angular ni Vue.
- Leaflet 1.9.4 por CDN para el mapa de refugios en Morelia.
- Playwright para las pruebas de extremo a extremo y `node:test` para servicios, validadores y repositorios.
- Un servidor estático cualquiera. Los módulos ES no funcionan abriendo `index.html` como archivo (`file://`).

## Requisitos

- Node.js 20 o superior (para las pruebas y `npm`).
- Python 3 (el comando `npm start` lo usa como servidor estático).

## Estructura

```
config/app.config.js          Claves de almacenamiento, estados y parámetros
index.html                    Página única
src/main.js                   Arranque
src/core/                     Composición (app.js) y referencias al DOM
src/infrastructure/storage/   Puerto de almacenamiento: navegador, memoria y JSON
src/modules/<feature>/        Reglas, repositorio y controlador de cada feature
src/shared/                   Errores, validadores y utilidades
src/ui/                       HTML escapado, toasts y movimiento
src/styles/                   CSS partido en base, componentes, movimiento y responsive
tests/unit/                   Pruebas de Node
tests/adopme.spec.js          Flujos de Playwright
docs/                         Auditoría, arquitectura y contribución
```

La navegación de la página son anclas (`#catalogo`, `#refugios`, `#proceso`). No hay router.

## Instalación

```bash
npm install
```

`npm install` solo descarga Playwright. La aplicación en el navegador no empaqueta dependencias.

## Ejecutar en local

```bash
npm start
```

Abre [http://127.0.0.1:4173](http://127.0.0.1:4173).

El mismo puerto usa la configuración de Playwright. Si ya hay un proceso escuchando en el 4173, ciérralo antes de correr las pruebas de extremo a extremo.

## Pruebas

```bash
npm test          # node:test y después Playwright
npm run test:unit # solo servicios, validadores y repositorios
npm run test:e2e  # solo Playwright
```

La primera vez que Playwright necesite el navegador:

```bash
npx playwright install chromium
```

## Arquitectura en una frase

`createApp` construye adaptadores de almacenamiento, se los inyecta a los repositorios y los servicios no conocen `localStorage`. Los controladores escuchan la página y pintan con funciones de `src/ui`. El detalle está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Cómo agregar un módulo

1. Crea `src/modules/<nombre>/` con lo que de verdad haga falta: `service.js` para reglas, `repository.js` si guarda datos, `controller.js` si habla con el DOM.
2. Si persiste algo, añade la clave en `config/app.config.js` y usa `createJsonStore` con el adaptador que ya inyecta `createApp`. No llames a `localStorage` desde el servicio.
3. Conecta el controlador en `src/core/app.js` mediante el objeto `actions`, sin importar otros controladores.
4. Añade una prueba en `tests/unit` con `createMemoryStorage` y, si hay flujo visible, un caso en `tests/adopme.spec.js`.

## Convenciones

- JavaScript con módulos ES y funciones de fábrica. Hay clases solo para los errores (`AppError`, `StorageError`, `ValidationError`).
- El repositorio lee y escribe. El servicio decide. El controlador coordina. La UI arma HTML.
- Todo texto que venga de datos y se meta en `innerHTML` pasa por `escapeHtml`. Las fotos pasan por `safeImageUrl`.
- Las claves `adopme-*` y la forma de los JSON se mantienen para no perder datos ya guardados. El hash de contraseña es PBKDF2-SHA256 con 120 000 iteraciones: cambiarlo invalida las cuentas existentes.
- No se suben secretos, `node_modules/` ni `test-results/`.

## Datos que ya entiende la aplicación

| Clave | Dónde | Contenido |
| --- | --- | --- |
| `adopme-pets` | `localStorage` | Catálogo. Si falta o el JSON no es un array, se usan las 6 mascotas semilla |
| `adopme-adoptions` | `localStorage` | Solicitudes. Si faltaba folio o estado, se completan al arrancar |
| `adopme-favorites` | `localStorage` | Ids de favoritos |
| `adopme-compatibility` | `localStorage` | Respuestas del test |
| `adopme-accounts` | `localStorage` | `{ nombre, correo, salt, passwordHash }` |
| `adopme-session` | `sessionStorage` | `{ nombre, correo }` |
| `adopme-theme` | `localStorage` | `dark` o `light` |
