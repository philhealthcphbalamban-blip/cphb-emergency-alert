import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmergencyAlert, AlertResponder, CodeId, AlertStatus } from '@/types/emergency';
import { EMERGENCY_CODES } from '@/lib/constants';
import { IHOMISService } from '@/lib/ihomisService';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vptgxwbsyccgamcuunya.supabase.co';
  const supabaseUrl = rawUrl.includes('vptgxwbysyccgamcuunya')
    ? 'https://vptgxwbsyccgamcuunya.supabase.co'
    : (rawUrl || 'https://vptgxwbsyccgamcuunya.supabase.co');

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdGd4d2JzeWNjZ2FtY3V1bnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjYxMDAsImV4cCI6MjEwMzU0MjEwMH0.tj58oXqpJy-MT5AhZtmpigk7dWFwdTiDEs8R9QWj3FY';

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// In-memory fallback
let inMemoryActiveAlert: EmergencyAlert | null = null;

// GET /api/emergency/alerts -> Returns active alert and recent alerts
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*, responders:alert_responders(*)')
      .in('status', ['ACTIVE', 'RESPONDING'])
      .order('triggered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('GET /api/emergency/alerts fallback from Supabase error:', error);
      return NextResponse.json({
        success: true,
        activeAlert: inMemoryActiveAlert,
        fallback: true,
      });
    }

    let activeAlert: EmergencyAlert | null = null;
    if (data) {
      const patient = data.patient_details || IHOMISService.findPatientByLocation(data.location_text);
      activeAlert = {
        ...data,
        code_details: EMERGENCY_CODES[data.code_id] || EMERGENCY_CODES.code_blue,
        patient_details: patient,
      };
      inMemoryActiveAlert = activeAlert;
    } else {
      inMemoryActiveAlert = null;
    }

    return NextResponse.json({
      success: true,
      activeAlert,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in GET /api/emergency/alerts:', err);
    return NextResponse.json({ success: true, activeAlert: inMemoryActiveAlert, fallback: true });
  }
}

// POST /api/emergency/alerts -> Triggers a new emergency code or resolves an existing code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'TRIGGER'; // 'TRIGGER' | 'RESOLVE' | 'RESPOND'
    const supabase = getSupabase();

    if (action === 'TRIGGER') {
      const alertUuid = generateUUID();
      const patient = body.patient_details || IHOMISService.findPatientByLocation(body.location_text);

      const newAlertRecord = {
        id: alertUuid,
        code_id: body.code_id || 'code_blue',
        location_text: body.location_text || 'Emergency Department (ER)',
        status: 'ACTIVE' as AlertStatus,
        triggered_by_name: body.triggered_by_name || 'Hospital Staff',
        triggered_by_role: body.triggered_by_role || 'Staff',
        triggered_at: new Date().toISOString(),
        patient_id_optional: patient?.hrn || null,
        patient_details: patient || null,
      };

      const formattedAlert: EmergencyAlert = {
        ...newAlertRecord,
        code_details: EMERGENCY_CODES[newAlertRecord.code_id] || EMERGENCY_CODES.code_blue,
        responders: [],
      };
      inMemoryActiveAlert = formattedAlert;

      try {
        const { data, error } = await supabase
          .from('emergency_alerts')
          .insert(newAlertRecord)
          .select()
          .single();

        if (!error && data) {
          formattedAlert.id = data.id;
        }
      } catch (dbErr) {
        console.warn('Supabase DB insert warning (fallback used):', dbErr);
      }

      return NextResponse.json({ success: true, alert: formattedAlert });
    }

    if (action === 'RESOLVE') {
      inMemoryActiveAlert = null;
      const resolvedAt = new Date().toISOString();

      try {
        let query = supabase.from('emergency_alerts').update({
          status: 'RESOLVED',
          resolved_at: resolvedAt,
          resolved_by_name: body.resolved_by_name || 'Hospital Admin',
          resolution_notes: body.resolution_notes || 'Resolved via Command Center',
        });

        if (body.alert_id && body.alert_id !== 'any') {
          query = query.eq('id', body.alert_id);
        } else {
          query = query.in('status', ['ACTIVE', 'RESPONDING']);
        }

        await query;

        await supabase.from('emergency_audit_logs').insert({
          event_type: 'RESOLVED',
          actor_name: body.resolved_by_name || 'Hospital Admin',
          details: { notes: body.resolution_notes, resolved_at: resolvedAt },
        });
      } catch (dbErr) {
        console.warn('Supabase resolve warning (fallback used):', dbErr);
      }

      return NextResponse.json({ success: true, message: 'Alert resolved successfully' });
    }

    if (action === 'RESPOND') {
      const responderUuid = generateUUID();
      const newResponder = {
        id: responderUuid,
        alert_id: body.alert_id,
        responder_name: body.responder_name || 'Responder Staff',
        role: body.role || 'Staff',
        eta_minutes: body.eta_minutes || 2,
        status: 'EN_ROUTE',
        responded_at: new Date().toISOString(),
      };

      if (inMemoryActiveAlert) {
        inMemoryActiveAlert.status = 'RESPONDING';
        inMemoryActiveAlert.responders = [...(inMemoryActiveAlert.responders || []), newResponder as any];
      }

      try {
        await supabase.from('alert_responders').insert(newResponder);
        await supabase
          .from('emergency_alerts')
          .update({ status: 'RESPONDING', acknowledged_at: new Date().toISOString() })
          .eq('id', body.alert_id);
      } catch (dbErr) {
        console.warn('Supabase responder insert warning (fallback used):', dbErr);
      }

      return NextResponse.json({ success: true, responder: newResponder });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/emergency/alerts:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
