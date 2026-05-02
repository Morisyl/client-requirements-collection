import { API } from '../js/api.js';
import { Toast } from '../js/toast.js';

export const StatusSelect = {
    // ─── STATE MACHINE DEFINITION ──────────────────────────────────────────
    // Defines exactly which statuses a submission can transition into
    transitions: {
        'pending': ['in_review', 'rejected'],
        'in_review': ['completed', 'rejected', 'pending'],
        'completed': [], // Terminal state (cannot be changed once completed)
        'rejected': ['pending'] // Can only be reopened by moving back to pending
    },

    // UI Configuration for statuses
    config: {
        'pending': { label: 'Pending', color: 'var(--color-warning, #d97706)' },
        'in_review': { label: 'In Review', color: '#0284c7' },
        'completed': { label: 'Completed', color: 'var(--color-success, #16a34a)' },
        'rejected': { label: 'Rejected', color: 'var(--color-danger, #dc2626)' }
    },

    // Store state for specific instances
    instances: {},

    /**
     * Renders the Dropdown HTML
     * @param {string} submissionId - The DB ID of the submission
     * @param {string} currentStatus - The current status string
     */
    render(submissionId, currentStatus) {
        // Fallback in case of bad data
        const status = this.config[currentStatus] ? currentStatus : 'pending';
        
        // Save instance state
        this.instances[submissionId] = {
            currentStatus: status
        };

        return `
            <div class="status-select-component" id="ssc_${submissionId}">
                <select id="ss_dropdown_${submissionId}" 
                        style="width: 100%; padding: 0.75rem; border: 2px solid ${this.config[status].color}; color: ${this.config[status].color}; border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s; background: white;">
                    ${this.generateOptions(status)}
                </select>
                <div id="ss_loader_${submissionId}" style="display: none; font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.4rem;">
                    Updating status...
                </div>
            </div>
        `;
    },

    /**
     * Generates the <option> elements based on the state machine
     */
    generateOptions(currentStatus) {
        const allowedTransitions = this.transitions[currentStatus] || [];
        
        // Always show the current status as the first/selected option
        let html = `<option value="${currentStatus}" selected>${this.config[currentStatus].label}</option>`;
        
        // If there are no allowed transitions, it's a terminal state
        if (allowedTransitions.length === 0) {
            return html; // Select will only have one option
        }

        // Add the allowed next steps
        allowedTransitions.forEach(opt => {
            html += `<option value="${opt}">${this.config[opt].label}</option>`;
        });

        return html;
    },

    /**
     * Attaches event listeners and handles the API call
     * @param {string} submissionId - The ID passed to render()
     * @param {Function} onSuccessCallback - Optional callback to trigger parent UI updates
     */
    init(submissionId, onSuccessCallback = null) {
        const select = document.getElementById(`ss_dropdown_${submissionId}`);
        const loader = document.getElementById(`ss_loader_${submissionId}`);

        if (!select) return;

        // If it's a terminal state (no other options), disable the dropdown
        if (select.options.length <= 1) {
            select.disabled = true;
            select.style.cursor = 'not-allowed';
            select.style.opacity = '0.8';
            select.style.background = '#f8fafc';
            return;
        }

        select.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            const previousStatus = this.instances[submissionId].currentStatus;

            // UI Feedback (Loading)
            select.disabled = true;
            select.style.opacity = '0.5';
            loader.style.display = 'block';

            try {
                // Call Express Backend
                const response = await API.updateStatus(submissionId, newStatus);

                if (response.success) {
                    Toast.success(`Status updated to ${this.config[newStatus].label}`);
                    
                    // Update internal state
                    this.instances[submissionId].currentStatus = newStatus;
                    
                    // Refresh the dropdown options to enforce the NEW state machine rules
                    select.innerHTML = this.generateOptions(newStatus);
                    
                    // Update dropdown colors
                    select.style.borderColor = this.config[newStatus].color;
                    select.style.color = this.config[newStatus].color;

                    // If terminal state reached, disable it
                    if (this.transitions[newStatus].length === 0) {
                        select.disabled = true;
                        select.style.cursor = 'not-allowed';
                        select.style.background = '#f8fafc';
                    }

                    // Trigger parent callback if provided (e.g., to update a timeline)
                    if (onSuccessCallback) onSuccessCallback(newStatus);
                    
                } else {
                    throw new Error(response.message || 'Failed to update status');
                }
            } catch (error) {
                console.error("Status Update Error:", error);
                Toast.error('Failed to update status. Please try again.');
                
                // Revert UI on failure
                select.value = previousStatus;
            } finally {
                // Reset loading state (unless disabled by terminal state)
                if (this.transitions[this.instances[submissionId].currentStatus].length > 0) {
                    select.disabled = false;
                    select.style.opacity = '1';
                }
                loader.style.display = 'none';
            }
        });
    }
};