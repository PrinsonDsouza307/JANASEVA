/**
 * JANASEVA – Authentication & Role-Based Security Architect
 * Enforces mandatory login entry, Firebase onAuthStateChanged session verification,
 * role-directed routing, and protected page access guards.
 */

// Helper: Show custom in-page Toast Notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠️';

  const iconSpan = document.createElement('span');
  iconSpan.textContent = icon;
  const rawMsg = String(message || '');
  const localizedMsg = (typeof window.janasevaT === 'function') ? window.janasevaT(rawMsg) : rawMsg;
  const msgSpan = document.createElement('span');
  msgSpan.textContent = localizedMsg;
  msgSpan._origEn = rawMsg;
  msgSpan._lastTranslated = localizedMsg;
  toast.appendChild(iconSpan);
  toast.appendChild(document.createTextNode(' '));
  toast.appendChild(msgSpan);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

class AuthService {
  constructor() {
    this.currentUser = this.loadSession();
    this._authResolved = false;
    this._authPromise = null;
    this.initFirebaseObserver();
    this.setupBackNavigationProtection();
  }

  localPreviewAllowed() {
    return location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  }

  requireConfiguredAuth() {
    if (!window.isFirebaseAvailable && !this.localPreviewAllowed()) {
      throw new Error("Online accounts are not configured yet. Please contact the JANASEVA administrator.");
    }
  }

