# UrbanPulse — Frontend

Aplicación cliente de UrbanPulse construida con **Expo + React Native + TypeScript** (Expo Router), para
Android, iOS y web.

```bash
npm install
npx expo start          # w = web · a = Android · QR = Expo Go
npx tsc --noEmit        # comprobación de tipos
npx expo lint           # linter
```

La URL de la API se configura con `EXPO_PUBLIC_API_URL` (ver [`.env.example`](../.env.example)).

Guía completa: [docs/development.md](../docs/development.md) · Normas del código: [AGENTS.md](AGENTS.md).
