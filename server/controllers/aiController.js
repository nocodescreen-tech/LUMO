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
    // Taux de change : priorité aux préférences de l'utilisateur connecté
    const exchangeRate = user.preferences?.exchangeRate 
        || user.entreprise?.exchangeRate 
        || 2800;
    const shopName = user.entreprise?.nom || 'votre boutique';
    const shopCurrency = user.entreprise?.devise || 'CDF';

    const totalStock = products.reduce((acc, p) => acc + parseInt(p.stock || 0, 10), 0);
    const lowStockProducts = products.filter(p => parseInt(p.stock || 0, 10) <= parseInt(p.stockAlerte || 5, 10));

    // CA par devise (important : montantTotal est dans la devise de la vente)
    const salesByCurrency = {};
    sales.forEach(s => {
        const dev = (s.devise || 'CDF').toUpperCase();
        salesByCurrency[dev] = (salesByCurrency[dev] || 0) + parseFloat(s.montantTotal || 0);
    });
    const caText = Object.entries(salesByCurrency)
        .map(([dev, total]) => `${total.toLocaleString()} ${dev}`)
        .join(' + ') || '0 CDF';
    // CA total converti en CDF pour référence
    const totalRevenueCDF = Object.entries(salesByCurrency).reduce((acc, [dev, total]) => {
        return acc + (convertCurrency(total, dev, 'CDF', exchangeRate));
    }, 0);

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



    const staffExpensesText = staffPayments.length > 0
        ? staffPayments.slice(0, 5).map(sp => `  - Paiement: ${sp.amount} ${sp.devise} (${sp.type})`).join('\n')
        : '  Aucun paiement de personnel récent.';

    // 3. Construire le systemInstruction complet
    const systemInstruction = `Tu es LUMO, l'assistant IA intégré de la plateforme LUMO Pro.
Tu as accès en temps réel à TOUTES les données de la boutique "${shopName}".
Utilisateur connecté : ${user.nom || user.name || 'Administrateur'} | Rôle : ${user.role || 'admin'} | Activité : ${user.typeActivite || 'Commerce général'} | Devise principale : ${shopCurrency}.
⚠️ IMPORTANT : Les montants des ventes sont TOUJOURS dans la devise de la vente (USD ou CDF). Ne mélange JAMAIS ces devises. Utilise le taux de change 1 USD = ${exchangeRate} CDF fourni par l'utilisateur pour les conversions.

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
CA (${sales.length} dernières ventes) : ${caText} ≈ ${totalRevenueCDF.toLocaleString()} CDF total
Taux de change configuré par l'utilisateur : 1 USD = ${exchangeRate} CDF

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
- Réponds TOUJOURS en ${user.preferences?.language === 'en' ? 'anglais (English)' : 'français (French)'}, de façon concise et professionnelle.
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
        const lang = (req.query.lang || 'fr').toLowerCase();
        
        // 1. Tenter de récupérer le cache Redis (incluant la langue)
        const cacheKey = `ai:insights:${userId}:${lang}`;
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const user = await User.findByPk(userId);
        const { systemInstruction, products, sales } = await buildLumoKnowledge(userId, user);

        // ✅ FIX : Calcul du CA par devise (comme buildLumoKnowledge le fait déjà)
        const exchangeRate = user.preferences?.exchangeRate || user.entreprise?.exchangeRate || 2800;
        const shopCurrency = (user.entreprise?.devise || 'CDF').toUpperCase();
        const salesByCurrency = {};
        sales.forEach(s => {
            const dev = (s.devise || shopCurrency).toUpperCase();
            salesByCurrency[dev] = (salesByCurrency[dev] || 0) + parseFloat(s.montantTotal || 0);
        });
        const caText = Object.entries(salesByCurrency)
            .map(([dev, total]) => `${total.toLocaleString()} ${dev}`)
            .join(' + ') || `0 ${shopCurrency}`;
        const totalRevenueCDF = Object.entries(salesByCurrency).reduce((acc, [dev, total]) => {
            return acc + (convertCurrency(total, dev, 'CDF', exchangeRate));
        }, 0);

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

        let prompt;
        if (lang === 'en') {
            prompt = `Analyze the data of this business and provide 3 concrete tactical suggestions.

SUMMARY:
- ${products.length} products, ${lowStock.length} in critical stock.
- Revenue (by real currency): ${caText} ≈ ${totalRevenueCDF.toLocaleString()} CDF at the rate 1 USD = ${exchangeRate} CDF.
- WARNING: Amounts are in their original currency. NEVER mix USD and CDF.
- Main shop currency: ${shopCurrency}.
- Top products: ${topProducts.join(', ') || 'Insufficient data'}.

