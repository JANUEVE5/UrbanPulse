# ADR-006: Esquema de base de datos explícito en SQL, sin DDL automático

## Estado

Accepted

## Contexto

El modelo de dominio y su historial de auditoría (RF12, RF18) dependen de restricciones de integridad
(claves foráneas, `NOT NULL`, unicidad) que deben ser revisables por todo el equipo. Hibernate puede generar
o modificar el esquema automáticamente (`ddl-auto=update`), pero los cambios que produce son implícitos,
difíciles de revisar en un Pull Request y pueden perder datos.

## Opciones consideradas

1. Dejar que Hibernate genere y actualice el esquema (`ddl-auto=update`).
2. Esquema escrito a mano en `schema.sql`, con Hibernate sin generar DDL (`ddl-auto=none` o `validate`).
3. Migraciones versionadas con una herramienta (Flyway o Liquibase).

## Decisión

Definir el esquema de forma explícita en `backend/src/main/resources/schema.sql`. Hibernate tiene prohibido
generar DDL (`spring.jpa.hibernate.ddl-auto=none`). Antes de que exista un entorno con datos persistentes
(staging o producción), el esquema pasará a migraciones versionadas con Flyway en un ADR posterior.

## Consecuencias

+ El esquema es visible y revisable en cada Pull Request.
+ Las entidades JPA se adaptan al esquema, y no al revés.
+ No requiere herramientas adicionales en esta fase.
- `schema.sql` borra y recrea las tablas en cada arranque, así que solo sirve para desarrollo.
- Los cambios de esquema no tienen historial de versiones aplicado en la base de datos. Esto incumple el
  factor XII de Twelve-Factor (procesos de administración versionados) hasta que se adopte Flyway.
