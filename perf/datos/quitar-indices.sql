DROP INDEX IF EXISTS perf_idx_incident_created;
DROP INDEX IF EXISTS perf_idx_incident_estado_created;
DROP INDEX IF EXISTS perf_idx_incident_creador_created;
DROP INDEX IF EXISTS perf_idx_incident_lower_prioridad;
DROP INDEX IF EXISTS perf_idx_incident_lower_categoria;
DROP INDEX IF EXISTS perf_idx_status_change_incident;
DROP INDEX IF EXISTS perf_idx_comment_incident;
ANALYZE "Incident";
