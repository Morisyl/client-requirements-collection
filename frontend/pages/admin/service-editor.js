import { API } from '../../js/api.js';
import { Toast } from '../../js/toast.js';
// Import SortableJS directly from CDN for zero-build drag-and-drop
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/+esm';

export const ServiceEditor = {
    // ─── REACTIVE STATE ────────────────────────────────────────────────────
    state: {
        isEditing: false,
        id: null,
        basicInfo: {
            label: '',
            description: '',
            icon: 'building',
            is_active: true
        },
        fieldGroups: [] // Array of { id, name, repeatable, isCollapsed, fields: [] }
    },
    
    // Internal tracker for Sortable instances to prevent memory leaks
    sortableInstances: [], 

    // ─── MAIN RENDER SHELL ─────────────────────────────────────────────────
    async render(params = {}) {
        const serviceId = params?.id || null;
        this.state.isEditing = !!serviceId;
        this.state.id = serviceId;

        return `
            <div class="service-editor-module" style="max-width: 1000px; margin: 0 auto; padding-bottom: 5rem;">
                
                <!-- Sticky Header Actions -->
                <div class="editor-sticky-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button onclick="window.location.hash='#/admin/services'" class="btn-secondary">
                            &larr; Back
                        </button>
                        <h2 style="margin: 0; font-family: var(--font-display);">${this.state.isEditing ? 'Edit Service' : 'New Service Builder'}</h2>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button id="btn-save-service" class="btn-primary">Save Service Definition</button>
                    </div>
                </div>

                <!-- SECTION 1: BASIC SERVICE INFO -->
                <div class="editor-section card">
                    <h3>Service Information</h3>
                    <div class="grid-form">
                        <div class="form-group">
                            <label>Display Name *</label>
                            <input type="text" id="se-label" name="label" placeholder="e.g., Private Company Registration" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Service Icon</label>
                            <select id="se-icon" name="icon" class="form-input">
                                <option value="building">Building (Company)</option>
                                <option value="briefcase">Briefcase (Business)</option>
                                <option value="document">Document</option>
                                <option value="people">People (AGPO)</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label>Description for Clients</label>
                            <textarea id="se-description" name="description" placeholder="Brief description for clients..." class="form-input" rows="2"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="se-active" name="is_active" checked style="width: 18px; height: 18px; accent-color: var(--color-primary);" />
                                <span>Active (visible to clients)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- SECTION 2: FIELD GROUPS BUILDER -->
                <div class="editor-section card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">
                        <h3 style="margin: 0; border: none; padding: 0;">Data Collection Sections</h3>
                        <button id="btn-add-group" class="btn-outline">+ Add Section</button>
                    </div>
                    
                    <div id="field-groups-container">
                        <!-- Dynamically rendered field groups go here -->
                    </div>
                </div>

                <!-- SECTION 3: PREVIEW -->
                <div class="editor-section card" style="text-align: center; padding: 2rem;">
                    <h3 style="margin-bottom: 1rem; border: none;">Preview</h3>
                    <p style="color: var(--color-text-muted); margin-bottom: 1rem;">See how this form will appear to your clients.</p>
                    <button id="btn-show-preview" class="btn-accent" style="padding: 0.75rem 2rem; font-size: 1rem;">Preview Form</button>
                </div>

                <!-- PREVIEW MODAL (Hidden by default) -->
                <div id="preview-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 style="margin: 0;">Form Preview</h3>
                            <button id="close-preview" class="btn-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                        </div>
                        <div id="preview-form-body" class="modal-body">
                            <!-- Live form preview injected here -->
                        </div>
                    </div>
                </div>

            </div>

            <style>
                .editor-sticky-header { position: sticky; top: 0; background: var(--color-background); padding: 1rem 0; display: flex; justify-content: space-between; align-items: center; z-index: 100; border-bottom: 1px solid #e2e8f0; margin-bottom: 2rem; }
                .editor-section { background: var(--color-card); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow-card); margin-bottom: 2rem; }
                .editor-section h3 { margin-top: 0; margin-bottom: 1.5rem; color: var(--color-primary); font-size: 1.1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; }
                
                .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .full-width { grid-column: span 2; }
                .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--color-text-muted); }
                .form-input { width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; transition: border-color 0.2s; }
                .form-input:focus { outline: none; border-color: var(--color-primary); }
                .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; color: var(--color-text); }
                
                /* Field Group Cards */
                .field-group-card { border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; background: #f8fafc; transition: box-shadow 0.2s; }
                .field-group-card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .group-header { background: #e2e8f0; padding: 0.75rem 1rem; display: flex; gap: 1rem; align-items: center; border-bottom: 1px solid #cbd5e1; }
                .group-header input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #94a3b8; border-radius: 4px; font-weight: 600; font-size: 1rem; }
                .group-body { padding: 1.5rem; }
                
                /* Field Rows */
                /* Updated Grid to support drag handle column */
                .field-row { display: grid; grid-template-columns: auto 2fr 1.5fr auto auto; gap: 1rem; align-items: start; padding: 1rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 0.75rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                
                /* Drag & Drop Styles */
                .drag-handle-group, .drag-handle-field { cursor: grab; color: #94a3b8; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; user-select: none; }
                .drag-handle-group:hover, .drag-handle-field:hover { color: var(--color-primary); }
                .drag-handle-group:active, .drag-handle-field:active { cursor: grabbing; }
                .sortable-ghost { opacity: 0.4; background: #eef2ff !important; border: 1px dashed var(--color-primary) !important; }

                /* Buttons */
                .btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: opacity 0.2s; }
                .btn-primary:hover { opacity: 0.9; }
                .btn-outline { background: white; color: var(--color-primary); border: 1px solid var(--color-primary); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
                .btn-outline:hover { background: #f1f5f9; }
                .btn-secondary { background: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; color: var(--color-text); }
                .btn-secondary:hover { background: #cbd5e1; }
                .btn-accent { background: var(--color-accent); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
                .btn-accent:hover { opacity: 0.9; }
                .btn-icon { background: none; border: none; padding: 0.4rem; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
                .btn-icon:hover { background: #cbd5e1; }
                
                /* Modal */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .modal-content { background: white; width: 100%; max-width: 800px; max-height: 90vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
                .modal-body { padding: 2rem; overflow-y: auto; background: white; }
            </style>
        `;
    },

    // ─── INITIALIZATION ────────────────────────────────────────────────────
    async init() {
        this.cacheDOM();
        this.attachListeners();

        if (this.state.isEditing) {
            await this.loadData();
        } else {
            this.addGroup(); 
        }
    },

    cacheDOM() {
        this.container = document.getElementById('field-groups-container');
        this.inputs = {
            label: document.getElementById('se-label'),
            description: document.getElementById('se-description'),
            icon: document.getElementById('se-icon'),
            is_active: document.getElementById('se-active')
        };
        this.previewModal = document.getElementById('preview-modal');
        this.previewBody = document.getElementById('preview-form-body');
    },

    // ─── CORE LOGIC ────────────────────────────────────────────────────────
    addGroup() {
        const newGroup = {
            id: Date.now(),
            name: '',
            repeatable: false,
            isCollapsed: false,
            fields: []
        };
        this.state.fieldGroups.push(newGroup);
        this.renderGroups();
    },

    addField(groupId) {
        const group = this.state.fieldGroups.find(g => g.id === groupId);
        if (group) {
            group.fields.push({
                id: Date.now() + Math.random(),
                label: '',
                type: 'text',
                required: false,
                options: '' 
            });
            group.isCollapsed = false; 
            this.renderGroups();
        }
    },

    renderGroups() {
        if (this.state.fieldGroups.length === 0) {
            this.container.innerHTML = `
                <div style="text-align: center; padding: 3rem; border: 2px dashed #cbd5e1; border-radius: 8px;">
                    <p style="color: var(--color-text-muted);">No sections created yet.</p>
                </div>
            `;
            this.initSortable(); // Clear any hanging sortables
            return;
        }

        this.container.innerHTML = this.state.fieldGroups.map(group => `
            <div class="field-group-card" data-group-id="${group.id}">
                <div class="group-header">
                    <div class="drag-handle-group" title="Drag to reorder section">⋮⋮</div>
                    <input type="text" class="group-name-input" placeholder="Section Name (e.g., Company Details)" value="${group.name}">
                    <button class="btn-icon toggle-collapse" title="${group.isCollapsed ? 'Expand' : 'Collapse'}">${group.isCollapsed ? '▶' : '▼'}</button>
                    <button class="btn-icon delete-group" title="Delete Section" style="color: var(--color-danger);">🗑️</button>
                </div>
                
                <div class="group-body" style="display: ${group.isCollapsed ? 'none' : 'block'}">
                    <label class="checkbox-label" style="margin-bottom: 1.5rem; display: inline-flex; background: #e2e8f0; padding: 0.5rem 1rem; border-radius: 6px;">
                        <input type="checkbox" class="group-repeatable" style="accent-color: var(--color-primary); width: 16px; height: 16px;" ${group.repeatable ? 'checked' : ''}>
                        <span style="font-size: 0.9rem;">Allow multiple entries (e.g., add multiple directors)</span>
                    </label>

                    <div class="fields-list">
                        ${group.fields.length === 0 ? '<p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">No fields in this section yet.</p>' : ''}
                        
                        ${group.fields.map(field => `
                            <div class="field-row" data-field-id="${field.id}">
                                
                                <!-- Drag Handle -->
                                <div class="drag-handle-field" title="Drag to reorder field" style="padding-top: 0.6rem;">⋮⋮</div>

                                <!-- Label & Options Column -->
                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    <input type="text" class="form-input field-label-input" placeholder="Field Label (e.g., Director Name)" value="${field.label}">
                                    ${field.type === 'select' ? `
                                        <input type="text" class="form-input field-options-input" placeholder="Comma separated options (e.g., Yes, No)" value="${field.options || ''}" style="background: #f1f5f9; border-color: #94a3b8; font-size: 0.85rem;">
                                    ` : ''}
                                </div>

                                <!-- Type Select Column -->
                                <div>
                                    <select class="form-input field-type-select">
                                        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                        <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
                                        <option value="phone" ${field.type === 'phone' ? 'selected' : ''}>Phone Number</option>
                                        <option value="id_number" ${field.type === 'id_number' ? 'selected' : ''}>ID Number</option>
                                        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                                        <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Long Text</option>
                                        <option value="image" ${field.type === 'image' ? 'selected' : ''}>Image Upload</option>
                                        <option value="pdf" ${field.type === 'pdf' ? 'selected' : ''}>PDF Upload</option>
                                        <option value="select" ${field.type === 'select' ? 'selected' : ''}>Dropdown List</option>
                                    </select>
                                </div>

                                <!-- Required Checkbox -->
                                <div style="padding-top: 0.6rem;">
                                    <label class="checkbox-label" style="font-size: 0.85rem;">
                                        <input type="checkbox" class="field-required" style="accent-color: var(--color-primary);" ${field.required ? 'checked' : ''}> Required
                                    </label>
                                </div>

                                <!-- Delete Button -->
                                <button class="btn-icon delete-field" title="Remove Field" style="color: var(--color-danger); margin-top: 0.2rem;">×</button>
                            </div>
                        `).join('')}
                    </div>

                    <button class="btn-outline add-field-btn" style="margin-top: 1.5rem; width: 100%; border-style: dashed; padding: 0.75rem;">+ Add Field</button>
                </div>
            </div>
        `).join('');

        // Re-initialize drag-and-drop mechanics after rendering
        this.initSortable();
    },

    // ─── DRAG AND DROP LOGIC (SORTABLE JS) ─────────────────────────────────
    initSortable() {
        // Destroy existing instances to prevent memory leaks on re-renders
        if (this.sortableInstances) {
            this.sortableInstances.forEach(s => s.destroy());
        }
        this.sortableInstances = [];

        // 1. Group Reordering
        if (this.container) {
            const groupSortable = Sortable.create(this.container, {
                animation: 150,
                handle: '.drag-handle-group',
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    // Sync the internal state array with the new DOM order
                    const movedGroup = this.state.fieldGroups.splice(evt.oldIndex, 1)[0];
                    this.state.fieldGroups.splice(evt.newIndex, 0, movedGroup);
                }
            });
            this.sortableInstances.push(groupSortable);
        }

        // 2. Field Reordering within Groups
        const fieldLists = document.querySelectorAll('.fields-list');
        fieldLists.forEach(list => {
            const fieldSortable = Sortable.create(list, {
                animation: 150,
                handle: '.drag-handle-field',
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    // Identify which group this field belongs to
                    const groupId = parseFloat(list.closest('.field-group-card').dataset.groupId);
                    const group = this.state.fieldGroups.find(g => g.id === groupId);
                    
                    // Sync the field's position in the state
                    const movedField = group.fields.splice(evt.oldIndex, 1)[0];
                    group.fields.splice(evt.newIndex, 0, movedField);
                }
            });
            this.sortableInstances.push(fieldSortable);
        });
    },

    // ─── DATA SYNC ─────────────────────────────────────────────────────────
    async loadData() {
        try {
            const res = await API.getService(this.state.id);
            if (res.success) {
                const srv = res.data;
                this.inputs.label.value = srv.label || srv.name || '';
                this.inputs.description.value = srv.description || '';
                this.inputs.icon.value = srv.icon || srv.icon_name || 'building';
                this.inputs.is_active.checked = srv.is_active !== false;
                
                if (srv.fieldGroups && srv.fieldGroups.length > 0) {
                    this.state.fieldGroups = srv.fieldGroups;
                } else if (srv.fields && srv.fields.length > 0) {
                    // Reconstruct groups from the group_name metadata stored on each field
                    const groupMap = new Map();
                    srv.fields.forEach(f => {
                        const groupName = f.group_name || 'General Information';
                        if (!groupMap.has(groupName)) {
                            groupMap.set(groupName, {
                                id: Date.now() + Math.random(),
                                name: groupName,
                                repeatable: f.group_repeatable || false,
                                isCollapsed: false,
                                fields: []
                            });
                        }
                        groupMap.get(groupName).fields.push({ ...f, id: Date.now() + Math.random() });
                    });
                    this.state.fieldGroups = Array.from(groupMap.values());
                }
                
                this.renderGroups();
            }
        } catch (e) { 
            console.error(e);
            Toast.error("Failed to load service data"); 
        }
    },

    async save() {
        if (!this.inputs.label.value.trim()) {
            return Toast.error('Service Display Name is required.');
        }

        const name = this.inputs.label.value.trim();

        // Auto-generate the service_key from the name (underscores, lowercase)
        const service_key = this.state.isEditing 
            ? undefined   // don't send it; validator will ignore undefined on update
            : name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

        // Flatten all fields from all groups into a single array for the DB
        const allFields = this.state.fieldGroups.flatMap(group =>
            group.fields.map(f => ({
                label: f.label.trim() || 'Unnamed Field',
                name: f.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
                type: f.type,
                required: f.required,
                // Attach group info so the frontend can still reconstruct groups later
                group_name: group.name.trim() || 'General',
                group_repeatable: group.repeatable,
                ...(f.type === 'select' && {
                    options: (f.options || '').split(',').map(s => s.trim()).filter(Boolean)
                })
            }))
        );

        const payload = {
            name:        name,
            ...(service_key && { service_key }),
            description: this.inputs.description.value.trim(),
            icon_name:   this.inputs.icon.value,    // ← renamed from "icon"
            is_active:   this.inputs.is_active.checked,
            fields:      allFields                  // ← renamed from "fieldGroups"
        };

        const btn = document.getElementById('btn-save-service');
        const originalText = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled = true;

        try {
            const res = this.state.isEditing 
                ? await API.updateService(this.state.id, payload)
                : await API.createService(payload);
            
            if (res.success) {
                Toast.success("Service definition saved successfully!");
                window.location.hash = '#/admin';
            } else {
                throw new Error(res.message);
            }
        } catch (e) { 
            Toast.error(e.message || "Failed to save service definition."); 
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },

    // ─── EVENT LISTENERS ───────────────────────────────────────────────────
    attachListeners() {
        document.getElementById('btn-add-group').addEventListener('click', () => this.addGroup());
        document.getElementById('btn-save-service').addEventListener('click', () => this.save());
        document.getElementById('btn-show-preview').addEventListener('click', () => this.togglePreview(true));
        document.getElementById('close-preview').addEventListener('click', () => this.togglePreview(false));

        this.container.addEventListener('click', (e) => {
            const target = e.target;
            const groupId = parseFloat(target.closest('.field-group-card')?.dataset.groupId);
            const fieldId = parseFloat(target.closest('.field-row')?.dataset.fieldId);

            if (target.classList.contains('add-field-btn')) this.addField(groupId);
            
            if (target.classList.contains('delete-group')) {
                if(confirm('Are you sure you want to delete this entire section?')) {
                    this.state.fieldGroups = this.state.fieldGroups.filter(g => g.id !== groupId);
                    this.renderGroups();
                }
            }
            
            if (target.classList.contains('delete-field')) {
                const group = this.state.fieldGroups.find(g => g.id === groupId);
                group.fields = group.fields.filter(f => f.id !== fieldId);
                this.renderGroups();
            }
            
            if (target.classList.contains('toggle-collapse')) {
                const group = this.state.fieldGroups.find(g => g.id === groupId);
                group.isCollapsed = !group.isCollapsed;
                this.renderGroups();
            }
        });

        this.container.addEventListener('input', (e) => {
            const target = e.target;
            const groupId = parseFloat(target.closest('.field-group-card')?.dataset.groupId);
            const fieldId = parseFloat(target.closest('.field-row')?.dataset.fieldId);
            if (!groupId) return;

            const group = this.state.fieldGroups.find(g => g.id === groupId);

            if (target.classList.contains('group-name-input')) group.name = target.value;
            if (target.classList.contains('group-repeatable')) group.repeatable = target.checked;

            if (fieldId) {
                const field = group.fields.find(f => f.id === fieldId);
                if (target.classList.contains('field-label-input')) field.label = target.value;
                if (target.classList.contains('field-options-input')) field.options = target.value;
                
                if (target.classList.contains('field-type-select')) {
                    field.type = target.value;
                    this.renderGroups(); 
                }
                
                if (target.classList.contains('field-required')) field.required = target.checked;
            }
        });
    },

    // ─── PREVIEW MODAL LOGIC ───────────────────────────────────────────────
    togglePreview(show) {
        this.previewModal.style.display = show ? 'flex' : 'none';
        if (show) this.renderPreview();
    },

    renderPreview() {
        const title = this.inputs.label.value || 'Untitled Service';
        const desc = this.inputs.description.value || 'No description provided.';
        
        this.previewBody.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="margin-bottom: 0.5rem; font-family: var(--font-display); color: var(--color-primary);">${title}</h2>
                    <p style="color: var(--color-text-muted); line-height: 1.5;">${desc}</p>
                </div>
                
                <form onsubmit="event.preventDefault()">
                    ${this.state.fieldGroups.map((g, index) => `
                        <div style="margin-bottom: 2.5rem; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                            
                            <div style="margin-bottom: 1.5rem; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">
                                <h4 style="margin: 0; font-size: 1.1rem; color: var(--color-text);">
                                    <span style="display:inline-block; background: var(--color-primary); color: white; border-radius: 50%; width: 24px; height: 24px; text-align: center; line-height: 24px; font-size: 0.85rem; margin-right: 8px;">${index + 1}</span>
                                    ${g.name || 'Untitled Section'}
                                </h4>
                            </div>

                            ${g.fields.length === 0 ? '<p style="color: #94a3b8; font-style: italic; font-size: 0.9rem;">No fields defined for this section.</p>' : ''}

                            ${g.fields.map(f => {
                                const label = f.label || 'Unnamed Field';
                                const reqMark = f.required ? '<span style="color: var(--color-danger); margin-left: 4px;">*</span>' : '';
                                
                                let inputHtml = '';
                                if (f.type === 'textarea') {
                                    inputHtml = `<textarea disabled placeholder="User input..." style="width:100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; background: white; resize: vertical;" rows="3"></textarea>`;
                                } else if (f.type === 'select') {
                                    const opts = (f.options || '').split(',').filter(Boolean);
                                    inputHtml = `
                                        <select disabled style="width:100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; background: white;">
                                            <option>Select an option...</option>
                                            ${opts.map(o => `<option>${o.trim()}</option>`).join('')}
                                        </select>
                                    `;
                                } else if (f.type === 'image' || f.type === 'pdf') {
                                    inputHtml = `
                                        <div style="border: 2px dashed #cbd5e1; padding: 1.5rem; text-align: center; border-radius: 6px; background: white; color: #64748b;">
                                            📁 Upload ${f.type.toUpperCase()} file
                                        </div>
                                    `;
                                } else {
                                    inputHtml = `<input type="text" disabled placeholder="User input..." style="width:100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; background: white;">`;
                                }

                                return `
                                    <div style="margin-bottom: 1.25rem;">
                                        <label style="display:block; font-weight:600; font-size: 0.9rem; margin-bottom: 6px; color: var(--color-text);">
                                            ${label} ${reqMark}
                                        </label>
                                        ${inputHtml}
                                    </div>
                                `;
                            }).join('')}

                            ${g.repeatable ? `
                                <button type="button" disabled style="margin-top: 1rem; padding: 0.5rem 1rem; background: transparent; border: 1px dashed var(--color-primary); color: var(--color-primary); border-radius: 4px; cursor: not-allowed;">
                                    + Add another ${g.name || 'entry'}
                                </button>
                            ` : ''}

                        </div>
                    `).join('')}
                    
                    <div style="text-align: right; margin-top: 2rem;">
                        <button type="button" disabled style="padding: 0.75rem 2rem; background: var(--color-primary); color: white; border: none; border-radius: 6px; font-weight: bold; opacity: 0.7; cursor: not-allowed;">
                            Submit Application &rarr;
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
};