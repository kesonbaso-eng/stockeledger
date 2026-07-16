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
        const tbody = document.getElementById('orders-table');
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted)">Aucune vente enregistrée.</td></tr>';
            return;
        }
        tbody.innerHTML = orders.slice().reverse().map(o => `
            <tr style="cursor:pointer" onclick="showDetail(${o.id})">
                <td>#${o.id}</td>
                <td>${new Date(o.created_at).toLocaleString('fr-FR')}</td>
                <td>${o.items.length} article(s)</td>
                <td><strong>${fmt(o.total)}</strong></td>
                <td>
                    ${o.payment_status === 'paid'
                        ? '<span class="badge green">Payé</span>'
                        : o.payment_status === 'partial'
                            ? '<span class="badge orange">Partiel</span>'
                            : '<span class="badge red">En attente</span>'
                    }
                </td>
            </tr>
        `).join('');
        window._orders = orders;
    } catch { toast('Erreur chargement', 'error'); }
}

window.showDetail = function(id) {
    const o = window._orders.find(x => x.id === id);
    if (!o) return;
    const lines = o.items.map(i =>
        `<tr><td>${i.product}</td><td>${i.quantity}</td><td>${fmt(i.unit_price)}</td><td>${fmt(i.subtotal)}</td></tr>`
    ).join('');
    document.getElementById('detail-content').innerHTML = `
        <p style="margin-bottom:0.8rem;color:var(--muted);font-size:0.85rem">
            ${new Date(o.created_at).toLocaleString('fr-FR')} — 
            <span class="badge ${o.payment_status === 'paid' ? 'green' : 'orange'}">${o.payment_status}</span>
        </p>
        <table>
            <thead><tr><th>Produit</th><th>Qté</th><th>Prix unit.</th><th>Sous-total</th></tr></thead>
            <tbody>${lines}</tbody>
        </table>
        <div style="text-align:right;margin-top:1rem;font-size:1.1rem;font-weight:700">
            Total : ${fmt(o.total)}
        </div>
    `;
    document.getElementById('detail-modal').classList.remove('hidden');
};

document.getElementById('close-detail').addEventListener('click', () =>
    document.getElementById('detail-modal').classList.add('hidden')
);
