const OpenAI = require("openai");
const { Sale, Product, User, Client, Fournisseur, Purchase, GlobalSetting, StaffPayment } = require("../models");

const redis = require("../utils/redis");

const getClient = () => {
    const provider = process.env.AI_PROVIDER || "deepseek";
    
    if (provider === "ollama") {
        return new OpenAI({
            apiKey: "ollama", // Non requis pour Ollama mais attendu par l'SDK
            baseURL: process.env.OLLAMA_URL || "http://localhost:11434/v1",
        });
    }

    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("DEEPSEEK_API_KEY non configurée dans .env");
    
    return new OpenAI({
        apiKey: key,
        baseURL: "https://api.deepseek.com",
    });
};

const MODEL = process.env.AI_MODEL || (process.env.AI_PROVIDER === "ollama" ? "llama3" : "deepseek-chat");

// ─────────────────────────────────────────────────────────────────────────────
// Construit la "Base de Connaissance Complète" de l'utilisateur pour LUMO
// C'est le cerveau de LUMO — il reçoit TOUT ici avant chaque conversation
// ─────────────────────────────────────────────────────────────────────────────
const buildLumoKnowledge = async (userId, user) => {
    // 1. Récupérer toutes les données en parallèle pour la performance
    const [products, sales, staffPayments, clients, fournisseurs, purchases, globalSettings] = await Promise.all([
        Product.findAll({ where: { userId }, attributes: ['nom', 'stock', 'stockAlerte', 'prix', 'prixAchat', 'devise'] }),
        Sale.findAll({ where: { userId }, limit: 30, order: [['createdAt', 'DESC']], attributes: ['montantTotal', 'createdAt', 'methodePaiement', 'devise'] }),
        StaffPayment.findAll({ where: { userId }, limit: 20, order: [['createdAt', 'DESC']], attributes: ['amount', 'devise', 'type'] }),
        Client.findAll({ where: { userId }, order: [['nom', 'ASC']], attributes: ['nom', 'telephone', 'detteTotale'] }),
        Fournisseur.findAll({ where: { userId }, order: [['entreprise', 'ASC']], attributes: ['entreprise', 'nom', 'telephone'] }),
        Purchase.findAll({ where: { userId }, limit: 20, order: [['createdAt', 'DESC']], attributes: ['montantTotal'] }),
        GlobalSetting.findAll()
    ]);

    // 2. Traitement des données
    const totalStock = products.reduce((acc, p) => acc + parseInt(p.stock || 0, 10), 0);
    const lowStockProducts = products.filter(p => parseInt(p.stock || 0, 10) <= parseInt(p.stockAlerte || 5, 10));
    const totalRevenueSales = sales.reduce((acc, s) => acc + parseFloat(s.montantTotal || 0), 0);
    const totalDebtClients = clients.reduce((acc, c) => acc + parseFloat(c.detteTotale || 0), 0);
    const totalStaffExpenses = staffPayments.reduce((acc, sp) => acc + parseFloat(sp.amount || 0), 0);

    // Top 5 produits par valeur de stock
    const topProductsByStock = [...products]
        .sort((a, b) => (b.stock || 0) - (a.stock || 0))
        .slice(0, 10)
        .map(p => `${p.nom} (stock: ${p.stock}, prix: ${p.prix || 'N/A'} ${p.devise || 'CDF'})`)
        .join('\n  ');

    // Formatage produits en alerte
    const lowStockList = lowStockProducts.length > 0
        ? lowStockProducts.slice(0, 20).map(p => `  - ${p.nom}: ${p.stock} restants (seuil: ${p.stockAlerte || 5})`).join('\n')
        : '  Aucun produit en alerte.';

    // Formatage clients avec dettes
    const clientsWithDebt = clients.filter(c => parseFloat(c.detteTotale || 0) > 0);
    const clientsList = clients.slice(0, 30).map(c => 
        `  - ${c.nom}${c.telephone ? ` (Tél: ${c.telephone})` : ''}${parseFloat(c.detteTotale) > 0 ? ` ⚠️ Dette: ${parseFloat(c.detteTotale).toLocaleString()} FC` : ''}`
    ).join('\n');

    // Formatage fournisseurs
    const fournisseursList = fournisseurs.slice(0, 20).map(f =>
        `  - ${f.entreprise} (Contact: ${f.nom})${f.telephone ? `, Tél: ${f.telephone}` : ''}`
    ).join('\n');

    // Ventes récentes
    const recentSalesList = sales.slice(0, 10).map(s => {
        const date = new Date(s.createdAt).toLocaleDateString('fr-FR');
        return `  - ${date}: ${(s.montantTotal || 0).toLocaleString()} ${s.devise || 'FC'}${s.methodePaiement ? ` (${s.methodePaiement})` : ''}`;
    }).join('\n');



    // Paramètres globaux
    const settingsMap = {};
    globalSettings.forEach(s => { settingsMap[s.key] = s.value; });
    const exchangeRate = settingsMap['exchange_rate'] || settingsMap['tauxChange'] || '2800';
    const shopName = settingsMap['shop_name'] || settingsMap['nomBoutique'] || user.entreprise?.nom || 'votre boutique';

    const staffExpensesText = staffPayments.length > 0
        ? staffPayments.slice(0, 5).map(sp => `  - Paiement: ${sp.amount} ${sp.devise} (${sp.type})`).join('\n')
        : '  Aucun paiement de personnel récent.';

    // 3. Construire le systemInstruction complet
    const systemInstruction = `Tu es LUMO, l'assistant IA intégré de la plateforme LUMO Pro.
Tu as accès en temps réel à TOUTES les données de la boutique "${shopName}".
Utilisateur connecté : ${user.nom || user.name || 'Administrateur'} | Rôle : ${user.role || 'admin'} | Activité : ${user.typeActivite || 'Commerce général'}.

━━━━━━━━━━ 📦 INVENTAIRE COMPLET ━━━━━━━━━━
Total produits : ${products.length} articles | Total unités en stock : ${totalStock.toLocaleString()}

Top produits (par stock) :
  ${topProductsByStock || 'Aucun produit enregistré.'}

⚠️ PRODUITS EN ALERTE DE STOCK (${lowStockProducts.length}) :
${lowStockList}

━━━━━━━━━━ 👥 CLIENTS (${clients.length} total) ━━━━━━━━━━
${clientsList || '  Aucun client enregistré.'}

━━━━━━━━━━ 💰 FINANCES & STAFF ━━━━━━━━━━
Dette totale clients : ${totalDebtClients.toLocaleString()} FC
Total paiements personnel : ${totalStaffExpenses.toLocaleString()} ${user.entreprise?.devise || 'CDF'}
Paiements récents :
${staffExpensesText}

💳 Clients avec dettes : ${clientsWithDebt.length} clients | Dette totale : ${totalDebtClients.toLocaleString()} FC

━━━━━━━━━━ 🏭 FOURNISSEURS (${fournisseurs.length} total) ━━━━━━━━━━
${fournisseursList || '  Aucun fournisseur enregistré.'}

━━━━━━━━━━ 💰 FINANCES RÉCENTES ━━━━━━━━━━
CA (${sales.length} dernières ventes) : ${totalRevenueSales.toLocaleString()} FC
Taux de change : 1 USD = ${exchangeRate} CDF

Détail des dernières ventes :
${recentSalesList || '  Aucune vente récente.'}



━━━━━━━━━━ 🛠️ DOCUMENTATION COMPLÈTE DES MODULES ━━━━━━━━━━

=== MODULE 1 : 🏠 DASHBOARD ===
Rôle : Vue d'ensemble instantanée de la santé du commerce.
Fonctionnalités disponibles :
- KPIs du jour (CA, ventes, dépenses, bénéfice net)
- Graphiques de ventes sur 7/30 jours
- Alertes automatiques (stock bas ≤ 5 unités)
- Suggestions IA (3 recommandations stratégiques de LUMO)
- Accès rapide aux autres modules
Comment y accéder : Menu latéral gauche > icône maison

=== MODULE 2 : 🛒 POS (POINT DE VENTE / CAISSE) ===
Rôle : Interface de vente au comptoir pour le caissier.
Fonctionnalités disponibles :
- Recherche produit par nom ou référence (saisie texte)
- Ajout au panier avec gestion des quantités
- Paiement en CDF ou USD (conversion automatique selon taux de change configuré)
- Modes de paiement : Cash, M-Pesa, Orange Money, Airtel Money, Virement
- Impression de ticket de caisse (PDF ou imprimante thermique)
- Gestion des sessions de caisse (ouverture/fermeture avec solde)
- Vente à crédit (dette enregistrée automatiquement sur le client)
Comment y accéder : Menu latéral > icône panier/caisse
Règles métier : Le stock se met à jour automatiquement après chaque vente.

=== MODULE 3 : 📦 PRODUITS ===
Rôle : Gestion du catalogue complet de la boutique.
Fonctionnalités disponibles :
- Ajouter un nouveau produit (nom, référence, catégorie, prix achat, prix vente, stock, seuil d'alerte)
- Modifier un produit existant
- Supprimer un produit (soft delete)
- Upload d'image produit (via Cloudinary)
- Filtrage par catégorie, tri par stock ou prix
- Alertes visuelles sur produits en stock critique
- Pagination (liste par pages)
Comment ajouter un produit : Produits > bouton "Nouveau produit" > remplir le formulaire > Enregistrer
Champs obligatoires : nom, prix de vente, stock initial

=== MODULE 4 : 📊 VENTES ===
Rôle : Historique complet de toutes les transactions de vente.
Fonctionnalités disponibles :
- Liste de toutes les ventes avec filtre par date, vendeur, mode de paiement
- Détail de chaque vente (articles vendus, montant, client, vendeur)
- Suppression d'une vente (admin uniquement)
- Export possible
- Calcul automatique du CA par période

=== MODULE 5 : 🛍️ ACHATS (APPROVISIONNEMENT) ===
Rôle : Enregistrer les achats effectués auprès des fournisseurs.
Fonctionnalités disponibles :
- Enregistrer un achat (fournisseur, produits, quantités, prix unitaire)
- Le stock se met à jour automatiquement à la réception
- Historique des achats par fournisseur
- Gestion des dettes fournisseurs (achat à crédit)

=== MODULE 6 : 👥 CLIENTS (CRM) ===
Rôle : Gestion de la relation client, historique et fidélité.
Fonctionnalités disponibles :
- Fiche client complète (nom, téléphone, email, adresse)
- Historique de tous les achats du client
- Suivi de la dette totale (montant dû par le client)
- Points de fidélité (système de récompense)
- Recherche et filtre par nom ou téléphone
Comment ajouter un client : Clients > "Nouveau client" > remplir fiche > Enregistrer

=== MODULE 7 : 🏭 FOURNISSEURS ===
Rôle : Annuaire et gestion des relations fournisseurs.
Fonctionnalités disponibles :
- Fiche fournisseur (nom entreprise, contact, téléphone, email, catégorie)
- Historique des commandes passées
- Suivi des dettes envers les fournisseurs
- Recherche et filtrage

=== MODULE 9 : 🤖 LUMO IA ===
Rôle : Assistant stratégique intelligent (c'est moi).
Fonctionnalités disponibles :
- Chat en langage naturel avec l'assistant
- Analyse du stock et recommandations de réapprovisionnement
- Analyse financière et conseils de rentabilité
- Guidage dans les fonctionnalités de l'application
- Synchronisation en temps réel avec toutes les données
- Historique de conversation persistant

=== MODULE 10 : 📈 STATISTIQUES ===
Rôle : Tableaux de bord analytiques avancés.
Fonctionnalités disponibles :
- Graphiques de CA par jour/semaine/mois
- Analyse des marges bénéficiaires par produit
- Top produits les plus vendus
- Comparaison de périodes
- Graphiques de dépenses par catégorie
- Statistiques clients (meilleurs clients, fréquence d'achat)

=== MODULE 11 : 🔔 NOTIFICATIONS ===
Rôle : Système d'alertes en temps réel (Socket.IO).
Types d'alertes :
- Stock bas (automatique quand stock ≤ seuil configuré)
- Nouvelle vente enregistrée
- Paiement reçu
- Messages système de l'administrateur
Les notifications apparaissent en temps réel sans rechargement de page.

=== MODULE 12 : ⚙️ PARAMÈTRES ===
Rôle : Configuration complète de l'application.
Sections disponibles :
- Profil : nom, email, téléphone, photo de profil
- Boutique : nom de l'enseigne, logo, adresse, type d'activité
- Interface : thème (clair/sombre/système), langue (FR/EN/LN/SW)
- Modules : activation/désactivation de chaque module de l'application
- IA : configuration de l'assistant LUMO
- Équipe : ajout/gestion des membres de l'équipe avec permissions
- Sécurité : changement de mot de passe, authentification 2FA
- Sauvegarde : export manuel de la base de données, restauration

=== MODULE 13 : 👑 SUPER ADMIN ===
Rôle : Panneau de gestion globale de la plateforme (accès restreint).
Fonctionnalités disponibles :
- Voir toutes les instances (tous les commerçants inscrits)
- Valider / Suspendre / Supprimer des comptes utilisateurs
- Voir tous les logs d'activité globaux
- Paramètres globaux du système
- Envoi de notifications broadcast à tous les utilisateurs
- Statistiques globales de la plateforme

━━━━━━━━━━ 👥 RÔLES ET PERMISSIONS ━━━━━━━━━━

=== RÔLE : SUPERADMIN ===
Description : Propriétaire de la plateforme LUMO Pro. Accès total à tout.
Permissions : TOUTES
Accès spécial : Module Super Admin, paramètres globaux, gestion de tous les comptes

=== RÔLE : ADMIN ===
Description : Propriétaire d'une boutique. Gère tout son commerce.
Permissions :
- Gérer les produits (créer, modifier, supprimer)
- Gérer les ventes et l'historique
- Gérer les clients et fournisseurs
- Accès aux statistiques complètes
- Gérer l'équipe (ajouter/supprimer des membres)
- Configurer les paramètres de la boutique
- Accès à LUMO IA
- Lancer les sauvegardes

=== RÔLE : MANAGER ===
Description : Gestionnaire délégué par l'admin. Gère les opérations quotidiennes.
Permissions :
- Accès Dashboard et statistiques
- Gérer les ventes et le POS
- Gérer les produits et le stock
- Gérer les clients
- Voir les rapports
- Gérer l'équipe (selon permission accordée)
- Pas d'accès aux paramètres sensibles

=== RÔLE : CASHIER (CAISSIER) ===
Description : Employé limité à l'encaissement.
Permissions :
- Accès au POS uniquement (effectuer des ventes)
- Voir la liste des produits
- Voir les clients pour la vente à crédit
- Pas d'accès aux statistiques, paramètres, ou gestion

━━━━━━━━━━ ⚡ ACTIONS QUE JE PEUX INITIER ━━━━━━━━━━
Je peux GUIDER l'utilisateur pour effectuer ces actions dans l'application :
- AJOUTER un produit → Je donne les champs requis et le chemin exact
- CHERCHER un produit → Je cherche dans les données et donne l'info
- CRÉER une vente → Je guide vers le POS et explique comment

- AJOUTER un client → Je guide vers le module Clients
- CONSULTER les dettes → Je liste les clients débiteurs depuis mes données
- ANALYSER le stock → Je fournis une analyse avec les vrais chiffres
- EXPLIQUER une fonctionnalité → Je donne le guide pas à pas

━━━━━━━━━━ 📋 RÈGLES DE RÉPONSE ━━━━━━━━━━
- Utilise TOUJOURS les vraies données dynamiques pour répondre.
- Pour les questions sur les produits/clients/dettes, cite les vrais noms et chiffres.
- Pour guider l'utilisateur dans l'app, dis EXACTEMENT où cliquer (menu > section > bouton).
- Quand l'utilisateur veut faire une action, guide-le étape par étape.
- Si l'utilisateur demande "comment faire X", donne un guide numéroté clair.
- Réponds en français, de façon concise et professionnelle.
- Si l'info n'est pas disponible dans le contexte, dis-le clairement.`;

    return { systemInstruction, products, sales, clients, fournisseurs };
};

