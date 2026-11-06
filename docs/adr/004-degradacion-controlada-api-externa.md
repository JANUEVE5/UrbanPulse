# ADR-004: Estrategia de degradación controlada ante la API del Ayuntamiento

## Estado

Accepted

## Contexto

UrbanPulse depende de una API externa del Ayuntamiento para obtener información del contexto urbano
(`UrbanContext`), del activo afectado y de las variables del entorno. Sin embargo, la interrupción de estos
servicios no debe impedir que un ciudadano reporte un problema crítico en la vía pública (RF26).

## Opciones consideradas

1. Llamada síncrona bloqueante: el registro falla si falla la API externa.
2. Degradación controlada asíncrona.

## Decisión

Aplicar un patrón de degradación controlada. La plataforma permitirá siempre la creación inmediata de la
incidencia (`REPORTED`). Si la API externa no está disponible, el sistema omitirá el enriquecimiento de datos
o lo encolará para reintentarlo en segundo plano.

## Consecuencias

+ Alta disponibilidad para el ciudadano: el servicio de reporte no se bloquea.
+ Resiliencia frente a fallos de red o caídas de los sistemas del Ayuntamiento.
- Las incidencias creadas durante una caída externa pueden carecer temporalmente de contexto (barrio, activo
  urbano cercano), por lo que habrá que completarlas después.
- Aumenta la complejidad del flujo de trabajo, al introducir procesos asíncronos de reintento.
