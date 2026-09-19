const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Cart page
router.get('/', cartController.showCart);

// Add to cart
router.post('/add', cartController.addToCart);

// Update quantity
router.post('/update', cartController.updateCart);

// Remove item
router.post('/remove', cartController.removeFromCart);

// Get cart count
router.get('/count', cartController.getCartCount);

// Checkout
router.get('/checkout', cartController.showCheckout);
router.post('/checkout', cartController.placeOrder);

// Order success
router.get('/order-success/:id', cartController.orderSuccess);

module.exports = router;