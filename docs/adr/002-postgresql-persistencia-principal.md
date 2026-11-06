# ADR-002: Uso de PostgreSQL como motor de persistencia principal

## Estado

Accepted

## Contexto

El sistema maneja un modelo de dominio fuertemente estructurado y relacionado, que incluye entidades como
`Incident`, `User`, `StatusChange` y `UrbanAsset`. El requisito de auditoría y ciclo de vida (RF12) exige
garantías estrictas sobre las transiciones de estado y las asignaciones.

## Opciones consideradas

1. Base de datos NoSQL documental (MongoDB).
2. Base de datos relacional (PostgreSQL).

## Decisión

Utilizar PostgreSQL como base de datos relacional principal.

## Consecuencias

+ Fuerte integridad referencial y cumplimiento de las propiedades ACID, lo que garantiza que el historial de
  cambios de estado sea auditable y consistente.
+ Posibilidad de usar extensiones como PostGIS para consultas espaciales (barrios, distritos y proximidad a
  activos urbanos).
- Esquema más rígido ante cambios rápidos que un modelo documental.
- Mayor complejidad si el volumen de datos históricos crece hasta requerir particionamiento (*sharding*).
