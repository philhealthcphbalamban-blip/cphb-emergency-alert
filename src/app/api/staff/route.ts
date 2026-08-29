import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HospitalStaff } from '@/types/staff';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vptgxwbsyccgamcuunya.supabase.co';
const supabaseUrl = rawUrl.includes('vptgxwbysyccgamcuunya')
  ? 'https://vptgxwbsyccgamcuunya.supabase.co'
  : (rawUrl || 'https://vptgxwbsyccgamcuunya.supabase.co');

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdGd4d2JzeWNjZ2FtY3V1bnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjYxMDAsImV4cCI6MjEwMzU0MjEwMH0.tj58oXqpJy-MT5AhZtmpigk7dWFwdTiDEs8R9QWj3FY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// In-memory server fallback cache
let inMemoryStaffCache: HospitalStaff[] | null = null;
let inMemoryPinCache: string = '1234';

export async function GET() {
  try {
    // 1. Fetch latest Staff Roster
    const { data: staffData } = await supabase
      .from('emergency_audit_logs')
      .select('details')
      .eq('event_type', 'STAFF_DIRECTORY_SYNC')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Fetch latest Admin Security PIN
    const { data: pinData } = await supabase
      .from('emergency_audit_logs')
      .select('details')
      .eq('event_type', 'ADMIN_PIN_SYNC')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cloudStaff = staffData?.details?.staff_list || inMemoryStaffCache || [];
    const cloudPin = pinData?.details?.pin || inMemoryPinCache || '1234';

    if (cloudStaff.length > 0) inMemoryStaffCache = cloudStaff;
    if (cloudPin) inMemoryPinCache = cloudPin;

    return NextResponse.json({
      success: true,
      count: cloudStaff.length,
      staff: cloudStaff,
      admin_pin: cloudPin,
    });
  } catch (err: any) {
    console.error('Error fetching from /api/staff:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      staff: inMemoryStaffCache || [],
      admin_pin: inMemoryPinCache,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Case 1: Updating Staff Directory
    if (body.staff && Array.isArray(body.staff)) {
      inMemoryStaffCache = body.staff;
      await supabase.from('emergency_audit_logs').insert({
        event_type: 'STAFF_DIRECTORY_SYNC',
        actor_name: 'Hospital Administrator',
        details: {
          staff_list: body.staff,
          synced_at: new Date().toISOString(),
          total_count: body.staff.length,
        },
      });
    }

    // Case 2: Updating Admin Security PIN
    if (body.pin && typeof body.pin === 'string') {
      const cleanPin = body.pin.trim();
      inMemoryPinCache = cleanPin;
      await supabase.from('emergency_audit_logs').insert({
        event_type: 'ADMIN_PIN_SYNC',
        actor_name: 'Hospital Administrator',
        details: {
          pin: cleanPin,
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cloud sync successful',
      count: inMemoryStaffCache?.length || 0,
      admin_pin: inMemoryPinCache,
    });
  } catch (err: any) {
    console.error('Error in /api/staff POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
