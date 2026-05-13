# Documentation d'Intégration DeepSeek pour HubCommerce Pro

## Introduction

Cette documentation explique comment intégrer DeepSeek dans votre application HubCommerce Pro pour qu'il puisse comprendre et interagir avec toutes les fonctionnalités, modules, sous-modules et actions de l'application. L'objectif est de créer un système intelligent qui connaît parfaitement votre application et peut répondre de manière pertinente aux besoins des utilisateurs.

## Architecture d'Intégration

### 1. Structure de Connaissance

Pour que DeepSeek comprenne parfaitement votre application, nous allons créer une architecture de connaissance en plusieurs couches :

```
Application HubCommerce Pro
├── 
├── Couche d'Interaction (Interaction Layer)
│   ├── Interface API
│   ├── Webhooks
│   └── Événements en Temps Réel
└── Couche de Réponse (Response Layer)
    ├── Génération de Réponses
    ├── Personnalisation
    └── Optimisation
```

### 2. Base de Connaissance Statique

Cette base contient les informations fixes sur votre application :

#### Fichier : `deepseek_knowledge_base.json`

```json
{
  "application": {
    "name": "HubCommerce Pro",
    "version": "1.0.0",
    "description": "Solution ERP/POS complète pour la gestion commerciale",
    "modules": [
      {
        "name": "Dashboard",
        "description": "Tableau de bord principal avec analytics",
        "features": [
          "Statistiques de ventes",
          "Notifications",
          "Analyse des performances",
          "Alertes intelligentes"
        ]
      },
      {
        "name": "POS",
        "description": "Point de vente",
        "features": [
          "Gestion des ventes",
          "Scan de produits",
          "Paiements",
          "Impression de tickets"
        ]
      },
      {
        "name": "Products",
        "description": "Gestion des produits",
        "features": [
          "Ajout/Modification de produits",
          "Catégories",
          "Stock management",
          "Alertes de stock bas"
        ]
      },
      {
        "name": "Clients",
        "description": "Gestion de la relation client",
        "features": [
          "Fiches clients",
          "Historique d'achats",
          "Gestion des dettes",
          "Segmentation"
        ]
      },
      {
        "name": "Fournisseurs",
        "description": "Gestion des fournisseurs",
        "features": [
          "Fiches fournisseurs",
          "Historique des achats",
          "Gestion des commandes"
        ]
      },
      {
        "name": "Finances",
        "description": "Gestion financière",
        "features": [
          "Dettes",
          "Dépenses",
          "Cash flow",
          "Rapports financiers"
        ]
      },
      {
        "name": "Settings",
        "description": "Paramètres de l'application",
        "features": [
          "Configuration de la boutique",
          "Gestion des utilisateurs",
          "Paramètres de sécurité",
          "Préférences"
        ]
      }
    ],
    "workflow": {
      "sales_process": [
        "Création de produit",
        "Ajout au panier",
        "Validation de vente",
        "Paiement",
        "Impression ticket",
        "Mise à jour du stock"
      ],
      "purchase_process": [
        "Création de commande",
        "Réception des produits",
        "Mise à jour du stock",
        "Paiement fournisseur"
      ]
    }
  },
  "user_roles": [
    {
      "role": "admin",
      "permissions": ["all"],
      "description": "Accès complet à toutes les fonctionnalités"
    },
    {
      "role": "manager",
      "permissions": [
        "view_dashboard",
        "manage_sales",
        "manage_products",
        "view_reports",
        "manage_staff"
      ],
      "description": "Gestion quotidienne de la boutique"
    },
    {
      "role": "cashier",
      "permissions": [
        "process_sales",
        "view_products",
        "view_clients"
      ],
      "description": "Traitement des ventes uniquement"
    }
  ],
  "response_templates": {
    "greeting": "Bonjour {user_name}! Comment puis-je vous aider avec {shop_name} aujourd'hui ?",
    "product_info": "Le produit {product_name} (Ref: {product_id}) a un stock de {quantity} unités au prix de {price} {currency}.",
    "low_stock_alert": "⚠️ Attention! Le produit {product_name} est presque en rupture de stock ({quantity} unités restantes).",
    "sales_summary": "Aujourd'hui, {shop_name} a réalisé {sales_count} ventes pour un total de {total_amount} {currency}.",
    "help_offer": "Je peux vous aider avec : 1) Ventes, 2) Produits, 3) Clients, 4) Rapports. Que choisissez-vous ?"
  }
}
```

