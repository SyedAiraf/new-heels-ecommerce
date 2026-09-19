const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

console.log('Connecting to MongoDB Atlas...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    
    // Delete existing admin
    await Admin.deleteMany({});
    console.log('🗑️ Deleted existing admins');
    
    // Create new admin
    const admin = await Admin.create({
      username: 'admin',
      password: 'Hibaadmin123',
      email: 'admin@newheels.pk'
    });
    
    console.log('✅ Admin created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('🔐 Password is now HASHED in database (secure!)');
    
    await mongoose.connection.close();
    console.log('✅ Done!');
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });