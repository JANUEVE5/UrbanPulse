-- Genera :total incidencias sintéticas en Málaga (experimento 4b). Se ejecuta con cargar-volumen.sh.
-- Borra las incidencias existentes y todo lo que depende de ellas; los usuarios de data.sql se conservan.
-- Distribución: estados y prioridades con pesos realistas, 5 categorías, fechas del último año,
-- creadores entre los 10 usuarios de data.sql (ciudadanos con más peso) y un cambio de estado por cada
-- incidencia que no está "Abierta", para que el detalle tenga historial.
\set ON_ERROR_STOP on
\timing on

BEGIN;
TRUNCATE "Notification", "Attachment", "IncidentComment", "StatusChange", "Incident" RESTART IDENTITY;

INSERT INTO "Incident" (titulo, descripcion, categoria, reporte_central, localizacion, latitud, longitud,
                        estado, prioridad, id_creador, created_at)
SELECT 'Incidencia sintética ' || g,
       'Generada para el experimento de volumen de datos.',
       (ARRAY['Alumbrado','Limpieza','Mobiliario','Tráfico','Zonas verdes'])[1 + floor(random() * 5)::int],
       'Incidencia sintética ' || g || ': generada para el experimento de volumen de datos.',
       'Málaga',
       round((36.68 + random() * 0.08)::numeric, 6),
       round((-4.52 + random() * 0.16)::numeric, 6),
       CASE WHEN r < 0.30 THEN 'Abierta'
            WHEN r < 0.50 THEN 'En revisión'
            WHEN r < 0.75 THEN 'Resuelta'
            WHEN r < 0.90 THEN 'Cerrada'
            WHEN r < 0.95 THEN 'Rechazada'
            ELSE 'Reabierta' END,
       CASE WHEN p < 0.40 THEN 'Baja' WHEN p < 0.80 THEN 'Media' ELSE 'Alta' END,
       (ARRAY[7,8,9,10,7,8,9,10,1,2,3,4,5,6])[1 + floor(random() * 14)::int],
       now() - random() * interval '365 days'
FROM (SELECT g, random() AS r, random() AS p FROM generate_series(1, :total) AS g) s;

INSERT INTO "StatusChange" (actor_id, incident_id, transicion, motivo, instante)
SELECT 2, id, 'Abierta -> ' || estado, NULL, created_at + interval '1 hour'
FROM "Incident"
WHERE estado <> 'Abierta';
COMMIT;

ANALYZE "Incident";
ANALYZE "StatusChange";

SELECT count(*) AS incidencias FROM "Incident";
SELECT estado, count(*) FROM "Incident" GROUP BY estado ORDER BY 2 DESC;
SELECT pg_size_pretty(pg_total_relation_size('"Incident"')) AS tamano_tabla_incident;
