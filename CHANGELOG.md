# Changelog

Todos los cambios relevantes del proyecto se documentan en este fichero.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

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

- ADR-010 pasa a `Accepted`.
- El detalle ya no deduce la posición a partir del nombre de la calle: usa las coordenadas de la API.
- `IncidentMapView` migrado a TypeScript; `npx tsc --noEmit` vuelve a pasar en el frontend.
- En web, las pantallas de incidencias empiezan debajo de la barra de pestañas superior.
- `README.md` reorganizado: visión del proyecto, características y tecnologías. La guía de instalación pasa
  a `docs/development.md`.
- `CONTRIBUTING.md` ampliado con nombres de ramas, Conventional Commits, Pull Requests y Twelve-Factor.
- `.gitignore` raíz completado (secretos, IDEs, logs) y `.idea/` deja de versionarse.

### Removed

- Pantalla `CreateIncidentScreen.jsx`, ruta `create-incident` y servicios `IncidentService.js` duplicados.
- `frontend/LICENSE` de la plantilla de Expo (el proyecto usa la licencia MIT de la raíz).

### Fixed

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
