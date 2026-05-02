/**
 * Advanced Drag-and-Drop File Upload Component
 * Features: Image previews, size/type validation, multiple files, and removal.
 */

export const FileUpload = {
    // We store the state for multiple upload zones on the same page using their IDs
    instances: {},

    /**
     * Renders the HTML structure for the dropzone.
     * @param {string} id - The unique ID for this input (e.g., 'bn_passport_photo')
     * @param {Object} options - Configuration options
     * @param {boolean} options.multiple - Allow multiple files (default: false)
     * @param {string} options.accept - Accepted MIME types/extensions (default: images + pdf + docx)
     * @param {number} options.maxSizeMB - Max size per file in MB (defaults to APP_CONFIG or 10)
     */
    render(id, options = {}) {
        const multiple = options.multiple ? 'multiple' : '';
        const accept = options.accept || '.pdf, .jpg, .jpeg, .png, .docx, application/pdf, image/jpeg, image/png, application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        // Initialize state for this instance
        this.instances[id] = {
            files: [],
            multiple: !!options.multiple,
            maxSizeMB: options.maxSizeMB || window.APP_CONFIG?.maxFileSizeMB || 10,
            accept: accept
        };

        return `
            <div class="file-upload-component" id="fuc_${id}">
                <!-- The Drop Zone -->
                <div class="drop-zone" id="drop_${id}" 
                     style="width: 100%; padding: 2rem 1rem; border: 2px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; text-align: center; cursor: pointer; transition: all 0.2s ease;">
                    
                    <input type="file" id="${id}" ${multiple} accept="${accept}" style="display: none;">
                    
                    <div style="pointer-events: none;">
                        <svg style="width: 40px; height: 40px; color: #94a3b8; margin-bottom: 1rem; display: inline-block;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p style="margin: 0; color: var(--color-text); font-weight: 500;">
                            Drag & drop files here, or <span style="color: var(--color-primary); text-decoration: underline;">browse</span>
                        </p>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; color: var(--color-text-muted);">
                            Supported: PDF, JPG, PNG, DOCX (Max ${this.instances[id].maxSizeMB}MB)
                        </p>
                    </div>
                </div>

                <!-- Error Message Container -->
                <div id="error_${id}" style="color: var(--color-danger); font-size: 0.85rem; margin-top: 0.5rem; display: none;"></div>

                <!-- Selected Files List -->
                <div class="file-list" id="list_${id}" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <!-- Files injected here -->
                </div>
            </div>
            
            <style>
                .drop-zone.dragover { background: #e0f2fe !important; border-color: var(--color-primary) !important; }
                .file-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 6px; }
                .file-item-info { display: flex; align-items: center; gap: 1rem; overflow: hidden; }
                .file-thumb { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.7rem; font-weight: bold; }
                .file-details { display: flex; flex-direction: column; }
                .file-name { font-size: 0.9rem; font-weight: 500; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
                .file-size { font-size: 0.75rem; color: var(--color-text-muted); }
                .btn-remove-file { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.5rem; border-radius: 4px; transition: background 0.2s; }
                .btn-remove-file:hover { background: #fee2e2; }
            </style>
        `;
    },

    /**
     * Initializes event listeners for the dropzone
     * @param {string} id - The unique ID used in render()
     */
    init(id) {
        if (!this.instances[id]) return;

        const dropZone = document.getElementById(`drop_${id}`);
        const fileInput = document.getElementById(id);

        if (!dropZone || !fileInput) return;

        // 1. Click to browse
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // 2. Handle File Selection via Browse
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(id, e.target.files);
            // Reset input so selecting the same file again triggers change event
            fileInput.value = ''; 
        });

        // 3. Drag and Drop Events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            this.handleFiles(id, files);
        });

        // 4. Handle File Removal (Event Delegation)
        const listContainer = document.getElementById(`list_${id}`);
        listContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-remove-file');
            if (btn) {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                this.removeFile(id, index);
            }
        });
    },

    /**
     * Validates and adds files to the internal state
     */
    handleFiles(id, fileList) {
        const instance = this.instances[id];
        const errorDiv = document.getElementById(`error_${id}`);
        errorDiv.style.display = 'none';
        let hasError = false;

        const newFiles = Array.from(fileList);

        for (const file of newFiles) {
            // Validate Size
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > instance.maxSizeMB) {
                this.showError(id, `File "${file.name}" exceeds the ${instance.maxSizeMB}MB limit.`);
                hasError = true;
                continue; // Skip this file
            }

            // If not multiple, replace the array. Otherwise, append.
            if (!instance.multiple) {
                instance.files = [file];
            } else {
                // Prevent exact duplicates by name and size
                const exists = instance.files.some(f => f.name === file.name && f.size === file.size);
                if (!exists) {
                    instance.files.push(file);
                }
            }
        }

        if (!hasError) {
            this.renderList(id);
        }
    },

    /**
     * Removes a file from the internal state
     */
    removeFile(id, index) {
        this.instances[id].files.splice(index, 1);
        this.renderList(id);
        
        // Clear errors on removal
        const errorDiv = document.getElementById(`error_${id}`);
        errorDiv.style.display = 'none';
    },

    /**
     * Renders the thumbnails and file details
     */
    renderList(id) {
        const instance = this.instances[id];
        const listContainer = document.getElementById(`list_${id}`);
        
        if (instance.files.length === 0) {
            listContainer.innerHTML = '';
            return;
        }

        let html = '';
        instance.files.forEach((file, index) => {
            const isImage = file.type.startsWith('image/');
            const thumbSrc = isImage ? URL.createObjectURL(file) : null;
            const ext = file.name.split('.').pop().toUpperCase();

            html += `
                <div class="file-item">
                    <div class="file-item-info">
                        ${isImage 
                            ? `<img src="${thumbSrc}" class="file-thumb" alt="Preview" onload="URL.revokeObjectURL(this.src)">`
                            : `<div class="file-thumb">${ext}</div>`
                        }
                        <div class="file-details">
                            <span class="file-name" title="${file.name}">${file.name}</span>
                            <span class="file-size">${this.formatBytes(file.size)}</span>
                        </div>
                    </div>
                    <button type="button" class="btn-remove-file" data-index="${index}" title="Remove file">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
        });

        listContainer.innerHTML = html;
    },

    /**
     * Utility to display temporary errors
     */
    showError(id, message) {
        const errorDiv = document.getElementById(`error_${id}`);
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    },

    /**
     * Utility to format file sizes nicely
     */
    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    /**
     * CRITICAL: Called by the parent form to retrieve the actual File objects.
     * @param {string} id - The unique ID of the component
     * @returns {File[]} An array of JavaScript File objects ready for FormData
     */
    getFiles(id) {
        return this.instances[id] ? this.instances[id].files : [];
    }
};