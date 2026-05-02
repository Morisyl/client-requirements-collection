/**
 * Vanilla JS Hash Router
 * Handles dynamic imports, URL parameters, and module lifecycle methods (render & init).
 */

// Import config to make it available globally before routes load
import { APP_CONFIG } from '../config.js';

// ─── ROUTE DEFINITIONS ─────────────────────────────────────────────────────
// We define the path, the path to the module file, and the exact exported variable name.
const routes = [
    // Public Routes
    { path: '/', module: '../pages/public/home.js', component: 'Home' },
    { path: '/apply/:serviceKey', module: '../pages/public/forms/form-wizard.js', component: 'FormWizard' },
    
    // Admin Routes
    { path: '/admin/login', module: '../pages/admin/login.js', component: 'AdminLogin' },
    { path: '/admin', module: '../pages/admin/dashboard.js', component: 'AdminDashboard' },
    { path: '/admin/submissions/:id', module: '../pages/admin/submission-detail.js', component: 'SubmissionDetail' },
    
    // Service Editor Routes
    { path: '/admin/services/new', module: '../pages/admin/service-editor.js', component: 'ServiceEditor' },
    { path: '/admin/services/:id', module: '../pages/admin/service-editor.js', component: 'ServiceEditor' },
];

// ─── ROUTER LOGIC ──────────────────────────────────────────────────────────

/**
 * Parses the current hash and attempts to match it to a defined route.
 * Handles dynamic parameters (e.g., :id or :serviceKey).
 */
function matchRoute(currentHash) {
    // Clean the hash (e.g., "#/admin/submissions/1" -> "/admin/submissions/1")
    const requestURL = currentHash.slice(1).toLowerCase() || '/';
    const requestSegments = requestURL.split('/').filter(Boolean);

    for (let route of routes) {
        const routeSegments = route.path.split('/').filter(Boolean);
        
        // If segment lengths don't match, it's not this route
        if (requestSegments.length !== routeSegments.length) continue;

        let match = true;
        let params = {};

        // Check segment by segment
        for (let i = 0; i < routeSegments.length; i++) {
            if (routeSegments[i].startsWith(':')) {
                // It's a dynamic parameter, extract the value
                const paramName = routeSegments[i].substring(1);
                params[paramName] = requestSegments[i];
            } else if (routeSegments[i].toLowerCase() !== requestSegments[i]) {
                // Static segments don't match
                match = false;
                break;
            }
        }

        if (match) return { route, params };
    }

    return null; // 404 Not Found
}

/**
 * The core routing engine. 
 * Finds the route, loads the file, renders the HTML, and fires the JS logic.
 */
async function router() {
    const appContainer = document.getElementById('app');
    
    // 1. Get the current hash or default to home
    const hash = window.location.hash || '#/';
    
    // 2. Find the matching route
    const match = matchRoute(hash);

    // 3. Handle 404 - Not Found
    if (!match) {
        appContainer.innerHTML = `
            <div style="min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <h1 style="font-family: var(--font-display); font-size: 4rem; color: var(--color-primary); margin: 0;">404</h1>
                <p style="font-size: 1.2rem; color: var(--color-text-muted); margin-bottom: 2rem;">The page you are looking for does not exist.</p>
                <a href="#/" style="padding: 0.75rem 2rem; background: var(--color-primary); color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Return Home</a>
            </div>
        `;
        return;
    }

    try {
        // 4. Show a quick global loading state while the JS module downloads
        appContainer.innerHTML = `
            <div style="display: flex; justify-content: center; padding: 4rem; color: var(--color-text-muted);">
                Loading...
            </div>
        `;

        // 5. Dynamically import the module corresponding to the route
        const module = await import(match.route.module);
        const Component = module[match.route.component];

        if (!Component) {
            throw new Error(`Export '${match.route.component}' not found in ${match.route.module}`);
        }

        // 6. Render the HTML 
        // We pass the dynamic parameters to the render function (e.g., submission ID)
        appContainer.innerHTML = await Component.render(match.params);

        // 7. Initialize component logic
        // We ensure the DOM is painted first before attaching listeners
        setTimeout(async () => {
            if (typeof Component.init === 'function') {
                await Component.init(match.params);
            } else if (typeof Component.setupListeners === 'function') {
                // Fallback for some of the form modules that use setupListeners
                await Component.setupListeners(match.params);
            }
        }, 0);

        // Scroll to top on route change
        window.scrollTo(0, 0);

    } catch (error) {
        console.error("Routing Error:", error);
        appContainer.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--color-danger);">
                <h3>Oops! Something went wrong loading this module.</h3>
                <p style="font-size: 0.9rem; margin: 1rem 0;">Error: ${error.message}</p>
                <p style="font-size: 0.85rem; color: var(--color-text-muted);">Check the browser console for details.</p>
                <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-danger); color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
            </div>
        `;
    }
}

// ─── INITIALIZATION ────────────────────────────────────────────────────────

// Listen for hash changes (when user clicks links or uses browser back/forward buttons)
window.addEventListener('hashchange', router);

// Run the router when the page initially loads
window.addEventListener('DOMContentLoaded', () => {
    // If the user lands on the root domain without a hash, enforce the #/
    if (!window.location.hash) {
        window.location.hash = '#/';
    } else {
        router();
    }
});