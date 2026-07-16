Voici la définition exacte des droits, des missions et des limites pour les deux rôles au sein de StockLedger.

Cette séparation stricte est le cœur de la sécurité de l'application : elle permet au propriétaire de la boutique de déléguer la vente à un employé sans risquer de compromettre ses données financières ou son inventaire.

1. Le Rôle du Caissier (L'Opérateur de terrain)
Le caissier est l'utilisateur qui gère le quotidien de la boutique face aux clients. Son interface est volontairement épurée et bloquée sur l'essentiel pour éviter les erreurs de manipulation et garantir la confidentialité des finances.

Ses missions et accès (Ce qu'il peut faire) :

Vendre : Accéder à l'écran de caisse (Point of Sale - POS).

Chercher des articles : Parcourir le catalogue ou utiliser la barre de recherche pour trouver un produit.

Gérer le panier : Ajouter des articles, modifier les quantités dans le panier, et appliquer éventuellement une remise (si l'administrateur l'autorise).

Valider et Facturer : Encaisser la commande, générer le reçu et lancer l'impression de la facture.

Consulter l'inventaire en lecture seule : Il peut voir qu'il ne reste que "2 unités" d'un produit pour informer le client, mais il ne peut pas modifier ce chiffre.

Ses restrictions (Ce qu'il ne peut absolument pas faire) :

❌ Ne peut pas changer le prix de base d'un produit.

❌ Ne peut pas ajouter, modifier ou supprimer un produit du catalogue.

❌ Ne peut pas voir le chiffre d'affaires de la journée ou du mois.

❌ Ne peut pas voir ni saisir les dépenses (salaires, loyers).

❌ Ne peut pas modifier manuellement le niveau des stocks pour masquer une perte ou un vol.

2. Le Rôle de l'Administrateur (Le Gérant / Propriétaire)
L'administrateur est le patron de la boutique. Il possède les "clés" de l'ensemble du système. Son rôle est de surveiller l'activité, de s'assurer que le stock est à jour et d'analyser la rentabilité.

Ses missions et accès (Accès total) :

Contrôle total sur les Ventes : Il possède les mêmes droits que le caissier pour effectuer des ventes si besoin.

Gestion du Catalogue (CRUD) : Il est le seul à pouvoir ajouter de nouveaux produits, corriger une erreur de prix, ou supprimer un article obsolète.

Régularisation des Stocks : Si lors d'un inventaire physique il manque un produit (vol, casse), seul l'administrateur peut ajuster le stock manuellement dans le système.

Tableau de Bord Financier (P&L) : Il a accès aux rapports détaillés (Chiffre d'Affaires, Dépenses totales, Bénéfice net ou Perte).

Gestion des Dépenses : Il saisit les "sorties" d'argent de la caisse (paiement des salaires, factures d'électricité, achat de fournitures).

Gestion du Logiciel : Il gère les paramètres de la boutique et le renouvellement de l'abonnement StockLedger.

Tableau Récapitulatif des Droits
Pour que cela soit visuellement très clair, voici comment le système va filtrer les accès techniquement :

Fonctionnalités du Logiciel	Rôle : Caissier	Rôle : Administrateur
Interface de Caisse (POS)	✅ Autorisé	✅ Autorisé
Génération et impression de facture	✅ Autorisé	✅ Autorisé
Voir les quantités en stock	✅ Autorisé	✅ Autorisé
Ajouter ou modifier un produit	❌ Bloqué	✅ Autorisé
Ajuster manuellement le niveau du stock	❌ Bloqué	✅ Autorisé
Saisir une dépense (facture, salaire)	❌ Bloqué	✅ Autorisé
Voir le tableau de bord financier (Bénéfices/Pertes)	❌ Bloqué	✅ Autorisé
Renouveler l'abonnement du logiciel	❌ Bloqué	✅ Autorisé