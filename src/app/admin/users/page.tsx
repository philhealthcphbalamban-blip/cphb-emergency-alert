'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Stethoscope, 
  Building, 
  Phone, 
  Check, 
  RotateCcw,
  Search,
  Key,
  Award,
  AlertCircle
} from 'lucide-react';
import { HospitalStaff, StaffRole, HospitalDepartment } from '@/types/staff';
import { StaffService } from '@/lib/staffService';

export default function AdminUsersPage() {
  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'DOCTORS' | 'NURSES' | 'ADMIN'>('ALL');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('Staff Nurse');
  const [formDept, setFormDept] = useState<HospitalDepartment>('Emergency Department (ER)');
  const [formEmpId, setFormEmpId] = useState('');
  const [formPrcLic, setFormPrcLic] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formColor, setFormColor] = useState('#2563eb');

  const reloadStaff = () => {
    setStaffList(StaffService.getAllStaff());
  };

  useEffect(() => {
    reloadStaff();
    const handler = () => reloadStaff();
    window.addEventListener('cphb_staff_directory_updated', handler);
    return () => window.removeEventListener('cphb_staff_directory_updated', handler);
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormRole('Staff Nurse');
    setFormDept('Emergency Department (ER)');
    setFormEmpId(`CPHB-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormPrcLic('');
    setFormSpecialization('');
    setFormContact('Loc 101');
    setFormColor('#2563eb');
    setIsFormOpen(true);
  };

  const handleEdit = (staff: HospitalStaff) => {
    setEditingId(staff.id);
    setFormName(staff.name);
    setFormRole(staff.role);
    setFormDept(staff.department);
    setFormEmpId(staff.employee_id);
    setFormPrcLic(staff.prc_license_no);
    setFormSpecialization(staff.specialization || '');
    setFormContact(staff.contact_no || '');
    setFormColor(staff.color_hex);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Sigurado ka nga tangtangon si ${name} gikan sa Ref_Personnel?`)) {
      StaffService.deleteStaffMember(id);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrcLic) {
      alert('Palihug isulod ang Ngalan ug PRC License Number!');
      return;
    }

    const isDoc = formRole === 'Physician' || formRole === 'Resident Physician' || formRole === 'Anesthesiologist';
    const isAdmin = formRole === 'Hospital Administrator';

    const initials = formName
      .split(' ')
      .filter(w => !w.includes('Dr.') && !w.includes('Nurse') && !w.includes('MD') && !w.includes('RN'))
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase() || 'ST';

    const payload: HospitalStaff = {
      id: editingId || `staff-${Date.now()}`,
      name: formName,
      role: formRole,
      department: formDept,
      employee_id: formEmpId,
      prc_license_no: formPrcLic,
      specialization: formSpecialization,
      contact_no: formContact,
      avatar_initials: initials,
      color_hex: formColor,
      is_doctor: isDoc,
      is_admin: isAdmin,
      can_trigger_code: true,
      can_respond_code: true,
      can_resolve_code: isDoc || isAdmin,
    };

    StaffService.saveStaffMember(payload);
    setIsFormOpen(false);
  };

  const filteredStaff = staffList.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      s.name.toLowerCase().includes(q) ||
      s.prc_license_no.toLowerCase().includes(q) ||
      s.employee_id.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q);

    if (filterRole === 'DOCTORS') return matchesQuery && s.is_doctor;
    if (filterRole === 'NURSES') return matchesQuery && !s.is_doctor && !s.is_admin;
    if (filterRole === 'ADMIN') return matchesQuery && s.is_admin;
    return matchesQuery;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-md">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900">Hospital Admin & Personnel Management</h1>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-black">
                CPHB IT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Doctor & Nurse Accounts • Synced with iHOMIS+ Ref_Personnel & PRC License Registry
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center space-x-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, PRC License, or Ward..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterRole === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({staffList.length})
          </button>
          <button
            onClick={() => setFilterRole('DOCTORS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterRole === 'DOCTORS' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Doctors ({StaffService.getDoctors().length})
          </button>
          <button
            onClick={() => setFilterRole('NURSES')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterRole === 'NURSES' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nurses ({StaffService.getNurses().length})
          </button>
        </div>
      </div>

      {/* Staff Personnel Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Employee / Avatar</th>
                <th className="py-3 px-3">Name & Title</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department / Ward</th>
                <th className="py-3 px-3">PRC License No</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/60 transition">
                  
                  {/* Avatar */}
                  <td className="py-3 px-4">
                    <div 
                      className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm"
                      style={{ backgroundColor: staff.color_hex }}
                    >
                      {staff.avatar_initials}
                    </div>
                  </td>

                  {/* Name & Specialization */}
                  <td className="py-3 px-3">
                    <span className="font-extrabold text-slate-900 text-xs block">{staff.name}</span>
                    {staff.specialization && (
                      <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{staff.specialization}</span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      staff.is_admin ? 'bg-slate-900 text-white' :
                      staff.is_doctor ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {staff.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-3 text-xs font-semibold text-slate-700">
                    {staff.department}
                  </td>

                  {/* PRC License */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {staff.prc_license_no}
                    </span>
                  </td>

                  {/* Employee ID */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-500 text-xs font-bold">
                    {staff.employee_id}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition"
                        title="Edit Employee"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(staff.id, staff.name)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 transition"
                        title="Remove Employee"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-black text-slate-900">
                {editingId ? 'Edit Hospital Personnel' : 'Add New Hospital Personnel'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name & Title (e.g. Dr. Juan Dela Cruz, MD o Nurse Maria, RN):</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="e.g. Dr. Juan Dela Cruz, MD"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Medical Role:</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Physician">Physician / Attending (MD)</option>
                    <option value="Resident Physician">Resident Physician</option>
                    <option value="Staff Nurse">Staff Nurse (RN)</option>
                    <option value="Head Nurse">Head Nurse</option>
                    <option value="Charge Nurse">Charge Nurse</option>
                    <option value="Anesthesiologist">Anesthesiologist</option>
                    <option value="Respiratory Therapist">Respiratory Therapist</option>
                    <option value="Security Officer">Security Officer</option>
                    <option value="Hospital Administrator">Hospital Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">PRC License No:</label>
                  <input
                    type="text"
                    value={formPrcLic}
                    onChange={(e) => setFormPrcLic(e.target.value)}
                    required
                    placeholder="e.g. 0129845"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ward / Station:</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Emergency Department (ER)">Emergency Department (ER)</option>
                    <option value="ICU NEW ROOM">ICU NEW ROOM</option>
                    <option value="MEDICAL WARD (WARD 4)">MEDICAL WARD (WARD 4)</option>
                    <option value="WARD 5 (OB-GYN)">WARD 5 (OB-GYN)</option>
                    <option value="WARD 6 (Nursery / Pedia)">WARD 6 (Nursery / Pedia)</option>
                    <option value="WARD 7 (Surgical)">WARD 7 (Surgical)</option>
                    <option value="WARD 10 (Isolation)">WARD 10 (Isolation)</option>
                    <option value="Outpatient Clinic (OPD)">Outpatient Clinic (OPD)</option>
                    <option value="Hospital Administration / IT">Hospital Administration / IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Employee ID:</label>
                  <input
                    type="text"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    placeholder="e.g. CPHB-MD-0129"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Specialization / Scope:</label>
                <input
                  type="text"
                  value={formSpecialization}
                  onChange={(e) => setFormSpecialization(e.target.value)}
                  placeholder="e.g. Adult Cardiology / Emergency Resuscitation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider shadow-md transition"
                >
                  Save Personnel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
