// js/auth.js - Authentication module for admin users

const TOKEN_KEY = 'xtent_admin_token';
const ADMIN_KEY = 'xtent_admin_user';

// Individual function exports (for direct imports)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => { 
    localStorage.removeItem(TOKEN_KEY); 
    localStorage.removeItem(ADMIN_KEY); 
};
export const setAdmin = (user) => localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
export const getAdmin = () => JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null');
export const isLoggedIn = () => !!getToken();

// Check if user is authenticated (alias for isLoggedIn)
export const isAuthenticated = () => !!getToken();

// Call on every protected page load
export const requireAuth = () => {
    if (!isLoggedIn()) { 
        window.location.hash = '#/admin/login'; 
        return false; 
    }
    return true;
};

// Export as a single Auth object (for pages that import { Auth })
export const Auth = {
    setToken,
    getToken,
    clearToken,
    setAdmin,
    getAdmin,
    isLoggedIn,
    isAuthenticated,
    requireAuth
};