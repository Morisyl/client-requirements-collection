export const BusinessNameAmendments = {
    render() {
        return `
            <div class="service-form-module" id="amendment-form">
                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Current Business Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <label class="form-label">Registered Business Name *</label>
                        <input type="text" id="amd_reg_name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Registration Number (BN-XXX) *</label>
                        <input type="text" id="amd_reg_number" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Amendment Details</h3>
                <div style="margin-bottom: 1.5rem;">
                    <label class="form-label">Type of Amendment *</label>
                    <select id="amd_type" class="form-input" required>
                        <option value="">-- Select Amendment Type --</option>
                        <option value="Change of Name">Change of Name</option>
                        <option value="Change of Activities">Change of Nature of Business</option>
                        <option value="Change of Address">Change of Address</option>
                        <option value="Change of Proprietor">Change/Addition of Proprietor</option>
                    </select>
                </div>

                <!-- Dynamic Sections (Hidden by default) -->
                <div id="section_change_name" class="dynamic-section" style="display: none; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 6px;">
                    <label class="form-label">Proposed New Names (List 3 in order of preference)</label>
                    <textarea id="amd_new_names" class="form-input" rows="3" placeholder="1. ...&#10;2. ...&#10;3. ..."></textarea>
                </div>

                <div id="section_change_activities" class="dynamic-section" style="display: none; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 6px;">
                    <label class="form-label">New Nature of Business</label>
                    <textarea id="amd_new_activities" class="form-input" rows="3"></textarea>
                </div>

                <div id="section_change_address" class="dynamic-section" style="display: none; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 6px;">
                    <label class="form-label">New Full Address Details</label>
                    <textarea id="amd_new_address" class="form-input" rows="3" placeholder="Include County, Town, P.O Box, and Building..."></textarea>
                </div>

                <div style="margin-bottom: 2rem;">
                    <label class="form-label">General Description / Reason for Amendment</label>
                    <textarea id="amd_description" class="form-input" rows="2"></textarea>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Applicant Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Applicant Name *</label>
                        <input type="text" id="amd_applicant_name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" id="amd_phone" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Email Address *</label>
                        <input type="email" id="amd_email" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Supporting Documents</h3>
                <div style="margin-bottom: 2rem;">
                    <label class="form-label">Upload Supporting Documents (Minutes, ID Copies, etc. - PDF format preferred)</label>
                    <input type="file" id="amd_supporting_doc" class="form-file" accept=".pdf, .jpg, .jpeg, .png" multiple>
                </div>
            </div>
            
            <style>
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.95rem; color: var(--color-text); }
                .form-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; }
                .form-file { width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; }
            </style>
        `;
    },

    setupListeners() {
        const select = document.getElementById('amd_type');
        select.addEventListener('change', (e) => {
            // Hide all dynamic sections first
            document.querySelectorAll('.dynamic-section').forEach(el => el.style.display = 'none');
            
            // Show the relevant section based on selection
            const val = e.target.value;
            if (val === 'Change of Name') document.getElementById('section_change_name').style.display = 'block';
            if (val === 'Change of Activities') document.getElementById('section_change_activities').style.display = 'block';
            if (val === 'Change of Address') document.getElementById('section_change_address').style.display = 'block';
        });
    },

    extractData() {
        return {
            registeredName: document.getElementById('amd_reg_name').value,
            registrationNumber: document.getElementById('amd_reg_number').value,
            amendmentType: document.getElementById('amd_type').value,
            proposedNames: document.getElementById('amd_new_names').value,
            newActivities: document.getElementById('amd_new_activities').value,
            newAddress: document.getElementById('amd_new_address').value,
            description: document.getElementById('amd_description').value,
            applicant: {
                name: document.getElementById('amd_applicant_name').value,
                phone: document.getElementById('amd_phone').value,
                email: document.getElementById('amd_email').value
            }
        };
    },

    extractFiles() {
        // Returns an array of File objects
        return Array.from(document.getElementById('amd_supporting_doc').files);
    }
};