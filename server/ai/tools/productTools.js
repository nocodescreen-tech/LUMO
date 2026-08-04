const { Product } = require('../../models');
const { Op } = require('sequelize');

// Vérification de permission basique
const verifyUser = (user) => {
    if (!user || !user.id) throw new Error("Utilisateur non authentifié.");
    // Optionnel: vérifier si le rôle est 'admin' ou 'manager' si besoin
};

const createProductSchema = {
    type: "function",
    function: {
        name: "createProduct",
        description: "Crée un nouveau produit dans l'inventaire.",
        parameters: {
            type: "object",
            properties: {
                nom: { type: "string", description: "Le nom du produit (obligatoire)" },
                prix: { type: "number", description: "Le prix de vente du produit (obligatoire)" },
                prixAchat: { type: "number", description: "Le prix d'achat du produit (optionnel)" },
                stock: { type: "number", description: "La quantité initiale en stock (optionnel, défaut 0)" },
                stockAlerte: { type: "number", description: "Le seuil d'alerte pour le stock faible (optionnel, défaut 5)" },
                categorie: { type: "string", description: "La catégorie du produit (optionnel)" },
                codeBarre: { type: "string", description: "Le code barre du produit (optionnel)" },
                unite: { type: "string", description: "L'unité de mesure (pcs, kg, etc.) (optionnel)" }
            },
            required: ["nom", "prix"]
        }
    }
};

const createProductHandler = async (args, user) => {
    verifyUser(user);
    try {
        const newProduct = await Product.create({
            ...args,
            userId: user.id,
            creatorId: user.id,
            devise: user.entreprise?.devise || 'CDF' // Devise par défaut de la boutique
        });
        return { 
            success: true, 
            message: `Le produit '${newProduct.nom}' a été créé avec succès.`, 
            product: newProduct.toJSON() 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const updateProductSchema = {
    type: "function",
    function: {
        name: "updateProduct",
        description: "Met à jour un produit existant en utilisant son nom exact ou un mot-clé pour le trouver.",
        parameters: {
            type: "object",
            properties: {
                searchQuery: { type: "string", description: "Le nom actuel du produit à modifier" },
                nom: { type: "string", description: "Le nouveau nom" },
                prix: { type: "number", description: "Le nouveau prix" },
                stock: { type: "number", description: "Le nouveau stock" }
            },
            required: ["searchQuery"]
        }
    }
};

const updateProductHandler = async (args, user) => {
    verifyUser(user);
    try {
        const { searchQuery, ...updates } = args;
        
        // Trouver le produit (strict sur le userId)
        const product = await Product.findOne({
            where: {
                userId: user.id,
                nom: { [Op.iLike]: `%${searchQuery}%` } // iLike est pour postgres, sinon LIKE pour mysql/sqlite
            }
        });

        if (!product) {
            return { success: false, error: `Aucun produit trouvé contenant '${searchQuery}'.` };
        }

        await product.update(updates);
        return { 
            success: true, 
            message: `Le produit '${product.nom}' a été mis à jour avec succès.`, 
            product: product.toJSON() 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const deleteProductSchema = {
    type: "function",
    function: {
        name: "deleteProduct",
        description: "Supprime (soft delete) un produit existant en utilisant son nom.",
        parameters: {
            type: "object",
            properties: {
                searchQuery: { type: "string", description: "Le nom exact ou partiel du produit à supprimer" }
            },
            required: ["searchQuery"]
        }
    }
};

const deleteProductHandler = async (args, user) => {
    verifyUser(user);
    try {
        const { searchQuery } = args;
        const product = await Product.findOne({
            where: {
                userId: user.id,
                nom: { [Op.iLike]: `%${searchQuery}%` }
            }
        });

        if (!product) {
            return { success: false, error: `Aucun produit trouvé contenant '${searchQuery}'.` };
        }

        const nom = product.nom;
        await product.destroy(); // Soft delete via Sequelize (paranoid)
        return { success: true, message: `Le produit '${nom}' a été supprimé.` };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Exportation au format attendu par le ToolRegistry
module.exports = [
    { schema: createProductSchema, handler: createProductHandler },
    { schema: updateProductSchema, handler: updateProductHandler },
    { schema: deleteProductSchema, handler: deleteProductHandler }
];
