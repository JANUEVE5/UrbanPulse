#!/usr/bin/env bash
# Hook PreToolUse (Bash) de Claude Code: impide hacer commit o push directamente en `main`.
# Recibe por stdin el JSON de la llamada a la herramienta. Exit 2 bloquea la acción y muestra el motivo.

input="$(cat)"
cmd="$(printf '%s' "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p')"

case "$cmd" in
  *"git commit"*|*"git push"*) ;;
  *) exit 0 ;;
esac

branch="$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null)"

if [ "$branch" = "main" ] || printf '%s' "$cmd" | grep -Eq 'git push.*[[:space:]](origin[[:space:]]+)?(HEAD:)?main([[:space:]]|$)'; then
  echo "Bloqueado: no se hace commit ni push en 'main'. Crea una rama (feature/, fix/, docs/...) y abre un Pull Request. Ver CONTRIBUTING.md." >&2
  exit 2
fi

exit 0
