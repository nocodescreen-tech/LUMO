# CHAPITRE DEUXIÈME : APPROCHE SOLUTIONNELLE

Ce chapitre présente la démarche méthodologique, l'architecture logicielle de conception et la planification rigoureuse adoptées pour la réalisation du projet LUMO (Logical Unified Management Operations). LUMO est une plateforme de commerce électronique centralisée, multi-tenant et multi-devises basée sur le stack technologique PERN (PostgreSQL, Express.js, ReactJS, Node.js). Dans les sections qui suivent, nous détaillons le cadre logique du projet, le chronogramme précis de réalisation, la structure budgétaire d'exploitation cloud réelle, ainsi que les méthodes théoriques et techniques logicielles mises en œuvre pour concrétiser cette solution ERP/POS.

---

## II.1. Planification du projet

La planification constitue une étape cruciale dans tout projet de développement logiciel et de maintenance de systèmes. Elle permet de structurer les étapes du cycle de vie du logiciel, d'identifier les ressources critiques (infrastructures Cloud, services de calcul, capacités de stockage), d'établir un calendrier de réalisation réaliste et de répartir les responsabilités opérationnelles au sein de l'équipe de projet. Dans le cadre de LUMO, cette planification a été réalisée de manière méthodique sur une durée stricte de cinq mois (de janvier 2026 à mai 2026), en prenant en compte les contraintes budgétaires, le besoin de haute disponibilité et la scalabilité requise pour le déploiement commercial.

### II.1.1. Cadre logique (Matrice du Projet)

Le cadre logique est un outil formel de planification logicielle permettant de structurer le projet en décomposant les objectifs globaux en objectifs spécifiques opérationnels. Pour le projet LUMO, le cadre logique est conçu pour lier de manière causale chaque étape du cycle de développement aux indicateurs de performance (KPI) mesurables et aux ressources financières d'exploitation réelles qui y sont allouées. Cette structuration garantit l'alignement de l'ingénierie sur le budget d'infrastructure cloud.

**Tableau II.1 : Matrice de planification et de cadre logique du projet LUMO**

| N° | Objectif Spécifique | Indicateurs de Performance (KPI) | Activités de Développement | Responsable | Budget (USD) |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **1** | **Conception & Modélisation** | Cahier des charges fonctionnel rédigé et validé.<br>100% des cas d'utilisation modélisés en UML (Cas d'utilisation, Classes, Séquences). | Analyse des besoins des commerces locaux.<br>Modélisation de la structure BDD (ERD).<br>Définition de la charte graphique et ergonomie. | NZAKU Z.R. | 0.00 |
| **2** | **Développement API Backend** | 12 modèles Sequelize PostgreSQL fonctionnels.<br>100% des endpoints API REST sécurisés et documentés (Swagger). | Configuration du framework Express et Sequelize ORM.<br>Création des migrations et seeders.<br>Développement des middlewares d'authentification et RBAC. | NZAKU Z.R.<br>NLANDU M.M. | 0.00 |
| **3** | **Développement POS Frontend** | Console de vente tactile utilisable.<br>Zustand state-store synchronisé.<br>Temps de réponse de mise au panier &lt; 50 ms. | Création des composants réutilisables React.<br>Gestion du panier POS multi-devises.<br>Intégration du client Socket.IO pour les WebSockets. | NZAKU Z.R.<br>NLANDU M.M. | 0.00 |
| **4** | **Intégration Services IA** | Module LUMO AIO opérationnel.<br>Consommation de tokens DeepSeek fluide via streaming SSE. | Configuration du SDK OpenAI compatible DeepSeek API.<br>Construction des prompts contextuels de base de connaissances.<br>Développement de l'assistant de chat et de suggestions. | NZAKU Z.R. | 100.00 |
| **5** | **Déploiement Cloud & QA** | Application hébergée sur Railway, HTTPS actif, certificats SSL automatisés.<br>Logs de bogues centralisés dans Sentry. | Configuration des builds Nixpacks et des variables d'environnement.<br>Tests unitaires (Jest) et tests d'intégration (Supertest).<br>Configuration du nom de domaine et du CDN d'images. | NZAKU Z.R.<br>NLANDU M.M. | 207.00 |
| **-** | **TOTAL (CASH OPÉRATIONNEL)** | **Opérationnalisation complète du système Cloud** | **-** | **-** | **307.00** |

