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
let allProducts = [];

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
    if (options.method === 'DELETE') return;
    return res.json();
}

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../login.html'; return; }
    token = await user.getIdToken();
    document.getElementById('user-info').textContent = user.email;
    loadProducts();
});

document.getElementById('logout-btn').addEventListener('click', () =>
    signOut(auth).then(() => window.location.href = '../login.html')
);

async function loadProducts() {
    try {
        allProducts = await api('/products/');
        renderProducts(allProducts);
    } catch { toast('Erreur chargement', 'error'); }
}

function renderProducts(list) {
    document.getElementById('product-count').textContent = list.length;
    const tbody = document.getElementById('products-table');
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted)">Aucun produit.</td></tr>';
        return;
    }
    tbody.innerHTML = list.map(p => {
        const margin = p.purchase_price > 0
            ? Math.round((p.sale_price - p.purchase_price) / p.purchase_price * 100)
            : 0;
        return `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td style="color:var(--muted);font-size:0.82rem">${p.barcode || '—'}</td>
            <td>${fmt(p.purchase_price)}</td>
            <td>${fmt(p.sale_price)}</td>
            <td style="color:${margin >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:600">${margin}%</td>
            <td>${p.stock}</td>
            <td>
                ${p.stock === 0
                    ? '<span class="badge red">Rupture</span>'
                    : p.is_low_stock
                        ? '<span class="badge orange">Stock bas</span>'
                        : '<span class="badge green">OK</span>'
                }
            </td>
            <td style="display:flex;gap:0.4rem">
                <button class="btn-add" style="padding:0.3rem 0.7rem;font-size:0.8rem"
                    onclick='openEdit(${JSON.stringify(p).replace(/'/g, "&#39;")})'>✏️</button>
                <button style="padding:0.3rem 0.7rem;font-size:0.8rem;background:var(--red);color:#fff;border:none;border-radius:6px;cursor:pointer"
                    onclick="deleteProduct(${p.id})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderProducts(allProducts.filter(p =>
        p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))
    ));
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
        await api('/products/', { method: 'POST', body: JSON.stringify(body) });
        toast('Produit ajouté !');
        e.target.reset();
        loadProducts();
    } catch { toast('Erreur ajout produit', 'error'); }
});

window.openEdit = function(p) {
    const form = document.getElementById('edit-form');
    form._id = p.id;
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
    const body = {
        name: form.name.value,
        barcode: form.barcode.value || null,
        purchase_price: form.purchase_price.value,
        sale_price: form.sale_price.value,
        stock: form.stock.value,
        low_stock_threshold: form.low_stock_threshold.value,
    };
    try {
        await api(`/products/${form._id}/`, { method: 'PATCH', body: JSON.stringify(body) });
        toast('Produit modifié !');
        document.getElementById('edit-modal').classList.add('hidden');
        loadProducts();
    } catch { toast('Erreur modification', 'error'); }
});

window.deleteProduct = async function(id) {
    if (!confirm('Supprimer ce produit définitivement ?')) return;
    try {
        await api(`/products/${id}/`, { method: 'DELETE' });
        toast('Produit supprimé');
        loadProducts();
    } catch { toast('Erreur suppression', 'error'); }
};
