-- ═══════════════════════════════════════════════════════════════════════════
-- Door Step Auto — AutoRep AI Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Leads ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'other',
  stage TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'new',
  assigned_to TEXT DEFAULT 'AI Agent',
  crm_sync_status TEXT DEFAULT 'not_synced',
  is_duplicate BOOLEAN DEFAULT false,
  first_contact_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  next_follow_up TIMESTAMPTZ,
  follow_up_overdue BOOLEAN DEFAULT false,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  vehicle_interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Conversations ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'active',
  sentiment TEXT DEFAULT 'unknown',
  current_handler TEXT DEFAULT 'ai',
  handler_name TEXT DEFAULT 'AI Agent',
  ai_disclosure_sent BOOLEAN DEFAULT false,
  suppression_active BOOLEAN DEFAULT false,
  opted_out BOOLEAN DEFAULT false,
  deal_stage TEXT DEFAULT 'new',
  objection_count INTEGER DEFAULT 0,
  escalation_flag BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  duration TEXT,
  unread_count INTEGER DEFAULT 0,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Messages ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent',
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  channel TEXT NOT NULL DEFAULT 'web',
  delivered BOOLEAN DEFAULT true,
  read BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  approved BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, timestamp);

-- ─── Vehicles ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock TEXT UNIQUE NOT NULL,
  vin TEXT,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT DEFAULT '',
  body TEXT DEFAULT '',
  exterior_color TEXT,
  interior_color TEXT,
  mileage TEXT DEFAULT 'New',
  price NUMERIC(12,2) NOT NULL,
  msrp NUMERIC(12,2),
  status TEXT DEFAULT 'available',
  photo_url TEXT,
  features TEXT[] DEFAULT '{}',
  inventory_source TEXT DEFAULT 'manual',
  days_on_lot INTEGER DEFAULT 0,
  estimated_payment NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Quotes ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  vehicle_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  revision INTEGER DEFAULT 1,
  disclosure_included BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quote_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_summary TEXT NOT NULL,
  selling_price NUMERIC(12,2) NOT NULL,
  down_payment NUMERIC(12,2) DEFAULT 0,
  trade_in_value NUMERIC(12,2) DEFAULT 0,
  term_months INTEGER NOT NULL DEFAULT 72,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 5.99,
  monthly_payment NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(12,2) NOT NULL,
  biweekly_payment NUMERIC(10,2),
  taxes NUMERIC(10,2) DEFAULT 0,
  fees NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Appointments ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'consultation',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  assigned_to TEXT DEFAULT 'AI Agent',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Finance ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  date_of_birth DATE,
  drivers_license_number TEXT,
  employer_name TEXT,
  employer_phone TEXT,
  annual_income NUMERIC(12,2),
  monthly_housing_payment NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  co_applicant_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending_consent',
  completion_percentage INTEGER DEFAULT 0,
  blockers TEXT[] DEFAULT '{}',
  routing_status TEXT DEFAULT 'not_started',
  routing_target TEXT,
  routed_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  finance_packet_id UUID REFERENCES finance_packets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  granted BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ,
  ip_address TEXT,
  method TEXT DEFAULT 'electronic',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disclosure_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  finance_packet_id UUID REFERENCES finance_packets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supporting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_packet_id UUID REFERENCES finance_packets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT DEFAULT 'missing',
  uploaded_at TIMESTAMPTZ,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Routing Jobs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS routing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_packet_id UUID REFERENCES finance_packets(id) ON DELETE CASCADE,
  target TEXT NOT NULL DEFAULT 'dealertrack',
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Follow-Up Tasks ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'follow_up',
  status TEXT DEFAULT 'scheduled',
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'phone',
  message TEXT,
  assigned_to TEXT DEFAULT 'AI Agent',
  priority TEXT DEFAULT 'warm',
  customer_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Escalations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  customer_name TEXT NOT NULL,
  channel TEXT NOT NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ─── Audit Events ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT now(),
  details TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit_events(performed_at DESC);

-- ─── Integration Configs ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  credentials JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'not_synced',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Manager Reviews ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manager_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ─── Row Level Security (RLS) ───────────────────────────────────────────────
-- For the investor demo, we enable RLS but allow anon access.
-- In production, replace with proper auth policies.

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE disclosure_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporting_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_reviews ENABLE ROW LEVEL SECURITY;

-- Demo-safe: allow anon full access (replace with auth-based policies in production)
CREATE POLICY "anon_all_leads" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_conversations" ON conversations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_messages" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_vehicles" ON vehicles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quotes" ON quotes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quote_scenarios" ON quote_scenarios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_appointments" ON appointments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_customer_profiles" ON customer_profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_finance_packets" ON finance_packets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_consent_records" ON consent_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_disclosure_records" ON disclosure_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_supporting_documents" ON supporting_documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_routing_jobs" ON routing_jobs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_follow_up_tasks" ON follow_up_tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_escalations" ON escalations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_audit_events" ON audit_events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_integration_configs" ON integration_configs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_manager_reviews" ON manager_reviews FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── Done ───────────────────────────────────────────────────────────────────
-- Schema created successfully. All 18 tables with RLS enabled.
