# 🤖 Guide d'Intégration de l'Assistant IA pour HubCommerce Pro

Ce guide explique comment intégrer un assistant IA local/open-source qui comprend parfaitement votre application et guide les utilisateurs.

---

## 🎯 Objectifs de l'Assistant IA

L'assistant doit :
1. **Connaître l'application** : Toutes les fonctionnalités, boutons et flux
2. **Comprendre les données** : Produits, ventes, clients, stocks de chaque boutique
3. **Guider les utilisateurs** : Aide contextuelle et suggestions stratégiques
4. **Fonctionner localement** : Sans dépendre d'APIs payantes

---

## 🛠️ Solution Recommandée : Ollama + Llama 3

### Pourquoi Ollama ?
- **Gratuit et open-source** : Pas de coûts API
- **Local** : Fonctionne sur votre serveur
- **Performant** : Modèle Llama 3 optimisé pour le français
- **Compatible** : API similaire à OpenAI/DeepSeek

---

## 📋 Étapes d'Intégration Complètes

### Étape 1 : Installer Ollama sur le Serveur

#### Sur Linux/macOS :
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Sur Windows (WSL2 recommandé) :
```powershell
wsl --install
wsl -d Ubuntu
curl -fsSL https://ollama.com/install.sh | sh
```

#### Télécharger le modèle Llama 3 :
```bash
ollama pull llama3
```

#### Démarrer Ollama en arrière-plan :
```bash
ollama serve &
```

**Vérification** :
```bash
curl http://localhost:11434/api/tags
```
→ Doit retourner la liste des modèles disponibles

---

### Étape 2 : Modifier le Backend (server/controllers/aiController.js)

```javascript
// Remplacer la configuration DeepSeek par Ollama
const getClient = () => {
    // Plus besoin de clé API pour Ollama
    return new OpenAI({
        baseURL: "http://localhost:11434/v1",
        // Pas de clé API nécessaire pour Ollama
        apiKey: "ollama", // Valeur factice requise par le client
    });
};

const MODEL = "llama3"; // Modèle local au lieu de deepseek-chat
```

---

### Étape 3 : Créer le Contexte de l'Application

Créer un fichier `ai-context.json` dans `server/utils/` :

