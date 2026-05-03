const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabaseAdmin = require('../config/db'); // Raw client for complex queries
const { fetchRows, updateRow } = require('../config/supabase');

// ==========================================
// 🔓 AUTHENTICATION
// ==========================================

/**
 * POST /api/admin/auth/login
 * Verifies credentials and issues a JWT for dashboard access.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = new Error('Email and password are required.');
            error.statusCode = 400;
            return next(error);
        }

        // 1. Fetch the admin record (Assumes you have an 'admins' table)
        const { data: admins, error: dbError } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (dbError) throw dbError;
        
        const adminUser = admins && admins.length > 0 ? admins[0] : null;

        // 2. Verify existence and password hash
        if (!adminUser || !(await bcrypt.compare(password, adminUser.password_hash))) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            return next(error);
        }

        // 3. Check if the account is active
        if (!adminUser.is_active) {
            const error = new Error('This admin account has been deactivated.');
            error.statusCode = 403;
            return next(error);
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                admin: { id: adminUser.id, email: adminUser.email, name: adminUser.name }
            }
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 🔴 ADMIN DASHBOARD OPERATIONS
// ==========================================

/**
 * GET /api/admin/submissions
 * Retrieves a paginated, filterable list of all user submissions.
 */
const getAllSubmissions = async (req, res, next) => {
    try {
        // Extract query parameters with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { status, service_type, from_date, to_date, tag } = req.query;

        // Calculate pagination bounds
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // 1. Initialize the query with exact count calculation
        let query = supabaseAdmin
            .from('submissions')
            .select('*', { count: 'exact' });

        // 2. Apply Filters dynamically
        if (status) {
            query = query.eq('status', status);
        }
        if (service_type) {
            query = query.eq('service_type', service_type);
        }
        if (from_date) {
            query = query.gte('created_at', from_date);
        }
        if (to_date) {
            query = query.lte('created_at', to_date);
        }
        if (tag) {
            // Assumes 'tags' is a JSONB array column in Supabase
            query = query.contains('tags', [tag]); 
        }

        // 3. Apply sorting (newest first) and pagination
        query = query.order('created_at', { ascending: false }).range(from, to);

        // 4. Execute the query
        const { data, count, error } = await query;

        if (error) throw error;

        res.status(200).json({
            success: true,
            meta: {
                total_records: count,
                current_page: page,
                total_pages: Math.ceil(count / limit),
                limit: limit
            },
            data: data
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/submissions/:id
 * Retrieves a single submission by ID with full details.
 */
const getSubmissionById = async (req, res, next) => {
    try {
        const submissionId = req.params.id;

        if (!submissionId) {
            const error = new Error('Submission ID is required.');
            error.statusCode = 400;
            return next(error);
        }

        // Fetch the submission from Supabase
        const { data, error: dbError } = await supabaseAdmin
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (dbError || !data) {
            const error = new Error('Submission not found.');
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/admin/submissions/:id/status
 * Updates submission status with strict state-machine validation.
 */
const updateSubmissionStatus = async (req, res, next) => {
    try {
        const submissionId = req.params.id;
        const { status: newStatus } = req.body;

        // Valid lifecycle transitions
        const validTransitions = {
            'pending': ['in_review', 'rejected'],
            'in_review': ['completed', 'rejected', 'pending'], // can revert to pending if needed
            'completed': [], // Terminal state, cannot be changed
            'rejected': ['pending'] // Can be reopened
        };

        if (!newStatus) {
            const error = new Error('New status is required.');
            error.statusCode = 400;
            return next(error);
        }

        // 1. Fetch current status
        const records = await fetchRows('submissions', { id: submissionId }, { select: 'status' });
        if (!records || records.length === 0) {
            const error = new Error('Submission not found.');
            error.statusCode = 404;
            return next(error);
        }
        const currentStatus = records[0].status;

        // 2. Validate transition
        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
            const error = new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'.`);
            error.statusCode = 409; // Conflict
            return next(error);
        }

        // 3. Update the record
        const updatedRecord = await updateRow('submissions', { id: submissionId }, { status: newStatus });

        res.status(200).json({
            success: true,
            message: `Status updated to ${newStatus}.`,
            data: updatedRecord[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/admin/submissions/:id/notes
 * Saves internal admin notes.
 */
const updateSubmissionNotes = async (req, res, next) => {
    try {
        const submissionId = req.params.id;
        const { notes } = req.body; // Can be string or empty to clear

        if (notes === undefined) {
             const error = new Error('Notes field is required in the payload.');
             error.statusCode = 400;
             return next(error);
        }

        const updatedRecord = await updateRow('submissions', { id: submissionId }, { admin_notes: notes });

        res.status(200).json({
            success: true,
            message: 'Admin notes updated successfully.',
            data: updatedRecord[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/admin/submissions/:id/tags
 * Adds a tag to a submission's tags array.
 */
const addSubmissionTag = async (req, res, next) => {
    try {
        const submissionId = req.params.id;
        const { tag } = req.body;

        if (!tag || typeof tag !== 'string') {
            const error = new Error('A valid tag string is required.');
            error.statusCode = 400;
            return next(error);
        }

        // 1. Fetch current tags
        const records = await fetchRows('submissions', { id: submissionId }, { select: 'tags' });
        if (!records || records.length === 0) {
             const error = new Error('Submission not found.');
             error.statusCode = 404;
             return next(error);
        }
        
        const currentTags = records[0].tags || [];

        // 2. Check for duplicates
        if (currentTags.includes(tag)) {
            return res.status(200).json({
                success: true,
                message: 'Tag already exists on this submission.',
                data: currentTags
            });
        }

        // 3. Append and update
        const newTags = [...currentTags, tag];
        await updateRow('submissions', { id: submissionId }, { tags: newTags });

        res.status(200).json({
            success: true,
            message: 'Tag added.',
            data: newTags
        });

    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/admin/submissions/:id/tags/:tag
 * Removes a specific tag.
 */
const removeSubmissionTag = async (req, res, next) => {
    try {
        const { id: submissionId, tag } = req.params;

        // 1. Fetch current tags
        const records = await fetchRows('submissions', { id: submissionId }, { select: 'tags' });
        if (!records || records.length === 0) {
             const error = new Error('Submission not found.');
             error.statusCode = 404;
             return next(error);
        }
        
        const currentTags = records[0].tags || [];

        // 2. Filter out the tag
        const newTags = currentTags.filter(t => t !== tag);

        // 3. Update the database
        await updateRow('submissions', { id: submissionId }, { tags: newTags });

        res.status(200).json({
            success: true,
            message: 'Tag removed.',
            data: newTags
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    getAllSubmissions,
    getSubmissionById,
    updateSubmissionStatus,
    updateSubmissionNotes,
    addSubmissionTag,
    removeSubmissionTag
};