'use client';

import React from 'react';
import { IHOMISPatient } from '@/types/ihomis';
import { 
  Building, 
  ExternalLink, 
  Heart, 
  AlertOctagon, 
  Stethoscope, 
  Droplet, 
  Clock, 
  User, 
  Calendar,
  ShieldAlert
} from 'lucide-react';

interface IHOMISPatientCardProps {
  patient: IHOMISPatient;
  compact?: boolean;
  onSelect?: () => void;
}

export const IHOMISPatientCard: React.FC<IHOMISPatientCardProps> = ({
  patient,
  compact = false,
  onSelect
}) => {
  const isDNR = patient.code_status === 'DNR';
  const hasAllergies = patient.allergies && patient.allergies.length > 0 && !patient.allergies[0].includes('NKDA') && !patient.allergies[0].includes('None');

  const sourceBadgeColor = 
    patient.source_module === 'ADMISSION' ? 'bg-blue-100 text-blue-800 border-blue-200' :
    patient.source_module === 'EMERGENCY' ? 'bg-red-100 text-red-800 border-red-200' :
    'bg-amber-100 text-amber-800 border-amber-200';

  const sourceLabel = 
    patient.source_module === 'ADMISSION' ? 'iHOMIS Admission' :
    patient.source_module === 'EMERGENCY' ? 'iHOMIS Emergency' :
    'iHOMIS Outpatient';

  if (compact) {
    return (
      <div 
        onClick={onSelect}
        className={`p-3.5 rounded-xl border bg-white text-left transition-all shadow-sm ${
          onSelect ? 'cursor-pointer hover:border-blue-500 hover:shadow-md' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${sourceBadgeColor}`}>
              {sourceLabel}
            </span>
            <span className="text-xs font-black text-slate-900 truncate max-w-[200px]">
              {patient.patient_name}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {patient.gender} • {patient.age}y
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-700 mt-1.5 line-clamp-1">
          {patient.admitting_diagnosis}
        </p>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>Bed: <strong className="text-slate-800">{patient.room_bed}</strong></span>
          <span>HRN: <strong className="text-slate-800 font-mono">{patient.hrn}</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-5 text-slate-900 shadow-md space-y-3.5">
      
      {/* Header with Source Badge & Direct Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Building className="h-4 w-4" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${sourceBadgeColor}`}>
              {sourceLabel} (LIVE)
            </span>
            <span className="text-xs font-mono text-slate-500">
              HRN: <strong className="text-slate-900 font-bold">{patient.hrn}</strong>
            </span>
          </div>
        </div>

        <a
          href={patient.ihomis_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
        >
          <span>Open in iHOMIS Plus</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Patient Name & Demographics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Admitted Patient:
          </span>
          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {patient.patient_name}
          </h4>
          <p className="text-xs font-semibold text-slate-600">
            {patient.gender} • {patient.age} y/o • Ward: <strong className="text-slate-800">{patient.ward_name} ({patient.room_bed})</strong>
          </p>
        </div>

        {/* Code Status Badge */}
        <div className="self-start sm:self-auto">
          {isDNR ? (
            <div className="px-3 py-1.5 rounded-xl bg-red-100 border border-red-300 text-red-800 font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
              <AlertOctagon className="h-4 w-4 text-red-600" />
              <span>DNR (DO NOT RESUSCITATE)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
              <Heart className="h-3.5 w-3.5 text-emerald-600" />
              <span>FULL CODE (CPR ACTIVE)</span>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Details (Diagnosis & Attending MD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Admission Diagnosis:
          </span>
          <p className="font-bold text-slate-900 mt-0.5 leading-snug">
            {patient.admitting_diagnosis}
          </p>
          {patient.chief_complaint && (
            <p className="text-[11px] text-slate-500 mt-1 italic">
              "{patient.chief_complaint}"
            </p>
          )}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Attending Physician & Date:
          </span>
          <p className="font-bold text-blue-800 mt-0.5 flex items-center">
            <Stethoscope className="h-3.5 w-3.5 text-blue-600 mr-1.5 shrink-0" />
            {patient.attending_physician}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center">
            <Calendar className="h-3 w-3 mr-1 text-slate-400" />
            Admitted: {patient.admission_date} at {patient.admission_time}
          </p>
        </div>
      </div>

      {/* Clinical Alert Chips (Allergies, Blood Type, Risk) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {hasAllergies ? (
          <div className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] font-black flex items-center space-x-1 shadow-sm">
            <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
            <span>ALLERGIES: {patient.allergies.join(', ')}</span>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold">
            NKDA (No Known Drug Allergies)
          </div>
        )}

        {patient.blood_type && (
          <div className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-black flex items-center space-x-1">
            <Droplet className="h-3.5 w-3.5 text-red-600" />
            <span>Blood: {patient.blood_type}</span>
          </div>
        )}

        <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
          Fall Risk: <strong className={patient.fall_risk === 'HIGH' ? 'text-red-700 font-extrabold' : 'text-slate-800'}>{patient.fall_risk}</strong>
        </div>
      </div>

    </div>
  );
};
