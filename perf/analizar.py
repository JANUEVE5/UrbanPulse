#!/usr/bin/env python3
"""Resume los resultados de k6 guardados por run.sh, con la variabilidad entre repeticiones.

    python3 perf/analizar.py                      # todos los experimentos de perf/resultados
    python3 perf/analizar.py exp1-linea-base      # solo uno
    python3 perf/analizar.py --graficas           # además, PNG con barras de error (requiere matplotlib)

Genera en perf/resultados/:
  - resumen.md   tablas p50/p95/p99, peticiones/s, errores y dropped_iterations (media ± desviación típica)
  - datos.csv    una fila por experimento/configuración/grupo/repetición (para hojas de cálculo o gráficas)
"""
import csv
import json
import re
import statistics
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "resultados"
SUB = re.compile(r"^(http_req_duration|http_reqs|http_req_failed|dropped_iterations)\{(endpoint|scenario):([^}]+)\}$")


def load(summary_path):
    data = json.loads(summary_path.read_text(encoding="utf-8"))
    meta = data.get("meta", {})
    metrics = data.get("metrics", {})
    durations = meta.get("durations", {})
    test_seconds = data.get("state", {}).get("testRunDurationMs", 0) / 1000 or None

    groups = defaultdict(dict)
    for name, metric in metrics.items():
        m = SUB.match(name)
        if not m:
            continue
        base, kind, value = m.groups()
        if value == "setup":
            continue
        groups[(kind, value)][base] = metric.get("values", {})

    rows = []
    for (kind, value), g in groups.items():
        dur = g.get("http_req_duration")
        if not dur:
            continue
        reqs = g.get("http_reqs", {})
        count = reqs.get("count", 0)
        if not count:
            continue  # endpoint o escenario sin peticiones en esta ejecución (p. ej. MAP_VUS=0)
        seconds = durations.get(value)
        rps = count / seconds if seconds else reqs.get("rate", count / test_seconds if test_seconds else 0)
        rows.append({
            "grupo": f"{kind}:{value}",
            "p50": dur.get("med"),
            "p95": dur.get("p(95)"),
            "p99": dur.get("p(99)"),
            "max": dur.get("max"),
            "rps": rps,
            "peticiones": count,
            "errores_pct": 100 * g.get("http_req_failed", {}).get("rate", 0),
            "dropped": g.get("dropped_iterations", {}).get("count", 0),
        })

    total_dropped = metrics.get("dropped_iterations", {}).get("values", {}).get("count", 0)
    return rows, total_dropped


def fmt(values, decimals=1):
    values = [v for v in values if v is not None]
    if not values:
        return "—"
    mean = statistics.mean(values)
    if len(values) < 2:
        return f"{mean:.{decimals}f}"
    return f"{mean:.{decimals}f} ± {statistics.stdev(values):.{decimals}f}"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    plots = "--graficas" in sys.argv
    if not ROOT.exists():
        sys.exit(f"No hay resultados en {ROOT}. Ejecuta antes run.sh o experimentos.sh.")

    experiments = sorted(p for p in ROOT.iterdir() if p.is_dir() and (not args or p.name in args))
    all_rows = []
    md = ["# Resumen de resultados k6", "",
          "Latencias en ms. Cada celda: media ± desviación típica entre repeticiones (n = nº de repeticiones).", ""]

    for exp in experiments:
        table = defaultdict(list)  # (label, grupo) -> [row por repetición]
        dropped_by_label = defaultdict(list)
        for summary in sorted(exp.glob("*/rep-*/summary.json")):
            label = summary.parent.parent.name
            rep = summary.parent.name
            rows, dropped = load(summary)
            dropped_by_label[label].append(dropped)
            for r in rows:
                table[(label, r["grupo"])].append(r)
                all_rows.append({"experimento": exp.name, "configuracion": label, "repeticion": rep, **r})
        if not table:
            continue

        md += [f"## {exp.name}", "",
               "| Configuración | Grupo | n | p50 | p95 | p99 | Peticiones/s | Errores % | dropped_iterations |",
               "|---|---|---|---|---|---|---|---|---|"]
        for (label, grupo), reps in sorted(table.items()):
            md.append("| {} | {} | {} | {} | {} | {} | {} | {} | {} |".format(
                label, grupo, len(reps),
                fmt([r["p50"] for r in reps]), fmt([r["p95"] for r in reps]), fmt([r["p99"] for r in reps]),
                fmt([r["rps"] for r in reps]), fmt([r["errores_pct"] for r in reps], 2),
                fmt([r["dropped"] for r in reps], 0)))
        md += ["", "dropped_iterations totales por configuración: " + ", ".join(
            f"{label}: {fmt(v, 0)}" for label, v in sorted(dropped_by_label.items())), ""]

        if plots:
            plot(exp, table)

    (ROOT / "resumen.md").write_text("\n".join(md), encoding="utf-8")
    if all_rows:
        with open(ROOT / "datos.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(all_rows[0].keys()))
            w.writeheader()
            w.writerows(all_rows)
    print("\n".join(md))
    print(f"\n→ {ROOT / 'resumen.md'}\n→ {ROOT / 'datos.csv'}")


def plot(exp, table):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib no está instalado: omito las gráficas (pip install matplotlib).", file=sys.stderr)
        return
    keys = sorted(table)
    names = [f"{label}\n{grupo.split(':', 1)[1]}" for label, grupo in keys]
    fig, axes = plt.subplots(1, 2, figsize=(max(8, len(keys) * 0.9), 5))
    for ax, field, title in ((axes[0], "p95", "Latencia p95 (ms)"), (axes[1], "rps", "Peticiones/s")):
        vals = [[r[field] or 0 for r in table[k]] for k in keys]
        means = [statistics.mean(v) for v in vals]
        errs = [statistics.stdev(v) if len(v) > 1 else 0 for v in vals]
        ax.bar(range(len(keys)), means, yerr=errs, capsize=4)
        for i, v in enumerate(vals):
            ax.scatter([i] * len(v), v, color="black", s=8, zorder=3)
        ax.set_xticks(range(len(keys)), names, rotation=60, ha="right", fontsize=8)
        ax.set_title(f"{exp.name} — {title}")
    fig.tight_layout()
    out = exp / f"{exp.name}.png"
    fig.savefig(out, dpi=120)
    plt.close(fig)
    print(f"→ {out}")


if __name__ == "__main__":
    main()
