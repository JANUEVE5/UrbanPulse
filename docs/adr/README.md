# Architecture Decision Records (ADR)

Un ADR documenta una decisión de arquitectura importante: **qué** se decidió y, sobre todo, **por qué**.
Según las pautas del proyecto, cada cambio relevante va acompañado de su ADR, de la actualización del modelo
C4 en [`../architecture.md`](../architecture.md) y de sus pruebas.

## Convenciones

- Ubicación: todos los ADR se guardan en esta carpeta, `docs/adr/`.
- Nombre de fichero: `NNN-titulo-en-kebab-case.md` (por ejemplo, `005-redis-cache.md`).
- Título del documento: `# ADR-NNN: Título`.
- Numeración correlativa. Un número no se reutiliza nunca.
- Estructura obligatoria: **Estado · Contexto · Opciones consideradas · Decisión · Consecuencias**.
  Usa la [plantilla](template.md).
- Estados posibles: `Proposed`, `Accepted`, `Rejected`, `Deprecated` y `Superseded by ADR-NNN`.
- Un ADR `Accepted` no se reescribe. Si la decisión cambia, se crea un ADR nuevo y el anterior pasa a
  `Superseded by ADR-NNN`.
- En las consecuencias, `+` indica un efecto positivo y `-` un coste o riesgo asumido.
- Cada ADR nuevo se añade a la tabla de abajo **en el mismo Pull Request**, en una rama `docs/adr-...`.

## Ejemplo

```markdown
# ADR-005: Introducción de Redis para caché

## Estado

Accepted

## Contexto

Las consultas de tráfico representan una elevada proporción de las peticiones y generan
repetidamente las mismas consultas a PostgreSQL.

## Opciones consideradas

1. Mantener consultas directas.
2. Redis.
3. Caché local de aplicación.

## Decisión

Utilizar Redis mediante Cache-Aside.

## Consecuencias

+ Menor carga sobre PostgreSQL.
+ Menor latencia.
+ Caché compartida entre instancias.
- Mayor complejidad.
- Posible información temporalmente desactualizada.
- Necesidad de estrategia de invalidación.
```

## Índice

| ADR | Título | Estado | Requisitos |
|---|---|---|---|
| [001](001-monolito-modular-spring-boot.md) | Adopción de arquitectura monolítica inicial con Spring Boot | Accepted | Pautas de diseño |
| [002](002-postgresql-persistencia-principal.md) | Uso de PostgreSQL como motor de persistencia principal | Accepted | RF12, RF18 |
| [003](003-object-storage-evidencias.md) | Almacenamiento de evidencias en Object Storage (S3/MinIO) | Accepted | RF05 |
| [004](004-degradacion-controlada-api-externa.md) | Estrategia de degradación controlada ante la API del Ayuntamiento | Accepted | RF23, RF26 |
| [005](005-cliente-multiplataforma-expo.md) | Cliente multiplataforma con Expo y React Native | Accepted | RF03, RF04, RF08 |
| [006](006-esquema-bd-explicito-sql.md) | Esquema de base de datos explícito en SQL, sin DDL automático | Accepted | RF12, RF18 |
| [007](007-configuracion-por-entorno-twelve-factor.md) | Configuración por variables de entorno y servicios de apoyo con Docker Compose | Accepted | Twelve-Factor |
| [008](008-ciclo-vida-maquina-estados.md) | Ciclo de vida de la incidencia como máquina de estados con historial inmutable | Proposed | RF12, RF18 |
| [009](009-autenticacion-autorizacion-jwt.md) | Autenticación con Spring Security y JWT, y autorización por roles | Proposed | RF01, RF02 |
| [010](010-representacion-localizacion.md) | Representación de la localización como latitud y longitud numéricas | Proposed | RF04, RF08 |
| [011](011-convenciones-api-rest.md) | Convenciones de la API REST: DTOs, paginación y formato de errores | Proposed | RF06, RF07 |
| [012](012-despliegue-contenedores.md) | Despliegue del backend como imagen de contenedor versionada | Proposed | Twelve-Factor |

Los ADR en estado `Proposed` están pendientes de que el equipo los revise y los acepte o rechace.
