-- PRECISE CLAMFLOW WEIGHT NOTES MIGRATION
-- Based on actual user_profiles schema analysis
-- 20250831_weight_notes_authentication_precise.sql

BEGIN;

-- Verify weight_notes table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_notes' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'weight_notes table does not exist. Please create base tables first.';
    END IF;
END $$;

-- Add authentication workflow columns to weight_notes
DO $$
BEGIN
    -- Authentication step tracking (1=production_auth, 2=supplier_auth, 3=data_entry, 4=qc_approval)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'authentication_step' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN authentication_step INTEGER DEFAULT 1 CHECK (authentication_step BETWEEN 1 AND 4);
    END IF;
    
    -- QC Staff who initiated the Weight Note process
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'qc_staff_id' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN qc_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Production Staff who was authenticated
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'production_staff_id' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN production_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- User who authenticated the supplier (usually Production Staff)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'supplier_authenticated_by' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN supplier_authenticated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Authentication methods used
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'production_auth_method' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN production_auth_method VARCHAR(20) CHECK (production_auth_method IN ('face_recognition', 'rfid', 'fallback'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'supplier_auth_method' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN supplier_auth_method VARCHAR(20) CHECK (supplier_auth_method IN ('face_recognition', 'rfid', 'fallback'));
    END IF;
    
    -- QC Approval workflow
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'qc_approval_status' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN qc_approval_status VARCHAR(20) DEFAULT 'pending' CHECK (qc_approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'qc_approved_by' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN qc_approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'qc_approved_at' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN qc_approved_at TIMESTAMP WITHOUT TIME ZONE;
    END IF;
    
    -- Rejection handling
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'rejection_reason' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Production Lead notification system
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'production_lead_notified' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN production_lead_notified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'production_lead_notified_at' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN production_lead_notified_at TIMESTAMP WITHOUT TIME ZONE;
    END IF;
    
    -- Authentication timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'production_auth_at' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN production_auth_at TIMESTAMP WITHOUT TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'supplier_auth_at' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN supplier_auth_at TIMESTAMP WITHOUT TIME ZONE;
    END IF;
    
    -- Workflow completion tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'workflow_completed' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN workflow_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_notes' AND column_name = 'workflow_completed_at' AND table_schema = 'public') THEN
        ALTER TABLE weight_notes ADD COLUMN workflow_completed_at TIMESTAMP WITHOUT TIME ZONE;
    END IF;
END $$;

-- Create authentication_sessions table for workflow state management
CREATE TABLE IF NOT EXISTS authentication_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weight_note_id UUID NOT NULL,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('weight_note_creation', 'qc_approval', 'production_lead_review')),
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
    
    -- User references using correct foreign key to user_profiles.id
    qc_staff_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    production_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    supplier_id UUID, -- References suppliers table if it exists
    
    -- Authentication methods tracking
    production_auth_method VARCHAR(20) CHECK (production_auth_method IN ('face_recognition', 'rfid', 'fallback')),
    supplier_auth_method VARCHAR(20) CHECK (supplier_auth_method IN ('face_recognition', 'rfid', 'fallback')),
    
    -- Session metadata
    session_data JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Session status and lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    
    -- Timestamps matching your schema pattern
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_weight_notes_qc_staff ON weight_notes(qc_staff_id) WHERE qc_staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_weight_notes_production_staff ON weight_notes(production_staff_id) WHERE production_staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_weight_notes_approval_status ON weight_notes(qc_approval_status);
CREATE INDEX IF NOT EXISTS idx_weight_notes_workflow_pending ON weight_notes(workflow_completed) WHERE workflow_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_weight_notes_lead_notification ON weight_notes(production_lead_notified) WHERE production_lead_notified = FALSE;

-- Authentication sessions indexes
CREATE INDEX IF NOT EXISTS idx_auth_sessions_weight_note ON authentication_sessions(weight_note_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_qc_staff ON authentication_sessions(qc_staff_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_status_active ON authentication_sessions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON authentication_sessions(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_auth_sessions_current_step ON authentication_sessions(current_step, status);

-- Add foreign key to weight_notes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'auth_sessions_weight_note_fkey' 
        AND table_name = 'authentication_sessions'
    ) THEN
        ALTER TABLE authentication_sessions 
        ADD CONSTRAINT auth_sessions_weight_note_fkey 
        FOREIGN KEY (weight_note_id) REFERENCES weight_notes(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add supplier foreign key if suppliers table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'auth_sessions_supplier_fkey' 
            AND table_name = 'authentication_sessions'
        ) THEN
            ALTER TABLE authentication_sessions 
            ADD CONSTRAINT auth_sessions_supplier_fkey 
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;

$$ LANGUAGE 'plpgsql';

-- Apply trigger to authentication_sessions
DROP TRIGGER IF EXISTS update_authentication_sessions_updated_at ON authentication_sessions;
CREATE TRIGGER update_authentication_sessions_updated_at 
    BEFORE UPDATE ON authentication_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to check authentication workflow status
CREATE OR REPLACE FUNCTION get_weight_note_auth_status(note_id UUID)
RETURNS TABLE(
    current_step INTEGER,
    qc_staff_name VARCHAR,
    production_staff_name VARCHAR,
    supplier_authenticated BOOLEAN,
    qc_approval_status VARCHAR,
    workflow_complete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wn.authentication_step,
        qc.full_name as qc_staff_name,
        ps.full_name as production_staff_name,
        (wn.supplier_authenticated_by IS NOT NULL) as supplier_authenticated,
        wn.qc_approval_status,
        wn.workflow_completed
    FROM weight_notes wn
    LEFT JOIN user_profiles qc ON wn.qc_staff_id = qc.id
    LEFT JOIN user_profiles ps ON wn.production_staff_id = ps.id
    WHERE wn.id = note_id;
END;

$$ LANGUAGE 'plpgsql';

-- Create function to advance workflow step
CREATE OR REPLACE FUNCTION advance_weight_note_workflow(
    note_id UUID,
    staff_id UUID,
    auth_method VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_step INTEGER;
    success BOOLEAN := FALSE;
BEGIN
    -- Get current step
    SELECT authentication_step INTO current_step 
    FROM weight_notes WHERE id = note_id;
    
    IF current_step IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Advance based on current step
    CASE current_step
        WHEN 1 THEN -- Production Staff Authentication
            UPDATE weight_notes SET 
                production_staff_id = staff_id,
                production_auth_method = auth_method,
                production_auth_at = NOW(),
                authentication_step = 2
            WHERE id = note_id;
            success := TRUE;
            
        WHEN 2 THEN -- Supplier Authentication
            UPDATE weight_notes SET 
                supplier_authenticated_by = staff_id,
                supplier_auth_method = auth_method,
                supplier_auth_at = NOW(),
                authentication_step = 3
            WHERE id = note_id;
            success := TRUE;
            
        WHEN 3 THEN -- Data Entry Complete, Move to QC Approval
            UPDATE weight_notes SET 
                authentication_step = 4
            WHERE id = note_id;
            success := TRUE;
            
        WHEN 4 THEN -- QC Approval
            UPDATE weight_notes SET 
                qc_approved_by = staff_id,
                qc_approved_at = NOW(),
                qc_approval_status = 'approved',
                workflow_completed = TRUE,
                workflow_completed_at = NOW()
            WHERE id = note_id;
            success := TRUE;
            
        ELSE
            success := FALSE;
    END CASE;
    
    RETURN success;
END;

$$ LANGUAGE 'plpgsql';

COMMIT;

-- Verify migration completed successfully
SELECT 
    'Weight Notes Authentication Migration Completed!' as status,
    COUNT(*) as new_columns_added
FROM information_schema.columns 
WHERE table_name = 'weight_notes' 
    AND column_name IN (
        'authentication_step', 'qc_staff_id', 'production_staff_id', 
        'supplier_authenticated_by', 'production_auth_method', 'supplier_auth_method',
        'qc_approval_status', 'qc_approved_by', 'qc_approved_at',
        'rejection_reason', 'production_lead_notified', 'production_lead_notified_at',
        'production_auth_at', 'supplier_auth_at', 'workflow_completed', 'workflow_completed_at'
    );
