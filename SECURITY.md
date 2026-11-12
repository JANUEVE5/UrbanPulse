# Política de seguridad

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad, **no abras un issue público**. Usa
[GitHub → Security → Report a vulnerability](https://github.com/JANUEVE5/UrbanPulse/security/advisories/new)
(aviso privado) o contacta directamente con las personas que mantienen el repositorio.

Incluye:

- Descripción del problema.
- Pasos para reproducirlo.
- Impacto potencial.
- Versión o commit afectado.

## Normas para el equipo

- Nunca se versionan contraseñas, tokens, claves ni ficheros `.env`. Solo `.env.example` con valores de ejemplo.
- Los secretos de CI se guardan en *GitHub Secrets*.
- Si un secreto llega a subirse, **se rota de inmediato**. Borrarlo del historial no basta.
- Las dependencias se mantienen actualizadas. Activa Dependabot en *Settings → Code security*.
