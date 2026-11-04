# UrbanPulse

UrbanPulse es una plataforma para registrar y consultar incidencias urbanas. Este
repositorio contiene una API REST y una aplicación Expo para web y móvil.

## Funcionalidad RF03: registrar incidencia

Desde **Incidencias → Crear Incidencia**, se pueden enviar:

| Campo | Requisito | Longitud máxima |
|---|---|---:|
| Título | Obligatorio, no puede estar vacío | 100 caracteres |
| Descripción | Obligatoria, no puede estar vacía | 400 caracteres |
| Categoría | Opcional; texto libre | 50 caracteres |

Al crear una incidencia, el backend la guarda como `Abierta` y con prioridad inicial
`Media`. Mientras no haya autenticación, se asigna al primer usuario registrado. Las
incidencias antiguas siguen mostrándose usando `reporte_central` como título y descripción
cuando no tienen esos campos separados.

### API

`POST /api/incidents` recibe JSON y devuelve `201 Created` con la incidencia creada:

```json
{
  "titulo": "Bache en la calzada",
  "descripcion": "Hay un bache frente al número 12.",
  "categoria": "Vía pública"
}
```

`categoria` se puede omitir o enviar como texto vacío. `titulo` y `descripcion` deben
contener texto. La API también conserva `GET /api/incidents` para listar y
`GET /api/incidents/{id}` para consultar el detalle.

## Tecnologías

- Backend: Java 17+, Spring Boot 4, Spring MVC, Spring Data JPA y PostgreSQL.
- Frontend: Expo SDK 57, React Native, Expo Router y TypeScript.

## Ejecución local en NixOS

### 1. Preparar PostgreSQL

Activa el servicio en `/etc/nixos/configuration.nix`:

```nix
services.postgresql.enable = true;
```

Aplica la configuración e inicia el servicio:

```bash
sudo nixos-rebuild switch
sudo systemctl start postgresql
sudo systemctl status postgresql
```

Crea el usuario y la base de datos de desarrollo (si aún no existen):

```bash
sudo -u postgres psql
```

En el prompt de PostgreSQL, ejecuta y sustituye la contraseña de ejemplo:

```sql
CREATE ROLE urbanpulse WITH LOGIN PASSWORD 'cambia-esta-contrasena';
CREATE DATABASE urbanpulse OWNER urbanpulse;
\q
```

Configura `backend/src/main/resources/application.properties` para que la URL apunte a
`jdbc:postgresql://localhost:5432/urbanpulse` y coincidan el usuario y la contraseña.
No subas contraseñas reales al repositorio.

> **Aviso de desarrollo:** `schema.sql` elimina y recrea las tablas al arrancar porque
> `spring.sql.init.mode=always`. Cada inicio del backend borra los datos anteriores y
> vuelve a cargar los datos de ejemplo. No uses esta configuración con datos que quieras
> conservar.

### 2. Ejecutar el backend

Se necesita Java 17 o posterior. Si no está instalado en el sistema, puedes abrir una
terminal temporal con JDK 17 y, en esa misma terminal, ejecutar el backend:

```bash
nix shell nixpkgs#jdk17
cd backend
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

### 3. Ejecutar el frontend sin instalar npm en el sistema

Abre una terminal con Node.js y npm proporcionados por Nix:

```bash
nix shell nixpkgs#nodejs_22
```

Dentro de esa terminal, instala dependencias y arranca Expo para web:

```bash
cd frontend
npm ci
npm run web
```

Abre en el navegador la URL local que muestre Expo. Para iniciar Expo y elegir otro
destino (por ejemplo, un emulador), usa `npm start`.

La aplicación web usa por defecto `http://localhost:8080/api`. En un móvil físico,
configura `EXPO_PUBLIC_API_URL` con la IP del ordenador y reinicia Expo, por ejemplo:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:8080/api npm start
```

Sustituye la IP de ejemplo por la dirección de tu ordenador en la red local y permite
las conexiones al puerto `8080` en el firewall si fuera necesario.

### 4. Probar el endpoint de creación

Con el backend iniciado, puedes comprobar la API desde otra terminal:

```bash
curl -i -X POST http://localhost:8080/api/incidents \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Bache en la calzada","descripcion":"Hay un bache frente al número 12.","categoria":"Vía pública"}'
```

La respuesta correcta es `201 Created` con los datos de la incidencia. Para omitir la
categoría, elimina esa propiedad del JSON. Si el usuario registrado no existe, el backend
responde `409 Conflict`; los campos obligatorios vacíos o que superen el límite de
caracteres se rechazan con `400 Bad Request`.
