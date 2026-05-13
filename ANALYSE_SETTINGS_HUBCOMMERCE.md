# Analyse Complète des Paramètres de Settings - HubCommerce Pro

## Table des Matières
1. [Introduction](#introduction)
2. [Architecture Actuelle](#architecture-actuelle)
3. [Fonctionnalités Existantes](#fonctionnalités-existantes)
4. [Problèmes et Lacunes](#problèmes-et-lacunes)
5. [Fonctionnalités Manquantes](#fonctionnalités-manquantes)
6. [Architecture Optimisée](#architecture-optimisée)
7. [Plan d'Implémentation](#plan-dimplémentation)
8. [Recommandations Techniques](#recommandations-techniques)

## Introduction

Cette analyse complète examine les paramètres et fonctionnalités des settings dans HubCommerce Pro, identifie les lacunes et propose une architecture optimisée pour améliorer la gestion des configurations.

## Architecture Actuelle

### Frontend

**Fichier principal** : `client/src/pages/Settings.tsx` (1344 lignes)

**Structure actuelle** :
- Utilise `useSettingsStore.ts` (Zustand) avec persistance localStorage
- 6 onglets principaux :
  1. Profil (Utilisateur & Enseigne)
  2. Interface (Thème, Langue)
  3. Modules & IA
  4. Équipe & Permissions
  5. Sécurité (2FA, Mot de passe)
  6. Sauvegarde & Restauration

**Store Zustand** :
```typescript
// client/src/store/useSettingsStore.ts
interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en' | 'ln' | 'sw';
  currency: 'CDF' | 'USD';
  showModulePOS: boolean;
  showModuleProducts: boolean;
  showModuleClients: boolean;
  showModuleFournisseurs: boolean;
  showModulePurchases: boolean;
  showModuleSales: boolean;
  showModuleExpenses: boolean;
  showModuleDettes: boolean;
  showModuleStats: boolean;
  showModuleActivities: boolean;
  showModuleNotifications: boolean;
  showModuleSettings: boolean;
  showModuleSuperAdmin: boolean;
  exchangeRate: number;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'fr' | 'en' | 'ln' | 'sw') => void;
  setCurrency: (currency: 'CDF' | 'USD') => void;
  toggleModule: (module: string) => void;
  setExchangeRate: (rate: number) => void;
}
```

### Backend

**Modèle GlobalSetting** :
```javascript
// server/models/globalsetting.js
module.exports = (sequelize, DataTypes) => {
  const GlobalSetting = sequelize.define('GlobalSetting', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    }
  });
  return GlobalSetting;
};
```

**Contrôleurs** :
- `superAdminController.js` : Gère les settings globaux
- `authController.js` : Met à jour les préférences utilisateur

## Fonctionnalités Existantes

### ✅ Gestion du Profil
- Informations utilisateur (nom, email, téléphone)
- Informations entreprise (nom, logo, adresse)
- Photo de profil

### ✅ Préférences d'Interface
- Thème (clair, sombre, système)
- Langue (FR, EN, LN, SW)
- Devise (CDF, USD)
- Taux de change USD/CDF

### ✅ Gestion des Modules
- Activation/désactivation des modules
- 14 modules configurables
- Interface visuelle avec bascules

### ✅ Gestion d'Équipe
- Ajout/modification/suppression d'utilisateurs
- Rôles avec permissions granulaires
- 10 permissions différentes

### ✅ Sécurité
- Authentication 2FA
- Changement de mot de passe
- Journal des activités

### ✅ Sauvegarde & Restauration
- Sauvegarde manuelle de la base de données
- Restauration à partir de fichier
- Notifications de sauvegarde

## Problèmes et Lacunes

### 1. Architecture Fragmentée
**Problème** : Les données sont dispersées entre :
- `localStorage` (préférences d'interface)
- Table `Users` (profil utilisateur)
- Table `GlobalSetting` (paramètres système)
- Pas de source unique de vérité

**Impact** :
- Difficile à synchroniser
- Risque d'inconsistance
- Complexité accrue pour la maintenance

### 2. Absence de Validation
**Problème** :
- Aucune validation côté serveur des paramètres
- Les valeurs sont stockées directement sans contrôle
- Risque d'injection de données invalides

**Exemple problématique** :
```javascript
// Actuellement dans le contrôleur
await GlobalSetting.update({ value: req.body.value }, { where: { key: req.body.key } });
// Aucune validation de req.body.value
```

### 3. Pas de Versioning
**Problème** :
- Impossible de revenir à une configuration précédente
- Pas d'historique des changements
- Risque de perte de configuration

### 4. Interface Complexe
**Problème** :
- 1344 lignes dans un seul fichier (Settings.tsx)
- Difficile à maintenir
- Pas de composants réutilisables
- Performances impactées

### 5. Manque de Recherche
**Problème** :
- Impossible de trouver rapidement un paramètre
- Pas de filtres par catégorie
- Expérience utilisateur médiocre

## Fonctionnalités Manquantes

### 1. Paramètres de Notification
**À ajouter** :
- Canaux de notification (Email, SMS, Webhook)
- Règles de déclenchement
- Templates personnalisables
- Fréquence et horaires

**Exemple de structure** :
```typescript
interface NotificationSettings {
  channels: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
  triggers: {
    lowStock: boolean;
    newSale: boolean;
    paymentReceived: boolean;
    dailySummary: boolean;
  };
  schedules: {
    dailySummaryTime: string; // "08:00"
    weeklyReportDay: number; // 0-6 (Sunday-Saturday)
  };
  templates: {
    email: {
      subject: string;
      body: string;
    };
    sms: string;
  };
}
```

### 2. Configurations Financières
**À ajouter** :
- Paramètres de facturation
- Gestion des taxes (TVA, autres)
- Méthodes de paiement
- Conditions de paiement

**Structure proposée** :
```typescript
interface FinancialSettings {
  invoicing: {
    prefix: string;
    nextNumber: number;
    footerText: string;
    termsAndConditions: string;
  };
  taxes: Array<{
    name: string;
    rate: number;
    isDefault: boolean;
    isCompound: boolean;
  }>;
  paymentMethods: Array<{
    id: string;
    name: string;
    isActive: boolean;
    instructions: string;
  }>;
  paymentTerms: Array<{
    id: string;
    name: string; // "Net 30", "Due on receipt"
    days: number;
  }>;
}
```

### 3. Paramètres d'Impression
**À ajouter** :
- Templates de tickets/factures
- Configuration des imprimantes
- Options de formatage

**Structure** :
```typescript
interface PrintSettings {
  receipt: {
    template: 'default' | 'compact' | 'detailed';
    showLogo: boolean;
    showBarcode: boolean;
    showTaxBreakdown: boolean;
    footerMessage: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  invoice: {
    template: 'default' | 'modern' | 'classic';
    showPaymentTerms: boolean;
    showDueDate: boolean;
    showBankDetails: boolean;
  };
  printers: Array<{
    id: string;
    name: string;
    type: 'receipt' | 'invoice' | 'label';
    isDefault: boolean;
    ipAddress?: string;
    printSize?: string; // "58mm", "80mm", "A4"
  }>;
}
```

### 4. Gestion des Limites
**À ajouter** :
- Quotas utilisateurs
- Limites de stock
- Seuil d'alertes

**Structure** :
```typescript
interface LimitSettings {
  userQuotas: {
    maxProductsPerUser: number;
    maxSalesPerDay: number;
    maxUploadSize: string; // "5MB"
  };
  inventory: {
    lowStockThreshold: number;
    criticalStockThreshold: number;
    reorderQuantity: number;
  };
  sales: {
    maxDiscountPercentage: number;
    minSaleAmount: number;
    creditLimit: number;
  };
}
```

### 5. Intégrations Tierces
**À ajouter** :
- Gestion des API keys
- Configuration des webhooks
- Services externes

**Structure** :
```typescript
interface IntegrationSettings {
  apiKeys: Array<{
    service: string; // "Stripe", "PayPal", "Twilio"
    key: string;
    isActive: boolean;
    lastUsed: Date;
  }>;
  webhooks: Array<{
    url: string;
    events: string[]; // ["sale.created", "inventory.low"]
    isActive: boolean;
    secret: string;
  }>;
  services: {
    payment: {
      stripe: { enabled: boolean; publishableKey: string; };
      paypal: { enabled: boolean; clientId: string; };
    };
    sms: {
      twilio: { enabled: boolean; accountSid: string; authToken: string; fromNumber: string; };
    };
    shipping: {
      // Configuration des services de livraison
    };
  };
}
```

### 6. Audit et Historique
**À ajouter** :
- Journal des changements
- Comparaison de versions
- Restauration de versions

**Structure de base de données** :
```javascript
// Nouveau modèle SettingHistory
module.exports = (sequelize, DataTypes) => {
  const SettingHistory = sequelize.define('SettingHistory', {
    settingId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    oldValue: {
      type: DataTypes.TEXT
    },
    newValue: {
      type: DataTypes.TEXT
    },
    changedBy: {
      type: DataTypes.INTEGER // User ID
    },
    changeReason: {
      type: DataTypes.TEXT
    },
    version: {
      type: DataTypes.INTEGER
    }
  }, {
    timestamps: true
  });
  return SettingHistory;
};
```

### 7. Environnements Multiples
**À ajouter** :
- Configuration par environnement
- Variables d'environnement
- Basculer entre environnements

**Structure** :
```typescript
interface EnvironmentSettings {
  currentEnvironment: 'development' | 'staging' | 'production';
  environments: {
    development: {
      apiBaseUrl: string;
      debugMode: boolean;
      mockData: boolean;
    };
    staging: {
      apiBaseUrl: string;
      debugMode: boolean;
    };
    production: {
      apiBaseUrl: string;
      debugMode: boolean;
    };
  };
  featureFlags: {
    newPOSInterface: boolean;
    aiRecommendations: boolean;
    advancedAnalytics: boolean;
  };
}
```

## Architecture Optimisée

### Nouveau Modèle de Données

**Modèle Setting unifié** :
```javascript
// server/models/setting.js
module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSONB, // Stockage flexible
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('system', 'user', 'shop', 'module'),
      allowNull: false
    },
    scope: {
      type: DataTypes.ENUM('global', 'user', 'shop'),
      defaultValue: 'global'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    description: {
      type: DataTypes.TEXT
    },
    validationRules: {
      type: DataTypes.JSONB // Règles de validation
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['key'] },
      { fields: ['type'] },
      { fields: ['scope'] },
      { fields: ['userId'] },
      { fields: ['shopId'] }
    ]
  });

  Setting.associate = (models) => {
    Setting.belongsTo(models.User, { foreignKey: 'userId' });
    Setting.belongsTo(models.Shop, { foreignKey: 'shopId' });
    Setting.hasMany(models.SettingHistory, { foreignKey: 'settingId' });
  };

  return Setting;
};
```

### Service de Settings

**Nouveau service centralisé** :
```javascript
// server/services/settingService.js
const { Setting, SettingHistory, User } = require('../models');
const Joi = require('joi');

class SettingService {
  // Schémas de validation
  static schemas = {
    theme: Joi.string().valid('light', 'dark', 'system'),
    language: Joi.string().valid('fr', 'en', 'ln', 'sw'),
    currency: Joi.string().valid('CDF', 'USD'),
    exchangeRate: Joi.number().min(0.0001).max(10000),
    email: Joi.string().email(),
    // Ajouter d'autres schémas...
  };

  // Récupérer un setting avec validation
  static async get(key, scope = 'global', userId = null, shopId = null) {
    const setting = await Setting.findOne({ where: { key, scope, userId, shopId, isActive: true } });
    return setting ? setting.value : null;
  }

  // Mettre à jour un setting avec validation et historique
  static async update(key, value, options = {}) {
    const { scope = 'global', userId = null, shopId = null, changedBy = null, reason = '' } = options;

    // Validation
    const schema = this.schemas[key];
    if (schema) {
      const { error } = schema.validate(value);
      if (error) {
        throw new Error(`Validation failed for ${key}: ${error.message}`);
      }
    }

    // Récupérer le setting actuel
    const existingSetting = await Setting.findOne({ where: { key, scope, userId, shopId } });

    // Créer ou mettre à jour
    let setting;
    if (existingSetting) {
      // Sauvegarder dans l'historique
      await SettingHistory.create({
        settingId: existingSetting.id,
        key: existingSetting.key,
        oldValue: JSON.stringify(existingSetting.value),
        newValue: JSON.stringify(value),
        changedBy,
        changeReason: reason
      });

      // Mettre à jour
      setting = await existingSetting.update({
        value,
        version: existingSetting.version + 1
      });
    } else {
      setting = await Setting.create({
        key,
        value,
        type: this._inferType(key),
        scope,
        userId,
        shopId,
        version: 1
      });
    }

    return setting;
  }

  // Récupérer tous les settings pour un scope
  static async getAll(scope = 'global', userId = null, shopId = null) {
    const settings = await Setting.findAll({ where: { scope, userId, shopId, isActive: true } });
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  // Restaurer une version précédente
  static async restore(key, version, scope = 'global', userId = null, shopId = null) {
    const history = await SettingHistory.findOne({
      where: { key, version },
      order: [['createdAt', 'DESC']]
    });

    if (!history) {
      throw new Error('Version not found');
    }

    return this.update(key, JSON.parse(history.oldValue), {
      scope,
      userId,
      shopId,
      changedBy: history.changedBy,
      reason: `Restore to version ${version}`
    });
  }

  // Inférer le type à partir de la clé
  static _inferType(key) {
    const typeMap = {
      'theme': 'user',
      'language': 'user',
      'currency': 'shop',
      'exchangeRate': 'shop',
      'module.': 'module'
    };

    for (const [pattern, type] of Object.entries(typeMap)) {
      if (key.startsWith(pattern)) {
        return type;
      }
    }

    return key.includes('user.') ? 'user' : 'system';
  }
}

module.exports = SettingService;
```

### Nouveau Contrôleur

```javascript
// server/controllers/settingController.js
const express = require('express');
const router = express.Router();
const SettingService = require('../services/settingService');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Récupérer un setting spécifique
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const value = await SettingService.get(key, req.query.scope, req.user.id, req.user.shopId);
    res.json({ success: true, key, value });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Récupérer tous les settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await SettingService.getAll(req.query.scope, req.user.id, req.user.shopId);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mettre à jour un setting
router.put('/:key', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, reason } = req.body;
    
    const setting = await SettingService.update(key, value, {
      scope: req.body.scope || 'global',
      userId: req.user.id,
      shopId: req.user.shopId,
      changedBy: req.user.id,
      reason: reason || `Updated via API by ${req.user.email}`
    });

    res.json({ success: true, setting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mettre à jour plusieurs settings
router.put('/', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
  try {
    const { updates, reason } = req.body;
    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      const result = await SettingService.update(key, value, {
        scope: req.body.scope || 'global',
        userId: req.user.id,
        shopId: req.user.shopId,
        changedBy: req.user.id,
        reason: reason || `Bulk update via API by ${req.user.email}`
      });
      results.push(result);
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Restaurer une version précédente
router.post('/:key/restore/:version', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
  try {
    const { key, version } = req.params;
    const setting = await SettingService.restore(key, parseInt(version), req.query.scope, req.user.id, req.user.shopId);
    res.json({ success: true, setting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Récupérer l'historique d'un setting
router.get('/:key/history', authenticateToken, checkPermission('view_settings'), async (req, res) => {
  try {
    const { key } = req.params;
    const history = await SettingHistory.findAll({
      where: { key },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    res.json({ success: true, history });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Rechercher des settings
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, type, scope } = req.query;
    const where = {};

    if (q) {
      where.key = { [Op.iLike]: `%${q}%` };
    }

    if (type) {
      where.type = type;
    }

    if (scope) {
      where.scope = scope;
    }

    if (req.user.shopId) {
      where.shopId = req.user.shopId;
    }

    const settings = await Setting.findAll({ where });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### Frontend - SettingsProvider

```typescript
// client/src/context/SettingsProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api/axios';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SettingsContextType {
  settings: Record<string, any>;
  loading: boolean;
  error: Error | null;
  updateSetting: (key: string, value: any, options?: { scope?: string; reason?: string }) => Promise<void>;
  updateSettings: (updates: Record<string, any>, options?: { scope?: string; reason?: string }) => Promise<void>;
  restoreSetting: (key: string, version: number) => Promise<void>;
  getSettingHistory: (key: string) => Promise<Array<any>>;
  searchSettings: (query: string) => Promise<Array<any>>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [localSettings, setLocalSettings] = useLocalStorage('appSettings', {});

  // Charger les settings au démarrage
  useEffect(() => {
    if (user) {
      refreshSettings();
    }
  }, [user]);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // D'abord charger depuis le serveur
      const response = await api.get('/api/settings', {
        params: { scope: user?.role === 'superadmin' ? 'global' : 'shop' }
      });

      const serverSettings = response.data.settings || {};

      // Fusionner avec les settings locaux (les settings serveur ont la priorité)
      const mergedSettings = { ...localSettings, ...serverSettings };
      setSettings(mergedSettings);
      setLocalSettings(mergedSettings);

    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err as Error);
      // En cas d'erreur, utiliser les settings locaux
      setSettings(localSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, options: { scope?: string; reason?: string } = {}) => {
    try {
      const { scope = 'global', reason } = options;

      // Optimistic update
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      setLocalSettings(newSettings);

      // Update server
      await api.put(`/api/settings/${key}`, { value, scope, reason });

    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
      // Revert on error
      setSettings(settings);
      setLocalSettings(settings);
      throw err;
    }
  };

  const updateSettings = async (updates: Record<string, any>, options: { scope?: string; reason?: string } = {}) => {
    try {
      const { scope = 'global', reason } = options;

      // Optimistic update
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      setLocalSettings(newSettings);

      // Update server
      await api.put('/api/settings', { updates, scope, reason });

    } catch (err) {
      console.error('Failed to update settings:', err);
      // Revert on error
      setSettings(settings);
      setLocalSettings(settings);
      throw err;
    }
  };

  const restoreSetting = async (key: string, version: number) => {
    try {
      await api.post(`/api/settings/${key}/restore/${version}`);
      await refreshSettings();
    } catch (err) {
      console.error(`Failed to restore setting ${key} to version ${version}:`, err);
      throw err;
    }
  };

  const getSettingHistory = async (key: string) => {
    try {
      const response = await api.get(`/api/settings/${key}/history`);
      return response.data.history || [];
    } catch (err) {
      console.error(`Failed to get history for setting ${key}:`, err);
      return [];
    }
  };

  const searchSettings = async (query: string) => {
    try {
      const response = await api.get('/api/settings/search', { params: { q: query } });
      return response.data.settings || [];
    } catch (err) {
      console.error('Failed to search settings:', err);
      return [];
    }
  };

  return (
    <SettingsContext.Provider
      value={
        settings,
        loading,
        error,
        updateSetting,
        updateSettings,
        restoreSetting,
        getSettingHistory,
        searchSettings,
        refreshSettings
      }
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
```

### Refonte de la Page Settings

**Nouvelle structure modulaire** :
```
client/src/pages/Settings/
├── index.tsx              # Conteneur principal
├── SettingsLayout.tsx     # Mise en page
├── SettingsSidebar.tsx    # Barre latérale avec navigation
├── SettingsSearch.tsx     # Barre de recherche
├── categories/
│   ├── ProfileSettings.tsx
│   ├── ShopSettings.tsx
│   ├── AppearanceSettings.tsx
│   ├── ModuleSettings.tsx
│   ├── SecuritySettings.tsx
│   ├── NotificationSettings.tsx  # Nouveau
│   ├── FinancialSettings.tsx     # Nouveau
│   ├── PrintSettings.tsx         # Nouveau
│   ├── IntegrationSettings.tsx    # Nouveau
│   └── AdvancedSettings.tsx      # Nouveau
├── components/
│   ├── SettingCard.tsx
│   ├── SettingGroup.tsx
│   ├── SettingInput.tsx
│   ├── SettingToggle.tsx
│   ├── SettingSelect.tsx
│   ├── HistoryViewer.tsx
│   └── HelpTooltip.tsx
└── hooks/
    └── useSettingCategory.ts
```

**Exemple de catégorie - NotificationSettings.tsx** :
```typescript
import React from 'react';
import { useSettings } from '../context/SettingsProvider';
import { SettingCard, SettingToggle, SettingSelect, SettingInput } from '../components';

const NotificationSettings = () => {
  const { settings, updateSetting } = useSettings();

  const notificationSettings = settings.notifications || {
    channels: { email: true, sms: false, webhook: false },
    triggers: {
      lowStock: true,
      newSale: true,
      paymentReceived: true,
      dailySummary: false
    },
    schedules: {
      dailySummaryTime: '08:00',
      weeklyReportDay: 1 // Monday
    },
    templates: {
      email: {
        subject: 'Notification from {{shopName}}',
        body: 'Hello {{customerName}},\n\n{{message}}'
      },
      sms: '{{shopName}}: {{message}}'
    }
  };

  const handleChannelChange = (channel: string, value: boolean) => {
    updateSetting('notifications', {
      ...notificationSettings,
      channels: {
        ...notificationSettings.channels,
        [channel]: value
      }
    });
  };

  const handleTriggerChange = (trigger: string, value: boolean) => {
    updateSetting('notifications', {
      ...notificationSettings,
      triggers: {
        ...notificationSettings.triggers,
        [trigger]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <SettingCard title="Canaux de Notification" description="Configurez comment vous recevez les notifications">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingToggle
            label="Email"
            value={notificationSettings.channels.email}
            onChange={(v) => handleChannelChange('email', v)}
            description="Recevoir des notifications par email"
          />
          <SettingToggle
            label="SMS"
            value={notificationSettings.channels.sms}
            onChange={(v) => handleChannelChange('sms', v)}
            description="Recevoir des notifications par SMS"
          />
          <SettingToggle
            label="Webhook"
            value={notificationSettings.channels.webhook}
            onChange={(v) => handleChannelChange('webhook', v)}
            description="Envoyer des notifications à une URL"
          />
        </div>
      </SettingCard>

      <SettingCard title="Déclencheurs" description="Événements qui déclenchent des notifications">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingToggle
            label="Stock Bas"
            value={notificationSettings.triggers.lowStock}
            onChange={(v) => handleTriggerChange('lowStock', v)}
            description="Notification quand le stock est bas"
          />
          <SettingToggle
            label="Nouvelle Vente"
            value={notificationSettings.triggers.newSale}
            onChange={(v) => handleTriggerChange('newSale', v)}
            description="Notification pour chaque nouvelle vente"
          />
          <SettingToggle
            label="Paiement Reçu"
            value={notificationSettings.triggers.paymentReceived}
            onChange={(v) => handleTriggerChange('paymentReceived', v)}
            description="Notification quand un paiement est reçu"
          />
          <SettingToggle
            label="Résumé Quotidien"
            value={notificationSettings.triggers.dailySummary}
            onChange={(v) => handleTriggerChange('dailySummary', v)}
            description="Résumé quotidien des activités"
          />
        </div>
      </SettingCard>

      <SettingCard title="Planification" description="Quand envoyer les notifications">
        <div className="space-y-4">
          <SettingInput
            label="Heure du Résumé Quotidien"
            type="time"
            value={notificationSettings.schedules.dailySummaryTime}
            onChange={(v) => updateSetting('notifications', {
              ...notificationSettings,
              schedules: {
                ...notificationSettings.schedules,
                dailySummaryTime: v
              }
            })}
          />
          <SettingSelect
            label="Jour du Rapport Hebdomadaire"
            value={notificationSettings.schedules.weeklyReportDay}
            options={[
              { value: 0, label: 'Dimanche' },
              { value: 1, label: 'Lundi' },
              { value: 2, label: 'Mardi' },
              { value: 3, label: 'Mercredi' },
              { value: 4, label: 'Jeudi' },
              { value: 5, label: 'Vendredi' },
              { value: 6, label: 'Samedi' }
            ]}
            onChange={(v) => updateSetting('notifications', {
              ...notificationSettings,
              schedules: {
                ...notificationSettings.schedules,
                weeklyReportDay: parseInt(v)
              }
            })}
          />
        </div>
      </SettingCard>

      <SettingCard title="Templates" description="Personnalisez les messages de notification">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de l'Email</label>
            <SettingInput
              value={notificationSettings.templates.email.subject}
              onChange={(v) => updateSetting('notifications', {
                ...notificationSettings,
                templates: {
                  ...notificationSettings.templates,
                  email: {
                    ...notificationSettings.templates.email,
                    subject: v
                  }
                }
              })}
              placeholder="Notification from {{shopName}}"
            />
            <p className="text-xs text-gray-500 mt-1">Variables disponibles: {{shopName}}, {{customerName}}, {{message}}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corps de l'Email</label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={4}
              value={notificationSettings.templates.email.body}
              onChange={(e) => updateSetting('notifications', {
                ...notificationSettings,
                templates: {
                  ...notificationSettings.templates,
                  email: {
                    ...notificationSettings.templates.email,
                    body: e.target.value
                  }
                }
              })}
              placeholder="Hello {{customerName}},\n\n{{message}}"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template SMS</label>
            <SettingInput
              value={notificationSettings.templates.sms}
              onChange={(v) => updateSetting('notifications', {
                ...notificationSettings,
                templates: {
                  ...notificationSettings.templates,
                  sms: v
                }
              })}
              placeholder="{{shopName}}: {{message}}"
            />
            <p className="text-xs text-gray-500 mt-1">Max 160 caractères. Variables: {{shopName}}, {{message}}</p>
          </div>
        </div>
      </SettingCard>
    </div>
  );
};

export default NotificationSettings;
```

## Plan d'Implémentation

### Phase 1 - Backend (2-3 semaines)

1. **Semaine 1** :
   - Créer le nouveau modèle `Setting`
   - Implémenter `SettingHistory`
   - Développer `SettingService` avec validation
   - Créer les endpoints de base

2. **Semaine 2** :
   - Implémenter le système de versioning
   - Ajouter les endpoints avancés (recherche, historique)
   - Écrire les tests unitaires
   - Documenter l'API

3. **Semaine 3** :
   - Créer le script de migration
   - Tester la migration avec les données existantes
   - Optimiser les performances
   - Préparer le déploiement

### Phase 2 - Frontend (3-4 semaines)

1. **Semaine 1** :
   - Créer `SettingsProvider`
   - Développer les composants de base
   - Réorganiser la structure des fichiers

2. **Semaine 2** :
   - Implémenter les catégories de settings
   - Créer les composants réutilisables
   - Intégrer la recherche et les filtres

3. **Semaine 3** :
   - Ajouter l'historique et la restauration
   - Implémenter l'aide contextuelle
   - Optimiser les performances

4. **Semaine 4** :
   - Tests complets
   - Documentation utilisateur
   - Formation de l'équipe

### Phase 3 - Migration et Déploiement (2 semaines)

1. **Semaine 1** :
   - Sauvegarde complète des données existantes
   - Exécuter le script de migration
   - Vérifier l'intégrité des données

2. **Semaine 2** :
   - Déploiement en environnement de test
   - Tests utilisateurs
   - Correction des bugs
   - Déploiement en production

## Recommandations Techniques

### 1. Validation des Données

Utiliser Joi pour la validation :
```javascript
const Joi = require('joi');

const schemas = {
  theme: Joi.string().valid('light', 'dark', 'system').required(),
  language: Joi.string().valid('fr', 'en', 'ln', 'sw').required(),
  currency: Joi.string().valid('CDF', 'USD').required(),
  exchangeRate: Joi.number().min(0.0001).max(10000).required(),
  email: Joi.string().email().required(),
  // Ajouter d'autres schémas...
};
```

### 2. Gestion des Erreurs

Implémenter une gestion robuste des erreurs :
```javascript
// Middleware d'erreur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});
```

### 3. Performance

Optimiser les requêtes :
```javascript
// Utiliser la pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Setting.findAndCountAll({
    limit: parseInt(limit),
    offset: offset,
    where: req.query.scope ? { scope: req.query.scope } : {}
  });

  res.json({
    success: true,
    settings: rows,
    total: count,
    page: parseInt(page),
    pages: Math.ceil(count / limit)
  });
});
```

### 4. Sécurité

Protéger les endpoints sensibles :
```javascript
// Middleware de permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }
    next();
  };
};

// Utilisation
router.put('/:key', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
  // ...
});
```

### 5. Tests

Implémenter des tests complets :
```javascript
// Exemple de test avec Jest
describe('SettingService', () => {
  beforeAll(async () => {
    await Setting.sync({ force: true });
  });

  describe('update', () => {
    it('should update a setting with validation', async () => {
      await SettingService.update('theme', 'dark');
      const theme = await SettingService.get('theme');
      expect(theme).toBe('dark');
    });

    it('should throw error for invalid value', async () => {
      await expect(SettingService.update('theme', 'invalid')).rejects.toThrow();
    });
  });

  describe('versioning', () => {
    it('should increment version on update', async () => {
      await SettingService.update('theme', 'light');
      const setting = await Setting.findOne({ where: { key: 'theme' } });
      expect(setting.version).toBe(2);
    });
  });
});
```

## Conclusion

Cette refonte complète des settings pour HubCommerce Pro apporte :

1. **Architecture centralisée** avec source unique de vérité
2. **Validation robuste** pour la sécurité des données
3. **Versioning complet** avec historique et restauration
4. **Interface modulaire** facile à maintenir
5. **Nouvelles fonctionnalités** essentielles pour les entreprises
6. **Meilleure expérience utilisateur** avec recherche et aide contextuelle

La migration progressive permet de minimiser les risques tout en apportant des améliorations significatives à la stabilité, la sécurité et la maintenabilité de l'application.

**Prochaines étapes recommandées** :
1. Commencer par l'implémentation du backend
2. Tester rigoureusement chaque composant
3. Migrer progressivement les données
4. Former l'équipe sur les nouvelles fonctionnalités
5. Surveiller et optimiser après le déploiement

Cette architecture positionne HubCommerce Pro comme une solution ERP moderne et complète, capable de rivaliser avec les solutions commerciales tout en offrant une flexibilité supérieure.
