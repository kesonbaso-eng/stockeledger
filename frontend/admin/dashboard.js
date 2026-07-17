import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCV2UxUHcimdStfui6aRxSOInJJhLBYgK4",
    authDomain: "stockledger-7b8ec.firebaseapp.com",
    projectId: "stockledger-7b8ec",
    storageBucket: "stockledger-7b8ec.firebasestorage.app",
    messagingSenderId: "574456739117",
    appId: "1:574456739117:web:8180ed355451d9a9534fa4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API = 'http://127.0.0.1:8000/api';
let token = '';

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
    return options.raw ? res : res.json();
}

// ── AUTH ──

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../login.html'; return; }
    token = await user.getIdToken();
    document.getElementById('user-info').textContent = user.email;
    loadAll();
});

document.getElementById('logout-btn').addEventListener('click', () =>
    signOut(auth).then(() => window.location.href = '../login.html')
);

// ── CHARGEMENT GLOBAL ──

async function loadAll() {
    await Promise.all([loadDashboard(), loadProducts(), loadExpenses()]);
}

// ── DASHBOARD P&L ──

async function loadDashboard() {
    try {
        const data = await api('/dashboard/');
        document.getElementById('month-title').textContent = `Dashboard — ${data.month || 'ce mois'}`;
        document.getElementById('stat-revenue').textContent = fmt(data.revenue);
        document.getElementById('stat-expenses').textContent = fmt(data.expenses);
        const profitEl = document.getElementById('stat-profit');
        profitEl.textContent = fmt(data.profit);
        profitEl.className = `value ${data.profit >= 0 ? 'green' : 'red'}`;

        const lowList = document.getElementById('low-stock-list');
        if (!data.low_stock_products.length) {
            lowList.innerHTML = '<p class="empty-state">Aucune rupture de stock.</p>';
        } else {
            lowList.innerHTML = data.low_stock_products.map(p => `
                <span class="badge orange stock-badge">${p.name} (${p.stock} restants)</span>
            `).join('');
        }
    } catch { toast('Erreur chargement dashboard', 'error'); }
}

// ── PRODUITS ──

async function loadProducts() {
    try {
        const products = await api('/products/');
        const tbody = document.getElementById('products-table');
        tbody.innerHTML = products.map(p => `
            <tr>
                <td><strong>${p.name}</strong>${p.barcode ? `<br><small class="muted-text">${p.barcode}</small>` : ''}</td>
                <td>${fmt(p.purchase_price)}</td>
                <td>${fmt(p.sale_price)}</td>
                <td>${p.stock}</td>
                <td>
                    ${p.stock === 0
                        ? '<span class="badge red">Rupture</span>'
                        : p.is_low_stock
                            ? '<span class="badge orange">Stock bas</span>'
                            : '<span class="badge green">OK</span>'
                    }
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="openEdit(${JSON.stringify(p).replace(/"/g, '&quot;')})">Editer</button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct(${p.id})">Supprimer</button>
                </td>
            </tr>
        `).join('');
    } catch { toast('Erreur chargement produits', 'error'); }
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    try {
        await api('/products/', { method: 'POST', body: JSON.stringify(body) });
        toast('Produit ajouté !');
        e.target.reset();
        loadProducts();
        loadDashboard();
    } catch { toast('Erreur ajout produit', 'error'); }
});

window.openEdit = function(p) {
    const form = document.getElementById('edit-form');
    form.id_field = p.id;
    form.name.value = p.name;
    form.barcode.value = p.barcode || '';
    form.purchase_price.value = p.purchase_price;
    form.sale_price.value = p.sale_price;
    form.stock.value = p.stock;
    form.low_stock_threshold.value = p.low_stock_threshold;
    document.getElementById('edit-modal').classList.remove('hidden');
};

document.getElementById('edit-cancel').addEventListener('click', () =>
    document.getElementById('edit-modal').classList.add('hidden')
);

document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id_field;
    const body = {
        name: form.name.value,
        barcode: form.barcode.value || null,
        purchase_price: form.purchase_price.value,
        sale_price: form.sale_price.value,
        stock: form.stock.value,
        low_stock_threshold: form.low_stock_threshold.value,
    };
    try {
        await api(`/products/${id}/`, { method: 'PATCH', body: JSON.stringify(body) });
        toast('Produit modifié !');
        document.getElementById('edit-modal').classList.add('hidden');
        loadProducts();
        loadDashboard();
    } catch { toast('Erreur modification', 'error'); }
});

window.deleteProduct = async function(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        await api(`/products/${id}/`, { method: 'DELETE', raw: true });
        toast('Produit supprimé');
        loadProducts();
    } catch { toast('Erreur suppression', 'error'); }
};

// ── DÉPENSES ──

async function loadExpenses() {
    try {
        const expenses = await api('/expenses/');
        const tbody = document.getElementById('expenses-table');
        tbody.innerHTML = expenses.map(ex => `
            <tr>
                <td>${ex.label}</td>
                <td><strong>${fmt(ex.amount)}</strong></td>
                <td class="muted-text">${new Date(ex.created_at).toLocaleDateString('fr-FR')}</td>
            </tr>
        `).join('') || '<tr><td colspan="3" class="empty-state">Aucune dépense ce mois.</td></tr>';
    } catch { toast('Erreur chargement dépenses', 'error'); }
}

document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    try {
        await api('/expenses/', { method: 'POST', body: JSON.stringify(body) });
        toast('Dépense enregistrée !');
        e.target.reset();
        loadExpenses();
        loadDashboard();
    } catch { toast('Erreur ajout dépense', 'error'); }
});

// ── EXPORT CSV ──

window.exportCSV = async function() {
    const res = await fetch(`${API}/export/sales/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ventes.csv'; a.click();
    URL.revokeObjectURL(url);
};
