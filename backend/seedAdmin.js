require('dotenv').config();
const bcrypt = require('bcrypt');
const supabaseAdmin = require('./config/db');

const createFirstAdmin = async () => {
    // 1. Define your admin credentials here
    const email = 'morisyl21@gmail.com';
    const plainTextPassword = 'Kenya@2030'; // ⚠️ Change this to whatever you want

    try {
        console.log(`Hashing password for ${email}...`);
        
        // 2. Hash the password (Cost factor of 10)
        const passwordHash = await bcrypt.hash(plainTextPassword, 10);

        // 3. Insert the user into Supabase
        const { data, error } = await supabaseAdmin
            .from('admin_users')
            .insert([
                {
                    email: email,
                    password_hash: passwordHash,
                    role: 'superadmin',
                    is_active: true
                }
            ]);

        if (error) {
            console.error('🚨 Failed to create admin:', error.message);
            return;
        }

        console.log('✅ Admin user created successfully!');
        console.log('You can now log in to the frontend with these credentials.');

    } catch (err) {
        console.error('🚨 Unexpected error:', err);
    }
};

createFirstAdmin();