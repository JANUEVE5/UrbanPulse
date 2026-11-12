# AGENTS.md — Backend (Spring Boot)

Complementa al [`AGENTS.md`](../AGENTS.md) raíz.

## Estructura por capas

- El código se divide en `controller`, `service` (interfaz + `impl/`), `repository`, `entity`, `dto` y
  `config`, dentro de `com.example.urbanpulse`.
- **Toda la lógica de negocio va en `service`.** Los controllers solo traducen HTTP ⇄ DTO y delegan.
- Los controllers exponen DTOs, nunca entidades JPA directamente.
- Valida la entrada con Bean Validation (`@Valid`, `@NotBlank`…) en los DTOs de petición.

## Persistencia

- El esquema es manual y cerrado (`src/main/resources/schema.sql`). **Prohibido** usar
  `spring.jpa.hibernate.ddl-auto=update` o `create`. Hibernate solo puede usar `validate` o `none`.
- Las tablas se definen con comillas dobles (`"User"`, `"Incident"`). Las entidades lo reflejan con
  `@Table(name = "\"Incident\"")`.
- Coordenadas: `NUMERIC(9,6)` en la base de datos y `BigDecimal` en Java, salvo que un ADR introduzca
  PostGIS.
- Las transiciones de estado de una incidencia **siempre** insertan un registro en `"StatusChange"` dentro
  de la misma transacción.

## Configuración

- No escribas credenciales nuevas en `application.properties`. Usa placeholders
  `${VARIABLE:valor-por-defecto-de-desarrollo}` y documenta la variable en `.env.example`.

## Pruebas

- Unitarias de servicio con Mockito. De controller con `@WebMvcTest` y MockMvc.
- Cada endpoint o regla de negocio nueva incluye su prueba.
- `./mvnw verify` debe pasar antes de abrir un PR. Las pruebas de integración necesitan PostgreSQL
  (`docker compose up -d`).
