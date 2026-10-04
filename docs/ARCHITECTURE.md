# Arquitectura

AdopMe es una sola página. El estado de negocio vive en el navegador y la interfaz no habla con un servidor propio. **No hay Firebase.** El mapa pide teselas a OpenStreetMap y las fuentes e imágenes salen de CDNs; eso no guarda datos de la aplicación.

## Antes

`src/main.js` (unas 1 230 líneas) mezclaba datos semilla, reglas, `localStorage`, hashing, plantillas HTML y todos los eventos. `AdoptionTools` también escribía `localStorage` por su cuenta. La auditoría de ese estado está en [AUDIT.md](AUDIT.md).

## Ahora

```
index.html
   │
   ▼
src/main.js
   │
   ▼
src/core/app.js          crea adaptadores e inyecta dependencias
   │
   ├── infrastructure/storage
   │     browser-storage.js   localStorage / sessionStorage, errores de cuota
   │     memory-storage.js    mismo contrato, para pruebas
   │     json-store.js        JSON.parse protegido
   │
   ├── modules/<feature>
   │     repository   una clave, sin reglas de pantalla
   │     service      reglas (filtro, puntuación, alta, login, migración)
   │     controller   eventos y cuándo volver a pintar
   │
   └── ui/render      cadenas HTML ya escapadas
```

No hay router: `#catalogo` y `#refugios` son anclas del navegador. No hay bus de eventos. `app.js` pasa un objeto `actions` para que un controlador pida «abre la solicitud» o «repinta recomendaciones» sin importar al otro. Así no se forman ciclos.

## Inversión de dependencias

Los servicios reciben repositorios. Los repositorios reciben un almacén con tres operaciones:

```js
getItem(key)    // string | null
setItem(key, value)
removeItem(key)
```

`createBrowserStorage` adapta el almacenamiento del navegador y convierte `QuotaExceededError` en `StorageError`. `createMemoryStorage` hace lo mismo sobre un `Map`. Un repositorio no pregunta cuál de los dos le llegó. Las pruebas construyen el servicio con memoria y no necesitan DOM.

`createJsonStore` distingue tres casos: clave ausente, JSON válido y JSON corrupto. Un valor ilegible no tumba el arranque: el catálogo vuelve a la semilla, las listas vacías siguen vacías y las preferencias quedan en `null`.

## Features y dónde viven

| Feature | Reglas | Datos |
| --- | --- | --- |
| Catálogo, ficha, filtros | `modules/catalog` | `adopme-pets` |
| Favoritos | `modules/favorites` | `adopme-favorites` |
| Solicitudes y seguimiento | `modules/adoptions` | `adopme-adoptions` |
| Cuentas | `modules/auth` | `adopme-accounts` y `adopme-session` |
| Test y recomendaciones | `modules/compatibility` | `adopme-compatibility` |
| Mapa de refugios | `modules/refuges` | Datos fijos, sin almacenamiento |
| Panel del refugio | `modules/refuge-panel` | Reutiliza catálogo y solicitudes |
| Tema | `modules/theme` | `adopme-theme` |
| Estadísticas | `modules/stats/service.js` | Solo calcula, no guarda |

El panel de refugio sigue siendo una demo de este navegador: no pide sesión. Así estaba y así se conserva.

## Compatibilidad de datos

- Misma clave y mismos nombres de campo que antes (`mascotaId`, `cuentaCorreo`, `estadoSolicitud`, `fecha`, etc.).
- Al arrancar, una solicitud sin `solicitudId` o sin `estadoSolicitud` recibe `Recibida` y un folio, y se reescribe la clave.
- Las mascotas sin `estado` se tratan como `Disponible` en memoria. La semilla no se reescribe hasta que alguien publica, edita o borra.
- La contraseña se deriva con PBKDF2, SHA-256, sal de 16 bytes, 120 000 iteraciones y 256 bits. Esos números están en `config/app.config.js` y no deben bajar si ya hay cuentas guardadas.

## Errores y XSS

`ValidationError` es un dato mal formado (correo, foto que no es `https`, solicitud incompleta). `StorageError` es un fallo del navegador. Los controladores muestran el mensaje en el aviso, el `alert` de la solicitud o el texto del panel, y no dejan el catálogo a medias si la escritura falla.

El HTML dinámico se escapa con `escapeHtml`. Las URLs de foto solo se pintan si el esquema es `http` o `https` (`safeImageUrl`). El alta nueva exige `https`.

## Qué se dejó fuera a propósito

- Firebase y cualquier backend.
- Un router y un bus de eventos: no aportan en una sola página.
- Archivos vacíos «por si acaso». Cada archivo importa o lo importa alguien.
