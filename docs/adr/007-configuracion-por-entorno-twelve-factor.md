# ADR-007: Configuración por variables de entorno y servicios de apoyo con Docker Compose

## Estado

Accepted

## Contexto

La aplicación debe ejecutarse sin cambios en local, en la CI y en la nube (Twelve-Factor, factores III, IV y
X). Hasta ahora la conexión a la base de datos estaba fijada en `application.properties`, y cada miembro
instalaba PostgreSQL a mano, con versiones distintas a la de la CI. Esto provoca el clásico «en mi máquina
funciona» y obliga a tocar el código para cambiar de entorno.

## Opciones consideradas

1. Mantener la configuración fija en `application.properties` y la instalación manual de PostgreSQL.
2. Un fichero de propiedades por entorno dentro del repositorio (`application-prod.properties` con
   credenciales).
3. Configuración por variables de entorno, documentadas en `.env.example`, y servicios de apoyo levantados
   con Docker Compose.

## Decisión

Toda la configuración que cambia entre entornos se proporciona mediante variables de entorno, documentadas
en `.env.example`. El fichero `.env` real nunca se versiona. Los servicios de apoyo de desarrollo (PostgreSQL
15, la misma versión que en la CI) se levantan con `compose.yaml`.

## Consecuencias

+ El mismo artefacto sirve para cualquier entorno: solo cambia la configuración.
+ Ningún secreto llega al repositorio ni a las imágenes.
+ Paridad de versiones entre local y CI, con un único comando para preparar el entorno.
- Requiere Docker en los equipos de desarrollo, aunque sigue siendo posible usar un PostgreSQL local.
- Spring Boot no lee ficheros `.env` por sí mismo: hay que exportar las variables o confiar en los valores
  por defecto de desarrollo.
- Los valores por defecto de desarrollo que aún hay en `application.properties` deben pasar a placeholders
  `${...}` sin secretos.
