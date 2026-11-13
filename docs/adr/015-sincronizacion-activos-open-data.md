# ADR-015: Sincronización programada de activos urbanos desde Open Data Málaga

## Estado

Proposed

## Contexto

RF22 pide asociar una incidencia a un activo urbano próximo (una parada de autobús, un contenedor, un
semáforo…), proponiendo candidatos con su distancia y un nivel de confianza, y que el operador pueda
confirmar la asociación. Hasta ahora `"UrbanAsset"` solo tenía un `tipo` sin ubicación, y `data.sql`
asignaba activos inventados a todas las incidencias de prueba: el detalle de cualquier incidencia mostraba un
activo asociado aunque no tuviera relación con ella.

El portal de datos abiertos del Ayuntamiento (https://datosabiertos.malaga.eu) publica la ubicación de
muchos elementos de la vía pública. En noviembre de 2026 se revisó el catálogo y se eligieron 22 fuentes
(paradas de la EMT, paradas de taxi, aparcamientos de bicicletas, motos y movilidad reducida, cargadores
eléctricos, semáforos acústicos, cámaras, paneles, foto-rojo, desfibriladores, hidrantes, fuentes de agua,
contenedores de residuos, envases, papel, vidrio, ropa, aceite y pilas, zonas de musculación y parques
caninos). En total son unos 8.000 activos. Casi todas las fuentes se publican como GeoJSON con puntos en
EPSG:4326, y la EMT, como una lista de líneas con sus paradas.

Las fuentes no son fiables al 100 %. Durante la revisión, la de fuentes de agua estaba vacía y las de
contenedores de residuos, envases y papel devolvían un error del servidor. Según ADR-004 y RF26, eso no
puede impedir registrar una incidencia.

## Opciones consideradas

1. **Copiar los ficheros en el repositorio** (CSV o GeoJSON) y cargarlos al arrancar. Es sencillo, pero los
   datos se quedan desactualizados, el repositorio crece y no es una integración real con la fuente (RF23).
2. **Consultar el portal en cada petición** de activos cercanos. Los datos siempre estarían al día, pero cada
   búsqueda depende de la disponibilidad y la latencia del portal. Además, los ficheros no permiten
   filtrar por zona, así que habría que descargarlos enteros cada vez.
3. **Sincronización programada**. La API descarga las fuentes en segundo plano, al arrancar y una vez al
   día, y las guarda en `"UrbanAsset"`. Las búsquedas se hacen contra la base de datos propia.

## Decisión

Sincronizar los activos urbanos con Open Data Málaga de forma programada (opción 3):

- El catálogo de fuentes está en el código (`OpenDataCatalog`). Añadir otra fuente GeoJSON de puntos es
  añadir una línea.
- Cada activo se identifica por `(fuente, id_externo)` y se guarda con un *upsert* (`INSERT … ON CONFLICT`
  de PostgreSQL). Repetir la sincronización actualiza los datos sin duplicarlos ni cambiar los `id` a los
  que apuntan las incidencias.
- Cada fuente se guarda en su propia transacción. Si una fuente falla, viene vacía o responde con un error,
  se registra en el log, se conservan los datos anteriores y se sigue con las demás.
- La sincronización se lanza en un hilo aparte al arrancar (no retrasa el arranque) y después según
  `OPENDATA_SYNC_CRON`. Se configura con las variables `OPENDATA_BASE_URL`, `OPENDATA_SYNC_ENABLED` y
  `OPENDATA_SYNC_CRON`.
- La API ofrece `GET /api/urban-assets/nearby`. Esta búsqueda filtra primero por un recuadro de latitud y
  longitud (con índice) y después calcula la distancia real (fórmula del semiverseno, o haversine). Devuelve
  hasta 10 candidatos a menos de 50 m (200 m como máximo), cada uno con su distancia y su confianza: «Alta»
  hasta 15 m, «Media» hasta 40 m y «Baja» a partir de ahí.
- La asociación es siempre una elección explícita, nunca automática:
  - la persona que registra la incidencia puede elegir un candidato o ninguno;
  - el operador o la administración pueden confirmarlo, cambiarlo o quitarlo
    (`PATCH /api/incidents/{id}/urban-asset`).

  La API rechaza un activo que no existe o que está a más de 200 m de la incidencia.

## Consecuencias

+ Las búsquedas de activos cercanos son rápidas y no dependen de que el portal esté disponible.
+ Una fuente caída no impide registrar incidencias ni sincronizar las demás (ADR-004, RF26).
+ Los datos se actualizan solos cada día, sin ficheros copiados en el repositorio.
+ Añadir una fuente nueva en el formato habitual del portal no requiere código nuevo.
- Los activos que desaparecen de la fuente no se borran: pueden estar asociados a incidencias. Quedan en la
  base de datos hasta que se defina cómo retirarlos.
- Mientras la base de datos se recree en cada arranque (ADR-006), los activos no estarán disponibles
  durante los primeros segundos tras arrancar, hasta que termine la primera sincronización.
- Si hay varias instancias de la API, cada una sincroniza por su cuenta. El *upsert* evita duplicados, pero
  se repite el trabajo.
- La búsqueda por proximidad se hace en Java sobre un recuadro. Si el volumen crece mucho, habrá que valorar
  PostGIS en un ADR nuevo (ADR-010).
- Las URL de las fuentes pueden cambiar sin aviso; el log de cada sincronización lo pone de manifiesto.
