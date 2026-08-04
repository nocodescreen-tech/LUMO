const { Client } = require('../../models');
const { Op } = require('sequelize');

const verifyUser = (user) => {
    if (!user || !user.id) throw new Error("Utilisateur non authentifié.");
};

const createClientSchema = {
    type: "function",
    function: {
        name: "createClient",
        description: "Ajoute un nouveau client dans la base de données.",
        parameters: {
            type: "object",
            properties: {
                nom: { type: "string", description: "Le nom complet du client" },
                telephone: { type: "string", description: "Le numéro de téléphone" },
                email: { type: "string", description: "L'adresse email" },
                adresse: { type: "string", description: "L'adresse physique" }
            },
            required: ["nom"]
        }
    }
};

const createClientHandler = async (args, user) => {
    verifyUser(user);
    try {
        const newClient = await Client.create({
            ...args,
            userId: user.id
        });
        return { 
            success: true, 
            message: `Le client '${newClient.nom}' a été ajouté avec succès.`, 
            client: newClient.toJSON() 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const updateClientSchema = {
    type: "function",
    function: {
        name: "updateClient",
        description: "Met à jour les informations d'un client.",
        parameters: {
            type: "object",
            properties: {
                searchQuery: { type: "string", description: "Le nom du client à modifier" },
                nom: { type: "string", description: "Le nouveau nom" },
                telephone: { type: "string", description: "Le nouveau téléphone" },
                adresse: { type: "string", description: "La nouvelle adresse" }
            },
            required: ["searchQuery"]
        }
    }
};

const updateClientHandler = async (args, user) => {
    verifyUser(user);
    try {
        const { searchQuery, ...updates } = args;
        const client = await Client.findOne({
            where: {
                userId: user.id,
                nom: { [Op.iLike]: `%${searchQuery}%` }
            }
        });

        if (!client) {
            return { success: false, error: `Aucun client trouvé pour '${searchQuery}'.` };
        }

        await client.update(updates);
        return { 
            success: true, 
            message: `Le client '${client.nom}' a été mis à jour avec succès.`,
            client: client.toJSON() 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

module.exports = [
    { schema: createClientSchema, handler: createClientHandler },
    { schema: updateClientSchema, handler: updateClientHandler }
];