---

### II.1.2. Chronogramme de réalisation

Le chronogramme de réalisation du projet LUMO est structuré selon une approche itérative et incrémentale inspirée de la méthodologie Agile (Scrum). La durée globale du projet est de 18 semaines (de janvier à mai 2026), découpée en sprints de développement de 2 semaines. Cette planification permet d'éviter l'effet tunnel en livrant régulièrement des modules applicatifs testés et fonctionnels.

**Tableau II.2 : Chronogramme détaillé des livrables de l'application LUMO**

| Phases de Projet | Calendrier (Semaines) | Activités & Tâches Principales | Livrables Applicatifs |
| :--- | :--- | :--- | :--- |
| **1. Étude & Conception** | S1 – S6 (Janv – Fév 2026) | Spécification des besoins des boutiques, élaboration des cas d'utilisation UML, modélisation conceptuelle de la base de données (PostgreSQL ERD). | Cahier des charges validé, diagrammes de classes et de séquence UML validés. Jalon M1 (15 Janvier). |
| **2. Développement Backend** | S5 – S12 (Fév – Mars 2026) | Mise en place de l'API REST Express, écriture des schémas Sequelize, configuration de la base de données PostgreSQL, implémentation de l'authentification JWT. | API REST fonctionnelle avec authentification, base de données PostgreSQL déployée en sandbox. Jalon M2 (28 Février). |
| **3. Développement Frontend** | S9 – S16 (Mars – Avril 2026) | Développement des vues React (POS, Inventaire, Trésorerie, Clients), gestion d'état local via Zustand, intégration Socket.IO pour le temps réel. | Interface utilisateur responsive opérationnelle, console POS connectée au backend. Jalon M3 (30 Avril). |
| **4. Tests & Déploiement** | S13 – S18 (Avril – Mai 2026) | Intégration de l'API DeepSeek AI, configuration du SMTP et de Resend, tests d'intégration automatisés Jest/Supertest, déploiement final sur Railway. | Application LUMO déployée en production sous HTTPS, domaine configuré, documentation technique finale. Jalon M4 (20 Mai). |

---

### II.1.3. Budget prévisionnel et structure Cloud

L'architecture de l'application LUMO repose sur un modèle moderne d'exploitation SaaS (Software as a Service) et de services d'infrastructures Cloud (PaaS). Ce choix technique élimine complètement l'acquisition obsolète de serveurs physiques locaux, de baies de stockage locales ou de routeurs d'infrastructure d'entreprise coûteux à maintenir. La sécurité réseau (SSL/TLS) étant fournie gratuitement par défaut par l'hébergeur cloud Railway, aucun coût n'est alloué aux certificats SSL payants.

Le capital d'investissement matériel local de R&D est évalué à **3 500,00 USD** (Trois mille cinq cents Dollars Américains) pour financer les postes informatiques des ingénieurs et la sécurité électrique locale, tandis que le budget d'exploitation des services cloud est estimé à **41,00 USD / mois** pour 10 commerces en production.

