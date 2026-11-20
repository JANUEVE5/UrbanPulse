# Pruebas de carga y observabilidad (k6 + Prometheus + Grafana)

Paso a paso para el portátil de pruebas y cómo rellenar el informe: [TUTORIAL.md](TUTORIAL.md).

Scripts de la práctica «Atributos de calidad y observabilidad» ([ADR-018](../docs/adr/018-observabilidad-y-pruebas-de-carga.md)).
Están pensados para ejecutarse en un portátil dedicado: se clona el repositorio, se arranca todo y se lanza
cada experimento con un único comando.

```
perf/
├── experimentos.sh            # lanza la batería completa de un experimento (todas las configuraciones × 3)
├── run.sh                     # ejecuta UN script k6 N veces y guarda resultados por repetición
├── analizar.py                # tablas media ± desviación típica (resumen.md) y datos.csv
├── lib/common.js              # login, operaciones de la API, datos de prueba, umbrales, resumen JSON
├── lib/workload.js            # carga "mixta" para el experimento 2
├── experimentos/
│   ├── 00-smoke.js                 # prueba de humo (1 VU, todas las operaciones)
│   ├── exp1-linea-base.js          # Exp. 1: qué operaciones son más lentas
│   ├── exp2a-capacidad-vus.js      # Exp. 2: capacidad con 10/25/50/100 VUs (constant-vus)
│   ├── exp2b-tasa-constante.js     # Exp. 2: peticiones/s sostenibles (constant-arrival-rate)
│   ├── exp2c-tasa-creciente.js     # Exp. 2: rampa de tasa hasta saturar (ramping-arrival-rate)
│   ├── exp3-pico-emergencia.js     # Exp. 3: pico de incidencias por lluvias + usuarios mirando el mapa
│   ├── exp4a-lectura-escritura.js  # Exp. 4 (tabla): lecturas vs. escrituras concurrentes
│   └── exp4b-volumen-datos.js      # Exp. 4 (detalle): 1k/10k/100k/1M incidencias, con y sin índices
├── datos/                     # carga de volumen, índices candidatos y consultas agregadas en SQL
└── observabilidad/            # compose con Prometheus y Grafana + panel provisionado
```

## 1. Preparar el portátil de pruebas

Requisitos: Git, Docker con Compose, Java 17, [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)
(v1.x) y Python 3 (opcional `pip install matplotlib` para las gráficas).

```bash
git clone <repo> && cd UrbanPulse
cp .env.example .env
```

```bash
docker compose up -d
```

```bash
docker compose -f perf/observabilidad/compose.yaml up -d
```

```bash
cd backend && ./mvnw spring-boot:run
```

- Grafana: <http://localhost:3000> (anónimo de solo lectura; `admin`/`admin` para editar). Abre el panel
  **UrbanPulse — k6 + backend** y filtra por `testid` para ver una ejecución concreta.
- Prometheus: <http://localhost:9090> → *Status → Targets* debe mostrar `urbanpulse-api` en verde.
- Mejor arrancar la API con el jar para que la medida no incluya Maven:
  `./mvnw -q package -DskipTests && java -jar target/urbanpulse-*.jar`.
- Si k6 se ejecuta en **otra** máquina distinta de la API, exporta `BASE_URL=http://<ip-api>:8080`. Si
  Prometheus no corre junto a la API, cambia el target en `observabilidad/prometheus.yml`.

### Condiciones de medida (mismas en todos los experimentos)

1. Cierra navegadores y procesos pesados; deja el portátil enchufado y en modo rendimiento.
2. **Reinicia la API antes de cada experimento**: `schema.sql` y `data.sql` se recargan al arrancar, así
   todos parten de los mismos datos. (Excepción: el 4b carga sus propios datos *después* de arrancar.)
3. `experimentos.sh` hace un calentamiento corto (`WARMUP`, 15 s) antes de medir y deja un enfriamiento
   (`COOLDOWN`, 10 s) entre repeticiones. Cada configuración se repite 3 veces (`REPS`).
4. Anota el hardware (CPU, núcleos, RAM) y las versiones (`k6 version`, `java -version`) en el informe.

### Prueba de humo

```bash
./perf/experimentos.sh smoke
```

Debe acabar sin umbrales incumplidos. Si falla el login, revisa que la API esté arrancada con `data.sql`
(usuarios de prueba, contraseña de desarrollo `urbanpulse-dev`, configurable con `USER_PASSWORD`).

## 2. Experimentos

Todos los comandos se lanzan desde la raíz del repositorio. Hay dos modos:

