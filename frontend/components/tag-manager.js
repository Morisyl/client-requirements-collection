import { API } from '../js/api.js';
import { Toast } from '../js/toast.js';

export const TagManager = {
    // Store state for multiple instances (if you ever need more than one per page)
    instances: {},

    // Our curated, professional colour palette
    palette: [
        { hex: '#ef4444', name: 'Red' },
        { hex: '#f97316', name: 'Orange' },
        { hex: '#eab308', name: 'Yellow' },
        { hex: '#10b981', name: 'Green' },
        { hex: '#3b82f6', name: 'Blue' },
        { hex: '#8b5cf6', name: 'Purple' }
    ],

    /**
     * Renders the HTML structure for the Tag Manager.
     * @param {string} submissionId - The database ID of the submission.
     * @param {Array} initialTags - Array of existing tag objects: { name, color }.
     */
    render(submissionId, initialTags = []) {
        // Initialize state for this submission
        this.instances[submissionId] = {
            tags: initialTags || [],
            selectedColor: this.palette[4].hex // Default to Blue
        };

        return `
            <div class="tag-manager-component" id="tm_${submissionId}">
                
                <div id="tm_list_${submissionId}" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; min-height: 28px;">
                    </div>

                <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                    
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 500; color: var(--color-text);">Add New Tag</label>
                    
                    <div style="display: flex; gap: 0.5rem; align-items: stretch; margin-bottom: 0.75rem;">
                        <input type="text" id="tm_input_${submissionId}" placeholder="e.g., Urgent, Missing Docs..." 
                               style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; font-family: inherit;">
                        
                        <button type="button" id="tm_btn_add_${submissionId}" 
                                style="padding: 0 1rem; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem; transition: opacity 0.2s;">
                            Add
                        </button>
                    </div>

                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-right: 0.5rem;">Colour:</span>
                        <div id="tm_palette_${submissionId}" style="display: flex; gap: 0.4rem;">
                            ${this.palette.map(color => `
                                <button type="button" class="tm-color-swatch" data-id="${submissionId}" data-color="${color.hex}" title="${color.name}"
                                        style="width: 24px; height: 24px; border-radius: 50%; background-color: ${color.hex}; border: 2px solid ${color.hex === this.instances[submissionId].selectedColor ? 'var(--color-text)' : 'transparent'}; cursor: pointer; transition: transform 0.1s;">
                                </button>
                            `).join('')}
                        </div>
                    </div>

                </div>
            </div>

            <style>
                .tm-tag-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: bold; color: white; transition: opacity 0.2s; }
                .tm-btn-remove { background: none; border: none; color: white; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1; opacity: 0.7; border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; }
                .tm-btn-remove:hover { opacity: 1; background: rgba(0,0,0,0.1); }
                .tm-color-swatch:hover { transform: scale(1.1); }
            </style>
        `;
    },

    /**
     * Initializes the DOM elements and event listeners.
     */
    init(submissionId) {
        if (!this.instances[submissionId]) return;

        this.renderTagsList(submissionId);

        const input = document.getElementById(`tm_input_${submissionId}`);
        const btnAdd = document.getElementById(`tm_btn_add_${submissionId}`);
        const paletteContainer = document.getElementById(`tm_palette_${submissionId}`);
        const tagsContainer = document.getElementById(`tm_list_${submissionId}`);

        // 1. Color Palette Selection
        paletteContainer.addEventListener('click', (e) => {
            const swatch = e.target.closest('.tm-color-swatch');
            if (swatch) {
                const color = swatch.getAttribute('data-color');
                this.instances[submissionId].selectedColor = color;
                
                // Update UI selection ring
                paletteContainer.querySelectorAll('.tm-color-swatch').forEach(el => {
                    el.style.borderColor = el.getAttribute('data-color') === color ? 'var(--color-text)' : 'transparent';
                });
            }
        });

        // 2. Add Tag Event
        const handleAdd = async () => {
            const tagName = input.value.trim();
            if (!tagName) return;

            // Prevent exact duplicates locally first
            if (this.instances[submissionId].tags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
                Toast.error('Tag already exists.');
                return;
            }

            const color = this.instances[submissionId].selectedColor;

            // UI Loading state
            btnAdd.disabled = true;
            btnAdd.style.opacity = '0.7';
            btnAdd.textContent = '...';

            try {
                // Backend Call
                const response = await API.addTag(submissionId, tagName, color);
                
                if (response.success) {
                    // Update local state and re-render
                    this.instances[submissionId].tags.push({ name: tagName, color: color });
                    this.renderTagsList(submissionId);
                    input.value = ''; // Clear input
                } else {
                    Toast.error(response.message || 'Failed to add tag');
                }
            } catch (err) {
                console.error(err);
                Toast.error('Network error while adding tag.');
            } finally {
                btnAdd.disabled = false;
                btnAdd.style.opacity = '1';
                btnAdd.textContent = 'Add';
            }
        };

        btnAdd.addEventListener('click', handleAdd);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAdd();
        });

        // 3. Remove Tag Event (Event Delegation)
        tagsContainer.addEventListener('click', async (e) => {
            const btnRemove = e.target.closest('.tm-btn-remove');
            if (!btnRemove) return;

            const tagName = btnRemove.getAttribute('data-tag');
            
            // Visual feedback - fade the tag out immediately
            const pill = btnRemove.closest('.tm-tag-pill');
            pill.style.opacity = '0.5';

            try {
                // Backend Call
                const response = await API.removeTag(submissionId, tagName);
                
                if (response.success) {
                    // Update local state and re-render
                    this.instances[submissionId].tags = this.instances[submissionId].tags.filter(t => t.name !== tagName);
                    this.renderTagsList(submissionId);
                } else {
                    pill.style.opacity = '1'; // Revert visual state
                    Toast.error(response.message || 'Failed to remove tag');
                }
            } catch (err) {
                pill.style.opacity = '1';
                Toast.error('Network error while removing tag.');
            }
        });
    },

    /**
     * Re-renders just the pill elements based on current state
     */
    renderTagsList(submissionId) {
        const container = document.getElementById(`tm_list_${submissionId}`);
        const tags = this.instances[submissionId].tags;

        if (!container) return;

        if (tags.length === 0) {
            container.innerHTML = '<span style="font-size: 0.8rem; color: var(--color-text-muted); font-style: italic; align-self: center;">No tags applied.</span>';
            return;
        }

        container.innerHTML = tags.map(tag => `
            <div class="tm-tag-pill" style="background-color: ${tag.color || '#3b82f6'};">
                ${tag.name}
                <button type="button" class="tm-btn-remove" data-tag="${tag.name}" aria-label="Remove tag">
                    &times;
                </button>
            </div>
        `).join('');
    }
};