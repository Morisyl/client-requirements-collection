import { API } from '../../js/api.js';
import { Toast } from '../../js/toast.js';
import { TagManager } from '../../components/tag-manager.js';
import { StatusSelect } from '../../components/status-select.js';

export const SubmissionDetail = {
    // Stores the current submission data
    state: {
        submission: null,
        id: null
    },

    /**
     * Maps database status values to UI colours
     */
    getStatusColor(status) {
        const colors = {
            'pending': 'var(--color-warning, #d97706)',     // Amber
            'in_review': '#0284c7',                         // Blue
            'completed': 'var(--color-success, #16a34a)',   // Green
            'rejected': 'var(--color-danger, #dc2626)'      // Red
        };
        return colors[status] || '#6b7280';
    },

    /**
     * Recursively parses dynamic JSON form data into a clean HTML layout
     */
    renderFormData(data) {
        if (data === null || data === undefined || data === '') return '<span style="color: #9ca3af;">N/A</span>';
        
        if (typeof data !== 'object') {
            return `<span style="color: var(--color-text);">${data}</span>`;
        }

        if (Array.isArray(data)) {
            if (data.length === 0) return '<span style="color: #9ca3af;">Empty array</span>';
            return `
                <div style="padding-left: 1rem; border-left: 3px solid #e2e8f0; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    ${data.map((item, index) => `
                        <div style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; border: 1px solid #f1f5f9;">
                            <strong style="color: var(--color-primary-light); font-size: 0.8rem; text-transform: uppercase;">Item ${index + 1}</strong>
                            <div style="margin-top: 0.5rem;">${this.renderFormData(item)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // It's an Object
        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tbody>
                    ${Object.entries(data).map(([key, value]) => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 0.5rem 0; width: 35%; font-weight: 500; color: var(--color-text-muted); text-transform: capitalize;">
                                ${key.replace(/_/g, ' ')}
                            </td>
                            <td style="padding: 0.5rem 0; word-break: break-word;">
                                ${this.renderFormData(value)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Renders the shell and injects dynamic components
     */
    async render({ id } = {}) {
        this.state.id = id;

        return `
            <div class="submission-detail-module" style="padding-bottom: 4rem;">
                
                <!-- Header Actions -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <button onclick="window.location.hash='#/admin'" style="padding: 0.5rem 1rem; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        &larr; Back to List
                    </button>
                    <div id="sd-header-ref" style="font-family: var(--font-mono); font-weight: bold; font-size: 1.2rem; color: var(--color-primary);">
                        Loading...
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
                    
                    <!-- LEFT COLUMN: Data View -->
                    <div style="display: flex; flex-direction: column; gap: 2rem;">
                        
                        <!-- Client Info Card -->
                        <div class="card" style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                            <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; color: var(--color-text);">Applicant Details</h3>
                            <div id="sd-client-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div><p style="margin:0; font-size:0.85rem; color:var(--color-text-muted);">Name</p><p id="sd-client-name" style="margin:0; font-weight:500;"></p></div>
                                <div><p style="margin:0; font-size:0.85rem; color:var(--color-text-muted);">Email</p><p id="sd-client-email" style="margin:0; font-weight:500;"></p></div>
                                <div><p style="margin:0; font-size:0.85rem; color:var(--color-text-muted);">Phone</p><p id="sd-client-phone" style="margin:0; font-weight:500;"></p></div>
                                <div><p style="margin:0; font-size:0.85rem; color:var(--color-text-muted);">Service Type</p><p id="sd-service-type" style="margin:0; font-weight:500;"></p></div>
                            </div>
                        </div>

                        <!-- Form Data Card -->
                        <div class="card" style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                            <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; color: var(--color-text);">Submitted Data</h3>
                            <div id="sd-form-data">Loading data...</div>
                        </div>

                        <!-- Consent Records -->
                        <div class="card" style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                            <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; color: var(--color-text);">Consent & Privacy</h3>
                            <div id="sd-consent-data" style="font-size: 0.9rem;"></div>
                        </div>

                    </div>

                    <!-- RIGHT COLUMN: Admin Actions -->
                    <div style="display: flex; flex-direction: column; gap: 2rem;">
                        
                        <!-- Status & Tags Control -->
                        <div class="card" style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                            <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; color: var(--color-text);">Workflow Status</h3>
                            
                            <div style="margin-bottom: 1.5rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-text-muted);">Current Status</label>
                                <div id="sd-status-container" style="margin-bottom: 1.5rem;">
                                    <div style="padding: 1rem; color: var(--color-text-muted);">Loading status...</div>
                                </div>
                            </div>

                            <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-text-muted);">Tags</label>
                                <div id="sd-tags-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;"></div>
                                
                                <div style="display: flex; gap: 0.5rem;">
                                    <input type="text" id="sd-new-tag-input" placeholder="Add tag..." style="flex: 1; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem;">
                                    
                                </div>
                            </div>
                        </div>

                        <!-- Documents Section -->
                        <div class="card" style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                            <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; color: var(--color-text);">Attached Documents</h3>
                            <div id="sd-documents-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <p style="font-size: 0.85rem; color: var(--color-text-muted);">No documents attached.</p>
                            </div>
                        </div>

                        <!-- Admin Notes (Chronological) -->
                        <div class="card" style="background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                            <h3 style="margin-bottom: 1rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; color: var(--color-text);">Internal Notes</h3>
                            
                            <div id="sd-notes-container" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; padding-right: 0.5rem;">
                                <!-- Notes injected here -->
                            </div>

                            <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                                <textarea id="sd-new-note" rows="3" placeholder="Add an internal note..." style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit; margin-bottom: 0.5rem; font-size: 0.9rem;"></textarea>
                                <button id="btn-add-note" style="width: 100%; padding: 0.6rem; background: var(--color-primary-light); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                                    Save Note
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            <style>
                /* Tag Pill Styles */
                .admin-tag { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: bold; color: white; }
                .admin-tag button { background: none; border: none; color: white; cursor: pointer; font-size: 0.9rem; padding: 0; line-height: 1; opacity: 0.8; }
                .admin-tag button:hover { opacity: 1; }
                
                /* Note Styles */
                .note-bubble { background: #f8fafc; padding: 0.75rem; border-radius: 8px; border-left: 3px solid var(--color-accent); }
                .note-meta { font-size: 0.7rem; color: var(--color-text-muted); margin-bottom: 0.3rem; display: flex; justify-content: space-between; }
                
                /* Doc Download Button */
                .doc-btn { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-decoration: none; color: var(--color-text); font-size: 0.9rem; transition: background 0.2s; }
                .doc-btn:hover { background: #e0f2fe; border-color: #bae6fd; }
            </style>
        `;
    },

    /**
     * Fetch the data and attach listeners
     */
    async init() {
        if (!this.state.id) return;

        try {
            // Note: Ensure `getSubmission: (id) => request('GET', '/api/admin/submissions/' + id)` 
            // is added to your js/api.js file!
            const response = await API.getSubmission(this.state.id);
            
            if (response.success) {
                this.state.submission = response.data;
                this.populateUI();
                this.attachListeners();
            } else {
                Toast.error('Failed to load submission details');
            }
        } catch (error) {
            console.error('Submission Fetch Error:', error);
            Toast.error('Could not connect to the server.');
        }
    },

    populateUI() {
        const sub = this.state.submission;

        // 1. Header & Client Info
        document.getElementById('sd-header-ref').textContent = sub.reference_number || sub.id;
        document.getElementById('sd-client-name').textContent = sub.client_name;
        document.getElementById('sd-client-email').textContent = sub.client_email;
        document.getElementById('sd-client-phone').textContent = sub.client_phone;
        document.getElementById('sd-service-type').textContent = sub.service_type.replace(/-/g, ' ').toUpperCase();

        // 2. Form Data
        const formContainer = document.getElementById('sd-form-data');
        formContainer.innerHTML = this.renderFormData(sub.form_data);

        // 3. Consent Data
        const consentContainer = document.getElementById('sd-consent-data');
        if (sub.consent) {
            consentContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: ${sub.consent.privacy ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: bold;">${sub.consent.privacy ? '✓' : '✗'}</span>
                        <span>Privacy Policy Agreed</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: ${sub.consent.processing ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: bold;">${sub.consent.processing ? '✓' : '✗'}</span>
                        <span>Data Processing Consent</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: ${sub.consent.collection ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: bold;">${sub.consent.collection ? '✓' : '✗'}</span>
                        <span>Information Accuracy Confirmed</span>
                    </div>
                </div>
            `;
        } else {
            consentContainer.innerHTML = '<span style="color: var(--color-text-muted);">No consent data recorded.</span>';
        }

        // 4. Status Selector Setup
        const statusSelect = document.getElementById('sd-status-select');
        statusSelect.value = sub.status;
        statusSelect.style.borderColor = this.getStatusColor(sub.status);
        statusSelect.style.color = this.getStatusColor(sub.status);

        // 5. Render Tags, Docs, and Notes
        this.renderTags();
        this.renderDocuments();
        this.renderNotes();

        // Inject and initialize the State Machine Status component
        const statusContainer = document.getElementById('sd-status-container');
        statusContainer.innerHTML = `
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-text-muted);">Current Status</label>
            ${StatusSelect.render(this.state.id, this.state.submission.status)}
        `;
        StatusSelect.init(this.state.id, (newStatus) => {
            // Optional callback: Update the submission state in memory if needed
            this.state.submission.status = newStatus;
        });
    },

    renderTags() {
        // Target the parent wrapper of the old tags container
        const oldContainer = document.getElementById('sd-tags-container');
        if (!oldContainer) return;
        
        const parentWrapper = oldContainer.parentElement;

        // Inject the new TagManager HTML
        parentWrapper.innerHTML = `
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-text-muted);">Tags</label>
            ${TagManager.render(this.state.id, this.state.submission.tags)}
        `;

        // Initialize the component's interactive logic
        TagManager.init(this.state.id);
    },

    renderDocuments() {
        const container = document.getElementById('sd-documents-container');
        const docs = this.state.submission.documents || [];

        if (docs.length === 0) {
            container.innerHTML = '<p style="font-size: 0.85rem; color: var(--color-text-muted);">No documents attached.</p>';
            return;
        }

        container.innerHTML = docs.map(doc => {
            // Proxies download via Express backend to utilize Supabase signed URLs
            const downloadUrl = `${window.APP_CONFIG.api.baseUrl}/api/admin/submissions/${this.state.id}/documents/${doc.id}`;
            
            return `
                <a href="${downloadUrl}" target="_blank" class="doc-btn">
                    <span style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                        ${doc.file_name}
                    </span>
                    <span style="background: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; border: 1px solid #cbd5e1;">Download</span>
                </a>
            `;
        }).join('');
    },

    renderNotes() {
        const container = document.getElementById('sd-notes-container');
        const notes = this.state.submission.admin_notes || [];

        if (notes.length === 0) {
            container.innerHTML = '<p style="font-size: 0.85rem; color: var(--color-text-muted); text-align: center; margin-top: 1rem;">No internal notes yet.</p>';
            return;
        }

        // Assume notes is an array of objects: { text: "...", author: "admin@...", timestamp: "..." }
        // If your backend just stores a string array, map it accordingly.
        container.innerHTML = notes.map(note => {
            // Handle both object schema and simple string schema
            const text = typeof note === 'string' ? note : note.text;
            const author = typeof note === 'string' ? 'Admin' : note.author;
            const time = typeof note === 'string' ? '' : new Date(note.timestamp).toLocaleString();

            return `
                <div class="note-bubble">
                    <div class="note-meta">
                        <strong>${author}</strong>
                        <span>${time}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--color-text); white-space: pre-wrap;">${text}</div>
                </div>
            `;
        }).join('');
        
        // Auto-scroll to bottom of notes
        container.scrollTop = container.scrollHeight;
    },

    attachListeners() {
        const id = this.state.id;

        // 1. Status Change
        const statusSelect = document.getElementById('sd-status-select');
        statusSelect.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            statusSelect.style.borderColor = this.getStatusColor(newStatus);
            statusSelect.style.color = this.getStatusColor(newStatus);

            try {
                await API.updateStatus(id, newStatus);
                Toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
                this.state.submission.status = newStatus;
            } catch (err) {
                Toast.error('Failed to update status');
                // Revert UI
                statusSelect.value = this.state.submission.status;
                statusSelect.style.borderColor = this.getStatusColor(this.state.submission.status);
                statusSelect.style.color = this.getStatusColor(this.state.submission.status);
            }
        });

        // 2. Add Note
        document.getElementById('btn-add-note').addEventListener('click', async () => {
            const textarea = document.getElementById('sd-new-note');
            const noteText = textarea.value.trim();
            if (!noteText) return;

            try {
                // If backend requires note as { note: string }, ensure api.js sends correctly
                const response = await API.saveNotes(id, noteText);
                if (response.success) {
                    // Refresh data from backend to ensure accurate author/timestamp
                    const updatedSub = await API.getSubmission(id);
                    this.state.submission = updatedSub.data;
                    this.renderNotes();
                    textarea.value = '';
                    Toast.success('Note added');
                }
            } catch (err) {
                Toast.error('Failed to add note');
            }
        });

        
    }
};