-- ============================================================================
-- JANASEVA - Supabase PostgreSQL Schema & Security Rules (RLS)
-- ============================================================================
-- Run this entire script in the Supabase Dashboard -> SQL Editor -> New Query.
-- It creates all required tables, triggers, indexes, and Row Level Security policies.
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Panchayats Directory Table
CREATE TABLE IF NOT EXISTS public.panchayats (
  panchayat_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  block TEXT,
  district TEXT,
  state TEXT DEFAULT 'Karnataka',
  phone TEXT,
  email TEXT,
  receiver_email TEXT,
  office_address TEXT,
  pincode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'receiver', 'admin')),
  panchayat_id TEXT REFERENCES public.panchayats(panchayat_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Complaints / Grievances Table
CREATE TABLE IF NOT EXISTS public.complaints (
  complaint_id TEXT PRIMARY KEY, -- Formatted ID e.g., JAN-2026-1001
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  citizen_uid TEXT,
  citizen_name TEXT NOT NULL,
  citizen_email TEXT NOT NULL,
  citizen_phone TEXT,
  citizen_mobile_number TEXT,
  panchayat_id TEXT NOT NULL REFERENCES public.panchayats(panchayat_id) ON DELETE RESTRICT,
  panchayat_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT,
  description TEXT NOT NULL,
  photo_url TEXT,
  supporting_documents JSONB DEFAULT '[]'::JSONB,
  document_analysis JSONB,
  ai_priority TEXT DEFAULT 'NORMAL',
  ai_category TEXT,
  ai_department TEXT,
  ai_rationale TEXT,
  is_emergency BOOLEAN DEFAULT FALSE,
  emergency_details JSONB,
  status TEXT DEFAULT 'Submitted',
  assigned_receiver_id TEXT,
  assigned_receiver_name TEXT,
  assigned_receiver_email TEXT,
  assigned_department TEXT,
  official_response TEXT,
  official_responses JSONB DEFAULT '[]'::JSONB,
  rejection_reason TEXT,
  reopen_reason TEXT,
  citizen_feedback JSONB,
  submission_date TEXT,
  submission_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Complaint Discussion / Internal Messages
CREATE TABLE IF NOT EXISTS public.complaint_messages (
  message_id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES public.complaints(complaint_id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  sender_role TEXT,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Complaint Audit / Lifecycle Updates
CREATE TABLE IF NOT EXISTS public.complaint_updates (
  update_id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES public.complaints(complaint_id) ON DELETE CASCADE,
  action TEXT,
  previous_status TEXT,
  new_status TEXT,
  actor_name TEXT,
  actor_role TEXT,
  comments TEXT,
  citizen_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Admin Announcements / Banners
CREATE TABLE IF NOT EXISTS public.admin_banners (
  banner_id TEXT PRIMARY KEY,
  title TEXT,
  message TEXT,
  banner_type TEXT DEFAULT 'info',
  storage_path TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Receiver / System Preferences Table
CREATE TABLE IF NOT EXISTS public.receiver_settings (
  setting_id TEXT PRIMARY KEY,
  panchayat_id TEXT REFERENCES public.panchayats(panchayat_id) ON DELETE CASCADE,
  receiver_email TEXT,
  emailjs_public_key TEXT,
  emailjs_service_id TEXT,
  emailjs_template_id TEXT,
  settings_data JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_email ON public.complaints(citizen_email);
CREATE INDEX IF NOT EXISTS idx_complaints_panchayat_id ON public.complaints(panchayat_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint_id ON public.complaint_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint_id ON public.complaint_updates(complaint_id);

-- ============================================================================
-- AUTO-CREATE PROFILE ON AUTH USER SIGNUP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'citizen')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.panchayats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiver_settings ENABLE ROW LEVEL SECURITY;

-- 1. Panchayats: Everyone can view directory list
CREATE POLICY "Allow public read access to panchayats"
  ON public.panchayats FOR SELECT
  USING (true);

-- 2. Profiles: Users can view their own profile, receivers/admins can view all
CREATE POLICY "Allow users to read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('receiver', 'admin'));

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Complaints:
-- - Tracking: anyone can view a complaint by ID / citizen email
-- - Citizen dashboard: citizens view their own complaints
-- - Receiver dashboard: receivers view complaints for their assigned panchayat
CREATE POLICY "Allow complaint read for tracking and owners"
  ON public.complaints FOR SELECT
  USING (
    true -- Permissive for public grievance tracking by ID
  );

CREATE POLICY "Allow citizens to submit complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow updates by authenticated receivers or complaint owners"
  ON public.complaints FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('receiver', 'admin')
  );

-- 4. Complaint Messages & Updates:
CREATE POLICY "Allow public read of messages for complaint"
  ON public.complaint_messages FOR SELECT
  USING (true);

CREATE POLICY "Allow inserting messages"
  ON public.complaint_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow reading complaint updates"
  ON public.complaint_updates FOR SELECT
  USING (true);

CREATE POLICY "Allow inserting complaint updates"
  ON public.complaint_updates FOR INSERT
  WITH CHECK (true);

-- 5. Admin Banners:
CREATE POLICY "Allow public view active banners"
  ON public.admin_banners FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- SEED DATA (Standard Gram Panchayats)
-- ============================================================================
INSERT INTO public.panchayats (panchayat_id, name, block, district, state, phone, email, receiver_email, office_address, pincode)
VALUES
  ('gp-001', 'Bellandur Gram Panchayat', 'Bengaluru East', 'Bengaluru Urban', 'Karnataka', '+91 98450 11223', 'bellandur.gp@karnataka.gov.in', 'receiver.bellandur@janaseva.gov.in', 'Gram Panchayat Office, Main Road, Bellandur', '560103'),
  ('gp-002', 'Varthur Gram Panchayat', 'Bengaluru East', 'Bengaluru Urban', 'Karnataka', '+91 98450 22334', 'varthur.gp@karnataka.gov.in', 'receiver.varthur@janaseva.gov.in', 'Near Govt School, Varthur Hub', '560087'),
  ('gp-003', 'Whitefield Gram Panchayat', 'Bengaluru East', 'Bengaluru Urban', 'Karnataka', '+91 98450 33445', 'whitefield.gp@karnataka.gov.in', 'receiver.whitefield@janaseva.gov.in', 'Inner Circle Road, Whitefield', '560066')
ON CONFLICT (panchayat_id) DO NOTHING;

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION (Run in Supabase Dashboard -> Storage)
-- ============================================================================
-- Create bucket 'complaint-attachments' (public bucket for grievance evidence)
-- Create bucket 'admin-banners' (public bucket for portal notice banners)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('complaint-attachments', 'complaint-attachments', true),
  ('admin-banners', 'admin-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public complaint file view"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Anyone can upload complaint files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'complaint-attachments');

CREATE POLICY "Public banner view"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admin-banners');


-- ============================================================================
-- 9. JANASEVA ULTIMATE API MANAGEMENT & RECOVERY CONTROL CENTRE ENTITIES
-- ============================================================================

-- A. Catalog of API Providers
CREATE TABLE IF NOT EXISTS public.api_providers (
  provider_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('email', 'sms_whatsapp', 'ai', 'maps_gis', 'ocr', 'database', 'custom')),
  description TEXT,
  website TEXT,
  docs_url TEXT,
  default_endpoint TEXT,
  auth_methods JSONB DEFAULT '["api_key", "bearer_token"]'::JSONB,
  is_official BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Unified API Configurations (Supporting Personal & System Scopes)
CREATE TABLE IF NOT EXISTS public.api_configurations (
  config_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('personal', 'system')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('email', 'sms_whatsapp', 'ai', 'maps_gis', 'ocr', 'database', 'custom')),
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  http_method TEXT DEFAULT 'POST' CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  auth_type TEXT DEFAULT 'api_key' CHECK (auth_type IN ('none', 'api_key', 'bearer_token', 'basic', 'oauth2', 'custom')),
  headers JSONB DEFAULT '{}'::JSONB,
  query_params JSONB DEFAULT '{}'::JSONB,
  body_template TEXT,
  content_type TEXT DEFAULT 'application/json',
  timeout_ms INTEGER DEFAULT 8000,
  retry_count INTEGER DEFAULT 3,
  rate_limit_rpm INTEGER DEFAULT 60,
  response_mapping JSONB DEFAULT '{}'::JSONB,
  success_condition JSONB DEFAULT '{"status_min": 200, "status_max": 299}'::JSONB,
  is_primary BOOLEAN DEFAULT FALSE,
  is_secondary BOOLEAN DEFAULT FALSE,
  fallback_config_id TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'NOT CONFIGURED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'TESTING', 'DEGRADED', 'FAILED', 'INVALID CREDENTIALS', 'RATE LIMITED', 'DISABLED', 'OFFLINE', 'NOT CONFIGURED')),
  device_scope TEXT DEFAULT 'all' CHECK (device_scope IN ('all', 'web', 'mobile')),
  last_tested TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Encrypted API Credential References
CREATE TABLE IF NOT EXISTS public.api_credentials (
  credential_id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL REFERENCES public.api_configurations(config_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('personal', 'system')),
  masked_key TEXT NOT NULL,
  key_hint TEXT,
  vault_reference TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rotated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. Receiver Delegated Permissions Policy
CREATE TABLE IF NOT EXISTS public.api_permissions (
  permission_id TEXT PRIMARY KEY DEFAULT 'receiver_permissions',
  can_edit_apis BOOLEAN DEFAULT TRUE,
  can_test_apis BOOLEAN DEFAULT TRUE,
  can_backup_apis BOOLEAN DEFAULT TRUE,
  can_restore_apis BOOLEAN DEFAULT TRUE,
  can_manage_secrets BOOLEAN DEFAULT TRUE,
  can_disable_apis BOOLEAN DEFAULT TRUE,
  can_manage_personal_apis BOOLEAN DEFAULT TRUE,
  can_configure_personal_email BOOLEAN DEFAULT TRUE,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. Provider Health Checks & Monitoring Telemetry
CREATE TABLE IF NOT EXISTS public.api_health_checks (
  check_id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL REFERENCES public.api_configurations(config_id) ON DELETE CASCADE,
  latency_ms INTEGER DEFAULT 0,
  http_code INTEGER,
  status TEXT NOT NULL,
  is_healthy BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. API Error Logs Register
CREATE TABLE IF NOT EXISTS public.api_error_logs (
  log_id TEXT PRIMARY KEY,
  config_id TEXT REFERENCES public.api_configurations(config_id) ON DELETE SET NULL,
  api_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scope TEXT NOT NULL,
  error_code TEXT,
  sanitized_message TEXT NOT NULL,
  http_status INTEGER,
  remediation_hint TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- G. Configuration Backup Snapshots & Versioning
CREATE TABLE IF NOT EXISTS public.api_backup_versions (
  version_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('personal', 'system', 'all')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  config_count INTEGER DEFAULT 0,
  sha256_checksum TEXT NOT NULL,
  snapshot_data JSONB NOT NULL, -- Metadata & safe configuration templates; zero raw plaintext secrets
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- H. 1-Click Recovery & Rollback History
CREATE TABLE IF NOT EXISTS public.api_recovery_history (
  recovery_id TEXT PRIMARY KEY,
  config_id TEXT REFERENCES public.api_configurations(config_id) ON DELETE SET NULL,
  api_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  action TEXT NOT NULL,
  from_version TEXT,
  to_version TEXT,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  reason TEXT,
  restored_at TIMESTAMPTZ DEFAULT NOW()
);

-- I. Immutable API Audit Trail
CREATE TABLE IF NOT EXISTS public.api_audit_logs (
  audit_id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  scope TEXT NOT NULL,
  api_id TEXT NOT NULL,
  details TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- J. User Notification Preferences (including Personal Administrative Copy Email)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  pref_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  personal_copy_email TEXT, -- User-configured receiving email independent of API credentials
  receive_citizen_acknowledgement_copy BOOLEAN DEFAULT TRUE,
  receive_status_update_copy BOOLEAN DEFAULT TRUE,
  receive_emergency_alerts BOOLEAN DEFAULT TRUE,
  sms_alerts_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_alerts_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- K. Outbound Notification Queue (Offline Resilience)
CREATE TABLE IF NOT EXISTS public.notification_queue (
  queue_id TEXT PRIMARY KEY,
  idempotency_token TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('email', 'sms_whatsapp', 'push')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message_payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  last_attempt TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- L. Offline Synchronization Queue (Grievance Submissions & Progress Tasks)
CREATE TABLE IF NOT EXISTS public.synchronization_queue (
  sync_id TEXT PRIMARY KEY,
  operation_id TEXT UNIQUE NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('complaint_submit', 'status_update', 'official_response', 'evidence_upload')),
  payload JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'completed', 'conflict', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR API MANAGEMENT PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_api_configs_user_id ON public.api_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_api_configs_scope ON public.api_configurations(scope);
CREATE INDEX IF NOT EXISTS idx_api_configs_category ON public.api_configurations(category);
CREATE INDEX IF NOT EXISTS idx_api_configs_status ON public.api_configurations(status);
CREATE INDEX IF NOT EXISTS idx_api_health_config ON public.api_health_checks(config_id);
CREATE INDEX IF NOT EXISTS idx_api_error_config ON public.api_error_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_api_backups_user ON public.api_backup_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.synchronization_queue(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR API MANAGEMENT ENTITIES
-- ============================================================================
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_backup_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_recovery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synchronization_queue ENABLE ROW LEVEL SECURITY;

-- 1. API Providers: Everyone can read available catalog
CREATE POLICY "Public read api_providers" ON public.api_providers FOR SELECT USING (true);

-- 2. API Configurations:
-- - Personal scope: user owns their records
-- - System scope: only admin can manage, receivers can read permitted ones
CREATE POLICY "Users read own personal api configs"
  ON public.api_configurations FOR SELECT
  USING (
    (scope = 'personal' AND auth.uid() = user_id) OR
    (scope = 'system' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('receiver', 'admin'))
  );

CREATE POLICY "Users insert own personal api configs"
  ON public.api_configurations FOR INSERT
  WITH CHECK (
    (scope = 'personal' AND auth.uid() = user_id) OR
    (scope = 'system' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

CREATE POLICY "Users update own personal api configs"
  ON public.api_configurations FOR UPDATE
  USING (
    (scope = 'personal' AND auth.uid() = user_id) OR
    (scope = 'system' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

CREATE POLICY "Users delete own personal api configs"
  ON public.api_configurations FOR DELETE
  USING (
    (scope = 'personal' AND auth.uid() = user_id) OR
    (scope = 'system' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- 3. Notification Preferences: User owns their personal copy email settings
CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Backup Snapshots: Users view/create their own backups, admins view all
CREATE POLICY "Users view own backups or admin view system"
  ON public.api_backup_versions FOR SELECT
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users create backups"
  ON public.api_backup_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 5. Seed Catalog of Standard JANASEVA Providers (including Unitpost)
INSERT INTO public.api_providers (provider_id, name, category, description, website, docs_url, default_endpoint, auth_methods)
VALUES
  ('unitpost_email', 'Unitpost Email', 'email', 'Enterprise transactional and administrative email delivery platform.', 'https://unitpost.com', 'https://docs.unitpost.com/api', 'https://api.unitpost.com/v1/email/send', '["api_key", "bearer_token"]'::JSONB),
  ('unitpost_sms', 'Unitpost SMS', 'sms_whatsapp', 'High-speed citizen OTP and administrative alert SMS gateway.', 'https://unitpost.com', 'https://docs.unitpost.com/sms', 'https://api.unitpost.com/v1/sms/send', '["api_key", "bearer_token"]'::JSONB),
  ('meta_whatsapp', 'Meta WhatsApp Cloud API', 'sms_whatsapp', 'Official WhatsApp Business Platform for citizen grievance notifications.', 'https://business.whatsapp.com', 'https://developers.facebook.com/docs/whatsapp', 'https://graph.facebook.com/v18.0', '["bearer_token"]'::JSONB),
  ('google_gemini', 'Google Gemini AI', 'ai', 'Multilingual generative AI for grievance categorization, summarization, and civic RAG.', 'https://ai.google.dev', 'https://ai.google.dev/docs', 'https://generativelanguage.googleapis.com/v1beta', '["api_key"]'::JSONB),
  ('openai_gpt', 'OpenAI Assistant', 'ai', 'Secondary generative intelligence fallback for Kannada, Hindi, and English processing.', 'https://openai.com', 'https://platform.openai.com/docs', 'https://api.openai.com/v1', '["bearer_token"]'::JSONB),
  ('osm_gis', 'OpenStreetMap & Smart GIS', 'maps_gis', 'Open-source geographic mapping and Gram Panchayat village boundary routing.', 'https://openstreetmap.org', 'https://wiki.openstreetmap.org/wiki/API', 'https://nominatim.openstreetmap.org', '["none", "api_key"]'::JSONB),
  ('google_vision_ocr', 'Google Cloud Vision OCR', 'ocr', 'High-accuracy printed and handwritten document text extraction for civic certificates.', 'https://cloud.google.com/vision', 'https://cloud.google.com/vision/docs', 'https://vision.googleapis.com/v1/images:annotate', '["api_key", "oauth2"]'::JSONB),
  ('supabase_postgres', 'Supabase Cloud Database', 'database', 'Cloud PostgreSQL with Row Level Security, Realtime, Storage, and Edge Functions.', 'https://supabase.com', 'https://supabase.com/docs', 'https://xyzcompany.supabase.co/rest/v1', '["api_key", "bearer_token"]'::JSONB),
  ('custom_rest', 'Custom REST Integration', 'custom', 'Universal user-defined REST API endpoint with custom headers and request templates.', 'https://janaseva.gov.in', 'https://janaseva.gov.in/docs', 'https://api.example.com/endpoint', '["none", "api_key", "bearer_token", "basic", "custom"]'::JSONB)
ON CONFLICT (provider_id) DO NOTHING;
