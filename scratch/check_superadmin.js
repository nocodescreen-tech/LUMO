const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { User } = require('../server/models');
const { sequelize } = require('../server/config/database');

async function checkUser() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');
        const user = await User.findOne({ where: { email: 'no.codescreen@gmail.com' } });
        if (user) {
            console.log('USER_FOUND');
            console.log(JSON.stringify({
                id: user.id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                isAdminValidated: user.isAdminValidated,
                isSuspended: user.isSuspended
            }, null, 2));
        } else {
            console.log('USER_NOT_FOUND');
        }
    } catch (error) {
        console.error('DB_ERROR:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkUser();
