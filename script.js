// Initialize cart from localStorage or create empty array
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCount = cart.reduce((total, item) => total + item.quantity, 0);

// DOM Elements
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const cartIcon = document.querySelector('.cart-icon');
const cartCountElement = document.querySelector('.cart-count');
const notification = document.querySelector('.notification');
const searchBar = document.querySelector('.search-bar');
const productCards = document.querySelectorAll('.product-card');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initializeSearch();
    
    if (window.location.pathname.includes('cart.html')) {
        renderCartItems();
        setupPaymentForm();
        setupCartEventListeners();
    }
});

/* ========== CART FUNCTIONALITY ========== */
if (addToCartButtons) {
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            const product = {
                id: productCard.dataset.id || Date.now().toString(),
                name: productCard.querySelector('.product-name').textContent,
                price: parseFloat(productCard.querySelector('.product-price').textContent.replace('$', '')),
                size: productCard.querySelector('.product-size').textContent,
                image: productCard.querySelector('.product-image').src,
                quantity: 1
            };

            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push(product);
            }

            cartCount++;
            saveCart();
            updateCartCount();
            showNotification('Item added to cart!');
        });
    });
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartCount', cartCount.toString());
}

function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = cartCount;
    });
}

function showNotification(message) {
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

if (cartIcon) {
    cartIcon.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });
}

function renderCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const subtotalElement = document.querySelector('.subtotal-amount');
    const gstElement = document.querySelector('.gst-amount');
    const totalElement = document.querySelector('.total-amount');

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.dataset.index = index;
            cartItemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.size}</p>
                    <p>$${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn increase">+</button>
                </div>
                <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item">×</button>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        updateCartTotals();
    }
}

function setupCartEventListeners() {
    // Use event delegation for dynamic elements
    document.querySelector('.cart-items').addEventListener('click', (e) => {
        if (!e.target.classList.contains('quantity-btn') && !e.target.classList.contains('remove-item')) return;
        
        const cartItem = e.target.closest('.cart-item');
        const index = parseInt(cartItem.dataset.index);
        const quantityElement = cartItem.querySelector('.quantity');
        let quantity = parseInt(quantityElement.textContent);
        const decreaseBtn = cartItem.querySelector('.decrease');

        if (e.target.classList.contains('increase')) {
            quantity++;
            cart[index].quantity = quantity;
            cartCount++;
            decreaseBtn.disabled = false;
        } 
        else if (e.target.classList.contains('decrease')) {
            quantity--;
            cart[index].quantity = quantity;
            cartCount--;
            if (quantity <= 1) {
                decreaseBtn.disabled = true;
            }
        }
        else if (e.target.classList.contains('remove-item')) {
            cartCount -= cart[index].quantity;
            cart.splice(index, 1);
            saveCart();
            updateCartCount();
            renderCartItems();
            showNotification('Item removed from cart');
            return;
        }

        quantityElement.textContent = quantity;
        saveCart();
        updateCartCount();
        updateCartTotals();
    });
}

function updateCartTotals() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = subtotal * 0.125;
    const total = subtotal + gst;

    document.querySelector('.subtotal-amount').textContent = `$${subtotal.toFixed(2)}`;
    document.querySelector('.gst-amount').textContent = `$${gst.toFixed(2)}`;
    document.querySelector('.total-amount').textContent = `$${total.toFixed(2)}`;
}

function setupPaymentForm() {
    const paymentForm = document.getElementById('payment-form');
    const paymentSuccess = document.querySelector('.payment-success');

    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate form inputs
            const cardNumber = document.getElementById('card-number').value.trim();
            const cardName = document.getElementById('card-name').value.trim();
            const expiryDate = document.getElementById('expiry-date').value.trim();
            const cvv = document.getElementById('cvv').value.trim();

            if (!cardNumber || !cardName || !expiryDate || !cvv) {
                showNotification('Please fill all payment details');
                return;
            }

            // Process payment (simulated)
            processPayment(cardNumber, cardName, expiryDate, cvv)
                .then(() => {
                    // Hide form and show success message
                    paymentForm.style.display = 'none';
                    paymentSuccess.style.display = 'block';
                    
                    // Clear cart after successful payment
                    cart = [];
                    cartCount = 0;
                    saveCart();
                    updateCartCount();
                    
                    // Show success message
                    paymentSuccess.innerHTML = `
                        <div class="payment-success-content">
                            <i class="fas fa-check-circle"></i>
                            <h3>Payment Successful!</h3>
                            <p>Your order has been processed</p>
                            <p>Transaction ID: ${generateTransactionId()}</p>
                            <button onclick="window.location.href='index.html'" class="continue-shopping">
                                Continue Shopping
                            </button>
                        </div>
                    `;
                })
                .catch(error => {
                    showNotification('Payment failed: ' + error);
                });
        });
    }
}

// Simulated payment processing
function processPayment(cardNumber, cardName, expiryDate, cvv) {
    return new Promise((resolve, reject) => {
        // Simulate API call delay
        setTimeout(() => {
            // Simple validation - in real app, use proper payment processing
            if (cardNumber.length >= 16 && 
                cardName.length > 3 && 
                expiryDate.match(/^\d{2}\/\d{2}$/) && 
                cvv.length >= 3) {
                resolve();
            } else {
                reject('Invalid payment details');
            }
        }, 1500); // Simulate network delay
    });
}

function generateTransactionId() {
    return 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/* ========== SEARCH FUNCTIONALITY ========== */
function initializeSearch() {
    if (!searchBar) return;

    performSearch();
    searchBar.addEventListener('input', debounce(performSearch, 300));

    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            searchBar.value = '';
            performSearch();
        });
    }
}

function performSearch() {
    if (!searchBar || !productCards.length) return;
    
    const searchTerm = searchBar.value.toLowerCase();
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productDesc = card.querySelector('.product-description').textContent.toLowerCase();
        const matchesSearch = productName.includes(searchTerm) || productDesc.includes(searchTerm);
        
        card.style.display = matchesSearch ? 'flex' : 'none';
        card.setAttribute('data-search-match', matchesSearch);
    });
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}