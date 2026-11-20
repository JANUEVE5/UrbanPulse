# Tutorial: ejecutar la práctica de k6 y rellenar el enunciado

Pasos en orden. Con el modo por defecto (`rapido`), todos los experimentos tardan **~1 hora** en total.
Los detalles de cada script están en [README.md](README.md).

---

## Paso 0. Instalar k6 (una sola vez)

En Arch:

```bash
yay -S k6-bin
```

Otros sistemas: <https://grafana.com/docs/k6/latest/set-up/install-k6/>. Comprueba con `k6 version`.
También hace falta Java 17, Python 3 (`pip install matplotlib` para las gráficas, opcional) e internet
(k6 descarga una librería de `jslib.k6.io`).

## Paso 1. Ponerse en la rama

```bash
git fetch && git switch feature/pruebas-carga-observabilidad && git pull
```

(Cuando el PR esté fusionado, basta con `main`.)

## Paso 2. Base de datos

**Opción A: PostgreSQL instalado en el equipo** (el que ya usáis para desarrollar, en el puerto 5432). No
hay que levantar nada más. Los scripts se conectan a ella para borrar entre repeticiones las incidencias
que crean las pruebas y, en el experimento 4, para cargar volúmenes de datos. Exporta esto **en la misma
terminal** desde la que vayas a lanzar los experimentos:

```bash
export PSQL="psql -h localhost -U postgres -d urbanpulse" PGPASSWORD=1234
```

(Usa el usuario y la contraseña de tu `.env` si no son los de desarrollo por defecto.)

**Opción B: PostgreSQL en Docker** (`cp .env.example .env` y `docker compose up -d`). Solo si el puerto 5432
está libre; no hace falta exportar `PSQL`.

## Paso 3. Prometheus y Grafana (opcional pero recomendado)

Si tienes Docker funcionando:

```bash
docker compose -f perf/observabilidad/compose.yaml up -d
```

- Prometheus: <http://localhost:9090/targets> → `urbanpulse-api` en verde cuando la API esté arrancada.
- Grafana: <http://localhost:3000> → panel **UrbanPulse — k6 + backend** (CPU, conexiones a PostgreSQL,
  hilos…).

Sin Docker las pruebas funcionan igual: se pierde el panel del backend, pero cada ejecución sigue generando
su `report.html` con las gráficas de k6.

## Paso 4. Arrancar la API

Compila una vez:

```bash
cd backend && ./mvnw -q package -DskipTests && cd ..
```

Arranca en una terminal aparte (se queda abierta):

```bash
java -jar backend/target/urbanpulse-0.0.1-SNAPSHOT.jar
```

Comprueba que <http://localhost:8080/actuator/health> devuelve `{"status":"UP"}`.

> **Reiniciar la API** = `Ctrl+C` y volver a lanzar el `java -jar`. Cada arranque recarga `data.sql`, así que
> cada experimento parte de los mismos datos.

## Paso 5. Preparar el equipo y anotar el entorno

Cierra programas pesados (deja solo la terminal y, si lo usas, Grafana) y deja el portátil enchufado.
Para el apartado «Entorno de pruebas» del informe:

```bash
lscpu | grep -E "Model name|^CPU\(s\)"; free -h | head -2; k6 version; java -version 2>&1 | head -1
```

## Paso 6. Prueba de humo (1 min)

```bash
./perf/experimentos.sh smoke
```

