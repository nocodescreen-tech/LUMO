# DOCUMENTATION TECHNIQUE FINALE ET COMPLÈTE DU PROJET LUMO
## PROGISEL DE GESTION COMMERCIALE (ERP/POS CLOUD INTÉGRÉ)
### Stack PERN (PostgreSQL, Express, React, Node) & Assistant Analytique IA DeepSeek

---

## 1. AVANT-PROPOS ET PORTÉE DU PROJET
Ce document constitue la référence technique ultime et exhaustive pour la conception, le développement, la maintenance et le déploiement cloud de la plateforme **LUMO** (Logical Unified Management Operations). 

Conçu pour répondre aux exigences académiques les plus strictes d'un projet tutoré en Sciences et Technologies (orientation Réseaux et Génie Logiciel) ainsi qu'aux réalités opérationnelles des PME en République Démocratique du Congo (RDC), ce document décrit de bout en bout l'architecture du système, la planification financière, l'analyse du code source et l'implémentation de la sécurité.

---

## 2. PLANIFICATION ET INGENIERIE DE PROJET

### 2.1 Cadre Logique Détaillé (Matrice R&D)
Le cadre logique de LUMO associe chaque phase de développement à des indicateurs clés (KPI) et à des mécanismes de vérification. Contrairement aux modèles théoriques, ce cadre intègre les vrais coûts opérationnels Cloud.

```text
Objectif Global : Déployer un ERP/POS Cloud capable d'opérer dans un environnement à réseau instable et à double monnaie (USD/CDF).
```

*   **Objectif Spécifique 1 (Conception & Modélisation) :**
    *   *Indicateur :* Schéma ERD (relationnel) validé en 3NF. Diagrammes de cas d'utilisation, classes et séquences finalisés sous format UML 2.0.
    *   *Activités :* Audit des failles des boutiques de Kinshasa, modélisation conceptuelle de l'isolation des données (multi-tenancy).
    *   *Coût direct :* 0.00 USD (Autoproduction).
*   **Objectif Spécifique 2 (API REST Backend) :**
    *   *Indicateur :* API REST opérationnelle sur Node.js/Express avec 100 % d'intégration Sequelize. Couverture de test unitaire Jest > 80 %.
    *   *Activités :* Écriture des contrôleurs d'authentification, de ventes POS, d'inventaire, de trésorerie et d'isolation par tenant.
    *   *Coût direct :* 0.00 USD.
*   **Objectif Spécifique 3 (POS & Interface React) :**
    *   *Indicateur :* Console de vente réactive React 18 utilisant Zustand pour le state management. Intégration Socket.IO opérationnelle pour les notifications temps réel.
    *   *Activités :* Développement des écrans POS, de l'historique des ventes, du suivi des dettes et de l'historique de caisse.
    *   *Coût direct :* 0.00 USD.
*   **Objectif Spécifique 4 (Intégration DeepSeek AI & Multi-Devises) :**
    *   *Indicateur :* Assistant LUMO AIO capable de générer des analyses prédictives. Normalisation mathématique au centime près pour les transactions USD/CDF.
    *   *Activités :* Intégration du SDK OpenAI compatible DeepSeek API, écriture des convertisseurs `currencyHelpers.ts` et `printHelpers.ts`.
    *   *Coût direct :* 100.00 USD (tokens R&D).
*   **Objectif Spécifique 5 (Déploiement Cloud & Monitoring) :**
    *   *Indicateur :* Hébergement fonctionnel sous HTTPS sur Railway PaaS. Logs de performance et bogues suivis dans Sentry.
    *   *Activités :* Paramétrage des builds Nixpacks, des variables d'environnement, achat du nom de domaine personnalisé et tests d'intégration.
    *   *Coût direct :* 207.00 USD (Railway Pro + Data internet).

---

### 2.2 Chronogramme de Réalisation Agile
La planification s'organise sur **18 semaines réelles** (de janvier à mai 2026). Chaque phase produit un livrable évaluable.

*   **Semaines 1 à 4 (Jalon M1 - 15 Janvier) : Étude Préalable & Modélisation**
    *   *Livrables :* Spécification des besoins, MCD (Modèle Conceptuel de Données), diagrammes UML.
*   **Semaines 5 à 8 (Jalon M2 - 15 Février) : Fondations Backend & Trésorerie**
    *   *Livrables :* Schéma de base de données PostgreSQL migré avec Sequelize, routes API REST pour l'authentification et les membres d'équipe.
*   **Semaines 9 à 12 (Jalon M3 - 15 Mars) : POS & Gestion Commerciale**
    *   *Livrables :* Développement des contrôleurs de vente (`SaleController`), d'achat (`PurchaseController`) et de caisse (`CashController`). Intégration de la persistance transactionnelle ACID.
*   **Semaines 13 à 15 (Jalon M4 - 15 Avril) : Frontend React & WebSockets**
    *   *Livrables :* Intégration des composants graphiques React, state-store Zustand (panier POS, session utilisateur), et diffusion des alertes par Socket.IO.
*   **Semaines 16 à 18 (Jalon M5 - 20 Mai) : Services Avancés & Mise en Production**
    *   *Livrables :* Branchement de l'API DeepSeek AI, configuration de l'envoi d'e-mails Resend, paramétrage de PM2 pour le clustering backend et déploiement final sur Railway.app.

---

### 2.3 Structure Budgétaire Précise

#### 2.3.1 Capital de Démarrage et Logistique R&D (CapEx)
Ce budget de 3 500,00 USD est indispensable pour la phase de création et de codage en République Démocratique du Congo :

*   **Poste 1 : Matériel & Amortissement local (1 200,00 USD)**
    *   *Justification :* PC portables de développement (2 unités de type station de travail) et onduleurs/régulateurs de tension pour protéger le matériel face aux fluctuations de tension fréquentes sur le réseau SNEL à Kinshasa.
*   **Poste 2 : Autonomie Énergétique (612,31 USD)**
    *   *Justification :* Achat de carburant pour l'alimentation de secours (générateur local) durant les phases critiques de développement intensif.
*   **Poste 3 : Connectivité R&D (320,00 USD)**
    *   *Justification :* Forfaits de données mobiles haut débit (liaison LTE 4G dédiée) sur 5 mois pour la liaison avec les dépôts Git et l'accès cloud.
*   **Poste 4 : Hébergement Pro de Pré-production (360,00 USD)**
    *   *Justification :* Location d'un VPS managé pour les phases de tests d'intégration multijoueurs de l'application.
