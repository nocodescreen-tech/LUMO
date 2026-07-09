# MANUEL UNIVERSITAIRE COMPLET
# LUMO — Plateforme Web Intelligente de Gestion Commerciale

---

> **Document officiel de préparation à la soutenance**  
> Licence LMD — Technique de Maintenance  
> Sujet : *« Conception et développement d'une plateforme web intelligente de gestion centralisée et automatisée des activités commerciales (LUMO) »*

---

## TABLE DES MATIÈRES

1. [Présentation complète du projet](#chapitre-1)
2. [Compréhension complète de LUMO](#chapitre-2)
3. [Explication détaillée de tous les modules](#chapitre-3)
4. [Fonctionnement détaillé de chaque bouton](#chapitre-4)
5. [Architecture logicielle](#chapitre-5)
6. [Technologies utilisées](#chapitre-6)
7. [Glossaire complet (500+ termes)](#chapitre-7)
8. [Gestion commerciale](#chapitre-8)
9. [Base de données PostgreSQL](#chapitre-9)
10. [Sécurité de l'application](#chapitre-10)
11. [Assistant IA — DeepSeek](#chapitre-11)
12. [Déploiement](#chapitre-12)
13. [Questions/Réponses jury (500+)](#chapitre-13)
14. [Scénario de démonstration](#chapitre-14)
15. [Erreurs fréquentes et solutions](#chapitre-15)
16. [Annexes et diagrammes](#chapitre-16)

---

# CHAPITRE 1 — PRÉSENTATION COMPLÈTE DU PROJET {#chapitre-1}

## 1.1 Contexte

Le monde du commerce connaît une transformation numérique profonde et irréversible. Les petites et moyennes entreprises (PME), particulièrement dans les pays d'Afrique subsaharienne comme la République Démocratique du Congo, font face à des défis majeurs : gestion manuelle des stocks sur des cahiers, absence de traçabilité des ventes, impossibilité de générer des rapports financiers en temps réel, et risque permanent d'erreurs humaines coûteuses.

Dans ce contexte, la gestion commerciale artisanale — basée sur des supports papier, des fichiers Excel déconnectés, et des processus entièrement manuels — devient un frein à la croissance des entreprises. Un commerçant qui ne sait pas en temps réel combien de produits il lui reste en stock, qui n'a pas accès à son chiffre d'affaires journalier, ou qui ne peut pas identifier ses clients débiteurs, est structurellement désavantagé.

C'est dans ce contexte précis que s'inscrit le projet **LUMO** : une plateforme web intelligente conçue pour centraliser et automatiser l'ensemble des activités commerciales d'une boutique, d'un magasin ou d'une entreprise de petite à moyenne taille.

Le projet a été développé dans le cadre de notre formation en **Technique de Maintenance** à l'issue d'un cycle de Licence LMD. Il représente l'aboutissement d'une formation technique qui nous a permis d'acquérir les compétences nécessaires pour concevoir, développer, tester et déployer une application web complète en utilisant des technologies modernes et reconnues dans l'industrie.

## 1.2 Problématique

La problématique centrale de ce projet peut être formulée ainsi :

> **Comment les petits commerçants et entrepreneurs peuvent-ils gérer efficacement, de manière centralisée et automatisée, l'ensemble de leurs activités commerciales (stocks, ventes, achats, clients, fournisseurs, finances) sans recourir à des outils coûteux, complexes ou inadaptés à leur contexte ?**

Cette problématique se décline en plusieurs sous-questions :

- **Problème de centralisation** : Les données commerciales sont éparpillées entre des cahiers, des feuilles Excel, des applications déconnectées. Comment les unifier sur une seule plateforme ?
- **Problème de temps réel** : Comment permettre au commerçant d'avoir une vision instantanée de l'état de son commerce (stock disponible, ventes du jour, dettes clients) ?
- **Problème d'accès multi-utilisateurs** : Comment permettre à plusieurs employés (caissier, gérant, magasinier) d'accéder à la plateforme avec des droits différents, sans compromettre la sécurité des données ?
- **Problème de sécurité** : Comment protéger les données commerciales sensibles (prix d'achat, marges, informations clients) contre les accès non autorisés ?
- **Problème d'intelligence** : Comment aider le commerçant à prendre de meilleures décisions grâce à l'analyse automatique de ses données ?
- **Problème de coût** : Comment proposer une solution performante, accessible depuis n'importe quel appareil connecté à Internet, sans infrastructure coûteuse ?

## 1.3 Justification du projet

La justification de LUMO repose sur plusieurs constats objectifs :

### 1.3.1 Justification économique
Le secteur commercial informel et semi-formel représente une part majeure de l'économie en RDC. Ces commerçants ont des besoins réels en outils de gestion, mais les solutions disponibles sur le marché (SAP, Odoo, Sage) sont soit trop chères, soit trop complexes à déployer, soit disponibles uniquement en anglais, soit inadaptées aux contraintes locales (gestion multi-devises USD/CDF, taux de change variable, etc.).

### 1.3.2 Justification technique
Le stack technologique PERN (PostgreSQL, Express, React, Node.js) est aujourd'hui l'un des plus populaires et des mieux documentés dans le monde du développement web. Ces technologies sont gratuites, open-source, et permettent de construire des applications robustes, scalables et maintenables. L'utilisation de ces technologies dans notre projet démontre notre maîtrise des outils modernes du développement web full-stack.

### 1.3.3 Justification académique
Ce projet constitue une application concrète et intégrale des connaissances acquises durant notre formation : bases de données relationnelles, programmation orientée objet, architecture client-serveur, protocoles HTTP/HTTPS, sécurité informatique, et gestion de projet.

## 1.4 Objectifs

### 1.4.1 Objectif général
Concevoir et développer une plateforme web intelligente, accessible depuis n'importe quel navigateur, permettant la gestion centralisée et automatisée de l'ensemble des activités commerciales d'une entreprise.

### 1.4.2 Objectifs spécifiques

| N° | Objectif spécifique | Réalisation dans LUMO |
|----|---------------------|----------------------|
| 1 | Permettre l'inscription et l'authentification sécurisée des utilisateurs | Module Auth avec JWT, 2FA, Google OAuth |
| 2 | Gérer le catalogue de produits avec contrôle de stock | Module Produits + StockMovement |
| 3 | Enregistrer les ventes en temps réel via un point de vente (POS) | Module POS (Cash) |
| 4 | Gérer les achats auprès des fournisseurs | Module Achats + Fournisseurs |
| 5 | Suivre les clients et leurs dettes | Module Clients + Dettes |
| 6 | Générer des statistiques et rapports financiers | Module Stats + Dashboard |
| 7 | Intégrer un assistant IA pour l'analyse commerciale | Module IA (DeepSeek API) |
| 8 | Permettre la gestion multi-utilisateurs avec contrôle des rôles | Module Users + RBAC |
| 9 | Assurer la sécurité des données | JWT, Bcrypt, Helmet, CORS, CSRF |
| 10 | Déployer l'application en production | Railway (backend) + Vercel (frontend) |

## 1.5 Importance du projet

L'importance de LUMO se manifeste à plusieurs niveaux :

### Pour les commerçants
- Gain de temps considérable dans la gestion quotidienne
- Réduction des erreurs humaines (calculs, stocks)
- Visibilité en temps réel sur les finances
- Possibilité de travailler depuis n'importe où (smartphone, tablette, PC)

### Pour les employés
- Interface claire et intuitive
- Chaque employé a accès uniquement aux fonctions correspondant à son rôle
- Traçabilité complète des actions (journal d'activités)

### Pour les académiciens
- Démontre la capacité des étudiants à réaliser un projet web complet de A à Z
- Application des concepts théoriques (BDD, API, sécurité) dans un contexte réel
- Utilisation de bonnes pratiques industrielles (MVC, ORM, middleware, RBAC)

## 1.6 Limites du projet

> [!NOTE]
> Connaître les limites de son projet est une force, pas une faiblesse. Le jury apprécie la lucidité.

Les limites actuelles de LUMO sont les suivantes :

| Limite | Description | Perspective d'amélioration |
|--------|-------------|---------------------------|
| Mono-boutique par compte | Un compte admin = une boutique. Pas encore de réseau de boutiques | Architecture multi-tenant avancée |
| Pas d'application mobile native | Accessible via navigateur mobile mais pas d'app Android/iOS native | Développement React Native |
| Gestion comptable limitée | Pas de bilan comptable complet (actif/passif) | Intégration d'un module comptable |
| Pas de synchronisation hors-ligne | Nécessite une connexion Internet | Progressive Web App (PWA) avec IndexedDB |
| Rapport PDF limité | Export PDF non encore implémenté pour tous les modules | Intégration de librairies PDF (jsPDF) |
| IA limitée au contexte de 30 ventes | Le contexte envoyé à l'IA est limité aux 30 dernières ventes | Augmentation du contexte, RAG |

## 1.7 Perspectives d'évolution

À court terme (6 mois) :
- Ajout d'un module de facturation avec export PDF
- Notifications push sur mobile
- Synchronisation hors-ligne (PWA)

À moyen terme (1-2 ans) :
- Application mobile native (React Native)
- Intégration de paiement mobile (M-Pesa, Orange Money)
- Module de comptabilité complète
- API publique pour intégration tierce

À long terme (3-5 ans) :
- Réseau de franchises et boutiques multiples
- IA prédictive pour la gestion des stocks
- Marketplace B2B entre commerçants et fournisseurs

---

# CHAPITRE 2 — COMPRÉHENSION COMPLÈTE DE LUMO {#chapitre-2}

## 2.1 Définition de LUMO

**LUMO** est une plateforme web intelligente de gestion centralisée et automatisée des activités commerciales. Le nom LUMO évoque la lumière — l'idée d'apporter de la clarté et de la visibilité dans la gestion commerciale, souvent opaque et complexe pour un petit commerçant.

Techniquement, LUMO est une **application web full-stack** de type **SPA (Single Page Application)** côté frontend et **API REST** côté backend, déployée dans le cloud et accessible depuis n'importe quel navigateur moderne.

> **À retenir :** LUMO n'est pas un logiciel à installer. C'est une application en ligne (SaaS — Software as a Service) accessible via un lien URL, depuis un ordinateur, une tablette ou un smartphone.

## 2.2 Fonctionnement général

LUMO fonctionne selon le principe **client-serveur** :

```
[Navigateur Web] ←→ [React SPA sur Vercel] ←→ [API Express sur Railway] ←→ [PostgreSQL]
                                                         ↕
                                                  [Redis (cache)]
                                                         ↕
                                               [DeepSeek AI API]
                                                         ↕
                                               [Cloudinary (images)]
```

### Cycle d'une requête typique (exemple : créer une vente)

1. **L'utilisateur** clique sur "Valider la vente" dans l'interface React (navigateur)
2. **React** envoie une requête HTTP POST via Axios vers l'API : `POST /api/v1/sales`
3. **Express** reçoit la requête, la fait passer par les middlewares (JWT, CORS, rate-limit)
4. **Le contrôleur** (`SaleController.js`) traite la logique métier
5. **Sequelize** exécute la requête SQL sur PostgreSQL
6. **Les hooks Sequelize** (afterCreate) déclenchent automatiquement :
   - La mise à jour du stock de chaque produit vendu
   - La création d'une activité dans le journal
   - L'envoi d'une notification WebSocket en temps réel
7. **La réponse JSON** remonte au frontend
8. **React** met à jour l'interface (via Zustand store)

## 2.3 Les utilisateurs de LUMO

LUMO est conçu pour **trois types d'utilisateurs** :

### 2.3.1 Le SuperAdmin
- **Qui c'est ?** Le premier compte créé sur la plateforme devient automatiquement SuperAdmin
- **Son rôle** : Gérer toute la plateforme, valider les comptes admin, surveiller tous les commerces
- **Accès** : Dashboard SuperAdmin exclusif avec statistiques globales, gestion des comptes
- **Dans le code** : `role: isFirstUser ? 'superadmin' : 'admin'` (authController.js, ligne 64)

### 2.3.2 L'Admin (Propriétaire du commerce)
- **Qui c'est ?** Le propriétaire d'une boutique
- **Son rôle** : Gérer son commerce complet (produits, ventes, achats, clients, personnel)
- **Accès** : Tous les modules de LUMO
- **Dans le code** : Rôle `'admin'`, accès complet via `authorize('admin', 'superadmin')`

### 2.3.3 Le Sous-utilisateur (Employé)
- **Qui c'est ?** Un caissier, magasinier, comptable créé par l'admin
- **Son rôle** : Accéder uniquement aux modules autorisés par l'admin
- **Accès** : Limité par RBAC (ex: accès POS uniquement pour un caissier)
- **Dans le code** : `parentId` pointant vers l'admin, permissions stockées en JSONB

## 2.4 Les rôles et le RBAC

LUMO implémente un système **RBAC (Role-Based Access Control)** à trois niveaux :

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `superadmin` | Administrateur de la plateforme | Tout |
| `admin` | Propriétaire d'un commerce | Tous les modules de son commerce |
| `subuser` | Employé | Modules définis par l'admin dans `permissions` JSONB |

### Comment fonctionne le RBAC dans le code ?

**Côté backend** (authMiddleware.js) :
```javascript
exports.checkPermission = (permissionId) => {
  return (req, res, next) => {
    // Admins et SuperAdmins : accès total
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }
    const userPerms = req.user.permissions || [];
    // Vérification exacte : 'products.edit'
    if (userPerms.includes(permissionId)) return next();
    // Vérification parent : 'products' inclut 'products.add', 'products.edit'
    const parentModule = permissionId.includes('.') ? permissionId.split('.')[0] : null;
    if (parentModule && userPerms.includes(parentModule)) return next();
    return res.status(403).json({ message: `Accès refusé. Permission requise : "${permissionId}".` });
  };
};
```

**Côté frontend** : Les modules non autorisés ne s'affichent pas dans le menu.

## 2.5 Architecture de LUMO

### Architecture globale (vue d'ensemble)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                     │
│  React 18 + TypeScript + Tailwind CSS + Zustand          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Dashboard │ │ POS/Cash │ │ Products │ │  Stats   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Clients  │ │Fourniss. │ │  Sales   │ │Purchases │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│         ↕ Axios HTTP/HTTPS REST API                      │
├─────────────────────────────────────────────────────────┤
│                    BACKEND (Railway)                     │
│  Node.js + Express.js                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │              MIDDLEWARES                          │   │
│  │ Helmet │ CORS │ JWT Auth │ Rate Limit │ CSRF     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │  Routes  │→│Controllers│→│  Models  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│         ↕ Sequelize ORM                                  │
├─────────────────────────────────────────────────────────┤
│                BASE DE DONNÉES (Railway)                 │
│  PostgreSQL                                              │
│  Users │ Products │ Sales │ Purchases │ Clients │ ...   │
├─────────────────────────────────────────────────────────┤
│              SERVICES EXTERNES                           │
│  Redis (cache/WebSocket) │ Cloudinary │ DeepSeek AI      │
│  Firebase │ Nodemailer/Resend │ Sentry                   │
└─────────────────────────────────────────────────────────┘
```

### Architecture MVC côté serveur

LUMO suit strictement le patron **MVC (Modèle-Vue-Contrôleur)** côté serveur :

| Couche | Dossier | Rôle |
|--------|---------|------|
| **Modèle** | `server/models/` | Définition des tables PostgreSQL via Sequelize |
| **Vue** | `client/src/pages/` | Composants React (l'interface utilisateur) |
| **Contrôleur** | `server/controllers/` | Logique métier, traitement des requêtes |

## 2.6 Flux de données

### Flux complet d'une authentification

```
1. Utilisateur saisit email/mot de passe → Login.tsx
2. Axios envoie POST /api/auth/login
3. Rate Limiter vérifie (max 100 req / 15 min)
4. authController.login() :
   a. Cherche l'utilisateur en BDD par email (iLike = insensible à la casse)
   b. Vérifie le mot de passe : bcrypt.compare()
   c. Génère un sessionId (crypto.randomBytes)
   d. Crée un JWT access token (15min ou 30j selon remember)
   e. Crée un JWT refresh token (30j)
   f. Sauvegarde le sessionId dans activeSessions (JSONB)
5. Réponse JSON : { token, refreshToken, user }
6. useAuthStore.setAuth() stocke le token en localStorage (encodé en base64)
7. Axios intercepteur ajoute automatiquement le token à chaque requête suivante
```

## 2.7 Centralisation des données

LUMO centralise toutes les données commerciales dans une seule base PostgreSQL sur Railway. Cela signifie :

- **Un seul point de vérité** : Le stock affiché est toujours le stock réel en base
- **Cohérence des données** : Une vente décremente automatiquement le stock via les hooks Sequelize
- **Multi-utilisateurs simultanés** : Plusieurs employés peuvent travailler en même temps, les données restent cohérentes
- **Sauvegarde centralisée** : Les backups sont gérés automatiquement (cron job)

## 2.8 Automatisation

LUMO automatise plusieurs processus critiques :

| Processus automatisé | Déclencheur | Mécanisme |
|---------------------|-------------|-----------|
| Décrémentation du stock | Après une vente POS | Hook `afterCreate` du modèle Sale |
| Alerte stock faible | Quand stock < stockAlerte | Hook `afterSave` du modèle Product |
| Journal d'activités | Toute opération CRUD | Hook `afterCreate/afterDestroy` des modèles |
| Notifications en temps réel | Changements de stock | WebSocket (Socket.io) |
| Backup automatique | Toutes les nuits (cron) | `initBackupCron()` dans server.js |
| Nettoyage des tokens expirés | Automatique | Redis TTL (86400 secondes) |
| Mise à jour de lastActivity | À chaque requête authentifiée | authMiddleware.js (max 1x/min) |

---

# CHAPITRE 3 — EXPLICATION DÉTAILLÉE DE TOUS LES MODULES {#chapitre-3}

## MODULE 1 — AUTHENTIFICATION

### 3.1.1 Définition
Le module d'authentification est la porte d'entrée de LUMO. Il gère l'identité de chaque utilisateur, la sécurité des sessions, et le contrôle d'accès général à l'application.

### 3.1.2 Objectif
Assurer que seuls les utilisateurs légitimes et autorisés peuvent accéder aux données du commerce, et que chaque utilisateur n'accède qu'aux ressources qui lui sont attribuées.

### 3.1.3 Fonctionnement détaillé

**Pages concernées** : `pages/auth/Login.tsx`, `pages/auth/Register.tsx`, `pages/auth/VerifyEmail.tsx`, `pages/auth/ForgotPassword.tsx`, `pages/auth/VerifyResetOTP.tsx`, `pages/auth/ResetPassword.tsx`

**Contrôleur backend** : `controllers/authController.js` (763 lignes)

**Routes** : `routes/authRoutes.js`

#### Processus d'inscription (`registerAdmin`)
```
1. L'utilisateur remplit le formulaire : nom, email, mot de passe, type d'activité, devise
2. Validation côté serveur via Joi (validators.js)
3. Vérification que l'email n'existe pas déjà (iLike : insensible à la casse)
4. Détection du premier utilisateur (isFirstUser = count === 0)
5. Génération d'un code de vérification à 6 chiffres (crypto.randomBytes)
6. Hachage SHA-256 du code avant stockage
7. Upload optionnel de l'avatar sur Cloudinary (multer + buffer)
8. Création de l'utilisateur en base avec :
   - Role : 'superadmin' si premier, 'admin' sinon
   - isVerified : true si premier, false sinon
   - Devise par défaut : CDF (Franc Congolais)
9. Envoi de l'email de vérification via Nodemailer/Resend
10. Si premier utilisateur : génération immédiate du JWT et connexion directe
```

#### Processus de connexion (`loginUser`)
```
1. Réception email + motDePasse
2. Recherche de l'utilisateur (Op.iLike pour insensibilité à la casse)
3. Vérification bcrypt.compare(enteredPassword, user.motDePasse)
4. Vérification isVerified et isAdminValidated
5. Vérification du mode 2FA (si activé)
6. Génération d'un sessionId unique
7. Génération des tokens JWT :
   - Access Token : 15 minutes (ou 30j si "remember me")
   - Refresh Token : 30 jours
8. Stockage du sessionId dans activeSessions (JSONB)
9. Mise à jour de lastActivity
10. Réponse avec user + tokens
```

#### Mécanisme de Refresh Token
Quand l'access token expire :
```
Frontend → POST /api/auth/refresh avec refreshToken
Serveur vérifie le refreshToken (type === 'refresh')
Génère un nouveau access token
Renvoie le nouveau token
```

#### Double Authentification (2FA)
LUMO implémente la 2FA via **TOTP (Time-based One-Time Password)** :
- Bibliothèque : `otplib`
- L'utilisateur scanne un QR code avec Google Authenticator
- À chaque connexion, il saisit le code à 6 chiffres généré
- Le serveur vérifie avec `authenticator.verify()`

### 3.1.4 Cas pratique

**Scénario** : Jean, propriétaire d'une boutique, veut créer un compte LUMO pour son commerce.

1. Jean va sur la page d'accueil de LUMO et clique "S'inscrire"
2. Il remplit : Nom = "Jean Mutamba", Email = "jean@boutique.com", Mot de passe = "Pass@2024!", Type = "Boutique", Devise = "USD"
3. LUMO envoie un code à 6 chiffres sur jean@boutique.com
4. Jean saisit le code → compte vérifié
5. Le SuperAdmin valide le compte dans son tableau de bord
6. Jean peut maintenant se connecter

### 3.1.5 Avantages
- Sécurité multicouche (bcrypt + JWT + 2FA)
- Gestion des sessions concurrentes (un seul appareil à la fois possible)
- Récupération de mot de passe sécurisée (OTP + lien temporaire)
- Support Google OAuth pour connexion simplifiée

### 3.1.6 Questions possibles du jury

**Q : Pourquoi utiliser JWT plutôt que des sessions serveur classiques ?**
> **R :** Les JWT sont **sans état (stateless)** : le serveur n'a pas besoin de stocker les sessions en mémoire. Cela rend l'application plus scalable car n'importe quel serveur du cluster peut valider un JWT sans partager d'état. Dans LUMO, on ajoute une couche de sécurité via Redis pour la blacklist des tokens révoqués et la gestion des sessions concurrentes.

**Q : Comment fonctionne le hachage des mots de passe ?**
> **R :** Bcrypt génère un "salt" aléatoire (10 rounds dans notre code) et produit un hash unique même pour des mots de passe identiques. Le hash commence par `$2a$` ou `$2b$`. Lors de la connexion, `bcrypt.compare()` reconstitue le hash et compare. On ne stocke jamais le mot de passe en clair.

**Q : Qu'est-ce que le sessionId dans LUMO ?**
> **R :** C'est un identifiant unique généré par `crypto.randomBytes(16)` à chaque connexion, stocké dans le JWT et dans le champ `activeSessions` de l'utilisateur en base. Quand l'utilisateur se reconnecte depuis un autre appareil, l'ancien sessionId est remplacé, invalidant automatiquement la session précédente.

---

## MODULE 2 — DASHBOARD

### 3.2.1 Définition
Le Dashboard est la page d'accueil de LUMO après connexion. C'est un tableau de bord visuel qui présente en temps réel les indicateurs clés de performance (KPI) du commerce.

### 3.2.2 Objectif
Permettre au propriétaire d'avoir une vue panoramique instantanée de l'état de son commerce sans avoir à naviguer dans plusieurs modules.

### 3.2.3 Fonctionnement détaillé

**Page frontend** : `pages/Dashboard.tsx` (21 017 octets)

**Contrôleur backend** : `controllers/statsController.js` — fonction `getDashboardStats`

**Route** : `GET /api/v1/stats/dashboard`

#### KPI affichés sur le Dashboard

| KPI | Calcul | Source |
|-----|--------|--------|
| Chiffre d'affaires (CA) | Somme de tous les `montantTotal` des ventes (hors remboursements) | Table `Sales` |
| Profit net | Somme de `profitNet` de toutes les ventes | Table `Sales` |
| Nombre de produits | COUNT sur la table Products | Table `Products` |
| Nombre de clients | COUNT sur la table Clients | Table `Clients` |
| Stock faible | Produits avec stock < 10 | Table `Products` |
| Ventes récentes | Les 8 dernières ventes | Table `Sales` |
| Graphique des ventes | Ventes groupées par jour/semaine/mois | Agrégation SQL |

#### Conversion multi-devises dans le Dashboard

LUMO gère les devises USD et CDF. Toutes les valeurs sont converties en une devise commune pour l'affichage :

```javascript
// statsController.js
const toCDF = (amount, devise, rate, fallbackRate) => {
  const safeAmount = Number(amount || 0);
  const effectiveRate = Number.isFinite(Number(rate)) && Number(rate) > 1 
    ? Number(rate) 
    : fallbackRate;
  return normalizeCurrency(devise) === 'USD' ? (safeAmount * effectiveRate) : safeAmount;
};
```

Le taux de change est stocké dans `user.preferences.exchangeRate` (par défaut : 2800 CDF pour 1 USD).

### 3.2.4 Cas pratique

Marie ouvre LUMO le matin. Elle voit immédiatement :
- CA du jour : 450 USD
- 3 produits en stock faible
- Dernière vente : il y a 12 minutes
- Profit net du mois : 1 250 USD

En 10 secondes, elle a une vision complète de son commerce.

### 3.2.5 Questions possibles du jury

**Q : Comment LUMO évite-t-il les erreurs de calcul dues aux devises mixtes ?**
> **R :** Chaque vente stocke sa propre devise (`devise`) et le taux de change au moment de la vente (`tauxChange`). Au moment de l'agrégation, le contrôleur `statsController.js` utilise la fonction `toCDF()` pour convertir toutes les ventes en CDF avant de les additionner. Les ventes remboursées sont exclues via le filtre `notRefunded` (statut `Op.notIn ['Remboursee', 'Remboursée']`).

**Q : Est-ce que le Dashboard se met à jour automatiquement ?**
> **R :** Partiellement. Les données se rechargent à chaque accès à la page. Pour les alertes en temps réel (stock faible), LUMO utilise Socket.io : dès qu'un produit passe sous son seuil d'alerte, une notification WebSocket est envoyée instantanément au frontend.

---

## MODULE 3 — PRODUITS

### 3.3.1 Définition
Le module Produits est le catalogue central de LUMO. Il permet de créer, modifier, supprimer et consulter tous les articles disponibles à la vente dans le commerce.

### 3.3.2 Objectif
Maintenir un catalogue de produits précis avec gestion du stock, des prix (achat et vente), des catégories, des codes-barres, et des variantes.

### 3.3.3 Fonctionnement détaillé

**Page frontend** : `pages/Products.tsx` (88 505 octets — le plus gros fichier frontend)

**Modèle** : `models/Product.js` (199 lignes)

**Contrôleur** : `controllers/productController.js` (8 951 octets)

**Route** : `routes/productRoutes.js` (4 362 octets)

#### Structure complète d'un produit (modèle Sequelize)

```javascript
const Product = sequelize.define('Product', {
  id:          { type: INTEGER, primaryKey: true, autoIncrement: true },
  nom:         { type: STRING, allowNull: false },
  description: { type: TEXT },
  prix:        { type: DECIMAL(20,2), allowNull: false },  // Prix de vente
  prixAchat:   { type: DECIMAL(20,2) },                   // Prix d'achat
  stock:       { type: INTEGER, defaultValue: 0 },
  stockAlerte: { type: INTEGER, defaultValue: 5 },        // Seuil d'alerte
  categorie:   { type: STRING },
  codeBarre:   { type: STRING, unique: true },
  image:       { type: STRING },
  unite:       { type: STRING, defaultValue: 'pcs' },
  devise:      { type: STRING, defaultValue: 'CDF' },
  userId:      { type: INTEGER, allowNull: false },        // Propriétaire
  creatorId:   { type: INTEGER },                         // Créateur (sub-user)
  taxe:        { type: FLOAT, defaultValue: 0.0 },
  metadata:    { type: JSONB, defaultValue: {} },
  variantes:   { type: JSONB, defaultValue: [] },         // Tailles, couleurs...
});
```

#### Hooks automatiques du modèle Product

Le modèle Product contient trois hooks Sequelize qui s'exécutent automatiquement :

1. **`afterCreate`** : Crée une activité "CREATION_PRODUIT" dans le journal
2. **`afterDestroy`** : Crée une activité "SUPPRESSION_PRODUIT" dans le journal
3. **`afterSave`** : Quand le stock change :
   - Crée un mouvement de stock (`StockMovement`)
   - Si le stock passe sous `stockAlerte` → crée une `Notification` de type WARNING
   - Si le stock augmente → crée une `Notification` de type INFO
   - Si c'est un nouveau produit → crée une `Notification` de type SUCCESS

#### Soft Delete (paranoid: true)

Le modèle Product utilise `paranoid: true` de Sequelize. Cela signifie que la suppression d'un produit ne l'efface pas physiquement de la base : le champ `deletedAt` est simplement rempli. Le produit "supprimé" n'apparaît plus dans les requêtes normales mais reste en base pour la traçabilité historique.

#### Multi-devise pour les produits

Chaque produit a sa propre devise (`devise: { isIn: [['USD', 'CDF']] }`). Au moment de la vente, LUMO convertit automatiquement selon le taux de change courant.

#### Variantes

Le champ `variantes` est un JSONB qui permet de stocker des variantes de produits (ex: taille S, M, L ou couleur rouge/bleu). Format :
```json
[
  { "nom": "Taille", "valeurs": ["S", "M", "L", "XL"] },
  { "nom": "Couleur", "valeurs": ["Rouge", "Bleu"] }
]
```

### 3.3.4 Cas pratique

**Scénario** : Ajouter un produit "Chemise Classique" :
1. Admin clique "Nouveau Produit"
2. Remplit : Nom = "Chemise Classique", Prix vente = 15 USD, Prix achat = 8 USD, Stock = 50, Seuil alerte = 10, Catégorie = "Vêtements"
3. Génère un code-barre automatiquement
4. Ajoute des variantes : Tailles S, M, L
5. Uploader une photo (stockée sur Cloudinary)
6. Sauvegarde → Stock Movement créé, Activité enregistrée, Notification de nouveau produit

**Quand le stock de "Chemise Classique" passe de 12 à 8 :**
- Le hook `afterSave` détecte que stock (8) < stockAlerte (10)
- Crée une notification : "Alerte: Le stock pour Chemise Classique est passé sous le seuil (8 restants)"
- L'admin reçoit la notification en temps réel via WebSocket

### 3.3.5 Questions possibles du jury

**Q : Qu'est-ce que le soft delete et pourquoi l'utilise-t-on ?**
> **R :** Le soft delete (suppression douce) marque un enregistrement comme supprimé sans le supprimer physiquement. Dans LUMO, `paranoid: true` ajoute une colonne `deletedAt`. Si un produit est "supprimé" mais qu'il apparaît dans d'anciennes ventes, les ventes restent cohérentes car le produit existe toujours en base. C'est essentiel pour la traçabilité commerciale.

**Q : Comment fonctionnent les hooks Sequelize ?**
> **R :** Les hooks Sequelize sont des fonctions JavaScript qui s'exécutent automatiquement avant ou après certaines opérations sur la base de données. Dans LUMO, `afterSave` du modèle Product s'exécute chaque fois qu'un produit est sauvegardé. On vérifie si le champ `stock` a changé (`product.changed('stock')`), et si oui, on crée automatiquement un StockMovement et éventuellement une Notification. C'est de l'automatisation pure côté serveur.

---

## MODULE 4 — STOCKS (StockHistory)

### 3.4.1 Définition
Le module StockHistory enregistre et affiche l'historique complet de tous les mouvements de stock : entrées (approvisionnements, ajustements) et sorties (ventes, pertes).

### 3.4.2 Objectif
Permettre une traçabilité totale du stock : savoir quand, pourquoi et par qui chaque changement de stock a eu lieu.

### 3.4.3 Fonctionnement

**Page** : `pages/StockHistory.tsx` (16 507 octets)

**Modèle** : `models/StockMovement.js`

Chaque mouvement de stock enregistre :
- `productId` : le produit concerné
- `userId` : le shop owner
- `type` : 'ENTREE' ou 'SORTIE'
- `quantite` : nombre d'unités déplacées
- `ancienStock` : stock avant le mouvement
- `nouveauStock` : stock après le mouvement
- `raison` : 'Vente', 'Achat', 'Ajustement', 'Initialisation', etc.

### 3.4.4 Questions possibles du jury

**Q : Quelle est la différence entre le module Stocks et le module Produits ?**
> **R :** Le module Produits gère le catalogue (créer, modifier, supprimer des produits avec leurs informations). Le module Stocks/StockHistory affiche l'historique des mouvements de stock. Un produit a un stock actuel (dans Products), et chaque fois que ce stock change, un StockMovement est créé automatiquement. Le StockHistory permet de voir toute l'évolution du stock dans le temps.

---

## MODULE 5 — POS (Point of Sale) / CAISSE

### 3.5.1 Définition
Le module POS (Point of Sale, ou Point de Vente) est l'interface de caisse de LUMO. C'est le cœur opérationnel du système, utilisé par les caissiers pour enregistrer les ventes en temps réel.

### 3.5.2 Objectif
Permettre l'enregistrement rapide et précis des ventes, la gestion du panier, le calcul de la monnaie à rendre, et la gestion des sessions de caisse.

### 3.5.3 Fonctionnement détaillé

**Pages** : `pages/POS.tsx` (58 470 octets) + `pages/Cash.tsx` (29 442 octets)

**Modèles** : `models/sale.model.js` + `models/CashSession.js`

**Contrôleurs** : `controllers/SaleController.js` + `controllers/cashController.js`

**Store Zustand** : `store/useCartStore.ts` (3 131 octets)

#### Flux d'une vente POS

```
1. Caissier ouvre une session de caisse (Cash Session) avec un fonds de caisse
2. Scanne ou recherche des produits → ajoutés au panier (useCartStore)
3. Le panier calcule en temps réel :
   - Total = Σ(quantité × prix)
   - Remise éventuelle
   - Rendu monnaie = Montant reçu - Total
4. Caissier choisit la méthode de paiement (Espèces, Mobile Money, etc.)
5. Valide la vente → POST /api/v1/sales
6. Backend (SaleController) :
   a. Crée l'enregistrement Sale en base
   b. Décrémente le stock de chaque article vendu (via Product.update)
   c. Met à jour les statistiques du client (si identifié)
   d. Hook afterCreate : crée l'Activité et la Notification
7. Le reçu peut être affiché/imprimé
8. Le panier est vidé pour la prochaine vente
```

#### Session de caisse (`CashSession`)

LUMO gère les sessions de caisse pour la comptabilité :
- **Ouverture** : Saisie du fonds de caisse initial (ex: 100 USD)
- **En cours** : Chaque vente s'additionne à la session
- **Fermeture** : Calcul du total encaissé, comparaison avec le fonds théorique
- **Écart** : Détection automatique des différences entre caisse théorique et physique

#### Store Zustand pour le panier

```typescript
// useCartStore.ts
interface CartItem {
  id: number;
  nom: string;
  prix: number;
  quantite: number;
  stock: number;
  // ...
}
// Actions : addToCart, removeFromCart, updateQuantity, clearCart
```

### 3.5.4 Cas pratique

**Scénario de vente** :
1. Client arrive et veut 2 chemises et 1 pantalon
2. Le caissier Paul cherche "Chemise" → apparaît dans la liste
3. Clique pour ajouter × 2 → le panier affiche 2×15 USD = 30 USD
4. Ajoute "Pantalon" × 1 = 25 USD
5. Total : 55 USD
6. Client donne 60 USD
7. Rendu : 5 USD
8. Paul clique "Valider" → Vente #247 créée, stocks mis à jour automatiquement

### 3.5.5 Questions possibles du jury

**Q : Que se passe-t-il si un produit est vendu alors que son stock est à 0 ?**
> **R :** Le contrôleur `SaleController.js` vérifie le stock disponible avant de valider la vente. Si le stock est insuffisant, la vente est refusée avec un message d'erreur. Cette vérification est faite côté serveur (et non seulement côté client) pour garantir la cohérence des données même en cas d'accès concurrent.

**Q : Qu'est-ce qu'une session de caisse ?**
> **R :** Une `CashSession` est un enregistrement qui représente une période de travail d'un caissier. Elle commence avec un fonds initial (ex: 50 000 CDF) et se termine en fin de journée. Elle agrège toutes les ventes de cette période et permet de calculer l'écart entre la caisse théorique et la caisse physique. C'est un outil de contrôle anti-fraude.

---

## MODULE 6 — CLIENTS

### 3.6.1 Définition
Le module Clients est un mini-CRM (Customer Relationship Management) intégré à LUMO. Il gère la liste des clients, leur historique d'achats, et leurs dettes.

### 3.6.2 Fonctionnement détaillé

**Page** : `pages/Clients.tsx` (39 986 octets)

**Modèle** : `models/Client.js`

**Contrôleur** : `controllers/clientController.js`

Structure d'un client :
```javascript
const Client = sequelize.define('Client', {
  id, nom, telephone, email, adresse,
  detteTotale: { type: DECIMAL, defaultValue: 0 }, // Dettes accumulées
  userId                                            // Appartient à quel admin
});
```

### Gestion des dettes (module Dettes)

**Page** : `pages/Dettes.tsx` (35 695 octets)

LUMO permet de vendre à crédit et de suivre les dettes :
- Un client peut acheter sans payer immédiatement
- La dette est ajoutée à `detteTotale` du client
- Quand il rembourse, la dette est réduite
- L'historique des paiements est tracé

### 3.6.3 Questions possibles du jury

**Q : Comment LUMO gère-t-il les clients anonymes ?**
> **R :** Dans LUMO, si un client n'est pas enregistré, la vente est assignée à un "Client de passage" avec `clientInfo: { nom: 'Client de passage', email: '' }`. Ce champ JSONB sur le modèle Sale permet de garder les informations de base sans lier la vente à un client enregistré.

---

## MODULE 7 — FOURNISSEURS

### 3.7.1 Définition
Le module Fournisseurs gère les partenaires commerciaux de l'entreprise auprès desquels elle s'approvisionne.

### 3.7.2 Fonctionnement

**Page** : `pages/Fournisseurs.tsx` (21 094 octets)

**Modèle** : `models/Fournisseur.js`

**Contrôleur** : `controllers/fournisseurController.js`

Structure :
```javascript
const Fournisseur = sequelize.define('Fournisseur', {
  id, nom, entreprise, telephone, email, adresse, userId
});
```

Association : `Fournisseur.hasMany(Purchase)` — un fournisseur peut avoir plusieurs achats.

### 3.7.3 Questions possibles du jury

**Q : Quelle est la différence entre un Client et un Fournisseur dans LUMO ?**
> **R :** Un **Client** est quelqu'un à qui on **vend** des produits (flux sortant de marchandises, flux entrant d'argent). Un **Fournisseur** est quelqu'un à qui on **achète** des produits (flux entrant de marchandises, flux sortant d'argent). Dans la base de données, ce sont deux tables distinctes : `Clients` et `Fournisseurs`, avec des associations différentes (`Client.hasMany(Sale)` vs `Fournisseur.hasMany(Purchase)`).

---

## MODULE 8 — ACHATS (Purchases)

### 3.8.1 Définition
Le module Achats enregistre les commandes passées auprès des fournisseurs et met automatiquement à jour le stock lors de la réception des marchandises.

### 3.8.2 Fonctionnement

**Page** : `pages/Purchases.tsx` (52 697 octets)

**Modèle** : `models/purchase.model.js`

**Contrôleur** : `controllers/purchaseController.js`

```javascript
const Purchase = sequelize.define('Purchase', {
  id, userId, fournisseurId,
  articles:      { type: JSONB },  // Liste des produits achetés
  montantTotal:  { type: FLOAT },
  statut:        { type: STRING },  // 'Commandé', 'Reçu', 'Partiel'
});
```

Association : `Purchase.belongsTo(Fournisseur)` — chaque achat est lié à un fournisseur.

Quand un achat passe au statut "Reçu" → le stock des produits concernés est incrémenté automatiquement.

---

## MODULE 9 — VENTES (Sales)

### 3.9.1 Définition
Le module Ventes affiche l'historique complet de toutes les ventes réalisées, avec possibilité de filtrer, rechercher et analyser.

### 3.9.2 Fonctionnement

**Page** : `pages/Sales.tsx` (49 173 octets)

**Modèle** : `models/sale.model.js`

**Contrôleur** : `controllers/SaleController.js` (21 174 octets)

Le modèle Sale contient :
```javascript
articles:      { type: JSONB }    // [{ productId, nom, quantite, prixUnitaire, total }]
montantTotal:  { type: FLOAT }    // Total de la vente
remise:        { type: FLOAT }    // Remise accordée
profitNet:     { type: FLOAT }    // Profit = (prixVente - prixAchat) × quantite
methodePaiement: { type: STRING } // 'Especes', 'Mobile Money', etc.
statut:        { type: STRING }   // 'Complétée', 'Remboursée', 'En attente'
clientInfo:    { type: JSONB }    // Info client au moment de la vente
devise:        { type: STRING }   // USD ou CDF
tauxChange:    { type: FLOAT }    // Taux au moment de la vente
```

Les ventes peuvent être **remboursées** : le statut passe à "Remboursée" et le stock est réincrémenté.

### 3.9.3 Questions possibles du jury

**Q : Pourquoi stocker `clientInfo` en JSONB dans Sale au lieu de juste `clientId` ?**
> **R :** On stocke une copie des informations du client au moment de la vente (snapshot) pour garantir que si le client est modifié ou supprimé plus tard, les informations de vente restent exactes. `clientId` sert à lier à un client enregistré, mais `clientInfo` (JSONB) préserve les données historiques.

---

## MODULE 10 — HISTORIQUE DES ACTIVITÉS

### 3.10.1 Définition
Le module Activités est le journal d'audit complet de LUMO. Il enregistre toutes les actions significatives effectuées par tous les utilisateurs.

### 3.10.2 Fonctionnement

**Page** : `pages/Activities.tsx` (20 562 octets)

**Modèle** : `models/Activite.js` (1 383 octets)

**Contrôleur** : `controllers/activiteController.js`

Chaque activité enregistre :
```javascript
const Activite = sequelize.define('Activite', {
  id, type,        // 'VENTE', 'CREATION_PRODUIT', 'CONNEXION', etc.
  description,     // Texte lisible : "Vente #45: 150 USD"
  userNom,         // Nom de l'utilisateur ayant effectué l'action
  module,          // 'Caisse', 'Inventaire', 'System', etc.
  UserId,          // FK vers User
  shopId           // FK vers le shop owner
});
```

Les activités sont créées automatiquement par les hooks des modèles (pas manuellement dans les contrôleurs). Types d'activités existants :
- `VENTE`, `SUPPRESSION_VENTE`
- `CREATION_PRODUIT`, `SUPPRESSION_PRODUIT`
- `CONNEXION`, `INSCRIPTION`, `DECONNEXION`
- `ACHAT`, etc.

### 3.10.3 Questions possibles du jury

**Q : Quelle est la différence entre le module Activités et les Notifications ?**
> **R :** Les **Activités** sont un journal d'audit permanent et historique de TOUTES les actions (traçabilité). Les **Notifications** sont des messages temporaires destinés à alerter l'utilisateur d'un événement spécifique (stock faible, nouveau produit). Les notifications peuvent être marquées comme "lues" et ont une interface de notification intégrée. Les activités restent permanentes.

---

## MODULE 11 — STATISTIQUES

### 3.11.1 Définition
Le module Statistiques fournit des analyses graphiques et chiffrées approfondies de la performance commerciale.

### 3.11.2 Fonctionnement

**Page** : `pages/Stats.tsx` (22 020 octets)

**Contrôleur** : `controllers/statsController.js` (339 lignes, 12 935 octets)

**Routes** : `routes/statsRoutes.js`

Statistiques calculées :
- Évolution du chiffre d'affaires (par jour, semaine, mois)
- Produits les plus vendus (top sellers)
- Clients les plus actifs
- Marges par produit
- Comparaison période actuelle vs précédente
- Répartition par méthode de paiement
- Analyse des dépenses

#### Calcul du profit net

```javascript
// Pour chaque article d'une vente
profitLigne = (prixVente - prixAchat) × quantite

// Profit net total de la vente
sale.profitNet = Σ profitLigne - remise
```

### 3.11.3 Questions possibles du jury

**Q : Comment LUMO calcule-t-il le profit net ?**
> **R :** Pour chaque article vendu, LUMO calcule `(prix de vente - prix d'achat) × quantité`. La somme de ces profits pour tous les articles d'une vente, moins la remise accordée, donne le `profitNet` stocké dans la table Sales. Le Dashboard et Stats agrègent ces valeurs pour des périodes données. Le taux de change est appliqué pour les ventes en devise étrangère.

---

## MODULE 12 — PARAMÈTRES (Settings)

### 3.12.1 Définition
Le module Paramètres permet à l'administrateur de personnaliser son espace LUMO selon ses besoins.

### 3.12.2 Fonctionnement

**Page** : `pages/Settings.tsx` (97 183 octets — fichier très volumineux)

Paramètres configurables :
- **Profil** : Nom, email, téléphone, avatar
- **Entreprise** : Nom du commerce, logo, adresse, devise principale
- **Thème** : Mode sombre / clair (stocké dans `preferences.theme`)
- **Langue** : Français / Anglais (stocké dans `preferences.language`)
- **Devise** : USD / CDF (stocké dans `preferences.currency`)
- **Taux de change** : USD → CDF (stocké dans `preferences.exchangeRate`)
- **Modules activés** : Quels modules sont visibles dans le menu
- **Sauvegarde automatique** : Activer/désactiver + heure de backup
- **Notifications sonores** : Activer/désactiver
- **2FA** : Activer la double authentification
- **Sous-utilisateurs** : Créer et gérer les comptes employés

#### Store de paramètres

```typescript
// store/useSettingsStore.ts
interface SettingsState {
  currency: 'USD' | 'CDF';
  language: 'fr' | 'en';
  theme: 'light' | 'dark';
}
```

Les préférences sont synchronisées avec le serveur via `syncPreferencesToServer()` dans `useAuthStore`.

---

## MODULE 13 — ASSISTANT IA

### 3.13.1 Définition
L'Assistant IA est une fonctionnalité avancée de LUMO qui utilise l'API DeepSeek pour fournir des analyses commerciales intelligentes, des conseils personnalisés et des réponses aux questions de l'utilisateur.

*(Voir Chapitre 11 pour le détail complet de ce module)*

---

## MODULE 14 — GESTION DES UTILISATEURS

### 3.14.1 Définition
Le module Utilisateurs permet à l'administrateur de créer et gérer des comptes pour ses employés (sous-utilisateurs) avec des permissions granulaires.

### 3.14.2 Fonctionnement

**Page** : `pages/Users.tsx` (22 334 octets)

**Contrôleur** : `controllers/subUserController.js` (6 187 octets)

**Route** : `routes/subUserRoutes.js`

Un sous-utilisateur est lié à l'admin par `parentId = admin.id`. Ses permissions sont définies dans un tableau JSONB `permissions = ['products', 'sales', 'pos']`.

Les permissions disponibles correspondent aux modules de LUMO.

---

## MODULE 15 — SUPERADMIN DASHBOARD

### 3.15.1 Définition
Le tableau de bord SuperAdmin est réservé au premier utilisateur créé sur la plateforme. Il gère l'ensemble de la plateforme LUMO multi-commerces.

### 3.15.2 Fonctionnement

**Page** : `pages/SuperAdminDashboard.tsx` (109 082 octets — le plus gros fichier du projet)

**Contrôleur** : `controllers/superAdminController.js` (15 426 octets)

**Route** : `routes/superadminRoutes.js`

Fonctionnalités exclusives :
- Liste de tous les comptes admin enregistrés sur la plateforme
- Validation/rejet des nouveaux comptes
- Suspension/réactivation des comptes
- Statistiques globales de la plateforme
- Mode maintenance (bloque tous les accès non-superadmin)
- Impersonation (se connecter en tant qu'un autre utilisateur pour le support)

#### Impersonation

```javascript
// authController.js
if (decoded.isImpersonating) {
    req.isImpersonating = true;
    req.originalAdminId = decoded.originalAdminId;
}
```

Le SuperAdmin peut temporairement accéder au compte d'un admin pour l'aider sans connaître son mot de passe.

---

# CHAPITRE 4 — FONCTIONNEMENT DÉTAILLÉ DE CHAQUE BOUTON {#chapitre-4}

## 4.1 Boutons du module Authentification

### Bouton "S'inscrire" (Register)

| Niveau | Action |
|--------|--------|
| **Frontend** | Soumet le formulaire, appelle Axios `POST /api/auth/register` avec multer pour l'avatar |
| **Backend** | `authController.registerAdmin()` valide via Joi, vérifie l'unicité email, hash le code vérif |
| **API** | Route `POST /api/v1/auth/register` avec `uploadMiddleware` pour l'avatar |
| **BDD** | `INSERT INTO "Users"` avec mot de passe haché par bcrypt (hook beforeSave) |

### Bouton "Se connecter" (Login)

| Niveau | Action |
|--------|--------|
| **Frontend** | Collecte email + mot de passe, appelle `POST /api/auth/login` |
| **Backend** | `loginUser()` : recherche utilisateur, compare hash, génère JWT + sessionId |
| **API** | Route `POST /api/v1/auth/login` avec `authLimiter` (100 req / 15 min) |
| **BDD** | `SELECT * FROM "Users" WHERE email ILIKE ?`, puis `UPDATE activeSessions` |

### Bouton "Se déconnecter" (Logout)

| Niveau | Action |
|--------|--------|
| **Frontend** | Appelle `logout()` de useAuthStore, vide le token local |
| **Backend** | `logoutUser()` met le token en blacklist Redis (TTL 86400s), retire le sessionId |
| **API** | `POST /api/v1/auth/logout` |
| **BDD** | `UPDATE "Users" SET activeSessions = ?` (suppression du sessionId) |

## 4.2 Boutons du module Produits

### Bouton "Ajouter un produit"

| Niveau | Action |
|--------|--------|
| **Frontend** | Ouvre un modal/formulaire, collecte les données, appelle `POST /api/v1/products` |
| **Backend** | `productController.createProduct()` : vérifie le userId, crée le Product |
| **API** | `POST /api/v1/products` (protégé + checkPermission('products.add')) |
| **BDD** | `INSERT INTO "Products"` → hook `afterCreate` → `INSERT INTO "Activites"` |

### Bouton "Modifier un produit"

| Niveau | Action |
|--------|--------|
| **Frontend** | Pre-remplit le formulaire, appelle `PUT /api/v1/products/:id` |
| **Backend** | `productController.updateProduct()` : vérifie ownership, met à jour |
| **API** | `PUT /api/v1/products/:id` |
| **BDD** | `UPDATE "Products" SET ... WHERE id = ?` → si stock change : hook `afterSave` → `INSERT INTO "StockMovements"` |

### Bouton "Supprimer un produit"

| Niveau | Action |
|--------|--------|
| **Frontend** | Demande confirmation, appelle `DELETE /api/v1/products/:id` |
| **Backend** | `productController.deleteProduct()` |
| **API** | `DELETE /api/v1/products/:id` |
| **BDD** | `UPDATE "Products" SET deletedAt = NOW()` (soft delete paranoid) → hook `afterDestroy` → `INSERT INTO "Activites"` |

## 4.3 Boutons du module POS

### Bouton "Valider la vente"

| Niveau | Action |
|--------|--------|
| **Frontend** | Vérifie le panier non vide, collecte methodePaiement et montantRecu, appelle `POST /api/v1/sales` |
| **Backend** | `SaleController.createSale()` : crée la vente, décrémente le stock de chaque article |
| **API** | `POST /api/v1/sales` (protégé) |
| **BDD** | Transaction : `INSERT INTO "Sales"` + `UPDATE "Products" SET stock = stock - quantite` + hooks → `INSERT INTO "Activites"` + `INSERT INTO "Notifications"` |

### Bouton "Vider le panier"

| Niveau | Action |
|--------|--------|
| **Frontend** | Appelle `clearCart()` dans `useCartStore` (Zustand) — opération 100% locale, pas de requête serveur |
| **Backend** | Aucune action |
| **API** | Aucune |
| **BDD** | Aucune |

## 4.4 Bouton "Envoyer" de l'Assistant IA

| Niveau | Action |
|--------|--------|
| **Frontend** | Collecte le message, l'ajoute à l'historique local, appelle `POST /api/v1/ai/chat` |
| **Backend** | `aiController.chat()` : reconstruit le contexte LUMO, appelle DeepSeek API |
| **API** | `POST /api/v1/ai/chat` |
| **BDD** | `SELECT` sur Products, Sales, Clients, Fournisseurs, Purchases en parallèle → `UPDATE "Users" SET chatHistory = ?` |

---

# CHAPITRE 5 — ARCHITECTURE LOGICIELLE {#chapitre-5}

## 5.1 Architecture React (Frontend)

### Structure du projet client

```
client/src/
├── App.tsx                 # Composant racine + routes React Router
├── main.tsx                # Point d'entrée (ReactDOM.createRoot)
├── index.css               # Styles globaux + variables CSS + thème
├── api/
│   └── axios.ts            # Instance Axios configurée + intercepteurs
├── pages/                  # Pages de l'application (une par module)
│   ├── Dashboard.tsx
│   ├── POS.tsx
│   ├── Products.tsx
│   ├── Sales.tsx
│   ├── Purchases.tsx
│   ├── Clients.tsx
│   ├── Fournisseurs.tsx
│   ├── Stats.tsx
│   ├── Activities.tsx
│   ├── StockHistory.tsx
│   ├── Settings.tsx
│   ├── Users.tsx
│   ├── Cash.tsx
│   ├── Dettes.tsx
│   ├── SuperAdminDashboard.tsx
│   ├── Landing.tsx         # Page d'accueil publique
│   └── auth/               # Pages d'authentification
│       ├── Login.tsx
│       ├── Register.tsx
│       ├── VerifyEmail.tsx
│       ├── ForgotPassword.tsx
│       ├── VerifyResetOTP.tsx
│       └── ResetPassword.tsx
├── components/             # Composants réutilisables
│   └── layout/
│       └── Layout.tsx      # Layout principal avec sidebar et navbar
├── store/                  # État global Zustand
│   ├── useAuthStore.ts     # Auth, user, theme, langue, devise
│   ├── useCartStore.ts     # Panier POS
│   └── useSettingsStore.ts # Préférences UI
├── hooks/                  # Hooks React personnalisés
├── i18n/                   # Internationalisation (fr/en)
├── constants/              # Constantes de l'application
├── services/               # Services métier frontend
├── utils/                  # Utilitaires
└── translations.ts         # Fichier de traduction (86 524 octets !)
```

### Lazy Loading

LUMO utilise le **lazy loading** React pour optimiser les performances. Au lieu de charger tout le JavaScript au démarrage, chaque page n'est chargée que quand l'utilisateur y accède :

```tsx
// App.tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
// ...
```

Un `<Suspense fallback={<LoadingFallback />}>` affiche un spinner pendant le chargement.

### Gestion de l'état avec Zustand

Zustand est une bibliothèque de gestion d'état légère pour React. Contrairement à Redux, elle ne nécessite pas de boilerplate complexe.

```typescript
// useAuthStore.ts - Structure simplifiée
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  theme: 'light',
  
  setAuth: (user, token) => {
    localStorage.setItem('token', encodeData(token));
    set({ user, token });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  
  checkAuth: async () => {
    const response = await api.get('/auth/me');
    set({ user: response.data });
  }
}));
```

### Configuration Axios

```typescript
// api/axios.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Intercepteur de requête : ajoute le token JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Intercepteur de réponse : gère 401 (token expiré)
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Tentative de refresh token
      // Si échoue → déconnexion
    }
    return Promise.reject(error);
  }
);
```

## 5.2 Architecture Express (Backend)

### Structure du projet serveur

```
server/
├── server.js               # Point d'entrée principal
├── config/
│   ├── index.js            # Configuration centralisée (JWT, DB, AI, Redis, Cloudinary)
│   └── database.js         # Connexion Sequelize + SSL
├── models/                 # Modèles Sequelize (définition des tables)
│   ├── index.js            # Associations entre modèles
│   ├── User.js
│   ├── Product.js
│   ├── sale.model.js
│   ├── purchase.model.js
│   ├── Client.js
│   ├── Fournisseur.js
│   ├── Activite.js
│   ├── StockMovement.js
│   ├── CashSession.js
│   ├── Notification.js
│   ├── GlobalSetting.js
│   ├── Feedback.js
│   └── StaffPayment.js
├── controllers/            # Logique métier
├── routes/                 # Définition des endpoints API
├── middleware/             # Middlewares personnalisés
│   ├── authMiddleware.js   # JWT protect + RBAC authorize
│   ├── security.js         # Helmet, CORS, rate-limit, CSRF
│   ├── uploadMiddleware.js # Multer pour uploads d'images
│   ├── validators.js       # Validation Joi
│   └── errorHandler.js     # Gestion centralisée des erreurs
├── utils/
│   ├── logger.js           # Winston logging
│   ├── redis.js            # Client Redis
│   ├── generateToken.js    # Génération JWT
│   ├── emailService.js     # Nodemailer/Resend
│   └── cloudinary.js       # Upload images
├── cron/
│   └── backupCron.js       # Tâches planifiées (backup automatique)
├── migrations/             # Migrations Sequelize
├── seeders/                # Données initiales
└── swagger/
    └── swagger.js          # Documentation API automatique
```

### Middleware Stack (ordre d'exécution)

```
Requête HTTP
     ↓
Sentry (monitoring)
     ↓
express.json() + express.urlencoded()
     ↓
compression()
     ↓
helmet() — headers de sécurité
     ↓
xss() — nettoyage XSS
     ↓
hpp() — protection paramètres HTTP
     ↓
cors() — contrôle des origines
     ↓
cookieParser()
     ↓
CSRF Protection
     ↓
Rate Limiting (apiLimiter / authLimiter)
     ↓
Morgan logging (via custom logger)
     ↓
Route Handler
     ↓
authMiddleware.protect (JWT)
     ↓
authMiddleware.authorize (RBAC rôle)
     ↓
authMiddleware.checkPermission (RBAC granulaire)
     ↓
Controller
     ↓
Model (Sequelize)
     ↓
PostgreSQL
     ↓
Réponse JSON
```

## 5.3 Les Contrôleurs en détail

### Convention de nommage et responsabilités

| Contrôleur | Lignes | Responsabilité principale |
|------------|--------|--------------------------|
| `authController.js` | 763 | Inscription, connexion, 2FA, OAuth, refresh, reset password |
| `aiController.js` | 620 | Contexte LUMO pour IA, streaming DeepSeek |
| `SaleController.js` | ~400 | CRUD ventes, calcul profits, remboursements |
| `superAdminController.js` | ~300 | Gestion plateforme globale, impersonation |
| `statsController.js` | 339 | KPI dashboard, statistiques avancées |
| `backupController.js` | ~300 | Export BDD, restauration, historique backups |
| `productController.js` | ~200 | CRUD produits, import/export |
| `purchaseController.js` | ~150 | CRUD achats, mise à jour stock à réception |
| `clientController.js` | ~150 | CRUD clients, gestion dettes |
| `subUserController.js` | ~150 | CRUD sous-utilisateurs, permissions |

## 5.4 Flux complet des données (exemple end-to-end)

### Création d'une vente POS — flux complet

```
[React POS.tsx]
  → useCartStore.getState().items     // Récupère le panier Zustand
  → axios.post('/api/v1/sales', {...}) // Axios + Bearer token

[Express - server.js]
  → app.use('/api', v1Routes)
  → v1Routes.use('/sales', SaleRoutes)

[Express - SaleRoutes.js]
  → router.post('/', protect, SaleController.createSale)
  
[authMiddleware - protect]
  → Vérifie Bearer token JWT
  → redis.exists(`blacklist:${token}`)
  → jwt.verify(token, JWT_SECRET)
  → User.findByPk(decoded.id)
  → Vérifie session active
  → req.user = user

[SaleController - createSale]
  → const sale = await Sale.create({...})
  → Pour chaque article : Product.update({ stock: stock - quantite })
  → Calcul profitNet

[Sequelize Model Hooks]
  → Sale.afterCreate → Activite.create({ type: 'VENTE', ... })
  → Product.afterSave (si stock change) → StockMovement.create(...)
  → Si stock < stockAlerte → Notification.create({ type: 'WARNING' })

[WebSocket - Socket.io]
  → global.io.to(`user_${userId}`).emit('notification', {...})

[PostgreSQL]
  → INSERT INTO "Sales" (...)
  → UPDATE "Products" SET stock = stock - N WHERE id = ?
  → INSERT INTO "Activites" (...)
  → INSERT INTO "StockMovements" (...)
  → INSERT INTO "Notifications" (...)

[Réponse JSON → React]
  → { success: true, sale: {...} }
  → useCartStore.clearCart()
  → Toast "Vente enregistrée avec succès !"
  → Re-fetch dashboard stats
```

---

# CHAPITRE 6 — TECHNOLOGIES UTILISÉES {#chapitre-6}

## 6.1 React.js

### Définition
React est une bibliothèque JavaScript open-source développée par **Facebook (Meta)** en **2013**. Elle permet de créer des interfaces utilisateur à partir de composants réutilisables. React utilise un **DOM virtuel (Virtual DOM)** pour optimiser les mises à jour de l'interface.

### Historique
- **2013** : Création par Jordan Walke chez Facebook, open-sourcé
- **2015** : React Native (applications mobiles)
- **2016** : React 15 — stabilité et performance
- **2019** : React 16.8 — introduction des **Hooks** (`useState`, `useEffect`)
- **2022** : React 18 — rendu concurrent, Suspense, `useTransition`

### Pourquoi React dans LUMO ?
- **Composants réutilisables** : Un bouton, un modal, un tableau peuvent être créés une fois et réutilisés partout
- **SPA (Single Page Application)** : Navigation rapide sans rechargement de page (React Router)
- **Écosystème riche** : Zustand, Axios, Framer Motion, Lucide Icons, Sonner...
- **TypeScript natif** : LUMO utilise `.tsx` pour le typage statique
- **Lazy Loading** : Chargement à la demande des pages pour de meilleures performances

### Comparaison avec les alternatives

| Critère | React | Vue.js | Angular |
|---------|-------|--------|---------|
| Popularité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Courbe d'apprentissage | Modérée | Facile | Difficile |
| Performance | Excellente | Excellente | Bonne |
| Écosystème | Très riche | Riche | Complet |
| Flexibilité | Très flexible | Flexible | Opiné |
| TypeScript | Support natif | Support | Inclus |

### Avantages de React
1. DOM virtuel = mises à jour efficaces
2. Unidirectionnalité du flux de données (plus prévisible)
3. Hooks : logique réutilisable sans classes
4. Suspense + Concurrent Mode : UX fluide
5. DevTools puissants

### Inconvénients
1. Bibliothèque uniquement (pas de framework complet)
2. Boilerplate parfois verbeux
3. Fragmentation de l'écosystème (choix difficile)

### Questions du jury

**Q : Qu'est-ce que le Virtual DOM de React ?**
> **R :** Le Virtual DOM est une représentation légère en JavaScript de l'arbre DOM réel du navigateur. Quand l'état d'un composant change, React crée un nouvel arbre Virtual DOM, le compare avec le précédent (algorithme de "diffing"), et ne met à jour dans le DOM réel que les parties qui ont réellement changé. Cela évite des opérations DOM coûteuses et accélère l'interface.

**Q : Qu'est-ce qu'un Hook React et donnez un exemple dans LUMO ?**
> **R :** Un Hook est une fonction spéciale qui permet d'accrocher des fonctionnalités React (état, effets secondaires) dans des composants fonctionnels. Dans LUMO, `useEffect` dans `App.tsx` est utilisé pour initialiser le token CSRF au démarrage : `useEffect(() => { api.get('/csrf-token').catch(() => {}); }, [])`. Le tableau vide `[]` signifie que cet effet ne s'exécute qu'une seule fois, au montage.

---

## 6.2 Node.js

### Définition
Node.js est un environnement d'exécution JavaScript côté serveur, basé sur le moteur **V8** de Google Chrome. Créé par **Ryan Dahl** en **2009**, il permet d'exécuter du JavaScript hors du navigateur.

### Historique
- **2009** : Création par Ryan Dahl, présenté à la JSConf
- **2010** : npm (Node Package Manager) créé
- **2015** : Publication du standard ES6 (modules, arrow functions...)
- **2020** : Node 14 LTS — support ES Modules
- **2023** : Node 20 LTS — actuel

### Pourquoi Node.js dans LUMO ?
- **JavaScript full-stack** : Même langage frontend et backend → moins de contexte-switching
- **Non-bloquant (asynchrone)** : Gère des milliers de connexions simultanées via l'event loop
- **npm** : Plus de 2 millions de packages disponibles
- **Performance** : Le moteur V8 compile JavaScript en code machine natif

### Event Loop (moteur de Node.js)

```
┌─────────────────────────────┐
│         Event Loop          │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │Timers│→│I/O   │→│Poll  ││  
│  └──────┘ └──────┘ └──────┘│
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │Check │→│Close │→│Timers││
│  └──────┘ └──────┘ └──────┘│
└─────────────────────────────┘
```

Dans LUMO, les requêtes à PostgreSQL, Redis et DeepSeek API sont toutes **asynchrones** (async/await), ce qui permet au serveur de traiter d'autres requêtes pendant qu'il attend une réponse de la base de données.

### Comparaison

| Critère | Node.js | PHP | Python (Django) |
|---------|---------|-----|-----------------|
| Performance I/O | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Concurrence | Non-bloquant | Bloquant | Asynchrone |
| Maturité | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Même langage front/back | ✅ | ❌ | ❌ |

### Questions du jury

**Q : Pourquoi Node.js est-il dit "non-bloquant" ?**
> **R :** Node.js utilise un modèle I/O non-bloquant basé sur l'event loop. Quand une opération longue (requête BDD, appel API) est lancée, Node ne bloque pas le thread principal. Il enregistre un callback et continue à traiter d'autres requêtes. Quand l'opération termine, le callback est exécuté. Dans LUMO, toutes les opérations Sequelize utilisent `async/await` qui est du sucre syntaxique sur les Promises, exploitant ce modèle non-bloquant.

---

## 6.3 Express.js

### Définition
Express.js est un framework web minimaliste pour Node.js, créé par **TJ Holowaychuk** en **2009**. Il est le framework Node.js le plus populaire au monde.

### Pourquoi Express dans LUMO ?
- **Léger** : Ne force pas de structure. LUMO implémente sa propre architecture MVC
- **Middleware** : Système de plugins pour sécurité, logging, parsing
- **Routing** : Définition claire des routes API REST
- **Maturité** : Stable, bien documenté, énorme communauté

### Structure d'une route Express dans LUMO

```javascript
// routes/productRoutes.js
const router = express.Router();

router.get('/', protect, productController.getProducts);
router.post('/', protect, checkPermission('products.add'), upload, productController.createProduct);
router.put('/:id', protect, checkPermission('products.edit'), productController.updateProduct);
router.delete('/:id', protect, checkPermission('products.delete'), productController.deleteProduct);
```

Chaque route est composée de :
1. **Méthode HTTP** : GET, POST, PUT, DELETE
2. **Chemin** : `/` ou `/:id`
3. **Middlewares** : `protect` (JWT), `checkPermission` (RBAC), `upload` (multer)
4. **Contrôleur** : La fonction qui gère la logique

### Versioning API dans LUMO

```javascript
// server.js
const v1Routes = express.Router();
app.use('/api', v1Routes);
app.use('/api/v1', v1Routes);
```

LUMO supporte les deux chemins `/api/*` et `/api/v1/*` pour la compatibilité.

### Questions du jury

**Q : Qu'est-ce qu'un middleware Express ?**
> **R :** Un middleware est une fonction qui a accès à la requête (`req`), la réponse (`res`), et la prochaine fonction middleware (`next`). Il peut modifier `req`/`res`, terminer le cycle requête-réponse, ou passer la main au middleware suivant avec `next()`. Dans LUMO, `protect` est un middleware qui vérifie le JWT avant chaque route protégée. Si le token est invalide, il retourne `401` sans appeler `next()`.

---

## 6.4 PostgreSQL

### Définition
PostgreSQL est un système de gestion de base de données relationnelle (SGBDR) open-source, créé en **1986** à l'Université de Californie Berkeley. Il est réputé pour sa conformité aux standards SQL, sa robustesse et ses fonctionnalités avancées.

### Pourquoi PostgreSQL dans LUMO ?
- **JSONB natif** : LUMO stocke des données flexibles (variantes, preferences, articles) en JSONB, indexable et requêtable
- **Fiabilité** : Transactions ACID complètes garantissent la cohérence des données
- **Scalabilité** : Supporte des millions d'enregistrements
- **Railway** : Support natif et déploiement simple via Railway
- **Sequelize** : ORM mature avec support PostgreSQL complet

### Tables principales de LUMO

| Table | Colonnes clés | Usage |
|-------|--------------|-------|
| `Users` | id, nom, email, motDePasse, role, parentId, preferences (JSONB), permissions (JSONB) | Comptes utilisateurs |
| `Products` | id, nom, prix, prixAchat, stock, stockAlerte, devise, variantes (JSONB), userId | Catalogue produits |
| `Sales` | id, userId, clientId, articles (JSONB), montantTotal, profitNet, statut | Ventes |
| `Purchases` | id, userId, fournisseurId, articles (JSONB), montantTotal, statut | Achats |
| `Clients` | id, nom, telephone, detteTotale, userId | Clients |
| `Fournisseurs` | id, nom, entreprise, telephone, userId | Fournisseurs |
| `StockMovements` | id, productId, userId, type, quantite, ancienStock, nouveauStock | Historique stock |
| `Activites` | id, type, description, userNom, module, UserId, shopId | Journal d'audit |
| `Notifications` | id, userId, titre, contenu, type, isRead | Notifications |
| `CashSessions` | id, userId, fondInitial, totalVentes, statut | Sessions caisse |
| `GlobalSettings` | id, key, value | Paramètres globaux |

### JSONB dans PostgreSQL

LUMO utilise intensément JSONB pour la flexibilité :

```sql
-- Exemple : rechercher un utilisateur dont le thème est 'dark'
SELECT * FROM "Users" WHERE preferences->>'theme' = 'dark';

-- Exemple : trouver les produits avec une variante 'Taille'
SELECT * FROM "Products" WHERE variantes @> '[{"nom": "Taille"}]';
```

### Comparaison

| Critère | PostgreSQL | MySQL | MongoDB |
|---------|------------|-------|---------|
| Type | Relationnel | Relationnel | Document |
| JSONB | ✅ Natif | Basique | ✅ Natif |
| ACID | ✅ Complet | ✅ InnoDB | ✅ Partiel |
| Scalabilité | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| SQL Standard | ✅ Très conforme | ⭐⭐⭐ | N/A |

### Questions du jury

**Q : Qu'est-ce que ACID et pourquoi est-ce important dans LUMO ?**
> **R :** ACID signifie Atomicité, Cohérence, Isolation, Durabilité. Dans LUMO, lors d'une vente POS, plusieurs opérations doivent réussir ensemble : créer la vente ET décrémenter le stock de chaque produit. Si une opération échoue à mi-chemin (ex: erreur réseau), la transaction est annulée entièrement (rollback). Cela garantit qu'on ne peut pas avoir une vente enregistrée avec un stock non décrémenté, ce qui fausserait l'inventaire.

---

## 6.5 Sequelize (ORM)

### Définition
Sequelize est un ORM (Object-Relational Mapper) pour Node.js. Il permet d'interagir avec PostgreSQL (et d'autres BDD) en utilisant JavaScript/TypeScript plutôt que SQL brut.

### Créateur
Créé par **Sascha Depold** en 2011.

### Fonctionnement dans LUMO

```javascript
// Sans Sequelize (SQL brut) :
const result = await pool.query('SELECT * FROM "Products" WHERE "userId" = $1 AND "deletedAt" IS NULL', [userId]);

// Avec Sequelize :
const products = await Product.findAll({ where: { userId } });
// Sequelize génère automatiquement le SQL correct, gère les types, le paranoid (soft delete), etc.
```

### Fonctionnalités utilisées dans LUMO

1. **Définition des modèles** : `sequelize.define('Product', {...})` → crée et synchronise la table
2. **Associations** : `Product.hasMany(StockMovement)` → jointures automatiques
3. **Hooks** : `beforeSave`, `afterCreate`, `afterDestroy`, `afterSave` → automatisation
4. **Opérateurs** : `Op.lt`, `Op.iLike`, `Op.notIn` → requêtes complexes
5. **Paranoid** : soft delete automatique avec `deletedAt`
6. **JSONB** : `DataTypes.JSONB` → stockage flexible
7. **Transactions** : `sequelize.transaction()` → cohérence ACID
8. **Pool de connexions** : `pool: { max: 5, min: 0 }` → performance

### Comparaison

| Critère | Sequelize | Prisma | TypeORM | Mongoose |
|---------|-----------|--------|---------|----------|
| BDD supportées | Multiple | Multiple | Multiple | MongoDB |
| Maturité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| TypeScript | Partiel | ✅ Natif | ✅ Natif | Partiel |
| Hooks | ✅ | Partiel | ✅ | ✅ |
| Migrations | ✅ | ✅ | ✅ | N/A |

### Questions du jury

**Q : Qu'est-ce qu'un ORM et quels sont ses avantages ?**
> **R :** Un ORM (Object-Relational Mapper) crée un pont entre le code orienté objet (JavaScript) et une base de données relationnelle (SQL). Avantages : 1) Évite d'écrire du SQL brut, réduisant les erreurs ; 2) Protection automatique contre les injections SQL (les valeurs sont toujours paramétrisées) ; 3) Portabilité : changer de BDD (PostgreSQL → MySQL) nécessite moins de changements ; 4) Associations et relations exprimées en JavaScript. Inconvénient : peut générer des requêtes SQL sous-optimales pour des cas complexes.

---

## 6.6 JWT (JSON Web Token)

### Définition
JWT est un standard ouvert (RFC 7519) pour la transmission sécurisée d'informations entre parties sous forme de token JSON signé. Créé en 2010, standardisé en 2015.

### Structure d'un JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6MSwidHlwZSI6ImFjY2VzcyIsInNlc3Npb25JZCI6ImFiYzEyMyIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwOTAwfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

         HEADER                    PAYLOAD                    SIGNATURE
  (algorithme + type)     (données utilisateur)        (vérification)
```

### JWT dans LUMO

```javascript
// utils/generateToken.js (déduit du code)
const generateToken = (userId, sessionId) => {
  const accessToken = jwt.sign(
    { id: userId, type: 'access', sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // ou '30d' si remember me
  );
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh', sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};
```

### Payload du JWT dans LUMO

```json
{
  "id": 42,              // ID utilisateur
  "type": "access",     // Distingue access/refresh tokens
  "sessionId": "abc123", // Contrôle de session concurrent
  "iat": 1700000000,    // Issued At
  "exp": 1700000900     // Expiration
}
```

### Blacklist Redis

LUMO utilise Redis pour invalider les tokens avant leur expiration naturelle :

```javascript
// authMiddleware.js
const isBlacklisted = await redis.exists(`blacklist:${token}`);
if (isBlacklisted) {
  return res.status(401).json({ message: 'Session révoquée' });
}
```

À la déconnexion, le token est ajouté à la blacklist Redis avec un TTL de 86400 secondes.

### Questions du jury

**Q : JWT est-il plus sécurisé que les cookies de session ?**
> **R :** Ce n'est pas une question de sécurité intrinsèque mais d'architecture. Les sessions serveur sont stockées en mémoire/Redis côté serveur → le serveur peut les invalider immédiatement. Les JWT sont auto-suffisants → on ne peut pas les invalider sans une blacklist. LUMO combine les deux approches : JWT pour l'authentification stateless + Redis pour la blacklist. Les JWT sont chiffrés (HS256) et signés → toute modification est détectable. Ils ne doivent PAS contenir d'informations sensibles (comme le mot de passe).

**Q : Quelle est la différence entre l'Access Token et le Refresh Token dans LUMO ?**
> **R :** L'Access Token a une courte durée de vie (15 minutes) et est envoyé à chaque requête API. S'il est volé, il expire vite. Le Refresh Token a une longue durée (30 jours) et n'est utilisé que pour obtenir un nouvel Access Token quand celui-ci expire. LUMO les distingue par le champ `type` dans le payload JWT (`'access'` vs `'refresh'`). Le middleware `protect` rejette tout token dont le type n'est pas `'access'`.

---

## 6.7 Bcrypt

### Définition
Bcrypt est un algorithme de hachage de mots de passe conçu par **Niels Provos et David Mazières** en **1999**. Il est intentionnellement lent pour résister aux attaques par force brute.

### Fonctionnement dans LUMO

```javascript
// models/User.js - Hook beforeSave
hooks: {
  beforeSave: async (user) => {
    if (user.changed('motDePasse') && user.motDePasse) {
      // Ne pas re-hacher si déjà haché (commence par $2a$ ou $2b$)
      const alreadyHashed = user.motDePasse.startsWith('$2a$') || user.motDePasse.startsWith('$2b$');
      if (!alreadyHashed) {
        const salt = await bcrypt.genSalt(10); // 10 rounds
        user.motDePasse = await bcrypt.hash(user.motDePasse, salt);
      }
    }
  }
}
```

### Vérification à la connexion

```javascript
// models/User.js
User.prototype.matchMotDePasse = async function(enteredPassword) {
  if (!this.motDePasse) return false;
  return bcrypt.compare(enteredPassword, this.motDePasse);
};
```

### 10 rounds = sécurité vs performance

- 10 rounds = 2^10 = 1024 itérations de hachage
- ~100ms par vérification → acceptable pour une connexion
- ~100ms par tentative pour un attaquant → 10 essais/seconde maximum

### Questions du jury

**Q : Pourquoi utiliser bcrypt plutôt que MD5 ou SHA-256 pour les mots de passe ?**
> **R :** MD5 et SHA-256 sont des algorithmes rapides, conçus pour la vitesse. Un attaquant peut tester des milliards de hachages MD5 par seconde avec un GPU. Bcrypt est intentionnellement lent (via les rounds) et salé (chaque hash est unique même pour le même mot de passe). Dans LUMO, 10 rounds signifient environ 100ms par vérification, ce qui est imperceptible pour l'utilisateur mais rend une attaque par dictionnaire des millions de fois plus difficile.

---

## 6.8 Helmet.js

### Définition
Helmet est un middleware Express qui configure automatiquement des en-têtes HTTP de sécurité pour protéger contre les attaques web courantes.

### En-têtes configurés par Helmet dans LUMO

```javascript
// middleware/security.js
app.use(helmet());
```

Helmet configure automatiquement :
- `Content-Security-Policy` : Interdit le chargement de ressources non autorisées
- `X-Frame-Options: DENY` : Empêche le clickjacking (LUMO ne peut pas être mis dans un iframe)
- `X-Content-Type-Options: nosniff` : Empêche le sniffing MIME
- `Strict-Transport-Security` : Force HTTPS
- `X-XSS-Protection` : Active la protection XSS du navigateur (legacy)
- `Referrer-Policy` : Contrôle les informations de référent

### Questions du jury

**Q : Qu'est-ce que le clickjacking et comment Helmet le prévient-il ?**
> **R :** Le clickjacking consiste à superposer une iframe invisible de l'application cible sur une autre page. L'utilisateur croit cliquer sur quelque chose d'anodin mais clique en réalité sur l'application cible (ex: valider une transaction). Helmet configure `X-Frame-Options: DENY` qui interdit aux navigateurs de charger LUMO dans une iframe, éliminant ce vecteur d'attaque.

---

## 6.9 CORS (Cross-Origin Resource Sharing)

### Définition
CORS est un mécanisme de sécurité des navigateurs qui bloque les requêtes HTTP provenant d'un domaine différent de celui du serveur, à moins que le serveur ne les autorise explicitement.

### CORS dans LUMO

```javascript
// middleware/security.js
const allowedOrigins = [
    'http://localhost:5173',          // Développement Vite
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CLIENT_URL,           // URL Vercel (prod)
    process.env.FRONTEND_URL,
    'https://lumo-frontend-production-1dba.up.railway.app',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);  // curl, apps mobiles
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('CORS: Origine non autorisée'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', ...],
}));
```

### Questions du jury

**Q : Pourquoi CORS est-il nécessaire dans LUMO ?**
> **R :** LUMO est déployé sur deux domaines différents : le frontend sur Vercel (ex: `lumo.vercel.app`) et le backend sur Railway (ex: `lumo-api.railway.app`). Sans configuration CORS, le navigateur bloquerait toutes les requêtes Axios du frontend vers l'API car elles proviennent d'un domaine différent. La configuration CORS dans LUMO autorise explicitement les origines connues (Vercel, localhost dev) tout en bloquant les requêtes de domaines non autorisés.

---

## 6.10 Axios

### Définition
Axios est une bibliothèque JavaScript basée sur les Promises pour effectuer des requêtes HTTP depuis le navigateur (ou Node.js). Créée par **Matt Zabriskie** en 2014.

### Configuration dans LUMO

```typescript
// api/axios.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,  // Envoie les cookies avec chaque requête
});

// Intercepteur requête : ajoute automatiquement le token JWT
api.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem('lumo_auth');
  const token = rawToken ? decodeData(rawToken) : null;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse : gère le refresh token
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // Tente de refresh le token
      // Si réussi → retry la requête originale
      // Si échoue → logout
    }
    return Promise.reject(error);
  }
);
```

### Questions du jury

**Q : Pourquoi utiliser Axios plutôt que le fetch natif du navigateur ?**
> **R :** Axios offre plusieurs avantages par rapport au `fetch` natif : 1) Interception automatique des requêtes et réponses (pour ajouter le token JWT à chaque requête) ; 2) Transformation automatique du JSON ; 3) Annulation des requêtes ; 4) Timeout configurable ; 5) Gestion des erreurs HTTP (fetch ne rejette que les erreurs réseau, pas les 4xx/5xx) ; 6) `withCredentials` intégré pour les cookies. Dans LUMO, les intercepteurs Axios permettent de gérer le refresh token automatiquement de façon transparente.

---

## 6.11 Zustand

### Définition
Zustand est une bibliothèque de gestion d'état pour React, créée par **Jotai et Poimandres** (l'équipe qui a créé react-spring). Elle offre une alternative simple à Redux.

### Stores dans LUMO

**useAuthStore** : État d'authentification global
- `user` : L'utilisateur connecté
- `token` : JWT access token
- `theme` : 'light' ou 'dark'
- `language` : 'fr' ou 'en'
- `currency` : 'USD' ou 'CDF'
- `exchangeRate` : Taux USD/CDF

**useCartStore** : Panier POS
- `items` : Articles dans le panier
- `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`

**useSettingsStore** : Préférences UI légères

### Persistance

LUMO encode les données sensibles en base64 avant de les stocker dans localStorage :

```typescript
export const encodeData = (data: any) => {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
};
```

### Questions du jury

**Q : Pourquoi Zustand plutôt que Redux dans LUMO ?**
> **R :** Redux est puissant mais nécessite beaucoup de boilerplate (actions, reducers, selectors, middleware). Zustand est minimaliste : un store = une fonction. Dans LUMO, `useAuthStore` gère l'état d'authentification en ~150 lignes là où Redux en nécessiterait 400+. De plus, Zustand intègre nativement la persistance localStorage et permet d'accéder au store hors des composants React (`useAuthStore.getState()`), utile dans les intercepteurs Axios.

---

## 6.12 Tailwind CSS

### Définition
Tailwind CSS est un framework CSS "utility-first" créé par **Adam Wathan** en **2017**. Au lieu de classes CSS sémantiques (`.button`, `.card`), on compose des classes utilitaires directement dans le HTML/JSX.

### Utilisation dans LUMO

```jsx
// Exemple dans un composant LUMO
<button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md">
  Valider la vente
</button>
```

LUMO utilise aussi des **variables CSS** (dans `index.css`) pour les thèmes sombre/clair :

```css
/* index.css */
:root {
  --bg-main: #f8fafc;
  --primary: #6366f1;
  --text-primary: #1e293b;
}

[data-theme="dark"] {
  --bg-main: #0f172a;
  --primary: #818cf8;
  --text-primary: #f1f5f9;
}
```

### Questions du jury

**Q : Qu'est-ce que l'approche "utility-first" de Tailwind ?**
> **R :** L'approche "utility-first" consiste à composer le style directement dans le JSX via des classes utilitaires prédéfinies (`bg-blue-600`, `flex`, `rounded-lg`) plutôt que d'écrire du CSS séparé. Avantages : pas de fichiers CSS à gérer, styles toujours scopés au composant, cohérence du design system. Inconvénient : les JSX peuvent devenir verbeux avec beaucoup de classes. LUMO combine Tailwind avec des variables CSS (`--primary`, `--bg-main`) pour le système de thèmes clair/sombre.

---

## 6.13 Google OAuth

### Définition
Google OAuth 2.0 est un protocole d'autorisation qui permet à LUMO d'authentifier des utilisateurs via leur compte Google, sans gérer leur mot de passe directement.

### Flux OAuth dans LUMO

```
1. L'utilisateur clique "Se connecter avec Google"
2. Le frontend redirige vers Google (avec client_id, scope, redirect_uri)
3. Google affiche sa page de connexion / sélection de compte
4. L'utilisateur autorise → Google redirige vers LUMO avec un "code"
5. Le backend échange ce code contre un access_token Google
6. LUMO récupère les informations du profil (nom, email, photo)
7. LUMO crée ou trouve l'utilisateur correspondant en base
8. LUMO génère son propre JWT et répond au frontend
```

### Firebase dans LUMO

LUMO utilise **Firebase Admin SDK** (visible dans `package.json` : `firebase-admin: ^11.11.0`) pour la vérification des tokens Google côté serveur. Le fichier `lumo-58279-firebase-adminsdk-fbsvc-33532c1e1a.json` contient les credentials Firebase.

---

## 6.14 Multer

### Définition
Multer est un middleware Express pour la gestion des uploads de fichiers multipart/form-data. Créé par la communauté Express.

### Utilisation dans LUMO

```javascript
// middleware/uploadMiddleware.js
const multer = require('multer');

const storage = multer.memoryStorage(); // Stockage en mémoire (buffer)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont autorisées'), false);
  }
});
```

Les images uploadées via Multer sont ensuite envoyées sur **Cloudinary** :

```javascript
// authController.js
const avatarUrl = req.file 
  ? await uploadAvatarToCloudinary(req.file.buffer, req.file.mimetype) 
  : 'default_avatar.png';
```

### Questions du jury

**Q : Pourquoi stocker les images sur Cloudinary plutôt que sur le serveur ?**
> **R :** Les serveurs Railway ont un stockage éphémère : les fichiers sont supprimés lors d'un redéploiement. Cloudinary est un CDN (Content Delivery Network) spécialisé dans les médias qui offre : stockage permanent, optimisation automatique des images, transformations à la volée (redimensionnement, compression), URLs CDN rapides. LUMO stocke seulement l'URL Cloudinary en base de données, pas l'image elle-même.

---

## 6.15 Morgan

### Définition
Morgan est un middleware HTTP request logger pour Express. Il enregistre des informations sur chaque requête reçue par le serveur.

### Utilisation dans LUMO

LUMO utilise Morgan via son propre logger Winston personnalisé :

```javascript
// server.js
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

Chaque requête est loggée avec : méthode HTTP, URL, code de statut, durée en ms. Les logs sont gérés par **Winston** avec rotation quotidienne (`winston-daily-rotate-file`).

---

## 6.16 Redis

### Définition
Redis est un système de stockage de données en mémoire clé-valeur ultra-rapide. Dans LUMO, Redis joue plusieurs rôles :

1. **Blacklist JWT** : Tokens révoqués stockés avec TTL
2. **Adapter Socket.io** : Pour synchroniser les WebSockets entre plusieurs processus PM2
3. **Cache** : Pour les données fréquemment accédées

```javascript
// authMiddleware.js
await redis.set(`blacklist:${token}`, 'true', 'EX', 86400);
```

### Questions du jury

**Q : Pourquoi avoir besoin de Redis en plus de PostgreSQL ?**
> **R :** PostgreSQL est une BDD relationnelle persistante, optimisée pour les requêtes SQL complexes. Redis est une BDD clé-valeur en mémoire, optimisée pour les lectures/écritures ultra-rapides (~0.1ms vs ~10ms pour PostgreSQL). Dans LUMO, Redis est utilisé pour la blacklist des tokens car cette vérification se fait à chaque requête authentifiée : une BDD PostgreSQL serait trop lente. Redis est aussi utilisé pour le Redis Adapter de Socket.io, qui permet à plusieurs instances du serveur (PM2 cluster) de partager les événements WebSocket.

---

## 6.17 Socket.io

### Définition
Socket.io est une bibliothèque JavaScript qui permet la communication en temps réel bidirectionnelle entre le serveur et les clients via WebSockets (avec fallback sur long-polling).

### Dans LUMO

```javascript
// server.js
const io = new Server(server, { 
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

io.on("connection", (socket) => {
    socket.on("join", (userId) => {
        socket.join(`user_${userId}`);  // Rejoint une room personnalisée
    });
});

// Depuis n'importe quel contrôleur :
global.io.to(`user_${userId}`).emit('notification', { titre, contenu });
```

Les notifications de stock faible, de nouvelles activités, etc. sont envoyées en temps réel via Socket.io.

---

## 6.18 DeepSeek API

### Définition
DeepSeek est une entreprise d'IA chinoise qui fournit une API de LLM (Large Language Model) compatible avec l'API OpenAI. LUMO l'utilise pour son assistant IA.

*(Voir Chapitre 11 pour le détail complet)*

---

## 6.19 Railway

### Définition
Railway est une plateforme cloud de déploiement qui permet de déployer des applications Node.js et des bases de données PostgreSQL facilement.

*(Voir Chapitre 12 pour le détail complet)*

---

## 6.20 Vercel

### Définition
Vercel est une plateforme de déploiement spécialisée dans les applications frontend React/Next.js.

*(Voir Chapitre 12 pour le détail complet)*

---

## 6.21 Sentry

### Définition
Sentry est un outil de monitoring d'erreurs en production. Dans LUMO, il capture automatiquement les erreurs non gérées et envoie des alertes.

```javascript
// server.js
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}
```

---

# CHAPITRE 7 — GLOSSAIRE COMPLET {#chapitre-7}

## A

**Access Token** : Jeton JWT de courte durée (15 minutes dans LUMO) utilisé pour authentifier chaque requête API. Doit être envoyé dans le header `Authorization: Bearer <token>`.

**ACID** : Propriétés des transactions de bases de données : **A**tomicité (tout ou rien), **C**ohérence (la BDD reste valide), **I**solation (les transactions ne s'interfèrent pas), **D**urabilité (les données persistent après commit).

**API** : Application Programming Interface. Interface qui permet à deux applications de communiquer. Dans LUMO, l'API REST permet au frontend React de communiquer avec le backend Express.

**API REST** : API qui respecte les principes REST (Representational State Transfer) : utilisation des verbes HTTP (GET, POST, PUT, DELETE), sans état, format JSON.

**async/await** : Syntaxe JavaScript pour gérer les opérations asynchrones de façon synchrone. `await` "attend" qu'une Promise se résolve avant de continuer.

**Atomicité** : Propriété d'une transaction : soit toutes les opérations réussissent, soit aucune n'est appliquée.

**Authentification** : Processus de vérification de l'identité d'un utilisateur (ex: email + mot de passe + JWT).

**Autorisation** : Processus de vérification qu'un utilisateur authentifié a les droits d'accéder à une ressource (ex: RBAC).

**Avatar** : Image de profil d'un utilisateur. Dans LUMO, stockée sur Cloudinary, URL en base de données.

**Axios** : Bibliothèque JavaScript de requêtes HTTP basée sur les Promises.

## B

**Backend** : Partie serveur d'une application. Dans LUMO : Node.js + Express + PostgreSQL sur Railway.

**Base64** : Encodage binaire-vers-texte. LUMO utilise Base64 pour encoder les données en localStorage : `btoa(unescape(encodeURIComponent(json)))`.

**Bcrypt** : Algorithme de hachage de mots de passe lent et sécurisé utilisant un salt aléatoire.

**Bearer Token** : Schéma d'authentification HTTP où le token est transmis dans le header Authorization : `Authorization: Bearer <jwt>`.

**JSONB** : Type de données PostgreSQL pour stocker du JSON de façon binaire, indexable et requêtable.

**Bootstrap** : Framework CSS (non utilisé dans LUMO qui utilise Tailwind CSS).

**Buffer** : Zone de mémoire temporaire. Dans LUMO, les images uploadées via Multer sont stockées en mémoire (`memoryStorage`) avant d'être envoyées sur Cloudinary.

**BDD** : Base de Données.

## C

**CA** : Chiffre d'Affaires. Somme de toutes les ventes (hors remboursements).

**Cache** : Mémoire tampon pour stocker des données fréquemment accédées. LUMO utilise Redis comme cache.

**Callback** : Fonction passée en argument à une autre fonction, appelée quand l'opération asynchrone termine.

**CDN** : Content Delivery Network. Réseau de serveurs distribués géographiquement pour distribuer rapidement des contenus. Cloudinary est un CDN spécialisé en médias.

**CDF** : Franc Congolais. Devise locale de la RDC. LUMO gère CDF et USD.

**checkPermission** : Middleware LUMO qui vérifie si un sous-utilisateur a la permission d'effectuer une action (ex: `checkPermission('products.add')`).

**Clickjacking** : Attaque qui consiste à superposer une iframe invisible pour tromper l'utilisateur. Helmet avec `X-Frame-Options: DENY` protège contre ça.

**Cloudinary** : Service cloud de gestion et stockage d'images et vidéos. LUMO y stocke les avatars et images de produits.

**Cluster** : Groupe de serveurs travaillant ensemble. PM2 cluster mode utilise plusieurs processus Node.js sur les cœurs CPU disponibles.

**CORS** : Cross-Origin Resource Sharing. Mécanisme qui contrôle les requêtes HTTP entre domaines différents.

**Controller** : Composant MVC qui gère la logique métier. Dans LUMO : `authController.js`, `SaleController.js`, etc.

**Cookie** : Petit fichier stocké par le navigateur. LUMO utilise des cookies pour la protection CSRF.

**CRUD** : Create, Read, Update, Delete. Les 4 opérations de base sur les données.

**CSRF** : Cross-Site Request Forgery. Attaque qui force un utilisateur authentifié à exécuter des actions non désirées. LUMO utilise `csurf` en développement.

## D

**Dashboard** : Tableau de bord. Page d'accueil de LUMO montrant les KPI en temps réel.

**DataTypes** : Types de données Sequelize : STRING, INTEGER, DECIMAL, BOOLEAN, JSONB, TEXT, DATE, FLOAT, BIGINT, VIRTUAL.

**Débogage** : Processus de détection et correction des erreurs (bugs) dans le code.

**Décentralisé** : Système sans point central unique. Opposé à centralisé (LUMO est centralisé).

**Décrémentation** : Réduction d'une valeur. Dans LUMO, le stock est décrémenté à chaque vente.

**deletedAt** : Champ Sequelize (paranoid mode) qui marque la date de suppression "douce" d'un enregistrement.

**Dépendance** : Bibliothèque externe dont le projet a besoin. Définies dans `package.json`.

**Devise** : Monnaie. LUMO gère USD (Dollar américain) et CDF (Franc Congolais).

**DOM** : Document Object Model. Représentation arborescente d'une page HTML dans le navigateur.

**Dotenv** : Bibliothèque pour charger les variables d'environnement depuis un fichier `.env`.

**DTO** : Data Transfer Object. Objet dont le but est de transférer des données entre couches.

## E

**Email** : Identifiant unique d'un utilisateur dans LUMO. Stocké en minuscules (iLike pour la recherche).

**Endpoint** : Point d'accès à une API. Ex: `POST /api/v1/sales` est un endpoint.

**Entreprise** : Champ JSONB du modèle User contenant : nom du commerce, devise, adresse, logo.

**ES6** : ECMAScript 2015. Version moderne de JavaScript avec arrow functions, destructuring, classes, etc.

**EventEmitter** : Pattern Node.js pour la gestion d'événements asynchrones.

**Express** : Framework web minimaliste pour Node.js.

**Express-rate-limit** : Middleware pour limiter le nombre de requêtes par IP (300/10min pour l'API, 100/15min pour l'auth).

## F

**fetch** : API JavaScript native pour les requêtes HTTP. LUMO utilise Axios à la place (plus riche).

**Firebase** : Plateforme Google. LUMO utilise Firebase Admin SDK pour la vérification Google OAuth.

**Foreign Key (FK)** : Clé étrangère. Colonne qui référence la clé primaire d'une autre table. Ex: `Sale.userId` → `User.id`.

**Framework** : Ensemble d'outils et de conventions pour développer des applications. Express, React.

**Frontend** : Partie client d'une application. Dans LUMO : React sur Vercel.

**Full-Stack** : Développeur ou application couvrant frontend ET backend.

## G

**GET** : Méthode HTTP pour récupérer des données. Idempotent.

**GlobalSetting** : Modèle LUMO pour stocker des paramètres globaux de la plateforme (ex: `maintenance_mode`).

**Google OAuth** : Protocole d'authentification via compte Google. Évite de gérer les mots de passe Google.

## H

**Hash** : Résultat d'une fonction de hachage. Transforme une chaîne en empreinte de taille fixe. Bcrypt est un algorithme de hachage.

**Header HTTP** : Métadonnée d'une requête/réponse HTTP. Ex: `Authorization`, `Content-Type`, `X-XSRF-TOKEN`.

**Helmet** : Middleware Express qui configure des headers de sécurité HTTP.

**Hook** : Dans Sequelize : fonction exécutée automatiquement avant/après une opération BDD. Dans React : fonction spéciale (`useState`, `useEffect`).

**HTTPS** : HTTP Sécurisé via SSL/TLS. Chiffrement du trafic réseau. Railway et Vercel fournissent HTTPS automatiquement.

**HPP** : HTTP Parameter Pollution. Attaque qui envoie plusieurs valeurs pour le même paramètre. `hpp()` middleware protège contre ça.

## I

**i18n** : Internationalisation. LUMO supporte le français et l'anglais via `translations.ts`.

**iLike** : Opérateur Sequelize pour une comparaison insensible à la casse. `{ [Op.iLike]: email }` trouve "Jean@LUMO.com" même si l'email en base est "jean@lumo.com".

**Impersonation** : Fonctionnalité SuperAdmin qui permet de se connecter au compte d'un autre utilisateur pour le support.

**Intercepteur** : Middleware Axios qui intercepte toutes les requêtes ou réponses.

**IoRedis** : Client Redis pour Node.js. Bibliothèque utilisée dans LUMO.

**isAdminValidated** : Champ Boolean de User. Indique si le SuperAdmin a validé le compte.

**isVerified** : Champ Boolean de User. Indique si l'email a été vérifié.

## J

**JavaScript** : Langage de programmation interprété, dynamique, orienté prototype. Utilisé côté frontend (React) et backend (Node.js) dans LUMO.

**Joi** : Bibliothèque de validation JavaScript. LUMO valide les données d'inscription et connexion avec Joi (`validators.js`).

**JSON** : JavaScript Object Notation. Format d'échange de données léger. Toutes les réponses API LUMO sont en JSON.

**JSONB** : Type PostgreSQL pour JSON binaire. Permet l'indexation et la recherche dans les données JSON. Utilisé dans LUMO pour `preferences`, `articles`, `variantes`, etc.

**JWT** : JSON Web Token. Standard RFC 7519 pour l'authentification sans état.

## K

**KPI** : Key Performance Indicator. Indicateurs de performance. Dashboard LUMO : CA, profit, nb produits, nb clients.

## L

**Lazy Loading** : Chargement différé. LUMO charge chaque page React uniquement quand l'utilisateur y accède, via `React.lazy()`.

**localStorage** : Stockage clé-valeur du navigateur (5MB). LUMO y stocke le token JWT encodé en base64.

**Logger** : Système de journalisation. LUMO utilise Winston avec rotation quotidienne des fichiers de log.

**LMD** : Licence-Master-Doctorat. Système universitaire européen (Bologne) adopté en RDC.

## M

**Middleware** : Fonction intermédiaire dans Express qui traite les requêtes avant qu'elles atteignent le contrôleur.

**Migration** : Script SQL pour modifier le schéma de la BDD de façon contrôlée et versionnée. Dossier `server/migrations/`.

**Modal** : Fenêtre de dialogue superposée à l'interface principale. Utilisé dans LUMO pour les formulaires.

**MontantTotal** : Champ de Sale représentant le total de la vente dans sa devise native.

**Morgan** : Middleware Express de logging HTTP.

**Multer** : Middleware Express pour la gestion des uploads de fichiers.

**MVC** : Model-View-Controller. Patron d'architecture logicielle. LUMO l'applique côté serveur.

## N

**Nodemailer** : Bibliothèque Node.js pour envoyer des emails. LUMO l'utilise avec Resend pour les emails de vérification.

**Nodemon** : Outil de développement qui redémarre automatiquement le serveur quand des fichiers changent.

**Non-bloquant** : Mode d'exécution asynchrone de Node.js où les opérations I/O n'arrêtent pas le thread principal.

**npm** : Node Package Manager. Gestionnaire de packages JavaScript.

## O

**OAuth 2.0** : Protocole d'autorisation standard permettant l'authentification via des tiers (Google, GitHub...).

**ORM** : Object-Relational Mapper. Outil qui mappe les objets JavaScript aux tables SQL. Sequelize est l'ORM de LUMO.

**Opérateurs Sequelize** : `Op.lt` (inférieur), `Op.gt` (supérieur), `Op.iLike` (like insensible à la casse), `Op.notIn` (pas dans la liste), `Op.and`, `Op.or`.

**otplib** : Bibliothèque Node.js pour la génération et vérification de codes OTP (TOTP) pour la 2FA.

## P

**paranoid** : Option Sequelize qui active le soft delete (suppression douce avec `deletedAt`).

**parentId** : Champ de User. Pour un sous-utilisateur, pointe vers l'ID de l'admin propriétaire.

**Password** : Mot de passe. Dans LUMO : `motDePasse` (en français pour le champ BDD).

**POS** : Point of Sale. Point de vente. Interface de caisse de LUMO (`pages/POS.tsx`).

**PostgreSQL** : SGBDR open-source avancé. BDD principale de LUMO.

**Primary Key (PK)** : Clé primaire. Identifiant unique d'un enregistrement. `id` dans toutes les tables LUMO.

**Profitnet** : Profit net d'une vente = (prix vente - prix achat) × quantité - remise.

**Promise** : Objet JavaScript représentant une valeur future (asynchrone). Base de `async/await`.

**protect** : Middleware LUMO qui vérifie le JWT et authentifie la requête.

## Q

**QR Code** : Code visuel lisible par une caméra. LUMO utilise `qrcode` pour générer des QR codes pour la 2FA.

**Query** : Requête SQL. Sequelize traduit les appels JavaScript en queries SQL optimisées.

## R

**Railway** : Plateforme cloud de déploiement. Héberge le backend Node.js et la BDD PostgreSQL de LUMO.

**RBAC** : Role-Based Access Control. Contrôle d'accès basé sur les rôles. LUMO a 3 rôles : superadmin, admin, subuser.

**React** : Bibliothèque JavaScript pour créer des interfaces utilisateur.

**React Router** : Bibliothèque de routage pour React. Gère la navigation entre les pages de LUMO.

**Redis** : Base de données clé-valeur en mémoire ultra-rapide. Utilisé dans LUMO pour la blacklist JWT et Socket.io.

**Refresh Token** : Token JWT de longue durée (30j) utilisé pour renouveler l'Access Token expiré.

**Remboursement** : Vente annulée. Dans LUMO, le statut passe à "Remboursée" et le stock est réincrémenté.

**Resend** : Service d'envoi d'emails professionnel. Alternative à Nodemailer dans LUMO.

**Route** : Chemin URL défini sur le serveur. `GET /api/v1/products` est une route.

**ROUND** : Fonction SQL arrondie. LUMO utilise `Number.toFixed(2)` pour arrondir les montants.

## S

**SaaS** : Software as a Service. Logiciel fourni via Internet (sans installation). LUMO est un SaaS.

**Salt** : Valeur aléatoire ajoutée avant le hachage pour rendre chaque hash unique. Bcrypt génère un salt automatiquement.

**Seeder** : Script pour insérer des données initiales dans la BDD. Dossier `server/seeders/`.

**Sequelize** : ORM Node.js pour PostgreSQL (et autres BDD). Utilisé dans LUMO.

**Server** : Serveur. Application qui répond aux requêtes des clients.

**Session** : Période de connexion d'un utilisateur. LUMO gère les sessions via `activeSessions` (JSONB) et `sessionId`.

**SGBDR** : Système de Gestion de Base de Données Relationnelles. PostgreSQL est un SGBDR.

**Soft Delete** : Suppression douce. L'enregistrement n'est pas supprimé mais marqué comme tel (via `deletedAt`).

**Socket.io** : Bibliothèque de WebSocket bidirectionnel en temps réel. LUMO l'utilise pour les notifications.

**SPA** : Single Page Application. Application React qui ne recharge pas la page entière lors de la navigation.

**SQL** : Structured Query Language. Langage de requête pour les BDD relationnelles.

**SQL Injection** : Attaque qui injecte du SQL malveillant. Sequelize protège automatiquement via la paramétrisation.

**SSL/TLS** : Protocoles de chiffrement pour HTTPS. Railway et Vercel fournissent SSL automatiquement.

**Stack** : Ensemble de technologies. LUMO utilise le stack PERN (PostgreSQL, Express, React, Node.js).

**Status Code** : Code HTTP de réponse. 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error.

**StockAlerte** : Seuil d'alerte de stock. Si `stock < stockAlerte`, une notification est créée automatiquement.

**StockMovement** : Modèle LUMO enregistrant chaque mouvement de stock (entrée/sortie).

**Swagger** : Standard de documentation d'API REST. LUMO génère automatiquement sa doc Swagger sur `/api-docs`.

## T

**Tailwind CSS** : Framework CSS "utility-first". Utilisé dans LUMO pour le style.

**TenantId** : Identifiant du "tenant" (locataire). Dans LUMO multi-tenant, c'est l'ID de l'admin propriétaire. Pour un admin c'est son propre ID, pour un sous-utilisateur c'est le `parentId`.

**Transaction** : Ensemble d'opérations SQL qui s'exécutent comme une unité (ACID).

**TypeScript** : Sur-ensemble typé de JavaScript. LUMO utilise TypeScript côté frontend (`.tsx`, `.ts`).

**Token** : Chaîne de caractères encodée représentant une identité ou autorisation. JWT est un type de token.

**TOTP** : Time-based One-Time Password. Code à usage unique basé sur le temps. Utilisé pour la 2FA dans LUMO avec `otplib`.

## U

**URL** : Uniform Resource Locator. Adresse d'une ressource sur Internet.

**useEffect** : Hook React pour les effets secondaires (appels API, abonnements, timer).

**useState** : Hook React pour gérer l'état local d'un composant.

**useAuthStore** : Store Zustand principal de LUMO gérant l'authentification, thème, langue, devise.

**useCartStore** : Store Zustand gérant le panier POS de LUMO.

**UUID** : Universally Unique Identifier. Identifiant unique universel. LUMO utilise des INTEGER autoincrement + sessionId en hex (crypto.randomBytes).

## V

**Validation** : Vérification que les données reçues respectent le format attendu. LUMO utilise Joi côté serveur.

**Variable d'environnement** : Variable configurée en dehors du code source (`process.env.JWT_SECRET`). Stockée dans `.env`.

**Vercel** : Plateforme de déploiement frontend. Héberge le client React de LUMO.

**Virtual DOM** : Représentation virtuelle du DOM réel, utilisée par React pour optimiser les mises à jour.

**VITE** : Outil de build moderne pour les projets frontend React. Utilisé dans LUMO côté client.

## W

**WebSocket** : Protocole de communication bidirectionnel persistant. Socket.io utilise WebSocket pour les notifications temps réel dans LUMO.

**Winston** : Bibliothèque de logging pour Node.js. LUMO l'utilise avec rotation quotidienne des fichiers de log.

## X

**XSS** : Cross-Site Scripting. Injection de scripts malveillants dans une page web. LUMO protège via `xss-clean` et Helmet CSP.

**xss-clean** : Middleware Express qui nettoie les entrées utilisateur des balises HTML/JS malveillantes.

## Z

**Zustand** : Bibliothèque de gestion d'état légère pour React. Utilisée dans LUMO pour l'auth store, le panier POS, et les paramètres.

---

# CHAPITRE 8 — GESTION COMMERCIALE {#chapitre-8}

## 8.1 Concepts fondamentaux

### Chiffre d'Affaires (CA)
**Définition** : Total des ventes réalisées sur une période donnée, avant déduction des charges.

**Dans LUMO** : `Σ montantTotal des Sales WHERE statut != 'Remboursée'`

**Exemple** : En janvier, LUMO enregistre 100 ventes pour un total de 50 000 CDF. Le CA de janvier = 50 000 CDF.

### Marge brute
**Définition** : CA - Coût des marchandises vendues (prix d'achat).

**Dans LUMO** : Calculée produit par produit dans la vente : `(prixVente - prixAchat) × quantité`

**Exemple** : Vente d'une chemise à 15 USD achetée à 8 USD → marge brute = 7 USD.

### Marge nette (Profit net)
**Définition** : Marge brute - Charges d'exploitation (loyer, salaires, etc.).

**Dans LUMO** : `profitNet = Σ(marge brute par article) - remise`

**Champ dans Sale** : `profitNet: { type: DataTypes.FLOAT, defaultValue: 0.0 }`

### Prix d'achat (prixAchat)
**Définition** : Prix auquel le commerçant achète le produit chez le fournisseur.

**Dans LUMO** : Champ `prixAchat` du modèle Product. Visible uniquement par l'admin (pas les caissiers).

### Prix de vente (prix)
**Définition** : Prix auquel le commerçant vend le produit au client.

**Dans LUMO** : Champ `prix` du modèle Product. C'est le prix affiché en caisse.

### SKU (Stock Keeping Unit)
**Définition** : Code unique identifiant un article en stock. Dans LUMO, le `codeBarre` joue ce rôle.

### Code-barres (codeBarre)
**Définition** : Représentation visuelle d'un code numérique scannable. Dans LUMO, unique par produit (contrainte UNIQUE en BDD).

**Dans LUMO** : `codeBarre: { type: DataTypes.STRING, unique: true }`

### Stock
**Définition** : Quantité de marchandises disponibles en magasin.

**Dans LUMO** : Champ `stock` du modèle Product. Décrémenté automatiquement à chaque vente, incrémenté à chaque achat.

### Seuil d'alerte (stockAlerte)
**Définition** : Niveau de stock minimum en dessous duquel une alerte est déclenchée.

**Dans LUMO** : `stockAlerte: { type: DataTypes.INTEGER, defaultValue: 5 }`. Quand `stock < stockAlerte`, une notification WARNING est créée automatiquement.

### Rotation du stock
**Définition** : Fréquence à laquelle le stock est renouvelé sur une période. `Rotation = CA / Valeur moyenne du stock`.

**Dans LUMO** : Calculé dans le module Statistiques.

### TVA (Taxe sur la Valeur Ajoutée)
**Définition** : Impôt indirect sur la consommation. Dans LUMO, chaque produit peut avoir un champ `taxe` (pourcentage).

**Dans LUMO** : `taxe: { type: DataTypes.FLOAT, defaultValue: 0.0 }`

### Valorisation du stock
**Définition** : Valeur totale du stock au prix d'achat ou de vente.

**Valorisation au prix d'achat** : `Σ(prixAchat × stock)` par produit.
**Valorisation au prix de vente** : `Σ(prix × stock)` par produit.

### Fournisseur
**Définition** : Entreprise ou personne auprès de qui on achète des marchandises.

**Dans LUMO** : Modèle `Fournisseur` avec : nom, entreprise, téléphone, email, adresse.

### Client
**Définition** : Personne qui achète les produits du commerce.

**Dans LUMO** : Modèle `Client` avec : nom, téléphone, email, adresse, `detteTotale`.

### ERP (Enterprise Resource Planning)
**Définition** : Logiciel intégré qui gère toutes les ressources de l'entreprise (stocks, finances, RH, achats, ventes). SAP et Odoo sont des ERP.

**LUMO vs ERP** : LUMO est un **mini-ERP** adapté aux PME africaines. Il couvre les modules essentiels (stocks, ventes, achats, clients, finances) sans la complexité et le coût d'un ERP complet.

### CRM (Customer Relationship Management)
**Définition** : Gestion de la relation client. LUMO intègre un CRM basique via le module Clients (fiches clients, historique, dettes).

### POS (Point of Sale)
**Définition** : Interface de caisse pour enregistrer les ventes. Dans LUMO : `pages/POS.tsx` et `pages/Cash.tsx`.

### Remise
**Définition** : Réduction accordée sur le prix d'une vente.

**Dans LUMO** : `remise: { type: DataTypes.FLOAT, defaultValue: 0.0 }` dans le modèle Sale.

### Méthode de paiement
**Dans LUMO** : `methodePaiement: { type: DataTypes.STRING, defaultValue: 'Especes' }`. Peut être : Espèces, Mobile Money, Virement, etc.

### Dette client (detteTotale)
**Définition** : Montant dû par un client qui a acheté à crédit.

**Dans LUMO** : `detteTotale: { type: DataTypes.DECIMAL }` dans le modèle Client.

### Achat
**Définition** : Commande passée auprès d'un fournisseur pour s'approvisionner.

**Dans LUMO** : Modèle `Purchase` avec articles (JSONB), montantTotal, fournisseurId, statut.

---

# CHAPITRE 9 — BASE DE DONNÉES POSTGRESQL {#chapitre-9}

## 9.1 Configuration de la connexion

```javascript
// config/database.js
const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  dialectOptions: useSsl ? {
    ssl: { require: true, rejectUnauthorized: false }  // SSL pour Railway
  } : {},
  logging: false,
  pool: {
    max: 5,     // Max 5 connexions simultanées
    min: 0,     // Min 0 connexion inactive
    acquire: 30000,  // Timeout pour acquérir une connexion
    idle: 10000      // Temps d'inactivité avant fermeture
  }
});
```

## 9.2 Tables et relations

### Schéma des relations (diagramme)

```
Users (1) ────────────── (N) Products
  │                             │
  │                             │
  ├── (1) ── (N) Sales ─────────│── (via articles JSONB)
  │              │              │
  │              └── (N:1) Clients
  │
  ├── (1) ── (N) Purchases ── (N:1) Fournisseurs
  │
  ├── (1) ── (N) Activites
  │
  ├── (1) ── (N) Notifications
  │
  ├── (1) ── (N) CashSessions
  │
  └── (1) ── (N) Users (parentId - sous-utilisateurs)

Products (1) ── (N) StockMovements
```

### Relations déclarées dans `models/index.js`

```javascript
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'historiqueStock' });
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Sale.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Client.hasMany(Sale, { foreignKey: 'clientId' });

Purchase.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseur' });
Fournisseur.hasMany(Purchase, { foreignKey: 'fournisseurId' });

Sale.belongsTo(User, { foreignKey: 'userId', as: 'proprietaire' });
Sale.belongsTo(User, { foreignKey: 'sellerId', as: 'vendeur' });
```

## 9.3 Index pour les performances

LUMO crée des index sur les colonnes fréquemment utilisées dans les WHERE :

```javascript
// User model
indexes: [
  { unique: true, fields: ['email'] },
  { fields: ['parentId'] },
  { fields: ['role'] }
]

// Product model
indexes: [
  { fields: ['userId'] },
  { fields: ['codeBarre'] },
  { fields: ['nom'] },
  { fields: ['categorie'] }
]

// Sale model
indexes: [
  { fields: ['userId'] },
  { fields: ['clientId'] },
  { fields: ['createdAt'] },
  { fields: ['sellerId'] },
  { fields: ['statut'] }
]
```

## 9.4 Transactions dans LUMO

Les hooks Sequelize utilisent les transactions pour garantir la cohérence :

```javascript
// sale.model.js - les hooks reçoivent options.transaction
await Activite.create({
  type: 'VENTE',
  description: `Vente #${sale.id}: ${sale.montantTotal} ${sale.devise}`,
  // ...
}, { transaction: options.transaction });
```

Si la transaction échoue, tous les INSERT sont annulés (rollback automatique).

## 9.5 JSONB — Questions/Réponses jury

**Q : Pourquoi stocker `articles` comme JSONB dans Sale plutôt qu'une table `SaleItems` séparée ?**
> **R :** Les deux approches sont valides. Le JSONB dans LUMO permet de stocker un "snapshot" immuable des articles au moment de la vente (prix, nom) — même si le produit est modifié ou supprimé ensuite, la vente garde les informations exactes de l'époque. Une table SaleItems séparée serait plus normalisée mais nécessiterait des jointures pour chaque lecture de vente. LUMO fait un choix pragmatique adapté au volume de données d'une PME.

**Q : Comment PostgreSQL gère-t-il les contraintes d'intégrité dans LUMO ?**
> **R :** Via les Foreign Keys déclarées dans Sequelize : `Sale.userId` référence `User.id` avec `onDelete: 'CASCADE'`. Si un utilisateur est supprimé, toutes ses ventes le sont aussi. Pour les produits, LUMO utilise `paranoid: true` (soft delete) pour éviter de perdre l'historique : les produits "supprimés" restent en base et sont seulement exclus des requêtes normales.

---

# CHAPITRE 10 — SÉCURITÉ DE L'APPLICATION {#chapitre-10}

## 10.1 Architecture de sécurité

LUMO implémente une sécurité en couches (defense-in-depth) :

```
Couche 1 : HTTPS (SSL/TLS via Railway et Vercel)
Couche 2 : CORS (origines autorisées uniquement)
Couche 3 : Helmet (headers de sécurité HTTP)
Couche 4 : Rate Limiting (protection brute-force)
Couche 5 : XSS Protection (xss-clean)
Couche 6 : HPP (HTTP Parameter Pollution)
Couche 7 : CSRF (csurf en dev)
Couche 8 : JWT (authentification stateless)
Couche 9 : RBAC (autorisation par rôle/permission)
Couche 10 : Bcrypt (protection des mots de passe)
Couche 11 : Validation Joi (validation des entrées)
Couche 12 : Sequelize (protection injection SQL automatique)
Couche 13 : Redis Blacklist (invalidation JWT)
```

## 10.2 Protection contre les attaques courantes

### XSS (Cross-Site Scripting)

**Attaque** : Un attaquant injecte du JavaScript malveillant dans les données (ex: nom de produit = `<script>alert('hack')</script>`).

**Protection dans LUMO** :
1. `xss-clean` middleware nettoie les inputs avant traitement
2. Helmet configure `Content-Security-Policy`
3. React échappe automatiquement les valeurs dans le JSX

### SQL Injection

**Attaque** : Injection de SQL malveillant via les formulaires (ex: `' OR '1'='1`).

**Protection dans LUMO** :
Sequelize utilise des **requêtes paramétrées** automatiquement. Jamais de concaténation de chaînes SQL :
```javascript
// Sequelize génère : SELECT * FROM Users WHERE email = $1
await User.findOne({ where: { email: email } });
// Valeur passée séparément → injection impossible
```

### CSRF (Cross-Site Request Forgery)

**Attaque** : Un site malveillant fait envoyer une requête à LUMO en utilisant les cookies de session de l'utilisateur.

**Protection dans LUMO** :
- En développement : `csurf` middleware + cookie `XSRF-TOKEN` lu par Axios
- En production : CORS strict (seul le domaine Vercel est autorisé) + JWT Bearer (pas vulnérable au CSRF classique basé sur les cookies)

### Brute Force (Rate Limiting)

```javascript
// security.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                  // Max 100 tentatives de login
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});
app.use('/api/v1/auth/login', authLimiter);
```

### Maintenance Mode

```javascript
// authMiddleware.js
if (req.user.role !== 'superadmin') {
  const maintenanceSetting = await GlobalSetting.findOne({ where: { key: 'maintenance_mode' } });
  if (maintenanceSetting && maintenanceSetting.value === 'true') {
    return res.status(503).json({ message: 'Mode maintenance en cours.' });
  }
}
```

## 10.3 JWT — Sécurité avancée dans LUMO

### Contrôle de session concurrent

```javascript
// authMiddleware.js
const sessions = req.user.activeSessions || [];
const isSessionValid = sessions.some(s => s.sessionId === decoded.sessionId);
if (!isSessionValid && decoded.sessionId) {
  return res.status(401).json({ 
    message: 'Session expirée ou remplacée par une nouvelle connexion', 
    code: 'SESSION_REPLACED' 
  });
}
```

Quand un utilisateur se connecte depuis un nouvel appareil, l'ancienne session est invalidée automatiquement.

### Vérification du type de token

```javascript
// Rejette les refresh tokens utilisés comme access tokens
if (decoded.type && decoded.type !== 'access') {
  return res.status(401).json({ message: 'Jeton invalide' });
}
```

## 10.4 Questions/Réponses jury

**Q : Comment LUMO protège-t-il les données en transit ?**
> **R :** LUMO déployé sur Railway et Vercel bénéficie automatiquement du chiffrement HTTPS (TLS 1.2/1.3). Toutes les communications entre le frontend Vercel et le backend Railway passent par HTTPS. Dans le code, le serveur indique à Railway qu'il est derrière un proxy avec `app.set('trust proxy', 1)`, ce qui assure que les headers SSL proxy sont correctement interprétés.

**Q : Qu'est-ce que la "defense in depth" et comment LUMO l'implémente-t-il ?**
> **R :** La "défense en profondeur" consiste à ne pas compter sur une seule protection mais à superposer plusieurs couches. Si un attaquant contourne le rate limiting, il doit encore contourner le JWT, puis le RBAC. Dans LUMO, une requête malveillante doit franchir : HTTPS → CORS → Rate Limit → JWT verify → Redis blacklist → RBAC → Validation Joi → Sequelize paramétré. La probabilité qu'une attaque traverse toutes ces couches est quasi nulle.

---

# CHAPITRE 11 — ASSISTANT IA {#chapitre-11}

## 11.1 Architecture de l'IA dans LUMO

L'assistant IA de LUMO est implémenté dans `controllers/aiController.js` (620 lignes, 31 512 octets).

### Fournisseurs d'IA supportés

```javascript
const getClient = () => {
  const provider = process.env.AI_PROVIDER || "deepseek";
  
  if (provider === "ollama") {
    // IA locale via Ollama (ex: llama3)
    return new OpenAI({
      apiKey: "ollama",
      baseURL: process.env.OLLAMA_URL || "http://localhost:11434/v1",
    });
  }

  // DeepSeek par défaut (production)
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });
};

const MODEL = process.env.AI_MODEL || (
  process.env.AI_PROVIDER === "ollama" ? "llama3" : "deepseek-chat"
);
```

LUMO supporte deux modes :
1. **DeepSeek API** (production) : via `process.env.DEEPSEEK_API_KEY`
2. **Ollama local** (développement/offline) : modèle local (llama3 par défaut)

### SDK OpenAI compatible

DeepSeek implémente l'API compatible OpenAI, ce qui permet d'utiliser le SDK officiel `openai` en changeant simplement la `baseURL`.

## 11.2 Construction du contexte commercial (buildLumoKnowledge)

C'est la partie la plus sophistiquée de l'IA LUMO. Avant chaque conversation, le système collecte toutes les données du commerce en parallèle :

```javascript
const buildLumoKnowledge = async (userId, user) => {
  // Récupération parallèle de TOUTES les données
  const [products, sales, staffPayments, clients, fournisseurs, purchases, globalSettings] 
    = await Promise.all([
      Product.findAll({ where: { userId }, attributes: ['nom', 'stock', 'stockAlerte', 'prix', 'prixAchat', 'devise'] }),
      Sale.findAll({ where: { userId }, limit: 30, order: [['createdAt', 'DESC']], ... }),
      StaffPayment.findAll({ where: { userId }, limit: 20, ... }),
      Client.findAll({ where: { userId }, ... }),
      Fournisseur.findAll({ where: { userId }, ... }),
      Purchase.findAll({ where: { userId }, limit: 20, ... }),
      GlobalSetting.findAll()
    ]);
```

### Calculs automatiques dans le contexte

```javascript
// 1. Taux de change de l'utilisateur
const exchangeRate = user.preferences?.exchangeRate || 2800;

// 2. Stock total et produits en alerte
const totalStock = products.reduce((acc, p) => acc + parseInt(p.stock || 0), 0);
const lowStockProducts = products.filter(p => parseInt(p.stock) <= parseInt(p.stockAlerte || 5));

// 3. CA par devise
const salesByCurrency = {};
sales.forEach(s => {
  const dev = (s.devise || 'CDF').toUpperCase();
  salesByCurrency[dev] = (salesByCurrency[dev] || 0) + parseFloat(s.montantTotal || 0);
});

// 4. Dettes clients totales
const totalDebtClients = clients.reduce((acc, c) => acc + parseFloat(c.detteTotale || 0), 0);

// 5. Top 10 produits par stock
const topProductsByStock = [...products].sort((a,b) => b.stock - a.stock).slice(0, 10);
```

## 11.3 Prompt système LUMO

Le prompt système est injecté à chaque conversation, donnant à l'IA le contexte complet du commerce :

```
Tu es LUMO, un assistant commercial intelligent et expert intégré à la plateforme de gestion 
commerciale LUMO. Tu analyses les données réelles de la boutique pour fournir des 
conseils précis, professionnels et adaptés.

=== DONNÉES EN TEMPS RÉEL DE LA BOUTIQUE ===
Boutique : [nom]
Devise principale : [devise]
Taux de change : 1 USD = [rate] CDF

📦 INVENTAIRE :
Nombre total de produits : [N]
Stock total : [M] unités
Produits en rupture/alerte : [liste]
Top 10 produits par stock : [liste]

💰 VENTES (30 dernières) :
CA récent : [montants par devise]
CA total converti : [CDF]

👥 CLIENTS : [nombre, dettes totales, liste]
🏭 FOURNISSEURS : [liste]
💸 ACHATS RÉCENTS : [montants]
👔 PAIEMENTS STAFF : [montants]
```

## 11.4 Streaming des réponses IA

LUMO implémente le streaming pour afficher la réponse de l'IA progressivement (token par token) :

```javascript
// aiController.js
const stream = await client.chat.completions.create({
  model: MODEL,
  messages: [...],
  stream: true,
  temperature: 0.7,
  max_tokens: 1500
});

res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}
res.end();
```

### Server-Sent Events (SSE)

Le streaming utilise SSE (Server-Sent Events), un protocole HTTP unidirectionnel du serveur vers le client. Le frontend LUMO lit ce flux avec `EventSource` ou `fetch` avec un reader.

## 11.5 Historique des conversations

LUMO sauvegarde l'historique des conversations IA directement dans la BDD :

```javascript
// User.chatHistory (JSONB)
[
  { role: "user", content: "Quel est mon stock actuel ?" },
  { role: "assistant", content: "Vous avez 245 unités en stock, réparties sur..." }
]
```

L'historique est envoyé avec chaque nouvelle requête pour que l'IA garde le contexte de la conversation.

## 11.6 Questions/Réponses jury

**Q : Comment LUMO utilise-t-il DeepSeek en production ?**
> **R :** LUMO utilise le SDK officiel `openai` d'OpenAI mais configure une `baseURL` différente pointant vers `https://api.deepseek.com`. DeepSeek est compatible avec l'API OpenAI. La clé API `DEEPSEEK_API_KEY` est stockée en variable d'environnement sur Railway. Le modèle utilisé est `deepseek-chat` par défaut. LUMO supporte aussi Ollama (IA locale) en changeant `AI_PROVIDER=ollama` dans les variables d'environnement, ce qui permet de fonctionner sans coût d'API ni connexion Internet.

**Q : Quels sont les risques et limitations de l'IA dans LUMO ?**
> **R :** Limitations : 1) Le contexte est limité aux 30 dernières ventes, donc les analyses à long terme sont partielles ; 2) L'IA peut se tromper ou "halluciner" — LUMO le mentionne clairement dans l'interface ; 3) Coût par token (DeepSeek est moins cher qu'OpenAI mais reste payant). Risques : les données commerciales envoyées à l'API externe (DeepSeek) — LUMO n'envoie que des données agrégées (pas d'emails, numéros de téléphone clients), réduisant les risques de confidentialité. L'option Ollama local élimine ce risque.

---

# CHAPITRE 12 — DÉPLOIEMENT {#chapitre-12}

## 12.1 Architecture de déploiement

```
GitHub Repository
    ↓ push (CI/CD automatique)
    ├── Railway (Backend + BDD)
    │   ├── Node.js/Express service
    │   ├── PostgreSQL database
    │   └── Redis service
    └── Vercel (Frontend)
        └── React/Vite SPA
```

## 12.2 Railway — Backend et BDD

Railway est une plateforme PaaS (Platform as a Service) moderne.

### Configuration Railway dans LUMO

```javascript
// server.js
app.set('trust proxy', 1); // Railway est derrière un proxy

// config/index.js
const dbUrl = process.env.DATABASE_URL;
const dbParsed = dbUrl ? parseDatabaseUrl(dbUrl) : null;
// DATABASE_URL fourni automatiquement par Railway
```

Railway fournit automatiquement :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `REDIS_URL` : URL de connexion Redis
- `PORT` : Port d'écoute
- HTTPS avec certificat SSL
- Redémarrage automatique en cas de crash

### Variables d'environnement sur Railway

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<clé_secrète_longue>
DEEPSEEK_API_KEY=sk-xxxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
REDIS_URL=redis://user:pass@host:6379
CLIENT_URL=https://lumo-app.vercel.app
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Dockerfile dans LUMO

```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Ecosystem PM2 (configuration cluster)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'lumo-api',
    script: 'server.js',
    instances: 'max',    // Utilise tous les cœurs CPU
    exec_mode: 'cluster', // Mode cluster PM2
    // ...
  }]
};
```

## 12.3 Vercel — Frontend React

Vercel est optimisé pour les applications React/Next.js.

### Configuration Vite pour Vercel

```javascript
// client/vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
});
```

Variable d'environnement Vercel :
```env
VITE_API_URL=https://lumo-api.railway.app/api
```

### Routing SPA sur Vercel

Pour les SPA React, toutes les routes doivent être redirigées vers `index.html` :
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 12.4 Backup automatique

LUMO implémente un système de backup automatique via cron :

```javascript
// cron/backupCron.js
const { initBackupCron } = require('./cron/backupCron');
// Appelé au démarrage du serveur (server.js ligne 193)
initBackupCron();
```

Les backups peuvent aussi être déclenchés manuellement via `controllers/backupController.js`.

## 12.5 Questions/Réponses jury

**Q : Pourquoi déployer le frontend et le backend sur des plateformes différentes ?**
> **R :** Vercel est spécialisé dans les applications frontend React (CDN mondial, build Vite optimisé, edge functions). Railway est spécialisé dans les applications backend Node.js avec BDD. Cette séparation offre les meilleurs performances pour chaque partie. L'inconvénient est la gestion CORS inter-domaines, que LUMO résout explicitement dans `security.js`. En production, le CSRF via cookie est désactivé car les deux domaines sont différents (Railway ≠ Vercel) — l'authentification JWT Bearer reste suffisante.

**Q : Comment LUMO gère-t-il la sécurité des variables d'environnement ?**
> **R :** Les secrets (JWT_SECRET, DEEPSEEK_API_KEY, etc.) ne sont jamais dans le code source ou dans git. Ils sont définis directement dans l'interface de Railway et Vercel. Le fichier `.env` local n'est pas commité (`.gitignore` l'exclut). Le fichier `.env.example` dans le repo montre les clés nécessaires sans leurs valeurs. En production, Railway injecte ces variables automatiquement dans le processus Node.js via `process.env`.

---

# CHAPITRE 13 — QUESTIONS/RÉPONSES JURY {#chapitre-13}

## PARTIE A — Questions sur l'architecture

**Q1 : Qu'est-ce que le stack PERN ?**
> **R :** PERN = PostgreSQL + Express.js + React.js + Node.js. C'est un ensemble de technologies JavaScript full-stack pour construire des applications web modernes. PostgreSQL est la base de données, Express le framework backend, React le framework frontend, et Node.js l'environnement d'exécution.

**Q2 : Expliquez le flux de données complet d'une requête dans LUMO.**
> **R :** 1) L'utilisateur interagit avec React (frontend). 2) Axios envoie une requête HTTP avec le JWT dans le header Authorization. 3) Express reçoit la requête et la passe par les middlewares (CORS, Helmet, JWT verify). 4) Le contrôleur traite la logique métier. 5) Sequelize traduit les opérations en SQL et exécute sur PostgreSQL. 6) La réponse JSON remonte au frontend. 7) React met à jour l'interface via Zustand.

**Q3 : Qu'est-ce que le modèle MVC dans LUMO ?**
> **R :** Model-View-Controller côté serveur : Modèle = Sequelize models (User, Product, Sale...) qui définissent les tables et la logique de données. Vue = Frontend React (pages, composants). Contrôleur = Controllers Express (authController, SaleController...) qui reçoivent les requêtes, appellent les modèles et retournent les réponses.

**Q4 : Pourquoi LUMO utilise-t-il Redis en plus de PostgreSQL ?**
> **R :** Redis (en mémoire, ~0.1ms) et PostgreSQL (sur disque, ~10ms) sont complémentaires. Redis dans LUMO : 1) Blacklist des tokens révoqués — vérifié à chaque requête, doit être ultra-rapide ; 2) Redis Adapter Socket.io — synchronise les WebSockets entre plusieurs processus PM2. PostgreSQL est utilisé pour toutes les données persistantes (produits, ventes, users).

**Q5 : Qu'est-ce que le pattern tenantId dans LUMO et pourquoi est-il important ?**
> **R :** LUMO utilise une architecture multi-tenant : plusieurs commerces (tenants) cohabitent dans la même base de données. Chaque enregistrement (produit, vente, client) a un `userId` qui pointe vers l'admin propriétaire. Les sous-utilisateurs ont un `parentId`. Le `tenantId` est toujours `parentId || id` — il garantit que les sous-utilisateurs accèdent aux données de leur admin, pas aux données d'un autre commerce. C'est la sécurité des données fondamentale de LUMO.

## PARTIE B — Questions sur les technologies

**Q6 : Qu'est-ce qu'un middleware et donnez 3 exemples dans LUMO.**
> **R :** Un middleware Express est une fonction `(req, res, next)` qui traite la requête avant qu'elle atteigne le contrôleur. Exemples dans LUMO : 1) `protect` (authMiddleware.js) vérifie le JWT ; 2) `helmet()` configure les headers de sécurité ; 3) `rateLimit` limite les requêtes par IP.

**Q7 : Expliquez la différence entre authentification et autorisation.**
> **R :** L'authentification répond à "Qui êtes-vous ?" (JWT verify dans LUMO). L'autorisation répond à "Avez-vous le droit de faire ça ?" (RBAC avec `authorize` et `checkPermission` dans LUMO). Un utilisateur peut être authentifié mais non autorisé. Ex: un caissier (authentifié) n'a pas l'autorisation d'accéder au module Statistiques.

**Q8 : Comment fonctionne le soft delete dans LUMO ?**
> **R :** `paranoid: true` dans les modèles Sequelize (Product, Sale) ajoute une colonne `deletedAt` qui vaut `null` par défaut. Lors d'un `destroy()`, Sequelize met `deletedAt = NOW()` au lieu de supprimer la ligne. Toutes les requêtes Sequelize excluent automatiquement les enregistrements avec `deletedAt NOT NULL`. Avantage : traçabilité historique, données jamais perdues, restauration possible.

**Q9 : Qu'est-ce que le lazy loading et comment LUMO l'implémente-t-il ?**
> **R :** Le lazy loading (chargement différé) charge le code JavaScript d'une page uniquement quand l'utilisateur y navigue, réduisant le temps de chargement initial. Dans LUMO : `const Dashboard = lazy(() => import('./pages/Dashboard'))`. Le bundle Vite est divisé en chunks séparés par page. `<Suspense fallback={<LoadingFallback />}>` affiche un spinner pendant le chargement du chunk.

**Q10 : Comment LUMO gère-t-il la conversion de devises ?**
> **R :** Chaque produit, vente et achat stocke sa devise native (USD ou CDF) et le taux de change au moment de la transaction. Pour les agrégations (Dashboard, Stats), la fonction `toCDF()` convertit tout en CDF en utilisant le taux stocké dans `user.preferences.exchangeRate`. Si le taux est invalide (0, 1, null), on utilise un fallback de 2800 CDF/USD. Cette approche garantit la précision même si le taux change.

## PARTIE C — Questions sur la sécurité

**Q11 : Listez toutes les protections de sécurité dans LUMO.**
> **R :** 1) HTTPS (SSL Railway/Vercel), 2) CORS strict, 3) Helmet (headers sécurité), 4) Rate limiting (300/10min API, 100/15min auth), 5) xss-clean (nettoyage XSS), 6) hpp (pollution paramètres), 7) CSRF (csurf en dev), 8) Validation Joi, 9) JWT avec blacklist Redis, 10) Bcrypt (mots de passe), 11) RBAC (rôles + permissions), 12) Sequelize (protection SQL injection), 13) Session control (sessionId concurrent), 14) Sentry (monitoring erreurs prod).

**Q12 : Qu'est-ce qu'une injection SQL et comment LUMO s'en protège-t-il ?**
> **R :** Une injection SQL consiste à insérer du code SQL malveillant dans un champ de formulaire pour manipuler la base de données. Ex: email = `' OR '1'='1`. Sequelize protège automatiquement en utilisant des requêtes paramétrées (prepared statements) : la valeur est passée séparément de la requête SQL, et le driver PostgreSQL l'échappe. Il n'y a jamais de concaténation de chaînes SQL dans LUMO.

**Q13 : Comment LUMO empêche-t-il l'utilisation de tokens révoqués ?**
> **R :** À la déconnexion, LUMO appelle `blacklistToken(token)` qui stocke le token dans Redis avec `SET blacklist:${token} true EX 86400`. À chaque requête authentifiée, `protect` vérifie `redis.exists('blacklist:' + token)`. Si le token est en blacklist, la requête est rejetée (401). Le TTL Redis est aligné sur la durée maximale du JWT pour éviter l'accumulation infinie.

**Q14 : Pourquoi les mots de passe dans LUMO ne sont-ils jamais déchiffrables ?**
> **R :** Bcrypt est une fonction de hachage à sens unique (one-way function). Il n'existe pas d'algorithme pour retrouver le mot de passe original depuis son hash. Lors de la connexion, on compare : bcrypt.compare(motDePasseSaisi, hashStocké). Bcrypt recalcule le hash avec le même salt (intégré dans le hash stocké) et compare. Le mot de passe original n'est jamais stocké ni transmis après la saisie initiale.

