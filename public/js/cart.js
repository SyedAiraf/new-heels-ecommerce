// Update quantity (for cart page)
function updateQuantity(productId, size, color, newQuantity) {
    if (newQuantity < 1) {
        removeItem(productId, size, color);
        return;
    }
    
    fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, size, color, quantity: newQuantity })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    })
    .catch(err => console.error(err));
}

// Remove item
function removeItem(productId, size, color) {
    if (!confirm('Remove this item from cart?')) return;
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/cart/remove';
    
    const fields = { productId, size, color };
    for (const key in fields) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
    }
    
    document.body.appendChild(form);
    form.submit();
}

// Change quantity in product detail page
function changeQty(amount) {
    const input = document.getElementById('quantity');
    if (!input) return;
    let val = parseInt(input.value) + amount;
    if (val < 1) val = 1;
    input.value = val;
}

// Select size
let selectedSize = '';
let selectedColor = '';

function selectSize(btn) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedSize = btn.textContent.trim();
}

// ============ PREMIUM CART NOTIFICATION ============
function showCartNotification(cartCount) {
    // Remove any existing notification
    const existing = document.querySelector('.cart-notification-overlay');
    if (existing) existing.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'cart-notification-overlay';
    overlay.innerHTML = `
        <div class="cart-notification">
            <button class="cart-notification-close" onclick="closeCartNotification()">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="cart-notification-icon">
                <i class="bi bi-check-lg"></i>
            </div>
            <h4 class="cart-notification-title">Added to Cart Successfully</h4>
            <p class="cart-notification-subtitle">Item has been added to your shopping bag</p>
            <div class="cart-notification-actions">
                <a href="/cart" class="cart-notification-btn cart-notification-btn-outline">
                    <i class="bi bi-bag"></i> View Cart
                </a>
                <a href="/checkout" class="cart-notification-btn cart-notification-btn-solid">
                    <i class="bi bi-lightning-charge"></i> Buy It Now
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => overlay.classList.add('show'), 10);
    
    // Update cart badges
    document.querySelectorAll('.header-icon .badge, .mobile-cart-badge').forEach(badge => {
        badge.textContent = cartCount;
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        closeCartNotification();
    }, 5000);
}

function closeCartNotification() {
    const overlay = document.querySelector('.cart-notification-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 400);
    }
}

// ============ ADD TO CART ============
function addToCart(productId, productType) {
    const quantity = parseInt(document.getElementById('quantity')?.value || 1);
    
    if (productType === 'shoe' && !selectedSize) {
        alert('Please select a size first!');
        return;
    }
    
    fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productId: productId,
            size: selectedSize,
            color: selectedColor,
            quantity: quantity
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showCartNotification(data.cartCount);
        } else {
            alert('❌ ' + (data.message || 'Failed to add to cart'));
        }
    })
    .catch(err => {
        console.error(err);
        alert('❌ Something went wrong');
    });
}

// Close notification on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('cart-notification-overlay')) {
        closeCartNotification();
    }
});

// Close on Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCartNotification();
    }
});