*   **Poste 5 : Services API & Cadre Légal (200,00 USD)**
    *   *Justification :* Achat du nom de domaine, enregistrement de la propriété intellectuelle du logiciel en RDC et crédits API initiaux pour l'IA.
*   **Poste 6 : Main-d'œuvre Technique (807,69 USD)**
    *   *Justification :* Rémunération de l'équipe technique d'ingénieurs (30% du budget).

#### 2.3.2 Budget d'Exploitation SaaS Réel (OpEx)
Une fois l'application déployée dans le Cloud, le coût d'exploitation s'adapte à l'usage réel du service, offrant une réduction massive des coûts par rapport aux solutions classiques.

```text
Coût MVP (Développement) : ~2.00 USD / mois (uniquement la consommation de tokens de l'API DeepSeek)
Coût Production (10 boutiques actives) : 40.00 USD / mois (Railway Pro + DB PostgreSQL + Redis Cache + DeepSeek AI + domaine)
Coût Scale (100 boutiques actives) : 95.00 USD / mois
```

---

## 3. ARCHITECTURE TECHNIQUE COMPLÈTE

### 3.1 Schéma d'Architecture Applicative
L'application LUMO est structurée selon une architecture découplée de type client-serveur web :

```text
                  ┌──────────────────────────────────────────────┐
                  │                 CLIENT REACT                 │
                  │   Components (POS, Dashboard, Stats...)      │
                  │   State Management (Zustand Stores)          │
                  │   API calls (Axios Service)                  │
                  └──────────────────────────────────────────────┘
                                  ▲              ▲
                      HTTPS Calls │              │ WebSocket Connection
                                  ▼              ▼
                  ┌──────────────────────────────────────────────┐
                  │              SERVEUR CLOUD API               │
                  │   Express Web Server (Node.js API)           │
                  │   Middlewares (Auth JWT, RBAC, validators)   │
                  │   Controllers & Sequelize ORM Logic          │
                  └──────────────────────────────────────────────┘
                            ▲             ▲            ▲
             DB Transaction │   Cache hit │    Logging │  AI Calls
                            ▼             ▼            ▼
                   ┌────────────┐   ┌───────────┐ ┌──────────┐ ┌──────────────┐
                   │ PostgreSQL │   │   Redis   │ │  Sentry  │ │ DeepSeek API │
                   │  Database  │   │ Session & │ │  Errors  │ │  (AI LLM)  │
                   │ (Sequelize)│   │ Blacklist │ │ Capturing│ │ Pay-per-use│
                   └────────────┘   └───────────┘ └──────────┘ └──────────────┘
```

---

### 3.2 Structure Complète du Code Source

```text
lumo-project/
├── client/                     # Module Frontend (React 18 / TypeScript / Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts        # Configuration du client Axios, intercepteur de tokens
│   │   ├── components/
│   │   │   └── dashboard/
│   │   │       └── DashboardCharts.tsx  # Graphiques de performance (SVG personnalisés)
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── ForgotPassword.tsx   # Demande d'OTP de réinitialisation
│   │   │   │   ├── Login.tsx            # Formulaire de connexion
│   │   │   │   ├── Register.tsx         # Formulaire d'inscription boutique
│   │   │   │   ├── ResetPassword.tsx    # Réinitialisation définitive
│   │   │   │   ├── VerifyEmail.tsx      # Vérification de l'adresse e-mail par OTP
│   │   │   │   └── VerifyResetOTP.tsx   # Vérification du code OTP de récupération
│   │   │   ├── Cash.tsx                 # Sessions de caisse (ouverture/clôture)
│   │   │   ├── Clients.tsx              # Gestion du portefeuille clients et dettes
│   │   │   ├── Dashboard.tsx            # Console générale de statistiques (CA, bénéfice)
│   │   │   ├── Dettes.tsx               # Suivi et règlement des créances commerciales
│   │   │   ├── POS.tsx                  # Terminal Point de Vente avec panier temps réel
│   │   │   ├── Products.tsx             # Gestion du catalogue (produits, prix, stocks)
│   │   │   ├── Purchases.tsx            # Saisie des entrées en stock (achats fournisseurs)
│   │   │   ├── Sales.tsx                # Historique des ventes, remboursements et suppressions
│   │   │   ├── Settings.tsx             # Profil, devise de base, taux de change et 2FA setup
│   │   │   ├── Stats.tsx                # Statistiques avancées et impression de bilans PDF
│   │   │   └── Users.tsx                # Gestion des membres de l'équipe (RBAC)
│   │   ├── store/
│   │   │   ├── useAuthStore.ts          # État global de l'authentification et préférences
│   │   │   ├── useCartStore.ts          # Gestion du panier POS avec conversion de devises
│   │   │   └── useSettingsStore.ts      # Paramètres de l'interface
│   │   ├── utils/
│   │   │   ├── currencyHelpers.ts       # Outil de normalisation et conversion USD/CDF
│   │   │   ├── exportUtils.ts           # Service d'exportation Excel (xlsx)
│   │   │   └── printHelpers.ts          # Générateur d'impressions A4/thermique (Factures, rapports)
│   │   └── index.css                    # Design system (variables HSL, glassmorphism, animations)
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Module Backend (Node.js / Express / Sequelize)
│   ├── config/
│   │   ├── database.js          # Paramètres de connexion PostgreSQL
│   │   └── redis.js             # Configuration du client Redis
│   ├── controllers/
│   │   ├── aiController.js      # Contrôleur d'interactions IA DeepSeek Chat & Insights
│   │   ├── authController.js    # Contrôleur d'authentification (2FA, sessions, registre)
│   │   ├── cashController.js    # Contrôleur de gestion des sessions de caisse
│   │   ├── clientController.js  # Contrôleur clients (règlements dettes, rappels email)
│   │   ├── productController.js # Contrôleur d'inventaire et mouvements de stock
│   │   ├── purchaseController.js# Contrôleur des entrées d'approvisionnement
│   │   └── saleController.js    # Contrôleur POS (validation de ventes sous transaction ACID)
│   ├── middleware/
│   │   ├── authMiddleware.js    # Middleware de sécurité JWT, RBAC et isolation de tenant
│   │   ├── cacheMiddleware.js   # Middleware de cache statistique Redis (5-10 min)
│   │   └── validators.js        # Validateurs de payload Joi (sécurité d'injection)
│   ├── models/
│   │   ├── index.js             # Initialisation de Sequelize et gestion des relations
│   │   ├── User.js              # Modèle Utilisateur/Entreprise (tenant racine)
│   │   ├── Product.js           # Modèle Produit (avec hooks de détection stock bas)
│   │   ├── Sale.js              # Modèle Vente
│   │   ├── SaleItem.js          # Modèle Ligne d'article vendu (marge, devise d'origine)
│   │   ├── Purchase.js          # Modèle Achat fournisseur
│   │   ├── PurchaseItem.js      # Modèle Ligne d'article acheté
│   │   ├── Client.js            # Modèle Client (solde de dettes normalisé)
│   │   ├── StockMovement.js     # Modèle Mouvement de stock (ENTRÉE/SORTIE/AJUSTEMENT)
│   │   ├── CashSession.js       # Modèle Session de caisse (solde attendu, solde compté)
│   │   └── Activite.js          # Modèle Log d'audit (traçabilité de sécurité)
│   ├── routes/
│   │   ├── authRoutes.js        # Routes authentification et profils
│   │   ├── productRoutes.js     # Routes inventaires
│   │   ├── saleRoutes.js        # Routes POS et facturations
│   │   ├── cashRoutes.js        # Routes trésorerie
│   │   ├── clientRoutes.js      # Routes clients
│   │   └── aiRoutes.js          # Routes assistant IA et suggestions
│   ├── utils/
│   │   ├── emailService.js      # Service d'envoi d'e-mails (SMTP / Resend API fallback)
│   │   └── cache.js             # Wrapper d'interventions Redis
│   ├── server.js                # Fichier d'entrée de l'API Express & Socket.IO
│   └── package.json
```

