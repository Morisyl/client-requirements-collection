const submissionValidator = require('../validators/submissionValidator');
const sanitizer = require('../utils/sanitizer');
const referenceGenerator = require('../utils/referenceGenerator');
const submissionService = require('../services/submissionService');
const emailService = require('../services/emailService');
const storageService = require('../services/storageService');

/**
 * POST /api/submissions
 * Handles the creation of a new service request submission.
 */
const createSubmission = async (req, res, next) => {
    try {
        // Multipart/form-data sends complex objects (like JSON) as strings.
        // We must parse them back into objects before validation.
        let parsedFormData = req.body.form_data;
        let parsedConsent = req.body.consent;

        if (typeof parsedFormData === 'string') {
            try { parsedFormData = JSON.parse(parsedFormData); } catch (e) { /* validator will catch invalid json */ }
        }
        if (typeof parsedConsent === 'string') {
            try { parsedConsent = JSON.parse(parsedConsent); } catch (e) { /* validator will catch invalid json */ }
        }

        const rawData = {
            client_name: req.body.client_name,
            client_email: req.body.client_email,
            client_phone: req.body.client_phone,
            service_type: req.body.service_type,
            form_data: parsedFormData,
            consent: parsedConsent
        };

        // 1. Call submissionValidator to check required fields
        const { isValid, errors } = submissionValidator.validateNewSubmission(rawData);
        if (!isValid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            return next(error);
        }

        // 2. Pass form_data through sanitizer.js to clean dynamic field values
        // (Even though the global middleware ran, this ensures deeply nested dynamic JSON is scrubbed specifically)
        const cleanFormData = sanitizer.cleanObject(rawData.form_data);

        // 3. Call referenceGenerator.js to create a human-readable ID
        let referenceId;
        try {
            referenceId = await referenceGenerator.generateReference();
        } catch (refError) {
            console.error('[Submission Controller] Reference generation failed:', refError);
            const error = new Error('Failed to generate submission reference. Please try again.');
            error.statusCode = 500;
            return next(error);
}
        
        // [File Handling] Upload files to Storage first, so we have their paths to save in the DB
        let uploadedFilesMetadata = [];
        if (req.files && req.files.length > 0) {
            // storageService should loop over the Multer RAM buffers and upload to Supabase
            uploadedFilesMetadata = await storageService.uploadMultiple(req.files, referenceId);
        }

        // 4 & 5. Insert the submission record and consent record
        // We delegate this to a service to handle the Supabase transaction/relational inserts cleanly
        const submissionRecord = await submissionService.createSubmissionRecord({
            reference_id: referenceId,
            client_name: rawData.client_name,
            client_email: rawData.client_email,
            client_phone: rawData.client_phone,
            service_type: rawData.service_type,
            form_data: cleanFormData,
            status: 'pending',
            files: uploadedFilesMetadata
        }, rawData.consent);

        // 6. Return the submission ID and reference number to the client
        res.status(201).json({
            success: true,
            message: 'Submission received successfully.',
            data: {
                id: submissionRecord.id,
                reference_id: referenceId
            }
        });

        // 7. Trigger emailService.js asynchronously
        // Notice there is NO `await` here. This allows the HTTP response to finish instantly
        // while the server sends the email in the background.
        emailService.sendConfirmationEmails(submissionRecord).catch(err => {
            console.error(`[Background Task Error] Failed to send emails for ${referenceId}:`, err);
        });

    } catch (error) {
        // Pass any unexpected errors to the global errorHandler
        next(error);
    }
};

/**
 * GET /api/submissions/:id
 * Retrieves a single submission by its reference ID (used for the confirmation page).
 */
const getSubmission = async (req, res, next) => {
    try {
        const referenceId = req.params.id;

        if (!referenceId) {
            const error = new Error('Reference ID is required.');
            error.statusCode = 400;
            return next(error);
        }

        // Fetch the record via the service layer
        const submission = await submissionService.getSubmissionByReference(referenceId);

        if (!submission) {
            const error = new Error('Submission not found or invalid reference ID.');
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: submission
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSubmission,
    getSubmission
};