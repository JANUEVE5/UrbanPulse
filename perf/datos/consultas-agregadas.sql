-- Estadísticas agregadas (RF15 aún no tiene endpoint): se miden directamente en PostgreSQL con
-- EXPLAIN ANALYZE para cada volumen de datos, con y sin índices.
--   ./perf/datos/psql.sh < perf/datos/consultas-agregadas.sql > perf/resultados/agregadas-100k.txt
\timing on

-- Incidencias por categoría y estado
EXPLAIN (ANALYZE, BUFFERS)
SELECT categoria, estado, count(*) FROM "Incident" GROUP BY categoria, estado;

-- Incidencias activas por prioridad en los últimos 30 días
EXPLAIN (ANALYZE, BUFFERS)
SELECT prioridad, count(*) FROM "Incident"
WHERE estado IN ('Abierta', 'En revisión', 'Reabierta') AND created_at > now() - interval '30 days'
GROUP BY prioridad;

-- Serie temporal: incidencias creadas por semana
EXPLAIN (ANALYZE, BUFFERS)
SELECT date_trunc('week', created_at) AS semana, count(*) FROM "Incident" GROUP BY 1 ORDER BY 1;

-- Tiempo medio hasta el primer cambio de estado (proxy del tiempo de respuesta)
EXPLAIN (ANALYZE, BUFFERS)
SELECT i.categoria, avg(sc.instante - i.created_at)
FROM "Incident" i JOIN "StatusChange" sc ON sc.incident_id = i.id
GROUP BY i.categoria;

-- Lo que hace cada listado paginado de la API además del SELECT: el COUNT(*) de totalElements
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM "Incident" WHERE estado IN ('Abierta', 'En revisión', 'Reabierta');
