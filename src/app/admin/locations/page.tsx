'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Layers,
  MapPin,
  Save,
  X
} from 'lucide-react';
import { HospitalLocation } from '@/types/emergency';
import { HospitalService } from '@/lib/hospitalService';
import { AdminAuthService, StaffService } from '@/lib/staffService';
import { audioEngine } from '@/lib/audioEngine';

export default function AdminLocationsPage() {
  const [activeHospital, setActiveHospital] = useState(HospitalService.getActiveHospital());
  const [locations, setLocations] = useState<HospitalLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  
  // Admin PIN Auth
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<HospitalLocation | null>(null);
  const [formBuilding, setFormBuilding] = useState('Main Complex');
  const [formFloor, setFormFloor] = useState('Ground Floor');
  const [formWard, setFormWard] = useState('');
  const [formRoomBed, setFormRoomBed] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const loadLocations = () => {
    const list = HospitalService.getLocationsForHospital(activeHospital.id);
    setLocations(list);
  };

  useEffect(() => {
    loadLocations();

    const currentStaff = StaffService.getCurrentStaff();
    if (currentStaff && currentStaff.is_admin) {
      setIsAdminUnlocked(true);
    }

    const handleHospChange = (e: any) => {
      if (e.detail) {
        setActiveHospital(e.detail);
      }
    };

    const handleLocationsChange = (e: any) => {
      if (e.detail && e.detail.hospitalId === activeHospital.id) {
        setLocations(e.detail.locations);
      }
    };

    window.addEventListener('cph_hospital_changed', handleHospChange);
    window.addEventListener('cph_locations_updated', handleLocationsChange);

    return () => {
      window.removeEventListener('cph_hospital_changed', handleHospChange);
      window.removeEventListener('cph_locations_updated', handleLocationsChange);
    };
  }, [activeHospital.id]);

  const handleVerifyPin = () => {
    if (AdminAuthService.verifyPin(pinInput)) {
      setIsAdminUnlocked(true);
      setPinError('');
      audioEngine.playChime();
    } else {
      setPinError('Invalid Admin Security PIN. Default is 1234.');
    }
  };

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setFormBuilding('Main Complex');
    setFormFloor('Ground Floor');
    setFormWard('');
    setFormRoomBed('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: HospitalLocation) => {
    setEditingLocation(loc);
    setFormBuilding(loc.building || 'Main Complex');
    setFormFloor(loc.floor);
    setFormWard(loc.unit_ward);
    setFormRoomBed(loc.room_bed);
    setIsModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWard.trim() || !formRoomBed.trim()) {
      alert('Please provide both a Ward Name and a Room / Bed designation.');
      return;
    }

    if (editingLocation) {
      // Update
      const updatedLoc: HospitalLocation = {
        ...editingLocation,
        building: formBuilding.trim(),
        floor: formFloor.trim(),
        unit_ward: formWard.trim(),
        room_bed: formRoomBed.trim(),
      };
      await HospitalService.updateLocation(activeHospital.id, updatedLoc);
      setSaveSuccessMessage(`Updated "${formWard} — ${formRoomBed}" successfully!`);
    } else {
      // Add
      await HospitalService.addLocation(activeHospital.id, {
        building: formBuilding.trim(),
        floor: formFloor.trim(),
        unit_ward: formWard.trim(),
        room_bed: formRoomBed.trim(),
        hospital_id: activeHospital.id,
      });
      setSaveSuccessMessage(`Added new location "${formWard} — ${formRoomBed}"!`);
    }

    loadLocations();
    setIsModalOpen(false);
    audioEngine.playChime();
    setTimeout(() => setSaveSuccessMessage(''), 3500);
  };

  const handleDeleteLocation = async (loc: HospitalLocation) => {
    if (confirm(`Are you sure you want to remove "${loc.unit_ward} — ${loc.room_bed}"?`)) {
      await HospitalService.deleteLocation(activeHospital.id, loc.id);
      loadLocations();
      setSaveSuccessMessage(`Location "${loc.room_bed}" removed.`);
      setTimeout(() => setSaveSuccessMessage(''), 3500);
    }
  };

  const handleResetToDefault = async () => {
    if (confirm(`Reset all ${activeHospital.name} locations back to the Official iHOMIS 58 Locations template? Custom entries will be restored to default.`)) {
      const defaults = await HospitalService.resetToDefaultLocations(activeHospital.id);
      setLocations(defaults);
      audioEngine.playChime();
      setSaveSuccessMessage(`Restored ${defaults.length} default hospital locations!`);
      setTimeout(() => setSaveSuccessMessage(''), 3500);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch = 
      loc.unit_ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.room_bed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.floor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFloor = selectedFloor === 'ALL' || loc.floor.toLowerCase().includes(selectedFloor.toLowerCase());

    return matchesSearch && matchesFloor;
  });

  const uniqueWards = Array.from(new Set(locations.map(l => l.unit_ward)));

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/users"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Back to Admin"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Hospital Wards & Bed Locations
              </h1>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800 border border-blue-200">
                {activeHospital.shortName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add, edit, rename, and organize emergency dispatch locations without modifying code.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdminUnlocked ? (
            <>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Ward / Room</span>
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center space-x-1.5"
                title="Reset to official 58 iHOMIS locations"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Defaults</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200">
              <Lock className="h-4 w-4 text-amber-600" />
              <input
                type="password"
                placeholder="Admin PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 w-24 focus:outline-none"
              />
              <button
                onClick={handleVerifyPin}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black"
              >
                Unlock
              </button>
            </div>
          )}
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center space-x-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {pinError && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {pinError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Locations</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{locations.length}</p>
          <span className="text-[10px] text-blue-600 font-bold">Monitored Dispatch Points</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Wards & Units</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{uniqueWards.length}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Categorized Sections</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Ground Floor</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {locations.filter(l => l.floor === 'Ground Floor').length}
          </p>
          <span className="text-[10px] text-purple-600 font-bold">ER & Triage Areas</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">2nd & 3rd Floors</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {locations.filter(l => l.floor.includes('2nd') || l.floor.includes('Second') || l.floor.includes('3rd') || l.floor.includes('Third')).length}
          </p>
          <span className="text-[10px] text-amber-600 font-bold">ICU, NICU & Inpatient Wards</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ward name, bed, or floor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { label: 'All Floors', key: 'ALL' },
            { label: 'Ground Floor', key: 'Ground' },
            { label: '2nd Floor', key: 'Second' },
            { label: '3rd Floor', key: 'Third' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSelectedFloor(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap border ${
                selectedFloor === f.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Locations Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Floor / Building</th>
                <th className="py-3.5 px-4">Ward / Unit Name</th>
                <th className="py-3.5 px-4">Specific Room / Bed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{loc.floor}</span>
                    <span className="text-[10px] text-slate-400 block">{loc.building || 'Main Complex'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      {loc.unit_ward}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-black text-slate-800 text-xs flex items-center">
                      <MapPin className="h-3 w-3 text-red-500 mr-1.5 shrink-0" />
                      {loc.room_bed}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isAdminUnlocked ? (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(loc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition"
                          title="Edit Location"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 transition"
                          title="Delete Location"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold italic">Unlock PIN to edit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLocations.length === 0 && (
          <div className="text-center py-12 px-4 text-slate-500">
            <Building className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-xs">No matching ward locations found.</p>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingLocation ? 'Edit Ward / Bed Location' : 'Add New Hospital Location'}
                  </h3>
                  <p className="text-xs text-slate-500">{activeHospital.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Building / Complex:</label>
                <input
                  type="text"
                  value={formBuilding}
                  onChange={(e) => setFormBuilding(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Main Complex / Annex Building"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Floor Level:</label>
                <select
                  value={formFloor}
                  onChange={(e) => setFormFloor(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Ground Floor">Ground Floor (ER, Triage, OPD)</option>
                  <option value="Second Floor">Second Floor (ICU, Surgery, OB)</option>
                  <option value="Third Floor">Third Floor (Pedia, Wards 4-12)</option>
                  <option value="Basement">Basement / Ancillary</option>
                  <option value="Outdoor / Complex Grounds">Outdoor / Complex Grounds</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ward / Unit Name:</label>
                <input
                  type="text"
                  value={formWard}
                  onChange={(e) => setFormWard(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. EMERGENCY WARD, ICU WARD, WARD 4 (MED)"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Specific Room / Bed Designation:</label>
                <input
                  type="text"
                  value={formRoomBed}
                  onChange={(e) => setFormRoomBed(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. ER Trauma Bay 1, Bed 04, Room 302"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingLocation ? 'Save Changes' : 'Create Location'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
