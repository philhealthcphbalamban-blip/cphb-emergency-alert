-- ==============================================================================
-- 🏥 HOSPITAL RAPID EMERGENCY CODE ALERT SYSTEM
-- Production-Ready Supabase PostgreSQL Schema with Realtime Replication
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMERGENCY CODES (Master Catalog)
CREATE TABLE IF NOT EXISTS public.emergency_codes (
    id TEXT PRIMARY KEY,                       -- e.g. 'code_blue', 'code_baby_blue'
    code_name TEXT NOT NULL,                   -- e.g. 'Code Blue'
    title TEXT NOT NULL,                       -- e.g. 'Adult Cardiac / Respiratory Arrest'
    color_hex TEXT NOT NULL,                   -- e.g. '#2563eb'
    bg_gradient TEXT NOT NULL,                 -- e.g. 'from-blue-600 to-indigo-900'
    priority_level INT NOT NULL DEFAULT 1,     -- 1: Critical (Immediate), 2: Urgent, 3: Warning
    tts_template TEXT NOT NULL,                -- 'Emergency Code Blue announced at {location}. Resuscitation team deploy immediately.'
    siren_pattern TEXT NOT NULL DEFAULT 'hi_lo',-- 'hi_lo' | 'wail' | 'strobe_beep' | 'pulse'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. HOSPITAL LOCATIONS (Floors, Wards, Units, Rooms)
CREATE TABLE IF NOT EXISTS public.hospital_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building TEXT NOT NULL DEFAULT 'Main Hospital',
    floor TEXT NOT NULL,                       -- e.g. '3rd Floor'
    unit_ward TEXT NOT NULL,                   -- e.g. 'Intensive Care Unit (ICU)'
    room_bed TEXT NOT NULL,                    -- e.g. 'Room 304 - Bed A'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EMERGENCY ALERTS (Live & Historical Incidents)
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_id TEXT NOT NULL REFERENCES public.emergency_codes(id) ON DELETE RESTRICT,
    location_id UUID REFERENCES public.hospital_locations(id) ON DELETE SET NULL,
    location_text TEXT NOT NULL,               -- e.g. '3rd Floor ICU - Room 304'
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESPONDING', 'RESOLVED', 'STANDDOWN', 'FALSE_ALARM')),
    triggered_by_name TEXT NOT NULL DEFAULT 'Nurse Station Staff',
    triggered_by_role TEXT NOT NULL DEFAULT 'Staff Nurse',
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by_name TEXT,
    resolution_notes TEXT,
    patient_id_optional TEXT,
    patient_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ALERT RESPONDERS (Live Personnel Tracking)
CREATE TABLE IF NOT EXISTS public.alert_responders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES public.emergency_alerts(id) ON DELETE CASCADE,
    responder_name TEXT NOT NULL,              -- e.g. 'Dr. Maria Santos, MD'
    role TEXT NOT NULL,                        -- 'Physician' | 'Resident' | 'RT' | 'Nurse' | 'Security' | 'Anesthesiologist'
    eta_minutes INT NOT NULL DEFAULT 2,        -- Estimated arrival in minutes
    status TEXT NOT NULL DEFAULT 'EN_ROUTE' CHECK (status IN ('EN_ROUTE', 'ON_SCENE', 'STANDBY')),
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    arrived_at TIMESTAMPTZ
);

