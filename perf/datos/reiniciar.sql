-- Borra las incidencias creadas por las pruebas k6 (localizacion = 'Málaga (k6)') y todo lo que depende de
-- ellas, para que cada repetición parta de los mismos datos que data.sql. run.sh lo ejecuta antes de cada
-- repetición cuando RESET_DB=si. Las incidencias de data.sql y las del volumen sintético no se tocan.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE k6_ids ON COMMIT DROP AS
  SELECT id FROM "Incident" WHERE localizacion = 'Málaga (k6)';
DELETE FROM "IncidentComment" WHERE incident_id IN (SELECT id FROM k6_ids);
DELETE FROM "StatusChange" WHERE incident_id IN (SELECT id FROM k6_ids);
DELETE FROM "Attachment" WHERE incident_id IN (SELECT id FROM k6_ids);
DELETE FROM "Notification" WHERE incident_id IN (SELECT id FROM k6_ids);
DELETE FROM "Incident" WHERE id IN (SELECT id FROM k6_ids);
COMMIT;
-- Tras borrar muchas filas, recupera el espacio y actualiza las estadísticas del planificador
VACUUM (ANALYZE) "Incident", "StatusChange", "IncidentComment";
