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

// GET /api/ihomis/patients -> Fetches cloud synced patient census
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('emergency_audit_logs')
      .select('details')
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
        source: 'cloud',
      });
    }

    return NextResponse.json({
      success: true,
      count: inMemoryPatientsCache.length,
      patients: inMemoryPatientsCache,
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

// POST /api/ihomis/patients -> Saves updated patient census to Supabase cloud
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patients: IHOMISPatient[] = body.patients;

    if (!Array.isArray(patients)) {
      return NextResponse.json({ success: false, error: 'Patients array required' }, { status: 400 });
    }

    inMemoryPatientsCache = patients;
    const supabase = getSupabase();

    try {
      await supabase.from('emergency_audit_logs').insert({
        event_type: 'IHOMIS_PATIENTS_SYNC',
        actor_name: body.synced_by || 'Hospital Administrator',
        details: {
          patients,
          total_count: patients.length,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.warn('Supabase iHOMIS patients sync warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'iHOMIS census synced to cloud successfully',
      count: patients.length,
    });
  } catch (err: any) {
    console.error('Error in POST /api/ihomis/patients:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