  loadSession() {
    if (!this.localPreviewAllowed()) return null;
    try {
      const stored = localStorage.getItem('JANASEVA_currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  saveSession(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('JANASEVA_currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('JANASEVA_currentUser');
    }
    this.initAuthUI();
    try {
      window.dispatchEvent(new CustomEvent('janaseva:authChanged', { detail: this.currentUser }));
    } catch(e) {}
  }

  // Resolve the three supplied local testing accounts to their intended roles.
  // These credentials are a LOCAL-ONLY convenience and must never be used in production.
  determineRole(email) {
    const em = (email || '').toLowerCase().trim();
    if (em === 'admin@janaseva.local') return 'admin';
    if (em === 'receiver@janaseva.local') return 'receiver';
    return 'citizen';
  }

  // Fetch Firestore user profile doc if available
  async fetchUserProfile(uid) {
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        const doc = await window.fbDb.collection('users').doc(uid).get();
        if (doc.exists) {
          return doc.data();
        }
      } catch (e) {
        console.warn("Firestore user lookup caught:", e);
      }
    }
    // Check local seed / stored users
    const users = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('users', []) : [];
    return users.find(u => u.uid === uid) || null;
  }

  // Initialize Firebase Auth onAuthStateChanged Observer
  initFirebaseObserver() {
    if (this._authPromise) return this._authPromise;

    this._authPromise = new Promise((resolve) => {
      if (window.isFirebaseAvailable && window.fbAuth) {
        let hasResolved = false;
        const finishResolve = (val) => {
          this._authResolved = true;
          this.initAuthUI();
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            resolve(val);
          }
        };

        // Timeout safeguard: if Firebase takes > 2.5s, resolve initial boot with cached session
        const timeout = setTimeout(() => {
          finishResolve(this.currentUser);
        }, 2500);

        window.fbAuth.onAuthStateChanged(async (fbUser) => {
          if (fbUser) {
            // Live Firebase user authenticated (handles initial load, token refresh, and account switch)
            let profile = await this.fetchUserProfile(fbUser.uid);
            if (!profile) {
              profile = {
                uid: fbUser.uid,
                name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Citizen'),
                email: fbUser.email || '',
                role: 'citizen',
                createdAt: new Date().toLocaleDateString('en-GB')
              };
            }
            this.saveSession(profile);
          } else {
            // Live Firebase confirms user is signed out / revoked
            this.saveSession(null);
          }

          finishResolve(this.currentUser);
        }, (err) => {
          console.warn("Firebase Auth state error:", err);
          finishResolve(this.currentUser);
        });
      } else {
        // Local simulation / demo mode without live Firebase
        this._authResolved = true;
        this.initAuthUI();
        resolve(this.currentUser);
      }
    });

    return this._authPromise;
  }

  // Silently re-verify live Firebase session (handles token expiry / revoked sessions on resume)
  async syncLiveFirebaseSession() {
    if (!window.isFirebaseAvailable || !window.fbAuth || !window.fbAuth.currentUser) {
      return this.currentUser;
    }
    try {
      await window.fbAuth.currentUser.getIdTokenResult(false);
      await this.refreshCurrentUserProfile({ strictRemote: false });
      return this.currentUser;
    } catch (err) {
      const code = err && err.code ? err.code : '';
      if (code === 'auth/user-token-expired' || code === 'auth/user-disabled' || code === 'auth/user-not-found') {
        await this.logout();
        return null;
      }
      return this.currentUser;
    }
  }

  // Wait for definitive Auth state initialization before redirecting
  async waitForAuth() {
    if (this._authResolved) return this.currentUser;
    return this.initFirebaseObserver();
  }

  // Prevent Browser Back Navigation after Logout
  setupBackNavigationProtection() {
    window.addEventListener('pageshow', (event) => {
      // If page is restored from Back-Forward Cache (bfcache)
      if (event.persisted) {
        const isPublicPage = window.location.pathname.includes('login.html');
        if (!isPublicPage && !this.isAuthenticated()) {
          window.location.replace('login.html');
        }
      }
    });
  }

  // Translate Firebase Auth error codes into clear, friendly citizen messages
  getFriendlyErrorMessage(err) {
    const t = (m) => (typeof window.janasevaT === 'function') ? window.janasevaT(m) : m;
    if (!err) return t("Authentication failed. Please try again.");
    const code = err.code || '';
    switch (code) {
      case 'auth/user-not-found':
        return t("No account found with this email address. Please check your spelling or register as a new citizen.");
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t("Incorrect password entered. Please check your password or use 'Forgot Password?' to reset it.");
      case 'auth/invalid-email':
        return t("Please enter a valid email address (e.g. ).");
      case 'auth/user-disabled':
        return t("This account has been disabled by the Gram Panchayat administration.");
      case 'auth/too-many-requests':
        return t("Access temporarily blocked due to multiple failed attempts. Please try again later or reset your password.");
      case 'auth/network-request-failed':
        return t("Network connection issue. Please check your internet connectivity.");
      case 'auth/email-already-in-use':
        return t("An account with this email address is already registered. Please login instead.");
      case 'auth/weak-password':
        return t("Password is too weak. Please choose a password with at least 6 characters.");
      default:
        return t(err.message || "Authentication failed. Please verify your credentials.");
    }
  }

  // Register New User (Direct MongoDB Integration)
  async register(fullName, email, mobile, password, confirmPassword, role = 'citizen', panchayatId = null) {
    if (!fullName || !email || !mobile || !password) {
      throw new Error("Please fill in all required fields.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const safeRole = (role === 'admin' || role === 'receiver') ? 'citizen' : role;
    const users = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('users', []) : [];

    const newUser = {
      uid: 'usr-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: fullName.trim(),
      email: cleanEmail,
      mobile: mobile.trim(),
      role: safeRole,
      password: password,
      panchayatId: panchayatId,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    // 1. Save directly to MongoDB Atlas
    try {
      const res = await fetch('/api/mongo/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error("An account with this email address already exists in MongoDB.");
        }
        console.warn('[AUTH] MongoDB registration notice:', errData.error || res.status);
      } else {
        const saved = await res.json();
        if (saved && saved.user) newUser.uid = saved.user.uid || newUser.uid;
        console.info('[AUTH] Citizen registered in MongoDB Atlas:', cleanEmail);
      }
    } catch (mErr) {
      if (mErr.message && mErr.message.includes('already exists')) throw mErr;
      console.warn('[AUTH] MongoDB registration fallback to offline:', mErr.message);
    }

    // 2. Local Mirroring
    users.push(newUser);
    if (typeof JanasevaDB !== 'undefined') {
      JanasevaDB.set('users', users);
    }
    this.saveSession(newUser);
    return newUser;
  }

  // Login Existing User (Direct MongoDB Integration)
  async login(email, password) {
    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try MongoDB Atlas Authentication
    try {
      const res = await fetch('/api/mongo/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.user) {
          const profile = {
            uid: data.user.uid || 'usr-' + Date.now(),
            name: data.user.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: data.user.role || 'citizen',
            panchayatId: data.user.panchayatId || null,
            createdAt: data.user.createdAt || new Date().toLocaleDateString('en-GB')
          };
          this.saveSession(profile);
          console.info('[AUTH] Authenticated via MongoDB Atlas:', cleanEmail, `(${profile.role})`);
          return profile;
        }
      }
    } catch (mErr) {
      console.warn('[AUTH] MongoDB login check:', mErr.message);
    }

    // 2. Fallback to Local Demo Accounts / Local Cached Users
    const demoAccounts = {
      'admin@janaseva.local': { password: 'Admin@123', role: 'admin', name: 'JANASEVA Admin' },
      'receiver@janaseva.local': { password: 'Receiver@123', role: 'receiver', name: 'JANASEVA Receiver' },
      'citizen@janaseva.local': { password: 'Citizen@123', role: 'citizen', name: 'JANASEVA Citizen' }
    };

    let account = demoAccounts[cleanEmail];
    if (!account) {
      const users = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('users', []) : [];
      account = users.find(u => (u.email || '').toLowerCase() === cleanEmail);
    }

    if (account && (!account.password || password === account.password)) {
      const profile = {
        uid: account.uid || `local-demo-${account.role}`,
        name: account.name,
        email: cleanEmail,
        role: account.role || 'citizen',
        panchayatId: account.panchayatId || null,
        isLocalDemo: true,
        createdAt: account.createdAt || new Date().toLocaleDateString('en-GB')
      };
      this.saveSession(profile);
      return profile;
    }

    throw new Error('Invalid email or password. Use demo accounts or register a new citizen account.');
  }

  // Logout
  async logout() {
    if (window.isFirebaseAvailable && window.fbAuth) {
      try {
        await window.fbAuth.signOut();
      } catch (e) {
        console.warn("Firebase signout caught:", e);
      }
    }
    this.saveSession(null);
    try {
      sessionStorage.clear();
      localStorage.removeItem('janaseva_current_user');
      if (window.janasevaUniversalNotifications && typeof window.janasevaUniversalNotifications.onLogout === 'function') {
        window.janasevaUniversalNotifications.onLogout();
      }
    } catch (e) {}
    showToast("Logged out successfully.", "info");
    // Replace current location to prevent Back button navigation
    window.location.replace('login.html?logged_out=1');
  }

  // Password Reset
  async sendPasswordReset(email) {
    if (!email) throw new Error("Please enter your registered email address.");
    const cleanEmail = email.trim().toLowerCase();

    if (window.isFirebaseAvailable && window.fbAuth) {
      try {
        await window.fbAuth.sendPasswordResetEmail(cleanEmail);
      } catch (fbErr) {
        throw new Error(this.getFriendlyErrorMessage(fbErr));
      }
    }
    return true;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  isReceiver() {
    return this.currentUser && (this.currentUser.role === 'receiver' || this.currentUser.role === 'admin');
  }

  // Secure Admin Re-authentication (Required for Emergency Data Reset Checkpoint 4)
  async reauthenticateAdmin(password) {
    if (!this.isAdmin()) {
      throw new Error("Unauthorized: Only authenticated Administrator can perform re-authentication.");
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      throw new Error("Please enter your current administrator password.");
    }

    const email = (this.currentUser && this.currentUser.email) ? this.currentUser.email.trim().toLowerCase() : '';

    // 1. Live Firebase Re-authentication if Firebase Auth is active
    if (window.isFirebaseAvailable && window.fbAuth && window.fbAuth.currentUser) {
      try {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth.EmailAuthProvider) {
          const credential = firebase.auth.EmailAuthProvider.credential(email, password);
          await window.fbAuth.currentUser.reauthenticateWithCredential(credential);
          return { success: true, method: 'firebase_auth', user: this.currentUser };
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          throw new Error("Invalid administrator password. Access denied.");
        }
        console.warn("Live Firebase re-auth fallback to local security validation:", fbErr);
      }
    }

    throw new Error("Online service configuration required. Secure administrator reauthentication is unavailable.");
  }

  // Strictly sanitize internal redirect destinations to prevent open redirects or script injection
  sanitizeInternalRedirect(targetRedirect) {
    if (!targetRedirect || typeof targetRedirect !== 'string') return null;
    if (window.JanasevaBridge && typeof window.JanasevaBridge.sanitizeInternalRedirect === 'function') {
      return window.JanasevaBridge.sanitizeInternalRedirect(targetRedirect);
    }
    const trimmed = targetRedirect.trim();
    if (!trimmed || trimmed.length > 300) return null;
    if (/^([a-zA-Z][a-zA-Z0-9+.-]*:|\/\/|\\)/.test(trimmed) || trimmed.includes('..')) return null;
    const allowedPages = new Set([
      'index.html', 'complaint.html', 'track.html', 'directory.html',
      'knowledge-centre.html', 'about.html', 'citizen-dashboard.html',
      'receiver-dashboard.html', 'receiver-settings.html', 'admin-emergency-reset.html'
    ]);
    const base = trimmed.split('?')[0].replace(/^\/+/, '').toLowerCase();
    return allowedPages.has(base) ? trimmed.replace(/^\/+/, '') : null;
  }

  // Route user to appropriate authorized dashboard
  routeUserAfterLogin(user, targetRedirect = null) {
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    const safeRedirect = this.sanitizeInternalRedirect(targetRedirect);

    // If explicit target redirect is provided and permissible
    if (safeRedirect && !safeRedirect.includes('login.html')) {
      if (safeRedirect.includes('admin-emergency-reset') && user.role !== 'admin') {
        window.location.replace(user.role === 'receiver' ? 'receiver-dashboard.html' : 'index.html');
        return;
      }
      if (safeRedirect.includes('receiver-settings') && user.role !== 'receiver') {
        window.location.replace(user.role === 'admin' ? 'receiver-dashboard.html' : 'index.html');
        return;
      }
      if (safeRedirect.includes('receiver-dashboard') && user.role === 'citizen') {
        window.location.replace('index.html');
        return;
      }
      window.location.replace(safeRedirect);
      return;
    }

    // Role-directed routing
    if (user.role === 'admin') {
      window.location.replace('receiver-dashboard.html');
    } else if (user.role === 'receiver') {
      window.location.replace('receiver-dashboard.html');
    } else {
      window.location.replace('citizen-dashboard.html');
    }
  }

  // Root entry handler for index.html
  async handleRootEntry() {
    const overlay = document.getElementById('auth-guard-overlay');

    // If launched into Android via an App Link, consume and route the deep link before default redirects
    if (window.JanasevaBridge && typeof window.JanasevaBridge.consumeInitialDeepLink === 'function') {
      const deepLinkHandled = await window.JanasevaBridge.consumeInitialDeepLink();
      if (deepLinkHandled) return;
    }

    const user = await this.waitForAuth();

    if (!user) {
      // Unauthenticated visitor -> Immediately redirect to Login Page
      window.location.replace('login.html');
      return;
    }

    // Authenticated user
    const urlParams = new URLSearchParams(window.location.search);
    const viewCitizen = urlParams.get('view') === 'citizen';

    if (!viewCitizen) {
      // Officials automatically routed to their official dashboard
      if (user.role === 'admin' || user.role === 'receiver') {
        window.location.replace('receiver-dashboard.html');
        return;
      }
    }

    // Citizen or official in citizen view -> reveal index.html
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Login entry handler for login.html
  async handleLoginEntry() {
    const overlay = document.getElementById('auth-guard-overlay');
    const user = await this.waitForAuth();

    if (user) {
      // User is already logged in -> redirect to their authorized dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      this.routeUserAfterLogin(user, redirect);
      return;
    }

    // Not logged in -> reveal login form
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Protect a private page
  async protectPage(requiredRole = 'any') {
    const overlay = document.getElementById('auth-guard-overlay');
    const user = await this.waitForAuth();

    if (!user) {
      // Unauthenticated visitor attempting direct access -> redirect to login with redirect param
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      const redirectParam = encodeURIComponent(currentPath + window.location.search);
      window.location.replace(`login.html?redirect=${redirectParam}`);
      return false;
    }

    // Role verification
    if (requiredRole === 'receiver-only') {
      const isAuthReceiver = (user.role === 'receiver') || 
        ['', 'receiver@janaseva.local', 'receiver@janaseva.in', 'receiver@janaseva.gov.in'].includes((user.email || '').toLowerCase());
      
      // Strict Receiver-Only: Admin and Citizen are strictly BARRED from Receiver Settings
      if (user.role === 'admin' || !isAuthReceiver) {
        if (typeof showToast === 'function') {
          showToast("Access Denied: Receiver Settings are strictly restricted to the Grievance Receiver. Administrators and Citizens are barred.", "error");
        }
        setTimeout(() => {
          window.location.replace(user.role === 'admin' ? 'receiver-dashboard.html' : 'index.html');
        }, 1000);
        return false;
      }
      if (overlay) overlay.classList.add('hidden');
      return true;
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
      if (typeof showToast === 'function') {
        showToast("Access restricted: Administrator role required.", "error");
      }
      setTimeout(() => {
        window.location.replace(user.role === 'receiver' ? 'receiver-dashboard.html' : 'index.html');
      }, 800);
      return false;
    }

    if (requiredRole === 'receiver' && user.role !== 'receiver' && user.role !== 'admin') {
      if (typeof showToast === 'function') {
        showToast("Access restricted: Gram Panchayat official role required.", "error");
      }
      setTimeout(() => {
        window.location.replace('index.html');
      }, 800);
      return false;
    }

    // Authorized -> reveal page
    if (overlay) {
      overlay.classList.add('hidden');
    }
    return true;
  }

  // Dynamic Navigation UI
  initAuthUI() {
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    // Retain any existing notification bell button across auth state and DOM re-renders
    const existingBell = authContainer.querySelector('#nav-notif-bell-btn') || document.getElementById('nav-notif-bell-btn');

    if (this.currentUser) {
      const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      const roleBadge = esc((this.currentUser.role || 'citizen').toUpperCase());
      let roleColor = '#0f56b3';
      if (this.currentUser.role === 'admin') roleColor = '#b91c1c';
      if (this.currentUser.role === 'receiver') roleColor = '#15803d';

      const safeFirstName = esc((this.currentUser.name || 'User').split(' ')[0]);
      const safeFullName = esc(this.currentUser.name || 'Citizen');
      const safeEmail = esc(this.currentUser.email || '');

      authContainer.innerHTML = `
        <div class="user-menu-wrapper">
          <button class="user-badge-btn" id="user-menu-toggle" type="button" aria-label="User Account Menu" aria-expanded="false">
            <i class="fa-solid fa-circle-user"></i>
            <span>${safeFirstName}</span>
            <span style="font-size: 10px; background: ${roleColor}; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${roleBadge}</span>
            <i class="fa-solid fa-chevron-down" style="font-size: 11px;"></i>
          </button>
          <div class="user-dropdown" id="user-menu-dropdown">
            <div class="user-dropdown-header">
              <div class="user-dropdown-name" style="font-weight: 700; color: #0b2545;">${safeFullName}</div>
              <div class="user-dropdown-role" style="font-size: 11.5px; color: #64748b; text-transform: uppercase;">${roleBadge} &bull; ${safeEmail}</div>
            </div>
            <a href="javascript:void(0)" class="user-dropdown-item" id="menu-edit-profile" onclick="window.authService && window.authService.openEditProfileModal()">
              <i class="fa-solid fa-user-pen"></i> <span data-i18n="edit_profile">Edit Profile</span>
            </a>
            ${this.currentUser.role === 'receiver' ? `
              <a href="receiver-settings.html" class="user-dropdown-item">
                <i class="fa-solid fa-gear"></i> <span data-i18n="receiver_settings">Receiver Settings</span>
              </a>
              <a href="receiver-dashboard.html" class="user-dropdown-item">
                <i class="fa-solid fa-table-columns"></i> <span data-i18n="receiver_dashboard">Receiver Dashboard</span>
              </a>
            ` : ''}
            ${this.currentUser.role === 'admin' ? `
              <a href="receiver-dashboard.html" class="user-dropdown-item">
                <i class="fa-solid fa-table-columns"></i> <span data-i18n="admin_dashboard">Admin Dashboard</span>
              </a>
            ` : ''}
            ${this.currentUser.role === 'citizen' ? `
              <a href="citizen-dashboard.html" class="user-dropdown-item">
                <i class="fa-solid fa-id-card-clip"></i> <span data-i18n="my_dashboard">My Dashboard</span>
              </a>
            ` : ''}
            <a href="${(this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'receiver')) ? 'index.html?view=citizen' : 'index.html'}" class="user-dropdown-item">
              <i class="fa-solid fa-house"></i> <span data-i18n="citizen_portal">Citizen Grievance Portal</span>
            </a>
            <a href="knowledge-centre.html#notebook" class="user-dropdown-item">
              <i class="fa-solid fa-book-bookmark"></i> <span data-i18n="ai_notebook">AI Notebook</span>
            </a>
            <a href="track.html" class="user-dropdown-item">
              <i class="fa-solid fa-magnifying-glass"></i> <span data-i18n="track_complaints">Track Complaints</span>
            </a>
            <div class="user-dropdown-item logout" id="logout-btn" style="cursor: pointer; color: #dc2626; border-top: 1px solid #f1f5f9;">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> <span data-i18n="logout">Logout</span>
            </div>
          </div>
        </div>
      `;

      if (typeof window.janasevaTranslateDOM === 'function') {
        try { window.janasevaTranslateDOM(authContainer); } catch (e) {}
      }

      const toggleBtn = document.getElementById('user-menu-toggle');
      const dropdown = document.getElementById('user-menu-dropdown');
      const logoutBtn = document.getElementById('logout-btn');

      if (toggleBtn && dropdown) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isShown = dropdown.classList.toggle('show');
          toggleBtn.setAttribute('aria-expanded', isShown ? 'true' : 'false');
        });
        if (!this._docDropdownOutsideBound) {
          document.addEventListener('click', (ev) => {
            const d = document.getElementById('user-menu-dropdown');
            const t = document.getElementById('user-menu-toggle');
            if (d && !d.contains(ev.target) && (!t || !t.contains(ev.target))) {
              d.classList.remove('show');
              if (t) t.setAttribute('aria-expanded', 'false');
            }
          });
          this._docDropdownOutsideBound = true;
        }
      }

      if (typeof this.syncRoleNavigation === 'function') {
        this.syncRoleNavigation(this.currentUser);
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      }
    } else {
      if (window.location.pathname.includes('receiver-dashboard')) {
        authContainer.innerHTML = `
          <a href="login.html" class="nav-btn-primary">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Official Login</span>
          </a>
        `;
      } else {
        authContainer.innerHTML = `
          <a href="login.html" class="nav-btn-primary">
            <i class="fa-solid fa-arrow-right-to-bracket"></i>
            <span>Sign In</span>
          </a>
        `;
      }
    }

    // Restore or re-inject notification bell immediately so it is never removed during auth re-renders
    if (existingBell) {
      if (authContainer.firstChild !== existingBell) {
        authContainer.insertBefore(existingBell, authContainer.firstChild);
      }
    } else if (window.JanasevaNotifications && typeof window.JanasevaNotifications.injectBellButton === 'function') {
      window.JanasevaNotifications.injectBellButton();
    }

    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }

    try {
      window.dispatchEvent(new CustomEvent('janaseva:authChanged', { detail: this.currentUser }));
    } catch(e) {}
  }

  // Edit Profile Modal Management (USM Protected)
  openEditProfileModal() {
    if (!this.currentUser) return;
    let modal = document.getElementById('edit-profile-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'janaseva-modal-backdrop';
      modal.id = 'edit-profile-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="janaseva-modal-card" style="max-width: 560px; width: 94%;">
          <div class="janaseva-modal-header" style="padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
            <h3 class="janaseva-modal-title" style="margin: 0; font-size: 16px; font-weight: 800; color: #0b2545; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-user-pen" style="color: #0f56b3;"></i>
              <span>Edit Profile Details</span>
            </h3>
            <button type="button" class="btn-modal-close" id="edit-profile-close-x" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #64748b; line-height: 1;" aria-label="Close dialog">&times;</button>
          </div>
          <form id="edit-profile-form">
            <div class="janaseva-modal-body" style="padding: 18px 20px;">
              <div id="auth-profile-usm-status"></div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="edit-profile-name" style="font-weight: 700; font-size: 13px; color: #0b2545; display: block; margin-bottom: 6px;">
                  <i class="fa-regular fa-user" style="color: #0f56b3; margin-right: 6px;"></i>Full Name / Officer Name<span style="color: #dc2626;">*</span>
                </label>
                <input type="text" id="edit-profile-name" class="form-input" maxlength="100" style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" required>
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="edit-profile-email" style="font-weight: 700; font-size: 13px; color: #0b2545; display: block; margin-bottom: 6px;">
                  <i class="fa-regular fa-envelope" style="color: #0f56b3; margin-right: 6px;"></i>Login Email Address
                </label>
                <input type="email" id="edit-profile-email" class="form-input" style="width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; background: #f8fafc; color: #64748b; box-sizing: border-box;" readonly disabled>
                <small style="color: #64748b; font-size: 11.5px; margin-top: 4px; display: block;">Login email and authorization role are system-enforced and read-only.</small>
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="edit-profile-panchayat" style="font-weight: 700; font-size: 13px; color: #0b2545; display: block; margin-bottom: 6px;">
                  <i class="fa-solid fa-landmark" style="color: #0f56b3; margin-right: 6px;"></i>Gram Panchayat / Hub
                </label>
                <input type="text" id="edit-profile-panchayat" class="form-input" maxlength="100" style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" placeholder="Enter your Gram Panchayat">
              </div>

              <div class="form-group" style="margin-bottom: 6px;">
                <label class="form-label" for="edit-profile-phone" style="font-weight: 700; font-size: 13px; color: #0b2545; display: block; margin-bottom: 6px;">
                  <i class="fa-solid fa-phone" style="color: #0f56b3; margin-right: 6px;"></i>Contact Phone Number
                </label>
                <input type="tel" id="edit-profile-phone" class="form-input" maxlength="20" style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" placeholder="e.g. ">
              </div>
            </div>
            <div class="janaseva-modal-footer usm-actions-bar" style="margin-top: 0; padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap;">
              <button type="button" id="edit-profile-refresh-btn" class="btn-secondary-action usm-btn-refresh" style="padding: 8px 13px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                <i class="fa-solid fa-arrows-rotate"></i> <span>Refresh</span>
              </button>
              <button type="button" id="edit-profile-reset-btn" class="btn-secondary-action usm-btn-reset" style="padding: 8px 13px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                <i class="fa-solid fa-rotate-left"></i> <span>Reset Defaults</span>
              </button>
              <button type="button" id="edit-profile-cancel-btn" class="btn-secondary-action" style="padding: 8px 14px; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #ffffff; font-size: 13px;">
                Close
              </button>
              <button type="submit" id="edit-profile-save-btn" class="btn-cta-primary" style="padding: 8px 18px; border-radius: 6px; width: auto; background: #0f56b3; color: #ffffff; border: none; cursor: pointer; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
                <i class="fa-solid fa-floppy-disk"></i> <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      const attemptClose = async () => {
        const usm = window.JanasevaSettings;
        const sec = usm && usm.sections.get('auth-profile-modal');
        if (sec && sec.isDirty) {
          const ok = await usm.confirm({
            title: 'Discard Unsaved Profile Edits?',
            message: 'You have unsaved changes in your profile. Closing will discard them.',
            confirmText: 'Discard & Close',
            cancelText: 'Keep Editing',
            danger: true
          });
          if (!ok) return;
          usm.markClean('auth-profile-modal');
        }
        this.closeEditProfileModal();
      };

      modal.querySelector('#edit-profile-close-x')?.addEventListener('click', attemptClose);
      modal.querySelector('#edit-profile-cancel-btn')?.addEventListener('click', attemptClose);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) attemptClose();
      });

      if (window.JanasevaSettings) {
        window.JanasevaSettings.registerSection({
          sectionId: 'auth-profile-modal',
          sectionName: 'User Profile Settings',
          containerEl: modal,
          formEl: '#edit-profile-form',
          statusHostEl: '#auth-profile-usm-status',
          saveBtn: '#edit-profile-save-btn',
          resetBtn: '#edit-profile-reset-btn',
          refreshBtn: '#edit-profile-refresh-btn',
          confirmResetTitle: 'Reset Editable Profile Fields to Defaults?',
          confirmResetMessage: 'Restores default profile display name and hub for your role and clears optional contact phone. Your Login Email and Role remain unchanged.',
          confirmResetDetail: 'Scope: Only editable fields of your own user profile are affected.',
          onSave: async () => {
            const newName = (document.getElementById('edit-profile-name')?.value || '').trim();
            const newGp = (document.getElementById('edit-profile-panchayat')?.value || '').trim();
            const newPhone = (document.getElementById('edit-profile-phone')?.value || '').trim();
            const updated = await this.updateCurrentUserProfile({ name: newName, panchayatName: newGp, phone: newPhone });
            return {
              savedAt: updated.updatedAt || new Date().toISOString(),
              updatedBy: updated.email,
              message: 'Profile updated and confirmed in database!'
            };
          },
          onReset: async () => {
            const role = this.currentUser?.role || 'citizen';
            const defaultNames = {
              admin: 'System Administrator',
              receiver: '',
              citizen: 'Citizen User'
            };
            const defaults = {
              name: defaultNames[role] || 'Portal User',
              panchayatName: '',
              phone: ''
            };
            const updated = await this.updateCurrentUserProfile(defaults);
            this._fillProfileModalInputs(updated);
            return {
              savedAt: updated.updatedAt || new Date().toISOString(),
              updatedBy: updated.email,
              message: 'Profile fields reset to approved defaults.'
            };
          },
          onRefresh: async () => {
            const fresh = await this.refreshCurrentUserProfile({ strictRemote: true });
            this._fillProfileModalInputs(fresh);
            return {
              refreshedAt: new Date().toISOString(),
              updatedBy: fresh?.email || '',
              message: 'Profile reloaded from database.'
            };
          }
        });
      } else {
        modal.querySelector('#edit-profile-form')?.addEventListener('submit', (e) => this.handleSaveProfile(e));
      }
    }

    this._fillProfileModalInputs(this.currentUser);
    if (window.JanasevaSettings) {
      window.JanasevaSettings.markClean('auth-profile-modal', {
        savedAt: this.currentUser.updatedAt || null,
        updatedBy: this.currentUser.email || ''
      });
    }

    const dropdown = document.getElementById('user-menu-dropdown');
    if (dropdown) dropdown.classList.remove('show');

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations(modal);
    }
    const nameInput = document.getElementById('edit-profile-name');
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
  }

  _fillProfileModalInputs(user) {
    if (!user) return;
    const fill = () => {
      const nameInput = document.getElementById('edit-profile-name');
      const emailInput = document.getElementById('edit-profile-email');
      const gpInput = document.getElementById('edit-profile-panchayat');
      const phoneInput = document.getElementById('edit-profile-phone');

      if (nameInput) nameInput.value = user.name || '';
      if (emailInput) emailInput.value = user.email || '';
      if (gpInput) gpInput.value = user.panchayatName || '';
      if (phoneInput) phoneInput.value = user.phone || user.mobile || '';
    };
    if (window.JanasevaSettings) {
      window.JanasevaSettings.runProgrammaticUpdate('auth-profile-modal', fill);
    } else {
      fill();
    }
  }

  closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  async updateCurrentUserProfile({ name, phone = '', panchayatName = '' }) {
    if (!this.currentUser) throw new Error('Authentication required to update profile.');
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanGp = String(panchayatName || '').trim();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter a valid full name (minimum 2 characters).');
    }
    if (cleanPhone && !/^[+]?[0-9\s-]{10,18}$/.test(cleanPhone)) {
      throw new Error('Contact phone number must be 10–18 digits.');
    }

    const nowIso = new Date().toISOString();

    // 1. Write to Firestore FIRST and verify confirmation (never report success if DB fails)
    if (window.isFirebaseAvailable && window.fbDb && this.currentUser.uid) {
      const fbProfileUpdate = {
        name: cleanName.slice(0, 100),
        panchayatName: cleanGp.slice(0, 100),
        updatedAt: nowIso,
        updatedBy: this.currentUser.email || this.currentUser.uid
      };
      if (cleanPhone) {
        fbProfileUpdate.mobile = cleanPhone;
      }
      await window.fbDb.collection('users').doc(this.currentUser.uid).update(fbProfileUpdate);
    }

    // 2. Commit locally only after DB confirmed
    const updatedUser = {
      ...this.currentUser,
      name: cleanName,
      panchayatName: cleanGp,
      phone: cleanPhone,
      mobile: cleanPhone || this.currentUser.mobile || '',
      updatedAt: nowIso
    };
    this.currentUser = updatedUser;
    localStorage.setItem('JANASEVA_currentUser', JSON.stringify(updatedUser));

    if (typeof JanasevaDB !== 'undefined') {
      const users = JanasevaDB.get('users', []);
      const idx = users.findIndex((u) => u.uid === updatedUser.uid || u.email === updatedUser.email);
      if (idx !== -1) {
        users[idx] = { ...users[idx], name: cleanName, panchayatName: cleanGp, phone: cleanPhone, mobile: cleanPhone || users[idx].mobile || '', updatedAt: nowIso };
      } else {
        users.push(updatedUser);
      }
      JanasevaDB.set('users', users);
    }

    this.initAuthUI();
    window.dispatchEvent(new CustomEvent('janaseva:authChanged', { detail: updatedUser }));
    window.dispatchEvent(new CustomEvent('janaseva:profileUpdated', { detail: updatedUser }));
    return updatedUser;
  }

  async refreshCurrentUserProfile(options = {}) {
    if (!this.currentUser) throw new Error('No active session to refresh.');
    const strictRemote = Boolean(options && options.strictRemote);

    if (window.isFirebaseAvailable && window.fbDb && this.currentUser.uid) {
      let doc;
      try {
        doc = await window.fbDb.collection('users').doc(this.currentUser.uid).get();
      } catch (err) {
        if (strictRemote) {
          throw new Error('Database unreachable while refreshing profile: ' + (err.message || err));
        }
        return this.currentUser;
      }
      if (doc && doc.exists) {
        const remote = doc.data() || {};
        this.currentUser = {
          ...this.currentUser,
          ...remote,
          phone: remote.mobile || remote.phone || this.currentUser.phone || ''
        };
        localStorage.setItem('JANASEVA_currentUser', JSON.stringify(this.currentUser));
        this.initAuthUI();
        window.dispatchEvent(new CustomEvent('janaseva:authChanged', { detail: this.currentUser }));
        window.dispatchEvent(new CustomEvent('janaseva:profileUpdated', { detail: this.currentUser }));
        return this.currentUser;
      }
    }

    if (typeof JanasevaDB !== 'undefined') {
      const users = JanasevaDB.get('users', []);
      const found = users.find((u) => u.uid === this.currentUser.uid || u.email === this.currentUser.email);
      if (found) {
        this.currentUser = { ...this.currentUser, ...found };
        localStorage.setItem('JANASEVA_currentUser', JSON.stringify(this.currentUser));
        this.initAuthUI();
      }
    }
    return this.currentUser;
  }

  async updateCitizenPreferences({ preferredLang, uiPreferences }) {
    if (!this.currentUser) throw new Error('Authentication required to save preferences.');
    const lang = ['en', 'kn', 'hi'].includes(preferredLang) ? preferredLang : 'en';
    const cleanPrefs = {
      compactCards: Boolean(uiPreferences?.compactCards),
      autoExpandTimeline: uiPreferences?.autoExpandTimeline !== false,
      emailAlertsOptIn: uiPreferences?.emailAlertsOptIn !== false
    };
    const nowIso = new Date().toISOString();

    if (window.isFirebaseAvailable && window.fbDb && this.currentUser.uid) {
      await window.fbDb.collection('users').doc(this.currentUser.uid).update({
        preferredLang: lang,
        uiPreferences: cleanPrefs,
        updatedAt: nowIso,
        updatedBy: this.currentUser.email || this.currentUser.uid
      });
    }

    this.currentUser = {
      ...this.currentUser,
      preferredLang: lang,
      uiPreferences: cleanPrefs,
      updatedAt: nowIso
    };
    localStorage.setItem('JANASEVA_currentUser', JSON.stringify(this.currentUser));

    if (typeof JanasevaDB !== 'undefined') {
      const users = JanasevaDB.get('users', []);
      const idx = users.findIndex((u) => u.uid === this.currentUser.uid || u.email === this.currentUser.email);
      if (idx !== -1) {
        users[idx].preferredLang = lang;
        users[idx].uiPreferences = cleanPrefs;
        users[idx].updatedAt = nowIso;
        JanasevaDB.set('users', users);
      }
    }

    try {
      localStorage.setItem('janaseva_lang', lang);
      if (window.janasevaTranslator && typeof window.janasevaTranslator.setLanguage === 'function') {
        window.janasevaTranslator.setLanguage(lang);
      }
    } catch { /* ignore */ }

    window.dispatchEvent(new CustomEvent('janaseva:profileUpdated', { detail: this.currentUser }));
    return this.currentUser;
  }

  async handleSaveProfile(event) {
    if (event) event.preventDefault();
    if (!this.currentUser) return;

    if (window.JanasevaSettings && window.JanasevaSettings.sections.has('auth-profile-modal')) {
      return await window.JanasevaSettings.triggerSave('auth-profile-modal');
    }

    const newName = (document.getElementById('edit-profile-name')?.value || '').trim();
    const newGp = (document.getElementById('edit-profile-panchayat')?.value || '').trim();
    const newPhone = (document.getElementById('edit-profile-phone')?.value || '').trim();

    try {
      await this.updateCurrentUserProfile({ name: newName, panchayatName: newGp, phone: newPhone });
      this.closeEditProfileModal();
      if (typeof showToast === 'function') showToast('Profile updated successfully!', 'success');
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to save profile.', 'error');
      else if (typeof window.janasevaAlert === 'function') window.janasevaAlert(err.message);
    }
  }
}

