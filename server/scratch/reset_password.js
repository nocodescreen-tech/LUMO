const { sequelize } = require('../config/database');
const User = require('../models/User');

async function resetPassword() {
  try {
    await sequelize.authenticate();
    
    const user = await User.findOne({ where: { email: 'no.codescreen@gmail.com' } });
    if (user) {
      user.motDePasse = 'Lumo@2026!'; // The beforeSave hook will hash this
      await user.save();
      console.log('Password reset successfully to: Lumo@2026!');
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

resetPassword();
