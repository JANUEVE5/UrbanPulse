# Requisitos de UrbanPulse

Especificación de los requisitos funcionales, con su priorización **MoSCoW** y el alcance de cada sprint.

- **Este documento** es la referencia estable: qué debe hacer el sistema y con qué prioridad.
- **Los issues de GitHub** son el trabajo: cada requisito tiene un issue con sus criterios de aceptación,
  etiquetas `moscow: …` y, si entra en un sprint, su milestone. Los PR que lo implementan lo cierran con
  `Closes #N`.

> Para pedir trabajo a un agente de IA, referencia el issue: «implementa el issue #14 siguiendo AGENTS.md».

## Actores

| Actor | Responsabilidades | Necesidades |
|---|---|---|
| Ciudadano | Registra incidencias, aporta ubicación y evidencias, consulta el estado. | Interfaz sencilla, confirmación, privacidad y seguimiento. |
| Operador municipal | Valida, rechaza, clasifica, prioriza y asigna. | Contexto fiable, historial, búsqueda y trazabilidad. |
| Técnico | Acepta trabajos, actualiza el progreso y documenta la resolución. | Cola de trabajo y seguimiento del progreso. |
| Administrador | Gestiona usuarios, roles, categorías, departamentos y fuentes. | Configuración segura, auditoría y control de acceso. |
| Analista | Explora indicadores, patrones espaciales y resultados de modelos. | Datos consistentes, exportación, métricas y explicabilidad. |
| Sistema externo | Proporciona datos urbanos, meteorológicos, territoriales o documentales. | — |

## Requisitos funcionales

