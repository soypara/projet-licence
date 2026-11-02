# Frontend — Phase 1

Frontend Next.js 16 + React 19 + Tailwind CSS 4 pour le prototype touristique.

## Installation

```powershell
npm install
```

Créer `.env.local` à la racine du frontend :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Lancement

```powershell
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Vérifications

```powershell
npm run lint
npm run build
```

La configuration Tailwind 4 utilise `postcss.config.mjs` à la racine et `src/app/globals.css` avec `@import "tailwindcss"`.

## Pages

- `/feed` : feed public des lieux touristiques.
- `/tourist-places` : gestion des lieux.
- `/tourist-places/new` : ajout manuel ou import assisté Wikipédia.
- `/circuits` : gestion des circuits.
- `/circuits/[id]` : détail, liaisons et médias d'un circuit.
- `/hotels` : gestion des hôtels.
