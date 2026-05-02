// Import your utility modules (adjust paths if you aren't using ES modules)
import { API } from '../../js/api.js';
import { Auth } from '../../js/auth.js';
import { Toast } from '../../js/toast.js';

export const AdminLogin = {
    /**
     * Renders the HTML layout for the login page
     */
    async render() {
        return `
            <div class="login-wrapper" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: var(--color-background);">
                <div class="card" style="width: 100%; max-width: 400px; padding: 2rem; box-shadow: var(--shadow-card); border-radius: var(--border-radius); background: var(--color-card);">
                    
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <!-- APP_CONFIG is globally available from config.js -->
                        <img src="${window.APP_CONFIG?.company?.logoUrl || 'assets/logo.png'}" alt="Logo" style="height: 60px; margin-bottom: 1rem;">
                        <h2 style="font-family: var(--font-display); color: var(--color-text);">Admin Portal</h2>
                        <p style="color: var(--color-text-muted); font-size: 0.9rem;">Sign in to manage submissions</p>
                    </div>

                    <form id="admin-login-form">
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email Address</label>
                            <input type="email" id="email" required autofocus 
                                style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px;" 
                                placeholder="admin@example.com">
                        </div>

                        <div class="form-group" style="margin-bottom: 2rem;">
                            <label for="password" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password</label>
                            <input type="password" id="password" required 
                                style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px;" 
                                placeholder="••••••••">
                        </div>

                        <button type="submit" id="login-btn" 
                            style="width: 100%; padding: 0.75rem; background-color: var(--color-primary); color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                            Sign In
                        </button>
                    </form>

                </div>
            </div>
        `;
    },

    /**
     * Attaches event listeners and handles the authentication logic
     */
    async init() {
        // 1. Auto-redirect check: If already logged in, send them straight to the dashboard
        if (Auth.isAuthenticated()) {
            window.location.hash = '#/admin';
            return;
        }

        const form = document.getElementById('admin-login-form');
        const loginBtn = document.getElementById('login-btn');

        // 2. Handle Form Submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent page refresh

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // UI Feedback: Show loading state
            const originalBtnText = loginBtn.innerHTML;
            loginBtn.innerHTML = 'Signing in...';
            loginBtn.disabled = true;
            loginBtn.style.opacity = '0.7';

            try {
                // 3. Make the API call to your Express backend
                const response = await API.login(email, password);

                // 4. Handle Backend Response
                if (response.success) {
                    // Save token and admin data to localStorage
                    Auth.setToken(response.data.token);
                    Auth.setAdmin(response.data.admin);

                    Toast.success('Login successful!');

                    // Redirect to the protected dashboard route
                    window.location.hash = '#/admin';
                } else {
                    // Backend gracefully rejected the login (e.g., wrong password)
                    Toast.error(response.message || 'Invalid login credentials.');
                }
            } catch (error) {
                // Catch severe network errors (e.g., server offline, CORS block)
                console.error("Login Error:", error);
                Toast.error(error.message || 'Could not connect to the server.');
            } finally {
                // Reset UI state
                loginBtn.innerHTML = originalBtnText;
                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
            }
        });
    }
};