```json
{
  "app_info": {
    "name": "HubCommerce Pro",
    "version": "1.0",
    "description": "Plateforme ERP/POS pour commerçants avec intelligence artificielle intégrée"
  },
  "modules": {
    "dashboard": {
      "description": "Tableau de bord principal avec statistiques et notifications",
      "features": [
        "Aperçu du chiffre d'affaires",
        "Dépenses récentes",
        "Santé du stock",
        "Notifications système",
        "Accès rapide au POS",
        "Chat avec l'assistant IA"
      ],
      "buttons": {
        "new_sale": "Créer une nouvelle vente (POS)",
        "view_stats": "Voir les statistiques détaillées",
        "manage_stock": "Gérer le stock et les alertes",
        "chat_with_ai": "Ouvrir le chat avec LUMO Assistant",
        "toggle_theme": "Changer entre mode clair et sombre",
        "toggle_currency": "Changer entre CDF et USD"
      }
    },
    "products": {
      "description": "Gestion complète du catalogue produits",
      "features": [
        "Liste des produits avec recherche",
        "Catégories et filtrage",
        "Alertes de stock critique",
        "Import/Export en masse",
        "Scanner de code-barres",
        "Historique des modifications"
      ],
      "buttons": {
        "add_product": "Ajouter un nouveau produit",
        "edit_product": "Modifier les détails du produit",
        "delete_product": "Supprimer un produit (avec confirmation)",
        "view_details": "Voir la fiche complète du produit",
        "print_barcode": "Imprimer l'étiquette code-barres",
        "bulk_import": "Importer depuis Excel/CSV",
        "bulk_export": "Exporter vers Excel"
      ],
      "data_fields": [
        "nom",
        "description", 
        "prix",
        "prixAchat",
        "stock",
        "stockAlerte",
        "categorie",
        "codeBarre",
        "image",
        "unite",
        "devise"
      ]
    },
    "sales": {
      "description": "Point de vente et gestion des ventes",
      "features": [
        "Interface POS optimisée",
        "Recherche rapide de produits",
        "Gestion du panier client",
        "Paiements multiples",
        "Impression de tickets",
        "Historique des ventes",
        "Statistiques par période"
      ],
      "buttons": {
        "add_to_cart": "Ajouter un produit au panier",
        "remove_from_cart": "Retirer un produit",
        "clear_cart": "Vider le panier",
        "complete_sale": "Finaliser la vente",
        "cancel_sale": "Annuler la vente en cours",
        "print_receipt": "Imprimer le reçu",
        "email_receipt": "Envoyer par email",
        "view_history": "Voir l'historique des ventes",
        "filter_period": "Filtrer par période"
      ]
    },
    "clients": {
      "description": "Gestion de la relation client (CRM)",
      "features": [
        "Base de données clients",
        "Historique d'achats par client",
        "Suivi des dettes",
        "Fiches clients détaillées",
        "Export des données",
        "Segmentation clients"
      ],
      "buttons": {
        "add_client": "Ajouter un nouveau client",
        "edit_client": "Modifier les informations",
        "view_purchases": "Voir l'historique d'achats",
        "add_debt": "Enregistrer une dette",
        "mark_paid": "Marquer comme payé",
        "send_notification": "Envoyer une notification",
        "export_clients": "Exporter la liste"
      ],
      "data_fields": [
        "nom",
        "telephone",
        "email",
        "adresse",
        "solde",
        "historiqueAchats",
        "datePremierAchat"
      ]
    },
    "purchases": {
      "description": "Gestion des achats et approvisionnements",
      "features": [
        "Enregistrement des achats",
        "Gestion des fournisseurs",
        "Suivi des dettes fournisseurs",
        "Historique des approvisionnements",
        "Analyse des coûts"
      ],
      "buttons": {
        "add_purchase": "Enregistrer un achat",
        "add_supplier": "Ajouter un fournisseur",
        "record_debt": "Enregistrer une dette",
        "mark_received": "Marquer comme reçu",
        "view_report": "Voir le rapport d'achats"
      ]
    },
    "reports": {
      "description": "Analytique et reporting avancé",
      "features": [
        "Graphiques de ventes",
        "Analyse de rentabilité",
        "Prévisions de stock",
        "Export Excel/PDF",
        "Tableaux de bord personnalisables"
      ],
      "buttons": {
        "generate_report": "Générer un rapport",
        "export_excel": "Exporter vers Excel",
        "export_pdf": "Exporter vers PDF",
        "customize_dashboard": "Personnaliser le tableau de bord",
        "compare_periods": "Comparer des périodes"
      ]
    },
    "settings": {
      "description": "Paramètres de l'application et du compte",
      "features": [
        "Gestion du profil utilisateur",
        "Paramètres de la boutique",
        "Préférences d'affichage",
        "Gestion des utilisateurs (SuperAdmin)",
        "Sauvegarde des données"
      ],
      "buttons": {
        "edit_profile": "Modifier le profil",
        "change_password": "Changer le mot de passe",
        "edit_shop_info": "Modifier les infos de la boutique",
        "manage_users": "Gérer les utilisateurs (SuperAdmin)",
        "backup_data": "Sauvegarder les données",
        "restore_data": "Restaurer les données"
      ],
      "user_data_fields": [
        "nom",
        "email",
        "telephone",
        "entreprise.nom",
        "entreprise.logo",
        "entreprise.adresse",
        "entreprise.devise",
        "typeActivite",
        "preferences.theme",
        "preferences.language"
      ]
    }
  },
  "workflows": {
    "new_sale": [
      "1. Cliquer sur 'Nouvelle Vente' ou aller dans POS",
      "2. Scanner ou rechercher un produit",
      "3. Ajouter au panier (quantité si nécessaire)",
      "4. Répéter pour tous les produits",
      "5. Cliquer sur 'Finaliser la vente'",
      "6. Sélectionner le mode de paiement",
      "7. Imprimer ou envoyer le reçu"
    ],
    "add_product": [
      "1. Aller dans 'Produits' puis 'Ajouter'",
      "2. Remplir les informations (nom, prix, stock, etc.)",
      "3. Optionnel : Ajouter une image",
      "4. Définir le seuil d'alerte de stock",
      "5. Sauvegarder"
    ],
    "manage_stock_alert": [
      "1. Aller dans 'Produits'",
      "2. Filtrer par 'Stock critique'",
      "3. Pour chaque produit :",
      "   - Cliquer sur 'Réapprovisionner'",
      "   - Ou modifier manuellement le stock",
      "4. Enregistrer les changements"
    ]
  },
  "common_issues": {
    "login_failed": {
      "causes": ["Email/mot de passe incorrect", "Compte non vérifié", "Compte suspendu"],
      "solutions": [
        "Vérifier les informations de connexion",
        "Vérifier l'email pour le code de vérification",
        "Contacter le SuperAdmin si compte suspendu"
      ]
    },
    "low_stock": {
      "causes": ["Ventes élevées", "Réapprovisionnement tardif"],
      "solutions": [
        "Aller dans Produits > Stock critique",
        "Utiliser le bouton 'Réapprovisionner'",
        "Créer une commande fournisseur"
      ]
    },
    "sale_error": {
      "causes": ["Stock insuffisant", "Problème de connexion"],
      "solutions": [
        "Vérifier le stock disponible",
        "Actualiser la page",
        "Vérifier la connexion internet"
      ]
    }
  }
}
```

