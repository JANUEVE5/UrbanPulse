# Tutorial: ejecutar la práctica de k6 en el portátil de pruebas

Pasos en orden, desde un portátil vacío hasta tener los datos para rellenar el informe. Los detalles de
cada script están en [README.md](README.md).

---

## Paso 0. Instalar lo necesario (una sola vez)

| Herramienta | Comprobar |
|---|---|
| Git | `git --version` |
| Docker + Compose | `docker compose version` |
| Java 17 | `java -version` |
| k6 v1.x | `k6 version` |
| Python 3 (+ `pip install matplotlib`) | `python3 --version` |

Instalación de k6: <https://grafana.com/docs/k6/latest/set-up/install-k6/> (Ubuntu: repositorio apt de
`dl.k6.io`; macOS: `brew install k6`; Windows: usa **WSL**, porque los scripts son de bash).

Necesitas internet al lanzar las pruebas (k6 descarga una librería de `jslib.k6.io`).

## Paso 1. Descargar el proyecto

```bash
git clone -b feature/pruebas-carga-observabilidad https://github.com/JANUEVE5/UrbanPulse.git
```

```bash
cd UrbanPulse && cp .env.example .env
```

(Cuando el PR esté fusionado, basta con clonar `main`.)

## Paso 2. Levantar la infraestructura

Base de datos:

```bash
docker compose up -d
```

Prometheus y Grafana:

```bash
docker compose -f perf/observabilidad/compose.yaml up -d
```

Compilar el backend una vez:

```bash
cd backend && ./mvnw -q package -DskipTests && cd ..
```

Arrancar la API (en una terminal aparte, se queda abierta):

```bash
java -jar backend/target/urbanpulse-*.jar
```

Comprueba:

- <http://localhost:8080/actuator/health> devuelve `{"status":"UP"}`.
- <http://localhost:9090/targets>: `urbanpulse-api` aparece en verde (**UP**).
- <http://localhost:3000>: se abre Grafana con el panel **UrbanPulse — k6 + backend**.

> **Reiniciar la API** = `Ctrl+C` en su terminal y volver a lanzar `java -jar …`. Cada arranque recarga
> `data.sql`, así que todos los experimentos empiezan con los mismos datos.

## Paso 3. Anotar el entorno (para el informe)

```bash
lscpu | grep -E "Model name|^CPU\(s\)"; free -h | head -2; k6 version; java -version 2>&1 | head -1
```

Copia la salida al apartado «Entorno de pruebas» del informe. Cierra el navegador (salvo Grafana) y
programas pesados, y deja el portátil enchufado.

## Paso 4. Prueba de humo

```bash
./perf/experimentos.sh smoke
```

