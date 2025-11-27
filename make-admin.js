/**
 * Script to make a user an admin
 * Usage: node make-admin.js <email>
 * Example: node make-admin.js demo@gmail.com
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function makeAdmin(email) {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-assistant';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    if (!email) {
      // List all users
      const users = await User.find().select('email name role isActive');
      console.log('📋 All users in database:');
      console.log('═'.repeat(80));
      users.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role} ${user.role === 'admin' ? '👑' : ''}`);
        console.log(`Active: ${user.isActive ? '✅' : '❌'}`);
        console.log('─'.repeat(80));
      });
      console.log(`\nTotal users: ${users.length}`);
      console.log('\n💡 Usage: node make-admin.js <email>');
      console.log('Example: node make-admin.js demo@gmail.com\n');
    } else {
      // Make user admin
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.log(`❌ User with email "${email}" not found`);
        console.log('\n📋 Available users:');
        const allUsers = await User.find().select('email name');
        allUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`));
      } else {
        if (user.role === 'admin') {
          console.log(`✅ User "${email}" is already an admin!`);
        } else {
          user.role = 'admin';
          await user.save();
          console.log(`✅ Successfully made "${email}" an admin!`);
          console.log(`👤 Name: ${user.name}`);
          console.log(`📧 Email: ${user.email}`);
          console.log(`👑 Role: ${user.role}`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
makeAdmin(email);
