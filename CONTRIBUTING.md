# Guía de contribución

Gracias por contribuir a UrbanPulse. Esta guía recoge las normas de trabajo del equipo. Seguirlas mantiene
`main` estable y la historia del proyecto legible.

## Índice

1. [Flujo de trabajo (GitHub Flow)](#1-flujo-de-trabajo-github-flow)
2. [Nombres de ramas](#2-nombres-de-ramas)
3. [Convención de commits](#3-convención-de-commits)
4. [Pull Requests](#4-pull-requests)
5. [Issues, etiquetas y milestones](#5-issues-etiquetas-y-milestones)
6. [Documentación y ADRs](#6-documentación-y-adrs)
7. [Buenas prácticas Twelve-Factor](#7-buenas-prácticas-twelve-factor)
8. [Versionado y releases](#8-versionado-y-releases)
9. [Roles del equipo](#9-roles-del-equipo)

---

## 1. Flujo de trabajo (GitHub Flow)

**Nunca se trabaja directamente sobre `main`.** `main` representa siempre una versión estable.

1. Partir de `main` actualizada:
   ```bash
   git switch main
   git pull
   ```
2. Crear una rama para el cambio:
   ```bash
   git switch -c feature/registro-incidencias
   ```
3. Hacer commits pequeños y con una única finalidad.
4. Ejecutar las pruebas en local (ver [docs/development.md](docs/development.md)).
5. Subir la rama:
   ```bash
   git push -u origin feature/registro-incidencias
   ```
6. Abrir un Pull Request contra `main` y rellenar la plantilla.
7. Esperar a que pase la CI y a la revisión de, al menos, otra persona del equipo.
8. Fusionar con *merge commit* y borrar la rama.

## 2. Nombres de ramas

Formato: `tipo/descripcion-corta-en-kebab-case`

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `feature/` | Nueva funcionalidad | `feature/asignacion-incidencias` |
| `fix/` | Corrección de un error | `fix/validacion-coordenadas` |
| `docs/` | Solo documentación | `docs/adr-autenticacion` |
| `refactor/` | Cambio interno sin alterar el comportamiento | `refactor/unificar-servicios-frontend` |
| `test/` | Pruebas | `test/ciclo-vida-incidencia` |
| `ci/` | Integración continua | `ci/commitlint` |
| `chore/` | Tareas auxiliares (dependencias, configuración) | `chore/actualizar-expo` |
| `hotfix/` | Corrección urgente sobre `main` | `hotfix/error-500-crear-incidencia` |

## 3. Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```text
<tipo>(<ámbito opcional>): <descripción en imperativo y minúsculas>

[cuerpo opcional: qué y por qué]

[pie opcional: Closes #12, BREAKING CHANGE: ...]
```

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `docs` | Cambios en documentación |
| `style` | Formato, espacios, linting (sin cambios de lógica) |
| `refactor` | Cambio interno sin alterar el comportamiento |
| `test` | Añadir o modificar pruebas |
| `chore` | Tareas auxiliares |
| `ci` | Cambios en integración continua |
| `build` | Cambios en el sistema de build o dependencias |

Ámbitos habituales: `backend`, `frontend`, `incidents`, `users`, `db`, `adr`, `docs`, `ci`.

Ejemplos:

```bash
git commit -m "feat(incidents): permitir registrar incidencias con coordenadas"
git commit -m "fix(frontend): corregir la URL de la API en Android"
git commit -m "docs(adr): añadir ADR-005 sobre autenticación"
git commit -m "test(backend): cubrir las transiciones de estado inválidas"
```

Evita mensajes como `cambios`, `arreglos` o `cosas`.

## 4. Pull Requests

Un Pull Request es una unidad de revisión. Debe explicar **qué** cambia, **por qué** y **cómo se ha
probado**. La plantilla se carga sola al abrirlo ([.github/pull_request_template.md](.github/pull_request_template.md)).

Antes de abrirlo, comprueba que:

- [ ] El código compila (`./mvnw verify` en `backend/`, `npx tsc --noEmit` y `npx expo lint` en `frontend/`).
- [ ] Los tests pasan.
- [ ] No hay secretos ni credenciales en el código.
- [ ] La documentación, el modelo C4 y los ADRs están actualizados si el cambio lo requiere.
- [ ] El PR referencia el issue que cierra (`Closes #N`).

Reglas:

- Un PR resuelve una sola cosa. Si crece demasiado, divídelo.
- Título con formato de Conventional Commit (`feat(incidents): ...`).
- No se fusiona sin la CI en verde y sin al menos una aprobación.
- Quien abre el PR no lo aprueba.

## 5. Issues, etiquetas y milestones

- Todo trabajo empieza con un **issue** creado con las plantillas de `.github/ISSUE_TEMPLATE/`.
- Cada requisito de [docs/requirements.md](docs/requirements.md) tiene su issue (`RF04 — Localización`).
- Etiquetas MoSCoW: `moscow: must`, `moscow: should`, `moscow: could` y `moscow: won't`.
- Otras etiquetas: `bug`, `enhancement`, `documentation`, `refactor`, `security`, `dependencies`,
  `question`, `good first issue`, `help wanted`, `priority: high`, `priority: medium`, `priority: low`,
  `backend` y `frontend`.
- Cada issue se asocia al **milestone** del sprint (`Sprint 1`, `Sprint 2`, …, `Entrega final`).
- El tablero de GitHub Projects sigue el flujo `Backlog → Ready → In Progress → In Review → Done`.
- Los requisitos se identifican por su código (`RF03`, `RF12`…) en el título del issue.

## 6. Documentación y ADRs

Según las pautas del proyecto, **cada cambio relevante actualiza el modelo C4, un ADR y las pruebas asociadas**.

- Arquitectura y C4: [docs/architecture.md](docs/architecture.md).
- Decisiones de arquitectura: [docs/adr/](docs/adr/). Usa [la plantilla](docs/adr/template.md).
- Un ADR aceptado no se edita para cambiar la decisión: se crea uno nuevo que lo sustituye (`Superseded`).

## 7. Buenas prácticas Twelve-Factor

Todo lo que se añada debe respetar los principios de [The Twelve-Factor App](https://12factor.net/es/):

| Factor | Cómo se aplica en UrbanPulse |
|---|---|
| I. Codebase | Un único repositorio y varios despliegues. |
| II. Dependencies | Todas las dependencias se declaran en `pom.xml` y `package.json`, con wrapper `mvnw`. |
| III. Config | La configuración que cambia entre entornos va en variables de entorno (`.env.example`), nunca en el código. |
| IV. Backing services | PostgreSQL, almacenamiento de objetos y APIs externas se configuran por URL o credenciales intercambiables. |
| V. Build, release, run | La CI construye el artefacto y el despliegue lo combina con la configuración. Nunca se compila a mano en producción. |
| VI. Processes | El backend no guarda estado en memoria: los datos van a PostgreSQL y los ficheros a Object Storage. |
| VII. Port binding | La API expone su propio puerto, configurable con `SERVER_PORT`. |
| VIII. Concurrency | Se escala añadiendo instancias del mismo proceso. |
| IX. Disposability | Arranque rápido y apagado limpio (graceful shutdown). |
| X. Dev/prod parity | Las mismas versiones (PostgreSQL 15, Java 17) en local, CI y despliegue, con Docker Compose. |
| XI. Logs | Los logs se escriben en stdout y nunca en ficheros del repositorio. |
| XII. Admin processes | Migraciones y tareas administrativas versionadas en el repositorio. |

## 8. Versionado y releases

- Se usa [versionado semántico](https://semver.org/lang/es/) `MAJOR.MINOR.PATCH`.
- Al cerrar un sprint se crea un tag anotado (`git tag -a v0.2.0 -m "Release v0.2.0"`) y una
  *Release* en GitHub.
- Los cambios se registran en [CHANGELOG.md](CHANGELOG.md) siguiendo
  [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## 9. Roles del equipo

| Rol | Responsabilidad |
|---|---|
| Maintainer | Gestiona el repositorio, las releases y la protección de ramas. |
| Developer | Implementa funcionalidades. |
| Reviewer | Revisa Pull Requests. |
| Tester | Valida la funcionalidad y mantiene las pruebas. |
| Product owner / leader | Prioriza los issues (MoSCoW) y coordina la integración y la demo. |

La asignación concreta de cada sprint se refleja en los issues y en el milestone correspondiente.
