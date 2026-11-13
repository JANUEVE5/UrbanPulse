# Changelog

Todos los cambios relevantes del proyecto se documentan en este fichero.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- RF10/RF12: selección de prioridad (`Baja`, `Media` o `Alta`) al registrar una incidencia y controles de
  cambio de prioridad y estado en el detalle según el rol del usuario.
- RF12: transiciones de estado con rechazo desde `Abierta` o `En revisión`, reapertura desde `Resuelta` o
  `Cerrada`, motivo obligatorio para estas acciones e historial cronológico de actor, transición y fecha.
- RF13: comentarios de hasta 400 caracteres en incidencias, persistidos con autor y fecha.
- RF01/RF02 (frontend): pantallas de iniciar sesión y crear cuenta; la sesión se guarda (almacén cifrado en
  móvil, `localStorage` en web) y se restaura al abrir la app. Crear una incidencia sin sesión lleva al login y
  después abre el formulario. La barra lateral muestra el usuario, su rol y «Cerrar sesión», y la sección
  Administración solo para `ADMIN`.
- Cliente HTTP común (`apiClient.ts`) que añade el token a las peticiones y traduce los errores a mensajes claros.
- RF01/RF02 (backend): autenticación con Spring Security y JWT. `POST /api/auth/register`, `POST /api/auth/login`
  y `GET /api/auth/me`. Contraseñas con BCrypt y roles `CITIZEN`, `OPERATOR`, `TECHNICIAN`, `ADMIN` y `ANALYST`.
- Usuarios de prueba con roles en `data.sql` (contraseña de desarrollo `urbanpulse-dev`) y variables
  `JWT_SECRET` y `JWT_EXPIRATION_MINUTES`.
