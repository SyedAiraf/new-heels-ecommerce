// ============ PREMIUM CART NOTIFICATION ============
function showCartNotification(cartCount) {
    const existing = document.querySelector('.cart-notification-overlay');
    if (existing) existing.remove();
    
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
    setTimeout(() => overlay.classList.add('show'), 10);
    
    document.querySelectorAll('.header-icon .badge, .mobile-cart-badge').forEach(badge => {
        badge.textContent = cartCount;
    });
    
    setTimeout(() => closeCartNotification(), 5000);
}

function closeCartNotification() {
    const overlay = document.querySelector('.cart-notification-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 400);
    }
}

// ============ PREMIUM REMOVE CONFIRMATION ============
function showRemoveConfirmation(productId, size, color, itemName) {
    const existing = document.querySelector('.remove-confirm-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'remove-confirm-overlay';
    overlay.innerHTML = `
        <div class="remove-confirm-box">
            <div class="remove-confirm-icon">
                <i class="bi bi-trash"></i>
            </div>
            <h4 class="remove-confirm-title">Remove Item?</h4>
            <p class="remove-confirm-text">Are you sure you want to remove <strong>${itemName}</strong> from your cart?</p>
            <div class="remove-confirm-actions">
                <button class="remove-confirm-btn remove-confirm-cancel" onclick="closeRemoveConfirm()">
                    Cancel
                </button>
                <button class="remove-confirm-btn remove-confirm-delete" onclick="confirmRemove('${productId}', '${size}', '${color}')">
                    Remove
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
}

function closeRemoveConfirm() {
    const overlay = document.querySelector('.remove-confirm-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    }
}

function confirmRemove(productId, size, color) {
    closeRemoveConfirm();
    
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

// Update quantity (for cart page)
function updateQuantity(productId, size, color, newQuantity) {
    if (newQuantity < 1) {
        const nameEl = document.querySelector(`[data-item-name="${productId}-${size}-${color}"]`);
        const itemName = nameEl ? nameEl.textContent : 'this item';
        showRemoveConfirmation(productId, size, color, itemName);
        return;
    }
    
    fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, size, color, quantity: newQuantity })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) location.reload();
    })
    .catch(err => console.error(err));
}

// Remove item button (called from cart page)
function removeItem(productId, size, color) {
    const nameEl = document.querySelector(`[data-item-name="${productId}-${size}-${color}"]`);
    const itemName = nameEl ? nameEl.textContent : 'this item';
    showRemoveConfirmation(productId, size, color, itemName);
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

// Close on overlay click / Escape
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('cart-notification-overlay')) {
        closeCartNotification();
    }
    if (e.target.classList.contains('remove-confirm-overlay')) {
        closeRemoveConfirm();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCartNotification();
        closeRemoveConfirm();
    }
});