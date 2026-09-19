const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const Subscriber = require('../models/Subscriber');
const Order = require('../models/Order');
const Banner = require('../models/Banner');
const cloudinary = require('cloudinary').v2;
const Review = require('../models/Review');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload buffer to Cloudinary (UNSIGNED)
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.unsigned_upload_stream(
      'new_heels_unsigned',    // ← preset name as FIRST argument
      {
        folder: 'new-heels/products'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error);
          reject(error);
        } else {
          console.log('✅ Uploaded:', result.secure_url);
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};
// ============ LOGIN FUNCTIONS ============

// Show login page
exports.showLogin = (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: req.session.error || null,
    success: req.session.success || null
  });
  
  delete req.session.error;
  delete req.session.success;
};

// Handle login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/admin/login');
    }
    
       // Use bcrypt comparison
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/admin/login');
    }
    
    req.session.adminId = admin._id;
    req.session.adminUsername = admin.username;
    
    admin.lastLogin = new Date();
    await admin.save();
    
    req.session.success = 'Welcome back, ' + admin.username + '!';
    res.redirect('/admin/dashboard');
    
  } catch (error) {
    console.error('Login error:', error);
    req.session.error = 'Server error, please try again';
    res.redirect('/admin/login');
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/admin/login');
  });
};

exports.dashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const newArrivals = await Product.countDocuments({ isNewArrival: true });
    const bestSellers = await Product.countDocuments({ isBestSeller: true });
    
    // Order stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    // Review stats ← NEW
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ isApproved: false });
    
    // Total revenue
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    const recentOrders = await Order.find().sort('-createdAt').limit(5);
    
    res.render('admin/dashboard', {
      title: 'Dashboard',
      adminUsername: req.session.adminUsername,
      stats: {
        totalProducts,
        activeProducts,
        newArrivals,
        bestSellers,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalReviews,      // NEW
        pendingReviews     // NEW
      },
      recentOrders,
      success: req.session.success || null,
      error: req.session.error || null
    });
    
    delete req.session.success;
    delete req.session.error;
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Server error');
  }
};

// ============ PRODUCT MANAGEMENT ============

// List all products
exports.listProducts = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'hidden') {
      query.isActive = false;
    }
    
    const products = await Product.find(query).sort('-createdAt');
    
    // Get counts
    const counts = {
      all: await Product.countDocuments(),
      active: await Product.countDocuments({ isActive: true }),
      hidden: await Product.countDocuments({ isActive: false })
    };
    
    res.render('admin/products/list', {
      title: 'Products',
      adminUsername: req.session.adminUsername,
      products,
      counts,
      currentStatus: status || 'all',
      success: req.session.success || null,
      error: req.session.error || null
    });
    
    delete req.session.success;
    delete req.session.error;
    
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).send('Server error');
  }
};                                      

// Show add product form
exports.showAddProduct = (req, res) => {
  res.render('admin/products/add', {
    title: 'Add Product',
    adminUsername: req.session.adminUsername,
    error: req.session.error || null,
    formData: req.session.formData || {}
  });
  
  delete req.session.error;
  delete req.session.formData;
};

// Add product
exports.addProduct = async (req, res) => {
  try {
    console.log('=== ADD PRODUCT CALLED ===');
    console.log('Files:', req.files ? req.files.length : 0);
    
    const {
      name, description, category, subcategory, type, price, salePrice,
      stock, isFeatured, isNewArrival, isBestSeller
    } = req.body;

    // Process images - upload each to Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          console.log('Uploading file:', file.originalname);
          const url = await uploadToCloudinary(file.buffer);
          images.push(url);
          console.log('✅ Image URL:', url);
        } catch (err) {
          console.error('❌ Image upload failed:', err.message);
        }
      }
    }
    
    console.log('Total images:', images.length);
    
    // Process variations for shoes
    const variations = [];
    if (type === 'shoe') {
      const sizes = req.body.sizes || [];
      const colors = req.body.colors || [];
      const stocks = req.body.stocks || [];
      const skus = req.body.skus || [];
      
      for (let i = 0; i < sizes.length; i++) {
        if (sizes[i] && sizes[i].trim()) {
          variations.push({
            size: sizes[i].trim(),
            color: colors[i] ? colors[i].trim() : '',
            stock: parseInt(stocks[i]) || 0,
            sku: skus[i] || ''
          });
        }
      }
    }
    
       const product = await Product.create({
      name,
      description,
      category,
      subcategory: subcategory || null,
      type,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      images,
      variations,
      stock: type === 'bag' ? (parseInt(stock) || 0) : 0,
      isActive: req.body.isActive === 'on',
      isFeatured: isFeatured === 'on',
      isNewArrival: isNewArrival === 'on',
      isBestSeller: isBestSeller === 'on'
    });
    console.log('✅ Product created with images:', product.images.length);
    
    req.session.success = 'Product added successfully!';
    res.redirect('/admin/products');
    
  } catch (error) {
    console.error('❌ Add product error:', error);
    req.session.error = error.message;
    req.session.formData = req.body;
    res.redirect('/admin/products/add');
  }
};  