## PARTIE D — Questions sur la base de données

**Q15 : Expliquez les associations Sequelize dans LUMO.**
> **R :** `hasMany` et `belongsTo` définissent les relations entre modèles. `Sale.belongsTo(User, { foreignKey: 'userId', as: 'proprietaire' })` signifie : une vente appartient à un seul utilisateur. `User.hasMany(Sale, { foreignKey: 'userId' })` signifie : un utilisateur peut avoir plusieurs ventes. Ces associations permettent des jointures automatiques : `Sale.findAll({ include: [{ model: User, as: 'proprietaire' }] })`.

**Q16 : Pourquoi utiliser JSONB au lieu de colonnes séparées pour certains champs ?**
> **R :** JSONB est utilisé quand la structure des données est flexible ou évolutive. `user.preferences` contient theme, language, exchangeRate, enabledModules — autant de colonnes qui auraient alourdi le schema. JSONB permet d'ajouter de nouvelles préférences sans migration de schema. `product.variantes` peut avoir 0 ou N variantes de types différents (taille, couleur, poids...). JSONB dans PostgreSQL est indexable et requêtable via les opérateurs `->`, `->>`, `@>`.

**Q17 : Qu'est-ce qu'un index de base de données et pourquoi LUMO en crée-t-il ?**
> **R :** Un index est une structure de données (B-tree) qui accélère les recherches sur une colonne. Sans index, PostgreSQL fait un "sequential scan" (lit toutes les lignes). Avec un index, il fait un "index scan" (lecture logarithmique). Dans LUMO, `products.userId` est indexé car chaque requête filtre par userId. Sans index, une boutique avec 10 000 produits devrait tous les lire pour trouver ceux d'un utilisateur. Avec l'index, la recherche est quasi instantanée.

