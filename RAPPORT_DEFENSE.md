# Rapport Détaillé de Défense - Plateforme HubCommerce (Lumo)

Ce rapport constitue l'annexe technique complète de la plateforme **HubCommerce**. Il détaille exhaustivement l'architecture, le modèle conceptuel, les processus métiers (à travers des diagrammes UML standards), ainsi que les spécifications des modules fonctionnels de l'ERP.

---

## 1. Présentation de l'Architecture Technique

La plateforme repose sur une architecture moderne de type **Single Page Application (SPA)** déconnectée de son API. Cela garantit une séparation des préoccupations (Sécurité, Interface, Données).

### Diagramme de Composants et d'Architecture Globale
Ce diagramme montre comment le frontend interagit avec le backend, la base de données et les services de notification en temps réel.

```mermaid
flowchart TD
    subgraph "Frontend - Interface Utilisateur (React / Vite)"
        direction TB
        App[Application Core]
        Router[React Router DOM]
        Zustand[Zustand Store - État Global]
        UI[Composants UI / Tailwind CSS]
        
        App --> Router
        Router --> UI
        UI --> Zustand
    end

    subgraph "Backend - Logique & API (Node.js / Express)"
        direction TB
        API[API Gateway / Routes]
        Auth[Middlewares Sécurité & JWT]
        Ctrl[Controllers Métier]
        Socket[Serveur WebSocket - Socket.io]
        
        API --> Auth
        Auth --> Ctrl
    end

    subgraph "Couche Données (PostgreSQL)"
        ORM[Sequelize ORM]
        DB[(PostgreSQL Database)]
        ORM --> DB
    end

    Zustand <-->|Requêtes HTTP / REST Axios| API
    UI <-->|Événements Temps Réel| Socket
    Ctrl <-->|Requêtes Modèles| ORM
```

---

## 2. Diagramme des Cas d'Utilisation (Use Case)

Ce diagramme définit le périmètre du système et les autorisations d'interaction selon le rôle de l'utilisateur (Administrateur global vs Caissier/Vendeur) ainsi que l'intervention de l'Intelligence Artificielle.

```mermaid
flowchart LR
    Admin((Administrateur))
    Caissier((Caissier / Vendeur))
    IA((Système IA DeepSeek Cloud))

    subgraph Système ERP HubCommerce
        UC1(Gérer l'inventaire et les fournisseurs)
        UC2(Effectuer une vente POS)
        UC3(Gérer les profils clients)
        UC4(Gérer les crédits et dettes)
        UC5(Consulter les KPI et rapports)
        UC6(Analyser les prédictions financières)
        UC7(Configuration du système et sécurité)
        UC8(Sauvegarde et restauration des données)
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC7
    Admin --> UC8

    Caissier --> UC2
    Caissier --> UC3
    Caissier --> UC4

    UC5 -.->|<< include >>| UC6
    IA --> UC6
```

---

## 3. Modèle de Données (Diagramme Entité-Association / Classes)

Le modèle conceptuel de données ci-dessous illustre la structure relationnelle de la base de données. Il garantit la traçabilité de chaque produit, de son achat chez un fournisseur jusqu'à sa vente à un client.

