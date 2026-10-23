# Contexto Global del Proyecto: UrbanPulse
- **Descripción:** Sistema de gestión de incidencias urbanas (arquitectura cliente-servidor).
- **Frontend:** Aplicación móvil en React Native (Expo). Todo su código reside exclusivamente en la carpeta `/frontend`.
- **Backend:** API REST en Java Spring Boot (Monolito). Todo su código reside exclusivamente en la carpeta `/backend`.
- **Base de Datos:** PostgreSQL relacional.

# Reglas de Arquitectura Backend (Spring Boot)
- **Estructura de Capas:** El código debe dividirse estrictamente en `entity`, `repository`, `service` y `controller`. Toda la lógica de negocio pertenece al `service`.
- **Persistencia (IMPORTANTE):** El esquema de base de datos es manual y cerrado. Está totalmente prohibido usar `spring.jpa.hibernate.ddl-auto=update`. Hibernate solo debe validar (`validate`) o ignorar (`none`).
- **Mapeo de Entidades:** El esquema SQL original utiliza comillas dobles para los nombres de las tablas (ej. `"User"`, `"Incident"`). Las entidades JPA deben reflejar esto usando `@Table(name = "\"User\"")`.
- **Geolocalización:** Las coordenadas se manejan como `NUMERIC(9,6)` en base de datos. En Java, utiliza `BigDecimal` o tipos nativos de PostGIS si se requiere análisis espacial.

# Reglas de Arquitectura Frontend (React Native)
- **Framework:** Usamos Expo gestionado con Node.js 20.
- **Mapas:** Uso obligatorio de `react-native-maps` para representar los activos urbanos y las incidencias.
- **Peticiones HTTP:** Las llamadas a la API deben centralizarse en servicios dentro de una carpeta `/services` o `/api`, nunca hacer `fetch` directamente dentro de los componentes visuales.

# Pautas de Generación de Código (Instrucciones para el Agente IA)
- **Cero Suposiciones:** Antes de generar código para el backend, lee el archivo `schema.sql` y `data.sql`. No inventes propiedades, relaciones o estados que no existan en esas tablas.
- **Seguridad:** Nunca generes código que incluya contraseñas duras, tokens o cadenas de conexión a base de datos.
- **Trazabilidad de Estados:** Las actualizaciones de estado de una incidencia deben registrarse siempre en la tabla `"StatusChange"`, manteniendo el historial de auditoría intacto.