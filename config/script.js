const PRODUCTS_API_URL = '/api/products';
const ORDERS_API_URL = '/api/orders';

// Dummy data fallback for demonstration if API fails or is not setup
const dummyProducts = [
    { id: 1, name: "Premium Wireless Headphones", description: "High-quality noise-canceling wireless headphones with 30-hour battery life.", price: 299.99, stock: 15, category: "Electronics", scent: "Ocean Breeze", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80"] },
    { id: 2, name: "Minimalist Smartwatch", description: "Sleek smartwatch with health tracking, notifications, and water resistance.", price: 199.50, stock: 20, category: "Electronics", scent: "Citrus Punch", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" },
    { id: 3, name: "Classic Cotton T-Shirt", description: "Ultra-soft 100% organic cotton t-shirt. Perfect for everyday wear.", price: 29.99, stock: 50, category: "Clothing", scent: "Fresh Linen", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80" },
    { id: 4, name: "Leather Crossbody Bag", description: "Genuine leather bag with multiple compartments and adjustable strap.", price: 89.00, stock: 10, category: "Accessories", scent: "Leather & Sandalwood", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80" },
    { id: 5, name: "Polarized Sunglasses", description: "UV400 polarized sunglasses with lightweight frame.", price: 45.00, stock: 30, category: "Accessories", scent: "Cool Mint", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80" },
    { id: 6, name: "Denim Jacket", description: "Vintage wash denim jacket. A timeless wardrobe staple.", price: 75.00, stock: 25, category: "Clothing", scent: "Wild Musk", image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&q=80" }
];

// --- State ---
let products = [];
let cart = JSON.parse(localStorage.getItem('luxecart_data')) || [];

// --- DOM Elements ---
const productsGrid = document.getElementById('productsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const cartBadge = document.getElementById('cartBadge');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartTotalText = document.getElementById('cartTotalText');
const categoryFilter = document.getElementById('categoryFilter');
const sortPrice = document.getElementById('sortPrice');
const navbarSearch = document.getElementById('navbarSearch');
const mobileSearch = document.getElementById('mobileSearch');
const currentYearSpan = document.getElementById('currentYear');
const checkoutOrderSummary = document.getElementById('checkoutOrderSummary');
const checkoutGrandTotal = document.getElementById('checkoutGrandTotal');
const checkoutForm = document.getElementById('checkoutForm');
const placeOrderBtn = document.getElementById('placeOrderBtn');

// Modals & Offcanvas
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
const successModal = new bootstrap.Modal(document.getElementById('successModal'));
const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    currentYearSpan.textContent = new Date().getFullYear();
    fetchProducts();
    updateCartUI();
    setupEventListeners();
});

// --- Fetch Products ---
async function fetchProducts() {
    try {
        // Attempt to fetch from API
        const response = await fetch(PRODUCTS_API_URL);
        if (!response.ok) throw new Error('API fetch failed');
        const data = await response.json();

        // Map data if necessary (assuming SheetDB returns array of objects)
        // Ensure price and stock are numbers
        products = data.map(item => {
            const rawImages = item['Images'] || item['Image URL'] || 'https://via.placeholder.com/500';
            const imagesArray = rawImages.split(',').map(url => url.trim()).filter(url => url);
            return {
                id: item.ID || Date.now() + Math.random(),
                name: item.Name || 'Unknown Product',
                brand: item.Brand || '',
                price: parseFloat(String(item.Price).replace(/[^0-9.]/g, '')) || 0,
                image: imagesArray[0],
                images: imagesArray,
                category: item.Type || 'Uncategorized',
                scent: item.Scent || '',
                description: item.Description || '',
                stock: parseInt(item.Stock, 10) || 0,
                status: item.Status || ''
            };
        });

    } catch (error) {
        console.warn("Using dummy data. API error:", error);
        products = [...dummyProducts];
    } finally {
        loadingSpinner.classList.add('d-none');
        populateCategories();
        renderProducts(products);
    }
}

// --- Populate Categories ---
function populateCategories() {
    const uniqueCategories = [...new Set(products.map(p => p.category))].filter(c => c);
    let optionsHtml = '<option value="all">All Categories</option>';
    uniqueCategories.forEach(cat => {
        optionsHtml += `<option value="${cat}">${cat}</option>`;
    });
    categoryFilter.innerHTML = optionsHtml;
}

// --- Render Products ---
function renderProducts(productsToRender) {
    productsGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search fs-1 text-muted mb-3 d-block"></i>
                <h4 class="text-muted">No products found.</h4>
            </div>
        `;
        return;
    }

    productsToRender.forEach(product => {
        const outOfStock = product.stock <= 0;
        const cardHtml = `
            <div class="col-sm-6 col-lg-4">
                <div class="product-card rounded-4 overflow-hidden position-relative">
                    <div class="product-img-wrapper cursor-pointer" onclick="openProductModal('${product.id}')">
                        <img src="${product.image}" alt="${product.name}" class="product-img">
                        ${product.brand ? `<span class="badge bg-dark position-absolute top-0 start-0 m-3 shadow-sm">${product.brand}</span>` : ''}
                        ${outOfStock ? '<span class="badge bg-danger position-absolute top-0 end-0 m-3 shadow-sm">Out of Stock</span>' : ''}
                        <button class="btn btn-primary rounded-pill add-to-cart-btn shadow-sm d-none d-lg-block" onclick="event.stopPropagation(); addToCart('${product.id}', 1)" ${outOfStock ? 'disabled' : ''}>
                            <i class="bi bi-cart-plus me-1"></i> Add to Cart
                        </button>
                    </div>
                    <div class="card-body p-4 cursor-pointer" onclick="openProductModal('${product.id}')">
                        <div class="d-flex gap-2 mb-2">
                            <span class="badge bg-light text-secondary border">${product.category}</span>
                            ${product.scent ? `<span class="badge bg-info-subtle text-info border"><i class="bi bi-flower1 me-1"></i>${product.scent}</span>` : ''}
                        </div>
                        <h5 class="product-title text-dark">${product.name}</h5>
                        <p class="product-desc">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="product-price">₹${Number(product.price || 0).toFixed(2)}</span>
                            <button class="btn btn-outline-primary btn-sm rounded-circle d-lg-none" onclick="event.stopPropagation(); addToCart('${product.id}', 1)" ${outOfStock ? 'disabled' : ''}>
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productsGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    // Search
    navbarSearch.addEventListener('input', handleFilterSort);
    mobileSearch.addEventListener('input', handleFilterSort);

    // Filter & Sort
    categoryFilter.addEventListener('change', handleFilterSort);
    sortPrice.addEventListener('change', handleFilterSort);

    // Product Modal Quantity
    document.getElementById('modalMinusBtn').addEventListener('click', () => {
        const input = document.getElementById('modalQty');
        if (input.value > 1) input.value = parseInt(input.value) - 1;
    });

    document.getElementById('modalPlusBtn').addEventListener('click', () => {
        const input = document.getElementById('modalQty');
        const stock = parseInt(document.getElementById('modalStock').dataset.stock);
        if (input.value < stock) input.value = parseInt(input.value) + 1;
    });

    // Modal Buttons
    document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
        const id = document.getElementById('modalAddToCartBtn').dataset.id;
        const qty = parseInt(document.getElementById('modalQty').value);
        addToCart(id, qty);
        productModal.hide();
    });

    document.getElementById('modalBuyNowBtn').addEventListener('click', () => {
        const id = document.getElementById('modalBuyNowBtn').dataset.id;
        const qty = parseInt(document.getElementById('modalQty').value);
        addToCart(id, qty);
        productModal.hide();
        cartOffcanvas.show();
    });

    // Checkout Modal Open
    document.getElementById('checkoutBtn').addEventListener('click', populateCheckoutSummary);

    // Checkout Form Submit
    checkoutForm.addEventListener('submit', handleCheckout);

    // Pincode blur → fetch post offices
    document.getElementById('cPincode').addEventListener('blur', fetchPostOffices);
}

// --- Filter and Sort Logic ---
function handleFilterSort() {
    const searchTerm = (navbarSearch.value || mobileSearch.value).toLowerCase();
    const category = categoryFilter.value;
    const sort = sortPrice.value;

    let filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || p.category === category;
        return matchesSearch && matchesCategory;
    });

    if (sort === 'low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'high') {
        filtered.sort((a, b) => b.price - a.price);
    }

    renderProducts(filtered);
}

// --- Modal Logic ---
function openProductModal(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const imagesToDisplay = product.images && product.images.length > 0 ? product.images : [product.image];
    const carouselInner = document.getElementById('carouselInner');
    const carouselIndicators = document.getElementById('carouselIndicators');

    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';

    imagesToDisplay.forEach((imgSrc, index) => {
        const activeClass = index === 0 ? 'active' : '';

        // Indicator
        carouselIndicators.innerHTML += `
            <button type="button" data-bs-target="#productCarousel" data-bs-slide-to="${index}" class="${activeClass} bg-dark" aria-current="${index === 0 ? 'true' : 'false'}" aria-label="Slide ${index + 1}"></button>
        `;

        // Item
        carouselInner.innerHTML += `
            <div class="carousel-item ${activeClass} w-100 h-100">
                <img src="${imgSrc}" class="d-block w-100 h-100 object-fit-contain p-4 product-modal-img" alt="${product.name} Image ${index + 1}">
            </div>
        `;
    });

    // Hide controls if only 1 image
    const prevBtn = document.querySelector('.carousel-control-prev');
    const nextBtn = document.querySelector('.carousel-control-next');
    if (imagesToDisplay.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        carouselIndicators.style.display = 'none';
    } else {
        prevBtn.style.display = '';
        nextBtn.style.display = '';
        carouselIndicators.style.display = '';
    }

    document.getElementById('modalCategory').textContent = product.category;
    const scentEl = document.getElementById('modalScent');
    if (product.scent) {
        scentEl.innerHTML = `<i class="bi bi-flower1 me-1"></i>${product.scent}`;
        scentEl.classList.remove('d-none');
        scentEl.classList.add('d-inline-block');
    } else {
        scentEl.classList.add('d-none');
        scentEl.classList.remove('d-inline-block');
    }
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalPrice').textContent = '₹' + Number(product.price || 0).toFixed(2);
    document.getElementById('modalDesc').textContent = product.description;

    const stockEl = document.getElementById('modalStock');
    stockEl.dataset.stock = product.stock;
    if (product.stock > 0) {
        stockEl.textContent = `In Stock (${product.stock} available)`;
        stockEl.className = "text-success fw-semibold mb-3";
        stockEl.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> ${stockEl.textContent}`;
    } else {
        stockEl.textContent = "Out of Stock";
        stockEl.className = "text-danger fw-semibold mb-3";
        stockEl.innerHTML = `<i class="bi bi-x-circle-fill me-1"></i> ${stockEl.textContent}`;
    }

    document.getElementById('modalQty').value = 1;

    const addBtn = document.getElementById('modalAddToCartBtn');
    const buyBtn = document.getElementById('modalBuyNowBtn');

    addBtn.dataset.id = product.id;
    buyBtn.dataset.id = product.id;

    if (product.stock <= 0) {
        addBtn.disabled = true;
        buyBtn.disabled = true;
    } else {
        addBtn.disabled = false;
        buyBtn.disabled = false;
    }

    productModal.show();
}

// --- Cart Logic ---
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id == productId);
    if (!product || product.stock <= 0) return;

    const existingItem = cart.find(item => item.id == productId);

    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            showToast('Error', 'Cannot add more than available stock', 'danger');
            return;
        }
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }

    saveCart();
    updateCartUI();
    showToast('Success', `${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, newQty) {
    const item = cart.find(i => i.id == productId);
    const product = products.find(p => p.id == productId);

    if (!item || !product) return;

    if (newQty < 1) {
        removeFromCart(productId);
        return;
    }

    if (newQty > product.stock) {
        showToast('Info', `Only ${product.stock} items available`, 'info');
        newQty = product.stock;
    }

    item.quantity = newQty;
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('luxecart_data', JSON.stringify(cart));
}

function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;

    // Sync mobile badge
    const mobileBadge = document.getElementById('cartBadgeMobile');
    if (mobileBadge) mobileBadge.textContent = totalItems;

    if (totalItems === 0) {
        cartBadge.classList.add('d-none');
        if (mobileBadge) mobileBadge.classList.add('d-none');
    } else {
        cartBadge.classList.remove('d-none');
        if (mobileBadge) mobileBadge.classList.remove('d-none');
    }

    // Render Cart Items
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.appendChild(emptyCartMessage);
        emptyCartMessage.classList.remove('d-none');
        document.getElementById('checkoutBtn').disabled = true;
        cartTotalText.textContent = '₹0.00';
        return;
    }

    emptyCartMessage.classList.add('d-none');
    document.getElementById('checkoutBtn').disabled = false;

    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItemHTML = `
            <div class="cart-item d-flex gap-3 p-3 position-relative">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="flex-grow-1">
                    <h6 class="mb-1 text-truncate" style="max-width: 200px;">${item.name}</h6>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-primary fw-bold">₹${Number(item.price || 0).toFixed(2)}</span>
                    </div>
                    <div class="input-group input-group-sm quantity-selector rounded-pill bg-light border w-auto d-inline-flex">
                        <button class="btn btn-sm text-dark px-2 border-0" onclick="updateQuantity('${item.id}', ${item.quantity - 1})"><i class="bi bi-dash"></i></button>
                        <input type="number" class="form-control form-control-sm text-center border-0 bg-transparent fw-bold p-0" value="${item.quantity}" readonly style="width: 30px;">
                        <button class="btn btn-sm text-dark px-2 border-0" onclick="updateQuantity('${item.id}', ${item.quantity + 1})"><i class="bi bi-plus"></i></button>
                    </div>
                </div>
                <button class="btn btn-sm text-danger position-absolute top-0 end-0 m-2 border-0 bg-transparent" onclick="removeFromCart('${item.id}')">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
    });

    cartTotalText.textContent = '₹' + total.toFixed(2);
}

// --- Checkout Logic ---
function populateCheckoutSummary() {
    checkoutOrderSummary.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        checkoutOrderSummary.innerHTML += `
            <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                <span class="text-truncate pe-2">${item.quantity}x ${item.name}</span>
                <span class="fw-semibold">₹${(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });

    checkoutGrandTotal.textContent = '₹' + total.toFixed(2);
}

// --- Pincode → Post Office Lookup ---
async function fetchPostOffices() {
    const pincode = document.getElementById('cPincode').value.trim();
    const select = document.getElementById('cPostOffice');
    const spinner = document.getElementById('postOfficeSpinner');
    const errorMsg = document.getElementById('postOfficeError');
    const cityInput = document.getElementById('cCity');
    const stateInput = document.getElementById('cState');

    // Reset
    errorMsg.classList.add('d-none');
    select.innerHTML = '<option value="">-- Enter pincode to load --</option>';
    select.required = false;
    cityInput.value = '';
    stateInput.value = '';

    if (!/^[0-9]{6}$/.test(pincode)) return;

    spinner.classList.remove('d-none');
    select.disabled = true;

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffices = data[0].PostOffice;

            // Auto-fill City and State
            cityInput.value = postOffices[0].District || '';
            stateInput.value = postOffices[0].State || '';

            // Populate post office dropdown
            select.innerHTML = '<option value="">-- Select Post Office --</option>';
            postOffices.forEach(po => {
                const opt = document.createElement('option');
                opt.value = po.Name;
                opt.textContent = `${po.Name} (${po.BranchType})`;
                select.appendChild(opt);
            });
            select.required = true;

        } else {
            errorMsg.classList.remove('d-none');
            select.innerHTML = '<option value="">-- Invalid pincode --</option>';
        }
    } catch (err) {
        console.error('Post office fetch error:', err);
        errorMsg.classList.remove('d-none');
        select.innerHTML = '<option value="">-- Failed to load --</option>';
    } finally {
        spinner.classList.add('d-none');
        select.disabled = false;
    }
}

