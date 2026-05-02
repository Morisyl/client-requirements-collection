import { API } from '../../js/api.js';
import { Toast } from '../../js/toast.js';

export const ServicesList = {
    state: {
        services: []
    },

    /**
     * Renders the shell of the Services List view
     */
    async render() {
        return `
            <div class="services-list-module">
                
                <!-- Header & Actions -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                    <div>
                        <h2 style="margin: 0; color: var(--color-text); font-family: var(--font-display);">Service Builder</h2>
                        <p style="margin: 0.2rem 0 0 0; color: var(--color-text-muted); font-size: 0.9rem;">Manage dynamic application forms and services.</p>
                    </div>
                    <button onclick="window.location.hash='#/admin/services/new'" style="padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
                        Create New Service
                    </button>
                </div>

                <!-- Data Table -->
                <div style="background: var(--color-card); border-radius: var(--border-radius); box-shadow: var(--shadow-card); overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <tr>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Service Name</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">System Key</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Fields</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Status</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="services-tbody">
                                <tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--color-text-muted);">Loading services...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <style>
                .srv-row { transition: background-color 0.2s; border-bottom: 1px solid #f1f5f9; }
                .srv-row:hover { background-color: #f8fafc; }
                
                /* Action Buttons */
                .btn-action { background: none; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0.4rem 0.75rem; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; color: var(--color-text); margin-left: 0.5rem; }
                .btn-action:hover { background: #e2e8f0; }
                .btn-edit:hover { border-color: var(--color-primary); color: var(--color-primary); }
                .btn-delete { color: var(--color-danger); border-color: #fca5a5; }
                .btn-delete:hover { background: #fee2e2; border-color: var(--color-danger); }
                
                /* Status Badge */
                .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
                .badge-active { background: #dcfce3; color: #16a34a; }
                .badge-inactive { background: #f1f5f9; color: #64748b; }
            </style>
        `;
    },

    /**
     * Initializes logic and event listeners
     */
    async init() {
        this.tbody = document.getElementById('services-tbody');
        this.attachListeners();
        await this.loadData();
    },

    /**
     * Fetches the services from the backend
     */
    async loadData() {
        try {
            // Note: Use a backend route that fetches ALL services (even inactive ones) for the admin
            const response = await API.getServices({ admin: true });
            if (response.success) {
                this.state.services = response.data;
                this.renderTable();
            } else {
                throw new Error('Failed to fetch services');
            }
        } catch (error) {
            console.error("Load Services Error:", error);
            Toast.error("Failed to load services.");
            this.tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-danger);">Error loading data.</td></tr>`;
        }
    },

    /**
     * Renders the HTML table rows
     */
    renderTable() {
        if (this.state.services.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem;">
                        <p style="color: var(--color-text-muted); margin-bottom: 1rem;">No services created yet.</p>
                        <button onclick="window.location.hash='#/admin/services/new'" style="padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Create First Service</button>
                    </td>
                </tr>`;
            return;
        }

        this.tbody.innerHTML = this.state.services.map(srv => {
            const isActive = srv.is_active !== false;
            const badgeClass = isActive ? 'badge-active' : 'badge-inactive';
            const badgeText = isActive ? 'Active (Public)' : 'Inactive (Hidden)';
            
            // Handle schema variations (fields vs required_fields)
            const fieldsCount = (srv.fields || srv.required_fields || []).length;

            return `
                <tr class="srv-row" data-id="${srv.id}">
                    <td style="padding: 1rem;">
                        <div style="font-weight: 600; color: var(--color-text);">${srv.name || srv.label}</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${srv.description || 'No description'}
                        </div>
                    </td>
                    <td style="padding: 1rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-primary-light);">
                        ${srv.service_key}
                    </td>
                    <td style="padding: 1rem; font-size: 0.9rem; color: var(--color-text-muted);">
                        ${fieldsCount} dynamic fields
                    </td>
                    <td style="padding: 1rem;">
                        <button type="button" class="btn-toggle-status" data-id="${srv.id}" data-active="${isActive}" style="background: none; border: none; padding: 0; cursor: pointer; text-align: left;" title="Click to toggle status">
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </button>
                    </td>
                    <td style="padding: 1rem; text-align: right;">
                        <button type="button" class="btn-action btn-edit" data-id="${srv.id}">Edit</button>
                        <button type="button" class="btn-action btn-delete" data-id="${srv.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Attaches event listeners via Event Delegation
     */
    attachListeners() {
        this.tbody.addEventListener('click', async (e) => {
            
            // 1. EDIT ACTION
            if (e.target.classList.contains('btn-edit')) {
                const id = e.target.getAttribute('data-id');
                window.location.hash = `#/admin/services/${id}`;
            }

            // 2. TOGGLE STATUS ACTION
            const toggleBtn = e.target.closest('.btn-toggle-status');
            if (toggleBtn) {
                const id = toggleBtn.getAttribute('data-id');
                const currentlyActive = toggleBtn.getAttribute('data-active') === 'true';
                const newStatus = !currentlyActive;

                try {
                    // Update in backend
                    await API.updateService(id, { is_active: newStatus });
                    Toast.success(`Service is now ${newStatus ? 'Active' : 'Inactive'}`);
                    
                    // Update local state and re-render
                    const srv = this.state.services.find(s => s.id === id);
                    if (srv) srv.is_active = newStatus;
                    this.renderTable();
                } catch (err) {
                    Toast.error('Failed to update status.');
                }
            }

            // 3. DELETE ACTION
            if (e.target.classList.contains('btn-delete')) {
                const id = e.target.getAttribute('data-id');
                const srv = this.state.services.find(s => s.id === id);
                
                if (confirm(`Are you absolutely sure you want to delete "${srv.name}"?\n\nThis will permanently remove the form definition. (Existing submissions will not be deleted).`)) {
                    
                    const originalText = e.target.textContent;
                    e.target.textContent = '...';
                    e.target.disabled = true;

                    try {
                        await API.deleteService(id);
                        Toast.success('Service deleted successfully.');
                        
                        // Remove from local state and re-render
                        this.state.services = this.state.services.filter(s => s.id !== id);
                        this.renderTable();
                    } catch (err) {
                        Toast.error('Failed to delete service.');
                        e.target.textContent = originalText;
                        e.target.disabled = false;
                    }
                }
            }
        });
    }
};