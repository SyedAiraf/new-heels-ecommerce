// Check if user is logged in as admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.session.error = 'Please login to access admin panel';
  res.redirect('/admin/login');
};

// Redirect to dashboard if already logged in
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = { isAdmin, redirectIfAuthenticated };