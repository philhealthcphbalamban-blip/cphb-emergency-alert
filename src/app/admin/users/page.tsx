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
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { HospitalStaff, StaffRole, HospitalDepartment } from '@/types/staff';
import { StaffService, AdminAuthService, DEFAULT_CPHB_STAFF } from '@/lib/staffService';
import * as XLSX from 'xlsx';

export default function AdminUsersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPinModalOpenForLogin, setIsPinModalOpenForLogin] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'DOCTORS' | 'NURSES' | 'ADMIN'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Excel Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<HospitalStaff[]>([]);
  const [importStatus, setImportStatus] = useState<string>('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<string>('Physician');
  const [formDept, setFormDept] = useState<string>('Medical Section');
  const [formEmpId, setFormEmpId] = useState('');
  const [formAccredNo, setFormAccredNo] = useState('');
  const [formPrcNo, setFormPrcNo] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formColor, setFormColor] = useState('#2563eb');

  // Change PIN State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const reloadStaff = () => {
    setStaffList(StaffService.getAllStaff());
  };

  useEffect(() => {
    StaffService.initCloudSync();

    const isUnlocked = sessionStorage.getItem('cphb_admin_unlocked');
    if (isUnlocked === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    reloadStaff();

    StaffService.fetchStaffFromCloud().then((cloudList) => {
      if (cloudList && cloudList.length > 0) {
        setStaffList(cloudList);
      }
    });

    const handler = () => reloadStaff();
    window.addEventListener('cphb_staff_directory_updated', handler);
    return () => {
      window.removeEventListener('cphb_staff_directory_updated', handler);
    };
  }, []);

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    const list = await StaffService.fetchStaffFromCloud();
    setStaffList(list);
    await AdminAuthService.fetchCloudPin();
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (AdminAuthService.verifyPin(adminPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cphb_admin_unlocked', 'true');
      setIsPinModalOpenForLogin(false);
      setAdminPin('');
      setPinError('');
      const adminStaff = StaffService.getAllStaff().find(s => s.is_admin) || DEFAULT_CPHB_STAFF[0];
      if (adminStaff) {
        StaffService.setCurrentStaff(adminStaff);
      }
    } else {
      setPinError('Sayop ang Admin PIN!');
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!AdminAuthService.verifyPin(oldPin)) {
      setPinChangeMsg({ text: 'Sayop ang kasamtangang (Current) PIN!', isError: true });
      return;
    }
    if (newPin.length < 4) {
      setPinChangeMsg({ text: 'Ang Bag-ong PIN kinahanglan labing menos 4 ka characters!', isError: true });
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg({ text: 'Dili parehas ang Bag-ong PIN ug Confirm PIN!', isError: true });
      return;
    }

    await AdminAuthService.setPin(newPin);
    setPinChangeMsg({ text: '✓ Malampusong na-usab ug na-sync sa Cloud ang imong Admin PIN!', isError: false });
    setTimeout(() => {
      setIsPinModalOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setPinChangeMsg(null);
    }, 1500);
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    setAdminPin('');
    sessionStorage.removeItem('cphb_admin_unlocked');
    const otherStaff = StaffService.getAllStaff().find(s => !s.is_admin) || StaffService.getAllStaff()[0];
    if (otherStaff) {
      StaffService.setCurrentStaff(otherStaff);
    }
  };

  const handleOpenAdd = () => {
    if (!isAuthenticated) return;
    setEditingId(null);
    setFormName('');
    setFormRole('Physician');
    setFormDept('Medical Section');
    setFormEmpId(`DOC${Math.floor(10000 + Math.random() * 90000)}`);
    setFormAccredNo('');
    setFormPrcNo('');
    setFormSpecialization('');
    setFormContact('Loc 101');
    setFormColor('#2563eb');
    setIsFormOpen(true);
  };

  const handleEdit = (staff: HospitalStaff) => {
    if (!isAuthenticated) {
      setIsPinModalOpenForLogin(true);
      return;
    }
    setEditingId(staff.id);
    setFormName(staff.name);
    setFormRole(staff.role);
    setFormDept(staff.department);
    setFormEmpId(staff.employee_id);
    setFormAccredNo(staff.accreditation_no || '');
    setFormPrcNo(staff.prc_license_no || '');
    setFormSpecialization(staff.specialization || '');
    setFormContact(staff.contact_no || '');
    setFormColor(staff.color_hex);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAuthenticated) {
      setIsPinModalOpenForLogin(true);
      return;
    }
    if (confirm(`Sigurado ka nga tangtangon si ${name} gikan sa Ref_Personnel?`)) {
      StaffService.deleteStaffMember(id);
    }
  };

  // Excel File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setIsPinModalOpenForLogin(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setImportStatus('Walay sulod ang Excel file!');
          return;
        }

        const mapped: HospitalStaff[] = rawJson.map((row, idx) => {
          const rawName = String(
            row['EMPLOYEE_NAME'] || row['Employee Name'] || row['NAME'] || row['Name'] || row['Personnel Name'] || row['Personnel'] || row['Doctor Name'] || `Staff ${idx + 1}`
          ).trim();

          const rawEmpId = String(
            row['EMPLOYEE_ID'] || row['Employee ID'] || row['ID'] || row['Emp ID'] || `CPHB-${1000 + idx}`
          ).trim();

          const rawRole = String(
            row['POSITION'] || row['Position'] || row['Position / Designation'] || row['DESIGNATION'] || row['Designation'] || row['ROLE'] || row['Role'] || ''
          ).trim();

          const rawDept = String(
            row['DEPARTMENT'] || row['Department'] || row['WARD'] || row['Ward'] || row['SECTION'] || row['Section'] || 'Medical Section'
          ).trim();

          const rawAccred = String(
            row['ACCREDITATION NO.'] || 
            row['ACCREDITATION NO'] || 
            row['ACCREDITATION'] || 
            row['Accreditation No.'] || 
            row['Accreditation No'] || 
            row['Accreditation'] || 
            row['ACCRED'] || 
            row['Accred'] || 
            row['PAN'] || 
            row['PRC'] || 
            row['PRC NO'] || 
            row['PRC_NO'] || 
            row['License'] || 
            'N/A'
          ).trim();

          const rawPrc = String(
            row['PRC'] || row['PRC NO'] || row['PRC_NO'] || row['PRC_LICENSE'] || row['License'] || 'N/A'
          ).trim();

          const rawSpec = String(
            row['SPECIALIZATION'] || row['Specialization'] || row['Scope'] || ''
          ).trim();

          const rawContact = String(
            row['CONTACT'] || row['Contact'] || row['Phone'] || 'Local Desk'
          ).trim();

          // Precise Role Determination
          const empIdUpper = rawEmpId.toUpperCase();
          const nameUpper = rawName.toUpperCase();
          const roleUpper = rawRole.toUpperCase();
          const deptUpper = rawDept.toUpperCase();

          const isDoc = 
            empIdUpper.startsWith('DOC') ||
            nameUpper.startsWith('DR.') || 
            nameUpper.startsWith('DR ') || 
            nameUpper.includes(' MD') || 
            roleUpper.includes('DOCTOR') || 
            roleUpper.includes('PHYSICIAN') || 
            roleUpper.includes('MEDICAL SPECIALIST') ||
            roleUpper.includes('MEDICAL OFFICER') ||
            roleUpper.includes('RESIDENT') ||
            roleUpper.includes('CONSULTANT');

          const isNurse = 
            !isDoc && (
              roleUpper.includes('NURSE') || 
              roleUpper.includes('NURSING') || 
              roleUpper.includes('RN') ||
              deptUpper === 'NURSING SECTION' ||
              deptUpper === 'NURSING'
            );

          const finalRole = rawRole || (isDoc ? 'Physician' : isNurse ? 'Staff Nurse' : 'Hospital Staff');

          const initials = rawName
            .replace(/Dr\.|MD|RN|Nurse|,|Mr\.|Ms\.|Mrs\./gi, '')
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase() || (isDoc ? 'MD' : isNurse ? 'RN' : 'ST');

          const colorHex = isDoc ? '#2563eb' : isNurse ? '#059669' : '#475569';

          return {
            id: `staff-excel-${Date.now()}-${idx}`,
            name: rawName,
            role: finalRole,
            department: rawDept,
            employee_id: rawEmpId,
            prc_license_no: rawPrc !== rawAccred ? rawPrc : 'N/A',
            accreditation_no: rawAccred,
            specialization: rawSpec,
            contact_no: rawContact,
            avatar_initials: initials,
            color_hex: colorHex,
            is_doctor: isDoc,
            is_admin: false,
            can_trigger_code: true,
            can_respond_code: true,
            can_resolve_code: isDoc,
          };
        });

        setParsedRows(mapped);
        setImportStatus(`Na-read ang ${mapped.length} ka personnel gikan sa Excel!`);
        setIsImportOpen(true);
      } catch (err) {
        setImportStatus('Error sa pagbasa sa Excel file. Siguroha nga valid .xlsx o .csv file!');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    StaffService.setBulkStaff(parsedRows);
    setIsImportOpen(false);
    setParsedRows([]);
    alert(`Success! Na-import ug na-save sa Supabase Cloud ang ${parsedRows.length} ka personnel para sa tanang devices!`);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      alert('Palihug isulod ang Ngalan!');
      return;
    }

    const empIdUpper = formEmpId.toUpperCase();
    const nameUpper = formName.toUpperCase();
    const roleUpper = formRole.toUpperCase();

    const isDoc = 
      empIdUpper.startsWith('DOC') ||
      nameUpper.startsWith('DR.') || 
      nameUpper.startsWith('DR ') || 
      nameUpper.includes(' MD') || 
      roleUpper.includes('DOCTOR') || 
      roleUpper.includes('PHYSICIAN') || 
      roleUpper.includes('MEDICAL SPECIALIST') ||
      roleUpper.includes('MEDICAL OFFICER');

    const isAdmin = formRole.toLowerCase().includes('admin');

    const initials = formName
      .replace(/Dr\.|MD|RN|Nurse|,|Mr\.|Ms\.|Mrs\./gi, '')
      .trim()
      .split(' ')
      .filter(Boolean)
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
      prc_license_no: formPrcNo || 'N/A',
      accreditation_no: formAccredNo || 'N/A',
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
    const accred = (s.accreditation_no || '').toLowerCase();
    const prc = (s.prc_license_no || '').toLowerCase();
    const matchesQuery = 
      s.name.toLowerCase().includes(q) ||
      accred.includes(q) ||
      prc.includes(q) ||
      s.employee_id.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q);

    if (filterRole === 'DOCTORS') return matchesQuery && s.is_doctor;
    if (filterRole === 'NURSES') return matchesQuery && !s.is_doctor && !s.is_admin;
    if (filterRole === 'ADMIN') return matchesQuery && s.is_admin;
    return matchesQuery;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 sm:space-x-3.5">
          <div className={`p-2.5 sm:p-3 rounded-2xl text-white shadow-md shrink-0 ${
            isAuthenticated ? 'bg-slate-900' : 'bg-blue-600'
          }`}>
            {isAuthenticated ? (
              <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-400" />
            ) : (
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {isAuthenticated ? 'Hospital Admin & Personnel Management' : 'Hospital Personnel & Staff Directory'}
              </h1>
              {isAuthenticated ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-black flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                  Admin Unlocked
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-mono text-[10px] font-black flex items-center">
                  <Eye className="h-3 w-3 mr-1 text-slate-500" />
                  Staff View (Read-Only)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAuthenticated 
                ? 'Full Admin Access: Upload Excel, Add/Edit Employees & PIN Security'
                : 'Directory View for Wards, Doctors & Nurses • Admin PIN required to modify'
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* ONLY SHOWN WHEN UNLOCKED AS ADMIN */}
          {isAuthenticated ? (
            <>
              {/* Hidden File Input for Excel */}
              <label className="py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Upload Excel File (.xlsx / .csv)</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>

              <button
                onClick={handleOpenAdd}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Add Employee</span>
              </button>

              <button
                onClick={() => {
                  setOldPin('');
                  setNewPin('');
                  setConfirmPin('');
                  setPinChangeMsg(null);
                  setIsPinModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-1.5"
                title="Change Admin Security PIN"
              >
                <Key className="h-4 w-4" />
                <span>Change PIN</span>
              </button>

              <button
                onClick={handleManualCloudSync}
                disabled={isSyncing}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center space-x-1"
                title="Sync with Cloud"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>

              <button
                onClick={handleLogoutAdmin}
                className="py-2.5 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1"
                title="Lock Admin Control"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Lock Admin 🔒</span>
              </button>
            </>
          ) : (
            /* SHOWN WHEN NOT LOGGED IN AS ADMIN (DOCTORS & NURSES) */
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setAdminPin('');
                  setPinError('');
                  setIsPinModalOpenForLogin(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center space-x-2"
              >
                <Lock className="h-4 w-4 text-amber-400" />
                <span>Admin Login 🔒</span>
              </button>

              <button
                onClick={handleManualCloudSync}
                disabled={isSyncing}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1"
                title="Refresh Cloud Roster"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, Accreditation, PRC, or Department..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition ${
              filterRole === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({staffList.length})
          </button>
          <button
            onClick={() => setFilterRole('DOCTORS')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition ${
              filterRole === 'DOCTORS' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Doctors ({StaffService.getDoctors().length})
          </button>
          <button
            onClick={() => setFilterRole('NURSES')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition ${
              filterRole === 'NURSES' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nurses ({StaffService.getNurses().length})
          </button>
        </div>
      </div>

      {/* 📱 MOBILE CARD VIEW (Phones) */}
      <div className="block sm:hidden space-y-2.5">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((staff) => (
            <div key={staff.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                    style={{ backgroundColor: staff.color_hex }}
                  >
                    {staff.avatar_initials}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block leading-tight">{staff.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{staff.department}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                  staff.is_admin ? 'bg-slate-900 text-white' :
                  staff.is_doctor ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {staff.role}
                </span>
              </div>

              {/* Numbers & Badges */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mr-1">
                    Accred: {staff.accreditation_no || 'N/A'}
                  </span>
                  {staff.prc_license_no && staff.prc_license_no !== 'N/A' && (
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      PRC: {staff.prc_license_no}
                    </span>
                  )}
                </div>

                {/* Edit & Delete ONLY SHOWN WHEN UNLOCKED */}
                {isAuthenticated && (
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleEdit(staff)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition"
                      title="Edit Employee"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.name)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-700 transition"
                      title="Delete Employee"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Walay employee records nga nakit-an.
          </div>
        )}
      </div>

      {/* 🖥️ DESKTOP TABLE VIEW */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Employee / Avatar</th>
                <th className="py-3 px-3">Name & Title</th>
                <th className="py-3 px-3">Position / Designation</th>
                <th className="py-3 px-3">Department / Unit</th>
                <th className="py-3 px-3">Accreditation / PRC No</th>
                <th className="py-3 px-3">Employee ID</th>
                {isAuthenticated && <th className="py-3 px-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
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

                    {/* Role / Position */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        staff.is_admin ? 'bg-slate-900 text-white' :
                        staff.is_doctor ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        staff.role.toLowerCase().includes('nurse') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {staff.role}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 text-xs font-semibold text-slate-700">
                      {staff.department}
                    </td>

                    {/* Accreditation & PRC No */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[11px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block">
                          Accred: {staff.accreditation_no || 'N/A'}
                        </span>
                        {staff.prc_license_no && staff.prc_license_no !== 'N/A' && (
                          <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200 block">
                            PRC: {staff.prc_license_no}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-500 text-xs font-bold">
                      {staff.employee_id}
                    </td>

                    {/* Actions: ONLY WHEN UNLOCKED AS ADMIN */}
                    {isAuthenticated && (
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
                    )}

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAuthenticated ? 7 : 6} className="py-12 text-center text-slate-400 font-semibold">
                    Walay employee records nga nakit-an.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN LOGIN PIN POPUP MODAL */}
      {isPinModalOpenForLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
            <div className="h-16 w-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Lock className="h-8 w-8 text-amber-400" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">Administrator Access Lock</h2>
              <p className="text-xs text-slate-500 mt-1">
                Isulod ang Admin PIN aron ma-unlock ang Upload Excel, Add, Edit, ug Delete tools.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Admin PIN:
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Enter Security PIN"
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-center tracking-widest focus:outline-none focus:border-blue-600 focus:bg-white"
                  autoFocus
                />
              </div>

              {pinError && (
                <p className="text-xs font-bold text-red-600 text-center bg-red-50 py-2 rounded-lg border border-red-200">
                  {pinError}
                </p>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsPinModalOpenForLogin(false);
                    setAdminPin('');
                    setPinError('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <Unlock className="h-4 w-4 text-emerald-400" />
                  <span>Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT PREVIEW MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Excel Personnel Import Preview ({parsedRows.length} Employees)
                </h3>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 text-xs">
              <p className="text-slate-500 font-semibold mb-2">
                Palihug i-review ang mga na-extract nga Personnel data, Position, ug Department gikan sa imong Excel file:
              </p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {parsedRows.slice(0, 15).map((row, i) => (
                  <div key={i} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-xs">{row.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          row.is_doctor ? 'bg-blue-100 text-blue-800' :
                          row.role.toLowerCase().includes('nurse') ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {row.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{row.department} • ID: {row.employee_id}</span>
                    </div>
                    <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      ACCRED: {row.accreditation_no || row.prc_license_no}
                    </span>
                  </div>
                ))}
              </div>
              {parsedRows.length > 15 && (
                <p className="text-center text-slate-400 text-xs mt-2">
                  ... ug {parsedRows.length - 15} pa ka dugang employees
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">
                ✓ Ready to import {parsedRows.length} personnel into CPHB system
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-md transition"
                >
                  Confirm & Save All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ADMIN PIN MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Change Admin Security PIN</h3>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Current (Kasamtangang) PIN:</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  required
                  placeholder="Enter current PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">New (Bag-ong) Security PIN / Password:</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  required
                  placeholder="Min 4 characters (e.g. 5678)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New PIN:</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  required
                  placeholder="Re-type new PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {pinChangeMsg && (
                <div className={`p-2.5 rounded-xl font-bold text-center ${
                  pinChangeMsg.isError 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {pinChangeMsg.text}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wider shadow-md transition"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            
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
                <label className="block text-slate-700 font-bold mb-1">Full Name & Title (e.g. MR. ISABELO B. CARATAO IV o MS. JILLIAN ISABEL COMPLETO LAPE):</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="e.g. MR. ISABELO B. CARATAO IV"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Position / Role input with datalist */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Position / Designation:</label>
                  <input
                    type="text"
                    list="role-suggestions"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    required
                    placeholder="e.g. MEDICAL SPECIALIST / SOCIAL WELFARE OFFICER I"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="role-suggestions">
                    <option value="MEDICAL SPECIALIST" />
                    <option value="MEDICAL OFFICER III" />
                    <option value="MEDICAL OFFICER IV" />
                    <option value="Physician / Doctor (MD)" />
                    <option value="Resident Physician" />
                    <option value="NURSE I" />
                    <option value="NURSE II" />
                    <option value="Staff Nurse (RN)" />
                    <option value="Head Nurse" />
                    <option value="MIDWIFE I" />
                    <option value="MIDWIFE II" />
                    <option value="MEDICAL TECHNOLOGIST I" />
                    <option value="PHARMACIST I" />
                    <option value="SOCIAL WELFARE OFFICER I" />
                    <option value="ADMINISTRATIVE OFFICER" />
                    <option value="ADMINISTRATIVE AIDE" />
                    <option value="LAB AIDE" />
                    <option value="CLERK" />
                    <option value="Hospital Administrator" />
                  </datalist>
                </div>

                {/* Ward / Department input with datalist */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department / Unit / Ward:</label>
                  <input
                    type="text"
                    list="dept-suggestions"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    required
                    placeholder="e.g. Medical Social Service Unit / Medical Section"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="dept-suggestions">
                    <option value="Medical Section" />
                    <option value="Medical Social Service Unit" />
                    <option value="Admin and Info Unit" />
                    <option value="Emergency Department (ER)" />
                    <option value="ICU NEW ROOM" />
                    <option value="MEDICAL WARD (WARD 4)" />
                    <option value="WARD 5 (OB-GYN)" />
                    <option value="WARD 6 (Nursery / Pedia)" />
                    <option value="WARD 7 (Surgical)" />
                    <option value="WARD 10 (Isolation)" />
                    <option value="Outpatient Clinic (OPD)" />
                    <option value="Pharmacy" />
                    <option value="Laboratory" />
                    <option value="Billing / Claims Section" />
                    <option value="Cashier Section" />
                    <option value="Radiology / X-Ray" />
                    <option value="Dental Clinic" />
                    <option value="Dietary / Nutrition" />
                    <option value="Hospital Administration / IT" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Accreditation No.:</label>
                  <input
                    type="text"
                    value={formAccredNo}
                    onChange={(e) => setFormAccredNo(e.target.value)}
                    placeholder="e.g. 0129845 / PHIC ACC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">PRC License No. (Manual Entry):</label>
                  <input
                    type="text"
                    value={formPrcNo}
                    onChange={(e) => setFormPrcNo(e.target.value)}
                    placeholder="e.g. 0128491"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Employee ID (e.g. DOC10093 o POC1000003):</label>
                  <input
                    type="text"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    placeholder="e.g. DOC10093 / POC1000003"
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
                  placeholder="e.g. Attending Physician / Emergency Resuscitation / Social Work Services"
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
