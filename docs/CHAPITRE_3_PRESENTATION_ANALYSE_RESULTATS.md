# Chapitre 3 : Présentation et Analyse des Résultats

## Documentation Technique Exhaustive - Application LUMO

**Date de rédaction** : 2026-05-27  
**Version** : 1.0  
**Auteur** : Ingénieur Concepteur Logiciel  

---

## 1. PRÉSENTATION GÉNÉRALE DE L'APPLICATION

### 1.1 Description Fonctionnelle

LUMO (Logical Unified Management Operations) est une application web de gestion commerciale complète développée avec le stack **PERN (PostgreSQL, Express.js, React 18, Node.js)** et l'ORM **Sequelize**. Elle permet la gestion intégrée des activités commerciales incluant :

- Point de Vente (POS) et facturation
- Gestion des stocks avec alertes automatiques
- Suivi des achats fournisseurs
- Gestion des clients et dettes
- Sessions de caisse et trésorerie
- Statistiques et rapports analytiques
- Intelligence Artificielle DeepSeek intégrée
- Multi-devises (USD/CDF)

### 1.2 Stack Technologique

| Couche | Technologie | Version | Rôle |
|--------|------------|---------|------|
| **Frontend** | React | 18.2.0 | Interface utilisateur |
| | TypeScript | 5.0.2 | Typage statique |
| | Zustand | 4.3.8 | State management |
| | Socket.IO Client | 4.7.2 | WebSockets temps réel |
| | Vite | 8.0.13 | Build tool |
| | TailwindCSS | 3.3.2 | Styling |
| **Backend** | Node.js | 18+ | Runtime JavaScript |
| | Express.js | 4.18.2 | Framework web |
| | Sequelize | 6.31.0 | ORM PostgreSQL |
| | Socket.IO | 4.8.3 | WebSockets serveur |
| | JWT | 9.0.0 | Authentification |
| | bcryptjs | 2.4.3 | Hachage mots de passe |
| **Base de données** | PostgreSQL | 15+ | Persistance données |
| | Redis | 7+ | Cache & Session store |
| **Services externes** | Cloudinary | API v2 | Stockage images |
| | DeepSeek AI | API | Intelligence artificielle |
| | SMTP/Resend | API | Envoi emails |

---

## 2. MODULE D'AUTHENTIFICATION, SÉCURITÉ ET RÔLES (RBAC)

### 2.1 Register & Login : Logique Backend

Le système d'authentification de LUMO repose sur une architecture JWT (JSON Web Token) couplée au hachage sécurisé des mots de passe via l'algorithme **bcryptjs**.

**Processus de Registre** (`server/controllers/authController.js`, lignes 16-111) :

1. **Validation des données** via Joi (`server/middleware/validators.js`, lignes 3-36) :
   - Le schéma `validateRegister` exige : `nom`, `email`, `motDePasse` (minimum 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial), `entrepriseNom`.
   - Validation stricte du format email avec `Joi.string().email()`.

2. **Génération du code OTP** (ligne 47) :
   ```javascript
   const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
   ```
   Cette formule génère un nombre aléatoire compris entre 100000 et 999999, soit exactement 6 chiffres.

3. **Hachage du code OTP** avec SHA-256 (ligne 50) :
   ```javascript
   const hashedVerificationCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
   ```
   Le code n'est jamais stocké en clair en base de données. SHA-256 est utilisé ici (et non bcrypt) car le code est court et temporaire.

4. **Hachage du mot de passe** via le hook `beforeSave` du modèle `User` (lignes 145-154) :
   ```javascript
   if (user.changed('motDePasse') && user.motDePasse) {
     const alreadyHashed = user.motDePasse.startsWith('$2a$') || user.motDePasse.startsWith('$2b$');
     if (!alreadyHashed) {
       const salt = await bcrypt.genSalt(10);
       user.motDePasse = await bcrypt.hash(user.motDePasse, salt);
     }
   }
   ```
   - Facteur de coût : **10 rounds** (équilibre entre sécurité et performance).
   - Le guard `alreadyHashed` prévient le re-hachage des valeurs déjà hachées (problème de migration Sequelize).

5. **Première inscription** : Si aucune donnée utilisateur n'existe (ligne 45), le compte devient automatiquement `superadmin` avec `isVerified=true` et `isAdminValidated=true`.

6. **Génération des tokens JWT** :
   - Un `sessionId` cryptographique unique est généré : `crypto.randomBytes(16).toString('hex')`.
   - Deux tokens sont créés : `accessToken` (courte durée) et `refreshToken` (longue durée, httpOnly cookie).

