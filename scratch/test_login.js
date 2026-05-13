const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { User } = require('../server/models');
const { sequelize } = require('../server/config/database');

async function testLogin() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ where: { email: 'no.codescreen@gmail.com' } });
        if (!user) {
            console.log('USER_NOT_FOUND');
            return;
        }
        const isMatch = await user.matchMotDePasse('Admin123!');
        console.log('LOGIN_TEST_RESULT:', isMatch ? 'SUCCESS' : 'FAILED');
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await sequelize.close();
    }
}

testLogin();