// Show edit product form
exports.showEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    
    res.render('admin/products/edit', {
      title: 'Edit Product',
      adminUsername: req.session.adminUsername,
      product,
      error: req.session.error || null
    });
    
    delete req.session.error;
    
  } catch (error) {
    console.error('Show edit error:', error);
    res.status(500).send('Server error');
  }
};

// Edit product
exports.editProduct = async (req, res) => {
  try {
    console.log('=== EDIT PRODUCT CALLED ===');
    console.log('Product ID:', req.params.id);
    console.log('Body:', JSON.stringify(req.body).substring(0, 200));
    console.log('Files received:', req.files ? req.files.length : 0);
    
    if (req.files && req.files.length > 0) {
      req.files.forEach((f, i) => {
        console.log(`  File ${i}: name=${f.originalname}, type=${f.mimetype}, size=${f.size}`);
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    
    console.log('Product found:', product.name);
    console.log('Current images:', product.images.length);
    
        const {
      name, description, category, subcategory, type, price, salePrice,
      stock, isFeatured, isNewArrival, isBestSeller
    } = req.body;
    
    // Update basic fields
        product.name = name;
    product.description = description;
    product.category = category;
    product.subcategory = subcategory || null;
    product.type = type;
    product.price = parseFloat(price);
    product.salePrice = salePrice ? parseFloat(salePrice) : null;
    product.isActive = req.body.isActive === 'on';
    product.isFeatured = isFeatured === 'on';
    product.isNewArrival = isNewArrival === 'on';
    product.isBestSeller = isBestSeller === 'on';
    
    // Update images if new ones uploaded
    if (req.files && req.files.length > 0) {
      console.log('Processing new images...');
      const newImages = [];
      for (const file of req.files) {
        try {
          console.log('Uploading:', file.originalname);
          const url = await uploadToCloudinary(file.buffer);
          newImages.push(url);
          console.log('✅ Uploaded:', url);
        } catch (err) {
          console.error('❌ Image upload failed:', err.message);
        }
      }
      product.images = [...product.images, ...newImages];
      console.log('Total images after upload:', product.images.length);
    } else {
      console.log('No new files to upload');
    }
    
    // Update variations
    if (type === 'shoe') {
      const variations = [];
      const sizes = req.body.sizes || [];
      const colors = req.body.colors || [];
      const stocks = req.body.stocks || [];
      const skus = req.body.skus || [];
      
      for (let i = 0; i < sizes.length; i++) {
        if (sizes[i] && sizes[i].trim()) {
          variations.push({
            size: sizes[i].trim(),
            color: colors[i] ? colors[i].trim() : '',
            stock: parseInt(stocks[i]) || 0,
            sku: skus[i] || ''
          });
        }
      }
      product.variations = variations;
      product.stock = 0;
    } else {
      product.variations = [];
      product.stock = parseInt(stock) || 0;
    }
    
    await product.save();
    console.log('✅ Product saved successfully');
    
    req.session.success = 'Product updated successfully!';
    res.redirect('/admin/products');
    
  } catch (error) {
    console.error('❌ Edit product error:', error);
    req.session.error = error.message;
    res.redirect('/admin/products/edit/' + req.params.id);
  }
};
// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    
    product.isActive = false;
    await product.save();
    
    req.session.success = 'Product deleted successfully!';
    res.redirect('/admin/products');
    
  } catch (error) {
    console.error('Delete product error:', error);
    req.session.error = 'Failed to delete product';
    res.redirect('/admin/products');
  }
};
// Restore product (make active again)
exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    
    product.isActive = true;
    await product.save();
    
    req.session.success = 'Product restored successfully!';
    res.redirect('/admin/products');
    
  } catch (error) {
    console.error('Restore product error:', error);
    req.session.error = 'Failed to restore product';
    res.redirect('/admin/products');
  }
};
// ============ SETTINGS MANAGEMENT ============