---

## 4. BASE DE DONNÉES ET SCHÉMAS DE PERSISTANCE (POSTGRESQL + ORM SEQUELIZE)

### 4.1 Modélisation Conceptuelle de la Base de Données (MCD)
La persistance des données dans LUMO repose sur une base PostgreSQL relationnelle. La modélisation garantit l'intégrité référentielle en cascade et empêche la corruption des données comptables.

```text
  ┌───────────────────────────────────┐
  │               User                │
  ├───────────────────────────────────┤
  │ id : UUID [PK]                    │
  │ nom : VARCHAR                     │
  │ email : VARCHAR [Unique]          │
  │ motDePasse : VARCHAR (Hash)       │
  │ role : ENUM                       │
  │ permissions : JSONB               │
  │ parentId : UUID [FK -> User.id]   │
  │ activeSessions : JSONB            │
  │ entreprise : JSONB (nom, devise)  │
  └───────────────────────────────────┘
         │ 1
         │
         ├─────────────────────────────────────────┐
         │ N                                       │ N
  ┌───────────────────────────────────┐     ┌───────────────────────────────────┐
  │             Product               │     │               Sale                │
  ├───────────────────────────────────┤     ├───────────────────────────────────┤
  │ id : UUID [PK]                    │     │ id : UUID [PK]                    │
  │ nom : VARCHAR                     │     │ userId : UUID [FK -> User.id]     │
  │ prix : DECIMAL (Vente)            │     │ montantTotal : DECIMAL            │
  │ prixAchat : DECIMAL               │     │ devise : VARCHAR                  │
  │ stock : DECIMAL                   │     │ tauxChange : DECIMAL              │
  │ stockAlerte : DECIMAL             │     │ methodePaiement : VARCHAR         │
  │ devise : VARCHAR (USD/CDF)        │     │ clientId : UUID [FK -> Client.id] │
  │ userId : UUID [FK -> User.id]     │     │ profitNet : DECIMAL               │
  └───────────────────────────────────┘     └───────────────────────────────────┘
         │ 1                                       │ 1
         │                                         │
         │ N                                       │ N
  ┌───────────────────────────────────┐     ┌───────────────────────────────────┐
  │          StockMovement            │     │             SaleItem              │
  ├───────────────────────────────────┤     ├───────────────────────────────────┤
  │ id : UUID [PK]                    │     │ id : UUID [PK]                    │
  │ productId : UUID [FK -> Prod.id]  │     │ saleId : UUID [FK -> Sale.id]     │
  │ type : ENUM (ENTREE/SORTIE)       │     │ nom : VARCHAR                     │
  │ quantite : DECIMAL                │     │ quantite : DECIMAL                │
  │ ancienStock : DECIMAL             │     │ prixUnitaire : DECIMAL            │
  │ nouveauStock : DECIMAL            │     │ prixAchat : DECIMAL               │
  │ raison : VARCHAR                  │     │ totalLigneCDF : DECIMAL           │
  └───────────────────────────────────┘     └───────────────────────────────────┘
```

---

### 4.2 Code Source d'Initialisation et d'Associations des Modèles (`server/models/index.js`)

```javascript
// server/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const databaseConfig = require('../config/database');

const sequelize = new Sequelize(databaseConfig.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

// Importation des modèles
const User = require('./User')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const Sale = require('./Sale')(sequelize, DataTypes);
const SaleItem = require('./SaleItem')(sequelize, DataTypes);
const Purchase = require('./Purchase')(sequelize, DataTypes);
const PurchaseItem = require('./PurchaseItem')(sequelize, DataTypes);
const Client = require('./Client')(sequelize, DataTypes);
const StockMovement = require('./StockMovement')(sequelize, DataTypes);
const CashSession = require('./CashSession')(sequelize, DataTypes);
const Activite = require('./Activite')(sequelize, DataTypes);

// Déclaration des relations et associations

// 1. Relations Multi-Tenant (Données rattachées à l'administrateur de la boutique)
User.hasMany(User, { as: 'TeamMembers', foreignKey: 'parentId', onDelete: 'CASCADE' });
User.belongsTo(User, { as: 'ParentAdmin', foreignKey: 'parentId' });

User.hasMany(Product, { foreignKey: 'userId', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Sale, { foreignKey: 'userId', onDelete: 'CASCADE' });
Sale.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Purchase, { foreignKey: 'userId', onDelete: 'CASCADE' });
Purchase.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Client, { foreignKey: 'userId', onDelete: 'CASCADE' });
Client.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CashSession, { foreignKey: 'userId', onDelete: 'CASCADE' });
CashSession.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Activite, { foreignKey: 'userId', onDelete: 'CASCADE' });
Activite.belongsTo(User, { foreignKey: 'userId' });

// 2. Relations Commerciales Spécifiques
Sale.hasMany(SaleItem, { as: 'items', foreignKey: 'saleId', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });

Purchase.hasMany(PurchaseItem, { as: 'items', foreignKey: 'purchaseId', onDelete: 'CASCADE' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId' });

Client.hasMany(Sale, { foreignKey: 'clientId' });
Sale.belongsTo(Client, { foreignKey: 'clientId' });

// 3. Mouvements de stock
Product.hasMany(StockMovement, { foreignKey: 'productId', onDelete: 'CASCADE' });
StockMovement.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(StockMovement, { foreignKey: 'userId', onDelete: 'CASCADE' });
StockMovement.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Product,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  Client,
  StockMovement,
  CashSession,
  Activite
};
```

