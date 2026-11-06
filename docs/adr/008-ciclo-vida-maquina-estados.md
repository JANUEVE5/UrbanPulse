# ADR-008: Ciclo de vida de la incidencia como máquina de estados con historial inmutable

## Estado

Proposed

## Contexto

RF12 exige que los cambios de estado respeten las transiciones permitidas y queden auditados, y RF18 que se
registren las decisiones relevantes. Actualmente el estado y la prioridad de `Incident` son texto libre, y una
incidencia nueva se crea con el estado `"Abierta"`, que no existe en el ciclo de vida definido (`REPORTED`,
`VALIDATED`, `REJECTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REOPENED`, `CLOSED`). Nada impide hoy una
transición inválida, como pasar de `REPORTED` a `CLOSED`.

## Opciones consideradas

1. Mantener el estado como texto libre y validar en cada endpoint.
2. Enum de estados con una tabla de transiciones permitidas en el servicio de dominio.
3. Librería de máquinas de estados (Spring Statemachine).

## Decisión

Modelar el estado como un `enum` Java (guardado como `VARCHAR` con `CHECK` en la base de datos) y centralizar
las transiciones permitidas en un único servicio de dominio. Ese servicio es el único que puede cambiar el
estado. Cada transición inserta, en la misma transacción, un registro en `StatusChange` (actor, instante,
estado origen, estado destino y motivo). `StatusChange` es de solo inserción.

## Consecuencias

+ Las transiciones inválidas se rechazan en un único punto y se pueden probar de forma exhaustiva.
+ El historial queda completo y no se puede alterar, como exigen RF12 y RF18.
+ Es más sencillo que introducir una librería de máquinas de estados (pauta de la solución más sencilla).
- Requiere migrar los datos existentes (`"Abierta"` → `REPORTED`) y ajustar `schema.sql` y `data.sql`.
- Añadir un estado nuevo implica tocar el enum, la tabla de transiciones y la restricción `CHECK`.
