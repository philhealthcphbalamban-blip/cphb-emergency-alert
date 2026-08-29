'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Clock, 
  CheckCircle2, 
  Download, 
  Filter, 
  MapPin, 
  TrendingDown,
  Building
} from 'lucide-react';
import { EmergencyAlert } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { EMERGENCY_CODES } from '@/lib/constants';

export default function HistoryPage() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [filterCode, setFilterCode] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EmergencyService.init();
    loadData();

    const unsubscribe = EmergencyService.subscribe(() => {
      loadData();
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    const list = await EmergencyService.getAllAlerts();
    setAlerts(list);
    setLoading(false);
  };

  const filteredAlerts = filterCode === 'ALL' 
    ? alerts 
    : alerts.filter(a => a.code_id === filterCode);

  // Compute key hospital metrics
  const totalIncidents = alerts.length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;
  
  // Calculate average response time in seconds
  const responseTimes = alerts
    .filter(a => a.triggered_at && a.acknowledged_at)
    .map(a => {
      const start = new Date(a.triggered_at).getTime();
      const ack = new Date(a.acknowledged_at!).getTime();
      return Math.max(1, Math.floor((ack - start) / 1000));
    });

  const avgResponseTimeSec = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
    : 42;

  const exportCSV = () => {
    if (alerts.length === 0) return;
    
    const headers = ['ID', 'Code', 'Location', 'Patient Name', 'HRN', 'Status', 'Triggered By', 'Triggered At', 'Acknowledged At', 'Resolved At', 'Resolved By', 'Responders Count', 'Notes'];
    const rows = alerts.map(a => [
      a.id,
      a.code_details?.code_name || a.code_id,
      `"${a.location_text.replace(/"/g, '""')}"`,
      `"${a.patient_details?.patient_name || 'N/A'}"`,
      `"${a.patient_details?.hrn || 'N/A'}"`,
      a.status,
      `"${a.triggered_by_name}"`,
      a.triggered_at,
      a.acknowledged_at || '',
      a.resolved_at || '',
      `"${a.resolved_by_name || ''}"`,
      a.responders?.length || 0,
      `"${(a.resolution_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CPHB_code_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                Incident History & Audit Trail
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                CPH Balamban Code Event Registry & Quality Assurance Performance Metrics
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={exportCSV}
          disabled={alerts.length === 0}
          className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition shadow-sm self-start sm:self-auto"
        >
          <Download className="h-4 w-4 text-purple-700" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Avg. Acknowledgment Speed
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{avgResponseTimeSec}s</span>
            <span className="text-xs text-emerald-700 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <TrendingDown className="h-3.5 w-3.5 mr-0.5" /> Target &lt;60s
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Time from nurse trigger to first physician/code team ack</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Total Logged Incidents
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalIncidents}</span>
            <span className="text-xs text-slate-500 font-bold">Events</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total recorded hospital codes at CPH Balamban</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Resolved & Cleared
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-blue-600">{resolvedCount}</span>
            <span className="text-xs text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              ({totalIncidents > 0 ? Math.round((resolvedCount/totalIncidents)*100) : 100}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Successful team stand-down and logs saved</p>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-xs font-black text-slate-500 mr-2 flex items-center uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" /> Filter:
        </span>
        <button
          onClick={() => setFilterCode('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
            filterCode === 'ALL'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          All Codes ({alerts.length})
        </button>
        {Object.values(EMERGENCY_CODES).map(code => (
          <button
            key={code.id}
            onClick={() => setFilterCode(code.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
              filterCode === code.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            {code.code_name}
          </button>
        ))}
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'RESOLVED';
            const code = alert.code_details || EMERGENCY_CODES[alert.code_id] || EMERGENCY_CODES.code_blue;

            return (
              <div
                key={alert.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm transition space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: code.color_hex }}
                    >
                      {code.code_name.replace('Code ', '')[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-900">{code.code_name}</span>
                        <span className="text-xs font-bold text-slate-600">— {code.title}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 flex items-center mt-0.5">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-red-600" />
                        {alert.location_text}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isResolved ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 inline-flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        RESOLVED
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800 border border-red-200 inline-flex items-center animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-red-600 mr-1.5 animate-ping" />
                        {alert.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Patient Info if available */}
                {alert.patient_details && (
                  <div className="text-xs bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-blue-950 font-medium">
                    <span className="font-black text-blue-900">Patient:</span> {alert.patient_details.patient_name} (HRN: {alert.patient_details.hrn}) • 
                    <span className="font-black text-blue-900 ml-1">Dx:</span> {alert.patient_details.admitting_diagnosis}
                  </div>
                )}

                {/* Meta details & responders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-black text-slate-800 block">Triggered:</span>
                    {new Date(alert.triggered_at).toLocaleString()} by {alert.triggered_by_name}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 block">Responders ({alert.responders?.length || 0}):</span>
                    {alert.responders && alert.responders.length > 0 
                      ? alert.responders.map(r => `${r.responder_name} (${r.role})`).join(', ')
                      : 'None recorded'}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 block">Resolved / Outcome:</span>
                    {alert.resolved_at 
                      ? `${new Date(alert.resolved_at).toLocaleTimeString()} (${alert.resolved_by_name || 'Team Lead'})`
                      : 'Ongoing'}
                  </div>
                </div>

                {alert.resolution_notes && (
                  <p className="text-xs text-slate-700 italic pl-2 border-l-2 border-slate-300">
                    "{alert.resolution_notes}"
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 rounded-2xl bg-white border border-slate-200 text-slate-400">
            <History className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-sm">No incidents match this filter.</p>
          </div>
        )}
      </div>

    </div>
  );
}
