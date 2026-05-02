const { insertRow, fetchRows, updateRow } = require('../config/supabase');
const { validateServicePayload } = require('../validators/serviceValidator');

// ==========================================
// 🟢 PUBLIC CONTROLLER
// ==========================================

/**
 * GET /api/services
 * Retrieves all active services and their field schemas for the frontend.
 */
const getActiveServices = async (req, res, next) => {
    try {
        // Fetch only active services and sort them by creation date or an order index
        const services = await fetchRows('admin_services', { is_active: true }, { order: { column: 'created_at', ascending: true } });

        res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 🔴 ADMIN CONTROLLERS
// ==========================================

const getServiceById = async (req, res, next) => {
    try {
        const serviceId = req.params.id;
        const records = await fetchRows('admin_services', { id: serviceId });

        if (!records || records.length === 0) {
            const error = new Error('Service not found.');
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({ success: true, data: records[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/services
 * Creates a new service definition.
 */
const createService = async (req, res, next) => {
    try {
        // 1. Validate the incoming payload using the Joi schema
        const { isValid, errors, data: cleanData } = validateServicePayload(req.body);
        
        if (!isValid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            return next(error);
        }

        // 2. Insert into database (Fixed to include icon_name and label)
        const newService = await insertRow('admin_services', {
            service_key: cleanData.service_key,
            name: cleanData.name,
            label: cleanData.label || cleanData.name,
            description: cleanData.description || null,
            price_tier: cleanData.price_tier || null,
            icon_name: cleanData.icon_name || 'Document', 
            fields: cleanData.fields || [], // This holds our flattened groups + metadata
            is_active: cleanData.is_active !== undefined ? cleanData.is_active : true
        });

        res.status(201).json({
            success: true,
            message: 'Service created successfully.',
            data: newService
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/services/:id
 * Updates an existing service, ensuring structural changes don't corrupt historical submissions.
 */
const updateService = async (req, res, next) => {
    try {
        const serviceId = req.params.id;

        // 1. Validate the partial payload (passing true for isUpdate)
        const { isValid, errors, data: cleanData } = validateServicePayload(req.body, true);
        
        if (!isValid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            return next(error);
        }

        // 2. Fetch the existing service to check for conflicts
        const existingRecords = await fetchRows('admin_services', { id: serviceId });
        if (!existingRecords || existingRecords.length === 0) {
            const error = new Error('Service not found.');
            error.statusCode = 404;
            return next(error);
        }
        const existingService = existingRecords[0];

        // 3. Check for structural conflicts if 'fields' are being updated
        if (cleanData.fields) {
            // Check if there are existing submissions using this service
            const existingSubmissions = await fetchRows('submissions', { service_type: existingService.service_key }, { limit: 1 });
            
            if (existingSubmissions && existingSubmissions.length > 0) {
                // To prevent data corruption, we check if the admin removed any existing field names
                const oldFieldNames = existingService.fields.map(f => f.name);
                const newFieldNames = cleanData.fields.map(f => f.name);

                const missingFields = oldFieldNames.filter(oldName => !newFieldNames.includes(oldName));

                if (missingFields.length > 0) {
                    const error = new Error(`Cannot remove fields [${missingFields.join(', ')}] because existing submissions rely on them. Please soft-delete this service and create a new version instead.`);
                    error.statusCode = 409; // 409 Conflict
                    return next(error);
                }
            }
        }

        // 4. Safely map the update payload to prevent Postgres column errors 
        // (This strips out any virtual arrays like 'fieldGroups' if they slipped through)
        const updatePayload = {
            name: cleanData.name,
            label: cleanData.label,
            description: cleanData.description,
            price_tier: cleanData.price_tier,
            icon_name: cleanData.icon_name,
            fields: cleanData.fields,
            is_active: cleanData.is_active
        };

        // Remove undefined keys so we only update what was actually sent
        Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

        const updatedService = await updateRow('admin_services', { id: serviceId }, updatePayload);

        res.status(200).json({
            success: true,
            message: 'Service updated successfully.',
            data: updatedService[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/services/:id
 * Soft-deletes a service so it stops appearing in the public form but preserves admin history.
 */
const softDeleteService = async (req, res, next) => {
    try {
        const serviceId = req.params.id;

        // Perform a soft delete by setting is_active to false
        const softDeletedRecord = await updateRow('admin_services', { id: serviceId }, { is_active: false });

        if (!softDeletedRecord || softDeletedRecord.length === 0) {
            const error = new Error('Service not found.');
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: `Service '${softDeletedRecord[0].name}' has been soft-deleted and removed from the public form.`
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getActiveServices,
    getServiceById,
    createService,
    updateService,
    softDeleteService
};