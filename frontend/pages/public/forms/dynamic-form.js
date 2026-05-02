export const DynamicForm = {
    // Stores the schema locally to loop over during extraction
    schema: [],

    // Stores saved form data for pre-populating inputs on re-render
    savedData: {},

    /**
     * Renders the dynamic HTML based on the provided fields array
     * @param {Array} fields - The array of field objects from the backend service schema
     * @param {Object} formData - Optional saved form data to pre-populate inputs
     */
    render(fields = [], formData = {}) {
        this.schema = fields;
        this.savedData = formData || {};

        if (!fields || fields.length === 0) {
            return `
                <div style="padding: 2rem; text-align: center; background: #f8fafc; border-radius: 8px;">
                    <p style="color: var(--color-text-muted);">No dynamic fields defined for this service.</p>
                </div>
            `;
        }

        let html = `<div class="service-form-module" id="dynamic-form-engine">`;

        // Iterate through the schema and build the UI
        fields.forEach(field => {
            html += this.renderField(field);
        });

        html += `
            <style>
                .dyn-form-group { margin-bottom: 1.5rem; }
                .dyn-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.95rem; color: var(--color-text); }
                .dyn-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; transition: border-color 0.2s; }
                .dyn-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1); }
                .dyn-file { width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; }
                .dyn-section-title { margin-top: 2rem; margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; }
                .dyn-file-prev { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-success, #10b981); font-weight: 500; }
            </style>
        </div>`;

        return html;
    },

    /**
     * Safely escapes a string for use as an HTML attribute value
     */
    _escAttr(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    /**
     * Generates the HTML for a single field based on its 'type'
     */
    renderField(field) {
        const isRequired = field.required ? 'required' : '';
        const requiredMark = field.required ? ' <span style="color: var(--color-danger);">*</span>' : '';
        const id = `dyn_${field.name}`;

        // Helper: get saved value for this field
        const saved = (key) => this._escAttr(this.savedData[key]);

        // 1. Handle non-interactive Sections / Headers
        if (field.type === 'section') {
            return `<h3 class="dyn-section-title">${field.label}</h3>`;
        }

        let inputHtml = '';

        // 2. Handle interactive inputs
        switch (field.type) {
            case 'textarea': {
                const savedVal = this._escAttr(this.savedData[field.name]);
                inputHtml = `<textarea id="${id}" name="${field.name}" class="dyn-input" rows="3" ${isRequired} placeholder="Enter details here...">${savedVal}</textarea>`;
                break;
            }

            case 'select': {
                const savedVal = this.savedData[field.name] || '';
                const options = (field.options || []).map(opt => {
                    const selected = (opt === savedVal) ? 'selected' : '';
                    return `<option value="${this._escAttr(opt)}" ${selected}>${opt}</option>`;
                }).join('');
                inputHtml = `<select id="${id}" name="${field.name}" class="dyn-input" ${isRequired}>
                                <option value="">-- Select --</option>
                                ${options}
                            </select>`;
                break;
            }

            case 'file':
            case 'pdf':
            case 'image': {
                // Determine accepted formats based on type
                let acceptFormats = '.pdf, .jpg, .jpeg, .png';
                let formatLabel = 'PDF, JPG, PNG';

                if (field.type === 'pdf') {
                    acceptFormats = '.pdf';
                    formatLabel = 'PDF only';
                } else if (field.type === 'image') {
                    acceptFormats = '.jpg, .jpeg, .png, .gif, .webp';
                    formatLabel = 'Image files (JPG, PNG, GIF, WebP)';
                }

                // Show "previously uploaded" indicator if a filename was saved
                const prevFilename = this.savedData[field.name];
                const prevFileHtml = prevFilename
                    ? `<div class="dyn-file-prev">✓ Previously uploaded: ${this._escAttr(prevFilename)} &nbsp;<span style="color:#94a3b8; font-weight:400;">(re-upload to change)</span></div>`
                    : '';

                inputHtml = `
                    <div style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 1.5rem; background: #f8fafc; text-align: center;">
                        <input type="file" id="${id}" name="${field.name}" class="dyn-file" ${isRequired} accept="${acceptFormats}" 
                            style="display: none;" onchange="window.DynamicForm.previewFile('${id}', '${field.type}')">
                        <label for="${id}" style="cursor: pointer; display: block;">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #94a3b8;">
                                ${field.type === 'image' ? '📷' : '📄'}
                            </div>
                            <p style="color: var(--color-primary); font-weight: 600; margin-bottom: 0.3rem;">
                                Click to upload ${field.type === 'image' ? 'image' : field.type === 'pdf' ? 'PDF' : 'file'}
                            </p>
                            <p style="font-size: 0.8rem; color: var(--color-text-muted);">Accepted: ${formatLabel}</p>
                        </label>
                        ${prevFileHtml}
                        <div id="${id}_preview" style="margin-top: 1rem; display: none;">
                            <p style="color: var(--color-success); font-weight: 500;">✓ <span id="${id}_filename"></span></p>
                        </div>
                    </div>
                `;
                break;
            }

            case 'address': {
                const addrSaved = this.savedData[field.name];
                // Address can be stored as a nested object OR as flat keys
                const getAddrVal = (subKey) => {
                    if (addrSaved && typeof addrSaved === 'object') {
                        return this._escAttr(addrSaved[subKey]);
                    }
                    // Fallback: flat keys like "business_address_county"
                    return this._escAttr(this.savedData[`${field.name}_${subKey}`]);
                };

                inputHtml = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <div>
                            <label class="dyn-label" style="font-size: 0.85rem; margin-bottom: 0.2rem;">County ${requiredMark}</label>
                            <input type="text" id="${id}_county" name="${field.name}_county" class="dyn-input" ${isRequired} value="${getAddrVal('county')}">
                        </div>
                        <div>
                            <label class="dyn-label" style="font-size: 0.85rem; margin-bottom: 0.2rem;">Town / City ${requiredMark}</label>
                            <input type="text" id="${id}_town" name="${field.name}_town" class="dyn-input" ${isRequired} value="${getAddrVal('town')}">
                        </div>
                        <div>
                            <label class="dyn-label" style="font-size: 0.85rem; margin-bottom: 0.2rem;">P.O. Box</label>
                            <input type="text" id="${id}_pobox" name="${field.name}_pobox" class="dyn-input" value="${getAddrVal('pobox')}">
                        </div>
                        <div>
                            <label class="dyn-label" style="font-size: 0.85rem; margin-bottom: 0.2rem;">Postal Code</label>
                            <input type="text" id="${id}_code" name="${field.name}_code" class="dyn-input" value="${getAddrVal('code')}">
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label class="dyn-label" style="font-size: 0.85rem; margin-bottom: 0.2rem;">Building / Street ${requiredMark}</label>
                            <input type="text" id="${id}_building" name="${field.name}_building" class="dyn-input" ${isRequired} value="${getAddrVal('building')}">
                        </div>
                    </div>
                `;
                break;
            }

            case 'phone':
                inputHtml = `<input type="tel" id="${id}" name="${field.name}" class="dyn-input" ${isRequired} 
                                placeholder="+254712345678" 
                                pattern="(\\+?254|0)[17]\\d{8}"
                                title="Enter valid Kenyan phone: +254712345678 or 0712345678"
                                oninput="this.value = this.value.replace(/[^0-9+]/g, '')"
                                value="${saved(field.name)}">`;
                break;

            case 'id_number':
                inputHtml = `<input type="text" id="${id}" name="${field.name}" class="dyn-input" ${isRequired} 
                                placeholder="12345678" 
                                pattern="\\d{8}" 
                                maxlength="8"
                                title="Kenyan ID must be exactly 8 digits"
                                oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 8)"
                                value="${saved(field.name)}">`;
                break;

            case 'number':
                inputHtml = `<input type="number" id="${id}" name="${field.name}" class="dyn-input" ${isRequired} value="${saved(field.name)}">`;
                break;

            case 'email':
                inputHtml = `<input type="email" id="${id}" name="${field.name}" class="dyn-input" ${isRequired} placeholder="email@example.com" value="${saved(field.name)}">`;
                break;

            case 'text':
            default:
                inputHtml = `<input type="text" id="${id}" name="${field.name}" class="dyn-input" ${isRequired} value="${saved(field.name)}">`;
                break;
        }

        return `
            <div class="dyn-form-group">
                <label class="dyn-label" for="${id}">${field.label}${requiredMark}</label>
                ${inputHtml}
            </div>
        `;
    },


    /**
     * Shows preview when user selects a file
     */
    previewFile(inputId, fieldType) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(`${inputId}_preview`);
        const filename = document.getElementById(`${inputId}_filename`);
        
        if (!input || !input.files || !input.files[0]) return;
        
        const file = input.files[0];
        
        // Always show the preview container
        if (preview) preview.style.display = 'block';
        
        // For images, show thumbnail
        if (fieldType === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (preview) {
                    preview.innerHTML = `
                        <img src="${e.target.result}" 
                            style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 2px solid var(--color-success); margin-top: 0.5rem; display: block; margin-left: auto; margin-right: auto;">
                        <p style="color: var(--color-success); font-weight: 500; margin-top: 0.5rem; font-size: 0.9rem;">✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
                    `;
                }
            };
            reader.readAsDataURL(file);
        } else {
            // For PDFs and other files, just show filename and size
            if (filename) filename.textContent = file.name;
            if (preview) {
                preview.innerHTML = `
                    <p style="color: var(--color-success); font-weight: 500; font-size: 0.9rem;">
                        ✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)
                    </p>
                `;
            }
        }
    },


    /**
     * Scrapes the dynamically generated inputs to build a clean JSON object
     */
    extractData() {
        const data = {};
        
        this.schema.forEach(field => {
            // Ignore files (handled separately) and sections (no data)
            if (field.type === 'section' || field.type === 'file') return;

            const id = `dyn_${field.name}`;
            
            if (field.type === 'address') {
                data[field.name] = {
                    county: document.getElementById(`${id}_county`)?.value || '',
                    town: document.getElementById(`${id}_town`)?.value || '',
                    poBox: document.getElementById(`${id}_pobox`)?.value || '',
                    postalCode: document.getElementById(`${id}_code`)?.value || '',
                    building: document.getElementById(`${id}_building`)?.value || ''
                };
            } else {
                const el = document.getElementById(id);
                if (el) {
                    // For numbers, parse them safely
                    data[field.name] = field.type === 'number' ? Number(el.value) : el.value;
                }
            }
        });
        
        return data;
    },

    /**
     * Extracts all file objects uploaded in the dynamic form
     */
    extractFiles() {
        const files = [];
        
        this.schema.forEach(field => {
            if (field.type === 'file' || field.type === 'pdf' || field.type === 'image') {
                const el = document.getElementById(`dyn_${field.name}`);
                if (el && el.files.length > 0) {
                    const originalFile = el.files[0];
                    // Prepend the field name to the filename. 
                    // This allows the admin to know exactly what the document is when downloading it.
                    const newFile = new File(
                        [originalFile], 
                        `${field.name}_${originalFile.name}`, 
                        { type: originalFile.type }
                    );
                    files.push(newFile);
                }
            }
        });
        
        return files;
    }
};