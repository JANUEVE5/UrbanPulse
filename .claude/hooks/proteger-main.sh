#!/usr/bin/env bash
# Hook PreToolUse (Bash) de Claude Code: impide hacer commit o push directamente en `main`.
# Recibe por stdin el JSON de la llamada a la herramienta. Exit 2 bloquea la acción y muestra el motivo.

input="$(cat)"

# Extrae el campo "command" y se queda solo con su primera línea: así no se analizan
# cuerpos de heredocs, mensajes de commit ni textos de PR que mencionen "git push ... main".
cmd="$(printf '%s' "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p')"
cmd="${cmd%%\\n*}"

# Solo cuenta "git commit"/"git push" al inicio del comando o tras ; && || |
inicio='(^|[;&|][[:space:]]*)'

es_commit=0; es_push_main=0
printf '%s' "$cmd" | grep -Eq "${inicio}git commit" && es_commit=1
printf '%s' "$cmd" | grep -Eq "${inicio}git push([[:space:]]+-[^[:space:]]+)*[[:space:]]+[^[:space:]-][^[:space:]]*[[:space:]]+(HEAD:)?main([[:space:]]|;|&|\||$)" && es_push_main=1

if [ "$es_commit" = 0 ] && ! printf '%s' "$cmd" | grep -Eq "${inicio}git push"; then
  exit 0
fi

branch="$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null)"

if [ "$branch" = "main" ] || [ "$es_push_main" = 1 ]; then
  echo "Bloqueado: no se hace commit ni push en 'main'. Crea una rama (feature/, fix/, docs/...) y abre un Pull Request. Ver CONTRIBUTING.md." >&2
  exit 2
fi

exit 0
