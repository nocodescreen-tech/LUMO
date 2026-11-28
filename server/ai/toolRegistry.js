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
        // Mutating tools are unavailable until explicit confirmation and audit are implemented.
        return [];
    }

    async execute() { return {success:false,error:'Action IA suspendue: une validation humaine et un workflow audité sont nécessaires.'}; }

}

module.exports = new ToolRegistry();
