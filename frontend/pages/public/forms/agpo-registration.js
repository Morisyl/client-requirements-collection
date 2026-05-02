export const AgpoRegistration = {
    render() {
        return `
            <div class="service-form-module" id="agpo-form">
                
                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">AGPO Eligibility Categories</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <label class="form-label">Applicant Category *</label>
                        <select id="agpo_category" class="form-input" required>
                            <option value="">-- Select Category --</option>
                            <option value="Youth">Youth</option>
                            <option value="Women">Women</option>
                            <option value="PWD">Persons with Disabilities (PWD)</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Business Type *</label>
                        <select id="agpo_biz_type" class="form-input" required>
                            <option value="">-- Select Type --</option>
                            <option value="Sole Proprietorship">Sole Proprietorship</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Limited Company">Limited Company</option>
                        </select>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Business Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Registered Business Name *</label>
                        <input type="text" id="agpo_biz_name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Business Phone *</label>
                        <input type="tel" id="agpo_phone" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Business Email *</label>
                        <input type="email" id="agpo_email" class="form-input" required>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Physical Address *</label>
                        <textarea id="agpo_address" class="form-input" rows="2" required></textarea>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Mandatory Statutory Documents</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <label class="form-label">Certificate of Registration/Incorporation (PDF) *</label>
                        <input type="file" id="agpo_cert" class="form-file" accept=".pdf, .jpg, .png" required>
                    </div>
                    <div>
                        <label class="form-label">KRA PIN Certificate (PDF) *</label>
                        <input type="file" id="agpo_kra" class="form-file" accept=".pdf, .jpg, .png" required>
                    </div>
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
            applicantCategory: document.getElementById('agpo_category').value,
            businessType: document.getElementById('agpo_biz_type').value,
            businessName: document.getElementById('agpo_biz_name').value,
            contactDetails: {
                phone: document.getElementById('agpo_phone').value,
                email: document.getElementById('agpo_email').value,
                address: document.getElementById('agpo_address').value
            }
        };
    },

    extractFiles() {
        const files = [];
        const cert = document.getElementById('agpo_cert').files[0];
        const kra = document.getElementById('agpo_kra').files[0];
        
        // Use custom names so the backend admin knows exactly what these are
        if (cert) files.push(new File([cert], `Registration_Cert_${cert.name}`, { type: cert.type }));
        if (kra) files.push(new File([kra], `KRA_PIN_${kra.name}`, { type: kra.type }));
        
        return files;
    }
};