## PARTIE E — Questions sur les modules

**Q18 : Comment fonctionne la gestion multi-utilisateurs dans LUMO ?**
> **R :** L'admin crée des sous-utilisateurs via le module Users (`/users`). Chaque sous-utilisateur a `parentId = admin.id` et un tableau `permissions` JSONB définissant les modules accessibles. Le `tenantId = parentId || id` garantit l'isolation des données. Les middlewares `protect` et `checkPermission` vérifient les permissions à chaque requête. L'admin peut activer/désactiver des modules pour chaque sous-utilisateur depuis les Paramètres.

**Q19 : Expliquez le cycle complet d'une vente POS dans LUMO.**
> **R :** 1) Le caissier ouvre LUMO → Dashboard. 2) Il ouvre une session de caisse (Cash Session) avec le fonds initial. 3) Il navigue vers le POS et ajoute des produits au panier (Zustand useCartStore). 4) Pour chaque produit ajouté, le stock disponible est vérifié. 5) Il valide la vente avec la méthode de paiement. 6) POST /api/v1/sales → crée la Sale en BDD, décrémente les stocks, crée Activité et Notifications. 7) Le panier se vide, le reçu s'affiche. 8) En fin de journée, le caissier ferme la session de caisse.

**Q20 : Comment LUMO détecte-t-il automatiquement les stocks faibles ?**
> **R :** Le modèle Product a un hook `afterSave` qui s'exécute après chaque sauvegarde. Si le champ `stock` a changé (`product.changed('stock')`), il compare le nouveau stock au `stockAlerte`. Si `nouveauStock < stockAlerte && ancienStock >= stockAlerte` (le seuil vient d'être franchi), une Notification WARNING est créée en BDD. Socket.io envoie cette notification en temps réel au frontend via WebSocket. L'interface affiche alors une alerte à l'utilisateur.

