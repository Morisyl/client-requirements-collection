export const GeneralCompliance = {
    render() {
        return `
            <div class="service-form-module" id="compliance-form">
                
                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Entity Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Name of Entity / Business *</label>
                        <input type="text" id="gc_entity_name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Entity Type *</label>
                        <select id="gc_entity_type" class="form-input" required>
                            <option value="">-- Select --</option>
                            <option value="Sole Proprietor">Sole Proprietorship</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Private Limited">Private Limited Company</option>
                            <option value="NGO / Society">NGO / Society</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Registration Number *</label>
                        <input type="text" id="gc_reg_number" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Compliance Service Required</h3>
                <div style="margin-bottom: 2rem;">
                    <label class="form-label">Description of Service (e.g., CR12 Application, Annual Returns filing) *</label>
                    <textarea id="gc_description" class="form-input" rows="3" required></textarea>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Applicant Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Applicant Full Name *</label>
                        <input type="text" id="gc_fullname" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">ID / Passport Number *</label>
                        <input type="text" id="gc_id_number" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" id="gc_phone" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Email Address *</label>
                        <input type="email" id="gc_email" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Physical Address *</label>
                        <input type="text" id="gc_address" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Supporting Documents</h3>
                <div style="margin-bottom: 2rem;">
                    <label class="form-label">Upload any relevant documents (Notices, Previous filings, etc.)</label>
                    <input type="file" id="gc_supporting_doc" class="form-file" accept=".pdf, .jpg, .jpeg, .png" multiple>
                </div>
            </div>
            
            <style>
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.95rem; color: var(--color-text); }
                .form-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; }
                .form-file { width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; }
            </style>
        `;
    },

    extractData() {
        return {
            entityName: document.getElementById('gc_entity_name').value,
            entityType: document.getElementById('gc_entity_type').value,
            registrationNumber: document.getElementById('gc_reg_number').value,
            serviceDescription: document.getElementById('gc_description').value,
            applicant: {
                fullName: document.getElementById('gc_fullname').value,
                idNumber: document.getElementById('gc_id_number').value,
                phone: document.getElementById('gc_phone').value,
                email: document.getElementById('gc_email').value,
                address: document.getElementById('gc_address').value
            }
        };
    },

    extractFiles() {
        return Array.from(document.getElementById('gc_supporting_doc').files);
    }
};