---

### 4.3 Définition du Modèle de Détection Automatique de Stock Bas (`server/models/Product.js`)

Ce modèle intègre un hook de cycle de vie Sequelize `afterSave` qui détecte si le stock physique est modifié et écrit de manière autonome un mouvement de stock dans la table d'audit `StockMovement`. Il émet aussi une notification instantanée si le stock passe sous le seuil d'alerte.

```javascript
// server/models/Product.js
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prix: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    prixAchat: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    stock: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.000
    },
    stockAlerte: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 5.000
    },
    devise: {
      type: DataTypes.ENUM('USD', 'CDF'),
      allowNull: false,
      defaultValue: 'USD'
    },
    codeBarre: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categorie: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Général'
    },
    unite: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pcs'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    paranoid: true, // Soft-delete pour ne pas détruire l'historique comptable
    hooks: {
      afterSave: async (product, options) => {
        // Détecter si le stock a changé pour insérer un mouvement
        if (product.changed('stock')) {
          const isNewRecord = options.isNewRecord || false;
          const ancienStock = isNewRecord ? 0.000 : Number(product.previous('stock') || 0.000);
          const nouveauStock = Number(product.stock);
          const difference = nouveauStock - ancienStock;
          
          if (difference !== 0) {
            const { StockMovement } = sequelize.models;
            
            // Création du mouvement de stock traçable
            await StockMovement.create({
              productId: product.id,
              userId: product.userId,
              type: difference > 0 ? 'ENTREE' : 'SORTIE',
              quantite: Math.abs(difference),
              ancienStock,
              nouveauStock,
              raison: product.stockUpdateRaison || (isNewRecord ? 'Initialisation catalogue' : 'Ajustement manuel')
            }, { transaction: options.transaction });

            // Alerte de stock bas
            const seuil = Number(product.stockAlerte || 5.000);
            if (nouveauStock < seuil && ancienStock >= seuil) {
              const { Notification } = sequelize.models;
              if (Notification) {
                await Notification.create({
                  userId: product.userId,
                  titre: 'Alerte Stock Bas',
                  contenu: `Le produit "${product.nom}" a atteint un niveau critique de stock : ${nouveauStock} ${product.unite} restants.`,
                  type: 'WARNING'
                }, { transaction: options.transaction });
              }
              
              // Diffuser en temps réel via Socket.IO global si configuré
              if (global.io) {
                global.io.to(`user_${product.userId}`).emit('stock_alert', {
                  productId: product.id,
                  nom: product.nom,
                  stock: nouveauStock,
                  unite: product.unite
                });
              }
            }
          }
        }
      }
    }
  });

  return Product;
};
```

---

## 5. MIDDLEWARES ET VALIDATION DE SÉCURITÉ (DEFENSE EN PROFONDEUR)

### 5.1 Middleware d'Authentification, Isolation Tenant & RBAC (`server/middleware/authMiddleware.js`)

Ce middleware valide le token JWT, vérifie que le `sessionId` n'a pas été invalidé (logout ou session révoquée), calcule le `tenantId` de la boutique pour l'isolation des données, et implémente le contrôle d'accès basé sur les rôles (RBAC).

```javascript
// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 1. Validation de session et calcul du tenant de données
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Accès non autorisé. Token manquant." });
  }

  try {
    // Valider la signature du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Charger l'utilisateur
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "L'utilisateur propriétaire de ce token n'existe plus." });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: "Accès refusé. Ce compte a été suspendu." });
    }

    // Vérifier si la session est toujours active dans le tableau de sessions du modèle
    const sessions = user.activeSessions || [];
    const sessionExists = sessions.some(s => s.sessionId === decoded.sessionId);
    
    if (!sessionExists) {
      return res.status(401).json({ message: "Session révoquée. Veuillez vous reconnecter." });
    }

    // Définir les variables de requête pour l'isolation multi-tenant
    req.user = user;
    req.tenantId = user.parentId || user.id; // Isolation boutique
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou session expirée." });
  }
};

// 2. Contrôle RBAC (Role-Based Access Control)
exports.checkPermission = (permissionId) => {
  return (req, res, next) => {
    // Les comptes administrateurs et super-administrateurs ont accès à tout par défaut
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];

    // Validation directe de la permission
    if (userPermissions.includes(permissionId)) {
      return next();
    }

    // Héritage de module parent (ex. 'products.add' hérite de 'products')
    const parentModule = permissionId.includes('.') ? permissionId.split('.')[0] : null;
    if (parentModule && userPermissions.includes(parentModule)) {
      return next();
    }

    return res.status(403).json({
      message: `Accès refusé. Vous ne possédez pas le privilège requis : [${permissionId}]`
    });
  };
};
```

---

### 5.2 Middleware de cache statistique distribué Redis (`server/middleware/cacheMiddleware.js`)

Pour optimiser le Point de Vente et soulager la base de données PostgreSQL, ce middleware met en cache les résultats des requêtes d'agrégation de ventes lourdes.

```javascript
// server/middleware/cacheMiddleware.js
const redisClient = require('../config/redis');

module.exports = (seconds) => {
  return async (req, res, next) => {
    // N'appliquer le cache que sur les requêtes de lecture GET
    if (req.method !== 'GET') {
      return next();
    }

    const tenantId = req.user ? req.user.tenantId : 'global';
    const cacheKey = `lumo_cache:${tenantId}:${req.originalUrl || req.url}`;

    try {
      if (!redisClient || !redisClient.isOpen) {
        return next();
      }

      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        // Cache Hit : Renvoyer directement le JSON sans solliciter PostgreSQL
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Cache Miss : Intercepter la réponse pour la stocker en cache avant envoi
      res.sendResponse = res.json;
      res.json = (body) => {
        if (res.statusCode === 200) {
          redisClient.setEx(cacheKey, seconds, JSON.stringify(body));
        }
        res.sendResponse(body);
      };

      next();
    } catch (err) {
      next(); // Continuer vers PostgreSQL en cas de panne Redis (dégradation élégante)
    }
  };
};
```

