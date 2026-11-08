# AGENTS.md — Instrucciones para agentes de IA

Fichero canónico de instrucciones para cualquier agente de IA (Claude Code, Copilot, Codex, Cursor…) que
trabaje en este repositorio. `CLAUDE.md` (Claude Code) y `GEMINI.md` (Gemini CLI / Antigravity) lo importan,
así que las normas se mantienen en un único sitio. Hay instrucciones específicas en
[`backend/AGENTS.md`](backend/AGENTS.md) y [`frontend/AGENTS.md`](frontend/AGENTS.md).

## Contexto del proyecto

UrbanPulse es una plataforma cloud de gestión de incidencias urbanas (proyecto universitario, UMA).

- **Backend:** API REST en Java 17 + Spring Boot (monolito modular). Código en `/backend`.
- **Frontend:** app Expo / React Native + TypeScript (móvil y web). Código en `/frontend`.
- **Base de datos:** PostgreSQL 15 con esquema mantenido a mano (`backend/src/main/resources/schema.sql`).
- **Documentación:** `docs/requirements.md` (RF y MoSCoW), `docs/architecture.md` (C4), `docs/development.md`, `docs/deployment.md` y `docs/adr/`.

Antes de diseñar algo, lee `docs/architecture.md` y los ADR de `docs/adr/`. No contradigas un ADR
`Accepted` sin proponer uno nuevo que lo sustituya.

## Pautas de diseño (obligatorias)

1. La **incidencia** es la entidad central y su ciclo de vida es auditable: toda transición de estado se
   registra en `"StatusChange"` y el historial nunca se modifica ni se borra.
2. Los **datos externos enriquecen, nunca bloquean**: crear una incidencia no puede fallar porque una fuente
   externa no esté disponible.
3. Elige **la solución más sencilla** que cumpla el requisito. No añadas componentes (colas, cachés,
   microservicios…) sin un problema observable y un ADR.
4. **Cada cambio relevante actualiza el modelo C4 (`docs/architecture.md`), un ADR y las pruebas
   asociadas.**

## Twelve-Factor (obligatorio)

- La configuración que cambia entre entornos va en variables de entorno. Documéntala en `.env.example` y
  nunca la escribas en el código.
- **Nunca** escribas contraseñas, tokens, claves ni cadenas de conexión reales en el código, la
  documentación o los tests. No leas ni modifiques ficheros `.env`.
- Las dependencias se declaran explícitamente: `pom.xml` (con `./mvnw`) y `package.json` (con
  `npx expo install`).
- El backend no guarda estado en memoria entre peticiones. Los logs van a stdout.
- Mantén la paridad de versiones entre local, CI y despliegue: Java 17, Node 22, PostgreSQL 15.

## Flujo de Git (obligatorio)

- **Nunca hagas commit ni push en `main`.** Todo cambio va en una rama `tipo/descripcion-kebab`
  (`feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `ci/`, `chore/`, `hotfix/`) y entra por Pull Request.
- Usa **Conventional Commits**: `tipo(ámbito): descripción en imperativo`, en español. Ejemplo:
  `feat(incidents): validar coordenadas al registrar`.
- Commits pequeños y con una sola finalidad. Nunca hagas `push --force` sobre ramas compartidas.
- Los PR usan `.github/pull_request_template.md` y referencian su issue (`Closes #N`).
- **No añadas atribución de IA** en commits ni PR (nada de `Co-Authored-By` de agentes ni pies del tipo
  "Generated with…").
- No fusiones, apruebes ni cierres PR sin que lo pida explícitamente una persona del equipo.

Detalles completos en [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Comandos

```bash
docker compose up -d                       # PostgreSQL local (requiere .env)
cd backend && ./mvnw spring-boot:run       # arrancar la API (:8080)
cd backend && ./mvnw verify                # compilar + tests (lo que ejecuta la CI)
cd frontend && npx expo start              # arrancar la app
cd frontend && npx tsc --noEmit && npx expo lint
```

Ejecuta las validaciones del subproyecto que hayas tocado antes de dar una tarea por terminada.

## Skills del proyecto

En `.agents/skills/` hay procedimientos reutilizables (Claude Code los ve a través de `.claude/skills`):

| Skill | Cuándo usarla |
|---|---|
| `nuevo-adr` | Registrar una decisión de arquitectura en `docs/adr/`. |
| `flujo-git` | Crear la rama, hacer commits convencionales y abrir el PR. |

## Cero suposiciones

- Antes de generar código de backend, lee `schema.sql` y `data.sql`. No inventes columnas, relaciones ni
  estados que no existan. Si hacen falta, cambia el esquema de forma explícita y documentada.
- Los requisitos (RF01–RF26), su prioridad MoSCoW y el alcance del sprint están en `docs/requirements.md`.
  Cada requisito tiene un issue de GitHub con criterios de aceptación: léelo con `gh issue view <n>` y
  ciérralo desde el PR con `Closes #<n>`.
- Si un requisito depende de un ADR en estado `Proposed`, pregunta antes de implementarlo.
- Si un requisito es ambiguo, pregunta antes de implementar.