### 3. Base de Connaissance Dynamique

Cette base est mise à jour en temps réel avec les données de l'application :

#### Fichier : `deepseek_dynamic_knowledge.js`

```javascript
// Module pour synchroniser les données dynamiques avec DeepSeek
const { Product, Client, Fournisseur, Sale, Purchase, User, Shop } = require('../server/models');
const deepseek = require('./deepseek_client');

class DynamicKnowledgeBase {
  constructor() {
    this.knowledge = {
      products: [],
      clients: [],
      fournisseurs: [],
      recent_sales: [],
      recent_purchases: [],
      users: [],
      shop_info: {}
    };
    
    // Mise à jour initiale
    this.initialize();
    
    // Configuration des écouteurs d'événements
    this.setupEventListeners();
  }

  async initialize() {
    await this.updateAllData();
    await this.syncWithDeepSeek();
  }

  async updateAllData() {
    try {
      // Produits
      this.knowledge.products = await Product.findAll({
        include: ['category'],
        order: [['updatedAt', 'DESC']]
      });

      // Clients
      this.knowledge.clients = await Client.findAll({
        order: [['updatedAt', 'DESC']],
        limit: 50 // 50 clients les plus récents
      });

      // Fournisseurs
      this.knowledge.fournisseurs = await Fournisseur.findAll({
        order: [['updatedAt', 'DESC']],
        limit: 20
      });

      // Ventes récentes
      this.knowledge.recent_sales = await Sale.findAll({
        include: ['items', 'client'],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      // Achats récents
      this.knowledge.recent_purchases = await Purchase.findAll({
        include: ['items', 'fournisseur'],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      // Utilisateurs
      this.knowledge.users = await User.findAll({
        attributes: { exclude: ['password'] }
      });

      // Informations boutique
      this.knowledge.shop_info = await Shop.findOne({
        where: { id: 1 } // Assuming single shop for now
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour des données dynamiques:', error);
    }
  }

  setupEventListeners() {
    // Écouter les événements de modèle Sequelize
    const models = [Product, Client, Fournisseur, Sale, Purchase, User];
    
    models.forEach(model => {
      model.afterCreate(async (instance) => {
        await this.handleModelChange(model.name, 'created', instance);
      });

      model.afterUpdate(async (instance) => {
        await this.handleModelChange(model.name, 'updated', instance);
      });

      model.afterDestroy(async (instance) => {
        await this.handleModelChange(model.name, 'deleted', instance);
      });
    });
  }

  async handleModelChange(modelName, action, instance) {
    try {
      // Mettre à jour la connaissance locale
      switch(modelName) {
        case 'Product':
          if (action === 'deleted') {
            this.knowledge.products = this.knowledge.products.filter(p => p.id !== instance.id);
          } else {
            const index = this.knowledge.products.findIndex(p => p.id === instance.id);
            if (index >= 0) {
              this.knowledge.products[index] = instance;
            } else {
              this.knowledge.products.push(instance);
            }
          }
          break;
        // Ajouter les autres cas pour Client, Fournisseur, etc.
      }

      // Synchroniser avec DeepSeek
      await this.syncWithDeepSeek();
      
      console.log(`[DeepSeek Knowledge] ${modelName} ${action}: ${instance.id}`);
    } catch (error) {
      console.error('Erreur lors de la gestion du changement de modèle:', error);
    }
  }

  async syncWithDeepSeek() {
    try {
      // Préparer les données pour DeepSeek
      const knowledgeUpdate = {
        timestamp: new Date().toISOString(),
        shop: this.knowledge.shop_info,
        products: this.knowledge.products.map(p => ({
          id: p.id,
          name: p.name,
          reference: p.reference,
          price: p.price,
          quantity: p.quantity,
          category: p.category?.name,
          updatedAt: p.updatedAt
        })),
        clients: this.knowledge.clients.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          totalPurchases: c.totalPurchases
        })),
        recent_sales: this.knowledge.recent_sales.map(s => ({
          id: s.id,
          amount: s.amount,
          items: s.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price
          })),
          clientId: s.clientId,
          createdAt: s.createdAt
        })),
        metrics: {
          totalProducts: this.knowledge.products.length,
          totalClients: this.knowledge.clients.length,
          lowStockProducts: this.knowledge.products.filter(p => p.quantity < p.lowStockThreshold).length
        }
      };

      // Envoyer à DeepSeek pour mise à jour de la connaissance
      const response = await deepseek.updateKnowledgeBase(knowledgeUpdate);
      
      console.log('Synchronisation DeepSeek réussie:', response.status);
      return response;
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec DeepSeek:', error);
      throw error;
    }
  }

  getContextForQuery(queryType) {
    // Retourne le contexte pertinent pour un type de requête spécifique
    switch(queryType) {
      case 'product':
        return {
          products: this.knowledge.products,
          shop: this.knowledge.shop_info
        };
      case 'sales':
        return {
          recent_sales: this.knowledge.recent_sales,
          products: this.knowledge.products,
          clients: this.knowledge.clients
        };
      case 'inventory':
        return {
          products: this.knowledge.products,
          metrics: {
            lowStock: this.knowledge.products.filter(p => p.quantity < p.lowStockThreshold)
          }
        };
      default:
        return this.knowledge;
    }
  }
}

module.exports = new DynamicKnowledgeBase();
```