## PARTIE F — Questions sur le déploiement et la production

**Q21 : Quelle est la différence entre l'environnement de développement et la production dans LUMO ?**
> **R :** En développement : `NODE_ENV=development`, le serveur recharge automatiquement (nodemon), la synchronisation Sequelize est possible (`sync({alter: false})`), les logs sont détaillés, le CSRF est actif. En production : `NODE_ENV=production`, SSL obligatoire (`DB_SSL=true`), les messages d'erreur sont sanitisés (pas de stack trace exposée), le CSRF est désactivé (JWT Bearer suffit en cross-domain), Sentry monitore les erreurs.

**Q22 : Comment LUMO gère-t-il les migrations de base de données ?**
> **R :** LUMO utilise les migrations Sequelize (`server/migrations/`). Une migration est un script JavaScript avec `up()` (appliquer) et `down()` (annuler). La commande `npx sequelize-cli db:migrate` applique toutes les migrations non encore appliquées. Le commentaire dans server.js précise : `sync({ alter: false })` — la synchronisation automatique est désactivée pour éviter les bugs de re-hachage des mots de passe. Les changements de schema se font toujours via migration manuelle.

---

## PARTIE G — Plus de questions (100+)

**Q23 : Qu'est-ce que Swagger et comment LUMO l'utilise-t-il ?**
> **R :** Swagger (OpenAPI) est un standard de documentation d'API REST. LUMO génère sa documentation via `swagger-jsdoc` et l'expose sur `/api-docs` via `swagger-ui-express`. Cela permet de voir et tester tous les endpoints API sans client externe.