Generate exactly this JSON (without markdown). For amounts in "desc", ALWAYS specify the currency (USD or CDF):
{"suggestions":[{"type":"stock"|"sales"|"pricing","title":"Short title","desc":"Precise description with explicit currency","impact":"E.g.: +15% Revenue"}],"analysis":"Global strategic summary"}`;
        } else {
            prompt = `Analyse les données de ce commerce et fournis 3 suggestions tactiques concrètes.

RÉSUMÉ :
- ${products.length} produits, ${lowStock.length} en stock critique.
- CA (par devise réelle) : ${caText} ≈ ${totalRevenueCDF.toLocaleString()} CDF au taux 1 USD = ${exchangeRate} CDF.
- ATTENTION : Les montants sont dans leur devise d'origine. Ne mélange JAMAIS USD et CDF.
- Devise principale boutique : ${shopCurrency}.
- Top produits: ${topProducts.join(', ') || 'Données insuffisantes'}.

Génère exactement ce JSON (sans markdown). Pour les montants dans "desc", précise TOUJOURS la devise (USD ou CDF) :
{"suggestions":[{"type":"stock"|"sales"|"pricing","title":"Titre court","desc":"Description précise avec devise explicite","impact":"Ex: +15% de CA"}],"analysis":"Résumé stratégique global"}`;
        }

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
        const sales = await Sale.findAll({ where: { userId: req.user.id }, limit: 10, attributes: ['montantTotal', 'devise'] });
        // ✅ FIX : Afficher la devise correcte dans le fallback aussi
        const salesByCurrencyFallback = {};
        sales.forEach(s => {
            const dev = (s.devise || 'CDF').toUpperCase();
            salesByCurrencyFallback[dev] = (salesByCurrencyFallback[dev] || 0) + parseFloat(s.montantTotal || 0);
        });
        const caFallback = Object.entries(salesByCurrencyFallback)
            .map(([dev, total]) => `${total.toLocaleString()} ${dev}`)
            .join(' + ') || '0 CDF';

        const lang = (req.query.lang || 'fr').toLowerCase();
        if (lang === 'en') {
            res.json({
                suggestions: [
                    { type: "stock", title: "Alerts Management", desc: "Check your critical stock products.", impact: "Avoid stockouts" },
                    { type: "sales", title: "Performance Focus", desc: `Recent revenue: ${caFallback}.`, impact: "Optimization" },
                    { type: "pricing", title: "Strategic Analysis", desc: `Store with ${productsCount} registered products.`, impact: "Pricing consistency" }
                ],
                analysis: "The LUMO engine is currently recalibrating. The displayed data is based on your current statistics."
            });
        } else {
            res.json({
                suggestions: [
                    { type: "stock", title: "Gestion des Alertes", desc: "Vérifiez vos produits en stock critique.", impact: "Évite les ruptures" },
                    { type: "sales", title: "Focus Performance", desc: `CA récent : ${caFallback}.`, impact: "Optimisation" },
                    { type: "pricing", title: "Analyse Stratégique", desc: `Commerce avec ${productsCount} produits enregistrés.`, impact: "Cohérence prix" }
                ],
                analysis: "Le moteur LUMO est en cours de recalibrage. Les données affichées sont basées sur vos statistiques actuelles."
            });
        }
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
const toolRegistry = require('../ai/toolRegistry');

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

        const tools = toolRegistry.getAllSchemas();

        let response = await client.chat.completions.create({
            model: MODEL,
            messages: chatHistory,
            tools: tools.length > 0 ? tools : undefined,
            stream: false, // False pour pouvoir intercepter facilement les tool_calls
        });

        const responseMessage = response.choices[0].message;
        let fullResponse = "";

        // Si l'IA décide d'appeler un outil (Function Calling)
        if (responseMessage.tool_calls) {
            chatHistory.push(responseMessage); // Ajouter l'intention d'appel à l'historique

            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                
                // Exécuter l'action réelle sur la base de données
                const result = await toolRegistry.execute(functionName, args, user);
                
                // Fournir le résultat à l'IA
                chatHistory.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
            }

            // Refaire l'appel pour obtenir la réponse finale (avec streaming cette fois)
            const finalResponse = await client.chat.completions.create({
                model: MODEL,
                messages: chatHistory,
                stream: true,
            });

            for await (const chunk of finalResponse) {
                const text = chunk.choices[0]?.delta?.content || "";
                if (text) {
                    fullResponse += text;
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
            }
        } else {
            // Aucun outil appelé, c'est une réponse texte classique
            fullResponse = responseMessage.content || "";
            // Simuler le streaming pour le frontend
            const words = fullResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
                const text = words[i] + (i === words.length - 1 ? '' : ' ');
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                await new Promise(r => setTimeout(r, 20)); // Légère latence pour l'effet visuel
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
