export const ProgressBar = {
    // Define the steps exactly as requested
    steps: [
        { id: 1, label: 'Select Service' },
        { id: 2, label: 'Fill Details' },
        { id: 3, label: 'Consent & Submit' }
    ],

    /**
     * Renders the progress bar HTML based on the current active step.
     * @param {number} currentStep - The ID of the currently active step (1, 2, or 3)
     */
    render(currentStep = 2) {
        // Calculate the width of the connecting line background
        const totalSegments = this.steps.length - 1;
        const activeSegments = currentStep - 1;
        const progressPercentage = (activeSegments / totalSegments) * 100;

        return `
            <div class="progress-bar-component" style="max-width: 600px; margin: 0 auto 3rem auto; padding: 0 1rem;">
                <div style="position: relative; display: flex; justify-content: space-between; align-items: flex-start;">
                    
                    <!-- Background Connecting Line -->
                    <div style="position: absolute; top: 18px; left: 10%; right: 10%; height: 4px; background: #e2e8f0; z-index: 1; border-radius: 2px;">
                        <!-- Active Filled Line -->
                        <div style="height: 100%; background: var(--color-primary); width: ${progressPercentage}%; transition: width 0.4s ease; border-radius: 2px;"></div>
                    </div>

                    <!-- Step Indicators -->
                    ${this.steps.map(step => {
                        const isCompleted = currentStep > step.id;
                        const isActive = currentStep === step.id;
                        
                        // Default styling (Pending)
                        let bgColor = '#f8fafc';
                        let textColor = 'var(--color-text-muted)';
                        let borderColor = '#cbd5e1';
                        let icon = step.id;

                        // Completed styling
                        if (isCompleted) {
                            bgColor = 'var(--color-primary)';
                            textColor = 'white';
                            borderColor = 'var(--color-primary)';
                            icon = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`;
                        } 
                        // Active styling
                        else if (isActive) {
                            bgColor = 'var(--color-primary)';
                            textColor = 'white';
                            borderColor = 'var(--color-primary-light)';
                        }

                        return `
                            <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; width: 33%; text-align: center;">
                                
                                <!-- Circle Node -->
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${bgColor}; color: ${textColor}; 
                                            display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem;
                                            border: 4px solid var(--color-background); box-shadow: 0 0 0 2px ${borderColor};
                                            transition: all 0.3s ease; margin-bottom: 0.75rem;">
                                    ${icon}
                                </div>
                                
                                <!-- Label -->
                                <span style="font-size: 0.85rem; font-weight: ${isActive ? 'bold' : '500'}; color: ${isActive || isCompleted ? 'var(--color-text)' : 'var(--color-text-muted)'}; line-height: 1.3;">
                                    ${step.label}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
};