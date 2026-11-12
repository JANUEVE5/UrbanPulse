# ADR-008: Ciclo de vida de la incidencia como máquina de estados con historial inmutable

## Estado

Accepted

## Contexto

RF12 exige que los cambios de estado respeten las transiciones permitidas y queden auditados. La aplicación
usa las etiquetas de estado en español y crea cada incidencia como `Abierta`. Los cambios deben impedir saltos
de estado y conservar quién hizo cada transición, cuándo y por qué.

## Opciones consideradas

1. Mantener el estado como texto libre y validar en cada endpoint.
2. Enum de estados con una tabla de transiciones permitidas en el servicio de dominio.
3. Librería de máquinas de estados (Spring Statemachine).

## Decisión

Centralizar la máquina de estados en `IncidentStatus` y validar las transiciones en `IncidentServiceImpl`.
El flujo admite `Abierta`, `En revisión`, `Resuelta`, `Cerrada`, `Rechazada` y `Reabierta`. Desde `Abierta` se
puede pasar a `En revisión` o rechazar; desde `En revisión` se puede resolver o rechazar; `Resuelta` se puede
cerrar o reabrir; `Cerrada` se puede reabrir y `Reabierta` vuelve a `En revisión`. `Rechazada` es terminal.
Rechazo y reapertura requieren un motivo no vacío. El endpoint de cambio de estado exige `OPERATOR`,
`TECHNICIAN` o `ADMIN`. Cada transición válida actualiza la incidencia e inserta, en la misma transacción, un
`StatusChange` con el usuario autenticado, la transición, el motivo y la fecha. El detalle devuelve el
historial en orden cronológico.

## Consecuencias

+ Las transiciones inválidas se rechazan en un único punto y se pueden probar de forma exhaustiva.
+ Los saltos inválidos se rechazan con `409 Conflict`; los estados desconocidos, con `400 Bad Request`.
+ Rechazos y reaperturas tienen motivo obligatorio para conservar la justificación de la decisión.
+ El control de rol se aplica en el backend y no depende de ocultar controles en la interfaz.
+ El historial de transiciones no se sobrescribe y se conserva en `StatusChange`.
+ Es más sencillo que introducir una librería de máquinas de estados (pauta de la solución más sencilla).
- Añadir un estado o transición implica actualizar `IncidentStatus` y sus pruebas.
