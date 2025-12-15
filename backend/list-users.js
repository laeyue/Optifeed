// List All Users Script
// Usage: node list-users.js

const db = require('./config/database');

async function listUsers() {
    try {
        const result = await db.query(
            `SELECT id, username, name, email, role, id_number, 
                    is_active, created_at, last_login 
             FROM users 
             ORDER BY role, username`
        );

        if (result.rows.length === 0) {
            console.log('\n⚠️  No users found in database\n');
            process.exit(0);
        }

        console.log('\n📋 User Accounts');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        result.rows.forEach((user, index) => {
            const status = user.is_active ? '✅ Active' : '❌ Inactive';
            const lastLogin = user.last_login 
                ? new Date(user.last_login).toLocaleString() 
                : 'Never';

            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Username:    ${user.username}`);
            console.log(`   Role:        ${user.role.toUpperCase()}`);
            console.log(`   Email:       ${user.email || 'N/A'}`);
            console.log(`   ID Number:   ${user.id_number}`);
            console.log(`   Status:      ${status}`);
            console.log(`   Last Login:  ${lastLogin}`);
            console.log('   ─────────────────────────────────────────────────────────────────────');
        });

        console.log(`\n📊 Total Users: ${result.rows.length}`);
        console.log(`   Admins: ${result.rows.filter(u => u.role === 'admin').length}`);
        console.log(`   Users:  ${result.rows.filter(u => u.role === 'user').length}`);
        console.log(`   Active: ${result.rows.filter(u => u.is_active).length}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing users:', error.message);
        process.exit(1);
    }
}

listUsers();
