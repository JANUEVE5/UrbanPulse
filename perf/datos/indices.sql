-- Índices candidatos para las consultas del experimento 4b (sugerencia de mejora del enunciado).
-- Se aplican con indices.sh crear y se quitan con indices.sh quitar. NO forman parte de schema.sql:
-- si los resultados demuestran que mejoran la capacidad, se proponen en un ADR y se añaden al esquema.

-- Listado general ordenado por fecha (ORDER BY created_at DESC, id DESC + paginación)
CREATE INDEX IF NOT EXISTS perf_idx_incident_created ON "Incident" (created_at DESC, id DESC);
-- Filtro por estado (mapa: activas) con la misma ordenación
CREATE INDEX IF NOT EXISTS perf_idx_incident_estado_created ON "Incident" (estado, created_at DESC, id DESC);
-- Listado de un ciudadano (findByCreadorId) con la misma ordenación
CREATE INDEX IF NOT EXISTS perf_idx_incident_creador_created ON "Incident" (id_creador, created_at DESC, id DESC);
-- Filtros de prioridad y categoría: la Specification compara con lower(...), así que el índice es funcional
CREATE INDEX IF NOT EXISTS perf_idx_incident_lower_prioridad ON "Incident" (lower(prioridad));
CREATE INDEX IF NOT EXISTS perf_idx_incident_lower_categoria ON "Incident" (lower(categoria));
-- Detalle: historial y comentarios se buscan por incident_id (claves ajenas sin índice)
CREATE INDEX IF NOT EXISTS perf_idx_status_change_incident ON "StatusChange" (incident_id, instante);
CREATE INDEX IF NOT EXISTS perf_idx_comment_incident ON "IncidentComment" (incident_id, created_at);

ANALYZE "Incident";
ANALYZE "StatusChange";
ANALYZE "IncidentComment";