### 4. Client DeepSeek Amélioré

#### Fichier : `deepseek_client.js`

```javascript
const axios = require('axios');
const staticKnowledge = require('./deepseek_knowledge_base.json');
const dynamicKnowledge = require('./deepseek_dynamic_knowledge');

class DeepSeekClient {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';
    this.knowledgeBaseId = process.env.DEEPSEEK_KNOWLEDGE_BASE_ID;
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    
    // Initialiser la base de connaissance
    this.initializeKnowledgeBase();
  }

  async initializeKnowledgeBase() {
    try {
      // Créer ou mettre à jour la base de connaissance
      const response = await this.updateKnowledgeBase({
        static: staticKnowledge,
        dynamic: dynamicKnowledge.knowledge
      });
      
      this.knowledgeBaseId = response.knowledgeBaseId;
      console.log('Base de connaissance DeepSeek initialisée avec ID:', this.knowledgeBaseId);
    } catch (error) {
      console.error('Erreur d\'initialisation de la base de connaissance:', error.message);
    }
  }

  async updateKnowledgeBase(knowledgeData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/knowledge-bases/${this.knowledgeBaseId || ''}`,
        knowledgeData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Créer une nouvelle base de connaissance si elle n'existe pas
        const createResponse = await axios.post(
          `${this.baseUrl}/v1/knowledge-bases`,
          {
            name: 'HubCommerce Knowledge Base',
            description: 'Base de connaissance complète pour HubCommerce Pro',
            data: knowledgeData
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return createResponse.data;
      }
      throw error;
    }
  }

  async generateResponse(prompt, context = {}) {
    try {
      // Obtenir le contexte pertinent
      const knowledgeContext = dynamicKnowledge.getContextForQuery(context.type);
      
      // Préparer le prompt enrichi
      const enrichedPrompt = this.buildEnrichedPrompt(prompt, knowledgeContext);
      
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `Vous êtes l'assistant intelligent de HubCommerce Pro. 
              Vous avez une connaissance complète de l'application, de ses modules, 
              des produits, clients et de toutes les opérations. 
              Répondez de manière précise et utile en utilisant les informations contextuelles fournies.`
            },
            {
              role: 'user',
              content: enrichedPrompt
            }
          ],
          knowledge_base_id: this.knowledgeBaseId,
          temperature: 0.3,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la génération de réponse DeepSeek:', error);
      return 'Désolé, je n\'ai pas pu générer de réponse pour le moment.';
    }
  }

  buildEnrichedPrompt(userPrompt, context) {
    // Construire un prompt enrichi avec le contexte
    let prompt = `Contexte de l'application HubCommerce Pro:
`;
    
    // Ajouter les informations sur la boutique
    if (context.shop) {
      prompt += `Boutique: ${context.shop.name} (${context.shop.location})
`;
      prompt += `Devise: ${context.shop.currency}, Téléphone: ${context.shop.phone}
`;
    }
    
    // Ajouter les informations sur les produits si pertinent
    if (context.products && context.products.length > 0) {
      prompt += `
Produits disponibles (${context.products.length} au total):
`;
      const sampleProducts = context.products.slice(0, 5);
      sampleProducts.forEach(p => {
        prompt += `- ${p.name} (Ref: ${p.reference}): ${p.quantity} en stock à ${p.price} ${context.shop?.currency || 'CDF'}
`;
      });
      
      if (context.products.length > 5) {
        prompt += `... et ${context.products.length - 5} autres produits
`;
      }
    }
    
    // Ajouter les alertes de stock bas
    if (context.metrics?.lowStockProducts > 0) {
      prompt += `
⚠️ ${context.metrics.lowStockProducts} produits ont un stock bas et nécessitent une attention
`;
    }
    
    // Ajouter la requête de l'utilisateur
    prompt += `

Requête de l'utilisateur: "${userPrompt}"
`;
    
    // Instructions pour DeepSeek
    prompt += `
Instructions:
1. Utilisez le contexte fourni pour répondre de manière précise
2. Si la question concerne un produit spécifique, vérifiez d'abord dans la liste des produits
3. Pour les questions financières, utilisez la devise de la boutique
4. Si vous ne connaissez pas la réponse, dites-le clairement
5. Soyez concis mais complet dans vos réponses
6. Personnalisez les réponses avec le nom de la boutique quand c'est pertinent
`;
    
    return prompt;
  }

  async generateProductRecommendation() {
    const context = dynamicKnowledge.getContextForQuery('product');
    
    const prompt = `Sur la base des produits actuels et des tendances de vente,
    quels sont les 3 produits que nous devrions mettre en avant aujourd'hui ?
    Considérez:
    - Les produits avec un stock élevé
    - Les produits populaires
    - Les produits avec une bonne marge
    - Les tendances saisonnières
    
    Format de réponse:
    1. [Nom du produit] - [Raison] - Prix: [prix]
    2. [Nom du produit] - [Raison] - Prix: [prix]
    3. [Nom du produit] - [Raison] - Prix: [prix]`;
    
    return this.generateResponse(prompt, { type: 'product' });
  }

  async generateSalesSummary() {
    const context = dynamicKnowledge.getContextForQuery('sales');
    
    const prompt = `Générez un résumé des ventes récentes pour ${context.shop?.name || 'la boutique'}:
    - Nombre total de ventes aujourd'hui
    - Montant total des ventes
    - Produit le plus vendu
    - Client le plus fidèle (si applicable)
    - Comparaison avec la moyenne des derniers jours
    
    Soyez encourageant et mettez en avant les performances positives.`;
    
    return this.generateResponse(prompt, { type: 'sales' });
  }

  async analyzeInventory() {
    const context = dynamicKnowledge.getContextForQuery('inventory');
    
    const prompt = `Analysez l'inventaire actuel:
    1. Quels produits sont en rupture de stock ou presque ?
    2. Quels produits ont un stock excessif ?
    3. Quelles catégories de produits sont sous-représentées ?
    4. Recommandations pour les prochains achats
    
    Format de réponse:
    ## Analyse de l'inventaire
    
    ### Alertes
    - [Produits en rupture]
    - [Produits à réapprovisionner]
    
    ### Opportunités
    - [Catégories à développer]
    - [Produits à promouvoir]
    
    ### Recommandations
    - [Actions spécifiques à entreprendre]`;
    
    return this.generateResponse(prompt, { type: 'inventory' });
  }
}

