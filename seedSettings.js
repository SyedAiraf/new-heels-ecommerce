const mongoose = require('mongoose');
const Settings = require('./models/Settings');

mongoose.connect('mongodb://localhost:27017/new-heels')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Delete existing settings
    await Settings.deleteMany({});
    
    // Create default settings
    await Settings.create({
      key: 'promoBanner',
      value: {
        enabled: true,
        title: '🔥 FLAT 20% OFF ON ALL BAGS',
        subtitle: 'Use code: NEWHEELS20 at checkout',
        discountPercent: 20
      }
    });
    
    await Settings.create({
      key: 'announcementBar',
      value: {
        enabled: true,
        text: 'FREE SHIPPING on orders above Rs. 5,000 | Cash on Delivery Available'
      }
    });
    
    console.log('✅ Settings created successfully!');
    await mongoose.connection.close();
    console.log('✅ Done!');
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });