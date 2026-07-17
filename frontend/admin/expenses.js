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

async function api(path, options = {}) {
    const res = await fetch(API + path, {
        ...options,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) throw new Error();
    return res.json();
}

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../login.html'; return; }
    token = await user.getIdToken();
    document.getElementById('user-info').textContent = user.email;
    loadExpenses();
});

document.getElementById('logout-btn').addEventListener('click', () =>
    signOut(auth).then(() => window.location.href = '../login.html')
);

async function loadExpenses() {
    try {
        const expenses = await api('/expenses/');
        const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
        document.getElementById('total-expenses').textContent = fmt(total);
        document.getElementById('count-expenses').textContent = expenses.length;

        const tbody = document.getElementById('expenses-table');
        if (!expenses.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Aucune dépense enregistrée.</td></tr>';
            return;
        }
        tbody.innerHTML = expenses.slice().reverse().map(ex => `
            <tr>
                <td>${ex.label}</td>
                <td><strong class="amount-negative">${fmt(ex.amount)}</strong></td>
                <td class="muted-text">${new Date(ex.created_at).toLocaleString('fr-FR')}</td>
            </tr>
        `).join('');
    } catch { toast('Erreur chargement', 'error'); }
}

document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
        await api('/expenses/', { method: 'POST', body: JSON.stringify(body) });
        toast('Dépense enregistrée !');
        e.target.reset();
        loadExpenses();
    } catch { toast('Erreur enregistrement', 'error'); }
});