// ─────────────────────────────────────────────────────────────────────────────
// Insights IA pour le Dashboard (résumé stratégique)
// ─────────────────────────────────────────────────────────────────────────────
const getAIInsights = async (req, res, next) => {
    try {
        const client = getClient();
        const userId = req.user.id;
        
        // 1. Tenter de récupérer le cache Redis
        const cacheKey = `ai:insights:${userId}`;
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const user = await User.findByPk(userId);
        const { systemInstruction, products, sales } = await buildLumoKnowledge(userId, user);

        const totalRevenue = sales.reduce((acc, s) => acc + (s.montantTotal || 0), 0);
        const lowStock = products.filter(p => (p.stock || 0) <= (p.stockAlerte || 5));
        
        const productStats = {};
        sales.forEach(sale => {
            (sale.articles || []).forEach(art => {
                productStats[art.nom] = (productStats[art.nom] || 0) + art.quantite;
            });
        });
        const topProducts = Object.entries(productStats)
            .sort(([,a], [,b]) => b - a).slice(0, 3)
            .map(([name, qty]) => `${name} (${qty} vendus)`);

        const prompt = `Analyse les données de ce commerce et fournis 3 suggestions tactiques concrètes.

RÉSUMÉ :
- ${products.length} produits, ${lowStock.length} en stock critique.
- CA: ${totalRevenue.toLocaleString()} FC.
- Top produits: ${topProducts.join(', ') || 'Données insuffisantes'}.

Génère exactement ce JSON (sans markdown) :
{"suggestions":[{"type":"stock"|"sales"|"pricing","title":"Titre court","desc":"Description précise","impact":"Ex: +15% de CA"}],"analysis":"Résumé stratégique global"}`;

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            response_format: { type: 'json_object' }
        });

        const aiData = JSON.parse(response.choices[0].message.content);
        
        // Mettre en cache pour 30 minutes
        await redis.set(cacheKey, JSON.stringify(aiData), 'EX', 1800);
        
        res.json(aiData);

    } catch (error) {
        console.error("AI Insights Error:", error.message);
        const productsCount = await Product.count({ where: { userId: req.user.id } });
        const sales = await Sale.findAll({ where: { userId: req.user.id }, limit: 10 });
        const revenue = sales.reduce((acc, s) => acc + s.montantTotal, 0);

        res.json({
            suggestions: [
                { type: "stock", title: "Gestion des Alertes", desc: "Vérifiez vos produits en stock critique.", impact: "Évite les ruptures" },
                { type: "sales", title: "Focus Performance", desc: `CA récent de ${revenue.toLocaleString()} FC.`, impact: "Optimisation" },
                { type: "pricing", title: "Analyse Stratégique", desc: `Commerce avec ${productsCount} produits enregistrés.`, impact: "Cohérence prix" }
            ],
            analysis: "Le moteur LUMO est en cours de recalibrage. Les données affichées sont basées sur vos statistiques actuelles."
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Historique du chat
// ─────────────────────────────────────────────────────────────────────────────
const getChatHistory = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json(user?.chatHistory || []);
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Chat principal LUMO — avec connaissance complète de l'application
// ─────────────────────────────────────────────────────────────────────────────
const chatAI = async (req, res, next) => {
    let client;
    let isOfflineMode = false;
    try {
        client = getClient();
    } catch (e) {
        console.warn("LUMO Mode Hors-Ligne activé: Clé API non configurée.");
        isOfflineMode = true;
    }

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Message requis" });

        const userId = req.user.id;
        const user = await User.findByPk(userId);
        const savedHistory = user.chatHistory || [];

        // Construire la connaissance complète (c'est le moteur)
        const { systemInstruction } = await buildLumoKnowledge(userId, user);

        const chatHistory = [
            { role: "system", content: systemInstruction },
            ...savedHistory.map(h => ({ role: h.role, content: h.content }))
        ];
        chatHistory.push({ role: "user", content: message });

        // Streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        if (isOfflineMode) {
            // Simulation de réponse fluide (Mode Hors-ligne)
            const fallbackMsg = "Bonjour ! Je suis LUMO, votre assistant LUMO. Je suis actuellement en mode **Hors-Ligne** (Clé API non configurée). Mais je peux voir que vous êtes prêt pour votre soutenance ! Configurez la clé API DeepSeek dans les paramètres pour activer mes pleines capacités d'analyse et accéder à vos statistiques en temps réel.";
            let fullResponse = "";
            const words = fallbackMsg.split(' ');
            
            for (let i = 0; i < words.length; i++) {
                const text = words[i] + (i === words.length - 1 ? '' : ' ');
                fullResponse += text;
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                await new Promise(r => setTimeout(r, 80)); // Simule la latence réseau (effet machine à écrire)
            }
            
            // Sauvegarder l'historique même en mode hors-ligne
            const newHistory = [...savedHistory, { role: "user", content: message }, { role: "assistant", content: fullResponse }];
            if (newHistory.length > 30) newHistory.splice(0, newHistory.length - 30);
            user.chatHistory = newHistory;
            await user.save();

            res.write('data: [DONE]\n\n');
            return res.end();
        }

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: chatHistory,
            stream: true,
        });

        let fullResponse = "";

        for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
                fullResponse += text;
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }

        // Sauvegarde de l'historique (limité à 30 messages)
        const newHistory = [...savedHistory, { role: "user", content: message }, { role: "assistant", content: fullResponse }];
        if (newHistory.length > 30) newHistory.splice(0, newHistory.length - 30);
        user.chatHistory = newHistory;
        await user.save();

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("AI Chat Error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "LUMO Assistant est temporairement indisponible." });
        } else {
            res.write(`data: ${JSON.stringify({ error: "Erreur de génération" })}\n\n`);
            res.end();
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Chat Public pour la Landing Page (Prospects)
// ─────────────────────────────────────────────────────────────────────────────
const publicChatAI = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Message requis" });

        let client;
        try {
            client = getClient();
        } catch (e) {
            // Mode dégradé si pas de clé
            res.setHeader("Content-Type", "text/event-stream");
            res.write(`data: ${JSON.stringify({ text: "Bonjour ! Je suis LUMO. L'assistant de démonstration est actuellement en mode maintenance, mais n'hésitez pas à créer un compte pour tester mes capacités réelles !" })}\n\n`);
            res.write('data: [DONE]\n\n');
            return res.end();
        }

        const systemInstruction = `Tu es LUMO, l'assistant commercial intelligent de la plateforme LUMO Pro.
Ton but est de renseigner les PROSPECTS sur les fonctionnalités du logiciel.
LUMO est une plateforme ERP moderne pour les boutiques en Afrique, gérant les ventes, le stock, les achats, les clients et le multi-devises (USD/CDF).
Sois convaincant, professionnel et aide-les à comprendre pourquoi LUMO est le meilleur choix pour leur boutique.
Ne mentionne aucune donnée utilisateur spécifique car tu es en mode démonstration publique.`;

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: message }
            ],
            stream: true,
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("Public AI Chat Error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Indisponible" });
        } else {
            res.end();
        }
    }
};

module.exports = { getAIInsights, chatAI, getChatHistory, publicChatAI };