| ID | Requisito | Definición | MoSCoW | ADR | Issue |
|---|---|---|---|---|---|
| RF01 | Identidad y acceso | El sistema permitirá registro o acceso de usuarios y autenticación de personal autorizado. | Must | [009](adr/009-autenticacion-autorizacion-jwt.md) | [#11](https://github.com/JANUEVE5/UrbanPulse/issues/11) |
| RF02 | Roles y permisos | El sistema aplicará permisos diferenciados para ciudadanía, operadores, técnicos, administración y analistas. | Must | [009](adr/009-autenticacion-autorizacion-jwt.md) | [#12](https://github.com/JANUEVE5/UrbanPulse/issues/12) |
| RF03 | Registrar incidencia | El ciudadano podrá registrar una incidencia con título, descripción, posición y categoría opcional. | Must | [005](adr/005-cliente-multiplataforma-expo.md) | [#13](https://github.com/JANUEVE5/UrbanPulse/issues/13) |
| RF04 | Localización | La incidencia conservará coordenadas, dirección normalizada y precisión de la localización. | Must | [010](adr/010-representacion-localizacion.md) | [#14](https://github.com/JANUEVE5/UrbanPulse/issues/14) |
| RF05 | Evidencias | Se podrán adjuntar fotografías u otros ficheros con validación de tipo y tamaño. | Should | [003](adr/003-object-storage-evidencias.md) | [#15](https://github.com/JANUEVE5/UrbanPulse/issues/15) |
| RF06 | Consulta y seguimiento | El usuario podrá consultar detalle, estado, fechas e historial visible de sus incidencias. | Must | [011](adr/011-convenciones-api-rest.md) | [#16](https://github.com/JANUEVE5/UrbanPulse/issues/16) |
| RF07 | Búsqueda | El personal podrá buscar y filtrar por estado, categoría, fecha, prioridad, distrito y departamento. | Must | [011](adr/011-convenciones-api-rest.md) | [#17](https://github.com/JANUEVE5/UrbanPulse/issues/17) |
| RF08 | Mapa | El sistema mostrará incidencias y capas urbanas relevantes en un mapa. | Should | [005](adr/005-cliente-multiplataforma-expo.md), [010](adr/010-representacion-localizacion.md) | [#18](https://github.com/JANUEVE5/UrbanPulse/issues/18) |
| RF09 | Validación | Un operador podrá validar, solicitar información o rechazar un reporte dejando motivo. | Must | [008](adr/008-ciclo-vida-maquina-estados.md) | [#19](https://github.com/JANUEVE5/UrbanPulse/issues/19) |
| RF10 | Prioridad | El sistema permitirá establecer prioridad manual o asistida y conservar su justificación. | Should | — | [#20](https://github.com/JANUEVE5/UrbanPulse/issues/20) |
| RF11 | Asignación | Una incidencia validada podrá asignarse a un departamento, equipo o técnico. | Must | [008](adr/008-ciclo-vida-maquina-estados.md) | [#21](https://github.com/JANUEVE5/UrbanPulse/issues/21) |
| RF12 | Ciclo de vida | Los cambios de estado respetarán transiciones permitidas y quedarán auditados. | Must | [008](adr/008-ciclo-vida-maquina-estados.md) | [#22](https://github.com/JANUEVE5/UrbanPulse/issues/22) |
| RF13 | Colaboración | Operadores y técnicos podrán añadir comentarios, evidencias y datos de resolución. | Should | — | [#23](https://github.com/JANUEVE5/UrbanPulse/issues/23) |
| RF14 | Notificaciones | El sistema notificará cambios relevantes mediante canales configurables. | Should | — | [#24](https://github.com/JANUEVE5/UrbanPulse/issues/24) |
| RF15 | Estadísticas | Se calcularán indicadores por categoría, territorio, estado y tiempo de resolución. | Should | — | [#25](https://github.com/JANUEVE5/UrbanPulse/issues/25) |
| RF16 | Duplicados | El sistema podrá sugerir incidencias similares por proximidad, tiempo y semántica. | Could | [010](adr/010-representacion-localizacion.md) | [#26](https://github.com/JANUEVE5/UrbanPulse/issues/26) |
| RF17 | Análisis zonal | Se podrán consultar incidencias y contexto agregado para una zona y periodo. | Could | [010](adr/010-representacion-localizacion.md) | [#27](https://github.com/JANUEVE5/UrbanPulse/issues/27) |
| RF18 | Auditoría | Se registrarán acciones administrativas, decisiones asistidas y cambios relevantes. | Must | [002](adr/002-postgresql-persistencia-principal.md), [008](adr/008-ciclo-vida-maquina-estados.md) | [#28](https://github.com/JANUEVE5/UrbanPulse/issues/28) |
| RF19 | Informes | El sistema generará informes operativos y territoriales exportables. | Could | — | [#29](https://github.com/JANUEVE5/UrbanPulse/issues/29) |
| RF20 | Asistencia inteligente | La plataforma podrá clasificar, priorizar, resumir y recomendar con indicación de confianza. | Won't (por ahora) | — | — |
| RF21 | Barrio y distrito | El sistema identificará barrio y distrito a partir de la localización. | Should | [004](adr/004-degradacion-controlada-api-externa.md), [010](adr/010-representacion-localizacion.md) | [#30](https://github.com/JANUEVE5/UrbanPulse/issues/30) |
| RF22 | Activo urbano | El sistema podrá asociar una incidencia a un activo urbano próximo. | Could | [004](adr/004-degradacion-controlada-api-externa.md) | [#31](https://github.com/JANUEVE5/UrbanPulse/issues/31) |
| RF23 | Contexto externo | El sistema podrá obtener información contextual de fuentes externas. | Could | [004](adr/004-degradacion-controlada-api-externa.md) | [#32](https://github.com/JANUEVE5/UrbanPulse/issues/32) |
| RF24 | Vista contextual | El operador podrá visualizar el contexto urbano asociado. | Could | [004](adr/004-degradacion-controlada-api-externa.md) | [#33](https://github.com/JANUEVE5/UrbanPulse/issues/33) |
| RF25 | Correlación histórica | El sistema podrá correlacionar incidencias con variables urbanas históricas. | Won't (por ahora) | — | — |
| RF26 | Degradación controlada | La falta de disponibilidad de una fuente externa no impedirá crear la incidencia. | Must | [004](adr/004-degradacion-controlada-api-externa.md) | [#34](https://github.com/JANUEVE5/UrbanPulse/issues/34) |

## Justificación de la priorización (MoSCoW)

| ID | Prioridad | Justificación |
|---|---|---|
| RF01 | Must | Necesario para identificar a los usuarios y proteger el acceso del personal. |
| RF02 | Must | Las acciones disponibles dependen del tipo de usuario; es esencial para controlar el acceso. |
| RF03 | Must | Es la función central de la plataforma. |
| RF04 | Must | La posición es esencial para gestionar territorialmente una incidencia. |
| RF05 | Should | Aporta información útil para validar y resolver reportes, aunque puede aplazarse en una primera entrega. |
| RF06 | Must | Permite que la ciudadanía consulte el estado y que el servicio sea trazable. |
| RF07 | Must | El personal necesita localizar y filtrar incidencias para su trabajo diario. |
| RF08 | Should | Facilita la comprensión espacial, pero la gestión básica puede iniciarse con listas y filtros. |
| RF09 | Must | Permite revisar reportes antes de incorporarlos al flujo de trabajo municipal. |
| RF10 | Should | La priorización es importante para organizar el trabajo; inicialmente puede hacerse de forma manual. |
| RF11 | Must | Es necesaria para dirigir las incidencias validadas a quienes deben resolverlas. |
| RF12 | Must | Define transiciones válidas y conserva el historial de cambios. |
| RF13 | Should | Mejora la coordinación y documentación durante la resolución, pero puede evolucionar tras el flujo básico. |
| RF14 | Should | Mejoran el seguimiento y la comunicación, aunque no son imprescindibles para procesar una incidencia. |
| RF15 | Should | Ayudan a supervisar el servicio y sus resultados, pero dependen de contar primero con datos consistentes. |
| RF16 | Could | Es una ayuda útil, pero la plataforma puede operar inicialmente con revisión manual. |
| RF17 | Could | Aporta valor analítico, aunque no es necesario para el registro y la resolución iniciales. |
| RF18 | Must | Es esencial para la trazabilidad de decisiones y cambios relevantes. |
| RF19 | Could | Resultan útiles para la explotación operativa y territorial, pero pueden añadirse después de las estadísticas básicas. |
| RF20 | Won't | La clasificación, priorización y recomendación automatizadas requieren datos, evaluación y controles que conviene incorporar gradualmente. |
| RF21 | Should | Enriquece la incidencia y facilita su gestión territorial; puede añadirse después de asegurar el almacenamiento de coordenadas. |
| RF22 | Could | La asociación con activos es valiosa, pero depende de disponer de datos urbanos adecuados y de validar las correspondencias. |
| RF23 | Could | Enriquece los reportes, pero el sistema debe poder funcionar sin estas fuentes. |
| RF24 | Could | Depende de que exista contexto externo integrado; no es imprescindible para el flujo básico. |
| RF25 | Won't | Requiere datos históricos suficientes y capacidades analíticas que exceden una primera versión. |
| RF26 | Must | Asegura que la creación de incidencias no dependa de la disponibilidad de servicios externos. |

Los requisitos *Won't have for now* (RF20, RF25) no tienen issue. Se abrirán si el equipo decide incorporarlos.

## Sprint 1 — Alcance

Milestone [Sprint 1](https://github.com/JANUEVE5/UrbanPulse/milestone/1). Objetivo: un prototipo entregable
al final del sprint.

| Requisito | Versión mínima del sprint | Issue |
|---|---|---|
| RF03 — Registrar incidencia | Crear una incidencia con título, descripción y categoría opcional. | [#13](https://github.com/JANUEVE5/UrbanPulse/issues/13) |
| RF04 — Localización | Guardar latitud y longitud. Dirección normalizada y precisión, en otro sprint. | [#14](https://github.com/JANUEVE5/UrbanPulse/issues/14) |
| RF12 — Ciclo de vida | Asignar el estado inicial `REPORTED` y guardar la fecha de creación. Sin todas las transiciones. | [#22](https://github.com/JANUEVE5/UrbanPulse/issues/22) |
| RF06 — Consulta | Obtener el detalle de una incidencia por su identificador. Seguimiento completo e historial visible, más adelante. | [#16](https://github.com/JANUEVE5/UrbanPulse/issues/16) |

**Reparto de tareas:** una persona se ocupa del modelo y la persistencia; otra, del endpoint de creación;
otra, de la consulta y las validaciones; otra, de las pruebas; y la quinta coordina la integración, la
documentación y la demo.
