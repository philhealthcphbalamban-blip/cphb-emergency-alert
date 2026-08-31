'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Building, 
  RotateCcw,
  Search,
  Key,
  FileSpreadsheet,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Eye,
  Filter,
  Check,
  Building2,
  Ambulance,
  KeyRound
} from 'lucide-react';
import { HospitalStaff } from '@/types/staff';
import { StaffService, AdminAuthService, DEFAULT_CPHB_STAFF } from '@/lib/staffService';
import { BALAMBAN_BARANGAYS } from '@/types/rescue';
import * as XLSX from 'xlsx';

export default function AdminUsersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPinModalOpenForLogin, setIsPinModalOpenForLogin] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Excel Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<HospitalStaff[]>([]);
  const [importStatus, setImportStatus] = useState<string>('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<string>('MEDICAL SPECIALIST');
  const [formDept, setFormDept] = useState<string>('Medical Section');
  const [formEmpId, setFormEmpId] = useState('');
  const [formAccredNo, setFormAccredNo] = useState('');
  const [formPrcNo, setFormPrcNo] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formColor, setFormColor] = useState('#2563eb');
  const [formHospitalId, setFormHospitalId] = useState<string>('cphb');
  const [formPinCode, setFormPinCode] = useState<string>('');
  const [formAssignedBarangay, setFormAssignedBarangay] = useState<string>('');

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

    const checkAdminAuth = () => {
      const current = StaffService.getCurrentStaff();
      const isUnlocked = sessionStorage.getItem('cphb_admin_unlocked');
      // ONLY allow edit access if the active user is the Hospital Admin AND unlocked with PIN
      if (isUnlocked === 'true' && current?.is_admin) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (!current?.is_admin) {
          sessionStorage.removeItem('cphb_admin_unlocked');
        }
      }
    };

    checkAdminAuth();
    reloadStaff();

    // Fetch from Supabase Cloud on load (Crucial for Incognito & Mobile phones!)
    StaffService.fetchStaffFromCloud().then((cloudList) => {
      if (cloudList && cloudList.length > 0) {
        setStaffList(cloudList);
      }
    });

    const handler = () => {
      reloadStaff();
      checkAdminAuth();
    };
    const staffChangeHandler = () => {
      checkAdminAuth();
    };

    window.addEventListener('cphb_staff_directory_updated', handler);
    window.addEventListener('cphb_staff_changed', staffChangeHandler);
    return () => {
      window.removeEventListener('cphb_staff_directory_updated', handler);
      window.removeEventListener('cphb_staff_changed', staffChangeHandler);
    };
  }, []);

  // Compute all unique hospital departments dynamically from uploaded data
  const departmentsList = useMemo(() => {
    const counts: Record<string, number> = {};
    staffList.forEach(s => {
      const dept = s.department?.trim() || 'General Hospital Unit';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [staffList]);

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    const list = await StaffService.fetchStaffFromCloud();
    setStaffList(list);
    await AdminAuthService.fetchCloudPin();
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await AdminAuthService.verifyPinAsync(adminPin);
    if (isValid) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cphb_admin_unlocked', 'true');
      setIsPinModalOpenForLogin(false);
      setAdminPin('');
      setPinError('');
      // Set active staff to Hospital Admin
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
    const isValid = await AdminAuthService.verifyPinAsync(oldPin);
    if (!isValid) {
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
    setFormRole('MEDICAL SPECIALIST');
    setFormDept('Medical Section');
    setFormEmpId(`DOC${Math.floor(10000 + Math.random() * 90000)}`);
    setFormAccredNo('');
    setFormPrcNo('');
    setFormSpecialization('');
    setFormContact('Loc 101');
    setFormColor('#2563eb');
    setFormHospitalId('cphb');
    setFormPinCode('');
    setFormAssignedBarangay('');
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
    setFormHospitalId(staff.hospital_id || (staff.is_rescue ? 'balamban_rescue' : 'cphb'));
    setFormPinCode(staff.pin_code || '');
    setFormAssignedBarangay(staff.assigned_barangay || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAuthenticated) {
      setIsPinModalOpenForLogin(true);
      return;
    }
    if (confirm(`Sigurado ka nga tangtangon si ${name} gikan sa Ref_Personnel?`)) {
      StaffService.deleteStaffMember(id);
    }
  };

  // Excel File Upload Handler (Parses accurate Department & Designation from iHOMIS+)
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
            row['POSITION'] || row['Position'] || row['Position / Designation'] || row['DESIGNATION'] || row['Designation'] || row['ROLE'] || row['Role'] || 'Hospital Staff'
          ).trim();

          const rawDept = String(
            row['DEPARTMENT'] || row['Department'] || row['WARD'] || row['Ward'] || row['SECTION'] || row['Section'] || 'General Hospital Unit'
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

          // Accurate Doctor Detection (Only if ID starts with DOC, or Designation contains Physician/Medical Specialist)
          const empIdUpper = rawEmpId.toUpperCase();
          const nameUpper = rawName.toUpperCase();
          const roleUpper = rawRole.toUpperCase();

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
              roleUpper.includes('RN')
            );

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
            role: rawRole,
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

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    try {
      await StaffService.setBulkStaff(parsedRows);
      setIsImportOpen(false);
      setParsedRows([]);
      alert(`✓ Malampusong na-save sa Supabase Cloud ang ${parsedRows.length} ka personnel para sa tanang devices ug incognito!`);
    } catch (e) {
      alert('Error sa pag-save sa Cloud. Palihug sulayi pag-usab.');
    } finally {
      setIsImporting(false);
    }
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

    const isRescueFacility = formHospitalId === 'balamban_rescue';

    const payload: HospitalStaff = {
      id: editingId || `staff-${Date.now()}`,
      hospital_id: formHospitalId,
      name: formName,
      role: formRole,
      department: formDept,
      employee_id: formEmpId,
      pin_code: formPinCode.trim() || undefined,
      prc_license_no: formPrcNo || 'N/A',
      accreditation_no: formAccredNo || 'N/A',
      specialization: formSpecialization,
      contact_no: formContact,
      assigned_barangay: isRescueFacility ? formAssignedBarangay.trim() || undefined : undefined,
      avatar_initials: initials,
      color_hex: isRescueFacility ? '#dc2626' : formColor,
      is_doctor: isDoc,
      is_rescue: isRescueFacility,
      is_admin: isAdmin,
      can_trigger_code: true,
      can_respond_code: true,
      can_resolve_code: isDoc || isAdmin || isRescueFacility,
    };

    StaffService.saveStaffMember(payload);
    setIsFormOpen(false);
  };

  // Filter staff by live search, selected Department & Facility
  const filteredStaff = staffList.filter(s => {
    const q = searchQuery.toLowerCase();
    const accred = (s.accreditation_no || '').toLowerCase();
    const prc = (s.prc_license_no || '').toLowerCase();
    const pin = (s.pin_code || '').toLowerCase();
    const matchesQuery = 
      s.name.toLowerCase().includes(q) ||
      accred.includes(q) ||
      prc.includes(q) ||
      pin.includes(q) ||
      s.employee_id.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;

    const staffHosp = s.hospital_id || (s.is_rescue ? 'balamban_rescue' : 'cphb');
    const matchesFacility = selectedFacility === 'ALL' || staffHosp === selectedFacility;

    return matchesQuery && matchesDept && matchesFacility;
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
                : 'Directory View for Wards, Doctors & Staff • Admin PIN required to modify'
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
                onClick={() => {
                  if (confirm('Sigurado ka nga paphaon ang tanang gi-upload nga records aron makasugod sa limpyo nga listahan?')) {
                    StaffService.resetToDefaultStaff();
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 text-xs font-bold transition flex items-center justify-center space-x-1"
                title="Clear all records to start fresh"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Data</span>
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
      {/* FACILITY & DEPARTMENT FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        
        {/* Facility Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-bold border-b border-slate-100">
          <button
            onClick={() => setSelectedFacility('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedFacility === 'ALL' ? 'bg-slate-900 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Facilities ({staffList.length})
          </button>
          <button
            onClick={() => setSelectedFacility('cphb')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedFacility === 'cphb' ? 'bg-blue-600 text-white font-black shadow-xs' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            🏥 CPH Balamban ({staffList.filter(s => (s.hospital_id || 'cphb') === 'cphb' && !s.is_rescue).length})
          </button>
          <button
            onClick={() => setSelectedFacility('balamban_rescue')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1 ${
              selectedFacility === 'balamban_rescue' ? 'bg-red-600 text-white font-black shadow-xs' : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            <Ambulance className="h-3.5 w-3.5" />
            <span>MDRRMO Balamban Rescue 911 ({staffList.filter(s => s.is_rescue || s.hospital_id === 'balamban_rescue').length})</span>
          </button>
          <button
            onClick={() => setSelectedFacility('cphd')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedFacility === 'cphd' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            🏥 CPH Danao
          </button>
          <button
            onClick={() => setSelectedFacility('cphc')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedFacility === 'cphc' ? 'bg-purple-600 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            🏥 CPH Carcar
          </button>
          <button
            onClick={() => setSelectedFacility('cphbogo')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedFacility === 'cphbogo' ? 'bg-amber-600 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            🏥 CPH Bogo
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Live Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, PIN code, position, accreditation no., or employee ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="flex items-center space-x-1 text-xs font-black text-slate-700 shrink-0">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Section / Station:</span>
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="ALL">All Sections / Stations ({staffList.length})</option>
              {departmentsList.map(d => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.count})
                </option>
              ))}
            </select>

            {selectedDept !== 'ALL' && (
              <button
                onClick={() => setSelectedDept('ALL')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                title="Reset Department Filter"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 📱 MOBILE CARD VIEW (Phones) */}
      <div className="block sm:hidden space-y-2.5">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((staff) => {
            const isStaffRescue = staff.is_rescue || staff.hospital_id === 'balamban_rescue';

            return (
              <div key={staff.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                      style={{ backgroundColor: staff.color_hex }}
                    >
                      {isStaffRescue ? <Ambulance className="h-5 w-5" /> : staff.avatar_initials}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block leading-tight">{staff.name}</span>
                      <span className="text-[10px] text-blue-700 font-semibold">{staff.department}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    staff.is_admin ? 'bg-slate-900 text-white' :
                    isStaffRescue ? 'bg-red-100 text-red-800 border border-red-200' :
                    staff.is_doctor ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    staff.role.toLowerCase().includes('nurse') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}>
                    {staff.role}
                  </span>
                </div>

                {/* Facility & PIN Badges */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        isStaffRescue ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isStaffRescue ? '🚑 Balamban Rescue 911' : '🏥 CPH Balamban'}
                      </span>
                      {staff.pin_code && (
                        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                          PIN: {staff.pin_code}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mr-1 text-[10px]">
                        Accred: {staff.accreditation_no || 'N/A'}
                      </span>
                    </div>
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
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Walay records nga nakit-an sa napiling filter.
          </div>
        )}
      </div>

      {/* 🖥️ DESKTOP TABLE VIEW */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Personnel</th>
                <th className="py-3 px-3">Name & Title</th>
                <th className="py-3 px-3">Facility / Agency</th>
                <th className="py-3 px-3">Position / Role</th>
                <th className="py-3 px-3">Section / Unit</th>
                <th className="py-3 px-3">Login PIN</th>
                <th className="py-3 px-3">Accreditation / ID</th>
                {isAuthenticated && <th className="py-3 px-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  const isStaffRescue = staff.is_rescue || staff.hospital_id === 'balamban_rescue';

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition">
                      
                      {/* Avatar */}
                      <td className="py-3 px-4">
                        <div 
                          className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm"
                          style={{ backgroundColor: staff.color_hex }}
                        >
                          {isStaffRescue ? <Ambulance className="h-4 w-4" /> : staff.avatar_initials}
                        </div>
                      </td>

                      {/* Name & Specialization */}
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-900 text-xs block">{staff.name}</span>
                        {staff.specialization && (
                          <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{staff.specialization}</span>
                        )}
                      </td>

                      {/* Facility Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isStaffRescue ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}>
                          {isStaffRescue ? '🚑 Balamban Rescue' : '🏥 CPH Balamban'}
                        </span>
                      </td>

                      {/* Role / Position */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          staff.is_admin ? 'bg-slate-900 text-white' :
                          isStaffRescue ? 'bg-red-100 text-red-800 border border-red-200' :
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

                      {/* Login PIN */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {staff.pin_code ? (
                          <span className="font-mono font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                            PIN: {staff.pin_code}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No PIN</span>
                        )}
                      </td>

                      {/* Accreditation & Employee ID */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[11px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block">
                            Accred: {staff.accreditation_no || 'N/A'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 block">
                            ID: {staff.employee_id}
                          </span>
                        </div>
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    Walay records nga nakit-an sa napiling filter.
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
                  disabled={isImporting}
                  onClick={() => setIsImportOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleConfirmImport}
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-md transition flex items-center space-x-1.5"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Saving to Cloud...</span>
                    </>
                  ) : (
                    <span>Confirm & Save All</span>
                  )}
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
              {/* Assigned Facility Selector */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-slate-900 font-extrabold text-xs">
                  Assigned Facility / Operating Agency:
                </label>
                <select
                  value={formHospitalId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormHospitalId(val);
                    if (val === 'balamban_rescue') {
                      setFormDept('MDRRMO Balamban Command Center');
                      setFormRole('MDRRMO 911 Dispatcher');
                      setFormColor('#dc2626');
                    } else if (val === 'cphb') {
                      setFormDept('Medical Section');
                      setFormRole('MEDICAL SPECIALIST');
                      setFormColor('#2563eb');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="cphb">🏥 Cebu Provincial Hospital - Balamban (CPHB Hospital Wards)</option>
                  <option value="balamban_rescue">🚑 MDRRMO Balamban Rescue 911 (EOC & 28 Barangays)</option>
                  <option value="cphd">🏥 Cebu Provincial Hospital - Danao (CPHD)</option>
                  <option value="cphc">🏥 Cebu Provincial Hospital - Carcar (CPHC)</option>
                  <option value="cphbogo">🏥 Cebu Provincial Hospital - Bogo (CPHBOGO)</option>
                </select>
              </div>

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
                
                {/* 4-Digit Login PIN Code */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Quick Login PIN (4–6 Digits):</span>
                    <span className="text-purple-700 font-mono font-bold text-[10px]">Keypad Access</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={formPinCode}
                    onChange={(e) => setFormPinCode(e.target.value)}
                    placeholder="e.g. 9110, 9111, 2026, 1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Position / Role input with datalist */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Position / Designation:</label>
                  <input
                    type="text"
                    list="role-suggestions"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    required
                    placeholder="e.g. MDRRMO 911 Dispatcher / Staff Nurse"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="role-suggestions">
                    <option value="MDRRMO 911 Dispatcher" />
                    <option value="Rescue Team Lead" />
                    <option value="Ambulance EMT / Driver" />
                    <option value="Barangay PTV Driver" />
                    <option value="Barangay Health Worker (BHW)" />
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
                    <option value="Hospital Administrator" />
                  </datalist>
                </div>

                {/* Ward / Department input with datalist */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department / Unit / Station:</label>
                  <input
                    type="text"
                    list="dept-suggestions"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    required
                    placeholder="e.g. MDRRMO Balamban Command Center / Medical Section"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="dept-suggestions">
                    <option value="MDRRMO Balamban Command Center" />
                    <option value="Balamban Rescue 911 Station" />
                    <option value="Barangay Emergency Response (BERT)" />
                    <option value="Medical Section" />
                    <option value="Medical Social Service Unit" />
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
                    <option value="Hospital Administration / IT" />
                  </datalist>
                </div>

                {/* Assigned Barangay (If Rescue) */}
                {formHospitalId === 'balamban_rescue' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assigned Balamban Barangay:</label>
                    <select
                      value={formAssignedBarangay}
                      onChange={(e) => setFormAssignedBarangay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                    >
                      <option value="">EOC / All 28 Barangays</option>
                      {BALAMBAN_BARANGAYS.map((b) => (
                        <option key={b.name} value={b.name}>
                          Brgy. {b.name} ({b.zone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Accreditation / Badge No.:</label>
                  <input
                    type="text"
                    value={formAccredNo}
                    onChange={(e) => setFormAccredNo(e.target.value)}
                    placeholder="e.g. MDRRMO-BAL-01 / 0129845"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">PRC / LTO Driver License No.:</label>
                  <input
                    type="text"
                    value={formPrcNo}
                    onChange={(e) => setFormPrcNo(e.target.value)}
                    placeholder="e.g. 0128491 / LTO-PRO"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Employee / Station ID:</label>
                  <input
                    type="text"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    placeholder="e.g. MDRRMO-BAL-01 / DOC10093 / POC1000003"
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
                  placeholder="e.g. 28 Barangays Trauma Dispatch / Highway Ambulance Driver / ER Physician"
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
