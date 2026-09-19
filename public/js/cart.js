// Update quantity
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

// Add to cart from product detail
function addToCart(productId) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const productType = document.getElementById('productType')?.value;
    
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
            const badge = document.querySelector('.header-icon .badge');
            if (badge) badge.textContent = data.cartCount;
            
            alert('✅ Added to cart successfully!');
        } else {
            alert('❌ ' + (data.message || 'Failed to add to cart'));
        }
    })
    .catch(err => {
        console.error(err);
        alert('❌ Something went wrong');
    });
}