---

### Étape 4 : Modifier les Prompts IA pour Intégrer le Contexte

Dans `aiController.js`, mettre à jour les prompts :

```javascript
// Charger le contexte de l'application
const appContext = require('../utils/ai-context.json');

// Dans getAIInsights et chatAI, ajouter le contexte
const systemInstruction = `
Tu es LUMO Assistant, l'assistant IA expert de HubCommerce Pro.

CONTEXTE DE L'APPLICATION :
${JSON.stringify(appContext, null, 2)}

INFORMATIONS BOUTIQUE ACTUELLE :
- Nom : ${req.user.entreprise?.nom || 'Ma Boutique'}
- Type d'activité : ${req.user.typeActivite || 'Commerce général'}
- Utilisateur : ${req.user.nom}
- Email : ${req.user.email}

DONNÉES ACTUELLES :
- Produits : ${products.length} articles en stock
- Ventes récentes : ${sales.length} transactions
- Chiffre d'affaires : ${totalRevenue.toLocaleString()} FC
- Alertes stock : ${lowStock.length} produits critiques

RÈGLES DE RÉPONSE :
1. Toujours répondre en français
2. Utiliser les termes exacts de l'interface (boutons, menus)
3. Fournir des instructions étape par étape quand demandé
4. Baser les suggestions sur les données réelles de la boutique
5. Être concis et orienté solutions
6. Mentionner les boutons spécifiques à utiliser
`;
```

---

### Étape 5 : Améliorer le Chat IA pour le Guidage Utilisateur

```javascript
// Ajouter cette fonction dans aiController.js
const getHelpGuide = async (req, res) => {
  try {
    const { topic } = req.query;
    const appContext = require('../utils/ai-context.json');
    
    let guideContent;
    
    switch(topic) {
      case 'new_sale':
        guideContent = `
        **Guide : Créer une nouvelle vente**
        
        ${appContext.workflows.new_sale.join('\n')}
        
        **Astuces** :
        - Utilisez le scanner de code-barres pour plus de rapidité
        - Le bouton 'Finaliser' calcule automatiquement le total
        - Vous pouvez ajouter plusieurs modes de paiement
        `;
        break;
        
      case 'stock_management':
        guideContent = `
        **Guide : Gérer le stock**
        
        1. Allez dans "Produits" depuis le menu principal
        2. Utilisez le filtre "Stock critique" pour voir les produits à réapprovisionner
        3. Pour chaque produit :
           - Cliquez sur "Réapprovisionner" pour une commande rapide
           - Ou cliquez sur "Modifier" pour ajuster manuellement
        4. N'oubliez pas de sauvegarder
        
        **Boutons utiles** :
        - ${appContext.modules.products.buttons.add_product}
        - ${appContext.modules.products.buttons.bulk_import}
        - ${appContext.modules.products.buttons.print_barcode}
        `;
        break;
        
      default:
        guideContent = `
        **Bienvenue dans l'assistance HubCommerce Pro**
        
        Voici les principales sections :
        ${Object.entries(appContext.modules).map(([name, module]) => 
          `- **${module.description}** : ${module.features.join(', ')}`
        ).join('\n')}
        
        Dites-moi ce dont vous avez besoin d'aide !
        `;
    }
    
    res.json({
      guide: guideContent,
      suggested_actions: Object.values(appContext.modules).flatMap(module => 
        Object.entries(module.buttons).map(([key, desc]) => ({ key, desc }))
      ).slice(0, 10)
    });
    
  } catch (error) {
    res.status(500).json({ message: "Service d'aide temporairement indisponible" });
  }
};

module.exports = { getAIInsights, chatAI, getHelpGuide };
```

