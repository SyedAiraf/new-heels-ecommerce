const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Debug middleware
router.use((req, res, next) => {
  if (req.path === '/checkout') {
    console.log('🎯 Checkout route hit:', req.method, req.path);
    console.log('   Body keys:', Object.keys(req.body || {}));
    console.log('   Session cart items:', req.session.cart ? req.session.cart.length : 0);
  }
  next();
});

// Checkout page
router.get('/checkout', cartController.showCheckout);
router.post('/checkout', cartController.placeOrder);

// Order success
router.get('/order-success/:id', cartController.orderSuccess);

module.exports = router;