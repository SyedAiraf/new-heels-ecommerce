const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin, redirectIfAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Login routes
router.get('/login', redirectIfAuthenticated, adminController.showLogin);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

// Dashboard (protected)
router.get('/dashboard', isAdmin, adminController.dashboard);

// Product routes (protected)
router.get('/products', isAdmin, adminController.listProducts);
router.get('/products/add', isAdmin, adminController.showAddProduct);
router.post('/products/add', isAdmin, upload.array('images', 10), adminController.addProduct);
router.get('/products/edit/:id', isAdmin, adminController.showEditProduct);
router.post('/products/edit/:id', isAdmin, upload.array('images', 10), adminController.editProduct);
router.post('/products/restore/:id', isAdmin, adminController.restoreProduct);
router.post('/products/delete/:id', isAdmin, adminController.deleteProduct);

// Settings routes
router.get('/settings', isAdmin, adminController.showSettings);
router.post('/settings/promo', isAdmin, adminController.updatePromo);
router.post('/settings/announcement', isAdmin, adminController.updateAnnouncement);
// Subscribers
router.get('/subscribers', isAdmin, adminController.listSubscribers);

// Reviews
router.get('/reviews', isAdmin, adminController.listReviews);
router.post('/reviews/approve/:id', isAdmin, adminController.approveReview);
router.post('/reviews/unapprove/:id', isAdmin, adminController.unapproveReview);
router.post('/reviews/delete/:id', isAdmin, adminController.deleteReview);

// Order routes
router.get('/orders', isAdmin, adminController.listOrders);
router.get('/orders/:id', isAdmin, adminController.showOrderDetail);
router.post('/orders/:id/status', isAdmin, adminController.updateOrderStatus);
router.post('/orders/:id/payment', isAdmin, adminController.updatePaymentStatus);
router.post('/orders/:id/delete', isAdmin, adminController.deleteOrder);
router.post('/settings/contact', isAdmin, adminController.updateContact);

// Delete specific image from product
router.post('/products/:id/delete-image', isAdmin, adminController.deleteProductImage);

// Banner routes
router.get('/banners', isAdmin, adminController.listBanners);
router.get('/banners/add', isAdmin, adminController.showAddBanner);
router.post('/banners/add', isAdmin, upload.array('image', 1), adminController.addBanner);
router.get('/banners/edit/:id', isAdmin, adminController.showEditBanner);
router.post('/banners/edit/:id', isAdmin, upload.array('image', 1), adminController.editBanner);
router.post('/banners/delete/:id', isAdmin, adminController.deleteBanner);


module.exports = router;