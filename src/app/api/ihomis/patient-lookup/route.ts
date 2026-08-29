import { NextRequest, NextResponse } from 'next/server';
import { IHOMISService, IHOMIS_CONFIG } from '@/lib/ihomisService';
import { IHOMISSourceModule } from '@/types/ihomis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const hrn = searchParams.get('hrn');
  const moduleParam = searchParams.get('module') as IHOMISSourceModule | null;

  try {
    if (hrn) {
      const patient = IHOMISService.findPatientByHRN(hrn);
      return NextResponse.json({
        success: true,
        source: 'iHOMIS_PLUS_LIVE',
        endpoint: IHOMIS_CONFIG.baseUrl,
        data: patient,
      });
    }

    if (location) {
      const patient = IHOMISService.findPatientByLocation(location);
      return NextResponse.json({
        success: true,
        source: 'iHOMIS_PLUS_LIVE',
        endpoint: IHOMIS_CONFIG.baseUrl,
        data: patient,
      });
    }

    // Default: Return all or by module
    const list = IHOMISService.getPatientsByModule(moduleParam || undefined);
    return NextResponse.json({
      success: true,
      count: list.length,
      config: IHOMIS_CONFIG,
      data: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed connecting to iHOMIS Plus' },
      { status: 500 }
    );
  }
}
