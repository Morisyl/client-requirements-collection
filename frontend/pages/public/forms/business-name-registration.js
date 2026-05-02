export const BusinessNameRegistration = {
    render() {
        return `
            <div class="service-form-module" id="business-name-form">
                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Proposed Business Names</h3>
                <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 1rem;">Provide 3 options in order of preference. The registrar will approve the first available name.</p>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <label class="form-label">Option 1 (Most Preferred) *</label>
                        <input type="text" id="bn_name1" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Option 2 *</label>
                        <input type="text" id="bn_name2" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Option 3 *</label>
                        <input type="text" id="bn_name3" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Business Details</h3>
                <div style="margin-bottom: 2rem;">
                    <label class="form-label">Nature of Business / Core Activities *</label>
                    <textarea id="bn_nature" class="form-input" rows="3" required placeholder="e.g., Retail of general merchandise, IT consulting..."></textarea>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Proprietor Details & Address</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Full Name of Proprietor *</label>
                        <input type="text" id="bn_proprietor_name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">National ID / Alien ID Number *</label>
                        <input type="text" id="bn_id_number" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" id="bn_phone" class="form-input" required>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Email Address *</label>
                        <input type="email" id="bn_email" class="form-input" required>
                    </div>
                    
                    <!-- Kenya Structured Address -->
                    <div>
                        <label class="form-label">County *</label>
                        <input type="text" id="bn_county" class="form-input" required placeholder="e.g., Nairobi">
                    </div>
                    <div>
                        <label class="form-label">Town / City *</label>
                        <input type="text" id="bn_town" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">P.O. Box *</label>
                        <input type="text" id="bn_pobox" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Postal Code *</label>
                        <input type="text" id="bn_postal_code" class="form-input" required>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Building / Street / Plot Number *</label>
                        <input type="text" id="bn_building" class="form-input" required>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Required Documents</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <label class="form-label">Passport Photo (JPEG/PNG) *</label>
                        <input type="file" id="bn_passport_photo" class="form-file" accept=".jpg, .jpeg, .png" required>
                    </div>
                    <div>
                        <label class="form-label">Scanned Signature (JPEG/PNG) *</label>
                        <input type="file" id="bn_signature" class="form-file" accept=".jpg, .jpeg, .png" required>
                    </div>
                </div>
            </div>
            
            <style>
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.95rem; color: var(--color-text); }
                .form-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; transition: border-color 0.2s; }
                .form-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1); }
                .form-file { width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; }
            </style>
        `;
    },

    extractData() {
        return {
            proposedNames: [
                document.getElementById('bn_name1').value,
                document.getElementById('bn_name2').value,
                document.getElementById('bn_name3').value
            ],
            natureOfBusiness: document.getElementById('bn_nature').value,
            proprietor: {
                name: document.getElementById('bn_proprietor_name').value,
                idNumber: document.getElementById('bn_id_number').value,
                phone: document.getElementById('bn_phone').value,
                email: document.getElementById('bn_email').value
            },
            address: {
                county: document.getElementById('bn_county').value,
                town: document.getElementById('bn_town').value,
                poBox: document.getElementById('bn_pobox').value,
                postalCode: document.getElementById('bn_postal_code').value,
                building: document.getElementById('bn_building').value
            }
        };
    },
    
    extractFiles() {
        const photo = document.getElementById('bn_passport_photo').files[0];
        const signature = document.getElementById('bn_signature').files[0];
        const files = [];
        if (photo) files.push(photo);
        if (signature) files.push(signature);
        return files;
    }
};