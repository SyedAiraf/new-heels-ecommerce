const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendOrderConfirmationEmail, sendAdminOrderNotification } = require('../services/emailService');

// ============ SHOW CART PAGE ============
exports.showCart = async (req, res) => {
  try {
    const cart = req.session.cart || [];
    
    // Fetch product details for each cart item
    const cartItems = [];
    let subtotal = 0;
    
    for (const item of cart) {
      const product = await Product.findById(item.productId);
      
      if (product && product.isActive) {
        const price = product.salePrice || product.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        
        cartItems.push({
          productId: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          price: price,
          originalPrice: product.price,
          salePrice: product.salePrice,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          itemTotal: itemTotal
        });
      }
    }
    
    // Delivery charges (can be changed later)
    const deliveryCharge = subtotal > 5000 ? 0 : 250;
    const total = subtotal + deliveryCharge;
    
    res.render('customer/cart', {
      title: 'Shopping Cart - New Heels',
      cartItems,
      subtotal,
      deliveryCharge,
      total,
      cartCount: cartItems.length
    });
  } catch (error) {
    console.error('Cart page error:', error);
    res.status(500).send('Server error');
  }
};

// ============ ADD TO CART ============
exports.addToCart = async (req, res) => {
  try {
    const { productId, size, color, quantity } = req.body;
    
    // Initialize cart if not exists
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.json({ success: false, message: 'Product not found' });
    }
    
    // Check if item already exists in cart (same product + size + color)
    const existingItem = req.session.cart.find(item => 
      item.productId === productId && 
      (item.size || '') === (size || '') && 
      (item.color || '') === (color || '')
    );
    
    if (existingItem) {
      existingItem.quantity += parseInt(quantity) || 1;
    } else {
      req.session.cart.push({
        productId,
        size: size || '',
        color: color || '',
        quantity: parseInt(quantity) || 1
      });
    }
    
    const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
    
    res.json({ 
      success: true, 
      message: 'Added to cart!',
      cartCount: cartCount
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.json({ success: false, message: 'Server error' });
  }
};

// ============ UPDATE CART QUANTITY ============
exports.updateCart = async (req, res) => {
  try {
    const { productId, size, color, quantity } = req.body;
    
    if (!req.session.cart) {
      return res.json({ success: false });
    }
    
    const item = req.session.cart.find(item => 
      item.productId === productId && 
      (item.size || '') === (size || '') && 
      (item.color || '') === (color || '')
    );
    
    if (item) {
      item.quantity = parseInt(quantity);
      
      if (item.quantity <= 0) {
        // Remove item if quantity is 0
        req.session.cart = req.session.cart.filter(i => 
          !(i.productId === productId && 
            (i.size || '') === (size || '') && 
            (i.color || '') === (color || ''))
        );
      }
    }
    
    const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
    
    res.json({ 
      success: true, 
      cartCount: cartCount
    });
    
  } catch (error) {
    console.error('Update cart error:', error);
    res.json({ success: false });
  }
};

// ============ REMOVE FROM CART ============
exports.removeFromCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    
    if (!req.session.cart) {
      return res.redirect('/cart');
    }
    
    req.session.cart = req.session.cart.filter(item => 
      !(item.productId === productId && 
        (item.size || '') === (size || '') && 
        (item.color || '') === (color || ''))
    );
    
    res.redirect('/cart');
    
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.redirect('/cart');
  }
};

// ============ GET CART COUNT (API) ============
exports.getCartCount = (req, res) => {
  const cart = req.session.cart || [];
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  res.json({ cartCount });
};
// ============ SHOW CHECKOUT PAGE ============
exports.showCheckout = async (req, res) => {
  try {
    console.log('=== SHOW CHECKOUT ===');
    console.log('Session cart:', req.session.cart);
    
    const cart = req.session.cart || [];
    
    if (cart.length === 0) {
      console.log('Cart empty, redirecting to cart');
      return res.redirect('/cart');
    }
    
    // ... rest of code
    // Build cart items with details
    const cartItems = [];
    let subtotal = 0;
    
    for (const item of cart) {
      const product = await Product.findById(item.productId);
      if (product && product.isActive) {
        const price = product.salePrice || product.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        
        cartItems.push({
          productId: product._id,
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          price: price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          itemTotal: itemTotal
        });
      }
    }
    
    const deliveryCharge = subtotal > 5000 ? 0 : 250;
    const total = subtotal + deliveryCharge;
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    res.render('customer/checkout', {
      title: 'Checkout - New Heels',
      cartItems,
      subtotal,
      deliveryCharge,
      total,
      cartCount
    });
  } catch (error) {
    console.error('Checkout page error:', error);
    res.status(500).send('Server error');
  }
};

// ============ PLACE ORDER ============
exports.placeOrder = async (req, res) => {
  try {
    console.log('=== PLACE ORDER CALLED ===');
    console.log('Body:', req.body);
    console.log('Session cart:', req.session.cart);
    
    const cart = req.session.cart || [];
    
    if (cart.length === 0) {
      console.log('❌ CART IS EMPTY');
      return res.redirect('/cart');
    }
    
    const { name, email, phone, address, city, postalCode, notes, paymentMethod } = req.body;
    
    // Build order items
    const orderItems = [];
    let subtotal = 0;
    
    for (const item of cart) {
      const product = await Product.findById(item.productId);
      if (product && product.isActive) {
        const price = product.salePrice || product.price;
        subtotal += price * item.quantity;
        
        orderItems.push({
          product: product._id,
          productName: product.name,
          productImage: product.images && product.images.length > 0 ? product.images[0] : '',
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: price
        });
      }
    }
    
    const deliveryCharge = subtotal > 5000 ? 0 : 250;
    const total = subtotal + deliveryCharge;
    
    // Create order
    const order = await Order.create({
      customer: { name, email, phone, address, city, postalCode, notes: notes || '' },
      items: orderItems,
      subtotal,
      deliveryCharge,
      total,
      paymentMethod: paymentMethod || 'cod'
    });
    
    console.log('✅ Order created:', order.orderNumber);
    
    // Clear cart
    req.session.cart = [];
    
    // Save session explicitly BEFORE redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/checkout?error=1');
      }
      
      // Send emails (don't block)
      try {
        sendOrderConfirmationEmail(order).catch(e => console.error('Email error:', e.message));
        sendAdminOrderNotification(order).catch(e => console.error('Email error:', e.message));
      } catch (e) {
        console.error('Email error:', e.message);
      }
      
      console.log('✅ Session saved, redirecting to success');
      res.redirect('/order-success/' + order._id);
    });
    
  } catch (error) {
    console.error('❌ Place order error:', error);
    res.redirect('/checkout?error=1');
  }
};

// ============ ORDER SUCCESS PAGE ============
exports.orderSuccess = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.redirect('/');
    }
    
    res.render('customer/orderSuccess', {
      title: 'Order Confirmed - New Heels',
      order,
      cartCount: 0
    });
  } catch (error) {
    console.error('Order success error:', error);
    res.redirect('/');
  }
};