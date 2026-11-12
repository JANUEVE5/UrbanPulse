# Guía de desarrollo

Cómo preparar el entorno, ejecutar, probar y contribuir a UrbanPulse en local (Windows y Linux).

## Índice

1. [Requisitos](#1-requisitos)
2. [Preparar el entorno](#2-preparar-el-entorno)
3. [Base de datos](#3-base-de-datos)
4. [Ejecutar el backend](#4-ejecutar-el-backend)
5. [Ejecutar el frontend](#5-ejecutar-el-frontend)
6. [Ejecutar pruebas y validaciones](#6-ejecutar-pruebas-y-validaciones)
7. [Flujo de trabajo con Git](#7-flujo-de-trabajo-con-git)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Estructura del código](#9-estructura-del-código)
10. [Problemas frecuentes](#10-problemas-frecuentes)

---

## 1. Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| Git | cualquiera reciente | |
| Java JDK | **17** | La misma versión que en CI. Maven no hace falta: se usa el wrapper `mvnw`. |
| Node.js + npm | **22.13 o superior** | La misma versión que en CI (lo exige Expo SDK 58 / React Native 0.88). |
| Docker + Docker Compose | reciente | Para levantar PostgreSQL sin instalarlo en el equipo. |
| Expo Go | última | Opcional, para probar la app en un móvil físico. |

> NixOS: `nix shell nixpkgs#jdk17 nixpkgs#nodejs_22`.

## 2. Preparar el entorno

```bash
git clone https://github.com/JANUEVE5/UrbanPulse.git
cd UrbanPulse
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
```

Revisa `.env` y ajusta los valores si hace falta. **`.env` no se versiona nunca.**

## 3. Base de datos

### Opción A — Docker Compose (recomendada)

```bash
docker compose up -d        # levanta PostgreSQL 15 con los valores de .env
docker compose ps           # comprobar que está "healthy"
docker compose logs -f      # ver logs
docker compose down         # detener (los datos se conservan en el volumen)
docker compose down -v      # detener y BORRAR los datos
```

### Opción B — PostgreSQL instalado en el equipo

Crea la base de datos y usa las mismas credenciales que en tu `.env`:

```sql
CREATE DATABASE urbanpulse;
```

El esquema (`schema.sql`) y los datos de prueba (`data.sql`) se cargan solos al arrancar el backend.

> ⚠️ `schema.sql` **borra y recrea las tablas en cada arranque**. No guardes datos que quieras conservar.

## 4. Ejecutar el backend

Spring Boot lee la configuración de `backend/src/main/resources/application.properties`, donde cada valor
que cambia entre entornos tiene la forma `${VARIABLE:valor-por-defecto}`. Si defines la variable de entorno
(`SPRING_DATASOURCE_PASSWORD`, `CORS_ALLOWED_ORIGINS`…), **tiene prioridad**; si no, se usa el valor por
defecto de desarrollo, que coincide con `.env.example`. Con Docker Compose funciona sin más.

**Linux / macOS**

```bash
cd backend
chmod +x mvnw               # solo la primera vez
./mvnw spring-boot:run
```

Para cargar tu `.env` en la sesión antes de arrancar:

```bash
set -a; source ../.env; set +a
./mvnw spring-boot:run
```

**Windows (PowerShell / CMD)**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

La API queda disponible en `http://localhost:8080/api`. Para comprobarla:

```bash
curl http://localhost:8080/api/incidents

curl -i -X POST http://localhost:8080/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Bache en la calzada","descripcion":"Hay un bache frente al número 12.","categoria":"Vía pública","latitud":36.721274,"longitud":-4.421399}'
```

Crear incidencias exige **iniciar sesión**. Primero se obtiene un token y luego se envía en la cabecera
`Authorization`:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"david.serrano@urbanpulse.es","password":"urbanpulse-dev"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

curl -i -X POST http://localhost:8080/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"titulo":"Bache en la calzada","descripcion":"Hay un bache frente al número 12.","categoria":"Vía pública","latitud":36.721274,"longitud":-4.421399}'
```

La respuesta esperada del `POST` es `201 Created`, con el usuario del token como creador. Sin token, `401`.

### Usuarios de prueba

`data.sql` crea estos usuarios en cada arranque. **Todos tienen la contraseña `urbanpulse-dev`** (solo para
desarrollo local):

| Correo | Rol |
|---|---|
| `carlos.morales@urbanpulse.es` | `ADMIN` |
| `lucia.navarro@urbanpulse.es`, `alejandro.dominguez@urbanpulse.es` | `OPERATOR` |
| `marta.castillo@urbanpulse.es`, `javier.ruiz@urbanpulse.es` | `TECHNICIAN` |
| `elena.romero@urbanpulse.es` | `ANALYST` |
| `david.serrano@urbanpulse.es`, `carmen.gil@urbanpulse.es`, `pablo.vazquez@urbanpulse.es`, `sofia.delgado@urbanpulse.es` | `CITIZEN` |

También puedes crear una cuenta de ciudadano con `POST /api/auth/register`.

## 5. Ejecutar el frontend

```bash
cd frontend
npm install
npx expo start
```

En la consola de Expo:

- **`w`** abre la versión web (`http://localhost:8081`). También funciona `npm run web`.
- **`a`** abre el emulador de Android.
- Escanea el **QR** con Expo Go para probar en un móvil de la misma red Wi-Fi.

Para crear incidencias hay que **iniciar sesión** desde la barra lateral con uno de los usuarios de prueba
(ver «Usuarios de prueba» más arriba) o creando una cuenta nueva.

> Windows: si PowerShell bloquea la ejecución de scripts, ejecuta una vez
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`.

### Conectar desde un móvil físico

Por defecto la app usa `http://localhost:8080/api` (web) o `http://10.0.2.2:8080/api` (emulador de Android).
Desde un móvil físico indica la IP de tu ordenador en la red local:

```bash
# Linux / macOS
EXPO_PUBLIC_API_URL=http://<TU_IP_LOCAL>:8080/api npx expo start
```

```powershell
# Windows (PowerShell)
$env:EXPO_PUBLIC_API_URL="http://<TU_IP_LOCAL>:8080/api"; npx expo start
```

También puedes ponerlo en `frontend/.env` (no versionado). Expo carga automáticamente las variables
`EXPO_PUBLIC_*`.

## 6. Ejecutar pruebas y validaciones

Ejecútalas **antes de abrir un Pull Request**. La CI ejecuta lo mismo.

**Backend** (las pruebas de integración necesitan PostgreSQL en marcha):

```bash
cd backend
./mvnw test       # pruebas unitarias y de integración
./mvnw verify     # compilación, pruebas y validaciones completas (lo que ejecuta la CI)
```

**Frontend**:

```bash
cd frontend
npx tsc --noEmit  # comprobación de tipos
npx expo lint     # linter
```

## 7. Flujo de trabajo con Git

Resumen; los detalles están en [CONTRIBUTING.md](../CONTRIBUTING.md).

```bash
git switch main && git pull
git switch -c feature/nombre-funcionalidad
# ... cambios ...
git add <ficheros>
git commit -m "feat(incidents): descripción del cambio"
git push -u origin feature/nombre-funcionalidad
# abrir un Pull Request contra main en GitHub
```

- Nunca se hace commit directamente en `main`.
- Se usan commits pequeños con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/).
- Cada PR referencia su issue (`Closes #N`) y necesita la CI en verde y una aprobación.

## 8. Variables de entorno

Todas están documentadas en [`.env.example`](../.env.example).

| Variable | Usada por | Descripción |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` | `compose.yaml` | Configuración del contenedor PostgreSQL. |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Backend | Conexión a la base de datos. |
| `SERVER_PORT` | Backend | Puerto HTTP de la API (8080 por defecto). |
| `CORS_ALLOWED_ORIGINS` | Backend | Orígenes web que pueden llamar a la API, separados por comas (por defecto `http://localhost:8081`, Expo web). Si abres la app web desde otra URL, añádela aquí. No afecta a Android/iOS. |
| `SHOW_SQL` | Backend | `true` para ver en los logs las consultas SQL (por defecto `false`). |
| `JWT_SECRET` | Backend | Clave para firmar los tokens (mínimo 32 caracteres). El valor por defecto solo sirve en local. |
| `JWT_EXPIRATION_MINUTES` | Backend | Minutos de validez de cada token (por defecto 60). |
| `EXPO_PUBLIC_API_URL` | Frontend | URL base de la API. Es pública: nunca pongas secretos en ella. |

## 9. Estructura del código

```text
backend/src/main/java/com/example/urbanpulse/
├── config/       # Configuración transversal (CORS…)
├── controller/   # Endpoints REST: solo entrada/salida HTTP
├── dto/          # Objetos de petición y respuesta de la API
├── entity/       # Entidades JPA (mapean schema.sql)
├── repository/   # Acceso a datos (Spring Data JPA)
└── service/      # Lógica de negocio (interfaces + impl/)
backend/src/main/resources/
├── application.properties
├── schema.sql    # Esquema de BD, mantenido a mano (ddl-auto=none)
└── data.sql      # Datos de prueba

frontend/src/
├── app/          # Pantallas (rutas de Expo Router); _layout.tsx monta AppShell
├── components/   # Componentes reutilizables (app-shell y sidebar: estructura con barra lateral)
├── constants/    # Tema y constantes
├── hooks/        # Hooks
└── services/     # Llamadas HTTP a la API (nunca fetch dentro de componentes)
```

## 10. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` a `localhost:5432` | PostgreSQL no está arrancado. | `docker compose up -d` y `docker compose ps`. |
| `password authentication failed` | Las credenciales de `.env` / `application.properties` no coinciden con las de la BD. | Alinea `POSTGRES_PASSWORD` y `SPRING_DATASOURCE_PASSWORD`. |
| `Port 5432 is already allocated` | Ya hay un PostgreSQL local escuchando. | Páralo o cambia `POSTGRES_PORT` (y la URL de Spring). |
| La app web muestra un error de CORS al llamar a la API | Abres la web desde un origen que no está en `CORS_ALLOWED_ORIGINS`. | Añade esa URL a `CORS_ALLOWED_ORIGINS` y reinicia el backend. |
| `./mvnw: Permission denied` | El wrapper no tiene permisos de ejecución. | `chmod +x mvnw`. |
| La app en el móvil no carga datos | El móvil no llega a `localhost`. | Define `EXPO_PUBLIC_API_URL` con la IP de tu equipo. |
