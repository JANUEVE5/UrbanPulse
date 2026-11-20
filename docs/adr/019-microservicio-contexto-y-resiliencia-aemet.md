# ADR-019: Extraer el contexto urbano y meteorológico a un microservicio

## Estado

Proposed

## Contexto

RF22 requiere activos urbanos próximos; RF23 y RF24 requieren contexto externo y RF26 exige que la caída de
un proveedor nunca impida registrar una incidencia. La sincronización de Open Data Málaga residía en el
monolito y compartía su base de datos. No existía un conector meteorológico con AEMET ni una persistencia
independiente para conservar datos previos.

La nueva frontera debe aislar las integraciones y sus fallos, conservar los datos válidos al fallar una
actualización y mantener la asociación auditable de incidencias a los identificadores locales de activos
(ADR-008 y RF22). Se mantienen Java 17, Spring Boot y PostgreSQL, coherentes con el stack del proyecto.

## Opciones consideradas

1. Mantener las integraciones en el monolito y consultar los proveedores desde la API principal.
2. Crear un microservicio independiente en Spring Boot con PostgreSQL propio, caché persistida y una API REST.
3. Crear un servicio independiente en Node o Python con SQLite/Redis.

## Decisión

Utilizar `context-service` con Spring Boot y PostgreSQL independiente para sincronizar Open Data Málaga y
consultar AEMET. El servicio conserva activos, observaciones y predicciones válidos en su base de datos,
aplica un circuit breaker por proveedor y expone contexto normalizado; la API principal mantiene una
proyección local de activos para no cambiar las claves foráneas ni bloquear la creación de incidencias.

## Consecuencias

+ La indisponibilidad de AEMET u Open Data no interrumpe el registro ni la consulta de datos previamente
  almacenados.
+ La persistencia meteorológica conserva fuente, estación, instante de observación e ingesta, unidades y
  calidad; los activos conservan sus identificadores externos.
+ La API principal mantiene la compatibilidad RF22 y la asignación existente a `"UrbanAsset"` mientras el
  microservicio es dueño de la sincronización.
- Se despliega y opera un proceso y una base de datos adicionales; la proyección RF22 se actualiza de forma
  eventual mediante una consulta periódica HTTP.
- El circuit breaker reside en memoria por instancia; tras reiniciar se cierra y puede volver a probar el
  proveedor, mientras que los datos almacenados sobreviven al reinicio.
- AEMET requiere configurar `AEMET_API_KEY`; si no se proporciona o el proveedor cae, se sirve el último dato
  disponible y la respuesta indica degradación, pero no se garantiza que esté actualizado.