---

### 5.3 Validations de payloads d'API Joi (`server/middleware/validators.js`)

Ce validateur bloque les injections et données corrompues en amont de la base de données.

```javascript
// server/middleware/validators.js
const Joi = require('joi');

exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    nom: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().required().messages({
      'string.email': 'Le format de l\'adresse e-mail est invalide.'
    }),
    motDePasse: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
    }),
    entrepriseNom: Joi.string().min(2).max(100).required(),
    devise: Joi.string().valid('USD', 'CDF', 'FC').optional(),
    tauxChange: Joi.number().min(500).max(5000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

exports.validateProduct = (req, res, next) => {
  const schema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('', null).optional(),
    prix: Joi.number().min(0).required(),
    prixAchat: Joi.number().min(0).required(),
    stock: Joi.number().min(0).required(),
    stockAlerte: Joi.number().min(0).optional(),
    devise: Joi.string().valid('USD', 'CDF').optional(),
    codeBarre: Joi.string().allow('', null).optional(),
    categorie: Joi.string().max(50).optional(),
    unite: Joi.string().max(20).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
```

---

## 6. LOGIQUE MÉTIER ET CONTRÔLEURS BACKEND

### 6.1 Contrôleur POS, Trésorerie et Ventes (`server/controllers/saleController.js`)

Ce contrôleur valide une vente Point de Vente sous une transaction PostgreSQL atomique, décrémente les stocks, calcule le profit net normalisé en Francs Congolais et Dollar Américain, alimente la session de caisse ouverte du caissier et gère les écritures de dettes clients.

```javascript
// server/controllers/saleController.js
const { sequelize, Sale, SaleItem, Product, Client, CashSession } = require('../models');

exports.createSale = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, montantTotal, devise, tauxChange, methodePaiement, clientId, clientInfo, remise = 0 } = req.body;
    const tenantId = req.user.tenantId;

    // 1. Validation de caisse ouverte pour le caissier connecté
    const activeSession = await CashSession.findOne({
      where: { userId: req.user.id, status: 'OPEN' }
    });

    if (!activeSession) {
      throw new Error("Opération impossible. Aucune session de caisse n'est ouverte pour votre compte.");
    }

    // 2. Traitement du taux de change historique
    const rate = Number(tauxChange || req.user.preferences.exchangeRate || 2800);
    const shopCurrency = req.user.entreprise.devise === 'FC' ? 'CDF' : (req.user.entreprise.devise || 'CDF');
    const saleCurrency = devise || shopCurrency;

    let profitNormalized = 0;
    const itemRecords = [];

    // 3. Charger et valider l'intégrité des produits vendus
    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, userId: tenantId }
      }, { transaction });

      if (!product) {
        throw new Error(`Le produit "${item.nom}" n'existe pas ou a été supprimé.`);
      }

      if (Number(product.stock) < Number(item.quantite)) {
        throw new Error(`Stock physique insuffisant pour "${product.nom}". Restant : ${product.stock} ${product.unite}`);
      }

      // Décrémenter le stock physique du produit
      product.stock = Number(product.stock) - Number(item.quantite);
      product.stockUpdateRaison = 'Vente POS'; // Indique la raison du mouvement de stock
      await product.save({ transaction });

      // Normalisation des montants d'achat et vente pour le profit net
      const priceUnit = Number(item.prix);
      const costUnit = Number(product.prixAchat || 0);

      // Calcul des marges nettes de la ligne dans la devise boutique
      let priceInShopCurrency = priceUnit;
      let costInShopCurrency = costUnit;

      if (product.devise !== shopCurrency) {
        if (product.devise === 'USD' && shopCurrency === 'CDF') {
          priceInShopCurrency = priceUnit * rate;
          costInShopCurrency = costUnit * rate;
        } else if (product.devise === 'CDF' && shopCurrency === 'USD') {
          priceInShopCurrency = priceUnit / rate;
          costInShopCurrency = costUnit / rate;
        }
      }

      const lineProfit = (priceInShopCurrency - costInShopCurrency) * item.quantite;
      profitNormalized += lineProfit;

      // Construire l'enregistrement de l'article vendu
      itemRecords.push({
        nom: product.nom,
        quantite: item.quantite,
        prixUnitaire: priceUnit,
        prixAchat: costUnit,
        deviseOrigine: product.devise,
        tauxChange: rate,
        totalLigneCDF: product.devise === 'CDF' ? (priceUnit * item.quantite) : Math.round((priceUnit * item.quantite) * rate),
        totalLigneUSD: product.devise === 'USD' ? (priceUnit * item.quantite) : Math.round(((priceUnit * item.quantite) / rate) * 100) / 100
      });
    }

    // Déduire la remise du profit net global
    let remiseInShopCurrency = Number(remise);
    if (saleCurrency !== shopCurrency) {
      if (saleCurrency === 'USD' && shopCurrency === 'CDF') {
        remiseInShopCurrency = Number(remise) * rate;
      } else if (saleCurrency === 'CDF' && shopCurrency === 'USD') {
        remiseInShopCurrency = Number(remise) / rate;
      }
    }
    const finalProfitNet = Math.round((profitNormalized - remiseInShopCurrency) * 100) / 100;

    // Normalisation du montant total de vente en devise boutique
    let totalInShopCurrency = Number(montantTotal) - Number(remise);
    if (saleCurrency !== shopCurrency) {
      if (saleCurrency === 'USD' && shopCurrency === 'CDF') {
        totalInShopCurrency = (Number(montantTotal) - Number(remise)) * rate;
      } else if (saleCurrency === 'CDF' && shopCurrency === 'USD') {
        totalInShopCurrency = (Number(montantTotal) - Number(remise)) / rate;
      }
    }

    // 4. Résolution du client et gestion des dettes (ventes à crédit)
    let resolvedClientId = clientId;
    if (clientId === 'passage' || !clientId) {
      resolvedClientId = null;
    }

    // Si le caissier a saisi des informations clients sans identifiant
    if (!resolvedClientId && clientInfo && clientInfo.nom && clientInfo.nom !== 'Client de passage') {
      let client = await Client.findOne({
        where: { telephone: clientInfo.telephone || '', userId: tenantId }
      }, { transaction });

      if (!client) {
        client = await Client.create({
          nom: clientInfo.nom,
          telephone: clientInfo.telephone || '',
          userId: tenantId
        }, { transaction });
      }
      resolvedClientId = client.id;
    }

    // Si c'est une vente à crédit (méthode DETTE), incrémenter la dette client
    if (methodePaiement === 'DETTE' && resolvedClientId) {
      const client = await Client.findByPk(resolvedClientId, { transaction });
      if (!client) {
        throw new Error("Le client spécifié pour la dette est introuvable.");
      }
      client.dette = Number(client.dette || 0.00) + totalInShopCurrency;
      await client.save({ transaction });
    }

    // 5. Création définitive de la vente
    const sale = await Sale.create({
      userId: tenantId,
      creatorId: req.user.id,
      montantTotal: totalInShopCurrency,
      devise: saleCurrency,
      tauxChange: rate,
      methodePaiement,
      clientId: resolvedClientId,
      profitNet: finalProfitNet,
      remise: Number(remise)
    }, { transaction });

    // Créer les lignes d'articles vendus
    for (const itemRecord of itemRecords) {
      await SaleItem.create({
        ...itemRecord,
        saleId: sale.id
      }, { transaction });
    }

    // 6. Enregistrer le mouvement financier dans la caisse de la session active
    if (methodePaiement !== 'DETTE') {
      activeSession.totalSales = Number(activeSession.totalSales || 0.00) + totalInShopCurrency;
      activeSession.expectedBalance = Number(activeSession.expectedBalance || 0.00) + totalInShopCurrency;
      await activeSession.save({ transaction });
    }

    // Commit de la transaction ACID
    await transaction.commit();

    // Invalider le cache Redis
    if (global.redisClient) {
      const keys = await global.redisClient.keys(`lumo_cache:${tenantId}:*`);
      if (keys.length > 0) {
        await global.redisClient.del(keys);
      }
    }

    res.status(201).json({
      success: true,
      message: "Vente POS validée avec succès.",
      data: sale
    });

  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: error.message || "Une erreur est survenue lors de la création de la vente."
    });
  }
};
```

---

### 6.2 Contrôleur de l'Assistant IA DeepSeek (`server/controllers/aiController.js`)

Ce contrôleur implémente l'intelligence artificielle d'analyse prédictive de LUMO. Il charge les produits en stock critique, les dettes et les statistiques de vente du mois, puis génère une analyse via l'API DeepSeek Chat en streaming (SSE).

```javascript
// server/controllers/aiController.js
const { OpenAI } = require('openai');
const { Product, Sale, Client, Purchase } = require('../models');