| Modo | Uso | Tiempo total |
|---|---|---|
| `rapido` (por defecto) | Lo necesario para rellenar el enunciado: ejecuciones de 15 s–1 min, 3 repeticiones | **~1 h** |
| `completo` | Más operaciones, niveles y duraciones, y 1.000.000 de incidencias: `MODO=completo ./perf/experimentos.sh …` | ~7 h |

Los tiempos de cada apartado son los del modo rápido. Cualquier valor se cambia con variables de entorno
(ver la cabecera de `experimentos.sh`).

| Requisito de referencia | Valor |
|---|---|
| Latencia | p95 < 500 ms (`SLO_P95_MS`) |
| Errores | < 1 % (`SLO_ERROR_RATE`) |
| Comprobaciones (`checks`) | > 99 % |

### Experimento 1 — ¿Qué operaciones son más lentas? (~10 min)

```bash
./perf/experimentos.sh exp1
```

10 VUs durante 30 s por operación, sin tiempo de reflexión (`THINK_TIME=0`, así el throughput depende solo
de la latencia). Las 5 filas de la tabla del enunciado: `listar`, `detalle`, `crear`, `cambiar_estado` (cada
VU recorre su propia incidencia por transiciones válidas) y `login` (BCrypt). También existen `mapa`,
`listar_filtrado`, `cambiar_prioridad`, `comentar` y `activos_cercanos`:
`EXP1_OPS="mapa comentar" ./perf/experimentos.sh exp1`.

Rellena la tabla del enunciado con `resumen.md` (p50, p95, p99, peticiones/s, errores) y responde:
endpoint más lento, si coincide con el de menor throughput, diferencia p50–p99 y qué optimizar primero.

### Experimento 2 — ¿Cuál es la capacidad del sistema? (~17 min)

```bash
./perf/experimentos.sh exp2
```

O por partes:

```bash
./perf/experimentos.sh exp2a
```

```bash
./perf/experimentos.sh exp2b
```

```bash
./perf/experimentos.sh exp2c
```

- **2a (`constant-vus`)**: 10, 25, 50 y 100 VUs (`EXP2_VUS`), 30 s cada uno. Modelo cerrado: más VUs no implica más
  peticiones si la API se satura. Busca el nivel donde el p95 supera 500 ms o el throughput deja de crecer.
- **2b (`constant-arrival-rate`)**: 25, 50 y 100 iteraciones/s (`EXP2_RATES`), 30 s cada una. Modelo abierto: k6
  inicia iteraciones al ritmo pedido aunque la API vaya lenta. La capacidad es la mayor tasa con p95 < 500 ms,
  errores < 1 % y `dropped_iterations = 0`.
- **2c (`ramping-arrival-rate`)**: escalones de 10 a 200 it/s de 20 s (`EXP2C_RATES`, `EXP2C_STEP`) en una
  sola ejecución exploratoria (sin repeticiones); se analiza sobre todo en Grafana (latencia y conexiones de HikariCP frente al tiempo).
- Por defecto la carga es una mezcla realista (`EXP2_OP=mixto`: 35 % mapa, 20 % listado, 20 % detalle,
  15 % altas, 10 % cambios). Para una sola operación: `EXP2_OP=listar`.
- Ajusta los niveles a tu hardware: si con 100 VUs todo va sobrado, añade 200/400; si ya falla con 25, baja.

### Experimento 3 — ¿Qué ocurre durante una emergencia urbana? (~12 min)

```bash
./perf/experimentos.sh exp3
```

Lluvias intensas: altas de incidencias a 2/s durante 30 s (`base`), 40/s durante 30 s (`pico`) y 2/s
durante 1 min (`recuperacion`). Se ejecuta sin y con 50 usuarios consultando el mapa a la vez
(`EXP3_MAP_VUS="0 50"`). El resumen separa latencia y errores por fase (`scenario:base|pico|recuperacion`).

Compara: errores y p95 en el pico, si la fase de recuperación vuelve a los valores de la base y, para la
pregunta arquitectónica, cómo cambia la latencia de `crear` en el pico con 0 vs. 50 usuarios en el mapa
(en Grafana: conexiones de HikariCP activas/en espera, hilos de Tomcat y CPU).
Ajusta el pico con `PEAK_RATE` si tu equipo lo absorbe sin despeinarse.

### Experimento 4 — lectura/escritura y volumen de datos (~30 min)

```bash
./perf/experimentos.sh exp4
```

Ejecuta el 4a y el 4b seguidos. Por partes:

#### 4a — Lecturas frente a escrituras (~5 min)

```bash
./perf/experimentos.sh exp4a
```

Tres ejecuciones de 30 s con tasas fijas: solo lectura (50/s), solo escritura (10 altas/s + 10 cambios/s) y
mixto (todo a la vez). Compara la latencia de cada operación sola y en competencia. Las modificaciones
bloquean la fila (`findByIdForUpdate`) e insertan en `StatusChange`/`IncidentComment`.

