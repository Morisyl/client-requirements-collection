/**
 * A highly reusable Kenya Address component with cascading Selects.
 * County -> Constituency -> Ward
 */

// ─── MINI KENYA LOCATION DATABASE ──────────────────────────────────────────
// In production, you can replace this with an external fetch to a full JSON file, 
// but for performance, bundling it directly like this is often best.
const kenyaData = {
    "Nairobi": {
        "Westlands": ["Kitisuru", "Parklands/Highridge", "Karura", "Kangemi", "Mountain View"],
        "Dagoretti North": ["Kilimani", "Kawangware", "Gatina", "Kileleshwa", "Kabiro"],
        "Dagoretti South": ["Mutu-ini", "Ngando", "Riruta", "Uthiru/Ruthimitu", "Waithaka"],
        "Langata": ["Karen", "Nairobi West", "Mugumo-ini", "South C", "Nyayo Highrise"]
    },
    "Kiambu": {
        "Juja": ["Murera", "Theta", "Juja", "Witeithie", "Kalimoni"],
        "Thika Town": ["Township", "Kamenu", "Hospital", "Gatuanyaga", "Ngoliba"],
        "Ruiru": ["Gitothua", "Biashara", "Gatongora", "Kahawa Sukari", "Kahawa Wendani", "Kiuu", "Mwiki", "Mwihoko"],
        "Kiambu": ["Ting'ang'a", "Ndumberi", "Riabai", "Township"]
    },
    "Mombasa": {
        "Mvita": ["Mji wa Kale/Makadara", "Tudor", "Tononoka", "Shimanzi/Ganjoni", "Majengo"],
        "Nyali": ["Frere Town", "Ziwa La Ng'ombe", "Mkomani", "Kongowea", "Kadzandani"],
        "Likoni": ["Mtongwe", "Shika Adabu", "Bofu", "Likoni", "Timbwani"]
    }
    // ... Add the rest of the 47 counties here
};

export const AddressField = {
    /**
     * Renders the HTML for the address block.
     * @param {string} prefix - A unique ID prefix (e.g., "client", "director_1") to allow multiple on one page.
     * @param {boolean} required - Whether the fields should have the 'required' attribute.
     */
    render(prefix = 'addr', required = true) {
        const reqAttr = required ? 'required' : '';
        const reqMark = required ? ' <span style="color: var(--color-danger);">*</span>' : '';

        // Generate the County Options alphabetically
        const countyOptions = Object.keys(kenyaData)
            .sort()
            .map(county => `<option value="${county}">${county}</option>`)
            .join('');

        return `
            <div class="kenya-address-block" id="${prefix}_wrapper" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                
                <div>
                    <label class="form-label" style="font-size: 0.85rem;">County${reqMark}</label>
                    <select id="${prefix}_county" class="form-input addr-county" data-prefix="${prefix}" ${reqAttr} style="background: white;">
                        <option value="">-- Select County --</option>
                        ${countyOptions}
                    </select>
                </div>

                <div>
                    <label class="form-label" style="font-size: 0.85rem;">Constituency${reqMark}</label>
                    <select id="${prefix}_constituency" class="form-input addr-const" data-prefix="${prefix}" ${reqAttr} disabled style="background: #f1f5f9; cursor: not-allowed;">
                        <option value="">-- Select County First --</option>
                    </select>
                </div>

                <div>
                    <label class="form-label" style="font-size: 0.85rem;">Ward${reqMark}</label>
                    <select id="${prefix}_ward" class="form-input addr-ward" data-prefix="${prefix}" ${reqAttr} disabled style="background: #f1f5f9; cursor: not-allowed;">
                        <option value="">-- Select Constituency First --</option>
                    </select>
                </div>

                <div>
                    <label class="form-label" style="font-size: 0.85rem;">Postal Code / Zip</label>
                    <input type="text" id="${prefix}_postal" class="form-input" placeholder="e.g., 00100" style="background: white;">
                </div>

                <div style="grid-column: 1 / -1;">
                    <label class="form-label" style="font-size: 0.85rem;">Street / Building / Plot Number${reqMark}</label>
                    <input type="text" id="${prefix}_building" class="form-input" placeholder="e.g., 4th Floor, KICC Building, Harambee Ave" ${reqAttr} style="background: white;">
                </div>
                
            </div>
        `;
    },

    /**
     * Attaches the cascading event listeners to the specific prefix instance.
     * Call this inside your parent component's init() or setupListeners() method.
     * @param {string} prefix - The same unique ID prefix used in render()
     */
    init(prefix = 'addr') {
        const countySelect = document.getElementById(`${prefix}_county`);
        const constSelect = document.getElementById(`${prefix}_constituency`);
        const wardSelect = document.getElementById(`${prefix}_ward`);

        if (!countySelect || !constSelect || !wardSelect) return;

        // 1. Listen for County Change
        countySelect.addEventListener('change', (e) => {
            const selectedCounty = e.target.value;
            
            // Reset downstream selects
            wardSelect.innerHTML = '<option value="">-- Select Constituency First --</option>';
            wardSelect.disabled = true;
            wardSelect.style.background = '#f1f5f9';
            wardSelect.style.cursor = 'not-allowed';

            if (selectedCounty && kenyaData[selectedCounty]) {
                const constituencies = Object.keys(kenyaData[selectedCounty]).sort();
                
                constSelect.innerHTML = '<option value="">-- Select Constituency --</option>' + 
                    constituencies.map(c => `<option value="${c}">${c}</option>`).join('');
                
                constSelect.disabled = false;
                constSelect.style.background = 'white';
                constSelect.style.cursor = 'pointer';
            } else {
                constSelect.innerHTML = '<option value="">-- Select County First --</option>';
                constSelect.disabled = true;
                constSelect.style.background = '#f1f5f9';
                constSelect.style.cursor = 'not-allowed';
            }
        });

        // 2. Listen for Constituency Change
        constSelect.addEventListener('change', (e) => {
            const selectedCounty = countySelect.value;
            const selectedConst = e.target.value;

            if (selectedCounty && selectedConst && kenyaData[selectedCounty][selectedConst]) {
                const wards = kenyaData[selectedCounty][selectedConst].sort();
                
                wardSelect.innerHTML = '<option value="">-- Select Ward --</option>' + 
                    wards.map(w => `<option value="${w}">${w}</option>`).join('');
                
                wardSelect.disabled = false;
                wardSelect.style.background = 'white';
                wardSelect.style.cursor = 'pointer';
            } else {
                wardSelect.innerHTML = '<option value="">-- Select Constituency First --</option>';
                wardSelect.disabled = true;
                wardSelect.style.background = '#f1f5f9';
                wardSelect.style.cursor = 'not-allowed';
            }
        });
    },

    /**
     * Extracts the data from the component into a clean JSON object.
     * @param {string} prefix - The unique ID prefix used for this instance.
     * @returns {Object} { county, constituency, ward, building, postalCode }
     */
    extractData(prefix = 'addr') {
        return {
            county: document.getElementById(`${prefix}_county`)?.value || '',
            constituency: document.getElementById(`${prefix}_constituency`)?.value || '',
            ward: document.getElementById(`${prefix}_ward`)?.value || '',
            building: document.getElementById(`${prefix}_building`)?.value || '',
            postalCode: document.getElementById(`${prefix}_postal`)?.value || ''
        };
    }
};