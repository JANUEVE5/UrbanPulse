-- ============================================================================
-- SCRIPT DE DATOS DE PRUEBA (MOCK DATA) - URBANPULSE
-- ============================================================================

-- 1. Usuarios del sistema (10 usuarios)
INSERT INTO "User" (nombre, correo, contraseña) VALUES
    ('Carlos Morales', 'carlos.morales@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Lucía Navarro', 'lucia.navarro@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Alejandro Domínguez', 'alejandro.dominguez@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Marta Castillo', 'marta.castillo@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Javier Ruiz', 'javier.ruiz@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Elena Romero', 'elena.romero@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('David Serrano', 'david.serrano@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Carmen Gil', 'carmen.gil@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Pablo Vázquez', 'pablo.vazquez@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G'),
    ('Sofía Delgado', 'sofia.delgado@urbanpulse.es', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeiBCEe8wG99e.hQ1y35PjJmsQ94aN3G');

-- 2. Activos urbanos (15 activos)
INSERT INTO "UrbanAsset" (tipo) VALUES
    ('Farola'),
    ('Contenedor de RSU'),
    ('Contenedor de Reciclaje'),
    ('Marquesina de Autobús'),
    ('Semáforo'),
    ('Banco Público'),
    ('Papelera Urbana'),
    ('Fuente Pública'),
    ('Paso de Peatones'),
    ('Bolardo'),
    ('Alcorque de Árbol'),
    ('Juegos Infantiles'),
    ('Estación de Bici Pública'),
    ('Barandilla Peatonal'),
    ('Panel Informativo Digital');

-- 3. Incidencias urbanas (20 incidencias localizadas en Málaga)
INSERT INTO "Incident" (reporte_central, urban_asset_id, localizacion, estado, prioridad, id_creador, created_at) VALUES
    ('Farola rota con cableado expuesto tras impacto de vehículo.', 1, 'Calle Marqués de Larios, 12, Centro', 'En revisión', 'Alta', 1, '2026-10-01 08:30:00'),
    ('Contenedor de residuos volcado obstaculizando el paso en la acera.', 2, 'Calle Tomás Echeverría, 18, Huelin', 'Resuelta', 'Media', 2, '2026-10-02 09:15:00'),
    ('Semáforo intermitente con fallo en la fase para peatones.', 5, 'Bulevar Louis Pasteur, 24, Teatinos', 'Abierta', 'Alta', 3, '2026-10-03 10:00:00'),
    ('Pintadas vandálicas sobre los cristales de la parada de autobús.', 4, 'Paseo Marítimo Pablo Ruiz Picasso, 45, La Malagueta', 'Abierta', 'Baja', 4, '2026-10-04 11:20:00'),
    ('Banco de madera con tablón fracturado y riesgo de astillas.', 6, 'Plaza de la Merced, Centro Histórico', 'En revisión', 'Media', 5, '2026-10-05 12:45:00'),
    ('Bache profundo en el asfalto justo antes del paso peatonal.', 9, 'Calle Hilera, 8, Cruz de Humilladero', 'Resuelta', 'Alta', 6, '2026-10-06 14:10:00'),
    ('Papelera metálica desprendida de su fijación al suelo.', 7, 'Calle Especería, 5, Centro', 'Abierta', 'Baja', 7, '2026-10-07 15:30:00'),
    ('Pérdida constante de agua por rotura del grifo de la fuente.', 8, 'Paseo del Parque, frente a Ayuntamiento', 'En revisión', 'Media', 8, '2026-10-08 16:05:00'),
    ('Bolardo derribado ocupando la calzada del carril bici.', 10, 'Avenida Plutarco, 32, Teatinos', 'Resuelta', 'Media', 9, '2026-10-09 17:40:00'),
    ('Raíces sobresalientes del alcorque levantando el pavimento.', 11, 'Calle Carretería, 64, Centro', 'Abierta', 'Baja', 10, '2026-10-10 18:25:00'),
    ('Columpio infantil con cadena rota en zona de juegos infantiles.', 12, 'Parque del Oeste, Calle Realenga de San Luis, Carretera de Cádiz', 'Abierta', 'Alta', 1, '2026-10-11 09:00:00'),
    ('Anclaje de bicicleta averiado que no permite desacoplar unidades.', 13, 'Paseo Marítimo Antonio Banderas, frente a Diputación, Huelin', 'En revisión', 'Media', 2, '2026-10-12 10:15:00'),
    ('Barandilla marítima desprendida y oxidada con peligro de caída.', 14, 'Paseo Marítimo Ciudad de Melilla, La Malagueta', 'Abierta', 'Alta', 3, '2026-10-13 11:50:00'),
    ('Pantalla informativa apagada y cristal exterior agrietado.', 15, 'Alameda Principal, 14, Centro', 'Resuelta', 'Baja', 4, '2026-10-14 13:10:00'),
    ('Contenedor de vidrio desbordado y residuos amontonados fuera.', 3, 'Avenida Cervantes, frente a Jardines de Puerta Oscura', 'En revisión', 'Media', 5, '2026-10-15 14:35:00'),
    ('Luminaria de farola fundida dejando la calle a oscuras.', 1, 'Calle Mesonero Romanos, 5, Teatinos', 'Abierta', 'Media', 6, '2026-10-16 19:20:00'),
    ('Pintura vial del paso de cebra desgastada y muy deslizante.', 9, 'Calle Salitre, 28, Perchel Sur', 'Resuelta', 'Media', 7, '2026-10-17 08:45:00'),
    ('Semáforo peatonal con la bombilla verde averiada.', 5, 'Calle Cuarteles, 15, Perchel Sur', 'En revisión', 'Alta', 8, '2026-10-18 11:30:00'),
    ('Hundimiento de calzada junto a tapa de registro con ruidos al paso.', 9, 'Calle Juan Sebastián Elcano, 82, El Palo', 'Abierta', 'Alta', 9, '2026-10-19 12:15:00'),
    ('Restos de poda acumulados bloqueando el acceso a la marquesina.', 4, 'Avenida Carlos Haya, 75, Cruz de Humilladero', 'Resuelta', 'Baja', 10, '2026-10-20 16:00:00');

-- 4. Archivos adjuntos (Attachments)
INSERT INTO "Attachment" (archivo_adjunto, incident_id) VALUES
    ('incidencias/1/farola_danada.jpg', 1),
    ('incidencias/2/contenedor_huelin.jpg', 2),
    ('incidencias/4/graffiti_parada.jpg', 4),
    ('incidencias/5/banco_merced.jpg', 5),
    ('incidencias/6/bache_cruz_humilladero.jpg', 6),
    ('incidencias/8/fuente_fuga_parque.jpg', 8),
    ('incidencias/9/bolardo_teatinos.jpg', 9),
    ('incidencias/11/parque_oeste_columpio.jpg', 11),
    ('incidencias/13/barandilla_malagueta.jpg', 13),
    ('incidencias/15/vidrio_desbordado.jpg', 15);

-- 5. Historial de cambios de estado (StatusChange)
INSERT INTO "StatusChange" (actor_id, incident_id, transicion, motivo, instante) VALUES
    (2, 1, 'Abierta → En revisión', 'Técnico de guardia asignado para aislar el tendido eléctrico.', '2026-10-01 09:10:00'),
    (3, 2, 'Abierta → En revisión', 'Aviso transmitido al retén de limpieza urbana.', '2026-10-02 09:40:00'),
    (3, 2, 'En revisión → Resuelta', 'Contenedor enderezado y despejada la vía pública.', '2026-10-02 11:30:00'),
    (4, 5, 'Abierta → En revisión', 'Personal de carpintería municipal desplazado a Plaza de la Merced.', '2026-10-05 14:00:00'),
    (5, 6, 'Abierta → En revisión', 'Inspección de vías y obras confirmada.', '2026-10-06 15:00:00'),
    (5, 6, 'En revisión → Resuelta', 'Bache rellenado con aglomerado asfáltico en caliente.', '2026-10-07 12:00:00'),
    (6, 8, 'Abierta → En revisión', 'Notificación a EMASA para corte temporal del suministro.', '2026-10-08 17:30:00'),
    (7, 9, 'Abierta → En revisión', 'Brigada de mantenimiento retira el obstáculo del carril bici.', '2026-10-09 18:20:00'),
    (7, 9, 'En revisión → Resuelta', 'Bolardo anclado de nuevo con mortero rápido.', '2026-10-10 10:45:00'),
    (8, 12, 'Abierta → En revisión', 'Equipo técnico reinicia la estación de préstamo de bicicletas.', '2026-10-12 11:00:00'),
    (9, 14, 'Abierta → En revisión', 'Pieza de repuesto encargada al servicio técnico.', '2026-10-14 14:00:00'),
    (9, 14, 'En revisión → Resuelta', 'Cristal protector reemplazado y display funcionando.', '2026-10-15 16:30:00'),
    (10, 15, 'Abierta → En revisión', 'Ruta especial de recogida programada para esta tarde.', '2026-10-15 16:00:00'),
    (1, 17, 'Abierta → En revisión', 'Solicitud de repintado tramitada al departamento de tráfico.', '2026-10-17 09:30:00'),
    (1, 17, 'En revisión → Resuelta', 'Paso de peatones repintado con pintura antideslizante.', '2026-10-17 14:15:00'),
    (2, 18, 'Abierta → En revisión', 'Empresa de mantenimiento semafórico informada.', '2026-10-18 12:45:00'),
    (4, 20, 'Abierta → En revisión', 'Servicio de jardinería coordinado para retirar podas.', '2026-10-20 16:30:00'),
    (4, 20, 'En revisión → Resuelta', 'Restos retirados y parada completamente accesible.', '2026-10-21 09:20:00');

-- 6. Notificaciones vinculadas a incidencias (Notification)
INSERT INTO "Notification" (incident_id, contenido, estado) VALUES
    (1, 'La incidencia #1 ha sido asignada al servicio de alumbrado público.', 'Enviada'),
    (2, 'La incidencia #2 en Calle Tomás Echeverría ha sido marcada como Resuelta.', 'Leída'),
    (3, 'Incidencia #3 de prioridad Alta registrada en Teatinos.', 'Pendiente'),
    (5, 'La incidencia #5 está siendo atendida por mantenimiento de mobiliario.', 'Enviada'),
    (6, 'Bache en Calle Hilera (#6) reparado satisfactoriamente.', 'Leída'),
    (8, 'Incidencia #8 remitida a la empresa de aguas (EMASA).', 'Enviada'),
    (9, 'Incidencia #9 resuelta: carril bici de Av. Plutarco despejado.', 'Leída'),
    (11, 'Incidencia #11 priorizada por encontrarse en área infantil.', 'Pendiente'),
    (13, 'Incidencia #13 registrada con urgencia por riesgo de caída en paseo marítimo.', 'Pendiente'),
    (14, 'Panel digital de Alameda Principal (#14) reparado y en servicio.', 'Leída'),
    (17, 'Señalización vial completada en Calle Salitre (#17).', 'Leída'),
    (18, 'Técnicos notificados para cambio de luminaria semafórica en Calle Cuarteles.', 'Enviada');

-- 7. Contexto urbano (UrbanContext)
INSERT INTO "UrbanContext" (contexto_ambiental, contexto_social) VALUES
    ('Soleado, 22°C, humedad relativa 58%, viento suave de levante (12 km/h).', 'Hora punta matinal con tráfico denso en accesos y alta afluencia peatonal en eje Centro-Larios.'),
    ('Despejado, 25°C, buena calidad del aire, índice UV moderado.', 'Gran concurrencia en terrazas de hostelería y zona comercial de Huelin.'),
    ('Cielos nubosos con llovizna ocasional, 18°C, pavimento deslizante.', 'Tráfico fluido en viales universitarios de Teatinos y bulevares principales.'),
    ('Brisa marina, 21°C, nivel de ruido ambiente bajo en zona costera.', 'Afluencia deportiva notable a lo largo del Paseo Marítimo Pablo Ruiz Picasso.'),
    ('Noche despejada, 16°C, visibilidad excelente y baja contaminación lumínica.', 'Disminución del tráfico rodado en zonas residenciales de Carretera de Cádiz.');
