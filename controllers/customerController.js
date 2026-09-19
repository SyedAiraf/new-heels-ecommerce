const Product = require('../models/Product');
const Settings = require('../models/Settings');
const Subscriber = require('../models/Subscriber');
const Banner = require('../models/Banner');
const Review = require('../models/Review');

// ============ HOMEPAGE ============
exports.home = async (req, res) => {
  try {
    const [
      menShoes, menChappals, menPeshawri,
      kidsToddler, kidsLittle, kidsBig,
      womenBags, womenShoes,
      newArrivals, bestSellers, saleProducts,
      promoBanner, announcementBar, banners
    ] = await Promise.all([
      Product.find({ category: 'men', subcategory: 'shoes', isActive: true }).limit(10),
      Product.find({ category: 'men', subcategory: 'chappals', isActive: true }).limit(10),
      Product.find({ category: 'men', subcategory: 'peshawri', isActive: true }).limit(10),
      Product.find({ category: 'kids', subcategory: 'toddler', isActive: true }).limit(10),
      Product.find({ category: 'kids', subcategory: 'little-kids', isActive: true }).limit(10),
      Product.find({ category: 'kids', subcategory: 'big-kids', isActive: true }).limit(10),
      Product.find({ category: 'female', subcategory: 'bags-purses', isActive: true }).limit(10),
      Product.find({ category: 'female', subcategory: 'shoes-sandals', isActive: true }).limit(10),
      Product.find({ isNewArrival: true, isActive: true }).limit(10),
      Product.find({ isBestSeller: true, isActive: true }).limit(10),
      Product.find({ salePrice: { $ne: null }, isActive: true }).limit(10),
      Settings.findOne({ key: 'promoBanner' }),
      Settings.findOne({ key: 'announcementBar' }),
      Banner.find({ isActive: true }).sort('order')
    ]);

    const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;

    res.render('customer/home', {
      title: 'New Heels - Shoes & Bags Pakistan',
      menShoes, menChappals, menPeshawri,
      kidsToddler, kidsLittle, kidsBig,
      womenBags, womenShoes,
      newArrivals, bestSellers, saleProducts,
      banners,
      promoBanner: promoBanner ? promoBanner.value : { enabled: false },
      announcementBar: announcementBar ? announcementBar.value : { enabled: false, text: '' },
      newsletterStatus: req.query.newsletter || null,
      cartCount
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.status(500).send('Server error');
  }
};

// ============ CATEGORY PAGE ============
// ============ CATEGORY PAGE ============
exports.category = async (req, res) => {
  try {
    const { category } = req.params;
    const { sub, size, color, minPrice, maxPrice, sort, availability } = req.query;
    
    // Base query
    let query = { category, isActive: true };
    if (sub && sub !== 'all') {
      query.subcategory = sub;
    }
    
    // Size filter
    if (size) {
      query['variations.size'] = size;
    }
    
    // Color filter
    if (color) {
      query['variations.color'] = color;
    }
    
    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    // Availability filter
    if (availability === 'in-stock') {
      query.$or = [
        { 'variations.stock': { $gt: 0 } },
        { stock: { $gt: 0 } }
      ];
    } else if (availability === 'sale') {
      query.salePrice = { $ne: null };
    }
    
    // Sort
    let sortOption = '-createdAt';
    if (sort === 'price-asc') sortOption = 'price';
    else if (sort === 'price-desc') sortOption = '-price';
    else if (sort === 'popular') sortOption = '-isBestSeller';
    else if (sort === 'newest') sortOption = '-createdAt';
    
    const products = await Product.find(query).sort(sortOption);
    
    // Subcategory counts
    let subcategoryCounts = {};
    if (category === 'men') {
      subcategoryCounts = {
        all: await Product.countDocuments({ category: 'men', isActive: true }),
        shoes: await Product.countDocuments({ category: 'men', subcategory: 'shoes', isActive: true }),
        chappals: await Product.countDocuments({ category: 'men', subcategory: 'chappals', isActive: true }),
        peshawri: await Product.countDocuments({ category: 'men', subcategory: 'peshawri', isActive: true })
      };
    } else if (category === 'kids') {
      subcategoryCounts = {
        all: await Product.countDocuments({ category: 'kids', isActive: true }),
        toddler: await Product.countDocuments({ category: 'kids', subcategory: 'toddler', isActive: true }),
        'little-kids': await Product.countDocuments({ category: 'kids', subcategory: 'little-kids', isActive: true }),
        'big-kids': await Product.countDocuments({ category: 'kids', subcategory: 'big-kids', isActive: true })
      };
    } else if (category === 'female') {
      subcategoryCounts = {
        all: await Product.countDocuments({ category: 'female', isActive: true }),
        'bags-purses': await Product.countDocuments({ category: 'female', subcategory: 'bags-purses', isActive: true }),
        'shoes-sandals': await Product.countDocuments({ category: 'female', subcategory: 'shoes-sandals', isActive: true })
      };
    }
    
    // Get available sizes and colors
    const allProducts = await Product.find({ category, isActive: true });
    const availableSizes = new Set();
    const availableColors = new Set();
    
    allProducts.forEach(p => {
      if (p.variations && p.variations.length > 0) {
        p.variations.forEach(v => {
          if (v.size && v.stock > 0) availableSizes.add(v.size);
          if (v.color && v.stock > 0) availableColors.add(v.color);
        });
      }
    });
    
    const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
    
    res.render('customer/category', {
      title: category.charAt(0).toUpperCase() + category.slice(1) + ' Collection',
      category,
      currentSub: sub || 'all',
      products,
      subcategoryCounts,
      availableSizes: Array.from(availableSizes).sort(),
      availableColors: Array.from(availableColors).sort(),
      filters: { size, color, minPrice, maxPrice, sort, availability },
      cartCount
    });
  } catch (error) {
    console.error('Category error:', error);
    res.status(500).send('Server error');
  }
};

// ============ PRODUCT DETAIL ============
exports.productDetail = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    
    if (!product) {
      return res.status(404).render('customer/404', { cartCount: 0 });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true
    }).limit(4);

    // Get reviews for this product
    const reviews = await Review.find({ 
      product: product._id, 
      isApproved: true 
    }).sort('-createdAt');

    // Calculate average rating
    let averageRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (reviews.length > 0) {
      const sum = reviews.reduce((total, r) => total + r.rating, 0);
      averageRating = (sum / reviews.length).toFixed(1);
      
      reviews.forEach(r => {
        ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
      });
    }

    const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;

    res.render('customer/productDetail', {
      title: product.name,
      product,
      relatedProducts,
      reviews,
      averageRating,
      ratingCounts,
      reviewCount: reviews.length,
      reviewSuccess: req.query.reviewSuccess === '1',
      reviewError: req.query.reviewError || null,
      cartCount
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).send('Server error');
  }
};

