const productTools = require('./tools/productTools');
const clientTools = require('./tools/clientTools');

// Le système est conçu pour être extensible facilement
const modules = [
    productTools,
    clientTools
];

class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.schemas = [];
        this.loadTools();
    }

    loadTools() {
        for (const mod of modules) {
            for (const tool of mod) {
                if (tool.schema && tool.schema.function && tool.handler) {
                    this.schemas.push(tool.schema);
                    this.tools.set(tool.schema.function.name, tool.handler);
                }
            }
        }
    }

    getAllSchemas() {
        return this.schemas;
    }

    async execute(functionName, args, user) {
        const handler = this.tools.get(functionName);
        if (!handler) {
            console.warn(`[AI Agent] Tentative d'appel d'un outil inexistant: ${functionName}`);
            return { success: false, error: `L'outil ${functionName} n'existe pas.` };
        }
        try {
            console.log(`[AI Agent] Exécution de l'outil ${functionName} par l'utilisateur ${user.id}`);
            return await handler(args, user);
        } catch (error) {
            console.error(`[AI Agent] Erreur exécution outil ${functionName}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ToolRegistry();
