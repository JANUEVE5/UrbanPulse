# ADR-014: Mostrar incidencias según el rol autenticado

## Estado

Accepted

## Contexto

RF06 requiere que la ciudadanía consulte sus propios reportes, mientras que los roles municipales necesitan
visibilidad global para gestionar incidencias. ADR-013 limitó el listado a las incidencias del usuario para
cualquier rol, lo que impedía a operadores, técnicos, administración y analistas consultar el conjunto.
El JWT ya identifica al usuario y contiene su rol (ADR-009); la incidencia persiste su creador en `id_creador`.

## Opciones consideradas

1. Mantener el filtro por creador para todos los roles.
2. Devolver las incidencias propias a `CITIZEN` y todas las incidencias al resto de roles autenticados.
3. Implementar permisos de consulta independientes para cada rol.

## Decisión

Aplicar en el servicio de incidencias una regla basada en el rol del JWT: `CITIZEN` consulta solo sus propias
incidencias y cualquier otro rol autenticado consulta todas. Mantener ambas rutas de listado bajo autenticación.

## Consecuencias

+ La ciudadanía mantiene la privacidad de sus reportes frente a otros ciudadanos.
+ El personal municipal dispone del conjunto de incidencias para sus tareas actuales.
+ Se reutilizan el JWT, el servicio y el repositorio existentes, sin añadir infraestructura.
- Los roles no ciudadanos tienen visibilidad global del listado; los permisos más específicos por operación
  quedan fuera de este alcance.