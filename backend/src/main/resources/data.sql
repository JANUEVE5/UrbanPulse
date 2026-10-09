-- Datos de ejemplo
INSERT INTO "User" (nombre, correo, contraseña) VALUES
                                                    ('Ana García', 'ana@example.com', 'hash_de_ejemplo_1'),
                                                    ('Luis Pérez', 'luis@example.com', 'hash_de_ejemplo_2');

INSERT INTO "UrbanAsset" (tipo) VALUES
    ('Semáforo');

INSERT INTO "Incident" (
    reporte_central, urban_asset_id, localizacion,
    estado, prioridad, id_creador
) VALUES (
             'El semáforo no funciona.',
             1,
             'Plaza Mayor',
             'Abierta',
             'Alta',
             1
         );

INSERT INTO "Attachment" (archivo_adjunto, incident_id) VALUES
    ('incidencias/1/foto.jpg', 1);

INSERT INTO "StatusChange" (
    actor_id, incident_id, transicion, motivo
) VALUES (
             2, 1, 'Abierta → En revisión', 'Incidencia asignada para revisión'
         );

INSERT INTO "Notification" (incident_id, contenido, estado) VALUES
    (1, 'La incidencia ha sido registrada.', 'Pendiente');

INSERT INTO "UrbanContext" (contexto_ambiental, contexto_social) VALUES
    ('Día despejado', 'Tráfico moderado');