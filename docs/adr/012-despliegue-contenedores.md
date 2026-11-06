# ADR-012: Despliegue del backend como imagen de contenedor versionada

## Estado

Proposed

## Contexto

UrbanPulse es una plataforma cloud y debe poder desplegarse de forma reproducible en staging y producción.
Twelve-Factor exige separar construcción, release y ejecución (factor V), exponer el servicio por un puerto
(factor VII) y poder escalar añadiendo procesos (factor VIII). Hoy solo existe la CI; no hay artefacto
desplegable ni entorno en la nube.

## Opciones consideradas

1. Desplegar el `.jar` a mano en una máquina virtual (SSH, `git pull` y `java -jar`).
2. Imagen Docker versionada, construida por la CI y ejecutada en un servicio gestionado de contenedores.
3. Kubernetes gestionado desde el principio.

## Decisión

Empaquetar el backend como imagen Docker multi-stage (build con Maven y ejecución con JRE 17), construida y
publicada por GitHub Actions con la etiqueta de versión semántica y el SHA del commit. La imagen se ejecutará
en un servicio gestionado de contenedores, con la configuración inyectada por variables de entorno y
PostgreSQL como servicio gestionado. La plataforma concreta se fijará cuando el equipo elija proveedor.
Kubernetes se valorará solo si aparece una necesidad de escalado observable.

## Consecuencias

+ Mismo artefacto inmutable en todos los entornos; el rollback consiste en volver a desplegar la imagen
  anterior.
+ Despliegue automatizado y trazable: commit → imagen → release.
+ Mucho más sencillo de operar que Kubernetes en esta fase.
- Hay que mantener un `Dockerfile` y un workflow de publicación de imágenes.
- Depende de un proveedor cloud y de su modelo de costes.
- Requiere añadir endpoints de salud (Spring Boot Actuator) para las comprobaciones de la plataforma.
