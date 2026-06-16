# AutoGest — Gestion de vente de voiture

## Stack
- **Frontend** : React + Vite + TailwindCSS + Recharts
- **Backend** : PHP pur (REST API)
- **BDD** : PostgreSQL

## Installation

### 1. Base de données
```bash
psql -U postgres
CREATE DATABASE autogest;
\c autogest
\i backend/schema.sql
```

### 2. Variables d'environnement (optionnel)
Configurer dans `backend/config/database.php` ou via variables d'env :
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autogest
DB_USER=postgres
DB_PASS=password
```

### 3. Backend (Apache/Nginx)
- Placer le dossier `backend/` dans ton serveur web
- Activer `mod_rewrite` (Apache)
- Ex: `http://localhost/autogest/backend/`

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```
Le proxy Vite redirige `/api` → `http://localhost/autogest/backend`

## Routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/clients` | Lister / Créer |
| GET/PUT/DELETE | `/clients/:id` | Détail / Modifier / Supprimer |
| GET/POST | `/voitures?q=` | Lister (avec recherche LIKE) / Créer |
| GET/PUT/DELETE | `/voitures/:id` | ... |
| GET/POST | `/achats?from=&to=` | Lister (filtre dates) / Créer |
| DELETE | `/achats/:id` | Supprimer (stock restauré) |
| GET | `/stats/recettes` | Recettes 6 derniers mois |
| GET | `/stats/facture?idcli=` | Facture d'un client |