-- 5. AUDIT & PERFORMANCE LOGS
CREATE TABLE IF NOT EXISTS public.emergency_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES public.emergency_alerts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,                  -- 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESPONDER_JOINED' | 'RESOLVED'
    details JSONB,
    actor_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR ULTRA-FAST LOOKUPS & REALTIME
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_code ON public.emergency_alerts(code_id);
CREATE INDEX IF NOT EXISTS idx_alert_responders_alert ON public.alert_responders(alert_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_alert ON public.emergency_audit_logs(alert_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.emergency_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for demo/hospital kiosk stations (can be tightened with Auth)
CREATE POLICY "Allow public read for codes" ON public.emergency_codes FOR SELECT USING (true);
CREATE POLICY "Allow public read for locations" ON public.hospital_locations FOR SELECT USING (true);
CREATE POLICY "Allow public all for emergency_alerts" ON public.emergency_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for alert_responders" ON public.alert_responders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for audit_logs" ON public.emergency_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
-- Note: Make sure to add these tables to Supabase Realtime publication:
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_responders;

-- ==============================================================================
-- SEED INITIAL EMERGENCY CODES & LOCATIONS
-- ==============================================================================
INSERT INTO public.emergency_codes (id, code_name, title, color_hex, bg_gradient, priority_level, tts_template, siren_pattern, description)
VALUES
    ('code_blue', 'Code Blue', 'Adult Cardiac / Respiratory Arrest', '#1d4ed8', 'from-blue-700 to-indigo-950', 1, 'Attention all personnel: Code Blue at {location}. Code Blue at {location}. Code team respond immediately.', 'hi_lo', 'Adult patient in cardiac or respiratory arrest requiring immediate CPR and resuscitation.'),
    ('code_baby_blue', 'Code Baby Blue', 'Infant / Pediatric Respiratory Arrest', '#0284c7', 'from-sky-500 to-blue-900', 1, 'Attention: Code Baby Blue at {location}. Pediatric resuscitation team deploy immediately.', 'hi_lo', 'Infant or child experiencing cardiac/respiratory distress or sudden arrest.'),
    ('code_pink', 'Code Pink', 'Infant / Child Abduction', '#ec4899', 'from-pink-600 to-rose-950', 1, 'Security Alert: Code Pink at {location}. Seal all exits and monitor all perimeter checkpoints immediately.', 'strobe_beep', 'Suspected infant or child abduction from pediatric/maternity ward.'),
    ('code_red', 'Code Red', 'Fire / Smoke Alert', '#dc2626', 'from-red-600 to-amber-950', 1, 'Attention: Code Red at {location}. Activate RACE protocol. Code Red at {location}.', 'wail', 'Fire, smoke, or fire alarm activation requiring immediate containment and evacuation prep.'),
    ('code_black', 'Code Black', 'Bomb Threat / Armed Intruder', '#18181b', 'from-zinc-800 to-black', 1, 'Security Alert: Code Black at {location}. Initiate emergency lockdown and security protocols.', 'pulse', 'Bomb threat, armed threat, or severe external security breach.'),
    ('code_white', 'Code White', 'Violent / Combative Individual', '#64748b', 'from-slate-600 to-zinc-900', 2, 'Attention: Code White at {location}. Security and de-escalation response required.', 'pulse', 'Aggressive or violent behavior posing danger to patients, visitors, or healthcare staff.'),
    ('code_orange', 'Code Orange', 'Mass Casualty Incident / Hazardous Spill', '#ea580c', 'from-orange-600 to-yellow-950', 2, 'Attention: Code Orange at {location}. Emergency Department prepare for incoming mass casualties.', 'wail', 'External mass casualty incident or chemical/biohazard spill requiring decontamination.')
ON CONFLICT (id) DO UPDATE SET 
    code_name = EXCLUDED.code_name,
    title = EXCLUDED.title,
    color_hex = EXCLUDED.color_hex,
    tts_template = EXCLUDED.tts_template;

INSERT INTO public.hospital_locations (building, floor, unit_ward, room_bed)
VALUES
    ('Main Hospital', '1st Floor', 'Emergency Room (ER)', 'Trauma Bay 1'),
    ('Main Hospital', '1st Floor', 'Emergency Room (ER)', 'Resuscitation Bay 2'),
    ('Main Hospital', '2nd Floor', 'Operating Theater (OT)', 'Operating Room 3'),
    ('Main Hospital', '3rd Floor', 'Intensive Care Unit (ICU)', 'Room 301 (Bed A)'),
    ('Main Hospital', '3rd Floor', 'Intensive Care Unit (ICU)', 'Room 304 (Bed B)'),
    ('Main Hospital', '3rd Floor', 'Cardiac Care Unit (CCU)', 'Room 312'),
    ('Main Hospital', '4th Floor', 'Pediatric Ward', 'Room 408 (Crib 2)'),
    ('Main Hospital', '4th Floor', 'Neonatal ICU (NICU)', 'NICU Isolette 04'),
    ('Main Hospital', '5th Floor', 'Maternity / OB-GYN', 'Delivery Room 2'),
    ('Annex Wing', '2nd Floor', 'General Medical Ward', 'Room 215 (Bed 1)'),
    ('Annex Wing', '3rd Floor', 'Surgical Recovery', 'Recovery Bay 6')
ON CONFLICT DO NOTHING;
