# Changelog

Todos los cambios relevantes del proyecto se documentan en este fichero.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Documentación del repositorio: `docs/architecture.md` (modelo C4), `docs/development.md`,
  `docs/deployment.md`, índice y plantilla de ADRs en `docs/adr/`.
- Plantillas de issues y de Pull Request en `.github/`.
- `AGENTS.md`, skills compartidas en `.agents/` y configuración de Claude Code en `.claude/`.
- `.env.example` y `compose.yaml` para levantar PostgreSQL en local.
- `CHANGELOG.md`, `SECURITY.md` y `CODE_OF_CONDUCT.md`.

### Changed

- `README.md` reorganizado: visión del proyecto, características y tecnologías. La guía de instalación pasa
  a `docs/development.md`.
- `CONTRIBUTING.md` ampliado con nombres de ramas, Conventional Commits, Pull Requests y Twelve-Factor.
- `.gitignore` raíz completado (secretos, IDEs, logs) y `.idea/` deja de versionarse.

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