**Processus de Connexion** (`loginAdmin`, lignes 113-207) :

1. Recherche utilisateur par email avec recherche insensible à la casse : `[Op.iLike]`.
2. Vérification du mot de passe via `user.matchMotDePasse()` :
   ```javascript
   User.prototype.matchMotDePasse = async function (enteredPassword) {
     if (!this.motDePasse) return false;
     return bcrypt.compare(enteredPassword, this.motDePasse);
   };
   ```
3. Contrôles de sécurité :
   - Email vérifié `isVerified`
   - Compte non suspendu `isSuspended`
   - Compte validé par admin `isAdminValidated` (sauf superadmin)
4. Gestion 2FA éventuelle : retourne `requires2FA=true` si activé.
5. Création de session avec limitation à 5 sessions actives par compte.

### 2.2 Mot de passe oublié & Vérification OTP

**Cycle de vie complet de l'OTP de réinitialisation** :

1. **Demande de reset** (`forgotPassword`, lignes 456-486) :
   - Génération d'un OTP 6 chiffres : `Math.floor(100000 + Math.random() * 900000).toString()`
   - Hachage SHA-256 dans `resetPasswordToken`
   - Expiration fixée à **1 heure** : `Date.now() + 3600000`
   - Envoi d'email via template `getResetPasswordTemplate`

2. **Vérification OTP** (`verifyResetCode`, lignes 489-508) :
   - Recherche utilisateur avec : email correspondant, token haché correspondant, expiration > maintenant
   - La vérification contrôle explicitement `[Op.gt]: Date.now()` pour valider la durée de vie

3. **Réinitialisation finale** (`resetPassword`, lignes 511-536) :
   - Re-vérification du code et de son expiration
   - Attribution du nouveau mot de passe : `user.motDePasse = motDePasse`
   - Le hook `beforeSave` hache automatiquement le nouveau mot de passe
   - Nettoyage des champs : `resetPasswordToken = null`, `resetPasswordExpire = null`

**Double Authentification 2FA (TOTP)** :

- **Setup** : Génération d'un secret via `otplib.authenticator.generateSecret()`
- **QR Code** : Création via `qrcode.toDataURL(otpauth)`
- **Validation** : Vérification avec fenêtre de tolérance de 1 pas (`authenticator.check()`)
- **Expiration session setup** : 15 minutes (stocké dans `twoFactorExpire` en BIGINT timestamp)

### 2.3 Système RBAC (Role-Based Access Control)

**Matrice complète des droits et privilèges** :

| Rôle | Produits (CRUD) | Ventes (CRUD) | Clients (CRUD) | Achats (CRUD) | Statistiques | Rapports Financiers | Gestion Équipe | Paramètres |
|------|-----------------|---------------|---------------|---------------|-------------|---------------------|----------------|------------|
| **Super Admin** | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous |
| **Admin** | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous |
| **Manager** | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Limité | ❌ |
| **Caissier** | 🔍 Lecture | ✅ Création (+ remboursement) | 🔍 Lecture | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vendeur** | 🔍 Lecture | ✅ Création (+ remboursement) | 🔍 Lecture | ❌ | ❌ | ❌ | ❌ | ❌ |

**Permissions spécifiques dans le code** :

- **Manager** : `['products', 'sales', 'clients', 'stats', 'pos', 'cash']`
- **Caissier/Vendeur** : `['pos', 'sales', 'sales.add', 'products', 'clients']`

**Implémentation technique** (`authMiddleware.js`, lignes 108-133) :
```javascript
exports.checkPermission = (permissionId) => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next(); // Accès total
    }
    const userPerms = req.user.permissions || [];
    if (userPerms.includes(permissionId)) return next();
    // Héritage du module parent (products.edit -> products)
    const parentModule = permissionId.includes('.') ? permissionId.split('.')[0] : null;
    if (parentModule && userPerms.includes(parentModule)) return next();
    return res.status(403).json({ message: `Accès refusé. Permission requise : "${permissionId}".` });
  };
};
```

---

## 3. LOGIQUE MÉTIER ET MODULES DE L'APPLICATION

### 3.1 Module des Ventes et Facturation

**Flux d'une vente** (`SaleController.createSale`, lignes 63-288) :

1. **Validation** : Le payload est validé via `validateSale` (Joi).
2. **Transaction SQL** : Une transaction est ouverte pour garantir l'atomicité.
3. **Résolution de la devise** :
   - `shopCurrency = owner.entreprise.devise || 'CDF'`
   - `saleCurrency = devise || 'USD'`
   - `finalRate = tauxChange || owner.preferences.exchangeRate`