// Initialisation du client OpenAI configuré pour DeepSeek API
const getAiClient = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com'
  });
};

exports.getChatAnalysisSSE = async (req, res) => {
  const tenantId = req.user.tenantId;
  const { userMessage } = req.body;

  const openai = getAiClient();
  if (!openai) {
    return res.status(500).json({ message: "Le service d'intelligence artificielle DeepSeek n'est pas configuré sur le serveur." });
  }

  try {
    // 1. Extraire les métriques réelles de la boutique pour la base de connaissances
    const stockCritique = await Product.findAll({
      where: { userId: tenantId, stock: { [sequelize.Op.lt]: sequelize.col('stockAlerte') } },
      attributes: ['nom', 'stock', 'unite']
    });

    const dettesTotal = await Client.findAll({
      where: { userId: tenantId, dette: { [sequelize.Op.gt]: 0.00 } },
      attributes: ['nom', 'dette']
    });

    const ventesRecentes = await Sale.findAll({
      where: { userId: tenantId },
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['montantTotal', 'devise', 'createdAt', 'methodePaiement']
    });

    // 2. Construire le prompt système contextuel (System Prompt)
    const systemPrompt = `
      Tu es LUMO AIO, un expert en gestion commerciale et analyste financier intelligent de la plateforme LUMO ERP.
      Tu analyses les données réelles de la boutique ci-dessous et réponds aux questions du gérant.
      Sois précis, professionnel et formule des recommandations applicables.
      Données réelles de la boutique :
      - Devises d'exploitation : USD et CDF (Franc Congolais)
      - Produits en stock critique/alerte : ${JSON.stringify(stockCritique)}
      - Clients endettés et montants : ${JSON.stringify(dettesTotal)}
      - Historique des 10 dernières ventes en boutique : ${JSON.stringify(ventesRecentes)}
    `;

    // 3. Configurer les en-têtes HTTP pour Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 4. Lancer l'appel de complétion en streaming avec DeepSeek-Chat
    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true
    });

    // Envoyer chaque mot généré en streaming
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la communication avec le serveur DeepSeek API." });
  }
};
```

---

## 7. FRONTEND STORES ET GESTION DES ÉTATS (ZUSTAND STORES)

### 7.1 Store du Panier de Point de Vente avec Conversion de Devises (`client/src/store/useCartStore.ts`)

Ce store Zustand gère le panier du terminal POS. Il résout les prix originaux saisis dans le catalogue (ex. Francs Congolais ou USD) et effectue une conversion dynamique temps réel pour afficher le total global du Point de Vente dans la devise active choisie par le caissier.

```typescript
// client/src/store/useCartStore.ts
import { create } from 'zustand';

export interface CartItem {
  productId: string;
  nom: string;
  prixOriginal: number;
  deviseOriginal: string;
  prix: number; // Prix calculé converti vers la devise globale du POS
  quantite: number;
  prixAchat: number;
  unite: string;
}

interface CartState {
  items: CartItem[];
  deviseActive: string; // Devise sélectionnée pour le Point de Vente (USD/CDF)
  tauxChange: number; // Taux de change courant
  addItem: (product: any, quantite: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantite: number) => void;
  clearCart: () => void;
  setDeviseActive: (devise: string, rate: number) => void;
  getSousTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  deviseActive: 'USD',
  tauxChange: 2800,