Todo debe salir en verde. Si algo falla, no sigas: revisa «Problemas habituales» en el
[README](README.md#4-problemas-habituales) o pasa la salida a quien mantenga los scripts.

## Paso 7. Experimentos (~1 h)

No hace falta reiniciar la API entre experimentos: antes de cada repetición se borran automáticamente las
incidencias creadas por k6. Solo hay que reiniciarla **después del experimento 4**, que sustituye los datos.

| Orden | Comando | Tiempo |
|---|---|---|
| 1 | `./perf/experimentos.sh exp1` | ~10 min |
| 2 | `./perf/experimentos.sh exp2` | ~18 min |
| 3 | `./perf/experimentos.sh exp3` | ~12 min |
| 4 | `./perf/experimentos.sh exp4` | ~30 min |

- Las cargas están calibradas para este PC (16 hilos, k6 y API en la misma máquina): la carga mixta aguanta
  ~2.500 peticiones/s y a 3.000/s empieza a descartar iteraciones. En un equipo más lento, bájalas, por ejemplo
  `EXP2_RATES="250 500 1000" EXP3_PEAK_RATE=1000 ./perf/experimentos.sh exp2`.
- Si algo se corta, relanza ese experimento: sus resultados se sobrescriben.

## Paso 8. Tablas y gráficas

```bash
python3 perf/analizar.py --graficas
```

- `perf/resultados/resumen.md`: tablas con p50, p95, p99, peticiones/s, errores y `dropped_iterations`
  (media ± desviación típica de las 3 repeticiones).
- `perf/resultados/datos.csv`: todas las repeticiones, para hojas de cálculo.
- `perf/resultados/<experimento>/<experimento>.png`: gráficas con barras de error.
- `perf/resultados/<experimento>/<config>/rep-N/report.html`: informe de k6 de cada ejecución (ábrelo en el
  navegador para hacer capturas).

Si usas Grafana, elige la ejecución en el desplegable **Prueba (testid)** (sale en la consola) y haz capturas
de los experimentos 2, 3 y 4.

## Paso 9. Rellenar el enunciado

### Experimento 1: ¿qué operaciones son más lentas?

Copia la tabla de `resumen.md` → `exp1-linea-base` (operación, p50, p95, p99, peticiones/s, errores) y
responde:

1. **Endpoint con mayor latencia**: el de mayor p95/p99. Lo esperable es `login`, por el coste de BCrypt.
2. **¿El más lento tiene el menor throughput?** Con 10 VUs sin pausas, throughput ≈ 10 / latencia media, así
   que debería coincidir. Comenta las excepciones.
3. **p50 frente a p99**: si la distancia es grande, hay colas, pausas de recolección de basura (GC) o bloqueos
   (las escrituras bloquean la fila con `SELECT … FOR UPDATE`).
4. **Qué optimizar primero**: la operación muy usada con peor p95 (listar/mapa), no solo la más lenta.

### Experimento 2: ¿cuál es la capacidad?

- **2a** (`vus-10` … `vus-200`): una tabla con p95, peticiones/s y errores por nivel. Señala dónde empieza a
  subir el p95 (degradación) y el primer nivel con p95 > 500 ms o errores > 1 % (incumple requisitos).
  Explica con estos datos la diferencia entre concurrencia (usuarios simultáneos), capacidad (peticiones/s
  máximas dentro del requisito) y escalabilidad (cómo crece la capacidad al añadir recursos).
- **2b** (`rate-1000/2000/3000`): la capacidad es la mayor tasa con p95 < 500 ms, errores < 1 % y
  `dropped_iterations = 0`.
- **2c** (`rampa`): una captura del `report.html` o de Grafana, indicando en qué escalón se satura.

### Experimento 3: emergencia urbana

En `resumen.md` → `exp3-pico-emergencia`, compara `scenario:base`, `scenario:pico` y
`scenario:recuperacion`, con `mapa-0` y con `mapa-200` (200 usuarios consultando el mapa sin pausa):

- ¿Hay errores o `dropped_iterations` en el pico? ¿Cuánto sube el p95?
- ¿La recuperación vuelve al p95 de la base?
- **Pregunta arquitectónica**: compara el p95 de `crear` en el pico sin y con usuarios mirando el mapa. Lo
  explica la competencia por el pool de conexiones a PostgreSQL (10 conexiones) y por los hilos (captura de
  HikariCP en Grafana, si la tienes).

### Experimento 4: operaciones costosas y volumen de datos

- **Lectura/escritura** (`exp4a`): compara cada operación en `solo-lectura`, `solo-escritura` y `mixto`. ¿Cuál
  empeora más al competir? ¿Cuál es la más costosa?
- **Volumen** (`exp4b`): una tabla o gráfica del p95 de cada consulta para 1k, 10k y 100k incidencias, con
  y sin índices. Para las estadísticas agregadas, usa las líneas `Execution Time` de
  `resultados/exp4b-volumen-datos/agregadas-<n>-indices-<si|no>.txt`.
- **¿Mejorar el esquema aumenta la capacidad sin más instancias de Spring Boot?** Compara `indices-no` con
  `indices-si` a 100k. La página profunda usa OFFSET y apenas mejora con índices.

### ¿Cómo se realizaron las pruebas?

1. **Datos y entorno**: `data.sql` o el volumen sintético, la API reiniciada antes de cada experimento y
   15 s de calentamiento.
2. **Repeticiones**: 3 por configuración.
3. **Variabilidad**: la columna «± desviación típica» de `resumen.md` y las gráficas PNG, que muestran cada
   repetición.
4. **`dropped_iterations`**: explícala con el apartado del [README](README.md#dropped_iterations) e indica en
   qué experimentos apareció (2b, 2c, 3, 4a) y a partir de qué tasa.

## Paso 10. Guardar y limpiar

```bash
tar czf resultados-k6.tgz perf/resultados
```

```bash
docker compose -f perf/observabilidad/compose.yaml down
```

Reinicia la API al terminar para volver a los datos de `data.sql`.