---

### Étape 6 : Créer une Route pour le Guide

Dans `server/routes/aiRoutes.js` :

```javascript
const express = require('express');
const router = express.Router();
const { getAIInsights, chatAI, getHelpGuide } = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.get('/insights', auth, getAIInsights);
router.post('/chat', auth, chatAI);
router.get('/help', auth, getHelpGuide); // Nouvelle route

module.exports = router;
```

---

### Étape 7 : Intégrer au Frontend

#### Dans votre composant de chat IA (ex: `client/src/components/AIChat.tsx`) :

```tsx
const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [helpTopics, setHelpTopics] = useState([]);
  
  // Charger les sujets d'aide
  useEffect(() => {
    const fetchHelpTopics = async () => {
      try {
        const res = await axios.get('/api/ai/help');
        setHelpTopics(res.data.suggested_actions || []);
      } catch (err) {
        console.error('Failed to load help topics', err);
      }
    };
    fetchHelpTopics();
  }, []);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const res = await axios.post('/api/ai/chat', {
        message: input,
        history: messages
      });
      
      const aiMessage = { role: 'assistant', content: res.data.response };
      setMessages(prev => [...prev, aiMessage]);
      setInput('');
    } catch (err) {
      toast.error('Erreur de connexion à l\'assistant');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getHelp = async (topic) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/ai/help?topic=${topic}`);
      const aiMessage = { role: 'assistant', content: res.data.guide };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      toast.error('Impossible de charger l\'aide');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <h3>🤖 LUMO Assistant</h3>
        <p>Comment puis-je vous aider avec HubCommerce ?</p>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <Markdown>{msg.content}</Markdown>
          </div>
        ))}
        {isLoading && <div className="message assistant">
          <TypingIndicator />
        </div>}
      </div>
      
      <div className="quick-help">
        <h4>Aide rapide :</h4>
        <div className="help-buttons">
          {helpTopics.map((topic, i) => (
            <button key={i} onClick={() => getHelp(topic.key)}>
              {topic.desc}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Demandez de l'aide sur une fonctionnalité..."
        />
        <button onClick={handleSend} disabled={isLoading}>
          {isLoading ? '...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
};
```

---

### Étape 8 : Ajouter un Bouton d'Aide Contextuelle

Dans votre composant principal (`App.tsx` ou layout) :

```tsx
const App = () => {
  const [showAIHelp, setShowAIHelp] = useState(false);
  const location = useLocation();
  
  // Détecter la page actuelle pour suggestions contextuelles
  const getContextualHelp = () => {
    const path = location.pathname;
    
    if (path.includes('/sales')) {
      return "Besoin d'aide avec les ventes ? Demandez comment finaliser une transaction !";
    } else if (path.includes('/products')) {
      return "Gérez votre stock facilement - demandez comment ajouter des produits !";
    } else if (path.includes('/dashboard')) {
      return "Comprenez vos statistiques - demandez une analyse détaillée !";
    }
    return "Comment puis-je vous aider avec HubCommerce Pro ?";
  };
  
  return (
    <>
      {/* ... votre layout existant ... */}
      
      <button
        className="floating-ai-help"
        onClick={() => setShowAIHelp(!showAIHelp)}
        title="Aide intelligente"
      >
        🤖
      </button>
      
      {showAIHelp && (
        <div className="ai-help-modal">
          <AIChat />
          <button
            className="close-help"
            onClick={() => setShowAIHelp(false)}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="contextual-help-hint">
        {getContextualHelp()}
      </div>
    </>
  );
};
```

---

### Étape 9 : Tester et Affiner

1. **Tester les fonctionnalités** :
   ```bash
   # Démarrer le backend
   cd server && npm run dev
   
   # Dans un autre terminal, démarrer le frontend
   cd client && npm run dev
   ```

2. **Vérifier que l'IA comprend bien** :
   - Demander "Comment créer une nouvelle vente ?"
   - Demander "Quels sont les boutons disponibles dans les produits ?"
   - Demander "Quelles sont mes données actuelles ?"

3. **Affiner les réponses** :
   - Ajuster les prompts dans `aiController.js`
   - Enrichir le `ai-context.json` avec plus de détails
   - Ajouter des exemples de conversations

---

### Étape 10 : Déploiement

1. **Sur votre serveur de production** :
   ```bash
   # Installer Ollama
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Télécharger le modèle
   ollama pull llama3
   
   # Démarrer Ollama en service
   sudo systemctl enable ollama
   sudo systemctl start ollama
   ```

2. **Configurer PM2 pour le backend** :
   ```bash
   npm install -g pm2
   pm2 start server.js --name hubcommerce-api
   pm2 save
   pm2 startup
   ```

3. **Vérifier les logs** :
   ```bash
   pm2 logs hubcommerce-api
   journalctl -u ollama -f
   ```

---

## 💡 Bonnes Pratiques pour un Assistant Efficace

1. **Mises à jour du contexte** :
   - Mettez à jour `ai-context.json` à chaque nouvelle fonctionnalité
   - Documentez les nouveaux boutons et flux

2. **Feedback utilisateur** :
   - Ajoutez un bouton "Cette réponse était utile ? ✅/❌"
   - Stockez les feedbacks pour améliorer les prompts

3. **Fallback intelligent** :
   ```javascript
   // Dans aiController.js, ajouter un fallback vers Mistral si Ollama échoue
   const getClient = () => {
     const useOllama = process.env.AI_PROVIDER === 'ollama';
     
     if (useOllama) {
       return new OpenAI({
         baseURL: "http://localhost:11434/v1",
         apiKey: "ollama"
       });
     } else {
       return new OpenAI({
         apiKey: process.env.MISTRAL_API_KEY,
         baseURL: "https://api.mistral.ai/v1"
       });
     }
   };
   ```

4. **Cache des réponses fréquentes** :
   - Cachez les réponses aux questions courantes (Redis)
   - Réduisez la charge sur le modèle IA

---

## 📚 Exemples de Requêtes que l'IA Doit Comprendre

### Questions sur l'interface :
- "Comment ajouter un nouveau produit ?"
- "Où trouver le bouton pour exporter les ventes ?"
- "Comment changer la devise de ma boutique ?"

### Questions sur les données :
- "Quels sont mes produits les plus vendus ce mois-ci ?"
- "Quel est mon chiffre d'affaires aujourd'hui ?"
- "Quels produits sont en stock critique ?"

### Demandes d'analyse :
- "Donne-moi 3 suggestions pour augmenter mes ventes"
- "Analyse ma rentabilité sur les 30 derniers jours"
- "Quels produits devrais-je mettre en promotion ?"

### Guidage pas-à-pas :
- "Guide-moi pour créer ma première vente"
- "Explique-moi comment gérer les dettes clients"
- "Montre-moi comment générer un rapport mensuel"

---

## 🎓 Formation Continue de l'IA

Pour que l'IA s'améliore avec le temps :

1. **Journal des interactions** :
   ```javascript
   // Stockez les conversations (avec consentement)
   const conversationLog = {
     userId: req.user.id,
     timestamp: new Date(),
     question: message,
     response: response.choices[0].message.content,
     context: {
       productsCount: products.length,
       salesCount: sales.length
     }
   };
   // Sauvegardez dans une base de données
   ```

2. **Apprentissage continu** :
   - Utilisez les logs pour identifier les questions fréquentes
   - Améliorez le contexte en conséquence
   - Fine-tunez le modèle avec vos données (optionnel)

3. **Mises à jour régulières** :
   ```bash
   # Mettre à jour Ollama et les modèles
   ollama pull llama3:latest
   ```

---

## ⚠️ Limitations et Solutions

### Problèmes courants :

1. **L'IA ne comprend pas une fonctionnalité** :
   - Solution : Ajoutez-la dans `ai-context.json`

2. **Réponses trop génériques** :
   - Solution : Ajoutez plus de détails dans les prompts

3. **Performances lentes** :
   - Solution : Utilisez un modèle plus petit (ex: llama3:8b)
   - Ou ajoutez du caching

4. **Mémoire limitée** :
   - Solution : Résumez l'historique des conversations

---

## 🚀 Prochaines Étapes Recommandées

1. **Implémenter la solution Ollama** en suivant ce guide
2. **Tester avec des utilisateurs réels** et collecter des feedbacks
3. **Ajouter un système de notation** des réponses
4. **Intégrer avec votre documentation** existante
5. **Automatiser les mises à jour** du contexte

---

**Félicitations !** 🎉 Vous avez maintenant un assistant IA complet qui :
- Connaît parfaitement votre application
- Guide les utilisateurs efficacement
- Fonctionne gratuitement et localement
- S'améliore avec le temps

Pour toute question sur l'implémentation, demandez ! 🤖