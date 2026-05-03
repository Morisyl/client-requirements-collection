import { API } from '../../js/api.js';
import { Toast } from '../../js/toast.js';

export const SubmissionsList = {
    // Internal state for tracking current filters and pagination
    state: {
        page: 1,
        limit: 10,
        status: '',       // empty string means 'All'
        search: '',
        service_type: ''
    },

    /**
     * Renders the shell of the Submissions List view
     */
    async render() {
        return `
            <div class="submissions-module">
                
                <!-- Filters & Search Bar -->
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                    
                    <div style="flex: 1; min-width: 250px;">
                        <input type="text" id="sub-search" placeholder="Search by name, email, or Ref ID..." 
                               style="width: 100%; padding: 0.6rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit;">
                    </div>

                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <select id="sub-status-filter" style="padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; background: white; min-width: 150px;">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <!-- Refresh Button -->
                        <button id="btn-refresh" style="padding: 0.6rem 1rem; background: #e2e8f0; color: var(--color-text); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            ↻ Refresh
                        </button>
                    </div>
                </div>

                <!-- Status Summary Pills (Optional UI enhancement) -->
                <div id="status-summary-container" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem;">
                    <!-- Injected dynamically if backend supports counts, or used as visual filters -->
                </div>

                <!-- Data Table -->
                <div style="background: var(--color-card); border-radius: var(--border-radius); box-shadow: var(--shadow-card); overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <tr>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Ref ID</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Client</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Service</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Date</th>
                                    <th style="padding: 1rem; color: var(--color-text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">Status</th>
                                </tr>
                            </thead>
                            <tbody id="submissions-tbody">
                                <!-- Rows injected here -->
                                <tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Loading submissions...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination Controls -->
                    <div id="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-top: 1px solid #e2e8f0; background: #f8fafc;">
                        <span id="page-info" style="font-size: 0.9rem; color: var(--color-text-muted);">Showing page 1</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="btn-prev" disabled style="padding: 0.4rem 0.8rem; background: white; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">&larr; Prev</button>
                            <button id="btn-next" disabled style="padding: 0.4rem 0.8rem; background: white; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">Next &rarr;</button>
                        </div>
                    </div>
                </div>

            </div>

            <style>
                .sub-row { transition: background-color 0.2s; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
                .sub-row:hover { background-color: #f8fafc; }
                
                /* Status Badges */
                .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
                .badge-pending { background: #fef3c7; color: #d97706; }
                .badge-in_review { background: #e0f2fe; color: #0284c7; }
                .badge-completed { background: #dcfce3; color: #16a34a; }
                .badge-rejected { background: #fee2e2; color: #dc2626; }
            </style>
        `;
    },

    /**
     * Initializes logic and event listeners
     */
    async init() {
        this.cacheDOM();
        this.attachListeners();
        await this.loadData();
    },

    cacheDOM() {
        this.searchInput = document.getElementById('sub-search');
        this.statusSelect = document.getElementById('sub-status-filter');
        this.tbody = document.getElementById('submissions-tbody');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.pageInfo = document.getElementById('page-info');
    },

    attachListeners() {
        // Debounced Search (waits 500ms after user stops typing before calling API)
        let debounceTimer;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.state.search = e.target.value;
                this.state.page = 1; // Reset to page 1 on new search
                this.loadData();
            }, 500);
        });

        // Status Filter Change
        this.statusSelect.addEventListener('change', (e) => {
            this.state.status = e.target.value;
            this.state.page = 1;
            this.loadData();
        });

        // Refresh Button
        document.getElementById('btn-refresh').addEventListener('click', () => {
            this.loadData();
        });

        // Pagination Previous
        this.btnPrev.addEventListener('click', () => {
            if (this.state.page > 1) {
                this.state.page--;
                this.loadData();
            }
        });

        // Pagination Next
        this.btnNext.addEventListener('click', () => {
            this.state.page++;
            this.loadData();
        });

        // Event Delegation for clicking a row to view details
        this.tbody.addEventListener('click', (e) => {
            tbody.addEventListener('click', (e) => {
                // Check if they clicked the view button (or an icon inside it)
                const viewBtn = e.target.closest('.view-btn'); 
                
                if (viewBtn) {
                    // Read the ID we hid inside the button's HTML
                    const submissionId = viewBtn.getAttribute('data-id'); 
                    
                    // Push the actual string ID to the URL!
                    window.location.hash = `#/admin/submissions/${submissionId}`; 
                }
            });
        });
    },

    /**
     * Fetches data from API based on current state and updates the table
     */
    async loadData() {
        // Show loading state
        this.tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--color-text-muted);">Fetching submissions...</td></tr>`;

        try {
            // Build the query parameters object to pass to your API module
            const params = {
                page: this.state.page,
                limit: this.state.limit
            };
            
            if (this.state.status) params.status = this.state.status;
            if (this.state.search) params.search = this.state.search;

            const response = await API.getSubmissions(params);

            if (response.success) {
                this.renderTable(response.data);
                this.updatePagination(response.meta);
            } else {
                throw new Error(response.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error("Load Submissions Error:", error);
            Toast.error("Failed to load submissions.");
            this.tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-danger);">Error loading data.</td></tr>`;
        }
    },

    /**
     * Renders the array of submission objects into table rows
     */
    renderTable(submissions) {
        if (!submissions || submissions.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--color-text-muted);">No submissions found matching your criteria.</td></tr>`;
            return;
        }

        this.tbody.innerHTML = submissions.map(sub => {
            const date = new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            
            // Generate a safe display status and badge class
            const statusDisplay = sub.status.replace('_', ' ');
            const badgeClass = `badge-${sub.status}`;

            return `
                <tr class="sub-row" data-id="${sub.id}">
                    <td style="padding: 1rem; font-family: var(--font-mono); font-size: 0.9rem; font-weight: 600; color: var(--color-primary);">
                        ${sub.reference_number || sub.id.substring(0,8).toUpperCase()}
                    </td>
                    <td style="padding: 1rem;">
                        <div style="font-weight: 500; color: var(--color-text);">${sub.client_name}</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted);">${sub.client_email}</div>
                    </td>
                    <td style="padding: 1rem; font-size: 0.9rem; color: var(--color-text);">
                        ${sub.service_type.replace(/-/g, ' ').toUpperCase()}
                    </td>
                    <td style="padding: 1rem; font-size: 0.9rem; color: var(--color-text-muted);">
                        ${date}
                    </td>
                    <td style="padding: 1rem;">
                        <span class="badge ${badgeClass}">${statusDisplay}</span>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Updates the pagination UI based on backend meta data
     */
    updatePagination(meta) {
        if (!meta) return;

        const totalPages = meta.total_pages || 1;
        const totalItems = meta.total || 0;

        this.pageInfo.innerHTML = `Showing page <strong>${this.state.page}</strong> of <strong>${totalPages}</strong> (${totalItems} total)`;

        this.btnPrev.disabled = this.state.page <= 1;
        this.btnNext.disabled = this.state.page >= totalPages;
    }
};