4. **Calcul des montants** (formules mathématiques exactes) :

**Montant Total Brut** :
```
MTB = Σ(i=1 à n) (prixUnitaire_i × quantité_i)
```

**Application des remises** :
```
MontantApresRemise = MTB - remise
```

**Calcul de la TVA** (implémenté via le champ `taxe` dans Product) :
```
TVA = prixUnitaire × (taxe / 100)
PrixTTC = prixUnitaire + TVA
```

**Montant Net à Payer** :
```
MNet = MTB - remise
```

**Conversion de devises** :
```
USD → CDF : montantCDF = Math.round(montantUSD × tauxChange)
CDF → USD : montantUSD = Math.round((montantCDF / tauxChange) × 100) / 100
```

5. **Mise à jour du stock** : Pour chaque produit, `product.stock -= quantité`.

6. **Calcul du profit net** :
```javascript
profitNormalized = Σ(prixUnitaireCDF - prixAchatCDF) × quantité - remise
profitNet = Math.round(profitNormalized × 100) / 100
```

### 3.2 Module de Gestion des Stocks

**Mise à jour automatisée des stocks** (`Product.js`, lignes 123-187) :

Le hook Sequelize `afterSave` déclenche la mise à jour :

```javascript
if (product.changed('stock')) {
  const isNewRecord = options.isNewRecord || false;
  const ancienStock = isNewRecord ? 0 : (product.previous('stock') || 0);
  const nouveauStock = product.stock;
  const difference = nouveauStock - ancienStock;
  
  if (difference !== 0) {
    await StockMovement.create({
      productId: product.id,
      userId: product.userId,
      type: difference > 0 ? 'ENTREE' : 'SORTIE',
      quantite: Math.abs(difference),
      ancienStock,
      nouveauStock,
      raison: product.stockUpdateRaison || (isNewRecord ? 'Initialisation' : 'Ajustement')
    });
  }
}
```

**Détection du seuil d'alerte** :
```javascript
const alertLevel = product.stockAlerte || 5;
if (nouveauStock < alertLevel && ancienStock >= alertLevel) {
  await Notification.create({
    userId: product.userId,
    titre: 'Stock Faible',
    contenu: `Alerte: Le stock pour "${product.nom}" est passé sous le seuil (${nouveauStock} restants).`,
    type: 'WARNING'
  });
}
```

### 3.3 Module d'Intelligence Artificielle (DeepSeek AI)

**Intégration DeepSeek AI** (`aiController.js`) :

Le système utilise l'SDK OpenAI compatible avec DeepSeek :

```javascript
const getClient = () => {
  const provider = process.env.AI_PROVIDER || "deepseek";
  if (provider === "ollama") {
    return new OpenAI({ apiKey: "ollama", baseURL: process.env.OLLAMA_URL });
  }
  const key = process.env.DEEPSEEK_API_KEY;
  return new OpenAI({ apiKey: key, baseURL: "https://api.deepseek.com" });
};
```

**Base de connaissance complète** :

L'IA reçoit en contexte :
- Tous les produits avec stock et seuils d'alerte
- Les 30 dernières ventes avec montants
- Les clients avec dettes
- Les fournisseurs
- Les achats récents
- Les paiements du personnel

**Endpoints IA** :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/insights` | GET | Recommandations stratégiques (3 suggestions) |
| `/api/ai/chat` | POST | Chat en streaming SSE |
| `/api/ai/chat/history` | GET | Historique des conversations |
| `/api/ai/feedback` | POST | Retour d'expérience |
| `/api/ai/public-chat` | POST | Chat public landing page |

---

## 4. ARCHITECTURE TECHNIQUE ET LOGIQUE DU CODE

### 4.1 Modèles de la Base de Données (PostgreSQL + Sequelize)

**Associations clés** (`server/models/index.js`) :

```
┌─────────────┐          ┌──────────────┐
│    User     │──────────│    Sale      │
│             │  owns    │              │
└─────────────┘          └──────────────┘
      ▲                         ▲
      │                         │
      │                         │
      │                ┌──────────────┐
      └────────────────│   Client     │
                       └──────────────┘

┌─────────────┐          ┌──────────────┐
│  Product    │──────────│ StockMovement│
│             │  has     │              │
└─────────────┘          └──────────────┘

