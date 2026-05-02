import { API } from '../../js/api.js';
import { Toast } from '../../js/toast.js';

export const Home = {
    /**
     * Renders the HTML layout for the public homepage.
     */
    async render() {
        // We use window.APP_CONFIG which was loaded globally from config.js
        const company = window.APP_CONFIG.company;

        return `
            <div class="home-container" style="min-height: 100vh; display: flex; flex-direction: column;">
                
                <!-- Hero Section -->
                <header class="hero" style="text-align: center; padding: 4rem 1rem; background-color: var(--color-primary); color: white;">
                    <img src="${company.logoUrl}" alt="${company.name} Logo" style="height: 80px; margin-bottom: 1rem; filter: brightness(0) invert(1);">
                    <h1 style="font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 0.5rem;">${company.name}</h1>
                    <p style="font-size: 1.2rem; opacity: 0.9;">${company.tagline}</p>
                </header>

                <!-- Main Content -->
                <main style="flex: 1; padding: 3rem 1rem; max-width: 1200px; margin: 0 auto; width: 100%;">
                    <div style="text-align: center; margin-bottom: 3rem;">
                        <h2 style="color: var(--color-text); font-size: 1.8rem; margin-bottom: 0.5rem;">How can we help your business today?</h2>
                        <p style="color: var(--color-text-muted);">Select a service below to begin your secure application.</p>
                    </div>

                    <!-- Services Grid Container -->
                    <div id="services-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                        
                        <!-- Loading Skeletons (Shown before API responds) -->
                        ${this.generateSkeletons(3)}
                        
                    </div>
                </main>

                <!-- Footer with the Easter Egg -->
                <footer style="text-align: center; padding: 2rem; background: var(--color-background); border-top: 1px solid #eaeaea; margin-top: auto;">
                    <p id="copyright-text" style="color: var(--color-text-muted); cursor: default; user-select: none;">
                        &copy; ${company.year} ${company.name}. All rights reserved.<br>
                        <span style="font-size: 0.8rem; opacity: 0.7;">${company.legalNote}</span>
                    </p>
                </footer>
            </div>
        `;
    },

    /**
     * Attaches event listeners and handles the data fetching logic
     */
    async init() {
        // 1. Setup the Admin Easter Egg
        this.setupEasterEgg();

        // 2. Fetch the active services from the backend
        try {
            const response = await API.getServices();
            const grid = document.getElementById('services-grid');

            if (response.success && response.data.length > 0) {
                // Filter to only show active services on the frontend
                const activeServices = response.data.filter(s => s.is_active !== false);
                
                grid.innerHTML = activeServices.map(service => this.generateServiceCard(service)).join('');
                this.attachCardListeners(activeServices);
            } else {
                // No services available
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--color-card); border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                        <h3 style="color: var(--color-text);">No services available at the moment.</h3>
                        <p style="color: var(--color-text-muted);">Please check back later or contact support.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Failed to load services:", error);
            Toast.error("Could not connect to the server. Please try again later.");
            document.getElementById('services-grid').innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 2rem;">
                    Failed to load services. Please refresh the page.
                </div>
            `;
        }
    },

    /**
     * Easter Egg: Tapping the copyright text multiple times routes to the admin login
     */
    setupEasterEgg() {
        const copyrightEl = document.getElementById('copyright-text');
        const requiredClicks = window.APP_CONFIG.adminEasterEggClicks || 5;
        let clickCount = 0;
        let clickTimer;

        if (!copyrightEl) return;

        copyrightEl.addEventListener('click', () => {
            clickCount++;
            
            // Clear the timer so fast clicks stack up
            clearTimeout(clickTimer);

            if (clickCount >= requiredClicks) {
                // Secret unlocked! Redirect to admin login
                clickCount = 0;
                window.location.hash = '#/admin/login';
            } else {
                // Reset the count if they stop clicking for 2 seconds
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 2000);
            }
        });
    },

    /**
     * Generates HTML for a single service card
     */
    generateServiceCard(service) {
        // Handle naming differences between DB (name) and UI (label) gracefully
        const title = service.label || service.name; 
        
        return `
            <div class="service-card" data-key="${service.service_key}" 
                style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card); 
                       cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; border-top: 4px solid var(--color-primary);">
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--color-primary-light); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; margin-right: 1rem;">
                        ${title.charAt(0).toUpperCase()}
                    </div>
                    <h3 style="color: var(--color-text); font-size: 1.2rem; margin: 0;">${title}</h3>
                </div>
                <p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.5; margin: 0;">
                    ${service.description || 'Apply for this service securely online.'}
                </p>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <span style="color: var(--color-accent); font-weight: bold; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Start Application &rarr;</span>
                </div>
            </div>
        `;
    },

    /**
     * Attaches click events to cards to route the user to the form wizard
     */
    attachCardListeners(services) {
        const cards = document.querySelectorAll('.service-card');
        
        cards.forEach(card => {
            // Add slight hover effect via JS (usually better in CSS, but included here for completeness)
            card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-4px)');
            card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');

            // Handle the actual selection
            card.addEventListener('click', () => {
                const serviceKey = card.getAttribute('data-key');
                
                // Find the full service object
                const selectedService = services.find(s => s.service_key === serviceKey);
                
                // Save the selection so the Form Wizard knows what to render
                sessionStorage.setItem('enolix_selected_service', JSON.stringify(selectedService));
                
                // Navigate to the form wizard step
                window.location.hash = `#/apply/${serviceKey}`;
            });
        });
    },

    /**
     * Generates placeholder skeleton cards while fetching
     */
    generateSkeletons(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card); opacity: 0.7;">
                    <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: #e0e0e0; animation: pulse 1.5s infinite;"></div>
                        <div style="height: 20px; width: 60%; background: #e0e0e0; margin-left: 1rem; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                    </div>
                    <div style="height: 14px; width: 100%; background: #e0e0e0; margin-bottom: 0.5rem; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                    <div style="height: 14px; width: 80%; background: #e0e0e0; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                </div>
            `;
        }
        // Add a quick pulse animation style to the head if it's not there
        if (!document.getElementById('skeleton-styles')) {
            const style = document.createElement('style');
            style.id = 'skeleton-styles';
            style.innerHTML = `@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`;
            document.head.appendChild(style);
        }
        return html;
    }
};