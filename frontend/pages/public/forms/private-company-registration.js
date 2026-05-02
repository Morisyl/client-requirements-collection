export const PrivateCompanyRegistration = {
    render() {
        return `
            <div class="service-form-module" id="company-form">
                
                <!-- Company Name & Basic Info -->
                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Company Name & Basics</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Preferred Suffix *</label>
                        <select id="pc_suffix" class="form-input" required>
                            <option value="LIMITED">LIMITED</option>
                            <option value="LTD">LTD</option>
                        </select>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Proposed Names (Provide 3) *</label>
                        <input type="text" id="pc_name1" class="form-input" placeholder="Option 1" required style="margin-bottom: 0.5rem;">
                        <input type="text" id="pc_name2" class="form-input" placeholder="Option 2" required style="margin-bottom: 0.5rem;">
                        <input type="text" id="pc_name3" class="form-input" placeholder="Option 3" required>
                    </div>
                    <div>
                        <label class="form-label">Company Official Phone *</label>
                        <input type="tel" id="pc_phone" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Company Official Email *</label>
                        <input type="email" id="pc_email" class="form-input" required>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Registered Office Address *</label>
                        <textarea id="pc_address" class="form-input" rows="2" placeholder="Include County, Building, P.O Box..." required></textarea>
                    </div>
                </div>

                <!-- Shares Configuration -->
                <h3 style="margin-bottom: 1.5rem; color: var(--color-text); border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem;">Share Capital Configuration</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem; background: #f8fafc; padding: 1rem; border-radius: 6px;">
                    <div>
                        <label class="form-label">Total Shares *</label>
                        <input type="number" id="pc_total_shares" class="form-input" value="1000" required>
                    </div>
                    <div>
                        <label class="form-label">Ordinary Shares *</label>
                        <input type="number" id="pc_ordinary_shares" class="form-input" value="1000" required>
                    </div>
                    <div>
                        <label class="form-label">Preference Shares</label>
                        <input type="number" id="pc_preference_shares" class="form-input" value="0">
                    </div>
                </div>

                <!-- Directors Array -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                    <h3 style="color: var(--color-text); margin: 0;">Directors Details</h3>
                    <button type="button" id="btn_add_director" style="padding: 0.4rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">+ Add Director</button>
                </div>
                <div id="directors_container" style="margin-bottom: 2rem;">
                    <!-- Directors injected here by JS -->
                </div>

                <!-- Shareholders Array -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--color-primary-light); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                    <h3 style="color: var(--color-text); margin: 0;">Shareholders</h3>
                    <button type="button" id="btn_add_shareholder" style="padding: 0.4rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">+ Add Shareholder</button>
                </div>
                <div id="shareholders_container" style="margin-bottom: 2rem;">
                    <!-- Shareholders injected here by JS -->
                </div>
                
            </div>
            
            <style>
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.95rem; color: var(--color-text); }
                .form-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; }
                .form-file { width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 6px; background: white; }
                .repeater-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; position: relative; }
                .btn-remove { position: absolute; top: 1rem; right: 1rem; background: var(--color-danger); color: white; border: none; border-radius: 4px; padding: 0.2rem 0.5rem; cursor: pointer; font-size: 0.8rem; }
            </style>
        `;
    },

    setupListeners() {
        // Initialize with at least 1 Director and 1 Shareholder
        this.addDirector();
        this.addShareholder();

        document.getElementById('btn_add_director').addEventListener('click', () => this.addDirector());
        document.getElementById('btn_add_shareholder').addEventListener('click', () => this.addShareholder());
    },

    addDirector() {
        const container = document.getElementById('directors_container');
        const count = container.children.length + 1;
        const id = Date.now(); // Unique ID for file inputs mapping
        
        const html = `
            <div class="repeater-card director-entry" id="director_${id}">
                ${count > 1 ? `<button type="button" class="btn-remove" onclick="document.getElementById('director_${id}').remove()">Remove</button>` : ''}
                <h4 style="margin-top: 0; margin-bottom: 1rem;">Director ${count}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Full Name *</label>
                        <input type="text" class="form-input dir-name" required>
                    </div>
                    <div>
                        <label class="form-label">ID / Passport Number *</label>
                        <input type="text" class="form-input dir-id" required>
                    </div>
                    <div>
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" class="form-input dir-phone" required>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Email Address *</label>
                        <input type="email" class="form-input dir-email" required>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label class="form-label">Residential Address *</label>
                        <input type="text" class="form-input dir-address" required>
                    </div>
                    <div>
                        <label class="form-label">Passport Photo (JPEG/PNG) *</label>
                        <input type="file" class="form-file dir-photo" accept=".jpg, .jpeg, .png" required>
                    </div>
                    <div>
                        <label class="form-label">Scanned Signature (JPEG/PNG) *</label>
                        <input type="file" class="form-file dir-signature" accept=".jpg, .jpeg, .png" required>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    addShareholder() {
        const container = document.getElementById('shareholders_container');
        const count = container.children.length + 1;
        const id = Date.now();
        
        const html = `
            <div class="repeater-card shareholder-entry" id="shareholder_${id}">
                ${count > 1 ? `<button type="button" class="btn-remove" onclick="document.getElementById('shareholder_${id}').remove()">Remove</button>` : ''}
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="form-label">Shareholder Name *</label>
                        <input type="text" class="form-input sh-name" required>
                    </div>
                    <div>
                        <label class="form-label">Number of Shares *</label>
                        <input type="number" class="form-input sh-shares" required>
                    </div>
                    <div>
                        <label class="form-label">Share Class *</label>
                        <select class="form-input sh-class" required>
                            <option value="Ordinary">Ordinary</option>
                            <option value="Preference">Preference</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    extractData() {
        // Map over all director DOM nodes to build the JSON array
        const directors = Array.from(document.querySelectorAll('.director-entry')).map(node => ({
            name: node.querySelector('.dir-name').value,
            idNumber: node.querySelector('.dir-id').value,
            phone: node.querySelector('.dir-phone').value,
            email: node.querySelector('.dir-email').value,
            address: node.querySelector('.dir-address').value,
            // We don't put files in JSON; we track their names for backend mapping if needed
            photoFileName: node.querySelector('.dir-photo').files[0]?.name,
            signatureFileName: node.querySelector('.dir-signature').files[0]?.name
        }));

        // Map over shareholders
        const shareholders = Array.from(document.querySelectorAll('.shareholder-entry')).map(node => ({
            name: node.querySelector('.sh-name').value,
            shares: parseInt(node.querySelector('.sh-shares').value, 10),
            shareClass: node.querySelector('.sh-class').value
        }));

        return {
            proposedNames: [
                document.getElementById('pc_name1').value,
                document.getElementById('pc_name2').value,
                document.getElementById('pc_name3').value
            ],
            preferredSuffix: document.getElementById('pc_suffix').value,
            registeredOfficeAddress: document.getElementById('pc_address').value,
            companyPhone: document.getElementById('pc_phone').value,
            companyEmail: document.getElementById('pc_email').value,
            sharesConfig: {
                totalShares: parseInt(document.getElementById('pc_total_shares').value, 10),
                ordinaryShares: parseInt(document.getElementById('pc_ordinary_shares').value, 10),
                preferenceShares: parseInt(document.getElementById('pc_preference_shares').value, 10) || 0
            },
            directors,
            shareholders
        };
    },

    extractFiles() {
        const files = [];
        // Extract files from every director entry
        document.querySelectorAll('.director-entry').forEach(node => {
            const photo = node.querySelector('.dir-photo').files[0];
            const sig = node.querySelector('.dir-signature').files[0];
            if (photo) files.push(photo);
            if (sig) files.push(sig);
        });
        return files;
    }
};