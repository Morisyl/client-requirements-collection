const nodemailer = require('nodemailer');

// 1. Initialize the Nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Generates the HTML template for the client confirmation email.
 */
const generateClientTemplate = (submission) => {
    // Convert the dynamic form data into a readable HTML list
    let formDataHtml = '<ul>';
    if (submission.form_data && typeof submission.form_data === 'object') {
        for (const [key, value] of Object.entries(submission.form_data)) {
            formDataHtml += `<li><strong>${key}:</strong> ${value}</li>`;
        }
    }
    formDataHtml += '</ul>';

    return `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2>Thank you for your request, ${submission.client_name}!</h2>
            <p>We have successfully received your submission for <strong>${submission.service_type}</strong>.</p>
            
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Reference ID: <span style="color: #0056b3;">${submission.reference_id}</span></h3>
                <p style="margin-bottom: 0; font-size: 0.9em; color: #666;">Please keep this ID for your records and any future correspondence.</p>
            </div>

            <h3>Summary of Details Provided:</h3>
            ${formDataHtml}

            <p>Our team is currently reviewing your request. We will get back to you shortly with the next steps.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 0.8em; color: #999;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
    `;
};

/**
 * Generates the HTML template for the internal admin notification email.
 */
const generateAdminTemplate = (submission) => {
    const dashboardUrl = `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:5500'}/admin/submissions/${submission.id}`;

    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>🔔 New Service Request Received</h2>
            <p>A new submission has been received for <strong>${submission.service_type}</strong>.</p>
            
            <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Reference ID:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${submission.reference_id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Client Name:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${submission.client_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Client Email:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${submission.client_email}">${submission.client_email}</a></td>
                </tr>
            </table>

            <a href="${dashboardUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Submission in Dashboard
            </a>
        </div>
    `;
};

/**
 * Sends both the client confirmation and admin notification emails.
 * Designed as a "fire-and-forget" function. Errors are logged but not thrown.
 * @param {Object} submission - The created submission record from the database
 */
const sendConfirmationEmails = async (submission) => {
    // Check if SMTP is configured before attempting to send
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(`[Email Service] Skipped sending emails for ${submission.reference_id}. SMTP credentials are not configured.`);
        return;
    }

    try {
        // 1. Send Client Email
        await transporter.sendMail({
            from: `"Support Team" <${process.env.SMTP_USER}>`,
            to: submission.client_email,
            subject: `Request Received: ${submission.service_type} (${submission.reference_id})`,
            html: generateClientTemplate(submission)
        });
        
        console.log(`✉️ Client confirmation email sent to ${submission.client_email}`);

        // 2. Send Admin Notification Email
        // Assumes the admin email is the same as the SMTP user, or you can add an ADMIN_EMAIL env var
        const adminEmail = process.env.SMTP_USER; 
        
        await transporter.sendMail({
            from: `"System Notifications" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `New Lead: ${submission.client_name} - ${submission.service_type}`,
            html: generateAdminTemplate(submission)
        });

        console.log(`✉️ Admin notification email sent to ${adminEmail}`);

    } catch (error) {
        // Log the error but do not throw it, preserving the fire-and-forget architecture
        console.error(`[Email Service Error] Failed to send emails for submission ${submission.reference_id}:`, error.message);
    }
};

module.exports = {
    sendConfirmationEmails
};