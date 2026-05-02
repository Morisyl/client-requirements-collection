-- ==========================================
-- 0. EXTENSIONS & CUSTOM TYPES
-- ==========================================

-- Enable the UUID extension (Usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the lifecycle states for a submission
CREATE TYPE submission_status AS ENUM ('pending', 'in_review', 'completed');

-- ==========================================
-- 1. TABLE DEFINITIONS
-- ==========================================

-- 👤 ADMIN USERS
-- Minimal table for Enolix staff accounts
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true, -- Added to support the login check in adminController
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🛠️ ADMIN SERVICES (The Form Builder)
-- Maps to the frontend 'services' table concept
CREATE TABLE admin_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_key VARCHAR(100) UNIQUE NOT NULL, -- The unique slug (e.g., 'logo-design')
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_tier VARCHAR(100),
    fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- The dynamic form schema array
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📥 SUBMISSIONS
-- The core table for client requests
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., XTC-2026-A3F7
    client_name VARCHAR(100) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- Can be linked to admin_services(name) or (service_key)
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores the dynamic user inputs
    status submission_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📄 SUBMISSION DOCUMENTS
-- Stores references to the Supabase Storage bucket, NEVER the actual files or URLs
CREATE TABLE submission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL, -- The internal bucket path (e.g., submissions/{id}/{uuid}.pdf)
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚖️ CONSENT RECORDS
-- Audit trail for GDPR/Data Privacy compliance
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
    agreed_to_privacy BOOLEAN NOT NULL DEFAULT false,
    data_processing_consent BOOLEAN DEFAULT false,
    data_collection_consent BOOLEAN DEFAULT false,
    ip_address VARCHAR(45), -- Supports IPv4 and IPv6
    user_agent TEXT,
    consented_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🏷️ SUBMISSION TAGS
-- For organizing and filtering submissions in the admin dashboard
CREATE TABLE submission_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, tag) -- Prevents attaching the same tag to a submission twice
);

-- ==========================================
-- 2. INDEXES (For Dashboard Performance)
-- ==========================================

-- Submissions filtering is heavy on the admin dashboard, so we index the common query paths
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);
CREATE INDEX idx_submissions_service_type ON submissions(service_type);

-- Speed up relational joins when fetching documents or tags for a specific submission
CREATE INDEX idx_sub_documents_submission_id ON submission_documents(submission_id);
CREATE INDEX idx_sub_tags_submission_id ON submission_tags(submission_id);

-- ==========================================
-- 3. TRIGGERS (Auto-updating 'updated_at')
-- ==========================================

-- Create a reusable function to update the timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach the trigger to services
CREATE TRIGGER update_admin_services_modtime
    BEFORE UPDATE ON admin_services
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Attach the trigger to submissions
CREATE TRIGGER update_submissions_modtime
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables to lock them down from direct public client access
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_tags ENABLE ROW LEVEL SECURITY;

-- NOTE: Because your Node.js backend uses the Supabase 'Service Role Key', 
-- it automatically bypasses RLS. We do not need to write explicit policies 
-- for the backend to function. Enabling RLS without policies effectively 
-- creates a "Deny All" rule for the anon/public API, which is exactly what we want.