**Q24 : Qu'est-ce que Socket.io et quel problème résout-il dans LUMO ?**
> **R :** Socket.io est une bibliothèque WebSocket bidirectionnelle. Dans LUMO, il permet les notifications temps réel : quand un stock devient faible, l'alerte s'affiche immédiatement sur le Dashboard sans que l'utilisateur recharge la page. Chaque utilisateur rejoint une room Socket.io personnalisée (`user_${userId}`), et les notifications sont envoyées uniquement à l'utilisateur concerné.

**Q25 : Expliquez le concept de "tenancy" dans LUMO.**
> **R :** LUMO est une application multi-tenant : plusieurs entreprises (tenants) partagent la même installation et la même base de données, mais leurs données sont strictement isolées. L'isolation est assurée par le champ `userId` (ou `parentId` pour les sous-utilisateurs) présent dans chaque table. Le `tenantId = req.user.parentId || req.user.id` est calculé dans le middleware et utilisé pour tous les filtres de requêtes.

**Q26 : Qu'est-ce que la suppression en cascade dans LUMO ?**
> **R :** `onDelete: 'CASCADE'` sur la FK `Sale.userId` signifie que si un User est supprimé, toutes ses Sales sont automatiquement supprimées par PostgreSQL. C'est une contrainte d'intégrité référentielle. Dans LUMO, la suppression d'un admin entraîne la suppression de tous ses données (produits, ventes, clients).

