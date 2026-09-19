const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Homepage
router.get('/', customerController.home);

// Category pages
router.get('/category/:category', customerController.category);

// Product detail
router.get('/product/:slug', customerController.productDetail);
// Newsletter
router.post('/newsletter/subscribe', customerController.subscribeNewsletter);
// Search
router.get('/search', customerController.search);

// Order Tracking
router.get('/track-order', customerController.showTrackOrder);
router.post('/track-order', customerController.trackOrder);

// Product Reviews
router.post('/product/:slug/review', customerController.submitReview);

// Policy Pages
router.get('/shipping-policy', (req, res) => {
  const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
  res.render('customer/shippingPolicy', { title: 'Shipping Policy - New Heels', cartCount });
});

router.get('/return-policy', (req, res) => {
  const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
  res.render('customer/returnPolicy', { title: 'Return Policy - New Heels', cartCount });
});

router.get('/privacy-policy', (req, res) => {
  const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
  res.render('customer/privacyPolicy', { title: 'Privacy Policy - New Heels', cartCount });
});

router.get('/about', (req, res) => {
  const cartCount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
  res.render('customer/about', { title: 'About Us - New Heels', cartCount });
});

module.exports = router;