#### Détail des Postes Budgétaires du Capital R&D (3 500,00 USD) :
1. **Matériel & Amortissement local (1 200,00 USD) :** Financement des PC portables professionnels de développement (écrans IPS, processeurs multicoeurs, RAM 16Go) pour les deux ingénieurs développeurs, et acquisition d'onduleurs professionnels de régulation électrique afin de prémunir les stations locales de dev contre les micro-coupures de la SNEL à Kinshasa.
2. **Énergie & Continuité de service R&D (612,31 USD) :** Achat de carburant pour le groupe électrogène de secours local afin de garantir une autonomie énergétique totale pendant les phases intensives de codage de l'application.
3. **Télécommunications & Connectivité (320,00 USD) :** Abonnement Internet haut débit (Liaison dédiée 4G/LTE de secours ou routeur haut débit local) pour assurer le transfert continu des sources Git et l'appel des API Cloud.
4. **Hébergement Cloud Pro, Database & Redis (360,00 USD) :** Provisionnement d'un serveur VPS managé sur **Railway.app** incluant les ressources CPU/RAM requises pour exécuter l'API Node.js, l'instance PostgreSQL managée et le serveur Redis.
5. **Services API, Noms de Domaines & Licences (200,00 USD) :** Budget alloué à l'achat du nom de domaine personnalisé (`lumo.app`), à la consommation de crédits de l'API **DeepSeek AI**, et aux démarches légales d'enregistrement du brevet logiciel en RDC.
6. **Main-d'œuvre et Ingénierie Logicielle (807,69 USD) :** Représente exactement 30% du budget technique global, alloué à la valorisation du travail de programmation et de configuration réseau des ingénieurs.

**Tableau II.3 : Budget d'investissement d'implantation du projet LUMO**

| N° | Poste de dépense | Nature de la dépense / Justification opérationnelle dans le projet | Montant (USD) |
| :--- | :--- | :--- | :---: |
| **I** | **INFRASTRUCTURES, LOGISTIQUE & SERVICES CLOUD** | | |
| 1 | Matériel & Amortissement | Laptops professionnels de développement ingénieurs et onduleurs de régulation local | 1 200,00 |
| 2 | Énergie & Logistique R&D | Autonomie énergétique locale (carburant sprints) contre les délestages électriques | 612,31 |
| 3 | Télécoms & Connectivité | Forfaits Internet haut débit développeurs pour synchronisation Git & Cloud | 320,00 |
| 4 | Hébergement Cloud Pro | Hébergement de production sur Railway.app (Node.js API, PostgreSQL, Redis cache) | 360,00 |
| 5 | Services Web & Cadre Légal | Abonnement tokens DeepSeek AI, domaineName.com, API Resend et dépôt légal RDC | 200,00 |
| **-** | **SOUS-TOTAL (I)** | **Frais d'infrastructures cloud et logistique de développement logiciel** | **2 692,31** |
| **II** | **RESSOURCES HUMAINES** | | |
| 6 | Main-d'œuvre Technique | Développement et codage de l'API backend, du frontend React, de la sécurité et QA (30%) | 807,69 |
| **-** | **TOTAL GÉNÉRAL (I + II)** | **Capital requis pour l'opérationnalisation et le déploiement Cloud complet** | **3 500,00** |

---

## II.2. Méthodologie de recherche et Architecture Applicative

Pour mener à bien notre étude consacrée au développement de l'application de gestion commerciale LUMO, nous avons adopté une méthodologie de recherche en ingénierie logicielle rigoureuse. Cette section décrit en détail les méthodes d'analyse et les techniques logicielles issues de l'étude directe de la base de code source, justifiant chaque choix technologique et de sécurité.

### a) Méthodes appliquées

#### 1. La méthode analytique et d'ingénierie de données (Data Engineering)
Cette méthode a été fondamentale lors de l'étude de la structure du code. Elle a permis de décomposer le traitement des transactions financières complexes de la base de données. Dans LUMO, le problème majeur de la cohérence des ventes et du stock a été résolu en appliquant une isolation multi-tenant stricte par boutique au niveau du backend.

Dans `server/middleware/authMiddleware.js`, l'API extrait de manière sécurisée l'identifiant propriétaire unique à chaque appel HTTP :

