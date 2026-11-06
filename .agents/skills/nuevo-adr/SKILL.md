---
name: nuevo-adr
description: Registra una decisión de arquitectura de UrbanPulse como ADR en docs/adr/ con la estructura del proyecto (Estado, Contexto, Opciones consideradas, Decisión, Consecuencias) y actualiza el índice y el modelo C4. Úsala cuando se introduzca o cambie una tecnología, un componente, un patrón o una decisión estructural, o cuando pidan "crear/añadir/escribir un ADR".
---

# Crear un ADR en UrbanPulse

## Pasos

1. **Rama**: si no estás ya en una rama de trabajo, crea `docs/adr-<tema>` desde `main` actualizada.
   Nunca trabajes en `main`.
2. **Número**: busca el mayor `NNN` en `docs/adr/` y suma 1. Los números no se reutilizan nunca.
3. **Fichero**: crea `docs/adr/NNN-titulo-en-kebab-case.md` a partir de `docs/adr/template.md`.
4. **Contenido**, con la estructura exacta y en este orden:

   ```markdown
   # ADR-NNN: Título

   ## Estado

   Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-NNN

   ## Contexto

   Problema observable, requisitos (RFxx), atributos de calidad, restricciones y datos medidos.

   ## Opciones consideradas

   1. Opción A.
   2. Opción B.

   ## Decisión

   Una o dos frases: «Utilizar X mediante Y».

   ## Consecuencias

   + Efecto positivo.
   - Coste o riesgo asumido.
   ```

   - Considera al menos dos opciones reales, incluida «no hacer nada / mantener lo actual» cuando aplique.
   - Las consecuencias deben ser concretas y equilibradas: siempre hay al menos un `-`.
   - Justifica la decisión con las pautas del proyecto: la solución más sencilla, que los datos externos
     nunca bloqueen y que el ciclo de vida sea auditable.
5. **Sustitución**: si reemplaza a un ADR anterior, no reescribas el antiguo. Cambia solo su estado a
   `Superseded by ADR-NNN`.
6. **Índice**: añade una fila a la tabla de `docs/adr/README.md`.
7. **C4**: si la decisión cambia contenedores, componentes o el modelo de dominio, actualiza el diagrama
   correspondiente de `docs/architecture.md` y enlaza el ADR.
8. **Commit**: `docs(adr): añadir ADR-NNN sobre <tema>`. Si el cambio es solo documental, abre el PR con
   el tipo «Documentación».

## Comprobación final

- [ ] El nombre de fichero, el título y el número coinciden.
- [ ] Las cinco secciones están presentes y en orden.
- [ ] Índice y `architecture.md` actualizados.