  setDeviseActive: (devise, rate) => {
    const currentItems = get().items;
    
    // Recalculer le prix de chaque ligne lors du changement de devise globale
    const updatedItems = currentItems.map(item => {
      let convertedPrice = item.prixOriginal;
      if (item.deviseOriginal !== devise) {
        if (item.deviseOriginal === 'USD' && devise === 'CDF') {
          convertedPrice = Math.round(item.prixOriginal * rate);
        } else if (item.deviseOriginal === 'CDF' && devise === 'USD') {
          convertedPrice = Math.round((item.prixOriginal / rate) * 100) / 100;
        }
      }
      return { ...item, prix: convertedPrice };
    });

    set({ deviseActive: devise, tauxChange: rate, items: updatedItems });
  },

  addItem: (product, quantite) => {
    const items = get().items;
    const devise = get().deviseActive;
    const rate = get().tauxChange;

    const existingItem = items.find(item => item.productId === product.id);

    // Calculer le prix de vente unitaire normalisé vers la devise active
    let calculatedPrice = Number(product.prix || 0);
    if (product.devise !== devise) {
      if (product.devise === 'USD' && devise === 'CDF') {
        calculatedPrice = Math.round(Number(product.prix) * rate);
      } else if (product.devise === 'CDF' && devise === 'USD') {
        calculatedPrice = Math.round((Number(product.prix) / rate) * 100) / 100;
      }
    }

    if (existingItem) {
      set({
        items: items.map(item =>
          item.productId === product.id
            ? { ...item, quantite: item.quantite + quantite }
            : item
        )
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            nom: product.nom,
            prixOriginal: Number(product.prix),
            deviseOriginal: product.devise,
            prix: calculatedPrice,
            quantite,
            prixAchat: Number(product.prixAchat || 0),
            unite: product.unite || 'Pcs'
          }
        ]
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.productId !== productId) });
  },

  updateQuantity: (productId, quantite) => {
    if (quantite <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map(item =>
        item.productId === productId ? { ...item, quantite } : item
      )
    });
  },

  clearCart: () => set({ items: [] }),

  getSousTotal: () => {
    return get().items.reduce((total, item) => total + (item.prix * item.quantite), 0);
  }
}));
```

---

## 8. UTILITAIRES DE DEVISE, D'IMPRESSION ET D'EXCEL (FRONTEND HELPERS)

### 8.1 Module de Normalisation Monétaire (`client/src/utils/currencyHelpers.ts`)

Cet utilitaire normalise et formate la double devise au niveau de l'interface graphique.

```typescript
// client/src/utils/currencyHelpers.ts

/**
 * Normalise un montant d'une devise source vers une devise cible.
 */
export const normalizeAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number => {
  const from = fromCurrency === 'FC' ? 'CDF' : fromCurrency;
  const to = toCurrency === 'FC' ? 'CDF' : toCurrency;

  if (from === to) return amount;

  if (from === 'USD' && to === 'CDF') {
    return Math.round(amount * exchangeRate);
  }

  if (from === 'CDF' && to === 'USD') {
    return Math.round((amount / exchangeRate) * 100) / 100;
  }

  return amount;
};

/**
 * Formate un affichage monétaire dans les normes de la RDC.
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const code = currency === 'FC' ? 'CDF' : currency;
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: code === 'USD' ? 2 : 0,
    maximumFractionDigits: code === 'USD' ? 2 : 0
  }).format(amount) + ' ' + code;
};

/**
 * Calcule l'équivalent dans la devise alternative pour l'affichage double-monnaie.
 */
export const getDisplayAmount = (
  amount: number,
  baseCurrency: string,
  activeCurrency: string,
  exchangeRate: number
) => {
  const normalizedBase = baseCurrency === 'FC' ? 'CDF' : baseCurrency;
  const normalizedActive = activeCurrency === 'FC' ? 'CDF' : activeCurrency;
  
  const mainAmount = normalizeAmount(amount, normalizedBase, normalizedActive, exchangeRate);
  const altCurrency = normalizedActive === 'CDF' ? 'USD' : 'CDF';
  const subAmount = normalizeAmount(mainAmount, normalizedActive, altCurrency, exchangeRate);

  return {
    main: formatCurrency(mainAmount, normalizedActive),
    sub: formatCurrency(subAmount, altCurrency)
  };
};
```

---

### 8.2 Service d'Impression des Rapports et Factures (`client/src/utils/printHelpers.ts`)

Ce service génère et imprime en PDF les factures (format A4) ainsi que les rapports de bilan ou de clôture de caisse avec les styles d'impression adaptatifs `@media print`.

```typescript
// client/src/utils/printHelpers.ts
import { normalizeAmount } from './currencyHelpers';