┌─────────────┐          ┌──────────────┐
│  Purchase   │──────────│ Fournisseur  │
└─────────────┘          └──────────────┘
```

**Modèle User** - Champs clés :
- `role`: `superadmin`, `admin`, `manager`, `caissier`, `vendeur`
- `permissions`: JSONB array avec permissions granulaire
- `parentId`: FK vers l'admin propriétaire (pour sous-utilisateurs)
- `activeSessions`: JSONB pour la gestion multi-session

### 4.2 Communication en temps réel (Socket.IO)

**Configuration Socket.IO** (`server.js`, lignes 11-76) :

```javascript
const io = new Server(server, { 
  cors: { origin: "*" },
  transports: ['websocket', 'polling']
});

// Redis Adapter pour clustering (PM2)
const pubClient = new Redis(redisOptions);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Événement de connexion
io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
  });
});

global.io = io;
```

---

## 5. SERVICES API ET SERVICES EXTERNES

### 5.1 Services externals configurés

| Service | Type | Configuration | Utilisation |
|---------|------|---------------|-------------|
| **DeepSeek AI** | IA API | `DEEPSEEK_API_KEY` | Chat, insights, analyse |
| **Cloudinary** | CDN Stockage | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Upload avatars, logos, images produits |
| **SMTP/Resend** | Email | `SMTP_USER`, `SMTP_PASS`, `RESEND_API_KEY` | OTP, notifications, rappels dette |
| **Redis** | Cache/Session | `REDIS_URL` ou `REDIS_HOST/PORT` | Cache stats, blacklist tokens, Socket.IO |
| **Sentry** | Monitoring | `SENTRY_DSN` | Tracking erreurs production |

### 5.2 Architecture services

```mermaid
graph LR
    A[LUMO Server] --> B[DeepSeek API]
    A --> C[Cloudinary CDN]
    A --> D[SMTP/Resend]
    A --> E[Redis Cache]
    A --> F[Sentry Monitoring]
    
    style B fill:#fbbf24
    style C fill:#06b6d4
    style D fill:#f97316
    style E fill:#10b981
    style F fill:#8b5cf6
```

---

## 6. HÉBERGEMENT ET DÉPLOIEMENT

### 6.1 Infrastructure cible

| Composant | Plateforme | Configuration |
|-----------|------------|---------------|
| **Application** | Railway.app | Déploiement automatique via Git, build avec Nixpacks |
| **Base de données** | Railway PostgreSQL | Pool de connexion max 20 |
| **Cache Redis** | Railway Redis | TTL 24h pour blacklist tokens |
| **Frontend** | Railway Static | Build Vite, CDN intégré |
| **Fichiers upload** | Cloudinary | Stockage cloud illimité |

### 6.2 Variables d'environnement (.env)

```env
# Base de données
DATABASE_URL=postgresql://user:pass@host:port/db
DB_SSL=true

# Serveur
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d

# IA
DEEPSEEK_API_KEY=sk-...
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat

# Stockage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email
SMTP_USER=...
SMTP_PASS=...
FROM_EMAIL=...
RESEND_API_KEY=...

# Cache
REDIS_URL=redis://...

# Monitoring
SENTRY_DSN=...
```

### 6.3 Limites d'hébergement

- **Railway** : 5GB disque, 1GB RAM, 100GB trafic/mois (plan gratuit)
- **Cloudinary** : 25 credits/mois (25k images), 5GB bandwidth
- **DeepSeek API** : Pay-per-use (~$0.001/1K tokens en entrée)

---

## 7. COÛTS ET BUDGET ESTIMÉ

### 7.1 Coûts mensuels estimés

| Ressource | Coût mensuel | Notes |
|-----------|--------------|-------|
| **Railway App (Pro)** | $5-25 | Selon usage CPU/mémoire |
| **Railway PostgreSQL** | $0-15 | 1GB-10GB stockage |
| **Railway Redis** | $0-7 | 10MB-250MB mémoire |
| **Cloudinary** | $0 | Plan gratuit suffisant pour < 1000 produits |
| **DeepSeek API** | $2-20 | ~100-1000 conversations/mois |
| **Domaine (Optionnel)** | $12 | .com/.cd/.rf |
| **TOTAL** | **$7-74/mois** | Budget recommandé : $20-30/mois |

### 7.2 Calcul du budget DeepSeek

```javascript
// Estimation coûts API (server/controllers/superAdminController.js, lignes 182-183)
apiCosts = totalAiMessages × 0.0015; // ~$0.0015 par message
```

Pour une boutique moyenne avec 50 conversations mensuelles :
- 50 messages × $0.0015 = **$0.075/mois**

---

## 8. SIMULATION DE DONNÉES ET PERFORMANCES

### 8.1 Exemple de journal de transactions (logs de traçabilité)

```
[2026-05-26 14:32:45] [VENTE] Vente #1847: 125 000 FC (≙ 45 USD)
    - Vendeur: Jean-Pierre Mwana (ID: 24)
    - Articles: 3 articles
        • Eau Minérale 1.5L (x12) - 1 500 FC / unité
        • Pain de Mie (x5) - 2 500 FC / unité
        • Fromage Gouda 500g (x2) - 8 000 FC / unité
    - Mode paiement: Espèces
    - Client: Client de passage
    - Profit net: 28 500 FC (22.8% marge)
    - Session caisse: #78 (ouverte par Jean-Pierre à 08:15)

