import { Auth } from '../../js/auth.js';
// Import the child modules that this dashboard will render
import { SubmissionsList } from './submissions-list.js';
import { ServicesList } from './services-list.js';

export const AdminDashboard = {
    // Tracks which tab is currently active
    currentTab: 'submissions',

    /**
     * Renders the main shell HTML
     */
    async render() {
        // Enforce Authentication before even attempting to render
        if (!Auth.isAuthenticated()) {
            window.location.hash = '#/admin/login';
            return ''; // Stop rendering
        }

        const company = window.APP_CONFIG?.company || { name: 'Admin', logoUrl: '' };
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        return `
            <div class="admin-layout" style="min-height: 100vh; display: flex; flex-direction: column; background: var(--color-background);">
                
                <!-- Admin Top Navbar -->
                <header style="background: var(--color-card); box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <img src="${company.logoUrl}" alt="Logo" style="height: 40px;">
                        <div style="border-left: 2px solid var(--color-primary-light); padding-left: 1rem;">
                            <h2 style="margin: 0; font-family: var(--font-display); color: var(--color-primary); font-size: 1.2rem;">Admin Dashboard</h2>
                            <p style="margin: 0; font-size: 0.8rem; color: var(--color-text-muted);">${company.name}</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <span style="font-size: 0.9rem; color: var(--color-text); font-weight: 500;">
                            Hello, <span style="color: var(--color-primary);">${adminUser.email || 'Admin'}</span>
                        </span>
                        <button id="btn-logout" style="padding: 0.5rem 1rem; background: #fee2e2; color: var(--color-danger); border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: background 0.2s;">
                            Logout
                        </button>
                    </div>
                </header>

                <!-- Admin Main Content Area -->
                <main style="flex: 1; padding: 2rem; max-width: 1400px; margin: 0 auto; width: 100%;">
                    
                    <!-- Tab Controls -->
                    <div class="admin-tabs" style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0;">
                        <button class="tab-btn active" data-tab="submissions" style="padding: 0.75rem 2rem; background: none; border: none; border-bottom: 3px solid var(--color-primary); color: var(--color-primary); font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s;">
                            Submissions
                        </button>
                        <button class="tab-btn" data-tab="services" style="padding: 0.75rem 2rem; background: none; border: none; border-bottom: 3px solid transparent; color: var(--color-text-muted); font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s;">
                            Service Builder
                        </button>
                    </div>

                    <!-- Dynamic Tab Content Injected Here -->
                    <div id="admin-tab-content">
                        <!-- Loading State -->
                        <div style="text-align: center; padding: 3rem; color: var(--color-text-muted);">Loading modules...</div>
                    </div>

                </main>
            </div>

            <style>
                .tab-btn:hover { color: var(--color-primary) !important; }
                #btn-logout:hover { background: #fecaca !important; }
            </style>
        `;
    },

    /**
     * Initializes logic, sets up tabs, and delegates rendering to children
     */
    async init() {
        // Double check auth just in case (e.g., token expired while sitting on page)
        if (!Auth.isAuthenticated()) return;

        // 1. Setup Logout Logic
        document.getElementById('btn-logout').addEventListener('click', () => {
            Auth.logout();
        });

        // 2. Setup Tab Switching Logic
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update UI state for tabs
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = 'var(--color-text-muted)';
                });
                
                const target = e.currentTarget;
                target.classList.add('active');
                target.style.borderBottomColor = 'var(--color-primary)';
                target.style.color = 'var(--color-primary)';

                // Trigger module load
                this.currentTab = target.getAttribute('data-tab');
                this.loadTabContent();
            });
        });

        // 3. Load the initial tab content (Submissions by default)
        await this.loadTabContent();
    },

    /**
     * Orchestrates the rendering and initialization of the selected child module
     */
    async loadTabContent() {
        const contentContainer = document.getElementById('admin-tab-content');
        
        // Show a brief loading state during switch
        contentContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Loading...</div>`;

        try {
            if (this.currentTab === 'submissions') {
                // Render the Submissions List Module
                contentContainer.innerHTML = await SubmissionsList.render();
                
                // IMPORTANT: We must wait for the HTML to be injected before running the module's init() 
                // because init() will look for DOM elements that were just rendered.
                if (typeof SubmissionsList.init === 'function') {
                    await SubmissionsList.init();
                }
            } 
            else if (this.currentTab === 'services') {
                // Render the Services Builder Module
                contentContainer.innerHTML = await ServicesList.render();
                
                if (typeof ServicesList.init === 'function') {
                    await ServicesList.init();
                }
            }
        } catch (error) {
            console.error(`Error loading tab: ${this.currentTab}`, error);
            contentContainer.innerHTML = `
                <div style="background: #fee2e2; color: var(--color-danger); padding: 1rem; border-radius: 6px;">
                    Failed to load this module. Please check the console for details.
                </div>
            `;
        }
    }
};