module.exports = new DeepSeekClient();
```

### 5. Intégration avec l'API Existante

#### Modification du fichier : `server/controllers/aiController.js`

```javascript
const express = require('express');
const router = express.Router();
const deepseek = require('../../deepseek_client');
const { authenticateToken } = require('../../middleware/auth');

// Endpoint pour les requêtes générales
router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const user = req.user;
    
    // Ajouter le contexte utilisateur
    const enrichedContext = {
      ...context,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        shopId: user.shopId
      }
    };
    
    const response = await deepseek.generateResponse(prompt, enrichedContext);
    
    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur dans la requête AI:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de la requête'
    });
  }
});

// Endpoint pour les recommandations de produits
router.get('/product-recommendations', authenticateToken, async (req, res) => {
  try {
    const recommendations = await deepseek.generateProductRecommendation();
    res.json({
      success: true,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('Erreur dans les recommandations de produits:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des recommandations'
    });
  }
});

// Endpoint pour le résumé des ventes
router.get('/sales-summary', authenticateToken, async (req, res) => {
  try {
    const summary = await deepseek.generateSalesSummary();
    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Erreur dans le résumé des ventes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du résumé'
    });
  }
});

// Endpoint pour l'analyse de l'inventaire
router.get('/inventory-analysis', authenticateToken, async (req, res) => {
  try {
    const analysis = await deepseek.analyzeInventory();
    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Erreur dans l\'analyse de l\'inventaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse de l\'inventaire'
    });
  }
});

