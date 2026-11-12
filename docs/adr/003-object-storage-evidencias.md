# ADR-003: Almacenamiento de evidencias en Object Storage (S3/MinIO)

## Estado

Accepted

## Contexto

Los ciudadanos pueden adjuntar fotografías u otros ficheros (evidencias) al registrar o actualizar una
incidencia (RF05). Almacenar ficheros binarios pesados directamente en una base de datos relacional perjudica
su rendimiento y encarece las copias de seguridad.

## Opciones consideradas

1. Guardar las imágenes como objetos BLOB en PostgreSQL.
2. Guardar las imágenes en el sistema de archivos del servidor.
3. Utilizar un servicio de almacenamiento de objetos (Object Storage) independiente.

## Decisión

Utilizar Object Storage (como AWS S3 o MinIO) para los archivos físicos. En PostgreSQL se guardan únicamente
los metadatos y la referencia (URL o clave) en la entidad `Attachment`.

## Consecuencias

+ Mejora el rendimiento y reduce el tamaño de la base de datos principal.
+ Facilita la distribución de contenido estático a la aplicación React Native a través de CDNs.
+ Mantiene el backend sin estado, porque no hay ficheros en el disco del servidor (Twelve-Factor, factor VI).
- Introduce una nueva pieza de infraestructura y un punto adicional de posible fallo.
- Requiere gestionar la consistencia, por ejemplo cuando se guarda el registro en BD pero falla la subida al
  almacenamiento de objetos.