// Show settings page
exports.showSettings = async (req, res) => {
  try {
    const promoBanner = await Settings.findOne({ key: 'promoBanner' });
    const announcementBar = await Settings.findOne({ key: 'announcementBar' });
    const contactInfoSetting = await Settings.findOne({ key: 'contactInfo' });
    
    res.render('admin/settings', {
      title: 'Settings',
      adminUsername: req.session.adminUsername,
      promoBanner: promoBanner ? promoBanner.value : { enabled: false, title: '', subtitle: '', discountPercent: 0 },
      announcementBar: announcementBar ? announcementBar.value : { enabled: false, text: '' },
      contactInfo: contactInfoSetting ? contactInfoSetting.value : { phone: '03277985292', whatsapp: '03277985292', email: 'newheelsmardan@gmail.com', city: 'Mardan, Pakistan' },
      success: req.session.success || null
    });
    
    delete req.session.success;
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).send('Server error');
  }
};

// Update promo banner
exports.updatePromo = async (req, res) => {
  try {
    const { enabled, title, subtitle, discountPercent } = req.body;
    
    await Settings.findOneAndUpdate(
      { key: 'promoBanner' },
      { 
        value: {
          enabled: enabled === 'on',
          title,
          subtitle,
          discountPercent: parseInt(discountPercent) || 0
        }
      },
      { upsert: true }
    );
    
    req.session.success = 'Promo banner updated successfully!';
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Update promo error:', error);
    res.redirect('/admin/settings');
  }
};

// Update announcement bar
exports.updateAnnouncement = async (req, res) => {
  try {
    const { enabled, text } = req.body;
    
    await Settings.findOneAndUpdate(
      { key: 'announcementBar' },
      { 
        value: {
          enabled: enabled === 'on',
          text
        }
      },
      { upsert: true }
    );
    
    req.session.success = 'Announcement bar updated successfully!';
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Update announcement error:', error);
    res.redirect('/admin/settings');
  }
};
// List subscribers
exports.listSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort('-subscribedAt');
    
    res.render('admin/subscribers', {
      title: 'Subscribers',
      adminUsername: req.session.adminUsername,
      subscribers
    });
  } catch (error) {
    console.error('Subscribers error:', error);
    res.status(500).send('Server error');
  }
};
// ============ ORDER MANAGEMENT ============

exports.listOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const orders = await Order.find(query).sort('-createdAt');
    
    const statusCounts = {
      all: await Order.countDocuments(),
      pending: await Order.countDocuments({ status: 'pending' }),
      confirmed: await Order.countDocuments({ status: 'confirmed' }),
      processing: await Order.countDocuments({ status: 'processing' }),
      shipped: await Order.countDocuments({ status: 'shipped' }),
      delivered: await Order.countDocuments({ status: 'delivered' }),
      cancelled: await Order.countDocuments({ status: 'cancelled' })
    };
    
    res.render('admin/orders/list', {
      title: 'Orders',
      adminUsername: req.session.adminUsername,
      orders,
      statusCounts,
      currentStatus: status || 'all',
      success: req.session.success || null
    });
    
    delete req.session.success;
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).send('Server error');
  }
};

exports.showOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    
    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }
    
    res.render('admin/orders/detail', {
      title: 'Order Details',
      adminUsername: req.session.adminUsername,
      order,
      success: req.session.success || null
    });
    
    delete req.session.success;
  } catch (error) {
    console.error('Order detail error:', error);
    res.status(500).send('Server error');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    req.session.success = 'Order status updated to ' + status;
    res.redirect('/admin/orders/' + req.params.id);
  } catch (error) {
    console.error('Update status error:', error);
    res.redirect('/admin/orders');
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { paymentStatus });
    req.session.success = 'Payment status updated to ' + paymentStatus;
    res.redirect('/admin/orders/' + req.params.id);
  } catch (error) {
    console.error('Update payment error:', error);
    res.redirect('/admin/orders');
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    req.session.success = 'Order deleted successfully';
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Delete order error:', error);
    res.redirect('/admin/orders');
  }
};
// Update contact info
exports.updateContact = async (req, res) => {
  try {
    const { phone, whatsapp, email, city } = req.body;
    
    await Settings.findOneAndUpdate(
      { key: 'contactInfo' },
      { 
        value: { phone, whatsapp, email, city }
      },
      { upsert: true }
    );
    
    req.session.success = 'Contact info updated successfully!';
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Update contact error:', error);
    res.redirect('/admin/settings');
  }
};
// Delete specific image from product
exports.deleteProductImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }
    
    // Remove image from array
    product.images = product.images.filter(img => img !== imageUrl);
    
    await product.save();
    
    req.session.success = 'Image deleted successfully!';
    res.redirect('/admin/products/edit/' + req.params.id);
    
  } catch (error) {
    console.error('Delete image error:', error);
    req.session.error = 'Failed to delete image';
    res.redirect('/admin/products/edit/' + req.params.id);
  }
};
// ============ BANNER MANAGEMENT ============

