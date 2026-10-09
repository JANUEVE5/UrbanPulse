DROP TABLE IF EXISTS "UrbanContext" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "StatusChange" CASCADE;
DROP TABLE IF EXISTS "Attachment" CASCADE;
DROP TABLE IF EXISTS "Incident" CASCADE;
DROP TABLE IF EXISTS "UrbanAsset" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE TABLE "User" (
                        id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                        nombre          VARCHAR(100) NOT NULL,
                        correo          VARCHAR(150) NOT NULL UNIQUE,
                        contraseña      VARCHAR(255) NOT NULL
);

CREATE TABLE "UrbanAsset" (
                              id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                              tipo            VARCHAR(50) NOT NULL
);

CREATE TABLE "Incident" (
                            id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                            reporte_central VARCHAR(400) NOT NULL,
                            urban_asset_id  INTEGER REFERENCES "UrbanAsset"(id),
                            localizacion    VARCHAR(200),
                            estado          VARCHAR(30) NOT NULL,
                            prioridad       VARCHAR(20) NOT NULL,
                            id_creador      INTEGER NOT NULL REFERENCES "User"(id),
                            created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Attachment" (
                              id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                              archivo_adjunto     VARCHAR(255) NOT NULL,
                              incident_id         INTEGER NOT NULL REFERENCES "Incident"(id)
);

CREATE TABLE "StatusChange" (
                                id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                actor_id        INTEGER NOT NULL REFERENCES "User"(id),
                                incident_id     INTEGER NOT NULL REFERENCES "Incident"(id),
                                transicion      VARCHAR(100) NOT NULL,
                                motivo          VARCHAR(400),
                                instante        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
                                id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                incident_id     INTEGER NOT NULL REFERENCES "Incident"(id),
                                contenido       VARCHAR(400) NOT NULL,
                                estado          VARCHAR(30) NOT NULL
);

CREATE TABLE "UrbanContext" (
                                id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                contexto_ambiental  VARCHAR(400),
                                contexto_social     VARCHAR(400)
);