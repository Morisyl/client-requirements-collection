const Joi = require('joi');

/**
 * Kenyan Phone Number Regex:
 * Matches:
 * - +254 7XXXXXXXX
 * - +254 1XXXXXXXX
 * - 07XXXXXXXX
 * - 01XXXXXXXX
 */
const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;

/**
 * Validation Schema for a new submission
 */
const submissionSchema = Joi.object({
    client_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Client name is required.',
            'string.max': 'Name cannot exceed 100 characters.'
        }),

    client_email: Joi.string()
        .trim()
        .email({ tlds: { allow: false } }) // Flexible TLD check
        .required()
        .messages({
            'string.email': 'Please provide a valid email address.',
            'string.empty': 'Email is required.'
        }),

    client_phone: Joi.string()
        .trim()
        .regex(kenyanPhoneRegex)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid Kenyan phone number (e.g., 0712345678 or +254712345678).',
            'string.empty': 'Phone number is required.'
        }),

    service_type: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'Please select a service type.'
        }),

    // form_data is dynamic, but we ensure it's a non-empty object
    form_data: Joi.object()
        .min(1)
        .required()
        .messages({
            'object.min': 'Form details cannot be empty.',
            'any.required': 'Service-specific details are required.'
        }),

    // Consent records must be explicitly true
    consent: Joi.object({
        agreed_to_terms: Joi.boolean()
            .valid(true)
            .required()
            .messages({ 'any.only': 'You must agree to the Terms of Service.' }),
        
        agreed_to_privacy: Joi.boolean()
            .valid(true)
            .required()
            .messages({ 'any.only': 'You must agree to the Privacy Policy.' }),

        // Metadata fields for audit trailing
        ip_address: Joi.string().optional(),
        user_agent: Joi.string().optional()
    }).required()
});

/**
 * Main validation function
 * @param {Object} data - The req.body content
 * @returns {Object} - { isValid: boolean, errors: Object|null }
 */
const validateNewSubmission = (data) => {
    const { error, value } = submissionSchema.validate(data, { 
        abortEarly: false, // Return all errors, not just the first one
        stripUnknown: true // Remove fields not defined in the schema
    });

    if (error) {
        // Transform Joi's complex error object into a simple key-value map for the frontend
        const errorDetails = {};
        error.details.forEach(detail => {
            // e.g., errorDetails['client_phone'] = "Please provide a valid Kenyan phone number"
            const key = detail.path.join('_'); 
            errorDetails[key] = detail.message;
        });

        return { isValid: false, errors: errorDetails };
    }

    return { isValid: true, data: value };
};

module.exports = {
    validateNewSubmission
};