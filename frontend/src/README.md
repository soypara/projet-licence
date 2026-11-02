# Frontend Phase 1 — interface de test pour le backend Phase 1

Ce n'est pas un prototype jetable : c'est le vrai début de ton frontend
Next.js. Pour l'instant, il montre tout à tout le monde (pas de rôles,
pas d'authentification) parce que le backend n'en a pas encore. Le
bandeau en haut de l'app le rappelle.

## 1. Copier les fichiers

Copie `app/`, `components/`, `lib/` dans ton projet Next.js déjà
initialisé (ça remplace `app/layout.js`, `app/page.js`, `app/globals.css`
générés par défaut — c'est voulu).

Copie aussi `tailwind.config.js` et `postcss.config.js` **seulement si
tu n'as pas déjà répondu "oui" à Tailwind CSS pendant `create-next-app`**
(dans ce cas ils existent déjà et sont probablement corrects).

## 2. Installer Tailwind si besoin

Si `tailwind.config.js` n'existait pas avant :

```bash
npm install -D tailwindcss postcss autoprefixer
```

## 3. Configurer l'URL du backend

Crée `.env.local` à la racine du frontend (copie `.env.local.example`) :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 4. Lancer les deux serveurs

Dans deux terminaux séparés :

```bash
# terminal 1 — backend
cd backend && npm run dev

# terminal 2 — frontend
cd frontend && npm run dev
```

Ouvre `http://localhost:3000`.

## 5. Ce que tu peux tester

- **/circuits** — liste, création, suppression
- **/circuits/[id]** — modification, suppression, liaison à des lieux et
  hôtels (menus déroulants), upload de photos/vidéos, suppression de
  médias
- **/tourist-places** — liste, création, modification, suppression
- **/hotels** — liste, création, modification, suppression

Pour tester les liaisons et l'upload, crée d'abord au moins un lieu
touristique et un hôtel (pages dédiées), puis va sur la fiche d'un
circuit pour les lui associer.

## Choix faits, à savoir

- **JavaScript, pas TypeScript** côté frontend — conforme à ta stack
  d'origine (le backend, lui, est en TypeScript).
- **`fetch` natif plutôt qu'Axios**, via `lib/api.js` — évite une
  dépendance en plus pour un besoin simple ; dis-moi si tu préfères
  Axios, c'est un changement mineur.
- **App Router** (pas de `react-router-dom` : Next.js gère le routing
  via la structure de dossiers `app/`).

## Ce qui n'est pas encore là (normal)

- Pas de connexion, pas de notion de "mon compte"
- Pas de sélecteur de langue (Phase 0 du planning, à faire séparément)
- Pas de carte, pas de réservation — ça vient aux phases suivantes
