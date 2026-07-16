import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const provider = new GoogleAuthProvider();

const BACKEND = 'http://127.0.0.1:8000';

// ── UTILS ── (définis en premier, avant tout appel)

function showError(msg) {
    const el = document.getElementById('error-msg');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
}

function hideError() {
    const el = document.getElementById('error-msg');
    if (el) el.classList.add('hidden');
}

function setGoogleBtnLoading(loading) {
    const btn = document.getElementById('google-btn');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Connexion en cours…' : 'Continuer avec Google';
}

async function sendTokenToBackend(user) {
    const token = await user.getIdToken();
    const res = await fetch(`${BACKEND}/api/auth/firebase/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    if (!res.ok) throw new Error('Erreur serveur');
    return res.json();
}

async function handlePostLogin(user) {
    const data = await sendTokenToBackend(user);
    if (data.role === 'admin') {
        window.location.href = '../admin/dashboard.html';
    } else {
        window.location.href = '../caissier/pos.html';
    }
}

// ── RÉSULTAT REDIRECTION GOOGLE ──
// Appelé au chargement : si l'utilisateur revient après une redirection Google,
// on récupère son compte ici.
getRedirectResult(auth)
    .then(async (result) => {
        if (!result) return; // pas de redirection en cours, rien à faire
        setGoogleBtnLoading(true);
        await handlePostLogin(result.user);
    })
    .catch((err) => {
        setGoogleBtnLoading(false);
        if (err.code !== 'auth/no-current-user') {
            showError('Erreur Google : ' + err.message);
        }
    });

// ── REGISTER ──
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const password = document.getElementById('password').value;
        const confirm  = document.getElementById('confirm-password').value;

        if (password !== confirm) { showError('Les mots de passe ne correspondent pas.'); return; }
        if (password.length < 6)  { showError('Le mot de passe doit contenir au moins 6 caractères.'); return; }

        const email = document.getElementById('email').value;
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await handlePostLogin(cred.user);
        } catch (err) {
            showError(err.code === 'auth/email-already-in-use'
                ? 'Cet email est déjà utilisé.'
                : err.message);
        }
    });
}

// ── LOGIN ──
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const email    = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await handlePostLogin(cred.user);
        } catch {
            showError('Email ou mot de passe incorrect.');
        }
    });
}

// ── GOOGLE ──
// signInWithRedirect() est appelé directement dans le clic (synchrone),
// donc jamais bloqué par le navigateur.
const googleBtn = document.getElementById('google-btn');
if (googleBtn) {
    googleBtn.addEventListener('click', () => {
        setGoogleBtnLoading(true);
        signInWithRedirect(auth, provider);
    });
}