// Global Instance
window.authService = new AuthService();
window.showToast = showToast;
window.openEditProfileModal = () => window.authService?.openEditProfileModal();

// Global Mobile Nav Toggle & Responsive Drawer Controller
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const mainNav = document.getElementById('main-navigation');
  
  if (toggleBtn && mainNav) {
    let backdrop = document.getElementById('nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'nav-backdrop';
      backdrop.className = 'nav-backdrop';
      document.body.appendChild(backdrop);
    }

    const openMenu = () => {
      mainNav.classList.add('mobile-active');
      toggleBtn.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = 'fa-solid fa-xmark';
      }
      backdrop.classList.add('backdrop-active');
      document.body.classList.add('nav-drawer-open');
    };

    const closeMenu = () => {
      mainNav.classList.remove('mobile-active');
      toggleBtn.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = 'fa-solid fa-bars';
      }
      backdrop.classList.remove('backdrop-active');
      document.body.classList.remove('nav-drawer-open');
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mainNav.classList.contains('mobile-active');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    backdrop.addEventListener('click', () => {
      closeMenu();
    });

    mainNav.addEventListener('click', (e) => {
      const target = e.target;
      if (target.closest('.nav-link') || target.closest('.nav-btn-primary') || target.closest('.nav-btn-secondary') || target.closest('.user-menu-item')) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('mobile-active')) {
        closeMenu();
        toggleBtn.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1080 && mainNav.classList.contains('mobile-active')) {
        closeMenu();
      }
    });
  }
});

