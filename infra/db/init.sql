-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles and Permissions
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parties (Companies/Contractors)
CREATE TABLE parties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(20),
    kpp VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stations (Work locations)
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    party_id INTEGER REFERENCES parties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    coordinates JSONB, -- {lat: number, lng: number}
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    totp_secret BYTEA, -- Encrypted AES-256
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INTEGER REFERENCES roles(id),
    party_id INTEGER REFERENCES parties(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Backup codes for 2FA
CREATE TABLE user_backup_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sensors
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'warehouse', -- warehouse|in_transit|installed|maintenance|calibration|writeoff
    calibration_due DATE,
    ai_risk_score DECIMAL(5,2) DEFAULT 0.00,
    current_location_id INTEGER REFERENCES stations(id),
    assigned_station_id INTEGER REFERENCES stations(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(serial_number, model)
);

-- Sensor Documents (Passports, Certificates)
CREATE TABLE sensor_documents (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    doc_type VARCHAR(50) NOT NULL, -- passport|certificate|manual
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Movement Requests
CREATE TABLE movement_requests (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
    from_location_id INTEGER REFERENCES stations(id),
    to_location_id INTEGER REFERENCES stations(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending|approved|rejected|completed
    requested_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Training Materials
CREATE TABLE training_materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- draft|published|archived
    created_by INTEGER REFERENCES users(id),
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Progress in Training
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES training_materials(id) ON DELETE CASCADE,
    progress_percent INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, material_id)
);

-- Chat Groups
CREATE TABLE chat_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    party_id INTEGER REFERENCES parties(id),
    type VARCHAR(50) DEFAULT 'private', -- private|group|project
    settings JSONB DEFAULT '{}'::jsonb,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Group Members
CREATE TABLE chat_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- member|admin
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Chat Messages
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    reply_to_id INTEGER REFERENCES chat_messages(id),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Attachments
CREATE TABLE chat_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo', -- todo|in_progress|review|done|cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low|medium|high|critical
    assignee_id INTEGER REFERENCES users(id),
    creator_id INTEGER REFERENCES users(id),
    sensor_id INTEGER REFERENCES sensors(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Checklist
CREATE TABLE task_checklist (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    item_text VARCHAR(500) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document Folders
CREATE TABLE document_folders (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES document_folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    party_id INTEGER REFERENCES parties(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES document_folders(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    version INTEGER DEFAULT 1,
    mime_type VARCHAR(100),
    file_size BIGINT,
    valid_until DATE,
    tags VARCHAR(100)[],
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Counterparties (CRM)
CREATE TABLE counterparties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(20),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    party_id INTEGER REFERENCES parties(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRM Projects
CREATE TABLE crm_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    counterparty_id INTEGER REFERENCES counterparties(id),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Work Schedules
CREATE TABLE work_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    station_id INTEGER REFERENCES stations(id),
    shift_type VARCHAR(50) NOT NULL, -- day|night|vacation|sick
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hours_per_day DECIMAL(4,2) DEFAULT 8.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Predictions
CREATE TABLE ai_predictions (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- sensor|user|station
    entity_id INTEGER NOT NULL,
    prediction JSONB NOT NULL,
    confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model Configs
CREATE TABLE model_configs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) UNIQUE NOT NULL,
    feature_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    alert_thresholds JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Feedback
CREATE TABLE ai_feedback (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER REFERENCES ai_predictions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    is_correct BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_sensors_token ON sensors(token);
CREATE INDEX idx_sensors_status ON sensors(status);
CREATE INDEX idx_sensors_calibration ON sensors(calibration_due);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id, created_at DESC);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);

-- Initial Roles
INSERT INTO roles (name, permissions) VALUES
('guest', '["read:public"]'::jsonb),
('user', '["read:own", "write:own", "read:sensors", "read:chat", "read:tasks"]'::jsonb),
('engineer', '["read:own", "write:own", "read:sensors", "write:sensors", "read:chat", "write:chat", "read:tasks", "write:tasks", "write:sensor_docs"]'::jsonb),
('supervisor', '["read:all", "write:sensors", "approve:movements", "read:reports", "write:tasks", "assign:tasks"]'::jsonb),
('admin', '["read:all", "write:all", "manage:users", "manage:roles", "manage:ai_config"]'::jsonb),
('superadmin', '["*"]'::jsonb);