// Endpoint pour forcer la synchronisation des connaissances
router.post('/sync-knowledge', authenticateToken, async (req, res) => {
  try {
    await deepseek.dynamicKnowledge.updateAllData();
    const syncResult = await deepseek.syncWithDeepSeek();
    
    res.json({
      success: true,
      message: 'Base de connaissance synchronisée avec succès',
      details: syncResult
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation de la base de connaissance'
    });
  }
});

module.exports = router;
```

### 6. Intégration Frontend

#### Modification du fichier : `client/src/components/dashboard/AIChat.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/axios';
import { Button, TextField, CircularProgress, Paper, Typography, List, ListItem, ListItemText, Divider, Box, IconButton } from '@mui/material';
import { Send as SendIcon, Sync as SyncIcon, Lightbulb as LightbulbIcon } from '@mui/icons-material';

const AIChat = () => {
  const [messages, setMessages] = useState<Array<{text: string; sender: 'user' | 'ai'}>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Message de bienvenue
    if (user) {
      setMessages([
        {
          text: `Bonjour ${user.name}! Je suis votre assistant HubCommerce. 
          Je connais parfaitement votre boutique et peux vous aider avec :
          - Ventes et produits
          - Analyse de l'inventaire
          - Recommandations stratégiques
          - Résumé des performances
          
          Comment puis-je vous aider aujourd'hui ?`,
          sender: 'ai'
        }
      ]);
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { text: inputValue, sender: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/query', {
        prompt: inputValue,
        context: { type: 'general' }
      });

      const aiMessage = { text: response.data.response, sender: 'ai' as const };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage = { 
        text: "Désolé, je n'ai pas pu traiter votre requête. Veuillez réessayer.", 
        sender: 'ai' as const 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncKnowledge = async () => {
    setIsSyncing(true);
    try {
      const response = await api.post('/ai/sync-knowledge');
      const syncMessage = {
        text: `✅ Base de connaissance synchronisée: ${response.data.message}`,
        sender: 'ai' as const
      };
      setMessages(prev => [...prev, syncMessage]);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      const errorMessage = {
        text: "❌ Erreur lors de la synchronisation de la base de connaissance.",
        sender: 'ai' as const
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickAction = async (actionType: string) => {
    setIsLoading(true);
    const actionMessage = {
      text: `Action rapide: ${actionType}`,
      sender: 'user' as const
    };
    setMessages(prev => [...prev, actionMessage]);

    try {
      let endpoint = '';
      let prompt = '';

      switch(actionType) {
        case 'recommendations':
          endpoint = '/ai/product-recommendations';
          prompt = 'Quels produits devrions-nous mettre en avant aujourd\'hui ?';
          break;
        case 'sales-summary':
          endpoint = '/ai/sales-summary';
          prompt = 'Peux-tu me donner un résumé des ventes récentes ?';
          break;
        case 'inventory':
          endpoint = '/ai/inventory-analysis';
          prompt = 'Peux-tu analyser notre inventaire actuel ?';
          break;
      }

      const response = await api.get(endpoint);
      const aiMessage = { 
        text: response.data.recommendations || response.data.summary || response.data.analysis, 
        sender: 'ai' as const 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erreur dans l\'action rapide:', error);
      const errorMessage = { 
        text: "Désolé, je n'ai pas pu compléter cette action.", 
        sender: 'ai' as const 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { 
      name: 'Recommandations', 
      type: 'recommendations', 
      icon: <LightbulbIcon fontSize="small" />,
      description: 'Produits à mettre en avant'
    },
    { 
      name: 'Résumé Ventes', 
      type: 'sales-summary', 
      icon: <LightbulbIcon fontSize="small" />,
      description: 'Performance des ventes'
    },
    { 
      name: 'Analyse Inventaire', 
      type: 'inventory', 
      icon: <LightbulbIcon fontSize="small" />,
      description: 'État des stocks'
    }
  ];

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '80vh', 
        display: 'flex', 
        flexDirection: 'column',
        p: 2,
        backgroundColor: 'background.paper'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Assistant HubCommerce AI
      </Typography>

      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        <List sx={{ pb: 2 }}>
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2,
                    maxWidth: '80%',
                    backgroundColor: message.sender === 'user' ? 'primary.light' : 'background.default',
                    borderRadius: message.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0'
                  }}
                >
                  <ListItemText 
                    primary={message.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}<br/>
                      </React.Fragment>
                    ))}
                  />
                </Paper>
              </ListItem>
              {index < messages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {quickActions.map((action) => (
          <Button
            key={action.type}
            variant="outlined"
            size="small"
            startIcon={action.icon}
            onClick={() => handleQuickAction(action.type)}
            disabled={isLoading}
            sx={{ flex: 1 }}
          >
            {action.name}
          </Button>
        ))}
        <IconButton
          onClick={handleSyncKnowledge}
          disabled={isSyncing || isLoading}
          color="primary"
        >
          {isSyncing ? <CircularProgress size={24} /> : <SyncIcon />}
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Posez votre question sur votre boutique..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isLoading}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          sx={{ minWidth: '56px' }}
        >
          {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </Button>
      </Box>
    </Paper>
  );
};

export default AIChat;
```

## Configuration et Déploiement

### 1. Variables d'Environnement

Ajoutez les variables suivantes à votre fichier `.env` :

```env
# DeepSeek Configuration
DEEPSEEK_API_KEY=votre_cle_api_deepseek_ici
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_KNOWLEDGE_BASE_ID=laisser_vide_pour_creation_automatique
```

### 2. Installation des Dépendances

```bash
# Dans le dossier server
npm install axios

# Dans le dossier client
# (aucune dépendance supplémentaire nécessaire, tout est déjà inclus)
```

### 3. Intégration des Routes

Assurez-vous que votre fichier `server/routes/index.js` inclut :

```javascript
const aiRouter = require('../controllers/aiController');
// ... autres imports

module.exports = (app) => {
  // ... autres routes
  app.use('/api/ai', aiRouter);
};
```

### 4. Mise à Jour des Modèles

Assurez-vous que votre modèle `Shop` contient tous les champs nécessaires :

```javascript
// server/models/shop.js
module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define('Shop', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'CDF'
    },
    address: {
      type: DataTypes.TEXT
    },
    logo: {
      type: DataTypes.STRING
    },
    // Ajoutez d'autres champs pertinents pour votre boutique
  }, {
    timestamps: true
  });

  return Shop;
};
```

## Stratégie de Mise à Jour Continue

### 1. Synchronisation en Temps Réel

Le système utilise les hooks Sequelize pour mettre à jour la base de connaissance à chaque changement :

- `afterCreate` : Quand un nouvel enregistrement est créé
- `afterUpdate` : Quand un enregistrement est mis à jour
- `afterDestroy` : Quand un enregistrement est supprimé

### 2. Synchronisation Manuelle

Les utilisateurs peuvent forcer une synchronisation via :
- Le bouton de synchronisation dans l'interface
- L'endpoint API `/api/ai/sync-knowledge`

### 3. Synchronisation Planifiée

Pour une mise à jour régulière, ajoutez un cron job :

```javascript
// Dans un fichier comme server/cron/jobs.js
const cron = require('node-cron');
const deepseek = require('../deepseek_client');

