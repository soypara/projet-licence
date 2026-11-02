# Plateforme touristique Madagascar — Phase 1 corrigée

Projet Next.js + Express + Supabase pour le prototype de la plateforme touristique.

## Corrections principales

- Backend TypeScript compilable avec `npm run typecheck` et `npm run build`.
- Compatibilité TypeScript avec Express 5 (`req.params` correctement convertis).
- Réponses JSON de Wikipédia typées pour éviter les erreurs TypeScript 7.
- Policies Supabase ajoutées pour permettre le CRUD du prototype sans authentification.
- Policies Storage ajoutées pour le bucket `media`.
- Configuration Tailwind CSS 4 conservée uniquement à la racine du frontend.
- Couleurs de thème manquantes (`or`, `foret`) ajoutées.
- ESLint frontend : 0 erreur. Les avertissements restants concernent les images externes et les polices Google.
- Aucun fichier `.env` réel n'est inclus dans cette archive corrigée.

## 1. Backend

```powershell
cd backend
npm install
npm run typecheck
npm run build
npm run dev
```

Créer `backend/.env` à partir de `backend/.env.example` :

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
PORT=5000
```

## 2. Supabase

Dans le SQL Editor, exécuter dans cet ordre :

1. `backend/sql/phase1_migrations.sql`
2. `backend/sql/phase1b_migrations.sql`

Puis créer un bucket Storage public nommé **media** si ce n'est pas déjà fait.

> Les policies d'écriture de la Phase 1 sont volontairement ouvertes pour le prototype sans authentification. Elles devront être remplacées par des policies basées sur `auth.uid()` lorsque l'authentification et les rôles seront ajoutés.

## 3. Frontend

```powershell
cd frontend
npm install
npm run lint
npm run dev
```

Créer `frontend/.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Puis ouvrir `http://localhost:3000`.

## Fonctionnalités actuellement disponibles

- Feed public des lieux touristiques.
- Recherche et import assisté depuis Wikipédia.
- Création/modification/suppression de lieux, hôtels et circuits.
- Liaison circuits ↔ lieux/hôtels.
- Upload de médias.
- Photo Wikipédia enregistrée par URL avec attribution.