```javascript
// Extrait de server/middleware/authMiddleware.js
exports.protect = async (req, res, next) => {
  // 1) Vérifier la présence du token JWT dans l'en-tête Authorization
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: "Veuillez vous connecter pour accéder à cette ressource." });
  }

  try {
    // 2) Valider le token avec le secret JWT du serveur
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3) Charger l'utilisateur depuis la base PostgreSQL
    const user = await User.findByPk(decoded.id);
    if (!user || user.isSuspended) {
      return res.status(401).json({ message: "Utilisateur non autorisé ou compte suspendu." });
    }

    // 4) Déterminer le tenantId pour l'isolation multi-boutique
    req.user = user;
    req.user.tenantId = user.parentId || user.id; // L'admin et ses membres d'équipe partagent le même tenantId
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expirée ou token invalide." });
  }
};
```

Grâce à cette méthode analytique, chaque requête d'écriture ou de lecture en base de données filtre automatiquement les enregistrements par `tenantId`, empêchant une boutique d'accéder aux données d'un concurrent hébergé sur la même instance cloud de la base de données PostgreSQL.

#### 2. La méthode de modélisation UML (Unified Modeling Language)
La modélisation orientée objet a permis de cartographier la structure relationnelle de la base de données PostgreSQL via Sequelize. Le schéma relationnel normalisé en 3NF (Troisième Forme Normale) comprend 12 tables reliées par des clés étrangères avec contraintes d'intégrité en cascade. Cette modélisation garantit la cohérence : par exemple, la table `StockMovement` (mouvements de stock) possède une relation `BelongsTo` avec `Product` et `User`, et la suppression logique d'un produit (Paranoid Delete Sequelize) conserve l'historique des ventes et mouvements pour l'analyse analytique de l'IA.

#### 3. La méthode itérative Agile et DevOps
Le cycle de vie du projet de développement a été structuré autour de sprints agiles de 2 semaines, facilitant la détection de bogues et la validation de chaque module (POS, Trésorerie, IA). Sur le plan DevOps, le pipeline est connecté directement à GitHub. Lors de chaque `git push` sur la branche principale, la plateforme **Railway.app** déclenche un build automatisé basé sur **Nixpacks**, qui compile le code frontend (React/Vite) en fichiers statiques optimisés et démarre l'API Express en mode production avec allocation dynamique de mémoire.

---

### b) Techniques logicielles

#### 1. Technique de persistance transactionnelle ACID (Sequelize + PostgreSQL)
Afin d'assurer la cohérence comptable, l'application applique la technique des transactions Sequelize (`sequelize.transaction()`). Lors de la validation d'une commande dans le Point de Vente (POS), plusieurs écritures critiques doivent s'effectuer en base de données. Si une seule de ces écritures échoue (par exemple, si un produit passe en rupture de stock au même moment), l'ensemble de l'opération est annulé (Rollback) pour éviter les incohérences de trésorerie.

```javascript
// Exemple de transaction dans server/controllers/SaleController.js
exports.createSale = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, montantTotal, devise, tauxChange, methodePaiement, clientId } = req.body;
    const tenantId = req.user.tenantId;

    // 1) Enregistrer la transaction de vente
    const sale = await Sale.create({
      userId: tenantId,
      montantTotal,
      devise,
      tauxChange,
      methodePaiement,
      clientId
    }, { transaction });

    // 2) Parcourir les articles du panier pour décrémenter le stock
    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, userId: tenantId }
      }, { transaction });

      if (!product || product.stock < item.quantite) {
        throw new Error(`Stock insuffisant pour le produit : ${item.nom}`);
      }

      // Décrémenter le stock physique du produit
      product.stock -= item.quantite;
      product.stockUpdateRaison = 'Vente'; // Déclenche le hook de mouvement de stock
      await product.save({ transaction });
    }

    // Commiter la transaction si toutes les étapes réussissent
    await transaction.commit();
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    // Annuler tout en cas d'erreur de stock ou d'écriture BDD
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
};
```

Cette technique transactionnelle garantit qu'aucune vente n'est enregistrée sans la mise à jour correspondante des quantités de stock physiques et l'alimentation de la caisse.

