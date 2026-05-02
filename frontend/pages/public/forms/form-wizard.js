import { API } from '../../../js/api.js';
import { Toast } from '../../../js/toast.js';
import { DynamicForm } from './dynamic-form.js';
import { ProgressBar } from '../../../components/progress-bar.js';

export const FormWizard = {
    // ─── STATE MANAGEMENT ──────────────────────────────────────────────────
    state: {
        step: 1, // 1: Fill, 2: Consent, 3: Success
        service: null,
        clientInfo: { name: '', email: '', phone: '' },
        formData: {}, // Unified form data
        files: [],    // File objects
        expanded: { 0: true }, // Tracks which accordion tiles are open (Tile 0 open by default)
        consent: { processing: false, privacy: false, collection: false }
    },

    // ─── MAIN RENDER (THE SHELL) ───────────────────────────────────────────
    async render() {
        const serviceData = sessionStorage.getItem('enolix_selected_service');
        if (!serviceData) {
            window.location.hash = '#/';
            return '';
        }
        
        this.state.service = JSON.parse(serviceData);
        this.state.step = 1; 
        this.state.expanded = { 0: true };
        this.state.formData = {};
        this._normalizedGroups = null; // reset cache on each full render

        // Restore draft ONLY if it belongs to the same service
        const draft = sessionStorage.getItem('enolix_form_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                // Check draft was for the same service key
                const draftServiceKey = parsed.__service_key;
                const currentServiceKey = this.state.service.service_key || this.state.service.name;
                
                if (draftServiceKey === currentServiceKey) {
                    this.state.formData = parsed;
                    if (parsed.client_name)  this.state.clientInfo.name  = parsed.client_name;
                    if (parsed.client_phone) this.state.clientInfo.phone = parsed.client_phone;
                    if (parsed.client_email) this.state.clientInfo.email = parsed.client_email;
                } else {
                    // Different service — discard stale draft
                    sessionStorage.removeItem('enolix_form_draft');
                }
            } catch (_) {
                sessionStorage.removeItem('enolix_form_draft');
            }
        }

        return `
            <div class="wizard-container" style="max-width: 800px; margin: 3rem auto; padding: 0 1rem; min-height: 70vh;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="color: var(--color-primary); font-family: var(--font-display);">${this.state.service.name || this.state.service.label}</h1>
                    <p style="color: var(--color-text-muted);">Secure Application Portal</p>
                </div>

                <!-- Progress Bar -->
                <div id="wizard-progress-container">
                    ${ProgressBar.render(this.state.step + 1)} 
                </div>

                <!-- Dynamic Content Area -->
                <div id="wizard-content" style="background: var(--color-card); padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card);">
                    <!-- Views injected here -->
                </div>

            </div>
        `;
    },

    // ─── INITIALIZATION ────────────────────────────────────────────────────
    async init() {
        if (!this.state.service) return;
        this.updateView();
    },

    // ─── VIEW ORCHESTRATOR ─────────────────────────────────────────────────
    updateView() {
        const contentDiv = document.getElementById('wizard-content');
        const progressContainer = document.getElementById('wizard-progress-container');

        if (progressContainer) {
            progressContainer.innerHTML = ProgressBar.render(this.state.step + 1);
        }

        if (this.state.step === 1) contentDiv.innerHTML = this.getFormHTML();
        if (this.state.step === 2) contentDiv.innerHTML = this.getConsentHTML();
        if (this.state.step === 3) contentDiv.innerHTML = this.getSuccessHTML();

        this.attachListeners();
        
        // Initial status check for Step 1
        if (this.state.step === 1) {
            this.syncFormData(); // Called safely after DOM is written and listeners are attached
            this.updateTileStatus();
        }
    },

    // ─── ACCORDION DATA NORMALIZATION ──────────────────────────────────────
    getNormalizedGroups() {
        // Return cached groups if they already exist to prevent re-generating random IDs
        if (this._normalizedGroups) return this._normalizedGroups;

        const groups = [];
        
        // Always add Applicant Details as Group 0
        groups.push({
            _internal: 'applicant',
            name: 'Applicant Details',
            fields: [
                { name: 'client_name', required: true },
                { name: 'client_phone', required: true },
                { name: 'client_email', required: true }
            ]
        });

        // Reconstruct dynamic groups from the flattened fields array
        const dynamicGroups = [];
        
        if (this.state.service.fields && this.state.service.fields.length > 0) {
            const groupMap = new Map();

            this.state.service.fields.forEach(f => {
                const groupName = f.group_name || 'Service Requirements'; 
                
                if (!groupMap.has(groupName)) {
                    groupMap.set(groupName, {
                        id: 'g_' + Date.now() + Math.random(),
                        name: groupName,
                        repeatable: f.group_repeatable || false,
                        fields: []
                    });
                }
                groupMap.get(groupName).fields.push(f);
            });

            dynamicGroups.push(...Array.from(groupMap.values()));
        } else if (this.state.service.fieldGroups) {
            dynamicGroups.push(...this.state.service.fieldGroups);
        }
        
        groups.push(...dynamicGroups);
        
        // Cache the result before returning
        this._normalizedGroups = groups;
        return groups;
    },

    // ─── STEP 1: FORM UI GENERATION ────────────────────────────────────────
    getFormHTML() {
        const groups = this.getNormalizedGroups();

        // Pull saved clientInfo values for the applicant tile
        const safeVal = (v) => (v || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        let accordionHtml = groups.map((group, index) => {
            const isExpanded = !!this.state.expanded[index];

            // Render Body Content based on group type
            let bodyContent = '';
            if (group._internal === 'applicant') {
                bodyContent = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label class="form-label">Full Name *</label>
                            <input type="text" id="client_name" name="client_name" required value="${safeVal(this.state.clientInfo.name)}" class="form-input">
                        </div>
                        <div>
                            <label class="form-label">Phone Number *</label>
                            <input type="tel" id="client_phone" name="client_phone" required value="${safeVal(this.state.clientInfo.phone)}" class="form-input">
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label class="form-label">Email Address *</label>
                            <input type="email" id="client_email" name="client_email" required value="${safeVal(this.state.clientInfo.email)}" class="form-input">
                        </div>
                    </div>
                `;
            } else {
                bodyContent = DynamicForm.render(group.fields || [], this.state.formData);
                if (group.repeatable) {
                    bodyContent += `
                        <button type="button" class="btn-repeatable" onclick="window.FormWizard.addEntry('${group.id}')">
                            + Add Another ${group.name ? group.name.replace(/s$/, '') : 'Entry'}
                        </button>
                    `;
                }
            }

            return `
            <div class="form-tile" data-index="${index}">
                <div class="tile-header ${isExpanded ? 'expanded' : ''}">
                    <div class="tile-header-left">
                        <span class="status-icon">○</span>
                        <span class="tile-title">${group.name || group.label}</span>
                    </div>
                    <span class="tile-expand">${isExpanded ? '▲' : '▼'}</span>
                </div>
                
                <div class="tile-body" style="display: ${isExpanded ? 'block' : 'none'};">
                    ${bodyContent}
                </div>
            </div>
            `;
        }).join('');

        return `
            <style>
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; color: var(--color-text-muted); }
                .form-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 1rem; transition: border-color 0.2s; background: #fff;}
                .form-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.05); }
                
                .form-tile { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; background: white; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .tile-header { padding: 1.25rem 1.5rem; background: white; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; user-select: none; }
                .tile-header:hover { background: #f8fafc; }
                .tile-header.expanded { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
                .tile-header-left { display: flex; align-items: center; gap: 1rem; font-weight: bold; transition: color 0.3s; color: #64748b; }
                
                .status-icon { font-size: 1.2rem; width: 24px; text-align: center; display: inline-block; font-weight: 900; }
                .tile-title { font-size: 1.1rem; color: var(--color-text); }
                .tile-expand { color: #94a3b8; font-size: 0.9rem; transition: transform 0.3s; }
                .tile-body { padding: 1.5rem; background: white; }
                
                /* Dynamic Status Colors applied via JS */
                .form-tile.status-complete .tile-header-left { color: var(--color-success, #10b981); }
                .form-tile.status-partial .tile-header-left { color: #f59e0b; }
                
                .btn-repeatable { margin-top: 1.5rem; padding: 0.75rem 1rem; background: transparent; border: 1px dashed var(--color-primary); color: var(--color-primary); border-radius: 6px; cursor: pointer; width: 100%; font-weight: 600; transition: background 0.2s; }
                .btn-repeatable:hover { background: #f1f5f9; }
            </style>

            <form id="step1-form">
                <div id="accordion-container">
                    ${accordionHtml}
                </div>
                
                <div style="display: flex; justify-content: flex-end; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                    <button type="submit" id="btn-continue-step1" class="btn-primary" style="padding: 0.8rem 2.5rem; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        Continue to Consent &rarr;
                    </button>
                </div>
            </form>
        `;
    },

    // ─── ACCORDION LOGIC & DATA EXTRACTION ─────────────────────────────────
    
    toggleTile(index) {
        this.state.expanded[index] = !this.state.expanded[index];
        const tile = document.querySelector(`.form-tile[data-index="${index}"]`);
        if (!tile) return;

        const body = tile.querySelector('.tile-body');
        const header = tile.querySelector('.tile-header');
        const expandIcon = tile.querySelector('.tile-expand');
        
        if (this.state.expanded[index]) {
            body.style.display = 'block';
            expandIcon.textContent = '▲';
            header.classList.add('expanded');
        } else {
            body.style.display = 'none';
            expandIcon.textContent = '▼';
            header.classList.remove('expanded');
        }
    },

    syncFormData() {
        const form = document.getElementById('step1-form');
        if (!form) return;

        // Native FormData grabs every single input on the screen matching a 'name' attribute
        const fd = new FormData(form);
        const data = {};
        const files = [];

        for (let [key, value] of fd.entries()) {
            if (value instanceof File) {
                // Handle files: only save if a file was actually selected
                if (value.size > 0 && value.name) {
                    data[key] = value.name; // Put the filename in the data map so validation sees it as "filled"
                    files.push(value);      // Store the actual File object for backend submission
                }
            } else {
                // Handle text/select/checkbox inputs
                if (data[key]) {
                    // If multiple inputs have the same name (e.g. checkboxes), comma separate them
                    data[key] = `${data[key]}, ${value.trim()}`;
                } else {
                    data[key] = value.trim();
                }
            }
        }

        // Sync hardcoded applicant inputs safely
        if (data.client_name)  this.state.clientInfo.name  = data.client_name;
        if (data.client_phone) this.state.clientInfo.phone = data.client_phone;
        if (data.client_email) this.state.clientInfo.email = data.client_email;

        // Preserve previously uploaded file names that are no longer in the DOM
        Object.keys(this.state.formData).forEach(key => {
            const prevVal = this.state.formData[key];
            if (prevVal && !data[key]) {
                data[key] = prevVal;
            }
        });

        this.state.formData = data;
        if (files.length > 0) {
            this.state.files = files;
        }

        // ── Persist draft to sessionStorage so refresh doesn't lose data ──
        try {
            const draftToSave = {
                ...this.state.formData,
                __service_key: this.state.service.service_key || this.state.service.name
            };
            sessionStorage.setItem('enolix_form_draft', JSON.stringify(draftToSave));
        } catch (_) { /* quota exceeded or private browsing – silently ignore */ }
    },

    validateGroupFields(group) {
        if (!group.fields || group.fields.length === 0) return true;
        return group.fields.filter(f => f.required).every(f => {
            const val = this.state.formData[f.name];
            return val !== undefined && val !== null && val !== '';
        });
    },

    hasAnyData(group) {
        if (!group.fields || group.fields.length === 0) return false;
        return group.fields.some(f => {
            const val = this.state.formData[f.name];
            return val !== undefined && val !== null && val !== '';
        });
    },

    updateTileStatus() {
        const groups = this.getNormalizedGroups();

        groups.forEach((group, index) => {
            const tile = document.querySelector(`.form-tile[data-index="${index}"]`);
            if (!tile) return;

            const isComplete = this.validateGroupFields(group);
            const hasData = this.hasAnyData(group);
            const iconEl = tile.querySelector('.status-icon');
            
            // Reset classes
            tile.classList.remove('status-complete', 'status-partial');

            if (isComplete) {
                tile.classList.add('status-complete');
                iconEl.innerHTML = '&#10003;'; // Green Check ✓
            } else if (hasData) {
                tile.classList.add('status-partial');
                iconEl.innerHTML = '&#9888;'; // Yellow Warning ⚠
            } else {
                iconEl.innerHTML = '&#9675;'; // Grey Circle ○
            }
        });
    },

    handleFieldChange(e) {
        this.syncFormData();
        this.updateTileStatus();

        // Target the tile that triggered the event
        const tile = e.target.closest('.form-tile');
        if (!tile) return;
        const index = parseInt(tile.dataset.index);
        const groups = this.getNormalizedGroups();
        const group = groups[index];

        // Auto-Collapse Magic (Only trigger on blur/change to not interrupt typing)
        if (e.type === 'change' && this.validateGroupFields(group)) {
            setTimeout(() => {
                if (this.state.expanded[index]) {
                    this.toggleTile(index);
                    
                    // Auto-expand the next incomplete tile
                    const nextIndex = index + 1;
                    if (nextIndex < groups.length && !this.validateGroupFields(groups[nextIndex]) && !this.state.expanded[nextIndex]) {
                        this.toggleTile(nextIndex);
                        document.querySelector(`.form-tile[data-index="${nextIndex}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 500); 
        }
    },

    // ─── STEP 2: CONSENT HTML ──────────────────────────────────────────────
    getConsentHTML() {
        return `
            <form id="step2-form">
                <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: var(--color-text);">Data Privacy & Consent</h3>
                <p style="color: var(--color-text-muted); margin-bottom: 2rem; line-height: 1.6;">
                    ${window.APP_CONFIG?.privacy?.summary || 'Please review and accept our terms before submitting your secure application.'}
                </p>

                <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 2rem;">
                    <label style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; cursor: pointer;">
                        <input type="checkbox" id="consent_privacy" required style="margin-top: 0.3rem; width: 18px; height: 18px; accent-color: var(--color-primary);">
                        <span style="font-size: 0.95rem; color: var(--color-text);">I agree to the Privacy Policy and terms of service. *</span>
                    </label>

                    <label style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; cursor: pointer;">
                        <input type="checkbox" id="consent_processing" required style="margin-top: 0.3rem; width: 18px; height: 18px; accent-color: var(--color-primary);">
                        <span style="font-size: 0.95rem; color: var(--color-text);">I consent to Enolix processing my personal data for the purpose of this application. *</span>
                    </label>

                    <label style="display: flex; align-items: flex-start; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="consent_collection" required style="margin-top: 0.3rem; width: 18px; height: 18px; accent-color: var(--color-primary);">
                        <span style="font-size: 0.95rem; color: var(--color-text);">I confirm that all provided information and documents are authentic and accurate. *</span>
                    </label>
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <button type="button" id="btn-back" style="padding: 0.75rem 2rem; background: #e2e8f0; color: var(--color-text); border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        &larr; Back
                    </button>
                    <button type="submit" id="btn-submit-final" style="padding: 0.75rem 2rem; background: var(--color-success, #10b981); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
                        Submit Securely
                    </button>
                </div>
            </form>
        `;
    },

    // ─── STEP 3: SUCCESS HTML ──────────────────────────────────────────────
    getSuccessHTML() {
        return `
            <div style="text-align: center; padding: 2rem 0;">
                <div style="width: 80px; height: 80px; background: var(--color-success, #10b981); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 1.5rem;">
                    ✓
                </div>
                <h2 style="color: var(--color-text); font-family: var(--font-display); margin-bottom: 1rem;">Application Submitted!</h2>
                <p style="color: var(--color-text-muted); margin-bottom: 2rem;">We have successfully received your secure application.</p>
                
                <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 2px dashed #cbd5e1; display: inline-block; margin-bottom: 2rem;">
                    <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Your Reference Number</p>
                    <h3 style="font-family: var(--font-mono); font-size: 1.5rem; color: var(--color-primary); letter-spacing: 2px; margin: 0;">
                        ${this.state.referenceId}
                    </h3>
                </div>

                <p style="font-size: 0.9rem; color: var(--color-text-muted);">Please save this number. We have also sent a confirmation email to <strong>${this.state.clientInfo.email}</strong>.</p>
                
                <div style="margin-top: 3rem;">
                    <a href="#/" style="padding: 0.75rem 2rem; background: var(--color-primary); color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Return Home</a>
                </div>
            </div>
        `;
    },

    // ─── EVENT LISTENERS & LOGIC ───────────────────────────────────────────
    attachListeners() {
        // STEP 1 HANDLER
        if (this.state.step === 1) {
            const form1 = document.getElementById('step1-form');
            const accordion = document.getElementById('accordion-container');

            if (accordion) {
                // Handle Tile Header clicks
                accordion.addEventListener('click', (e) => {
                    const header = e.target.closest('.tile-header');
                    if (header) {
                        const tile = header.closest('.form-tile');
                        const index = parseInt(tile.dataset.index);
                        this.toggleTile(index);
                    }
                });

                // Handle Form Input logic
                accordion.addEventListener('input', (e) => {
                    this.syncFormData();
                    this.updateTileStatus();
                });

                // Handle Auto-Collapse trigger
                accordion.addEventListener('change', (e) => {
                    this.handleFieldChange(e);
                });
            }

            form1.addEventListener('submit', (e) => {
                e.preventDefault();
                this.syncFormData(); 
                
                const groups = this.getNormalizedGroups();
                const allValid = groups.every(g => this.validateGroupFields(g));
                
                if (!allValid) {
                    Toast.error("Please complete all required fields in all sections.");
                    
                    // Auto-expand and scroll to the first incomplete tile
                    const firstIncomplete = groups.findIndex(g => !this.validateGroupFields(g));
                    if (firstIncomplete !== -1) {
                        if (!this.state.expanded[firstIncomplete]) this.toggleTile(firstIncomplete);
                        document.querySelector(`.form-tile[data-index="${firstIncomplete}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                // Transition to Step 2
                this.state.step = 2;
                this.updateView();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // STEP 2 HANDLER
        if (this.state.step === 2) {
            const btnBack = document.getElementById('btn-back');
            const form2 = document.getElementById('step2-form');
            const submitBtn = document.getElementById('btn-submit-final');

            btnBack.addEventListener('click', () => {
                this.state.step = 1;
                this.updateView();
            });

            form2.addEventListener('submit', async (e) => {
                e.preventDefault();

                this.state.consent = {
                    agreed_to_privacy:  document.getElementById('consent_privacy').checked,
                    agreed_to_terms:    document.getElementById('consent_processing').checked  // maps to "agree to process"
                };

                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = 'Encrypting & Submitting...';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';

                await this.submitToServer(submitBtn, originalText);
            });
        }
    },

    // ─── BACKEND API INTEGRATION ───────────────────────────────────────────
    async submitToServer(submitBtn, originalText) {
        try {
            const payload = new FormData();

            // Append standard top-level tracking fields
            payload.append('client_name', this.state.clientInfo.name);
            payload.append('client_email', this.state.clientInfo.email);
            payload.append('client_phone', this.state.clientInfo.phone);
            payload.append('service_type', this.state.service.service_key || this.state.service.name);

            // Append the fully extracted dynamic JSON (includes custom groups)
            payload.append('form_data', JSON.stringify(this.state.formData));
            payload.append('consent', JSON.stringify(this.state.consent));

            // Append File payloads
            this.state.files.forEach(file => {
                payload.append('documents', file); 
            });

            const response = await API.createSubmission(payload);

            if (response.success) {
                this.state.referenceId = response.data.reference_id || 'ENOLIX-SUCCESS';
                this.state.step = 3;
                this.updateView();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Clear persisted draft on successful submission
                sessionStorage.removeItem('enolix_form_draft');
                sessionStorage.removeItem('enolix_selected_service');
            } else {
                Toast.error(response.message || 'Submission failed. Please try again.');
                this.resetSubmitButton(submitBtn, originalText);
            }
        } catch (error) {
            console.error("Submission Error:", error);
            Toast.error('Network error. Please check your connection and try again.');
            this.resetSubmitButton(submitBtn, originalText);
        }
    },

    resetSubmitButton(btn, text) {
        btn.innerHTML = text;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
};