**Q27 : Comment LUMO internationalise-t-il son interface ?**
> **R :** LUMO maintient un fichier `translations.ts` (86 524 octets !) contenant toutes les traductions en français et en anglais. L'utilisateur peut changer la langue dans les Paramètres (`preferences.language`). La préférence est stockée en base et synchronisée via `syncPreferencesToServer()`. Le composant `i18n/runtimeTranslator` applique les traductions (bien que commenté dans App.tsx suite à des bugs de collision).

**Q28 : Qu'est-ce que le hachage SHA-256 utilisé dans LUMO ?**
> **R :** LUMO utilise `crypto.createHash('sha256').update(verificationCode).digest('hex')` pour hasher les codes de vérification d'email et les tokens de reset de mot de passe avant de les stocker en base. Ainsi, même si la BDD est compromise, l'attaquant ne peut pas utiliser le hash pour se vérifier (le hash est différent du code). À la vérification, on hash à nouveau le code soumis et on compare avec le hash en base.

**Q29 : Comment fonctionne le mode maintenance dans LUMO ?**
> **R :** Le SuperAdmin peut activer `maintenance_mode` dans GlobalSettings. Le middleware `protect` vérifie ce paramètre pour chaque requête (sauf pour les superadmins). Si la maintenance est active, toute requête retourne `503 Service Unavailable`. Cela permet au SuperAdmin de faire des opérations de maintenance sans déconnecter manuellement les utilisateurs.

**Q30 : Qu'est-ce que la 2FA et comment LUMO l'implémente-t-il ?**
> **R :** La 2FA (Double Factor Authentication) ajoute une deuxième couche d'authentification en plus du mot de passe. LUMO utilise TOTP (Time-based One-Time Password) via `otplib`. L'utilisateur scanne un QR code avec une app (Google Authenticator). Chaque 30 secondes, l'app génère un code à 6 chiffres. Lors de la connexion, LUMO vérifie ce code avec `authenticator.verify({ token, secret })`. Même avec le mot de passe, sans le téléphone, connexion impossible.

**Q31 : Comment le Dashboard de LUMO exclut-il les ventes remboursées ?**
> **R :** Dans `statsController.js`, les ventes remboursées sont filtrées via : `notRefunded = { statut: { Op.notIn: ['Remboursee', 'Remboursée'] }, statut: { Op.notILike: '%rembours%' } }`. Ce filtre est appliqué à toutes les requêtes de stats pour éviter que les remboursements gonfient artificiellement le CA.

**Q32 : Qu'est-ce que Cloudinary et pourquoi LUMO l'utilise-t-il ?**
> **R :** Cloudinary est un service cloud de gestion des médias (CDN). LUMO l'utilise pour stocker les avatars des utilisateurs et les images des produits. Railway a un stockage éphémère (les fichiers sont perdus au redéploiement), donc LUMO délègue le stockage des images à Cloudinary. Multer reçoit l'image (`memoryStorage`, sans écrire sur le disque), puis la transmet au SDK Cloudinary via `utils/cloudinary.js`. L'URL retournée par Cloudinary est stockée en BDD.

**Q33 : Comment LUMO gère-t-il les erreurs centralement ?**
> **R :** `middleware/errorHandler.js` est le handler d'erreurs Express centralisé. Il reçoit toutes les erreurs non gérées via `next(error)`. En production, les messages d'erreur 500 sont remplacés par "Erreur serveur interne" (pour ne pas exposer les détails). Les erreurs Sequelize comme `SequelizeUniqueConstraintError` sont converties en réponses lisibles ("Cette ressource existe déjà"). Le stack trace n'est affiché qu'en développement.

