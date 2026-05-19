# 🏘 ImmoFamily — Gestion Locative Abidjan

Application de gestion du patrimoine immobilier familial à Abidjan.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Carte | React-Leaflet (OpenStreetMap) |
| HTTP Client | Axios |
| Backend | Node.js + Express |
| Base de données | SQLite (better-sqlite3) |
| Auth | JWT + bcryptjs |
| Dev | Concurrently (client + serveur en parallèle) |

## Installation rapide

### Prérequis
- Node.js v18+ installé → https://nodejs.org

### Étapes

```bash
# 1. Ouvrir le dossier dans VSCode

# 2. Ouvrir le terminal intégré (Ctrl+`) et lancer :
npm run install:all

# 3. Copier le fichier d'environnement
cp .env.example server/.env

# 4. Démarrer l'application (client + serveur)
npm run dev
```

L'app sera disponible sur :
- **Frontend** → http://localhost:5173
- **API Backend** → http://localhost:3001

## Connexion par défaut

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@immofamily.ci | admin123 |
| Membre | famille@immofamily.ci | famille123 |

## Structure des dossiers

```
immofamily/
├── client/                  → Frontend React
│   └── src/
│       ├── components/      → Composants réutilisables
│       │   ├── Layout/      → Sidebar, Topbar
│       │   ├── Modal/       → Formulaires d'ajout/édition
│       │   └── UI/          → StatCard, Badge, etc.
│       ├── pages/           → Dashboard, Biens, Carte...
│       ├── context/         → AuthContext (JWT)
│       ├── services/        → Appels API (axios)
│       └── hooks/           → useBiens, useLocataires...
│
└── server/                  → Backend Express
    ├── routes/              → /api/biens, /api/locataires...
    ├── controllers/         → Logique métier
    ├── middleware/          → Auth JWT
    └── database/            → SQLite + seed data
```

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Connexion |
| GET | /api/dashboard | Stats globales |
| GET/POST | /api/biens | Liste / Ajouter un bien |
| PUT/DELETE | /api/biens/:id | Modifier / Supprimer |
| GET/POST | /api/locataires | Liste / Ajouter |
| PUT/DELETE | /api/locataires/:id | Modifier / Supprimer |
| GET/POST | /api/paiements | Liste / Enregistrer paiement |
| GET | /api/rapports/mensuel | Rapport mensuel |

## Déploiement

### Option 1 - Render.com (gratuit)
Déployez le dossier `server/` comme un Web Service Node.js.

### Option 2 - Railway
Connectez votre repo GitHub, Railway détecte automatiquement Express.

### Option 3 - VPS / Hébergement local
```bash
npm run build           # Build du client React
# Servir les fichiers statiques depuis Express (déjà configuré)
NODE_ENV=production node server/server.js
```