```mermaid
erDiagram
    UTILISATEUR {
        int id PK
        string nom
        string email
        string motDePasse
        string role "Ex: Admin, SubUser"
        boolean twoFactorEnabled
    }
    PRODUIT {
        int id PK
        string codeBarre
        string nom
        string categorie
        float prixAchat
        float prixVente
        int quantiteEnStock
        int seuilAlerte
    }
    CLIENT {
        int id PK
        string nom
        string telephone
        string email
        float totalDette
    }
    FOURNISSEUR {
        int id PK
        string nom
        string contact
    }
    VENTE {
        int id PK
        float sousTotal
        float taxe
        float total
        float montantPaye
        string statut "Payé, Partiel, Impayé"
        string methodePaiement
        date dateVente
    }
    LIGNE_VENTE {
        int id PK
        int quantite
        float prixUnitaire
        float sousTotal
    }
    ACHAT {
        int id PK
        float total
        date dateAchat
    }
    LIGNE_ACHAT {
        int id PK
        int quantite
        float prixAchat
    }

    UTILISATEUR ||--o{ VENTE : "enregistre"
    CLIENT ||--o{ VENTE : "est facturé"
    VENTE ||--|{ LIGNE_VENTE : "contient"
    PRODUIT ||--o{ LIGNE_VENTE : "est listé dans"
    FOURNISSEUR ||--o{ ACHAT : "approvisionne"
    ACHAT ||--|{ LIGNE_ACHAT : "contient"
    PRODUIT ||--o{ LIGNE_ACHAT : "concerne"
```

---

## 4. Diagramme de Séquence : Le Processus de Vente au POS

Ce diagramme de séquence décrit étape par étape le flux transactionnel critique lors d'une vente en caisse, incluant la vérification du stock, la gestion transactionnelle (ACID) en base de données, et la création de dette en cas de paiement partiel.

```mermaid
sequenceDiagram
    autonumber
    actor C as Utilisateur (Caissier)
    participant UI as Interface POS (React)
    participant API as Backend API (Express)
    participant DB as PostgreSQL

    C->>UI: Scanne le code-barre d'un article
    UI->>API: GET /api/products/search?q=codeBarre
    API->>DB: SELECT * FROM produits WHERE codeBarre = ?
    DB-->>API: Renvoie Produit (Prix, Stock)
    API-->>UI: Produit trouvé
    UI-->>C: Affiche le produit dans le panier virtuel
    
    C->>UI: Valide le panier, saisit le montant donné par le client
    UI->>API: POST /api/sales (Détails du panier + ID Client)
    
    activate API
    API->>DB: BEGIN TRANSACTION (Sécurité des données)
    API->>DB: INSERT INTO ventes (Total, Montant Payé)
    API->>DB: INSERT INTO ligne_ventes (Produits individuels)
    API->>DB: UPDATE produits SET quantiteEnStock = quantiteEnStock - QtéVendu
    
    alt Si Montant Payé < Total Facture
        API->>DB: UPDATE clients SET totalDette = totalDette + ResteÀPayer
    end
    
    API->>DB: COMMIT TRANSACTION
    deactivate API
    
    API-->>UI: Réponse 201 Created (Vente réussie)
    UI-->>C: Imprime le Ticket de Caisse & Vide le panier
```

---

## 5. Diagramme d'État-Transition : Cycle de vie du Stock

La gestion des stocks est automatisée. Ce diagramme montre les différents états par lesquels un produit peut passer au sein du système.

```mermaid
stateDiagram-v2
    [*] --> ProduitCréé : Création dans le catalogue
    
    ProduitCréé --> EnStock : Enregistrement d'un Achat Fournisseur
    
    EnStock --> EnStock : Vente (Déduction de la quantité)
    
    EnStock --> StockCritique : Quantité descendue sous le "Seuil d'alerte"
    StockCritique --> EnStock : Réapprovisionnement (Achat)
    
    StockCritique --> Rupture : Quantité tombe à 0
    Rupture --> EnStock : Réapprovisionnement
    
    StockCritique --> [*] : Produit archivé/supprimé
    Rupture --> [*] : Produit retiré du catalogue
```

---

## 6. Détail Exhaustif des Modules et Fonctionnalités

La solution intègre plusieurs modules métiers interagissant en synergie pour fournir un ERP complet.

### 6.1 Module Caisse / Terminal de Vente (POS)
* **Recherche temps réel (Live-Search)** : Les produits s'affichent instantanément à la frappe ou via douchette laser (Code-barres).
* **Multi-devises Natif** : Conversion instantanée des totaux (ex: Achat en USD, paiement client en CDF avec rendu de monnaie en CDF calculé).
* **Validation Transactionnelle** : Bloque la vente si le stock est insuffisant (sauf forçage administrateur).
* **Reçus et Facturation** : Génération de tickets PDF/Thermiques formatés avec le logo et les coordonnées de l'enseigne.