Al final deben salir todos los `checks` en verde y ningún `✗` en los umbrales. Si falla, mira la tabla
«Problemas habituales» del [README](README.md#4-problemas-habituales) antes de seguir.

## Paso 5. Ejecutar los experimentos

Antes de **cada** experimento: reinicia la API (paso 2) y abre Grafana con el rango «Last 15 minutes»
para ir viendo la ejecución. Cuando termine, haz capturas del panel (ver paso 7).

| Orden | Comando | Duración aprox. |
|---|---|---|
| 1 | `./perf/experimentos.sh exp1` | 70 min |
| 2 | `./perf/experimentos.sh exp2a` | 30 min |
| 3 | `./perf/experimentos.sh exp2b` | 40 min |
| 4 | `./perf/experimentos.sh exp2c` | 10 min |
| 5 | `./perf/experimentos.sh exp3` | 25 min |
| 6 | `./perf/experimentos.sh exp4a` | 25 min |
| 7 | `./perf/experimentos.sh exp4b` | 60 min o más (no reinicies la API mientras dure) |

Consejos:

- **Ajusta la carga a tu portátil.** Mira el resultado de `exp2a`: si con 100 usuarios virtuales (VUs) la
  latencia p95 sigue por debajo de 500 ms, repite con más, por ejemplo `EXP2_VUS="100 200 400" ./perf/experimentos.sh exp2a`.
  Si con 25 ya falla, usa valores menores. Haz lo mismo con `EXP2_RATES` y con `PEAK_RATE` (exp3).
- Para lanzar solo una parte: `EXP1_OPS="listar crear" ./perf/experimentos.sh exp1`.
- Si 1.000.000 de incidencias tarda demasiado: `EXP4B_VOLUMES="1000 10000 100000" ./perf/experimentos.sh exp4b`.
- Si un experimento se corta, puedes relanzarlo: las repeticiones se sobrescriben en su carpeta.

## Paso 6. Generar tablas y gráficas

```bash
python3 perf/analizar.py --graficas
```

Se crean:

- `perf/resultados/resumen.md`: una tabla por experimento con p50, p95, p99, peticiones/s, errores y
  `dropped_iterations` (media ± desviación típica de las 3 repeticiones).
- `perf/resultados/datos.csv`: todas las repeticiones, para hacer tus propias gráficas en una hoja de cálculo.
- `perf/resultados/<experimento>/<experimento>.png`: barras de error con los puntos de cada repetición.
- En cada `rep-N/` hay un `report.html` (informe de k6, se abre en el navegador).

## Paso 7. Capturas de Grafana

Para cada experimento, en el panel **UrbanPulse — k6 + backend**:

1. En el desplegable **Prueba (testid)** elige las repeticiones (el `testid` sale en la consola al empezar cada una).
2. Ajusta el rango de tiempo a la duración de la ejecución.
3. Captura las dos filas: **k6** (VUs, peticiones/s, p95/p99, errores, `dropped_iterations`) y **Backend**
   (CPU, conexiones a PostgreSQL de HikariCP, hilos de Tomcat, memoria, latencia por URI).

Las más útiles: exp2c (todo el escalado en una sola gráfica), exp3 (pico y recuperación) y exp4b (con y
sin índices).

## Paso 8. Rellenar el informe

### Experimento 1: ¿qué operaciones son más lentas?

Copia de `resumen.md` → sección `exp1-linea-base` la tabla del enunciado (operación, p50, p95, p99, peticiones/s,
errores). Responde:

1. **Endpoint con más latencia**: el de mayor p95/p99. Probablemente `login`, por el coste de BCrypt, o `mapa`,
   que devuelve 100 incidencias.
2. **¿El más lento tiene el menor throughput?** Con 10 VUs y sin pausas, throughput ≈ 10 / latencia media.
   Comprueba si se cumple y explica las excepciones.
3. **p50 frente a p99**: una diferencia grande indica colas, recolección de basura (GC) o bloqueos. Las
   escrituras bloquean la fila (`SELECT … FOR UPDATE`).
4. **Qué optimizar primero**: la operación más usada (mapa y listado) que tenga peor p95, no solo la más
   lenta en términos absolutos.

### Experimento 2: ¿cuál es la capacidad?

- **2a**: tabla por VUs (10/25/50/100) con p95, peticiones/s y errores. Haz una gráfica de throughput frente a
  VUs y de p95 frente a VUs. **Punto de degradación**: donde el p95 empieza a subir rápido. **Incumplimiento**:
  el primer nivel con p95 > 500 ms o errores > 1 %. **Capacidad**: el throughput máximo alcanzado.
- **2b**: tabla por tasa. La capacidad sostenible es la mayor tasa con p95 < 500 ms, errores < 1 % y
  `dropped_iterations = 0`.
- **2c**: captura de Grafana con la latencia y las conexiones de HikariCP frente al tiempo, señalando el
  escalón en el que se satura.
- **Concurrencia, capacidad y escalabilidad**:
  - Concurrencia: usuarios o peticiones simultáneos.
  - Capacidad: peticiones/s máximas que se cumplen dentro del requisito.
  - Escalabilidad: cómo cambia la capacidad al añadir recursos, por ejemplo instancias o índices; enlaza con el exp4b.
- **Cuello de botella**: usa el panel del backend. CPU al 100 % → límite de CPU. Conexiones de HikariCP
  activas = 10 y algunas «esperando» → límite de PostgreSQL o del pool.

### Experimento 3: emergencia urbana

En `resumen.md` → `exp3-pico-emergencia`, compara las filas `scenario:base`, `scenario:pico` y
`scenario:recuperacion` para cada configuración (`mapa-0`, `mapa-50`, `mapa-100`):

- ¿Aparecen errores o `dropped_iterations` en el pico? ¿Cuánto sube el p95?
- ¿La fase de recuperación vuelve al p95 de la base? Si no, el sistema arrastra cola.
- **Pregunta arquitectónica**: compara el p95 de `crear` en el pico con 0 y con 100 usuarios mirando el mapa.
  Explícalo con la captura de HikariCP: las consultas del mapa ocupan conexiones y las altas tienen que esperar.

### Experimento 4: lectura/escritura y volumen de datos

- **4a**: tabla `solo-lectura` / `solo-escritura` / `mixto` por operación. ¿Cuánto empeoran las lecturas cuando
  hay escrituras a la vez, y al revés? ¿Qué operación es la más costosa?
- **4b**: una tabla por consulta con el p95 en cada volumen (1k/10k/100k/1M), con y sin índices, y una gráfica
  de p95 frente a nº de incidencias con dos líneas (con y sin índices). Para las estadísticas agregadas usa
  los ficheros `agregadas-<n>-indices-<si|no>.txt` (líneas `Execution Time`).
  - **¿Mejorar el esquema aumenta la capacidad sin añadir instancias?** Compara la `pagina_profunda`, el
    `filtro_combinado` y el `detalle` con 100k/1M incidencias, con y sin índices.
  - Ojo: la `pagina_profunda` usa OFFSET y sigue siendo lenta incluso con índices.

### Cómo se realizaron las pruebas (apartado final del enunciado)

1. **Datos representativos y entorno estabilizado**: `data.sql` (o el volumen sintético del 4b), la API
   reiniciada antes de cada experimento y 30 s de calentamiento.
2. **Tres repeticiones** por configuración, con 30 s de enfriamiento entre ellas.
3. **Variabilidad**: la columna «± desviación típica» de `resumen.md` y las gráficas PNG, que muestran los
   puntos de cada repetición.
4. **`dropped_iterations`**: explícalo con el apartado del [README](README.md#dropped_iterations) e indica
   en qué experimentos apareció (exp2b, exp2c, exp3, exp4a) y a partir de qué tasa.

## Paso 9. Guardar los resultados

`perf/resultados/` no se sube a Git. Comprímelo y pásalo al otro equipo o adjúntalo a la entrega:

```bash
tar czf resultados-k6.tgz perf/resultados
```

Al terminar, para liberar recursos:

```bash
docker compose -f perf/observabilidad/compose.yaml down && docker compose down
```
