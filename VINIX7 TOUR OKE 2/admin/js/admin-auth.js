class AdminAuth {
    constructor() {
        this.storageKey = 'vinix7_admin';
        this.tokenKey = 'admin_token';
        this.tokenExpiryKey = 'admin_token_expiry';
        
        this.init();
    }

    init() {
        this.checkLoginState();
        this.initLoginForm();
    }

    createDefaultAdmin() {
        const defaultAdmin = {
            username: 'admin',
            password: 'admin123',
            email: 'admin@vinix7.com',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(defaultAdmin));
        console.log('Default admin created successfully');
        return defaultAdmin;
    }

    getAdminData() {
        try {
            const adminData = localStorage.getItem(this.storageKey);
            if (!adminData) return null;
            return JSON.parse(adminData);
        } catch (error) {
            return null;
        }
    }

    saveAdminData(adminData) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(adminData));
            return true;
        } catch (error) {
            return false;
        }
    }

    checkLoginState() {
        const token = localStorage.getItem(this.tokenKey);
        const expiry = localStorage.getItem(this.tokenExpiryKey);
        
        if (token && expiry && Date.now() < parseInt(expiry)) {
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            this.clearSession();
            
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('index.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    initLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });

            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });
            }
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.querySelector('button[type="submit"]');

        if (!username || !password) {
            this.showError('Username dan password harus diisi');
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Memproses...';
        submitBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            let adminData = this.getAdminData();
            if (!adminData) {
                adminData = this.createDefaultAdmin();
            }

            console.log('🔐 Login attempt:', { 
                username: username,
                storedUsername: adminData.username,
                passwordMatch: password === adminData.password
            });

            if (username === adminData.username && password === adminData.password) {
                this.createSession();
                this.showSuccess('Login berhasil! Mengarahkan ke dashboard...');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error('Username atau password salah');
            }

        } catch (error) {
            this.showError(error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    createSession() {
        const token = this.generateToken();
        const expiry = Date.now() + (24 * 60 * 60 * 1000);
        
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.tokenExpiryKey, expiry.toString());
        localStorage.setItem('admin_last_login', new Date().toISOString());

        const adminData = this.getAdminData();
        adminData.last_login = new Date().toISOString();
        this.saveAdminData(adminData);
    }

    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.tokenExpiryKey);
    }

    generateToken() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.className = 'bg-red-50 border border-red-200 rounded-xl p-4';
            errorDiv.classList.remove('hidden');
            
            errorDiv.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                errorDiv.style.animation = '';
            }, 500);
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorDiv && errorText) {
            errorDiv.className = 'bg-green-50 border border-green-200 rounded-xl p-4';
            errorText.innerHTML = message;
            errorDiv.classList.remove('hidden');
        }
    }

    logout() {
        this.clearSession();
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);
        const expiry = localStorage.getItem(this.tokenExpiryKey);
        return token && expiry && Date.now() < parseInt(expiry);
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    getCurrentAdmin() {
        return this.getAdminData();
    }

    verifyCurrentPassword(password) {
        const adminData = this.getAdminData();
        return adminData && password === adminData.password;
    }

    updatePassword(newPassword) {
        const adminData = this.getAdminData();
        if (!adminData) return false;
        
        adminData.password = newPassword;
        return this.saveAdminData(adminData);
    }
}

const adminAuth = new AdminAuth();