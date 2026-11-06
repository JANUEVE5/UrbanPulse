# UrbanPulse

UrbanPulse es una plataforma para registrar y consultar incidencias urbanas. Este
repositorio contiene una API REST en Spring Boot y una aplicación cliente en Expo (React Native) para web y móvil.

---

## Tecnologías

- **Backend:** Java 17+, Spring Boot, Spring MVC, Spring Data JPA, PostgreSQL y Maven.
- **Frontend:** Expo SDK 57, React Native, Expo Router y TypeScript.

---

## Requisitos previos

- **Java JDK 17** o superior.
- **Node.js** (versión 18 o superior) y **npm**.
- **PostgreSQL** (en local o mediante Docker).

---

## 1. Configuración de la Base de Datos (PostgreSQL)

El backend está configurado en `backend/src/main/resources/application.properties` con los siguientes valores por defecto:
- **Host / Puerto:** `localhost:5432`
- **Base de datos:** `urbanpulse`
- **Usuario:** `postgres`
- **Contraseña:** `1234`

Asegúrate de que el servicio esté corriendo y crea la base de datos si no existe:
```sql
CREATE DATABASE urbanpulse;
```
---

## 2. Instrucciones para Windows

### Backend (Spring Boot)

Abre una terminal PowerShell o CMD:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

La API quedará disponible en `http://localhost:8080/api`.

### Frontend (Expo)

Abre una segunda terminal en la carpeta `frontend`:

1. **Permitir ejecución de scripts en PowerShell (solo si aparece error de política de ejecución):**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Instalar dependencias y arrancar:**
   ```powershell
   cd frontend
   npm install
   npx expo start
   ```

3. **Opciones de previsualización:**
   - Pulsa **`w`** para abrir la versión Web en el navegador (`http://localhost:8081`).
   - Pulsa **`a`** para abrir en emulador Android.
   - Escanea el código QR con la app **Expo Go** en tu móvil (deben estar en la misma red Wi-Fi).

---

## 3. Instrucciones para Linux

### Backend (Spring Boot)

Abre un terminal en Linux:

1. Da permisos de ejecución al wrapper de Maven (solo la primera vez):
   ```bash
   cd backend
   chmod +x mvnw
   ```

2. Arranca el servidor:
   ```bash
   ./mvnw spring-boot:run
   ```

La API quedará disponible en `http://localhost:8080/api`.

*(Nota para NixOS: Puedes entrar a un entorno con JDK 17 mediante `nix shell nixpkgs#jdk17`)*.

### Frontend (Expo)

Abre una segunda terminal en la carpeta `frontend`:

1. Instala dependencias y arranca el entorno:
   ```bash
   cd frontend
   npm install
   npx expo start
   ```

2. Para abrir directamente en el navegador:
   ```bash
   npm run web
   ```

*(Nota para NixOS: Puedes entrar a un entorno con Node.js mediante `nix shell nixpkgs#nodejs_22`)*.

---

## 4. Conexión desde un móvil físico (Red local)

Por defecto, la app web y el emulador conectan a `http://localhost:8080/api` o `10.0.2.2:8080/api`. Si pruebas desde un móvil físico escaneando el QR, debes indicarle la IP de tu ordenador en la red local:

- **En Windows (PowerShell):**
  ```powershell
  $env:EXPO_PUBLIC_API_URL="http://<TU_IP_LOCAL>:8080/api"; npx expo start
  ```

- **En Linux (Bash):**
  ```bash
  EXPO_PUBLIC_API_URL=http://<TU_IP_LOCAL>:8080/api npx expo start
  ```

---

## 5. Probar el endpoint de creación de incidencias

Con el backend iniciado, puedes comprobar la API con cURL:

```bash
curl -i -X POST http://localhost:8080/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Bache en la calzada","descripcion":"Hay un bache frente al número 12.","categoria":"Vía pública"}'
```

La respuesta esperada es `201 Created` con los datos de la incidencia.
