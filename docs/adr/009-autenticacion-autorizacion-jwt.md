# ADR-009: Autenticación con Spring Security y JWT, y autorización por roles

## Estado

Proposed

## Contexto

RF01 exige identificar a los usuarios y autenticar al personal, y RF02 aplicar permisos diferenciados para
ciudadanía, operadores, técnicos, administración y analistas. Hoy la API es pública, `GET /api/users` expone
todos los usuarios y las contraseñas se guardan en claro en la tabla `"User"`. El backend debe seguir sin
estado para poder escalar con varias instancias (Twelve-Factor, factor VI).

## Opciones consideradas

1. Sesiones HTTP con estado en el servidor.
2. Spring Security con tokens JWT firmados emitidos por la propia API.
3. Proveedor de identidad externo (Keycloak, AWS Cognito o Auth0) con OAuth2/OIDC.

## Decisión

Utilizar Spring Security con autenticación mediante JWT firmados por la API. Los roles serán `CITIZEN`,
`OPERATOR`, `TECHNICIAN`, `ADMIN` y `ANALYST`, y se comprobarán por endpoint. Las contraseñas se guardarán
con BCrypt. La clave de firma se proporcionará por la variable de entorno `JWT_SECRET`.

## Consecuencias

+ API sin estado: cualquier instancia valida el token sin almacenamiento compartido.
+ Permisos declarativos por rol, alineados con RF02.
+ Sin infraestructura adicional; se puede migrar a un proveedor OIDC más adelante sin cambiar los roles.
- La revocación de tokens antes de que expiren no es trivial: hay que usar tokens de vida corta y refresco.
- El equipo asume la responsabilidad de gestionar credenciales (hash, recuperación de contraseña).
- Requiere migrar la tabla `"User"`: añadir el rol y aplicar hash a las contraseñas existentes.
