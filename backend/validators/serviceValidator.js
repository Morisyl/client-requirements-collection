const Joi = require('joi');

// The single source of truth for allowed form field types
const ALLOWED_FIELD_TYPES = [
    'text', 'email', 'phone', 'textarea', 
    'select', 'file', 'address', 'number', 'section',
    'id_number', 'image', 'pdf' // ← Added new types here
];

/**
 * Schema for a single dynamic field within the service builder
 */
const fieldSchema = Joi.object({
    name: Joi.string()
        .trim()
        .pattern(/^[a-zA-Z0-9_]+$/) // Ensure it's a safe object key (no spaces/special chars)
        .required()
        .messages({
            'string.pattern.base': 'Field name can only contain letters, numbers, and underscores.',
            'any.required': 'Field name is required as a unique identifier.'
        }),
        
    label: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Every field must have a display label.'
        }),

    type: Joi.string()
        .valid(...ALLOWED_FIELD_TYPES)
        .required()
        .messages({
            'any.only': `Field type must be one of: ${ALLOWED_FIELD_TYPES.join(', ')}.`
        }),

    required: Joi.boolean()
        .default(false),
        
    group_name: Joi.string()
        .trim()
        .allow('', null)
        .default('General'),
        
    group_repeatable: Joi.boolean()
        .default(false),

    // Conditionally validate 'options' based on the 'type' value
    options: Joi.array()
        .items(Joi.string().trim().min(1))
        .when('type', {
            is: 'select',
            then: Joi.array().min(1).required().messages({
                'array.min': 'Select fields must have at least one option to choose from.',
                'any.required': 'The options array is required when the field type is "select".'
            }),
            otherwise: Joi.forbidden().messages({
                'any.unknown': 'The options array is only allowed for "select" field types.'
            })
        })
});

/**
 * Validation Schema for creating or updating a Service
 */
const serviceSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Service name cannot be empty.',
            'string.min': 'Service name must be at least 3 characters long.'
        }),
        
    label: Joi.string()
        .trim()
        .allow('', null),

    description: Joi.string()
        .trim()
        .allow('', null) // Optional
        .max(500),

    price_tier: Joi.string()
        .trim()
        .allow('', null),

    is_active: Joi.boolean()
        .default(true),

    fields: Joi.array()
        .items(fieldSchema)
        .min(0) // ← allow empty for now (so services can be saved before fields are added)
        .unique((a, b) => a.name === b.name) // Ensure no duplicate keys in the same form
        .default([])
        .messages({
            'array.unique': 'Duplicate field names detected. Each field "name" must be unique.'
        }),
        
    service_key: Joi.string()
        .trim()
        .pattern(/^[a-z0-9_]+$/)
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.pattern.base': 'Service key can only contain lowercase letters, numbers, and underscores.',
            'any.required': 'Service key is required.'
        }),

    icon_name: Joi.string()
        .trim()
        .allow('', null)
        .default('Document'),    
});

/**
 * Validates the service payload
 * @param {Object} data - The req.body content from the admin dashboard
 * @param {boolean} isUpdate - If true, makes all top-level fields optional
 * @returns {Object} - { isValid: boolean, errors: Object|null, data: Object }
 */
const validateServicePayload = (data, isUpdate = false) => {
    // If it's an update (PUT/PATCH), we don't require every field, just validate the ones provided
    const schemaToUse = isUpdate ? serviceSchema.fork(Object.keys(serviceSchema.describe().keys), (schema) => schema.optional()) : serviceSchema;

    const { error, value } = schemaToUse.validate(data, { 
        abortEarly: false, 
        stripUnknown: true 
    });

    if (error) {
        const errorDetails = {};
        error.details.forEach(detail => {
            // Flatten the path array (e.g., fields.0.options -> fields_0_options)
            const key = detail.path.join('_'); 
            errorDetails[key] = detail.message;
        });

        return { isValid: false, errors: errorDetails };
    }

    return { isValid: true, data: value };
};

module.exports = {
    validateServicePayload
};