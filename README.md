# UrbanPulse

**Plataforma cloud para la gestión inteligente de incidencias urbanas.**

UrbanPulse transforma un aviso ciudadano aislado (un semáforo averiado, un árbol caído, un bache) en una
unidad de trabajo **enriquecida con contexto urbano, trazable y analizable**. Integra lo que reporta la
ciudadanía con datos de la ciudad de Málaga (activos urbanos, barrio y distrito, tráfico, meteorología…)
para mejorar la clasificación, priorización, seguimiento, análisis y resolución de cada incidencia.

La plataforma apoya al ciudadano, al operador municipal y al responsable de planificación **sin sustituir
la decisión humana** en actuaciones sensibles.

> Proyecto de la asignatura de Computación en la Nube — E.T.S. Ingeniería Informática, Universidad de Málaga.

---

## Registro de incidencias

| Campo | Requisito | Longitud máxima |
|---|---|---:|
| Título | Obligatorio, no puede estar vacío | 100 caracteres |
| Descripción | Obligatoria, no puede estar vacía | 400 caracteres |
| Categoría | Opcional; texto libre | 50 caracteres |
| Prioridad | Opcional: `Baja`, `Media` o `Alta` | — |

Al crear una incidencia, el backend la guarda como `Abierta`. Si no se indica prioridad,
se usa `Media`. La incidencia queda asociada al usuario autenticado. Las incidencias
antiguas siguen mostrándose usando `reporte_central` como título y descripción cuando no
tienen esos campos separados.

## Características principales

| Para… | UrbanPulse permite… |
|---|---|
| **Ciudadanía** | Registrar incidencias con título, descripción, categoría y ubicación en el mapa; adjuntar evidencias y consultar su estado. |
| **Operadores municipales** | Validar o rechazar reportes, priorizar, asignar a departamentos o técnicos y buscar/filtrar incidencias. |
| **Técnicos** | Disponer de una cola de trabajo, actualizar el progreso y documentar la resolución. |
| **Administración** | Gestionar usuarios, roles, categorías y fuentes con auditoría completa. |
| **Analistas** | Consultar indicadores, estadísticas territoriales y análisis por zona. |

```json
{
  "titulo": "Bache en la calzada",
  "descripcion": "Hay un bache frente al número 12.",
  "categoria": "Vía pública",
  "prioridad": "Alta",
  "latitud": 36.721274,
  "longitud": -4.421399
}
```

`categoria` y `prioridad` se pueden omitir; la prioridad debe ser `Baja`, `Media` o `Alta`.
`titulo` y `descripcion` deben contener texto. La API también conserva
`GET /api/incidents` para listar y `GET /api/incidents/{id}` para consultar el detalle.
La creación requiere autenticación y coordenadas geográficas válidas.

La prioridad se puede cambiar después desde el detalle de la incidencia o mediante
`PATCH /api/incidents/{id}/priority`, enviando `{"prioridad":"Alta"}` (también se aceptan
`Media` y `Baja`). Devuelve `200 OK` con los datos actualizados; devuelve `400 Bad Request`
si la prioridad no es válida, `403 Forbidden` si el usuario no tiene privilegios y
`404 Not Found` si no existe la incidencia. Solo `OPERATOR` y `ADMIN` pueden cambiarla.

## Comentarios en incidencias

El detalle (`GET /api/incidents/{id}`) incluye `comentarios`, en orden cronológico. Para
añadir un comentario se usa `POST /api/incidents/{id}/comments`:

```json
{
  "contenido": "Ya se avisó al equipo municipal."
}
```

El comentario debe contener texto y admite hasta 400 caracteres. Se requiere autenticación;
el autor se toma del usuario autenticado. La respuesta es `201 Created` con la incidencia y
el listado de comentarios actualizado. Se devuelve `400 Bad Request` si el comentario está
vacío o supera el límite, `401 Unauthorized` sin autenticación y `404 Not Found` si la
incidencia no existe. Se guarda el autor y la fecha de creación en `"IncidentComment"`.
Los comentarios están disponibles para cualquier usuario autenticado; no requieren un rol
municipal.

## Funcionalidad RF12: ciclo de vida de incidencias

Los estados permitidos y sus transiciones son:

```text
Abierta ────────→ En revisión → Resuelta → Cerrada
   └────────────→ Rechazada (terminal)
                 En revisión ─→ Rechazada (terminal)
Resuelta/Cerrada → Reabierta → En revisión
```

`Abierta` puede avanzar a `En revisión` o ser rechazada; `En revisión` también puede
finalizar como `Rechazada`. `Resuelta` puede
cerrarse o reabrirse; una incidencia `Cerrada` también puede reabrirse. Una incidencia
`Reabierta` vuelve a `En revisión`. `Rechazada` es terminal. Rechazar o reabrir requiere
un motivo no vacío, que se conserva en el historial. Un estado desconocido se rechaza con
`400 Bad Request` y una transición no permitida con `409 Conflict`.
Solo los roles `OPERATOR`, `TECHNICIAN` y `ADMIN` pueden cambiar el estado; el resto recibe
`403 Forbidden`.
Cada transición válida actualiza la incidencia y agrega, en la misma transacción, una
fila a `"StatusChange"` con el usuario autenticado como actor, la transición, el motivo
opcional y la fecha. El detalle de la incidencia devuelve ese historial en orden cronológico.

