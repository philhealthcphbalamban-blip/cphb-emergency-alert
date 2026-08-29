'use client';

import React from 'react';
import { Building2, Check, X, ShieldAlert, MapPin } from 'lucide-react';
import { HospitalInfo } from '@/types/hospital';
import { HospitalService } from '@/lib/hospitalService';

interface HospitalSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHospital: HospitalInfo;
  onSelectHospital: (hospital: HospitalInfo) => void;
}

export const HospitalSwitchModal: React.FC<HospitalSwitchModalProps> = ({
  isOpen,
  onClose,
  currentHospital,
  onSelectHospital,
}) => {
  if (!isOpen) return null;

  const hospitals = HospitalService.getAllHospitals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wide">
                Select Active Hospital
              </h2>
              <p className="text-xs text-blue-100">
                Cebu Provincial Health Rapid Emergency Alert Network
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-500 font-medium">
            Emergency codes, sirens, voice alerts, and responders will be <strong>100% isolated</strong> to your selected hospital:
          </p>

          <div className="space-y-2.5">
            {hospitals.map((hosp) => {
              const isSelected = hosp.id === currentHospital.id;

              return (
                <button
                  key={hosp.id}
                  type="button"
                  onClick={() => {
                    onSelectHospital(hosp);
                    onClose();
                  }}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 shadow-md ring-4 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: hosp.colorHex }}
                    >
                      {hosp.code.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {hosp.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {hosp.municipality} • {hosp.classification}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        Capacity: {hosp.bedCapacity} Monitored Beds
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="p-1.5 rounded-full bg-blue-600 text-white shrink-0">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Targeted Emergency Siren Isolation Active</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