### 6.2 Module CRM et Suivi Financier (Clients & Dettes)
* **Livre des Créances** : Historique granulaire des montants impayés de chaque client.
* **Amortissement des dettes** : Le client peut rembourser sa dette en plusieurs tranches. Chaque tranche génère un reçu de paiement et incrémente la liquidité de la caisse.

### 6.3 Module Inventaire et Fournisseurs (Achats)
* **Approvisionnement traçable** : Lors d'une commande fournisseur, la somme est déduite des caisses (ou génère une dette fournisseur), et les produits sont immédiatement ajoutés au stock physique.
* **Alerte intelligente** : Notification push au sein de l'application lorsqu'un article stratégique s'approche de son seuil critique.

### 6.4 Module Dashboard et Analytics
* **Indicateurs de Performance (KPI)** :
  - *Chiffre d'affaires brut et net.*
  - *Marge bénéficiaire réelle* calculée selon `(Prix Vente - Prix Achat Moyen) * Quantité Vendu`.
  - *Top 5 des produits les plus vendus.*
* **Export de Données** : Fonctionnalité de génération de rapports sous format Microsoft Excel (`.xlsx`) pour traitement comptable externe.

### 6.5 Module LUMO AIO
* **Intégration Modèle LLM** : Connexion à l'API DeepSeek (Modèle `deepseek-chat`).
* **Prédiction algorithmique** : L'IA croise les historiques de ventes pour prédire les pics de demande saisonniers.
* **Analyse de rentabilité textuelle** : Fournit des résumés écrits automatiques au manager ("Attention, la catégorie 'Boissons' génère 40% de revenus en moins ce mois-ci par rapport au mois dernier").

---

## 7. Paramètres Systèmes et Rôles

Le panneau de configuration offre à l'administrateur le contrôle total du comportement de l'ERP.

| Paramètre | Rôle Opérationnel | Impact Système |
| :--- | :--- | :--- |
| **Profil de l'entreprise** | Définit l'identité commerciale (Nom, Logo, Adresse). | Personnalise l'interface et les en-têtes de facturation. |
| **Taux de Change Global** | Valeur de conversion entre la monnaie locale et étrangère. | Met à jour dynamiquement tous les prix au POS. |
| **Bilinguisme (Fr/En)** | Change la langue de l'interface en temps réel. | Traduction instantanée sans rechargement (`useTranslation`). |
| **Sauvegarde JSON** | Permet le téléchargement local d'un snapshot crypté de la base. | Plan de reprise d'activité (Disaster Recovery). |
| **Sécurité 2FA** | Active la double authentification. | Demande un code OTP envoyé par mail avant accès administrateur. |
| **Feature Flags** | Activation/Désactivation des modules (IA, Stocks). | Allège le système pour les structures très basiques. |

---

## 8. Durcissement Production & Stabilisation (Post-Audit)

Suite à un audit technique approfondi, les mesures de stabilisation suivantes ont été implémentées :
*   **Résilience des Mots de Passe** : Protection contre le double-hachage Sequelize via un garde-fou dans les hooks de modèle.
*   **Intégrité des Sessions** : Migration vers un encodage Base64 UTF-8 pour supporter les caractères spéciaux dans les noms d'utilisateurs.
*   **Sécurité SuperAdmin** : Verrouillage matériel des comptes racines pour empêcher toute suppression accidentelle.
*   **Standardisation API** : Unification des formats de réponse pour garantir la fiabilité de l'affichage frontend.
*   **Optimisation de la Latence** : Optimisation des logs d'activité asynchrones pour réduire le temps de réponse du login.

---

**FIN DU RAPPORT**
*Généré pour la défense de fin d'études.*
