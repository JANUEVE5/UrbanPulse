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

| ADR | Título | Estado |
|---|---|---|
| — | *Pendiente de migrar los ADR-001 a ADR-004 y añadir los nuevos.* | — |
