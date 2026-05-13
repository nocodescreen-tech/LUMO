# CHAPITRE DEUXIÈME : APPROCHE SOLUTIONNELLE

## 2.1. Planification du projet

### 1. Informations Générales du Projet
*   **Nom de l'application :** LUMO
*   **Type d'application :** Système ERP (Enterprise Resource Planning) & POS (Point of Sale) basé sur le Cloud (SaaS).
*   **Description courte :** LUMO est une plateforme unifiée et intelligente de gestion d'entreprise. Elle intègre de manière transparente les ventes (POS), la gestion complète des stocks, la facturation, le CRM (gestion de la relation client), et la trésorerie multi-devises, le tout propulsé par une Intelligence Artificielle intégrée pour automatiser les analyses et optimiser la prise de décision.
*   **Période de réalisation :** Janvier 2026 à Mai 2026.
*   **Équipe de réalisation :**
    *   *Chef de Projet & Développeur Full-Stack Lead :* René Nzaku
    *   *Analyste Système, Base de données & DevOps :* René Nzaku
    *   *Intégration IA & Ingénierie Qualité :* Équipe technique de support
*   **Budget estimatif (Fonctionnement & Infrastructure) :** ~150 $ USD (Hors valorisation du temps-homme).

---

### 2.1.1. Cadre logique (Tableau 2-1)

*(Note : La colonne "Valorisation" représente la valeur estimée du "Temps-Homme" pour chaque phase, illustrant le coût immatériel du développement logiciel).*

| Objectifs Spécifiques (OI) | Résultats attendus | Activités principales | Indicateurs objectivement vérifiables | Responsable | Valorisation (Temps-Homme) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OI-1 : Analyse et Modélisation du système** | Cahier des charges et diagrammes UML validés | - Recueil des besoins métiers<br>- Création des diagrammes UML<br>- Maquettage UI/UX (Figma) | Documents de spécifications produits finalisés, Maquettes validées | Chef de Projet | 500 $ |
| **OI-2 : Conception de la Base de Données (PostgreSQL)** | Base de données relationnelle optimisée, robuste et sécurisée | - Schématisation entité-association<br>- Scripts de migration Sequelize<br>- Implémentation de l'intégrité référentielle | BDD déployée en local et schéma validé (plus de 12 tables créées) | Dev Backend | 600 $ |
| **OI-3 : Développement de l'API Backend RESTful** | Core API opérationnelle, modulaire et sécurisée | - Dev des routes & contrôleurs (Auth, Stock, Ventes)<br>- Sécurisation (JWT, RBAC) | API testée avec Postman (100% de routes répondant correctement) | Dev Backend | 1 200 $ |
| **OI-4 : Développement de l'Interface Frontend (React)** | Application web réactive, multi-thème, ergonomique et intuitive | - Intégration React/TypeScript<br>- Consommation de l'API<br>- Module POS & Dashboards interactifs | Interface fluide (Light/Dark mode) connectée aux données réelles en direct | Dev Frontend | 1 500 $ |
| **OI-5 : Intégration IA (DeepSeek) et Déploiement** | Assistant IA fonctionnel et plateforme accessible en production | - Intégration API DeepSeek<br>- Hébergement Cloud (Railway, Vercel)<br>- Tests d'acceptation utilisateur (UAT) | Assistant IA pertinent aux requêtes métiers, Application en ligne et stable | Lead Dev | 700 $ |

---

### 2.1.2. Chronogramme (Tableau 2-2)

| Activités / Tâches du projet | Janvier 2026 | Février 2026 | Mars 2026 | Avril 2026 | Mai 2026 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| 1. Analyse des besoins et rédaction des spécifications | XX | | | | |
| 2. Modélisation UML, UI/UX et Architecture logicielle | XX | X | | | |
| 3. Configuration et paramétrage de la BDD PostgreSQL | | XX | | | |
| 4. Développement de l'API Backend (Node.js/Express) | | XX | XX | | |
| 5. Développement Frontend (React/TS) et du module POS | | | XX | XX | |
| 6. Intégration du moteur d'IA (DeepSeek) | | | | XX | X |
| 7. Tests d'intégration, assurance qualité et débuggage | | | | X | XX |
| 8. Déploiement Cloud (CI/CD) et Mise en production | | | | | XX |

