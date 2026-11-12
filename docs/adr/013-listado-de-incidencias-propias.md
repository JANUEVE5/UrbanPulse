# ADR-013: Limitar el mapa y el listado a las incidencias del usuario autenticado

## Estado

Superseded by ADR-014

## Contexto

RF06 requiere que cada usuario pueda consultar y seguir sus propias incidencias. El mapa y el listado
consumen `GET /api/incidents`; permitir ese listado sin autenticación expone reportes de otros usuarios
y no permite aplicar el filtro de propiedad del lado del servidor. La API ya usa JWT y la incidencia
almacena su creador en `id_creador` (ADR-009).

## Opciones consideradas

1. Mantener el listado público completo y filtrar en el cliente.
2. Exigir JWT en el listado y filtrar por el ID del usuario autenticado en el backend.

## Decisión

Exigir autenticación para el listado y derivar el ID del creador exclusivamente del `sub` del JWT.
El mapa y la vista de lista consumen ese listado filtrado; el detalle por ID conserva su acceso público.

## Consecuencias

+ Un usuario solo recibe sus propias incidencias en el mapa y en el listado.
+ El servidor, no el cliente, aplica el filtro de propiedad.
- El mapa y el listado requieren iniciar sesión.
