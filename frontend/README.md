# Stockroom frontend

React and TypeScript client for the Stockroom inventory management project.

## Stack

- React 19 and React Router
- TypeScript
- Vite
- Tailwind CSS
- Zustand for the authenticated session
- Axios for API access
- Vitest and ESLint

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. During development, Vite proxies `/api` to `http://localhost:8080`.

For a different API address:

```bash
cp .env.example .env.local
```

Then update `VITE_API_BASE_URL`. Vite exposes this value to the browser, so it must never contain credentials or other secrets.

## Available scripts

```bash
npm run dev       # development server
npm run lint      # ESLint
npm run test      # Vitest
npm run build     # type check and production build
npm run check     # lint, tests, and build
npm run preview   # preview the production bundle
```

Use `npm ci` for reproducible installs based on `package-lock.json`.

## Source layout

```text
src/
├── app/          Session bootstrap and protected routes
├── components/   Shared UI, branding, layout, and notifications
├── data/         Navigation metadata
├── pages/        Feature screens
├── services/     API client and resource-specific requests
├── store/        Persisted authentication state
├── types/        Shared domain types
└── utils/        Formatting, authorization, and exports
```

The interface is designed for desktop operations and includes responsive navigation for smaller screens. Domain identifiers in API payloads retain their original Portuguese names; services and types isolate that compatibility boundary from the visible interface.
