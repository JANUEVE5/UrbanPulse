# ADR-005: Cliente multiplataforma con Expo y React Native

## Estado

Accepted

## Contexto

La ciudadanía necesita reportar incidencias desde el móvil, en la calle, aportando su ubicación y fotografías
(RF03, RF04, RF05). El personal municipal trabaja sobre todo desde el ordenador, con listados, filtros y mapa
(RF07, RF08). El equipo es pequeño y no puede mantener varias bases de código cliente.

## Opciones consideradas

1. Aplicaciones nativas separadas (Kotlin para Android y Swift para iOS) más una web aparte.
2. Aplicación web SPA (React) responsive, sin app móvil.
3. Expo + React Native + TypeScript: una sola base de código para Android, iOS y web.

## Decisión

Utilizar Expo con React Native y TypeScript, con Expo Router para la navegación, `react-native-maps` para los
mapas y `expo-location` para la geolocalización.

## Consecuencias

+ Una sola base de código para móvil y web.
+ Acceso a GPS y cámara del dispositivo, necesarios para RF04 y RF05.
+ Pruebas rápidas en dispositivos reales con Expo Go, sin compilar binarios nativos.
- Expo publica cambios incompatibles en cada versión del SDK y hay que actualizar con cuidado.
- Algunos componentes, como el mapa, necesitan una implementación distinta en web (`.web.tsx`).
- Las librerías con código nativo fuera de Expo Go exigen *development builds*.
