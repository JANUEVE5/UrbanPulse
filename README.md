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

## Características principales

| Para… | UrbanPulse permite… |
|---|---|
| **Ciudadanía** | Registrar incidencias con título, descripción, categoría y ubicación en el mapa; adjuntar evidencias y consultar su estado. |
| **Operadores municipales** | Validar o rechazar reportes, priorizar, asignar a departamentos o técnicos y buscar/filtrar incidencias. |
| **Técnicos** | Disponer de una cola de trabajo, actualizar el progreso y documentar la resolución. |
| **Administración** | Gestionar usuarios, roles, categorías y fuentes con auditoría completa. |
| **Analistas** | Consultar indicadores, estadísticas territoriales y análisis por zona. |

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
