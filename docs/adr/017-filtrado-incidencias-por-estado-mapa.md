# ADR-017: Filtrado multicriterio de incidencias en la API y límite por defecto en el mapa

## Estado

Accepted

## Contexto

`GET /api/incidents` paginaba el listado sin limitar el mapa ([ADR-016](016-paginacion-listado-incidencias.md)),
lo que obligaba al cliente a solicitar todas las páginas consecutivas para posicionar la totalidad de incidencias
históricas en el mapa. Conforme crecen las incidencias resueltas, cerradas o de menor relevancia, transferir y pintar cientos
o miles de marcadores de una sola vez ralentiza la red, incrementa la carga sobre la base de datos y satura
la vista espacial. RF07 exige filtrado por estado, prioridad y categoría, y RF08 visualización en mapa de incidencias relevantes.

## Opciones consideradas

1. Mantener la descarga masiva de todas las incidencias y filtrar en memoria únicamente en el cliente (JavaScript).
2. Limitar el mapa a un tope fijo de incidencias recientes sin distinción de su estado de resolución ni criterios de prioridad.
3. Incorporar parámetros opcionales de filtrado en el backend (`estado`, `prioridad`, `categoria`), paginación por fecha descendente
   y configurar por defecto en el mapa la consulta de las 50 incidencias activas más recientes, con un panel de filtros
   para ajustar cantidad, estado, prioridad y categoría.

## Decisión

Añadir soporte en `GET /api/incidents` para los parámetros de consulta `estado` (admitiendo alias `activas` y `resueltas` o estados
específicos), `prioridad` (`Alta`, `Media`, `Baja`) y `categoria`, apoyado en Spring Data JPA (`Specification`).
En la aplicación cliente, el mapa solicita por defecto las 50 incidencias activas más recientes (`createdAt,desc`) en una sola petición
y dispone de chips de acceso rápido junto con un modal de filtros para personalizar la cantidad (20, 50, 100, Todas), el estado,
la prioridad y la categoría visualizada.

## Consecuencias

+ La carga inicial del mapa se resuelve en una única petición rápida con las incidencias activas recientes, evitando transferencias masivas.
+ Cubre el filtrado multicriterio de RF07 con validación en API y compatibilidad con el control de acceso por roles.
+ El usuario dispone de flexibilidad total para explorar incidencias por volumen, categoría, prioridad o estado.
- Consultar «Todas» sin límite de cantidad requiere solicitar páginas sucesivas según lo establecido en ADR-016.
