const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Main category
  category: {
    type: String,
    enum: ['men', 'kids', 'female'],
    required: true
  },
  
  // Subcategory (optional but recommended)
  subcategory: {
    type: String,
    enum: [
      'shoes',           // Men: Shoes
      'chappals',        // Men: Chappals
      'peshawri',        // Men: Peshawri Chappals
      'toddler',         // Kids: Toddler (1-4)
      'little-kids',     // Kids: Little Kids (4-8)
      'big-kids',        // Kids: Big Kids (8-12)
      'bags-purses',     // Women: Bags & Purses
      'shoes-sandals'    // Women: Shoes & Sandals
    ],
    default: null
  },
  
  // Legacy type field (kept for compatibility)
  type: {
    type: String,
    enum: ['shoe', 'bag'],
    required: true
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  salePrice: {
    type: Number,
    default: null
  },
  
  images: [{
    type: String
  }],
  
  variations: [{
    size: String,
    color: String,
    stock: Number,
    sku: String
  }],
  
  stock: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isNewArrival: {
    type: Boolean,
    default: false
  },
  
  isBestSeller: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate slug
productSchema.pre('save', async function() {
  if (this.name && (!this.slug || this.isModified('name'))) {
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (!baseSlug) baseSlug = 'product';
    
    const Product = mongoose.model('Product');
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await Product.findOne({ slug, _id: { $ne: this._id } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Product', productSchema);