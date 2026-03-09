import mongoose from 'mongoose';
import { User } from '../models';

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-digitaltwin';

// User credentials to seed
const USER_EMAIL = 'kishankr05@gamil.com';
const USER_PASSWORD = 'kishan123@';
const USER_NAME = 'Kishan';

async function seedUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing user if it exists (to fix the double-hashed password issue)
    const existingUser = await User.findOne({ email: USER_EMAIL.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️  Deleting existing user with email ${USER_EMAIL}...`);
      await User.deleteOne({ email: USER_EMAIL.toLowerCase() });
    }

    // Create user - let the model's pre-save hook handle password hashing
    const user = new User({
      email: USER_EMAIL.toLowerCase(),
      password: USER_PASSWORD, // Plain password - will be hashed by pre-save hook
      name: USER_NAME,
      digitalTwin: {
        createdAt: new Date(),
        lastActive: new Date(),
        behaviorProfile: {},
      },
    });

    await user.save();
    console.log(`✅ User created successfully!`);
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Password: ${USER_PASSWORD}`);
    console.log(`   Name: ${USER_NAME}`);

    // Verify the password works
    const isMatch = await user.comparePassword(USER_PASSWORD);
    console.log(`✅ Password verification: ${isMatch ? 'PASSED' : 'FAILED'}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedUser();

