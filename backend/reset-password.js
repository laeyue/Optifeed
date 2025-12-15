// Password Reset Script
// Usage: node reset-password.js <username> <new-password>

const bcrypt = require('bcrypt');
const db = require('./config/database');

async function resetPassword(username, newPassword) {
    try {
        // Hash the new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password
        const result = await db.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2 RETURNING id, username, name, role',
            [passwordHash, username]
        );

        if (result.rows.length === 0) {
            console.error(`❌ User '${username}' not found`);
            process.exit(1);
        }

        const user = result.rows[0];
        console.log('\n✅ Password reset successful!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`User ID:   ${user.id}`);
        console.log(`Username:  ${user.username}`);
        console.log(`Name:      ${user.name}`);
        console.log(`Role:      ${user.role}`);
        console.log(`New Pass:  ${newPassword}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.log('\n📝 Usage: node reset-password.js <username> <new-password>\n');
    console.log('Example: node reset-password.js admin NewPassword123\n');
    process.exit(1);
}

const [username, newPassword] = args;

if (newPassword.length < 6) {
    console.error('❌ Password must be at least 6 characters long');
    process.exit(1);
}

resetPassword(username, newPassword);
