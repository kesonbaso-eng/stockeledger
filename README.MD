# StockLedger

Logiciel SaaS de gestion de boutique : caisse (POS), stock, comptabilité et facturation.

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Python / Django + Django REST Framework |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| Authentification | Firebase Auth |
| Frontend | HTML + CSS + Vanilla JS (ES Modules) |

## Structure du projet

```
stockledger/
├── backend/
│   ├── api/              # Modèles, vues, serializers, signals
│   ├── core/             # Settings, URLs Django
│   ├── manage.py
│   └── .env              # Variables d'environnement (ne pas commiter)
└── frontend/
    ├── admin/            # Dashboard, produits, dépenses, commandes
    ├── caissier/         # POS, historique
    ├── login.html
    ├── register.html
    └── app.css
```

## Rôles

- **Administrateur** : accès total (dashboard P&L, gestion produits, dépenses, commandes, export CSV)
- **Caissier** : accès caisse uniquement (POS, historique de ses ventes)

## Installation

```bash
cd backend
pip install django djangorestframework firebase-admin django-cors-headers python-dotenv
python manage.py migrate
python manage.py runserver
```

Ouvrir `frontend/login.html` avec Live Server (port 5500).

## Configuration Firebase

1. Télécharger la clé de service depuis Firebase Console → Paramètres → Comptes de service
2. Placer le fichier JSON dans `backend/`
3. Mettre à jour `FIREBASE_CREDENTIALS_PATH` dans `backend/.env`

## API Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/firebase/` | Public | Login / Register |
| GET | `/api/auth/me/` | Tous | Profil connecté |
| GET/POST | `/api/products/` | Admin/Caissier | Catalogue |
| PATCH/DELETE | `/api/products/:id/` | Admin | Modifier/Supprimer |
| GET/POST | `/api/orders/` | Admin/Caissier | Commandes |
| GET/POST | `/api/expenses/` | Admin | Dépenses |
| GET | `/api/dashboard/` | Admin | Stats P&L du mois |
| GET | `/api/export/sales/` | Admin | Export CSV ventes |

## Automatisations

- Déduction du stock automatique à chaque vente validée
- Alerte visuelle si stock ≤ seuil critique
- Calcul P&L en temps réel (CA − Dépenses)
- Mode hors-ligne : ventes sauvegardées localement et synchronisées au retour en ligne
- Scanner code-barres : détection automatique via saisie rapide clavier
