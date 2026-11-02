# Phase 1 — Backend structuré (21 → 27 septembre)

Ce dossier contient uniquement les fichiers **nouveaux ou modifiés**. Il ne
remplace pas ton projet : tu copies `src/` par-dessus ton dossier
`backend/src/` existant (ça écrasera `server.ts` et `config/supabase.ts`,
c'est voulu — le reste de `src/` est nouveau).

## 1. Copier les fichiers

Copie tout le contenu de `src/` dans `backend/src/` de ton projet, et
`sql/phase1_migrations.sql` où tu veux (juste pour référence, il ne
s'exécute pas depuis VS Code).

## 2. Installer les nouvelles dépendances

Dans `backend/` :

```bash
npm install zod multer
npm install -D @types/multer
```

## 3. Récupérer la clé service_role

Le backend utilise maintenant la clé **service_role**, pas la clé `anon`.

Dans le dashboard Supabase : **Project Settings → API → Project API keys
→ service_role (secret)**. Copie-la.

Dans `backend/.env`, remplace ou ajoute :

```env
SUPABASE_URL=https://kwvwzmtwiprvdygcbabz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=colle_la_clé_service_role_ici
PORT=5000
```

⚠️ Cette clé ne doit **jamais** apparaître dans le frontend, ni être commit
sur GitHub. Vérifie que `.env` est bien dans `.gitignore`.

## 4. Exécuter les migrations SQL

Ouvre le SQL Editor de Supabase, colle le contenu de
`sql/phase1_migrations.sql`, et exécute-le en une fois. Il :
- crée les tables `circuit_places` et `circuit_hotels` (liaisons),
- ajoute `entity_type` / `entity_id` à `media`,
- pose les policies RLS de lecture publique sur les tables du catalogue.

## 5. Créer le bucket de stockage

Dashboard Supabase → **Storage → New bucket** → nom exact : `media` →
coche **Public bucket** → Créer.

## 6. Nettoyer les doublons de circuits (si pas encore fait)

Dans le SQL Editor :

```sql
delete from circuits
where id not in (
  select min(id) from circuits group by title, description, price
);
```

## 7. Lancer le serveur

```bash
npm run dev
```

## 8. Tester avec Postman

| Méthode | Route | Body |
|---|---|---|
| GET | `/api/circuits` | — |
| GET | `/api/circuits/:id` | — |
| POST | `/api/circuits` | `{ "title": "...", "description": "...", "price": 100000 }` |
| PUT | `/api/circuits/:id` | un ou plusieurs champs |
| DELETE | `/api/circuits/:id` | — |
| POST | `/api/circuits/:id/places/:placeId` | — (lie un lieu à un circuit) |
| POST | `/api/circuits/:id/hotels/:hotelId` | — (lie un hôtel à un circuit) |
| GET / POST / PUT / DELETE | `/api/tourist-places[...]` | mêmes principes |
| GET / POST / PUT / DELETE | `/api/hotels[...]` | mêmes principes |
| POST | `/api/media` | form-data : `file` (fichier), `entity_type`, `entity_id`, `alt_text` (optionnel) |
| GET | `/api/media/:entityType/:entityId` | — |
| DELETE | `/api/media/:id` | — |

Pour `POST /api/media` dans Postman : onglet **Body → form-data**, ajoute
une clé `file` en type **File**, plus `entity_type` et `entity_id` en
type Text.

## Ce qui n'est PAS encore fait (normal, c'est la Phase 2)

- Aucune authentification : toutes ces routes sont ouvertes en écriture
  pour l'instant, car c'est Express (via la clé service_role) qui écrit,
  pas un utilisateur final. La protection par rôle arrive à la phase
  suivante.