#### 4b — ¿Cómo influye el volumen de datos? (~25 min)

```bash
./perf/experimentos.sh exp4b
```

Para cada volumen (`EXP4B_VOLUMES`, por defecto 1.000, 10.000 y 100.000): carga las incidencias sintéticas,
mide sin índices, crea los índices candidatos (`datos/indices.sql`), vuelve a medir y los quita.
Consultas (15 s cada una): primera página ordenada por fecha, página profunda (paginación), filtro por estado
y filtro combinado. En `MODO=completo` se añaden orden ascendente, listado de un ciudadano, detalle y
1.000.000 de incidencias. Las estadísticas agregadas (RF15 aún no tiene endpoint) se miden en SQL
con `EXPLAIN ANALYZE` y quedan en `resultados/exp4b-volumen-datos/agregadas-<n>-indices-<si|no>.txt`.

- Necesita acceso a la base de datos: por defecto usa `docker compose exec postgres psql`. Con otro
  PostgreSQL: `PSQL="psql -h host -U usuario -d urbanpulse" PGPASSWORD=... ./perf/experimentos.sh exp4b`.
- No reinicies la API durante el 4b (borraría los datos cargados). Al terminar, reiníciala para volver a
  `data.sql`.

Pregunta del enunciado: ¿mejorar el esquema de PostgreSQL aumenta la capacidad sin añadir instancias de Spring
Boot? Compara `n-<N>-indices-no` con `n-<N>-indices-si` para cada consulta.

### Todo seguido (~1 h)

```bash
./perf/experimentos.sh todo
```

Mejor por partes, reiniciando la API entre experimentos.

## 3. Resultados y análisis

Cada repetición deja en `perf/resultados/<script>/<configuración>/rep-<n>/`:

- `summary.json`: métricas de k6 (incluye p50/p95/p99, peticiones y errores por `endpoint` y `scenario`).
- `report.html`: informe del web dashboard de k6 (gráficas de la ejecución; se abre en el navegador).
- `k6.log`: salida por consola. `exit-code`: 0 = umbrales cumplidos, 99 = algún umbral incumplido.

```bash
python3 perf/analizar.py --graficas
```

Genera `perf/resultados/resumen.md` (tablas con media ± desviación típica de las 3 repeticiones),
`perf/resultados/datos.csv` (todas las repeticiones, para hojas de cálculo) y un PNG por experimento con
barras de error y los puntos de cada repetición (variabilidad). `perf/resultados/` no se versiona: copia la
carpeta al informe o súbela aparte.

Para cada ejecución, Grafana conserva las series 30 días: elige su `testid` (aparece en la consola) y haz
capturas del panel para el informe.

### `dropped_iterations`

Solo aparece con los ejecutores de tasa (`constant-arrival-rate`, `ramping-arrival-rate`). k6 intenta iniciar
iteraciones al ritmo indicado; si todas las VUs están ocupadas esperando respuestas y ya se alcanzó `maxVUs`,
la iteración no llega a empezar y se cuenta como descartada. Indica que **el sistema no sostiene la tasa
pedida**: la latencia ha crecido tanto que hacen falta más VUs de las disponibles (Ley de Little:
VUs necesarias ≈ tasa × duración de la iteración). Si aparece con latencias bajas, el límite está en el
generador de carga (sube `MAX_VUS`) y no en la API. Por eso un modelo cerrado (`constant-vus`) nunca la
muestra: allí la saturación se ve como throughput que deja de crecer.

## 4. Problemas habituales

| Síntoma | Causa probable |
|---|---|
| `La API no responde en …/actuator/health` | Backend parado o `BASE_URL` incorrecta. |
| Login 401 | La base de datos no tiene `data.sql` (reinicia la API) o la contraseña no es la de desarrollo. |
| Target `urbanpulse-api` en rojo en Prometheus | API en otro puerto/máquina: edita `observabilidad/prometheus.yml` y `docker compose … restart prometheus`. |
| Paneles de k6 vacíos en Grafana | Prometheus no estaba levantado al lanzar `run.sh` (se detecta solo); fuerza con `PROMETHEUS=si`. |
| Muchos `dropped_iterations` con latencia baja | Pocas VUs para la tasa: sube `MAX_VUS`/`PRE_VUS`. |
| Errores de conexión del propio k6 | Límite de descriptores: `ulimit -n 65535` antes de lanzar. |
| Token caducado en pruebas largas | Los tokens duran `JWT_EXPIRATION_MINUTES` (60); cada ejecución de k6 vuelve a hacer login. |
