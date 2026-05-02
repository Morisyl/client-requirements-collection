/**
 * Toast Notification System
 * Displays temporary notification messages to users
 */

export const Toast = {
    /**
     * Show a success toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show (ms), default 3000
     */
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },

    /**
     * Show an error toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show (ms), default 5000
     */
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },

    /**
     * Show an info toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show (ms), default 3000
     */
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    },

    /**
     * Core toast display logic
     * @param {string} message - The message text
     * @param {string} type - 'success' | 'error' | 'info'
     * @param {number} duration - Display duration in milliseconds
     */
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.error('Toast container not found in DOM');
            return;
        }

        // Create the toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button style="background: transparent; border: none; color: white; cursor: pointer; font-size: 1.2rem; padding: 0 0 0 1rem;" 
                    onclick="this.parentElement.remove()">×</button>
        `;

        // Add to container
        container.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300); // Wait for fade animation
        }, duration);
    }
};