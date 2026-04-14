# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Cross-device sync (Vercel)

This project supports automatic cross-device sync through `/api/sync`.

1. In your Vercel project, add a Redis integration (Upstash Redis).
2. Confirm these environment variables exist in Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy.
4. Open the same deployed site URL on PC/mobile.

Notes:
- Cookies/localStorage only persist per browser/device.
- Cross-device persistence requires server-side storage.
- This app is configured for single-owner automatic sync using one fixed sync key in code (`AUTO_SYNC_KEY`).

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
