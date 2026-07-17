import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCV2UxUHcimdStfui6aRxSOInJJhLBYgK4",
    authDomain: "stockledger-7b8ec.firebaseapp.com",
    projectId: "stockledger-7b8ec",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const BACKEND = 'http://127.0.0.1:8000';
let destination = '';
let authResolved = false;
let loginRedirectTimer = null;
const shouldWaitForAuth = sessionStorage.getItem('stockledger:auth-redirect') === '1' || localStorage.getItem('stockledger:auth-redirect') === '1';

function redirectToLogin() {
    sessionStorage.removeItem('stockledger:auth-redirect');
    localStorage.removeItem('stockledger:auth-redirect');
    window.location.replace(new URL('./login.html', window.location.href).toString());
}

function clearLoginRedirectTimer() {
    if (loginRedirectTimer) {
        clearTimeout(loginRedirectTimer);
        loginRedirectTimer = null;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (!authResolved) {
            clearLoginRedirectTimer();
            if (shouldWaitForAuth) {
                loginRedirectTimer = setTimeout(() => {
                    if (!auth.currentUser) {
                        document.getElementById('welcome-msg').textContent = 'Connexion en cours… Si cette page ne se met pas à jour, veuillez revenir à la connexion.';
                        document.getElementById('redirect-msg').textContent = 'Patientez quelques secondes.';
                    }
                }, 4000);
                return;
            }
            loginRedirectTimer = setTimeout(() => {
                if (!auth.currentUser) redirectToLogin();
            }, 2500);
            return;
        }
        redirectToLogin();
        return;
    }

    authResolved = true;
    clearLoginRedirectTimer();
    sessionStorage.removeItem('stockledger:auth-redirect');
    localStorage.removeItem('stockledger:auth-redirect');

    const name = user.displayName || user.email.split('@')[0];
    document.getElementById('welcome-name').textContent = name;

    try {
        const token = await user.getIdToken();
        const res   = await fetch(`${BACKEND}/api/auth/me/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('auth failed');
        const data = await res.json();
        const role = data.role;

        const badge = document.getElementById('role-badge');
        badge.innerHTML = role === 'admin'
            ? '<i class="fa-solid fa-crown"></i> Administrateur'
            : '<i class="fa-solid fa-receipt"></i> Caissier';
        badge.className = `role-badge ${role}`;
        badge.classList.remove('hidden');

        if (role === 'admin') {
            destination = 'admin/dashboard.html';
            document.getElementById('welcome-msg').textContent =
                'Votre espace administrateur est prêt. Gérez vos produits, ventes et finances.';
        } else {
            destination = 'caissier/pos.html';
            document.getElementById('welcome-msg').textContent =
                'Votre interface de caisse est prête. Bonne journée de vente !';
        }
    } catch {
        destination = 'caissier/pos.html';
        document.getElementById('welcome-msg').textContent =
            'Votre connexion est réussie. Vous allez être redirigé vers la caisse.';
    }

    let seconds = 3;
    document.getElementById('progress').style.width = '100%';

    const interval = setInterval(() => {
        seconds--;
        document.getElementById('redirect-msg').textContent =
            `Redirection dans ${seconds} seconde${seconds > 1 ? 's' : ''}…`;
        if (seconds <= 0) { clearInterval(interval); window.location.href = destination; }
    }, 1000);

    document.getElementById('btn-now').addEventListener('click', () => {
        clearInterval(interval);
        window.location.href = destination;
    });
});