[2026-05-26 14:33:12] [STOCK_MOVEMENT] SORTIE - Eau Minérale 1.5L
    - Ancien stock: 45 → Nouveau stock: 33
    - Quantité: 12
    - Raison: Vente (#1847)
    - Propriétaire: Boutique Mwana (ID: 12)

[2026-05-26 14:35:22] [ACTIVITE] CONNEXION
    - Utilisateur: Manager Admin (ID: 12)
    - IP: 192.168.1.45
    - User-Agent: Mozilla/5.0 (Windows NT 10.0...)
    - Session ID: a3f8e4d2b1c9...

[2026-05-26 14:45:01] [NOTIFICATION] Stock Faible
    - Produit: Fromage Gouda 500g
    - Stock: 3 (seuil: 5)
    - Type: WARNING
    - Destinataire: user_12
```

### 8.2 Métriques de performance simulées (API PERN)

| Métrique | Valeur | Unité | Méthode de mesure |
|----------|--------|-------|-------------------|
| Temps de réponse moyen (auth) | 85 | ms | `console.time()` dans `authController` |
| Temps de réponse moyen (ventes) | 120 | ms | Transaction + calculs + hooks |
| Temps de réponse moyen (produits) | 45 | ms | Requêtes simples avec cache |
| Requêtes simultanées supportées | 250 | req/s | Load test avec Artillery |
| Temps moyen DB query | 15-30 | ms | Indexation + requêtes paramétrées |
| Cache hit ratio (Redis) | 92 | % | `statsRoutes` + `productRoutes` |
| Taux de disponibilité | 99.8 | % | Health check `/health` |
| Mémoire utilisée (moyenne) | 128 | MB | Process Node.js production |
| Latence Socket.IO (broadcast) | < 10 | ms | Emission interne |

### 8.3 Profilage authController

```javascript
const startTime = Date.now();
// ... opérations ...
console.log(`[AUTH_PERF] Login start for ${email}`);
console.log(`[AUTH_PERF] DB FindUser: ${Date.now() - startTime}ms`);
console.log(`[AUTH_PERF] Bcrypt Compare: ${Date.now() - passCheckStart}ms`);
```

### 8.4 Gestion des requêtes simultanées

- Pool de connexion PostgreSQL : `max: 20`
- Rate limiting : 100 req/15min global, 10 req/15min sur endpoints auth
- Cache Redis 300-600s sur les stats pour réduire la charge DB

---

## 9. SCHÉMA D'ARCHITECTURE COMPLÈTE

```mermaid
graph TB
    subgraph "CLIENT (React 18)"
        A[Pages TSX] --> B[Zustand Store]
        B --> C[API Service Axios]
        C --> D[Socket.IO Client]
    end

    subgraph "SERVEUR (Node.js/Express)"
        E[Routes API] --> F[Controllers]
        F --> G[Models Sequelize]
        F --> H[Midlewares]
        G --> I[(PostgreSQL)]
        H --> J[JWT Validator]
        H --> K[Permission Check]
        
        subgraph "WebSocket"
            L[Socket.IO Server]
            L --> M[Redis Adapter]
            M --> N[(Redis)]
        end
        
        subgraph "Jobs"
            O[Backup Cron] --> F
        end
    end

    subgraph "SERVICES EXTERNES"
        P[Cloudinary - Images]
        Q[SMTP/Resend - Emails]
        R[DeepSeek AI API]
        S[Sentry Monitoring]
    end

    C -- HTTP/HTTPS --> E
    D <-- WS/WSS --> L
    G <-- SQL --> I
    F -->|Emails| Q
    F -->|Upload Images| P
    F -->|AI Chat| R
    F -->|Errors| S
```

---

## 10. API ENDPOINTS COMPLÈTES

### 10.1 Authentification

| Endpoint | Méthode | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | ❌ | Inscription nouvel utilisateur |
| `/api/auth/login` | POST | ❌ | Connexion + génération tokens |
| `/api/auth/profile` | GET | ✅ | Récupérer profil connecté |
| `/api/auth/profile` | PUT | ✅ | Mise à jour profil |
| `/api/auth/verify-email` | POST | ❌ | Vérification OTP email |
| `/api/auth/resend-code` | POST | ❌ | Renvoi code OTP |
| `/api/auth/forgot-password` | POST | ❌ | Demande reset mot de passe |
| `/api/auth/verify-reset-code` | POST | ❌ | Vérification OTP reset |
| `/api/auth/reset-password` | POST | ❌ | Changement définitif |
| `/api/auth/refresh` | POST | ❌ | Renouvellement access token |
| `/api/auth/logout` | POST | ✅ | Déconnexion + blacklist |
| `/api/auth/2fa/setup` | GET | ✅ | Génération QR code TOTP |
| `/api/auth/2fa/activate` | POST | ✅ | Activation 2FA |
| `/api/auth/2fa/disable` | POST | ✅ | Désactivation 2FA |
| `/api/auth/2fa/verify` | POST | ❌ | Vérification code 2FA |

### 10.2 Gestion commerciale

| Endpoint | Méthode | Description |
|----------|--------|-------------|
| `/api/products` | GET/POST | CRUD produits |
| `/api/products/:id` | PUT/DELETE | Mise à jour/suppression |
| `/api/products/:id/history` | GET | Historique mouvements stock |
| `/api/sales` | GET/POST | Historique/commande ventes |
| `/api/sales/:id` | DELETE | Suppression vente |
| `/api/sales/:id/refund` | POST | Remboursement vente |
| `/api/purchases` | GET/POST | CRUD achats fournisseurs |
| `/api/clients` | GET/POST | CRUD clients |
| `/api/clients/:id/regler` | POST | Règlement dette client |
| `/api/clients/:id/rappel` | POST | Envoi rappel dette email |

### 10.3 Statistiques & IA

| Endpoint | Méthode | Description |
|----------|--------|-------------|
| `/api/stats/dashboard` | GET | KPIs tableau de bord |
| `/api/stats/sales-chart` | GET | Graphiques ventes |
| `/api/stats/analytics` | GET | Analyses avancées |
| `/api/ai/insights` | GET | Recommandations stratégiques |
| `/api/ai/chat` | POST | Chat IA streaming |
| `/api/ai/chat/history` | GET | Historique chat |

### 10.4 Administration

| Endpoint | Méthode | Description |
|----------|--------|-------------|
| `/api/superadmin/users` | GET | Liste tous utilisateurs |
| `/api/superadmin/users/:id/suspend` | PUT | Suspension compte |
| `/api/superadmin/users/:id/validate` | PUT | Validation manuelle |
| `/api/superadmin/stats` | GET | Stats globales plateforme |
| `/api/superadmin/settings` | GET/PUT | Paramètres globaux |
| `/api/backup/export` | GET | Export base JSON |
| `/api/backup/email` | GET | Envoyer backup par email |

---

## 11. POINTS TECHNIQUES CLÉS POUR LA Soutenance

1. **Sécurité** : bcrypt avec 10 rounds, SHA-256 pour les OTP, JWT avec sessionId, blacklist Redis 24h, Helmet, XSS-clean, HPP, CORS, rate limiting

2. **Atomicité** : Transactions SQL (`sequelize.transaction()`) pour toutes les opérations critiques (ventes, achats, suppressions)

3. **Performance** : 
   - Cache Redis 5-10min (`cacheMiddleware`)
   - Optimisation N+1 (`Promise.all` pour eager loading)
   - Pool de connexion PostgreSQL (max 20)
   - Streaming SSE pour IA

4. **Scalabilité** : 
   - Redis Adapter Socket.IO pour clustering PM2
   - Architecture multi-tenant (isolation données `tenantId`)
   - Cache distribué

5. **Auditabilité** : 
   - Journal complet via modèle `Activite`
   - Mouvements de stock traçables
   - Notifications automatiques
   - Logs Sentry pour erreurs

6. **Résilience** :
   - Mode hors-ligne ventes (`localStorage.pending-sales`)
   - Fallback email SMTP → Resend
   - Graceful degradation IA (mode offline)