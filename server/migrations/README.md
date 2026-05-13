# Migrations Sequelize

## ⚠️ État actuel : `sequelize.sync({ alter: true })` en développement

Le projet utilise actuellement `sequelize.sync({ alter: true })` dans `config/database.js`.

### Risques en production
- `alter: true` peut **supprimer des colonnes** si le modèle change
- `force: true` **recrée les tables** → perte de données garantie
- Non reproductible / non versionnable

### Plan de migration recommandé pour la production

1. **Générer les migrations** depuis l'état actuel des modèles :
   ```bash
   npx sequelize-cli model:generate  # Pour chaque modèle
   npx sequelize-cli migration:generate --name initial-schema
   ```

2. **Remplacer** `sequelize.sync()` par `sequelize-cli db:migrate` dans le pipeline CI/CD

3. **Commande de migration** :
   ```bash
   npx sequelize-cli db:migrate         # Appliquer
   npx sequelize-cli db:migrate:undo    # Rollback
   ```

### Configuration actuelle (développement uniquement)
```js
// config/database.js — NE PAS utiliser { force: true } ou { alter: true } en prod
await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
```

> **Action requise avant le déploiement** : créer les fichiers de migration Sequelize CLI pour chaque modèle (User, Product, Sale, Client, Fournisseur, Depense, Purchase, Notification, Activite, StockMovement).
