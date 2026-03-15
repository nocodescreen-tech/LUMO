const OpenAI = require("openai");
const { Sale, Product, Depense } = require("../models");

const getClient = () => {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("DEEPSEEK_API_KEY non configurée dans .env");

    return new OpenAI({
        apiKey: key,
        baseURL: "https://api.deepseek.com",
    });
};

const MODEL = process.env.AI_MODEL || "deepseek-chat";

const getAIInsights = async (req, res, next) => {
    try {
        const client = getClient();
        const userId = req.user.id;

        const products = await Product.findAll({ where: { userId } });
        const recentSales = await Sale.findAll({ where: { userId }, limit: 50, order: [['createdAt', 'DESC']] });
        const recentExpenses = await Depense.findAll({ where: { userId }, limit: 30, order: [['createdAt', 'DESC']] });

        const totalRevenue = recentSales.reduce((acc, s) => acc + s.montantTotal, 0);
        const totalExpenses = recentExpenses.reduce((acc, e) => acc + e.montant, 0);
        const lowStock = products.filter(p => p.stock <= p.stockAlerte);

        const productStats = {};
        recentSales.forEach(sale => {
            (sale.articles || []).forEach(art => {
                productStats[art.nom] = (productStats[art.nom] || 0) + art.quantite;
            });
        });
        const topProducts = Object.entries(productStats)
            .sort(([, a], [, b]) => b - a).slice(0, 3)
            .map(([name, qty]) => `${name} (${qty} vendus)`);

        const prompt = `
Tu es l'intelligence stratégique LUMO Assistant. Analyse les données de ce commerce (${req.user.typeActivite || 'Commerce de détail'}) et fournis des suggestions tactiques concrètes.

DONNÉES :
- Inventaire : ${products.length} produits au total, dont ${lowStock.length} avec un stock critique.
- Finances : CA consolidé: ${totalRevenue.toLocaleString()} FC, Dépenses: ${totalExpenses.toLocaleString()} FC.
- Top produits vendus: ${topProducts.join(', ') || 'Données insuffisantes'}.

Génère 3 suggestions innovantes pour augmenter la rentabilité.
Format de réponse souhaité (JSON uniquement) :
{
  "suggestions": [
    {
      "type": "stock" | "sales" | "pricing",
      "title": "Titre court et percutant",
      "desc": "Description analytique précise",
      "impact": "Ex: +15% de CA ou 200,000 FC économisés"
    }
  ],
  "analysis": "Bref résumé stratégique global"
}

RÉPONDS UNIQUEMENT EN JSON VALIDE.
        `;

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: 'json_object' }
        });

        const aiData = JSON.parse(response.choices[0].message.content);
        res.json(aiData);

    } catch (error) {
        console.error("DeepSeek Insights Error:", error.message);

        // Dynamic fallback based on real numbers if AI fails
        const productsCount = await Product.count({ where: { userId: req.user.id } });
        const sales = await Sale.findAll({ where: { userId: req.user.id }, limit: 10 });
        const revenue = sales.reduce((acc, s) => acc + s.montantTotal, 0);

        res.json({
            suggestions: [
                {
                    type: "stock",
                    title: "Gestion des Alertes",
                    desc: "Analyse en mode dégradé. Vérifiez vos produits en stock critique.",
                    impact: "Évite les ruptures"
                },
                {
                    type: "sales",
                    title: "Focus Performance",
                    desc: `CA récent de ${revenue.toLocaleString()} FC.`,
                    impact: "Optimisation"
                },
                {
                    type: "pricing",
                    title: "Analyse Stratégique",
                    desc: `Commerce avec ${productsCount} produits enregistrés.`,
                    impact: "Cohérence prix"
                }
            ],
            analysis: "Le moteur LUMO Assistant est en cours de recalibrage. Les données affichées sont basées sur vos statistiques actuelles."
        });
    }
};

const chatAI = async (req, res, next) => {
    try {
        const client = getClient();
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ message: "Message requis" });

        const userId = req.user.id;
        const products = await Product.findAll({ where: { userId } });
        const sales = await Sale.findAll({ where: { userId }, limit: 20, order: [['createdAt', 'DESC']] });
        const totalRevenue = sales.reduce((acc, s) => acc + s.montantTotal, 0);
        const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

        const systemInstruction = `Tu es LUMO Assistant, l'assistant stratégique IA du commerce "${req.user.entreprise?.nom || 'Ce commerce'}".
Type d'activité : ${req.user.typeActivite || 'Commerce général'}.
Données actuelles : ${products.length} produits, ${totalStock} unités en stock, ${sales.length} ventes récentes, CA récent ${totalRevenue.toLocaleString()} FC.
Réponds de manière concise, professionnelle et orientée résultats. Toujours en français.`;

        const chatHistory = [
            { role: "system", content: systemInstruction },
            ...(history || []).map(h => ({
                role: h.role === 'user' ? 'user' : 'assistant',
                content: h.content
            }))
        ];

        chatHistory.push({ role: "user", content: message });

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: chatHistory,
        });

        res.json({ response: response.choices[0].message.content });
    } catch (error) {
        console.error("DeepSeek Chat Error:", error.message);
        res.status(500).json({ message: "LUMO Assistant est temporairement indisponible." });
    }
};

module.exports = { getAIInsights, chatAI };
