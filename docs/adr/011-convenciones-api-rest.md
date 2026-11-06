# ADR-011: Convenciones de la API REST: DTOs, paginación y formato de errores

## Estado

Proposed

## Contexto

La API es el contrato entre el backend y la app. RF07 exige buscar y filtrar incidencias, y el volumen
crecerá, por lo que devolver listados completos no escala. Hoy cada endpoint decide su formato, los listados
no están paginados, algunos controllers devuelven entidades JPA directamente (`GET /api/users`) y los errores
no tienen un formato común. Además, la configuración de CORS está duplicada (`WebConfig` y `@CrossOrigin`) y
abierta a cualquier origen.

## Opciones consideradas

1. Mantener endpoints ad hoc.
2. REST con convenciones comunes: DTOs, paginación, errores RFC 7807 y contrato OpenAPI.
3. GraphQL.

## Decisión

Adoptar estas convenciones REST:

- Recursos bajo `/api`, en plural y en inglés (`/api/incidents`).
- Siempre DTOs de entrada y de salida, nunca entidades JPA.
- Listados paginados con `?page=&size=&sort=` y filtros por parámetros de consulta.
- Errores con el formato *Problem Details* (RFC 7807), con `ProblemDetail` de Spring y un
  `@RestControllerAdvice` común.
- Contrato documentado en OpenAPI (`springdoc-openapi`) y publicado en `docs/api/openapi.yml`.
- CORS configurado en un único sitio, con los orígenes permitidos por variable de entorno.

## Consecuencias

+ Contrato predecible para el frontend y documentación generada automáticamente.
+ Los listados escalan y RF07 se apoya en la paginación.
+ Los errores se pueden tratar de forma uniforme en la app.
- Exige adaptar los endpoints y tests existentes.
- Añade la dependencia `springdoc-openapi`.
