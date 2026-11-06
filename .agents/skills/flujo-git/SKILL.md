---
name: flujo-git
description: Aplica el flujo de trabajo Git de UrbanPulse (GitHub Flow): crear rama con prefijo, commits con Conventional Commits en español, validaciones previas y abrir el Pull Request con la plantilla. Úsala al empezar una tarea, al hacer commit, al subir cambios o al abrir un PR.
---

# Flujo Git de UrbanPulse

## 1. Empezar una tarea

```bash
git switch main && git pull
git switch -c <tipo>/<descripcion-kebab>
```

Tipos de rama: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `ci/`, `chore/`, `hotfix/`.
**Nunca** hagas commit en `main`. Si estás en `main` con cambios, crea la rama antes de hacer commit
(`git switch -c ...` conserva los cambios).

## 2. Commits

- Formato: `tipo(ámbito): descripción en imperativo y minúsculas`, en español y sin punto final.
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`.
- Ámbitos habituales: `backend`, `frontend`, `incidents`, `users`, `db`, `adr`, `docs`, `ci`.
- Un commit = una finalidad. Si un cambio mezcla documentación y código, sepáralo en varios commits.
- Añade los ficheros por nombre (`git add <ruta>`) y revisa `git diff --staged` antes de hacer commit.
  Nunca añadas `.env`, `target/`, `node_modules/` ni ficheros de IDE.
- **Sin atribución de IA**: no añadas `Co-Authored-By` de agentes ni pies del tipo "Generated with…".
- Cambio incompatible: añade `!` (`feat(api)!: ...`) y un pie `BREAKING CHANGE: ...`.

## 3. Antes de subir

Ejecuta las validaciones de lo que hayas tocado:

```bash
cd backend && ./mvnw verify
cd frontend && npx tsc --noEmit && npx expo lint
```

Comprueba que no hay secretos en el diff y que la documentación (C4, ADR, README) está al día.

## 4. Subir y abrir el PR

Pide confirmación a la persona antes de hacer push o abrir el PR.

```bash
git push -u origin <rama>
gh pr create --base main --title "<tipo>(<ámbito>): <descripción>" --body-file <cuerpo.md>
```

- El cuerpo sigue `.github/pull_request_template.md`: descripción, tipo, requisitos (RFxx), cambios,
  cómo se ha probado, riesgos, checklist y `Closes #N`.
- No apruebes, fusiones ni cierres PRs salvo que una persona del equipo lo pida explícitamente.