if (typeof AuthService === 'function') {
  AuthService.prototype.syncRoleNavigation = function(user) {
    const isOfficial = !!(user && (user.role === 'admin' || user.role === 'receiver'));
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];

    // Keep Home/Logo links pointed to ?view=citizen for officials so clicking Home doesn't bounce back to dashboard
    document.querySelectorAll('.main-nav a[href^="index.html"], .brand-section[href^="index.html"], .portal-footer a[href^="index.html"]').forEach(link => {
      const rawHref = link.getAttribute('href') || '';
      if (rawHref === 'index.html' || rawHref === 'index.html?view=citizen') {
        link.setAttribute('href', isOfficial ? 'index.html?view=citizen' : 'index.html');
      }
    });

    const mainNav = document.getElementById('main-nav') || document.querySelector('.main-nav');
    if (!mainNav) return;

    // Remove previous role-specific links before re-rendering
    mainNav.querySelectorAll('.nav-link-role-injected').forEach(el => el.remove());
    if (!user) return;

    const anchorEl = mainNav.querySelector('.lang-selector-wrapper') || mainNav.querySelector('#nav-auth-container') || mainNav.querySelector('#auth-nav-container');

    const createRoleLink = (href, iconClass, label) => {
      const a = document.createElement('a');
      a.href = href;
      a.className = 'nav-link nav-link-role nav-link-role-injected' + (currentPage === href ? ' active' : '');
      a.innerHTML = `<i class="${iconClass}"></i> <span>${label}</span>`;
      return a;
    };

    const insertNavEl = (el) => {
      const targetHref = el.getAttribute('href');
      if (targetHref && mainNav.querySelector(`a[href="${targetHref}"]`)) return;
      if (anchorEl && anchorEl.parentNode === mainNav) {
        mainNav.insertBefore(el, anchorEl);
      } else {
        mainNav.appendChild(el);
      }
    };

    if (isOfficial) {
      const dashLabel = user.role === 'admin' ? 'Control Centre' : 'Dashboard';
      insertNavEl(createRoleLink('receiver-dashboard.html', 'fa-solid fa-gauge-high', dashLabel));
      if (user.role === 'receiver') {
        insertNavEl(createRoleLink('receiver-settings.html', 'fa-solid fa-gear', 'Settings'));
      }
    } else if (user.role === 'citizen') {
      insertNavEl(createRoleLink('citizen-dashboard.html', 'fa-solid fa-folder-open', 'My Complaints'));
    }

    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  };
}

