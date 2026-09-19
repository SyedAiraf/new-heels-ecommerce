const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ MongoDB error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve robots.txt from root
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// Serve sitemap.xml (if you add one later)
app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  if (require('fs').existsSync(sitemapPath)) {
    res.sendFile(sitemapPath);
  } else {
    res.status(404).send('Not found');
  }
});

// Simple session config (memory store)
app.use(session({
  secret: process.env.SESSION_SECRET || 'new-heels-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make session available in views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Routes
app.use('/admin', require('./routes/adminRoutes'));
app.use('/cart', require('./routes/cartRoutes'));
app.use('/', require('./routes/checkoutRoutes'));
app.use('/', require('./routes/customerRoutes'));

// 500 Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.message);
  console.error(err.stack);
  
  res.status(500).render('customer/500', {
    title: 'Server Error - New Heels',
    cartCount: 0
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('customer/404', {
    title: 'Page Not Found - New Heels',
    cartCount: 0
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});