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

function fmt(n) { return Number(n).toLocaleString('fr-FR') + ' FCFA'; }

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    setTimeout(() => el.className = 'toast', 2500);
}

async function api(path) {
    const res = await fetch(API + path, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    return res.json();
}

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../login.html'; return; }
    token = await user.getIdToken();
    document.getElementById('user-info').textContent = user.email;
    loadOrders();
});

document.getElementById('logout-btn').addEventListener('click', () =>
    signOut(auth).then(() => window.location.href = '../login.html')
);

async function loadOrders() {
    try {
        const orders = await api('/orders/');
        const revenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total), 0);
        const pending = orders.filter(o => o.payment_status !== 'paid').length;

        document.getElementById('stat-count').textContent = orders.length;
        document.getElementById('stat-revenue').textContent = fmt(revenue);
        document.getElementById('stat-pending').textContent = pending;

        const tbody = document.getElementById('orders-table');
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucune commande.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.slice().reverse().map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${new Date(o.created_at).toLocaleString('fr-FR')}</td>
                <td class="muted-text small-text">${o.cashier ?? '—'}</td>
                <td>${o.items.length}</td>
                <td><strong>${fmt(o.total)}</strong></td>
                <td>
                    ${o.payment_status === 'paid'
                        ? '<span class="badge green">Payé</span>'
                        : o.payment_status === 'partial'
                            ? '<span class="badge orange">Partiel</span>'
                            : '<span class="badge red">En attente</span>'
                    }
                </td>
                <td>
                    <button class="btn-icon btn-edit"
                        onclick='showDetail(${JSON.stringify(o).replace(/'/g, "&#39;")})'>Voir</button>
                </td>
            </tr>
        `).join('');

        window._orders = orders;
    } catch { toast('Erreur chargement', 'error'); }
}

window.showDetail = function(o) {
    document.getElementById('detail-id').textContent = `#${o.id}`;
    const lines = o.items.map(i =>
        `<tr><td>${i.product}</td><td>${i.quantity}</td><td>${fmt(i.unit_price)}</td><td>${fmt(i.subtotal)}</td></tr>`
    ).join('');
    document.getElementById('detail-content').innerHTML = `
        <p class="detail-meta">
            ${new Date(o.created_at).toLocaleString('fr-FR')}
        </p>
        <table>
            <thead><tr><th>Produit</th><th>Qté</th><th>Prix unit.</th><th>Sous-total</th></tr></thead>
            <tbody>${lines}</tbody>
        </table>
        <div class="detail-total">
            Total : ${fmt(o.total)}
        </div>
    `;
    document.getElementById('detail-modal').classList.remove('hidden');
};

document.getElementById('close-detail').addEventListener('click', () =>
    document.getElementById('detail-modal').classList.add('hidden')
);

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
