require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-assistant';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'admin@test.com' });
    if (existingUser) {
      console.log('ℹ️  Test user already exists!');
      console.log('\nLogin credentials:');
      console.log('Email: admin@test.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });

    await user.save();
    console.log('✅ Test user created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
