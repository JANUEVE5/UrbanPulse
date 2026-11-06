# ADR-001: Adopción de arquitectura monolítica inicial con Spring Boot

## Estado

Accepted

## Contexto

El sistema UrbanPulse debe gestionar el ciclo de vida de incidencias urbanas desde cero. Las pautas de diseño
del proyecto establecen que se debe adoptar la solución más sencilla posible que satisfaga los requisitos
medidos, incorporando nuevos componentes solo cuando haya una justificación observable.

## Opciones consideradas

1. Arquitectura basada en microservicios.
2. Arquitectura serverless (funciones en la nube).
3. Monolito modular con Spring Boot.

## Decisión

Utilizar un monolito modular implementado en Java con Spring Boot.

## Consecuencias

+ Despliegue e infraestructura inicial mucho más simples.
+ Facilita mantener la integridad transaccional entre las entidades del modelo central.
+ Menor sobrecarga de red y latencia en las comunicaciones internas.
- Escalabilidad independiente limitada: si un módulo de análisis de IA requiere mucha CPU, escala todo el bloque.
- Riesgo de alto acoplamiento si no se respetan las fronteras de los paquetes (Gestión, Contexto, Inteligencia).