- RF08: vista principal de mapa con un marcador por incidencia. El primer clic en un marcador muestra una
  tarjeta con el título, la calle y el estado; el clic en la tarjeta abre el detalle (igual en móvil y web) (#18).
- Botón para cambiar entre mapa y lista (arriba a la derecha) y botón flotante para crear incidencias
  (abajo a la derecha).
- Logo de UrbanPulse: icono de la app, icono adaptativo de Android, splash, favicon y `logo.webp` en la barra
  lateral.
- Barra lateral de navegación: fija a la izquierda en pantallas anchas y desplegable con un botón de menú
  arriba a la izquierda en móvil. Incluye las secciones futuras Perfil, Ajustes y Administración (desactivadas).
- Paleta propia de UrbanPulse (azul mar y naranja señal) en modo claro y oscuro.
- RF04 (versión mínima): las incidencias guardan latitud y longitud (`NUMERIC(9,6)`), obligatorias y validadas
  al registrar; el formulario las envía desde el mapa y el detalle muestra la ubicación guardada (#14).
- Botón con flecha para volver al listado desde el detalle de una incidencia.
- ESLint configurado en el frontend (`eslint-config-expo`) para que `npx expo lint` funcione.
- Documentación del repositorio: `docs/architecture.md` (modelo C4), `docs/development.md`,
  `docs/deployment.md`, índice y plantilla de ADRs en `docs/adr/`.
- ADRs en `docs/adr/`: ADR-001 a ADR-004 migrados al formato común; ADR-005 a ADR-007 aceptados (cliente
  Expo, esquema SQL explícito, configuración por entorno) y ADR-008 a ADR-012 propuestos (ciclo de vida,
  autenticación, localización, convenciones de API y despliegue en contenedores).
- `docs/requirements.md` con los RF, su priorización MoSCoW y el alcance del Sprint 1; un issue por requisito
  (#11–#34; RF20 y RF25 en #35–#36, cerrados como *not planned*), etiquetas MoSCoW y milestone `Sprint 1` en GitHub.
- Plantillas de issues y de Pull Request en `.github/`.
- `AGENTS.md`, skills compartidas en `.agents/` y configuración de Claude Code en `.claude/`.
- `.env.example` y `compose.yaml` para levantar PostgreSQL en local.
- `CHANGELOG.md`, `SECURITY.md` y `CODE_OF_CONDUCT.md`.

### Changed

- RF12: los cambios de estado requieren los roles `OPERATOR`, `TECHNICIAN` o `ADMIN`; los cambios de
  prioridad requieren `OPERATOR` o `ADMIN`. El backend verifica los roles y registra al actor autenticado.
- La creación de incidencias requiere ubicación geográfica válida y autenticación, conforme al contrato actual.
- Crear incidencias exige estar autenticado; el creador es el usuario del token (antes, el primer usuario
  de la base de datos). Consultar incidencias sigue siendo público.
- `GET /api/users` solo para `ADMIN` y sin exponer la entidad JPA (devuelve `UserDTO`).
- ADR-009 pasa a `Accepted`.
- La configuración del backend se lee de variables de entorno (`${VARIABLE:valor-por-defecto}` en
  `application.properties`), con valores por defecto solo para desarrollo.
- CORS se configura en un único sitio (`WebConfig`) con los orígenes de `CORS_ALLOWED_ORIGINS`; se eliminan
  los `@CrossOrigin("*")` de los controllers.
- Los logs de SQL (`spring.jpa.show-sql`) se desactivan por defecto y se activan con `SHOW_SQL=true`.
- Frontend actualizado a **Expo SDK 58** (React Native 0.88, React 19.3, Expo Router 58, react-native-maps 1.29)
  para poder probar la app con la versión actual de Expo Go. Requiere **Node.js 22.13 o superior**; la CI pasa a
  Node 22.
- Paleta adaptada a los colores del logo (azul `#104F85` y naranja `#F5841B`); los botones de la app usan
  esos tokens en lugar de colores escritos a mano.
- La app usa siempre el tema claro (se elimina el modo oscuro): el logo, mitad azul, no se distinguía sobre
  fondos oscuros.
- ADR-010 pasa a `Accepted`.
- El detalle ya no deduce la posición a partir del nombre de la calle: usa las coordenadas de la API.
- `IncidentMapView` migrado a TypeScript; `npx tsc --noEmit` vuelve a pasar en el frontend.
- En web, las pantallas de incidencias empiezan debajo de la barra de pestañas superior.
- `README.md` reorganizado: visión del proyecto, características y tecnologías. La guía de instalación pasa
  a `docs/development.md`.
- `CONTRIBUTING.md` ampliado con nombres de ramas, Conventional Commits, Pull Requests y Twelve-Factor.
- `.gitignore` raíz completado (secretos, IDEs, logs) y `.idea/` deja de versionarse.

### Removed

- Plantilla de Expo: pantallas Home y Explore, pestañas, componentes e imágenes de ejemplo, script
  `reset-project` y las dependencias que solo usaba la plantilla. La app se llama UrbanPulse en `app.json`.
- Pantalla `CreateIncidentScreen.jsx`, ruta `create-incident` y servicios `IncidentService.js` duplicados.
- `frontend/LICENSE` de la plantilla de Expo (el proyecto usa la licencia MIT de la raíz).

### Fixed

- Crear una incidencia con «Mi ubicación» fallaba con «Revisa los datos»: el GPS devuelve coordenadas con más
  de 6 decimales y la API las rechazaba. Ahora la app las redondea a 6 decimales antes de enviarlas (#47).
- Error `_leaflet_pos` en consola al salir de una pantalla con mapa en web.

## [0.1.0] - Sprint 1

> Versión aún sin etiquetar. Se publicará con `git tag -a v0.1.0` al cerrar el sprint.

### Added

- Pantalla de nueva incidencia con mapa (OpenStreetMap en web, react-native-maps en móvil) y
  geolocalización (#6).
- Registro de incidencias con título, descripción y categoría: `POST /api/incidents` (RF03, #4).
- Listado y detalle de incidencias con su historial de estados: `GET /api/incidents` y
  `GET /api/incidents/{id}` (RF06, #3).
- Datos de prueba realistas para el mapa (#5).
- Entidad `AppUser` y endpoint `GET /api/users` (#2).
- Workflows de CI para backend y frontend (#1).

### Changed

- README con instrucciones de instalación para Windows y Linux (#7).

[Unreleased]: https://github.com/JANUEVE5/UrbanPulse/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/JANUEVE5/UrbanPulse/releases/tag/v0.1.0
