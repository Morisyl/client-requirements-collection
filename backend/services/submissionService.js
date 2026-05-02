const { insertRow, fetchRows, deleteRow } = require('../config/supabase');
const storageService = require('./storageService');

/**
 * Creates a complete submission record, including consent and document metadata.
 * Implements manual rollback logic if any step fails to prevent orphaned data or files.
 * * @param {Object} submissionData - The core submission details
 * @param {Object} consentData - The parsed consent tracking data
 * @returns {Promise<Object>} - The created submission record
 */
const createSubmissionRecord = async (submissionData, consentData) => {
    let createdSubmission = null;
    let createdConsent = null;
    const createdDocuments = [];

    // Extract files from the payload (passed down from the controller)
    const files = submissionData.files || [];
    
    // Remove files array from the main record before DB insert
    delete submissionData.files;

    try {
        // STEP 1: Insert the main submission record
        console.log('📝 Attempting to insert submission with data:', JSON.stringify({
            reference_id: submissionData.reference_id,
            client_name: submissionData.client_name,
            client_email: submissionData.client_email,
            service_type: submissionData.service_type,
            status: submissionData.status,
            form_data_keys: Object.keys(submissionData.form_data || {})
        }, null, 2));
        
        createdSubmission = await insertRow('submissions', submissionData);
        
        // STEP 2: Insert the consent record linked to the submission
        if (consentData) {
            createdConsent = await insertRow('consent_records', {
                submission_id: createdSubmission.id,
                ip_address: consentData.ip_address || 'unknown',
                user_agent: consentData.user_agent || 'unknown',
                agreed_to_terms: consentData.agreed_to_terms === true,
                agreed_to_privacy: consentData.agreed_to_privacy === true
            });
        }

        // STEP 3: Insert document metadata records
        if (files.length > 0) {
            for (const file of files) {
                const docRecord = await insertRow('submission_documents', {
                    submission_id: createdSubmission.id,
                    file_name: file.file_name,
                    file_type: file.file_type,
                    storage_path: file.storage_path
                });
                createdDocuments.push(docRecord);
            }
        }

        return createdSubmission;

    } catch (error) {
        console.error(`🚨 Transaction failed for reference ${submissionData.reference_id}. Initiating rollback...`);
        console.error('❌ ACTUAL ERROR:', error);
        console.error('❌ ERROR MESSAGE:', error.message);
        console.error('❌ ERROR STACK:', error.stack);
        if (error.details) console.error('❌ ERROR DETAILS:', error.details);
        if (error.dbCode) console.error('❌ DB CODE:', error.dbCode);
        if (error.statusCode) console.error('❌ STATUS CODE:', error.statusCode);

        // ROLLBACK: Delete database records in reverse order
        try {
            if (createdDocuments.length > 0) {
                for (const doc of createdDocuments) {
                    await deleteRow('submission_documents', { id: doc.id });
                }
            }
            if (createdConsent) {
                await deleteRow('consent_records', { id: createdConsent.id });
            }
            if (createdSubmission) {
                await deleteRow('submissions', { id: createdSubmission.id });
            }
        } catch (dbCleanupError) {
            console.error('CRITICAL: Database rollback failed. Manual intervention may be required.', dbCleanupError);
        }

        // ROLLBACK: Delete physical files from Supabase Storage
        if (files.length > 0) {
            try {
                const pathsToDelete = files.map(f => f.storage_path);
                // Depending on your storageService implementation, you can map over deleteFile
                await Promise.all(pathsToDelete.map(path => storageService.deleteFile(path)));
                console.log(`🧹 Cleaned up ${pathsToDelete.length} orphaned files from storage.`);
            } catch (storageCleanupError) {
                console.error('CRITICAL: Storage rollback failed. Orphaned files remain in bucket.', storageCleanupError);
            }
        }

        // Re-throw the original error so the controller can send a 500 response
        const structuredError = new Error('Failed to save submission. The system has safely rolled back the attempt.');
        structuredError.statusCode = 500;
        structuredError.details = error.message;
        throw structuredError;
    }
};

/**
 * Retrieves a submission and its associated documents by its public reference ID.
 * * @param {string} referenceId - The human-readable reference (e.g., XTC-2026-A3F7)
 * @returns {Promise<Object>} - The combined submission object
 */
const getSubmissionByReference = async (referenceId) => {
    // 1. Fetch the main record
    const submissions = await fetchRows('submissions', { reference_id: referenceId });
    
    if (!submissions || submissions.length === 0) {
        return null;
    }
    
    const submission = submissions[0];

    // 2. Fetch associated documents
    const documents = await fetchRows('submission_documents', { submission_id: submission.id });

    // 3. Attach documents to the response object
    submission.documents = documents || [];

    return submission;
};

module.exports = {
    createSubmissionRecord,
    getSubmissionByReference
};