// ============ SUBMIT REVIEW ============
exports.submitReview = async (req, res) => {
  try {
    const { name, email, rating, comment } = req.body;
    const productSlug = req.params.slug;
    
    // Validate
    if (!name || !email || !rating || !comment) {
      return res.redirect(`/product/${productSlug}?reviewError=Please fill all fields#reviews`);
    }
    
    const product = await Product.findOne({ slug: productSlug });
    
    if (!product) {
      return res.redirect(`/product/${productSlug}?reviewError=Product not found#reviews`);
    }
    
    // Check if user already reviewed
    const existing = await Review.findOne({ 
      product: product._id, 
      email: email.toLowerCase().trim() 
    });
    
    if (existing) {
      return res.redirect(`/product/${productSlug}?reviewError=You have already reviewed this product#reviews`);
    }
    
    // Create review
    await Review.create({
      product: product._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      rating: parseInt(rating),
      comment: comment.trim(),
      isApproved: true // Auto-approve for now
    });
    
    res.redirect(`/product/${productSlug}?reviewSuccess=1#reviews`);
    
  } catch (error) {
    console.error('Submit review error:', error);
    res.redirect(`/product/${req.params.slug}?reviewError=Something went wrong#reviews`);
  }
};
// ============ NEWSLETTER SUBSCRIBE ============
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.redirect('/?newsletter=already');
    }
    
    await Subscriber.create({ email });
    res.redirect('/?newsletter=success');
  } catch (error) {
    console.error('Newsletter error:', error);
    res.redirect('/?newsletter=error');
  }
};
// ============ ORDER TRACKING ============
exports.showTrackOrder = (req, res) => {
  const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
  
  res.render('customer/trackOrder', {
    title: 'Track Order - New Heels',
    order: null,
    error: null,
    cartCount
  });
};

exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber, phone } = req.body;
    
    const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
    
    if (!orderNumber || !phone) {
      return res.render('customer/trackOrder', {
        title: 'Track Order - New Heels',
        order: null,
        error: 'Please enter both Order Number and Phone Number',
        cartCount
      });
    }
    
    // Find order matching order number AND phone
    const Order = require('../models/Order');
    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
      'customer.phone': phone.trim()
    });
    
    if (!order) {
      return res.render('customer/trackOrder', {
        title: 'Track Order - New Heels',
        order: null,
        error: 'No order found with this Order Number and Phone Number',
        cartCount
      });
    }
    
    res.render('customer/trackOrder', {
      title: `Order ${order.orderNumber} - New Heels`,
      order,
      error: null,
      cartCount
    });
    
  } catch (error) {
    console.error('Track order error:', error);
    const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
    
    res.render('customer/trackOrder', {
      title: 'Track Order - New Heels',
      order: null,
      error: 'Something went wrong. Please try again.',
      cartCount
    });
  }
};
// ============ SEARCH ============
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.redirect('/');
    }
    
    const searchQuery = q.trim();
    const lowerQuery = searchQuery.toLowerCase();
    
    // Build search conditions - start with name and description
    const searchConditions = [
      { name: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } }
    ];
    
    // Check for EXACT keyword matches using word boundaries
    // Category: Men
    if (/\b(men|man|mens|male|males)\b/.test(lowerQuery)) {
      searchConditions.push({ category: 'men' });
    }
    
    // Category: Women
    if (/\b(women|woman|womens|female|females|lady|ladies)\b/.test(lowerQuery)) {
      searchConditions.push({ category: 'female' });
    }
    
    // Category: Kids
    if (/\b(kid|kids|child|children|baby|babies)\b/.test(lowerQuery)) {
      searchConditions.push({ category: 'kids' });
    }
    
    // Subcategory: Shoes (general)
    if (/\b(shoe|shoes|sneaker|sneakers|heel|heels|sandal|sandals)\b/.test(lowerQuery)) {
      searchConditions.push({ subcategory: { $in: ['shoes', 'shoes-sandals'] } });
    }
    
    // Subcategory: Chappals
    if (/\b(chappal|chappals|chappal|slipper|slippers)\b/.test(lowerQuery)) {
      searchConditions.push({ subcategory: 'chappals' });
    }
    
    // Subcategory: Peshawri
    if (/\b(peshawri|peshawar|kheri)\b/.test(lowerQuery)) {
      searchConditions.push({ subcategory: 'peshawri' });
    }
    
    // Subcategory: Bags/Purses
    if (/\b(bag|bags|purse|purses|handbag|handbags)\b/.test(lowerQuery)) {
      searchConditions.push({ subcategory: 'bags-purses' });
    }
    
    // Subcategory: Toddler
    if (/\b(toddler|toddlers)\b/.test(lowerQuery)) {
      searchConditions.push({ subcategory: 'toddler' });
    }
    
    // Subcategory: Little Kids
    if (/\b(little|little-kids)\b/.test(lowerQuery)) {
      searchConditions.push({ subcategory: 'little-kids' });
    }
    
    // Subcategory: Big Kids
    if (/\b(big|big-kids)\b/.test(lowerQuery)) {
      searchConditions.push({ subcategory: 'big-kids' });
    }
    
    const products = await Product.find({
      isActive: true,
      $or: searchConditions
    }).limit(50);
    
    const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
    
    res.render('customer/search', {
      title: `Search: ${searchQuery} - New Heels`,
      query: searchQuery,
      products,
      cartCount
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).send('Server error');
  }
};  