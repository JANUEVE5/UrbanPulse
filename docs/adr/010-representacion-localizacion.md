# ADR-010: Representación de la localización como latitud y longitud numéricas

## Estado

Proposed

## Contexto

RF04 exige guardar las coordenadas de la incidencia y, más adelante, la dirección normalizada y la precisión.
Varios requisitos posteriores dependen de consultas espaciales: mapa (RF08), duplicados por proximidad
(RF16), análisis zonal (RF17), barrio y distrito (RF21) y activo urbano cercano (RF22). Hoy `localizacion` es
un `VARCHAR(200)` de texto libre, que no permite ni validar ni consultar por posición. El scope del sprint
pide solo guardar latitud y longitud.

## Opciones consideradas

1. Mantener la localización como texto libre.
2. Dos columnas `latitud` y `longitud` de tipo `NUMERIC(9,6)` (`BigDecimal` en Java).
3. PostGIS con una columna `geometry(Point, 4326)` e índices espaciales.

## Decisión

Guardar la posición en dos columnas `latitud` y `longitud` de tipo `NUMERIC(9,6)`, validadas en la API
(rango ±90 y ±180), junto con `precision_m` y `direccion` opcionales. Se adoptará PostGIS en un ADR posterior
cuando se implemente el primer requisito que necesite consultas espaciales (RF16, RF17, RF21 o RF22).

## Consecuencias

+ Es la solución más sencilla que cubre RF04 y el mapa (RF08).
+ Precisión de unos 10 cm, suficiente para incidencias urbanas.
+ No requiere extensiones de PostgreSQL ni dependencias nuevas.
- Las búsquedas por proximidad o por polígono no son eficientes hasta que se adopte PostGIS.
- Migrar después a PostGIS implicará una migración de datos (aunque sencilla, de dos columnas a un punto).
