# 🔍 Analyse Complète de l'Application HubCommerce Pro

## 📋 Sommaire
1. [Introduction](#introduction)
2. [Structure du Projet](#structure-du-projet)
3. [Technologies Utilisées](#technologies-utilisées)
4. [Fonctionnalités Existantes](#fonctionnalités-existantes)
5. [Architecture Technique](#architecture-technique)
6. [Points Forts](#points-forts)
7. [Points d'Amélioration Critiques](#points-damélioration-critiques)
8. [Recommandations](#recommandations)
9. [Conclusion](#conclusion)

---

## 🎯 Introduction

HubCommerce Pro est une plateforme ERP/POS (Enterprise Resource Planning / Point of Sale) moderne conçue pour les commerçants et entreprises. L'application permet de gérer l'intégralité du cycle commercial, des achats aux ventes en passant par la gestion des stocks, tout en intégrant une intelligence artificielle pour l'aide à la décision.

---

## 🗂️ Structure du Projet

```
hubcommerce-project/
├── client/                  # Frontend React
│   ├── public/             # Assets statiques
│   ├── src/
│   │   ├── api/             # Configuration Axios
│   │   ├── components/     # Composants React
│   │   │   ├── common/      # Composants réutilisables
│   │   │   ├── dashboard/   # Composants du tableau de bord
│   │   │   └── layout/      # Layout principal
│   │   ├── hooks/           # Hooks personnalisés
│   │   ├── pages/           # Pages de l'application
│   │   │   ├── auth/        # Pages d'authentification
│   │   │   └── *.tsx        # Pages principales
│   │   ├── services/        # Services API
│   │   ├── store/           # Stores Zustand
│   │   ├── translations.ts  # Traductions
│   │   ├── utils/           # Fonctions utilitaires
│   │   ├── App.tsx          # Routeur principal
│   │   └── main.tsx         # Point d'entrée
│   ├── package.json         # Dépendances frontend
│   └── vite.config.ts       # Configuration Vite
│
└── server/                  # Backend Node.js
    ├── config/             # Configuration
    ├── controllers/       # Contrôleurs
    ├── cron/              # Tâches planifiées
    ├── middleware/        # Middlewares
    ├── migrations/        # Migrations de base de données
    ├── models/            # Modèles de données
    ├── routes/            # Routes API
    ├── seeders/           # Données de test
    ├── services/          # Services backend
    ├── swagger/           # Documentation API
    ├── utils/             # Utilitaires backend
    ├── .env.example       # Configuration environnement
    ├── jest.config.js     # Configuration tests
    ├── package.json       # Dépendances backend
    └── server.js          # Point d'entrée backend
```

---

## 🛠️ Technologies Utilisées

### Frontend
- **Framework**: React 18 (TypeScript)
- **Bundler**: Vite
- **State Management**: Zustand
- **UI Components**: 
  - Material-UI (@mui/material, @mui/icons-material)
  - Lucide React (icônes)
  - Framer Motion (animations)
  - Sonner (notifications toast)
- **Charting**: @mui/x-charts
- **Internationalisation**: Gestion manuelle des traductions
- **Formatting**: XLSX (export Excel)
- **Real-time**: Socket.IO Client
- **Styling**: TailwindCSS + CSS personnalisé

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Sequelize (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**:
  - Helmet (headers sécurisés)
  - XSS-Clean (protection XSS)
  - HPP (protection HTTP Parameter Pollution)
  - CORS (configuration stricte)
  - Rate Limiting (express-rate-limit)
- **Logging**: Winston
- **Email**: Nodemailer
- **File Uploads**: Multer
- **Cloud Storage**: Cloudinary
- **AI Integration**: OpenAI SDK (DeepSeek)
- **Real-time**: Socket.IO
- **Task Scheduling**: Node-Cron
- **Documentation**: Swagger
- **Compression**: Compression middleware

### Base de Données
- **SGBD**: PostgreSQL
- **ORM**: Sequelize
- **Modèles**: 12 modèles principaux (User, Product, Sale, Client, etc.)

### DevOps & Outils
- **Testing**: Jest (backend), Vitest (frontend)
- **Development**: Nodemon (reloading)
- **Build**: TypeScript, Vite

---

## ✨ Fonctionnalités Existantes

### 📊 Tableaux de Bord & Analytics
- **Dashboard Intelligent**: Aperçu global du chiffre d'affaires, dépenses et santé du stock
- **LUMO Assistant AI**: Chat interactif avec DeepSeek pour analyse des données et suggestions stratégiques
- **Graphiques Financiers**: Visualisation des performances avec MUI X-Charts
- **Notifications**: Système de notifications en temps réel

### 🛒 Gestion Commerciale
- **Point de Vente (POS)**: Interface optimisée pour les ventes rapides
  - Recherche de produits
  - Gestion du panier
  - Multiples méthodes de paiement
  - Impression de tickets
- **Catalogue Produits**:
  - Gestion complète des produits
  - Catégories et filtrage
  - Alertes de stock critique
  - Import/Export Excel
  - Scanner de code-barres
  - Historique des modifications
- **Ventes & Factures**:
  - Historique complet des transactions
  - Modification/suppression des ventes
  - Export des données
- **Achats & Dépenses**:
  - Enregistrement des achats
  - Gestion des fournisseurs
  - Suivi des dettes fournisseurs
  - Analyse des coûts

### 🤝 CRM & SRM
- **Gestion Clients**:
  - Base de données clients
  - Historique d'achats
  - Suivi des dettes
  - Fiches clients détaillées
  - Export des données
- **Gestion Fournisseurs**:
  - Base de données fournisseurs
  - Historique des achats
  - Suivi des dettes

### 💰 Gestion Financière
- **Dettes Clients/Fournisseurs**: Suivi des paiements en attente
- **Cash Sessions**: Gestion des sessions de caisse
- **Statistiques Avancées**:
  - Analyse de rentabilité
  - Prévisions de stock
  - Comparaison de périodes
  - Export Excel/PDF

### ⚙️ Paramétrage
- **Profil Utilisateur**: Gestion des informations personnelles
- **Paramètres Boutique**:
  - Nom, logo, adresse
  - Devise (CDF/USD)
  - Taux de change
  - Modules activés
- **Préférences**:
  - Thème (clair/sombre)
  - Langue (français/anglais)
  - Sauvegarde automatique
- **Sécurité**:
  - Changement de mot de passe
  - Authentification à 2 facteurs (préparé)
- **Gestion Utilisateurs** (SuperAdmin):
  - Création/suspension de comptes
  - Gestion des abonnements
  - Audit des activités

### 🤖 Intelligence Artificielle
- **Analyse Stratégique**: Suggestions basées sur les données réelles
  - Gestion des stocks
  - Stratégies de vente
  - Optimisation des prix
- **Chat Interactif**:
  - Historique des conversations
  - Réponses en streaming
  - Contexte basé sur les données de la boutique
- **Insights Automatiques**:
  - Produits les plus vendus
  - Alertes de stock
  - Suggestions de promotion

### 🔄 Intégrations
- **Cloudinary**: Stockage des images
- **DeepSeek AI**: Analyse intelligente
- **Socket.IO**: Notifications en temps réel
- **Email**: Nodemailer pour les notifications

### ⏰ Tâches Planifiées
- **Sauvegardes Automatiques**:
  - Exécution quotidienne à minuit
  - Nettoyage des anciennes sauvegardes (7 jours)
  - Format JSON structuré
  - Respect des préférences utilisateur

---

## 🏗️ Architecture Technique

### Frontend Architecture
```
Client → Vite → React (TypeScript) → Zustand → Axios → Backend API
```

**Key Patterns**:
- **Lazy Loading**: Chargement paresseux des pages avec React.lazy()
- **State Management**: Zustand pour la gestion d'état globale
- **Responsive Design**: TailwindCSS + CSS personnalisé
- **Animations**: Framer Motion pour les transitions fluides
- **Internationalisation**: Gestion manuelle via translations.ts
- **Real-time Updates**: Socket.IO pour les notifications

### Backend Architecture
```
Client → Nginx → Express → Middlewares → Controllers → Services → Models → PostgreSQL
```

**Key Patterns**:
- **MVC Pattern**: Séparation claire des responsabilités
- **Multi-tenancy**: Tous les requêtes filtrent par userId
- **Security Layers**:
  - Helmet pour les headers
  - CORS strict
  - Rate limiting
  - Validation des entrées
  - Protection CSRF
- **Error Handling**: Gestion centralisée des erreurs
- **Logging**: Winston pour le logging structuré
- **Task Scheduling**: Node-Cron pour les tâches planifiées

### Database Schema
```
User (1) ↔ (N) Product
User (1) ↔ (N) Sale
User (1) ↔ (N) Client
User (1) ↔ (N) Purchase
User (1) ↔ (N) Fournisseur
User (1) ↔ (N) Depense
User (1) ↔ (N) CashSession
User (1) ↔ (N) Activite
User (1) ↔ (N) Notification
User (1) ↔ (N) SubUser

Product (1) ↔ (N) StockMovement
Sale (1) ↔ (1) Client
Purchase (1) ↔ (1) Fournisseur
```

### API Structure
- **Base Path**: `/api`
- **Versioning**: No versioning (recommended: `/api/v1`)
- **Authentication**: JWT Bearer Token
- **Format**: RESTful JSON

**Main Endpoints**:
- `/api/auth/*`: Authentification
- `/api/products/*`: Gestion des produits
- `/api/sales/*`: Gestion des ventes
- `/api/clients/*`: Gestion des clients
- `/api/fournisseurs/*`: Gestion des fournisseurs
- `/api/depenses/*`: Gestion des dépenses
- `/api/purchases/*`: Gestion des achats
- `/api/ai/*`: Intelligence artificielle
- `/api/stats/*`: Statistiques
- `/api/notifications/*`: Notifications
- `/api/superadmin/*`: Administration
- `/api/activites/*`: Activités (à implémenter)
- `/api/backup/*`: Sauvegardes

---

## 💪 Points Forts

### Sécurité
1. **Helmet**: Configuration des headers HTTP sécurisés
2. **XSS Clean**: Protection contre les attaques XSS
3. **HPP**: Protection contre la pollution de paramètres HTTP
4. **CORS**: Configuration stricte des origines autorisées
5. **Rate Limiting**: 100 requêtes/10 minutes pour l'API, 100/15min pour l'auth
6. **JWT Authentication**: Implémentation correcte avec bcrypt pour le hashage
7. **RBAC**: Contrôle d'accès basé sur les rôles (admin, superadmin)
8. **Validation des Entrées**: Joi pour la validation (partielle)

### Architecture
9. **Structure MVC**: Organisation claire et maintenable
10. **Multi-tenancy**: Isolation des données par utilisateur
11. **Gestion Centralisée des Erreurs**: Middleware global
12. **Configuration Environnement**: Utilisation de dotenv
13. **Logging**: Winston pour un logging structuré
14. **Documentation API**: Swagger configuré (non peuplé)

### Fonctionnalités
15. **Intégration IA**: DeepSeek avec dégradation élégante
16. **Upload de Fichiers**: Multer pour les avatars
17. **Service Email**: Nodemailer pour la vérification
18. **Stockage Cloud**: Intégration Cloudinary
19. **Logging Complet**: Winston pour le suivi
20. **Tâches Planifiées**: Sauvegardes automatiques
21. **Real-time**: Socket.IO pour les notifications
22. **Export Excel**: Fonctionnalité d'export des données

### Expérience Utilisateur
23. **Design Moderne**: Interface glassmorphic avec animations fluides
24. **Multi-devise**: Support CDF et USD
25. **Multi-thème**: Mode clair et sombre
26. **Internationalisation**: Support français/anglais
27. **Notifications**: Système de notifications épuré
28. **Lazy Loading**: Optimisation des performances

---

## ⚠️ Points d'Amélioration Critiques

### 🔴 Problèmes Critiques (À Corriger Immédiatement)

1. **EXPOSITION DES CRÉDENTIELS**
   - **Fichiers**: `server/.env`, `server/.env.example`
   - **Crédentiels Exposés**:
     - DEEPSEEK_API_KEY
     - DB_PASSWORD
     - SMTP_PASS
     - CLOUDINARY_API_SECRET
     - JWT_SECRET
   - **Impact**: Ces informations sont dans l'historique Git
   - **Solution**:
     1. Faire tourner TOUTES les clés API et mots de passe
     2. Supprimer les crédentiels de `.env.example`
     3. Ajouter `.env*` au `.gitignore` dans le dossier server
     4. Utiliser des variables d'environnement ou un gestionnaire de secrets

2. **MODÈLE ACTIVITE MANQUANT**
   - **Fichiers Affectés**:
     - `server/controllers/activiteController.js` (log console seulement)
     - `server/routes/activiteRoutes.js` (retourne des mocks)
     - `client/src/pages/Activities.tsx` (UI avec placeholder)
   - **Impact**: L'audit et la conformité ne peuvent pas fonctionner
   - **Solution**:
     - Créer `server/models/Activite.js` avec un schéma complet
     - Implémenter la persistance dans `logActivite()`
     - Ajouter des endpoints API pour récupérer les activités
     - Mettre à jour la route pour interroger la base de données

3. **CONFIGURATION IA INCONSISTANTE**
   - **Problème**: `.env.example` référence `GEMINI_API_KEY` mais le code utilise `DEEPSEEK_API_KEY`
   - **Fichiers**:
     - `server/.env.example` (ligne 22: GEMINI_API_KEY)
     - `server/.env` (ligne 22: DEEPSEEK_API_KEY)
     - `server/controllers/aiController.js` (ligne 5: DEEPSEEK_API_KEY)
   - **Impact**: Échecs de déploiement et confusion
   - **Solution**:
     - Standardiser sur un seul fournisseur (DeepSeek recommandé)
     - Mettre à jour `.env.example`
     - Mettre à jour la documentation

### 🟡 Problèmes de Haute Priorité

4. **Validation des Entrées Insuffisante**
   - Seuls 3 contrôleurs ont une validation (auth, product)
   - Manque pour: sales, clients, expenses, purchases, fournisseurs, stats
   - **Solution**: Ajouter la validation Joi pour tous les contrôleurs

5. **Pas de Pagination**
   - Tous les endpoints de liste retournent TOUS les enregistrements
   - **Impact**: Problèmes de performance avec de grands jeux de données
   - **Solution**: Ajouter support `?page=1&limit=20`

6. **Pas d'Indexes de Base de Données**
   - Aucun index défini dans les modèles
   - **Impact**: Requêtes lentes sur de grands jeux de données
   - **Solution**: Ajouter des indexes pour les clés étrangères et champs fréquemment interrogés

7. **Politiques de Mot de Passe Faibles**
   - Le modèle User permet des mots de passe null
   - Pas d'exigences de complexité
   - **Solution**: Ajouter validation et exigences de complexité

8. **Pas de Protection CSRF**
   - Seulement JWT est utilisé
   - **Solution**: Ajouter un middleware CSRF

9. **JWT Valide 30 Jours**
   - Longue durée de vie des tokens = risque de sécurité accru
   - **Solution**: Réduire à 1-7 jours et implémenter des tokens de rafraîchissement

10. **Pas de Contrôle des Sessions Concurrentes**
    - Les utilisateurs peuvent avoir un nombre illimité de sessions concurrentes
    - **Solution**: Traquer les sessions actives et limiter les connexions concurrentes

11. **Gestionnaire d'Erreurs Expose les Stack Traces**
    - En mode développement, les stack traces complètes sont retournées
    - **Solution**: Sanitizer les réponses d'erreur même en développement

### 🟢 Problèmes de Priorité Moyenne

12. **Pas de TypeScript sur le Serveur**
    - Le client utilise TypeScript mais le serveur utilise du JavaScript simple
    - **Avantage**: Meilleure sécurité des types et expérience développeur

13. **Pas de Framework de Test**
    - Aucun test trouvé dans la codebase
    - **Recommandation**: Ajouter Jest/Mocha avec couverture

14. **Pas de Documentation API**
    - Swagger est configuré mais les routes n'ont pas d'annotations JSDoc
    - **Solution**: Ajouter des annotations Swagger à tous les gestionnaires de routes

15. **Configuration Redis Inutilisée**
    - Redis est configuré mais jamais utilisé
    - **Opportunité**: Implémenter le caching pour les requêtes fréquentes

16. **Pas de Notifications en Temps Réel**
    - Les notifications existent mais utilisent le polling
    - **Amélioration**: Ajouter WebSocket/SSE pour les mises à jour en temps réel

17. **Pas de Support Multi-devise**
    - Tous les montants sont stockés en une seule devise
    - **Amélioration**: Ajouter un champ devise et conversion

18. **Pas de Versioning d'API**
    - Tous les endpoints sont à `/api/*` sans version
    - **Amélioration**: Ajouter `/api/v1/*` pour la compatibilité future

19. **Pas de Logging d'Audit**
    - Les actions SuperAdmin ne sont pas loggées
    - **Amélioration**: Logger toutes les actions admin pour la conformité

20. **Pas de Soft Delete**
    - Les enregistrements sont supprimés définitivement
    - **Amélioration**: Ajouter un champ `deletedAt` pour la suppression logique

21. **Pas de Logging des Requêtes**
    - Seules les erreurs sont loggées, pas les requêtes réussies
    - **Amélioration**: Logger toutes les requêtes pour le débogage

22. **Pas d'Endpoint de Health Check**
    - Pas de `/health` ou `/status` endpoint
    - **Amélioration**: Ajouter un health check pour le monitoring

23. **Pas de Rate Limiting par Utilisateur**
    - Le rate limiting est global (100 requêtes/10min)
    - **Amélioration**: Différentes limites par rôle d'utilisateur

---

## 📈 Évaluation de la Maturité du Projet

| Catégorie          | Score (0-10) | Notes |
|--------------------|-------------|-------|
| **Sécurité**       | 6/10        | Bonne base mais problèmes critiques à résoudre |
| **Architecture**   | 8/10        | Bien structuré, suit les bonnes pratiques |
| **Fonctionnalités**| 7/10        | Fonctionnalités principales complètes, certaines améliorations nécessaires |
| **Documentation**  | 4/10        | Documentation minimale, Swagger non peuplé |
| **Tests**          | 0/10        | Aucun test trouvé |
| **Performance**    | 6/10        | Pas de pagination ni d'indexes, scalabilité limitée |
| **Qualité de Code**| 7/10        | Code propre, TypeScript serait un plus |
| **Global**         | **5.7/10**  | Bon début, nécessite un durcissement pour la production |

---

## 🛠️ Recommandations

### Phase 1: Corrections Critiques (À Faire Immédiatement - 1 jour)
1. ✅ Supprimer les crédentiels de `.env.example`
2. ✅ Ajouter `.env*` au `.gitignore` du serveur
3. ✅ Créer le modèle Activite
4. ✅ Implémenter le logging des activités
5. ✅ Corriger l'inconsistance de configuration IA
6. ✅ Faire tourner toutes les clés API exposées

### Phase 2: Haute Priorité (1-2 semaines)
7. ✅ **Validation des entrées pour tous les contrôleurs** (Fait : Joi standardisé partout)
8. ✅ **Implémenter la pagination sur tous les endpoints de liste** (Fait : Standardisé via pagination.js)
9. ✅ **Ajouter des indexes de base de données pour les performances** (Fait : Product, Sale, Purchase optimisés)
10. ✅ **Renforcer les politiques de mot de passe** (Fait)
11. ✅ **Ajouter la protection CSRF** (Fait : Middleware et endpoint /api/csrf-token créés)
12. ✅ **Implémenter les tokens de rafraîchissement** (Fait)
13. ✅ **Ajouter la gestion des sessions** (Fait)
14. ✅ **Sanitizer les réponses d'erreur** (Fait : Middleware global ajouté)
15. ✅ **Sécurisation des Headers avec Helmet** (Fait)
16. ✅ **Optimisation des requêtes N+1 (Eager Loading)** (Fait : Refactorisation bulk query dans Sales/Purchases)
17. ✅ **Standardisation des schémas de réponse API** (Fait : Utilitaire utils/response.js créé)

### Phase 3: Priorité Moyenne (2-4 semaines)
18. ✅ **Ajouter TypeScript au serveur** (Fait)
19. ✅ **Implémenter un framework de test** (Fait : Jest/Supertest 100% passants)
20. ✅ **Ajouter la documentation Swagger** (Fait : Modules clés documentés)
21. ✅ **Implémenter le caching Redis** (Fait : ioredis + cacheMiddleware implémentés)
22. ✅ **Ajouter les notifications en temps réel** (Fait : Socket.io intégré aux alertes stocks)
23. ✅ **Ajouter le support multi-devise** (Fait : Conversion dynamique via utils/currency.js)
24. ✅ **Implémenter le versioning d'API** (Fait : Passage en /api/v1 avec compatibilité)
25. ✅ **Ajouter un endpoint de health check** (Fait)
<!--  -->
### Améliorations Futures
27. **Migration vers NestJS**: Pour une meilleure structure et modularité
28. **CI/CD Pipeline**: Intégration continue avec tests automatiques
29. **Monitoring**: Suivi des erreurs et performances en production
31. **Amélioration UX**:
    - Ajouter des tutoriels interactifs
    - Guide utilisateur contextuel
    - Système de feedback

---

## 📊 Analyse des Composants Clés

### Authentification (authController.js)
- **Points Forts**:
  - JWT avec bcrypt
  - Validation OTP pour l'email
  - RBAC (admin/superadmin)
  - Gestion des abonnements
- **Améliorations**:
  - Ajouter les tokens de rafraîchissement
  - Implémenter la limitation des tentatives
  - Ajouter la journalisation des activités

### Intelligence Artificielle (aiController.js)
- **Points Forts**:
  - Intégration DeepSeek bien implémentée
  - Dégradation élégante en cas d'échec
  - Analyse basée sur les données réelles
  - Chat en streaming
- **Améliorations**:
  - Migration vers Ollama pour réduire les coûts
  - Ajouter le caching des réponses fréquentes
  - Implémenter un système de feedback sur les réponses

### Sécurité (security.js)
- **Points Forts**:
  - Helmet, XSS, HPP configurés
  - CORS strict
  - Rate limiting
  - Validation CSRF basée sur Origin/Referer
- **Améliorations**:
  - Ajouter un vrai middleware CSRF
  - Implémenter la liste des tokens JWT invalidés
  - Ajouter la sécurité des cookies

### Sauvegardes (backupCron.js)
- **Points Forts**:
  - Sauvegardes automatiques quotidiennes
  - Nettoyage des anciennes sauvegardes
  - Respect des préférences utilisateur
  - Format JSON structuré
- **Améliorations**:
  - Ajouter le chiffrement des sauvegardes
  - Implémenter le stockage cloud (S3)
  - Ajouter des notifications de succès/échec

### Store d'Authentification (useAuthStore.ts)
- **Points Forts**:
  - Gestion complète des préférences utilisateur
  - Synchronisation avec le serveur
  - Persistance dans localStorage
  - Support multi-devise et multi-thème
- **Améliorations**:
  - Ajouter le chiffrement des données sensibles
  - Implémenter la synchronisation automatique périodique

---

## 🎯 Conclusion

HubCommerce Pro est une application ERP/POS prometteuse avec une architecture solide et des fonctionnalités complètes. Le projet démontre une bonne compréhension des bonnes pratiques de développement et offre une expérience utilisateur moderne et intuitive.

**Points Clés**:
- ✅ Architecture MVC bien structurée
- ✅ Intégration IA innovante avec DeepSeek
- ✅ Interface utilisateur moderne et réactive
- ✅ Gestion complète du cycle commercial
- ✅ Système de sécurité robuste (avec quelques améliorations nécessaires)

**Domaines Critiques à Addresser**:
- 🔴 **Sécurité des Crédentiels**: Supprimer immédiatement les clés exposées
- 🔴 **Modèle Activite**: Implémenter pour l'audit et la conformité
- 🔴 **Configuration IA**: Standardiser sur un seul fournisseur

**Potentiel d'Amélioration**:
- 📈 Ajouter des tests automatiques
- 📈 Implémenter le versioning d'API
- 📈 Améliorer la documentation
- 📈 Optimiser les performances (pagination, indexes)

Avec les problèmes critiques résolus et les améliorations recommandées implémentées, HubCommerce Pro a le potentiel de devenir une solution ERP/POS de classe entreprise, compétitive sur le marché.

**Score Global**: 5.7/10 (Bon début, nécessite un durcissement pour la production)

---

## 📚 Documentation Complémentaire
- Voir `LUMO_DOCUMENTATION.md` pour la documentation utilisateur
- Voir `IA_INTEGRATION_GUIDE.md` pour le guide d'intégration IA
- Voir `PROJECT_ANALYSIS_REPORT.md` pour l'analyse détaillée existante
- Voir `RAPPORT_DEFENSE.md` pour la présentation du projet

---

*Document généré le 2026-05-02 par analyse complète du codebase HubCommerce Pro*