// List banners
exports.listBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort('order');
    
    res.render('admin/banners/list', {
      title: 'Banners',
      adminUsername: req.session.adminUsername,
      banners,
      success: req.session.success || null
    });
    
    delete req.session.success;
  } catch (error) {
    console.error('List banners error:', error);
    res.status(500).send('Server error');
  }
};

// Show add banner form
exports.showAddBanner = (req, res) => {
  res.render('admin/banners/add', {
    title: 'Add Banner',
    adminUsername: req.session.adminUsername,
    error: null
  });
};

// Add banner
exports.addBanner = async (req, res) => {
  try {
    const { title, subtitle, buttonText, buttonLink, order } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.redirect('/admin/banners/add');
    }
    
    const imageUrl = await uploadToCloudinary(req.files[0].buffer);
    
    await Banner.create({
      title,
      subtitle,
      buttonText: buttonText || 'Shop Now',
      buttonLink: buttonLink || '/',
      image: imageUrl,
      order: parseInt(order) || 0,
      isActive: true
    });
    
    req.session.success = 'Banner added successfully!';
    res.redirect('/admin/banners');
    
  } catch (error) {
    console.error('Add banner error:', error);
    res.redirect('/admin/banners/add');
  }
};

// Show edit banner form
exports.showEditBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.redirect('/admin/banners');
    }
    
    res.render('admin/banners/edit', {
      title: 'Edit Banner',
      adminUsername: req.session.adminUsername,
      banner,
      error: null
    });
  } catch (error) {
    console.error('Show edit banner error:', error);
    res.redirect('/admin/banners');
  }
};

// Edit banner
exports.editBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.redirect('/admin/banners');
    }
    
    const { title, subtitle, buttonText, buttonLink, order, isActive } = req.body;
    
    banner.title = title;
    banner.subtitle = subtitle;
    banner.buttonText = buttonText;
    banner.buttonLink = buttonLink;
    banner.order = parseInt(order) || 0;
    banner.isActive = isActive === 'on';
    
    if (req.files && req.files.length > 0) {
      banner.image = await uploadToCloudinary(req.files[0].buffer);
    }
    
    await banner.save();
    
    req.session.success = 'Banner updated successfully!';
    res.redirect('/admin/banners');
    
  } catch (error) {
    console.error('Edit banner error:', error);
    res.redirect('/admin/banners');
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    req.session.success = 'Banner deleted successfully!';
    res.redirect('/admin/banners');
  } catch (error) {
    console.error('Delete banner error:', error);
    res.redirect('/admin/banners');
  }
};
// ============ REVIEW MANAGEMENT ============

// List all reviews
exports.listReviews = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'pending') {
      query.isApproved = false;
    }
    
    const reviews = await Review.find(query)
      .populate('product', 'name slug images')
      .sort('-createdAt');
    
    // Counts
    const counts = {
      all: await Review.countDocuments(),
      approved: await Review.countDocuments({ isApproved: true }),
      pending: await Review.countDocuments({ isApproved: false })
    };
    
    res.render('admin/reviews/list', {
      title: 'Reviews',
      adminUsername: req.session.adminUsername,
      reviews,
      counts,
      currentStatus: status || 'all',
      success: req.session.success || null
    });
    
    delete req.session.success;
  } catch (error) {
    console.error('List reviews error:', error);
    res.status(500).send('Server error');
  }
};

// Approve review
exports.approveReview = async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { isApproved: true });
    req.session.success = 'Review approved!';
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Approve review error:', error);
    res.redirect('/admin/reviews');
  }
};

// Unapprove review
exports.unapproveReview = async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { isApproved: false });
    req.session.success = 'Review hidden from customers!';
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Unapprove review error:', error);
    res.redirect('/admin/reviews');
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    req.session.success = 'Review deleted!';
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Delete review error:', error);
    res.redirect('/admin/reviews');
  }
};