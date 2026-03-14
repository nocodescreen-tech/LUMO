const { sequelize } = require('./config/database');

async function fixDB() {
    try {
        console.log("Starting DB fix...");
        await sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" DROP DEFAULT;');
        await sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" TYPE VARCHAR(255);');
        console.log("✅ Success: Role column fixed.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error fixing DB:", error.message);
        process.exit(1);
    }
}

fixDB();