async function handleCheckout(e) {
    e.preventDefault();

    if (cart.length === 0) return;

    // Change button state
    const originalBtnHtml = placeOrderBtn.innerHTML;
    placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';
    placeOrderBtn.disabled = true;

    const orderData = {
        order_id: 'ORD-' + Date.now(),
        date: new Date().toLocaleString('en-IN'),
        customer_name: document.getElementById('cName').value,
        mobile: document.getElementById('cMobile').value,
        address: document.getElementById('cAddress').value,
        city: document.getElementById('cCity').value,
        state: document.getElementById('cState').value,
        pincode: document.getElementById('cPincode').value,
        post_office: document.getElementById('cPostOffice').value || '',
        payment_method: document.getElementById('cPayment').value,
        items: cart.map(i => `${i.name} x${i.quantity}`).join(' | '),
        total_amount: cart.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0).toFixed(2),
        status: 'Pending'
    };

    try {
        // Submit to SheetDB
        // If URL is the placeholder, we simulate a delay instead of throwing error
        if (ORDERS_API_URL.includes('YOUR_ORDERS_API_ID')) {
            console.log("Mocking API Request with data:", orderData);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network request
        } else {
            const response = await fetch(ORDERS_API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [orderData] })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('SheetDB Error Response:', response.status, errText);
                throw new Error(`SheetDB returned ${response.status}: ${errText}`);
            }

            const result = await response.json();
            console.log('Order saved successfully:', result);
        }

        // Success
        cart = [];
        saveCart();
        updateCartUI();
        checkoutModal.hide();
        cartOffcanvas.hide();
        checkoutForm.reset();
        successModal.show();

    } catch (error) {
        console.error("Checkout Error:", error);
        showToast('Error', 'Failed to place order. Please try again.', 'danger');
    } finally {
        // Reset button state
        placeOrderBtn.innerHTML = originalBtnHtml;
        placeOrderBtn.disabled = false;
    }
}

// --- Utilities ---
function showToast(title, message, type = 'primary') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();

    let icon = 'bi-info-circle-fill';
    if (type === 'success') icon = 'bi-check-circle-fill text-success';
    if (type === 'danger') icon = 'bi-x-circle-fill text-danger';
    if (type === 'warning') icon = 'bi-exclamation-triangle-fill text-warning';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex p-2">
                <div class="toast-body d-flex align-items-center gap-3 w-100">
                    <i class="bi ${icon} fs-4"></i>
                    <div>
                        <strong class="d-block text-dark">${title}</strong>
                        <span class="text-muted small">${message}</span>
                    </div>
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
