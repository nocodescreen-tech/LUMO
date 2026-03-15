const { User } = require('./models');

async function checkUser() {
  try {
    const user = await User.findOne({ where: { email: 'no.codescreen@gmail.com' } });
    if (user) {
      console.log('User found:', JSON.stringify(user, null, 2));
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkUser();
