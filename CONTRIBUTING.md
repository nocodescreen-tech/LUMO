# Guide de Contribution - LUMO Pro ERP

Bienvenue dans l'équipe de développement de **LUMO Pro** ! Ce document explique comment configurer votre environnement et contribuer proprement au projet.

## 🚀 Installation de l'Environnement

### Pré-requis
- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- **Redis** (optionnel, conseillé pour le cache)
- **Docker** (recommandé pour la production)

### Étapes d'installation
1. **Cloner le repo**
2. **Installation des dépendances à la racine :**
   ```bash
   npm install
   ```
3. **Configuration des variables d'environnement :**
   - Créez un fichier `.env` dans `server/` et `client/` en vous basant sur les fichiers `.env.example`.
4. **Lancement en mode développement :**
   ```bash
   npm run dev
   ```

## 🛠️ Architecture du Projet
- **/client** : Frontend React (Vite + TypeScript).
- **/server** : Backend Node.js (Express + Sequelize).
- **/.github** : Pipelines CI/CD.

## 🌿 Règles de Nommage des Branches
Nous utilisons une convention stricte pour les branches :
- `feature/nom-de-la-feature` : Ajout de fonctionnalité.
- `fix/nom-du-bug` : Correction de bug.
- `refactor/nom-du-changement` : Amélioration du code sans changement fonctionnel.
- `docs/nom-de-la-doc` : Documentation uniquement.

## 🧪 Tests
Avant chaque Pull Request, assurez-vous que les tests passent :
```bash
cd server && npm test
cd ../client && npm run build
```

## 📝 Standards de Code
- **Commits** : Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/).
- **Linting** : Le code doit respecter les règles ESLint configurées.
- **Documentation** : Documentez chaque nouvel endpoint API via les commentaires **Swagger** dans les fichiers de routes.

## 🔒 Sécurité
- Ne committez JAMAIS de fichiers `.env` ou `firebase-service-account.json`.
- Si vous trouvez une faille, contactez l'administrateur avant d'ouvrir une issue publique.

---
*L'équipe LUMO Pro.*