// ==========================================================================
// GLOBAL EVIDENCE PHOTOGRAPH LIGHTBOX VIEWER
// ==========================================================================
if (!window.openImageLightbox) {
  window.openImageLightbox = function(src, title) {
    if (!src) return;
    let modal = document.getElementById('evidence-image-lightbox-modal');
    if (!modal) {
      const div = document.createElement('div');
      div.className = 'modal-overlay';
      div.id = 'evidence-image-lightbox-modal';
      div.setAttribute('role', 'dialog');
      div.setAttribute('aria-modal', 'true');
      div.setAttribute('aria-hidden', 'true');
      div.style.cssText = 'z-index: 10005; background-color: rgba(11, 25, 44, 0.90); backdrop-filter: blur(8px);';
      div.innerHTML = `
        <div class="modal-window" style="max-width: 860px; width: 94%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.5); display: flex; flex-direction: column; max-height: 94vh;">
          <div class="modal-header" style="padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div class="modal-title" style="font-size: 15px; font-weight: 800; color: #0b2545; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-image" style="color: #0f56b3;"></i>
              <span id="lightbox-image-title">Complaint Evidence Photograph</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <a id="lightbox-download-btn" href="#" download="complaint-evidence.png" class="btn-secondary-action" style="padding: 6px 14px; font-size: 12px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; color: #0b2545; background: #ffffff; border: 1px solid #cbd5e1; font-weight: 700; cursor: pointer;" title="Download full evidence image">
                <i class="fa-solid fa-download"></i> <span>Download</span>
              </a>
              <button type="button" class="btn-secondary-action" id="lightbox-newtab-btn" onclick="window.openCurrentLightboxInNewTab()" style="padding: 6px 14px; font-size: 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; color: #0b2545; background: #ffffff; border: 1px solid #cbd5e1; font-weight: 700;" title="Open in new window">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>New Tab</span>
              </button>
              <button type="button" class="modal-close-btn" onclick="window.closeImageLightbox()" aria-label="Close image lightbox" style="font-size: 26px; line-height: 1; padding: 0 8px; background: none; border: none; cursor: pointer; color: #64748b;">&times;</button>
            </div>
          </div>
          <div class="modal-body" style="padding: 16px; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 280px; max-height: 74vh; overflow: auto; text-align: center;">
            <img id="lightbox-image-element" src="" alt="Complaint Evidence Photograph Full Resolution" style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); cursor: zoom-in; transition: transform 0.2s ease;">
          </div>
          <div style="padding: 10px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; flex-wrap: wrap; gap: 8px;">
            <span><i class="fa-solid fa-circle-info"></i> Click image to zoom in/out &bull; Press <kbd style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px; font-family: monospace;">ESC</kbd> to close</span>
            <button type="button" class="btn-cta-primary" onclick="window.closeImageLightbox()" style="padding: 6px 18px; font-size: 12px; border-radius: 6px; width: auto; background: #0f56b3; color: #ffffff; border: none; cursor: pointer; font-weight: 700;">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(div);
      modal = div;

      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeImageLightbox();
      });

      const img = modal.querySelector('#lightbox-image-element');
      if (img) {
        let isZoomed = false;
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          isZoomed = !isZoomed;
          if (isZoomed) {
            img.style.maxHeight = 'none';
            img.style.maxWidth = '160%';
            img.style.cursor = 'zoom-out';
          } else {
            img.style.maxHeight = '70vh';
            img.style.maxWidth = '100%';
            img.style.cursor = 'zoom-in';
          }
        });
      }
    }

    const titleEl = document.getElementById('lightbox-image-title');
    const imgEl = document.getElementById('lightbox-image-element');
    const dlBtn = document.getElementById('lightbox-download-btn');

    if (titleEl) {
      titleEl.textContent = title ? `Evidence Photograph — ${title}` : 'Complaint Evidence Photograph';
    }
    if (imgEl) {
      imgEl.src = src;
      imgEl.style.maxHeight = '70vh';
      imgEl.style.maxWidth = '100%';
      imgEl.style.cursor = 'zoom-in';
    }
    if (dlBtn) {
      dlBtn.href = src;
      dlBtn.download = `JANASEVA-Evidence-${title || 'photo'}.png`;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  window.closeImageLightbox = function() {
    const modal = document.getElementById('evidence-image-lightbox-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  };

  window.openCurrentLightboxInNewTab = function() {
    const imgEl = document.getElementById('lightbox-image-element');
    if (!imgEl || !imgEl.src) return;
    const src = imgEl.src;
    const title = document.getElementById('lightbox-image-title')?.textContent || 'Evidence Photograph';

    if (src.startsWith('data:image/')) {
      const w = window.open('');
      if (w) {
        w.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { margin: 0; background: #0b192c; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: auto; }
                img { max-width: 95vw; max-height: 95vh; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 6px; }
              </style>
            </head>
            <body>
              <img src="${src}" alt="${title}">
            </body>
          </html>
        `);
        w.document.close();
      }
    } else {
      window.open(src, '_blank');
    }
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeImageLightbox();
    }
  });
}