#### 2. Technique de synchronisation temps réel (WebSockets via Socket.IO)
Pour assurer la fluidité et le temps réel du Point de Vente, LUMO utilise le protocole **WebSocket** implémenté avec **Socket.IO**. Contrairement aux requêtes HTTP classiques qui nécessitent un rafraîchissement manuel de la page, le serveur maintient une connexion TCP persistante avec le client. Pour permettre la scalabilité horizontale de l'application (utilisation de plusieurs serveurs en parallèle derrière un répartiteur de charge), un **Redis Adapter** est branché sur le serveur Socket.IO.

Chaque utilisateur connecté rejoint une "chambre" (room) identifiée par son `tenantId` (`socket.join('user_' + tenantId)`). Lorsqu'un caissier valide une vente :
*   Le serveur décrémente les stocks.
*   Si le stock passe sous le seuil d'alerte configuré, le backend émet un événement `stock_alert` ciblant la room du tenant.
*   Le tableau de bord de l'administrateur reçoit instantanément l'alerte et affiche une notification push à l'écran sans solliciter de requête HTTP d'interrogation (polling).

#### 3. Technique d'intégration d'Intelligence Artificielle (API DeepSeek AI)
LUMO intègre l'API DeepSeek Chat pour générer des prévisions commerciales et financières. L'ingénierie de prompt (Prompt Engineering) transmet en contexte un fichier JSON anonymisé contenant l'état des stocks, le top 5 des produits vendus, les dettes des clients et l'historique des transactions récentes du mois en cours. Pour éviter la latence perçue due à la génération de texte par le LLM, les réponses sont diffusées en temps réel au client React via le protocole **Server-Sent Events (SSE)** ou streaming, affichant les mots à l'écran au fur et à mesure de leur traitement côté serveur.

#### 4. Technique de Sécurité et Défense en Profondeur
La sécurité de la plateforme LUMO est structurée selon le principe de défense en profondeur sur plusieurs couches :
*   **Chiffrement des mots de passe :** Hachage asymétrique unidirectionnel par l'algorithme Bcrypt avec un coût de hachage (salt) de 10 rounds, rendant le décryptage par force brute extrêmement long.
*   **Double Authentification (2FA TOTP) :** Configuration TOTP de sécurité. Le backend utilise la librairie `otplib` pour générer un secret cryptographique partagé de 32 caractères encodé en base32. Ce secret est affiché sous forme de QR Code sur l'écran React de l'administrateur via `qrcode`. Le code de vérification à 6 chiffres généré par Google Authenticator est validé côté serveur avec une fenêtre de tolérance de 30 secondes (1 pas).
*   **Sécurisation des sessions JWT :** Génération de jetons d'accès courts (15 min) et de jetons de rafraîchissement (30 jours) stockés dans les cookies du navigateur avec les drapeaux `httpOnly` (bloquant l'accès du JavaScript frontend pour contrer les failles XSS) et `secure` (exigeant HTTPS).
*   **Protection réseau et en-têtes HTTP :** Utilisation de middlewares Express :
    *   `helmet` : Configure de manière sécurisée les en-têtes HTTP pour parer le détournement de clics (clickjacking) et les failles MIME.
    *   `cors` : Restreint les origines de requêtes autorisées à la seule adresse du domaine client de production.
    *   `express-rate-limit` : Limite les tentatives abusives de requêtes sur les routes d'authentification (bloquées à un maximum de 10 requêtes par tranche de 15 minutes par adresse IP).

#### 5. Technique de Sauvegarde Automatisée (Node-Cron & Resend)
Pour assurer la tolérance aux pannes et la maintenance préventive des données, l'application exécute une tâche planifiée automatique via **Node-Cron** côté serveur. Tous les jours à minuit, le script extrait l'ensemble de la base de données PostgreSQL du tenant, la formate dans un fichier JSON compressé et sécurisé, puis l'expédie de manière autonome par e-mail en pièce jointe cryptée à l'administrateur via les serveurs d'API de connectivité de **Resend**.
