const { User } = require('./models');
const { sequelize } = require('./config/database');

async function checkAndFixUser() {
    try {
        const email = 'no.codescreen@gmail.com';
        console.log(`Checking for user: ${email}`);
        
        let user = await User.findOne({ where: { email } });
        
        if (user) {
            console.log('User found! Current details:', {
                id: user.id,
                nom: user.nom,
                role: user.role,
                isVerified: user.isVerified,
                isAdminValidated: user.isAdminValidated
            });
            
            // Fix permissions
            user.role = 'superadmin';
            user.isVerified = true;
            user.isAdminValidated = true;
            await user.save();
            
            console.log('User updated to SuperAdmin with full access.');
        } else {
            console.log('User NOT found in database.');
        }

        // Check for other users to see if any others have superadmin
        const admins = await User.findAll({ where: { role: 'superadmin' } });
        console.log(`Total SuperAdmins in DB: ${admins.length}`);
        for (const admin of admins) {
            if (admin.email !== email) {
                console.log(`Found another SuperAdmin: ${admin.email}. Changing to admin...`);
                admin.role = 'admin';
                await admin.save();
            }
        }

    } catch (error) {
        console.error('Error during database operation:', error);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

checkAndFixUser();
