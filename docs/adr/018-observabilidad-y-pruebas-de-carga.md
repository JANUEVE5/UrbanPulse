# ADR-018: Observabilidad con Micrometer y Prometheus y pruebas de carga con k6

## Estado

Proposed

## Contexto

La práctica de atributos de calidad pide caracterizar el rendimiento de la API, encontrar su capacidad,
estudiar su tolerancia a picos (p. ej. un episodio de lluvias intensas en Málaga) y medir el efecto del
volumen de datos y de las escrituras concurrentes sobre PostgreSQL. Hasta ahora no había forma de medirlo:

- No existían pruebas de carga ni requisitos de rendimiento verificables. Se toma como referencia
  «p95 < 500 ms y < 1 % de errores» para las consultas de incidencias.
- La API no exponía métricas internas. Con solo la latencia vista desde el cliente no se puede saber si el
  cuello de botella es la CPU, los hilos de Tomcat o el pool de conexiones a PostgreSQL (HikariCP, 10
  conexiones por defecto).
- Las pruebas se ejecutan en un portátil distinto del de desarrollo, así que todo debe poder lanzarse con
  scripts versionados y sin pasos manuales.

## Opciones consideradas

1. **No instrumentar**: medir solo con k6 desde el cliente. Sencillo, pero no permite diagnosticar la causa
   de la degradación.
2. **Spring Boot Actuator + Micrometer con registro Prometheus**, Prometheus y Grafana en un Docker Compose
   aparte solo para pruebas, y k6 enviando sus métricas a Prometheus por Remote Write.
3. **OpenTelemetry** (agente Java + colector) con trazas y métricas. Más potente, pero añade un agente, un
   colector y un backend de trazas que la práctica no necesita.

## Decisión

Utilizar Actuator + Micrometer con métricas en formato Prometheus en la API, y un entorno de pruebas
separado en `perf/` con scripts k6 por experimento, Prometheus y Grafana con un panel ya provisionado.

## Consecuencias

+ Se correlacionan las métricas de k6 (latencia, throughput, errores, `dropped_iterations`) con las internas
  (CPU, heap, GC, hilos de Tomcat, conexiones activas y en espera de HikariCP, latencia por URI) en un
  mismo panel.
+ Las pruebas son reproducibles: cada experimento se lanza con `perf/experimentos.sh`, se repite 3 veces y
  `perf/analizar.py` resume media y desviación típica.
+ El backend de producción no cambia de arquitectura: solo añade dos dependencias y propiedades de
  configuración (`ACTUATOR_EXPOSURE`).
- `/actuator/prometheus` es público para que Prometheus pueda leerlo sin token. Expone información interna
  (versiones, uso de recursos); en un despliegue real debe restringirse por red o reducir `ACTUATOR_EXPOSURE`.
- Los histogramas de latencia por endpoint aumentan el número de series y el tamaño de cada lectura de
  métricas.
- Prometheus y Grafana son infraestructura adicional que hay que mantener, aunque solo en el entorno de pruebas.
- Los índices que se prueben en el experimento de volumen de datos no entran en `schema.sql` hasta que los
  resultados los justifiquen en un ADR propio.
