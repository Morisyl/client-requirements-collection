export const CompanyAmendments = {
    render() {
        return `
            <div class="service-form-module" id="company-amendment-form">
                
                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Target Company Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <label class="form-label">Company Name *</label>
                        <input type="text" id="ca_company_name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Registration Number (PVT-XXX) *</label>
                        <input type="text" id="ca_reg_number" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Amendment Information</h3>
                <div style="margin-bottom: 1.5rem;">
                    <label class="form-label">Type of Amendment *</label>
                    <select id="ca_type" class="form-input" required>
                        <option value="">-- Select Amendment Type --</option>
                        <option value="Change of Name">Change of Name</option>
                        <option value="Change of Directors">Change of Directors / Secretarial</option>
                        <option value="Change of Address">Change of Registered Address</option>
                        <option value="Articles Amendment">Amendment of Articles of Association</option>
                        <option value="Share Allotment">Allotment / Transfer of Shares</option>
                    </select>
                </div>

                <div style="margin-bottom: 2rem;">
                    <label class="form-label">Detailed Description of Amendment *</label>
                    <textarea id="ca_description" class="form-input" rows="3" required placeholder="Describe exactly what needs to be changed..."></textarea>
                </div>

                <!-- Dynamic Persons Affected Array (e.g., Directors being added/removed) -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="color: var(--color-text); margin: 0;">Persons Affected</h3>
                        <p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 0.2rem 0 0 0;">(e.g., Outgoing/Incoming Directors, New Shareholders)</p>
                    </div>
                    <button type="button" id="btn_add_person" style="padding: 0.4rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">+ Add Person</button>
                </div>
                <div id="ca_persons_container" style="margin-bottom: 2rem;">
                    <!-- Persons injected here by JS -->
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Authorized Contact / Applicant</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Contact Name *</label>
                        <input type="text" id="ca_contact_name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Contact Phone *</label>
                        <input type="tel" id="ca_contact_phone" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Contact Email *</label>
                        <input type="email" id="ca_contact_email" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Supporting Documents</h3>
                <div style="margin-bottom: 2rem;">
                    <label class="form-label">Upload Resolutions, Affidavits, or Board Minutes *</label>
                    <input type="file" id="ca_supporting_doc" class="form-file" accept=".pdf, .jpg, .jpeg, .png" multiple required>
                </div>
            </div>
            
            <style>
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.95rem; color: var(--color-text); }
                .form-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; }
                .form-file { width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; }
                .repeater-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; position: relative; }
                .btn-remove { position: absolute; top: 1rem; right: 1rem; background: var(--color-danger); color: white; border: none; border-radius: 4px; padding: 0.2rem 0.5rem; cursor: pointer; font-size: 0.8rem; }
            </style>
        `;
    },

    setupListeners() {
        // Initialize with zero persons (optional depending on amendment)
        document.getElementById('btn_add_person').addEventListener('click', () => this.addPerson());
    },

    addPerson() {
        const container = document.getElementById('ca_persons_container');
        const id = Date.now();
        
        const html = `
            <div class="repeater-card person-entry" id="person_${id}">
                <button type="button" class="btn-remove" onclick="document.getElementById('person_${id}').remove()">Remove</button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input p-name" required>
                    </div>
                    <div>
                        <label class="form-label">Role / Status (e.g., Incoming Director)</label>
                        <input type="text" class="form-input p-role" required>
                    </div>
                    <div>
                        <label class="form-label">ID / Passport Number</label>
                        <input type="text" class="form-input p-id" required>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    extractData() {
        const personsAffected = Array.from(document.querySelectorAll('.person-entry')).map(node => ({
            name: node.querySelector('.p-name').value,
            role: node.querySelector('.p-role').value,
            idNumber: node.querySelector('.p-id').value
        }));

        return {
            companyName: document.getElementById('ca_company_name').value,
            registrationNumber: document.getElementById('ca_reg_number').value,
            amendmentType: document.getElementById('ca_type').value,
            description: document.getElementById('ca_description').value,
            personsAffected,
            contactPerson: {
                name: document.getElementById('ca_contact_name').value,
                phone: document.getElementById('ca_contact_phone').value,
                email: document.getElementById('ca_contact_email').value
            }
        };
    },

    extractFiles() {
        return Array.from(document.getElementById('ca_supporting_doc').files);
    }
};