*(Note : Dans ce tableau, chaque "X" représente environ deux semaines d'effort de travail continu)*

---

### 2.1.3. Budget estimatif et Services Tiers (Infrastructure)

Pour la réalisation physique, les tests et le déploiement en production de l'application LUMO, un budget d'infrastructure a été strictement établi. Il se concentre exclusivement sur les dépenses opérationnelles directes et les services cloud (SaaS/PaaS) utilisés, distinct de la main d'œuvre.

**Tableau 2-3 : Coût des services et de l'infrastructure Cloud**
*(Taux de change moyen appliqué : 1$ USD = 2 250 CDF)*

| Rubrique / Service Cloud | Rôle dans l'architecture du projet | Coût estimé |
| :--- | :--- | :--- |
| **Railway (Cloud Platform)** | Plateforme PaaS pour l'hébergement continu du serveur Backend (Node.js) et le provisionnement de la base de données PostgreSQL en production. | ~ 20 $ USD |
| **DeepSeek API** | Modèle de langage (LLM) propulsant l'assistant IA intégré de LUMO, responsable de l'analyse métier et du traitement du langage naturel (NLP). | ~ 20 $ USD |
| **Connexion Internet (Data)** | Forfait mobile pour les phases de recherche, développement, et tests. (Consommation : 4 GB = 3 000 FC, renouvelé 3 à 4 fois par semaine). | ~ 107 $ USD *(soit ~240 000 CDF sur 5 mois)* |
| **Cloudinary** | CDN (Content Delivery Network) optimisé pour le stockage, le redimensionnement à la volée et la distribution des images (produits, avatars). | **Gratuit** (Free Tier) |
| **Firebase (Google)** | Utilisé pour la gestion des services tiers annexes et les communications temps-réel si applicable. | **Gratuit** (Free Tier) |
| **Vercel / Netlify** | Hébergement statique avec Edge Network, optimisé pour la distribution ultra-rapide de l'application Frontend React (Single Page Application). | **Gratuit** (Free Tier) |
| **GitHub** | Dépôt central pour l'hébergement du code source, la gestion des versions (Git) et l'intégration continue (CI/CD). | **Gratuit** (Free Tier) |
| **Total Estimé** | Dépenses opérationnelles directes (hors main d'œuvre) pour toute la durée de réalisation. | **~ 147 $ USD** |

---

## 2.2. Méthodologie de recherche

### 2.2.1. Méthodes

**a) Méthode de développement : Agile (Incrémentale et Itérative)**
Afin d'assurer une livraison continue de valeur et de s'adapter rapidement aux éventuels changements de cahier des charges, la méthode Agile a été choisie. Le développement a été organisé en **5 Sprints** principaux :
*   **Sprint 1 (Fondations & Sécurité) :** Paramétrage de l'environnement, conception de la BDD PostgreSQL, mise en place de l'API Node.js, authentification sécurisée (JWT) et hiérarchie des rôles.
*   **Sprint 2 (Noyau Métier - Core) :** Réalisation du module central de Point de Vente (POS), de la gestion complète du catalogue (Produits, Catégories, Variantes) et du moteur d'inventaire.
*   **Sprint 3 (Finance & CRM) :** Développement du module de Trésorerie multi-devises (sessions de caisse, entrées/sorties), annuaire des clients (CRM), et suivi rigoureux des créances et dettes.
*   **Sprint 4 (Intelligence Artificielle & UI) :** Intégration de l'IA (API DeepSeek) pour les recommandations métiers et le Dashboard analytique. Finalisation du design system UI/UX.
*   **Sprint 5 (Assurance Qualité & Lancement) :** Campagne de tests exhaustifs, correction des anomalies (bug tracking), optimisation des performances, et déploiement cloud final.

**b) Méthode de modélisation : UML (Unified Modeling Language)**
L'UML a servi de langage standard pour schématiser l'architecture logicielle avant toute écriture de code.
*   **Rôles définis (Acteurs système) :** SuperAdmin (supervision globale SaaS), Admin/Tenant (propriétaire de l'entreprise), Manager (superviseur des opérations), Caissier/Vendeur (opérateur point de vente).
*   **Cas d'utilisation :** Le système couvre environ 25 cas d'utilisation majeurs.
*   **Diagrammes exploités :**
    *   *Diagramme de Cas d'utilisation :* Identification des droits d'accès et des interactions entre les différents acteurs et les modules du système LUMO.
    *   *Diagramme de Classes :* Structuration statique des objets du domaine (User, Product, Sale, CashSession) et modélisation de leurs associations.
    *   *Diagramme de Séquence :* Illustration de la dynamique temporelle (ex: processus d'authentification ou flux de validation d'une vente POS avec ajustement de stock).
    *   *Diagramme d'Activités :* Modélisation de la logique métier complexe, telle que le processus strict d'ouverture et de clôture d'une session de caisse avec vérification des écarts.

**c) Méthode de conception de base de données**
L'approche choisie est strictement relationnelle, garantissant la fiabilité absolue des données financières et d'inventaire.
*   **Pourquoi PostgreSQL ?** Ce SGBD a été privilégié pour sa conformité totale aux propriétés ACID (Atomicité, Cohérence, Isolation, Durabilité), essentielle pour les transactions financières. De plus, son support natif supérieur du type de données `JSONB` permet de stocker les préférences utilisateur, les configurations d'entreprise (taux de change, devises) et les métadonnées de l'IA sans complexifier le schéma relationnel avec d'innombrables tables de configuration.