export const generateMonthlyReport = (data: any, user: any, periodLabel: string) => {
  const currency = user?.preferences?.currency || 'USD';
  const altCurrency = currency === 'CDF' ? 'USD' : 'CDF';
  const exchangeRate = Number(user?.preferences?.exchangeRate || 2800);
  const getAltAmount = (amount: number) => {
    return normalizeAmount(amount, currency, altCurrency, exchangeRate);
  };

  const logo = user?.entreprise?.logo;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Le navigateur a bloqué l'ouverture du document. Veuillez autoriser les pop-ups pour ce site.");
    return;
  }

  const html = `
    <html>
      <head>
        <title>Bilan Mensuel - LUMO</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 40px; background: #fff; }
          .report-box { max-width: 900px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; }
          .period { background: #f1f5f9; padding: 8px 16px; border-radius: 99px; font-weight: 700; font-size: 14px; color: #6366f1; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
          .stat-card { padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; background: #f8fafc; }
          .stat-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
          .stat-value { font-size: 24px; font-weight: 800; color: #0f172a; white-space: nowrap; }
          .stat-sub { font-size: 13px; font-weight: 600; color: #94a3b8; margin-top: 4px; white-space: nowrap; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 12px; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; }
          .section-title { font-size: 18px; font-weight: 800; margin-top: 40px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
          .section-title::before { content: ""; width: 4px; height: 18px; background: #6366f1; border-radius: 4px; }
          
          @media print {
            body { padding: 0; margin: 0; background: #fff; color: #000; }
            .report-box { max-width: 100% !important; width: 100% !important; padding: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; margin: 0 !important; }
            .stat-value { font-size: 20px !important; }
            .stat-sub { font-size: 11px !important; }
            @page { margin: 1.5cm 1.2cm; }
          }
        </style>
      </head>
      <body>
        <div class="report-box">
          <div class="header">
            <div style="display: flex; align-items: center; gap: 20px;">
              ${logo ? `<img src="${logo}" alt="Logo" style="height: 60px; object-fit: contain;">` : ''}
              <div>
                <div class="title">Bilan Financier</div>
                <div style="color: #64748b; font-weight: 600; margin-top: 4px;">${user?.entreprise?.nom || 'LUMO Pro'}</div>
              </div>
            </div>
            <div class="period">${periodLabel}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Revenus Totaux</div>
              <div class="stat-value" style="color: #10b981;">${Number(data?.totals?.revenue || 0).toLocaleString()} ${currency}</div>
              <div class="stat-sub">≈ ${getAltAmount(Number(data?.totals?.revenue || 0)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Bénéfice Net</div>
              <div class="stat-value" style="color: #6366f1;">${Number((data?.totals?.profit ?? data?.totals?.revenue ?? 0)).toLocaleString()} ${currency}</div>
              <div class="stat-sub">≈ ${getAltAmount(Number((data?.totals?.profit ?? data?.totals?.revenue ?? 0))).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>
          </div>

          <div class="section-title">Performance Quotidienne</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%; padding: 12px 6px;">Date</th>
                <th style="width: 37.5%; text-align: right; padding: 12px 6px;">Revenus</th>
                <th style="width: 37.5%; text-align: right; padding: 12px 6px;">Profit</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.periodData || []).map((d: any) => `
                <tr>
                  <td style="padding: 12px 6px; vertical-align: top;">${new Date(d.date).toLocaleDateString()}</td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top;">
                    <span style="font-weight: 700;">${Number(d.revenue).toLocaleString()} ${currency}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${getAltAmount(Number(d.revenue)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top; color: ${(d.profit ?? 0) >= 0 ? '#10b981' : '#ef4444'}">
                    <span style="font-weight: 700;">${Number(d.profit ?? d.revenue ?? 0).toLocaleString()} ${currency}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${getAltAmount(Number(d.profit ?? d.revenue ?? 0)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Top Produits (Ventes)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%; padding: 12px 6px;">Produit</th>
                <th style="width: 15%; text-align: center; padding: 12px 6px;">Quantité</th>
                <th style="width: 35%; text-align: right; padding: 12px 6px;">Revenu</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.topProducts || []).map((p: any) => `
                <tr>
                  <td style="padding: 12px 6px; font-weight: 700; color: #0f172a; vertical-align: top;">${p.nom}</td>
                  <td style="text-align: center; padding: 12px 6px; color: #475569; font-weight: 700; vertical-align: top;">${p.quantite}</td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top;">
                    <span style="font-weight: 700;">${Number(p.revenu).toLocaleString()} ${currency}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${getAltAmount(Number(p.revenu)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            Document généré automatiquement par LUMO ERP - ${new Date().toLocaleString('fr-FR', { hour12: false })}
          </div>
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
```

---

## 9. CONFIGURATION ET VARIABLES D'ENVIRONNEMENT

### 9.1 Fichier d'Exemple de Production (`server/.env.example`)

```env
# 1. PARAMÈTRES RÉSEAU ET PORTS
PORT=5001
NODE_ENV=production
BACKEND_URL=https://api.lumo.app
CLIENT_URL=https://lumo.app

# 2. BASE DE DONNÉES TRANSACTIONNELLE (PostgreSQL)
# Sur Railway, utilisez de préférence DATABASE_URL
DATABASE_URL=postgres://lumo_user:lumo_password@host.railway.app:5432/lumo_db
DB_SSL=true

# 3. BASE DE DONNÉES CACHE ET WEBSOCKET CLUSTERING (Redis)
REDIS_URL=redis://default:redis_password@redis-host.railway.app:6379

# 4. SÉCURITÉ DE SESSION ET AUTHENTIFICATION (JWT)
JWT_SECRET=c1f4e8b394a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789a
JWT_EXPIRE=30d

# 5. ASSISTANT INTELLIGENT DE TRÉSORERIE (DeepSeek AI API)
DEEPSEEK_API_KEY=sk-4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat

# 6. STOCKAGE DISTRIBUÉ DU CATALOGUE D'IMAGES (Cloudinary)
CLOUDINARY_CLOUD_NAME=lumo-cloudinary
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123

# 7. SERVICE DE NOTIFICATIONS & SAUVEGARDES (Resend API / SMTP Fallback)
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwx
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_123456789_abcdefghijklmnopqrstuvwx
FROM_EMAIL=Lumo ERP <noreply@lumo.app>

# 8. MONITORING ET TRACAGE DES BOGUES EN PRODUCTION (Sentry)
SENTRY_DSN=https://abc123def456@sentry.io/7890
```

---

## 10. PROTOCOLE D'EXÉCUTION ET MAINTENANCE SYSTÈME

### 10.1 Procédure de déploiement continu (Railway PaaS)
Le déploiement de LUMO s'effectue automatiquement via le pipeline Git connecté à Railway :

1.  **Création du projet sur Railway** et provisionnement des instances PostgreSQL et Redis.
2.  **Liaison avec le dépôt GitHub** du projet.
3.  **Configuration des variables d'environnement** au niveau de l'interface de Railway.
4.  **Détection automatique** de la configuration Nixpacks par Railway.
5.  Le serveur Nixpacks installe Node.js 18, installe les dépendances via `npm install`, compile l'interface React via `npm run build` et lance l'API backend via `npm start`.

### 10.2 Plan de récupération d'urgence et maintenance préventive
*   **Perte de connexion Internet (Kinshasa) :** L'interface POS frontend détecte la perte du réseau et désactive la synchronisation. Les commandes validées par le caissier sont stockées dans le cache du navigateur `localStorage.pending-sales`. Lors de la reconnexion à l'API backend, un canal WebSocket émet automatiquement la liste des ventes stockées pour leur traitement et décrémentation définitive en base de données.
*   **Coupure d'électricité SNEL (Développeurs) :** Les serveurs étant hébergés dans le Cloud de Railway (haute disponibilité), les pannes électriques locales n'affectent pas l'accessibilité de la plateforme pour les commerces. Les développeurs locaux utilisent leurs onduleurs physiques et générateurs logistiques pour maintenir l'environnement de maintenance actif.
*   **Restauration des bases de données :** Les sauvegardes automatiques JSON envoyées quotidiennement sur l'e-mail de l'administrateur par la tâche Cron et l'API Resend peuvent être importées à tout moment sur la route administrative `/api/superadmin/import` pour rétablir les données d'une boutique en moins de 10 minutes en cas de sinistre majeur.
