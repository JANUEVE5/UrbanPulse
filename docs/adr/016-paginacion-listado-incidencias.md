# ADR-016: Paginar el listado de incidencias sin limitar el mapa

## Estado

Accepted

## Contexto

`GET /api/incidents` devuelve las incidencias visibles para el rol autenticado y alimenta tanto la lista
como el mapa. Devolver el conjunto completo en cada petición hace crecer el trabajo de base de datos y la
transferencia a medida que se registran incidencias. El ADR-011 propone paginar los listados, pero sigue
Proposed y no se cambia su estado ni se adoptan aquí sus otras decisiones.

## Opciones consideradas

1. Mantener el listado completo y procesarlo en el cliente.
2. Paginar el endpoint y mostrar solo la primera página en el mapa.
3. Paginar el endpoint; la lista solicita una página y el mapa recorre las páginas para conservar todos sus marcadores.

## Decisión

Aplicar paginación por número de página (`page`, desde 0), tamaño (`size`, 20 por defecto y 100 como máximo)
y orden (`sort`, `createdAt,desc` por defecto), con `id` descendente como desempate estable. La lista solicita
una página por petición y el mapa consume páginas sucesivas hasta la última, conservando el filtro de
visibilidad por rol definido en ADR-014.

## Consecuencias

+ La lista limita cada respuesta y mantiene orden determinista entre páginas.
+ La respuesta incluye contenido y metadatos de página para que la interfaz controle la navegación.
- El mapa necesita varias peticiones cuando hay más incidencias que el tamaño máximo de página.