`PATCH /api/incidents/{id}/status` recibe el estado destino y, opcionalmente, el motivo:

```json
{
  "estado": "En revisión",
  "motivo": "Asignada al equipo de revisión"
}
```

Para rechazar o reabrir, el `motivo` es obligatorio:

```json
{
  "estado": "Rechazada",
  "motivo": "La incidencia está fuera del ámbito municipal."
}
```

Devuelve `200 OK` con la incidencia actualizada y su historial, `404 Not Found` si la
incidencia no existe, `400 Bad Request` si falta el estado o el motivo supera el límite de
caracteres, `401 Unauthorized` sin autenticación, `403 Forbidden` sin un rol autorizado y
`409 Conflict` si la transición no está permitida. El campo `motivo` admite hasta 400
caracteres.
Principios del producto:

- **La incidencia es el centro del dominio** y conserva un ciclo de vida auditable
  (`REPORTED → VALIDATED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`, con `REJECTED` y `REOPENED`).
- **Los datos externos enriquecen, nunca bloquean**: si una fuente de la ciudad no está disponible,
  la incidencia se registra igualmente (degradación controlada).
- **Solución más sencilla que cumpla los atributos de calidad medidos**: se parte de un monolito y solo se
  añaden piezas cuando hay un problema observable, documentado con un [ADR](docs/adr/).

Estado actual de las funcionalidades: ver [CHANGELOG.md](CHANGELOG.md).

---

## Tecnologías

| Capa | Tecnología | Para qué se usa |
|---|---|---|
| Backend | **Java 17 + Spring Boot** (Spring MVC, Spring Data JPA) | API REST monolítica con la lógica de negocio de incidencias. |
| Build backend | **Maven** (wrapper `mvnw`) | Dependencias explícitas, compilación, pruebas y empaquetado. |
| Base de datos | **PostgreSQL 15** | Persistencia relacional y transaccional del dominio y del historial de estados. |
| Frontend | **Expo + React Native + TypeScript** (Expo Router) | Aplicación móvil y web para ciudadanía y personal municipal. |
| Mapas | **react-native-maps** / OpenStreetMap (web) y **expo-location** | Selección de ubicación y visualización de incidencias en el mapa. |
| Contenedores | **Docker Compose** | Levantar los servicios de apoyo (PostgreSQL) de forma reproducible. |
| CI | **GitHub Actions** | Compilar y probar backend y frontend en cada Pull Request. |

Las decisiones que justifican cada elección están en [`docs/adr/`](docs/adr/).

---

## Inicio rápido

```bash
git clone https://github.com/JANUEVE5/UrbanPulse.git
cd UrbanPulse
cp .env.example .env
docker compose up -d                       # PostgreSQL
cd backend && ./mvnw spring-boot:run       # API en http://localhost:8080/api
cd ../frontend && npm install && npx expo start
```

La guía completa (Windows y Linux, pruebas, móvil físico, problemas frecuentes) está en
[docs/development.md](docs/development.md).

---

## Documentación

| Documento | Contenido |
|---|---|
| [docs/requirements.md](docs/requirements.md) | Requisitos funcionales, priorización MoSCoW y alcance del sprint. |
| [docs/architecture.md](docs/architecture.md) | Arquitectura del sistema (modelo C4), modelo de dominio y ciclo de vida. |
| [docs/development.md](docs/development.md) | Cómo preparar el entorno, ejecutar, probar y trabajar con Git. |
| [docs/deployment.md](docs/deployment.md) | Cómo se construye, configura y despliega la aplicación. |
| [docs/adr/](docs/adr/) | Registro de decisiones de arquitectura (ADR). |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Flujo de trabajo, ramas, commits y Pull Requests. |
| [AGENTS.md](AGENTS.md) | Instrucciones para agentes de IA que trabajan en el repositorio. |

## Estructura del repositorio

```text
UrbanPulse/
├── .github/        # CI (workflows), plantillas de issues y de Pull Request
├── .agents/        # Skills compartidas para agentes de IA
├── .claude/        # Configuración de Claude Code del proyecto
├── backend/        # API REST Spring Boot (Maven)
├── frontend/       # Aplicación Expo / React Native
├── docs/           # Arquitectura, desarrollo, despliegue y ADRs
├── compose.yaml    # Servicios de apoyo para desarrollo local
└── .env.example    # Variables de entorno necesarias (sin secretos)
```

## Contribuir

Todo cambio entra en `main` mediante una rama y un Pull Request revisado. Lee
[CONTRIBUTING.md](CONTRIBUTING.md) antes de empezar.

## Licencia

Distribuido bajo licencia [MIT](LICENSE).
