const crypto = require('crypto');
const path = require('path');
const storageService = require('../config/storage'); // Using the storage config we built earlier
const { insertRow, fetchRows, deleteRow } = require('../config/supabase'); // Using the DB wrappers

/**
 * POST /api/documents/upload
 * Handles uploading files to Supabase Storage and storing metadata in the database.
 */
const uploadDocuments = async (req, res, next) => {
    try {
        const { submission_id } = req.body;
        const files = req.files;

        // 1. Validate inputs
        if (!submission_id) {
            const error = new Error('A submission_id is required to attach these documents.');
            error.statusCode = 400;
            return next(error);
        }

        if (!files || files.length === 0) {
            const error = new Error('No valid files provided for upload.');
            error.statusCode = 400;
            return next(error);
        }

        const uploadedRecords = [];

        // 2. Process each file
        for (const file of files) {
            // Extract the original extension (e.g., '.pdf', '.png')
            const ext = path.extname(file.originalname) || '';
            
            // Generate a secure, collision-free UUID for the filename
            const uuid = crypto.randomUUID();
            
            // Construct the namespaced storage path
            const storagePath = `submissions/${submission_id}/${uuid}${ext}`;

            // 3. Upload the memory buffer to Supabase Storage
            await storageService.uploadFile(storagePath, file.buffer, file.mimetype);

            // 4. Save the file metadata to the database
            const docRecord = {
                submission_id: submission_id,
                file_name: file.originalname,
                file_type: file.mimetype,
                storage_path: storagePath
                // 'uploaded_at' is assumed to be handled by a Postgres default now() in your schema
            };

            const insertedDoc = await insertRow('submission_documents', docRecord);
            uploadedRecords.push(insertedDoc);
        }

        // 5. Return success response
        res.status(201).json({
            success: true,
            message: `${files.length} document(s) uploaded successfully.`,
            data: uploadedRecords
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/documents/:id/download
 * Generates a temporary, secure signed URL for a specific document.
 */
const getDownloadUrl = async (req, res, next) => {
    try {
        const documentId = req.params.id;

        // 1. Fetch the document metadata from the database
        const docs = await fetchRows('submission_documents', { id: documentId });
        
        if (!docs || docs.length === 0) {
            const error = new Error('Document not found in the database.');
            error.statusCode = 404;
            return next(error);
        }

        const document = docs[0];

        // 2. Generate a signed URL from Supabase Storage (Valid for 1 hour / 3600 seconds)
        const signedUrl = await storageService.generateSignedUrl(document.storage_path, 3600);

        // 3. Return the URL to the client
        res.status(200).json({
            success: true,
            data: {
                file_name: document.file_name,
                download_url: signedUrl,
                expires_in: 3600 // Let the frontend know when the link dies
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/documents/:id
 * Admin-only route to completely remove a file from Storage and its database record.
 */
const deleteDocument = async (req, res, next) => {
    try {
        const documentId = req.params.id;

        // 1. Fetch the document to get the correct storage path
        const docs = await fetchRows('submission_documents', { id: documentId });
        
        if (!docs || docs.length === 0) {
            const error = new Error('Document not found.');
            error.statusCode = 404;
            return next(error);
        }
        
        const document = docs[0];

        // 2. Delete the actual file from the Supabase Storage Bucket
        await storageService.deleteFile(document.storage_path);

        // 3. Delete the metadata record from the database
        await deleteRow('submission_documents', { id: documentId });

        res.status(200).json({
            success: true,
            message: `Document '${document.file_name}' was permanently deleted.`
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadDocuments,
    getDownloadUrl,
    deleteDocument
};