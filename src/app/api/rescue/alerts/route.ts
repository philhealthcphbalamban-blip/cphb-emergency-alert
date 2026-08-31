import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CommunityEmergencyAlert, CommunityEmergencyType, BALAMBAN_BARANGAYS, COMMUNITY_EMERGENCY_DEFS } from '@/types/rescue';

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

// In-Memory Cloud Sync Store for Rescue Dispatches
let inMemoryRescueAlerts: CommunityEmergencyAlert[] = [];

// GET /api/rescue/alerts -> Returns all active & recent rescue alerts
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // 1. Fetch from Supabase emergency_alerts where hospital_id = 'balamban_rescue'
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('hospital_id', 'balamban_rescue')
        .order('triggered_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const fromDb: CommunityEmergencyAlert[] = data.map((d: any) => {
          if (d.patient_details?.rescue_alert) {
            return d.patient_details.rescue_alert;
          }
          return {
            id: d.id,
            emergency_type: (d.code_id as CommunityEmergencyType) || 'CODE_TRAUMA',
            barangay_name: d.patient_details?.barangay_name || d.location_text.split(' - ')[0] || 'Balamban Poblacion',
            sitio_or_landmark: d.patient_details?.sitio_or_landmark || d.location_text.split(' - ')[1] || d.location_text,
            patient_condition: d.patient_details?.patient_condition || 'Emergency Response Dispatch',
            caller_name: d.triggered_by_name || 'MDRRMO 911 Dispatcher',
            caller_phone: d.patient_details?.caller_phone || '0918-911-0001',
            status: d.status === 'ACTIVE' || d.status === 'RESPONDING' ? 'DISPATCHED' : (d.status as any),
            dispatched_at: d.triggered_at,
            resolved_at: d.resolved_at || undefined,
            responding_units: d.patient_details?.responding_units || [],
            destination_facility: d.patient_details?.destination_facility || 'Cebu Provincial Hospital - Balamban (CPHB ER)',
            triage_notes: d.resolution_notes || d.patient_details?.triage_notes || '',
          };
        });

        // Merge with memory alerts
        const mergedMap = new Map<string, CommunityEmergencyAlert>();
        fromDb.forEach(a => mergedMap.set(a.id, a));
        inMemoryRescueAlerts.forEach(a => mergedMap.set(a.id, a));
        inMemoryRescueAlerts = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.dispatched_at).getTime() - new Date(a.dispatched_at).getTime()
        );

        return NextResponse.json({
          success: true,
          alerts: inMemoryRescueAlerts,
          activeCount: inMemoryRescueAlerts.filter(a => a.status !== 'RESOLVED').length,
        });
      }
    } catch (dbErr) {
      console.warn('Supabase rescue alert query warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      alerts: inMemoryRescueAlerts,
      activeCount: inMemoryRescueAlerts.filter(a => a.status !== 'RESOLVED').length,
    });
  } catch (err: any) {
    console.error('Error in GET /api/rescue/alerts:', err);
    return NextResponse.json({ success: true, alerts: inMemoryRescueAlerts });
  }
}

// POST /api/rescue/alerts -> Dispatches or updates rescue alerts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'DISPATCH'; // 'DISPATCH' | 'UPDATE_STATUS'
    const supabase = getSupabase();

    if (action === 'DISPATCH') {
      const alert: CommunityEmergencyAlert = body.alert;
      if (!alert) {
        return NextResponse.json({ success: false, error: 'Missing alert payload' }, { status: 400 });
      }

      // Add to server memory
      inMemoryRescueAlerts = [alert, ...inMemoryRescueAlerts.filter(a => a.id !== alert.id)];

      // Persist to Supabase emergency_alerts table
      try {
        await supabase.from('emergency_alerts').upsert({
          id: alert.id,
          hospital_id: 'balamban_rescue',
          code_id: alert.emergency_type,
          location_text: `Brgy. ${alert.barangay_name} - ${alert.sitio_or_landmark}`,
          status: 'ACTIVE',
          triggered_by_name: alert.caller_name || 'MDRRMO 911 Dispatcher',
          triggered_by_role: '911 Dispatcher',
          triggered_at: alert.dispatched_at || new Date().toISOString(),
          patient_details: {
            rescue_alert: alert,
            barangay_name: alert.barangay_name,
            sitio_or_landmark: alert.sitio_or_landmark,
            patient_condition: alert.patient_condition,
            caller_phone: alert.caller_phone,
            responding_units: alert.responding_units,
            destination_facility: alert.destination_facility,
            triage_notes: alert.triage_notes,
          },
        });
      } catch (dbErr) {
        console.warn('Supabase rescue alert insert warning:', dbErr);
      }

      return NextResponse.json({ success: true, alert });
    }

    if (action === 'UPDATE_STATUS') {
      const { alertId, status, notes } = body;
      const resolvedAt = status === 'RESOLVED' ? new Date().toISOString() : undefined;

      inMemoryRescueAlerts = inMemoryRescueAlerts.map(a => {
        if (a.id === alertId) {
          return {
            ...a,
            status,
            triage_notes: notes || a.triage_notes,
            resolved_at: resolvedAt || a.resolved_at,
          };
        }
        return a;
      });

      try {
        await supabase
          .from('emergency_alerts')
          .update({
            status: status === 'RESOLVED' ? 'RESOLVED' : 'ACTIVE',
            resolved_at: resolvedAt,
            resolution_notes: notes,
            patient_details: {
              ...(inMemoryRescueAlerts.find(a => a.id === alertId) || {}),
              rescue_alert: inMemoryRescueAlerts.find(a => a.id === alertId),
            },
          })
          .eq('id', alertId);
      } catch (dbErr) {
        console.warn('Supabase rescue alert status update warning:', dbErr);
      }

      return NextResponse.json({ success: true, alertId, status });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/rescue/alerts:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