// Synchroniser toutes les 6 heures
cron.schedule('0 */6 * * *', async () => {
  console.log('Début de la synchronisation planifiée de DeepSeek...');
  try {
    await deepseek.dynamicKnowledge.updateAllData();
    await deepseek.syncWithDeepSeek();
    console.log('Synchronisation planifiée terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la synchronisation planifiée:', error);
  }
});
```

## Bonnes Pratiques

### 1. Gestion des Erreurs

- Implémentez des mécanismes de reprise en cas d'échec de synchronisation
- Loggez toutes les erreurs pour le débogage
- Affichez des messages utilisateur clairs en cas de problème

### 2. Performance

- Limitez le nombre d'enregistrements synchronisés (ex: 50 clients récents)
- Utilisez la pagination pour les grandes quantités de données
- Cachez les réponses fréquentes

### 3. Sécurité

- Ne jamais exposer votre clé API DeepSeek dans le code frontend
- Utilisez toujours l'authentification pour les endpoints AI
- Validez toutes les entrées utilisateur

### 4. Amélioration Continue

- Surveillez les requêtes fréquentes pour identifier les besoins utilisateurs
- Mettez à jour régulièrement la base de connaissance statique
- Ajoutez de nouveaux templates de réponse au fur et à mesure

## Exemples d'Utilisation

### 1. Requête Simple

**Utilisateur** : "Quel est le produit le plus vendu aujourd'hui ?"

**DeepSeek** : "Le produit le plus vendu aujourd'hui est 'Farine Superieure 25kg' avec 15 unités vendues, générant un revenu de 75,000 CDF."

### 2. Analyse Complexe

**Utilisateur** : "Peux-tu analyser notre inventaire et faire des recommandations ?"

**DeepSeek** : 
```
## Analyse de l'inventaire pour Boutique Mama Mboka