#### Les Modèles de données (Sequelize - 12 entités majeures)
1.  **User :** Entité centrale gérant l'identité, l'authentification et l'autorisation. Elle englobe les Admins (propriétaires) et leurs sous-utilisateurs (équipe). Contient un champ JSONB pour les permissions modulaires.
2.  **Product :** Gère le référentiel des articles, incluant le code-barres, les prix d'achat/vente, les seuils d'alerte pour le stock minimum et les liens CDN Cloudinary.
3.  **Category :** Classification hiérarchique des produits pour une ergonomie optimale lors de la navigation dans le POS.
4.  **Sale :** Entité transactionnelle enregistrant chaque vente validée, horodatée, avec son total calculé, le statut du paiement, et la devise utilisée au moment de la transaction.
5.  **SaleItem (Entité de liaison N:N) :** Relie de manière immuable une Vente (Sale) à ses Produits, figeant la quantité vendue, la remise appliquée et le prix unitaire pour garantir la pérennité de l'historique comptable.
6.  **Client :** Module CRM enregistrant les données de contact des acheteurs et permettant le traçage de leurs habitudes de consommation.
7.  **Fournisseur :** Module SRM consignant les partenaires commerciaux assurant le réapprovisionnement de la boutique.
8.  **Purchase (Achat/Approvisionnement) :** Enregistre les réceptions de marchandises, mettant à jour le stock et créant potentiellement une dette fournisseur.
9.  **CashSession :** Modèle vital de Trésorerie qui encadre le travail d'un caissier. Il enregistre le fond de caisse initial, trace toutes les ventes du shift, et calcule l'écart lors de la clôture physique.
10. **Depense :** Suivi des flux sortants opérationnels (loyers, factures électricité, salaires journaliers) rattachés à une session de caisse spécifique.
11. **Dette :** Entité gérant le crédit. Elle suit les montants restant à percevoir des clients ou à payer aux fournisseurs, avec un historique d'amortissement.
12. **Activity :** Journal d'audit (Logs de traçabilité) enregistrant chaque manipulation critique effectuée dans LUMO pour garantir la transparence totale envers l'Admin.

*(Relations systémiques clés : 1 Admin possède N Produits (1:N) ; 1 Vente contient N SaleItems (1:N) ; 1 Produit apparaît dans N SaleItems (1:N) ; 1 Admin supervise N Utilisateurs de l'équipe (1:N).)*

---

### 2.2.2. Techniques et Outils

#### Stack Technologique (Architecture MERN / PERN Moderne)

**Backend & Serveur de Base de données :**
*   **Node.js (v20+) :** Environnement d'exécution JavaScript côté serveur. Choisi pour son architecture événementielle non bloquante, idéale pour concevoir des API REST hautement performantes capables de gérer de multiples transactions simultanées.
*   **Express.js (v4.x) :** Framework de routage minimaliste et flexible, utilisé pour orchestrer les endpoints de l'API, appliquer les middlewares de sécurité (CORS, Helmet) et gérer les requêtes HTTP.
*   **PostgreSQL (v15+) :** SGBD relationnel open-source le plus avancé, garantissant l'intégrité absolue des données financières de LUMO.
*   **Sequelize (v6.x) :** ORM (Object-Relational Mapping) agissant comme pont entre Node.js et PostgreSQL. Il simplifie les requêtes complexes, gère automatiquement les migrations de schéma et protège contre les failles d'injection SQL.

**Frontend & Interface Utilisateur :**
*   **React (v18) couplé à TypeScript :** Bibliothèque JavaScript de pointe pour le rendu UI. L'utilisation stricte de TypeScript a permis de réduire drastiquement les bugs en phase de développement grâce à un typage fort de toutes les données (ex: modèles de produits, réponses d'API).
*   **Vite.js :** Outil de build nouvelle génération remplaçant Webpack, offrant un démarrage du serveur de développement quasi-instantané et un rechargement à chaud ultra-rapide (HMR).

