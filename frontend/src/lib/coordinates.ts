/**
 * Decimales que admite la API para latitud y longitud: NUMERIC(9,6) en la base de datos y
 * @Digits(fraction = 6) en CreateIncidentRequest (ADR-010). Seis decimales son unos 10 cm.
 */
export const COORDINATE_DECIMALS = 6;

const FACTOR = 10 ** COORDINATE_DECIMALS;

/**
 * Redondea una coordenada a los decimales que acepta la API.
 * El GPS del dispositivo devuelve muchos más (p. ej. 36.7212748123456) y la API los rechaza con 400 (#47).
 */
export function roundCoordinate(value: number): number {
  return Math.round(value * FACTOR) / FACTOR;
}