### Alertes
- ⚠️ Sucre 1kg : Rupture de stock (0 unités)
- ⚠️ Huile Végétale 1L : Stock bas (3 unités restantes)
- ⚠️ Savon Lavex : Stock bas (2 unités restantes)

### Opportunités
- 📈 Farine Superieure 25kg : Bonne performance (15 vendus aujourd'hui)
- 📈 Riz Importé 50kg : Marge intéressante (45%)
- 📈 Boissons Gazeuses : Demande saisonnière en hausse

### Recommandations
1. Commander urgemment : Sucre 1kg (20 unités), Huile Végétale 1L (10 unités)
2. Mettre en promotion : Farine Superieure 25kg (lot de 3 à prix réduit)
3. Diversifier : Ajouter des produits complémentaires aux articles populaires
4. Réorganiser : Placer les produits à forte marge en tête de gondole
```

### 3. Interaction Personnalisée

**Utilisateur** : "Bonjour, peux-tu me donner un résumé de la journée ?"

**DeepSeek** : 
```
Bonjour Jean! Voici le résumé pour Boutique Mama Mboka - 2 mai 2026 :

📊 Performances:
- 28 ventes réalisées
- Revenus totaux : 145,000 CDF
- Panier moyen : 5,178 CDF

🏆 Meilleur produit : Farine Superieure 25kg (15 unités)
👤 Client fidèle : Monsieur Kabasele (3 achats aujourd'hui)

⚠️ Attention : 3 produits en stock bas nécessitent votre attention

💡 Suggestion : Avec la performance actuelle, vous êtes sur la bonne voie 
pour atteindre votre objectif quotidien de 200,000 CDF. 
Continuez ainsi !
```

## Maintenance et Évolution

### 1. Mise à Jour de la Base de Connaissance Statique

Quand vous ajoutez de nouvelles fonctionnalités :
1. Mettez à jour `deepseek_knowledge_base.json`
2. Ajoutez de nouveaux templates de réponse
3. Mettez à jour les quick actions dans l'interface

### 2. Amélioration des Réponses

- Analysez régulièrement les interactions utilisateurs
- Ajoutez des templates pour les questions fréquentes
- Affinez les prompts pour des réponses plus précises

### 3. Extension des Capacités

Futures améliorations possibles :
- Intégration avec le calendrier pour les tendances saisonnières
- Analyse prédictive des ventes
- Recommandations de prix dynamiques
- Détection automatique des anomalies

## Conclusion

Cette intégration permet à DeepSeek de devenir un véritable assistant intelligent pour votre application HubCommerce Pro. En combinant une base de connaissance statique complète avec des données dynamiques mises à jour en temps réel, l'AI peut fournir des réponses précises, pertinentes et personnalisées qui ajoutent une réelle valeur à votre business.

L'architecture modulaire permet une évolution facile et une maintenance simplifiée, tout en offrant une expérience utilisateur riche et interactive.
