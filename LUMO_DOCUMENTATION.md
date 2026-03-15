# 🚀 LUMO HUBCOMMERCE PRO - DOCUMENTATION COMPLÈTE

## 🎯 Objectif de l'Application
LUMO est une plateforme ERP/POS (Entreprise Resource Planning / Point of Sale) multi-tenant de nouvelle génération. Son objectif est de permettre aux commerçants et entreprises de gérer l'intégralité de leur cycle commercial (achats, stocks, ventes, dettes, statistiques) tout en bénéficiant d'une intelligence artificielle avancée pour l'aide à la décision.

---

## 💻 Fonctionnalités Côté Client (Frontend)

### 📊 Tableaux de Bord & Pilotage
*   **Dashboard Intelligent** : Aperçu global du chiffre d'affaires, des dépenses et de la santé du stock.
*   **LUMO Assistant (AI)** : Chat interactif assisté par DeepSeek pour poser des questions sur les données et recevoir des suggestions stratégiques (réapprovisionnement, bundles, prix).
*   **Stats & Analytics** : Graphiques financiers (Rechards) détaillant les performances par période.

### 🛒 Opérations Commerciales
*   **POS (Point de Vente)** : Interface optimisée pour la vente rapide avec recherche de produits et gestion du panier.
*   **Gestion des Stocks** : Catalogue de produits complet avec alertes de stock critique et gestion des catégories.
*   **Ventes & Factures** : Historique complet des transactions avec possibilité de suppression/modification.
*   **Achats & Dépenses** : Suivi des flux sortants (approvisionnement et frais de fonctionnement).

### 🤝 Relationnel (CRM/SRM)
*   **Clients** : Base de données clients avec historique d'achats.
*   **Fournisseurs** : Gestion des partenaires d'approvisionnement.
*   **Dettes** : Système de suivi des paiements en attente (clients et fournisseurs).

### ⚙️ Personnalisation & UI/UX
*   **Multi-devises** : Toggle instantané entre **CDF** et **USD**.
*   **Multi-thèmes** : Mode Clair et Sombre (Premium Dark Mode).
*   **Interface Premium** : Design moderne avec Glassmorphism, animations fluides (Framer Motion) et composants épurés.
*   **Système de Notifications** : Dropdown épuré pour les alertes système et notifications de sécurité.

---

## 🔧 Fonctionnalités Côté Serveur (Backend)

### 🔐 Authentification & Sécurité
*   **JWT Auth** : Système de jetons sécurisés.
*   **Validation KYC** : Système de "Noyau Actif" où les comptes doivent être validés par le SuperAdmin.
*   **Vérification OTP** : Validation obligatoire de l'email par code à 6 chiffres lors de l'inscription.
*   **RBAC (Role-Based Access Control)** : Distinction entre Admin (gérant de boutique) et SuperAdmin (gestionnaire de la plateforme).

### 🧠 Intelligence Artificielle
*   **Moteur DeepSeek** : Intégration via l'API OpenAI pour générer des insights basés sur les données réelles de la boutique (Ventes, Stocks, Pertes).
*   **Prompt Engineering** : Analyse structurée des données pour proposer des actions concrètes (Appliquer une remise, créer un pack, etc.).

### 🛠️ Administration Système (SuperAdmin)
*   **Santé du Cluster** : Monitoring global des instances, des comptes vérifiés et des requêtes en attente.
*   **Gestion des Utilisateurs** : Capacité de suspendre/réactiver des comptes ou de supprimer des instances.
*   **Audit Logs** : Suivi des activités critiques à travers le cluster.

---

## 🏗️ Stack Technique
*   **Frontend** : React.ts, Vite, Framer Motion, Lucide icons, Sonner (Toasts), Axios.
*   **Backend** : Node.js, Express, Sequelize (ORM).
*   **Base de Données** : PostgreSQL.
*   **AI Engine** : DeepSeek API (Modèle deepseek-chat).
*   **Stockage Image** : Cloudinary / Local.

---

## 📂 Structure des Données (Models)
1.  **User** : Credentials, Entreprise, Rôle, Statut (Vérifié, Suspendu).
2.  **Product** : Nom, Prix, Stock, Seuil d'alerte.
3.  **Sale** : Produits vendus, Montant total, Date.
4.  **Client/Fournisseur** : Coordonnées, Solde des dettes.
5.  **Depense** : Motif, Montant, Catégorie.
6.  **Notification** : Titre, Message, Type (Info, Succès, Alerte).

---
*LUMO - Propulsez votre commerce vers le futur.*