**Principales Dépendances & Écosystème (NPM) :**
*   *Sécurité & Cryptographie :* `jsonwebtoken` (Création de jetons d'accès), `bcryptjs` (Hachage asymétrique des mots de passe).
*   *Interface & Expérience Utilisateur (UI/UX) :* `framer-motion` (Orchestration des micro-animations de l'interface), `lucide-react` (Bibliothèque d'icônes vectorielles légères et modernes), `sonner` (Composant toast de notification non intrusif).
*   *Communication & État :* `axios` (Client HTTP typé avec intercepteurs pour l'injection du token), `zustand` (Gestionnaire d'état global minimaliste pour le stockage de la session et des préférences utilisateur).

---

### 2.3. Architecture Technique et Sécurité de LUMO

**1. Architecture Globale :**
*   **REST API Découplée :** La plateforme adopte une architecture où le Frontend (Client React) et le Backend (Serveur Node) sont deux applications physiquement séparées. Ils ne communiquent qu'au travers de requêtes réseau (HTTP/JSON), ce qui permet une scalabilité indépendante.
*   **Pattern MVC-like (Modèle-Route-Contrôleur) :** Côté serveur, la logique est rigoureusement segmentée. Les `Routes` interceptent la requête, le `Controller` applique les règles métier complexes, et le `Model` valide et persiste la donnée en BDD.

**2. Couches de Sécurité Implémentées :**
*   **Authentification Stateless (JWT) :** Après vérification des identifiants, un jeton crypté (JWT) est délivré au client. Ce jeton est exigé pour chaque requête API sécurisée via l'en-tête `Authorization: Bearer <token>`.
*   **Bcrypt :** Le stockage des mots de passe est sécurisé par un algorithme de hachage unidirectionnel `bcrypt` couplé à un "salt" généré aléatoirement.
*   **RBAC (Role-Based Access Control) :** Une gestion des droits stricte est en place via le middleware `authorize(...)`. Un Caissier ne peut pas interroger les endpoints analytiques ou modifier les privilèges, action réservée exclusivement à l'Admin.
*   **Protection API :** Mise en œuvre de `CORS` (Cross-Origin Resource Sharing) pour que l'API ne réponde qu'au domaine officiel du frontend, empêchant l'exploitation par des scripts tiers.

**3. Infrastructure Avancée et Standardisation :**
*   **Moteur Multi-Devises Dynamique :** LUMO gère nativement la coexistence du Franc Congolais (CDF) et du Dollar Américain (USD). Le taux de change, configurable par l'Admin, est utilisé en temps réel dans les interfaces de caisse et les rapports statistiques.
*   **Configuration centralisée via JSONB :** Les éléments volatiles (thème visuel, paramètres linguistiques, métadonnées spécifiques à la boutique) sont stockés sans rigidité structurelle grâce à PostgreSQL JSONB.

**4. Rôle de l'Intelligence Artificielle (DeepSeek) :**
LUMO n'est pas qu'un outil de saisie ; il intègre une surcouche algorithmique. Connecté à l'API de DeepSeek, l'assistant IA offre :
*   Des analyses sémantiques de la performance de vente.
*   L'identification de tendances (produits stars, ralentissements).
*   Une assistance contextuelle directe à l'utilisateur sous forme de chat conversationnel intégré à l'ERP.

---

### 2.4. Modules et Fonctionnalités Clés de LUMO

1.  **Point de Vente Connecté (POS) :** Interface de vente au comptoir ultra-réactive. Intègre la lecture de codes-barres, le calcul automatique de la monnaie à rendre multi-devises, la gestion des remises panier, et la génération de tickets de caisse numériques ou imprimables.
2.  **Gestion Intelligente du Catalogue :** Référencement des produits par catégories, gestion des variantes de prix, téléchargement d'images sur Cloudinary, et génération automatique de SKU.
3.  **Contrôle des Stocks (Inventaire) :** Suivi en temps réel de l'état des entrepôts. Génération d'alertes visuelles lorsque le seuil critique (Stock Minimum) est atteint.
4.  **Module de Trésorerie (Caisse) :** Suivi strict des sessions (Shifts). Chaque employé ouvre sa caisse avec un fond initial, enregistre ses opérations, et clôture en justifiant le solde physique, calculant instantanément le déficit ou l'excédent.
5.  **Dettes, Créances & Dépenses :** Système comptable annexe permettant d'accorder du crédit aux clients fidèles, de planifier le paiement des fournisseurs, et de déduire les frais opérationnels (transport, loyer) du chiffre d'affaires journalier.
6.  **CRM & SRM :** Centralisation des profils clients (Customer Relationship Management) et fournisseurs (Supplier Relationship Management) avec historique financier complet rattaché à chaque profil.
7.  **Dashboards Analytiques :** Tableaux de bord riches en graphiques interactifs affichant la santé financière (Chiffre d'Affaires brut, bénéfices nets, volumétrie des ventes).
8.  **Gestion d'Équipe Centralisée :** Interface de création de profils collaborateurs (Superviseurs, Caissiers) incluant une matrice d'affectation des permissions (ex: blocage/autorisation d'accès au module Trésorerie).
9.  **Journal d'Audit (Logs) :** Traçabilité indélébile de toutes les suppressions, modifications ou connexions effectuées sur la plateforme pour une sécurité maximale.