**Q34 : Qu'est-ce que le champ `chatHistory` dans le modèle User ?**
> **R :** `chatHistory` est un champ JSONB qui stocke l'historique de la conversation de l'utilisateur avec l'IA. Format : `[{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]`. Cet historique est envoyé avec chaque nouvelle requête à l'IA pour maintenir le contexte de la conversation. Il est limité pour ne pas dépasser la limite de tokens du modèle.

**Q35 : Qu'est-ce que la compression et comment LUMO l'utilise-t-il ?**
> **R :** `compression()` est un middleware Express qui compresse les réponses HTTP en gzip/brotli. Une réponse JSON de 100KB peut être compressée à 10KB, réduisant le temps de transfert de ~90%. Dans LUMO, `app.use(compression())` est appliqué avant les routes, compressant automatiquement toutes les réponses API.

**Q36 : Expliquez la configuration SSL de la BDD dans LUMO.**
> **R :** Railway PostgreSQL nécessite SSL. Dans `database.js`, si l'URL est une URL Railway (`postgres://`), SSL est activé avec `{ require: true, rejectUnauthorized: false }`. `rejectUnauthorized: false` est nécessaire car le certificat Railway est auto-signé. En développement local, SSL est désactivé. Le flag `DB_SSL=true` peut forcer SSL si nécessaire.

**Q37 : Qu'est-ce qu'un cron job et comment LUMO l'utilise-t-il ?**
> **R :** Un cron job est une tâche planifiée qui s'exécute à intervalles réguliers. LUMO utilise `node-cron` pour le backup automatique : `initBackupCron()` est appelé au démarrage du serveur et planifie une sauvegarde de la BDD (pg_dump ou export JSON) toutes les nuits. Le `backupController.js` gère la logique de sauvegarde et de restauration.

**Q38 : Qu'est-ce que Sentry et pourquoi est-il important en production ?**
> **R :** Sentry est un outil de monitoring d'erreurs. Dans LUMO, `Sentry.init({ dsn: process.env.SENTRY_DSN })` capture automatiquement toutes les exceptions non gérées en production. Pour chaque erreur, Sentry envoie une alerte avec le stack trace, les données de la requête, l'utilisateur concerné, et l'environnement. Cela permet de détecter et corriger les bugs de production sans attendre que les utilisateurs les signalent.

**Q39 : Comment LUMO calcule-t-il le profit net d'une vente ?**
> **R :** Pour chaque article dans `sale.articles` (JSONB) : `profitLigne = (article.prixUnitaire - article.prixAchat) × article.quantite`. Le `profitNet` de la vente = `Σ profitLigne - remise`. Cette valeur est calculée dans `SaleController.createSale()` et stockée dans le champ `profitNet` de Sale pour éviter de recalculer à chaque statistique.

**Q40 : Qu'est-ce qu'un seeder Sequelize et quand l'utilise-t-on ?**
> **R :** Un seeder est un script qui insère des données initiales (données de test ou données de production par défaut) dans la BDD. Dans LUMO (`server/seeders/`), ils peuvent créer les données de démonstration (produits exemples, premier admin...). On les exécute avec `npx sequelize-cli db:seed:all`. Contrairement aux migrations (structure), les seeders concernent les données.

---

# CHAPITRE 14 — SCÉNARIO DE DÉMONSTRATION {#chapitre-14}

## 14.1 Préparation avant la soutenance

### Checklist technique
- [ ] Application déployée et accessible sur Vercel + Railway
- [ ] BDD avec des données de démonstration (au moins 20 produits, 50 ventes, 10 clients)
- [ ] Compte admin de démonstration prêt (`demo@lumo.app` / `Demo@2024!`)
- [ ] Connexion Internet stable
- [ ] Navigateur Chrome à jour
- [ ] Écran de présentation cloné (si possible)

### Données de démonstration à préparer
- 3 catégories de produits minimum (ex: Vêtements, Électronique, Alimentaire)
- Produits avec photos réelles (upload sur Cloudinary)
- Au moins 2 produits avec stock faible (pour montrer les alertes)
- 5+ clients enregistrés, dont 2 avec des dettes
- 3+ fournisseurs
- 30+ ventes récentes (pour les graphiques Stats)
- 1 sous-utilisateur caissier

## 14.2 Script de démonstration (20 minutes)

### ÉTAPE 1 — Page d'accueil Landing (2 min)
"Voici la page d'accueil publique de LUMO. Elle présente les fonctionnalités principales de la plateforme. Un visiteur peut s'inscrire ou se connecter depuis cette page."

→ Montrer la page Landing.tsx

### ÉTAPE 2 — Connexion et Dashboard (3 min)
"Je vais me connecter avec mon compte administrateur."
→ Saisir email + mot de passe → connexion sécurisée avec JWT

"Voici le Dashboard — le tableau de bord. En un coup d'œil, je vois :
- Mon chiffre d'affaires en temps réel
- Le nombre de produits en stock
- Le nombre de clients
- Les ventes récentes
- Les alertes de stock faible"

→ Pointer chaque KPI

"Remarquez les alertes pour les produits à stock faible — elles sont générées automatiquement par notre système de hooks Sequelize."

### ÉTAPE 3 — Module Produits (3 min)
"Passons au catalogue de produits."
→ Naviguer vers /products

"Je vais ajouter un nouveau produit."
→ Cliquer "Nouveau Produit"
→ Remplir : Nom, Prix vente (15 USD), Prix achat (8 USD), Stock (50), Seuil alerte (10)
→ Sauvegarder

"Regardez dans le module Activités — vous verrez que la création de ce produit a été automatiquement journalisée."

"Je vais maintenant simuler un stock faible."
→ Modifier le stock à 3 (< seuil 10)

"Une notification apparaît automatiquement — c'est la puissance des hooks Sequelize qui surveillent les changements de stock en temps réel."

### ÉTAPE 4 — POS (Caisse) (5 min)
"Voici le module le plus important pour le quotidien : le Point de Vente."
→ Naviguer vers /pos

"Je vais enregistrer une vente. Je recherche un produit..."
→ Rechercher "Chemise" → ajouter ×2

"Le panier se met à jour automatiquement. Montant total : 30 USD."

→ Ajouter un deuxième produit

"Le client paie avec 50 USD. Notez que le système calcule automatiquement le rendu monnaie."
→ Saisir montantRecu = 50
→ Valider

"La vente est enregistrée. Le stock de chaque produit a été décrémenté automatiquement. Allons vérifier dans le module Produits."
→ Montrer les nouveaux stocks

### ÉTAPE 5 — Clients et Dettes (2 min)
→ Naviguer vers /clients

"Voici notre base de clients. Chaque client a son historique d'achats et son solde de dettes. Ce mini-CRM nous permet de suivre les ventes à crédit."

### ÉTAPE 6 — Statistiques (2 min)
→ Naviguer vers /stats

"Le module Statistiques offre une analyse visuelle de la performance commerciale. Graphiques d'évolution du CA, produits best-sellers, analyse des marges..."

### ÉTAPE 7 — Assistant IA (2 min)
→ Naviguer vers la section IA

"Notre assistant IA est connecté à nos données réelles en temps réel."

→ Poser la question : "Quel est mon produit le plus en stock et combien me rapporterait-il si je le vendais tout ?"

"Vous voyez que l'IA analyse nos données commerciales réelles et donne une réponse personnalisée. Elle connaît nos prix d'achat, nos stocks, nos ventes récentes."

### ÉTAPE 8 — Paramètres et Sécurité (1 min)
→ Naviguer vers /settings

"Les paramètres permettent de personnaliser LUMO : thème, langue, devise, taux de change USD/CDF, modules activés. On peut aussi créer des comptes employés avec des permissions spécifiques."

## 14.3 Questions de démo anticipées

**"Que se passe-t-il si l'Internet tombe pendant une vente ?"**
> LUMO est une application en ligne. Sans Internet, elle est indisponible. C'est une limite de l'approche SaaS cloud que nous identifions et pour laquelle la perspective serait une Progressive Web App (PWA) avec synchronisation hors-ligne.

**"Peut-on avoir plusieurs boutiques sur un même compte ?"**
> Actuellement, LUMO est une application mono-boutique par compte admin. Le SuperAdmin gère plusieurs boutiques (plusieurs admins) sur sa plateforme. L'architecture multi-tenant de LUMO permet d'envisager plusieurs boutiques par compte dans une version future.

**"Comment récupère-t-on les données si la base de données tombe ?"**
> LUMO implémente un système de backup automatique via cron jobs, avec possibilité de sauvegarde manuelle depuis le backupController. Les backups sont aussi gérés par Railway qui fait des snapshots quotidiens de la base PostgreSQL.

---

# CHAPITRE 15 — ERREURS FRÉQUENTES ET SOLUTIONS {#chapitre-15}

## 15.1 Erreurs d'authentification

| Erreur | Cause | Solution |
|--------|-------|---------|
| `401 Non autorisé, pas de jeton` | Token absent du header Authorization | Vérifier que Axios envoie le header Bearer |
| `401 Token expiré` | Access token expiré (>15min) | Le refresh token intercepteur renouvelle automatiquement |
| `401 Session révoquée` | Token mis en blacklist après logout | Se reconnecter |
| `401 SESSION_REPLACED` | Connexion depuis un autre appareil | La session a été déplacée, se reconnecter |
| `400 Cet email est déjà utilisé` | Email en double en BDD | Utiliser un email différent |
| `503 Mode maintenance` | SuperAdmin a activé la maintenance | Attendre la fin de maintenance |

## 15.2 Erreurs de base de données

| Erreur | Cause | Solution |
|--------|-------|---------|
| `SequelizeUniqueConstraintError` | Violation de contrainte UNIQUE (ex: codeBarre) | Vérifier l'unicité avant insertion |
| `SequelizeForeignKeyConstraintError` | FK violation | Vérifier que le parent existe |
| `SequelizeConnectionError` | PostgreSQL inaccessible | Vérifier DATABASE_URL + Railway up |
| `relation "Users" does not exist` | Tables non créées | Lancer les migrations : `npx sequelize-cli db:migrate` |

## 15.3 Erreurs Frontend

| Erreur | Cause | Solution |
|--------|-------|---------|
| `CORS: Origine non autorisée` | Requête d'une origine non listée | Ajouter l'origine dans `allowedOrigins` (security.js) |
| `Network Error` | Backend inaccessible | Vérifier VITE_API_URL + Railway up |
| Boucle de connexion infinie | Token corrompu en localStorage | Vider le localStorage et se reconnecter |
| Thème non sauvegardé | `syncPreferencesToServer()` échoue | Vérifier l'authentification et les logs serveur |

## 15.4 Problème connu : Re-hachage des mots de passe

> **Bug historique documenté dans le code source** (commentaire server.js ligne 102)

Le commentaire dans server.js précise :
```
// IMPORTANT: sync({ alter: true }) was causing passwords to be re-hashed on every restart
// because Sequelize would trigger column-level hooks. Use alter: false in all environments.
```

Le hook `beforeSave` de User vérifie si le hash commence par `$2a$` ou `$2b$` pour ne pas re-hacher un hash existant. C'est une protection critique.

## 15.5 Erreurs d'upload d'images

| Erreur | Cause | Solution |
|--------|-------|---------|
| `Seules les images sont autorisées` | File MIME type invalide | Uploader uniquement JPG/PNG/WebP |
| `File too large` | Image > 5MB | Compresser l'image avant upload |
| Cloudinary error | Clés API Cloudinary invalides | Vérifier CLOUDINARY_* dans .env |

---

# CHAPITRE 16 — ANNEXES ET DIAGRAMMES {#chapitre-16}

## 16.1 Diagramme de cas d'utilisation

```
                    ┌─────────────────────────────────────────┐
                    │              Système LUMO                │
                    │                                          │
  ┌──────────┐      │  ┌──────────┐   ┌──────────────────┐   │
  │SuperAdmin│──────┼─▶│ Gérer    │   │ Gérer son        │   │
  └──────────┘      │  │plateforme│   │ commerce complet │   │
                    │  └──────────┘   └──────────────────┘   │
  ┌──────────┐      │       ▲              ▲                  │
  │  Admin   │──────┼───────┘──────────────┘                  │
  └──────────┘      │                                          │
       │            │  ┌──────────┐   ┌──────────────────┐   │
       │            │  │  Vendre  │   │ Consulter stats  │   │
  ┌──────────┐      │  │  (POS)   │   │  et rapports     │   │
  │Sous-user │──────┼─▶└──────────┘   └──────────────────┘   │
  └──────────┘      │       │                                  │
                    │       │         ┌──────────────────┐   │
                    │  ┌──────────┐   │ Assistant IA     │   │
                    │  │Gérer     │──▶│ (analyse données)│   │
                    │  │clients   │   └──────────────────┘   │
                    │  └──────────┘                           │
                    └─────────────────────────────────────────┘
```

## 16.2 Diagramme de séquence — Connexion

```
Client           React          Axios         Express      Redis      PostgreSQL
  │                │              │              │            │            │
  │──login form──▶ │              │              │            │            │
  │                │──POST /auth/login──────────▶│            │            │
  │                │              │              │──check──── │            │
  │                │              │              │  blacklist │            │
  │                │              │              │──SELECT─────────────── │
  │                │              │              │◀──user data───────────  │
  │                │              │              │──bcrypt.compare()       │
  │                │              │              │──genToken(userId,SID)   │
  │                │              │              │──UPDATE activeSessions───│
  │                │              │◀──JWT tokens─│            │            │
  │                │◀──setAuth────│              │            │            │
  │◀──Dashboard────│              │              │            │            │
```

## 16.3 Diagramme de séquence — Vente POS

```
Caissier       POS.tsx        useCartStore    Axios        SaleCtrl    PostgreSQL
    │              │               │             │              │           │
    │─scan produit▶│               │             │              │           │
    │              │──addToCart──▶ │             │              │           │
    │              │◀──panier mis à jour─────────│              │           │
    │─clic Valider▶│               │             │              │           │
    │              │──POST /sales─────────────── │              │           │
    │              │               │             │──createSale()▶           │
    │              │               │             │              │─INSERT─── │
    │              │               │             │              │─UPDATE stock──│
    │              │               │             │              │─INSERT Activite│
    │              │               │             │              │─INSERT Notif──│
    │              │               │             │◀─{sale:...}──│           │
    │              │◀─success──────│             │              │           │
    │              │──clearCart───▶│             │              │           │
    │◀─reçu────────│               │             │              │           │
```

## 16.4 Schéma de la base de données (relations principales)

```
┌──────────────────────────────────────────────────────────────────┐
│  Users                                                           │
│  PK: id │ nom │ email │ motDePasse │ role │ parentId(FK→Users.id)│
│  preferences (JSONB) │ entreprise (JSONB) │ permissions (JSONB) │
└─────────┬────────────────────────────────────────────────────────┘
          │ 1:N
    ┌─────┼─────────────────────────────────┐
    │     │                                 │
    ▼     ▼                                 ▼
┌─────────────┐  ┌───────────────┐  ┌──────────────────┐
│  Products   │  │    Sales      │  │    Purchases     │
│  PK: id     │  │  PK: id       │  │  PK: id          │
│  nom │ prix │  │  userId(FK)   │  │  userId(FK)      │
│  prixAchat  │  │  clientId(FK) │  │  fournisseurId   │
│  stock      │  │  articles(J.) │  │  articles(J.)    │
│  stockAlerte│  │  montantTotal │  │  montantTotal    │
│  userId(FK) │  │  profitNet    │  │  statut          │
│  variantes  │  │  devise       │  └──────────────────┘
│  (JSONB)    │  │  statut       │         │ N:1
└──────┬──────┘  └───────────────┘  ┌──────────────────┐
       │                │ N:1       │  Fournisseurs    │
       │ 1:N       ┌────────────┐   │  PK: id          │
       │           │  Clients   │   │  nom│entreprise  │
       ▼           │  PK: id    │   │  userId(FK)      │
┌──────────────┐   │  nom│phone │   └──────────────────┘
│StockMovements│   │  detteTotale│
│  PK: id     │   │  userId(FK)│
│  productId  │   └────────────┘
│  type (E/S) │
│  quantite   │
│  ancienStock│
│  nouveauStock│
└─────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Activites   │  │Notifications │  │  CashSessions    │
│  type        │  │  titre       │  │  fondInitial     │
│  description │  │  contenu     │  │  totalVentes     │
│  userNom     │  │  type        │  │  statut          │
│  UserId(FK)  │  │  isRead      │  │  userId(FK)      │
│  shopId      │  │  userId(FK)  │  └──────────────────┘
└──────────────┘  └──────────────┘
```

## 16.5 Diagramme de déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
│                           │                                 │
│         ┌─────────────────┴─────────────────┐              │
│         ▼                                   ▼              │
│  ┌─────────────┐                   ┌────────────────┐      │
│  │   Vercel    │                   │    Railway     │      │
│  │  (Frontend) │                   │   (Backend)    │      │
│  │             │                   │                │      │
│  │  React SPA  │──HTTPS REST API──▶│  Node.js       │      │
│  │  Vite Build │                   │  Express       │      │
│  │  CDN Global │◀──JSON Responses──│  PM2 Cluster   │      │
│  │             │                   │       │        │      │
│  │  VITE_API=  │                   │       ▼        │      │
│  │  railway.app│                   │  PostgreSQL    │      │
│  └─────────────┘                   │  Redis         │      │
│                                    │  Volumes       │      │
│                                    └────────────────┘      │
│                                           │                 │
│                         ┌─────────────────┤                 │
│                         ▼                 ▼                 │
│                   ┌──────────┐    ┌───────────────┐        │
│                   │Cloudinary│    │DeepSeek AI API│        │
│                   │(Images)  │    │(IA Assistant) │        │
│                   └──────────┘    └───────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 16.6 Diagramme de classes (modèles Sequelize)

```
┌────────────────────────────────┐
│            User                │
├────────────────────────────────┤
│ + id: INTEGER                  │
│ + nom: STRING                  │
│ + email: STRING (unique)       │
│ + motDePasse: STRING           │
│ + role: STRING                 │
│ + parentId: INTEGER            │
│ + preferences: JSONB           │
│ + entreprise: JSONB            │
│ + permissions: JSONB           │
│ + twoFactorEnabled: BOOLEAN    │
│ + activeSessions: JSONB        │
│ + chatHistory: JSONB           │
├────────────────────────────────┤
│ + matchMotDePasse(pwd): Boolean│
│ + beforeSave(): void           │
└────────────────────────────────┘

┌────────────────────────────────┐
│           Product              │
├────────────────────────────────┤
│ + id: INTEGER                  │
│ + nom: STRING                  │
│ + prix: DECIMAL(20,2)          │
│ + prixAchat: DECIMAL(20,2)     │
│ + stock: INTEGER               │
│ + stockAlerte: INTEGER         │
│ + categorie: STRING            │
│ + codeBarre: STRING (unique)   │
│ + devise: STRING [USD|CDF]     │
│ + variantes: JSONB             │
│ + taxe: FLOAT                  │
│ + userId: INTEGER (FK)         │
│ + deletedAt: DATE (paranoid)   │
├────────────────────────────────┤
│ + afterCreate(): void          │
│ + afterSave(): void            │
│ + afterDestroy(): void         │
└────────────────────────────────┘

┌────────────────────────────────┐
│            Sale                │
├────────────────────────────────┤
│ + id: INTEGER                  │
│ + userId: INTEGER (FK)         │
│ + clientId: INTEGER (FK)       │
│ + sellerId: INTEGER (FK)       │
│ + articles: JSONB              │
│ + montantTotal: FLOAT          │
│ + remise: FLOAT                │
│ + profitNet: FLOAT             │
│ + methodePaiement: STRING      │
│ + statut: STRING               │
│ + devise: STRING               │
│ + tauxChange: FLOAT            │
│ + deletedAt: DATE (paranoid)   │
├────────────────────────────────┤
│ + afterCreate(): void          │
│ + afterDestroy(): void         │
└────────────────────────────────┘
```

---

# CONCLUSION

Ce manuel a couvert l'intégralité du projet LUMO en se basant exclusivement sur l'analyse du code source réel du projet. Chaque chapitre a été rédigé pour permettre aux trois membres de l'équipe de :

1. **Comprendre** le projet dans sa globalité (architecture, flux, technologies)
2. **Expliquer** chaque fonctionnalité de façon précise et académique
3. **Défendre** leurs choix techniques devant un jury
4. **Démontrer** l'application de façon convaincante

> [!IMPORTANT]
> Les points les plus susceptibles d'être questionnés par le jury sont :
> - Le mécanisme JWT (access + refresh + blacklist Redis)
> - Le RBAC (rôles + permissions JSONB + middlewares)
> - Les hooks Sequelize (automatisation du stock et des activités)
> - La sécurité multicouche (defense-in-depth)
> - La gestion multi-devises USD/CDF
> - L'architecture multi-tenant (tenantId)

> [!TIP]
> Pour la démonstration : préparez les données à l'avance et connaissez par cœur le flux d'une vente POS complète — c'est la fonctionnalité centrale de LUMO.

---

*Document généré sur base de l'analyse du code source réel du projet LUMO*  
*Version : 1.0 — Juillet 2026*  
*Technologies analysées : Node.js 18, Express 4.18, React 18, PostgreSQL, Sequelize 6, JWT, Bcrypt, Helmet, Redis, Socket.io, DeepSeek API, Cloudinary, Railway, Vercel*
