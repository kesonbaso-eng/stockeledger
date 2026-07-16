import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "REMPLACER_PAR_VARIABLE_ENV",
    authDomain: "stockledger-7b8ec.firebaseapp.com",
    projectId: "stockledger-7b8ec",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API = 'http://127.0.0.1:8000/api';
let token = '';
let products = [];
let cart = [];

// ── UTILS ──

function fmt(n) { return Number(n).toLocaleString('fr-FR') + ' FCFA'; }

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    setTimeout(() => el.className = 'toast', 2500);
}

async function api(path, options = {}) {
    const res = await fetch(API + path, {
        ...options,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ── AUTH ──

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../login.html'; return; }
    token = await user.getIdToken();
    document.getElementById('user-info').textContent = user.email;
    loadProducts();
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => window.location.href = '../login.html'));

// ── CATALOGUE ──

async function loadProducts() {
    try {
        products = await api('/products/');
        renderProducts(products);
        // cache local pour mode hors-ligne
        localStorage.setItem('sl_products', JSON.stringify(products));
    } catch {
        const cached = localStorage.getItem('sl_products');
        if (cached) { products = JSON.parse(cached); renderProducts(products); toast('Mode hors-ligne', 'error'); }
    }
}

function renderProducts(list) {
    const grid = document.getElementById('product-grid');
    if (!list.length) { grid.innerHTML = '<p style="color:var(--muted)">Aucun produit trouvé.</p>'; return; }
    grid.innerHTML = list.map(p => `
        <div class="product-card ${p.stock === 0 ? 'out-of-stock' : ''}" data-id="${p.id}" onclick="addToCart(${p.id})">
            <div class="p-name">${p.name}</div>
            <div class="p-price">${fmt(p.sale_price)}</div>
            <div class="p-stock ${p.stock === 0 ? 'empty' : p.is_low_stock ? 'low' : ''}">
                Stock : ${p.stock === 0 ? 'Rupture' : p.stock}
            </div>
        </div>
    `).join('');
}

// ── RECHERCHE + SCANNER ──

let barcodeBuffer = '';
let barcodeTimer = null;

document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))));
});

document.addEventListener('keydown', (e) => {
    if (document.activeElement.id === 'search') return;
    if (e.key === 'Enter') {
        const p = products.find(p => p.barcode === barcodeBuffer);
        if (p) addToCart(p.id);
        barcodeBuffer = '';
        return;
    }
    if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(barcodeTimer);
        barcodeTimer = setTimeout(() => { barcodeBuffer = ''; }, 100);
    }
});

// ── PANIER ──

window.addToCart = function(id) {
    const p = products.find(p => p.id === id);
    if (!p || p.stock === 0) return;
    const existing = cart.find(i => i.id === id);
    if (existing) {
        if (existing.qty >= p.stock) { toast('Stock insuffisant', 'error'); return; }
        existing.qty++;
    } else {
        cart.push({ id: p.id, name: p.name, price: parseFloat(p.sale_price), qty: 1, stock: p.stock });
    }
    renderCart();
};

window.changeQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    renderCart();
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    renderCart();
};

function renderCart() {
    const container = document.getElementById('cart-items');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    document.getElementById('cart-count').textContent = cart.length ? `(${cart.length})` : '';
    document.getElementById('cart-total').textContent = fmt(total);
    document.getElementById('validate-btn').disabled = cart.length === 0;

    if (!cart.length) {
        container.innerHTML = '<p style="color:var(--muted);font-size:0.88rem;text-align:center;margin-top:2rem">Panier vide</p>';
        return;
    }

    container.innerHTML = cart.map(i => `
        <div class="cart-item">
            <span class="ci-name">${i.name}</span>
            <div class="ci-qty">
                <button onclick="changeQty(${i.id}, -1)">−</button>
                <span>${i.qty}</span>
                <button onclick="changeQty(${i.id}, +1)">+</button>
            </div>
            <span class="ci-price">${fmt(i.price * i.qty)}</span>
            <button class="ci-remove" onclick="removeFromCart(${i.id})">✕</button>
        </div>
    `).join('');
}

// ── VALIDATION ──

document.getElementById('validate-btn').addEventListener('click', () => {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const lines = cart.map(i => `${i.name.padEnd(20)} x${i.qty}  ${fmt(i.price * i.qty)}`).join('\n');
    document.getElementById('receipt-preview').textContent =
        `─────────────────────────────\n${lines}\n─────────────────────────────\nTOTAL : ${fmt(total)}\n─────────────────────────────`;
    document.getElementById('confirm-modal').classList.remove('hidden');
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
});

document.getElementById('confirm-btn').addEventListener('click', async () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    const order = {
        items: cart.map(i => ({ product: i.id, quantity: i.qty, unit_price: i.price })),
        payment_status: 'paid'
    };

    if (!navigator.onLine) {
        const pending = JSON.parse(localStorage.getItem('sl_pending') || '[]');
        pending.push(order);
        localStorage.setItem('sl_pending', JSON.stringify(pending));
        toast('Vente sauvegardée hors-ligne', 'error');
    } else {
        try {
            await api('/orders/', { method: 'POST', body: JSON.stringify(order) });
            toast('Vente validée !');
            cart = [];
            renderCart();
            loadProducts();
            window.print();
        } catch (e) {
            toast('Erreur lors de la vente', 'error');
        }
    }
});

// ── SYNC HORS-LIGNE ──

window.addEventListener('online', async () => {
    const pending = JSON.parse(localStorage.getItem('sl_pending') || '[]');
    if (!pending.length) return;
    for (const order of pending) {
        try { await api('/orders/', { method: 'POST', body: JSON.stringify(order) }); } catch {}
    }
    localStorage.removeItem('sl_pending');
    toast(`${pending.length} vente(s) synchronisée(s)`);
    loadProducts();
});
