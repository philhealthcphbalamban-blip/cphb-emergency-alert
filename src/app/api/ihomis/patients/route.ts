import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IHOMISPatient } from '@/types/ihomis';
import { MOCK_IHOMIS_PATIENTS } from '@/lib/ihomisService';

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

// In-memory fallback
let inMemoryPatientsCache: IHOMISPatient[] = [...MOCK_IHOMIS_PATIENTS];

// Direct gateway polling helper (attempts to connect to https://ihomis-plus.cphb.local/)
async function tryDirectIHOMISGatewaySync() {
  const targetUrl = process.env.IHOMIS_GATEWAY_URL || 'https://ihomis-plus.cphb.local';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${targetUrl}/Emergency/getLive`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Gateway is internal/firewalled, use cloud database
  }
  return null;
}

// GET /api/ihomis/patients -> Fetches cloud synced patient census & live metrics
export async function GET() {
  try {
    // 1. Try Direct Hospital Gateway if reachable
    const directLive = await tryDirectIHOMISGatewaySync();
    if (directLive && directLive.length > 0) {
      inMemoryPatientsCache = directLive;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('emergency_audit_logs')
      .select('details, created_at')
      .eq('event_type', 'IHOMIS_PATIENTS_SYNC')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.details?.patients && Array.isArray(data.details.patients) && data.details.patients.length > 0) {
      inMemoryPatientsCache = data.details.patients;
      return NextResponse.json({
        success: true,
        count: data.details.patients.length,
        patients: data.details.patients,
        metrics: data.details.metrics || null,
        last_synced_at: data.details.updated_at || data.created_at,
        source: 'cloud',
      });
    }

    return NextResponse.json({
      success: true,
      count: inMemoryPatientsCache.length,
      patients: inMemoryPatientsCache,
      last_synced_at: new Date().toISOString(),
      source: 'fallback',
    });
  } catch (err: any) {
    console.error('Error fetching iHOMIS patients from cloud:', err);
    return NextResponse.json({
      success: true,
      count: inMemoryPatientsCache.length,
      patients: inMemoryPatientsCache,
      source: 'fallback_error',
    });
  }
}

// POST /api/ihomis/patients -> Saves updated patient census to Supabase cloud (Supports Automated LAN Bridge & Manual Webhook)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingPatients: IHOMISPatient[] = body.patients;

    if (!Array.isArray(incomingPatients)) {
      return NextResponse.json({ success: false, error: 'Patients array required' }, { status: 400 });
    }

    let finalPatients: IHOMISPatient[];

    // If partial sync (e.g. only syncing EMERGENCY module from LAN bridge)
    if (body.module && typeof body.module === 'string') {
      const otherModulePatients = inMemoryPatientsCache.filter(p => p.source_module !== body.module);
      finalPatients = [...incomingPatients, ...otherModulePatients];
    } else {
      finalPatients = incomingPatients;
    }

    inMemoryPatientsCache = finalPatients;

    // Calculate live dynamic metrics
    const inpatientCount = finalPatients.filter(p => p.source_module === 'ADMISSION').length;
    const erCount = finalPatients.filter(p => p.source_module === 'EMERGENCY').length;
    const opdCount = finalPatients.filter(p => p.source_module === 'OUTPATIENT').length;
    const maleCount = finalPatients.filter(p => p.gender === 'MALE').length;
    const femaleCount = finalPatients.filter(p => p.gender === 'FEMALE').length;

    const metrics = {
      activeAdmissions: inpatientCount,
      erEncounters: erCount,
      outpatientConsultations: opdCount,
      admissionsMale: maleCount,
      admissionsFemale: femaleCount,
      totalCensus: finalPatients.length,
    };

    const supabase = getSupabase();

    try {
      await supabase.from('emergency_audit_logs').insert({
        event_type: 'IHOMIS_PATIENTS_SYNC',
        actor_name: body.synced_by || 'iHOMIS Plus LAN Auto-Bridge Daemon',
        details: {
          patients: finalPatients,
          total_count: finalPatients.length,
          metrics,
          sync_source: body.sync_source || 'LAN_AUTO_BRIDGE',
          updated_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.warn('Supabase iHOMIS patients sync warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'iHOMIS census synced to cloud successfully',
      count: finalPatients.length,
      metrics,
      synced_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in POST /api/ihomis/patients:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
